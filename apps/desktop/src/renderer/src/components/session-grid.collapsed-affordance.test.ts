import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionGridSource = readFileSync(
  new URL("./session-grid.tsx", import.meta.url),
  "utf8",
)

describe("session grid collapsed affordance", () => {
  it("gives collapsed tiles a distinct wrapper treatment without competing with stronger transient tile states", () => {
    expect(sessionGridSource).toContain(
      "const showCollapsedTileHighlight =",
    )
    expect(sessionGridSource).toContain(
      "!!isCollapsed &&\n    !showRestoredFromSingleViewHighlight &&\n    !showNewSessionHighlight &&\n    !isDragTarget &&\n    !isDragging",
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-collapsed={\n        showCollapsedTileHighlight ? "true" : undefined\n      }',
    )
    expect(sessionGridSource).toContain(
      'showCollapsedTileHighlight &&\n          "z-[1] ring-1 ring-slate-400/45 ring-offset-1 ring-offset-background shadow-[0_0_0_1px_rgba(148,163,184,0.1),0_10px_24px_rgba(15,23,42,0.06)]"',
    )
    expect(sessionGridSource).toContain(
      'className="pointer-events-none absolute inset-1 z-[1] rounded-lg border border-dashed border-slate-400/35 bg-slate-500/[0.04]"',
    )
  })
})