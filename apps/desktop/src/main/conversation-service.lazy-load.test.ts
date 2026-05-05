import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []
let summaryResult = "Compacted conversation summary."

async function setupConversationServiceTest() {
  const conversationsFolder = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-conv-lazy-"))
  tempDirs.push(conversationsFolder)

  vi.doMock("./config", () => ({
    appId: "app.dotagents.test",
    dataFolder: conversationsFolder,
    recordingsFolder: path.join(conversationsFolder, "recordings"),
    conversationsFolder,
    configPath: path.join(conversationsFolder, "config.json"),
    configStore: { get: vi.fn(), save: vi.fn(), reload: vi.fn(), config: undefined },
  }))
  vi.doMock("./context-budget", () => ({ summarizeContent: vi.fn(() => summaryResult) }))
  vi.doMock("./llm-fetch", () => ({ makeTextCompletionWithFetch: vi.fn() }))

  const { ConversationService } = await import("./conversation-service")
  return ConversationService.getInstance()
}

afterEach(async () => {
  summaryResult = "Compacted conversation summary."
  vi.resetModules()
  vi.clearAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("conversation lazy loading", () => {
  it("keeps saved conversation history index snippets bounded", async () => {
    const service = await setupConversationServiceTest()
    const longMessage = "Huge tool output " + "A".repeat(2000)

    await service.saveConversation({
      id: "conv_history_index_snippet",
      title: "History index snippet",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "user", content: "Start", timestamp: 1 },
        { id: "m2", role: "tool", content: longMessage, timestamp: 2 },
      ],
    }, true)

    const [item] = await service.getConversationHistory()

    expect(item.lastMessage.length).toBeLessThanOrEqual(501)
    expect(item.lastMessage).toMatch(/^Huge tool output A+/)
    expect(item.lastMessage).toMatch(/…$/)
  })

  it("returns a tail message window without raw history payloads", async () => {
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_lazy_window",
      title: "Lazy window",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "assistant", content: "Summary", timestamp: 1, isSummary: true, summarizedMessageCount: 2 },
        { id: "m2", role: "user", content: "Middle", timestamp: 2 },
        { id: "m3", role: "assistant", content: "Answer", timestamp: 3 },
        { id: "m4", role: "user", content: "Follow up", timestamp: 4 },
      ],
      rawMessages: [
        { id: "r1", role: "user", content: "Raw 1", timestamp: 1 },
        { id: "r2", role: "assistant", content: "Raw 2", timestamp: 2 },
        { id: "r3", role: "user", content: "Raw 3", timestamp: 3 },
        { id: "r4", role: "assistant", content: "Raw 4", timestamp: 4 },
      ],
    }, true)

    const loaded = await service.loadConversation("conv_lazy_window", { messageLimit: 2 })

    expect(loaded?.messages.map((message) => message.content)).toEqual(["Answer", "Follow up"])
    expect(loaded?.messageOffset).toBe(2)
    expect(loaded?.totalMessageCount).toBe(4)
    expect(loaded?.branchMessageIndexOffset).toBe(3)
    expect(loaded).not.toHaveProperty("rawMessages")
  })

  it("persists display-only message content separately from canonical content", async () => {
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_display_content",
      title: "Display content",
      createdAt: 100,
      updatedAt: 200,
      messages: [{ id: "m1", role: "user", content: "Start", timestamp: 1 }],
    }, true)

    await service.addMessageToConversation(
      "conv_display_content",
      "Stored answer",
      "assistant",
      undefined,
      undefined,
      { displayContent: "<think>reasoning</think>\n\nStored answer" },
    )

    const loaded = await service.loadConversation("conv_display_content")

    expect(loaded?.messages[1]).toMatchObject({
      role: "assistant",
      content: "Stored answer",
      displayContent: "<think>reasoning</think>\n\nStored answer",
    })
  })

  it("persists structured compaction checkpoint metadata when compacting on load", async () => {
    summaryResult = "User identified Bin-Huang/youtube-analytics-cli as the YouTube analytics CLI repo."
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_compaction_checkpoint",
      title: "Compaction checkpoint",
      createdAt: 100,
      updatedAt: 200,
      messages: Array.from({ length: 25 }, (_, index) => ({
        id: `m${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: index === 2
          ? "Remember the YouTube analytics CLI repo is Bin-Huang/youtube-analytics-cli."
          : `Message ${index}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    }, true)

    const loaded = await service.loadConversationWithCompaction("conv_compaction_checkpoint")

    expect(loaded?.messages).toHaveLength(11)
    expect(loaded?.messages[0]).toMatchObject({ isSummary: true, content: summaryResult })
    expect(loaded?.rawMessages).toHaveLength(25)
    expect(loaded?.compaction).toMatchObject({
      rawHistoryPreserved: true,
      storedRawMessageCount: 25,
      representedMessageCount: 25,
      summary: summaryResult,
      firstKeptMessageId: "m15",
      firstKeptMessageIndex: 15,
      summarizedMessageCount: 15,
    })
    expect(loaded?.compaction?.tokensBefore).toBeGreaterThan(0)
    expect(loaded?.compaction?.extractedFacts?.[0]).toMatchObject({
      sourceMessageId: "m2",
      repoSlugs: ["Bin-Huang/youtube-analytics-cli"],
    })
  })

  it("backfills missing checkpoint metadata without refreshing updatedAt", async () => {
    const service = await setupConversationServiceTest()
    const rawMessages = Array.from({ length: 25 }, (_, index) => ({
      id: `m${index}`,
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: index === 2
        ? "Remember the analytics repo is Bin-Huang/youtube-analytics-cli."
        : `Message ${index}`,
      timestamp: 1_700_000_000_000 + index,
    }))
    const summaryMessage = {
      id: "summary-1",
      role: "assistant" as const,
      content: "The user mentioned Bin-Huang/youtube-analytics-cli.",
      timestamp: 1_700_000_000_100,
      isSummary: true,
      summarizedMessageCount: 15,
    }

    await service.saveConversation({
      id: "conv_checkpoint_backfill",
      title: "Checkpoint backfill",
      createdAt: 100,
      updatedAt: 200,
      messages: [summaryMessage, ...rawMessages.slice(15)],
      rawMessages,
    }, true)

    const loaded = await service.loadConversationWithCompaction("conv_checkpoint_backfill")

    expect(loaded?.updatedAt).toBe(200)
    expect(loaded?.compaction).toMatchObject({
      compactedAt: summaryMessage.timestamp,
      firstKeptMessageId: "m15",
      firstKeptMessageIndex: 15,
      summarizedMessageCount: 15,
    })
    expect(loaded?.compaction?.extractedFacts?.[0]).toMatchObject({
      sourceMessageId: "m2",
      repoSlugs: ["Bin-Huang/youtube-analytics-cli"],
    })

    const reloaded = await service.loadConversation("conv_checkpoint_backfill")
    expect(reloaded?.updatedAt).toBe(200)
  })
})
