import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []

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
  vi.doMock("./context-budget", () => ({ summarizeContent: vi.fn((content: string) => content) }))
  vi.doMock("./llm-fetch", () => ({ makeTextCompletionWithFetch: vi.fn() }))

  const { ConversationService } = await import("./conversation-service")
  return ConversationService.getInstance()
}

afterEach(async () => {
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
})
