import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"

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

vi.mock("@shared/types", async () => await import("../shared/types"))
vi.mock("@shared/runtime-tool-names", async () => await import("../shared/runtime-tool-names"))

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
})