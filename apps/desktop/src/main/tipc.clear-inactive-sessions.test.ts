import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

// agent-session-tracker implementation is now in @dotagents/core
const __dirname = dirname(fileURLToPath(import.meta.url))
const coreTrackerPath = resolve(__dirname, "../../../../packages/core/src/agent-session-tracker.ts")
const trackerSource = readFileSync(coreTrackerPath, "utf8")

describe("tipc clearInactiveSessions", () => {
  it("keeps completed sessions with queued follow-ups out of bulk inactive cleanup", () => {
    expect(tipcSource).toContain("agentSessionTracker.clearCompletedSessions((session) => {")
    expect(tipcSource).toContain("messageQueueService.getQueue(session.conversationId).length === 0")
    expect(trackerSource).toContain("clearCompletedSessions(")
    expect(trackerSource).toContain("shouldClear: (session: AgentSession) => boolean = () => true")
    expect(trackerSource).toContain("if (shouldClear(session)) {")
    expect(trackerSource).toContain("this.completedSessions = retainedSessions")
  })
})