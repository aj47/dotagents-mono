import type { ACPSubAgentState } from './types'
import { agentSessionTracker } from '../agent-session-tracker'
import { logApp } from '../debug'

const INTERNAL_COMPLETION_NUDGE_TEXT = [
  'A delegated run you started has completed.',
  'Review its result from the session state and continue only if more work is still required.',
  'If the overall task is done, produce the final response and mark work complete instead of repeating completed delegation work.',
].join(' ')

export class ACPBackgroundNotifier {
  private delegatedRuns: Map<string, ACPSubAgentState> | undefined

  setDelegatedRunsMap(map: Map<string, ACPSubAgentState>): void {
    this.delegatedRuns = map
  }

  startPolling(): void {
    // Remote ACP polling was removed during the acpx migration.
  }

  stopPolling(): void {
    // No-op: acpx delegated runs complete via local session events.
  }

  hasRunningTasks(): boolean {
    if (!this.delegatedRuns) return false
    for (const state of this.delegatedRuns.values()) {
      if (state.status === 'running' && state.isAsync) return true
    }
    return false
  }

  async resumeParentSessionIfNeeded(state: ACPSubAgentState): Promise<void> {
    if (!state.isAsync || !state.parentSessionId || state.parentResumeQueued) {
      return
    }

    const activeParentSession = agentSessionTracker.getSession(state.parentSessionId)
    if (activeParentSession?.status === 'active') {
      logApp(
        `[ACPBackgroundNotifier] Skipping parent resume for ${state.runId}; parent session ${state.parentSessionId} is already active`,
      )
      return
    }

    const completedSession = agentSessionTracker.findCompletedSession(state.parentSessionId)
    if (completedSession?.status === 'stopped') {
      logApp(
        `[ACPBackgroundNotifier] Skipping parent resume for ${state.runId}; parent session ${state.parentSessionId} was explicitly stopped by user`,
      )
      return
    }

    const conversationId = agentSessionTracker.getConversationIdForSession(state.parentSessionId)
    if (!conversationId) {
      logApp(
        `[ACPBackgroundNotifier] Cannot resume parent for ${state.runId}; conversation not found for session ${state.parentSessionId}`,
      )
      return
    }

    const revived = agentSessionTracker.reviveSession(state.parentSessionId, true)
    if (!revived) {
      logApp(
        `[ACPBackgroundNotifier] Cannot resume parent for ${state.runId}; failed to revive session ${state.parentSessionId}`,
      )
      return
    }

    state.parentResumeQueued = true

    try {
      const { runAgentLoopSession } = await import('../tipc')
      await runAgentLoopSession(
        INTERNAL_COMPLETION_NUDGE_TEXT,
        conversationId,
        state.parentSessionId,
      )
      logApp(
        `[ACPBackgroundNotifier] Resumed parent session ${state.parentSessionId} after delegated run ${state.runId}`,
      )
    } catch (error) {
      state.parentResumeQueued = false
      logApp('[ACPBackgroundNotifier] Failed to resume parent session:', error)
    }
  }
}

export const acpBackgroundNotifier = new ACPBackgroundNotifier()
