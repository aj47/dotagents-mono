import { describe, expect, it, vi } from 'vitest';
import { REMOTE_SERVER_MCP_PATHS } from './remote-server-api';
import {
  registerInjectedMcpRoutes,
  type RemoteServerInjectedMcpRouteServer,
  type RemoteServerRouteHandler,
} from './remote-server-injected-mcp-routes';

type TestRequest = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

type TestReply = {
  id: string;
};

function createRouteServer() {
  const routes = new Map<string, RemoteServerRouteHandler<TestRequest, TestReply>>();
  const server: RemoteServerInjectedMcpRouteServer<TestRequest, TestReply> = {
    post: vi.fn((path, handler) => {
      routes.set(`POST ${path}`, handler);
    }),
    get: vi.fn((path, handler) => {
      routes.set(`GET ${path}`, handler);
    }),
    delete: vi.fn((path, handler) => {
      routes.set(`DELETE ${path}`, handler);
    }),
  };

  return { routes, server };
}

describe('remote server injected MCP routes', () => {
  it('registers protocol and compatibility shim routes against a generic server', () => {
    const { routes, server } = createRouteServer();

    registerInjectedMcpRoutes(server, {
      actions: {
        handleInjectedMcpProtocolRequest: vi.fn(),
        listInjectedMcpTools: vi.fn(),
        callInjectedMcpTool: vi.fn(),
      },
    });

    expect(server.post).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.session, expect.any(Function));
    expect(server.get).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.session, expect.any(Function));
    expect(server.delete).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.session, expect.any(Function));
    expect(server.post).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.toolsList, expect.any(Function));
    expect(server.post).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.sessionToolsList, expect.any(Function));
    expect(server.post).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.toolsCall, expect.any(Function));
    expect(server.post).toHaveBeenCalledWith(REMOTE_SERVER_MCP_PATHS.sessionToolsCall, expect.any(Function));
    expect([...routes.keys()].sort()).toEqual([
      `DELETE ${REMOTE_SERVER_MCP_PATHS.session}`,
      `GET ${REMOTE_SERVER_MCP_PATHS.session}`,
      `POST ${REMOTE_SERVER_MCP_PATHS.session}`,
      `POST ${REMOTE_SERVER_MCP_PATHS.sessionToolsCall}`,
      `POST ${REMOTE_SERVER_MCP_PATHS.sessionToolsList}`,
      `POST ${REMOTE_SERVER_MCP_PATHS.toolsCall}`,
      `POST ${REMOTE_SERVER_MCP_PATHS.toolsList}`,
    ].sort());
  });

  it('passes ACP session tokens from route params and query strings to actions', async () => {
    const { routes, server } = createRouteServer();
    const reply = { id: 'reply' };
    const actions = {
      handleInjectedMcpProtocolRequest: vi.fn(() => 'protocol-result'),
      listInjectedMcpTools: vi.fn(() => 'list-result'),
      callInjectedMcpTool: vi.fn(() => 'call-result'),
    };

    registerInjectedMcpRoutes(server, { actions });

    await expect(routes.get(`POST ${REMOTE_SERVER_MCP_PATHS.session}`)!(
      { params: { acpSessionToken: 'session-token' } },
      reply,
    )).resolves.toBe('protocol-result');
    await expect(routes.get(`POST ${REMOTE_SERVER_MCP_PATHS.toolsList}`)!(
      { query: { acpSessionToken: 'query-token' } },
      reply,
    )).resolves.toBe('list-result');
    await expect(routes.get(`POST ${REMOTE_SERVER_MCP_PATHS.sessionToolsCall}`)!(
      { params: { acpSessionToken: 'param-token' } },
      reply,
    )).resolves.toBe('call-result');

    expect(actions.handleInjectedMcpProtocolRequest).toHaveBeenCalledWith(
      { params: { acpSessionToken: 'session-token' } },
      reply,
      'session-token',
    );
    expect(actions.listInjectedMcpTools).toHaveBeenCalledWith('query-token', reply);
    expect(actions.callInjectedMcpTool).toHaveBeenCalledWith(
      { params: { acpSessionToken: 'param-token' } },
      reply,
      'param-token',
    );
  });
});
