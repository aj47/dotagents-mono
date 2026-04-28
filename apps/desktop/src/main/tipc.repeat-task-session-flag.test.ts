import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("getAgentSessions repeat-task session flag", () => {
  it("marks repeat-task sessions even if the visible title was retitled", () => {
    expect(tipcSource).toContain("async function withRepeatTaskSessionFlag")
    expect(tipcSource).toContain("hasRepeatTaskTitlePrefix(session.conversationTitle)")
    expect(tipcSource).toContain("loop.name.trim() === title")
    expect(tipcSource).toContain("loop.prompt.trim() === firstUserMessage")
    expect(tipcSource).toContain("agentSessionTracker.getActiveSessions().map(withRepeatTaskSessionFlag)")
  })
})