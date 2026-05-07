import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopAgentSessionRecord {
  id: string
  conversationId?: string
  parentSessionId?: string | null
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  currentIteration?: number
  maxIterations?: number
  lastActivity?: string
  errorMessage?: string
  isSnoozed?: boolean
  isRepeatTask?: boolean
}

export interface DesktopAgentSessionsResponse {
  activeSessions: DesktopAgentSessionRecord[]
  recentCompletedSessions?: DesktopAgentSessionRecord[]
  recentSessions?: DesktopAgentSessionRecord[]
}

export interface DesktopStopAgentSessionResult {
  success?: boolean
  error?: string
}

export interface DesktopSnoozeAgentSessionsResult {
  success?: boolean
}

export interface DesktopRespondToToolApprovalRequest {
  approvalId: string
  approved: boolean
}

export interface DesktopRespondToToolApprovalResult {
  success?: boolean
}

export const desktopAgentSessionsClient = {
  getAgentSessions(): Promise<DesktopAgentSessionsResponse> {
    return tipcClient.getAgentSessions() as Promise<DesktopAgentSessionsResponse>
  },

  clearInactiveSessions(): Promise<void> {
    return tipcClient.clearInactiveSessions() as Promise<void>
  },

  stopAgentSession(sessionId: string): Promise<DesktopStopAgentSessionResult> {
    return tipcClient.stopAgentSession({ sessionId }) as Promise<DesktopStopAgentSessionResult>
  },

  clearAgentSessionProgress(sessionId: string): Promise<void> {
    return tipcClient.clearAgentSessionProgress({ sessionId }) as Promise<void>
  },

  emergencyStopAgent(): Promise<void> {
    return tipcClient.emergencyStopAgent() as Promise<void>
  },

  unsnoozeAgentSession(sessionId: string): Promise<void> {
    return tipcClient.unsnoozeAgentSession({ sessionId }) as Promise<void>
  },

  respondToToolApproval(
    request: DesktopRespondToToolApprovalRequest,
  ): Promise<DesktopRespondToToolApprovalResult> {
    return tipcClient.respondToToolApproval(request) as Promise<DesktopRespondToToolApprovalResult>
  },

  focusAgentSession(sessionId: string): Promise<void> {
    return tipcClient.focusAgentSession({ sessionId }) as Promise<void>
  },

  closeAgentModeAndHidePanelWindow(): Promise<void> {
    return tipcClient.closeAgentModeAndHidePanelWindow() as Promise<void>
  },

  snoozeAgentSessionsAndHidePanelWindow(
    sessionIds: string[],
  ): Promise<DesktopSnoozeAgentSessionsResult> {
    return tipcClient.snoozeAgentSessionsAndHidePanelWindow({
      sessionIds,
    }) as Promise<DesktopSnoozeAgentSessionsResult>
  },

  async focusAgentSessionInPanel(sessionId: string): Promise<void> {
    await tipcClient.focusAgentSession({ sessionId })
    await tipcClient.setPanelMode({ mode: "agent" })
    await tipcClient.showPanelWindow({})
  },
}
