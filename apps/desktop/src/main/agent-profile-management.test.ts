import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentProfile } from "@shared/types"

const {
  createMock,
  deleteMock,
  getAllMock,
  getByIdMock,
  getByRoleMock,
  updateMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  deleteMock: vi.fn(),
  getAllMock: vi.fn(),
  getByIdMock: vi.fn(),
  getByRoleMock: vi.fn(),
  updateMock: vi.fn(),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    create: createMock,
    delete: deleteMock,
    getAll: getAllMock,
    getById: getByIdMock,
    getByRole: getByRoleMock,
    update: updateMock,
  },
}))

import {
  createManagedAgentProfile,
  deleteManagedAgentProfile,
  getManagedAgentProfile,
  getManagedAgentProfiles,
  resolveManagedAgentProfileSelection,
  toggleManagedAgentProfileEnabled,
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
    createMock.mockReset()
    deleteMock.mockReset()
    getAllMock.mockReset()
    getByIdMock.mockReset()
    getByRoleMock.mockReset()
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

    const builtInProfile = createProfile("main-agent", {
      isBuiltIn: true,
    })
    getByIdMock.mockReturnValue(builtInProfile)
    expect(deleteManagedAgentProfile("main-agent")).toEqual({
      success: false,
      errorCode: "delete_forbidden",
      error: "Cannot delete built-in agent profiles",
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
