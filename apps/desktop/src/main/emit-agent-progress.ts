import { getRendererHandlers } from "@egoist/tipc/main"
import { WINDOWS, showPanelWindow, resizePanelForAgentMode } from "./window"
import { RendererHandlers } from "./renderer-handlers"
import { AgentProgressUpdate } from "../shared/types"
import { isPanelAutoShowSuppressed, agentSessionStateManager } from "./state"
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore } from "./config"
import { sanitizeAgentProgressUpdateForDisplay } from "@dotagents/shared"

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

/**
 * Send the update payload to all visible windows.
 */
function sendToWindows(update: AgentProgressUpdate): void {
  const main = WINDOWS.get("main")
  if (main && main.isVisible()) {
    try {
      const mainHandlers = getRendererHandlers<RendererHandlers>(main.webContents)
      mainHandlers.agentProgressUpdate.send(update)
    } catch {
      // Silently ignore send failures
    }
  }

  const panel = WINDOWS.get("panel")
  if (!panel) return

  // Handle auto-show logic for panel window
  const config = configStore.get()
  const floatingPanelAutoShowEnabled = config.floatingPanelAutoShow !== false
  const hidePanelWhenMainFocused = config.hidePanelWhenMainFocused !== false
  const isMainFocused = main?.isFocused() ?? false

  if (!panel.isVisible() && update.sessionId) {
    const isSnoozed = agentSessionTracker.isSessionSnoozed(update.sessionId)
    if (floatingPanelAutoShowEnabled && !isPanelAutoShowSuppressed() && !isSnoozed && !(hidePanelWhenMainFocused && isMainFocused)) {
      resizePanelForAgentMode()
      showPanelWindow()
    }
  }

  try {
    const handlers = getRendererHandlers<RendererHandlers>(panel.webContents)
    if (!handlers.agentProgressUpdate) return
    handlers.agentProgressUpdate.send(update)
  } catch {
    // Silently ignore handler failures
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

  // Backfill snoozed state from the session tracker when callers omit it.
  // Tile follow-ups intentionally start snoozed so the panel stays quiet; if
  // early progress updates lose that flag, the renderer can briefly switch the
  // hidden panel into overlay/agent mode and trigger unintended focus/TTS side effects.
  if (displayUpdate.sessionId && typeof displayUpdate.isSnoozed === "undefined") {
    displayUpdate.isSnoozed = agentSessionTracker.isSessionSnoozed(displayUpdate.sessionId)
  }

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
    sendToWindows(displayUpdate)

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
    sendToWindows(displayUpdate)
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
          sendToWindows(s.pendingUpdate)
          s.pendingUpdate = null
        }
        if (s) s.timer = null
      }, remaining)
    }
  }
}
