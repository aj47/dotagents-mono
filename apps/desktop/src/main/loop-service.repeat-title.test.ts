import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")

describe("loop-service repeat task session titles", () => {
  it("persists the repeat-task title on fresh and resumed task conversations", () => {
    expect(loopServiceSource).toContain("const conversationTitle = formatRepeatTaskTitle(loop.name)")
    expect(loopServiceSource).toContain("await conversationService.renameConversationTitle(")
    expect(loopServiceSource).toContain("agentSessionTracker.updateSession(sessionId, { conversationTitle, isRepeatTask: true })")
    expect(loopServiceSource).toContain("agentSessionTracker.startSession(")
    expect(loopServiceSource).toContain("conversationTitle,")
  })

  it("marks fresh and resumed loop sessions as repeat tasks", () => {
    expect(loopServiceSource).toContain("{ conversationTitle, isRepeatTask: true }")
    expect(loopServiceSource).toContain("{ isRepeatTask: true },")
  })
})