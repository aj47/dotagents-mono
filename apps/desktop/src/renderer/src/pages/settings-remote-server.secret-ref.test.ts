import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getRemoteServerSettingsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-remote-server.tsx"), "utf8")
}

describe("remote server settings secret references", () => {
  it("uses the explicit pairing API key endpoint for copy and QR payloads", () => {
    const source = getRemoteServerSettingsSource()

    expect(source).toContain("tipcClient.getRemoteServerPairingApiKey()")
    expect(source).toContain('value={cfg.remoteServerApiKey ? "••••••••" : ""}')
    expect(source).toContain('const shouldShowPairingSurface = streamerMode ? hasConfiguredRemoteServerApiKey : hasRemoteServerApiKey')
    expect(source).toContain("localServerBaseUrl")
    expect(source).toContain("{shouldShowPairingSurface && (")
    expect(source).toContain("copyTextToClipboard(remoteServerPairingApiKey)")
    expect(source).toContain("encodeURIComponent(remoteServerPairingApiKey)")
    expect(source).not.toContain("copyTextToClipboard(cfg.remoteServerApiKey)")
    expect(source).not.toContain("apiKey=${encodeURIComponent(cfg.remoteServerApiKey")
  })

  it("renders an easy mobile pairing QR block that reuses the pairing deep link", () => {
    const source = getRemoteServerSettingsSource()

    expect(source).toContain('label="Easy Mobile Pairing"')
    expect(source).toContain('remoteServerStatus?.easyPairingUrl')
    expect(source).toContain('remoteServerStatus?.easyPairingSource === "tailscale"')
    expect(source).toContain('remoteServerStatus?.easyPairingSource === "lan"')
    expect(source).toContain("const easyPairingDeepLink")
    expect(source).toContain("dotagents://config?baseUrl=${encodeURIComponent(easyPairingBaseUrl)}&apiKey=${encodeURIComponent(remoteServerPairingApiKey)}")
    expect(source).toContain("value={easyPairingDeepLink}")
    expect(source).toContain("saveConfig({ remoteServerBindAddress: tailscaleStatus.ipv4 })")
    expect(source).toContain("tipcClient.printRemoteServerQRCode({ url: easyPairingBaseUrl })")
    expect(source).toContain("QR code and link hidden in Streamer Mode")
  })
})
