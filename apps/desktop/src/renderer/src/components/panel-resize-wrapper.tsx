import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  ResizeHandle,
  type ResizeHandleCommitMeta,
  type ResizeHandlePosition,
} from "@renderer/components/resize-handle"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"

// Minimum height for waveform panel - matches WAVEFORM_MIN_HEIGHT in main/window.ts
const WAVEFORM_MIN_HEIGHT = 150
const PANEL_TILING_HINT_DEADBAND_PX = 12
const PANEL_POINTER_TILING_HINT_TIMEOUT_MS = 1200
const PANEL_KEYBOARD_TILING_HINT_TIMEOUT_MS = 1800
const AGENT_PANEL_DEFAULT_WIDTH = 600
const PANEL_TILE_PRESSURE_WIDTH = AGENT_PANEL_DEFAULT_WIDTH + 64
type PanelMode = "normal" | "agent" | "textInput"
type PanelTilingHintTone = "neutral" | "crowded" | "relief"
const isPanelMode = (value: unknown): value is PanelMode =>
  value === "normal" || value === "agent" || value === "textInput"
const isPanelSize = (value: unknown): value is { width: number; height: number } =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number"
const isWidthAffectingResizeHandle = (position: ResizeHandlePosition | null) =>
  position === "left" ||
  position === "right" ||
  position === "top-left" ||
  position === "top-right" ||
  position === "bottom-left" ||
  position === "bottom-right"

function getPanelTilePressureWidth(panelWidth: number): number {
  return Math.max(0, Math.round(panelWidth - PANEL_TILE_PRESSURE_WIDTH))
}

function getPanelTilePressureDetail(panelWidth: number): string | null {
  const panelTilePressureWidth = getPanelTilePressureWidth(panelWidth)

  return panelTilePressureWidth > 0
    ? `${panelTilePressureWidth}px past tile comfort`
    : null
}

function getPanelTilePressureBadgeLabel(
  pressureWidth: number,
  options?: { compact?: boolean },
): string | null {
  if (pressureWidth <= 0) {
    return null
  }

  return options?.compact ? `+${pressureWidth}px` : `${pressureWidth}px over`
}

function getPanelTilePressureWidthDeltaBadgeLabel(pressureWidth: number): string | null {
  if (pressureWidth <= 0) {
    return null
  }

  return `Need ~${pressureWidth}px narrower`
}

function getPanelTileComfortHeadroomBadgeLabel(remainingComfortWidth: number): string | null {
  if (remainingComfortWidth <= 0) {
    return null
  }

  return `~${remainingComfortWidth}px left`
}

function getPanelTilingWidthDeltaDetail(panelWidth: number): string {
  const panelTilePressureWidth = getPanelTilePressureWidth(panelWidth)
  const panelTileComfortWidthLabel = getPanelTileComfortWidthLabel()

  if (panelTilePressureWidth > 0) {
    return `Need ~${panelTilePressureWidth}px narrower for Compare/Grid comfort`
  }

  const remainingComfortWidth = Math.max(
    0,
    Math.round(PANEL_TILE_PRESSURE_WIDTH - panelWidth),
  )

  if (remainingComfortWidth === 0) {
    return `At the ${panelTileComfortWidthLabel} Compare/Grid comfort limit`
  }

  return `~${remainingComfortWidth}px left before Compare/Grid gets tight`
}

function getPanelWidthBadgeLabel(panelWidth: number): string {
  return `${Math.round(panelWidth)}px wide`
}

function getPanelTilingMetricBadge(
  panelWidth: number,
): { label: string; tone: PanelTilingHintTone } {
  const panelTilePressureWidth = getPanelTilePressureWidth(panelWidth)

  if (panelTilePressureWidth > 0) {
    return {
      label: getPanelTilePressureWidthDeltaBadgeLabel(panelTilePressureWidth) ?? "At tile comfort limit",
      tone: "crowded",
    }
  }

  const remainingComfortWidth = Math.max(
    0,
    Math.round(PANEL_TILE_PRESSURE_WIDTH - panelWidth),
  )

  if (remainingComfortWidth === 0) {
    return {
      label: "At tile comfort limit",
      tone: "neutral",
    }
  }

  return {
    label: getPanelTileComfortHeadroomBadgeLabel(remainingComfortWidth) ?? "At tile comfort limit",
    tone: "relief",
  }
}

function getPanelTileComfortWidthLabel(): string {
  return `${PANEL_TILE_PRESSURE_WIDTH}px`
}

function getPanelTilingHint({
  panelWidth,
  panelWidthChange,
}: {
  panelWidth: number
  panelWidthChange: number
}): { label: string; detail: string; tone: PanelTilingHintTone } {
  const roundedPanelWidth = Math.round(panelWidth)
  const isPanelLikelyCrowdingTiles = panelWidth >= PANEL_TILE_PRESSURE_WIDTH
  const panelTilingWidthDeltaDetail = getPanelTilingWidthDeltaDetail(panelWidth)

  if (panelWidthChange > PANEL_TILING_HINT_DEADBAND_PX) {
    return {
      label: isPanelLikelyCrowdingTiles
        ? "Wide panel is crowding Compare/Grid"
        : "Less room for tiled sessions",
      detail: `${panelTilingWidthDeltaDetail} · ${roundedPanelWidth}px wide`,
      tone: "crowded",
    }
  }

  if (panelWidthChange < -PANEL_TILING_HINT_DEADBAND_PX) {
    return {
      label: isPanelLikelyCrowdingTiles
        ? "Compare/Grid still tight"
        : "More room for tiled sessions",
      detail: `${panelTilingWidthDeltaDetail} · ${roundedPanelWidth}px wide`,
      tone: isPanelLikelyCrowdingTiles ? "crowded" : "relief",
    }
  }

  return {
    label: "Panel width affects tiled session space",
    detail: `${panelTilingWidthDeltaDetail} · ${roundedPanelWidth}px wide`,
    tone: isPanelLikelyCrowdingTiles ? "crowded" : "neutral",
  }
}

interface PanelResizeWrapperProps {
  children: React.ReactNode
  className?: string
  enableResize?: boolean
  disableTopEdgeResize?: boolean
  minWidth?: number
  minHeight?: number
}

export function PanelResizeWrapper({
  children,
  className,
  enableResize = true,
  disableTopEdgeResize = false,
  minWidth = 200,
  minHeight = WAVEFORM_MIN_HEIGHT,
}: PanelResizeWrapperProps) {
  const [currentSize, setCurrentSize] = useState({ width: 300, height: 200 })
  const [activePanelRecoveryAction, setActivePanelRecoveryAction] = useState<"reset" | "hide" | null>(null)
  const [activeResizePosition, setActiveResizePosition] = useState<ResizeHandlePosition | null>(null)
  const [isResizeGestureActive, setIsResizeGestureActive] = useState(false)
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null)
  const lastResizeCallRef = useRef<number>(0)
  const inFlightResizeUpdatesRef = useRef(new Set<Promise<unknown>>())
  const tilingHintTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const RESIZE_THROTTLE_MS = 16 // ~60fps

  const clearPendingTilingHint = useCallback(() => {
    if (tilingHintTimeoutRef.current !== null) {
      window.clearTimeout(tilingHintTimeoutRef.current)
      tilingHintTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearPendingTilingHint()
    }
  }, [clearPendingTilingHint])

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

  const handleResizeStart = useCallback((position: ResizeHandlePosition) => {
    clearPendingTilingHint()
    // Capture current size at the start of resize operation
    resizeStartSizeRef.current = currentSize
    setActiveResizePosition(position)
    setIsResizeGestureActive(true)
    // Reset throttle state so the first move in a new drag is never skipped.
    lastResizeCallRef.current = 0
  }, [clearPendingTilingHint, currentSize])

  const settlePanelTilingHint = useCallback((meta?: ResizeHandleCommitMeta) => {
    const shouldKeepPanelTilingHintVisible =
      enableResize &&
      !!meta &&
      !!meta.startingSize &&
      isWidthAffectingResizeHandle(meta.position)

    clearPendingTilingHint()

    if (!shouldKeepPanelTilingHintVisible || !meta || !meta.startingSize) {
      resizeStartSizeRef.current = null
      setActiveResizePosition(null)
      return
    }

    resizeStartSizeRef.current = meta.startingSize
    setActiveResizePosition(meta.position)
    const hintTimeoutMs =
      meta.source === "keyboard"
        ? PANEL_KEYBOARD_TILING_HINT_TIMEOUT_MS
        : PANEL_POINTER_TILING_HINT_TIMEOUT_MS

    tilingHintTimeoutRef.current = window.setTimeout(() => {
      resizeStartSizeRef.current = null
      setActiveResizePosition(null)
      tilingHintTimeoutRef.current = null
    }, hintTimeoutMs)
  }, [clearPendingTilingHint, enableResize])

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
    const updatePromise = tipcClient.updatePanelSize({ width: newWidth, height: newHeight }).catch((error: unknown) => {
      console.error("Failed to update panel size:", error)
    })
    inFlightResizeUpdatesRef.current.add(updatePromise)
    void updatePromise.finally(() => {
      inFlightResizeUpdatesRef.current.delete(updatePromise)
    })
  }, [enableResize, minWidth, minHeight])

  const handleResizeEnd = useCallback(async (
    size: { width: number; height: number },
    meta?: ResizeHandleCommitMeta,
  ) => {
    if (!enableResize) return

    const requestedFinalSize = {
      width: Math.max(minWidth, size.width),
      height: Math.max(minHeight, size.height),
    }

    setIsResizeGestureActive(false)

    // Force one final size sync in case the last throttled mousemove was skipped.
    try {
      // Ensure all throttled fire-and-forget updates are finished before final sync.
      const pendingUpdates = Array.from(inFlightResizeUpdatesRef.current)
      if (pendingUpdates.length > 0) {
        await Promise.allSettled(pendingUpdates)
      }

      const updatedSize = await tipcClient.updatePanelSize(requestedFinalSize)
      const finalSize = isPanelSize(updatedSize) ? updatedSize : requestedFinalSize
      setCurrentSize(finalSize)
      settlePanelTilingHint(meta)

      // Save the final size by mode so waveform and progress views don't override each other.
      const rawMode = await tipcClient.getPanelMode()
      const mode: PanelMode = isPanelMode(rawMode) ? rawMode : "normal"
      await tipcClient.savePanelModeSize({
        mode,
        width: finalSize.width,
        height: finalSize.height,
      })
    } catch (error) {
      try {
        // Fallback for older router builds that may not have mode-aware persistence.
        await tipcClient.savePanelCustomSize(requestedFinalSize)
        setCurrentSize(requestedFinalSize)
        settlePanelTilingHint(meta)
      } catch (fallbackError) {
        settlePanelTilingHint()
        console.error("Failed to save panel size:", error, fallbackError)
      }
    }
  }, [enableResize, minWidth, minHeight, settlePanelTilingHint])

  const handleResetPanelSize = useCallback(async (meta?: ResizeHandleCommitMeta) => {
    if (!enableResize || activePanelRecoveryAction) return

    setActivePanelRecoveryAction("reset")
    clearPendingTilingHint()
    setIsResizeGestureActive(false)

    const settledHintMeta =
      meta && !meta.startingSize && isWidthAffectingResizeHandle(meta.position)
        ? {
            ...meta,
            startingSize: currentSize,
          }
        : meta

    try {
      const resetSize = await tipcClient.resetPanelSizeForCurrentMode({})
      if (isPanelSize(resetSize)) {
        setCurrentSize(resetSize)
      }
      settlePanelTilingHint(settledHintMeta)
    } catch (error) {
      settlePanelTilingHint()
      console.error("Failed to reset panel size:", error)
    } finally {
      setActivePanelRecoveryAction(null)
    }
  }, [activePanelRecoveryAction, clearPendingTilingHint, currentSize, enableResize, settlePanelTilingHint])

  const resizeStartSize = resizeStartSizeRef.current
  const panelWidthChange = resizeStartSize ? currentSize.width - resizeStartSize.width : 0
  const showPanelTilingHint = enableResize && isWidthAffectingResizeHandle(activeResizePosition)
  const showPersistentPanelRecovery =
    enableResize &&
    !isResizeGestureActive &&
    currentSize.width >= PANEL_TILE_PRESSURE_WIDTH
  const panelTilePressureWidth = getPanelTilePressureWidth(currentSize.width)
  const panelTilingHint = getPanelTilingHint({
    panelWidth: currentSize.width,
    panelWidthChange,
  })
  const panelTileComfortWidthLabel = getPanelTileComfortWidthLabel()
  const panelTilePressureDetail = getPanelTilePressureDetail(currentSize.width)
  const panelWidthBadgeLabel = getPanelWidthBadgeLabel(currentSize.width)
  const panelTilingMetricBadge = getPanelTilingMetricBadge(currentSize.width)
  const persistentPanelRecoveryPressureLabel = getPanelTilePressureBadgeLabel(
    panelTilePressureWidth,
    { compact: true },
  )
  const showPersistentPanelHideRecovery =
    showPersistentPanelRecovery && panelTilePressureWidth >= PANEL_TILING_HINT_DEADBAND_PX
  const panelTilingHintResetInstruction =
    showPersistentPanelHideRecovery
      ? "Still tight? Reset panel, hide panel, or Enter / double-click"
      : showPersistentPanelRecovery
      ? "Still tight? Reset panel or Enter / double-click"
      : "Enter / double-click resets to default size"
  const persistentPanelRecoveryTitle = !panelTilePressureDetail
    ? `Panel is at the tiled-session comfort threshold (${panelTileComfortWidthLabel}). Reset to the default size for the current mode to recover room for tiled sessions.`
    : `Panel is currently ${panelTilePressureDetail}. Aim for about ${panelTileComfortWidthLabel} wide or narrower, or reset to the default size for the current mode to recover room for tiled sessions.`
  const persistentPanelHideTitle = !panelTilePressureDetail
    ? "Hide the floating panel to immediately give tiled sessions their room back. Sessions continue in the background and you can reopen the panel later."
    : `Hide the floating panel to immediately recover the ${panelTilePressureDetail} currently being taken from tiled sessions. Sessions continue in the background and you can reopen the panel later.`

  const handleHidePanel = useCallback(async () => {
    if (!enableResize || activePanelRecoveryAction || !showPersistentPanelHideRecovery) return

    setActivePanelRecoveryAction("hide")
    clearPendingTilingHint()
    setIsResizeGestureActive(false)
    resizeStartSizeRef.current = null
    setActiveResizePosition(null)

    try {
      await tipcClient.hidePanelWindow({})
    } catch (error) {
      console.error("Failed to hide panel while recovering tiled-session space:", error)
    } finally {
      setActivePanelRecoveryAction(null)
    }
  }, [activePanelRecoveryAction, clearPendingTilingHint, enableResize, showPersistentPanelHideRecovery])

  return (
    <div
      className={cn("relative", className)}
      style={{
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
      }}
    >
      {children}

      {showPanelTilingHint && (
        <div
          data-panel-resize-impact-hint
          className={cn(
            "pointer-events-none absolute left-1/2 top-3 z-[1100] flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-col items-center rounded-full border bg-background/95 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm transition-colors duration-150",
            panelTilingHint.tone === "crowded"
              ? "border-amber-500/45 text-amber-700 dark:text-amber-300"
              : panelTilingHint.tone === "relief"
                ? "border-emerald-500/45 text-emerald-700 dark:text-emerald-300"
                : "border-border/70 text-foreground",
          )}
        >
          <span className="text-xs font-medium leading-none">{panelTilingHint.label}</span>
          <span className="mt-1 text-[11px] leading-none text-muted-foreground">
            {panelTilingHint.detail}
          </span>
          <div
            aria-hidden="true"
            data-panel-resize-impact-metrics
            className="mt-1.5 flex max-w-full flex-wrap items-center justify-center gap-1.5"
          >
            <span className="inline-flex whitespace-nowrap rounded-full border border-border/60 bg-background/88 px-2 py-0.5 text-[10px] font-medium leading-none text-foreground/80">
              {panelWidthBadgeLabel}
            </span>
            <span
              className={cn(
                "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none",
                panelTilingMetricBadge.tone === "crowded"
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : panelTilingMetricBadge.tone === "relief"
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border/60 bg-background/88 text-foreground/80",
              )}
            >
              {panelTilingMetricBadge.label}
            </span>
          </div>
          <span className="mt-1 text-[10px] leading-none text-muted-foreground/80">
            {panelTilingHintResetInstruction}
          </span>
        </div>
      )}

      {showPersistentPanelRecovery && (
        <div
          data-panel-recovery-actions
          className={cn(
            "absolute right-2 z-[1100] flex items-center gap-1 transition-[top] duration-150",
            showPanelTilingHint ? "top-14" : "top-1",
          )}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {showPersistentPanelHideRecovery ? (
            <button
              type="button"
              data-panel-hide-recovery
              disabled={activePanelRecoveryAction !== null}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => {
                void handleHidePanel()
              }}
              className="inline-flex h-5 items-center whitespace-nowrap rounded-full border border-border/70 bg-background/92 px-2 text-[10px] font-medium text-foreground/75 shadow-sm backdrop-blur-sm transition-colors duration-150 hover:bg-background disabled:cursor-default disabled:opacity-70"
              title={persistentPanelHideTitle}
              aria-label={persistentPanelHideTitle}
            >
              {activePanelRecoveryAction === "hide" ? "Hiding..." : "Hide panel"}
            </button>
          ) : null}

          <button
            type="button"
            data-panel-size-recovery
            disabled={activePanelRecoveryAction !== null}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => {
              void handleResetPanelSize()
            }}
            className="inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full border border-amber-500/45 bg-background/95 px-2 text-[10px] font-medium text-amber-700 shadow-sm backdrop-blur-sm transition-colors duration-150 hover:bg-background disabled:cursor-default disabled:opacity-70 dark:text-amber-300"
            title={persistentPanelRecoveryTitle}
            aria-label={persistentPanelRecoveryTitle}
          >
            <span>{activePanelRecoveryAction === "reset" ? "Resetting..." : "Reset panel"}</span>
            {persistentPanelRecoveryPressureLabel ? (
              <span
                data-panel-size-recovery-badge
                className="rounded-full border border-current/15 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap"
              >
                {persistentPanelRecoveryPressureLabel}
              </span>
            ) : null}
          </button>
        </div>
      )}

      {enableResize && (
        <>
          {/* Corner resize handles */}
          <ResizeHandle
            position="bottom-right"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onResetSize={handleResetPanelSize}
          />
          <ResizeHandle
            position="bottom-left"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onResetSize={handleResetPanelSize}
          />
          <ResizeHandle
            position="top-right"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onResetSize={handleResetPanelSize}
          />
          <ResizeHandle
            position="top-left"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onResetSize={handleResetPanelSize}
          />

          {/* Edge resize handles */}
          <ResizeHandle
            position="right"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onResetSize={handleResetPanelSize}
          />
          <ResizeHandle
            position="left"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            onResetSize={handleResetPanelSize}
          />
          <ResizeHandle
            position="bottom"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          {!disableTopEdgeResize ? (
            <ResizeHandle
              position="top"
              onResizeStart={handleResizeStart}
              onResize={handleResize}
              onResizeEnd={handleResizeEnd}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
