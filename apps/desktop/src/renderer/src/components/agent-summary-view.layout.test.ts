import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentSummaryViewSource = readFileSync(new URL("./agent-summary-view.tsx", import.meta.url), "utf8")

describe("agent summary view layout", () => {
  it("wraps summary card header chrome and keeps the expand affordance in one accessible toggle region", () => {
    expect(agentSummaryViewSource).toContain('className="flex flex-wrap items-start gap-2.5 p-3"')
    expect(agentSummaryViewSource).toContain(
      'className="flex min-w-0 flex-1 items-start gap-3 rounded-md text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"'
    )
    expect(agentSummaryViewSource).toContain("aria-expanded={isExpanded}")
    expect(agentSummaryViewSource).toContain('className="mb-1 flex flex-wrap items-center gap-2"')
    expect(agentSummaryViewSource).toContain('"ml-auto shrink-0 gap-1.5 self-start"')
  })

  it("reduces the expanded detail gutter and keeps summary highlights readable in narrow tiles", () => {
    expect(agentSummaryViewSource).toContain(
      'className="ml-4 space-y-3 border-t border-border/80 pt-3 sm:ml-6"'
    )
    expect(agentSummaryViewSource).toContain('className="flex flex-wrap items-center gap-2"')
    expect(agentSummaryViewSource).toContain('className="mt-1 break-words text-xs text-orange-700 dark:text-orange-300"')
    expect(agentSummaryViewSource).toContain(
      'className="sticky bottom-0 bg-gradient-to-t from-background via-background px-1 pt-2 to-transparent"'
    )
  })
})