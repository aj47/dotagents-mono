import React, { useRef, useState, useEffect, createContext, useContext, useCallback } from "react"
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
  sessionCount: number
}

const SessionGridContext = createContext<SessionGridContextValue>({
  containerWidth: 0,
  containerHeight: 0,
  gap: 16,
  resetKey: 0,
  layoutMode: "1x2",
  sessionCount: 0,
})

export function useSessionGridContext() {
  return useContext(SessionGridContext)
}

export interface SessionGridMeasurements {
  containerWidth: number
  containerHeight: number
  gap: number
}

interface SessionGridProps {
  children: React.ReactNode
  sessionCount: number
  className?: string
  resetKey?: number
  layoutMode?: TileLayoutMode
  layoutChangeKey?: number | string
  onMeasurementsChange?: (measurements: SessionGridMeasurements) => void
}

export function SessionGrid({
  children,
  sessionCount,
  className,
  resetKey = 0,
  layoutMode = "1x2",
  layoutChangeKey,
  onMeasurementsChange,
}: SessionGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [gap, setGap] = useState(16) // Default to gap-4 = 16px

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
      const columnGap = !Number.isNaN(parsedColumnGap) ? parsedColumnGap : (!Number.isNaN(parsedGap) ? parsedGap : 16)
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

    // Sidebar and floating-panel changes can animate the available sessions width,
    // so re-measure once after layout chrome settles.
    const animationFrameId = window.requestAnimationFrame(updateMeasurements)
    const timeoutId = window.setTimeout(updateMeasurements, 220)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(timeoutId)
    }
  }, [layoutChangeKey, updateMeasurements])

  useEffect(() => {
    onMeasurementsChange?.({ containerWidth, containerHeight, gap })
  }, [containerWidth, containerHeight, gap, onMeasurementsChange])

  return (
    <SessionGridContext.Provider value={{ containerWidth, containerHeight, gap, resetKey, layoutMode, sessionCount }}>
      <div
        ref={containerRef}
        className={cn(
          "flex flex-wrap gap-4 p-4 content-start min-h-full w-full",
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
  isDraggable?: boolean
  isReorderInteractionActive?: boolean
  onDragStart?: (sessionId: string, index: number) => void
  onDragOver?: (index: number) => void
  onDragEnd?: () => void
  onMoveBackward?: (sessionId: string) => void
  onMoveForward?: (sessionId: string) => void
  canMoveBackward?: boolean
  canMoveForward?: boolean
  isDragTarget?: boolean
  dragTargetPosition?: "before" | "after" | null
  isDragging?: boolean
  isNewlyAdded?: boolean
  isRestoredFromSingleView?: boolean
}

function getDragTargetBadgeLabel(position: "before" | "after"): string {
  return position === "before" ? "Drop before" : "Drop after"
}

function getDragTargetInsertionCueClasses(position: "before" | "after"): string {
  return position === "before" ? "top-2.5" : "bottom-2.5"
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

function calculateExpandedTileWidth(containerWidth: number): number {
  if (containerWidth <= 0) {
    return TILE_DIMENSIONS.width.default
  }

  // In focused / stacked single-column states, fitting the available column is more important
  // than preserving the normal multi-tile minimum width. Otherwise very narrow work areas can
  // still force horizontal overflow even after the layout intentionally falls back to one column.
  return Math.max(1, Math.min(TILE_DIMENSIONS.width.max, containerWidth))
}

interface ResponsiveTileWidthOptions {
  currentWidth: number
  previousContainerWidth: number
  nextContainerWidth: number
  gap: number
  layoutMode: TileLayoutMode
}

interface ResponsiveTileHeightOptions {
  currentHeight: number
  previousContainerHeight: number
  nextContainerHeight: number
  nextLayoutHeight: number
}

export type TileResizeHandleType = "width" | "height" | "corner"

type TileResizeFeedbackState = {
  handleType: TileResizeHandleType
  label: string
}

const TILE_KEYBOARD_RESIZE_STEP = 24
const TILE_KEYBOARD_RESIZE_FEEDBACK_TIMEOUT_MS = 1400

export function calculateResponsiveTileWidth({
  currentWidth,
  previousContainerWidth,
  nextContainerWidth,
  gap,
  layoutMode,
}: ResponsiveTileWidthOptions): number {
  const previousCalculatedWidth = calculateTileWidth(
    previousContainerWidth,
    gap,
    layoutMode,
  )
  const nextCalculatedWidth = calculateTileWidth(
    nextContainerWidth,
    gap,
    layoutMode,
  )
  const widthScale =
    previousCalculatedWidth > 0 ? currentWidth / previousCalculatedWidth : 0

  if (!Number.isFinite(widthScale) || widthScale <= 0) {
    return nextCalculatedWidth
  }

  return Math.round(nextCalculatedWidth * widthScale)
}

export function calculateResponsiveTileHeight({
  currentHeight,
  previousContainerHeight,
  nextContainerHeight,
  nextLayoutHeight,
}: ResponsiveTileHeightOptions): number {
  if (!Number.isFinite(currentHeight) || currentHeight <= 0) {
    return nextLayoutHeight
  }

  if (
    previousContainerHeight <= 0 ||
    nextContainerHeight >= previousContainerHeight
  ) {
    return currentHeight
  }

  return Math.min(currentHeight, nextLayoutHeight)
}

function getTileResizeHandleTitle(
  handleType: TileResizeHandleType,
  resettable = false,
  keyboardAccessible = false,
): string {
  const title = (() => {
    switch (handleType) {
      case "height":
        return "Resize height"
      case "corner":
        return "Resize width and height"
      case "width":
      default:
        return "Resize width"
    }
  })()

  if (!resettable) {
    return title
  }

  if (keyboardAccessible) {
    switch (handleType) {
      case "width":
        return `${title} · Focus and press left or right arrow keys to resize · Press Enter or double-click to reset tile size`
      case "height":
        return `${title} · Focus and press up or down arrow keys to resize · Press Enter or double-click to reset tile size`
      case "corner":
      default:
        return `${title} · Focus and press arrow keys to resize · Press Enter or double-click to reset tile size`
    }
  }

  return `${title} · Double-click to reset tile size`
}

function getTileResizeHandleAriaLabel(
  handleType: TileResizeHandleType,
  keyboardAccessible = false,
): string {
  const label = (() => {
    switch (handleType) {
      case "height":
        return "Resize tile height"
      case "corner":
        return "Resize tile width and height"
      case "width":
      default:
        return "Resize tile width"
    }
  })()

  if (keyboardAccessible) {
    switch (handleType) {
      case "width":
        return `${label}. Focus and press Left or Right Arrow to nudge width. Press Enter to reset tile size.`
      case "height":
        return `${label}. Focus and press Up or Down Arrow to nudge height. Press Enter to reset tile size.`
      case "corner":
      default:
        return `${label}. Focus and press arrow keys to nudge width or height. Press Enter to reset tile size.`
    }
  }

  return label
}

function getTileResizeHandleVisibleLabel(
  handleType: TileResizeHandleType,
  options?: { compact?: boolean },
): string | null {
  switch (handleType) {
    case "width":
      return options?.compact ? "Width" : "Resize width"
    case "height":
      return options?.compact ? "Height" : "Resize height"
    case "corner":
      return options?.compact ? "Resize" : "Resize tile"
    default:
      return null
  }
}

function getTileResizeHandleVisibleLabelClasses(
  handleType: TileResizeHandleType,
): string {
  switch (handleType) {
    case "width":
      return "right-3 top-1/2 -translate-y-1/2 origin-right"
    case "height":
      return "bottom-3 left-1/2 -translate-x-1/2 origin-bottom"
    case "corner":
    default:
      return ""
  }
}

export function getTileResizeFeedbackLabel(
  handleType: TileResizeHandleType,
  size: { width: number; height: number },
  options?: { compact?: boolean; reset?: boolean },
): string {
  const widthLabel = `${Math.round(size.width)}px`
  const heightLabel = `${Math.round(size.height)}px`

  if (options?.reset) {
    switch (handleType) {
      case "height":
        return options?.compact
          ? `Height reset ${heightLabel}`
          : `Height reset · ${heightLabel}`
      case "corner":
        return options?.compact
          ? `Reset ${widthLabel} × ${heightLabel}`
          : `Reset · ${widthLabel} × ${heightLabel}`
      case "width":
      default:
        return options?.compact
          ? `Width reset ${widthLabel}`
          : `Width reset · ${widthLabel}`
    }
  }

  switch (handleType) {
    case "height":
      return options?.compact
        ? `Height ${heightLabel}`
        : `Height ${heightLabel} · Double-click reset`
    case "corner":
      return options?.compact
        ? `${widthLabel} × ${heightLabel}`
        : `${widthLabel} × ${heightLabel} · Double-click reset`
    case "width":
    default:
      return options?.compact
        ? `Width ${widthLabel}`
        : `Width ${widthLabel} · Double-click reset`
  }
}

export function getTileResizeKeyboardFeedbackLabel(
  handleType: TileResizeHandleType,
  size: { width: number; height: number },
  options?: { compact?: boolean; reset?: boolean },
): string {
  const widthLabel = `${Math.round(size.width)}px`
  const heightLabel = `${Math.round(size.height)}px`

  if (options?.reset) {
    return getTileResizeFeedbackLabel(handleType, size, {
      compact: options?.compact,
      reset: true,
    })
  }

  switch (handleType) {
    case "height":
      return options?.compact
        ? `Height ${heightLabel}`
        : `Height ${heightLabel} · Enter reset`
    case "corner":
      return options?.compact
        ? `${widthLabel} × ${heightLabel}`
        : `${widthLabel} × ${heightLabel} · Enter reset`
    case "width":
    default:
      return options?.compact
        ? `Width ${widthLabel}`
        : `Width ${widthLabel} · Enter reset`
  }
}

function clampTileResizeFeedbackSize(size: {
  width: number
  height: number
}): { width: number; height: number } {
  return {
    width: Math.min(
      TILE_DIMENSIONS.width.max,
      Math.max(TILE_DIMENSIONS.width.min, size.width),
    ),
    height: Math.min(
      TILE_DIMENSIONS.height.max,
      Math.max(TILE_DIMENSIONS.height.min, size.height),
    ),
  }
}

export function getTileResizeResetSize(
  handleType: TileResizeHandleType,
  layoutWidth: number,
  layoutHeight: number,
): { width?: number; height?: number } {
  switch (handleType) {
    case "height":
      return { height: layoutHeight }
    case "corner":
      return { width: layoutWidth, height: layoutHeight }
    case "width":
    default:
      return { width: layoutWidth }
  }
}

export function didTileResizeHandleChangeSize(
  handleType: TileResizeHandleType,
  previousSize: { width: number; height: number },
  nextSize: { width: number; height: number },
): boolean {
  switch (handleType) {
    case "height":
      return Math.abs(nextSize.height - previousSize.height) >= 1
    case "corner":
      return (
        Math.abs(nextSize.width - previousSize.width) >= 1 ||
        Math.abs(nextSize.height - previousSize.height) >= 1
      )
    case "width":
    default:
      return Math.abs(nextSize.width - previousSize.width) >= 1
  }
}

export function getTileResizeKeyboardAdjustment(
  handleType: TileResizeHandleType,
  key: string,
  step = TILE_KEYBOARD_RESIZE_STEP,
): { width?: number; height?: number } | null {
  switch (handleType) {
    case "width":
      if (key === "ArrowLeft") return { width: -step }
      if (key === "ArrowRight") return { width: step }
      return null
    case "height":
      if (key === "ArrowUp") return { height: -step }
      if (key === "ArrowDown") return { height: step }
      return null
    case "corner":
      if (key === "ArrowLeft") return { width: -step }
      if (key === "ArrowRight") return { width: step }
      if (key === "ArrowUp") return { height: -step }
      if (key === "ArrowDown") return { height: step }
      return null
  }
}

export function isTileResizeKeyboardResetKey(key: string): boolean {
  return key === "Enter"
}

export function shouldPreserveTileWidthAcrossLayoutChange(
  previousLayoutMode: TileLayoutMode,
  nextLayoutMode: TileLayoutMode,
): boolean {
  return (
    (previousLayoutMode === "1x2" && nextLayoutMode === "2x2") ||
    (previousLayoutMode === "2x2" && nextLayoutMode === "1x2")
  )
}

export function getResponsiveStackedTileLayoutMinimumWidth(
  gap: number,
  sessionCount: number,
): number {
  if (sessionCount <= 1) {
    return 0
  }

  const columns = Math.min(sessionCount, 2)

  return TILE_DIMENSIONS.width.default * columns + gap * Math.max(0, columns - 1)
}

export function isResponsiveStackedTileLayout(
  containerWidth: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount: number,
): boolean {
  if (containerWidth <= 0 || layoutMode === "1x1" || sessionCount <= 1) {
    return false
  }

  const minimumMultiColumnWidth = getResponsiveStackedTileLayoutMinimumWidth(
    gap,
    sessionCount,
  )

  return containerWidth < minimumMultiColumnWidth
}

export function calculateResponsiveStackedTileHeight(
  containerHeight: number,
  gap: number,
): number {
  if (containerHeight <= 0) {
    return TILE_DIMENSIONS.height.default
  }

  // When Compare/Grid temporarily collapse to one column because width is tight,
  // default to a denser half-height footprint so the fallback does not become a
  // column of viewport-tall tiles. Users can still manually resize if they want more height.
  return Math.min(
    TILE_DIMENSIONS.height.max,
    Math.max(
      TILE_DIMENSIONS.height.min,
      Math.floor((containerHeight - Math.max(0, gap)) / 2),
    ),
  )
}

function getTileLayoutRowCount(
  layoutMode: TileLayoutMode,
  sessionCount: number,
): number {
  if (layoutMode !== "2x2") {
    return 1
  }

  return Math.max(1, Math.min(2, Math.ceil(sessionCount / 2)))
}

// Calculate tile height based on layout mode
export function calculateTileHeight(
  containerHeight: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount: number,
): number {
  if (containerHeight <= 0) return TILE_DIMENSIONS.height.default
  switch (layoutMode) {
    case "1x1":
      // Full height
      return Math.min(TILE_DIMENSIONS.height.max, Math.max(TILE_DIMENSIONS.height.min, containerHeight))
    case "2x2": {
      const rowCount = getTileLayoutRowCount(layoutMode, sessionCount)

      // Only reserve a second row once the visible tile count actually needs it.
      return Math.min(
        TILE_DIMENSIONS.height.max,
        Math.max(
          TILE_DIMENSIONS.height.min,
          Math.floor(
            (containerHeight - gap * (rowCount - 1)) / rowCount,
          ),
        ),
      )
    }
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
  isDraggable = true,
  isReorderInteractionActive = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveBackward,
  onMoveForward,
  canMoveBackward = false,
  canMoveForward = false,
  isDragTarget,
  dragTargetPosition,
  isDragging,
  isNewlyAdded = false,
  isRestoredFromSingleView = false,
}: SessionTileWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { containerWidth, containerHeight, gap, resetKey, layoutMode, sessionCount } = useSessionGridContext()
  const hasInitializedRef = useRef(false)
  const lastResetKeyRef = useRef(resetKey)
  const lastLayoutModeRef = useRef(layoutMode)
  const lastResponsiveStackedLayoutRef = useRef(false)
  const responsiveStackedAutoHeightRef = useRef<{
    previousHeight: number
    stackedHeight: number
  } | null>(null)
  const isFocusLayout = layoutMode === "1x1"
  const isTemporarySingleVisibleLayout = !isFocusLayout && sessionCount === 1
  const isResponsiveStackedLayoutActive = isResponsiveStackedTileLayout(
    containerWidth,
    gap,
    layoutMode,
    sessionCount,
  )
  const gridRowCount = getTileLayoutRowCount(layoutMode, sessionCount)
  const layoutWidth = calculateTileWidth(containerWidth, gap, layoutMode)
  const layoutHeight = calculateTileHeight(
    containerHeight,
    gap,
    layoutMode,
    sessionCount,
  )
  const expandedLayoutWidth = calculateExpandedTileWidth(containerWidth)
  const expandedLayoutHeight = calculateTileHeight(
    containerHeight,
    gap,
    "1x1",
    sessionCount,
  )
  const oneRowGridLayoutHeight = calculateTileHeight(
    containerHeight,
    gap,
    "2x2",
    2,
  )
  const twoRowGridLayoutHeight = calculateTileHeight(
    containerHeight,
    gap,
    "2x2",
    4,
  )
  const responsiveStackedLayoutHeight = calculateResponsiveStackedTileHeight(
    containerHeight,
    gap,
  )
  const effectiveTileLayoutHeight = isResponsiveStackedLayoutActive
    ? responsiveStackedLayoutHeight
    : layoutHeight
  const [activeResizeHandle, setActiveResizeHandle] = useState<TileResizeHandleType | null>(null)
  const [keyboardResizeFeedback, setKeyboardResizeFeedback] =
    useState<TileResizeFeedbackState | null>(null)
  const [pointerResizeFeedback, setPointerResizeFeedback] =
    useState<TileResizeFeedbackState | null>(null)
  const keyboardResizeFeedbackTimeoutRef = useRef<number | null>(null)
  const pointerResizeFeedbackTimeoutRef = useRef<number | null>(null)
  const activeResizeHandleRef = useRef<TileResizeHandleType | null>(null)
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  )

  const clearKeyboardResizeFeedback = useCallback(() => {
    if (keyboardResizeFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(keyboardResizeFeedbackTimeoutRef.current)
      keyboardResizeFeedbackTimeoutRef.current = null
    }

    setKeyboardResizeFeedback(null)
  }, [])

  const clearPointerResizeFeedback = useCallback(() => {
    if (pointerResizeFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(pointerResizeFeedbackTimeoutRef.current)
      pointerResizeFeedbackTimeoutRef.current = null
    }

    setPointerResizeFeedback(null)
  }, [])

  const showPointerResizeFeedback = useCallback(
    (
      handleType: TileResizeHandleType,
      size: { width: number; height: number },
      options?: { reset?: boolean },
    ) => {
      setPointerResizeFeedback({
        handleType,
        label: getTileResizeFeedbackLabel(handleType, size, {
          compact: size.width < 380,
          reset: options?.reset,
        }),
      })
      if (pointerResizeFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(pointerResizeFeedbackTimeoutRef.current)
      }
      pointerResizeFeedbackTimeoutRef.current = window.setTimeout(() => {
        setPointerResizeFeedback((current) =>
          current?.handleType === handleType ? null : current,
        )
        pointerResizeFeedbackTimeoutRef.current = null
      }, TILE_KEYBOARD_RESIZE_FEEDBACK_TIMEOUT_MS)
    },
    [],
  )

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
    initialHeight: calculateTileHeight(
      containerHeight,
      gap,
      layoutMode,
      sessionCount,
    ),
    onResizeEnd: (finalSize) => {
      const finishedHandleType = activeResizeHandleRef.current
      const resizeStartSize = resizeStartSizeRef.current

      activeResizeHandleRef.current = null
      resizeStartSizeRef.current = null
      setActiveResizeHandle(null)

      if (
        !finishedHandleType ||
        !resizeStartSize ||
        !didTileResizeHandleChangeSize(
          finishedHandleType,
          resizeStartSize,
          finalSize,
        )
      ) {
        return
      }

      showPointerResizeFeedback(finishedHandleType, finalSize)
    },
    storageKey: "session-tile",
  })
  const currentWidthRef = useRef(width)
  const currentHeightRef = useRef(height)

  const startPointerResize = useCallback(
    (handleType: TileResizeHandleType) => {
      clearKeyboardResizeFeedback()
      clearPointerResizeFeedback()
      activeResizeHandleRef.current = handleType
      resizeStartSizeRef.current = {
        width: currentWidthRef.current,
        height: currentHeightRef.current,
      }
      setActiveResizeHandle(handleType)
    },
    [clearKeyboardResizeFeedback, clearPointerResizeFeedback],
  )

  useEffect(() => {
    currentWidthRef.current = width
  }, [width])

  useEffect(() => {
    currentHeightRef.current = height
  }, [height])

  const handlePointerResizeReset = useCallback(
    (
      handleType: TileResizeHandleType,
      e: React.MouseEvent<HTMLDivElement>,
    ) => {
      e.preventDefault()
      e.stopPropagation()
      clearKeyboardResizeFeedback()

      const resetSize = getTileResizeResetSize(
        handleType,
        layoutWidth,
        effectiveTileLayoutHeight,
      )
      const nextSize = clampTileResizeFeedbackSize({
        width: resetSize.width ?? currentWidthRef.current,
        height: resetSize.height ?? currentHeightRef.current,
      })

      showPointerResizeFeedback(handleType, nextSize, { reset: true })
      setSize(resetSize)
    },
    [
      clearKeyboardResizeFeedback,
      effectiveTileLayoutHeight,
      layoutWidth,
      setSize,
      showPointerResizeFeedback,
    ],
  )

  useEffect(() => {
    return () => {
      if (keyboardResizeFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(keyboardResizeFeedbackTimeoutRef.current)
      }
      if (pointerResizeFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(pointerResizeFeedbackTimeoutRef.current)
      }
    }
  }, [])

  // Reset tile size when resetKey changes (user clicked layout cycle button)
  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current && containerWidth > 0) {
      lastResetKeyRef.current = resetKey
      if (isFocusLayout) {
        return
      }
      setSize({
        width: layoutWidth,
        height: effectiveTileLayoutHeight,
      })
    }
  }, [
    resetKey,
    containerWidth,
    effectiveTileLayoutHeight,
    isFocusLayout,
    layoutWidth,
    setSize,
  ])

  // Update tile size when layout mode changes
  useEffect(() => {
    if (layoutMode !== lastLayoutModeRef.current && containerWidth > 0) {
      const previousLayoutMode = lastLayoutModeRef.current
      lastLayoutModeRef.current = layoutMode
      responsiveStackedAutoHeightRef.current = null
      if (previousLayoutMode === "1x1" || layoutMode === "1x1") {
        return
      }
      const shouldPreserveWidthAcrossLayoutChange =
        shouldPreserveTileWidthAcrossLayoutChange(
          previousLayoutMode,
          layoutMode,
        )
      setSize({
        ...(shouldPreserveWidthAcrossLayoutChange
          ? { height: effectiveTileLayoutHeight }
          : { width: layoutWidth, height: effectiveTileLayoutHeight }),
      })
    }
  }, [effectiveTileLayoutHeight, layoutMode, layoutWidth, containerWidth, setSize])

  // When Compare/Grid temporarily stack to one column, cap overly tall auto heights to a denser
  // stacked default, then restore the earlier height if width pressure clears and the user did not
  // intentionally resize the tile while stacked.
  useEffect(() => {
    const wasResponsiveStackedLayoutActive =
      lastResponsiveStackedLayoutRef.current

    if (wasResponsiveStackedLayoutActive === isResponsiveStackedLayoutActive) {
      return
    }

    lastResponsiveStackedLayoutRef.current = isResponsiveStackedLayoutActive

    if (isResizing) {
      return
    }

    if (isResponsiveStackedLayoutActive) {
      if (height > responsiveStackedLayoutHeight + 8) {
        responsiveStackedAutoHeightRef.current = {
          previousHeight: height,
          stackedHeight: responsiveStackedLayoutHeight,
        }
        setSize({ height: responsiveStackedLayoutHeight })
      } else {
        responsiveStackedAutoHeightRef.current = null
      }
      return
    }

    const responsiveStackedAutoHeight = responsiveStackedAutoHeightRef.current
    responsiveStackedAutoHeightRef.current = null

    if (
      responsiveStackedAutoHeight &&
      Math.abs(height - responsiveStackedAutoHeight.stackedHeight) <= 8
    ) {
      setSize({ height: responsiveStackedAutoHeight.previousHeight })
    }
  }, [
    height,
    isResizing,
    isResponsiveStackedLayoutActive,
    responsiveStackedLayoutHeight,
    setSize,
  ])

  // When 2x2 tiles only need one visible row, recover from stale two-row default heights
  // (and vice versa) so Grid does not keep awkward empty space after session-count changes.
  const staleGridLayoutHeight =
    gridRowCount === 1 ? twoRowGridLayoutHeight : oneRowGridLayoutHeight
  useEffect(() => {
    if (
      !hasInitializedRef.current ||
      isResizing ||
      layoutMode !== "2x2" ||
      Math.abs(height - staleGridLayoutHeight) > 8 ||
      Math.abs(height - layoutHeight) <= 8
    ) {
      return
    }

    setSize({ height: layoutHeight })
  }, [height, isResizing, layoutHeight, layoutMode, staleGridLayoutHeight, setSize])

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
      if (!hasPersistedSize && layoutMode !== "1x1") {
        setSize({
          width: layoutWidth,
          height: effectiveTileLayoutHeight,
        })
      }
    }
  }, [
    containerWidth,
    effectiveTileLayoutHeight,
    layoutMode,
    layoutWidth,
    setSize,
  ])

  // Responsive reflow: when width pressure changes significantly (e.g. sidebar toggle or
  // floating-panel resize), preserve the user's relative width preference instead of snapping
  // back to the layout default and unintentionally clearing manual height choices.
  const lastContainerWidthRef = useRef(containerWidth)
  useEffect(() => {
    if (
      !hasInitializedRef.current ||
      containerWidth <= 0 ||
      isResizing ||
      layoutMode === "1x1"
    ) {
      return
    }
    const prevWidth = lastContainerWidthRef.current
    lastContainerWidthRef.current = containerWidth
    // Only reflow if width changed by more than 20px (avoids sub-pixel jitter)
    if (prevWidth > 0 && Math.abs(containerWidth - prevWidth) > 20) {
      setSize({
        width: calculateResponsiveTileWidth({
          currentWidth: width,
          previousContainerWidth: prevWidth,
          nextContainerWidth: containerWidth,
          gap,
          layoutMode,
        }),
      })
    }
  }, [containerWidth, gap, layoutMode, setSize, isResizing, width])

  // Responsive height recovery: when the tiled viewport gets noticeably shorter,
  // clamp overly tall manual heights back to the current layout baseline so tiles
  // do not stay awkwardly oversized after a window-height change.
  const lastContainerHeightRef = useRef(containerHeight)
  useEffect(() => {
    if (
      !hasInitializedRef.current ||
      containerHeight <= 0 ||
      isResizing ||
      layoutMode === "1x1"
    ) {
      return
    }
    const prevHeight = lastContainerHeightRef.current
    lastContainerHeightRef.current = containerHeight
    // Only react when the available tiled height shrinks by more than 20px.
    if (prevHeight > 0 && prevHeight - containerHeight > 20) {
      const nextHeight = calculateResponsiveTileHeight({
        currentHeight: height,
        previousContainerHeight: prevHeight,
        nextContainerHeight: containerHeight,
        nextLayoutHeight: effectiveTileLayoutHeight,
      })

      if (nextHeight !== height) {
        setSize({ height: nextHeight })
      }
    }
  }, [
    containerHeight,
    effectiveTileLayoutHeight,
    height,
    isResizing,
    layoutMode,
    setSize,
  ])

  const usesExpandedTileWidth =
    isFocusLayout ||
    isTemporarySingleVisibleLayout ||
    isResponsiveStackedLayoutActive
  const renderedWidth = usesExpandedTileWidth ? expandedLayoutWidth : width
  const renderedHeight =
    isFocusLayout || isTemporarySingleVisibleLayout
      ? expandedLayoutHeight
      : height

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

  const handleTileResizeKeyDown = useCallback(
    (handleType: TileResizeHandleType, e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        isResizing ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return
      }

      const wantsReset = isTileResizeKeyboardResetKey(e.key)
      const adjustment = getTileResizeKeyboardAdjustment(handleType, e.key)

      if (!adjustment && !wantsReset) {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      clearPointerResizeFeedback()

      if (wantsReset) {
        const resetSize = getTileResizeResetSize(
          handleType,
          layoutWidth,
          effectiveTileLayoutHeight,
        )
        const nextSize = clampTileResizeFeedbackSize({
          width: resetSize.width ?? currentWidthRef.current,
          height: resetSize.height ?? currentHeightRef.current,
        })

        setKeyboardResizeFeedback({
          handleType,
          label: getTileResizeKeyboardFeedbackLabel(handleType, nextSize, {
            compact: nextSize.width < 380,
            reset: true,
          }),
        })
        setSize(resetSize)
        if (keyboardResizeFeedbackTimeoutRef.current !== null) {
          window.clearTimeout(keyboardResizeFeedbackTimeoutRef.current)
        }
        keyboardResizeFeedbackTimeoutRef.current = window.setTimeout(() => {
          setKeyboardResizeFeedback((current) =>
            current?.handleType === handleType ? null : current,
          )
          keyboardResizeFeedbackTimeoutRef.current = null
        }, TILE_KEYBOARD_RESIZE_FEEDBACK_TIMEOUT_MS)
        return
      }

      const nextSize = clampTileResizeFeedbackSize({
        width:
          adjustment.width !== undefined
            ? currentWidthRef.current + adjustment.width
            : currentWidthRef.current,
        height:
          adjustment.height !== undefined
            ? currentHeightRef.current + adjustment.height
            : currentHeightRef.current,
      })

      setKeyboardResizeFeedback({
        handleType,
        label: getTileResizeKeyboardFeedbackLabel(handleType, nextSize, {
          compact: nextSize.width < 380,
        }),
      })
      setSize({
        ...(adjustment.width !== undefined ? { width: nextSize.width } : {}),
        ...(adjustment.height !== undefined ? { height: nextSize.height } : {}),
      })
      if (keyboardResizeFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(keyboardResizeFeedbackTimeoutRef.current)
      }
      keyboardResizeFeedbackTimeoutRef.current = window.setTimeout(() => {
        setKeyboardResizeFeedback((current) =>
          current?.handleType === handleType ? null : current,
        )
        keyboardResizeFeedbackTimeoutRef.current = null
      }, TILE_KEYBOARD_RESIZE_FEEDBACK_TIMEOUT_MS)
    },
    [
      clearPointerResizeFeedback,
      effectiveTileLayoutHeight,
      isResizing,
      layoutWidth,
      setSize,
    ],
  )

  const handleReorderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      !isDraggable ||
      isResizing ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey
    ) {
      return
    }

    const wantsMoveBackward = e.key === "ArrowLeft" || e.key === "ArrowUp"
    const wantsMoveForward = e.key === "ArrowRight" || e.key === "ArrowDown"

    if (!wantsMoveBackward && !wantsMoveForward) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    if (wantsMoveBackward) {
      if (canMoveBackward) {
        onMoveBackward?.(sessionId)
      }
      return
    }

    if (canMoveForward) {
      onMoveForward?.(sessionId)
    }
  }

  const reorderHandleTitle = !canMoveBackward
    ? "Grab to reorder. Focus and press ArrowRight or ArrowDown to move this session later."
    : !canMoveForward
      ? "Grab to reorder. Focus and press ArrowLeft or ArrowUp to move this session earlier."
      : "Grab to reorder. Focus and press arrow keys to move this session earlier or later."
  const reorderHandleVisibleLabel = renderedWidth < 320 ? "Move" : "Reorder"
  const activeReorderHandleVisibleLabel = isDragging ? "Moving" : reorderHandleVisibleLabel
  const widthResizeHandleVisibleLabel = getTileResizeHandleVisibleLabel("width", {
    compact: renderedWidth < 360,
  })
  const heightResizeHandleVisibleLabel = getTileResizeHandleVisibleLabel("height", {
    compact: renderedWidth < 360,
  })
  const cornerResizeHandleVisibleLabel = getTileResizeHandleVisibleLabel("corner", {
    compact: renderedWidth < 340,
  })
  const reorderHandleAriaLabel = !canMoveBackward
    ? "Reorder session. Drag to move, or press ArrowRight or ArrowDown to move later."
    : !canMoveForward
      ? "Reorder session. Drag to move, or press ArrowLeft or ArrowUp to move earlier."
      : "Reorder session. Drag to move, or press arrow keys to move earlier or later."
  const dragTargetBadgeLabel =
    isDragTarget && dragTargetPosition
      ? getDragTargetBadgeLabel(dragTargetPosition)
      : "Drop to reorder"
  const showRestoredFromSingleViewHighlight =
    isRestoredFromSingleView && !isDragTarget && !isDragging
  const showNewSessionHighlight =
    isNewlyAdded &&
    !showRestoredFromSingleViewHighlight &&
    !isDragTarget &&
    !isDragging
  const showCollapsedTileHighlight =
    !!isCollapsed &&
    !showRestoredFromSingleViewHighlight &&
    !showNewSessionHighlight &&
    !isDragTarget &&
    !isDragging
  const showDraggingTileHighlight = isDragging && !isDragTarget
  const showResizeHandles =
    !isCollapsed &&
    !isFocusLayout &&
    !isTemporarySingleVisibleLayout &&
    !isReorderInteractionActive
  const showWidthResizeHandles =
    showResizeHandles && !isResponsiveStackedLayoutActive
  const activeResizeFeedbackHandle = isResizing
    ? activeResizeHandle
    : keyboardResizeFeedback?.handleType ?? pointerResizeFeedback?.handleType ?? null
  const activeResizeFeedbackLabel =
    isResizing && activeResizeHandle
      ? getTileResizeFeedbackLabel(
          activeResizeHandle,
          {
            width: renderedWidth,
            height: renderedHeight,
          },
          {
            compact: renderedWidth < 380,
          },
        )
      : keyboardResizeFeedback?.label ?? pointerResizeFeedback?.label ?? null

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/session-tile relative flex-shrink-0 transition-all duration-200",
        isResizing && "select-none",
        isDragTarget &&
          "z-10 ring-2 ring-blue-500/80 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_10px_24px_rgba(59,130,246,0.12)]",
        showRestoredFromSingleViewHighlight &&
          "z-[2] ring-2 ring-sky-500/60 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_14px_30px_rgba(14,165,233,0.12)]",
        showNewSessionHighlight &&
          "z-[1] ring-2 ring-blue-500/35 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_12px_28px_rgba(59,130,246,0.1)]",
        showCollapsedTileHighlight &&
          "z-[1] ring-1 ring-slate-400/45 ring-offset-1 ring-offset-background shadow-[0_0_0_1px_rgba(148,163,184,0.1),0_10px_24px_rgba(15,23,42,0.06)]",
        showDraggingTileHighlight &&
          "z-[1] opacity-65 ring-2 ring-blue-500/35 ring-offset-1 ring-offset-background shadow-[0_0_0_1px_rgba(59,130,246,0.1),0_12px_24px_rgba(59,130,246,0.08)]",
        className
      )}
      data-session-tile-restored={
        showRestoredFromSingleViewHighlight ? "true" : undefined
      }
      data-session-tile-new={showNewSessionHighlight ? "true" : undefined}
      data-session-tile-collapsed={
        showCollapsedTileHighlight ? "true" : undefined
      }
      data-session-tile-dragging={showDraggingTileHighlight ? "true" : undefined}
      style={{
        width: renderedWidth,
        height: isCollapsed ? "auto" : renderedHeight,
      }}
      onDragOver={handleDragOver}
    >
      {/* Drag handle indicator in top-left */}
      {isDraggable && (
        <div
          className={cn(
            "group/reorder-handle absolute left-1 top-1 z-10 flex min-h-8 min-w-8 items-center justify-center rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-1",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
          role="button"
          tabIndex={isResizing ? -1 : 0}
          aria-label={reorderHandleAriaLabel}
          aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
          data-session-tile-reorder-handle
          draggable={!isResizing}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onKeyDown={handleReorderKeyDown}
          title={reorderHandleTitle}
        >
          <div
            className={cn(
              "pointer-events-none inline-flex min-w-0 items-center rounded-full border border-border/60 bg-background/85 px-1.5 py-1.5 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 group-hover/session-tile:border-blue-500/40 group-hover/session-tile:bg-background/95 group-focus-visible/reorder-handle:border-blue-500/40 group-focus-visible/reorder-handle:bg-background/95",
              isDragging
                ? "border-blue-500/45 bg-blue-50/90 text-blue-700 shadow-[0_0_0_1px_rgba(59,130,246,0.08)] dark:bg-blue-950/40 dark:text-blue-200 opacity-100"
                : "opacity-70 group-hover/session-tile:opacity-100 group-focus-visible/reorder-handle:opacity-100",
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap text-[10px] font-medium leading-none transition-all duration-200",
                isDragging
                  ? "ml-1 max-w-20 opacity-100"
                  : "max-w-0 opacity-0 group-hover/session-tile:ml-1 group-hover/session-tile:max-w-20 group-hover/session-tile:opacity-100 group-focus-visible/reorder-handle:ml-1 group-focus-visible/reorder-handle:max-w-20 group-focus-visible/reorder-handle:opacity-100",
              )}
            >
              {activeReorderHandleVisibleLabel}
            </span>
          </div>
        </div>
      )}

      {isDragTarget ? (
        <>
          <div className="pointer-events-none absolute inset-1 z-10 rounded-lg border border-dashed border-blue-500/70 bg-blue-500/[0.07]" />
          {dragTargetPosition ? (
            <div
              aria-hidden="true"
              data-session-tile-drop-sequence={dragTargetPosition}
              className={cn(
                "pointer-events-none absolute left-5 right-5 z-20 h-1.5 rounded-full bg-blue-500/80 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]",
                getDragTargetInsertionCueClasses(dragTargetPosition),
              )}
            />
          ) : null}
          <div
            className="pointer-events-none absolute right-2 top-2 z-20 rounded-full border border-blue-500/50 bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-blue-700 shadow-sm dark:text-blue-200"
            title={dragTargetPosition ? `${dragTargetBadgeLabel} this session` : dragTargetBadgeLabel}
          >
            {dragTargetBadgeLabel}
          </div>
        </>
      ) : null}

      {showCollapsedTileHighlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-1 z-[1] rounded-lg border border-dashed border-slate-400/35 bg-slate-500/[0.04]"
        />
      ) : null}

      {activeResizeFeedbackLabel ? (
        <div
          aria-hidden="true"
          data-session-tile-resize-feedback={activeResizeFeedbackHandle}
          className="pointer-events-none absolute right-2 top-2 z-20 max-w-[calc(100%-3.5rem)] rounded-full border border-blue-500/35 bg-background/95 px-2 py-1 text-[10px] font-medium leading-none text-blue-700 shadow-sm backdrop-blur-sm dark:text-blue-200"
          title={activeResizeFeedbackLabel}
        >
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
            {activeResizeFeedbackLabel}
          </span>
        </div>
      ) : null}

      {/* Main content */}
      <div className={cn("w-full", isCollapsed ? "h-auto" : "h-full")}>
        {children}
      </div>

      {/* Resize handles - hide when collapsed or while reordering */}
      {showResizeHandles && (
        <>
          {showWidthResizeHandles && (
            <div
              className="group/resize-width absolute inset-y-0 right-0 z-10 flex w-3 cursor-ew-resize items-center justify-end outline-none transition-colors focus-visible:bg-blue-500/5 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1"
              data-session-tile-resize-handle="width"
              title={getTileResizeHandleTitle("width", true, true)}
              aria-label={getTileResizeHandleAriaLabel("width", true)}
              aria-keyshortcuts="ArrowLeft ArrowRight Enter"
              tabIndex={isResizing ? -1 : 0}
              onMouseDown={(e) => {
                startPointerResize("width")
                handleWidthResizeStart(e)
              }}
              onKeyDown={(e) => handleTileResizeKeyDown("width", e)}
              onDoubleClick={(e) => handlePointerResizeReset("width", e)}
            >
              <div
                className={cn(
                  "pointer-events-none mr-px h-[calc(100%-1rem)] w-px rounded-full bg-border/55 transition-all duration-200",
                  isResizing
                    ? "bg-blue-500/90 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                    : "opacity-45 group-hover/session-tile:opacity-100 group-focus-within/session-tile:opacity-100 group-hover/session-tile:bg-blue-500/50 group-focus-within/session-tile:bg-blue-500/50",
                )}
              />
              {widthResizeHandleVisibleLabel ? (
                <span
                  aria-hidden="true"
                  data-session-tile-resize-visible-label="width"
                  className={cn(
                    "pointer-events-none absolute z-10 inline-flex whitespace-nowrap rounded-full border border-border/60 bg-background/92 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200",
                    getTileResizeHandleVisibleLabelClasses("width"),
                    isResizing
                      ? "scale-95 opacity-0"
                      : "scale-95 opacity-0 group-hover/resize-width:scale-100 group-hover/resize-width:opacity-100 group-hover/resize-width:border-blue-500/55 group-hover/resize-width:bg-background/97 group-hover/resize-width:text-foreground group-focus-visible/resize-width:scale-100 group-focus-visible/resize-width:opacity-100 group-focus-visible/resize-width:border-blue-500/65 group-focus-visible/resize-width:bg-background/97 group-focus-visible/resize-width:text-foreground",
                  )}
                >
                  {widthResizeHandleVisibleLabel}
                </span>
              ) : null}
            </div>
          )}

          {/* Bottom edge resize handle */}
          <div
            className="group/resize-height absolute inset-x-0 bottom-0 z-10 flex h-3 cursor-ns-resize items-end justify-center outline-none transition-colors focus-visible:bg-blue-500/5 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1"
            data-session-tile-resize-handle="height"
            title={getTileResizeHandleTitle("height", true, true)}
            aria-label={getTileResizeHandleAriaLabel("height", true)}
            aria-keyshortcuts="ArrowUp ArrowDown Enter"
            tabIndex={isResizing ? -1 : 0}
            onMouseDown={(e) => {
              startPointerResize("height")
              handleHeightResizeStart(e)
            }}
            onKeyDown={(e) => handleTileResizeKeyDown("height", e)}
            onDoubleClick={(e) => handlePointerResizeReset("height", e)}
          >
            <div
              className={cn(
                "pointer-events-none mb-px h-px w-[calc(100%-1rem)] rounded-full bg-border/55 transition-all duration-200",
                isResizing
                  ? "bg-blue-500/90 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                  : "opacity-45 group-hover/session-tile:opacity-100 group-focus-within/session-tile:opacity-100 group-hover/session-tile:bg-blue-500/50 group-focus-within/session-tile:bg-blue-500/50",
              )}
            />
            {heightResizeHandleVisibleLabel ? (
              <span
                aria-hidden="true"
                data-session-tile-resize-visible-label="height"
                className={cn(
                  "pointer-events-none absolute z-10 inline-flex whitespace-nowrap rounded-full border border-border/60 bg-background/92 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200",
                  getTileResizeHandleVisibleLabelClasses("height"),
                  isResizing
                    ? "scale-95 opacity-0"
                    : "scale-95 opacity-0 group-hover/resize-height:scale-100 group-hover/resize-height:opacity-100 group-hover/resize-height:border-blue-500/55 group-hover/resize-height:bg-background/97 group-hover/resize-height:text-foreground group-focus-visible/resize-height:scale-100 group-focus-visible/resize-height:opacity-100 group-focus-visible/resize-height:border-blue-500/65 group-focus-visible/resize-height:bg-background/97 group-focus-visible/resize-height:text-foreground",
                )}
              >
                {heightResizeHandleVisibleLabel}
              </span>
            ) : null}
          </div>

          {showWidthResizeHandles && (
            <div
              className={cn(
                "group/resize-corner absolute bottom-0 right-0 z-20 flex min-h-6 min-w-6 cursor-nwse-resize items-center justify-end rounded-tl-md border-l border-t border-border/55 bg-background/70 px-1 py-0.5 shadow-sm backdrop-blur-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1",
                isResizing
                  ? "border-blue-500/70 bg-blue-500/15"
                  : "opacity-70 group-hover/session-tile:opacity-100 group-focus-within/session-tile:opacity-100 hover:border-blue-500/60 hover:bg-blue-500/10 focus-visible:border-blue-500/60 focus-visible:bg-blue-500/10",
              )}
              data-session-tile-resize-handle="corner"
              title={getTileResizeHandleTitle("corner", true, true)}
              aria-label={getTileResizeHandleAriaLabel("corner", true)}
              aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter"
              tabIndex={isResizing ? -1 : 0}
              onMouseDown={(e) => {
                startPointerResize("corner")
                handleCornerResizeStart(e)
              }}
              onKeyDown={(e) => handleTileResizeKeyDown("corner", e)}
              onDoubleClick={(e) => handlePointerResizeReset("corner", e)}
            >
              <svg
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-200",
                  isResizing ? "text-blue-500" : "text-muted-foreground/70",
                )}
                viewBox="0 0 16 16"
              >
                <path d="M14 14H10M14 14V10M14 14L10 10M14 8V6M8 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap text-[10px] font-medium leading-none transition-all duration-200",
                  isResizing
                    ? "ml-1 max-w-24 opacity-100 text-blue-600 dark:text-blue-300"
                    : "max-w-0 opacity-0 text-muted-foreground/80 group-hover/session-tile:ml-1 group-hover/session-tile:max-w-24 group-hover/session-tile:opacity-100 group-focus-visible/resize-corner:ml-1 group-focus-visible/resize-corner:max-w-24 group-focus-visible/resize-corner:opacity-100",
                )}
              >
                {cornerResizeHandleVisibleLabel}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
