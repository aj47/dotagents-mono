import React, { useState, useEffect, useCallback, useRef } from "react"
import { ChevronsLeft, MoveDiagonal2 } from "lucide-react"
import { ResizeHandle, type ResizeHandlePosition } from "@renderer/components/resize-handle"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"

// Minimum height for waveform panel - matches WAVEFORM_MIN_HEIGHT in main/window.ts
const WAVEFORM_MIN_HEIGHT = 150
const PANEL_WIDTH_RECOVERY_REMINDER_THRESHOLD = 56
const COMPACT_ACTIVE_PANEL_RESIZE_HINT_WIDTH = 360
const RESTING_WIDTH_RECOVERY_HINT_DRAG_THRESHOLD = 4
type PanelMode = "normal" | "agent" | "textInput"
const isPanelMode = (value: unknown): value is PanelMode =>
  value === "normal" || value === "agent" || value === "textInput"
const isPanelSize = (value: unknown): value is { width: number; height: number } =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number"

interface PanelResizeWrapperProps {
  children: React.ReactNode
  className?: string
  enableResize?: boolean
  minWidth?: number
  minHeight?: number
}

function isLeftResizeHandle(position: ResizeHandlePosition | null): boolean {
  return position === "left" || position === "top-left" || position === "bottom-left"
}

function isRightResizeHandle(position: ResizeHandlePosition | null): boolean {
  return position === "right" || position === "top-right" || position === "bottom-right"
}

function isBottomResizeHandle(position: ResizeHandlePosition | null): boolean {
  return position === "bottom" || position === "bottom-left" || position === "bottom-right"
}

function isWidthResizeHandle(position: ResizeHandlePosition | null): boolean {
  return position === "left" || position === "right" || position?.includes("left") || position?.includes("right") || false
}

function isHeightResizeHandle(position: ResizeHandlePosition | null): boolean {
  return position === "top" || position === "bottom" || position?.includes("top") || position?.includes("bottom") || false
}

function getPanelResizeHintLabel(position: ResizeHandlePosition | null): string {
  switch (position) {
    case "left":
    case "right":
      return "Resize width"
    case "top":
    case "bottom":
      return "Resize height"
    default:
      return "Resize panel"
  }
}

function getPanelResizeCompactHintLabel(position: ResizeHandlePosition | null): string | null {
  switch (position) {
    case "left":
    case "right":
      return "Double-click to shrink width"
    case "top":
    case "bottom":
      return "Double-click to shrink height"
    case "top-left":
    case "top-right":
    case "bottom-left":
    case "bottom-right":
      return "Double-click to shrink panel"
    default:
      return null
  }
}

function getPanelResizeHandleTitle(
  position: ResizeHandlePosition,
  widthRecoveryAmount = 0,
): string {
  switch (position) {
    case "left":
    case "right":
      return widthRecoveryAmount > 0
        ? `Drag to resize panel width. Double-click to shrink width by about ${widthRecoveryAmount}px.`
        : "Drag to resize panel width. Double-click to shrink width."
    case "top":
    case "bottom":
      return "Drag to resize panel height. Double-click to shrink height."
    default:
      return "Drag to resize panel width and height. Double-click to shrink panel."
  }
}

const RESTING_WIDTH_RECOVERY_HINT_TITLE =
  "Click to shrink width. Drag this tab to resize panel width."

const PANEL_WIDTH_RECOVERY_BADGE_CLASS_NAME =
  "rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-blue-700 dark:text-blue-300"

function getPanelResizeCompactSize({
  position,
  currentSize,
  minWidth,
  minHeight,
}: {
  position: ResizeHandlePosition
  currentSize: { width: number; height: number }
  minWidth: number
  minHeight: number
}): { width: number; height: number } {
  return {
    width: isWidthResizeHandle(position) ? minWidth : currentSize.width,
    height: isHeightResizeHandle(position) ? minHeight : currentSize.height,
  }
}

function getPanelResizeConstraintLabel({
  isWidthConstrained,
  isHeightConstrained,
  compact = false,
}: {
  isWidthConstrained: boolean
  isHeightConstrained: boolean
  compact?: boolean
}): string | null {
  if (isWidthConstrained && isHeightConstrained) {
    return compact ? "Min size" : "Minimum size reached"
  }
  if (isWidthConstrained) {
    return compact ? "Min width" : "Minimum width reached"
  }
  if (isHeightConstrained) {
    return compact ? "Min height" : "Minimum height reached"
  }
  return null
}

function formatPanelResizeDelta(delta: number): string {
  return `${delta > 0 ? "+" : ""}${delta}px`
}

function getPanelResizeAxisDeltaLabel({
  axis,
  delta,
  compact = false,
}: {
  axis: "Width" | "Height"
  delta: number
  compact?: boolean
}): string | null {
  if (delta === 0) {
    return null
  }

  const axisLabel = compact ? axis.charAt(0) : axis

  return `${axisLabel} ${formatPanelResizeDelta(delta)}`
}

function getPanelResizeHintPositionClassName(position: ResizeHandlePosition | null): string {
  switch (position) {
    case "left":
      return "left-3 top-1/2 -translate-y-1/2"
    case "right":
      return "right-3 top-1/2 -translate-y-1/2"
    case "top":
      return "left-1/2 top-3 -translate-x-1/2"
    case "bottom":
      return "bottom-8 left-1/2 -translate-x-1/2"
    case "top-left":
      return "left-3 top-8"
    case "top-right":
      return "right-3 top-8"
    case "bottom-left":
      return "bottom-8 left-3"
    case "bottom-right":
    default:
      return "bottom-8 right-3"
  }
}

export function PanelResizeWrapper({
  children,
  className,
  enableResize = true,
  minWidth = 200,
  minHeight = WAVEFORM_MIN_HEIGHT,
}: PanelResizeWrapperProps) {
  const [currentSize, setCurrentSize] = useState({ width: 300, height: 200 })
  const [isResizeActive, setIsResizeActive] = useState(false)
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandlePosition | null>(null)
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<ResizeHandlePosition | null>(null)
  const activeResizeHandleRef = useRef<ResizeHandlePosition | null>(null)
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null)
  const restingWidthRecoveryGestureRef = useRef<{
    startScreenX: number
    startScreenY: number
    startSize: { width: number; height: number }
    dragStarted: boolean
  } | null>(null)
  const restingWidthRecoveryDragConsumedClickRef = useRef(false)
  const lastResizeCallRef = useRef<number>(0)
  const inFlightResizeUpdatesRef = useRef(new Set<Promise<unknown>>())
  const RESIZE_THROTTLE_MS = 16 // ~60fps

  const waitForPendingResizeUpdates = useCallback(async () => {
    const pendingUpdates = Array.from(inFlightResizeUpdatesRef.current)
    if (pendingUpdates.length > 0) {
      await Promise.allSettled(pendingUpdates)
    }
  }, [])

  const persistPanelSize = useCallback(async (
    requestedSize: { width: number; height: number },
    resizeAnchor?: ResizeHandlePosition | null,
  ) => {
    try {
      const updatedSize = await tipcClient.updatePanelSize({
        ...requestedSize,
        resizeAnchor,
      })
      const finalSize = isPanelSize(updatedSize) ? updatedSize : requestedSize
      setCurrentSize(finalSize)

      const rawMode = await tipcClient.getPanelMode()
      const mode: PanelMode = isPanelMode(rawMode) ? rawMode : "normal"
      await tipcClient.savePanelModeSize({
        mode,
        width: finalSize.width,
        height: finalSize.height,
      })

      return finalSize
    } catch (error) {
      try {
        await tipcClient.savePanelCustomSize(requestedSize)
        setCurrentSize(requestedSize)
        return requestedSize
      } catch (fallbackError) {
        console.error("Failed to save panel size:", error, fallbackError)
        return requestedSize
      }
    }
  }, [])

  useEffect(() => {
    // Initialize local size state from current window bounds; do not change size on mount
    const init = async () => {
      try {
        const size = await tipcClient.getPanelSize()
        if (isPanelSize(size)) {
          setCurrentSize(size)
        }
      } catch (error) {
        console.error("Failed to get panel size on mount:", error)
      }
    }
    init()
  }, [])

  // Listen for size changes from main process (when main programmatically resizes panel)
  useEffect(() => {
    const unlisten = rendererHandlers.onPanelSizeChanged.listen((size) => {
      if (isPanelSize(size)) {
        setCurrentSize(size)
      }
    })
    return unlisten
  }, [])

  const handleResizeStart = useCallback((
    position: ResizeHandlePosition,
    startSize: { width: number; height: number } = currentSize,
  ) => {
    // Capture current size at the start of resize operation
    resizeStartSizeRef.current = startSize
    activeResizeHandleRef.current = position
    setIsResizeActive(true)
    setActiveResizeHandle(position)
    setHoveredResizeHandle(position)
    // Reset throttle state so the first move in a new drag is never skipped.
    lastResizeCallRef.current = 0
  }, [currentSize])

  const handleResize = useCallback((delta: { width: number; height: number }) => {
    const startSize = resizeStartSizeRef.current
    if (!startSize || !enableResize) return

    // Throttle IPC calls to ~60fps to avoid race conditions
    const now = Date.now()
    if (now - lastResizeCallRef.current < RESIZE_THROTTLE_MS) {
      return // Skip this frame
    }
    lastResizeCallRef.current = now

    const newWidth = Math.max(minWidth, startSize.width + delta.width)
    const newHeight = Math.max(minHeight, startSize.height + delta.height)

    // Update local size immediately; send IPC without awaiting to avoid resize lag.
    setCurrentSize({ width: newWidth, height: newHeight })
    const updatePromise = tipcClient.updatePanelSize({
      width: newWidth,
      height: newHeight,
      resizeAnchor: activeResizeHandleRef.current,
    }).catch((error: unknown) => {
      console.error("Failed to update panel size:", error)
    })
    inFlightResizeUpdatesRef.current.add(updatePromise)
    void updatePromise.finally(() => {
      inFlightResizeUpdatesRef.current.delete(updatePromise)
    })
  }, [enableResize, minWidth, minHeight])

  const handleResizeEnd = useCallback(async (size: { width: number; height: number }) => {
    const resizeAnchor = activeResizeHandleRef.current
    setIsResizeActive(false)
    setActiveResizeHandle(null)
    setHoveredResizeHandle(null)
    activeResizeHandleRef.current = null
    resizeStartSizeRef.current = null
    if (!enableResize) return

    const requestedFinalSize = {
      width: Math.max(minWidth, size.width),
      height: Math.max(minHeight, size.height),
    }

    // Force one final size sync in case the last throttled mousemove was skipped.
    await waitForPendingResizeUpdates()
    await persistPanelSize(requestedFinalSize, resizeAnchor)
  }, [enableResize, minWidth, minHeight, persistPanelSize, waitForPendingResizeUpdates])

  const handleCompactResize = useCallback(async (position: ResizeHandlePosition) => {
    if (!enableResize) return

    const compactSize = getPanelResizeCompactSize({
      position,
      currentSize,
      minWidth,
      minHeight,
    })

    if (compactSize.width === currentSize.width && compactSize.height === currentSize.height) {
      return
    }

    setIsResizeActive(false)
    setActiveResizeHandle(null)
    setHoveredResizeHandle(position)
    activeResizeHandleRef.current = null
    resizeStartSizeRef.current = null
    lastResizeCallRef.current = 0

    setCurrentSize(compactSize)
    await waitForPendingResizeUpdates()
    await persistPanelSize(compactSize, position)
  }, [currentSize, enableResize, minHeight, minWidth, persistPanelSize, waitForPendingResizeUpdates])

  const handleRestingWidthRecoveryHintAction = useCallback(async () => {
    await handleCompactResize("left")
  }, [handleCompactResize])

  const handleRestingWidthRecoveryHintPointerDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!enableResize || event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    restingWidthRecoveryGestureRef.current = {
      startScreenX: event.screenX,
      startScreenY: event.screenY,
      startSize: currentSize,
      dragStarted: false,
    }
    restingWidthRecoveryDragConsumedClickRef.current = false
    setHoveredResizeHandle("left")
  }, [currentSize, enableResize])

  const handleRestingWidthRecoveryHintClick = useCallback(() => {
    if (restingWidthRecoveryDragConsumedClickRef.current) {
      restingWidthRecoveryDragConsumedClickRef.current = false
      return
    }

    void handleRestingWidthRecoveryHintAction()
  }, [handleRestingWidthRecoveryHintAction])

  useEffect(() => {
    if (!enableResize) {
      restingWidthRecoveryGestureRef.current = null
      restingWidthRecoveryDragConsumedClickRef.current = false
      return undefined
    }

    const handleRestingWidthRecoveryDragMove = (event: MouseEvent) => {
      const gesture = restingWidthRecoveryGestureRef.current
      if (!gesture) return

      const deltaX = event.screenX - gesture.startScreenX
      const deltaY = event.screenY - gesture.startScreenY

      if (!gesture.dragStarted) {
        if (Math.hypot(deltaX, deltaY) < RESTING_WIDTH_RECOVERY_HINT_DRAG_THRESHOLD) {
          return
        }

        gesture.dragStarted = true
        restingWidthRecoveryDragConsumedClickRef.current = true
        handleResizeStart("left", gesture.startSize)
      }

      event.preventDefault()
      handleResize({ width: -deltaX, height: 0 })
    }

    const handleRestingWidthRecoveryDragEnd = (event: MouseEvent) => {
      const gesture = restingWidthRecoveryGestureRef.current
      if (!gesture) return

      restingWidthRecoveryGestureRef.current = null

      if (!gesture.dragStarted) return

      const deltaX = event.screenX - gesture.startScreenX
      void handleResizeEnd({
        width: gesture.startSize.width - deltaX,
        height: gesture.startSize.height,
      })
      window.setTimeout(() => {
        restingWidthRecoveryDragConsumedClickRef.current = false
      }, 0)
    }

    document.addEventListener("mousemove", handleRestingWidthRecoveryDragMove)
    document.addEventListener("mouseup", handleRestingWidthRecoveryDragEnd)

    return () => {
      document.removeEventListener("mousemove", handleRestingWidthRecoveryDragMove)
      document.removeEventListener("mouseup", handleRestingWidthRecoveryDragEnd)
    }
  }, [enableResize, handleResize, handleResizeEnd, handleResizeStart])

  const highlightedResizeHandle = activeResizeHandle ?? hoveredResizeHandle
  const highlightLeftRail = isLeftResizeHandle(highlightedResizeHandle)
  const highlightRightRail = isRightResizeHandle(highlightedResizeHandle)
  const highlightBottomRail = isBottomResizeHandle(highlightedResizeHandle)
  const useCompactActiveResizeHintCopy =
    isResizeActive && currentSize.width < COMPACT_ACTIVE_PANEL_RESIZE_HINT_WIDTH
  const isWidthResizeConstrained =
    isResizeActive &&
    isWidthResizeHandle(activeResizeHandle) &&
    currentSize.width <= minWidth + 0.5
  const isHeightResizeConstrained =
    isResizeActive &&
    isHeightResizeHandle(activeResizeHandle) &&
    currentSize.height <= minHeight + 0.5
  const panelResizeConstraintLabel = getPanelResizeConstraintLabel({
    isWidthConstrained: isWidthResizeConstrained,
    isHeightConstrained: isHeightResizeConstrained,
    compact: useCompactActiveResizeHintCopy,
  })
  const activeResizeStartSize = isResizeActive ? resizeStartSizeRef.current : null
  const activePanelWidthDeltaLabel =
    isResizeActive &&
    activeResizeHandle &&
    isWidthResizeHandle(activeResizeHandle) &&
    activeResizeStartSize
      ? getPanelResizeAxisDeltaLabel({
          axis: "Width",
          delta: Math.round(currentSize.width - activeResizeStartSize.width),
          compact: useCompactActiveResizeHintCopy,
        })
      : null
  const activePanelHeightDeltaLabel =
    isResizeActive &&
    activeResizeHandle &&
    isHeightResizeHandle(activeResizeHandle) &&
    activeResizeStartSize
      ? getPanelResizeAxisDeltaLabel({
          axis: "Height",
          delta: Math.round(currentSize.height - activeResizeStartSize.height),
          compact: useCompactActiveResizeHintCopy,
        })
      : null
  const panelResizeCompactHintLabel =
    !isResizeActive && highlightedResizeHandle
      ? getPanelResizeCompactHintLabel(highlightedResizeHandle)
      : null
  const restingWidthRecoveryAmount = Math.max(
    0,
    Math.round(currentSize.width - minWidth),
  )
  const showPanelWidthCompactAmountLabel =
    !isResizeActive &&
    (highlightedResizeHandle === "left" || highlightedResizeHandle === "right") &&
    restingWidthRecoveryAmount > 0
  const panelWidthCompactAmountLabel = showPanelWidthCompactAmountLabel
    ? `-${restingWidthRecoveryAmount}px`
    : null
  const showRestingWidthRecoveryHint =
    !isResizeActive &&
    (!highlightedResizeHandle || highlightedResizeHandle === "left") &&
    currentSize.width > minWidth + PANEL_WIDTH_RECOVERY_REMINDER_THRESHOLD
  const restingWidthRecoveryAmountLabel =
    showRestingWidthRecoveryHint && restingWidthRecoveryAmount > 0
      ? `-${restingWidthRecoveryAmount}px`
      : null
  const restingWidthRecoveryHintTitle =
    restingWidthRecoveryAmount > 0
      ? `Click to shrink width by about ${restingWidthRecoveryAmount}px. Drag this tab to resize panel width.`
      : RESTING_WIDTH_RECOVERY_HINT_TITLE
  const panelResizeRailClassName = ({
    isHighlighted,
    showRecoveryReminder = false,
  }: {
    isHighlighted: boolean
    showRecoveryReminder?: boolean
  }) => cn(
    "absolute rounded-full shadow-sm transition-all duration-200",
    isResizeActive || isHighlighted
      ? "bg-blue-500/60 opacity-100"
      : showRecoveryReminder
        ? "bg-blue-500/45 opacity-90"
        : "bg-border/40 opacity-70 group-hover/panel-resize:bg-blue-500/35 group-hover/panel-resize:opacity-100"
  )

  const panelResizeCornerClassName = cn(
    "absolute flex items-end justify-end rounded-tl-md border-l border-t bg-background/90 p-0.5 text-muted-foreground/80 shadow-sm backdrop-blur-sm transition-all duration-200",
    isResizeActive
      ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-300"
      : "border-border/60 group-hover/panel-resize:border-blue-500/35 group-hover/panel-resize:bg-background group-hover/panel-resize:text-foreground"
  )

  const panelResizeHintClassName = cn(
    "absolute flex items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200",
    isResizeActive || !!highlightedResizeHandle
      ? "translate-y-0 opacity-100 text-foreground"
      : "translate-y-1 opacity-0 group-hover/panel-resize:translate-y-0 group-hover/panel-resize:opacity-100"
  )

  return (
    <div
      className={cn("group/panel-resize relative", className)}
      style={{
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
      }}
    >
      {children}

      {enableResize && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[950]" aria-hidden="true">
            <div
              className={cn(
                panelResizeRailClassName({
                  isHighlighted: highlightLeftRail,
                  showRecoveryReminder: showRestingWidthRecoveryHint,
                }),
                "left-0 top-6 bottom-8 w-1",
              )}
            />
            <div
              className={cn(
                panelResizeRailClassName({ isHighlighted: highlightRightRail }),
                "right-0 top-6 bottom-8 w-1",
              )}
            />
            <div
              className={cn(
                panelResizeRailClassName({ isHighlighted: highlightBottomRail }),
                "bottom-0 left-6 right-8 h-1",
              )}
            />
            <div className={cn(panelResizeCornerClassName, "bottom-2 right-2 h-5 w-5")}>
              <MoveDiagonal2 className="h-3.5 w-3.5" />
            </div>
            {showRestingWidthRecoveryHint && (
              <div className="absolute -left-1 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-r-full border border-l-0 border-blue-500/25 bg-background/95 pl-2 pr-2 py-1 text-[10px] font-medium text-blue-700 shadow-sm backdrop-blur-sm dark:text-blue-300">
                <ChevronsLeft className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">Shrink width</span>
                {restingWidthRecoveryAmountLabel && (
                  <span className={PANEL_WIDTH_RECOVERY_BADGE_CLASS_NAME}>
                    {restingWidthRecoveryAmountLabel}
                  </span>
                )}
              </div>
            )}
            <div className={cn(panelResizeHintClassName, getPanelResizeHintPositionClassName(highlightedResizeHandle))}>
              <MoveDiagonal2 className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">{getPanelResizeHintLabel(highlightedResizeHandle)}</span>
              {isResizeActive && (
                <span className="whitespace-nowrap text-muted-foreground/80">
                  {useCompactActiveResizeHintCopy
                    ? `${currentSize.width}×${currentSize.height}`
                    : `${currentSize.width} × ${currentSize.height}`}
                </span>
              )}
              {activePanelWidthDeltaLabel && (
                <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                  {activePanelWidthDeltaLabel}
                </span>
              )}
              {activePanelHeightDeltaLabel && (
                <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                  {activePanelHeightDeltaLabel}
                </span>
              )}
              {panelResizeConstraintLabel && (
                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                  {panelResizeConstraintLabel}
                </span>
              )}
              {panelResizeCompactHintLabel && (
                <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">
                  {panelResizeCompactHintLabel}
                </span>
              )}
              {panelWidthCompactAmountLabel && (
                <span className={PANEL_WIDTH_RECOVERY_BADGE_CLASS_NAME}>
                  {panelWidthCompactAmountLabel}
                </span>
              )}
            </div>
          </div>

          {showRestingWidthRecoveryHint && (
            <button
              type="button"
              className="absolute -left-1 top-1/2 z-[960] flex -translate-y-1/2 cursor-ew-resize items-center gap-1 rounded-r-full border border-l-0 border-blue-500/25 bg-background/95 pl-2 pr-2 py-1 text-[10px] font-medium text-blue-700 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-blue-300"
              title={restingWidthRecoveryHintTitle}
              aria-label="Shrink panel width"
              onMouseDown={handleRestingWidthRecoveryHintPointerDown}
              onClick={handleRestingWidthRecoveryHintClick}
              onMouseEnter={() => setHoveredResizeHandle("left")}
              onMouseLeave={() => setHoveredResizeHandle(null)}
              onFocus={() => setHoveredResizeHandle("left")}
              onBlur={() => setHoveredResizeHandle(null)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return

                event.preventDefault()
                void handleRestingWidthRecoveryHintAction()
              }}
            >
              <ChevronsLeft className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">Shrink width</span>
              {restingWidthRecoveryAmountLabel && (
                <span className={PANEL_WIDTH_RECOVERY_BADGE_CLASS_NAME}>
                  {restingWidthRecoveryAmountLabel}
                </span>
              )}
            </button>
          )}

          {/* Corner resize handles */}
          <ResizeHandle
            position="bottom-right"
            title={getPanelResizeHandleTitle("bottom-right")}
            ariaLabel="Resize panel width and height"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
          <ResizeHandle
            position="bottom-left"
            title={getPanelResizeHandleTitle("bottom-left")}
            ariaLabel="Resize panel width and height"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
          <ResizeHandle
            position="top-right"
            title={getPanelResizeHandleTitle("top-right")}
            ariaLabel="Resize panel width and height"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
          <ResizeHandle
            position="top-left"
            title={getPanelResizeHandleTitle("top-left")}
            ariaLabel="Resize panel width and height"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />

          {/* Edge resize handles */}
          <ResizeHandle
            position="right"
            title={getPanelResizeHandleTitle("right", restingWidthRecoveryAmount)}
            ariaLabel="Resize panel width"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
          <ResizeHandle
            position="left"
            title={getPanelResizeHandleTitle("left", restingWidthRecoveryAmount)}
            ariaLabel="Resize panel width"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
          <ResizeHandle
            position="bottom"
            title={getPanelResizeHandleTitle("bottom")}
            ariaLabel="Resize panel height"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
          <ResizeHandle
            position="top"
            title={getPanelResizeHandleTitle("top")}
            ariaLabel="Resize panel height"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onHoverChange={setHoveredResizeHandle}
            onDoubleClick={handleCompactResize}
          />
        </>
      )}
    </div>
  )
}
