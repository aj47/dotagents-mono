import {
  buildEmergencyStopErrorResponse,
  buildEmergencyStopResponse,
} from "@dotagents/shared/settings-api-client"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { emergencyStopAll } from "./emergency-stop"

export type EmergencyStopActionResult = MobileApiActionResult

function ok(body: unknown): EmergencyStopActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, body: unknown): EmergencyStopActionResult {
  return {
    statusCode,
    body,
  }
}

export async function triggerEmergencyStop(): Promise<EmergencyStopActionResult> {
  console.log("[KILLSWITCH] /v1/emergency-stop endpoint called")
  try {
    console.log("[KILLSWITCH] Loading emergency-stop module...")
    diagnosticsService.logInfo("remote-server", "Emergency stop triggered via API")

    console.log("[KILLSWITCH] Calling emergencyStopAll()...")
    const { before, after } = await emergencyStopAll()

    console.log(`[KILLSWITCH] Emergency stop completed. Killed ${before} processes. Remaining: ${after}`)
    diagnosticsService.logInfo(
      "remote-server",
      `Emergency stop completed. Killed ${before} processes. Remaining: ${after}`,
    )

    return ok(buildEmergencyStopResponse(before, after))
  } catch (caughtError) {
    console.error("[KILLSWITCH] Error during emergency stop:", caughtError)
    diagnosticsService.logError("remote-server", "Emergency stop error", caughtError)
    return error(500, buildEmergencyStopErrorResponse(caughtError))
  }
}
