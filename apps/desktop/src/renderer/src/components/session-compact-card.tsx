import React, { useCallback, useMemo } from "react"
import { cn } from "@renderer/lib/utils"
import type { AgentProgressUpdate } from "@shared/types"
import { Shield, Check, XCircle, Moon, Square, Maximize2 } from "lucide-react"
import { LoadingSpinner } from "./ui/loading-spinner"
import { normalizeAgentConversationState } from "@dotagents/shared"
import dayjs from "dayjs"

interface SessionCompactCardProps {
  progress: AgentProgressUpdate
  sessionId: string
  onClick: () => void
  onStop?: () => void
  isExpanded?: boolean
  isDragTarget?: boolean
  isDragging?: boolean
}

function getCompactSummary(progress: AgentProgressUpdate): string {
  // Priority: userResponse > latestSummary > last assistant message > streaming > fallback
  if (progress.userResponse) {
    return progress.userResponse
  }
  if (progress.latestSummary?.actionSummary) {
    return progress.latestSummary.actionSummary
  }
  // Last assistant message from conversation history
  if (progress.conversationHistory && progress.conversationHistory.length > 0) {
    for (let i = progress.conversationHistory.length - 1; i >= 0; i--) {
      const msg = progress.conversationHistory[i]
      if (msg.role === "assistant" && msg.content) {
        const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
        return text
      }
    }
  }
  if (progress.streamingContent?.text) {
    return progress.streamingContent.text
  }
  return "Starting..."
}

function getTimeSince(progress: AgentProgressUpdate): string {
  const history = progress.conversationHistory
  const lastHistoryTs = history && history.length > 0
    ? (history[history.length - 1].timestamp ?? 0) : 0
  const lastStepTs = progress.steps?.length > 0
    ? progress.steps[progress.steps.length - 1].timestamp : 0
  const ts = Math.max(lastHistoryTs, lastStepTs)
  if (!ts) return ""

  const now = dayjs()
  const date = dayjs(ts)
  const diffSeconds = Math.max(0, now.diff(date, "second"))
  const diffMinutes = Math.max(0, now.diff(date, "minute"))
  const diffHours = Math.max(0, now.diff(date, "hour"))
  if (diffSeconds < 60) return `${diffSeconds}s`
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return `${diffHours}h`
  return date.format("MMM D")
}

export const SessionCompactCard = React.memo(function SessionCompactCard({
  progress,
  sessionId,
  onClick,
  onStop,
  isDragTarget,
  isDragging,
}: SessionCompactCardProps) {
  const { isComplete, steps } = progress

  const hasErrors = steps.some(
    (step) => step.status === "error" || step.toolResult?.error,
  )
  const wasStopped = progress.finalContent?.includes("emergency kill switch") ||
    steps?.some(step => step.title === "Agent stopped" ||
      step.description?.includes("emergency kill switch"))

  const conversationState = progress.conversationState
    ? normalizeAgentConversationState(progress.conversationState, isComplete ? "complete" : "running")
    : progress.pendingToolApproval
      ? "needs_input"
      : hasErrors || wasStopped
        ? "blocked"
        : isComplete
          ? "complete"
          : "running"

  const statusIndicator = useMemo(() => {
    const isSnoozed = progress.isSnoozed
    if (conversationState === "needs_input") {
      return <Shield className="h-3.5 w-3.5 shrink-0 text-amber-500 animate-pulse" />
    }
    if (conversationState === "running") {
      return <LoadingSpinner size="sm" className="[&>div]:gap-0 [&_img]:h-3.5 [&_img]:w-3.5" />
    }
    if (isSnoozed) {
      return <Moon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    }
    if (conversationState === "blocked") {
      return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
    }
    return <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
  }, [conversationState, progress.isSnoozed])

  const title = useMemo(() => {
    if (progress.conversationTitle) return progress.conversationTitle
    const firstUser = progress.conversationHistory?.find(m => m.role === "user")
    if (firstUser?.content) {
      return typeof firstUser.content === "string" ? firstUser.content : JSON.stringify(firstUser.content)
    }
    return `Session ${sessionId.substring(0, 8)}`
  }, [progress.conversationTitle, progress.conversationHistory, sessionId])

  const summary = useMemo(() => getCompactSummary(progress), [progress])
  const timeAgo = useMemo(() => getTimeSince(progress), [progress])
  const agentName = progress.profileName ?? progress.acpSessionInfo?.agentTitle ?? progress.acpSessionInfo?.agentName

  const handleStop = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onStop?.()
  }, [onStop])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      className={cn(
        "group/card flex items-start gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left transition-all cursor-pointer",
        "hover:bg-accent/50 hover:border-border/80",
        conversationState === "needs_input" && "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10",
        isDragTarget && "ring-2 ring-blue-500 ring-offset-2",
        isDragging && "opacity-50",
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">{statusIndicator}</div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium leading-tight">{title}</span>
          {agentName && (
            <span className="shrink-0 text-[10px] text-muted-foreground/70">· {agentName}</span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </div>

      {/* Time + hover actions */}
      <div className="flex shrink-0 items-center gap-1">
        {timeAgo && (
          <span className="text-[10px] tabular-nums text-muted-foreground group-hover/card:hidden">{timeAgo}</span>
        )}
        {/* Hover actions */}
        <div className="hidden items-center gap-0.5 group-hover/card:flex">
          <button type="button" onClick={onClick} className="rounded p-0.5 hover:bg-muted" title="Expand">
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
          </button>
          {!isComplete && onStop && (
            <button type="button" onClick={handleStop} className="rounded p-0.5 hover:bg-muted" title="Stop">
              <Square className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

