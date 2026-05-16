import React, { useState, useEffect } from "react"
import { cn } from "@renderer/lib/utils"
import { Clock, Trash2, Check, ChevronDown, ChevronUp, AlertCircle, Loader2, Play, Pause, Pencil, RotateCcw } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import {
  getMessageQueuePanelDesktopRenderState,
  getQueuedMessageEditDraftState,
  getQueuedMessageItemDesktopRenderState,
  type QueuedMessage,
} from "@dotagents/shared/session-presentation"
import { useMutation } from "@tanstack/react-query"
import { desktopMessageQueueClient } from "@renderer/lib/desktop-message-queue-client"

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
  const desktopQueueItemRenderState = getQueuedMessageItemDesktopRenderState({
    message,
    isExpanded,
  })
  const messagePresentation = desktopQueueItemRenderState.presentation
  const desktopMessageQueueItemSurface = desktopQueueItemRenderState.surface
  const desktopMessageQueuePanelCopy = desktopQueueItemRenderState.copy
  const {
    isLongMessage,
    isFailed,
    isProcessing,
    canMutateMessage,
    canEditMessage,
    expansionLabel,
    errorText,
  } = messagePresentation
  const editDraftState = getQueuedMessageEditDraftState(editText, message.text)

  // Sync editText with message.text when it changes via IPC (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditText(message.text)
    }
  }, [message.text, isEditing])

  // Exit edit mode when the message starts processing to prevent editing text that no longer matches what's being processed
  useEffect(() => {
    if (isProcessing) {
      setIsEditing(false)
      setEditText(message.text)
    }
  }, [isProcessing, message.text])

  const removeMutation = useMutation({
    mutationFn: async () => {
      await desktopMessageQueueClient.removeMessage(conversationId, message.id)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (newText: string) => {
      const success = await desktopMessageQueueClient.updateMessageText(conversationId, message.id, newText)
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
    const editSubmitState = editDraftState.submitState
    if (editSubmitState.shouldSubmit) {
      updateMutation.mutate(editSubmitState.trimmedText)
    } else {
      setIsEditing(false)
      if (editSubmitState.shouldRestoreOriginalText) {
        setEditText(message.text)
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(message.text)
  }

  // Mutation to retry a failed message by resetting its status to pending
  const retryMutation = useMutation({
    mutationFn: async () => {
      // Retry the failed message - resets status to pending and triggers queue processing if idle
      await desktopMessageQueueClient.retryMessage(conversationId, message.id)
    },
  })

  return (
    <div
      className={cn(
        desktopMessageQueueItemSurface.containerBaseClassName,
        isFailed
          ? desktopMessageQueueItemSurface.failedContainerClassName
          : isProcessing
            ? desktopMessageQueueItemSurface.processingContainerClassName
            : desktopMessageQueueItemSurface.idleContainerClassName,
      )}
    >
      {isEditing ? (
        // Edit mode
        <div className={desktopMessageQueueItemSurface.editContainerClassName}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className={desktopMessageQueueItemSurface.editInputClassName}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleCancelEdit()
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSaveEdit()
              }
            }}
          />
          <div className={desktopMessageQueueItemSurface.editActionsClassName}>
            <Button
              variant="ghost"
              size="sm"
              className={desktopMessageQueueItemSurface.editButtonClassName}
              onClick={handleCancelEdit}
            >
              {desktopMessageQueuePanelCopy.actions.cancelLabel}
            </Button>
            <Button
              variant="default"
              size="sm"
              className={desktopMessageQueueItemSurface.editButtonClassName}
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || editDraftState.saveActionState.isDisabled}
            >
              <Check className={desktopMessageQueueItemSurface.saveIconClassName} />
              {desktopMessageQueuePanelCopy.actions.saveLabel}
            </Button>
          </div>
        </div>
      ) : (
        // View mode
        <div className={desktopMessageQueueItemSurface.rowClassName}>
          {isFailed && (
            <AlertCircle className={desktopMessageQueueItemSurface.failedIconClassName} />
          )}
          {isProcessing && (
            <Loader2 className={desktopMessageQueueItemSurface.processingIconClassName} />
          )}
          <div className={desktopMessageQueueItemSurface.bodyClassName}>
            <div className={desktopMessageQueueItemSurface.contentClassName}>
              <p
                className={cn(
                  desktopMessageQueueItemSurface.messageBaseClassName,
                  isFailed && desktopMessageQueueItemSurface.messageFailedClassName,
                  isProcessing && desktopMessageQueueItemSurface.messageProcessingClassName,
                  !isExpanded && isLongMessage && desktopMessageQueueItemSurface.messageCollapsedClassName,
                )}
              >
                {message.text}
              </p>
              {errorText && (
                <p className={desktopMessageQueueItemSurface.errorClassName}>
                  {errorText}
                </p>
              )}
              {isLongMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={desktopMessageQueueItemSurface.expandButtonClassName}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className={desktopMessageQueueItemSurface.expandIconClassName} />
                      {expansionLabel}
                    </>
                  ) : (
                    <>
                      <ChevronDown className={desktopMessageQueueItemSurface.expandIconClassName} />
                      {expansionLabel}
                    </>
                  )}
                </Button>
              )}
            </div>
            {canMutateMessage && (
              <div className={desktopMessageQueueItemSurface.actionRailClassName}>
                {isFailed && (
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    className={desktopMessageQueueItemSurface.retryButtonClassName}
                    onClick={() => retryMutation.mutate()}
                    disabled={retryMutation.isPending}
                    title={desktopMessageQueuePanelCopy.actions.retryAccessibilityLabel}
                    aria-label={
                      retryMutation.isPending
                        ? desktopMessageQueuePanelCopy.actions.retryPendingAccessibilityLabel
                        : desktopMessageQueuePanelCopy.actions.retryAccessibilityLabel
                    }
                  >
                    <RotateCcw
                      className={cn(
                        desktopMessageQueueItemSurface.actionIconClassName,
                        retryMutation.isPending && desktopMessageQueueItemSurface.pendingIconClassName,
                      )}
                    />
                  </Button>
                )}
                {canEditMessage && (
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    onClick={() => setIsEditing(true)}
                    title={desktopMessageQueuePanelCopy.actions.editAccessibilityLabel}
                    aria-label={desktopMessageQueuePanelCopy.actions.editAccessibilityLabel}
                  >
                    <Pencil className={desktopMessageQueueItemSurface.actionIconClassName} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm-icon"
                  className={desktopMessageQueueItemSurface.removeButtonClassName}
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  title={desktopMessageQueuePanelCopy.actions.removeFromQueueTitle}
                  aria-label={desktopMessageQueuePanelCopy.actions.removeAccessibilityLabel}
                >
                  <Trash2 className={desktopMessageQueueItemSurface.actionIconClassName} />
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
  const queuePanelRenderState = getMessageQueuePanelDesktopRenderState({
    messages,
    isPaused,
    isListCollapsed,
  })
  const queuePanelState = queuePanelRenderState.panel
  const desktopMessageQueueCompactSurface = queuePanelRenderState.surface.compact
  const desktopMessageQueueChromeSurface = queuePanelRenderState.surface.panel
  const desktopMessageQueuePanelCopy = queuePanelRenderState.copy

  // Reset collapse state when switching to a different conversation.
  useEffect(() => {
    setIsListCollapsed(false)
  }, [conversationId])

  const clearMutation = useMutation({
    mutationFn: async () => {
      await desktopMessageQueueClient.clearQueue(conversationId)
    },
  })

  const resumeMutation = useMutation({
    mutationFn: async () => {
      await desktopMessageQueueClient.resumeQueue(conversationId)
    },
  })

  const pauseMutation = useMutation({
    mutationFn: async () => {
      await desktopMessageQueueClient.pauseQueue(conversationId)
    },
  })

  if (!queuePanelRenderState.shouldRender) {
    return null
  }

  if (compact) {
    return (
      <div className={cn(
        desktopMessageQueueCompactSurface.containerBaseClassName,
        queuePanelState.statusKey === "paused"
          ? desktopMessageQueueCompactSurface.pausedContainerClassName
          : desktopMessageQueueCompactSurface.queuedContainerClassName,
        className
      )}>
        {queuePanelState.statusKey === "paused" ? (
          <Pause className={desktopMessageQueueCompactSurface.pausedIconClassName} />
        ) : (
          <Clock className={desktopMessageQueueCompactSurface.queuedIconClassName} />
        )}
        <span className={cn(
          desktopMessageQueueCompactSurface.labelBaseClassName,
          queuePanelState.statusKey === "paused"
            ? desktopMessageQueueCompactSurface.pausedLabelClassName
            : desktopMessageQueueCompactSurface.queuedLabelClassName,
        )}>
          {queuePanelState.compactLabel}
        </span>
        <div className={desktopMessageQueueCompactSurface.actionsClassName}>
          {queuePanelState.isPaused ? (
            <Button
              variant="ghost"
              size="sm-icon"
              className={desktopMessageQueueCompactSurface.resumeButtonClassName}
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              title={desktopMessageQueuePanelCopy.actions.resumeTitle}
            >
              <Play className={desktopMessageQueueCompactSurface.actionIconClassName} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm-icon"
              className={desktopMessageQueueCompactSurface.pauseButtonClassName}
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending || queuePanelState.pauseActionState.isDisabled}
              title={desktopMessageQueuePanelCopy.actions.pauseTitle}
            >
              <Pause className={desktopMessageQueueCompactSurface.actionIconClassName} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm-icon"
            className={cn(
              queuePanelState.isPaused
                ? desktopMessageQueueCompactSurface.clearPausedButtonClassName
                : desktopMessageQueueCompactSurface.clearQueuedButtonClassName,
            )}
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || queuePanelState.clearActionState.isDisabled}
            title={
              queuePanelState.clearActionState.isDisabled
                ? desktopMessageQueuePanelCopy.actions.clearWhileProcessingTitle
                : desktopMessageQueuePanelCopy.actions.clearQueueTitle
            }
          >
            <Trash2 className={desktopMessageQueueCompactSurface.actionIconClassName} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        desktopMessageQueueChromeSurface.containerBaseClassName,
        queuePanelState.statusKey === "paused"
          ? desktopMessageQueueChromeSurface.pausedContainerClassName
          : desktopMessageQueueChromeSurface.queuedContainerClassName,
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        desktopMessageQueueChromeSurface.headerBaseClassName,
        queuePanelState.isExpanded && desktopMessageQueueChromeSurface.headerExpandedClassName,
        queuePanelState.statusKey === "paused"
          ? desktopMessageQueueChromeSurface.pausedHeaderClassName
          : desktopMessageQueueChromeSurface.queuedHeaderClassName,
      )}>
        <div className={desktopMessageQueueChromeSurface.titleGroupClassName}>
          {queuePanelState.statusKey === "paused" ? (
            <Pause className={desktopMessageQueueChromeSurface.pausedIconClassName} />
          ) : (
            <Clock className={desktopMessageQueueChromeSurface.queuedIconClassName} />
          )}
          <span className={cn(
            desktopMessageQueueChromeSurface.titleBaseClassName,
            queuePanelState.statusKey === "paused"
              ? desktopMessageQueueChromeSurface.pausedTitleClassName
              : desktopMessageQueueChromeSurface.queuedTitleClassName,
          )}>
            {queuePanelState.title}
          </span>
        </div>
        <div className={desktopMessageQueueChromeSurface.actionsClassName}>
          {queuePanelState.isPaused ? (
            <Button
              variant="ghost"
              size="sm"
              className={desktopMessageQueueChromeSurface.resumeButtonClassName}
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              title={desktopMessageQueuePanelCopy.actions.resumeTitle}
            >
              <Play className={desktopMessageQueueChromeSurface.inlineActionIconClassName} />
              {desktopMessageQueuePanelCopy.actions.resumeLabel}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={desktopMessageQueueChromeSurface.pauseButtonClassName}
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending || queuePanelState.pauseActionState.isDisabled}
              title={desktopMessageQueuePanelCopy.actions.pauseTitle}
            >
              <Pause className={desktopMessageQueueChromeSurface.inlineActionIconClassName} />
              {desktopMessageQueuePanelCopy.actions.pauseLabel}
            </Button>
          )}
          {queuePanelState.shouldRenderClear && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                desktopMessageQueueChromeSurface.clearButtonBaseClassName,
                queuePanelState.statusKey === "paused"
                  ? desktopMessageQueueChromeSurface.pausedControlButtonClassName
                  : desktopMessageQueueChromeSurface.queuedControlButtonClassName,
              )}
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || queuePanelState.clearActionState.isDisabled}
              title={queuePanelState.clearActionState.isDisabled ? desktopMessageQueuePanelCopy.actions.clearWhileProcessingTitle : undefined}
            >
              {desktopMessageQueuePanelCopy.actions.clearAllLabel}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm-icon"
            className={cn(
              queuePanelState.statusKey === "paused"
                ? desktopMessageQueueChromeSurface.pausedControlButtonClassName
                : desktopMessageQueueChromeSurface.queuedControlButtonClassName,
            )}
            onClick={() => setIsListCollapsed((prev) => !prev)}
            aria-expanded={queuePanelState.isExpanded}
            aria-controls={queuePanelState.isExpanded ? messageListId : undefined}
            aria-label={queuePanelState.listToggleLabel}
            title={queuePanelState.listToggleLabel}
          >
            {queuePanelState.isListCollapsed ? (
              <ChevronDown className={desktopMessageQueueChromeSurface.toggleIconClassName} />
            ) : (
              <ChevronUp className={desktopMessageQueueChromeSurface.toggleIconClassName} />
            )}
          </Button>
        </div>
      </div>

      {/* Paused notice */}
      {queuePanelState.shouldRenderPausedNotice && (
        <div className={desktopMessageQueueChromeSurface.pausedNoticeClassName}>
          {desktopMessageQueuePanelCopy.pausedNotice}
        </div>
      )}

      {/* Message List */}
      {queuePanelState.shouldRenderList && (
        <div id={messageListId} className={desktopMessageQueueChromeSurface.listClassName}>
          {queuePanelState.items.map(({ message: msg, key }) => (
            <QueuedMessageItem
              key={key}
              message={msg}
              conversationId={conversationId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
