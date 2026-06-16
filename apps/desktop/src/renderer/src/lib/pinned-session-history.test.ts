import { describe, expect, it } from "vitest"

import type { ConversationHistoryItem } from "@shared/types"

import {
  orderConversationHistoryByPinnedFirst,
  orderConversationHistoryByRecentActivity,
} from "./pinned-session-history"

const createSession = (id: string, updatedAt: number): ConversationHistoryItem => ({
  id,
  title: id,
  createdAt: updatedAt - 100,
  updatedAt,
  messageCount: 1,
  lastMessage: "",
  preview: "",
})

describe("orderConversationHistoryByPinnedFirst", () => {
  it("moves pinned sessions ahead while sorting each group by recent activity", () => {
    const sessions = [
      createSession("session-1", 10),
      createSession("session-2", 20),
      createSession("session-3", 30),
      createSession("session-4", 40),
    ]

    const ordered = orderConversationHistoryByPinnedFirst(
      sessions,
      new Set(["session-3", "session-1"]),
    )

    expect(ordered.map((session) => session.id)).toEqual([
      "session-3",
      "session-1",
      "session-4",
      "session-2",
    ])
  })

  it("defaults unpinned history to newest updated conversation first", () => {
    const sessions = [
      createSession("session-1", 10),
      createSession("session-3", 30),
      createSession("session-2", 20),
    ]

    const ordered = orderConversationHistoryByPinnedFirst(sessions, new Set())

    expect(ordered.map((session) => session.id)).toEqual([
      "session-3",
      "session-2",
      "session-1",
    ])
  })

  it("uses the last message timestamp when it is newer than updatedAt", () => {
    const olderUpdatedRecentMessage = {
      ...createSession("session-message-newer", 10),
      lastMessageAt: 50,
    }

    const ordered = orderConversationHistoryByPinnedFirst(
      [
        createSession("session-updated-newer", 40),
        olderUpdatedRecentMessage,
      ],
      new Set(),
    )

    expect(ordered.map((session) => session.id)).toEqual([
      "session-message-newer",
      "session-updated-newer",
    ])
  })
})

describe("orderConversationHistoryByRecentActivity", () => {
  it("keeps the home recent list ordered by actual activity instead of pin state", () => {
    const pinnedOld = createSession("pinned-old", 10)
    const latest = createSession("latest", 50)
    const recentlyMessaged = {
      ...createSession("recent-message", 20),
      lastMessageAt: 60,
    }

    const ordered = orderConversationHistoryByRecentActivity([
      pinnedOld,
      latest,
      recentlyMessaged,
    ])

    expect(ordered.map((session) => session.id)).toEqual([
      "recent-message",
      "latest",
      "pinned-old",
    ])
  })
})
