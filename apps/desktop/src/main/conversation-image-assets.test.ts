import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []

async function setupConversationImageAssetTest() {
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
  return { service: ConversationService.getInstance(), conversationsFolder }
}

afterEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("conversation image assets", () => {
  it("materializes inline data images into lightweight conversation asset URLs", async () => {
    const { service, conversationsFolder } = await setupConversationImageAssetTest()
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

  it("materializes inline data images in the first conversation message", async () => {
    const { service } = await setupConversationImageAssetTest()
    const base64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")

    const conversation = await service.createConversationWithId(
      "conv_first_image_test",
      `What is this?\n\n![Screen selection](data:image/png;base64,${base64})`,
      "user",
    )

    expect(conversation.messages[0].content).toContain(
      "![Screen selection](assets://conversation-image/conv_first_image_test/",
    )
    expect(conversation.messages[0].content).not.toContain("data:image")
  })

  it("uses a non-empty title for image-only first messages without alt text", async () => {
    const { service } = await setupConversationImageAssetTest()
    const base64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")

    const conversation = await service.createConversationWithId(
      "conv_empty_alt_image_title_test",
      `![](data:image/png;base64,${base64})`,
      "user",
    )

    expect(conversation.title).toBe("Image")
  })

  it("uses independent inline image matching for concurrent materialization calls", async () => {
    const { service } = await setupConversationImageAssetTest()
    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")
    const gifBase64 = Buffer.from([0x47, 0x49, 0x46, 0x38]).toString("base64")

    const [first, second] = await Promise.all([
      service.materializeInlineDataImagesInContent(
        "conv_one",
        `A ![one](data:image/png;base64,${pngBase64}) B ![two](data:image/gif;base64,${gifBase64}) C`,
      ),
      service.materializeInlineDataImagesInContent(
        "conv_two",
        `X ![alpha](data:image/gif;base64,${gifBase64}) Y ![beta](data:image/png;base64,${pngBase64}) Z`,
      ),
    ])

    expect(first).toContain("A ![one](assets://conversation-image/conv_one/")
    expect(first).toContain(" B ![two](assets://conversation-image/conv_one/")
    expect(first).toContain(" C")
    expect(second).toContain("X ![alpha](assets://conversation-image/conv_two/")
    expect(second).toContain(" Y ![beta](assets://conversation-image/conv_two/")
    expect(second).toContain(" Z")
    expect(`${first}${second}`).not.toContain("data:image")
  })

  it("stores local videos as conversation asset URLs", async () => {
    const { service, conversationsFolder } = await setupConversationImageAssetTest()
    const sourcePath = path.join(conversationsFolder, "source.mp4")
    await fs.writeFile(sourcePath, Buffer.from([0, 1, 2, 3]))

    const readFileSpy = vi.spyOn(fs, "readFile")
    const assetUrl = await service.storeVideoPathAsConversationAsset("conv_video_test", sourcePath)
    const duplicateAssetUrl = await service.storeVideoPathAsConversationAsset("conv_video_test", sourcePath)

    expect(assetUrl).toContain("assets://conversation-video/conv_video_test/")
    expect(duplicateAssetUrl).toBe(assetUrl)
    expect(readFileSpy).not.toHaveBeenCalled()
    readFileSpy.mockRestore()

    const fileName = assetUrl.match(/conv_video_test\/([a-f0-9]{64}\.mp4)$/)?.[1]
    expect(fileName).toBeTruthy()

    const storedVideo = await fs.readFile(path.join(conversationsFolder, "_videos", "conv_video_test", fileName!))
    expect([...storedVideo]).toEqual([0, 1, 2, 3])
  })

  it("rejects unsupported local video extensions", async () => {
    const { service, conversationsFolder } = await setupConversationImageAssetTest()
    const sourcePath = path.join(conversationsFolder, "source.txt")
    await fs.writeFile(sourcePath, Buffer.from([0, 1, 2, 3]))

    await expect(service.storeVideoPathAsConversationAsset("conv_video_test", sourcePath)).rejects.toThrow(
      "Unsupported video extension",
    )
  })

  it("rejects directory paths passed as video sources", async () => {
    const { service, conversationsFolder } = await setupConversationImageAssetTest()
    const dirPath = path.join(conversationsFolder, "videos_dir.mp4")
    await fs.mkdir(dirPath, { recursive: true })

    await expect(service.storeVideoPathAsConversationAsset("conv_video_test", dirPath)).rejects.toThrow(
      "Video path is not a regular file",
    )
  })
})
