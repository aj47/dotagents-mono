import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("getAgentSessions repeat-task session flag", () => {
  it("marks repeat-task sessions even if the visible title was retitled", () => {
    expect(tipcSource).toContain("async function withRepeatTaskSessionFlag")
    expect(tipcSource).toContain('session.repeatTask?.type === "repeat_task_run"')
    expect(tipcSource).toContain("hasRepeatTaskTitlePrefix(session.conversationTitle)")
    expect(tipcSource).toContain("loop.name.trim() === title")
    expect(tipcSource).toContain("loop.prompt.trim() === firstUserMessage")
    expect(tipcSource).toContain("!isLikelyRepeatTaskCreationSessionTitle(session.conversationTitle)")
    expect(tipcSource).toContain("agentSessionTracker.getActiveSessions().map(withRepeatTaskSessionFlag)")
  })

  it("checks in-memory repeat-task signals before loading conversations from disk", () => {
    const functionSource = tipcSource.slice(
      tipcSource.indexOf("async function withRepeatTaskSessionFlag"),
      tipcSource.indexOf("function isLikelyRepeatTaskCreationSessionTitle"),
    )

    const repeatTaskIndex = functionSource.indexOf('session.repeatTask?.type === "repeat_task_run"')
    const titlePrefixIndex = functionSource.indexOf("hasRepeatTaskTitlePrefix(session.conversationTitle)")
    const loopNameIndex = functionSource.indexOf("loop.name.trim() === title")
    const loadConversationIndex = functionSource.indexOf("conversationService.loadConversation(session.conversationId)")

    expect(repeatTaskIndex).toBeGreaterThanOrEqual(0)
    expect(titlePrefixIndex).toBeGreaterThan(repeatTaskIndex)
    expect(loopNameIndex).toBeGreaterThan(titlePrefixIndex)
    expect(loadConversationIndex).toBeGreaterThan(loopNameIndex)
  })

  it("forces loop sessions through a safe conversation title before notifications can use it", () => {
    const functionSource = tipcSource.slice(
      tipcSource.indexOf("export async function runAgentLoopSession"),
      tipcSource.indexOf("type AgentLaunchStateInput"),
    )

    expect(functionSource).toContain("resolveAgentLoopSessionConversationTitle(text, existingSessionId, options)")
    expect(functionSource).toContain("conversationTitle:")
    expect(tipcSource).toContain("function truncateAgentLoopFallbackTitle")
    expect(tipcSource).toContain("agentSessionTracker.getSession(existingSessionId)?.conversationTitle?.trim()")
  })
})
