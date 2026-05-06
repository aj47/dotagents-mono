import { describe, expect, it } from "vitest"

import {
  buildAgentProfileAvatarDataUrl,
  buildAgentProfileUpdatePatch,
  canDeleteAgentProfile,
  canSetCurrentAgentProfile,
  createAgentProfileRecord,
  DEFAULT_AGENT_PROFILE_AUTO_SPAWN,
  DEFAULT_AGENT_PROFILE_ENABLED,
  formatAgentProfilePropertiesForRequest,
  getAgentProfileAvatarFileSizeError,
  getApproxAgentProfileAvatarBase64Bytes,
  getDeletableAgentProfileIndex,
  MAX_AGENT_PROFILE_AVATAR_FILE_SIZE_BYTES,
  normalizeAgentProfileProperties,
} from "./agent-profile-mutations"

describe("agent profile mutations", () => {
  it("exposes shared editable agent defaults", () => {
    expect(DEFAULT_AGENT_PROFILE_ENABLED).toBe(true)
    expect(DEFAULT_AGENT_PROFILE_AUTO_SPAWN).toBe(false)
  })

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

  it("normalizes and formats profile properties for editable request payloads", () => {
    expect(normalizeAgentProfileProperties({
      language: "TypeScript",
      invalid: 123,
      empty: "",
    })).toEqual({
      language: "TypeScript",
      empty: "",
    })

    expect(formatAgentProfilePropertiesForRequest({
      " language ": "TypeScript",
      "": "drop",
      "   ": "drop",
      tone: "direct",
    })).toEqual({
      language: "TypeScript",
      tone: "direct",
    })

    expect(formatAgentProfilePropertiesForRequest({ " ": "drop" })).toBeUndefined()
    expect(formatAgentProfilePropertiesForRequest(undefined)).toBeUndefined()
  })

  it("builds and validates avatar data URLs for profile edits", () => {
    expect(MAX_AGENT_PROFILE_AVATAR_FILE_SIZE_BYTES).toBe(2 * 1024 * 1024)
    expect(getApproxAgentProfileAvatarBase64Bytes(" YWJjZA== ")).toBe(4)
    expect(getAgentProfileAvatarFileSizeError(MAX_AGENT_PROFILE_AVATAR_FILE_SIZE_BYTES + 1)).toBe("Choose a photo under 2 MB.")
    expect(getAgentProfileAvatarFileSizeError(MAX_AGENT_PROFILE_AVATAR_FILE_SIZE_BYTES)).toBeUndefined()
    expect(buildAgentProfileAvatarDataUrl("abc", "image/png")).toBe("data:image/png;base64,abc")
    expect(buildAgentProfileAvatarDataUrl("abc", undefined)).toBe("data:image/jpeg;base64,abc")
  })
})
