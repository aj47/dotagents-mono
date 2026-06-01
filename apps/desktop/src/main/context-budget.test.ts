import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockConfig,
  makeTextCompletionWithFetchMock,
  fetchModelsDevDataMock,
  getModelFromModelsDevByProviderIdMock,
} = vi.hoisted(() => ({
  mockConfig: {
    mcpContextReductionEnabled: true,
    mcpContextTargetRatio: 0.5,
    mcpContextLastNMessages: 3,
    mcpContextSummarizeCharThreshold: 2000,
    mcpMaxContextTokensOverride: 1200,
    mcpToolsProviderId: 'openai',
    mcpToolsOpenaiModel: 'gpt-4.1-mini',
  },
  makeTextCompletionWithFetchMock: vi.fn(),
  fetchModelsDevDataMock: vi.fn(),
  getModelFromModelsDevByProviderIdMock: vi.fn(),
}))

vi.mock('./config', () => ({
  configStore: { get: () => mockConfig },
}))

vi.mock('./debug', () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

vi.mock('./llm-fetch', () => ({
  makeTextCompletionWithFetch: makeTextCompletionWithFetchMock,
}))

vi.mock('./models-dev-service', () => ({
  fetchModelsDevData: fetchModelsDevDataMock,
  getModelFromModelsDevByProviderId: getModelFromModelsDevByProviderIdMock,
}))

vi.mock('./system-prompts', () => ({
  constructMinimalSystemPrompt: () => '[minimal system prompt]',
}))

vi.mock('./state', () => ({
  agentSessionStateManager: {
    shouldStopSession: () => false,
  },
}))

vi.mock('./summarization-service', () => ({
  summarizationService: {
    getSummaries: () => [],
    getImportantSummaries: () => [],
  },
}))

vi.mock('@dotagents/shared', () => ({
  RESPOND_TO_USER_TOOL: 'respond_to_user',
  sanitizeMessageContentForDisplay: (content: string) => content,
}))

import {
  clearActualTokenUsage,
  clearArchiveFrontier,
  clearContextRefs,
  clearIterativeSummary,
  readMoreContext,
  recordActualTokenUsage,
  registerContextRef,
  shrinkMessagesForLLM,
} from './context-budget'

describe('shrinkMessagesForLLM replacement policy', () => {
  beforeEach(() => {
    makeTextCompletionWithFetchMock.mockReset()
    fetchModelsDevDataMock.mockReset()
    fetchModelsDevDataMock.mockResolvedValue({})
    getModelFromModelsDevByProviderIdMock.mockReset()
    getModelFromModelsDevByProviderIdMock.mockReturnValue(undefined)
    clearArchiveFrontier('session-truncate')
    clearArchiveFrontier('session-batch')
    clearArchiveFrontier('session-archive')
    clearArchiveFrontier('session-live-tail')
    clearArchiveFrontier('session-protected-tail')
    clearArchiveFrontier('session-actual-scale')
    clearArchiveFrontier('session-bracket-log')
    clearArchiveFrontier('session-no-microcompact')
    clearArchiveFrontier('session-archive-reapply')
    clearArchiveFrontier('session-latest-user')
    clearArchiveFrontier('session-pinned-context')
    clearArchiveFrontier('session-archive-tail')
    clearContextRefs('session-truncate')
    clearContextRefs('session-batch')
    clearContextRefs('session-archive')
    clearContextRefs('session-live-tail')
    clearContextRefs('session-protected-tail')
    clearContextRefs('session-actual-scale')
    clearContextRefs('session-bracket-log')
    clearContextRefs('session-no-microcompact')
    clearContextRefs('session-archive-reapply')
    clearContextRefs('session-latest-user')
    clearContextRefs('session-pinned-context')
    clearContextRefs('session-archive-tail')
    clearActualTokenUsage('session-truncate')
    clearActualTokenUsage('session-batch')
    clearActualTokenUsage('session-archive')
    clearActualTokenUsage('session-live-tail')
    clearActualTokenUsage('session-protected-tail')
    clearActualTokenUsage('session-actual-scale')
    clearActualTokenUsage('session-bracket-log')
    clearActualTokenUsage('session-no-microcompact')
    clearActualTokenUsage('session-archive-reapply')
    clearActualTokenUsage('session-latest-user')
    clearActualTokenUsage('session-pinned-context')
    clearActualTokenUsage('session-archive-tail')
    clearIterativeSummary('session-archive')
    clearIterativeSummary('session-batch')
    clearIterativeSummary('session-live-tail')
    clearIterativeSummary('session-protected-tail')
    clearIterativeSummary('session-no-microcompact')
    clearIterativeSummary('session-archive-reapply')
    clearIterativeSummary('session-latest-user')
    clearIterativeSummary('session-pinned-context')
    clearIterativeSummary('session-archive-tail')
    Object.assign(mockConfig, {
      mcpContextReductionEnabled: true,
      mcpContextTargetRatio: 0.5,
      mcpContextLastNMessages: 3,
      mcpContextSummarizeCharThreshold: 2000,
      mcpMaxContextTokensOverride: 1200,
      mcpToolsProviderId: 'openai',
      mcpToolsOpenaiModel: 'gpt-4.1-mini',
    })
  })

  it('prefers models.dev context limits before registry fallback', async () => {
    Object.assign(mockConfig, {
      mcpContextReductionEnabled: false,
      mcpMaxContextTokensOverride: undefined,
      mcpToolsProviderId: 'openai',
      mcpToolsOpenaiModel: 'gpt-5.4',
    })
    getModelFromModelsDevByProviderIdMock.mockReturnValue({
      id: 'gpt-5.4',
      name: 'GPT-5.4',
      limit: { context: 1_050_000, output: 32_000 },
    })

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-models-dev-limit',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'hello' },
      ],
    })

    expect(fetchModelsDevDataMock).toHaveBeenCalledTimes(1)
    expect(getModelFromModelsDevByProviderIdMock).toHaveBeenCalledWith('gpt-5.4', 'openai')
    expect(result.maxTokens).toBe(1_050_000)
  })

  it('falls back to the registry when models.dev has no context limit', async () => {
    Object.assign(mockConfig, {
      mcpContextReductionEnabled: false,
      mcpMaxContextTokensOverride: undefined,
      mcpToolsProviderId: 'openai',
      mcpToolsOpenaiModel: 'gpt-4.1-mini',
    })

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-registry-fallback',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'hello' },
      ],
    })

    expect(fetchModelsDevDataMock).toHaveBeenCalledTimes(1)
    expect(result.maxTokens).toBe(128_000)
  })

  it('keeps explicit context overrides ahead of models.dev lookups', async () => {
    Object.assign(mockConfig, {
      mcpContextReductionEnabled: false,
      mcpMaxContextTokensOverride: 4321,
      mcpToolsProviderId: 'openai',
      mcpToolsOpenaiModel: 'gpt-5.4-override-check',
    })
    getModelFromModelsDevByProviderIdMock.mockReturnValue({
      id: 'gpt-5.4-override-check',
      name: 'GPT-5.4 override check',
      limit: { context: 1_050_000, output: 32_000 },
    })

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-context-override',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'hello' },
      ],
    })

    expect(fetchModelsDevDataMock).not.toHaveBeenCalled()
    expect(result.maxTokens).toBe(4321)
  })

  it('truncates oversized tool results before tier-1 summarization', async () => {
    const toolPayload = `[server:search] ${'x'.repeat(4500)}`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    expect(makeTextCompletionWithFetchMock).not.toHaveBeenCalled()
    expect(result.appliedStrategies).toContain('aggressive_truncate')
    const truncatedMessage = result.messages.find((msg) => msg.content.includes('Large tool result truncated for context management'))
    expect(truncatedMessage).toBeTruthy()
    const contextRef = truncatedMessage?.content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()

    const readResult = readMoreContext('session-truncate', contextRef!, { mode: 'tail', maxChars: 120 })
    expect(readResult).toEqual(expect.objectContaining({ success: true, contextRef }))
    expect(String(readResult.excerpt)).toContain('x'.repeat(50))
  })

  it('preserves both head and tail when truncating mapped tool results', async () => {
    const toolPayload = `[server:search] HEAD-${'a'.repeat(2200)}-MIDDLE-${'b'.repeat(2200)}-TAIL`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'user', content: toolPayload },
      ],
    })

    expect(result.appliedStrategies).toContain('aggressive_truncate')
    const truncatedMessage = result.messages.find((msg) => msg.content.includes('Large tool result truncated for context management'))
    expect(truncatedMessage?.content).toContain('HEAD-')
    expect(truncatedMessage?.content).toContain('-TAIL')
  })

  it('describes what was elided inline at the cut point and keeps the ref in place', async () => {
    const toolPayload = [
      '[server:search] HEAD-MARKER',
      'a'.repeat(1300),
      'https://example.com/one https://example.com/two',
      '{"status":"ok","results":[1,2,3],"items":[]}',
      'b'.repeat(3000),
      'TAIL-MARKER',
    ].join(' ')

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-elision',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    expect(result.appliedStrategies).toContain('aggressive_truncate')
    const truncated = result.messages.find((msg) => msg.content.includes('Large tool result truncated for context management'))
    expect(truncated).toBeTruthy()
    const content = truncated!.content

    // head + tail are both kept inline so the gap is visible in place
    expect(content).toContain('HEAD-MARKER')
    expect(content).toContain('TAIL-MARKER')

    // the marker self-describes the elided span: size, fingerprint, and ref
    expect(content).toMatch(/≈\d+ chars elided/)
    expect(content).toContain('contains:')
    expect(content).toContain('URLs')
    expect(content).toContain('JSON keys')

    // ref is still recoverable from the inline marker
    const contextRef = content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()
    const recovered = readMoreContext('session-elision', contextRef!, { mode: 'search', query: 'example.com' })
    expect(recovered).toEqual(expect.objectContaining({ success: true }))
    expect(Number(recovered.matchCount)).toBeGreaterThan(0)
  })

  it('does not re-truncate already truncated runtime tool output', async () => {
    const runtimeTruncated = [
      '[server:shell] {',
      '  "stdout": "HEAD-123',
      '... [OUTPUT TRUNCATED: 25000 bytes, ~500 lines total. Showing first 5000 + last 5000 chars.] ...',
      '456-TAIL",',
      '  "outputTruncated": true',
      '}',
    ].join('\n')

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'user', content: runtimeTruncated },
      ],
    })

    expect(result.appliedStrategies).not.toContain('aggressive_truncate')
    expect(result.messages.find((msg) => msg.content.includes('[OUTPUT TRUNCATED:'))?.content).toContain('456-TAIL')
    expect(makeTextCompletionWithFetchMock).not.toHaveBeenCalled()
  })

  it('keeps actual-token scaling after aggressive truncation and preserves the original budget baseline', async () => {
    const toolPayload = `[server:search] ${'x'.repeat(4500)}`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      actualInputTokens: 2000,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'user', content: toolPayload },
      ],
    })

    expect(result.appliedStrategies).toContain('aggressive_truncate')
    expect(result.appliedStrategies).toContain('minimal_system_prompt')
    expect(result.estTokensBefore).toBe(2000)
    expect(result.estTokensAfter).toBeGreaterThan(600)
  })

  it('preserves the initial token baseline when actual usage comes from session state', async () => {
    const toolPayload = `[server:search] ${'x'.repeat(4500)}`
    recordActualTokenUsage('session-actual-scale', 2100, 120)

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-actual-scale',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'user', content: toolPayload },
      ],
    })

    expect(result.appliedStrategies).toContain('aggressive_truncate')
    expect(result.estTokensBefore).toBe(2100)
    expect(result.estTokensAfter).toBeGreaterThan(600)
  })

  it('does not treat bracketed user logs as mapped tool results or JSON payloads', async () => {
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 10000,
    })

    const bracketedLog = `[INFO] ${'x'.repeat(5500)}`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-bracket-log',
      lastNMessages: 1,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'keep this log verbatim' },
        { role: 'assistant', content: 'acknowledged' },
        { role: 'user', content: bracketedLog },
      ],
    })

    expect(result.appliedStrategies).not.toContain('aggressive_truncate')
    expect(result.messages[result.messages.length - 1]?.content).toBe(bracketedLog)
  })

  it('batch-summarizes contiguous oversized conversational messages in one call', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('condensed findings and decisions')

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-batch',
      lastNMessages: 1,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'Original user request' },
        { role: 'assistant', content: 'a'.repeat(2600) },
        { role: 'user', content: 'b'.repeat(2400) },
        { role: 'assistant', content: 'c'.repeat(2300) },
        { role: 'user', content: 'latest follow up' },
      ],
    })

    expect(makeTextCompletionWithFetchMock).toHaveBeenCalledTimes(1)
    expect(result.appliedStrategies).toContain('batch_summarize')
    expect(result.messages).toHaveLength(4)
    const summaryMessage = result.messages.find((msg) => msg.content.includes('[Earlier Context Summary: 3 messages]'))
    expect(summaryMessage).toBeTruthy()
    const contextRef = summaryMessage?.content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()

    const readResult = readMoreContext('session-batch', contextRef!, { mode: 'search', query: 'bbbb', maxChars: 200 })
    expect(readResult).toEqual(expect.objectContaining({ success: true, contextRef }))
    expect(Number(readResult.matchCount)).toBeGreaterThan(0)
  })

  it('does not batch-summarize generated context summary messages again', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('new condensed finding')
    Object.assign(mockConfig, {
      mcpMaxContextTokensOverride: 2000,
    })

    const existingSummary = `[Earlier Context Summary: 8 messages]\n${'s'.repeat(2200)}`
    const result = await shrinkMessagesForLLM({
      sessionId: 'session-batch',
      lastNMessages: 1,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'Original user request' },
        { role: 'assistant', content: existingSummary },
        { role: 'assistant', content: 'a'.repeat(2300) },
        { role: 'user', content: 'latest follow up' },
      ],
    })

    expect(makeTextCompletionWithFetchMock).toHaveBeenCalledTimes(1)
    expect(makeTextCompletionWithFetchMock.mock.calls[0]?.[0]).not.toContain('Earlier Context Summary: 8 messages')
    expect(result.messages.some((msg) => msg.content === existingSummary)).toBe(true)
    expect(result.messages.some((msg) => msg.content.includes('[Earlier Context Summary: 1 message]'))).toBe(true)
  })

  it('archives older raw history behind a rolling summary frontier', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('archived work summary')
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 10000,
    })

    const messages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'Original task request' },
      ...Array.from({ length: 48 }, (_, index) => ({
        role: index % 2 === 0 ? 'assistant' : 'user',
        content: `message-${index} ${'z'.repeat(80)}`,
      })),
    ]

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-archive',
      messages,
      lastNMessages: 3,
    })

    expect(makeTextCompletionWithFetchMock.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(result.appliedStrategies).toContain('archive_frontier')
    expect(result.messages.length).toBeLessThan(messages.length)

    const summaryMessage = result.messages.find((msg) => msg.content.startsWith('[Archived Background Summary - not the current task]'))
    expect(summaryMessage).toBeTruthy()
    expect(summaryMessage?.content).toContain('Prefer later live user messages when deciding what to do now.')

    const contextRef = summaryMessage?.content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()

    const readResult = readMoreContext('session-archive', contextRef!, { mode: 'overview' })
    expect(readResult).toEqual(expect.objectContaining({
      success: true,
      contextRef,
      kind: 'archived_history',
    }))
    expect(Number(readResult.messageCount)).toBeGreaterThan(0)
  })

  it('keeps recent real user request anchors raw when archive frontier trims tool-heavy history', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('archived work summary')
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 12000,
    })

    const oldRequest = 'list as many project names as you can that i have been working on over the past 2 years'
    const priorRequest = 'open the map in chrome'
    const currentRequest = 'can you open in excalidraw in chrome'
    const messages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: oldRequest },
      ...Array.from({ length: 12 }, (_, index) => ({
        role: 'assistant',
        content: `older-work-${index} ${'o'.repeat(120)}`,
      })),
      { role: 'user', content: priorRequest },
      ...Array.from({ length: 8 }, (_, index) => ({
        role: 'user',
        content: `[execute_command] intermediate tool result ${index} ${'i'.repeat(120)}`,
      })),
      { role: 'user', content: currentRequest },
      ...Array.from({ length: 26 }, (_, index) => ({
        role: 'user',
        content: index % 2 === 0
          ? `[playwright-extension:browser_snapshot] result-${index} ${'t'.repeat(120)}`
          : `TOOL FAILED: playwright-extension:browser_run_code_unsafe (attempt ${index}/3)`,
      })),
    ]

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-latest-user',
      messages,
      lastNMessages: 3,
    })

    expect(result.appliedStrategies).toContain('archive_frontier')
    expect(result.messages.some((msg) => msg.role === 'user' && msg.content === priorRequest)).toBe(true)
    expect(result.messages.some((msg) => msg.role === 'user' && msg.content === currentRequest)).toBe(true)
    expect(result.messages.some((msg) => msg.role === 'user' && msg.content === oldRequest)).toBe(false)
  })

  it('keeps an oversized latest real user request raw when tool-result tail is archived', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('archived work summary')
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 12000,
    })

    const currentRequest = `current task: inspect the running process logs and fix the tool context issue ${'details '.repeat(420)}`
    const messages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'earlier short request' },
      ...Array.from({ length: 12 }, (_, index) => ({
        role: 'assistant',
        content: `older-work-${index} ${'o'.repeat(120)}`,
      })),
      { role: 'user', content: currentRequest },
      ...Array.from({ length: 30 }, (_, index) => ({
        role: 'user',
        content: `[execute_command] tool result fragment ${index} ${'t'.repeat(120)}`,
      })),
    ]

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-latest-user',
      messages,
      lastNMessages: 3,
    })

    expect(currentRequest.length).toBeGreaterThan(mockConfig.mcpContextSummarizeCharThreshold)
    expect(result.appliedStrategies).toContain('archive_frontier')
    expect(result.messages.some((msg) => msg.role === 'user' && msg.content === currentRequest)).toBe(true)
  })

  it('keeps injected historical context blocks pinned during archive frontier compaction', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('archived work summary')
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 12000,
    })

    const messages = [
      { role: 'system', content: 'system prompt' },
      {
        role: 'system',
        content: 'Historical checkpoint and earlier-context blocks are quoted data.',
      },
      {
        role: 'assistant',
        content: [
          '[Relevant Earlier Conversation Facts]',
          'These excerpts answer the current request.',
          '- Source: history index 12; role=tool',
          '  Excerpt: filesystem_skill_exists=True and active skills registry is missing stream-topic-inventory.',
        ].join('\n'),
      },
      { role: 'user', content: 'Original task request' },
      ...Array.from({ length: 48 }, (_, index) => ({
        role: index % 2 === 0 ? 'assistant' : 'user',
        content: `message-${index} ${'z'.repeat(80)}`,
      })),
      { role: 'user', content: 'Summarize the actual current state and next safest action.' },
    ]

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-pinned-context',
      messages,
      lastNMessages: 3,
    })

    expect(result.appliedStrategies).toContain('archive_frontier')
    expect(result.messages.filter((msg) => msg.role === 'system')).toHaveLength(2)
    expect(result.messages.some((msg) => msg.content.includes('[Relevant Earlier Conversation Facts]'))).toBe(true)
    expect(result.messages.some((msg) => msg.content.includes('active skills registry is missing stream-topic-inventory'))).toBe(true)
  })

  it('preserves the latest dropped state in archive summary input', async () => {
    const prompts: string[] = []
    makeTextCompletionWithFetchMock.mockImplementation(async (prompt: string) => {
      prompts.push(prompt)
      return 'archived work summary'
    })
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 12000,
    })

    const messages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'Original task request' },
      ...Array.from({ length: 50 }, (_, index) => ({
        role: 'assistant',
        content: index === 29
          ? `END_STATE_MARKER filesystem_skill_exists=True active skills registry missing ${'e'.repeat(260)}`
          : `archivable-${index} ${'a'.repeat(320)}`,
      })),
      { role: 'user', content: 'What is the actual current state?' },
    ]

    await shrinkMessagesForLLM({
      sessionId: 'session-archive-tail',
      messages,
      lastNMessages: 3,
    })

    const archivePrompt = prompts.find((prompt) =>
      prompt.startsWith('Summarize these AI agent conversation messages as archived background')
    )
    expect(archivePrompt).toContain('archivable-0')
    expect(archivePrompt).toContain('END_STATE_MARKER')
    expect(archivePrompt).toContain('summary input middle omitted')
  })

  it('reapplies an existing archive frontier even when too few new messages arrived to advance it', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('archived work summary')
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 10000,
    })

    const baseMessages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'Original task request' },
      ...Array.from({ length: 48 }, (_, index) => ({
        role: index % 2 === 0 ? 'assistant' : 'user',
        content: `message-${index} ${'z'.repeat(80)}`,
      })),
    ]

    const first = await shrinkMessagesForLLM({
      sessionId: 'session-archive-reapply',
      messages: baseMessages,
      lastNMessages: 3,
    })
    expect(first.appliedStrategies).toContain('archive_frontier')
    expect(first.messages.length).toBeLessThan(baseMessages.length)

    const followUpMessages = [
      ...baseMessages,
      { role: 'assistant', content: 'new but not enough to advance archive' },
      { role: 'user', content: 'latest follow up' },
    ]

    const second = await shrinkMessagesForLLM({
      sessionId: 'session-archive-reapply',
      messages: followUpMessages,
      lastNMessages: 3,
    })

    expect(makeTextCompletionWithFetchMock).toHaveBeenCalledTimes(1)
    expect(second.appliedStrategies).toContain('archive_frontier')
    expect(second.messages.length).toBeLessThan(followUpMessages.length)
    expect(second.messages.some((msg) => msg.content.startsWith('[Archived Background Summary - not the current task]'))).toBe(true)
  })

  it('keeps search-mode excerpts within maxChars even for long queries', async () => {
    const toolPayload = `[server:search] prefix ${'abc'.repeat(1400)} suffix`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    const truncatedMessage = result.messages.find((msg) => msg.content.includes('Large tool result truncated for context management'))
    const contextRef = truncatedMessage?.content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()

    const longQuery = 'abc'.repeat(40)
    const readResult = readMoreContext('session-truncate', contextRef!, { mode: 'search', query: longQuery, maxChars: 200 })
    expect(readResult).toEqual(expect.objectContaining({ success: true, contextRef }))
    expect(Number(readResult.matchCount)).toBeGreaterThan(0)

    const firstMatch = (readResult.matches as Array<{ excerpt: string }>)[0]
    expect(firstMatch.excerpt.length).toBeLessThanOrEqual(200)
    expect(firstMatch.excerpt).toContain(longQuery)
  })

  it('skips tool-result truncation when comfortably under budget', async () => {
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 10000,
    })

    const toolPayload = `[server:search] ${'u'.repeat(4500)}`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    expect(result.appliedStrategies).not.toContain('aggressive_truncate')
    expect(result.messages.some((msg) => msg.content.includes('Large tool result truncated for context management'))).toBe(false)
    expect(result.messages.find((msg) => msg.role === 'tool')?.content).toContain('u'.repeat(200))
  })

  it('allows larger read_more_context excerpts for direct recovery modes', async () => {
    const toolPayload = `[server:search] START-${'x'.repeat(14000)}-END`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      actualInputTokens: 5000,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    const truncatedMessage = result.messages.find((msg) => msg.content.includes('Large tool result truncated for context management'))
    const contextRef = truncatedMessage?.content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()

    const defaultRead = readMoreContext('session-truncate', contextRef!, { mode: 'head' })
    expect(defaultRead).toEqual(expect.objectContaining({ success: true, contextRef, returnedChars: 1500 }))

    const expandedRead = readMoreContext('session-truncate', contextRef!, { mode: 'tail', maxChars: 9000 })
    expect(expandedRead).toEqual(expect.objectContaining({ success: true, contextRef, returnedChars: 9000 }))
    expect(String(expandedRead.excerpt)).toContain('-END')
  })

  it('keeps search-mode read_more_context capped even when larger maxChars is requested', async () => {
    const toolPayload = `[server:search] prefix ${'abc'.repeat(3000)} suffix`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      actualInputTokens: 5000,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    const truncatedMessage = result.messages.find((msg) => msg.content.includes('Large tool result truncated for context management'))
    const contextRef = truncatedMessage?.content.match(/Context ref: (ctx_[a-z0-9]+)/)?.[1]
    expect(contextRef).toBeTruthy()

    const searchRead = readMoreContext('session-truncate', contextRef!, {
      mode: 'search',
      query: 'abcabcabcabc',
      maxChars: 12000,
    })

    expect(searchRead).toEqual(expect.objectContaining({ success: true, contextRef }))
    const firstMatch = (searchRead.matches as Array<{ excerpt: string }>)[0]
    expect(firstMatch.excerpt.length).toBeLessThanOrEqual(2500)
  })

  it('reapplies archive frontier even when there is no new overflow', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('archived work summary')
    Object.assign(mockConfig, {
      mcpContextSummarizeCharThreshold: 10000,
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 12000,
    })

    const messages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'Original task request' },
      ...Array.from({ length: 44 }, (_, index) => ({
        role: index % 2 === 0 ? 'assistant' : 'user',
        content: `live-marker-${index} ${'q'.repeat(120)}`,
      })),
    ]

    await shrinkMessagesForLLM({
      sessionId: 'session-live-tail',
      messages,
      lastNMessages: 3,
    })

    const secondPass = await shrinkMessagesForLLM({
      sessionId: 'session-live-tail',
      messages,
      lastNMessages: 3,
    })

    expect(secondPass.appliedStrategies).toContain('archive_frontier')
    expect(makeTextCompletionWithFetchMock).toHaveBeenCalledTimes(1)
    expect(secondPass.messages.length).toBeLessThan(messages.length)
    expect(secondPass.messages.some((msg) => msg.content.includes('live-marker-43'))).toBe(true)
    expect(secondPass.messages.some((msg) => msg.content.startsWith('[Archived Background Summary - not the current task]'))).toBe(true)
  })

  it('skips microcompact when context is comfortably under budget', async () => {
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 10000,
    })

    const messages = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'task request' },
      ...Array.from({ length: 10 }, (_, index) => ({
        role: 'tool',
        content: `[tool-${index}] result-${index} ${'d'.repeat(600)}`,
      })),
      { role: 'user', content: 'continue' },
    ]

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-no-microcompact',
      messages,
    })

    expect(result.appliedStrategies).not.toContain('microcompact')
    expect(result.messages.filter((msg) => msg.role === 'tool')).toHaveLength(10)
    expect(result.messages.some((msg) => msg.content.includes('[Tool result cleared for context management]'))).toBe(false)
  })

  it('summarizes mapped user-role tool results before drop_middle removes them', async () => {
    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.5,
      mcpContextSummarizeCharThreshold: 10000,
      mcpMaxContextTokensOverride: 300,
    })

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-no-microcompact',
      lastNMessages: 1,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'task request' },
        { role: 'user', content: '[execute_command] discovered target file path' },
        { role: 'assistant', content: `verbose intermediate reasoning ${'r'.repeat(2500)}` },
        { role: 'user', content: 'latest follow up' },
      ],
    })

    expect(result.appliedStrategies).toContain('drop_middle')
    expect(result.toolResultsSummarized).toBe(true)
    expect(result.messages.some((msg) => msg.content.includes('Previously executed tools:'))).toBe(true)
    expect(result.messages.some((msg) => msg.content.includes('[execute_command] discovered target file path'))).toBe(true)
  })

  it('keeps truncated payload messages protected after archive frontier reorders messages', async () => {
    const prompts: string[] = []
    makeTextCompletionWithFetchMock.mockImplementation(async (prompt: string) => {
      prompts.push(prompt)
      if (prompt.includes('Summarize these AI agent conversation messages as archived background')) {
        return 'archived work summary'
      }

      return 'condensed remaining conversation'
    })

    Object.assign(mockConfig, {
      mcpContextTargetRatio: 0.95,
      mcpMaxContextTokensOverride: 4000,
      mcpContextSummarizeCharThreshold: 600,
    })

    const oversizedPayload = JSON.stringify({
      kind: 'payload',
      body: 'p'.repeat(6000),
    })

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-protected-tail',
      lastNMessages: 1,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'Original user request' },
        ...Array.from({ length: 13 }, (_, index) => ({
          role: index % 2 === 0 ? 'assistant' : 'user',
          content: `archivable-${index} ${'r'.repeat(750)}`,
        })),
        { role: 'assistant', content: oversizedPayload },
        { role: 'assistant', content: `remaining-summary-target ${'s'.repeat(2200)}` },
        { role: 'user', content: 'latest follow up' },
      ],
    })

    const batchSummaryPrompts = prompts.filter((prompt) => prompt.startsWith('Compress these earlier conversation messages'))
    expect(batchSummaryPrompts.length).toBeGreaterThan(0)
    expect(batchSummaryPrompts.some((prompt) => prompt.includes('Payload truncated for context management'))).toBe(false)

    expect(result.messages.some((msg) => msg.content.includes('condensed remaining conversation'))).toBe(true)
  })
})

describe('registerContextRef export for MCP tool summarization', () => {
  beforeEach(() => {
    clearContextRefs('session-mcp-ref')
  })

  it('registers a ref that read_more_context can resolve', () => {
    const original = `full tool output ${'z'.repeat(1000)} END`
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: original,
      toolName: 'exa:web_search_advanced_exa',
    })

    expect(ref).toMatch(/^ctx_[a-z0-9]+$/)

    const overview = readMoreContext('session-mcp-ref', ref!)
    expect(overview).toEqual(expect.objectContaining({
      success: true,
      contextRef: ref,
      kind: 'truncated_tool',
      toolName: 'exa:web_search_advanced_exa',
      totalChars: original.length,
    }))

    const search = readMoreContext('session-mcp-ref', ref!, { mode: 'search', query: 'END' })
    expect(search).toEqual(expect.objectContaining({ success: true, matchCount: 1 }))
  })

  it('honors exact short search queries instead of dropping them as fallback needles', () => {
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: 'compare O1 and EB1 options for the consultation',
    })

    const search = readMoreContext('session-mcp-ref', ref!, { mode: 'search', query: 'O1' })

    expect(search).toEqual(expect.objectContaining({ success: true, matchCount: 1 }))
    expect(JSON.stringify(search)).toContain('O1')
  })

  it('returns undefined when sessionId is missing', () => {
    const ref = registerContextRef(undefined, {
      kind: 'truncated_tool',
      role: 'tool',
      content: 'anything',
    })
    expect(ref).toBeUndefined()
  })

  it('overview includes description, scope, and suggested next calls', () => {
    const original = `tool payload ${'z'.repeat(5000)} END`
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: original,
      toolName: 'exa:web_search_advanced_exa',
    })

    const overview = readMoreContext('session-mcp-ref', ref!)

    expect(overview.success).toBe(true)
    expect(typeof overview.description).toBe('string')
    expect(String(overview.description)).toContain('exa:web_search_advanced_exa')
    expect(overview.searchScope).toBe('underlying_payload')

    const scope = overview.scope as Record<string, unknown>
    expect(scope).toEqual(expect.objectContaining({
      kind: 'truncated_tool',
      role: 'tool',
      toolName: 'exa:web_search_advanced_exa',
      totalChars: original.length,
    }))

    const suggested = overview.suggestedCalls as Array<{ description: string; call: Record<string, unknown> }>
    expect(Array.isArray(suggested)).toBe(true)
    expect(suggested.length).toBeGreaterThan(1)
    expect(suggested.some((s) => s.call.mode === 'search')).toBe(true)
    expect(suggested.some((s) => s.call.mode === 'head')).toBe(true)
  })

  it('overview surfaces a content digest of what the payload contains', () => {
    const original = `{"status":"ok","results":[1,2]} see https://example.com/a and https://example.com/b`
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: original,
    })

    const overview = readMoreContext('session-mcp-ref', ref!)

    expect(overview.success).toBe(true)
    expect(typeof overview.contentDigest).toBe('string')
    expect(String(overview.contentDigest)).toContain('URLs')
    expect(String(overview.contentDigest)).toContain('JSON keys')
  })

  it('head/tail/window return nextWindow / previousWindow navigation hints', () => {
    const original = `START-${'y'.repeat(20000)}-MID-${'q'.repeat(20000)}-END`
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_payload',
      role: 'user',
      content: original,
    })

    const head = readMoreContext('session-mcp-ref', ref!, { mode: 'head', maxChars: 1000 })
    expect(head.success).toBe(true)
    expect(head.nextWindow).toEqual(expect.objectContaining({ mode: 'window', offset: 1000 }))
    expect(head.previousWindow).toBeUndefined()

    const tail = readMoreContext('session-mcp-ref', ref!, { mode: 'tail', maxChars: 1000 })
    expect(tail.success).toBe(true)
    expect(tail.previousWindow).toEqual(expect.objectContaining({ mode: 'window' }))
    expect(tail.nextWindow).toBeUndefined()

    const win = readMoreContext('session-mcp-ref', ref!, { mode: 'window', offset: 5000, length: 1000 })
    expect(win.success).toBe(true)
    expect(win.previousWindow).toEqual(expect.objectContaining({ mode: 'window' }))
    expect(win.nextWindow).toEqual(expect.objectContaining({ mode: 'window', offset: 6000 }))

    const fullHead = readMoreContext('session-mcp-ref', ref!, { mode: 'head', maxChars: 12000 })
    expect(fullHead.success).toBe(true)
    expect(fullHead.nextWindow).toEqual(expect.objectContaining({ mode: 'window', offset: 12000 }))
  })

  it('search finds case-, punctuation-, and underscore-insensitive matches via normalized matching', () => {
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: 'before HIDDEN_AUDIT_TOKEN=abc123 after',
    })

    const search = readMoreContext('session-mcp-ref', ref!, {
      mode: 'search',
      query: 'hidden audit token',
    })

    expect(search.success).toBe(true)
    expect(Number(search.matchCount)).toBeGreaterThan(0)
    const matches = search.matches as Array<Record<string, unknown>>
    expect(matches[0].matchType).toBe('normalized')
    expect(String(matches[0].excerpt)).toContain('HIDDEN_AUDIT_TOKEN')
    expect(matches[0]).toEqual(expect.objectContaining({
      matchedQuery: 'hidden audit token',
    }))
    expect(matches[0].expandCall).toEqual(expect.objectContaining({ mode: 'window' }))
  })

  it('labels exact, case-insensitive, and normalized matches with the right matchType', () => {
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: 'alpha BetaToken gamma delta foo_bar_value baz',
    })

    const exact = readMoreContext('session-mcp-ref', ref!, { mode: 'search', query: 'BetaToken' })
    const exactMatches = exact.matches as Array<Record<string, unknown>>
    expect(exactMatches[0]?.matchType).toBe('exact')

    const ci = readMoreContext('session-mcp-ref', ref!, { mode: 'search', query: 'betatoken' })
    const ciMatches = ci.matches as Array<Record<string, unknown>>
    expect(ciMatches[0]?.matchType).toBe('case_insensitive')

    const norm = readMoreContext('session-mcp-ref', ref!, { mode: 'search', query: 'foo bar value' })
    const normMatches = norm.matches as Array<Record<string, unknown>>
    expect(normMatches[0]?.matchType).toBe('normalized')
    expect(String(normMatches[0]?.excerpt)).toContain('foo_bar_value')
  })

  it('zero-result searches explain what was tried and how to recover', () => {
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: 'nothing useful in here at all',
    })

    const search = readMoreContext('session-mcp-ref', ref!, { mode: 'search', query: 'completely-absent-thing' })

    expect(search.success).toBe(true)
    expect(search.matchCount).toBe(0)
    expect(search.searchedChars).toBe('nothing useful in here at all'.length)
    expect(search.searchScope).toBe('underlying_payload')

    const tried = search.needlesTried as Array<Record<string, unknown>>
    expect(Array.isArray(tried)).toBe(true)
    expect(tried.length).toBeGreaterThan(0)
    expect(tried.every((t) => t.found === false)).toBe(true)

    expect(typeof search.suggestion).toBe('string')
    expect(String(search.suggestion)).toContain('No matches')
  })

  it('search results include a per-match expandCall for fetching the surrounding window', () => {
    const ref = registerContextRef('session-mcp-ref', {
      kind: 'truncated_tool',
      role: 'tool',
      content: `prefix ${'x'.repeat(2000)} NEEDLE ${'y'.repeat(2000)} suffix`,
    })

    const search = readMoreContext('session-mcp-ref', ref!, {
      mode: 'search',
      query: 'NEEDLE',
      maxChars: 400,
    })

    expect(search.success).toBe(true)
    const matches = search.matches as Array<Record<string, unknown>>
    expect(matches.length).toBe(1)
    const expand = matches[0].expandCall as Record<string, number | string>
    expect(expand.mode).toBe('window')
    expect(typeof expand.offset).toBe('number')
    expect(typeof expand.length).toBe('number')

    const expanded = readMoreContext('session-mcp-ref', ref!, {
      mode: 'window',
      offset: expand.offset as number,
      length: expand.length as number,
    })
    expect(String(expanded.excerpt)).toContain('NEEDLE')
  })
})
