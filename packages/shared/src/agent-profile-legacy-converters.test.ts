import { describe, expect, it } from "vitest"

import {
  legacyAcpAgentConfigToAgentProfileAtTime,
  legacyPersonaToAgentProfile,
  legacyProfileToAgentProfile,
  type LegacyAcpAgentConfig,
  type LegacyPersonaRecord,
  type LegacyPersonasData,
  type LegacyProfilesData,
} from "./agent-profile-legacy-converters"

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe("agent profile legacy converters", () => {
  it("exposes legacy storage contracts used by desktop migrations", () => {
    const profiles: LegacyProfilesData = {
      currentProfileId: "profile-1",
      profiles: [
        {
          id: "profile-1",
          name: "Default",
          guidelines: "Use concise responses.",
          createdAt: 10,
          updatedAt: 20,
          modelConfig: {
            agentProviderId: "openai",
          },
        },
      ],
    }

    const persona: LegacyPersonaRecord = {
      id: "agent-1",
      name: "research",
      displayName: "Research",
      description: "Researches topics",
      systemPrompt: "Research carefully.",
      guidelines: "Cite sources.",
      mcpServerConfig: {
        enabledServers: ["browser"],
      },
      modelConfig: {
        providerId: "openai",
        model: "gpt-4o",
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
      },
      connection: {
        type: "acp-agent",
        acpAgentName: "research-backend",
      },
      isStateful: false,
      enabled: true,
      createdAt: 30,
      updatedAt: 40,
    }

    const personas: LegacyPersonasData = {
      personas: [persona],
    }

    const acpAgent: LegacyAcpAgentConfig = {
      name: "claude",
      displayName: "Claude",
      connection: {
        type: "acp",
        command: "claude",
      },
    }

    assertType<LegacyProfilesData>(profiles)
    assertType<LegacyPersonasData>(personas)
    assertType<LegacyAcpAgentConfig>(acpAgent)
    expect(personas.personas[0].connection.acpAgentName).toBe("research-backend")
  })

  it("converts a legacy chat profile into an agent profile", () => {
    expect(legacyProfileToAgentProfile({
      id: "profile-1",
      name: "Default",
      guidelines: "Be useful.",
      systemPrompt: "System",
      createdAt: 10,
      updatedAt: 20,
      isDefault: true,
      mcpServerConfig: {
        disabledServers: ["github"],
        disabledTools: ["shell"],
        allServersDisabledByDefault: true,
        enabledServers: ["filesystem"],
        enabledRuntimeTools: ["screenshot"],
      },
      modelConfig: {
        agentProviderId: "openai",
      },
      skillsConfig: {
        enabledSkillIds: ["planning"],
      },
    })).toEqual({
      id: "profile-1",
      name: "Default",
      displayName: "Default",
      description: undefined,
      systemPrompt: "System",
      guidelines: "Be useful.",
      properties: undefined,
      modelConfig: {
        agentProviderId: "openai",
      },
      toolConfig: {
        disabledServers: ["github"],
        disabledTools: ["shell"],
        allServersDisabledByDefault: true,
        enabledServers: ["filesystem"],
        enabledRuntimeTools: ["screenshot"],
      },
      skillsConfig: {
        enabledSkillIds: ["planning"],
      },
      connection: { type: "internal" },
      isStateful: false,
      role: "chat-agent",
      enabled: true,
      isBuiltIn: false,
      isUserProfile: true,
      isAgentTarget: false,
      isDefault: true,
      createdAt: 10,
      updatedAt: 20,
    })
  })

  it("converts a legacy persona into a delegation target and normalizes stdio to acpx", () => {
    expect(legacyPersonaToAgentProfile({
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      description: "Researches topics",
      systemPrompt: "Research carefully.",
      guidelines: "Cite sources.",
      properties: { focus: "accuracy" },
      mcpServerConfig: {
        enabledServers: ["browser"],
        disabledTools: ["delete_file"],
        enabledRuntimeTools: ["open_url"],
      },
      profileModelConfig: {
        agentProviderId: "gemini",
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
      },
      connection: {
        type: "stdio",
        command: "agent-cli",
        args: ["--acp"],
        env: { FOO: "bar" },
        cwd: "/tmp/work",
      },
      isStateful: true,
      conversationId: "conversation-1",
      enabled: true,
      isBuiltIn: false,
      createdAt: 30,
      updatedAt: 40,
    })).toEqual({
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      description: "Researches topics",
      systemPrompt: "Research carefully.",
      guidelines: "Cite sources.",
      properties: { focus: "accuracy" },
      modelConfig: {
        agentProviderId: "gemini",
      },
      toolConfig: {
        enabledServers: ["browser"],
        disabledTools: ["delete_file"],
        enabledRuntimeTools: ["open_url"],
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
      },
      connection: {
        type: "acpx",
        command: "agent-cli",
        args: ["--acp"],
        env: { FOO: "bar" },
        cwd: "/tmp/work",
        baseUrl: undefined,
      },
      isStateful: true,
      conversationId: "conversation-1",
      role: "delegation-target",
      enabled: true,
      isBuiltIn: false,
      isUserProfile: false,
      isAgentTarget: true,
      createdAt: 30,
      updatedAt: 40,
    })
  })

  it("converts legacy ACP config into an external acpx agent profile", () => {
    expect(legacyAcpAgentConfigToAgentProfileAtTime({
      name: "claude",
      displayName: "Claude",
      description: "Claude Code",
      autoSpawn: true,
      enabled: undefined,
      isInternal: true,
      connection: {
        type: "acp",
        command: "claude",
        args: ["--acp"],
        env: { ANTHROPIC_API_KEY: "test" },
        cwd: "/tmp/project",
      },
    }, 123)).toEqual({
      id: "claude",
      name: "claude",
      displayName: "Claude",
      description: "Claude Code",
      connection: {
        type: "acpx",
        agent: "claude",
        command: "claude",
        args: ["--acp"],
        env: { ANTHROPIC_API_KEY: "test" },
        cwd: "/tmp/project",
        baseUrl: undefined,
      },
      role: "external-agent",
      enabled: true,
      isBuiltIn: true,
      isUserProfile: false,
      isAgentTarget: true,
      autoSpawn: true,
      createdAt: 123,
      updatedAt: 123,
    })
  })
})
