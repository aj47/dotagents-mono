import { emitAgentProgress } from "./emit-agent-progress"
import { logApp, logLLM } from "./debug"
import { agentSessionTracker, type AgentSession } from "./agent-session-tracker"
import { messageQueueService } from "./message-queue-service"
import { agentSessionStateManager, toolApprovalManager } from "./state"

interface AgentSessionSelectionCandidate {
  id: string
  conversationTitle?: string
}

export interface ManagedAgentSessionsSnapshot {
  activeSessions: AgentSession[]
  recentSessions: AgentSession[]
}

interface ManagedAgentSessionSelectionResult<
  T extends AgentSessionSelectionCandidate,
> {
  selectedSession?: T
  ambiguousSessions?: T[]
}

export interface ClearManagedInactiveAgentSessionsResult {
  clearedCount: number
}

export interface StopManagedAgentSessionResult {
  pausedConversationId?: string
  session?: AgentSession
}

function normalizeManagedAgentSessionSelector(value: string): string {
  return value.trim().toLowerCase()
}

function getManagedAgentSessionSelectionLabel(
  session: AgentSessionSelectionCandidate,
): string {
  return session.conversationTitle?.trim() || session.id
}

export function getManagedAgentSessions(options: {
  recentLimit?: number
} = {}): ManagedAgentSessionsSnapshot {
  return {
    activeSessions: agentSessionTracker.getActiveSessions(),
    recentSessions: agentSessionTracker.getRecentSessions(options.recentLimit),
  }
}

export function resolveManagedAgentSessionSelection<
  T extends AgentSessionSelectionCandidate,
>(
  sessions: T[],
  query: string,
): ManagedAgentSessionSelectionResult<T> {
  const trimmedQuery = query.trim()
  const normalizedQuery = normalizeManagedAgentSessionSelector(query)

  if (!trimmedQuery) {
    return {}
  }

  const exactIdMatch = sessions.find((session) => session.id === trimmedQuery)
  if (exactIdMatch) {
    return { selectedSession: exactIdMatch }
  }

  const exactTitleMatches = sessions.filter(
    (session) =>
      normalizeManagedAgentSessionSelector(
        getManagedAgentSessionSelectionLabel(session),
      ) === normalizedQuery,
  )
  if (exactTitleMatches.length === 1) {
    return { selectedSession: exactTitleMatches[0] }
  }
  if (exactTitleMatches.length > 1) {
    return { ambiguousSessions: exactTitleMatches }
  }

  const idPrefixMatches = sessions.filter((session) =>
    session.id.startsWith(trimmedQuery),
  )
  if (idPrefixMatches.length === 1) {
    return { selectedSession: idPrefixMatches[0] }
  }
  if (idPrefixMatches.length > 1) {
    return { ambiguousSessions: idPrefixMatches }
  }

  const titlePrefixMatches = sessions.filter((session) =>
    normalizeManagedAgentSessionSelector(
      getManagedAgentSessionSelectionLabel(session),
    ).startsWith(normalizedQuery),
  )
  if (titlePrefixMatches.length === 1) {
    return { selectedSession: titlePrefixMatches[0] }
  }
  if (titlePrefixMatches.length > 1) {
    return { ambiguousSessions: titlePrefixMatches }
  }

  return {}
}

export function clearManagedInactiveAgentSessions(): ClearManagedInactiveAgentSessionsResult {
  const beforeCount = agentSessionTracker.getRecentSessions(Number.MAX_SAFE_INTEGER)
    .length

  agentSessionTracker.clearCompletedSessions((session) => {
    if (!session.conversationId) {
      return true
    }

    return messageQueueService.getQueue(session.conversationId).length === 0
  })

  const afterCount = agentSessionTracker.getRecentSessions(Number.MAX_SAFE_INTEGER)
    .length

  return {
    clearedCount: Math.max(beforeCount - afterCount, 0),
  }
}

export async function stopManagedAgentSession(
  sessionId: string,
): Promise<StopManagedAgentSessionResult> {
  const session = agentSessionTracker.getSession(sessionId)

  agentSessionStateManager.stopSession(sessionId)
  toolApprovalManager.cancelSessionApprovals(sessionId)

  try {
    const { acpClientService } = await import("./acp")
    const cancelledAcpRuns = acpClientService.cancelRunsByParentSession(
      sessionId,
    )
    if (cancelledAcpRuns > 0) {
      logLLM(
        `[stopManagedAgentSession] Cancelled ${cancelledAcpRuns} ACP run(s) for session ${sessionId}`,
      )
    }
  } catch (error) {
    logApp("[stopManagedAgentSession] Error cancelling ACP runs:", error)
  }

  try {
    const { getChildSubSessions, cancelSubSession } = await import(
      "./acp/internal-agent"
    )
    const childSessions = getChildSubSessions(sessionId)
    for (const child of childSessions) {
      if (child.status !== "running") {
        continue
      }

      cancelSubSession(child.id)
      logLLM(
        `[stopManagedAgentSession] Cancelled internal sub-session ${child.id}`,
      )
    }
  } catch (error) {
    logApp(
      "[stopManagedAgentSession] Error cancelling internal sub-sessions:",
      error,
    )
  }

  if (session?.conversationId) {
    messageQueueService.pauseQueue(session.conversationId)
    logLLM(
      `[stopManagedAgentSession] Paused queue for conversation ${session.conversationId}`,
    )
  }

  const runId = agentSessionStateManager.getSessionRunId(sessionId)

  await emitAgentProgress({
    sessionId,
    runId,
    currentIteration: 0,
    maxIterations: 0,
    steps: [
      {
        id: `stop_${Date.now()}`,
        type: "completion",
        title: "Agent stopped",
        description:
          "Agent mode was stopped by emergency kill switch. Queue paused.",
        status: "error",
        timestamp: Date.now(),
      },
    ],
    isComplete: true,
    finalContent: "(Agent mode was stopped by emergency kill switch)",
    conversationHistory: [],
  })

  agentSessionTracker.stopSession(sessionId)

  return {
    session,
    pausedConversationId: session?.conversationId,
  }
}
