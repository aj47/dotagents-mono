import type { LocalSpeechModelStatus, TextToSpeechConfig } from "./api-types"
import {
  getTtsModelSettingKey,
  getTtsVoiceSettingKey,
  type TtsVoiceSettingKey,
} from "./providers"

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
  if (settings.ttsProviderId === "openai") return settings.openaiTtsSpeed
  if (settings.ttsProviderId === "edge") return settings.edgeTtsRate
  if (settings.ttsProviderId === "supertonic") return settings.supertonicSpeed
  return undefined
}

export function formatLocalSpeechModelProgress(status?: LocalSpeechModelStatus): string {
  if (!status) return "Unknown"
  if (status.downloaded) return "Ready"
  if (status.downloading) return `Downloading ${Math.round((status.progress ?? 0) * 100)}%`
  if (status.error) return "Needs retry"
  return "Not installed"
}
