import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentSkill } from "../shared/types"

const {
  cleanupInvalidSkillReferencesInLayersMock,
  createSkillMock,
  deleteSkillMock,
  enableSkillForCurrentProfileMock,
  existsSyncMock,
  exportSkillToMarkdownMock,
  getAgentsLayerPathsMock,
  getSkillCanonicalFilePathMock,
  getSkillMock,
  getSkillsMock,
  importSkillFromGitHubMock,
  importSkillFromMarkdownMock,
  mkdirSyncMock,
  reloadMock,
  resolveWorkspaceAgentsFolderMock,
  scanSkillsFolderMock,
  updateSkillMock,
  writeFileSyncMock,
} = vi.hoisted(() => ({
  cleanupInvalidSkillReferencesInLayersMock: vi.fn(),
  createSkillMock: vi.fn(),
  deleteSkillMock: vi.fn(),
  enableSkillForCurrentProfileMock: vi.fn(),
  existsSyncMock: vi.fn(),
  exportSkillToMarkdownMock: vi.fn(),
  getAgentsLayerPathsMock: vi.fn((agentsDir: string) => ({ agentsDir })),
  getSkillCanonicalFilePathMock: vi.fn(),
  getSkillMock: vi.fn(),
  getSkillsMock: vi.fn(),
  importSkillFromGitHubMock: vi.fn(),
  importSkillFromMarkdownMock: vi.fn(),
  mkdirSyncMock: vi.fn(),
  reloadMock: vi.fn(),
  resolveWorkspaceAgentsFolderMock: vi.fn(),
  scanSkillsFolderMock: vi.fn(),
  updateSkillMock: vi.fn(),
  writeFileSyncMock: vi.fn(),
}))

vi.mock("fs", () => ({
  default: {
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    writeFileSync: writeFileSyncMock,
  },
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    enableSkillForCurrentProfile: enableSkillForCurrentProfileMock,
    reload: reloadMock,
  },
}))

vi.mock("./skills-service", () => ({
  skillsService: {
    createSkill: createSkillMock,
    deleteSkill: deleteSkillMock,
    exportSkillToMarkdown: exportSkillToMarkdownMock,
    getSkill: getSkillMock,
    getSkillCanonicalFilePath: getSkillCanonicalFilePathMock,
    getSkills: getSkillsMock,
    importSkillFromGitHub: importSkillFromGitHubMock,
    importSkillFromMarkdown: importSkillFromMarkdownMock,
    scanSkillsFolder: scanSkillsFolderMock,
    updateSkill: updateSkillMock,
  },
}))

vi.mock("./config", () => ({
  globalAgentsFolder: "/global/.agents",
  resolveWorkspaceAgentsFolder: resolveWorkspaceAgentsFolderMock,
}))

vi.mock("./agents-files/modular-config", () => ({
  getAgentsLayerPaths: getAgentsLayerPathsMock,
}))

vi.mock("./agent-profile-skill-cleanup", () => ({
  cleanupInvalidSkillReferencesInLayers:
    cleanupInvalidSkillReferencesInLayersMock,
}))

import {
  createManagedSkill,
  deleteManagedSkill,
  deleteManagedSkills,
  ensureManagedSkillFile,
  getManagedSkillsCatalog,
  importManagedSkillFromGitHub,
  resolveManagedSkillSelection,
  updateManagedSkill,
} from "./skill-management"

function createSkill(
  id: string,
  name: string,
  overrides: Partial<AgentSkill> = {},
): AgentSkill {
  return {
    id,
    name,
    description: `${name} description`,
    instructions: `# ${name}`,
    createdAt: 1,
    updatedAt: 2,
    source: "local",
    ...overrides,
  }
}

describe("skill management", () => {
  beforeEach(() => {
    cleanupInvalidSkillReferencesInLayersMock.mockReset()
    createSkillMock.mockReset()
    deleteSkillMock.mockReset()
    enableSkillForCurrentProfileMock.mockReset()
    existsSyncMock.mockReset()
    exportSkillToMarkdownMock.mockReset()
    getAgentsLayerPathsMock.mockClear()
    getSkillCanonicalFilePathMock.mockReset()
    getSkillMock.mockReset()
    getSkillsMock.mockReset()
    importSkillFromGitHubMock.mockReset()
    importSkillFromMarkdownMock.mockReset()
    mkdirSyncMock.mockReset()
    reloadMock.mockReset()
    resolveWorkspaceAgentsFolderMock.mockReset()
    scanSkillsFolderMock.mockReset()
    updateSkillMock.mockReset()
    writeFileSyncMock.mockReset()
  })

  it("sorts the shared catalog and resolves exact or unique skill selections", () => {
    const alpha = createSkill("skill-alpha", "Alpha")
    const beta = createSkill("skill-beta", "Beta")
    const betaTools = createSkill("skill-beta-tools", "Beta Tools")

    getSkillsMock.mockReturnValue([betaTools, beta, alpha])

    const sortedSkills = getManagedSkillsCatalog()
    expect(sortedSkills.map((skill) => skill.id)).toEqual([
      "skill-alpha",
      "skill-beta",
      "skill-beta-tools",
    ])

    expect(resolveManagedSkillSelection(sortedSkills, "Beta")).toEqual({
      selectedSkill: beta,
    })
    expect(resolveManagedSkillSelection(sortedSkills, "skill-beta-t")).toEqual({
      selectedSkill: betaTools,
    })
    expect(resolveManagedSkillSelection(sortedSkills, "skill-beta")).toEqual({
      selectedSkill: beta,
    })
    expect(resolveManagedSkillSelection(sortedSkills, "bet")).toEqual({
      ambiguousSkills: [beta, betaTools],
    })
  })

  it("creates and updates skills through one shared validation and enablement path", () => {
    const createdSkill = createSkill("skill-alpha", "Alpha")
    const updatedSkill = createSkill("skill-alpha", "Alpha Updated")

    createSkillMock.mockReturnValue(createdSkill)
    updateSkillMock.mockReturnValue(updatedSkill)

    expect(
      createManagedSkill({
        name: " Alpha ",
        description: "  Shared skill  ",
        instructions: "# Alpha",
      }),
    ).toEqual(createdSkill)
    expect(createSkillMock).toHaveBeenCalledWith(
      "Alpha",
      "Shared skill",
      "# Alpha",
    )
    expect(enableSkillForCurrentProfileMock).toHaveBeenCalledWith("skill-alpha")

    expect(
      updateManagedSkill("skill-alpha", {
        name: " Alpha Updated ",
        description: "  Updated description  ",
      }),
    ).toEqual(updatedSkill)
    expect(updateSkillMock).toHaveBeenCalledWith("skill-alpha", {
      name: "Alpha Updated",
      description: "Updated description",
      instructions: undefined,
    })

    expect(() =>
      createManagedSkill({
        name: " ",
        description: "",
        instructions: "# Missing",
      }),
    ).toThrow("Skill name must be a non-empty string")
  })

  it("cleans up stale profile skill references after successful deletes", async () => {
    getSkillsMock.mockReturnValue([createSkill("skill-beta", "Beta")])
    resolveWorkspaceAgentsFolderMock.mockReturnValue("/workspace/.agents")
    cleanupInvalidSkillReferencesInLayersMock.mockReturnValue({
      updatedProfileIds: ["profile-1", "profile-2"],
      removedReferenceCount: 3,
    })

    deleteSkillMock.mockReturnValueOnce(true)
    const singleDelete = await deleteManagedSkill("skill-alpha")

    expect(singleDelete).toEqual({
      success: true,
      cleanupSummary: {
        updatedProfileIds: ["profile-1", "profile-2"],
        removedReferenceCount: 3,
      },
    })
    expect(cleanupInvalidSkillReferencesInLayersMock).toHaveBeenCalledWith(
      [{ agentsDir: "/global/.agents" }, { agentsDir: "/workspace/.agents" }],
      ["skill-beta"],
    )
    expect(reloadMock).toHaveBeenCalledTimes(1)

    cleanupInvalidSkillReferencesInLayersMock.mockReturnValue({
      updatedProfileIds: [],
      removedReferenceCount: 0,
    })
    getSkillsMock.mockReturnValue([createSkill("skill-gamma", "Gamma")])
    deleteSkillMock.mockReset()
    deleteSkillMock.mockReturnValueOnce(true)
    deleteSkillMock.mockReturnValueOnce(false)

    const bulkDelete = await deleteManagedSkills(["skill-beta", "missing"])
    expect(bulkDelete).toEqual({
      results: [
        { id: "skill-beta", success: true },
        { id: "missing", success: false },
      ],
      cleanupSummary: {
        updatedProfileIds: [],
        removedReferenceCount: 0,
      },
    })
  })

  it("bootstraps missing canonical skill files for desktop reveal and CLI path flows", () => {
    const alpha = createSkill("skill-alpha", "Alpha")

    getSkillMock.mockReturnValue(alpha)
    getSkillCanonicalFilePathMock.mockReturnValue(
      "/tmp/.agents/skills/skill-alpha/SKILL.md",
    )
    exportSkillToMarkdownMock.mockReturnValue("# Alpha")
    existsSyncMock.mockReturnValue(false)

    expect(ensureManagedSkillFile("skill-alpha")).toEqual({
      success: true,
      skill: alpha,
      path: "/tmp/.agents/skills/skill-alpha/SKILL.md",
    })
    expect(mkdirSyncMock).toHaveBeenCalledWith(
      "/tmp/.agents/skills/skill-alpha",
      { recursive: true },
    )
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      "/tmp/.agents/skills/skill-alpha/SKILL.md",
      "# Alpha",
      "utf8",
    )
  })

  it("auto-enables GitHub-imported skills through the shared helper", async () => {
    const importedSkill = createSkill("skill-github", "GitHub Skill", {
      source: "imported",
    })
    importSkillFromGitHubMock.mockResolvedValue({
      imported: [importedSkill],
      errors: [],
    })

    await expect(importManagedSkillFromGitHub("owner/repo")).resolves.toEqual({
      imported: [importedSkill],
      errors: [],
    })
    expect(enableSkillForCurrentProfileMock).toHaveBeenCalledWith(
      "skill-github",
    )
  })
})
