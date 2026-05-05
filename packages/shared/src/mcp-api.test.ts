import { describe, expect, it } from "vitest"

import {
  INJECTED_RUNTIME_TOOL_TRANSPORT_NAME,
  INTERNAL_COMPLETION_NUDGE_TEXT,
  MCP_MAX_ITERATIONS_DEFAULT,
  MCP_MAX_ITERATIONS_MAX,
  MCP_MAX_ITERATIONS_MIN,
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  RUNTIME_TOOLS_SERVER_NAME,
  buildInjectedMcpToolCallErrorResponse,
  buildInjectedMcpToolCallResponse,
  buildInjectedMcpToolsListResponse,
  buildMcpServersResponse,
  buildOperatorMcpServerLogsResponse,
  buildOperatorMcpToolsResponse,
  buildOperatorMcpToolToggleResponse,
  buildMcpServerToggleResponse,
  buildOperatorMcpStatusResponse,
  formatMcpMaxIterationsValidationMessage,
  getMcpServersAction,
  normalizeMcpMaxIterationsValue,
  parseInjectedMcpToolCallRequestBody,
  parseMcpMaxIterationsDraft,
  parseMcpServerToggleRequestBody,
  toggleMcpServerAction,
  type McpServerStatusMapLike,
} from "./mcp-api"

describe("MCP API helpers", () => {
  it("exports canonical runtime tool MCP names", () => {
    expect(RUNTIME_TOOLS_SERVER_NAME).toBe("dotagents-runtime-tools")
    expect(RESERVED_RUNTIME_TOOL_SERVER_NAMES).toEqual(["dotagents-runtime-tools"])
    expect(INJECTED_RUNTIME_TOOL_TRANSPORT_NAME).toBe("dotagents-injected-runtime-tools")
    expect(INTERNAL_COMPLETION_NUDGE_TEXT).toContain("respond_to_user")
    expect(INTERNAL_COMPLETION_NUDGE_TEXT).toContain("mark_work_complete")
  })

  it("normalizes MCP max iteration values with one shared desktop/mobile/server contract", () => {
    expect(MCP_MAX_ITERATIONS_MIN).toBe(1)
    expect(MCP_MAX_ITERATIONS_MAX).toBe(100)
    expect(MCP_MAX_ITERATIONS_DEFAULT).toBe(10)

    expect(parseMcpMaxIterationsDraft("100")).toBe(100)
    expect(parseMcpMaxIterationsDraft("0")).toBeNull()
    expect(parseMcpMaxIterationsDraft("101")).toBeNull()
    expect(parseMcpMaxIterationsDraft("abc")).toBeNull()

    expect(normalizeMcpMaxIterationsValue(2.9)).toBe(2)
    expect(normalizeMcpMaxIterationsValue(100)).toBe(100)
    expect(normalizeMcpMaxIterationsValue(101)).toBeUndefined()
    expect(normalizeMcpMaxIterationsValue("10")).toBeUndefined()
    expect(formatMcpMaxIterationsValidationMessage()).toBe("Max Iterations must be between 1 and 100 before saving.")
  })

  it("parses MCP server toggle requests", () => {
    expect(parseMcpServerToggleRequestBody({ enabled: true })).toEqual({
      ok: true,
      request: { enabled: true },
    })

    expect(parseMcpServerToggleRequestBody({ enabled: "true" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid 'enabled' boolean",
    })
  })

  it("builds MCP server toggle responses", () => {
    expect(buildMcpServerToggleResponse("filesystem", false)).toEqual({
      success: true,
      server: "filesystem",
      enabled: false,
    })
  })

  it("builds MCP server status responses", () => {
    const status = {
      filesystem: {
        connected: true,
        toolCount: 3,
        runtimeEnabled: true,
        configDisabled: false,
      },
      disabled: {
        connected: false,
        toolCount: 1,
        runtimeEnabled: false,
        configDisabled: false,
        error: "disabled",
      },
    }

    expect(buildMcpServersResponse(status)).toEqual({
      servers: [
        {
          name: "filesystem",
          connected: true,
          toolCount: 3,
          enabled: true,
          runtimeEnabled: true,
          configDisabled: false,
          error: undefined,
        },
        {
          name: "disabled",
          connected: false,
          toolCount: 1,
          enabled: false,
          runtimeEnabled: false,
          configDisabled: false,
          error: "disabled",
        },
      ],
    })
  })

  it("runs mobile MCP server actions through shared service adapters", () => {
    const status: McpServerStatusMapLike = {
      filesystem: {
        connected: true,
        toolCount: 3,
        runtimeEnabled: true,
        configDisabled: false,
      },
    }
    const toggles: Array<{ serverName: string; enabled: boolean }> = []
    const logs: string[] = []
    const options = {
      service: {
        getServerStatus: () => status,
        setServerRuntimeEnabled: (serverName: string, enabled: boolean) => {
          toggles.push({ serverName, enabled })
          return serverName === "filesystem"
        },
      },
      diagnostics: {
        logError: (_source: string, message: string) => logs.push(message),
        logInfo: (_source: string, message: string) => logs.push(message),
      },
    }

    expect(getMcpServersAction(options)).toEqual({
      statusCode: 200,
      body: buildMcpServersResponse(status),
    })
    expect(toggleMcpServerAction("filesystem", { enabled: false }, options)).toEqual({
      statusCode: 200,
      body: buildMcpServerToggleResponse("filesystem", false),
    })
    expect(toggleMcpServerAction("missing", { enabled: true }, options)).toEqual({
      statusCode: 404,
      body: { error: "Server 'missing' not found" },
    })
    expect(toggleMcpServerAction("filesystem", { enabled: "yes" }, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing or invalid 'enabled' boolean" },
    })
    expect(toggles).toEqual([
      { serverName: "filesystem", enabled: false },
      { serverName: "missing", enabled: true },
    ])
    expect(logs).toContain("Toggled MCP server filesystem to disabled")
  })

  it("builds compact operator MCP status responses", () => {
    expect(buildOperatorMcpStatusResponse({
      "dotagents-internal": {
        connected: true,
        toolCount: 99,
        runtimeEnabled: true,
        configDisabled: false,
      },
      filesystem: {
        connected: true,
        toolCount: 3,
        runtimeEnabled: undefined,
        configDisabled: false,
      },
      disabled: {
        connected: false,
        toolCount: 1,
        runtimeEnabled: true,
        configDisabled: true,
        error: "config disabled",
      },
    })).toEqual({
      totalServers: 2,
      connectedServers: 1,
      totalTools: 4,
      servers: [
        {
          name: "filesystem",
          connected: true,
          toolCount: 3,
          enabled: true,
          runtimeEnabled: true,
          configDisabled: false,
          error: undefined,
        },
        {
          name: "disabled",
          connected: false,
          toolCount: 1,
          enabled: false,
          runtimeEnabled: true,
          configDisabled: true,
          error: "config disabled",
        },
      ],
    })
  })

  it("builds compact operator MCP server log responses", () => {
    expect(buildOperatorMcpServerLogsResponse("filesystem", [
      { timestamp: 1, message: "first" },
      { timestamp: 2, message: "second" },
      { timestamp: 3, message: "third" },
    ], 2)).toEqual({
      server: "filesystem",
      count: 2,
      logs: [
        { timestamp: 2, message: "second" },
        { timestamp: 3, message: "third" },
      ],
    })
  })

  it("builds compact operator MCP tool responses", () => {
    const tools = [
      {
        name: "filesystem:read",
        description: "Read files",
        sourceKind: "mcp" as const,
        sourceName: "filesystem",
        sourceLabel: "Filesystem",
        enabled: true,
        serverEnabled: true,
        inputSchema: { type: "object" },
      },
      {
        name: "github:search",
        description: "Search GitHub",
        sourceKind: "mcp" as const,
        sourceName: "github",
        enabled: false,
        serverEnabled: true,
      },
    ]

    expect(buildOperatorMcpToolsResponse(tools, "filesystem")).toEqual({
      count: 1,
      server: "filesystem",
      tools: [{
        name: "filesystem:read",
        description: "Read files",
        sourceKind: "mcp",
        sourceName: "filesystem",
        sourceLabel: "Filesystem",
        enabled: true,
        serverEnabled: true,
      }],
    })
    expect(buildOperatorMcpToolToggleResponse("filesystem:read", false, true)).toEqual({
      success: true,
      action: "mcp-tool-toggle",
      tool: "filesystem:read",
      enabled: false,
      message: "Tool filesystem:read disabled",
    })
  })

  it("parses injected MCP tool call requests", () => {
    expect(parseInjectedMcpToolCallRequestBody({
      name: "runtime.read_file",
      arguments: { path: "README.md" },
    })).toEqual({
      ok: true,
      request: {
        name: "runtime.read_file",
        arguments: { path: "README.md" },
      },
    })

    expect(parseInjectedMcpToolCallRequestBody({ arguments: {} })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid 'name' parameter",
    })
  })

  it("builds injected MCP tool call responses", () => {
    expect(buildInjectedMcpToolCallResponse({
      content: [{ type: "text", text: "ok" }],
      isError: false,
    })).toEqual({
      content: [{ type: "text", text: "ok" }],
      isError: false,
    })

    expect(buildInjectedMcpToolCallErrorResponse("failed")).toEqual({
      content: [{ type: "text", text: "failed" }],
      isError: true,
    })

    expect(buildInjectedMcpToolsListResponse([
      { name: "runtime.read_file" },
    ])).toEqual({
      tools: [{ name: "runtime.read_file" }],
    })
  })
})
