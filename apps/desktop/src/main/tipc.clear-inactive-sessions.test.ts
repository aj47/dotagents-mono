import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const trackerSource = readFileSync(
  new URL("./agent-session-tracker.ts", import.meta.url),
  "utf8",
)
const sessionManagementSource = readFileSync(
  new URL("./agent-session-management.ts", import.meta.url),
  "utf8",
)

describe("tipc clearInactiveSessions", () => {
  it("keeps completed sessions with queued follow-ups out of bulk inactive cleanup", () => {
    expect(sessionManagementSource).toContain(
      "agentSessionTracker.clearCompletedSessions((session) => {",
    )
    expect(sessionManagementSource).toContain(
      "messageQueueService.getQueue(session.conversationId).length === 0",
    )
    expect(tipcSource).toContain("const { clearedCount } = clearManagedInactiveAgentSessions()")
    expect(tipcSource).toContain("return { success: true, clearedCount }")
    expect(trackerSource).toContain("clearCompletedSessions(")
    expect(trackerSource).toContain("shouldClear: (session: AgentSession) => boolean = () => true")
    expect(trackerSource).toContain("if (shouldClear(session)) {")
    expect(trackerSource).toContain("this.completedSessions = retainedSessions")
  })
})
