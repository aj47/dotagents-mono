import { MARK_WORK_COMPLETE_TOOL, RESPOND_TO_USER_TOOL } from "./chat-utils"
import type {
  MCPServer,
  MCPServersResponse,
  OperatorMCPServerLogEntry,
  OperatorMCPServerLogsResponse,
  OperatorMCPServerSummary,
  OperatorMCPStatusResponse,
  OperatorMCPToolsResponse,
  OperatorMCPToolSummary,
  OperatorMCPToolToggleResponse,
} from "./api-types"

export type McpRequestParseResult<T> =
  | { ok: true; request: T }
  | { ok: false; statusCode: 400; error: string }

export type McpServerToggleRequest = {
  enabled: boolean
}

export type McpServerToggleResponse = {
  success: true
  server: string
  enabled: boolean
}

export type InjectedMcpToolCallRequest = {
  name: string
  arguments: unknown
}

export type InjectedMcpToolExecutionResult = {
  content: unknown
  isError?: boolean
}

export type InjectedMcpToolCallResponse = {
  content: unknown
  isError?: boolean
}

export type InjectedMcpToolsListResponse = {
  tools: unknown[]
}

export type McpServerStatusLike = {
  connected: boolean
  toolCount: number
  runtimeEnabled?: boolean
  configDisabled?: boolean
  error?: string
}

export type McpServerStatusMapLike = Record<string, McpServerStatusLike>

export type McpServerActionResult = {
  statusCode: number
  body: unknown
}

export interface McpServerActionService {
  getServerStatus(): McpServerStatusMapLike
  setServerRuntimeEnabled(serverName: string, enabled: boolean): boolean
}

export interface McpServerActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
  logInfo?(source: string, message: string): void
}

export interface McpServerActionOptions {
  service: McpServerActionService
  diagnostics: McpServerActionDiagnostics
}

export interface OperatorMcpReadActionService {
  getServerStatus(): McpServerStatusMapLike
  getServerLogs(serverName: string): McpServerLogEntryLike[]
  getDetailedToolList(): McpToolSummaryLike[]
}

export interface OperatorMcpReadActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
  getErrorMessage(error: unknown): string
}

export interface OperatorMcpReadActionOptions {
  service: OperatorMcpReadActionService
  diagnostics: OperatorMcpReadActionDiagnostics
}

export type McpServerLogEntryLike = {
  timestamp: number
  message: string
}

export type McpToolSummaryLike = {
  name: string
  description?: string
  sourceKind: "mcp" | "runtime"
  sourceName: string
  sourceLabel?: string
  serverName?: string
  enabled: boolean
  serverEnabled: boolean
}

export const MCP_MAX_ITERATIONS_MIN = 1
export const MCP_MAX_ITERATIONS_MAX = 100
export const MCP_MAX_ITERATIONS_DEFAULT = 10

// Name advertised for DotAgents runtime tools when they are grouped as an MCP source.
export const RUNTIME_TOOLS_SERVER_NAME = "dotagents-runtime-tools"

// Reserved internal server names that should not be user-configurable as normal MCP servers.
export const RESERVED_RUNTIME_TOOL_SERVER_NAMES = [RUNTIME_TOOLS_SERVER_NAME] as const

// Internal MCP server identifier used by embedded injected runtime tool transports.
export const INJECTED_RUNTIME_TOOL_TRANSPORT_NAME = "dotagents-injected-runtime-tools"

// Internal completion nudge message: include in LLM context, but hide from progress UI.
export const INTERNAL_COMPLETION_NUDGE_TEXT =
  `If all requested work is complete, use ${RESPOND_TO_USER_TOOL} to tell the user the result, then call ${MARK_WORK_COMPLETE_TOOL} with a concise summary. Otherwise continue working and call more tools.`

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

export function parseMcpMaxIterationsDraft(value: string): number | null {
  const parsedValue = Number.parseInt(value, 10)
  if (Number.isNaN(parsedValue)) return null
  if (parsedValue < MCP_MAX_ITERATIONS_MIN || parsedValue > MCP_MAX_ITERATIONS_MAX) return null
  return parsedValue
}

export function normalizeMcpMaxIterationsValue(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined
  }

  const normalizedValue = Math.floor(value)
  return normalizedValue >= MCP_MAX_ITERATIONS_MIN && normalizedValue <= MCP_MAX_ITERATIONS_MAX
    ? normalizedValue
    : undefined
}

export function formatMcpMaxIterationsValidationMessage(): string {
  return `Max Iterations must be between ${MCP_MAX_ITERATIONS_MIN} and ${MCP_MAX_ITERATIONS_MAX} before saving.`
}

export function parseMcpServerToggleRequestBody(body: unknown): McpRequestParseResult<McpServerToggleRequest> {
  const requestBody = getRequestRecord(body)
  const enabled = requestBody.enabled

  if (typeof enabled !== "boolean") {
    return { ok: false, statusCode: 400, error: "Missing or invalid 'enabled' boolean" }
  }

  return { ok: true, request: { enabled } }
}

export function buildMcpServerToggleResponse(server: string, enabled: boolean): McpServerToggleResponse {
  return {
    success: true,
    server,
    enabled,
  }
}

export function buildMcpServersResponse(
  serverStatus: McpServerStatusMapLike,
): MCPServersResponse {
  const servers: MCPServer[] = Object.entries(serverStatus)
    .map(([name, status]) => ({
      name,
      connected: status.connected,
      toolCount: status.toolCount,
      enabled: !!status.runtimeEnabled && !status.configDisabled,
      runtimeEnabled: !!status.runtimeEnabled,
      configDisabled: !!status.configDisabled,
      error: status.error,
    }))

  return { servers }
}

function mcpServerActionOk(body: unknown): McpServerActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function mcpServerActionError(statusCode: number, message: string): McpServerActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function clampOperatorMcpCount(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.NaN

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(1, Math.min(Math.trunc(parsed), max))
}

export function getMcpServersAction(options: McpServerActionOptions): McpServerActionResult {
  try {
    return mcpServerActionOk(buildMcpServersResponse(options.service.getServerStatus()))
  } catch (caughtError) {
    options.diagnostics.logError("mcp-server-actions", "Failed to get MCP servers", caughtError)
    return mcpServerActionError(500, "Failed to get MCP servers")
  }
}

export function toggleMcpServerAction(
  serverName: string | undefined,
  body: unknown,
  options: McpServerActionOptions,
): McpServerActionResult {
  try {
    const parsedRequest = parseMcpServerToggleRequestBody(body)
    if (parsedRequest.ok === false) {
      return mcpServerActionError(parsedRequest.statusCode, parsedRequest.error)
    }
    const { enabled } = parsedRequest.request
    const normalizedServerName = serverName ?? ""

    const success = options.service.setServerRuntimeEnabled(normalizedServerName, enabled)
    if (!success) {
      return mcpServerActionError(404, `Server '${serverName}' not found`)
    }

    options.diagnostics.logInfo?.(
      "mcp-server-actions",
      `Toggled MCP server ${serverName} to ${enabled ? "enabled" : "disabled"}`,
    )
    return mcpServerActionOk(buildMcpServerToggleResponse(normalizedServerName, enabled))
  } catch (caughtError) {
    options.diagnostics.logError("mcp-server-actions", "Failed to toggle MCP server", caughtError)
    return mcpServerActionError(500, getUnknownErrorMessage(caughtError, "Failed to toggle MCP server"))
  }
}

export function buildOperatorMcpStatusResponse(
  serverStatus: McpServerStatusMapLike,
  options: { excludedServerNames?: string[] } = {},
): OperatorMCPStatusResponse {
  const excludedServerNames = new Set(options.excludedServerNames ?? ["dotagents-internal"])
  const servers: OperatorMCPServerSummary[] = Object.entries(serverStatus)
    .filter(([name]) => !excludedServerNames.has(name))
    .map(([name, status]) => ({
      name,
      connected: status.connected,
      toolCount: status.toolCount,
      enabled: (status.runtimeEnabled ?? true) && !status.configDisabled,
      runtimeEnabled: status.runtimeEnabled ?? true,
      configDisabled: !!status.configDisabled,
      error: status.error,
    }))

  return {
    totalServers: servers.length,
    connectedServers: servers.filter((server) => server.connected).length,
    totalTools: servers.reduce((sum, server) => sum + server.toolCount, 0),
    servers,
  }
}

export function getOperatorMcpStatusAction(
  options: OperatorMcpReadActionOptions,
): McpServerActionResult {
  try {
    return mcpServerActionOk(buildOperatorMcpStatusResponse(options.service.getServerStatus()))
  } catch (caughtError) {
    options.diagnostics.logError("operator-mcp-actions", "Failed to build operator MCP status", caughtError)
    return mcpServerActionError(500, "Failed to build operator MCP status")
  }
}

export function buildOperatorMcpServerLogsResponse(
  server: string,
  logs: McpServerLogEntryLike[],
  count?: number,
): OperatorMCPServerLogsResponse {
  const normalizedCount = typeof count === "number" && Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : undefined
  const selectedLogs = normalizedCount === undefined ? logs : logs.slice(-normalizedCount)
  const responseLogs: OperatorMCPServerLogEntry[] = selectedLogs.map((entry) => ({
    timestamp: entry.timestamp,
    message: entry.message,
  }))

  return {
    server,
    count: responseLogs.length,
    logs: responseLogs,
  }
}

export function getOperatorMcpServerLogsAction(
  serverName: string | undefined,
  count: string | number | undefined,
  options: OperatorMcpReadActionOptions,
): McpServerActionResult {
  if (!serverName) {
    return mcpServerActionError(400, "Missing server name")
  }

  try {
    const status = options.service.getServerStatus()[serverName]
    if (!status) {
      return mcpServerActionError(404, `Server ${serverName} not found in configuration`)
    }

    return mcpServerActionOk(buildOperatorMcpServerLogsResponse(
      serverName,
      options.service.getServerLogs(serverName),
      clampOperatorMcpCount(count, 50, 200),
    ))
  } catch (caughtError) {
    const errorMessage = options.diagnostics.getErrorMessage(caughtError)
    options.diagnostics.logError("operator-mcp-actions", `Failed to get MCP server logs for ${serverName}: ${errorMessage}`, caughtError)
    return mcpServerActionError(500, `Failed to get MCP server logs: ${errorMessage}`)
  }
}

export function buildOperatorMcpToolsResponse(
  tools: McpToolSummaryLike[],
  server?: string,
): OperatorMCPToolsResponse {
  const filteredTools = server === undefined
    ? tools
    : tools.filter((tool) => tool.sourceName === server || tool.serverName === server)
  const responseTools: OperatorMCPToolSummary[] = filteredTools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    sourceKind: tool.sourceKind,
    sourceName: tool.sourceName,
    sourceLabel: tool.sourceLabel ?? tool.sourceName,
    ...(tool.serverName ? { serverName: tool.serverName } : {}),
    enabled: tool.enabled,
    serverEnabled: tool.serverEnabled,
  }))

  return {
    count: responseTools.length,
    ...(server !== undefined ? { server } : {}),
    tools: responseTools,
  }
}

export function getOperatorMcpToolsAction(
  server: unknown,
  options: OperatorMcpReadActionOptions,
): McpServerActionResult {
  try {
    return mcpServerActionOk(buildOperatorMcpToolsResponse(
      options.service.getDetailedToolList(),
      typeof server === "string" && server.trim() ? server.trim() : undefined,
    ))
  } catch (caughtError) {
    const errorMessage = options.diagnostics.getErrorMessage(caughtError)
    options.diagnostics.logError("operator-mcp-actions", `Failed to list MCP tools: ${errorMessage}`, caughtError)
    return mcpServerActionError(500, `Failed to list MCP tools: ${errorMessage}`)
  }
}

export function buildOperatorMcpToolToggleResponse(
  toolName: string,
  enabled: boolean,
  success: boolean,
): OperatorMCPToolToggleResponse {
  return {
    success,
    action: "mcp-tool-toggle",
    tool: toolName,
    enabled,
    message: success
      ? `Tool ${toolName} ${enabled ? "enabled" : "disabled"}`
      : `Failed to ${enabled ? "enable" : "disable"} tool ${toolName}`,
    ...(success ? {} : { error: "Tool not found or cannot be toggled" }),
  }
}

export function parseInjectedMcpToolCallRequestBody(body: unknown): McpRequestParseResult<InjectedMcpToolCallRequest> {
  const requestBody = getRequestRecord(body)
  const name = requestBody.name

  if (!name || typeof name !== "string") {
    return { ok: false, statusCode: 400, error: "Missing or invalid 'name' parameter" }
  }

  return {
    ok: true,
    request: {
      name,
      arguments: requestBody.arguments || {},
    },
  }
}

export function buildInjectedMcpToolCallResponse(
  result: InjectedMcpToolExecutionResult,
): InjectedMcpToolCallResponse {
  return {
    content: result.content,
    isError: result.isError,
  }
}

export function buildInjectedMcpToolCallErrorResponse(message: string): InjectedMcpToolCallResponse {
  return {
    content: [{ type: "text", text: message || "Tool execution failed" }],
    isError: true,
  }
}

export function buildInjectedMcpToolsListResponse(tools: unknown[]): InjectedMcpToolsListResponse {
  return { tools }
}
