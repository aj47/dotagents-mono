import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./mcp-config-manager.tsx", import.meta.url), "utf8")

function compact(value: string) {
  return value.replace(/\s+/g, "")
}

describe("desktop MCP config manager server diagnostics", () => {
  it("keeps loading and fetch failures distinct from a truly empty log buffer", () => {
    const compactSource = compact(source)

    expect(compactSource).toContain(
      compact("const [serverLogStatus, setServerLogStatus] = useState<Record<string, { isLoading: boolean; error: string | null }>>({})"),
    )
    expect(compactSource).toContain(compact("[serverName]: { isLoading: true, error: null }"))
    expect(compactSource).toContain(compact("[serverName]: { isLoading: false, error: details }"))
    expect(compactSource).toContain(compact("logStatus?.isLoading && logEntries.length === 0 ? ("))
    expect(source).toContain("Loading logs...")
    expect(source).toContain("Couldn't load logs.")
    expect(source).toContain("No logs available")
  })

  it("preserves the last successful logs when a later refresh fails", () => {
    expect(source).toContain("Couldn't refresh logs.")
    expect(source).toContain("Showing the last successful log snapshot.")
  })

  it("keeps OAuth auth controls resilient when one status refresh fails", () => {
    expect(source).toContain("function getOAuthStatusFallback(serverConfig?: MCPServerConfig): OAuthStatusSummary")
    expect(source).toContain("configured: fallback.configured || status.configured")
    expect(source).toContain("return [name, normalizeOAuthStatus(config, status)] as const")
    expect(source).toContain("Failed to load OAuth status for ${name}:")
    expect(source).toContain("const oauthState = serverConfig ? oauthStatus[name] ?? getOAuthStatusFallback(serverConfig) : undefined")
    expect(source).toContain("await refreshOAuthStatus(name)")
  })
})