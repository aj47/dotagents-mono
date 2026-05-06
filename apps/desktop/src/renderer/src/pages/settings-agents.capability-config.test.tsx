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

  it("uses shared per-agent model field helpers in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("getAgentProfileAgentModelProvider")
    expect(settingsAgentsSource).toContain("getAgentProfileAgentModelValue")
    expect(settingsAgentsSource).toContain("buildAgentProfileAgentModelUpdate")
    expect(settingsAgentsSource).not.toContain("editing.modelConfig.agentOpenaiModel || editing.modelConfig.mcpToolsOpenaiModel")
  })

  it("uses shared connection normalization before saving desktop agents", () => {
    expect(settingsAgentsSource).toContain("sanitizeAgentProfileConnection")
    expect(settingsAgentsSource).not.toContain("const connection: AgentProfileConnection")
    expect(settingsAgentsSource).not.toContain("baseUrl: editing.connectionBaseUrl")
  })

  it("uses shared profile property helpers in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("normalizeAgentProfileProperties")
    expect(settingsAgentsSource).toContain("formatAgentProfilePropertiesForRequest")
    expect(settingsAgentsSource).not.toContain("Object.keys(editing.properties).length > 0 ? editing.properties : undefined")
  })

  it("uses shared profile config edit helpers in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("normalizeAgentProfileModelConfigForEdit")
    expect(settingsAgentsSource).toContain("normalizeAgentProfileMcpConfigForEdit")
    expect(settingsAgentsSource).toContain("normalizeAgentProfileSkillsConfigForEdit")
    expect(settingsAgentsSource).toContain("formatAgentProfileModelConfigForRequest")
    expect(settingsAgentsSource).toContain("formatAgentProfileMcpConfigForRequest")
    expect(settingsAgentsSource).toContain("formatAgentProfileSkillsConfigForRequest")
    expect(settingsAgentsSource).not.toContain("modelConfig: agent.modelConfig ? { ...agent.modelConfig } : undefined")
    expect(settingsAgentsSource).not.toContain("toolConfig: agent.toolConfig ? { ...agent.toolConfig } : undefined")
    expect(settingsAgentsSource).not.toContain("skillsConfig: agent.skillsConfig ? { ...agent.skillsConfig } : undefined")
  })
})
