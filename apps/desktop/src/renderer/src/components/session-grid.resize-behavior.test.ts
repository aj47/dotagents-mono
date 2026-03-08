import { describe, expect, it } from "vitest"

import {
  calculateResponsiveStackedTileHeight,
  calculateTileHeight,
  calculateResponsiveTileHeight,
  calculateResponsiveTileWidth,
  didTileResizeHandleChangeSize,
  getResponsiveStackedTileLayoutMinimumWidth,
  getTileResizeFeedbackLabel,
  getTileResizeKeyboardFeedbackLabel,
  getTileResizeKeyboardAdjustment,
  getTileResizeResetSize,
  isTileResizeKeyboardResetKey,
  isResponsiveStackedTileLayout,
  shouldPreserveTileWidthAcrossLayoutChange,
} from "./session-grid"

describe("session grid responsive tile sizing", () => {
  it("preserves the user's resize delta when the available tiling width changes", () => {
    expect(
      calculateResponsiveTileWidth({
        currentWidth: 500,
        previousContainerWidth: 816,
        nextContainerWidth: 656,
        gap: 16,
        layoutMode: "1x2",
      }),
    ).toBe(400)
  })

  it("falls back to the next layout width when the current width is not a usable baseline", () => {
    expect(
      calculateResponsiveTileWidth({
        currentWidth: 0,
        previousContainerWidth: 816,
        nextContainerWidth: 656,
        gap: 16,
        layoutMode: "1x2",
      }),
    ).toBe(320)
  })

  it("clamps overly tall manual heights back to the layout baseline when the tiled viewport shrinks", () => {
    expect(
      calculateResponsiveTileHeight({
        currentHeight: 780,
        previousContainerHeight: 900,
        nextContainerHeight: 620,
        nextLayoutHeight: 620,
      }),
    ).toBe(620)
  })

  it("keeps the user's chosen shorter height when the viewport shrinks but the tile already fits", () => {
    expect(
      calculateResponsiveTileHeight({
        currentHeight: 420,
        previousContainerHeight: 900,
        nextContainerHeight: 620,
        nextLayoutHeight: 620,
      }),
    ).toBe(420)
  })

  it("does not stretch manual heights just because the tiled viewport gets taller again", () => {
    expect(
      calculateResponsiveTileHeight({
        currentHeight: 420,
        previousContainerHeight: 620,
        nextContainerHeight: 900,
        nextLayoutHeight: 900,
      }),
    ).toBe(420)
  })

  it("lets 2x2 tiles use the full tiled height when only one row of visible sessions remains", () => {
    expect(calculateTileHeight(900, 16, "2x2", 1)).toBe(900)
    expect(calculateTileHeight(900, 16, "2x2", 2)).toBe(900)
    expect(calculateTileHeight(900, 16, "2x2", 3)).toBe(442)
    expect(calculateTileHeight(900, 16, "2x2", 4)).toBe(442)
  })

  it("preserves manual width when switching between compare and grid because both layouts share the same column width model", () => {
    expect(shouldPreserveTileWidthAcrossLayoutChange("1x2", "2x2")).toBe(
      true,
    )
    expect(shouldPreserveTileWidthAcrossLayoutChange("2x2", "1x2")).toBe(
      true,
    )
    expect(shouldPreserveTileWidthAcrossLayoutChange("1x1", "1x2")).toBe(
      false,
    )
    expect(shouldPreserveTileWidthAcrossLayoutChange("1x2", "1x1")).toBe(
      false,
    )
  })

  it("stacks compare/grid once the normal two-column tile baseline no longer fits", () => {
    expect(isResponsiveStackedTileLayout(655, 16, "1x2", 2)).toBe(true)
    expect(isResponsiveStackedTileLayout(656, 16, "1x2", 2)).toBe(false)
    expect(isResponsiveStackedTileLayout(655, 16, "2x2", 4)).toBe(true)
    expect(isResponsiveStackedTileLayout(656, 16, "2x2", 4)).toBe(false)
    expect(isResponsiveStackedTileLayout(300, 16, "1x2", 1)).toBe(false)
    expect(isResponsiveStackedTileLayout(655, 16, "1x1", 2)).toBe(false)
  })

  it("exposes the minimum width threshold so sessions-page hints can describe how much side-by-side room is needed or left", () => {
    expect(getResponsiveStackedTileLayoutMinimumWidth(16, 2)).toBe(656)
    expect(getResponsiveStackedTileLayoutMinimumWidth(16, 4)).toBe(656)
    expect(getResponsiveStackedTileLayoutMinimumWidth(16, 1)).toBe(0)
  })

  it("uses a denser default height when width pressure temporarily stacks tiles into one column", () => {
    expect(calculateResponsiveStackedTileHeight(900, 16)).toBe(442)
    expect(calculateResponsiveStackedTileHeight(260, 16)).toBe(150)
  })

  it("resets only the dimension implied by the tile resize handle, unless the corner handle is used", () => {
    expect(getTileResizeResetSize("width", 420, 700)).toEqual({ width: 420 })
    expect(getTileResizeResetSize("height", 420, 700)).toEqual({
      height: 700,
    })
    expect(getTileResizeResetSize("corner", 420, 700)).toEqual({
      width: 420,
      height: 700,
    })
  })

  it("treats pointer resize completion as meaningful only when the active handle's dimension actually changed", () => {
    expect(
      didTileResizeHandleChangeSize(
        "width",
        { width: 420, height: 700 },
        { width: 444, height: 700 },
      ),
    ).toBe(true)
    expect(
      didTileResizeHandleChangeSize(
        "width",
        { width: 420, height: 700 },
        { width: 420, height: 760 },
      ),
    ).toBe(false)
    expect(
      didTileResizeHandleChangeSize(
        "height",
        { width: 420, height: 700 },
        { width: 420, height: 724 },
      ),
    ).toBe(true)
    expect(
      didTileResizeHandleChangeSize(
        "corner",
        { width: 420, height: 700 },
        { width: 420, height: 724 },
      ),
    ).toBe(true)
  })

  it("maps arrow keys to local tile-resize nudges so visible edge and corner grips can resize without dragging", () => {
    expect(getTileResizeKeyboardAdjustment("width", "ArrowLeft")).toEqual({
      width: -24,
    })
    expect(getTileResizeKeyboardAdjustment("height", "ArrowDown")).toEqual({
      height: 24,
    })
    expect(getTileResizeKeyboardAdjustment("corner", "ArrowRight")).toEqual({
      width: 24,
    })
    expect(getTileResizeKeyboardAdjustment("corner", "ArrowUp")).toEqual({
      height: -24,
    })
    expect(getTileResizeKeyboardAdjustment("corner", "Enter")).toBeNull()
  })

  it("treats Enter as a local keyboard reset shortcut for the focused corner resize grip", () => {
    expect(isTileResizeKeyboardResetKey("Enter")).toBe(true)
    expect(isTileResizeKeyboardResetKey(" ")).toBe(false)
    expect(isTileResizeKeyboardResetKey("ArrowRight")).toBe(false)
  })

  it("formats drag-time resize feedback with compact fallbacks for narrow tiles", () => {
    expect(
      getTileResizeFeedbackLabel("width", { width: 420, height: 700 }),
    ).toBe("Width 420px · Double-click reset")
    expect(
      getTileResizeFeedbackLabel(
        "height",
        { width: 420, height: 700 },
        { compact: true },
      ),
    ).toBe("Height 700px")
    expect(
      getTileResizeFeedbackLabel(
        "corner",
        { width: 420, height: 700 },
        { compact: true },
      ),
    ).toBe("420px × 700px")
  })

  it("formats explicit pointer reset feedback so double-click reset feels confirmed instead of looking like drag-time feedback", () => {
    expect(
      getTileResizeFeedbackLabel(
        "width",
        { width: 420, height: 700 },
        { reset: true },
      ),
    ).toBe("Width reset · 420px")
    expect(
      getTileResizeFeedbackLabel(
        "height",
        { width: 420, height: 300 },
        { compact: true, reset: true },
      ),
    ).toBe("Height reset 300px")
    expect(
      getTileResizeFeedbackLabel(
        "corner",
        { width: 320, height: 620 },
        { compact: true, reset: true },
      ),
    ).toBe("Reset 320px × 620px")
  })

  it("formats keyboard resize feedback so nudges and resets read clearly without drag-only wording", () => {
    expect(
      getTileResizeKeyboardFeedbackLabel("width", { width: 444, height: 700 }),
    ).toBe("Width 444px · Enter reset")
    expect(
      getTileResizeKeyboardFeedbackLabel(
        "height",
        { width: 420, height: 300 },
        { reset: true },
      ),
    ).toBe("Height reset · 300px")
    expect(
      getTileResizeKeyboardFeedbackLabel(
        "corner",
        { width: 320, height: 620 },
        { compact: true, reset: true },
      ),
    ).toBe("Reset 320px × 620px")
  })
})