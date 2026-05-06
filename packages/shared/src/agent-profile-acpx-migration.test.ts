import { describe, expect, it } from "vitest"

import {
  migrateAgentProfilesForAcpxRuntime,
  migrateLegacyAcpRuntimeConfig,
  normalizeAgentProfileConnectionForAcpx,
} from "./agent-profile-acpx-migration"

describe("agent profile ACPX migration", () => {
  it("leaves internal and remote profile connections unchanged", () => {
    const internal = { name: "main", connection: { type: "internal" } }
    const remote = { name: "remote", connection: { type: "remote", baseUrl: "https://agent.example" } }

    expect(normalizeAgentProfileConnectionForAcpx(internal)).toEqual({
      profile: internal,
      changed: false,
    })
    expect(normalizeAgentProfileConnectionForAcpx(remote)).toEqual({
      profile: remote,
      changed: false,
    })
  })

  it("normalizes legacy local connections into acpx connections", () => {
    expect(normalizeAgentProfileConnectionForAcpx({
      name: "helper",
      connection: { type: "stdio", args: ["--acp"], env: { A: "B" }, cwd: "/repo" },
    })).toEqual({
      profile: {
        name: "helper",
        connection: {
          type: "acpx",
          agent: "helper",
          args: ["--acp"],
          env: { A: "B" },
          cwd: "/repo",
        },
      },
      changed: true,
    })

    expect(normalizeAgentProfileConnectionForAcpx({
      name: "helper",
      connection: { type: "acp", agent: "custom", command: "auggie" },
    }).profile.connection).toEqual({
      type: "acpx",
      agent: "custom",
      command: "auggie",
    })
  })

  it("normalizes existing profiles and selects non-remote legacy agents to add", () => {
    const result = migrateAgentProfilesForAcpxRuntime([
      { name: "main", connection: { type: "internal" } },
      { name: "legacy-local", connection: { type: "stdio", command: "node" } },
    ], [
      { name: "legacy-local", connection: { type: "stdio" } },
      { name: "new-local", connection: { type: "acp" } },
      { name: "remote-agent", connection: { type: "remote" } },
    ])

    expect(result.profiles).toEqual([
      { name: "main", connection: { type: "internal" } },
      { name: "legacy-local", connection: { type: "acpx", command: "node" } },
    ])
    expect(result.legacyAgentsToAdd).toEqual([{ name: "new-local", connection: { type: "acp" } }])
    expect(result.skippedRemoteAgentNames).toEqual(["remote-agent"])
    expect(result.normalizedProfileCount).toBe(1)
    expect(result.changed).toBe(true)
  })

  it("migrates deprecated ACP runtime config fields", () => {
    expect(migrateLegacyAcpRuntimeConfig({
      mainAgentMode: "acp",
      acpAgents: [{ name: "legacy" }],
      acpInjectRuntimeTools: true,
      keep: "value",
    })).toEqual({
      config: {
        mainAgentMode: "acpx",
        keep: "value",
      },
      changed: true,
    })

    expect(migrateLegacyAcpRuntimeConfig({
      mainAgentMode: "api",
      acpAgents: [],
    })).toEqual({
      config: {
        mainAgentMode: "api",
        acpAgents: [],
      },
      changed: false,
    })
  })
})
