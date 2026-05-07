import { describe, it, expect } from 'vitest'
import {
  shouldCollapseMessage,
  getToolCallsSummary,
  getToolCallPreview,
  getIndividualToolCallPreview,
  getCompactToolExecutionPreview,
  getExecuteCommandResultPreview,
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

  it('returns the first command token for execute_command and tool-name for others', () => {
    const calls = [
      { name: 'execute_command', arguments: { command: 'pnpm test' } },
      { name: 'read_file', arguments: { path: 'apps/desktop/src/main.ts' } },
    ]
    expect(getToolCallsSummary(calls)).toBe('pnpm, read_file')
  })
})

describe('getToolCallPreview', () => {
  it('returns the first command token for execute_command', () => {
    expect(getToolCallPreview({ name: 'execute_command', arguments: { command: 'git status --short' } })).toBe('git')
  })

  it('falls back to the tool name when execute_command has no command argument', () => {
    expect(getToolCallPreview({ name: 'execute_command', arguments: {} })).toBe('execute_command')
  })

  it('omits common structured tool arguments', () => {
    expect(getToolCallPreview({ name: 'write_file', arguments: { path: 'README.md', content: 'hello' } })).toBe('write_file')
    expect(getToolCallPreview({ name: 'web_search', arguments: { query: 'DotAgents skills' } })).toBe('web_search')
  })

  it('falls back to the raw tool name only', () => {
    expect(getToolCallPreview({ name: 'custom_tool', arguments: { foo: 'bar', nested: { value: true } } })).toBe('custom_tool')
  })

  it('sanitizes whitespace so collapsed labels stay one word', () => {
    expect(getToolCallPreview({ name: 'custom tool\nname', arguments: {} })).toBe('custom_tool_name')
  })
})

describe('getIndividualToolCallPreview', () => {
  it('uses the actual command for individual execute_command rows', () => {
    expect(getIndividualToolCallPreview({ name: 'execute_command', arguments: { command: 'git status --short' } })).toBe('git status --short')
  })

  it('keeps multiline execute_command previews on one line', () => {
    expect(getIndividualToolCallPreview({ name: 'execute_command', arguments: { command: "python3 - <<'PY'\nprint('hi')\nPY" } })).toBe("python3 - <<'PY' print('hi') PY")
  })

  it('still uses tool-name-only previews for non-command tools', () => {
    expect(getIndividualToolCallPreview({ name: 'read_file', arguments: { path: 'README.md' } })).toBe('read_file')
  })

  it('supports JSON string command arguments', () => {
    expect(getIndividualToolCallPreview({ name: 'execute_command', arguments: '{"command":"pnpm test"}' as unknown as Record<string, unknown> })).toBe('pnpm test')
  })
})

describe('getExecuteCommandResultPreview', () => {
  it('returns null for non execute_command tools', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'read_file', arguments: { path: 'README.md' } },
        { success: true, content: 'hello world' },
      ),
    ).toBeNull()
  })

  it('returns first command word when no result is present', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'git status --short' } },
        null,
      ),
    ).toBe('git')
  })

  it('joins command text with output text on success', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'git status --short' } },
        { success: true, content: 'M file.ts\n branch main\n' },
      ),
    ).toBe('git status --short:M file.ts branch main')
  })

  it('keeps both words when output has exactly two words', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'git status' } },
        { success: true, content: 'no changes' },
      ),
    ).toBe('git status:no changes')
  })

  it('balances long command and output previews by character budget', () => {
    const preview = getExecuteCommandResultPreview(
      { name: 'execute_command', arguments: { command: 'pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.response-history.test.ts' } },
      { success: true, content: 'Test Files 1 passed (1) Tests 19 passed Duration 1.41s with a longer trailing output summary' },
    )

    expect(preview).not.toBeNull()
    expect(preview!.length).toBeLessThanOrEqual(96)
    const [commandPreview, outputPreview] = preview!.split(':')
    expect(commandPreview).toBe('pnpm --filter @dotagents/desktop exec vitest...')
    expect(outputPreview).toBe('Test Files 1 passed (1) Tests 19 passed Durat...')
  })

  it('extracts stdout from structured execute_command JSON before picking the output word', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'git status --short' } },
        {
          success: true,
          content: JSON.stringify({
            success: true,
            command: 'git status --short',
            cwd: '/repo',
            stdout: 'M file.ts\n branch main\n',
            stderr: '',
          }, null, 2),
        },
      ),
    ).toBe('git status --short:M file.ts branch main')
  })

  it('combines structured stdout and stderr in the output side', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'pnpm build' } },
        {
          success: false,
          content: JSON.stringify({ success: false, stdout: 'compiled files', stderr: 'warning emitted' }, null, 2),
        },
      ),
    ).toBe('pnpm build:compiled files warning emitted')
  })

  it('combines plain stdout content and error text when both are present', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'python script.py' } },
        { success: false, content: 'partial stdout', error: 'stderr traceback' },
      ),
    ).toBe('python script.py:partial stdout stderr traceback')
  })

  it('does not leak structured execute_command metadata when stdout is empty', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'echo' } },
        {
          success: true,
          content: JSON.stringify({ success: true, command: 'echo', cwd: '/repo', stdout: '', stderr: '' }, null, 2),
        },
      ),
    ).toBe('echo')
  })

  it('extracts stdout from structured failed execute_command results when present', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'pnpm test' } },
        {
          success: false,
          content: JSON.stringify({
            success: false,
            error: 'Command failed',
            stdout: 'Tests failed in chat-utils.test.ts\n',
            stderr: '',
          }, null, 2),
          error: JSON.stringify({
            success: false,
            error: 'Command failed',
            stdout: 'Tests failed in chat-utils.test.ts\n',
            stderr: '',
          }, null, 2),
        },
      ),
    ).toBe('pnpm test:Tests failed in chat-utils.test.ts')
  })

  it('falls back to the only word when output has just one token', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'pwd' } },
        { success: true, content: '/home\n' },
      ),
    ).toBe('pwd:/home')
  })

  it('uses error text when the command failed', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'pnpm test' } },
        { success: false, content: '', error: 'exit code 1' },
      ),
    ).toBe('pnpm test:exit code 1')
  })

  it('returns first word when output is empty whitespace', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: { command: 'echo' } },
        { success: true, content: '   \n' },
      ),
    ).toBe('echo')
  })

  it('handles JSON-string arguments', () => {
    expect(
      getExecuteCommandResultPreview(
        { name: 'execute_command', arguments: '{"command":"ls -la"}' as unknown as Record<string, unknown> },
        { success: true, content: 'total 8\ndrwxr-xr-x . user' },
      ),
    ).toBe('ls -la:total 8 drwxr-xr-x . user')
  })
})

describe('getCompactToolExecutionPreview', () => {
  it('uses command output previews for completed execute_command rows', () => {
    expect(
      getCompactToolExecutionPreview(
        { name: 'execute_command', arguments: { command: 'git status --short' } },
        { success: true, content: 'M file.ts\n branch main\n' },
      ),
    ).toBe('git status --short:M file.ts branch main')
  })

  it('uses tool result previews for non-command tools when available', () => {
    expect(
      getCompactToolExecutionPreview(
        { name: 'load_skill_instructions', arguments: { skillId: 'agent-skill-creation' } },
        { success: true, content: '# Agent Skill Creation\n\nDetailed instructions...' },
      ),
    ).toBe('load_skill_instructions:# Agent Skill Creation')
  })

  it('falls back to the per-tool preview while a tool is still pending', () => {
    expect(
      getCompactToolExecutionPreview(
        { name: 'execute_command', arguments: { command: 'pnpm test' } },
        null,
      ),
    ).toBe('pnpm test')
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

  it('extracts video markdown from respond_to_user videos[].url', () => {
    const args = {
      text: 'Watch this:',
      videos: [{ label: 'demo clip', url: 'assets://conversation-video/conv_1/demo.mp4' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('Watch this:\n\n[demo clip](assets://conversation-video/conv_1/demo.mp4)')
  })

  it('skips path-only videos until the runtime materializes them as asset URLs', () => {
    const args = {
      text: 'Saved locally:',
      videos: [{ label: 'local demo', path: '/tmp/demo.mp4' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('Saved locally:')
  })

  it('sanitizes markdown-sensitive video labels', () => {
    const args = {
      videos: [{ label: 'demo [draft] (v1)', url: 'https://example.com/demo.mp4' }],
    }

    expect(extractRespondToUserContentFromArgs(args)).toBe('[demo draft v1](https://example.com/demo.mp4)')
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
