import { cn } from "@renderer/lib/utils"
import React, { createContext, useContext, useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

/**
 * Context for settings search filtering.
 * When a non-empty string, controls will auto-hide if their label doesn't match.
 */
export const SettingsSearchContext = createContext<string>("")

/** Extract searchable text from a label prop (string or ControlLabel element) */
function extractLabelText(label: React.ReactNode): string {
  if (typeof label === "string") return label
  if (label && typeof label === "object" && "props" in label) {
    const props = (label as React.ReactElement).props as Record<string, unknown>
    if (typeof props.label === "string") return props.label
    if (typeof props.tooltip === "string")
      return `${props.label ?? ""} ${props.tooltip}`
  }
  return ""
}

/** Highlight matching substring in text */
export function HighlightMatch({
  text,
  query,
}: {
  text: string
  query: string
}) {
  if (!query) return <>{text}</>
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700/60">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/** Apply search highlighting to a Control label */
function highlightLabel(
  label: React.ReactNode,
  query: string,
): React.ReactNode {
  if (!query) return label
  if (typeof label === "string")
    return <HighlightMatch text={label} query={query} />
  if (label && typeof label === "object" && "props" in label) {
    const el = label as React.ReactElement
    const props = el.props as Record<string, unknown>
    if (typeof props.label === "string") {
      const { label: origLabel, ...rest } = props
      return (
        <ControlLabel
          label={<HighlightMatch text={origLabel as string} query={query} />}
          {...rest}
        />
      )
    }
  }
  return label
}

export const Control = ({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) => {
  const searchQuery = useContext(SettingsSearchContext)
  const text = extractLabelText(label)
  // When searching, hide controls that don't match
  if (
    searchQuery &&
    text &&
    !text.toLowerCase().includes(searchQuery.toLowerCase())
  ) {
    return null
  }
  const displayLabel = highlightLabel(label, searchQuery)

  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-5",
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-[52%]">
        <div className="break-words text-sm font-medium leading-5">
          {displayLabel}
        </div>
      </div>
      <div className="flex w-full min-w-0 items-center justify-start sm:max-w-[48%] sm:justify-end">
        {children}
      </div>
    </div>
  )
}

export const ControlLabel = ({
  label,
  tooltip,
}: {
  label: React.ReactNode
  tooltip?: React.ReactNode
}) => {
  if (!tooltip) {
    return <span className="text-sm font-medium">{label}</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="break-words text-sm font-medium">{label}</span>
      <TooltipProvider delayDuration={0} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="text-muted-foreground hover:text-foreground h-3.5 w-3.5 shrink-0 cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            collisionPadding={20}
            avoidCollisions={true}
            sideOffset={6}
            className="z-[99999] max-w-xs"
          >
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export const ControlGroup = ({
  children,
  className,
  id,
  title,
  endDescription,
  collapsible = false,
  defaultCollapsed = false,
  forceOpen,
  onOpenChange,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  title?: React.ReactNode
  endDescription?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  /** When true, overrides internal collapsed state and forces the group open */
  forceOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const isCollapsed = forceOpen ? false : collapsed

  return (
    <div id={id} className={className}>
      {title && collapsible ? (
        <div className="rounded-lg border">
          <button
            type="button"
            className="hover:bg-muted/30 flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors"
            onClick={() => {
              const newCollapsed = !collapsed
              setCollapsed(newCollapsed)
              onOpenChange?.(!newCollapsed)
            }}
            aria-expanded={!isCollapsed}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {isCollapsed ? (
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              ) : (
                <ChevronDown className="text-muted-foreground h-4 w-4" />
              )}
              <span>{title}</span>
            </span>
          </button>

          {!isCollapsed && (
            <>
              <div className="divide-y border-t">{children}</div>
              {endDescription && (
                <div className="text-muted-foreground border-t px-3 py-2 text-xs sm:flex sm:justify-end sm:text-right">
                  <div className="w-full whitespace-normal break-words sm:max-w-[70%]">
                    {endDescription}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {title && (
            <div className="mb-3">
              <span className="text-sm font-semibold">{title}</span>
            </div>
          )}
          {(!collapsible || !isCollapsed) && (
            <>
              <div className="divide-y rounded-lg border">{children}</div>
              {endDescription && (
                <div className="text-muted-foreground mt-2 text-xs sm:flex sm:justify-end sm:text-right">
                  <div className="w-full whitespace-normal break-words sm:max-w-[70%]">
                    {endDescription}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
