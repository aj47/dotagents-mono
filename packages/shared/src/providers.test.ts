import { describe, it, expect } from 'vitest'
import {
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
  EDGE_TTS_VOICES,
  EDGE_TTS_MODELS,
  KITTEN_TTS_VOICES,
  SUPERTONIC_TTS_VOICES,
  SUPERTONIC_TTS_LANGUAGES,
  OPENAI_COMPATIBLE_PRESETS,
  DEFAULT_MODEL_PRESET_ID,
  getBuiltInModelPresets,
  getCurrentPresetName,
} from './providers'
import type { ModelPreset } from './providers'

// ── Provider Constants ───────────────────────────────────────────────────────

describe('STT_PROVIDERS', () => {
  it('includes openai, groq, OpenAI Codex, and parakeet', () => {
    const values = STT_PROVIDERS.map(p => p.value)
    expect(values).toContain('openai')
    expect(values).toContain('groq')
    expect(values).toContain('chatgpt-web')
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

  it('EDGE_TTS_VOICES has at least 4 voices', () => {
    expect(EDGE_TTS_VOICES.length).toBeGreaterThanOrEqual(4)
    expect(EDGE_TTS_VOICES.map(v => v.value)).toContain('en-US-AriaNeural')
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
