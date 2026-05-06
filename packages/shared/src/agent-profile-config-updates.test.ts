import { describe, expect, it } from "vitest"

import {
  AGENT_PROFILE_AGENT_MODEL_PROVIDER_OPTIONS,
  buildAgentProfileAgentModelUpdate,
  countEnabledAgentProfileMcpServers,
  countEnabledAgentProfileMcpTools,
  countEnabledAgentProfileRuntimeTools,
  countEnabledAgentProfileSkills,
  formatAgentProfileMcpConfigForRequest,
  formatAgentProfileModelConfigForRequest,
  formatAgentProfileSkillsConfigForRequest,
  getAgentProfileAgentModelField,
  getAgentProfileAgentModelProvider,
  getAgentProfileAgentModelProviderFromOptionValue,
  getAgentProfileAgentModelProviderOptionValue,
  getAgentProfileAgentModelValue,
  getAgentProfileMcpConfigAfterServerToggle,
  getAgentProfileMcpConfigAfterSetAllServersEnabled,
  getAgentProfileMcpConfigAfterToolToggle,
  getAgentProfileModelConfigAfterProviderSelect,
  getAgentProfileRuntimeToolsConfigAfterSetAllEnabled,
  getAgentProfileRuntimeToolsConfigAfterToggle,
  getAgentProfileSkillsConfigAfterSetAllEnabled,
  getAgentProfileSkillsConfigAfterEnable,
  getEnabledAgentProfileSkillIds,
  hasAllAgentProfileSkillsEnabledByDefault,
  hasAllAgentProfileMcpServersEnabled,
  hasAllAgentProfileRuntimeToolsEnabled,
  hasAllAgentProfileSkillsEnabled,
  hasNoAgentProfileMcpServersEnabled,
  hasNoAgentProfileSkillsEnabled,
  hasOnlyEssentialAgentProfileRuntimeToolsEnabled,
  isAgentProfileMcpServerEnabled,
  isAgentProfileMcpToolEnabled,
  isAgentProfileRuntimeToolEnabled,
  isAgentProfileSkillEnabled,
  mergeAgentProfileMcpConfig,
  mergeAgentProfileModelConfig,
  mergeAgentProfileSkillsConfig,
  normalizeAgentProfileMcpConfigForEdit,
  normalizeAgentProfileModelConfigForEdit,
  normalizeAgentProfileSkillsConfigForEdit,
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

  it("can explicitly clear MCP config arrays during merges", () => {
    expect(mergeAgentProfileMcpConfig(
      {
        disabledServers: ["old-server"],
        disabledTools: ["old-tool"],
        enabledServers: ["enabled-server"],
      },
      {
        disabledServers: undefined,
        disabledTools: undefined,
        enabledServers: undefined,
      },
    )).toEqual({
      disabledServers: undefined,
      disabledTools: undefined,
      enabledServers: undefined,
    })
  })

  it("models per-agent MCP server and tool enablement", () => {
    expect(isAgentProfileMcpServerEnabled(undefined, "filesystem")).toBe(true)
    expect(isAgentProfileMcpServerEnabled({ disabledServers: ["filesystem"] }, "filesystem")).toBe(false)
    expect(isAgentProfileMcpServerEnabled({
      allServersDisabledByDefault: true,
      enabledServers: ["github"],
    }, "filesystem")).toBe(false)
    expect(isAgentProfileMcpToolEnabled({ disabledTools: ["filesystem.read"] }, "filesystem.read")).toBe(false)
  })

  it("counts per-agent MCP server and tool enablement", () => {
    const serverNames = ["filesystem", "github"]
    expect(countEnabledAgentProfileMcpServers(undefined, serverNames)).toBe(2)
    expect(hasAllAgentProfileMcpServersEnabled(undefined, serverNames)).toBe(true)
    expect(hasNoAgentProfileMcpServersEnabled(undefined, serverNames)).toBe(false)

    const strictConfig = {
      allServersDisabledByDefault: true,
      enabledServers: ["github"],
      disabledTools: ["github.search"],
    }
    expect(countEnabledAgentProfileMcpServers(strictConfig, serverNames)).toBe(1)
    expect(hasAllAgentProfileMcpServersEnabled(strictConfig, serverNames)).toBe(false)
    expect(hasNoAgentProfileMcpServersEnabled({ allServersDisabledByDefault: true, enabledServers: [] }, serverNames)).toBe(true)
    expect(countEnabledAgentProfileMcpTools(strictConfig, ["github.search", "github.fetch"])).toBe(1)
  })

  it("toggles per-agent MCP server lists in default and strict modes", () => {
    expect(getAgentProfileMcpConfigAfterServerToggle(undefined, "filesystem")).toEqual({
      disabledServers: ["filesystem"],
      enabledServers: undefined,
      allServersDisabledByDefault: false,
    })

    expect(getAgentProfileMcpConfigAfterServerToggle({
      allServersDisabledByDefault: true,
      enabledServers: ["filesystem"],
      disabledServers: ["ignored"],
    }, "github")).toEqual({
      allServersDisabledByDefault: true,
      enabledServers: ["filesystem", "github"],
      disabledServers: undefined,
    })
  })

  it("sets all MCP servers enabled or disabled with one shared config transition", () => {
    expect(getAgentProfileMcpConfigAfterSetAllServersEnabled({
      disabledServers: ["filesystem"],
      enabledServers: ["github"],
    }, true)).toEqual({
      disabledServers: [],
      enabledServers: undefined,
      allServersDisabledByDefault: false,
    })

    expect(getAgentProfileMcpConfigAfterSetAllServersEnabled(undefined, false)).toEqual({
      disabledServers: undefined,
      enabledServers: [],
      allServersDisabledByDefault: true,
    })
  })

  it("toggles per-agent disabled MCP tools and clears the list when all are enabled", () => {
    const disabled = getAgentProfileMcpConfigAfterToolToggle(undefined, "filesystem.read")
    expect(disabled).toEqual({ disabledTools: ["filesystem.read"] })
    expect(getAgentProfileMcpConfigAfterToolToggle(disabled, "filesystem.read")).toEqual({
      disabledTools: undefined,
    })
  })

  it("models runtime tool allowlists while preserving the essential completion tool", () => {
    const runtimeTools = ["respond_to_user", "mark_work_complete", "screenshot"]
    expect(isAgentProfileRuntimeToolEnabled(undefined, "respond_to_user")).toBe(true)
    expect(isAgentProfileRuntimeToolEnabled({ enabledRuntimeTools: ["respond_to_user"] }, "screenshot")).toBe(false)
    expect(isAgentProfileRuntimeToolEnabled({ enabledRuntimeTools: [] }, "screenshot")).toBe(true)
    expect(isAgentProfileRuntimeToolEnabled({ enabledRuntimeTools: [] }, "mark_work_complete")).toBe(true)

    expect(getAgentProfileRuntimeToolsConfigAfterSetAllEnabled(undefined, false)).toEqual({
      enabledRuntimeTools: ["mark_work_complete"],
    })

    const withoutScreenshot = getAgentProfileRuntimeToolsConfigAfterToggle(undefined, "screenshot", runtimeTools)
    expect(withoutScreenshot).toEqual({
      enabledRuntimeTools: ["respond_to_user", "mark_work_complete"],
    })

    expect(getAgentProfileRuntimeToolsConfigAfterToggle(withoutScreenshot, "screenshot", runtimeTools)).toEqual({
      enabledRuntimeTools: undefined,
    })
    expect(getAgentProfileRuntimeToolsConfigAfterToggle(withoutScreenshot, "mark_work_complete", runtimeTools)).toEqual(withoutScreenshot)
  })

  it("counts runtime tool enablement and all/essential-only states", () => {
    const runtimeTools = ["respond_to_user", "mark_work_complete", "screenshot"]
    expect(countEnabledAgentProfileRuntimeTools(undefined, runtimeTools)).toBe(3)
    expect(hasAllAgentProfileRuntimeToolsEnabled(undefined, runtimeTools)).toBe(true)
    expect(hasOnlyEssentialAgentProfileRuntimeToolsEnabled(undefined)).toBe(false)

    const onlyEssential = { enabledRuntimeTools: ["mark_work_complete"] }
    expect(countEnabledAgentProfileRuntimeTools(onlyEssential, runtimeTools)).toBe(1)
    expect(hasAllAgentProfileRuntimeToolsEnabled(onlyEssential, runtimeTools)).toBe(false)
    expect(hasOnlyEssentialAgentProfileRuntimeToolsEnabled(onlyEssential)).toBe(true)
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

  it("resolves per-agent model providers, fields, values, and update payloads", () => {
    expect(AGENT_PROFILE_AGENT_MODEL_PROVIDER_OPTIONS.map(option => option.value)).toEqual([
      "global",
      "openai",
      "groq",
      "gemini",
      "chatgpt-web",
    ])
    expect(getAgentProfileAgentModelProvider({
      mcpToolsProviderId: "gemini",
    })).toBe("gemini")
    expect(getAgentProfileAgentModelProvider({
      agentProviderId: "openai",
      mcpToolsProviderId: "gemini",
    })).toBe("openai")
    expect(getAgentProfileAgentModelProviderOptionValue(undefined)).toBe("global")
    expect(getAgentProfileAgentModelProviderOptionValue("groq")).toBe("groq")
    expect(getAgentProfileAgentModelProviderFromOptionValue("global")).toBeUndefined()
    expect(getAgentProfileAgentModelProviderFromOptionValue("gemini")).toBe("gemini")
    expect(getAgentProfileAgentModelProviderFromOptionValue("unknown")).toBeUndefined()
    expect(getAgentProfileAgentModelField("groq")).toBe("agentGroqModel")
    expect(getAgentProfileAgentModelValue({
      agentProviderId: "gemini",
      mcpToolsGeminiModel: "gemini-2.5-flash",
    }, "gemini")).toBe("gemini-2.5-flash")
    expect(buildAgentProfileAgentModelUpdate("chatgpt-web", "gpt-5.4-mini")).toEqual({
      agentProviderId: "chatgpt-web",
      agentChatgptWebModel: "gpt-5.4-mini",
    })
  })

  it("selects per-agent model providers with one shared config transition", () => {
    expect(getAgentProfileModelConfigAfterProviderSelect({
      agentProviderId: "openai",
      mcpToolsProviderId: "openai",
      agentOpenaiModel: "gpt-4.1",
    }, undefined)).toEqual({})

    expect(getAgentProfileModelConfigAfterProviderSelect({
      agentProviderId: "openai",
      mcpToolsProviderId: "openai",
      agentOpenaiModel: "gpt-4.1",
    }, "gemini")).toMatchObject({
      agentProviderId: "gemini",
      mcpToolsProviderId: "gemini",
      agentOpenaiModel: "gpt-4.1",
    })
  })

  it("normalizes editable agent profile config payloads", () => {
    const modelConfig = normalizeAgentProfileModelConfigForEdit({
      mcpToolsProviderId: "gemini",
      mcpToolsGeminiModel: "gemini-2.5-flash",
      agentOpenaiModel: 123,
      currentModelPresetId: "preset-1",
      sttProviderId: "parakeet",
      transcriptPostProcessingProviderId: "openai",
      transcriptPostProcessingOpenaiModel: "gpt-5.4-mini",
      ttsProviderId: "edge",
      invalid: "ignored",
    })

    expect(modelConfig).toEqual({
      agentProviderId: "gemini",
      mcpToolsProviderId: "gemini",
      agentGeminiModel: "gemini-2.5-flash",
      mcpToolsGeminiModel: "gemini-2.5-flash",
      currentModelPresetId: "preset-1",
      sttProviderId: "parakeet",
      transcriptPostProcessingProviderId: "openai",
      transcriptPostProcessingOpenaiModel: "gpt-5.4-mini",
      ttsProviderId: "edge",
    })
    expect(formatAgentProfileModelConfigForRequest(modelConfig)).toEqual(modelConfig)

    const mcpConfig = normalizeAgentProfileMcpConfigForEdit({
      disabledServers: ["filesystem", 1, "github"],
      enabledServers: "drop",
      enabledRuntimeTools: ["mark_work_complete"],
      allServersDisabledByDefault: true,
    })
    expect(mcpConfig).toEqual({
      disabledServers: ["filesystem", "github"],
      enabledRuntimeTools: ["mark_work_complete"],
      allServersDisabledByDefault: true,
    })
    expect(formatAgentProfileMcpConfigForRequest(mcpConfig)).toEqual({
      disabledServers: ["filesystem", "github"],
      disabledTools: undefined,
      enabledServers: undefined,
      enabledRuntimeTools: ["mark_work_complete"],
      allServersDisabledByDefault: true,
    })

    const skillsConfig = normalizeAgentProfileSkillsConfigForEdit({
      enabledSkillIds: ["research", false, "writing"],
      allSkillsDisabledByDefault: true,
    })
    expect(skillsConfig).toEqual({
      enabledSkillIds: ["research", "writing"],
      allSkillsDisabledByDefault: true,
    })
    expect(formatAgentProfileSkillsConfigForRequest(skillsConfig)).toEqual(skillsConfig)
    expect(formatAgentProfileSkillsConfigForRequest({ allSkillsDisabledByDefault: true })).toEqual({
      enabledSkillIds: [],
      allSkillsDisabledByDefault: true,
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

  it("counts profile skill enablement and all/none states", () => {
    const skillIds = ["research", "writing"]
    expect(countEnabledAgentProfileSkills(undefined, skillIds)).toBe(2)
    expect(hasAllAgentProfileSkillsEnabled(undefined, skillIds)).toBe(true)
    expect(hasNoAgentProfileSkillsEnabled(undefined, skillIds)).toBe(false)

    const strictConfig = {
      enabledSkillIds: ["research"],
      allSkillsDisabledByDefault: true,
    }
    expect(countEnabledAgentProfileSkills(strictConfig, skillIds)).toBe(1)
    expect(hasAllAgentProfileSkillsEnabled(strictConfig, skillIds)).toBe(false)
    expect(hasNoAgentProfileSkillsEnabled({
      enabledSkillIds: [],
      allSkillsDisabledByDefault: true,
    }, skillIds)).toBe(true)
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

  it("sets all profile skills enabled or disabled with one shared config transition", () => {
    expect(getAgentProfileSkillsConfigAfterSetAllEnabled(true)).toEqual({
      enabledSkillIds: [],
      allSkillsDisabledByDefault: false,
    })
    expect(getAgentProfileSkillsConfigAfterSetAllEnabled(false)).toEqual({
      enabledSkillIds: [],
      allSkillsDisabledByDefault: true,
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
