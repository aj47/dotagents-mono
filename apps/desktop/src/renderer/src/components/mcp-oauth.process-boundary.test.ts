import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function readComponent(relativePath: string): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, relativePath), "utf8")
}

describe("MCP OAuth renderer process boundary", () => {
  it("centralizes OAuth IPC behind the desktop MCP OAuth client", () => {
    const clientSource = readComponent("../lib/desktop-mcp-oauth-client.ts")
    const managerSource = readComponent("mcp-config-manager.tsx")
    const oauthConfigSource = readComponent("OAuthServerConfig.tsx")
    const combinedSource = `${managerSource}\n${oauthConfigSource}`

    expect(clientSource).toContain("tipcClient.initiateOAuthFlow(serverName)")
    expect(clientSource).toContain("tipcClient.revokeOAuthTokens(serverName)")
    expect(clientSource).toContain("tipcClient.getOAuthStatus(serverName)")
    expect(combinedSource).toContain("desktopMcpOAuthClient.initiateFlow(")
    expect(combinedSource).toContain("desktopMcpOAuthClient.revokeTokens(")
    expect(combinedSource).toContain("desktopMcpOAuthClient.getStatus(")
    expect(combinedSource).not.toContain("tipcClient.initiateOAuthFlow(")
    expect(combinedSource).not.toContain("tipcClient.revokeOAuthTokens(")
    expect(combinedSource).not.toContain("tipcClient.getOAuthStatus(")
    expect(combinedSource).toContain("desktopMcpServerClient.testConnection(")
    expect(combinedSource).not.toContain("tipcClient.testMcpServerConnection(")
    expect(combinedSource).not.toContain("window.electronAPI")
  })
})
