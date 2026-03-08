import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./model-preset-manager.tsx", import.meta.url), "utf8")

describe("ModelPresetManager explicit preset saves", () => {
  it("awaits config persistence before showing switch success", () => {
    expect(source).toContain("const saveConfigAsync = useCallback(")
    expect(source).toContain("await saveConfigMutation.mutateAsync({")
    expect(source).toMatch(/const handlePresetChange = async \(presetId: string\) => \{[\s\S]*await saveConfigAsync\(updates\)[\s\S]*toast\.success\(`Switched to preset: \$\{preset\.name\}`\)/)
  })

  it("keeps create and edit dialogs open until the save succeeds", () => {
    expect(source).toMatch(/const handleCreatePreset = async \(\) => \{[\s\S]*await saveConfigAsync\(\{[\s\S]*setIsCreateDialogOpen\(false\)[\s\S]*toast\.success\("Preset created successfully"\)/)
    expect(source).toMatch(/const handleUpdatePreset = async \(\) => \{[\s\S]*await saveConfigAsync\(updates\)[\s\S]*setIsEditDialogOpen\(false\)[\s\S]*toast\.success\("Preset updated successfully"\)/)
  })

  it("only shows delete success after the config save resolves", () => {
    expect(source).toMatch(/const handleDeletePreset = async \(preset: ModelPreset\) => \{[\s\S]*await saveConfigAsync\(updates\)[\s\S]*toast\.success\("Preset deleted"\)/)
  })
})