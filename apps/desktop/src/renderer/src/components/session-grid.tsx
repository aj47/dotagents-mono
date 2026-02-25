import React, { useRef, useState, useEffect, createContext, useContext } from "react"
import { cn } from "@renderer/lib/utils"
import { GripVertical } from "lucide-react"
import { useResizable, TILE_DIMENSIONS } from "@renderer/hooks/use-resizable"

/** Layout mode for session tiles: "1x2" = 2 columns, "2x2" = 4 tiles (2x2 grid), "1x1" = single maximized */
export type TileLayoutMode = "1x2" | "2x2" | "1x1"

// Context to share container width, height, gap, reset key, and layout mode with tile wrappers
interface SessionGridContextValue {
  containerWidth: number
  containerHeight: number
  gap: number
  resetKey: number
  layoutMode: TileLayoutMode
}

const SessionGridContext = createContext<SessionGridContextValue>({
  containerWidth: 0,
  containerHeight: 0,
  gap: 16,
  resetKey: 0,
  layoutMode: "1x2",
})

export function useSessionGridContext() {
  return useContext(SessionGridContext)
}

interface SessionGridProps {
  children: React.ReactNode
  sessionCount: number
  className?: string
  resetKey?: number
  layoutMode?: TileLayoutMode
}

export function SessionGrid({ children, sessionCount, className, resetKey = 0, layoutMode = "1x2" }: SessionGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [gap, setGap] = useState(16) // Default to gap-4 = 16px

  const updateMeasurements = () => {
    if (containerRef.current) {
      // Dynamically compute padding from computed styles to handle className overrides
      const computedStyle = getComputedStyle(containerRef.current)
      // Use proper NaN check to allow 0 as a valid padding value
      const parsedPaddingLeft = parseFloat(computedStyle.paddingLeft)
      const parsedPaddingRight = parseFloat(computedStyle.paddingRight)
      const paddingLeft = !Number.isNaN(parsedPaddingLeft) ? parsedPaddingLeft : 0
      const paddingRight = !Number.isNaN(parsedPaddingRight) ? parsedPaddingRight : 0
      const totalHorizontalPadding = paddingLeft + paddingRight
      setContainerWidth(containerRef.current.clientWidth - totalHorizontalPadding)

      // Measure available vertical space from the *parent* (the overflow-y-auto scrollable
      // wrapper) rather than this div itself. This div has min-h-full and grows with content,
      // so measuring its own clientHeight creates a feedback loop where tiles expand the grid,
      // which reports a larger height, which makes tiles taller, which expands the grid further.
      const scrollParent = containerRef.current.parentElement
      if (scrollParent) {
        const parsedPaddingTop = parseFloat(computedStyle.paddingTop)
        const parsedPaddingBottom = parseFloat(computedStyle.paddingBottom)
        const paddingTop = !Number.isNaN(parsedPaddingTop) ? parsedPaddingTop : 0
        const paddingBottom = !Number.isNaN(parsedPaddingBottom) ? parsedPaddingBottom : 0
        const totalVerticalPadding = paddingTop + paddingBottom
        setContainerHeight(scrollParent.clientHeight - totalVerticalPadding)
      }

      // Also compute gap from styles to handle className overrides (columnGap or gap)
      // Use a proper check that doesn't treat 0 as falsy (0 is a valid gap value)
      const parsedColumnGap = parseFloat(computedStyle.columnGap)
      const parsedGap = parseFloat(computedStyle.gap)
      const columnGap = !Number.isNaN(parsedColumnGap) ? parsedColumnGap : (!Number.isNaN(parsedGap) ? parsedGap : 16)
      setGap(columnGap)
    }
  }

  useEffect(() => {
    updateMeasurements()

    // Observe the grid div for width changes and the parent for height changes.
    // We must not observe the grid div's height — it grows with content (min-h-full)
    // so observing it for height would re-trigger tile sizing in a loop.
    const resizeObserver = new ResizeObserver(updateMeasurements)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <SessionGridContext.Provider value={{ containerWidth, containerHeight, gap, resetKey, layoutMode }}>
      <div
        ref={containerRef}
        className={cn(
          "flex flex-wrap gap-4 p-4 content-start min-h-full",
          className
        )}
      >
        {children}
      </div>
    </SessionGridContext.Provider>
  )
}

interface SessionTileWrapperProps {
  children: React.ReactNode
  sessionId: string
  index: number
  className?: string
  isCollapsed?: boolean
  onDragStart?: (sessionId: string, index: number) => void
  onDragOver?: (index: number) => void
  onDragEnd?: () => void
  isDragTarget?: boolean
  isDragging?: boolean
}

// Calculate tile width based on layout mode, clamped to min/max
function calculateTileWidth(containerWidth: number, gap: number, layoutMode: TileLayoutMode): number {
  if (containerWidth <= 0) {
    return TILE_DIMENSIONS.width.default
  }
  switch (layoutMode) {
    case "1x1":
      // Full width
      return Math.max(TILE_DIMENSIONS.width.min, Math.min(TILE_DIMENSIONS.width.max, containerWidth))
    case "2x2":
      // Half width (same as 1x2 — 2 columns)
      return Math.max(TILE_DIMENSIONS.width.min, Math.min(TILE_DIMENSIONS.width.max, Math.floor((containerWidth - gap) / 2)))
    case "1x2":
    default:
      // Half width — 2 columns
      return Math.max(TILE_DIMENSIONS.width.min, Math.min(TILE_DIMENSIONS.width.max, Math.floor((containerWidth - gap) / 2)))
  }
}

// Calculate tile height based on layout mode
function calculateTileHeight(containerHeight: number, gap: number, layoutMode: TileLayoutMode): number {
  if (containerHeight <= 0) return TILE_DIMENSIONS.height.default
  switch (layoutMode) {
    case "1x1":
      // Full height
      return Math.min(TILE_DIMENSIONS.height.max, Math.max(TILE_DIMENSIONS.height.min, containerHeight))
    case "2x2":
      // Half height — 2 rows
      return Math.min(TILE_DIMENSIONS.height.max, Math.max(TILE_DIMENSIONS.height.min, Math.floor((containerHeight - gap) / 2)))
    case "1x2":
    default:
      // Full height — single row
      return Math.min(TILE_DIMENSIONS.height.max, Math.max(TILE_DIMENSIONS.height.min, containerHeight))
  }
}

export function SessionTileWrapper({
  children,
  sessionId,
  index,
  className,
  isCollapsed,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
  isDragging,
}: SessionTileWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { containerWidth, containerHeight, gap, resetKey, layoutMode } = useSessionGridContext()
  const hasInitializedRef = useRef(false)
  const lastResetKeyRef = useRef(resetKey)
  const lastLayoutModeRef = useRef(layoutMode)

  const {
    width,
    height,
    isResizing,
    handleWidthResizeStart,
    handleHeightResizeStart,
    handleCornerResizeStart,
    setSize,
  } = useResizable({
    initialWidth: calculateTileWidth(containerWidth, gap, layoutMode),
    initialHeight: calculateTileHeight(containerHeight, gap, layoutMode),
    storageKey: "session-tile",
  })

  // Reset tile size when resetKey changes (user clicked layout cycle button)
  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current && containerWidth > 0) {
      lastResetKeyRef.current = resetKey
      setSize({
        width: calculateTileWidth(containerWidth, gap, layoutMode),
        height: calculateTileHeight(containerHeight, gap, layoutMode),
      })
    }
  }, [resetKey, containerWidth, containerHeight, gap, layoutMode, setSize])

  // Update tile size when layout mode changes
  useEffect(() => {
    if (layoutMode !== lastLayoutModeRef.current && containerWidth > 0) {
      lastLayoutModeRef.current = layoutMode
      setSize({
        width: calculateTileWidth(containerWidth, gap, layoutMode),
        height: calculateTileHeight(containerHeight, gap, layoutMode),
      })
    }
  }, [layoutMode, containerWidth, containerHeight, gap, setSize])

  // Update width and height to fill container once it is measured (only on first valid measurement)
  // This handles the case where containerWidth/containerHeight are 0 on initial render
  useEffect(() => {
    // Only run once when container dimensions become valid and we haven't initialized yet
    if (containerWidth > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      // Check if there's already a persisted size - if so, don't override it
      let hasPersistedSize = false
      try {
        const persistedKey = "dotagents-resizable-session-tile"
        hasPersistedSize = localStorage.getItem(persistedKey) !== null
      } catch {
        // Storage unavailable, fall back to default behavior
      }
      if (!hasPersistedSize) {
        setSize({
          width: calculateTileWidth(containerWidth, gap, layoutMode),
          height: calculateTileHeight(containerHeight, gap, layoutMode),
        })
      }
    }
  }, [containerWidth, containerHeight, gap, layoutMode, setSize])

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", sessionId)
    onDragStart?.(sessionId, index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    onDragOver?.(index)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-shrink-0 transition-all duration-200",
        isResizing && "select-none",
        isDragTarget && "ring-2 ring-blue-500 ring-offset-2",
        isDragging && "opacity-50",
        className
      )}
      style={{ width, height: isCollapsed ? "auto" : height }}
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Drag handle indicator in top-left */}
      <div
        className="absolute top-2 left-2 z-10 p-1 rounded bg-muted/50 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Main content */}
      <div className={cn("w-full", isCollapsed ? "h-auto" : "h-full")}>
        {children}
      </div>

      {/* Resize handles - hide when collapsed */}
      {!isCollapsed && (
        <>
          {/* Right edge resize handle */}
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-500/30 transition-colors"
            onMouseDown={handleWidthResizeStart}
          />

          {/* Bottom edge resize handle */}
          <div
            className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-blue-500/30 transition-colors"
            onMouseDown={handleHeightResizeStart}
          />

          {/* Corner resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-500/50 transition-colors rounded-tl"
            onMouseDown={handleCornerResizeStart}
          >
            <svg className="w-4 h-4 text-muted-foreground/50" viewBox="0 0 16 16">
              <path d="M14 14H10M14 14V10M14 14L10 10M14 8V6M8 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </>
      )}
    </div>
  )
}

