import { describe, expect, it } from "vitest"
import type { AgentProgressUpdate } from "./agent-progress"
import type { LoadedConversation } from "./conversation-domain"
import {
  hasConversationHistoryForDisplay,
  mergeLoadedConversationIntoProgress,
} from "./session-progress-hydration"

const baseProgress = (): AgentProgressUpdate => ({
  sessionId: "session-1",
  conversationId: "conv-1",
  conversationTitle: "Live title",
  currentIteration: 0,
  maxIterations: 10,
  steps: [],
  isComplete: false,
})

const loadedConversation = (): LoadedConversation => ({
  id: "conv-1",
  title: "Saved title",
  createdAt: 1,
  updatedAt: 2,
  messageOffset: 5,
  totalMessageCount: 7,
  branchMessageIndexOffset: 5,
  messages: [
    { id: "m1", role: "user", content: "Original task", timestamp: 10 },
    { id: "m2", role: "assistant", content: "Working on it", timestamp: 11 },
  ],
})

describe("session progress hydration", () => {
  it("hydrates placeholder progress from a loaded conversation", () => {
    const hydrated = mergeLoadedConversationIntoProgress(
      baseProgress(),
      loadedConversation(),
    )

    expect(hasConversationHistoryForDisplay(hydrated)).toBe(true)
    expect(hydrated.conversationHistory).toHaveLength(2)
    expect(hydrated.conversationHistory?.[0]).toMatchObject({
      role: "user",
      content: "Original task",
      timestamp: 10,
      branchMessageIndex: 5,
    })
    expect(hydrated.conversationHistoryStartIndex).toBe(5)
    expect(hydrated.conversationHistoryTotalCount).toBe(7)
    expect(hydrated.isComplete).toBe(false)
  })

  it("preserves persisted display-only content while hydrating progress", () => {
    const conversation = loadedConversation()
    conversation.messages[1].displayContent = "<think>reasoning</think>\n\nWorking on it"

    const hydrated = mergeLoadedConversationIntoProgress(
      baseProgress(),
      conversation,
    )

    expect(hydrated.conversationHistory?.[1]).toMatchObject({
      role: "assistant",
      content: "Working on it",
      displayContent: "<think>reasoning</think>\n\nWorking on it",
      branchMessageIndex: 6,
    })
  })

  it("does not overwrite live progress that already has conversation history", () => {
    const progress = {
      ...baseProgress(),
      conversationHistory: [
        { role: "user" as const, content: "Live task", timestamp: 20 },
      ],
    }

    expect(mergeLoadedConversationIntoProgress(progress, loadedConversation())).toBe(
      progress,
    )
  })

  it("uses the loaded window start when hydrating empty placeholder progress", () => {
    const progress = {
      ...baseProgress(),
      conversationHistoryStartIndex: 0,
    }

    const hydrated = mergeLoadedConversationIntoProgress(progress, loadedConversation())

    expect(hydrated.conversationHistoryStartIndex).toBe(5)
  })

  it("can replace a partial live history with an expanded loaded window", () => {
    const progress = {
      ...baseProgress(),
      conversationHistoryStartIndex: 6,
      conversationHistoryTotalCount: 7,
      conversationHistory: [
        { role: "assistant" as const, content: "Recent answer", timestamp: 30 },
      ],
    }

    const hydrated = mergeLoadedConversationIntoProgress(
      progress,
      loadedConversation(),
      { replaceExistingHistory: true },
    )

    expect(hydrated.conversationHistory).toHaveLength(2)
    expect(hydrated.conversationHistory?.[0]).toMatchObject({
      role: "user",
      content: "Original task",
      branchMessageIndex: 5,
    })
    expect(hydrated.conversationHistoryStartIndex).toBe(5)
    expect(hydrated.conversationHistoryTotalCount).toBe(7)
  })

  it("keeps newer in-memory messages when replacing with a loaded disk window", () => {
    const progress = {
      ...baseProgress(),
      conversationHistoryStartIndex: 6,
      conversationHistoryTotalCount: 8,
      conversationHistory: [
        { role: "assistant" as const, content: "Live answer", timestamp: 30 },
        { role: "user" as const, content: "Live follow-up", timestamp: 31 },
      ],
    }

    const hydrated = mergeLoadedConversationIntoProgress(
      progress,
      loadedConversation(),
      { replaceExistingHistory: true },
    )

    expect(hydrated.conversationHistoryStartIndex).toBe(5)
    expect(hydrated.conversationHistory?.map((message) => message.content)).toEqual([
      "Original task",
      "Live answer",
      "Live follow-up",
    ])
    expect(hydrated.conversationHistoryTotalCount).toBe(8)
  })

  it("infers the loaded window start when a limited result is missing messageOffset", () => {
    const conversation = loadedConversation()
    delete conversation.messageOffset

    const hydrated = mergeLoadedConversationIntoProgress(
      baseProgress(),
      conversation,
    )

    expect(hydrated.conversationHistoryStartIndex).toBe(5)
  })
})
