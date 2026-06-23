import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []
let summaryResult = "Compacted conversation summary."
let mockConfig: Record<string, unknown> = {}
let mockActiveContextTargetTokens = 12_000

async function setupConversationServiceTest() {
  const conversationsFolder = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-conv-lazy-"))
  tempDirs.push(conversationsFolder)

  vi.doMock("./config", () => ({
    appId: "app.dotagents.test",
    dataFolder: conversationsFolder,
    recordingsFolder: path.join(conversationsFolder, "recordings"),
    conversationsFolder,
    configPath: path.join(conversationsFolder, "config.json"),
    configStore: {
      get: vi.fn(() => mockConfig),
      save: vi.fn(),
      reload: vi.fn(() => mockConfig),
      config: undefined,
    },
  }))
  vi.doMock("./context-budget", () => ({
    estimateTokensFromMessages: vi.fn((messages: Array<{ content?: string }>) => {
      const chars = messages.reduce((sum, message) => sum + (message.content?.length || 0), 0)
      return Math.ceil(chars / 4)
    }),
    getActiveContextTargetTokens: vi.fn(() => mockActiveContextTargetTokens),
    summarizeContent: vi.fn(() => summaryResult),
  }))
  vi.doMock("./llm-fetch", () => ({ makeTextCompletionWithFetch: vi.fn() }))

  const { ConversationService } = await import("./conversation-service")
  return ConversationService.getInstance()
}

afterEach(async () => {
  summaryResult = "Compacted conversation summary."
  mockConfig = {}
  mockActiveContextTargetTokens = 12_000
  vi.resetModules()
  vi.clearAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("conversation lazy loading", () => {
  it("includes repeat-task provenance in saved conversation history", async () => {
    const service = await setupConversationServiceTest()
    const repeatTask = {
      type: "repeat_task_run" as const,
      taskId: "daily-brief",
      taskName: "Daily Brief",
      runId: "daily-brief:200",
      role: "worker" as const,
    }

    await service.saveConversation({
      id: "conv_repeat_task",
      title: "Daily Brief Run",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "user", content: "Build the daily brief", timestamp: 150 },
      ],
      repeatTask,
    }, true)

    const [item] = await service.getConversationHistory()

    expect(item.repeatTask).toEqual(repeatTask)
  })

  it("backfills repeat-task provenance by exact prompt even when the generated title looks like task setup", async () => {
    const service = await setupConversationServiceTest()
    const repeatTaskPrompt = "# Daily Brief\n\nRun the daily brief."

    await service.saveConversation({
      id: "conv_real_run",
      title: "Daily Brief",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "user", content: repeatTaskPrompt, timestamp: 150 },
      ],
    }, true)
    await service.saveConversation({
      id: "conv_create_titled_run",
      title: "Create Daily Brief Task",
      createdAt: 100,
      updatedAt: 250,
      messages: [
        { id: "m1", role: "user", content: repeatTaskPrompt, timestamp: 150 },
      ],
    }, true)

    const updatedCount = await service.backfillRepeatTaskSourcesByPrompt([
      {
        taskId: "daily-brief",
        taskName: "Daily Brief",
        prompt: repeatTaskPrompt,
      },
    ])

    const runConversation = await service.loadConversation("conv_real_run")
    const createTitledRunConversation = await service.loadConversation("conv_create_titled_run")

    expect(updatedCount).toBe(2)
    expect(runConversation?.updatedAt).toBe(200)
    expect(runConversation?.repeatTask).toEqual({
      type: "repeat_task_run",
      taskId: "daily-brief",
      taskName: "Daily Brief",
      runId: "conv_real_run",
      role: "worker",
    })
    expect(createTitledRunConversation?.updatedAt).toBe(250)
    expect(createTitledRunConversation?.repeatTask).toEqual({
      type: "repeat_task_run",
      taskId: "daily-brief",
      taskName: "Daily Brief",
      runId: "conv_create_titled_run",
      role: "worker",
    })
  })

  it("skips repeat-task provenance backfill for duplicate prompts", async () => {
    const service = await setupConversationServiceTest()
    const repeatTaskPrompt = "# Shared Prompt\n\nRun this."

    await service.saveConversation({
      id: "conv_shared_prompt",
      title: "Shared Prompt Run",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "user", content: repeatTaskPrompt, timestamp: 150 },
      ],
    }, true)

    const updatedCount = await service.backfillRepeatTaskSourcesByPrompt([
      {
        taskId: "task-a",
        taskName: "Task A",
        prompt: repeatTaskPrompt,
      },
      {
        taskId: "task-b",
        taskName: "Task B",
        prompt: repeatTaskPrompt,
      },
    ])

    const conversation = await service.loadConversation("conv_shared_prompt")

    expect(updatedCount).toBe(0)
    expect(conversation?.repeatTask).toBeUndefined()
  })

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

  it("indexes user prompts and agent final responses for saved conversation search", async () => {
    const service = await setupConversationServiceTest()

    await service.saveConversation({
      id: "conv_search_text",
      title: "Searchable history",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "user", content: "Start the run", timestamp: 1 },
        { id: "m2", role: "assistant", content: "Starting", timestamp: 2 },
        { id: "m3", role: "tool", content: "tool-only phrase should not be indexed", timestamp: 3 },
        { id: "m4", role: "user", content: "Find the cobalt catalog reference", timestamp: 4 },
        {
          id: "m5",
          role: "assistant",
          content: "",
          timestamp: 5,
          toolCalls: [{ name: "respond_to_user", arguments: { text: "Final answer mentions the quartz invoice" } }],
        },
        { id: "m6", role: "tool", content: "[respond_to_user] {\"success\":true}", timestamp: 6 },
      ],
    }, true)

    const [item] = await service.getConversationHistory()

    expect(item.searchText).toContain("cobalt catalog reference")
    expect(item.searchText).toContain("Final answer mentions the quartz invoice")
    expect(item.searchText).not.toContain("tool-only phrase should not be indexed")
    expect(item.searchText?.length ?? 0).toBeLessThanOrEqual(8000)
  })

  it("orders saved conversation history by latest update or message timestamp", async () => {
    const service = await setupConversationServiceTest()

    await service.saveConversation({
      id: "conv_newer_update",
      title: "Newer update",
      createdAt: 100,
      updatedAt: 500,
      messages: [
        { id: "m1", role: "user", content: "Earlier message", timestamp: 120 },
      ],
    }, true)

    await service.saveConversation({
      id: "conv_newer_message",
      title: "Newer message",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: "m1", role: "user", content: "Latest message", timestamp: 700 },
      ],
    }, true)

    const history = await service.getConversationHistory()

    expect(history.map((item) => item.id)).toEqual([
      "conv_newer_message",
      "conv_newer_update",
    ])
    expect(history[0]).toMatchObject({
      id: "conv_newer_message",
      updatedAt: 700,
      lastMessageAt: 700,
    })
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

  it("loads display windows from preserved raw history after compaction", async () => {
    const service = await setupConversationServiceTest()
    const rawMessages = Array.from({ length: 25 }, (_, index) => ({
      id: `r${index}`,
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `Raw ${index}`,
      timestamp: 1_700_000_000_000 + index,
    }))

    await service.saveConversation({
      id: "conv_lazy_raw_window",
      title: "Lazy raw window",
      createdAt: 100,
      updatedAt: 200,
      messages: [
        {
          id: "summary-1",
          role: "assistant",
          content: "Summary",
          timestamp: 1,
          isSummary: true,
          summarizedMessageCount: 15,
        },
        ...rawMessages.slice(15),
      ],
      rawMessages,
      compaction: {
        rawHistoryPreserved: true,
        storedRawMessageCount: rawMessages.length,
        representedMessageCount: rawMessages.length,
        summary: "Summary",
        firstKeptMessageIndex: 15,
        summarizedRange: { startIndex: 0, endIndex: 14 },
        summarizedMessageCount: 15,
      },
    }, true)

    const loadedWindow = await service.loadConversationForDisplay("conv_lazy_raw_window", { messageLimit: 5 })
    const loadedFull = await service.loadConversationForDisplay("conv_lazy_raw_window")

    expect(loadedWindow?.messages.map((message) => message.content)).toEqual([
      "Raw 20",
      "Raw 21",
      "Raw 22",
      "Raw 23",
      "Raw 24",
    ])
    expect(loadedWindow?.messageOffset).toBe(20)
    expect(loadedWindow?.totalMessageCount).toBe(25)
    expect(loadedWindow?.branchMessageIndexOffset).toBe(20)
    expect(loadedWindow).not.toHaveProperty("rawMessages")

    expect(loadedFull?.messages[0]?.content).toBe("Raw 0")
    expect(loadedFull?.messages).toHaveLength(25)
    expect(loadedFull).not.toHaveProperty("rawMessages")
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

  it("uses the configured message threshold to compact shorter conversations", async () => {
    mockConfig = { mcpConversationCompactionMessageThreshold: 12 }
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_low_message_threshold",
      title: "Low threshold",
      createdAt: 100,
      updatedAt: 200,
      messages: Array.from({ length: 13 }, (_, index) => ({
        id: `m${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: `Message ${index}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    }, true)

    const loaded = await service.loadConversationWithCompaction(
      "conv_low_message_threshold",
    )

    expect(loaded?.messages).toHaveLength(11)
    expect(loaded?.messages[0]).toMatchObject({ isSummary: true, content: summaryResult })
    expect(loaded?.compaction).toMatchObject({
      storedRawMessageCount: 13,
      firstKeptMessageId: "m3",
      summarizedMessageCount: 3,
    })
  })

  it("uses the configured message threshold to avoid default compaction", async () => {
    mockConfig = { mcpConversationCompactionMessageThreshold: 30 }
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_high_message_threshold",
      title: "High threshold",
      createdAt: 100,
      updatedAt: 200,
      messages: Array.from({ length: 25 }, (_, index) => ({
        id: `m${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: `Message ${index}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    }, true)

    const loaded = await service.loadConversationWithCompaction(
      "conv_high_message_threshold",
    )

    expect(loaded?.messages).toHaveLength(25)
    expect(loaded?.compaction).toBeUndefined()
  })

  it("uses the configured token threshold to compact below the message threshold", async () => {
    mockConfig = {
      mcpConversationCompactionMessageThreshold: 30,
      mcpConversationCompactionTokenThreshold: 1000,
    }
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_token_threshold",
      title: "Token threshold",
      createdAt: 100,
      updatedAt: 200,
      messages: Array.from({ length: 12 }, (_, index) => ({
        id: `m${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: `Message ${index} ${"token-heavy ".repeat(60)}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    }, true)

    const loaded = await service.loadConversationWithCompaction(
      "conv_token_threshold",
    )

    expect(loaded?.messages).toHaveLength(11)
    expect(loaded?.messages[0]).toMatchObject({ isSummary: true, content: summaryResult })
    expect(loaded?.compaction).toMatchObject({
      storedRawMessageCount: 12,
      firstKeptMessageId: "m2",
      summarizedMessageCount: 2,
    })
  })

  it("uses the active context target tokens when the token threshold is unset", async () => {
    mockConfig = { mcpConversationCompactionMessageThreshold: 30 }
    mockActiveContextTargetTokens = 1_000
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_ratio_token_threshold",
      title: "Ratio token threshold",
      createdAt: 100,
      updatedAt: 200,
      messages: Array.from({ length: 12 }, (_, index) => ({
        id: `m${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: `Message ${index} ${"token-heavy ".repeat(60)}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    }, true)

    const loaded = await service.loadConversationWithCompaction(
      "conv_ratio_token_threshold",
    )

    expect(loaded?.messages).toHaveLength(11)
    expect(loaded?.messages[0]).toMatchObject({ isSummary: true, content: summaryResult })
    expect(loaded?.compaction).toMatchObject({
      storedRawMessageCount: 12,
      firstKeptMessageId: "m2",
      summarizedMessageCount: 2,
    })
  })

  it("does not compact below the active context target tokens", async () => {
    mockConfig = { mcpConversationCompactionMessageThreshold: 30 }
    mockActiveContextTargetTokens = 12_000
    const service = await setupConversationServiceTest()
    await service.saveConversation({
      id: "conv_no_token_threshold",
      title: "No token threshold",
      createdAt: 100,
      updatedAt: 200,
      messages: Array.from({ length: 12 }, (_, index) => ({
        id: `m${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: `Message ${index} ${"token-heavy ".repeat(60)}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    }, true)

    const loaded = await service.loadConversationWithCompaction(
      "conv_no_token_threshold",
    )

    expect(loaded?.messages).toHaveLength(12)
    expect(loaded?.compaction).toBeUndefined()
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

  it("treats first kept indexes as persisted checkpoint metadata for legacy messages without ids", async () => {
    const service = await setupConversationServiceTest()
    const rawMessages = Array.from({ length: 25 }, (_, index) => ({
      id: undefined as any,
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `Message ${index}`,
      timestamp: 1_700_000_000_000 + index,
    }))
    const summaryMessage = {
      id: undefined as any,
      role: "assistant" as const,
      content: "Compacted summary.",
      timestamp: 1_700_000_000_100,
      isSummary: true,
      summarizedMessageCount: 15,
    }

    await service.saveConversation({
      id: "conv_checkpoint_no_message_ids",
      title: "Checkpoint without message ids",
      createdAt: 100,
      updatedAt: 200,
      messages: [summaryMessage, ...rawMessages.slice(15)],
      rawMessages,
      compaction: {
        rawHistoryPreserved: true,
        storedRawMessageCount: 25,
        representedMessageCount: 25,
        compactedAt: summaryMessage.timestamp,
        summary: summaryMessage.content,
        firstKeptMessageIndex: 15,
        summarizedRange: { startIndex: 0, endIndex: 14 },
        summarizedMessageCount: 15,
      },
    }, true)

    const saveSpy = vi.spyOn(service, "saveConversation")

    const loaded = await service.loadConversationWithCompaction("conv_checkpoint_no_message_ids")

    expect(loaded?.compaction?.firstKeptMessageIndex).toBe(15)
    expect(saveSpy).not.toHaveBeenCalled()
  })

  it("clamps checkpoint summarized counts to the preserved raw history bounds", async () => {
    const service = await setupConversationServiceTest()
    const rawMessages = Array.from({ length: 3 }, (_, index) => ({
      id: `m${index}`,
      role: "user" as const,
      content: `Message ${index}`,
      timestamp: 1_700_000_000_000 + index,
    }))

    const metadata = (service as any).buildCompactionCheckpointMetadata(
      undefined,
      rawMessages,
      {
        id: "summary-1",
        role: "assistant",
        content: "Summary",
        timestamp: 1_700_000_000_010,
        isSummary: true,
        summarizedMessageCount: 99,
      },
      99,
      12,
      1_700_000_000_010,
    )

    expect(metadata.summarizedMessageCount).toBe(3)
    expect(metadata.firstKeptMessageId).toBeUndefined()
    expect(metadata.firstKeptMessageIndex).toBeUndefined()
    expect(metadata.summarizedRange).toMatchObject({ startIndex: 0, endIndex: 2 })
  })
})
