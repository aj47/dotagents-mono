import { describe, it, expect } from 'vitest'
import {
  COLLAPSE_THRESHOLD,
  getRoleIcon,
  getRoleLabel,
  shouldCollapseMessage,
  getToolCallsSummary,
  getToolResultsSummary,
  generateToolResultPreview,
  formatRelativeTimestamp,
  messageHasToolExtras,
  COLLAPSED_LINES,
  EXPAND_TEXT,
  COLLAPSE_TEXT,
  getExpandCollapseText,
  formatToolArguments,
  formatArgumentsPreview,
  getToolResultStatusDisplay,
  pluralize,
  getToolBadgeText,
  ROLE_CONFIG,
  getRoleConfig,
  RESPOND_TO_USER_TOOL,
  extractRespondToUserContentFromArgs,
  extractRespondToUserResponseEvents,
  extractRespondToUserResponses,
  isToolOnlyMessage,
} from './chat-utils'
import type { MessageRole, RoleConfig } from './chat-utils'

// ── Role Config ──────────────────────────────────────────────────────────────

describe('getRoleIcon', () => {
  it('returns 👤 for user', () => {
    expect(getRoleIcon('user')).toBe('👤')
  })

  it('returns 🤖 for assistant', () => {
    expect(getRoleIcon('assistant')).toBe('🤖')
  })

  it('returns 🔧 for tool', () => {
    expect(getRoleIcon('tool')).toBe('🔧')
  })

  it('returns 💬 for unknown role', () => {
    expect(getRoleIcon('unknown' as MessageRole)).toBe('💬')
  })
})

describe('getRoleLabel', () => {
  it('returns User for user', () => {
    expect(getRoleLabel('user')).toBe('User')
  })

  it('returns Assistant for assistant', () => {
    expect(getRoleLabel('assistant')).toBe('Assistant')
  })

  it('returns Tool for tool', () => {
    expect(getRoleLabel('tool')).toBe('Tool')
  })

  it('returns Unknown for unknown role', () => {
    expect(getRoleLabel('unknown' as MessageRole)).toBe('Unknown')
  })
})

describe('ROLE_CONFIG', () => {
  it('has user, assistant, tool, and default entries', () => {
    expect(ROLE_CONFIG.user).toBeDefined()
    expect(ROLE_CONFIG.assistant).toBeDefined()
    expect(ROLE_CONFIG.tool).toBeDefined()
    expect(ROLE_CONFIG.default).toBeDefined()
  })

  it('each entry has icon, label, colorClass, and colorClassCompact', () => {
    for (const key of ['user', 'assistant', 'tool', 'default'] as const) {
      const config = ROLE_CONFIG[key]
      expect(config.icon).toBeTruthy()
      expect(config.label).toBeTruthy()
      expect(config.colorClass).toBeTruthy()
      expect(config.colorClassCompact).toBeTruthy()
    }
  })
})

describe('getRoleConfig', () => {
  it('returns user config for "user"', () => {
    expect(getRoleConfig('user')).toBe(ROLE_CONFIG.user)
  })

  it('returns default config for unknown role', () => {
    expect(getRoleConfig('unknown')).toBe(ROLE_CONFIG.default)
  })
})

// ── Collapse Logic ───────────────────────────────────────────────────────────

describe('shouldCollapseMessage', () => {
  it('returns false for short content with no extras', () => {
    expect(shouldCollapseMessage('Hello')).toBe(false)
  })

  it('returns true for content exceeding COLLAPSE_THRESHOLD', () => {
    const longContent = 'a'.repeat(COLLAPSE_THRESHOLD + 1)
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

describe('getExpandCollapseText', () => {
  it('returns Collapse when expanded', () => {
    expect(getExpandCollapseText(true)).toBe(COLLAPSE_TEXT)
  })

  it('returns Expand when collapsed', () => {
    expect(getExpandCollapseText(false)).toBe(EXPAND_TEXT)
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

  it('returns success icon for all-success results', () => {
    const results = [{ success: true, content: 'ok' }]
    expect(getToolResultsSummary(results)).toContain('✅')
  })

  it('returns warning icon for mixed results', () => {
    const results = [
      { success: true, content: 'ok' },
      { success: false, content: '', error: 'failed' },
    ]
    expect(getToolResultsSummary(results)).toContain('⚠️')
  })
})

describe('generateToolResultPreview', () => {
  it('returns empty string for null', () => {
    expect(generateToolResultPreview(null as any)).toBe('')
  })

  it('returns error text for failed result', () => {
    const result = { success: false, content: '', error: 'Not found' }
    expect(generateToolResultPreview(result)).toBe('Not found')
  })

  it('returns content preview for successful result', () => {
    const result = { success: true, content: 'File contents here' }
    expect(generateToolResultPreview(result)).toBe('File contents here')
  })

  it('handles JSON array content', () => {
    const result = { success: true, content: JSON.stringify([{ name: 'file.ts' }, { name: 'test.ts' }]) }
    const preview = generateToolResultPreview(result)
    expect(preview).toContain('2 items')
  })

  it('handles JSON object with message field', () => {
    const result = { success: true, content: JSON.stringify({ success: true, message: 'Saved' }) }
    expect(generateToolResultPreview(result)).toBe('Saved')
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

describe('getToolResultStatusDisplay', () => {
  it('returns success icon and label for true', () => {
    expect(getToolResultStatusDisplay(true)).toEqual({ icon: '✅', label: 'Success' })
  })

  it('returns error icon and label for false', () => {
    expect(getToolResultStatusDisplay(false)).toEqual({ icon: '❌', label: 'Error' })
  })
})

// ── Pluralization ────────────────────────────────────────────────────────────

describe('pluralize', () => {
  it('returns singular for count 1', () => {
    expect(pluralize(1, 'item')).toBe('item')
  })

  it('returns default plural for count > 1', () => {
    expect(pluralize(2, 'item')).toBe('items')
  })

  it('returns custom plural for count > 1', () => {
    expect(pluralize(0, 'child', 'children')).toBe('children')
  })
})

describe('getToolBadgeText', () => {
  it('returns correct text for 1 call', () => {
    expect(getToolBadgeText(1, 'call')).toBe('1 tool call')
  })

  it('returns correct text for multiple results', () => {
    expect(getToolBadgeText(3, 'result')).toBe('3 results')
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

// ── messageHasToolExtras ─────────────────────────────────────────────────────

describe('messageHasToolExtras', () => {
  it('returns false for plain message', () => {
    expect(messageHasToolExtras({ role: 'user', content: 'hello' })).toBe(false)
  })

  it('returns true for message with tool calls', () => {
    expect(messageHasToolExtras({
      role: 'assistant',
      content: '',
      toolCalls: [{ name: 'search', arguments: {} }],
    })).toBe(true)
  })
})

// ── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('COLLAPSE_THRESHOLD is a positive number', () => {
    expect(COLLAPSE_THRESHOLD).toBeGreaterThan(0)
  })

  it('COLLAPSED_LINES is 3', () => {
    expect(COLLAPSED_LINES).toBe(3)
  })

  it('RESPOND_TO_USER_TOOL is "respond_to_user"', () => {
    expect(RESPOND_TO_USER_TOOL).toBe('respond_to_user')
  })
})
