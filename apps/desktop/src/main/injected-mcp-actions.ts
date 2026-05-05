import crypto from "crypto"
import { Server as MCPServer } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js"
import type { SessionProfileSnapshot } from "@dotagents/core"
import {
  buildInjectedMcpToolCallErrorResponse,
  buildInjectedMcpToolCallResponse,
  buildInjectedMcpToolsListResponse,
  INJECTED_RUNTIME_TOOL_TRANSPORT_NAME,
  parseInjectedMcpToolCallRequestBody,
} from "@dotagents/shared/mcp-api"
import {
  getAcpSessionForClientSessionToken,
  getAppSessionForAcpSession,
  getPendingAppSessionForClientSessionToken,
} from "./acp-session-state"
import { agentSessionTracker } from "./agent-session-tracker"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"
import { isRuntimeTool } from "./runtime-tools"
import { agentSessionStateManager } from "./state"

interface AcpMcpRequestContext {
  appSessionId: string
  profileSnapshot: SessionProfileSnapshot
}

const INVALID_ACP_SESSION_CONTEXT_ERROR = "Unauthorized: invalid ACP session context"

interface InjectedMcpTransportState {
  server: MCPServer
  transport: StreamableHTTPServerTransport
}

const injectedMcpTransportsByToken = new Map<string, Map<string, InjectedMcpTransportState>>()

function getAcpMcpRequestContext(
  acpSessionToken: string | undefined,
): AcpMcpRequestContext | undefined {
  if (!acpSessionToken) return undefined

  const acpSessionId = getAcpSessionForClientSessionToken(acpSessionToken)
  const appSessionId = (acpSessionId
    ? getAppSessionForAcpSession(acpSessionId)
    : undefined) ?? getPendingAppSessionForClientSessionToken(acpSessionToken)
  if (!appSessionId) return undefined

  const profileSnapshot = agentSessionStateManager.getSessionProfileSnapshot(appSessionId)
    ?? agentSessionTracker.getSessionProfileSnapshot(appSessionId)

  if (!profileSnapshot) return undefined

  return {
    appSessionId,
    profileSnapshot,
  }
}

function getInjectedRuntimeToolsForAcpSession(
  acpSessionToken: string | undefined,
): { requestContext: AcpMcpRequestContext; tools: Array<{ name: string; description: string; inputSchema: unknown }> } | undefined {
  const requestContext = getAcpMcpRequestContext(acpSessionToken)
  if (!requestContext) return undefined

  const tools = mcpService.getAvailableToolsForProfile(requestContext.profileSnapshot.mcpServerConfig)
    .filter((tool) => isRuntimeTool(tool.name))
    .map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }))

  return { requestContext, tools }
}

function getInjectedMcpTransportSessionMap(acpSessionToken: string): Map<string, InjectedMcpTransportState> {
  const existing = injectedMcpTransportsByToken.get(acpSessionToken)
  if (existing) return existing

  const created = new Map<string, InjectedMcpTransportState>()
  injectedMcpTransportsByToken.set(acpSessionToken, created)
  return created
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

export async function listInjectedMcpTools(
  acpSessionToken: string | undefined,
  reply: any,
) {
  try {
    const injectedRuntimeTools = getInjectedRuntimeToolsForAcpSession(acpSessionToken)
    if (!injectedRuntimeTools) {
      diagnosticsService.logWarning("remote-server", "Denied injected MCP tools/list request without valid ACP session context")
      return reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })
    }

    return reply.send(buildInjectedMcpToolsListResponse(injectedRuntimeTools.tools))
  } catch (caughtError: any) {
    diagnosticsService.logError("remote-server", "MCP tools/list error", caughtError)
    return reply.code(500).send({ error: caughtError?.message || "Failed to list tools" })
  }
}

export async function callInjectedMcpTool(
  req: any,
  reply: any,
  acpSessionToken: string | undefined,
) {
  try {
    const injectedRuntimeTools = getInjectedRuntimeToolsForAcpSession(acpSessionToken)
    if (!injectedRuntimeTools) {
      diagnosticsService.logWarning("remote-server", "Denied injected MCP tools/call request without valid ACP session context")
      return reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })
    }

    const parsedRequest = parseInjectedMcpToolCallRequestBody(req.body)
    if (parsedRequest.ok === false) {
      return reply.code(parsedRequest.statusCode).send({ error: parsedRequest.error })
    }
    const { name, arguments: args } = parsedRequest.request

    if (!injectedRuntimeTools.tools.some((tool) => tool.name === name)) {
      return reply.code(400).send({ error: `Unknown runtime tool: ${name}` })
    }

    const result = await mcpService.executeToolCall(
      { name, arguments: args } as any,
      undefined,
      false,
      injectedRuntimeTools.requestContext.appSessionId,
      injectedRuntimeTools.requestContext.profileSnapshot.mcpServerConfig,
    )

    if (!result) {
      return reply.code(500).send({ error: "Tool execution returned null" })
    }

    return reply.send(buildInjectedMcpToolCallResponse(result))
  } catch (caughtError: any) {
    diagnosticsService.logError("remote-server", "MCP tools/call error", caughtError)
    return reply.code(500).send(buildInjectedMcpToolCallErrorResponse(caughtError?.message || "Tool execution failed"))
  }
}

export async function handleInjectedMcpProtocolRequest(
  req: any,
  reply: any,
  acpSessionToken: string | undefined,
) {
  const token = acpSessionToken?.trim()
  if (!token) {
    return reply.code(400).send({ error: "Missing ACP session token" })
  }

  const injectedRuntimeTools = getInjectedRuntimeToolsForAcpSession(token)
  if (!injectedRuntimeTools) {
    diagnosticsService.logWarning("remote-server", `Denied injected MCP ${req.method} request without valid ACP session context`)
    return reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })
  }

  const rawSessionId = req.headers["mcp-session-id"]
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId
  const sessions = getInjectedMcpTransportSessionMap(token)

  try {
    if (req.method === "POST") {
      let sessionState = sessionId ? sessions.get(sessionId) : undefined

      if (!sessionState) {
        if (sessionId) {
          return reply.code(404).send({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Invalid MCP session ID" },
            id: null,
          })
        }

        if (!isInitializeRequest(req.body)) {
          return reply.code(400).send({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: No valid session ID provided" },
            id: null,
          })
        }

        const mcpServer = createInjectedMcpServer(token)
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (createdSessionId) => {
            getInjectedMcpTransportSessionMap(token).set(createdSessionId, {
              server: mcpServer,
              transport,
            })
          },
        })

        transport.onclose = async () => {
          if (transport.sessionId) {
            sessions.delete(transport.sessionId)
          }
          if (sessions.size === 0) {
            injectedMcpTransportsByToken.delete(token)
          }
          await mcpServer.close().catch(() => undefined)
        }

        await mcpServer.connect(transport)
        reply.hijack()
        await transport.handleRequest(req.raw, reply.raw, req.body)
        return reply
      }

      reply.hijack()
      await sessionState.transport.handleRequest(req.raw, reply.raw, req.body)
      return reply
    }

    if (!sessionId) {
      return reply.code(400).send({ error: "Missing MCP session ID" })
    }

    const sessionState = sessions.get(sessionId)
    if (!sessionState) {
      return reply.code(404).send({ error: "Invalid MCP session ID" })
    }

    reply.hijack()
    await sessionState.transport.handleRequest(req.raw, reply.raw)
    return reply
  } catch (caughtError: any) {
    diagnosticsService.logError("remote-server", `Injected MCP ${req.method} error`, caughtError)
    if (!reply.sent) {
      return reply.code(500).send({
        jsonrpc: "2.0",
        error: { code: -32603, message: caughtError?.message || "Internal server error" },
        id: null,
      })
    }
    return reply
  }
}
