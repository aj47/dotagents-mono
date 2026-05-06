import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general text input defaults", () => {
  it("uses shared text input defaults for controls and gates", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_TEXT_INPUT_ENABLED")
    expect(source).toContain("DEFAULT_TEXT_INPUT_SHORTCUT")
    expect(source).toContain("textInputEnabled = configQuery.data?.textInputEnabled ?? DEFAULT_TEXT_INPUT_ENABLED")
    expect(source).toContain("textInputShortcut || DEFAULT_TEXT_INPUT_SHORTCUT")
    expect(source).toContain("checked={textInputEnabled}")
    expect(source).toContain("disabled={!textInputEnabled}")
    expect(source).toContain("textInputEnabled &&")
  })
})
