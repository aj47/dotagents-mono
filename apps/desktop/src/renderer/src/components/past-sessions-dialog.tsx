import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import { AlertTriangle, CheckCircle2, Clock, Loader2, Search, Trash2 } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { useConversationHistoryQuery, useDeleteConversationMutation, useDeleteAllConversationsMutation } from "@renderer/lib/queries"
import { Input } from "@renderer/components/ui/input"
import { Button } from "@renderer/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { toast } from "sonner"

const INITIAL_PAST_SESSIONS = 20

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

export function PastSessionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const conversationHistoryQuery = useConversationHistoryQuery(open)
  const deleteConversationMutation = useDeleteConversationMutation()
  const deleteAllConversationsMutation = useDeleteAllConversationsMutation()

  const [searchQuery, setSearchQuery] = useState("")
  const [pastSessionsCount, setPastSessionsCount] = useState(
    INITIAL_PAST_SESSIONS,
  )
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setPastSessionsCount(INITIAL_PAST_SESSIONS)
      setShowDeleteAllConfirm(false)
      return
    }

    // When searching, reset the lazy-load count so results feel predictable.
    setPastSessionsCount(INITIAL_PAST_SESSIONS)
  }, [open, searchQuery])

  const filteredPastSessions = useMemo(() => {
    const all = conversationHistoryQuery.data ?? []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (session) =>
        session.title.toLowerCase().includes(q) ||
        session.preview.toLowerCase().includes(q),
    )
  }, [conversationHistoryQuery.data, searchQuery])

  const visiblePastSessions = useMemo(
    () => filteredPastSessions.slice(0, pastSessionsCount),
    [filteredPastSessions, pastSessionsCount],
  )

  const hasMorePastSessions = filteredPastSessions.length > pastSessionsCount

  const handleOpenPastSession = (conversationId: string) => {
    navigate(`/${conversationId}`)
    onOpenChange(false)
  }

  const handleDeleteSession = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteConversationMutation.mutateAsync(conversationId)
    } catch (error) {
      console.error("Failed to delete session:", error)
      toast.error("Failed to delete session")
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllConversationsMutation.mutateAsync()
      toast.success("All history deleted")
      setShowDeleteAllConfirm(false)
    } catch (error) {
      toast.error("Failed to delete history")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] overflow-hidden grid-cols-1">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past sessions..."
                className="pl-7 text-xs w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={!conversationHistoryQuery.data?.length}
              className="h-8 shrink-0 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              title="Delete all history"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete All
            </Button>
          </div>

          {showDeleteAllConfirm && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Delete all history?
              </div>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowDeleteAllConfirm(false)}
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

          <div className="max-h-[50vh] sm:max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {conversationHistoryQuery.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading sessions...</span>
              </div>
            ) : conversationHistoryQuery.isError ? (
              <p className="text-destructive px-2 py-2 text-xs">
                Failed to load sessions
              </p>
            ) : visiblePastSessions.length === 0 ? (
              <p className="text-muted-foreground px-2 py-2 text-xs">
                No past sessions
              </p>
            ) : (
              <>
                {visiblePastSessions.map((session) => (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenPastSession(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleOpenPastSession(session.id)
                      }
                    }}
                    className={cn(
                      "group flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                    title={session.preview
                      ? `${session.title}\n${session.preview}\n${dayjs(session.updatedAt).format("MMM D, h:mm A")}`
                      : `${session.title}\n${dayjs(session.updatedAt).format("MMM D, h:mm A")}`}
                  >
                    <CheckCircle2 className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-start gap-2">
                        <span className="min-w-0 flex-1 text-sm font-medium leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
                          {session.title}
                        </span>
                        <div className="ml-auto grid shrink-0 place-items-center self-start">
                          {/* Timestamp shown by default, replaced by delete button on hover or keyboard focus */}
                          <span className="text-muted-foreground col-start-1 row-start-1 text-[10px] tabular-nums transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                            {formatTimestamp(session.updatedAt)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            disabled={deleteConversationMutation.isPending}
                            className="col-start-1 row-start-1 rounded p-0.5 opacity-0 pointer-events-none transition-all hover:bg-destructive/20 hover:text-destructive focus-visible:opacity-100 focus-visible:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                            title="Delete session"
                            aria-label={`Delete ${session.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                ))}

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
