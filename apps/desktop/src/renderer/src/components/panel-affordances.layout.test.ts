import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const panelDragBarSource = readFileSync(new URL("./panel-drag-bar.tsx", import.meta.url), "utf8")
const resizeHandleSource = readFileSync(new URL("./resize-handle.tsx", import.meta.url), "utf8")

describe("panel affordances layout", () => {
  it("uses a drag grip instead of a persistent loading spinner in the floating panel header", () => {
    expect(panelDragBarSource).toContain('import { GripHorizontal } from "lucide-react"')
    expect(panelDragBarSource).toContain(
      '"flex items-center justify-center rounded-full border border-black/10 bg-black/5 px-2 py-0.5 shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-white/5"',
    )
    expect(panelDragBarSource).toContain('className="h-3.5 w-3.5 text-muted-foreground/80"')
    expect(panelDragBarSource).not.toContain("LoadingSpinner")
  })

  it("shows subtle resize markers before hover so the floating panel reads as resizable", () => {
    expect(resizeHandleSource).toContain('const getIndicatorClasses = () => {')
    expect(resizeHandleSource).toContain('"group/resize-handle transition-colors duration-200"')
    expect(resizeHandleSource).toContain('"pointer-events-none absolute transition-colors duration-200"')
    expect(resizeHandleSource).toContain('"border-black/15 dark:border-white/20 group-hover/resize-handle:border-blue-400/60"')
    expect(resizeHandleSource).toContain('return "left-0.5 top-0.5 h-2.5 w-2.5 rounded-tl-sm border-l border-t"')
    expect(resizeHandleSource).toContain('return "right-0 top-1/2 h-10 -translate-y-1/2 border-r"')
  })
})