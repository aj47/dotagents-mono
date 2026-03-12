import { resolveLatestUserFacingResponse } from "./respond-to-user-utils"

const TOOL_CALL_PLACEHOLDER_REGEX = /^\[(?:Calling tools?|Tool|Tools?):[^\]]+\]$/i
const RAW_TOOL_TRANSCRIPT_REGEX = /^\[[a-z0-9_:-]+\]\s*(?:ERROR:\s*)?(?:\{[\s\S]*\}|\[[\s\S]*\])\s*$/i
const SELF_ADMITTED_PARTIAL_COMPLETION_REGEX = /\b(?:not fully|not completely|pretty close|almost done|almost there|partially complete|partially done|remaining work|work remaining|left to do)\b/i
const SELF_ADMITTED_REMAINING_WORK_REGEX = /\b(?:still need to|still have to)\s+(?:finish|complete|wrap up|implement|fix|update|add|write|test|verify|clean up)\b/i

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

export function looksLikeToolCallPlaceholderContent(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed) return false
  return TOOL_CALL_PLACEHOLDER_REGEX.test(trimmed) || RAW_TOOL_TRANSCRIPT_REGEX.test(trimmed)
}

export function hasSelfAdmittedPartialCompletion(content: string): boolean {
  const trimmed = content.trim()
  return SELF_ADMITTED_PARTIAL_COMPLETION_REGEX.test(trimmed) || SELF_ADMITTED_REMAINING_WORK_REGEX.test(trimmed)
}

export function isProgressUpdateResponse(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed) return false

  const lowerRaw = trimmed.toLowerCase()
  const hasStructuredDeliverable =
    /\n[-*]\s|\n\d+\.\s/.test(trimmed) ||
    /\bhere(?:'s| is)\b/.test(lowerRaw)
  if (hasStructuredDeliverable) {
    return false
  }

  const normalized = lowerRaw.replace(/\s+/g, " ")
  const wordCount = normalized.split(" ").filter(Boolean).length
  if (wordCount > 40) {
    return false
  }

  return /(?:^|[.!?]\s+)(?:let me|i'?ll|i will|i'm going to|now i'?ll|next i'?ll|i need to|i still need to|i should)\b/.test(normalized)
}

export function isDeliverableResponseContent(content: string, minLength: number = 1): boolean {
  const trimmed = content.trim()
  if (trimmed.length < minLength) return false
  if (looksLikeToolCallPlaceholderContent(trimmed)) return false
  if (isProgressUpdateResponse(trimmed)) return false
  return true
}

export function normalizeVerificationResultForCompletion(verification: any, finalAssistantText: string = "") {
  const missingItems = normalizeMissingItemsList(verification?.missingItems)

  if (verification?.isComplete === true && missingItems.length > 0) {
    return {
      ...verification,
      isComplete: false,
      missingItems,
    }
  }

  if (verification?.isComplete === true && hasSelfAdmittedPartialCompletion(finalAssistantText)) {
    return {
      ...verification,
      isComplete: false,
      missingItems,
      reason: typeof verification?.reason === "string" && verification.reason.trim().length > 0
        ? verification.reason.trim()
        : "The final response explicitly says the work is only partially complete.",
    }
  }

  return verification
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