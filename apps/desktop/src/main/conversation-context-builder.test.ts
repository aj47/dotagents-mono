import { describe, expect, it } from "vitest"
import {
  buildCompactionCheckpointContextMessage,
  buildRelevantEarlierConversationContextMessage,
  extractHighSignalFactsFromConversationMessages,
} from "./conversation-context-builder"

describe("buildRelevantEarlierConversationContextMessage", () => {
  it("retrieves an older source-backed repo fact for a later memory question", () => {
    const history = [
      {
        role: "user",
        content: "For the YouTube analytics CLI, remember the repo is Bin-Huang/youtube-analytics-cli.",
        timestamp: 1_700_000_000_000,
        branchMessageIndex: 7,
      },
      ...Array.from({ length: 30 }, (_, index) => ({
        role: index % 2 === 0 ? "assistant" : "user",
        content: `unrelated filler ${index}`,
        timestamp: 1_700_000_000_001 + index,
      })),
      {
        role: "user",
        content: "What GitHub repo did I mention for the YouTube analytics CLI?",
        timestamp: 1_700_000_000_999,
      },
    ]

    const context = buildRelevantEarlierConversationContextMessage(
      history,
      "What GitHub repo did I mention for the YouTube analytics CLI?",
    )

    expect(context?.role).toBe("assistant")
    expect(context?.content).toContain("[Relevant Earlier Conversation Facts]")
    expect(context?.content).toContain("Bin-Huang/youtube-analytics-cli")
    expect(context?.content).toContain("msg 7")
    expect(context?.content).toContain("quoted historical data")
  })

  it("checks the message just before the recent live tail", () => {
    const history = [
      {
        role: "user",
        content: "Remember the docs repo is dotagents/docs-site.",
      },
      ...Array.from({ length: 19 }, (_, index) => ({
        role: index % 2 === 0 ? "assistant" : "user",
        content: `recent filler ${index}`,
      })),
      {
        role: "user",
        content: "Which docs repo did I mention?",
      },
    ]

    const context = buildRelevantEarlierConversationContextMessage(
      history,
      "Which docs repo did I mention?",
    )

    expect(context?.content).toContain("dotagents/docs-site")
  })

  it("omits invalid timestamps instead of throwing while formatting sources", () => {
    const history = [
      {
        role: "user",
        content: "The repo was dotagents/out-of-range.",
        timestamp: Number.MAX_VALUE,
        branchMessageIndex: 3,
      },
      { role: "assistant", content: "Noted." },
      { role: "user", content: "Which repo was out of range?" },
    ]

    const context = buildRelevantEarlierConversationContextMessage(
      history,
      "Which repo was out of range?",
      { recentMessageCount: 1 },
    )

    expect(context?.content).toContain("dotagents/out-of-range")
    expect(context?.content).toContain("Source: msg 3;")
    expect(context?.content).not.toContain("Invalid Date")
  })

  it("does not inject context for small histories whose relevant messages are still in the live tail", () => {
    const history = [
      { role: "user", content: "Use repo example/project." },
      { role: "assistant", content: "Noted." },
      { role: "user", content: "Which repo did I mention?" },
    ]

    expect(buildRelevantEarlierConversationContextMessage(history, "Which repo did I mention?")).toBeNull()
  })

  it("builds a stable context block from persisted compaction checkpoint metadata", () => {
    const context = buildCompactionCheckpointContextMessage({
      rawHistoryPreserved: true,
      storedRawMessageCount: 24,
      representedMessageCount: 24,
      summary: "The user said the YouTube analytics CLI repo is Bin-Huang/youtube-analytics-cli.",
      summaryMessageId: "summary-1",
      firstKeptMessageId: "m14",
      firstKeptMessageIndex: 14,
      extractedFacts: [{
        sourceMessageIndex: 2,
        sourceMessageId: "m2",
        sourceRole: "user",
        excerpt: "The repo is Bin-Huang/youtube-analytics-cli.",
        repoSlugs: ["Bin-Huang/youtube-analytics-cli"],
      }],
    })

    expect(context?.content).toContain("[Persisted Conversation Checkpoint]")
    expect(context?.content).toContain("summary-1")
    expect(context?.content).toContain("First kept raw message")
    expect(context?.content).toContain("Bin-Huang/youtube-analytics-cli")
    expect(context?.content).toContain("raw history index 2 (m2)")
    expect(context?.content).toContain("quoted historical data")
  })

  it("extracts deterministic high-signal facts for checkpoint persistence", () => {
    const facts = extractHighSignalFactsFromConversationMessages([
      { id: "m1", role: "assistant", content: "No durable fact here." },
      { id: "m2", role: "user", content: "Remember repo Bin-Huang/youtube-analytics-cli and path apps/desktop/src/main/llm.ts" },
    ])

    expect(facts).toHaveLength(1)
    expect(facts[0]).toMatchObject({
      sourceMessageIndex: 1,
      sourceMessageId: "m2",
      repoSlugs: ["Bin-Huang/youtube-analytics-cli"],
    })
    expect(facts[0].paths).toContain("apps/desktop/src/main/llm.ts")
  })
})
