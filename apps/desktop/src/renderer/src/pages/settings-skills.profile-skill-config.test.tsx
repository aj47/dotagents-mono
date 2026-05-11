import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsSkillsSource = readFileSync(new URL("./settings-skills.tsx", import.meta.url), "utf8")

describe("settings skills profile config", () => {
  it("uses shared profile skill enablement semantics", () => {
    expect(settingsSkillsSource).toContain("isSkillEnabledForProfile(skillId, currentProfile)")
    expect(settingsSkillsSource).toContain("sortSkillsByProfileEnablement(skills, (skill) => isSkillEnabledForCurrentProfile(skill.id))")
    expect(settingsSkillsSource).not.toContain("currentProfile.skillsConfig.allSkillsDisabledByDefault")
    expect(settingsSkillsSource).not.toContain("currentProfile.skillsConfig.enabledSkillIds")
  })

  it("uses shared skill editor presentation for create and edit dialogs", () => {
    expect(settingsSkillsSource).toContain("APP_SHELL_SKILL_EDITOR_PRESENTATION.createDescription")
    expect(settingsSkillsSource).toContain("APP_SHELL_SKILL_EDITOR_PRESENTATION.editDescription")
    expect(settingsSkillsSource).toContain("APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.placeholder")
    expect(settingsSkillsSource).toContain("APP_SHELL_SKILL_EDITOR_PRESENTATION.pending.creatingLabel")
    expect(settingsSkillsSource).toContain("APP_SHELL_SKILL_EDITOR_PRESENTATION.pending.savingLabel")
    expect(settingsSkillsSource).not.toContain("Create a skill with specialized instructions for the AI agent.")
    expect(settingsSkillsSource).not.toContain("placeholder=\"e.g., Code Review Expert\"")
  })
})
