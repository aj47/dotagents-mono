import type { ConversationHistoryItem } from "@dotagents/shared/conversation-domain"
import {
  orderConversationHistoryByPinnedFirst as orderPinnedConversationHistory,
} from "@dotagents/shared/session"

export const orderConversationHistoryByPinnedFirst: (
  sessions: ConversationHistoryItem[],
  pinnedSessionIds: ReadonlySet<string>,
) => ConversationHistoryItem[] = orderPinnedConversationHistory
