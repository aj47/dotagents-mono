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
  clearOperatorMcpServerLogsAction,
  formatMcpMaxIterationsValidationMessage,
  getMcpServersAction,
  getOperatorMcpServerLogsAction,
  getOperatorMcpStatusAction,
  getOperatorMcpToolsAction,
  normalizeMcpMaxIterationsValue,
  parseInjectedMcpToolCallRequestBody,
  parseMcpMaxIterationsDraft,
  parseMcpServerToggleRequestBody,
  setOperatorMcpToolEnabledAction,
  testOperatorMcpServerAction,
  toggleMcpServerAction,
  type OperatorMcpMutationActionOptions,
  type OperatorMcpTestActionOptions,
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

  it("runs operator MCP read routes through shared service adapters", () => {
    const logs: string[] = []
    const options = {
      service: {
        getServerStatus: () => ({
          filesystem: {
            connected: true,
            toolCount: 2,
            runtimeEnabled: true,
            configDisabled: false,
          },
        }),
        getServerLogs: (serverName: string) => {
          if (serverName === "throw") throw new Error("logs denied")
          return [
            { timestamp: 1, message: "first" },
            { timestamp: 2, message: "second" },
          ]
        },
        getDetailedToolList: () => [
          {
            name: "filesystem:read",
            description: "Read files",
            sourceKind: "mcp" as const,
            sourceName: "filesystem",
            enabled: true,
            serverEnabled: true,
          },
          {
            name: "runtime:respond",
            sourceKind: "runtime" as const,
            sourceName: "runtime",
            enabled: true,
            serverEnabled: true,
          },
        ],
      },
      diagnostics: {
        logError: (_source: string, message: string) => { logs.push(message) },
        getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
      },
    }

    expect(getOperatorMcpStatusAction(options)).toEqual({
      statusCode: 200,
      body: {
        totalServers: 1,
        connectedServers: 1,
        totalTools: 2,
        servers: [{
          name: "filesystem",
          connected: true,
          toolCount: 2,
          enabled: true,
          runtimeEnabled: true,
          configDisabled: false,
          error: undefined,
        }],
      },
    })
    expect(getOperatorMcpServerLogsAction("filesystem", "1", options)).toEqual({
      statusCode: 200,
      body: {
        server: "filesystem",
        count: 1,
        logs: [{ timestamp: 2, message: "second" }],
      },
    })
    expect(getOperatorMcpServerLogsAction(undefined, undefined, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing server name" },
    })
    expect(getOperatorMcpServerLogsAction("missing", undefined, options)).toEqual({
      statusCode: 404,
      body: { error: "Server missing not found in configuration" },
    })
    expect(getOperatorMcpToolsAction("filesystem", options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        server: "filesystem",
        tools: [{
          name: "filesystem:read",
          description: "Read files",
          sourceKind: "mcp",
          sourceName: "filesystem",
          sourceLabel: "filesystem",
          enabled: true,
          serverEnabled: true,
        }],
      },
    })

    const failingOptions = {
      ...options,
      service: {
        ...options.service,
        getServerStatus: () => ({
          throw: {
            connected: true,
            toolCount: 0,
          },
        }),
      },
    }
    expect(getOperatorMcpServerLogsAction("throw", undefined, failingOptions)).toEqual({
      statusCode: 500,
      body: { error: "Failed to get MCP server logs: logs denied" },
    })
    expect(logs).toContain("Failed to get MCP server logs for throw: logs denied")
  })

  it("runs operator MCP mutation routes through shared service adapters", () => {
    const status: McpServerStatusMapLike = {
      filesystem: {
        connected: true,
        toolCount: 2,
        runtimeEnabled: true,
        configDisabled: false,
      },
      throw: {
        connected: true,
        toolCount: 0,
      },
    }
    const clearedServers: string[] = []
    const toggles: Array<{ toolName: string; enabled: boolean }> = []
    const logs: string[] = []
    type MutationAuditContext = {
      action: string
      serverName?: string
      failureReason?: string
      success?: boolean
    }
    const options: OperatorMcpMutationActionOptions<MutationAuditContext> = {
      service: {
        getServerStatus: () => status,
        clearServerLogs: (serverName: string) => {
          if (serverName === "throw") throw new Error("clear denied")
          clearedServers.push(serverName)
        },
        setToolEnabled: (toolName: string, enabled: boolean) => {
          if (toolName === "throw") throw new Error("toggle denied")
          toggles.push({ toolName, enabled })
          return toolName === "filesystem:read"
        },
      },
      diagnostics: {
        logError: (_source: string, message: string) => { logs.push(message) },
        getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
      },
      audit: {
        buildClearLogsAuditContext: (serverName: string) => ({ action: "clear", serverName }),
        buildClearLogsFailureAuditContext: (failureReason: string) => ({ action: "clear-failed", failureReason }),
        buildToolToggleAuditContext: (response: { action: string; success: boolean }) => ({
          action: response.action,
          success: response.success,
        }),
      },
    }

    expect(clearOperatorMcpServerLogsAction(undefined, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing server name" },
      auditContext: { action: "clear-failed", failureReason: "missing-server-name" },
    })
    expect(clearOperatorMcpServerLogsAction("missing", options)).toEqual({
      statusCode: 404,
      body: { error: "Server missing not found in configuration" },
      auditContext: { action: "clear-failed", failureReason: "server-not-found" },
    })
    expect(clearOperatorMcpServerLogsAction("filesystem", options)).toEqual({
      statusCode: 200,
      body: {
        success: true,
        action: "mcp-clear-logs",
        message: "Cleared logs for filesystem",
        details: { server: "filesystem" },
      },
      auditContext: { action: "clear", serverName: "filesystem" },
    })
    expect(clearOperatorMcpServerLogsAction("throw", options)).toEqual({
      statusCode: 500,
      body: { error: "Failed to clear MCP server logs: clear denied" },
      auditContext: { action: "clear-failed", failureReason: "mcp-clear-logs-error" },
    })

    expect(setOperatorMcpToolEnabledAction(undefined, { enabled: true }, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing tool name" },
    })
    expect(setOperatorMcpToolEnabledAction("filesystem:read", { enabled: "yes" }, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing or invalid 'enabled' boolean" },
    })
    expect(setOperatorMcpToolEnabledAction("filesystem:read", { enabled: false }, options)).toEqual({
      statusCode: 200,
      body: buildOperatorMcpToolToggleResponse("filesystem:read", false, true),
      auditContext: { action: "mcp-tool-toggle", success: true },
    })
    expect(setOperatorMcpToolEnabledAction("filesystem:missing", { enabled: true }, options)).toEqual({
      statusCode: 200,
      body: buildOperatorMcpToolToggleResponse("filesystem:missing", true, false),
      auditContext: { action: "mcp-tool-toggle", success: false },
    })
    expect(setOperatorMcpToolEnabledAction("throw", { enabled: true }, options)).toEqual({
      statusCode: 500,
      body: { error: "Failed to toggle MCP tool: toggle denied" },
    })
    expect(clearedServers).toEqual(["filesystem"])
    expect(toggles).toEqual([
      { toolName: "filesystem:read", enabled: false },
      { toolName: "filesystem:missing", enabled: true },
    ])
    expect(logs).toContain("Failed to clear MCP server logs for throw: clear denied")
    expect(logs).toContain("Failed to toggle MCP tool throw: toggle denied")
  })

  it("runs operator MCP server tests through shared service adapters", async () => {
    const configs = {
      filesystem: { command: "npx", args: ["filesystem"] },
      failing: { command: "npx", args: ["failing"] },
      throw: { command: "npx", args: ["throw"] },
    }
    const testedServers: string[] = []
    const logs: string[] = []
    type TestAuditContext = {
      action: string
      success: boolean
      server?: string
      failureReason?: string
    }
    const options: OperatorMcpTestActionOptions<typeof configs.filesystem, TestAuditContext> = {
      service: {
        getServerConfig: (serverName: string) => configs[serverName as keyof typeof configs],
        testServerConnection: async (serverName: string) => {
          if (serverName === "throw") throw new Error("test denied")
          testedServers.push(serverName)
          return serverName === "failing"
            ? { success: false, error: "connection refused" }
            : { success: true, toolCount: 3 }
        },
      },
      diagnostics: {
        logError: (_source: string, message: string) => { logs.push(message) },
        getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
      },
      audit: {
        buildTestAuditContext: (response) => ({
          action: response.action,
          success: response.success,
          server: response.server,
        }),
        buildTestFailureAuditContext: (failureReason: string) => ({
          action: "mcp-test",
          success: false,
          failureReason,
        }),
      },
    }

    await expect(testOperatorMcpServerAction(undefined, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Missing server name" },
      auditContext: { action: "mcp-test", success: false, failureReason: "missing-server-name" },
    })
    await expect(testOperatorMcpServerAction("missing", options)).resolves.toEqual({
      statusCode: 404,
      body: { error: "Server missing not found in configuration" },
      auditContext: { action: "mcp-test", success: false, failureReason: "server-not-found" },
    })
    await expect(testOperatorMcpServerAction("filesystem", options)).resolves.toEqual({
      statusCode: 200,
      body: {
        success: true,
        action: "mcp-test",
        server: "filesystem",
        message: "Connection test successful for filesystem",
        toolCount: 3,
      },
      auditContext: { action: "mcp-test", success: true, server: "filesystem" },
    })
    await expect(testOperatorMcpServerAction("failing", options)).resolves.toEqual({
      statusCode: 200,
      body: {
        success: false,
        action: "mcp-test",
        server: "failing",
        message: "connection refused",
        error: "connection refused",
      },
      auditContext: { action: "mcp-test", success: false, server: "failing" },
    })
    await expect(testOperatorMcpServerAction("throw", options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to test MCP server: test denied" },
      auditContext: { action: "mcp-test", success: false, failureReason: "mcp-test-error" },
    })
    expect(testedServers).toEqual(["filesystem", "failing"])
    expect(logs).toContain("Failed to test MCP server throw: test denied")
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
