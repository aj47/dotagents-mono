import {
  getMcpServersAction,
  toggleMcpServerAction,
} from "@dotagents/shared/mcp-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"

export type McpServerActionResult = MobileApiActionResult

const mcpServerActionOptions = {
  service: mcpService,
  diagnostics: diagnosticsService,
}

export function getMcpServers(): McpServerActionResult {
  return getMcpServersAction(mcpServerActionOptions)
}

export function toggleMcpServer(serverName: string | undefined, body: unknown): McpServerActionResult {
  return toggleMcpServerAction(serverName, body, mcpServerActionOptions)
}
