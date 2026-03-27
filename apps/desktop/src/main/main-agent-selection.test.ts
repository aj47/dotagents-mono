import { describe, expect, it } from "vitest"
import { resolveMainAcpAgentSelection, resolvePreferredTopLevelAcpAgentSelection } from "./main-agent-selection"

describe("resolveMainAcpAgentSelection", () => {
  it("resolves ACP profile display names to canonical profile names", () => {
    const result = resolveMainAcpAgentSelection("Claude Code", [
      {
        name: "claude-code",
        displayName: "Claude Code",
        enabled: true,
        connection: { type: "acp", command: "claude-code-acp" },
      } as any,
    ])

    expect(result).toEqual({ resolvedName: "claude-code" })
  })

  it("repairs stale selections when exactly one ACP-capable agent is available", () => {
    const result = resolveMainAcpAgentSelection("missing-agent", [
      {
        name: "augustus",
        displayName: "augustus",
        enabled: true,
        connection: { type: "acp", command: "auggie", args: ["--acp"] },
      } as any,
    ])

    expect(result).toEqual({ resolvedName: "augustus", repairedName: "augustus" })
  })

  it("returns a helpful error when multiple ACP-capable agents are available", () => {
    const result = resolveMainAcpAgentSelection("missing-agent", [
      {
        name: "agent-one",
        displayName: "Agent One",
        enabled: true,
        connection: { type: "acp", command: "agent-one" },
      } as any,
      {
        name: "agent-two",
        displayName: "Agent Two",
        enabled: true,
        connection: { type: "stdio", command: "agent-two" },
      } as any,
    ])

    expect(result).toEqual({
      error: 'ACP main agent "missing-agent" is not available. Configure mainAgentName to one of: agent-one, agent-two',
    })
  })

  it("returns a clearer configuration error when no ACP main agent has been selected", () => {
    const result = resolveMainAcpAgentSelection("   ", [
      {
        name: "agent-one",
        displayName: "Agent One",
        enabled: true,
        connection: { type: "acp", command: "agent-one" },
      } as any,
      {
        name: "agent-two",
        displayName: "Agent Two",
        enabled: true,
        connection: { type: "stdio", command: "agent-two" },
      } as any,
    ])

    expect(result).toEqual({
      error: "ACP main agent is not configured. Configure mainAgentName to one of: agent-one, agent-two",
    })
  })

  it("returns a clearer configuration error when no ACP-capable agents are available", () => {
    const result = resolveMainAcpAgentSelection("   ", [])

    expect(result).toEqual({
      error: "ACP main agent is not configured and no enabled ACP/stdio agents were found.",
    })
  })
})

describe("resolvePreferredTopLevelAcpAgentSelection", () => {
  it("prefers the selected ACP-backed profile even when global main agent mode is api", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "augustus-profile",
        name: "augustus",
        displayName: "Augustus",
        enabled: true,
        connection: { type: "acp", command: "auggie", args: ["--acp"] },
      } as any,
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
      } as any,
      sessionProfileId: "augustus-profile",
      mainAgentMode: "api",
      profileAgents: [
        {
          id: "augustus-profile",
          name: "augustus",
          displayName: "Augustus",
          enabled: true,
          connection: { type: "stdio", command: "auggie", args: ["--acp"] },
        } as any,
      ],
    })

    expect(result).toEqual({ resolvedName: "augustus", source: "profile" })
  })

  it("falls back to configured ACP main agent selection when the selected profile is internal", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "main-profile",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
        connection: { type: "internal" },
      } as any,
      mainAgentMode: "acp",
      mainAgentName: "Augustus",
      profileAgents: [
        {
          id: "augustus-profile",
          name: "augustus",
          displayName: "Augustus",
          enabled: true,
          connection: { type: "acp", command: "auggie", args: ["--acp"] },
        } as any,
      ],
    })

    expect(result).toEqual({ resolvedName: "augustus", source: "main-agent" })
  })

  it("returns null when neither the selected profile nor config opts into ACP", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "main-profile",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
        connection: { type: "internal" },
      } as any,
      mainAgentMode: "api",
      profileAgents: [],
    })

    expect(result).toBeNull()
  })

  it("returns null when ACP main-agent mode is enabled without a configured main agent name", () => {
    const result = resolvePreferredTopLevelAcpAgentSelection({
      currentProfile: {
        id: "main-profile",
        name: "main-agent",
        displayName: "Main Agent",
        enabled: true,
        connection: { type: "internal" },
      } as any,
      mainAgentMode: "acp",
      mainAgentName: "   ",
      profileAgents: [
        {
          id: "augustus-profile",
          name: "augustus",
          displayName: "Augustus",
          enabled: true,
          connection: { type: "acp", command: "auggie", args: ["--acp"] },
        } as any,
      ],
    })

    expect(result).toBeNull()
  })
})
