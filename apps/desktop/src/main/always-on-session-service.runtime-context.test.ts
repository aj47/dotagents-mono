import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const serviceSource = readFileSync(new URL("./always-on-session-service.ts", import.meta.url), "utf8")

describe("always-on session runtime context resolution", () => {
  it("links answered-question branch conversations back to the always-on session", () => {
    expect(serviceSource).toContain("getRuntimeLinkedSessionId(")
    expect(serviceSource).toContain("question.branchConversationId === input.conversationId")
    expect(serviceSource).toContain("question.conversationId === input.conversationId")
    expect(serviceSource).toContain("session.conversationId === input.conversationId")
  })

  it("persists explicit goals and resets visible session state without deleting old logs", () => {
    expect(serviceSource).toContain("goal?: string")
    expect(serviceSource).toContain("const DEFAULT_ALWAYS_ON_GOAL")
    expect(serviceSource).toContain("function extractLoopPromptGoal(")
    expect(serviceSource).toContain("Current goal: ${cleanGoal}")
    expect(serviceSource).toContain("goal: record.goal ?? extractLoopPromptGoal(loop?.prompt)")
    expect(serviceSource).toContain("setGoal(alwaysOnSessionId: string, goal: string)")
    expect(serviceSource).toContain("resetSession(alwaysOnSessionId: string)")
    expect(serviceSource).toContain("record.logPath = this.getResetLogPath(record.id)")
    expect(serviceSource).toContain("record.logCount = 0")
    expect(serviceSource).toContain("record.questions = []")
  })
})
