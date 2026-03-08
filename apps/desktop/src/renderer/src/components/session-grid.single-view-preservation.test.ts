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
const compactSessionGridSource = sessionGridSource.replace(/\s+/g, "")
const compactSessionsSource = sessionsSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactSessionGridSource).toContain(fragment.replace(/\s+/g, ""))
}

function expectSessionsSourceToContain(fragment: string) {
  expect(compactSessionsSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("session grid single view preservation", () => {
  it("treats single view as a temporary focus layout instead of resetting remembered multi-tile sizing", () => {
    expectSourceToContain('const isFocusLayout = layoutMode === "1x1"')
    expectSourceToContain("const layoutWidth = calculateTileWidth(")
    expectSourceToContain("const layoutHeight = calculateTileHeight(")
    expectSourceToContain("const previousLayoutMode = lastLayoutModeRef.current")
    expectSourceToContain(
      'if (previousLayoutMode === "1x1" || layoutMode === "1x1") {',
    )
    expectSourceToContain('if (!hasPersistedSize && layoutMode !== "1x1") {')
    expectSourceToContain('layoutMode === "1x1"')
    expectSourceToContain(
      "const usesExpandedTileWidth =",
    )
    expectSourceToContain(
      "const renderedWidth = usesExpandedTileWidth ? expandedLayoutWidth : width",
    )
    expectSourceToContain(
      "const renderedHeight = isFocusLayout || isTemporarySingleVisibleLayout",
    )
    expectSourceToContain("width: renderedWidth")
    expectSourceToContain('height: isCollapsed ? "auto" : renderedHeight')
  })

  it("keeps width continuity when switching between compare and grid while still resetting height for the new row model", () => {
    expectSourceToContain(
      "shouldPreserveTileWidthAcrossLayoutChange(previousLayoutMode,layoutMode)",
    )
    expectSourceToContain(
      "...(shouldPreserveWidthAcrossLayoutChange?{height:effectiveTileLayoutHeight}:{width:layoutWidth,height:effectiveTileLayoutHeight})",
    )
  })

  it("expands a lone visible compare/grid tile to the focus footprint without overwriting remembered multi-tile sizing", () => {
    expectSourceToContain("sessionCount: number")
    expectSourceToContain(
      'const isTemporarySingleVisibleLayout = !isFocusLayout && sessionCount === 1',
    )
    expectSourceToContain('function calculateExpandedTileWidth(containerWidth: number): number {')
    expectSourceToContain(
      'return Math.max(1, Math.min(TILE_DIMENSIONS.width.max, containerWidth))',
    )
    expectSourceToContain(
      'const expandedLayoutWidth = calculateExpandedTileWidth(containerWidth)',
    )
    expectSourceToContain(
      'const expandedLayoutHeight = calculateTileHeight(containerHeight, gap, "1x1")',
    )
    expectSourceToContain(
      'const isResponsiveStackedLayoutActive = isResponsiveStackedTileLayout(',
    )
    expectSourceToContain(
      "isFocusLayout || isTemporarySingleVisibleLayout || isResponsiveStackedLayoutActive",
    )
    expectSourceToContain(
      "const renderedWidth = usesExpandedTileWidth ? expandedLayoutWidth : width",
    )
    expectSourceToContain(
      "isFocusLayout || isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "!isCollapsed && !isFocusLayout && !isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const showWidthResizeHandles = showResizeHandles && !isResponsiveStackedLayoutActive",
    )
    expectSourceToContain("{showWidthResizeHandles && (")
  })

  it("lets focused and stacked single-column tiles fit the actual available width even below the normal multi-tile minimum", () => {
    expectSourceToContain('function calculateExpandedTileWidth(containerWidth: number): number {')
    expectSourceToContain(
      'fitting the available column is more important',
    )
    expectSourceToContain(
      'const expandedLayoutWidth = calculateExpandedTileWidth(containerWidth)',
    )
    expectSourceToContain(
      'const renderedWidth = usesExpandedTileWidth ? expandedLayoutWidth : width',
    )
  })

  it("temporarily caps overly tall stacked tiles to a denser one-column height and restores the previous taller height after unstacking when the user did not manually resize", () => {
    expectSourceToContain(
      'export function calculateResponsiveStackedTileHeight(containerHeight: number, gap: number,',
    )
    expectSourceToContain('default to a denser half-height footprint')
    expectSourceToContain(
      'const responsiveStackedLayoutHeight = calculateResponsiveStackedTileHeight(',
    )
    expectSourceToContain('containerHeight,')
    expectSourceToContain('gap,')
    expectSourceToContain(
      'const effectiveTileLayoutHeight = isResponsiveStackedLayoutActive ? responsiveStackedLayoutHeight : layoutHeight',
    )
    expectSourceToContain(
      'const responsiveStackedAutoHeightRef = useRef<{ previousHeight: number stackedHeight: number } | null>(null)',
    )
    expectSourceToContain(
      'if (isResponsiveStackedLayoutActive) { if (height > responsiveStackedLayoutHeight + 8) { responsiveStackedAutoHeightRef.current = { previousHeight: height, stackedHeight: responsiveStackedLayoutHeight }',
    )
    expectSourceToContain('setSize({ height: responsiveStackedLayoutHeight })')
    expectSourceToContain(
      'Math.abs(height - responsiveStackedAutoHeight.stackedHeight) <= 8',
    )
    expectSourceToContain(
      'setSize({ height: responsiveStackedAutoHeight.previousHeight })',
    )
    expectSourceToContain(
      'const resetSize = getTileResizeResetSize(',
    )
    expectSourceToContain(
      'getTileResizeResetSize("height",',
    )
  })

  it("briefly intensifies the restored tile highlight after leaving single view so users can reconnect the maximized session with its grid position", () => {
    expectSessionsSourceToContain(
      'isRestoredFromSingleView={\n                    recentSingleViewRestoreFeedback?.sessionId === sessionId\n                  }',
    )
    expectSourceToContain("isRestoredFromSingleView?: boolean")
    expectSourceToContain("isRestoredFromSingleView = false")
    expectSourceToContain(
      "const showRestoredFromSingleViewHighlight =",
    )
    expectSourceToContain(
      "showRestoredFromSingleViewHighlight &&\n          \"z-[2] ring-2 ring-sky-500/60 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_14px_30px_rgba(14,165,233,0.12)]\"",
    )
    expectSourceToContain(
      'data-session-tile-restored={\n        showRestoredFromSingleViewHighlight ? "true" : undefined\n      }',
    )
    expectSourceToContain(
      "isNewlyAdded &&\n    !showRestoredFromSingleViewHighlight &&",
    )
  })
})