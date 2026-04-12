import { describe, expect, it } from "vitest"

import {
  filterPastSessionsAgainstActiveSessions,
  getLatestAgentResponseTimestamp,
  hasUnreadAgentResponse,
  isSidebarSessionCurrentlyViewed,
  orderActiveSessionsByPinnedFirst,
} from "./sidebar-sessions"

const activeSession = (id: string, conversationId?: string) => ({
  id,
  conversationId,
})
const pastSession = (id: string, conversationId?: string) => ({
  session: { id, conversationId },
})

describe("orderActiveSessionsByPinnedFirst", () => {
  it("moves pinned active sessions to the top while preserving each group's order", () => {
    const ordered = orderActiveSessionsByPinnedFirst(
      [
        activeSession("session-1", "conversation-1"),
        activeSession("session-2", "conversation-2"),
        activeSession("session-3", "conversation-3"),
      ],
      new Set(["conversation-2"]),
    )

    expect(ordered.map((session) => session.id)).toEqual([
      "session-2",
      "session-1",
      "session-3",
    ])
  })
})

describe("filterPastSessionsAgainstActiveSessions", () => {
  it("removes past entries whose conversation is already active", () => {
    const filtered = filterPastSessionsAgainstActiveSessions(
      [
        pastSession("history-1", "conversation-1"),
        pastSession("history-2", "conversation-2"),
      ],
      [activeSession("session-1", "conversation-1")],
    )

    expect(filtered).toEqual([pastSession("history-2", "conversation-2")])
  })

  it("removes fallback past entries whose session id is already active", () => {
    const filtered = filterPastSessionsAgainstActiveSessions(
      [pastSession("session-1"), pastSession("session-2")],
      [activeSession("session-1")],
    )

    expect(filtered).toEqual([pastSession("session-2")])
  })
})

describe("isSidebarSessionCurrentlyViewed", () => {
  it("marks a past session as viewed when its conversation is open", () => {
    expect(
      isSidebarSessionCurrentlyViewed(activeSession("history-1", "conversation-1"), {
        isPast: true,
        viewedConversationId: "conversation-1",
      }),
    ).toBe(true)
  })

  it("marks an active session as viewed when it is focused or expanded", () => {
    expect(
      isSidebarSessionCurrentlyViewed(activeSession("session-2", "conversation-2"), {
        isPast: false,
        focusedSessionId: "session-2",
      }),
    ).toBe(true)

    expect(
      isSidebarSessionCurrentlyViewed(activeSession("session-3", "conversation-3"), {
        isPast: false,
        expandedSessionId: "session-3",
      }),
    ).toBe(true)
  })

  it("does not mark unrelated past sessions as viewed", () => {
    expect(
      isSidebarSessionCurrentlyViewed(activeSession("history-4", "conversation-4"), {
        isPast: true,
        viewedConversationId: "conversation-1",
      }),
    ).toBe(false)
  })

  it("prefers the explicitly viewed conversation over stale focused active rows", () => {
    expect(
      isSidebarSessionCurrentlyViewed(activeSession("session-5", "conversation-5"), {
        isPast: false,
        focusedSessionId: "session-5",
        viewedConversationId: "conversation-1",
      }),
    ).toBe(false)
  })
})

describe("agent response unread helpers", () => {
  it("uses response events and assistant history as unread response timestamps", () => {
    const latestTimestamp = getLatestAgentResponseTimestamp({
      sessionId: "session-1",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      responseEvents: [
        { id: "response-1", sessionId: "session-1", ordinal: 1, text: "First", timestamp: 100 },
      ],
      conversationHistory: [
        { role: "user", content: "Hello", timestamp: 200 },
        { role: "assistant", content: "Second", timestamp: 300 },
      ],
    })

    expect(latestTimestamp).toBe(300)
  })

  it("marks a newer unseen agent response as unread", () => {
    const progress = {
      sessionId: "session-2",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      responseEvents: [
        { id: "response-2", sessionId: "session-2", ordinal: 1, text: "Look at this", timestamp: 250 },
      ],
    }

    expect(hasUnreadAgentResponse(progress, 100, false)).toBe(true)
    expect(hasUnreadAgentResponse(progress, 250, false)).toBe(false)
    expect(hasUnreadAgentResponse(progress, 100, true)).toBe(false)
  })
})
