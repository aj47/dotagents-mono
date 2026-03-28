import type { STT_PROVIDER_ID } from "./providers"

export const DEFAULT_STT_MODELS = {
  openai: "whisper-1",
  groq: "whisper-large-v3-turbo",
} as const

export const KNOWN_STT_MODEL_IDS = {
  openai: ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"],
  groq: [
    "whisper-large-v3",
    "whisper-large-v3-turbo",
    "distil-whisper-large-v3-en",
  ],
} as const

type CloudSttProviderId = keyof typeof DEFAULT_STT_MODELS

const DEFAULT_STT_PROVIDER_ID: STT_PROVIDER_ID = "openai"

function isCloudSttProvider(
  providerId?: string,
): providerId is CloudSttProviderId {
  return providerId === "openai" || providerId === "groq"
}

export function isKnownSttModel(
  providerId: CloudSttProviderId,
  modelId: string,
): boolean {
  const normalizedModelId = modelId.trim().toLowerCase()
  return KNOWN_STT_MODEL_IDS[providerId].some((candidate) =>
    normalizedModelId.includes(candidate),
  )
}

export function getDefaultSttModel(providerId?: string): string | undefined {
  if (!isCloudSttProvider(providerId)) {
    return undefined
  }

  return DEFAULT_STT_MODELS[providerId]
}

/** Minimal config shape needed for STT model resolution */
export interface SttModelConfigLike {
  sttProviderId?: STT_PROVIDER_ID
  openaiSttModel?: string
  groqSttModel?: string
}

export function resolveSttProviderId(
  config: Pick<SttModelConfigLike, "sttProviderId">,
): STT_PROVIDER_ID {
  return config.sttProviderId || DEFAULT_STT_PROVIDER_ID
}

export function getConfiguredSttModel(
  config: SttModelConfigLike,
): string | undefined {
  if (config.sttProviderId === "openai") {
    return config.openaiSttModel?.trim() || DEFAULT_STT_MODELS.openai
  }

  if (config.sttProviderId === "groq") {
    return config.groqSttModel?.trim() || DEFAULT_STT_MODELS.groq
  }

  return undefined
}

export function resolveSttModelSelection(
  config: SttModelConfigLike,
  providerIdOverride?: STT_PROVIDER_ID,
): {
  providerId: STT_PROVIDER_ID
  model: string | undefined
} {
  const providerId = providerIdOverride || resolveSttProviderId(config)

  return {
    providerId,
    model: getConfiguredSttModel({
      ...config,
      sttProviderId: providerId,
    }),
  }
}
