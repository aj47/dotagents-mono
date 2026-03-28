import { useEffect, useRef } from 'react'
import { reportConfigSaveError } from '@renderer/lib/config-save-error'
import { rendererHandlers, tipcClient } from '@renderer/lib/tipc-client'
import { useAgentStore, useConversationStore } from '@renderer/stores'
import { AgentProgressUpdate, QueuedMessage } from '@shared/types'
import { queryClient } from '@renderer/lib/queries'
import { ttsManager } from '@renderer/lib/tts-manager'
import { logUI } from '@renderer/lib/debug'
import { sanitizeConversationSessionState } from '@dotagents/shared'

const areStringArraysEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false
  }
  return true
}

export function useStoreSync() {
  const updateSessionProgress = useAgentStore((s) => s.updateSessionProgress)
  const clearAllProgress = useAgentStore((s) => s.clearAllProgress)
  const clearSessionProgress = useAgentStore((s) => s.clearSessionProgress)
  const clearInactiveSessions = useAgentStore((s) => s.clearInactiveSessions)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const setSessionSnoozed = useAgentStore((s) => s.setSessionSnoozed)
  const setScrollToSessionId = useAgentStore((s) => s.setScrollToSessionId)
  const updateMessageQueue = useAgentStore((s) => s.updateMessageQueue)
  const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)
  const setPinnedSessionIds = useAgentStore((s) => s.setPinnedSessionIds)
  const archivedSessionIds = useAgentStore((s) => s.archivedSessionIds)
  const setArchivedSessionIds = useAgentStore((s) => s.setArchivedSessionIds)
  const markConversationCompleted = useConversationStore((s) => s.markConversationCompleted)
  const initialPinnedSessionIdsRef = useRef(Array.from(pinnedSessionIds))
  const pinnedSessionIdsHydratedRef = useRef(false)
  const pinnedSessionIdsChangedBeforeHydrationRef = useRef(false)
  const lastPersistedPinnedSessionIdsRef = useRef<string[]>([])
  const initialArchivedSessionIdsRef = useRef(Array.from(archivedSessionIds))
  const archivedSessionIdsHydratedRef = useRef(false)
  const archivedSessionIdsChangedBeforeHydrationRef = useRef(false)
  const lastPersistedArchivedSessionIdsRef = useRef<string[]>([])

  useEffect(() => {
    const unlisten = rendererHandlers.agentProgressUpdate.listen(
      (update: AgentProgressUpdate) => {
        updateSessionProgress(update)

        // Mark conversation as completed when agent finishes
        // NOTE: We no longer call saveCompleteConversationHistory here because:
        // 1. Messages are already saved incrementally via llm.ts saveMessageIncremental()
        // 2. Calling saveCompleteConversationHistory causes race conditions when multiple
        //    messages arrive for the same conversation - each agent overwrites with its
        //    own in-memory history, causing message order corruption
        if (update.isComplete && update.conversationId) {
          markConversationCompleted(update.conversationId)
        }
      }
    )

    return unlisten
  }, [updateSessionProgress, markConversationCompleted])

  useEffect(() => {
    const unlisten = rendererHandlers.clearAgentProgress.listen(() => {
      clearAllProgress()
    })
    return unlisten
  }, [clearAllProgress])

  useEffect(() => {
    const unlisten = rendererHandlers.clearAgentSessionProgress.listen(
      (sessionId: string) => {
        clearSessionProgress(sessionId)
      }
    )
    return unlisten
  }, [clearSessionProgress])

  useEffect(() => {
    const unlisten = rendererHandlers.clearInactiveSessions.listen(
      () => {
        clearInactiveSessions()
      }
    )
    return unlisten
  }, [clearInactiveSessions])

  useEffect(() => {
    const unlisten = rendererHandlers.stopAllTts.listen(() => {
      logUI("[StoreSync] stopAllTts event received", {
        trackedAudioCount: ttsManager.getAudioCount(),
      })
      ttsManager.stopAll('renderer-stopAllTts-event')
      logUI("[StoreSync] stopAllTts event handled", {
        trackedAudioCount: ttsManager.getAudioCount(),
      })
    })
    return unlisten
  }, [])

  useEffect(() => {
    const unlisten = rendererHandlers.focusAgentSession.listen(
      (sessionId: string) => {
        setFocusedSessionId(sessionId)
        setScrollToSessionId(null)
      }
    )
    return unlisten
  }, [setFocusedSessionId, setScrollToSessionId])

  useEffect(() => {
    const unlisten = rendererHandlers.setAgentSessionSnoozed.listen(
      ({ sessionId, isSnoozed }: { sessionId: string; isSnoozed: boolean }) => {
        setSessionSnoozed(sessionId, isSnoozed)
      }
    )
    return unlisten
  }, [setSessionSnoozed])

  // Listen for message queue updates
  useEffect(() => {
    const unlisten = rendererHandlers.onMessageQueueUpdate.listen(
      (data: { conversationId: string; queue: QueuedMessage[]; isPaused: boolean }) => {
        updateMessageQueue(data.conversationId, data.queue, data.isPaused)
      }
    )
    return unlisten
  }, [updateMessageQueue])

  // Initial hydration of message queues on mount
  useEffect(() => {
    tipcClient.getAllMessageQueues().then((queues: Array<{ conversationId: string; messages: QueuedMessage[]; isPaused: boolean }>) => {
      for (const queue of queues) {
        updateMessageQueue(queue.conversationId, queue.messages, queue.isPaused)
      }
    }).catch(() => {
      // Silently ignore hydration failures
    })
  }, [])

  useEffect(() => {
    if (pinnedSessionIdsHydratedRef.current) return

    const currentPinnedSessionIds = Array.from(pinnedSessionIds)
    if (!areStringArraysEqual(currentPinnedSessionIds, initialPinnedSessionIdsRef.current)) {
      pinnedSessionIdsChangedBeforeHydrationRef.current = true
    }
  }, [pinnedSessionIds])

  useEffect(() => {
    let cancelled = false

    queryClient.fetchQuery<{ pinnedSessionIds?: string[] }>({
      queryKey: ['config'],
      queryFn: async () => tipcClient.getConfig(),
    }).then((config) => {
      if (cancelled) return

      const nextPinnedSessionIds =
        sanitizeConversationSessionState(config).pinnedSessionIds

      lastPersistedPinnedSessionIdsRef.current = nextPinnedSessionIds
      pinnedSessionIdsHydratedRef.current = true

      if (pinnedSessionIdsChangedBeforeHydrationRef.current) {
        setPinnedSessionIds(Array.from(useAgentStore.getState().pinnedSessionIds))
        return
      }

      setPinnedSessionIds(nextPinnedSessionIds)
    }).catch(() => {
      if (cancelled) return

      pinnedSessionIdsHydratedRef.current = true

      if (pinnedSessionIdsChangedBeforeHydrationRef.current) {
        setPinnedSessionIds(Array.from(useAgentStore.getState().pinnedSessionIds))
      }
    })

    return () => {
      cancelled = true
    }
  }, [setPinnedSessionIds])

  useEffect(() => {
    if (!pinnedSessionIdsHydratedRef.current) return undefined

    const nextPinnedSessionIds = Array.from(pinnedSessionIds)
    if (areStringArraysEqual(nextPinnedSessionIds, lastPersistedPinnedSessionIdsRef.current)) {
      return undefined
    }

    let cancelled = false

    tipcClient.saveConfig({
      config: {
        pinnedSessionIds: nextPinnedSessionIds,
      },
    }).then(() => {
      if (cancelled) return

      lastPersistedPinnedSessionIdsRef.current = nextPinnedSessionIds
      queryClient.setQueryData(['config'], (previousConfig: Record<string, unknown> | undefined) => ({
        ...(previousConfig ?? {}),
        pinnedSessionIds: nextPinnedSessionIds,
      }))
    }).catch((error) => {
      if (cancelled) return
      reportConfigSaveError(error)
    })

    return () => {
      cancelled = true
    }
  }, [pinnedSessionIds])

  // Archived session IDs: hydration guard
  useEffect(() => {
    if (archivedSessionIdsHydratedRef.current) return

    const currentArchivedSessionIds = Array.from(archivedSessionIds)
    if (!areStringArraysEqual(currentArchivedSessionIds, initialArchivedSessionIdsRef.current)) {
      archivedSessionIdsChangedBeforeHydrationRef.current = true
    }
  }, [archivedSessionIds])

  // Archived session IDs: hydrate from config
  useEffect(() => {
    let cancelled = false

    queryClient.fetchQuery<{ archivedSessionIds?: string[] }>({
      queryKey: ['config'],
      queryFn: async () => tipcClient.getConfig(),
    }).then((config) => {
      if (cancelled) return

      const nextArchivedSessionIds =
        sanitizeConversationSessionState(config).archivedSessionIds

      lastPersistedArchivedSessionIdsRef.current = nextArchivedSessionIds
      archivedSessionIdsHydratedRef.current = true

      if (archivedSessionIdsChangedBeforeHydrationRef.current) {
        setArchivedSessionIds(Array.from(useAgentStore.getState().archivedSessionIds))
        return
      }

      setArchivedSessionIds(nextArchivedSessionIds)
    }).catch(() => {
      if (cancelled) return

      archivedSessionIdsHydratedRef.current = true

      if (archivedSessionIdsChangedBeforeHydrationRef.current) {
        setArchivedSessionIds(Array.from(useAgentStore.getState().archivedSessionIds))
      }
    })

    return () => {
      cancelled = true
    }
  }, [setArchivedSessionIds])

  // Archived session IDs: persist changes
  useEffect(() => {
    if (!archivedSessionIdsHydratedRef.current) return undefined

    const nextArchivedSessionIds = Array.from(archivedSessionIds)
    if (areStringArraysEqual(nextArchivedSessionIds, lastPersistedArchivedSessionIdsRef.current)) {
      return undefined
    }

    let cancelled = false

    tipcClient.saveConfig({
      config: {
        archivedSessionIds: nextArchivedSessionIds,
      },
    }).then(() => {
      if (cancelled) return

      lastPersistedArchivedSessionIdsRef.current = nextArchivedSessionIds
      queryClient.setQueryData(['config'], (previousConfig: Record<string, unknown> | undefined) => ({
        ...(previousConfig ?? {}),
        archivedSessionIds: nextArchivedSessionIds,
      }))
    }).catch((error) => {
      if (cancelled) return
      reportConfigSaveError(error)
    })

    return () => {
      cancelled = true
    }
  }, [archivedSessionIds])

  // Listen for conversation history changes from remote server (mobile sync)
  // This ensures the sidebar refreshes when conversations are created/updated remotely
  useEffect(() => {
    const unlisten = rendererHandlers.conversationHistoryChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
      queryClient.invalidateQueries({ queryKey: ["conversation"] })
    })
    return unlisten
  }, [])
}
