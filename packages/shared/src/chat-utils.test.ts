import { describe, it, expect } from 'vitest'
import {
  shouldCollapseMessage,
  getToolCallsSummary,
  getToolCallPreview,
  getToolResultsSummary,
  getToolArgumentEntries,
  formatToolArguments,
  formatArgumentsPreview,
  RESPOND_TO_USER_TOOL,
  MARK_WORK_COMPLETE_TOOL,
  extractRespondToUserContentFromArgs,
  extractRespondToUserResponseEvents,
  resolveMessageTimestamps,
  isToolOnlyMessage,
  isInternalCompletionControlMessage,
  filterVisibleChatMessages,
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

  it('ignores data URL markdown image payload length', () => {
    const content = `Here is the image:\n\n![diagram](data:image/png;base64,${'a'.repeat(500)})`
    expect(shouldCollapseMessage(content)).toBe(false)
  })

  it('ignores http markdown image payload length', () => {
    const content = `Looks good\n\n![remote image](https://example.com/${'a'.repeat(500)}.png)`
    expect(shouldCollapseMessage(content)).toBe(false)
  })

  it('ignores conversation asset markdown image payload length', () => {
    const content = `Screenshot attached\n\n![screenshot](assets://conversation-image/${'a'.repeat(500)})`
    expect(shouldCollapseMessage(content)).toBe(false)
  })

  it('still collapses when non-image text exceeds the threshold', () => {
    const content = `${'a'.repeat(201)}\n\n![diagram](data:image/png;base64,${'b'.repeat(500)})`
    expect(shouldCollapseMessage(content)).toBe(true)
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

  it('returns tool-name-only previews', () => {
    const calls = [
      { name: 'execute_command', arguments: { command: 'pnpm test' } },
      { name: 'read_file', arguments: { path: 'apps/desktop/src/main.ts' } },
    ]
    expect(getToolCallsSummary(calls)).toBe('🔧 execute_command, read_file')
  })
})

describe('getToolCallPreview', () => {
  it('returns only the tool name for execute_command', () => {
    expect(getToolCallPreview({ name: 'execute_command', arguments: { command: 'git status --short' } })).toBe('execute_command')
  })

  it('omits common structured tool arguments', () => {
    expect(getToolCallPreview({ name: 'write_file', arguments: { path: 'README.md', content: 'hello' } })).toBe('write_file')
    expect(getToolCallPreview({ name: 'web_search', arguments: { query: 'DotAgents skills' } })).toBe('web_search')
  })

  it('falls back to the raw tool name only', () => {
    expect(getToolCallPreview({ name: 'custom_tool', arguments: { foo: 'bar', nested: { value: true } } })).toBe('custom_tool')
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

  it('pretty-prints JSON string arguments', () => {
    expect(formatToolArguments('{"path":"/test","count":2}')).toBe('{\n  "path": "/test",\n  "count": 2\n}')
  })
})

describe('getToolArgumentEntries', () => {
  it('returns normalized entries for objects', () => {
    expect(getToolArgumentEntries({ command: 'echo hi' })).toEqual([
      { key: 'command', value: 'echo hi' },
    ])
  })

  it('returns normalized entries for JSON string arguments', () => {
    expect(getToolArgumentEntries('{"command":"echo hi"}')).toEqual([
      { key: 'command', value: 'echo hi' },
    ])
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

  it('returns compact key-value preview for JSON string arguments', () => {
    expect(formatArgumentsPreview('{"path":"/foo","content":"Hello"}')).toBe('path: /foo, content: Hello')
  })

  it('truncates long values', () => {
    const args = { content: 'a'.repeat(50) }
    const preview = formatArgumentsPreview(args)
    expect(preview).toContain('...')
  })

  it('keeps multiline string values on one preview line', () => {
    const args = { command: "python3 - <<'PY'\nprint('hello')\nPY" }
    expect(formatArgumentsPreview(args)).toBe("command: python3 - <<'PY' print('hel...")
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

  it('does not synthesize non-renderable path-only images', () => {
    const args = {
      images: [{ alt: 'local diagram', path: '/tmp/diagram.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBeNull()
  })

  it('preserves text while skipping path-only image placeholders', () => {
    const args = {
      text: 'Saved locally:',
      images: [{ alt: 'desktop capture', path: '/tmp/capture.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('Saved locally:')
  })

  it('skips path-only images even when they have markdown-sensitive alt text', () => {
    const args = {
      images: [{ altText: 'lo[cal] (draft) `shot`', path: '/tmp/diagram.png' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBeNull()
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

describe('isInternalCompletionControlMessage', () => {
  it('treats empty respond_to_user assistant wrappers as internal', () => {
    expect(isInternalCompletionControlMessage({
      role: 'assistant',
      content: '',
      toolCalls: [{ name: 'respond_to_user' }],
    })).toBe(true)
  })

  it('treats respond_to_user tool result messages as internal', () => {
    expect(isInternalCompletionControlMessage({
      role: 'tool',
      content: '[respond_to_user] {"success":true,"message":"Response recorded for delivery to user."}',
    })).toBe(true)
  })

  it('keeps normal assistant messages visible', () => {
    expect(isInternalCompletionControlMessage({
      role: 'assistant',
      content: 'Hi — what can I help with?',
    })).toBe(false)
  })
})

describe('filterVisibleChatMessages', () => {
  it('filters internal respond_to_user wrapper steps from previews', () => {
    const messages = [
      { role: 'user' as const, content: 'hi' },
      { role: 'assistant' as const, content: '', toolCalls: [{ name: 'respond_to_user' }] },
      { role: 'tool' as const, content: '[respond_to_user] {"success":true}' },
      { role: 'assistant' as const, content: 'Hi — what can I help with?' },
    ]

    expect(filterVisibleChatMessages(messages)).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'Hi — what can I help with?' },
    ])
  })
})

// ── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('RESPOND_TO_USER_TOOL is "respond_to_user"', () => {
    expect(RESPOND_TO_USER_TOOL).toBe('respond_to_user')
  })

  it('MARK_WORK_COMPLETE_TOOL is "mark_work_complete"', () => {
    expect(MARK_WORK_COMPLETE_TOOL).toBe('mark_work_complete')
  })
})
