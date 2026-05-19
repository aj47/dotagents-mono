import { describe, expect, it } from "vitest"

import type { ConversationHistoryItem } from "@shared/types"

import { orderConversationHistoryByPinnedFirst } from "./pinned-session-history"

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
