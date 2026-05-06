import {
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  deleteMcpServerConfigAction,
  exportMcpServerConfigsAction,
  getMcpServersAction,
  importMcpServerConfigsAction,
  toggleMcpServerAction,
  upsertMcpServerConfigAction,
} from "@dotagents/shared/mcp-api"
import type { MCPConfig } from "@dotagents/shared/mcp-utils"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { getAgentsLayerPaths } from "@dotagents/core"
import { cleanupInvalidMcpServerReferencesInLayers } from "./agent-profile-mcp-cleanup"
import { agentProfileService } from "./agent-profile-service"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"

export type McpServerActionResult = MobileApiActionResult

const mcpServerActionOptions = {
  service: mcpService,
  diagnostics: diagnosticsService,
}

function cleanupInvalidAgentProfileMcpReferences(mcpConfig: MCPConfig): void {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const layers = workspaceAgentsFolder
    ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
    : [getAgentsLayerPaths(globalAgentsFolder)]
  const validServerNames = Object.keys(mcpConfig.mcpServers || {})
  const cleanupResult = cleanupInvalidMcpServerReferencesInLayers(layers, validServerNames)

  if (cleanupResult.updatedProfileIds.length > 0) {
    agentProfileService.reload()
    diagnosticsService.logInfo(
      "mcp-server-actions",
      `Cleaned ${cleanupResult.removedReferenceCount} stale MCP server reference(s) from ${cleanupResult.updatedProfileIds.length} agent profile(s)`,
    )
  }
}

const mcpServerConfigActionOptions = {
  service: {
    getMcpConfig: () => configStore.get().mcpConfig || { mcpServers: {} },
    saveMcpConfig: (mcpConfig: MCPConfig) => {
      const config = configStore.get()
      configStore.save({ ...config, mcpConfig })
    },
    onMcpConfigSaved: ({ action, nextMcpConfig }) => {
      if (action === "deleted") {
        cleanupInvalidAgentProfileMcpReferences(nextMcpConfig)
      }
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

export function importMcpServerConfigs(body: unknown): McpServerActionResult {
  return importMcpServerConfigsAction(body, mcpServerConfigActionOptions)
}

export function exportMcpServerConfigs(): McpServerActionResult {
  return exportMcpServerConfigsAction(mcpServerConfigActionOptions)
}

export function upsertMcpServerConfig(serverName: string | undefined, body: unknown): McpServerActionResult {
  return upsertMcpServerConfigAction(serverName, body, mcpServerConfigActionOptions)
}

export function deleteMcpServerConfig(serverName: string | undefined): McpServerActionResult {
  return deleteMcpServerConfigAction(serverName, mcpServerConfigActionOptions)
}
