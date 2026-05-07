import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const trackerSource = readFileSync(
  new URL("./agent-session-tracker.ts", import.meta.url),
  "utf8",
)
const sharedStoreSource = readFileSync(
  new URL("../../../../packages/shared/src/agent-session-store.ts", import.meta.url),
  "utf8",
)

describe("tipc clearInactiveSessions", () => {
  it("keeps completed sessions with queued follow-ups out of bulk inactive cleanup", () => {
    expect(tipcSource).toContain("createInactiveAgentSessionClearPredicate")
    expect(tipcSource).toContain("agentSessionTracker.clearCompletedSessions(createInactiveAgentSessionClearPredicate({")
    expect(tipcSource).toContain("messageQueueService.getQueue(conversationId).length")
    expect(trackerSource).toContain("clearCompletedSessions(")
    expect(trackerSource).toContain("shouldClear: (session: AgentSession) => boolean = () => true")
    expect(sharedStoreSource).toContain("if (shouldClear(session)) {")
    expect(sharedStoreSource).toContain("completedSessions = retainedSessions")
  })
})
