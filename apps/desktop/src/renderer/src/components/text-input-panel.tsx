import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Textarea } from "@renderer/components/ui/textarea"
import { Button } from "@renderer/components/ui/button"
import { cn } from "@renderer/lib/utils"
import { AgentProcessingView } from "./agent-processing-view"
import { AgentProfile, AgentProgressUpdate, AgentSkill } from "../../../shared/types"
import { useTheme } from "@renderer/contexts/theme-context"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import { AgentSelector } from "./agent-selector"
import { ImagePlus, Sparkles, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
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

interface TextInputPanelProps {
  onSubmit: (text: string) => void | Promise<boolean | void>
  selectedAgentId: string | null
  onSelectAgent: (agentId: string | null) => void
  onCancel: () => void
  isProcessing?: boolean
  agentProgress?: AgentProgressUpdate | null
  initialText?: string
  continueConversationTitle?: string | null
}

export interface TextInputPanelRef {
  focus: () => void
  setInitialText: (text: string) => void
}

export const TextInputPanel = forwardRef<TextInputPanelRef, TextInputPanelProps>(({
  onSubmit,
  selectedAgentId,
  onSelectAgent,
  onCancel,
  isProcessing = false,
  agentProgress,
  initialText,
  continueConversationTitle,
}, ref) => {
  const [text, setText] = useState(initialText || "")
  const [imageAttachments, setImageAttachments] = useState<MessageImageAttachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSlashSkillIndex, setSelectedSlashSkillIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitInFlightRef = useRef(false)
  const { isDark } = useTheme()
  const isBusy = isProcessing || isSubmitting
  const skillsQuery = useQuery<AgentSkill[]>({
    queryKey: ["skills"],
    queryFn: () => tipcClient.getSkills(),
    staleTime: 60_000,
  })
  const currentAgentProfileQuery = useQuery<AgentProfile | null>({
    queryKey: ["current-agent-profile"],
    queryFn: () => tipcClient.getCurrentAgentProfile(),
    enabled: selectedAgentId === null,
    staleTime: 60_000,
  })
  const effectiveSlashSkillProfileId = selectedAgentId ?? currentAgentProfileQuery.data?.id ?? null
  const enabledSkillIdsQuery = useQuery<string[]>({
    queryKey: ["profile-enabled-skill-ids", effectiveSlashSkillProfileId],
    queryFn: () => tipcClient.getEnabledSkillIdsForProfile({ profileId: effectiveSlashSkillProfileId }),
    enabled: !!effectiveSlashSkillProfileId,
    staleTime: 60_000,
  })
  const availableSkills = React.useMemo(() => {
    const skills = skillsQuery.data ?? []
    if (selectedAgentId === null && currentAgentProfileQuery.isLoading) {
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
    selectedAgentId,
    skillsQuery.data,
  ])
  const slashCommandState = React.useMemo(
    () => getSlashCommandState(text, availableSkills),
    [availableSkills, text],
  )
  const matchedSlashSkill = slashCommandState?.exactSkill ?? null
  const selectedSlashSkill = slashCommandState?.suggestions[selectedSlashSkillIndex] ?? null

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus()
    },
    setInitialText: (newText: string) => {
      setText(newText)
    }
  }))

  useEffect(() => {
    if (textareaRef.current && !isBusy) {
      textareaRef.current.focus()

      const timer1 = setTimeout(() => {
        textareaRef.current?.focus()
      }, 50)

      const timer2 = setTimeout(() => {
        textareaRef.current?.focus()
      }, 150)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
    return undefined
  }, [isBusy])

  useEffect(() => {
    setSelectedSlashSkillIndex(0)
  }, [slashCommandState?.query, slashCommandState?.suggestions.length])

  const handleSelectSlashSkill = (skill: AgentSkill) => {
    setText((currentText) => replaceSlashCommandSelection(currentText, skill))
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleSubmit = async () => {
    const expandedText = expandSlashCommandText(text, matchedSlashSkill)
    const message = buildMessageWithImages(expandedText, imageAttachments)
    if (!message || isBusy || submitInFlightRef.current) return

    submitInFlightRef.current = true
    setIsSubmitting(true)

    try {
      const didSubmit = await onSubmit(message)
      if (didSubmit !== false) {
        setText("")
        setImageAttachments([])
      }
    } catch (error) {
      console.error("Failed to submit text input panel message:", error)
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { attachments, errors } = await readImageAttachments(
        e.target.files,
        imageAttachments
      )

      if (attachments.length > 0) {
        setImageAttachments((prev) => [...prev, ...attachments])
      }

      if (errors.length > 0) {
        window.alert(errors.join("\n"))
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to attach image.")
    } finally {
      e.target.value = ""
    }
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeImageAttachment = (attachmentId: string) => {
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

    const isModifierPressed = e.metaKey || e.ctrlKey;

    if (isModifierPressed && (e.key === '=' || e.key === 'Equal' || e.key === '+')) {
      return;
    }

    if (isModifierPressed && e.key === '-') {
      return;
    }

    if (isModifierPressed && e.key === '0') {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  const hasMessageContent = text.trim().length > 0 || imageAttachments.length > 0

  if (isProcessing && agentProgress) {
    return (
      <div className={cn(
        "text-input-panel modern-text-strong flex h-full w-full items-center justify-center rounded-xl",
        isDark ? "dark" : ""
      )}>
        <AgentProcessingView
          agentProgress={agentProgress}
          isProcessing={isProcessing}
          variant="overlay"
          showBackgroundSpinner={true}
          className="mx-4 w-full"
        />
      </div>
    )
  }

  return (
    <div className={cn(
      "text-input-panel modern-text-strong flex h-full w-full flex-col gap-3 rounded-xl p-3",
      isDark ? "dark" : ""
    )}>
      {/* Show agent progress if available */}
      {isProcessing && agentProgress ? (
        <AgentProcessingView
          agentProgress={agentProgress}
          isProcessing={isProcessing}
          variant="default"
          showBackgroundSpinner={true}
          className="flex-1"
        />
      ) : (
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="modern-text-muted text-[11px] uppercase tracking-wide">Agent</span>
              <AgentSelector
                selectedAgentId={selectedAgentId}
                onSelectAgent={onSelectAgent}
                compact
              />
            </div>
            {continueConversationTitle && (
              <div className="flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <span className="opacity-70">Continuing:</span>
                <span className="max-w-[200px] truncate font-medium">{continueConversationTitle}</span>
              </div>
            )}
          </div>
          <div className="modern-text-muted flex items-center justify-between gap-2 text-xs">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="min-w-0 truncate">
                <span className="hidden sm:inline">Type your message • Enter to send • Shift+Enter for new line • Esc to cancel • Type `/` for skills</span>
                <span className="sm:hidden">Enter to send • Type `/` for skills</span>
              </span>
              {matchedSlashSkill && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-3 w-3" />
                  Skill: {matchedSlashSkill.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <PredefinedPromptsMenu
                onSelectPrompt={(content) => setText(content)}
                disabled={isBusy}
                className="h-6 w-6"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={isBusy || imageAttachments.length >= MAX_IMAGE_ATTACHMENTS}
                onClick={handleImageButtonClick}
                title="Attach image"
              >
                <ImagePlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
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
          {slashCommandState?.shouldShowSuggestions && (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
              <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Skill commands
              </div>
              <div
                role="listbox"
                aria-label="Skill slash command suggestions"
                className="max-h-40 overflow-y-auto p-1"
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
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className={cn(
              "modern-input modern-text-strong min-h-0 flex-1 resize-none border-0",
              "bg-transparent focus:border-ring focus:ring-1 focus:ring-ring",
              "placeholder:modern-text-muted",
            )}
            disabled={isBusy}
            aria-label="Message input"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelection}
          />
        </div>
      )}

      <div className="modern-text-muted flex items-center justify-between text-xs">
        <div>
          {(text.length > 0 || imageAttachments.length > 0) && (
            <span>
              {text.length} character{text.length !== 1 ? "s" : ""}
              {imageAttachments.length > 0 && ` • ${imageAttachments.length} image${imageAttachments.length !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="rounded px-2 py-1 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              void handleSubmit()
            }}
            disabled={!hasMessageContent || isBusy}
            className={cn(
              "rounded px-2 py-1 transition-colors",
              hasMessageContent && !isBusy
                ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                : "cursor-not-allowed opacity-50",
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
})

TextInputPanel.displayName = "TextInputPanel"
