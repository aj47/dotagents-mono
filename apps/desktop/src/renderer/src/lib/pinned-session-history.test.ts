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
  it("moves pinned sessions ahead while preserving each group's existing order", () => {
    const sessions = [
      createSession("session-4", 40),
      createSession("session-3", 30),
      createSession("session-2", 20),
      createSession("session-1", 10),
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
})