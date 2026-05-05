import { describe, it, expect } from 'vitest'
import {
  shouldCollapseMessage,
  getToolCallsSummary,
  getToolCallPreview,
  getIndividualToolCallPreview,
  getToolResultsSummary,
  getToolArgumentEntries,
  formatToolArguments,
  formatArgumentsPreview,
  formatConversationHistoryForApi,
  RESPOND_TO_USER_TOOL,
  MARK_WORK_COMPLETE_TOOL,
  buildChatCompletionDoneSsePayload,
  buildChatCompletionErrorSsePayload,
  buildChatCompletionProgressSsePayload,
  buildChatCompletionRequestBody,
  buildDotAgentsChatCompletionResponse,
  buildOpenAIChatCompletionResponse,
  buildOpenAICompatibleModelsResponse,
  buildProviderModelsResponse,
  extractUserPromptFromChatCompletionBody,
  extractRespondToUserContentFromArgs,
  extractRespondToUserResponseEvents,
  formatServerSentEventData,
  getLatestRespondToUserContentFromConversationHistory,
  getNextAgentUserResponseEventOrdinal,
  getOrderedRespondToUserContentsFromToolCalls,
  getUnmaterializedUserResponseEvents,
  normalizeUserFacingResponseContent,
  parseChatCompletionRequestBody,
  parseChatCompletionSseEvent,
  resolveMessageTimestamps,
  resolveLatestUserFacingResponse,
  sanitizeMessagesForRequest,
  sortAgentUserResponseEvents,
  getRenderableMessageContent,
  getRespondToUserContentFromMessage,
  getVisibleMessageContent,
  isToolOnlyMessage,
  isInternalCompletionControlMessage,
  looksLikeToolPayloadContent,
  stripRawToolTextFromContent,
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

describe('sanitizeMessagesForRequest', () => {
  it('removes render-only tool executions from request messages', () => {
    const sanitized = sanitizeMessagesForRequest([{
      role: 'assistant' as const,
      content: '',
      toolCalls: [
        { name: 'first_tool', arguments: { a: 1 } },
        { name: 'second_tool', arguments: { b: 2 } },
      ],
      toolResults: [{ success: true, content: 'ok' }],
      toolExecutions: [
        { toolCall: { name: 'first_tool', arguments: { a: 1 } } },
        { toolCall: { name: 'second_tool', arguments: { b: 2 } }, result: { success: true, content: 'ok' } },
      ],
    }])

    expect(sanitized[0].toolExecutions).toBeUndefined()
    expect(sanitized[0].toolCalls).toBeUndefined()
    expect(sanitized[0].toolResults).toBeUndefined()
  })

  it('drops misaligned tool calls but keeps valid tool results', () => {
    const sanitized = sanitizeMessagesForRequest([{
      role: 'assistant' as const,
      content: '',
      toolCalls: [
        { name: 'first_tool', arguments: { a: 1 } },
        { name: 'second_tool', arguments: { b: 2 } },
      ],
      toolResults: [{ success: true, content: 'single-result' }],
    }])

    expect(sanitized[0].toolCalls).toBeUndefined()
    expect(sanitized[0].toolResults).toEqual([
      { success: true, content: 'single-result' },
    ])
  })

  it('removes display-only content before model replay', () => {
    const sanitized = sanitizeMessagesForRequest([{
      role: 'assistant' as const,
      content: 'Final answer',
      displayContent: '<think>reasoning</think>\n\nFinal answer',
    }])

    expect(sanitized[0].content).toBe('Final answer')
    expect(sanitized[0].displayContent).toBeUndefined()
  })
})

describe('formatConversationHistoryForApi', () => {
  it('normalizes persisted tool calls and MCP-style tool results', () => {
    expect(formatConversationHistoryForApi([{
      role: 'assistant',
      content: 'Checking',
      displayContent: '<hidden>Checking',
      toolCalls: [{ name: 'search', arguments: { query: 'weather' } }],
      toolResults: [{
        content: [
          { type: 'text', text: 'first line' },
          { type: 'text', text: 'second line' },
        ],
        isError: false,
      }],
      timestamp: 10,
    }])).toEqual([{
      role: 'assistant',
      content: 'Checking',
      toolCalls: [{ name: 'search', arguments: { query: 'weather' } }],
      toolResults: [{ success: true, content: 'first line\nsecond line', error: undefined }],
      timestamp: 10,
    }])
  })

  it('normalizes failed stored tool results without exposing display-only content', () => {
    expect(formatConversationHistoryForApi([{
      role: 'tool',
      content: 'Tool failed',
      displayContent: 'Rendered failure',
      toolCalls: [{ name: 'bad_args', arguments: 'raw' }],
      toolResults: [{
        success: false,
        content: 'permission denied',
      }],
    }])).toEqual([{
      role: 'tool',
      content: 'Tool failed',
      toolCalls: [{ name: 'bad_args', arguments: {} }],
      toolResults: [{
        success: false,
        content: 'permission denied',
        error: 'permission denied',
      }],
      timestamp: undefined,
    }])
  })
})

describe('buildChatCompletionRequestBody', () => {
  it('builds the OpenAI-compatible request body with DotAgents extensions', () => {
    expect(buildChatCompletionRequestBody({
      model: 'gpt-4.1',
      messages: [{
        role: 'assistant',
        content: 'Final answer',
        displayContent: '<think>hidden</think>\n\nFinal answer',
      }],
      conversationId: ' conv-1 ',
      profileId: ' profile-1 ',
      sendPushNotification: false,
    })).toEqual({
      model: 'gpt-4.1',
      messages: [{ role: 'assistant', content: 'Final answer' }],
      stream: true,
      conversation_id: 'conv-1',
      profile_id: 'profile-1',
      send_push_notification: false,
    })
  })

  it('omits blank optional DotAgents extension fields', () => {
    expect(buildChatCompletionRequestBody({
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
      conversationId: '   ',
      profileId: '',
    })).toEqual({
      model: undefined,
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    })
  })
})

describe('extractUserPromptFromChatCompletionBody', () => {
  it('extracts the most recent user message content', () => {
    expect(extractUserPromptFromChatCompletionBody({
      messages: [
        { role: 'user', content: 'old question' },
        { role: 'assistant', content: 'answer' },
        { role: 'user', content: '  latest question  ' },
      ],
    })).toBe('latest question')
  })

  it('normalizes array and object content blocks', () => {
    expect(extractUserPromptFromChatCompletionBody({
      messages: [
        {
          role: 'user',
          content: [
            'first',
            { text: 'second' },
            { content: 'third' },
            { image_url: { url: 'ignored' } },
          ],
        },
      ],
    })).toBe('first second third')

    expect(extractUserPromptFromChatCompletionBody({
      messages: [
        {
          role: 'user',
          content: { text: 'from object' },
        },
      ],
    })).toBe('from object')
  })

  it('falls back to prompt and input fields', () => {
    expect(extractUserPromptFromChatCompletionBody({
      prompt: [{ text: 'from prompt' }],
    })).toBe('from prompt')

    expect(extractUserPromptFromChatCompletionBody({
      input: ' from input ',
    })).toBe('from input')
  })

  it('returns null when no non-empty user prompt is present', () => {
    expect(extractUserPromptFromChatCompletionBody({
      messages: [
        { role: 'assistant', content: 'answer' },
        { role: 'user', content: '   ' },
      ],
      prompt: '',
      input: [{ image_url: { url: 'ignored' } }],
    })).toBeNull()

    expect(extractUserPromptFromChatCompletionBody(null)).toBeNull()
  })
})

describe('buildOpenAIChatCompletionResponse', () => {
  it('formats a non-streaming OpenAI-compatible chat response', () => {
    expect(buildOpenAIChatCompletionResponse('Done', 'gpt-test', {
      id: 'chatcmpl-fixed',
      created: 1710000000,
    })).toEqual({
      id: 'chatcmpl-fixed',
      object: 'chat.completion',
      created: 1710000000,
      model: 'gpt-test',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Done' },
          finish_reason: 'stop',
        },
      ],
    })
  })
})

describe('buildDotAgentsChatCompletionResponse', () => {
  it('adds DotAgents conversation fields to the OpenAI-compatible chat response', () => {
    expect(buildDotAgentsChatCompletionResponse({
      content: 'Done',
      model: 'gpt-test',
      conversationId: 'conv-1',
      conversationHistory: [{ role: 'assistant', content: 'Done' }],
      id: 'chatcmpl-fixed',
      created: 1710000000,
    })).toEqual({
      id: 'chatcmpl-fixed',
      object: 'chat.completion',
      created: 1710000000,
      model: 'gpt-test',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Done' },
          finish_reason: 'stop',
        },
      ],
      conversation_id: 'conv-1',
      conversation_history: [{ role: 'assistant', content: 'Done' }],
    })
  })
})

describe('buildOpenAICompatibleModelsResponse', () => {
  it('formats OpenAI-compatible model list responses', () => {
    expect(buildOpenAICompatibleModelsResponse([
      'gpt-test',
      { id: 'custom-model', object: 'model', owned_by: 'workspace' },
    ])).toEqual({
      object: 'list',
      data: [
        { id: 'gpt-test', object: 'model', owned_by: 'system' },
        { id: 'custom-model', object: 'model', owned_by: 'workspace' },
      ],
    })
  })
})

describe('buildProviderModelsResponse', () => {
  it('formats provider model list responses with supported model fields only', () => {
    expect(buildProviderModelsResponse('openai', [
      {
        id: 'gpt-test',
        name: 'GPT Test',
        description: 'Test model',
        context_length: 128000,
        extra: 'ignored',
      } as any,
    ])).toEqual({
      providerId: 'openai',
      models: [{
        id: 'gpt-test',
        name: 'GPT Test',
        description: 'Test model',
        context_length: 128000,
      }],
    })
  })
})

describe('parseChatCompletionRequestBody', () => {
  it('parses the prompt and DotAgents request extensions', () => {
    expect(parseChatCompletionRequestBody({
      messages: [{ role: 'user', content: 'Hello' }],
      conversation_id: 'conv-1',
      profile_id: 'profile-1',
      stream: true,
      send_push_notification: false,
    })).toEqual({
      prompt: 'Hello',
      conversationId: 'conv-1',
      profileId: 'profile-1',
      stream: true,
      sendPushNotification: false,
    })
  })

  it('normalizes absent request extensions to route defaults', () => {
    expect(parseChatCompletionRequestBody({
      input: 'Fallback',
      conversation_id: '',
      profile_id: '',
      stream: false,
    })).toEqual({
      prompt: 'Fallback',
      conversationId: undefined,
      profileId: undefined,
      stream: false,
      sendPushNotification: true,
    })
  })
})

describe('chat completion SSE payload builders', () => {
  it('builds and formats progress, done, and error payloads consumed by the parser', () => {
    const progress = buildChatCompletionProgressSsePayload({
      sessionId: 's1',
      currentIteration: 1,
      maxIterations: 5,
      steps: [],
      isComplete: false,
      streamingContent: { text: 'hi', isStreaming: true },
    })
    const done = buildChatCompletionDoneSsePayload({
      content: 'Finished',
      conversationId: 'conv-1',
      conversationHistory: [{ role: 'assistant', content: 'Finished' }],
      model: 'gpt-test',
    })
    const error = buildChatCompletionErrorSsePayload('Boom')

    expect(parseChatCompletionSseEvent(formatServerSentEventData(progress))).toEqual([{
      type: 'progress',
      update: {
        sessionId: 's1',
        currentIteration: 1,
        maxIterations: 5,
        steps: [],
        isComplete: false,
        streamingContent: { text: 'hi', isStreaming: true },
      },
    }])

    expect(parseChatCompletionSseEvent(formatServerSentEventData(done))).toEqual([{
      type: 'complete',
      content: 'Finished',
      conversationId: 'conv-1',
      conversationHistory: [{ role: 'assistant', content: 'Finished' }],
      model: 'gpt-test',
    }])

    expect(formatServerSentEventData(error)).toBe('data: {"type":"error","data":{"message":"Boom"}}\n\n')
    expect(parseChatCompletionSseEvent(formatServerSentEventData(error))).toEqual([
      { type: 'error', message: 'Boom' },
    ])
  })
})

describe('parseChatCompletionSseEvent', () => {
  it('parses DotAgents progress, completion, and error events', () => {
    expect(parseChatCompletionSseEvent(
      'data: {"type":"progress","data":{"sessionId":"s1","currentStep":"thinking","isComplete":false,"streamingContent":{"text":"hi"}}}\n\n',
    )).toEqual([{
      type: 'progress',
      update: {
        sessionId: 's1',
        currentStep: 'thinking',
        isComplete: false,
        streamingContent: { text: 'hi' },
      },
    }])

    expect(parseChatCompletionSseEvent(
      'data: {"type":"done","data":{"content":"Finished","conversation_id":"conv-1","conversation_history":[{"role":"assistant","content":"Finished"}]}}\n\n',
    )).toEqual([{
      type: 'complete',
      content: 'Finished',
      conversationId: 'conv-1',
      conversationHistory: [{ role: 'assistant', content: 'Finished' }],
    }])

    expect(parseChatCompletionSseEvent(
      'data: {"type":"error","data":{"message":"Boom"}}\n\n',
    )).toEqual([{ type: 'error', message: 'Boom' }])
  })

  it('parses OpenAI delta tokens and done markers', () => {
    expect(parseChatCompletionSseEvent([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}',
      'data: {"choices":[{"delta":{"content":"lo"}}]}',
      'data: [DONE]',
    ].join('\n'))).toEqual([
      { type: 'token', token: 'Hel' },
      { type: 'token', token: 'lo' },
      { type: 'done' },
    ])
  })

  it('ignores malformed or empty SSE lines', () => {
    expect(parseChatCompletionSseEvent('data: {not-json}\n\nevent: ping\n\n')).toEqual([])
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

describe('respond_to_user response resolution helpers', () => {
  it('normalizes blank user-facing response content to undefined', () => {
    expect(normalizeUserFacingResponseContent('  answer  ')).toBe('  answer  ')
    expect(normalizeUserFacingResponseContent('   ')).toBeUndefined()
    expect(normalizeUserFacingResponseContent(null)).toBeUndefined()
  })

  it('keeps ordered respond_to_user entries from mixed tool calls', () => {
    expect(getOrderedRespondToUserContentsFromToolCalls([
      { name: RESPOND_TO_USER_TOOL, arguments: { text: '1. First option\n2. Second option' } },
      { name: 'web_search', arguments: { query: 'ignored' } },
      { name: RESPOND_TO_USER_TOOL, arguments: { text: 'Please reply with the numbers you want.' } },
    ])).toEqual([
      '1. First option\n2. Second option',
      'Please reply with the numbers you want.',
    ])
  })

  it('returns unmaterialized response events', () => {
    const responseEvents = [
      { id: 'evt-1', sessionId: 'session-1', runId: 5, ordinal: 1, text: '1. First option', timestamp: 10 },
      { id: 'evt-2', sessionId: 'session-1', runId: 5, ordinal: 2, text: 'Please reply with the numbers you want.', timestamp: 11 },
    ]

    expect(getUnmaterializedUserResponseEvents(responseEvents, [])).toEqual(responseEvents)
    expect(getUnmaterializedUserResponseEvents(responseEvents, ['evt-1'])).toEqual([responseEvents[1]])
  })

  it('sorts response events by run id, ordinal, then timestamp', () => {
    const events = [
      { id: 'evt-3', sessionId: 'session-1', runId: 2, ordinal: 2, text: 'second', timestamp: 10 },
      { id: 'evt-1', sessionId: 'session-1', runId: 1, ordinal: 2, text: 'older second', timestamp: 9 },
      { id: 'evt-2', sessionId: 'session-1', runId: 2, ordinal: 1, text: 'first', timestamp: 12 },
      { id: 'evt-4', sessionId: 'session-1', runId: 2, ordinal: 2, text: 'second earlier', timestamp: 8 },
    ]

    expect(sortAgentUserResponseEvents(events).map(event => event.id)).toEqual(['evt-1', 'evt-2', 'evt-4', 'evt-3'])
  })

  it('computes the next response event ordinal', () => {
    expect(getNextAgentUserResponseEventOrdinal([])).toBe(1)
    expect(getNextAgentUserResponseEventOrdinal([
      { id: 'evt-1', sessionId: 'session-1', ordinal: 2, text: 'Two', timestamp: 1 },
      { id: 'evt-2', sessionId: 'session-1', ordinal: 7, text: 'Seven', timestamp: 2 },
    ])).toBe(8)
  })

  it('falls back to the latest respond_to_user entry in conversation history', () => {
    expect(getLatestRespondToUserContentFromConversationHistory([
      { role: 'assistant', toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Earlier' } }] },
      { role: 'tool', toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Ignored' } }] },
      { role: 'assistant', toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Latest' } }] },
    ])).toBe('Latest')
  })

  it('can scope conversation-history fallback to the current turn', () => {
    expect(getLatestRespondToUserContentFromConversationHistory([
      { role: 'assistant', toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Earlier' } }] },
      { role: 'assistant', toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Current' } }] },
    ], 1)).toBe('Current')
  })

  it('resolves the latest user-facing response by priority', () => {
    expect(resolveLatestUserFacingResponse({
      storedResponse: 'Stale answer',
      plannedToolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Fresh answer' } }],
      conversationHistory: [{ role: 'assistant', toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Older history' } }] }],
    })).toBe('Fresh answer')

    expect(resolveLatestUserFacingResponse({
      storedResponse: 'Stored answer',
      responseEvents: [{ id: 'evt-1', sessionId: 'session-1', runId: 2, ordinal: 1, text: '', timestamp: 1 }],
    })).toBe('Stored answer')

    expect(resolveLatestUserFacingResponse({
      responseEvents: [
        { id: 'evt-1', sessionId: 'session-1', runId: 2, ordinal: 1, text: 'Visible answer', timestamp: 1 },
        { id: 'evt-2', sessionId: 'session-1', runId: 2, ordinal: 2, text: '   ', timestamp: 2 },
      ],
    })).toBe('Visible answer')
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

  it('can scope extraction and normalize provider-specific tool aliases', () => {
    const messages = [
      {
        role: 'assistant' as const,
        timestamp: 10,
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Previous run' } }],
      },
      {
        role: 'assistant' as const,
        timestamp: 20,
        toolCalls: [{ name: 'tool__respond_to_user', arguments: { text: 'Scoped alias' } }],
      },
    ]

    expect(extractRespondToUserResponseEvents(messages, {
      idPrefix: 'acp-session-1-3',
      runId: 3,
      sessionId: 'session-1',
      sinceIndex: 1,
      toolNameNormalizer: (name) => name.replace(/^tool__/, ''),
    })).toEqual([
      {
        id: 'acp-session-1-3-1-0-1',
        sessionId: 'session-1',
        runId: 3,
        ordinal: 1,
        text: 'Scoped alias',
        timestamp: 20,
      },
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

describe('visible message content helpers', () => {
  it('prefers displayContent when deriving renderable content', () => {
    expect(getRenderableMessageContent({ content: 'stored', displayContent: 'display' })).toBe('display')
    expect(getRenderableMessageContent({ content: 'stored' })).toBe('stored')
  })

  it('extracts respond_to_user content from assistant tool calls', () => {
    const message = {
      role: 'assistant' as const,
      content: '',
      toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: 'Visible answer' } }],
    }
    expect(getRespondToUserContentFromMessage(message)).toBe('Visible answer')
    expect(getVisibleMessageContent(message)).toBe('Visible answer')
  })

  it('hides tool role content and raw tool payload assistant messages', () => {
    expect(getVisibleMessageContent({ role: 'tool', content: 'raw result' })).toBe('')
    expect(getVisibleMessageContent({ role: 'assistant', content: 'tool result: {"ok":true}' })).toBe('')
    expect(getVisibleMessageContent({ role: 'assistant', content: '[execute_command] {"cmd":"ls"}' })).toBe('')
  })

  it('strips inline raw tool payloads from otherwise visible assistant content', () => {
    const content = 'Here is the answer.\n[execute_command] {"cmd":"ls"}'
    expect(stripRawToolTextFromContent(content)).toBe('Here is the answer.')
    expect(getVisibleMessageContent({ role: 'assistant', content })).toBe('Here is the answer.')
  })

  it('detects known raw tool payload patterns', () => {
    expect(looksLikeToolPayloadContent('<|tool_calls_section_begin|>')).toBe(true)
    expect(looksLikeToolPayloadContent('using tool: read_file')).toBe(true)
    expect(looksLikeToolPayloadContent('tool_call')).toBe(true)
    expect(looksLikeToolPayloadContent('recipient_name functions.exec_command')).toBe(true)
    expect(looksLikeToolPayloadContent('Normal assistant text')).toBe(false)
  })

  it('keeps ordinary assistant and user text visible', () => {
    expect(getVisibleMessageContent({ role: 'assistant', content: 'Normal assistant text' })).toBe('Normal assistant text')
    expect(getVisibleMessageContent({ role: 'user', content: 'Question' })).toBe('Question')
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
