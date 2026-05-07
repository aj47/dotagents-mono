import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-skills-client.ts", import.meta.url), "utf8")
const settingsSkillsSource = readFileSync(new URL("../pages/settings-skills.tsx", import.meta.url), "utf8")

describe("desktop skills renderer client", () => {
  it("centralizes desktop skill IPC channels behind shared skill request types", () => {
    expect(clientSource).toContain("SkillCreateRequest")
    expect(clientSource).toContain("SkillUpdateRequest")
    expect(clientSource).toContain("SkillDeleteMultipleResult")
    expect(clientSource).toContain("tipcClient.getSkills()")
    expect(clientSource).toContain("tipcClient.createSkill(request)")
    expect(clientSource).toContain("tipcClient.updateSkill(request)")
    expect(clientSource).toContain("tipcClient.deleteSkill({ id })")
    expect(clientSource).toContain("tipcClient.deleteSkills({ ids })")
    expect(clientSource).toContain("tipcClient.toggleProfileSkill({ profileId, skillId })")
    expect(clientSource).toContain("tipcClient.importSkillFromGitHub({ repoIdentifier })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps the settings skills UI off direct skill IPC channels", () => {
    expect(settingsSkillsSource).toContain("desktopSkillsClient.getSkills()")
    expect(settingsSkillsSource).toContain("desktopSkillsClient.createSkill({ name, description, instructions })")
    expect(settingsSkillsSource).toContain("desktopSkillsClient.updateSkill({ id, name, description, instructions })")
    expect(settingsSkillsSource).toContain("desktopSkillsClient.deleteSkill(id)")
    expect(settingsSkillsSource).toContain("desktopSkillsClient.deleteSkills(ids)")
    expect(settingsSkillsSource).toContain("desktopSkillsClient.toggleProfileSkill(profileId, skillId)")
    expect(settingsSkillsSource).toContain("desktopSkillsClient.importSkillFromGitHub(repoIdentifier)")
    expect(settingsSkillsSource).not.toContain("tipcClient.getSkills()")
    expect(settingsSkillsSource).not.toContain("tipcClient.createSkill(")
    expect(settingsSkillsSource).not.toContain("tipcClient.updateSkill(")
    expect(settingsSkillsSource).not.toContain("tipcClient.deleteSkill(")
    expect(settingsSkillsSource).not.toContain("tipcClient.deleteSkills(")
    expect(settingsSkillsSource).not.toContain("tipcClient.toggleProfileSkill(")
    expect(settingsSkillsSource).not.toContain("tipcClient.importSkillFromGitHub(")
  })
})
