import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(new URL("./settings-agents.tsx", import.meta.url), "utf8")

describe("desktop settings agents failure feedback", () => {
  it("does not treat stale save results as success", () => {
    expect(settingsAgentsSource).toContain("function getSaveAgentFailureMessage(): string")
    expect(settingsAgentsSource).toContain("const savedAgent = isCreating")
    expect(settingsAgentsSource).toContain("if (!savedAgent) {")
    expect(settingsAgentsSource).toContain('toast.error(getSaveAgentFailureMessage())')
    expect(settingsAgentsSource).toContain('toast.error(getAgentMutationErrorMessage("save", error))')
  })

  it("does not treat false delete results as success", () => {
    expect(settingsAgentsSource).toContain("function getDeleteAgentFailureMessage(): string")
    expect(settingsAgentsSource).toContain("const didDelete = await tipcClient.deleteAgentProfile({ id })")
    expect(settingsAgentsSource).toContain("if (!didDelete) {")
    expect(settingsAgentsSource).toContain('toast.error(getDeleteAgentFailureMessage())')
    expect(settingsAgentsSource).toContain('toast.error(getAgentMutationErrorMessage("delete", error))')
  })
})