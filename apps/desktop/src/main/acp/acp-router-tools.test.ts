import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAcpService = Object.assign(new EventEmitter(), {
  spawnAgent: vi.fn(),
  getOrCreateSession: vi.fn(),
  sendPrompt: vi.fn(),
  getAgentSessionId: vi.fn(),
  on: EventEmitter.prototype.on,
})

vi.mock('./acp-client-service', () => ({
  acpClientService: {},
}))

vi.mock('./acp-router-tool-definitions', () => ({
  acpRouterToolDefinitions: [],
  resolveToolName: (toolName: string) => toolName,
}))

vi.mock('./acp-background-notifier', () => ({
  acpBackgroundNotifier: {
    setDelegatedRunsMap: vi.fn(),
    startPolling: vi.fn(),
    resumeParentSessionIfNeeded: vi.fn(),
  },
}))

vi.mock('../config', () => ({
  configStore: {
    get: () => ({
      acpAgents: [
        {
          name: 'Web Browser',
          enabled: true,
          connection: { type: 'stdio', command: 'mock-web-browser' },
        },
      ],
    }),
  },
}))

vi.mock('../acp-service', () => ({
  acpService: mockAcpService,
  ACPContentBlock: {},
}))

vi.mock('../agent-run-utils', () => ({
  buildProfileContext: vi.fn((profile, context) => context ?? profile?.guidelines ?? ''),
  getPreferredDelegationOutput: vi.fn((output: string) => output),
}))

vi.mock('../emit-agent-progress', () => ({
  emitAgentProgress: vi.fn(),
}))

vi.mock('../state', () => ({
  agentSessionStateManager: {
    getSessionRunId: vi.fn(() => 1),
  },
}))

vi.mock('./internal-agent', () => ({
  runInternalSubSession: vi.fn(),
  cancelSubSession: vi.fn(),
  getInternalAgentInfo: vi.fn(),
  getSessionDepth: vi.fn(() => 0),
  generateSubSessionId: vi.fn(() => 'sub-session-1'),
}))

vi.mock('../agent-profile-service', () => ({
  agentProfileService: {
    getByName: vi.fn(() => null),
  },
}))

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('acp-router-tools synchronous delegation reuse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAcpService.spawnAgent.mockResolvedValue({})
    mockAcpService.getOrCreateSession.mockResolvedValue('acp-session-1')
    mockAcpService.getAgentSessionId.mockReturnValue('acp-session-1')
  })

  it('reuses an in-flight sync delegation instead of starting a concurrent prompt on the same agent session', async () => {
    const deferred = createDeferred<{ success: boolean; response: string }>()
    mockAcpService.sendPrompt.mockReturnValueOnce(deferred.promise)

    const { executeACPRouterTool } = await import('./acp-router-tools')

    const firstCall = executeACPRouterTool(
      'delegate_to_agent',
      { agentName: 'Web Browser', task: 'Phase 6 retry', waitForResult: true },
      'parent-session-1',
    )

    await vi.waitFor(() => {
      expect(mockAcpService.sendPrompt).toHaveBeenCalledTimes(1)
    })

    const secondCall = executeACPRouterTool(
      'delegate_to_agent',
      { agentName: 'Web Browser', task: 'Continue Phase 6 safely', waitForResult: true },
      'parent-session-1',
    )

    expect(mockAcpService.sendPrompt).toHaveBeenCalledTimes(1)

    deferred.resolve({ success: true, response: 'Did not post; composer remained unstable.' })

    const firstResult = JSON.parse((await firstCall).content)
    const secondResult = JSON.parse((await secondCall).content)

    expect(firstResult).toMatchObject({
      success: true,
      status: 'completed',
      output: 'Did not post; composer remained unstable.',
    })
    expect(secondResult).toMatchObject({
      success: true,
      status: 'completed',
      output: 'Did not post; composer remained unstable.',
    })
    expect(secondResult.runId).toBe(firstResult.runId)
    expect(secondResult.note).toContain('Reused in-flight delegated run')
    expect(mockAcpService.getOrCreateSession).toHaveBeenCalledTimes(1)
    expect(mockAcpService.sendPrompt).toHaveBeenCalledTimes(1)
  })
})