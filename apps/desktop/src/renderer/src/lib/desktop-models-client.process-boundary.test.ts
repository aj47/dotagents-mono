import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-models-client.ts", import.meta.url), "utf8")
const presetModelSelectorSource = readFileSync(
  new URL("../components/preset-model-selector.tsx", import.meta.url),
  "utf8",
)

describe("desktop models renderer client", () => {
  it("centralizes model metadata IPC channels", () => {
    expect(clientSource).toContain("tipcClient.fetchModelsForPreset({ baseUrl, apiKey })")
    expect(clientSource).toContain("tipcClient.getModelInfo({ modelId, providerId })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps preset model selector off direct model metadata IPC channels", () => {
    expect(presetModelSelectorSource).toContain(
      "desktopModelsClient.fetchModelsForPreset(baseUrl, apiKey)",
    )
    expect(presetModelSelectorSource).toContain("desktopModelsClient.getModelInfo(model.id)")
    expect(presetModelSelectorSource).not.toContain("tipcClient.fetchModelsForPreset(")
    expect(presetModelSelectorSource).not.toContain("tipcClient.getModelInfo(")
  })
})
