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

describe("session grid reorder/resize interplay", () => {
  it("hides tile resize handles while a reorder drag is active so drop cues do not compete with resize chrome", () => {
    expect(sessionGridSource).toContain("isReorderInteractionActive?: boolean")
    expect(sessionGridSource).toContain(
      "const showResizeHandles =",
    )
    expect(sessionGridSource).toContain("!isReorderInteractionActive")
    expect(sessionGridSource).toContain("{showResizeHandles && (")
    expect(sessionsSource).toContain(
      "isReorderInteractionActive={canReorderTiles && draggedSessionId !== null}",
    )
  })
})