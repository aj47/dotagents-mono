import React, { useState, useRef } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Send, Mic, OctagonX, ImagePlus, X, Bot } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { desktopAgentSessionsClient } from "@renderer/lib/desktop-agent-sessions-client"
import { desktopMcpSessionActionsClient } from "@renderer/lib/desktop-mcp-session-actions-client"
import { desktopPanelClient } from "@renderer/lib/desktop-panel-client"
import { queryClient, useConfigQuery } from "@renderer/lib/queries"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import { SlashCommandMenu, useSlashCommands } from "./slash-command-menu"
import {
  getChatComposerCopyState,
  getChatComposerDesktopSurfaceState,
  getChatRuntimeCopyState,
  getFollowUpInputPresentation,
  formatChatImageAttachmentErrorMessage,
  getChatImageAttachmentDesktopComposerPreviewRenderState,
  type FollowUpInputPresentation,
} from "@dotagents/shared/session-presentation"
import {
  buildMessageWithImages,
  getClipboardImageFiles,
  MAX_IMAGE_ATTACHMENTS,
  ImageAttachmentInputFiles,
  MessageImageAttachment,
  readImageAttachments,
} from "@renderer/lib/message-image-utils"
import { DEFAULT_MCP_MESSAGE_QUEUE_ENABLED } from "@dotagents/shared/mcp-api"

const desktopComposerSurface = getChatComposerDesktopSurfaceState().followUp
const desktopComposerCopy = getChatComposerCopyState()
const desktopRuntimeCopy = getChatRuntimeCopyState()
const desktopImageAttachmentPreview = getChatImageAttachmentDesktopComposerPreviewRenderState()
const desktopImageAttachmentSurface = desktopImageAttachmentPreview.surface

interface OverlayFollowUpInputProps {
  conversationId?: string
  sessionId?: string
  isSessionActive?: boolean
  isInitializingSession?: boolean
  className?: string
  /** Agent/profile name to display as indicator */
  agentName?: string
  /** Centralized lifecycle/queue presentation for this composer. */
  presentation?: FollowUpInputPresentation
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
  isInitializingSession = false,
  className,
  agentName,
  presentation,
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
  // Overlay uses <input type="text"> which can't represent newlines.
  // Flatten newlines to spaces when slash commands insert multi-line content.
  const setTextFlattened = React.useCallback((val: string) => setText(val.replace(/\n/g, " ")), [])
  const { isSlashMenuOpen, slashQuery, handleSlashSelect, closeSlashMenu, handleSlashKeyDown, menuRef } = useSlashCommands(text, setTextFlattened)

  // Message queuing is enabled by default. While config is loading, treat as enabled
  // to allow users to type. The backend will handle queuing appropriately.
  const isQueueEnabled = configQuery.data?.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED
  const inputPresentation = presentation ?? getFollowUpInputPresentation({
    conversationState: isSessionActive ? "running" : "complete",
    isInitializingSession,
    isQueueEnabled,
  })

  // Make panel focusable when user wants to interact with the input
  // The panel is non-focusable by default in agent mode to avoid stealing focus
  // We pass andFocus=true so the window is also focused, which is required on macOS
  // for windows shown with showInactive() to receive input events
  const handleInputInteraction = async () => {
    try {
      await desktopPanelClient.setPanelFocusable({ focusable: true, andFocus: true })
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
        return await desktopMcpSessionActionsClient.createMcpTextInput({ text: message })
      } else {
        // Continue the existing conversation
        return await desktopMcpSessionActionsClient.createMcpTextInput({
          text: message,
          conversationId,
          sessionId,
        })
      }
    },
    onSuccess: (data, variables) => {
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
      if (sessionId && !data?.queued) {
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
      isInitializingSession,
      isQueueEnabled,
      inputMode: inputPresentation.mode,
      pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current,
    })

    // Allow submission if:
    // 1. Not already pending
    // 2. Either session is not active OR queue is enabled
    if (!message || inputPresentation.mode === "initializing" || inputPresentation.mode === "disabled" || sendMutation.isPending || isSubmitting || submitInFlightRef.current) return

    submitInFlightRef.current = true
    setIsSubmitting(true)

    try {
      await sendMutation.mutateAsync(message)
    } catch (error) {
      console.error("Failed to submit overlay follow-up message:", error)
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

  const addImageAttachmentsFromFiles = async (
    files: ImageAttachmentInputFiles | null,
    source: "selection" | "paste",
  ) => {
    try {
      logUI("[OverlayFollowUpInput] image attachment started", {
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

      logUI("[OverlayFollowUpInput] image selection completed", {
        addedCount: attachments.length,
        errorCount: errors.length,
      })

      if (errors.length > 0) {
        window.alert(errors.join("\n"))
      }
    } catch (error) {
      window.alert(formatChatImageAttachmentErrorMessage(error))
    }
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await addImageAttachmentsFromFiles(e.target.files, "selection")
    } finally {
      e.target.value = ""
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const imageFiles = getClipboardImageFiles(e.clipboardData)
    if (imageFiles.length === 0) return

    e.preventDefault()
    await addImageAttachmentsFromFiles(imageFiles, "paste")
  }

  const removeImageAttachment = (attachmentId: string) => {
    logUI("[OverlayFollowUpInput] remove image", { attachmentId })
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
    // Make panel focusable and focused first to ensure click events are received
    // This is required on macOS for windows shown with showInactive()
    try {
      await desktopPanelClient.setPanelFocusable({ focusable: true, andFocus: true })
    } catch {
      // Ignore errors - recording might still work
    }
    // Pass conversationId and sessionId directly through IPC to continue in the same session
    // This is more reliable than using Zustand store which has timing issues
    // Don't pass fake "pending-*" sessionIds - let the backend find the real session by conversationId
    const realSessionId = sessionId?.startsWith('pending-') ? undefined : sessionId
    await desktopMcpSessionActionsClient.triggerMcpRecording({ conversationId, sessionId: realSessionId })
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
        await desktopAgentSessionsClient.emergencyStopAgent()
      } catch (error) {
        console.error("Failed to emergency stop agent:", error)
      } finally {
        setIsStoppingSession(false)
      }
      return
    }

    setIsStoppingSession(true)
    try {
      await desktopAgentSessionsClient.stopAgentSession(sessionId)
    } catch (error) {
      console.error("Failed to stop agent session:", error)
    } finally {
      setIsStoppingSession(false)
    }
  }

  // When queue is enabled, allow TEXT input even when session is active
  // When queue is disabled, don't allow input while session is active
  const isDisabled = inputPresentation.isDisabled || isSubmitting || sendMutation.isPending

  // When queue is enabled, allow voice recording even when session is active
  // The transcript will be queued after transcription completes
  // When queue is disabled, don't allow voice input while session is active
  const isVoiceDisabled = inputPresentation.isDisabled || isSubmitting || sendMutation.isPending
  const hasMessageContent = text.trim().length > 0 || imageAttachments.length > 0

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        desktopComposerSurface.overlayFormClassName,
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Agent indicator - shows which agent is handling this session */}
      {agentName && (
        <div className={desktopComposerSurface.agentIndicatorClassName}>
          <Bot className={desktopComposerSurface.agentIconClassName} />
          <span className={desktopComposerSurface.agentNameClassName} title={`Agent: ${agentName}`}>{agentName}</span>
        </div>
      )}

      {imageAttachments.length > 0 && (
        <div className={desktopImageAttachmentSurface.overlayRowClassName}>
          {imageAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className={desktopImageAttachmentSurface.overlayPreviewClassName}
            >
              <img src={attachment.dataUrl} alt={attachment.name} className={desktopImageAttachmentSurface.imageClassName} />
              <button
                type="button"
                className={desktopImageAttachmentSurface.removeButtonClassName}
                onClick={() => removeImageAttachment(attachment.id)}
                title={desktopImageAttachmentPreview.removeButton.title}
                aria-label={desktopImageAttachmentPreview.removeButton.title}
              >
                <X className={desktopImageAttachmentSurface.overlayRemoveIconClassName} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={desktopComposerSurface.overlayInputRowClassName}>
        <div className={desktopComposerSurface.overlayInputWrapperClassName}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onClick={handleInputInteraction}
            onFocus={handleInputInteraction}
            placeholder={inputPresentation.placeholder}
            className={desktopComposerSurface.textInputClassName}
            disabled={isDisabled}
          />
          <SlashCommandMenu
            ref={menuRef}
            query={slashQuery}
            isOpen={isSlashMenuOpen}
            onSelect={handleSlashSelect}
            onClose={closeSlashMenu}
            className={desktopComposerSurface.slashMenuClassName}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={desktopComposerSurface.hiddenFileInputClassName}
          onChange={handleImageSelection}
        />
        <div className={desktopComposerSurface.overlayActionsClassName}>
          <PredefinedPromptsMenu
            onSelectPrompt={(content) => setText(content)}
            disabled={isDisabled}
            buttonSize="sm"
          />
          <Button
            type="button"
            size="md-icon"
            variant="ghost"
            className={desktopComposerSurface.buttonClassName}
            disabled={isDisabled || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
            onMouseDown={handleInputInteraction}
            onClick={handleImageButtonClick}
            title={desktopComposerCopy.imageAttachment.accessibilityLabel}
          >
            <ImagePlus className={desktopComposerSurface.iconClassName} />
          </Button>
          <Button
            type="submit"
            size="md-icon"
            variant="ghost"
            className={desktopComposerSurface.buttonClassName}
            disabled={!hasMessageContent || isDisabled}
            onMouseDown={handleInputInteraction}
            title={inputPresentation.submitTitle}
            aria-label={inputPresentation.submitAriaLabel}
          >
            <Send className={cn(
              desktopComposerSurface.iconClassName,
              sendMutation.isPending && "animate-pulse"
            )} />
          </Button>
          <Button
            type="button"
            size="md-icon"
            variant="ghost"
            className={desktopComposerSurface.voiceButtonClassName}
            disabled={isVoiceDisabled}
            onMouseDown={handleInputInteraction}
            onClick={handleVoiceClick}
            title={inputPresentation.voiceTitle}
          >
            <Mic className={desktopComposerSurface.iconClassName} />
          </Button>
          {/* Kill switch - stop agent button (only show when session is active) */}
          {isSessionActive && sessionId && !sessionId.startsWith('pending-') && (
            <Button
              type="button"
              size="md-icon"
              variant="ghost"
              className={desktopComposerSurface.killSwitchButtonClassName}
              disabled={isStoppingSession}
              onMouseDown={handleInputInteraction}
              onClick={handleStopSession}
              title={desktopRuntimeCopy.killSwitch.sessionExecutionButtonTitle}
            >
              <OctagonX className={cn(
                desktopComposerSurface.iconClassName,
                isStoppingSession && "animate-pulse"
              )} />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
