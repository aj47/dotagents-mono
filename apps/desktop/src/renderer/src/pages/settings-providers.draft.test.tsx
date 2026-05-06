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
  })

  it("surfaces codex auth through explicit actions instead of manual credential drafts", () => {
    expect(settingsProvidersSource).toMatch(/queryKey: \["chatgpt-web-auth-status"\]/)
    expect(settingsProvidersSource).toMatch(/tipcClient\.loginChatGptWebOAuth\(\)/)
    expect(settingsProvidersSource).toMatch(/tipcClient\.logoutChatGptWebOAuth\(\)/)
    expect(settingsProvidersSource).toMatch(/Copy Callback URL/)
  })

  it("uses shared provider fallback defaults for active provider badges", () => {
    expect(settingsProvidersSource).toContain("DEFAULT_AGENT_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("DEFAULT_STT_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("DEFAULT_TTS_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("configQuery.data.agentProviderId || configQuery.data.mcpToolsProviderId || DEFAULT_AGENT_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("configQuery.data.sttProviderId || DEFAULT_STT_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("configQuery.data.transcriptPostProcessingProviderId || DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID")
    expect(settingsProvidersSource).toContain("configQuery.data.ttsProviderId || DEFAULT_TTS_PROVIDER_ID")
  })
})
