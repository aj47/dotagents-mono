import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import { AlertTriangle, CheckCircle2, Clock, Loader2, Search, Trash2 } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { getConversationHistoryDisplayTitle } from "@renderer/lib/conversation-history-display"
import { useConversationHistoryQuery, useDeleteConversationMutation, useDeleteAllConversationsMutation } from "@renderer/lib/queries"
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

const INITIAL_PAST_SESSIONS = 20

type PastSessionListItem = {
  id: string
  title: string
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

function getConversationHistoryQueryErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim()
  }
  return "The latest refresh did not finish, so past sessions may be temporarily out of date."
}

export function PastSessionsDialog({
  open,
  onOpenChange,
  restoreFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  restoreFocusRef?: RefObject<HTMLElement | null>
}) {
  const navigate = useNavigate()
  const conversationHistoryQuery = useConversationHistoryQuery(open)
  const deleteConversationMutation = useDeleteConversationMutation()
  const deleteAllConversationsMutation = useDeleteAllConversationsMutation()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [pastSessionsCount, setPastSessionsCount] = useState(
    INITIAL_PAST_SESSIONS,
  )
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null)
  const [deleteSessionError, setDeleteSessionError] = useState<PastSessionListItem | null>(null)
  const [deleteAllErrorMessage, setDeleteAllErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setPastSessionsCount(INITIAL_PAST_SESSIONS)
      setShowDeleteAllConfirm(false)
      setPendingDeleteSessionId(null)
      setDeleteSessionError(null)
      setDeleteAllErrorMessage(null)
      return
    }

    // When searching, reset the lazy-load count so results feel predictable.
    setPastSessionsCount(INITIAL_PAST_SESSIONS)
  }, [open, searchQuery])

  const allPastSessions = conversationHistoryQuery.data ?? []
  const trimmedSearchQuery = searchQuery.trim()
  const hasSearchQuery = trimmedSearchQuery.length > 0
  const isLoadingPastSessions = conversationHistoryQuery.isLoading && !conversationHistoryQuery.data
  const hasPastSessionsLoadError = conversationHistoryQuery.isError && !conversationHistoryQuery.data
  const hasPastSessionsRefreshError = conversationHistoryQuery.isError && allPastSessions.length > 0

  const filteredPastSessions = useMemo(() => {
    const q = trimmedSearchQuery.toLowerCase()
    if (!q) return allPastSessions
    return allPastSessions.filter(
      (session) =>
        getConversationHistoryDisplayTitle(session).toLowerCase().includes(q) ||
        session.preview.toLowerCase().includes(q),
    )
  }, [allPastSessions, trimmedSearchQuery])

  const visiblePastSessions = useMemo(
    () => filteredPastSessions.slice(0, pastSessionsCount),
    [filteredPastSessions, pastSessionsCount],
  )

  const hasMorePastSessions = filteredPastSessions.length > pastSessionsCount

  const handleOpenPastSession = (conversationId: string) => {
    navigate(`/${conversationId}`)
    onOpenChange(false)
  }

  const deleteSession = async (session: PastSessionListItem) => {
    setDeleteSessionError(null)
    setDeleteAllErrorMessage(null)
    setPendingDeleteSessionId(session.id)
    try {
      await deleteConversationMutation.mutateAsync(session.id)
    } catch (error) {
      console.error("Failed to delete session:", error)
      setDeleteSessionError(session)
    } finally {
      setPendingDeleteSessionId(null)
    }
  }

  const handleDeleteSession = async (
    session: PastSessionListItem,
    e: React.MouseEvent,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (deleteConversationMutation.isPending || deleteAllConversationsMutation.isPending) {
      return
    }
    if (!confirm(`Delete "${session.title}"? This session will be removed from Past Sessions.`)) {
      return
    }

    await deleteSession(session)
  }

  const handleRetryDeleteSession = async () => {
    if (!deleteSessionError) return
    await deleteSession(deleteSessionError)
  }

  const handleDeleteAll = async () => {
    setDeleteSessionError(null)
    setDeleteAllErrorMessage(null)
    try {
      await deleteAllConversationsMutation.mutateAsync()
      toast.success("All history deleted")
      setShowDeleteAllConfirm(false)
    } catch (error) {
      console.error("Failed to delete history:", error)
      setDeleteAllErrorMessage(
        "Couldn't delete your past sessions yet. Your history is still available, so you can try again.",
      )
    }
  }

  const handleRetryLoadPastSessions = () => {
    setDeleteSessionError(null)
    setDeleteAllErrorMessage(null)
    void conversationHistoryQuery.refetch()
  }

  const handleDialogOpenAutoFocus = (event: Event) => {
    event.preventDefault()
    searchInputRef.current?.focus()
  }

  const handleDialogCloseAutoFocus = (event: Event) => {
    const restoreFocusTarget = restoreFocusRef?.current
    if (!restoreFocusTarget?.isConnected) {
      return
    }

    event.preventDefault()
    restoreFocusTarget.focus()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm w-[calc(100%-2rem)] overflow-hidden grid-cols-1"
        onOpenAutoFocus={handleDialogOpenAutoFocus}
        onCloseAutoFocus={handleDialogCloseAutoFocus}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past Sessions
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            Open or manage previous sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 min-h-0">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past sessions..."
                className="pl-7 text-xs w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteSessionError(null)
                setDeleteAllErrorMessage(null)
                setShowDeleteAllConfirm(true)
              }}
              disabled={
                !conversationHistoryQuery.data?.length
                || deleteConversationMutation.isPending
                || deleteAllConversationsMutation.isPending
              }
              className="h-8 shrink-0 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              title="Delete all history"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete All
            </Button>
          </div>

          {deleteSessionError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {`Couldn't delete "${deleteSessionError.title}" yet.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The session is still available, so you can try again.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDeleteSessionError(null)}
                >
                  Dismiss
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleRetryDeleteSession}
                  disabled={deleteConversationMutation.isPending || deleteAllConversationsMutation.isPending}
                >
                  Retry delete
                </Button>
              </div>
            </div>
          )}

          {showDeleteAllConfirm && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Delete all history?
              </div>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone.
              </p>
              {deleteAllErrorMessage && (
                <p className="text-xs text-destructive">{deleteAllErrorMessage}</p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowDeleteAllConfirm(false)}
                  disabled={deleteAllConversationsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleDeleteAll}
                  disabled={deleteAllConversationsMutation.isPending}
                >
                  {deleteAllConversationsMutation.isPending ? "Deleting..." : "Delete All"}
                </Button>
              </div>
            </div>
          )}

          {hasPastSessionsRefreshError && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2" role="alert">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Past sessions couldn&apos;t refresh</p>
                  <p className="text-xs text-muted-foreground">
                    The last loaded sessions are still shown below, but titles and previews may be stale until refresh succeeds.
                  </p>
                  <p className="break-words text-xs text-amber-700 dark:text-amber-300">
                    {getConversationHistoryQueryErrorMessage(conversationHistoryQuery.error)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleRetryLoadPastSessions}
                  disabled={conversationHistoryQuery.isFetching}
                >
                  Retry loading
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-[50vh] sm:max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {isLoadingPastSessions ? (
              <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 text-center">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading past sessions...</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Checking your saved conversation history.
                </p>
              </div>
            ) : hasPastSessionsLoadError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3" role="alert">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Couldn&apos;t load past sessions</p>
                      <p className="text-xs text-muted-foreground">
                        Your saved history is still on disk, but this dialog can&apos;t list it until loading succeeds.
                      </p>
                      <p className="break-words text-xs text-destructive">
                        {getConversationHistoryQueryErrorMessage(conversationHistoryQuery.error)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleRetryLoadPastSessions}
                      disabled={conversationHistoryQuery.isFetching}
                    >
                      Retry loading
                    </Button>
                  </div>
                </div>
              </div>
            ) : visiblePastSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 text-center">
                <p className="text-muted-foreground text-xs">
                  {hasSearchQuery
                    ? `No sessions match "${trimmedSearchQuery}".`
                    : "No past sessions yet."}
                </p>
                {hasSearchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {visiblePastSessions.map((session) => {
                  const sessionDisplayTitle = getConversationHistoryDisplayTitle(session)

                  return (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenPastSession(session.id)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleOpenPastSession(session.id)
                        }
                      }}
                      className={cn(
                        "group flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      )}
                      title={`${session.preview}\n${dayjs(session.updatedAt).format("MMM D, h:mm A")}`}
                    >
                      <CheckCircle2 className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex flex-wrap items-start gap-2">
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {sessionDisplayTitle}
                          </span>
                          <div className="ml-auto grid shrink-0 place-items-center self-start">
                            {/* Timestamp shown by default, replaced by delete button on hover or keyboard focus */}
                            <span className="text-muted-foreground col-start-1 row-start-1 text-[10px] tabular-nums transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                              {formatTimestamp(session.updatedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteSession(
                                  { id: session.id, title: sessionDisplayTitle },
                                  e,
                                )
                              }
                              disabled={deleteConversationMutation.isPending || deleteAllConversationsMutation.isPending}
                              className="col-start-1 row-start-1 rounded p-0.5 opacity-0 pointer-events-none transition-all hover:bg-destructive/20 hover:text-destructive focus-visible:opacity-100 focus-visible:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                              title={pendingDeleteSessionId === session.id ? "Deleting session" : "Delete session"}
                              aria-label={pendingDeleteSessionId === session.id ? `Deleting ${sessionDisplayTitle}` : `Delete ${sessionDisplayTitle}`}
                            >
                              {pendingDeleteSessionId === session.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        {session.preview && (
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed break-words [overflow-wrap:anywhere]">
                            {session.preview}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {hasMorePastSessions && (
                  <button
                    type="button"
                    onClick={() =>
                      setPastSessionsCount(
                        (prev) => prev + INITIAL_PAST_SESSIONS,
                      )
                    }
                    className="text-muted-foreground hover:bg-accent/50 hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition-colors"
                  >
                    Load more ({filteredPastSessions.length - pastSessionsCount}{" "}
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
