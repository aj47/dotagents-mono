import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@renderer/lib/utils"
import { AgentStepSummary, AgentProgressUpdate } from "../../../shared/types"
import {
  ChevronDown,
  ChevronRight,
  Save,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Tag,
  FileText,
  Brain,
  Loader2,
} from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { tipcClient } from "@renderer/lib/tipc-client"

interface AgentSummaryViewProps {
  progress: AgentProgressUpdate | null
  className?: string
  conversationTitle?: string
  conversationId?: string
  compact?: boolean
}

function getImportantFindingsLabel(
  criticalCount: number,
  highCount: number,
  options?: { compact?: boolean },
): string {
  const parts: string[] = []

  if (criticalCount > 0) {
    parts.push(`${criticalCount} critical`)
  }

  if (highCount > 0) {
    parts.push(options?.compact ? `${highCount} high` : `${highCount} high importance`)
  }

  return parts.join(options?.compact ? " · " : ", ")
}

function getCompactCollapsedSummaryMetaLabel(
  summary: AgentStepSummary,
): string | null {
  const parts: string[] = []

  if (summary.keyFindings.length > 0) {
    parts.push(
      `${summary.keyFindings.length} finding${summary.keyFindings.length > 1 ? "s" : ""}`,
    )
  }

  if (summary.decisionsMade && summary.decisionsMade.length > 0) {
    parts.push(
      `${summary.decisionsMade.length} decision${summary.decisionsMade.length > 1 ? "s" : ""}`,
    )
  }

  if (summary.nextSteps?.trim()) {
    parts.push("Next steps")
  }

  return parts.length > 0 ? parts.join(" · ") : null
}

// Importance badge component
function ImportanceBadge({ importance }: { importance: AgentStepSummary["importance"] }) {
  const variants = {
    low: { className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Info },
    medium: { className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Info },
    high: { className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: AlertTriangle },
    critical: { className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
  }
  
  const { className, icon: Icon } = variants[importance]
  
  return (
    <Badge className={cn("inline-flex max-w-full items-center gap-1 text-xs font-medium capitalize", className)}>
      <Icon className="h-3 w-3" />
      {importance}
    </Badge>
  )
}

// Individual summary card component
function SummaryCard({
  summary,
  conversationTitle,
  conversationId,
  onSaved,
  cardRef,
  isEmphasized = false,
  revealRequestNonce = 0,
  compact = false,
}: {
  summary: AgentStepSummary
  conversationTitle?: string
  conversationId?: string
  onSaved?: (summary: AgentStepSummary) => void
  cardRef?: (node: HTMLDivElement | null) => void
  isEmphasized?: boolean
  revealRequestNonce?: number
  compact?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(summary.savedToMemory ?? false)

  useEffect(() => {
    if (revealRequestNonce <= 0) return

    setIsExpanded(true)
  }, [revealRequestNonce])
  
  const handleSaveToMemory = async () => {
    if (isSaving || isSaved) return
    
    setIsSaving(true)
    try {
      const result = await tipcClient.saveMemoryFromSummary({
        summary,
        conversationTitle,
        conversationId,
      })
      
      if (result.success && result.memory) {
        setIsSaved(true)
        onSaved?.(summary)
      }
    } catch (error) {
      console.error("Failed to save memory:", error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const formattedTime = new Date(summary.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
  const compactCollapsedSummaryMetaLabel = compact
    ? getCompactCollapsedSummaryMetaLabel(summary)
    : null
  const saveSummaryActionLabel = isSaving
    ? "Saving summary to memory"
    : isSaved
      ? "Summary saved to memory"
      : "Save summary to memory"
  
  return (
    <div
      ref={cardRef}
      data-summary-card-id={summary.id}
      className={cn(
        "scroll-mb-16 rounded-lg border transition-all duration-200",
        "bg-card hover:bg-accent/5",
        summary.importance === "critical" && "border-red-500/50",
        summary.importance === "high" && "border-orange-500/50",
        isEmphasized && "border-primary/50 ring-2 ring-primary/20 bg-primary/5",
      )}
    >
      {/* Header */}
      <div className={cn("flex flex-wrap items-start", compact ? "gap-2 p-2.5" : "gap-2.5 p-3")}>
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-start rounded-md text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            compact ? "gap-2.5" : "gap-3",
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className={cn("mb-1 flex flex-wrap items-center", compact ? "gap-1.5" : "gap-2")}>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {formattedTime}
              </span>
              <span className="text-xs text-muted-foreground">
                Step {summary.stepNumber}
              </span>
              <ImportanceBadge importance={summary.importance} />
            </div>

            <p className={cn("line-clamp-2 font-medium leading-snug", compact ? "text-[13px]" : "text-sm")}>
              {summary.actionSummary}
            </p>

            {!isExpanded && compactCollapsedSummaryMetaLabel ? (
              <p
                className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/80"
                title={compactCollapsedSummaryMetaLabel}
              >
                {compactCollapsedSummaryMetaLabel}
              </p>
            ) : null}
            {!isExpanded && !compact && summary.keyFindings.length > 0 && (
              <p className="mt-1 break-words text-xs text-muted-foreground">
                {summary.keyFindings.length} key finding{summary.keyFindings.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </button>

        {/* Save button */}
        <Button
          variant={isSaved ? "ghost" : "outline"}
          size={compact ? "icon" : "sm"}
          className={cn(
            "ml-auto shrink-0 self-start",
            !compact && "gap-1.5",
            isSaved && "text-green-600 dark:text-green-400"
          )}
          onClick={(e) => {
            e.stopPropagation()
            handleSaveToMemory()
          }}
          disabled={isSaving || isSaved}
          aria-label={saveSummaryActionLabel}
          title={saveSummaryActionLabel}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              {compact ? <span className="sr-only">{saveSummaryActionLabel}</span> : "Saved"}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {compact ? <span className="sr-only">{saveSummaryActionLabel}</span> : "Save"}
            </>
          )}
        </Button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className={cn(
            "border-t border-border/80",
            compact ? "space-y-2.5 px-2.5 pt-2.5" : "ml-4 space-y-3 pt-3 sm:ml-6",
          )}
        >
          {/* Key Findings */}
          {summary.keyFindings.length > 0 && (
            <div className={cn(!compact && "px-3")}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Key Findings
              </h4>
              <ul className="space-y-1">
                {summary.keyFindings.map((finding, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/90"
                  >
                    <span className="mt-1 shrink-0 text-primary">•</span>
                    <span className="min-w-0 flex-1 break-words">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {summary.nextSteps && (
            <div className={cn(!compact && "px-3")}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Next Steps
              </h4>
              <p className="text-sm text-foreground/90 break-words">{summary.nextSteps}</p>
            </div>
          )}

          {/* Decisions Made */}
          {summary.decisionsMade && summary.decisionsMade.length > 0 && (
            <div className={cn(!compact && "px-3")}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Decisions Made
              </h4>
              <ul className="space-y-1">
                {summary.decisionsMade.map((decision, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/90"
                  >
                    <span className="mt-1 shrink-0 text-green-500">✓</span>
                    <span className="min-w-0 flex-1 break-words">{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {summary.tags && summary.tags.length > 0 && (
            <div className={cn("flex flex-wrap items-center gap-2", !compact && "px-3")}>
              <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
              {summary.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="max-w-full text-xs break-all">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentSummaryView({
  progress,
  className,
  conversationTitle,
  conversationId,
  compact = false,
}: AgentSummaryViewProps) {
  const summaries = progress?.stepSummaries || []
  const latestSummary = progress?.latestSummary
  const summaryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const summaryHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [highlightedSummaryId, setHighlightedSummaryId] = useState<string | null>(null)
  const [revealedSummary, setRevealedSummary] = useState<{ id: string; nonce: number } | null>(null)

  if (summaries.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <Brain className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No summaries yet
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Summaries will appear here as the agent works
        </p>
      </div>
    )
  }

  // Group summaries by importance for quick access
  const criticalSummaries = summaries.filter(s => s.importance === "critical")
  const highSummaries = summaries.filter(s => s.importance === "high")
  const hasImportantFindings = criticalSummaries.length > 0 || highSummaries.length > 0
  const importantFindingsSummaryLabel = getImportantFindingsLabel(
    criticalSummaries.length,
    highSummaries.length,
    { compact },
  )
  const importantTimelineSummary = criticalSummaries[criticalSummaries.length - 1] ?? highSummaries[highSummaries.length - 1]
  const compactImportantFindingsTitle = hasImportantFindings
    ? `Important findings: ${importantFindingsSummaryLabel}`
    : undefined
  const importantSummaryActionTitle = importantTimelineSummary
    ? `Important finding: ${importantTimelineSummary.actionSummary}`
    : undefined
  const importantFindingsJumpTitle = importantTimelineSummary
    ? `${importantSummaryActionTitle} · Jump to this summary in the timeline`
    : compactImportantFindingsTitle
  const importantFindingsJumpLabel = importantTimelineSummary
    ? `Jump to important summary in timeline: ${importantTimelineSummary.actionSummary}`
    : compactImportantFindingsTitle
  const summaryCountLabel = `${summaries.length} step${summaries.length > 1 ? "s" : ""}`
  const latestTimelineSummary = latestSummary
    ? summaries.find((summary) => summary.id === latestSummary.id) ?? summaries[summaries.length - 1]
    : summaries[summaries.length - 1]
  const latestSummaryActionTitle = latestTimelineSummary
    ? `Latest activity: ${latestTimelineSummary.actionSummary}`
    : undefined
  const latestSummaryJumpTitle = latestTimelineSummary
    ? `${latestSummaryActionTitle} · Jump to this summary in the timeline`
    : undefined
  const latestSummaryJumpLabel = latestTimelineSummary
    ? `Jump to latest summary in timeline: ${latestTimelineSummary.actionSummary}`
    : undefined
  const shouldShowCompactLatestSummary = !compact || summaries.length > 1

  const clearPendingSummaryHighlight = useCallback(() => {
    if (summaryHighlightTimeoutRef.current !== null) {
      clearTimeout(summaryHighlightTimeoutRef.current)
      summaryHighlightTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearPendingSummaryHighlight, [clearPendingSummaryHighlight])

  const setSummaryRef = useCallback((summaryId: string, node: HTMLDivElement | null) => {
    summaryRefs.current[summaryId] = node
  }, [])

  const revealSummaryInTimeline = useCallback((summary: AgentStepSummary | null | undefined) => {
    if (!summary) return

    const summaryId = summary.id

    setRevealedSummary((current) => ({
      id: summaryId,
      nonce: current?.id === summaryId ? current.nonce + 1 : 1,
    }))
    setHighlightedSummaryId(summaryId)
    clearPendingSummaryHighlight()
    summaryHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightedSummaryId((current) =>
        current === summaryId ? null : current,
      )
      summaryHighlightTimeoutRef.current = null
    }, 1600)

    requestAnimationFrame(() => {
      summaryRefs.current[summaryId]?.scrollIntoView({
        behavior: "auto",
        block: compact ? "nearest" : "center",
      })
    })
  }, [clearPendingSummaryHighlight, compact])

  const handleJumpToLatestSummary = useCallback(() => {
    revealSummaryInTimeline(latestTimelineSummary)
  }, [latestTimelineSummary, revealSummaryInTimeline])

  const handleJumpToImportantSummary = useCallback(() => {
    revealSummaryInTimeline(importantTimelineSummary)
  }, [importantTimelineSummary, revealSummaryInTimeline])

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4", className)}>
      {/* Important summaries highlight */}
      {!compact && hasImportantFindings && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="truncate">Important Findings</span>
            </h3>
            <Badge variant="secondary" className="h-5 shrink-0 bg-orange-100 px-1.5 text-[10px] text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
              {criticalSummaries.length + highSummaries.length}
            </Badge>
          </div>
          <p className="mt-1 break-words text-xs text-orange-700 dark:text-orange-300">
            {importantFindingsSummaryLabel}
          </p>
        </div>
      )}

      {/* Timeline of summaries */}
      <div className="space-y-2">
        {compact ? (
          <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Timeline
            </p>
            {hasImportantFindings ? (
              <button
                type="button"
                onClick={handleJumpToImportantSummary}
                className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50/80 px-2 py-0.5 text-[10px] font-medium text-left text-orange-700 transition-colors hover:bg-orange-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60 focus-visible:ring-offset-2 dark:border-orange-800/80 dark:bg-orange-950/25 dark:text-orange-200 dark:hover:bg-orange-950/35 dark:focus-visible:ring-orange-800/70"
                title={importantFindingsJumpTitle}
                aria-label={importantFindingsJumpLabel}
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate text-orange-700/90 dark:text-orange-200/90">
                  {importantFindingsSummaryLabel}
                </span>
                <ChevronRight className="h-3 w-3 shrink-0 text-orange-700/60 dark:text-orange-200/60" />
              </button>
            ) : null}
          </div>
        ) : (
          <h3 className="mb-3 font-semibold text-sm text-muted-foreground">
            Agent Activity ({summaryCountLabel})
          </h3>
        )}

        {summaries.map((summary) => (
          <SummaryCard
            key={summary.id}
            summary={summary}
            conversationTitle={conversationTitle}
            conversationId={conversationId}
            cardRef={(node) => setSummaryRef(summary.id, node)}
            isEmphasized={highlightedSummaryId === summary.id}
            revealRequestNonce={revealedSummary?.id === summary.id ? revealedSummary.nonce : 0}
            compact={compact}
          />
        ))}
      </div>

      {/* Latest summary highlight */}
      {latestTimelineSummary && progress && !progress.isComplete && shouldShowCompactLatestSummary && (
        <div className={cn(
          "sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent",
          compact ? "pt-1" : "px-1 pt-2",
        )}>
          {compact ? (
            <button
              type="button"
              onClick={handleJumpToLatestSummary}
              className="flex min-w-0 w-full items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5 text-[11px] text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              title={latestSummaryJumpTitle ?? undefined}
              aria-label={latestSummaryJumpLabel}
            >
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary/80" />
              <span className="shrink-0 font-medium text-primary">Latest</span>
              <span className="min-w-0 flex-1 truncate text-foreground/80">
                {latestTimelineSummary.actionSummary}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            </button>
          ) : (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 text-xs font-medium text-primary">Latest Activity</p>
              <p className="break-words text-sm leading-snug">{latestTimelineSummary.actionSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
