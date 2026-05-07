import type {
  OperatorActionResponse,
  OperatorRemoteServerStatus,
  OperatorTunnelStatus,
} from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

export type DesktopCloudflareTunnelStatus = Omit<OperatorTunnelStatus, "error" | "url"> & {
  error: string | null
  url: string | null
}

export interface DesktopCloudflareTunnelListResult {
  success: boolean
  tunnels?: Array<{ id: string; name: string; created_at: string }>
  error?: string
}

export type DesktopCloudflareTunnelStartResult = Pick<OperatorActionResponse, "success" | "error"> & {
  url?: string
}

export interface DesktopNamedCloudflareTunnelStartRequest {
  tunnelId: string
  hostname: string
  credentialsPath?: string
}

export const desktopRemoteServerClient = {
  checkCloudflaredInstalled(): Promise<boolean> {
    return tipcClient.checkCloudflaredInstalled() as Promise<boolean>
  },

  checkCloudflaredLoggedIn(): Promise<boolean> {
    return tipcClient.checkCloudflaredLoggedIn() as Promise<boolean>
  },

  listCloudflareTunnels(): Promise<DesktopCloudflareTunnelListResult> {
    return tipcClient.listCloudflareTunnels() as Promise<DesktopCloudflareTunnelListResult>
  },

  getCloudflareTunnelStatus(): Promise<DesktopCloudflareTunnelStatus> {
    return tipcClient.getCloudflareTunnelStatus() as Promise<DesktopCloudflareTunnelStatus>
  },

  getRemoteServerStatus(): Promise<OperatorRemoteServerStatus> {
    return tipcClient.getRemoteServerStatus() as Promise<OperatorRemoteServerStatus>
  },

  getPairingApiKey(): Promise<string> {
    return tipcClient.getRemoteServerPairingApiKey() as Promise<string>
  },

  startCloudflareTunnel(): Promise<DesktopCloudflareTunnelStartResult> {
    return tipcClient.startCloudflareTunnel() as Promise<DesktopCloudflareTunnelStartResult>
  },

  startNamedCloudflareTunnel(
    params: DesktopNamedCloudflareTunnelStartRequest,
  ): Promise<DesktopCloudflareTunnelStartResult> {
    return tipcClient.startNamedCloudflareTunnel(params) as Promise<DesktopCloudflareTunnelStartResult>
  },

  stopCloudflareTunnel(): Promise<void> {
    return tipcClient.stopCloudflareTunnel() as Promise<void>
  },

  printQRCodeToTerminal(): Promise<boolean> {
    return tipcClient.printRemoteServerQRCode() as Promise<boolean>
  },
}
