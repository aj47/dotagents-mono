import { describe, expect, it } from "vitest"
import { getPanelViewportScale } from "./panel-viewport-utils"

describe("panel viewport utilities", () => {
  it("snaps near-1 native-to-css viewport scale differences to 1", () => {
    expect(
      getPanelViewportScale(
        { width: 500, height: 300 },
        { width: 510, height: 300 },
      ),
    ).toBe(1)

    expect(
      getPanelViewportScale(
        { width: 510, height: 300 },
        { width: 500, height: 300 },
      ),
    ).toBe(1)
  })

  it("keeps meaningful zoom-scale differences outside the snap threshold", () => {
    expect(
      getPanelViewportScale(
        { width: 470, height: 282 },
        { width: 500, height: 300 },
      ),
    ).toBe(0.94)

    expect(
      getPanelViewportScale(
        { width: 530, height: 318 },
        { width: 500, height: 300 },
      ),
    ).toBe(1.06)
  })

  it("falls back to 1 for invalid or transient zero-sized measurements", () => {
    expect(getPanelViewportScale({ width: Number.NaN, height: 300 }, { width: 500, height: 300 })).toBe(1)
    expect(getPanelViewportScale({ width: 500, height: 300 }, { width: 0, height: 300 })).toBe(1)
  })
})