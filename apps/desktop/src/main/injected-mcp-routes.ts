import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { REMOTE_SERVER_MCP_PATHS } from "@dotagents/shared/remote-server-api"
import type {
  InjectedMcpRouteActions as SharedInjectedMcpRouteActions,
  InjectedMcpRouteOptions as SharedInjectedMcpRouteOptions,
  InjectedMcpRouteResult,
} from "@dotagents/shared/remote-server-route-contracts"

const MCP_ROUTES = REMOTE_SERVER_MCP_PATHS

export type { InjectedMcpRouteResult }

export type InjectedMcpRouteActions = SharedInjectedMcpRouteActions<FastifyRequest, FastifyReply>

export type RegisterInjectedMcpRoutesOptions = SharedInjectedMcpRouteOptions<FastifyRequest, FastifyReply>

export function registerInjectedMcpRoutes(
  fastify: FastifyInstance,
  options: RegisterInjectedMcpRoutesOptions,
): void {
  const { actions } = options

  // MCP Protocol Endpoints - Expose DotAgents runtime tools to external agents.
  // Support both Streamable HTTP MCP at /mcp/:acpSessionToken and legacy /tools/list,/tools/call shims.
  fastify.post(MCP_ROUTES.session, async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return actions.handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)
  })

  fastify.get(MCP_ROUTES.session, async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return actions.handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)
  })

  fastify.delete(MCP_ROUTES.session, async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return actions.handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)
  })

  // POST /mcp/tools/list - List all available injected runtime tools
  fastify.post(MCP_ROUTES.toolsList, async (req, reply) => {
    const query = req.query as { acpSessionToken?: string } | undefined
    return actions.listInjectedMcpTools(query?.acpSessionToken, reply)
  })

  fastify.post(MCP_ROUTES.sessionToolsList, async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return actions.listInjectedMcpTools(params?.acpSessionToken, reply)
  })

  // POST /mcp/tools/call - Execute an injected runtime tool
  fastify.post(MCP_ROUTES.toolsCall, async (req, reply) => {
    const query = req.query as { acpSessionToken?: string } | undefined
    return actions.callInjectedMcpTool(req, reply, query?.acpSessionToken)
  })

  fastify.post(MCP_ROUTES.sessionToolsCall, async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return actions.callInjectedMcpTool(req, reply, params?.acpSessionToken)
  })
}
