import { beforeEach, describe, expect, it, vi } from "vitest"

describe("emergencyStopAll", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("preserves session user response history while cleaning up sessions", async () => {
    const stopAllSessions = vi.fn()
    const cleanupSession = vi.fn()
    const emergencyStop = vi.fn()
    const getActiveProcessCount = vi.fn(() => 0)
    const abortAll = vi.fn()
    const cancelSessionApprovals = vi.fn()
    const emitAgentProgress = vi.fn(async () => {})
    const getActiveSessions = vi.fn(() => [{ id: "session-1", conversationId: "conv-1", conversationTitle: "Test" }])
    const pauseQueue = vi.fn()
    const cancelAllRuns = vi.fn()
    const stopAllAgents = vi.fn(async () => {})
    const shutdown = vi.fn(async () => {})
    const clearSessionUserResponse = vi.fn()
    const emergencyStopContinuousLoops = vi.fn(() => [])

    vi.doMock("./state", () => ({
      agentProcessManager: { emergencyStop, getActiveProcessCount },
      llmRequestAbortManager: { abortAll },
      state: { agentSessions: new Map([["session-1", { id: "session-1" }]]), isAgentModeActive: true, agentIterationCount: 3 },
      agentSessionStateManager: { stopAllSessions, cleanupSession },
      toolApprovalManager: { cancelSessionApprovals },
    }))
    vi.doMock("./emit-agent-progress", () => ({ emitAgentProgress }))
    vi.doMock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions } }))
    vi.doMock("./message-queue-service", () => ({ messageQueueService: { pauseQueue } }))
    vi.doMock("./acp", () => ({ acpProcessManager: { stopAllAgents }, acpClientService: { cancelAllRuns } }))
    vi.doMock("./acp-service", () => ({ acpService: { shutdown } }))
    vi.doMock("./session-user-response-store", () => ({ clearSessionUserResponse }))
    vi.doMock("./loop-service", () => ({ loopService: { emergencyStopContinuousLoops } }))

    const { emergencyStopAll } = await import("./emergency-stop")

    await emergencyStopAll()

    expect(stopAllSessions).toHaveBeenCalledOnce()
    expect(emitAgentProgress).toHaveBeenCalledOnce()
    expect(cleanupSession).toHaveBeenCalledWith("session-1")
    expect(clearSessionUserResponse).not.toHaveBeenCalled()
    expect(emergencyStopContinuousLoops).toHaveBeenCalledOnce()
  })

  it("durably stops continuously-running loops so they cannot auto-resume", async () => {
    const stopAllSessions = vi.fn()
    const cleanupSession = vi.fn()
    const emergencyStop = vi.fn()
    const getActiveProcessCount = vi.fn(() => 0)
    const abortAll = vi.fn()
    const emitAgentProgress = vi.fn(async () => {})
    const getActiveSessions = vi.fn(() => [])
    const shutdown = vi.fn(async () => {})
    const emergencyStopContinuousLoops = vi.fn(() => ["loop-1", "loop-2"])

    vi.doMock("./state", () => ({
      agentProcessManager: { emergencyStop, getActiveProcessCount },
      llmRequestAbortManager: { abortAll },
      state: { agentSessions: new Map(), isAgentModeActive: true, agentIterationCount: 1 },
      agentSessionStateManager: { stopAllSessions, cleanupSession },
      toolApprovalManager: { cancelSessionApprovals: vi.fn() },
    }))
    vi.doMock("./emit-agent-progress", () => ({ emitAgentProgress }))
    vi.doMock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions } }))
    vi.doMock("./message-queue-service", () => ({ messageQueueService: { pauseQueue: vi.fn() } }))
    vi.doMock("./acp-service", () => ({ acpService: { shutdown } }))
    vi.doMock("./loop-service", () => ({ loopService: { emergencyStopContinuousLoops } }))

    const { emergencyStopAll } = await import("./emergency-stop")
    await emergencyStopAll()

    expect(emergencyStopContinuousLoops).toHaveBeenCalledOnce()
  })

  it("does not bubble loop-service failures out of emergency stop", async () => {
    const emergencyStopContinuousLoops = vi.fn(() => {
      throw new Error("disk full")
    })
    const emergencyStop = vi.fn()
    const getActiveProcessCount = vi.fn(() => 0)

    vi.doMock("./state", () => ({
      agentProcessManager: { emergencyStop, getActiveProcessCount },
      llmRequestAbortManager: { abortAll: vi.fn() },
      state: { agentSessions: new Map(), isAgentModeActive: true, agentIterationCount: 0 },
      agentSessionStateManager: { stopAllSessions: vi.fn(), cleanupSession: vi.fn() },
      toolApprovalManager: { cancelSessionApprovals: vi.fn() },
    }))
    vi.doMock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn(async () => {}) }))
    vi.doMock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions: vi.fn(() => []) } }))
    vi.doMock("./message-queue-service", () => ({ messageQueueService: { pauseQueue: vi.fn() } }))
    vi.doMock("./acp-service", () => ({ acpService: { shutdown: vi.fn(async () => {}) } }))
    vi.doMock("./loop-service", () => ({ loopService: { emergencyStopContinuousLoops } }))

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const { emergencyStopAll } = await import("./emergency-stop")
    await expect(emergencyStopAll()).resolves.toEqual({ before: 0, after: 0 })
    expect(emergencyStopContinuousLoops).toHaveBeenCalledOnce()

    errorSpy.mockRestore()
  })
})