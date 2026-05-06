export {
  buildCompactionCheckpointContextMessage,
  buildRelevantEarlierConversationContextMessage,
  extractHighSignalFactsFromConversationMessages,
} from "@dotagents/shared/conversation-context-builder"

export type {
  ConversationCompactionFact,
  ConversationCompactionMetadata,
  PromptConversationMessage,
  PromptConversationRole,
  RelevantEarlierContextOptions,
} from "@dotagents/shared/conversation-context-builder"
