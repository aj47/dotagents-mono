/**
 * Agent Session Tracker
 * Tracks only active agent sessions for visibility in sidebar
 */

import { join } from "path"
import { getRendererHandlers } from "@egoist/tipc/main"
import type { SessionProfileSnapshot } from "@dotagents/core"
import {
  DEFAULT_MAX_COMPLETED_AGENT_SESSIONS,
  createAgentSessionStore,
  restoreAgentSessionStoreState,
  type AgentSession,
  type AgentSessionStartMetadata,
  type AgentSessionStore,
  type PersistedAgentSessionState,
} from "@dotagents/shared/agent-session-store"
import type { RendererHandlers } from "@shared/renderer-handlers"
import { dataFolder } from "./config"
import { logApp } from "./debug"
import { loadPersistedJson, savePersistedJson } from "./session-persistence"
import { clearSessionUserResponse } from "./session-user-response-store"
import { WINDOWS } from "./window"

export type { AgentSession } from "@dotagents/shared/agent-session-store"

const AGENT_SESSION_STATE_PATH = join(dataFolder, "agent-session-state.json")
const MAX_COMPLETED_SESSIONS = DEFAULT_MAX_COMPLETED_AGENT_SESSIONS

/**
 * Emit session updates to all renderer windows
 */
async function emitSessionUpdate() {
  try {
    const agentSessionTracker = AgentSessionTracker.getInstance()
    const recentCompletedSessions = agentSessionTracker.getRecentSessions(4)
    const data = {
      activeSessions: agentSessionTracker.getActiveSessions(),
      recentCompletedSessions,
      // Backward-compatible alias while renderer code migrates.
      recentSessions: recentCompletedSessions,
    }

    // Emit to main window
    const mainWindow = WINDOWS.get("main")
    if (mainWindow) {
      try {
        const handlers = getRendererHandlers<RendererHandlers>(mainWindow.webContents)
        handlers.agentSessionsUpdated?.send(data)
      } catch (e) {}

    }

    // Emit to panel window
    const panelWindow = WINDOWS.get("panel")
    if (panelWindow) {
      try {
        const handlers = getRendererHandlers<RendererHandlers>(panelWindow.webContents)
        handlers.agentSessionsUpdated?.send(data)
      } catch (e) {}

    }
  } catch (e) {}

}

class AgentSessionTracker {
  private static instance: AgentSessionTracker | null = null
  private store: AgentSessionStore

  static getInstance(): AgentSessionTracker {
    if (!AgentSessionTracker.instance) {
      AgentSessionTracker.instance = new AgentSessionTracker()
    }
    return AgentSessionTracker.instance
  }

  private constructor() {
    const restoreResult = restoreAgentSessionStoreState(
      loadPersistedJson<PersistedAgentSessionState>(
        AGENT_SESSION_STATE_PATH,
        "AgentSessionTracker",
      ),
      { maxCompletedSessions: MAX_COMPLETED_SESSIONS },
    )

    for (const discardedSessionId of restoreResult.discardedSessionIds) {
      clearSessionUserResponse(discardedSessionId)
    }

    this.store = createAgentSessionStore({
      initialState: restoreResult.state,
      maxCompletedSessions: MAX_COMPLETED_SESSIONS,
      onChange: () => {
        this.persistState()
        emitSessionUpdate()
      },
      onSessionDiscarded: clearSessionUserResponse,
    })

    if (restoreResult.shouldPersist) {
      this.persistState()
    }
  }

  private persistState(): void {
    savePersistedJson(
      AGENT_SESSION_STATE_PATH,
      this.store.getPersistedState(),
      "AgentSessionTracker",
    )
  }

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
    profileSnapshot?: SessionProfileSnapshot,
    sessionMetadata: AgentSessionStartMetadata = {},
  ): string {
    const sessionId = this.store.startSession(
      conversationId,
      conversationTitle,
      startSnoozed,
      profileSnapshot,
      sessionMetadata,
    )
    const session = this.store.getSession(sessionId)
    logApp(`[AgentSessionTracker] Started session: ${sessionId}, snoozed: ${startSnoozed}, profile: ${profileSnapshot?.profileName || "none"}, total sessions: ${this.store.getActiveSessions().length}`)
    if (!session) {
      logApp(`[AgentSessionTracker] Started session could not be found after creation: ${sessionId}`)
    }
    return sessionId
  }

  /**
   * Update an existing session
   */
  updateSession(
    sessionId: string,
    updates: Partial<Omit<AgentSession, "id" | "startTime">>,
  ): void {
    this.store.updateSession(sessionId, updates)
  }

  /**
   * Mark a session as completed and move it to recent sessions
   */
  completeSession(sessionId: string, finalActivity?: string): void {
    if (!this.store.completeSession(sessionId, finalActivity)) {
      logApp(`[AgentSessionTracker] Complete requested for non-existent session: ${sessionId}`)
      return
    }

    logApp(`[AgentSessionTracker] Completing session: ${sessionId}, remaining sessions: ${this.store.getActiveSessions().length}`)
  }

  /**
   * Mark a session as stopped and move it to recent sessions
   */
  stopSession(sessionId: string): void {
    if (!this.store.stopSession(sessionId)) {
      logApp(`[AgentSessionTracker] Stop requested for non-existent session: ${sessionId}`)
      return
    }

    logApp(`[AgentSessionTracker] Stopping session: ${sessionId}, remaining sessions: ${this.store.getActiveSessions().length}`)
  }

  /**
   * Mark a session as errored and move it to recent sessions
   */
  errorSession(sessionId: string, errorMessage: string): void {
    if (!this.store.errorSession(sessionId, errorMessage)) {
      logApp(`[AgentSessionTracker] Error reported for non-existent session: ${sessionId}`)
      return
    }

    logApp(`[AgentSessionTracker] Error in session: ${sessionId}, remaining sessions: ${this.store.getActiveSessions().length}`)
  }

  /**
   * Get all active sessions (only active sessions are stored now)
   */
  getActiveSessions(): AgentSession[] {
    return this.store.getActiveSessions()
  }

  /**
   * Get recent sessions (completed/stopped/error), newest first
   */
  getRecentSessions(limit: number = 4): AgentSession[] {
    return this.store.getRecentSessions(limit)
  }

  /**
   * Snooze a session (runs in background without stealing focus)
   */
  snoozeSession(sessionId: string): void {
    const session = this.store.getSession(sessionId)
    if (!session) {
      logApp(`[AgentSessionTracker] Cannot snooze - session not found: ${sessionId}`)
      return
    }

    logApp(`[AgentSessionTracker] Snoozing session: ${sessionId}, was snoozed: ${session.isSnoozed}`)
    this.store.snoozeSession(sessionId)
    logApp(`[AgentSessionTracker] Session ${sessionId} is now snoozed: ${this.store.getSession(sessionId)?.isSnoozed}`)
  }

  /**
   * Unsnooze a session (allow it to show progress UI again)
   */
  unsnoozeSession(sessionId: string): void {
    const session = this.store.getSession(sessionId)
    if (!session) {
      logApp(`[AgentSessionTracker] Cannot unsnooze - session not found: ${sessionId}`)
      return
    }

    logApp(`[AgentSessionTracker] Unsnoozing session: ${sessionId}, was snoozed: ${session.isSnoozed}`)
    this.store.unsnoozeSession(sessionId)
    logApp(`[AgentSessionTracker] Session ${sessionId} is now snoozed: ${this.store.getSession(sessionId)?.isSnoozed}`)
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.store.getSession(sessionId)
  }

  /**
   * Check if a session is snoozed
   */
  isSessionSnoozed(sessionId: string): boolean {
    return this.store.isSessionSnoozed(sessionId)
  }

  /**
   * Get the profile snapshot for a session
   * Returns the profile snapshot if the session exists and has one, undefined otherwise
   */
  getSessionProfileSnapshot(sessionId: string): SessionProfileSnapshot | undefined {
    return this.store.getSessionProfileSnapshot(sessionId)
  }

  /**
   * Get the conversation ID for a session, including completed sessions.
   */
  getConversationIdForSession(sessionId: string): string | undefined {
    return this.store.getConversationIdForSession(sessionId)
  }

  /**
   * Find a completed session by ID.
   * Returns the session if found in completed sessions, undefined otherwise.
   */
  findCompletedSession(sessionId: string): AgentSession | undefined {
    return this.store.findCompletedSession(sessionId)
  }

  /**
   * Find a session by conversationId (active or completed)
   * Returns the session ID if found, undefined otherwise
   */
  findSessionByConversationId(conversationId: string): string | undefined {
    return this.store.findSessionByConversationId(conversationId)
  }

  /**
   * Revive a completed session to continue it
   * Moves the session from completedSessions back to active sessions
   * @param sessionId - The session ID to revive
   * @param startSnoozed - If true, session stays snoozed (runs in background without showing panel)
   */
  reviveSession(sessionId: string, startSnoozed: boolean = false): boolean {
    if (this.store.getSession(sessionId)) {
      logApp(`[AgentSessionTracker] Session ${sessionId} is already active, preserving snooze state: ${this.store.getSession(sessionId)?.isSnoozed}`)
      return true
    }

    if (!this.store.reviveSession(sessionId, startSnoozed)) {
      logApp(`[AgentSessionTracker] Cannot revive - session not found: ${sessionId}`)
      return false
    }

    logApp(`[AgentSessionTracker] Revived session: ${sessionId}, snoozed: ${startSnoozed}`)
    return true
  }

  /**
   * Remove a single completed session by ID.
   * Returns true if the session was found and removed.
   */
  removeCompletedSession(sessionId: string): boolean {
    const removed = this.store.removeCompletedSession(sessionId)
    if (removed) {
      logApp(`[AgentSessionTracker] Removed completed session: ${sessionId}`)
    }
    return removed
  }

  /**
   * Clear all sessions (for testing/debugging)
   */
  clearAllSessions(): void {
    this.store.clearAllSessions()
  }

  /**
   * Clear all completed/recent sessions (move to history)
   * Active sessions are preserved
   */
  clearCompletedSessions(
    shouldClear: (session: AgentSession) => boolean = () => true,
  ): void {
    const completedCount = this.store.getRecentSessions(MAX_COMPLETED_SESSIONS).length
    this.store.clearCompletedSessions(shouldClear)
    logApp(`[AgentSessionTracker] Cleared ${completedCount - this.store.getRecentSessions(MAX_COMPLETED_SESSIONS).length} completed sessions`)
  }
}

export const agentSessionTracker = AgentSessionTracker.getInstance()
