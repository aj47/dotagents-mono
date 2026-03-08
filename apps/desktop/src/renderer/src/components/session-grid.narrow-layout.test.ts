import { describe, expect, it } from "vitest"

import {
  calculateTileHeight,
  calculateTileWidth,
  getActiveTileResizeHintLabel,
  getEffectiveTileColumnCount,
  getIdleTileResizeHintLabel,
  getLockedWidthHeightRestoreCue,
  getResponsiveStackedLayoutWidthShortfall,
  getSingleViewLayoutRestoreHeight,
  getResizableTileWidthBounds,
  getResponsiveTileWidthOnContainerWidthChange,
  getSingleViewLayoutRestoreWidth,
  getTileResizeHandleTitle,
  getTileWidthLockHint,
  isResponsiveStackedTileLayout,
  shouldPromoteTileReorderHandle,
  shouldPreserveTileHeightOnLayoutChange,
  shouldPreserveTileWidthOnLayoutChange,
  shouldLockTileWidth,
  shouldRetargetTileHeightOnSessionCountChange,
  shouldUseSparseWideGridHeight,
  shouldRetargetTileHeightOnContainerHeightChange,
  shouldRetargetTileHeightOnContainerWidthChange,
} from "./session-grid"

describe("session grid narrow layout sizing", () => {
  it("stacks non-maximized layouts into a single full-width column when two minimum-width tiles no longer fit", () => {
    expect(getEffectiveTileColumnCount(415, 16, "1x2")).toBe(1)
    expect(calculateTileWidth(415, 16, "1x2")).toBe(415)
    expect(calculateTileWidth(350, 16, "2x2")).toBe(350)
  })

  it("keeps two columns once the container can fit both minimum-width tiles and the gap", () => {
    expect(getEffectiveTileColumnCount(416, 16, "1x2")).toBe(2)
    expect(calculateTileWidth(416, 16, "1x2")).toBe(200)
  })

  it("lets a single visible tile fill the row and use full height even when compare or grid mode stays selected", () => {
    expect(calculateTileWidth(900, 16, "1x2", 1)).toBe(900)
    expect(calculateTileWidth(900, 16, "2x2", 1)).toBe(900)
    expect(calculateTileHeight(900, 800, 16, "1x2", 1)).toBe(800)
    expect(calculateTileHeight(900, 800, 16, "2x2", 1)).toBe(800)
  })

  it("keeps stacked 2-up tiles denser by switching them to a half-height target once the layout collapses to one column", () => {
    expect(calculateTileHeight(600, 800, 16, "1x2")).toBe(800)
    expect(calculateTileHeight(415, 800, 16, "1x2")).toBe(392)
    expect(calculateTileHeight(900, 800, 16, "2x2", 2)).toBe(800)
    expect(calculateTileHeight(900, 800, 16, "2x2", 3)).toBe(392)
    expect(calculateTileHeight(415, 800, 16, "2x2", 2)).toBe(392)
  })

  it("relaxes resizable width bounds to the available container width on narrow layouts", () => {
    expect(getResizableTileWidthBounds(180)).toEqual({ minWidth: 180, maxWidth: 180 })
    expect(getResizableTileWidthBounds(350)).toEqual({ minWidth: 200, maxWidth: 350 })
    expect(getResizableTileWidthBounds(0)).toEqual({ minWidth: 200, maxWidth: 1200 })
  })

  it("keeps maximized layout full width regardless of the two-column breakpoint", () => {
    expect(getEffectiveTileColumnCount(180, 16, "1x1")).toBe(1)
    expect(calculateTileWidth(180, 16, "1x1")).toBe(180)
  })

  it("locks width resizing when single-view or responsive stacked layouts already occupy the full row", () => {
    expect(shouldLockTileWidth(415, 16, "1x2")).toBe(true)
    expect(shouldLockTileWidth(350, 16, "2x2")).toBe(true)
    expect(shouldLockTileWidth(600, 16, "1x1")).toBe(true)
    expect(shouldLockTileWidth(900, 16, "1x2", 1)).toBe(true)
    expect(shouldLockTileWidth(900, 16, "2x2", 1)).toBe(true)
    expect(shouldLockTileWidth(600, 16, "1x2")).toBe(false)
    expect(shouldLockTileWidth(0, 16, "1x1")).toBe(false)
  })

  it("explains why width resizing is unavailable when layout rules already require a full-width tile", () => {
    expect(getTileWidthLockHint(600, 16, "1x1")).toEqual({
      label: "Width follows Single view",
      title:
        "Tile width fills Single view. Corner resize is unavailable here, so drag the bottom edge to resize height, or switch back to Compare or Grid to resize width again.",
    })
    expect(getTileWidthLockHint(900, 16, "1x2", 1)).toEqual({
      label: "Width fills the row",
      title:
        "Only one session is visible, so tile width fills the row. Corner resize is unavailable here; drag the bottom edge to resize height until more sessions appear or you switch layouts.",
    })
    expect(getTileWidthLockHint(415, 16, "1x2", 2)).toEqual({
      label: "Width follows stacked layout",
      title:
        "Tile width fills the stacked layout. Corner resize is unavailable here, so drag the bottom edge to resize height, or widen the sessions area or switch layouts to resize width again.",
    })
    expect(getTileWidthLockHint(900, 16, "1x2", 2)).toBeNull()
  })

  it("preserves manual width only when compare and grid both stay in a side-by-side multi-tile state", () => {
    expect(shouldPreserveTileWidthOnLayoutChange("1x2", "2x2", 900, 16, 2)).toBe(true)
    expect(shouldPreserveTileWidthOnLayoutChange("2x2", "1x2", 900, 16, 3)).toBe(true)
    expect(shouldPreserveTileWidthOnLayoutChange("1x2", "1x1", 900, 16, 2)).toBe(false)
    expect(shouldPreserveTileWidthOnLayoutChange("1x1", "2x2", 900, 16, 2)).toBe(false)
    expect(shouldPreserveTileWidthOnLayoutChange("1x2", "2x2", 415, 16, 2)).toBe(false)
    expect(shouldPreserveTileWidthOnLayoutChange("1x2", "2x2", 900, 16, 1)).toBe(false)
  })

  it("preserves manual height only when compare and grid resolve to the same effective tile height", () => {
    expect(shouldPreserveTileHeightOnLayoutChange("1x2", "2x2", 900, 800, 16, 2)).toBe(true)
    expect(shouldPreserveTileHeightOnLayoutChange("1x2", "2x2", 415, 800, 16, 2)).toBe(true)
    expect(shouldPreserveTileHeightOnLayoutChange("1x2", "2x2", 900, 800, 16, 1)).toBe(true)
    expect(shouldPreserveTileHeightOnLayoutChange("1x2", "2x2", 900, 800, 16, 3)).toBe(false)
    expect(shouldPreserveTileHeightOnLayoutChange("1x2", "1x1", 900, 800, 16, 2)).toBe(false)
    expect(shouldPreserveTileHeightOnLayoutChange("2x2", "2x2", 900, 800, 16, 2)).toBe(false)
  })

  it("keeps a previous single-view return width only when it still fits the current side-by-side target closely enough", () => {
    expect(getSingleViewLayoutRestoreWidth(560, 450, 900, false)).toBe(560)
    expect(getSingleViewLayoutRestoreWidth(650, 450, 900, false)).toBeNull()
    expect(getSingleViewLayoutRestoreWidth(380, 350, 650, false)).toBe(380)
    expect(getSingleViewLayoutRestoreWidth(380, 350, 650, true)).toBeNull()
  })

  it("keeps a previous single-view return height only when it still fits the current tiled target closely enough", () => {
    expect(getSingleViewLayoutRestoreHeight(620, 500)).toBe(620)
    expect(getSingleViewLayoutRestoreHeight(520, 392)).toBe(520)
    expect(getSingleViewLayoutRestoreHeight(620, 392)).toBeNull()
    expect(getSingleViewLayoutRestoreHeight(120, 500)).toBe(150)
    expect(getSingleViewLayoutRestoreHeight(4201, 3200)).toBe(4000)
    expect(getSingleViewLayoutRestoreHeight(null, 500)).toBeNull()
  })

  it("flags the narrow responsive fallback when compare or grid modes stack into one column", () => {
    expect(isResponsiveStackedTileLayout(415, 16, "1x2", 2)).toBe(true)
    expect(isResponsiveStackedTileLayout(350, 16, "2x2", 3)).toBe(true)
    expect(isResponsiveStackedTileLayout(600, 16, "1x2", 2)).toBe(false)
    expect(isResponsiveStackedTileLayout(415, 16, "1x2", 1)).toBe(false)
    expect(isResponsiveStackedTileLayout(180, 16, "1x1", 3)).toBe(false)
  })

  it("promotes the tile reorder handle once compare or grid stack into a single column", () => {
    expect(shouldPromoteTileReorderHandle(415, 16, "1x2", 2)).toBe(true)
    expect(shouldPromoteTileReorderHandle(350, 16, "2x2", 3)).toBe(true)
    expect(shouldPromoteTileReorderHandle(600, 16, "1x2", 2)).toBe(false)
    expect(shouldPromoteTileReorderHandle(415, 16, "1x2", 1)).toBe(false)
    expect(shouldPromoteTileReorderHandle(180, 16, "1x1", 3)).toBe(false)
  })

  it("quantifies how much extra width compare or grid needs to restore or comfortably keep two columns", () => {
    expect(getResponsiveStackedLayoutWidthShortfall(415, 16, "1x2", 2)).toBe(1)
    expect(getResponsiveStackedLayoutWidthShortfall(416, 16, "1x2", 2)).toBe(0)
    expect(getResponsiveStackedLayoutWidthShortfall(500, 16, "2x2", 3, 96)).toBe(12)
    expect(getResponsiveStackedLayoutWidthShortfall(415, 16, "1x2", 1, 96)).toBe(0)
    expect(getResponsiveStackedLayoutWidthShortfall(180, 16, "1x1", 3, 96)).toBe(0)
  })

  it("flags the sparse wide grid state only when Grid can still keep two visible sessions side by side", () => {
    expect(shouldUseSparseWideGridHeight(900, 16, "2x2", 2)).toBe(true)
    expect(shouldUseSparseWideGridHeight(900, 16, "2x2", 1)).toBe(true)
    expect(shouldUseSparseWideGridHeight(900, 16, "2x2", 3)).toBe(false)
    expect(shouldUseSparseWideGridHeight(415, 16, "2x2", 2)).toBe(false)
    expect(shouldUseSparseWideGridHeight(900, 16, "1x2", 2)).toBe(false)
  })

  it("retargets height on vertical container changes only while the tile is still following the prior layout height", () => {
    expect(shouldRetargetTileHeightOnContainerHeightChange(392, 392, 452)).toBe(true)
    expect(shouldRetargetTileHeightOnContainerHeightChange(393, 392, 452)).toBe(true)
    expect(shouldRetargetTileHeightOnContainerHeightChange(430, 392, 452)).toBe(false)
    expect(shouldRetargetTileHeightOnContainerHeightChange(392, 392, 392)).toBe(false)
  })

  it("retargets height on width breakpoint changes only while the tile is still following the prior layout height", () => {
    expect(shouldRetargetTileHeightOnContainerWidthChange(392, 392, 452)).toBe(true)
    expect(shouldRetargetTileHeightOnContainerWidthChange(393, 392, 452)).toBe(true)
    expect(shouldRetargetTileHeightOnContainerWidthChange(430, 392, 452)).toBe(false)
    expect(shouldRetargetTileHeightOnContainerWidthChange(392, 392, 392)).toBe(false)
  })

  it("retargets session-count-driven temporary layout heights only while the tile is still following the prior layout height", () => {
    expect(shouldRetargetTileHeightOnSessionCountChange(392, 392, 452)).toBe(true)
    expect(shouldRetargetTileHeightOnSessionCountChange(393, 392, 452)).toBe(true)
    expect(shouldRetargetTileHeightOnSessionCountChange(430, 392, 452)).toBe(false)
    expect(shouldRetargetTileHeightOnSessionCountChange(392, 392, 392)).toBe(false)
  })

  it("preserves manual width during width-only reflow unless layout-driven sizing or tighter bounds require an update", () => {
    expect(getResponsiveTileWidthOnContainerWidthChange(520, 450, 490, 200, 900)).toBeNull()
    expect(getResponsiveTileWidthOnContainerWidthChange(450, 450, 490, 200, 900)).toBe(490)
    expect(getResponsiveTileWidthOnContainerWidthChange(451, 450, 490, 200, 900)).toBe(490)
    expect(getResponsiveTileWidthOnContainerWidthChange(180, 450, 490, 200, 900)).toBe(200)
    expect(getResponsiveTileWidthOnContainerWidthChange(920, 450, 490, 200, 900)).toBe(900)
  })

  it("formats active resize hints with live dimensions so tile resizing stays predictable after drag begins", () => {
    expect(getActiveTileResizeHintLabel("width", 451.6, 392, false)).toBe("Width · 452px")
    expect(getActiveTileResizeHintLabel("height", 452, 391.6, false)).toBe("Height · 392px")
    expect(getActiveTileResizeHintLabel("height", 452, 391.6, true)).toBe("Height only · 392px")
    expect(getActiveTileResizeHintLabel("corner", 451.6, 391.6, false)).toBe("452px × 392px")
  })

  it("keeps resize-handle recovery copy explicit so users can snap a tile back to the current layout fit", () => {
    expect(getIdleTileResizeHintLabel("width", false)).toBe("Resize width · Double-click to fit")
    expect(getIdleTileResizeHintLabel("height", false)).toBe("Resize height · Double-click to fit")
    expect(getIdleTileResizeHintLabel("height", true)).toBe("Resize height only · Double-click to fit")
    expect(getIdleTileResizeHintLabel("corner", false)).toBe("Resize tile · Double-click to fit")
    expect(getTileResizeHandleTitle("width", false)).toBe(
      "Drag to resize tile width. Double-click to restore the layout width.",
    )
    expect(getTileResizeHandleTitle("height", true)).toBe(
      "Drag the bottom edge to resize tile height while tile width follows the current layout. Double-click to restore the layout height.",
    )
    expect(getTileResizeHandleTitle("corner", false)).toBe(
      "Drag to resize tile width and height. Double-click to restore the layout size.",
    )
  })

  it("explains when a width-locked bottom-edge fit only restores height because width still follows layout", () => {
    expect(getLockedWidthHeightRestoreCue()).toEqual({
      label: "Height fit",
      badgeLabel: "Width follows layout",
      title:
        "Tile height returned to the current layout fit. Width still follows the current layout.",
    })
  })
})