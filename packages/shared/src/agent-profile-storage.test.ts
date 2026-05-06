import { describe, expect, it } from "vitest"

import {
  buildAgentProfilesDataFromLayers,
  mergeAgentProfileLayers,
  migrateAgentProfilesFromLegacySources,
} from "./agent-profile-storage"

describe("agent profile storage", () => {
  it("merges global and workspace layers by id with workspace overrides", () => {
    const globalProfiles = [
      { id: "global-only", name: "Global Only" },
      { id: "overridden", name: "Global Version" },
    ]
    const workspaceProfiles = [
      { id: "overridden", name: "Workspace Version" },
      { id: "workspace-only", name: "Workspace Only" },
    ]

    expect(mergeAgentProfileLayers(globalProfiles, workspaceProfiles)).toEqual([
      { id: "global-only", name: "Global Only" },
      { id: "overridden", name: "Workspace Version" },
      { id: "workspace-only", name: "Workspace Only" },
    ])
  })

  it("builds profiles data from layered files and preserves the current profile id", () => {
    expect(buildAgentProfilesDataFromLayers(
      [{ id: "global", name: "Global" }],
      [{ id: "workspace", name: "Workspace" }],
      "workspace",
    )).toEqual({
      profiles: [
        { id: "global", name: "Global" },
        { id: "workspace", name: "Workspace" },
      ],
      currentProfileId: "workspace",
    })
  })

  it("deduplicates legacy migration sources and marks the current legacy profile as default", () => {
    const result = migrateAgentProfilesFromLegacySources(
      {
        legacyProfilesData: {
          profiles: [
            { id: "legacy-profile", label: "Legacy Profile" },
            { id: "shared-id", label: "Legacy Shared" },
          ],
          currentProfileId: "legacy-profile",
        },
        legacyPersonasData: {
          personas: [
            { id: "shared-id", label: "Skipped Persona" },
            { id: "legacy-persona", label: "Legacy Persona" },
          ],
        },
        legacyAcpAgents: [
          { name: "legacy-persona", label: "Skipped ACP" },
          { name: "legacy-acp", label: "Legacy ACP" },
        ],
      },
      {
        profileToAgentProfile: (profile) => ({
          id: profile.id,
          kind: "profile",
          label: profile.label,
        }),
        personaToAgentProfile: (persona) => ({
          id: persona.id,
          kind: "persona",
          label: persona.label,
        }),
        acpAgentConfigToAgentProfile: (agent) => ({
          id: agent.name,
          kind: "acp",
          label: agent.label,
        }),
      },
    )

    expect(result).toEqual({
      profiles: [
        {
          id: "legacy-profile",
          kind: "profile",
          label: "Legacy Profile",
          isDefault: true,
        },
        {
          id: "shared-id",
          kind: "profile",
          label: "Legacy Shared",
        },
        {
          id: "legacy-persona",
          kind: "persona",
          label: "Legacy Persona",
        },
        {
          id: "legacy-acp",
          kind: "acp",
          label: "Legacy ACP",
        },
      ],
      counts: {
        legacyProfiles: 2,
        legacyPersonas: 2,
        legacyAcpAgents: 2,
      },
      duplicateIds: ["shared-id", "legacy-persona"],
    })
  })
})
