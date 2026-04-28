import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@renderer/lib/utils"
import { Clock, Trash2, Check, ChevronDown, ChevronUp, AlertCircle, Loader2, Play, Pause, Pencil, RotateCcw, ArrowRight, CornerDownRight } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { QueuedMessage, AgentSessionRef } from "@shared/types"
import { useMutation } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores/agent-store"

/**
 * Navigate to a referenced agent session: focus the live session if it is
 * still running, otherwise open the saved conversation. Mirrors the behavior
 * in ActiveAgentsSidebar so sourceAgent/targetAgent links work consistently.
 */
function useNavigateToAgentSessionRef() {
  const navigate = useNavigate()
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const setExpandedSessionId = useAgentStore((s) => s.setExpandedSessionId)
  const setViewedConversationId = useAgentStore((s) => s.setViewedConversationId)
  const activeSessionsById = useAgentStore((s) => s.agentProgressById)

  return useCallback(
    (ref: AgentSessionRef) => {
      const isLive = activeSessionsById.has(ref.sessionId)
      if (isLive) {
        setViewedConversationId(null)
        navigate("/", { state: { clearPendingConversation: true } })
        setFocusedSessionId(ref.sessionId)
        setExpandedSessionId(ref.sessionId)
        return
      }
      if (ref.conversationId) {
        setFocusedSessionId(null)
        setExpandedSessionId(null)
        setViewedConversationId(ref.conversationId)
        navigate(`/${ref.conversationId}`)
      }
    },
    [activeSessionsById, navigate, setExpandedSessionId, setFocusedSessionId, setViewedConversationId],
  )
}

function AgentSessionLink({
  ref,
  prefixIcon,
  className,
}: {
  ref: AgentSessionRef
  prefixIcon?: React.ReactNode
  className?: string
}) {
  const navigateToRef = useNavigateToAgentSessionRef()
  const label = ref.agentName?.trim() || ref.sessionId.slice(0, 8)
  const isClickable = !!ref.conversationId || true

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigateToRef(ref)
      }}
      disabled={!isClickable}
      title={`Open ${label} (${ref.sessionId})`}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
        "underline decoration-dotted underline-offset-2",
        className,
      )}
    >
      {prefixIcon}
      <span className="truncate">{label}</span>
    </button>
  )
}

interface MessageQueuePanelProps {
  conversationId: string
  messages: QueuedMessage[]
  className?: string
  compact?: boolean
  isPaused?: boolean
}

/**
 * Individual message item with expand/edit capabilities
 */
function QueuedMessageItem({
  message,
  conversationId,
}: {
  message: QueuedMessage
  conversationId: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)

  // Sync editText with message.text when it changes via IPC (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditText(message.text)
    }
  }, [message.text, isEditing])

  // Exit edit mode when the message starts processing to prevent editing text that no longer matches what's being processed
  useEffect(() => {
    if (message.status === 'processing') {
      setIsEditing(false)
      setEditText(message.text)
    }
  }, [message.status, message.text])

  const removeMutation = useMutation({
    mutationFn: async () => {
      await tipcClient.removeFromMessageQueue({ conversationId, messageId: message.id })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (newText: string) => {
      const success = await tipcClient.updateQueuedMessageText({
        conversationId,
        messageId: message.id,
        text: newText,
      })
      // Throw if backend rejected the update (e.g., message is processing or already added to history)
      if (!success) {
        throw new Error("Failed to update message")
      }
      return success
    },
    onSuccess: () => {
      setIsEditing(false)
    },
    onError: () => {
      // Restore original text on failure
      setEditText(message.text)
    },
  })

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== message.text) {
      updateMutation.mutate(trimmed)
    } else {
      setIsEditing(false)
      setEditText(message.text)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(message.text)
  }

  const isLongMessage = message.text.length > 100
  const isFailed = message.status === "failed"
  const isProcessing = message.status === "processing"
  const isAddedToHistory = message.addedToHistory === true

  // Mutation to retry a failed message by resetting its status to pending
  const retryMutation = useMutation({
    mutationFn: async () => {
      // Retry the failed message - resets status to pending and triggers queue processing if idle
      await tipcClient.retryQueuedMessage({
        conversationId,
        messageId: message.id,
      })
    },
  })

  return (
    <div
      className={cn(
        "px-2.5 py-1.5",
        isFailed ? "bg-destructive/10 hover:bg-destructive/15" :
        isProcessing ? "bg-amber-100/50 dark:bg-amber-900/20" : "hover:bg-amber-100/30 dark:hover:bg-amber-900/10",
        "transition-colors"
      )}
    >
      {isEditing ? (
        // Edit mode
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[60px] p-2 text-sm rounded border bg-background resize-y"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleCancelEdit()
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSaveEdit()
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-6 text-xs"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editText.trim()}
            >
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        // View mode
        <div className="flex min-w-0 items-start gap-2">
          {isFailed && (
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          )}
          {isProcessing && (
            <Loader2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
            <div className="min-w-0 flex-1">
              {(message.source || message.target) && (
                <div className="mb-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                  {message.source && (
                    <>
                      <span>From</span>
                      <AgentSessionLink
                        ref={message.source}
                        prefixIcon={<CornerDownRight className="h-3 w-3" />}
                      />
                    </>
                  )}
                  {message.source && message.target && <span>·</span>}
                  {message.target && (
                    <>
                      <span>To</span>
                      <AgentSessionLink
                        ref={message.target}
                        prefixIcon={<ArrowRight className="h-3 w-3" />}
                      />
                    </>
                  )}
                </div>
              )}
              <p
                className={cn(
                  "text-xs leading-snug",
                  isFailed && "text-destructive",
                  isProcessing && "text-primary",
                  !isExpanded && isLongMessage && "line-clamp-2"
                )}
              >
                {message.text}
              </p>
              {isFailed && message.errorMessage && (
                <p className="text-[10px] text-destructive/80 mt-0.5">
                  Error: {message.errorMessage}
                </p>
              )}
              {isLongMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-0.5 h-4 px-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-0.5" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-0.5" />
                      More
                    </>
                  )}
                </Button>
              )}
            </div>
            {!isProcessing && (
              <div className="ml-auto flex shrink-0 items-center gap-0.5 self-start">
                {isFailed && (
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    className="text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => retryMutation.mutate()}
                    disabled={retryMutation.isPending}
                    title="Retry message"
                    aria-label={retryMutation.isPending ? "Retrying message" : "Retry message"}
                  >
                    <RotateCcw className={cn("h-3.5 w-3.5", retryMutation.isPending && "animate-spin")} />
                  </Button>
                )}
                {!isAddedToHistory && (
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    onClick={() => setIsEditing(true)}
                    title="Edit message"
                    aria-label="Edit message"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm-icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  title="Remove from queue"
                  aria-label="Remove from queue"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Panel component for displaying and managing queued messages.
 * Shows pending messages with options to view full text, edit, and remove them.
 * When queue is paused (e.g., after kill switch), shows a play button to resume.
 */
export function MessageQueuePanel({
  conversationId,
  messages,
  className,
  compact = false,
  isPaused = false,
}: MessageQueuePanelProps) {
  const [isListCollapsed, setIsListCollapsed] = useState(false)
  const messageListId = `message-queue-list-${conversationId}`

  // Reset collapse state when switching to a different conversation.
  useEffect(() => {
    setIsListCollapsed(false)
  }, [conversationId])

  const clearMutation = useMutation({
    mutationFn: async () => {
      await tipcClient.clearMessageQueue({ conversationId })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: async () => {
      await tipcClient.resumeMessageQueue({ conversationId })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: async () => {
      await tipcClient.pauseMessageQueue({ conversationId })
    },
  })

  // Check if any message is currently being processed
  // Disable Clear All when processing to prevent confusing UX where user thinks
  // they cancelled a running prompt while it actually continues running
  const hasProcessingMessage = messages.some((m) => m.status === "processing")

  if (messages.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className={cn(
        "flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs",
        isPaused
          ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
          : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
        className
      )}>
        {isPaused ? (
          <Pause className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        ) : (
          <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        )}
        <span className={cn(
          "min-w-0 flex-1",
          isPaused ? "text-orange-700 dark:text-orange-300" : "text-amber-700 dark:text-amber-300"
        )}>
          {messages.length} queued{isPaused ? " (paused)" : ""}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {isPaused ? (
            <Button
              variant="ghost"
              size="sm-icon"
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              title="Resume queue execution"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm-icon"
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending || hasProcessingMessage}
              title="Pause queue"
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm-icon"
            className={cn(
              isPaused
                ? "text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
                : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            )}
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || hasProcessingMessage}
            title={hasProcessingMessage ? "Cannot clear while processing" : "Clear queue"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden",
        isPaused
          ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/30"
          : "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5",
        !isListCollapsed && "border-b",
        isPaused
          ? "border-orange-200 dark:border-orange-800 bg-orange-100/50 dark:bg-orange-900/30"
          : "border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/30"
      )}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {isPaused ? (
            <Pause className="h-3.5 w-3.5 shrink-0 text-orange-600 dark:text-orange-400" />
          ) : (
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span className={cn(
            "min-w-0 text-xs font-medium",
            isPaused ? "text-orange-800 dark:text-orange-200" : "text-amber-800 dark:text-amber-200"
          )}>
            {isPaused ? "Paused" : "Queued"} ({messages.length})
          </span>
        </div>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
          {isPaused ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 hover:bg-green-200/50 dark:hover:bg-green-800/50"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              title="Resume queue execution"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending || hasProcessingMessage}
              title="Pause queue"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}
          {!isListCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 text-xs",
                isPaused
                  ? "text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-orange-200/50 dark:hover:bg-orange-800/50"
                  : "text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
              )}
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || hasProcessingMessage}
              title={hasProcessingMessage ? "Cannot clear while processing" : undefined}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm-icon"
            className={cn(
              isPaused
                ? "text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-orange-200/50 dark:hover:bg-orange-800/50"
                : "text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
            )}
            onClick={() => setIsListCollapsed((prev) => !prev)}
            aria-expanded={!isListCollapsed}
            aria-controls={!isListCollapsed ? messageListId : undefined}
            aria-label={isListCollapsed ? "Expand queue" : "Collapse queue"}
            title={isListCollapsed ? "Expand queue" : "Collapse queue"}
          >
            {isListCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Paused notice */}
      {isPaused && !isListCollapsed && (
        <div className="border-b border-orange-200 bg-orange-100/30 px-2.5 py-1 text-[10px] text-orange-700 break-words dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
          Paused. Click Resume to continue.
        </div>
      )}

      {/* Message List */}
      {!isListCollapsed && (
        <div id={messageListId} className="divide-y max-h-60 overflow-y-auto">
          {messages.map((msg) => (
            <QueuedMessageItem
              key={msg.id}
              message={msg}
              conversationId={conversationId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
