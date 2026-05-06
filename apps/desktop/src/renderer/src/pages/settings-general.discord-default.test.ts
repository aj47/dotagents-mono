import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general Discord default", () => {
  it("uses the shared Discord enabled default", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_DISCORD_ENABLED")
    expect(source).toContain("configQuery.data?.discordEnabled ?? DEFAULT_DISCORD_ENABLED")
  })
})
