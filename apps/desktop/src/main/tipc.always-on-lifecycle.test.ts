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
    const stopHelperSection = getSection(
      tipcSource,
      "function stopAlwaysOnRuntimeSession(",
      "async function getLatestRawMessageIndexForConversation",
    )

    expect(stopHelperSection).toContain("const activeSessionId = summary.currentSessionId ?? loop.lastSessionId")
    expect(stopHelperSection).toContain("loopService.stopLoop(loop.id)")
    expect(stopHelperSection).toContain("agentSessionStateManager.stopSession(activeSessionId)")
    expect(stopHelperSection).toContain("toolApprovalManager.cancelSessionApprovals(activeSessionId)")
    expect(stopHelperSection).toContain("messageQueueService.pauseQueue(conversationId)")
  })

  it("refreshes the always-on prompt when resuming", () => {
    const resumeSection = getSection(
      tipcSource,
      "  resumeAlwaysOnSession: t.procedure",
      "  updateAlwaysOnSessionGoal: t.procedure",
    )

    expect(resumeSection).toContain("prompt: alwaysOnSessionService.buildLoopPrompt(summary.id, loop.name || summary.name, summary.goal)")
    expect(resumeSection).toContain("enabled: true")
    expect(resumeSection).toContain("loopService.startLoop(loop.id)")
  })

  it("can update the always-on goal and steer the active conversation", () => {
    const goalSection = getSection(
      tipcSource,
      "  updateAlwaysOnSessionGoal: t.procedure",
      "  resetAlwaysOnSession: t.procedure",
    )

    expect(goalSection).toContain("alwaysOnSessionService.buildLoopPrompt(summary.id, loop.name || summary.name, goal)")
    expect(goalSection).toContain("alwaysOnSessionService.setGoal(summary.id, goal)")
    expect(goalSection).toContain("title: goal ? \"Goal updated\" : \"Goal cleared\"")
    expect(goalSection).toContain("messageQueueService.enqueue(")
    expect(goalSection).toContain("\"steering\"")
  })

  it("resets the session, clears stale runtime linkage, and restarts from a fresh run", () => {
    const resetSection = getSection(
      tipcSource,
      "  resetAlwaysOnSession: t.procedure",
      "  openAlwaysOnSessionLog: t.procedure",
    )

    expect(resetSection).toContain("stopAlwaysOnRuntimeSession(summary, loop, { clearQueue: true })")
    expect(resetSection).toContain("const preservedGoal = summary.goal")
    expect(resetSection).toContain("alwaysOnSessionService.resetSession(summary.id)")
    expect(resetSection).toContain("const resetGoal = resetRecord.goal ?? preservedGoal")
    expect(resetSection).toContain("alwaysOnSessionService.buildLoopPrompt(summary.id, loop.name || summary.name, resetGoal)")
    expect(resetSection).toContain("lastSessionId: undefined")
    expect(resetSection).toContain("loopService.startLoop(updatedLoop.id)")
  })

  it("packages always-on question answers with context and choice impact", () => {
    const answerSection = getSection(
      tipcSource,
      "function getAlwaysOnAnswerText(",
      "function broadcastTTSPlaybackState",
    )

    expect(answerSection).toContain("questionContext")
    expect(answerSection).toContain("Agent recommendation")
    expect(answerSection).toContain("Selected impact")
  })
})
