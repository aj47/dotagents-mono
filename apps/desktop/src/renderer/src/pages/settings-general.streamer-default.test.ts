import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general streamer mode default", () => {
  it("uses the shared streamer mode default", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_STREAMER_MODE_ENABLED")
    expect(source).toContain("streamerModeEnabled ?? DEFAULT_STREAMER_MODE_ENABLED")
  })
})
