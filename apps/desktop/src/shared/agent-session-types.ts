import type { SessionProfileSnapshot } from "@dotagents/shared/agent-profile-session-snapshot"

export interface AgentSession {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  currentIteration?: number
  maxIterations?: number
  lastActivity?: string
  errorMessage?: string
  // When true, session runs in background without stealing focus.
  isSnoozed?: boolean
  // True for sessions created by repeat-task/loop execution.
  isRepeatTask?: boolean
  /**
   * Profile snapshot captured at session creation time.
   * This keeps a running session isolated from global profile edits.
   */
  profileSnapshot?: SessionProfileSnapshot
}
