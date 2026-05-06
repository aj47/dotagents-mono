import { describe, expect, it } from "vitest"

import type { AgentProfile } from "@shared/types"

import {
  sortAgentProfilesWithDefaultFirst as sortAgentsWithDefaultFirst,
} from "@dotagents/shared/agent-selector-options"

function makeAgent(id: string, overrides: Partial<AgentProfile> = {}): AgentProfile {
  return {
    id,
    name: id,
    displayName: id,
    connection: { type: "internal" },
    isStateful: false,
    enabled: true,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe("sortAgentsWithDefaultFirst", () => {
  it("pins the default agent to the top", () => {
    const agents = [
      makeAgent("worker-a"),
      makeAgent("main-agent", { isDefault: true, displayName: "Main Agent" }),
      makeAgent("worker-b"),
    ]

    expect(sortAgentsWithDefaultFirst(agents).map((agent) => agent.id)).toEqual([
      "main-agent",
      "worker-a",
      "worker-b",
    ])
  })

  it("preserves the relative order of non-default agents", () => {
    const agents = [
      makeAgent("alpha"),
      makeAgent("beta"),
      makeAgent("main-agent", { isDefault: true }),
      makeAgent("gamma"),
    ]

    expect(sortAgentsWithDefaultFirst(agents).map((agent) => agent.id)).toEqual([
      "main-agent",
      "alpha",
      "beta",
      "gamma",
    ])
  })
})
