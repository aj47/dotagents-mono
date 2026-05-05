import type {
  OperatorActionResponse,
} from "@dotagents/shared/api-types"
import {
  buildOperatorActionAuditContext,
  buildOperatorDiscordClearLogsActionResponse,
  buildOperatorDiscordConnectActionResponse,
  buildOperatorDiscordDisconnectActionResponse,
  buildOperatorDiscordIntegrationSummary,
  buildOperatorDiscordLogsResponse,
  buildOperatorWhatsAppActionErrorResponse,
  buildOperatorWhatsAppActionSuccessResponse,
  buildOperatorWhatsAppServerUnavailableActionResponse,
  getOperatorMcpToolResultText,
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import { getErrorMessage } from "./error-utils"
import { mcpService, WHATSAPP_SERVER_NAME } from "./mcp-service"
import {
  buildOperatorIntegrationsSummary,
  getOperatorWhatsAppIntegrationSummary,
} from "./operator-integration-summary"

export type OperatorIntegrationActionResult = OperatorRouteActionResult

function ok(body: unknown, auditContext?: OperatorActionAuditContext): OperatorIntegrationActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function error(statusCode: number, message: string, auditContext?: OperatorActionAuditContext): OperatorIntegrationActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  }
}

async function runOperatorWhatsAppAction(
  toolName: "whatsapp_connect" | "whatsapp_logout",
  action: string,
  successMessage: string,
): Promise<OperatorActionResponse> {
  try {
    const serverStatus = mcpService.getServerStatus()[WHATSAPP_SERVER_NAME]
    if (!serverStatus?.connected) {
      return buildOperatorWhatsAppServerUnavailableActionResponse(action)
    }

    const result = await mcpService.executeToolCall(
      { name: toolName, arguments: {} },
      undefined,
      true,
    )

    const text = getOperatorMcpToolResultText(result)
    if (result.isError) {
      const message = text || `${action} failed`
      return buildOperatorWhatsAppActionErrorResponse(action, message)
    }

    return buildOperatorWhatsAppActionSuccessResponse({ action, text, successMessage })
  } catch (caughtError) {
    return buildOperatorWhatsAppActionErrorResponse(action, getErrorMessage(caughtError))
  }
}

export async function getOperatorIntegrations(): Promise<OperatorIntegrationActionResult> {
  try {
    return ok(await buildOperatorIntegrationsSummary())
  } catch (caughtError) {
    diagnosticsService.logError("operator-integration-actions", "Failed to build operator integrations summary", caughtError)
    return error(500, "Failed to build operator integrations summary")
  }
}

export function getOperatorDiscord(): OperatorIntegrationActionResult {
  return ok(buildOperatorDiscordIntegrationSummary(
    discordService.getStatus(),
    discordService.getLogs(),
  ))
}

export function getOperatorDiscordLogs(count: string | number | undefined): OperatorIntegrationActionResult {
  return ok(buildOperatorDiscordLogsResponse(discordService.getLogs(), count))
}

export async function connectOperatorDiscord(): Promise<OperatorIntegrationActionResult> {
  const result = await discordService.start()
  const response = buildOperatorDiscordConnectActionResponse(result, discordService.getStatus())

  return ok(response, buildOperatorActionAuditContext(response))
}

export async function disconnectOperatorDiscord(): Promise<OperatorIntegrationActionResult> {
  const result = await discordService.stop()
  const response = buildOperatorDiscordDisconnectActionResponse(result)

  return ok(response, buildOperatorActionAuditContext(response))
}

export function clearOperatorDiscordLogs(): OperatorIntegrationActionResult {
  discordService.clearLogs()
  const response = buildOperatorDiscordClearLogsActionResponse()
  return ok(response, buildOperatorActionAuditContext(response))
}

export async function getOperatorWhatsApp(): Promise<OperatorIntegrationActionResult> {
  try {
    return ok(await getOperatorWhatsAppIntegrationSummary())
  } catch (caughtError) {
    diagnosticsService.logError("operator-integration-actions", "Failed to build WhatsApp operator summary", caughtError)
    return error(500, "Failed to build WhatsApp operator summary")
  }
}

export async function connectOperatorWhatsApp(): Promise<OperatorIntegrationActionResult> {
  const response = await runOperatorWhatsAppAction("whatsapp_connect", "whatsapp-connect", "WhatsApp connection initiated")
  return ok(response, buildOperatorActionAuditContext(response))
}

export async function logoutOperatorWhatsApp(): Promise<OperatorIntegrationActionResult> {
  const response = await runOperatorWhatsAppAction("whatsapp_logout", "whatsapp-logout", "WhatsApp logout completed")
  return ok(response, buildOperatorActionAuditContext(response))
}
