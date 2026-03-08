import React, { useState, useRef, useEffect } from "react"
import { cn } from "@renderer/lib/utils"
import { tipcClient } from "@renderer/lib/tipc-client"

export type ResizeHandlePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'

export interface ResizeHandleCommitMeta {
  source: 'pointer' | 'keyboard'
  position: ResizeHandlePosition
  startingSize?: { width: number; height: number }
}

interface ResizeHandleProps {
  className?: string
  position: ResizeHandlePosition
  disabled?: boolean
  onResizeStart?: (position: ResizeHandlePosition) => void
  onResize?: (delta: { width: number; height: number }) => void
  onResizeEnd?: (
    size: { width: number; height: number },
    meta?: ResizeHandleCommitMeta,
  ) => void | Promise<void>
  onResetSize?: (meta?: ResizeHandleCommitMeta) => void | Promise<void>
}

export const PANEL_KEYBOARD_RESIZE_STEP = 24

function isWidthAffectingResizeHandle(position: ResizeHandlePosition): boolean {
  switch (position) {
    case 'top-left':
    case 'top-right':
    case 'bottom-left':
    case 'bottom-right':
    case 'left':
    case 'right':
      return true
    default:
      return false
  }
}

function getResizeHandleLabel(position: ResizeHandlePosition): string {
  switch (position) {
    case 'top-left':
    case 'top-right':
    case 'bottom-left':
    case 'bottom-right':
      return 'Resize panel width and height'
    case 'left':
    case 'right':
      return 'Resize panel width'
    case 'top':
    case 'bottom':
    default:
      return 'Resize panel height'
  }
}

function getResizeHandleTitle(
  position: ResizeHandlePosition,
  resettable = false,
  keyboardAccessible = false,
): string {
  const title = getResizeHandleLabel(position)

  if (keyboardAccessible) {
    if (
      position === 'top-left' ||
      position === 'top-right' ||
      position === 'bottom-left' ||
      position === 'bottom-right'
    ) {
      return `${title} · Focus and press arrow keys to resize · Press Enter or double-click to reset to default size`
    }

    if (position === 'left' || position === 'right') {
      return `${title} · Focus and press left or right arrow keys to resize · Press Enter or double-click to reset to default size`
    }
  }

  if (!resettable) {
    return title
  }

  return `${title} · Double-click to reset to default size`
}

function getResizeHandleAriaLabel(
  position: ResizeHandlePosition,
  resettable = false,
  keyboardAccessible = false,
): string {
  const label = getResizeHandleLabel(position)

  if (keyboardAccessible) {
    if (
      position === 'top-left' ||
      position === 'top-right' ||
      position === 'bottom-left' ||
      position === 'bottom-right'
    ) {
      return `${label}. Focus and press arrow keys to nudge panel width or height. Press Enter to reset to default size.`
    }

    if (position === 'left' || position === 'right') {
      return `${label}. Focus and press Left or Right Arrow to nudge panel width. Press Enter to reset to default size.`
    }
  }

  if (resettable) {
    return `${label}. Double-click to reset to default size.`
  }

  return label
}

function getResizeHandleKeyShortcuts(position: ResizeHandlePosition): string | undefined {
  switch (position) {
    case 'top-left':
    case 'top-right':
    case 'bottom-left':
    case 'bottom-right':
      return 'ArrowUp ArrowDown ArrowLeft ArrowRight Enter'
    case 'left':
    case 'right':
      return 'ArrowLeft ArrowRight Enter'
    default:
      return undefined
  }
}

function getVisibleResizeHandleLabel(position: ResizeHandlePosition): string | null {
  if (!isWidthAffectingResizeHandle(position)) {
    return null
  }

  return position === 'left' || position === 'right'
    ? 'Resize'
    : 'Resize panel'
}

function getVisibleResizeHandleLabelClasses(position: ResizeHandlePosition): string {
  switch (position) {
    case 'top-left':
      return 'left-5 top-5 origin-top-left'
    case 'top-right':
      return 'right-5 top-5 origin-top-right'
    case 'bottom-left':
      return 'bottom-5 left-5 origin-bottom-left'
    case 'bottom-right':
      return 'bottom-5 right-5 origin-bottom-right'
    case 'left':
      return 'left-4 top-1/2 -translate-y-1/2 origin-left'
    case 'right':
      return 'right-4 top-1/2 -translate-y-1/2 origin-right'
    default:
      return ''
  }
}

export function getPanelResizeKeyboardAdjustment(
  position: ResizeHandlePosition,
  key: string,
): { width: number; height: number } | null {
  let width = 0
  let height = 0

  switch (position) {
    case 'right':
    case 'top-right':
    case 'bottom-right':
      width = key === 'ArrowRight'
        ? PANEL_KEYBOARD_RESIZE_STEP
        : key === 'ArrowLeft'
          ? -PANEL_KEYBOARD_RESIZE_STEP
          : 0
      break
    case 'left':
    case 'top-left':
    case 'bottom-left':
      width = key === 'ArrowLeft'
        ? PANEL_KEYBOARD_RESIZE_STEP
        : key === 'ArrowRight'
          ? -PANEL_KEYBOARD_RESIZE_STEP
          : 0
      break
  }

  switch (position) {
    case 'bottom':
    case 'bottom-left':
    case 'bottom-right':
      height = key === 'ArrowDown'
        ? PANEL_KEYBOARD_RESIZE_STEP
        : key === 'ArrowUp'
          ? -PANEL_KEYBOARD_RESIZE_STEP
          : 0
      break
    case 'top':
    case 'top-left':
    case 'top-right':
      height = key === 'ArrowUp'
        ? PANEL_KEYBOARD_RESIZE_STEP
        : key === 'ArrowDown'
          ? -PANEL_KEYBOARD_RESIZE_STEP
          : 0
      break
  }

  return width === 0 && height === 0 ? null : { width, height }
}

export function isPanelResizeKeyboardResetKey(key: string): boolean {
  return key === 'Enter'
}

export function ResizeHandle({
  className,
  position,
  disabled = false,
  onResizeStart,
  onResize,
  onResizeEnd,
  onResetSize,
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const isKeyboardAccessible = !disabled && !!onResetSize

  useEffect(() => {
    if (!isResizing || disabled) return undefined

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStart || !onResize) return

      const deltaX = e.screenX - resizeStart.x
      const deltaY = e.screenY - resizeStart.y

      let deltaWidth = 0
      let deltaHeight = 0

      // Calculate deltas based on resize position
      switch (position) {
        case 'bottom-right':
          deltaWidth = deltaX
          deltaHeight = deltaY
          break
        case 'bottom-left':
          deltaWidth = -deltaX
          deltaHeight = deltaY
          break
        case 'top-right':
          deltaWidth = deltaX
          deltaHeight = -deltaY
          break
        case 'top-left':
          deltaWidth = -deltaX
          deltaHeight = -deltaY
          break
        case 'right':
          deltaWidth = deltaX
          break
        case 'left':
          deltaWidth = -deltaX
          break
        case 'bottom':
          deltaHeight = deltaY
          break
        case 'top':
          deltaHeight = -deltaY
          break
      }

      onResize({ width: deltaWidth, height: deltaHeight })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!resizeStart || !onResizeEnd) return

      const deltaX = e.screenX - resizeStart.x
      const deltaY = e.screenY - resizeStart.y

      let finalWidth = resizeStart.width
      let finalHeight = resizeStart.height

      // Calculate final size based on resize position
      switch (position) {
        case 'bottom-right':
          finalWidth += deltaX
          finalHeight += deltaY
          break
        case 'bottom-left':
          finalWidth -= deltaX
          finalHeight += deltaY
          break
        case 'top-right':
          finalWidth += deltaX
          finalHeight -= deltaY
          break
        case 'top-left':
          finalWidth -= deltaX
          finalHeight -= deltaY
          break
        case 'right':
          finalWidth += deltaX
          break
        case 'left':
          finalWidth -= deltaX
          break
        case 'bottom':
          finalHeight += deltaY
          break
        case 'top':
          finalHeight -= deltaY
          break
      }

      void onResizeEnd(
        { width: finalWidth, height: finalHeight },
        {
          source: 'pointer',
          position,
          startingSize: {
            width: resizeStart.width,
            height: resizeStart.height,
          },
        },
      )
      setIsResizing(false)
      setResizeStart(null)
      document.body.style.cursor = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    // Set cursor style based on resize position
    let cursor = "nwse-resize"
    switch (position) {
      case 'top-left':
      case 'bottom-right':
        cursor = "nwse-resize"
        break
      case 'top-right':
      case 'bottom-left':
        cursor = "nesw-resize"
        break
      case 'left':
      case 'right':
        cursor = "ew-resize"
        break
      case 'top':
      case 'bottom':
        cursor = "ns-resize"
        break
    }
    document.body.style.cursor = cursor

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
    }
  }, [isResizing, resizeStart, position, disabled, onResize, onResizeEnd])

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    try {
      // Get current window size
      const windowSize = await tipcClient.getPanelSize()
      if (!windowSize || typeof windowSize !== 'object' || !('width' in windowSize) || !('height' in windowSize)) {
        console.error("Invalid window size response:", windowSize)
        return
      }

      setIsResizing(true)
      setResizeStart({
        x: e.screenX,
        y: e.screenY,
        width: (windowSize as { width: number; height: number }).width,
        height: (windowSize as { width: number; height: number }).height,
      })

      onResizeStart?.(position)
    } catch (error) {
      console.error("Failed to get panel size:", error)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disabled || !onResetSize) return

    e.preventDefault()
    e.stopPropagation()
    void onResetSize({ source: 'pointer', position })
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !isKeyboardAccessible) return

    const wantsReset = isPanelResizeKeyboardResetKey(e.key)
    const adjustment = getPanelResizeKeyboardAdjustment(position, e.key)

    if (!adjustment && !wantsReset) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    try {
      const windowSize = await tipcClient.getPanelSize()
      if (
        !windowSize ||
        typeof windowSize !== 'object' ||
        !('width' in windowSize) ||
        !('height' in windowSize)
      ) {
        console.error('Invalid window size response:', windowSize)
        return
      }

      const startingSize = {
        width: (windowSize as { width: number; height: number }).width,
        height: (windowSize as { width: number; height: number }).height,
      }

      if (wantsReset) {
        await onResetSize?.({
          source: 'keyboard',
          position,
          startingSize,
        })
        return
      }

      if (!onResizeEnd) return

      await onResizeEnd({
        width: startingSize.width + adjustment.width,
        height: startingSize.height + adjustment.height,
      }, {
        source: 'keyboard',
        position,
        startingSize,
      })
    } catch (error) {
      console.error('Failed to resize panel with keyboard:', error)
    }
  }

  // Get cursor class based on position
  const getCursorClass = () => {
    switch (position) {
      case 'top-left':
      case 'bottom-right':
        return "cursor-nwse-resize"
      case 'top-right':
      case 'bottom-left':
        return "cursor-nesw-resize"
      case 'left':
      case 'right':
        return "cursor-ew-resize"
      case 'top':
      case 'bottom':
        return "cursor-ns-resize"
      default:
        return "cursor-pointer"
    }
  }

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return "absolute top-0 left-0"
      case 'top-right':
        return "absolute top-0 right-0"
      case 'bottom-left':
        return "absolute bottom-0 left-0"
      case 'bottom-right':
        return "absolute bottom-0 right-0"
      case 'top':
        return "absolute top-0 left-1/2 -translate-x-1/2"
      case 'bottom':
        return "absolute bottom-0 left-1/2 -translate-x-1/2"
      case 'left':
        return "absolute left-0 top-1/2 -translate-y-1/2"
      case 'right':
        return "absolute right-0 top-1/2 -translate-y-1/2"
      default:
        return ""
    }
  }

  // Get size classes based on position
  const getSizeClasses = () => {
    switch (position) {
      case 'top-left':
      case 'top-right':
      case 'bottom-left':
      case 'bottom-right':
        return "w-4 h-4"
      case 'top':
      case 'bottom':
        return "w-full h-2"
      case 'left':
      case 'right':
        return "w-2 h-full"
      default:
        return "w-4 h-4"
    }
  }

  const isCornerHandle =
    position === 'top-left' ||
    position === 'top-right' ||
    position === 'bottom-left' ||
    position === 'bottom-right'
  const isVerticalEdgeHandle = position === 'left' || position === 'right'
  const visibleHandleLabel = !disabled && onResetSize
    ? getVisibleResizeHandleLabel(position)
    : null

  return (
    <div
      ref={handleRef}
      className={cn(
        "group/panel-resize rounded-sm transition-colors duration-200 outline-none",
        getPositionClasses(),
        getSizeClasses(),
        getCursorClass(),
        disabled
          ? "opacity-30 cursor-not-allowed"
          : isResizing
            ? "bg-blue-500/12"
            : cn(
                "bg-transparent hover:bg-blue-500/8",
                isKeyboardAccessible && "focus-visible:bg-blue-500/8 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1",
              ),
        className,
      )}
      data-panel-resize-handle={position}
      data-panel-resize-resettable={onResetSize ? "true" : undefined}
      title={getResizeHandleTitle(position, !!onResetSize, isKeyboardAccessible)}
      aria-label={getResizeHandleAriaLabel(position, !!onResetSize, isKeyboardAccessible)}
      aria-keyshortcuts={isKeyboardAccessible ? getResizeHandleKeyShortcuts(position) : undefined}
      tabIndex={isKeyboardAccessible && !isResizing ? 0 : undefined}
      onMouseDown={handleMouseDown}
      onKeyDown={isKeyboardAccessible ? handleKeyDown : undefined}
      onDoubleClick={onResetSize ? handleDoubleClick : undefined}
      style={{
        zIndex: 1000,
        userSelect: "none",
      }}
    >
      {isCornerHandle ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0.5 flex items-center justify-center rounded-sm border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-200",
            isResizing
              ? "border-blue-500/80 bg-blue-500/15 text-blue-500"
              : "text-muted-foreground/70 opacity-80 group-hover/panel-resize:opacity-100 group-hover/panel-resize:border-blue-500/60 group-hover/panel-resize:bg-blue-500/10 group-focus-visible/panel-resize:opacity-100 group-focus-visible/panel-resize:border-blue-500/70 group-focus-visible/panel-resize:bg-blue-500/12",
          )}
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M12.5 12.5H9.5M12.5 12.5V9.5M12.5 12.5L9.5 9.5M12.5 7V5.5M7 12.5H5.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      ) : (
        <div
          className={cn(
            "pointer-events-none absolute rounded-full bg-border/55 transition-all duration-200",
            isVerticalEdgeHandle ? "inset-y-3 w-px" : "inset-x-3 h-px",
            position === 'left'
              ? "left-0.5"
              : position === 'right'
                ? "right-0.5"
                : position === 'top'
                  ? "top-0.5"
                  : "bottom-0.5",
            isResizing
              ? "bg-blue-500/90 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
              : "opacity-45 group-hover/panel-resize:opacity-100 group-hover/panel-resize:bg-blue-500/55 group-focus-visible/panel-resize:opacity-100 group-focus-visible/panel-resize:bg-blue-500/70",
          )}
        />
      )}
      {visibleHandleLabel ? (
        <div
          aria-hidden="true"
          data-panel-resize-visible-label={position}
          className={cn(
            'pointer-events-none absolute z-10 inline-flex whitespace-nowrap rounded-full border border-border/60 bg-background/92 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200',
            getVisibleResizeHandleLabelClasses(position),
            isResizing
              ? 'scale-100 opacity-100 border-blue-500/70 bg-background/97 text-blue-700 dark:text-blue-300'
              : 'scale-95 opacity-0 group-hover/panel-resize:scale-100 group-hover/panel-resize:opacity-100 group-hover/panel-resize:border-blue-500/55 group-hover/panel-resize:bg-background/97 group-hover/panel-resize:text-foreground group-focus-visible/panel-resize:scale-100 group-focus-visible/panel-resize:opacity-100 group-focus-visible/panel-resize:border-blue-500/65 group-focus-visible/panel-resize:bg-background/97 group-focus-visible/panel-resize:text-foreground',
          )}
        >
          {visibleHandleLabel}
        </div>
      ) : null}
    </div>
  )
}
