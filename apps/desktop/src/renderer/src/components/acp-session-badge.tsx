import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { Badge } from "./ui/badge"
import { cn } from "@renderer/lib/utils"

interface ACPSessionBadgeProps {
  info: {
    agentTitle?: string
    agentVersion?: string
    currentModel?: string
    currentMode?: string
    configOptions?: Array<{
      id: string
      name: string
      currentValue: string
      options: Array<{ value: string; name: string }>
    }>
  }
  className?: string
}

function getConfigOptionLabel(option: {
  currentValue: string
  options?: Array<{ value: string; name: string }> | unknown
}): string {
  const values = Array.isArray(option.options) ? option.options : []
  return values.find((value) => value.value === option.currentValue)?.name || option.currentValue
}

/**
 * A compact badge component showing ACP session agent info.
 * Displays agent title/version and model/mode in a compact format.
 * 
 * Visual example: `[Claude Code v0.12.6] [Sonnet 4.5]`
 */
export function ACPSessionBadge({ info, className }: ACPSessionBadgeProps) {
  const { agentTitle, agentVersion, currentModel, currentMode, configOptions } = info

  // Build agent label (e.g., "Claude Code v0.12.6")
  const agentLabel = agentTitle
    ? agentVersion
      ? `${agentTitle} v${agentVersion}`
      : agentTitle
    : null

  // Build model label (e.g., "Sonnet 4.5" or "claude-3-5-sonnet")
  const modelLabel = currentModel || null
  const modelBadgeLabel = modelLabel
    ? currentMode
      ? `${modelLabel} • ${currentMode}`
      : modelLabel
    : null

  // If nothing to display, return null
  if (!agentLabel && !modelLabel) {
    return null
  }

  // Build tooltip content with all available info
  const tooltipLines: string[] = []
  if (agentTitle) tooltipLines.push(`Agent: ${agentTitle}`)
  if (agentVersion) tooltipLines.push(`Version: ${agentVersion}`)
  if (currentModel) tooltipLines.push(`Model: ${currentModel}`)
  if (currentMode) tooltipLines.push(`Mode: ${currentMode}`)
  for (const option of configOptions || []) {
    if (option.id === "model" || option.id === "mode") continue
    const label = getConfigOptionLabel(option)
    tooltipLines.push(`${option.name}: ${label}`)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 cursor-help",
              className
            )}
          >
            {agentLabel && (
              <Badge
                variant="secondary"
                className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-medium"
              >
                <span className="truncate">{agentLabel}</span>
              </Badge>
            )}
            {modelBadgeLabel && (
              <Badge
                variant="outline"
                className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"
              >
                <span className="truncate">{modelBadgeLabel}</span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <div className="space-y-0.5">
            {tooltipLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
