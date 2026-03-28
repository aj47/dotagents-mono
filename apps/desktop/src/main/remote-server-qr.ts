import QRCode from "qrcode"
import type { Config } from "../shared/types"
import { diagnosticsService } from "./diagnostics"

const DEFAULT_REMOTE_SERVER_BIND_ADDRESS = "127.0.0.1"
const DEFAULT_REMOTE_SERVER_PORT = 3210

type RemoteServerQrConfig = Pick<
  Config,
  | "remoteServerApiKey"
  | "remoteServerBindAddress"
  | "remoteServerPort"
  | "remoteServerTerminalQrEnabled"
  | "streamerModeEnabled"
>

export type SharedRemoteServerQrMode = "auto" | "manual"

export type SharedRemoteServerQrSkipReason =
  | "disabled"
  | "server-unavailable"
  | "missing-api-key"
  | "streamer-mode"
  | "unreachable-base-url"
  | "printer-failed"

export interface PrintSharedRemoteServerQrCodeOptions {
  mode: SharedRemoteServerQrMode
  config: RemoteServerQrConfig
  serverRunning: boolean
  urlOverride?: string
  isHeadlessEnvironment?: boolean
  resolveConnectableBaseUrl: (
    bind: string,
    port: number,
  ) => string | null | undefined
  printTerminalQrCode?: (url: string, apiKey: string) => Promise<boolean>
}

export interface PrintSharedRemoteServerQrCodeResult {
  printed: boolean
  serverUrl?: string
  skippedReason?: SharedRemoteServerQrSkipReason
}

/**
 * Detects if we're running in a headless/terminal environment.
 * This helps auto-print QR codes when no GUI is available.
 */
export function isHeadlessEnvironment(): boolean {
  if (process.platform === "linux") {
    const hasDisplay = process.env.DISPLAY || process.env.WAYLAND_DISPLAY
    if (!hasDisplay) {
      return true
    }
  }

  if (process.env.DOTAGENTS_TERMINAL_MODE === "1") {
    return true
  }

  return false
}

/**
 * Prints a QR code to the terminal for mobile app pairing.
 */
export async function printTerminalQRCode(
  url: string,
  apiKey: string,
): Promise<boolean> {
  const qrValue = `dotagents://config?baseUrl=${encodeURIComponent(url)}&apiKey=${encodeURIComponent(apiKey)}`

  try {
    const qrString = await QRCode.toString(qrValue, {
      type: "terminal",
      small: true,
      errorCorrectionLevel: "M",
    })

    console.log("\n" + "=".repeat(60))
    console.log("📱 Mobile App Connection QR Code")
    console.log("=".repeat(60))
    console.log(
      "\nScan this QR code with the DotAgents mobile app to connect:\n",
    )
    console.log(qrString)
    console.log("Server URL:", url)
    console.log("API Key:", redact(apiKey))
    console.log("\n" + "=".repeat(60) + "\n")

    diagnosticsService.logInfo(
      "remote-server",
      "Terminal QR code printed for mobile app pairing",
    )
    return true
  } catch (err) {
    console.error("[Remote Server] Failed to generate terminal QR code:", err)
    diagnosticsService.logError(
      "remote-server",
      "Failed to generate terminal QR code",
      err,
    )
    return false
  }
}

function redact(value?: string): string {
  if (!value) return ""
  if (value.length <= 8) return "***"
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function normalizeRemoteServerQrUrl(url: string): string {
  return url.endsWith("/v1") ? url : `${url}/v1`
}

function shouldAutoPrintRemoteServerQrCode(
  config: RemoteServerQrConfig,
  headless: boolean,
): boolean {
  return headless || !!config.remoteServerTerminalQrEnabled
}

function getConfiguredRemoteServerAddress(config: RemoteServerQrConfig): {
  bind: string
  port: number
} {
  return {
    bind: config.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
    port: config.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT,
  }
}

export async function printSharedRemoteServerQrCode(
  options: PrintSharedRemoteServerQrCodeOptions,
): Promise<PrintSharedRemoteServerQrCodeResult> {
  const {
    mode,
    config,
    serverRunning,
    urlOverride,
    isHeadlessEnvironment: headlessEnvironmentOverride,
    resolveConnectableBaseUrl,
    printTerminalQrCode = printTerminalQRCode,
  } = options

  if (mode === "manual" && !serverRunning) {
    return {
      printed: false,
      skippedReason: "server-unavailable",
    }
  }

  if (!config.remoteServerApiKey) {
    return {
      printed: false,
      skippedReason: "missing-api-key",
    }
  }

  if (config.streamerModeEnabled) {
    return {
      printed: false,
      skippedReason: "streamer-mode",
    }
  }

  const headless = headlessEnvironmentOverride ?? isHeadlessEnvironment()
  if (mode === "auto" && !shouldAutoPrintRemoteServerQrCode(config, headless)) {
    return {
      printed: false,
      skippedReason: "disabled",
    }
  }

  const { bind, port } = getConfiguredRemoteServerAddress(config)
  const serverUrl = urlOverride
    ? normalizeRemoteServerQrUrl(urlOverride)
    : resolveConnectableBaseUrl(bind, port)

  if (!serverUrl) {
    return {
      printed: false,
      skippedReason: "unreachable-base-url",
    }
  }

  const printed = await printTerminalQrCode(
    serverUrl,
    config.remoteServerApiKey,
  )
  return {
    printed,
    serverUrl,
    skippedReason: printed ? undefined : "printer-failed",
  }
}
