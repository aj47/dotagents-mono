import { cn } from "@renderer/lib/utils"
import React, { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

export const Control = ({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-5",
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-[52%]">
        <div className="text-sm font-medium leading-5 break-words">{label}</div>
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
      <span className="text-sm font-medium break-words">{label}</span>
      <TooltipProvider delayDuration={0} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help transition-colors hover:text-foreground" />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="start"
            collisionPadding={20}
            avoidCollisions={true}
            sideOffset={8}
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
  title,
  endDescription,
  collapsible = false,
  defaultCollapsed = false,
}: {
  children: React.ReactNode
  className?: string
  title?: React.ReactNode
  endDescription?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div className={className}>
      {title && (
        collapsible ? (
          <button
            type="button"
            className="flex items-center gap-1.5 mb-3 group cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
            <span className="text-sm font-semibold">{title}</span>
          </button>
        ) : (
          <div className="mb-3">
            <span className="text-sm font-semibold">{title}</span>
          </div>
        )
      )}
      {(!collapsible || !collapsed) && (
        <>
          <div className="divide-y rounded-lg border">{children}</div>
          {endDescription && (
            <div className="mt-2 text-xs text-muted-foreground sm:flex sm:justify-end sm:text-right">
              <div className="w-full break-words whitespace-normal sm:max-w-[70%]">
                {endDescription}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
