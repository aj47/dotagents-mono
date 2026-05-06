import { describe, expect, it } from "vitest"
import {
  DEFAULT_MAIN_AGENT_MODE,
  MAIN_AGENT_MODE_OPTIONS,
  getAcpxMainAgentOptions,
  getSelectableMainAcpAgents,
  isMainAgentModeUpdateValue,
  resolveMainAcpAgentSelection,
  resolvePreferredTopLevelAcpAgentSelection,
} from "./main-agent-selection"
import type { MainAgentConfig, MainAgentMode } from "./main-agent-selection"

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe("main agent config contracts", () => {
  it("exposes the persisted main agent mode and name contract", () => {
    const mode: MainAgentMode = "acpx"
    const config: MainAgentConfig = {
      mainAgentMode: mode,
      mainAgentName: "augustus",
    }

    assertType<MainAgentConfig>(config)
    expect(config.mainAgentMode).toBe("acpx")
  })

  it("describes main agent mode defaults and update values", () => {
    expect(DEFAULT_MAIN_AGENT_MODE).toBe("api")
    expect(MAIN_AGENT_MODE_OPTIONS).toEqual(["api", "acpx"])
    expect(isMainAgentModeUpdateValue("api")).toBe(true)
    expect(isMainAgentModeUpdateValue("acpx")).toBe(true)
    expect(isMainAgentModeUpdateValue("acp")).toBe(false)
    expect(isMainAgentModeUpdateValue(undefined)).toBe(false)
  })
})

describe("getSelectableMainAcpAgents", () => {
  it("returns enabled acp-capable profile agents before legacy agents", () => {
    const result = getSelectableMainAcpAgents(
      [
        { name: "augustus", displayName: "Augustus", enabled: true, connection: { type: "acpx" } },
        { name: "stdio-helper", displayName: "STDIO Helper", connection: { type: "stdio" } },
        { name: "internal-helper", displayName: "Internal Helper", connection: { type: "internal" } },
        { name: "disabled-agent", displayName: "Disabled Agent", enabled: false, connection: { type: "acpx" } },
      ],
      [
        { name: "legacy-agent", displayName: "Legacy Agent", connection: { type: "stdio" } },
      ],
    )

    expect(result).toEqual([
      { name: "augustus", displayName: "Augustus" },
      { name: "stdio-helper", displayName: "STDIO Helper" },
      { name: "legacy-agent", displayName: "Legacy Agent" },
    ])
  })

  it("dedupes by canonical name and trims fallback display names", () => {
    const result = getSelectableMainAcpAgents(
      [
        { name: "  Augustus  ", displayName: "  ", connectionType: "acpx" },
      ],
      [
        { name: "augustus", displayName: "Legacy Augustus" },
        { name: "  legacy-agent  ", displayName: "  Legacy Agent  " },
      ],
    )

    expect(result).toEqual([
      { name: "Augustus", displayName: "Augustus" },
      { name: "legacy-agent", displayName: "Legacy Agent" },
    ])
  })

  it("keeps mobile settings acpxAgents usable even though they are already prefiltered", () => {
    const result = getAcpxMainAgentOptions(
      {
        acpxAgents: [{ name: "legacy-agent", displayName: "Legacy Agent" }],
      },
      [{ name: "augustus", displayName: "Augustus", connectionType: "acpx" }],
    )

    expect(result.map((option) => option.name)).toEqual(["augustus", "legacy-agent"])
  })
})

describe("resolveMainAcpAgentSelection", () => {
  it("resolves acpx profile display names to canonical profile names", () => {
    const result = resolveMainAcpAgentSelection("Claude Code", [
      {
        name: "claude-code",
        displayName: "Claude Code",
        enabled: true,
        connection: { type: "acpx" },
      },
    ])

    expect(result).toEqual({ resolvedName: "claude-code" })
  })

  it("repairs stale selections when exactly one acpx-capable agent is available", () => {
    const result = resolveMainAcpAgentSelection("missing-agent", [
      {
        name: "augustus",
        displayName: "augustus",
        enabled: true,
        connection: { type: "acpx" },
      },
    ])

    expect(result).toEqual({ resolvedName: "augustus", repairedName: "augustus" })
  })

  it("returns a helpful error when multiple acpx-capable agents are available", () => {
    const result = resolveMainAcpAgentSelection("missing-agent", [
      {
        name: "agent-one",
        displayName: "Agent One",
        enabled: true,
        connection: { type: "acpx" },
      },
      {
        name: "agent-two",
        displayName: "Agent Two",
        enabled: true,
        connection: { type: "acpx" },
      },
    ])

    expect(result).toEqual({
      error: 'acpx main agent "missing-agent" is not available. Configure mainAgentName to one of: agent-one, agent-two',
    })
  })
})

describe("resolvePreferredTopLevelAcpAgentSelection", () => {
  it("prefers the selected acpx-backed profile even when global main agent mode is api", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "augustus-profile",
        name: "augustus",
        displayName: "Augustus",
        enabled: true,
        connection: { type: "acpx" },
      },
      mainAgentMode: "api",
      profileAgents: [],
    })

    expect(result).toEqual({ resolvedName: "augustus", source: "profile" })
  })

  it("prefers the revived session profile over the current profile", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "main-profile",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
        connection: { type: "internal" },
      },
      sessionProfileId: "augustus-profile",
      mainAgentMode: "api",
      profileAgents: [
        {
          id: "augustus-profile",
          name: "augustus",
          displayName: "Augustus",
          enabled: true,
          connection: { type: "acpx" },
        },
      ],
    })

    expect(result).toEqual({ resolvedName: "augustus", source: "profile" })
  })

  it("falls back to configured acpx main agent selection when the selected profile is internal", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "main-profile",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
        connection: { type: "internal" },
      },
      mainAgentMode: "acpx",
      mainAgentName: "Augustus",
      profileAgents: [
        {
          id: "augustus-profile",
          name: "augustus",
          displayName: "Augustus",
          enabled: true,
          connection: { type: "acpx" },
        },
      ],
    })

    expect(result).toEqual({ resolvedName: "augustus", source: "main-agent" })
  })
})
