import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { getAvailableTileLayoutModes, getTileGridRowSpan } from "./session-grid-layout"

const sessionGridSource = readFileSync(new URL("./session-grid.tsx", import.meta.url), "utf8")

describe("session grid layout", () => {
  it("generates layout presets from the measured viewport instead of capping at 2x2", () => {
    expect(getAvailableTileLayoutModes(1100, 980, 12)).toEqual(
      expect.arrayContaining(["1x3", "2x3", "3x2", "1x1"])
    )
  })

  it("drops multi-tile presets that would fall below the default tile size", () => {
    expect(getAvailableTileLayoutModes(640, 540, 12)).toEqual(["1x1"])
  })

  it("uses dense grid rows so collapsed tiles can repack reclaimed space", () => {
    expect(getTileGridRowSpan(300, 12)).toBeGreaterThan(1)
    expect(sessionGridSource).toContain("grid-flow-row-dense")
    expect(sessionGridSource).toContain("gridAutoRows")
  })

  it("preserves persisted maximized tile sizes across layout-driven updates", () => {
    expect(sessionGridSource).toContain("shouldPreservePersistedMaximizedSize")
    expect(sessionGridSource).toContain("hasPersistedSize")
  })
})