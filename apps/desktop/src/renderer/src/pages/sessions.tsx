import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useParams, useOutletContext } from "react-router-dom"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores"
import {
  SessionGrid,
  SessionTileWrapper,
  isResponsiveStackedTileLayout,
  type SessionGridMeasurements,
  type TileLayoutMode,
} from "@renderer/components/session-grid"
import { clearPersistedSize } from "@renderer/hooks/use-resizable"
import { AgentProgress } from "@renderer/components/agent-progress"
import {
  MessageCircle,
  Mic,
  Plus,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  Maximize2,
  Grid2x2,
  Keyboard,
  Clock,
  Loader2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { cn } from "@renderer/lib/utils"
import type { AgentProfile, AgentProgressUpdate } from "@shared/types"
import { toast } from "sonner"

import { applySelectedAgentToNextSession as applySelectedAgentForNextSession } from "@renderer/lib/apply-selected-agent"
import { logUI } from "@renderer/lib/debug"
import { PredefinedPromptsMenu } from "@renderer/components/predefined-prompts-menu"
import {
  AgentSelector,
  useSelectedAgentId,
} from "@renderer/components/agent-selector"
import { useConfigQuery } from "@renderer/lib/query-client"
import { useConversationHistoryQuery } from "@renderer/lib/queries"
import {
  getMcpToolsShortcutDisplay,
  getTextInputShortcutDisplay,
  getDictationShortcutDisplay,
} from "@shared/key-utils"
import dayjs from "dayjs"

interface LayoutContext {
  onOpenPastSessionsDialog: () => void
  sidebarWidth: number
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
const PENDING_LOADING_TILE_STATUS_LABEL = "Opening conversation…"
const PENDING_LOADING_TILE_HELPER_TEXT =
  "Loading previous messages and restoring this session tile."
const RECENT_SESSION_ROW_CLASS_NAME =
  "hover:bg-accent/50 group flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors"
const RECENT_SESSION_TITLE_CLASS_NAME =
  "min-w-0 flex-1 leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]"

const TILE_LAYOUT_OPTIONS = [
  {
    mode: "1x2",
    label: "Compare",
    title: "Compare sessions side by side",
    Icon: LayoutGrid,
  },
  {
    mode: "2x2",
    label: "Grid",
    title: "Show sessions in a 2×2 grid",
    Icon: Grid2x2,
  },
  {
    mode: "1x1",
    label: "Single",
    title: "Show one session at a time",
    Icon: Maximize2,
  },
] as const satisfies ReadonlyArray<{
  mode: TileLayoutMode
  label: string
  title: string
  Icon: typeof LayoutGrid
}>

const LAYOUT_LABELS: Record<TileLayoutMode, string> = {
  "1x2": "Compare view",
  "2x2": "Grid view",
  "1x1": "Single view",
}

const LAYOUT_DESCRIPTIONS: Record<TileLayoutMode, string> = {
  "1x2": "Side by side",
  "2x2": "More at once",
  "1x1": "One at a time",
}

const RESPONSIVE_STACKED_LAYOUT_DESCRIPTION = "Stacked to fit"
const RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL = "Stacked"
const TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION =
  "Expanded for one visible session"
const TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL = "One visible"
const COMPACT_SESSION_HEADER_WIDTH = 760
const TIGHT_SESSION_HEADER_WIDTH = 620
const NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER = 96
const TILE_LAYOUT_MODE_STORAGE_KEY = "dotagents-sessions-tile-layout-mode"
const PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY =
  "dotagents-sessions-previous-layout-mode"
const DEFAULT_TILE_LAYOUT_MODE: TileLayoutMode = "1x2"

type RestorableTileLayoutMode = Exclude<TileLayoutMode, "1x1">
const DEFAULT_RESTORABLE_TILE_LAYOUT_MODE: RestorableTileLayoutMode = "1x2"

const STACKED_LAYOUT_RECOVERY_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Make room to compare",
    compactLabel: "Make room",
    title:
      "Compare view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to compare side by side again.",
  },
  "2x2": {
    fullLabel: "Make room for grid",
    compactLabel: "Make room",
    title:
      "Grid view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to restore multiple columns.",
  },
}

const NEAR_STACKED_LAYOUT_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Close to stacking",
    compactLabel: "Tight fit",
    title:
      "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep sessions side by side.",
  },
  "2x2": {
    fullLabel: "Close to stacking",
    compactLabel: "Tight fit",
    title:
      "Grid view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep multiple columns visible.",
  },
}

function isTileLayoutMode(value: string | null): value is TileLayoutMode {
  return value === "1x2" || value === "2x2" || value === "1x1"
}

function isRestorableTileLayoutMode(
  value: string | null,
): value is RestorableTileLayoutMode {
  return value === "1x2" || value === "2x2"
}

function loadPersistedTileLayoutPreference(): {
  currentLayoutMode: TileLayoutMode
  previousLayoutMode: RestorableTileLayoutMode
} {
  try {
    const storedCurrentLayoutMode = localStorage.getItem(
      TILE_LAYOUT_MODE_STORAGE_KEY,
    )
    const storedPreviousLayoutMode = localStorage.getItem(
      PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY,
    )
    const currentLayoutMode = isTileLayoutMode(storedCurrentLayoutMode)
      ? storedCurrentLayoutMode
      : DEFAULT_TILE_LAYOUT_MODE

    if (isRestorableTileLayoutMode(storedPreviousLayoutMode)) {
      return {
        currentLayoutMode,
        previousLayoutMode: storedPreviousLayoutMode,
      }
    }

    return {
      currentLayoutMode,
      previousLayoutMode:
        currentLayoutMode === "1x1"
          ? DEFAULT_RESTORABLE_TILE_LAYOUT_MODE
          : currentLayoutMode,
    }
  } catch {
    return {
      currentLayoutMode: DEFAULT_TILE_LAYOUT_MODE,
      previousLayoutMode: DEFAULT_RESTORABLE_TILE_LAYOUT_MODE,
    }
  }
}

function persistTileLayoutPreference(
  currentLayoutMode: TileLayoutMode,
  previousLayoutMode: RestorableTileLayoutMode,
): void {
  try {
    localStorage.setItem(TILE_LAYOUT_MODE_STORAGE_KEY, currentLayoutMode)
    localStorage.setItem(
      PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY,
      previousLayoutMode,
    )
  } catch {}
}

function getSessionTileLabel(
  sessionId: string,
  progress: AgentProgressUpdate | null | undefined,
): string {
  const title = progress?.conversationTitle?.trim()
  if (title) return title

  const firstUserMessage = progress?.conversationHistory?.find(
    (message) =>
      message.role === "user" &&
      typeof message.content === "string" &&
      message.content.trim().length > 0,
  )
  if (typeof firstUserMessage?.content === "string") {
    return firstUserMessage.content.trim()
  }

  return `Session ${sessionId.slice(0, 8)}`
}

function getFocusLayoutFallbackSessionId(
  focusableSessionIds: string[],
  previousFocusableSessionIds: string[],
  missingFocusedSessionId: string | null,
): string | null {
  if (focusableSessionIds.length === 0) return null
  if (!missingFocusedSessionId) return focusableSessionIds[0] ?? null

  const previousIndex = previousFocusableSessionIds.indexOf(
    missingFocusedSessionId,
  )
  if (previousIndex === -1) return focusableSessionIds[0] ?? null

  return (
    focusableSessionIds[
      Math.min(previousIndex, focusableSessionIds.length - 1)
    ] ??
    focusableSessionIds[0] ??
    null
  )
}

const SessionProgressTile = React.memo(function SessionProgressTile({
  sessionId,
  progress,
  index,
  isCollapsed,
  isDraggable,
  isFocused,
  isExpanded,
  isDragTarget,
  isDragging,
  showTileMaximize,
  onFocusSession,
  onDismissSession,
  onCollapsedChange,
  onMaximizeTile,
  onDragStart,
  onDragOver,
  onDragEnd,
  setSessionRef,
}: {
  sessionId: string
  progress: AgentProgressUpdate
  index: number
  isCollapsed: boolean
  isDraggable: boolean
  isFocused: boolean
  isExpanded: boolean
  isDragTarget: boolean
  isDragging: boolean
  showTileMaximize: boolean
  onFocusSession: (sessionId: string) => Promise<void>
  onDismissSession: (sessionId: string) => Promise<void>
  onCollapsedChange: (sessionId: string, collapsed: boolean) => void
  onMaximizeTile: (sessionId?: string) => void
  onDragStart: (sessionId: string, index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  setSessionRef: (sessionId: string, el: HTMLDivElement | null) => void
}) {
  const handleFocus = useCallback(() => {
    void onFocusSession(sessionId)
  }, [onFocusSession, sessionId])

  const handleDismiss = useCallback(() => {
    void onDismissSession(sessionId)
  }, [onDismissSession, sessionId])

  const handleCollapsed = useCallback(
    (collapsed: boolean) => {
      onCollapsedChange(sessionId, collapsed)
    },
    [onCollapsedChange, sessionId],
  )

  const handleExpand = useCallback(() => {
    onMaximizeTile(sessionId)
  }, [onMaximizeTile, sessionId])

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      setSessionRef(sessionId, el)
    },
    [sessionId, setSessionRef],
  )

  return (
    <div ref={handleRef}>
      <SessionTileWrapper
        sessionId={sessionId}
        index={index}
        isCollapsed={isCollapsed}
        isDraggable={isDraggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        isDragTarget={isDragTarget}
        isDragging={isDragging}
      >
        <AgentProgress
          progress={progress}
          variant="tile"
          isFocused={isFocused}
          onFocus={handleFocus}
          onDismiss={handleDismiss}
          isCollapsed={isCollapsed}
          onCollapsedChange={handleCollapsed}
          onExpand={showTileMaximize ? handleExpand : undefined}
          isExpanded={isExpanded}
        />
      </SessionTileWrapper>
    </div>
  )
})

function EmptyState({
  onTextClick,
  onVoiceClick,
  onSelectPrompt,
  onPastSessionClick,
  onOpenPastSessionsDialog,
  textInputShortcut,
  voiceInputShortcut,
  dictationShortcut,
  selectedAgentId,
  onSelectAgent,
}: {
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
  const recentSessions = useMemo(
    () => (conversationHistoryQuery.data ?? []).slice(0, RECENT_SESSIONS_LIMIT),
    [conversationHistoryQuery.data],
  )
  const totalCount = conversationHistoryQuery.data?.length ?? 0

  return (
    <div className="flex flex-col items-center justify-center px-6 py-4 text-center">
      <div className="bg-muted mb-2 rounded-full p-3">
        <MessageCircle className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No Active Sessions</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start a new agent session using text or voice input. Your sessions will
        appear here as tiles.
      </p>
      <div className="flex w-full max-w-lg flex-col items-center gap-4">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onTextClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Start with Text
          </Button>
          <Button variant="secondary" onClick={onVoiceClick} className="gap-2">
            <Mic className="h-4 w-4" />
            Start with Voice
          </Button>
          <PredefinedPromptsMenu onSelectPrompt={onSelectPrompt} />
        </div>
        {/* Keybind hints - visible on all screens, wraps on narrow */}
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 shrink-0" />
            <span>Text:</span>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-semibold">
              {textInputShortcut}
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Voice:</span>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-semibold">
              {voiceInputShortcut}
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Dictation:</span>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-semibold">
              {dictationShortcut}
            </kbd>
          </div>
        </div>
      </div>

      {/* Recent past sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-4 w-full max-w-lg text-left">
          <div className="mb-2 flex items-center justify-between px-1">
            <h4 className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5" />
              Recent Sessions
            </h4>
            {totalCount > RECENT_SESSIONS_LIMIT && (
              <button
                onClick={onOpenPastSessionsDialog}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                View all ({totalCount})
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onPastSessionClick(session.id)}
                title={session.title}
                className={RECENT_SESSION_ROW_CLASS_NAME}
              >
                <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <span className={RECENT_SESSION_TITLE_CLASS_NAME}>{session.title}</span>
                <span className="text-muted-foreground shrink-0 pt-0.5 text-[10px] tabular-nums">
                  {formatTimestamp(session.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Component() {
  const queryClient = useQueryClient()
  const { id: routeHistoryItemId } = useParams<{ id: string }>()
  const { onOpenPastSessionsDialog, sidebarWidth } =
    (useOutletContext<LayoutContext>() ?? {}) as Partial<LayoutContext>
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const [selectedAgentId, setSelectedAgentId] = useSelectedAgentId()
  const scrollToSessionId = useAgentStore((s) => s.scrollToSessionId)
  const setScrollToSessionId = useAgentStore((s) => s.setScrollToSessionId)
  // Get config for shortcut displays
  const configQuery = useConfigQuery()
  const textInputShortcut = getTextInputShortcutDisplay(
    configQuery.data?.textInputShortcut,
    configQuery.data?.customTextInputShortcut,
  )
  const voiceInputShortcut = getMcpToolsShortcutDisplay(
    configQuery.data?.mcpToolsShortcut,
    configQuery.data?.customMcpToolsShortcut,
  )
  const dictationShortcut = getDictationShortcutDisplay(
    configQuery.data?.shortcut,
    configQuery.data?.customShortcut,
  )
  const initialTileLayoutPreferenceRef = useRef<ReturnType<
    typeof loadPersistedTileLayoutPreference
  > | null>(null)

  if (!initialTileLayoutPreferenceRef.current) {
    initialTileLayoutPreferenceRef.current = loadPersistedTileLayoutPreference()
  }

  const [sessionOrder, setSessionOrder] = useState<string[]>([])
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null)
  const [collapsedSessions, setCollapsedSessions] = useState<
    Record<string, boolean>
  >({})
  const [tileResetKey, setTileResetKey] = useState(0)
  const [tileLayoutMode, setTileLayoutMode] = useState<TileLayoutMode>(
    initialTileLayoutPreferenceRef.current.currentLayoutMode,
  )
  const [sessionGridMeasurements, setSessionGridMeasurements] = useState<
    Pick<SessionGridMeasurements, "containerWidth" | "gap">
  >({
    containerWidth: 0,
    gap: 16,
  })

  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pendingSessionScrollRafRef = useRef<number | null>(null)
  const setSessionRef = useCallback(
    (sessionId: string, el: HTMLDivElement | null) => {
      sessionRefs.current[sessionId] = el
    },
    [],
  )

  const clearPendingSessionScroll = useCallback(() => {
    if (pendingSessionScrollRafRef.current !== null) {
      cancelAnimationFrame(pendingSessionScrollRafRef.current)
      pendingSessionScrollRafRef.current = null
    }
  }, [])

  const scrollSessionTileIntoView = useCallback(
    (sessionId: string, options?: { clearScrollRequest?: boolean }) => {
      clearPendingSessionScroll()

      let remainingAnimationFrameAttempts = 3

      const runScrollWhenTileIsReady = () => {
        const targetTile = sessionRefs.current[sessionId]

        if (targetTile) {
          pendingSessionScrollRafRef.current = null
          // Snap immediately once the tile is ready.
          // The previous delayed smooth-scroll path could keep a stale request alive
          // long enough to yank the sessions page after the user had already scrolled
          // somewhere else, and the animation itself added extra outer-scroll motion
          // while active tiles were still updating.
          targetTile.scrollIntoView({ behavior: "auto", block: "center" })
          if (options?.clearScrollRequest) {
            setScrollToSessionId(null)
          }
          return
        }

        remainingAnimationFrameAttempts -= 1
        if (remainingAnimationFrameAttempts <= 0) {
          pendingSessionScrollRafRef.current = null
          if (options?.clearScrollRequest) {
            setScrollToSessionId(null)
          }
          return
        }

        pendingSessionScrollRafRef.current = requestAnimationFrame(
          runScrollWhenTileIsReady,
        )
      }

      pendingSessionScrollRafRef.current = requestAnimationFrame(
        runScrollWhenTileIsReady,
      )
    },
    [clearPendingSessionScroll, setScrollToSessionId],
  )

  const handleSessionGridMeasurementsChange = useCallback(
    ({ containerWidth, gap }: SessionGridMeasurements) => {
      setSessionGridMeasurements((previous) => {
        if (
          previous.containerWidth === containerWidth &&
          previous.gap === gap
        ) {
          return previous
        }

        return { containerWidth, gap }
      })
    },
    [],
  )

  const handleCollapsedChange = useCallback(
    (sessionId: string, collapsed: boolean) => {
      setCollapsedSessions((prev) => ({
        ...prev,
        [sessionId]: collapsed,
      }))
    },
    [],
  )

  /**
   * Returns the timestamp of the most recent activity in a session.
   * Used to sort sessions by last modified time on initial load.
   */
  const getLastActivityTimestamp = useCallback(
    (progress: AgentProgressUpdate | null | undefined): number => {
      if (!progress) return 0
      const lastStepTimestamp =
        progress.steps?.length > 0
          ? progress.steps[progress.steps.length - 1].timestamp
          : 0
      const history = progress.conversationHistory
      const lastHistoryTimestamp =
        history && history.length > 0
          ? (history[history.length - 1].timestamp ?? 0)
          : 0
      return Math.max(lastStepTimestamp, lastHistoryTimestamp)
    },
    [],
  )

  // State for pending conversation continuation (user selected a conversation to continue)
  // Declared before allProgressEntries so it can be used in the filter below.
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null)
  const [pendingContinuationStartedAt, setPendingContinuationStartedAt] =
    useState<number | null>(null)
  const pendingConversationIdRef = useRef<string | null>(pendingConversationId)
  const pendingContinuationStartedAtRef = useRef<number | null>(
    pendingContinuationStartedAt,
  )

  useEffect(() => {
    pendingConversationIdRef.current = pendingConversationId
  }, [pendingConversationId])

  useEffect(() => {
    pendingContinuationStartedAtRef.current = pendingContinuationStartedAt
  }, [pendingContinuationStartedAt])

  useEffect(() => {
    setPendingContinuationStartedAt(null)
  }, [pendingConversationId])

  // Check if any real (non-pending) active session exists for the pending conversation.
  // Used both to suppress duplicate tiles in the memo AND to auto-dismiss the pending tile.
  const hasRealActiveSessionForPending = pendingConversationId
    ? Array.from(agentProgressById.entries()).some(
        ([sessionId, progress]) =>
          !sessionId.startsWith("pending-") &&
          progress?.conversationId === pendingConversationId &&
          !progress?.isComplete,
      )
    : false

  // Auto-dismiss the pending tile synchronously via derived state:
  // When a real session starts for the pending conversation, clear the pending state
  // so we don't briefly show two tiles for the same conversation.
  useEffect(() => {
    if (hasRealActiveSessionForPending) {
      setPendingConversationId(null)
    }
  }, [hasRealActiveSessionForPending])

  const allProgressEntries = React.useMemo(() => {
    const entries = Array.from(agentProgressById.entries())
      .filter(([_, progress]) => progress !== null)
      // When a pending continuation tile exists for a conversation, hide the
      // completed progress entry for the same conversation to avoid showing
      // duplicate tiles (one pending, one completed) for the same conversation.
      // Also hide new active sessions for the same conversation while pending tile
      // is still visible, to prevent a duplicate loading tile alongside
      // the pending tile that already shows conversation history.
      .filter(([_, progress]) => {
        if (
          pendingConversationId &&
          progress?.conversationId === pendingConversationId
        ) {
          return false
        }
        return true
      })

    if (sessionOrder.length > 0) {
      return entries.sort((a, b) => {
        const aIndex = sessionOrder.indexOf(a[0])
        const bIndex = sessionOrder.indexOf(b[0])
        // New sessions (not in order list) should appear first (at top)
        if (aIndex === -1 && bIndex === -1) {
          // Both are new - sort by last activity (newest first)
          return getLastActivityTimestamp(b[1]) - getLastActivityTimestamp(a[1])
        }
        if (aIndex === -1) return -1 // a is new, put it first
        if (bIndex === -1) return 1 // b is new, put it first
        return aIndex - bIndex
      })
    }

    // Default sort: active sessions first, then by last activity (newest first)
    return entries.sort((a, b) => {
      const aComplete = a[1]?.isComplete ?? false
      const bComplete = b[1]?.isComplete ?? false
      if (aComplete !== bComplete) return aComplete ? 1 : -1
      return getLastActivityTimestamp(b[1]) - getLastActivityTimestamp(a[1])
    })
  }, [
    agentProgressById,
    sessionOrder,
    getLastActivityTimestamp,
    pendingConversationId,
  ])

  // Sync session order when new sessions appear
  useEffect(() => {
    const currentIds = Array.from(agentProgressById.keys())
    const newIds = currentIds.filter((id) => !sessionOrder.includes(id))

    if (newIds.length > 0) {
      const isInitialLoad = sessionOrder.length === 0

      // On initial load, sort sessions by most recently modified first so the
      // freshest sessions appear at the top of the list.
      // When a new session is added during an active view, it still goes to the front.
      const sortedNewIds = isInitialLoad
        ? [...newIds].sort(
            (a, b) =>
              getLastActivityTimestamp(agentProgressById.get(b)) -
              getLastActivityTimestamp(agentProgressById.get(a)),
          )
        : newIds

      // Add (sorted) new sessions to the beginning of the order
      setSessionOrder((prev) => [
        ...sortedNewIds,
        ...prev.filter((id) => currentIds.includes(id)),
      ])
    } else {
      // Remove sessions that no longer exist
      const validOrder = sessionOrder.filter((id) => currentIds.includes(id))
      if (validOrder.length !== sessionOrder.length) {
        setSessionOrder(validOrder)
      }
    }
  }, [agentProgressById, getLastActivityTimestamp])

  // Handle route parameter for deep-linking to specific session
  // When navigating to /:id, focus the active session tile or create a new tile for past sessions
  useEffect(() => {
    if (routeHistoryItemId) {
      // Check if this ID matches an active (non-complete) session - if so, focus it.
      // Completed sessions should reload from disk to ensure fresh data,
      // especially for sessions created remotely (e.g. from mobile) where
      // in-memory progress data may be stale or incomplete.
      const activeSession = Array.from(agentProgressById.entries()).find(
        ([_, progress]) =>
          progress?.conversationId === routeHistoryItemId &&
          !progress?.isComplete,
      )
      if (activeSession) {
        setFocusedSessionId(activeSession[0])
        scrollSessionTileIntoView(activeSession[0])
      } else {
        // It's a past session or completed session - load fresh data from disk
        setPendingConversationId(routeHistoryItemId)
      }
      // Clear the route param from URL without causing a remount
      // Using window.history.replaceState instead of navigate() to avoid clearing local state
      window.history.replaceState(null, "", "/")
    }
  }, [
    routeHistoryItemId,
    agentProgressById,
    scrollSessionTileIntoView,
    setFocusedSessionId,
  ])

  // Handle scroll-to-session requests from sidebar navigation
  useEffect(() => {
    if (!scrollToSessionId) {
      clearPendingSessionScroll()
      return undefined
    }

    scrollSessionTileIntoView(scrollToSessionId, { clearScrollRequest: true })

    return clearPendingSessionScroll
  }, [clearPendingSessionScroll, scrollSessionTileIntoView, scrollToSessionId])

  useEffect(() => clearPendingSessionScroll, [clearPendingSessionScroll])

  // Load the pending conversation data when one is selected
  const pendingConversationQuery = useQuery({
    queryKey: ["conversation", pendingConversationId],
    queryFn: async () => {
      if (!pendingConversationId) return null
      return tipcClient.loadConversation({
        conversationId: pendingConversationId,
      })
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
    if (!pendingConversationQuery.isError && !isPendingConversationMissing)
      return

    if (pendingConversationQuery.isError) {
      console.error(
        "Failed to load pending conversation:",
        pendingConversationQuery.error,
      )
    } else {
      console.error("Pending conversation not found:", pendingConversationId)
    }
    toast.error("Unable to load that past session")
    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
  }, [
    pendingConversationId,
    pendingConversationQuery.isError,
    pendingConversationQuery.error,
    isPendingConversationMissing,
  ])

  // Create a synthetic AgentProgressUpdate for the pending conversation
  // This allows us to reuse the AgentProgress component with the same UI
  const pendingSessionId = pendingConversationId
    ? `pending-${pendingConversationId}`
    : null
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
        ? [
            {
              id: `pending-start-${pendingConversationId}`,
              type: "thinking",
              title: "Starting follow-up",
              description: "Waiting for session updates...",
              status: "in_progress",
              timestamp: pendingContinuationStartedAt,
            },
          ]
        : [],
      isComplete: !isInitializing,
      conversationHistory: conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        toolResults: m.toolResults,
        timestamp: m.timestamp,
      })),
    }
  }, [
    pendingConversationId,
    pendingConversationQuery.data,
    pendingContinuationStartedAt,
  ])

  // Handle continuing a conversation - check for existing active session first
  // If found, focus it; otherwise create a pending tile
  // LLM inference will only happen when user sends an actual message
  const handleContinueConversation = (conversationId: string) => {
    // Check if there's already an active session for this conversationId
    const existingSession = Array.from(agentProgressById.entries()).find(
      ([_, progress]) =>
        progress?.conversationId === conversationId && !progress?.isComplete,
    )
    if (existingSession) {
      // Focus the existing session tile instead of creating a duplicate
      setFocusedSessionId(existingSession[0])
      scrollSessionTileIntoView(existingSession[0])
    } else {
      // No active session exists, create a pending tile
      setPendingContinuationStartedAt(null)
      setPendingConversationId(conversationId)
    }
  }

  // Handle dismissing the pending continuation
  const handleDismissPendingContinuation = () => {
    logUI("[Sessions] Dismissing pending continuation:", {
      pendingConversationId,
    })
    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
  }

  const applySelectedAgentToNextSession = useCallback(
    async (options?: { silent?: boolean }) => {
      return applySelectedAgentForNextSession({
        selectedAgentId,
        setSelectedAgentId,
        silent: options?.silent,
        onError: (error) => {
          logUI("[Sessions] Failed to apply selected agent", {
            selectedAgentId,
            error,
          })
        },
      })
    },
    [selectedAgentId, setSelectedAgentId],
  )

  // Keep the main-process current profile aligned with the selected agent so all
  // new-session entry points (including conversation follow-ups) use the selector.
  useEffect(() => {
    void applySelectedAgentToNextSession({ silent: true })
  }, [applySelectedAgentToNextSession])

  const handlePendingContinuationStarted = useCallback(() => {
    setPendingContinuationStartedAt((existing) => existing ?? Date.now())
  }, [])

  // Auto-dismiss pending tile when a real session starts for the same conversationId.
  // During initialization, also dismiss when a completed session appears with
  // activity at/after the follow-up start timestamp.
  useEffect(() => {
    if (!pendingConversationId) return

    const hasRealSession = Array.from(agentProgressById.entries()).some(
      ([sessionId, progress]) =>
        !sessionId.startsWith("pending-") &&
        progress?.conversationId === pendingConversationId &&
        (!progress?.isComplete ||
          (pendingContinuationStartedAt !== null &&
            getLastActivityTimestamp(progress) >=
              pendingContinuationStartedAt)),
    )

    if (hasRealSession) {
      // A real session has started for this conversation, dismiss the pending tile
      setPendingContinuationStartedAt(null)
      setPendingConversationId(null)
    }
  }, [
    pendingConversationId,
    pendingContinuationStartedAt,
    agentProgressById,
    getLastActivityTimestamp,
  ])

  // Safety fallback: if initialization does not produce a real session in time,
  // dismiss the pending tile instead of leaving it stuck indefinitely.
  useEffect(() => {
    if (!pendingConversationId || pendingContinuationStartedAt === null)
      return undefined

    const timeoutConversationId = pendingConversationId
    const timeoutStartedAt = pendingContinuationStartedAt
    const timeoutId = window.setTimeout(() => {
      if (
        pendingConversationIdRef.current !== timeoutConversationId ||
        pendingContinuationStartedAtRef.current !== timeoutStartedAt
      ) {
        return
      }

      logUI(
        "[Sessions] Pending continuation timed out waiting for real session",
        {
          pendingConversationId: timeoutConversationId,
          pendingContinuationStartedAt: timeoutStartedAt,
        },
      )
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
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    await tipcClient.showPanelWindowWithTextInput({})
  }

  // Handle voice start - trigger MCP recording
  const handleVoiceStart = async () => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    await tipcClient.showPanelWindow({})
    await tipcClient.triggerMcpRecording({})
  }

  // Handle predefined prompt selection - open panel with text input pre-filled
  const handleSelectPrompt = async (content: string) => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    await tipcClient.showPanelWindowWithTextInput({ initialText: content })
  }

  const handleFocusSession = useCallback(
    async (sessionId: string) => {
      setFocusedSessionId(sessionId)
      // Also show the panel window with this session focused
      try {
        await tipcClient.focusAgentSession({ sessionId })
        await tipcClient.setPanelMode({ mode: "agent" })
        await tipcClient.showPanelWindow({})
      } catch (error) {
        console.error("Failed to show panel window:", error)
      }
    },
    [setFocusedSessionId],
  )

  const handleDismissSession = useCallback(
    async (sessionId: string) => {
      const progress = useAgentStore.getState().agentProgressById.get(sessionId)
      logUI("[Sessions] Dismiss/hide session clicked:", {
        sessionId,
        status: progress?.isComplete ? "complete" : "active",
        conversationTitle:
          progress?.conversationHistory?.[0]?.content?.substring(0, 50),
        conversationId: progress?.conversationId,
      })
      await tipcClient.clearAgentSessionProgress({ sessionId })
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
    },
    [queryClient],
  )

  // Drag and drop handlers
  const handleDragStart = useCallback((sessionId: string, _index: number) => {
    setDraggedSessionId(sessionId)
  }, [])

  const handleDragOver = useCallback((targetIndex: number) => {
    setDragTargetIndex(targetIndex)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedSessionId && dragTargetIndex !== null) {
      // Reorder the sessions
      setSessionOrder((prev) => {
        const currentOrder =
          prev.length > 0 ? prev : allProgressEntries.map(([id]) => id)
        const draggedIndex = currentOrder.indexOf(draggedSessionId)

        if (draggedIndex === -1 || draggedIndex === dragTargetIndex) {
          return currentOrder
        }

        const newOrder = [...currentOrder]
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(dragTargetIndex, 0, draggedSessionId)
        return newOrder
      })
    }
    setDraggedSessionId(null)
    setDragTargetIndex(null)
  }, [draggedSessionId, dragTargetIndex, allProgressEntries])

  const handleClearInactiveSessions = async () => {
    const inactiveSessions = allProgressEntries
      .filter(([_, p]) => p?.isComplete)
      .map(([id]) => id)
    logUI("[Sessions] Clear all inactive sessions clicked:", {
      count: inactiveSessions.length,
      sessionIds: inactiveSessions,
    })
    try {
      await tipcClient.clearInactiveSessions()
      toast.success("Inactive sessions cleared")
    } catch (error) {
      toast.error("Failed to clear inactive sessions")
    }
  }

  // Track previous layout mode so we can restore when exiting maximize
  const previousLayoutModeRef = useRef<RestorableTileLayoutMode>(
    initialTileLayoutPreferenceRef.current.previousLayoutMode,
  )

  const handleSelectTileLayout = useCallback(
    (nextMode: TileLayoutMode) => {
      if (nextMode === tileLayoutMode) {
        return
      }

      if (nextMode === "1x1") {
        previousLayoutModeRef.current =
          tileLayoutMode === "1x1"
            ? previousLayoutModeRef.current
            : tileLayoutMode
      } else {
        previousLayoutModeRef.current = nextMode
      }

      clearPersistedSize("session-tile")
      persistTileLayoutPreference(nextMode, previousLayoutModeRef.current)
      setTileLayoutMode(nextMode)
      setTileResetKey((prev) => prev + 1)
    },
    [tileLayoutMode],
  )

  const handleMaximizeTile = useCallback(
    (sessionId?: string) => {
      const nextMode =
        tileLayoutMode === "1x1" ? previousLayoutModeRef.current : "1x1"

      handleSelectTileLayout(nextMode)

      if (tileLayoutMode !== "1x1" && sessionId) {
        setFocusedSessionId(sessionId)
      }
    },
    [handleSelectTileLayout, tileLayoutMode, setFocusedSessionId],
  )

  // Count inactive (completed) sessions
  const inactiveSessionCount = useMemo(() => {
    return allProgressEntries.filter(([_, progress]) => progress?.isComplete)
      .length
  }, [allProgressEntries])

  const hasPendingLoadingTile =
    !!pendingConversationId &&
    !pendingProgress &&
    !pendingConversationQuery.isError &&
    !isPendingConversationMissing
  const hasPendingTile = !!pendingProgress || hasPendingLoadingTile
  const totalTileCount = allProgressEntries.length + (hasPendingTile ? 1 : 0)
  const isFocusLayout = tileLayoutMode === "1x1"

  const focusableSessionIds = useMemo(
    () => [
      ...(hasPendingTile && pendingSessionId ? [pendingSessionId] : []),
      ...allProgressEntries.map(([sessionId]) => sessionId),
    ],
    [allProgressEntries, hasPendingTile, pendingSessionId],
  )
  const previousFocusableSessionIdsRef = useRef<string[]>(focusableSessionIds)
  const hasExplicitFocusedSession =
    !!focusedSessionId && focusableSessionIds.includes(focusedSessionId)
  const fallbackFocusedSessionId = useMemo(
    () =>
      getFocusLayoutFallbackSessionId(
        focusableSessionIds,
        previousFocusableSessionIdsRef.current,
        focusedSessionId,
      ),
    [focusableSessionIds, focusedSessionId],
  )

  const maximizedSessionId = useMemo(() => {
    if (!isFocusLayout) return null

    if (hasExplicitFocusedSession) {
      return focusedSessionId
    }

    return fallbackFocusedSessionId
  }, [
    fallbackFocusedSessionId,
    focusedSessionId,
    hasExplicitFocusedSession,
    isFocusLayout,
  ])

  useEffect(() => {
    previousFocusableSessionIdsRef.current = focusableSessionIds
  }, [focusableSessionIds])

  useEffect(() => {
    if (!isFocusLayout) return
    if (hasExplicitFocusedSession) return
    if (focusedSessionId === maximizedSessionId) return

    setFocusedSessionId(maximizedSessionId)
  }, [
    focusedSessionId,
    hasExplicitFocusedSession,
    isFocusLayout,
    maximizedSessionId,
    setFocusedSessionId,
  ])

  const visibleProgressEntries = useMemo(() => {
    if (!isFocusLayout || !maximizedSessionId) {
      return allProgressEntries
    }

    return allProgressEntries.filter(
      ([sessionId]) => sessionId === maximizedSessionId,
    )
  }, [allProgressEntries, isFocusLayout, maximizedSessionId])

  const showPendingProgressTile =
    !!pendingProgress &&
    !!pendingSessionId &&
    (!isFocusLayout || maximizedSessionId === pendingSessionId)
  const showPendingLoadingTile =
    !!pendingSessionId &&
    hasPendingLoadingTile &&
    (!isFocusLayout || maximizedSessionId === pendingSessionId)
  const hasVisiblePendingTile =
    showPendingProgressTile || showPendingLoadingTile
  const visibleTileCount =
    visibleProgressEntries.length + (hasVisiblePendingTile ? 1 : 0)
  const showTileMaximize = !isFocusLayout
  const canReorderTiles = !isFocusLayout && allProgressEntries.length > 1
  const focusedLayoutSessionIndex = maximizedSessionId
    ? focusableSessionIds.indexOf(maximizedSessionId)
    : -1
  const focusableSessionCount = focusableSessionIds.length
  const showFocusLayoutHint =
    isFocusLayout && focusableSessionCount > 1 && !!maximizedSessionId
  const canBrowseFocusedSessions =
    showFocusLayoutHint && focusedLayoutSessionIndex >= 0
  const isTemporarySingleVisibleLayout =
    !isFocusLayout && visibleTileCount === 1
  const isResponsiveStackedLayout = isResponsiveStackedTileLayout(
    sessionGridMeasurements.containerWidth,
    sessionGridMeasurements.gap,
    tileLayoutMode,
    visibleTileCount,
  )
  const usesAdaptiveLayoutDescription =
    isTemporarySingleVisibleLayout || isResponsiveStackedLayout
  const activeLayoutDescription = isTemporarySingleVisibleLayout
    ? TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION
    : isResponsiveStackedLayout
      ? RESPONSIVE_STACKED_LAYOUT_DESCRIPTION
      : LAYOUT_DESCRIPTIONS[tileLayoutMode]
  const activeLayoutCompactDescription = isTemporarySingleVisibleLayout
    ? TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL
    : isResponsiveStackedLayout
      ? RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL
      : LAYOUT_DESCRIPTIONS[tileLayoutMode]
  const activeLayoutOption =
    TILE_LAYOUT_OPTIONS.find(({ mode }) => mode === tileLayoutMode) ??
    TILE_LAYOUT_OPTIONS[0]
  const restoreLayoutMode = isFocusLayout ? previousLayoutModeRef.current : null
  const restoreLayoutOption = restoreLayoutMode
    ? (TILE_LAYOUT_OPTIONS.find(({ mode }) => mode === restoreLayoutMode) ??
      TILE_LAYOUT_OPTIONS[0])
    : null
  const stackedLayoutRecoveryHint =
    isResponsiveStackedLayout && tileLayoutMode !== "1x1"
      ? STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]
      : null
  const hasMeasuredSessionGridWidth = sessionGridMeasurements.containerWidth > 0
  const isCompactSessionHeader =
    hasMeasuredSessionGridWidth &&
    sessionGridMeasurements.containerWidth < COMPACT_SESSION_HEADER_WIDTH
  const isVeryCompactSessionHeader =
    hasMeasuredSessionGridWidth &&
    sessionGridMeasurements.containerWidth < TIGHT_SESSION_HEADER_WIDTH
  const nearStackedLayoutHint =
    hasMeasuredSessionGridWidth &&
    tileLayoutMode !== "1x1" &&
    visibleTileCount > 1 &&
    !isResponsiveStackedLayout &&
    isResponsiveStackedTileLayout(
      Math.max(
        0,
        sessionGridMeasurements.containerWidth -
          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER,
      ),
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
      ? NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]
      : null
  const showStackedLayoutRecoveryHint = !!stackedLayoutRecoveryHint
  const showNearStackedLayoutHint = !!nearStackedLayoutHint
  const showSingleViewRestore = isFocusLayout && !!restoreLayoutOption
  const showSingleViewRestoreLabel =
    showSingleViewRestore && !isVeryCompactSessionHeader
  const showCurrentLayoutChip = usesAdaptiveLayoutDescription
  const showLayoutDescriptionSuffix = !isCompactSessionHeader
  const showCompactAdaptiveLayoutDescription =
    usesAdaptiveLayoutDescription &&
    isCompactSessionHeader &&
    !isVeryCompactSessionHeader
  const stackedLayoutRecoveryLabel = !showStackedLayoutRecoveryHint
    ? null
    : isVeryCompactSessionHeader
      ? "Make room"
      : isCompactSessionHeader
        ? stackedLayoutRecoveryHint.compactLabel
        : stackedLayoutRecoveryHint.fullLabel
  const nearStackedLayoutHintLabel = !showNearStackedLayoutHint
    ? null
    : isVeryCompactSessionHeader
      ? "Tight"
      : isCompactSessionHeader
        ? nearStackedLayoutHint.compactLabel
        : nearStackedLayoutHint.fullLabel
  const showReorderHint =
    canReorderTiles &&
    visibleTileCount > 1 &&
    !isResponsiveStackedLayout &&
    !showNearStackedLayoutHint
  const handleRestorePreviousLayout = useCallback(() => {
    if (!isFocusLayout) return

    handleSelectTileLayout(previousLayoutModeRef.current)
  }, [handleSelectTileLayout, isFocusLayout])
  const focusedLayoutSessionLabel = useMemo(() => {
    if (!showFocusLayoutHint || !maximizedSessionId) return null

    if (pendingSessionId && maximizedSessionId === pendingSessionId) {
      return getSessionTileLabel(pendingSessionId, pendingProgress)
    }

    const focusedEntry = allProgressEntries.find(
      ([sessionId]) => sessionId === maximizedSessionId,
    )
    return getSessionTileLabel(maximizedSessionId, focusedEntry?.[1])
  }, [
    allProgressEntries,
    maximizedSessionId,
    pendingProgress,
    pendingSessionId,
    showFocusLayoutHint,
  ])
  const showFocusedSessionLabel =
    !!focusedLayoutSessionLabel && !isCompactSessionHeader
  const showBrowsingSessionsLabel =
    !focusedLayoutSessionLabel && !isCompactSessionHeader
  const showLayoutButtonLabels = !isVeryCompactSessionHeader
  const reorderHintLabel = isVeryCompactSessionHeader
    ? null
    : isCompactSessionHeader
      ? "Reorder"
      : "Drag to reorder"

  const handleStepFocusedSession = useCallback(
    (direction: "previous" | "next") => {
      if (!isFocusLayout || !maximizedSessionId) return

      const currentIndex = focusableSessionIds.indexOf(maximizedSessionId)
      if (currentIndex === -1) return

      const nextIndex =
        direction === "previous" ? currentIndex - 1 : currentIndex + 1
      const nextSessionId = focusableSessionIds[nextIndex]
      if (!nextSessionId) return

      setFocusedSessionId(nextSessionId)
    },
    [
      focusableSessionIds,
      isFocusLayout,
      maximizedSessionId,
      setFocusedSessionId,
    ],
  )

  const hasSessions = allProgressEntries.length > 0 || hasPendingTile

  return (
    <div className="group/tile flex h-full flex-col">
      {/* Header with start buttons - outside the scroll area so its height is excluded
          when SessionGrid measures the parent to size tiles. */}
      {hasSessions && (
        <div className="bg-muted/20 flex-shrink-0 border-b px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <AgentSelector
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                compact
              />
              <Button size="sm" onClick={handleTextClick} className="gap-1.5">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Start with Text</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVoiceStart}
                className="gap-1.5"
              >
                <Mic className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Start with Voice</span>
              </Button>
              <PredefinedPromptsMenu onSelectPrompt={handleSelectPrompt} />
            </div>
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
              {/* Past sessions button */}
              {onOpenPastSessionsDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenPastSessionsDialog}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                  title="Past Sessions"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">Past Sessions</span>
                </Button>
              )}
              {inactiveSessionCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearInactiveSessions}
                  className="text-muted-foreground hover:text-foreground h-7 px-2"
                  title={`Clear ${inactiveSessionCount} completed sessions (conversations are saved to history)`}
                  aria-label={`Clear ${inactiveSessionCount} completed sessions`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="border-border/50 mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {showCurrentLayoutChip && (
                <div
                  className="border-border/60 bg-background/70 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                  title={`Current layout: ${LAYOUT_LABELS[tileLayoutMode]} — ${activeLayoutDescription}`}
                >
                  <activeLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground/90 whitespace-nowrap font-medium">
                    {LAYOUT_LABELS[tileLayoutMode]}
                  </span>
                  {showLayoutDescriptionSuffix ? (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="whitespace-nowrap">
                        {activeLayoutDescription}
                      </span>
                    </>
                  ) : showCompactAdaptiveLayoutDescription ? (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="whitespace-nowrap">
                        {activeLayoutCompactDescription}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
              {showStackedLayoutRecoveryHint &&
                stackedLayoutRecoveryHint &&
                stackedLayoutRecoveryLabel && (
                  <div
                    className={cn(
                      "flex max-w-full items-center gap-1.5 rounded-md border border-dashed border-blue-500/30 bg-blue-500/10 py-1 text-[11px] text-blue-700 dark:text-blue-300",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={stackedLayoutRecoveryHint.title}
                  >
                    <activeLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {stackedLayoutRecoveryLabel}
                    </span>
                  </div>
                )}
              {showNearStackedLayoutHint &&
                nearStackedLayoutHint &&
                nearStackedLayoutHintLabel && (
                  <div
                    className={cn(
                      "flex max-w-full items-center gap-1.5 rounded-md border border-dashed border-amber-500/30 bg-amber-500/10 py-1 text-[11px] text-amber-700 dark:text-amber-300",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={nearStackedLayoutHint.title}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {nearStackedLayoutHintLabel}
                    </span>
                  </div>
                )}
              {showFocusLayoutHint && (
                <div
                  className="border-border/60 bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                  title={
                    focusedLayoutSessionLabel
                      ? `Single view: ${focusedLayoutSessionLabel} (${focusedLayoutSessionIndex + 1} of ${focusableSessionCount})`
                      : `Single view: showing session ${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`
                  }
                >
                  <span className="border-border/60 bg-muted/40 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                    {focusedLayoutSessionIndex + 1} of {focusableSessionCount}
                  </span>
                  {showFocusedSessionLabel ? (
                    <>
                      <span className="text-muted-foreground/50 whitespace-nowrap">
                        ·
                      </span>
                      <span
                        className="text-muted-foreground/80 max-w-[220px] truncate"
                        title={focusedLayoutSessionLabel}
                      >
                        Showing {focusedLayoutSessionLabel}
                      </span>
                    </>
                  ) : showBrowsingSessionsLabel ? (
                    <span className="text-muted-foreground/80 whitespace-nowrap">
                      Browsing sessions
                    </span>
                  ) : null}
                </div>
              )}
              {showReorderHint && (
                <div
                  className={cn(
                    "border-border/60 bg-background/70 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border border-dashed py-1 text-[11px]",
                    reorderHintLabel ? "px-2" : "px-1.5",
                  )}
                  title="Drag the reorder handle on any session tile to reorder the grid"
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0" />
                  {reorderHintLabel ? (
                    <span className="whitespace-nowrap">
                      {reorderHintLabel}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
              {showSingleViewRestore && restoreLayoutOption && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRestorePreviousLayout}
                  aria-label={`Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`}
                  title={`Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`}
                  className={cn(
                    "border-border/60 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground h-7 border text-[11px]",
                    showSingleViewRestoreLabel ? "gap-1 px-2" : "px-1.5",
                  )}
                >
                  <restoreLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
                  {showSingleViewRestoreLabel ? (
                    <span>{`Back to ${restoreLayoutOption.label}`}</span>
                  ) : null}
                </Button>
              )}
              {canBrowseFocusedSessions && (
                <div
                  role="group"
                  aria-label="Browse sessions in single view"
                  className="border-border/60 bg-background/80 flex items-center gap-0.5 rounded-md border p-0.5"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStepFocusedSession("previous")}
                    disabled={focusedLayoutSessionIndex <= 0}
                    aria-label="Show previous session in single view"
                    title="Show previous session in single view"
                    className="text-muted-foreground hover:text-foreground h-7 w-7 px-0 disabled:cursor-default disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStepFocusedSession("next")}
                    disabled={
                      focusedLayoutSessionIndex >= focusableSessionCount - 1
                    }
                    aria-label="Show next session in single view"
                    title="Show next session in single view"
                    className="text-muted-foreground hover:text-foreground h-7 w-7 px-0 disabled:cursor-default disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <div
                role="group"
                aria-label="Session tile layout"
                className="border-border/60 bg-background/80 flex items-center gap-0.5 rounded-lg border p-0.5"
              >
                {TILE_LAYOUT_OPTIONS.map(({ mode, label, title, Icon }) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectTileLayout(mode)}
                    aria-label={title}
                    aria-pressed={tileLayoutMode === mode}
                    title={
                      tileLayoutMode === mode
                        ? `Current layout: ${LAYOUT_LABELS[mode]} — ${activeLayoutDescription}`
                        : title
                    }
                    className={cn(
                      "text-muted-foreground hover:text-foreground h-7 text-[11px]",
                      showLayoutButtonLabels ? "gap-1 px-2" : "px-1.5",
                      tileLayoutMode === mode &&
                        "bg-accent text-foreground hover:bg-accent shadow-sm",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {showLayoutButtonLabels ? <span>{label}</span> : null}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content area - flex-1 min-h-0 so it fills remaining height without overflow */}
      <div className="scrollbar-hide-until-hover min-h-0 flex-1 overflow-y-auto">
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
          /* Active sessions - grid view */
          <SessionGrid
            sessionCount={visibleTileCount}
            resetKey={tileResetKey}
            layoutMode={tileLayoutMode}
            layoutChangeKey={sidebarWidth}
            onMeasurementsChange={handleSessionGridMeasurementsChange}
          >
            {/* Pending continuation tile first */}
            {showPendingProgressTile && pendingSessionId && pendingProgress && (
              <SessionTileWrapper
                key={pendingSessionId}
                sessionId={pendingSessionId}
                index={0}
                isCollapsed={collapsedSessions[pendingSessionId] ?? false}
                isDraggable={false}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDragEnd={() => {}}
                isDragTarget={false}
                isDragging={false}
              >
                <AgentProgress
                  progress={pendingProgress}
                  variant="tile"
                  isFocused={true}
                  onFocus={() => {}}
                  onDismiss={handleDismissPendingContinuation}
                  onFollowUpSent={handlePendingContinuationStarted}
                  isCollapsed={collapsedSessions[pendingSessionId] ?? false}
                  onCollapsedChange={(collapsed) =>
                    handleCollapsedChange(pendingSessionId, collapsed)
                  }
                  onExpand={
                    showTileMaximize
                      ? () => handleMaximizeTile(pendingSessionId)
                      : undefined
                  }
                  isExpanded={isFocusLayout}
                  isFollowUpInputInitializing={
                    pendingContinuationStartedAt !== null
                  }
                />
              </SessionTileWrapper>
            )}
            {showPendingLoadingTile && pendingSessionId && (
              <SessionTileWrapper
                key={pendingSessionId}
                sessionId={pendingSessionId}
                index={0}
                isCollapsed={false}
                isDraggable={false}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDragEnd={() => {}}
                isDragTarget={false}
                isDragging={false}
              >
                <div
                  className="border-border bg-card flex h-full flex-col rounded-xl border p-4"
                  role="status"
                  aria-live="polite"
                  aria-label={PENDING_LOADING_TILE_STATUS_LABEL}
                >
                  <div className="border-border/60 flex min-w-0 items-start gap-3 border-b pb-3">
                    <Loader2
                      className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0 animate-spin"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-sm font-medium leading-snug break-words [overflow-wrap:anywhere]">
                        {PENDING_LOADING_TILE_STATUS_LABEL}
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed break-words [overflow-wrap:anywhere]">
                        {PENDING_LOADING_TILE_HELPER_TEXT}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2" aria-hidden="true">
                    <div className="bg-muted/70 h-3 w-full animate-pulse rounded" />
                    <div className="bg-muted/70 h-3 w-5/6 animate-pulse rounded" />
                    <div className="bg-muted/70 h-3 w-2/3 animate-pulse rounded" />
                  </div>
                </div>
              </SessionTileWrapper>
            )}
            {/* Regular sessions */}
            {visibleProgressEntries.map(([sessionId, progress], index) => {
              const isCollapsed = collapsedSessions[sessionId] ?? false
              const adjustedIndex = hasVisiblePendingTile ? index + 1 : index
              const isSessionFocused =
                focusedSessionId === sessionId ||
                (isFocusLayout && maximizedSessionId === sessionId)
              return (
                <SessionProgressTile
                  key={sessionId}
                  sessionId={sessionId}
                  progress={progress}
                  index={adjustedIndex}
                  isCollapsed={isCollapsed}
                  isDraggable={canReorderTiles}
                  isFocused={isSessionFocused}
                  isExpanded={isFocusLayout}
                  isDragTarget={
                    canReorderTiles &&
                    dragTargetIndex === adjustedIndex &&
                    draggedSessionId !== sessionId
                  }
                  isDragging={canReorderTiles && draggedSessionId === sessionId}
                  showTileMaximize={showTileMaximize}
                  onFocusSession={handleFocusSession}
                  onDismissSession={handleDismissSession}
                  onCollapsedChange={handleCollapsedChange}
                  onMaximizeTile={handleMaximizeTile}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  setSessionRef={setSessionRef}
                />
              )
            })}
          </SessionGrid>
        )}
      </div>
    </div>
  )
}
