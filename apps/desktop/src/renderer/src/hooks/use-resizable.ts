import { useState, useCallback, useRef, useEffect } from "react"

export const TILE_DIMENSIONS = {
  width: {
    default: 320,
    min: 200,
    max: 1200,
  },
  height: {
    default: 300,
    min: 150,
    max: 4000, // Allow tiles to fill large displays - effectively no practical limit
  },
} as const

export const STORAGE_KEY_PREFIX = "dotagents-resizable-"

/**
 * Clears persisted sizes from localStorage for a specific storage key.
 * @param storageKey - The specific storage key to clear (without the prefix).
 *                     For example, "session-tile" clears "dotagents-resizable-session-tile".
 * Returns true if the entry was cleared, false otherwise.
 */
export function clearPersistedSize(storageKey: string): boolean {
  try {
    const fullKey = STORAGE_KEY_PREFIX + storageKey
    if (localStorage.getItem(fullKey) !== null) {
      localStorage.removeItem(fullKey)
      return true
    }
    return false
  } catch {
    return false
  }
}

export interface UseResizableOptions {
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  onResizeStart?: () => void
  onResizeEnd?: (size: { width: number; height: number }) => void
  storageKey?: string
}

export interface UseResizableReturn {
  width: number
  height: number
  isResizing: boolean
  handleWidthResizeStart: (e: React.MouseEvent) => void
  handleHeightResizeStart: (e: React.MouseEvent) => void
  handleCornerResizeStart: (e: React.MouseEvent) => void
  reset: () => void
  setSize: (size: { width?: number; height?: number }) => void
}

function loadPersistedSize(storageKey: string): { width?: number; height?: number } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (typeof parsed.width === "number" && typeof parsed.height === "number") {
        return parsed
      }
    }
  } catch {
    return null
  }
  return null
}

function savePersistedSize(storageKey: string, size: { width: number; height: number }): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, JSON.stringify(size))
  } catch {}
}

export function useResizable(options: UseResizableOptions = {}): UseResizableReturn {
  const {
    initialWidth = TILE_DIMENSIONS.width.default,
    initialHeight = TILE_DIMENSIONS.height.default,
    minWidth = TILE_DIMENSIONS.width.min,
    maxWidth = TILE_DIMENSIONS.width.max,
    minHeight = TILE_DIMENSIONS.height.min,
    maxHeight = TILE_DIMENSIONS.height.max,
    onResizeStart,
    onResizeEnd,
    storageKey,
  } = options

  const getInitialDimensions = useCallback(() => {
    if (storageKey) {
      const persisted = loadPersistedSize(storageKey)
      if (persisted) {
        return {
          width: Math.min(maxWidth, Math.max(minWidth, persisted.width ?? initialWidth)),
          height: Math.min(maxHeight, Math.max(minHeight, persisted.height ?? initialHeight)),
        }
      }
    }
    return { width: initialWidth, height: initialHeight }
  }, [storageKey, initialWidth, initialHeight, minWidth, maxWidth, minHeight, maxHeight])

  const initial = getInitialDimensions()
  const [width, setWidth] = useState(initial.width)
  const [height, setHeight] = useState(initial.height)
  const [isResizing, setIsResizing] = useState(false)

  const resizeTypeRef = useRef<"width" | "height" | "corner" | null>(null)
  const widthRef = useRef(initial.width)
  const heightRef = useRef(initial.height)
  const activeElementRef = useRef<HTMLElement | null>(null)
  const removeListenersRef = useRef<(() => void) | null>(null)

  const clampWidth = useCallback((w: number) => Math.min(maxWidth, Math.max(minWidth, w)), [minWidth, maxWidth])
  const clampHeight = useCallback((h: number) => Math.min(maxHeight, Math.max(minHeight, h)), [minHeight, maxHeight])

  const storageKeyRef = useRef(storageKey)

  useEffect(() => {
    widthRef.current = width
  }, [width])

  useEffect(() => {
    heightRef.current = height
  }, [height])

  useEffect(() => {
    if (storageKey && storageKey !== storageKeyRef.current) {
      storageKeyRef.current = storageKey
      const persisted = loadPersistedSize(storageKey)
      if (persisted) {
        const nextWidth = clampWidth(persisted.width ?? initialWidth)
        const nextHeight = clampHeight(persisted.height ?? initialHeight)
        widthRef.current = nextWidth
        heightRef.current = nextHeight
        setWidth(nextWidth)
        setHeight(nextHeight)
      }
    }
  }, [storageKey, initialWidth, initialHeight, clampWidth, clampHeight])

  const applyPreviewSize = useCallback((size: { width?: number; height?: number }) => {
    const activeElement = activeElementRef.current
    if (!activeElement) return

    if (size.width !== undefined) {
      widthRef.current = size.width
      activeElement.style.width = `${size.width}px`
    }
    if (size.height !== undefined) {
      heightRef.current = size.height
      activeElement.style.height = `${size.height}px`
    }
  }, [])

  const cleanupPreviousResizeListeners = useCallback(() => {
    if (removeListenersRef.current) {
      removeListenersRef.current()
    }
  }, [])

  const handleWidthResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cleanupPreviousResizeListeners()
    setIsResizing(true)
    resizeTypeRef.current = "width"
    onResizeStart?.()

    activeElementRef.current = (e.currentTarget as HTMLElement).parentElement
    const startX = e.clientX
    const startWidth = widthRef.current
    let lastWidth = startWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      lastWidth = clampWidth(startWidth + delta)
      applyPreviewSize({ width: lastWidth })
    }

    const removeListeners = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("blur", handleBlur)
      removeListenersRef.current = null
    }

    const completeResize = () => {
      removeListeners()
      setIsResizing(false)
      resizeTypeRef.current = null
      activeElementRef.current = null

      widthRef.current = lastWidth
      setWidth(lastWidth)

      const finalSize = { width: lastWidth, height: heightRef.current }
      if (storageKey) {
        savePersistedSize(storageKey, finalSize)
      }
      onResizeEnd?.(finalSize)
    }

    const handleMouseUp = () => {
      completeResize()
    }

    const handleBlur = () => {
      completeResize()
    }

    removeListenersRef.current = removeListeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("blur", handleBlur)
  }, [clampWidth, onResizeStart, onResizeEnd, storageKey, applyPreviewSize, cleanupPreviousResizeListeners])

  const handleHeightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cleanupPreviousResizeListeners()
    setIsResizing(true)
    resizeTypeRef.current = "height"
    onResizeStart?.()

    activeElementRef.current = (e.currentTarget as HTMLElement).parentElement
    const startY = e.clientY
    const startHeight = heightRef.current
    let lastHeight = startHeight

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY
      lastHeight = clampHeight(startHeight + delta)
      applyPreviewSize({ height: lastHeight })
    }

    const removeListeners = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("blur", handleBlur)
      removeListenersRef.current = null
    }

    const completeResize = () => {
      removeListeners()
      setIsResizing(false)
      resizeTypeRef.current = null
      activeElementRef.current = null

      heightRef.current = lastHeight
      setHeight(lastHeight)

      const finalSize = { width: widthRef.current, height: lastHeight }
      if (storageKey) {
        savePersistedSize(storageKey, finalSize)
      }
      onResizeEnd?.(finalSize)
    }

    const handleMouseUp = () => {
      completeResize()
    }

    const handleBlur = () => {
      completeResize()
    }

    removeListenersRef.current = removeListeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("blur", handleBlur)
  }, [clampHeight, onResizeStart, onResizeEnd, storageKey, applyPreviewSize, cleanupPreviousResizeListeners])

  const handleCornerResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cleanupPreviousResizeListeners()
    setIsResizing(true)
    resizeTypeRef.current = "corner"
    onResizeStart?.()

    activeElementRef.current = (e.currentTarget as HTMLElement).parentElement
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = widthRef.current
    const startHeight = heightRef.current
    let lastWidth = startWidth
    let lastHeight = startHeight

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      lastWidth = clampWidth(startWidth + deltaX)
      lastHeight = clampHeight(startHeight + deltaY)
      applyPreviewSize({ width: lastWidth, height: lastHeight })
    }

    const removeListeners = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("blur", handleBlur)
      removeListenersRef.current = null
    }

    const completeResize = () => {
      removeListeners()
      setIsResizing(false)
      resizeTypeRef.current = null
      activeElementRef.current = null

      widthRef.current = lastWidth
      heightRef.current = lastHeight
      setWidth(lastWidth)
      setHeight(lastHeight)

      const finalSize = { width: lastWidth, height: lastHeight }
      if (storageKey) {
        savePersistedSize(storageKey, finalSize)
      }
      onResizeEnd?.(finalSize)
    }

    const handleMouseUp = () => {
      completeResize()
    }

    const handleBlur = () => {
      completeResize()
    }

    removeListenersRef.current = removeListeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("blur", handleBlur)
  }, [clampWidth, clampHeight, onResizeStart, onResizeEnd, storageKey, applyPreviewSize, cleanupPreviousResizeListeners])

  const reset = useCallback(() => {
    widthRef.current = initialWidth
    heightRef.current = initialHeight
    setWidth(initialWidth)
    setHeight(initialHeight)
    if (storageKey) {
      try {
        localStorage.removeItem(STORAGE_KEY_PREFIX + storageKey)
      } catch {}
    }
  }, [initialWidth, initialHeight, storageKey])

  const setSize = useCallback((size: { width?: number; height?: number }) => {
    const newWidth = size.width !== undefined ? clampWidth(size.width) : widthRef.current
    const newHeight = size.height !== undefined ? clampHeight(size.height) : heightRef.current

    if (size.width !== undefined) {
      widthRef.current = newWidth
      setWidth(newWidth)
    }

    if (size.height !== undefined) {
      heightRef.current = newHeight
      setHeight(newHeight)
    }

    if (storageKey) {
      savePersistedSize(storageKey, { width: newWidth, height: newHeight })
    }
  }, [clampWidth, clampHeight, storageKey])

  useEffect(() => {
    return () => {
      if (removeListenersRef.current) {
        removeListenersRef.current()
      }
      activeElementRef.current = null
    }
  }, [])

  // Use ref-backed preview size immediately once a resize starts, even before
  // React commits `isResizing`, so parent re-renders can't clobber drag preview.
  const hasActiveResize = isResizing || resizeTypeRef.current !== null
  const renderedWidth = hasActiveResize ? widthRef.current : width
  const renderedHeight = hasActiveResize ? heightRef.current : height

  return {
    width: renderedWidth,
    height: renderedHeight,
    isResizing,
    handleWidthResizeStart,
    handleHeightResizeStart,
    handleCornerResizeStart,
    reset,
    setSize,
  }
}
