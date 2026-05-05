import {
  buildMcpServerToggleResponse,
  buildMcpServersResponse,
  parseMcpServerToggleRequestBody,
} from "@dotagents/shared/mcp-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"

export type McpServerActionResult = MobileApiActionResult

function ok(body: unknown): McpServerActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, message: string): McpServerActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function getMcpServers(): McpServerActionResult {
  try {
    return ok(buildMcpServersResponse(mcpService.getServerStatus()))
  } catch (caughtError) {
    diagnosticsService.logError("mcp-server-actions", "Failed to get MCP servers", caughtError)
    return error(500, "Failed to get MCP servers")
  }
}

export function toggleMcpServer(serverName: string | undefined, body: unknown): McpServerActionResult {
  try {
    const parsedRequest = parseMcpServerToggleRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }
    const { enabled } = parsedRequest.request

    const success = mcpService.setServerRuntimeEnabled(serverName ?? "", enabled)
    if (!success) {
      return error(404, `Server '${serverName}' not found`)
    }

    diagnosticsService.logInfo("mcp-server-actions", `Toggled MCP server ${serverName} to ${enabled ? "enabled" : "disabled"}`)
    return ok(buildMcpServerToggleResponse(serverName ?? "", enabled))
  } catch (caughtError: any) {
    diagnosticsService.logError("mcp-server-actions", "Failed to toggle MCP server", caughtError)
    return error(500, caughtError?.message || "Failed to toggle MCP server")
  }
}
