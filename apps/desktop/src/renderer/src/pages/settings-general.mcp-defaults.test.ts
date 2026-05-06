import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general MCP defaults", () => {
  it("uses shared MCP toggle defaults", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_MCP_MESSAGE_QUEUE_ENABLED")
    expect(source).toContain("DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL")
    expect(source).toContain("DEFAULT_MCP_VERIFY_COMPLETION_ENABLED")
    expect(source).toContain("DEFAULT_MCP_FINAL_SUMMARY_ENABLED")
    expect(source).toContain("DEFAULT_MCP_UNLIMITED_ITERATIONS")
  })
})
