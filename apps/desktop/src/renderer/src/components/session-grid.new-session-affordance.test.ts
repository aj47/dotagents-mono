import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionGridSource = readFileSync(
  new URL("./session-grid.tsx", import.meta.url),
  "utf8",
)

const sessionsSource = readFileSync(
  new URL("../pages/sessions.tsx", import.meta.url),
  "utf8",
)

describe("session grid new-session affordance", () => {
  it("briefly highlights newly appended tiles without competing with drag-target feedback", () => {
    expect(sessionGridSource).toContain("isNewlyAdded?: boolean")
    expect(sessionGridSource).toContain(
      "const showNewSessionHighlight = isNewlyAdded && !isDragTarget && !isDragging",
    )
    expect(sessionGridSource).toContain(
      'data-session-tile-new={showNewSessionHighlight ? "true" : undefined}',
    )
    expect(sessionGridSource).toContain(
      'ring-2 ring-blue-500/35 ring-offset-2 ring-offset-background',
    )
    expect(sessionGridSource).toContain(
      'shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_12px_28px_rgba(59,130,246,0.1)]',
    )
    expect(sessionsSource).toContain(
      'isNewlyAdded={recentNewSessionFeedback?.sessionIds.includes(sessionId) ?? false}',
    )
  })
})