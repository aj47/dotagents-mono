import { describe, expect, it } from "vitest"

import type { Settings } from "./api-types"
import {
  REMOTE_SETTINGS_SECRET_MASK,
  buildRemoteSettingsInputDrafts,
  getRemoteSettingsSecretInputDraft,
} from "./remote-settings-input-drafts"

describe("remote settings input drafts", () => {
  it("builds string drafts for text, numeric, and list settings", () => {
    const settings = {
      sttLanguage: "en",
      openaiSttLanguage: "en-US",
      groqSttLanguage: "es",
      groqSttPrompt: "Names and acronyms",
      transcriptPostProcessingPrompt: "Clean transcript",
      transcriptPostProcessingOpenaiModel: "gpt-4.1-mini",
      transcriptPostProcessingGroqModel: "llama-3.3",
      transcriptPostProcessingGeminiModel: "gemini-2.5-flash",
      transcriptPostProcessingChatgptWebModel: "gpt-5",
      mcpMaxIterations: 42,
      whatsappAllowFrom: ["+15550001000", "+15550001001"],
      discordAllowUserIds: ["user-1", "user-2"],
      discordAllowGuildIds: ["guild-1"],
      discordAllowChannelIds: ["channel-1"],
      discordAllowRoleIds: ["role-1"],
      discordDmAllowUserIds: ["dm-user-1"],
      openaiBaseUrl: "https://api.openai.com/v1",
      groqBaseUrl: "https://api.groq.com/openai/v1",
      geminiBaseUrl: "https://generativelanguage.googleapis.com",
      langfusePublicKey: "pk-lf",
      langfuseBaseUrl: "https://langfuse.example",
      localTraceLogPath: "/tmp/dotagents-traces",
    } as Settings

    expect(buildRemoteSettingsInputDrafts(settings)).toMatchObject({
      sttLanguage: "en",
      openaiSttLanguage: "en-US",
      groqSttLanguage: "es",
      groqSttPrompt: "Names and acronyms",
      transcriptPostProcessingPrompt: "Clean transcript",
      transcriptPostProcessingOpenaiModel: "gpt-4.1-mini",
      transcriptPostProcessingGroqModel: "llama-3.3",
      transcriptPostProcessingGeminiModel: "gemini-2.5-flash",
      transcriptPostProcessingChatgptWebModel: "gpt-5",
      mcpMaxIterations: "42",
      whatsappAllowFrom: "+15550001000, +15550001001",
      discordAllowUserIds: "user-1\nuser-2",
      discordAllowGuildIds: "guild-1",
      discordAllowChannelIds: "channel-1",
      discordAllowRoleIds: "role-1",
      discordDmAllowUserIds: "dm-user-1",
      openaiBaseUrl: "https://api.openai.com/v1",
      groqBaseUrl: "https://api.groq.com/openai/v1",
      geminiBaseUrl: "https://generativelanguage.googleapis.com",
      langfusePublicKey: "pk-lf",
      langfuseBaseUrl: "https://langfuse.example",
      localTraceLogPath: "/tmp/dotagents-traces",
    })
  })

  it("uses default drafts and hides masked secrets", () => {
    const settings = {
      openaiApiKey: REMOTE_SETTINGS_SECRET_MASK,
      groqApiKey: REMOTE_SETTINGS_SECRET_MASK,
      geminiApiKey: REMOTE_SETTINGS_SECRET_MASK,
      discordBotToken: REMOTE_SETTINGS_SECRET_MASK,
      langfuseSecretKey: REMOTE_SETTINGS_SECRET_MASK,
    } as Settings

    expect(buildRemoteSettingsInputDrafts(settings)).toMatchObject({
      mcpMaxIterations: "10",
      whatsappAllowFrom: "",
      discordAllowUserIds: "",
      openaiApiKey: "",
      groqApiKey: "",
      geminiApiKey: "",
      discordBotToken: "",
      langfuseSecretKey: "",
    })
  })

  it("allows a custom secret mask", () => {
    expect(getRemoteSettingsSecretInputDraft("MASKED", "MASKED")).toBe("")
    expect(getRemoteSettingsSecretInputDraft("real-secret", "MASKED")).toBe("real-secret")
  })
})
