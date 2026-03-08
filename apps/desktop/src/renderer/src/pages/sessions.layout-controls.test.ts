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
    expectSourceToContain("function getTileLayoutOptionTitle({")
    expectSourceToContain(
      "const showLayoutButtonLabels =",
    )
    expectSourceToContain(
      "const showCurrentLayoutChip = usesAdaptiveLayoutDescription",
    )
    expectSourceToContain("{showCurrentLayoutChip && (")
    expectSourceToContain(
      "const showThisLayoutButtonLabel =",
    )
    expectSourceToContain(
      "showThisLayoutButtonLabel ? <span>{label}</span> : null",
    )
    expectSourceToContain(
      "const showSelectedAdaptiveLayoutBadge =",
    )
    expectSourceToContain(
      'data-session-layout-adaptive-badge={mode}',
    )
    expectSourceToContain('label: "Compare"')
    expectSourceToContain('label: "Single"')
    expectSourceToContain('title: "Compare sessions side by side"')
    expectSourceToContain('title: "Show one session at a time"')
    expectSourceToContain('"1x2": "Compare view"')
    expectSourceToContain('"1x1": "Single view"')
    expectSourceToContain('"1x2": "Side by side"')
    expectSourceToContain(
      "const layoutOptionTitle = getTileLayoutOptionTitle({",
    )
    expectSourceToContain("aria-label={layoutOptionTitle}")
    expectSourceToContain("title={layoutOptionTitle}")
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
      "function getAdaptiveTileLayoutDescription({",
    )
    expectSourceToContain(
      'if (visibleTileCount === 1) {',
    )
    expectSourceToContain(
      "hasMeasuredSessionGridWidth &&\n    isResponsiveStackedTileLayout(containerWidth, gap, mode, visibleTileCount)",
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
      "!!activeAdaptiveLayoutDescription",
    )
    expectSourceToContain(
      "const activeAdaptiveLayoutDescription = getAdaptiveTileLayoutDescription({",
    )
    expectSourceToContain(
      "const isResponsiveStackedLayout =\n    activeAdaptiveLayoutDescription === RESPONSIVE_STACKED_LAYOUT_DESCRIPTION",
    )
    expectSourceToContain(
      "const activeLayoutDescription =\n    activeAdaptiveLayoutDescription ?? LAYOUT_DESCRIPTIONS[tileLayoutMode]",
    )
    expectSourceToContain(
      "const showCurrentLayoutChip = usesAdaptiveLayoutDescription",
    )
    expectSourceToContain(
      "!(isCompactSessionHeader && showStackedLayoutRecoveryHint)",
    )
    expectSourceToContain(
      'const RESPONSIVE_STACKED_LAYOUT_DESCRIPTION = "Stacked to fit"',
    )
    expectSourceToContain(
      'const RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL = "Stacked"',
    )
    expectSourceToContain(
      'return `Current layout: ${LAYOUT_LABELS[mode]} — ${activeLayoutDescription}`',
    )
    expectSourceToContain(
      'return `Switch to ${LAYOUT_LABELS[mode]} — stacked to fit at the current width`',
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

  it("lets the stacked recovery hint replace the adaptive current-layout chip on compact tiled headers", () => {
    expectSourceToContain(
      "const showCurrentLayoutChip = usesAdaptiveLayoutDescription && !(isCompactSessionHeader && showStackedLayoutRecoveryHint)",
    )
    expectSourceToContain(
      'title={stackedLayoutRecoveryHint.title}',
    )
    expectSourceToContain(
      "const layoutOptionTitle = getTileLayoutOptionTitle({",
    )
  })

  it("adds a direct recovery hint when compare or grid is stacked by width pressure", () => {
    expectSourceToContain('getResponsiveStackedTileLayoutMinimumWidth')
    expectSourceToContain("panelWidth:number|null")
    expectSourceToContain("panelVisible:boolean")
    expectSourceToContain('const AGENT_PANEL_DEFAULT_WIDTH = 600')
    expectSourceToContain('const PANEL_TILE_PRESSURE_WIDTH = AGENT_PANEL_DEFAULT_WIDTH + 64')
    expectSourceToContain('const EARLY_TILE_PRESSURE_RECOVERY_WIDTH = 96')
    expectSourceToContain("function getVisibleTilePressureHintBadgeLabel({")
    expectSourceToContain(
      "if (sidebarTilePressureWidth > 0 && panelTilePressureWidth > 0) {",
    )
    expectSourceToContain(
      "return getTilePressureBadgeLabel(\n      sidebarTilePressureWidth + panelTilePressureWidth,",
    )
    expectSourceToContain("const STACKED_LAYOUT_RECOVERY_HINTS: Record<")
    expectSourceToContain(
      'const SIDEBAR_TILE_PRESSURE_WIDTH = SIDEBAR_DIMENSIONS.width.default + 64',
    )
    expectSourceToContain(
      'const SIDEBAR_STACKED_LAYOUT_RECOVERY_HINTS: Record<',
    )
    expectSourceToContain(
      'const COMBINED_STACKED_LAYOUT_RECOVERY_HINTS: Record<',
    )
    expectSourceToContain(
      'const PANEL_STACKED_LAYOUT_RECOVERY_HINTS: Record<',
    )
    expectSourceToContain(
      "const isPanelLikelyCrowdingTiles = panelVisible &&",
    )
    expectSourceToContain('fullLabel: "Make room to compare"')
    expectSourceToContain('compactLabel: "Make room"')
    expectSourceToContain('fullLabel: "Make room for grid"')
    expectSourceToContain('fullLabel: "Narrow sidebar to compare"')
    expectSourceToContain('compactLabel: "Narrow sidebar"')
    expectSourceToContain('fullLabel: "Narrow sidebar for grid"')
    expectSourceToContain('fullLabel: "Shrink sidebar + panel"')
    expectSourceToContain('compactLabel: "Both wide"')
    expectSourceToContain('fullLabel: "Narrow panel to compare"')
    expectSourceToContain('compactLabel: "Narrow panel"')
    expectSourceToContain('fullLabel: "Narrow panel for grid"')
    expectSourceToContain(
      'title: "Compare view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to compare side by side again."',
    )
    expectSourceToContain(
      'title: "Grid view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to restore multiple columns."',
    )
    expectSourceToContain(
      'title: "Compare view stacked to fit while the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to compare side by side again."',
    )
    expectSourceToContain(
      'title: "Grid view stacked to fit while the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to restore multiple columns."',
    )
    expectSourceToContain(
      'title: "Compare view stacked to fit while the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to compare side by side again."',
    )
    expectSourceToContain(
      'title: "Grid view stacked to fit while the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to restore multiple columns."',
    )
    expectSourceToContain(
      'title: "Compare view stacked to fit while both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to compare side by side again."',
    )
    expectSourceToContain(
      'title: "Grid view stacked to fit while both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to restore multiple columns."',
    )
    expectSourceToContain("const stackedLayoutRecoveryHint =")
    expectSourceToContain("const isSidebarLikelyCrowdingTiles =")
    expectSourceToContain("const isPanelLikelyCrowdingTiles =")
    expectSourceToContain("const isSidebarAndPanelLikelyCrowdingTiles =")
    expectSourceToContain(
      'sidebarWidth >= SIDEBAR_TILE_PRESSURE_WIDTH',
    )
    expectSourceToContain(
      'panelWidth >= PANEL_TILE_PRESSURE_WIDTH',
    )
    expectSourceToContain(
      'isResponsiveStackedLayout && tileLayoutMode !== "1x1"',
    )
    expectSourceToContain(
      'SIDEBAR_STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]',
    )
    expectSourceToContain(
      'PANEL_STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]',
    )
    expectSourceToContain(
      'COMBINED_STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]',
    )
    expectSourceToContain(
      "const showStackedLayoutRecoveryHint = !!stackedLayoutRecoveryHint",
    )
    expectSourceToContain(
      "const stackedLayoutWidthDeficit =",
    )
    expectSourceToContain(
      "responsiveStackedLayoutMinimumWidth - sessionGridMeasurements.containerWidth",
    )
    expectSourceToContain(
      "const stackedLayoutRecoveryTitle = !showStackedLayoutRecoveryHint || !stackedLayoutRecoveryHint",
    )
    expectSourceToContain(
      "function getResponsiveStackedWidthDeficitBadgeLabel(",
    )
    expectSourceToContain(
      'return options?.compact ? `Need ${deficitWidth}px` : `Need ~${deficitWidth}px`',
    )
    expectSourceToContain(
      'The sessions area is about ${deficitWidth}px narrower than the minimum width needed for side-by-side tiles.',
    )
    expectSourceToContain(
      "const stackedLayoutRecoveryLabel = !showStackedLayoutRecoveryHint",
    )
    expectSourceToContain(
      "const stackedLayoutRecoveryWidthLabel =\n    !showStackedLayoutRecoveryHint || isVeryCompactSessionHeader",
    )
    expectSourceToContain("stackedLayoutRecoveryHint.compactLabel")
    expectSourceToContain("stackedLayoutRecoveryHint.fullLabel")
    expectSourceToContain('"Make room"')
    expectSourceToContain("{showStackedLayoutRecoveryHint &&")
    expectSourceToContain("stackedLayoutRecoveryHint &&")
    expectSourceToContain("stackedLayoutRecoveryLabel && (")
    expectSourceToContain("title={stackedLayoutRecoveryTitle ?? stackedLayoutRecoveryHint.title}")
    expectSourceToContain("border-dashed border-blue-500/30 bg-blue-500/10")
    expectSourceToContain("{stackedLayoutRecoveryWidthLabel ? (")
    expectSourceToContain("data-tile-layout-stacked-width-badge")
    expectSourceToContain("{stackedLayoutRecoveryWidthLabel}")
  })

  it("surfaces calmer reset actions earlier in compact tiled headers when sidebar or panel pressure is already materially high", () => {
    expectSourceToContain("const shouldOfferEarlyTilePressureRecovery =")
    expectSourceToContain("!showFocusLayoutHint &&")
    expectSourceToContain("isCompactSessionHeader &&")
    expectSourceToContain("!isVeryCompactSessionHeader &&")
    expectSourceToContain("visibleTileCount > 1 &&")
    expectSourceToContain("!showStackedLayoutRecoveryHint &&")
    expectSourceToContain("!showNearStackedLayoutHint")
    expectSourceToContain("const hasMeaningfulSidebarTilePressure =")
    expectSourceToContain("const hasMeaningfulPanelTilePressure =")
    expectSourceToContain(
      "sidebarTilePressureWidth >= EARLY_TILE_PRESSURE_RECOVERY_WIDTH",
    )
    expectSourceToContain(
      "panelTilePressureWidth >= EARLY_TILE_PRESSURE_RECOVERY_WIDTH",
    )
    expectSourceToContain(
      "const tilePressureRecoveryUrgency = showStackedLayoutRecoveryHint",
    )
    expectSourceToContain('? "stacked"')
    expectSourceToContain('? "near-stacked"')
    expectSourceToContain('? "early"')
    expectSourceToContain(
      '"border-border/60 bg-background/80 text-foreground hover:bg-muted/40"',
    )
  })

  it("warns before compare or grid actually stack and suppresses the lower-priority reorder hint in that tighter state", () => {
    expectSourceToContain(
      "const NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER = 96",
    )
    expectSourceToContain("const NEAR_STACKED_LAYOUT_HINTS: Record<")
    expectSourceToContain(
      'const SIDEBAR_NEAR_STACKED_LAYOUT_HINTS: Record<',
    )
    expectSourceToContain(
      'const COMBINED_NEAR_STACKED_LAYOUT_HINTS: Record<',
    )
    expectSourceToContain(
      'const PANEL_NEAR_STACKED_LAYOUT_HINTS: Record<',
    )
    expectSourceToContain('fullLabel: "Close to stacking"')
    expectSourceToContain('compactLabel: "Tight fit"')
    expectSourceToContain('fullLabel: "Sidebar is crowding compare"')
    expectSourceToContain('compactLabel: "Sidebar tight"')
    expectSourceToContain('fullLabel: "Sidebar is crowding grid"')
    expectSourceToContain('fullLabel: "Sidebar + panel crowd tiles"')
    expectSourceToContain('compactLabel: "Both tight"')
    expectSourceToContain('fullLabel: "Panel is crowding compare"')
    expectSourceToContain('compactLabel: "Panel tight"')
    expectSourceToContain('fullLabel: "Panel is crowding grid"')
    expectSourceToContain(
      'title: "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep sessions side by side."',
    )
    expectSourceToContain(
      'title: "Compare view is close to stacking because the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to keep sessions side by side."',
    )
    expectSourceToContain(
      'title: "Grid view is close to stacking because the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to keep multiple columns visible."',
    )
    expectSourceToContain(
      'title: "Compare view is close to stacking because the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to keep sessions side by side."',
    )
    expectSourceToContain(
      'title: "Grid view is close to stacking because the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to keep multiple columns visible."',
    )
    expectSourceToContain(
      'title: "Compare view is close to stacking because both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to keep sessions side by side."',
    )
    expectSourceToContain(
      'title: "Grid view is close to stacking because both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to keep multiple columns visible."',
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
      "const nearStackedLayoutWidthHeadroom =",
    )
    expectSourceToContain(
      "sessionGridMeasurements.containerWidth - responsiveStackedLayoutMinimumWidth",
    )
    expectSourceToContain(
      'SIDEBAR_NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]',
    )
    expectSourceToContain(
      'PANEL_NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]',
    )
    expectSourceToContain(
      'COMBINED_NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]',
    )
    expectSourceToContain(
      "const nearStackedLayoutHintLabel = !showNearStackedLayoutHint",
    )
    expectSourceToContain(
      "const nearStackedLayoutHintTitle = !showNearStackedLayoutHint || !nearStackedLayoutHint",
    )
    expectSourceToContain(
      "function getResponsiveStackedWidthHeadroomBadgeLabel(",
    )
    expectSourceToContain(
      'return options?.compact ? `${remainingWidth}px left` : `~${remainingWidth}px left`',
    )
    expectSourceToContain(
      'The sessions area only has about ${remainingWidth}px left before compare or grid tiles stack into one column.',
    )
    expectSourceToContain(
      "const nearStackedLayoutWidthLabel =\n    !showNearStackedLayoutHint || isVeryCompactSessionHeader",
    )
    expectSourceToContain('isVeryCompactSessionHeader ? "Tight"')
    expectSourceToContain("nearStackedLayoutHint.compactLabel")
    expectSourceToContain("nearStackedLayoutHint.fullLabel")
    expectSourceToContain("{showNearStackedLayoutHint &&")
    expectSourceToContain("nearStackedLayoutHint &&")
    expectSourceToContain("nearStackedLayoutHintLabel && (")
    expectSourceToContain("title={nearStackedLayoutHintTitle ?? nearStackedLayoutHint.title}")
    expectSourceToContain(
      'border-dashed border-amber-500/30 bg-amber-500/10 py-1 text-[11px] text-amber-700 dark:text-amber-300',
    )
    expectSourceToContain("<AlertTriangle className=\"h-3.5 w-3.5 shrink-0\" />")
    expectSourceToContain("{nearStackedLayoutWidthLabel ? (")
    expectSourceToContain("data-tile-layout-near-width-badge")
    expectSourceToContain("{nearStackedLayoutWidthLabel}")
    expectSourceToContain(
      "!isResponsiveStackedLayout &&\n    !showNearStackedLayoutHint",
    )
  })

  it("offers a direct floating-panel reset action from the sessions header when panel width is crowding tiled layouts", () => {
    expectSourceToContain("function getTilePressureBadgeLabel(")
    expectSourceToContain("function getPanelTilePressureWidth(")
    expectSourceToContain("function getPanelTileComfortWidthLabel(): string {")
    expectSourceToContain('return `${PANEL_TILE_PRESSURE_WIDTH}px`')
    expectSourceToContain("function getPanelTilePressureTitleSuffix(")
    expectSourceToContain(
      "const panelTilePressureWidth = getPanelTilePressureWidth(panelWidth)",
    )
    expectSourceToContain('return options?.compact ? `+${pressureWidth}px` : `${pressureWidth}px over`')
    expectSourceToContain(
      'const panelTileComfortWidthLabel = getPanelTileComfortWidthLabel()',
    )
    expectSourceToContain(
      '` The floating panel is currently about ${panelTilePressureWidth}px past the tiled-session comfort threshold. Aim for about ${panelTileComfortWidthLabel} wide or narrower.`',
    )
    expectSourceToContain(
      "const [isResettingPanelSize, setIsResettingPanelSize] = useState(false)",
    )
    expectSourceToContain(
      "const [isHidingCrowdingPanel, setIsHidingCrowdingPanel] = useState(false)",
    )
    expectSourceToContain(
      "const isUpdatingPanelRecovery = isResettingPanelSize || isHidingCrowdingPanel",
    )
    expectSourceToContain("const showCombinedSizeRecoveryAction =")
    expectSourceToContain("const showPanelSizeRecoveryAction =")
    expectSourceToContain("!showCombinedSizeRecoveryAction &&")
    expectSourceToContain("isPanelLikelyCrowdingTiles &&")
    expectSourceToContain(
      "(showStackedLayoutRecoveryHint ||",
    )
    expectSourceToContain(
      "showNearStackedLayoutHint ||",
    )
    expectSourceToContain(
      '(tilePressureRecoveryUrgency === "early" && hasMeaningfulPanelTilePressure))',
    )
    expectSourceToContain(
      "const panelSizeRecoveryActionLabel = !showPanelSizeRecoveryAction",
    )
    expectSourceToContain(
      "const panelSizeRecoveryPressureLabel =",
    )
    expectSourceToContain(
      "const showTilePressureRecoveryActionBadges =",
    )
    expectSourceToContain(
      "!isVeryCompactSessionHeader &&",
    )
    expectSourceToContain(
      "!isCompactSessionHeader ||",
    )
    expectSourceToContain(
      '(tilePressureRecoveryUrgency !== "stacked" &&',
    )
    expectSourceToContain(
      'tilePressureRecoveryUrgency !== "near-stacked"))',
    )
    expectSourceToContain(
      "getTilePressureBadgeLabel(panelTilePressureWidth, {",
    )
    expectSourceToContain('? "Panel"')
    expectSourceToContain(': isCompactSessionHeader')
    expectSourceToContain('? "Reset panel"')
    expectSourceToContain(': "Reset panel size"')
    expectSourceToContain(
      "const panelSizeRecoveryActionTitle = !showPanelSizeRecoveryAction",
    )
    expectSourceToContain(
      'getPanelTilePressureTitleSuffix(panelWidth)',
    )
    expectSourceToContain(
      '`Reset the floating panel to the default size for the current mode to recover room for tiled sessions.${getPanelTilePressureTitleSuffix(panelWidth)}`',
    )
    expectSourceToContain(
      '`Reset the floating panel to the default size for the current mode. The sidebar is still wide, but this should recover some room for tiled sessions.${getPanelTilePressureTitleSuffix(panelWidth)}`',
    )
    expectSourceToContain(
      "const handleResetCrowdingPanel = useCallback(async () => {",
    )
    expectSourceToContain(
      'if (isUpdatingPanelRecovery || !isPanelLikelyCrowdingTiles) return',
    )
    expectSourceToContain("setIsResettingPanelSize(true)")
    expectSourceToContain("await tipcClient.resetPanelSizeForCurrentMode({})")
    expectSourceToContain(
      'console.error("Failed to reset floating panel size from tiled sessions:", error)',
    )
    expectSourceToContain('toast.error("Failed to reset panel size")')
    expectSourceToContain("setIsResettingPanelSize(false)")
    expectSourceToContain("{showPanelSizeRecoveryAction &&")
    expectSourceToContain("panelSizeRecoveryActionLabel &&")
    expectSourceToContain("panelSizeRecoveryActionTitle && (")
    expectSourceToContain('data-tile-pressure-panel-recovery={')
    expectSourceToContain('data-tile-pressure-panel-recovery={tilePressureRecoveryUrgency??undefined}')
    expectSourceToContain('disabled={isUpdatingPanelRecovery}')
    expectSourceToContain('aria-label={panelSizeRecoveryActionTitle}')
    expectSourceToContain('title={panelSizeRecoveryActionTitle}')
    expectSourceToContain('isVeryCompactSessionHeader ? "h-6 gap-1 rounded-md px-1.5 text-[10px]" : "h-6 gap-1 rounded-md px-2 text-[11px]"')
    expectSourceToContain('border-blue-500/35 bg-background/80 text-blue-700')
    expectSourceToContain('border-amber-500/35 bg-background/80 text-amber-700')
    expectSourceToContain('tilePressureRecoveryActionToneClasses')
    expectSourceToContain('<Loader2 className="h-3 w-3 animate-spin" />')
    expectSourceToContain(') : isVeryCompactSessionHeader ? (')
    expectSourceToContain('<RotateCcw className="h-3 w-3 shrink-0" />')
    expectSourceToContain('{panelSizeRecoveryActionLabel}')
    expectSourceToContain('{panelSizeRecoveryPressureLabel ? (')
    expectSourceToContain('data-tile-pressure-panel-badge')
    expectSourceToContain('{panelSizeRecoveryPressureLabel}')
    expectSourceToContain('border-current/15 bg-background/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap')
  })

  it("adds a direct hide-panel recovery action so tiled sessions can reclaim space immediately without forcing a size reset", () => {
    expectSourceToContain('Minimize2')
    expectSourceToContain('const shouldOfferUrgentHidePanelRecoveryAction =')
    expectSourceToContain('tilePressureRecoveryUrgency === "stacked" ||')
    expectSourceToContain('tilePressureRecoveryUrgency === "near-stacked"')
    expectSourceToContain('const showHidePanelRecoveryAction =')
    expectSourceToContain('!isVeryCompactSessionHeader&&')
    expectSourceToContain('shouldOfferUrgentHidePanelRecoveryAction&&')
    expectSourceToContain('panelVisible &&')
    expectSourceToContain('(showPanelSizeRecoveryAction || showCombinedSizeRecoveryAction)')
    expectSourceToContain('const hidePanelRecoveryActionLabel = !showHidePanelRecoveryAction')
    expectSourceToContain('? "Hide"')
    expectSourceToContain(': "Hide panel"')
    expectSourceToContain('const hidePanelRecoveryActionTitle = !showHidePanelRecoveryAction')
    expectSourceToContain('Sessions continue in background and you can reopen the panel later')
    expectSourceToContain('this removes the panel entirely instead of only resetting its size')
    expectSourceToContain('const handleHideCrowdingPanel = useCallback(async () => {')
    expectSourceToContain('if (isUpdatingPanelRecovery || !panelVisible || !isPanelLikelyCrowdingTiles) {')
    expectSourceToContain('setIsHidingCrowdingPanel(true)')
    expectSourceToContain('await tipcClient.hidePanelWindow({})')
    expectSourceToContain('captureTilePressureRecoveryFeedback("panel-hidden")')
    expectSourceToContain('console.error("Failed to hide floating panel from tiled sessions:", error)')
    expectSourceToContain('toast.error("Failed to hide panel")')
    expectSourceToContain('{showHidePanelRecoveryAction && hidePanelRecoveryActionTitle && (')
    expectSourceToContain('data-tile-pressure-hide-panel={tilePressureRecoveryUrgency??undefined}')
    expectSourceToContain('variant="ghost"')
    expectSourceNotToContain('isVeryCompactSessionHeader ? "h-6 w-6 px-0" : "h-6 gap-1 rounded-md px-2 text-[11px]"')
    expectSourceToContain('className={cn("h-6 gap-1 rounded-md px-2 text-[11px]",')
    expectSourceToContain('<Minimize2 className="h-3 w-3 shrink-0" />')
    expectSourceToContain('{hidePanelRecoveryActionLabel ? (')
    expectSourceToContain('{hidePanelRecoveryActionLabel}')
  })

  it("suppresses the hide-panel recovery action on very compact headers so the primary reset control stays clearer", () => {
    expectSourceToContain('const showHidePanelRecoveryAction =\n    !isVeryCompactSessionHeader &&')
    expectSourceToContain('const hidePanelRecoveryActionLabel = !showHidePanelRecoveryAction')
    expectSourceNotToContain('isVeryCompactSessionHeader?null:isCompactSessionHeader?"Hide":"Hidepanel"')
  })

  it("keeps compact early-pressure states reset-first by reserving Hide panel for near-stacked and stacked urgency", () => {
    expectSourceToContain('const shouldOfferUrgentHidePanelRecoveryAction =\n    tilePressureRecoveryUrgency === "stacked" ||\n    tilePressureRecoveryUrgency === "near-stacked"')
    expectSourceNotToContain('tilePressureRecoveryUrgency === "early"&&panelVisible&&isPanelLikelyCrowdingTiles')
  })

  it("offers a direct sidebar reset action from the sessions header when sidebar width is crowding tiled layouts", () => {
    expectSourceToContain("resetSidebar: () => void")
    expectSourceToContain("function getSidebarTilePressureWidth(")
    expectSourceToContain("function getSidebarTileComfortWidthLabel(): string {")
    expectSourceToContain('return `${SIDEBAR_TILE_PRESSURE_WIDTH}px`')
    expectSourceToContain("function getSidebarTilePressureTitleSuffix(")
    expectSourceToContain(
      "const sidebarTilePressureWidth = getSidebarTilePressureWidth(sidebarWidth)",
    )
    expectSourceToContain(
      'const sidebarTileComfortWidthLabel = getSidebarTileComfortWidthLabel()',
    )
    expectSourceToContain(
      '` The sidebar is currently about ${sidebarTilePressureWidth}px past the tiled-session comfort threshold. Aim for about ${sidebarTileComfortWidthLabel} wide or narrower.`',
    )
    expectSourceToContain("const showSidebarSizeRecoveryAction =")
    expectSourceToContain("!showCombinedSizeRecoveryAction &&")
    expectSourceToContain("!!resetSidebar &&")
    expectSourceToContain("isSidebarLikelyCrowdingTiles &&")
    expectSourceToContain(
      "(showStackedLayoutRecoveryHint ||",
    )
    expectSourceToContain(
      "showNearStackedLayoutHint ||",
    )
    expectSourceToContain(
      '(tilePressureRecoveryUrgency === "early" && hasMeaningfulSidebarTilePressure))',
    )
    expectSourceToContain(
      "const sidebarSizeRecoveryActionLabel = !showSidebarSizeRecoveryAction",
    )
    expectSourceToContain(
      "const sidebarSizeRecoveryPressureLabel =",
    )
    expectSourceToContain(
      "getTilePressureBadgeLabel(sidebarTilePressureWidth, {",
    )
    expectSourceToContain('? "Sidebar"')
    expectSourceToContain(': isCompactSessionHeader')
    expectSourceToContain('? "Reset sidebar"')
    expectSourceToContain(': "Reset sidebar width"')
    expectSourceToContain(
      "const sidebarSizeRecoveryActionTitle = !showSidebarSizeRecoveryAction",
    )
    expectSourceToContain(
      '`Reset the sidebar to the default width to recover room for tiled sessions.${getSidebarTilePressureTitleSuffix(sidebarWidth)}`',
    )
    expectSourceToContain(
      "const handleResetCrowdingSidebar = useCallback(() => {",
    )
    expectSourceToContain(
      'if (!resetSidebar || !isSidebarLikelyCrowdingTiles || showCombinedSizeRecoveryAction) {',
    )
    expectSourceToContain("resetSidebar()")
    expectSourceToContain('{showSidebarSizeRecoveryAction &&')
    expectSourceToContain("sidebarSizeRecoveryActionLabel &&")
    expectSourceToContain("sidebarSizeRecoveryActionTitle && (")
    expectSourceToContain('data-tile-pressure-sidebar-recovery={')
    expectSourceToContain('data-tile-pressure-sidebar-recovery={tilePressureRecoveryUrgency??undefined}')
    expectSourceToContain('aria-label={sidebarSizeRecoveryActionTitle}')
    expectSourceToContain('title={sidebarSizeRecoveryActionTitle}')
    expectSourceToContain('isVeryCompactSessionHeader ? "h-6 gap-1 rounded-md px-1.5 text-[10px]" : "h-6 gap-1 rounded-md px-2 text-[11px]"')
    expectSourceToContain('border-blue-500/35 bg-background/80 text-blue-700')
    expectSourceToContain('border-amber-500/35 bg-background/80 text-amber-700')
    expectSourceToContain('tilePressureRecoveryActionToneClasses')
    expectSourceToContain('{isVeryCompactSessionHeader ? (')
    expectSourceToContain('<RotateCcw className="h-3 w-3 shrink-0" />')
    expectSourceToContain('{sidebarSizeRecoveryActionLabel}')
    expectSourceToContain('{sidebarSizeRecoveryPressureLabel ? (')
    expectSourceToContain('data-tile-pressure-sidebar-badge')
    expectSourceToContain('{sidebarSizeRecoveryPressureLabel}')
  })

  it("offers a combined recovery action when both sidebar and panel width are crowding tiled layouts", () => {
    expectSourceToContain("function getCombinedTilePressureWidth({")
    expectSourceToContain("function getCombinedTilePressureTitleSuffix({")
    expectSourceToContain(
      "return getSidebarTilePressureWidth(sidebarWidth) + getPanelTilePressureWidth(panelWidth)",
    )
    expectSourceToContain(
      'return `${getSidebarTilePressureTitleSuffix(sidebarWidth)}${getPanelTilePressureTitleSuffix(panelWidth)}`',
    )
    expectSourceToContain("const showCombinedSizeRecoveryAction =")
    expectSourceToContain("!!resetSidebar &&")
    expectSourceToContain("isSidebarAndPanelLikelyCrowdingTiles &&")
    expectSourceToContain(
      "(showStackedLayoutRecoveryHint ||",
    )
    expectSourceToContain(
      "showNearStackedLayoutHint ||",
    )
    expectSourceToContain(
      '(tilePressureRecoveryUrgency === "early" &&',
    )
    expectSourceToContain(
      'hasMeaningfulSidebarTilePressure &&',
    )
    expectSourceToContain(
      'hasMeaningfulPanelTilePressure))',
    )
    expectSourceToContain(
      "const combinedSizeRecoveryActionLabel = !showCombinedSizeRecoveryAction",
    )
    expectSourceToContain(
      "const combinedSizeRecoveryPressureLabel =",
    )
    expectSourceToContain(
      "!showCombinedSizeRecoveryAction || !showTilePressureRecoveryActionBadges",
    )
    expectSourceToContain(
      "getTilePressureBadgeLabel(",
    )
    expectSourceToContain(
      "const combinedTilePressureWidth = getCombinedTilePressureWidth({",
    )
    expectSourceToContain('? "Both"')
    expectSourceToContain(': isCompactSessionHeader')
    expectSourceToContain('? "Reset both"')
    expectSourceToContain(': "Reset sidebar + panel"')
    expectSourceToContain(
      "const combinedSizeRecoveryActionTitle = !showCombinedSizeRecoveryAction",
    )
    expectSourceToContain(
      '`Reset the sidebar width and floating panel size to their defaults to recover room for tiled sessions.${getCombinedTilePressureTitleSuffix({',
    )
    expectSourceToContain(
      "const handleResetCrowdingSidebarAndPanel = useCallback(async () => {",
    )
    expectSourceToContain("!resetSidebar ||")
    expectSourceToContain("isResettingPanelSize ||")
    expectSourceToContain("!isSidebarAndPanelLikelyCrowdingTiles")
    expectSourceToContain("setIsResettingPanelSize(true)")
    expectSourceToContain("resetSidebar()")
    expectSourceToContain("await tipcClient.resetPanelSizeForCurrentMode({})")
    expectSourceToContain(
      'console.error("Failed to reset sidebar and floating panel size from tiled sessions:",',
    )
    expectSourceToContain('toast.error("Reset the sidebar, but failed to reset panel size")')
    expectSourceToContain('{showCombinedSizeRecoveryAction &&')
    expectSourceToContain("combinedSizeRecoveryActionLabel &&")
    expectSourceToContain("combinedSizeRecoveryActionTitle && (")
    expectSourceToContain('data-tile-pressure-combined-recovery={')
    expectSourceToContain('data-tile-pressure-combined-recovery={tilePressureRecoveryUrgency??undefined}')
    expectSourceToContain('disabled={isResettingPanelSize}')
    expectSourceToContain('aria-label={combinedSizeRecoveryActionTitle}')
    expectSourceToContain('title={combinedSizeRecoveryActionTitle}')
    expectSourceToContain('isVeryCompactSessionHeader ? "h-6 gap-1 rounded-md px-1.5 text-[10px]" : "h-6 gap-1 rounded-md px-2 text-[11px]"')
    expectSourceToContain('tilePressureRecoveryActionToneClasses')
    expectSourceToContain('<Loader2 className="h-3 w-3 animate-spin" />')
    expectSourceToContain(') : isVeryCompactSessionHeader ? (')
    expectSourceToContain('<RotateCcw className="h-3 w-3 shrink-0" />')
    expectSourceToContain('{combinedSizeRecoveryActionLabel}')
    expectSourceToContain('{combinedSizeRecoveryPressureLabel ? (')
    expectSourceToContain('data-tile-pressure-combined-badge')
    expectSourceToContain('{combinedSizeRecoveryPressureLabel}')
  })

  it("hides duplicate reset-action pressure badges in compact urgent headers once stacked-width hints already explain the squeeze", () => {
    expectSourceToContain(
      'const showTilePressureRecoveryActionBadges =\n    !isVeryCompactSessionHeader &&\n    (!isCompactSessionHeader ||\n      (tilePressureRecoveryUrgency !== "stacked" &&\n        tilePressureRecoveryUrgency !== "near-stacked"))',
    )
    expectSourceToContain(
      "!showPanelSizeRecoveryAction || !showTilePressureRecoveryActionBadges",
    )
    expectSourceToContain(
      "!showSidebarSizeRecoveryAction || !showTilePressureRecoveryActionBadges",
    )
    expectSourceToContain(
      "!showCombinedSizeRecoveryAction || !showTilePressureRecoveryActionBadges",
    )
    expectSourceToContain("data-tile-layout-stacked-width-badge")
    expectSourceToContain("data-tile-layout-near-width-badge")
  })

  it("shows a brief recovery confirmation after header reset actions so disappearing pressure buttons do not feel ambiguous", () => {
    expectSourceToContain('type TilePressureRecoverySource = "sidebar" | "panel" | "both"')
    expectSourceToContain('type TilePressureRecoverySource = "sidebar" | "panel" | "both" | "panel-hidden"')
    expectSourceToContain("interface RecentTilePressureRecoveryFeedback")
    expectSourceToContain("const [recentTilePressureRecoveryFeedback, setRecentTilePressureRecoveryFeedback] =")
    expectSourceToContain("function getTilePressureRecoveryAnnouncementLabel({")
    expectSourceToContain(
      'return "Reset the sidebar width and floating panel size to recover room for tiled sessions"',
    )
    expectSourceToContain(
      'return "Reset the sidebar width to recover room for tiled sessions"',
    )
    expectSourceToContain(
      'return "Reset the floating panel size. The sidebar is still wide, so tiled sessions may remain tight"',
    )
    expectSourceToContain(
      'return "Reset the floating panel size to recover room for tiled sessions"',
    )
    expectSourceToContain(
      'return "Hid the floating panel. The sidebar is still wide, so tiled sessions may remain tight"',
    )
    expectSourceToContain(
      'return "Hid the floating panel to recover room for tiled sessions"',
    )
    expectSourceToContain("function getTilePressureRecoveryChipLabel(")
    expectSourceToContain('if (options?.veryCompact) return "Both"')
    expectSourceToContain('if (options?.compact) return "Reset both"')
    expectSourceToContain('return "Sidebar + panel reset"')
    expectSourceToContain('if (options?.veryCompact) {')
    expectSourceToContain('return "Hidden"')
    expectSourceToContain('return "Panel hidden"')
    expectSourceToContain('const label = source === "sidebar" ? "Sidebar" : "Panel"')
    expectSourceToContain('return `${label} reset`')
    expectSourceToContain("const captureTilePressureRecoveryFeedback = useCallback(")
    expectSourceToContain("captureTilePressureRecoveryFeedback(\"panel\")")
    expectSourceToContain("captureTilePressureRecoveryFeedback(\"sidebar\")")
    expectSourceToContain("captureTilePressureRecoveryFeedback(\"both\")")
    expectSourceToContain("captureTilePressureRecoveryFeedback(\"panel-hidden\")")
    expectSourceToContain(
      'source === "panel" || source === "panel-hidden"',
    )
    expectSourceToContain(
      "current?.id === recentTilePressureRecoveryFeedback.id ? null : current",
    )
    expectSourceToContain("}, 2800)")
    expectSourceToContain(
      "const showTilePressureRecoveryFeedback = !showReorderFeedback && !!recentTilePressureRecoveryFeedback",
    )
    expectSourceToContain("const tilePressureRecoveryFeedbackLabel = !recentTilePressureRecoveryFeedback")
    expectSourceToContain(
      '!showReorderFeedback&&!recentTilePressureRecoveryFeedback&&!!recentNewSessionFeedback',
    )
    expectSourceToContain(
      '{showTilePressureRecoveryFeedback && recentTilePressureRecoveryFeedback ? (',
    )
    expectSourceToContain(
      'data-tile-pressure-recovery-feedback={recentTilePressureRecoveryFeedback.source}',
    )
    expectSourceToContain('{recentTilePressureRecoveryFeedback.announcement}')
    expectSourceToContain('{tilePressureRecoveryFeedbackLabel}')
  })

  it("restores the last non-maximized layout when focus mode is toggled", () => {
    expectSourceToContain('if (nextMode === "1x1") {')
    expectSourceToContain("const isSingleViewTransition =")
    expectSourceToContain('tileLayoutMode === "1x1" || nextMode === "1x1"')
    expectSourceToContain(
      "const shouldPreserveWidthAcrossLayoutChange =",
    )
    expectSourceToContain(
      "shouldPreserveTileWidthAcrossLayoutChange(tileLayoutMode, nextMode)",
    )
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
    expectSourceToContain(
      "if (!isSingleViewTransition && !shouldPreserveWidthAcrossLayoutChange) {",
    )
    expectSourceToContain('clearPersistedSize("session-tile")')
    expectSourceToContain("setTileResetKey((prev) => prev + 1)")
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
      "const shouldCondenseLayoutSelector =",
    )
    expectSourceToContain(
      "const shouldPrioritizeWidthPressureHint =",
    )
    expectSourceToContain(
      "!showFocusLayoutHint &&",
    )
    expectSourceToContain(
      "isCompactSessionHeader &&",
    )
    expectSourceToContain(
      "tilePressureRecoveryUrgency !== null",
    )
    expectSourceToContain(
      "!isVeryCompactSessionHeader &&",
    )
    expectSourceToContain(
      "shouldPrioritizeSingleViewHeaderControls || shouldPrioritizeWidthPressureHint",
    )
    expectSourceToContain(
      "const showLayoutButtonLabels =",
    )
    expectSourceToContain(
      "!isVeryCompactSessionHeader && !shouldCondenseLayoutSelector",
    )
    expectSourceToContain(
      "const showSelectedLayoutButtonLabel = shouldCondenseLayoutSelector",
    )
    expectSourceToContain("const reorderHintLabel = isVeryCompactSessionHeader")
    expectSourceToContain('? "Grab"')
    expectSourceToContain(': "Grab to reorder"')
    expectSourceToContain(
      'title="Grab the reorder handle on any session tile to drag the grid order, or focus it and use arrow keys to move a session."',
    )
    expectSourceToContain(
      "const showThisLayoutButtonLabel =",
    )
    expectSourceToContain(
      "showLayoutButtonLabels ||",
    )
    expectSourceToContain(
      "showSelectedLayoutButtonLabel && tileLayoutMode === mode",
    )
    expectSourceToContain(
      'showThisLayoutButtonLabel ? "gap-1 px-2" : "px-1.5"',
    )
    expectSourceToContain('reorderHintLabel ? "px-2" : "px-1.5"')
  })

  it("condenses the compact compare/grid layout selector when stacked or near-stacked hints already need header space", () => {
    expectSourceToContain(
      "const shouldPrioritizeWidthPressureHint =",
    )
    expectSourceToContain(
      "tilePressureRecoveryUrgency !== null",
    )
    expectSourceToContain(
      "shouldPrioritizeSingleViewHeaderControls || shouldPrioritizeWidthPressureHint",
    )
    expectSourceToContain(
      "const showSelectedLayoutButtonLabel = shouldCondenseLayoutSelector",
    )
    expectSourceToContain(
      "showSelectedLayoutButtonLabel && tileLayoutMode === mode",
    )
  })

  it("adds the active adaptive state directly onto the selected condensed layout button when that button is the main visible layout affordance", () => {
    expectSourceToContain(
      "const selectedAdaptiveLayoutButtonBadgeLabel =",
    )
    expectSourceToContain(
      "showSelectedLayoutButtonLabel && usesAdaptiveLayoutDescription",
    )
    expectSourceToContain(
      "const showSelectedAdaptiveLayoutBadge =",
    )
    expectSourceToContain(
      "const showSelectedAdaptiveLayoutEmphasis =",
    )
    expectSourceToContain(
      "showThisLayoutButtonLabel &&",
    )
    expectSourceToContain(
      "!!selectedAdaptiveLayoutButtonBadgeLabel",
    )
    expectSourceToContain(
      'data-session-layout-selected-adaptive={\n                        showSelectedAdaptiveLayoutEmphasis ? mode : undefined\n                      }',
    )
    expectSourceToContain(
      'data-session-layout-adaptive-badge={mode}',
    )
    expectSourceToContain(
      "{selectedAdaptiveLayoutButtonBadgeLabel}",
    )
    expectSourceToContain(
      'showSelectedAdaptiveLayoutEmphasis\n                            ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/12 shadow-sm ring-1 ring-inset ring-blue-500/35 dark:text-blue-200"',
    )
    expectSourceToContain(
      'border-current/15 bg-background/80 text-foreground/80 rounded-full border border-dashed px-1.5 py-0.5 text-[9px] leading-none font-medium whitespace-nowrap',
    )
  })

  it("reuses the same session-order state for keyboard reordering from the tile handle", () => {
    expectSourceToContain("function moveSessionOrderEntry(")
    expectSourceToContain("function getSessionDragTargetPosition(")
    expectSourceToContain('return fromIndex < targetIndex ? "after" : "before"')
    expectSourceToContain("const currentSessionOrder = useMemo(")
    expectSourceToContain("const handleKeyboardReorder = useCallback(")
    expectSourceToContain("const currentIndex = currentSessionOrder.indexOf(sessionId)")
    expectSourceToContain('direction === "backward" ? currentIndex - 1 : currentIndex + 1')
    expectSourceToContain("moveSessionOrderEntry(\n        currentSessionOrder,")
    expectSourceToContain(
      'onMoveBackward={(sessionId) => handleKeyboardReorder(sessionId, "backward")}',
    )
    expectSourceToContain(
      'onMoveForward={(sessionId) => handleKeyboardReorder(sessionId, "forward")}',
    )
    expectSourceToContain('canMoveBackward={index > 0}')
    expectSourceToContain(
      'canMoveForward={index < visibleProgressEntries.length - 1}',
    )
  })

  it("keeps drag targets aligned to reorderable sessions and labels whether a drop lands before or after the highlighted tile", () => {
    expectSourceToContain("const draggedSessionIndex = draggedSessionId")
    expectSourceToContain("currentSessionOrder.indexOf(draggedSessionId)")
    expectSourceToContain("index={index}")
    expectSourceToContain("dragTargetIndex === index")
    expectSourceToContain("dragTargetPosition={")
    expectSourceToContain(
      'getSessionDragTargetPosition(draggedSessionIndex, index)',
    )
  })

  it("slims the compact single-view context chip so restore and browse controls keep priority", () => {
    expectSourceToContain(
      "bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center rounded-md border px-2 py-1 text-[11px]",
    )
    expectSourceToContain(
      "const shouldPrioritizeSingleViewHeaderControls = showFocusLayoutHint && isCompactSessionHeader",
    )
    expectSourceToContain("const hiddenFocusLayoutSessionCount =")
    expectSourceToContain("Math.max(0, focusableSessionCount - 1)")
    expectSourceToContain("const focusedLayoutSessionPositionLabel = !showFocusLayoutHint")
    expectSourceToContain(
      'shouldPrioritizeSingleViewHeaderControls ? `${focusedLayoutSessionIndex + 1}/${focusableSessionCount}` : `${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`',
    )
    expectSourceToContain("const hiddenFocusLayoutSessionLabel =")
    expectSourceToContain("getHiddenSessionCountLabel(hiddenFocusLayoutSessionCount")
    expectSourceToContain(
      "isVeryCompactSessionHeader ||\n    shouldPrioritizeSingleViewHeaderControls",
    )
    expectSourceToContain('? "1 other hidden"')
    expectSourceToContain(': `${hiddenSessionCount} others hidden`')
    expectSourceToContain("const hiddenFocusLayoutSessionTitleSuffix =")
    expectSourceToContain('`${hiddenFocusLayoutSessionCount}other${hiddenFocusLayoutSessionCount===1?"session":"sessions"}hidden`')
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
    expectSourceToContain(
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] font-medium",
    )
    expectSourceToContain(
      'shouldPrioritizeSingleViewHeaderControls ? "gap-1" : "gap-1.5"',
    )
    expectSourceToContain("{focusedLayoutSessionPositionLabel}")
    expectSourceToContain("{hiddenFocusLayoutSessionLabel ? (")
    expectSourceToContain("{hiddenFocusLayoutSessionLabel}")
    expectSourceToContain("Showing {focusedLayoutSessionLabel}")
    expectSourceToContain("Browsing sessions")
  })

  it("gives single view an explicit way back to the remembered multi-tile layout", () => {
    expectSourceToContain("{showSingleViewRestore && restoreLayoutOption && (")
    expectSourceToContain("const restoreLayoutActionLabel = restoreLayoutOption")
    expectSourceToContain(
      "const shouldCondenseSingleViewRestoreButton =\n    showSingleViewRestore && isCompactSessionHeader",
    )
    expectSourceToContain("const restoreLayoutButtonLabel = !showSingleViewRestore || !restoreLayoutOption")
    expectSourceToContain(
      'shouldCondenseSingleViewRestoreButton ? "Back" : `Back to ${restoreLayoutOption.label}`',
    )
    expectSourceToContain("getRestoreLayoutActionLabel(")
    expectSourceToContain(
      'return `Return to ${layoutLabel} and show ${hiddenSessionCount} hidden ${hiddenSessionCount === 1 ? "session" : "sessions"}`',
    )
    expectSourceToContain(
      "aria-label={restoreLayoutActionLabel ??`Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`}",
    )
    expectSourceToContain(
      "title={restoreLayoutActionLabel ??`Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`}",
    )
    expectSourceToContain(
      'restoreLayoutButtonLabel ? shouldCondenseSingleViewRestoreButton ? "gap-1 px-1.5" : "gap-1 px-2" : "px-1.5"',
    )
    expectSourceToContain('<ChevronLeft className="h-3.5 w-3.5 shrink-0" />')
    expectSourceToContain("{restoreLayoutButtonLabel ? (")
    expectSourceToContain(
      "<span>{restoreLayoutButtonLabel}</span>",
    )
    expectSourceNotToContain("const showRestoreHiddenSessionBadge =")
    expectSourceNotToContain("const restoreHiddenSessionBadgeLabel =")
    expectSourceNotToContain("{restoreHiddenSessionBadgeLabel ? (")
  })

  it("keeps Single view aware of newly appended sessions without adding a separate header chip", () => {
    expectSourceToContain("function getSingleViewNewSessionBadgeLabel(")
    expectSourceToContain('return count === 1 ? "1 new hidden" : `${count} new hidden`')
    expectSourceToContain("const hiddenNewFocusLayoutSessionCount =")
    expectSourceToContain("recentNewSessionFeedback.sessionIds.filter(")
    expectSourceToContain("sessionId !== maximizedSessionId")
    expectSourceToContain("hiddenNewFocusLayoutSessionCount > 0")
    expectSourceToContain("getSingleViewNewSessionBadgeLabel(hiddenNewFocusLayoutSessionCount")
    expectSourceToContain("const hiddenFocusLayoutSessionTitleParts: string[] = []")
    expectSourceToContain('newly added ${hiddenNewFocusLayoutSessionCount === 1 ? "session" : "sessions"} waiting in Single view')
    expectSourceToContain("const restoreLayoutNewSessionTitleSuffix =")
    expectSourceToContain('including ${hiddenNewFocusLayoutSessionCount} newly added ${hiddenNewFocusLayoutSessionCount === 1 ? "session" : "sessions"}')
    expectSourceToContain("veryCompact: isVeryCompactSessionHeader")
    expectSourceToContain("{hiddenFocusLayoutSessionLabel ? (")
    expectSourceToContain("data-single-view-jump-newest")
  })

  it("lets Single view jump straight to the newest hidden newcomer without restoring the previous layout", () => {
    expectSourceToContain("function getJumpToNewestHiddenSessionActionLabel({")
    expectSourceToContain('"Show newest hidden session in Single view"')
    expectSourceToContain('`Show newest of ${hiddenNewSessionCount} newly added hidden sessions in Single view`')
    expectSourceToContain("const newestHiddenFocusLayoutSessionId =")
    expectSourceToContain("recentNewSessionFeedback.sessionIds.find(")
    expectSourceToContain(
      "sessionId !== maximizedSessionId && focusableSessionIds.includes(sessionId)",
    )
    expectSourceToContain(
      "const newestHiddenFocusLayoutSessionLabel = getFocusableSessionLabel(",
    )
    expectSourceToContain("const showJumpToNewestHiddenSessionAction =")
    expectSourceToContain("const jumpToNewestHiddenSessionActionLabel =")
    expectSourceToContain("getJumpToNewestHiddenSessionActionLabel({")
    expectSourceToContain("const showJumpToNewestHiddenSessionBadge =")
    expectSourceToContain("showJumpToNewestHiddenSessionAction && !showSingleViewPagerLabels")
    expectSourceToContain("const jumpToNewestHiddenSessionBadgeLabel =")
    expectSourceToContain("getSingleViewNewSessionBadgeLabel(hiddenNewFocusLayoutSessionCount, {")
    expectSourceToContain("compact: !isVeryCompactSessionHeader")
    expectSourceToContain("veryCompact: isVeryCompactSessionHeader")
    expectSourceToContain("const handleJumpToNewestHiddenSession = useCallback(() => {")
    expectSourceToContain("setFocusedSessionId(newestHiddenFocusLayoutSessionId)")
    expectSourceToContain("data-single-view-jump-newest")
    expectSourceToContain('aria-label={jumpToNewestHiddenSessionActionLabel}')
    expectSourceToContain('title={jumpToNewestHiddenSessionActionLabel}')
    expectSourceToContain('<ChevronsRight className="h-3.5 w-3.5" />')
    expectSourceToContain('showSingleViewPagerLabels ? <span>Newest</span> : null')
    expectSourceToContain('jumpToNewestHiddenSessionBadgeLabel ? "gap-1 px-1.5 text-[10px]" : "w-7 px-0"')
    expectSourceToContain('{jumpToNewestHiddenSessionBadgeLabel ? (')
    expectSourceToContain('{jumpToNewestHiddenSessionBadgeLabel}')
    expectSourceToContain('border-current/15 bg-background/80 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap')
  })

  it("makes single-view browsing buttons clearer by naming the adjacent session when possible and exposing visible labels on wider headers", () => {
    expectSourceToContain("function getSingleViewBrowseActionLabel({")
    expectSourceToContain(
      'return direction === "previous" ? "Already showing the first session in single view" : "Already showing the last session in single view"',
    )
    expectSourceToContain(
      'return `Show ${direction} session in single view: ${targetSessionLabel}`',
    )
    expectSourceToContain("const getFocusableSessionLabel = useCallback(")
    expectSourceToContain("const previousFocusedSessionId =")
    expectSourceToContain("const nextFocusedSessionId =")
    expectSourceToContain(
      'const previousFocusedSessionActionLabel = getSingleViewBrowseActionLabel({',
    )
    expectSourceToContain(
      'const nextFocusedSessionActionLabel = getSingleViewBrowseActionLabel({',
    )
    expectSourceToContain(
      'const showSingleViewPagerLabels = !isCompactSessionHeader',
    )
    expectSourceToContain('aria-label={previousFocusedSessionActionLabel}')
    expectSourceToContain('title={previousFocusedSessionActionLabel}')
    expectSourceToContain('aria-label={nextFocusedSessionActionLabel}')
    expectSourceToContain('title={nextFocusedSessionActionLabel}')
    expectSourceToContain(
      'showSingleViewPagerLabels ? "gap-1 px-2 text-[11px]" : "w-7 px-0"',
    )
    expectSourceToContain(
      '{showSingleViewPagerLabels ? <span>Previous</span> : null}',
    )
    expectSourceToContain(
      '{showSingleViewPagerLabels ? <span>Next</span> : null}',
    )
  })

  it("describes narrow compare/grid fallbacks as stacked so the current-layout chip stays truthful under width pressure", () => {
    expectSourceToContain("isResponsiveStackedTileLayout")
    expectSourceToContain(
      "const isResponsiveStackedLayout =\n    activeAdaptiveLayoutDescription === RESPONSIVE_STACKED_LAYOUT_DESCRIPTION",
    )
    expectSourceToContain(
      "const hasMeasuredSessionGridWidth = sessionGridMeasurements.containerWidth > 0",
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
      "!!activeAdaptiveLayoutDescription",
    )
    expectSourceToContain(
      "if (visibleTileCount === 1) {",
    )
    expectSourceToContain(
      'return TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION',
    )
    expectSourceToContain(
      'return `Switch to ${LAYOUT_LABELS[mode]} — expanded for one visible session`',
    )
    expectSourceToContain(
      "const activeLayoutDescription =\n    activeAdaptiveLayoutDescription ?? LAYOUT_DESCRIPTIONS[tileLayoutMode]",
    )
    expectSourceToContain(
      "const activeLayoutCompactDescription = isTemporarySingleVisibleLayout",
    )
    expectSourceToContain(
      "const showTileMaximize =\n    !isFocusLayout && !isTemporarySingleVisibleLayout",
    )
    expectSourceToContain("showLayoutDescriptionSuffix ? (")
    expectSourceToContain("showCompactAdaptiveLayoutDescription ? (")
    expectSourceToContain("{activeLayoutCompactDescription}")
    expectSourceToContain("{activeLayoutDescription}")
  })

  it("replaces the generic reorder hint with a brief move confirmation after sessions are reordered", () => {
    expectSourceToContain("interface SessionReorderFeedback")
    expectSourceToContain("function getSessionReorderAnnouncementLabel(")
    expectSourceToContain(
      'return `Moved ${sessionLabel} to position ${position} of ${total}`',
    )
    expectSourceToContain("function getSessionReorderChipLabel(")
    expectSourceToContain('return `Moved ${position}/${total}`')
    expectSourceToContain(
      "const [recentReorderFeedback, setRecentReorderFeedback] =",
    )
    expectSourceToContain("const captureSessionReorderFeedback = useCallback(")
    expectSourceToContain("sessionLabel: getSessionTileLabel(sessionId, movedProgress)")
    expectSourceToContain("position: nextIndex + 1")
    expectSourceToContain("total: nextOrder.length")
    expectSourceToContain(
      "const showReorderFeedback = canReorderTiles && visibleTileCount > 1 && !!recentReorderFeedback",
    )
    expectSourceToContain("const reorderFeedbackAnnouncement = recentReorderFeedback")
    expectSourceToContain("const reorderFeedbackLabel = !recentReorderFeedback")
    expectSourceToContain('role="status"')
    expectSourceToContain('aria-live="polite"')
    expectSourceToContain('{showReorderFeedback && reorderFeedbackAnnouncement ? (')
    expectSourceToContain('{showReorderFeedback && reorderFeedbackLabel ? (')
    expectSourceToContain("title={reorderFeedbackAnnouncement ?? undefined}")
    expectSourceToContain("<CheckCircle2 className=\"h-3.5 w-3.5 shrink-0\" />")
    expectSourceToContain(
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    )
    expectSourceToContain("const timeoutId = window.setTimeout(() => {")
    expectSourceToContain("setRecentReorderFeedback((current) =>")
    expectSourceToContain("setRecentReorderFeedback(null)")
  })

  it("keeps the current tiled order stable when new sessions arrive after initial load", () => {
    expectSourceToContain("keep the current arrangement stable")
    expectSourceToContain("if (aIndex === -1) return 1")
    expectSourceToContain("if (bIndex === -1) return -1")
    expectSourceToContain("const validExistingIds = prev.filter((id) => currentIds.includes(id))")
    expectSourceToContain("return isInitialLoad")
    expectSourceToContain("? [...sortedNewIds, ...validExistingIds]")
    expectSourceToContain(": [...validExistingIds, ...sortedNewIds]")
    expectSourceToContain("append brand-new")
  })

  it("surfaces appended newcomers with a brief header cue and temporary tile highlighting instead of reshuffling the tiled order", () => {
    expectSourceToContain("interface RecentNewSessionFeedback")
    expectSourceToContain("function getNewSessionFeedbackAnnouncementLabel(")
    expectSourceToContain("function getNewSessionFeedbackChipLabel(")
    expectSourceToContain('return `Added ${latestSessionLabel} at the end of the current tile order`')
    expectSourceToContain('return `Added ${count} new sessions at the end of the current tile order`')
    expectSourceToContain('return `${baseAnnouncement}. Hidden while Single view is active`')
    expectSourceToContain("const [recentNewSessionFeedback, setRecentNewSessionFeedback] =")
    expectSourceToContain("if (!isInitialLoad) {")
    expectSourceToContain("sessionIds: sortedNewIds")
    expectSourceToContain("latestSessionLabel: getSessionTileLabel(")
    expectSourceToContain("count: sortedNewIds.length")
    expectSourceToContain("const showNewSessionAnnouncement =")
    expectSourceToContain("const showNewSessionFeedback =")
    expectSourceToContain("!showReorderFeedback &&")
    expectSourceToContain("!shouldPrioritizeWidthPressureHint &&")
    expectSourceToContain("!!recentNewSessionFeedback")
    expectSourceToContain("const newSessionFeedbackAnnouncement = recentNewSessionFeedback")
    expectSourceToContain("hiddenInSingleView: isFocusLayout")
    expectSourceToContain("const newSessionFeedbackLabel = !recentNewSessionFeedback")
    expectSourceToContain("getNewSessionFeedbackChipLabel(recentNewSessionFeedback.count")
    expectSourceToContain("current?.id === recentNewSessionFeedback.id ? null : current")
    expectSourceToContain('{showNewSessionAnnouncement && newSessionFeedbackAnnouncement ? (')
    expectSourceToContain('{showNewSessionFeedback && newSessionFeedbackLabel ? (')
    expectSourceToContain('title={newSessionFeedbackAnnouncement ?? undefined}')
    expectSourceToContain('border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300')
    expectSourceToContain('<Plus className="h-3.5 w-3.5 shrink-0" />')
    expectSourceToContain('isNewlyAdded={recentNewSessionFeedback?.sessionIds.includes(sessionId) ?? false}')
  })

  it("prioritizes compact width-pressure recovery over the visible newcomer chip while keeping the announcement path", () => {
    expectSourceToContain("const shouldPrioritizeWidthPressureHint =")
    expectSourceToContain("!showFocusLayoutHint &&")
    expectSourceToContain("isCompactSessionHeader &&")
    expectSourceToContain("tilePressureRecoveryUrgency !== null")
    expectSourceToContain("const showNewSessionAnnouncement =")
    expectSourceToContain("const showNewSessionFeedback =")
    expectSourceToContain("!shouldPrioritizeWidthPressureHint &&")
    expectSourceToContain('{showNewSessionAnnouncement && newSessionFeedbackAnnouncement ? (')
    expectSourceToContain('{showNewSessionFeedback && newSessionFeedbackLabel ? (')
  })

  it("re-measures the tiled grid when either the sidebar or floating panel changes width so panel resizing follows the same layout-preservation path", () => {
    expectSourceToContain('const sessionGridLayoutChangeKey = `${sidebarWidth ?? "none"}:${panelVisible ? panelWidth ?? "auto" : "hidden"}`')
    expectSourceToContain('layoutChangeKey={sessionGridLayoutChangeKey}')
  })
})
