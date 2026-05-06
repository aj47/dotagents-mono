import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general observability defaults", () => {
  it("uses shared observability defaults", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_LOCAL_TRACE_LOGGING_ENABLED")
    expect(source).toContain("DEFAULT_LANGFUSE_ENABLED")
  })
})
