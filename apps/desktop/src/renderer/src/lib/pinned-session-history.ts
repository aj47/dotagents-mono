import type { ConversationHistoryItem } from "@shared/types"
import { orderItemsByPinnedFirst } from "@dotagents/shared"

export function orderConversationHistoryByPinnedFirst(
  sessions: ConversationHistoryItem[],
  pinnedSessionIds: ReadonlySet<string>,
): ConversationHistoryItem[] {
  if (sessions.length <= 1 || pinnedSessionIds.size === 0) {
    return sessions
  }

  return orderItemsByPinnedFirst(
    sessions,
    (session) => pinnedSessionIds.has(session.id),
  )
}
