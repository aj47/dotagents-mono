import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pin,
  X,
  Clock,
  CornerDownRight,
  Mic,
  Plus,
} from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { useAgentStore } from "@renderer/stores"
import { logUI, logStateChange, logExpand } from "@renderer/lib/debug"
import { useSavedConversationsQuery } from "@renderer/lib/queries"
import { formatRepeatTaskTitle } from "@shared/repeat-tasks"
import {
  dedupeTaskEntriesByTitle,
  filterPastSessionsAgainstActiveSessions,
  getSessionIdsWithActiveChildProgress,
  getSubagentParentSessionIdMap,
  hasUnreadAgentResponse,
  isSidebarSessionCurrentlyViewed,
  nestSubagentSessionEntries,
  orderActiveSessionsByPinnedFirst,
  paginateSidebarEntries,
  partitionPinnedAndUnpinnedTaskEntries,
  partitionTaskAndUserEntries,
} from "@renderer/lib/sidebar-sessions"
import { useLocation, useNavigate } from "react-router-dom"
import { AgentSelector } from "./agent-selector"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import { Button } from "./ui/button"
import type { AgentProgressUpdate, LoopConfig } from "@shared/types"
import { getSidebarStatusPresentation } from "@renderer/lib/session-presentation"

interface SidebarSessionRecord {
  id: string
  conversationId?: string
  parentSessionId?: string | null
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  currentIteration?: number
  maxIterations?: number
  lastActivity?: string
  errorMessage?: string
  isSnoozed?: boolean
  isRepeatTask?: boolean
}

interface SidebarSessionsResponse {
  activeSessions: SidebarSessionRecord[]
  recentCompletedSessions?: SidebarSessionRecord[]
  recentSessions?: SidebarSessionRecord[]
}

interface ConversationHistoryItem {
  id: string
  title: string
  updatedAt: number
}

interface SidebarSessionEntry {
  session: SidebarSessionRecord
  isSavedConversation: boolean
  key: string
  isSubagent?: boolean
  nestingDepth?: number
}

const TASK_NAME_CONNECTOR_WORDS = new Set(["a", "an", "and", "for", "of", "the", "to"])

function toTitleCaseTaskName(value: string, options: { dropConnectorWords?: boolean } = {}): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => !options.dropConnectorWords || !TASK_NAME_CONNECTOR_WORDS.has(word.toLowerCase()))
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}

function getFirstMarkdownHeading(value: string): string | null {
  const heading = value
    .split(/\r?\n/u)
    .map((line) => line.match(/^#\s+(.+)$/u)?.[1]?.trim())
    .find((line): line is string => !!line)
  return heading ?? null
}

function getRepeatTaskTitleHints(task: LoopConfig): string[] {
  const hints = new Set<string>()
  const addHint = (value?: string | null) => {
    const trimmed = value?.trim()
    if (trimmed) hints.add(trimmed)
  }

  addHint(task.name)
  addHint(formatRepeatTaskTitle(task.name))
  addHint(toTitleCaseTaskName(task.name))
  addHint(toTitleCaseTaskName(task.name, { dropConnectorWords: true }))

  const firstHeading = getFirstMarkdownHeading(task.prompt)
  addHint(firstHeading)
  addHint(firstHeading ? `${firstHeading} Run` : null)

  return Array.from(hints)
}

function getSessionLastMessageTimestamp(
  session: SidebarSessionRecord,
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

function isAnalyzingOrPlanningProgress(progress?: AgentProgressUpdate | null): boolean {
  if (!progress || progress.isComplete) return false

  const latestStep = progress.steps?.[progress.steps.length - 1]
  if (!latestStep || latestStep.status !== "in_progress") return false

  const activeStepText = `${latestStep.title ?? ""} ${latestStep.description ?? ""}`.toLowerCase()
  return activeStepText.includes("analyzing") || activeStepText.includes("planning")
}

const MIN_VISIBLE_SIDEBAR_SESSIONS = 8
const SIDEBAR_PAST_SESSIONS_PAGE_SIZE = 10

const IS_MAC = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")
const SHORTCUT_MOD_SYMBOL = IS_MAC ? "⌘" : "Ctrl"

const STORAGE_KEY = "active-agents-sidebar-expanded"
const TASKS_SECTION_EXPANDED_STORAGE_KEY = "sidebar-tasks-section-expanded"

function readBooleanFromStorage(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    return stored === "true"
  } catch {
    return fallback
  }
}

function writeBooleanToStorage(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // localStorage may be unavailable; ignore.
  }
}

function ArchiveSessionButton({
  sessionTitle,
  onArchive,
}: {
  sessionTitle: string
  onArchive: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onArchive()
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all hover:bg-destructive/20 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      aria-label={`Archive ${sessionTitle}`}
      title="Archive session"
    >
      <X className="h-3 w-3" />
    </button>
  )
}

export function ActiveAgentsSidebar({
  onOpenSavedConversationsDialog,
  selectedAgentId = null,
  onSelectAgent,
  onStartTextSession,
  onStartVoiceSession,
  onStartPromptSession,
  inactiveSessionCount = 0,
  onClearInactiveSessions,
  className,
}: {
  onOpenSavedConversationsDialog?: () => void
  selectedAgentId?: string | null
  onSelectAgent?: (id: string | null) => void
  onStartTextSession?: () => void | Promise<void>
  onStartVoiceSession?: () => void | Promise<void>
  onStartPromptSession?: (content: string) => void | Promise<void>
  inactiveSessionCount?: number
  onClearInactiveSessions?: () => void | Promise<void>
  className?: string
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
  // Default the Tasks subsection to collapsed so user sessions stay
  // foregrounded; respect remembered state once the user has toggled it.
  const [tasksSectionExpanded, setTasksSectionExpanded] = useState(() =>
    readBooleanFromStorage(TASKS_SECTION_EXPANDED_STORAGE_KEY, false),
  )

  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const expandedSessionId = useAgentStore((s) => s.expandedSessionId)
  const setExpandedSessionId = useAgentStore((s) => s.setExpandedSessionId)
  const viewedConversationId = useAgentStore((s) => s.viewedConversationId)
  const setViewedConversationId = useAgentStore((s) => s.setViewedConversationId)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const agentResponseReadAtBySessionId = useAgentStore(
    (s) => s.agentResponseReadAtBySessionId,
  )
  const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)
  const archivedSessionIds = useAgentStore((s) => s.archivedSessionIds)
  const toggleArchiveSession = useAgentStore((s) => s.toggleArchiveSession)
  const [visibleSavedConversationCount, setVisibleSavedConversationCount] = useState(0)
  const [visibleTaskConversationCount, setVisibleTaskConversationCount] = useState(
    SIDEBAR_PAST_SESSIONS_PAGE_SIZE,
  )
  const navigate = useNavigate()
  const location = useLocation()

  const { data, refetch } = useQuery<SidebarSessionsResponse>({
    queryKey: ["agentSessions"],
    queryFn: async () => {
      return await tipcClient.getAgentSessions()
    },
  })
  const savedConversationsQuery = useSavedConversationsQuery(isExpanded)
  const repeatTasksQuery = useQuery<LoopConfig[]>({
    queryKey: ["loops"],
    queryFn: async () => await tipcClient.getLoops(),
    enabled: isExpanded,
  })

  useEffect(() => {
    const unlisten = rendererHandlers.agentSessionsUpdated.listen(
      (updatedData) => {
        refetch()
      },
    )
    return unlisten
  }, [refetch])

  const trackedActiveSessions = data?.activeSessions || []
  const recentCompletedSessions =
    data?.recentCompletedSessions || data?.recentSessions || []
  const conversationHistory =
    (savedConversationsQuery.data as ConversationHistoryItem[] | undefined) ||
    []

  const activeSessions = useMemo<SidebarSessionRecord[]>(() => {
    const subagentParentSessionIds = getSubagentParentSessionIdMap(
      agentProgressById.entries(),
    )
    const mergedSessions = new Map(
      trackedActiveSessions.map((session) => [session.id, session] as const),
    )

    for (const [sessionId, progress] of agentProgressById.entries()) {
      // Keep errored and user-stopped sessions visible in the sidebar so the
      // user can still see their final state until they explicitly dismiss
      // them (see issue #302). Previously these were filtered out, which
      // made the kill switch appear to silently jump focus elsewhere.

      const existingSession = mergedSessions.get(sessionId)
      const firstHistoryTimestamp = progress.conversationHistory?.[0]?.timestamp
      const lastHistoryTimestamp = progress.conversationHistory?.[
        progress.conversationHistory.length - 1
      ]?.timestamp

      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId: progress.conversationId ?? existingSession?.conversationId,
        parentSessionId:
          progress.parentSessionId ??
          subagentParentSessionIds.get(sessionId) ??
          existingSession?.parentSessionId,
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
        isRepeatTask: existingSession?.isRepeatTask,
      })
    }

    for (const [childSessionId, parentSessionId] of subagentParentSessionIds) {
      const session = mergedSessions.get(childSessionId)
      if (!session || session.parentSessionId) continue
      mergedSessions.set(childSessionId, {
        ...session,
        parentSessionId,
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
  }, [trackedActiveSessions, agentProgressById])

  const sessionsWithActiveChildProgress = useMemo(
    () => getSessionIdsWithActiveChildProgress(agentProgressById.entries()),
    [agentProgressById],
  )

  const savedConversationEntries = useMemo(() => {
    const items: SidebarSessionEntry[] = []
    const seenConversationIds = new Set<string>(
      activeSessions
        .map((session) => session.conversationId)
        .filter((id): id is string => !!id),
    )
    const seenFallbackIds = new Set<string>(
      activeSessions.map((session) => session.id),
    )

    const addSavedConversationEntry = (session: SidebarSessionRecord, keyPrefix: string) => {
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
        isSavedConversation: true,
        key: `${keyPrefix}:${session.id}`,
      })
    }

    // Collect recently finished runtime sessions first.
    for (const session of recentCompletedSessions) {
      addSavedConversationEntry(session, "recent")
    }

    // Fill the remainder from persisted conversation history.
    for (const historyItem of conversationHistory) {
      const mappedSession: SidebarSessionRecord = {
        id: historyItem.id,
        conversationId: historyItem.id,
        conversationTitle: historyItem.title || "Untitled conversation",
        status: "completed",
        startTime: historyItem.updatedAt,
        endTime: historyItem.updatedAt,
      }
      addSavedConversationEntry(mappedSession, "history")
    }

    // Sort saved conversations by most recent first so newly updated
    // conversations always appear at the top regardless of source.
    items.sort((a, b) => {
      const aTime = Math.max(a.session.endTime ?? 0, a.session.startTime ?? 0)
      const bTime = Math.max(b.session.endTime ?? 0, b.session.startTime ?? 0)
      return bTime - aTime
    })

    return items
  }, [activeSessions, conversationHistory, recentCompletedSessions])

  const sidebarSessions = useMemo(() => {
    const orderedActiveSessions = orderActiveSessionsByPinnedFirst<SidebarSessionRecord>(
      activeSessions,
      pinnedSessionIds,
    )
    const activeItems: SidebarSessionEntry[] = nestSubagentSessionEntries(
      orderedActiveSessions.map((session) => ({
        session,
        isSavedConversation: false,
        key: `active:${session.id}`,
      })),
    )
    const dedupedSavedConversations =
      filterPastSessionsAgainstActiveSessions<SidebarSessionEntry>(
        savedConversationEntries,
        orderedActiveSessions,
      ).filter((item) => {
        const cid = item.session.conversationId
        return !cid || !archivedSessionIds.has(cid)
      })

    // Keep pinned saved conversations before unpinned history; each group applies
    // its own pagination after task/user partitioning.
    const pinnedSavedConversations: SidebarSessionEntry[] = []
    const unpinnedSavedConversations: SidebarSessionEntry[] = []
    for (const item of dedupedSavedConversations) {
      const cid = item.session.conversationId
      if (cid && pinnedSessionIds.has(cid)) {
        pinnedSavedConversations.push(item)
      } else {
        unpinnedSavedConversations.push(item)
      }
    }

    return [
      ...activeItems,
      ...pinnedSavedConversations,
      ...unpinnedSavedConversations,
    ]
  }, [
    activeSessions,
    savedConversationEntries,
    pinnedSessionIds,
    archivedSessionIds,
  ])

  const {
    userSidebarSessions: allUserSidebarSessions,
    pinnedTaskSidebarSessions,
    unpinnedTaskSidebarSessions,
  } = useMemo(() => {
    const repeatTaskTitleHints = new Set(
      (repeatTasksQuery.data ?? []).flatMap(getRepeatTaskTitleHints),
    )
    const { userEntries, taskEntries } = partitionTaskAndUserEntries(
      sidebarSessions,
      repeatTaskTitleHints,
    )
    const dedupedTaskEntries = dedupeTaskEntriesByTitle(taskEntries)
    const { pinnedTaskEntries, unpinnedTaskEntries } =
      partitionPinnedAndUnpinnedTaskEntries(dedupedTaskEntries, pinnedSessionIds)
    return {
      userSidebarSessions: userEntries,
      pinnedTaskSidebarSessions: pinnedTaskEntries,
      unpinnedTaskSidebarSessions: unpinnedTaskEntries,
    }
  }, [sidebarSessions, pinnedSessionIds, repeatTasksQuery.data])

  const activeUserSidebarSessionCount = useMemo(
    () => allUserSidebarSessions.filter((entry) => !entry.isSavedConversation).length,
    [allUserSidebarSessions],
  )

  const minimumSavedConversationRowsNeeded = useMemo(
    () => Math.max(MIN_VISIBLE_SIDEBAR_SESSIONS - activeUserSidebarSessionCount, 0),
    [activeUserSidebarSessionCount],
  )

  const displayedSavedConversationCount = Math.max(
    visibleSavedConversationCount,
    minimumSavedConversationRowsNeeded,
  )

  const {
    visibleEntries: userSidebarSessions,
    hasMoreEntries: hasMoreSavedConversations,
  } = useMemo(
    () => paginateSidebarEntries(
      allUserSidebarSessions,
      pinnedSessionIds,
      displayedSavedConversationCount,
    ),
    [allUserSidebarSessions, displayedSavedConversationCount, pinnedSessionIds],
  )

  const taskSidebarSessions = useMemo(
    () => [
      ...pinnedTaskSidebarSessions,
      ...unpinnedTaskSidebarSessions,
    ],
    [pinnedTaskSidebarSessions, unpinnedTaskSidebarSessions],
  )
  const {
    visibleEntries: paginatedTaskSidebarSessions,
    hasMoreEntries: hasMoreTaskSessions,
  } = useMemo(
    () => paginateSidebarEntries(
      taskSidebarSessions,
      pinnedSessionIds,
      visibleTaskConversationCount,
    ),
    [pinnedSessionIds, taskSidebarSessions, visibleTaskConversationCount],
  )
  const activeTaskSidebarSessions = useMemo(
    () => taskSidebarSessions.filter((entry) => {
      const progress = agentProgressById.get(entry.session.id)
      return (
        !entry.isSavedConversation &&
        entry.session.status === "active" &&
        progress?.isComplete !== true
      )
    }),
    [agentProgressById, taskSidebarSessions],
  )
  const visibleTaskSidebarSessions = useMemo(
    () => tasksSectionExpanded ? paginatedTaskSidebarSessions : activeTaskSidebarSessions,
    [activeTaskSidebarSessions, paginatedTaskSidebarSessions, tasksSectionExpanded],
  )
  const hasTaskSessions = taskSidebarSessions.length > 0
  const tasksListVisible = visibleTaskSidebarSessions.length > 0

  // Hotkeys (Cmd/Ctrl+1..9) target only entries that are currently rendered,
  // in the same order as they appear: visible task rows → user sessions.
  // Running task rows remain visible even when historical task rows are collapsed.
  const visibleSidebarSessions = useMemo(
    () => [
      ...visibleTaskSidebarSessions,
      ...userSidebarSessions,
    ],
    [
      visibleTaskSidebarSessions,
      userSidebarSessions,
    ],
  )

  const hasAnySessions = sidebarSessions.length > 0

  useEffect(() => {
    setVisibleSavedConversationCount((prev) =>
      Math.max(prev, minimumSavedConversationRowsNeeded),
    )
  }, [minimumSavedConversationRowsNeeded])

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

  useEffect(() => {
    writeBooleanToStorage(TASKS_SECTION_EXPANDED_STORAGE_KEY, tasksSectionExpanded)
  }, [tasksSectionExpanded])

  const handleActiveSessionSelect = useCallback((sessionId: string) => {
    logUI("[ActiveAgentsSidebar] Active session selected:", sessionId)
    // Clear the saved-conversation view so no stale row stays highlighted.
    setViewedConversationId(null)
    // Navigate to the sessions page and focus this live session.
    navigate("/", { state: { clearPendingConversation: true } })
    setFocusedSessionId(sessionId)
    setExpandedSessionId(sessionId)
  }, [navigate, setFocusedSessionId, setExpandedSessionId, setViewedConversationId])

  const handleSavedConversationOpen = useCallback((conversationId: string) => {
    logUI(
      "[ActiveAgentsSidebar] Opening saved conversation:",
      conversationId,
    )
    // Clear active-session focus so the saved conversation becomes the selected item.
    setFocusedSessionId(null)
    setExpandedSessionId(null)
    setViewedConversationId(conversationId)
    navigate(`/${conversationId}`)
  }, [navigate, setFocusedSessionId, setExpandedSessionId, setViewedConversationId])

  const isSessionsRoute =
    location.pathname === "/" ||
    (!location.pathname.startsWith("/settings") &&
      !location.pathname.startsWith("/onboarding") &&
      !location.pathname.startsWith("/setup") &&
      !location.pathname.startsWith("/panel") &&
      !location.pathname.startsWith("/knowledge"))

  // Keyboard shortcuts: Cmd/Ctrl+1..9 to jump to the Nth sidebar session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      const digit = parseInt(e.key, 10)
      if (isNaN(digit) || digit < 1 || digit > 9) return

      const index = digit - 1
      const target = visibleSidebarSessions[index]
      if (!target) return

      e.preventDefault()
      e.stopPropagation()

      const { session, isSavedConversation } = target
      if (isSavedConversation) {
        if (session.conversationId) {
          logUI("[ActiveAgentsSidebar] Hotkey jump to saved conversation:", session.conversationId)
          handleSavedConversationOpen(session.conversationId)
        }
      } else {
        logUI("[ActiveAgentsSidebar] Hotkey jump to active session:", session.id)
        handleActiveSessionSelect(session.id)
      }

      // Focus the composer textarea after React re-renders
      requestAnimationFrame(() => {
        setTimeout(() => {
          const composer =
            document.querySelector<HTMLTextAreaElement>('textarea[data-composer="true"]') ??
            document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="follow-up"]') ??
            document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="message"]')
          composer?.focus()
        }, 100)
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [visibleSidebarSessions, handleSavedConversationOpen, handleActiveSessionSelect])

  const handleStopSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session focus when clicking stop
    logUI("[ActiveAgentsSidebar] Stopping session:", sessionId)
    const sessionProgress = agentProgressById.get(sessionId)
    if (!sessionProgress?.isComplete) {
      try {
        await tipcClient.stopAgentSession({ sessionId })
      } catch (error) {
        console.error("Failed to stop session:", error)
      }
    }
    if (focusedSessionId === sessionId) {
      setFocusedSessionId(null)
    }
    try {
      await tipcClient.clearAgentSessionProgress({ sessionId })
    } catch (error) {
      console.error("Failed to dismiss session:", error)
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

  const renderEditableTitle = useCallback(
    (session: SidebarSessionRecord, className: string, prefix?: string) => {
      const title = session.conversationTitle || "Untitled conversation"

      return (
        <span
          className={cn("min-w-0 truncate text-left", className)}
        >
          {prefix ? `${prefix}${title}` : title}
        </span>
      )
    },
    [],
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

  const loadMoreSavedConversations = useCallback(() => {
    setVisibleSavedConversationCount((prev) =>
      Math.max(prev, minimumSavedConversationRowsNeeded) +
        SIDEBAR_PAST_SESSIONS_PAGE_SIZE,
    )
  }, [minimumSavedConversationRowsNeeded])

  const loadMoreTaskConversations = useCallback(() => {
    setVisibleTaskConversationCount((prev) =>
      prev + SIDEBAR_PAST_SESSIONS_PAGE_SIZE,
    )
  }, [])

  const handleSidebarSessionsScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMoreSavedConversations) return

      const container = e.currentTarget
      const nearBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 32

      if (!nearBottom) return

      loadMoreSavedConversations()
    },
    [hasMoreSavedConversations, loadMoreSavedConversations],
  )

  const hasLaunchControls =
    !!onStartTextSession || !!onStartVoiceSession || !!onStartPromptSession

  return (
    <div className={cn("flex min-h-0 flex-col px-2", className)}>
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
        {onOpenSavedConversationsDialog && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenSavedConversationsDialog()
            }}
            className="text-muted-foreground hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
            title="Saved conversations"
            aria-label="Saved conversations"
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
          className="mt-1 space-y-0.5 overflow-visible pl-2 pr-1"
          onScroll={handleSidebarSessionsScroll}
        >
          {(() => {
            const renderSessionRow = (
              {
                session,
                isSavedConversation,
                key,
                isSubagent = false,
                nestingDepth = 0,
              }: SidebarSessionEntry,
              index: number,
              options: { forceSingleLine?: boolean } = {},
            ) => {
            const forceSingleLine = options.forceSingleLine ?? false
            const isFocused = focusedSessionId === session.id
            const isSessionExpanded = expandedSessionId === session.id
            const isCurrentView = isSidebarSessionCurrentlyViewed(session, {
              isPast: isSavedConversation,
              focusedSessionId,
              expandedSessionId,
              viewedConversationId: isSessionsRoute ? viewedConversationId : null,
            })
            const sessionProgress = agentProgressById.get(session.id)
            const hasUnreadResponse = hasUnreadAgentResponse(
              sessionProgress,
              agentResponseReadAtBySessionId.get(session.id),
              isCurrentView,
            )
            const hasAnalyzingOrPlanningProgress =
              isAnalyzingOrPlanningProgress(sessionProgress)
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
              !isSavedConversation && !!sessionProgress?.pendingToolApproval
            const hasActiveChildProgress = sessionsWithActiveChildProgress.has(
              session.id,
            )
            const progressLifecycleState =
              session.status === "active" || hasActiveChildProgress
                ? "running"
                : (sessionProgress?.isComplete ? "complete" : "running")
            // Use store state for live sessions; saved conversations never snooze.
            const isSnoozed = isSavedConversation
              ? false
              : (sessionProgress?.isSnoozed ?? false)
            const hasProgressErrors = !!sessionProgress?.steps?.some(
              (step) => step.status === "error" || step.toolResult?.error,
            )
            const sidebarStatusPresentation = getSidebarStatusPresentation({
              conversationState: sessionProgress?.conversationState ?? progressLifecycleState,
              isComplete: sessionProgress?.isComplete,
              pendingToolApproval: hasPendingApproval,
              hasErrors: hasProgressErrors,
              sessionStatus: session.status,
              isSnoozed,
              isCurrentView,
              isFocused,
              isSessionExpanded,
              hasActiveChildProgress,
              hasUnreadResponse,
              hasAnalyzingOrPlanningProgress,
            })

            if (isSavedConversation) {
              const isPinned = session.conversationId
                ? pinnedSessionIds.has(session.conversationId)
                : false
              const pastStatusRailColor =
                session.status === "error"
                  ? "bg-red-500"
                  : isCurrentView
                    ? "bg-blue-500"
                    : "bg-muted-foreground/60"
              return (
                <div
                  key={key}
                  onClick={() => {
                    if (session.conversationId) {
                      handleSavedConversationOpen(session.conversationId)
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded px-1.5 py-1 pr-2 text-xs transition-all",
                    isCurrentView
                      ? "bg-blue-500/10 text-foreground ring-1 ring-inset ring-blue-500/20"
                      : "text-muted-foreground",
                    session.conversationId &&
                      "hover:bg-accent/50 cursor-pointer",
                  )}
                >
                  {isPinned ? (
                    <Pin
                      className={cn(
                        "absolute left-0.5 top-1/2 -translate-y-1/2 h-3 w-3 -rotate-45",
                        session.status === "error"
                          ? "text-red-500"
                          : isCurrentView
                            ? "text-blue-500"
                            : "text-muted-foreground/60",
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "absolute bottom-1 left-0 top-1 w-0.5 rounded-full",
                        pastStatusRailColor,
                      )}
                    />
                  )}
                  <div className={cn("min-w-0 flex-1 overflow-hidden transition-[padding-right] duration-200 group-hover:pr-7", isPinned && "pl-3")}>
                    {renderEditableTitle(
                      session,
                      cn("block flex-1", isCurrentView && "text-foreground"),
                    )}
                  </div>
                  {lastMessageMinutesAgo && (
                    <span className={cn(
                      "shrink-0 text-[10px] tabular-nums transition-opacity group-hover:opacity-0",
                      isCurrentView ? "text-foreground/70" : "text-muted-foreground",
                    )}>
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
                      <ArchiveSessionButton
                        sessionTitle={
                          session.conversationTitle || "Untitled conversation"
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

            // Active session row
            // Retained completed turns should stay visually active until the user dismisses them.
            const statusRailColor = sidebarStatusPresentation.railClassName
            const shouldPulseStatus = sidebarStatusPresentation.shouldPulse
            const isLifecycleNeedsInput = sidebarStatusPresentation.lifecycleState === "needs_input"
            const isForegroundSidebarStatus = sidebarStatusPresentation.isForeground

            const isActivePinned = session.conversationId
              ? pinnedSessionIds.has(session.conversationId)
              : false
            const sessionPreview = getSidebarSessionPreview(sessionProgress)
            const normalizedNestingDepth = Math.max(
              0,
              Math.min(nestingDepth, 2),
            )
            const isNestedSubagent = isSubagent && normalizedNestingDepth > 0
            const subagentIndentClass = normalizedNestingDepth > 1 ? "ml-12" : "ml-8"
            const showSessionDetails =
              !forceSingleLine &&
              !isNestedSubagent &&
              (sessionPreview || lastMessageMinutesAgo)

            return (
              <div
                key={key}
                onClick={() => handleActiveSessionSelect(session.id)}
                className={cn(
                  "group relative flex cursor-pointer items-start rounded text-xs transition-all",
                  isNestedSubagent
                    ? cn(subagentIndentClass, "rounded-sm py-0.5 pl-0 pr-1")
                    : "py-1.5 pl-2 pr-2",
                  isNestedSubagent
                    ? isLifecycleNeedsInput
                      ? "text-amber-700 hover:bg-amber-500/5 dark:text-amber-300"
                      : isCurrentView
                        ? "bg-muted/25 text-foreground"
                        : "text-muted-foreground hover:bg-muted/20"
                    : isLifecycleNeedsInput
                      ? "bg-amber-500/10"
                      : isCurrentView
                        ? "bg-blue-500/15 ring-1 ring-inset ring-blue-500/20"
                        : isSessionExpanded
                          ? "bg-blue-500/15"
                          : isFocused
                            ? "bg-blue-500/10"
                            : "hover:bg-accent/50",
                )}
              >
                {isNestedSubagent && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-6 top-0 h-1/2 w-6 rounded-bl border-b border-l border-border/70"
                  />
                )}
                {!isNestedSubagent && isActivePinned ? (
                  <Pin
                    className={cn(
                      "absolute left-0.5 top-2 h-3 w-3 -rotate-45",
                      sidebarStatusPresentation.pinnedIconClassName,
                      shouldPulseStatus && "animate-pulse",
                    )}
                  />
                ) : !isNestedSubagent ? (
                  <span
                    className={cn(
                      "absolute bottom-1 left-0 top-1 w-0.5 rounded-full",
                      statusRailColor,
                      shouldPulseStatus && "animate-pulse",
                    )}
                  />
                ) : null}
                <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding-right] duration-200 group-hover:pr-7", isNestedSubagent ? "gap-0" : "gap-0.5", isActivePinned && !isNestedSubagent && "pl-2.5")}>
                  <div
                    className="relative z-10 flex min-w-0 items-start gap-1.5"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleActiveSessionSelect(session.id)
                    }}
                  >
                    {isNestedSubagent && (
                      <CornerDownRight
                        aria-hidden="true"
                        className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60"
                      />
                    )}
                    {isNestedSubagent && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full",
                          statusRailColor,
                          shouldPulseStatus && "animate-pulse",
                        )}
                      />
                    )}
                    {renderEditableTitle(
                      session,
                      cn(
                        isNestedSubagent
                          ? "flex-1 text-[10.5px] font-normal leading-4"
                          : "flex-1 text-[12px] font-medium leading-4",
                        isNestedSubagent
                          ? isLifecycleNeedsInput
                            ? "text-amber-700 dark:text-amber-300"
                            : isCurrentView || isForegroundSidebarStatus
                              ? "text-foreground"
                              : "text-muted-foreground"
                          : isLifecycleNeedsInput
                            ? "text-amber-700 dark:text-amber-300"
                            : isForegroundSidebarStatus
                              ? "text-foreground"
                              : sidebarStatusPresentation.intent === "background"
                                ? "text-muted-foreground"
                                : "text-foreground",
                      ),
                      isLifecycleNeedsInput ? "⚠ " : undefined,
                    )}
                    {isNestedSubagent && lastMessageMinutesAgo && (
                      <span className="shrink-0 text-[10px] leading-4 tabular-nums text-muted-foreground/60 transition-opacity group-hover:opacity-0">
                        {lastMessageMinutesAgo}
                      </span>
                    )}
                    {!isNestedSubagent && index < 9 && (sessionPreview || lastMessageMinutesAgo) && (
                      <span
                        className="shrink-0 text-[10px] leading-4 tabular-nums text-muted-foreground/60 transition-opacity group-hover:opacity-0"
                        title={`${IS_MAC ? "⌘" : "Ctrl+"}${index + 1} to focus this session`}
                        aria-hidden="true"
                      >
                        {SHORTCUT_MOD_SYMBOL}{IS_MAC ? "" : "+"}{index + 1}
                      </span>
                    )}
                  </div>
                  {showSessionDetails && (
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
                  <button
                    onClick={(e) => handleStopSession(session.id, e)}
                    className="flex h-5 w-5 items-center justify-center hover:bg-destructive/20 hover:text-destructive shrink-0 rounded transition-all"
                    title="Stop this agent session"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
            }

            // Hotkey ordering must mirror render ordering exactly; see
            // visibleSidebarSessions above.
            const tasksOffset = 0
            const userOffset = visibleTaskSidebarSessions.length

            return (
              <>
                {hasTaskSessions && (
                  <div className="mt-1 flex items-center gap-1 px-1.5 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    <button
                      type="button"
                      onClick={() => setTasksSectionExpanded((v) => !v)}
                      className="hover:text-foreground focus:ring-ring flex shrink-0 items-center rounded focus:outline-none focus:ring-1"
                      aria-label={tasksSectionExpanded ? "Collapse tasks" : "Expand tasks"}
                      aria-expanded={tasksSectionExpanded}
                    >
                      {tasksSectionExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                    <span className="select-none">Tasks</span>
                    <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-px text-[9px] font-medium leading-none text-muted-foreground">
                      {taskSidebarSessions.length}
                    </span>
                  </div>
                )}
                {tasksListVisible &&
                  visibleTaskSidebarSessions.map((entry, idx) =>
                    renderSessionRow(entry, tasksOffset + idx, { forceSingleLine: true }),
                  )}
                {tasksSectionExpanded && hasMoreTaskSessions && (
                  <button
                    type="button"
                    onClick={loadMoreTaskConversations}
                    className="text-muted-foreground hover:bg-accent/50 hover:text-foreground mt-1 w-full rounded px-1.5 py-1 text-left text-[11px] transition-colors"
                  >
                    Load more tasks
                  </button>
                )}
                {hasTaskSessions && userSidebarSessions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 px-1.5 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    <span className="select-none">Sessions</span>
                    <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-px text-[9px] font-medium leading-none text-muted-foreground">
                      {userSidebarSessions.length}
                    </span>
                  </div>
                )}
                {userSidebarSessions.map((entry, idx) =>
                  renderSessionRow(entry, userOffset + idx),
                )}
              </>
            )
          })()}

          {hasMoreSavedConversations && (
            <button
              type="button"
              onClick={loadMoreSavedConversations}
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
