import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("tipc always-on lifecycle controls", () => {
  it("pauses the current always-on runtime session before falling back to loop metadata", () => {
    const pauseSection = getSection(
      tipcSource,
      "  pauseAlwaysOnSession: t.procedure",
      "  resumeAlwaysOnSession: t.procedure",
    )

    expect(pauseSection).toContain("const activeSessionId = summary.currentSessionId ?? loop.lastSessionId")
    expect(pauseSection).toContain("loopService.stopLoop(loop.id)")
    expect(pauseSection).toContain("agentSessionStateManager.stopSession(activeSessionId)")
    expect(pauseSection).toContain("toolApprovalManager.cancelSessionApprovals(activeSessionId)")
    expect(pauseSection).toContain("messageQueueService.pauseQueue(activeSession.conversationId)")
  })
})
