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

export const desktopAgentSessionsClient = {
  getAgentSessions(): Promise<DesktopAgentSessionsResponse> {
    return tipcClient.getAgentSessions() as Promise<DesktopAgentSessionsResponse>
  },

  clearInactiveSessions(): Promise<void> {
    return tipcClient.clearInactiveSessions() as Promise<void>
  },
}
