import { describe, expect, it } from "vitest"

import {
  getAgentProfileSkillsConfigAfterEnable,
  getEnabledAgentProfileSkillIds,
  hasAllAgentProfileSkillsEnabledByDefault,
  isAgentProfileSkillEnabled,
  mergeAgentProfileMcpConfig,
  mergeAgentProfileModelConfig,
  mergeAgentProfileSkillsConfig,
  toggleAgentProfileSkillConfig,
} from "./agent-profile-config-updates"

describe("agent profile config updates", () => {
  it("merges MCP config updates and clears an empty runtime tool whitelist", () => {
    const merged = mergeAgentProfileMcpConfig(
      {
        disabledServers: ["old-server"],
        enabledServers: ["existing"],
        enabledRuntimeTools: ["screenshot"],
      },
      {
        disabledTools: ["server.tool"],
        enabledRuntimeTools: [],
      },
    )

    expect(merged).toEqual({
      disabledServers: ["old-server"],
      disabledTools: ["server.tool"],
      enabledServers: ["existing"],
      enabledRuntimeTools: undefined,
    })
  })

  it("keeps agent and legacy MCP model fields synchronized in both directions", () => {
    expect(mergeAgentProfileModelConfig(
      { agentProviderId: "openai", agentOpenaiModel: "gpt-4.1" },
      { agentProviderId: "gemini", agentGeminiModel: "gemini-2.5-pro" },
    )).toMatchObject({
      agentProviderId: "gemini",
      mcpToolsProviderId: "gemini",
      agentGeminiModel: "gemini-2.5-pro",
      mcpToolsGeminiModel: "gemini-2.5-pro",
    })

    expect(mergeAgentProfileModelConfig(
      { mcpToolsProviderId: "openai", mcpToolsOpenaiModel: "gpt-4.1" },
      { mcpToolsProviderId: "groq", mcpToolsGroqModel: "llama-3.3" },
    )).toMatchObject({
      agentProviderId: "groq",
      mcpToolsProviderId: "groq",
      agentGroqModel: "llama-3.3",
      mcpToolsGroqModel: "llama-3.3",
    })
  })

  it("merges explicit skills config updates", () => {
    expect(mergeAgentProfileSkillsConfig(
      { enabledSkillIds: ["research"], allSkillsDisabledByDefault: true },
      { enabledSkillIds: ["writing"] },
    )).toEqual({
      enabledSkillIds: ["writing"],
      allSkillsDisabledByDefault: true,
    })
  })

  it("models profile skill enablement semantics", () => {
    expect(hasAllAgentProfileSkillsEnabledByDefault(undefined)).toBe(true)
    expect(getEnabledAgentProfileSkillIds(undefined)).toBeNull()
    expect(isAgentProfileSkillEnabled(undefined, "research")).toBe(true)

    const strictConfig = {
      enabledSkillIds: ["research"],
      allSkillsDisabledByDefault: true,
    }
    expect(hasAllAgentProfileSkillsEnabledByDefault(strictConfig)).toBe(false)
    expect(getEnabledAgentProfileSkillIds(strictConfig)).toEqual(["research"])
    expect(isAgentProfileSkillEnabled(strictConfig, "writing")).toBe(false)
  })

  it("toggles from all-enabled mode into opt-in mode and collapses back when all skills are selected", () => {
    const optInConfig = toggleAgentProfileSkillConfig(undefined, "writing", ["research", "writing"])
    expect(optInConfig).toEqual({
      enabledSkillIds: ["research"],
      allSkillsDisabledByDefault: true,
    })

    expect(toggleAgentProfileSkillConfig(optInConfig, "writing", ["research", "writing"])).toEqual({
      enabledSkillIds: [],
      allSkillsDisabledByDefault: false,
    })
  })

  it("returns only necessary config updates when enabling an installed skill", () => {
    expect(getAgentProfileSkillsConfigAfterEnable(undefined, "research")).toBeUndefined()
    expect(getAgentProfileSkillsConfigAfterEnable({
      enabledSkillIds: ["research"],
      allSkillsDisabledByDefault: true,
    }, "research")).toBeUndefined()

    expect(getAgentProfileSkillsConfigAfterEnable({
      enabledSkillIds: ["research"],
      allSkillsDisabledByDefault: true,
    }, "writing")).toEqual({
      enabledSkillIds: ["research", "writing"],
      allSkillsDisabledByDefault: true,
    })
  })
})
