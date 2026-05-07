import type {
  OperatorIntegrationsSummary,
  OperatorWhatsAppIntegrationSummary,
} from "@dotagents/shared/api-types"
import {
  buildOperatorDiscordIntegrationSummary,
  buildOperatorPushNotificationsSummary,
  getOperatorWhatsAppIntegrationSummaryAction,
} from "@dotagents/shared/operator-actions"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import { getErrorMessage } from "@dotagents/shared/error-utils"
import { mcpService, WHATSAPP_SERVER_NAME } from "./mcp-service"

export async function getOperatorWhatsAppIntegrationSummary(): Promise<OperatorWhatsAppIntegrationSummary> {
  return getOperatorWhatsAppIntegrationSummaryAction({
    serverName: WHATSAPP_SERVER_NAME,
    diagnostics: {
      logWarning: (source, message) => diagnosticsService.logWarning(source, message),
      getErrorMessage,
    },
    service: {
      getConfig: () => configStore.get(),
      getServerStatus: () => mcpService.getServerStatus(),
      getServerLogs: (serverName) => mcpService.getServerLogs(serverName),
      executeStatusTool: () => mcpService.executeToolCall(
        { name: "whatsapp_get_status", arguments: {} },
        undefined,
        true,
      ),
    },
  })
}

export async function buildOperatorIntegrationsSummary(): Promise<OperatorIntegrationsSummary> {
  const cfg = configStore.get()
  const pushTokens = cfg.pushNotificationTokens ?? []

  return {
    discord: buildOperatorDiscordIntegrationSummary(
      discordService.getStatus(),
      discordService.getLogs(),
    ),
    whatsapp: await getOperatorWhatsAppIntegrationSummary(),
    pushNotifications: buildOperatorPushNotificationsSummary(pushTokens),
  }
}
