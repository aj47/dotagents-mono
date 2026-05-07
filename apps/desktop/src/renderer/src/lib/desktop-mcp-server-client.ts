import type { MCPConfig, MCPServerConfig, ServerLogEntry } from "@dotagents/shared/mcp-utils"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopMcpServerStatusEntry {
  connected: boolean
  toolCount: number
  error?: string
  runtimeEnabled?: boolean
  configDisabled?: boolean
}

export interface DesktopMcpInitializationStatus {
  isInitializing: boolean
  progress: {
    current: number
    total: number
    currentServer?: string
  }
}

export interface DesktopMcpActionResult {
  success?: boolean
  error?: string
}

export interface DesktopMcpConnectionTestResult extends DesktopMcpActionResult {
  toolCount?: number
}

export const desktopMcpServerClient = {
  getServerStatus(): Promise<Record<string, DesktopMcpServerStatusEntry>> {
    return tipcClient.getMcpServerStatus() as Promise<Record<string, DesktopMcpServerStatusEntry>>
  },

  getInitializationStatus(): Promise<DesktopMcpInitializationStatus> {
    return tipcClient.getMcpInitializationStatus() as Promise<DesktopMcpInitializationStatus>
  },

  testConnection(
    serverName: string,
    serverConfig: MCPServerConfig,
  ): Promise<DesktopMcpConnectionTestResult> {
    return tipcClient.testMcpServerConnection({
      serverName,
      serverConfig,
    }) as Promise<DesktopMcpConnectionTestResult>
  },

  setRuntimeEnabled(serverName: string, enabled: boolean): Promise<DesktopMcpActionResult> {
    return tipcClient.setMcpServerRuntimeEnabled({
      serverName,
      enabled,
    }) as Promise<DesktopMcpActionResult>
  },

  restartServer(serverName: string): Promise<DesktopMcpActionResult> {
    return tipcClient.restartMcpServer({ serverName }) as Promise<DesktopMcpActionResult>
  },

  stopServer(serverName: string): Promise<DesktopMcpActionResult> {
    return tipcClient.stopMcpServer({ serverName }) as Promise<DesktopMcpActionResult>
  },

  getServerLogs(serverName: string): Promise<ServerLogEntry[]> {
    return tipcClient.getMcpServerLogs({ serverName }) as Promise<ServerLogEntry[]>
  },

  clearServerLogs(serverName: string): Promise<DesktopMcpActionResult> {
    return tipcClient.clearMcpServerLogs({ serverName }) as Promise<DesktopMcpActionResult>
  },

  loadConfigFile(): Promise<MCPConfig | null> {
    return tipcClient.loadMcpConfigFile() as Promise<MCPConfig | null>
  },

  saveConfigFile(config: MCPConfig): Promise<boolean> {
    return tipcClient.saveMcpConfigFile({ config }) as Promise<boolean>
  },

  validateConfigText(text: string): Promise<MCPConfig | null> {
    return tipcClient.validateMcpConfigText({ text }) as Promise<MCPConfig | null>
  },
}
