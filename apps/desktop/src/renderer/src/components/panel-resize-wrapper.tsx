import React, { useState, useEffect, useCallback, useRef } from "react"
import { ResizeHandle } from "@renderer/components/resize-handle"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"

// Minimum height for waveform panel - matches WAVEFORM_MIN_HEIGHT in main/window.ts
const WAVEFORM_MIN_HEIGHT = 120
type PanelMode = "normal" | "agent" | "textInput"
const isPanelMode = (value: unknown): value is PanelMode =>
  value === "normal" || value === "agent" || value === "textInput"
const isPanelSize = (value: unknown): value is { width: number; height: number } =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number" &&
  Number.isFinite((value as { width: number }).width) &&
  Number.isFinite((value as { height: number }).height)

export const getNativePanelResizeSize = (
  startSize: { width: number; height: number },
  delta: { width: number; height: number },
  minimumSize: { width: number; height: number },
  viewportScale = 1,
) => ({
  width: Math.max(minimumSize.width, startSize.width + delta.width * viewportScale),
  height: Math.max(minimumSize.height, startSize.height + delta.height * viewportScale),
})

interface PanelResizeWrapperProps {
  children: React.ReactNode
  className?: string
  enableResize?: boolean
  minWidth?: number
  minHeight?: number
  viewportScale?: number
  fallbackMode?: PanelMode
}

export function PanelResizeWrapper({
  children,
  className,
  enableResize = true,
  minWidth = 200,
  minHeight = WAVEFORM_MIN_HEIGHT,
  viewportScale = 1,
  fallbackMode = "normal",
}: PanelResizeWrapperProps) {
  const [currentSize, setCurrentSize] = useState({ width: 300, height: 200 })
  const resizeStartSizeRef = useRef<{ width: number; height: number } | null>(null)
  const lastResizeCallRef = useRef<number>(0)
  const inFlightResizeUpdatesRef = useRef(new Set<Promise<unknown>>())
  const RESIZE_THROTTLE_MS = 16 // ~60fps
  const safeViewportScale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1

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

  const handleResizeStart = useCallback(() => {
    // Capture current size at the start of resize operation
    resizeStartSizeRef.current = currentSize
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

    // ResizeHandle deltas come from browser coordinates. Convert them back to
    // native panel pixels so drag distance stays consistent under zoom.
    const { width: newWidth, height: newHeight } = getNativePanelResizeSize(
      startSize,
      delta,
      {
        width: minWidth,
        height: minHeight,
      },
      safeViewportScale,
    )

    // Update local size immediately; send IPC without awaiting to avoid resize lag.
    setCurrentSize({ width: newWidth, height: newHeight })
    const updatePromise = tipcClient.updatePanelSize({ width: newWidth, height: newHeight }).catch((error: unknown) => {
      console.error("Failed to update panel size:", error)
    })
    inFlightResizeUpdatesRef.current.add(updatePromise)
    void updatePromise.finally(() => {
      inFlightResizeUpdatesRef.current.delete(updatePromise)
    })
  }, [enableResize, minWidth, minHeight, safeViewportScale])

  const handleResizeEnd = useCallback(async (size: { width: number; height: number }) => {
    if (!enableResize) return

    const startSize = resizeStartSizeRef.current
    const requestedFinalSize = startSize
      ? getNativePanelResizeSize(
          startSize,
          {
            width: size.width - startSize.width,
            height: size.height - startSize.height,
          },
          {
            width: minWidth,
            height: minHeight,
          },
          safeViewportScale,
        )
      : {
          width: Math.max(minWidth, size.width),
          height: Math.max(minHeight, size.height),
        }

    const rawMode = await tipcClient.getPanelMode().catch(() => null)
    const mode: PanelMode = isPanelMode(rawMode) ? rawMode : fallbackMode
    let finalSize = requestedFinalSize

    // Force one final size sync in case the last throttled mousemove was skipped.
    try {
      // Ensure all throttled fire-and-forget updates are finished before final sync.
      const pendingUpdates = Array.from(inFlightResizeUpdatesRef.current)
      if (pendingUpdates.length > 0) {
        await Promise.allSettled(pendingUpdates)
      }

      const updatedSize = await tipcClient.updatePanelSize(requestedFinalSize)
      finalSize = isPanelSize(updatedSize) ? updatedSize : requestedFinalSize
      setCurrentSize(finalSize)

      // Save the final size by mode so waveform and progress views don't override each other.
      await tipcClient.savePanelModeSize({
        mode,
        width: finalSize.width,
        height: finalSize.height,
      })
    } catch (error) {
      try {
        // Fallback only for legacy waveform persistence. Non-waveform modes have
        // dedicated buckets and must not clobber the shared legacy size.
        if (mode === "normal") {
          const savedSize = await tipcClient.savePanelCustomSize(finalSize)
          if (isPanelSize(savedSize)) {
            finalSize = savedSize
          }
          setCurrentSize(finalSize)
        } else {
          throw error
        }
      } catch (fallbackError) {
        console.error("Failed to save panel size:", error, fallbackError)
      }
    }
  }, [enableResize, fallbackMode, minWidth, minHeight, safeViewportScale])

  return (
    <div
      className={className}
      style={{
        // Native window constraints are already enforced in main-process pixels.
        // Divide CSS constraints by the current viewport scale so recording UI
        // does not visually grow when browser zoom makes CSS pixels larger.
        minWidth: `${minWidth / safeViewportScale}px`,
        minHeight: `${minHeight / safeViewportScale}px`,
      }}
    >
      {children}

      {enableResize && (
        <>
          {/* Corner resize handles */}
          <ResizeHandle
            position="bottom-right"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="bottom-left"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="top-right"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="top-left"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />

          {/* Edge resize handles */}
          <ResizeHandle
            position="right"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="left"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="bottom"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="top"
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
        </>
      )}
    </div>
  )
}
