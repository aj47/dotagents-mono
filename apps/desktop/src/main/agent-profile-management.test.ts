import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  activateAgentProfileMock,
  createProfile,
  createProfileMock,
  deleteProfileMock,
  getAllMock,
  getByIdMock,
  getCurrentProfileMock,
  profileStore,
  updateProfileMock,
} = vi.hoisted(() => {
  const profileStore: {
    currentProfileId?: string
    profiles: any[]
  } = {
    currentProfileId: undefined,
    profiles: [],
  }

  const createProfile = (overrides: Record<string, unknown> = {}) => ({
    id: "profile-main",
    name: "Main Agent",
    displayName: "Main Agent",
    connection: { type: "internal" as const },
    enabled: true,
    isBuiltIn: false,
    isDefault: false,
    role: "delegation-target" as const,
    isUserProfile: false,
    isAgentTarget: true,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  })

  const getAllMock = vi.fn(() => profileStore.profiles)
  const getByIdMock = vi.fn((profileId: string) =>
    profileStore.profiles.find((profile) => profile.id === profileId),
  )
  const getCurrentProfileMock = vi.fn(() =>
    profileStore.profiles.find(
      (profile) => profile.id === profileStore.currentProfileId,
    ),
  )
  const createProfileMock = vi.fn((profile: Record<string, unknown>) => {
    const nextProfile = createProfile({
      ...profile,
      id: profile.id || `profile-${profileStore.profiles.length + 1}`,
      createdAt: 10 + profileStore.profiles.length,
      updatedAt: 10 + profileStore.profiles.length,
    })
    profileStore.profiles.push(nextProfile)
    return nextProfile
  })
  const updateProfileMock = vi.fn(
    (profileId: string, updates: Record<string, unknown>) => {
      const profile = profileStore.profiles.find(
        (existing) => existing.id === profileId,
      )
      if (!profile) {
        return undefined
      }
      Object.assign(profile, updates, { updatedAt: profile.updatedAt + 1 })
      return profile
    },
  )
  const deleteProfileMock = vi.fn((profileId: string) => {
    const nextProfiles = profileStore.profiles.filter(
      (profile) => profile.id !== profileId,
    )
    const deleted = nextProfiles.length !== profileStore.profiles.length
    profileStore.profiles = nextProfiles
    return deleted
  })
  const activateAgentProfileMock = vi.fn((profile: any) => {
    profileStore.currentProfileId = profile.id
    return profile
  })

  return {
    activateAgentProfileMock,
    createProfile,
    createProfileMock,
    deleteProfileMock,
    getAllMock,
    getByIdMock,
    getCurrentProfileMock,
    profileStore,
    updateProfileMock,
  }
})

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    create: createProfileMock,
    delete: deleteProfileMock,
    getAll: getAllMock,
    getById: getByIdMock,
    getCurrentProfile: getCurrentProfileMock,
    update: updateProfileMock,
  },
}))

vi.mock("./agent-profile-activation", () => ({
  activateAgentProfile: activateAgentProfileMock,
}))

import {
  createManagedAgentProfile,
  deleteManagedAgentProfile,
  getManagedAgentProfiles,
  resolveManagedAgentProfileSelection,
  toggleManagedAgentProfileEnabled,
  updateManagedAgentProfile,
} from "./agent-profile-management"

describe("agent profile management", () => {
  beforeEach(() => {
    profileStore.currentProfileId = "profile-current"
    profileStore.profiles = [
      createProfile({
        id: "profile-current",
        name: "Current Agent",
        displayName: "Current Agent",
      }),
      createProfile({
        id: "profile-default",
        name: "main-agent",
        displayName: "Main Agent",
        isBuiltIn: true,
        isDefault: true,
      }),
      createProfile({
        id: "profile-disabled",
        name: "Disabled Agent",
        displayName: "Disabled Agent",
        enabled: false,
      }),
    ]
    activateAgentProfileMock.mockClear()
    createProfileMock.mockClear()
    deleteProfileMock.mockClear()
    getAllMock.mockClear()
    getByIdMock.mockClear()
    getCurrentProfileMock.mockClear()
    updateProfileMock.mockClear()
  })

  it("sorts managed profiles with the current profile first", () => {
    expect(getManagedAgentProfiles().map((profile) => profile.id)).toEqual([
      "profile-current",
      "profile-default",
      "profile-disabled",
    ])
  })

  it("resolves selections by exact match and unique prefix across all profiles", () => {
    const profiles = getManagedAgentProfiles()

    expect(
      resolveManagedAgentProfileSelection(profiles, "profile-cur"),
    ).toEqual({
      selectedProfile: profiles[0],
    })
    expect(resolveManagedAgentProfileSelection(profiles, "Main Agent")).toEqual(
      {
        selectedProfile: profiles[1],
      },
    )
  })

  it("creates agent profiles through one shared validation path", () => {
    const result = createManagedAgentProfile({
      displayName: "Ops Agent",
      connectionType: "acp",
      connectionCommand: " npx ",
      connectionArgs: "ops --stdio",
      enabled: false,
      autoSpawn: true,
    })

    expect(result).toMatchObject({
      success: true,
      profile: {
        displayName: "Ops Agent",
        enabled: false,
        autoSpawn: true,
        role: "delegation-target",
        isAgentTarget: true,
        isUserProfile: false,
        connection: {
          type: "acp",
          command: "npx",
          args: ["ops", "--stdio"],
        },
      },
    })
  })

  it("keeps built-in remote updates on the restricted shared path by default", () => {
    const result = updateManagedAgentProfile("profile-default", {
      displayName: "Renamed Built-in",
      guidelines: "Keep answers brief.",
      enabled: false,
    })

    expect(result).toMatchObject({
      success: true,
      profile: {
        id: "profile-default",
        displayName: "Main Agent",
        guidelines: "Keep answers brief.",
        enabled: false,
      },
    })
  })

  it("allows desktop-style full built-in updates when explicitly requested", () => {
    const result = updateManagedAgentProfile(
      "profile-default",
      {
        displayName: "Renamed Built-in",
        systemPrompt: "Use the fallback prompt.",
      },
      { allowBuiltInFieldUpdates: true },
    )

    expect(result).toMatchObject({
      success: true,
      profile: {
        id: "profile-default",
        displayName: "Renamed Built-in",
        name: "Renamed Built-in",
        systemPrompt: "Use the fallback prompt.",
      },
    })
  })

  it("toggles agent-profile enablement through one helper", () => {
    const result = toggleManagedAgentProfileEnabled("profile-disabled")

    expect(result).toMatchObject({
      success: true,
      profile: {
        id: "profile-disabled",
        enabled: true,
      },
    })
  })

  it("deletes the current profile and activates the shared fallback profile", () => {
    const result = deleteManagedAgentProfile("profile-current")

    expect(result).toEqual({
      success: true,
      activatedProfile: profileStore.profiles.find(
        (profile) => profile.id === "profile-default",
      ),
    })
    expect(deleteProfileMock).toHaveBeenCalledWith("profile-current")
    expect(activateAgentProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "profile-default" }),
    )
  })
})
