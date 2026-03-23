import type { SessionProfileSnapshot } from "../shared/types"
import { RESPOND_TO_USER_TOOL } from "../shared/runtime-tool-names"
import {
  extractRespondToUserContentFromArgs,
  resolveLatestUserFacingResponse,
} from "./respond-to-user-utils"

export const DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET = 60
export const AGENT_STOP_NOTE =
  "(Agent mode was stopped by emergency kill switch)"
export const AGENT_SESSION_TIMEOUT_NOTE =
  "(Agent mode stopped after reaching the configured session time limit)"
export const DEFAULT_AGENT_SESSION_TIMEOUT_MINUTES = 30
export const MIN_AGENT_SESSION_TIMEOUT_MINUTES = 1
export const MAX_AGENT_SESSION_TIMEOUT_MINUTES = 720

export type AgentStopReason = "manual" | "timeout"

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

type ProfileContextSource = {
  profileName?: string
  displayName?: string
  guidelines?: string
  systemPrompt?: string
  disableDelegation?: boolean
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

export function resolveAgentSessionTimeoutMinutes(requestedMinutes?: number): number {
  if (
    typeof requestedMinutes !== "number" ||
    !Number.isFinite(requestedMinutes) ||
    requestedMinutes < MIN_AGENT_SESSION_TIMEOUT_MINUTES
  ) {
    return DEFAULT_AGENT_SESSION_TIMEOUT_MINUTES
  }

  return Math.min(
    MAX_AGENT_SESSION_TIMEOUT_MINUTES,
    Math.floor(requestedMinutes),
  )
}

export function resolveAgentSessionMaxDurationMs(requestedMinutes?: number): number {
  return resolveAgentSessionTimeoutMinutes(requestedMinutes) * 60_000
}

export function getAgentStopNote(reason: AgentStopReason = "manual"): string {
  return reason === "timeout" ? AGENT_SESSION_TIMEOUT_NOTE : AGENT_STOP_NOTE
}

export function getAgentStopStepDetails(
  reason: AgentStopReason = "manual",
): { title: string; description: string } {
  if (reason === "timeout") {
    return {
      title: "Session time limit reached",
      description: "Agent stopped after hitting the configured wall-clock limit",
    }
  }

  return {
    title: "Agent stopped",
    description: "Emergency stop triggered",
  }
}

export function getAgentStoppedToolMessage(reason: AgentStopReason = "manual"): string {
  return reason === "timeout"
    ? "Tool execution cancelled because the agent reached the configured session time limit"
    : "Tool execution cancelled by emergency kill switch"
}

export function appendAgentStopNote(
  content: string,
  reason: AgentStopReason = "manual",
): string {
  const normalizedContent = typeof content === "string" ? content.trimEnd() : ""
  const note = getAgentStopNote(reason)
  if (normalizedContent.includes(note)) {
    return normalizedContent
  }

  return normalizedContent.length > 0
    ? `${normalizedContent}\n\n${note}`
    : note
}

export function getLatestAssistantMessageContent(
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
  profile: ProfileContextSource | SessionProfileSnapshot | undefined,
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
  if (profile && "disableDelegation" in profile && profile.disableDelegation) {
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
