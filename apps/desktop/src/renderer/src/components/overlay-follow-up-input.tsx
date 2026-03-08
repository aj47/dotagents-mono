import React, { useEffect, useRef, useState } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Send, Mic, OctagonX, ImagePlus, X, Bot, Sparkles } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { queryClient, useConfigQuery } from "@renderer/lib/queries"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"
import type { AgentProfile, AgentSkill, SessionProfileSnapshot } from "@shared/types"
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
  const sessionProfileQuery = useQuery<SessionProfileSnapshot | null>({
    queryKey: ["session-profile-snapshot", sessionId],
    queryFn: () => tipcClient.getSessionProfileSnapshot({ sessionId }),
    enabled: !!sessionId,
    staleTime: 60_000,
  })
  const currentAgentProfileQuery = useQuery<AgentProfile | null>({
    queryKey: ["current-agent-profile"],
    queryFn: () => tipcClient.getCurrentAgentProfile(),
    enabled: !sessionId || (!sessionProfileQuery.isLoading && !sessionProfileQuery.data?.profileId),
    staleTime: 60_000,
  })
  const effectiveSlashSkillProfileId = sessionProfileQuery.data?.profileId ?? currentAgentProfileQuery.data?.id ?? null
  const enabledSkillIdsQuery = useQuery<string[]>({
    queryKey: ["profile-enabled-skill-ids", effectiveSlashSkillProfileId],
    queryFn: () => tipcClient.getEnabledSkillIdsForProfile({ profileId: effectiveSlashSkillProfileId }),
    enabled: !!effectiveSlashSkillProfileId,
    staleTime: 60_000,
  })
  const availableSkills = React.useMemo(() => {
    const skills = skillsQuery.data ?? []
    const needsCurrentProfileFallback = !sessionId || !sessionProfileQuery.data?.profileId

    if (sessionId && sessionProfileQuery.isLoading) {
      return []
    }

    if (needsCurrentProfileFallback && currentAgentProfileQuery.isLoading) {
      return []
    }

    if (!effectiveSlashSkillProfileId) {
      return skills
    }

    if (!enabledSkillIdsQuery.data) {
      return []
    }

    const enabledSkillIdSet = new Set(enabledSkillIdsQuery.data)
    return skills.filter((skill) => enabledSkillIdSet.has(skill.id))
  }, [
    currentAgentProfileQuery.isLoading,
    effectiveSlashSkillProfileId,
    enabledSkillIdsQuery.data,
    sessionId,
    sessionProfileQuery.data?.profileId,
    sessionProfileQuery.isLoading,
    skillsQuery.data,
  ])
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
    const expandedText = expandSlashCommandText(text, matchedSlashSkill)
    const message = buildMessageWithImages(expandedText, imageAttachments)
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
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleSelectSlashSkill = (skill: AgentSkill) => {
    setText((currentText) => replaceSlashCommandSelection(currentText, skill))
    setTimeout(() => inputRef.current?.focus(), 0)
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

      {matchedSlashSkill && (
        <div className="flex min-w-0 items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          <span className="min-w-0 truncate">Skill: {matchedSlashSkill.name}</span>
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

      {slashCommandState?.shouldShowSuggestions && !isDisabled && (
        <div className="overflow-hidden rounded-md border border-border/60 bg-muted/20">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Skill commands
          </div>
          <div
            role="listbox"
            aria-label="Skill slash command suggestions"
            className="max-h-32 overflow-y-auto p-1"
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
                    "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left transition-colors",
                    index === selectedSlashSkillIndex
                      ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectSlashSkill(skill)}
                >
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-xs text-muted-foreground">
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
