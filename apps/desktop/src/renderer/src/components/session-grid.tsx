import React, { useRef, useState, useEffect, useLayoutEffect, createContext, useContext, useCallback } from "react"
import { cn } from "@renderer/lib/utils"
import { GripVertical } from "lucide-react"
import { useResizable } from "@renderer/hooks/use-resizable"
import {
  COLLAPSED_TILE_ROW_HEIGHT,
  calculateTileHeight,
  getTileGridRowSpan,
  isMaximizedTileLayout,
  parseTileLayoutMode,
  type TileLayoutMode,
} from "./session-grid-layout"

interface SessionGridContextValue {
  containerWidth: number
  containerHeight: number
  gap: number
  resetKey: number
  layoutMode: TileLayoutMode
  columns: number
}

const SessionGridContext = createContext<SessionGridContextValue>({
  containerWidth: 0,
  containerHeight: 0,
  gap: 12,
  resetKey: 0,
  layoutMode: "1x2",
  columns: 2,
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
  layoutChangeKey?: number
  onMetricsChange?: (metrics: { width: number; height: number; gap: number }) => void
}

export function SessionGrid({ children, sessionCount, className, resetKey = 0, layoutMode = "1x2", layoutChangeKey, onMetricsChange }: SessionGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [gap, setGap] = useState(12) // Default to gap-3 = 12px

  const updateMeasurements = useCallback(() => {
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
      const columnGap = !Number.isNaN(parsedColumnGap) ? parsedColumnGap : (!Number.isNaN(parsedGap) ? parsedGap : 12)
      setGap(columnGap)
    }
  }, [])

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

    // Observe one more ancestor so sidebar collapse/expand width changes always reflow tiles.
    if (containerRef.current?.parentElement?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement.parentElement)
    }

    window.addEventListener("resize", updateMeasurements)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateMeasurements)
    }
  }, [updateMeasurements])

  useEffect(() => {
    updateMeasurements()

    // Sidebar collapse/expand animates width, so re-measure once after transition ends.
    const animationFrameId = window.requestAnimationFrame(updateMeasurements)
    const timeoutId = window.setTimeout(updateMeasurements, 220)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(timeoutId)
    }
  }, [layoutChangeKey, updateMeasurements])

  useEffect(() => {
    onMetricsChange?.({ width: containerWidth, height: containerHeight, gap })
  }, [containerWidth, containerHeight, gap, onMetricsChange])

  const { columns } = parseTileLayoutMode(layoutMode)

  return (
    <SessionGridContext.Provider value={{ containerWidth, containerHeight, gap, resetKey, layoutMode, columns }}>
      <div
        ref={containerRef}
        className={cn(
          "grid min-h-full w-full grid-flow-row-dense content-start gap-3 p-3",
          className
        )}
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
          gridAutoRows: `${COLLAPSED_TILE_ROW_HEIGHT}px`,
        }}
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
  isDraggable?: boolean
  onDragStart?: (sessionId: string, index: number) => void
  onDragOver?: (index: number) => void
  onDragEnd?: () => void
  isDragTarget?: boolean
  isDragging?: boolean
}

export function SessionTileWrapper({
  children,
  sessionId,
  index,
  className,
  isCollapsed,
  isDraggable = true,
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
  const isMaximized = isMaximizedTileLayout(layoutMode)
  const calculatedHeight = calculateTileHeight(containerHeight, gap, layoutMode)

  const {
    width,
    height,
    isResizing,
    handleWidthResizeStart,
    handleHeightResizeStart,
    handleCornerResizeStart,
    setSize,
  } = useResizable({
    initialWidth: containerWidth,
    initialHeight: calculatedHeight,
    storageKey: isMaximized ? "session-tile" : undefined,
  })

  // Use useLayoutEffect (runs before browser paint) to update tile size when
  // layout mode or resetKey changes. Regular useEffect caused a one-frame stale
  // render where tiles kept their old (e.g. 1x1 full-width) size before the
  // effect corrected them, breaking flex-wrap two-column layout.
  useLayoutEffect(() => {
    if (resetKey !== lastResetKeyRef.current && containerWidth > 0) {
      lastResetKeyRef.current = resetKey
      setSize({
        width: containerWidth,
        height: calculatedHeight,
      })
    }
  }, [resetKey, containerWidth, calculatedHeight, setSize])

  useLayoutEffect(() => {
    if (layoutMode !== lastLayoutModeRef.current && containerWidth > 0) {
      lastLayoutModeRef.current = layoutMode
      setSize({
        width: containerWidth,
        height: calculatedHeight,
      })
    }
  }, [layoutMode, containerWidth, calculatedHeight, setSize])

  // Update width and height to fill container once it is measured (only on first valid measurement)
  // This handles the case where containerWidth/containerHeight are 0 on initial render
  useEffect(() => {
    // Only run once when container dimensions become valid and we haven't initialized yet
    if (containerWidth > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setSize({ width: containerWidth, height: calculatedHeight })
    }
  }, [containerWidth, calculatedHeight, setSize])

  // Responsive reflow: when the container width changes significantly (e.g. sidebar toggle),
  // recalculate tile sizes to fill available space. Only fires after initial sizing and when
  // not actively resizing via drag handles.
  const lastContainerWidthRef = useRef(containerWidth)
  useEffect(() => {
    if (!hasInitializedRef.current || containerWidth <= 0 || isResizing) return
    const prevWidth = lastContainerWidthRef.current
    lastContainerWidthRef.current = containerWidth
    // Only reflow if width changed by more than 20px (avoids sub-pixel jitter)
    if (prevWidth > 0 && Math.abs(containerWidth - prevWidth) > 20) {
      setSize({ width: containerWidth, height: calculatedHeight })
    }
  }, [containerWidth, calculatedHeight, setSize, isResizing])

  const tileRowSpan = isCollapsed ? 1 : getTileGridRowSpan(isMaximized ? height : calculatedHeight, gap)

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", sessionId)
    onDragStart?.(sessionId, index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    onDragOver?.(index)
  }

  const handleDragEnd = () => {
    if (!isDraggable) return
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
      style={{
        width: isMaximized ? width : "100%",
        height: isMaximized && !isCollapsed ? height : undefined,
        gridColumn: "span 1 / span 1",
        gridRow: `span ${tileRowSpan} / span ${tileRowSpan}`,
      }}
      draggable={isDraggable && !isResizing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Drag handle indicator in top-left */}
      {isDraggable && (
        <div
          className="absolute top-2 left-2 z-10 p-1 rounded bg-muted/50 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Main content */}
      <div className={cn("w-full", isCollapsed ? "h-auto" : "h-full")}>
        {children}
      </div>

      {/* Resize handles - hide when collapsed */}
      {!isCollapsed && isMaximized && (
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
