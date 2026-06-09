/**
 * Runtime tools for DotAgents runtime actions and internal capabilities.
 *
 * These tools are registered with plain names (no server prefix) and provide
 * runtime operations that are not better expressed as direct `.agents` file edits.
 *
 * Unlike external MCP servers, these tools run directly in the main process
 * and have direct access to the app's services.
 */

import { type MCPToolResult } from "./mcp-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { agentSessionStateManager } from "./state"
import { executeACPRouterTool, isACPRouterTool } from "./acp/acp-router-tools"
import { appendSessionUserResponse } from "./session-user-response-store"
import { conversationService } from "./conversation-service"
import { readMoreContext } from "./context-budget"
import { getRootAppSessionForAcpSession, setAcpSessionTitleOverride } from "./acp-session-state"
import { emitAgentProgress } from "./emit-agent-progress"
import { alwaysOnSessionService } from "./always-on-session-service"
import { loopService } from "./loop-service"
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

type AlwaysOnRuntimeLogKind = "attempt" | "blocker" | "question" | "answer" | "branch" | "error"

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
const ALWAYS_ON_LOG_ONLY_ATTEMPT_LIMIT = 6

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

  const trackedSessionId = getRootAppSessionForAcpSession(sessionId) ?? sessionId
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

function getTrackedRuntimeSessionId(sessionId?: string): string | undefined {
  if (!sessionId) return undefined
  return getRootAppSessionForAcpSession(sessionId) ?? sessionId
}

function normalizeAlwaysOnLogKind(value: unknown): AlwaysOnRuntimeLogKind | null {
  if (
    value === "attempt" ||
    value === "blocker" ||
    value === "question" ||
    value === "answer" ||
    value === "branch" ||
    value === "error"
  ) {
    return value
  }
  return null
}

function normalizeAlwaysOnLogTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\b(actual|actually|again|concrete|immediate|immediately|now|promised|real|the|with|for|and|to|a|an)\b/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function looksLikeAlwaysOnIntentOnlyAttempt(title: string, details?: string): boolean {
  const text = `${title} ${details ?? ""}`.toLowerCase()
  const hasAction = /\b(run|execute|inspect|probe|read|write|create|check|verify)\b/u.test(text)
  const hasImmediatePromise = /\b(now|actual|actually|concrete|real|immediate|immediately|execute_command|shell|filesystem|file|disk)\b/u.test(text)
  return hasAction && hasImmediatePromise
}

async function getLatestConversationMessageIndex(conversationId: string): Promise<number | undefined> {
  const conversation = await conversationService.loadConversation(conversationId)
  if (!conversation) return undefined
  const messages = Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0
    ? conversation.rawMessages
    : conversation.messages
  return messages.length > 0 ? messages.length - 1 : undefined
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
const MAX_RESPOND_TO_USER_VIDEOS = 2
const MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES = 8 * 1024 * 1024
const MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES = 250 * 1024 * 1024
const MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES = 500 * 1024 * 1024
const MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES = 12 * 1024 * 1024
const DATA_IMAGE_BASE64_PREFIX_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
}

const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".ogv": "video/ogg",
}

const escapeMarkdownAltText = (value: string) => value.replace(/[\[\]\\]/g, "").trim()

const getImageMimeTypeFromPath = (imagePath: string): string | undefined =>
  IMAGE_MIME_BY_EXTENSION[path.extname(imagePath).toLowerCase()]

const getVideoMimeTypeFromPath = (videoPath: string): string | undefined =>
  VIDEO_MIME_BY_EXTENSION[path.extname(videoPath).toLowerCase()]

const isAllowedRespondToUserImageUrl = (url: string): boolean => {
  const normalized = url.trim().toLowerCase()
  return (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    DATA_IMAGE_BASE64_PREFIX_REGEX.test(normalized)
  )
}

const isAllowedRespondToUserVideoUrl = (url: string): boolean => {
  const normalized = url.trim().toLowerCase()
  if (normalized.startsWith("assets://conversation-video/")) return true
  if (!normalized.startsWith("https://") && !normalized.startsWith("http://")) return false
  // Only allow http(s) URLs that actually look like video files so tool output
  // matches what the UI can render as a video card.
  try {
    const ext = normalized.lastIndexOf(".")
    if (ext < 0) return false
    const extension = normalized.slice(ext).replace(/[?#].*$/, "")
    return extension in VIDEO_MIME_BY_EXTENSION
  } catch {
    return false
  }
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

async function resolveValidImagePath(rawPath: string): Promise<{ resolvedPath: string; fileBytes: number }> {
  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath)

  if (path.extname(resolvedPath).toLowerCase() === ".svg") {
    throw new Error(`SVG images are not supported for conversation assets; use a raster image path: ${rawPath}`)
  }

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

  return { resolvedPath, fileBytes: stat.size }
}

async function resolveValidVideoPath(rawPath: string): Promise<{ resolvedPath: string; fileBytes: number }> {
  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath)

  const stat = await fs.stat(resolvedPath)
  if (!stat.isFile()) {
    throw new Error(`Video path is not a file: ${rawPath}`)
  }
  if (stat.size <= 0) {
    throw new Error(`Video file is empty: ${rawPath}`)
  }
  if (stat.size > MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES) {
    const maxMb = Math.round(MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES / (1024 * 1024))
    throw new Error(`Video file is larger than ${maxMb}MB: ${rawPath}`)
  }

  const mimeType = getVideoMimeTypeFromPath(resolvedPath)
  if (!mimeType) {
    throw new Error(`Unsupported video extension for path: ${rawPath}`)
  }

  return { resolvedPath, fileBytes: stat.size }
}

// Tool execution handlers
type ToolHandler = (
  args: Record<string, unknown>,
  context: BuiltinToolContext
) => Promise<MCPToolResult>

const toolHandlers: Record<string, ToolHandler> = {
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

    if (args.videos !== undefined && !Array.isArray(args.videos)) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "videos must be an array if provided" }) }],
        isError: true,
      }
    }

    const imageInputs = Array.isArray(args.images)
      ? args.images
      : []
    const videoInputs = Array.isArray(args.videos)
      ? args.videos
      : []

    if (imageInputs.length > MAX_RESPOND_TO_USER_IMAGES) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_IMAGES} images.` }) }],
        isError: true,
      }
    }

    if (videoInputs.length > MAX_RESPOND_TO_USER_VIDEOS) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_VIDEOS} videos.` }) }],
        isError: true,
      }
    }

    const mappedAppSessionId = getRootAppSessionForAcpSession(context.sessionId)
    const trackedSessionId = mappedAppSessionId ?? context.sessionId

    // Guard: don't store the response if the session was already stopped/cancelled.
    // This prevents zombie sessions from reappearing after the user stops them.
    const activeSession = agentSessionTracker.getSession(trackedSessionId)
    if (!activeSession) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Session is no longer active (was stopped or completed)" }) }],
        isError: true,
      }
    }

    const conversationId = activeSession.conversationId
    if ((imageInputs.length > 0 || videoInputs.length > 0) && !conversationId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Media assets require an active conversation" }) }],
        isError: true,
      }
    }

    const imageMarkdownBlocks: string[] = []
    const videoMarkdownBlocks: string[] = []
    let localImageCount = 0
    let localVideoCount = 0
    let embeddedImageBytes = 0
    let localVideoBytes = 0

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
          if (embeddedImageBytes + dataImageBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
            const maxMb = Math.round(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES / (1024 * 1024))
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: `Total embedded image payload exceeds the ${maxMb}MB limit` }) }],
              isError: true,
            }
          }
          embeddedImageBytes += dataImageBytes
          try {
            const assetUrl = await conversationService.storeDataImageUrlAsConversationAsset(conversationId!, url)
            imageMarkdownBlocks.push(`![${safeAlt}](${assetUrl})`)
          } catch (error) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error
                    ? `Failed to store images[${index}].url: ${error.message}`
                    : `Failed to store images[${index}].url`,
                }),
              }],
              isError: true,
            }
          }
          continue
        }
        imageMarkdownBlocks.push(`![${safeAlt}](${url})`)
        continue
      }

      try {
        const { resolvedPath, fileBytes } = await resolveValidImagePath(imagePath)
        if (embeddedImageBytes + fileBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
          const maxMb = Math.round(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES / (1024 * 1024))
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Total embedded image payload exceeds the ${maxMb}MB limit` }) }],
            isError: true,
          }
        }
        embeddedImageBytes += fileBytes
        const assetUrl = await conversationService.storeImagePathAsConversationAsset(conversationId!, resolvedPath)
        imageMarkdownBlocks.push(`![${safeAlt}](${assetUrl})`)
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

    for (let index = 0; index < videoInputs.length; index++) {
      const rawItem = videoInputs[index]
      if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `videos[${index}] must be an object` }) }],
          isError: true,
        }
      }

      const videoItem = rawItem as Record<string, unknown>
      const url = typeof videoItem.url === "string" ? videoItem.url.trim() : ""
      const videoPath = typeof videoItem.path === "string" ? videoItem.path.trim() : ""
      const preferredLabel = typeof videoItem.label === "string" ? videoItem.label.trim() : ""

      if (!url && !videoPath) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `videos[${index}] must include either url or path` }) }],
          isError: true,
        }
      }

      if (url && videoPath) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: `videos[${index}] cannot include both url and path` }) }],
          isError: true,
        }
      }

      const fallbackLabel = videoPath ? path.basename(videoPath) : `Video ${index + 1}`
      const safeLabel = escapeMarkdownAltText(preferredLabel || fallbackLabel) || `Video ${index + 1}`

      if (url) {
        if (!isAllowedRespondToUserVideoUrl(url)) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `videos[${index}].url must be a valid http(s) video URL (recognized extension: mp4, m4v, webm, mov, ogv) or an assets://conversation-video/ URL` }) }],
            isError: true,
          }
        }
        videoMarkdownBlocks.push(`[${safeLabel}](${url})`)
        continue
      }

      try {
        const { resolvedPath, fileBytes } = await resolveValidVideoPath(videoPath)
        if (localVideoBytes + fileBytes > MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES) {
          const maxMb = Math.round(MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES / (1024 * 1024))
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Total local video payload exceeds the ${maxMb}MB limit` }) }],
            isError: true,
          }
        }
        localVideoBytes += fileBytes
        const assetUrl = await conversationService.storeVideoPathAsConversationAsset(conversationId!, resolvedPath)
        videoMarkdownBlocks.push(`[${safeLabel}](${assetUrl})`)
        localVideoCount++
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error
                ? `Failed to load videos[${index}].path: ${error.message}`
                : `Failed to load videos[${index}].path`,
            }),
          }],
          isError: true,
        }
      }
    }

    const imageMarkdown = imageMarkdownBlocks.join("\n\n")
    const videoMarkdown = videoMarkdownBlocks.join("\n\n")
    const responseContent = [text, imageMarkdown, videoMarkdown].filter(Boolean).join("\n\n")
    const responseContentBytes = getUtf8ByteLength(responseContent)

    if (!responseContent.trim()) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "respond_to_user requires text, images, and/or videos" }) }],
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
            videoCount: videoMarkdownBlocks.length,
            localImageCount,
            localVideoCount,
            embeddedImageBytes,
            localVideoBytes,
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

    const title = args.title.trim()
    const mappedAppSessionId = getRootAppSessionForAcpSession(context.sessionId)
    let trackedSessionId = mappedAppSessionId ?? context.sessionId
    let session = agentSessionTracker.getSession(trackedSessionId)

    if (!session && !mappedAppSessionId) {
      const sessionIdForConversation = agentSessionTracker.findSessionByConversationId(context.sessionId)
      if (sessionIdForConversation) {
        trackedSessionId = sessionIdForConversation
        session = agentSessionTracker.getSession(trackedSessionId)
      }
    }

    const alwaysOnSummary = !session
      ? alwaysOnSessionService
        .getSummaries(loopService.getLoops(), loopService.getLoopStatuses())
        .find((summary) =>
          summary.currentSessionId === trackedSessionId ||
          summary.currentSessionId === context.sessionId ||
          summary.conversationId === context.sessionId,
        )
      : undefined
    const conversationId = session?.conversationId
      ?? alwaysOnSummary?.conversationId
      ?? (context.sessionId.startsWith("conv_") ? context.sessionId : undefined)
    if (!conversationId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Current session is not linked to a conversation" }) }],
        isError: true,
      }
    }

    const updatedConversation = await conversationService.renameConversationTitle(
      conversationId,
      title,
      "server_generated",
    )

    if (!updatedConversation) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Failed to update conversation title" }) }],
        isError: true,
      }
    }

    if (session) {
      agentSessionTracker.updateSession(trackedSessionId, {
        conversationTitle: updatedConversation.title,
      })
    }

    if (mappedAppSessionId) {
      setAcpSessionTitleOverride(context.sessionId, updatedConversation.title)
      const parentSessionId = mappedAppSessionId
      const runId = agentSessionStateManager.getSessionRunId(trackedSessionId)
      const sessionStatus = session?.status
      const isSessionComplete = sessionStatus === "completed" || sessionStatus === "error" || sessionStatus === "stopped"
      const conversationState = sessionStatus === "completed"
        ? "complete"
        : isSessionComplete
          ? "blocked"
          : "running"

      await emitAgentProgress({
        sessionId: context.sessionId,
        ...(parentSessionId && parentSessionId !== context.sessionId ? { parentSessionId } : {}),
        ...(typeof runId === "number" ? { runId } : {}),
        conversationTitle: updatedConversation.title,
        currentIteration: 0,
        maxIterations: 1,
        steps: [],
        isComplete: isSessionComplete,
        conversationState,
      })
    }

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

  log_always_on_attempt: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    const trackedSessionId = getTrackedRuntimeSessionId(context.sessionId)
    if (!trackedSessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "log_always_on_attempt requires an active agent session" }) }],
        isError: true,
      }
    }

    const kind = normalizeAlwaysOnLogKind(args.kind)
    if (!kind) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "kind must be one of: attempt, blocker, question, answer, branch, error" }) }],
        isError: true,
      }
    }

    const title = typeof args.title === "string" ? args.title.trim() : ""
    if (!title) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "title must be a non-empty string" }) }],
        isError: true,
      }
    }

    const activeSession = agentSessionTracker.getSession(trackedSessionId)
    const details = typeof args.details === "string" ? args.details : undefined
    const outcome = typeof args.outcome === "string" ? args.outcome : undefined
    const summaries = alwaysOnSessionService.getSummaries(loopService.getLoops(), loopService.getLoopStatuses())
    const summary = summaries.find((candidate) =>
      candidate.currentSessionId === trackedSessionId ||
      (!!activeSession?.conversationId && candidate.conversationId === activeSession.conversationId),
    )

    if (!summary) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Current session is not an always-on session" }) }],
        isError: true,
      }
    }

    if (summary.status === "paused" || summary.enabled === false) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Always-on session is paused; log rejected. Resume the session before recording more always-on work.",
            sessionStatus: summary.status,
          }, null, 2),
        }],
        isError: true,
      }
    }

    const normalizedTitle = normalizeAlwaysOnLogTitle(title)
    const recentLogEntries = alwaysOnSessionService.getRecentLogEntries(summary.id, 12)
    const recentSimilarCount = recentLogEntries
      .filter((recentEntry) =>
        recentEntry.kind === kind &&
        normalizeAlwaysOnLogTitle(recentEntry.title) === normalizedTitle,
      )
      .length
    const isIntentOnlyAttempt = kind === "attempt" && !outcome?.trim() && looksLikeAlwaysOnIntentOnlyAttempt(title, details)
    const recentIntentOnlyAttemptCount = recentLogEntries
      .filter((recentEntry) =>
        recentEntry.kind === "attempt" &&
        !recentEntry.outcome?.trim() &&
        looksLikeAlwaysOnIntentOnlyAttempt(recentEntry.title, recentEntry.details),
      )
      .length

    if (isIntentOnlyAttempt && recentIntentOnlyAttemptCount >= ALWAYS_ON_LOG_ONLY_ATTEMPT_LIMIT) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Repeated intent-only always-on logs were rejected. Run a concrete non-log tool, record an outcome from new evidence, ask a queued question, or switch to a genuinely different branch before logging another attempt.",
            sessionStatus: summary.status,
            pendingQuestionCount: summary.pendingQuestionCount,
            recentSimilarCount,
            recentIntentOnlyAttemptCount,
          }, null, 2),
        }],
        isError: true,
      }
    }

    const entry = alwaysOnSessionService.appendLog({
      alwaysOnSessionId: summary.id,
      runtimeSessionId: trackedSessionId,
      conversationId: activeSession?.conversationId,
      runId: agentSessionStateManager.getSessionRunId(trackedSessionId),
      kind,
      title,
      details,
      outcome,
    }, loopService.getLoops())

    if (!entry) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Current session is not an always-on session" }) }],
        isError: true,
      }
    }

    const guidance: string[] = []
    if (recentSimilarCount >= 2) {
      guidance.push("This same log title has appeared repeatedly in recent attempts. Do not retry the same path unless you have new evidence; run a concrete check or switch branches.")
    }
    if (kind === "blocker" && (summary?.pendingQuestionCount ?? 0) === 0) {
      guidance.push("If user input would unblock this path, call ask_always_on_question with 2-3 choices, then continue other independent work.")
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          entry,
          sessionStatus: summary?.status,
          pendingQuestionCount: summary?.pendingQuestionCount ?? 0,
          recentSimilarCount,
          ...(guidance.length > 0 ? { guidance } : {}),
        }, null, 2),
      }],
      isError: false,
    }
  },

  ask_always_on_question: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    const trackedSessionId = getTrackedRuntimeSessionId(context.sessionId)
    if (!trackedSessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "ask_always_on_question requires an active agent session" }) }],
        isError: true,
      }
    }

    const prompt = typeof args.prompt === "string" ? args.prompt.trim() : ""
    if (!prompt) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "prompt must be a non-empty string" }) }],
        isError: true,
      }
    }

    if (!Array.isArray(args.choices) || args.choices.length < 2 || args.choices.length > 3) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "choices must contain 2 or 3 choice objects" }) }],
        isError: true,
      }
    }

    const choices = args.choices.flatMap((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return []
      const raw = item as Record<string, unknown>
      const label = typeof raw.label === "string" ? raw.label.trim() : ""
      if (!label) return []
      return [{
        id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `choice-${index + 1}`,
        label,
        ...(typeof raw.description === "string" && raw.description.trim()
          ? { description: raw.description.trim() }
          : {}),
      }]
    })

    if (choices.length < 2) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "at least two choices must include non-empty labels" }) }],
        isError: true,
      }
    }

    const activeSession = agentSessionTracker.getSession(trackedSessionId)
    const conversationId = activeSession?.conversationId
    const summary = alwaysOnSessionService
      .getSummaries(loopService.getLoops(), loopService.getLoopStatuses())
      .find((candidate) =>
        candidate.currentSessionId === trackedSessionId ||
        (!!conversationId && candidate.conversationId === conversationId),
      )

    if (!summary) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Current session is not an always-on session" }) }],
        isError: true,
      }
    }

    if (summary.status === "paused" || summary.enabled === false) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Always-on session is paused; question was not queued. Resume the session before recording more always-on work.",
            sessionStatus: summary.status,
          }, null, 2),
        }],
        isError: true,
      }
    }

    const sourceMessageIndex = conversationId
      ? await getLatestConversationMessageIndex(conversationId)
      : undefined
    const reason = args.reason === "blocker" ? "blocker" : "question"
    const question = alwaysOnSessionService.askQuestion({
      alwaysOnSessionId: summary.id,
      runtimeSessionId: trackedSessionId,
      conversationId,
      sourceMessageIndex,
      prompt,
      choices,
      allowCustom: args.allowCustom !== false,
      reason,
    }, loopService.getLoops())

    if (!question) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Current session is not an always-on session or choices were invalid" }) }],
        isError: true,
      }
    }

    const updatedSummary = alwaysOnSessionService
      .getSummaries(loopService.getLoops(), loopService.getLoopStatuses())
      .find((candidate) => candidate.id === question.alwaysOnSessionId)
    const pendingQuestionCount = updatedSummary?.pendingQuestionCount ?? 1

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          questionId: question.id,
          pendingQuestionCount,
          sessionStatus: updatedSummary?.status,
          message: "Question queued for the user. Continue other useful work instead of waiting.",
        }, null, 2),
      }],
      isError: false,
    }
  },

  execute_command: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    // Validate required command parameter
    if (!args.command || typeof args.command !== "string") {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "command parameter is required and must be a string" }) }],
        isError: true,
      }
    }

    const command = args.command as string
    if (args.skillId !== undefined) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "execute_command.skillId is no longer supported.",
            guidance: "Skills are filesystem instructions. Use the SKILL.md path shown in Available Skills, or run a normal shell command such as `cd /path/to/skill && ...`.",
            retrySuggestion: "Retry without skillId. If you need a skill, first read its SKILL.md file path with execute_command and then run commands using ordinary filesystem paths.",
          }, null, 2),
        }],
        isError: true,
      }
    }
    // Validate timeout: must be a finite non-negative number, otherwise use default
    // This prevents NaN or negative values from disabling the timeout entirely
    const rawTimeout = args.timeout
    const timeout = (typeof rawTimeout === "number" && Number.isFinite(rawTimeout) && rawTimeout >= 0)
      ? rawTimeout
      : 30000

    const effectiveCwd = process.cwd()
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
              ...(normalizedCommandResult.normalizedPaths ? { normalizedPaths: normalizedCommandResult.normalizedPaths } : {}),
              ...contextGatheringCommandBlock,
            }, null, 2),
          },
        ],
        isError: true,
      }
    }

    let runtimeFilesystemEnv: Record<string, string> = {}
    try {
      const {
        ensureRuntimeFilesystemDirectories,
        getRuntimeFilesystemEnv,
      } = await import("./runtime-filesystem-paths")
      await ensureRuntimeFilesystemDirectories(context.sessionId)
      runtimeFilesystemEnv = getRuntimeFilesystemEnv(context.sessionId)
    } catch {
      // Runtime filesystem env vars are convenience metadata; command execution
      // should still work if they cannot be prepared.
    }

    try {
      const execOptions: { cwd?: string; timeout?: number; maxBuffer?: number; shell?: string; env?: NodeJS.ProcessEnv } = {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
        env: {
          ...process.env,
          ...runtimeFilesystemEnv,
        },
      }

      execOptions.cwd = effectiveCwd

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
  if (!isRuntimeTool(toolName)) {
    return null
  }

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
  // Runtime tools are the dependency-free advertised definitions. Handlers may
  // contain private helpers during migrations, but they are not callable unless
  // listed in runtime-tool-definitions.
  if (runtimeToolDefinitions.some((tool) => tool.name === toolName)) return true
  return false
}
