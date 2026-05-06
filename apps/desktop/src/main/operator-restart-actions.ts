import {
  restartOperatorAppAction,
  restartOperatorRemoteServerAction,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"

export type OperatorRestartActionResult = OperatorRouteActionResult

export function restartOperatorRemoteServer(isRunning: boolean): OperatorRestartActionResult {
  return restartOperatorRemoteServerAction(isRunning)
}

export function restartOperatorApp(appVersion: string): OperatorRestartActionResult {
  return restartOperatorAppAction(appVersion)
}
