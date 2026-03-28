import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentProfile } from "@shared/types"

const {
  activateAgentProfileByIdMock,
  configGetMock,
  createMock,
  deleteMock,
  exportProfileMock,
  getAllMock,
  getAgentTargetsMock,
  getByIdMock,
  getByRoleMock,
  getCurrentProfileMock,
  getEnabledAgentTargetsMock,
  getExternalAgentsMock,
  getRuntimeToolNamesMock,
  getUserProfilesMock,
  importProfileMock,
  updateMock,
} = vi.hoisted(() => ({
  activateAgentProfileByIdMock: vi.fn(),
  configGetMock: vi.fn(),
  createMock: vi.fn(),
  deleteMock: vi.fn(),
  exportProfileMock: vi.fn(),
  getAllMock: vi.fn(),
  getAgentTargetsMock: vi.fn(),
  getByIdMock: vi.fn(),
  getByRoleMock: vi.fn(),
  getCurrentProfileMock: vi.fn(),
  getEnabledAgentTargetsMock: vi.fn(),
  getExternalAgentsMock: vi.fn(),
  getRuntimeToolNamesMock: vi.fn(),
  getUserProfilesMock: vi.fn(),
  importProfileMock: vi.fn(),
  updateMock: vi.fn(),
}))

vi.mock("./agent-profile-activation", () => ({
  activateAgentProfileById: activateAgentProfileByIdMock,
}))

vi.mock("./config", () => ({
  configStore: {
    get: configGetMock,
  },
}))

vi.mock("./runtime-tool-definitions", () => ({
  getRuntimeToolNames: getRuntimeToolNamesMock,
}))

vi.mock("./agent-profile-service", () => ({
  buildLegacyAgentProfileCreateData: ({
    allServerNames,
    guidelines,
    name,
    runtimeToolNames,
    systemPrompt,
  }: {
    allServerNames: string[]
    guidelines: string
    name: string
    runtimeToolNames: string[]
    systemPrompt?: string
  }) => ({
    name,
    displayName: name,
    guidelines,
    systemPrompt,
    connection: { type: "internal" as const },
    role: "delegation-target" as const,
    enabled: true,
    isUserProfile: false,
    isAgentTarget: true,
    toolConfig: {
      disabledServers: allServerNames,
      disabledTools: runtimeToolNames,
      allServersDisabledByDefault: true,
    },
  }),
  buildLegacyAgentProfileUpdates: (input: {
    guidelines?: string
    name?: string
    systemPrompt?: string
  }) => ({
    ...(Object.prototype.hasOwnProperty.call(input, "name") && {
      displayName: input.name,
    }),
    ...(Object.prototype.hasOwnProperty.call(input, "guidelines") && {
      guidelines: input.guidelines,
    }),
    ...(Object.prototype.hasOwnProperty.call(input, "systemPrompt") && {
      systemPrompt: input.systemPrompt,
    }),
  }),
  agentProfileService: {
    create: createMock,
    delete: deleteMock,
    exportProfile: exportProfileMock,
    getAll: getAllMock,
    getAgentTargets: getAgentTargetsMock,
    getById: getByIdMock,
    getByRole: getByRoleMock,
    getCurrentProfile: getCurrentProfileMock,
    getEnabledAgentTargets: getEnabledAgentTargetsMock,
    getExternalAgents: getExternalAgentsMock,
    getUserProfiles: getUserProfilesMock,
    importProfile: importProfileMock,
    update: updateMock,
  },
  serializeAgentProfileAsLegacyProfile: (profile: AgentProfile) => ({
    id: profile.id,
    name: profile.displayName ?? profile.name,
    guidelines: profile.guidelines || "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    isDefault: profile.isDefault,
    modelConfig: profile.modelConfig,
    mcpServerConfig: profile.toolConfig
      ? {
          disabledServers: profile.toolConfig.disabledServers,
          disabledTools: profile.toolConfig.disabledTools,
          allServersDisabledByDefault:
            profile.toolConfig.allServersDisabledByDefault,
          enabledServers: profile.toolConfig.enabledServers,
          enabledRuntimeTools: profile.toolConfig.enabledRuntimeTools,
        }
      : undefined,
    skillsConfig: profile.skillsConfig,
    systemPrompt: profile.systemPrompt,
  }),
}))

import {
  createManagedAgentProfile,
  createManagedLegacyProfile,
  deleteManagedAgentProfile,
  deleteManagedLegacyProfile,
  exportManagedAgentProfile,
  getManagedAgentTargets,
  getManagedAgentProfile,
  getManagedAgentProfiles,
  getManagedCurrentAgentProfile,
  getManagedCurrentLegacyProfile,
  getManagedEnabledAgentTargets,
  getManagedExternalAgents,
  getManagedLegacyProfile,
  getManagedLegacyProfiles,
  getManagedUserAgentProfiles,
  importManagedAgentProfile,
  resolveManagedAgentProfileSelection,
  setManagedCurrentAgentProfile,
  setManagedCurrentLegacyProfile,
  toggleManagedAgentProfileEnabled,
  updateManagedLegacyProfile,
  updateManagedAgentProfile,
} from "./agent-profile-management"

function createProfile(
  id: string,
  overrides: Partial<AgentProfile> = {},
): AgentProfile {
  return {
    id,
    name: overrides.name ?? id,
    displayName: overrides.displayName ?? id,
    connection: overrides.connection ?? { type: "internal" },
    enabled: overrides.enabled ?? true,
    createdAt: overrides.createdAt ?? 1,
    updatedAt: overrides.updatedAt ?? 2,
    ...overrides,
  }
}

describe("agent profile management", () => {
  beforeEach(() => {
    activateAgentProfileByIdMock.mockReset()
    configGetMock.mockReset()
    createMock.mockReset()
    deleteMock.mockReset()
    exportProfileMock.mockReset()
    getAllMock.mockReset()
    getAgentTargetsMock.mockReset()
    getByIdMock.mockReset()
    getByRoleMock.mockReset()
    getCurrentProfileMock.mockReset()
    getEnabledAgentTargetsMock.mockReset()
    getExternalAgentsMock.mockReset()
    getRuntimeToolNamesMock.mockReset()
    getUserProfilesMock.mockReset()
    importProfileMock.mockReset()
    updateMock.mockReset()
  })

  it("lists and loads managed agent profiles through one helper", () => {
    const allProfiles = [createProfile("main-agent"), createProfile("ops-agent")]
    const delegationTargets = [allProfiles[1]]

    getAllMock.mockReturnValue(allProfiles)
    getByRoleMock.mockReturnValue(delegationTargets)
    getByIdMock.mockReturnValue(allProfiles[0])

    expect(getManagedAgentProfiles()).toEqual(allProfiles)
    expect(getManagedAgentProfiles({ role: "delegation-target" })).toEqual(
      delegationTargets,
    )
    expect(getManagedAgentProfiles({ role: "invalid-role" })).toEqual([])
    expect(getManagedAgentProfile("main-agent")).toEqual(allProfiles[0])
  })

  it("shares current-profile catalogs and switching through one helper", () => {
    const currentProfile = createProfile("current-agent", {
      displayName: "Current Agent",
    })
    const userProfile = createProfile("user-agent", {
      displayName: "User Agent",
      isUserProfile: true,
    })
    const enabledTarget = createProfile("ops-agent", {
      displayName: "Ops Agent",
      role: "delegation-target",
    })
    const externalAgent = createProfile("remote-agent", {
      displayName: "Remote Agent",
      role: "external-agent",
      connection: {
        type: "remote",
        baseUrl: "https://agent.example.com",
      },
    })

    getUserProfilesMock.mockReturnValue([userProfile])
    getAgentTargetsMock.mockReturnValue([enabledTarget])
    getEnabledAgentTargetsMock.mockReturnValue([enabledTarget])
    getExternalAgentsMock.mockReturnValue([externalAgent])
    getCurrentProfileMock.mockReturnValue(currentProfile)
    getByIdMock.mockImplementation((profileId: string) => {
      switch (profileId) {
        case userProfile.id:
          return userProfile
        case enabledTarget.id:
          return enabledTarget
        default:
          return undefined
      }
    })
    activateAgentProfileByIdMock.mockReturnValue(enabledTarget)

    expect(getManagedUserAgentProfiles()).toEqual([userProfile])
    expect(getManagedAgentTargets()).toEqual([enabledTarget])
    expect(getManagedEnabledAgentTargets()).toEqual([enabledTarget])
    expect(getManagedExternalAgents()).toEqual([externalAgent])
    expect(getManagedCurrentAgentProfile()).toEqual(currentProfile)
    expect(setManagedCurrentAgentProfile(enabledTarget.id)).toEqual({
      success: true,
      profile: enabledTarget,
    })
    expect(activateAgentProfileByIdMock).toHaveBeenCalledWith(enabledTarget.id)
  })

  it("adapts legacy desktop profile reads and switching through shared helpers", () => {
    const currentProfile = createProfile("current-agent", {
      displayName: "Current Agent",
      guidelines: "Stay current",
      toolConfig: {
        disabledServers: ["github"],
        enabledServers: ["filesystem"],
      },
    })
    const userProfile = createProfile("user-agent", {
      displayName: "User Agent",
      guidelines: "Handle inbox",
      isUserProfile: true,
    })

    getUserProfilesMock.mockReturnValue([userProfile])
    getByIdMock.mockImplementation((profileId: string) => {
      if (profileId === currentProfile.id) {
        return currentProfile
      }
      if (profileId === userProfile.id) {
        return userProfile
      }
      return undefined
    })
    getCurrentProfileMock.mockReturnValue(currentProfile)
    activateAgentProfileByIdMock.mockReturnValue(currentProfile)

    expect(getManagedLegacyProfiles()).toEqual([
      {
        id: userProfile.id,
        name: "User Agent",
        guidelines: "Handle inbox",
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        isDefault: userProfile.isDefault,
        mcpServerConfig: undefined,
        modelConfig: undefined,
        skillsConfig: undefined,
        systemPrompt: undefined,
      },
    ])
    expect(getManagedLegacyProfile(userProfile.id)).toEqual({
      id: userProfile.id,
      name: "User Agent",
      guidelines: "Handle inbox",
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
      isDefault: userProfile.isDefault,
      mcpServerConfig: undefined,
      modelConfig: undefined,
      skillsConfig: undefined,
      systemPrompt: undefined,
    })
    expect(getManagedCurrentLegacyProfile()).toEqual({
      id: currentProfile.id,
      name: "Current Agent",
      guidelines: "Stay current",
      createdAt: currentProfile.createdAt,
      updatedAt: currentProfile.updatedAt,
      isDefault: currentProfile.isDefault,
      mcpServerConfig: {
        disabledServers: ["github"],
        disabledTools: undefined,
        allServersDisabledByDefault: undefined,
        enabledServers: ["filesystem"],
        enabledRuntimeTools: undefined,
      },
      modelConfig: undefined,
      skillsConfig: undefined,
      systemPrompt: undefined,
    })
    expect(setManagedCurrentLegacyProfile(currentProfile.id)).toEqual({
      success: true,
      profile: {
        id: currentProfile.id,
        name: "Current Agent",
        guidelines: "Stay current",
        createdAt: currentProfile.createdAt,
        updatedAt: currentProfile.updatedAt,
        isDefault: currentProfile.isDefault,
        mcpServerConfig: {
          disabledServers: ["github"],
          disabledTools: undefined,
          allServersDisabledByDefault: undefined,
          enabledServers: ["filesystem"],
          enabledRuntimeTools: undefined,
        },
        modelConfig: undefined,
        skillsConfig: undefined,
        systemPrompt: undefined,
      },
    })
  })

  it("creates agent profiles from flattened payloads with shared defaults", () => {
    createMock.mockImplementation((profile: Omit<AgentProfile, "id" | "createdAt" | "updatedAt">) =>
      createProfile("created-agent", profile),
    )

    const result = createManagedAgentProfile({
      displayName: "  Remote Ops  ",
      description: "  Handles remote tasks  ",
      connectionType: "remote",
      connectionBaseUrl: " https://agent.example.com/base ",
      avatarDataUrl: " data:image/png;base64,abc ",
      enabled: false,
      autoSpawn: true,
    })

    expect(createMock).toHaveBeenCalledWith({
      name: "Remote Ops",
      displayName: "Remote Ops",
      description: "Handles remote tasks",
      avatarDataUrl: "data:image/png;base64,abc",
      systemPrompt: undefined,
      guidelines: undefined,
      properties: undefined,
      modelConfig: undefined,
      toolConfig: undefined,
      skillsConfig: undefined,
      connection: {
        type: "remote",
        baseUrl: "https://agent.example.com/base",
      },
      isStateful: undefined,
      enabled: false,
      role: "delegation-target",
      isUserProfile: false,
      isAgentTarget: true,
      isDefault: undefined,
      autoSpawn: true,
    })
    expect(result).toEqual({
      success: true,
      profile: createProfile("created-agent", {
        name: "Remote Ops",
        displayName: "Remote Ops",
        description: "Handles remote tasks",
        avatarDataUrl: "data:image/png;base64,abc",
        connection: {
          type: "remote",
          baseUrl: "https://agent.example.com/base",
        },
        enabled: false,
        role: "delegation-target",
        isUserProfile: false,
        isAgentTarget: true,
        autoSpawn: true,
      }),
    })
  })

  it("routes legacy desktop profile create, update, and delete through shared management", () => {
    configGetMock.mockReturnValue({
      mcpConfig: {
        mcpServers: {
          github: {},
          filesystem: {},
        },
      },
    })
    getRuntimeToolNamesMock.mockReturnValue(["respond_to_user", "mark_done"])
    createMock.mockImplementation(
      (profile: Omit<AgentProfile, "id" | "createdAt" | "updatedAt">) =>
        createProfile("legacy-created", profile),
    )

    expect(
      createManagedLegacyProfile({
        name: "  Ops Legacy  ",
        guidelines: "  Keep scope tight  ",
        systemPrompt: "  Use logs first  ",
      }),
    ).toEqual({
      success: true,
      profile: {
        id: "legacy-created",
        name: "Ops Legacy",
        guidelines: "Keep scope tight",
        createdAt: 1,
        updatedAt: 2,
        isDefault: undefined,
        mcpServerConfig: {
          disabledServers: ["github", "filesystem"],
          disabledTools: ["respond_to_user", "mark_done"],
          allServersDisabledByDefault: true,
          enabledServers: undefined,
          enabledRuntimeTools: undefined,
        },
        modelConfig: undefined,
        skillsConfig: undefined,
        systemPrompt: "Use logs first",
      },
    })
    expect(createMock).toHaveBeenCalledWith({
      name: "Ops Legacy",
      displayName: "Ops Legacy",
      guidelines: "Keep scope tight",
      systemPrompt: "Use logs first",
      connection: { type: "internal" },
      role: "delegation-target",
      enabled: true,
      isUserProfile: false,
      isAgentTarget: true,
      toolConfig: {
        disabledServers: ["github", "filesystem"],
        disabledTools: ["respond_to_user", "mark_done"],
        allServersDisabledByDefault: true,
      },
    })

    const updatedProfile = createProfile("legacy-created", {
      displayName: "Ops Updated",
      guidelines: "Use traces",
      systemPrompt: "Prefer remote tools",
    })
    getByIdMock.mockReturnValue(updatedProfile)
    updateMock.mockReturnValue(updatedProfile)

    expect(
      updateManagedLegacyProfile("legacy-created", {
        name: "  Ops Updated  ",
        guidelines: "  Use traces  ",
        systemPrompt: "  Prefer remote tools  ",
      }),
    ).toEqual({
      success: true,
      profile: {
        id: "legacy-created",
        name: "Ops Updated",
        guidelines: "Use traces",
        createdAt: 1,
        updatedAt: 2,
        isDefault: undefined,
        mcpServerConfig: undefined,
        modelConfig: undefined,
        skillsConfig: undefined,
        systemPrompt: "Prefer remote tools",
      },
    })
    expect(updateMock).toHaveBeenCalledWith("legacy-created", {
      displayName: "Ops Updated",
      guidelines: "Use traces",
      systemPrompt: "Prefer remote tools",
    })

    deleteMock.mockReturnValue(true)
    expect(deleteManagedLegacyProfile("legacy-created")).toBe(true)
    expect(deleteMock).toHaveBeenCalledWith("legacy-created")
  })

  it("updates agent profiles with direct connection payloads and normalized fields", () => {
    const existingProfile = createProfile("profile-1", {
      displayName: "Old Name",
      connection: { type: "acp", command: "old-command", args: ["--old"] },
      autoSpawn: false,
    })
    const updatedProfile = createProfile("profile-1", {
      displayName: "New Name",
      description: "Updated description",
      connection: {
        type: "acp",
        command: "codex-acp",
        args: ["serve", "--json"],
        cwd: "/tmp/workspace",
      },
      autoSpawn: true,
      avatarDataUrl: null,
    })

    getByIdMock.mockReturnValue(existingProfile)
    updateMock.mockReturnValue(updatedProfile)

    const result = updateManagedAgentProfile("profile-1", {
      displayName: "  New Name  ",
      description: " Updated description ",
      avatarDataUrl: null,
      connection: {
        type: "acp",
        command: " codex-acp ",
        args: ["serve", " --json "],
        cwd: " /tmp/workspace ",
      },
      autoSpawn: true,
    })

    expect(updateMock).toHaveBeenCalledWith("profile-1", {
      displayName: "New Name",
      description: "Updated description",
      avatarDataUrl: null,
      connection: {
        type: "acp",
        command: "codex-acp",
        args: ["serve", "--json"],
        cwd: "/tmp/workspace",
      },
      autoSpawn: true,
    })
    expect(result).toEqual({
      success: true,
      profile: updatedProfile,
    })
  })

  it("toggles and deletes agent profiles through the shared helper", () => {
    const existingProfile = createProfile("profile-1", {
      enabled: true,
    })
    const toggledProfile = createProfile("profile-1", {
      enabled: false,
    })

    getByIdMock.mockReturnValue(existingProfile)
    updateMock.mockReturnValue(toggledProfile)
    deleteMock.mockReturnValue(true)

    expect(toggleManagedAgentProfileEnabled("profile-1")).toEqual({
      success: true,
      profile: toggledProfile,
    })
    expect(updateMock).toHaveBeenCalledWith("profile-1", {
      enabled: false,
    })

    expect(deleteManagedAgentProfile("profile-1")).toEqual({
      success: true,
      id: "profile-1",
    })
    expect(deleteMock).toHaveBeenCalledWith("profile-1")
  })

  it("exports and imports agent profiles through the shared helper", () => {
    const profile = createProfile("ops-agent", {
      displayName: "Ops Agent",
    })
    const importedProfile = createProfile("imported-agent", {
      displayName: "Imported Agent",
    })

    getByIdMock.mockReturnValue(profile)
    exportProfileMock.mockReturnValue('{\n  "name": "Ops Agent"\n}')
    importProfileMock.mockReturnValue(importedProfile)

    expect(exportManagedAgentProfile("ops-agent")).toEqual({
      success: true,
      profile,
      profileJson: '{\n  "name": "Ops Agent"\n}',
    })
    expect(exportProfileMock).toHaveBeenCalledWith("ops-agent")

    expect(importManagedAgentProfile('{"name":"Imported Agent"}')).toEqual({
      success: true,
      profile: importedProfile,
    })
    expect(importProfileMock).toHaveBeenCalledWith(
      '{"name":"Imported Agent"}',
    )
  })

  it("reports invalid inputs, missing profiles, and protected deletes explicitly", () => {
    expect(
      createManagedAgentProfile({
        displayName: "   ",
      }),
    ).toEqual({
      success: false,
      errorCode: "invalid_input",
      error: "displayName is required and must be a non-empty string",
    })

    getByIdMock.mockReturnValue(undefined)
    expect(updateManagedAgentProfile("missing", { enabled: true })).toEqual({
      success: false,
      errorCode: "not_found",
      error: "Agent profile not found: missing",
    })

    expect(importManagedAgentProfile("   ")).toEqual({
      success: false,
      errorCode: "invalid_input",
      error: "profileJson is required and must be a non-empty string",
    })

    importProfileMock.mockImplementation(() => {
      throw new Error(
        "Failed to import profile: Invalid profile data: missing or invalid name",
      )
    })
    expect(importManagedAgentProfile("{}")).toEqual({
      success: false,
      errorCode: "invalid_input",
      error:
        "Failed to import profile: Invalid profile data: missing or invalid name",
    })

    const builtInProfile = createProfile("main-agent", {
      isBuiltIn: true,
    })
    getByIdMock.mockReturnValue(builtInProfile)
    expect(deleteManagedAgentProfile("main-agent")).toEqual({
      success: false,
      errorCode: "delete_forbidden",
      error: "Cannot delete built-in agent profiles",
    })

    getByIdMock.mockReturnValue(
      createProfile("disabled-agent", {
        enabled: false,
      }),
    )
    expect(setManagedCurrentAgentProfile("disabled-agent")).toEqual({
      success: false,
      errorCode: "invalid_input",
      error: "Agent profile is disabled: disabled-agent",
    })
  })

  it("reuses shared id/name/display-name selection rules for agent management", () => {
    const profiles = [
      createProfile("main-agent", {
        name: "main-agent",
        displayName: "Main Agent",
      }),
      createProfile("ops-agent", {
        name: "ops-agent",
        displayName: "Operations Agent",
      }),
    ]

    expect(resolveManagedAgentProfileSelection(profiles, "Main")).toEqual({
      selectedProfile: profiles[0],
    })
    expect(resolveManagedAgentProfileSelection(profiles, "ops")).toEqual({
      selectedProfile: profiles[1],
    })
  })
})
