import { describe, expect, it } from "vitest"

import {
  isReservedAgentProfileMcpServerName,
  isStringArray,
  isValidAgentProfileMcpServerConfig,
  isValidAgentProfileMcpServerDefinition,
  isValidAgentProfileModelConfig,
  isValidAgentProfileSkillsConfig,
} from "./agent-profile-config-validation"

describe("agent profile config validation", () => {
  it("validates string arrays", () => {
    expect(isStringArray(["alpha", "beta"])).toBe(true)
    expect(isStringArray(["alpha", 1])).toBe(false)
    expect(isStringArray("alpha")).toBe(false)
  })

  it("detects reserved MCP server names case-insensitively", () => {
    expect(isReservedAgentProfileMcpServerName(" dotagents-runtime-tools ")).toBe(true)
    expect(isReservedAgentProfileMcpServerName("DOTAGENTS-RUNTIME-TOOLS")).toBe(true)
    expect(isReservedAgentProfileMcpServerName("workspace-tools")).toBe(false)
  })

  it("accepts valid MCP server definitions", () => {
    expect(isValidAgentProfileMcpServerDefinition({
      transport: "stdio",
      command: "node",
      args: ["server.js"],
      env: { API_KEY: "secret" },
      timeout: 30,
      disabled: false,
    })).toBe(true)

    expect(isValidAgentProfileMcpServerDefinition({
      transport: "streamableHttp",
      url: "https://mcp.example/sse",
      headers: { Authorization: "Bearer token" },
      oauth: {
        clientId: "client",
        useDiscovery: true,
        serverMetadata: {
          authorization_endpoint: "https://auth.example/authorize",
          token_endpoint: "https://auth.example/token",
        },
      },
    })).toBe(true)
  })

  it("rejects invalid MCP server definitions", () => {
    expect(isValidAgentProfileMcpServerDefinition({ transport: "stdio" })).toBe(false)
    expect(isValidAgentProfileMcpServerDefinition({ transport: "websocket" })).toBe(false)
    expect(isValidAgentProfileMcpServerDefinition({ command: "node", args: ["ok", 123] })).toBe(false)
    expect(isValidAgentProfileMcpServerDefinition({ command: "node", env: { API_KEY: 123 } })).toBe(false)
    expect(isValidAgentProfileMcpServerDefinition({ url: "https://mcp.example", oauth: { useDiscovery: "yes" } })).toBe(false)
  })

  it("validates MCP server, model, and skills config shapes", () => {
    expect(isValidAgentProfileMcpServerConfig({
      disabledServers: ["local"],
      disabledTools: ["local.tool"],
      enabledServers: ["remote"],
      enabledRuntimeTools: ["screenshot"],
      allServersDisabledByDefault: true,
    })).toBe(true)
    expect(isValidAgentProfileMcpServerConfig({ enabledServers: [1] })).toBe(false)
    expect(isValidAgentProfileMcpServerConfig({ allServersDisabledByDefault: "true" })).toBe(false)

    expect(isValidAgentProfileModelConfig({
      agentProviderId: "openai",
      sttProviderId: "parakeet",
      ttsProviderId: "supertonic",
      agentOpenaiModel: "gpt-4.1",
    })).toBe(true)
    expect(isValidAgentProfileModelConfig({ agentProviderId: "unknown" })).toBe(false)
    expect(isValidAgentProfileModelConfig({ agentOpenaiModel: 42 })).toBe(false)

    expect(isValidAgentProfileSkillsConfig({
      enabledSkillIds: ["docs"],
      allSkillsDisabledByDefault: true,
    })).toBe(true)
    expect(isValidAgentProfileSkillsConfig({ enabledSkillIds: "docs" })).toBe(false)
    expect(isValidAgentProfileSkillsConfig({ allSkillsDisabledByDefault: 1 })).toBe(false)
  })
})
