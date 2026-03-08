import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./mcp-config-manager.tsx", import.meta.url), "utf8")

function getBlock(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)
  return source.slice(start, end)
}

describe("desktop MCP config manager per-server bulk tool toggles", () => {
  it("restores failed tools to their original enabled states instead of blindly flipping them", () => {
    const perServerBulkToggleBlock = getBlock(
      "const handleToggleAllToolsForServer = async (serverName: string, enable: boolean) => {",
      "const toggleToolsExpansion = (serverName: string) => {",
    )

    expect(perServerBulkToggleBlock).toContain("const originalStates = new Map<string, boolean>()")
    expect(perServerBulkToggleBlock).toContain("originalStates.set(tool.name, tool.enabled)")
    expect(perServerBulkToggleBlock).toContain("const revertedTools = updatedTools.map((tool) => {")
    expect(perServerBulkToggleBlock).toContain("enabled: originalStates.get(tool.name) ?? tool.enabled")
  })
})