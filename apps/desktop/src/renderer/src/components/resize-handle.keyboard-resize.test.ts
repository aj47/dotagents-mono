import { describe, expect, it } from "vitest"

import {
  PANEL_KEYBOARD_RESIZE_STEP,
  getPanelResizeKeyboardAdjustment,
  isPanelResizeKeyboardResetKey,
} from "./resize-handle"

describe("floating panel keyboard resize helpers", () => {
  it("maps left and right panel rails to local width nudges", () => {
    expect(getPanelResizeKeyboardAdjustment("right", "ArrowRight")).toEqual({
      width: PANEL_KEYBOARD_RESIZE_STEP,
      height: 0,
    })
    expect(getPanelResizeKeyboardAdjustment("left", "ArrowLeft")).toEqual({
      width: PANEL_KEYBOARD_RESIZE_STEP,
      height: 0,
    })
    expect(getPanelResizeKeyboardAdjustment("left", "ArrowRight")).toEqual({
      width: -PANEL_KEYBOARD_RESIZE_STEP,
      height: 0,
    })
  })

  it("maps corner handles to directional width and height nudges", () => {
    expect(getPanelResizeKeyboardAdjustment("bottom-right", "ArrowDown")).toEqual({
      width: 0,
      height: PANEL_KEYBOARD_RESIZE_STEP,
    })
    expect(getPanelResizeKeyboardAdjustment("top-right", "ArrowUp")).toEqual({
      width: 0,
      height: PANEL_KEYBOARD_RESIZE_STEP,
    })
    expect(getPanelResizeKeyboardAdjustment("bottom-left", "ArrowLeft")).toEqual({
      width: PANEL_KEYBOARD_RESIZE_STEP,
      height: 0,
    })
    expect(getPanelResizeKeyboardAdjustment("bottom-right", "Enter")).toBeNull()
  })

  it("treats Enter as the focused panel-handle keyboard reset shortcut", () => {
    expect(isPanelResizeKeyboardResetKey("Enter")).toBe(true)
    expect(isPanelResizeKeyboardResetKey(" ")).toBe(false)
    expect(isPanelResizeKeyboardResetKey("ArrowLeft")).toBe(false)
  })
})