import { app } from "electron"
import { configStore } from "./config"
import { DISCORD_SECRET_MASK } from "@dotagents/shared/discord-config"
import { diagnosticsService } from "./diagnostics"
import { notifyConversationHistoryChanged } from "./conversation-history-notifier"
import { runAgent } from "./agent-run-actions"
import {
  createRemoteServerController,
} from "./remote-server-controller"
import { remoteServerDesktopAdapters } from "./remote-server-desktop-adapters"
import { registerDesktopRemoteServerRoutes } from "./remote-server-route-bundle"
import {
  DEFAULT_REMOTE_SERVER_SECRET_MASK,
  isHeadlessRemoteServerEnvironment,
} from "@dotagents/shared/remote-pairing"

const REMOTE_SERVER_SECRET_MASK = DEFAULT_REMOTE_SERVER_SECRET_MASK
const PROVIDER_SECRET_MASK = "••••••••"

export { runAgent }

const remoteServerController = createRemoteServerController({
  configStore,
  diagnosticsService,
  registerRoutes: registerDesktopRemoteServerRoutes,
  adapters: remoteServerDesktopAdapters,
  providerSecretMask: PROVIDER_SECRET_MASK,
  remoteServerSecretMask: REMOTE_SERVER_SECRET_MASK,
  discordSecretMask: DISCORD_SECRET_MASK,
  langfuseSecretMask: PROVIDER_SECRET_MASK,
  getAppVersion: () => app.getVersion(),
  isHeadlessEnvironment: () =>
    isHeadlessRemoteServerEnvironment({
      platform: process.platform,
      env: process.env,
    }),
  relaunchApp: () => app.relaunch(),
  quitApp: () => app.quit(),
  runAgent,
  notifyConversationHistoryChanged,
})

/**
 * Starts the remote server, forcing it to be enabled regardless of config.
 * Used by --qr mode to ensure the server starts even if remoteServerEnabled is false.
 * Also skips the auto-print of QR codes since --qr mode handles that separately.
 */
export async function startRemoteServerForced(options: { bindAddressOverride?: string } = {}) {
  return remoteServerController.startRemoteServerForced(options)
}

export async function startRemoteServer() {
  return remoteServerController.startRemoteServer()
}

export async function stopRemoteServer() {
  return remoteServerController.stopRemoteServer()
}

export async function restartRemoteServer() {
  return remoteServerController.restartRemoteServer()
}

export function getRemoteServerStatus() {
  return remoteServerController.getRemoteServerStatus()
}

export function getRemoteServerPairingApiKey(): string {
  return remoteServerController.getRemoteServerPairingApiKey()
}

/**
 * Prints the QR code to the terminal for mobile app pairing.
 * Can be called manually when the user wants to see the QR code.
 */
export async function printQRCodeToTerminal(urlOverride?: string): Promise<boolean> {
  return remoteServerController.printQRCodeToTerminal(urlOverride)
}
