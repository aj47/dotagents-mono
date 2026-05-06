import { describe, it, expect } from 'vitest'
import {
  buildTTSPreprocessingPrompt,
  getTTSPreprocessingOptionsFromConfig,
  preprocessTextForTTS,
  validateTTSText,
} from './tts-preprocessing'

// ── preprocessTextForTTS ─────────────────────────────────────────────────────

describe('preprocessTextForTTS', () => {
  it('returns empty-ish text for empty input', () => {
    // After normalizeWhitespace, empty string may become "." (trailing sentence end logic)
    const result = preprocessTextForTTS('')
    expect(result.length).toBeLessThanOrEqual(1)
  })

  it('removes thinking blocks', () => {
    const text = 'Before <think>some internal thought</think> After'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('internal thought')
    expect(result).toContain('Before')
    expect(result).toContain('After')
  })

  it('removes code blocks', () => {
    const text = 'Hello ```const x = 1;``` world'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('const x')
    expect(result).toContain('code block')
  })

  it('removes inline code backticks', () => {
    const text = 'Use the `console.log` function'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('`')
    expect(result).toContain('console.log')
  })

  it('replaces URLs with [web link]', () => {
    const text = 'Visit https://example.com/page for more'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('https://')
    expect(result).toContain('web link')
  })

  it('replaces email addresses', () => {
    const text = 'Contact user@example.com for help'
    const result = preprocessTextForTTS(text)
    expect(result).toContain('email address')
  })

  it('converts markdown headings', () => {
    const text = '# Main Title'
    const result = preprocessTextForTTS(text)
    expect(result).toContain('Heading:')
  })

  it('strips markdown bold/italic formatting', () => {
    const text = 'This is **bold** and *italic* text'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('**')
    expect(result).not.toContain('*')
    expect(result).toContain('bold')
    expect(result).toContain('italic')
  })

  it('strips unordered markdown list markers without saying item', () => {
    const text = '- First point\n- Second point'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('Item:')
    expect(result).toBe('First point. Second point.')
  })

  it('strips alternate markdown list markers before italic cleanup', () => {
    const text = '* First point\n+ Second point'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('Item:')
    expect(result).toBe('First point. Second point.')
  })

  it('strips ordered markdown list markers without saying item', () => {
    const text = '1. First point\n2. Second point'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('Item:')
    expect(result).toBe('First point. Second point.')
  })

  it('converts symbols to words', () => {
    const text = 'Use A && B || C'
    const result = preprocessTextForTTS(text)
    expect(result).toContain('and')
    expect(result).toContain('or')
  })

  it('converts version numbers', () => {
    const text = 'v1.2.3 is out'
    const result = preprocessTextForTTS(text)
    expect(result).toContain('version')
  })

  it('truncates text to maxLength', () => {
    const longText = 'Hello world. '.repeat(500)
    const result = preprocessTextForTTS(longText, { maxLength: 100 })
    expect(result.length).toBeLessThanOrEqual(103) // maxLength + "..."
  })

  it('respects option overrides', () => {
    const text = '```code here``` and https://example.com'
    const result = preprocessTextForTTS(text, { removeCodeBlocks: false, removeUrls: false })
    // Code should still be present since removeCodeBlocks is false
    expect(result).toContain('code here')
  })

  it('normalizes whitespace', () => {
    const text = 'Hello    world\n\ntest'
    const result = preprocessTextForTTS(text)
    expect(result).not.toContain('  ')
    expect(result).not.toContain('\n')
  })
})

describe('shared TTS preprocessing policy', () => {
  it('derives regex preprocessing options from app config defaults', () => {
    expect(getTTSPreprocessingOptionsFromConfig({})).toEqual({
      removeCodeBlocks: true,
      removeUrls: true,
      convertMarkdown: true,
    })

    expect(getTTSPreprocessingOptionsFromConfig({
      ttsRemoveCodeBlocks: false,
      ttsRemoveUrls: false,
      ttsConvertMarkdown: false,
    })).toEqual({
      removeCodeBlocks: false,
      removeUrls: false,
      convertMarkdown: false,
    })
  })

  it('builds the LLM preprocessing prompt from app config', () => {
    const defaultPrompt = buildTTSPreprocessingPrompt({})

    expect(defaultPrompt).toContain('Convert this AI response to natural spoken text.')
    expect(defaultPrompt).toContain('- Remove code blocks and replace with brief description if relevant')
    expect(defaultPrompt).toContain('- Remove URLs but mention if a link was shared')
    expect(defaultPrompt).toContain('- Convert markdown formatting to natural speech')
    expect(defaultPrompt).toContain('- Strip bullet/list markers silently')
    expect(defaultPrompt).toContain('- Expand abbreviations and acronyms appropriately')
    expect(defaultPrompt).toContain('- Convert technical symbols to spoken words')
    expect(defaultPrompt).toContain('Text to convert:')

    const minimalPrompt = buildTTSPreprocessingPrompt({
      ttsRemoveCodeBlocks: false,
      ttsRemoveUrls: false,
      ttsConvertMarkdown: false,
    })
    expect(minimalPrompt).not.toContain('Remove code blocks')
    expect(minimalPrompt).not.toContain('Remove URLs')
    expect(minimalPrompt).not.toContain('Convert markdown formatting')
    expect(minimalPrompt).toContain('- Keep the core meaning but optimize for listening')
  })
})

// ── validateTTSText ──────────────────────────────────────────────────────────

describe('validateTTSText', () => {
  it('returns valid for normal text', () => {
    const result = validateTTSText('Hello, how are you?')
    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
    expect(result.processedLength).toBe(19)
  })

  it('returns invalid for empty text', () => {
    const result = validateTTSText('')
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Text is empty')
  })

  it('returns invalid for whitespace-only text', () => {
    const result = validateTTSText('   ')
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Text is empty')
  })

  it('returns invalid for very long text', () => {
    const result = validateTTSText('a'.repeat(15000))
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Text is too long for TTS')
  })

  it('flags unprocessed code blocks', () => {
    const result = validateTTSText('Some text ```const x = 1;``` here')
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Contains unprocessed code blocks')
  })

  it('flags unprocessed URLs', () => {
    const result = validateTTSText('Visit https://example.com')
    expect(result.isValid).toBe(false)
    expect(result.issues).toContain('Contains unprocessed URLs')
  })

  it('can have multiple issues', () => {
    const result = validateTTSText('')
    expect(result.issues.length).toBeGreaterThanOrEqual(1)
  })

  it('reports correct processedLength', () => {
    const text = 'Hello world'
    const result = validateTTSText(text)
    expect(result.processedLength).toBe(text.length)
  })
})
