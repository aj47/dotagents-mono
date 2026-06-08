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
import { goalOrchestratorService } from "./goal-orchestrator-service"
import { loopService } from "./loop-service"
import { promises as fs } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import type { Decision, Goal, GoalOrchestratorSnapshot, GoalStatus, LoopConfig, LoopSchedule, WorkItem, WorkItemStatus } from "../shared/types"
import {
  ANSWER_DECISION_TOOL,
  CREATE_DECISION_TOOL,
  CREATE_GOAL_TOOL,
  CREATE_REPEAT_TASK_TOOL,
  CREATE_WORK_ITEM_TOOL,
  DISMISS_DECISION_TOOL,
  GET_GOAL_ORCHESTRATOR_SNAPSHOT_TOOL,
  GET_REPEAT_TASKS_TOOL,
  RUN_GOAL_ORCHESTRATOR_TOOL,
  RUN_REPEAT_TASK_TOOL,
  START_GOAL_WORK_ITEM_TOOL,
  UPDATE_GOAL_TOOL,
  UPDATE_REPEAT_TASK_TOOL,
  UPDATE_WORK_ITEM_TOOL,
} from "../shared/runtime-tool-names"

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

function toolJson(payload: unknown, isError = false): MCPToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError,
  }
}

function getStringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeLookupText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function getSnapshotForRuntimeTool(): GoalOrchestratorSnapshot {
  return goalOrchestratorService.getSnapshot()
}

function compactGoal(goal: Goal) {
  return {
    id: goal.id,
    title: goal.title,
    status: goal.status,
    notes: goal.notes,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }
}

function compactWorkItem(workItem: WorkItem) {
  return {
    id: workItem.id,
    goalId: workItem.goalId,
    title: workItem.title,
    status: workItem.status,
    notes: workItem.notes,
    createdAt: workItem.createdAt,
    updatedAt: workItem.updatedAt,
  }
}

function compactDecision(decision: Decision) {
  return {
    id: decision.id,
    goalId: decision.goalId,
    workItemId: decision.workItemId,
    question: decision.question,
    status: decision.status,
    answer: decision.answer,
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt,
  }
}

function buildCompactGoalSnapshot(snapshot: GoalOrchestratorSnapshot, includeHistory: boolean) {
  const historyStatuses = new Set<WorkItemStatus>(["done", "discarded"])
  return {
    goals: snapshot.goals.map(compactGoal),
    workItems: snapshot.workItems
      .filter((workItem) => includeHistory || !historyStatuses.has(workItem.status))
      .map(compactWorkItem),
    decisions: snapshot.decisions
      .filter((decision) => includeHistory || decision.status === "pending")
      .map(compactDecision),
    agentRuns: snapshot.agentRuns
      .filter((run) => includeHistory || run.status === "running")
      .map((run) => ({
        id: run.id,
        goalId: run.goalId,
        workItemId: run.workItemId,
        sessionId: run.sessionId,
        conversationId: run.conversationId,
        status: run.status,
        summary: run.summary,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      })),
    settings: snapshot.settings,
    recentActivity: snapshot.activityNotes.slice(0, includeHistory ? 20 : 8),
  }
}

function resolveGoalIdFromArgs(args: Record<string, unknown>, snapshot: GoalOrchestratorSnapshot): string | undefined {
  const goalId = getStringArg(args, "goalId")
  if (goalId) return goalId

  const goalTitle = getStringArg(args, "goalTitle")
  if (!goalTitle) return undefined

  const normalizedTitle = normalizeLookupText(goalTitle)
  const matches = snapshot.goals.filter((goal) => normalizeLookupText(goal.title) === normalizedTitle)
  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? `No goal found with title "${goalTitle}"`
      : `Multiple goals found with title "${goalTitle}"; use goalId`)
  }
  return matches[0].id
}

function resolveWorkItemIdFromArgs(args: Record<string, unknown>, snapshot: GoalOrchestratorSnapshot): string | undefined {
  const workItemId = getStringArg(args, "workItemId")
  if (workItemId) return workItemId

  const workItemTitle = getStringArg(args, "workItemTitle")
  if (!workItemTitle) return undefined

  const normalizedTitle = normalizeLookupText(workItemTitle)
  const goalId = resolveGoalIdFromArgs(args, snapshot)
  const matches = snapshot.workItems.filter((workItem) =>
    normalizeLookupText(workItem.title) === normalizedTitle &&
    (!goalId || workItem.goalId === goalId),
  )

  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? `No work item found with title "${workItemTitle}"`
      : `Multiple work items found with title "${workItemTitle}"; use workItemId or disambiguate by goal`)
  }

  return matches[0].id
}

function resolveDecisionIdFromArgs(args: Record<string, unknown>, snapshot: GoalOrchestratorSnapshot): string | undefined {
  const decisionId = getStringArg(args, "decisionId")
  if (decisionId) return decisionId

  const question = getStringArg(args, "question")
  if (!question) return undefined

  const normalizedQuestion = normalizeLookupText(question)
  const matches = snapshot.decisions.filter((decision) =>
    decision.status === "pending" &&
    normalizeLookupText(decision.question) === normalizedQuestion,
  )

  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? `No pending decision found with question "${question}"`
      : `Multiple pending decisions found with question "${question}"; use decisionId`)
  }

  return matches[0].id
}

function parseGoalStatus(value: unknown): GoalStatus | undefined {
  if (value === undefined) return undefined
  if (value === "active" || value === "inactive" || value === "done") return value
  throw new Error("status must be one of: active, inactive, done")
}

function parseWorkItemStatus(value: unknown): WorkItemStatus | undefined {
  if (value === undefined) return undefined
  if (
    value === "ready" ||
    value === "running" ||
    value === "waiting" ||
    value === "done" ||
    value === "discarded"
  ) {
    return value
  }
  throw new Error("status must be one of: ready, running, waiting, done, discarded")
}

const LOOP_TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
}

function hasOwnArg(args: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(args, key)
}

function parseBooleanArg(args: Record<string, unknown>, key: string): boolean | undefined {
  if (!hasOwnArg(args, key)) return undefined
  const value = args[key]
  if (typeof value !== "boolean") {
    throw new Error(`${key} must be a boolean when provided`)
  }
  return value
}

function parsePositiveIntegerArg(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) return undefined
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(`${fieldName} must be a finite integer >= 1 when provided`)
  }
  return value
}

function parseNullablePositiveIntegerArg(value: unknown, fieldName: string): number | null | undefined {
  if (value === null) return null
  return parsePositiveIntegerArg(value, fieldName)
}

function parseOptionalProfileId(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (value === null) return ""
  if (typeof value !== "string") {
    throw new Error("profileId must be a string or null when provided")
  }
  return value.trim()
}

function parseScheduleTimeList(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("schedule.times must be a non-empty array")
  }

  const times: string[] = []
  for (const value of raw) {
    if (typeof value !== "string" || !LOOP_TIME_RE.test(value.trim())) {
      throw new Error("schedule.times must all be HH:MM 24-hour strings")
    }
    const time = value.trim()
    if (!times.includes(time)) times.push(time)
  }

  times.sort()
  return times
}

function parseScheduleDay(value: unknown): number {
  if (typeof value === "number") {
    if (Number.isInteger(value) && value >= 0 && value <= 6) return value
    throw new Error("schedule.daysOfWeek values must be integers 0..6")
  }

  if (typeof value === "string") {
    const normalized = normalizeLookupText(value)
    const day = DAY_NAME_TO_INDEX[normalized]
    if (day !== undefined) return day
  }

  throw new Error("schedule.daysOfWeek values must be integers 0..6 or weekday names")
}

function parseScheduleDayList(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("schedule.daysOfWeek must be a non-empty array for weekly schedules")
  }

  const daysOfWeek: number[] = []
  for (const value of raw) {
    const day = parseScheduleDay(value)
    if (!daysOfWeek.includes(day)) daysOfWeek.push(day)
  }

  daysOfWeek.sort((a, b) => a - b)
  return daysOfWeek
}

function parseLoopScheduleInput(raw: unknown): LoopSchedule | null | undefined {
  if (raw === undefined) return undefined
  if (raw === null) return null
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("schedule must be an object, null, or omitted")
  }

  const obj = raw as Record<string, unknown>
  if (obj.type !== "daily" && obj.type !== "weekly") {
    throw new Error("schedule.type must be 'daily' or 'weekly'")
  }

  const times = parseScheduleTimeList(obj.times)
  if (obj.type === "daily") {
    return { type: "daily", times }
  }

  const rawDays = obj.daysOfWeek ?? obj.days ?? obj.dayOfWeek
  return {
    type: "weekly",
    times,
    daysOfWeek: parseScheduleDayList(Array.isArray(rawDays) || rawDays === undefined ? rawDays : [rawDays]),
  }
}

function compactRepeatTask(loop: LoopConfig, includePrompt: boolean) {
  const status = loopService.getLoopStatus(loop.id)
  const prompt = loop.prompt || ""
  return {
    id: loop.id,
    name: loop.name,
    enabled: loop.enabled,
    goalOrchestrator: loop.goalOrchestrator,
    intervalMinutes: loop.intervalMinutes,
    schedule: loop.schedule,
    runOnStartup: loop.runOnStartup,
    speakOnTrigger: loop.speakOnTrigger,
    continueInSession: loop.continueInSession,
    runContinuously: loop.runContinuously,
    maxIterations: loop.maxIterations,
    profileId: loop.profileId,
    lastRunAt: status?.lastRunAt ?? loop.lastRunAt,
    isRunning: status?.isRunning ?? false,
    nextRunAt: status?.nextRunAt,
    ...(includePrompt
      ? { prompt }
      : { promptExcerpt: prompt.length > 240 ? `${prompt.slice(0, 237)}...` : prompt }),
  }
}

function resolveRepeatTaskIdFromArgs(args: Record<string, unknown>): string | undefined {
  const repeatTaskId = getStringArg(args, "repeatTaskId")
  if (repeatTaskId) return repeatTaskId

  const repeatTaskName = getStringArg(args, "repeatTaskName")
  if (!repeatTaskName) return undefined

  const normalizedName = normalizeLookupText(repeatTaskName)
  const matches = loopService.getLoops().filter((loop) => normalizeLookupText(loop.name) === normalizedName)
  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? `No repeat task found with name "${repeatTaskName}"`
      : `Multiple repeat tasks found with name "${repeatTaskName}"; use repeatTaskId`)
  }

  return matches[0].id
}

function createRepeatTaskId(): string {
  return `loop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function saveAndRestartRepeatTask(loop: LoopConfig): MCPToolResult | null {
  const saved = loopService.saveLoop(loop)
  if (!saved) {
    return toolJson({ success: false, error: "Failed to persist repeat task" }, true)
  }

  loopService.stopLoop(loop.id)
  if (loop.enabled) {
    loopService.startLoop(loop.id)
  }

  return null
}

// Tool execution handlers
type ToolHandler = (
  args: Record<string, unknown>,
  context: BuiltinToolContext
) => Promise<MCPToolResult>

const toolHandlers: Record<string, ToolHandler> = {
  [GET_GOAL_ORCHESTRATOR_SNAPSHOT_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const snapshot = getSnapshotForRuntimeTool()
    const includeHistory = args.includeHistory === true
    return toolJson({
      success: true,
      ...buildCompactGoalSnapshot(snapshot, includeHistory),
    })
  },

  [CREATE_GOAL_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const title = getStringArg(args, "title")
    if (!title) {
      return toolJson({ success: false, error: "title must be a non-empty string" }, true)
    }

    const goal = goalOrchestratorService.createGoal({
      title,
      notes: getStringArg(args, "notes"),
      status: parseGoalStatus(args.status),
    })

    return toolJson({ success: true, goal: compactGoal(goal) })
  },

  [UPDATE_GOAL_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const snapshot = getSnapshotForRuntimeTool()
    const goalId = resolveGoalIdFromArgs(args, snapshot)
    if (!goalId) {
      return toolJson({ success: false, error: "goalId or goalTitle is required" }, true)
    }

    const goal = goalOrchestratorService.updateGoal({
      goalId,
      title: getStringArg(args, "title"),
      notes: getStringArg(args, "notes"),
      status: parseGoalStatus(args.status),
    })

    return toolJson({ success: true, goal: compactGoal(goal) })
  },

  [CREATE_WORK_ITEM_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const title = getStringArg(args, "title")
    if (!title) {
      return toolJson({ success: false, error: "title must be a non-empty string" }, true)
    }

    const snapshot = getSnapshotForRuntimeTool()
    const goalId = resolveGoalIdFromArgs(args, snapshot)
    if (!goalId) {
      return toolJson({ success: false, error: "goalId or goalTitle is required" }, true)
    }

    const workItem = goalOrchestratorService.createWorkItem({
      goalId,
      title,
      notes: getStringArg(args, "notes"),
      status: parseWorkItemStatus(args.status),
    })

    return toolJson({ success: true, workItem: compactWorkItem(workItem) })
  },

  [UPDATE_WORK_ITEM_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const snapshot = getSnapshotForRuntimeTool()
    const workItemId = resolveWorkItemIdFromArgs(args, snapshot)
    if (!workItemId) {
      return toolJson({ success: false, error: "workItemId or workItemTitle is required" }, true)
    }

    const workItem = goalOrchestratorService.updateWorkItem({
      workItemId,
      title: getStringArg(args, "title"),
      notes: getStringArg(args, "notes"),
      status: parseWorkItemStatus(args.status),
    })

    return toolJson({ success: true, workItem: compactWorkItem(workItem) })
  },

  [CREATE_DECISION_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const question = getStringArg(args, "question")
    if (!question) {
      return toolJson({ success: false, error: "question must be a non-empty string" }, true)
    }

    const snapshot = getSnapshotForRuntimeTool()
    const workItemId = resolveWorkItemIdFromArgs(args, snapshot)
    const goalId = workItemId
      ? snapshot.workItems.find((workItem) => workItem.id === workItemId)?.goalId
      : resolveGoalIdFromArgs(args, snapshot)

    const decision = goalOrchestratorService.createDecision({
      goalId,
      workItemId,
      question,
    })

    return toolJson({ success: true, decision: compactDecision(decision) })
  },

  [ANSWER_DECISION_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const answer = getStringArg(args, "answer")
    if (!answer) {
      return toolJson({ success: false, error: "answer must be a non-empty string" }, true)
    }

    const snapshot = getSnapshotForRuntimeTool()
    const decisionId = resolveDecisionIdFromArgs(args, snapshot)
    if (!decisionId) {
      return toolJson({ success: false, error: "decisionId or question is required" }, true)
    }

    const decision = goalOrchestratorService.answerDecision({ decisionId, answer })
    return toolJson({ success: true, decision: compactDecision(decision) })
  },

  [DISMISS_DECISION_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const snapshot = getSnapshotForRuntimeTool()
    const decisionId = resolveDecisionIdFromArgs(args, snapshot)
    if (!decisionId) {
      return toolJson({ success: false, error: "decisionId or question is required" }, true)
    }

    const decision = goalOrchestratorService.dismissDecision({ decisionId })
    return toolJson({ success: true, decision: compactDecision(decision) })
  },

  [RUN_GOAL_ORCHESTRATOR_TOOL]: async (): Promise<MCPToolResult> => {
    const run = await goalOrchestratorService.runWakeCycle()
    return toolJson({ success: true, orchestratorRun: run })
  },

  [START_GOAL_WORK_ITEM_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const snapshot = getSnapshotForRuntimeTool()
    const workItemId = resolveWorkItemIdFromArgs(args, snapshot)
    if (!workItemId) {
      return toolJson({ success: false, error: "workItemId or workItemTitle is required" }, true)
    }

    const agentRun = await goalOrchestratorService.startWorkItemAgentSession(workItemId, {
      reason: "manual",
    })
    return toolJson({ success: true, agentRun })
  },

  [GET_REPEAT_TASKS_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const includeDisabled = args.includeDisabled !== false
    const includePrompt = args.includePrompt === true
    const repeatTasks = loopService.getLoops()
      .filter((loop) => includeDisabled || loop.enabled)
      .map((loop) => compactRepeatTask(loop, includePrompt))

    return toolJson({ success: true, repeatTasks })
  },

  [CREATE_REPEAT_TASK_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const name = getStringArg(args, "name")
    if (!name) {
      return toolJson({ success: false, error: "name must be a non-empty string" }, true)
    }

    const goalOrchestrator = parseBooleanArg(args, "goalOrchestrator") === true
    const prompt = typeof args.prompt === "string" ? args.prompt.trim() : undefined
    if (!goalOrchestrator && !prompt) {
      return toolJson({ success: false, error: "prompt is required for non-orchestrator repeat tasks" }, true)
    }

    const intervalMinutes = parsePositiveIntegerArg(args.intervalMinutes, "intervalMinutes") ?? 60
    const enabled = parseBooleanArg(args, "enabled") ?? true
    const runOnStartup = parseBooleanArg(args, "runOnStartup") === true
    const speakOnTrigger = parseBooleanArg(args, "speakOnTrigger") === true
    const continueInSession = parseBooleanArg(args, "continueInSession") === true
    const runContinuously = parseBooleanArg(args, "runContinuously") === true
    const maxIterations = parsePositiveIntegerArg(args.maxIterations, "maxIterations")
    const schedule = parseLoopScheduleInput(args.schedule)
    const profileId = parseOptionalProfileId(args.profileId)
    const requestedRunNow = parseBooleanArg(args, "runNow") === true

    const loop: LoopConfig = {
      id: createRepeatTaskId(),
      name,
      prompt: prompt || "Run goal orchestrator",
      intervalMinutes,
      enabled,
      profileId: profileId || undefined,
      runOnStartup,
      speakOnTrigger,
      continueInSession,
      runContinuously,
      goalOrchestrator,
      ...(typeof maxIterations === "number" ? { maxIterations } : {}),
      ...(!runContinuously && schedule && schedule !== null ? { schedule } : {}),
    }

    const saveError = saveAndRestartRepeatTask(loop)
    if (saveError) return saveError

    let triggered: Awaited<ReturnType<typeof loopService.triggerLoop>> | undefined
    if (requestedRunNow && loop.enabled && !loop.runContinuously && !loop.runOnStartup) {
      triggered = await loopService.triggerLoop(loop.id)
    }

    return toolJson({
      success: true,
      repeatTask: compactRepeatTask(loopService.getLoop(loop.id) ?? loop, true),
      ...(requestedRunNow ? {
        runNow: triggered
          ? { success: true, ...triggered }
          : { success: false, message: loop.runContinuously || loop.runOnStartup ? "Task is already scheduled to run immediately." : "Task could not be triggered immediately." },
      } : {}),
    })
  },

  [UPDATE_REPEAT_TASK_TOOL]: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const repeatTaskId = resolveRepeatTaskIdFromArgs(args)
    if (!repeatTaskId) {
      return toolJson({ success: false, error: "repeatTaskId or repeatTaskName is required" }, true)
    }

    const existing = loopService.getLoop(repeatTaskId)
    if (!existing) {
      return toolJson({ success: false, error: `Repeat task not found: ${repeatTaskId}` }, true)
    }

    const name = hasOwnArg(args, "name") ? getStringArg(args, "name") : undefined
    if (hasOwnArg(args, "name") && !name) {
      return toolJson({ success: false, error: "name must be a non-empty string when provided" }, true)
    }
    if (hasOwnArg(args, "prompt") && typeof args.prompt !== "string") {
      return toolJson({ success: false, error: "prompt must be a string when provided" }, true)
    }

    const prompt = hasOwnArg(args, "prompt") ? (args.prompt as string).trim() : undefined
    const intervalMinutes = parsePositiveIntegerArg(args.intervalMinutes, "intervalMinutes")
    const enabled = parseBooleanArg(args, "enabled")
    const runOnStartup = parseBooleanArg(args, "runOnStartup")
    const speakOnTrigger = parseBooleanArg(args, "speakOnTrigger")
    const continueInSession = parseBooleanArg(args, "continueInSession")
    const runContinuously = parseBooleanArg(args, "runContinuously")
    const goalOrchestrator = parseBooleanArg(args, "goalOrchestrator")
    const maxIterations = parseNullablePositiveIntegerArg(args.maxIterations, "maxIterations")
    const schedule = parseLoopScheduleInput(args.schedule)
    const profileId = hasOwnArg(args, "profileId") ? parseOptionalProfileId(args.profileId) : undefined

    const updated: LoopConfig = {
      ...existing,
      ...(name !== undefined ? { name } : {}),
      ...(prompt !== undefined ? { prompt } : {}),
      ...(intervalMinutes !== undefined ? { intervalMinutes } : {}),
      ...(enabled !== undefined ? { enabled } : {}),
      ...(hasOwnArg(args, "profileId") ? { profileId: profileId || undefined } : {}),
      ...(runOnStartup !== undefined ? { runOnStartup } : {}),
      ...(speakOnTrigger !== undefined ? { speakOnTrigger } : {}),
      ...(continueInSession !== undefined ? { continueInSession } : {}),
      ...(runContinuously !== undefined ? { runContinuously } : {}),
      ...(goalOrchestrator !== undefined ? { goalOrchestrator } : {}),
      ...(typeof maxIterations === "number" ? { maxIterations } : {}),
    }

    if (maxIterations === null) {
      delete updated.maxIterations
    }
    if (continueInSession === false || updated.continueInSession === false) {
      delete updated.lastSessionId
    }
    if (updated.runContinuously) {
      delete updated.schedule
    } else if (schedule === null) {
      delete updated.schedule
    } else if (schedule !== undefined) {
      updated.schedule = schedule
      updated.runContinuously = false
    }
    if (!updated.goalOrchestrator && !updated.prompt.trim()) {
      return toolJson({ success: false, error: "prompt cannot be empty unless goalOrchestrator is true" }, true)
    }
    if (updated.goalOrchestrator && !updated.prompt.trim()) {
      updated.prompt = "Run goal orchestrator"
    }

    const saveError = saveAndRestartRepeatTask(updated)
    if (saveError) return saveError

    return toolJson({ success: true, repeatTask: compactRepeatTask(loopService.getLoop(repeatTaskId) ?? updated, true) })
  },

  [RUN_REPEAT_TASK_TOOL]: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    const repeatTaskId = resolveRepeatTaskIdFromArgs(args)
    if (!repeatTaskId) {
      return toolJson({ success: false, error: "repeatTaskId or repeatTaskName is required" }, true)
    }

    const loop = loopService.getLoop(repeatTaskId)
    if (!loop) {
      return toolJson({ success: false, error: `Repeat task not found: ${repeatTaskId}` }, true)
    }

    const triggered = await loopService.triggerLoop(repeatTaskId, {
      clientSessionId: context.sessionId,
    })
    if (!triggered) {
      return toolJson({ success: false, error: "Repeat task is already running or could not be triggered" }, true)
    }

    return toolJson({
      success: true,
      repeatTask: compactRepeatTask(loopService.getLoop(repeatTaskId) ?? loop, false),
      run: triggered,
    })
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

    const conversationId = session?.conversationId ?? (context.sessionId.startsWith("conv_") ? context.sessionId : undefined)
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
