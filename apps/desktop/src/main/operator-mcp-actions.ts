import {
  buildOperatorMcpServerLogsResponse,
  buildOperatorMcpStatusResponse,
  buildOperatorMcpToolsResponse,
  buildOperatorMcpToolToggleResponse,
  parseMcpServerToggleRequestBody,
} from "@dotagents/shared/mcp-api"
import {
  buildOperatorActionAuditContext,
  buildOperatorMcpClearLogsAuditContext,
  buildOperatorMcpClearLogsFailureAuditContext,
  buildOperatorMcpClearLogsResponse,
  buildOperatorMcpRestartAuditContext,
  buildOperatorMcpRestartFailureAuditContext,
  buildOperatorMcpRestartResponse,
  buildOperatorMcpStartAuditContext,
  buildOperatorMcpStartFailureAuditContext,
  buildOperatorMcpStartResponse,
  buildOperatorMcpStopAuditContext,
  buildOperatorMcpStopFailureAuditContext,
  buildOperatorMcpStopResponse,
  buildOperatorMcpTestAuditContext,
  buildOperatorMcpTestFailureAuditContext,
  buildOperatorMcpTestResponse,
  clampOperatorCount,
  parseOperatorMcpRestartRequestBody,
  parseOperatorMcpServerActionRequestBody,
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import type { MCPServerConfig } from "../shared/types"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "./error-utils"
import { mcpService } from "./mcp-service"

export type OperatorMcpActionResult = OperatorRouteActionResult

function ok(body: unknown, auditContext?: OperatorActionAuditContext): OperatorMcpActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function error(statusCode: number, message: string, auditContext?: OperatorActionAuditContext): OperatorMcpActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  }
}

export function getOperatorMcpStatus(): OperatorMcpActionResult {
  try {
    return ok(buildOperatorMcpStatusResponse(mcpService.getServerStatus()))
  } catch (caughtError) {
    diagnosticsService.logError("operator-mcp-actions", "Failed to build operator MCP status", caughtError)
    return error(500, "Failed to build operator MCP status")
  }
}

export function getOperatorMcpServerLogs(
  serverName: string | undefined,
  count: string | number | undefined,
): OperatorMcpActionResult {
  if (!serverName) {
    return error(400, "Missing server name")
  }

  try {
    const status = mcpService.getServerStatus()[serverName]
    if (!status) {
      return error(404, `Server ${serverName} not found in configuration`)
    }

    return ok(buildOperatorMcpServerLogsResponse(
      serverName,
      mcpService.getServerLogs(serverName),
      clampOperatorCount(count, 50, 200),
    ))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Failed to get MCP server logs for ${serverName}: ${errorMessage}`, caughtError)
    return error(500, `Failed to get MCP server logs: ${errorMessage}`)
  }
}

export function clearOperatorMcpServerLogs(serverName: string | undefined): OperatorMcpActionResult {
  if (!serverName) {
    return error(400, "Missing server name", buildOperatorMcpClearLogsFailureAuditContext("missing-server-name"))
  }

  try {
    const status = mcpService.getServerStatus()[serverName]
    if (!status) {
      return error(
        404,
        `Server ${serverName} not found in configuration`,
        buildOperatorMcpClearLogsFailureAuditContext("server-not-found"),
      )
    }

    mcpService.clearServerLogs(serverName)
    return ok(buildOperatorMcpClearLogsResponse(serverName), buildOperatorMcpClearLogsAuditContext(serverName))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Failed to clear MCP server logs for ${serverName}: ${errorMessage}`, caughtError)
    return error(
      500,
      `Failed to clear MCP server logs: ${errorMessage}`,
      buildOperatorMcpClearLogsFailureAuditContext("mcp-clear-logs-error"),
    )
  }
}

export async function testOperatorMcpServer(serverName: string | undefined): Promise<OperatorMcpActionResult> {
  if (!serverName) {
    return error(400, "Missing server name", buildOperatorMcpTestFailureAuditContext("missing-server-name"))
  }

  try {
    const serverConfig = configStore.get().mcpConfig?.mcpServers?.[serverName] as MCPServerConfig | undefined
    if (!serverConfig) {
      return error(
        404,
        `Server ${serverName} not found in configuration`,
        buildOperatorMcpTestFailureAuditContext("server-not-found"),
      )
    }

    const result = await mcpService.testServerConnection(serverName, serverConfig)
    const response = buildOperatorMcpTestResponse(serverName, result)
    return ok(response, buildOperatorMcpTestAuditContext(response))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Failed to test MCP server ${serverName}: ${errorMessage}`, caughtError)
    return error(
      500,
      `Failed to test MCP server: ${errorMessage}`,
      buildOperatorMcpTestFailureAuditContext("mcp-test-error"),
    )
  }
}

export function getOperatorMcpTools(server: unknown): OperatorMcpActionResult {
  try {
    return ok(buildOperatorMcpToolsResponse(
      mcpService.getDetailedToolList(),
      typeof server === "string" && server.trim() ? server.trim() : undefined,
    ))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Failed to list MCP tools: ${errorMessage}`, caughtError)
    return error(500, `Failed to list MCP tools: ${errorMessage}`)
  }
}

export function setOperatorMcpToolEnabled(
  toolName: string | undefined,
  body: unknown,
): OperatorMcpActionResult {
  if (!toolName) {
    return error(400, "Missing tool name")
  }

  const parsedRequest = parseMcpServerToggleRequestBody(body)
  if (parsedRequest.ok === false) {
    return error(parsedRequest.statusCode, parsedRequest.error)
  }

  try {
    const enabled = parsedRequest.request.enabled
    const success = mcpService.setToolEnabled(toolName, enabled)
    const response = buildOperatorMcpToolToggleResponse(toolName, enabled, success)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Failed to toggle MCP tool ${toolName}: ${errorMessage}`, caughtError)
    return error(500, `Failed to toggle MCP tool: ${errorMessage}`)
  }
}

export async function startOperatorMcpServer(body: unknown): Promise<OperatorMcpActionResult> {
  try {
    const parsedRequest = parseOperatorMcpServerActionRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const serverName = parsedRequest.request.server
    const status = mcpService.getServerStatus()[serverName]
    if (!status) {
      return error(
        404,
        `Server ${serverName} not found in configuration`,
        buildOperatorMcpStartFailureAuditContext("server-not-found"),
      )
    }
    if (status.configDisabled) {
      return error(
        400,
        `Server ${serverName} is disabled in configuration`,
        buildOperatorMcpStartFailureAuditContext("server-config-disabled"),
      )
    }

    if (!mcpService.setServerRuntimeEnabled(serverName, true)) {
      return error(
        404,
        `Server ${serverName} not found in configuration`,
        buildOperatorMcpStartFailureAuditContext("server-not-found"),
      )
    }

    diagnosticsService.logInfo("operator-mcp-actions", `Operator MCP start: ${serverName}`)
    const result = await mcpService.restartServer(serverName)
    if (!result.success) {
      return error(
        400,
        result.error || "Start failed",
        buildOperatorMcpStartFailureAuditContext(result.error || "start-failed"),
      )
    }

    return ok(buildOperatorMcpStartResponse(serverName), buildOperatorMcpStartAuditContext(serverName))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Operator MCP start failed: ${errorMessage}`, caughtError)
    return error(
      500,
      `MCP start failed: ${errorMessage}`,
      buildOperatorMcpStartFailureAuditContext("mcp-start-error"),
    )
  }
}

export async function stopOperatorMcpServer(body: unknown): Promise<OperatorMcpActionResult> {
  try {
    const parsedRequest = parseOperatorMcpServerActionRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const serverName = parsedRequest.request.server
    const status = mcpService.getServerStatus()[serverName]
    if (!status) {
      return error(
        404,
        `Server ${serverName} not found in configuration`,
        buildOperatorMcpStopFailureAuditContext("server-not-found"),
      )
    }
    if (status.configDisabled) {
      return error(
        400,
        `Server ${serverName} is disabled in configuration`,
        buildOperatorMcpStopFailureAuditContext("server-config-disabled"),
      )
    }

    if (!mcpService.setServerRuntimeEnabled(serverName, false)) {
      return error(
        404,
        `Server ${serverName} not found in configuration`,
        buildOperatorMcpStopFailureAuditContext("server-not-found"),
      )
    }

    diagnosticsService.logInfo("operator-mcp-actions", `Operator MCP stop: ${serverName}`)
    const result = await mcpService.stopServer(serverName)
    if (!result.success) {
      return error(
        400,
        result.error || "Stop failed",
        buildOperatorMcpStopFailureAuditContext(result.error || "stop-failed"),
      )
    }

    return ok(buildOperatorMcpStopResponse(serverName), buildOperatorMcpStopAuditContext(serverName))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Operator MCP stop failed: ${errorMessage}`, caughtError)
    return error(
      500,
      `MCP stop failed: ${errorMessage}`,
      buildOperatorMcpStopFailureAuditContext("mcp-stop-error"),
    )
  }
}

export async function restartOperatorMcpServer(body: unknown): Promise<OperatorMcpActionResult> {
  try {
    const parsedRequest = parseOperatorMcpRestartRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const serverName = parsedRequest.request.server
    diagnosticsService.logInfo("operator-mcp-actions", `Operator MCP restart: ${serverName}`)
    const result = await mcpService.restartServer(serverName)
    if (!result.success) {
      return error(
        400,
        result.error || "Restart failed",
        buildOperatorMcpRestartFailureAuditContext(result.error || "restart-failed"),
      )
    }

    return ok(buildOperatorMcpRestartResponse(serverName), buildOperatorMcpRestartAuditContext(serverName))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-mcp-actions", `Operator MCP restart failed: ${errorMessage}`, caughtError)
    return error(
      500,
      `MCP restart failed: ${errorMessage}`,
      buildOperatorMcpRestartFailureAuditContext("mcp-restart-error"),
    )
  }
}
