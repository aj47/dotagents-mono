import {
  buildOperatorActionAuditContext,
  buildOperatorRestartAppActionResponse,
  buildOperatorRestartRemoteServerActionResponse,
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"

export type OperatorRestartActionResult = OperatorRouteActionResult

function result(
  body: unknown,
  auditContext: OperatorActionAuditContext,
  options: Pick<OperatorRestartActionResult, "shouldRestartRemoteServer" | "shouldRestartApp">,
): OperatorRestartActionResult {
  return {
    statusCode: 200,
    body,
    auditContext,
    ...options,
  }
}

export function restartOperatorRemoteServer(isRunning: boolean): OperatorRestartActionResult {
  const response = buildOperatorRestartRemoteServerActionResponse(isRunning)
  return result(response, buildOperatorActionAuditContext(response), {
    shouldRestartRemoteServer: true,
  })
}

export function restartOperatorApp(appVersion: string): OperatorRestartActionResult {
  const response = buildOperatorRestartAppActionResponse(appVersion)
  return result(response, buildOperatorActionAuditContext(response), {
    shouldRestartApp: true,
  })
}
