import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsWhatsappSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-whatsapp.tsx"), "utf8")
}

describe("settings WhatsApp defaults", () => {
  it("uses shared remote server and streamer mode defaults", () => {
    const source = getSettingsWhatsappSource()

    expect(source).toContain("DEFAULT_REMOTE_SERVER_ENABLED")
    expect(source).toContain("DEFAULT_STREAMER_MODE_ENABLED")
    expect(source).toContain("cfg.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED")
    expect(source).toContain("cfg.streamerModeEnabled ?? DEFAULT_STREAMER_MODE_ENABLED")
  })
})
