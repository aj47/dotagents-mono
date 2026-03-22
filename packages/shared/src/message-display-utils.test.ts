import { describe, it, expect } from 'vitest'
import {
  hasInlineDataImage,
  sanitizeMessageContentForDisplay,
  sanitizeMessageContentForSpeech,
  sanitizeConversationHistoryForDisplay,
  sanitizeAgentProgressUpdateForDisplay,
} from './message-display-utils'
import type { AgentProgressUpdate } from './agent-progress'

describe('hasInlineDataImage', () => {
  it('returns true for content with data:image/', () => {
    expect(hasInlineDataImage('some text data:image/png;base64,abc more text')).toBe(true)
  })

  it('returns false for content without data:image/', () => {
    expect(hasInlineDataImage('just some text')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasInlineDataImage('')).toBe(false)
  })
})

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

  it('replaces markdown video tokens with video placeholders', () => {
    const content = 'Watch this ![video: demo clip](blob:http://localhost/demo)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('Watch this [Video: demo clip]')
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

  it('strips markdown video tokens', () => {
    const content = 'Review ![video: demo clip](blob:http://localhost/demo) please'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Review Video: demo clip please')
  })

  it('leaves plain text unchanged', () => {
    const content = 'Just regular text with no images'
    expect(sanitizeMessageContentForSpeech(content)).toBe(content)
  })
})

describe('sanitizeConversationHistoryForDisplay', () => {
  it('returns undefined/empty arrays as-is', () => {
    expect(sanitizeConversationHistoryForDisplay(undefined)).toBeUndefined()
    expect(sanitizeConversationHistoryForDisplay([])).toEqual([])
  })

  it('sanitizes inline data images in conversation history entries', () => {
    const history = [
      { role: 'user' as const, content: '![img](data:image/png;base64,big)' },
      { role: 'assistant' as const, content: 'plain text' },
    ]
    const result = sanitizeConversationHistoryForDisplay(history)!
    expect(result[0].content).toBe('[Image: img]')
    expect(result[1].content).toBe('plain text')
  })

  it('sanitizes markdown videos in conversation history entries', () => {
    const history = [
      { role: 'user' as const, content: '![video: preview](blob:http://localhost/demo)' },
    ]
    const result = sanitizeConversationHistoryForDisplay(history)!
    expect(result[0].content).toBe('[Video: preview]')
  })

  it('returns same reference when no changes are needed', () => {
    const history = [
      { role: 'user' as const, content: 'hello' },
    ]
    const result = sanitizeConversationHistoryForDisplay(history)
    expect(result).toBe(history) // same reference
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
      ],
    }
    const result = sanitizeAgentProgressUpdateForDisplay(update)
    expect(result).not.toBe(update)
    expect(result.conversationHistory![0].content).toBe('Here: [Image: pic]')
    expect(result.sessionId).toBe('test')
  })

  it('sanitizes video history content', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [
        { role: 'assistant', content: 'Here: ![video: clip](blob:http://localhost/demo)' },
      ],
    }
    const result = sanitizeAgentProgressUpdateForDisplay(update)
    expect(result.conversationHistory![0].content).toBe('Here: [Video: clip]')
  })
})
