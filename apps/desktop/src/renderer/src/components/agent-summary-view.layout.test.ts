import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentSummaryViewSource = readFileSync(new URL("./agent-summary-view.tsx", import.meta.url), "utf8")

describe("agent summary view layout", () => {
  it("wraps summary card header chrome and keeps the expand affordance in one accessible toggle region", () => {
    expect(agentSummaryViewSource).toContain('compact?: boolean')
    expect(agentSummaryViewSource).toContain('className={cn("flex flex-wrap items-start", compact ? "gap-2 p-2.5" : "gap-2.5 p-3")}')
    expect(agentSummaryViewSource).toContain(
      'compact ? "gap-2.5" : "gap-3"'
    )
    expect(agentSummaryViewSource).toContain("aria-expanded={isExpanded}")
    expect(agentSummaryViewSource).toContain('compact ? "gap-1.5" : "gap-2"')
    expect(agentSummaryViewSource).toContain('const saveSummaryActionLabel = isSaving')
    expect(agentSummaryViewSource).toContain('size={compact ? "icon" : "sm"}')
    expect(agentSummaryViewSource).toContain('aria-label={saveSummaryActionLabel}')
    expect(agentSummaryViewSource).toContain('title={saveSummaryActionLabel}')
    expect(agentSummaryViewSource).toContain('<span className="sr-only">{saveSummaryActionLabel}</span>')
  })

  it("reduces the expanded detail gutter and keeps summary highlights readable in narrow tiles", () => {
    expect(agentSummaryViewSource).toContain(
      'compact ? "space-y-2.5 px-2.5 pt-2.5" : "ml-4 space-y-3 pt-3 sm:ml-6"'
    )
    expect(agentSummaryViewSource).toContain(
      'compact ? "pt-1" : "px-1 pt-2"'
    )
    expect(agentSummaryViewSource).toContain(
      'compact={compact}'
    )
  })

  it("condenses compact important findings into a lighter single-line summary so narrow tiles stay less top-heavy", () => {
    expect(agentSummaryViewSource).toContain('function getImportantFindingsLabel(')
    expect(agentSummaryViewSource).toContain('parts.push(`${criticalCount} critical`)')
    expect(agentSummaryViewSource).toContain('parts.push(options?.compact ? `${highCount} high` : `${highCount} high importance`)')
    expect(agentSummaryViewSource).toContain('return parts.join(options?.compact ? " · " : ", ")')
    expect(agentSummaryViewSource).toContain('const hasImportantFindings = criticalSummaries.length > 0 || highSummaries.length > 0')
    expect(agentSummaryViewSource).toContain('const importantFindingsSummaryLabel = getImportantFindingsLabel(')
    expect(agentSummaryViewSource).toContain('const importantTimelineSummary = criticalSummaries[criticalSummaries.length - 1] ?? highSummaries[highSummaries.length - 1]')
    expect(agentSummaryViewSource).toContain('const compactImportantFindingsTitle = hasImportantFindings')
    expect(agentSummaryViewSource).toContain('const importantSummaryActionTitle = importantTimelineSummary')
    expect(agentSummaryViewSource).toContain('const importantFindingsJumpTitle = importantTimelineSummary')
    expect(agentSummaryViewSource).toContain('const importantFindingsJumpLabel = importantTimelineSummary')
    expect(agentSummaryViewSource).toContain('!compact && hasImportantFindings && (')
    expect(agentSummaryViewSource).toContain('className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-1.5"')
    expect(agentSummaryViewSource).toContain('onClick={handleJumpToImportantSummary}')
    expect(agentSummaryViewSource).toContain('className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50/80 px-2 py-0.5 text-[10px] font-medium text-left text-orange-700 transition-colors hover:bg-orange-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60 focus-visible:ring-offset-2 dark:border-orange-800/80 dark:bg-orange-950/25 dark:text-orange-200 dark:hover:bg-orange-950/35 dark:focus-visible:ring-orange-800/70"')
    expect(agentSummaryViewSource).toContain('title={importantFindingsJumpTitle}')
    expect(agentSummaryViewSource).toContain('aria-label={importantFindingsJumpLabel}')
    expect(agentSummaryViewSource).toContain('<AlertTriangle className="h-3 w-3 shrink-0" />')
    expect(agentSummaryViewSource).toContain('className="min-w-0 truncate text-orange-700/90 dark:text-orange-200/90"')
    expect(agentSummaryViewSource).toContain('<ChevronRight className="h-3 w-3 shrink-0 text-orange-700/60 dark:text-orange-200/60" />')
    expect(agentSummaryViewSource).toContain('className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20"')
  })

  it("condenses compact latest activity into a lighter sticky row so narrow summary tiles keep more room for the timeline", () => {
    expect(agentSummaryViewSource).toContain('const shouldShowCompactLatestSummary = !compact || summaries.length > 1')
    expect(agentSummaryViewSource).toContain('const latestTimelineSummary = latestSummary')
    expect(agentSummaryViewSource).toContain('summaries.find((summary) => summary.id === latestSummary.id) ?? summaries[summaries.length - 1]')
    expect(agentSummaryViewSource).toContain('const latestSummaryActionTitle = latestTimelineSummary')
    expect(agentSummaryViewSource).toContain('`Latest activity: ${latestTimelineSummary.actionSummary}`')
    expect(agentSummaryViewSource).toContain('const latestSummaryJumpTitle = latestTimelineSummary')
    expect(agentSummaryViewSource).toContain('const latestSummaryJumpLabel = latestTimelineSummary')
    expect(agentSummaryViewSource).toContain('latestTimelineSummary && progress && !progress.isComplete && shouldShowCompactLatestSummary && (')
    expect(agentSummaryViewSource).toContain('type="button"')
    expect(agentSummaryViewSource).toContain('onClick={handleJumpToLatestSummary}')
    expect(agentSummaryViewSource).toContain('title={latestSummaryJumpTitle ?? undefined}')
    expect(agentSummaryViewSource).toContain('aria-label={latestSummaryJumpLabel}')
    expect(agentSummaryViewSource).toContain('className="flex min-w-0 w-full items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5 text-[11px] text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"')
    expect(agentSummaryViewSource).toContain('<Clock className="h-3.5 w-3.5 shrink-0 text-primary/80" />')
    expect(agentSummaryViewSource).toContain('<span className="shrink-0 font-medium text-primary">Latest</span>')
    expect(agentSummaryViewSource).toContain('className="min-w-0 flex-1 truncate text-foreground/80"')
    expect(agentSummaryViewSource).toContain('<ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60" />')
    expect(agentSummaryViewSource).toContain('className="rounded-lg border border-primary/20 bg-primary/5 p-3"')
    expect(agentSummaryViewSource).toContain('<p className="mb-1 text-xs font-medium text-primary">Latest Activity</p>')
  })

  it("lets the compact latest summary strip jump to and temporarily emphasize the matching timeline card so the newest summary is easier to recover", () => {
    expect(agentSummaryViewSource).toContain('const summaryRefs = useRef<Record<string, HTMLDivElement | null>>({})')
    expect(agentSummaryViewSource).toContain('const summaryHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)')
    expect(agentSummaryViewSource).toContain('const [highlightedSummaryId, setHighlightedSummaryId] = useState<string | null>(null)')
    expect(agentSummaryViewSource).toContain('const [revealedSummary, setRevealedSummary] = useState<{ id: string; nonce: number } | null>(null)')
    expect(agentSummaryViewSource).toContain('const clearPendingSummaryHighlight = useCallback(() => {')
    expect(agentSummaryViewSource).toContain('useEffect(() => clearPendingSummaryHighlight, [clearPendingSummaryHighlight])')
    expect(agentSummaryViewSource).toContain('const setSummaryRef = useCallback((summaryId: string, node: HTMLDivElement | null) => {')
    expect(agentSummaryViewSource).toContain('const revealSummaryInTimeline = useCallback((summary: AgentStepSummary | null | undefined) => {')
    expect(agentSummaryViewSource).toContain('setRevealedSummary((current) => ({')
    expect(agentSummaryViewSource).toContain('setHighlightedSummaryId(summaryId)')
    expect(agentSummaryViewSource).toContain('summaryRefs.current[summaryId]?.scrollIntoView({')
    expect(agentSummaryViewSource).toContain('behavior: "auto"')
    expect(agentSummaryViewSource).toContain('block: compact ? "nearest" : "center"')
    expect(agentSummaryViewSource).toContain('const handleJumpToLatestSummary = useCallback(() => {')
    expect(agentSummaryViewSource).toContain('revealSummaryInTimeline(latestTimelineSummary)')
    expect(agentSummaryViewSource).toContain('const handleJumpToImportantSummary = useCallback(() => {')
    expect(agentSummaryViewSource).toContain('revealSummaryInTimeline(importantTimelineSummary)')
    expect(agentSummaryViewSource).toContain('revealRequestNonce <= 0')
    expect(agentSummaryViewSource).toContain('setIsExpanded(true)')
    expect(agentSummaryViewSource).toContain('data-summary-card-id={summary.id}')
    expect(agentSummaryViewSource).toContain('scroll-mb-16 rounded-lg border transition-all duration-200')
    expect(agentSummaryViewSource).toContain('isEmphasized && "border-primary/50 ring-2 ring-primary/20 bg-primary/5"')
    expect(agentSummaryViewSource).toContain('cardRef={(node) => setSummaryRef(summary.id, node)}')
    expect(agentSummaryViewSource).toContain('isEmphasized={highlightedSummaryId === summary.id}')
    expect(agentSummaryViewSource).toContain('revealRequestNonce={revealedSummary?.id === summary.id ? revealedSummary.nonce : 0}')
  })

  it("uses a lighter compact timeline heading so summary tiles do not repeat the tab count as heavy section chrome", () => {
    expect(agentSummaryViewSource).toContain('const summaryCountLabel = `${summaries.length} step${summaries.length > 1 ? "s" : ""}`')
    expect(agentSummaryViewSource).toContain('className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-1.5"')
    expect(agentSummaryViewSource).toContain('<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">')
    expect(agentSummaryViewSource).toContain('Timeline')
    expect(agentSummaryViewSource).toContain('<h3 className="mb-3 font-semibold text-sm text-muted-foreground">')
    expect(agentSummaryViewSource).toContain('Agent Activity ({summaryCountLabel})')
  })

  it("adds a compact collapsed metadata preview so narrow summary cards reveal findings, decisions, and next steps without expanding", () => {
    expect(agentSummaryViewSource).toContain('function getCompactCollapsedSummaryMetaLabel(')
    expect(agentSummaryViewSource).toContain('`${summary.keyFindings.length} finding${summary.keyFindings.length > 1 ? "s" : ""}`')
    expect(agentSummaryViewSource).toContain('`${summary.decisionsMade.length} decision${summary.decisionsMade.length > 1 ? "s" : ""}`')
    expect(agentSummaryViewSource).toContain('parts.push("Next steps")')
    expect(agentSummaryViewSource).toContain('return parts.length > 0 ? parts.join(" · ") : null')
    expect(agentSummaryViewSource).toContain('const compactCollapsedSummaryMetaLabel = compact')
    expect(agentSummaryViewSource).toContain('!isExpanded && compactCollapsedSummaryMetaLabel ? (')
    expect(agentSummaryViewSource).toContain('className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/80"')
    expect(agentSummaryViewSource).toContain('title={compactCollapsedSummaryMetaLabel}')
    expect(agentSummaryViewSource).toContain('{compactCollapsedSummaryMetaLabel}')
    expect(agentSummaryViewSource).toContain('!isExpanded && !compact && summary.keyFindings.length > 0 && (')
  })
})