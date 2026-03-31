import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useParams, useOutletContext, useLocation, useNavigate } from "react-router-dom"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore, useAgentSessionProgress } from "@renderer/stores"
import { AgentProgress } from "@renderer/components/agent-progress"
import { MessageCircle, Mic, Plus, CheckCircle2, Keyboard, Clock, Loader2, Pin } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import type { AgentProfile, AgentProgressUpdate } from "@shared/types"
import { toast } from "sonner"

import { logUI } from "@renderer/lib/debug"
import { orderConversationHistoryByPinnedFirst } from "@renderer/lib/pinned-session-history"
import { PredefinedPromptsMenu } from "@renderer/components/predefined-prompts-menu"
import { AgentSelector } from "@renderer/components/agent-selector"
import { useConfigQuery } from "@renderer/lib/query-client"
import { useConversationHistoryQuery } from "@renderer/lib/queries"
import { getMcpToolsShortcutDisplay, getTextInputShortcutDisplay, getDictationShortcutDisplay } from "@shared/key-utils"
import dayjs from "dayjs"
import type { SessionActionDialogMode } from "@renderer/components/session-action-dialog"
import { orderActiveSessionsByPinnedFirst } from "@renderer/lib/sidebar-sessions"

const CLEAR_INACTIVE_EVENT = "sessions:clear-inactive"

interface LayoutContext {
  onOpenPastSessionsDialog: () => void
  sidebarWidth: number
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  onStartTextSession: () => void | Promise<void>
  onStartVoiceSession: () => void | Promise<void>
  onStartPromptSession: (content: string) => void | Promise<void>
  openSessionActionDialog: (dialog: {
    mode: SessionActionDialogMode
    initialText?: string
    conversationId?: string
    sessionId?: string
    fromTile?: boolean
    continueConversationTitle?: string
    agentName?: string
    onSubmitted?: () => void
  }) => void
}

type SessionsNavigationState = {
  clearPendingConversation?: boolean
}

interface AgentSession {
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
  isSnoozed?: boolean
}

interface AgentSessionsResponse {
  activeSessions: AgentSession[]
  recentSessions: AgentSession[]
}

type VisibleSessionEntry = {
  sessionId: string
  conversationId?: string
  progress: AgentProgressUpdate
  sortTimestamp: number
}

function buildTrackedSessionPlaceholderProgress(session: AgentSession): AgentProgressUpdate {
  return {
    sessionId: session.id,
    conversationId: session.conversationId,
    conversationTitle: session.conversationTitle,
    currentIteration: session.currentIteration ?? 0,
    maxIterations: session.maxIterations ?? 10,
    steps: [],
    isComplete: false,
    isSnoozed: session.isSnoozed ?? false,
  }
}

function formatTimestamp(timestamp: number): string {
  const now = dayjs()
  const date = dayjs(timestamp)
  const diffHours = Math.max(0, now.diff(date, "hour"))

  if (diffHours < 24) {
    const diffSeconds = Math.max(0, now.diff(date, "second"))
    const diffMinutes = Math.max(0, now.diff(date, "minute"))
    if (diffSeconds < 60) return `${diffSeconds}s`
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${diffHours}h`
  }
  if (diffHours < 168) return date.format("ddd h:mm A")
  return date.format("MMM D")
}

const RECENT_SESSIONS_LIMIT = 8
const PENDING_CONTINUATION_TIMEOUT_MS = 20_000

type SessionAgentTileProps = {
  sessionId: string
  fallbackProgress?: AgentProgressUpdate | null
  onVoiceContinue: (options: {
    conversationId?: string
    sessionId?: string
    fromTile: boolean
    continueConversationTitle?: string
    agentName?: string
    onSubmitted?: () => void
  }) => void
}

const SessionAgentTile = React.memo(function SessionAgentTile({
  sessionId,
  fallbackProgress = null,
  onVoiceContinue,
}: SessionAgentTileProps) {
  const storeProgress = useAgentSessionProgress(sessionId)
  const progress = storeProgress ?? fallbackProgress
  const focusedSessionId = useAgentStore((state) => state.focusedSessionId)
  const setFocusedSessionId = useAgentStore((state) => state.setFocusedSessionId)
  const queryClient = useQueryClient()
  const isFocused = focusedSessionId === sessionId

  const handleFocusSession = useCallback(async () => {
    setFocusedSessionId(sessionId)
    try {
      await tipcClient.focusAgentSession({ sessionId })
      await tipcClient.setPanelMode({ mode: "agent" })
      await tipcClient.showPanelWindow({})
    } catch (error) {
      console.error("Failed to show panel window:", error)
    }
  }, [sessionId, setFocusedSessionId])

  const handleDismissSession = useCallback(async () => {
    const currentProgress = useAgentStore.getState().agentProgressById.get(sessionId)
    logUI('[Sessions] Dismiss/hide session clicked:', {
      sessionId,
      status: currentProgress?.isComplete ? 'complete' : 'active',
      conversationTitle: currentProgress?.conversationHistory?.[0]?.content?.substring(0, 50),
      conversationId: currentProgress?.conversationId,
    })
    await tipcClient.clearAgentSessionProgress({ sessionId })
    queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
  }, [queryClient, sessionId])

  if (!progress) {
    return null
  }

  return (
    <AgentProgress
      progress={progress}
      variant="tile"
      className="h-full"
      isFocused={isFocused}
      onFocus={handleFocusSession}
      onDismiss={handleDismissSession}
      onVoiceContinue={onVoiceContinue}
    />
  )
})

function EmptyState({ onTextClick, onVoiceClick, onSelectPrompt, onPastSessionClick, onOpenPastSessionsDialog, textInputShortcut, voiceInputShortcut, dictationShortcut, selectedAgentId, onSelectAgent }: {
  onTextClick: () => void
  onVoiceClick: () => void
  onSelectPrompt: (content: string) => void
  onPastSessionClick: (conversationId: string) => void
  onOpenPastSessionsDialog: () => void
  textInputShortcut: string
  voiceInputShortcut: string
  dictationShortcut: string
  selectedAgentId: string | null
  onSelectAgent: (id: string | null) => void
}) {
  const conversationHistoryQuery = useConversationHistoryQuery()
  const pinnedSessionIds = useAgentStore((state) => state.pinnedSessionIds)
  const togglePinSession = useAgentStore((state) => state.togglePinSession)
  const sortedRecentSessions = useMemo(
    () => orderConversationHistoryByPinnedFirst(conversationHistoryQuery.data ?? [], pinnedSessionIds),
    [conversationHistoryQuery.data, pinnedSessionIds],
  )
  const recentSessions = useMemo(
    () => sortedRecentSessions.slice(0, RECENT_SESSIONS_LIMIT),
    [sortedRecentSessions],
  )
  const totalCount = conversationHistoryQuery.data?.length ?? 0

  const handleTogglePinnedSession = useCallback((conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    togglePinSession(conversationId)
  }, [togglePinSession])

  const stopSessionRowKeyPropagation = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.stopPropagation()
  }, [])

  return (
    <div className="flex w-full flex-col items-center px-5 py-6 text-center sm:px-6">
      <div className="mb-3 rounded-full bg-muted/70 p-2.5">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold">No Active Sessions</h3>
      <p className="mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Start a new agent session using text or voice input. Your sessions will appear here as tiles.
      </p>
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
          compact
        />
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <Button onClick={onTextClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Start with Text
          </Button>
          <Button variant="secondary" onClick={onVoiceClick} className="gap-2">
            <Mic className="h-4 w-4" />
            Start with Voice
          </Button>
          <PredefinedPromptsMenu onSelectPrompt={onSelectPrompt} buttonSize="sm" />
        </div>
        {/* Keybind hints - visible on all screens, wraps on narrow */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 shrink-0" />
            <span>Text:</span>
            <kbd className="px-1.5 py-0.5 font-semibold bg-muted border rounded">
              {textInputShortcut}
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Voice:</span>
            <kbd className="px-1.5 py-0.5 font-semibold bg-muted border rounded">
              {voiceInputShortcut}
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Dictation:</span>
            <kbd className="px-1.5 py-0.5 font-semibold bg-muted border rounded">
              {dictationShortcut}
            </kbd>
          </div>
        </div>
      </div>

      {/* Recent past sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-6 w-full max-w-md text-left">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Recent Sessions
            </h4>
            {totalCount > RECENT_SESSIONS_LIMIT && (
              <button
                onClick={onOpenPastSessionsDialog}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all ({totalCount})
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {recentSessions.map((session) => {
              const isPinned = pinnedSessionIds.has(session.id)

              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onPastSessionClick(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onPastSessionClick(session.id)
                    }
                  }}
                  className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{session.title}</span>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePinnedSession(session.id, e)}
                      onKeyDown={stopSessionRowKeyPropagation}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      title={isPinned ? "Unpin session" : "Pin session"}
                      aria-label={`${isPinned ? "Unpin" : "Pin"} ${session.title}`}
                      aria-pressed={isPinned}
                    >
                      <Pin className={isPinned ? "h-3.5 w-3.5 fill-current text-foreground" : "h-3.5 w-3.5"} />
                    </button>
                    <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {formatTimestamp(session.updatedAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function Component() {
  const { id: routeHistoryItemId } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const layoutContext = (useOutletContext<LayoutContext>() ?? {}) as Partial<LayoutContext>
  const {
    onOpenPastSessionsDialog,
    selectedAgentId = null,
    setSelectedAgentId = () => {},
    onStartTextSession = async () => {},
    onStartVoiceSession = async () => {},
    onStartPromptSession = async () => {},
    openSessionActionDialog = () => {},
  } = layoutContext
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const setViewedConversationId = useAgentStore((s) => s.setViewedConversationId)
  // Get config for shortcut displays
  const configQuery = useConfigQuery()
  const textInputShortcut = getTextInputShortcutDisplay(configQuery.data?.textInputShortcut, configQuery.data?.customTextInputShortcut)
  const voiceInputShortcut = getMcpToolsShortcutDisplay(configQuery.data?.mcpToolsShortcut, configQuery.data?.customMcpToolsShortcut)
  const dictationShortcut = getDictationShortcutDisplay(configQuery.data?.shortcut, configQuery.data?.customShortcut)

  const { data: sessionData, refetch: refetchSessionData } = useQuery<AgentSessionsResponse>({
    queryKey: ["agentSessions"],
    queryFn: async () => {
      return await tipcClient.getAgentSessions()
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const unlisten = rendererHandlers.agentSessionsUpdated.listen(() => {
      void refetchSessionData()
    })
    return unlisten
  }, [refetchSessionData])

  const trackedActiveSessions = sessionData?.activeSessions || []
  const recentSessions = sessionData?.recentSessions || []

  const [sessionOrder, setSessionOrder] = useState<string[]>([])
  const expandedSessionId = useAgentStore((s) => s.expandedSessionId)
  const setExpandedSessionId = useAgentStore((s) => s.setExpandedSessionId)

  /**
   * Returns the timestamp of the most recent activity in a session.
   * Used to sort sessions by last modified time on initial load.
   */
  const getLastActivityTimestamp = useCallback((progress: AgentProgressUpdate | null | undefined): number => {
    if (!progress) return 0
    const lastStepTimestamp = progress.steps?.length > 0
      ? progress.steps[progress.steps.length - 1].timestamp
      : 0
    const history = progress.conversationHistory
    const lastHistoryTimestamp = history && history.length > 0
      ? (history[history.length - 1].timestamp ?? 0)
      : 0
    return Math.max(lastStepTimestamp, lastHistoryTimestamp)
  }, [])

  // State for pending conversation continuation (user selected a conversation to continue)
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null)
  const [pendingContinuationStartedAt, setPendingContinuationStartedAt] = useState<number | null>(null)
  const pendingConversationIdRef = useRef<string | null>(pendingConversationId)
  const pendingContinuationStartedAtRef = useRef<number | null>(pendingContinuationStartedAt)
  const navigationState = location.state as SessionsNavigationState | null

  useEffect(() => {
    pendingConversationIdRef.current = pendingConversationId
  }, [pendingConversationId])

  useEffect(() => {
    pendingContinuationStartedAtRef.current = pendingContinuationStartedAt
  }, [pendingContinuationStartedAt])

  useEffect(() => {
    setPendingContinuationStartedAt(null)
  }, [pendingConversationId])

  const allSessionEntries = React.useMemo<VisibleSessionEntry[]>(() => {
    const recentStatusById = new Map(
      recentSessions.map((session) => [session.id, session.status] as const),
    )
    const mergedEntries = new Map<string, VisibleSessionEntry>()

    for (const session of trackedActiveSessions) {
      mergedEntries.set(session.id, {
        sessionId: session.id,
        conversationId: session.conversationId,
        progress: buildTrackedSessionPlaceholderProgress(session),
        sortTimestamp: Math.max(session.endTime ?? 0, session.startTime ?? 0),
      })
    }

    for (const [sessionId, progress] of agentProgressById.entries()) {
      if (!progress) continue
      if (pendingConversationId && progress.conversationId === pendingConversationId) {
        continue
      }

      const recentStatus = recentStatusById.get(sessionId)
      if (recentStatus === "stopped" || recentStatus === "error") {
        continue
      }

      const existing = mergedEntries.get(sessionId)
      const mergedProgress = existing
        ? {
            ...existing.progress,
            ...progress,
            conversationId: progress.conversationId ?? existing.progress.conversationId,
            conversationTitle: progress.conversationTitle ?? existing.progress.conversationTitle,
            currentIteration: progress.currentIteration ?? existing.progress.currentIteration,
            maxIterations: progress.maxIterations ?? existing.progress.maxIterations,
            isSnoozed: progress.isSnoozed ?? existing.progress.isSnoozed,
          }
        : progress

      mergedEntries.set(sessionId, {
        sessionId,
        conversationId: mergedProgress.conversationId,
        progress: mergedProgress,
        sortTimestamp: Math.max(
          getLastActivityTimestamp(mergedProgress),
          existing?.sortTimestamp ?? 0,
        ),
      })
    }

    const entries = Array.from(mergedEntries.values())
    let orderedEntries: VisibleSessionEntry[]

    if (sessionOrder.length > 0) {
      orderedEntries = entries.sort((a, b) => {
        const aIndex = sessionOrder.indexOf(a.sessionId)
        const bIndex = sessionOrder.indexOf(b.sessionId)
        if (aIndex === -1 && bIndex === -1) {
          return b.sortTimestamp - a.sortTimestamp
        }
        if (aIndex === -1) return -1
        if (bIndex === -1) return 1
        return aIndex - bIndex
      })
    } else {
      orderedEntries = entries.sort((a, b) => {
        if (a.progress.isComplete !== b.progress.isComplete) {
          return a.progress.isComplete ? 1 : -1
        }
        return b.sortTimestamp - a.sortTimestamp
      })
    }

    return orderActiveSessionsByPinnedFirst(
      orderedEntries.map((entry) => ({
        id: entry.sessionId,
        conversationId: entry.conversationId,
        entry,
      })),
      pinnedSessionIds,
    ).map(({ entry }) => entry)
  }, [
    agentProgressById,
    getLastActivityTimestamp,
    pendingConversationId,
    pinnedSessionIds,
    recentSessions,
    sessionOrder,
    trackedActiveSessions,
  ])

  const pendingSessionId = pendingConversationId ? `pending-${pendingConversationId}` : null
  const hasRealActiveSessionForPending = pendingConversationId
    ? allSessionEntries.some(
        ({ sessionId, conversationId, progress }) =>
          sessionId !== pendingSessionId &&
          conversationId === pendingConversationId &&
          !progress.isComplete,
      )
    : false

  useEffect(() => {
    if (hasRealActiveSessionForPending) {
      setPendingConversationId(null)
    }
  }, [hasRealActiveSessionForPending])

  // Sync session order when new sessions appear
  useEffect(() => {
    const currentIds = allSessionEntries.map(({ sessionId }) => sessionId)
    const newIds = currentIds.filter(id => !sessionOrder.includes(id))
    const sortTimestampBySessionId = new Map<string, number>(
      allSessionEntries.map(({ sessionId, sortTimestamp }) => [sessionId, sortTimestamp] as const),
    )

    if (newIds.length > 0) {
      const isInitialLoad = sessionOrder.length === 0

      // On initial load, sort sessions by most recently modified first so the
      // freshest sessions appear at the top of the list.
      // When a new session is added during an active view, it still goes to the front.
      const sortedNewIds = isInitialLoad
        ? [...newIds].sort((a, b) =>
            (sortTimestampBySessionId.get(b) ?? 0) -
            (sortTimestampBySessionId.get(a) ?? 0)
          )
        : newIds

      // Add (sorted) new sessions to the beginning of the order
      setSessionOrder(prev => [...sortedNewIds, ...prev.filter(id => currentIds.includes(id))])
    } else {
      // Remove sessions that no longer exist
      const validOrder = sessionOrder.filter(id => currentIds.includes(id))
      if (validOrder.length !== sessionOrder.length) {
        setSessionOrder(validOrder)
      }
    }
  }, [allSessionEntries, sessionOrder])

  // Handle route parameter for deep-linking to specific session
  // When navigating to /:id, focus the active session tile or create a new tile for past sessions
  // Track the last handled route ID to avoid re-processing on agentProgressById changes.
  // window.history.replaceState clears the browser URL but does NOT update React Router's
  // useParams(), so without this guard the effect would re-fire on every progress update.
  const handledRouteIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (routeHistoryItemId && routeHistoryItemId !== handledRouteIdRef.current) {
      handledRouteIdRef.current = routeHistoryItemId
      // Check if this ID matches an active (non-complete) session - if so, focus it.
      // Completed sessions should reload from disk to ensure fresh data,
      // especially for sessions created remotely (e.g. from mobile) where
      // in-memory progress data may be stale or incomplete.
      const activeSession = allSessionEntries.find(
        ({ conversationId, progress }) =>
          conversationId === routeHistoryItemId && !progress.isComplete,
      )
      if (activeSession) {
        setFocusedSessionId(activeSession.sessionId)
        setExpandedSessionId(activeSession.sessionId)
      } else {
        // It's a past session or completed session - load fresh data from disk
        setPendingConversationId(routeHistoryItemId)
      }
      // Clear the route param from URL without causing a remount
      // Using window.history.replaceState instead of navigate() to avoid clearing local state
      window.history.replaceState(null, "", "/")
    }
  }, [allSessionEntries, routeHistoryItemId, setExpandedSessionId, setFocusedSessionId])

  useEffect(() => {
    if (!navigationState?.clearPendingConversation) return

    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, navigationState, navigate])

  // Load the pending conversation data when one is selected
  const pendingConversationQuery = useQuery({
    queryKey: ["conversation", pendingConversationId],
    queryFn: async () => {
      if (!pendingConversationId) return null
      return tipcClient.loadConversation({ conversationId: pendingConversationId })
    },
    enabled: !!pendingConversationId,
  })

  const isPendingConversationMissing =
    !!pendingConversationId &&
    pendingConversationQuery.isSuccess &&
    pendingConversationQuery.data === null

  // If loading a pending conversation fails (deleted/missing), clear the pending
  // state so we do not keep showing a stuck loading tile.
  useEffect(() => {
    if (!pendingConversationId) return
    if (!pendingConversationQuery.isError && !isPendingConversationMissing) return

    if (pendingConversationQuery.isError) {
      console.error("Failed to load pending conversation:", pendingConversationQuery.error)
    } else {
      console.error("Pending conversation not found:", pendingConversationId)
    }
    toast.error("Unable to load that past session")
    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
  }, [pendingConversationId, pendingConversationQuery.isError, pendingConversationQuery.error, isPendingConversationMissing])

  // Create a synthetic AgentProgressUpdate for the pending conversation
  // This allows us to reuse the AgentProgress component with the same UI
  const pendingProgress: AgentProgressUpdate | null = useMemo(() => {
    if (!pendingConversationId || !pendingConversationQuery.data) return null
    const conv = pendingConversationQuery.data
    const isInitializing = pendingContinuationStartedAt !== null

    return {
      sessionId: `pending-${pendingConversationId}`,
      conversationId: pendingConversationId,
      conversationTitle: conv.title || "Continue Conversation",
      currentIteration: isInitializing ? 1 : 0,
      maxIterations: isInitializing ? Infinity : 10,
      steps: isInitializing
        ? [{
            id: `pending-start-${pendingConversationId}`,
            type: "thinking",
            title: "Starting follow-up",
            description: "Waiting for session updates...",
            status: "in_progress",
            timestamp: pendingContinuationStartedAt,
          }]
        : [],
      isComplete: !isInitializing,
      conversationHistory: conv.messages.map(m => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        toolResults: m.toolResults,
        timestamp: m.timestamp,
      })),
    }
  }, [pendingConversationId, pendingConversationQuery.data, pendingContinuationStartedAt])

  // Handle continuing a conversation - check for existing active session first
  // If found, focus it; otherwise create a pending tile
  // LLM inference will only happen when user sends an actual message
  const handleContinueConversation = (conversationId: string) => {
    // Check if there's already an active session for this conversationId
    const existingSession = allSessionEntries.find(
      ({ conversationId: existingConversationId, progress }) =>
        existingConversationId === conversationId && !progress.isComplete,
    )
    if (existingSession) {
      // Focus the existing session tile instead of creating a duplicate
      setFocusedSessionId(existingSession.sessionId)
      setExpandedSessionId(existingSession.sessionId)
    } else {
      // No active session exists, create a pending tile
      setPendingContinuationStartedAt(null)
      setPendingConversationId(conversationId)
    }
  }

  // Handle dismissing the pending continuation
  const handleDismissPendingContinuation = () => {
    logUI('[Sessions] Dismissing pending continuation:', { pendingConversationId })
    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
  }

  const handlePendingContinuationStarted = useCallback(() => {
    setPendingContinuationStartedAt((existing) => existing ?? Date.now())
  }, [])

  // Auto-dismiss pending tile when a real session starts for the same conversationId.
  // During initialization, also dismiss when a completed session appears with
  // activity at/after the follow-up start timestamp.
  useEffect(() => {
    if (!pendingConversationId) return

    const hasRealSession = allSessionEntries.some(
      ({ sessionId, conversationId, progress, sortTimestamp }) =>
        sessionId !== pendingSessionId &&
        conversationId === pendingConversationId &&
        (
          !progress.isComplete ||
          (
            pendingContinuationStartedAt !== null &&
            sortTimestamp >= pendingContinuationStartedAt
          )
        )
    )

    if (hasRealSession) {
      // A real session has started for this conversation, dismiss the pending tile
      // Transfer focus to the real session so auto-scroll continues working
      const realEntry = allSessionEntries.find(
        ({ sessionId, conversationId, progress }) =>
          sessionId !== pendingSessionId &&
          conversationId === pendingConversationId &&
          !progress.isComplete
      )
      if (realEntry) {
        setFocusedSessionId(realEntry.sessionId)
      }
      setPendingContinuationStartedAt(null)
      setPendingConversationId(null)
    }
  }, [allSessionEntries, pendingConversationId, pendingContinuationStartedAt, pendingSessionId, setFocusedSessionId])

  // Safety fallback: if initialization does not produce a real session in time,
  // dismiss the pending tile instead of leaving it stuck indefinitely.
  useEffect(() => {
    if (!pendingConversationId || pendingContinuationStartedAt === null) return undefined

    const timeoutConversationId = pendingConversationId
    const timeoutStartedAt = pendingContinuationStartedAt
    const timeoutId = window.setTimeout(() => {
      if (
        pendingConversationIdRef.current !== timeoutConversationId ||
        pendingContinuationStartedAtRef.current !== timeoutStartedAt
      ) {
        return
      }

      logUI("[Sessions] Pending continuation timed out waiting for real session", {
        pendingConversationId: timeoutConversationId,
        pendingContinuationStartedAt: timeoutStartedAt,
      })
      toast.error("Session startup timed out. Please try again.")
      setPendingContinuationStartedAt(null)
      setPendingConversationId(null)
    }, PENDING_CONTINUATION_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [pendingConversationId, pendingContinuationStartedAt])

  // Handle text click - open panel with text input
  const handleTextClick = async () => {
    await onStartTextSession()
  }

  // Handle voice start - trigger MCP recording
  const handleVoiceStart = async () => {
    await onStartVoiceSession()
  }

  // Handle predefined prompt selection - open panel with text input pre-filled
  const handleSelectPrompt = async (content: string) => {
    await onStartPromptSession(content)
  }

  const handleOpenVoiceContinuation = useCallback((options: {
    conversationId?: string
    sessionId?: string
    fromTile: boolean
    continueConversationTitle?: string
    agentName?: string
    onSubmitted?: () => void
  }) => {
    openSessionActionDialog({
      mode: "voice",
      conversationId: options.conversationId,
      sessionId: options.sessionId,
      fromTile: options.fromTile,
      continueConversationTitle: options.continueConversationTitle,
      agentName: options.agentName,
      onSubmitted: options.onSubmitted,
    })
  }, [openSessionActionDialog])

  const handleClearInactiveSessions = useCallback(async () => {
    const inactiveSessions = allSessionEntries
      .filter(({ progress }) => progress.isComplete)
      .map(({ sessionId }) => sessionId)
    logUI('[Sessions] Clear all inactive sessions clicked:', {
      count: inactiveSessions.length,
      sessionIds: inactiveSessions,
    })
    try {
      await tipcClient.clearInactiveSessions()
      toast.success("Inactive sessions cleared")
    } catch (error) {
      toast.error("Failed to clear inactive sessions")
    }
  }, [allSessionEntries])

  // Count inactive (completed) sessions - for clear inactive button
  const inactiveSessionCount = useMemo(() => {
    // Count from raw progress map so completed sessions without tracker metadata still count.
    return Array.from(agentProgressById.entries()).filter(([_, progress]) => progress?.isComplete).length
  }, [agentProgressById])

  const showPendingLoadingTile =
    !!pendingConversationId &&
    !pendingProgress &&
    !pendingConversationQuery.isError &&
    !isPendingConversationMissing
  const hasPendingTile = !!pendingProgress || showPendingLoadingTile
  const visibleSessionIds = useMemo(
    () => new Set(allSessionEntries.map(({ sessionId }) => sessionId)),
    [allSessionEntries],
  )

  const hasSessions = allSessionEntries.length > 0 || hasPendingTile

  const visibleSessionId = useMemo(() => {
    if (hasPendingTile && pendingSessionId) return pendingSessionId
    if (focusedSessionId && visibleSessionIds.has(focusedSessionId)) return focusedSessionId
    if (expandedSessionId && visibleSessionIds.has(expandedSessionId)) return expandedSessionId
    return allSessionEntries[0]?.sessionId ?? null
  }, [allSessionEntries, expandedSessionId, focusedSessionId, hasPendingTile, pendingSessionId, visibleSessionIds])

  const visibleSessionEntry = useMemo(
    () => allSessionEntries.find(({ sessionId }) => sessionId === visibleSessionId) ?? null,
    [allSessionEntries, visibleSessionId],
  )

  useEffect(() => {
    const handleClearInactive = () => {
      if (inactiveSessionCount <= 0) return
      void handleClearInactiveSessions()
    }

    window.addEventListener(CLEAR_INACTIVE_EVENT, handleClearInactive)
    return () => {
      window.removeEventListener(CLEAR_INACTIVE_EVENT, handleClearInactive)
    }
  }, [inactiveSessionCount, handleClearInactiveSessions])

  // Safety guard: if the expanded session is no longer in the progress map, clear it.
  useEffect(() => {
    if (expandedSessionId && !visibleSessionIds.has(expandedSessionId)) {
      setExpandedSessionId(null)
    }
  }, [expandedSessionId, setExpandedSessionId, visibleSessionIds])

  useEffect(() => {
    if (hasPendingTile) return
    if (visibleSessionId && visibleSessionId !== expandedSessionId) {
      setExpandedSessionId(visibleSessionId)
    }
  }, [hasPendingTile, visibleSessionId, expandedSessionId, setExpandedSessionId])

  useEffect(() => {
    if (pendingConversationId) {
      setViewedConversationId(pendingConversationId)
      return
    }

    if (visibleSessionId) {
      setViewedConversationId(visibleSessionEntry?.conversationId ?? null)
      return
    }

    setViewedConversationId(null)
  }, [
    pendingConversationId,
    setViewedConversationId,
    visibleSessionEntry,
    visibleSessionId,
  ])

  return (
    <div className="group/tile flex h-full flex-col">
      {/* Scrollable content area - flex-1 min-h-0 so it fills remaining height without overflow */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Show empty state when no sessions and no pending */}
        {!hasSessions ? (
          <EmptyState
            onTextClick={handleTextClick}
            onVoiceClick={handleVoiceStart}
            onSelectPrompt={handleSelectPrompt}
            onPastSessionClick={handleContinueConversation}
            onOpenPastSessionsDialog={onOpenPastSessionsDialog ?? (() => {})}
            textInputShortcut={textInputShortcut}
            voiceInputShortcut={voiceInputShortcut}
            dictationShortcut={dictationShortcut}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
        ) : (
          <div className="flex h-full min-h-0 flex-col p-3">
            {pendingProgress && pendingSessionId ? (
              <AgentProgress
                progress={pendingProgress}
                variant="tile"
                className="h-full"
                isFocused={true}
                onFocus={() => {}}
                onDismiss={handleDismissPendingContinuation}
                onFollowUpSent={handlePendingContinuationStarted}
                isFollowUpInputInitializing={pendingContinuationStartedAt !== null}
                onVoiceContinue={handleOpenVoiceContinuation}
              />
            ) : showPendingLoadingTile ? (
              <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
            ) : visibleSessionId ? (
              <SessionAgentTile
                key={visibleSessionId}
                sessionId={visibleSessionId}
                fallbackProgress={visibleSessionEntry?.progress}
                onVoiceContinue={handleOpenVoiceContinuation}
              />
            ) : null}
          </div>
        )}

      </div>
    </div>
  )
}
