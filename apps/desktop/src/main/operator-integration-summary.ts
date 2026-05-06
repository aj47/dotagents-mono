import type {
  OperatorIntegrationsSummary,
  OperatorWhatsAppIntegrationSummary,
} from "@dotagents/shared/api-types"
import {
  buildOperatorDiscordIntegrationSummary,
  buildOperatorPushNotificationsSummary,
  buildOperatorWhatsAppIntegrationSummary,
  getOperatorMcpToolResultText,
  mergeOperatorWhatsAppStatusPayload,
} from "@dotagents/shared/operator-actions"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import { getErrorMessage } from "./error-utils"
import { mcpService, WHATSAPP_SERVER_NAME } from "./mcp-service"

export async function getOperatorWhatsAppIntegrationSummary(): Promise<OperatorWhatsAppIntegrationSummary> {
  const cfg = configStore.get()
  const serverStatus = mcpService.getServerStatus()[WHATSAPP_SERVER_NAME]
  const summary = buildOperatorWhatsAppIntegrationSummary({
    enabled: !!cfg.whatsappEnabled,
    serverConfigured: !!cfg.mcpConfig?.mcpServers?.[WHATSAPP_SERVER_NAME],
    serverConnected: !!serverStatus?.connected,
    autoReplyEnabled: !!cfg.whatsappAutoReply,
    logMessagesEnabled: !!cfg.whatsappLogMessages,
    allowedSenderCount: cfg.whatsappAllowFrom?.length ?? 0,
    lastError: serverStatus?.error,
    logs: mcpService.getServerLogs(WHATSAPP_SERVER_NAME),
  })

  if (!serverStatus?.connected) {
    return summary
  }

  try {
    const statusResult = await mcpService.executeToolCall(
      { name: "whatsapp_get_status", arguments: {} },
      undefined,
      true,
    )

    if (statusResult.isError) {
      const lastError = getOperatorMcpToolResultText(statusResult)

      return {
        ...summary,
        ...(lastError ? { lastError } : {}),
      }
    }

    const textPayload = getOperatorMcpToolResultText(statusResult)
    if (!textPayload) {
      return summary
    }

    return mergeOperatorWhatsAppStatusPayload(summary, textPayload)
  } catch (caughtError) {
    diagnosticsService.logWarning(
      "operator-integration-summary",
      `Failed to summarize WhatsApp integration status: ${getErrorMessage(caughtError)}`,
    )

    return {
      ...summary,
      lastError: getErrorMessage(caughtError),
    }
  }
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
