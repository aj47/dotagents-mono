import { describe, expect, it } from "vitest"
import {
  getAcpCapableAgentProfiles,
  getAgentProfileCatalogDescription,
  getAgentProfileCatalogSummaryItems,
  getAgentProfileDisplayName,
  getAgentProfileSummary,
  getAgentProfileStatusLabels,
  getDefaultAgentProfile,
  getEnabledAgentProfiles,
  getAgentProfileConnectionType,
  getSelectableMainAcpAgents,
  isAcpCapableAgentProfile,
  resolveAgentProfileSelection,
  sortAgentProfilesByPriority,
} from "./agent-profiles"

describe("agent profile helpers", () => {
  it("resolves display names, summaries, and connection types from shared profile shapes", () => {
    expect(
      getAgentProfileDisplayName({
        name: "main-agent",
        displayName: " Main Agent ",
      } as any),
    ).toBe("Main Agent")
    expect(
      getAgentProfileDisplayName({
        name: "main-agent",
        displayName: "   ",
      } as any),
    ).toBe("main-agent")
    expect(
      getAgentProfileSummary({
        description: " Helpful profile ",
        guidelines: "Fallback summary",
      } as any),
    ).toBe("Helpful profile")
    expect(
      getAgentProfileSummary({
        description: "   ",
        guidelines: "Fallback summary",
      } as any),
    ).toBe("Fallback summary")
    expect(
      getAgentProfileCatalogDescription(
        {
          description: "   ",
          guidelines: "Fallback summary",
        } as any,
        "No description provided.",
      ),
    ).toBe("Fallback summary")
    expect(
      getAgentProfileCatalogDescription(
        {
          description: "   ",
          guidelines: "   ",
        } as any,
        "No description provided.",
      ),
    ).toBe("No description provided.")
    expect(
      getAgentProfileConnectionType({
        connectionType: "stdio",
      } as any),
    ).toBe("stdio")
    expect(
      getAgentProfileConnectionType({
        connection: { type: "acp" },
      } as any),
    ).toBe("acp")
  })

  it("builds shared agent catalog status labels and summary items", () => {
    expect(
      getAgentProfileStatusLabels(
        {
          enabled: false,
          isBuiltIn: true,
          isDefault: true,
        } as any,
        { isCurrent: true },
      ),
    ).toEqual(["current", "built-in", "default", "disabled"])

    expect(
      getAgentProfileCatalogSummaryItems(
        {
          connection: { type: "acp" },
          modelConfig: { mcpToolsProviderId: "openai" },
          toolConfig: { enabledServers: ["github", "filesystem"] },
          skillsConfig: {
            allSkillsDisabledByDefault: true,
            enabledSkillIds: ["skill-1", "skill-2"],
          },
          properties: { region: "us", mode: "safe" },
        } as any,
        { availableSkillCount: 5 },
      ),
    ).toEqual(["acp", "openai", "2 servers", "2 skills", "2 props"])

    expect(
      getAgentProfileCatalogSummaryItems(
        {
          connectionType: "internal",
          skillsConfig: {
            allSkillsDisabledByDefault: false,
            enabledSkillIds: [],
          },
        } as any,
        { availableSkillCount: 3 },
      ),
    ).toEqual(["internal", "3 skills"])
  })

  it("filters enabled profiles and sorts them by priority, default, and label", () => {
    const profiles = [
      { id: "gamma", name: "gamma", displayName: "Gamma", enabled: true },
      {
        id: "main",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
      },
      {
        id: "alpha",
        name: "alpha",
        displayName: "Alpha",
        enabled: true,
        isDefault: true,
      },
      {
        id: "disabled",
        name: "disabled",
        displayName: "Disabled",
        enabled: false,
      },
    ]

    expect(
      getEnabledAgentProfiles(profiles).map((profile) => profile.id),
    ).toEqual(["gamma", "main", "alpha"])
    expect(
      sortAgentProfilesByPriority(getEnabledAgentProfiles(profiles), {
        priorityProfileId: "gamma",
      }).map((profile) => profile.id),
    ).toEqual(["gamma", "alpha", "main"])
  })

  it("selects the default agent, then main-agent, then the first enabled profile", () => {
    expect(
      getDefaultAgentProfile([
        { id: "helper", name: "helper", enabled: true },
        { id: "main", name: "main-agent", enabled: true },
      ])?.id,
    ).toBe("main")

    expect(
      getDefaultAgentProfile([
        { id: "helper", name: "helper", enabled: true },
        { id: "default", name: "assistant", enabled: true, isDefault: true },
      ])?.id,
    ).toBe("default")

    expect(
      getDefaultAgentProfile([{ id: "helper", name: "helper", enabled: true }])
        ?.id,
    ).toBe("helper")
  })

  it("matches agent selections by id, name, display name, and unique prefix", () => {
    const profiles = [
      {
        id: "main",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
      },
      {
        id: "augustus-01",
        name: "augustus",
        displayName: "Augustus",
        enabled: true,
      },
      { id: "augur-02", name: "augur", displayName: "Augur", enabled: true },
    ]

    expect(resolveAgentProfileSelection(profiles, "Main Agent")).toEqual({
      selectedProfile: profiles[0],
    })
    expect(resolveAgentProfileSelection(profiles, "augustus-01")).toEqual({
      selectedProfile: profiles[1],
    })
    expect(resolveAgentProfileSelection(profiles, "aug")).toEqual({
      ambiguousProfiles: [profiles[1], profiles[2]],
    })
    expect(resolveAgentProfileSelection(profiles, "august")).toEqual({
      selectedProfile: profiles[1],
    })
  })

  it("filters ACP-capable profiles across desktop and remote/mobile connection shapes", () => {
    const profiles = [
      {
        id: "internal",
        name: "main-agent",
        enabled: true,
        connection: { type: "internal" },
      },
      {
        id: "acp",
        name: "augustus",
        enabled: true,
        connection: { type: "acp" },
      },
      {
        id: "stdio",
        name: "claude-code",
        enabled: true,
        connectionType: "stdio",
      },
      { id: "disabled", name: "off", enabled: false, connectionType: "acp" },
    ]

    expect(isAcpCapableAgentProfile(profiles[0] as any)).toBe(false)
    expect(isAcpCapableAgentProfile(profiles[1] as any)).toBe(true)
    expect(isAcpCapableAgentProfile(profiles[2] as any)).toBe(true)
    expect(
      getAcpCapableAgentProfiles(profiles as any).map((profile) => profile.id),
    ).toEqual(["acp", "stdio"])
  })

  it("builds ACP main-agent options from ACP-capable profiles before unique legacy stdio entries", () => {
    expect(
      getSelectableMainAcpAgents(
        [
          {
            id: "augustus-profile",
            name: "augustus",
            displayName: "Augustus",
            enabled: true,
            connection: { type: "acp" },
          },
          {
            id: "helper-profile",
            name: "helper-stdio",
            displayName: " Helper STDIO ",
            enabled: true,
            connectionType: "stdio",
          },
          {
            id: "remote-profile",
            name: "remote-agent",
            displayName: "Remote Agent",
            enabled: true,
            connection: { type: "remote" },
          },
        ],
        [
          {
            name: "AUGUSTUS",
            displayName: "Legacy Augustus",
            enabled: true,
            connection: { type: "stdio" },
          },
          {
            name: "legacy-agent",
            displayName: " Legacy Agent ",
            enabled: true,
            connection: { type: "stdio" },
          },
          {
            name: "disabled-legacy",
            displayName: "Disabled Legacy",
            enabled: false,
            connection: { type: "stdio" },
          },
          {
            name: "remote-legacy",
            displayName: "Remote Legacy",
            enabled: true,
            connection: { type: "remote" },
          },
        ],
      ),
    ).toEqual([
      {
        id: "augustus-profile",
        name: "augustus",
        displayName: "Augustus",
      },
      {
        id: "helper-profile",
        name: "helper-stdio",
        displayName: "Helper STDIO",
      },
      {
        id: "legacy-agent",
        name: "legacy-agent",
        displayName: "Legacy Agent",
      },
    ])
  })
})
