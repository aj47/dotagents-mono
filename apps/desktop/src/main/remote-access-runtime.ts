import type { Config } from "../shared/types"
import {
  getCloudflareTunnelStatus,
  stopCloudflareTunnel,
} from "./cloudflare-tunnel"
import {
  type CloudflareTunnelActivation,
  startConfiguredCloudflareTunnel,
} from "./cloudflare-runtime"
import { logApp } from "./debug"
import {
  getRemoteServerStatus,
  restartRemoteServer,
  startRemoteServer,
  startRemoteServerForced,
  stopRemoteServer,
} from "./remote-server"

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

type ConfiguredRemoteAccessConfig = Pick<
  Config,
  | "remoteServerEnabled"
  | "remoteServerPort"
  | "remoteServerBindAddress"
  | "remoteServerApiKey"
  | "remoteServerLogLevel"
  | "remoteServerCorsOrigins"
  | "cloudflareTunnelAutoStart"
  | "cloudflareTunnelMode"
  | "cloudflareTunnelId"
  | "cloudflareTunnelHostname"
  | "cloudflareTunnelCredentialsPath"
>

export interface SyncConfiguredRemoteAccessOptions {
  label: string
  nextConfig: ConfiguredRemoteAccessConfig
  previousConfig?: ConfiguredRemoteAccessConfig | null
  cloudflareConsoleLabel?: string
}

interface RemoteServerStartupResult {
  running: boolean
  bind?: string
  port?: number
  error?: string
}

function areStringArraysEqual(
  previousValue?: readonly string[],
  nextValue?: readonly string[],
): boolean {
  const previous = previousValue ?? []
  const next = nextValue ?? []

  if (previous.length !== next.length) {
    return false
  }

  return previous.every((value, index) => value === next[index])
}

function didRemoteServerConfigChange(
  previousConfig: ConfiguredRemoteAccessConfig,
  nextConfig: ConfiguredRemoteAccessConfig,
): boolean {
  return previousConfig.remoteServerPort !== nextConfig.remoteServerPort
    || previousConfig.remoteServerBindAddress !== nextConfig.remoteServerBindAddress
    || previousConfig.remoteServerApiKey !== nextConfig.remoteServerApiKey
    || previousConfig.remoteServerLogLevel !== nextConfig.remoteServerLogLevel
    || !areStringArraysEqual(
      previousConfig.remoteServerCorsOrigins,
      nextConfig.remoteServerCorsOrigins,
    )
}

function didCloudflareConfigChange(
  previousConfig: ConfiguredRemoteAccessConfig,
  nextConfig: ConfiguredRemoteAccessConfig,
): boolean {
  return previousConfig.cloudflareTunnelAutoStart !== nextConfig.cloudflareTunnelAutoStart
    || previousConfig.cloudflareTunnelMode !== nextConfig.cloudflareTunnelMode
    || previousConfig.cloudflareTunnelId !== nextConfig.cloudflareTunnelId
    || previousConfig.cloudflareTunnelHostname !== nextConfig.cloudflareTunnelHostname
    || previousConfig.cloudflareTunnelCredentialsPath
      !== nextConfig.cloudflareTunnelCredentialsPath
}

async function stopConfiguredCloudflareTunnelIfRunning(): Promise<void> {
  const tunnelStatus = getCloudflareTunnelStatus()
  if (tunnelStatus.running || tunnelStatus.starting) {
    await stopCloudflareTunnel()
  }
}

async function reconcileConfiguredCloudflareTunnel(
  options: Pick<
    SyncConfiguredRemoteAccessOptions,
    "label" | "cloudflareConsoleLabel" | "nextConfig"
  > & {
    remoteServerRunning: boolean
    shouldRestartTunnel: boolean
  },
): Promise<void> {
  const {
    label,
    cloudflareConsoleLabel,
    nextConfig,
    remoteServerRunning,
    shouldRestartTunnel,
  } = options

  if (!remoteServerRunning || !nextConfig.cloudflareTunnelAutoStart) {
    await stopConfiguredCloudflareTunnelIfRunning()
    return
  }

  const tunnelStatus = getCloudflareTunnelStatus()
  if (shouldRestartTunnel && (tunnelStatus.running || tunnelStatus.starting)) {
    await stopCloudflareTunnel()
  }

  if (shouldRestartTunnel || (!tunnelStatus.running && !tunnelStatus.starting)) {
    const tunnelResult = await startConfiguredCloudflareTunnel({
      activation: "auto",
      logLabel: label,
      consoleLabel: cloudflareConsoleLabel,
    })

    if (!tunnelResult.started && tunnelResult.error) {
      logApp(
        `[${label}] Cloudflare tunnel reconciliation finished without an active tunnel: ${tunnelResult.error}`,
      )
    }
  }
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

export async function syncConfiguredRemoteAccess(
  options: SyncConfiguredRemoteAccessOptions,
): Promise<void> {
  const {
    label,
    nextConfig,
    previousConfig = null,
    cloudflareConsoleLabel,
  } = options

  const remoteServerEnabled = !!nextConfig.remoteServerEnabled
  if (!remoteServerEnabled) {
    await stopConfiguredCloudflareTunnelIfRunning()
    await stopRemoteServer()
    return
  }

  const remoteServerStatus = getRemoteServerStatus()
  if (!previousConfig?.remoteServerEnabled || !remoteServerStatus.running) {
    const runtimeResult = await startSharedRemoteAccessRuntime({
      label,
      remoteServerStrategy: "config",
      cloudflareTunnelActivation: "auto",
      cloudflareConsoleLabel,
    })

    if (!runtimeResult.remoteServerStarted) {
      await stopConfiguredCloudflareTunnelIfRunning()
    }
    return
  }

  let remoteServerRunning: boolean = remoteServerStatus.running
  if (didRemoteServerConfigChange(previousConfig, nextConfig)) {
    const restartResult = await restartRemoteServer()
    remoteServerRunning = restartResult.running

    if (!remoteServerRunning) {
      await stopConfiguredCloudflareTunnelIfRunning()
      if (restartResult.error) {
        logApp(
          `[${label}] Remote server restart failed during config reconciliation: ${restartResult.error}`,
        )
      }
      return
    }
  }

  await reconcileConfiguredCloudflareTunnel({
    label,
    nextConfig,
    cloudflareConsoleLabel,
    remoteServerRunning,
    shouldRestartTunnel:
      previousConfig.remoteServerPort !== nextConfig.remoteServerPort
      || didCloudflareConfigChange(previousConfig, nextConfig),
  })
}
