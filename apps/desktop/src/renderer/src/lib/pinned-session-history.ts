import type { ConversationHistoryItem } from "@shared/types"

export function orderConversationHistoryByPinnedFirst(
  sessions: ConversationHistoryItem[],
  pinnedSessionIds: ReadonlySet<string>,
): ConversationHistoryItem[] {
  if (sessions.length <= 1 || pinnedSessionIds.size === 0) {
    return sessions
  }

  const pinnedSessions: ConversationHistoryItem[] = []
  const unpinnedSessions: ConversationHistoryItem[] = []

  for (const session of sessions) {
    if (pinnedSessionIds.has(session.id)) {
      pinnedSessions.push(session)
    } else {
      unpinnedSessions.push(session)
    }
  }

  return [...pinnedSessions, ...unpinnedSessions]
}