import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Send, Mic, OctagonX, ImagePlus, Loader2, X, Bot } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { queryClient, useConfigQuery } from "@renderer/lib/queries"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import { SlashCommandMenu, useSlashCommands } from "./slash-command-menu"
import {
  buildMessageWithImages,
  getClipboardImageFiles,
  MAX_IMAGE_ATTACHMENTS,
  ImageAttachmentInputFiles,
  MessageImageAttachment,
  readImageAttachments,
} from "@renderer/lib/message-image-utils"

interface TileFollowUpInputProps {
  conversationId?: string
  sessionId?: string
  isSessionActive?: boolean
  isInitializingSession?: boolean
  className?: string
  /** Agent/profile name to display as indicator */
  agentName?: string
  conversationTitle?: string
  /** Maximum height for the textarea in pixels (e.g. 50% of tile height) */
  maxInputHeight?: number
  /** Called when a message is successfully sent */
  onMessageSent?: () => void
  /** Called when stop button is clicked (optional - will call stopAgentSession directly if not provided) */
  onStopSession?: () => void | Promise<void>
  /** Opens the in-app voice continuation modal when available */
  onVoiceContinue?: (options: {
    conversationId?: string
    sessionId?: string
    fromTile: boolean
    continueConversationTitle?: string
    agentName?: string
    onSubmitted?: () => void
  }) => void
}

/**
 * Compact text input for continuing a conversation within a session tile.
 */
export function TileFollowUpInput({
  conversationId,
  sessionId,
  isSessionActive = false,
  isInitializingSession = false,
  className,
  agentName,
  conversationTitle,
  maxInputHeight,
  onMessageSent,
  onStopSession,
  onVoiceContinue,
}: TileFollowUpInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [text, setText] = useState("")
  const [imageAttachments, setImageAttachments] = useState<MessageImageAttachment[]>([])
  const [isStoppingSession, setIsStoppingSession] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitInFlightRef = useRef(false)
  const configQuery = useConfigQuery()
  const { isSlashMenuOpen, slashQuery, handleSlashSelect, closeSlashMenu, handleSlashKeyDown, menuRef } = useSlashCommands(text, setText)

  // Auto-resize textarea to fit content, up to maxInputHeight
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    // Reset height so scrollHeight reflects actual content height
    textarea.style.height = "auto"
    const maxH = maxInputHeight ?? 140 // default max ~140px if no prop
    const newHeight = Math.min(textarea.scrollHeight, maxH)
    textarea.style.height = `${newHeight}px`
    // Enable scrolling only when content exceeds max
    textarea.style.overflowY = textarea.scrollHeight > maxH ? "auto" : "hidden"
  }, [maxInputHeight])

  useEffect(() => {
    adjustTextareaHeight()
  }, [text, adjustTextareaHeight])

  // Message queuing is enabled by default. While config is loading, treat as enabled
  // to allow users to type. The backend will handle queuing appropriately.
  const isQueueEnabled = configQuery.data?.mcpMessageQueueEnabled ?? true

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!conversationId) {
        // Start a new conversation if none exists
        // Mark as fromTile so the floating panel doesn't show - session continues in the tile
        return await tipcClient.createMcpTextInput({ text: message, fromTile: true })
      } else {
        // Continue the existing conversation
        // Mark as fromTile so the floating panel doesn't show - session continues in the tile
        return await tipcClient.createMcpTextInput({
          text: message,
          conversationId,
          fromTile: true,
        })
      }
    },
    onSuccess: (data, variables) => {
      logUI("[TileFollowUpInput] message sent", {
        messageLength: variables.length,
        attachmentCount: imageAttachments.length,
        conversationId: conversationId ?? null,
        sessionId: sessionId ?? null,
      })

      setText("")
      setImageAttachments([])
      // Optimistically append user message to the session's conversation history
      // so it appears immediately in the session tile without waiting for agent progress updates
      if (sessionId && !data?.queued) {
        useAgentStore.getState().appendUserMessageToSession(sessionId, variables)
      }
      // Also invalidate React Query caches so other views (e.g., panel) stay in sync
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })
        queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
      }
      onMessageSent?.()
    },
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const message = buildMessageWithImages(text, imageAttachments)
    logUI("[TileFollowUpInput] submit requested", {
      hasText: text.trim().length > 0,
      attachmentCount: imageAttachments.length,
      messageLength: message.length,
      isSessionActive,
      isInitializingSession,
      isQueueEnabled,
      pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current,
    })

    // Allow submission if:
    // 1. Not already pending
    // 2. Either session is not active OR queue is enabled
    if (!message || isInitializingSession || sendMutation.isPending || isSubmitting || submitInFlightRef.current) {
      return
    }
    if (isSessionActive && !isQueueEnabled) return

    submitInFlightRef.current = true
    setIsSubmitting(true)

    try {
      await sendMutation.mutateAsync(message)
    } catch (error) {
      console.error("Failed to submit tile follow-up message:", error)
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const addImageAttachmentsFromFiles = async (
    files: ImageAttachmentInputFiles | null,
    source: "selection" | "paste",
  ) => {
    try {
      logUI("[TileFollowUpInput] image attachment started", {
        source,
        existingCount: imageAttachments.length,
        selectedCount: files?.length ?? 0,
      })

      const { attachments, errors } = await readImageAttachments(
        files,
        imageAttachments
      )

      if (attachments.length > 0) {
        setImageAttachments((prev) => [...prev, ...attachments])
      }

      logUI("[TileFollowUpInput] image selection completed", {
        addedCount: attachments.length,
        errorCount: errors.length,
      })

      if (errors.length > 0) {
        window.alert(errors.join("\n"))
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to attach image.")
    }
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await addImageAttachmentsFromFiles(e.target.files, "selection")
    } finally {
      e.target.value = ""
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFiles = getClipboardImageFiles(e.clipboardData)
    if (imageFiles.length === 0) return

    e.preventDefault()
    await addImageAttachmentsFromFiles(imageFiles, "paste")
  }

  const removeImageAttachment = (attachmentId: string) => {
    logUI("[TileFollowUpInput] remove image", { attachmentId })
    setImageAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (handleSlashKeyDown(e)) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleVoiceClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInitializingSession) return

    const realSessionId = sessionId?.startsWith('pending-') ? undefined : sessionId
    if (onVoiceContinue) {
      onVoiceContinue({
        conversationId,
        sessionId: realSessionId,
        fromTile: true,
        continueConversationTitle: conversationTitle,
        agentName,
        onSubmitted: onMessageSent,
      })
      return
    }

    await tipcClient.triggerMcpRecording({ conversationId, sessionId: realSessionId, fromTile: true })
  }

  // Handle stop session - kill switch functionality
  const handleStopSession = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isStoppingSession) return

    // Use custom handler if provided, otherwise call stopAgentSession directly
    if (onStopSession) {
      setIsStoppingSession(true)
      try {
        await onStopSession()
      } catch (error) {
        console.error("Failed to stop agent session via callback:", error)
      } finally {
        setIsStoppingSession(false)
      }
      return
    }

    // For undefined or fake "pending-*" sessions, fall back to global emergency stop
    // so the kill switch always works regardless of session state
    if (!sessionId || sessionId.startsWith('pending-')) {
      setIsStoppingSession(true)
      try {
        await tipcClient.emergencyStopAgent()
      } catch (error) {
        console.error("Failed to emergency stop agent:", error)
      } finally {
        setIsStoppingSession(false)
      }
      return
    }

    setIsStoppingSession(true)
    try {
      await tipcClient.stopAgentSession({ sessionId })
    } catch (error) {
      console.error("Failed to stop agent session:", error)
    } finally {
      setIsStoppingSession(false)
    }
  }

  // When queue is enabled, allow TEXT input even when session is active
  // When queue is disabled, don't allow input while session is active
  const isDisabled =
    isInitializingSession ||
    isSubmitting ||
    sendMutation.isPending ||
    (isSessionActive && !isQueueEnabled)

  // When queue is enabled, allow voice recording even when session is active
  // The transcript will be queued after transcription completes
  // When queue is disabled, don't allow voice input while session is active
  const isVoiceDisabled =
    isInitializingSession ||
    isSubmitting ||
    sendMutation.isPending ||
    (isSessionActive && !isQueueEnabled)
  const hasMessageContent = text.trim().length > 0 || imageAttachments.length > 0

  // Show appropriate placeholder based on state
  // Use minimal placeholders - loading states indicated by spinners instead
  const getPlaceholder = () => {
    if (isInitializingSession) {
      return "" // Spinner indicates loading state
    }
    if (isSessionActive && isQueueEnabled) {
      return "Queue message..."
    }
    if (isSessionActive) {
      return "" // Spinner indicates loading state
    }
    return "Continue conversation..."
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-1.5 border-t bg-muted/20 px-2 py-1.5",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Agent indicator - removed to save space, agent name is in header */}
      {/* agentName was here but is no longer needed */}

      {imageAttachments.length > 0 && (
        <div className="flex w-full gap-1.5 overflow-x-auto pb-1">
          {imageAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-border"
            >
              <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                onClick={() => removeImageAttachment(attachment.id)}
                title="Remove image"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex w-full items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            data-composer="true"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={getPlaceholder()}
            rows={1}
            className={cn(
              "w-full text-sm bg-transparent border-0 outline-none resize-none",
              "placeholder:text-muted-foreground/60",
              "focus:ring-0"
            )}
            disabled={isDisabled}
          />
          <SlashCommandMenu
            ref={menuRef}
            query={slashQuery}
            isOpen={isSlashMenuOpen}
            onSelect={handleSlashSelect}
            onClose={closeSlashMenu}
            className="bottom-full left-0 mb-1"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelection}
        />
        <PredefinedPromptsMenu
          onSelectPrompt={(content) => setText(content)}
          disabled={isDisabled}
          buttonSize="sm-icon"
        />
        <Button
          type="button"
          size="sm-icon"
          variant="ghost"
          className="flex-shrink-0"
          disabled={isDisabled || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
          onClick={() => fileInputRef.current?.click()}
          title="Attach image"
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="submit"
          size="sm-icon"
          variant="ghost"
          className="flex-shrink-0"
          disabled={!hasMessageContent || isDisabled}
          title={isInitializingSession ? "Starting follow-up" : isSessionActive && isQueueEnabled ? "Queue message" : "Send follow-up message"}
          aria-label={isInitializingSession ? "Starting follow-up" : isSessionActive && isQueueEnabled ? "Queue message" : "Send follow-up message"}
        >
          {isInitializingSession ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className={cn(
              "h-3.5 w-3.5",
              sendMutation.isPending && "animate-pulse"
            )} aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          size="sm-icon"
          variant="ghost"
          className={cn(
            "flex-shrink-0",
            "hover:bg-red-100 dark:hover:bg-red-900/30",
            "hover:text-red-600 dark:hover:text-red-400"
          )}
          disabled={isVoiceDisabled}
          onClick={handleVoiceClick}
          title={isInitializingSession ? "Voice unavailable while session starts" : isSessionActive && isQueueEnabled ? "Record voice message (will be queued)" : isSessionActive ? "Voice unavailable while agent is processing" : "Continue with voice"}
        >
          <Mic className="h-3.5 w-3.5" />
        </Button>
        {/* Kill switch - stop agent button (only show when session is active) */}
        {isSessionActive && sessionId && !sessionId.startsWith('pending-') && (
        <Button
          type="button"
          size="sm-icon"
          variant="ghost"
          className={cn(
            "flex-shrink-0",
            "text-red-500 hover:text-red-600",
            "hover:bg-red-100 dark:hover:bg-red-950/30"
          )}
          disabled={isStoppingSession}
          onClick={handleStopSession}
          title="Stop agent execution"
        >
          <OctagonX className={cn(
            "h-3.5 w-3.5",
            isStoppingSession && "animate-pulse"
          )} />
        </Button>
        )}
      </div>
    </form>
  )
}

