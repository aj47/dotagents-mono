import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const acpSessionBadgeSource = readFileSync(new URL("./acp-session-badge.tsx", import.meta.url), "utf8")
const messageQueuePanelSource = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")
const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")
const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")

describe("agent progress tile layout", () => {
  it("wraps the tile header chrome for narrow session widths and zoomed text", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-start gap-2 px-3 py-2 border-b bg-muted/30 flex-shrink-0 cursor-pointer"'
    )
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-start gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"')
  })

  it("wraps the tile footer metadata row and preserves trailing status visibility", () => {
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center justify-between gap-2"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"')
    expect(agentProgressSource).toContain('<ACPSessionBadge info={acpSessionInfo} compact={shouldUseCompactTileFooter} className="min-w-0 max-w-full" />')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap">Step')
  })

  it("turns compact tile footers into labeled chips so narrow grid states stay scannable instead of relying on tiny unlabeled metadata", () => {
    expect(agentProgressSource).toContain('function getCompactTileContextUsagePercent(')
    expect(agentProgressSource).toContain('function getCompactTileStatusLabel({')
    expect(agentProgressSource).toContain('return "Needs approval"')
    expect(agentProgressSource).toContain('return "Snoozed"')
    expect(agentProgressSource).toContain('return `Working · ${currentIteration}/${isFinite(maxIterations) ? maxIterations : "∞"}`')
    expect(agentProgressSource).toContain('const shouldShowCompactTileContextChip =')
    expect(agentProgressSource).toContain('const shouldShowCompactTileIdentityRow =')
    expect(agentProgressSource).toContain('className="space-y-1.5"')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-1.5"')
    expect(agentProgressSource).toContain('className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground/80"')
    expect(agentProgressSource).toContain('Context ${compactTileContextUsagePercent}%')
    expect(agentProgressSource).toContain('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap')
    expect(agentProgressSource).toContain('<ACPSessionBadge info={acpSessionInfo} compact={shouldUseCompactTileFooter} className="min-w-0 max-w-full" />')
  })

  it("hands non-focused tiles a compact follow-up composer so the footer stays lighter in dense layouts", () => {
    expect(agentProgressSource).toContain(
      'preferCompact={!isFocused && !isExpanded}'
    )
    expect(agentProgressSource).toContain(
      'onRequestFocus={onFocus}'
    )
  })

  it("separates live tile state from recent history in compact transcript previews so active streaming/input cues do not blend into older updates", () => {
    expect(agentProgressSource).toContain(
      'const tilePreviewCurrentStateItems = shouldLimitTileTranscript'
    )
    expect(agentProgressSource).toContain(
      'function getHiddenTileHistoryLabel('
    )
    expect(agentProgressSource).toContain(
      'function getHiddenTileHistoryTitle('
    )
    expect(agentProgressSource).toContain(
      'const hiddenTileHistoryLabel ='
    )
    expect(agentProgressSource).toContain(
      '? `${hiddenItemCount} hidden`'
    )
    expect(agentProgressSource).toContain(
      ': `${hiddenItemCount} earlier hidden`'
    )
    expect(agentProgressSource).toContain(
      'Live now'
    )
    expect(agentProgressSource).toContain(
      'Recent activity'
    )
    expect(agentProgressSource).toContain(
      'tilePreviewCurrentStateItems.map((item, index) =>'
    )
    expect(agentProgressSource).toContain(
      'tilePreviewRecentItems'
    )
  })

  it("reduces compact transcript preview depth once a tile is narrow so transcript chrome does not crowd the rest of the tile", () => {
    expect(agentProgressSource).toContain(
      'const COMPACT_TILE_TRANSCRIPT_PREVIEW_ITEMS = 4'
    )
    expect(agentProgressSource).toContain(
      'const tileTranscriptPreviewItemLimit = shouldLimitTileTranscript'
    )
    expect(agentProgressSource).toContain(
      '? COMPACT_TILE_TRANSCRIPT_PREVIEW_ITEMS'
    )
    expect(agentProgressSource).toContain(
      'displayItems.slice(-tileTranscriptPreviewItemLimit)'
    )
    expect(agentProgressSource).toContain(
      'tileTranscriptPreviewItemLimit - tilePreviewCurrentStateItems.length'
    )
  })

  it("turns hidden compact transcript notices into an explicit focus affordance so clipped tile history is easier to recover", () => {
    expect(agentProgressSource).toContain(
      'const handleCompactTranscriptFocus = (e: React.MouseEvent) => {'
    )
    expect(agentProgressSource).toContain(
      'onFocus?.()'
    )
    expect(agentProgressSource).toContain(
      'const hiddenTileHistoryTitleText ='
    )
    expect(agentProgressSource).toContain(
      'getHiddenTileHistoryTitle(hiddenTileHistoryItemCount)'
    )
    expect(agentProgressSource).toContain(
      'const hiddenTileHistoryButtonLabel = isCompactTileChrome ? "Focus" : "Focus tile"'
    )
    expect(agentProgressSource).toContain(
      'const hiddenTileHistoryButtonTitle = "Focus tile to show the full transcript"'
    )
    expect(agentProgressSource).toContain(
      'const showCompactRecentActivityMetaRow ='
    )
    expect(agentProgressSource).toContain(
      'const showCompactRecentActivitySection = shouldShowSeparatedTilePreview'
    )
    expect(agentProgressSource).toContain(
      'rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px]'
    )
    expect(agentProgressSource).toContain(
      'title={hiddenTileHistoryTitleText ?? undefined}'
    )
    expect(agentProgressSource).toContain(
      '? "px-1.5 py-0.5 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      ': "px-2 py-1 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      'Recent activity'
    )
    expect(agentProgressSource).toContain(
      'aria-label={hiddenTileHistoryButtonTitle}'
    )
  })

  it("re-anchors the transcript to the latest activity when a compact tile becomes focused or expanded", () => {
    expect(agentProgressSource).toContain(
      'const isCompactTileTranscriptMode = variant === "tile" && !isFocused && !isExpanded'
    )
    expect(agentProgressSource).toContain(
      'const wasCompactTileTranscriptModeRef = useRef(isCompactTileTranscriptMode)'
    )
    expect(agentProgressSource).toContain(
      'const wasCompactTileTranscriptMode = wasCompactTileTranscriptModeRef.current'
    )
    expect(agentProgressSource).toContain(
      'wasCompactTileTranscriptModeRef.current = isCompactTileTranscriptMode'
    )
    expect(agentProgressSource).toContain(
      'if (!wasCompactTileTranscriptMode || isCompactTileTranscriptMode) return'
    )
    expect(agentProgressSource).toContain('clearPendingInitialScrollAttempts()')
    expect(agentProgressSource).toContain('shouldAutoScrollRef.current = true')
    expect(agentProgressSource).toContain('scrollContainer.scrollTop = scrollContainer.scrollHeight')
    expect(agentProgressSource).toContain('requestAnimationFrame(() => {')
    expect(agentProgressSource).toContain('setShouldAutoScroll(true)')
    expect(agentProgressSource).toContain('setIsUserScrolling(false)')
  })

  it("lets the tile chat-summary switcher and delegation preview adapt to narrow widths", () => {
    expect(agentProgressSource).toContain(
      'const TILE_TAB_COMPACT_WIDTH = 360'
    )
    expect(agentProgressSource).toContain(
      'const { ref: tileContainerRef, isCompact: isCompactTileChrome } ='
    )
    expect(agentProgressSource).toContain(
      'useCompactWidth<HTMLDivElement>(TILE_TAB_COMPACT_WIDTH)'
    )
    expect(agentProgressSource).toContain(
      'const shouldUseCompactTileTabs = isCompactTileChrome'
    )
    expect(agentProgressSource).toContain(
      'const showTileTabLabels = !shouldUseCompactTileTabs'
    )
    expect(agentProgressSource).toContain(
      'const chatTabActionLabel ='
    )
    expect(agentProgressSource).toContain(
      'const summaryTabActionLabel ='
    )
    expect(agentProgressSource).toContain(
      'ref={tileContainerRef}'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5"'
    )
    expect(agentProgressSource).toContain(
      '"inline-flex min-w-0 max-w-full items-center rounded-md py-1 text-xs font-medium transition-colors"'
    )
    expect(agentProgressSource).toContain(
      'shouldUseCompactTileTabs ? "gap-0.5 px-1.5" : "gap-1 px-2"'
    )
    expect(agentProgressSource).toContain(
      'aria-label={chatTabActionLabel}'
    )
    expect(agentProgressSource).toContain(
      'title={chatTabActionLabel}'
    )
    expect(agentProgressSource).toContain(
      'aria-label={summaryTabActionLabel}'
    )
    expect(agentProgressSource).toContain(
      'title={summaryTabActionLabel}'
    )
    expect(agentProgressSource).toContain(
      '{showTileTabLabels ? <span className="truncate">Chat</span> : null}'
    )
    expect(agentProgressSource).toContain(
      '{showTileTabLabels ? <span className="truncate">Summary</span> : null}'
    )
    expect(agentProgressSource).toContain(
      'shouldUseCompactTileTabs ? "ml-0.5 min-w-4 justify-center" : "ml-1"'
    )
    expect(agentProgressSource).toContain(
      '{summaryCount}'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 flex flex-1 items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-600 dark:text-gray-400"'
    )
    expect(agentProgressSource).toContain(
      'const shouldUseCompactTileSummaryView = !isFocused && !isExpanded'
    )
    expect(agentProgressSource).toContain(
      'shouldUseCompactTileSummaryView ? "p-2.5" : "p-3"'
    )
    expect(agentProgressSource).toContain(
      'compact={shouldUseCompactTileSummaryView}'
    )
  })

  it("moves lower-priority tile header actions into an overflow menu when narrow or collapsed tiles would otherwise show both focus and minimize buttons", () => {
    expect(agentProgressSource).toContain(
      'const tileOverflowActionCount ='
    )
    expect(agentProgressSource).toContain(
      'Number(!!onExpand && !isExpanded) + Number(!isComplete && !isSnoozed)'
    )
    expect(agentProgressSource).toContain(
      'const shouldOverflowCollapsedTerminalTileAction =\n      isCollapsed && (!isComplete || !!onDismiss)'
    )
    expect(agentProgressSource).toContain(
      'const shouldUseCollapsedTileOverflowMenu ='
    )
    expect(agentProgressSource).toContain(
      '(isCollapsed && tileOverflowActionCount > 1) ||\n      shouldOverflowCollapsedTerminalTileAction'
    )
    expect(agentProgressSource).toContain(
      'const shouldUseCompactTileOverflowMenu ='
    )
    expect(agentProgressSource).toContain(
      'isCompactTileChrome && tileOverflowActionCount > 1'
    )
    expect(agentProgressSource).toContain(
      'const shouldUseTileOverflowMenu ='
    )
    expect(agentProgressSource).toContain(
      'shouldUseCompactTileOverflowMenu || shouldUseCollapsedTileOverflowMenu'
    )
    expect(agentProgressSource).toContain(
      'onExpand && !isExpanded && !shouldUseTileOverflowMenu'
    )
    expect(agentProgressSource).toContain(
      '!isComplete && !isSnoozed && !shouldUseTileOverflowMenu'
    )
    expect(agentProgressSource).toContain(
      'isCompactTileChrome && "gap-0.5"'
    )
    expect(agentProgressSource).toContain(
      'isCompactTileChrome ? "px-1.5 py-0 text-[10px]" : "text-xs"'
    )
    expect(agentProgressSource).toContain(
      '<DropdownMenuTrigger asChild>'
    )
    expect(agentProgressSource).toContain(
      'const tileOverflowMenuTitle ='
    )
    expect(agentProgressSource).toContain(
      'onExpand && !isExpanded ? "Single view and more actions" : "More actions"'
    )
    expect(agentProgressSource).toContain(
      'const tileOverflowMenuAriaLabel ='
    )
    expect(agentProgressSource).toContain(
      '"Single view and more tile actions"'
    )
    expect(agentProgressSource).toContain(
      'title={tileOverflowMenuTitle}'
    )
    expect(agentProgressSource).toContain(
      'aria-label={tileOverflowMenuAriaLabel}'
    )
    expect(agentProgressSource).toContain(
      '<MoreHorizontal className="h-3 w-3" />'
    )
    expect(agentProgressSource).toContain(
      '<DropdownMenuContent'
    )
    expect(agentProgressSource).toContain(
      'align="end"'
    )
    expect(agentProgressSource).toContain(
      'onCloseAutoFocus={(e) => e.preventDefault()}'
    )
    expect(agentProgressSource).toContain(
      'const showTileOverflowSecondaryActionSeparator ='
    )
    expect(agentProgressSource).toContain(
      'shouldOverflowCollapsedTerminalTileAction &&\n      (!!onExpand && !isExpanded || (!isComplete && !isSnoozed))'
    )
    expect(agentProgressSource).toContain(
      'const expandTileActionLabel = "Open in Single view"'
    )
    expect(agentProgressSource).toContain(
      'const expandTileActionTitle = "Open this session in Single view"'
    )
    expect(agentProgressSource).toContain(
      'title={expandTileActionTitle}'
    )
    expect(agentProgressSource).toContain(
      'aria-label={expandTileActionTitle}'
    )
    expect(agentProgressSource).toContain(
      '<span>{expandTileActionLabel}</span>'
    )
    expect(agentProgressSource).toContain(
      '<span>Minimize session</span>'
    )
    expect(agentProgressSource).toContain(
      '<DropdownMenuSeparator />'
    )
    expect(agentProgressSource).toContain(
      'className="text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20"'
    )
    expect(agentProgressSource).toContain(
      '<span>Stop agent</span>'
    )
    expect(agentProgressSource).toContain(
      '<span>Dismiss session</span>'
    )
  })

  it("keeps the tile-level Single-view affordance readable across roomy and compact direct-action states instead of falling back to icon-only chrome", () => {
    expect(agentProgressSource).toContain(
      'const expandTileButtonVisibleLabel = "Single view"'
    )
    expect(agentProgressSource).toContain(
      'const compactExpandTileButtonVisibleLabel = "Single"'
    )
    expect(agentProgressSource).toContain(
      'const showCompactExpandTileButtonLabel ='
    )
    expect(agentProgressSource).toContain(
      'isCompactTileChrome && !shouldUseTileOverflowMenu'
    )
    expect(agentProgressSource).toContain(
      'const showExpandTileButtonLabel ='
    )
    expect(agentProgressSource).toContain(
      '!isCompactTileChrome || showCompactExpandTileButtonLabel'
    )
    expect(agentProgressSource).toContain(
      'const currentExpandTileButtonVisibleLabel ='
    )
    expect(agentProgressSource).toContain(
      'size={showExpandTileButtonLabel ? "sm" : "icon"}'
    )
    expect(agentProgressSource).toContain(
      'showCompactExpandTileButtonLabel'
    )
    expect(agentProgressSource).toContain(
      '? "gap-1 px-1.5 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      ': "gap-1 px-2 text-[11px]"'
    )
    expect(agentProgressSource).toContain(
      '{showExpandTileButtonLabel ? ('
    )
    expect(agentProgressSource).toContain(
      '<span>{currentExpandTileButtonVisibleLabel}</span>'
    )
  })

  it("makes collapsed tiles easier to understand and expand without relying on hover text alone", () => {
    expect(agentProgressSource).toContain(
      'const shouldOverflowCollapsedTerminalTileAction =\n      isCollapsed && (!isComplete || !!onDismiss)'
    )
    expect(agentProgressSource).toContain(
      'const shouldUseCollapsedTileOverflowMenu =\n      (isCollapsed && tileOverflowActionCount > 1) ||\n      shouldOverflowCollapsedTerminalTileAction'
    )
    expect(agentProgressSource).toContain(
      'const collapseTileActionLabel = isCollapsed ? "Expand tile" : "Collapse tile"'
    )
    expect(agentProgressSource).toContain(
      'const collapseTileButtonVisibleLabel =\n      isCollapsed && !isCompactTileChrome ? "Expand" : null'
    )
    expect(agentProgressSource).toContain(
      'const collapsedTileHintLabel =\n      isCollapsed && !isCompactTileChrome ? "Click header to expand" : null'
    )
    expect(agentProgressSource).toContain(
      '{!shouldOverflowCollapsedTerminalTileAction && !isComplete ? ('
    )
    expect(agentProgressSource).toContain(
      ') : !shouldOverflowCollapsedTerminalTileAction && onDismiss ? ('
    )
    expect(agentProgressSource).toContain(
      'const showCollapsedTileMetaRow = !!profileName || isCollapsed'
    )
    expect(agentProgressSource).toContain(
      'isCollapsed ? "h-auto" : "h-full"'
    )
    expect(agentProgressSource).toContain(
      'isCollapsed\n              ? "border-border/60 bg-slate-50/85 px-3 py-1.5 dark:bg-slate-900/40"\n              : "border-b bg-muted/30 px-3 py-2"'
    )
    expect(agentProgressSource).toContain(
      'className="inline-flex shrink-0 items-center rounded-full border border-slate-300/80 bg-background/80 px-1.5 py-0.5 font-medium text-slate-700 dark:border-slate-700/80 dark:text-slate-300"'
    )
    expect(agentProgressSource).toContain('Collapsed')
    expect(agentProgressSource).toContain('Click header to expand')
    expect(agentProgressSource).toContain(
      'className="truncate text-slate-600 dark:text-slate-300/80"'
    )
    expect(agentProgressSource).toContain(
      'size={collapseTileButtonVisibleLabel ? "sm" : "icon"}'
    )
    expect(agentProgressSource).toContain(
      'collapseTileButtonVisibleLabel ? "gap-1 px-2 text-[11px]" : "w-6"'
    )
    expect(agentProgressSource).toContain('title={collapseTileActionLabel}')
    expect(agentProgressSource).toContain('aria-label={collapseTileActionLabel}')
    expect(agentProgressSource).toContain('aria-expanded={!isCollapsed}')
    expect(agentProgressSource).toContain('{collapseTileButtonVisibleLabel ? (')
    expect(agentProgressSource).toContain('<span>{collapseTileButtonVisibleLabel}</span>')
  })

  it("caps ACP session badges to the available tile width and lets compact tile footers collapse ACP metadata to one primary badge", () => {
    expect(acpSessionBadgeSource).toContain(
      'compact?: boolean'
    )
    expect(acpSessionBadgeSource).toContain(
      'export function ACPSessionBadge({ info, compact = false, className }: ACPSessionBadgeProps)'
    )
    expect(acpSessionBadgeSource).toContain(
      'const shouldHideModelBadgeInCompactMode = compact && !!agentLabel'
    )
    expect(acpSessionBadgeSource).toContain(
      '"inline-flex max-w-full min-w-0 flex-wrap items-center cursor-help"'
    )
    expect(acpSessionBadgeSource).toContain(
      'compact ? "gap-1" : "gap-1.5"'
    )
    expect(acpSessionBadgeSource).toContain("function getConfigOptionLabel")
    expect(acpSessionBadgeSource).toContain("Array.isArray(option.options)")
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-medium"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"'
    )
    expect(acpSessionBadgeSource).toContain(
      '{modelBadgeLabel && !shouldHideModelBadgeInCompactMode && ('
    )
    expect(acpSessionBadgeSource).toContain('className="truncate"')
  })

  it("keeps tile message-stream tool execution rows readable at narrow widths and zoom", () => {
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 shrink truncate font-mono font-medium"')
    expect(agentProgressSource).toContain('className="min-w-0 flex-1 truncate text-[10px] font-mono opacity-50"')
    expect(agentProgressSource).toContain('className="mb-1 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex shrink-0 flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap opacity-50 text-[10px]"')
  })

  it("wraps expanded tool detail chrome and caps tool output blocks inside narrow tiles", () => {
    expect(agentProgressSource).toContain(
      'className="mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center justify-between gap-1.5"'
    )
    expect(agentProgressSource).toContain(
      'className="mt-1 ml-3 space-y-1 border-l border-border/50 pl-2"'
    )
    expect(agentProgressSource).toContain(
      'overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px]'
    )
  })

  it("keeps inline tool approval cards readable in narrow tiles and under zoom", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="mb-2 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="max-w-full min-w-0 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"'
    )
    expect(agentProgressSource).toContain(
      'className="mb-2 rounded-md border border-amber-200/70 bg-amber-100/40 px-2 py-1.5 text-[11px] font-mono leading-relaxed text-amber-700/80 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300/80 line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
    expect(agentProgressSource).toContain('className="space-y-1.5"')
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1.5 text-[10px] text-amber-700/80 dark:text-amber-300/80"'
    )
  })

  it("keeps mid-turn response cards and past-response history readable in narrow tiles", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border-2 border-green-400 bg-green-50/50 dark:bg-green-950/30"'
    )
    expect(agentProgressSource).toContain(
      '"flex min-w-0 flex-wrap items-start gap-2 cursor-pointer bg-green-100/50 px-3 py-2 transition-colors hover:bg-green-100/70 dark:bg-green-900/30 dark:hover:bg-green-900/40"'
    )
    expect(agentProgressSource).toContain(
      '<MessageSquare className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />'
    )
    expect(agentProgressSource).toContain('className="min-w-0 flex-1 space-y-1 text-left"')
    expect(agentProgressSource).toContain(
      '"line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
    expect(agentProgressSource).toContain('className={cn("min-w-0 px-3", isExpanded ? "pb-2" : "hidden")}')
    expect(agentProgressSource).toContain(
      'className="mt-1 rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
    expect(agentProgressSource).toContain('className="mb-1.5 flex flex-wrap items-center gap-1.5"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-md border border-green-200/60 dark:border-green-800/40"'
    )
    expect(agentProgressSource).toContain(
      'className="flex min-w-0 items-start gap-2 cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20"'
    )
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 text-xs text-green-700/70 dark:text-green-300/60 line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
  })

  it("uses a lightweight plain-text path for active streaming bubbles before final markdown rendering", () => {
    expect(agentProgressSource).toContain('const contentNode = streamingContent.isStreaming')
    expect(agentProgressSource).toContain('className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"')
    expect(agentProgressSource).toContain(': <MarkdownRenderer content={streamingContent.text} />')
  })

  it("wraps retry banners and queue chrome safely in narrow tile footers", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 px-3 py-2"')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-2"')
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs"'
    )
    expect(messageQueuePanelSource).toContain(
      '"min-w-0 flex-1"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex shrink-0 items-center gap-1"'
    )
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-start justify-between gap-2 px-3 py-2"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 flex-1 items-center gap-2"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="border-b border-orange-200 bg-orange-100/30 px-3 py-2 text-xs text-orange-700 break-words dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 flex-wrap items-start gap-2"'
    )
    expect(messageQueuePanelSource).toContain(
      '"ml-auto flex shrink-0 flex-wrap items-center gap-1 self-start transition-opacity"'
    )
  })

  it("keeps shared audio player and compact TTS errors readable under width pressure", () => {
    expect(audioPlayerSource).toContain('const compactStatusText = hasAudio')
    expect(audioPlayerSource).toContain(
      '"flex min-w-0 max-w-full flex-wrap items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5"'
    )
    expect(audioPlayerSource).toContain('className="h-8 w-8 shrink-0 p-0"')
    expect(audioPlayerSource).toContain(
      'className={cn("min-w-0 max-w-full space-y-2 rounded-lg bg-muted/50 p-3", className)}'
    )
    expect(audioPlayerSource).toContain('className="flex flex-wrap items-center gap-3"')
    expect(audioPlayerSource).toContain('className="min-w-0 flex-1 space-y-1"')
    expect(audioPlayerSource).toContain('className="ml-auto flex min-w-0 max-w-full items-center gap-2"')
    expect(audioPlayerSource).toContain('aria-label="Audio position"')
    expect(audioPlayerSource).toContain('aria-label="Audio volume"')
    expect(agentProgressSource).toContain('className="mt-2 min-w-0 space-y-1"')
    expect(agentProgressSource).toContain(
      'className="rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
    expect(sessionTileSource).toContain('className="mt-2 min-w-0 space-y-1"')
    expect(sessionTileSource).toContain(
      'className="rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
  })
})
