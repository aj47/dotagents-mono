import type { LocalSpeechModelStatus, TextToSpeechConfig } from "./api-types"
import {
  DEFAULT_EDGE_TTS_VOICE,
  SUPERTONIC_TTS_LANGUAGES,
  getTtsModelsForProvider,
  getTtsVoicesForProvider,
  getTtsModelSettingKey,
  getTtsVoiceSettingKey,
  type TtsVoiceSettingKey,
} from "./providers"

export type TextToSpeechSpeedSettingKey = "openaiTtsSpeed" | "edgeTtsRate" | "supertonicSpeed"

export type TextToSpeechSpeedSetting = {
  key: TextToSpeechSpeedSettingKey
  minimumValue: number
  maximumValue: number
  step: number
  defaultValue: number
  fractionDigits: number
}

export const TEXT_TO_SPEECH_SPEED_SETTING_KEYS = [
  "openaiTtsSpeed",
  "edgeTtsRate",
  "supertonicSpeed",
] as const

const DEFAULT_TTS_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini-tts",
  groq: "canopylabs/orpheus-v1-english",
  gemini: "gemini-2.5-flash-preview-tts",
  edge: "edge-tts",
}

const DEFAULT_TTS_VOICES: Record<string, string | number> = {
  openai: "alloy",
  groq: "troy",
  gemini: "Kore",
  edge: DEFAULT_EDGE_TTS_VOICE,
  kitten: 0,
  supertonic: "M1",
}

export const DEFAULT_SUPERTONIC_TTS_LANGUAGE = "en"
export const DEFAULT_SUPERTONIC_TTS_STEPS = 5
export const MIN_SUPERTONIC_TTS_STEPS = 2
export const MAX_SUPERTONIC_TTS_STEPS = 10
export const GROQ_ARABIC_TTS_MODEL = "canopylabs/orpheus-arabic-saudi"
export const DEFAULT_GROQ_ARABIC_TTS_VOICE = "fahad"

const TEXT_TO_SPEECH_SPEED_SETTINGS: Record<string, TextToSpeechSpeedSetting> = {
  openai: {
    key: "openaiTtsSpeed",
    minimumValue: 0.25,
    maximumValue: 4.0,
    step: 0.25,
    defaultValue: 1.0,
    fractionDigits: 1,
  },
  edge: {
    key: "edgeTtsRate",
    minimumValue: 0.5,
    maximumValue: 2.0,
    step: 0.1,
    defaultValue: 1.0,
    fractionDigits: 1,
  },
  supertonic: {
    key: "supertonicSpeed",
    minimumValue: 0.5,
    maximumValue: 2.0,
    step: 0.05,
    defaultValue: 1.05,
    fractionDigits: 2,
  },
}

const TEXT_TO_SPEECH_SPEED_SETTINGS_BY_KEY = Object.fromEntries(
  Object.values(TEXT_TO_SPEECH_SPEED_SETTINGS).map((setting) => [setting.key, setting]),
) as Record<TextToSpeechSpeedSettingKey, TextToSpeechSpeedSetting>

export function getTextToSpeechSpeedSetting(providerId?: string | null): TextToSpeechSpeedSetting | undefined {
  return TEXT_TO_SPEECH_SPEED_SETTINGS[providerId || "openai"]
}

export function getTextToSpeechModelDefault(providerId?: string | null): string | undefined {
  return DEFAULT_TTS_MODELS[providerId || "openai"]
}

export function getTextToSpeechVoiceDefault(
  providerId?: string | null,
  model?: string | null,
): string | number | undefined {
  if ((providerId || "openai") === "groq" && model === GROQ_ARABIC_TTS_MODEL) {
    return DEFAULT_GROQ_ARABIC_TTS_VOICE
  }
  return DEFAULT_TTS_VOICES[providerId || "openai"]
}

export function getTextToSpeechSpeedSettingByKey(
  key: TextToSpeechSpeedSettingKey,
): TextToSpeechSpeedSetting {
  return TEXT_TO_SPEECH_SPEED_SETTINGS_BY_KEY[key]
}

export function getTextToSpeechSpeedDefault(providerId?: string | null): number {
  return getTextToSpeechSpeedSetting(providerId)?.defaultValue ?? 1.0
}

export function isTextToSpeechSpeedUpdateValue(
  key: TextToSpeechSpeedSettingKey,
  value: unknown,
): value is number {
  const setting = getTextToSpeechSpeedSettingByKey(key)
  return typeof value === "number" && value >= setting.minimumValue && value <= setting.maximumValue
}

export function isTextToSpeechModelUpdateValue(
  providerId: string,
  value: unknown,
): value is string {
  return typeof value === "string" && getTtsModelsForProvider(providerId).some((model) => model.value === value)
}

export function isTextToSpeechVoiceUpdateValue(
  providerId: string,
  value: unknown,
  model?: string | null,
): value is string | number {
  return (typeof value === "string" || typeof value === "number")
    && getTtsVoicesForProvider(providerId, model ?? undefined).some((voice) => voice.value === value)
}

export function isSupertonicLanguageUpdateValue(value: unknown): value is string {
  return typeof value === "string" && SUPERTONIC_TTS_LANGUAGES.some((language) => language.value === value)
}

export function isSupertonicStepsUpdateValue(value: unknown): value is number {
  return Number.isInteger(value)
    && (value as number) >= MIN_SUPERTONIC_TTS_STEPS
    && (value as number) <= MAX_SUPERTONIC_TTS_STEPS
}

export function getTextToSpeechModelValue(settings?: TextToSpeechConfig | null): string | undefined {
  if (!settings) return undefined
  const key = getTtsModelSettingKey(settings.ttsProviderId || "openai")
  return key ? settings[key] : undefined
}

export function getTextToSpeechVoiceValue(settings?: TextToSpeechConfig | null): string | number | undefined {
  if (!settings) return undefined
  const key = getTtsVoiceSettingKey(settings.ttsProviderId || "openai")
  return key ? settings[key] : undefined
}

export function normalizeTextToSpeechVoiceUpdateValue(
  key: TtsVoiceSettingKey,
  value: string | number,
): string | number {
  return key === "kittenVoiceId" ? Number(value) : String(value)
}

export function getTextToSpeechSpeedValue(settings?: TextToSpeechConfig | null): number | undefined {
  if (!settings) return undefined
  const speedSetting = getTextToSpeechSpeedSetting(settings.ttsProviderId)
  return speedSetting ? settings[speedSetting.key] : undefined
}

export function getTextToSpeechPlaybackRate(settings?: TextToSpeechConfig | null): number {
  const speedSetting = getTextToSpeechSpeedSetting(settings?.ttsProviderId)
  const speed = getTextToSpeechSpeedValue(settings)
  if (speed !== undefined) return speed
  return speedSetting?.defaultValue ?? getTextToSpeechSpeedDefault()
}

export function formatLocalSpeechModelProgress(status?: LocalSpeechModelStatus): string {
  if (!status) return "Unknown"
  if (status.downloaded) return "Ready"
  if (status.downloading) return `Downloading ${Math.round((status.progress ?? 0) * 100)}%`
  if (status.error) return "Needs retry"
  return "Not installed"
}
