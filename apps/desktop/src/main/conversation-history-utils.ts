export {
  MAPPED_TOOL_RESULT_PREFIX_RE,
  collectRecentRealUserRequestIndices,
  filterEphemeralMessages,
  hasMappedToolResultPrefix,
  isGeneratedContextSummaryContent,
  isInternalNudgeContent,
  isRealUserRequestContent,
} from "@dotagents/shared/conversation-history-utils"

export type {
  ConversationHistoryFilterMessage as ConversationMessage,
} from "@dotagents/shared/conversation-history-utils"
