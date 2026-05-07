import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-mcp-tools-client.ts", import.meta.url), "utf8")
const mcpToolManagerSource = readFileSync(
  new URL("../components/mcp-tool-manager.tsx", import.meta.url),
  "utf8",
)

describe("desktop MCP tools renderer client", () => {
  it("centralizes MCP tool list and toggle IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getMcpDetailedToolList({})")
    expect(clientSource).toContain("tipcClient.setMcpToolEnabled({")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps MCP tool manager off direct tool IPC channels", () => {
    expect(mcpToolManagerSource).toContain("desktopMcpToolsClient.getDetailedToolList()")
    expect(mcpToolManagerSource).toContain("desktopMcpToolsClient.setToolEnabled(toolName, enabled)")
    expect(mcpToolManagerSource).toContain("desktopMcpToolsClient.setToolEnabled(tool.name, enable)")
    expect(mcpToolManagerSource).not.toContain("tipcClient.getMcpDetailedToolList(")
    expect(mcpToolManagerSource).not.toContain("tipcClient.setMcpToolEnabled(")
  })
})
