import crypto from "crypto"
import {
  buildOperatorApiKeyRotationAuditContext,
  buildOperatorApiKeyRotationFailureAuditContext,
  buildOperatorApiKeyRotationResponse,
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type OperatorApiKeyActionResult = OperatorRouteActionResult

function result(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
  shouldRestartRemoteServer = false,
): OperatorApiKeyActionResult {
  return {
    statusCode,
    body,
    shouldRestartRemoteServer,
    ...(auditContext ? { auditContext } : {}),
  }
}

export function generateRemoteServerApiKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function rotateOperatorRemoteServerApiKey(): OperatorApiKeyActionResult {
  try {
    const cfg = configStore.get()
    const apiKey = generateRemoteServerApiKey()
    configStore.save({ ...cfg, remoteServerApiKey: apiKey })

    return result(
      200,
      buildOperatorApiKeyRotationResponse(apiKey),
      buildOperatorApiKeyRotationAuditContext(),
      true,
    )
  } catch (caughtError) {
    diagnosticsService.logError("operator-api-key-actions", "Failed to rotate remote server API key", caughtError)
    return result(
      500,
      { error: "Failed to rotate remote server API key" },
      buildOperatorApiKeyRotationFailureAuditContext(),
    )
  }
}
