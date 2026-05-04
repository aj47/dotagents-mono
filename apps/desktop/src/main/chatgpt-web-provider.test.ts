import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []

async function setupChatGptWebProviderTest(configOverrides: Record<string, unknown> = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-chatgpt-web-images-"))
  tempDirs.push(tempDir)

  vi.doMock("./config", () => ({
    configStore: {
      get: vi.fn(() => ({
        chatgptWebBaseUrl: "https://chatgpt.test",
        mcpToolsChatgptWebModel: "gpt-test",
        ...configOverrides,
      })),
      save: vi.fn(),
    },
  }))

  vi.doMock("./oauth-storage", () => ({
    oauthStorage: {
      getTokens: vi.fn(),
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
  vi.resetModules()
  vi.clearAllMocks()
  vi.restoreAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
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

describe("chatgpt-web Codex options", () => {
  async function setupCodexOptionsTest(config: Record<string, unknown>) {
    vi.doMock("./config", () => ({
      configStore: {
        get: vi.fn(() => config),
        save: vi.fn(),
      },
    }))
    vi.doMock("./oauth-storage", () => ({
      oauthStorage: {
        getTokens: vi.fn(),
        storeTokens: vi.fn(),
        clearTokens: vi.fn(),
      },
    }))
    vi.doMock("./conversation-image-assets", () => ({
      CONVERSATION_IMAGE_ASSET_HOST: "conversation-image",
      getConversationImageAssetPath: vi.fn(),
    }))
  }

  it("defaults Codex reasoning effort to low and requests summaries for thinking display", async () => {
    await setupCodexOptionsTest({})
    const { getCodexReasoningOptions } = await import("./chatgpt-web-provider")
    expect(getCodexReasoningOptions("gpt-5.1-codex")).toEqual({ effort: "low", summary: "auto" })
  })

  it("honors disabled and explicit Codex reasoning effort overrides", async () => {
    await setupCodexOptionsTest({ openaiReasoningEffort: "none" })
    let provider = await import("./chatgpt-web-provider")
    expect(provider.getCodexReasoningOptions("gpt-5.1-codex")).toBeUndefined()

    vi.resetModules()
    await setupCodexOptionsTest({ openaiReasoningEffort: "xhigh" })
    provider = await import("./chatgpt-web-provider")
    expect(provider.getCodexReasoningOptions("gpt-5.1-codex")).toEqual({ effort: "high", summary: "auto" })
  })

  it("defaults Codex text verbosity to medium when unset", async () => {
    await setupCodexOptionsTest({})
    const { getCodexTextVerbosity } = await import("./chatgpt-web-provider")
    expect(getCodexTextVerbosity()).toBe("medium")
  })

  it("returns the configured Codex text verbosity override", async () => {
    await setupCodexOptionsTest({ codexTextVerbosity: "high" })
    const { getCodexTextVerbosity } = await import("./chatgpt-web-provider")
    expect(getCodexTextVerbosity()).toBe("high")
  })

  it("ignores invalid Codex text verbosity values and falls back to medium", async () => {
    await setupCodexOptionsTest({ codexTextVerbosity: "verbose" })
    const { getCodexTextVerbosity } = await import("./chatgpt-web-provider")
    expect(getCodexTextVerbosity()).toBe("medium")
  })
})

describe("chatgpt-web response streaming", () => {
  it("surfaces reasoning start and reasoning summary deltas through the streaming callback", async () => {
    await setupChatGptWebProviderTest({ chatgptWebAccessToken: "test-access-token" })
    const encoder = new TextEncoder()
    const events = [
      { type: "response.created" },
      { type: "response.output_item.added", item: { type: "reasoning", id: "rs_1" } },
      { type: "response.output_text.delta", delta: "\n" },
      { type: "response.reasoning_summary_text.delta", delta: "Plan" },
      { type: "response.reasoning_summary_text.delta", delta: " next" },
      { type: "response.completed", response: { output: [] } },
    ]
    const body = new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
        controller.close()
      },
    })
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(body, { status: 200 }) as any)

    const { makeChatGptWebResponse } = await import("./chatgpt-web-provider")
    const chunks: Array<{ chunk: string; accumulated: string }> = []

    const response = await makeChatGptWebResponse([
      { role: "system", content: "System prompt" },
      { role: "user", content: "Hello" },
    ], {
      onTextChunk: (chunk, accumulated) => chunks.push({ chunk, accumulated }),
    })

    expect(chunks).toEqual([
      { chunk: "Thinking...", accumulated: "Thinking..." },
      { chunk: "\n\nPlan", accumulated: "Thinking...\n\nPlan" },
      { chunk: " next", accumulated: "Thinking...\n\nPlan next" },
    ])
    expect(response).toMatchObject({
      text: "",
      reasoningSummary: "Plan next",
    })
  })
})

describe("chatgpt-web Codex CLI auth fallback", () => {
  it("reads ChatGPT tokens from a Codex CLI auth cache", async () => {
    const { tempDir } = await setupChatGptWebProviderTest()
    const authPath = path.join(tempDir, "auth.json")
    await fs.writeFile(authPath, JSON.stringify({
      auth_mode: "chatgpt",
      tokens: {
        access_token: "codex-access-token",
        refresh_token: "codex-refresh-token",
      },
    }))

    const { readCodexCliChatGptTokens } = await import("./chatgpt-web-provider")

    expect(readCodexCliChatGptTokens(authPath)).toMatchObject({
      access_token: "codex-access-token",
      refresh_token: "codex-refresh-token",
      token_type: "Bearer",
    })
  })

  it("uses Codex CLI ChatGPT auth for provider auth status when app OAuth storage is empty", async () => {
    const { tempDir } = await setupChatGptWebProviderTest()
    const previousCodexHome = process.env.CODEX_HOME
    process.env.CODEX_HOME = tempDir
    await fs.writeFile(path.join(tempDir, "auth.json"), JSON.stringify({
      auth_mode: "chatgpt",
      tokens: {
        access_token: "codex-access-token",
        expires_at: Date.now() + 60_000,
      },
    }))

    try {
      const { getChatGptWebAuthStatus } = await import("./chatgpt-web-provider")

      await expect(getChatGptWebAuthStatus()).resolves.toMatchObject({
        authenticated: true,
      })
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME
      else process.env.CODEX_HOME = previousCodexHome
    }
  })
})
