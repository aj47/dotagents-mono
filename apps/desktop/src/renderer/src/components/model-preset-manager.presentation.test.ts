import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./model-preset-manager.tsx", import.meta.url), "utf8")

describe("desktop model preset manager presentation", () => {
  it("uses shared model preset presentation for visible editor copy", () => {
    expect(source).toContain("APP_SHELL_MODEL_PRESET_PRESENTATION.manager.title")
    expect(source).toContain("APP_SHELL_MODEL_PRESET_PRESENTATION.fields.name.label")
    expect(source).toContain("APP_SHELL_MODEL_PRESET_PRESENTATION.fields.baseUrl.placeholder")
    expect(source).toContain("APP_SHELL_MODEL_PRESET_PRESENTATION.modelPreferences.createTitle")
    expect(source).toContain("getAppShellModelPresetEditorTitle(\"create\")")
    expect(source).toContain("getAppShellModelPresetEditorDescription(!!editingPreset?.isBuiltIn)")
    expect(source).not.toContain("Preset Name")
    expect(source).not.toContain("API Base URL")
    expect(source).not.toContain("Create New Preset")
  })
})
