import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProcessingViewSource = readFileSync(
  new URL("./agent-processing-view.tsx", import.meta.url),
  "utf8",
)

describe("agent processing view layout", () => {
  it("uses shared runtime presentation for stop-session copy", () => {
    expect(agentProcessingViewSource).toContain("getChatRuntimeCopyState")
    expect(agentProcessingViewSource).toContain("const desktopRuntimeCopy = getChatRuntimeCopyState()")
    expect(agentProcessingViewSource).toContain("desktopRuntimeCopy.killSwitch.sessionExecutionButtonTitle")
    expect(agentProcessingViewSource).toContain("desktopRuntimeCopy.killSwitch.sessionTitle")
    expect(agentProcessingViewSource).toContain("desktopRuntimeCopy.killSwitch.sessionMessageWithOtherSessions")
    expect(agentProcessingViewSource).toContain("desktopRuntimeCopy.killSwitch.sessionPendingActionLabel")
    expect(agentProcessingViewSource).toContain("desktopRuntimeCopy.killSwitch.sessionActionLabel")
    expect(agentProcessingViewSource).toContain("desktopRuntimeCopy.common.cancel")
    expect(agentProcessingViewSource).not.toContain("CHAT_RUNTIME_PRESENTATION")
    expect(agentProcessingViewSource).not.toContain('title="Stop agent execution"')
    expect(agentProcessingViewSource).not.toContain('aria-label="Stop agent execution"')
    expect(agentProcessingViewSource).not.toContain(">Stop Agent Execution</h3>")
    expect(agentProcessingViewSource).not.toContain("Other sessions will continue running.")
    expect(agentProcessingViewSource).not.toContain('isKilling ? "Stopping..." : "Stop Agent"')
  })
})
