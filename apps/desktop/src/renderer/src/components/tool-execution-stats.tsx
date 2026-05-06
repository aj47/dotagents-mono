import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { cn } from "@renderer/lib/utils"
import {
  formatToolExecutionDuration,
  formatToolExecutionTokens,
  truncateToolExecutionSubagentId,
} from "@dotagents/shared/tool-execution-display"

interface ToolExecutionStatsProps {
  stats: {
    durationMs?: number
    totalTokens?: number
    model?: string
  }
  subagentId?: string
  compact?: boolean
  className?: string
}

/**
 * A component for displaying tool execution stats.
 * 
 * Visual (compact): `haiku • 3.1s • 17k tokens`
 * Visual (expanded): Full breakdown with model, duration, and token details
 */
export function ToolExecutionStats({
  stats,
  subagentId,
  compact = true,
  className,
}: ToolExecutionStatsProps) {
  const { durationMs, totalTokens, model } = stats

  // If no stats to display, return null
  if (!durationMs && !totalTokens && !model && !subagentId) {
    return null
  }

  // Build stats parts for display
  const parts: string[] = []
  if (model) parts.push(model)
  if (durationMs !== undefined) parts.push(formatToolExecutionDuration(durationMs))
  if (totalTokens !== undefined) parts.push(`${formatToolExecutionTokens(totalTokens)} tokens`)

  // Truncated subagent ID for display
  const displaySubagentId = subagentId ? truncateToolExecutionSubagentId(subagentId) : null

  if (compact) {
    // Compact mode: single line with dot separators
    const displayParts = [...parts]
    if (displaySubagentId) displayParts.unshift(displaySubagentId)

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center text-[10px] text-muted-foreground font-mono cursor-help",
                className
              )}
            >
              {displayParts.join(" • ")}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="space-y-0.5">
              {subagentId && <p>Subagent: {subagentId}</p>}
              {model && <p>Model: {model}</p>}
              {durationMs !== undefined && <p>Duration: {formatToolExecutionDuration(durationMs)}</p>}
              {totalTokens !== undefined && <p>Tokens: {totalTokens.toLocaleString()}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Expanded mode: detailed breakdown
  return (
    <div className={cn("text-xs space-y-1", className)}>
      {displaySubagentId && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Subagent:</span>
          <span className="font-mono text-foreground">{displaySubagentId}</span>
          {subagentId && subagentId !== displaySubagentId && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={subagentId}>
              ({subagentId})
            </span>
          )}
        </div>
      )}
      {model && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Model:</span>
          <span className="font-mono text-foreground">{model}</span>
        </div>
      )}
      {durationMs !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-mono text-foreground">{formatToolExecutionDuration(durationMs)}</span>
          <span className="text-[10px] text-muted-foreground">({durationMs.toLocaleString()}ms)</span>
        </div>
      )}
      {totalTokens !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Tokens:</span>
          <span className="font-mono text-foreground">{totalTokens.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
