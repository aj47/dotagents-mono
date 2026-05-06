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

    vi.doMock("@dotagents/core", () => ({
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

    const { emergencyStopAll } = await import("./emergency-stop")

    await emergencyStopAll()

    expect(stopAllSessions).toHaveBeenCalledOnce()
    expect(emitAgentProgress).toHaveBeenCalledOnce()
    expect(cleanupSession).toHaveBeenCalledWith("session-1")
    expect(clearSessionUserResponse).not.toHaveBeenCalled()
  })
})
