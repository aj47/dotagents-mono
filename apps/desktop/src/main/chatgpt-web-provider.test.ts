import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []

async function setupChatGptWebProviderTest(options: {
  accessToken?: string
  accountId?: string
} = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-chatgpt-web-images-"))
  tempDirs.push(tempDir)

  vi.doMock("./config", () => ({
    configStore: {
      get: vi.fn(() => ({
        chatgptWebBaseUrl: "https://chatgpt.test",
        chatgptWebAccessToken: options.accessToken || "",
        chatgptWebAccountId: options.accountId || "",
        mcpToolsChatgptWebModel: "gpt-test",
      })),
      save: vi.fn(),
    },
  }))

  vi.doMock("./oauth-storage", () => ({
    oauthStorage: {
      getTokens: vi.fn(() => options.accessToken ? ({ access_token: options.accessToken }) : null),
      storeTokens: vi.fn(),
      clearTokens: vi.fn(),
    },
  }))

  vi.doMock("./conversation-image-assets", () => ({
    CONVERSATION_IMAGE_ASSET_HOST: "conversation-image",
    getConversationImageAssetPath: vi.fn((_conversationId: string, fileName: string) => (
      path.join(tempDir, fileName)
    )),
  }))

  return { tempDir }
}

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.resetModules()
  vi.clearAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("chatgpt-web provider transcription", () => {
  it("posts audio to the ChatGPT transcription endpoint with Codex auth", async () => {
    await setupChatGptWebProviderTest({ accessToken: "token-123", accountId: "acct_123" })
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => (
      new Response(JSON.stringify({ text: "hello codex" }), { status: 200 })
    ))
    vi.stubGlobal("fetch", fetchMock)
    const { transcribeWithChatGptWeb } = await import("./chatgpt-web-provider")

    const text = await transcribeWithChatGptWeb(new ArrayBuffer(2), { durationMs: 1234.56 })

    expect(text).toBe("hello codex")
    expect(fetchMock).toHaveBeenCalledWith(
      "https://chatgpt.test/backend-api/transcribe",
      expect.objectContaining({ method: "POST" }),
    )
    const init = fetchMock.mock.calls[0]![1]! as RequestInit & { body: FormData; headers: Record<string, string> }
    expect(init.headers).toMatchObject({
      Authorization: "Bearer token-123",
      "chatgpt-account-id": "acct_123",
      originator: "dotagents",
    })
    expect(init.body.get("duration_ms")).toBe("1235")
    const file = init.body.get("file")
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe("recording.webm")
  })

  it("throws when ChatGPT transcription returns no text", async () => {
    await setupChatGptWebProviderTest({ accessToken: "token-123" })
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })))
    const { transcribeWithChatGptWeb } = await import("./chatgpt-web-provider")

    await expect(transcribeWithChatGptWeb(new ArrayBuffer(2))).rejects.toThrow("returned no text")
  })
})

describe("chatgpt-web provider image input", () => {
  it("converts data-image markdown into Codex multimodal input parts", async () => {
    await setupChatGptWebProviderTest()
    const { buildCodexInput } = await import("./chatgpt-web-provider")

    const input = buildCodexInput([
      { role: "system", content: "System prompt" },
      { role: "user", content: "What do you see?\n\n![Screen selection](data:image/png;base64,abc123)" },
    ])

    expect(input).toEqual([
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: "What do you see?\n\n" },
          { type: "input_image", image_url: "data:image/png;base64,abc123" },
        ],
      },
    ])
  })

  it("resolves conversation image asset markdown into data-image Codex input parts", async () => {
    const { tempDir } = await setupChatGptWebProviderTest()
    await fs.writeFile(path.join(tempDir, "image.png"), Buffer.from("hello-image"))
    const { buildCodexInput } = await import("./chatgpt-web-provider")

    const input = buildCodexInput([
      {
        role: "user",
        content: "Read this\n\n![Screen selection](assets://conversation-image/conv_123/image.png)",
      },
    ])

    expect(input).toEqual([
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: "Read this\n\n" },
          {
            type: "input_image",
            image_url: `data:image/png;base64,${Buffer.from("hello-image").toString("base64")}`,
          },
        ],
      },
    ])
  })

  it("leaves oversized conversation image assets as text instead of inlining them", async () => {
    const { tempDir } = await setupChatGptWebProviderTest()
    await fs.writeFile(path.join(tempDir, "large.png"), Buffer.alloc(8 * 1024 * 1024 + 1))
    const { buildCodexInput } = await import("./chatgpt-web-provider")

    const content = "Read this\n\n![Screen selection](assets://conversation-image/conv_123/large.png)"
    const input = buildCodexInput([{ role: "user", content }])

    expect(input).toEqual([
      {
        type: "message",
        role: "user",
        content,
      },
    ])
  })
})
