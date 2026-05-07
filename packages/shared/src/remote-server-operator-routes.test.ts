import { describe, expect, it, vi } from 'vitest';
import {
  getRemoteServerApiRoutePath,
  REMOTE_SERVER_API_ROUTE_PATHS,
  REMOTE_SERVER_API_ROUTES,
} from './remote-server-api';
import type {
  OperatorRouteActions,
  OperatorRouteOptions,
  OperatorRunAgentExecutor,
} from './remote-server-operator-routes';
import {
  registerOperatorRoutes,
  type RemoteServerOperatorRouteHandler,
  type RemoteServerOperatorRouteServer,
} from './remote-server-operator-routes';

type TestRequest = {
  body: unknown;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
};

type TestReply = {
  body: unknown;
  statusCode: number | undefined;
  code: (statusCode: number) => TestReply;
  send: (body?: unknown) => TestReply;
};

function createRouteServer() {
  const routes = new Map<string, RemoteServerOperatorRouteHandler<TestRequest, TestReply>>();
  const server: RemoteServerOperatorRouteServer<TestRequest, TestReply> = {
    get: vi.fn((path, handler) => {
      routes.set(`GET ${path}`, handler);
    }),
    post: vi.fn((path, handler) => {
      routes.set(`POST ${path}`, handler);
    }),
    patch: vi.fn((path, handler) => {
      routes.set(`PATCH ${path}`, handler);
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
    statusCode: undefined,
    code: vi.fn((statusCode: number) => {
      reply.statusCode = statusCode;
      return reply;
    }),
    send: vi.fn((body?: unknown) => {
      reply.body = body;
      return reply;
    }),
  };
  return reply;
}

function createRequest(overrides: Partial<TestRequest> = {}): TestRequest {
  return {
    body: undefined,
    params: {},
    query: {},
    ...overrides,
  };
}

function createOptions(
  actions: Partial<OperatorRouteActions<TestRequest>>,
): OperatorRouteOptions<TestRequest, TestReply> {
  return {
    actions: actions as OperatorRouteActions<TestRequest>,
    providerSecretMask: 'provider-mask',
    getRemoteServerStatus: vi.fn(() => ({
      running: true,
      bind: '127.0.0.1',
      port: 4123,
      url: 'http://127.0.0.1:4123',
      connectableUrl: 'http://127.0.0.1:4123',
    })),
    getAppVersion: vi.fn(() => '1.2.3'),
    runAgent: vi.fn() as unknown as OperatorRunAgentExecutor,
    scheduleRemoteServerRestartFromOperator: vi.fn(),
    scheduleAppRestartFromOperator: vi.fn(),
    scheduleRemoteServerRestartAfterReply: vi.fn(),
  };
}

describe('remote server operator routes', () => {
  it('registers every operator remote API route against a generic server', () => {
    const { routes, server } = createRouteServer();

    registerOperatorRoutes(server, createOptions({}));

    const expectedRoutes = REMOTE_SERVER_API_ROUTES
      .filter((route) => route.path.startsWith('/operator'))
      .map((route) => `${route.method} ${getRemoteServerApiRoutePath(route.path)}`)
      .sort();

    expect([...routes.keys()].sort()).toEqual(expectedRoutes);
  });

  it('forwards status, query, params, audit contexts, and restart hooks to operator actions', async () => {
    const { routes, server } = createRouteServer();
    const restartAuditContext = { action: 'restart-remote-server', success: true };
    const rotateAuditContext = { action: 'rotate-api-key', success: true };
    const actions = {
      getOperatorStatus: vi.fn(() => ({ statusCode: 200, body: { running: true } })),
      getOperatorLogs: vi.fn(() => ({ statusCode: 200, body: { lines: [] } })),
      restartOperatorRemoteServer: vi.fn(() => ({
        statusCode: 202,
        body: { action: 'restart-remote-server' },
        shouldRestartRemoteServer: true,
        auditContext: restartAuditContext,
      })),
      rotateOperatorRemoteServerApiKey: vi.fn(() => ({
        statusCode: 200,
        body: { apiKey: 'next-key' },
        shouldRestartRemoteServer: true,
        auditContext: rotateAuditContext,
      })),
      runOperatorAgent: vi.fn(() => ({ statusCode: 202, body: { sessionId: 'session-1' } })),
      getOperatorMcpServerLogs: vi.fn(() => ({ statusCode: 200, body: { logs: [] } })),
      setOperatorAuditContext: vi.fn(),
    };
    const options = createOptions(actions);

    registerOperatorRoutes(server, options);

    const statusReply = createReply();
    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.operatorStatus}`)!(createRequest(), statusReply);

    expect(actions.getOperatorStatus).toHaveBeenCalledWith({
      running: true,
      bind: '127.0.0.1',
      port: 4123,
      url: 'http://127.0.0.1:4123',
      connectableUrl: 'http://127.0.0.1:4123',
    });
    expect(statusReply.statusCode).toBe(200);

    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.operatorLogs}`)!(
      createRequest({ query: { count: '50', level: 'warning' } }),
      createReply(),
    );
    expect(actions.getOperatorLogs).toHaveBeenCalledWith('50', 'warning');

    const restartRequest = createRequest();
    await routes.get(`POST ${REMOTE_SERVER_API_ROUTE_PATHS.operatorRestartRemoteServer}`)!(
      restartRequest,
      createReply(),
    );
    expect(actions.restartOperatorRemoteServer).toHaveBeenCalledWith(true);
    expect(actions.setOperatorAuditContext).toHaveBeenCalledWith(restartRequest, restartAuditContext);
    expect(options.scheduleRemoteServerRestartFromOperator).toHaveBeenCalledTimes(1);

    const rotateReply = createReply();
    const rotateRequest = createRequest();
    await routes.get(`POST ${REMOTE_SERVER_API_ROUTE_PATHS.operatorRotateApiKey}`)!(
      rotateRequest,
      rotateReply,
    );
    expect(actions.rotateOperatorRemoteServerApiKey).toHaveBeenCalledTimes(1);
    expect(actions.setOperatorAuditContext).toHaveBeenCalledWith(rotateRequest, rotateAuditContext);
    expect(options.scheduleRemoteServerRestartAfterReply).toHaveBeenCalledWith(rotateReply);

    const runBody = { prompt: 'run this' };
    await routes.get(`POST ${REMOTE_SERVER_API_ROUTE_PATHS.operatorRunAgent}`)!(
      createRequest({ body: runBody }),
      createReply(),
    );
    expect(actions.runOperatorAgent).toHaveBeenCalledWith(runBody, options.runAgent);

    await routes.get(`GET ${REMOTE_SERVER_API_ROUTE_PATHS.operatorMcpServerLogs}`)!(
      createRequest({
        params: { server: 'filesystem' },
        query: { count: 25 },
      }),
      createReply(),
    );
    expect(actions.getOperatorMcpServerLogs).toHaveBeenCalledWith('filesystem', 25);
  });
});
