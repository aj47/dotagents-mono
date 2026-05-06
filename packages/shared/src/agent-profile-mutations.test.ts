import { describe, expect, it } from "vitest"

import {
  buildAgentProfileUpdatePatch,
  canDeleteAgentProfile,
  canSetCurrentAgentProfile,
  createAgentProfileRecord,
  getDeletableAgentProfileIndex,
} from "./agent-profile-mutations"

describe("agent profile mutations", () => {
  it("creates a profile record with injected id and timestamps", () => {
    expect(createAgentProfileRecord({
      name: "",
      displayName: "Research Agent",
      enabled: true,
    }, "profile-1", 123)).toEqual({
      id: "profile-1",
      name: "Research Agent",
      displayName: "Research Agent",
      enabled: true,
      createdAt: 123,
      updatedAt: 123,
    })
  })

  it("builds update patches without protected fields and syncs non-built-in display names", () => {
    const patch = buildAgentProfileUpdatePatch(
      { isBuiltIn: false },
      {
        id: "ignored",
        createdAt: 1,
        isBuiltIn: true,
        displayName: "New Name",
        guidelines: "Updated",
      },
      456,
    )

    expect(patch).toEqual({
      displayName: "New Name",
      name: "New Name",
      guidelines: "Updated",
      updatedAt: 456,
    })
  })

  it("does not sync built-in names or blank display names", () => {
    expect(buildAgentProfileUpdatePatch(
      { isBuiltIn: true },
      { displayName: "Built In" },
      10,
    )).toEqual({
      displayName: "Built In",
      updatedAt: 10,
    })

    expect(buildAgentProfileUpdatePatch(
      { isBuiltIn: false },
      { displayName: "" },
      11,
    )).toEqual({
      displayName: "",
      updatedAt: 11,
    })
  })

  it("guards deletion of missing and built-in profiles", () => {
    const profiles = [
      { id: "built-in", isBuiltIn: true },
      { id: "user", isBuiltIn: false },
    ]

    expect(canDeleteAgentProfile(undefined)).toBe(false)
    expect(canDeleteAgentProfile(profiles[0])).toBe(false)
    expect(canDeleteAgentProfile(profiles[1])).toBe(true)
    expect(getDeletableAgentProfileIndex(profiles, "missing")).toBe(-1)
    expect(getDeletableAgentProfileIndex(profiles, "built-in")).toBe(-1)
    expect(getDeletableAgentProfileIndex(profiles, "user")).toBe(1)
  })

  it("checks whether current profile can be set", () => {
    expect(canSetCurrentAgentProfile([{ id: "profile-1" }], "profile-1")).toBe(true)
    expect(canSetCurrentAgentProfile([{ id: "profile-1" }], "missing")).toBe(false)
  })
})
