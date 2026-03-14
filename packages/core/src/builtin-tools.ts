/**
 * Built-in Tools for DotAgents Settings Management
 *
 * These tools are registered as built-in tools (no server prefix) and provide
 * functionality for managing DotAgents settings directly from the LLM.
 *
 * Unlike external MCP servers, these tools run directly in the main process
 * and have direct access to the app's services.
 */

import { configStore } from "./config"
import { agentProfileService, toolConfigToMcpServerConfig } from "./agent-profile-service"
import { agentSessionStateManager, toolApprovalManager } from "./state"
import { memoryService } from "./memory-service"
import { setSessionUserResponse } from "./session-user-response-store"
import { promises as fs } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import type { AgentMemory, MCPTool, MCPToolResult } from "./types"

const execAsync = promisify(exec)

// Re-export from the dependency-free definitions module for backward compatibility
export {
  BUILTIN_SERVER_NAME,
  builtinToolDefinitions as builtinTools,
  getBuiltinToolNames,
} from "./builtin-tool-definitions"

// Import for local use
import { BUILTIN_SERVER_NAME, builtinToolDefinitions } from "./builtin-tool-definitions"

// ============================================================================
// Dependency injection for services not yet in core
// ============================================================================

/** AgentSessionTracker-like interface for builtin tools */
export interface BuiltinToolsSessionTracker {
  getActiveSessions(): Array<{
    id: string
    conversationId?: string
    conversationTitle?: string
    status: string
    currentIteration: number
    maxIterations: number
    lastActivity: number
    startTime: number
    isSnoozed?: boolean
  }>
  getSession(sessionId: string): {
    id: string
    conversationId?: string
    conversationTitle?: string
    status: string
    currentIteration: number
    maxIterations: number
    lastActivity: number
    startTime: number
    isSnoozed?: boolean
  } | undefined
  stopSession(sessionId: string): void
}

/** MessageQueueService-like interface for builtin tools */
export interface BuiltinToolsMessageQueue {
  enqueue(conversationId: string, message: string): { id: string }
}

/** Emergency stop function type */
export type EmergencyStopFn = () => Promise<{ before: number; after: number }>

/** MCP service interface for builtin tools */
export interface BuiltinToolsMcpService {
  getAvailableTools(): MCPTool[]
  getServerStatus(): Record<string, { connected: boolean; toolCount: number }>
  getDetailedToolList(): Array<{ name: string; enabled: boolean; description: string; inputSchema?: any }>
  setToolEnabled(toolName: string, enabled: boolean): boolean
  handleWhatsAppToggle?(previousEnabled: boolean, newEnabled: boolean): Promise<void>
}

/** ACP router tool execution interface */
export interface BuiltinToolsACPRouter {
  executeACPRouterTool(toolName: string, args: Record<string, unknown>, sessionId?: string): Promise<{ content: string; isError: boolean }>
  isACPRouterTool(toolName: string): boolean
}

// Injected dependencies
let _sessionTracker: BuiltinToolsSessionTracker | null = null
let _messageQueue: BuiltinToolsMessageQueue | null = null
let _emergencyStopFn: EmergencyStopFn | null = null
let _mcpService: BuiltinToolsMcpService | null = null
let _acpRouter: BuiltinToolsACPRouter | null = null

export function setBuiltinToolsSessionTracker(tracker: BuiltinToolsSessionTracker): void {
  _sessionTracker = tracker
}

export function setBuiltinToolsMessageQueue(queue: BuiltinToolsMessageQueue): void {
  _messageQueue = queue
}

export function setBuiltinToolsEmergencyStop(fn: EmergencyStopFn): void {
  _emergencyStopFn = fn
}

export function setBuiltinToolsMcpService(svc: BuiltinToolsMcpService): void {
  _mcpService = svc
}

export function setBuiltinToolsACPRouter(router: BuiltinToolsACPRouter): void {
  _acpRouter = router
}

// ============================================================================
// Internal helpers
// ============================================================================

interface BuiltinToolContext {
  sessionId?: string
}

const MAX_RESPOND_TO_USER_IMAGES = 4
const MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES = 8 * 1024 * 1024
const MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES = 12 * 1024 * 1024
const DATA_IMAGE_BASE64_PREFIX_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
}

const escapeMarkdownAltText = (value: string) => value.replace(/[\[\]\\]/g, "").trim()

const getImageMimeTypeFromPath = (imagePath: string): string | undefined =>
  IMAGE_MIME_BY_EXTENSION[path.extname(imagePath).toLowerCase()]

const isAllowedRespondToUserImageUrl = (url: string): boolean => {
  const normalized = url.trim().toLowerCase()
  return (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    DATA_IMAGE_BASE64_PREFIX_REGEX.test(normalized)
  )
}

const getDecodedBase64ByteLength = (rawBase64: string): number => {
  const normalized = rawBase64.replace(/\s+/g, "")
  if (!normalized) {
    return 0
  }
  const padding = normalized.endsWith("==")
    ? 2
    : normalized.endsWith("=")
      ? 1
      : 0
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding)
}

const getDataImageBytesFromUrl = (url: string): number | null => {
  const trimmed = url.trim()
  if (!DATA_IMAGE_BASE64_PREFIX_REGEX.test(trimmed)) {
    return null
  }
  const commaIndex = trimmed.indexOf(",")
  if (commaIndex < 0 || commaIndex === trimmed.length - 1) {
    return 0
  }
  const base64Payload = trimmed.slice(commaIndex + 1)
  return getDecodedBase64ByteLength(base64Payload)
}

const getUtf8ByteLength = (value: string): number =>
  Buffer.byteLength(value, "utf8")

async function imagePathToDataUrl(rawPath: string): Promise<string> {
  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath)

  const stat = await fs.stat(resolvedPath)
  if (!stat.isFile()) {
    throw new Error(`Image path is not a file: ${rawPath}`)
  }
  if (stat.size <= 0) {
    throw new Error(`Image file is empty: ${rawPath}`)
  }
  if (stat.size > MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES) {
    const maxMb = Math.round(MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES / (1024 * 1024))
    throw new Error(`Image file is larger than ${maxMb}MB: ${rawPath}`)
  }

  const mimeType = getImageMimeTypeFromPath(resolvedPath)
  if (!mimeType) {
    throw new Error(`Unsupported image extension for path: ${rawPath}`)
  }

  const fileBuffer = await fs.readFile(resolvedPath)
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`
}

// Tool execution handlers
type ToolHandler = (
  args: Record<string, unknown>,
  context: BuiltinToolContext
) => Promise<MCPToolResult>

const toolHandlers: Record<string, ToolHandler> = {
  list_mcp_servers: async (): Promise<MCPToolResult> => {
    if (!_mcpService) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "MCP service not available" }) }], isError: true }
    }
    const config = configStore.get()
    const mcpConfig = config.mcpConfig || { mcpServers: {} }
    const runtimeDisabled = new Set(config.mcpRuntimeDisabledServers || [])
    const serverStatus = _mcpService.getServerStatus()

    const servers = Object.entries(mcpConfig.mcpServers).map(([name, serverConfig]: [string, any]) => {
      const isConfigDisabled = serverConfig.disabled === true
      const isRuntimeDisabled = runtimeDisabled.has(name)
      const status = isConfigDisabled || isRuntimeDisabled ? "disabled" : "enabled"
      const transport = serverConfig.transport || "stdio"
      const connectionInfo = serverStatus[name]

      return {
        name,
        status,
        connected: connectionInfo?.connected ?? false,
        toolCount: connectionInfo?.toolCount ?? 0,
        transport,
        configDisabled: isConfigDisabled,
        runtimeDisabled: isRuntimeDisabled,
        command: serverConfig.command,
        url: serverConfig.url,
      }
    })

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ servers, count: servers.length }, null, 2),
        },
      ],
      isError: false,
    }
  },

  toggle_mcp_server: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.serverName !== "string" || args.serverName.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "serverName must be a non-empty string" }) }],
        isError: true,
      }
    }

    if (args.enabled !== undefined && typeof args.enabled !== "boolean") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "enabled must be a boolean if provided" }) }],
        isError: true,
      }
    }

    const serverName = args.serverName

    const config = configStore.get()
    const mcpConfig = config.mcpConfig || { mcpServers: {} }

    if (!mcpConfig.mcpServers[serverName]) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Server '${serverName}' not found. Available servers: ${Object.keys(mcpConfig.mcpServers).join(", ") || "none"}`,
            }),
          },
        ],
        isError: true,
      }
    }

    const runtimeDisabled = new Set(config.mcpRuntimeDisabledServers || [])
    const configDisabled = mcpConfig.mcpServers[serverName].disabled === true
    const isCurrentlyRuntimeDisabled = runtimeDisabled.has(serverName)
    const isCurrentlyDisabled = isCurrentlyRuntimeDisabled || configDisabled
    const enabled = typeof args.enabled === "boolean" ? args.enabled : isCurrentlyDisabled

    if (enabled) {
      runtimeDisabled.delete(serverName)
    } else {
      runtimeDisabled.add(serverName)
    }

    configStore.save({
      ...config,
      mcpRuntimeDisabledServers: Array.from(runtimeDisabled),
    })

    const effectivelyEnabled = enabled && !configDisabled

    let message = `Server '${serverName}' runtime setting has been ${enabled ? "enabled" : "disabled"}.`
    if (enabled && configDisabled) {
      message += ` Warning: Server is still disabled in config file (disabled: true). Edit mcp.json to fully enable.`
    } else {
      message += ` Restart agent mode or the app for changes to take effect.`
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            serverName,
            enabled,
            configDisabled,
            effectivelyEnabled,
            message,
          }),
        },
      ],
      isError: false,
    }
  },


  list_running_agents: async (): Promise<MCPToolResult> => {
    if (!_sessionTracker) {
      return { content: [{ type: "text", text: JSON.stringify({ agents: [], count: 0, message: "Session tracker not available" }) }], isError: false }
    }
    const activeSessions = _sessionTracker.getActiveSessions()

    if (activeSessions.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              agents: [],
              count: 0,
              message: "No agents currently running",
            }, null, 2),
          },
        ],
        isError: false,
      }
    }

    const agents = activeSessions.map((session) => ({
      sessionId: session.id,
      conversationId: session.conversationId,
      title: session.conversationTitle,
      status: session.status,
      currentIteration: session.currentIteration,
      maxIterations: session.maxIterations,
      lastActivity: session.lastActivity,
      startTime: session.startTime,
      isSnoozed: session.isSnoozed,
      runtimeSeconds: Math.floor((Date.now() - session.startTime) / 1000),
    }))

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            agents,
            count: agents.length,
          }, null, 2),
        },
      ],
      isError: false,
    }
  },

  send_agent_message: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (!args.sessionId || typeof args.sessionId !== "string") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "sessionId is required and must be a string" }) }],
        isError: true,
      }
    }
    if (!args.message || typeof args.message !== "string") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "message is required and must be a string" }) }],
        isError: true,
      }
    }
    if (!_sessionTracker || !_messageQueue) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "Session tracker or message queue not available" }) }], isError: true }
    }

    const sessionId = args.sessionId
    const message = args.message

    const session = _sessionTracker.getSession(sessionId)
    if (!session) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: `Agent session not found: ${sessionId}` }) }],
        isError: true,
      }
    }

    if (!session.conversationId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Target agent session has no linked conversation" }) }],
        isError: true,
      }
    }

    const queuedMessage = _messageQueue.enqueue(session.conversationId, message)

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            sessionId,
            conversationId: session.conversationId,
            queuedMessageId: queuedMessage.id,
            message: `Message queued for agent session ${sessionId} (${session.conversationTitle})`,
          }, null, 2),
        },
      ],
      isError: false,
    }
  },

  kill_agent: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const sessionId = args.sessionId as string | undefined

    if (sessionId) {
      if (!_sessionTracker) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "Session tracker not available" }) }], isError: true }
      }
      const session = _sessionTracker.getSession(sessionId)
      if (!session) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `Agent session not found: ${sessionId}` }) }],
          isError: true,
        }
      }
      agentSessionStateManager.stopSession(sessionId)
      toolApprovalManager.cancelSessionApprovals(sessionId)
      _sessionTracker.stopSession(sessionId)
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, sessionId, message: `Agent session ${sessionId} (${session.conversationTitle}) terminated` }, null, 2) }],
        isError: false,
      }
    }

    // Kill all agents
    if (!_sessionTracker) {
      return { content: [{ type: "text", text: JSON.stringify({ success: true, message: "No agents were running", sessionsTerminated: 0 }) }], isError: false }
    }
    const activeSessions = _sessionTracker.getActiveSessions()
    if (activeSessions.length === 0) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: "No agents were running", sessionsTerminated: 0 }, null, 2) }],
        isError: false,
      }
    }
    toolApprovalManager.cancelAllApprovals()
    if (_emergencyStopFn) {
      const { before, after } = await _emergencyStopFn()
      return {
        content: [{ type: "text", text: JSON.stringify({
          success: true,
          message: `Emergency stop: ${activeSessions.length} session(s) terminated`,
          sessionsTerminated: activeSessions.length,
          processesKilled: before - after,
        }, null, 2) }],
        isError: false,
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, message: `${activeSessions.length} session(s) terminated`, sessionsTerminated: activeSessions.length }) }],
      isError: false,
    }
  },

  update_settings: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const config = configStore.get()

    const SETTING_MAP: Record<string, { configKey: string; defaultVal: boolean; label: string }> = {
      postProcessing: { configKey: "transcriptPostProcessingEnabled", defaultVal: false, label: "Post-processing" },
      tts: { configKey: "ttsEnabled", defaultVal: true, label: "Text-to-speech" },
      toolApproval: { configKey: "mcpRequireApprovalBeforeToolCall", defaultVal: false, label: "Tool approval" },
      verification: { configKey: "mcpVerifyCompletionEnabled", defaultVal: true, label: "Verification" },
      whatsapp: { configKey: "whatsappEnabled", defaultVal: false, label: "WhatsApp" },
    }

    const updates: Record<string, boolean> = {}
    for (const [key, mapping] of Object.entries(SETTING_MAP)) {
      if (args[key] !== undefined) {
        if (typeof args[key] !== "boolean") {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `${key} must be a boolean` }) }],
            isError: true,
          }
        }
        updates[key] = args[key] as boolean
      }
    }

    const isReadOnly = Object.keys(updates).length === 0

    if (!isReadOnly) {
      const configUpdates: Record<string, boolean> = {}
      const changes: Array<{ setting: string; from: boolean; to: boolean }> = []
      for (const [key, newValue] of Object.entries(updates)) {
        const mapping = SETTING_MAP[key]
        const previousValue = (config as any)[mapping.configKey] ?? mapping.defaultVal
        configUpdates[mapping.configKey] = newValue
        changes.push({ setting: mapping.label, from: previousValue, to: newValue })
      }

      configStore.save({ ...config, ...configUpdates })

      // Handle WhatsApp lifecycle if toggled
      if (updates.whatsapp !== undefined && _mcpService?.handleWhatsAppToggle) {
        const prevWhatsapp = config.whatsappEnabled ?? false
        try {
          await _mcpService.handleWhatsAppToggle(prevWhatsapp, updates.whatsapp)
        } catch (_e) { /* lifecycle is best-effort */ }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            changes,
            message: changes.map(c => `${c.setting}: ${c.from} → ${c.to}`).join(", "),
          }, null, 2),
        }],
        isError: false,
      }
    }

    // Read-only: return current values
    const postProcessingPromptConfigured = !!(config.transcriptPostProcessingPrompt?.trim())
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          postProcessing: config.transcriptPostProcessingEnabled ?? false,
          postProcessingPromptConfigured,
          tts: config.ttsEnabled ?? true,
          toolApproval: config.mcpRequireApprovalBeforeToolCall ?? false,
          verification: config.mcpVerifyCompletionEnabled ?? true,
          messageQueue: config.mcpMessageQueueEnabled ?? true,
          parallelToolExecution: config.mcpParallelToolExecution ?? true,
          whatsapp: config.whatsappEnabled ?? false,
        }, null, 2),
      }],
      isError: false,
    }
  },

  respond_to_user: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    if (!context.sessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "respond_to_user requires an active agent session" }) }],
        isError: true,
      }
    }

    const text = typeof args.text === "string" ? args.text.trim() : ""
    if (args.text !== undefined && typeof args.text !== "string") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "text must be a string if provided" }) }],
        isError: true,
      }
    }

    if (args.images !== undefined && !Array.isArray(args.images)) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "images must be an array if provided" }) }],
        isError: true,
      }
    }

    const imageInputs = Array.isArray(args.images) ? args.images : []

    if (imageInputs.length > MAX_RESPOND_TO_USER_IMAGES) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_IMAGES} images.` }) }],
        isError: true,
      }
    }

    const imageMarkdownBlocks: string[] = []
    let localImageCount = 0
    let embeddedImageBytes = 0

    for (let index = 0; index < imageInputs.length; index++) {
      const rawItem = imageInputs[index]
      if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `images[${index}] must be an object` }) }],
          isError: true,
        }
      }

      const imageItem = rawItem as Record<string, unknown>
      const url = typeof imageItem.url === "string" ? imageItem.url.trim() : ""
      const imagePath = typeof imageItem.path === "string" ? imageItem.path.trim() : ""
      const preferredAlt = typeof imageItem.alt === "string" ? imageItem.alt.trim() : ""

      if (!url && !imagePath) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `images[${index}] must include either url or path` }) }],
          isError: true,
        }
      }

      if (url && imagePath) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `images[${index}] cannot include both url and path` }) }],
          isError: true,
        }
      }

      const fallbackAlt = imagePath ? path.basename(imagePath) : `Image ${index + 1}`
      const safeAlt = escapeMarkdownAltText(preferredAlt || fallbackAlt) || `Image ${index + 1}`

      if (url) {
        if (!isAllowedRespondToUserImageUrl(url)) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `images[${index}].url must be http(s) or data:image` }) }],
            isError: true,
          }
        }
        const dataImageBytes = getDataImageBytesFromUrl(url)
        if (dataImageBytes !== null) {
          if (dataImageBytes <= 0) {
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: `images[${index}].url contains an invalid data:image payload` }) }],
              isError: true,
            }
          }
          if (dataImageBytes > MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES) {
            const maxMb = Math.round(MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES / (1024 * 1024))
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: `images[${index}].url exceeds the ${maxMb}MB limit` }) }],
              isError: true,
            }
          }
          const dataImageUrlBytes = getUtf8ByteLength(url)
          if (embeddedImageBytes + dataImageUrlBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
            const maxMb = Math.round(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES / (1024 * 1024))
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: `Total embedded image payload exceeds the ${maxMb}MB limit` }) }],
              isError: true,
            }
          }
          embeddedImageBytes += dataImageUrlBytes
        }
        imageMarkdownBlocks.push(`![${safeAlt}](${url})`)
        continue
      }

      try {
        const dataUrl = await imagePathToDataUrl(imagePath)
        const dataImageUrlBytes = getUtf8ByteLength(dataUrl)
        if (embeddedImageBytes + dataImageUrlBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
          const maxMb = Math.round(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES / (1024 * 1024))
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Total embedded image payload exceeds the ${maxMb}MB limit` }) }],
            isError: true,
          }
        }
        embeddedImageBytes += dataImageUrlBytes
        imageMarkdownBlocks.push(`![${safeAlt}](${dataUrl})`)
        localImageCount++
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error
                ? `Failed to load images[${index}].path: ${error.message}`
                : `Failed to load images[${index}].path`,
            }),
          }],
          isError: true,
        }
      }
    }

    const imageMarkdown = imageMarkdownBlocks.join("\n\n")
    const responseContent = [text, imageMarkdown].filter(Boolean).join("\n\n")
    const responseContentBytes = getUtf8ByteLength(responseContent)

    if (!responseContent.trim()) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "respond_to_user requires text and/or images" }) }],
        isError: true,
      }
    }

    if (responseContentBytes > MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES) {
      const maxMb = Math.round(MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES / (1024 * 1024))
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: `Response content exceeds the ${maxMb}MB limit` }) }],
        isError: true,
      }
    }

    // Guard: don't store the response if the session was already stopped/cancelled.
    if (_sessionTracker) {
      const activeSession = _sessionTracker.getSession(context.sessionId)
      if (!activeSession) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Session is no longer active (was stopped or completed)" }) }],
          isError: true,
        }
      }
    }

    setSessionUserResponse(context.sessionId, responseContent)

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Response recorded for delivery to user.",
            textLength: text.length,
            responseContentLength: responseContent.length,
            responseContentBytes,
            imageCount: imageMarkdownBlocks.length,
            localImageCount,
            embeddedImageBytes,
          }, null, 2),
        },
      ],
      isError: false,
    }
  },

  mark_work_complete: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.summary !== "string" || args.summary.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "summary must be a non-empty string" }) }],
        isError: true,
      }
    }

    if (args.confidence !== undefined && (typeof args.confidence !== "number" || Number.isNaN(args.confidence))) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "confidence must be a number if provided" }) }],
        isError: true,
      }
    }

    const summary = args.summary.trim()
    const confidence = typeof args.confidence === "number"
      ? Math.max(0, Math.min(1, args.confidence))
      : undefined

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            markedComplete: true,
            summary,
            confidence,
            message: "Completion signal recorded. Provide the final user-facing response next.",
          }, null, 2),
        },
      ],
      isError: false,
    }
  },

  execute_command: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const { skillsService } = await import("./skills-service")

    if (!args.command || typeof args.command !== "string") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "command parameter is required and must be a string" }) }],
        isError: true,
      }
    }

    const command = args.command as string
    const skillId = args.skillId as string | undefined
    const rawTimeout = args.timeout
    const timeout = (typeof rawTimeout === "number" && Number.isFinite(rawTimeout) && rawTimeout >= 0)
      ? rawTimeout
      : 30000

    let cwd: string | undefined
    let skillName: string | undefined

    if (skillId) {
      let skill = skillsService.getSkill(skillId)
      if (!skill) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `Skill not found: ${skillId}` }) }],
          isError: true,
        }
      }

      if (!skill.filePath) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `Skill has no file path (not imported from disk): ${skill.name}` }) }],
          isError: true,
        }
      }

      if (skill.filePath.startsWith("github:")) {
        try {
          const { skillsService: skillsSvc } = await import("./skills-service")
          skill = await skillsSvc.upgradeGitHubSkillToLocal(skillId)
        } catch (upgradeError) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Failed to upgrade GitHub skill to local: ${upgradeError instanceof Error ? upgradeError.message : String(upgradeError)}` }) }],
            isError: true,
          }
        }
      }

      cwd = path.dirname(skill.filePath!)
      skillName = skill.name
    }

    try {
      const execOptions: { cwd?: string; timeout?: number; maxBuffer?: number; shell?: string } = {
        maxBuffer: 10 * 1024 * 1024,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      }

      if (cwd) {
        execOptions.cwd = cwd
      }

      if (timeout > 0) {
        execOptions.timeout = timeout
      }

      const { stdout, stderr } = await execAsync(command, execOptions)

      const MAX_OUTPUT_CHARS = 10000
      const HALF = Math.floor(MAX_OUTPUT_CHARS / 2)
      let truncatedStdout = stdout || ""
      let outputTruncated = false
      if (truncatedStdout.length > MAX_OUTPUT_CHARS) {
        const totalLines = truncatedStdout.split("\n").length
        const totalBytes = truncatedStdout.length
        const head = truncatedStdout.substring(0, HALF)
        const tail = truncatedStdout.substring(truncatedStdout.length - HALF)
        truncatedStdout = head +
          `\n\n... [OUTPUT TRUNCATED: ${totalBytes} bytes, ~${totalLines} lines total. ` +
          `Showing first ${HALF} + last ${HALF} chars. ` +
          `Use head/tail/sed to read specific ranges, e.g.: sed -n '100,200p' file] ...\n\n` +
          tail
        outputTruncated = true
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              command,
              cwd: cwd || process.cwd(),
              skillName,
              stdout: truncatedStdout,
              stderr: stderr || "",
              ...(outputTruncated ? { outputTruncated: true, hint: "Output was truncated. Use head -n/tail -n/sed -n 'X,Yp' to read specific sections." } : {}),
            }, null, 2),
          },
        ],
        isError: false,
      }
    } catch (error: any) {
      let stdout = error.stdout || ""
      const stderr = error.stderr || ""
      const errorMessage = error.message || String(error)
      const exitCode = error.code

      const MAX_OUTPUT_CHARS = 10000
      const HALF = Math.floor(MAX_OUTPUT_CHARS / 2)
      if (stdout.length > MAX_OUTPUT_CHARS) {
        const totalLines = stdout.split("\n").length
        const head = stdout.substring(0, HALF)
        const tail = stdout.substring(stdout.length - HALF)
        stdout = head +
          `\n\n... [OUTPUT TRUNCATED: ${stdout.length} bytes, ~${totalLines} lines. Use head/tail/sed to read specific ranges] ...\n\n` +
          tail
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              command,
              cwd: cwd || process.cwd(),
              skillName,
              error: errorMessage,
              exitCode,
              stdout,
              stderr,
            }, null, 2),
          },
        ],
        isError: true,
      }
    }
  },

  save_memory: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.content !== "string" || args.content.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "content required" }) }],
        isError: true,
      }
    }

    const content = args.content.trim().replace(/[\r\n]+/g, ' ').slice(0, 80)
    const importance = (["low", "medium", "high", "critical"].includes(args.importance as string)
      ? args.importance
      : "medium") as "low" | "medium" | "high" | "critical"

    const now = Date.now()
    const memory: AgentMemory = {
      id: `memory_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      title: content.slice(0, 50),
      content,
      tags: [],
      importance,
    }

    try {
      const success = await memoryService.saveMemory(memory)
      if (success) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: true, id: memory.id, content: memory.content }) }],
          isError: false,
        }
      } else {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to save" }) }],
          isError: true,
        }
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  list_memories: async (): Promise<MCPToolResult> => {
    try {
      const memories = await memoryService.getAllMemories()
      const list = memories.map(m => ({ id: m.id, content: m.content, importance: m.importance }))
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: list.length, memories: list }) }],
        isError: false,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  delete_memories: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const hasIds = Array.isArray(args.memoryIds) && args.memoryIds.length > 0
    const deleteAll = args.deleteAll === true

    if (!hasIds && !deleteAll) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "Provide memoryIds array or set deleteAll: true" }) }], isError: true }
    }
    if (hasIds && deleteAll) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "Cannot use both memoryIds and deleteAll" }) }], isError: true }
    }

    try {
      if (deleteAll) {
        const result = await memoryService.deleteAllMemories()
        if (result.error) {
          return { content: [{ type: "text", text: JSON.stringify({ success: false, error: result.error }) }], isError: true }
        }
        return { content: [{ type: "text", text: JSON.stringify({ success: true, deletedCount: result.deletedCount }) }], isError: false }
      }

      const memoryIds: string[] = []
      for (const id of args.memoryIds as unknown[]) {
        if (typeof id === "string" && id.trim() !== "") memoryIds.push(id.trim())
      }
      if (memoryIds.length === 0) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "memoryIds must contain valid string IDs" }) }], isError: true }
      }

      if (memoryIds.length === 1) {
        const success = await memoryService.deleteMemory(memoryIds[0])
        return { content: [{ type: "text", text: JSON.stringify({ success, deleted: memoryIds[0] }) }], isError: !success }
      }

      const result = await memoryService.deleteMultipleMemories(memoryIds)
      if (result.error) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: result.error }) }], isError: true }
      }
      return { content: [{ type: "text", text: JSON.stringify({ success: true, deletedCount: result.deletedCount, requestedCount: memoryIds.length }) }], isError: false }
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }], isError: true }
    }
  },

  list_server_tools: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.serverName !== "string" || args.serverName.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "serverName must be a non-empty string" }) }],
        isError: true,
      }
    }

    if (!_mcpService) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "MCP service not available" }) }], isError: true }
    }

    const serverName = args.serverName.trim()
    const allTools = _mcpService.getAvailableTools()

    const serverTools = allTools.filter((tool) => {
      const toolServerName = tool.name.includes(":") ? tool.name.split(":")[0] : "unknown"
      return toolServerName === serverName
    })

    if (serverTools.length === 0) {
      const serverStatus = _mcpService.getServerStatus()
      if (serverStatus[serverName]) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              serverName,
              connected: serverStatus[serverName].connected,
              tools: [],
              count: 0,
              message: serverStatus[serverName].connected
                ? "Server is connected but has no tools available"
                : "Server is not connected",
            }, null, 2),
          }],
          isError: false,
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Server '${serverName}' not found. Use list_mcp_servers to see available servers.`,
          }, null, 2),
        }],
        isError: true,
      }
    }

    const toolList = serverTools.map((tool) => {
      const toolName = tool.name.includes(":") ? tool.name.split(":")[1] : tool.name
      return {
        name: tool.name,
        shortName: toolName,
        description: tool.description,
      }
    })

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          serverName,
          tools: toolList,
          count: toolList.length,
          hint: "Use get_tool_schema to get full parameter details for a specific tool",
        }, null, 2),
      }],
      isError: false,
    }
  },

  get_tool_schema: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.toolName !== "string" || args.toolName.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "toolName must be a non-empty string" }) }],
        isError: true,
      }
    }

    if (!_mcpService) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "MCP service not available" }) }], isError: true }
    }

    const toolName = args.toolName.trim()
    const allTools = _mcpService.getAvailableTools()

    let tool = allTools.find((t) => t.name === toolName)

    if (!tool && !toolName.includes(":")) {
      const matchingTools = allTools.filter((t) => {
        const shortName = t.name.includes(":") ? t.name.split(":")[1] : t.name
        return shortName === toolName
      })

      if (matchingTools.length > 1) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Ambiguous tool name '${toolName}' - found in multiple servers. Please use the fully-qualified name.`,
              matchingTools: matchingTools.map((t) => t.name),
              hint: "Use one of the fully-qualified tool names listed above (e.g., 'server:tool_name')",
            }, null, 2),
          }],
          isError: true,
        }
      }

      tool = matchingTools[0]
    }

    if (!tool) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Tool '${toolName}' not found. Use list_server_tools to see available tools for a server.`,
            availableTools: allTools.slice(0, 10).map((t) => t.name),
            hint: allTools.length > 10 ? `...and ${allTools.length - 10} more tools` : undefined,
          }, null, 2),
        }],
        isError: true,
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        }, null, 2),
      }],
      isError: false,
    }
  },

  load_skill_instructions: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.skillId !== "string" || args.skillId.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "skillId must be a non-empty string" }) }],
        isError: true,
      }
    }

    const skillId = args.skillId.trim()
    const { skillsService } = await import("./skills-service")
    const skill = skillsService.getSkill(skillId)

    if (!skill) {
      const allSkills = skillsService.getSkills()
      const skillByName = allSkills.find(s => s.name.toLowerCase() === skillId.toLowerCase())

      if (skillByName) {
        return {
          content: [{
            type: "text",
            text: `# ${skillByName.name}\n\n${skillByName.instructions}`,
          }],
          isError: false,
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Skill '${skillId}' not found. Check the Available Skills section in the system prompt for valid skill IDs.`,
          }),
        }],
        isError: true,
      }
    }

    return {
      content: [{
        type: "text",
        text: `# ${skill.name}\n\n${skill.instructions}`,
      }],
      isError: false,
    }
  },

  list_skills: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const { skillsService } = await import("./skills-service")
    const allSkills = skillsService.getSkills()

    const profileId = typeof args.profileId === "string" ? args.profileId.trim() : undefined
    const profile = profileId ? agentProfileService.getById(profileId) : undefined

    const skillsList = allSkills.map(skill => {
      const entry: Record<string, unknown> = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
      }
      if (profile) {
        entry.enabled = agentProfileService.isSkillEnabledForProfile(profile.id, skill.id)
      }
      return entry
    })

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          skills: skillsList,
          total: skillsList.length,
          ...(profile ? { profileId: profile.id, profileName: profile.displayName || profile.name } : {}),
        }, null, 2),
      }],
      isError: false,
    }
  },

  toggle_agent_skill: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    if (typeof args.profileId !== "string" || args.profileId.trim() === "") {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "profileId must be a non-empty string" }) }], isError: true }
    }
    if (typeof args.skillId !== "string" || args.skillId.trim() === "") {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "skillId must be a non-empty string" }) }], isError: true }
    }

    const profileId = args.profileId.trim()
    const skillId = args.skillId.trim()
    const profile = agentProfileService.getById(profileId)

    if (!profile) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: `Agent profile '${profileId}' not found` }) }], isError: true }
    }

    const { skillsService } = await import("./skills-service")
    const skill = skillsService.getSkill(skillId)
    if (!skill) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: `Skill '${skillId}' not found` }) }], isError: true }
    }

    if (typeof args.enabled === "boolean") {
      const isCurrentlyEnabled = agentProfileService.isSkillEnabledForProfile(profileId, skillId)
      if (args.enabled === isCurrentlyEnabled) {
        return {
          content: [{ type: "text", text: JSON.stringify({
            success: true,
            skillId,
            profileId,
            enabled: isCurrentlyEnabled,
            message: `Skill '${skill.name}' is already ${isCurrentlyEnabled ? "enabled" : "disabled"} for this agent.`,
          }) }],
          isError: false,
        }
      }
    }

    const allSkillIds = skillsService.getSkills().map(s => s.id)
    const updated = agentProfileService.toggleProfileSkill(profileId, skillId, allSkillIds)

    if (!updated) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to update agent profile" }) }], isError: true }
    }

    const nowEnabled = agentProfileService.isSkillEnabledForProfile(profileId, skillId)

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        skillId,
        skillName: skill.name,
        profileId,
        profileName: updated.displayName || updated.name,
        enabled: nowEnabled,
        message: `Skill '${skill.name}' is now ${nowEnabled ? "enabled" : "disabled"} for agent '${updated.displayName || updated.name}'.`,
      }, null, 2) }],
      isError: false,
    }
  },

  // ============================================================================
  // Repeat Task Management
  // ============================================================================

  list_repeat_tasks: async (): Promise<MCPToolResult> => {
    try {
      const { loopService } = await import("./loop-service")
      const loops = loopService.getLoops()
      const list = loops.map(l => ({
        id: l.id,
        name: l.name,
        enabled: l.enabled,
        intervalMinutes: l.intervalMinutes,
        prompt: l.prompt.slice(0, 200) + (l.prompt.length > 200 ? "..." : ""),
        runOnStartup: l.runOnStartup ?? false,
        lastRunAt: l.lastRunAt,
        profileId: l.profileId,
      }))
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: list.length, tasks: list }) }],
        isError: false,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  save_repeat_task: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    try {
      if (typeof args.name !== "string" || !args.name.trim()) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "name is required" }) }], isError: true }
      }
      if (typeof args.prompt !== "string" || !args.prompt.trim()) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "prompt is required" }) }], isError: true }
      }
      const intervalMinutes = typeof args.intervalMinutes === "number" ? Math.max(1, Math.floor(args.intervalMinutes)) : 60

      const { loopService } = await import("./loop-service")
      const { randomUUID } = await import("crypto")

      const existingId = typeof args.id === "string" ? args.id.trim() : ""
      const existing = existingId ? loopService.getLoop(existingId) : undefined
      const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || randomUUID()

      const task: import("./types").LoopConfig = {
        id: existing?.id || existingId || slugify((args.name as string).trim()),
        name: (args.name as string).trim(),
        prompt: (args.prompt as string).trim(),
        intervalMinutes,
        enabled: typeof args.enabled === "boolean" ? args.enabled : existing?.enabled ?? true,
        runOnStartup: typeof args.runOnStartup === "boolean" ? args.runOnStartup : existing?.runOnStartup,
        profileId: typeof args.profileId === "string" ? args.profileId.trim() || undefined : existing?.profileId,
        lastRunAt: existing?.lastRunAt,
      }

      const saved = loopService.saveLoop(task)
      if (!saved) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to persist repeat task" }) }],
          isError: true,
        }
      }

      if (task.enabled) {
        loopService.startLoop(task.id)
      } else {
        loopService.stopLoop(task.id)
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, id: task.id, action: existing ? "updated" : "created", name: task.name }) }],
        isError: false,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  delete_repeat_task: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    try {
      if (typeof args.taskId !== "string" || !args.taskId.trim()) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "taskId is required" }) }], isError: true }
      }
      const { loopService } = await import("./loop-service")
      const deleted = loopService.deleteLoop(args.taskId.trim())
      return {
        content: [{ type: "text", text: JSON.stringify({ success: deleted, id: args.taskId, message: deleted ? "Task deleted" : "Task not found" }) }],
        isError: !deleted,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  // ============================================================================
  // Agent Profile Management
  // ============================================================================

  list_agent_profiles: async (): Promise<MCPToolResult> => {
    try {
      const profiles = agentProfileService.getAll()
      const list = profiles.map(p => ({
        id: p.id,
        name: p.displayName || p.name,
        description: p.description,
        role: p.role,
        connectionType: p.connection.type,
        enabled: p.enabled,
        isBuiltIn: p.isBuiltIn ?? false,
      }))
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, count: list.length, agents: list }) }],
        isError: false,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  save_agent_profile: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    try {
      if (typeof args.name !== "string" || !args.name.trim()) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "name is required" }) }], isError: true }
      }

      const name = (args.name as string).trim()
      const existingId = typeof args.id === "string" ? args.id.trim() : ""
      const existing = existingId ? agentProfileService.getById(existingId) : undefined

      if (existing) {
        const updates: Record<string, unknown> = { displayName: name }
        if (typeof args.description === "string") updates.description = args.description
        if (typeof args.systemPrompt === "string") updates.systemPrompt = args.systemPrompt
        if (typeof args.guidelines === "string") updates.guidelines = args.guidelines
        if (typeof args.enabled === "boolean") updates.enabled = args.enabled

        const updated = agentProfileService.update(existingId, updates)
        return {
          content: [{ type: "text", text: JSON.stringify({ success: !!updated, id: existingId, action: "updated", name }) }],
          isError: !updated,
        }
      } else {
        const newProfile = agentProfileService.create({
          name,
          displayName: name,
          description: typeof args.description === "string" ? args.description : undefined,
          systemPrompt: typeof args.systemPrompt === "string" ? args.systemPrompt : undefined,
          guidelines: typeof args.guidelines === "string" ? args.guidelines : "",
          connection: { type: "internal" },
          role: "delegation-target",
          enabled: typeof args.enabled === "boolean" ? args.enabled : true,
          isAgentTarget: true,
        })
        return {
          content: [{ type: "text", text: JSON.stringify({ success: true, id: newProfile.id, action: "created", name }) }],
          isError: false,
        }
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },

  delete_agent_profile: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    try {
      if (typeof args.profileId !== "string" || !args.profileId.trim()) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "profileId is required" }) }], isError: true }
      }
      const id = args.profileId.trim()
      const profile = agentProfileService.getById(id)
      if (profile?.isBuiltIn) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "Cannot delete built-in agents" }) }], isError: true }
      }
      const deleted = agentProfileService.delete(id)
      return {
        content: [{ type: "text", text: JSON.stringify({ success: deleted, id, message: deleted ? "Agent deleted" : "Agent not found" }) }],
        isError: !deleted,
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: String(error) }) }],
        isError: true,
      }
    }
  },
}

/**
 * Execute a built-in tool by name
 */
export async function executeBuiltinTool(
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string
): Promise<MCPToolResult | null> {
  // Check for ACP router tools first
  if (_acpRouter?.isACPRouterTool(toolName)) {
    const result = await _acpRouter.executeACPRouterTool(toolName, args, sessionId)
    return {
      content: [{ type: "text", text: result.content }],
      isError: result.isError
    }
  }

  // Built-in tools use plain names (no prefix).
  // For backward compatibility, also strip legacy prefixes if present.
  let actualToolName = toolName
  if (toolName.startsWith(`${BUILTIN_SERVER_NAME}:`)) {
    actualToolName = toolName.substring(BUILTIN_SERVER_NAME.length + 1)
  }

  const handler = toolHandlers[actualToolName]
  if (!handler) {
    return null
  }

  try {
    return await handler(args, { sessionId })
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing built-in tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
}

/**
 * Check if a tool name is a built-in tool.
 */
export function isBuiltinTool(toolName: string): boolean {
  if (_acpRouter?.isACPRouterTool(toolName)) return true
  if (toolName in toolHandlers) return true
  if (toolName.startsWith(`${BUILTIN_SERVER_NAME}:`)) return true
  return false
}
