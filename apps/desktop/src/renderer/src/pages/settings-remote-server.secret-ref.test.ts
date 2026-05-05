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
    expect(source).toContain("baseUrl && shouldShowPairingSurface")
    expect(source).toContain("copyTextToClipboard(remoteServerPairingApiKey)")
    expect(source).toContain("buildDotAgentsConfigDeepLink({ baseUrl, apiKey: remoteServerPairingApiKey })")
    expect(source).toContain("buildDotAgentsConfigDeepLink({ baseUrl: `${tunnelStatus.url}/v1`, apiKey: remoteServerPairingApiKey })")
    expect(source).not.toContain("copyTextToClipboard(cfg.remoteServerApiKey)")
    expect(source).not.toContain("apiKey=${encodeURIComponent(cfg.remoteServerApiKey")
  })
})
