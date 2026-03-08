import React, { useState, useRef, useEffect } from "react"
import { cn } from "@renderer/lib/utils"
import { tipcClient } from "@renderer/lib/tipc-client"

interface ResizeHandleProps {
  className?: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right'
  disabled?: boolean
  onResizeStart?: () => void
  onResize?: (delta: { width: number; height: number }) => void
  onResizeEnd?: (size: { width: number; height: number }) => void
}

export function ResizeHandle({
  className,
  position,
  disabled = false,
  onResizeStart,
  onResize,
  onResizeEnd,
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const handleRef = useRef<HTMLDivElement>(null)

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

      onResizeEnd({ width: finalWidth, height: finalHeight })
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

      onResizeStart?.()
    } catch (error) {
      console.error("Failed to get panel size:", error)
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

  const getIndicatorClasses = () => {
    switch (position) {
      case 'top-left':
        return "left-0.5 top-0.5 h-2.5 w-2.5 rounded-tl-sm border-l border-t"
      case 'top-right':
        return "right-0.5 top-0.5 h-2.5 w-2.5 rounded-tr-sm border-r border-t"
      case 'bottom-left':
        return "bottom-0.5 left-0.5 h-2.5 w-2.5 rounded-bl-sm border-b border-l"
      case 'bottom-right':
        return "bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-br-sm border-b border-r"
      case 'top':
        return "left-1/2 top-0 h-0 w-10 -translate-x-1/2 border-t"
      case 'bottom':
        return "bottom-0 left-1/2 h-0 w-10 -translate-x-1/2 border-b"
      case 'left':
        return "left-0 top-1/2 h-10 -translate-y-1/2 border-l"
      case 'right':
        return "right-0 top-1/2 h-10 -translate-y-1/2 border-r"
      default:
        return ""
    }
  }

  return (
    <div
      ref={handleRef}
      className={cn(
        "group/resize-handle transition-colors duration-200",
        getPositionClasses(),
        getSizeClasses(),
        getCursorClass(),
        disabled
          ? "opacity-30 cursor-not-allowed"
          : isResizing
            ? "bg-blue-500/50"
            : "bg-transparent hover:bg-blue-500/30",
        className,
      )}
      onMouseDown={handleMouseDown}
      style={{
        zIndex: 1000,
        userSelect: "none",
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute transition-colors duration-200",
          getIndicatorClasses(),
          disabled
            ? "border-black/10 dark:border-white/10"
            : isResizing
              ? "border-blue-400/80"
              : "border-black/15 dark:border-white/20 group-hover/resize-handle:border-blue-400/60",
        )}
      />
    </div>
  )
}
