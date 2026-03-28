import { describe, expect, it, vi } from 'vitest'
import {
  formatConversationHistoryMessages,
  formatConversationToolCalls,
  formatConversationToolResults,
  stringifyConversationToolResultContent,
} from './conversation-history'

describe('formatConversationToolCalls', () => {
  it('normalizes missing tool arguments to an empty object', () => {
    expect(
      formatConversationToolCalls([
        { name: 'search' },
        { name: 'open', arguments: { ref_id: 'turn0search0' } },
      ]),
    ).toEqual([
      { name: 'search', arguments: {} },
      { name: 'open', arguments: { ref_id: 'turn0search0' } },
    ])
  })
})

describe('stringifyConversationToolResultContent', () => {
  it('joins MCP text blocks with newlines', () => {
    expect(
      stringifyConversationToolResultContent([
        { type: 'text', text: 'first line' },
        { type: 'text', text: 'second line' },
      ]),
    ).toBe('first line\nsecond line')
  })

  it('handles string and object-shaped content defensively', () => {
    expect(stringifyConversationToolResultContent('plain text')).toBe(
      'plain text',
    )
    expect(
      stringifyConversationToolResultContent({ content: 'fallback text' }),
    ).toBe('fallback text')
  })
})

describe('formatConversationToolResults', () => {
  it('normalizes MCP and stored tool-result shapes into shared ToolResult data', () => {
    expect(
      formatConversationToolResults([
        {
          content: [
            { type: 'text', text: 'tool ok' },
            { type: 'text', text: 'more detail' },
          ],
        },
        {
          success: false,
          content: 'tool failed',
        },
      ]),
    ).toEqual([
      {
        success: true,
        content: 'tool ok\nmore detail',
        error: undefined,
      },
      {
        success: false,
        content: 'tool failed',
        error: 'tool failed',
      },
    ])
  })
})

describe('formatConversationHistoryMessages', () => {
  it('filters entries, preserves explicit timestamps, and falls back when needed', () => {
    const fallbackTimestamp = vi.fn(() => 1700000000000)

    const result = formatConversationHistoryMessages(
      [
        {
          role: 'user' as const,
          content: 'keep me',
          toolCalls: [{ name: 'search', arguments: { q: 'shared helper' } }],
          timestamp: 123,
        },
        {
          role: 'assistant' as const,
          content: 'skip me',
          hidden: true,
        },
        {
          role: 'tool' as const,
          content: 'tool output',
          toolResults: [{ isError: true, content: [{ text: 'denied' }] }],
        },
      ],
      {
        includeEntry: (entry) => !(entry as { hidden?: boolean }).hidden,
        fallbackTimestamp,
      },
    )

    expect(result).toEqual([
      {
        role: 'user',
        content: 'keep me',
        toolCalls: [{ name: 'search', arguments: { q: 'shared helper' } }],
        toolResults: undefined,
        timestamp: 123,
      },
      {
        role: 'tool',
        content: 'tool output',
        toolCalls: undefined,
        toolResults: [
          {
            success: false,
            content: 'denied',
            error: 'denied',
          },
        ],
        timestamp: 1700000000000,
      },
    ])
    expect(fallbackTimestamp).toHaveBeenCalledTimes(1)
  })
})
