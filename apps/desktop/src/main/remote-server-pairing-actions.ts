import fs from "fs"
import os from "os"
import path from "path"
import QRCode from "qrcode"
import {
  buildDotAgentsConfigDeepLink,
  formatConnectableRemoteHostWarning,
  hasConfiguredRemoteServerApiKey as hasConfiguredRemoteServerApiKeyFromConfig,
  redactSecretForDisplay,
  resolveConnectableRemoteServerPairingBaseUrl,
  resolveDotAgentsSecretReferenceFromStore,
  resolveRemoteServerApiKey,
} from "@dotagents/shared/remote-pairing"
import type { Config } from "../shared/types"
import { configStore, globalAgentsFolder } from "./config"
import { diagnosticsService } from "./diagnostics"

const DOTAGENTS_SECRETS_LOCAL_JSON = "secrets.local.json"

export async function printTerminalQRCode(url: string, apiKey: string): Promise<boolean> {
  const qrValue = buildDotAgentsConfigDeepLink({ baseUrl: url, apiKey })

  try {
    const qrString = await QRCode.toString(qrValue, {
      type: "terminal",
      small: true,
      errorCorrectionLevel: "M"
    })

    console.log("\n" + "=".repeat(60))
    console.log("📱 Mobile App Connection QR Code")
    console.log("=".repeat(60))
    console.log("\nScan this QR code with the DotAgents mobile app to connect:\n")
    console.log(qrString)
    console.log("Server URL:", url)
    console.log("API Key:", redactSecretForDisplay(apiKey))
    console.log("\n" + "=".repeat(60) + "\n")

    diagnosticsService.logInfo("remote-server", "Terminal QR code printed for mobile app pairing")
    return true
  } catch (caughtError) {
    console.error("[Remote Server] Failed to generate terminal QR code:", caughtError)
    diagnosticsService.logError("remote-server", "Failed to generate terminal QR code", caughtError)
    return false
  }
}

export function readDotAgentsSecretReference(value: string): string | undefined {
  return resolveDotAgentsSecretReferenceFromStore(value, () => {
    const secretsPath = path.join(globalAgentsFolder, DOTAGENTS_SECRETS_LOCAL_JSON)
    return JSON.parse(fs.readFileSync(secretsPath, "utf8"))
  })
}

export function getResolvedRemoteServerApiKey(cfg: Pick<Config, "remoteServerApiKey"> = configStore.get()): string {
  return resolveRemoteServerApiKey(cfg, readDotAgentsSecretReference)
}

export function hasConfiguredRemoteServerApiKey(cfg: Pick<Config, "remoteServerApiKey"> = configStore.get()): boolean {
  return hasConfiguredRemoteServerApiKeyFromConfig(cfg)
}

export function getRemoteNetworkAddresses() {
  return Object.values(os.networkInterfaces()).flatMap((addrs) => addrs ?? [])
}

interface PairingBaseUrlOptions {
  warn?: boolean
}

export function getConnectableBaseUrlForMobilePairing(
  bind: string,
  port: number,
  options: PairingBaseUrlOptions = {},
): string | undefined {
  const { warn = true } = options
  const resolution = resolveConnectableRemoteServerPairingBaseUrl(bind, port, getRemoteNetworkAddresses())

  if (warn && resolution.warning) {
    console.warn(formatConnectableRemoteHostWarning(resolution.warning))
  }

  return resolution.baseUrl
}
