import {
  type CloudflareTunnelActivation,
  startConfiguredCloudflareTunnel,
} from "./cloudflare-runtime"
import { logApp } from "./debug"
import { startRemoteServer, startRemoteServerForced } from "./remote-server"

export type SharedRemoteServerStrategy = "config" | "forced"

export interface SharedRemoteAccessRuntimeOptions {
  label: string
  remoteServerStrategy: SharedRemoteServerStrategy
  remoteServerBindAddress?: string
  requireRemoteServer?: boolean
  cloudflareTunnelActivation?: CloudflareTunnelActivation
  cloudflareConsoleLabel?: string
}

export interface SharedRemoteAccessRuntimeResult {
  remoteServerStarted: boolean
  remoteServerBind?: string
  remoteServerPort?: number
  cloudflareTunnelStarted: boolean
  cloudflareTunnelUrl?: string
  error?: string
}

interface RemoteServerStartupResult {
  running: boolean
  bind?: string
  port?: number
  error?: string
}

async function startRemoteServerForRuntime(
  strategy: SharedRemoteServerStrategy,
  remoteServerBindAddress?: string,
): Promise<RemoteServerStartupResult> {
  if (strategy === "forced") {
    return startRemoteServerForced({
      bindAddressOverride: remoteServerBindAddress,
    })
  }

  return startRemoteServer()
}

export async function startSharedRemoteAccessRuntime(
  options: SharedRemoteAccessRuntimeOptions,
): Promise<SharedRemoteAccessRuntimeResult> {
  const {
    label,
    remoteServerStrategy,
    remoteServerBindAddress,
    requireRemoteServer = false,
    cloudflareTunnelActivation = "disabled",
    cloudflareConsoleLabel,
  } = options

  const remoteServerResult = await startRemoteServerForRuntime(
    remoteServerStrategy,
    remoteServerBindAddress,
  )

  if (!remoteServerResult.running) {
    const error = remoteServerResult.error
    if (requireRemoteServer) {
      throw new Error(error || "Unknown error")
    }

    if (error) {
      logApp(`[${label}] Remote server failed to start: ${error}`)
    }

    return {
      remoteServerStarted: false,
      cloudflareTunnelStarted: false,
      error,
    }
  }

  logApp(
    `[${label}] Remote server started on ${remoteServerResult.bind || "default bind"}`,
  )

  let cloudflareTunnelUrl: string | undefined
  let cloudflareTunnelStarted = false

  if (cloudflareTunnelActivation !== "disabled") {
    const tunnelResult = await startConfiguredCloudflareTunnel({
      activation: cloudflareTunnelActivation,
      logLabel: label,
      consoleLabel: cloudflareConsoleLabel,
    })
    cloudflareTunnelStarted = tunnelResult.started
    cloudflareTunnelUrl = tunnelResult.url
  }

  return {
    remoteServerStarted: true,
    remoteServerBind: remoteServerResult.bind,
    remoteServerPort: remoteServerResult.port,
    cloudflareTunnelStarted,
    cloudflareTunnelUrl,
  }
}
