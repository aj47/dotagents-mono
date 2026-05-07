import { describe, expect, it } from "vitest"

import {
  DEFAULT_MCP_AUTO_PASTE_DELAY,
  DEFAULT_MCP_AUTO_PASTE_ENABLED,
  DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED,
  DEFAULT_MCP_FINAL_SUMMARY_ENABLED,
  DEFAULT_MCP_MESSAGE_QUEUE_ENABLED,
  DEFAULT_MCP_PARALLEL_TOOL_EXECUTION,
  DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL,
  DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED,
  DEFAULT_MCP_UNLIMITED_ITERATIONS,
  DEFAULT_MCP_VERIFY_COMPLETION_ENABLED,
  DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR,
  INJECTED_RUNTIME_TOOL_TRANSPORT_NAME,
  INTERNAL_COMPLETION_NUDGE_TEXT,
  MCP_MAX_ITERATIONS_DEFAULT,
  MCP_MAX_ITERATIONS_MAX,
  MCP_MAX_ITERATIONS_MIN,
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  RUNTIME_TOOLS_SERVER_NAME,
  buildSamplingChatMessages,
  buildMcpServerConfigExportResponse,
  buildMcpServerConfigImportResponse,
  buildMcpServerConfigMutationResponse,
  buildInjectedMcpToolCallErrorResponse,
  buildInjectedMcpToolCallResponse,
  buildInjectedMcpToolsListResponse,
  buildMcpServersResponse,
  buildOperatorMcpServerLogsResponse,
  buildOperatorMcpToolsResponse,
  buildOperatorMcpToolToggleResponse,
  buildMcpServerToggleResponse,
  buildOperatorMcpStatusResponse,
  callInjectedMcpToolAction,
  createInjectedMcpProtocolRouteAction,
  clearOperatorMcpServerLogsAction,
  createInjectedMcpToolRouteActions,
  createMcpRouteActions,
  createOperatorMcpRouteActions,
  formatMcpMaxIterationsValidationMessage,
  getMcpServersAction,
  getOperatorMcpServerLogsAction,
  getOperatorMcpStatusAction,
  getOperatorMcpToolsAction,
  listInjectedMcpToolsAction,
  normalizeMcpMaxIterationsValue,
  parseInjectedMcpToolCallRequestBody,
  parseMcpMaxIterationsDraft,
  parseMcpServerConfigImportRequestBody,
  parseMcpServerToggleRequestBody,
  parseMcpServerConfigUpsertRequestBody,
  exportMcpServerConfigsAction,
  importMcpServerConfigsAction,
  setOperatorMcpToolEnabledAction,
  startOperatorMcpServerAction,
  stopOperatorMcpServerAction,
  testOperatorMcpServerAction,
  restartOperatorMcpServerAction,
  resolveInjectedMcpRequestContext,
  resolveInjectedRuntimeToolsForAcpSession,
  stripSamplingToolMarkerTokens,
  toggleMcpServerAction,
  upsertMcpServerConfigAction,
  deleteMcpServerConfigAction,
  type ElicitationRequest,
  type SamplingRequest,
  type SamplingResult,
  type OperatorMcpLifecycleActionOptions,
  type OperatorMcpMutationActionOptions,
  type OperatorMcpReadActionOptions,
  type OperatorMcpTestActionOptions,
  type McpServerStatusMapLike,
} from "./mcp-api"
import type { MCPConfig, MCPServerConfig } from "./mcp-utils"

describe("MCP API helpers", () => {
  it("exports canonical runtime tool MCP names", () => {
    expect(RUNTIME_TOOLS_SERVER_NAME).toBe("dotagents-runtime-tools")
    expect(RESERVED_RUNTIME_TOOL_SERVER_NAMES).toEqual(["dotagents-runtime-tools"])
    expect(INJECTED_RUNTIME_TOOL_TRANSPORT_NAME).toBe("dotagents-injected-runtime-tools")
    expect(INTERNAL_COMPLETION_NUDGE_TEXT).toContain("respond_to_user")
    expect(INTERNAL_COMPLETION_NUDGE_TEXT).toContain("mark_work_complete")
  })

  it("exposes shared MCP elicitation and sampling protocol contracts", () => {
    const elicitation: ElicitationRequest = {
      mode: "form",
      serverName: "calendar",
      message: "Pick a date",
      requestId: "elicitation-1",
      requestedSchema: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
        },
        required: ["date"],
      },
    }
    const sampling: SamplingRequest = {
      serverName: "assistant",
      requestId: "sampling-1",
      messages: [
        {
          role: "user",
          content: { type: "text", text: "Summarize this." },
        },
      ],
      maxTokens: 128,
      modelPreferences: {
        hints: [{ name: "gpt-5.4-mini" }],
        intelligencePriority: 0.7,
      },
    }
    const samplingResult: SamplingResult = {
      approved: true,
      model: "gpt-5.4-mini",
      content: { type: "text", text: "Summary" },
      stopReason: "endTurn",
    }

    expect(elicitation.requestedSchema.properties.date.format).toBe("date")
    expect(sampling.messages[0].content).toEqual({ type: "text", text: "Summarize this." })
    expect(samplingResult.content?.text).toBe("Summary")
  })

  it("formats MCP sampling requests into shared chat messages", () => {
    const messages = buildSamplingChatMessages({
      systemPrompt: "Stay concise.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Summarize this." },
            { type: "image", mimeType: "image/png", data: "base64" },
          ],
        },
        {
          role: "assistant",
          content: { type: "audio", mimeType: "audio/wav", data: "base64" },
        },
      ],
    })

    expect(messages).toEqual([
      { role: "user", content: "[System]: Stay concise." },
      { role: "user", content: "Summarize this.\n[image]" },
      { role: "assistant", content: "[audio]" },
    ])
  })

  it("strips sampling response tool markers only when marker tokens are present", () => {
    expect(stripSamplingToolMarkerTokens("  ordinary response  ")).toBe("  ordinary response  ")
    expect(stripSamplingToolMarkerTokens("Here <|tool_call_begin|>search<|tool_call_end|> done")).toBe("Here search done")
    expect(stripSamplingToolMarkerTokens("<|tool_calls_section_begin|>hidden<|tool_calls_section_end|>")).toBe("hidden")
  })

  it("normalizes MCP max iteration values with one shared desktop/mobile/server contract", () => {
    expect(MCP_MAX_ITERATIONS_MIN).toBe(1)
    expect(MCP_MAX_ITERATIONS_MAX).toBe(100)
    expect(MCP_MAX_ITERATIONS_DEFAULT).toBe(10)
    expect(DEFAULT_MCP_MESSAGE_QUEUE_ENABLED).toBe(true)
    expect(DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL).toBe(false)
    expect(DEFAULT_MCP_VERIFY_COMPLETION_ENABLED).toBe(true)
    expect(DEFAULT_MCP_FINAL_SUMMARY_ENABLED).toBe(false)
    expect(DEFAULT_MCP_UNLIMITED_ITERATIONS).toBe(true)
    expect(DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED).toBe(true)
    expect(DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED).toBe(true)
    expect(DEFAULT_MCP_PARALLEL_TOOL_EXECUTION).toBe(true)
    expect(DEFAULT_MCP_AUTO_PASTE_ENABLED).toBe(false)
    expect(DEFAULT_MCP_AUTO_PASTE_DELAY).toBe(1000)

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

  it("parses MCP server config upsert requests", () => {
    expect(parseMcpServerConfigUpsertRequestBody({
      config: {
        command: "npx",
        args: ["-y", "server"],
        env: { API_KEY: "secret" },
      },
    })).toEqual({
      ok: true,
      request: {
        config: {
          transport: "stdio",
          command: "npx",
          args: ["-y", "server"],
          env: { API_KEY: "secret" },
        },
      },
    })

    expect(parseMcpServerConfigUpsertRequestBody({
      config: {
        url: " https://example.com/mcp ",
        headers: { Authorization: "Bearer token" },
        timeout: 15.8,
        disabled: true,
      },
    })).toEqual({
      ok: true,
      request: {
        config: {
          transport: "streamableHttp",
          url: "https://example.com/mcp",
          headers: { Authorization: "Bearer token" },
          timeout: 15,
          disabled: true,
        },
      },
    })

    expect(parseMcpServerConfigUpsertRequestBody({ config: { transport: "stdio" } })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid MCP server config",
    })
    expect(parseMcpServerConfigUpsertRequestBody({
      config: { url: "https://example.com/mcp", headers: { Bad: 1 } },
    })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid MCP server config",
    })

    expect(parseMcpServerConfigImportRequestBody({
      config: {
        mcpServers: {
          github: { command: "github-mcp" },
          docs: { url: "wss://example.com/mcp" },
        },
      },
    })).toEqual({
      ok: true,
      request: {
        config: {
          mcpServers: {
            github: { transport: "stdio", command: "github-mcp" },
            docs: { transport: "websocket", url: "wss://example.com/mcp" },
          },
        },
      },
    })
    expect(parseMcpServerConfigImportRequestBody({ config: { mcpServers: { bad: { transport: "stdio" } } } })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid MCP server config for 'bad'",
    })
  })

  it("builds MCP server toggle responses", () => {
    expect(buildMcpServerToggleResponse("filesystem", false)).toEqual({
      success: true,
      server: "filesystem",
      enabled: false,
    })
    expect(buildMcpServerConfigMutationResponse("filesystem", "upserted")).toEqual({
      success: true,
      server: "filesystem",
      action: "upserted",
    })
    expect(buildMcpServerConfigImportResponse(2, ["reserved"])).toEqual({
      success: true,
      importedCount: 2,
      skippedReservedServerNames: ["reserved"],
    })
    expect(buildMcpServerConfigExportResponse({
      mcpServers: {
        filesystem: { command: "filesystem-mcp" },
      },
    })).toEqual({
      success: true,
      config: {
        mcpServers: {
          filesystem: { command: "filesystem-mcp" },
        },
      },
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
    const savedEvents: Array<{
      action: string
      serverName: string
      previousServers: string[]
      nextServers: string[]
    }> = []
    const deletedContexts: Array<{
      serverName: string
      previousServers: string[]
      nextServers: string[]
      availableServerNames: string[]
    }> = []
    let mcpConfig: MCPConfig = {
      mcpServers: {
        filesystem: { command: "filesystem-mcp" },
      },
    }
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
    const configOptions = {
      service: {
        getMcpConfig: () => mcpConfig,
        saveMcpConfig: (nextConfig: typeof mcpConfig) => {
          mcpConfig = nextConfig
        },
        onMcpConfigSaved: (context: {
          action: "upserted" | "deleted" | "imported"
          serverName: string
          previousMcpConfig: MCPConfig
          nextMcpConfig: MCPConfig
        }) => {
          const { action, serverName, previousMcpConfig, nextMcpConfig } = context
          savedEvents.push({
            action,
            serverName,
            previousServers: Object.keys(previousMcpConfig.mcpServers).sort(),
            nextServers: Object.keys(nextMcpConfig.mcpServers).sort(),
          })
        },
      },
      diagnostics: options.diagnostics,
      reservedServerNames: RESERVED_RUNTIME_TOOL_SERVER_NAMES,
      onMcpServerDeleted: ({ serverName, previousMcpConfig, nextMcpConfig, availableServerNames }) => {
        deletedContexts.push({
          serverName,
          previousServers: Object.keys(previousMcpConfig.mcpServers).sort(),
          nextServers: Object.keys(nextMcpConfig.mcpServers).sort(),
          availableServerNames,
        })
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
    expect(upsertMcpServerConfigAction("github", { config: { command: "github-mcp" } }, configOptions)).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigMutationResponse("github", "upserted"),
    })
    expect(mcpConfig.mcpServers.github).toEqual({ transport: "stdio", command: "github-mcp" })
    expect(upsertMcpServerConfigAction("dotagents-runtime-tools", { config: { command: "reserved" } }, configOptions)).toEqual({
      statusCode: 400,
      body: { error: "Server name 'dotagents-runtime-tools' is reserved" },
    })
    expect(deleteMcpServerConfigAction("github", configOptions)).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigMutationResponse("github", "deleted"),
    })
    expect(deleteMcpServerConfigAction("missing", configOptions)).toEqual({
      statusCode: 404,
      body: { error: "Server 'missing' not found" },
    })
    expect(deletedContexts).toEqual([{
      serverName: "github",
      previousServers: ["filesystem", "github"],
      nextServers: ["filesystem"],
      availableServerNames: ["filesystem"],
    }])
    expect(importMcpServerConfigsAction({
      config: {
        mcpServers: {
          github: { command: "github-mcp" },
          "dotagents-runtime-tools": { command: "reserved" },
        },
      },
    }, configOptions)).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigImportResponse(1, ["dotagents-runtime-tools"]),
    })
    expect(mcpConfig.mcpServers.github).toEqual({ transport: "stdio", command: "github-mcp" })
    expect(exportMcpServerConfigsAction(configOptions)).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigExportResponse(mcpConfig),
    })
    expect(toggles).toEqual([
      { serverName: "filesystem", enabled: false },
      { serverName: "missing", enabled: true },
    ])
    expect(logs).toContain("Toggled MCP server filesystem to disabled")
    expect(logs).toContain("Upserted MCP server config github")
    expect(logs).toContain("Deleted MCP server config github")
    expect(savedEvents).toEqual([
      {
        action: "upserted",
        serverName: "github",
        previousServers: ["filesystem"],
        nextServers: ["filesystem", "github"],
      },
      {
        action: "deleted",
        serverName: "github",
        previousServers: ["filesystem", "github"],
        nextServers: ["filesystem"],
      },
      {
        action: "imported",
        serverName: "",
        previousServers: ["filesystem"],
        nextServers: ["filesystem", "github"],
      },
    ])
  })

  it("creates mobile MCP route actions that delegate through service adapters", () => {
    let mcpConfig: MCPConfig = {
      mcpServers: {
        filesystem: { command: "filesystem-mcp" },
      },
    }
    const toggles: Array<{ serverName: string; enabled: boolean }> = []
    const logs: string[] = []
    const routeActions = createMcpRouteActions({
      server: {
        service: {
          getServerStatus: () => ({
            filesystem: {
              connected: true,
              toolCount: 3,
              runtimeEnabled: true,
              configDisabled: false,
            },
          }),
          setServerRuntimeEnabled: (serverName, enabled) => {
            toggles.push({ serverName, enabled })
            return true
          },
        },
        diagnostics: {
          logError: (_source, message) => logs.push(message),
          logInfo: (_source, message) => logs.push(message),
        },
      },
      config: {
        service: {
          getMcpConfig: () => mcpConfig,
          saveMcpConfig: (nextConfig) => {
            mcpConfig = nextConfig
          },
        },
        diagnostics: {
          logError: (_source, message) => logs.push(message),
          logInfo: (_source, message) => logs.push(message),
        },
        reservedServerNames: RESERVED_RUNTIME_TOOL_SERVER_NAMES,
      },
    })

    expect(routeActions.getMcpServers()).toEqual({
      statusCode: 200,
      body: buildMcpServersResponse({
        filesystem: {
          connected: true,
          toolCount: 3,
          runtimeEnabled: true,
          configDisabled: false,
        },
      }),
    })
    expect(routeActions.toggleMcpServer("filesystem", { enabled: false })).toEqual({
      statusCode: 200,
      body: buildMcpServerToggleResponse("filesystem", false),
    })
    expect(routeActions.upsertMcpServerConfig("github", { config: { command: "github-mcp" } })).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigMutationResponse("github", "upserted"),
    })
    expect(routeActions.exportMcpServerConfigs()).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigExportResponse(mcpConfig),
    })
    expect(routeActions.deleteMcpServerConfig("github")).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigMutationResponse("github", "deleted"),
    })
    expect(routeActions.importMcpServerConfigs({
      config: {
        mcpServers: {
          github: { command: "github-mcp" },
        },
      },
    })).toEqual({
      statusCode: 200,
      body: buildMcpServerConfigImportResponse(1, []),
    })
    expect(toggles).toEqual([{ serverName: "filesystem", enabled: false }])
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

  it("runs operator MCP lifecycle routes through shared service adapters", async () => {
    const status: McpServerStatusMapLike = {
      filesystem: {
        connected: true,
        toolCount: 2,
        runtimeEnabled: true,
        configDisabled: false,
      },
      disabled: {
        connected: false,
        toolCount: 0,
        configDisabled: true,
      },
      "runtime-missing": {
        connected: false,
        toolCount: 0,
      },
      "start-fails": {
        connected: false,
        toolCount: 0,
      },
      "stop-fails": {
        connected: true,
        toolCount: 0,
      },
      "throw-restart": {
        connected: false,
        toolCount: 0,
      },
      "throw-stop": {
        connected: true,
        toolCount: 0,
      },
    }
    const runtimeToggles: Array<{ serverName: string; enabled: boolean }> = []
    const lifecycleCalls: string[] = []
    const logs: string[] = []
    type LifecycleAuditContext = {
      action: string
      success: boolean
      serverName?: string
      failureReason?: string
    }
    const options: OperatorMcpLifecycleActionOptions<LifecycleAuditContext> = {
      service: {
        getServerStatus: () => status,
        setServerRuntimeEnabled: (serverName: string, enabled: boolean) => {
          runtimeToggles.push({ serverName, enabled })
          return serverName !== "runtime-missing"
        },
        restartServer: async (serverName: string) => {
          lifecycleCalls.push(`restart:${serverName}`)
          if (serverName === "throw-restart") throw new Error("restart denied")
          if (serverName === "start-fails") return { success: false, error: "start refused" }
          if (serverName === "restart-fails") return { success: false }
          return { success: true }
        },
        stopServer: async (serverName: string) => {
          lifecycleCalls.push(`stop:${serverName}`)
          if (serverName === "throw-stop") throw new Error("stop denied")
          if (serverName === "stop-fails") return { success: false, error: "stop refused" }
          return { success: true }
        },
      },
      diagnostics: {
        logError: (_source: string, message: string) => { logs.push(message) },
        logInfo: (_source: string, message: string) => { logs.push(message) },
        getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
      },
      audit: {
        buildStartAuditContext: (serverName: string) => ({ action: "mcp-start", success: true, serverName }),
        buildStartFailureAuditContext: (failureReason: string) => ({ action: "mcp-start", success: false, failureReason }),
        buildStopAuditContext: (serverName: string) => ({ action: "mcp-stop", success: true, serverName }),
        buildStopFailureAuditContext: (failureReason: string) => ({ action: "mcp-stop", success: false, failureReason }),
        buildRestartAuditContext: (serverName: string) => ({ action: "mcp-restart", success: true, serverName }),
        buildRestartFailureAuditContext: (failureReason: string) => ({ action: "mcp-restart", success: false, failureReason }),
      },
    }

    await expect(startOperatorMcpServerAction({}, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Missing server name" },
    })
    await expect(startOperatorMcpServerAction({ server: "missing" }, options)).resolves.toEqual({
      statusCode: 404,
      body: { error: "Server missing not found in configuration" },
      auditContext: { action: "mcp-start", success: false, failureReason: "server-not-found" },
    })
    await expect(startOperatorMcpServerAction({ server: "disabled" }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Server disabled is disabled in configuration" },
      auditContext: { action: "mcp-start", success: false, failureReason: "server-config-disabled" },
    })
    await expect(startOperatorMcpServerAction({ server: "runtime-missing" }, options)).resolves.toEqual({
      statusCode: 404,
      body: { error: "Server runtime-missing not found in configuration" },
      auditContext: { action: "mcp-start", success: false, failureReason: "server-not-found" },
    })
    await expect(startOperatorMcpServerAction({ server: "start-fails" }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "start refused" },
      auditContext: { action: "mcp-start", success: false, failureReason: "start refused" },
    })
    await expect(startOperatorMcpServerAction({ server: "filesystem" }, options)).resolves.toEqual({
      statusCode: 200,
      body: {
        success: true,
        action: "mcp-start",
        server: "filesystem",
        message: "Started filesystem",
      },
      auditContext: { action: "mcp-start", success: true, serverName: "filesystem" },
    })
    await expect(startOperatorMcpServerAction({ server: "throw-restart" }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "MCP start failed: restart denied" },
      auditContext: { action: "mcp-start", success: false, failureReason: "mcp-start-error" },
    })

    await expect(stopOperatorMcpServerAction({}, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Missing server name" },
    })
    await expect(stopOperatorMcpServerAction({ server: "stop-fails" }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "stop refused" },
      auditContext: { action: "mcp-stop", success: false, failureReason: "stop refused" },
    })
    await expect(stopOperatorMcpServerAction({ server: "filesystem" }, options)).resolves.toEqual({
      statusCode: 200,
      body: {
        success: true,
        action: "mcp-stop",
        server: "filesystem",
        message: "Stopped filesystem",
      },
      auditContext: { action: "mcp-stop", success: true, serverName: "filesystem" },
    })
    await expect(stopOperatorMcpServerAction({ server: "throw-stop" }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "MCP stop failed: stop denied" },
      auditContext: { action: "mcp-stop", success: false, failureReason: "mcp-stop-error" },
    })

    await expect(restartOperatorMcpServerAction({}, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Missing server name" },
    })
    await expect(restartOperatorMcpServerAction({ server: "restart-fails" }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Restart failed" },
      auditContext: { action: "mcp-restart", success: false, failureReason: "Restart failed" },
    })
    await expect(restartOperatorMcpServerAction({ server: "filesystem" }, options)).resolves.toEqual({
      statusCode: 200,
      body: {
        success: true,
        action: "mcp-restart",
        server: "filesystem",
      },
      auditContext: { action: "mcp-restart", success: true, serverName: "filesystem" },
    })
    await expect(restartOperatorMcpServerAction({ server: "throw-restart" }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "MCP restart failed: restart denied" },
      auditContext: { action: "mcp-restart", success: false, failureReason: "mcp-restart-error" },
    })

    expect(runtimeToggles).toEqual([
      { serverName: "runtime-missing", enabled: true },
      { serverName: "start-fails", enabled: true },
      { serverName: "filesystem", enabled: true },
      { serverName: "throw-restart", enabled: true },
      { serverName: "stop-fails", enabled: false },
      { serverName: "filesystem", enabled: false },
      { serverName: "throw-stop", enabled: false },
    ])
    expect(lifecycleCalls).toEqual([
      "restart:start-fails",
      "restart:filesystem",
      "restart:throw-restart",
      "stop:stop-fails",
      "stop:filesystem",
      "stop:throw-stop",
      "restart:restart-fails",
      "restart:filesystem",
      "restart:throw-restart",
    ])
    expect(logs).toContain("Operator MCP start: filesystem")
    expect(logs).toContain("Operator MCP stop: filesystem")
    expect(logs).toContain("Operator MCP restart: filesystem")
    expect(logs).toContain("Operator MCP start failed: restart denied")
    expect(logs).toContain("Operator MCP stop failed: stop denied")
    expect(logs).toContain("Operator MCP restart failed: restart denied")
  })

  it("creates operator MCP route actions through shared adapters", async () => {
    type AuditContext = {
      action: string
      success?: boolean
      server?: string
      failureReason?: string
    }
    const status: McpServerStatusMapLike = {
      filesystem: {
        connected: true,
        toolCount: 1,
        runtimeEnabled: true,
        configDisabled: false,
      },
    }
    const calls: string[] = []
    const read: OperatorMcpReadActionOptions = {
      service: {
        getServerStatus: () => status,
        getServerLogs: (serverName) => {
          calls.push(`logs:${serverName}`)
          return [{ timestamp: 1, message: "ready" }]
        },
        getDetailedToolList: () => [{
          name: "filesystem:read",
          description: "Read files",
          sourceKind: "mcp",
          sourceName: "filesystem",
          enabled: true,
          serverEnabled: true,
        }],
      },
      diagnostics: {
        logError: (_source, message) => { calls.push(`error:${message}`) },
        getErrorMessage: (error) => error instanceof Error ? error.message : String(error),
      },
    }
    const mutation: OperatorMcpMutationActionOptions<AuditContext> = {
      service: {
        getServerStatus: () => status,
        clearServerLogs: (serverName) => { calls.push(`clear:${serverName}`) },
        setToolEnabled: (toolName, enabled) => {
          calls.push(`toggle:${toolName}:${enabled}`)
          return true
        },
      },
      diagnostics: read.diagnostics,
      audit: {
        buildClearLogsAuditContext: (server) => ({ action: "mcp-clear-logs", success: true, server }),
        buildClearLogsFailureAuditContext: (failureReason) => ({
          action: "mcp-clear-logs",
          success: false,
          failureReason,
        }),
        buildToolToggleAuditContext: (response) => ({ action: response.action, success: response.success }),
      },
    }
    const test: OperatorMcpTestActionOptions<MCPServerConfig, AuditContext> = {
      service: {
        getServerConfig: (serverName) => serverName === "filesystem" ? { command: "node" } : undefined,
        testServerConnection: async (serverName) => {
          calls.push(`test:${serverName}`)
          return { success: true, toolCount: 1 }
        },
      },
      diagnostics: read.diagnostics,
      audit: {
        buildTestAuditContext: (response) => ({
          action: response.action,
          success: response.success,
          server: response.server,
        }),
        buildTestFailureAuditContext: (failureReason) => ({
          action: "mcp-test",
          success: false,
          failureReason,
        }),
      },
    }
    const lifecycle: OperatorMcpLifecycleActionOptions<AuditContext> = {
      service: {
        getServerStatus: () => status,
        setServerRuntimeEnabled: (serverName, enabled) => {
          calls.push(`runtime:${serverName}:${enabled}`)
          return true
        },
        restartServer: async (serverName) => {
          calls.push(`restart:${serverName}`)
          return { success: true }
        },
        stopServer: async (serverName) => {
          calls.push(`stop:${serverName}`)
          return { success: true }
        },
      },
      diagnostics: {
        ...read.diagnostics,
        logInfo: (_source, message) => { calls.push(`info:${message}`) },
      },
      audit: {
        buildStartAuditContext: (server) => ({ action: "mcp-start", success: true, server }),
        buildStartFailureAuditContext: (failureReason) => ({
          action: "mcp-start",
          success: false,
          failureReason,
        }),
        buildStopAuditContext: (server) => ({ action: "mcp-stop", success: true, server }),
        buildStopFailureAuditContext: (failureReason) => ({
          action: "mcp-stop",
          success: false,
          failureReason,
        }),
        buildRestartAuditContext: (server) => ({ action: "mcp-restart", success: true, server }),
        buildRestartFailureAuditContext: (failureReason) => ({
          action: "mcp-restart",
          success: false,
          failureReason,
        }),
      },
    }
    const routeActions = createOperatorMcpRouteActions({ read, mutation, test, lifecycle })

    expect(routeActions.getOperatorMcpStatus()).toMatchObject({ statusCode: 200, body: { totalServers: 1 } })
    expect(routeActions.getOperatorMcpServerLogs("filesystem", "1")).toMatchObject({
      statusCode: 200,
      body: { count: 1 },
    })
    expect(routeActions.getOperatorMcpTools(undefined)).toMatchObject({
      statusCode: 200,
      body: { count: 1 },
    })
    expect(routeActions.clearOperatorMcpServerLogs("filesystem")).toMatchObject({
      statusCode: 200,
      body: { success: true },
    })
    expect(routeActions.setOperatorMcpToolEnabled("filesystem:read", { enabled: false })).toMatchObject({
      statusCode: 200,
      body: { success: true, enabled: false },
    })
    await expect(routeActions.testOperatorMcpServer("filesystem")).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, toolCount: 1 },
    })
    await expect(routeActions.startOperatorMcpServer({ server: "filesystem" })).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, action: "mcp-start" },
    })
    await expect(routeActions.stopOperatorMcpServer({ server: "filesystem" })).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, action: "mcp-stop" },
    })
    await expect(routeActions.restartOperatorMcpServer({ server: "filesystem" })).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, action: "mcp-restart" },
    })
    expect(calls).toEqual(expect.arrayContaining([
      "logs:filesystem",
      "clear:filesystem",
      "toggle:filesystem:read:false",
      "test:filesystem",
      "runtime:filesystem:true",
      "runtime:filesystem:false",
      "restart:filesystem",
      "stop:filesystem",
    ]))
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

  it("resolves injected MCP request contexts and runtime tools through shared adapters", () => {
    type ProfileSnapshot = {
      id: string
      mcpServerConfig: { enabledServers: string[] }
    }

    const activeProfile: ProfileSnapshot = {
      id: "active",
      mcpServerConfig: { enabledServers: ["runtime", "docs"] },
    }
    const trackedProfile: ProfileSnapshot = {
      id: "tracked",
      mcpServerConfig: { enabledServers: ["runtime"] },
    }
    const calls: string[] = []
    const session = {
      getAcpSessionForClientSessionToken: (token: string) => {
        calls.push(`acp:${token}`)
        if (token === "linked-active") return "acp-active"
        if (token === "linked-missing-profile") return "acp-missing-profile"
        return undefined
      },
      getAppSessionForAcpSession: (acpSessionId: string) => {
        calls.push(`app:${acpSessionId}`)
        if (acpSessionId === "acp-active") return "app-active"
        if (acpSessionId === "acp-missing-profile") return "app-missing-profile"
        return undefined
      },
      getPendingAppSessionForClientSessionToken: (token: string) => {
        calls.push(`pending:${token}`)
        return token === "pending-tracked" ? "app-tracked" : undefined
      },
      getActiveSessionProfileSnapshot: (appSessionId: string) => {
        calls.push(`active:${appSessionId}`)
        return appSessionId === "app-active" ? activeProfile : undefined
      },
      getTrackedSessionProfileSnapshot: (appSessionId: string) => {
        calls.push(`tracked:${appSessionId}`)
        return appSessionId === "app-tracked" ? trackedProfile : undefined
      },
    }

    expect(resolveInjectedMcpRequestContext(undefined, session)).toBeUndefined()
    expect(resolveInjectedMcpRequestContext("missing", session)).toBeUndefined()
    expect(resolveInjectedMcpRequestContext("linked-missing-profile", session)).toBeUndefined()
    expect(resolveInjectedMcpRequestContext("linked-active", session)).toEqual({
      appSessionId: "app-active",
      profileSnapshot: activeProfile,
    })
    expect(resolveInjectedMcpRequestContext("pending-tracked", session)).toEqual({
      appSessionId: "app-tracked",
      profileSnapshot: trackedProfile,
    })

    expect(resolveInjectedRuntimeToolsForAcpSession("linked-active", {
      session,
      tools: {
        getAvailableToolsForProfile: (profileSnapshot) => [{
          name: "runtime.read_file",
          description: `Read for ${profileSnapshot.id}`,
          inputSchema: { type: "object" },
        }, {
          name: "docs.search",
          description: "Docs",
          inputSchema: { type: "object" },
        }, {
          name: "runtime.no_description",
        }],
        isRuntimeToolName: (toolName) => toolName.startsWith("runtime."),
      },
    })).toEqual({
      requestContext: {
        appSessionId: "app-active",
        profileSnapshot: activeProfile,
      },
      tools: [{
        name: "runtime.read_file",
        description: "Read for active",
        inputSchema: { type: "object" },
      }, {
        name: "runtime.no_description",
        description: "",
        inputSchema: undefined,
      }],
    })

    expect(calls).toEqual([
      "acp:missing",
      "pending:missing",
      "acp:linked-missing-profile",
      "app:acp-missing-profile",
      "active:app-missing-profile",
      "tracked:app-missing-profile",
      "acp:linked-active",
      "app:acp-active",
      "active:app-active",
      "acp:pending-tracked",
      "pending:pending-tracked",
      "active:app-tracked",
      "tracked:app-tracked",
      "acp:linked-active",
      "app:acp-active",
      "active:app-active",
    ])
  })

  it("runs injected MCP list and call shims through shared service adapters", async () => {
    const logs: string[] = []
    const executedCalls: Array<{ name: string; arguments: unknown; appSessionId: string }> = []
    const context = { appSessionId: "app-1" }
    const options = {
      invalidSessionContextError: DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR,
      service: {
        getInjectedRuntimeTools: (token: string | undefined) => token === "valid"
          ? {
            requestContext: context,
            tools: [{
              name: "runtime.read_file",
              description: "Read files",
              inputSchema: { type: "object" },
            }, {
              name: "runtime.throw",
              description: "Throw",
              inputSchema: { type: "object" },
            }],
          }
          : undefined,
        executeInjectedRuntimeTool: async (
          toolCall: { name: string; arguments: unknown },
          requestContext: typeof context,
        ) => {
          if (toolCall.name === "runtime.throw") throw new Error("tool denied")
          executedCalls.push({
            name: toolCall.name,
            arguments: toolCall.arguments,
            appSessionId: requestContext.appSessionId,
          })
          return toolCall.arguments && typeof toolCall.arguments === "object"
            && (toolCall.arguments as { nullResult?: boolean }).nullResult
            ? null
            : { content: [{ type: "text", text: "ok" }], isError: false }
        },
      },
      diagnostics: {
        logWarning: (_source: string, message: string) => { logs.push(message) },
        logError: (_source: string, message: string) => { logs.push(message) },
        getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
      },
    }

    expect(listInjectedMcpToolsAction(undefined, options)).toEqual({
      statusCode: 401,
      body: { error: DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR },
    })
    expect(listInjectedMcpToolsAction("valid", options)).toEqual({
      statusCode: 200,
      body: {
        tools: [{
          name: "runtime.read_file",
          description: "Read files",
          inputSchema: { type: "object" },
        }, {
          name: "runtime.throw",
          description: "Throw",
          inputSchema: { type: "object" },
        }],
      },
    })
    await expect(callInjectedMcpToolAction(undefined, {}, options)).resolves.toEqual({
      statusCode: 401,
      body: { error: DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR },
    })
    await expect(callInjectedMcpToolAction("valid", {}, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Missing or invalid 'name' parameter" },
    })
    await expect(callInjectedMcpToolAction("valid", {
      name: "runtime.unknown",
      arguments: {},
    }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "Unknown runtime tool: runtime.unknown" },
    })
    await expect(callInjectedMcpToolAction("valid", {
      name: "runtime.read_file",
      arguments: { path: "README.md" },
    }, options)).resolves.toEqual({
      statusCode: 200,
      body: {
        content: [{ type: "text", text: "ok" }],
        isError: false,
      },
    })
    await expect(callInjectedMcpToolAction("valid", {
      name: "runtime.read_file",
      arguments: { nullResult: true },
    }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Tool execution returned null" },
    })
    await expect(callInjectedMcpToolAction("valid", {
      name: "runtime.throw",
      arguments: {},
    }, options)).resolves.toEqual({
      statusCode: 500,
      body: {
        content: [{ type: "text", text: "tool denied" }],
        isError: true,
      },
    })
    const sentResults: Array<{ statusCode: number; body: unknown }> = []
    const routeActions = createInjectedMcpToolRouteActions<{
      body: unknown
    }, typeof sentResults, typeof context>({
      action: options,
      request: {
        getBody: (request) => request.body,
      },
      response: {
        sendActionResult: (reply, result) => {
          reply.push(result)
          return result.body
        },
      },
    })

    expect(routeActions.listInjectedMcpTools("valid", sentResults)).toEqual({
      tools: [{
        name: "runtime.read_file",
        description: "Read files",
        inputSchema: { type: "object" },
      }, {
        name: "runtime.throw",
        description: "Throw",
        inputSchema: { type: "object" },
      }],
    })
    await expect(routeActions.callInjectedMcpTool({
      body: {
        name: "runtime.read_file",
        arguments: { path: "route.md" },
      },
    }, sentResults, "valid")).resolves.toEqual({
      content: [{ type: "text", text: "ok" }],
      isError: false,
    })
    expect(sentResults.map((result) => result.statusCode)).toEqual([200, 200])
    expect(executedCalls).toEqual([
      { name: "runtime.read_file", arguments: { path: "README.md" }, appSessionId: "app-1" },
      { name: "runtime.read_file", arguments: { nullResult: true }, appSessionId: "app-1" },
      { name: "runtime.read_file", arguments: { path: "route.md" }, appSessionId: "app-1" },
    ])
    expect(logs).toContain("Denied injected MCP tools/list request without valid ACP session context")
    expect(logs).toContain("Denied injected MCP tools/call request without valid ACP session context")
  })

  it("runs injected MCP protocol sessions through shared protocol adapters", async () => {
    type ProtocolRequest = {
      method: string
      headers: Record<string, string | string[] | undefined>
      body?: unknown
      raw: { id: string }
    }
    type ProtocolReply = {
      statusCode?: number
      body?: unknown
      sent: boolean
      hijacked: boolean
      raw: { id: string }
    }
    type TestServer = {
      token: string
      closed: boolean
    }
    type TestTransport = {
      sessionId?: string
      onclose?: () => Promise<void>
      requests: Array<{ rawRequest: unknown; rawReply: unknown; body?: unknown }>
      handleRequest(rawRequest: unknown, rawReply: unknown, body?: unknown): Promise<void>
    }

    const logs: string[] = []
    const serverEvents: string[] = []
    const transports: TestTransport[] = []
    const createReply = (): ProtocolReply => ({
      sent: false,
      hijacked: false,
      raw: { id: `reply-${Math.random()}` },
    })
    const createRequest = (
      method: string,
      body?: unknown,
      headers: Record<string, string | string[] | undefined> = {},
    ): ProtocolRequest => ({
      method,
      body,
      headers,
      raw: { id: `${method.toLowerCase()}-${transports.length}` },
    })

    const handleInjectedMcpProtocolRequest = createInjectedMcpProtocolRouteAction<
      ProtocolRequest,
      ProtocolReply,
      TestServer,
      TestTransport,
      { appSessionId: string }
    >({
      action: {
        invalidSessionContextError: DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR,
        service: {
          getInjectedRuntimeTools: (token: string | undefined) =>
            token === "valid" || token === "throw-connect"
              ? {
                requestContext: { appSessionId: "app-1" },
                tools: [],
              }
              : undefined,
          executeInjectedRuntimeTool: async () => null,
        },
        diagnostics: {
          logWarning: (_source, message) => { logs.push(`warn:${message}`) },
          logError: (_source, message, error) => {
            logs.push(`error:${message}:${error instanceof Error ? error.message : String(error)}`)
          },
          getErrorMessage: (error) => error instanceof Error ? error.message : String(error),
        },
      },
      protocol: {
        createServer: (token) => {
          serverEvents.push(`server:${token}`)
          return { token, closed: false }
        },
        createTransport: (transportOptions) => {
          const transport: TestTransport = {
            requests: [],
            async handleRequest(rawRequest, rawReply, body) {
              this.requests.push({ rawRequest, rawReply, body })
              if (!this.sessionId) {
                this.sessionId = transportOptions.sessionIdGenerator()
                transportOptions.onsessioninitialized(this.sessionId)
              }
            },
          }
          transports.push(transport)
          return transport
        },
        createSessionId: () => `session-${transports.length}`,
        isInitializeRequest: (body) =>
          !!body && typeof body === "object" && (body as { method?: unknown }).method === "initialize",
      },
      server: {
        connect: (server) => {
          serverEvents.push(`connect:${server.token}`)
          if (server.token === "throw-connect") {
            throw new Error("connect denied")
          }
        },
        close: (server) => {
          server.closed = true
          serverEvents.push(`close:${server.token}`)
        },
      },
      transport: {
        getSessionId: (transport) => transport.sessionId,
        setOnClose: (transport, onClose) => { transport.onclose = onClose },
        handleRequest: (transport, rawRequest, rawReply, body) =>
          transport.handleRequest(rawRequest, rawReply, body),
      },
      request: {
        getMethod: (request) => request.method,
        getHeader: (request, headerName) => request.headers[headerName],
        getBody: (request) => request.body,
        getRawRequest: (request) => request.raw,
      },
      response: {
        send: (reply, statusCode, body) => {
          reply.statusCode = statusCode
          reply.body = body
          reply.sent = true
          return reply
        },
        hijack: (reply) => {
          reply.hijacked = true
          reply.sent = true
          return reply
        },
        getRawReply: (reply) => reply.raw,
        isSent: (reply) => reply.sent,
      },
    })

    const missingTokenReply = createReply()
    await expect(
      handleInjectedMcpProtocolRequest(createRequest("POST", { method: "initialize" }), missingTokenReply, " "),
    ).resolves.toBe(missingTokenReply)
    expect(missingTokenReply.statusCode).toBe(400)
    expect(missingTokenReply.body).toEqual({ error: "Missing ACP session token" })

    const invalidContextReply = createReply()
    await expect(
      handleInjectedMcpProtocolRequest(createRequest("POST", { method: "initialize" }), invalidContextReply, "invalid"),
    ).resolves.toBe(invalidContextReply)
    expect(invalidContextReply.statusCode).toBe(401)
    expect(invalidContextReply.body).toEqual({ error: DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR })

    const missingSessionReply = createReply()
    await handleInjectedMcpProtocolRequest(createRequest("POST", { method: "tools/list" }), missingSessionReply, "valid")
    expect(missingSessionReply.statusCode).toBe(400)
    expect(missingSessionReply.body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: No valid session ID provided" },
      id: null,
    })

    const invalidSessionReply = createReply()
    await handleInjectedMcpProtocolRequest(
      createRequest("POST", { method: "tools/list" }, { "mcp-session-id": "missing" }),
      invalidSessionReply,
      "valid",
    )
    expect(invalidSessionReply.statusCode).toBe(404)
    expect(invalidSessionReply.body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Invalid MCP session ID" },
      id: null,
    })

    const initializeReply = createReply()
    await expect(
      handleInjectedMcpProtocolRequest(createRequest("POST", { method: "initialize" }), initializeReply, "valid"),
    ).resolves.toBe(initializeReply)
    expect(initializeReply.hijacked).toBe(true)
    expect(transports).toHaveLength(1)
    expect(transports[0].sessionId).toBe("session-1")
    expect(transports[0].requests[0].body).toEqual({ method: "initialize" })

    const existingPostReply = createReply()
    await handleInjectedMcpProtocolRequest(
      createRequest("POST", { method: "tools/list" }, { "mcp-session-id": "session-1" }),
      existingPostReply,
      "valid",
    )
    expect(existingPostReply.hijacked).toBe(true)
    expect(transports).toHaveLength(1)
    expect(transports[0].requests[1].body).toEqual({ method: "tools/list" })

    const existingGetReply = createReply()
    await handleInjectedMcpProtocolRequest(
      createRequest("GET", undefined, { "mcp-session-id": ["session-1"] }),
      existingGetReply,
      "valid",
    )
    expect(existingGetReply.hijacked).toBe(true)
    expect(transports[0].requests[2].body).toBeUndefined()

    await transports[0].onclose?.()
    const closedSessionReply = createReply()
    await handleInjectedMcpProtocolRequest(
      createRequest("GET", undefined, { "mcp-session-id": "session-1" }),
      closedSessionReply,
      "valid",
    )
    expect(closedSessionReply.statusCode).toBe(404)
    expect(closedSessionReply.body).toEqual({ error: "Invalid MCP session ID" })

    const connectErrorReply = createReply()
    await handleInjectedMcpProtocolRequest(
      createRequest("POST", { method: "initialize" }),
      connectErrorReply,
      "throw-connect",
    )
    expect(connectErrorReply.statusCode).toBe(500)
    expect(connectErrorReply.body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32603, message: "connect denied" },
      id: null,
    })

    expect(logs).toContain("warn:Denied injected MCP POST request without valid ACP session context")
    expect(logs).toContain("error:Injected MCP POST error:connect denied")
    expect(serverEvents).toEqual([
      "server:valid",
      "connect:valid",
      "close:valid",
      "server:throw-connect",
      "connect:throw-connect",
    ])
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
