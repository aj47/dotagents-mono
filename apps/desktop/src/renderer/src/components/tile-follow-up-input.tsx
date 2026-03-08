import React, { useState, useRef } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Send, Mic, OctagonX, ImagePlus, Loader2, X, Bot } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { queryClient, useConfigQuery } from "@renderer/lib/queries"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import {
  buildMessageWithImages,
  getImageAttachmentFeedbackMessage,
  getImageAttachmentUnexpectedErrorMessage,
  MAX_IMAGE_ATTACHMENTS,
  MessageImageAttachment,
  readImageAttachments,
} from "@renderer/lib/message-image-utils"

interface TileFollowUpInputProps {
  conversationId?: string
  sessionId?: string
  isSessionActive?: boolean
  isInitializingSession?: boolean
  preferCompact?: boolean
  className?: string
  /** Agent/profile name to display as indicator */
  agentName?: string
  /** Called when a message is successfully sent */
  onMessageSent?: () => void
  /** Called when the parent tile should be focused before interacting with the composer */
  onRequestFocus?: () => void
  /** Called when stop button is clicked (optional - will call stopAgentSession directly if not provided) */
  onStopSession?: () => void | Promise<void>
}

type FollowUpActionError = {
  title: string
  message: string
  retryAction: "voice" | "stop"
}

function getFollowUpSubmitErrorMessage(error: unknown, actionLabel: string): string {
  if (error instanceof Error) {
    const detail = error.message.trim()
    return detail ? `Couldn't ${actionLabel}. ${detail}` : `Couldn't ${actionLabel}. Please try again.`
  }

  if (typeof error === "string") {
    const detail = error.trim()
    return detail ? `Couldn't ${actionLabel}. ${detail}` : `Couldn't ${actionLabel}. Please try again.`
  }

  return `Couldn't ${actionLabel}. Please try again.`
}

function getFollowUpActionErrorText(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    const detail = error.message.trim()
    return detail || fallbackMessage
  }

  if (typeof error === "string") {
    const detail = error.trim()
    return detail || fallbackMessage
  }

  return fallbackMessage
}

function getFollowUpVoiceStartErrorDetails(error: unknown) {
  const rawMessage = getFollowUpActionErrorText(error, "Unknown microphone error")

  if (
    rawMessage.includes("Permission denied") ||
    rawMessage.includes("NotAllowedError") ||
    rawMessage.includes("Permission dismissed")
  ) {
    return {
      title: "Microphone access needed",
      message:
        "Microphone access was denied. Allow microphone access in your system settings, then try recording again.",
    }
  }

  if (
    rawMessage.includes("NotFoundError") ||
    rawMessage.includes("DevicesNotFoundError") ||
    rawMessage.includes("Requested device not found") ||
    rawMessage.includes("no audio input")
  ) {
    return {
      title: "No microphone found",
      message: "No microphone was found. Connect or enable a microphone, then try recording again.",
    }
  }

  if (
    rawMessage.includes("NotReadableError") ||
    rawMessage.includes("TrackStartError") ||
    rawMessage.includes("Could not start audio source")
  ) {
    return {
      title: "Microphone unavailable",
      message:
        "Your microphone is busy or unavailable right now. Close any other app using it, then try recording again.",
    }
  }

  return {
    title: "Recording failed to start",
    message: `Failed to start recording: ${rawMessage}`,
  }
}

function getFollowUpStopErrorDetails(error: unknown) {
  return {
    title: "Stop request failed",
    message: getFollowUpActionErrorText(
      error,
      "The agent may still be running. Check your connection and try again.",
    ),
  }
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
  onMessageSent,
  onRequestFocus,
  onStopSession,
}: TileFollowUpInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<FollowUpActionError | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [imageAttachments, setImageAttachments] = useState<MessageImageAttachment[]>([])
  const [isStoppingSession, setIsStoppingSession] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitInFlightRef = useRef(false)
  const configQuery = useConfigQuery()

  // Message queuing is enabled by default. While config is loading, treat as enabled
  // to allow users to type. The backend will handle queuing appropriately.
  const isQueueEnabled = configQuery.data?.mcpMessageQueueEnabled ?? true

  const handleInputInteraction = () => {
    onRequestFocus?.()
  }

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!conversationId) {
        // Start a new conversation if none exists
        // Mark as fromTile so the floating panel doesn't show - session continues in the tile
        await tipcClient.createMcpTextInput({ text: message, fromTile: true })
      } else {
        // Continue the existing conversation
        // Mark as fromTile so the floating panel doesn't show - session continues in the tile
        await tipcClient.createMcpTextInput({
          text: message,
          conversationId,
          fromTile: true,
        })
      }
    },
    onSuccess: (_data, variables) => {
      logUI("[TileFollowUpInput] message sent", {
        messageLength: variables.length,
        attachmentCount: imageAttachments.length,
        conversationId: conversationId ?? null,
        sessionId: sessionId ?? null,
      })

      setText("")
      setImageAttachments([])
      setAttachmentError(null)
      setSubmissionError(null)
      // Optimistically append user message to the session's conversation history
      // so it appears immediately in the session tile without waiting for agent progress updates
      if (sessionId) {
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

    setActionError(null)
    setAttachmentError(null)
    setSubmissionError(null)
    submitInFlightRef.current = true
    setIsSubmitting(true)

    try {
      await sendMutation.mutateAsync(message)
    } catch (error) {
      const actionLabel = isSessionActive && isQueueEnabled ? "queue message" : "send follow-up"
      const errorMessage = getFollowUpSubmitErrorMessage(error, actionLabel)
      console.error("Failed to submit tile follow-up message:", error)
      setSubmissionError(errorMessage)
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setActionError(null)
    setAttachmentError(null)

    try {
      logUI("[TileFollowUpInput] image selection started", {
        existingCount: imageAttachments.length,
        selectedCount: e.target.files?.length ?? 0,
      })

      const { attachments, errors } = await readImageAttachments(
        e.target.files,
        imageAttachments
      )

      if (attachments.length > 0) {
        setSubmissionError(null)
        setImageAttachments((prev) => [...prev, ...attachments])
      }

      logUI("[TileFollowUpInput] image selection completed", {
        addedCount: attachments.length,
        errorCount: errors.length,
      })

      if (errors.length > 0) {
        setAttachmentError(getImageAttachmentFeedbackMessage(errors, attachments.length))
      }
    } catch (error) {
      setAttachmentError(getImageAttachmentUnexpectedErrorMessage(error))
    } finally {
      e.target.value = ""
    }
  }

  const removeImageAttachment = (attachmentId: string) => {
    logUI("[TileFollowUpInput] remove image", { attachmentId })
    setActionError(null)
    setAttachmentError(null)
    setSubmissionError(null)
    setImageAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const startVoiceRecording = async () => {
    if (isInitializingSession) return

    const realSessionId = sessionId?.startsWith('pending-') ? undefined : sessionId
    await tipcClient.triggerMcpRecording({ conversationId, sessionId: realSessionId, fromTile: true })
  }

  const handleVoiceClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActionError(null)

    try {
      await startVoiceRecording()
    } catch (error) {
      console.error("Failed to start tile follow-up recording:", error)
      const errorDetails = getFollowUpVoiceStartErrorDetails(error)
      setActionError({ ...errorDetails, retryAction: "voice" })
    }
  }

  const stopSessionAction = async () => {
    if (onStopSession) {
      await onStopSession()
      return
    }

    if (!sessionId || sessionId.startsWith('pending-')) {
      await tipcClient.emergencyStopAgent()
      return
    }

    await tipcClient.stopAgentSession({ sessionId })
  }

  // Handle stop session - kill switch functionality
  const handleStopSession = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isStoppingSession) return
    setActionError(null)

    setIsStoppingSession(true)
    try {
      await stopSessionAction()
    } catch (error) {
      console.error("Failed to stop tile follow-up session:", error)
      const errorDetails = getFollowUpStopErrorDetails(error)
      setActionError({ ...errorDetails, retryAction: "stop" })
    } finally {
      setIsStoppingSession(false)
    }
  }

  const retryActionError = async () => {
    if (!actionError) return

    if (actionError.retryAction === "stop") {
      if (isStoppingSession) return

      setIsStoppingSession(true)
      try {
        await stopSessionAction()
        setActionError(null)
      } catch (error) {
        const errorDetails = getFollowUpStopErrorDetails(error)
        setActionError({ ...errorDetails, retryAction: "stop" })
      } finally {
        setIsStoppingSession(false)
      }

      return
    }

    try {
      await startVoiceRecording()
      setActionError(null)
    } catch (error) {
      const errorDetails = getFollowUpVoiceStartErrorDetails(error)
      setActionError({ ...errorDetails, retryAction: "voice" })
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
      {/* Agent indicator - shows which agent is handling this session */}
      {agentName && (
        <div className="flex items-center gap-1 text-[10px] text-primary/70">
          <Bot className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate" title={`Agent: ${agentName}`}>{agentName}</span>
        </div>
      )}

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

      {attachmentError && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-300"
          role="alert"
        >
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{attachmentError}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 shrink-0 px-2 text-xs text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            disabled={isDisabled || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
            onMouseDown={handleInputInteraction}
            onClick={() => fileInputRef.current?.click()}
          >
            {imageAttachments.length > 0 ? "Add more" : "Choose again"}
          </Button>
        </div>
      )}

      {submissionError && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive"
          role="alert"
        >
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
            {submissionError} Your draft is still here.
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 shrink-0 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={!hasMessageContent || isDisabled}
            onMouseDown={handleInputInteraction}
            onClick={() => void handleSubmit()}
          >
            Retry
          </Button>
        </div>
      )}

      {actionError && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive"
          role="alert"
        >
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
            <span className="font-medium">{actionError.title}.</span> {actionError.message}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 shrink-0 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={actionError.retryAction === "stop" ? isStoppingSession : isVoiceDisabled}
            onMouseDown={handleInputInteraction}
            onClick={() => void retryActionError()}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="flex w-full items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => {
            setActionError(null)
            setSubmissionError(null)
            setText(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onMouseDown={handleInputInteraction}
          onFocus={handleInputInteraction}
          placeholder={getPlaceholder()}
          className={cn(
            "flex-1 text-sm bg-transparent border-0 outline-none",
            "placeholder:text-muted-foreground/60",
            "focus:ring-0"
          )}
          disabled={isDisabled}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelection}
        />
        <PredefinedPromptsMenu
          onSelectPrompt={(content) => {
            setActionError(null)
            setSubmissionError(null)
            setText(content)
          }}
          disabled={isDisabled}
          className="h-6 w-6"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 flex-shrink-0"
          disabled={isDisabled || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
          onMouseDown={handleInputInteraction}
          onClick={() => fileInputRef.current?.click()}
          title="Attach image"
        >
          <ImagePlus className="h-3 w-3" />
        </Button>
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="h-6 w-6 flex-shrink-0"
          disabled={!hasMessageContent || isDisabled}
          onMouseDown={handleInputInteraction}
          title={isInitializingSession ? "Starting follow-up" : isSessionActive && isQueueEnabled ? "Queue message" : "Send follow-up message"}
          aria-label={isInitializingSession ? "Starting follow-up" : isSessionActive && isQueueEnabled ? "Queue message" : "Send follow-up message"}
        >
          {isInitializingSession ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <Send className={cn(
              "h-3 w-3",
              sendMutation.isPending && "animate-pulse"
            )} aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn(
            "h-6 w-6 flex-shrink-0",
            "hover:bg-red-100 dark:hover:bg-red-900/30",
            "hover:text-red-600 dark:hover:text-red-400"
          )}
          disabled={isVoiceDisabled}
          onMouseDown={handleInputInteraction}
          onClick={handleVoiceClick}
          title={isInitializingSession ? "Voice unavailable while session starts" : isSessionActive && isQueueEnabled ? "Record voice message (will be queued)" : isSessionActive ? "Voice unavailable while agent is processing" : "Continue with voice"}
        >
          <Mic className="h-3 w-3" />
        </Button>
        {/* Kill switch - stop agent button (only show when session is active) */}
        {isSessionActive && sessionId && !sessionId.startsWith('pending-') && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn(
            "h-6 w-6 flex-shrink-0",
            "text-red-500 hover:text-red-600",
            "hover:bg-red-100 dark:hover:bg-red-950/30"
          )}
          disabled={isStoppingSession}
          onMouseDown={handleInputInteraction}
          onClick={handleStopSession}
          title="Stop agent execution"
        >
          <OctagonX className={cn(
            "h-3 w-3",
            isStoppingSession && "animate-pulse"
          )} />
        </Button>
        )}
      </div>
    </form>
  )
}

