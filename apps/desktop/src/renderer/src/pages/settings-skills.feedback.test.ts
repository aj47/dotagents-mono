import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsSkillsSource = readFileSync(new URL("./settings-skills.tsx", import.meta.url), "utf8")

describe("desktop skills page failure feedback", () => {
  it("does not treat false single-skill delete results as success", () => {
    expect(settingsSkillsSource).toContain("function getDeleteSkillFailureMessage(): string")
    expect(settingsSkillsSource).toContain("onSuccess: (didDelete) => {")
    expect(settingsSkillsSource).toContain("if (!didDelete) {")
    expect(settingsSkillsSource).toContain('queryClient.invalidateQueries({ queryKey: ["skills"] })')
    expect(settingsSkillsSource).toContain("toast.error(getDeleteSkillFailureMessage())")
    expect(settingsSkillsSource).toContain('toast.success("Skill deleted successfully")')
  })

  it("keeps scan-folder feedback truthful now that scanSkillsFolder reloads canonical skills and returns no import count", () => {
    expect(settingsSkillsSource).toContain("await tipcClient.scanSkillsFolder()")
    expect(settingsSkillsSource).toContain("onSuccess: () => {")
    expect(settingsSkillsSource).toContain('toast.success("Skills folder refreshed")')
    expect(settingsSkillsSource).toContain("Refresh Folder")
    expect(settingsSkillsSource).not.toContain('toast.info("No new skills found in folder")')
    expect(settingsSkillsSource).not.toContain("Auto-imported")
  })
})