import { logApp, logLLM } from "./debug"
import { getAppSessionForAcpSession } from "./acpx/acpx-session-state"
import {
  stopRemoteAgentSessionAction,
  type StopRemoteAgentSessionResult,
} from "@dotagents/shared/agent-run-utils"
import { agentSessionTracker } from "./agent-session-tracker"
import { emitAgentProgress } from "./emit-agent-progress"
import { messageQueueService } from "./message-queue-service"
import { agentSessionStateManager, toolApprovalManager } from "@dotagents/core"

export type StopAgentSessionResult = StopRemoteAgentSessionResult

export async function stopAgentSessionById(sessionId: string): Promise<StopAgentSessionResult> {
  return stopRemoteAgentSessionAction(sessionId, {
    diagnostics: {
      logApp,
      logLLM,
    },
    service: {
      getAppSessionForAcpSession,
      getTrackedSession: (id) => agentSessionTracker.getSession(id),
      stopSessionState: (id) => agentSessionStateManager.stopSession(id),
      cancelSessionApprovals: (id) => toolApprovalManager.cancelSessionApprovals(id),
      getChildSubSessions: async (id) => {
        const { getChildSubSessions } = await import("./acp/internal-agent")
        return getChildSubSessions(id)
      },
      cancelSubSession: async (id) => {
        const { cancelSubSession } = await import("./acp/internal-agent")
        cancelSubSession(id)
      },
      pauseMessageQueue: (conversationId) => messageQueueService.pauseQueue(conversationId),
      getMessageQueueLength: (conversationId) => messageQueueService.getQueue(conversationId).length,
      getSessionRunId: (id) => agentSessionStateManager.getSessionRunId(id),
      emitAgentProgress,
      stopTrackedSession: (id) => agentSessionTracker.stopSession(id),
    },
  })
}
