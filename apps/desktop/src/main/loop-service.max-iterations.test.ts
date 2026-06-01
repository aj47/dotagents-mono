import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("repeat-task max-iterations plumbing", () => {
  it("passes each task's maxIterations into the loop agent run", () => {
    expect(loopServiceSource).toContain("runAgentLoopSession(loop.prompt, conversationId, sessionId, startSnoozed, loop.maxIterations)")
  })

  it("preserves mobile session identity for manually triggered repeat tasks", () => {
    expect(loopServiceSource).toContain("clientSessionId?: string")
    expect(loopServiceSource).toContain("conversation.clientSessionId = options.clientSessionId")
    expect(loopServiceSource).toContain("return { loopId, conversationId, sessionId }")
  })

  it("allows loop-triggered agent runs to override the default iteration budget", () => {
    expect(tipcSource).toContain("maxIterationsOverride?: number")
    expect(tipcSource).toContain('typeof maxIterationsOverride === "number" && Number.isFinite(maxIterationsOverride)')
    expect(tipcSource).toContain("return processWithAgentMode(text, conversationId, existingSessionId, startSnoozed, maxIterationsOverride)")
  })
})
