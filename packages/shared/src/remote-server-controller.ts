import type {
  RemoteServerController,
  RemoteServerControllerConfigLike,
  RemoteServerControllerOptions,
  StartRemoteServerOptions,
  StartRemoteServerResult,
} from './remote-server-controller-contracts';
import type { RemoteServerLifecycleAction } from './remote-pairing';
import {
  buildRemoteServerBaseUrl,
  buildRemoteServerStatusSnapshot,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_PORT,
  ensureRemoteServerV1BaseUrl,
  getRemoteServerPairingApiKey as getRemoteServerPairingApiKeyFromConfig,
  getRemoteServerStartupPlan,
  shouldAutoPrintRemoteServerPairingQr,
} from './remote-pairing';

export function createRemoteServerController<
  Server = unknown,
  Request = unknown,
  Reply = unknown,
  Config extends RemoteServerControllerConfigLike = RemoteServerControllerConfigLike,
>(
  options: RemoteServerControllerOptions<Server, Request, Reply, Config>,
): RemoteServerController {
  const {
    configStore,
    diagnosticsService,
    registerRoutes,
    adapters,
    providerSecretMask,
    remoteServerSecretMask,
    discordSecretMask,
    langfuseSecretMask,
    getAppVersion,
    isHeadlessEnvironment,
    relaunchApp,
    quitApp,
    runAgent,
    notifyConversationHistoryChanged,
  } = options;

  let server: Server | null = null;
  let lastError: string | undefined;

  function scheduleTaskAfterReply(
    reply: Reply,
    description: string,
    task: () => Promise<void> | void,
  ): void {
    adapters.scheduleTaskAfterReply(reply, () => {
      void Promise.resolve(task()).catch((error) => {
        diagnosticsService.logError('remote-server', `Failed to ${description}`, error);
      });
    });
  }

  function scheduleRemoteServerLifecycleActionAfterReply(
    reply: Reply,
    action: RemoteServerLifecycleAction,
  ): void {
    if (action === 'noop') {
      return;
    }

    scheduleTaskAfterReply(reply, `apply remote server lifecycle action (${action})`, async () => {
      if (action === 'start') {
        await startRemoteServer();
        return;
      }

      if (action === 'stop') {
        await stopRemoteServer();
        return;
      }

      await restartRemoteServer();
    });
  }

  function scheduleRemoteServerRestartFromOperator(): void {
    adapters.scheduleDelayedTask(50, () => {
      void restartRemoteServer().catch((error) => {
        diagnosticsService.logError(
          'remote-server',
          'Failed to restart remote server from operator action',
          error,
        );
      });
    });
  }

  function scheduleAppRestartFromOperator(): void {
    adapters.scheduleDelayedTask(100, () => {
      try {
        relaunchApp();
        quitApp();
      } catch (error) {
        diagnosticsService.logError(
          'remote-server',
          'Failed to restart app from operator action',
          error,
        );
      }
    });
  }

  async function startRemoteServerForced(
    controllerOptions: { bindAddressOverride?: string } = {},
  ): Promise<StartRemoteServerResult> {
    return startRemoteServerInternal({
      forceEnabled: true,
      skipAutoPrintQR: true,
      bindAddressOverride: controllerOptions.bindAddressOverride,
    });
  }

  async function startRemoteServer(): Promise<StartRemoteServerResult> {
    return startRemoteServerInternal({ forceEnabled: false, skipAutoPrintQR: false });
  }

  async function startRemoteServerInternal(
    controllerOptions: StartRemoteServerOptions = {},
  ): Promise<StartRemoteServerResult> {
    const { forceEnabled = false, skipAutoPrintQR = false, bindAddressOverride } = controllerOptions;
    const cfg = configStore.get();
    const startupPlan = getRemoteServerStartupPlan(cfg, {
      forceEnabled,
      bindAddressOverride,
      resolveApiKey: adapters.resolveApiKeyReference,
    });

    if (!startupPlan.shouldStart) {
      diagnosticsService.logInfo(
        'remote-server',
        'Remote server not enabled in config; skipping start',
      );
      return { running: false };
    }

    if (startupPlan.apiKeyAction === 'generate') {
      const key = adapters.generateApiKey();
      configStore.save({ ...cfg, remoteServerApiKey: key } as Config);
    } else if (startupPlan.apiKeyAction === 'warn-unresolved') {
      diagnosticsService.logWarning(
        'remote-server',
        'Remote server API key is configured but could not be resolved; preserving configured value',
      );
    }

    if (server) {
      diagnosticsService.logInfo(
        'remote-server',
        'Remote server already running; restarting',
      );
      await stopRemoteServer();
    }

    lastError = undefined;
    const { logLevel, bind, port } = startupPlan;

    const httpServer = await adapters.createHttpServer({
      logLevel,
      // Existing mobile clients send the full message history on each
      // /v1/chat/completions call, so keep the server body limit well above
      // common framework defaults.
      bodyLimitBytes: 50 * 1024 * 1024,
      corsOrigins: startupPlan.corsOrigins,
    });

    await adapters.addRequestHook(httpServer, async (req, reply) => {
      const current = configStore.get();
      const authDecision = adapters.authorizeRequest(req, {
        currentApiKey: adapters.resolveConfiguredApiKey(current),
        trustedDeviceIds: current.remoteServerOperatorAllowDeviceIds ?? [],
      });

      if (authDecision.ok === false) {
        if (authDecision.auditFailureReason) {
          adapters.recordRejectedOperatorDeviceAttempt(req, authDecision.auditFailureReason);
        }

        adapters.sendAuthFailure(reply, {
          statusCode: authDecision.statusCode,
          error: authDecision.error,
        });
        return;
      }

      return;
    });

    await adapters.addResponseHook(httpServer, async (req, reply) => {
      adapters.recordOperatorResponseAuditEvent(req, reply);
    });

    registerRoutes(httpServer, {
      providerSecretMask,
      remoteServerSecretMask,
      discordSecretMask,
      langfuseSecretMask,
      getRemoteServerStatus,
      getAppVersion,
      runAgent,
      notifyConversationHistoryChanged,
      scheduleRemoteServerLifecycleActionAfterReply,
      scheduleRemoteServerRestartFromOperator,
      scheduleAppRestartFromOperator,
      scheduleRemoteServerRestartAfterReply: (reply) => {
        scheduleTaskAfterReply(reply, 'restart remote server after API key rotation', async () => {
          await restartRemoteServer();
        });
      },
    });

    try {
      await adapters.listenHttpServer(httpServer, { port, host: bind });
      diagnosticsService.logInfo(
        'remote-server',
        `Remote server listening at ${buildRemoteServerBaseUrl(bind, port)}`,
      );
      server = httpServer;

      const currentCfg = configStore.get();
      const currentApiKey = adapters.resolveConfiguredApiKey(currentCfg);
      if (shouldAutoPrintRemoteServerPairingQr({
        skipAutoPrintQR,
        apiKey: currentApiKey,
        streamerModeEnabled: currentCfg.streamerModeEnabled,
        headlessEnvironment: isHeadlessEnvironment(),
        terminalQrEnabled: currentCfg.remoteServerTerminalQrEnabled,
      })) {
        const serverUrl = adapters.getConnectableBaseUrlForMobilePairing(bind, port);
        if (serverUrl) {
          await adapters.printTerminalQRCode(serverUrl, currentApiKey);
        } else {
          adapters.writeTerminalWarning(
            `[Remote Server] Warning: Could not resolve a LAN-reachable URL for bind ${bind}. Skipping terminal QR code output.`,
          );
        }
      }

      return { running: true, bind, port };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      diagnosticsService.logError('remote-server', 'Failed to start server', error);
      server = null;
      return { running: false, error: lastError };
    }
  }

  async function stopRemoteServer(): Promise<void> {
    if (server !== null) {
      try {
        await adapters.closeHttpServer(server);
        diagnosticsService.logInfo('remote-server', 'Remote server stopped');
      } catch (error) {
        diagnosticsService.logError('remote-server', 'Error stopping server', error);
      } finally {
        server = null;
      }
    }
  }

  async function restartRemoteServer(): Promise<StartRemoteServerResult> {
    await stopRemoteServer();
    return startRemoteServer();
  }

  function getRemoteServerStatus() {
    const cfg = configStore.get();
    const bind = cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS;
    const port = cfg.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT;
    const running = server !== null;
    return buildRemoteServerStatusSnapshot({
      running,
      bind,
      port,
      lastError,
      addresses: running ? adapters.getNetworkAddresses() : undefined,
    });
  }

  function getRemoteServerPairingApiKey(): string {
    const cfg = configStore.get();
    return getRemoteServerPairingApiKeyFromConfig(cfg, adapters.resolveApiKeyReference);
  }

  async function printQRCodeToTerminal(urlOverride?: string): Promise<boolean> {
    const cfg = configStore.get();
    const apiKey = adapters.resolveConfiguredApiKey(cfg);
    if (server === null || !apiKey) {
      adapters.writeTerminalInfo(
        '[Remote Server] Cannot print QR code: server not running or no API key configured',
      );
      return false;
    }

    if (cfg.streamerModeEnabled) {
      adapters.writeTerminalInfo('[Remote Server] Cannot print QR code: streamer mode is enabled');
      return false;
    }

    let serverUrl: string;
    if (urlOverride) {
      serverUrl = ensureRemoteServerV1BaseUrl(urlOverride);
    } else {
      const bind = cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS;
      const port = cfg.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT;
      const connectableBaseUrl = adapters.getConnectableBaseUrlForMobilePairing(bind, port);
      if (!connectableBaseUrl) {
        adapters.writeTerminalInfo(
          '[Remote Server] Cannot print QR code: unable to resolve a LAN-reachable URL for the current bind address',
        );
        return false;
      }
      serverUrl = connectableBaseUrl;
    }

    return adapters.printTerminalQRCode(serverUrl, apiKey);
  }

  return {
    startRemoteServerForced,
    startRemoteServer,
    stopRemoteServer,
    restartRemoteServer,
    getRemoteServerStatus,
    getRemoteServerPairingApiKey,
    printQRCodeToTerminal,
  };
}
