import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []

afterEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("conversation image assets", () => {
  it("materializes inline data images into lightweight conversation asset URLs", async () => {
    const conversationsFolder = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-conv-images-"))
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
    const service = ConversationService.getInstance()
    const base64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")

    const materialized = await service.materializeInlineDataImagesInContent(
      "conv_image_test",
      `Here is the preview.\n\n![Preview](data:image/png;base64,${base64})`,
    )

    expect(materialized).toContain("Here is the preview.")
    expect(materialized).toContain("![Preview](assets://conversation-image/conv_image_test/")
    expect(materialized).not.toContain("data:image")

    const fileName = materialized.match(/conv_image_test\/([a-f0-9]{64}\.png)\)/)?.[1]
    expect(fileName).toBeTruthy()
    const storedImage = await fs.readFile(path.join(conversationsFolder, "_images", "conv_image_test", fileName!))
    expect([...storedImage]).toEqual([0x89, 0x50, 0x4e, 0x47])
  })
})
