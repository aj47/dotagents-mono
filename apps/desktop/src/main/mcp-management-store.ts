import { configStore } from "./config"
import { mcpService } from "./mcp-service"
import type { McpManagementStore } from "./mcp-management"
import type { McpOAuthManagementStore } from "./mcp-oauth-management"
import type { McpToolManagementStore } from "./mcp-tool-management"

export const mcpManagementStore: McpManagementStore &
  McpToolManagementStore &
  McpOAuthManagementStore = {
  getServerConfigs: () => configStore.get().mcpConfig?.mcpServers || {},
  getServerStatus: () => mcpService.getServerStatus(),
  setServerRuntimeEnabled: (serverName, enabled) =>
    mcpService.setServerRuntimeEnabled(serverName, enabled),
  restartServer: (serverName) => mcpService.restartServer(serverName),
  stopServer: (serverName) => mcpService.stopServer(serverName),
  getServerLogs: (serverName) => mcpService.getServerLogs(serverName),
  getOAuthStatus: (serverName) => mcpService.getOAuthStatus(serverName),
  initiateOAuthFlow: (serverName, options) =>
    mcpService.initiateOAuthFlow(serverName, options),
  completeOAuthFlow: (serverName, code, state) =>
    mcpService.completeOAuthFlow(serverName, code, state),
  revokeOAuthTokens: (serverName) => mcpService.revokeOAuthTokens(serverName),
  getDetailedToolList: () => mcpService.getDetailedToolList(),
  setToolEnabled: (toolName, enabled) =>
    mcpService.setToolEnabled(toolName, enabled),
}

export const mcpToolManagementStore: McpToolManagementStore = mcpManagementStore
export const mcpOAuthManagementStore: McpOAuthManagementStore =
  mcpManagementStore
