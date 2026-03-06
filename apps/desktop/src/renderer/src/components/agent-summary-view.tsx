import React, { useState } from "react"
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
}: {
  summary: AgentStepSummary
  conversationTitle?: string
  conversationId?: string
  onSaved?: (summary: AgentStepSummary) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(summary.savedToMemory ?? false)
  
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
  
  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        "bg-card hover:bg-accent/5",
        summary.importance === "critical" && "border-red-500/50",
        summary.importance === "high" && "border-orange-500/50",
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start gap-2.5 p-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 rounded-md text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {formattedTime}
              </span>
              <span className="text-xs text-muted-foreground">
                Step {summary.stepNumber}
              </span>
              <ImportanceBadge importance={summary.importance} />
            </div>

            <p className="line-clamp-2 text-sm font-medium leading-snug">{summary.actionSummary}</p>

            {!isExpanded && summary.keyFindings.length > 0 && (
              <p className="mt-1 break-words text-xs text-muted-foreground">
                {summary.keyFindings.length} key finding{summary.keyFindings.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </button>

        {/* Save button */}
        <Button
          variant={isSaved ? "ghost" : "outline"}
          size="sm"
          className={cn(
            "ml-auto shrink-0 gap-1.5 self-start",
            isSaved && "text-green-600 dark:text-green-400"
          )}
          onClick={(e) => {
            e.stopPropagation()
            handleSaveToMemory()
          }}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-4 space-y-3 border-t border-border/80 pt-3 sm:ml-6">
          {/* Key Findings */}
          {summary.keyFindings.length > 0 && (
            <div className="px-3">
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
            <div className="px-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Next Steps
              </h4>
              <p className="text-sm text-foreground/90 break-words">{summary.nextSteps}</p>
            </div>
          )}

          {/* Decisions Made */}
          {summary.decisionsMade && summary.decisionsMade.length > 0 && (
            <div className="px-3">
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
            <div className="flex flex-wrap items-center gap-2 px-3">
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
}: AgentSummaryViewProps) {
  const summaries = progress?.stepSummaries || []
  const latestSummary = progress?.latestSummary

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

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Important summaries highlight */}
      {(criticalSummaries.length > 0 || highSummaries.length > 0) && (
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3">
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
            {criticalSummaries.length > 0 && `${criticalSummaries.length} critical`}
            {criticalSummaries.length > 0 && highSummaries.length > 0 && ", "}
            {highSummaries.length > 0 && `${highSummaries.length} high importance`}
          </p>
        </div>
      )}

      {/* Timeline of summaries */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Agent Activity ({summaries.length} step{summaries.length > 1 ? "s" : ""})
        </h3>

        {summaries.map((summary) => (
          <SummaryCard
            key={summary.id}
            summary={summary}
            conversationTitle={conversationTitle}
            conversationId={conversationId}
          />
        ))}
      </div>

      {/* Latest summary highlight */}
      {latestSummary && progress && !progress.isComplete && (
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background px-1 pt-2 to-transparent">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs font-medium text-primary mb-1">Latest Activity</p>
            <p className="break-words text-sm leading-snug">{latestSummary.actionSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
