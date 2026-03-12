import { resolveLatestUserFacingResponse } from "./respond-to-user-utils"
import { normalizeAgentConversationState, type AgentConversationState } from "@dotagents/shared"

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
  if (normalizedFinalContent.length > 0) {
    return {
      content: normalizedFinalContent,
      usedExplicitUserResponse: false,
    }
  }

  const lastAssistantMessage = conversationHistory
    ?.slice()
    .reverse()
    .find((msg) => msg.role === "assistant" && typeof msg.content === "string" && msg.content.trim().length > 0)

  if (lastAssistantMessage?.content) {
    return {
      content: lastAssistantMessage.content,
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