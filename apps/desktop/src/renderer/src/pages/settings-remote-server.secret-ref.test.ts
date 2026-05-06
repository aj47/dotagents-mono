import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getRemoteServerSettingsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-remote-server.tsx"), "utf8")
}

describe("remote server settings secret references", () => {
  it("uses shared remote server option values", () => {
    const source = getRemoteServerSettingsSource()

    expect(source).toContain("REMOTE_SERVER_BIND_ADDRESS_OPTIONS")
    expect(source).toContain("REMOTE_SERVER_LOG_LEVEL_OPTIONS")
    expect(source).toContain("CLOUDFLARE_TUNNEL_MODE_OPTIONS")
    expect(source).toContain("DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_BIND_ADDRESS")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_ENABLED")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_CORS_ORIGINS")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_PORT")
    expect(source).toContain("REMOTE_SERVER_PORT_MIN")
    expect(source).toContain("REMOTE_SERVER_PORT_MAX")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_LOG_LEVEL")
    expect(source).toContain("DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED")
    expect(source).toContain("DEFAULT_CLOUDFLARE_TUNNEL_MODE")
  })

  it("uses the explicit pairing API key endpoint for copy and QR payloads", () => {
    const source = getRemoteServerSettingsSource()

    expect(source).toContain("tipcClient.getRemoteServerPairingApiKey()")
    expect(source).toContain('value={cfg.remoteServerApiKey ? "••••••••" : ""}')
    expect(source).toContain('const shouldShowPairingSurface = streamerMode ? hasConfiguredRemoteServerApiKey : hasRemoteServerApiKey')
    expect(source).toContain("baseUrl && shouldShowPairingSurface")
    expect(source).toContain("copyTextToClipboard(remoteServerPairingApiKey)")
    expect(source).toContain("buildDotAgentsConfigDeepLink({ baseUrl, apiKey: remoteServerPairingApiKey })")
    expect(source).toContain("buildDotAgentsConfigDeepLink({ baseUrl: `${tunnelStatus.url}/v1`, apiKey: remoteServerPairingApiKey })")
    expect(source).not.toContain("copyTextToClipboard(cfg.remoteServerApiKey)")
    expect(source).not.toContain("apiKey=${encodeURIComponent(cfg.remoteServerApiKey")
  })
})
