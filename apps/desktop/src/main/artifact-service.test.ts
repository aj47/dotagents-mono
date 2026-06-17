import { mkdtemp, rm, writeFile } from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConversationHistory: vi.fn(),
  loadConversationForDisplay: vi.fn(),
  openPath: vi.fn(),
  openExternal: vi.fn(),
  showItemInFolder: vi.fn(),
  getConversationImageAssetPath: vi.fn(),
  getConversationVideoAssetPath: vi.fn(),
}))

vi.mock("electron", () => ({
  shell: {
    openPath: mocks.openPath,
    openExternal: mocks.openExternal,
    showItemInFolder: mocks.showItemInFolder,
  },
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    getConversationHistory: mocks.getConversationHistory,
    loadConversationForDisplay: mocks.loadConversationForDisplay,
  },
}))

vi.mock("./conversation-image-assets", () => ({
  CONVERSATION_IMAGE_ASSET_HOST: "conversation-image",
  getConversationImageAssetPath: mocks.getConversationImageAssetPath,
}))

vi.mock("./conversation-video-assets", () => ({
  CONVERSATION_VIDEO_ASSET_HOST: "conversation-video",
  getConversationVideoAssetPath: mocks.getConversationVideoAssetPath,
}))

describe("artifact service", () => {
  let tempDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    tempDir = await mkdtemp(path.join(os.tmpdir(), "dotagents-artifacts-"))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it("extracts existing local paths and URLs from conversation messages and tool data", async () => {
    const markdownPath = path.join(tempDir, "notes.md")
    const pdfPath = path.join(tempDir, "report.pdf")
    const videoPath = path.join(tempDir, "demo.mp4")
    await writeFile(markdownPath, "# Notes\n")
    await writeFile(pdfPath, "%PDF-1.4\n")
    await writeFile(videoPath, "video")

    const conversation = {
      id: "conv_1",
      title: "Artifact conversation",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        {
          id: "msg_1",
          role: "assistant",
          content: `Wrote "${markdownPath}" and see https://example.com/page plus missing /tmp/not-real.md`,
          timestamp: 10,
          toolCalls: [
            { name: "execute_command", arguments: { file: pdfPath } },
          ],
          toolResults: [
            { success: true, content: JSON.stringify({ output: videoPath }) },
          ],
        },
      ],
    }

    mocks.getConversationHistory.mockResolvedValue([
      {
        id: "conv_1",
        title: "Artifact conversation",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 1,
        lastMessage: "",
        preview: "",
      },
    ])
    mocks.loadConversationForDisplay.mockResolvedValue(conversation)

    const { artifactService } = await import("./artifact-service")
    const result = await artifactService.listArtifacts()
    const byReference = new Map(
      result.artifacts.map((artifact) => [
        artifact.normalizedReference,
        artifact,
      ]),
    )

    expect(byReference.get(markdownPath)?.kind).toBe("markdown")
    expect(byReference.get(pdfPath)?.kind).toBe("pdf")
    expect(byReference.get(videoPath)?.kind).toBe("video")
    expect(byReference.get("https://example.com/page")?.kind).toBe("url")
    expect(
      Array.from(byReference.keys()).some((ref) => ref.includes("not-real")),
    ).toBe(false)
  })

  it("dedupes artifacts by canonical local path", async () => {
    const textPath = path.join(tempDir, "same.txt")
    await writeFile(textPath, "hello")

    const conversation = {
      id: "conv_2",
      title: "Deduped",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        {
          id: "msg_1",
          role: "assistant",
          content: `${textPath}\n${textPath}`,
          timestamp: 10,
        },
      ],
    }

    mocks.getConversationHistory.mockResolvedValue([
      {
        id: "conv_2",
        title: "Deduped",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 1,
        lastMessage: "",
        preview: "",
      },
    ])
    mocks.loadConversationForDisplay.mockResolvedValue(conversation)

    const { artifactService } = await import("./artifact-service")
    const result = await artifactService.listArtifacts()

    expect(
      result.artifacts.filter((artifact) => artifact.localPath === textPath),
    ).toHaveLength(1)
  })

  it("reads capped previews for text artifacts", async () => {
    const textPath = path.join(tempDir, "long.txt")
    await writeFile(textPath, "abcdef")

    mocks.getConversationHistory.mockResolvedValue([
      {
        id: "conv_3",
        title: "Text",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 1,
        lastMessage: "",
        preview: "",
      },
    ])
    mocks.loadConversationForDisplay.mockResolvedValue({
      id: "conv_3",
      title: "Text",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: "msg_1", role: "assistant", content: textPath, timestamp: 10 },
      ],
    })

    const { artifactService } = await import("./artifact-service")
    const listed = await artifactService.listArtifacts()
    const textArtifact = listed.artifacts.find(
      (artifact) => artifact.localPath === textPath,
    )
    expect(textArtifact).toBeTruthy()

    const preview = await artifactService.readArtifactText({
      id: textArtifact!.id,
      maxBytes: 3,
    })
    expect(preview.content).toBe("abc")
    expect(preview.truncated).toBe(true)
  })

  it("uses useful URL titles instead of weak markdown labels", async () => {
    mocks.getConversationHistory.mockResolvedValue([
      {
        id: "conv_title",
        title: "Create Thumbnail Skill",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 1,
        lastMessage: "",
        preview: "",
      },
    ])
    mocks.loadConversationForDisplay.mockResolvedValue({
      id: "conv_title",
      title: "Create Thumbnail Skill",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        {
          id: "msg_1",
          role: "assistant",
          content:
            "[12340300](https://example.com/thumbnails) Title: Thumbnails | YouTube Data API\n[youtube-thumbnail-size-design-guide-2026](https://example.com/guide) Title: Guide (2026): Dimensions, Safe Zones, and Best Practices | Hooksnap Blog Highlights: Use 1280x720.\n[youtube-creator-academy-thumbnail-best-practices-high-contrast-text-faces](https://example.com/youtube-creator-academy-thumbnail-best-practices-high-contrast-text-faces/)",
          timestamp: 10,
        },
      ],
    })

    const { artifactService } = await import("./artifact-service")
    const result = await artifactService.listArtifacts({ forceRefresh: true })
    const names = result.artifacts.map((artifact) => artifact.name)

    expect(names).toContain("Thumbnails")
    expect(names).toContain(
      "Guide (2026): Dimensions, Safe Zones, and Best Practices",
    )
    expect(names).toContain(
      "YouTube Creator Academy Thumbnail Best Practices High Contrast Text Faces",
    )
    expect(
      result.artifacts.find((artifact) =>
        artifact.name.startsWith("Guide (2026)"),
      )?.excerpt,
    ).toBe("Use 1280x720.")
  })

  it("does not assign remote http media as artifact preview URLs", async () => {
    const imageUrl = "https://example.com/photo.png"
    mocks.getConversationHistory.mockResolvedValue([
      {
        id: "conv_remote_media",
        title: "Remote media",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 1,
        lastMessage: "",
        preview: "",
      },
    ])
    mocks.loadConversationForDisplay.mockResolvedValue({
      id: "conv_remote_media",
      title: "Remote media",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        {
          id: "msg_1",
          role: "assistant",
          content: imageUrl,
          timestamp: 10,
        },
      ],
    })

    const { artifactService } = await import("./artifact-service")
    const result = await artifactService.listArtifacts({ forceRefresh: true })
    const artifact = result.artifacts.find(
      (entry) => entry.normalizedReference === imageUrl,
    )

    expect(artifact?.kind).toBe("image")
    expect(artifact?.url).toBe(imageUrl)
    expect(artifact?.previewUrl).toBeUndefined()
    expect(artifact?.canOpen).toBe(true)
  })

  it("reuses the expensive conversation scan for search and kind filters", async () => {
    const textPath = path.join(tempDir, "cache.txt")
    await writeFile(textPath, "hello")

    mocks.getConversationHistory.mockResolvedValue([
      {
        id: "conv_cache",
        title: "Cache",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 1,
        lastMessage: "",
        preview: "",
      },
    ])
    mocks.loadConversationForDisplay.mockResolvedValue({
      id: "conv_cache",
      title: "Cache",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: "msg_1", role: "assistant", content: textPath, timestamp: 10 },
      ],
    })

    const { artifactService } = await import("./artifact-service")
    await artifactService.listArtifacts({ forceRefresh: true })
    await artifactService.listArtifacts({ query: "cache", kind: "text" })

    expect(mocks.loadConversationForDisplay).toHaveBeenCalledTimes(1)
  })
})
