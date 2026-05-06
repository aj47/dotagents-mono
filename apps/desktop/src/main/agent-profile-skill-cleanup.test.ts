import { afterEach, describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import type { AgentProfile, AgentSkill } from "@dotagents/core"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { writeAgentsSkillFile } from "./agents-files/skills"
import {
  cleanupInvalidSkillReferencesInLayers,
  cleanupInvalidSkillReferencesInProfiles,
} from "./agent-profile-skill-cleanup"

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-skill-cleanup-"))
}

function cleanupDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
}

function createProfile(id: string, enabledSkillIds: string[]): AgentProfile {
  const now = Date.now()
  return {
    id,
    name: id,
    displayName: id,
    enabled: true,
    connection: { type: "internal" },
    skillsConfig: { enabledSkillIds },
    createdAt: now,
    updatedAt: now,
  }
}

function createSkill(id: string): AgentSkill {
  const now = Date.now()
  return {
    id,
    name: id,
    description: `Skill ${id}`,
    instructions: `# ${id}`,
    createdAt: now,
    updatedAt: now,
    source: "local",
  }
}

describe("agent-profile-skill-cleanup", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    while (tempDirs.length > 0) {
      cleanupDir(tempDirs.pop()!)
    }
  })

  it("removes invalid skill IDs from in-memory profiles", () => {
    const profiles = [
      createProfile("agent-a", ["skill-1", "skill-missing"]),
      createProfile("agent-b", ["skill-2"]),
    ]

    const result = cleanupInvalidSkillReferencesInProfiles(profiles, ["skill-1", "skill-2"], 123)

    expect(result.updatedProfileIds).toEqual(["agent-a"])
    expect(result.removedReferenceCount).toBe(1)
    expect(result.profiles[0].skillsConfig?.enabledSkillIds).toEqual(["skill-1"])
    expect(result.profiles[0].updatedAt).toBe(123)
    expect(result.profiles[1].skillsConfig?.enabledSkillIds).toEqual(["skill-2"])
  })

  it("cleans stale skill references in both global and workspace layers", () => {
    const globalDir = createTempDir()
    const workspaceDir = createTempDir()
    tempDirs.push(globalDir, workspaceDir)

    const globalLayer = getAgentsLayerPaths(globalDir)
    const workspaceLayer = getAgentsLayerPaths(workspaceDir)
    fs.mkdirSync(path.join(globalLayer.agentsDir, "skills"), { recursive: true })
    fs.mkdirSync(path.join(workspaceLayer.agentsDir, "skills"), { recursive: true })

    writeAgentsProfileFiles(globalLayer, createProfile("global-agent", ["shared-skill", "missing-skill"]))
    writeAgentsProfileFiles(workspaceLayer, createProfile("workspace-agent", ["workspace-skill", "missing-skill"]))

    writeAgentsSkillFile(globalLayer, createSkill("shared-skill"))
    writeAgentsSkillFile(workspaceLayer, createSkill("workspace-skill"))

    const result = cleanupInvalidSkillReferencesInLayers(
      [globalLayer, workspaceLayer],
      ["shared-skill", "workspace-skill"],
      999,
    )

    expect(result.updatedProfileIds).toEqual(["global-agent", "workspace-agent"])
    expect(result.removedReferenceCount).toBe(2)

    expect(
      loadAgentProfilesLayer(globalLayer).profiles.find((profile) => profile.id === "global-agent")?.skillsConfig?.enabledSkillIds
    ).toEqual(["shared-skill"])
    expect(
      loadAgentProfilesLayer(workspaceLayer).profiles.find((profile) => profile.id === "workspace-agent")?.skillsConfig?.enabledSkillIds
    ).toEqual(["workspace-skill"])
  })
})
