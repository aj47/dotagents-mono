import { useState, useCallback, useRef, useEffect } from "react"
import {
  SIDEBAR_DIMENSIONS,
  clearPersistedSidebarState,
  clampSidebarWidth,
  loadPersistedSidebarState,
  savePersistedSidebarState,
  type SidebarState,
} from "@dotagents/shared/sidebar-persistence"

export { SIDEBAR_DIMENSIONS }

export interface UseSidebarOptions {
  initialWidth?: number
  initialCollapsed?: boolean
  onToggle?: (isCollapsed: boolean) => void
  onResizeEnd?: (width: number) => void
}

export interface UseSidebarReturn {
  isCollapsed: boolean
  width: number
  isResizing: boolean
  toggleCollapse: () => void
  setCollapsed: (collapsed: boolean) => void
  handleResizeStart: (e: React.MouseEvent) => void
  reset: () => void
}

export function useSidebar(options: UseSidebarOptions = {}): UseSidebarReturn {
  const {
    initialWidth = SIDEBAR_DIMENSIONS.width.default,
    initialCollapsed = false,
    onToggle,
    onResizeEnd,
  } = options

  // Use lazy state initialization to read localStorage only once on mount
  // We use a single initializer to avoid calling loadPersistedSidebarState multiple times
  const [{ isCollapsed: initialIsCollapsed, width: initialWidthValue }] = useState(
    (): SidebarState => {
      const persisted = loadPersistedSidebarState()
      if (persisted) {
        return {
          isCollapsed: persisted.isCollapsed,
          width: clampSidebarWidth(persisted.width),
        }
      }
      return { isCollapsed: initialCollapsed, width: initialWidth }
    }
  )

  const [isCollapsed, setIsCollapsed] = useState(initialIsCollapsed)
  const [width, setWidth] = useState(initialWidthValue)

  const [isResizing, setIsResizing] = useState(false)

  const widthBeforeCollapseRef = useRef(width)
  // Store ref for removing listeners only (for unmount cleanup without triggering state/callbacks)
  const removeListenersRef = useRef<(() => void) | null>(null)

  const clampWidth = useCallback((w: number) => clampSidebarWidth(w), [])

  const toggleCollapse = useCallback(() => {
    // Compute new state before calling setState to avoid side effects inside updater
    // (React 18 StrictMode may call updater functions multiple times)
    const newCollapsed = !isCollapsed
    if (newCollapsed) {
      // Store the current width before collapsing
      widthBeforeCollapseRef.current = width
    }
    setIsCollapsed(newCollapsed)
    const newState: SidebarState = {
      isCollapsed: newCollapsed,
      width: newCollapsed ? widthBeforeCollapseRef.current : width,
    }
    savePersistedSidebarState(newState)
    onToggle?.(newCollapsed)
  }, [isCollapsed, width, onToggle])

  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      if (collapsed && !isCollapsed) {
        widthBeforeCollapseRef.current = width
      }
      setIsCollapsed(collapsed)
      // When expanding, persist current width; when collapsing, persist the stored width
      savePersistedSidebarState({
        isCollapsed: collapsed,
        width: collapsed ? widthBeforeCollapseRef.current : width,
      })
      onToggle?.(collapsed)
    },
    [width, isCollapsed, onToggle]
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return // Don't allow resize when collapsed

      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)

      const startX = e.clientX
      const startWidth = width
      let lastWidth = startWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        lastWidth = clampWidth(startWidth + delta)
        setWidth(lastWidth)
      }

      // Separate function to only remove listeners (for unmount cleanup)
      // This avoids triggering state updates, persistence, or callbacks during unmount
      const removeListeners = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        window.removeEventListener("blur", handleBlur)
        removeListenersRef.current = null
      }

      // Full cleanup for normal resize end (mouseup/blur)
      const fullCleanup = () => {
        removeListeners()
        setIsResizing(false)
        savePersistedSidebarState({ isCollapsed: false, width: lastWidth })
        onResizeEnd?.(lastWidth)
      }

      const handleMouseUp = () => {
        fullCleanup()
      }

      const handleBlur = () => {
        fullCleanup()
      }

      // Store removeListeners ref for unmount cleanup
      removeListenersRef.current = removeListeners

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("blur", handleBlur)
    },
    [width, isCollapsed, clampWidth, onResizeEnd]
  )

  const reset = useCallback(() => {
    setIsCollapsed(initialCollapsed)
    setWidth(initialWidth)
    clearPersistedSidebarState()
  }, [initialWidth, initialCollapsed])

  // Cleanup resize listeners on unmount - only remove listeners, don't trigger state/callbacks
  useEffect(() => {
    return () => {
      if (removeListenersRef.current) {
        removeListenersRef.current()
      }
    }
  }, [])

  return {
    isCollapsed,
    width,
    isResizing,
    toggleCollapse,
    setCollapsed,
    handleResizeStart,
    reset,
  }
}
