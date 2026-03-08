import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionGridSource = readFileSync(
  new URL("./session-grid.tsx", import.meta.url),
  "utf8",
)

describe("session grid resize affordance", () => {
  it("keeps resize hit targets visible enough to discover before the user starts dragging", () => {
    expect(sessionGridSource).toContain(
      'title={getTileResizeHandleTitle("width", true, true)}',
    )
    expect(sessionGridSource).toContain(
      'title={getTileResizeHandleTitle("height", true, true)}',
    )
    expect(sessionGridSource).toContain(
      'title={getTileResizeHandleTitle("corner", true, true)}',
    )
    expect(sessionGridSource).toContain(
      'pointer-events-none mr-px h-[calc(100%-1rem)] w-px rounded-full bg-border/55 transition-all duration-200',
    )
    expect(sessionGridSource).toContain(
      'pointer-events-none mb-px h-px w-[calc(100%-1rem)] rounded-full bg-border/55 transition-all duration-200',
    )
    expect(sessionGridSource).toContain(
      'group/resize-corner absolute bottom-0 right-0 z-20 flex min-h-6 min-w-6 cursor-nwse-resize items-center justify-end rounded-tl-md border-l border-t border-border/55 bg-background/70 px-1 py-0.5 shadow-sm backdrop-blur-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1',
    )
  })

  it("reveals short resize labels on hover or keyboard focus so edge and corner handles read like actions before dragging", () => {
    expect(sessionGridSource).toContain(
      'function getTileResizeHandleVisibleLabel(',
    )
    expect(sessionGridSource).toContain(
      'function getTileResizeHandleVisibleLabelClasses(',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact ? "Width" : "Resize width"',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact ? "Height" : "Resize height"',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact ? "Resize" : "Resize tile"',
    )
    expect(sessionGridSource).toContain(
      'const widthResizeHandleVisibleLabel = getTileResizeHandleVisibleLabel("width", {',
    )
    expect(sessionGridSource).toContain(
      'const heightResizeHandleVisibleLabel = getTileResizeHandleVisibleLabel("height", {',
    )
    expect(sessionGridSource).toContain(
      'const cornerResizeHandleVisibleLabel = getTileResizeHandleVisibleLabel("corner", {',
    )
    expect(sessionGridSource).toContain(
      'h-4 w-4 shrink-0 transition-colors duration-200',
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-resize-visible-label="width"',
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-resize-visible-label="height"',
    )
    expect(sessionGridSource).toContain(
      'overflow-hidden whitespace-nowrap text-[10px] font-medium leading-none transition-all duration-200',
    )
    expect(sessionGridSource).toContain(
      'group-hover/resize-width:scale-100 group-hover/resize-width:opacity-100 group-hover/resize-width:border-blue-500/55 group-hover/resize-width:bg-background/97 group-hover/resize-width:text-foreground group-focus-visible/resize-width:scale-100 group-focus-visible/resize-width:opacity-100 group-focus-visible/resize-width:border-blue-500/65 group-focus-visible/resize-width:bg-background/97 group-focus-visible/resize-width:text-foreground',
    )
    expect(sessionGridSource).toContain(
      'group-hover/resize-height:scale-100 group-hover/resize-height:opacity-100 group-hover/resize-height:border-blue-500/55 group-hover/resize-height:bg-background/97 group-hover/resize-height:text-foreground group-focus-visible/resize-height:scale-100 group-focus-visible/resize-height:opacity-100 group-focus-visible/resize-height:border-blue-500/65 group-focus-visible/resize-height:bg-background/97 group-focus-visible/resize-height:text-foreground',
    )
    expect(sessionGridSource).toContain(
      'group-hover/session-tile:ml-1 group-hover/session-tile:max-w-24 group-hover/session-tile:opacity-100 group-focus-visible/resize-corner:ml-1 group-focus-visible/resize-corner:max-w-24 group-focus-visible/resize-corner:opacity-100',
    )
    expect(sessionGridSource).toContain(
      'isResizing\n                  ? "ml-1 max-w-24 opacity-100 text-blue-600 dark:text-blue-300"',
    )
    expect(sessionGridSource).toContain('{widthResizeHandleVisibleLabel}')
    expect(sessionGridSource).toContain('{heightResizeHandleVisibleLabel}')
    expect(sessionGridSource).toContain('{cornerResizeHandleVisibleLabel}')
  })

  it("shows a drag-time tile size pill so active resizing feels measurable instead of guessy", () => {
    expect(sessionGridSource).toContain(
      'export function getTileResizeFeedbackLabel(',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact\n        ? `Width ${widthLabel}`\n        : `Width ${widthLabel} · Double-click reset`',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact\n        ? `Height ${heightLabel}`\n        : `Height ${heightLabel} · Double-click reset`',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact\n        ? `${widthLabel} × ${heightLabel}`\n        : `${widthLabel} × ${heightLabel} · Double-click reset`',
    )
    expect(sessionGridSource).toContain(
      'const [activeResizeHandle, setActiveResizeHandle] = useState<TileResizeHandleType | null>(null)',
    )
    expect(sessionGridSource).toContain(
      'const [pointerResizeFeedback, setPointerResizeFeedback] =',
    )
    expect(sessionGridSource).toContain(
      'const showPointerResizeFeedback = useCallback(',
    )
    expect(sessionGridSource).toContain('reset: options?.reset')
    expect(sessionGridSource).toContain(
      'export function didTileResizeHandleChangeSize(',
    )
    expect(sessionGridSource).toContain('onResizeEnd: (finalSize) => {')
    expect(sessionGridSource).toContain('didTileResizeHandleChangeSize(')
    expect(sessionGridSource).toContain(
      'showPointerResizeFeedback(finishedHandleType, finalSize)',
    )
    expect(sessionGridSource).toContain('const activeResizeFeedbackLabel =')
    expect(sessionGridSource).toContain('compact: renderedWidth < 380')
    expect(sessionGridSource).toContain(
      ': keyboardResizeFeedback?.handleType ?? pointerResizeFeedback?.handleType ?? null',
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-resize-feedback={activeResizeFeedbackHandle}',
    )
    expect(sessionGridSource).toContain('title={activeResizeFeedbackLabel}')
    expect(sessionGridSource).toContain('{activeResizeFeedbackLabel}')
    expect(sessionGridSource).toContain('startPointerResize("width")')
    expect(sessionGridSource).toContain('startPointerResize("height")')
    expect(sessionGridSource).toContain('startPointerResize("corner")')
  })

  it("briefly reuses the same tile size pill for keyboard nudges and resets so focused resize handles do not feel silent", () => {
    expect(sessionGridSource).toContain(
      'const TILE_KEYBOARD_RESIZE_FEEDBACK_TIMEOUT_MS = 1400',
    )
    expect(sessionGridSource).toContain(
      'export function getTileResizeKeyboardFeedbackLabel(',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact\n          ? `Width ${widthLabel}`\n          : `Width ${widthLabel} · Enter reset`',
    )
    expect(sessionGridSource).toContain(
      'return options?.compact\n          ? `Height ${heightLabel}`\n          : `Height reset · ${heightLabel}`',
    )
    expect(sessionGridSource).toContain(
      'const [keyboardResizeFeedback, setKeyboardResizeFeedback] = useState<',
    )
    expect(sessionGridSource).toContain(
      'const keyboardResizeFeedbackTimeoutRef = useRef<number | null>(null)',
    )
    expect(sessionGridSource).toContain(
      'const clearKeyboardResizeFeedback = useCallback(() => {',
    )
    expect(sessionGridSource).toContain(
      'setKeyboardResizeFeedback({',
    )
    expect(sessionGridSource).toContain(
      'label: getTileResizeKeyboardFeedbackLabel(handleType, nextSize, {',
    )
    expect(sessionGridSource).toContain(
      'keyboardResizeFeedbackTimeoutRef.current = window.setTimeout(() => {',
    )
    expect(sessionGridSource).toContain(
      'current?.handleType === handleType ? null : current',
    )
    expect(sessionGridSource).toContain(
      'const activeResizeFeedbackHandle = isResizing',
    )
    expect(sessionGridSource).toContain(
      ': keyboardResizeFeedback?.handleType ?? pointerResizeFeedback?.handleType ?? null',
    )
    expect(sessionGridSource).toContain(
      ': keyboardResizeFeedback?.label ?? pointerResizeFeedback?.label ?? null',
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-resize-feedback={activeResizeFeedbackHandle}',
    )
    expect(sessionGridSource).toContain('clearKeyboardResizeFeedback()')
  })

  it("keeps resize recovery local to the handle by advertising and wiring a double-click reset action", () => {
    expect(sessionGridSource).toContain(
      'return `${title} · Double-click to reset tile size`',
    )
    expect(sessionGridSource).toContain('data-session-tile-resize-handle="width"')
    expect(sessionGridSource).toContain('data-session-tile-resize-handle="height"')
    expect(sessionGridSource).toContain('data-session-tile-resize-handle="corner"')
    expect(sessionGridSource).toContain(
      'const handlePointerResizeReset = useCallback(',
    )
    expect(sessionGridSource).toContain(
      'showPointerResizeFeedback(handleType, nextSize, { reset: true })',
    )
    expect(sessionGridSource).toContain(
      'getTileResizeResetSize(\n        handleType,\n        layoutWidth,\n        effectiveTileLayoutHeight,\n      )',
    )
    expect(sessionGridSource).toContain(
      'onDoubleClick={(e) => handlePointerResizeReset("width", e)}',
    )
    expect(sessionGridSource).toContain(
      'onDoubleClick={(e) => handlePointerResizeReset("height", e)}',
    )
    expect(sessionGridSource).toContain(
      'onDoubleClick={(e) => handlePointerResizeReset("corner", e)}',
    )
  })

  it("lets the visible edge and corner resize grips participate in keyboard resizing without adding more header chrome", () => {
    expect(sessionGridSource).toContain(
      'return `${title} · Focus and press left or right arrow keys to resize · Press Enter or double-click to reset tile size`',
    )
    expect(sessionGridSource).toContain(
      'return `${title} · Focus and press up or down arrow keys to resize · Press Enter or double-click to reset tile size`',
    )
    expect(sessionGridSource).toContain(
      'return `${title} · Focus and press arrow keys to resize · Press Enter or double-click to reset tile size`',
    )
    expect(sessionGridSource).toContain(
      'return `${label}. Focus and press Left or Right Arrow to nudge width. Press Enter to reset tile size.`',
    )
    expect(sessionGridSource).toContain(
      'return `${label}. Focus and press Up or Down Arrow to nudge height. Press Enter to reset tile size.`',
    )
    expect(sessionGridSource).toContain(
      'return `${label}. Focus and press arrow keys to nudge width or height. Press Enter to reset tile size.`',
    )
    expect(sessionGridSource).toContain(
      'const TILE_KEYBOARD_RESIZE_STEP = 24',
    )
    expect(sessionGridSource).toContain(
      'export function isTileResizeKeyboardResetKey(key: string): boolean',
    )
    expect(sessionGridSource).toContain(
      'const handleTileResizeKeyDown = useCallback(',
    )
    expect(sessionGridSource).toContain(
      'const wantsReset = isTileResizeKeyboardResetKey(e.key)',
    )
    expect(sessionGridSource).toContain(
      'const adjustment = getTileResizeKeyboardAdjustment(handleType, e.key)',
    )
    expect(sessionGridSource).toContain(
      'if (!adjustment && !wantsReset) {',
    )
    expect(sessionGridSource).toContain(
      'if (wantsReset) {',
    )
    expect(sessionGridSource).toContain(
      'getTileResizeResetSize(\n          handleType,\n          layoutWidth,\n          effectiveTileLayoutHeight,\n        )',
    )
    expect(sessionGridSource).toContain(
      'aria-label={getTileResizeHandleAriaLabel("width", true)}',
    )
    expect(sessionGridSource).toContain(
      'aria-label={getTileResizeHandleAriaLabel("height", true)}',
    )
    expect(sessionGridSource).toContain(
      'aria-keyshortcuts="ArrowLeft ArrowRight Enter"',
    )
    expect(sessionGridSource).toContain(
      'aria-keyshortcuts="ArrowUp ArrowDown Enter"',
    )
    expect(sessionGridSource).toContain(
      'aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter"',
    )
    expect(sessionGridSource).toContain(
      'tabIndex={isResizing ? -1 : 0}',
    )
    expect(sessionGridSource).toContain(
      'onKeyDown={(e) => handleTileResizeKeyDown("width", e)}',
    )
    expect(sessionGridSource).toContain(
      'onKeyDown={(e) => handleTileResizeKeyDown("height", e)}',
    )
    expect(sessionGridSource).toContain(
      'onKeyDown={(e) => handleTileResizeKeyDown("corner", e)}',
    )
  })
})