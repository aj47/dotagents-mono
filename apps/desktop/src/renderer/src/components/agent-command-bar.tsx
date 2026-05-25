import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores"
import { queryClient } from "@renderer/lib/queries"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  SkipForward,
  X,
  Send,
  Layers,
} from "lucide-react"
import { useMutation } from "@tanstack/react-query"

const IS_MAC =
  typeof navigator !== "undefined" &&
  navigator.platform.toLowerCase().includes("mac")
const SHORTCUT_MOD_PREFIX = IS_MAC ? "⌘" : "Ctrl+"
const PREVIOUS_ENTRY_SHORTCUT = `${SHORTCUT_MOD_PREFIX}[`
const NEXT_ENTRY_SHORTCUT = `${SHORTCUT_MOD_PREFIX}]`
const SKIP_ENTRY_SHORTCUT = `${SHORTCUT_MOD_PREFIX}S`
const NEW_SLOT_SHORTCUT = `${SHORTCUT_MOD_PREFIX}N`

interface AgentCommandBarProps {
  onOpenSessionDialog: (initialText: string, onSubmitted: () => void) => void
  className?: string
}

export function AgentCommandBar({
  onOpenSessionDialog,
  className,
}: AgentCommandBarProps) {
  const isCommandQueueActive = useAgentStore((s) => s.isCommandQueueActive)
  const commandQueue = useAgentStore((s) => s.commandQueue)
  const commandQueueIndex = useAgentStore((s) => s.commandQueueIndex)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const exitCommandQueue = useAgentStore((s) => s.exitCommandQueue)
  const advanceCommandQueue = useAgentStore((s) => s.advanceCommandQueue)
  const goBackCommandQueue = useAgentStore((s) => s.goBackCommandQueue)
  const skipCommandEntry = useAgentStore((s) => s.skipCommandEntry)
  const appendNewSlot = useAgentStore((s) => s.appendNewSlot)
  const appendUserMessageToSession = useAgentStore(
    (s) => s.appendUserMessageToSession,
  )

  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const submitInFlightRef = useRef(false)

  const currentEntry = commandQueue[commandQueueIndex] ?? null
  const currentProgress = currentEntry?.sessionId
    ? agentProgressById.get(currentEntry.sessionId)
    : null
  const currentTitle = currentProgress?.conversationTitle ?? "Untitled"
  const currentConversationId = currentProgress?.conversationId
  const currentSessionId = currentEntry?.sessionId

  const entryConfig = {
    new: {
      placeholder: "Describe a new task to dispatch...",
      action: "Dispatch",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    steer: {
      placeholder: "Steer this agent mid-run...",
      action: "Steer",
      colorClass: "text-blue-600 dark:text-blue-400",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    reply: {
      placeholder: "Reply to this agent...",
      action: "Reply",
      colorClass: "text-violet-600 dark:text-violet-400",
      btnClass: "bg-violet-600 hover:bg-violet-700 text-white",
    },
  } as const

  const cfg = entryConfig[currentEntry?.kind ?? "new"]
  const progressPercent =
    commandQueue.length > 0
      ? Math.round((commandQueueIndex / commandQueue.length) * 100)
      : 0

  // Focus textarea and clear text when active entry changes
  useEffect(() => {
    if (!isCommandQueueActive) return undefined
    setText("")
    const t = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
    return () => window.clearTimeout(t)
  }, [isCommandQueueActive, commandQueueIndex])

  const sendMutation = useMutation({
    mutationFn: async (vars: {
      message: string
      conversationId?: string
      sessionId?: string
    }) => {
      return tipcClient.createMcpTextInput({
        text: vars.message,
        conversationId: vars.conversationId,
        sessionId: vars.sessionId,
        fromTile: true,
        startSnoozed: false,
      })
    },
    onSuccess: (data, vars) => {
      if (vars.sessionId && !data?.queued) {
        appendUserMessageToSession(vars.sessionId, vars.message)
      }
      if (vars.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", vars.conversationId],
        })
        queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
      }
    },
  })

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting || submitInFlightRef.current) return
    submitInFlightRef.current = true
    setIsSubmitting(true)
    try {
      if (currentEntry?.kind === "new") {
        const capturedText = text
        setText("")
        onOpenSessionDialog(capturedText, () => advanceCommandQueue())
        return
      }
      await sendMutation.mutateAsync({
        message: text,
        conversationId: currentConversationId,
        sessionId: currentSessionId,
      })
      setText("")
      advanceCommandQueue()
    } catch (error) {
      console.error("[AgentCommandBar] Submit failed:", error)
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }, [
    text,
    isSubmitting,
    currentEntry,
    currentConversationId,
    currentSessionId,
    sendMutation,
    advanceCommandQueue,
    onOpenSessionDialog,
  ])

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.metaKey || e.ctrlKey
      const isPlainMod = isMod && !e.altKey && !e.shiftKey

      if (isPlainMod && e.key === "[") {
        e.preventDefault()
        goBackCommandQueue()
        return
      }

      if (isPlainMod && e.key === "]") {
        e.preventDefault()
        advanceCommandQueue()
        return
      }

      if (!isMod && e.key === "Escape") {
        e.preventDefault()
        if (text) {
          setText("")
        } else {
          exitCommandQueue()
        }
        return
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        void handleSubmit()
        return
      }

      if (isPlainMod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        skipCommandEntry()
        return
      }

      if (isPlainMod && e.key.toLowerCase() === "n") {
        e.preventDefault()
        appendNewSlot()
        return
      }
    },
    [
      text,
      goBackCommandQueue,
      advanceCommandQueue,
      exitCommandQueue,
      handleSubmit,
      skipCommandEntry,
      appendNewSlot,
    ],
  )

  const adjustHeight = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  if (!isCommandQueueActive) return null

  const isFirstEntry = commandQueueIndex === 0
  const isLastEntry = commandQueueIndex >= commandQueue.length - 1
  const isBusy = isSubmitting || sendMutation.isPending

  return (
    <div
      className={cn(
        "bg-background border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]",
        className,
      )}
      role="region"
      aria-label="Multi-agent command queue"
    >
      {/* Progress bar */}
      <div className="bg-muted/60 h-0.5">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Header strip */}
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <Layers
            className="text-muted-foreground h-3.5 w-3.5"
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-[11px] font-semibold tabular-nums">
            {commandQueueIndex + 1} / {commandQueue.length}
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          {currentEntry?.kind === "new" ? (
            <span className={cn("text-xs font-semibold", cfg.colorClass)}>
              Dispatch new agent
            </span>
          ) : (
            <span className="text-xs">
              <span className={cn("font-semibold", cfg.colorClass)}>
                {cfg.action}
              </span>
              <span className="text-muted-foreground"> · {currentTitle}</span>
            </span>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            size="sm-icon"
            variant="ghost"
            onClick={goBackCommandQueue}
            disabled={isFirstEntry}
            title={`Previous entry (${PREVIOUS_ENTRY_SHORTCUT})`}
            aria-label="Previous entry"
            className="text-muted-foreground h-6 w-6 disabled:opacity-30"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm-icon"
            variant="ghost"
            onClick={advanceCommandQueue}
            disabled={isLastEntry}
            title={`Next entry (${NEXT_ENTRY_SHORTCUT})`}
            aria-label="Next entry"
            className="text-muted-foreground h-6 w-6 disabled:opacity-30"
          >
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm-icon"
            variant="ghost"
            onClick={skipCommandEntry}
            title={`Skip to end (${SKIP_ENTRY_SHORTCUT})`}
            aria-label="Skip current entry"
            className="text-muted-foreground h-6 w-6"
          >
            <SkipForward className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm-icon"
            variant="ghost"
            onClick={appendNewSlot}
            title={`Add new task slot (${NEW_SLOT_SHORTCUT})`}
            aria-label="Add new session slot"
            className="text-muted-foreground h-6 w-6"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm-icon"
            variant="ghost"
            onClick={exitCommandQueue}
            title="Exit command queue (Esc)"
            aria-label="Exit command queue"
            className="text-muted-foreground h-6 w-6"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Adaptive input area */}
      <div className="flex items-end gap-2 px-3 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            adjustHeight(e.target)
          }}
          onKeyDown={handleTextareaKeyDown}
          placeholder={cfg.placeholder}
          rows={1}
          aria-label={cfg.placeholder}
          disabled={isBusy}
          className={cn(
            "bg-muted/30 min-h-[2rem] flex-1 resize-none rounded-md border px-3 py-1.5",
            "text-foreground placeholder:text-muted-foreground/60 text-sm",
            "focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/40",
            "disabled:opacity-50",
          )}
          style={{ overflowY: "hidden" }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={!text.trim() || isBusy}
          className={cn("shrink-0", cfg.btnClass)}
          aria-label={`${cfg.action} and advance`}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {cfg.action}
        </Button>
      </div>

      {/* Hotkey hint footer */}
      <div
        className="bg-muted/20 flex items-center gap-4 border-t px-3 py-1"
        aria-hidden="true"
      >
        {[
          [NEXT_ENTRY_SHORTCUT, "next"],
          [PREVIOUS_ENTRY_SHORTCUT, "prev"],
          [SKIP_ENTRY_SHORTCUT, "skip"],
          [NEW_SLOT_SHORTCUT, "new task"],
          ["Esc", "exit"],
        ].map(([key, label]) => (
          <span key={key} className="text-muted-foreground text-[10px]">
            <kbd className="font-mono">{key}</kbd> {label}
          </span>
        ))}
      </div>
    </div>
  )
}
