import { resolveLatestUserFacingResponse } from "./respond-to-user-utils"
import { normalizeAgentConversationState, type AgentConversationState } from "@dotagents/shared"

const TOOL_CALL_PLACEHOLDER_REGEX = /^\[(?:Calling tools?|Tool|Tools?):[^\]]+\]$/i
const RAW_TOOL_TRANSCRIPT_REGEX = /^\[[a-z0-9_:-]+\]\s*(?:ERROR:\s*)?(?:\{[\s\S]*\}|\[[\s\S]*\])\s*$/i
const PROGRESS_UPDATE_REGEX = /(?:^|[.!?]\s+)(?:let me|i'?ll|i will|i'm going to|now i'?ll|next i'?ll|working on it|still working on it)\b/i

type ConversationHistoryLike = Array<{
  role?: string
  content?: string
  toolCalls?: Array<{
    name?: string
    arguments?: unknown
  }>
}>

export function normalizeMissingItemsList(items?: string[]): string[] {
  return Array.isArray(items)
    ? items
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    : []
}

export function normalizeVerificationResultForCompletion(verification: any) {
  const missingItems = normalizeMissingItemsList(verification?.missingItems)

  const fallbackState: AgentConversationState = verification?.isComplete === true
    ? "complete"
    : "running"
  const conversationState = normalizeAgentConversationState(
    verification?.conversationState,
    fallbackState,
  )

  return {
    ...verification,
    isComplete: conversationState !== "running",
    conversationState,
    missingItems,
    reason: typeof verification?.reason === "string" ? verification.reason.trim() : undefined,
  }
}

function isIterationLimitDeliverableContent(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trim() : ""
  if (!trimmed) return false
  if (TOOL_CALL_PLACEHOLDER_REGEX.test(trimmed)) return false
  if (RAW_TOOL_TRANSCRIPT_REGEX.test(trimmed)) return false
  if (PROGRESS_UPDATE_REGEX.test(trimmed)) return false
  return true
}

export function resolveIterationLimitFinalContent({
  finalContent,
  storedResponse,
  conversationHistory,
  hasRecentErrors,
}: {
  finalContent?: string
  storedResponse?: string
  conversationHistory?: ConversationHistoryLike
  hasRecentErrors: boolean
}): {
  content: string
  usedExplicitUserResponse: boolean
} {
  const explicitUserResponse = resolveLatestUserFacingResponse({
    storedResponse,
    conversationHistory,
  })

  if (explicitUserResponse?.trim().length) {
    return {
      content: explicitUserResponse,
      usedExplicitUserResponse: true,
    }
  }

  const normalizedFinalContent = typeof finalContent === "string" ? finalContent.trim() : ""
  if (isIterationLimitDeliverableContent(normalizedFinalContent)) {
    return {
      content: normalizedFinalContent,
      usedExplicitUserResponse: false,
    }
  }

  const lastAssistantMessage = conversationHistory
    ?.slice()
    .reverse()
    .find((msg) => msg.role === "assistant" && typeof msg.content === "string" && msg.content.trim().length > 0)

  const normalizedLastAssistantContent = typeof lastAssistantMessage?.content === "string"
    ? lastAssistantMessage.content.trim()
    : ""
  if (isIterationLimitDeliverableContent(normalizedLastAssistantContent)) {
    return {
      content: normalizedLastAssistantContent,
      usedExplicitUserResponse: false,
    }
  }

  return {
    content: hasRecentErrors
      ? "Task was interrupted due to repeated tool failures. Please review the errors above and try again with alternative approaches."
      : "Task reached maximum iteration limit while still in progress. Some actions may have been completed successfully - please review the tool results above.",
    usedExplicitUserResponse: false,
  }
}