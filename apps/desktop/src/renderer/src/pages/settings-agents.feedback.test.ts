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

  it("refreshes the shared agent selector after settings agent changes", () => {
    expect(settingsAgentsSource).toContain("const refreshAgentProfileViews = () => {")
    expect(settingsAgentsSource).toContain('void queryClient.invalidateQueries({ queryKey: ["agentProfilesSidebar"] })')
    expect(settingsAgentsSource).toContain('void queryClient.invalidateQueries({ queryKey: ["agentProfilesSelector"] })')
    expect(settingsAgentsSource).toContain("const handleRescanFiles = async () => {")
    expect(settingsAgentsSource).toContain("await tipcClient.reloadAgentProfiles()")
    expect(settingsAgentsSource).toContain("onClick={handleRescanFiles}")
    expect(settingsAgentsSource.match(/refreshAgentProfileViews\(\)/g)?.length).toBeGreaterThanOrEqual(4)
  })
})