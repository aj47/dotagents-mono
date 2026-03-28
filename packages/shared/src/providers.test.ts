import { describe, it, expect } from "vitest"
import {
  STT_PROVIDERS,
  CHAT_PROVIDERS,
  TTS_PROVIDERS,
  DEFAULT_CHAT_MODELS,
  OPENAI_TTS_VOICES,
  OPENAI_TTS_MODELS,
  GROQ_TTS_VOICES_ENGLISH,
  GROQ_TTS_VOICES_ARABIC,
  GROQ_TTS_MODELS,
  GEMINI_TTS_VOICES,
  GEMINI_TTS_MODELS,
  KITTEN_TTS_VOICES,
  SUPERTONIC_TTS_VOICES,
  SUPERTONIC_TTS_LANGUAGES,
  OPENAI_COMPATIBLE_PRESETS,
  DEFAULT_MODEL_PRESET_ID,
  getBuiltInModelPresets,
  getChatProviderDisplayName,
  getCurrentPresetName,
  isTranscriptionOnlyChatModel,
  resolveModelPreset,
  resolveModelPresetId,
  resolveModelPresets,
  resolveChatModelDisplayInfo,
  resolveChatModelSelection,
  resolveChatProviderId,
  resolveTtsProviderId,
  resolveTtsSelection,
  sanitizeConfiguredChatModel,
} from "./providers"
import type { ModelPreset } from "./providers"

// ── Provider Constants ───────────────────────────────────────────────────────

describe("STT_PROVIDERS", () => {
  it("includes openai, groq, and parakeet", () => {
    const values = STT_PROVIDERS.map((p) => p.value)
    expect(values).toContain("openai")
    expect(values).toContain("groq")
    expect(values).toContain("parakeet")
  })

  it("each has a label and value", () => {
    for (const provider of STT_PROVIDERS) {
      expect(provider.label).toBeTruthy()
      expect(provider.value).toBeTruthy()
    }
  })
})

describe("CHAT_PROVIDERS", () => {
  it("includes openai, groq, and gemini", () => {
    const values = CHAT_PROVIDERS.map((p) => p.value)
    expect(values).toContain("openai")
    expect(values).toContain("groq")
    expect(values).toContain("gemini")
  })
})

describe("DEFAULT_CHAT_MODELS", () => {
  it("defines defaults for each chat provider and context", () => {
    expect(DEFAULT_CHAT_MODELS.openai.mcp).toBe("gpt-4.1-mini")
    expect(DEFAULT_CHAT_MODELS.groq.transcript).toBe("openai/gpt-oss-120b")
    expect(DEFAULT_CHAT_MODELS.gemini.mcp).toBe("gemini-2.5-flash")
  })
})

describe("TTS_PROVIDERS", () => {
  it("includes cloud and local providers", () => {
    const values = TTS_PROVIDERS.map((p) => p.value)
    expect(values).toContain("openai")
    expect(values).toContain("groq")
    expect(values).toContain("gemini")
    expect(values).toContain("kitten")
    expect(values).toContain("supertonic")
  })
})

// ── Voice Lists ──────────────────────────────────────────────────────────────

describe("Voice lists", () => {
  it("OPENAI_TTS_VOICES has 6 voices", () => {
    expect(OPENAI_TTS_VOICES).toHaveLength(6)
    expect(OPENAI_TTS_VOICES.map((v) => v.value)).toContain("alloy")
  })

  it("GROQ_TTS_VOICES_ENGLISH has 6 voices", () => {
    expect(GROQ_TTS_VOICES_ENGLISH).toHaveLength(6)
  })

  it("GROQ_TTS_VOICES_ARABIC has 4 voices", () => {
    expect(GROQ_TTS_VOICES_ARABIC).toHaveLength(4)
  })

  it("GEMINI_TTS_VOICES has 30 voices", () => {
    expect(GEMINI_TTS_VOICES).toHaveLength(30)
  })

  it("KITTEN_TTS_VOICES has 8 voices", () => {
    expect(KITTEN_TTS_VOICES).toHaveLength(8)
  })

  it("SUPERTONIC_TTS_VOICES has 10 voices (5 male + 5 female)", () => {
    expect(SUPERTONIC_TTS_VOICES).toHaveLength(10)
    const maleVoices = SUPERTONIC_TTS_VOICES.filter((v) =>
      String(v.value).startsWith("M"),
    )
    const femaleVoices = SUPERTONIC_TTS_VOICES.filter((v) =>
      String(v.value).startsWith("F"),
    )
    expect(maleVoices).toHaveLength(5)
    expect(femaleVoices).toHaveLength(5)
  })

  it("SUPERTONIC_TTS_LANGUAGES includes expected languages", () => {
    const values = SUPERTONIC_TTS_LANGUAGES.map((l) => l.value)
    expect(values).toContain("en")
    expect(values).toContain("ko")
    expect(values).toContain("es")
  })
})

// ── TTS Models ───────────────────────────────────────────────────────────────

describe("TTS Models", () => {
  it("OPENAI_TTS_MODELS has 3 models", () => {
    expect(OPENAI_TTS_MODELS).toHaveLength(3)
    expect(OPENAI_TTS_MODELS.map((m) => m.value)).toContain("tts-1")
  })

  it("GROQ_TTS_MODELS has 2 models", () => {
    expect(GROQ_TTS_MODELS).toHaveLength(2)
  })

  it("GEMINI_TTS_MODELS has 2 models", () => {
    expect(GEMINI_TTS_MODELS).toHaveLength(2)
  })
})

// ── OPENAI_COMPATIBLE_PRESETS ────────────────────────────────────────────────

describe("OPENAI_COMPATIBLE_PRESETS", () => {
  it("includes OpenAI, OpenRouter, Together, and Custom", () => {
    const values = OPENAI_COMPATIBLE_PRESETS.map((p) => p.value)
    expect(values).toContain("openai")
    expect(values).toContain("openrouter")
    expect(values).toContain("together")
    expect(values).toContain("custom")
  })

  it("custom preset has empty baseUrl", () => {
    const custom = OPENAI_COMPATIBLE_PRESETS.find((p) => p.value === "custom")
    expect(custom?.baseUrl).toBe("")
  })

  it("non-custom presets have baseUrl", () => {
    for (const preset of OPENAI_COMPATIBLE_PRESETS) {
      if (preset.value !== "custom") {
        expect(preset.baseUrl).toBeTruthy()
      }
    }
  })
})

// ── DEFAULT_MODEL_PRESET_ID ──────────────────────────────────────────────────

describe("DEFAULT_MODEL_PRESET_ID", () => {
  it('is "builtin-openai"', () => {
    expect(DEFAULT_MODEL_PRESET_ID).toBe("builtin-openai")
  })
})

// ── getBuiltInModelPresets ───────────────────────────────────────────────────

describe("getBuiltInModelPresets", () => {
  it("returns an array of ModelPresets", () => {
    const presets = getBuiltInModelPresets()
    expect(Array.isArray(presets)).toBe(true)
    expect(presets.length).toBeGreaterThan(0)
  })

  it('excludes the "custom" preset', () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every((p) => !p.id.includes("custom"))).toBe(true)
  })

  it("has isBuiltIn set to true for all", () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every((p) => p.isBuiltIn)).toBe(true)
  })

  it("has empty apiKey for all built-in presets", () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every((p) => p.apiKey === "")).toBe(true)
  })

  it('has IDs prefixed with "builtin-"', () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every((p) => p.id.startsWith("builtin-"))).toBe(true)
  })
})

// ── getCurrentPresetName ─────────────────────────────────────────────────────

describe("getCurrentPresetName", () => {
  it('returns "OpenAI" as default when no preset ID', () => {
    expect(getCurrentPresetName(undefined, undefined)).toBe("OpenAI")
  })

  it("returns built-in preset name for built-in ID", () => {
    expect(getCurrentPresetName("builtin-openai", undefined)).toBe("OpenAI")
  })

  it("returns custom preset name when found in user presets", () => {
    const userPresets: ModelPreset[] = [
      {
        id: "my-custom",
        name: "My Custom Provider",
        baseUrl: "https://example.com/v1",
      },
    ]
    expect(getCurrentPresetName("my-custom", userPresets)).toBe(
      "My Custom Provider",
    )
  })

  it("prefers merged built-in overrides over the built-in fallback name", () => {
    expect(
      getCurrentPresetName(DEFAULT_MODEL_PRESET_ID, [
        {
          id: DEFAULT_MODEL_PRESET_ID,
          name: "Work OpenAI",
          baseUrl: "https://api.openai.com/v1",
          isBuiltIn: true,
        },
      ]),
    ).toBe("Work OpenAI")
  })

  it('falls back to "OpenAI" for unknown preset ID', () => {
    expect(getCurrentPresetName("nonexistent", [])).toBe("OpenAI")
  })
})

describe("model preset resolution", () => {
  it("defaults the current preset ID to the built-in OpenAI preset", () => {
    expect(resolveModelPresetId({})).toBe(DEFAULT_MODEL_PRESET_ID)
  })

  it("merges built-in overrides, injects the legacy OpenAI key, and filters duplicate built-ins", () => {
    const presets = resolveModelPresets({
      openaiApiKey: "legacy-openai-key",
      modelPresets: [
        {
          id: DEFAULT_MODEL_PRESET_ID,
          name: "Work OpenAI",
          baseUrl: "https://api.openai.com/v1",
          apiKey: "",
          isBuiltIn: true,
        },
        {
          id: "builtin-openrouter",
          name: "Work OpenRouter",
          baseUrl: "https://openrouter.ai/api/v1",
          apiKey: "router-key",
        },
        {
          id: "custom-self-hosted",
          name: "Self Hosted",
          baseUrl: "https://llm.internal/v1",
          apiKey: "custom-key",
        },
      ],
    })

    expect(presets.filter((preset) => preset.id === DEFAULT_MODEL_PRESET_ID)).toHaveLength(1)
    expect(
      presets.find((preset) => preset.id === DEFAULT_MODEL_PRESET_ID),
    ).toMatchObject({
      name: "Work OpenAI",
      apiKey: "legacy-openai-key",
    })
    expect(
      presets.find((preset) => preset.id === "builtin-openrouter"),
    ).toMatchObject({
      name: "Work OpenRouter",
      apiKey: "router-key",
    })
    expect(
      presets.find((preset) => preset.id === "custom-self-hosted"),
    ).toMatchObject({
      name: "Self Hosted",
      apiKey: "custom-key",
    })
  })

  it("resolves a preset by explicit override before falling back to the current preset", () => {
    const config = {
      currentModelPresetId: "custom-default",
      modelPresets: [
        {
          id: "custom-default",
          name: "Default Custom",
          baseUrl: "https://default.example/v1",
        },
        {
          id: "custom-weak",
          name: "Weak Custom",
          baseUrl: "https://weak.example/v1",
        },
      ],
    }

    expect(resolveModelPreset(config)?.name).toBe("Default Custom")
    expect(resolveModelPreset(config, "custom-weak")?.name).toBe("Weak Custom")
  })
})

describe("chat model resolution", () => {
  const customPresets: ModelPreset[] = [
    {
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
    },
  ]

  it("resolves MCP provider/model defaults", () => {
    expect(resolveChatProviderId({}, "mcp")).toBe("openai")
    expect(resolveChatModelSelection({})).toEqual({
      providerId: "openai",
      model: "gpt-4.1-mini",
    })
  })

  it("resolves transcript provider/model defaults separately", () => {
    expect(resolveChatProviderId({}, "transcript")).toBe("openai")
    expect(resolveChatModelSelection({}, "transcript")).toEqual({
      providerId: "openai",
      model: "gpt-4.1-mini",
    })
  })

  it("preserves configured valid models", () => {
    expect(
      resolveChatModelSelection({
        mcpToolsProviderId: "groq",
        mcpToolsGroqModel: "openai/gpt-oss-120b",
      }),
    ).toEqual({
      providerId: "groq",
      model: "openai/gpt-oss-120b",
    })
  })

  it("supports explicit provider overrides when callers route outside the configured default", () => {
    expect(
      resolveChatModelSelection(
        {
          mcpToolsProviderId: "openai",
          mcpToolsGroqModel: "openai/gpt-oss-120b",
        },
        "mcp",
        "groq",
      ),
    ).toEqual({
      providerId: "groq",
      model: "openai/gpt-oss-120b",
    })
  })

  it("sanitizes transcription-only models back to chat defaults", () => {
    expect(isTranscriptionOnlyChatModel("openai", "gpt-4o-transcribe")).toBe(
      true,
    )
    expect(isTranscriptionOnlyChatModel("groq", "whisper-large-v3-turbo")).toBe(
      true,
    )
    expect(
      sanitizeConfiguredChatModel("openai", "gpt-4o-transcribe", "mcp"),
    ).toBe("gpt-4.1-mini")
    expect(
      resolveChatModelSelection(
        {
          transcriptPostProcessingProviderId: "groq",
          transcriptPostProcessingGroqModel: "whisper-large-v3-turbo",
        },
        "transcript",
      ),
    ).toEqual({
      providerId: "groq",
      model: "openai/gpt-oss-120b",
    })
  })

  it("uses preset display names for OpenAI-compatible MCP providers", () => {
    expect(
      getChatProviderDisplayName(
        {
          currentModelPresetId: "openrouter",
          modelPresets: customPresets,
        },
        "openai",
      ),
    ).toBe("OpenRouter")
    expect(
      resolveChatModelDisplayInfo({
        currentModelPresetId: "openrouter",
        modelPresets: customPresets,
        mcpToolsOpenaiModel: "gpt-4.1-mini",
      }),
    ).toEqual({
      providerId: "openai",
      model: "gpt-4.1-mini",
      providerDisplayName: "OpenRouter",
    })
  })

  it("uses merged built-in preset overrides for OpenAI-compatible MCP labels", () => {
    expect(
      getChatProviderDisplayName(
        {
          currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
          modelPresets: [
            {
              id: DEFAULT_MODEL_PRESET_ID,
              name: "Work OpenAI",
              baseUrl: "https://api.openai.com/v1",
            },
          ],
        },
        "openai",
      ),
    ).toBe("Work OpenAI")
  })

  it("uses canonical provider labels for non-OpenAI providers", () => {
    expect(getChatProviderDisplayName({}, "groq")).toBe("Groq")
    expect(getChatProviderDisplayName({}, "gemini")).toBe("Gemini")
  })
})

describe("tts selection resolution", () => {
  it("defaults to the OpenAI provider selection", () => {
    expect(resolveTtsProviderId({})).toBe("openai")
    expect(resolveTtsSelection({})).toEqual({
      providerId: "openai",
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      speed: 1,
    })
  })

  it("keeps configured OpenAI settings", () => {
    expect(
      resolveTtsSelection({
        ttsProviderId: "openai",
        openaiTtsModel: "tts-1",
        openaiTtsVoice: "nova",
        openaiTtsSpeed: 1.5,
      }),
    ).toEqual({
      providerId: "openai",
      model: "tts-1",
      voice: "nova",
      speed: 1.5,
    })
  })

  it("uses model-aware Groq voice defaults", () => {
    expect(resolveTtsSelection({ ttsProviderId: "groq" })).toEqual({
      providerId: "groq",
      model: "canopylabs/orpheus-v1-english",
      voice: "troy",
    })

    expect(
      resolveTtsSelection({
        ttsProviderId: "groq",
        groqTtsModel: "canopylabs/orpheus-arabic-saudi",
      }),
    ).toEqual({
      providerId: "groq",
      model: "canopylabs/orpheus-arabic-saudi",
      voice: "fahad",
    })
  })

  it("preserves configured Groq and Gemini voices", () => {
    expect(
      resolveTtsSelection({
        ttsProviderId: "groq",
        groqTtsModel: "canopylabs/orpheus-v1-english",
        groqTtsVoice: "autumn",
      }),
    ).toEqual({
      providerId: "groq",
      model: "canopylabs/orpheus-v1-english",
      voice: "autumn",
    })

    expect(
      resolveTtsSelection({
        ttsProviderId: "gemini",
        geminiTtsModel: "gemini-2.5-pro-preview-tts",
        geminiTtsVoice: "Aoede",
      }),
    ).toEqual({
      providerId: "gemini",
      model: "gemini-2.5-pro-preview-tts",
      voice: "Aoede",
    })
  })

  it("returns local provider defaults for Kitten and Supertonic", () => {
    expect(resolveTtsSelection({ ttsProviderId: "kitten" })).toEqual({
      providerId: "kitten",
      voiceId: 0,
    })

    expect(resolveTtsSelection({ ttsProviderId: "supertonic" })).toEqual({
      providerId: "supertonic",
      voice: "M1",
      language: "en",
      speed: 1.05,
      steps: 5,
    })
  })
})
