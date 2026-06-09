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
})
