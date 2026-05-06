import {
  getOperatorTunnelAction,
  getOperatorTunnelSetupAction,
  startOperatorTunnelAction,
  stopOperatorTunnelAction,
  type OperatorTunnelActionOptions,
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

const tunnelActionOptions: OperatorTunnelActionOptions = {
  config: {
    get: () => configStore.get(),
  },
  diagnostics: diagnosticsService,
  service: {
    getStatus: getCloudflareTunnelStatus,
    checkCloudflaredInstalled,
    checkCloudflaredLoggedIn,
    listCloudflareTunnels,
    startQuickTunnel: startCloudflareTunnel,
    startNamedTunnel: startNamedCloudflareTunnel,
    stopTunnel: stopCloudflareTunnel,
  },
}

export function getOperatorTunnel(): OperatorTunnelActionResult {
  return getOperatorTunnelAction(tunnelActionOptions)
}

export async function getOperatorTunnelSetup(): Promise<OperatorTunnelActionResult> {
  return getOperatorTunnelSetupAction(tunnelActionOptions)
}

export async function startOperatorTunnel(remoteServerRunning: boolean): Promise<OperatorTunnelActionResult> {
  return startOperatorTunnelAction(remoteServerRunning, tunnelActionOptions)
}

export async function stopOperatorTunnel(): Promise<OperatorTunnelActionResult> {
  return stopOperatorTunnelAction(tunnelActionOptions)
}
