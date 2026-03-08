import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const predefinedPromptsMenuSource = readFileSync(new URL("./predefined-prompts-menu.tsx", import.meta.url), "utf8")

describe("predefined prompts menu persistence", () => {
  it("awaits async prompt saves before closing the editor dialog", () => {
    expect(predefinedPromptsMenuSource).toContain("const handleSave = async () => {")
    expect(predefinedPromptsMenuSource).toContain("await saveConfig.mutateAsync({")
    expect(predefinedPromptsMenuSource).toContain("<Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>")
    expect(predefinedPromptsMenuSource).toContain("if (!open && saveConfig.isPending) return")

    const saveAwaitIndex = predefinedPromptsMenuSource.indexOf("await saveConfig.mutateAsync({")
    const closeDialogIndex = predefinedPromptsMenuSource.indexOf("setIsDialogOpen(false)")
    expect(saveAwaitIndex).toBeGreaterThan(-1)
    expect(closeDialogIndex).toBeGreaterThan(saveAwaitIndex)
  })

  it("keeps the dialog controls disabled while a prompt save is in flight", () => {
    expect(predefinedPromptsMenuSource).toContain("disabled={saveConfig.isPending}")
    expect(predefinedPromptsMenuSource).toContain("disabled={saveConfig.isPending || !promptName.trim() || !promptContent.trim()}")
    expect(predefinedPromptsMenuSource).toContain('{saveConfig.isPending ? "Saving..." : editingPrompt ? "Save Changes" : "Add Prompt"}')
  })
})