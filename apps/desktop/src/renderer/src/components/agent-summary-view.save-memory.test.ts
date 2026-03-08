import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentSummaryViewSource = readFileSync(
  new URL("./agent-summary-view.tsx", import.meta.url),
  "utf8",
)

describe("agent summary save-memory feedback", () => {
  it("surfaces visible feedback when save-to-memory does not complete", () => {
    expect(agentSummaryViewSource).toContain('import { toast } from "sonner"')
    expect(agentSummaryViewSource).toContain(
      'function getSaveMemoryErrorMessage(error: unknown): string',
    )
    expect(agentSummaryViewSource).toContain(
      'if (result.reason === "no_durable_content") {',
    )
    expect(agentSummaryViewSource).toContain(
      'toast.error("Nothing durable to save from this step yet.")',
    )
    expect(agentSummaryViewSource).toContain(
      'toast.error("Failed to save memory. Please try again.")',
    )
    expect(agentSummaryViewSource).toContain(
      'toast.error(`Failed to save memory. ${getSaveMemoryErrorMessage(error)}`)',
    )
  })
})