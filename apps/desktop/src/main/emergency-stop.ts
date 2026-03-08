import { agentProcessManager, llmRequestAbortManager, state, agentSessionStateManager, toolApprovalManager } from "./state"
import { emitAgentProgress } from "./emit-agent-progress"
import { agentSessionTracker } from "./agent-session-tracker"
import { messageQueueService } from "./message-queue-service"
import { acpProcessManager, acpClientService } from "./acp"
import { acpService } from "./acp-service"
import { clearSessionUserResponse } from "./session-user-response-store"

/**
 * Centralized emergency stop: abort LLM requests, kill tracked child processes,
 * and reset agent state.
 *
 * NOTE: This does NOT stop MCP servers - they are persistent infrastructure
 * that should remain running across agent mode sessions.
 *
 * Returns before/after counts for logging.
 */
export async function emergencyStopAll(): Promise<{ before: number; after: number }> {
  // Signal all sessions to stop ASAP (both new session-based and legacy global)
  agentSessionStateManager.stopAllSessions()

  // Mark all active agent sessions as stopped in the tracker and emit progress updates
  const activeSessions = agentSessionTracker.getActiveSessions()
  for (const session of activeSessions) {
    // Cancel any pending tool approvals for this session
    try {
      toolApprovalManager.cancelSessionApprovals(session.id)
    } catch (error) {
      console.error("[EmergencyStop] Error cancelling pending approvals during emergency stop:", session.id, error)
    }

    // Pause the message queue for this conversation to prevent processing the next queued message
    // The user can resume the queue later if they want to continue
    if (session.conversationId) {
      try {
        messageQueueService.pauseQueue(session.conversationId)
      } catch (error) {
        console.error("[EmergencyStop] Error pausing queued conversation during emergency stop:", session.id, error)
      }
    }

    // Emit a final progress update so the UI shows "Stopped" state
    // This allows users to see the stopped state and send follow-up messages
    // Note: pendingToolApproval is explicitly set to undefined to clear any stale
    // approval bubble from the UI since updateSessionProgress preserves fields not
    // present in the update (spreads existing state)
    try {
      await emitAgentProgress({
        sessionId: session.id,
        conversationId: session.conversationId,
        conversationTitle: session.conversationTitle,
        currentIteration: 0,
        maxIterations: 0,
        steps: [
          {
            id: `stop_${Date.now()}`,
            type: "completion",
            title: "Agent stopped",
            description: "Agent mode was stopped by emergency kill switch. Queue paused.",
            status: "error",
            timestamp: Date.now(),
          },
        ],
        isComplete: true,
        finalContent: "(Agent mode was stopped by emergency kill switch)",
        conversationHistory: [],
        pendingToolApproval: undefined,
      })
    } catch (error) {
      console.error("[EmergencyStop] Error emitting final progress update during emergency stop:", session.id, error)
    }

    // Mark the session as stopped in the tracker even if one of the steps above failed
    try {
      agentSessionTracker.stopSession(session.id)
    } catch (error) {
      console.error("[EmergencyStop] Error marking session as stopped in tracker:", session.id, error)
    }
  }

  // Abort any in-flight LLM HTTP requests (handled by session state manager)
  // This is already done in stopAllSessions(), but we keep the legacy call for safety
  try {
    llmRequestAbortManager.abortAll()
  } catch {
    // ignore
  }

  // NOTE: We do NOT stop MCP servers here - they are persistent infrastructure
  // that should remain running. Only agent-spawned child processes are killed.

  const before = agentProcessManager.getActiveProcessCount()

  // Kill all tracked child processes immediately
  try {
    agentProcessManager.emergencyStop()
  } catch {
    // ignore
  }

  const after = agentProcessManager.getActiveProcessCount()

  // Clean up all session states (including user response)
  const sessionIds = Array.from(state.agentSessions.keys())
  for (const sessionId of sessionIds) {
    try {
      clearSessionUserResponse(sessionId)
    } catch (error) {
      console.error("[EmergencyStop] Error clearing session user response:", sessionId, error)
    }

    try {
      agentSessionStateManager.cleanupSession(sessionId)
    } catch (error) {
      console.error("[EmergencyStop] Error cleaning up session state:", sessionId, error)
    }
  }

  // Reset some core agent state flags for clean state
  // NOTE: We intentionally do NOT reset state.shouldStopAgent here!
  // It should remain true to block any late/in-flight progress updates that may
  // arrive after cleanup. It will be reset to false when a new session is created.
  // This prevents a race condition where stray updates slip through after emergency stop.
  state.isAgentModeActive = false
  state.agentIterationCount = 0

  // Cancel all ACP runs
  acpClientService.cancelAllRuns()

  // Stop all spawned ACP agents - isolated so failures don't prevent rest of cleanup
  try {
    await acpProcessManager.stopAllAgents()
  } catch (error) {
    // Log but don't fail - emergency stop should be best-effort
    console.error('[EmergencyStop] Error stopping ACP agents:', error)
  }

  // Stop all ACP stdio agents - isolated so failures don't prevent rest of cleanup
  try {
    await acpService.shutdown()
  } catch (error) {
    // Log but don't fail - emergency stop should be best-effort
    console.error('[EmergencyStop] Error shutting down ACP service:', error)
  }

  return { before, after }
}

