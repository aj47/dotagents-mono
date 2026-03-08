import { describe, expect, it } from "vitest"

import {
  SIDEBAR_KEYBOARD_RESIZE_STEP,
  getSidebarResizeKeyboardAdjustment,
  isSidebarResizeResetKey,
} from "./use-sidebar"

describe("sidebar resize keyboard controls", () => {
  it("maps arrow keys to fixed sidebar width adjustments", () => {
    expect(getSidebarResizeKeyboardAdjustment("ArrowLeft")).toBe(
      -SIDEBAR_KEYBOARD_RESIZE_STEP,
    )
    expect(getSidebarResizeKeyboardAdjustment("ArrowRight")).toBe(
      SIDEBAR_KEYBOARD_RESIZE_STEP,
    )
    expect(getSidebarResizeKeyboardAdjustment("ArrowUp")).toBe(0)
  })

  it("uses Enter as the explicit keyboard reset key", () => {
    expect(isSidebarResizeResetKey("Enter")).toBe(true)
    expect(isSidebarResizeResetKey("Space")).toBe(false)
  })
})