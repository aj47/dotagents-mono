import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PARAKEET_NUM_THREADS,
  DEFAULT_STT_MODELS,
  KNOWN_STT_MODEL_IDS,
  PARAKEET_NUM_THREAD_OPTIONS,
  isKnownSttModel,
  isParakeetNumThreadsUpdateValue,
  getDefaultSttModel,
  getConfiguredSttModel,
} from './stt-models'

describe('DEFAULT_STT_MODELS', () => {
  it('has openai default', () => {
    expect(DEFAULT_STT_MODELS.openai).toBe('whisper-1')
  })

  it('has groq default', () => {
    expect(DEFAULT_STT_MODELS.groq).toBe('whisper-large-v3-turbo')
  })
})

describe('KNOWN_STT_MODEL_IDS', () => {
  it('includes openai transcription models', () => {
    expect(KNOWN_STT_MODEL_IDS.openai).toContain('gpt-4o-transcribe')
    expect(KNOWN_STT_MODEL_IDS.openai).toContain('gpt-4o-mini-transcribe')
    expect(KNOWN_STT_MODEL_IDS.openai).toContain('whisper-1')
  })

  it('includes groq transcription models', () => {
    expect(KNOWN_STT_MODEL_IDS.groq).toContain('whisper-large-v3')
    expect(KNOWN_STT_MODEL_IDS.groq).toContain('whisper-large-v3-turbo')
    expect(KNOWN_STT_MODEL_IDS.groq).toContain('distil-whisper-large-v3-en')
  })
})

describe('Parakeet thread settings', () => {
  it('describes allowed thread counts and default', () => {
    expect(DEFAULT_PARAKEET_NUM_THREADS).toBe(2)
    expect(PARAKEET_NUM_THREAD_OPTIONS).toEqual([1, 2, 4, 8])
  })

  it('validates Parakeet thread update values', () => {
    expect(isParakeetNumThreadsUpdateValue(1)).toBe(true)
    expect(isParakeetNumThreadsUpdateValue(8)).toBe(true)
    expect(isParakeetNumThreadsUpdateValue(3)).toBe(false)
    expect(isParakeetNumThreadsUpdateValue('2')).toBe(false)
  })
})

describe('isKnownSttModel', () => {
  it('recognises known openai model', () => {
    expect(isKnownSttModel('openai', 'whisper-1')).toBe(true)
  })

  it('recognises known groq model', () => {
    expect(isKnownSttModel('groq', 'whisper-large-v3-turbo')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isKnownSttModel('openai', 'Whisper-1')).toBe(true)
  })

  it('returns false for unknown model', () => {
    expect(isKnownSttModel('openai', 'gpt-4o')).toBe(false)
  })
})

describe('getDefaultSttModel', () => {
  it('returns openai default for "openai"', () => {
    expect(getDefaultSttModel('openai')).toBe('whisper-1')
  })

  it('returns groq default for "groq"', () => {
    expect(getDefaultSttModel('groq')).toBe('whisper-large-v3-turbo')
  })

  it('returns undefined for unknown provider', () => {
    expect(getDefaultSttModel('parakeet')).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(getDefaultSttModel(undefined)).toBeUndefined()
  })
})

describe('getConfiguredSttModel', () => {
  it('returns configured openai model', () => {
    const config = { sttProviderId: 'openai', openaiSttModel: 'gpt-4o-transcribe' }
    expect(getConfiguredSttModel(config)).toBe('gpt-4o-transcribe')
  })

  it('falls back to openai default when openaiSttModel is empty', () => {
    const config = { sttProviderId: 'openai', openaiSttModel: '' }
    expect(getConfiguredSttModel(config)).toBe('whisper-1')
  })

  it('returns configured groq model', () => {
    const config = { sttProviderId: 'groq', groqSttModel: 'whisper-large-v3' }
    expect(getConfiguredSttModel(config)).toBe('whisper-large-v3')
  })

  it('falls back to groq default when groqSttModel is empty', () => {
    const config = { sttProviderId: 'groq', groqSttModel: '  ' }
    expect(getConfiguredSttModel(config)).toBe('whisper-large-v3-turbo')
  })

  it('returns undefined for unknown provider', () => {
    const config = { sttProviderId: 'parakeet' }
    expect(getConfiguredSttModel(config)).toBeUndefined()
  })

  it('returns undefined when no provider is set', () => {
    const config = {}
    expect(getConfiguredSttModel(config)).toBeUndefined()
  })
})
