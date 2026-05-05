import {
  buildOperatorActionAuditContext,
  buildOperatorTunnelStartActionResponse,
  buildOperatorTunnelStartRemoteServerRequiredResponse,
  buildOperatorTunnelSetupSummary,
  buildOperatorTunnelStatus,
  buildOperatorTunnelStopActionResponse,
  getConfiguredCloudflareTunnelStartPlan,
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import {
  checkCloudflaredInstalled,
  checkCloudflaredLoggedIn,
  getCloudflareTunnelStatus,
  listCloudflareTunnels,
  startCloudflareTunnel,
  startNamedCloudflareTunnel,
  stopCloudflareTunnel,
} from "./cloudflare-tunnel"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type OperatorTunnelActionResult = OperatorRouteActionResult

function ok(body: unknown, auditContext?: OperatorActionAuditContext): OperatorTunnelActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function error(statusCode: number, message: string, auditContext?: OperatorActionAuditContext): OperatorTunnelActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  }
}

export function getOperatorTunnel(): OperatorTunnelActionResult {
  return ok(buildOperatorTunnelStatus(getCloudflareTunnelStatus()))
}

export async function getOperatorTunnelSetup(): Promise<OperatorTunnelActionResult> {
  try {
    const cfg = configStore.get()
    const installed = await checkCloudflaredInstalled()
    const loggedIn = installed ? await checkCloudflaredLoggedIn() : false

    let listResult: Awaited<ReturnType<typeof listCloudflareTunnels>> | undefined

    if (installed && loggedIn) {
      listResult = await listCloudflareTunnels()
    }

    return ok(buildOperatorTunnelSetupSummary({
      config: cfg,
      installed,
      loggedIn,
      listResult,
    }))
  } catch (caughtError) {
    diagnosticsService.logError("operator-tunnel-actions", "Failed to build tunnel setup summary", caughtError)
    return error(500, "Failed to build tunnel setup summary")
  }
}

async function startConfiguredCloudflareTunnel(): Promise<{
  success: boolean
  mode: "quick" | "named"
  url?: string
  error?: string
}> {
  const cfg = configStore.get()
  const startPlan = getConfiguredCloudflareTunnelStartPlan(cfg)

  if (startPlan.ok === false) {
    return {
      success: false,
      mode: startPlan.mode,
      error: startPlan.error,
    }
  }

  if (startPlan.mode === "named") {
    const result = await startNamedCloudflareTunnel({
      tunnelId: startPlan.tunnelId,
      hostname: startPlan.hostname,
      credentialsPath: startPlan.credentialsPath,
    })

    return {
      ...result,
      mode: startPlan.mode,
    }
  }

  const result = await startCloudflareTunnel()
  return {
    ...result,
    mode: startPlan.mode,
  }
}

export async function startOperatorTunnel(remoteServerRunning: boolean): Promise<OperatorTunnelActionResult> {
  try {
    if (!remoteServerRunning) {
      const response = buildOperatorTunnelStartRemoteServerRequiredResponse()
      return ok(response, {
        action: response.action,
        success: false,
        failureReason: "remote-server-not-running",
      })
    }

    const result = await startConfiguredCloudflareTunnel()
    const response = buildOperatorTunnelStartActionResponse(result)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    diagnosticsService.logError("operator-tunnel-actions", "Failed to start tunnel from operator route", caughtError)
    return error(500, "Failed to start tunnel", {
      action: "tunnel-start",
      success: false,
      failureReason: "tunnel-start-route-error",
    })
  }
}

export async function stopOperatorTunnel(): Promise<OperatorTunnelActionResult> {
  try {
    await stopCloudflareTunnel()
    const response = buildOperatorTunnelStopActionResponse()
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    diagnosticsService.logError("operator-tunnel-actions", "Failed to stop tunnel from operator route", caughtError)
    return error(500, "Failed to stop tunnel", {
      action: "tunnel-stop",
      success: false,
      failureReason: "tunnel-stop-route-error",
    })
  }
}
