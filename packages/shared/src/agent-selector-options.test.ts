import { describe, expect, it } from "vitest"

import {
  buildSelectorProfiles,
  getDefaultAgentProfile,
  getDisplayAgentProfile,
  getEnabledAgentProfiles,
  resolveAgentProfileIdForNextSession,
  sortAgentProfilesWithDefaultFirst,
  toSelectableAgentProfile,
} from "./agent-selector-options"

describe("agent selector option helpers", () => {
  it("treats agent profiles as enabled unless explicitly disabled", () => {
    const profiles = getEnabledAgentProfiles([
      { id: "main", enabled: true },
      { id: "implicit" },
      { id: "disabled", enabled: false },
    ])

    expect(profiles.map((profile) => profile.id)).toEqual(["main", "implicit"])
  })

  it("chooses the default profile, then main-agent, then the first enabled profile", () => {
    expect(getDefaultAgentProfile([
      { id: "helper", name: "helper" },
      { id: "main", name: "main-agent" },
    ])?.id).toBe("main")

    expect(getDefaultAgentProfile([
      { id: "helper", name: "helper" },
      { id: "default", name: "custom", isDefault: true },
      { id: "main", name: "main-agent" },
    ])?.id).toBe("default")

    expect(getDefaultAgentProfile([
      { id: "first", name: "first" },
      { id: "second", name: "second" },
    ])?.id).toBe("first")
  })

  it("sorts the default profile first while preserving the other profile order", () => {
    const profiles = [
      { id: "alpha" },
      { id: "default", isDefault: true },
      { id: "beta" },
    ]

    expect(sortAgentProfilesWithDefaultFirst(profiles).map((profile) => profile.id)).toEqual([
      "default",
      "alpha",
      "beta",
    ])
  })

  it("uses the selected profile for display when it is available", () => {
    const profiles = [
      { id: "main", name: "main-agent" },
      { id: "helper", name: "helper" },
    ]

    expect(getDisplayAgentProfile(profiles, "helper")?.id).toBe("helper")
    expect(getDisplayAgentProfile(profiles, "missing")?.id).toBe("main")
  })

  it("resolves the selected enabled agent for the next session", () => {
    expect(
      resolveAgentProfileIdForNextSession(
        [
          { id: "main", name: "main-agent" },
          { id: "helper", name: "helper" },
        ],
        "helper",
      ),
    ).toEqual({ status: "selected", agentId: "helper" })
  })

  it("reports stale selected agents instead of silently falling back", () => {
    expect(
      resolveAgentProfileIdForNextSession(
        [
          { id: "main", name: "main-agent" },
          { id: "disabled-helper", name: "helper", enabled: false },
        ],
        "disabled-helper",
      ),
    ).toEqual({ status: "stale-selection" })

    expect(
      resolveAgentProfileIdForNextSession(
        [{ id: "main", name: "main-agent" }],
        "missing",
      ),
    ).toEqual({ status: "stale-selection" })
  })

  it("resolves the default enabled agent when there is no selected agent", () => {
    expect(
      resolveAgentProfileIdForNextSession([
        { id: "disabled-default", name: "main-agent", enabled: false },
        { id: "first-enabled", name: "first" },
      ]),
    ).toEqual({ status: "selected", agentId: "first-enabled" })
  })

  it("allows starting without applying an agent when no profiles are enabled", () => {
    expect(
      resolveAgentProfileIdForNextSession([
        { id: "disabled", name: "main-agent", enabled: false },
      ]),
    ).toEqual({ status: "no-agent" })
  })

  it("builds selectable profile entries from API profiles", () => {
    const profile = toSelectableAgentProfile({
      id: "sub",
      name: "augustus",
      displayName: "Augustus",
      description: "Delegated helper",
      enabled: true,
      connectionType: "internal",
    })

    expect(profile).toEqual({
      id: "sub",
      name: "Augustus",
      guidelines: "Delegated helper",
      description: "Delegated helper",
      selectorMode: "profile",
      selectionValue: "sub",
    })
  })
})

describe("buildSelectorProfiles", () => {
  it("uses enabled agent profiles for the selector in API mode", () => {
    const result = buildSelectorProfiles(
      { mainAgentMode: "api" },
      [
        { id: "main", name: "main-agent", displayName: "Main Agent", enabled: true, connectionType: "internal" },
        { id: "sub", name: "augustus", displayName: "Augustus", description: "Delegated helper", connectionType: "internal" },
        { id: "off", name: "disabled", displayName: "Disabled", enabled: false, connectionType: "internal" },
      ],
    )

    expect(result.selectorMode).toBe("profile")
    expect(result.profiles.map((profile) => profile.id)).toEqual(["main", "sub"])
    expect(result.profiles.map((profile) => profile.name)).toEqual(["Main Agent", "Augustus"])
  })

  it("uses acpx-capable agent profiles when acpx mode is enabled", () => {
    const result = buildSelectorProfiles(
      {
        mainAgentMode: "acpx",
        acpxAgents: [{ name: "legacy-agent", displayName: "Legacy Agent" }],
      },
      [
        { id: "acpx-1", name: "augustus", displayName: "Augustus", enabled: true, connectionType: "acpx" },
        { id: "stdio-1", name: "stdio-helper", displayName: "STDIO Helper", connectionType: "stdio" },
        { id: "internal-1", name: "helper", displayName: "Helper", enabled: true, connectionType: "internal" },
      ],
    )

    expect(result.selectorMode).toBe("acpx")
    expect(result.profiles.map((profile) => profile.selectionValue)).toEqual(["augustus", "stdio-helper", "legacy-agent"])
    expect(result.profiles.map((profile) => profile.name)).toEqual(["Augustus", "STDIO Helper", "Legacy Agent"])
  })
})
