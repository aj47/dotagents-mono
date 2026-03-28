import { configStore } from "./config"
import {
  checkCloudflaredInstalled,
  startCloudflareTunnel,
  startNamedCloudflareTunnel,
} from "./cloudflare-tunnel"
import { logApp } from "./debug"

const CLOUDFLARED_INSTALL_URL =
  "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"

export type CloudflareTunnelActivation = "disabled" | "auto" | "force"

export interface StartConfiguredCloudflareTunnelOptions {
  activation: CloudflareTunnelActivation
  logLabel: string
  consoleLabel?: string
}

export interface StartConfiguredCloudflareTunnelResult {
  started: boolean
  url?: string
  error?: string
  reason?:
    | "disabled"
    | "not-installed"
    | "named-config-missing"
    | "named-start-failed"
    | "quick-start-failed"
}

function printConsole(consoleLabel: string | undefined, message: string): void {
  if (!consoleLabel) return
  console.log(`[${consoleLabel}] ${message}`)
}

function printConsoleError(
  consoleLabel: string | undefined,
  message: string,
): void {
  if (!consoleLabel) return
  console.error(`[${consoleLabel}] ${message}`)
}

export async function startConfiguredCloudflareTunnel(
  options: StartConfiguredCloudflareTunnelOptions,
): Promise<StartConfiguredCloudflareTunnelResult> {
  const { activation, logLabel, consoleLabel } = options
  const config = configStore.get()

  if (
    activation === "disabled" ||
    (activation === "auto" && !config.cloudflareTunnelAutoStart)
  ) {
    return { started: false, reason: "disabled" }
  }

  const cloudflaredInstalled = await checkCloudflaredInstalled()
  if (!cloudflaredInstalled) {
    if (activation === "force") {
      printConsole(
        consoleLabel,
        "cloudflared not installed - QR code will use local address",
      )
      printConsole(
        consoleLabel,
        `Install cloudflared for remote access: ${CLOUDFLARED_INSTALL_URL}`,
      )
    } else {
      printConsole(
        consoleLabel,
        "Cloudflare tunnel auto-start skipped: cloudflared not installed",
      )
    }
    logApp(
      `[${logLabel}] Cloudflare tunnel unavailable: cloudflared not installed`,
    )
    return { started: false, reason: "not-installed" }
  }

  const startQuickTunnel =
    async (): Promise<StartConfiguredCloudflareTunnelResult> => {
      printConsole(consoleLabel, "Starting Cloudflare quick tunnel...")
      const result = await startCloudflareTunnel()
      if (result.success && result.url) {
        printConsole(
          consoleLabel,
          `Cloudflare quick tunnel started: ${result.url}`,
        )
        logApp(`[${logLabel}] Quick tunnel started: ${result.url}`)
        return { started: true, url: result.url }
      }

      const error = result.error || "Unknown error"
      printConsoleError(consoleLabel, `Quick tunnel failed: ${error}`)
      if (activation === "force") {
        printConsole(consoleLabel, "QR code will use local address instead")
      }
      logApp(`[${logLabel}] Quick tunnel failed to start: ${error}`)
      return { started: false, reason: "quick-start-failed", error }
    }

  const tunnelMode = config.cloudflareTunnelMode || "quick"
  if (tunnelMode === "named") {
    if (!config.cloudflareTunnelId || !config.cloudflareTunnelHostname) {
      if (activation === "force") {
        printConsole(
          consoleLabel,
          "Named tunnel is incomplete; falling back to quick tunnel...",
        )
        return startQuickTunnel()
      }

      printConsole(
        consoleLabel,
        "Cloudflare tunnel auto-start skipped: named tunnel requires tunnel ID and hostname",
      )
      logApp(
        `[${logLabel}] Cloudflare tunnel auto-start skipped: named tunnel requires tunnel ID and hostname`,
      )
      return { started: false, reason: "named-config-missing" }
    }

    printConsole(consoleLabel, "Starting named Cloudflare tunnel...")
    const result = await startNamedCloudflareTunnel({
      tunnelId: config.cloudflareTunnelId,
      hostname: config.cloudflareTunnelHostname,
      credentialsPath: config.cloudflareTunnelCredentialsPath || undefined,
    })
    if (result.success && result.url) {
      printConsole(
        consoleLabel,
        `Cloudflare named tunnel started: ${result.url}`,
      )
      logApp(`[${logLabel}] Named tunnel started: ${result.url}`)
      return { started: true, url: result.url }
    }

    const error = result.error || "Unknown error"
    printConsoleError(consoleLabel, `Named tunnel failed: ${error}`)
    logApp(`[${logLabel}] Named tunnel failed to start: ${error}`)
    if (activation !== "force") {
      return { started: false, reason: "named-start-failed", error }
    }

    printConsole(consoleLabel, "Falling back to quick tunnel...")
    return startQuickTunnel()
  }

  return startQuickTunnel()
}
