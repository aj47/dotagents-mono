import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acpService } from '../acp-service'

const { mockRunInternalSubSession } = vi.hoisted(() => ({
  mockRunInternalSubSession: vi.fn(),
}))

const { mockGetByName, mockGetById } = vi.hoisted(() => ({
  mockGetByName: vi.fn(() => undefined),
  mockGetById: vi.fn(() => undefined),
}))

vi.mock('./acp-client-service', () => ({
  acpClientService: { getRunStatus: vi.fn(), runAgentAsync: vi.fn() },
}))

vi.mock('./acp-background-notifier', () => ({
  acpBackgroundNotifier: { setDelegatedRunsMap: vi.fn(), startPolling: vi.fn() },
}))

vi.mock('../config', () => ({
  configStore: {
    get: vi.fn(() => ({
      acpAgents: [
        {
          name: 'test-agent',
          enabled: true,
          connection: { type: 'stdio' },
        },
      ],
    })),
  },
}))
vi.mock('../acp-service', () => ({
  acpService: { getAgentSessionId: vi.fn(), runTask: vi.fn(), spawnAgent: vi.fn(() => Promise.resolve({})), on: vi.fn() },
}))
vi.mock('../emit-agent-progress', () => ({ emitAgentProgress: vi.fn() }))
vi.mock('../state', () => ({ agentSessionStateManager: { getSessionRunId: vi.fn(() => 7) } }))
vi.mock('../agent-profile-service', () => ({
  agentProfileService: {
    getByName: mockGetByName,
    getById: mockGetById,
    getByIdentifier: vi.fn((identifier: string) => mockGetByName(identifier) ?? mockGetById(identifier)),
  },
}))
vi.mock('../agent-run-utils', () => ({
  buildProfileContext: vi.fn(),
  getPreferredDelegationOutput: vi.fn((output: string, conversation: Array<{ role: string; content: string }>) => {
    const latestAssistant = [...conversation].reverse().find((msg) => msg.role === 'assistant')
    return latestAssistant?.content ?? output
  }),
}))

vi.mock('./internal-agent', () => ({
  runInternalSubSession: mockRunInternalSubSession,
  cancelSubSession: vi.fn(),
  getInternalAgentInfo: vi.fn(() => ({
    name: 'internal',
    displayName: 'Internal Agent',
    description: 'Built-in internal agent',
    maxRecursionDepth: 2,
    maxConcurrent: 2,
  })),
  getSessionDepth: vi.fn(() => 0),
  generateSubSessionId: vi.fn(() => 'subsession-1'),
}))

import {
  cleanupOldDelegatedRuns,
  handleCheckAgentStatus,
  handleDelegateToAgent,
} from './acp-router-tools'

describe('handleDelegateToAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetByName.mockReset()
    mockGetByName.mockReturnValue(undefined)
    mockGetById.mockReset()
    mockGetById.mockReturnValue(undefined)
  })

  afterEach(() => {
    cleanupOldDelegatedRuns(-1)
  })

  it('returns immediately for internal waitForResult=false and later exposes the completed result', async () => {
    let resolveRun!: (value: any) => void
    mockRunInternalSubSession.mockReturnValue(
      new Promise((resolve) => {
        resolveRun = resolve
      }),
    )

    const initial = await handleDelegateToAgent(
      { agentName: 'internal', task: 'Investigate this', waitForResult: false },
      'parent-session-1',
    ) as {
      runId: string;
      status: string;
      agentName: string;
      message: string;
      note?: string;
    }

    expect(initial).toMatchObject({
      success: true,
      status: 'running',
      agentName: 'internal',
      note: expect.stringContaining('avoid repeated status polling'),
    })
    expect(initial.message).toContain('Avoid tight polling in the same run')
    expect(mockRunInternalSubSession).toHaveBeenCalledWith(expect.objectContaining({
      task: 'Investigate this',
      parentSessionId: 'parent-session-1',
      subSessionId: 'subsession-1',
    }))

    await expect(handleCheckAgentStatus({ runId: initial.runId })).resolves.toMatchObject({
      success: true,
      status: 'running',
      recommendedAction: 'continue_other_work_or_report_running',
      nextSuggestedPollSeconds: 15,
      note: expect.stringContaining('avoid repeated status polling'),
    })

    resolveRun({
      success: true,
      result: 'Fallback output',
      conversationHistory: [
        { role: 'user', content: 'Investigate this', timestamp: 1 },
        { role: 'assistant', content: 'Final delegated answer', timestamp: 2 },
      ],
    })
    await vi.waitFor(async () => {
      await expect(handleCheckAgentStatus({ runId: initial.runId })).resolves.toMatchObject({
        success: true,
        status: 'completed',
        output: 'Final delegated answer',
      })
    })
  })

  it('fails delegated runs that only return an in-progress update instead of a final result', async () => {
    mockRunInternalSubSession.mockResolvedValue({
      success: true,
      result: 'Fallback output',
      conversationHistory: [
        { role: 'user', content: 'Tile the windows', timestamp: 1 },
        {
          role: 'assistant',
          content: 'I can see the windows are partially arranged but still overlapping. Let me do a more precise tiling pass now.',
          timestamp: 2,
        },
      ],
    })

    await expect(handleDelegateToAgent(
      { agentName: 'internal', task: 'Tile the windows neatly' },
      'parent-session-2',
    )).resolves.toMatchObject({
      success: false,
      status: 'failed',
      error: expect.stringContaining('without a final deliverable'),
    })
  })

  it('fails long reasoning-style delegated output that never reaches concrete results', async () => {
    mockRunInternalSubSession.mockResolvedValue({
      success: true,
      result: 'Fallback output',
      conversationHistory: [
        { role: 'user', content: 'Execute and return only concrete results', timestamp: 1 },
        {
          role: 'assistant',
          content: [
            '**Analyzing the codebase**',
            '',
            "I'm considering the current worktree state and I need to inspect the issue details before I patch anything.",
            '',
            "Next I'll verify the current tests and then I’ll decide which files to edit.",
          ].join('\n'),
          timestamp: 2,
        },
      ],
    })

    await expect(handleDelegateToAgent(
      { agentName: 'internal', task: 'Return only concrete results' },
      'parent-session-3',
    )).resolves.toMatchObject({
      success: false,
      status: 'failed',
      error: expect.stringContaining('without a final deliverable'),
    })
  })

  it('still accepts structured delegated summaries that lead with completed work', async () => {
    mockRunInternalSubSession.mockResolvedValue({
      success: true,
      result: 'Fallback output',
      conversationHistory: [
        { role: 'user', content: 'Summarize the concrete changes', timestamp: 1 },
        {
          role: 'assistant',
          content: [
            'Done.',
            '',
            '- Updated `apps/desktop/src/main/acp/acp-router-tools.ts`',
            '- Added a regression test for reasoning-only delegation output',
          ].join('\n'),
          timestamp: 2,
        },
      ],
    })

    await expect(handleDelegateToAgent(
      { agentName: 'internal', task: 'Summarize the concrete changes' },
      'parent-session-4',
    )).resolves.toMatchObject({
      success: true,
      status: 'completed',
      output: expect.stringContaining('Updated `apps/desktop/src/main/acp/acp-router-tools.ts`'),
    })
  })

  it('fails stalled synchronous ACP delegations instead of waiting indefinitely', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(acpService.runTask).mockImplementation(() => new Promise(() => {}))

      const resultPromise = handleDelegateToAgent(
        { agentName: 'test-agent', task: 'Finish the next step' },
        'parent-session-5',
      )

      await vi.advanceTimersByTimeAsync(120_000)

      await expect(resultPromise).resolves.toMatchObject({
        success: false,
        status: 'failed',
        error: expect.stringContaining('did not complete within 120s'),
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('forces a fresh ACP session for each synchronous delegated run', async () => {
    vi.mocked(acpService.runTask).mockResolvedValue({
      success: true,
      result: 'Fresh delegated result',
    })

    await expect(handleDelegateToAgent(
      { agentName: 'test-agent', task: 'Post the prepared recap now' },
      'parent-session-6',
    )).resolves.toMatchObject({
      success: true,
      status: 'completed',
    })

    expect(acpService.runTask).toHaveBeenCalledWith(expect.objectContaining({
      agentName: 'test-agent',
      input: 'Post the prepared recap now',
      forceNewSession: true,
      mode: 'sync',
    }))
  })

  it('forces a fresh ACP session for each async stdio delegated run', async () => {
    vi.mocked(acpService.runTask).mockResolvedValue({
      success: true,
      result: 'Queued delegated result',
    })

    await expect(handleDelegateToAgent(
      { agentName: 'test-agent', task: 'Watch for updates in the background', waitForResult: false },
      'parent-session-7',
    )).resolves.toMatchObject({
      success: true,
      status: 'running',
    })

    expect(acpService.runTask).toHaveBeenCalledWith(expect.objectContaining({
      agentName: 'test-agent',
      input: 'Watch for updates in the background',
      forceNewSession: true,
      mode: 'async',
    }))
  })

  it('accepts agent profile IDs and canonicalizes them before ACP delegation', async () => {
    mockGetById.mockReturnValue({
      id: '286c6b41-28ed-4a57-9728-0bab9846ebe6',
      name: 'augustus',
      displayName: 'augustus',
      description: 'Augment Code coding agent',
      enabled: true,
      connection: {
        type: 'acp',
      },
    })
    vi.mocked(acpService.runTask).mockResolvedValue({
      success: true,
      result: '/Users/ajjoobandi/Development/dotagents-mono',
    })

    await expect(handleDelegateToAgent(
      {
        agentName: '286c6b41-28ed-4a57-9728-0bab9846ebe6',
        task: 'Run pwd and return exact output',
      },
      'parent-session-8',
    )).resolves.toMatchObject({
      success: true,
      status: 'completed',
      agentName: 'augustus',
      output: '/Users/ajjoobandi/Development/dotagents-mono',
    })

    expect(acpService.spawnAgent).toHaveBeenCalledWith('augustus', expect.any(Object))
    expect(acpService.runTask).toHaveBeenCalledWith(expect.objectContaining({
      agentName: 'augustus',
      input: 'Run pwd and return exact output',
      mode: 'sync',
    }))
  })
})
