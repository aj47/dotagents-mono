import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("TIPC MCP auto-paste defaults", () => {
  it("uses shared MCP auto-paste defaults and preserves zero delay", () => {
    expect(tipcSource).toContain("DEFAULT_MCP_AUTO_PASTE_ENABLED")
    expect(tipcSource).toContain("DEFAULT_MCP_AUTO_PASTE_DELAY")
    expect(tipcSource).toContain("config.mcpAutoPasteEnabled ?? DEFAULT_MCP_AUTO_PASTE_ENABLED")
    expect(tipcSource).toContain("pasteConfig.mcpAutoPasteEnabled ?? DEFAULT_MCP_AUTO_PASTE_ENABLED")
    expect(tipcSource).toContain("config.mcpAutoPasteDelay ?? DEFAULT_MCP_AUTO_PASTE_DELAY")
    expect(tipcSource).toContain("pasteConfig.mcpAutoPasteDelay ?? DEFAULT_MCP_AUTO_PASTE_DELAY")
    expect(tipcSource).not.toContain("mcpAutoPasteDelay || 1000")
  })
})
