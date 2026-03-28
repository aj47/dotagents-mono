import { configStore } from "./config"
import { mcpService } from "./mcp-service"
import type { McpManagementStore } from "./mcp-management"
import type { McpToolManagementStore } from "./mcp-tool-management"

export const mcpManagementStore: McpManagementStore & McpToolManagementStore = {
  getServerConfigs: () => configStore.get().mcpConfig?.mcpServers || {},
  getServerStatus: () => mcpService.getServerStatus(),
  setServerRuntimeEnabled: (serverName, enabled) =>
    mcpService.setServerRuntimeEnabled(serverName, enabled),
  restartServer: (serverName) => mcpService.restartServer(serverName),
  stopServer: (serverName) => mcpService.stopServer(serverName),
  getServerLogs: (serverName) => mcpService.getServerLogs(serverName),
  getDetailedToolList: () => mcpService.getDetailedToolList(),
  setToolEnabled: (toolName, enabled) =>
    mcpService.setToolEnabled(toolName, enabled),
}

export const mcpToolManagementStore: McpToolManagementStore = mcpManagementStore
