import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general main agent mode", () => {
  it("uses shared main agent mode options and default", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("MAIN_AGENT_MODE_OPTIONS")
    expect(source).toContain("DEFAULT_MAIN_AGENT_MODE")
    expect(source).toContain("type MainAgentMode")
  })
})
