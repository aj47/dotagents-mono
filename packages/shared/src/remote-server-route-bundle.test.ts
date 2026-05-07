import { describe, expect, it, vi } from 'vitest';
import {
  getRemoteServerApiRoutePath,
  REMOTE_SERVER_API_ROUTE_PATHS,
  REMOTE_SERVER_API_ROUTES,
  REMOTE_SERVER_MCP_ROUTES,
} from './remote-server-api';
import type { RemoteServerRouteContext } from './remote-server-controller-contracts';
import {
  registerRemoteServerRouteBundle,
  type RemoteServerRouteBundleServer,
} from './remote-server-route-bundle';
import type {
  InjectedMcpRouteActions,
  MobileApiRouteActions,
  OperatorRouteActions,
} from './remote-server-route-contracts';

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
  code: (statusCode: number) => { send(body?: unknown): unknown };
  header: (name: string, value: string) => unknown;
  send: (body?: unknown) => unknown;
};

function createRouteServer() {
  const routes = new Map<string, (request: TestRequest, reply: TestReply) => unknown>();
  const server: RemoteServerRouteBundleServer<TestRequest, TestReply> = {
    get: vi.fn((path, handler) => {
      routes.set(`GET ${path}`, handler);
    }),
    post: vi.fn((path, handler) => {
      routes.set(`POST ${path}`, handler);
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

function createContext(): RemoteServerRouteContext<TestReply> {
  return {
    providerSecretMask: 'provider-mask',
    remoteServerSecretMask: 'remote-mask',
    discordSecretMask: 'discord-mask',
    langfuseSecretMask: 'langfuse-mask',
    getRemoteServerStatus: vi.fn(() => ({
      running: true,
      bind: '127.0.0.1',
      port: 4123,
      url: 'http://127.0.0.1:4123',
      connectableUrl: 'http://127.0.0.1:4123',
    })),
    getAppVersion: vi.fn(() => '1.2.3'),
    runAgent: vi.fn(),
    notifyConversationHistoryChanged: vi.fn(),
    scheduleRemoteServerLifecycleActionAfterReply: vi.fn(),
    scheduleRemoteServerRestartFromOperator: vi.fn(),
    scheduleAppRestartFromOperator: vi.fn(),
    scheduleRemoteServerRestartAfterReply: vi.fn(),
  };
}

describe('remote server route bundle', () => {
  it('registers the full remote API and injected MCP route surface', () => {
    const { routes, server } = createRouteServer();

    registerRemoteServerRouteBundle(server, createContext(), {
      operatorRouteActions: {} as OperatorRouteActions<TestRequest>,
      mobileApiRouteActions: {} as MobileApiRouteActions<TestRequest, TestReply>,
      injectedMcpRouteActions: {} as InjectedMcpRouteActions<TestRequest, TestReply>,
    });

    const expectedApiRoutes = REMOTE_SERVER_API_ROUTES
      .map((route) => `${route.method} ${getRemoteServerApiRoutePath(route.path)}`);
    const expectedMcpRoutes = REMOTE_SERVER_MCP_ROUTES
      .map((route) => `${route.method} ${route.path}`);

    expect([...routes.keys()].sort()).toEqual([
      ...expectedApiRoutes,
      ...expectedMcpRoutes,
    ].sort());
  });

  it('passes route context and action groups to each shared route registrar', async () => {
    const { routes, server } = createRouteServer();
    const context = createContext();
    const operatorRouteActions = {
      getOperatorStatus: vi.fn(() => ({ statusCode: 200, body: { ok: true } })),
    };
    const mobileApiRouteActions = {
      getSettings: vi.fn(() => ({ statusCode: 200, body: { settings: true } })),
    };
    const injectedMcpRouteActions = {
      listInjectedMcpTools: vi.fn(() => 'mcp-list-result'),
    };

    registerRemoteServerRouteBundle(server, context, {
      operatorRouteActions: operatorRouteActions as unknown as OperatorRouteActions<TestRequest>,
      mobileApiRouteActions: mobileApiRouteActions as unknown as MobileApiRouteActions<TestRequest, TestReply>,
      injectedMcpRouteActions: injectedMcpRouteActions as unknown as InjectedMcpRouteActions<TestRequest, TestReply>,
    });

    const operatorReply = createReply();
    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.operatorStatus}`)!(createRequest(), operatorReply);
    expect(operatorRouteActions.getOperatorStatus).toHaveBeenCalledWith(context.getRemoteServerStatus());
    expect(operatorReply.statusCode).toBe(200);
    expect(operatorReply.body).toEqual({ ok: true });

    const mobileReply = createReply();
    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.settings}`)!(createRequest(), mobileReply);
    expect(mobileApiRouteActions.getSettings).toHaveBeenCalledWith('provider-mask');
    expect(mobileReply.statusCode).toBe(200);
    expect(mobileReply.body).toEqual({ settings: true });

    const mcpReply = createReply();
    await expect(routes.get('POST /mcp/tools/list')!(
      createRequest({ query: { acpSessionToken: 'token-1' } }),
      mcpReply,
    )).resolves.toBe('mcp-list-result');
    expect(injectedMcpRouteActions.listInjectedMcpTools).toHaveBeenCalledWith('token-1', mcpReply);
  });
});
