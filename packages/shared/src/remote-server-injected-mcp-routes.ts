import { REMOTE_SERVER_MCP_PATHS } from './remote-server-api';
import type {
  InjectedMcpRouteActions,
  InjectedMcpRouteOptions,
  InjectedMcpRouteResult,
} from './remote-server-route-contracts';

const MCP_ROUTES = REMOTE_SERVER_MCP_PATHS;

export type { InjectedMcpRouteActions, InjectedMcpRouteOptions, InjectedMcpRouteResult };

export type RemoteServerRouteHandler<Request, Reply> = (
  request: Request,
  reply: Reply,
) => InjectedMcpRouteResult;

export interface RemoteServerInjectedMcpRouteServer<Request = unknown, Reply = unknown> {
  post(path: string, handler: RemoteServerRouteHandler<Request, Reply>): unknown;
  get(path: string, handler: RemoteServerRouteHandler<Request, Reply>): unknown;
  delete(path: string, handler: RemoteServerRouteHandler<Request, Reply>): unknown;
}

export type RemoteServerInjectedMcpRequestLike = {
  params?: unknown;
  query?: unknown;
};

function getRecordValue(record: unknown, key: string): unknown {
  return record && typeof record === 'object' ? (record as Record<string, unknown>)[key] : undefined;
}

function getOptionalStringParam(request: RemoteServerInjectedMcpRequestLike, key: string): string | undefined {
  const value = getRecordValue(request.params, key);
  return typeof value === 'string' ? value : undefined;
}

function getOptionalStringQuery(request: RemoteServerInjectedMcpRequestLike, key: string): string | undefined {
  const value = getRecordValue(request.query, key);
  return typeof value === 'string' ? value : undefined;
}

export function registerInjectedMcpRoutes<
  Request extends RemoteServerInjectedMcpRequestLike = RemoteServerInjectedMcpRequestLike,
  Reply = unknown,
>(
  fastify: RemoteServerInjectedMcpRouteServer<Request, Reply>,
  options: InjectedMcpRouteOptions<Request, Reply>,
): void {
  const { actions } = options;

  fastify.post(MCP_ROUTES.session, async (req, reply) => {
    return actions.handleInjectedMcpProtocolRequest(req, reply, getOptionalStringParam(req, 'acpSessionToken'));
  });

  fastify.get(MCP_ROUTES.session, async (req, reply) => {
    return actions.handleInjectedMcpProtocolRequest(req, reply, getOptionalStringParam(req, 'acpSessionToken'));
  });

  fastify.delete(MCP_ROUTES.session, async (req, reply) => {
    return actions.handleInjectedMcpProtocolRequest(req, reply, getOptionalStringParam(req, 'acpSessionToken'));
  });

  fastify.post(MCP_ROUTES.toolsList, async (req, reply) => {
    return actions.listInjectedMcpTools(getOptionalStringQuery(req, 'acpSessionToken'), reply);
  });

  fastify.post(MCP_ROUTES.sessionToolsList, async (req, reply) => {
    return actions.listInjectedMcpTools(getOptionalStringParam(req, 'acpSessionToken'), reply);
  });

  fastify.post(MCP_ROUTES.toolsCall, async (req, reply) => {
    return actions.callInjectedMcpTool(req, reply, getOptionalStringQuery(req, 'acpSessionToken'));
  });

  fastify.post(MCP_ROUTES.sessionToolsCall, async (req, reply) => {
    return actions.callInjectedMcpTool(req, reply, getOptionalStringParam(req, 'acpSessionToken'));
  });
}
