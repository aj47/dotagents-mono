import { app } from "electron"
import {
  initializeSharedRuntimeServices,
  registerSharedMainProcessInfrastructure,
  shutdownSharedRuntimeServices,
} from "./app-runtime"
import { type CloudflareTunnelActivation } from "./cloudflare-runtime"
import { logApp } from "./debug"
import { startSharedRemoteAccessRuntime } from "./remote-access-runtime"
import { setHeadlessMode } from "./state"

const DEFAULT_HEADLESS_REMOTE_SERVER_BIND_ADDRESS = "0.0.0.0"
const DEFAULT_SHARED_HEADLESS_TERMINATION_SIGNALS = [
  "SIGTERM",
  "SIGINT",
] as const

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

export interface LaunchSharedHeadlessModeOptions extends SharedHeadlessRuntimeOptions {
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
    await shutdownSharedRuntimeServices({
      label,
      stopRemoteServer: true,
    })
    process.exit(exitCode)
  }

  await initializeSharedRuntimeServices({
    label,
    mcpStrategy: "await",
    acpStrategy: "await",
  })

  const { cloudflareTunnelUrl } = await startSharedRemoteAccessRuntime({
    label,
    remoteServerStrategy: "forced",
    remoteServerBindAddress,
    requireRemoteServer: true,
    cloudflareTunnelActivation,
    cloudflareConsoleLabel: cloudflareConsoleLabel ?? shutdownLabel,
  })

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
