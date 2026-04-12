import type { AgentProgressUpdate } from "@shared/types"

type SessionLike = {
  id: string
  conversationId?: string
}

interface SidebarSessionViewState {
  isPast: boolean
  focusedSessionId?: string | null
  expandedSessionId?: string | null
  viewedConversationId?: string | null
}

export function orderActiveSessionsByPinnedFirst<T extends SessionLike>(
  sessions: T[],
  pinnedSessionIds: ReadonlySet<string>,
): T[] {
  if (sessions.length <= 1 || pinnedSessionIds.size === 0) {
    return sessions
  }

  const pinnedSessions: T[] = []
  const unpinnedSessions: T[] = []

  for (const session of sessions) {
    if (
      session.conversationId &&
      pinnedSessionIds.has(session.conversationId)
    ) {
      pinnedSessions.push(session)
    } else {
      unpinnedSessions.push(session)
    }
  }

  return [...pinnedSessions, ...unpinnedSessions]
}

export function filterPastSessionsAgainstActiveSessions<
  T extends { session: SessionLike },
>(pastSessions: T[], activeSessions: SessionLike[]): T[] {
  if (pastSessions.length === 0 || activeSessions.length === 0) {
    return pastSessions
  }

  const activeConversationIds = new Set(
    activeSessions
      .map((session) => session.conversationId)
      .filter((conversationId): conversationId is string => !!conversationId),
  )
  const activeSessionIds = new Set(activeSessions.map((session) => session.id))

  return pastSessions.filter((item) => {
    if (activeSessionIds.has(item.session.id)) {
      return false
    }

    const conversationId = item.session.conversationId
    return !conversationId || !activeConversationIds.has(conversationId)
  })
}

export function isSidebarSessionCurrentlyViewed(
  session: SessionLike,
  {
    isPast,
    focusedSessionId = null,
    expandedSessionId = null,
    viewedConversationId = null,
  }: SidebarSessionViewState,
): boolean {
  if (viewedConversationId) {
    if (session.conversationId) {
      return session.conversationId === viewedConversationId
    }

    return !isPast && (
      session.id === focusedSessionId || session.id === expandedSessionId
    )
  }

  if (isPast) {
    return false
  }

  return session.id === focusedSessionId || session.id === expandedSessionId
}

export function getLatestAgentResponseTimestamp(
  progress?: AgentProgressUpdate | null,
): number | null {
  if (!progress) return null

  let latestTimestamp: number | null = null
  const recordTimestamp = (timestamp?: number) => {
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return
    latestTimestamp = Math.max(latestTimestamp ?? 0, timestamp)
  }

  for (const event of progress.responseEvents ?? []) {
    if (event.text.trim()) {
      recordTimestamp(event.timestamp)
    }
  }

  for (const message of progress.conversationHistory ?? []) {
    if (message.role === "assistant" && message.content.trim()) {
      recordTimestamp(message.timestamp)
    }
  }

  return latestTimestamp
}

export function hasUnreadAgentResponse(
  progress: AgentProgressUpdate | null | undefined,
  lastReadTimestamp: number | undefined,
  isCurrentlyViewed: boolean,
): boolean {
  if (isCurrentlyViewed) return false

  const latestResponseTimestamp = getLatestAgentResponseTimestamp(progress)
  if (latestResponseTimestamp === null) return false

  return latestResponseTimestamp > (lastReadTimestamp ?? 0)
}
