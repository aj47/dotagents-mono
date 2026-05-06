import {
  RESPOND_TO_USER_TOOL,
  extractRespondToUserContentFromArgs,
  formatConversationHistoryForApi,
  resolveLatestUserFacingResponse,
  type ConversationHistoryForApiEntryLike,
} from './chat-utils';
import type { AgentProgressUpdate } from './agent-progress';
import type { ConversationHistoryMessage } from './types';

// When the caller asks for unlimited iterations we still need some upper
// bound to scale loop guardrails against. Individual guardrails are expected
// to track consecutive failures and reset on progress.
export const DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET = 10000
export const DEFAULT_AGENT_MODE_MAX_ITERATIONS = 10
export const AGENT_STOP_NOTE =
  "(Agent mode was stopped by emergency kill switch)"
export const AGENT_STOPPED_QUEUE_PAUSED_DESCRIPTION =
  "Agent mode was stopped by emergency kill switch. Queue paused."
export const SESSION_STOPPED_BY_KILL_SWITCH_REASON =
  "Session stopped by kill switch"
export const ABORTED_BY_EMERGENCY_STOP_REASON =
  "Aborted by emergency stop"

export interface AgentRunOptions {
  prompt: string
  conversationId?: string
  profileId?: string
  onProgress?: (update: AgentProgressUpdate) => void
}

export type AgentRunConversationHistoryMessage = ConversationHistoryMessage

export type AgentRunResult = {
  content: string
  conversationId: string
  conversationHistory: AgentRunConversationHistoryMessage[]
}

export type AgentRunExecutor = (options: AgentRunOptions) => Promise<AgentRunResult>

export type RemoteAgentRunConfigLike = {
  remoteServerAutoShowPanel?: boolean
}

export type RemoteAgentConversationLike = {
  id: string
  messages: ConversationHistoryForApiEntryLike[]
}

export type RemoteAgentSessionLike = {
  status?: string
  isSnoozed?: boolean
}

export type RemoteAgentRunModeState = {
  isAgentModeActive: boolean
  shouldStopAgent: boolean
  agentIterationCount: number
}

export interface RemoteAgentRunActionService<TConversation extends RemoteAgentConversationLike = RemoteAgentConversationLike> {
  getConfig(): RemoteAgentRunConfigLike
  setAgentModeState(state: RemoteAgentRunModeState): void
  addMessageToConversation(conversationId: string, prompt: string, role: 'user'): Promise<TConversation | null | undefined>
  createConversationWithId(conversationId: string, prompt: string, role: 'user'): Promise<TConversation>
  generateConversationId(): string
  findSessionByConversationId(conversationId: string): string | undefined
  getSession(sessionId: string): RemoteAgentSessionLike | undefined
  reviveSession(sessionId: string, startSnoozed: boolean): boolean
  loadConversation(conversationId: string): Promise<TConversation | null | undefined>
  processAgentMode(
    prompt: string,
    conversationId: string,
    existingSessionId: string | undefined,
    startSnoozed: boolean,
    options: Pick<AgentRunOptions, 'profileId' | 'onProgress'>,
  ): Promise<string>
  notifyConversationHistoryChanged(): void
}

export interface RemoteAgentRunActionDiagnostics {
  logInfo(source: string, message: string): void
}

export interface RemoteAgentRunActionOptions<TConversation extends RemoteAgentConversationLike = RemoteAgentConversationLike> {
  service: RemoteAgentRunActionService<TConversation>
  diagnostics: RemoteAgentRunActionDiagnostics
}

export interface AgentStoppedProgressUpdateOptions {
  sessionId: string
  runId?: number
  conversationId?: string
  conversationTitle?: string
  timestamp?: number
  clearPendingToolApproval?: boolean
}

export type AgentModeIterationConfigLike = {
  mcpUnlimitedIterations?: boolean
  mcpMaxIterations?: number
}

export interface ApiRetryConfig {
  apiRetryCount?: number
  apiRetryBaseDelay?: number
  apiRetryMaxDelay?: number
}

export interface AgentContextBudgetConfig {
  mcpContextTargetRatio?: number
  mcpContextLastNMessages?: number
  mcpContextSummarizeCharThreshold?: number
  mcpMaxContextTokensOverride?: number
}

export interface ToolResponseProcessingConfig {
  mcpToolResponseLargeThreshold?: number
  mcpToolResponseCriticalThreshold?: number
  mcpToolResponseChunkSize?: number
  mcpToolResponseProgressUpdates?: boolean
}

export interface CompletionVerificationTuningConfig {
  mcpVerifyContextMaxItems?: number
  mcpVerifyRetryCount?: number
}

export interface AgentRuntimeTuningConfig
  extends ApiRetryConfig,
    AgentContextBudgetConfig,
    ToolResponseProcessingConfig,
    CompletionVerificationTuningConfig {}

export type AgentSessionIdKind = "missing" | "pending" | "subsession" | "session" | "unknown"
export type ExpectedAgentStopReason =
  | typeof SESSION_STOPPED_BY_KILL_SWITCH_REASON
  | typeof ABORTED_BY_EMERGENCY_STOP_REASON

export interface ResolveExpectedAgentStopReasonOptions {
  sessionShouldStop?: boolean
  globalShouldStop?: boolean
}

export interface AgentIterationLimits {
  loopMaxIterations: number
  guardrailBudget: number
}

interface ConversationMessageLike {
  role: string
  content?: string | null
  toolName?: string
  toolInput?: unknown
  toolCalls?: Array<{
    name?: string
    arguments?: unknown
  }>
}

export type ProfileContextSource = {
  profileName?: string
  displayName?: string
  guidelines?: string
  systemPrompt?: string
  disableDelegation?: boolean
}

function normalizeDelegationToolName(toolName?: string): string | undefined {
  if (typeof toolName !== "string") return undefined

  const normalized = toolName
    .trim()
    .toLowerCase()
    .replace(/^tool:\s*/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized.length > 0 ? normalized : undefined
}

function getLatestAcpRespondToUserContent(
  conversation?: ConversationMessageLike[],
): string | undefined {
  if (!Array.isArray(conversation)) return undefined

  for (let index = conversation.length - 1; index >= 0; index--) {
    const message = conversation[index]
    if (normalizeDelegationToolName(message?.toolName) !== RESPOND_TO_USER_TOOL) continue

    const content = extractRespondToUserContentFromArgs(message?.toolInput)
    if (content) {
      return content
    }
  }

  return undefined
}

export function resolveAgentIterationLimits(
  requestedMaxIterations: number,
): AgentIterationLimits {
  if (requestedMaxIterations === Number.POSITIVE_INFINITY) {
    return {
      loopMaxIterations: Number.POSITIVE_INFINITY,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    }
  }

  if (!Number.isFinite(requestedMaxIterations)) {
    return {
      loopMaxIterations: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    }
  }

  const normalizedMaxIterations = Math.max(
    1,
    Math.floor(requestedMaxIterations),
  )
  return {
    loopMaxIterations: normalizedMaxIterations,
    guardrailBudget: normalizedMaxIterations,
  }
}

export function resolveAgentModeMaxIterations(
  config: AgentModeIterationConfigLike,
  maxIterationsOverride?: number,
): number {
  if (typeof maxIterationsOverride === "number" && Number.isFinite(maxIterationsOverride)) {
    return maxIterationsOverride
  }

  return config.mcpUnlimitedIterations
    ? Number.POSITIVE_INFINITY
    : config.mcpMaxIterations ?? DEFAULT_AGENT_MODE_MAX_ITERATIONS
}

export function appendAgentStopNote(content: string): string {
  const normalizedContent = typeof content === "string" ? content.trimEnd() : ""
  if (normalizedContent.includes(AGENT_STOP_NOTE)) {
    return normalizedContent
  }

  return normalizedContent.length > 0
    ? `${normalizedContent}\n\n${AGENT_STOP_NOTE}`
    : AGENT_STOP_NOTE
}

export function getExplicitAgentStopReason(error: unknown): ExpectedAgentStopReason | null {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()

  if (normalized.includes("session stopped by kill switch")) {
    return SESSION_STOPPED_BY_KILL_SWITCH_REASON
  }

  if (normalized.includes("aborted by emergency stop")) {
    return ABORTED_BY_EMERGENCY_STOP_REASON
  }

  return null
}

export function resolveExpectedAgentStopReason(
  error: unknown,
  options: ResolveExpectedAgentStopReasonOptions = {},
): ExpectedAgentStopReason | null {
  const explicitReason = getExplicitAgentStopReason(error)
  if (explicitReason) return explicitReason

  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  const normalizedName = error instanceof Error ? error.name.toLowerCase() : ""
  const isKnownStopError =
    normalizedName === "aborterror" ||
    normalizedName.includes("abort") ||
    normalizedName.includes("cancel") ||
    normalized.includes("abort") ||
    normalized.includes("cancel")

  if (!isKnownStopError) {
    return null
  }

  if (options.sessionShouldStop) {
    return SESSION_STOPPED_BY_KILL_SWITCH_REASON
  }

  if (options.globalShouldStop) {
    return ABORTED_BY_EMERGENCY_STOP_REASON
  }

  return null
}

export function buildAgentStoppedProgressUpdate(
  options: AgentStoppedProgressUpdateOptions,
): AgentProgressUpdate {
  const timestamp = options.timestamp ?? Date.now()
  return {
    sessionId: options.sessionId,
    ...(options.runId === undefined ? {} : { runId: options.runId }),
    ...(options.conversationId ? { conversationId: options.conversationId } : {}),
    ...(options.conversationTitle ? { conversationTitle: options.conversationTitle } : {}),
    currentIteration: 0,
    maxIterations: 0,
    steps: [
      {
        id: `stop_${timestamp}`,
        type: "completion",
        title: "Agent stopped",
        description: AGENT_STOPPED_QUEUE_PAUSED_DESCRIPTION,
        status: "error",
        timestamp,
      },
    ],
    isComplete: true,
    finalContent: AGENT_STOP_NOTE,
    ...(options.clearPendingToolApproval ? { pendingToolApproval: undefined } : {}),
  }
}

export function describeAgentSessionId(sessionId?: string | null): AgentSessionIdKind {
  if (!sessionId) return "missing"
  if (sessionId.startsWith("pending-")) return "pending"
  if (sessionId.startsWith("subsession_")) return "subsession"
  if (sessionId.startsWith("session_")) return "session"
  return "unknown"
}

export async function runRemoteAgentAction<TConversation extends RemoteAgentConversationLike = RemoteAgentConversationLike>(
  options: AgentRunOptions,
  actionOptions: RemoteAgentRunActionOptions<TConversation>,
): Promise<AgentRunResult> {
  const { prompt, conversationId: inputConversationId, profileId, onProgress } = options
  const { service, diagnostics } = actionOptions
  const cfg = service.getConfig()

  service.setAgentModeState({
    isAgentModeActive: true,
    shouldStopAgent: false,
    agentIterationCount: 0,
  })

  let conversationId = inputConversationId

  if (conversationId) {
    const updatedConversation = await service.addMessageToConversation(
      conversationId,
      prompt,
      "user",
    )

    if (updatedConversation) {
      diagnostics.logInfo(
        "remote-server",
        `Continuing conversation ${conversationId} with ${Math.max(0, updatedConversation.messages.length - 1)} previous messages`,
      )
    } else {
      diagnostics.logInfo("remote-server", `Conversation ${conversationId} not found, creating with provided ID`)
      const newConversation = await service.createConversationWithId(conversationId, prompt, "user")
      conversationId = newConversation.id
      diagnostics.logInfo("remote-server", `Created new conversation with ID ${newConversation.id}`)
    }
  }

  if (!conversationId) {
    const newConversation = await service.createConversationWithId(
      service.generateConversationId(),
      prompt,
      "user",
    )
    conversationId = newConversation.id
    diagnostics.logInfo("remote-server", `Created new conversation ${conversationId}`)
  }

  const activeConversationId = conversationId
  const startSnoozed = !cfg.remoteServerAutoShowPanel
  let existingSessionId: string | undefined
  const foundSessionId = service.findSessionByConversationId(activeConversationId)
  if (foundSessionId) {
    const existingSession = service.getSession(foundSessionId)
    const isAlreadyActive = existingSession && existingSession.status === "active"
    const snoozeForRevive = isAlreadyActive ? existingSession.isSnoozed ?? false : startSnoozed
    const revived = service.reviveSession(foundSessionId, snoozeForRevive)
    if (revived) {
      existingSessionId = foundSessionId
      diagnostics.logInfo("remote-server", `Revived existing session ${existingSessionId}`)
    }
  }

  const loadFormattedConversationHistory = async () => {
    const latestConversation = await service.loadConversation(activeConversationId)
    return formatConversationHistoryForApi(latestConversation?.messages || [])
  }

  try {
    const content = await service.processAgentMode(
      prompt,
      activeConversationId,
      existingSessionId,
      startSnoozed,
      { profileId, onProgress },
    )

    const formattedHistory = await loadFormattedConversationHistory()
    service.notifyConversationHistoryChanged()

    return { content, conversationId: activeConversationId, conversationHistory: formattedHistory }
  } catch (caughtError) {
    service.notifyConversationHistoryChanged()
    throw caughtError
  } finally {
    service.setAgentModeState({
      isAgentModeActive: false,
      shouldStopAgent: false,
      agentIterationCount: 0,
    })
  }
}

function getLatestAssistantMessageContent(
  conversation?: ConversationMessageLike[],
): string | undefined {
  if (!Array.isArray(conversation)) return undefined

  for (let index = conversation.length - 1; index >= 0; index--) {
    const message = conversation[index]
    if (message?.role !== "assistant") continue
    if (typeof message.content !== "string") continue

    const trimmedContent = message.content.trim()
    if (trimmedContent.length > 0) {
      return message.content
    }
  }

  return undefined
}

export function buildProfileContext(
  profile: ProfileContextSource | undefined,
  existingContext?: string,
): string | undefined {
  if (!profile && !existingContext) return undefined

  const parts: string[] = []
  const displayName = profile && "displayName" in profile && typeof profile.displayName === "string"
    ? profile.displayName.trim()
    : ""
  const profileName = displayName
    || (typeof profile?.profileName === "string" ? profile.profileName.trim() : "")

  if (existingContext) parts.push(existingContext)
  if (profileName) parts.push(`[Acting as: ${profileName}]`)
  if (profile?.systemPrompt) parts.push(`System Prompt: ${profile.systemPrompt}`)
  if (profile?.guidelines) parts.push(`Guidelines: ${profile.guidelines}`)
  if (profile?.disableDelegation) {
    parts.push(
      "Delegation rule: this is already a delegated run. Execute the task directly and do not delegate to other agents or sub-sessions.",
    )
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined
}

export function getPreferredDelegationOutput(
  output: string | undefined,
  conversation?: ConversationMessageLike[],
): string {
  const explicitUserResponse = resolveLatestUserFacingResponse({
    conversationHistory: conversation,
  })
  const explicitAcpUserResponse = getLatestAcpRespondToUserContent(conversation)

  return (
    explicitUserResponse ??
    explicitAcpUserResponse ??
    getLatestAssistantMessageContent(conversation) ??
    (typeof output === "string" ? output : "")
  )
}
