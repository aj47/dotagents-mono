import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const capabilitiesSource = readFileSync(
  new URL("./settings-capabilities.tsx", import.meta.url),
  "utf8",
)
const agentsSource = readFileSync(
  new URL("./settings-agents.tsx", import.meta.url),
  "utf8",
)
const routerSource = readFileSync(
  new URL("../router.tsx", import.meta.url),
  "utf8",
)

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

function expectSourceToContain(source: string, fragment: string) {
  expect(compact(source)).toContain(compact(fragment))
}

describe("settings capabilities tab routing", () => {
  it("reads the active tab from the URL and persists MCP-server tab clicks back into search params", () => {
    expectSourceToContain(capabilitiesSource, 'const [searchParams, setSearchParams] = useSearchParams()')
    expectSourceToContain(capabilitiesSource, 'const activeTab = getCapabilitiesTab(searchParams.get("tab"))')
    expectSourceToContain(capabilitiesSource, 'nextParams.set("tab", tab)')
    expectSourceToContain(capabilitiesSource, 'nextParams.delete("tab")')
  })

  it("routes server-specific entry points and legacy MCP tools links to the MCP Servers tab", () => {
    expectSourceToContain(agentsSource, 'navigate("/settings/capabilities?tab=mcp-servers")')
    expectSourceToContain(routerSource, 'legacySettingsRedirect("/settings/capabilities?tab=mcp-servers")')
  })
})