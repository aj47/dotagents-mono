import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"

vi.mock("electron", () => ({
  screen: {
    getDisplayNearestPoint: vi.fn(() => ({ workArea: { x: 0, y: 0, width: 1440, height: 900 } })),
    getCursorScreenPoint: vi.fn(() => ({ x: 0, y: 0 })),
  },
}))

vi.mock("./config", () => ({
  configStore: { get: () => ({ panelPosition: "top-right" }) },
}))

import { calculateAnchoredPanelPosition } from "./panel-position"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("floating panel resize anchoring", () => {
  it("keeps the opposite edge fixed when resizing from the left or top", () => {
    const currentBounds = { x: 900, y: 40, width: 600, height: 400 }

    expect(
      calculateAnchoredPanelPosition({
        currentBounds,
        nextSize: { width: 480, height: 400 },
        resizeAnchor: "left",
      }),
    ).toEqual({ x: 1020, y: 40 })

    expect(
      calculateAnchoredPanelPosition({
        currentBounds,
        nextSize: { width: 600, height: 320 },
        resizeAnchor: "top",
      }),
    ).toEqual({ x: 900, y: 120 })

    expect(
      calculateAnchoredPanelPosition({
        currentBounds,
        nextSize: { width: 480, height: 320 },
        resizeAnchor: "top-left",
      }),
    ).toEqual({ x: 1020, y: 120 })
  })

  it("leaves the window origin unchanged when resizing from the right or bottom edges", () => {
    const currentBounds = { x: 900, y: 40, width: 600, height: 400 }

    expect(
      calculateAnchoredPanelPosition({
        currentBounds,
        nextSize: { width: 720, height: 480 },
        resizeAnchor: "bottom-right",
      }),
    ).toEqual({ x: 900, y: 40 })
  })

  it("repositions the live panel during manual resize in the TIPC layer", () => {
    expect(tipcSource).toContain('resizeAnchor?: PanelResizeAnchor | null')
    expect(tipcSource).toContain('const currentBounds = win.getBounds()')
    expect(tipcSource).toContain('const anchoredPosition = calculateAnchoredPanelPosition({')
    expect(tipcSource).toContain('const constrainedPosition = constrainPositionToScreen(')
    expect(tipcSource).toContain('win.setPosition(constrainedPosition.x, constrainedPosition.y)')
  })
})