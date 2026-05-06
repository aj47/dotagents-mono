import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import { DEFAULT_AGENT_PROFILE_ENABLED } from "@dotagents/shared/agent-profile-mutations"

const mockPaths = vi.hoisted(() => ({
  globalAgentsFolder: "",
  userDataDir: "",
}))

const mockConfigStore = vi.hoisted(() => ({
  get: vi.fn(() => ({})),
  save: vi.fn(),
}))

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => mockPaths.userDataDir),
    getAppPath: vi.fn(() => mockPaths.userDataDir),
  },
}))

vi.mock("./config", () => ({
  configStore: mockConfigStore,
  globalAgentsFolder: mockPaths.globalAgentsFolder,
  resolveWorkspaceAgentsFolder: () => null,
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("agentProfileService skills", () => {
  const tempDirs: string[] = []

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-profile-service-"))
    tempDirs.push(tempDir)
    mockPaths.globalAgentsFolder = path.join(tempDir, ".agents")
    mockPaths.userDataDir = path.join(tempDir, "user-data")
  })

  afterEach(() => {
    while (tempDirs.length > 0) {
      fs.rmSync(tempDirs.pop()!, { recursive: true, force: true })
    }
  })

  it("resets explicit enabledSkillIds when toggling reaches all available skills", async () => {
    const { agentProfileService } = await import("./agent-profile-service")
    const profile = agentProfileService.getAll()[0]

    agentProfileService.updateProfileSkillsConfig(profile.id, {
      enabledSkillIds: ["skill-a"],
      allSkillsDisabledByDefault: true,
    })

    const updated = agentProfileService.toggleProfileSkill(profile.id, "skill-b", ["skill-a", "skill-b"])

    expect(updated?.skillsConfig).toEqual({
      enabledSkillIds: [],
      allSkillsDisabledByDefault: false,
    })
    expect(agentProfileService.hasAllSkillsEnabledByDefault(profile.id)).toBe(true)
    expect(agentProfileService.getEnabledSkillIdsForProfile(profile.id)).toBeNull()
  })

  it("imports profiles with shared internal delegation defaults", async () => {
    mockConfigStore.get.mockReturnValue({
      mcpConfig: {
        mcpServers: {
          filesystem: { command: "filesystem" },
          github: { command: "github" },
        },
      },
    })

    const { agentProfileService } = await import("./agent-profile-service")

    const profile = agentProfileService.importProfile(JSON.stringify({
      name: "Imported Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
    }))

    expect(profile).toMatchObject({
      name: "Imported Agent",
      displayName: "Imported Agent",
      guidelines: "Use sources.",
      systemPrompt: "Be precise.",
      connection: { type: "internal" },
      role: "delegation-target",
      enabled: DEFAULT_AGENT_PROFILE_ENABLED,
      isUserProfile: false,
      isAgentTarget: true,
      toolConfig: {
        disabledServers: ["filesystem", "github"],
        allServersDisabledByDefault: true,
      },
    })
    expect(profile.toolConfig?.disabledTools?.length).toBeGreaterThan(0)
  })
})
