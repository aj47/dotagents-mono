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

  it("restores previous focus and surfaces visible feedback when minimize or restore fails", () => {
    expect(agentProgressSource).toContain(
      'const focusedSessionId = useAgentStore((s) => s.focusedSessionId)',
    )
    expect(agentProgressSource).toContain('const previousFocusedSessionId = focusedSessionId')
    expect(agentProgressSource).toContain(
      'setFocusedSessionId(previousFocusedSessionId ?? null)',
    )
    expect(agentProgressSource).toContain(
      '`Failed to minimize session. ${getActionErrorMessage(error, "Please try again.")}`',
    )
    expect(agentProgressSource).toContain(
      '`Failed to restore session. ${getActionErrorMessage(error, "Please try again.")}`',
    )
    expect(agentProgressSource).toContain(
      '`Session minimized, but failed to hide the panel. ${getActionErrorMessage(error, "Please try again.")}`',
    )
    expect(agentProgressSource).toContain(
      'const focusResult = await tipcClient.focusAgentSession({ sessionId: progress.sessionId })',
    )
    expect(agentProgressSource).toContain('if (focusResult?.success === false) {')
    expect(agentProgressSource).toContain(
      'console.error("Failed to sync panel focus after unsnooze:", focusResult.error)',
    )
    expect(agentProgressSource).toContain(
      '`Session restored, but failed to sync panel focus. ${getActionErrorMessage(focusResult.error, "Please try again.")}`',
    )
  })

  it("surfaces a visible toast when completed-session close actions fail", () => {
    expect(agentProgressSource).toContain('let closeTarget: "session" | "panel" = "panel"')
    expect(agentProgressSource).toContain('closeTarget = "session"')
    expect(agentProgressSource).toContain('console.error("Failed to close agent session/panel:", error)')
    expect(agentProgressSource).toContain(
      '`Failed to close ${closeTarget}. ${getActionErrorMessage(error, "Please try again.")}`',
    )
  })
})