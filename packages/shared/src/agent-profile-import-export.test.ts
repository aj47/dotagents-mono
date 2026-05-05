import { describe, expect, it } from "vitest"

import {
  buildAgentProfileExportData,
  getAgentProfileMcpServerNamesForExport,
  mergeImportedAgentProfileMcpServers,
  parseAgentProfileImportJson,
  sanitizeAgentProfileMcpServerForExport,
  serializeAgentProfileExport,
} from "./agent-profile-import-export"

describe("agent profile import/export helpers", () => {
  it("validates imported profile JSON shape", () => {
    expect(parseAgentProfileImportJson(JSON.stringify({
      name: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
    }))).toMatchObject({
      name: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
    })

    expect(() => parseAgentProfileImportJson("{}")).toThrow("Invalid profile data: missing or invalid name")
    expect(() => parseAgentProfileImportJson(JSON.stringify({ name: "Agent", guidelines: 42 })))
      .toThrow("Invalid profile data: guidelines must be a string")
    expect(() => parseAgentProfileImportJson(JSON.stringify({ name: "Agent", systemPrompt: false })))
      .toThrow("Invalid profile data: systemPrompt must be a string")
  })

  it("sanitizes sensitive MCP server fields for export", () => {
    expect(sanitizeAgentProfileMcpServerForExport({
      transport: "stdio",
      command: "node",
      args: ["server.js"],
      env: { API_KEY: "secret" },
      headers: { Authorization: "Bearer token" },
      oauth: { clientId: "client" },
    })).toEqual({
      transport: "stdio",
      command: "node",
      args: ["server.js"],
    })
  })

  it("validates and merges imported MCP server definitions", () => {
    const currentServers = {
      existing: {
        transport: "stdio" as const,
        command: "existing",
      },
    }

    const result = mergeImportedAgentProfileMcpServers(currentServers, {
      " new-server ": {
        transport: "stdio",
        command: "new-server",
      },
      existing: {
        transport: "stdio",
        command: "ignored",
      },
      "dotagents-runtime-tools": {
        transport: "stdio",
        command: "reserved",
      },
      ["__proto__"]: {
        transport: "stdio",
        command: "blocked",
      },
      invalid: {
        transport: "stdio",
      },
    })

    expect(result).toEqual({
      mcpServers: {
        existing: {
          transport: "stdio",
          command: "existing",
        },
        "new-server": {
          transport: "stdio",
          command: "new-server",
        },
      },
      importedServerNames: ["new-server"],
      newServerCount: 1,
    })
    expect(currentServers).toEqual({
      existing: {
        transport: "stdio",
        command: "existing",
      },
    })
  })

  it("selects MCP server names according to profile server config", () => {
    expect(getAgentProfileMcpServerNamesForExport(undefined, ["a", "b"])).toEqual(["a", "b"])
    expect(getAgentProfileMcpServerNamesForExport({
      allServersDisabledByDefault: true,
      enabledServers: ["b"],
    }, ["a", "b"])).toEqual(["b"])
    expect(getAgentProfileMcpServerNamesForExport({
      disabledServers: ["a"],
    }, ["a", "b"])).toEqual(["b"])
  })

  it("builds export data with profile config and sanitized server definitions", () => {
    const exportData = buildAgentProfileExportData({
      displayName: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
      toolConfig: {
        allServersDisabledByDefault: true,
        enabledServers: ["research"],
      },
      modelConfig: {
        agentProviderId: "openai",
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
        allSkillsDisabledByDefault: true,
      },
    }, {
      research: {
        transport: "stdio",
        command: "node",
        env: { API_KEY: "secret" },
      },
      hidden: {
        transport: "stdio",
        command: "hidden",
      },
    })

    expect(exportData).toEqual({
      version: 1,
      name: "Research Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
      mcpServerConfig: {
        disabledServers: undefined,
        disabledTools: undefined,
        allServersDisabledByDefault: true,
        enabledServers: ["research"],
        enabledRuntimeTools: undefined,
      },
      modelConfig: {
        agentProviderId: "openai",
      },
      skillsConfig: {
        enabledSkillIds: ["citations"],
        allSkillsDisabledByDefault: true,
      },
      mcpServers: {
        research: {
          transport: "stdio",
          command: "node",
        },
      },
    })
  })

  it("serializes export data as formatted JSON", () => {
    expect(serializeAgentProfileExport({
      displayName: "Research Agent",
      guidelines: "",
    })).toBe([
      "{",
      "  \"version\": 1,",
      "  \"name\": \"Research Agent\",",
      "  \"guidelines\": \"\"",
      "}",
    ].join("\n"))
  })
})
