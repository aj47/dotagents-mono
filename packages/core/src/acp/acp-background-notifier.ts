import { acpClientService } from './acp-client-service'
import { agentSessionStateManager } from '../state'
import type { ACPDelegationProgress } from '@dotagents/shared'
import { logApp } from '../debug'
import type { ACPSubAgentState } from './types'
import type { ProgressEmitter } from '../interfaces/progress-emitter'
import type { NotificationService } from '../interfaces/notification-service'
import type { AgentProgressUpdate } from '../types'

// ============================================================================
// Dependency interfaces for services not yet extracted to core.
// The host app injects implementations at startup via the setters below.
// ============================================================================

/**
 * Minimal interface for the agent session tracker methods used by the background notifier.
 */
export interface ACPBackgroundNotifierSessionTracker {
  getSession(sessionId: string): { status?: string } | undefined
  findCompletedSession(sessionId: string): { status?: string } | undefined
  getConversationIdForSession(sessionId: string): string | undefined
  reviveSession(sessionId: string, isLoop: boolean): boolean
  getSessionProfileSnapshot(sessionId: string): unknown
}

/**
 * Callback to resume a parent agent session after async delegation completes.
 */
export type RunAgentLoopSessionFn = (prompt: string, conversationId: string, sessionId: string) => Promise<void>

// Module-level injected dependencies
let _progressEmitter: ProgressEmitter | null = null
let _notificationService: NotificationService | null = null
let _agentSessionTracker: ACPBackgroundNotifierSessionTracker | null = null
let _runAgentLoopSession: RunAgentLoopSessionFn | null = null

/**
 * Set the ProgressEmitter for the ACP background notifier.
 */
export function setACPBackgroundNotifierProgressEmitter(emitter: ProgressEmitter): void {
  _progressEmitter = emitter
}

/**
 * Set the NotificationService for the ACP background notifier (replaces Electron Notification).
 */
export function setACPBackgroundNotifierNotificationService(service: NotificationService): void {
  _notificationService = service
}

/**
 * Set the agent session tracker for the ACP background notifier.
 */
export function setACPBackgroundNotifierSessionTracker(tracker: ACPBackgroundNotifierSessionTracker): void {
  _agentSessionTracker = tracker
}

/**
 * Set the runAgentLoopSession callback (replaces dynamic import of tipc).
 */
export function setACPBackgroundNotifierRunAgentLoopSession(fn: RunAgentLoopSessionFn): void {
  _runAgentLoopSession = fn
}

/** Helper to emit agent progress using injected ProgressEmitter */
function emitAgentProgress(update: AgentProgressUpdate): Promise<void> {
  if (_progressEmitter) {
    _progressEmitter.emitAgentProgress(update)
  }
  return Promise.resolve()
}

/**
 * Constant for the internal completion nudge text.
 * Defined locally to avoid circular imports with llm.ts.
 */
const INTERNAL_COMPLETION_NUDGE_TEXT =
  `If all requested work is complete, use respond_to_user to tell the user the result, then call mark_work_complete with a concise summary. Otherwise continue working and call more tools.`

/**
 * Background polling and notification system for ACP delegations.
 * Monitors running delegated tasks and emits completion notifications to the UI.
 */
export class ACPBackgroundNotifier {
  private pollingInterval: ReturnType<typeof setInterval> | undefined
  private delegatedRuns: Map<string, ACPSubAgentState> | undefined
  private readonly POLL_INTERVAL_MS = 3000

  /**
   * Sets the reference to the delegated runs map from acp-router-tools.
   */
  setDelegatedRunsMap(map: Map<string, ACPSubAgentState>): void {
    this.delegatedRuns = map
  }

  /**
   * Starts the polling loop if not already running.
   */
  startPolling(): void {
    if (this.pollingInterval) {
      return
    }

    logApp('[ACPBackgroundNotifier] Starting polling for delegated tasks')
    this.pollingInterval = setInterval(() => {
      this.pollRunningTasks().catch((error) => {
        logApp('[ACPBackgroundNotifier] Error during polling:', error)
      })
    }, this.POLL_INTERVAL_MS)
  }

  /**
   * Clears the polling interval.
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      logApp('[ACPBackgroundNotifier] Stopping polling')
      clearInterval(this.pollingInterval)
      this.pollingInterval = undefined
    }
  }

  /**
   * Returns true if any tasks are poll-worthy or awaiting setup.
   * 
   * Includes:
   * - Running tasks with baseUrl and acpRunId (actively pollable)
   * - Running tasks with baseUrl but no acpRunId yet (async POST /runs in flight)
   * 
   * The second case prevents premature stopPolling() when a remote async run
   * is being started and acpRunId hasn't been populated yet.
   */
  hasRunningTasks(): boolean {
    if (!this.delegatedRuns) {
      return false
    }

    for (const state of this.delegatedRuns.values()) {
      // Actively pollable: running + remote baseUrl + acpRunId assigned
      if (state.status === 'running' && state.baseUrl && state.acpRunId) {
        return true
      }
      // Awaiting acpRunId: running + remote baseUrl but POST /runs still in flight
      // Keep polling alive to avoid dropping notifications on slow networks
      if (state.status === 'running' && state.baseUrl && !state.acpRunId) {
        return true
      }
    }
    return false
  }

  /**
   * Polls running tasks for status updates and emits notifications.
   */
  async pollRunningTasks(): Promise<void> {
    if (!this.delegatedRuns) {
      return
    }

    for (const [runId, state] of this.delegatedRuns.entries()) {
      if (state.status !== 'running' || !state.baseUrl || !state.acpRunId) {
        continue
      }

      try {
        const result = await acpClientService.getRunStatus(state.baseUrl, state.acpRunId)

        // Handle all terminal states: completed, failed, and cancelled
        if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
          // Update the task state
          state.status = result.status
          state.result = result

          logApp(
            `[ACPBackgroundNotifier] Task ${runId} (${state.agentName}) ${result.status}`
          )

          // Notify the UI
          await this.emitDelegationComplete(state)
        }
      } catch (error) {
        logApp(
          `[ACPBackgroundNotifier] Error checking status for task ${runId}:`,
          error
        )
      }
    }

    // Stop polling if no running tasks remain
    if (!this.hasRunningTasks()) {
      this.stopPolling()
    }
  }

  /**
   * Emits a notification when a delegation completes.
   */
  private async emitDelegationComplete(state: ACPSubAgentState): Promise<void> {
    logApp(
      `[ACPBackgroundNotifier] Emitting completion notification for ${state.agentName} (${state.runId})`
    )

    // Extract result summary from output messages
    let resultSummary: string | undefined
    if (state.result?.output && state.result.output.length > 0) {
      // Get text content from the first message's parts
      const firstMessage = state.result.output[0]
      if (firstMessage.parts && firstMessage.parts.length > 0) {
        // Filter for text parts (content_type is undefined or text/plain)
        const textParts = firstMessage.parts
          .filter((p) => !p.content_type || p.content_type.startsWith('text/'))
          .map((p) => p.content)
          .join(' ')
        resultSummary = textParts.substring(0, 200)
      }
    }

    const delegationProgress: ACPDelegationProgress = {
      runId: state.runId,
      agentName: state.agentName,
      connectionType: state.connectionType,
      task: state.task,
      status: state.status,
      startTime: state.startTime,
      endTime: Date.now(),
      progressMessage: state.progress,
      resultSummary,
      error: state.status === 'failed' ? state.result?.error : undefined,
      acpSessionId: state.acpSessionId,
      subSessionId: state.subSessionId,
      conversationId: state.conversationId,
      acpRunId: state.acpRunId,
    }

    // Map status to step status - completed is success, everything else (failed/cancelled) is error
    const stepStatus = state.status === 'completed' ? 'completed' : 'error'

    // Emit progress update to UI
    // IMPORTANT: isComplete is always false because this is a delegation progress update,
    // not a completion of the parent session. The parent session may continue running after
    // the delegation completes (e.g., the main agent processes the result and continues).
    // Setting isComplete: true here would incorrectly mark the parent session as done.
    await emitAgentProgress({
      sessionId: state.parentSessionId,
      runId: state.parentRunId ?? agentSessionStateManager.getSessionRunId(state.parentSessionId),
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [
        {
          id: `delegation-complete-${state.runId}`,
          type: 'completion',
          title: `Delegation ${state.status}: ${state.agentName}`,
          description: state.task,
          status: stepStatus,
          timestamp: Date.now(),
          delegation: delegationProgress,
        },
      ],
    })

    // Show native OS notification via NotificationService
    this.showSystemNotification(state, resultSummary)

    await this.resumeParentSessionIfNeeded(state)
  }

  async resumeParentSessionIfNeeded(state: ACPSubAgentState): Promise<void> {
    if (!state.isAsync || !state.parentSessionId || state.parentResumeQueued) {
      return
    }

    if (!_agentSessionTracker) {
      logApp('[ACPBackgroundNotifier] Cannot resume parent session: agentSessionTracker not set')
      return
    }

    const activeParentSession = _agentSessionTracker.getSession(state.parentSessionId)
    if (activeParentSession?.status === 'active') {
      logApp(
        `[ACPBackgroundNotifier] Skipping parent resume for ${state.runId}; parent session ${state.parentSessionId} is already active`
      )
      return
    }

    // Check if the session was explicitly stopped by the user — don't revive zombie sessions
    const completedSession = _agentSessionTracker.findCompletedSession(state.parentSessionId)
    if (completedSession?.status === 'stopped') {
      logApp(
        `[ACPBackgroundNotifier] Skipping parent resume for ${state.runId}; parent session ${state.parentSessionId} was explicitly stopped by user`
      )
      return
    }

    const conversationId = _agentSessionTracker.getConversationIdForSession(state.parentSessionId)
    if (!conversationId) {
      logApp(
        `[ACPBackgroundNotifier] Cannot resume parent for ${state.runId}; conversation not found for session ${state.parentSessionId}`
      )
      return
    }

    const revived = _agentSessionTracker.reviveSession(state.parentSessionId, true)
    if (!revived) {
      logApp(
        `[ACPBackgroundNotifier] Cannot resume parent for ${state.runId}; failed to revive session ${state.parentSessionId}`
      )
      return
    }

    state.parentResumeQueued = true

    if (!_runAgentLoopSession) {
      logApp('[ACPBackgroundNotifier] Cannot resume parent session: runAgentLoopSession not set')
      state.parentResumeQueued = false
      return
    }

    try {
      await _runAgentLoopSession(
        INTERNAL_COMPLETION_NUDGE_TEXT,
        conversationId,
        state.parentSessionId,
      )
      logApp(
        `[ACPBackgroundNotifier] Resumed parent session ${state.parentSessionId} after delegated run ${state.runId}`
      )
    } catch (error) {
      state.parentResumeQueued = false
      logApp('[ACPBackgroundNotifier] Failed to resume parent session:', error)
    }
  }

  /**
   * Shows a system notification for delegation completion via NotificationService.
   */
  private showSystemNotification(state: ACPSubAgentState, resultSummary?: string): void {
    try {
      if (!_notificationService || !_notificationService.isSupported()) {
        logApp('[ACPBackgroundNotifier] System notifications not supported or service not set')
        return
      }

      const duration = Math.round((Date.now() - state.startTime) / 1000)

      // Determine title based on status (completed, failed, or cancelled)
      let title: string
      if (state.status === 'completed') {
        title = `✅ ${state.agentName} completed`
      } else if (state.status === 'cancelled') {
        title = `⚠️ ${state.agentName} cancelled`
      } else {
        title = `❌ ${state.agentName} failed`
      }

      const body = resultSummary
        ? `${state.task.substring(0, 50)}${state.task.length > 50 ? '...' : ''}\n${resultSummary.substring(0, 100)}${resultSummary.length > 100 ? '...' : ''}`
        : `${state.task.substring(0, 100)}${state.task.length > 100 ? '...' : ''}\nCompleted in ${duration}s`

      _notificationService.showNotificationWithOptions({
        title,
        body,
        silent: false,
      })
    } catch (error) {
      logApp('[ACPBackgroundNotifier] Failed to show system notification:', error)
    }
  }
}

export const acpBackgroundNotifier = new ACPBackgroundNotifier()
