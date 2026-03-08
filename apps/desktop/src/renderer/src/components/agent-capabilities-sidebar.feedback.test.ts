import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./agent-capabilities-sidebar.tsx", import.meta.url), "utf8")

function getBlock(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)
  return source.slice(start, end)
}

describe("desktop agent capabilities sidebar feedback", () => {
  it("surfaces visible feedback when capability updates fail or the agent is stale", () => {
    const updateBlock = getBlock(
      "const updateAgent = useCallback(async (id: string, updates: Partial<AgentProfile>) => {",
      "  // ── Capability helpers (per agent) ──",
    )

    expect(source).toContain('import { toast } from "sonner"')
    expect(source).toContain("function getAgentCapabilityErrorMessage(error: unknown, fallback: string): string")
    expect(updateBlock).toContain("const updatedAgent = await tipcClient.updateAgentProfile({ id, updates })")
    expect(updateBlock).toContain('if (!updatedAgent) {')
    expect(updateBlock).toContain('toast.error("Failed to update agent capabilities. This agent may no longer exist.")')
    expect(updateBlock).toContain('console.error("[AgentCapabilitiesSidebar] Failed to update agent profile:", error)')
    expect(updateBlock).toContain(
      '`Failed to update agent capabilities. ${getAgentCapabilityErrorMessage(error, "Please try again.")}`',
    )
    expect(updateBlock).toContain('await queryClient.invalidateQueries({ queryKey: ["agentProfilesSidebar"] })')
  })

  it("marks toggle-driven updates as intentional fire-and-forget calls", () => {
    expect(source).toContain("void updateAgent(agent.id, { skillsConfig: { enabledSkillIds: allExcept, allSkillsDisabledByDefault: true } })")
    expect(source).toContain("void updateAgent(agent.id, { toolConfig: { ...tc, disabledTools: disabled } })")
    expect(source).toContain(
      "void updateAgent(agent.id, { toolConfig: { ...tc, enabledBuiltinTools: currentList.length > 0 ? currentList : undefined } })",
    )
  })
})