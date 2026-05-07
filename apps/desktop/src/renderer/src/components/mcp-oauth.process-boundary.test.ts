import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function readComponent(relativePath: string): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, relativePath), "utf8")
}

describe("MCP OAuth renderer process boundary", () => {
  it("uses the renderer TIPC client instead of the legacy electronAPI bridge", () => {
    const managerSource = readComponent("mcp-config-manager.tsx")
    const oauthConfigSource = readComponent("OAuthServerConfig.tsx")
    const combinedSource = `${managerSource}\n${oauthConfigSource}`

    expect(combinedSource).toContain("tipcClient.initiateOAuthFlow(")
    expect(combinedSource).toContain("tipcClient.revokeOAuthTokens(")
    expect(combinedSource).toContain("tipcClient.getOAuthStatus(")
    expect(combinedSource).toContain("tipcClient.testMcpServerConnection({")
    expect(combinedSource).not.toContain("window.electronAPI")
  })
})
