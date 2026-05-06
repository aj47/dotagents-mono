import { describe, it, expect } from 'vitest'
import {
  STT_PROVIDERS,
  CHAT_PROVIDERS,
  CHAT_PROVIDER_IDS,
  DEFAULT_CHAT_MODELS,
  TTS_PROVIDERS,
  OPENAI_TTS_VOICES,
  OPENAI_TTS_MODELS,
  GROQ_TTS_VOICES_ENGLISH,
  GROQ_TTS_VOICES_ARABIC,
  GROQ_TTS_MODELS,
  GEMINI_TTS_VOICES,
  GEMINI_TTS_MODELS,
  EDGE_TTS_VOICES,
  EDGE_TTS_MODELS,
  DEFAULT_EDGE_TTS_VOICE,
  KITTEN_TTS_VOICES,
  SUPERTONIC_TTS_VOICES,
  SUPERTONIC_TTS_LANGUAGES,
  OPENAI_COMPATIBLE_PRESETS,
  DEFAULT_MODEL_PRESET_ID,
  getTtsModelSettingKey,
  getTtsModelsForProvider,
  getTtsVoiceSettingKey,
  getTtsVoicesForProvider,
  getTranscriptPostProcessingModelSettingKey,
  getBuiltInModelPresets,
  getCurrentPresetName,
  isChatGptWebOnlyModel,
  isChatProviderId,
  isTranscriptionOnlyChatModel,
  migrateDeprecatedEdgeTtsVoice,
  normalizeChatProviderId,
  resolveChatModelForTextUsage,
  resolveEdgeTtsVoice,
} from './providers'
import type { ModelPreset } from './providers'

// ── Provider Constants ───────────────────────────────────────────────────────

describe('STT_PROVIDERS', () => {
  it('includes openai, groq, and parakeet', () => {
    const values = STT_PROVIDERS.map(p => p.value)
    expect(values).toContain('openai')
    expect(values).toContain('groq')
    expect(values).toContain('parakeet')
  })

  it('each has a label and value', () => {
    for (const provider of STT_PROVIDERS) {
      expect(provider.label).toBeTruthy()
      expect(provider.value).toBeTruthy()
    }
  })
})

describe('CHAT_PROVIDERS', () => {
  it('includes openai, groq, gemini, and the OpenAI Codex provider id', () => {
    const values = CHAT_PROVIDERS.map(p => p.value)
    expect(values).toContain('openai')
    expect(values).toContain('groq')
    expect(values).toContain('gemini')
    expect(values).toContain('chatgpt-web')
  })

  it('exports shared chat provider ids and validation', () => {
    expect(CHAT_PROVIDER_IDS).toEqual(['openai', 'groq', 'gemini', 'chatgpt-web'])
    expect(isChatProviderId('openai')).toBe(true)
    expect(isChatProviderId('chatgpt-web')).toBe(true)
    expect(isChatProviderId('edge')).toBe(false)
    expect(isChatProviderId(undefined)).toBe(false)
    expect(normalizeChatProviderId(' OpenAI ')).toBe('openai')
    expect(() => normalizeChatProviderId('edge')).toThrow('Unknown provider: edge')
  })

  it('keeps shared chat model defaults and text-usage sanitization rules', () => {
    expect(DEFAULT_CHAT_MODELS.openai.mcp).toBe('gpt-4.1-mini')
    expect(isTranscriptionOnlyChatModel('openai', 'gpt-4o-transcribe')).toBe(true)
    expect(isTranscriptionOnlyChatModel('groq', 'distil-whisper-large-v3-en')).toBe(true)
    expect(isTranscriptionOnlyChatModel('gemini', 'gemini-2.5-flash')).toBe(false)
    expect(isChatGptWebOnlyModel('gpt-5.3-codex-spark')).toBe(true)
    expect(isChatGptWebOnlyModel('gpt-4.1-mini')).toBe(false)
    expect(resolveChatModelForTextUsage('openai', 'gpt-4o-mini-transcribe', 'transcript')).toEqual({
      model: 'gpt-4.1-mini',
      reason: 'transcription-only',
      fallbackModel: 'gpt-4.1-mini',
    })
    expect(resolveChatModelForTextUsage('groq', 'gpt-5.3-codex', 'mcp')).toEqual({
      model: 'openai/gpt-oss-120b',
      reason: 'chatgpt-web-only',
      fallbackModel: 'openai/gpt-oss-120b',
    })
    expect(resolveChatModelForTextUsage('chatgpt-web', 'gpt-5.3-codex', 'mcp')).toEqual({
      model: 'gpt-5.3-codex',
    })
  })
})

describe('TTS_PROVIDERS', () => {
  it('includes cloud and local providers', () => {
    const values = TTS_PROVIDERS.map(p => p.value)
    expect(values).toContain('openai')
    expect(values).toContain('groq')
    expect(values).toContain('gemini')
    expect(values).toContain('edge')
    expect(values).toContain('kitten')
    expect(values).toContain('supertonic')
  })
})

// ── Voice Lists ──────────────────────────────────────────────────────────────

describe('Voice lists', () => {
  it('OPENAI_TTS_VOICES has 6 voices', () => {
    expect(OPENAI_TTS_VOICES).toHaveLength(6)
    expect(OPENAI_TTS_VOICES.map(v => v.value)).toContain('alloy')
  })

  it('GROQ_TTS_VOICES_ENGLISH has 6 voices', () => {
    expect(GROQ_TTS_VOICES_ENGLISH).toHaveLength(6)
  })

  it('GROQ_TTS_VOICES_ARABIC has 4 voices', () => {
    expect(GROQ_TTS_VOICES_ARABIC).toHaveLength(4)
  })

  it('GEMINI_TTS_VOICES has 30 voices', () => {
    expect(GEMINI_TTS_VOICES).toHaveLength(30)
  })

  it('KITTEN_TTS_VOICES has 8 voices', () => {
    expect(KITTEN_TTS_VOICES).toHaveLength(8)
  })

  it('EDGE_TTS_VOICES includes supported mobile/desktop voices and fallback helpers', () => {
    expect(EDGE_TTS_VOICES.length).toBeGreaterThanOrEqual(6)
    expect(EDGE_TTS_VOICES.map(v => v.value)).toContain('en-US-AriaNeural')
    expect(EDGE_TTS_VOICES.map(v => v.value)).toContain('en-US-BrianNeural')
    expect(resolveEdgeTtsVoice('en-GB-SoniaNeural')).toBe('en-GB-SoniaNeural')
    expect(resolveEdgeTtsVoice('en-US-DavisNeural')).toBe(DEFAULT_EDGE_TTS_VOICE)
    expect(migrateDeprecatedEdgeTtsVoice('en-US-DavisNeural')).toBe(DEFAULT_EDGE_TTS_VOICE)
    expect(migrateDeprecatedEdgeTtsVoice('custom-voice')).toBe('custom-voice')
  })

  it('SUPERTONIC_TTS_VOICES has 10 voices (5 male + 5 female)', () => {
    expect(SUPERTONIC_TTS_VOICES).toHaveLength(10)
    const maleVoices = SUPERTONIC_TTS_VOICES.filter(v => String(v.value).startsWith('M'))
    const femaleVoices = SUPERTONIC_TTS_VOICES.filter(v => String(v.value).startsWith('F'))
    expect(maleVoices).toHaveLength(5)
    expect(femaleVoices).toHaveLength(5)
  })

  it('SUPERTONIC_TTS_LANGUAGES includes expected languages', () => {
    const values = SUPERTONIC_TTS_LANGUAGES.map(l => l.value)
    expect(values).toContain('en')
    expect(values).toContain('ko')
    expect(values).toContain('es')
  })

  it('returns TTS model and voice options by provider', () => {
    expect(getTtsModelsForProvider('openai')).toBe(OPENAI_TTS_MODELS)
    expect(getTtsModelsForProvider('kitten')).toEqual([])
    expect(getTtsVoicesForProvider('groq', 'canopylabs/orpheus-arabic-saudi')).toBe(GROQ_TTS_VOICES_ARABIC)
    expect(getTtsVoicesForProvider('groq', 'canopylabs/orpheus-v1-english')).toBe(GROQ_TTS_VOICES_ENGLISH)
    expect(getTtsVoicesForProvider('kitten')).toBe(KITTEN_TTS_VOICES)
    expect(getTtsVoicesForProvider('supertonic')).toBe(SUPERTONIC_TTS_VOICES)
  })

  it('maps TTS providers to settings keys', () => {
    expect(getTtsModelSettingKey('edge')).toBe('edgeTtsModel')
    expect(getTtsModelSettingKey('supertonic')).toBeUndefined()
    expect(getTtsVoiceSettingKey('kitten')).toBe('kittenVoiceId')
    expect(getTtsVoiceSettingKey('supertonic')).toBe('supertonicVoice')
    expect(getTtsVoiceSettingKey('unknown')).toBeUndefined()
  })

  it('maps transcript post-processing providers to settings keys', () => {
    expect(getTranscriptPostProcessingModelSettingKey('openai')).toBe('transcriptPostProcessingOpenaiModel')
    expect(getTranscriptPostProcessingModelSettingKey('groq')).toBe('transcriptPostProcessingGroqModel')
    expect(getTranscriptPostProcessingModelSettingKey('gemini')).toBe('transcriptPostProcessingGeminiModel')
    expect(getTranscriptPostProcessingModelSettingKey('chatgpt-web')).toBe('transcriptPostProcessingChatgptWebModel')
    expect(getTranscriptPostProcessingModelSettingKey('unknown')).toBeUndefined()
  })
})

// ── TTS Models ───────────────────────────────────────────────────────────────

describe('TTS Models', () => {
  it('OPENAI_TTS_MODELS has 3 models', () => {
    expect(OPENAI_TTS_MODELS).toHaveLength(3)
    expect(OPENAI_TTS_MODELS.map(m => m.value)).toContain('tts-1')
  })

  it('GROQ_TTS_MODELS has 2 models', () => {
    expect(GROQ_TTS_MODELS).toHaveLength(2)
  })

  it('GEMINI_TTS_MODELS has 2 models', () => {
    expect(GEMINI_TTS_MODELS).toHaveLength(2)
  })

  it('EDGE_TTS_MODELS has 1 model', () => {
    expect(EDGE_TTS_MODELS).toHaveLength(1)
    expect(EDGE_TTS_MODELS[0].value).toBe('edge-tts')
  })
})

// ── OPENAI_COMPATIBLE_PRESETS ────────────────────────────────────────────────

describe('OPENAI_COMPATIBLE_PRESETS', () => {
  it('includes OpenAI, OpenRouter, Together, and Custom', () => {
    const values = OPENAI_COMPATIBLE_PRESETS.map(p => p.value)
    expect(values).toContain('openai')
    expect(values).toContain('openrouter')
    expect(values).toContain('together')
    expect(values).toContain('custom')
  })

  it('custom preset has empty baseUrl', () => {
    const custom = OPENAI_COMPATIBLE_PRESETS.find(p => p.value === 'custom')
    expect(custom?.baseUrl).toBe('')
  })

  it('non-custom presets have baseUrl', () => {
    for (const preset of OPENAI_COMPATIBLE_PRESETS) {
      if (preset.value !== 'custom') {
        expect(preset.baseUrl).toBeTruthy()
      }
    }
  })
})

// ── DEFAULT_MODEL_PRESET_ID ──────────────────────────────────────────────────

describe('DEFAULT_MODEL_PRESET_ID', () => {
  it('is "builtin-openai"', () => {
    expect(DEFAULT_MODEL_PRESET_ID).toBe('builtin-openai')
  })
})

// ── getBuiltInModelPresets ───────────────────────────────────────────────────

describe('getBuiltInModelPresets', () => {
  it('returns an array of ModelPresets', () => {
    const presets = getBuiltInModelPresets()
    expect(Array.isArray(presets)).toBe(true)
    expect(presets.length).toBeGreaterThan(0)
  })

  it('excludes the "custom" preset', () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every(p => !p.id.includes('custom'))).toBe(true)
  })

  it('has isBuiltIn set to true for all', () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every(p => p.isBuiltIn)).toBe(true)
  })

  it('has empty apiKey for all built-in presets', () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every(p => p.apiKey === '')).toBe(true)
  })

  it('has IDs prefixed with "builtin-"', () => {
    const presets = getBuiltInModelPresets()
    expect(presets.every(p => p.id.startsWith('builtin-'))).toBe(true)
  })
})

// ── getCurrentPresetName ─────────────────────────────────────────────────────

describe('getCurrentPresetName', () => {
  it('returns "OpenAI" as default when no preset ID', () => {
    expect(getCurrentPresetName(undefined, undefined)).toBe('OpenAI')
  })

  it('returns built-in preset name for built-in ID', () => {
    expect(getCurrentPresetName('builtin-openai', undefined)).toBe('OpenAI')
  })

  it('returns custom preset name when found in user presets', () => {
    const userPresets: ModelPreset[] = [
      { id: 'my-custom', name: 'My Custom Provider', baseUrl: 'https://example.com/v1' },
    ]
    expect(getCurrentPresetName('my-custom', userPresets)).toBe('My Custom Provider')
  })

  it('falls back to "OpenAI" for unknown preset ID', () => {
    expect(getCurrentPresetName('nonexistent', [])).toBe('OpenAI')
  })
})
