import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("tipc selected-agent routing", () => {
  it("checks the selected or revived profile before falling back to global ACP main-agent config", () => {
    expect(tipcSource).toContain("resolvePreferredTopLevelAcpAgentSelection({")
    expect(tipcSource).toContain("sessionProfileId: existingProfileSnapshot?.profileId")
    expect(tipcSource).toContain('topLevelAcpSelection.source === "main-agent"')
  })

  it("captures the selected profile snapshot when starting an ACP-backed top-level session", () => {
    expect(tipcSource).toContain(
      "agentSessionTracker.startSession(conversationId, conversationTitle, startSnoozed, profileSnapshot)"
    )
  })
})