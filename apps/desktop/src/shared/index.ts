/**
 * Re-exports from @dotagents/shared
 * This file acts as a barrel to maintain backwards compatibility.
 * All provider constants, types, and helpers are now in the shared package.
 */

import { ModelPreset } from "./types"
import { OPENAI_COMPATIBLE_PRESETS, DEFAULT_MODEL_PRESET_ID } from '@dotagents/shared'

// Re-export all provider constants and types from shared package
export {
  STT_PROVIDERS,
  CHAT_PROVIDERS,
  TTS_PROVIDERS,
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
  providerHasTts,
  getTtsModelsForProvider,
  getTtsVoicesForProvider,
} from '@dotagents/shared'

export type {
  STT_PROVIDER_ID,
  CHAT_PROVIDER_ID,
  TTS_PROVIDER_ID,
  OPENAI_COMPATIBLE_PRESET_ID,
} from '@dotagents/shared'

// Desktop-specific implementations that use desktop's ModelPreset type (with required apiKey)
// Note: The shared package's ModelPreset has optional apiKey, but desktop requires it

/**
 * Get built-in presets as ModelPreset objects (without API keys)
 * Uses desktop's ModelPreset type which requires apiKey to be present (as empty string)
 */
export const getBuiltInModelPresets = (): ModelPreset[] => {
  return OPENAI_COMPATIBLE_PRESETS.filter(p => p.value !== "custom").map(preset => ({
    id: `builtin-${preset.value}`,
    name: preset.label,
    baseUrl: preset.baseUrl,
    apiKey: "", // API key should be filled by user
    isBuiltIn: true,
  }))
}

/**
 * Get the current preset display name from config.
 * Looks up the preset by ID and returns its name.
 */
export const getCurrentPresetName = (
  currentModelPresetId: string | undefined,
  modelPresets: ModelPreset[] | undefined
): string => {
  const presetId = currentModelPresetId || DEFAULT_MODEL_PRESET_ID
  const allPresets = [...getBuiltInModelPresets(), ...(modelPresets || [])]
  return allPresets.find(p => p.id === presetId)?.name || "OpenAI"
}
