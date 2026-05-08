import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-mcp-tools-client.ts", import.meta.url), "utf8")
const mcpToolManagerSource = readFileSync(
  new URL("../components/mcp-tool-manager.tsx", import.meta.url),
  "utf8",
)
const mcpConfigManagerSource = readFileSync(
  new URL("../components/mcp-config-manager.tsx", import.meta.url),
  "utf8",
)

describe("desktop MCP tools renderer client", () => {
  it("centralizes MCP tool list and toggle IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getMcpDetailedToolList({})")
    expect(clientSource).toContain("tipcClient.setMcpToolEnabled({")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps MCP tool UIs off direct tool IPC channels", () => {
    const combinedSource = [mcpToolManagerSource, mcpConfigManagerSource].join("\n")

    expect(mcpToolManagerSource).toContain("desktopMcpToolsClient.getDetailedToolList()")
    expect(mcpToolManagerSource).toContain("desktopMcpToolsClient.setToolEnabled(toolName, enabled)")
    expect(mcpToolManagerSource).toContain("desktopMcpToolsClient.setToolEnabled(tool.name, enable)")
    expect(mcpToolManagerSource).toContain("setMcpToolEnabledInList(prevTools, toolName, enabled)")
    expect(mcpToolManagerSource).toContain("setMcpSourceToolsEnabledInList(tools, sourceName, enable)")
    expect(mcpToolManagerSource).toContain("countEnabledMcpTools(toolsFromEnabledSources)")
    expect(mcpConfigManagerSource).toContain("desktopMcpToolsClient.getDetailedToolList()")
    expect(mcpConfigManagerSource).toContain("desktopMcpToolsClient.setToolEnabled(toolName, enabled)")
    expect(mcpConfigManagerSource).toContain("desktopMcpToolsClient.setToolEnabled(tool.name, enable)")
    expect(combinedSource).not.toContain("tipcClient.getMcpDetailedToolList(")
    expect(combinedSource).not.toContain("tipcClient.setMcpToolEnabled(")
  })
})
