import { beforeEach, describe, expect, it, vi } from "vitest"

async function loadModule(configOverrides: Record<string, unknown> = {}) {
  vi.resetModules()

  const chat = vi.fn((model: string) => ({ provider: "openai-compatible", model }))
  const createOpenAI = vi.fn(() => ({ chat }))
  const google = vi.fn((model: string) => ({ provider: "gemini", model }))
  const createGoogleGenerativeAI = vi.fn(() => google)

  vi.doMock("@ai-sdk/openai", () => ({ createOpenAI }))
  vi.doMock("@ai-sdk/google", () => ({ createGoogleGenerativeAI }))
  vi.doMock("./debug", () => ({ isDebugLLM: () => false, logLLM: vi.fn() }))
  vi.doMock("./config", () => ({
    configStore: {
      get: () => ({
        mcpToolsProviderId: "openai",
        openaiApiKey: "openai-key",
        groqApiKey: "groq-key",
        geminiApiKey: "gemini-key",
        ...configOverrides,
      }),
    },
  }))

  const mod = await import("./ai-sdk-provider")
  return { mod, chat, createOpenAI, google, createGoogleGenerativeAI }
}

describe("ai-sdk-provider chat model sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("falls back when a Groq STT model is configured for transcript post-processing", async () => {
    const { mod, chat } = await loadModule({
      transcriptPostProcessingGroqModel: "whisper-large-v3-turbo",
    })

    const model = mod.createLanguageModel("groq", "transcript")

    expect(chat).toHaveBeenCalledWith("openai/gpt-oss-120b")
    expect(mod.getCurrentModelName("groq", "transcript")).toBe("openai/gpt-oss-120b")
    expect(model).toEqual({ provider: "openai-compatible", model: "openai/gpt-oss-120b" })
  })

  it.each([
    "gpt-4o-transcribe",
    "gpt-4o-mini-transcribe",
  ])("falls back when an OpenAI STT-only model is configured for chat/text usage: %s", async (configuredModel) => {
    const { mod, chat } = await loadModule({
      transcriptPostProcessingOpenaiModel: configuredModel,
    })

    const model = mod.createLanguageModel("openai", "transcript")

    expect(chat).toHaveBeenCalledWith("gpt-4.1-mini")
    expect(mod.getCurrentModelName("openai", "transcript")).toBe("gpt-4.1-mini")
    expect(model).toEqual({ provider: "openai-compatible", model: "gpt-4.1-mini" })
  })

  it("preserves valid Groq chat models for transcript post-processing", async () => {
    const { mod, chat } = await loadModule({
      transcriptPostProcessingGroqModel: "openai/gpt-oss-120b",
    })

    mod.createLanguageModel("groq", "transcript")

    expect(chat).toHaveBeenCalledWith("openai/gpt-oss-120b")
    expect(mod.getCurrentModelName("groq", "transcript")).toBe("openai/gpt-oss-120b")
  })

  it.each([
    "gpt-5.3-codex-spark",
    "gpt-5.3-codex",
    "gpt-5.2-codex",
  ])("falls back when a ChatGPT-Web-only model is configured for the openai provider: %s", async (configuredModel) => {
    const { mod, chat } = await loadModule({
      mcpToolsOpenaiModel: configuredModel,
      transcriptPostProcessingOpenaiModel: configuredModel,
    })

    mod.createLanguageModel("openai", "mcp")
    expect(chat).toHaveBeenCalledWith("gpt-4.1-mini")
    expect(mod.getCurrentModelName("openai", "mcp")).toBe("gpt-4.1-mini")
    expect(mod.getCurrentModelName("openai", "transcript")).toBe("gpt-4.1-mini")
  })

  it.each([
    "gpt-5.3-codex-spark",
    "gpt-5.2-codex",
  ])("falls back when a ChatGPT-Web-only model is configured for the groq provider: %s", async (configuredModel) => {
    const { mod, chat } = await loadModule({
      mcpToolsGroqModel: configuredModel,
    })

    mod.createLanguageModel("groq", "mcp")
    expect(chat).toHaveBeenCalledWith("openai/gpt-oss-120b")
    expect(mod.getCurrentModelName("groq", "mcp")).toBe("openai/gpt-oss-120b")
  })

  it("reports implicit prefix caching for direct OpenAI", async () => {
    const { mod } = await loadModule({
      openaiBaseUrl: "https://api.openai.com/v1",
    })

    expect(mod.getPromptCachingConfig("openai")).toEqual({
      strategy: "openai-implicit-prefix",
    })
  })

  it("enables gateway auto caching when using Vercel AI Gateway", async () => {
    const { mod } = await loadModule({
      openaiBaseUrl: "https://ai-gateway.vercel.sh/v1",
    })

    expect(mod.getPromptCachingConfig("openai")).toEqual({
      strategy: "gateway-auto",
      providerOptions: {
        gateway: {
          caching: "auto",
        },
      },
    })
  })

  it("reports stable-prefix caching strategy for Gemini", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "gemini",
    })

    expect(mod.getPromptCachingConfig("gemini")).toEqual({
      strategy: "gemini-stable-prefix",
    })
  })

  it("enables anthropic cache control when model name contains 'claude'", async () => {
    const { mod } = await loadModule({
      mcpToolsOpenaiModel: "claude-sonnet-4-5",
    })

    expect(mod.getPromptCachingConfig("openai")).toEqual({
      strategy: "anthropic-cache-control",
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    })
  })

  it("enables anthropic cache control when base URL contains 'openrouter'", async () => {
    const { mod } = await loadModule({
      openaiBaseUrl: "https://openrouter.ai/api/v1",
      mcpToolsOpenaiModel: "some-model",
    })

    expect(mod.getPromptCachingConfig("openai")).toEqual({
      strategy: "anthropic-cache-control",
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    })
  })

  it("enables anthropic cache control when model name contains 'anthropic'", async () => {
    const { mod } = await loadModule({
      mcpToolsOpenaiModel: "anthropic/claude-3.5-sonnet",
    })

    expect(mod.getPromptCachingConfig("openai")).toEqual({
      strategy: "anthropic-cache-control",
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    })
  })

  it("returns undefined for unknown proxy without anthropic model", async () => {
    const { mod } = await loadModule({
      openaiBaseUrl: "https://my-custom-proxy.example.com/v1",
      mcpToolsOpenaiModel: "gpt-4.1-mini",
    })

    expect(mod.getPromptCachingConfig("openai")).toBeUndefined()
  })

  it("returns configured model metadata for chatgpt-web and disables prompt caching hints", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "chatgpt-web",
      mcpToolsChatgptWebModel: "gpt-5",
      chatgptWebAccessToken: "chatgpt-token",
      chatgptWebBaseUrl: "https://chatgpt.com",
    })

    expect(mod.getCurrentModelName("chatgpt-web")).toBe("gpt-5")
    expect(mod.getPromptCachingConfig("chatgpt-web")).toBeUndefined()
    expect(() => mod.createLanguageModel("chatgpt-web")).toThrow(
      "chatgpt-web provider uses a custom fetch transport, not AI SDK createLanguageModel",
    )
  })

  it("returns medium reasoning effort by default for GPT-5 family openai models", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-5.4",
    })
    expect(mod.getReasoningEffortProviderOptions("openai", "mcp")).toEqual({
      openai: { reasoningEffort: "medium" },
    })
  })

  it("honors user override for openai reasoning effort", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-5.4-mini",
      openaiReasoningEffort: "high",
    })
    expect(mod.getReasoningEffortProviderOptions("openai", "mcp")).toEqual({
      openai: { reasoningEffort: "high" },
    })
  })

  it("returns undefined when user explicitly disables reasoning effort with 'none'", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-5",
      openaiReasoningEffort: "none",
    })
    expect(mod.getReasoningEffortProviderOptions("openai", "mcp")).toBeUndefined()
  })

  it("returns undefined for non-reasoning openai models", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-4.1-mini",
    })
    expect(mod.getReasoningEffortProviderOptions("openai", "mcp")).toBeUndefined()
  })

  it("returns undefined for gemini provider even on a reasoning-like model name", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "gemini",
    })
    expect(mod.getReasoningEffortProviderOptions("gemini", "mcp")).toBeUndefined()
  })

  it("merges prompt caching options with reasoning effort for anthropic-via-openai", async () => {
    const { mod } = await loadModule({
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-5",
      openaiBaseUrl: "https://api.openai.com/v1",
    })
    const caching = mod.getPromptCachingConfig("openai")
    const reasoning = mod.getReasoningEffortProviderOptions("openai", "mcp")
    const merged = mod.mergeProviderOptions(caching?.providerOptions, reasoning)
    expect(merged).toEqual({
      openai: { reasoningEffort: "medium" },
    })
  })
})
