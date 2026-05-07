import crypto from "crypto"
import { Server as MCPServer } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { agentSessionStateManager, type SessionProfileSnapshot } from "@dotagents/core"
import {
  buildInjectedMcpToolCallErrorResponse,
  buildInjectedMcpToolCallResponse,
  buildInjectedMcpToolsListResponse,
  createInjectedMcpProtocolRouteAction,
  createInjectedMcpToolRouteActions,
  INJECTED_RUNTIME_TOOL_TRANSPORT_NAME,
  resolveInjectedRuntimeToolsForAcpSession,
  type InjectedMcpActionOptions,
  type InjectedMcpResolvedRequestContext,
  type InjectedMcpRuntimeToolResolutionOptions,
} from "@dotagents/shared/mcp-api"
import type { RemoteServerRouteRegistrar } from "@dotagents/shared/remote-server-controller-contracts"
import {
  registerRemoteServerRouteBundle,
  type RemoteServerRouteBundleServer,
} from "@dotagents/shared/remote-server-route-bundle"
import { createInjectedMcpRouteActions } from "@dotagents/shared/remote-server-route-contracts"
import {
  getAcpSessionForClientSessionToken,
  getAppSessionForAcpSession,
  getPendingAppSessionForClientSessionToken,
} from "./acpx/acpx-session-state"
import { agentSessionTracker } from "./agent-session-tracker"
import { diagnosticsService } from "./diagnostics"
import { mobileApiDesktopActions } from "./mobile-api-desktop-actions"
import { mcpService } from "./mcp-service"
import { operatorRouteDesktopActions } from "./operator-route-desktop-actions"
import { isRuntimeTool } from "./runtime-tools"

type AcpMcpRequestContext = InjectedMcpResolvedRequestContext<SessionProfileSnapshot>

const INVALID_ACP_SESSION_CONTEXT_ERROR = "Unauthorized: invalid ACP session context"

const injectedMcpRuntimeToolResolutionOptions: InjectedMcpRuntimeToolResolutionOptions<SessionProfileSnapshot> = {
  session: {
    getAcpSessionForClientSessionToken,
    getAppSessionForAcpSession,
    getPendingAppSessionForClientSessionToken,
    getActiveSessionProfileSnapshot: (appSessionId) =>
      agentSessionStateManager.getSessionProfileSnapshot(appSessionId),
    getTrackedSessionProfileSnapshot: (appSessionId) =>
      agentSessionTracker.getSessionProfileSnapshot(appSessionId),
  },
  tools: {
    getAvailableToolsForProfile: (profileSnapshot) =>
      mcpService.getAvailableToolsForProfile(profileSnapshot.mcpServerConfig),
    isRuntimeToolName: isRuntimeTool,
  },
}

function getInjectedRuntimeToolsForAcpSession(
  acpSessionToken: string | undefined,
): { requestContext: AcpMcpRequestContext; tools: Array<{ name: string; description: string; inputSchema: unknown }> } | undefined {
  return resolveInjectedRuntimeToolsForAcpSession(acpSessionToken, injectedMcpRuntimeToolResolutionOptions)
}

function createInjectedMcpServer(acpSessionToken: string): MCPServer {
  const server = new MCPServer(
    {
      name: INJECTED_RUNTIME_TOOL_TRANSPORT_NAME,
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const injectedRuntimeTools = getInjectedRuntimeToolsForAcpSession(acpSessionToken)
    if (!injectedRuntimeTools) {
      throw new Error(INVALID_ACP_SESSION_CONTEXT_ERROR)
    }

    return buildInjectedMcpToolsListResponse(injectedRuntimeTools.tools)
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const injectedRuntimeTools = getInjectedRuntimeToolsForAcpSession(acpSessionToken)
    if (!injectedRuntimeTools) {
      return buildInjectedMcpToolCallErrorResponse(INVALID_ACP_SESSION_CONTEXT_ERROR)
    }

    const { name, arguments: args } = request.params
    if (!name || typeof name !== "string") {
      return buildInjectedMcpToolCallErrorResponse("Missing or invalid 'name' parameter")
    }

    if (!injectedRuntimeTools.tools.some((tool) => tool.name === name)) {
      return buildInjectedMcpToolCallErrorResponse(`Unknown runtime tool: ${name}`)
    }

    const result = await mcpService.executeToolCall(
      { name, arguments: args || {} } as any,
      undefined,
      false,
      injectedRuntimeTools.requestContext.appSessionId,
      injectedRuntimeTools.requestContext.profileSnapshot.mcpServerConfig,
    )

    return result
      ? buildInjectedMcpToolCallResponse(result)
      : buildInjectedMcpToolCallErrorResponse("Tool execution returned null")
  })

  return server
}

const injectedMcpActionOptions: InjectedMcpActionOptions<AcpMcpRequestContext> = {
  invalidSessionContextError: INVALID_ACP_SESSION_CONTEXT_ERROR,
  diagnostics: {
    logWarning: (source, message) => diagnosticsService.logWarning(source, message),
    logError: (source, message, error) => diagnosticsService.logError(source, message, error),
    getErrorMessage: (error) => error instanceof Error ? error.message : String(error),
  },
  service: {
    getInjectedRuntimeTools: (acpSessionToken) => getInjectedRuntimeToolsForAcpSession(acpSessionToken),
    executeInjectedRuntimeTool: (toolCall, requestContext) => mcpService.executeToolCall(
      { name: toolCall.name, arguments: toolCall.arguments } as any,
      undefined,
      false,
      requestContext.appSessionId,
      requestContext.profileSnapshot.mcpServerConfig,
    ),
  },
}

const injectedMcpToolRouteActions = createInjectedMcpToolRouteActions<
  FastifyRequest,
  FastifyReply,
  AcpMcpRequestContext
>({
  action: injectedMcpActionOptions,
  request: {
    getBody: (req) => req.body,
  },
  response: {
    sendActionResult: (reply, result) => reply.code(result.statusCode).send(result.body),
  },
})

const handleInjectedMcpProtocolRequest = createInjectedMcpProtocolRouteAction<
  FastifyRequest,
  FastifyReply,
  MCPServer,
  StreamableHTTPServerTransport,
  AcpMcpRequestContext
>({
  action: injectedMcpActionOptions,
  protocol: {
    createServer: createInjectedMcpServer,
    createTransport: (options) => new StreamableHTTPServerTransport(options),
    createSessionId: () => crypto.randomUUID(),
    isInitializeRequest,
  },
  server: {
    connect: (server, transport) => server.connect(transport),
    close: (server) => server.close(),
  },
  transport: {
    getSessionId: (transport) => transport.sessionId,
    setOnClose: (transport, onClose) => { transport.onclose = onClose },
    handleRequest: (transport, rawRequest, rawReply, body) =>
      transport.handleRequest(rawRequest as any, rawReply as any, body),
  },
  request: {
    getMethod: (req) => req.method,
    getHeader: (req, headerName) => req.headers[headerName],
    getBody: (req) => req.body,
    getRawRequest: (req) => req.raw,
  },
  response: {
    send: (reply, statusCode, body) => reply.code(statusCode).send(body),
    hijack: (reply) => reply.hijack(),
    getRawReply: (reply) => reply.raw,
    isSent: (reply) => reply.sent,
  },
})

const injectedMcpDesktopActions = createInjectedMcpRouteActions<FastifyRequest, FastifyReply>({
  protocol: { handleInjectedMcpProtocolRequest },
  tools: injectedMcpToolRouteActions,
})

export const registerDesktopRemoteServerRoutes: RemoteServerRouteRegistrar<
  FastifyInstance,
  FastifyReply
> = (fastify, context) => {
  registerRemoteServerRouteBundle(
    fastify as RemoteServerRouteBundleServer<FastifyRequest, FastifyReply>,
    context,
    {
      operatorRouteActions: operatorRouteDesktopActions,
      mobileApiRouteActions: mobileApiDesktopActions,
      injectedMcpRouteActions: injectedMcpDesktopActions,
    },
  )
}
