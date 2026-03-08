import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionGridSource = readFileSync(
  new URL("./session-grid.tsx", import.meta.url),
  "utf8",
)

describe("session grid drag affordance", () => {
  it("keeps the reorder handle visible at rest instead of hiding it until hover", () => {
    expect(sessionGridSource).toContain(
      'group/session-tile relative flex-shrink-0 transition-all duration-200',
    )
    expect(sessionGridSource).toContain(
      'group/reorder-handle absolute left-1 top-1 z-10 flex min-h-8 min-w-8 items-center justify-center rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-1',
    )
    expect(sessionGridSource).toContain('isDragging ? "cursor-grabbing" : "cursor-grab"')
    expect(sessionGridSource).toContain(
      'opacity-70 group-hover/session-tile:opacity-100 group-focus-visible/reorder-handle:opacity-100',
    )
    expect(sessionGridSource).not.toContain('opacity-0 hover:opacity-100')
    expect(sessionGridSource).toContain('Grab to reorder. Focus and press arrow keys to move this session earlier or later.')
  })

  it("starts drag from the visible reorder handle instead of making the whole tile surface draggable", () => {
    expect(sessionGridSource).toContain('role="button"')
    expect(sessionGridSource).toContain('tabIndex={isResizing ? -1 : 0}')
    expect(sessionGridSource).toContain('aria-label={reorderHandleAriaLabel}')
    expect(sessionGridSource).toContain('aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"')
    expect(sessionGridSource).toContain('draggable={!isResizing}')
    expect(sessionGridSource).toContain('onDragStart={handleDragStart}')
    expect(sessionGridSource).toContain('onDragEnd={handleDragEnd}')
    expect(sessionGridSource).toContain('onKeyDown={handleReorderKeyDown}')
    expect(sessionGridSource).not.toContain('draggable={isDraggable && !isResizing}')
  })

  it("expands the reorder handle hit target without making the visible handle chrome much heavier", () => {
    expect(sessionGridSource).toContain(
      'group/reorder-handle absolute left-1 top-1 z-10 flex min-h-8 min-w-8 items-center justify-center rounded-full outline-none transition-all duration-200',
    )
    expect(sessionGridSource).toContain(
      'pointer-events-none inline-flex min-w-0 items-center rounded-full border border-border/60 bg-background/85 px-1.5 py-1.5 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 group-hover/session-tile:border-blue-500/40 group-hover/session-tile:bg-background/95 group-focus-visible/reorder-handle:border-blue-500/40 group-focus-visible/reorder-handle:bg-background/95',
    )
    expect(sessionGridSource).toContain('isDragging ? "cursor-grabbing" : "cursor-grab"')
  })

  it("reveals a short move label on hover or keyboard focus so the handle is easier to identify before dragging", () => {
    expect(sessionGridSource).toContain(
      'const reorderHandleVisibleLabel = renderedWidth < 320 ? "Move" : "Reorder"',
    )
    expect(sessionGridSource).toContain(
      'const activeReorderHandleVisibleLabel = isDragging ? "Moving" : reorderHandleVisibleLabel',
    )
    expect(sessionGridSource).toContain(
      '<GripVertical className="h-4 w-4 shrink-0" />',
    )
    expect(sessionGridSource).toContain(
      'overflow-hidden whitespace-nowrap text-[10px] font-medium leading-none transition-all duration-200',
    )
    expect(sessionGridSource).toContain(
      'group-hover/session-tile:ml-1 group-hover/session-tile:max-w-20 group-hover/session-tile:opacity-100 group-focus-visible/reorder-handle:ml-1 group-focus-visible/reorder-handle:max-w-20 group-focus-visible/reorder-handle:opacity-100',
    )
    expect(sessionGridSource).toContain(
      'isDragging\n                  ? "ml-1 max-w-20 opacity-100"',
    )
    expect(sessionGridSource).toContain('{activeReorderHandleVisibleLabel}')
  })

  it("supports keyboard reordering on the same visible handle with clear focus styling", () => {
    expect(sessionGridSource).toContain(
      'const handleReorderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {',
    )
    expect(sessionGridSource).toContain('e.key === "ArrowLeft" || e.key === "ArrowUp"')
    expect(sessionGridSource).toContain('e.key === "ArrowRight" || e.key === "ArrowDown"')
    expect(sessionGridSource).toContain('onMoveBackward?.(sessionId)')
    expect(sessionGridSource).toContain('onMoveForward?.(sessionId)')
    expect(sessionGridSource).toContain('focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-1')
  })

  it("keeps the dragged source tile clearly in-flight instead of only fading it like a disabled tile", () => {
    expect(sessionGridSource).toContain(
      'const showDraggingTileHighlight = isDragging && !isDragTarget',
    )
    expect(sessionGridSource).toContain(
      'showDraggingTileHighlight &&\n          "z-[1] opacity-65 ring-2 ring-blue-500/35 ring-offset-1 ring-offset-background shadow-[0_0_0_1px_rgba(59,130,246,0.1),0_12px_24px_rgba(59,130,246,0.08)]"',
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-dragging={showDraggingTileHighlight ? "true" : undefined}',
    )
    expect(sessionGridSource).toContain(
      'isDragging\n                ? "border-blue-500/45 bg-blue-50/90 text-blue-700 shadow-[0_0_0_1px_rgba(59,130,246,0.08)] dark:bg-blue-950/40 dark:text-blue-200 opacity-100"',
    )
    expect(sessionGridSource).not.toContain('isDragging && "opacity-50"')
  })
})