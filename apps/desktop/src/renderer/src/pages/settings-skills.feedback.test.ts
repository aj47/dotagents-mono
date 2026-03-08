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

  it("keeps the GitHub import dialog open when no skills were imported", () => {
    expect(settingsSkillsSource).toContain("if (!result) {")
    expect(settingsSkillsSource).toContain("if (result.imported.length > 0) {")
    expect(settingsSkillsSource).toContain('toast.error(`Failed to import: ${result.errors.join("; ")}`)')
    expect(settingsSkillsSource).toContain('toast.info("No skills found in repository")')
    expect(settingsSkillsSource).toContain("setIsGitHubDialogOpen(false)")
    expect(settingsSkillsSource).toContain('setGitHubRepoInput("")')
    expect(settingsSkillsSource).toContain('toast.success(`Imported ${result.imported.length} skill(s) from GitHub: ${result.imported.map(s => s.name).join(", ")}`)')
    expect(settingsSkillsSource).toContain("if (result.errors.length > 0) {")
    expect(settingsSkillsSource).toContain('toast.error(`Failed to import: ${result.errors.join("; ")}`)\n        return')
    expect(settingsSkillsSource).toContain('toast.info("No skills found in repository")')
  })
})