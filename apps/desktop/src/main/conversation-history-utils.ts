export {
  EMPTY_RESPONSE_FINAL_CONTENT,
  EMPTY_RESPONSE_RETRY_PROMPT,
  EMPTY_RESPONSE_TRUNCATED_RETRY_PROMPT,
  MAPPED_TOOL_RESULT_PREFIX_RE,
  collectRecentRealUserRequestIndices,
  filterEphemeralMessages,
  getEmptyResponseRetryPrompt,
  hasMappedToolResultPrefix,
  hasTruncatedContentInRecentMessages,
  isGeneratedContextSummaryContent,
  isInternalNudgeContent,
  isRealUserRequestContent,
} from "@dotagents/shared/conversation-history-utils"

export type {
  ConversationHistoryFilterMessage as ConversationMessage,
} from "@dotagents/shared/conversation-history-utils"
