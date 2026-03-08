import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const acpSessionBadgeSource = readFileSync(new URL("./acp-session-badge.tsx", import.meta.url), "utf8")
const messageQueuePanelSource = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")
const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")
const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")
const tileFollowUpInputSource = readFileSync(new URL("./tile-follow-up-input.tsx", import.meta.url), "utf8")

describe("agent progress tile layout", () => {
  it("wraps the tile header chrome for narrow session widths and zoomed text", () => {
    expect(agentProgressSource).toContain('const TILE_COMPACT_WIDTH = 340')
    expect(agentProgressSource).toContain('const { ref: tileVariantRef, isCompact: isCompactTileVariant } = useCompactWidth<HTMLDivElement>(TILE_COMPACT_WIDTH)')
    expect(agentProgressSource).toContain('ref={tileVariantRef}')
    expect(agentProgressSource).toContain(
      '"flex flex-wrap items-start gap-2 px-3 py-2 bg-muted/30 flex-shrink-0 cursor-pointer"'
    )
    expect(agentProgressSource).toContain('!isCollapsed && "border-b"')
    expect(agentProgressSource).toContain('isCollapsed && "bg-muted/40"')
    expect(agentProgressSource).toContain('isCompactTileVariant && "gap-y-1.5"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-start gap-2"')
    expect(agentProgressSource).toContain('"ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"')
    expect(agentProgressSource).toContain('isCompactTileVariant && "ml-0 basis-full border-t border-border/40 pt-1.5"')
  })

  it("adds a visible collapsed-state cue in the header instead of relying only on the chevron", () => {
    expect(agentProgressSource).toContain('{isCollapsed && (')
    expect(agentProgressSource).toContain('Tile content is collapsed. Click the header to expand it.')
    expect(agentProgressSource).toContain('inline-flex shrink-0 items-center rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground')
    expect(agentProgressSource).toContain('aria-expanded={!isCollapsed}')
    expect(agentProgressSource).toContain('title={isCollapsed ? "Expand tile details" : "Collapse tile details"}')
    expect(agentProgressSource).toContain('aria-label={isCollapsed ? "Expand tile details" : "Collapse tile details"}')
  })

  it("keeps narrow expanded approval tiles action-first by reserving compact split rows for only the header states that still add value there", () => {
    expect(agentProgressSource).toContain('const showTileHeaderPreviewBadge =')
    expect(agentProgressSource).toContain('!isCollapsed && showTileTranscriptPreviewHint && !isCompactTileVariant')
    expect(agentProgressSource).toContain('const showTileHeaderApprovalBadge =')
    expect(agentProgressSource).toContain('hasPendingApproval && (isCollapsed || !isCompactTileVariant)')
    expect(agentProgressSource).toContain('const hasTileHeaderMeta =')
    expect(agentProgressSource).toContain('isCollapsed || showTileHeaderApprovalBadge || showTileHeaderPreviewBadge')
    expect(agentProgressSource).toContain('const shouldSplitTileHeaderRows = isCompactTileVariant && hasTileHeaderMeta')
    expect(agentProgressSource).toContain('shouldSplitTileHeaderRows && "gap-y-1.5"')
    expect(agentProgressSource).toContain('{hasTileHeaderMeta && (')
    expect(agentProgressSource).toContain('className={cn(')
    expect(agentProgressSource).toContain('"flex max-w-full flex-wrap items-center justify-end gap-1"')
    expect(agentProgressSource).toContain('shouldSplitTileHeaderRows && "order-2 basis-full justify-end"')
    expect(agentProgressSource).toContain('{showTileHeaderApprovalBadge && (')
    expect(agentProgressSource).toContain('"ml-auto flex shrink-0 items-center gap-1"')
    expect(agentProgressSource).toContain('shouldSplitTileHeaderRows && "order-1 ml-0 w-full justify-end"')
  })

  it("keeps narrow tile footers compact by width while making elevated compact context usage self-explanatory", () => {
    expect(agentProgressSource).toContain('const shouldUseCompactTileFooter = isCompactTileVariant || (!isFocused && !isExpanded)')
    expect(agentProgressSource).toContain('const showTileModelInfo = !isComplete && !!modelInfo && !acpSessionInfo && !isCompactTileVariant')
    expect(agentProgressSource).toContain('const hasTileContextInfo = !isComplete && !!contextInfo && contextInfo.maxTokens > 0')
    expect(agentProgressSource).toContain('const tileContextUsagePercent = tileContextUsageRatio === null')
    expect(agentProgressSource).toContain('const shouldHighlightCompactTileContextMeter =')
    expect(agentProgressSource).toContain('tileContextUsagePercent !== null && tileContextUsagePercent >= 70')
    expect(agentProgressSource).toContain('const showTileContextMeter =')
    expect(agentProgressSource).toContain('hasTileContextInfo && (!shouldUseCompactTileFooter || shouldHighlightCompactTileContextMeter)')
    expect(agentProgressSource).toContain('const tileContextUsageTitle = !hasTileContextInfo || tileContextUsagePercent === null')
    expect(agentProgressSource).toContain('const showCompactTileContextUsageLabel =')
    expect(agentProgressSource).toContain('const showWideTileContextUsageLabel =')
    expect(agentProgressSource).toContain('const hasTileFooterMetadata = !!acpSessionInfo || showTileModelInfo || showTileContextMeter')
    expect(agentProgressSource).toContain('const shouldStackTileFooterLayout = isCompactTileVariant && hasTileFooterMetadata')
    expect(agentProgressSource).toContain('const shouldUseDenseTileFooterSpacing =')
    expect(agentProgressSource).toContain('shouldUseCompactTileFooter && hasTileFooterMetadata')
    expect(agentProgressSource).toContain('const tileFooterStatusLabel = !isComplete')
    expect(agentProgressSource).toContain('"flex flex-wrap items-center justify-between gap-2"')
    expect(agentProgressSource).toContain('shouldUseDenseTileFooterSpacing && "gap-1.5"')
    expect(agentProgressSource).toContain('shouldStackTileFooterLayout && "gap-y-1.5"')
    expect(agentProgressSource).toContain('"flex min-w-0 flex-1 flex-wrap items-center gap-y-1"')
    expect(agentProgressSource).toContain('shouldUseDenseTileFooterSpacing ? "gap-x-1.5" : "gap-x-2"')
    expect(agentProgressSource).toContain('shouldStackTileFooterLayout && "basis-full"')
    expect(agentProgressSource).toContain('compact={shouldUseCompactTileFooter}')
    expect(agentProgressSource).toContain('showTileModelInfo && (')
    expect(agentProgressSource).toContain('showTileContextMeter && (')
    expect(agentProgressSource).toContain('title={tileContextUsageTitle ?? undefined}')
    expect(agentProgressSource).toContain('showCompactTileContextUsageLabel')
    expect(agentProgressSource).toContain('"gap-1 rounded-full border border-border/50 bg-background/60 px-1.5 py-0.5"')
    expect(agentProgressSource).toContain('"h-1 bg-muted rounded-full overflow-hidden"')
    expect(agentProgressSource).toContain('showCompactTileContextUsageLabel ? "w-7" : "w-8"')
    expect(agentProgressSource).toContain('text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80')
    expect(agentProgressSource).toContain('text-[10px] font-medium text-foreground/80 tabular-nums')
    expect(agentProgressSource).toContain('Context {tileContextUsagePercent}%')
    expect(agentProgressSource).toContain('"ml-auto flex shrink-0 items-center gap-2"')
    expect(agentProgressSource).toContain('shouldStackTileFooterLayout && "ml-0 basis-full justify-end border-t border-border/30 pt-1"')
    expect(agentProgressSource).toContain('shouldUseCompactTileFooter ? "px-1.5" : "px-2"')
    expect(agentProgressSource).toContain('shouldStackTileFooterLayout ? "bg-background/70" : "whitespace-nowrap bg-background/40"')
    expect(agentProgressSource).not.toContain('text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70')
  })

  it("makes collapsed tiles feel intentionally compact by swapping lingering queue/reply chrome for a single summary strip", () => {
    expect(agentProgressSource).toContain('const collapsedTileSummary = effectiveUserResponse')
    expect(agentProgressSource).toContain('buildCollapsedUserResponsePreview(effectiveUserResponse)')
    expect(agentProgressSource).toContain('? (isQueuePaused ? "Queued follow-up paused" : "Queued follow-up waiting")')
    expect(agentProgressSource).toContain('? `${progress.stepSummaries?.length ?? 0} ${(progress.stepSummaries?.length ?? 0) === 1 ? "summary" : "summaries"} available`')
    expect(agentProgressSource).toContain(': "Expand tile to continue"')
    expect(agentProgressSource).toContain('{isCollapsed && (')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-2 border-t bg-muted/10 px-3 py-2 text-xs text-muted-foreground"')
    expect(agentProgressSource).toContain('title={collapsedTileSummary}')
    expect(agentProgressSource).toContain('{collapsedTileQueueBadgeLabel}')
    expect(agentProgressSource).toContain('!isCollapsed && showTileQueuePanel && (')
    expect(agentProgressSource).toContain('{!isCollapsed && (')
  })

  it("keeps clipped-history preview states visible while compact tiles spend less vertical space on repeated explanation", () => {
    expect(agentProgressSource).toContain('const showTileTranscriptPreviewHint =')
    expect(agentProgressSource).toContain('shouldLimitTileTranscript && hiddenTileItemCount > 0')
    expect(agentProgressSource).toContain('const hiddenTileTranscriptCountLabel =')
    expect(agentProgressSource).toContain('? "1 earlier update hidden"')
    expect(agentProgressSource).toContain(': `${hiddenTileItemCount} earlier updates hidden`')
    expect(agentProgressSource).toContain('const tileTranscriptPreviewHintTitle = !showTileTranscriptPreviewHint')
    expect(agentProgressSource).toContain('const tileTranscriptPreviewActionLabel = !showTileTranscriptPreviewHint')
    expect(agentProgressSource).toContain('? "Focus for full history"')
    expect(agentProgressSource).toContain(': "Focus this tile or open Single view for full history."')
    expect(agentProgressSource).toContain('const showTileHeaderPreviewBadge =')
    expect(agentProgressSource).toContain('!isCollapsed && showTileTranscriptPreviewHint && !isCompactTileVariant')
    expect(agentProgressSource).toContain('const tileHeaderPreviewBadgeLabel = !showTileHeaderPreviewBadge')
    expect(agentProgressSource).toContain(': "Recent only"')
    expect(agentProgressSource).not.toContain('? "Recent"')
    expect(agentProgressSource).toContain('const tileHeaderPreviewBadgeTitle = !showTileHeaderPreviewBadge')
    expect(agentProgressSource).toContain('{showTileHeaderPreviewBadge && (')
    expect(agentProgressSource).toContain('Showing recent updates only. ${hiddenTileTranscriptCountLabel}. Focus this tile or open Single view for full history.')
    expect(agentProgressSource).toContain('title={tileHeaderPreviewBadgeTitle ?? undefined}')
    expect(agentProgressSource).toContain('{tileHeaderPreviewBadgeLabel}')
    expect(agentProgressSource).toContain('inline-flex shrink-0 items-center rounded-full border border-blue-300/70 bg-blue-100/80 px-2 py-0.5 text-[10px] font-medium text-blue-900 dark:border-blue-700/70 dark:bg-blue-900/50 dark:text-blue-100')
    expect(agentProgressSource).toContain('{showTileTranscriptPreviewHint && (')
    expect(agentProgressSource).toContain('title={tileTranscriptPreviewHintTitle ?? undefined}')
    expect(agentProgressSource).toContain('"rounded-md border border-dashed border-border/60 bg-muted/15 text-muted-foreground"')
    expect(agentProgressSource).toContain('isCompactTileVariant ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"')
    expect(agentProgressSource).toContain('<span>{hiddenTileTranscriptCountLabel}</span>')
    expect(agentProgressSource).toContain('className="text-muted-foreground/60" aria-hidden="true"')
    expect(agentProgressSource).toContain('{tileTranscriptPreviewActionLabel}')
  })

  it("keeps persistent tile identity in the header instead of repeating it in footer and follow-up chrome", () => {
    expect(agentProgressSource).toContain('{/* Agent name indicator in header */}')
    expect(agentProgressSource).not.toContain('title={`Profile: ${profileName}`}')
    expect(tileFollowUpInputSource).not.toContain('agentName?: string')
    expect(tileFollowUpInputSource).not.toContain('Agent indicator - shows which agent is handling this session')
  })

  it("lets the tile chat-summary switcher and delegation preview adapt to narrow widths", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5"'
    )
    expect(agentProgressSource).toContain(
      '"inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"'
    )
    expect(agentProgressSource).toContain('<span className="truncate">Summary</span>')
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 flex flex-1 items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-600 dark:text-gray-400"'
    )
  })

  it("caps ACP session badges to the available tile width and truncates long labels", () => {
    expect(acpSessionBadgeSource).toContain("compact?: boolean")
    expect(acpSessionBadgeSource).toContain("const compactBadgeLabel = agentTitle")
    expect(acpSessionBadgeSource).toContain(
      '"inline-flex max-w-full min-w-0 flex-wrap items-center cursor-help"'
    )
    expect(acpSessionBadgeSource).toContain('compact ? "gap-1" : "gap-1.5"')
    expect(acpSessionBadgeSource).toContain("function getConfigOptionLabel")
    expect(acpSessionBadgeSource).toContain("Array.isArray(option.options)")
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 rounded-full border-border/50 bg-background/60 px-1.5 py-0 text-[9px] font-medium text-foreground/80"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"'
    )
    expect(acpSessionBadgeSource).toContain('compact ? (')
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

  it("uses tile-specific collapse wording and single-view language for the tile one-up affordance", () => {
    expect(agentProgressSource).toContain('title={isCollapsed ? "Expand tile details" : "Collapse tile details"}')
    expect(agentProgressSource).toContain('aria-label={isCollapsed ? "Expand tile details" : "Collapse tile details"}')
    expect(agentProgressSource).toContain('title="Show this session in Single view"')
    expect(agentProgressSource).toContain('aria-label="Show this session in Single view"')
    expect(agentProgressSource).toContain('onExpand && !isExpanded')
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
    expect(agentProgressSource).toContain('const shouldUseCompactTileQueuePanel = !isFocused && !isExpanded')
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 px-3 py-2"')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-2"')
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs"'
    )
    expect(agentProgressSource).toContain('compact={shouldUseCompactTileQueuePanel}')
    expect(agentProgressSource).not.toContain('compact={isCollapsed}')
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

  it("lets compact background tiles soften waiting queue chrome while still keeping paused queue state prominent when approval or recent-history hints already carry more urgency", () => {
    expect(agentProgressSource).toContain('const shouldInlineCompactTileQueueSummary =')
    expect(agentProgressSource).toContain('hasQueuedMessages &&')
    expect(agentProgressSource).toContain('shouldUseCompactTileQueuePanel &&')
    expect(agentProgressSource).toContain('(hasPendingApproval || showTileTranscriptPreviewHint)')
    expect(agentProgressSource).toContain('const TileQueueStatusIcon = isQueuePaused ? Pause : Clock')
    expect(agentProgressSource).toContain('const compactTileQueueSummaryLabel = !shouldInlineCompactTileQueueSummary')
    expect(agentProgressSource).toContain('`Paused · ${queuedMessages.length} queued`')
    expect(agentProgressSource).toContain('`${queuedMessages.length} queued`')
    expect(agentProgressSource).toContain('const compactTileQueueSummaryTitle = !shouldInlineCompactTileQueueSummary')
    expect(agentProgressSource).toContain('Queued follow-ups are paused. Focus this tile to resume or manage the queue.')
    expect(agentProgressSource).toContain('Queued follow-ups are waiting. Focus this tile to manage the queue.')
    expect(agentProgressSource).toContain('const inlineCompactTileQueueStatusClassName = isQueuePaused')
    expect(agentProgressSource).toContain('const collapsedTileQueueStatusClassName = isQueuePaused')
    expect(agentProgressSource).toContain('"border-border/60 bg-background/70 text-muted-foreground"')
    expect(agentProgressSource).toContain('"border-amber-300/70 bg-amber-100/60 text-amber-700 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-300"')
    expect(agentProgressSource).toContain('const collapsedTileQueueBadgeLabel = hasQueuedMessages')
    expect(agentProgressSource).toContain('const collapsedTileQueueBadgeTitle = hasQueuedMessages')
    expect(agentProgressSource).toContain('const showTileQueuePanel =')
    expect(agentProgressSource).toContain('!!progress.conversationId &&')
    expect(agentProgressSource).toContain('!shouldInlineCompactTileQueueSummary')
    expect(agentProgressSource).toContain('{shouldInlineCompactTileQueueSummary && (')
    expect(agentProgressSource).toContain(
      '"inline-flex shrink-0 items-center gap-1 rounded-full border py-0.5 text-[10px] font-medium"'
    )
    expect(agentProgressSource).toContain('inlineCompactTileQueueStatusClassName,')
    expect(agentProgressSource).toContain('isQueuePaused && "font-semibold"')
    expect(agentProgressSource).toContain('title={compactTileQueueSummaryTitle ?? undefined}')
    expect(agentProgressSource).toContain('<TileQueueStatusIcon className="h-2.5 w-2.5 shrink-0" />')
    expect(agentProgressSource).toContain('{compactTileQueueSummaryLabel}')
    expect(agentProgressSource).toContain('collapsedTileQueueStatusClassName,')
    expect(agentProgressSource).toContain('title={collapsedTileQueueBadgeTitle ?? undefined}')
    expect(agentProgressSource).toContain('{collapsedTileQueueBadgeLabel}')
    expect(agentProgressSource).toContain('!isCollapsed && showTileQueuePanel && (')
  })

  it("lets narrow tile follow-up chrome protect input space while keeping the compact focus affordance explicit", () => {
    expect(tileFollowUpInputSource).toContain("const TILE_FOLLOW_UP_COMPACT_WIDTH = 360")
    expect(tileFollowUpInputSource).toContain("const shouldStackComposerActions = isCompactLayout && !shouldUseCompactPrompt")
    expect(tileFollowUpInputSource).toContain("const compactPromptCompactActionLabel = isInitializingSession")
    expect(tileFollowUpInputSource).toContain('{isCompactLayout ? (')
    expect(tileFollowUpInputSource).toContain('rounded-full border border-border/50 bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80')
    expect(tileFollowUpInputSource).toContain('{compactPromptCompactActionLabel}')
    expect(tileFollowUpInputSource).toContain('className="shrink-0 whitespace-nowrap text-[10px]"')
    expect(tileFollowUpInputSource).toContain(
      'className={cn("flex w-full gap-2", shouldStackComposerActions ? "flex-col items-stretch" : "items-center")}'
    )
    expect(tileFollowUpInputSource).toContain(
      'shouldStackComposerActions && "rounded-md border border-border/50 bg-background/70 px-2 py-1"'
    )
    expect(tileFollowUpInputSource).toContain(
      'shouldStackComposerActions && "w-full justify-end border-t border-border/40 pt-1.5"'
    )
    expect(agentProgressSource).toContain('preferCompact={!isFocused && !isExpanded}')
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
