import React, { useEffect, useRef, useState } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Send, Mic, OctagonX, ImagePlus, Loader2, X, Bot, Sparkles } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { queryClient, useConfigQuery } from "@renderer/lib/queries"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"
import type { AgentSkill } from "@shared/types"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import {
  expandSlashCommandText,
  getSlashCommandState,
  replaceSlashCommandSelection,
} from "./skill-slash-commands"
import {
  buildMessageWithImages,
  MAX_IMAGE_ATTACHMENTS,
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
  /** Called when a message is successfully sent */
  onMessageSent?: () => void
  /** Called when stop button is clicked (optional - will call stopAgentSession directly if not provided) */
  onStopSession?: () => void | Promise<void>
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
  onStopSession,
}: TileFollowUpInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [text, setText] = useState("")
  const [imageAttachments, setImageAttachments] = useState<MessageImageAttachment[]>([])
  const [isStoppingSession, setIsStoppingSession] = useState(false)
  const [selectedSlashSkillIndex, setSelectedSlashSkillIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitInFlightRef = useRef(false)
  const configQuery = useConfigQuery()
  const skillsQuery = useQuery<AgentSkill[]>({
    queryKey: ["skills"],
    queryFn: () => tipcClient.getSkills(),
    staleTime: 60_000,
  })
  const availableSkills = skillsQuery.data ?? []
  const slashCommandState = React.useMemo(
    () => getSlashCommandState(text, availableSkills),
    [availableSkills, text],
  )
  const matchedSlashSkill = slashCommandState?.exactSkill ?? null
  const selectedSlashSkill = slashCommandState?.suggestions[selectedSlashSkillIndex] ?? null

  // Message queuing is enabled by default. While config is loading, treat as enabled
  // to allow users to type. The backend will handle queuing appropriately.
  const isQueueEnabled = configQuery.data?.mcpMessageQueueEnabled ?? true

  useEffect(() => {
    setSelectedSlashSkillIndex(0)
  }, [slashCommandState?.query, slashCommandState?.suggestions.length])

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
    const expandedText = expandSlashCommandText(text, matchedSlashSkill)
    const message = buildMessageWithImages(expandedText, imageAttachments)
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

  const handleSelectSlashSkill = (skill: AgentSkill) => {
    setText((currentText) => replaceSlashCommandSelection(currentText, skill))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } finally {
      e.target.value = ""
    }
  }

  const removeImageAttachment = (attachmentId: string) => {
    logUI("[TileFollowUpInput] remove image", { attachmentId })
    setImageAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (slashCommandState?.shouldShowSuggestions && selectedSlashSkill) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSlashSkillIndex((currentIndex) =>
          Math.min(currentIndex + 1, slashCommandState.suggestions.length - 1),
        )
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSlashSkillIndex((currentIndex) => Math.max(currentIndex - 1, 0))
        return
      }

      if ((e.key === "Tab" || e.key === "Enter") && !e.shiftKey) {
        e.preventDefault()
        handleSelectSlashSkill(selectedSlashSkill)
        return
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleVoiceClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInitializingSession) return

    // Pass conversationId and sessionId directly through IPC to continue in the same session
    // This is more reliable than using Zustand store which has timing issues
    // Don't pass fake "pending-*" sessionIds - let the backend find the real session by conversationId
    // Mark as fromTile so the floating panel doesn't show - session continues in the tile
    const realSessionId = sessionId?.startsWith('pending-') ? undefined : sessionId
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
      return "Queue message... (/ for skills)"
    }
    if (isSessionActive) {
      return "" // Spinner indicates loading state
    }
    return "Continue conversation... (/ for skills)"
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

      {matchedSlashSkill && (
        <div className="flex min-w-0 items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          <span className="min-w-0 truncate">Skill: {matchedSlashSkill.name}</span>
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

      <div className="flex w-full items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
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
          onSelectPrompt={(content) => setText(content)}
          disabled={isDisabled}
          className="h-6 w-6"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 flex-shrink-0"
          disabled={isDisabled || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
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

      {slashCommandState?.shouldShowSuggestions && !isDisabled && (
        <div className="overflow-hidden rounded-md border border-border/60 bg-muted/20">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Skill commands
          </div>
          <div
            role="listbox"
            aria-label="Skill slash command suggestions"
            className="max-h-28 overflow-y-auto p-1"
          >
            {skillsQuery.isLoading ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">Loading skills…</div>
            ) : slashCommandState.suggestions.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                No skills match `/{slashCommandState.query}`.
              </div>
            ) : (
              slashCommandState.suggestions.map((skill, index) => (
                <button
                  key={skill.id}
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    index === selectedSlashSkillIndex
                      ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectSlashSkill(skill)}
                >
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    /{skill.id} • {skill.description || "Use this skill as a reusable prompt."}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </form>
  )
}