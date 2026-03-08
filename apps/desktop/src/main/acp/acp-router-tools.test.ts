import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockRunInternalSubSession = vi.fn()

vi.mock('./acp-client-service', () => ({
  acpClientService: { getRunStatus: vi.fn(), runAgentAsync: vi.fn() },
}))

vi.mock('./acp-background-notifier', () => ({
  acpBackgroundNotifier: { setDelegatedRunsMap: vi.fn(), startPolling: vi.fn() },
}))

vi.mock('../config', () => ({ configStore: { get: vi.fn(() => ({})) } }))
vi.mock('../acp-service', () => ({ acpService: { getAgentSessionId: vi.fn(), runTask: vi.fn() } }))
vi.mock('../emit-agent-progress', () => ({ emitAgentProgress: vi.fn() }))
vi.mock('../state', () => ({ agentSessionStateManager: { getSessionRunId: vi.fn(() => 7) } }))
vi.mock('../agent-profile-service', () => ({ agentProfileService: { getByName: vi.fn(() => undefined) } }))
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
    ) as { runId: string; status: string; agentName: string }

    expect(initial).toMatchObject({ success: true, status: 'running', agentName: 'internal' })
    expect(mockRunInternalSubSession).toHaveBeenCalledWith(expect.objectContaining({
      task: 'Investigate this',
      parentSessionId: 'parent-session-1',
      subSessionId: 'subsession-1',
    }))

    await expect(handleCheckAgentStatus({ runId: initial.runId })).resolves.toMatchObject({
      success: true,
      status: 'running',
    })

    resolveRun({
      success: true,
      result: 'Fallback output',
      conversationHistory: [
        { role: 'user', content: 'Investigate this', timestamp: 1 },
        { role: 'assistant', content: 'Final delegated answer', timestamp: 2 },
      ],
    })
    await Promise.resolve()

    await expect(handleCheckAgentStatus({ runId: initial.runId })).resolves.toMatchObject({
      success: true,
      status: 'completed',
      output: 'Final delegated answer',
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
})