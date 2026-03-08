import React, { useState, useRef } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Send, Mic, OctagonX, ImagePlus, X, Bot } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { queryClient, useConfigQuery } from "@renderer/lib/queries"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"
import { toast } from "sonner"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import {
  buildMessageWithImages,
  MAX_IMAGE_ATTACHMENTS,
  MessageImageAttachment,
  readImageAttachments,
} from "@renderer/lib/message-image-utils"

interface OverlayFollowUpInputProps {
  conversationId?: string
  sessionId?: string
  isSessionActive?: boolean
  className?: string
  /** Agent/profile name to display as indicator */
  agentName?: string
  /** Called when a message is successfully sent */
  onMessageSent?: () => void
  /** Called when stop button is clicked (optional - will call stopAgentSession directly if not provided) */
  onStopSession?: () => void | Promise<void>
}

/**
 * Input component for continuing a conversation in the floating overlay panel.
 * Includes text input, submit button, and voice button for multiple input modalities.
 */
export function OverlayFollowUpInput({
  conversationId,
  sessionId,
  isSessionActive = false,
  className,
  agentName,
  onMessageSent,
  onStopSession,
}: OverlayFollowUpInputProps) {
  const [isStoppingSession, setIsStoppingSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [text, setText] = useState("")
  const [imageAttachments, setImageAttachments] = useState<MessageImageAttachment[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitInFlightRef = useRef(false)
  const configQuery = useConfigQuery()

  // Message queuing is enabled by default. While config is loading, treat as enabled
  // to allow users to type. The backend will handle queuing appropriately.
  const isQueueEnabled = configQuery.data?.mcpMessageQueueEnabled ?? true

  // Make panel focusable when user wants to interact with the input
  // The panel is non-focusable by default in agent mode to avoid stealing focus
  // We pass andFocus=true so the window is also focused, which is required on macOS
  // for windows shown with showInactive() to receive input events
  const handleInputInteraction = async () => {
    try {
      await tipcClient.setPanelFocusable({ focusable: true, andFocus: true })
      // After making focusable and focused, ensure the input has focus
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } catch (e) {
      // Ignore errors - input might still work
    }
  }

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!conversationId) {
        // Start a new conversation if none exists
        await tipcClient.createMcpTextInput({ text: message })
      } else {
        // Continue the existing conversation
        await tipcClient.createMcpTextInput({
          text: message,
          conversationId,
        })
      }
    },
    onSuccess: (_data, variables) => {
      logUI("[OverlayFollowUpInput] message sent", {
        messageLength: variables.length,
        attachmentCount: imageAttachments.length,
        conversationId: conversationId ?? null,
        sessionId: sessionId ?? null,
      })

      setText("")
      setImageAttachments([])
      // Optimistically append user message to the session's conversation history
      // so it appears immediately in the overlay without waiting for agent progress updates
      if (sessionId) {
        useAgentStore.getState().appendUserMessageToSession(sessionId, variables)
      }
      // Also invalidate React Query caches so other views stay in sync
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
    logUI("[OverlayFollowUpInput] submit requested", {
      hasText: text.trim().length > 0,
      attachmentCount: imageAttachments.length,
      messageLength: message.length,
      isSessionActive,
      isQueueEnabled,
      pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current,
    })

    // Allow submission if:
    // 1. Not already pending
    // 2. Either session is not active OR queue is enabled
    if (!message || sendMutation.isPending || isSubmitting || submitInFlightRef.current) return
    if (isSessionActive && !isQueueEnabled) return

    submitInFlightRef.current = true
    setIsSubmitting(true)

    try {
      await sendMutation.mutateAsync(message)
    } catch (error) {
      console.error("Failed to submit overlay follow-up message:", error)
      toast.error(
        error instanceof Error && error.message.trim()
          ? `Failed to send follow-up message: ${error.message}`
          : "Failed to send follow-up message",
      )
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleImageButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    void handleInputInteraction()
    fileInputRef.current?.click()
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      logUI("[OverlayFollowUpInput] image selection started", {
        existingCount: imageAttachments.length,
        selectedCount: e.target.files?.length ?? 0,
      })

      const { attachments, errors } = await readImageAttachments(
        e.target.files,
        imageAttachments
      )

      if (attachments.length > 0) {
        setImageAttachments((prev) => [...prev, ...attachments])
      }

      logUI("[OverlayFollowUpInput] image selection completed", {
        addedCount: attachments.length,
        errorCount: errors.length,
      })

      if (errors.length > 0) {
        window.alert(errors.join("\n"))
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to attach image.")
    } finally {
      e.target.value = ""
    }
  }

  const removeImageAttachment = (attachmentId: string) => {
    logUI("[OverlayFollowUpInput] remove image", { attachmentId })
    setImageAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleVoiceClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // Make panel focusable and focused first to ensure click events are received
    // This is required on macOS for windows shown with showInactive()
    try {
      await tipcClient.setPanelFocusable({ focusable: true, andFocus: true })
    } catch {
      // Ignore errors - recording might still work
    }
    // Pass conversationId and sessionId directly through IPC to continue in the same session
    // This is more reliable than using Zustand store which has timing issues
    // Don't pass fake "pending-*" sessionIds - let the backend find the real session by conversationId
    const realSessionId = sessionId?.startsWith('pending-') ? undefined : sessionId
    await tipcClient.triggerMcpRecording({ conversationId, sessionId: realSessionId })
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
  const isDisabled = isSubmitting || sendMutation.isPending || (isSessionActive && !isQueueEnabled)

  // When queue is enabled, allow voice recording even when session is active
  // The transcript will be queued after transcription completes
  // When queue is disabled, don't allow voice input while session is active
  const isVoiceDisabled = isSubmitting || sendMutation.isPending || (isSessionActive && !isQueueEnabled)
  const hasMessageContent = text.trim().length > 0 || imageAttachments.length > 0

  // Show appropriate placeholder based on state
  // Use minimal placeholders - loading states indicated by spinners instead
  const getPlaceholder = () => {
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
        "flex flex-col gap-1.5 border-t bg-muted/30 px-3 py-2 backdrop-blur-sm",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Agent indicator - shows which agent is handling this session */}
      {agentName && (
        <div className="flex min-w-0 items-center gap-1 text-[10px] text-primary/70">
          <Bot className="h-2.5 w-2.5 shrink-0" />
          <span className="min-w-0 truncate" title={`Agent: ${agentName}`}>{agentName}</span>
        </div>
      )}

      {imageAttachments.length > 0 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
          {imageAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border"
            >
              <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                onClick={() => removeImageAttachment(attachment.id)}
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex w-full flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputInteraction}
          onFocus={handleInputInteraction}
          placeholder={getPlaceholder()}
          className={cn(
            "min-w-0 flex-[1_1_10rem] text-sm bg-transparent border-0 outline-none",
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
        <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-2">
          <PredefinedPromptsMenu
            onSelectPrompt={(content) => setText(content)}
            disabled={isDisabled}
            buttonSize="sm"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0"
            disabled={isDisabled || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
            onMouseDown={handleInputInteraction}
            onClick={handleImageButtonClick}
            title="Attach image"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0"
            disabled={!hasMessageContent || isDisabled}
            onMouseDown={handleInputInteraction}
            title={isSessionActive && isQueueEnabled ? "Queue message" : "Send message"}
          >
            <Send className={cn(
              "h-3.5 w-3.5",
              sendMutation.isPending && "animate-pulse"
            )} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "h-7 w-7 flex-shrink-0",
              "hover:bg-red-100 dark:hover:bg-red-900/30",
              "hover:text-red-600 dark:hover:text-red-400"
            )}
            disabled={isVoiceDisabled}
            onMouseDown={handleInputInteraction}
            onClick={handleVoiceClick}
            title={isSessionActive && isQueueEnabled ? "Record voice message (will be queued)" : isSessionActive ? "Voice unavailable while agent is processing" : "Continue with voice"}
          >
            <Mic className="h-3.5 w-3.5" />
          </Button>
          {/* Kill switch - stop agent button (only show when session is active) */}
          {isSessionActive && sessionId && !sessionId.startsWith('pending-') && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7 flex-shrink-0",
                "text-red-500 hover:text-red-600",
                "hover:bg-red-100 dark:hover:bg-red-950/30"
              )}
              disabled={isStoppingSession}
              onMouseDown={handleInputInteraction}
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
      </div>
    </form>
  )
}
