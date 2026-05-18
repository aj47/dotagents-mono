import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { cn } from "@renderer/lib/utils"
import {
  getToolExecutionStatsDisplayState,
  type ToolExecutionStatsLike,
} from "@dotagents/shared/session-presentation"

interface ToolExecutionStatsProps {
  stats: ToolExecutionStatsLike
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
  const statsDisplayState = getToolExecutionStatsDisplayState({
    ...stats,
    subagentId: subagentId ?? stats.subagentId,
  })
  const subagentDetail = statsDisplayState.details.find((detail) => detail.key === "subagent")
  const modelDetail = statsDisplayState.details.find((detail) => detail.key === "model")
  const durationDetail = statsDisplayState.details.find((detail) => detail.key === "duration")
  const tokensDetail = statsDisplayState.details.find((detail) => detail.key === "tokens")
  const rawSubagentId = statsDisplayState.rawSubagentId
  const shouldShowRawSubagentId =
    rawSubagentId != null &&
    rawSubagentId !== statsDisplayState.displaySubagentId

  if (!statsDisplayState.shouldRender) {
    return null
  }

  if (compact) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={statsDisplayState.accessibilityLabel}
              className={cn(
                "inline-flex items-center text-[10px] text-muted-foreground font-mono cursor-help",
                className
              )}
            >
              {statsDisplayState.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="space-y-0.5">
              {statsDisplayState.details.map((detail) => (
                <p key={detail.key}>{detail.label}: {detail.value}</p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Expanded mode: detailed breakdown
  return (
    <div className={cn("text-xs space-y-1", className)}>
      {subagentDetail && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{subagentDetail.label}:</span>
          <span className="font-mono text-foreground">{subagentDetail.compactValue}</span>
          {shouldShowRawSubagentId && (
            <span
              className="text-[10px] text-muted-foreground truncate max-w-[150px]"
              title={rawSubagentId}
            >
              ({rawSubagentId})
            </span>
          )}
        </div>
      )}
      {modelDetail && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{modelDetail.label}:</span>
          <span className="font-mono text-foreground">{modelDetail.value}</span>
        </div>
      )}
      {durationDetail && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{durationDetail.label}:</span>
          <span className="font-mono text-foreground">{durationDetail.value}</span>
          {durationDetail.rawValue && (
            <span className="text-[10px] text-muted-foreground">({durationDetail.rawValue})</span>
          )}
        </div>
      )}
      {tokensDetail && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{tokensDetail.label}:</span>
          <span className="font-mono text-foreground">{tokensDetail.value}</span>
        </div>
      )}
    </div>
  )
}
