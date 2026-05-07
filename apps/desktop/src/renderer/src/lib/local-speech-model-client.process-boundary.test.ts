import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./local-speech-model-client.ts", import.meta.url), "utf8")
const providersSource = readFileSync(new URL("../pages/settings-providers.tsx", import.meta.url), "utf8")

describe("local speech model renderer client", () => {
  it("centralizes desktop IPC channels behind shared provider ids", () => {
    expect(clientSource).toContain("LocalSpeechModelProviderId")
    expect(clientSource).toContain("Record<LocalSpeechModelProviderId, string>")
    expect(clientSource).toContain('parakeet: "getParakeetModelStatus"')
    expect(clientSource).toContain('kitten: "getKittenModelStatus"')
    expect(clientSource).toContain('supertonic: "getSupertonicModelStatus"')
    expect(clientSource).toContain('parakeet: "downloadParakeetModel"')
    expect(clientSource).toContain('kitten: "downloadKittenModel"')
    expect(clientSource).toContain('supertonic: "downloadSupertonicModel"')
  })

  it("keeps provider settings UI off direct local speech status/download IPC calls", () => {
    expect(providersSource).toContain('getLocalSpeechModelStatus("parakeet")')
    expect(providersSource).toContain('getLocalSpeechModelStatus("kitten")')
    expect(providersSource).toContain('getLocalSpeechModelStatus("supertonic")')
    expect(providersSource).toContain('downloadLocalSpeechModel("parakeet")')
    expect(providersSource).toContain('downloadLocalSpeechModel("kitten")')
    expect(providersSource).toContain('downloadLocalSpeechModel("supertonic")')
    expect(providersSource).not.toContain('ipcRenderer.invoke("getParakeetModelStatus")')
    expect(providersSource).not.toContain('ipcRenderer.invoke("downloadParakeetModel")')
    expect(providersSource).not.toContain('ipcRenderer.invoke("getKittenModelStatus")')
    expect(providersSource).not.toContain('ipcRenderer.invoke("downloadKittenModel")')
    expect(providersSource).not.toContain('ipcRenderer.invoke("getSupertonicModelStatus")')
    expect(providersSource).not.toContain('ipcRenderer.invoke("downloadSupertonicModel")')
  })
})
