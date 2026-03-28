import Fastify, { FastifyInstance } from "fastify"
import cors from "@fastify/cors"
import { Server as MCPServer } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js"
import crypto from "crypto"
import fs from "fs"
import os from "os"
import path from "path"
import {
  formatConversationHistoryMessages,
  resolveChatModelSelection,
} from "@dotagents/shared"
import { configStore, recordingsFolder } from "./config"
import { getConversationIdValidationError } from "./conversation-id"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "./error-utils"
import { mcpService } from "./mcp-service"
import {
  isHeadlessEnvironment,
  printSharedRemoteServerQrCode,
} from "./remote-server-qr"
import { startSharedPromptRun } from "./agent-mode-runner"
import { agentSessionStateManager } from "./state"
import { conversationService } from "./conversation-service"
import {
  getManagedConversation,
  getManagedConversationHistory,
  saveManagedConversation,
} from "./conversation-management"
import {
  getManagedAvailableModels,
  isManagedModelProviderId,
  MANAGED_MODEL_PROVIDER_IDS,
} from "./model-management"
import {
  buildRemoteServerBaseUrl,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_PORT,
  isConnectableRemoteServerIpv6Address as isConnectableIpv6Address,
  isLoopbackRemoteServerHost as isLoopbackHost,
  isUnconnectableRemoteServerHostForMobilePairing as isUnconnectableHostForMobilePairing,
  isWildcardRemoteServerHost as isWildcardBindHost,
  normalizeRemoteServerHostForComparison as normalizeHostForComparison,
} from "../shared/remote-server-url"
import {
  AgentProfile,
  AgentProgressUpdate,
  SessionProfileSnapshot,
  LoopConfig,
} from "../shared/types"
import { agentSessionTracker } from "./agent-session-tracker"
import { emergencyStopAll } from "./emergency-stop"
import {
  sendMessageNotification,
  isPushEnabled,
  clearBadgeCount,
} from "./push-notification-service"
import {
  createManagedKnowledgeNote,
  deleteManagedKnowledgeNote,
  getManagedKnowledgeNote,
  getManagedKnowledgeNotes,
  isManagedKnowledgeNoteFailure,
  updateManagedKnowledgeNote,
} from "./knowledge-note-management"
import {
  createManagedAgentProfile,
  deleteManagedAgentProfile,
  exportManagedAgentProfile,
  getManagedAgentProfile,
  getManagedAgentProfiles,
  getManagedCurrentAgentProfile,
  getManagedUserAgentProfiles,
  importManagedAgentProfile,
  setManagedCurrentAgentProfile,
  toggleManagedAgentProfileEnabled,
  updateManagedAgentProfile,
} from "./agent-profile-management"
import { isRuntimeTool } from "./runtime-tools"
import { agentProfileService } from "./agent-profile-service"
import {
  createManagedLoop,
  deleteManagedLoop,
  getManagedLoopSummaries,
  getManagedLoopSummary,
  saveManagedLoop,
  toggleManagedLoopEnabled,
  triggerManagedLoop,
  updateManagedLoop,
} from "./loop-management"
import {
  getManagedMcpServerSummaries,
  setManagedMcpServerRuntimeEnabled,
} from "./mcp-management"
import { mcpManagementStore } from "./mcp-management-store"
import {
  getManagedCurrentProfileSkills,
  toggleManagedSkillForCurrentProfile,
} from "./profile-skill-management"
import { summarizeLoop, summarizeLoops } from "./loop-summaries"
import {
  getManagedSettingsSnapshot,
  getManagedSettingsUpdates,
  saveManagedConfig,
} from "./settings-management"
import { getRendererHandlers } from "@egoist/tipc/main"
import {
  getAcpSessionForClientSessionToken,
  getAppSessionForAcpSession,
  getPendingAppSessionForClientSessionToken,
} from "./acp-session-state"
import { WINDOWS } from "./window"
import type { RendererHandlers } from "./renderer-handlers"
import { INJECTED_RUNTIME_TOOL_TRANSPORT_NAME } from "../shared/runtime-tool-names"

let server: FastifyInstance | null = null
let lastError: string | undefined

// Track webContents IDs that already have a pending did-finish-load notification queued,
// to avoid registering multiple once-listeners if notifyConversationHistoryChanged() is
// called several times while a window is still loading.
const pendingNotificationWebContentsIds = new Set<number>()

/**
 * Notify all renderer windows that conversation history has changed.
 * Used after remote server creates or modifies conversations (e.g. from mobile).
 * Defers the notification if the window's renderer is still loading to avoid dropped events.
 * Uses pendingNotificationWebContentsIds to deduplicate deferred listeners.
 */
function notifyConversationHistoryChanged(): void {
  const notifiedWebContentsIds = new Set<number>()
  for (const windowId of ["main", "panel"] as const) {
    const win = WINDOWS.get(windowId)
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
      continue
    }
    if (notifiedWebContentsIds.has(win.webContents.id)) {
      continue
    }

    notifiedWebContentsIds.add(win.webContents.id)
    const sendNotification = () => {
      pendingNotificationWebContentsIds.delete(win.webContents.id)
      try {
        getRendererHandlers<RendererHandlers>(
          win.webContents,
        ).conversationHistoryChanged?.send()
      } catch (err) {
        diagnosticsService.logWarning(
          "remote-server",
          `Failed to notify ${windowId} window about conversation history changes: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    if (win.webContents.isLoading()) {
      // Only register a did-finish-load listener if one isn't already pending for this webContents,
      // to avoid listener buildup when called multiple times during window load.
      if (!pendingNotificationWebContentsIds.has(win.webContents.id)) {
        pendingNotificationWebContentsIds.add(win.webContents.id)
        win.webContents.once("did-finish-load", sendNotification)
        // If the window is destroyed before it finishes loading, clean up to prevent
        // the webContents ID from being permanently retained in the pending set.
        win.webContents.once("destroyed", () => {
          pendingNotificationWebContentsIds.delete(win.webContents.id)
        })
      }
    } else {
      sendNotification()
    }
  }
}

function serializeManagedAgentProfileSummary(profile: AgentProfile) {
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description,
    enabled: profile.enabled,
    isBuiltIn: profile.isBuiltIn,
    isUserProfile: profile.isUserProfile,
    isAgentTarget: profile.isAgentTarget,
    isDefault: profile.isDefault,
    role: profile.role,
    connectionType: profile.connection.type,
    autoSpawn: profile.autoSpawn,
    guidelines: profile.guidelines,
    systemPrompt: profile.systemPrompt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

function serializeManagedAgentProfile(profile: AgentProfile) {
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description,
    avatarDataUrl: profile.avatarDataUrl,
    systemPrompt: profile.systemPrompt,
    guidelines: profile.guidelines,
    properties: profile.properties,
    modelConfig: profile.modelConfig,
    toolConfig: profile.toolConfig,
    skillsConfig: profile.skillsConfig,
    connection: profile.connection,
    isStateful: profile.isStateful,
    conversationId: profile.conversationId,
    role: profile.role,
    enabled: profile.enabled,
    isBuiltIn: profile.isBuiltIn,
    isUserProfile: profile.isUserProfile,
    isAgentTarget: profile.isAgentTarget,
    isDefault: profile.isDefault,
    autoSpawn: profile.autoSpawn,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

function getManagedAgentProfileErrorStatusCode(errorCode: string): number {
  switch (errorCode) {
    case "invalid_input":
      return 400
    case "delete_forbidden":
      return 403
    case "not_found":
      return 404
    case "persist_failed":
    default:
      return 500
  }
}

interface AcpMcpRequestContext {
  appSessionId: string
  profileSnapshot: SessionProfileSnapshot
}

const INVALID_ACP_SESSION_CONTEXT_ERROR =
  "Unauthorized: invalid ACP session context"

interface InjectedMcpTransportState {
  server: MCPServer
  transport: StreamableHTTPServerTransport
}

const injectedMcpTransportsByToken = new Map<
  string,
  Map<string, InjectedMcpTransportState>
>()

function getAcpMcpRequestContext(
  acpSessionToken: string | undefined,
): AcpMcpRequestContext | undefined {
  if (!acpSessionToken) return undefined

  const acpSessionId = getAcpSessionForClientSessionToken(acpSessionToken)
  const appSessionId =
    (acpSessionId ? getAppSessionForAcpSession(acpSessionId) : undefined) ??
    getPendingAppSessionForClientSessionToken(acpSessionToken)
  if (!appSessionId) return undefined

  const profileSnapshot =
    agentSessionStateManager.getSessionProfileSnapshot(appSessionId) ??
    agentSessionTracker.getSessionProfileSnapshot(appSessionId)

  if (!profileSnapshot) return undefined

  return {
    appSessionId,
    profileSnapshot,
  }
}

function getInjectedRuntimeToolsForAcpSession(
  acpSessionToken: string | undefined,
):
  | {
      requestContext: AcpMcpRequestContext
      tools: Array<{ name: string; description: string; inputSchema: unknown }>
    }
  | undefined {
  const requestContext = getAcpMcpRequestContext(acpSessionToken)
  if (!requestContext) return undefined

  const tools = mcpService
    .getAvailableToolsForProfile(requestContext.profileSnapshot.mcpServerConfig)
    .filter((tool) => isRuntimeTool(tool.name))
    .map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }))

  return { requestContext, tools }
}

function getInjectedMcpTransportSessionMap(
  acpSessionToken: string,
): Map<string, InjectedMcpTransportState> {
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
    const injectedRuntimeTools =
      getInjectedRuntimeToolsForAcpSession(acpSessionToken)
    if (!injectedRuntimeTools) {
      throw new Error(INVALID_ACP_SESSION_CONTEXT_ERROR)
    }

    return { tools: injectedRuntimeTools.tools }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const injectedRuntimeTools =
      getInjectedRuntimeToolsForAcpSession(acpSessionToken)
    if (!injectedRuntimeTools) {
      return {
        content: [{ type: "text", text: INVALID_ACP_SESSION_CONTEXT_ERROR }],
        isError: true,
      }
    }

    const { name, arguments: args } = request.params
    if (!name || typeof name !== "string") {
      return {
        content: [
          { type: "text", text: "Missing or invalid 'name' parameter" },
        ],
        isError: true,
      }
    }

    if (!injectedRuntimeTools.tools.some((tool) => tool.name === name)) {
      return {
        content: [{ type: "text", text: `Unknown runtime tool: ${name}` }],
        isError: true,
      }
    }

    const result = await mcpService.executeToolCall(
      { name, arguments: args || {} } as any,
      undefined,
      false,
      injectedRuntimeTools.requestContext.appSessionId,
      injectedRuntimeTools.requestContext.profileSnapshot.mcpServerConfig,
    )

    return result
      ? {
          content: result.content,
          isError: result.isError,
        }
      : {
          content: [{ type: "text", text: "Tool execution returned null" }],
          isError: true,
        }
  })

  return server
}

/**
 * Gets a connectable IP address for the QR code URL
 * When bind is 0.0.0.0, we find the actual LAN IP that a mobile device can connect to.
 * When bind is 127.0.0.1 or localhost, the server is bound to loopback only and cannot
 * accept connections from mobile devices - we warn and return the original address.
 */
interface ConnectableIpOptions {
  warn?: boolean
}

function getConnectableIp(
  bind: string,
  options: ConnectableIpOptions = {},
): string {
  const { warn = true } = options
  const normalizedBind = normalizeHostForComparison(bind)

  // If bound to loopback, warn that mobile devices cannot connect
  if (isLoopbackHost(normalizedBind)) {
    if (warn) {
      console.warn(
        `[Remote Server] Warning: Server is bound to ${normalizedBind} (loopback only). ` +
          `Mobile devices on the same network cannot connect. ` +
          `Change bind address to 0.0.0.0 or your LAN IP for mobile access.`,
      )
    }
    return normalizedBind
  }

  // If already a specific IP (not wildcard), use it
  if (!isWildcardBindHost(normalizedBind)) {
    return normalizedBind
  }

  const wildcardWantsIpv6 = normalizedBind === "::"
  let firstIpv4Address: string | undefined
  let firstIpv6Address: string | undefined

  // For wildcard binds, discover LAN-reachable interface addresses.
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const addrs = interfaces[name]
    if (!addrs) continue
    for (const addr of addrs) {
      if (addr.internal) {
        continue
      }
      if (addr.family === "IPv4" && !firstIpv4Address) {
        firstIpv4Address = addr.address
      }
      if (
        addr.family === "IPv6" &&
        !firstIpv6Address &&
        isConnectableIpv6Address(addr.address)
      ) {
        firstIpv6Address = addr.address
      }
    }
  }

  if (wildcardWantsIpv6) {
    if (firstIpv6Address) {
      return firstIpv6Address
    }
    // Some platforms expose dual-stack sockets for ::, so IPv4 can still be connectable.
    if (firstIpv4Address) {
      return firstIpv4Address
    }
  } else if (firstIpv4Address) {
    return firstIpv4Address
  }

  // Fallback to the original bind address with a warning
  if (warn) {
    const expectedFamily = wildcardWantsIpv6 ? "IPv6" : "IPv4"
    console.warn(
      `[Remote Server] Warning: Could not find LAN ${expectedFamily} address. QR code will use ${normalizedBind} which may not be reachable from mobile devices.`,
    )
  }
  return normalizedBind
}

function getConnectableBaseUrlForMobilePairing(
  bind: string,
  port: number,
  options: ConnectableIpOptions = {},
): string | undefined {
  const connectableHost = getConnectableIp(bind, options)
  if (isUnconnectableHostForMobilePairing(connectableHost)) {
    return undefined
  }
  return buildRemoteServerBaseUrl(connectableHost, port)
}

function toOpenAIChatResponse(content: string, model: string) {
  return {
    id: `chatcmpl-${Date.now().toString(36)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
  }
}

function normalizeContent(content: any): string | null {
  if (!content) return null
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    const parts = content
      .map((p) => {
        if (typeof p === "string") return p
        if (p && typeof p === "object") {
          if (typeof p.text === "string") return p.text
          if (typeof p.content === "string") return p.content
        }
        return ""
      })
      .filter(Boolean)
    return parts.length ? parts.join(" ") : null
  }
  if (typeof content === "object" && content !== null) {
    if (typeof (content as any).text === "string") return (content as any).text
  }
  return null
}

function extractUserPrompt(body: any): string | null {
  try {
    if (!body || typeof body !== "object") return null

    if (Array.isArray(body.messages)) {
      for (let i = body.messages.length - 1; i >= 0; i--) {
        const msg = body.messages[i]
        const role = String(msg?.role || "").toLowerCase()
        if (role === "user") {
          const c = normalizeContent(msg?.content)
          if (c && c.trim()) return c.trim()
        }
      }
    }

    const prompt = normalizeContent(body.prompt)
    if (prompt && prompt.trim()) return prompt.trim()

    const input = normalizeContent(body.input)
    if (input && input.trim()) return input.trim()

    return null
  } catch {
    return null
  }
}

interface RunAgentOptions {
  prompt: string
  conversationId?: string
  onProgress?: (update: AgentProgressUpdate) => void
}

async function runAgent(options: RunAgentOptions): Promise<{
  content: string
  conversationId: string
  conversationHistory: Array<{
    role: "user" | "assistant" | "tool"
    content: string
    toolCalls?: Array<{ name: string; arguments: any }>
    toolResults?: Array<{ success: boolean; content: string; error?: string }>
    timestamp?: number
  }>
}> {
  const { prompt, conversationId: inputConversationId, onProgress } = options
  const cfg = configStore.get()
  const startSnoozed = !cfg.remoteServerAutoShowPanel

  const {
    preparedContext: {
      conversationId,
      previousConversationHistory,
      sessionId,
      reusedExistingSession,
    },
    runPromise,
  } = await startSharedPromptRun({
    prompt,
    requestedConversationId: inputConversationId,
    startSnoozed,
    preserveActiveSessionSnoozeState: true,
    approvalMode: "dialog",
    onProgress,
  })
  const sessionSummary = reusedExistingSession
    ? `reused session ${sessionId}`
    : "started a new session"
  diagnosticsService.logInfo(
    "remote-server",
    previousConversationHistory.length > 0
      ? `Prepared conversation ${conversationId} with ${previousConversationHistory.length} previous messages (${sessionSummary})`
      : `Prepared conversation ${conversationId} for a new run (${sessionSummary})`,
  )

  const loadFormattedConversationHistory = async () => {
    const latestConversation =
      await conversationService.loadConversation(conversationId)
    return formatConversationHistoryMessages(latestConversation?.messages || [])
  }

  try {
    const agentResult = await runPromise

    // Format conversation history for API response (convert MCPToolResult to ToolResult format)
    const formattedHistory = await loadFormattedConversationHistory()

    // Notify renderer that conversation history has changed (for sidebar refresh)
    notifyConversationHistoryChanged()

    return {
      content: agentResult.content,
      conversationId,
      conversationHistory: formattedHistory,
    }
  } catch (error) {
    // Conversation was already created/updated before agent execution started.
    // Refresh renderer history even on failure so UI reflects the latest persisted state.
    notifyConversationHistoryChanged()

    throw error
  }
}

function recordHistory(transcript: string) {
  try {
    fs.mkdirSync(recordingsFolder, { recursive: true })
    const historyPath = path.join(recordingsFolder, "history.json")
    let history: Array<{
      id: string
      createdAt: number
      duration: number
      transcript: string
    }>
    try {
      history = JSON.parse(fs.readFileSync(historyPath, "utf8"))
    } catch {
      history = []
    }

    const item = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      duration: 0,
      transcript,
    }
    history.push(item)
    fs.writeFileSync(historyPath, JSON.stringify(history))
  } catch (e) {
    diagnosticsService.logWarning(
      "remote-server",
      "Failed to record history item",
      e,
    )
  }
}

/**
 * Starts the remote server, forcing it to be enabled regardless of config.
 * Used by --qr mode to ensure the server starts even if remoteServerEnabled is false.
 * Also skips the auto-print of QR codes since --qr mode handles that separately.
 */
export async function startRemoteServerForced(
  options: { bindAddressOverride?: string } = {},
) {
  return startRemoteServerInternal({
    forceEnabled: true,
    skipAutoPrintQR: true,
    bindAddressOverride: options.bindAddressOverride,
  })
}

export async function startRemoteServer() {
  return startRemoteServerInternal({
    forceEnabled: false,
    skipAutoPrintQR: false,
  })
}

interface StartRemoteServerOptions {
  forceEnabled?: boolean
  skipAutoPrintQR?: boolean
  bindAddressOverride?: string
}

async function startRemoteServerInternal(
  options: StartRemoteServerOptions = {},
) {
  const {
    forceEnabled = false,
    skipAutoPrintQR = false,
    bindAddressOverride,
  } = options
  const cfg = configStore.get()
  if (!forceEnabled && !cfg.remoteServerEnabled) {
    diagnosticsService.logInfo(
      "remote-server",
      "Remote server not enabled in config; skipping start",
    )
    return { running: false }
  }

  if (!cfg.remoteServerApiKey) {
    // Generate API key on first enable
    const key = crypto.randomBytes(32).toString("hex")
    configStore.save({ ...cfg, remoteServerApiKey: key })
  }

  if (server) {
    diagnosticsService.logInfo(
      "remote-server",
      "Remote server already running; restarting",
    )
    await stopRemoteServer()
  }

  lastError = undefined
  const logLevel = cfg.remoteServerLogLevel || "info"
  const bind =
    bindAddressOverride ||
    cfg.remoteServerBindAddress ||
    DEFAULT_REMOTE_SERVER_BIND_ADDRESS
  const port = cfg.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT

  const fastify = Fastify({ logger: { level: logLevel } })

  // Configure CORS
  const corsOrigins = cfg.remoteServerCorsOrigins || ["*"]
  await fastify.register(cors, {
    // When origin is ["*"] or includes "*", use true to reflect the request origin
    // This is needed because credentials: true doesn't work with literal "*"
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
    preflight: true, // Enable preflight pass-through
    strictPreflight: false, // Don't be strict about preflight requests
  })

  // Auth hook (skip for OPTIONS preflight requests)
  fastify.addHook("onRequest", async (req, reply) => {
    // Skip auth for OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      return
    }

    const auth = (req.headers["authorization"] || "").toString()
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
    const current = configStore.get()
    if (!token || token !== current.remoteServerApiKey) {
      reply.code(401).send({ error: "Unauthorized" })
      return
    }
  })

  // Routes
  fastify.post("/v1/chat/completions", async (req, reply) => {
    try {
      const body = req.body as any
      const prompt = extractUserPrompt(body)
      if (!prompt) {
        return reply.code(400).send({ error: "Missing user prompt" })
      }

      // Extract conversationId from request body (custom extension to OpenAI API)
      // Use undefined for absent/non-string values; treat empty string as absent
      const rawConversationId =
        typeof body.conversation_id === "string"
          ? body.conversation_id
          : undefined
      const conversationId =
        rawConversationId !== "" ? rawConversationId : undefined
      if (conversationId) {
        const conversationIdError =
          getConversationIdValidationError(conversationId)
        if (conversationIdError) {
          return reply.code(400).send({ error: conversationIdError })
        }
      }
      // Check if client wants SSE streaming
      const isStreaming = body.stream === true

      console.log("[remote-server] Chat request:", {
        conversationId: conversationId || "new",
        promptLength: prompt.length,
        streaming: isStreaming,
      })
      diagnosticsService.logInfo(
        "remote-server",
        `Handling completion request${conversationId ? ` for conversation ${conversationId}` : ""}${isStreaming ? " (streaming)" : ""}`,
      )

      if (isStreaming) {
        // SSE streaming mode
        // Get the request origin for CORS
        const requestOrigin = req.headers.origin || "*"
        reply.raw.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": requestOrigin,
          "Access-Control-Allow-Credentials": "true",
        })

        // Helper to write SSE events
        const writeSSE = (data: object) => {
          reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
        }

        // Create progress callback that emits SSE events
        const onProgress = (update: AgentProgressUpdate) => {
          writeSSE({ type: "progress", data: update })
        }

        try {
          const result = await runAgent({ prompt, conversationId, onProgress })

          // Record as if user submitted a text input
          recordHistory(result.content)

          const { model } = resolveChatModelSelection(configStore.get())

          // Send final "done" event with full response data
          writeSSE({
            type: "done",
            data: {
              content: result.content,
              conversation_id: result.conversationId,
              conversation_history: result.conversationHistory,
              model,
            },
          })

          // Send push notification by default if tokens are registered
          // Client can set send_push_notification: false to explicitly disable
          const shouldSendPush =
            body.send_push_notification !== false && isPushEnabled()
          if (shouldSendPush) {
            const conversationTitle =
              prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt
            // Fire and forget - don't block the response
            sendMessageNotification(
              result.conversationId,
              conversationTitle,
              result.content,
            ).catch((err) => {
              diagnosticsService.logWarning(
                "remote-server",
                "Failed to send push notification",
                err,
              )
            })
          }
        } catch (error: any) {
          // Send error event
          writeSSE({
            type: "error",
            data: { message: error?.message || "Internal Server Error" },
          })
        } finally {
          reply.raw.end()
        }

        // Return reply to indicate we've handled the response
        return reply
      }

      // Non-streaming mode (existing behavior)
      const result = await runAgent({ prompt, conversationId })

      // Record as if user submitted a text input
      recordHistory(result.content)

      const { model } = resolveChatModelSelection(configStore.get())
      // Return standard OpenAI response with conversation_id as custom field
      const response = toOpenAIChatResponse(result.content, model)

      console.log("[remote-server] Chat response:", {
        conversationId: result.conversationId,
        responseLength: result.content.length,
      })

      // Send push notification by default if tokens are registered
      // Client can set send_push_notification: false to explicitly disable
      const shouldSendPush =
        body.send_push_notification !== false && isPushEnabled()
      if (shouldSendPush) {
        const conversationTitle =
          prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt
        // Fire and forget - don't block the response
        sendMessageNotification(
          result.conversationId,
          conversationTitle,
          result.content,
        ).catch((err) => {
          diagnosticsService.logWarning(
            "remote-server",
            "Failed to send push notification",
            err,
          )
        })
      }

      return reply.send({
        ...response,
        conversation_id: result.conversationId, // Include conversation_id for client to use in follow-ups
        conversation_history: result.conversationHistory, // Include full conversation history with tool calls/results
      })
    } catch (error: any) {
      diagnosticsService.logError("remote-server", "Handler error", error)
      return reply.code(500).send({ error: "Internal Server Error" })
    }
  })

  fastify.get("/v1/models", async (_req, reply) => {
    const { model } = resolveChatModelSelection(configStore.get())
    return reply.send({
      object: "list",
      data: [{ id: model, object: "model", owned_by: "system" }],
    })
  })

  // GET /v1/models/:providerId - Fetch available models for a provider
  fastify.get("/v1/models/:providerId", async (req, reply) => {
    try {
      const params = req.params as { providerId: string }
      const providerId = params.providerId

      if (!isManagedModelProviderId(providerId)) {
        return reply.code(400).send({
          error: `Invalid provider: ${providerId}. Valid providers: ${MANAGED_MODEL_PROVIDER_IDS.join(", ")}`,
        })
      }

      const models = await getManagedAvailableModels(providerId)

      return reply.send({
        providerId,
        models: models.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          context_length: m.context_length,
        })),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to fetch models",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to fetch models" })
    }
  })

  // ============================================
  // Settings Management Endpoints (for mobile app)
  // ============================================

  // GET /v1/profiles - List all profiles
  fastify.get("/v1/profiles", async (_req, reply) => {
    try {
      const profiles = getManagedUserAgentProfiles()
      const currentProfile = getManagedCurrentAgentProfile()
      return reply.send({
        profiles: profiles.map((p) => ({
          id: p.id,
          name: p.displayName,
          isDefault: p.isDefault,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        currentProfileId: currentProfile?.id,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get profiles",
        error,
      )
      return reply.code(500).send({ error: "Failed to get profiles" })
    }
  })

  // GET /v1/profiles/current - Get current profile details
  fastify.get("/v1/profiles/current", async (_req, reply) => {
    try {
      const profile = getManagedCurrentAgentProfile()
      if (!profile) {
        return reply.code(404).send({ error: "No current profile set" })
      }
      return reply.send({
        id: profile.id,
        name: profile.displayName,
        isDefault: profile.isDefault,
        guidelines: profile.guidelines || "",
        systemPrompt: profile.systemPrompt,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get current profile",
        error,
      )
      return reply.code(500).send({ error: "Failed to get current profile" })
    }
  })

  // POST /v1/profiles/current - Set current profile
  fastify.post("/v1/profiles/current", async (req, reply) => {
    try {
      const body = req.body as any
      const profileId = body?.profileId
      if (!profileId || typeof profileId !== "string") {
        return reply.code(400).send({ error: "Missing or invalid profileId" })
      }
      const result = setManagedCurrentAgentProfile(profileId)
      if (!result.success) {
        return reply
          .code(result.errorCode === "not_found" ? 404 : 400)
          .send({ error: result.error })
      }
      const profile = result.profile
      diagnosticsService.logInfo(
        "remote-server",
        `Switched to profile: ${profile.displayName}`,
      )
      return reply.send({
        success: true,
        profile: {
          id: profile.id,
          name: profile.name,
          isDefault: profile.isDefault,
        },
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to set current profile",
        error,
      )
      return reply.code(500).send({
        error: error?.message || "Failed to set current profile",
      })
    }
  })

  // GET /v1/profiles/:id/export - Export a profile as JSON
  fastify.get("/v1/profiles/:id/export", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const result = exportManagedAgentProfile(params.id)
      if (!result.success) {
        return reply
          .code(result.errorCode === "not_found" ? 404 : 500)
          .send({ error: result.error })
      }
      return reply.send({ profileJson: result.profileJson })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to export profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to export profile" })
    }
  })

  // POST /v1/profiles/import - Import a profile from JSON
  fastify.post("/v1/profiles/import", async (req, reply) => {
    try {
      const body = req.body as any
      const profileJson = body?.profileJson
      if (!profileJson || typeof profileJson !== "string") {
        return reply.code(400).send({ error: "Missing or invalid profileJson" })
      }
      const result = importManagedAgentProfile(profileJson)
      if (!result.success) {
        return reply
          .code(result.errorCode === "invalid_input" ? 400 : 500)
          .send({ error: result.error })
      }
      const profile = result.profile
      diagnosticsService.logInfo(
        "remote-server",
        `Imported profile: ${profile.displayName}`,
      )
      return reply.send({
        success: true,
        profile: {
          id: profile.id,
          name: profile.displayName,
          isDefault: profile.isDefault,
        },
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to import profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to import profile" })
    }
  })

  // GET /v1/mcp/servers - List MCP servers with status
  fastify.get("/v1/mcp/servers", async (_req, reply) => {
    try {
      const servers = getManagedMcpServerSummaries(mcpManagementStore)
      return reply.send({ servers })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get MCP servers",
        error,
      )
      return reply.code(500).send({ error: "Failed to get MCP servers" })
    }
  })

  // POST /v1/mcp/servers/:name/toggle - Toggle MCP server enabled/disabled
  fastify.post("/v1/mcp/servers/:name/toggle", async (req, reply) => {
    try {
      const params = req.params as { name: string }
      const body = req.body as any
      const serverName = params.name
      const enabled = body?.enabled

      if (typeof enabled !== "boolean") {
        return reply
          .code(400)
          .send({ error: "Missing or invalid 'enabled' boolean" })
      }

      const result = setManagedMcpServerRuntimeEnabled(
        serverName,
        enabled,
        mcpManagementStore,
      )
      if (!result.success) {
        return reply
          .code(404)
          .send({ error: result.error || `Server '${serverName}' not found` })
      }

      diagnosticsService.logInfo(
        "remote-server",
        `Toggled MCP server ${serverName} to ${enabled ? "enabled" : "disabled"}`,
      )
      return reply.send({
        success: true,
        server: serverName,
        enabled,
        state: result.server?.state,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to toggle MCP server",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to toggle MCP server" })
    }
  })

  // GET /v1/settings - Get relevant settings for mobile app
  fastify.get("/v1/settings", async (_req, reply) => {
    try {
      return reply.send(getManagedSettingsSnapshot())
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get settings",
        error,
      )
      return reply.code(500).send({ error: "Failed to get settings" })
    }
  })

  // PATCH /v1/settings - Update settings
  fastify.patch("/v1/settings", async (req, reply) => {
    try {
      const body = req.body as any
      const updates = getManagedSettingsUpdates(body)
      if (Object.keys(updates).length === 0) {
        return reply.code(400).send({ error: "No valid settings to update" })
      }

      await saveManagedConfig(updates, {
        remoteAccessLabel: "remote-settings",
      })
      diagnosticsService.logInfo(
        "remote-server",
        `Updated settings: ${Object.keys(updates).join(", ")}`,
      )

      return reply.send({
        success: true,
        updated: Object.keys(updates),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to update settings",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to update settings" })
    }
  })

  // ============================================
  // Conversation Recovery Endpoints (for mobile app)
  // ============================================

  // GET /v1/conversations/:id - Fetch conversation state for recovery
  fastify.get("/v1/conversations/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const conversationId = params.id

      if (!conversationId || typeof conversationId !== "string") {
        return reply
          .code(400)
          .send({ error: "Missing or invalid conversation ID" })
      }

      // Validate conversation ID format to prevent path traversal attacks
      const conversationIdError =
        getConversationIdValidationError(conversationId)
      if (conversationIdError) {
        return reply.code(400).send({ error: conversationIdError })
      }

      const conversation = await getManagedConversation(conversationId)

      if (!conversation) {
        return reply.code(404).send({ error: "Conversation not found" })
      }

      diagnosticsService.logInfo(
        "remote-server",
        `Fetched conversation ${conversationId} for recovery`,
      )

      return reply.send({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
        })),
        metadata: conversation.metadata,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to fetch conversation",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to fetch conversation" })
    }
  })

  // ============================================
  // Push Notification Endpoints (for mobile app)
  // ============================================

  // POST /v1/push/register - Register a push notification token
  fastify.post("/v1/push/register", async (req, reply) => {
    try {
      const body = req.body as {
        token?: string
        type?: string
        platform?: string
        deviceId?: string
      }

      if (!body.token || typeof body.token !== "string") {
        return reply.code(400).send({ error: "Missing or invalid token" })
      }

      if (!body.platform || !["ios", "android"].includes(body.platform)) {
        return reply
          .code(400)
          .send({ error: "Invalid platform. Must be 'ios' or 'android'" })
      }

      const cfg = configStore.get()
      const existingTokens = cfg.pushNotificationTokens || []

      // Check if token already exists
      const existingIndex = existingTokens.findIndex(
        (t) => t.token === body.token,
      )
      const newToken = {
        token: body.token,
        type: "expo" as const,
        platform: body.platform as "ios" | "android",
        registeredAt: Date.now(),
        deviceId: body.deviceId,
      }

      let updatedTokens: typeof existingTokens
      if (existingIndex >= 0) {
        // Update existing token
        updatedTokens = [...existingTokens]
        updatedTokens[existingIndex] = newToken
        diagnosticsService.logInfo(
          "remote-server",
          `Updated push notification token for ${body.platform}`,
        )
      } else {
        // Add new token
        updatedTokens = [...existingTokens, newToken]
        diagnosticsService.logInfo(
          "remote-server",
          `Registered new push notification token for ${body.platform}`,
        )
      }

      configStore.save({ ...cfg, pushNotificationTokens: updatedTokens })

      return reply.send({
        success: true,
        message: existingIndex >= 0 ? "Token updated" : "Token registered",
        tokenCount: updatedTokens.length,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to register push token",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to register push token" })
    }
  })

  // POST /v1/push/unregister - Unregister a push notification token
  fastify.post("/v1/push/unregister", async (req, reply) => {
    try {
      const body = req.body as { token?: string }

      if (!body.token || typeof body.token !== "string") {
        return reply.code(400).send({ error: "Missing or invalid token" })
      }

      const cfg = configStore.get()
      const existingTokens = cfg.pushNotificationTokens || []

      const filteredTokens = existingTokens.filter(
        (t) => t.token !== body.token,
      )
      const removed = existingTokens.length > filteredTokens.length

      if (removed) {
        configStore.save({ ...cfg, pushNotificationTokens: filteredTokens })
        diagnosticsService.logInfo(
          "remote-server",
          "Unregistered push notification token",
        )
      }

      return reply.send({
        success: true,
        message: removed ? "Token unregistered" : "Token not found",
        tokenCount: filteredTokens.length,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to unregister push token",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to unregister push token" })
    }
  })

  // GET /v1/push/status - Get push notification status
  fastify.get("/v1/push/status", async (_req, reply) => {
    try {
      const cfg = configStore.get()
      const tokens = cfg.pushNotificationTokens || []

      return reply.send({
        enabled: tokens.length > 0,
        tokenCount: tokens.length,
        platforms: [...new Set(tokens.map((t) => t.platform))],
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get push status",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to get push status" })
    }
  })

  // POST /v1/push/clear-badge - Clear badge count for a token (called when mobile app opens)
  fastify.post("/v1/push/clear-badge", async (req, reply) => {
    try {
      const body = req.body as { token?: string }

      if (!body.token || typeof body.token !== "string") {
        return reply.code(400).send({ error: "Missing or invalid token" })
      }

      clearBadgeCount(body.token)

      return reply.send({ success: true })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to clear badge count",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to clear badge count" })
    }
  })

  // Helper function to validate message objects
  const validateMessages = (
    messages: Array<{ role: string; content: unknown }>,
  ): string | null => {
    const validRoles = ["user", "assistant", "tool"]
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg === null || msg === undefined || typeof msg !== "object") {
        return `Invalid message ${i}: expected an object`
      }
      if (!msg.role || !validRoles.includes(msg.role)) {
        return `Invalid role in message ${i}: expected one of ${validRoles.join(", ")}`
      }
      if (typeof msg.content !== "string") {
        return `Invalid content in message ${i}: expected string`
      }
    }
    return null
  }

  // GET /v1/conversations - List all conversations
  fastify.get("/v1/conversations", async (_req, reply) => {
    try {
      const conversations = await getManagedConversationHistory()
      diagnosticsService.logInfo(
        "remote-server",
        `Listed ${conversations.length} conversations`,
      )
      return reply.send({ conversations })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to list conversations",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to list conversations" })
    }
  })

  // POST /v1/conversations - Create a new conversation from mobile data
  fastify.post("/v1/conversations", async (req, reply) => {
    try {
      // Validate request body is a valid object
      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return reply
          .code(400)
          .send({ error: "Request body must be a JSON object" })
      }

      const body = req.body as {
        title?: string
        messages: Array<{
          role: "user" | "assistant" | "tool"
          content: string
          timestamp?: number
          toolCalls?: Array<{ name: string; arguments: any }>
          toolResults?: Array<{
            success: boolean
            content: string
            error?: string
          }>
        }>
        createdAt?: number
        updatedAt?: number
      }

      if (
        !body.messages ||
        !Array.isArray(body.messages) ||
        body.messages.length === 0
      ) {
        return reply
          .code(400)
          .send({ error: "Missing or invalid messages array" })
      }

      // Validate each message object
      const validationError = validateMessages(body.messages)
      if (validationError) {
        return reply.code(400).send({ error: validationError })
      }

      const conversationId = conversationService.generateConversationIdPublic()
      const now = Date.now()

      // Generate title from first message if not provided
      const firstMessageContent = body.messages[0]?.content || ""
      const title =
        body.title ||
        (firstMessageContent.length > 50
          ? `${firstMessageContent.slice(0, 50)}...`
          : firstMessageContent || "New Conversation")

      // Convert input messages to ConversationMessage format with IDs
      const messages = body.messages.map((msg, index) => ({
        id: `msg_${now}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ?? now,
        toolCalls: msg.toolCalls,
        toolResults: msg.toolResults,
      }))

      const conversation = {
        id: conversationId,
        title,
        createdAt: body.createdAt ?? now,
        updatedAt: body.updatedAt ?? now,
        messages,
      }

      await saveManagedConversation(conversation, { preserveTimestamp: true })
      diagnosticsService.logInfo(
        "remote-server",
        `Created conversation ${conversationId} with ${messages.length} messages`,
      )

      // Notify renderer that conversation history has changed (for sidebar refresh)
      notifyConversationHistoryChanged()

      return reply.code(201).send({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
        })),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to create conversation",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to create conversation" })
    }
  })

  // PUT /v1/conversations/:id - Update an existing conversation
  fastify.put("/v1/conversations/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const conversationId = params.id

      if (!conversationId || typeof conversationId !== "string") {
        return reply
          .code(400)
          .send({ error: "Missing or invalid conversation ID" })
      }

      // Validate conversation ID format to prevent path traversal attacks
      const conversationIdError =
        getConversationIdValidationError(conversationId)
      if (conversationIdError) {
        return reply.code(400).send({ error: conversationIdError })
      }

      // Validate request body is a valid object
      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return reply
          .code(400)
          .send({ error: "Request body must be a JSON object" })
      }

      const body = req.body as {
        title?: string
        messages?: Array<{
          role: "user" | "assistant" | "tool"
          content: string
          timestamp?: number
          toolCalls?: Array<{ name: string; arguments: any }>
          toolResults?: Array<{
            success: boolean
            content: string
            error?: string
          }>
        }>
        updatedAt?: number
      }

      const now = Date.now()
      let conversation = await getManagedConversation(conversationId)

      if (!conversation) {
        // Create new conversation with the provided ID
        if (
          !body.messages ||
          !Array.isArray(body.messages) ||
          body.messages.length === 0
        ) {
          return reply.code(400).send({
            error:
              "Conversation not found and no messages provided to create it",
          })
        }

        // Validate each message object
        const validationError = validateMessages(body.messages)
        if (validationError) {
          return reply.code(400).send({ error: validationError })
        }

        const firstMessageContent = body.messages[0]?.content || ""
        const title =
          body.title ||
          (firstMessageContent.length > 50
            ? `${firstMessageContent.slice(0, 50)}...`
            : firstMessageContent || "New Conversation")

        const messages = body.messages.map((msg, index) => ({
          id: `msg_${now}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ?? now,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
        }))

        conversation = {
          id: conversationId,
          title,
          createdAt: now,
          updatedAt: body.updatedAt ?? now,
          messages,
        }

        await saveManagedConversation(conversation, {
          preserveTimestamp: true,
        })
        diagnosticsService.logInfo(
          "remote-server",
          `Created conversation ${conversationId} via PUT with ${messages.length} messages`,
        )
      } else {
        // Update existing conversation
        if (body.title !== undefined) {
          conversation.title = body.title
        }

        if (body.messages !== undefined && !Array.isArray(body.messages)) {
          return reply
            .code(400)
            .send({ error: "messages field must be an array" })
        }

        if (body.messages && Array.isArray(body.messages)) {
          // Validate each message object
          const validationError = validateMessages(body.messages)
          if (validationError) {
            return reply.code(400).send({ error: validationError })
          }

          conversation.messages = body.messages.map((msg, index) => ({
            id: `msg_${now}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp ?? now,
            toolCalls: msg.toolCalls,
            toolResults: msg.toolResults,
          }))
        }

        conversation.updatedAt = body.updatedAt ?? now

        await saveManagedConversation(conversation, {
          preserveTimestamp: true,
        })
        diagnosticsService.logInfo(
          "remote-server",
          `Updated conversation ${conversationId}`,
        )
      }

      // Notify renderer that conversation history has changed (for sidebar refresh)
      notifyConversationHistoryChanged()

      return reply.send({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
        })),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to update conversation",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to update conversation" })
    }
  })

  // Kill switch endpoint - emergency stop all agent sessions
  fastify.post("/v1/emergency-stop", async (_req, reply) => {
    console.log("[KILLSWITCH] /v1/emergency-stop endpoint called")
    try {
      console.log("[KILLSWITCH] Loading emergency-stop module...")
      diagnosticsService.logInfo(
        "remote-server",
        "Emergency stop triggered via API",
      )

      console.log("[KILLSWITCH] Calling emergencyStopAll()...")
      const { before, after } = await emergencyStopAll()

      console.log(
        `[KILLSWITCH] Emergency stop completed. Killed ${before} processes. Remaining: ${after}`,
      )
      diagnosticsService.logInfo(
        "remote-server",
        `Emergency stop completed. Killed ${before} processes. Remaining: ${after}`,
      )

      return reply.send({
        success: true,
        message: "Emergency stop executed",
        processesKilled: before,
        processesRemaining: after,
      })
    } catch (error: any) {
      console.error("[KILLSWITCH] Error during emergency stop:", error)
      diagnosticsService.logError(
        "remote-server",
        "Emergency stop error",
        error,
      )
      return reply.code(500).send({
        success: false,
        error: error?.message || "Emergency stop failed",
      })
    }
  })

  // MCP Protocol Endpoints - Expose DotAgents runtime tools to external agents
  // Support both Streamable HTTP MCP at /mcp/:acpSessionToken and legacy /tools/list,/tools/call shims.

  const listInjectedMcpTools = async (
    acpSessionToken: string | undefined,
    reply: any,
  ) => {
    try {
      const injectedRuntimeTools =
        getInjectedRuntimeToolsForAcpSession(acpSessionToken)
      if (!injectedRuntimeTools) {
        diagnosticsService.logWarning(
          "remote-server",
          "Denied injected MCP tools/list request without valid ACP session context",
        )
        return reply
          .code(401)
          .send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })
      }

      return reply.send({ tools: injectedRuntimeTools.tools })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "MCP tools/list error",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to list tools" })
    }
  }

  const callInjectedMcpTool = async (
    req: any,
    reply: any,
    acpSessionToken: string | undefined,
  ) => {
    try {
      const injectedRuntimeTools =
        getInjectedRuntimeToolsForAcpSession(acpSessionToken)
      if (!injectedRuntimeTools) {
        diagnosticsService.logWarning(
          "remote-server",
          "Denied injected MCP tools/call request without valid ACP session context",
        )
        return reply
          .code(401)
          .send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })
      }

      const body = req.body as any
      const { name, arguments: args } = body

      if (!name || typeof name !== "string") {
        return reply
          .code(400)
          .send({ error: "Missing or invalid 'name' parameter" })
      }

      if (!injectedRuntimeTools.tools.some((tool) => tool.name === name)) {
        return reply.code(400).send({ error: `Unknown runtime tool: ${name}` })
      }

      const result = await mcpService.executeToolCall(
        { name, arguments: args || {} } as any,
        undefined,
        false,
        injectedRuntimeTools.requestContext.appSessionId,
        injectedRuntimeTools.requestContext.profileSnapshot.mcpServerConfig,
      )

      if (!result) {
        return reply.code(500).send({ error: "Tool execution returned null" })
      }

      return reply.send({
        content: result.content,
        isError: result.isError,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "MCP tools/call error",
        error,
      )
      return reply.code(500).send({
        content: [
          { type: "text", text: error?.message || "Tool execution failed" },
        ],
        isError: true,
      })
    }
  }

  const handleInjectedMcpProtocolRequest = async (
    req: any,
    reply: any,
    acpSessionToken: string | undefined,
  ) => {
    const token = acpSessionToken?.trim()
    if (!token) {
      return reply.code(400).send({ error: "Missing ACP session token" })
    }

    const injectedRuntimeTools = getInjectedRuntimeToolsForAcpSession(token)
    if (!injectedRuntimeTools) {
      diagnosticsService.logWarning(
        "remote-server",
        `Denied injected MCP ${req.method} request without valid ACP session context`,
      )
      return reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })
    }

    const rawSessionId = req.headers["mcp-session-id"]
    const sessionId = Array.isArray(rawSessionId)
      ? rawSessionId[0]
      : rawSessionId
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
              error: {
                code: -32000,
                message: "Bad Request: No valid session ID provided",
              },
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
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        `Injected MCP ${req.method} error`,
        error,
      )
      if (!reply.sent) {
        return reply.code(500).send({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error?.message || "Internal server error",
          },
          id: null,
        })
      }
      return reply
    }
  }

  fastify.post("/mcp/:acpSessionToken", async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)
  })

  fastify.get("/mcp/:acpSessionToken", async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)
  })

  fastify.delete("/mcp/:acpSessionToken", async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)
  })

  // POST /mcp/tools/list - List all available injected runtime tools
  fastify.post("/mcp/tools/list", async (req, reply) => {
    const query = req.query as { acpSessionToken?: string } | undefined
    return listInjectedMcpTools(query?.acpSessionToken, reply)
  })

  fastify.post("/mcp/:acpSessionToken/tools/list", async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return listInjectedMcpTools(params?.acpSessionToken, reply)
  })

  // POST /mcp/tools/call - Execute an injected runtime tool
  fastify.post("/mcp/tools/call", async (req, reply) => {
    const query = req.query as { acpSessionToken?: string } | undefined
    return callInjectedMcpTool(req, reply, query?.acpSessionToken)
  })

  fastify.post("/mcp/:acpSessionToken/tools/call", async (req, reply) => {
    const params = req.params as { acpSessionToken?: string }
    return callInjectedMcpTool(req, reply, params?.acpSessionToken)
  })

  // ============================================
  // Skills Management Endpoints (for mobile app)
  // ============================================

  // GET /v1/skills - List all skills
  fastify.get("/v1/skills", async (_req, reply) => {
    try {
      const managedSkills = getManagedCurrentProfileSkills()

      return reply.send({
        skills: managedSkills.skills.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          enabledForProfile: s.enabledForProfile,
          source: s.source,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        currentProfileId: managedSkills.currentProfile?.id,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get skills",
        error,
      )
      return reply.code(500).send({ error: "Failed to get skills" })
    }
  })

  // POST /v1/skills/:id/toggle-profile - Toggle skill for current profile
  fastify.post("/v1/skills/:id/toggle-profile", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const result = toggleManagedSkillForCurrentProfile(params.id)
      if (!result.success) {
        if (result.errorCode === "skill_not_found") {
          return reply.code(404).send({ error: result.error })
        }
        if (result.errorCode === "profile_not_found") {
          return reply.code(400).send({ error: result.error })
        }
        return reply.code(500).send({ error: result.error })
      }

      return reply.send({
        success: true,
        skillId: params.id,
        enabledForProfile: result.enabledForProfile,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to toggle skill",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to toggle skill" })
    }
  })

  // ============================================
  // Knowledge Notes Management Endpoints (for mobile app)
  // ============================================

  // GET /v1/knowledge/notes - List all knowledge notes
  fastify.get("/v1/knowledge/notes", async (_req, reply) => {
    try {
      const notes = await getManagedKnowledgeNotes()
      return reply.send({ notes })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get knowledge notes",
        error,
      )
      return reply.code(500).send({ error: "Failed to get knowledge notes" })
    }
  })

  // GET /v1/knowledge/notes/:id - Get one knowledge note
  fastify.get("/v1/knowledge/notes/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const note = await getManagedKnowledgeNote(params.id)
      if (!note)
        return reply.code(404).send({ error: "Knowledge note not found" })
      return reply.send({ note })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get knowledge note",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to get knowledge note" })
    }
  })

  // DELETE /v1/knowledge/notes/:id - Delete a knowledge note
  fastify.delete("/v1/knowledge/notes/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const result = await deleteManagedKnowledgeNote(params.id)
      if (isManagedKnowledgeNoteFailure(result)) {
        const statusCode = result.errorCode === "not_found" ? 404 : 500
        return reply.code(statusCode).send({ error: result.error })
      }

      return reply.send({ success: true, id: params.id })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to delete knowledge note",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to delete knowledge note" })
    }
  })

  // ============================================
  // Agent Management Endpoints (for mobile app)
  // ============================================

  const serializeRemoteAgentProfile = (profile: AgentProfile) => ({
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description,
    avatarDataUrl: profile.avatarDataUrl,
    systemPrompt: profile.systemPrompt,
    guidelines: profile.guidelines,
    properties: profile.properties,
    modelConfig: profile.modelConfig,
    toolConfig: profile.toolConfig,
    skillsConfig: profile.skillsConfig,
    connection: profile.connection,
    isStateful: profile.isStateful,
    conversationId: profile.conversationId,
    role: profile.role,
    enabled: profile.enabled,
    isBuiltIn: profile.isBuiltIn,
    isUserProfile: profile.isUserProfile,
    isAgentTarget: profile.isAgentTarget,
    isDefault: profile.isDefault,
    autoSpawn: profile.autoSpawn,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    connectionType: profile.connection.type,
  })

  // GET /v1/agent-profiles - List all agent profiles (supports ?role=user-profile|delegation-target|external-agent filter)
  fastify.get("/v1/agent-profiles", async (req, reply) => {
    try {
      const query = req.query as { role?: string }
      const profiles = getManagedAgentProfiles({ role: query.role })

      return reply.send({
        profiles: profiles.map(serializeManagedAgentProfileSummary),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get agent profiles",
        error,
      )
      return reply.code(500).send({ error: "Failed to get agent profiles" })
    }
  })

  // POST /v1/agent-profiles/:id/toggle - Toggle agent profile enabled state
  fastify.post("/v1/agent-profiles/:id/toggle", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const result = toggleManagedAgentProfileEnabled(params.id)

      if (!result.success) {
        return reply
          .code(getManagedAgentProfileErrorStatusCode(result.errorCode))
          .send({ error: result.error })
      }

      return reply.send({
        success: true,
        id: params.id,
        enabled: result.profile.enabled,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to toggle agent profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to toggle agent profile" })
    }
  })

  // GET /v1/agent-profiles/:id - Get single agent profile with full detail
  fastify.get("/v1/agent-profiles/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const profile = getManagedAgentProfile(params.id)

      if (!profile) {
        return reply.code(404).send({ error: "Agent profile not found" })
      }

      return reply.send({
        profile: serializeManagedAgentProfile(profile),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get agent profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to get agent profile" })
    }
  })

  // POST /v1/agent-profiles - Create a new agent profile
  fastify.post("/v1/agent-profiles", async (req, reply) => {
    try {
      const body = req.body as {
        name?: string
        displayName?: string
        description?: string
        avatarDataUrl?: string | null
        systemPrompt?: string
        guidelines?: string
        connection?: import("@shared/types").AgentProfileConnection
        connectionType?: string
        connectionCommand?: string
        connectionArgs?: string | string[]
        connectionBaseUrl?: string
        connectionCwd?: string
        enabled?: boolean
        autoSpawn?: boolean
        modelConfig?: any
        toolConfig?: any
        skillsConfig?: any
        properties?: Record<string, string>
        role?: import("@shared/types").AgentProfileRole
        isUserProfile?: boolean
        isAgentTarget?: boolean
        isDefault?: boolean
        isStateful?: boolean
      }
      const result = createManagedAgentProfile(body)

      if (!result.success) {
        return reply
          .code(getManagedAgentProfileErrorStatusCode(result.errorCode))
          .send({ error: result.error })
      }

      return reply.code(201).send({
        profile: serializeManagedAgentProfile(result.profile),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to create agent profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to create agent profile" })
    }
  })

  // PATCH /v1/agent-profiles/:id - Update an agent profile
  fastify.patch("/v1/agent-profiles/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const body = req.body as {
        name?: string
        displayName?: string
        description?: string
        avatarDataUrl?: string | null
        systemPrompt?: string
        guidelines?: string
        connection?: import("@shared/types").AgentProfileConnection
        connectionType?: string
        connectionCommand?: string
        connectionArgs?: string | string[]
        connectionBaseUrl?: string
        connectionCwd?: string
        enabled?: boolean
        autoSpawn?: boolean
        modelConfig?: any
        toolConfig?: any
        skillsConfig?: any
        properties?: Record<string, string>
        role?: import("@shared/types").AgentProfileRole
        isUserProfile?: boolean
        isAgentTarget?: boolean
        isDefault?: boolean
        isStateful?: boolean
      }
      const result = updateManagedAgentProfile(params.id, body)

      if (!result.success) {
        return reply
          .code(getManagedAgentProfileErrorStatusCode(result.errorCode))
          .send({ error: result.error })
      }

      return reply.send({
        success: true,
        profile: serializeManagedAgentProfile(result.profile),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to update agent profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to update agent profile" })
    }
  })

  // DELETE /v1/agent-profiles/:id - Delete an agent profile
  fastify.delete("/v1/agent-profiles/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const result = deleteManagedAgentProfile(params.id)

      if (!result.success) {
        return reply
          .code(getManagedAgentProfileErrorStatusCode(result.errorCode))
          .send({ error: result.error })
      }

      return reply.send({ success: true })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to delete agent profile",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to delete agent profile" })
    }
  })

  // ============================================
  // Repeat Tasks Management Endpoints (for mobile app)
  // ============================================

  const loadLoopService = async () => {
    try {
      const { loopService } = await import("./loop-service")
      return loopService
    } catch {
      return null
    }
  }

  const formatLoopResponse = async (loop: LoopConfig) => {
    const loopService = await loadLoopService()
    if (loopService) {
      return getManagedLoopSummary(loopService, loop)
    }

    return summarizeLoop(loop, {
      profileName: loop.profileId
        ? agentProfileService.getById(loop.profileId)?.displayName
        : undefined,
    })
  }

  // GET /v1/loops - List all repeat tasks
  fastify.get("/v1/loops", async (_req, reply) => {
    try {
      const loopService = await loadLoopService()

      if (loopService) {
        return reply.send({
          loops: getManagedLoopSummaries(loopService),
        })
      }

      const loops = configStore.get().loops || []

      return reply.send({
        loops: summarizeLoops(loops, {
          getProfileName: (profileId) =>
            profileId
              ? agentProfileService.getById(profileId)?.displayName
              : undefined,
        }),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to get repeat tasks",
        error,
      )
      return reply.code(500).send({ error: "Failed to get repeat tasks" })
    }
  })

  // POST /v1/loops/:id/toggle - Toggle repeat task enabled state
  fastify.post("/v1/loops/:id/toggle", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const loopService = await loadLoopService()

      if (loopService) {
        const result = toggleManagedLoopEnabled(loopService, params.id)
        if (!result.success) {
          if (result.error === "not_found") {
            return reply.code(404).send({ error: "Repeat task not found" })
          }

          return reply
            .code(500)
            .send({ error: "Failed to persist repeat task toggle" })
        }

        return reply.send({
          success: true,
          id: params.id,
          enabled: result.loop?.enabled ?? false,
        })
      }

      const cfg = configStore.get()
      const loops = cfg.loops || []
      const loopIndex = loops.findIndex((l) => l.id === params.id)

      if (loopIndex === -1) {
        return reply.code(404).send({ error: "Repeat task not found" })
      }

      const updatedLoops = [...loops]
      updatedLoops[loopIndex] = {
        ...updatedLoops[loopIndex],
        enabled: !updatedLoops[loopIndex].enabled,
      }

      configStore.save({ ...cfg, loops: updatedLoops })

      return reply.send({
        success: true,
        id: params.id,
        enabled: updatedLoops[loopIndex].enabled,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to toggle repeat task",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to toggle repeat task" })
    }
  })

  // POST /v1/loops/:id/run - Run a repeat task immediately
  fastify.post("/v1/loops/:id/run", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const loopService = await loadLoopService()

      if (loopService) {
        const result = await triggerManagedLoop(loopService, params.id)
        if (!result.success) {
          if (result.error === "not_found") {
            return reply.code(404).send({ error: "Repeat task not found" })
          }

          return reply.code(409).send({ error: "Task is already running" })
        }

        return reply.send({ success: true, id: params.id })
      }

      return reply
        .code(503)
        .send({ error: "Repeat task service is unavailable" })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to run repeat task",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to run repeat task" })
    }
  })

  // POST /v1/knowledge/notes - Create a new knowledge note
  fastify.post("/v1/knowledge/notes", async (req, reply) => {
    try {
      const body = req.body as {
        id?: unknown
        title?: unknown
        body?: unknown
        summary?: unknown
        context?: unknown
        tags?: unknown
        references?: unknown
      }

      const result = await createManagedKnowledgeNote(body)
      if (isManagedKnowledgeNoteFailure(result)) {
        const statusCode = result.errorCode === "invalid_input" ? 400 : 500
        return reply.code(statusCode).send({ error: result.error })
      }

      return reply.code(201).send({ note: result.note })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to create knowledge note",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to create knowledge note" })
    }
  })

  // PATCH /v1/knowledge/notes/:id - Update a knowledge note
  fastify.patch("/v1/knowledge/notes/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const body = req.body as {
        title?: unknown
        body?: unknown
        summary?: unknown
        context?: unknown
        tags?: unknown
        references?: unknown
      }

      const result = await updateManagedKnowledgeNote(params.id, body)
      if (isManagedKnowledgeNoteFailure(result)) {
        const statusCode =
          result.errorCode === "invalid_input"
            ? 400
            : result.errorCode === "not_found"
              ? 404
              : 500
        return reply.code(statusCode).send({ error: result.error })
      }

      return reply.send({
        success: true,
        note: result.note,
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to update knowledge note",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to update knowledge note" })
    }
  })

  // POST /v1/loops - Create a new loop/repeat task
  fastify.post("/v1/loops", async (req, reply) => {
    try {
      const body = req.body as {
        name?: unknown
        prompt?: unknown
        intervalMinutes?: unknown
        enabled?: unknown
        profileId?: unknown
        maxIterations?: unknown
        runOnStartup?: unknown
      }

      const loopService = await loadLoopService()
      if (loopService) {
        const result = createManagedLoop(loopService, body)
        if (!result.success) {
          const statusCode = result.error === "invalid_input" ? 400 : 500
          return reply.code(statusCode).send({
            error: result.errorMessage || "Failed to persist repeat task",
          })
        }

        return reply.send({
          loop: result.summary ?? (await formatLoopResponse(result.loop!)),
        })
      }

      const name = typeof body.name === "string" ? body.name.trim() : ""
      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
      if (!name || !prompt) {
        return reply.code(400).send({
          error: "name and prompt are required and must be non-empty strings",
        })
      }

      const cfg = configStore.get()
      const loops = [
        ...(cfg.loops || []),
        {
          id: `loop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          name,
          prompt,
          intervalMinutes:
            typeof body.intervalMinutes === "number"
              ? body.intervalMinutes
              : 60,
          enabled: typeof body.enabled === "boolean" ? body.enabled : true,
          profileId:
            typeof body.profileId === "string"
              ? body.profileId.trim() || undefined
              : undefined,
          maxIterations:
            typeof body.maxIterations === "number"
              ? body.maxIterations
              : undefined,
          runOnStartup:
            typeof body.runOnStartup === "boolean" ? body.runOnStartup : false,
        },
      ]
      configStore.save({ ...cfg, loops })

      return reply.send({
        loop: await formatLoopResponse(loops[loops.length - 1]),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to create repeat task",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to create repeat task" })
    }
  })

  // PATCH /v1/loops/:id - Update a loop/repeat task
  fastify.patch("/v1/loops/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const body = req.body as {
        name?: unknown
        prompt?: unknown
        intervalMinutes?: unknown
        enabled?: unknown
        profileId?: unknown
        maxIterations?: unknown
        runOnStartup?: unknown
      }

      const loopService = await loadLoopService()
      let existing: LoopConfig | undefined
      let cfg: ReturnType<typeof configStore.get> | undefined
      let loops: LoopConfig[] = []
      let loopIndex = -1

      if (loopService) {
        existing = loopService.getLoop(params.id)
      } else {
        cfg = configStore.get()
        loops = cfg.loops || []
        loopIndex = loops.findIndex((l) => l.id === params.id)
        existing = loopIndex >= 0 ? loops[loopIndex] : undefined
      }

      if (!existing) {
        return reply.code(404).send({ error: "Repeat task not found" })
      }

      if (loopService) {
        const result = updateManagedLoop(loopService, params.id, body)
        if (!result.success) {
          const statusCode =
            result.error === "invalid_input"
              ? 400
              : result.error === "not_found"
                ? 404
                : 500
          return reply.code(statusCode).send({
            error: result.errorMessage || "Failed to persist repeat task",
          })
        }

        return reply.send({
          success: true,
          loop: result.summary ?? (await formatLoopResponse(result.loop!)),
        })
      }

      const updated = {
        ...existing,
        ...(typeof body.name === "string" && { name: body.name.trim() }),
        ...(typeof body.prompt === "string" && { prompt: body.prompt.trim() }),
        ...(typeof body.intervalMinutes === "number" && {
          intervalMinutes: body.intervalMinutes,
        }),
        ...(typeof body.enabled === "boolean" && { enabled: body.enabled }),
        ...(body.profileId !== undefined && {
          profileId:
            typeof body.profileId === "string"
              ? body.profileId.trim() || undefined
              : undefined,
        }),
        ...(body.maxIterations !== undefined && {
          maxIterations:
            typeof body.maxIterations === "number"
              ? body.maxIterations
              : undefined,
        }),
        ...(typeof body.runOnStartup === "boolean" && {
          runOnStartup: body.runOnStartup,
        }),
      }

      if (cfg && loopIndex >= 0) {
        const updatedLoops = [...loops]
        updatedLoops[loopIndex] = updated
        configStore.save({ ...cfg, loops: updatedLoops })
      }

      return reply.send({
        success: true,
        loop: await formatLoopResponse(updated),
      })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to update repeat task",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to update repeat task" })
    }
  })

  // DELETE /v1/loops/:id - Delete a loop/repeat task
  fastify.delete("/v1/loops/:id", async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const loopService = await loadLoopService()

      if (loopService) {
        const result = deleteManagedLoop(loopService, params.id)
        if (!result.success) {
          if (result.error === "not_found") {
            return reply.code(404).send({ error: "Repeat task not found" })
          }

          return reply.code(500).send({ error: "Failed to delete repeat task" })
        }

        return reply.send({ success: true, id: params.id })
      }

      const cfg = configStore.get()
      const loops = cfg.loops || []
      const loopIndex = loops.findIndex((l) => l.id === params.id)

      if (loopIndex === -1) {
        return reply.code(404).send({ error: "Repeat task not found" })
      }

      const updatedLoops = loops.filter((l) => l.id !== params.id)
      configStore.save({ ...cfg, loops: updatedLoops })

      return reply.send({ success: true, id: params.id })
    } catch (error: any) {
      diagnosticsService.logError(
        "remote-server",
        "Failed to delete repeat task",
        error,
      )
      return reply
        .code(500)
        .send({ error: error?.message || "Failed to delete repeat task" })
    }
  })

  try {
    await fastify.listen({ port, host: bind })
    diagnosticsService.logInfo(
      "remote-server",
      `Remote server listening at ${buildRemoteServerBaseUrl(bind, port)}`,
    )
    server = fastify

    // Print QR code to terminal for mobile app pairing
    // Auto-print in headless environments, or when explicitly requested
    // Skip if caller handles QR printing separately (e.g., --qr mode)
    if (!skipAutoPrintQR) {
      const currentCfg = configStore.get()
      const qrPrintResult = await printSharedRemoteServerQrCode({
        mode: "auto",
        config: currentCfg,
        serverRunning: true,
        isHeadlessEnvironment: isHeadlessEnvironment(),
        resolveConnectableBaseUrl: (remoteBind, remotePort) =>
          getConnectableBaseUrlForMobilePairing(remoteBind, remotePort),
      })
      if (qrPrintResult.skippedReason === "unreachable-base-url") {
        console.warn(
          `[Remote Server] Warning: Could not resolve a LAN-reachable URL for bind ${bind}. Skipping terminal QR code output.`,
        )
      }
    }

    return { running: true, bind, port }
  } catch (err: any) {
    lastError = err?.message || String(err)
    diagnosticsService.logError("remote-server", "Failed to start server", err)
    server = null
    return { running: false, error: lastError }
  }
}

export async function stopRemoteServer() {
  if (server) {
    try {
      await server.close()
      diagnosticsService.logInfo("remote-server", "Remote server stopped")
    } catch (err) {
      diagnosticsService.logError("remote-server", "Error stopping server", err)
    } finally {
      server = null
    }
  }
}

export async function restartRemoteServer() {
  await stopRemoteServer()
  return startRemoteServer()
}

export function getRemoteServerStatus() {
  const cfg = configStore.get()
  const bind = cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS
  const port = cfg.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT
  const running = !!server
  const url = running ? buildRemoteServerBaseUrl(bind, port) : undefined
  const connectableUrl = running
    ? getConnectableBaseUrlForMobilePairing(bind, port, { warn: false })
    : undefined
  return { running, url, connectableUrl, bind, port, lastError }
}

/**
 * Prints the QR code to the terminal for mobile app pairing
 * Can be called manually when the user wants to see the QR code
 * @param urlOverride Optional URL to use instead of the local server URL (e.g., Cloudflare tunnel URL)
 * @returns true if QR code was printed successfully, false if server is not running, no API key, streamer mode enabled, or QR generation failed
 */
export async function printQRCodeToTerminal(
  urlOverride?: string,
): Promise<boolean> {
  const cfg = configStore.get()
  const qrPrintResult = await printSharedRemoteServerQrCode({
    mode: "manual",
    config: cfg,
    serverRunning: !!server,
    urlOverride,
    resolveConnectableBaseUrl: (bind, port) =>
      getConnectableBaseUrlForMobilePairing(bind, port),
  })

  if (
    qrPrintResult.skippedReason === "server-unavailable" ||
    qrPrintResult.skippedReason === "missing-api-key"
  ) {
    console.log(
      "[Remote Server] Cannot print QR code: server not running or no API key configured",
    )
    return false
  }

  if (qrPrintResult.skippedReason === "streamer-mode") {
    console.log(
      "[Remote Server] Cannot print QR code: streamer mode is enabled",
    )
    return false
  }

  if (qrPrintResult.skippedReason === "unreachable-base-url") {
    console.log(
      "[Remote Server] Cannot print QR code: unable to resolve a LAN-reachable URL for the current bind address",
    )
    return false
  }

  return qrPrintResult.printed
}
