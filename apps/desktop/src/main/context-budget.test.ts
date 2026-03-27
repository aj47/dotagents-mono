import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockConfig, makeTextCompletionWithFetchMock } = vi.hoisted(() => ({
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
  sanitizeMessageContentForDisplay: (content: string) => content,
}))

import {
  clearActualTokenUsage,
  clearArchiveFrontier,
  clearContextRefs,
  readMoreContext,
  recordActualTokenUsage,
  shrinkMessagesForLLM,
} from './context-budget'

describe('shrinkMessagesForLLM replacement policy', () => {
  beforeEach(() => {
    makeTextCompletionWithFetchMock.mockReset()
    clearArchiveFrontier('session-truncate')
    clearArchiveFrontier('session-batch')
    clearArchiveFrontier('session-archive')
    clearArchiveFrontier('session-live-tail')
    clearArchiveFrontier('session-protected-tail')
    clearArchiveFrontier('session-actual-scale')
    clearArchiveFrontier('session-bracket-log')
    clearContextRefs('session-truncate')
    clearContextRefs('session-batch')
    clearContextRefs('session-archive')
    clearContextRefs('session-live-tail')
    clearContextRefs('session-protected-tail')
    clearContextRefs('session-actual-scale')
    clearContextRefs('session-bracket-log')
    clearActualTokenUsage('session-truncate')
    clearActualTokenUsage('session-batch')
    clearActualTokenUsage('session-archive')
    clearActualTokenUsage('session-live-tail')
    clearActualTokenUsage('session-protected-tail')
    clearActualTokenUsage('session-actual-scale')
    clearActualTokenUsage('session-bracket-log')
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

  it('truncates oversized tool results before tier-1 summarization', async () => {
    const toolPayload = `[server:search] ${'x'.repeat(3500)}`

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

  it('keeps actual-token scaling after aggressive truncation and preserves the original budget baseline', async () => {
    const toolPayload = `[server:search] ${'x'.repeat(3500)}`

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
    const toolPayload = `[server:search] ${'x'.repeat(3500)}`
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

    const summaryMessage = result.messages.find((msg) => msg.content.startsWith('[Session Progress Summary]'))
    expect(summaryMessage).toBeTruthy()

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

  it('does not keep updating archived session summary when there is no new overflow', async () => {
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
    expect(secondPass.messages.some((msg) => msg.content.includes('live-marker-43'))).toBe(true)
    expect(secondPass.messages.some((msg) => msg.content.startsWith('[Session Progress Summary]'))).toBe(true)
  })

  it('keeps truncated payload messages protected after archive frontier reorders messages', async () => {
    const prompts: string[] = []
    makeTextCompletionWithFetchMock.mockImplementation(async (prompt: string) => {
      prompts.push(prompt)
      if (prompt.includes('Summarize these AI agent conversation messages that are being archived')) {
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
