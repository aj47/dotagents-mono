import { describe, expect, it } from "vitest"

import { AGENT_AVATAR_PALETTE, getAgentAvatarColors } from "./agent-avatar-colors"

describe("agent avatar colors", () => {
  it("returns deterministic facehash colors for an agent id", () => {
    expect(getAgentAvatarColors("agent-1")).toEqual(["#14b8a6", "#a855f7", "#0891b2"])
  })

  it("always chooses three colors from the shared palette", () => {
    const colors = getAgentAvatarColors("default")

    expect(colors).toHaveLength(3)
    for (const color of colors) {
      expect(AGENT_AVATAR_PALETTE).toContain(color)
    }
  })

  it("keeps empty seeds deterministic for placeholder avatars", () => {
    expect(getAgentAvatarColors("")).toEqual(getAgentAvatarColors(""))
    expect(getAgentAvatarColors("")).toEqual(["#f97316", "#06b6d4", "#f59e0b"])
  })
})
