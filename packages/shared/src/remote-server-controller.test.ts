import { describe, expect, it, vi } from 'vitest';
import { createRemoteServerController } from './remote-server-controller';
import type {
  RemoteServerControllerAdapters,
  RemoteServerControllerConfigLike,
  RemoteServerConfigStore,
  RemoteServerDiagnostics,
  RemoteServerRouteContext,
  RemoteServerRouteRegistrar,
} from './remote-server-controller-contracts';

type TestConfig = RemoteServerControllerConfigLike;
type TestServer = { id: string };
type TestRequest = { id: string };
type TestReply = { id: string };

function createHarness(configOverrides: Partial<TestConfig> = {}) {
  let config: TestConfig = {
    remoteServerEnabled: true,
    remoteServerApiKey: 'api-key',
    remoteServerBindAddress: '0.0.0.0',
    remoteServerPort: 4321,
    remoteServerLogLevel: 'debug',
    remoteServerCorsOrigins: ['https://app.example'],
    ...configOverrides,
  };
  const server = { id: 'server' };
  let requestHook: ((request: TestRequest, reply: TestReply) => Promise<void> | void) | undefined;
  let responseHook: ((request: TestRequest, reply: TestReply) => Promise<void> | void) | undefined;

  const configStore: RemoteServerConfigStore<TestConfig> = {
    get: vi.fn(() => config),
    save: vi.fn((nextConfig) => {
      config = nextConfig;
    }),
  };

  const diagnosticsService: RemoteServerDiagnostics = {
    logInfo: vi.fn(),
    logWarning: vi.fn(),
    logError: vi.fn(),
  };

  const registerRoutes: RemoteServerRouteRegistrar<TestServer, TestReply> = vi.fn();

  const adapters: RemoteServerControllerAdapters<TestRequest, TestReply, TestConfig, TestServer> = {
    createHttpServer: vi.fn(async () => server),
    addRequestHook: vi.fn((_server, handler) => {
      requestHook = handler;
    }),
    addResponseHook: vi.fn((_server, handler) => {
      responseHook = handler;
    }),
    listenHttpServer: vi.fn(async () => undefined),
    closeHttpServer: vi.fn(async () => undefined),
    authorizeRequest: vi.fn(() => ({ ok: true })),
    generateApiKey: vi.fn(() => 'generated-api-key'),
    resolveApiKeyReference: vi.fn((value) => value),
    resolveConfiguredApiKey: vi.fn((currentConfig) => currentConfig.remoteServerApiKey ?? ''),
    getNetworkAddresses: vi.fn(() => []),
    getConnectableBaseUrlForMobilePairing: vi.fn(() => 'http://192.168.1.10:4321/v1'),
    printTerminalQRCode: vi.fn(async () => true),
    scheduleDelayedTask: vi.fn(),
    scheduleTaskAfterReply: vi.fn((_reply, task) => task()),
    sendAuthFailure: vi.fn(),
    writeTerminalInfo: vi.fn(),
    writeTerminalWarning: vi.fn(),
    recordRejectedOperatorDeviceAttempt: vi.fn(),
    recordOperatorResponseAuditEvent: vi.fn(),
  };

  const controller = createRemoteServerController<TestServer, TestRequest, TestReply, TestConfig>({
    configStore,
    diagnosticsService,
    registerRoutes,
    adapters,
    providerSecretMask: 'provider-mask',
    remoteServerSecretMask: 'remote-mask',
    discordSecretMask: 'discord-mask',
    langfuseSecretMask: 'langfuse-mask',
    getAppVersion: () => '1.2.3',
    isHeadlessEnvironment: () => false,
    relaunchApp: vi.fn(),
    quitApp: vi.fn(),
    runAgent: vi.fn(),
    notifyConversationHistoryChanged: vi.fn(),
  });

  return {
    adapters,
    configStore,
    controller,
    diagnosticsService,
    get requestHook() {
      return requestHook;
    },
    get responseHook() {
      return responseHook;
    },
    registerRoutes,
    server,
  };
}

describe('remote server controller', () => {
  it('starts and stops through generic server adapters', async () => {
    const harness = createHarness();

    await expect(harness.controller.startRemoteServer()).resolves.toEqual({
      running: true,
      bind: '0.0.0.0',
      port: 4321,
    });

    expect(harness.adapters.createHttpServer).toHaveBeenCalledWith({
      logLevel: 'debug',
      bodyLimitBytes: 50 * 1024 * 1024,
      corsOrigins: ['https://app.example'],
    });
    expect(harness.adapters.addRequestHook).toHaveBeenCalledWith(harness.server, expect.any(Function));
    expect(harness.adapters.addResponseHook).toHaveBeenCalledWith(harness.server, expect.any(Function));
    expect(harness.adapters.listenHttpServer).toHaveBeenCalledWith(harness.server, {
      port: 4321,
      host: '0.0.0.0',
    });
    expect(harness.registerRoutes).toHaveBeenCalledWith(harness.server, expect.objectContaining({
      providerSecretMask: 'provider-mask',
      getRemoteServerStatus: expect.any(Function),
      scheduleRemoteServerRestartAfterReply: expect.any(Function),
    } satisfies Partial<RemoteServerRouteContext<TestReply>>));
    expect(harness.controller.getRemoteServerStatus()).toEqual(expect.objectContaining({
      running: true,
      bind: '0.0.0.0',
      port: 4321,
    }));

    await harness.responseHook?.({ id: 'request' }, { id: 'reply' });
    expect(harness.adapters.recordOperatorResponseAuditEvent).toHaveBeenCalledWith(
      { id: 'request' },
      { id: 'reply' },
    );

    await harness.controller.stopRemoteServer();

    expect(harness.adapters.closeHttpServer).toHaveBeenCalledWith(harness.server);
    expect(harness.controller.getRemoteServerStatus()).toEqual(expect.objectContaining({
      running: false,
      bind: '0.0.0.0',
      port: 4321,
    }));
  });

  it('routes rejected auth decisions through adapter-owned reply handling', async () => {
    const harness = createHarness({
      remoteServerOperatorAllowDeviceIds: ['trusted-device'],
    });
    vi.mocked(harness.adapters.authorizeRequest).mockReturnValue({
      ok: false,
      statusCode: 403,
      error: 'Forbidden',
      auditFailureReason: 'device-not-allowed',
    });

    await harness.controller.startRemoteServer();
    await harness.requestHook?.({ id: 'request' }, { id: 'reply' });

    expect(harness.adapters.authorizeRequest).toHaveBeenCalledWith(
      { id: 'request' },
      {
        currentApiKey: 'api-key',
        trustedDeviceIds: ['trusted-device'],
      },
    );
    expect(harness.adapters.recordRejectedOperatorDeviceAttempt).toHaveBeenCalledWith(
      { id: 'request' },
      'device-not-allowed',
    );
    expect(harness.adapters.sendAuthFailure).toHaveBeenCalledWith(
      { id: 'reply' },
      {
        statusCode: 403,
        error: 'Forbidden',
      },
    );
  });

  it('generates and stores an API key when forced on without one configured', async () => {
    const harness = createHarness({
      remoteServerEnabled: false,
      remoteServerApiKey: '',
    });

    await expect(harness.controller.startRemoteServerForced()).resolves.toEqual({
      running: true,
      bind: '0.0.0.0',
      port: 4321,
    });

    expect(harness.adapters.generateApiKey).toHaveBeenCalledTimes(1);
    expect(harness.configStore.save).toHaveBeenCalledWith(expect.objectContaining({
      remoteServerApiKey: 'generated-api-key',
    }));
  });
});
