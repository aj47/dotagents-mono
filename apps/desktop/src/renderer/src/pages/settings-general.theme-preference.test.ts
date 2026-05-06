import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general theme preference", () => {
  it("uses shared theme preference options and default", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("THEME_PREFERENCE_VALUES")
    expect(source).toContain("DEFAULT_THEME_PREFERENCE")
    expect(source).toContain("type ThemePreferenceValue")
  })
})
