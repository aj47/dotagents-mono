import { configStore } from "./config"
import {
  checkCloudflaredInstalled,
  checkCloudflaredLoggedIn,
  getCloudflareTunnelStatus,
  listCloudflareTunnels,
  startCloudflareTunnel,
  startNamedCloudflareTunnel,
  stopCloudflareTunnel,
} from "./cloudflare-tunnel"
import { getRemoteServerStatus, printQRCodeToTerminal } from "./remote-server"

export function getManagedRemoteServerStatus() {
  return getRemoteServerStatus()
}

export async function printManagedRemoteServerQrCode(
  urlOverride?: string,
): Promise<boolean> {
  return printQRCodeToTerminal(urlOverride)
}

export async function checkManagedCloudflaredInstalled(): Promise<boolean> {
  return checkCloudflaredInstalled()
}

export async function checkManagedCloudflaredLoggedIn(): Promise<boolean> {
  return checkCloudflaredLoggedIn()
}

export function getManagedCloudflareTunnelStatus() {
  return getCloudflareTunnelStatus()
}

export async function listManagedCloudflareTunnels() {
  return listCloudflareTunnels()
}

export async function startManagedCloudflareQuickTunnel() {
  return startCloudflareTunnel()
}

export async function startManagedCloudflareNamedTunnel(options: {
  tunnelId: string
  hostname: string
  credentialsPath?: string
}) {
  return startNamedCloudflareTunnel(options)
}

export async function startManagedConfiguredCloudflareTunnel() {
  const config = configStore.get()
  if (config.cloudflareTunnelMode === "named") {
    if (!config.cloudflareTunnelId || !config.cloudflareTunnelHostname) {
      return {
        success: false,
        error:
          "Named Cloudflare tunnel requires both cloudflareTunnelId and cloudflareTunnelHostname in settings.",
      }
    }

    return startManagedCloudflareNamedTunnel({
      tunnelId: config.cloudflareTunnelId,
      hostname: config.cloudflareTunnelHostname,
      credentialsPath: config.cloudflareTunnelCredentialsPath || undefined,
    })
  }

  return startManagedCloudflareQuickTunnel()
}

export async function stopManagedCloudflareTunnel(): Promise<void> {
  await stopCloudflareTunnel()
}
