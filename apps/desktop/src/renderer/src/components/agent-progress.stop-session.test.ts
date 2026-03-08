import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress stop-session feedback", () => {
  it("surfaces a visible toast when stop requests fail", () => {
    expect(agentProgressSource).toContain('import { toast } from "sonner"')
    expect(agentProgressSource).toContain(
      'function getActionErrorMessage(error: unknown, fallback: string): string',
    )
    expect(agentProgressSource).toContain('console.error(`Failed to stop agent (via ${stopPath}):`, error)')
    expect(agentProgressSource).toContain('toast.error(')
    expect(agentProgressSource).toContain(
      '`Failed to stop agent. ${getActionErrorMessage(error, "Please try again.")}`',
    )
  })
})