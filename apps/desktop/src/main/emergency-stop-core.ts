export interface EmergencyStopActiveSession {
  id: string
  conversationId?: string
  conversationTitle?: string
}

export interface EmergencyStopDependencies {
  toolApprovalManager: { cancelAllApprovals(): void; cancelSessionApprovals(sessionId: string): void }
  agentSessionStateManager: { stopAllSessions(): void; cleanupSession(sessionId: string): void }
  agentSessionTracker: { getActiveSessions(): EmergencyStopActiveSession[]; stopSession(sessionId: string): void }
  messageQueueService: { pauseQueue(conversationId: string): void }
  emitAgentProgress(update: Record<string, unknown>): Promise<void>
  llmRequestAbortManager: { abortAll(): void }
  agentProcessManager: { getActiveProcessCount(): number; emergencyStop(): void }
  state: { agentSessions: Map<string, unknown>; isAgentModeActive: boolean; agentIterationCount: number }
  clearSessionUserResponse(sessionId: string): void
  acpClientService: { cancelAllRuns(): void }
  acpProcessManager: { stopAllAgents(): Promise<void> }
  acpService: { shutdown(): Promise<void> }
}

export async function runEmergencyStopAll(deps: EmergencyStopDependencies): Promise<{ before: number; after: number }> {
  try {
    deps.toolApprovalManager.cancelAllApprovals()
  } catch (error) {
    console.error("[EmergencyStop] Error cancelling all pending approvals during emergency stop:", error)
  }

  deps.agentSessionStateManager.stopAllSessions()

  const activeSessions = deps.agentSessionTracker.getActiveSessions()
  for (const session of activeSessions) {
    try {
      deps.toolApprovalManager.cancelSessionApprovals(session.id)
    } catch (error) {
      console.error("[EmergencyStop] Error cancelling pending approvals during emergency stop:", session.id, error)
    }

    if (session.conversationId) {
      try {
        deps.messageQueueService.pauseQueue(session.conversationId)
      } catch (error) {
        console.error("[EmergencyStop] Error pausing queued conversation during emergency stop:", session.id, error)
      }
    }

    try {
      await deps.emitAgentProgress({
        sessionId: session.id,
        conversationId: session.conversationId,
        conversationTitle: session.conversationTitle,
        currentIteration: 0,
        maxIterations: 0,
        steps: [{
          id: `stop_${Date.now()}`,
          type: "completion",
          title: "Agent stopped",
          description: "Agent mode was stopped by emergency kill switch. Queue paused.",
          status: "error",
          timestamp: Date.now(),
        }],
        isComplete: true,
        finalContent: "(Agent mode was stopped by emergency kill switch)",
        conversationHistory: [],
        pendingToolApproval: undefined,
      })
    } catch (error) {
      console.error("[EmergencyStop] Error emitting final progress update during emergency stop:", session.id, error)
    }

    try {
      deps.agentSessionTracker.stopSession(session.id)
    } catch (error) {
      console.error("[EmergencyStop] Error marking session as stopped in tracker:", session.id, error)
    }
  }

  try {
    deps.llmRequestAbortManager.abortAll()
  } catch {
    // ignore
  }

  const before = deps.agentProcessManager.getActiveProcessCount()

  try {
    deps.agentProcessManager.emergencyStop()
  } catch {
    // ignore
  }

  const after = deps.agentProcessManager.getActiveProcessCount()

  const sessionIds = Array.from(deps.state.agentSessions.keys())
  for (const sessionId of sessionIds) {
    try {
      deps.clearSessionUserResponse(sessionId)
    } catch (error) {
      console.error("[EmergencyStop] Error clearing session user response:", sessionId, error)
    }

    try {
      deps.agentSessionStateManager.cleanupSession(sessionId)
    } catch (error) {
      console.error("[EmergencyStop] Error cleaning up session state:", sessionId, error)
    }
  }

  deps.state.isAgentModeActive = false
  deps.state.agentIterationCount = 0

  try {
    deps.acpClientService.cancelAllRuns()
  } catch (error) {
    console.error("[EmergencyStop] Error cancelling ACP runs:", error)
  }

  try {
    await deps.acpProcessManager.stopAllAgents()
  } catch (error) {
    console.error("[EmergencyStop] Error stopping ACP agents:", error)
  }

  try {
    await deps.acpService.shutdown()
  } catch (error) {
    console.error("[EmergencyStop] Error shutting down ACP service:", error)
  }

  return { before, after }
}