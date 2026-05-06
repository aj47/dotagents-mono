import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsSkillsSource = readFileSync(new URL("./settings-skills.tsx", import.meta.url), "utf8")

describe("settings skills profile config", () => {
  it("uses shared profile skill enablement semantics", () => {
    expect(settingsSkillsSource).toContain("isSkillEnabledForProfile(skillId, currentProfile)")
    expect(settingsSkillsSource).not.toContain("currentProfile.skillsConfig.allSkillsDisabledByDefault")
    expect(settingsSkillsSource).not.toContain("currentProfile.skillsConfig.enabledSkillIds")
  })
})
