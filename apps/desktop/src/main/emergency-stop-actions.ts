import {
  triggerEmergencyStopAction,
  type EmergencyStopActionOptions,
} from "@dotagents/shared/settings-api-client"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { emergencyStopAll } from "./emergency-stop"

export type EmergencyStopActionResult = MobileApiActionResult

const emergencyStopActionOptions: EmergencyStopActionOptions = {
  stopAll: emergencyStopAll,
  diagnostics: diagnosticsService,
  logger: console,
}

export async function triggerEmergencyStop(): Promise<EmergencyStopActionResult> {
  return triggerEmergencyStopAction(emergencyStopActionOptions)
}
