import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(new URL("./settings-agents.tsx", import.meta.url), "utf8")

describe("settings agents capability config", () => {
  it("uses shared agent profile capability helpers for desktop MCP and runtime toggles", () => {
    expect(settingsAgentsSource).toContain("getAgentProfileMcpConfigAfterServerToggle")
    expect(settingsAgentsSource).toContain("getAgentProfileMcpConfigAfterSetAllServersEnabled")
    expect(settingsAgentsSource).toContain("getAgentProfileMcpConfigAfterToolToggle")
    expect(settingsAgentsSource).toContain("getAgentProfileRuntimeToolsConfigAfterSetAllEnabled")
    expect(settingsAgentsSource).toContain("getAgentProfileRuntimeToolsConfigAfterToggle")
    expect(settingsAgentsSource).toContain("isAgentProfileMcpServerEnabled(editing?.toolConfig, serverName)")
    expect(settingsAgentsSource).toContain("isAgentProfileRuntimeToolEnabled(editing?.toolConfig, toolName)")
  })

  it("uses shared skill enablement semantics in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("isAgentProfileSkillEnabled(editing?.skillsConfig, skillId)")
    expect(settingsAgentsSource).toContain("toggleAgentProfileSkillConfig(editing.skillsConfig, skillId, skills.map(s => s.id))")
  })
})
