import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import { AlertTriangle, Archive, CheckCircle2, Clock, Loader2, Pin, Search, Trash2 } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { orderConversationHistoryByPinnedFirst } from "@renderer/lib/pinned-session-history"
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

const INITIAL_SAVED_CONVERSATIONS = 20

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

export function SavedConversationsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const savedConversationsQuery = useSavedConversationsQuery(open)
  const deleteSavedConversationMutation = useDeleteSavedConversationMutation()
  const deleteAllSavedConversationsMutation = useDeleteAllSavedConversationsMutation()
  const pinnedSessionIds = useAgentStore((state) => state.pinnedSessionIds)
  const togglePinSession = useAgentStore((state) => state.togglePinSession)
  const archivedSessionIds = useAgentStore((state) => state.archivedSessionIds)
  const toggleArchiveSession = useAgentStore((state) => state.toggleArchiveSession)

  const [searchQuery, setSearchQuery] = useState("")
  const [savedConversationCount, setSavedConversationCount] = useState(
    INITIAL_SAVED_CONVERSATIONS,
  )
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSavedConversationCount(INITIAL_SAVED_CONVERSATIONS)
      setShowDeleteAllConfirm(false)
      return
    }

    // When searching, reset the lazy-load count so results feel predictable.
    setSavedConversationCount(INITIAL_SAVED_CONVERSATIONS)
  }, [open, searchQuery])

  const filteredSavedConversations = useMemo(() => {
    const all = savedConversationsQuery.data ?? []
    const q = searchQuery.trim().toLowerCase()
    const filteredConversations = !q
      ? all
      : all.filter(
        (conversation) =>
          conversation.title.toLowerCase().includes(q) ||
          conversation.preview.toLowerCase().includes(q),
      )

    return orderConversationHistoryByPinnedFirst(filteredConversations, pinnedSessionIds)
  }, [savedConversationsQuery.data, searchQuery, pinnedSessionIds])

  const visibleSavedConversations = useMemo(
    () => filteredSavedConversations.slice(0, savedConversationCount),
    [filteredSavedConversations, savedConversationCount],
  )

  const hasMoreSavedConversations = filteredSavedConversations.length > savedConversationCount

  const handleOpenSavedConversation = (conversationId: string) => {
    navigate(`/${conversationId}`)
    onOpenChange(false)
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteSavedConversationMutation.mutateAsync(conversationId)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }

  const handleTogglePinnedConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    togglePinSession(conversationId)
  }

  const stopConversationRowKeyPropagation = (e: React.KeyboardEvent<HTMLButtonElement>) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] overflow-hidden grid-cols-1">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Saved Conversations
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            Open or manage saved conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 min-h-0">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved conversations..."
                className="pl-7 text-xs w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={!savedConversationsQuery.data?.length}
              className="h-8 shrink-0 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              title="Delete all saved conversations"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete All
            </Button>
          </div>

          {showDeleteAllConfirm && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Delete all saved conversations?
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
                  disabled={deleteAllSavedConversationsMutation.isPending}
                >
                  {deleteAllSavedConversationsMutation.isPending ? "Deleting..." : "Delete All"}
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-[50vh] sm:max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {savedConversationsQuery.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading saved conversations...</span>
              </div>
            ) : savedConversationsQuery.isError ? (
              <p className="text-destructive px-2 py-2 text-xs">
                Failed to load saved conversations
              </p>
            ) : visibleSavedConversations.length === 0 ? (
              <p className="text-muted-foreground px-2 py-2 text-xs">
                No saved conversations
              </p>
            ) : (
              <>
                {visibleSavedConversations.map((session) => {
                  const isPinned = pinnedSessionIds.has(session.id)
                  const isSessionArchived = archivedSessionIds.has(session.id)

                  return (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenSavedConversation(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleOpenSavedConversation(session.id)
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
                            {session.title}
                          </span>
                          <div className="ml-auto grid shrink-0 place-items-center self-start">
                            {/* Timestamp shown by default, replaced by row actions on hover or keyboard focus */}
                            <span className="text-muted-foreground col-start-1 row-start-1 text-[10px] tabular-nums transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                              {formatTimestamp(session.updatedAt)}
                            </span>
                            <div className="col-start-1 row-start-1 flex items-center gap-0.5 opacity-0 pointer-events-none transition-all group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                              <button
                                type="button"
                                onClick={(e) => handleTogglePinnedConversation(session.id, e)}
                                onKeyDown={stopConversationRowKeyPropagation}
                                className="rounded p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                title={isPinned ? "Unpin conversation" : "Pin conversation"}
                                aria-label={`${isPinned ? "Unpin" : "Pin"} ${session.title}`}
                                aria-pressed={isPinned}
                              >
                                <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-current text-foreground")} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleArchiveSession(session.id)
                                }}
                                onKeyDown={stopConversationRowKeyPropagation}
                                className="rounded p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                title={isSessionArchived ? "Unarchive conversation" : "Archive conversation"}
                                aria-label={`${isSessionArchived ? "Unarchive" : "Archive"} ${session.title}`}
                                aria-pressed={isSessionArchived}
                              >
                                <Archive className={cn("h-3.5 w-3.5", isSessionArchived && "fill-current text-foreground")} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteConversation(session.id, e)}
                                onKeyDown={stopConversationRowKeyPropagation}
                                disabled={deleteSavedConversationMutation.isPending}
                                className="rounded p-0.5 hover:bg-destructive/20 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                title="Delete conversation"
                                aria-label={`Delete ${session.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
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

                {hasMoreSavedConversations && (
                  <button
                    type="button"
                    onClick={() =>
                      setSavedConversationCount(
                        (prev) => prev + INITIAL_SAVED_CONVERSATIONS,
                      )
                    }
                    className="text-muted-foreground hover:bg-accent/50 hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition-colors"
                  >
                    Load more ({filteredSavedConversations.length - savedConversationCount}{" "}
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
