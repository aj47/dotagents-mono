import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsProvidersSource = readFileSync(new URL("./settings-providers.tsx", import.meta.url), "utf8")

describe("desktop provider settings draft behavior", () => {
  it("keeps provider text drafts local, debounces saves, and merges updates into the latest config", () => {
    expect(settingsProvidersSource).toMatch(/const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400/)
    expect(settingsProvidersSource).toMatch(/setProviderDrafts\(\(currentDrafts\) => \(\{/)
    expect(settingsProvidersSource).toMatch(/\.\.\.currentDrafts,\s*\[key\]: value/)
    expect(settingsProvidersSource).toMatch(/const pendingSave = providerSaveTimeoutsRef\.current\[key\]/)
    expect(settingsProvidersSource).toMatch(/if \(pendingSave\) \{?\s*clearTimeout\(pendingSave\)/)
    expect(settingsProvidersSource).toMatch(/providerSaveTimeoutsRef\.current\[key\] = setTimeout\(/)
    expect(settingsProvidersSource).toMatch(/saveConfig\(\{ \[key\]: value \} as Partial<Config>\)/)
  })

  it("flushes draft values immediately on blur and resyncs them from saved config", () => {
    expect(settingsProvidersSource).toMatch(/onBlur=\{\(e\) => \{\s*flushProviderSave\(key, e\.currentTarget\.value\)/)
    expect(settingsProvidersSource).toMatch(/setProviderDrafts\(getProviderDrafts\(configQuery\.data\)\)/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.groqApiKey/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.groqBaseUrl/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.geminiApiKey/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.geminiBaseUrl/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.chatgptWebAccessToken/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.chatgptWebSessionToken/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.chatgptWebAccountId/)
    expect(settingsProvidersSource).toMatch(/configQuery\.data\?\.chatgptWebBaseUrl/)
  })
})
