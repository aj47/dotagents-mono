import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
const SEARCH_RESULT_LIMIT = 50
const DEFAULT_FUZZY_THRESHOLD = 0.33
const TITLE_MATCH_WEIGHT = 0.6
const PREVIEW_MATCH_WEIGHT = 0.25
const LAST_MESSAGE_MATCH_WEIGHT = 0.15
const KEYBOARD_SHORTCUT_HINT = navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl+K"
const PIN_SHORTCUT_HINT = navigator.platform.toLowerCase().includes("mac") ? "⌘P" : "Ctrl+P"
const VOICE_SHORTCUT_HINT = "V"


type SearchableConversationField = "title" | "preview" | "lastMessage"

type SearchableConversation = {
  title: string
  preview: string
  lastMessage: string
}

type ConversationSearchResult = {
  field: SearchableConversationField
  score: number
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

function getFieldWeight(field: SearchableConversationField): number {
  switch (field) {
    case "title":
      return TITLE_MATCH_WEIGHT
    case "preview":
      return PREVIEW_MATCH_WEIGHT
    case "lastMessage":
      return LAST_MESSAGE_MATCH_WEIGHT
    default:
      return 0
  }
}

function normalizeSearchText(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim()
}

function scoreSearchField(fieldValue: string, query: string): number {
  const normalizedField = normalizeSearchText(fieldValue)
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedField || !normalizedQuery) {
    return 0
  }

  if (normalizedField.includes(normalizedQuery)) {
    const position = normalizedField.indexOf(normalizedQuery)
    const positionBonus = position === 0 ? 0.15 : Math.max(0, 0.08 - position * 0.002)
    const lengthPenalty = Math.min(0.15, normalizedField.length / 500)
    return Math.min(1, 0.85 + positionBonus - lengthPenalty)
  }

  let score = 0
  let lastMatchedIndex = -1
  for (const character of normalizedQuery) {
    const nextIndex = normalizedField.indexOf(character, lastMatchedIndex + 1)
    if (nextIndex === -1) {
      return 0
    }

    score += 1
    if (nextIndex === lastMatchedIndex + 1) {
      score += 0.35
    }
    if (nextIndex === 0 || normalizedField[nextIndex - 1] === " ") {
      score += 0.2
    }
    lastMatchedIndex = nextIndex
  }

  return Math.min(1, score / (normalizedQuery.length * 1.55))
}

function getConversationSearchResult(
  conversation: SearchableConversation,
  query: string,
): ConversationSearchResult | null {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) {
    return { field: "title", score: 1 }
  }

  const orderedFields: SearchableConversationField[] = ["title", "preview", "lastMessage"]
  let bestResult: ConversationSearchResult | null = null

  for (const field of orderedFields) {
    const rawScore = scoreSearchField(conversation[field], normalizedQuery)
    if (rawScore <= 0) continue

    const weightedScore = rawScore * getFieldWeight(field)
    if (!bestResult || weightedScore > bestResult.score) {
      bestResult = { field, score: weightedScore }
    }
  }

  if (!bestResult || bestResult.score < DEFAULT_FUZZY_THRESHOLD) {
    return null
  }

  return bestResult
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
  onStartVoiceConversation?: (conversation: { id: string; title: string }) => void
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
  const [highlightedConversationId, setHighlightedConversationId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSavedConversationCount(INITIAL_SAVED_CONVERSATIONS)
      setShowDeleteAllConfirm(false)
      setHighlightedConversationId(null)
      return
    }

    // When searching, reset the lazy-load count so results feel predictable.
    setSavedConversationCount(INITIAL_SAVED_CONVERSATIONS)
  }, [open, searchQuery])

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

  const filteredSavedConversations = useMemo(() => {
    const all = savedConversationsQuery.data ?? []
    const normalizedQuery = searchQuery.trim()

    if (!normalizedQuery) {
      return orderConversationHistoryByPinnedFirst(all, pinnedSessionIds).slice(
        0,
        SEARCH_RESULT_LIMIT,
      )
    }

    const rankedConversations = all
      .map((conversation) => {
        const result = getConversationSearchResult(
          {
            title: conversation.title,
            preview: conversation.preview,
            lastMessage: conversation.lastMessage,
          },
          normalizedQuery,
        )

        if (!result) return null

        return {
          conversation,
          rank: result.score,
          fieldPriority:
            result.field === "title" ? 0 : result.field === "preview" ? 1 : 2,
        }
      })
      .filter((entry): entry is {
        conversation: (typeof all)[number]
        rank: number
        fieldPriority: number
      } => entry !== null)
      .sort((a, b) => {
        if (b.rank !== a.rank) return b.rank - a.rank
        if (a.fieldPriority !== b.fieldPriority) return a.fieldPriority - b.fieldPriority
        return b.conversation.updatedAt - a.conversation.updatedAt
      })
      .map((entry) => entry.conversation)

    return orderConversationHistoryByPinnedFirst(rankedConversations, pinnedSessionIds).slice(
      0,
      SEARCH_RESULT_LIMIT,
    )
  }, [savedConversationsQuery.data, searchQuery, pinnedSessionIds])

  const visibleSavedConversations = useMemo(
    () => filteredSavedConversations.slice(0, savedConversationCount),
    [filteredSavedConversations, savedConversationCount],
  )

  useEffect(() => {
    if (!open) return

    setHighlightedConversationId((current) => {
      if (visibleSavedConversations.length === 0) {
        return null
      }

      if (current && visibleSavedConversations.some((conversation) => conversation.id === current)) {
        return current
      }

      return visibleSavedConversations[0]?.id ?? null
    })
  }, [open, visibleSavedConversations])

  const hasMoreSavedConversations = filteredSavedConversations.length > savedConversationCount

  const moveHighlight = useCallback((direction: 1 | -1) => {
    if (visibleSavedConversations.length === 0) return

    setHighlightedConversationId((current) => {
      const currentIndex = visibleSavedConversations.findIndex((conversation) => conversation.id === current)
      const fallbackIndex = direction > 0 ? 0 : visibleSavedConversations.length - 1
      const baseIndex = currentIndex === -1 ? fallbackIndex : currentIndex
      const nextIndex = Math.max(0, Math.min(visibleSavedConversations.length - 1, baseIndex + direction))
      return visibleSavedConversations[nextIndex]?.id ?? current
    })
  }, [visibleSavedConversations])

  const highlightedConversation = useMemo(
    () => visibleSavedConversations.find((conversation) => conversation.id === highlightedConversationId) ?? null,
    [visibleSavedConversations, highlightedConversationId],
  )

  const handleVoiceConversation = useCallback((conversationId: string, title: string) => {
    onStartVoiceConversation?.({ id: conversationId, title })
    onOpenChange(false)
  }, [onOpenChange, onStartVoiceConversation])

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
            Open or manage saved conversations. Use ↑↓ to move, Enter to open, {PIN_SHORTCUT_HINT} to pin, and {VOICE_SHORTCUT_HINT} for voice.
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
                placeholder="Search saved conversations by title, response, or message..."
                aria-label="Search saved conversations"
                className="pl-7 pr-12 text-xs w-full"
              />
              <span className="text-muted-foreground pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium">
                {KEYBOARD_SHORTCUT_HINT}
              </span>
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
                      onFocus={() => setHighlightedConversationId(session.id)}
                      className={cn(
                        "group flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        highlightedConversationId === session.id && "bg-accent/50 ring-1 ring-ring/40",
                      )}
                      onMouseEnter={() => setHighlightedConversationId(session.id)}
                      data-highlighted={highlightedConversationId === session.id ? "true" : undefined}
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
