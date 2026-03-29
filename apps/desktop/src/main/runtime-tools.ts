/**
 * Runtime tools for DotAgents runtime actions and internal capabilities.
 *
 * These tools are registered with plain names (no server prefix) and provide
 * runtime operations that are not better expressed as direct `.agents` file edits.
 *
 * Unlike external MCP servers, these tools run directly in the main process
 * and have direct access to the app's services.
 */

import { mcpService, type MCPTool, type MCPToolResult } from "./mcp-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { agentSessionStateManager, toolApprovalManager } from "./state"
import { emergencyStopAll } from "./emergency-stop"
import { executeACPRouterTool, isACPRouterTool } from "./acp/acp-router-tools"
import { messageQueueService } from "./message-queue-service"
import { appendSessionUserResponse } from "./session-user-response-store"
import { conversationService } from "./conversation-service"
import { readMoreContext } from "./context-budget"
import { getAppSessionForAcpSession } from "./acp-session-state"
import { promises as fs } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

// Re-export from the dependency-free definitions module.
// This breaks the circular dependency: profile-service -> runtime-tool-definitions (no cycle)
// while runtime-tools -> profile-service is still valid since profile-service no longer imports from here.
export {
  RUNTIME_TOOLS_SERVER_NAME,
  runtimeToolDefinitions as runtimeTools,
  getRuntimeToolNames,
} from "./runtime-tool-definitions"

// Import for local use
import { runtimeToolDefinitions } from "./runtime-tool-definitions"

interface BuiltinToolContext {
  sessionId?: string
}

function buildIgnoredExecuteCommandSkillIdWarning(skillId: string, availableSkillIds: string[]) {
  return {
    ignoredInvalidSkillId: skillId,
    warning: `Ignored invalid execute_command.skillId: ${skillId}. Ran the command in the default workspace instead.`,
    guidance: "skillId must be an exact loaded skill id from Available Skills. Omit skillId for normal workspace or repository commands. Never use repo names, file paths, URLs, or GitHub slugs as skillId.",
    retrySuggestion: "Retry the same command without skillId unless you explicitly need to run inside a loaded skill directory.",
    availableSkillIds,
  }
}

type PackageManagerName = "pnpm" | "npm" | "yarn" | "bun"

interface PreferredPackageManager {
  name: PackageManagerName
  lockfile: string
  directory: string
}

const PACKAGE_MANAGER_LOCKFILES: Array<{ name: PackageManagerName; lockfiles: string[] }> = [
  { name: "pnpm", lockfiles: ["pnpm-lock.yaml"] },
  { name: "npm", lockfiles: ["package-lock.json"] },
  { name: "yarn", lockfiles: ["yarn.lock"] },
  { name: "bun", lockfiles: ["bun.lock", "bun.lockb"] },
]

const PACKAGE_MANAGER_TOKEN_FAMILY: Record<string, PackageManagerName> = {
  npm: "npm",
  npx: "npm",
  pnpm: "pnpm",
  pnpx: "pnpm",
  yarn: "yarn",
  bun: "bun",
  bunx: "bun",
}

const PACKAGE_MANAGER_COMMAND_REGEX = /(^|&&|\|\||;)\s*(npm|npx|pnpm|pnpx|yarn|bun|bunx)(?=\s|$)/g
const CONTEXT_GATHERING_REQUEST_REGEX = /\b(gather (?:as much )?context|what(?:'s| is) next|next steps?|what should (?:the )?user work on next|immediate next steps?)\b/i
const USER_REQUEST_ALLOWS_VALIDATION_REGEX = /\b(test|tests|testing|verify|verification|validate|validation|build|compile|lint|typecheck|smoke test|run the app|run the tests|fix|change|edit|implement|update|refactor|install|dependency|dependencies)\b/i
const HIGH_IMPACT_PACKAGE_MANAGER_COMMAND_REGEX = /(^|&&|\|\||;)\s*(npm|npx|pnpm|pnpx|yarn|bun|bunx)\b/i
const VALIDATION_OR_DEPENDENCY_COMMAND_REGEX = /\b(test|tests|vitest|jest|playwright(?:\s+test)?|cypress|lint|eslint|typecheck|tsc\b|build|compile|install|add|remove|uninstall|update|upgrade)\b/i
const POSIX_WORKSPACE_PATH_REGEX = /(?:\/Users|\/home)\/[^/\s'"`;|&()]+(?:\/[A-Za-z0-9._-]+)+/g
const POSIX_HOME_PREFIX_REGEX = /^(\/Users\/[^/]+|\/home\/[^/]+)/

async function detectPreferredPackageManager(startDir: string): Promise<PreferredPackageManager | null> {
  let currentDir = path.resolve(startDir)

  while (true) {
    for (const candidate of PACKAGE_MANAGER_LOCKFILES) {
      for (const lockfile of candidate.lockfiles) {
        const lockfilePath = path.join(currentDir, lockfile)
        if (await pathExists(lockfilePath)) {
          return {
            name: candidate.name,
            lockfile,
            directory: currentDir,
          }
        }
      }
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return null
    }
    currentDir = parentDir
  }
}

function getPackageManagerRetrySuggestion(packageManager: PackageManagerName): string {
  switch (packageManager) {
    case "pnpm":
      return "Retry with pnpm for installs/scripts and pnpm exec for one-off CLIs. Do not use npm or npx in this workspace."
    case "npm":
      return "Retry with npm for installs/scripts and npx for one-off CLIs in this workspace."
    case "yarn":
      return "Retry with yarn for installs/scripts and yarn dlx for one-off CLIs in this workspace."
    case "bun":
      return "Retry with bun for installs/scripts and bunx for one-off CLIs in this workspace."
  }
}

function detectPackageManagerMismatch(command: string, preferredPackageManager: PreferredPackageManager | null) {
  if (!preferredPackageManager) {
    return null
  }

  for (const match of command.matchAll(PACKAGE_MANAGER_COMMAND_REGEX)) {
    const token = match[2]
    const family = PACKAGE_MANAGER_TOKEN_FAMILY[token]
    if (family && family !== preferredPackageManager.name) {
      return {
        detectedPackageManager: preferredPackageManager.name,
        packageManagerLockfile: path.join(preferredPackageManager.directory, preferredPackageManager.lockfile),
        offendingToken: token,
        error: `This workspace uses ${preferredPackageManager.name} (detected via ${preferredPackageManager.lockfile}), so '${token}' is the wrong package manager here.`,
        retrySuggestion: getPackageManagerRetrySuggestion(preferredPackageManager.name),
      }
    }
  }

  return null
}

async function getLatestUserMessageForSession(sessionId?: string): Promise<string | null> {
  if (!sessionId) {
    return null
  }

  const trackedSessionId = getAppSessionForAcpSession(sessionId) ?? sessionId
  const session = agentSessionTracker.getSession(trackedSessionId)
  if (!session?.conversationId) {
    return null
  }

  const conversation = await conversationService.loadConversation(session.conversationId)
  if (!conversation) {
    return null
  }

  const storedMessages = Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0
    ? conversation.rawMessages
    : conversation.messages

  const latestUserMessage = [...storedMessages]
    .reverse()
    .find((message) => message.role === "user" && typeof message.content === "string" && message.content.trim().length > 0)

  return latestUserMessage?.content?.trim() ?? null
}

function detectContextGatheringCommandBlock(command: string, latestUserMessage: string | null) {
  if (!latestUserMessage) {
    return null
  }

  if (!CONTEXT_GATHERING_REQUEST_REGEX.test(latestUserMessage)) {
    return null
  }

  if (USER_REQUEST_ALLOWS_VALIDATION_REGEX.test(latestUserMessage)) {
    return null
  }

  if (!HIGH_IMPACT_PACKAGE_MANAGER_COMMAND_REGEX.test(command) || !VALIDATION_OR_DEPENDENCY_COMMAND_REGEX.test(command)) {
    return null
  }

  const blockedCommandCategory = /\b(install|add|remove|uninstall|update|upgrade)\b/i.test(command)
    ? "dependency-mutation"
    : "package-manager-validation"

  return {
    blockedCommandCategory,
    latestUserRequestExcerpt: latestUserMessage.slice(0, 240),
    error: "The latest user request is a planning/context question, so package-manager test/build/install commands are blocked for this turn.",
    guidance: "For context-gathering or 'what's next' requests, prefer read-only inspection commands such as git status, ls, find, rg, sed, head, tail, or cat.",
    retrySuggestion: "Retry with read-only inspection commands. Only run package-manager test/build/install/lint/typecheck commands when the user explicitly asks for verification or after you have made code changes that need targeted validation.",
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function getUserHomePrefix(targetPath: string): string | null {
  const match = targetPath.match(POSIX_HOME_PREFIX_REGEX)
  return match ? match[0] : null
}

function getWorkspaceRelativePath(targetPath: string): string | null {
  const homePrefix = getUserHomePrefix(targetPath)
  return homePrefix ? targetPath.slice(homePrefix.length) : null
}

function sharesWorkspaceRelativePath(candidatePath: string, workingDirectory: string): boolean {
  const candidateRelativePath = getWorkspaceRelativePath(candidatePath)
  const workingDirectoryRelativePath = getWorkspaceRelativePath(workingDirectory)

  if (!candidateRelativePath || !workingDirectoryRelativePath) {
    return false
  }

  return candidateRelativePath === workingDirectoryRelativePath
    || candidateRelativePath.startsWith(`${workingDirectoryRelativePath}/`)
    || workingDirectoryRelativePath.startsWith(`${candidateRelativePath}/`)
}

async function normalizeExecuteCommandWorkspacePaths(
  rawCommand: string,
  workingDirectory: string,
): Promise<{ command: string; normalizedPaths?: Array<{ from: string; to: string }> }> {
  const currentHomePrefix = getUserHomePrefix(workingDirectory)
  if (!currentHomePrefix) {
    return { command: rawCommand }
  }

  const candidatePaths = Array.from(new Set(
    rawCommand.match(POSIX_WORKSPACE_PATH_REGEX) ?? [],
  ))

  if (candidatePaths.length === 0) {
    return { command: rawCommand }
  }

  let normalizedCommand = rawCommand
  const normalizedPaths: Array<{ from: string; to: string }> = []

  for (const candidatePath of candidatePaths) {
    if (!sharesWorkspaceRelativePath(candidatePath, workingDirectory)) {
      continue
    }

    if (await pathExists(candidatePath)) {
      continue
    }

    const candidateHomePrefix = getUserHomePrefix(candidatePath)
    if (!candidateHomePrefix || candidateHomePrefix === currentHomePrefix) {
      continue
    }

    const rewrittenPath = currentHomePrefix + candidatePath.slice(candidateHomePrefix.length)
    if (!(await pathExists(rewrittenPath))) {
      continue
    }

    normalizedCommand = normalizedCommand.split(candidatePath).join(rewrittenPath)
    normalizedPaths.push({ from: candidatePath, to: rewrittenPath })
  }

  return normalizedPaths.length > 0
    ? { command: normalizedCommand, normalizedPaths }
    : { command: rawCommand }
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
  list_running_agents: async (): Promise<MCPToolResult> => {
    const activeSessions = agentSessionTracker.getActiveSessions()

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
      // Calculate runtime in seconds
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
    // Validate required parameters with proper type guards
    if (!args.sessionId || typeof args.sessionId !== "string") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "sessionId is required and must be a string",
            }),
          },
        ],
        isError: true,
      }
    }

    if (!args.message || typeof args.message !== "string") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "message is required and must be a string",
            }),
          },
        ],
        isError: true,
      }
    }

    const sessionId = args.sessionId
    const message = args.message

    // Get target session
    const session = agentSessionTracker.getSession(sessionId)
    if (!session) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Agent session not found: ${sessionId}`,
            }),
          },
        ],
        isError: true,
      }
    }

    // Must have a conversation to queue message
    if (!session.conversationId) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Target agent session has no linked conversation",
            }),
          },
        ],
        isError: true,
      }
    }

    // Queue message for the target agent's conversation
    const queuedMessage = messageQueueService.enqueue(session.conversationId, message)

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
      // Kill specific session
      const session = agentSessionTracker.getSession(sessionId)
      if (!session) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `Agent session not found: ${sessionId}` }) }],
          isError: true,
        }
      }
      agentSessionStateManager.stopSession(sessionId)
      toolApprovalManager.cancelSessionApprovals(sessionId)
      agentSessionTracker.stopSession(sessionId)
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, sessionId, message: `Agent session ${sessionId} (${session.conversationTitle}) terminated` }, null, 2) }],
        isError: false,
      }
    }

    // Kill all agents
    const activeSessions = agentSessionTracker.getActiveSessions()
    if (activeSessions.length === 0) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: "No agents were running", sessionsTerminated: 0 }, null, 2) }],
        isError: false,
      }
    }
    toolApprovalManager.cancelAllApprovals()
    const { before, after } = await emergencyStopAll()
    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        message: `Emergency stop: ${activeSessions.length} session(s) terminated`,
        sessionsTerminated: activeSessions.length,
        processesKilled: before - after,
      }, null, 2) }],
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

    const imageInputs = Array.isArray(args.images)
      ? args.images
      : []

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

      const fallbackAlt = imagePath
        ? path.basename(imagePath)
        : `Image ${index + 1}`
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

    const trackedSessionId = getAppSessionForAcpSession(context.sessionId) ?? context.sessionId

    // Guard: don't store the response if the session was already stopped/cancelled.
    // This prevents zombie sessions from reappearing after the user stops them.
    const activeSession = agentSessionTracker.getSession(trackedSessionId)
    if (!activeSession) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Session is no longer active (was stopped or completed)" }) }],
        isError: true,
      }
    }

    appendSessionUserResponse({
      sessionId: trackedSessionId,
      runId: agentSessionStateManager.getSessionRunId(trackedSessionId),
      text: responseContent,
    })

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

  set_session_title: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    if (!context.sessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "set_session_title requires an active agent session" }) }],
        isError: true,
      }
    }

    if (typeof args.title !== "string" || args.title.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "title must be a non-empty string" }) }],
        isError: true,
      }
    }

    const trackedSessionId = getAppSessionForAcpSession(context.sessionId) ?? context.sessionId
    const session = agentSessionTracker.getSession(trackedSessionId)
    if (!session?.conversationId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Current session is not linked to a conversation" }) }],
        isError: true,
      }
    }

    const updatedConversation = await conversationService.renameConversationTitle(
      session.conversationId,
      args.title,
    )

    if (!updatedConversation) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to update session title" }) }],
        isError: true,
      }
    }

    agentSessionTracker.updateSession(trackedSessionId, {
      conversationTitle: updatedConversation.title,
    })

    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, title: updatedConversation.title }, null, 2) }],
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
            message: "Completion signal recorded. The runtime will verify completion and finalize the turn without requiring another user-facing response.",
          }, null, 2),
        },
      ],
      isError: false,
    }
  },

  execute_command: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    const { skillsService } = await import("./skills-service")

    // Validate required command parameter
    if (!args.command || typeof args.command !== "string") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "command parameter is required and must be a string" }) }],
        isError: true,
      }
    }

    const command = args.command as string
    const skillId = typeof args.skillId === "string" ? args.skillId.trim() : undefined
    // Validate timeout: must be a finite non-negative number, otherwise use default
    // This prevents NaN or negative values from disabling the timeout entirely
    const rawTimeout = args.timeout
    const timeout = (typeof rawTimeout === "number" && Number.isFinite(rawTimeout) && rawTimeout >= 0)
      ? rawTimeout
      : 30000

    // Determine the working directory
    let cwd: string | undefined
    let skillName: string | undefined
    let ignoredInvalidSkillIdWarning: ReturnType<typeof buildIgnoredExecuteCommandSkillIdWarning> | undefined

    if (skillId) {
      // Find the skill and get its directory
      let skill = skillsService.getSkill(skillId)
      if (!skill) {
        const availableSkillIds = skillsService
          .getSkills()
          .map((skill) => skill.id)
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        ignoredInvalidSkillIdWarning = buildIgnoredExecuteCommandSkillIdWarning(skillId, availableSkillIds)
      } else {

        if (!skill.filePath) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Skill has no file path (not imported from disk): ${skill.name}` }) }],
            isError: true,
          }
        }

        // For local files, use the directory containing SKILL.md
        // For GitHub skills, automatically upgrade to local clone
        if (skill.filePath.startsWith("github:")) {
          try {
            // Dynamically import skills-service to avoid circular dependency
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
    }

    const effectiveCwd = cwd || process.cwd()
    const normalizedCommandResult = await normalizeExecuteCommandWorkspacePaths(command, effectiveCwd)
    const effectiveCommand = normalizedCommandResult.command
    const preferredPackageManager = await detectPreferredPackageManager(effectiveCwd)
    const packageManagerMismatch = detectPackageManagerMismatch(effectiveCommand, preferredPackageManager)

    if (packageManagerMismatch) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              command: effectiveCommand,
              originalCommand: effectiveCommand === command ? undefined : command,
              cwd: effectiveCwd,
              skillName,
              ...(ignoredInvalidSkillIdWarning ?? {}),
              ...(normalizedCommandResult.normalizedPaths ? { normalizedPaths: normalizedCommandResult.normalizedPaths } : {}),
              ...packageManagerMismatch,
            }, null, 2),
          },
        ],
        isError: true,
      }
    }

    const latestUserMessage = await getLatestUserMessageForSession(context.sessionId)
    const contextGatheringCommandBlock = detectContextGatheringCommandBlock(effectiveCommand, latestUserMessage)

    if (contextGatheringCommandBlock) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              command: effectiveCommand,
              originalCommand: effectiveCommand === command ? undefined : command,
              cwd: effectiveCwd,
              skillName,
              ...(ignoredInvalidSkillIdWarning ?? {}),
              ...(normalizedCommandResult.normalizedPaths ? { normalizedPaths: normalizedCommandResult.normalizedPaths } : {}),
              ...contextGatheringCommandBlock,
            }, null, 2),
          },
        ],
        isError: true,
      }
    }

    try {
      const execOptions: { cwd?: string; timeout?: number; maxBuffer?: number; shell?: string } = {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      }

      if (cwd) {
        execOptions.cwd = cwd
      }

      if (timeout > 0) {
        execOptions.timeout = timeout
      }

      const { stdout, stderr } = await execAsync(effectiveCommand, execOptions)

      // Truncate large outputs to prevent context bloat
      // Keep first 5K + last 5K chars so agent sees both beginning and end
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
              command: effectiveCommand,
              originalCommand: effectiveCommand === command ? undefined : command,
              cwd: effectiveCwd,
              skillName,
              ...(ignoredInvalidSkillIdWarning ?? {}),
              ...(normalizedCommandResult.normalizedPaths ? { normalizedPaths: normalizedCommandResult.normalizedPaths } : {}),
              stdout: truncatedStdout,
              stderr: stderr || "",
              ...(outputTruncated ? { outputTruncated: true, hint: "Output was truncated. Use head -n/tail -n/sed -n 'X,Yp' to read specific sections." } : {}),
            }, null, 2),
          },
        ],
        isError: false,
      }
    } catch (error: any) {
      // exec errors include stdout/stderr in the error object
      let stdout = error.stdout || ""
      const stderr = error.stderr || ""
      const errorMessage = error.message || String(error)
      const exitCode = error.code

      // Truncate large error outputs too
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

      // Detect shell escaping issues and add guidance
      const hasShellEscapingIssue = /unexpected (EOF|end of file)|unterminated (string|quote)|syntax error near/i.test(stderr + errorMessage);
      const hint = hasShellEscapingIssue
        ? '\n\nHINT: This command likely failed due to shell escaping issues with special characters or long strings. Try writing the content to a file first (e.g., with write_file or echo > file), then reference the file in your command.'
        : '';

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              command: effectiveCommand,
              originalCommand: effectiveCommand === command ? undefined : command,
              cwd: effectiveCwd,
              skillName,
              ...(ignoredInvalidSkillIdWarning ?? {}),
              ...(normalizedCommandResult.normalizedPaths ? { normalizedPaths: normalizedCommandResult.normalizedPaths } : {}),
              error: errorMessage + hint,
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

  list_server_tools: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    // Validate serverName parameter
    if (typeof args.serverName !== "string" || args.serverName.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "serverName must be a non-empty string" }) }],
        isError: true,
      }
    }

    const serverName = args.serverName.trim()
    const allTools = mcpService.getAvailableTools()

    // Filter tools by server name
    const serverTools = allTools.filter((tool) => {
      const toolServerName = tool.name.includes(":") ? tool.name.split(":")[0] : "unknown"
      return toolServerName === serverName
    })

    if (serverTools.length === 0) {
      // Check if the server exists but has no tools
      const serverStatus = mcpService.getServerStatus()
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
            error: `Server '${serverName}' not found. Check the configured server list in the prompt, app UI, or .agents/mcp.json.`,
          }, null, 2),
        }],
        isError: true,
      }
    }

    // Return tools with brief descriptions (no full schemas)
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
    // Validate toolName parameter
    if (typeof args.toolName !== "string" || args.toolName.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "toolName must be a non-empty string" }) }],
        isError: true,
      }
    }

    const toolName = args.toolName.trim()
    const allTools = mcpService.getAvailableTools()

    // Find the tool (try exact match first, then partial match)
    let tool = allTools.find((t) => t.name === toolName)

    // If not found, try matching just the tool name part (without server prefix)
    if (!tool && !toolName.includes(":")) {
      // Find ALL matching tools to detect ambiguity
      const matchingTools = allTools.filter((t) => {
        const shortName = t.name.includes(":") ? t.name.split(":")[1] : t.name
        return shortName === toolName
      })

      if (matchingTools.length > 1) {
        // Ambiguous match - multiple servers have a tool with this name
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

      // Single match - use it
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
    // Validate skillId parameter
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
      // Try to find by name as fallback
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

  read_more_context: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    if (!context.sessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "read_more_context requires an active agent session" }) }],
        isError: true,
      }
    }

    if (typeof args.contextRef !== "string" || args.contextRef.trim() === "") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "contextRef must be a non-empty string" }) }],
        isError: true,
      }
    }

    const result = readMoreContext(context.sessionId, args.contextRef.trim(), {
      mode: typeof args.mode === "string" ? args.mode as "overview" | "head" | "tail" | "window" | "search" : undefined,
      offset: typeof args.offset === "number" ? args.offset : undefined,
      length: typeof args.length === "number" ? args.length : undefined,
      query: typeof args.query === "string" ? args.query : undefined,
      maxChars: typeof args.maxChars === "number" ? args.maxChars : undefined,
    })

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: result.success === false,
    }
  },

}

/**
 * Execute a runtime tool by name.
 * @param toolName The tool name (for example, "respond_to_user")
 * @param args The tool arguments
 * @param sessionId Optional session ID for ACP router tools
 * @returns The tool result
 */
export async function executeRuntimeTool(
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string
): Promise<MCPToolResult | null> {
  // Check for ACP router tools first
  if (isACPRouterTool(toolName)) {
    const result = await executeACPRouterTool(toolName, args, sessionId)
    return {
      content: [{ type: "text", text: result.content }],
      isError: result.isError
    }
  }

  const actualToolName = toolName

  // Find and execute the handler
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
          text: `Error executing runtime tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
}

/**
 * Check if a tool name is a DotAgents runtime tool.
 */
export function isRuntimeTool(toolName: string): boolean {
  // Check ACP router tools
  if (isACPRouterTool(toolName)) return true
  // Check if it's in our handler map (plain name match)
  if (toolName in toolHandlers) return true
  return false
}
