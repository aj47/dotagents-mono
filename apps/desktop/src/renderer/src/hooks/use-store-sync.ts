import { useEffect, useRef } from 'react'
import { reportConfigSaveError } from '@renderer/lib/config-save-error'
import { rendererHandlers, tipcClient } from '@renderer/lib/tipc-client'
import { useAgentStore, useConversationStore } from '@renderer/stores'
import { AgentProgressUpdate, QueuedMessage } from '@shared/types'
import { queryClient } from '@renderer/lib/queries'
import { ttsManager } from '@renderer/lib/tts-manager'
import { clearSessionTTSTracking, markSessionForcedAutoPlay } from '@renderer/lib/tts-tracking'
import { logUI } from '@renderer/lib/debug'

const areStringArraysEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false
  }
  return true
}

// Module-level snapshots of the store state at the moment this module loads.
// These survive component remounts (e.g. React Strict Mode, HMR, navigation)
// so pre-hydration mutations are never lost to a late hydration overwrite.
let initialPinnedSessionIdsSnapshot: string[] | null = null
let initialArchivedSessionIdsSnapshot: string[] | null = null

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
  const pinnedSessionIdsRevision = useAgentStore((s) => s.pinnedSessionIdsRevision)
  const setPinnedSessionIds = useAgentStore((s) => s.setPinnedSessionIds)
  const archivedSessionIds = useAgentStore((s) => s.archivedSessionIds)
  const archivedSessionIdsRevision = useAgentStore((s) => s.archivedSessionIdsRevision)
  const setArchivedSessionIds = useAgentStore((s) => s.setArchivedSessionIds)
  const setFloatingPanelVisible = useAgentStore((s) => s.setFloatingPanelVisible)
  const markConversationCompleted = useConversationStore((s) => s.markConversationCompleted)

  // Capture the initial store snapshot once per module load so remounts
  // cannot reset the baseline used to detect pre-hydration user mutations.
  if (initialPinnedSessionIdsSnapshot === null) {
    initialPinnedSessionIdsSnapshot = Array.from(pinnedSessionIds)
  }
  if (initialArchivedSessionIdsSnapshot === null) {
    initialArchivedSessionIdsSnapshot = Array.from(archivedSessionIds)
  }

  const pinnedSessionIdsHydratedRef = useRef(false)
  const pinnedSessionIdsChangedBeforeHydrationRef = useRef(false)
  const lastPersistedPinnedSessionIdsRef = useRef<string[]>([])
  const lastPersistedPinnedSessionIdsRevisionRef = useRef(pinnedSessionIdsRevision)
  const archivedSessionIdsHydratedRef = useRef(false)
  const archivedSessionIdsChangedBeforeHydrationRef = useRef(false)
  const lastPersistedArchivedSessionIdsRef = useRef<string[]>([])
  const lastPersistedArchivedSessionIdsRevisionRef = useRef(archivedSessionIdsRevision)

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

  // Track floating panel visibility so the main window can suppress duplicate
  // TTS auto-play when the panel is already speaking the same session.
  useEffect(() => {
    const unlisten = rendererHandlers.panelVisibilityChanged.listen(
      ({ visible }: { visible: boolean }) => {
        setFloatingPanelVisible(visible)
      }
    )
    return unlisten
  }, [setFloatingPanelVisible])

  // Hydrate initial floating panel visibility on mount in case the panel is
  // already visible before this renderer started listening.
  useEffect(() => {
    tipcClient.getFloatingPanelVisibility().then((result: { visible: boolean }) => {
      setFloatingPanelVisible(result.visible)
    }).catch(() => {
      // Best-effort hydration; default remains false.
    })
  }, [setFloatingPanelVisible])

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

  // Clear stale TTS tracking keys for a session (sent before speakOnTrigger unsnooze).
  // Also mark the session as authorized for one forced auto-play, so the renderer's
  // historical-message guard does not suppress speakOnTrigger when the session's
  // CompactMessage mounts with an already-final assistant response after the panel
  // reveals it.
  useEffect(() => {
    const unlisten = rendererHandlers.clearSessionTTSKeys.listen(
      (sessionId: string) => {
        clearSessionTTSTracking(sessionId)
        markSessionForcedAutoPlay(sessionId)
      }
    )
    return unlisten
  }, [])

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
    if (!areStringArraysEqual(currentPinnedSessionIds, initialPinnedSessionIdsSnapshot ?? [])) {
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

      const nextPinnedSessionIds = Array.isArray(config?.pinnedSessionIds)
        ? config.pinnedSessionIds.filter((sessionId): sessionId is string => typeof sessionId === 'string')
        : []

      lastPersistedPinnedSessionIdsRef.current = nextPinnedSessionIds
      pinnedSessionIdsHydratedRef.current = true

      if (pinnedSessionIdsChangedBeforeHydrationRef.current) {
        const currentStoreValue = Array.from(useAgentStore.getState().pinnedSessionIds)
        lastPersistedPinnedSessionIdsRef.current = currentStoreValue
        lastPersistedPinnedSessionIdsRevisionRef.current = useAgentStore.getState().pinnedSessionIdsRevision
        setPinnedSessionIds(currentStoreValue)
        return
      }

      setPinnedSessionIds(nextPinnedSessionIds)
      lastPersistedPinnedSessionIdsRevisionRef.current = useAgentStore.getState().pinnedSessionIdsRevision
    }).catch(() => {
      if (cancelled) return

      pinnedSessionIdsHydratedRef.current = true

      if (pinnedSessionIdsChangedBeforeHydrationRef.current) {
        const currentStoreValue = Array.from(useAgentStore.getState().pinnedSessionIds)
        lastPersistedPinnedSessionIdsRef.current = currentStoreValue
        lastPersistedPinnedSessionIdsRevisionRef.current = useAgentStore.getState().pinnedSessionIdsRevision
        setPinnedSessionIds(currentStoreValue)
      }
    })

    return () => {
      cancelled = true
    }
  }, [setPinnedSessionIds])

  useEffect(() => {
    if (!pinnedSessionIdsHydratedRef.current) return undefined
    if (pinnedSessionIdsRevision === lastPersistedPinnedSessionIdsRevisionRef.current) return undefined

    const nextPinnedSessionIds = Array.from(pinnedSessionIds)
    if (areStringArraysEqual(nextPinnedSessionIds, lastPersistedPinnedSessionIdsRef.current)) {
      lastPersistedPinnedSessionIdsRevisionRef.current = pinnedSessionIdsRevision
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
      lastPersistedPinnedSessionIdsRevisionRef.current = pinnedSessionIdsRevision
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
  }, [pinnedSessionIds, pinnedSessionIdsRevision])

  // Archived session IDs: hydration guard
  useEffect(() => {
    if (archivedSessionIdsHydratedRef.current) return

    const currentArchivedSessionIds = Array.from(archivedSessionIds)
    if (!areStringArraysEqual(currentArchivedSessionIds, initialArchivedSessionIdsSnapshot ?? [])) {
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

      const nextArchivedSessionIds = Array.isArray(config?.archivedSessionIds)
        ? config.archivedSessionIds.filter((id): id is string => typeof id === 'string')
        : []

      lastPersistedArchivedSessionIdsRef.current = nextArchivedSessionIds
      archivedSessionIdsHydratedRef.current = true

      if (archivedSessionIdsChangedBeforeHydrationRef.current) {
        const currentStoreValue = Array.from(useAgentStore.getState().archivedSessionIds)
        lastPersistedArchivedSessionIdsRef.current = currentStoreValue
        lastPersistedArchivedSessionIdsRevisionRef.current = useAgentStore.getState().archivedSessionIdsRevision
        setArchivedSessionIds(currentStoreValue)
        return
      }

      setArchivedSessionIds(nextArchivedSessionIds)
      lastPersistedArchivedSessionIdsRevisionRef.current = useAgentStore.getState().archivedSessionIdsRevision
    }).catch(() => {
      if (cancelled) return

      archivedSessionIdsHydratedRef.current = true

      if (archivedSessionIdsChangedBeforeHydrationRef.current) {
        const currentStoreValue = Array.from(useAgentStore.getState().archivedSessionIds)
        lastPersistedArchivedSessionIdsRef.current = currentStoreValue
        lastPersistedArchivedSessionIdsRevisionRef.current = useAgentStore.getState().archivedSessionIdsRevision
        setArchivedSessionIds(currentStoreValue)
      }
    })

    return () => {
      cancelled = true
    }
  }, [setArchivedSessionIds])

  // Archived session IDs: persist changes
  useEffect(() => {
    if (!archivedSessionIdsHydratedRef.current) return undefined
    if (archivedSessionIdsRevision === lastPersistedArchivedSessionIdsRevisionRef.current) return undefined

    const nextArchivedSessionIds = Array.from(archivedSessionIds)
    if (areStringArraysEqual(nextArchivedSessionIds, lastPersistedArchivedSessionIdsRef.current)) {
      lastPersistedArchivedSessionIdsRevisionRef.current = archivedSessionIdsRevision
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
      lastPersistedArchivedSessionIdsRevisionRef.current = archivedSessionIdsRevision
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
  }, [archivedSessionIds, archivedSessionIdsRevision])

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
