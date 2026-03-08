import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const resizeHandleSource = readFileSync(
  new URL("./resize-handle.tsx", import.meta.url),
  "utf8",
)
const compactResizeHandleSource = resizeHandleSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactResizeHandleSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("floating panel resize affordance", () => {
  it("keeps panel resize hotspots visible enough to discover before the user starts dragging", () => {
    expectSourceToContain('title={getResizeHandleTitle(position, !!onResetSize, isKeyboardAccessible)}')
    expectSourceToContain('function getResizeHandleLabel(position: ResizeHandlePosition): string')
    expectSourceToContain('function isWidthAffectingResizeHandle(position: ResizeHandlePosition): boolean')
    expectSourceToContain('function getVisibleResizeHandleLabel(position: ResizeHandlePosition): string | null')
    expectSourceToContain('function getVisibleResizeHandleLabelClasses(position: ResizeHandlePosition): string')
    expectSourceToContain("return 'Resize panel width'")
    expectSourceToContain("return 'Resize panel height'")
    expectSourceToContain("return 'Resize panel width and height'")
    expectSourceToContain("? 'Resize' : 'Resize panel'")
    expectSourceToContain('return `${title} · Double-click to reset to default size`')
    expectSourceToContain('data-panel-resize-resettable={onResetSize ? "true" : undefined}')
    expectSourceToContain('data-panel-resize-handle={position}')
    expectSourceToContain('data-panel-resize-visible-label={position}')
    expectSourceToContain('group/panel-resize rounded-sm transition-colors duration-200')
    expectSourceToContain(
      'pointer-events-none absolute rounded-full bg-border/55 transition-all duration-200',
    )
    expectSourceToContain(
      'pointer-events-none absolute inset-0.5 flex items-center justify-center rounded-sm border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-200',
    )
    expectSourceToContain(
      'pointer-events-none absolute z-10 inline-flex whitespace-nowrap rounded-full border border-border/60 bg-background/92 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200',
    )
    expectSourceToContain('group-hover/panel-resize:scale-100')
    expectSourceToContain('group-focus-visible/panel-resize:scale-100')
  })

  it("lets width-affecting panel handles be nudged and reset by keyboard without adding more persistent chrome", () => {
    expectSourceToContain('export const PANEL_KEYBOARD_RESIZE_STEP = 24')
    expectSourceToContain('export function getPanelResizeKeyboardAdjustment(')
    expectSourceToContain('export function isPanelResizeKeyboardResetKey(key: string): boolean')
    expectSourceToContain('const isKeyboardAccessible = !disabled && !!onResetSize')
    expectSourceToContain(
      'return `${title} · Focus and press left or right arrow keys to resize · Press Enter or double-click to reset to default size`',
    )
    expectSourceToContain(
      'return `${title} · Focus and press arrow keys to resize · Press Enter or double-click to reset to default size`',
    )
    expectSourceToContain(
      'return `${label}. Focus and press Left or Right Arrow to nudge panel width. Press Enter to reset to default size.`',
    )
    expectSourceToContain(
      'return `${label}. Focus and press arrow keys to nudge panel width or height. Press Enter to reset to default size.`',
    )
    expectSourceToContain('const wantsReset = isPanelResizeKeyboardResetKey(e.key)')
    expectSourceToContain('const adjustment = getPanelResizeKeyboardAdjustment(position, e.key)')
    expectSourceToContain('if (!adjustment && !wantsReset) {')
    expectSourceToContain('aria-keyshortcuts={isKeyboardAccessible ? getResizeHandleKeyShortcuts(position) : undefined}')
    expectSourceToContain('tabIndex={isKeyboardAccessible && !isResizing ? 0 : undefined}')
    expectSourceToContain('onKeyDown={isKeyboardAccessible ? handleKeyDown : undefined}')
    expectSourceToContain('group-focus-visible/panel-resize:opacity-100')
    expectSourceToContain('group-focus-visible/panel-resize:bg-blue-500/70')
  })
})