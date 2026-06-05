import { DEFAULT_STT_MODELS, getConfiguredSttModel } from "@dotagents/shared"
import type { Config } from "../shared/types"
import { logLLM } from "./debug"
import { postProcessTranscript } from "./llm"

export type SttProviderId = "openai" | "groq" | "parakeet"

export type TranscribeAudioInput = {
  audio: Buffer
  mimeType?: string
  fileName?: string
  durationMs?: number
}

export type TranscribeAudioResult = {
  text: string
  provider: SttProviderId
  model?: string
}

const DEFAULT_AUDIO_MIME_TYPE = "audio/m4a"

function getEffectiveSttProvider(config: Config): SttProviderId {
  if (config.sttProviderId === "groq") return "groq"
  if (config.sttProviderId === "parakeet") return "parakeet"
  return "openai"
}

function getRemoteSttModel(config: Config, provider: SttProviderId): string {
  if (provider === "groq") {
    return getConfiguredSttModel(config) || DEFAULT_STT_MODELS.groq
  }

  return getConfiguredSttModel(config) || DEFAULT_STT_MODELS.openai
}

function getFileExtensionForMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(";", 1)[0]?.trim()
  if (normalized === "audio/webm") return "webm"
  if (normalized === "audio/mp4" || normalized === "audio/m4a" || normalized === "audio/x-m4a") return "m4a"
  if (normalized === "audio/mpeg" || normalized === "audio/mp3") return "mp3"
  if (normalized === "audio/wav" || normalized === "audio/wave" || normalized === "audio/x-wav") return "wav"
  if (normalized === "audio/aac") return "aac"
  if (normalized === "audio/ogg") return "ogg"
  return "m4a"
}

function getSafeAudioFileName(fileName: string | undefined, mimeType: string): string {
  const sanitized = fileName?.trim().replace(/[^a-zA-Z0-9._-]/g, "_")
  if (sanitized && /\.[a-z0-9]+$/i.test(sanitized)) {
    return sanitized
  }

  const extension = getFileExtensionForMimeType(mimeType)
  return `${sanitized || "mobile-recording"}.${extension}`
}

async function postProcessTranscriptSafely(
  transcript: string,
  config: Config,
  context: string,
): Promise<string> {
  if (!config.transcriptPostProcessingEnabled) {
    return transcript
  }

  try {
    return await postProcessTranscript(transcript)
  } catch (error) {
    logLLM(`[${context}] Transcript post-processing failed, using raw transcript instead:`, error)
    return transcript
  }
}

function getLanguageCode(config: Config, provider: SttProviderId): string | undefined {
  if (provider === "groq") {
    return config.groqSttLanguage || config.sttLanguage
  }

  if (provider === "openai") {
    return config.openaiSttLanguage || config.sttLanguage
  }

  return undefined
}

export async function transcribeAudioWithConfiguredProvider(
  input: TranscribeAudioInput,
  config: Config,
  options: { postProcess?: boolean; context?: string } = {},
): Promise<TranscribeAudioResult> {
  if (!input.audio.length) {
    throw new Error("Audio payload is empty")
  }

  const provider = getEffectiveSttProvider(config)
  if (provider === "parakeet") {
    throw new Error("Parakeet STT requires decoded PCM audio and is not available for mobile audio uploads. Choose OpenAI or Groq for mobile transcription.")
  }

  const model = getRemoteSttModel(config, provider)
  const apiKey = provider === "groq" ? config.groqApiKey : config.openaiApiKey
  if (!apiKey) {
    throw new Error(`${provider === "groq" ? "Groq" : "OpenAI"} API key is required for speech-to-text`)
  }

  const mimeType = input.mimeType?.trim() || DEFAULT_AUDIO_MIME_TYPE
  const fileName = getSafeAudioFileName(input.fileName, mimeType)
  const form = new FormData()
  const audioArrayBuffer = input.audio.buffer.slice(
    input.audio.byteOffset,
    input.audio.byteOffset + input.audio.byteLength,
  ) as ArrayBuffer

  form.append("file", new File([audioArrayBuffer], fileName, { type: mimeType }))
  form.append("model", model)
  form.append("response_format", "json")

  if (provider === "groq" && config.groqSttPrompt?.trim()) {
    form.append("prompt", config.groqSttPrompt.trim())
  }

  const languageCode = getLanguageCode(config, provider)
  if (languageCode && languageCode !== "auto") {
    form.append("language", languageCode)
  }

  const baseUrl = provider === "groq"
    ? config.groqBaseUrl || "https://api.groq.com/openai/v1"
    : config.openaiBaseUrl || "https://api.openai.com/v1"

  const transcriptResponse = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!transcriptResponse.ok) {
    const message = `${transcriptResponse.statusText} ${(await transcriptResponse.text()).slice(0, 300)}`
    throw new Error(message)
  }

  const json: { text?: string } = await transcriptResponse.json()
  const rawText = json.text || ""
  const text = options.postProcess === false
    ? rawText
    : await postProcessTranscriptSafely(rawText, config, options.context || "stt-service")

  return {
    text,
    provider,
    model,
  }
}
