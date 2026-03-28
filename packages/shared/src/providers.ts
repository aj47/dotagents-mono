/**
 * Provider constants and types for DotAgents apps
 * These are platform-agnostic and can be used by both desktop and mobile.
 */

export interface ModelPreset {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  isBuiltIn?: boolean
  createdAt?: number
  updatedAt?: number
  mcpToolsModel?: string
  transcriptProcessingModel?: string
  /** Model for dual-model summarization (weak model) */
  summarizationModel?: string
}

export interface ModelPresetConfigLike {
  currentModelPresetId?: string
  modelPresets?: ModelPreset[]
  openaiApiKey?: string
}

export const STT_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
  { label: "Parakeet (Local)", value: "parakeet" },
] as const

export type STT_PROVIDER_ID = (typeof STT_PROVIDERS)[number]["value"]

export const CHAT_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
  { label: "Gemini", value: "gemini" },
] as const

export type CHAT_PROVIDER_ID = (typeof CHAT_PROVIDERS)[number]["value"]

export type ChatModelContext = "mcp" | "transcript"

export interface ChatModelConfigLike extends ModelPresetConfigLike {
  mcpToolsProviderId?: CHAT_PROVIDER_ID
  mcpToolsOpenaiModel?: string
  mcpToolsGroqModel?: string
  mcpToolsGeminiModel?: string
  transcriptPostProcessingProviderId?: CHAT_PROVIDER_ID
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
}

export const DEFAULT_CHAT_MODELS = {
  openai: {
    mcp: "gpt-4.1-mini",
    transcript: "gpt-4.1-mini",
  },
  groq: {
    mcp: "openai/gpt-oss-120b",
    transcript: "openai/gpt-oss-120b",
  },
  gemini: {
    mcp: "gemini-2.5-flash",
    transcript: "gemini-2.5-flash",
  },
} as const

const TRANSCRIPTION_ONLY_MODEL_PATTERNS: Partial<
  Record<CHAT_PROVIDER_ID, readonly string[]>
> = {
  openai: ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"],
  groq: [
    "whisper-large-v3",
    "whisper-large-v3-turbo",
    "distil-whisper-large-v3-en",
  ],
}

export const TTS_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
  { label: "Gemini", value: "gemini" },
  { label: "Kitten (Local)", value: "kitten" },
  { label: "Supertonic (Local)", value: "supertonic" },
] as const

export type TTS_PROVIDER_ID = (typeof TTS_PROVIDERS)[number]["value"]

export interface TtsConfigLike {
  ttsProviderId?: TTS_PROVIDER_ID
  openaiTtsModel?: string
  openaiTtsVoice?: string
  openaiTtsSpeed?: number
  groqTtsModel?: string
  groqTtsVoice?: string
  geminiTtsModel?: string
  geminiTtsVoice?: string
  kittenVoiceId?: number
  supertonicVoice?: string
  supertonicLanguage?: string
  supertonicSpeed?: number
  supertonicSteps?: number
}

const DEFAULT_TTS_PROVIDER_ID: TTS_PROVIDER_ID = "openai"

export const DEFAULT_TTS_SELECTION = {
  openai: {
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    speed: 1.0,
  },
  groq: {
    model: "canopylabs/orpheus-v1-english",
    englishVoice: "troy",
    arabicVoice: "fahad",
  },
  gemini: {
    model: "gemini-2.5-flash-preview-tts",
    voice: "Kore",
  },
  kitten: {
    voiceId: 0,
  },
  supertonic: {
    voice: "M1",
    language: "en",
    speed: 1.05,
    steps: 5,
  },
} as const

export type ResolvedTtsSelection =
  | {
      providerId: "openai"
      model: string
      voice: string
      speed: number
    }
  | {
      providerId: "groq"
      model: string
      voice: string
    }
  | {
      providerId: "gemini"
      model: string
      voice: string
    }
  | {
      providerId: "kitten"
      voiceId: number
    }
  | {
      providerId: "supertonic"
      voice: string
      language: string
      speed: number
      steps: number
    }

function normalizeConfiguredString(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function getDefaultGroqTtsVoice(model: string): string {
  return model === "canopylabs/orpheus-arabic-saudi"
    ? DEFAULT_TTS_SELECTION.groq.arabicVoice
    : DEFAULT_TTS_SELECTION.groq.englishVoice
}

export function resolveTtsProviderId(
  config: Pick<TtsConfigLike, "ttsProviderId">,
): TTS_PROVIDER_ID {
  return config.ttsProviderId || DEFAULT_TTS_PROVIDER_ID
}

export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride: "openai",
): Extract<ResolvedTtsSelection, { providerId: "openai" }>
export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride: "groq",
): Extract<ResolvedTtsSelection, { providerId: "groq" }>
export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride: "gemini",
): Extract<ResolvedTtsSelection, { providerId: "gemini" }>
export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride: "kitten",
): Extract<ResolvedTtsSelection, { providerId: "kitten" }>
export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride: "supertonic",
): Extract<ResolvedTtsSelection, { providerId: "supertonic" }>
export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride?: TTS_PROVIDER_ID,
): ResolvedTtsSelection
export function resolveTtsSelection(
  config: TtsConfigLike,
  providerIdOverride?: TTS_PROVIDER_ID,
): ResolvedTtsSelection {
  const providerId = providerIdOverride || resolveTtsProviderId(config)

  switch (providerId) {
    case "openai":
      return {
        providerId,
        model:
          normalizeConfiguredString(config.openaiTtsModel) ||
          DEFAULT_TTS_SELECTION.openai.model,
        voice:
          normalizeConfiguredString(config.openaiTtsVoice) ||
          DEFAULT_TTS_SELECTION.openai.voice,
        speed:
          typeof config.openaiTtsSpeed === "number"
            ? config.openaiTtsSpeed
            : DEFAULT_TTS_SELECTION.openai.speed,
      }

    case "groq": {
      const model =
        normalizeConfiguredString(config.groqTtsModel) ||
        DEFAULT_TTS_SELECTION.groq.model

      return {
        providerId,
        model,
        voice:
          normalizeConfiguredString(config.groqTtsVoice) ||
          getDefaultGroqTtsVoice(model),
      }
    }

    case "gemini":
      return {
        providerId,
        model:
          normalizeConfiguredString(config.geminiTtsModel) ||
          DEFAULT_TTS_SELECTION.gemini.model,
        voice:
          normalizeConfiguredString(config.geminiTtsVoice) ||
          DEFAULT_TTS_SELECTION.gemini.voice,
      }

    case "kitten":
      return {
        providerId,
        voiceId:
          typeof config.kittenVoiceId === "number"
            ? config.kittenVoiceId
            : DEFAULT_TTS_SELECTION.kitten.voiceId,
      }

    case "supertonic":
      return {
        providerId,
        voice:
          normalizeConfiguredString(config.supertonicVoice) ||
          DEFAULT_TTS_SELECTION.supertonic.voice,
        language:
          normalizeConfiguredString(config.supertonicLanguage) ||
          DEFAULT_TTS_SELECTION.supertonic.language,
        speed:
          typeof config.supertonicSpeed === "number"
            ? config.supertonicSpeed
            : DEFAULT_TTS_SELECTION.supertonic.speed,
        steps:
          typeof config.supertonicSteps === "number"
            ? config.supertonicSteps
            : DEFAULT_TTS_SELECTION.supertonic.steps,
      }
  }
}

// OpenAI TTS Voice Options
export const OPENAI_TTS_VOICES = [
  { label: "Alloy", value: "alloy" },
  { label: "Echo", value: "echo" },
  { label: "Fable", value: "fable" },
  { label: "Onyx", value: "onyx" },
  { label: "Nova", value: "nova" },
  { label: "Shimmer", value: "shimmer" },
] as const

export const OPENAI_TTS_MODELS = [
  { label: "GPT-4o Mini TTS", value: "gpt-4o-mini-tts" },
  { label: "TTS-1 (Standard)", value: "tts-1" },
  { label: "TTS-1-HD (High Quality)", value: "tts-1-hd" },
] as const

// Groq TTS Voice Options (English) - Orpheus model voices
export const GROQ_TTS_VOICES_ENGLISH = [
  { label: "Autumn", value: "autumn" },
  { label: "Diana", value: "diana" },
  { label: "Hannah", value: "hannah" },
  { label: "Austin", value: "austin" },
  { label: "Daniel", value: "daniel" },
  { label: "Troy", value: "troy" },
] as const

// Groq TTS Voice Options (Arabic Saudi) - Orpheus model voices
export const GROQ_TTS_VOICES_ARABIC = [
  { label: "Fahad", value: "fahad" },
  { label: "Sultan", value: "sultan" },
  { label: "Lulwa", value: "lulwa" },
  { label: "Noura", value: "noura" },
] as const

export const GROQ_TTS_MODELS = [
  { label: "Orpheus TTS (English)", value: "canopylabs/orpheus-v1-english" },
  {
    label: "Orpheus TTS (Arabic Saudi)",
    value: "canopylabs/orpheus-arabic-saudi",
  },
] as const

// Gemini TTS Voice Options (30 voices)
export const GEMINI_TTS_VOICES = [
  { label: "Zephyr (Bright)", value: "Zephyr" },
  { label: "Puck (Upbeat)", value: "Puck" },
  { label: "Charon (Informative)", value: "Charon" },
  { label: "Kore (Firm)", value: "Kore" },
  { label: "Fenrir (Excitable)", value: "Fenrir" },
  { label: "Leda (Young)", value: "Leda" },
  { label: "Orus (Corporate)", value: "Orus" },
  { label: "Aoede (Breezy)", value: "Aoede" },
  { label: "Callirrhoe (Casual)", value: "Callirrhoe" },
  { label: "Autonoe (Bright)", value: "Autonoe" },
  { label: "Enceladus (Breathy)", value: "Enceladus" },
  { label: "Iapetus (Clear)", value: "Iapetus" },
  { label: "Umbriel (Calm)", value: "Umbriel" },
  { label: "Algieba (Smooth)", value: "Algieba" },
  { label: "Despina (Smooth)", value: "Despina" },
  { label: "Erinome (Serene)", value: "Erinome" },
  { label: "Algenib (Gravelly)", value: "Algenib" },
  { label: "Rasalgethi (Informative)", value: "Rasalgethi" },
  { label: "Laomedeia (Upbeat)", value: "Laomedeia" },
  { label: "Achernar (Soft)", value: "Achernar" },
  { label: "Alnilam (Firm)", value: "Alnilam" },
  { label: "Schedar (Even)", value: "Schedar" },
  { label: "Gacrux (Mature)", value: "Gacrux" },
  { label: "Pulcherrima (Forward)", value: "Pulcherrima" },
  { label: "Achird (Friendly)", value: "Achird" },
  { label: "Zubenelgenubi (Casual)", value: "Zubenelgenubi" },
  { label: "Vindemiatrix (Gentle)", value: "Vindemiatrix" },
  { label: "Sadachbia (Lively)", value: "Sadachbia" },
  { label: "Sadaltager (Knowledgeable)", value: "Sadaltager" },
  { label: "Sulafat (Warm)", value: "Sulafat" },
] as const

export const GEMINI_TTS_MODELS = [
  { label: "Gemini 2.5 Flash TTS", value: "gemini-2.5-flash-preview-tts" },
  { label: "Gemini 2.5 Pro TTS", value: "gemini-2.5-pro-preview-tts" },
] as const

// Kitten TTS Voice Options (8 voices, sid 0-7)
export const KITTEN_TTS_VOICES = [
  { label: "Voice 2 - Male (Default)", value: 0 },
  { label: "Voice 2 - Female", value: 1 },
  { label: "Voice 3 - Male", value: 2 },
  { label: "Voice 3 - Female", value: 3 },
  { label: "Voice 4 - Male", value: 4 },
  { label: "Voice 4 - Female", value: 5 },
  { label: "Voice 5 - Male", value: 6 },
  { label: "Voice 5 - Female", value: 7 },
] as const

// Supertonic TTS Voice Options (10 voices: 5 male + 5 female)
export const SUPERTONIC_TTS_VOICES = [
  { label: "Male 1 (M1)", value: "M1" },
  { label: "Male 2 (M2)", value: "M2" },
  { label: "Male 3 (M3)", value: "M3" },
  { label: "Male 4 (M4)", value: "M4" },
  { label: "Male 5 (M5)", value: "M5" },
  { label: "Female 1 (F1)", value: "F1" },
  { label: "Female 2 (F2)", value: "F2" },
  { label: "Female 3 (F3)", value: "F3" },
  { label: "Female 4 (F4)", value: "F4" },
  { label: "Female 5 (F5)", value: "F5" },
] as const

// Supertonic TTS Language Options
export const SUPERTONIC_TTS_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Korean", value: "ko" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "French", value: "fr" },
] as const

// OpenAI Compatible Provider Presets
export const OPENAI_COMPATIBLE_PRESETS = [
  {
    label: "OpenAI",
    value: "openai",
    description: "Official OpenAI API",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    label: "OpenRouter",
    value: "openrouter",
    description: "Access to multiple AI models via OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    label: "Together AI",
    value: "together",
    description: "Together AI's inference platform",
    baseUrl: "https://api.together.xyz/v1",
  },
  {
    label: "Cerebras",
    value: "cerebras",
    description: "Cerebras fast inference API",
    baseUrl: "https://api.cerebras.ai/v1",
  },
  {
    label: "Zhipu GLM",
    value: "zhipu",
    description: "Zhipu AI GLM models (China)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  },
  {
    label: "Perplexity",
    value: "perplexity",
    description: "Perplexity's AI models",
    baseUrl: "https://api.perplexity.ai",
  },
  {
    label: "Custom",
    value: "custom",
    description: "Enter your own base URL",
    baseUrl: "",
  },
] as const

export type OPENAI_COMPATIBLE_PRESET_ID =
  (typeof OPENAI_COMPATIBLE_PRESETS)[number]["value"]

// Default preset ID
export const DEFAULT_MODEL_PRESET_ID = "builtin-openai"

// Helper to get built-in presets as ModelPreset objects (without API keys)
export const getBuiltInModelPresets = (): ModelPreset[] => {
  return OPENAI_COMPATIBLE_PRESETS.filter((p) => p.value !== "custom").map(
    (preset) => ({
      id: `builtin-${preset.value}`,
      name: preset.label,
      baseUrl: preset.baseUrl,
      apiKey: "",
      isBuiltIn: true,
    }),
  )
}

function mergeModelPreset(
  basePreset: ModelPreset,
  savedOverride?: ModelPreset,
): ModelPreset {
  if (!savedOverride) {
    return basePreset
  }

  return {
    ...basePreset,
    ...Object.fromEntries(
      Object.entries(savedOverride).filter(([, value]) => value !== undefined),
    ),
  }
}

export function resolveModelPresetId(
  config: Pick<ModelPresetConfigLike, "currentModelPresetId"> = {},
): string {
  return config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
}

export function resolveModelPresets(
  config: Pick<ModelPresetConfigLike, "modelPresets" | "openaiApiKey"> = {},
): ModelPreset[] {
  const builtInPresets = getBuiltInModelPresets()
  const savedPresets = config.modelPresets || []
  const savedPresetsById = new Map(savedPresets.map((preset) => [preset.id, preset]))
  const builtInIds = new Set(builtInPresets.map((preset) => preset.id))

  const mergedBuiltInPresets = builtInPresets.map((builtInPreset) => {
    const mergedPreset = mergeModelPreset(
      builtInPreset,
      savedPresetsById.get(builtInPreset.id),
    )

    if (
      builtInPreset.id === DEFAULT_MODEL_PRESET_ID &&
      !mergedPreset.apiKey &&
      config.openaiApiKey
    ) {
      return { ...mergedPreset, apiKey: config.openaiApiKey }
    }

    return mergedPreset
  })

  const customPresets = savedPresets.filter((preset) => !builtInIds.has(preset.id))
  return [...mergedBuiltInPresets, ...customPresets]
}

export function resolveModelPreset(
  config: ModelPresetConfigLike,
  presetIdOverride?: string,
): ModelPreset | undefined {
  const presetId = presetIdOverride || resolveModelPresetId(config)
  return resolveModelPresets(config).find((preset) => preset.id === presetId)
}

/**
 * Get the current preset display name from config.
 * Looks up the preset by ID and returns its name.
 */
export const getCurrentPresetName = (
  currentModelPresetId: string | undefined,
  modelPresets: ModelPreset[] | undefined,
  openaiApiKey?: string,
): string => {
  return (
    resolveModelPreset(
      {
        currentModelPresetId,
        modelPresets,
        openaiApiKey,
      },
    )?.name || "OpenAI"
  )
}

function getConfiguredChatModel(
  config: ChatModelConfigLike,
  providerId: CHAT_PROVIDER_ID,
  modelContext: ChatModelContext,
): string | undefined {
  if (modelContext === "transcript") {
    if (providerId === "openai")
      return config.transcriptPostProcessingOpenaiModel
    if (providerId === "groq") return config.transcriptPostProcessingGroqModel
    return config.transcriptPostProcessingGeminiModel
  }

  if (providerId === "openai") return config.mcpToolsOpenaiModel
  if (providerId === "groq") return config.mcpToolsGroqModel
  return config.mcpToolsGeminiModel
}

export function resolveChatProviderId(
  config: ChatModelConfigLike,
  modelContext: ChatModelContext = "mcp",
): CHAT_PROVIDER_ID {
  return modelContext === "transcript"
    ? config.transcriptPostProcessingProviderId || "openai"
    : config.mcpToolsProviderId || "openai"
}

export function isTranscriptionOnlyChatModel(
  providerId: CHAT_PROVIDER_ID,
  model: string,
): boolean {
  const patterns = TRANSCRIPTION_ONLY_MODEL_PATTERNS[providerId]
  if (!patterns) {
    return false
  }

  const normalizedModel = model.trim().toLowerCase()
  return patterns.some((pattern) => normalizedModel.includes(pattern))
}

export function sanitizeConfiguredChatModel(
  providerId: CHAT_PROVIDER_ID,
  model: string,
  modelContext: ChatModelContext,
): string {
  if (!isTranscriptionOnlyChatModel(providerId, model)) {
    return model
  }

  return DEFAULT_CHAT_MODELS[providerId][modelContext]
}

export function resolveChatModelSelection(
  config: ChatModelConfigLike,
  modelContext: ChatModelContext = "mcp",
  providerIdOverride?: CHAT_PROVIDER_ID,
): { providerId: CHAT_PROVIDER_ID; model: string } {
  const providerId =
    providerIdOverride || resolveChatProviderId(config, modelContext)
  const configuredModel =
    getConfiguredChatModel(config, providerId, modelContext) ||
    DEFAULT_CHAT_MODELS[providerId][modelContext]

  return {
    providerId,
    model: sanitizeConfiguredChatModel(
      providerId,
      configuredModel,
      modelContext,
    ),
  }
}

export function getChatProviderDisplayName(
  config: ChatModelConfigLike,
  providerId: CHAT_PROVIDER_ID,
  modelContext: ChatModelContext = "mcp",
): string {
  if (providerId === "openai") {
    return modelContext === "mcp"
      ? getCurrentPresetName(config.currentModelPresetId, config.modelPresets)
      : "OpenAI"
  }

  if (providerId === "groq") {
    return "Groq"
  }

  return "Gemini"
}

export function resolveChatModelDisplayInfo(
  config: ChatModelConfigLike,
  modelContext: ChatModelContext = "mcp",
  providerIdOverride?: CHAT_PROVIDER_ID,
): {
  providerId: CHAT_PROVIDER_ID
  model: string
  providerDisplayName: string
} {
  const { providerId, model } = resolveChatModelSelection(
    config,
    modelContext,
    providerIdOverride,
  )
  return {
    providerId,
    model,
    providerDisplayName: getChatProviderDisplayName(
      config,
      providerId,
      modelContext,
    ),
  }
}
