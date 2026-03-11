import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import {
  ChevronDown,
  ChevronRight,
  X,
  Minimize2,
  Maximize2,
  Clock,
  Archive,
  Bot,
  Pin,
} from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { useAgentStore } from "@renderer/stores"
import { logUI, logStateChange, logExpand } from "@renderer/lib/debug"
import { useConversationHistoryQuery } from "@renderer/lib/queries"
import { useNavigate } from "react-router-dom"

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

const MIN_VISIBLE_SIDEBAR_SESSIONS = 5
const SIDEBAR_PAST_SESSIONS_PAGE_SIZE = 10

const STORAGE_KEY = "active-agents-sidebar-expanded"

export function ActiveAgentsSidebar({
  onOpenPastSessionsDialog,
}: {
  onOpenPastSessionsDialog?: () => void
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
  const setScrollToSessionId = useAgentStore((s) => s.setScrollToSessionId)
  const setSessionSnoozed = useAgentStore((s) => s.setSessionSnoozed)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)
  const togglePinSession = useAgentStore((s) => s.togglePinSession)
  const [visiblePastSessionCount, setVisiblePastSessionCount] = useState(0)
  const navigate = useNavigate()

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

  const activeSessions = data?.activeSessions || []
  const recentSessions = data?.recentSessions || []
  const conversationHistory =
    (conversationHistoryQuery.data as ConversationHistoryItem[] | undefined) ||
    []

  const allPastSessions = useMemo(() => {
    const items: SidebarSession[] = []
    const seenConversationIds = new Set<string>(
      activeSessions
        .map((session) => session.conversationId)
        .filter((id): id is string => !!id),
    )
    const seenFallbackIds = new Set<string>()

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

  const sidebarSessions = useMemo(() => {
    const activeItems: SidebarSession[] = activeSessions.map((session) => ({
      session,
      isPast: false,
      key: `active:${session.id}`,
    }))

    return [
      ...activeItems,
      ...allPastSessions.slice(0, displayedPastSessionCount),
    ]
  }, [activeSessions, allPastSessions, displayedPastSessionCount])

  const hasMorePastSessions = allPastSessions.length > displayedPastSessionCount

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

  const handleSessionClick = (sessionId: string) => {
    logUI("[ActiveAgentsSidebar] Session clicked:", sessionId)
    // Navigate to sessions page and focus this session
    navigate("/")
    setFocusedSessionId(sessionId)
    // Trigger scroll to the session tile
    setScrollToSessionId(sessionId)
  }

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

  const handleToggleSnooze = async (
    sessionId: string,
    isSnoozed: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation() // Prevent session focus when clicking snooze
    logUI("[ActiveAgentsSidebar] Toggle snooze clicked", {
      sessionId,
      sidebarSaysIsSnoozed: isSnoozed,
      action: isSnoozed ? "unsnooze" : "snooze",
      focusedSessionId,
      allSessions: activeSessions.map((s) => ({
        id: s.id,
        snoozed: s.isSnoozed,
      })),
    })

    if (isSnoozed) {
      // Unsnoozing: restore the session to foreground
      logUI("[ActiveAgentsSidebar] Unsnoozing session")

      // Update local store first so panel shows content immediately
      setSessionSnoozed(sessionId, false)

      // Focus the session
      setFocusedSessionId(sessionId)

      try {
        // Unsnooze the session in backend
        await tipcClient.unsnoozeAgentSession({ sessionId })
      } catch (error) {
        // Rollback local state only when the API call fails to keep UI and backend in sync
        setSessionSnoozed(sessionId, true)
        setFocusedSessionId(null)
        console.error("Failed to unsnooze session:", error)
        return
      }

      // UI updates after successful API call - don't rollback if these fail
      try {
        // Keep panel context synced to the restored session, but do not force-open it.
        await tipcClient.focusAgentSession({ sessionId })
        logUI("[ActiveAgentsSidebar] Session unsnoozed and focused")
      } catch (error) {
        // Log UI errors but don't rollback - the backend state is already updated
        console.error("Failed to update UI after unsnooze:", error)
      }
    } else {
      // Snoozing: move session to background
      logUI("[ActiveAgentsSidebar] Snoozing session")
      // Update local store first
      setSessionSnoozed(sessionId, true)

      try {
        await tipcClient.snoozeAgentSession({ sessionId })
      } catch (error) {
        // Rollback local state only when the API call fails to keep UI and backend in sync
        setSessionSnoozed(sessionId, false)
        console.error("Failed to snooze session:", error)
        return
      }

      // UI updates after successful API call - don't rollback if these fail
      try {
        // Unfocus if this was the focused session
        if (focusedSessionId === sessionId) {
          setFocusedSessionId(null)
        }
        // Hide the panel window
        await tipcClient.hidePanelWindow({})
        logUI(
          "[ActiveAgentsSidebar] Session snoozed, unfocused, and panel hidden",
        )
      } catch (error) {
        // Log UI errors but don't rollback - the backend state is already updated
        console.error("Failed to update UI after snooze:", error)
      }
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

  return (
    <div className="px-2">
      <div
        className={cn(
          "w-full rounded-md px-2 py-1.5 text-sm font-medium",
          "text-muted-foreground",
        )}
      >
        <div className="hover:bg-accent/50 hover:text-foreground flex items-center gap-2 rounded-md px-0 py-1 transition-all duration-200">
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
          {onOpenPastSessionsDialog && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenPastSessionsDialog()
              }}
              className="hover:bg-accent/50 text-muted-foreground hover:text-foreground shrink-0 rounded p-1"
              title="Past Sessions"
              aria-label="Past Sessions"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div
          className="mt-1 max-h-[45vh] space-y-0.5 overflow-y-auto pl-2 pr-1"
          onScroll={handleSidebarSessionsScroll}
        >
          {sidebarSessions.map(({ session, isPast, key }) => {
            const isFocused = focusedSessionId === session.id
            const sessionProgress = agentProgressById.get(session.id)
            const hasPendingApproval =
              !isPast && !!sessionProgress?.pendingToolApproval
            // Use store's isSnoozed for active sessions (matches main view), backend for past
            const isSnoozed = isPast
              ? false
              : (sessionProgress?.isSnoozed ?? session.isSnoozed ?? false)

            if (isPast) {
              const isPinned = session.conversationId ? pinnedSessionIds.has(session.conversationId) : false
              // Past agent row — archive icon with pin action
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
                    "group text-muted-foreground flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-all",
                    session.conversationId &&
                      "hover:bg-accent/50 cursor-pointer",
                  )}
                >
                  {/* Archive or pinned icon for past agents */}
                  {isPinned ? (
                    <Pin className="h-3 w-3 shrink-0 fill-current text-foreground" />
                  ) : (
                    <Archive className="h-3 w-3 shrink-0 opacity-50" />
                  )}
                  <p className="flex-1 truncate">
                    {session.conversationTitle || "Untitled session"}
                  </p>
                  {session.conversationId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (session.conversationId) {
                          togglePinSession(session.conversationId)
                        }
                      }}
                      className={cn(
                        "shrink-0 rounded p-0.5 hover:bg-accent transition-all",
                        isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      )}
                      title={isPinned ? "Unpin session" : "Pin session"}
                      aria-label={`${isPinned ? "Unpin" : "Pin"} ${session.conversationTitle || "Untitled session"}`}
                      aria-pressed={isPinned}
                    >
                      <Pin className={cn("h-3 w-3", isPinned && "fill-current text-foreground")} />
                    </button>
                  )}
                </div>
              )
            }

            // Active session row
            // Status colors: amber for pending approval, blue for active, gray for snoozed
            const statusDotColor = hasPendingApproval
              ? "bg-amber-500"
              : isSnoozed
                ? "bg-muted-foreground"
                : "bg-blue-500"

            // Get agent/profile name from progress data
            const agentName = sessionProgress?.profileName

            return (
              <div
                key={key}
                onClick={() => handleSessionClick(session.id)}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-all",
                  hasPendingApproval
                    ? "bg-amber-500/10"
                    : isFocused
                      ? "bg-blue-500/10"
                      : "hover:bg-accent/50",
                )}
              >
                {/* Status dot */}
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    statusDotColor,
                    !isSnoozed && !hasPendingApproval && "animate-pulse",
                  )}
                />
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <p
                    className={cn(
                      "truncate",
                      hasPendingApproval
                        ? "text-amber-700 dark:text-amber-300"
                        : isSnoozed
                          ? "text-muted-foreground"
                          : "text-foreground",
                    )}
                  >
                    {hasPendingApproval
                      ? `⚠ ${session.conversationTitle}`
                      : session.conversationTitle}
                  </p>
                  {/* Agent name indicator */}
                  {agentName && (
                    <span
                      className="flex items-center gap-0.5 text-[10px] text-primary/60 truncate"
                      title={`Agent: ${agentName}`}
                    >
                      <Bot className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{agentName}</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleToggleSnooze(session.id, isSnoozed, e)}
                  className={cn(
                    "hover:bg-accent hover:text-foreground shrink-0 rounded p-0.5 opacity-0 transition-all group-hover:opacity-100",
                    isFocused && "opacity-100",
                  )}
                  title={
                    isSnoozed
                      ? "Restore"
                      : "Minimize - run in background"
                  }
                >
                  {isSnoozed ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={(e) => handleStopSession(session.id, e)}
                  className={cn(
                    "hover:bg-destructive/20 hover:text-destructive shrink-0 rounded p-0.5 opacity-0 transition-all group-hover:opacity-100",
                    isFocused && "opacity-100",
                  )}
                  title="Stop this agent session"
                >
                  <X className="h-3 w-3" />
                </button>
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
