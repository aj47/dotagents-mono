import { configStore } from "./config"
import { mcpService } from "./mcp-service"
import type { McpManagementStore } from "./mcp-management"

export const mcpManagementStore: McpManagementStore = {
  getServerConfigs: () => configStore.get().mcpConfig?.mcpServers || {},
  getServerStatus: () => mcpService.getServerStatus(),
  setServerRuntimeEnabled: (serverName, enabled) =>
    mcpService.setServerRuntimeEnabled(serverName, enabled),
  restartServer: (serverName) => mcpService.restartServer(serverName),
  stopServer: (serverName) => mcpService.stopServer(serverName),
  getServerLogs: (serverName) => mcpService.getServerLogs(serverName),
}
