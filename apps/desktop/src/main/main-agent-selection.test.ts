import { describe, expect, it } from "vitest"
import { resolveMainAcpAgentSelection } from "./main-agent-selection"

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
})