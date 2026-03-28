import { app } from "electron"
import { acpService } from "./acp-service"
import {
  initializeSharedRuntimeServices,
  registerSharedMainProcessInfrastructure,
} from "./app-runtime"
import {
  type CloudflareTunnelActivation,
  startConfiguredCloudflareTunnel,
} from "./cloudflare-runtime"
import { logApp } from "./debug"
import { loopService } from "./loop-service"
import { mcpService } from "./mcp-service"
import { startRemoteServerForced, stopRemoteServer } from "./remote-server"
import { setHeadlessMode } from "./state"

const DEFAULT_HEADLESS_REMOTE_SERVER_BIND_ADDRESS = "0.0.0.0"
const DEFAULT_SHARED_HEADLESS_TERMINATION_SIGNALS = ["SIGTERM", "SIGINT"] as const

export interface SharedHeadlessRuntimeOptions {
  label: string
  shutdownLabel: string
  remoteServerBindAddress?: string
  cloudflareTunnelActivation?: CloudflareTunnelActivation
  cloudflareConsoleLabel?: string
}

export interface SharedHeadlessRuntimeHandle {
  gracefulShutdown: (exitCode: number) => Promise<void>
  cloudflareTunnelUrl?: string
}

export type SharedHeadlessTerminationSignal =
  (typeof DEFAULT_SHARED_HEADLESS_TERMINATION_SIGNALS)[number]

export interface LaunchSharedHeadlessModeOptions
  extends SharedHeadlessRuntimeOptions {
  onStarted?: (runtime: SharedHeadlessRuntimeHandle) => Promise<void>
  terminationSignals?: readonly SharedHeadlessTerminationSignal[]
}

export function registerSharedHeadlessTerminationHandlers(
  gracefulShutdown: (exitCode: number) => Promise<void>,
  signals: readonly SharedHeadlessTerminationSignal[] = DEFAULT_SHARED_HEADLESS_TERMINATION_SIGNALS,
): void {
  for (const signal of signals) {
    process.on(signal, () => {
      void gracefulShutdown(0)
    })
  }
}

export async function startSharedHeadlessRuntime(
  options: SharedHeadlessRuntimeOptions,
): Promise<SharedHeadlessRuntimeHandle> {
  const {
    label,
    shutdownLabel,
    remoteServerBindAddress = DEFAULT_HEADLESS_REMOTE_SERVER_BIND_ADDRESS,
    cloudflareTunnelActivation = "disabled",
    cloudflareConsoleLabel,
  } = options

  setHeadlessMode(true)

  if (process.platform === "darwin" && app.dock) {
    app.dock.hide()
  }

  registerSharedMainProcessInfrastructure()
  logApp(`Shared main-process infrastructure registered (${label})`)

  let isShuttingDown = false
  const gracefulShutdown = async (exitCode: number) => {
    if (isShuttingDown) return
    isShuttingDown = true
    console.log(`\n[${shutdownLabel}] Shutting down...`)
    loopService.stopAllLoops()
    await acpService.shutdown().catch(() => {})
    await mcpService.cleanup().catch(() => {})
    await stopRemoteServer().catch(() => {})
    process.exit(exitCode)
  }

  await initializeSharedRuntimeServices({
    label,
    mcpStrategy: "await",
    acpStrategy: "await",
  })

  const serverResult = await startRemoteServerForced({
    bindAddressOverride: remoteServerBindAddress,
  })
  if (!serverResult.running) {
    throw new Error(serverResult.error || "Unknown error")
  }

  logApp(`Remote server started on ${remoteServerBindAddress} (${label})`)

  let cloudflareTunnelUrl: string | undefined
  if (cloudflareTunnelActivation !== "disabled") {
    const tunnelResult = await startConfiguredCloudflareTunnel({
      activation: cloudflareTunnelActivation,
      logLabel: label,
      consoleLabel: cloudflareConsoleLabel ?? shutdownLabel,
    })
    cloudflareTunnelUrl = tunnelResult.url
  }

  return { gracefulShutdown, cloudflareTunnelUrl }
}

export async function launchSharedHeadlessMode(
  options: LaunchSharedHeadlessModeOptions,
): Promise<void> {
  const {
    shutdownLabel,
    onStarted,
    terminationSignals = DEFAULT_SHARED_HEADLESS_TERMINATION_SIGNALS,
    ...runtimeOptions
  } = options

  let runtimeHandle: SharedHeadlessRuntimeHandle | undefined

  try {
    runtimeHandle = await startSharedHeadlessRuntime({
      shutdownLabel,
      ...runtimeOptions,
    })
    registerSharedHeadlessTerminationHandlers(
      runtimeHandle.gracefulShutdown,
      terminationSignals,
    )

    if (onStarted) {
      await onStarted(runtimeHandle)
    }
  } catch (error) {
    console.error(
      `[${shutdownLabel}] Failed to initialize:`,
      error instanceof Error ? error.message : String(error),
    )

    if (runtimeHandle) {
      await runtimeHandle.gracefulShutdown(1)
      return
    }

    process.exit(1)
  }
}
