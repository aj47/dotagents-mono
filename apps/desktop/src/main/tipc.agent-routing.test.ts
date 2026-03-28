import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("tipc selected-agent routing", () => {
  it("delegates fresh and resumed prompts to shared launch/run helpers while preserving session history", () => {
    expect(tipcSource).toContain(
      "const previousConversationHistory = previousConversationHistoryOverride",
    )
    expect(tipcSource).toContain("async function startDesktopPromptRun(")
    expect(tipcSource).toContain("return startSharedPromptRun({")
    expect(tipcSource).toContain("const result = await runTopLevelAgentMode({")
    expect(tipcSource).toContain("existingSessionId")
  })

  it("passes panel focus through the shared runner instead of duplicating ACP selection logic", () => {
    expect(tipcSource).toContain("async function focusDesktopSession(sessionId: string): Promise<void>")
    expect(tipcSource).not.toContain("resolvePreferredTopLevelAcpAgentSelection({")
  })

  it("keeps ACP transcript persistence owned by the shared runner", () => {
    expect(tipcSource).not.toContain("processTranscriptWithACPAgent(")
    expect(tipcSource).not.toContain("if (conversationId && result.response) {")
  })
})
