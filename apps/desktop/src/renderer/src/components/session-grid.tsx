import React, { useRef, useState, useEffect, createContext, useContext, useCallback } from "react"
import { cn } from "@renderer/lib/utils"
import { Check, GripVertical } from "lucide-react"
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
  layoutRestoreWidth: number | null
  layoutRestoreHeight: number | null
  sessionCount: number
}

const SessionGridContext = createContext<SessionGridContextValue>({
  containerWidth: 0,
  containerHeight: 0,
  gap: 16,
  resetKey: 0,
  layoutMode: "1x2",
  layoutRestoreWidth: null,
  layoutRestoreHeight: null,
  sessionCount: 0,
})

export function useSessionGridContext() {
  return useContext(SessionGridContext)
}

interface SessionGridProps {
  children: React.ReactNode
  overlay?: React.ReactNode
  sessionCount: number
  className?: string
  resetKey?: number
  layoutMode?: TileLayoutMode
  layoutRestoreWidth?: number | null
  layoutRestoreHeight?: number | null
  layoutChangeKey?: number
  onMeasurementsChange?: (measurements: SessionGridMeasurements) => void
}

export interface SessionGridMeasurements {
  containerWidth: number
  containerHeight: number
  gap: number
}

export function SessionGrid({ children, overlay, sessionCount, className, resetKey = 0, layoutMode = "1x2", layoutRestoreWidth = null, layoutRestoreHeight = null, layoutChangeKey, onMeasurementsChange }: SessionGridProps) {
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

    // Sidebar collapse/expand animates width, so re-measure once after transition ends.
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
    <SessionGridContext.Provider value={{ containerWidth, containerHeight, gap, resetKey, layoutMode, layoutRestoreWidth, layoutRestoreHeight, sessionCount }}>
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-wrap gap-4 p-4 content-start min-h-full w-full",
          className
        )}
      >
        {children}
        {overlay}
      </div>
    </SessionGridContext.Provider>
  )
}

function getAvailableTileWidth(containerWidth: number): number {
  return Math.min(TILE_DIMENSIONS.width.max, Math.max(1, containerWidth))
}

const SINGLE_VIEW_WIDTH_RESTORE_MAX_TARGET_MULTIPLIER = 1.35
const SINGLE_VIEW_HEIGHT_RESTORE_MAX_TARGET_MULTIPLIER = 1.35

export function getEffectiveTileColumnCount(containerWidth: number, gap: number, layoutMode: TileLayoutMode): number {
  if (layoutMode === "1x1") {
    return 1
  }

  return containerWidth >= (TILE_DIMENSIONS.width.min * 2) + gap ? 2 : 1
}

export function getResponsiveStackedLayoutWidthShortfall(
  containerWidth: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount: number,
  warningBuffer = 0,
): number {
  if (layoutMode === "1x1" || sessionCount < 2 || containerWidth <= 0) {
    return 0
  }

  const requiredWidth = (TILE_DIMENSIONS.width.min * 2) + gap + warningBuffer

  return Math.max(0, Math.ceil(requiredWidth - containerWidth))
}

export function isResponsiveStackedTileLayout(
  containerWidth: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount: number,
): boolean {
  if (layoutMode === "1x1" || sessionCount < 2 || containerWidth <= 0) {
    return false
  }

  return getEffectiveTileColumnCount(containerWidth, gap, layoutMode) === 1
}

export function shouldLockTileWidth(containerWidth: number, gap: number, layoutMode: TileLayoutMode, sessionCount = 2): boolean {
  if (containerWidth <= 0) {
    return false
  }

  return layoutMode === "1x1" || shouldUseSingleVisibleTileFallback(sessionCount) || getEffectiveTileColumnCount(containerWidth, gap, layoutMode) === 1
}

export function shouldPreserveTileWidthOnLayoutChange(
  previousLayoutMode: TileLayoutMode,
  nextLayoutMode: TileLayoutMode,
  containerWidth: number,
  gap: number,
  sessionCount = 2,
): boolean {
  if (
    containerWidth <= 0 ||
    previousLayoutMode === nextLayoutMode ||
    previousLayoutMode === "1x1" ||
    nextLayoutMode === "1x1" ||
    shouldUseSingleVisibleTileFallback(sessionCount)
  ) {
    return false
  }

  return (
    !shouldLockTileWidth(containerWidth, gap, previousLayoutMode, sessionCount) &&
    !shouldLockTileWidth(containerWidth, gap, nextLayoutMode, sessionCount)
  )
}

export function shouldPreserveTileHeightOnLayoutChange(
  previousLayoutMode: TileLayoutMode,
  nextLayoutMode: TileLayoutMode,
  containerWidth: number,
  containerHeight: number,
  gap: number,
  sessionCount = 2,
): boolean {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    previousLayoutMode === nextLayoutMode ||
    previousLayoutMode === "1x1" ||
    nextLayoutMode === "1x1"
  ) {
    return false
  }

  const previousTargetHeight = calculateTileHeight(
    containerWidth,
    containerHeight,
    gap,
    previousLayoutMode,
    sessionCount,
  )
  const nextTargetHeight = calculateTileHeight(
    containerWidth,
    containerHeight,
    gap,
    nextLayoutMode,
    sessionCount,
  )

  return (
    Math.abs(previousTargetHeight - nextTargetHeight) <=
    LAYOUT_DRIVEN_HEIGHT_TOLERANCE_PX
  )
}

export function getSingleViewLayoutRestoreWidth(
  layoutRestoreWidth: number | null,
  targetTileWidth: number,
  maxWidth: number,
  isWidthResizeLocked: boolean,
): number | null {
  if (
    layoutRestoreWidth === null ||
    isWidthResizeLocked ||
    targetTileWidth <= 0 ||
    maxWidth <= 0
  ) {
    return null
  }

  const clampedRestoreWidth = Math.min(
    maxWidth,
    Math.max(TILE_DIMENSIONS.width.min, layoutRestoreWidth),
  )
  const maxRestorableWidth = Math.min(
    maxWidth,
    Math.max(
      targetTileWidth,
      Math.round(
        targetTileWidth * SINGLE_VIEW_WIDTH_RESTORE_MAX_TARGET_MULTIPLIER,
      ),
    ),
  )

  return clampedRestoreWidth <= maxRestorableWidth
    ? clampedRestoreWidth
    : null
}

export function getSingleViewLayoutRestoreHeight(
  layoutRestoreHeight: number | null,
  targetTileHeight: number,
): number | null {
  if (layoutRestoreHeight === null || targetTileHeight <= 0) {
    return null
  }

  const clampedRestoreHeight = Math.min(
    TILE_DIMENSIONS.height.max,
    Math.max(TILE_DIMENSIONS.height.min, layoutRestoreHeight),
  )
  const clampedTargetHeight = Math.min(
    TILE_DIMENSIONS.height.max,
    Math.max(TILE_DIMENSIONS.height.min, targetTileHeight),
  )
  const maxRestorableHeight = Math.min(
    TILE_DIMENSIONS.height.max,
    Math.max(
      clampedTargetHeight,
      Math.round(
        clampedTargetHeight * SINGLE_VIEW_HEIGHT_RESTORE_MAX_TARGET_MULTIPLIER,
      ),
    ),
  )

  return clampedRestoreHeight <= maxRestorableHeight
    ? clampedRestoreHeight
    : null
}

export function getTileWidthLockHint(
  containerWidth: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount = 2,
): { label: string; title: string } | null {
  if (!shouldLockTileWidth(containerWidth, gap, layoutMode, sessionCount)) {
    return null
  }

  if (layoutMode === "1x1") {
    return {
      label: "Width follows Single view",
      title:
        "Tile width fills Single view. Corner resize is unavailable here, so drag the bottom edge to resize height, or switch back to Compare or Grid to resize width again.",
    }
  }

  if (shouldUseSingleVisibleTileFallback(sessionCount)) {
    return {
      label: "Width fills the row",
      title:
        "Only one session is visible, so tile width fills the row. Corner resize is unavailable here; drag the bottom edge to resize height until more sessions appear or you switch layouts.",
    }
  }

  if (getEffectiveTileColumnCount(containerWidth, gap, layoutMode) === 1) {
    return {
      label: "Width follows stacked layout",
      title:
        "Tile width fills the stacked layout. Corner resize is unavailable here, so drag the bottom edge to resize height, or widen the sessions area or switch layouts to resize width again.",
    }
  }

  return {
    label: "Width follows layout",
    title: "Tile width follows the current layout.",
  }
}

export function getResizableTileWidthBounds(containerWidth: number): { minWidth: number; maxWidth: number } {
  if (containerWidth <= 0) {
    return {
      minWidth: TILE_DIMENSIONS.width.min,
      maxWidth: TILE_DIMENSIONS.width.max,
    }
  }

  const maxWidth = getAvailableTileWidth(containerWidth)

  return {
    minWidth: Math.min(TILE_DIMENSIONS.width.min, maxWidth),
    maxWidth,
  }
}

export type TileResizeHandle = "width" | "height" | "corner"

const RECENT_LOCKED_WIDTH_HEIGHT_RESTORE_CUE_DURATION_MS = 1_800

export function getIdleTileResizeHintLabel(
  resizeHandle: TileResizeHandle,
  isWidthResizeLocked: boolean,
): string {
  switch (resizeHandle) {
    case "width":
      return "Resize width · Double-click to fit"
    case "height":
      return `${isWidthResizeLocked ? "Resize height only" : "Resize height"} · Double-click to fit`
    case "corner":
      return "Resize tile · Double-click to fit"
  }
}

export function getActiveTileResizeHintLabel(
  resizeHandle: TileResizeHandle,
  width: number,
  height: number,
  isWidthResizeLocked: boolean,
): string {
  const roundedWidth = Math.round(width)
  const roundedHeight = Math.round(height)

  switch (resizeHandle) {
    case "width":
      return `Width · ${roundedWidth}px`
    case "height":
      return `${isWidthResizeLocked ? "Height only" : "Height"} · ${roundedHeight}px`
    case "corner":
      return `${roundedWidth}px × ${roundedHeight}px`
  }
}

export function getTileResizeHandleTitle(
  resizeHandle: TileResizeHandle,
  isWidthResizeLocked: boolean,
): string {
  switch (resizeHandle) {
    case "width":
      return "Drag to resize tile width. Double-click to restore the layout width."
    case "height":
      return isWidthResizeLocked
        ? "Drag the bottom edge to resize tile height while tile width follows the current layout. Double-click to restore the layout height."
        : "Drag to resize tile height. Double-click to restore the layout height."
    case "corner":
      return "Drag to resize tile width and height. Double-click to restore the layout size."
  }
}

export function getLockedWidthHeightRestoreCue(): {
  label: string
  badgeLabel: string | null
  title: string
} {
  return {
    label: "Height fit",
    badgeLabel: "Width follows layout",
    title:
      "Tile height returned to the current layout fit. Width still follows the current layout.",
  }
}

export function shouldPromoteTileReorderHandle(
  containerWidth: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount: number,
): boolean {
  return isResponsiveStackedTileLayout(
    containerWidth,
    gap,
    layoutMode,
    sessionCount,
  )
}

interface SessionTileWrapperProps {
  children: React.ReactNode
  sessionId: string
  tileLabel?: string
  draggedTileLabel?: string | null
  dropTargetIndicatorContextLabel?: string | null
  dropTargetIndicatorTitle?: string | null
  index: number
  className?: string
  isCollapsed?: boolean
  isDraggable?: boolean
  onDragStart?: (sessionId: string, index: number) => void
  onDragOver?: (index: number) => void
  onDragLeave?: (index: number) => void
  onDrop?: (index: number) => void
  onDragEnd?: () => void
  onKeyboardReorder?: (direction: "earlier" | "later") => void
  canMoveEarlier?: boolean
  canMoveLater?: boolean
  isDragTarget?: boolean
  isDragging?: boolean
  isRecentlyReordered?: boolean
  isRecentlyRestoredFromSingleView?: boolean
}

// When only one tile is visible, let it use the full row even in compare/grid so
// the layout does not look like a half-empty multi-column state.
function shouldUseSingleVisibleTileFallback(sessionCount: number): boolean {
  return sessionCount === 1
}

export function shouldUseSparseWideGridHeight(
  containerWidth: number,
  gap: number,
  layoutMode: TileLayoutMode,
  sessionCount: number,
): boolean {
  return (
    layoutMode === "2x2" &&
    sessionCount <= 2 &&
    getEffectiveTileColumnCount(containerWidth, gap, layoutMode) === 2
  )
}

// Calculate tile width based on layout mode, with a full-width single-column fallback
// when the container cannot fit two minimum-width tiles without clipping.
export function calculateTileWidth(containerWidth: number, gap: number, layoutMode: TileLayoutMode, sessionCount = 2): number {
  if (containerWidth <= 0) {
    return TILE_DIMENSIONS.width.default
  }

  const availableWidth = getAvailableTileWidth(containerWidth)

  if (layoutMode === "1x1" || shouldUseSingleVisibleTileFallback(sessionCount)) {
    return availableWidth
  }

  switch (layoutMode) {
    case "2x2":
    case "1x2":
    default:
      // Prefer two columns, but once two minimum-width tiles no longer fit,
      // stack tiles into a single full-width column instead of leaving clipped
      // or awkwardly narrow cards with unused horizontal space.
      if (getEffectiveTileColumnCount(containerWidth, gap, layoutMode) === 1) {
        return availableWidth
      }

      return Math.max(TILE_DIMENSIONS.width.min, Math.min(TILE_DIMENSIONS.width.max, Math.floor((containerWidth - gap) / 2)))
  }
}

// Calculate tile height based on layout mode. In narrow stacked 2-up mode, use a
// half-height target so the single-column fallback still feels like a dense 2-up
// browsing layout instead of turning into a sequence of full-screen tiles.
export function calculateTileHeight(containerWidth: number, containerHeight: number, gap: number, layoutMode: TileLayoutMode, sessionCount = 2): number {
  if (containerHeight <= 0) return TILE_DIMENSIONS.height.default

  const fullHeight = Math.min(TILE_DIMENSIONS.height.max, Math.max(TILE_DIMENSIONS.height.min, containerHeight))
  const halfHeight = Math.min(TILE_DIMENSIONS.height.max, Math.max(TILE_DIMENSIONS.height.min, Math.floor((containerHeight - gap) / 2)))

  if (layoutMode === "1x1" || shouldUseSingleVisibleTileFallback(sessionCount)) {
    return fullHeight
  }

  if (shouldUseSparseWideGridHeight(containerWidth, gap, layoutMode, sessionCount)) {
    return fullHeight
  }

  switch (layoutMode) {
    case "2x2":
      // Half height — 2 rows
      return halfHeight
    case "1x2":
    default:
      // In wide mode, 2-up is side-by-side and can use the full height. Once the
      // layout stacks to one column, keep roughly two cards visible vertically.
      return getEffectiveTileColumnCount(containerWidth, gap, layoutMode) === 1 ? halfHeight : fullHeight
  }
}

const LAYOUT_DRIVEN_HEIGHT_TOLERANCE_PX = 2
const LAYOUT_DRIVEN_WIDTH_TOLERANCE_PX = 2

function shouldRetargetLayoutDrivenTileHeight(
  currentHeight: number,
  previousTargetHeight: number,
  nextTargetHeight: number,
): boolean {
  return (
    previousTargetHeight !== nextTargetHeight &&
    Math.abs(currentHeight - previousTargetHeight) <=
      LAYOUT_DRIVEN_HEIGHT_TOLERANCE_PX
  )
}

export function shouldRetargetTileHeightOnContainerHeightChange(
  currentHeight: number,
  previousTargetHeight: number,
  nextTargetHeight: number,
): boolean {
  return shouldRetargetLayoutDrivenTileHeight(
    currentHeight,
    previousTargetHeight,
    nextTargetHeight,
  )
}

export function shouldRetargetTileHeightOnContainerWidthChange(
  currentHeight: number,
  previousTargetHeight: number,
  nextTargetHeight: number,
): boolean {
  return shouldRetargetLayoutDrivenTileHeight(
    currentHeight,
    previousTargetHeight,
    nextTargetHeight,
  )
}

export function shouldRetargetTileHeightOnSessionCountChange(
  currentHeight: number,
  previousTargetHeight: number,
  nextTargetHeight: number,
): boolean {
  return shouldRetargetLayoutDrivenTileHeight(
    currentHeight,
    previousTargetHeight,
    nextTargetHeight,
  )
}

export function getResponsiveTileWidthOnContainerWidthChange(
  currentWidth: number,
  previousTargetWidth: number,
  nextTargetWidth: number,
  minWidth: number,
  maxWidth: number,
): number | null {
  const clampedCurrentWidth = Math.min(maxWidth, Math.max(minWidth, currentWidth))

  if (clampedCurrentWidth !== currentWidth) {
    return clampedCurrentWidth
  }

  return previousTargetWidth !== nextTargetWidth &&
    Math.abs(currentWidth - previousTargetWidth) <=
      LAYOUT_DRIVEN_WIDTH_TOLERANCE_PX
    ? nextTargetWidth
    : null
}

export function SessionTileWrapper({
  children,
  sessionId,
  tileLabel,
  draggedTileLabel,
  dropTargetIndicatorContextLabel,
  dropTargetIndicatorTitle,
  index,
  className,
  isCollapsed,
  isDraggable = true,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onKeyboardReorder,
  canMoveEarlier = false,
  canMoveLater = false,
  isDragTarget,
  isDragging,
  isRecentlyReordered = false,
  isRecentlyRestoredFromSingleView = false,
}: SessionTileWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const recentLockedWidthHeightRestoreCueTimeoutRef = useRef<number | null>(null)
  const { containerWidth, containerHeight, gap, resetKey, layoutMode, layoutRestoreWidth, layoutRestoreHeight, sessionCount } = useSessionGridContext()
  const hasInitializedRef = useRef(false)
  const lastResetKeyRef = useRef(resetKey)
  const lastLayoutModeRef = useRef(layoutMode)
  const [activeResizeHandle, setActiveResizeHandle] = useState<TileResizeHandle | null>(null)
  const [hasRecentLockedWidthHeightRestoreCue, setHasRecentLockedWidthHeightRestoreCue] = useState(false)
  const isSingleVisibleTileFallback = shouldUseSingleVisibleTileFallback(sessionCount)
  const lastSingleVisibleTileFallbackRef = useRef(isSingleVisibleTileFallback)
  const isSparseWideGridLayout = shouldUseSparseWideGridHeight(
    containerWidth,
    gap,
    layoutMode,
    sessionCount,
  )
  const lastSparseWideGridLayoutRef = useRef(isSparseWideGridLayout)
  const targetTileWidth = calculateTileWidth(containerWidth, gap, layoutMode, sessionCount)
  const targetTileHeight = calculateTileHeight(containerWidth, containerHeight, gap, layoutMode, sessionCount)
  const lastTargetTileHeightRef = useRef(targetTileHeight)
  const isWidthResizeLocked = shouldLockTileWidth(containerWidth, gap, layoutMode, sessionCount)
  const lockedWidthHint = getTileWidthLockHint(
    containerWidth,
    gap,
    layoutMode,
    sessionCount,
  )
  const { minWidth, maxWidth } = isWidthResizeLocked
    ? { minWidth: targetTileWidth, maxWidth: targetTileWidth }
    : getResizableTileWidthBounds(containerWidth)

  const {
    width,
    height,
    isResizing,
    handleWidthResizeStart,
    handleHeightResizeStart,
    handleCornerResizeStart,
    setSize,
  } = useResizable({
    initialWidth: targetTileWidth,
    initialHeight: targetTileHeight,
    minWidth,
    maxWidth,
    storageKey: "session-tile",
  })

  useEffect(() => {
    if (!isResizing && activeResizeHandle !== null) {
      setActiveResizeHandle(null)
    }
  }, [activeResizeHandle, isResizing])

  const clearRecentLockedWidthHeightRestoreCue = useCallback(() => {
    if (recentLockedWidthHeightRestoreCueTimeoutRef.current !== null) {
      window.clearTimeout(recentLockedWidthHeightRestoreCueTimeoutRef.current)
      recentLockedWidthHeightRestoreCueTimeoutRef.current = null
    }

    setHasRecentLockedWidthHeightRestoreCue(false)
  }, [])

  const showRecentLockedWidthHeightRestoreCue = useCallback(() => {
    if (recentLockedWidthHeightRestoreCueTimeoutRef.current !== null) {
      window.clearTimeout(recentLockedWidthHeightRestoreCueTimeoutRef.current)
    }

    setHasRecentLockedWidthHeightRestoreCue(true)
    recentLockedWidthHeightRestoreCueTimeoutRef.current = window.setTimeout(() => {
      recentLockedWidthHeightRestoreCueTimeoutRef.current = null
      setHasRecentLockedWidthHeightRestoreCue(false)
    }, RECENT_LOCKED_WIDTH_HEIGHT_RESTORE_CUE_DURATION_MS)
  }, [])

  useEffect(() => () => {
    clearRecentLockedWidthHeightRestoreCue()
  }, [clearRecentLockedWidthHeightRestoreCue])

  useEffect(() => {
    if (!isWidthResizeLocked) {
      clearRecentLockedWidthHeightRestoreCue()
    }
  }, [clearRecentLockedWidthHeightRestoreCue, isWidthResizeLocked])

  // Reset tile size when resetKey changes (user clicked layout cycle button)
  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current && containerWidth > 0) {
      lastResetKeyRef.current = resetKey
      setSize({
        width: targetTileWidth,
        height: targetTileHeight,
      })
    }
  }, [resetKey, containerWidth, targetTileWidth, targetTileHeight, setSize])

  // Update tile size when layout mode changes. Preserve user-adjusted width or
  // height when Compare/Grid switches keep the same effective tile footprint,
  // and restore the previous multi-tile width plus any captured manual height
  // when leaving Single view for a tiled layout. Other transitions still
  // retarget the affected axes.
  useEffect(() => {
    const previousLayoutMode = lastLayoutModeRef.current

    if (layoutMode !== previousLayoutMode && containerWidth > 0) {
      lastLayoutModeRef.current = layoutMode
      const shouldPreserveWidth = shouldPreserveTileWidthOnLayoutChange(
        previousLayoutMode,
        layoutMode,
        containerWidth,
        gap,
        sessionCount,
      )
      const shouldPreserveHeight = shouldPreserveTileHeightOnLayoutChange(
        previousLayoutMode,
        layoutMode,
        containerWidth,
        containerHeight,
        gap,
        sessionCount,
      )
      const restoredWidthFromSingleView =
        previousLayoutMode === "1x1" &&
        layoutMode !== "1x1"
          ? getSingleViewLayoutRestoreWidth(
              layoutRestoreWidth,
              targetTileWidth,
              maxWidth,
              isWidthResizeLocked,
            )
          : null
      const restoredHeightFromSingleView =
        previousLayoutMode === "1x1" && layoutMode !== "1x1"
          ? getSingleViewLayoutRestoreHeight(
              layoutRestoreHeight,
              targetTileHeight,
            )
          : null

      setSize({
        ...(restoredWidthFromSingleView !== null
          ? { width: restoredWidthFromSingleView }
          : shouldPreserveWidth
            ? {}
            : { width: targetTileWidth }),
        ...(restoredHeightFromSingleView !== null
          ? { height: restoredHeightFromSingleView }
          : shouldPreserveHeight
            ? {}
            : { height: targetTileHeight }),
      })
    }
  }, [layoutMode, containerWidth, containerHeight, gap, isWidthResizeLocked, layoutRestoreHeight, layoutRestoreWidth, maxWidth, sessionCount, targetTileWidth, targetTileHeight, setSize])

  // When compare/grid switches between a lone visible tile and a true multi-tile
  // state, retarget width immediately so the row footprint stays truthful, but
  // only retarget height if the tile still appears to be following the previous
  // layout-driven target instead of a deliberate manual resize.
  useEffect(() => {
    if (lastSingleVisibleTileFallbackRef.current === isSingleVisibleTileFallback || containerWidth <= 0 || isResizing) {
      return
    }

    const previousTargetHeight = lastTargetTileHeightRef.current
    lastSingleVisibleTileFallbackRef.current = isSingleVisibleTileFallback
    const shouldRetargetHeight = shouldRetargetTileHeightOnSessionCountChange(
      height,
      previousTargetHeight,
      targetTileHeight,
    )
    setSize({
      width: targetTileWidth,
      ...(shouldRetargetHeight ? { height: targetTileHeight } : {}),
    })
  }, [containerWidth, height, isResizing, isSingleVisibleTileFallback, setSize, targetTileHeight, targetTileWidth])

  // When Grid switches between a sparse wide two-tile row and the ordinary
  // half-height grid, retarget height only while the tile still looks
  // layout-driven so a deliberate manual height is not overwritten when session
  // count changes.
  useEffect(() => {
    if (
      lastSparseWideGridLayoutRef.current === isSparseWideGridLayout ||
      containerWidth <= 0 ||
      isResizing
    ) {
      return
    }

    const previousTargetHeight = lastTargetTileHeightRef.current
    lastSparseWideGridLayoutRef.current = isSparseWideGridLayout
    const shouldRetargetHeight = shouldRetargetTileHeightOnSessionCountChange(
      height,
      previousTargetHeight,
      targetTileHeight,
    )

    if (shouldRetargetHeight) {
      setSize({ height: targetTileHeight })
    }
  }, [containerWidth, height, isResizing, isSparseWideGridLayout, setSize, targetTileHeight])

  useEffect(() => {
    lastTargetTileHeightRef.current = targetTileHeight
  }, [targetTileHeight])

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
          width: targetTileWidth,
          height: targetTileHeight,
        })
      }
    }
  }, [containerWidth, targetTileWidth, targetTileHeight, setSize])

  // In maximized or responsive full-width states, keep width locked to the
  // computed layout width so persisted narrow sizes cannot create awkward empty
  // gutters inside layouts that are supposed to fill the row.
  useEffect(() => {
    if (!isWidthResizeLocked || containerWidth <= 0 || isResizing || width === targetTileWidth) {
      return
    }

    setSize({ width: targetTileWidth })
  }, [containerWidth, isResizing, isWidthResizeLocked, setSize, targetTileWidth, width])

  // Responsive height reflow: when the available vertical space changes,
  // retarget layout-driven heights without overwriting a deliberate manual
  // resize that already diverged from the previous layout target.
  const lastContainerHeightRef = useRef(containerHeight)
  useEffect(() => {
    if (!hasInitializedRef.current || containerHeight <= 0 || isResizing) return

    const prevContainerHeight = lastContainerHeightRef.current
    lastContainerHeightRef.current = containerHeight

    // Only reflow if height changed by more than 20px (avoids sub-pixel jitter)
    if (prevContainerHeight > 0 && Math.abs(containerHeight - prevContainerHeight) > 20) {
      const prevTargetHeight = calculateTileHeight(
        containerWidth,
        prevContainerHeight,
        gap,
        layoutMode,
        sessionCount,
      )

      if (
        shouldRetargetTileHeightOnContainerHeightChange(
          height,
          prevTargetHeight,
          targetTileHeight,
        )
      ) {
        setSize({ height: targetTileHeight })
      }
    }
  }, [
    containerHeight,
    containerWidth,
    gap,
    height,
    isResizing,
    layoutMode,
    sessionCount,
    setSize,
    targetTileHeight,
  ])

  // Responsive width reflow: preserve manual width on ordinary width changes,
  // clamp it if the new bounds tighten, and only retarget height when a width
  // breakpoint changes the computed layout while the tile is still following
  // the prior layout-driven height.
  const lastContainerWidthRef = useRef(containerWidth)
  useEffect(() => {
    if (!hasInitializedRef.current || containerWidth <= 0 || isResizing) return
    const prevWidth = lastContainerWidthRef.current
    lastContainerWidthRef.current = containerWidth
    // Only reflow if width changed by more than 20px (avoids sub-pixel jitter)
    if (prevWidth > 0 && Math.abs(containerWidth - prevWidth) > 20) {
      const prevTargetWidth = calculateTileWidth(prevWidth, gap, layoutMode, sessionCount)
      const prevTargetHeight = calculateTileHeight(
        prevWidth,
        containerHeight,
        gap,
        layoutMode,
        sessionCount,
      )
      const nextResponsiveWidth = getResponsiveTileWidthOnContainerWidthChange(
        width,
        prevTargetWidth,
        targetTileWidth,
        minWidth,
        maxWidth,
      )
      const shouldRetargetHeight =
        shouldRetargetTileHeightOnContainerWidthChange(
          height,
          prevTargetHeight,
          targetTileHeight,
        )

      if (nextResponsiveWidth === null && !shouldRetargetHeight) {
        return
      }

      setSize({
        ...(nextResponsiveWidth !== null
          ? { width: nextResponsiveWidth }
          : {}),
        ...(shouldRetargetHeight
          ? { height: targetTileHeight }
          : {}),
      })
    }
  }, [
    containerHeight,
    containerWidth,
    gap,
    height,
    maxWidth,
    minWidth,
    layoutMode,
    setSize,
    isResizing,
    sessionCount,
    targetTileHeight,
    targetTileWidth,
    width,
  ])

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

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDraggable) return

    const relatedTarget = e.relatedTarget
    if (relatedTarget instanceof Node && e.currentTarget.contains(relatedTarget)) {
      return
    }

    onDragLeave?.(index)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!isDraggable) return
    e.preventDefault()
    onDrop?.(index)
  }

  const handleDragEnd = () => {
    if (!isDraggable) return
    onDragEnd?.()
  }

  const handleReorderKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isDraggable) return

    const isMoveEarlierKey = e.key === "ArrowLeft" || e.key === "ArrowUp"
    const isMoveLaterKey = e.key === "ArrowRight" || e.key === "ArrowDown"

    if (!isMoveEarlierKey && !isMoveLaterKey) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    if (isMoveEarlierKey) {
      if (!canMoveEarlier) return
      onKeyboardReorder?.("earlier")
      return
    }

    if (!canMoveLater) return
    onKeyboardReorder?.("later")
  }

  const resizeRailClassName = cn(
    "rounded-full transition-all duration-200 shadow-sm",
    isResizing
      ? "bg-blue-500/50 opacity-100"
      : "bg-border/40 opacity-75 group-hover/session-tile:bg-blue-500/30 group-hover/session-tile:opacity-100 group-focus-within/session-tile:bg-blue-500/30 group-focus-within/session-tile:opacity-100"
  )

  const resizeGripClassName = cn(
    "pointer-events-none absolute flex items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground/70 shadow-sm backdrop-blur-sm transition-all duration-200",
    isResizing
      ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300"
      : "group-hover/session-tile:border-blue-500/35 group-hover/session-tile:text-foreground/80 group-focus-within/session-tile:border-blue-500/35 group-focus-within/session-tile:text-foreground/80"
  )

  const resizeGripBarClassName = "rounded-full bg-current opacity-70"
  const shouldPromoteReorderHandle = shouldPromoteTileReorderHandle(
    containerWidth,
    gap,
    layoutMode,
    sessionCount,
  )

  const reorderHandleClassName = cn(
    "absolute -left-2 top-4 z-20 flex appearance-none select-none items-center gap-1 overflow-hidden rounded-r-full rounded-l-md border border-l-0 border-border/70 bg-background/95 px-1.5 py-1.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-[opacity,transform,box-shadow,border-color] duration-200 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    isDragging
      ? "opacity-100 shadow-md"
      : isRecentlyReordered
        ? "opacity-100 border-emerald-500/60 bg-emerald-500/12 text-emerald-700 shadow-md dark:text-emerald-200"
        : shouldPromoteReorderHandle
          ? "opacity-100 border-blue-500/25 bg-blue-500/5 text-blue-700 shadow-sm dark:text-blue-200"
      : "opacity-80 group-hover/session-tile:opacity-100 group-hover/session-tile:shadow-md group-focus-within/session-tile:opacity-100 group-focus-within/session-tile:shadow-md"
  )

  const reorderHandleLabelClassName = cn(
    "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-200",
    isDragging
      ? "ml-0.5 max-w-16 opacity-100"
      : isRecentlyReordered
        ? "ml-0.5 max-w-16 opacity-100"
        : shouldPromoteReorderHandle
          ? "ml-0.5 max-w-12 opacity-100"
      : "group-hover/session-tile:ml-0.5 group-hover/session-tile:max-w-16 group-hover/session-tile:opacity-100 group-focus-within/session-tile:ml-0.5 group-focus-within/session-tile:max-w-16 group-focus-within/session-tile:opacity-100"
  )

  const resizeHintClassName = "pointer-events-none absolute rounded-full border border-border/70 bg-background/95 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200"
  const activeResizeHintClassName = "border-blue-500/45 bg-blue-500/12 text-blue-700 opacity-100 shadow-md dark:text-blue-200"

  const lockedWidthHintClassName = cn(
    resizeHintClassName,
    "right-5 top-1/2 -translate-y-1/2 translate-x-1 opacity-0 group-hover/session-tile:translate-x-0 group-hover/session-tile:opacity-100 group-focus-within/session-tile:translate-x-0 group-focus-within/session-tile:opacity-100",
  )

  const lockedWidthRailClassName = cn(
    "rounded-full border border-dashed shadow-sm transition-all duration-200",
    isResizing
      ? "border-blue-500/30 bg-blue-500/10 opacity-90"
      : "border-border/60 bg-background/80 opacity-70 group-hover/session-tile:border-blue-500/35 group-hover/session-tile:bg-blue-500/5 group-hover/session-tile:opacity-100 group-focus-within/session-tile:border-blue-500/35 group-focus-within/session-tile:bg-blue-500/5 group-focus-within/session-tile:opacity-100"
  )

  const lockedWidthCornerClassName = cn(
    "flex items-end justify-end rounded-tl-md border-l border-t border-dashed border-border/60 bg-background/85 text-muted-foreground/70 shadow-sm backdrop-blur-sm transition-all duration-200",
    isResizing
      ? "border-blue-500/35 bg-blue-500/10 text-blue-600 dark:text-blue-300"
      : "group-hover/session-tile:border-blue-500/30 group-hover/session-tile:bg-blue-500/5 group-hover/session-tile:text-blue-700/80 group-focus-within/session-tile:border-blue-500/30 group-focus-within/session-tile:bg-blue-500/5 group-focus-within/session-tile:text-blue-700/80 dark:group-hover/session-tile:text-blue-300/80 dark:group-focus-within/session-tile:text-blue-300/80"
  )

  const lockedWidthCornerHintClassName = cn(
    resizeHintClassName,
    "bottom-6 right-6 translate-x-1 translate-y-1 opacity-0 group-hover/session-tile:translate-x-0 group-hover/session-tile:translate-y-0 group-hover/session-tile:opacity-100 group-focus-within/session-tile:translate-x-0 group-focus-within/session-tile:translate-y-0 group-focus-within/session-tile:opacity-100",
  )

  const heightResizeRailClassName = cn(
    resizeRailClassName,
    "h-1.5 w-[calc(100%-18px)] group-hover/resize-height:h-2 group-focus-within/session-tile:h-2"
  )

  const heightResizeHintClassName = cn(
    resizeHintClassName,
    "bottom-5 left-1/2 -translate-x-1/2 translate-y-1 opacity-0",
    isWidthResizeLocked
      ? "group-hover/session-tile:translate-y-0 group-hover/session-tile:opacity-100 group-focus-within/session-tile:translate-y-0 group-focus-within/session-tile:opacity-100 group-hover/resize-height:translate-y-0 group-hover/resize-height:opacity-100"
      : "group-hover/resize-height:translate-y-0 group-hover/resize-height:opacity-100"
  )

  const resizeCornerClassName = cn(
    "flex items-end justify-end rounded-tl-md border-l border-t border-border/50 bg-background/90 text-muted-foreground/75 shadow-sm backdrop-blur-sm transition-all duration-200",
    isResizing
      ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-300"
      : "group-hover/session-tile:border-blue-500/40 group-hover/session-tile:bg-background group-hover/session-tile:text-foreground group-focus-within/session-tile:border-blue-500/40 group-focus-within/session-tile:bg-background group-focus-within/session-tile:text-foreground"
  )

  const widthResizeHintLabel = activeResizeHandle === "width"
    ? getActiveTileResizeHintLabel(activeResizeHandle, width, height, isWidthResizeLocked)
    : getIdleTileResizeHintLabel("width", false)
  const activeHeightResizeLabel = activeResizeHandle === "height"
    ? getActiveTileResizeHintLabel(activeResizeHandle, width, height, isWidthResizeLocked)
    : getIdleTileResizeHintLabel("height", isWidthResizeLocked)
  const cornerResizeHintLabel = activeResizeHandle === "corner"
    ? getActiveTileResizeHintLabel(activeResizeHandle, width, height, isWidthResizeLocked)
    : getIdleTileResizeHintLabel("corner", isWidthResizeLocked)
  const heightResizeAriaLabel = isWidthResizeLocked
    ? "Resize tile height only"
    : "Resize tile height"
  const lockedWidthCornerHintLabel = isWidthResizeLocked && lockedWidthHint
    ? "Use bottom edge"
    : null
  const trimmedTileLabel = tileLabel?.trim()
  const trimmedDraggedTileLabel = draggedTileLabel?.trim()
  const draggedReorderLabel = trimmedDraggedTileLabel && trimmedDraggedTileLabel.length > 0
    ? trimmedDraggedTileLabel
    : "session"
  const reorderTargetLabel = trimmedTileLabel && trimmedTileLabel.length > 0
    ? trimmedTileLabel
    : "session"
  const reorderHandleTitle = trimmedTileLabel
    ? `Drag to reorder ${trimmedTileLabel}. Focus and use arrow keys to move earlier or later.`
    : "Drag to reorder session. Focus and use arrow keys to move earlier or later."
  const reorderHandleAriaLabel = trimmedTileLabel
    ? `Reorder ${trimmedTileLabel}. Use arrow keys to move earlier or later`
    : "Reorder session. Use arrow keys to move earlier or later"
  const reorderHandleLabel = isRecentlyReordered
    ? "Moved"
    : shouldPromoteReorderHandle
      ? "Move"
      : "Reorder"
  const dropTargetMoveLabel = trimmedDraggedTileLabel
    ? `Move ${draggedReorderLabel}`
    : "Drop here"
  const dropTargetContextLabel = dropTargetIndicatorContextLabel?.trim() || `before ${reorderTargetLabel}`
  const effectiveDropTargetIndicatorTitle = dropTargetIndicatorTitle?.trim() ||
    (trimmedDraggedTileLabel
      ? `Move ${draggedReorderLabel} ${dropTargetContextLabel}`
      : `Drop ${dropTargetContextLabel}`)
  const showRecentSingleViewReturnCue =
    isRecentlyRestoredFromSingleView && !isDragTarget && !isDragging
  const singleViewReturnCueLabel = showRecentSingleViewReturnCue
    ? "Kept visible"
    : null
  const recentLockedWidthHeightRestoreCue = hasRecentLockedWidthHeightRestoreCue
    ? getLockedWidthHeightRestoreCue()
    : null
  const tileAttentionRingClassName = isDragTarget
    ? "ring-2 ring-blue-500/90 ring-offset-2 shadow-lg"
    : isRecentlyReordered
      ? "ring-2 ring-emerald-500/60 ring-offset-2 shadow-lg shadow-emerald-500/15"
      : isRecentlyRestoredFromSingleView
        ? "ring-2 ring-blue-500/60 ring-offset-2 shadow-lg shadow-blue-500/15"
        : null

  const handleWidthResizeHandleMouseDown = useCallback((e: React.MouseEvent) => {
    clearRecentLockedWidthHeightRestoreCue()
    setActiveResizeHandle("width")
    handleWidthResizeStart(e)
  }, [clearRecentLockedWidthHeightRestoreCue, handleWidthResizeStart])

  const handleHeightResizeHandleMouseDown = useCallback((e: React.MouseEvent) => {
    clearRecentLockedWidthHeightRestoreCue()
    setActiveResizeHandle("height")
    handleHeightResizeStart(e)
  }, [clearRecentLockedWidthHeightRestoreCue, handleHeightResizeStart])

  const handleCornerResizeHandleMouseDown = useCallback((e: React.MouseEvent) => {
    clearRecentLockedWidthHeightRestoreCue()
    setActiveResizeHandle("corner")
    handleCornerResizeStart(e)
  }, [clearRecentLockedWidthHeightRestoreCue, handleCornerResizeStart])

  const handleRestoreLayoutWidth = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    clearRecentLockedWidthHeightRestoreCue()
    setActiveResizeHandle(null)
    setSize({ width: targetTileWidth })
  }, [clearRecentLockedWidthHeightRestoreCue, setSize, targetTileWidth])

  const handleRestoreLayoutHeight = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const shouldShowLockedWidthHeightRestoreCue =
      isWidthResizeLocked && Math.abs(height - targetTileHeight) > 0.5
    clearRecentLockedWidthHeightRestoreCue()
    setActiveResizeHandle(null)
    setSize({ height: targetTileHeight })

    if (shouldShowLockedWidthHeightRestoreCue) {
      showRecentLockedWidthHeightRestoreCue()
    }
  }, [clearRecentLockedWidthHeightRestoreCue, height, isWidthResizeLocked, setSize, showRecentLockedWidthHeightRestoreCue, targetTileHeight])

  const handleRestoreLayoutSize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    clearRecentLockedWidthHeightRestoreCue()
    setActiveResizeHandle(null)
    setSize({ width: targetTileWidth, height: targetTileHeight })
  }, [clearRecentLockedWidthHeightRestoreCue, setSize, targetTileHeight, targetTileWidth])

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/session-tile relative flex-shrink-0 transition-all duration-200",
        isResizing && "select-none",
        tileAttentionRingClassName,
        isDragging && "scale-[0.985] opacity-70 shadow-lg",
        className
      )}
      style={{ width, maxWidth: "100%", height: isCollapsed ? "auto" : height }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {/* Persistent drag affordance also serves as the actual drag source so tile content can stay focused on reading, scrolling, and selection. */}
      {isDraggable && (
        <button
          type="button"
          className={reorderHandleClassName}
          draggable={!isResizing}
          onKeyDown={handleReorderKeyDown}
          title={reorderHandleTitle}
          aria-label={reorderHandleAriaLabel}
          aria-keyshortcuts="ArrowLeft ArrowUp ArrowRight ArrowDown"
        >
          {isRecentlyReordered ? (
            <Check className="h-3 w-3 shrink-0" />
          ) : (
            <GripVertical
              className={cn(
                "h-3 w-3 shrink-0",
                shouldPromoteReorderHandle
                  ? "text-blue-600 dark:text-blue-300"
                  : "text-muted-foreground",
              )}
            />
          )}
          <span className={reorderHandleLabelClassName}>
            {reorderHandleLabel}
          </span>
        </button>
      )}

      {isDragTarget && (
        <div
          className="pointer-events-none absolute inset-x-3 top-0 z-20 -translate-y-1/2"
          aria-hidden="true"
        >
          <div className="flex flex-col items-end gap-1">
            <div className="h-1 w-full rounded-full bg-blue-500/90 shadow-sm" />
            <div
              className="flex max-w-full min-w-0 flex-col items-end gap-0.5 rounded-xl bg-blue-500 px-2 py-1.5 text-[10px] font-medium leading-none text-white shadow-sm"
              title={effectiveDropTargetIndicatorTitle}
            >
              <span className="max-w-[13rem] truncate text-white/85">
                {dropTargetMoveLabel}
              </span>
              <span className="max-w-[15rem] truncate font-semibold text-right">
                {dropTargetContextLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {singleViewReturnCueLabel ? (
        <div
          className="pointer-events-none absolute inset-x-3 top-0 z-20 -translate-y-1/2 flex justify-end"
          aria-hidden="true"
        >
          <div className="max-w-full rounded-full border border-blue-500/25 bg-background/95 px-2 py-1 text-[10px] font-medium text-blue-700 shadow-sm backdrop-blur-sm dark:text-blue-200">
            {singleViewReturnCueLabel}
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <div className={cn("w-full", isCollapsed ? "h-auto" : "h-full")}>
        {children}
      </div>

      {/* Resize handles - hide when collapsed */}
      {!isCollapsed && (
        <>
          {recentLockedWidthHeightRestoreCue ? (
            <div
              className="pointer-events-none absolute inset-x-3 bottom-6 z-20 flex justify-center"
            >
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                title={recentLockedWidthHeightRestoreCue.title}
                className="border-blue-500/20 bg-background/95 flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium text-blue-700 shadow-sm backdrop-blur-sm dark:text-blue-200"
              >
                <span className="whitespace-nowrap">{recentLockedWidthHeightRestoreCue.label}</span>
                {recentLockedWidthHeightRestoreCue.badgeLabel ? (
                  <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-200">
                    {recentLockedWidthHeightRestoreCue.badgeLabel}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {!isWidthResizeLocked && (
            <>
              {/* Right edge resize handle */}
              <div
                className="group/resize-width absolute top-2 bottom-4 -right-2 z-10 flex w-5 items-center justify-center cursor-ew-resize"
                onMouseDown={handleWidthResizeHandleMouseDown}
                onDoubleClick={handleRestoreLayoutWidth}
                title={getTileResizeHandleTitle("width", false)}
                aria-label="Resize tile width"
              >
                <div
                  className={cn(
                    resizeGripClassName,
                    "right-0 top-1/2 h-8 w-3 -translate-y-1/2 translate-x-1/2 flex-col gap-0.5"
                  )}
                  aria-hidden="true"
                >
                  <div className={cn(resizeGripBarClassName, "h-0.5 w-1")} />
                  <div className={cn(resizeGripBarClassName, "h-0.5 w-1")} />
                  <div className={cn(resizeGripBarClassName, "h-0.5 w-1")} />
                </div>
                <div
                  className={cn(
                    resizeRailClassName,
                    "h-[calc(100%-18px)] w-1.5 group-hover/resize-width:w-2 group-focus-within/session-tile:w-2"
                  )}
                />
                <div
                  className={cn(
                    resizeHintClassName,
                    "right-5 top-1/2 -translate-y-1/2 translate-x-1 opacity-0 group-hover/resize-width:translate-x-0 group-hover/resize-width:opacity-100",
                    activeResizeHandle === "width" && activeResizeHintClassName
                  )}
                  aria-hidden="true"
                >
                  {widthResizeHintLabel}
                </div>
              </div>

              {/* Corner resize handle */}
              <div
                className="group/resize-corner absolute -bottom-2 -right-2 z-20 flex h-7 w-7 items-end justify-end cursor-nwse-resize"
                onMouseDown={handleCornerResizeHandleMouseDown}
                onDoubleClick={handleRestoreLayoutSize}
                title={getTileResizeHandleTitle("corner", false)}
                aria-label="Resize tile width and height"
              >
                <div
                  className={cn(
                    resizeCornerClassName,
                    "h-5 w-5 pr-0.5 pb-0.5 group-hover/resize-corner:h-6 group-hover/resize-corner:w-6 group-focus-within/session-tile:h-6 group-focus-within/session-tile:w-6"
                  )}
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16">
                    <path d="M14 14H10M14 14V10M14 14L10 10M14 8V6M8 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <div
                  className={cn(
                    resizeHintClassName,
                    "bottom-6 right-6 translate-x-1 translate-y-1 opacity-0 group-hover/resize-corner:translate-x-0 group-hover/resize-corner:translate-y-0 group-hover/resize-corner:opacity-100",
                    activeResizeHandle === "corner" && activeResizeHintClassName
                  )}
                  aria-hidden="true"
                >
                  {cornerResizeHintLabel}
                </div>
              </div>
            </>
          )}

          {isWidthResizeLocked && lockedWidthHint && (
            <div
              className="group/locked-width absolute top-2 bottom-4 -right-2 z-10 flex w-5 items-center justify-center cursor-help"
              title={lockedWidthHint.title}
            >
              <div
                className={cn(
                  lockedWidthRailClassName,
                  "h-[calc(100%-18px)] w-1.5"
                )}
              />
              <div
                className={lockedWidthHintClassName}
                aria-hidden="true"
              >
                {lockedWidthHint.label}
              </div>
            </div>
          )}

          {isWidthResizeLocked && lockedWidthHint && (
            <div
              className="pointer-events-none absolute -bottom-2 -right-2 z-20 flex h-7 w-7 items-end justify-end"
              aria-hidden="true"
            >
              <div
                className={cn(
                  lockedWidthCornerClassName,
                  "h-5 w-5 pr-0.5 pb-0.5"
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16">
                  <path d="M14 14H10M14 14V10M14 14L10 10M14 8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
                </svg>
              </div>
              {lockedWidthCornerHintLabel ? (
                <div className={lockedWidthCornerHintClassName}>
                  {lockedWidthCornerHintLabel}
                </div>
              ) : null}
            </div>
          )}

          {/* Bottom edge resize handle */}
          <div
            className={cn(
              "group/resize-height absolute left-2 -bottom-2 z-10 flex h-5 items-center justify-center cursor-ns-resize",
              isWidthResizeLocked ? "right-2" : "right-4"
            )}
            onMouseDown={handleHeightResizeHandleMouseDown}
            onDoubleClick={handleRestoreLayoutHeight}
            title={getTileResizeHandleTitle("height", isWidthResizeLocked)}
            aria-label={heightResizeAriaLabel}
          >
            <div
              className={cn(
                resizeGripClassName,
                "bottom-0 left-1/2 h-3 w-8 -translate-x-1/2 translate-y-1/2 gap-0.5"
              )}
              aria-hidden="true"
            >
              <div className={cn(resizeGripBarClassName, "h-0.5 w-1")} />
              <div className={cn(resizeGripBarClassName, "h-0.5 w-1")} />
              <div className={cn(resizeGripBarClassName, "h-0.5 w-1")} />
            </div>
            <div
              className={heightResizeRailClassName}
            />
            <div
              className={cn(
                heightResizeHintClassName,
                activeResizeHandle === "height" && activeResizeHintClassName,
              )}
              aria-hidden="true"
            >
              {activeHeightResizeLabel}
            </div>
          </div>

        </>
      )}
    </div>
  )
}
