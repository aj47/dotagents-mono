import type { ConversationHistoryItem } from "@shared/types"

function getConversationHistoryActivityTimestamp(session: ConversationHistoryItem): number {
  const updatedAt = Number.isFinite(session.updatedAt) ? session.updatedAt : 0
  const lastMessageAt =
    typeof session.lastMessageAt === "number" && Number.isFinite(session.lastMessageAt)
      ? session.lastMessageAt
      : 0

  return Math.max(updatedAt, lastMessageAt)
}

export function orderConversationHistoryByRecentActivity(
  sessions: ConversationHistoryItem[],
): ConversationHistoryItem[] {
  return [...sessions].sort((a, b) =>
    getConversationHistoryActivityTimestamp(b) - getConversationHistoryActivityTimestamp(a)
  )
}

export function orderConversationHistoryByPinnedFirst(
  sessions: ConversationHistoryItem[],
  pinnedSessionIds: ReadonlySet<string>,
): ConversationHistoryItem[] {
  return [...sessions].sort((a, b) => {
    const pinOrder =
      Number(pinnedSessionIds.has(b.id)) - Number(pinnedSessionIds.has(a.id))
    if (pinOrder !== 0) return pinOrder

    return getConversationHistoryActivityTimestamp(b) - getConversationHistoryActivityTimestamp(a)
  })
}
