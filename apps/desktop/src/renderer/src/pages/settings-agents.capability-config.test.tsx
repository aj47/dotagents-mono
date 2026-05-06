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
    expect(settingsAgentsSource).toContain("hasAllAgentProfileMcpServersEnabled(editing?.toolConfig, serverNames)")
    expect(settingsAgentsSource).toContain("hasNoAgentProfileMcpServersEnabled(editing?.toolConfig, serverNames)")
    expect(settingsAgentsSource).toContain("hasAllAgentProfileRuntimeToolsEnabled(editing?.toolConfig, runtimeTools.map(t => t.name))")
    expect(settingsAgentsSource).toContain("hasOnlyEssentialAgentProfileRuntimeToolsEnabled(editing?.toolConfig)")
    expect(settingsAgentsSource).toContain("isAgentProfileMcpServerEnabled(editing?.toolConfig, serverName)")
    expect(settingsAgentsSource).toContain("isAgentProfileRuntimeToolEnabled(editing?.toolConfig, toolName)")
    expect(settingsAgentsSource).not.toContain("serverNames.every(n => isServerEnabled(n))")
    expect(settingsAgentsSource).not.toContain("editing.toolConfig.enabledRuntimeTools.length === 0")
  })

  it("uses shared skill enablement semantics in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("isAgentProfileSkillEnabled(editing?.skillsConfig, skillId)")
    expect(settingsAgentsSource).toContain("toggleAgentProfileSkillConfig(editing.skillsConfig, skillId, skills.map(s => s.id))")
    expect(settingsAgentsSource).toContain("getAgentProfileSkillsConfigAfterSetAllEnabled(true)")
    expect(settingsAgentsSource).toContain("getAgentProfileSkillsConfigAfterSetAllEnabled(false)")
    expect(settingsAgentsSource).toContain("hasAllAgentProfileSkillsEnabled(editing?.skillsConfig, skills.map(s => s.id))")
    expect(settingsAgentsSource).toContain("hasNoAgentProfileSkillsEnabled(editing?.skillsConfig, skills.map(s => s.id))")
    expect(settingsAgentsSource).not.toContain("skillsConfig: { enabledSkillIds: [], allSkillsDisabledByDefault")
    expect(settingsAgentsSource).not.toContain("editing?.skillsConfig?.enabledSkillIds?.length === skills.length")
  })

  it("uses shared per-agent model field helpers in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("getAgentProfileAgentModelProvider")
    expect(settingsAgentsSource).toContain("getAgentProfileAgentModelValue")
    expect(settingsAgentsSource).toContain("getAgentProfileModelConfigAfterProviderSelect")
    expect(settingsAgentsSource).toContain("buildAgentProfileAgentModelUpdate")
    expect(settingsAgentsSource).toContain("mergeAgentProfileModelConfig")
    expect(settingsAgentsSource).not.toContain("editing.modelConfig.agentOpenaiModel || editing.modelConfig.mcpToolsOpenaiModel")
    expect(settingsAgentsSource).not.toContain("setEditing({ ...editing, modelConfig: undefined })")
    expect(settingsAgentsSource).not.toContain("updateModelConfig({ agentProviderId:")
  })

  it("uses shared connection normalization before saving desktop agents", () => {
    expect(settingsAgentsSource).toContain("applyConnectionTypeChange")
    expect(settingsAgentsSource).toContain("buildAgentConnectionCommandPreview")
    expect(settingsAgentsSource).toContain("normalizeAgentConnectionArgs")
    expect(settingsAgentsSource).toContain("sanitizeAgentProfileConnection")
    expect(settingsAgentsSource).toContain("normalizeAgentEditConnectionType")
    expect(settingsAgentsSource).not.toContain("setEditing({ ...editing, connectionType: v })")
    expect(settingsAgentsSource).not.toContain("function buildCommandPreview")
    expect(settingsAgentsSource).not.toContain("editing.connectionArgs?.split(\" \").filter(Boolean)")
    expect(settingsAgentsSource).not.toContain("const connection: AgentProfileConnection")
    expect(settingsAgentsSource).not.toContain("baseUrl: editing.connectionBaseUrl")
    expect(settingsAgentsSource).not.toContain("connectionType: agent.connection.type")
  })

  it("uses shared editable preset fields in the desktop agent editor", () => {
    expect(settingsAgentsSource).toContain("getAgentProfilePresetFormFields")
    expect(settingsAgentsSource).toContain("getAgentProfilePresetFormFields(presetKey)")
    expect(settingsAgentsSource).not.toContain("...emptyAgent(), ...preset, presetKey")
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
