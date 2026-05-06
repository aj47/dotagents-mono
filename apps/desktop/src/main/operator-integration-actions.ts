import {
  clearOperatorDiscordLogsAction,
  connectOperatorDiscordAction,
  connectOperatorWhatsAppAction,
  disconnectOperatorDiscordAction,
  getOperatorDiscordAction,
  getOperatorDiscordLogsAction,
  getOperatorIntegrationsAction,
  getOperatorWhatsAppAction,
  logoutOperatorWhatsAppAction,
  type OperatorIntegrationActionOptions,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import { getErrorMessage } from "@dotagents/shared/error-utils"
import { mcpService, WHATSAPP_SERVER_NAME } from "./mcp-service"
import {
  buildOperatorIntegrationsSummary,
  getOperatorWhatsAppIntegrationSummary,
} from "./operator-integration-summary"

export type OperatorIntegrationActionResult = OperatorRouteActionResult

const integrationActionOptions: OperatorIntegrationActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    getIntegrationsSummary: buildOperatorIntegrationsSummary,
    getDiscordStatus: () => discordService.getStatus(),
    getDiscordLogs: () => discordService.getLogs(),
    startDiscord: () => discordService.start(),
    stopDiscord: () => discordService.stop(),
    clearDiscordLogs: () => discordService.clearLogs(),
    getWhatsAppSummary: getOperatorWhatsAppIntegrationSummary,
    isWhatsAppServerConnected: () => !!mcpService.getServerStatus()[WHATSAPP_SERVER_NAME]?.connected,
    executeWhatsAppTool: (toolName) => mcpService.executeToolCall(
      { name: toolName, arguments: {} },
      undefined,
      true,
    ),
  },
}

export async function getOperatorIntegrations(): Promise<OperatorIntegrationActionResult> {
  return getOperatorIntegrationsAction(integrationActionOptions)
}

export function getOperatorDiscord(): OperatorIntegrationActionResult {
  return getOperatorDiscordAction(integrationActionOptions)
}

export function getOperatorDiscordLogs(count: string | number | undefined): OperatorIntegrationActionResult {
  return getOperatorDiscordLogsAction(count, integrationActionOptions)
}

export async function connectOperatorDiscord(): Promise<OperatorIntegrationActionResult> {
  return connectOperatorDiscordAction(integrationActionOptions)
}

export async function disconnectOperatorDiscord(): Promise<OperatorIntegrationActionResult> {
  return disconnectOperatorDiscordAction(integrationActionOptions)
}

export function clearOperatorDiscordLogs(): OperatorIntegrationActionResult {
  return clearOperatorDiscordLogsAction(integrationActionOptions)
}

export async function getOperatorWhatsApp(): Promise<OperatorIntegrationActionResult> {
  return getOperatorWhatsAppAction(integrationActionOptions)
}

export async function connectOperatorWhatsApp(): Promise<OperatorIntegrationActionResult> {
  return connectOperatorWhatsAppAction(integrationActionOptions)
}

export async function logoutOperatorWhatsApp(): Promise<OperatorIntegrationActionResult> {
  return logoutOperatorWhatsAppAction(integrationActionOptions)
}
