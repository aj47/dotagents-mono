import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const acpxServiceSource = readFileSync(new URL("./acpx-service.ts", import.meta.url), "utf8")

describe("acpx service shared profile queries", () => {
  it("uses shared ACPx profile filtering", () => {
    expect(acpxServiceSource).toContain("getAcpxAgentProfiles")
    expect(acpxServiceSource).toContain("getAcpxAgentProfiles(agentProfileService.getExternalAgents())")
    expect(acpxServiceSource).not.toContain("profile => profile.connection.type === 'acpx'")
  })
})
