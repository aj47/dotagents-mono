import { describe, expect, it, vi } from "vitest"

vi.mock("./config", () => ({
  configStore: {
    get: vi.fn(),
    save: vi.fn(),
  },
}))

vi.mock("./mcp-service", () => ({
  mcpService: {
    applyProfileMcpConfig: vi.fn(),
  },
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    setCurrentProfile: vi.fn(),
    setCurrentProfileStrict: vi.fn(),
  },
  toolConfigToMcpServerConfig: vi.fn(),
}))

const activationModulePromise = import("./agent-profile-activation")

describe("buildConfigForActivatedProfile", () => {
  it("records the active profile id even when the profile has no model overrides", async () => {
    const { buildConfigForActivatedProfile } = await activationModulePromise
    const nextConfig = buildConfigForActivatedProfile(
      {
        mcpToolsProviderId: "openai",
        mcpToolsOpenaiModel: "gpt-4.1",
      } as any,
      {
        id: "agent-main",
      } as any,
    )

    expect(nextConfig.mcpCurrentProfileId).toBe("agent-main")
    expect(nextConfig.mcpToolsProviderId).toBe("openai")
    expect(nextConfig.mcpToolsOpenaiModel).toBe("gpt-4.1")
  })

  it("applies defined profile model overrides without clobbering unrelated settings", async () => {
    const { buildConfigForActivatedProfile } = await activationModulePromise
    const nextConfig = buildConfigForActivatedProfile(
      {
        mcpToolsProviderId: "openai",
        mcpToolsOpenaiModel: "gpt-4.1",
        mcpToolsGroqModel: "llama-3.3-70b",
        currentModelPresetId: "default",
        sttProviderId: "openai",
        openaiSttModel: "gpt-4o-mini-transcribe",
        transcriptPostProcessingProviderId: "openai",
        transcriptPostProcessingOpenaiModel: "gpt-4.1-mini",
        ttsProviderId: "openai",
      } as any,
      {
        id: "agent-reviewer",
        modelConfig: {
          mcpToolsProviderId: "groq",
          mcpToolsGroqModel: "qwen-qwq-32b",
          currentModelPresetId: "analysis",
          sttProviderId: "groq",
          groqSttModel: "whisper-large-v3",
          transcriptPostProcessingProviderId: "gemini",
          transcriptPostProcessingGeminiModel: "gemini-2.5-flash",
          ttsProviderId: "supertonic",
        },
      } as any,
    )

    expect(nextConfig.mcpCurrentProfileId).toBe("agent-reviewer")
    expect(nextConfig.mcpToolsProviderId).toBe("groq")
    expect(nextConfig.mcpToolsOpenaiModel).toBe("gpt-4.1")
    expect(nextConfig.mcpToolsGroqModel).toBe("qwen-qwq-32b")
    expect(nextConfig.currentModelPresetId).toBe("analysis")
    expect(nextConfig.sttProviderId).toBe("groq")
    expect(nextConfig.openaiSttModel).toBe("gpt-4o-mini-transcribe")
    expect(nextConfig.groqSttModel).toBe("whisper-large-v3")
    expect(nextConfig.transcriptPostProcessingProviderId).toBe("gemini")
    expect(nextConfig.transcriptPostProcessingOpenaiModel).toBe("gpt-4.1-mini")
    expect(nextConfig.transcriptPostProcessingGeminiModel).toBe(
      "gemini-2.5-flash",
    )
    expect(nextConfig.ttsProviderId).toBe("supertonic")
  })
})
