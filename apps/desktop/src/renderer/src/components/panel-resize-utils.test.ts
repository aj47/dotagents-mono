import { describe, expect, it } from "vitest"
import { getNativePanelResizeSize, isPanelSize } from "./panel-resize-utils"

describe("panel resize utilities", () => {
  it("rounds zoom-scaled resize deltas to native integer pixels", () => {
    expect(
      getNativePanelResizeSize(
        { width: 300, height: 120 },
        { width: 13, height: 7 },
        { width: 280, height: 120 },
        1.25,
      ),
    ).toEqual({ width: 316, height: 129 })
  })

  it("keeps drag distance consistent across viewport scale while enforcing minimums", () => {
    expect(
      getNativePanelResizeSize(
        { width: 300, height: 150 },
        { width: -200, height: -40 },
        { width: 280, height: 120 },
        1.5,
      ),
    ).toEqual({ width: 280, height: 120 })
  })

  it("rejects non-finite panel sizes", () => {
    expect(isPanelSize({ width: 300, height: 120 })).toBe(true)
    expect(isPanelSize({ width: Number.NaN, height: 120 })).toBe(false)
    expect(isPanelSize({ width: 300, height: Number.POSITIVE_INFINITY })).toBe(false)
  })
})
