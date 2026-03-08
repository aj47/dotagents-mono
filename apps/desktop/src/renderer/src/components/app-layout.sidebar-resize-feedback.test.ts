import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(
  new URL("./app-layout.tsx", import.meta.url),
  "utf8",
)
const useSidebarSource = readFileSync(
  new URL("../hooks/use-sidebar.ts", import.meta.url),
  "utf8",
)

const compactAppLayoutSource = appLayoutSource.replace(/\s+/g, "")
const compactUseSidebarSource = useSidebarSource.replace(/\s+/g, "")

function expectSourceToContain(source: string, fragment: string) {
  expect(source).toContain(fragment.replace(/\s+/g, ""))
}

describe("sidebar resize tiling feedback", () => {
  it("keeps the sidebar resize affordance visible and explains its tiled-session impact during drag", () => {
    expectSourceToContain(compactUseSidebarSource, "resizeDelta: number")
    expectSourceToContain(compactUseSidebarSource, "const [resizeDelta, setResizeDelta] = useState(0)")
    expectSourceToContain(compactUseSidebarSource, "setResizeDelta(lastWidth - startWidth)")
    expectSourceToContain(compactUseSidebarSource, "setResizeDelta(0)")

    expectSourceToContain(compactAppLayoutSource, "const { isCollapsed, width, isResizing, resizeDelta, toggleCollapse, handleResizeStart, adjustWidthBy: adjustSidebarWidthBy, reset: resetSidebar } = useSidebar()")
    expectSourceToContain(compactAppLayoutSource, "const SIDEBAR_TILING_HINT_DEADBAND_PX = 12")
    expectSourceToContain(compactAppLayoutSource, "const showSidebarResizeHint = isSessionsActive && isResizing")
    expectSourceToContain(compactAppLayoutSource, "Less room for tiled sessions")
    expectSourceToContain(compactAppLayoutSource, "More room for tiled sessions")
    expectSourceToContain(compactAppLayoutSource, "Sidebar width affects tiled session space")
    expectSourceToContain(compactAppLayoutSource, "data-sidebar-resize-impact-hint")
    expectSourceToContain(compactAppLayoutSource, 'data-sidebar-resize-handle')
    expectSourceToContain(compactAppLayoutSource, 'Double-click rail to reset to default width')
    expectSourceToContain(compactAppLayoutSource, 'title={sidebarResizeHandleTitle}')
    expectSourceToContain(compactAppLayoutSource, '{`Sidebar ${Math.round(sidebarWidth)}px wide`}')
    expectSourceToContain(compactAppLayoutSource, 'pointer-events-none absolute inset-y-3 right-1 w-px rounded-full bg-border/60 transition-all duration-200')
  })

  it("lets the sidebar resize rail reset back to the default width with a double-click", () => {
    expectSourceToContain(compactUseSidebarSource, "const reset = useCallback(() => {")
    expectSourceToContain(compactUseSidebarSource, "if (removeListenersRef.current) { removeListenersRef.current() }")
    expectSourceToContain(compactUseSidebarSource, "widthBeforeCollapseRef.current = initialWidth")
    expectSourceToContain(compactUseSidebarSource, "setIsResizing(false)")
    expectSourceToContain(compactUseSidebarSource, "setResizeDelta(0)")
    expectSourceToContain(compactUseSidebarSource, "localStorage.removeItem(STORAGE_KEY)")

    expectSourceToContain(compactAppLayoutSource, "reset: resetSidebar")
    expectSourceToContain(compactAppLayoutSource, "Double-click to reset to the default width")
    expectSourceToContain(compactAppLayoutSource, 'data-sidebar-resize-resettable')
    expectSourceToContain(compactAppLayoutSource, 'onDoubleClick={(event) => { event.preventDefault() event.stopPropagation() resetSidebar() }}')
    expectSourceToContain(compactAppLayoutSource, 'aria-label={sidebarResizeHandleTitle}')
  })

  it("lets the sidebar resize rail support keyboard nudging and reset without pointer dragging", () => {
    expectSourceToContain(compactUseSidebarSource, "export const SIDEBAR_KEYBOARD_RESIZE_STEP = 24")
    expectSourceToContain(compactUseSidebarSource, "export function getSidebarResizeKeyboardAdjustment(key: string): number")
    expectSourceToContain(compactUseSidebarSource, 'case "ArrowLeft":')
    expectSourceToContain(compactUseSidebarSource, 'case "ArrowRight":')
    expectSourceToContain(compactUseSidebarSource, "export function isSidebarResizeResetKey(key: string): boolean")
    expectSourceToContain(compactUseSidebarSource, 'return key === "Enter"')
    expectSourceToContain(compactUseSidebarSource, "adjustWidthBy: (delta: number) => void")
    expectSourceToContain(compactUseSidebarSource, "const adjustWidthBy = useCallback(")
    expectSourceToContain(compactUseSidebarSource, "const nextWidth = clampWidth(width + delta)")
    expectSourceToContain(compactUseSidebarSource, "savePersistedState({ isCollapsed: false, width: nextWidth })")

    expectSourceToContain(compactAppLayoutSource, "getSidebarResizeKeyboardAdjustment")
    expectSourceToContain(compactAppLayoutSource, "isSidebarResizeResetKey")
    expectSourceToContain(compactAppLayoutSource, "SIDEBAR_KEYBOARD_RESIZE_STEP")
    expectSourceToContain(compactAppLayoutSource, "adjustWidthBy: adjustSidebarWidthBy")
    expectSourceToContain(compactAppLayoutSource, "const sidebarResizeKeyboardHint =")
    expectSourceToContain(compactAppLayoutSource, 'Use Left and Right Arrow to resize by ${SIDEBAR_KEYBOARD_RESIZE_STEP}px. Press Enter or double-click to reset to the default width.')
    expectSourceToContain(compactAppLayoutSource, "const handleSidebarResizeKeyDown = useCallback(")
    expectSourceToContain(compactAppLayoutSource, "const keyboardAdjustment = getSidebarResizeKeyboardAdjustment(event.key)")
    expectSourceToContain(compactAppLayoutSource, "adjustSidebarWidthBy(keyboardAdjustment)")
    expectSourceToContain(compactAppLayoutSource, "if (isSidebarResizeResetKey(event.key)) {")
    expectSourceToContain(compactAppLayoutSource, "tabIndex={0}")
    expectSourceToContain(compactAppLayoutSource, 'aria-keyshortcuts="ArrowLeft ArrowRight Enter"')
    expectSourceToContain(compactAppLayoutSource, 'onKeyDown={handleSidebarResizeKeyDown}')
    expectSourceToContain(compactAppLayoutSource, 'focus-visible:outline-none')
    expectSourceToContain(compactAppLayoutSource, 'group-focus-visible/sidebar-resize:opacity-100')
  })

  it("shares live floating panel width and visibility with routed pages so sessions hints only blame visible panel pressure", () => {
    expectSourceToContain(compactAppLayoutSource, "functionisPanelSize(value:unknown):valueis{width:number;height:number}")
    expectSourceToContain(compactAppLayoutSource, "functionisPanelVisibilityState(value:unknown):valueis{visible:boolean}")
    expectSourceToContain(compactAppLayoutSource, "const[panelWidth,setPanelWidth]=useState<number|null>(null)")
    expectSourceToContain(compactAppLayoutSource, "const[panelVisible,setPanelVisible]=useState(false)")
    expectSourceToContain(compactAppLayoutSource, "tipcClient.getPanelVisibility()")
    expectSourceToContain(compactAppLayoutSource, "if(isMounted&&initialPanelVisibility.status===\"fulfilled\"&&typeofinitialPanelVisibility.value===\"boolean\"){setPanelVisible(initialPanelVisibility.value)}")
    expectSourceToContain(compactAppLayoutSource, "constunlistenPanelSize=rendererHandlers.onPanelSizeChanged.listen((size)=>{if(isPanelSize(size)){setPanelWidth(size.width)}})")
    expectSourceToContain(compactAppLayoutSource, "constunlistenPanelVisibility=rendererHandlers.onPanelVisibilityChanged.listen((payload)=>{if(isPanelVisibilityState(payload)){setPanelVisible(payload.visible)}})")
    expectSourceToContain(compactAppLayoutSource, "context={{onOpenPastSessionsDialog:()=>setPastSessionsDialogOpen(true),panelVisible,panelWidth,resetSidebar,sidebarWidth,}}")
  })
})