import { describe, it, expect } from 'vitest'
import {
  normalizeMessagePreviewText,
  sanitizeMessageContentForDisplay,
  sanitizeMessageContentForSpeech,
  sanitizeAgentProgressUpdateForDisplay,
} from './message-display-utils'
import type { AgentProgressUpdate } from './agent-progress'

describe('sanitizeMessageContentForDisplay', () => {
  it('returns content unchanged when no inline data images', () => {
    const content = 'Hello, world!'
    expect(sanitizeMessageContentForDisplay(content)).toBe(content)
  })

  it('replaces inline data image with alt text placeholder', () => {
    const content = '![my image](data:image/png;base64,abc123)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('[Image: my image]')
  })

  it('replaces inline data image with no alt text', () => {
    const content = '![](data:image/png;base64,abc123)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('[Image]')
  })

  it('preserves non-data URL markdown images', () => {
    const content = '![alt](https://example.com/image.png)'
    expect(sanitizeMessageContentForDisplay(content)).toBe(content)
  })

  it('handles multiple inline data images', () => {
    const content = '![a](data:image/png;base64,x) text ![b](data:image/jpeg;base64,y)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('[Image: a] text [Image: b]')
  })
})

describe('sanitizeMessageContentForSpeech', () => {
  it('returns empty/falsy content as-is', () => {
    expect(sanitizeMessageContentForSpeech('')).toBe('')
  })

  it('strips markdown image references (external URLs)', () => {
    const content = 'See this ![photo](https://example.com/pic.png) here'
    expect(sanitizeMessageContentForSpeech(content)).toBe('See this Image: photo here')
  })

  it('strips markdown image references (data URLs)', () => {
    const content = '![diagram](data:image/png;base64,abc)'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Image: diagram')
  })

  it('strips images with no alt text', () => {
    const content = '![](https://example.com/pic.png)'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Image')
  })

  it('strips markdown video links', () => {
    const content = 'Watch [demo](assets://conversation-video/conv_1/abcdef1234567890.mp4) please'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Watch Video: demo please')
  })

  it('leaves plain text unchanged', () => {
    const content = 'Just regular text with no images'
    expect(sanitizeMessageContentForSpeech(content)).toBe(content)
  })
})

describe('normalizeMessagePreviewText', () => {
  it('normalizes whitespace in plain preview text', () => {
    expect(normalizeMessagePreviewText('  Hello\n\nworld  ')).toBe('Hello world')
  })

  it('prefers prose outside closed think tags', () => {
    expect(normalizeMessagePreviewText('<think>reasoning</think>\n\nFinal answer')).toBe('Final answer')
  })

  it('falls back to thought text for open or thought-only tags', () => {
    expect(normalizeMessagePreviewText('<think>still reasoning')).toBe('still reasoning')
    expect(normalizeMessagePreviewText('<think>only thought</think>')).toBe('only thought')
  })
})

describe('sanitizeAgentProgressUpdateForDisplay', () => {
  const baseUpdate: AgentProgressUpdate = {
    sessionId: 'test',
    currentIteration: 0,
    maxIterations: 1,
    steps: [],
    isComplete: false,
  }

  it('returns same reference when no sanitization needed', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [{ role: 'user', content: 'hi' }],
    }
    const result = sanitizeAgentProgressUpdateForDisplay(update)
    expect(result).toBe(update)
  })

  it('returns new object with sanitized history', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [
        { role: 'assistant', content: 'Here: ![pic](data:image/png;base64,x)' },
        { role: 'user', content: 'plain text' },
      ],
    }
    const result = sanitizeAgentProgressUpdateForDisplay(update)
    expect(result).not.toBe(update)
    expect(result.conversationHistory![0].content).toBe('Here: [Image: pic]')
    expect(result.conversationHistory![1].content).toBe('plain text')
    expect(result.sessionId).toBe('test')
  })

  it('sanitizes display-only history content', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [
        {
          role: 'assistant',
          content: 'Stored answer',
          displayContent: '<think>reasoning</think>\n\n![pic](data:image/png;base64,x)',
        },
      ],
    }

    const result = sanitizeAgentProgressUpdateForDisplay(update)

    expect(result.conversationHistory![0].content).toBe('Stored answer')
    expect(result.conversationHistory![0].displayContent).toBe('<think>reasoning</think>\n\n[Image: pic]')
  })
})
