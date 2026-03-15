/**
 * Agent Session Tracker
 * Tracks only active agent sessions for visibility in sidebar.
 *
 * Extracted from apps/desktop/src/main/agent-session-tracker.ts.
 * All WINDOWS/tipc renderer communication replaced with ProgressEmitter.
 */

import { logApp } from "./debug"
import { clearSessionUserResponse } from "./session-user-response-store"
import type { SessionProfileSnapshot } from "./types"
import type { ProgressEmitter } from "./interfaces/progress-emitter"

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
  isSnoozed?: boolean // When true, session runs in background without stealing focus
  /**
   * Profile snapshot captured at session creation time.
   * This ensures session isolation - changes to the global profile don't affect running sessions.
   */
  profileSnapshot?: SessionProfileSnapshot
}

// Module-level ProgressEmitter for emitting session updates to UI
let _progressEmitter: ProgressEmitter | null = null

/**
 * Set the ProgressEmitter implementation. Must be called at startup.
 */
export function setAgentSessionTrackerProgressEmitter(emitter: ProgressEmitter): void {
  _progressEmitter = emitter
}

/**
 * Emit session updates to all renderer surfaces via ProgressEmitter.
 */
function emitSessionUpdate(tracker: AgentSessionTracker) {
  if (!_progressEmitter) return

  try {
    const data = {
      activeSessions: tracker.getActiveSessions(),
      recentSessions: tracker.getRecentSessions(4),
    }
    _progressEmitter.emitSessionUpdate(data)
  } catch {
    // Silently ignore emission failures
  }
}

export class AgentSessionTracker {
  private sessions: Map<string, AgentSession> = new Map()
  private completedSessions: AgentSession[] = []

  /**
   * Start tracking a new agent session
   * Sessions start snoozed by default - they run in background without showing floating panel
   * User can explicitly maximize/focus a session to see its progress
   * @param conversationId - Optional conversation ID to link the session to
   * @param conversationTitle - Optional title for the session
   * @param startSnoozed - If true, session runs in background without showing floating panel
   * @param profileSnapshot - Optional profile snapshot to bind to this session for isolation
   */
  startSession(
    conversationId?: string,
    conversationTitle?: string,
    startSnoozed: boolean = true,
    profileSnapshot?: SessionProfileSnapshot
  ): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const session: AgentSession = {
      id: sessionId,
      conversationId,
      conversationTitle: conversationTitle || "Untitled Agent Session",
      status: "active",
      startTime: Date.now(),
      currentIteration: 0,
      maxIterations: 10,
      isSnoozed: startSnoozed, // Start snoozed by default - no floating panel auto-show
      profileSnapshot, // Capture profile settings at session creation for isolation
    }

    this.sessions.set(sessionId, session)
    logApp(`[AgentSessionTracker] Started session: ${sessionId}, snoozed: ${startSnoozed}, profile: ${profileSnapshot?.profileName || 'none'}, total sessions: ${this.sessions.size}`)

    // Emit update to UI
    emitSessionUpdate(this)

    return sessionId
  }

  /**
   * Update an existing session
   */
  updateSession(
    sessionId: string,
    updates: Partial<Omit<AgentSession, "id" | "startTime">>
  ): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates)
      // Emit update to UI so sidebar and other components reflect changes (e.g., title updates)
      emitSessionUpdate(this)
    }
  }

  /**
   * Mark a session as completed and move it to recent sessions
   */
  completeSession(sessionId: string, finalActivity?: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      logApp(`[AgentSessionTracker] Complete requested for non-existent session: ${sessionId}`)
      return
    }
    session.status = "completed"
    session.endTime = Date.now()
    if (finalActivity) {
      session.lastActivity = finalActivity
    }
    // Move to recent list (newest first), cap length
    this.completedSessions.unshift({ ...session })
    if (this.completedSessions.length > 20) {
      const evictedSessions = this.completedSessions.splice(20)
      for (const evicted of evictedSessions) {
        clearSessionUserResponse(evicted.id)
      }
    }
    this.sessions.delete(sessionId)
    logApp(`[AgentSessionTracker] Completing session: ${sessionId}, remaining sessions: ${this.sessions.size}`)

    // Emit update to UI
    emitSessionUpdate(this)
  }

  /**
   * Mark a session as stopped and move it to recent sessions
   */
  stopSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      logApp(`[AgentSessionTracker] Stop requested for non-existent session: ${sessionId}`)
      return
    }
    session.status = "stopped"
    session.endTime = Date.now()
    this.completedSessions.unshift({ ...session })
    if (this.completedSessions.length > 20) {
      const evictedSessions = this.completedSessions.splice(20)
      for (const evicted of evictedSessions) {
        clearSessionUserResponse(evicted.id)
      }
    }
    this.sessions.delete(sessionId)
    logApp(`[AgentSessionTracker] Stopping session: ${sessionId}, remaining sessions: ${this.sessions.size}`)

    // Emit update to UI
    emitSessionUpdate(this)
  }

  /**
   * Mark a session as errored and move it to recent sessions
   */
  errorSession(sessionId: string, errorMessage: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      logApp(`[AgentSessionTracker] Error reported for non-existent session: ${sessionId}`)
      return
    }
    session.status = "error"
    session.errorMessage = errorMessage
    session.endTime = Date.now()
    this.completedSessions.unshift({ ...session })
    if (this.completedSessions.length > 20) {
      const evictedSessions = this.completedSessions.splice(20)
      for (const evicted of evictedSessions) {
        clearSessionUserResponse(evicted.id)
      }
    }
    this.sessions.delete(sessionId)
    logApp(`[AgentSessionTracker] Error in session: ${sessionId}, remaining sessions: ${this.sessions.size}`)

    // Emit update to UI
    emitSessionUpdate(this)
  }

  /**
   * Get all active sessions (only active sessions are stored now)
   */
  getActiveSessions(): AgentSession[] {
    const sessions = Array.from(this.sessions.values())
      .sort((a, b) => b.startTime - a.startTime)
    return sessions
  }

  /**
   * Get recent sessions (completed/stopped/error), newest first
   */
  getRecentSessions(limit: number = 4): AgentSession[] {
    return this.completedSessions
      .slice(0, limit)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
  }

  /**
   * Snooze a session (runs in background without stealing focus)
   */
  snoozeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      logApp(`[AgentSessionTracker] Snoozing session: ${sessionId}, was snoozed: ${session.isSnoozed}`)
      session.isSnoozed = true
      this.sessions.set(sessionId, session)
      logApp(`[AgentSessionTracker] Session ${sessionId} is now snoozed: ${session.isSnoozed}`)

      // Emit update to UI
      emitSessionUpdate(this)
    } else {
      logApp(`[AgentSessionTracker] Cannot snooze - session not found: ${sessionId}`)
    }
  }

  /**
   * Unsnooze a session (allow it to show progress UI again)
   */
  unsnoozeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      logApp(`[AgentSessionTracker] Unsnoozing session: ${sessionId}, was snoozed: ${session.isSnoozed}`)
      session.isSnoozed = false
      this.sessions.set(sessionId, session)
      logApp(`[AgentSessionTracker] Session ${sessionId} is now snoozed: ${session.isSnoozed}`)

      // Emit update to UI
      emitSessionUpdate(this)
    } else {
      logApp(`[AgentSessionTracker] Cannot unsnooze - session not found: ${sessionId}`)
    }
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Check if a session is snoozed
   */
  isSessionSnoozed(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    return session?.isSnoozed ?? false
  }

  /**
   * Get the profile snapshot for a session
   * Returns the profile snapshot if the session exists and has one, undefined otherwise
   */
  getSessionProfileSnapshot(sessionId: string): SessionProfileSnapshot | undefined {
    const session = this.sessions.get(sessionId)
    return session?.profileSnapshot
  }

  /**
   * Get the conversation ID for a session, including completed sessions.
   */
  getConversationIdForSession(sessionId: string): string | undefined {
    const activeSession = this.sessions.get(sessionId)
    if (activeSession) {
      return activeSession.conversationId
    }

    const completedSession = this.completedSessions.find(session => session.id === sessionId)
    return completedSession?.conversationId
  }

  /**
   * Find a completed session by ID.
   * Returns the session if found in completed sessions, undefined otherwise.
   */
  findCompletedSession(sessionId: string): AgentSession | undefined {
    return this.completedSessions.find(session => session.id === sessionId)
  }

  /**
   * Find a session by conversationId (active or completed)
   * Returns the session ID if found, undefined otherwise
   */
  findSessionByConversationId(conversationId: string): string | undefined {
    // First check active sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.conversationId === conversationId) {
        return sessionId
      }
    }
    // Then check completed sessions
    for (const session of this.completedSessions) {
      if (session.conversationId === conversationId) {
        return session.id
      }
    }
    return undefined
  }

  /**
   * Revive a completed session to continue it
   * Moves the session from completedSessions back to active sessions
   * @param sessionId - The session ID to revive
   * @param startSnoozed - If true, session stays snoozed (runs in background without showing panel)
   */
  reviveSession(sessionId: string, startSnoozed: boolean = false): boolean {
    // Find in completed sessions
    const completedIndex = this.completedSessions.findIndex(s => s.id === sessionId)
    if (completedIndex === -1) {
      // Maybe it's already active?
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId)
        // Preserve the current snooze state for already-active sessions
        // This ensures that if the user is actively watching the floating panel,
        // queued message executions will still be visible (not forced to snooze)
        logApp(`[AgentSessionTracker] Session ${sessionId} is already active, preserving snooze state: ${session?.isSnoozed}`)
        return true
      }
      logApp(`[AgentSessionTracker] Cannot revive - session not found: ${sessionId}`)
      return false
    }

    // Remove from completed and add back to active
    const [session] = this.completedSessions.splice(completedIndex, 1)
    session.status = "active"
    session.isSnoozed = startSnoozed
    delete session.endTime
    this.sessions.set(sessionId, session)

    logApp(`[AgentSessionTracker] Revived session: ${sessionId}, snoozed: ${startSnoozed}`)
    emitSessionUpdate(this)
    return true
  }

  /**
   * Remove a single completed session by ID.
   * Returns true if the session was found and removed.
   */
  removeCompletedSession(sessionId: string): boolean {
    const index = this.completedSessions.findIndex(s => s.id === sessionId)
    if (index === -1) return false

    this.completedSessions.splice(index, 1)
    clearSessionUserResponse(sessionId)
    logApp(`[AgentSessionTracker] Removed completed session: ${sessionId}`)
    emitSessionUpdate(this)
    return true
  }

  /**
   * Clear all sessions (for testing/debugging)
   */
  clearAllSessions(): void {
    this.sessions.clear()
  }

  /**
   * Clear all completed/recent sessions (move to history)
   * Active sessions are preserved
   */
  clearCompletedSessions(
    shouldClear: (session: AgentSession) => boolean = () => true,
  ): void {
    const retainedSessions: AgentSession[] = []

    for (const session of this.completedSessions) {
      if (shouldClear(session)) {
        clearSessionUserResponse(session.id)
      } else {
        retainedSessions.push(session)
      }
    }

    logApp(`[AgentSessionTracker] Cleared ${this.completedSessions.length - retainedSessions.length} completed sessions`)
    this.completedSessions = retainedSessions
    emitSessionUpdate(this)
  }
}

export const agentSessionTracker = new AgentSessionTracker()
