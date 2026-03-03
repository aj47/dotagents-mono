import React, { useState, useRef, useEffect } from "react"
import { cn } from "@renderer/lib/utils"
import { tipcClient } from "@renderer/lib/tipc-client"
import { LoadingSpinner } from "@renderer/components/ui/loading-spinner"

interface PanelDragBarProps {
  className?: string
  disabled?: boolean
}

export function PanelDragBar({
  className,
  disabled = false,
}: PanelDragBarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{
    x: number
    y: number
    windowX: number
    windowY: number
  } | null>(null)
  const dragBarRef = useRef<HTMLDivElement>(null)
  const lastDragUpdateRef = useRef(0)
  const DRAG_THROTTLE_MS = 16

  useEffect(() => {
    if (!isDragging || disabled) return undefined

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return

      // Calculate new position based on mouse movement from initial position
      const deltaX = e.screenX - dragStart.x
      const deltaY = e.screenY - dragStart.y

      const newX = dragStart.windowX + deltaX
      const newY = dragStart.windowY + deltaY

      // Throttle high-frequency move events to reduce IPC pressure.
      const now = Date.now()
      if (now - lastDragUpdateRef.current < DRAG_THROTTLE_MS) {
        return
      }
      lastDragUpdateRef.current = now

      void tipcClient.updatePanelPosition({
        x: newX,
        y: newY,
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStart) return

      // Calculate final position
      const deltaX = e.screenX - dragStart.x
      const deltaY = e.screenY - dragStart.y

      const finalX = dragStart.windowX + deltaX
      const finalY = dragStart.windowY + deltaY

      // Save the final position as custom position
      void tipcClient.savePanelCustomPosition({
        x: finalX,
        y: finalY,
      })

      setIsDragging(false)
      setDragStart(null)
      document.body.style.cursor = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    // Set cursor style
    document.body.style.cursor = "grabbing"

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
    }
  }, [isDragging, dragStart, disabled])

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    // Get current window position
    const windowPos = await tipcClient.getPanelPosition()

    setIsDragging(true)
    lastDragUpdateRef.current = 0
    setDragStart({
      x: e.screenX,
      y: e.screenY,
      windowX: windowPos.x,
      windowY: windowPos.y,
    })
  }

  return (
    <div
      ref={dragBarRef}
      className={cn(
        "flex h-6 w-full items-center justify-center transition-colors duration-200",
        disabled
          ? "cursor-default"
          : isDragging
            ? "cursor-grabbing"
            : "cursor-grab hover:bg-white/5",
        className,
      )}
      onMouseDown={handleMouseDown}
      style={{
        WebkitAppRegion: disabled ? "no-drag" : "drag",
        userSelect: "none",
      } as any}
    >
      {/* Drag handle visual indicator */}
      <div
        className={cn(
          "flex items-center justify-center transition-opacity duration-200",
          disabled ? "opacity-30" : "opacity-60 hover:opacity-80",
        )}
      >
        <LoadingSpinner size="sm" />
      </div>
    </div>
  )
}
