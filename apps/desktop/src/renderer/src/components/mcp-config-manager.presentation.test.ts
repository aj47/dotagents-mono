import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./mcp-config-manager.tsx", import.meta.url), "utf8")

describe("desktop MCP config manager presentation", () => {
  it("uses shared MCP server editor presentation for visible editor copy", () => {
    expect(source).toContain("APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.description")
    expect(source).toContain("APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.tabs.manual")
    expect(source).toContain("APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.tabs.paste")
    expect(source).toContain("APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.fields.transport.helper")
    expect(source).toContain("APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.transports.streamableHttp")
    expect(source).toContain("APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.import.oauthExamplesTitle")
    expect(source).not.toContain("Add or configure an MCP server.")
    expect(source).not.toContain("Import from JSON file")
    expect(source).not.toContain("OAuth-Enabled MCP Servers")
  })

  it("uses shared MCP feedback presentation for action toasts", () => {
    expect(source).toContain("APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION")
    expect(source).toContain("formatAppShellMcpServerImportStatus")
    expect(source).toContain("formatAppShellMcpServerStartedStatus")
    expect(source).toContain("formatAppShellMcpToolToggleStatus")
    expect(source).toContain("formatAppShellMcpToolsPartialToggleStatus")
    expect(source).not.toContain("MCP configuration exported successfully")
    expect(source).not.toContain("No servers to import - all server names were reserved")
    expect(source).not.toContain("Connection test successful!")
  })
})
