import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  X,
  Clock,
  Mic,
  Plus,
} from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { useAgentStore } from "@renderer/stores"
import { logUI, logStateChange, logExpand } from "@renderer/lib/debug"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useConversationHistoryQuery } from "@renderer/lib/queries"
import {
  filterPastSessionsAgainstActiveSessions,
  orderActiveSessionsByPinnedFirst,
} from "@renderer/lib/sidebar-sessions"
import { useNavigate } from "react-router-dom"
import { AgentSelector } from "./agent-selector"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import { Button } from "./ui/button"
import { normalizeAgentConversationState } from "@dotagents/shared"
import type { AgentProgressUpdate } from "@shared/types"

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

interface ConversationHistoryItem {
  id: string
  title: string
  updatedAt: number
}

interface SidebarSession {
  session: AgentSession
  isPast: boolean
  key: string
}

function getSessionLastMessageTimestamp(
  session: AgentSession,
  conversationTimestamp?: number,
): number {
  return Math.max(
    conversationTimestamp ?? 0,
    session.endTime ?? 0,
    session.startTime ?? 0,
  )
}

function formatMinutesAgo(timestamp: number): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) return null
  const minutesAgo = Math.max(Math.floor((Date.now() - timestamp) / 60_000), 0)
  if (minutesAgo < 60) {
    return minutesAgo === 1 ? "1m" : `${minutesAgo}m`
  }

  const hours = Math.floor(minutesAgo / 60)
  const remainderMinutes = minutesAgo % 60
  const hourLabel = `${hours}h`
  const minuteLabel = remainderMinutes > 0 ? ` ${remainderMinutes}m` : ""
  return `${hourLabel}${minuteLabel}`
}

function getSidebarSessionPreview(progress?: AgentProgressUpdate | null): string | null {
  if (!progress) return null
  if (progress.userResponse) return progress.userResponse
  if (progress.latestSummary?.actionSummary) return progress.latestSummary.actionSummary

  const latestStep = progress.steps?.[progress.steps.length - 1]
  if (latestStep?.description) return latestStep.description
  if (latestStep?.title) return latestStep.title

  if (progress.conversationHistory?.length) {
    for (let index = progress.conversationHistory.length - 1; index >= 0; index -= 1) {
      const message = progress.conversationHistory[index]
      if (message.role !== "assistant" || !message.content) continue
      return typeof message.content === "string" ? message.content : JSON.stringify(message.content)
    }
  }

  if (progress.streamingContent?.text) return progress.streamingContent.text
  return null
}

const MIN_VISIBLE_SIDEBAR_SESSIONS = 5
const SIDEBAR_PAST_SESSIONS_PAGE_SIZE = 10

const STORAGE_KEY = "active-agents-sidebar-expanded"

function SessionOverflowMenu({
  sessionTitle,
  isPinned,
  canRename,
  onRename,
  onTogglePin,
  onArchive,
}: {
  sessionTitle: string
  isPinned: boolean
  canRename: boolean
  onRename?: () => void
  onTogglePin: () => void
  onArchive: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="hover:bg-accent focus-visible:ring-ring shrink-0 rounded p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          aria-label={`Session actions for ${sessionTitle}`}
          title="Session actions"
        >
          <MoreHorizontal className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canRename && onRename && (
          <>
            <DropdownMenuItem onSelect={() => onRename()}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => onTogglePin()}>
          {isPinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onArchive()}>
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ActiveAgentsSidebar({
  onOpenPastSessionsDialog,
  selectedAgentId = null,
  onSelectAgent,
  onStartTextSession,
  onStartVoiceSession,
  onStartPromptSession,
  inactiveSessionCount = 0,
  onClearInactiveSessions,
}: {
  onOpenPastSessionsDialog?: () => void
  selectedAgentId?: string | null
  onSelectAgent?: (id: string | null) => void
  onStartTextSession?: () => void | Promise<void>
  onStartVoiceSession?: () => void | Promise<void>
  onStartPromptSession?: (content: string) => void | Promise<void>
  inactiveSessionCount?: number
  onClearInactiveSessions?: () => void | Promise<void>
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const initial = stored !== null ? stored === "true" : true
    logExpand("ActiveAgentsSidebar", "init", {
      key: STORAGE_KEY,
      raw: stored,
      parsed: initial,
    })
    return initial
  })

  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const expandedSessionId = useAgentStore((s) => s.expandedSessionId)
  const setExpandedSessionId = useAgentStore((s) => s.setExpandedSessionId)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)
  const togglePinSession = useAgentStore((s) => s.togglePinSession)
  const archivedSessionIds = useAgentStore((s) => s.archivedSessionIds)
  const toggleArchiveSession = useAgentStore((s) => s.toggleArchiveSession)
  const [visiblePastSessionCount, setVisiblePastSessionCount] = useState(0)
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null)
  const [editingTitle, setEditingTitle] = useState("")
  const skipTitleSaveOnBlurRef = useRef(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, refetch } = useQuery<AgentSessionsResponse>({
    queryKey: ["agentSessions"],
    queryFn: async () => {
      return await tipcClient.getAgentSessions()
    },
  })
  const conversationHistoryQuery = useConversationHistoryQuery(isExpanded)

  useEffect(() => {
    const unlisten = rendererHandlers.agentSessionsUpdated.listen(
      (updatedData) => {
        refetch()
      },
    )
    return unlisten
  }, [refetch])

  const trackedActiveSessions = data?.activeSessions || []
  const recentSessions = data?.recentSessions || []
  const conversationHistory =
    (conversationHistoryQuery.data as ConversationHistoryItem[] | undefined) ||
    []

  const activeSessions = useMemo<AgentSession[]>(() => {
    const recentStatusById = new Map(
      recentSessions.map((session) => [session.id, session.status] as const),
    )
    const mergedSessions = new Map(
      trackedActiveSessions.map((session) => [session.id, session] as const),
    )

    for (const [sessionId, progress] of agentProgressById.entries()) {
      const recentStatus = recentStatusById.get(sessionId)
      if (recentStatus === "stopped" || recentStatus === "error") {
        continue
      }

      const existingSession = mergedSessions.get(sessionId)
      const firstHistoryTimestamp = progress.conversationHistory?.[0]?.timestamp
      const lastHistoryTimestamp = progress.conversationHistory?.[
        progress.conversationHistory.length - 1
      ]?.timestamp

      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId: progress.conversationId ?? existingSession?.conversationId,
        conversationTitle:
          progress.conversationTitle ?? existingSession?.conversationTitle,
        status: "active",
        startTime:
          existingSession?.startTime ??
          firstHistoryTimestamp ??
          lastHistoryTimestamp ??
          Date.now(),
        endTime: existingSession?.endTime,
        currentIteration:
          progress.currentIteration ?? existingSession?.currentIteration,
        maxIterations: progress.maxIterations ?? existingSession?.maxIterations,
        lastActivity: existingSession?.lastActivity,
        errorMessage: existingSession?.errorMessage,
        isSnoozed: progress.isSnoozed ?? existingSession?.isSnoozed,
      })
    }

    return Array.from(mergedSessions.values()).sort((a, b) => {
      const aProgress = agentProgressById.get(a.id)
      const bProgress = agentProgressById.get(b.id)
      const aTimestamp =
        aProgress?.conversationHistory?.[aProgress.conversationHistory.length - 1]
          ?.timestamp ??
        a.endTime ??
        a.startTime
      const bTimestamp =
        bProgress?.conversationHistory?.[bProgress.conversationHistory.length - 1]
          ?.timestamp ??
        b.endTime ??
        b.startTime
      return bTimestamp - aTimestamp
    })
  }, [trackedActiveSessions, recentSessions, agentProgressById])

  const allPastSessions = useMemo(() => {
    const items: SidebarSession[] = []
    const seenConversationIds = new Set<string>(
      activeSessions
        .map((session) => session.conversationId)
        .filter((id): id is string => !!id),
    )
    const seenFallbackIds = new Set<string>(
      activeSessions.map((session) => session.id),
    )

    const addPastSession = (session: AgentSession, keyPrefix: string) => {
      const conversationId = session.conversationId
      if (conversationId) {
        if (seenConversationIds.has(conversationId)) return
        seenConversationIds.add(conversationId)
      } else {
        if (seenFallbackIds.has(session.id)) return
        seenFallbackIds.add(session.id)
      }

      items.push({
        session,
        isPast: true,
        key: `${keyPrefix}:${session.id}`,
      })
    }

    // Recent runtime sessions first so just-finished agents stay near the top.
    for (const session of recentSessions) {
      addPastSession(session, "recent")
    }

    // Fill with persisted conversation history.
    for (const historyItem of conversationHistory) {
      const mappedSession: AgentSession = {
        id: historyItem.id,
        conversationId: historyItem.id,
        conversationTitle: historyItem.title || "Untitled session",
        status: "completed",
        startTime: historyItem.updatedAt,
        endTime: historyItem.updatedAt,
      }
      addPastSession(mappedSession, "history")
    }

    return items
  }, [activeSessions, conversationHistory, recentSessions])

  const minimumPastSessionsNeeded = useMemo(
    () => Math.max(MIN_VISIBLE_SIDEBAR_SESSIONS - activeSessions.length, 0),
    [activeSessions.length],
  )

  const displayedPastSessionCount = Math.max(
    visiblePastSessionCount,
    minimumPastSessionsNeeded,
  )

  const { sidebarSessions, hasMorePastSessions } = useMemo(() => {
    const orderedActiveSessions = orderActiveSessionsByPinnedFirst<AgentSession>(
      activeSessions,
      pinnedSessionIds,
    )
    const activeItems: SidebarSession[] = orderedActiveSessions.map(
      (session) => ({
        session,
        isPast: false,
        key: `active:${session.id}`,
      }),
    )
    const dedupedPastSessions =
      filterPastSessionsAgainstActiveSessions<SidebarSession>(
        allPastSessions,
        orderedActiveSessions,
      ).filter((item) => {
        const cid = item.session.conversationId
        return !cid || !archivedSessionIds.has(cid)
      })

    // Ensure pinned past sessions always appear, even if beyond the visible count.
    // Split into pinned (always shown) and unpinned (paginated).
    const pinnedPast: SidebarSession[] = []
    const unpinnedPast: SidebarSession[] = []
    for (const item of dedupedPastSessions) {
      const cid = item.session.conversationId
      if (cid && pinnedSessionIds.has(cid)) {
        pinnedPast.push(item)
      } else {
        unpinnedPast.push(item)
      }
    }

    const unpinnedSliceCount = Math.max(
      displayedPastSessionCount - pinnedPast.length,
      0,
    )

    return {
      sidebarSessions: [
        ...activeItems,
        ...pinnedPast,
        ...unpinnedPast.slice(0, unpinnedSliceCount),
      ],
      // "Has more" is based on unpinned sessions only since pinned are always shown
      hasMorePastSessions: unpinnedPast.length > unpinnedSliceCount,
    }
  }, [
    activeSessions,
    allPastSessions,
    displayedPastSessionCount,
    pinnedSessionIds,
    archivedSessionIds,
  ])

  const hasAnySessions = sidebarSessions.length > 0

  useEffect(() => {
    setVisiblePastSessionCount((prev) =>
      Math.max(prev, minimumPastSessionsNeeded),
    )
  }, [minimumPastSessionsNeeded])

  useEffect(() => {
    logStateChange("ActiveAgentsSidebar", "isExpanded", !isExpanded, isExpanded)
    logExpand("ActiveAgentsSidebar", "write", {
      key: STORAGE_KEY,
      value: isExpanded,
    })
    try {
      const valueStr = String(isExpanded)
      localStorage.setItem(STORAGE_KEY, valueStr)
      const verify = localStorage.getItem(STORAGE_KEY)
      logExpand("ActiveAgentsSidebar", "verify", {
        key: STORAGE_KEY,
        wrote: valueStr,
        readBack: verify,
      })
    } catch (e) {
      logExpand("ActiveAgentsSidebar", "error", {
        key: STORAGE_KEY,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }, [isExpanded])

  const handleSessionClick = useCallback((sessionId: string) => {
    logUI("[ActiveAgentsSidebar] Session clicked:", sessionId)
    // Navigate to sessions page and focus this session
    navigate("/", { state: { clearPendingConversation: true } })
    setFocusedSessionId(sessionId)
    setExpandedSessionId(sessionId)
  }, [navigate, setFocusedSessionId, setExpandedSessionId])

  // Keyboard shortcuts: Cmd/Ctrl+1..9 to jump to the Nth sidebar session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      const digit = parseInt(e.key, 10)
      if (isNaN(digit) || digit < 1 || digit > 9) return

      const index = digit - 1
      const target = sidebarSessions[index]
      if (!target) return

      e.preventDefault()
      e.stopPropagation()

      const { session, isPast } = target
      if (isPast) {
        if (session.conversationId) {
          logUI("[ActiveAgentsSidebar] Hotkey jump to past session:", session.conversationId)
          navigate(`/${session.conversationId}`)
        }
      } else {
        logUI("[ActiveAgentsSidebar] Hotkey jump to active session:", session.id)
        handleSessionClick(session.id)
      }

      // Focus the composer input after React re-renders
      requestAnimationFrame(() => {
        setTimeout(() => {
          const input =
            document.querySelector<HTMLInputElement>('[aria-label="Send follow-up message"]') ??
            document.querySelector<HTMLInputElement>('[aria-label="Queue message"]') ??
            document.querySelector<HTMLInputElement>('input[placeholder*="follow-up"]') ??
            document.querySelector<HTMLInputElement>('input[placeholder*="message"]')
          input?.focus()
        }, 100)
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarSessions, navigate, handleSessionClick])

  const handleStopSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session focus when clicking stop
    logUI("[ActiveAgentsSidebar] Stopping session:", sessionId)
    try {
      await tipcClient.stopAgentSession({ sessionId })
      // If we just stopped the focused session, just unfocus; do not clear all progress
      if (focusedSessionId === sessionId) {
        setFocusedSessionId(null)
      }
    } catch (error) {
      console.error("Failed to stop session:", error)
    }
  }

  const handleToggleExpand = () => {
    const newState = !isExpanded
    logExpand("ActiveAgentsSidebar", "toggle", {
      from: isExpanded,
      to: newState,
      source: "user",
    })
    setIsExpanded(newState)
  }

  const clearTitleEditing = useCallback(() => {
    setEditingConversationId(null)
    setEditingTitle("")
  }, [])

  const startTitleEditing = useCallback(
    (conversationId?: string, title?: string) => {
      if (!conversationId) return
      setEditingConversationId(conversationId)
      setEditingTitle(title || "Untitled session")
    },
    [],
  )

  const saveTitleEdit = useCallback(
    async (conversationId?: string, currentTitle?: string) => {
      if (!conversationId) {
        clearTitleEditing()
        return
      }

      const nextTitle = editingTitle.trim()
      const previousTitle = (currentTitle || "Untitled session").trim()

      if (!nextTitle || nextTitle === previousTitle) {
        clearTitleEditing()
        return
      }

      try {
        await tipcClient.renameConversationTitle({
          conversationId,
          title: nextTitle,
        })
        clearTitleEditing()

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["agentSessions"] }),
          queryClient.invalidateQueries({ queryKey: ["conversation-history"] }),
          queryClient.invalidateQueries({
            queryKey: ["conversation", conversationId],
          }),
        ])
      } catch (error) {
        console.error("Failed to rename session title:", error)
      }
    },
    [clearTitleEditing, editingTitle, queryClient],
  )

  const renderEditableTitle = useCallback(
    (session: AgentSession, className: string, prefix?: string) => {
      const conversationId = session.conversationId
      const title = session.conversationTitle || "Untitled session"

      if (conversationId && editingConversationId === conversationId) {
        return (
          <input
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation()
              if (event.key === "Enter") {
                event.preventDefault()
                void saveTitleEdit(conversationId, title)
              } else if (event.key === "Escape") {
                event.preventDefault()
                skipTitleSaveOnBlurRef.current = true
                clearTitleEditing()
              }
            }}
            onBlur={() => {
              if (skipTitleSaveOnBlurRef.current) {
                skipTitleSaveOnBlurRef.current = false
                return
              }
              void saveTitleEdit(conversationId, title)
            }}
            autoFocus
            className={cn(
              "border-input bg-background text-foreground focus-visible:border-ring h-6 w-full rounded border px-1.5 text-xs shadow-sm outline-none ring-0",
              className,
            )}
            aria-label="Rename session title"
          />
        )
      }

      return (
        <span
          className={cn("min-w-0 truncate text-left", className)}
        >
          {prefix ? `${prefix}${title}` : title}
        </span>
      )
    },
    [
      clearTitleEditing,
      editingConversationId,
      editingTitle,
      saveTitleEdit,
      startTitleEditing,
    ],
  )

  const handleHeaderClick = () => {
    // Navigate to sessions view
    logUI("[ActiveAgentsSidebar] Header clicked, navigating to sessions")
    navigate("/")
    // Expand the list if not already expanded
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleSidebarSessionsScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMorePastSessions) return

      const container = e.currentTarget
      const nearBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 32

      if (!nearBottom) return

      setVisiblePastSessionCount((prev) =>
        Math.min(
          Math.max(prev, minimumPastSessionsNeeded) +
            SIDEBAR_PAST_SESSIONS_PAGE_SIZE,
          allPastSessions.length,
        ),
      )
    },
    [allPastSessions.length, hasMorePastSessions, minimumPastSessionsNeeded],
  )

  const hasLaunchControls =
    !!onStartTextSession || !!onStartVoiceSession || !!onStartPromptSession

  return (
    <div className="px-2">
      <div className="flex items-center">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200",
            "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          {hasAnySessions ? (
            <button
              onClick={handleToggleExpand}
              className="hover:text-foreground focus:ring-ring shrink-0 cursor-pointer rounded focus:outline-none focus:ring-1"
              aria-label={isExpanded ? "Collapse sessions" : "Expand sessions"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="h-3.5 w-3.5 shrink-0" />
          )}
          <button
            onClick={handleHeaderClick}
            className="focus:ring-ring flex min-w-0 flex-1 items-center gap-2 rounded focus:outline-none focus:ring-1"
          >
            <span className="i-mingcute-grid-line h-3.5 w-3.5"></span>
            <span className="truncate">Sessions</span>
            {activeSessions.length > 0 && (
              <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                {activeSessions.length}
              </span>
            )}
          </button>
        </div>
        {onOpenPastSessionsDialog && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenPastSessionsDialog()
            }}
            className="text-muted-foreground hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
            title="Past Sessions"
            aria-label="Past Sessions"
          >
            <Clock className="h-4 w-4" />
          </button>
        )}
      </div>

      {isExpanded && hasLaunchControls && (
        <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-2">
          <div className="flex w-full flex-wrap items-center gap-2">
            {onSelectAgent && (
              <div className="min-w-0 flex-1">
                <AgentSelector
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={onSelectAgent}
                  compact
                />
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {onClearInactiveSessions && inactiveSessionCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 shrink-0 rounded-md px-0 shadow-sm"
                  onClick={() => void onClearInactiveSessions()}
                  title={`Clear ${inactiveSessionCount} completed sessions`}
                  aria-label={`Clear ${inactiveSessionCount} completed sessions`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                </Button>
              )}
              {onStartPromptSession && (
                <PredefinedPromptsMenu
                  onSelectPrompt={onStartPromptSession}
                  buttonSize="sm"
                  className="h-8 w-8 rounded-md border border-input bg-background shadow-sm"
                />
              )}
              {onStartVoiceSession && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 shrink-0 rounded-md px-0 shadow-sm"
                  onClick={() => void onStartVoiceSession()}
                  title="Start voice session"
                  aria-label="Start voice session"
                >
                  <Mic className="h-3.5 w-3.5 shrink-0" />
                </Button>
              )}
              {onStartTextSession && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 shrink-0 rounded-md px-0 shadow-sm"
                  onClick={() => void onStartTextSession()}
                  title="Start text session"
                  aria-label="Start text session"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div
          className="mt-1 max-h-[45vh] space-y-0.5 overflow-y-auto pl-2 pr-1 scrollbar-none"
          onScroll={handleSidebarSessionsScroll}
        >
          {sidebarSessions.map(({ session, isPast, key }) => {
            const isFocused = focusedSessionId === session.id
            const isSessionExpanded = expandedSessionId === session.id
            const sessionProgress = agentProgressById.get(session.id)
            const conversationTimestamp =
              sessionProgress?.conversationHistory &&
              sessionProgress.conversationHistory.length > 0
                ? sessionProgress.conversationHistory[
                    sessionProgress.conversationHistory.length - 1
                  ]?.timestamp
                : undefined
            const lastMessageMinutesAgo = formatMinutesAgo(
              getSessionLastMessageTimestamp(session, conversationTimestamp),
            )
            const hasPendingApproval =
              !isPast && !!sessionProgress?.pendingToolApproval
            const progressLifecycleState = session.status === "active"
              ? "running"
              : (sessionProgress?.isComplete ? "complete" : "running")
            const conversationState = sessionProgress?.conversationState
              ? normalizeAgentConversationState(
                  sessionProgress.conversationState,
                  progressLifecycleState,
                )
              : hasPendingApproval
                ? "needs_input"
                : session.status === "error" || session.status === "stopped"
                  ? "blocked"
                  : session.status === "active"
                    ? "running"
                    : "complete"
            // Use store's isSnoozed for active sessions (matches main view), backend for past
            const isSnoozed = isPast
              ? false
              : (sessionProgress?.isSnoozed ?? false)

            if (isPast) {
              const isPinned = session.conversationId
                ? pinnedSessionIds.has(session.conversationId)
                : false
              const pastStatusRailColor =
                session.status === "error" ? "bg-red-500" : "bg-muted-foreground/60"
              return (
                <div
                  key={key}
                  onClick={() => {
                    if (session.conversationId) {
                      logUI(
                        "[ActiveAgentsSidebar] Navigating to sessions view for completed session:",
                        session.conversationId,
                      )
                      navigate(`/${session.conversationId}`)
                    }
                  }}
                  className={cn(
                    "text-muted-foreground group relative flex items-center gap-1.5 rounded px-1.5 py-1 pr-2 text-xs transition-all",
                    session.conversationId &&
                      "hover:bg-accent/50 cursor-pointer",
                  )}
                >
                  <span
                    className={cn(
                      "absolute bottom-1 left-0 top-1 w-0.5 rounded-full",
                      pastStatusRailColor,
                    )}
                  />
                  <div className="min-w-0 flex-1 transition-[padding-right] duration-200 group-hover:pr-20">
                    {renderEditableTitle(session, "flex-1")}
                  </div>
                  {lastMessageMinutesAgo && (
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground group-hover:opacity-0 transition-opacity">
                      {lastMessageMinutesAgo}
                    </span>
                  )}
                  {session.conversationId && (
                    <div
                      className={cn(
                        "bg-background/90 absolute right-1.5 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-sm pl-1 opacity-0 transition-opacity",
                        "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100",
                      )}
                    >
                      <SessionOverflowMenu
                        sessionTitle={
                          session.conversationTitle || "Untitled session"
                        }
                        isPinned={isPinned}
                        canRename={!!session.conversationId}
                        onRename={() =>
                          startTitleEditing(
                            session.conversationId,
                            session.conversationTitle,
                          )
                        }
                        onTogglePin={() =>
                          togglePinSession(session.conversationId!)
                        }
                        onArchive={() =>
                          toggleArchiveSession(session.conversationId!)
                        }
                      />
                    </div>
                  )}
                </div>
              )
            }

            const isVisiblyActive = isSessionExpanded || isFocused || !isSnoozed

            // Active session row
            // Retained completed turns should stay visually active until the user dismisses them.
            const statusRailColor = hasPendingApproval
              ? "bg-amber-500"
              : conversationState === "blocked"
                ? "bg-red-500"
                : isVisiblyActive
                  ? "bg-green-500"
                  : "bg-muted-foreground"

            const isActivePinned = session.conversationId
              ? pinnedSessionIds.has(session.conversationId)
              : false
            const sessionPreview = getSidebarSessionPreview(sessionProgress)

            return (
              <div
                key={key}
                onClick={() => handleSessionClick(session.id)}
                className={cn(
                  "group relative flex cursor-pointer items-start rounded py-1.5 pl-2 pr-2 text-xs transition-all",
                  hasPendingApproval
                    ? "bg-amber-500/10"
                    : isSessionExpanded
                      ? "bg-blue-500/15"
                      : isFocused
                        ? "bg-blue-500/10"
                        : "hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "absolute bottom-1 left-0 top-1 w-0.5 rounded-full",
                    statusRailColor,
                    isVisiblyActive && !hasPendingApproval && "animate-pulse",
                  )}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 transition-[padding-right] duration-200 group-hover:pr-14">
                  <div
                    className="relative z-10 flex min-w-0 items-start"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleSessionClick(session.id)
                    }}
                  >
                    {renderEditableTitle(
                      session,
                      cn(
                        "flex-1 text-[12px] font-medium leading-4",
                        hasPendingApproval
                          ? "text-amber-700 dark:text-amber-300"
                          : !isVisiblyActive
                            ? "text-muted-foreground"
                            : "text-foreground",
                      ),
                      hasPendingApproval ? "⚠ " : undefined,
                    )}
                  </div>
                  {(sessionPreview || lastMessageMinutesAgo) && (
                    <div
                      className={cn(
                        "flex min-w-0 items-center gap-1.5",
                        !sessionPreview && "justify-end",
                      )}
                    >
                      {sessionPreview && (
                        <span
                          className="min-w-0 flex-1 truncate text-[11px] leading-4 text-muted-foreground"
                          title={sessionPreview}
                        >
                          {sessionPreview}
                        </span>
                      )}
                      {lastMessageMinutesAgo && (
                      <span
                        className="shrink-0 text-[10px] tabular-nums text-muted-foreground/80"
                      >
                        {lastMessageMinutesAgo}
                      </span>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "bg-background/90 absolute right-1 top-1/2 z-20 flex -translate-y-1/2 items-center gap-0 rounded-sm pl-1 opacity-0 transition-opacity",
                    "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100",
                  )}
                >
                  {session.conversationId && (
                    <SessionOverflowMenu
                      sessionTitle={
                        session.conversationTitle || "Untitled session"
                      }
                      isPinned={isActivePinned}
                      canRename={!!session.conversationId}
                      onRename={() =>
                        startTitleEditing(
                          session.conversationId,
                          session.conversationTitle,
                        )
                      }
                      onTogglePin={() =>
                        togglePinSession(session.conversationId!)
                      }
                      onArchive={() =>
                        toggleArchiveSession(session.conversationId!)
                      }
                    />
                  )}
                  <button
                    onClick={(e) => handleStopSession(session.id, e)}
                    className="hover:bg-destructive/20 hover:text-destructive shrink-0 rounded p-0.5 transition-all"
                    title="Stop this agent session"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}

          {hasMorePastSessions && (
            <button
              type="button"
              onClick={() =>
                setVisiblePastSessionCount((prev) =>
                  Math.min(
                    Math.max(prev, minimumPastSessionsNeeded) +
                      SIDEBAR_PAST_SESSIONS_PAGE_SIZE,
                    allPastSessions.length,
                  ),
                )
              }
              className="text-muted-foreground hover:bg-accent/50 hover:text-foreground mt-1 w-full rounded px-1.5 py-1 text-left text-[11px] transition-colors"
            >
              Load more sessions
            </button>
          )}
        </div>
      )}
    </div>
  )
}
