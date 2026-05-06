import {
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  deleteMcpServerConfigAction,
  getMcpServersAction,
  toggleMcpServerAction,
  upsertMcpServerConfigAction,
} from "@dotagents/shared/mcp-api"
import type { MCPConfig } from "@dotagents/shared/mcp-utils"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"
import { configStore } from "./config"

export type McpServerActionResult = MobileApiActionResult

const mcpServerActionOptions = {
  service: mcpService,
  diagnostics: diagnosticsService,
}

const mcpServerConfigActionOptions = {
  service: {
    getMcpConfig: () => configStore.get().mcpConfig || { mcpServers: {} },
    saveMcpConfig: (mcpConfig: MCPConfig) => {
      const config = configStore.get()
      configStore.save({ ...config, mcpConfig })
    },
  },
  diagnostics: diagnosticsService,
  reservedServerNames: RESERVED_RUNTIME_TOOL_SERVER_NAMES,
} satisfies Parameters<typeof upsertMcpServerConfigAction>[2]

export function getMcpServers(): McpServerActionResult {
  return getMcpServersAction(mcpServerActionOptions)
}

export function toggleMcpServer(serverName: string | undefined, body: unknown): McpServerActionResult {
  return toggleMcpServerAction(serverName, body, mcpServerActionOptions)
}

export function upsertMcpServerConfig(serverName: string | undefined, body: unknown): McpServerActionResult {
  return upsertMcpServerConfigAction(serverName, body, mcpServerConfigActionOptions)
}

export function deleteMcpServerConfig(serverName: string | undefined): McpServerActionResult {
  return deleteMcpServerConfigAction(serverName, mcpServerConfigActionOptions)
}
