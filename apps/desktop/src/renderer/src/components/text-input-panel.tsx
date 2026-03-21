import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Textarea } from "@renderer/components/ui/textarea"
import { Button } from "@renderer/components/ui/button"
import { cn } from "@renderer/lib/utils"
import { AgentProcessingView } from "./agent-processing-view"
import { AgentProgressUpdate } from "../../../shared/types"
import { useTheme } from "@renderer/contexts/theme-context"
import { PredefinedPromptsMenu } from "./predefined-prompts-menu"
import { AgentSelector } from "./agent-selector"
import { ImagePlus, X } from "lucide-react"
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
  showAgentSelector?: boolean
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
  showAgentSelector = true,
}, ref) => {
  const [text, setText] = useState(initialText || "")
  const [imageAttachments, setImageAttachments] = useState<MessageImageAttachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitInFlightRef = useRef(false)
  const { isDark } = useTheme()
  const isBusy = isProcessing || isSubmitting

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

  const handleSubmit = async () => {
    const message = buildMessageWithImages(text, imageAttachments)
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
      "text-input-panel modern-text-strong flex h-full w-full flex-col gap-2.5 rounded-xl p-3",
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
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
              {showAgentSelector && (
                <AgentSelector
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={onSelectAgent}
                  compact
                />
              )}
            </div>
            {continueConversationTitle && (
              <div className="flex max-w-full items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <span className="opacity-70">Continuing:</span>
                <span className="max-w-[180px] truncate font-medium sm:max-w-[220px]">{continueConversationTitle}</span>
              </div>
            )}
          </div>
          <div className="modern-text-muted flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px]">
            <span className="min-w-0 flex-1 leading-relaxed">
              <span className="hidden sm:inline">Enter to send • Shift+Enter new line • Esc close</span>
              <span className="sm:hidden">Enter send • Esc close</span>
            </span>
            <div className="flex shrink-0 items-center gap-1">
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
            <div className="flex w-full gap-1.5 overflow-x-auto pb-1">
              {imageAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border"
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
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            autoFocus
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
