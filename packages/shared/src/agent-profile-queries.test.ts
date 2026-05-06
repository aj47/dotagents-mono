import { describe, expect, it } from "vitest"

import {
  getAgentProfileByName,
  getAgentProfilesByRole,
  getChatAgentProfiles,
  getCurrentAgentProfile,
  getDelegationAgentProfiles,
  getEnabledChatAgentProfiles,
  getEnabledDelegationAgentProfiles,
  getExternalAgentProfiles,
  isAgentProfileMatchingRole,
  normalizeAgentProfileQueryRole,
} from "./agent-profile-queries"

describe("agent profile query helpers", () => {
  const profiles = [
    {
      id: "main",
      name: "main-agent",
      displayName: "Main Agent",
      role: "delegation-target",
      isAgentTarget: true,
      enabled: true,
      isBuiltIn: true,
    },
    {
      id: "chat",
      name: "chat",
      displayName: "Chat Agent",
      role: "user-profile",
      isUserProfile: false,
      enabled: true,
    },
    {
      id: "legacy-chat",
      name: "legacy-chat",
      displayName: "Legacy Chat",
      isUserProfile: true,
      enabled: true,
    },
    {
      id: "disabled-chat",
      name: "disabled-chat",
      displayName: "Disabled Chat",
      role: "chat-agent",
      enabled: false,
    },
    {
      id: "disabled-target",
      name: "disabled-target",
      displayName: "Disabled Target",
      isAgentTarget: true,
      enabled: false,
    },
    {
      id: "external",
      name: "external",
      displayName: "External",
      isAgentTarget: true,
      connection: { type: "acpx" },
      enabled: true,
    },
    {
      id: "remote",
      name: "remote",
      displayName: "Remote",
      connectionType: "remote",
      enabled: true,
    },
  ]

  it("normalizes preferred and legacy role names", () => {
    expect(normalizeAgentProfileQueryRole("user-profile")).toBe("chat-agent")
    expect(normalizeAgentProfileQueryRole("chat-agent")).toBe("chat-agent")
    expect(normalizeAgentProfileQueryRole("unknown")).toBeUndefined()
  })

  it("matches roles using explicit role first and legacy flags as fallback", () => {
    const profile = (id: string) => profiles.find((candidate) => candidate.id === id)!

    expect(isAgentProfileMatchingRole(profile("chat"), "chat-agent")).toBe(true)
    expect(isAgentProfileMatchingRole(profile("legacy-chat"), "user-profile")).toBe(true)
    expect(isAgentProfileMatchingRole(profile("disabled-target"), "delegation-target")).toBe(true)
    expect(isAgentProfileMatchingRole(profile("external"), "external-agent")).toBe(true)
    expect(isAgentProfileMatchingRole(profile("remote"), "external-agent")).toBe(false)
  })

  it("filters role-specific profile lists with legacy compatibility", () => {
    expect(getAgentProfilesByRole(profiles, "chat-agent").map((profile) => profile.id))
      .toEqual(["chat", "legacy-chat", "disabled-chat"])
    expect(getChatAgentProfiles(profiles).map((profile) => profile.id))
      .toEqual(["chat", "legacy-chat", "disabled-chat"])
    expect(getEnabledChatAgentProfiles(profiles).map((profile) => profile.id))
      .toEqual(["chat", "legacy-chat"])
    expect(getDelegationAgentProfiles(profiles).map((profile) => profile.id))
      .toEqual(["main", "disabled-target", "external"])
    expect(getEnabledDelegationAgentProfiles(profiles).map((profile) => profile.id))
      .toEqual(["main", "external"])
  })

  it("finds external profiles using role or external connection types", () => {
    expect(getExternalAgentProfiles([
      ...profiles,
      { id: "role-external", role: "external-agent", enabled: true },
    ]).map((profile) => profile.id)).toEqual(["external", "remote", "role-external"])
  })

  it("finds profiles by canonical name then display name", () => {
    expect(getAgentProfileByName(profiles, "chat")?.id).toBe("chat")
    expect(getAgentProfileByName(profiles, "Legacy Chat")?.id).toBe("legacy-chat")
    expect(getAgentProfileByName(profiles, "missing")).toBeUndefined()
  })

  it("resolves current profile with default and built-in fallbacks", () => {
    expect(getCurrentAgentProfile(profiles, "chat")?.id).toBe("chat")
    expect(getCurrentAgentProfile([{ id: "default", isDefault: true }, ...profiles])?.id).toBe("default")
    expect(getCurrentAgentProfile(profiles)?.id).toBe("main")
    expect(getCurrentAgentProfile(profiles, "missing")).toBeUndefined()
  })
})
