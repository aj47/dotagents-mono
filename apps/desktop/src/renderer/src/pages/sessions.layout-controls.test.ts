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
    expectSourceToContain("const sessionTileLayoutButtonGroup = (")
    expectSourceToContain('role="group"')
    expectSourceToContain('aria-label="Session tile layout"')
    expectSourceToContain("const singleViewLayoutSwitchTitle =")
    expectSourceToContain('isFocusLayout && mode !== "1x1"')
    expectSourceToContain("singleViewRestoreFocusContext")
    expectSourceToContain("const isSingleViewRestoreTarget =")
    expectSourceToContain('restoreLayoutOption?.mode === mode')
    expectSourceToContain("aria-label={singleViewLayoutSwitchTitle}")
    expectSourceToContain("aria-pressed={tileLayoutMode === mode}")
    expectSourceToContain(
      "const showLayoutButtonLabels = !isVeryCompactSessionHeader",
    )
    expectSourceToContain("const reorderHintTitle =")
    expectSourceToContain(
      "const showCurrentLayoutChip = isTemporarySingleVisibleLayout",
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
      'Switch from Single view to ${LAYOUT_LABELS[mode]} and keep ${singleViewRestoreFocusContext}',
    )
    expectSourceToContain(
      'Return to ${LAYOUT_LABELS[mode]} (last tiled layout) and keep ${singleViewRestoreFocusContext}',
    )
    expectSourceToContain(
      'const promoteSingleViewRestoreTargetInLayoutGroup =',
    )
    expectSourceToContain("const showSingleViewRestoreTargetBadge =")
    expectSourceToContain(
      '(!showDedicatedSingleViewRestoreButton || !isCompactSessionHeader)',
    )
    expectSourceToContain(
      'const singleViewRestoreTargetBadgeLabel = !showSingleViewRestoreTargetBadge',
    )
    expectSourceToContain(
      'isCompactSessionHeader ? "Back" : "Back target"',
    )
    expectSourceToContain(
      '"bg-background text-foreground/90 shadow-sm ring-1 ring-inset ring-border/60 hover:bg-background"',
    )
    expectSourceToContain(
      '"bg-blue-500/10 text-blue-700 shadow-sm ring-1 ring-inset ring-blue-500/30 hover:bg-blue-500/15 dark:text-blue-300"',
    )
    expectSourceToContain(
      '{singleViewRestoreTargetBadgeLabel ? (',
    )
    expectSourceToContain('Back target')
    expectSourceToContain(
      "Current layout: ${LAYOUT_LABELS[tileLayoutMode]} — ${activeLayoutDescription}",
    )
    expectSourceToContain(
      '"Drag a session tile\'s reorder handle onto another tile to place it before that session, drag below the last tile to move it to the end, or focus a handle and use arrow keys to move it earlier or later"',
    )
    expectSourceToContain('? "Move"')
    expectSourceToContain(': "Drag or use arrows"')
    expectSourceNotToContain("handleCycleTileLayout")
    expectSourceNotToContain("Next layout:")
  })

  it("only keeps the current-layout chip for the temporary one-visible-session case so stacked recovery states stay less cluttered", () => {
    expectSourceToContain(
      "const [sessionGridMeasurements, setSessionGridMeasurements] = useState<",
    )
    expectSourceToContain('SessionGridMeasurements')
    expectSourceToContain('containerHeight: 0,')
    expectSourceToContain(
      "const handleSessionGridMeasurementsChange = useCallback(",
    )
    expectSourceToContain(
      '({ containerWidth, containerHeight, gap }: SessionGridMeasurements) => {',
    )
    expectSourceToContain(
      'previous.containerHeight === containerHeight &&',
    )
    expectSourceToContain(
      'return { containerWidth, containerHeight, gap }',
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
    expectSourceToContain(
      "const activeLayoutDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const showCurrentLayoutChip = isTemporarySingleVisibleLayout",
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
      "const showLayoutDescriptionSuffix = showCurrentLayoutChip && !isCompactSessionHeader",
    )
    expectSourceToContain("const showCompactAdaptiveLayoutDescription =")
    expectSourceToContain("showCurrentLayoutChip &&")
    expectSourceToContain("isCompactSessionHeader &&")
    expectSourceToContain("!isVeryCompactSessionHeader")
    expectSourceToContain("showLayoutDescriptionSuffix ? (")
    expectSourceToContain("showCompactAdaptiveLayoutDescription ? (")
    expectSourceToContain("{activeLayoutDescription}")
    expectSourceToContain("{activeLayoutCompactDescription}")
  })

  it("adds a direct recovery hint when compare or grid is stacked by width pressure", () => {
    expectSourceToContain("const STACKED_LAYOUT_RECOVERY_HINTS: Record<")
    expectSourceToContain("getResponsiveStackedLayoutWidthShortfall")
    expectSourceToContain('fullLabel: "Make room to compare"')
    expectSourceToContain('compactLabel: "Make room"')
    expectSourceToContain('fullLabel: "Make room for grid"')
    expectSourceToContain(
      'title: "Compare view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to compare side by side again."',
    )
    expectSourceToContain(
      'title: "Grid view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to restore multiple columns."',
    )
    expectSourceToContain(
      'titleWithoutPanelRecovery: "Compare view stacked to fit. Widen the sessions area or narrow the sidebar to compare side by side again."',
    )
    expectSourceToContain(
      'titleWithoutPanelRecovery: "Grid view stacked to fit. Widen the sessions area or narrow the sidebar to restore multiple columns."',
    )
    expectSourceToContain("const stackedLayoutRecoveryHint =")
    expectSourceToContain(
      'isResponsiveStackedLayout && tileLayoutMode !== "1x1"',
    )
    expectSourceToContain(
      "const showStackedLayoutRecoveryHint = !!stackedLayoutRecoveryHint",
    )
    expectSourceToContain(
      "const showPassiveStackedLayoutRecoveryHint =\n    showStackedLayoutRecoveryHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader",
    )
    expectSourceToContain(
      "const stackedLayoutRecoveryLabel = !showStackedLayoutRecoveryHint",
    )
    expectSourceToContain("stackedLayoutRecoveryHint.compactLabel")
    expectSourceToContain("stackedLayoutRecoveryHint.fullLabel")
    expectSourceToContain('"Make room"')
    expectSourceToContain("const stackedLayoutRecoveryWidthGap = showStackedLayoutRecoveryHint")
    expectSourceToContain("const stackedLayoutRecoveryWidthGapLabel =")
    expectSourceToContain('`Need ${stackedLayoutRecoveryWidthGap}px`')
    expectSourceToContain("{showPassiveStackedLayoutRecoveryHint &&")
    expectSourceToContain("stackedLayoutRecoveryHint &&")
    expectSourceToContain("stackedLayoutRecoveryLabel && (")
    expectSourceToContain("{stackedLayoutRecoveryWidthGapLabel ? (")
    expectSourceToContain("{stackedLayoutRecoveryWidthGapLabel}")
    expectSourceToContain("const stackedLayoutRecoveryTitle = !showStackedLayoutRecoveryHint ||")
    expectSourceToContain("stackedLayoutRecoveryHint.titleWithoutPanelRecovery")
    expectSourceToContain(
      "title={stackedLayoutRecoveryTitle ?? stackedLayoutRecoveryHint.title}",
    )
    expectSourceToContain("border-dashed border-blue-500/30 bg-blue-500/10")
  })

  it("briefly explains when compare or grid lose width resizing because the sessions area just stacked", () => {
    expectSourceToContain(
      "const RECENT_WIDTH_LOCK_HINT_DURATION_MS = 2_400",
    )
    expectSourceToContain("function getResponsiveWidthLockHintTitle(")
    expectSourceToContain(
      '"Compare view stacked to fit. Tile width now follows the stacked layout, so drag a tile\'s bottom edge to resize height or widen the sessions area to resize width again."',
    )
    expectSourceToContain(
      '"Grid view stacked to fit. Tile width now follows the stacked layout, so drag a tile\'s bottom edge to resize height or widen the sessions area to resize width again."',
    )
    expectSourceToContain(
      'const [recentWidthLockHintLayoutMode, setRecentWidthLockHintLayoutMode] =',
    )
    expectSourceToContain(
      "const recentWidthLockHintTimeoutRef = useRef<number | null>(null)",
    )
    expectSourceToContain("const lastResponsiveStackedLayoutRef = useRef(false)")
    expectSourceToContain(
      "const hasObservedResponsiveStackedLayoutRef = useRef(false)",
    )
    expectSourceToContain("const clearRecentWidthLockHint = useCallback(() => {")
    expectSourceToContain("const showRecentWidthLockHint = useCallback(")
    expectSourceToContain(
      "currentLayoutMode === layoutMode ? null : currentLayoutMode",
    )
    expectSourceToContain(
      "tileLayoutMode === \"1x1\" ||\n      visibleTileCount < 2 ||\n      sessionGridMeasurements.containerWidth <= 0",
    )
    expectSourceToContain(
      "if (isResponsiveStackedLayout && !previousResponsiveStackedLayout) {\n      showRecentWidthLockHint(tileLayoutMode)",
    )
    expectSourceToContain(
      "const showRecentResponsiveWidthLockHint =\n    recentWidthLockHintLayoutMode !== null &&\n    tileLayoutMode !== \"1x1\" &&\n    recentWidthLockHintLayoutMode === tileLayoutMode &&\n    isResponsiveStackedLayout",
    )
    expectSourceToContain(
      "const recentResponsiveWidthLockHintLabel =\n    !showRecentResponsiveWidthLockHint\n      ? null\n      : isCompactSessionHeader\n        ? \"Width fixed\"\n        : \"Width follows stacked layout\"",
    )
    expectSourceToContain(
      "const recentResponsiveWidthLockHintActionLabel =\n    !showRecentResponsiveWidthLockHint || isVeryCompactSessionHeader\n      ? null\n      : isCompactSessionHeader\n        ? \"Bottom edge\"\n        : \"Use bottom edge\"",
    )
    expectSourceToContain(
      "showRecentResponsiveWidthLockHint ||\n    showPassivePanelAtMinimumWidthLayoutPressureHint",
    )
    expectSourceToContain(
      '{showRecentResponsiveWidthLockHint &&\n                recentResponsiveWidthLockHintLabel && (',
    )
    expectSourceToContain('role="status"')
    expectSourceToContain('aria-live="polite"')
    expectSourceToContain(
      'title={recentResponsiveWidthLockHintTitle ?? undefined}',
    )
    expectSourceToContain(
      'border-blue-500/20 bg-background/85 flex max-w-full items-center gap-1.5 rounded-md border py-1 text-[11px] text-blue-700/90 shadow-sm dark:text-blue-200',
    )
    expectSourceToContain('{recentResponsiveWidthLockHintLabel}')
    expectSourceToContain('{recentResponsiveWidthLockHintActionLabel}')
  })

  it("announces stacked and near-stacked layout-pressure transitions through a shared live region", () => {
    expectSourceToContain(
      'type LayoutPressureAnnouncementState = "stable" | "near" | "stacked"',
    )
    expectSourceToContain("function getLayoutPressureAnnouncement(")
    expectSourceToContain(
      '"Compare view stacked to fit. Tile width now follows the stacked layout."',
    )
    expectSourceToContain(
      '"Grid view stacked to fit. Tile width now follows the stacked layout."',
    )
    expectSourceToContain(
      '"Compare view is side by side again, but still close to stacking."',
    )
    expectSourceToContain(
      '"Grid view has multiple columns again, but is still close to stacking."',
    )
    expectSourceToContain(
      '"Compare view is close to stacking. Make room to keep sessions side by side."',
    )
    expectSourceToContain(
      '"Grid view is close to stacking. Make room to keep multiple columns visible."',
    )
    expectSourceToContain(
      '"Compare view has room again for side-by-side sessions."',
    )
    expectSourceToContain(
      '"Grid view has room again for multiple columns."',
    )
    expectSourceToContain(
      'const [layoutPressureAnnouncement, setLayoutPressureAnnouncement] = useState("")',
    )
    expectSourceToContain(
      'const lastLayoutPressureAnnouncementStateRef =\n    useRef<LayoutPressureAnnouncementState>("stable")',
    )
    expectSourceToContain(
      'const hasObservedLayoutPressureAnnouncementRef = useRef(false)',
    )
    expectSourceToContain(
      'tileLayoutMode === "1x1" ||\n      visibleTileCount < 2 ||\n      sessionGridMeasurements.containerWidth <= 0',
    )
    expectSourceToContain(
      'const nextLayoutPressureAnnouncementState = showStackedLayoutRecoveryHint\n      ? "stacked"\n      : showNearStackedLayoutHint\n        ? "near"\n        : "stable"',
    )
    expectSourceToContain(
      'if (!hasObservedLayoutPressureAnnouncementRef.current) {',
    )
    expectSourceToContain(
      'if (previousLayoutPressureAnnouncementState === nextLayoutPressureAnnouncementState) {',
    )
    expectSourceToContain('setLayoutPressureAnnouncement(')
    expectSourceToContain('getLayoutPressureAnnouncement(')
    expectSourceToContain('{layoutPressureAnnouncement}')
    expectSourceToContain(
      '<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">',
    )
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
    expectSourceToContain(
      'titleWithoutPanelRecovery: "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area or narrow the sidebar to keep sessions side by side."',
    )
    expectSourceToContain(
      'titleWithoutPanelRecovery: "Grid view will stack if the sessions area gets a little narrower. Widen the sessions area or narrow the sidebar to keep multiple columns visible."',
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
    expectSourceToContain("const nearStackedLayoutWidthGap = showNearStackedLayoutHint")
    expectSourceToContain("const nearStackedLayoutWidthGapLabel =")
    expectSourceToContain('`Need ${nearStackedLayoutWidthGap}px`')
    expectSourceToContain(
      "const showPassiveNearStackedLayoutHint =\n    showNearStackedLayoutHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader",
    )
    expectSourceToContain(
      "const nearStackedLayoutHintLabel = !showNearStackedLayoutHint",
    )
    expectSourceToContain('isVeryCompactSessionHeader ? "Tight"')
    expectSourceToContain("nearStackedLayoutHint.compactLabel")
    expectSourceToContain("nearStackedLayoutHint.fullLabel")
    expectSourceToContain("{showPassiveNearStackedLayoutHint &&")
    expectSourceToContain("nearStackedLayoutHint &&")
    expectSourceToContain("nearStackedLayoutHintLabel && (")
    expectSourceToContain("{nearStackedLayoutWidthGapLabel ? (")
    expectSourceToContain("{nearStackedLayoutWidthGapLabel}")
    expectSourceToContain("const nearStackedLayoutHintTitle = !showNearStackedLayoutHint || !nearStackedLayoutHint")
    expectSourceToContain("nearStackedLayoutHint.titleWithoutPanelRecovery")
    expectSourceToContain(
      "title={nearStackedLayoutHintTitle ?? nearStackedLayoutHint.title}",
    )
    expectSourceToContain(
      'border-dashed border-amber-500/30 bg-amber-500/10 py-1 text-[11px] text-amber-700 dark:text-amber-300',
    )
    expectSourceToContain("<AlertTriangle className=\"h-3.5 w-3.5 shrink-0\" />")
    expectSourceToContain(
      "!isResponsiveStackedLayout &&\n    !showNearStackedLayoutHint",
    )
  })

  it("keeps hide-panel recovery as a last resort when smaller width fixes already restore tiled layouts", () => {
    expectSourceToContain('import { SIDEBAR_DIMENSIONS } from "@renderer/hooks/use-sidebar"')
    expectSourceToContain('PanelLeftClose,')
    expectSourceToContain("type PanelLayoutPressureState = PanelSize & {")
    expectSourceToContain("const isPanelLayoutPressureState = (")
    expectSourceToContain(
      'const [panelLayoutPressureState, setPanelLayoutPressureState] =',
    )
    expectSourceToContain(
      'const syncPanelLayoutPressureState = useCallback(async () => {',
    )
    expectSourceToContain("tipcClient.getFloatingPanelLayoutState()")
    expectSourceToContain('throw new Error("Floating panel state unavailable")')
    expectSourceToContain(
      "const unlistenPanelSizeChanged = rendererHandlers.onPanelSizeChanged.listen(",
    )
    expectSourceToContain(
      "rendererHandlers.onFloatingPanelLayoutStateChanged.listen(",
    )
    expectSourceToContain(
      '"Failed to read floating panel state for tiled-session recovery:"',
    )
    expectSourceToContain(
      'const canShrinkPanelForLayoutPressure =',
    )
    expectSourceToContain("panelLayoutPressureState.isVisible &&")
    expectSourceToContain(
      "panelLayoutPressureState.width > panelLayoutPressureState.minWidth + 0.5",
    )
    expectSourceToContain(
      'const panelWidthGainFromShrinkingForLayoutPressure =',
    )
    expectSourceToContain(
      'const sessionGridWidthAfterShrinkingPanelForLayoutPressure =',
    )
    expectSourceToContain(
      'const shouldMentionPanelInLayoutPressureCopy =',
    )
    expectSourceToContain(
      "const showShrinkPanelForLayoutPressure =\n    (showStackedLayoutRecoveryHint || showNearStackedLayoutHint) &&\n    canShrinkPanelForLayoutPressure",
    )
    expectSourceToContain(
      'const showHidePanelForStackedLayoutPressure =\n    showStackedLayoutRecoveryHint && !!panelLayoutPressureState?.isVisible',
    )
    expectSourceToContain(
      'const canResolveStackedLayoutPressureByShrinkingPanel =',
    )
    expectSourceToContain(
      'const canResolveStackedLayoutPressureByShrinkingPanel =\n    showStackedLayoutRecoveryHint &&\n    panelWidthGainFromShrinkingForLayoutPressure > 0 &&\n    !isResponsiveStackedTileLayout(\n      sessionGridWidthAfterShrinkingPanelForLayoutPressure,',
    )
    expectSourceToContain(
      'const canResolveStackedLayoutPressureByHidingPanel =\n    showHidePanelForStackedLayoutPressure &&\n    !!panelLayoutPressureState?.isVisible &&\n    !isResponsiveStackedTileLayout(\n      sessionGridMeasurements.containerWidth + panelLayoutPressureState.width,',
    )
    expectSourceToContain(
      'const canResolveNearStackedLayoutPressureByShrinkingPanel =',
    )
    expectSourceToContain(
      'sessionGridWidthAfterShrinkingPanelForLayoutPressure -\n          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER',
    )
    expectSourceToContain(
      'const showHidePanelForNearStackedLayoutPressure =',
    )
    expectSourceToContain(
      'const canResolveNearStackedLayoutPressureByHidingPanel =',
    )
    expectSourceToContain(
      'const canCollapseSidebarForLayoutPressure =\n    !!collapseSidebar &&\n    typeof sidebarWidth === "number" &&\n    sidebarWidth > SIDEBAR_DIMENSIONS.width.collapsed + 0.5',
    )
    expectSourceToContain(
      'const sidebarWidthGainFromCollapsingForLayoutPressure =',
    )
    expectSourceToContain(
      'const sessionGridWidthAfterCollapsingSidebarForLayoutPressure =',
    )
    expectSourceToContain(
      'const canResolveStackedLayoutPressureByCollapsingSidebar =',
    )
    expectSourceToContain(
      'const canResolveNearStackedLayoutPressureByCollapsingSidebar =',
    )
    expectSourceToContain(
      'sessionGridMeasurements.containerWidth +\n          panelLayoutPressureState.width -\n          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER',
    )
    expectSourceToContain(
      '!canResolveNearStackedLayoutPressureByShrinkingPanel',
    )
    expectSourceToContain(
      'const showHidePanelForNearStackedLayoutPressure =\n    showNearStackedLayoutHint &&\n    !!panelLayoutPressureState?.isVisible &&\n    (!canShrinkPanelForLayoutPressure ||\n      !canResolveNearStackedLayoutPressureByShrinkingPanel)',
    )
    expectSourceToContain(
      'const showHidePanelForLayoutPressure =\n    showHidePanelForStackedLayoutPressure ||\n    showHidePanelForNearStackedLayoutPressure',
    )
    expectSourceToContain(
      'const showCollapseSidebarForLayoutPressure =\n    canCollapseSidebarForLayoutPressure &&\n    (showStackedLayoutRecoveryHint',
    )
    expectSourceToContain(
      'const hasLessDisruptiveLayoutPressureRecoveryAction =\n    prioritizeShrinkPanelForLayoutPressure || prioritizeCollapseSidebarForLayoutPressure',
    )
    expectSourceToContain(
      'const showHidePanelForLayoutPressureAction =\n    showHidePanelForLayoutPressure &&\n    (!hasLessDisruptiveLayoutPressureRecoveryAction || prioritizeHidePanelForLayoutPressure)',
    )
    expectSourceToContain(
      'const showPanelAtMinimumWidthLayoutPressureHint =\n    showHidePanelForLayoutPressureAction &&\n    !!panelLayoutPressureState?.isVisible &&\n    !canShrinkPanelForLayoutPressure',
    )
    expectSourceToContain(
      'const panelAtMinimumWidthLayoutPressureLabel =',
    )
    expectSourceToContain('isVeryCompactSessionHeader ? "Min width"')
    expectSourceToContain('isCompactSessionHeader\n          ? "Panel min width"')
    expectSourceToContain(
      'const panelAtMinimumWidthLayoutPressureTitle =',
    )
    expectSourceToContain(
      '"The floating panel is already at its minimum width, so shrinking it will not free more room for tiled sessions. Hide the panel if you need additional width."',
    )
    expectSourceToContain(
      'const showPassivePanelAtMinimumWidthLayoutPressureHint =\n    showPanelAtMinimumWidthLayoutPressureHint && isVeryCompactSessionHeader',
    )
    expectSourceToContain(
      'const prioritizeShrinkPanelForLayoutPressure =\n    showShrinkPanelForLayoutPressure &&\n    (showStackedLayoutRecoveryHint\n      ? canResolveStackedLayoutPressureByShrinkingPanel\n      : showNearStackedLayoutHint\n        ? canResolveNearStackedLayoutPressureByShrinkingPanel\n        : false)',
    )
    expectSourceToContain(
      'const prioritizeCollapseSidebarForLayoutPressure =\n    showCollapseSidebarForLayoutPressure && !prioritizeShrinkPanelForLayoutPressure',
    )
    expectSourceToContain(
      'const prioritizeHidePanelForLayoutPressure =\n    showHidePanelForLayoutPressure &&\n    (showStackedLayoutRecoveryHint\n      ? showHidePanelForStackedLayoutPressure &&\n        canResolveStackedLayoutPressureByHidingPanel &&\n        !prioritizeShrinkPanelForLayoutPressure &&\n        !prioritizeCollapseSidebarForLayoutPressure\n      : showNearStackedLayoutHint\n        ? canResolveNearStackedLayoutPressureByHidingPanel &&\n          !canResolveNearStackedLayoutPressureByShrinkingPanel &&\n          !canResolveNearStackedLayoutPressureByCollapsingSidebar\n        : false)',
    )
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureRecoveryWidth =',
    )
    expectSourceToContain(
      'Math.round(panelWidthGainFromShrinkingForLayoutPressure)',
    )
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureRecoveryLabel =',
    )
    expectSourceToContain(
      'shrinkPanelForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader',
    )
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureRecoveryDetail =',
    )
    expectSourceToContain(
      '` Frees about ${shrinkPanelForLayoutPressureRecoveryWidth}px of session width.`',
    )
    expectSourceToContain(
      'const hidePanelForLayoutPressureRecoveryWidth =',
    )
    expectSourceToContain(
      'Math.round(panelLayoutPressureState.width)',
    )
    expectSourceToContain(
      'const hidePanelForLayoutPressureRecoveryLabel =',
    )
    expectSourceToContain(
      'hidePanelForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader',
    )
    expectSourceToContain(
      'const hidePanelForLayoutPressureRecoveryDetail =',
    )
    expectSourceToContain(
      '` Frees about ${hidePanelForLayoutPressureRecoveryWidth}px of session width.`',
    )
    expectSourceToContain(
      'const collapseSidebarForLayoutPressureRecoveryWidth =',
    )
    expectSourceToContain(
      'const collapseSidebarForLayoutPressureRecoveryLabel =',
    )
    expectSourceToContain(
      'const collapseSidebarForLayoutPressureRecoveryDetail =',
    )
    expectSourceToContain(
      'const prioritizedLayoutPressureOutcomeLabel =',
    )
    expectSourceToContain('prioritizeCollapseSidebarForLayoutPressure ||')
    expectSourceToContain('isCompactSessionHeader')
    expectSourceToContain(
      'tileLayoutMode === "1x2"',
    )
    expectSourceToContain('"Restores side by side"')
    expectSourceToContain('"Restores columns"')
    expectSourceToContain('showNearStackedLayoutHint')
    expectSourceToContain('"Keeps side by side"')
    expectSourceToContain('"Keeps columns"')
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureLabel = !showShrinkPanelForLayoutPressure',
    )
    expectSourceToContain('isVeryCompactSessionHeader ? "Shrink" : "Shrink panel"')
    expectSourceToContain('"Shrink panel"')
    expectSourceToContain(
      'const hidePanelForLayoutPressureLabel = !showHidePanelForLayoutPressureAction',
    )
    expectSourceToContain('isVeryCompactSessionHeader ? "Hide" : "Hide panel"')
    expectSourceToContain('"Hide panel"')
    expectSourceToContain(
      'const collapseSidebarForLayoutPressureLabel = !showCollapseSidebarForLayoutPressure',
    )
    expectSourceToContain('isVeryCompactSessionHeader\n      ? "Sidebar"\n      : "Collapse sidebar"')
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureTitle =\n    (showStackedLayoutRecoveryHint',
    )
    expectSourceToContain(
      'canResolveStackedLayoutPressureByShrinkingPanel',
    )
    expectSourceToContain(
      'tileLayoutMode === "1x2"',
    )
    expectSourceToContain(
      '"Shrink the floating panel width to restore side-by-side tiled sessions."',
    )
    expectSourceToContain(
      '"Shrink the floating panel width to restore multiple tiled columns."',
    )
    expectSourceToContain(
      '"Shrink the floating panel width to restore more room for tiled sessions."',
    )
    expectSourceToContain(
      'prioritizeShrinkPanelForLayoutPressure\n          ? prioritizedLayoutPressureActionClassName\n          : secondaryLayoutPressureActionClassName',
    )
    expectSourceToContain(
      'canResolveNearStackedLayoutPressureByShrinkingPanel',
    )
    expectSourceToContain(
      '"Shrink the floating panel width to keep tiled sessions from stacking."',
    )
    expectSourceToContain(
      '"Shrink the floating panel width to give tiled sessions a bit more room, though hiding it will clear the warning more reliably."',
    )
    expectSourceToContain('shrinkPanelForLayoutPressureRecoveryDetail')
    expectSourceToContain(
      'const hidePanelForLayoutPressureTitle =\n    (showStackedLayoutRecoveryHint',
    )
    expectSourceToContain('canResolveStackedLayoutPressureByHidingPanel')
    expectSourceToContain('canResolveNearStackedLayoutPressureByHidingPanel')
    expectSourceToContain(
      'const hidePanelForLayoutPressureOnlyRemainingActionDetail =',
    )
    expectSourceToContain(
      '" The floating panel is already at minimum width, so hiding it is the only remaining panel recovery action."',
    )
    expectSourceToContain(
      'hidePanelForLayoutPressureOnlyRemainingActionDetail +',
    )
    expectSourceToContain(
      '"Hide the floating panel entirely to restore the most room for tiled sessions."',
    )
    expectSourceToContain(
      '"Hide the floating panel entirely to restore side-by-side tiled sessions."',
    )
    expectSourceToContain(
      '"Hide the floating panel entirely to restore multiple tiled columns."',
    )
    expectSourceToContain(
      '"Hide the floating panel to keep tiled sessions from stacking."',
    )
    expectSourceToContain(
      '"Hide the floating panel to give tiled sessions more room, though the tight-fit warning may remain."',
    )
    expectSourceToContain('hidePanelForLayoutPressureRecoveryDetail')
    expectSourceToContain(
      'const collapseSidebarForLayoutPressureTitle =\n    (showStackedLayoutRecoveryHint',
    )
    expectSourceToContain(
      '"Collapse the sidebar to restore side-by-side tiled sessions."',
    )
    expectSourceToContain(
      '"Collapse the sidebar to restore multiple tiled columns."',
    )
    expectSourceToContain(
      '"Collapse the sidebar to keep tiled sessions side by side."',
    )
    expectSourceToContain(
      '"Collapse the sidebar to keep multiple tiled columns visible."',
    )
    expectSourceToContain('collapseSidebarForLayoutPressureRecoveryDetail')
    expectSourceToContain(
      "const handleShrinkPanelForLayoutPressure = useCallback(async () => {",
    )
    expectSourceToContain("if (isShrinkingPanelForLayoutPressure) return")
    expectSourceToContain("await Promise.all([");
    expectSourceToContain("tipcClient.getPanelSize()")
    expectSourceToContain("tipcClient.getPanelMode()")
    expectSourceToContain('throw new Error("Panel size unavailable")')
    expectSourceToContain('width: 0')
    expectSourceToContain('resizeAnchor: "left"')
    expectSourceToContain("tipcClient.savePanelModeSize({")
    expectSourceToContain(
      'console.error(\n        "Failed to shrink floating panel for tiled sessions:",',
    )
    expectSourceToContain('toast.error("Couldn\'t shrink the floating panel")')
    expectSourceToContain(
      "const handleHidePanelForLayoutPressure = useCallback(async () => {",
    )
    expectSourceToContain("if (isHidingPanelForLayoutPressure) return")
    expectSourceToContain("await tipcClient.hidePanelWindow({})")
    expectSourceToContain(
      'console.error(\n        "Failed to hide floating panel for tiled sessions:",',
    )
    expectSourceToContain('toast.error("Couldn\'t hide the floating panel")')
    expectSourceToContain(
      'const secondaryLayoutPressureActionClassName =',
    )
    expectSourceToContain(
      'const prioritizedLayoutPressureActionClassName =',
    )
    expectSourceToContain(
      'const prioritizedLayoutPressureOutcomeClassName =',
    )
    expectSourceToContain(
      '"border-blue-500/35 bg-blue-500/10 text-blue-700 shadow-sm hover:border-blue-500/45 hover:bg-blue-500/15 hover:text-blue-800 h-7 border text-[11px] dark:text-blue-300 dark:hover:text-blue-200"',
    )
    expectSourceToContain(
      '"rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300"',
    )
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureButton = showShrinkPanelForLayoutPressure ? (',
    )
    expectSourceToContain(
      'const collapseSidebarForLayoutPressureButton =\n    showCollapseSidebarForLayoutPressure && collapseSidebar ? (',
    )
    expectSourceToContain('<PanelLeftClose className="h-3.5 w-3.5 shrink-0" />')
    expectSourceToContain(
      'const hidePanelForLayoutPressureButton = showHidePanelForLayoutPressureAction ? (',
    )
    expectSourceToContain(
      'prioritizeHidePanelForLayoutPressure\n          ? prioritizedLayoutPressureActionClassName\n          : secondaryLayoutPressureActionClassName',
    )
    expectSourceToContain('const layoutPressureActionButtons = [')
    expectSourceToContain('key: "collapse-sidebar"')
    expectSourceToContain('.sort((a, b) => Number(b.isPrioritized) - Number(a.isPrioritized))')
    expectSourceToContain(
      'onClick={handleShrinkPanelForLayoutPressure}',
    )
    expectSourceToContain(
      'onClick={handleHidePanelForLayoutPressure}',
    )
    expectSourceToContain('onClick={collapseSidebar}')
    expectSourceToContain(
      'disabled={isShrinkingPanelForLayoutPressure}',
    )
    expectSourceToContain(
      'disabled={isHidingPanelForLayoutPressure}',
    )
    expectSourceToContain(
      'aria-label={shrinkPanelForLayoutPressureTitle}',
    )
    expectSourceToContain(
      'aria-label={hidePanelForLayoutPressureTitle}',
    )
    expectSourceToContain(
      '{showPassivePanelAtMinimumWidthLayoutPressureHint &&\n                panelAtMinimumWidthLayoutPressureLabel && (',
    )
    expectSourceToContain(
      'title={panelAtMinimumWidthLayoutPressureTitle ?? undefined}',
    )
    expectSourceToContain(
      '{panelAtMinimumWidthLayoutPressureLabel}',
    )
    expectSourceToContain('<ChevronsLeft className="h-3.5 w-3.5 shrink-0" />')
    expectSourceToContain('<EyeOff className="h-3.5 w-3.5 shrink-0" />')
    expectSourceToContain('<Loader2 className="h-3.5 w-3.5 animate-spin" />')
    expectSourceToContain(
      '<span>{shrinkPanelForLayoutPressureLabel}</span>',
    )
    expectSourceToContain(
      '{prioritizeShrinkPanelForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (',
    )
    expectSourceToContain(
      ') : shrinkPanelForLayoutPressureRecoveryLabel ? (',
    )
    expectSourceToContain('className={prioritizedLayoutPressureOutcomeClassName}')
    expectSourceToContain('{layoutPressureOutcomeBadgeLabel}')
    expectSourceToContain(
      '<span className="border-border/60 bg-background/70 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">',
    )
    expectSourceToContain('{shrinkPanelForLayoutPressureRecoveryLabel}')
    expectSourceToContain(
      '<span>{hidePanelForLayoutPressureLabel}</span>',
    )
    expectSourceToContain(
      '{prioritizeHidePanelForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (',
    )
    expectSourceToContain(
      ') : hidePanelForLayoutPressureRecoveryLabel ? (',
    )
    expectSourceToContain('{hidePanelForLayoutPressureRecoveryLabel}')
    expectSourceToContain(
      '{prioritizeCollapseSidebarForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (',
    )
    expectSourceToContain(
      ') : collapseSidebarForLayoutPressureRecoveryLabel ? (',
    )
    expectSourceToContain('{collapseSidebarForLayoutPressureRecoveryLabel}')
  })

  it("keeps compact compare/grid panel-recovery actions quantitative while still dropping width badges on very tight headers", () => {
    expectSourceToContain("const isVeryCompactSessionHeader =")
    expectSourceToContain(
      "sessionGridMeasurements.containerWidth < TIGHT_SESSION_HEADER_WIDTH",
    )
    expectSourceToContain(
      'const shrinkPanelForLayoutPressureRecoveryLabel =\n    shrinkPanelForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader',
    )
    expectSourceToContain(
      'const hidePanelForLayoutPressureRecoveryLabel =\n    hidePanelForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader',
    )
    expectSourceToContain(
      ') : shrinkPanelForLayoutPressureRecoveryLabel ? (',
    )
    expectSourceToContain(
      ') : hidePanelForLayoutPressureRecoveryLabel ? (',
    )
    expectSourceToContain('{shrinkPanelForLayoutPressureRecoveryLabel}')
    expectSourceToContain('{hidePanelForLayoutPressureRecoveryLabel}')
  })

  it("lets very tight compare/grid headers keep a tiny semantic outcome cue on the prioritized panel-recovery action after width math drops away", () => {
    expectSourceToContain(
      'const compactPrioritizedLayoutPressureOutcomeLabel =',
    )
    expectSourceToContain(
      'const compactPrioritizedLayoutPressureOutcomeLabel =\n    !isVeryCompactSessionHeader\n      ? null',
    )
    expectSourceToContain('showStackedLayoutRecoveryHint')
    expectSourceToContain('? "Restore"')
    expectSourceToContain('showNearStackedLayoutHint')
    expectSourceToContain('? "Keep"')
    expectSourceToContain(
      'const layoutPressureOutcomeBadgeLabel =\n    prioritizedLayoutPressureOutcomeLabel ??\n    compactPrioritizedLayoutPressureOutcomeLabel',
    )
    expectSourceToContain(
      '{prioritizeShrinkPanelForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (',
    )
    expectSourceToContain(
      '{prioritizeHidePanelForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (',
    )
    expectSourceToContain('{layoutPressureOutcomeBadgeLabel}')
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

  it("lets compact tiled-session headers keep controls first while passive layout context falls onto its own row", () => {
    expectSourceToContain("bg-muted/20 flex-shrink-0 border-b px-3 py-2")
    expectSourceToContain(
      "border-border/50 mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2",
    )
    expectSourceToContain(
      "const hasCompactSessionHeaderMeta =",
    )
    expectSourceToContain(
      "showRecentSingleViewRestoreAdjustmentHint ||",
    )
    expectSourceToContain(
      "const shouldHidePassiveLayoutPressureHintChipsOnCompactHeader =\n    isCompactSessionHeader &&\n    (showShrinkPanelForLayoutPressure ||\n      showCollapseSidebarForLayoutPressure ||\n      showHidePanelForLayoutPressureAction)",
    )
    expectSourceToContain(
      'const shouldHidePassiveNearStackedLayoutHint =',
    )
    expectSourceToContain(
      "showCurrentLayoutChip ||",
    )
    expectSourceToContain(
      "showPassiveStackedLayoutRecoveryHint ||",
    )
    expectSourceToContain(
      "showPassiveNearStackedLayoutHint ||",
    )
    expectSourceToContain(
      "showPassivePanelAtMinimumWidthLayoutPressureHint ||",
    )
    expectSourceToContain(
      "showFocusedLayoutSummaryChip ||",
    )
    expectSourceToContain("const showFocusedLayoutSummaryChip =")
    expectSourceToContain(
      'const shouldSplitSessionHeaderRows =\n    isCompactSessionHeader && hasCompactSessionHeaderMeta',
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
    expectSourceToContain('? "Move"')
    expectSourceToContain('? "Reorder"')
    expectSourceToContain('showLayoutButtonLabels ? "gap-1 px-2" : "px-1.5"')
    expectSourceToContain('reorderHintLabel ? "px-2" : "px-1.5"')
    expectSourceToContain('shouldSplitSessionHeaderRows && "gap-y-1.5"')
    expectSourceToContain('shouldSplitSessionHeaderRows && "order-2 basis-full"')
    expectSourceToContain('shouldSplitSessionHeaderRows && "order-1 ml-0 w-full"')
    expectSourceToContain(
      '{showRecentSingleViewRestoreAdjustmentHint &&\n                recentSingleViewRestoreAdjustmentHint && (',
    )
    expectSourceToContain('{recentSingleViewRestoreAdjustmentHint.label}')
    expectSourceToContain('{recentSingleViewRestoreAdjustmentHint.badgeLabel}')
  })

  it("lets compact compare/grid headers drop redundant passive pressure chips once panel-recovery actions are already available", () => {
    expectSourceToContain(
      "const shouldHidePassiveLayoutPressureHintChipsOnCompactHeader =\n    isCompactSessionHeader &&\n    (showShrinkPanelForLayoutPressure ||\n      showCollapseSidebarForLayoutPressure ||\n      showHidePanelForLayoutPressureAction)",
    )
    expectSourceToContain(
      "const showPassiveStackedLayoutRecoveryHint =\n    showStackedLayoutRecoveryHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader",
    )
    expectSourceToContain(
      'const shouldHidePassiveNearStackedLayoutHint =\n    showNearStackedLayoutHint &&\n    !isCompactSessionHeader &&\n    !!prioritizedLayoutPressureOutcomeLabel &&\n    (prioritizeShrinkPanelForLayoutPressure ||\n      prioritizeCollapseSidebarForLayoutPressure ||\n      prioritizeHidePanelForLayoutPressure)',
    )
    expectSourceToContain(
      "const showPassiveNearStackedLayoutHint =\n    showNearStackedLayoutHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader &&\n    !shouldHidePassiveNearStackedLayoutHint",
    )
    expectSourceToContain("{showPassiveStackedLayoutRecoveryHint &&")
    expectSourceToContain("{showPassiveNearStackedLayoutHint &&")
    expectSourceToContain(
      "const hasCompactSessionHeaderMeta =\n    showCurrentLayoutChip ||\n    showRecentSingleViewRestoreAdjustmentHint ||\n    showPassiveStackedLayoutRecoveryHint ||\n    showPassiveNearStackedLayoutHint ||\n    showRecentResponsiveWidthLockHint ||\n    showPassivePanelAtMinimumWidthLayoutPressureHint ||\n    showFocusedLayoutSummaryChip ||\n    showReorderHint",
    )
  })

  it("lets the hide-panel action absorb the panel-min-width explanation outside the tightest header state", () => {
    expectSourceToContain(
      'const showPassivePanelAtMinimumWidthLayoutPressureHint =\n    showPanelAtMinimumWidthLayoutPressureHint && isVeryCompactSessionHeader',
    )
    expectSourceToContain(
      '{showPassivePanelAtMinimumWidthLayoutPressureHint &&\n                panelAtMinimumWidthLayoutPressureLabel && (',
    )
    expectSourceToContain(
      'const hidePanelForLayoutPressureOnlyRemainingActionDetail =',
    )
    expectSourceToContain(
      '" The floating panel is already at minimum width, so hiding it is the only remaining panel recovery action."',
    )
  })

  it("lets roomy near-stacked headers drop the passive warning chip once a promoted action already explains how to avoid stacking", () => {
    expectSourceToContain(
      'const prioritizedLayoutPressureOutcomeLabel =',
    )
    expectSourceToContain('"Keeps side by side"')
    expectSourceToContain('"Keeps columns"')
    expectSourceToContain(
      'const shouldHidePassiveNearStackedLayoutHint =\n    showNearStackedLayoutHint &&\n    !isCompactSessionHeader &&\n    !!prioritizedLayoutPressureOutcomeLabel &&\n    (prioritizeShrinkPanelForLayoutPressure ||\n      prioritizeCollapseSidebarForLayoutPressure ||\n      prioritizeHidePanelForLayoutPressure)',
    )
    expectSourceToContain(
      'const shouldHidePassiveStackedLayoutRecoveryHint =\n    showStackedLayoutRecoveryHint &&\n    !isCompactSessionHeader &&\n    !!prioritizedLayoutPressureOutcomeLabel &&\n    (prioritizeShrinkPanelForLayoutPressure ||\n      prioritizeCollapseSidebarForLayoutPressure ||\n      prioritizeHidePanelForLayoutPressure)',
    )
    expectSourceToContain(
      "const showPassiveNearStackedLayoutHint =\n    showNearStackedLayoutHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader &&\n    !shouldHidePassiveNearStackedLayoutHint",
    )
    expectSourceToContain(
      "const showPassiveStackedLayoutRecoveryHint =\n    showStackedLayoutRecoveryHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader &&\n    !shouldHidePassiveStackedLayoutRecoveryHint",
    )
  })

  it("lets roomy stacked headers drop the passive recovery chip once a promoted action already explains how to restore columns", () => {
    expectSourceToContain(
      'const shouldHidePassiveStackedLayoutRecoveryHint =\n    showStackedLayoutRecoveryHint &&\n    !isCompactSessionHeader &&\n    !!prioritizedLayoutPressureOutcomeLabel &&\n    (prioritizeShrinkPanelForLayoutPressure ||\n      prioritizeCollapseSidebarForLayoutPressure ||\n      prioritizeHidePanelForLayoutPressure)',
    )
    expectSourceToContain('const prioritizedLayoutPressureOutcomeLabel =')
    expectSourceToContain('"Restores side by side"')
    expectSourceToContain('"Restores columns"')
    expectSourceToContain(
      "const showPassiveStackedLayoutRecoveryHint =\n    showStackedLayoutRecoveryHint &&\n    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader &&\n    !shouldHidePassiveStackedLayoutRecoveryHint",
    )
  })

  it("makes completed-session cleanup self-explanatory with a visible count instead of relying on an icon-only affordance", () => {
    expectSourceToContain("const inactiveSessionCountLabel =")
    expectSourceToContain('inactiveSessionCount === 1 ? "1 completed session"')
    expectSourceToContain('const clearInactiveSessionsButtonLabel =')
    expectSourceToContain('isVeryCompactSessionHeader ? null')
    expectSourceToContain('isCompactSessionHeader ? "Clear" : "Clear completed"')
    expectSourceToContain('const clearInactiveSessionsTitle =')
    expectSourceToContain('`Clear ${inactiveSessionCountLabel}`')
    expectSourceToContain('title={`${clearInactiveSessionsTitle}. Conversations stay in history.`}')
    expectSourceToContain('aria-label={clearInactiveSessionsTitle}')
    expectSourceToContain('{clearInactiveSessionsButtonLabel ? (')
    expectSourceToContain('<span>{clearInactiveSessionsButtonLabel}</span>')
    expectSourceToContain('text-[10px] font-medium tabular-nums')
    expectSourceToContain('{inactiveSessionCount}')
  })

  it("keeps roomy single-view context session-centric while compact headers regain an explicit Single label", () => {
    expectSourceToContain(
      "bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]",
    )
    expectSourceToContain(
      "const shouldPreferCompactFocusedSessionBrowsePositionLabel =",
    )
    expectSourceToContain(
      "isFocusLayout &&\n    isCompactSessionHeader &&\n    !isVeryCompactSessionHeader &&\n    canBrowseFocusedSessions",
    )
    expectSourceToContain("const showFocusedLayoutSummaryChip =")
    expectSourceToContain("showFocusLayoutHint &&")
    expectSourceToContain("!isVeryCompactSessionHeader ||")
    expectSourceToContain("showFocusedLayoutCountBadge ||")
    expectSourceToContain("const showFocusedLayoutModeLabel =")
    expectSourceToContain("showFocusedLayoutSummaryChip && isCompactSessionHeader")
    expectSourceToContain('const focusedLayoutModeLabel = showFocusedLayoutModeLabel ? "Single" : null')
    expectSourceToContain("const focusedLayoutCountLabel =")
    expectSourceToContain(
      'isCompactSessionHeader ? `${focusedLayoutSessionIndex + 1}/${focusableSessionCount}` : `${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`',
    )
    expectSourceToContain("const showFocusedLayoutCountBadge =")
    expectSourceToContain(
      '!focusedSessionBrowsePositionLabel',
    )
    expectSourceToContain("const showFocusedSessionLabel =")
    expectSourceToContain(
      "!!focusedLayoutSessionLabel &&\n    (!isCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)",
    )
    expectSourceToContain("const showBrowsingSessionsLabel =")
    expectSourceToContain(
      "!focusedLayoutSessionLabel &&\n    (!isCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)",
    )
    expectSourceToContain("text-muted-foreground/50 whitespace-nowrap")
    expectSourceToContain("text-muted-foreground/80 max-w-[220px] truncate")
    expectSourceToContain("{focusedLayoutModeLabel}")
    expectSourceToContain("{showFocusedLayoutCountBadge ? (")
    expectSourceToContain("{focusedLayoutCountLabel}")
    expectSourceToContain("Showing {focusedLayoutSessionLabel}")
    expectSourceToContain("Browsing sessions")
  })

  it("gives single view an explicit way back to the remembered multi-tile layout", () => {
    expectSourceToContain("const singleViewRestoreButton =")
    expectSourceToContain(
      'const showDedicatedSingleViewRestoreButton =',
    )
    expectSourceToContain(
      'showSingleViewRestore && (!isCompactSessionHeader || isVeryCompactSessionHeader)',
    )
    expectSourceToContain(
      "const singleViewRestoreSessionLabel =",
    )
    expectSourceToContain(
      "focusableSessionLabelById.get(maximizedSessionId)",
    )
    expectSourceToContain(
      'const singleViewRestoreFocusContext = singleViewRestoreSessionLabel',
    )
    expectSourceToContain(
      'const singleViewRestoreTitle = !showSingleViewRestore || !restoreLayoutOption',
    )
    expectSourceToContain(
      'Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]} (last tiled layout) and keep ${singleViewRestoreFocusContext}',
    )
    expectSourceToContain(
      "aria-label={singleViewRestoreTitle ?? undefined}",
    )
    expectSourceToContain(
      "title={singleViewRestoreTitle ?? undefined}",
    )
    expectSourceToContain(
      'const singleViewRestoreLabel =',
    )
    expectSourceToContain(
      '!showDedicatedSingleViewRestoreButton || !restoreLayoutOption',
    )
    expectSourceToContain(
      'showDedicatedSingleViewRestoreButton && restoreLayoutOption ? (',
    )
    expectSourceToContain(
      'isVeryCompactSessionHeader ? "Back" : `Back to ${restoreLayoutOption.label}`',
    )
    expectSourceToContain(
      'singleViewRestoreLabel ? isVeryCompactSessionHeader ? "gap-1 px-1.5" : "gap-1 px-2" : "px-1.5"',
    )
    expectSourceToContain("{singleViewRestoreLabel ? <span>{singleViewRestoreLabel}</span> : null}")
    expectSourceToContain("const sessionTileModeControls = (")
    expectSourceToContain('className="flex shrink-0 items-center gap-1"')
    expectSourceToContain("{singleViewRestoreButton}")
    expectSourceToContain("{sessionTileLayoutButtonGroup}")
    expectSourceToContain("{sessionTileModeControls}")
  })

  it("lets compact tiled headers keep layout controls ahead of panel-recovery actions", () => {
    expectSourceToContain("const layoutPressureActionButtons = [")
    expectSourceToContain(
      "const compactHeaderLayoutPressureActionButtons =",
    )
    expectSourceToContain(
      "isCompactSessionHeader && layoutPressureActionButtons.length > 1",
    )
    expectSourceToContain("layoutPressureActionButtons.slice(0, 1)")
    expectSourceToContain(
      "const visibleLayoutPressureActionButtons = compactHeaderLayoutPressureActionButtons",
    )
    expectSourceToContain(
      "const shouldDeferLayoutPressureActionsInCompactHeader =",
    )
    expectSourceToContain(
      "isCompactSessionHeader && layoutPressureActionButtons.length > 0",
    )
    expectSourceToContain(
      'showSingleViewRestore && (!isCompactSessionHeader || isVeryCompactSessionHeader)',
    )
    expectSourceToContain(
      "const focusedSessionBrowseControls = canBrowseFocusedSessions ? (",
    )
    expectSourceToContain(
      "const focusedSessionBrowsePositionLabel =\n    focusedLayoutCountLabel &&\n    (isVeryCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)",
    )
    expectSourceToContain(
      "const showFocusedSessionBrowseLabel =\n    canBrowseFocusedSessions &&\n    (!!focusedLayoutSessionLabel || !!focusedSessionBrowsePositionLabel) &&\n    (!showFocusedSessionLabel || !!focusedSessionBrowsePositionLabel)",
    )
    expectSourceToContain(
      "{shouldDeferLayoutPressureActionsInCompactHeader\n                ? null\n                : visibleLayoutPressureActionButtons}",
    )
    expectSourceToContain("{focusedSessionBrowseControls}")
    expectSourceToContain("{sessionTileModeControls}")
    expectSourceToContain(
      "{shouldDeferLayoutPressureActionsInCompactHeader\n                ? visibleLayoutPressureActionButtons\n                : null}",
    )
  })

  it("lets compact tiled headers surface only the strongest recovery action when several are available", () => {
    expectSourceToContain(
      "const compactHeaderLayoutPressureActionButtons =\n    isCompactSessionHeader && layoutPressureActionButtons.length > 1\n      ? layoutPressureActionButtons.slice(0, 1)\n      : layoutPressureActionButtons",
    )
    expectSourceToContain(
      "const visibleLayoutPressureActionButtons = compactHeaderLayoutPressureActionButtons",
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
    expectSourceToContain("isSparseWideGridLayout")
    expectSourceToContain(
      "onMeasurementsChange={handleSessionGridMeasurementsChange}",
    )
  })

  it("clarifies when compare or grid is temporarily showing one expanded tile because only one session is visible, while Grid also explains its roomy two-tile fallback", () => {
    expectSourceToContain("const TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION =")
    expectSourceToContain('"Expanded for one visible session"')
    expectSourceToContain(
      'const TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL = "One visible"',
    )
    expectSourceToContain("const SPARSE_WIDE_GRID_LAYOUT_DESCRIPTION =")
    expectSourceToContain('"Expanded for two visible sessions"')
    expectSourceToContain(
      'const SPARSE_WIDE_GRID_LAYOUT_SHORT_LABEL = "Two visible"',
    )
    expectSourceToContain("const isTemporarySingleVisibleLayout =")
    expectSourceToContain("!isFocusLayout && visibleTileCount === 1")
    expectSourceToContain("const isSparseWideGridLayout =")
    expectSourceToContain("shouldUseSparseWideGridHeight(")
    expectSourceToContain(
      "const activeLayoutDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const activeLayoutCompactDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const showCurrentLayoutChip =\n    isTemporarySingleVisibleLayout || isSparseWideGridLayout",
    )
    expectSourceToContain(
      "const showVeryCompactAdaptiveLayoutLabel =",
    )
    expectSourceToContain(
      "showCurrentLayoutChip && isVeryCompactSessionHeader",
    )
    expectSourceToContain(
      "const currentLayoutChipLabel = showVeryCompactAdaptiveLayoutLabel",
    )
    expectSourceToContain(
      "? activeLayoutCompactDescription : LAYOUT_LABELS[tileLayoutMode]",
    )
    expectSourceToContain("showLayoutDescriptionSuffix ? (")
    expectSourceToContain("showCompactAdaptiveLayoutDescription ? (")
    expectSourceToContain("{currentLayoutChipLabel}")
    expectSourceToContain("{activeLayoutCompactDescription}")
    expectSourceToContain("{activeLayoutDescription}")
  })

  it("hides the redundant tile-level single-view affordance when compare or grid already shows only one visible tile", () => {
    expectSourceToContain(
      "const showTileMaximize = !isFocusLayout && visibleTileCount > 1",
    )
    expectSourceToContain("onExpand={showTileMaximize ? handleExpand : undefined}")
    expectSourceToContain(
      "showTileMaximize\n                      ? () => handleMaximizeTile(pendingSessionId)\n                      : undefined",
    )
  })
})
