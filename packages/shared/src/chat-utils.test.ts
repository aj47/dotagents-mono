import { describe, it, expect } from 'vitest'
import {
  shouldCollapseMessage,
  getToolCallsSummary,
  getToolResultsSummary,
  formatToolArguments,
  formatArgumentsPreview,
  RESPOND_TO_USER_TOOL,
  extractRespondToUserContentFromArgs,
  extractRespondToUserResponseEvents,
  extractRespondToUserResponses,
  resolveMessageTimestamps,
  isToolOnlyMessage,
} from './chat-utils'

// ── Collapse Logic ───────────────────────────────────────────────────────────

describe('shouldCollapseMessage', () => {
  it('returns false for short content with no extras', () => {
    expect(shouldCollapseMessage('Hello')).toBe(false)
  })

  it('returns true for content exceeding the collapse threshold', () => {
    const longContent = 'a'.repeat(201)
    expect(shouldCollapseMessage(longContent)).toBe(true)
  })

  it('returns true when tool calls are present', () => {
    expect(shouldCollapseMessage('short', [{ name: 'search', arguments: {} }])).toBe(true)
  })

  it('returns true when tool results are present', () => {
    expect(shouldCollapseMessage('short', undefined, [{ success: true, content: 'ok' }])).toBe(true)
  })

  it('returns false for undefined content with no extras', () => {
    expect(shouldCollapseMessage(undefined)).toBe(false)
  })
})
// ── Tool Preview ─────────────────────────────────────────────────────────────

describe('getToolCallsSummary', () => {
  it('returns empty for empty array', () => {
    expect(getToolCallsSummary([])).toBe('')
  })

  it('returns formatted tool names', () => {
    const calls = [
      { name: 'search', arguments: {} },
      { name: 'read_file', arguments: {} },
    ]
    expect(getToolCallsSummary(calls)).toBe('🔧 search, read_file')
  })
})

describe('getToolResultsSummary', () => {
  it('returns empty for empty array', () => {
    expect(getToolResultsSummary([])).toBe('')
  })

  it('surfaces a failed single-result preview', () => {
    const results = [{ success: false, content: '', error: 'Not found' }]
    expect(getToolResultsSummary(results)).toBe('⚠️ Not found')
  })

  it('returns success icon for all-success results', () => {
    const results = [{ success: true, content: 'ok' }]
    expect(getToolResultsSummary(results)).toContain('✅')
  })

  it('extracts a summary from structured successful content', () => {
    const results = [{ success: true, content: JSON.stringify({ success: true, message: 'Saved' }) }]
    expect(getToolResultsSummary(results)).toBe('✅ Saved')
  })

  it('returns warning icon for mixed results', () => {
    const results = [
      { success: true, content: 'ok' },
      { success: false, content: '', error: 'failed' },
    ]
    expect(getToolResultsSummary(results)).toContain('⚠️')
  })
})

// ── Tool Formatting ──────────────────────────────────────────────────────────

describe('formatToolArguments', () => {
  it('returns empty for null/undefined', () => {
    expect(formatToolArguments(null)).toBe('')
    expect(formatToolArguments(undefined)).toBe('')
  })

  it('returns pretty-printed JSON', () => {
    const args = { path: '/test' }
    expect(formatToolArguments(args)).toBe('{\n  "path": "/test"\n}')
  })
})

describe('formatArgumentsPreview', () => {
  it('returns empty for non-object', () => {
    expect(formatArgumentsPreview(null)).toBe('')
    expect(formatArgumentsPreview('string')).toBe('')
  })

  it('returns compact key-value preview', () => {
    const args = { path: '/foo', content: 'Hello' }
    expect(formatArgumentsPreview(args)).toBe('path: /foo, content: Hello')
  })

  it('truncates long values', () => {
    const args = { content: 'a'.repeat(50) }
    const preview = formatArgumentsPreview(args)
    expect(preview).toContain('...')
  })

  it('shows +N more for many args', () => {
    const args = { a: '1', b: '2', c: '3', d: '4' }
    expect(formatArgumentsPreview(args)).toContain('+1 more')
  })
})

// ── respond_to_user Extraction ───────────────────────────────────────────────

describe('extractRespondToUserContentFromArgs', () => {
  it('returns null for null/non-object args', () => {
    expect(extractRespondToUserContentFromArgs(null)).toBeNull()
    expect(extractRespondToUserContentFromArgs('string')).toBeNull()
  })

  it('extracts text content', () => {
    expect(extractRespondToUserContentFromArgs({ text: 'Hello' })).toBe('Hello')
  })

  it('extracts image markdown with alt text', () => {
    const args = {
      text: 'Look at this:',
      images: [{ alt: 'diagram', url: 'https://example.com/img.png' }],
    }
    const result = extractRespondToUserContentFromArgs(args)
    expect(result).toContain('Look at this:')
    expect(result).toContain('![diagram](https://example.com/img.png)')
  })

  it('sanitizes markdown image alt text that can break placeholders', () => {
    const args = {
      images: [{ alt: 'di[a]gram (draft) `v1`', url: 'https://example.com/img.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('![diagram draft v1](https://example.com/img.png)')
  })

  it('renders path-only images as a text placeholder', () => {
    const args = {
      images: [{ alt: 'local diagram', path: '/tmp/diagram.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('Local image (local diagram): `/tmp/diagram.png`')
  })

  it('preserves text alongside path-only image placeholders', () => {
    const args = {
      text: 'Saved locally:',
      images: [{ alt: 'desktop capture', path: '/tmp/capture.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('Saved locally:\n\nLocal image (desktop capture): `/tmp/capture.png`')
  })

  it('sanitizes local image placeholder alt text that can break formatting', () => {
    const args = {
      images: [{ altText: 'lo[cal] (draft) `shot`', path: '/tmp/diagram.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('Local image (local draft shot): `/tmp/diagram.png`')
  })

  it('falls back to indexed image labels when sanitizing removes all alt text', () => {
    const args = {
      images: [{ alt: '[]()`', url: 'https://example.com/img.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('![Image 1](https://example.com/img.png)')
  })

  it('returns null for empty args', () => {
    expect(extractRespondToUserContentFromArgs({ text: '', images: [] })).toBeNull()
  })
})

describe('extractRespondToUserResponses', () => {
  it('returns empty array for no messages', () => {
    expect(extractRespondToUserResponses([])).toEqual([])
  })

  it('extracts respond_to_user content from assistant messages', () => {
    const messages = [
      { role: 'user' as const, toolCalls: [] },
      {
        role: 'assistant' as const,
        toolCalls: [
          { name: 'respond_to_user', arguments: { text: 'Hello there!' } },
        ],
      },
    ]
    const result = extractRespondToUserResponses(messages)
    expect(result).toEqual(['Hello there!'])
  })

  it('deduplicates responses across history', () => {
    const messages = [
      {
        role: 'assistant' as const,
        toolCalls: [{ name: 'respond_to_user', arguments: { text: 'Hello' } }],
      },
      {
        role: 'assistant' as const,
        toolCalls: [{ name: 'respond_to_user', arguments: { text: 'Hello' } }],
      },
    ]
    expect(extractRespondToUserResponses(messages)).toEqual(['Hello'])
  })
})

describe('resolveMessageTimestamps', () => {
  it('treats non-finite timestamps as missing and fills them monotonically', () => {
    const messages = [
      { timestamp: Number.NaN },
      { timestamp: 100 },
      { timestamp: Number.POSITIVE_INFINITY },
      {},
    ]

    expect(resolveMessageTimestamps(messages)).toEqual([99, 100, 101, 102])
  })
})

describe('extractRespondToUserResponseEvents', () => {
  it('preserves ordering and duplicates across assistant messages', () => {
    const messages = [
      {
        role: 'assistant' as const,
        timestamp: 10,
        toolCalls: [{ name: 'respond_to_user', arguments: { text: 'Draft' } }],
      },
      {
        role: 'assistant' as const,
        timestamp: 20,
        toolCalls: [
          { name: 'respond_to_user', arguments: { text: 'Draft' } },
          { name: 'respond_to_user', arguments: { text: 'Final' } },
        ],
      },
    ]

    expect(extractRespondToUserResponseEvents(messages, { sessionId: 'session-1', runId: 2 })).toEqual([
      {
        id: 'history-0-0-1',
        sessionId: 'session-1',
        runId: 2,
        ordinal: 1,
        text: 'Draft',
        timestamp: 10,
      },
      {
        id: 'history-1-0-2',
        sessionId: 'session-1',
        runId: 2,
        ordinal: 2,
        text: 'Draft',
        timestamp: 20,
      },
      {
        id: 'history-1-1-3',
        sessionId: 'session-1',
        runId: 2,
        ordinal: 3,
        text: 'Final',
        timestamp: 20,
      },
    ])
  })

  it('fills missing timestamps relative to neighboring messages', () => {
    const messages = [
      {
        role: 'assistant' as const,
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Before' } }],
      },
      {
        role: 'assistant' as const,
        timestamp: 100,
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Known' } }],
      },
      {
        role: 'assistant' as const,
        toolCalls: [
          { name: RESPOND_TO_USER_TOOL, arguments: { text: 'Gap one' } },
          { name: RESPOND_TO_USER_TOOL, arguments: { text: 'Gap two' } },
        ],
      },
      {
        role: 'assistant' as const,
        timestamp: 200,
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'After' } }],
      },
    ]

    expect(extractRespondToUserResponseEvents(messages).map((event) => event.timestamp)).toEqual([
      99,
      100,
      101,
      101,
      200,
    ])
  })

  it('falls back deterministically when all timestamps are missing', () => {
    const messages = [
      {
        role: 'assistant' as const,
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'First' } }],
      },
      {
        role: 'assistant' as const,
        toolCalls: [
          { name: RESPOND_TO_USER_TOOL, arguments: { text: 'Second' } },
          { name: RESPOND_TO_USER_TOOL, arguments: { text: 'Third' } },
        ],
      },
    ]

    expect(extractRespondToUserResponseEvents(messages).map((event) => event.timestamp)).toEqual([
      0,
      1,
      1,
    ])
  })
})

// ── isToolOnlyMessage ────────────────────────────────────────────────────────

describe('isToolOnlyMessage', () => {
  it('returns false for message with no tools', () => {
    expect(isToolOnlyMessage({ content: 'Hello' })).toBe(false)
  })

  it('returns true for tool calls with no content', () => {
    expect(isToolOnlyMessage({ toolCalls: [{ name: 'search' }] })).toBe(true)
  })

  it('returns true for tool calls with placeholder content', () => {
    expect(isToolOnlyMessage({ content: 'Executing tools...', toolCalls: [{ name: 'search' }] })).toBe(true)
  })

  it('returns false for tool calls with meaningful content', () => {
    expect(isToolOnlyMessage({ content: 'Here is what I found', toolCalls: [{ name: 'search' }] })).toBe(false)
  })
})

// ── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('RESPOND_TO_USER_TOOL is "respond_to_user"', () => {
    expect(RESPOND_TO_USER_TOOL).toBe('respond_to_user')
  })
})
