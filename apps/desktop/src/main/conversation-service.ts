/**
 * Desktop conversation service — thin wrapper around @dotagents/core.
 * Wires in the desktop-specific summarization function from context-budget.
 */
import { ConversationService } from "@dotagents/core"
import { summarizeContent } from "./context-budget"

// Re-export types for existing desktop consumers
export type { Conversation, ConversationMessage, ConversationHistoryItem, ConversationCompactionMetadata, SummarizeContentFn } from "@dotagents/core"

// Create the singleton instance with desktop-specific summarization wired in
const service = new ConversationService()
service.setSummarizeFn(summarizeContent)

export { ConversationService }
export const conversationService = service
