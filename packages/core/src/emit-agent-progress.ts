/**
 * Throttled agent progress emission.
 *
 * Extracted from apps/desktop/src/main/emit-agent-progress.ts.
 * All WINDOWS/tipc renderer communication replaced with ProgressEmitter.
 * Panel auto-show logic removed (handled by desktop ProgressEmitter implementation).
 */

import type { AgentProgressUpdate } from "@dotagents/shared"
import { sanitizeAgentProgressUpdateForDisplay } from "@dotagents/shared"
import { agentSessionStateManager } from "./state"
import type { ProgressEmitter } from "./interfaces/progress-emitter"

// Throttle interval for non-critical progress updates (ms).
// Updates within this window are collapsed — only the latest is sent.
const THROTTLE_INTERVAL_MS = 150

// Per-session throttle state
const sessionThrottleState = new Map<string, {
  timer: ReturnType<typeof setTimeout> | null
  lastSendTime: number
  pendingUpdate: AgentProgressUpdate | null
  runId?: number
}>()

// Module-level ProgressEmitter for sending updates to UI
let _progressEmitter: ProgressEmitter | null = null

/**
 * Set the ProgressEmitter implementation. Must be called at startup.
 */
export function setEmitAgentProgressEmitter(emitter: ProgressEmitter): void {
  _progressEmitter = emitter
}

/**
 * Send the update payload to all UI surfaces via ProgressEmitter.
 * Desktop implementation handles window routing and panel auto-show.
 */
function sendToUI(update: AgentProgressUpdate): void {
  if (!_progressEmitter) return
  try {
    _progressEmitter.emitAgentProgress(update)
  } catch {
    // Silently ignore send failures
  }
}

/**
 * Determine whether an update must be sent immediately (not throttled).
 * Critical updates include: completion, tool approvals, user responses, errors,
 * and the first update for a session.
 */
function isCriticalUpdate(update: AgentProgressUpdate): boolean {
  if (update.isComplete) return true
  if (update.pendingToolApproval) return true
  if (typeof update.userResponse === "string" && update.userResponse.trim().length > 0) return true
  // First update for a session — send immediately
  if (update.sessionId && !sessionThrottleState.has(update.sessionId)) return true
  // Steps with error or awaiting_approval status
  if (update.steps?.some(s => s.status === "error" || s.status === "awaiting_approval")) return true
  return false
}

export async function emitAgentProgress(update: AgentProgressUpdate): Promise<void> {
  const displayUpdate = sanitizeAgentProgressUpdateForDisplay(update)

  // Skip updates for stopped sessions, except final completion updates
  if (displayUpdate.sessionId && !displayUpdate.isComplete) {
    const shouldStop = agentSessionStateManager.shouldStopSession(displayUpdate.sessionId)
    if (shouldStop) {
      const state = sessionThrottleState.get(displayUpdate.sessionId)
      if (state?.timer) {
        clearTimeout(state.timer)
      }
      sessionThrottleState.delete(displayUpdate.sessionId)
      return
    }
  }

  const sessionId = displayUpdate.sessionId || "__global__"
  const incomingRunId = displayUpdate.runId
  let state = sessionThrottleState.get(sessionId)

  if (displayUpdate.sessionId && typeof incomingRunId === "number") {
    const currentRunId = agentSessionStateManager.getSessionRunId(displayUpdate.sessionId)
    if (typeof currentRunId === "number" && incomingRunId < currentRunId) {
      return
    }
  }

  // Drop stale updates from older runs when session IDs are reused.
  if (typeof incomingRunId === "number") {
    if (!state) {
      state = { timer: null, lastSendTime: 0, pendingUpdate: null, runId: incomingRunId }
      sessionThrottleState.set(sessionId, state)
    } else if (typeof state.runId === "number" && incomingRunId < state.runId) {
      return
    } else if (typeof state.runId === "number" && incomingRunId > state.runId) {
      if (state.timer) {
        clearTimeout(state.timer)
      }
      state = { timer: null, lastSendTime: 0, pendingUpdate: null, runId: incomingRunId }
      sessionThrottleState.set(sessionId, state)
    } else if (state.runId === undefined) {
      state.runId = incomingRunId
    }
  }

  // Critical updates bypass the throttle entirely
  if (isCriticalUpdate(displayUpdate)) {
    // Flush any pending throttled update for this session first
    if (state?.timer) {
      clearTimeout(state.timer)
      state.timer = null
      state.pendingUpdate = null
    }

    // Send immediately
    sendToUI(displayUpdate)

    // Update throttle state
    sessionThrottleState.set(sessionId, {
      timer: null,
      lastSendTime: Date.now(),
      pendingUpdate: null,
      runId: typeof incomingRunId === "number" ? incomingRunId : state?.runId,
    })

    // Clean up throttle state when session completes
    if (displayUpdate.isComplete) {
      sessionThrottleState.delete(sessionId)
    }
    return
  }

  // Non-critical update — apply throttling
  if (!state) {
    state = {
      timer: null,
      lastSendTime: 0,
      pendingUpdate: null,
      runId: typeof incomingRunId === "number" ? incomingRunId : undefined,
    }
    sessionThrottleState.set(sessionId, state)
  }

  const now = Date.now()
  const elapsed = now - state.lastSendTime

  if (elapsed >= THROTTLE_INTERVAL_MS) {
    // Enough time has passed — send immediately
    if (state.timer) {
      clearTimeout(state.timer)
      state.timer = null
    }
    state.pendingUpdate = null
    state.lastSendTime = now
    sendToUI(displayUpdate)
  } else {
    // Within throttle window — store as pending and schedule a trailing send
    state.pendingUpdate = displayUpdate
    if (!state.timer) {
      const remaining = THROTTLE_INTERVAL_MS - elapsed
      state.timer = setTimeout(() => {
        const s = sessionThrottleState.get(sessionId)
        if (s?.pendingUpdate) {
          const pendingRunId = s.pendingUpdate.runId
          if (typeof pendingRunId === "number" && typeof s.runId === "number" && pendingRunId < s.runId) {
            s.pendingUpdate = null
            s.timer = null
            return
          }
          if (
            s.pendingUpdate.sessionId &&
            !s.pendingUpdate.isComplete &&
            agentSessionStateManager.shouldStopSession(s.pendingUpdate.sessionId)
          ) {
            s.pendingUpdate = null
            s.timer = null
            sessionThrottleState.delete(sessionId)
            return
          }
          s.lastSendTime = Date.now()
          sendToUI(s.pendingUpdate)
          s.pendingUpdate = null
        }
        if (s) s.timer = null
      }, remaining)
    }
  }
}
