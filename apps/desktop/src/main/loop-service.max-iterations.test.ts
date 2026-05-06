import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")
const agentLoopRunnerSource = readFileSync(new URL("./agent-loop-runner.ts", import.meta.url), "utf8")

describe("repeat-task max-iterations plumbing", () => {
  it("passes each task's maxIterations into the loop agent run", () => {
    expect(loopServiceSource).toContain('await import("./agent-loop-runner")')
    expect(loopServiceSource).not.toContain('await import("./tipc")')
    expect(loopServiceSource).toContain("runAgentLoopSession(loop.prompt, conversationId, sessionId, startSnoozed, loop.maxIterations)")
  })

  it("allows loop-triggered agent runs to override the default iteration budget", () => {
    expect(agentLoopRunnerSource).toContain("maxIterationsOverride?: number")
    expect(agentLoopRunnerSource).toContain('typeof maxIterationsOverride === "number" && Number.isFinite(maxIterationsOverride)')
    expect(agentLoopRunnerSource).toContain("return processWithAgentMode(text, conversationId, existingSessionId, startSnoozed, maxIterationsOverride)")
  })
})
