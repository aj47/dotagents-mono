import { resolveLatestUserFacingResponse } from "./respond-to-user-utils"
import { normalizeAgentConversationState, type AgentConversationState } from "@dotagents/shared"

const TOOL_CALL_PLACEHOLDER_REGEX = /^\[(?:Calling tools?|Tool|Tools?):[^\]]+\]$/i
const RAW_TOOL_TRANSCRIPT_REGEX = /^\[[a-z0-9_:-]+\]\s*(?:ERROR:\s*)?(?:\{[\s\S]*\}|\[[\s\S]*\])\s*$/i
const PROGRESS_UPDATE_REGEX = /(?:^|[.!?]\s+)(?:let me|i'?ll|i will|i'm going to|now i'?ll|next i'?ll|working on it|still working on it)\b/i
const NON_PROGRESS_SIGNOFF_REGEX = /(?:^|[.!?]\s+)(?:let me know if you need(?: anything else| more help| anything more)?|feel free to reach out if you need anything else)\b/i
const OPTIONAL_INPUT_SIGNAL_REGEX = /\b(if you want|if you'd like|if you’d like|do you want me to|want me to|quick preference|before i do it|which style|which tone)\b/i
const OPTIONAL_APPROVAL_REASON_REGEX = /\b(approval|preference|style|tone)\b/i
const UNDELIVERED_PRIMARY_WORK_REGEX = /\b(no pr was created|did not (?:push|open|create|submit) (?:a |the )?pr|not approved yet|fastest path to pr now|next i'?ll create|before i do it|i can do those final steps now|i can do the final steps now|i can make this agent|ready to create|prepared to create)\b/i
const PARTIAL_ANALYSIS_SIGNAL_REGEX = /\b(mid-analysis|laid out the (?:three )?recovery options|recovery options)\b/i
const STRATEGY_REQUEST_SIGNAL_REGEX = /\b(which approach to take|what do you want to do|hard reset|selective revert|cherry-pick|clean commit hash|last clean commit hash)\b/i
const STRATEGY_REQUEST_REASON_REGEX = /\b(strategy|approach|commit hash|baseline commit|recovery)\b/i
const EXPLICIT_ASK_FIRST_REGEX = /\b(ask me first|ask before|check with me first|get my approval first|before you (?:merge|open|submit|push|create))\b/i

type ConversationHistoryLike = Array<{
  role?: string
  content?: string
  toolCalls?: Array<{
    name?: string
    arguments?: unknown
  }>
}>

type VerificationMessageLike = {
  role?: string
  content?: string
}

function extractOriginalRequest(messages?: VerificationMessageLike[]): string {
  const originalRequestMessage = messages?.find((message) => message.role === "user" && typeof message.content === "string")?.content || ""
  return originalRequestMessage.replace(/^Original request:\s*/i, "").trim()
}

function extractLatestVerifierResponse(messages?: VerificationMessageLike[]): string {
  const assistantMessage = messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "assistant" && isDeliverableResponseContent(message.content))

  if (assistantMessage?.content?.trim()) {
    return assistantMessage.content.trim()
  }

  const explicitUserFacingResponse = messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "user" && typeof message.content === "string" && /^Latest explicit user-facing response from the agent:/i.test(message.content))
    ?.content

  return explicitUserFacingResponse?.replace(/^Latest explicit user-facing response from the agent:\s*/i, "").trim() || ""
}

function shouldDowngradeNeedsInputToRunning(
  verification: any,
  verificationMessages?: VerificationMessageLike[],
): boolean {
  const originalRequest = extractOriginalRequest(verificationMessages)
  if (originalRequest && EXPLICIT_ASK_FIRST_REGEX.test(originalRequest)) {
    return false
  }

  const latestResponse = extractLatestVerifierResponse(verificationMessages)
  if (!latestResponse) {
    return false
  }

  const needsInputReasonText = [
    typeof verification?.reason === "string" ? verification.reason : "",
    ...normalizeMissingItemsList(verification?.missingItems),
  ].join(" ")

  const signalsOptionalInput = OPTIONAL_INPUT_SIGNAL_REGEX.test(latestResponse)
    || OPTIONAL_APPROVAL_REASON_REGEX.test(needsInputReasonText)
  const showsPrimaryWorkStillUndelivered = UNDELIVERED_PRIMARY_WORK_REGEX.test(latestResponse)
  const signalsPrematureStrategyHandoff = PARTIAL_ANALYSIS_SIGNAL_REGEX.test(latestResponse)
    && STRATEGY_REQUEST_SIGNAL_REGEX.test(latestResponse)
    && STRATEGY_REQUEST_REASON_REGEX.test(needsInputReasonText)

  return (signalsOptionalInput && showsPrimaryWorkStillUndelivered) || signalsPrematureStrategyHandoff
}

export function normalizeMissingItemsList(items?: string[]): string[] {
  return Array.isArray(items)
    ? items
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    : []
}

export function normalizeVerificationResultForCompletion(
  verification: any,
  options?: { verificationMessages?: VerificationMessageLike[] },
) {
  const missingItems = normalizeMissingItemsList(verification?.missingItems)

  const fallbackState: AgentConversationState = verification?.isComplete === true
    ? "complete"
    : "running"
  let conversationState = normalizeAgentConversationState(
    verification?.conversationState,
    fallbackState,
  )
  let reason = typeof verification?.reason === "string" ? verification.reason.trim() : undefined

  if (
    conversationState === "needs_input"
    && shouldDowngradeNeedsInputToRunning(verification, options?.verificationMessages)
  ) {
    conversationState = "running"
    reason = [
      reason,
      "Normalized to running because the assistant still owes the main requested artifact and is only asking an optional approval/preference question or prematurely handing strategy choice back to the user.",
    ].filter(Boolean).join(" ")
  }

  return {
    ...verification,
    isComplete: conversationState !== "running",
    conversationState,
    missingItems,
    reason,
  }
}

function isProgressUpdateResponse(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trim() : ""
  if (!trimmed) return false
  if (NON_PROGRESS_SIGNOFF_REGEX.test(trimmed)) return false
  return PROGRESS_UPDATE_REGEX.test(trimmed)
}

export function isDeliverableResponseContent(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trim() : ""
  if (!trimmed) return false
  if (TOOL_CALL_PLACEHOLDER_REGEX.test(trimmed)) return false
  if (RAW_TOOL_TRANSCRIPT_REGEX.test(trimmed)) return false
  if (isProgressUpdateResponse(trimmed)) return false
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
  if (isDeliverableResponseContent(normalizedFinalContent)) {
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
  if (isDeliverableResponseContent(normalizedLastAssistantContent)) {
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