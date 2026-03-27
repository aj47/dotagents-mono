export const DEFAULT_STT_MODELS = {
  openai: "whisper-1",
  groq: "whisper-large-v3-turbo",
} as const

export const KNOWN_STT_MODEL_IDS = {
  openai: ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"],
  groq: ["whisper-large-v3", "whisper-large-v3-turbo", "distil-whisper-large-v3-en"],
} as const

export type CloudSttProviderId = keyof typeof DEFAULT_STT_MODELS

export function isCloudSttProvider(providerId?: string): providerId is CloudSttProviderId {
  return providerId === "openai" || providerId === "groq"
}

export function isKnownSttModel(providerId: CloudSttProviderId, modelId: string): boolean {
  const normalizedModelId = modelId.trim().toLowerCase()
  return KNOWN_STT_MODEL_IDS[providerId].some(candidate => normalizedModelId.includes(candidate))
}

export function getDefaultSttModel(providerId?: string): string | undefined {
  if (!isCloudSttProvider(providerId)) {
    return undefined
  }

  return DEFAULT_STT_MODELS[providerId]
}

/** Minimal config shape needed for STT model resolution */
interface SttModelConfig {
  sttProviderId?: string
  openaiSttModel?: string
  groqSttModel?: string
}

export function getConfiguredSttModel(
  config: SttModelConfig,
): string | undefined {
  if (config.sttProviderId === "openai") {
    return config.openaiSttModel?.trim() || DEFAULT_STT_MODELS.openai
  }

  if (config.sttProviderId === "groq") {
    return config.groqSttModel?.trim() || DEFAULT_STT_MODELS.groq
  }

  return undefined
}
