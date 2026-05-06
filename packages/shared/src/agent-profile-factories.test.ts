import { describe, expect, it } from "vitest"

import {
  agentProfileToLegacyProfile,
  buildInternalDelegationAgentProfileCreateInput,
  createDefaultAgentProfiles,
  DEFAULT_MAIN_AGENT_PROFILE_TEMPLATE,
} from "./agent-profile-factories"

describe("agent profile factories", () => {
  it("creates default built-in profiles with injected ids and timestamps", () => {
    let nextId = 1
    expect(createDefaultAgentProfiles(() => `profile-${nextId++}`, 123)).toEqual([{
      ...DEFAULT_MAIN_AGENT_PROFILE_TEMPLATE,
      id: "profile-1",
      createdAt: 123,
      updatedAt: 123,
    }])
  })

  it("builds internal delegation profile create input with disabled MCP/runtime tools", () => {
    expect(buildInternalDelegationAgentProfileCreateInput(
      "Research Agent",
      "Use sources.",
      "Be precise.",
      ["filesystem", "github"],
      ["screenshot", "open_url"],
    )).toEqual({
      name: "Research Agent",
      displayName: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
      connection: { type: "internal" },
      role: "delegation-target",
      enabled: true,
      isUserProfile: false,
      isAgentTarget: true,
      toolConfig: {
        disabledServers: ["filesystem", "github"],
        disabledTools: ["screenshot", "open_url"],
        allServersDisabledByDefault: true,
      },
    })
  })

  it("converts agent profile records to legacy profile shape", () => {
    expect(agentProfileToLegacyProfile({
      id: "agent-1",
      displayName: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
      createdAt: 10,
      updatedAt: 20,
      isDefault: true,
      toolConfig: {
        enabledServers: ["filesystem"],
        enabledRuntimeTools: ["screenshot"],
      },
      modelConfig: {
        agentProviderId: "openai",
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
      },
    })).toEqual({
      id: "agent-1",
      name: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
      createdAt: 10,
      updatedAt: 20,
      isDefault: true,
      mcpServerConfig: {
        disabledServers: undefined,
        disabledTools: undefined,
        allServersDisabledByDefault: undefined,
        enabledServers: ["filesystem"],
        enabledRuntimeTools: ["screenshot"],
      },
      modelConfig: {
        agentProviderId: "openai",
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
      },
    })
  })
})
