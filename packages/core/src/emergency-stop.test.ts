import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies before import
vi.mock('./state', () => ({
  agentProcessManager: {
    getActiveProcessCount: vi.fn().mockReturnValue(3),
    emergencyStop: vi.fn(),
  },
  llmRequestAbortManager: { abortAll: vi.fn() },
  state: {
    isAgentModeActive: true,
    shouldStopAgent: false,
    agentIterationCount: 5,
    agentSessions: new Map(),
  },
  agentSessionStateManager: {
    stopAllSessions: vi.fn(),
    cleanupSession: vi.fn(),
  },
  toolApprovalManager: {
    cancelSessionApprovals: vi.fn(),
  },
}))

vi.mock('./emit-agent-progress', () => ({
  emitAgentProgress: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./agent-session-tracker', () => ({
  agentSessionTracker: {
    getActiveSessions: vi.fn().mockReturnValue([]),
    stopSession: vi.fn(),
  },
}))

vi.mock('./message-queue-service', () => ({
  messageQueueService: { pauseQueue: vi.fn() },
}))

vi.mock('./acp', () => ({
  acpProcessManager: { stopAllAgents: vi.fn().mockResolvedValue(undefined) },
  acpClientService: { cancelAllRuns: vi.fn() },
}))

vi.mock('./acp-service', () => ({
  acpService: { shutdown: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('./session-user-response-store', () => ({
  clearSessionUserResponse: vi.fn(),
}))

describe('emergencyStopAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stops all sessions and returns process counts', async () => {
    const { agentProcessManager } = await import('./state')
    vi.mocked(agentProcessManager.getActiveProcessCount)
      .mockReturnValueOnce(3)
      .mockReturnValueOnce(0)

    const { emergencyStopAll } = await import('./emergency-stop')
    const result = await emergencyStopAll()

    expect(result.before).toBe(3)
    expect(result.after).toBe(0)
  })

  it('resets agent state flags', async () => {
    const { state } = await import('./state')
    state.isAgentModeActive = true
    state.agentIterationCount = 5

    const { emergencyStopAll } = await import('./emergency-stop')
    await emergencyStopAll()

    expect(state.isAgentModeActive).toBe(false)
    expect(state.agentIterationCount).toBe(0)
  })

  it('calls stopAllSessions on session state manager', async () => {
    const { agentSessionStateManager } = await import('./state')

    const { emergencyStopAll } = await import('./emergency-stop')
    await emergencyStopAll()

    expect(agentSessionStateManager.stopAllSessions).toHaveBeenCalled()
  })

  it('aborts all LLM requests', async () => {
    const { llmRequestAbortManager } = await import('./state')

    const { emergencyStopAll } = await import('./emergency-stop')
    await emergencyStopAll()

    expect(llmRequestAbortManager.abortAll).toHaveBeenCalled()
  })

  it('cancels all ACP runs and shuts down ACP service', async () => {
    const { acpClientService } = await import('./acp')
    const { acpService } = await import('./acp-service')

    const { emergencyStopAll } = await import('./emergency-stop')
    await emergencyStopAll()

    expect(acpClientService.cancelAllRuns).toHaveBeenCalled()
    expect(acpService.shutdown).toHaveBeenCalled()
  })
})
