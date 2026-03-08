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

describe("sessions focus layout", () => {
  it("shows only one tile in focus mode and keeps single-view browsing near the current position when a session disappears", () => {
    expectSourceToContain("const focusableSessionIds = useMemo(")
    expectSourceToContain(
      "...allProgressEntries.map(([sessionId]) => sessionId)",
    )
    expectSourceToContain("function getFocusLayoutFallbackSessionId(")
    expectSourceToContain(
      "const previousFocusableSessionIdsRef = useRef<string[]>(focusableSessionIds)",
    )
    expectSourceToContain("const hasExplicitFocusedSession =")
    expectSourceToContain("focusableSessionIds.includes(focusedSessionId)")
    expectSourceToContain("const fallbackFocusedSessionId = useMemo(")
    expectSourceToContain(
      "const previousIndex = previousFocusableSessionIds.indexOf(",
    )
    expectSourceToContain("missingFocusedSessionId")
    expectSourceToContain(
      "Math.min(previousIndex, focusableSessionIds.length - 1)",
    )
    expectSourceToContain("focusableSessionIds[0] ??")
    expectSourceToContain("const maximizedSessionId = useMemo(() => {")
    expectSourceToContain("if (!isFocusLayout) return null")
    expectSourceToContain("return fallbackFocusedSessionId")
    expectSourceToContain("setFocusedSessionId(maximizedSessionId)")
    expectSourceToContain("return allProgressEntries.filter(")
    expectSourceToContain("([sessionId]) => sessionId === maximizedSessionId")
  })

  it("replaces reorder cues with a focused-view summary while one-up layout is active", () => {
    expectSourceToContain(
      "const canReorderTiles = !isFocusLayout && allProgressEntries.length > 1",
    )
    expectSourceToContain(
      "const focusedLayoutSessionIndex = maximizedSessionId",
    )
    expectSourceToContain("focusableSessionIds.indexOf(maximizedSessionId)")
    expectSourceToContain("const showFocusLayoutHint =")
    expectSourceToContain(
      "isFocusLayout && focusableSessionCount > 1 && !!maximizedSessionId",
    )
    expectSourceToContain("const focusedLayoutSessionLabel = useMemo(() => {")
    expectSourceToContain("const showFocusedSessionLabel =")
    expectSourceToContain(
      "!!focusedLayoutSessionLabel &&\n    (!isCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)",
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
    expectSourceToContain("showFocusedSessionLabel ||")
    expectSourceToContain("showBrowsingSessionsLabel)")
    expectSourceToContain("const showFocusedLayoutModeLabel =")
    expectSourceToContain("showFocusedLayoutSummaryChip && isCompactSessionHeader")
    expectSourceToContain('const focusedLayoutModeLabel = showFocusedLayoutModeLabel ? "Single" : null')
    expectSourceToContain("const focusedLayoutCountLabel =")
    expectSourceToContain(
      'isCompactSessionHeader ? `${focusedLayoutSessionIndex + 1}/${focusableSessionCount}` : `${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`',
    )
    expectSourceToContain("const focusedLayoutNeighborContextLabel = useMemo(() => {")
    expectSourceToContain("getSessionReorderNeighborContextLabel(")
    expectSourceToContain("getSessionReorderAnnouncementContext(")
    expectSourceToContain("focusableSessionIds,")
    expectSourceToContain("maximizedSessionId,")
    expectSourceToContain("focusableSessionLabelById,")
    expectSourceToContain("const focusedLayoutNeighborContextDisplayLabel =")
    expectSourceToContain("focusedLayoutNeighborContextLabel.charAt(0).toUpperCase()")
    expectSourceToContain("const showFocusedLayoutNeighborContext =")
    expectSourceToContain("!!focusedLayoutNeighborContextDisplayLabel && !isCompactSessionHeader")
    expectSourceToContain("const showFocusedLayoutCountBadge =")
    expectSourceToContain(
      '!focusedSessionBrowsePositionLabel',
    )
    expectSourceToContain("const showBrowsingSessionsLabel =")
    expectSourceToContain(
      "!focusedLayoutSessionLabel &&\n    (!isCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)",
    )
    expectSourceToContain(
      "bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]",
    )
    expectSourceToContain('if (sessionId.startsWith("pending-")) {')
    expectSourceToContain('return "Continuing session"')
    expectSourceToContain("const focusableSessionLabelById = useMemo(() => {")
    expectSourceToContain('labels.set(')
    expectSourceToContain('getSessionTileLabel(pendingSessionId, pendingProgress)')
    expectSourceToContain(
      "return focusableSessionLabelById.get(maximizedSessionId) ?? null",
    )
    expectSourceToContain("{showFocusedLayoutSummaryChip && (")
    expectSourceToContain("{focusedLayoutModeLabel}")
    expectSourceToContain("{focusedLayoutCountLabel}")
    expectSourceToContain("Showing {focusedLayoutSessionLabel}")
    expectSourceToContain("Browsing sessions")
    expectSourceToContain(
      'Single view: ${focusedLayoutSessionLabel} (${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}, ${focusedLayoutNeighborContextLabel})',
    )
    expectSourceToContain("{showFocusedLayoutNeighborContext ? (")
    expectSourceToContain('className="text-muted-foreground/75 max-w-[200px] truncate"')
    expectSourceToContain("title={focusedLayoutNeighborContextDisplayLabel}")
    expectSourceToContain("{focusedLayoutNeighborContextDisplayLabel}")
    expectSourceToContain("isDraggable={canReorderTiles}")
  })

  it("lets users browse previous and next sessions without leaving single view", () => {
    expectSourceToContain("const handleStepFocusedSession = useCallback(")
    expectSourceToContain(
      "const singleViewReturnSessionIdRef = useRef<string | null>(null)",
    )
    expectSourceToContain(
      "const singleViewReturnTileWidthRef = useRef<number | null>(null)",
    )
    expectSourceToContain(
      "const singleViewReturnTileHeightRef = useRef<number | null>(null)",
    )
    expectSourceToContain("const currentVisibleTileCount = (")
    expectSourceToContain(
      "Object.values(sessionRefs.current) as Array<HTMLDivElement | null>",
    )
    expectSourceToContain("const getCurrentVisibleTileHeight = useCallback((): number | null => {")
    expectSourceToContain("const currentVisibleTileHeight = getCurrentVisibleTileHeight()")
    expectSourceToContain("const currentTargetTileHeight = calculateTileHeight(")
    expectSourceToContain("const shouldCaptureSingleViewReturnTileWidth =")
    expectSourceToContain("const shouldCaptureSingleViewReturnTileHeight =")
    expectSourceToContain(
      'Math.abs(currentVisibleTileHeight - currentTargetTileHeight) > 1',
    )
    expectSourceToContain('nextMode === "1x1" &&')
    expectSourceToContain("!shouldLockTileWidth(")
    expectSourceToContain(
      "singleViewReturnTileWidthRef.current =",
    )
    expectSourceToContain(
      "singleViewReturnTileHeightRef.current =",
    )
    expectSourceToContain(
      "shouldCaptureSingleViewReturnTileWidth",
    )
    expectSourceToContain(
      "? getCurrentVisibleTileWidth()",
    )
    expectSourceToContain(
      "shouldCaptureSingleViewReturnTileHeight",
    )
    expectSourceToContain(
      "? currentVisibleTileHeight",
    )
    expectSourceToContain("const shouldResetTileSize = nextMode === \"1x1\"")
    expectSourceToContain("if (shouldResetTileSize) {")
    expectSourceToContain('clearPersistedSize("session-tile")')
    expectSourceToContain("setTileResetKey((prev) => prev + 1)")
    expectSourceToContain(
      "const showSingleViewRestore = isFocusLayout && !!restoreLayoutOption",
    )
    expectSourceToContain(
      'tileLayoutMode === "1x1" && nextMode !== "1x1"',
    )
    expectSourceToContain(
      "const sessionIdToRevealOnRestore =",
    )
    expectSourceToContain(
      "singleViewReturnSessionIdRef.current = maximizedSessionId",
    )
    expectSourceToContain(
      "layoutRestoreWidth={singleViewReturnTileWidthRef.current}",
    )
    expectSourceToContain(
      "layoutRestoreHeight={singleViewReturnTileHeightRef.current}",
    )
    expectSourceToContain(
      "scrollSessionTileIntoView(sessionIdToRevealOnRestore)",
    )
    expectSourceToContain("onClick={handleRestorePreviousLayout}")
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
      'const showDedicatedSingleViewRestoreButton =',
    )
    expectSourceToContain(
      'showSingleViewRestore && (!isCompactSessionHeader || isVeryCompactSessionHeader)',
    )
    expectSourceToContain(
      'const singleViewRestoreLabel =',
    )
    expectSourceToContain(
      '!showDedicatedSingleViewRestoreButton || !restoreLayoutOption',
    )
    expectSourceToContain(
      'isVeryCompactSessionHeader ? "Back" : `Back to ${restoreLayoutOption.label}`',
    )
    expectSourceToContain("const isSingleViewRestoreTarget =")
    expectSourceToContain(
      'isFocusLayout && mode !== "1x1" && restoreLayoutOption?.mode === mode',
    )
    expectSourceToContain(
      'Switch from Single view to ${LAYOUT_LABELS[mode]} and keep ${singleViewRestoreFocusContext}',
    )
    expectSourceToContain(
      'Return to ${LAYOUT_LABELS[mode]} (last tiled layout) and keep ${singleViewRestoreFocusContext}',
    )
    expectSourceToContain(
      'const promoteSingleViewRestoreTargetInLayoutGroup =',
    )
    expectSourceToContain(
      'const showSingleViewRestoreTargetBadge =',
    )
    expectSourceToContain(
      'const singleViewRestoreTargetBadgeLabel = !showSingleViewRestoreTargetBadge',
    )
    expectSourceToContain(
      'isCompactSessionHeader ? "Back" : "Back target"',
    )
    expectSourceToContain('Back target')
    expectSourceToContain(
      "{singleViewRestoreLabel ? <span>{singleViewRestoreLabel}</span> : null}",
    )
    expectSourceToContain("const layoutPressureActionButtons = [")
    expectSourceToContain(
      "const shouldDeferLayoutPressureActionsInCompactHeader =",
    )
    expectSourceToContain(
      "isCompactSessionHeader && layoutPressureActionButtons.length > 0",
    )
    expectSourceToContain(
      "const focusedSessionBrowseControls = canBrowseFocusedSessions ? (",
    )
    expectSourceToContain("const sessionTileModeControls = (")
    expectSourceToContain('className="flex shrink-0 items-center gap-1"')
    expectSourceToContain("{singleViewRestoreButton}")
    expectSourceToContain("{sessionTileLayoutButtonGroup}")
    expectSourceToContain('aria-label="Browse sessions in single view"')
    expectSourceToContain("const previousFocusedSessionId =")
    expectSourceToContain("const nextFocusedSessionId =")
    expectSourceToContain("const previousFocusedSessionLabel =")
    expectSourceToContain("const nextFocusedSessionLabel =")
    expectSourceToContain(
      'const previousFocusedSessionBrowseTitle = previousFocusedSessionLabel',
    )
    expectSourceToContain(
      'const nextFocusedSessionBrowseTitle = nextFocusedSessionLabel',
    )
    expectSourceToContain(
      'const showFocusedSessionBrowseLabel =',
    )
    expectSourceToContain('const focusedSessionBrowsePositionLabel =')
    expectSourceToContain(
      'focusedLayoutCountLabel &&\n    (isVeryCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)',
    )
    expectSourceToContain(
      'canBrowseFocusedSessions &&\n    (!!focusedLayoutSessionLabel || !!focusedSessionBrowsePositionLabel) &&\n    (!showFocusedSessionLabel || !!focusedSessionBrowsePositionLabel)',
    )
    expectSourceToContain(
      'const focusedSessionBrowseLabel = !showFocusedSessionBrowseLabel',
    )
    expectSourceToContain(
      'focusedSessionBrowsePositionLabel',
    )
    expectSourceToContain(
      '{showFocusedLayoutCountBadge ? (',
    )
    expectSourceToContain(
      'onClick={() => handleStepFocusedSession("previous")}',
    )
    expectSourceToContain('aria-label={previousFocusedSessionBrowseTitle}')
    expectSourceToContain('title={previousFocusedSessionBrowseTitle}')
    expectSourceToContain('title={focusedLayoutSessionLabel}')
    expectSourceToContain('{focusedSessionBrowseLabel}')
    expectSourceToContain('onClick={() => handleStepFocusedSession("next")}')
    expectSourceToContain('aria-label={nextFocusedSessionBrowseTitle}')
    expectSourceToContain('title={nextFocusedSessionBrowseTitle}')
    expectSourceToContain("{focusedSessionBrowseControls}")
    expectSourceToContain(
      "{shouldDeferLayoutPressureActionsInCompactHeader\n                ? null\n                : visibleLayoutPressureActionButtons}",
    )
    expectSourceToContain(
      "{shouldDeferLayoutPressureActionsInCompactHeader\n                ? visibleLayoutPressureActionButtons\n                : null}",
    )
  })

  it("briefly marks the restored tile when leaving single view so the returned layout is easier to re-orient", () => {
    expectSourceToContain("function getSingleViewReturnAnnouncement(")
    expectSourceToContain(
      'return `Returned to ${layoutLabel}. Kept ${sessionLabel} visible.`',
    )
    expectSourceToContain(
      'const RECENT_SINGLE_VIEW_RETURN_VISUAL_CUE_DURATION_MS = 1_800',
    )
    expectSourceToContain(
      'const [recentlyRestoredFromSingleViewSessionId, setRecentlyRestoredFromSingleViewSessionId] = useState<string | null>(null)',
    )
    expectSourceToContain(
      'const recentSingleViewReturnVisualCueTimeoutRef = useRef<number | null>(null)',
    )
    expectSourceToContain('const clearRecentSingleViewReturnVisualCue = useCallback(() => {')
    expectSourceToContain('setRecentlyRestoredFromSingleViewSessionId(null)')
    expectSourceToContain('const showRecentSingleViewReturnVisualCue = useCallback(')
    expectSourceToContain('setRecentlyRestoredFromSingleViewSessionId(sessionId)')
    expectSourceToContain(
      'recentSingleViewReturnVisualCueTimeoutRef.current = window.setTimeout(() => {',
    )
    expectSourceToContain('clearRecentSingleViewReturnVisualCue()')
    expectSourceToContain(
      'showRecentSingleViewReturnVisualCue(sessionIdToRevealOnRestore)',
    )
    expectSourceToContain(
      'const recentSingleViewReturnAnnouncementLabel = useMemo(() => {',
    )
    expectSourceToContain(
      '!recentlyRestoredFromSingleViewSessionId ||\n      tileLayoutMode === "1x1"',
    )
    expectSourceToContain(
      'focusableSessionLabelById.get(recentlyRestoredFromSingleViewSessionId)',
    )
    expectSourceToContain(
      'const baseAnnouncement = getSingleViewReturnAnnouncement(\n      tileLayoutMode,\n      keptVisibleSessionLabel,\n    )',
    )
    expectSourceToContain(
      'type SingleViewRestoreAdjustment = "width" | "height" | "size"',
    )
    expectSourceToContain("function getSingleViewRestoreAdjustment(")
    expectSourceToContain(
      'const RECENT_SINGLE_VIEW_RESTORE_ADJUSTMENT_CUE_DURATION_MS = 2_400',
    )
    expectSourceToContain(
      'const [recentSingleViewRestoreAdjustment, setRecentSingleViewRestoreAdjustment] =',
    )
    expectSourceToContain(
      'const recentSingleViewRestoreAdjustmentTimeoutRef = useRef<number | null>(null)',
    )
    expectSourceToContain(
      'const clearRecentSingleViewRestoreAdjustmentCue = useCallback(() => {',
    )
    expectSourceToContain(
      'const showRecentSingleViewRestoreAdjustmentCue = useCallback(',
    )
    expectSourceToContain('const isLeavingSingleView = tileLayoutMode === "1x1" && nextMode !== "1x1"')
    expectSourceToContain('const nextTargetTileWidth = isLeavingSingleView')
    expectSourceToContain('const nextTargetTileHeight = isLeavingSingleView')
    expectSourceToContain('getSingleViewLayoutRestoreWidth(')
    expectSourceToContain('getSingleViewLayoutRestoreHeight(')
    expectSourceToContain('visibleTileCount,')
    expectSourceToContain('const singleViewRestoreAdjustment = isLeavingSingleView')
    expectSourceToContain(
      'showRecentSingleViewRestoreAdjustmentCue(singleViewRestoreAdjustment)',
    )
    expectSourceToContain(
      'if (tileLayoutMode === "1x1" || !recentSingleViewRestoreAdjustment) {',
    )
    expectSourceToContain(
      'return `${baseAnnouncement} ${getSingleViewRestoreAdjustmentAnnouncement(tileLayoutMode, recentSingleViewRestoreAdjustment)}`',
    )
    expectSourceToContain(
      'const recentSingleViewRestoreAdjustmentHint =',
    )
    expectSourceToContain('getSingleViewRestoreAdjustmentHint(')
    expectSourceToContain('{recentSingleViewReturnAnnouncementLabel}')
    expectSourceToContain(
      '{showRecentSingleViewRestoreAdjustmentHint &&\n                recentSingleViewRestoreAdjustmentHint && (',
    )
    expectSourceToContain('{recentSingleViewRestoreAdjustmentHint.label}')
    expectSourceToContain('{recentSingleViewRestoreAdjustmentHint.badgeLabel}')
    expectSourceToContain(
      'isRecentlyRestoredFromSingleView={recentlyRestoredFromSingleViewSessionId === pendingSessionId}',
    )
    expectSourceToContain(
      'isRecentlyRestoredFromSingleView={recentlyRestoredFromSingleViewSessionId === sessionId}',
    )
  })
})
