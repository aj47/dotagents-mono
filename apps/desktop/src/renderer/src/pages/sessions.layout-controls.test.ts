import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(
  new URL("./sessions.tsx", import.meta.url),
  "utf8",
)
const compactSessionsSource = sessionsSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactSessionsSource).toContain(fragment.replace(/\s+/g, ""))
}

function expectSourceNotToContain(fragment: string) {
  expect(compactSessionsSource).not.toContain(fragment.replace(/\s+/g, ""))
}

describe("sessions layout controls", () => {
  it("uses direct-select layout buttons as the primary current-state affordance", () => {
    expectSourceToContain('role="group"')
    expectSourceToContain('aria-label="Session tile layout"')
    expectSourceToContain("aria-pressed={tileLayoutMode === mode}")
    expectSourceToContain(
      "const showLayoutButtonLabels = !isVeryCompactSessionHeader",
    )
    expectSourceToContain(
      "const showCurrentLayoutChip = usesAdaptiveLayoutDescription",
    )
    expectSourceToContain("{showCurrentLayoutChip && (")
    expectSourceToContain(
      "showLayoutButtonLabels ? <span>{label}</span> : null",
    )
    expectSourceToContain('label: "Compare"')
    expectSourceToContain('label: "Single"')
    expectSourceToContain('title: "Compare sessions side by side"')
    expectSourceToContain('title: "Show one session at a time"')
    expectSourceToContain('"1x2": "Compare view"')
    expectSourceToContain('"1x1": "Single view"')
    expectSourceToContain('"1x2": "Side by side"')
    expectSourceToContain(
      "Current layout: ${LAYOUT_LABELS[tileLayoutMode]} — ${activeLayoutDescription}",
    )
    expectSourceNotToContain("handleCycleTileLayout")
    expectSourceNotToContain("Next layout:")
  })

  it("only keeps the current-layout chip when adaptive layout state adds context beyond the selected button", () => {
    expectSourceToContain(
      "const [sessionGridMeasurements, setSessionGridMeasurements] = useState<",
    )
    expectSourceToContain(
      'Pick<SessionGridMeasurements, "containerWidth" | "gap">',
    )
    expectSourceToContain(
      "const handleSessionGridMeasurementsChange = useCallback(",
    )
    expectSourceToContain(
      "const isResponsiveStackedLayout = isResponsiveStackedTileLayout(",
    )
    expectSourceToContain("const showReorderHint =")
    expectSourceToContain(
      "canReorderTiles &&",
    )
    expectSourceToContain(
      "visibleTileCount > 1 &&",
    )
    expectSourceToContain(
      "!isResponsiveStackedLayout &&",
    )
    expectSourceToContain(
      "!showNearStackedLayoutHint",
    )
    expectSourceToContain("const usesAdaptiveLayoutDescription =")
    expectSourceToContain(
      "isTemporarySingleVisibleLayout || isResponsiveStackedLayout",
    )
    expectSourceToContain(
      "const activeLayoutDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const showCurrentLayoutChip = usesAdaptiveLayoutDescription",
    )
    expectSourceToContain(
      'const RESPONSIVE_STACKED_LAYOUT_DESCRIPTION = "Stacked to fit"',
    )
    expectSourceToContain(
      'const RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL = "Stacked"',
    )
    expectSourceToContain(
      "title={`Current layout: ${LAYOUT_LABELS[tileLayoutMode]} — ${activeLayoutDescription}`}",
    )
    expectSourceToContain(
      "onMeasurementsChange={handleSessionGridMeasurementsChange}",
    )
    expectSourceToContain(
      "const showLayoutDescriptionSuffix = !isCompactSessionHeader",
    )
    expectSourceToContain("const showCompactAdaptiveLayoutDescription =")
    expectSourceToContain("usesAdaptiveLayoutDescription &&")
    expectSourceToContain("isCompactSessionHeader &&")
    expectSourceToContain("!isVeryCompactSessionHeader")
    expectSourceToContain("showLayoutDescriptionSuffix ? (")
    expectSourceToContain("showCompactAdaptiveLayoutDescription ? (")
    expectSourceToContain("{activeLayoutDescription}")
    expectSourceToContain("{activeLayoutCompactDescription}")
  })

  it("packs collapsed tiles after expanded ones so open tiles reclaim the main grid space", () => {
    expectSourceToContain("const hasCollapsedVisibleTile = useMemo(")
    expectSourceToContain(
      "visibleProgressEntries.some(([sessionId]) => collapsedSessions[sessionId] ?? false)",
    )
    expectSourceToContain("const orderedVisibleProgressEntries = useMemo(() => {")
    expectSourceToContain("const expandedEntries: typeof visibleProgressEntries = []")
    expectSourceToContain("const collapsedEntries: typeof visibleProgressEntries = []")
    expectSourceToContain("return [...expandedEntries, ...collapsedEntries]")
    expectSourceToContain(
      "const canReorderTiles = !isFocusLayout && allProgressEntries.length > 1 && !hasCollapsedVisibleTile",
    )
    expectSourceToContain(
      "{orderedVisibleProgressEntries.map(([sessionId, progress], index) => {",
    )
  })

  it("adds a direct recovery hint when compare or grid is stacked by width pressure", () => {
    expectSourceToContain("const STACKED_LAYOUT_RECOVERY_HINTS: Record<")
    expectSourceToContain('fullLabel: "Make room to compare"')
    expectSourceToContain('compactLabel: "Make room"')
    expectSourceToContain('fullLabel: "Make room for grid"')
    expectSourceToContain(
      'title: "Compare view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to compare side by side again."',
    )
    expectSourceToContain(
      'title: "Grid view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to restore multiple columns."',
    )
    expectSourceToContain("const stackedLayoutRecoveryHint =")
    expectSourceToContain(
      'isResponsiveStackedLayout && tileLayoutMode !== "1x1"',
    )
    expectSourceToContain(
      "const showStackedLayoutRecoveryHint = !!stackedLayoutRecoveryHint",
    )
    expectSourceToContain(
      "const stackedLayoutRecoveryLabel = !showStackedLayoutRecoveryHint",
    )
    expectSourceToContain("stackedLayoutRecoveryHint.compactLabel")
    expectSourceToContain("stackedLayoutRecoveryHint.fullLabel")
    expectSourceToContain('"Make room"')
    expectSourceToContain("{showStackedLayoutRecoveryHint &&")
    expectSourceToContain("stackedLayoutRecoveryHint &&")
    expectSourceToContain("stackedLayoutRecoveryLabel && (")
    expectSourceToContain("title={stackedLayoutRecoveryHint.title}")
    expectSourceToContain("border-dashed border-blue-500/30 bg-blue-500/10")
  })

  it("warns before compare or grid actually stack and suppresses the lower-priority reorder hint in that tighter state", () => {
    expectSourceToContain(
      "const NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER = 96",
    )
    expectSourceToContain("const NEAR_STACKED_LAYOUT_HINTS: Record<")
    expectSourceToContain('fullLabel: "Close to stacking"')
    expectSourceToContain('compactLabel: "Tight fit"')
    expectSourceToContain(
      'title: "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep sessions side by side."',
    )
    expectSourceToContain("const nearStackedLayoutHint =")
    expectSourceToContain(
      "sessionGridMeasurements.containerWidth -",
    )
    expectSourceToContain(
      "NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER",
    )
    expectSourceToContain(
      "const showNearStackedLayoutHint = !!nearStackedLayoutHint",
    )
    expectSourceToContain(
      "const nearStackedLayoutHintLabel = !showNearStackedLayoutHint",
    )
    expectSourceToContain('isVeryCompactSessionHeader ? "Tight"')
    expectSourceToContain("nearStackedLayoutHint.compactLabel")
    expectSourceToContain("nearStackedLayoutHint.fullLabel")
    expectSourceToContain("{showNearStackedLayoutHint &&")
    expectSourceToContain("nearStackedLayoutHint &&")
    expectSourceToContain("nearStackedLayoutHintLabel && (")
    expectSourceToContain("title={nearStackedLayoutHint.title}")
    expectSourceToContain(
      'border-dashed border-amber-500/30 bg-amber-500/10 py-1 text-[11px] text-amber-700 dark:text-amber-300',
    )
    expectSourceToContain("<AlertTriangle className=\"h-3.5 w-3.5 shrink-0\" />")
    expectSourceToContain(
      "!isResponsiveStackedLayout &&\n    !showNearStackedLayoutHint",
    )
  })

  it("restores the last non-maximized layout when focus mode is toggled", () => {
    expectSourceToContain('if (nextMode === "1x1") {')
    expectSourceToContain("previousLayoutModeRef.current =")
    expectSourceToContain('tileLayoutMode === "1x1"')
    expectSourceToContain("const nextMode =")
    expectSourceToContain('? previousLayoutModeRef.current : "1x1"')
    expectSourceToContain(
      "const restoreLayoutMode = isFocusLayout ? previousLayoutModeRef.current : null",
    )
    expectSourceToContain("const restoreLayoutOption = restoreLayoutMode")
    expectSourceToContain(
      "const showSingleViewRestore = isFocusLayout && !!restoreLayoutOption",
    )
    expectSourceToContain(
      "const handleRestorePreviousLayout = useCallback(() => {",
    )
    expectSourceToContain(
      "handleSelectTileLayout(previousLayoutModeRef.current)",
    )
  })

  it("persists the selected layout and the previous non-single layout so layout switching restores predictably across remounts", () => {
    expectSourceToContain(
      'const TILE_LAYOUT_MODE_STORAGE_KEY = "dotagents-sessions-tile-layout-mode"',
    )
    expectSourceToContain("const PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY =")
    expectSourceToContain('"dotagents-sessions-previous-layout-mode"')
    expectSourceToContain("function loadPersistedTileLayoutPreference(): {")
    expectSourceToContain(
      "const storedCurrentLayoutMode = localStorage.getItem(",
    )
    expectSourceToContain(
      "const storedPreviousLayoutMode = localStorage.getItem(",
    )
    expectSourceToContain(
      "const [tileLayoutMode, setTileLayoutMode] = useState<TileLayoutMode>(",
    )
    expectSourceToContain(
      "initialTileLayoutPreferenceRef.current.currentLayoutMode",
    )
    expectSourceToContain(
      "const previousLayoutModeRef = useRef<RestorableTileLayoutMode>(",
    )
    expectSourceToContain(
      "initialTileLayoutPreferenceRef.current.previousLayoutMode",
    )
    expectSourceToContain(
      "persistTileLayoutPreference(nextMode, previousLayoutModeRef.current)",
    )
  })

  it("separates primary session actions from layout context so the toolbar wraps more predictably on narrow widths", () => {
    expectSourceToContain("bg-muted/20 flex-shrink-0 border-b px-3 py-2")
    expectSourceToContain(
      "border-border/50 mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2",
    )
    expectSourceToContain(
      'className="flex min-w-0 flex-1 flex-wrap items-center gap-1"',
    )
    expectSourceToContain(
      'className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"',
    )
    expectSourceToContain("const COMPACT_SESSION_HEADER_WIDTH = 760")
    expectSourceToContain("const TIGHT_SESSION_HEADER_WIDTH = 620")
    expectSourceToContain("const isCompactSessionHeader =")
    expectSourceToContain(
      "sessionGridMeasurements.containerWidth < COMPACT_SESSION_HEADER_WIDTH",
    )
    expectSourceToContain("const isVeryCompactSessionHeader =")
    expectSourceToContain(
      "sessionGridMeasurements.containerWidth < TIGHT_SESSION_HEADER_WIDTH",
    )
    expectSourceToContain("const showReorderHint =")
    expectSourceToContain(
      "canReorderTiles &&",
    )
    expectSourceToContain(
      "visibleTileCount > 1 &&",
    )
    expectSourceToContain(
      "!isResponsiveStackedLayout &&",
    )
    expectSourceToContain(
      "!showNearStackedLayoutHint",
    )
    expectSourceToContain(
      "const showLayoutButtonLabels = !isVeryCompactSessionHeader",
    )
    expectSourceToContain("const reorderHintLabel = isVeryCompactSessionHeader")
    expectSourceToContain('? "Reorder"')
    expectSourceToContain('showLayoutButtonLabels ? "gap-1 px-2" : "px-1.5"')
    expectSourceToContain('reorderHintLabel ? "px-2" : "px-1.5"')
  })

  it("keeps the single-view context chip session-centric so the layout label is not repeated next to the pager", () => {
    expectSourceToContain(
      "bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]",
    )
    expectSourceToContain("const showFocusedSessionLabel =")
    expectSourceToContain(
      "!!focusedLayoutSessionLabel && !isCompactSessionHeader",
    )
    expectSourceToContain("const showBrowsingSessionsLabel =")
    expectSourceToContain(
      "!focusedLayoutSessionLabel && !isCompactSessionHeader",
    )
    expectSourceToContain("text-muted-foreground/50 whitespace-nowrap")
    expectSourceToContain("text-muted-foreground/80 max-w-[220px] truncate")
    expectSourceToContain("Showing {focusedLayoutSessionLabel}")
    expectSourceToContain("Browsing sessions")
  })

  it("gives single view an explicit way back to the remembered multi-tile layout", () => {
    expectSourceToContain("{showSingleViewRestore && restoreLayoutOption && (")
    expectSourceToContain(
      "aria-label={`Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`}",
    )
    expectSourceToContain(
      "title={`Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`}",
    )
    expectSourceToContain(
      'showSingleViewRestoreLabel ? "gap-1 px-2" : "px-1.5"',
    )
    expectSourceToContain("{showSingleViewRestoreLabel ? (")
    expectSourceToContain(
      "<span>{`Back to ${restoreLayoutOption.label}`}</span>",
    )
  })

  it("describes narrow compare/grid fallbacks as stacked so the current-layout chip stays truthful under width pressure", () => {
    expectSourceToContain("isResponsiveStackedTileLayout")
    expectSourceToContain(
      "const isResponsiveStackedLayout = isResponsiveStackedTileLayout(",
    )
    expectSourceToContain(
      'const RESPONSIVE_STACKED_LAYOUT_DESCRIPTION = "Stacked to fit"',
    )
    expectSourceToContain(
      "const activeLayoutCompactDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "onMeasurementsChange={handleSessionGridMeasurementsChange}",
    )
  })

  it("clarifies when compare or grid is temporarily showing one expanded tile because only one session is visible", () => {
    expectSourceToContain("const TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION =")
    expectSourceToContain('"Expanded for one visible session"')
    expectSourceToContain(
      'const TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL = "One visible"',
    )
    expectSourceToContain("const isTemporarySingleVisibleLayout =")
    expectSourceToContain("!isFocusLayout && visibleTileCount === 1")
    expectSourceToContain("const usesAdaptiveLayoutDescription =")
    expectSourceToContain(
      "isTemporarySingleVisibleLayout || isResponsiveStackedLayout",
    )
    expectSourceToContain(
      "const activeLayoutDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const activeLayoutCompactDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain("showLayoutDescriptionSuffix ? (")
    expectSourceToContain("showCompactAdaptiveLayoutDescription ? (")
    expectSourceToContain("{activeLayoutCompactDescription}")
    expectSourceToContain("{activeLayoutDescription}")
  })
})
