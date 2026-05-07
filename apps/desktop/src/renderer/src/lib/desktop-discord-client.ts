import type {
  OperatorActionResponse,
  OperatorDiscordIntegrationSummary,
  OperatorDiscordLogEntry,
} from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

export type DesktopDiscordStatus = Omit<OperatorDiscordIntegrationSummary, "logs"> & {
  botId?: string
  defaultProfileSource?: "config" | "env"
  tokenSource?: "config" | "env"
}

export type DesktopDiscordLogEntry = OperatorDiscordLogEntry & {
  level: "info" | "warn" | "error"
}

export type DesktopDiscordActionResult = Pick<OperatorActionResponse, "success" | "error">

export const desktopDiscordClient = {
  getStatus(): Promise<DesktopDiscordStatus> {
    return tipcClient.discordGetStatus() as Promise<DesktopDiscordStatus>
  },

  getLogs(): Promise<DesktopDiscordLogEntry[]> {
    return tipcClient.discordGetLogs() as Promise<DesktopDiscordLogEntry[]>
  },

  connect(): Promise<DesktopDiscordActionResult> {
    return tipcClient.discordConnect() as Promise<DesktopDiscordActionResult>
  },

  disconnect(): Promise<DesktopDiscordActionResult> {
    return tipcClient.discordDisconnect() as Promise<DesktopDiscordActionResult>
  },

  clearLogs(): Promise<DesktopDiscordActionResult> {
    return tipcClient.discordClearLogs() as Promise<DesktopDiscordActionResult>
  },
}
