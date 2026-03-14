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
})