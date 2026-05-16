import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import {
  AlertTriangle,
  Archive,
  Clock,
  Loader2,
  Pin,
  Search,
  Trash2,
} from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { orderConversationHistoryByPinnedFirst } from "@dotagents/shared/session"
import {
  getSidebarStatusPresentation,
  normalizeMessagePreviewText,
} from "@dotagents/shared/session-presentation"
import {
  getLatestUserFacingResponse,
  getSidebarActivityPresentation,
} from "@dotagents/shared/sidebar-sessions"
import { desktopAgentSessionsClient } from "@renderer/lib/desktop-agent-sessions-client"
import {
  useSavedConversationsQuery,
  useDeleteSavedConversationMutation,
  useDeleteAllSavedConversationsMutation,
} from "@renderer/lib/queries"
import { Input } from "@renderer/components/ui/input"
import { Button } from "@renderer/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { toast } from "sonner"
import { useAgentStore } from "@renderer/stores"
import type { AgentProgressUpdate } from "@dotagents/shared/agent-progress"
import type { ConversationHistoryItem } from "@dotagents/shared/conversation-domain"
import {
  CONVERSATION_SEARCH_RESULT_LIMIT,
  filterConversationSearchEntries,
} from "@dotagents/shared/conversation-list-search"
import {
  APP_CONVERSATION_LIST_SECTION_LABELS,
  getConversationListArchiveActionPresentation,
  getConversationListDeleteActionPresentation,
  getConversationListDesktopSurfaceState,
  getConversationListItemAccessibilityLabel,
  getConversationListPinActionPresentation,
  normalizeConversationListPreviewText,
} from "@dotagents/shared/conversation-list-presentation"

const INITIAL_SAVED_CONVERSATIONS = 20
const KEYBOARD_SHORTCUT_HINT = navigator.platform.toLowerCase().includes("mac")
  ? "⌘K"
  : "Ctrl+K"
const PIN_SHORTCUT_HINT = navigator.platform.toLowerCase().includes("mac")
  ? "⌘P"
  : "Ctrl+P"
const VOICE_SHORTCUT_HINT = "V"
const conversationListDesktopSurface = getConversationListDesktopSurfaceState()
const desktopConversationListDialog = conversationListDesktopSurface.dialog
const desktopConversationListToolbar = conversationListDesktopSurface.toolbar
const desktopConversationListDeleteAllConfirm =
  conversationListDesktopSurface.deleteAllConfirm
const desktopConversationList = conversationListDesktopSurface.list
const desktopConversationListRow = conversationListDesktopSurface.row

interface AgentSessionRecord {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  lastActivity?: string
  errorMessage?: string
  isSnoozed?: boolean
}

interface SessionListResponse {
  activeSessions: AgentSessionRecord[]
  recentCompletedSessions?: AgentSessionRecord[]
  recentSessions?: AgentSessionRecord[]
}

type ConversationListEntryKind = "active" | "saved"

type ConversationListEntry = {
  key: string
  kind: ConversationListEntryKind
  title: string
  conversationId?: string
  sessionId?: string
  updatedAt: number
  preview: string
  lastMessage: string
  statusLabel: string
  statusRailClassName: string
  isPinned: boolean
  isArchived: boolean
}

function formatTimestamp(timestamp: number): string {
  const now = dayjs()
  const date = dayjs(timestamp)
  // Clamp to 0 to handle clock skew (when timestamp is slightly in the future)
  const diffSeconds = Math.max(0, now.diff(date, "second"))
  const diffMinutes = Math.max(0, now.diff(date, "minute"))
  const diffHours = Math.max(0, now.diff(date, "hour"))

  if (diffHours < 24) {
    if (diffSeconds < 60) return `${diffSeconds}s`
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${diffHours}h`
  }

  if (diffHours < 168) return date.format("ddd h:mm A")
  return date.format("MMM D")
}

function normalizeConversationText(value: string | undefined): string {
  return normalizeMessagePreviewText(value) ?? ""
}

function getConversationSnippet(
  progress?: AgentProgressUpdate | null,
  ...fallbacks: Array<string | undefined>
): string {
  const latestUserFacingResponse = progress
    ? getLatestUserFacingResponse(progress)
    : null
  if (latestUserFacingResponse) return latestUserFacingResponse

  for (
    let index = (progress?.conversationHistory?.length ?? 0) - 1;
    index >= 0;
    index -= 1
  ) {
    const message = progress?.conversationHistory?.[index]
    if (message?.role === "tool") continue
    const normalizedMessage = normalizeConversationText(message?.content)
    if (normalizedMessage) return normalizedMessage
  }

  for (const fallback of fallbacks) {
    const normalizedFallback = normalizeConversationText(fallback)
    if (normalizedFallback) return normalizedFallback
  }

  return "No messages yet"
}

function getSessionUpdatedAt(
  session: AgentSessionRecord,
  progress?: AgentProgressUpdate | null,
): number {
  const lastConversationTimestamp =
    progress?.conversationHistory?.[
      (progress.conversationHistory?.length ?? 1) - 1
    ]?.timestamp
  const lastStepTimestamp =
    progress?.steps?.[(progress.steps?.length ?? 1) - 1]?.timestamp
  return (
    lastConversationTimestamp ??
    lastStepTimestamp ??
    session.endTime ??
    session.startTime
  )
}

export function SavedConversationsDialog({
  open,
  onOpenChange,
  autoFocusSearch = false,
  onAutoFocusSearchHandled,
  onStartVoiceConversation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoFocusSearch?: boolean
  onAutoFocusSearchHandled?: () => void
  onStartVoiceConversation?: (conversation: {
    id: string
    title: string
  }) => void
}) {
  const navigate = useNavigate()
  const savedConversationsQuery = useSavedConversationsQuery(open)
  const activeConversationsQuery = useQuery<SessionListResponse>({
    queryKey: ["agentSessions"],
    queryFn: async () => {
      return await desktopAgentSessionsClient.getAgentSessions()
    },
    enabled: open,
    refetchOnWindowFocus: false,
  })
  const refetchActiveConversations = activeConversationsQuery.refetch
  const deleteSavedConversationMutation = useDeleteSavedConversationMutation()
  const deleteAllSavedConversationsMutation =
    useDeleteAllSavedConversationsMutation()
  const agentProgressById = useAgentStore((state) => state.agentProgressById)
  const pinnedSessionIds = useAgentStore((state) => state.pinnedSessionIds)
  const togglePinSession = useAgentStore((state) => state.togglePinSession)
  const archivedSessionIds = useAgentStore((state) => state.archivedSessionIds)
  const toggleArchiveSession = useAgentStore(
    (state) => state.toggleArchiveSession,
  )
  const setFocusedSessionId = useAgentStore(
    (state) => state.setFocusedSessionId,
  )
  const setExpandedSessionId = useAgentStore(
    (state) => state.setExpandedSessionId,
  )
  const setViewedConversationId = useAgentStore(
    (state) => state.setViewedConversationId,
  )
  const setScrollToSessionId = useAgentStore(
    (state) => state.setScrollToSessionId,
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [visibleConversationCount, setVisibleConversationCount] = useState(
    INITIAL_SAVED_CONVERSATIONS,
  )
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [highlightedConversationId, setHighlightedConversationId] = useState<
    string | null
  >(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setVisibleConversationCount(INITIAL_SAVED_CONVERSATIONS)
      setShowDeleteAllConfirm(false)
      setHighlightedConversationId(null)
      return
    }

    // When searching, reset the lazy-load count so results feel predictable.
    setVisibleConversationCount(INITIAL_SAVED_CONVERSATIONS)
  }, [open, searchQuery])

  useEffect(() => {
    if (!open) return undefined

    const unlisten = desktopAgentSessionsClient.onAgentSessionsUpdated(() => {
      void refetchActiveConversations()
    })

    return unlisten
  }, [open, refetchActiveConversations])

  useEffect(() => {
    if (!open) return undefined

    const focusSearchInput = () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    focusSearchInput()
    const timeoutId = window.setTimeout(focusSearchInput, 0)
    return () => window.clearTimeout(timeoutId)
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      if (event.key.toLowerCase() !== "k") return

      const activeElement = document.activeElement as HTMLElement | null
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.isContentEditable

      if (isEditable && activeElement !== searchInputRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open || !autoFocusSearch) return undefined

    const focusSearch = () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
      onAutoFocusSearchHandled?.()
    }

    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(focusSearch, 0)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [open, autoFocusSearch, onAutoFocusSearchHandled])

  const activeConversationEntries = useMemo<ConversationListEntry[]>(() => {
    const trackedActiveSessions =
      activeConversationsQuery.data?.activeSessions ?? []
    const mergedSessions = new Map(
      trackedActiveSessions.map((session) => [session.id, session] as const),
    )

    for (const [sessionId, progress] of agentProgressById.entries()) {
      const existingSession = mergedSessions.get(sessionId)
      const firstHistoryTimestamp = progress.conversationHistory?.[0]?.timestamp
      const lastHistoryTimestamp =
        progress.conversationHistory?.[progress.conversationHistory.length - 1]
          ?.timestamp

      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId:
          progress.conversationId ?? existingSession?.conversationId,
        conversationTitle:
          progress.conversationTitle ?? existingSession?.conversationTitle,
        status: progress.isComplete
          ? "completed"
          : (existingSession?.status ?? "active"),
        startTime:
          existingSession?.startTime ??
          firstHistoryTimestamp ??
          lastHistoryTimestamp ??
          Date.now(),
        endTime:
          existingSession?.endTime ??
          (progress.isComplete ? lastHistoryTimestamp : undefined),
        lastActivity: existingSession?.lastActivity,
        errorMessage: existingSession?.errorMessage,
        isSnoozed: progress.isSnoozed ?? existingSession?.isSnoozed,
      })
    }

    return Array.from(mergedSessions.values())
      .map((session) => {
        const progress = agentProgressById.get(session.id)
        const sidebarActivity = getSidebarActivityPresentation(progress, {
          fallbackErrorText:
            session.status === "error" ? session.errorMessage : null,
        })
        const hasProgressErrors = !!progress?.steps?.some(
          (step) => step.status === "error" || step.toolResult?.error,
        )
        const sidebarStatus = getSidebarStatusPresentation({
          conversationState: progress?.conversationState,
          isComplete: progress?.isComplete,
          pendingToolApproval: progress?.pendingToolApproval,
          hasErrors: hasProgressErrors,
          sessionStatus: session.status,
          isSnoozed: progress?.isSnoozed ?? session.isSnoozed ?? false,
          hasForegroundActivity: sidebarActivity.isForegroundActivity,
          hasRecentFinalResponse: sidebarActivity.kind === "response",
        })
        const conversationId =
          progress?.conversationId ?? session.conversationId
        const title =
          progress?.conversationTitle?.trim() ||
          session.conversationTitle?.trim() ||
          "Untitled conversation"
        const lastMessage = getConversationSnippet(
          progress,
          session.lastActivity,
          session.errorMessage,
        )

        return {
          key: `active:${session.id}`,
          kind: "active" as const,
          title,
          conversationId,
          sessionId: session.id,
          updatedAt: getSessionUpdatedAt(session, progress),
          preview: normalizeConversationListPreviewText(lastMessage),
          lastMessage,
          statusLabel:
            session.status === "error"
              ? "Error"
              : session.status === "stopped"
                ? "Stopped"
                : sidebarActivity.label,
          statusRailClassName: sidebarStatus.railClassName,
          isPinned: conversationId
            ? pinnedSessionIds.has(conversationId)
            : false,
          isArchived: conversationId
            ? archivedSessionIds.has(conversationId)
            : false,
        }
      })
      .sort((a, b) => {
        const pinOrder = Number(b.isPinned) - Number(a.isPinned)
        if (pinOrder !== 0) return pinOrder
        return b.updatedAt - a.updatedAt
      })
  }, [
    activeConversationsQuery.data?.activeSessions,
    agentProgressById,
    archivedSessionIds,
    pinnedSessionIds,
  ])

  const savedConversationEntries = useMemo<ConversationListEntry[]>(() => {
    const all = savedConversationsQuery.data ?? []
    const activeConversationIds = new Set(
      activeConversationEntries
        .map((entry) => entry.conversationId)
        .filter((conversationId): conversationId is string => !!conversationId),
    )

    return orderConversationHistoryByPinnedFirst<ConversationHistoryItem>(
      all,
      pinnedSessionIds,
    )
      .filter((conversation) => !activeConversationIds.has(conversation.id))
      .map((conversation) => ({
        key: `saved:${conversation.id}`,
        kind: "saved" as const,
        title: conversation.title,
        conversationId: conversation.id,
        updatedAt: conversation.updatedAt,
        preview: normalizeConversationListPreviewText(
          getConversationSnippet(
            undefined,
            conversation.lastMessage,
            conversation.preview,
          ),
        ),
        lastMessage:
          normalizeConversationText(conversation.lastMessage) ||
          normalizeConversationText(conversation.preview),
        statusLabel: archivedSessionIds.has(conversation.id)
          ? "Archived"
          : "Saved",
        statusRailClassName: archivedSessionIds.has(conversation.id)
          ? "bg-muted-foreground/60"
          : "bg-green-500",
        isPinned: pinnedSessionIds.has(conversation.id),
        isArchived: archivedSessionIds.has(conversation.id),
      }))
  }, [
    activeConversationEntries,
    archivedSessionIds,
    pinnedSessionIds,
    savedConversationsQuery.data,
  ])

  const filteredConversationEntries = useMemo(() => {
    const all = [...activeConversationEntries, ...savedConversationEntries]
    return filterConversationSearchEntries(all, searchQuery, {
      limit: CONVERSATION_SEARCH_RESULT_LIMIT,
    })
  }, [activeConversationEntries, savedConversationEntries, searchQuery])

  const visibleConversationEntries = useMemo(
    () => filteredConversationEntries.slice(0, visibleConversationCount),
    [filteredConversationEntries, visibleConversationCount],
  )

  useEffect(() => {
    if (!open) return

    setHighlightedConversationId((current) => {
      if (visibleConversationEntries.length === 0) {
        return null
      }

      if (
        current &&
        visibleConversationEntries.some(
          (conversation) => conversation.key === current,
        )
      ) {
        return current
      }

      return visibleConversationEntries[0]?.key ?? null
    })
  }, [open, visibleConversationEntries])

  const hasMoreConversations =
    filteredConversationEntries.length > visibleConversationCount

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      if (visibleConversationEntries.length === 0) return

      setHighlightedConversationId((current) => {
        const currentIndex = visibleConversationEntries.findIndex(
          (conversation) => conversation.key === current,
        )
        const fallbackIndex =
          direction > 0 ? 0 : visibleConversationEntries.length - 1
        const baseIndex = currentIndex === -1 ? fallbackIndex : currentIndex
        const nextIndex = Math.max(
          0,
          Math.min(
            visibleConversationEntries.length - 1,
            baseIndex + direction,
          ),
        )
        return visibleConversationEntries[nextIndex]?.key ?? current
      })
    },
    [visibleConversationEntries],
  )

  const highlightedConversation = useMemo(
    () =>
      visibleConversationEntries.find(
        (conversation) => conversation.key === highlightedConversationId,
      ) ?? null,
    [visibleConversationEntries, highlightedConversationId],
  )

  const handleVoiceConversation = useCallback(
    (conversationId: string, title: string) => {
      onStartVoiceConversation?.({ id: conversationId, title })
      onOpenChange(false)
    },
    [onOpenChange, onStartVoiceConversation],
  )

  const handleOpenConversation = useCallback(
    (entry: ConversationListEntry) => {
      if (entry.kind === "active" && entry.sessionId) {
        setViewedConversationId(null)
        navigate("/", { state: { clearPendingConversation: true } })
        setFocusedSessionId(entry.sessionId)
        setExpandedSessionId(entry.sessionId)
        setScrollToSessionId(entry.sessionId)
        onOpenChange(false)
        return
      }

      if (entry.conversationId) {
        setFocusedSessionId(null)
        setExpandedSessionId(null)
        setViewedConversationId(entry.conversationId)
        navigate(`/${entry.conversationId}`)
        onOpenChange(false)
      }
    },
    [
      navigate,
      onOpenChange,
      setExpandedSessionId,
      setFocusedSessionId,
      setScrollToSessionId,
      setViewedConversationId,
    ],
  )

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    try {
      await deleteSavedConversationMutation.mutateAsync(conversationId)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }

  const handleTogglePinnedConversation = (
    conversationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    togglePinSession(conversationId)
  }

  const stopConversationRowKeyPropagation = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation()
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllSavedConversationsMutation.mutateAsync()
      toast.success("All saved conversations deleted")
      setShowDeleteAllConfirm(false)
    } catch (error) {
      toast.error("Failed to delete saved conversations")
    }
  }

  const isLoadingConversations =
    visibleConversationEntries.length === 0 &&
    (savedConversationsQuery.isLoading || activeConversationsQuery.isLoading)
  const failedToLoadConversations =
    visibleConversationEntries.length === 0 &&
    (savedConversationsQuery.isError || activeConversationsQuery.isError)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={desktopConversationListDialog.contentClassName}>
        <DialogHeader className={desktopConversationListDialog.headerClassName}>
          <DialogTitle className={desktopConversationListDialog.titleClassName}>
            <Clock
              className={desktopConversationListDialog.titleIconClassName}
            />
            Conversations
          </DialogTitle>
          <DialogDescription
            className={desktopConversationListDialog.descriptionClassName}
          >
            Browse active and saved conversations. Use ↑↓ to move, Enter to
            open, {PIN_SHORTCUT_HINT} to pin, and {VOICE_SHORTCUT_HINT} for
            voice.
          </DialogDescription>
        </DialogHeader>

        <div className={desktopConversationListDialog.bodyClassName}>
          <div className={desktopConversationListToolbar.containerClassName}>
            <div
              className={
                desktopConversationListToolbar.searchContainerClassName
              }
            >
              <Search
                className={desktopConversationListToolbar.searchIconClassName}
              />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active and saved conversations by title, response, or message..."
                aria-label="Search active and saved conversations"
                className={desktopConversationListToolbar.searchInputClassName}
              />
              <span
                className={desktopConversationListToolbar.shortcutHintClassName}
              >
                {KEYBOARD_SHORTCUT_HINT}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={!savedConversationsQuery.data?.length}
              className={
                desktopConversationListToolbar.deleteAllButtonClassName
              }
              title="Delete all saved conversations"
            >
              <Trash2
                className={
                  desktopConversationListToolbar.deleteAllIconClassName
                }
              />
              Delete All
            </Button>
          </div>

          {showDeleteAllConfirm && (
            <div
              className={
                desktopConversationListDeleteAllConfirm.containerClassName
              }
            >
              <div
                className={
                  desktopConversationListDeleteAllConfirm.titleClassName
                }
              >
                <AlertTriangle
                  className={
                    desktopConversationListDeleteAllConfirm.iconClassName
                  }
                />
                Delete all saved conversations?
              </div>
              <p
                className={
                  desktopConversationListDeleteAllConfirm.descriptionClassName
                }
              >
                This action cannot be undone.
              </p>
              <div
                className={
                  desktopConversationListDeleteAllConfirm.actionsClassName
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    desktopConversationListDeleteAllConfirm.buttonClassName
                  }
                  onClick={() => setShowDeleteAllConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className={
                    desktopConversationListDeleteAllConfirm.buttonClassName
                  }
                  onClick={handleDeleteAll}
                  disabled={deleteAllSavedConversationsMutation.isPending}
                >
                  {deleteAllSavedConversationsMutation.isPending
                    ? "Deleting..."
                    : "Delete All"}
                </Button>
              </div>
            </div>
          )}

          <div className={desktopConversationList.containerClassName}>
            {isLoadingConversations ? (
              <div className={desktopConversationList.loadingClassName}>
                <Loader2
                  className={desktopConversationList.loadingIconClassName}
                />
                <span>Loading conversations...</span>
              </div>
            ) : failedToLoadConversations ? (
              <p className={desktopConversationList.errorClassName}>
                Failed to load conversations
              </p>
            ) : visibleConversationEntries.length === 0 ? (
              <p className={desktopConversationList.emptyClassName}>
                No conversations found
              </p>
            ) : (
              <>
                {visibleConversationEntries.map((entry, index) => {
                  const canPinConversation = !!entry.conversationId
                  const canArchiveConversation =
                    entry.kind === "saved" && !!entry.conversationId
                  const canDeleteConversation =
                    entry.kind === "saved" && !!entry.conversationId
                  const showSectionTitle =
                    index === 0 ||
                    visibleConversationEntries[index - 1]?.kind !== entry.kind
                  const entryPreview = normalizeConversationListPreviewText(
                    entry.preview,
                  )
                  const pinAction = getConversationListPinActionPresentation({
                    title: entry.title,
                    isPinned: entry.isPinned,
                  })
                  const archiveAction =
                    getConversationListArchiveActionPresentation({
                      title: entry.title,
                      isArchived: entry.isArchived,
                    })
                  const deleteAction =
                    getConversationListDeleteActionPresentation({
                      title: entry.title,
                    })

                  return (
                    <div key={entry.key}>
                      {showSectionTitle && (
                        <p
                          className={
                            desktopConversationList.sectionLabelClassName
                          }
                        >
                          {APP_CONVERSATION_LIST_SECTION_LABELS[entry.kind]}
                        </p>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={getConversationListItemAccessibilityLabel({
                          title: entry.title,
                          isPinned: entry.isPinned,
                          isArchived: entry.isArchived,
                          statusLabel: entry.statusLabel,
                        })}
                        onClick={() => handleOpenConversation(entry)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleOpenConversation(entry)
                          }
                        }}
                        onFocus={() => setHighlightedConversationId(entry.key)}
                        className={cn(
                          desktopConversationListRow.containerClassName,
                          desktopConversationListRow.interactiveClassName,
                          highlightedConversationId === entry.key &&
                            desktopConversationListRow.highlightedClassName,
                        )}
                        onMouseEnter={() =>
                          setHighlightedConversationId(entry.key)
                        }
                        data-highlighted={
                          highlightedConversationId === entry.key
                            ? "true"
                            : undefined
                        }
                        title={`${entryPreview}\n${dayjs(entry.updatedAt).format("MMM D, h:mm A")}`}
                      >
                        <span
                          className={cn(
                            desktopConversationListRow.railClassName,
                            entry.statusRailClassName,
                          )}
                        />
                        <div
                          className={desktopConversationListRow.bodyClassName}
                        >
                          <div
                            className={
                              desktopConversationListRow.headerClassName
                            }
                          >
                            <span
                              className={
                                desktopConversationListRow.titleClassName
                              }
                            >
                              {entry.title}
                            </span>
                            <div
                              className={
                                desktopConversationListRow.actionSlotClassName
                              }
                            >
                              <span
                                className={
                                  desktopConversationListRow.timestampClassName
                                }
                              >
                                {formatTimestamp(entry.updatedAt)}
                              </span>
                              <div
                                className={
                                  desktopConversationListRow.actionsClassName
                                }
                              >
                                {canPinConversation && entry.conversationId && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleTogglePinnedConversation(
                                        entry.conversationId!,
                                        e,
                                      )
                                    }
                                    onKeyDown={
                                      stopConversationRowKeyPropagation
                                    }
                                    className={
                                      desktopConversationListRow.actionButtonClassName
                                    }
                                    title={pinAction.title}
                                    aria-label={pinAction.accessibilityLabel}
                                    aria-pressed={entry.isPinned}
                                  >
                                    <Pin
                                      className={cn(
                                        desktopConversationListRow.actionIconClassName,
                                        entry.isPinned &&
                                          desktopConversationListRow.activeActionIconClassName,
                                      )}
                                    />
                                  </button>
                                )}
                                {canArchiveConversation &&
                                  entry.conversationId && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleArchiveSession(
                                          entry.conversationId!,
                                        )
                                      }}
                                      onKeyDown={
                                        stopConversationRowKeyPropagation
                                      }
                                      className={
                                        desktopConversationListRow.actionButtonClassName
                                      }
                                      title={archiveAction.title}
                                      aria-label={
                                        archiveAction.accessibilityLabel
                                      }
                                      aria-pressed={entry.isArchived}
                                    >
                                      <Archive
                                        className={cn(
                                          desktopConversationListRow.actionIconClassName,
                                          entry.isArchived &&
                                            desktopConversationListRow.activeActionIconClassName,
                                        )}
                                      />
                                    </button>
                                  )}
                                {canDeleteConversation &&
                                  entry.conversationId && (
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleDeleteConversation(
                                          entry.conversationId!,
                                          e,
                                        )
                                      }
                                      onKeyDown={
                                        stopConversationRowKeyPropagation
                                      }
                                      disabled={
                                        deleteSavedConversationMutation.isPending
                                      }
                                      className={
                                        desktopConversationListRow.destructiveActionButtonClassName
                                      }
                                      title={deleteAction.title}
                                      aria-label={
                                        deleteAction.accessibilityLabel
                                      }
                                    >
                                      <Trash2
                                        className={
                                          desktopConversationListRow.actionIconClassName
                                        }
                                      />
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                          {entry.isPinned && (
                            <div
                              className={
                                desktopConversationListRow.pinnedBadgeRowClassName
                              }
                            >
                              <span
                                className={
                                  desktopConversationListRow.pinnedBadgeClassName
                                }
                              >
                                <Pin
                                  className={
                                    desktopConversationListRow.pinnedBadgeIconClassName
                                  }
                                />
                                <span>Pinned</span>
                              </span>
                            </div>
                          )}
                          <p
                            className={
                              desktopConversationListRow.previewClassName
                            }
                          >
                            {entryPreview}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {hasMoreConversations && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleConversationCount(
                        (prev) => prev + INITIAL_SAVED_CONVERSATIONS,
                      )
                    }
                    className={desktopConversationList.loadMoreButtonClassName}
                  >
                    Load more (
                    {filteredConversationEntries.length -
                      visibleConversationCount}{" "}
                    remaining)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const PastSessionsDialog = SavedConversationsDialog
