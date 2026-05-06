import type { ConversationHistoryItem } from "@shared/types"
import { orderConversationHistoryByPinnedFirst as orderPinnedConversationHistory } from "@dotagents/shared/session"

export function orderConversationHistoryByPinnedFirst(
  sessions: ConversationHistoryItem[],
  pinnedSessionIds: ReadonlySet<string>,
): ConversationHistoryItem[] {
  return orderPinnedConversationHistory(sessions, pinnedSessionIds)
}
