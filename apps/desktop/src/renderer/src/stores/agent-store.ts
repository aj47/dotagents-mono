import { create } from 'zustand'
import { AgentProgressUpdate, QueuedMessage } from '@shared/types'
import { clearSessionTTSTracking } from '@renderer/lib/tts-tracking'
import {
  sanitizeAgentProgressUpdateForDisplay,
} from '@dotagents/shared/message-display-utils'
import { logUI } from '@renderer/lib/debug'

const getProgressActivityTimestamp = (progress: AgentProgressUpdate): number => {
  const historyTs =
    progress.conversationHistory && progress.conversationHistory.length > 0
      ? progress.conversationHistory[progress.conversationHistory.length - 1]?.timestamp || 0
      : 0
  const stepTs =
    progress.steps && progress.steps.length > 0
      ? progress.steps[progress.steps.length - 1]?.timestamp || 0
      : 0
  return Math.max(historyTs, stepTs, 0)
}

export type SessionViewMode = 'grid' | 'list' | 'kanban'
export type SessionFilter = 'all' | 'active' | 'completed' | 'error'
export type SessionSortBy = 'recent' | 'oldest' | 'status'

interface AgentState {
  agentProgressById: Map<string, AgentProgressUpdate>
  focusedSessionId: string | null
  expandedSessionId: string | null
  viewedConversationId: string | null
  scrollToSessionId: string | null
  messageQueuesByConversation: Map<string, QueuedMessage[]> // Message queues per conversation
  pausedQueueConversations: Set<string> // Conversations with paused queues

  viewMode: SessionViewMode
  filter: SessionFilter
  sortBy: SessionSortBy
  pinnedSessionIds: Set<string>
  archivedSessionIds: Set<string>

  updateSessionProgress: (update: AgentProgressUpdate) => void
  clearAllProgress: () => void
  clearSessionProgress: (sessionId: string) => void
  clearInactiveSessions: () => void
  setFocusedSessionId: (sessionId: string | null) => void
  setExpandedSessionId: (sessionId: string | null) => void
  setViewedConversationId: (conversationId: string | null) => void
  setScrollToSessionId: (sessionId: string | null) => void
  setSessionSnoozed: (sessionId: string, isSnoozed: boolean) => void
  getAgentProgress: () => AgentProgressUpdate | null

  // Message queue actions
  updateMessageQueue: (conversationId: string, queue: QueuedMessage[], isPaused: boolean) => void
  getMessageQueue: (conversationId: string) => QueuedMessage[]
  isQueuePaused: (conversationId: string) => boolean

  // Optimistic UI update: append a user message to a session's conversation history
  appendUserMessageToSession: (sessionId: string, message: string) => void

  setViewMode: (mode: SessionViewMode) => void
  setFilter: (filter: SessionFilter) => void
  setSortBy: (sortBy: SessionSortBy) => void
  setPinnedSessionIds: (sessionIds: Iterable<string>) => void
  togglePinSession: (sessionId: string) => void
  isPinned: (sessionId: string) => boolean
  setArchivedSessionIds: (sessionIds: Iterable<string>) => void
  toggleArchiveSession: (sessionId: string) => void
  isArchived: (sessionId: string) => boolean
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agentProgressById: new Map(),
  focusedSessionId: null,
  expandedSessionId: null,
  viewedConversationId: null,
  scrollToSessionId: null,
  messageQueuesByConversation: new Map(),
  pausedQueueConversations: new Set(),

  viewMode: 'grid' as SessionViewMode,
  filter: 'all' as SessionFilter,
  sortBy: 'recent' as SessionSortBy,
  pinnedSessionIds: new Set<string>(),
  archivedSessionIds: new Set<string>(),

  updateSessionProgress: (incomingUpdate: AgentProgressUpdate) => {
    const update = sanitizeAgentProgressUpdateForDisplay(incomingUpdate)
    const sessionId = update.sessionId

    set((state) => {
      const newMap = new Map(state.agentProgressById)
      const isNewSession = !newMap.has(sessionId)
      const existingProgress = newMap.get(sessionId)
      const isReactivation = !!existingProgress && existingProgress.isComplete && !update.isComplete

      if (
        existingProgress &&
        typeof existingProgress.runId === 'number' &&
        typeof update.runId === 'number' &&
        update.runId < existingProgress.runId
      ) {
        return state
      }

      let mergedUpdate = update
      if (existingProgress) {
        const isNewRun =
          typeof existingProgress.runId === 'number' &&
          typeof update.runId === 'number' &&
          update.runId > existingProgress.runId
        if (isNewRun) {
          // New run on a reused session: reset run-scoped UI fields and keep only stable metadata.
          mergedUpdate = {
            ...update,
            conversationId: update.conversationId ?? existingProgress.conversationId,
            conversationTitle: update.conversationTitle ?? existingProgress.conversationTitle,
            isSnoozed: update.isSnoozed ?? existingProgress.isSnoozed,
            sessionStartIndex: update.sessionStartIndex ?? existingProgress.sessionStartIndex,
          }
        } else if (existingProgress.isComplete && !update.isComplete && !isNewRun) {
          // Same run: never revert isComplete from true → false.
          // This prevents late/stale non-complete updates (e.g. from ACP delegation
          // callbacks or throttled progress updates) from overwriting the kill-switch
          // completion state and making a stopped tile appear active again.
          return state
        } else {
          const hasEmptyHistory = !update.conversationHistory || update.conversationHistory.length === 0
          const hasEmptySteps = !update.steps || update.steps.length === 0

          // Detect session revival: transitioning from complete → active.
          // Clear run-scoped response fields so prior-turn responses are never
          // replayed into the new run. Historical display can fall back to the
          // persisted conversation transcript instead.
          const isRevival = existingProgress.isComplete && !update.isComplete

          // Merge delegation steps: preserve existing delegation steps and update/add new ones
          // This ensures parallel delegations and completed delegations persist
          const mergedSteps = (() => {
            const existingSteps = existingProgress.steps || []
            const newSteps = update.steps || []

            // Extract existing delegation steps (keyed by runId)
            const existingDelegationSteps = new Map<string, typeof existingSteps[0]>()
            const existingNonDelegationSteps: typeof existingSteps = []

            for (const step of existingSteps) {
              if (step.delegation?.runId) {
                existingDelegationSteps.set(step.delegation.runId, step)
              } else {
                existingNonDelegationSteps.push(step)
              }
            }

            // Extract new delegation steps (keyed by runId)
            const newDelegationSteps = new Map<string, typeof newSteps[0]>()
            const newNonDelegationSteps: typeof newSteps = []

            for (const step of newSteps) {
              if (step.delegation?.runId) {
                newDelegationSteps.set(step.delegation.runId, step)
              } else {
                newNonDelegationSteps.push(step)
              }
            }

            // Merge delegation steps: new ones override existing ones with same runId
            const mergedDelegationSteps = new Map(existingDelegationSteps)
            for (const [runId, step] of newDelegationSteps) {
              const existingStep = mergedDelegationSteps.get(runId)
              if (existingStep?.delegation || step.delegation) {
                mergedDelegationSteps.set(runId, {
                  ...existingStep,
                  ...step,
                  delegation: {
                    ...existingStep?.delegation,
                    ...step.delegation,
                  },
                })
              } else {
                mergedDelegationSteps.set(runId, step)
              }
            }

            // Use new non-delegation steps if available, otherwise keep existing
            const finalNonDelegationSteps = newNonDelegationSteps.length > 0
              ? newNonDelegationSteps
              : existingNonDelegationSteps

            // Combine: non-delegation steps first, then delegation steps
            return [...finalNonDelegationSteps, ...Array.from(mergedDelegationSteps.values())]
          })()

          if (hasEmptyHistory || hasEmptySteps) {
            mergedUpdate = {
              ...existingProgress,
              ...update,
              ...(isRevival ? { userResponse: undefined, userResponseHistory: undefined, responseEvents: undefined } : {}),
              // Explicitly handle pendingToolApproval: if update has the key (even if undefined),
              // use the update value; otherwise preserve existing. This ensures clearing works.
              pendingToolApproval: 'pendingToolApproval' in update
                ? update.pendingToolApproval
                : existingProgress.pendingToolApproval,
              conversationHistory: hasEmptyHistory
                ? existingProgress.conversationHistory
                : update.conversationHistory,
              steps: hasEmptySteps
                ? existingProgress.steps
                : mergedSteps,
            }
          } else {
            // Even when update has non-empty steps, we need to preserve delegation steps
            mergedUpdate = {
              ...existingProgress,
              ...update,
              ...(isRevival ? { userResponse: undefined, userResponseHistory: undefined, responseEvents: undefined } : {}),
              // Explicitly handle pendingToolApproval: if update has the key (even if undefined),
              // use the update value; otherwise preserve existing. This ensures clearing works.
              pendingToolApproval: 'pendingToolApproval' in update
                ? update.pendingToolApproval
                : existingProgress.pendingToolApproval,
              steps: mergedSteps,
            }
          }
        }
      }

      if (isReactivation) {
        logUI('[AgentStore] Session reactivated', {
          sessionId,
          existingHadUserResponse: !!existingProgress?.userResponse,
          updateHasUserResponse: !!update.userResponse,
          mergedHasUserResponse: !!mergedUpdate.userResponse,
          existingHistoryLength: existingProgress?.userResponseHistory?.length || 0,
          mergedHistoryLength: mergedUpdate.userResponseHistory?.length || 0,
        })
        if (existingProgress?.userResponse && !mergedUpdate.userResponse) {
          logUI('[AgentStore] Reactivation dropped userResponse after merge', {
            sessionId,
            existingUserResponseLength: existingProgress.userResponse.length,
          })
        }
      }

      // Prevent stale isStreaming: true from persisting in the store.
      // This can happen because the throttle in emit-agent-progress.ts discards a
      // pending "clear streaming" update (isComplete: false, isStreaming: false) when
      // a critical completion update (isComplete: true, no streamingContent) arrives.
      // The spread merge then inherits isStreaming: true from existingProgress.
      // Rule: if the incoming update does NOT include streamingContent at all, we must
      // not keep a stale isStreaming: true.  Also, a completed session must never show
      // the spinner regardless of how the update was constructed.
      if (
        mergedUpdate.streamingContent?.isStreaming &&
        (!('streamingContent' in update) || mergedUpdate.isComplete)
      ) {
        mergedUpdate = {
          ...mergedUpdate,
          streamingContent: {
            ...mergedUpdate.streamingContent,
            isStreaming: false,
          },
        }
      }

      newMap.set(sessionId, mergedUpdate)

      // Auto-focus new active sessions.
      // Also steal focus from a completed session so the panel doesn't
      // re-show an old finished session when a new one starts.
      let newFocusedSessionId = state.focusedSessionId
      if (isNewSession && !mergedUpdate.isSnoozed && !mergedUpdate.isComplete) {
        const currentFocusedProgress = state.focusedSessionId
          ? newMap.get(state.focusedSessionId)
          : undefined
        if (!state.focusedSessionId || currentFocusedProgress?.isComplete) {
          newFocusedSessionId = sessionId
        }
      }

      return {
        agentProgressById: newMap,
        focusedSessionId: newFocusedSessionId,
      }
    })
  },

  clearAllProgress: () => {
    // Clear TTS tracking for all sessions being removed
    const state = get()
    for (const sessionId of state.agentProgressById.keys()) {
      clearSessionTTSTracking(sessionId)
    }
    set({
      agentProgressById: new Map(),
      focusedSessionId: null,
      expandedSessionId: null,
    })
  },

  clearSessionProgress: (sessionId: string) => {
    // Clear TTS tracking for this session
    clearSessionTTSTracking(sessionId)
    set((state) => {
      const newMap = new Map(state.agentProgressById)
      newMap.delete(sessionId)

      // If the cleared session was focused, move focus to next active session
      let newFocusedSessionId = state.focusedSessionId
      if (state.focusedSessionId === sessionId) {
        // Find next active (non-snoozed) session, preferring most recent
        const candidates = Array.from(newMap.entries())
          .filter(([_, p]) => !p.isSnoozed)
          .sort((a, b) => {
            const ta = getProgressActivityTimestamp(a[1])
            const tb = getProgressActivityTimestamp(b[1])
            return tb - ta
          })
        newFocusedSessionId = candidates[0]?.[0] || null
      }

      // If the cleared session was expanded, collapse back to grid view
      let newExpandedSessionId = state.expandedSessionId
      if (state.expandedSessionId === sessionId) {
        newExpandedSessionId = null
      }

      return {
        agentProgressById: newMap,
        focusedSessionId: newFocusedSessionId,
        expandedSessionId: newExpandedSessionId,
      }
    })
  },

  clearInactiveSessions: () => {
    // Clear TTS tracking for sessions being removed
    const state = get()
    for (const [sessionId, progress] of state.agentProgressById.entries()) {
      if (progress.isComplete) {
        clearSessionTTSTracking(sessionId)
      }
    }
    set((state) => {
      const newMap = new Map<string, AgentProgressUpdate>()

      // Keep only active (not complete) sessions
      for (const [sessionId, progress] of state.agentProgressById.entries()) {
        if (!progress.isComplete) {
          newMap.set(sessionId, progress)
        }
      }

      // If the focused session was cleared, move focus to next active session
      let newFocusedSessionId = state.focusedSessionId
      if (state.focusedSessionId && !newMap.has(state.focusedSessionId)) {
        const candidates = Array.from(newMap.entries())
          .filter(([_, p]) => !p.isSnoozed)
          .sort((a, b) => {
            const ta = getProgressActivityTimestamp(a[1])
            const tb = getProgressActivityTimestamp(b[1])
            return tb - ta
          })
        newFocusedSessionId = candidates[0]?.[0] || null
      }

      // If the expanded session was cleared, collapse back to grid view
      let newExpandedSessionId = state.expandedSessionId
      if (state.expandedSessionId && !newMap.has(state.expandedSessionId)) {
        newExpandedSessionId = null
      }

      return {
        agentProgressById: newMap,
        focusedSessionId: newFocusedSessionId,
        expandedSessionId: newExpandedSessionId,
      }
    })
  },

  setFocusedSessionId: (sessionId: string | null) => {
    set({ focusedSessionId: sessionId })
  },

  setExpandedSessionId: (sessionId: string | null) => {
    set({ expandedSessionId: sessionId })
  },

  setViewedConversationId: (conversationId: string | null) => {
    set({ viewedConversationId: conversationId })
  },

  setScrollToSessionId: (sessionId: string | null) => {
    set({ scrollToSessionId: sessionId })
  },

  setSessionSnoozed: (sessionId: string, isSnoozed: boolean) => {
    set((state) => {
      const existingProgress = state.agentProgressById.get(sessionId)
      if (!existingProgress) return state

      const newMap = new Map(state.agentProgressById)
      newMap.set(sessionId, { ...existingProgress, isSnoozed })

      let newFocusedSessionId = state.focusedSessionId
      if (isSnoozed && state.focusedSessionId === sessionId) {
        const candidates = Array.from(newMap.entries())
          .filter(([_, p]) => !p.isSnoozed)
          .sort((a, b) => {
            const ta = getProgressActivityTimestamp(a[1])
            const tb = getProgressActivityTimestamp(b[1])
            return tb - ta
          })
        newFocusedSessionId = candidates[0]?.[0] || null
      }

      return {
        agentProgressById: newMap,
        focusedSessionId: newFocusedSessionId,
      }
    })
  },

  getAgentProgress: () => {
    const state = get()
    if (!state.focusedSessionId) return null
    return state.agentProgressById.get(state.focusedSessionId) ?? null
  },

  appendUserMessageToSession: (sessionId: string, message: string) => {
    set((state) => {
      const existingProgress = state.agentProgressById.get(sessionId)
      if (!existingProgress) return state

      const newMap = new Map(state.agentProgressById)
      const existingHistory = existingProgress.conversationHistory || []
      newMap.set(sessionId, {
        ...existingProgress,
        conversationHistory: [
          ...existingHistory,
          { role: "user" as const, content: message, timestamp: Date.now() },
        ],
      })
      return { agentProgressById: newMap }
    })
  },

  // Message queue actions
  updateMessageQueue: (conversationId: string, queue: QueuedMessage[], isPaused: boolean) => {
    set((state) => {
      const newQueueMap = new Map(state.messageQueuesByConversation)
      const newPausedSet = new Set(state.pausedQueueConversations)

      if (queue.length === 0) {
        newQueueMap.delete(conversationId)
      } else {
        newQueueMap.set(conversationId, queue)
      }

      if (isPaused) {
        newPausedSet.add(conversationId)
      } else {
        newPausedSet.delete(conversationId)
      }

      return {
        messageQueuesByConversation: newQueueMap,
        pausedQueueConversations: newPausedSet,
      }
    })
  },

  getMessageQueue: (conversationId: string) => {
    return get().messageQueuesByConversation.get(conversationId) || []
  },

  isQueuePaused: (conversationId: string) => {
    return get().pausedQueueConversations.has(conversationId)
  },

  // View settings actions
  setViewMode: (mode: SessionViewMode) => {
    set({ viewMode: mode })
  },

  setFilter: (filter: SessionFilter) => {
    set({ filter })
  },

  setSortBy: (sortBy: SessionSortBy) => {
    set({ sortBy })
  },

  setPinnedSessionIds: (sessionIds: Iterable<string>) => {
    set({ pinnedSessionIds: new Set(sessionIds) })
  },

  togglePinSession: (sessionId: string) => {
    set((state) => {
      const newPinned = new Set(state.pinnedSessionIds)
      if (newPinned.has(sessionId)) {
        newPinned.delete(sessionId)
      } else {
        newPinned.add(sessionId)
      }
      return { pinnedSessionIds: newPinned }
    })
  },

  isPinned: (sessionId: string) => {
    return get().pinnedSessionIds.has(sessionId)
  },

  setArchivedSessionIds: (sessionIds: Iterable<string>) => {
    set({ archivedSessionIds: new Set(sessionIds) })
  },

  toggleArchiveSession: (sessionId: string) => {
    set((state) => {
      const newArchived = new Set(state.archivedSessionIds)
      if (newArchived.has(sessionId)) {
        newArchived.delete(sessionId)
      } else {
        newArchived.add(sessionId)
      }
      return { archivedSessionIds: newArchived }
    })
  },

  isArchived: (sessionId: string) => {
    return get().archivedSessionIds.has(sessionId)
  },
}))

const EMPTY_MESSAGE_QUEUE: QueuedMessage[] = []

// Computed selectors
export const useAgentSessionProgress = (sessionId: string | null | undefined) => {
  return useAgentStore((state) => (sessionId ? state.agentProgressById.get(sessionId) ?? null : null))
}

export const useAgentProgress = () => {
  const focusedSessionId = useAgentStore((state) => state.focusedSessionId)
  return useAgentSessionProgress(focusedSessionId)
}

export const useIsAgentProcessing = () => {
  const agentProgress = useAgentProgress()
  return !!agentProgress && !agentProgress.isComplete
}

// Hook to get message queue for a specific conversation
export const useMessageQueue = (conversationId: string | undefined) => {
  return useAgentStore((state) => (
    conversationId
      ? state.messageQueuesByConversation.get(conversationId) || EMPTY_MESSAGE_QUEUE
      : EMPTY_MESSAGE_QUEUE
  ))
}

// Hook to check if a conversation's queue is paused
export const useIsQueuePaused = (conversationId: string | undefined) => {
  const pausedQueueConversations = useAgentStore((state) => state.pausedQueueConversations)
  if (!conversationId) return false
  return pausedQueueConversations.has(conversationId)
}
