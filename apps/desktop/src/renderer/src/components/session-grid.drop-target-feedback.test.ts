import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionGridSource = readFileSync(
  new URL("./session-grid.tsx", import.meta.url),
  "utf8",
)

describe("session grid drop target feedback", () => {
  it("tells the user whether the dragged session will land before or after the highlighted tile", () => {
    expect(sessionGridSource).toContain(
      'dragTargetPosition?: "before" | "after" | null',
    )
    expect(sessionGridSource).toContain(
      'function getDragTargetBadgeLabel(position: "before" | "after"): string',
    )
    expect(sessionGridSource).toContain(
      'function getDragTargetInsertionCueClasses(position: "before" | "after"): string',
    )
    expect(sessionGridSource).toContain(
      'return position === "before" ? "Drop before" : "Drop after"',
    )
    expect(sessionGridSource).toContain(
      'return position === "before" ? "top-2.5" : "bottom-2.5"',
    )
    expect(sessionGridSource).toContain(
      'const dragTargetBadgeLabel =',
    )
    expect(sessionGridSource).toContain('dragTargetPosition ? `${dragTargetBadgeLabel} this session` : dragTargetBadgeLabel')
    expect(sessionGridSource).toContain('Drop before')
    expect(sessionGridSource).toContain('Drop after')
    expect(sessionGridSource).toContain('data-session-tile-drop-sequence={dragTargetPosition}')
  })

  it("keeps the drop target visually stronger than a generic focus ring while the outcome badge is shown", () => {
    expect(sessionGridSource).toContain(
      'ring-2 ring-blue-500/80 ring-offset-2 ring-offset-background',
    )
    expect(sessionGridSource).toContain(
      'absolute inset-1 z-10 rounded-lg border border-dashed border-blue-500/70 bg-blue-500/[0.07]',
    )
    expect(sessionGridSource).toContain(
      'absolute left-5 right-5 z-20 h-1.5 rounded-full bg-blue-500/80 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]',
    )
    expect(sessionGridSource).toContain(
      'border border-blue-500/50 bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-blue-700',
    )
  })
})