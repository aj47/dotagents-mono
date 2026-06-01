import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const { getCurrentProviderIdMock, makeTextCompletionWithFetchMock } = vi.hoisted(() => ({
  getCurrentProviderIdMock: vi.fn(() => "chatgpt-web"),
  makeTextCompletionWithFetchMock: vi.fn(),
}))

const tempDirs: string[] = []

async function setupConversationServiceTest() {
  const conversationsFolder = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-session-title-"))
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
  vi.doMock("./ai-sdk-provider", () => ({ getCurrentProviderId: getCurrentProviderIdMock }))
  vi.doMock("./llm-fetch", () => ({ makeTextCompletionWithFetch: makeTextCompletionWithFetchMock }))

  const { ConversationService } = await import("./conversation-service")
  return ConversationService.getInstance()
}

afterEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  getCurrentProviderIdMock.mockReturnValue("chatgpt-web")
  makeTextCompletionWithFetchMock.mockReset()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("conversation session titles", () => {
  it("routes automatic title generation through the active agent provider", async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue("Session Title Fix")
    const service = await setupConversationServiceTest()

    await service.createConversationWithId(
      "conv_session_title_provider",
      "why does sessiontitle setting keep having issues",
    )
    await service.addMessageToConversation(
      "conv_session_title_provider",
      "The title tool lost the conversation link after recording.",
      "assistant",
    )

    const updated = await service.maybeAutoGenerateConversationTitle(
      "conv_session_title_provider",
      "session-title-test",
    )

    expect(updated?.title).toBe("Session Title Fix")
    expect(updated?.titleSource).toBe("server_generated")
    expect(getCurrentProviderIdMock).toHaveBeenCalled()
    expect(makeTextCompletionWithFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("Generate a short session title"),
      "chatgpt-web",
      "session-title-test",
      undefined,
      expect.objectContaining({
        modelContext: "mcp",
        generationName: "Conversation Title Generation",
        maxRetries: 0,
        failureLogLevel: "warning",
        generationMetadata: expect.objectContaining({
          purpose: "conversation-title",
          optional: true,
        }),
      }),
    )
  })

  it("does not replace manual titles with automatic title generation", async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue("Automatic Title")
    const service = await setupConversationServiceTest()

    await service.createConversationWithId(
      "conv_manual_title",
      "summarize the launch plan",
    )
    await service.addMessageToConversation(
      "conv_manual_title",
      "Here is the launch plan summary.",
      "assistant",
    )
    await service.renameConversationTitle(
      "conv_manual_title",
      "My Manual Launch Notes",
      "manual",
    )

    const updated = await service.maybeAutoGenerateConversationTitle(
      "conv_manual_title",
      "session-title-test",
    )

    expect(updated).toBeNull()
    expect(makeTextCompletionWithFetchMock).not.toHaveBeenCalled()
    const conversation = await service.loadConversation("conv_manual_title")
    expect(conversation?.title).toBe("My Manual Launch Notes")
    expect(conversation?.titleSource).toBe("manual")
  })
})
