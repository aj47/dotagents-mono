import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const agentLoopRunnerSource = readFileSync(new URL("./agent-loop-runner.ts", import.meta.url), "utf8")

describe("tipc selected-agent routing", () => {
  it("checks the selected or revived profile before falling back to global ACP main-agent config", () => {
    expect(agentLoopRunnerSource).toContain("resolvePreferredTopLevelAcpAgentSelection({")
    expect(agentLoopRunnerSource).toContain("sessionProfileId: existingProfileSnapshot?.profileId")
    expect(agentLoopRunnerSource).toContain('topLevelAcpSelection.source === "main-agent"')
  })

  it("captures the selected profile snapshot when starting an ACP-backed top-level session", () => {
    expect(agentLoopRunnerSource).toContain(
      "agentSessionTracker.startSession(conversationId, conversationTitle, startSnoozed, profileSnapshot)"
    )
  })

  it("lets ACP transcript persistence own the final assistant write", () => {
    expect(tipcSource).not.toContain("if (conversationId && result.response) {")
  })
})
