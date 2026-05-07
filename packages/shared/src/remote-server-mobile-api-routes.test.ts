import { describe, expect, it, vi } from 'vitest';
import {
  getRemoteServerApiRoutePath,
  REMOTE_SERVER_API_ROUTE_PATHS,
  REMOTE_SERVER_API_ROUTES,
} from './remote-server-api';
import type {
  MobileApiRouteActions,
  MobileApiRouteOptions,
  MobileApiRunAgentExecutor,
} from './remote-server-mobile-api-routes';
import {
  registerMobileApiRoutes,
  type RemoteServerMobileApiRouteHandler,
  type RemoteServerMobileApiRouteServer,
} from './remote-server-mobile-api-routes';

type TestRequest = {
  body: unknown;
  headers: {
    origin?: string | string[];
    range?: string;
  };
  params: Record<string, unknown>;
  query: Record<string, unknown>;
};

type TestReply = {
  body: unknown;
  headers: Map<string, string>;
  statusCode: number | undefined;
  code: ReturnType<typeof vi.fn<(statusCode: number) => TestReply>>;
  header: ReturnType<typeof vi.fn<(name: string, value: string) => TestReply>>;
  send: ReturnType<typeof vi.fn<(body?: unknown) => TestReply>>;
};

function createRouteServer() {
  const routes = new Map<string, RemoteServerMobileApiRouteHandler<TestRequest, TestReply>>();
  const server: RemoteServerMobileApiRouteServer<TestRequest, TestReply> = {
    post: vi.fn((path, handler) => {
      routes.set(`POST ${path}`, handler);
    }),
    get: vi.fn((path, handler) => {
      routes.set(`GET ${path}`, handler);
    }),
    patch: vi.fn((path, handler) => {
      routes.set(`PATCH ${path}`, handler);
    }),
    put: vi.fn((path, handler) => {
      routes.set(`PUT ${path}`, handler);
    }),
    delete: vi.fn((path, handler) => {
      routes.set(`DELETE ${path}`, handler);
    }),
  };

  return { routes, server };
}

function createReply(): TestReply {
  const reply = {
    body: undefined,
    headers: new Map<string, string>(),
    statusCode: undefined,
  } as TestReply;
  reply.code = vi.fn((statusCode) => {
    reply.statusCode = statusCode;
    return reply;
  });
  reply.header = vi.fn((name, value) => {
    reply.headers.set(name, value);
    return reply;
  });
  reply.send = vi.fn((body) => {
    reply.body = body;
    return reply;
  });
  return reply;
}

function createRequest(overrides: Partial<TestRequest> = {}): TestRequest {
  return {
    body: undefined,
    headers: {},
    params: {},
    query: {},
    ...overrides,
  };
}

function createOptions(
  actions: Partial<MobileApiRouteActions<TestRequest, TestReply>>,
): MobileApiRouteOptions<TestRequest, TestReply> {
  return {
    actions: actions as MobileApiRouteActions<TestRequest, TestReply>,
    providerSecretMask: 'provider-mask',
    remoteServerSecretMask: 'remote-mask',
    discordSecretMask: 'discord-mask',
    langfuseSecretMask: 'langfuse-mask',
    runAgent: vi.fn() as unknown as MobileApiRunAgentExecutor,
    notifyConversationHistoryChanged: vi.fn(),
    scheduleRemoteServerLifecycleActionAfterReply: vi.fn(),
  };
}

describe('remote server mobile API routes', () => {
  it('registers every non-operator remote API route against a generic server', () => {
    const { routes, server } = createRouteServer();

    registerMobileApiRoutes(server, createOptions({}));

    const expectedRoutes = REMOTE_SERVER_API_ROUTES
      .filter((route) => !route.path.startsWith('/operator'))
      .map((route) => `${route.method} ${getRemoteServerApiRoutePath(route.path)}`)
      .sort();

    expect([...routes.keys()].sort()).toEqual(expectedRoutes);
  });

  it('forwards route params, headers, lifecycle hooks, and audit contexts to mobile API actions', async () => {
    const { routes, server } = createRouteServer();
    const chatBody = { messages: [{ role: 'user', content: 'hi' }] };
    const settingsBody = { remoteServerEnabled: true };
    const auditContext = { action: 'settings.update', success: true };
    const actions = {
      handleChatCompletionRequest: vi.fn(() => 'chat-result'),
      exportProfile: vi.fn(() => ({ statusCode: 200, body: { id: 'profile-1' } })),
      updateSettings: vi.fn(() => ({
        statusCode: 202,
        body: { success: true },
        remoteServerLifecycleAction: 'restart' as const,
        auditContext,
      })),
      recordOperatorAuditEvent: vi.fn(),
      getConversationVideoAsset: vi.fn(() => ({
        statusCode: 206,
        body: 'video-bytes',
        headers: { 'content-range': 'bytes 0-9/10' },
      })),
    };
    const options = createOptions(actions);

    registerMobileApiRoutes(server, options);

    const chatRequest = createRequest({
      body: chatBody,
      headers: { origin: 'https://mobile.example' },
    });
    const chatReply = createReply();
    await expect(routes.get(`POST ${REMOTE_SERVER_API_ROUTE_PATHS.chatCompletions}`)!(chatRequest, chatReply))
      .resolves.toBe('chat-result');

    expect(actions.handleChatCompletionRequest).toHaveBeenCalledWith(
      chatBody,
      'https://mobile.example',
      chatReply,
      options.runAgent,
    );

    const profileReply = createReply();
    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.profileExport}`)!(
      createRequest({ params: { id: 'profile-1' } }),
      profileReply,
    );

    expect(actions.exportProfile).toHaveBeenCalledWith('profile-1');
    expect(profileReply.statusCode).toBe(200);
    expect(profileReply.body).toEqual({ id: 'profile-1' });

    const settingsRequest = createRequest({ body: settingsBody });
    const settingsReply = createReply();
    await routes.get(`PATCH ${REMOTE_SERVER_API_ROUTE_PATHS.settings}`)!(settingsRequest, settingsReply);

    expect(actions.updateSettings).toHaveBeenCalledWith(settingsBody, {
      providerSecretMask: 'provider-mask',
      remoteServerSecretMask: 'remote-mask',
      discordSecretMask: 'discord-mask',
      langfuseSecretMask: 'langfuse-mask',
    });
    expect(options.scheduleRemoteServerLifecycleActionAfterReply).toHaveBeenCalledWith(settingsReply, 'restart');
    expect(actions.recordOperatorAuditEvent).toHaveBeenCalledWith(settingsRequest, auditContext);
    expect(settingsReply.statusCode).toBe(202);

    const videoReply = createReply();
    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.conversationVideoAsset}`)!(
      createRequest({
        headers: { range: 'bytes=0-9' },
        params: { id: 'conversation-1', fileName: 'clip.mp4' },
      }),
      videoReply,
    );

    expect(actions.getConversationVideoAsset).toHaveBeenCalledWith('conversation-1', 'clip.mp4', 'bytes=0-9');
    expect(videoReply.headers.get('content-range')).toBe('bytes 0-9/10');
    expect(videoReply.statusCode).toBe(206);
    expect(videoReply.body).toBe('video-bytes');
  });
});
