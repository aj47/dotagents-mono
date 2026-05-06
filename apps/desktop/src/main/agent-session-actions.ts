import { logApp, logLLM } from "./debug"
import { getAppSessionForAcpSession } from "./acpx/acpx-session-state"
import {
  buildAgentStoppedProgressUpdate,
  describeAgentSessionId,
} from "@dotagents/shared/agent-run-utils"
import { agentSessionTracker } from "./agent-session-tracker"
import { emitAgentProgress } from "./emit-agent-progress"
import { messageQueueService } from "./message-queue-service"
import { agentSessionStateManager, toolApprovalManager } from "./state"

export type StopAgentSessionResult = {
  success: true
  sessionId: string
  conversationId?: string
}

export async function stopAgentSessionById(sessionId: string): Promise<StopAgentSessionResult> {
  const requestedSessionKind = describeAgentSessionId(sessionId)
  const mappedAppSessionId = getAppSessionForAcpSession(sessionId)
  const trackedSession = agentSessionTracker.getSession(sessionId)
  const mappedTrackedSession = mappedAppSessionId
    ? agentSessionTracker.getSession(mappedAppSessionId)
    : undefined

  logApp("[stopAgentSession] Stop requested", {
    requestedSessionId: sessionId,
    requestedSessionKind,
    mappedAppSessionId: mappedAppSessionId ?? null,
    trackerSessionFound: Boolean(trackedSession),
    trackerSessionStatus: trackedSession?.status ?? null,
    trackerConversationId: trackedSession?.conversationId ?? null,
    mappedTrackerSessionFound: Boolean(mappedTrackedSession),
    mappedTrackerSessionStatus: mappedTrackedSession?.status ?? null,
    mappedTrackerConversationId: mappedTrackedSession?.conversationId ?? null,
  })

  agentSessionStateManager.stopSession(sessionId)
  toolApprovalManager.cancelSessionApprovals(sessionId)

  try {
    const { getChildSubSessions, cancelSubSession } = await import("./acp/internal-agent")
    const childSessions = getChildSubSessions(sessionId)
    const runningChildSessionIds = childSessions
      .filter((child) => child.status === "running")
      .map((child) => child.id)
    for (const child of childSessions) {
      if (child.status === "running") {
        cancelSubSession(child.id)
        logLLM(`[stopAgentSession] Cancelled internal sub-session ${child.id}`)
      }
    }
    logApp("[stopAgentSession] Internal sub-session scan complete", {
      requestedSessionId: sessionId,
      childSessionCount: childSessions.length,
      runningChildSessionIds,
    })
  } catch (error) {
    logApp("[stopAgentSession] Error cancelling internal sub-sessions:", error)
  }

  const session = agentSessionTracker.getSession(sessionId)
  if (session?.conversationId) {
    messageQueueService.pauseQueue(session.conversationId)
    logLLM(`[stopAgentSession] Paused queue for conversation ${session.conversationId}`)
    logApp("[stopAgentSession] Queue paused", {
      requestedSessionId: sessionId,
      pausedConversationId: session.conversationId,
      pausedByTrackedSessionId: session.id,
      queueLength: messageQueueService.getQueue(session.conversationId).length,
    })
  } else {
    logApp("[stopAgentSession] Queue pause skipped because requested session is not tracked", {
      requestedSessionId: sessionId,
      requestedSessionKind,
      mappedAppSessionId: mappedAppSessionId ?? null,
      mappedConversationId: mappedTrackedSession?.conversationId ?? null,
    })
  }

  const runId = agentSessionStateManager.getSessionRunId(sessionId)
  await emitAgentProgress(buildAgentStoppedProgressUpdate({
    sessionId,
    runId,
  }))

  agentSessionTracker.stopSession(sessionId)

  return {
    success: true,
    sessionId,
    ...(session?.conversationId ? { conversationId: session.conversationId } : {}),
  }
}
