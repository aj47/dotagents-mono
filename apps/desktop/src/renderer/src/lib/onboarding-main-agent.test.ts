import { describe, expect, it } from "vitest"

import {
  ONBOARDING_MAIN_AGENT_OPTIONS,
  buildAcpOnboardingConfigUpdate,
  buildByokConfigUpdate,
  buildExternalAgentProfileInput,
  buildOpenCodeManagedEnv,
  findExistingExternalAgentProfile,
} from "./onboarding-main-agent"

describe("onboarding-main-agent", () => {
  it("surfaces the requested onboarding choices", () => {
    expect(ONBOARDING_MAIN_AGENT_OPTIONS.map((option) => option.id)).toEqual([
      "opencode",
      "auggie",
      "claude-code",
      "codex",
      "byok",
    ])
  })

  it("builds BYOK config updates with provider defaults and local voice fallbacks", () => {
    expect(
      buildByokConfigUpdate("groq", "gsk_test", {
        kittenModelDownloaded: true,
      } as any)
    ).toMatchObject({
      mainAgentMode: "api",
      groqApiKey: "gsk_test",
      mcpToolsProviderId: "groq",
      transcriptPostProcessingProviderId: "groq",
      sttProviderId: "groq",
      ttsProviderId: "kitten",
      mcpToolsGroqModel: "openai/gpt-oss-120b",
    })

    expect(
      buildByokConfigUpdate("gemini", "gm_test", {
        parakeetModelDownloaded: true,
      } as any)
    ).toMatchObject({
      geminiApiKey: "gm_test",
      sttProviderId: "parakeet",
      ttsProviderId: "gemini",
      mcpToolsGeminiModel: "gemini-2.5-flash",
    })
  })

  it("builds external ACP profiles and reuses matching existing ones", () => {
    const draft = buildExternalAgentProfileInput("opencode", { cwd: "/repo" })
    expect(draft).toMatchObject({
      displayName: "OpenCode",
      connection: { type: "acp", command: "opencode", args: ["acp"], cwd: "/repo" },
      enabled: true,
    })

    const existing = findExistingExternalAgentProfile(
      [
        {
          id: "1",
          name: "OpenCode",
          displayName: "OpenCode",
          enabled: true,
          connection: { type: "acp", command: "opencode", args: ["acp"] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as any,
      ],
      "opencode"
    )

    expect(existing?.displayName).toBe("OpenCode")
  })

  it("builds ACP config updates that preserve local voice defaults when available", () => {
    expect(
      buildAcpOnboardingConfigUpdate("OpenCode", {
        parakeetModelDownloaded: true,
        supertonicModelDownloaded: true,
      } as any)
    ).toEqual({
      mainAgentMode: "acp",
      mainAgentName: "OpenCode",
      acpInjectRuntimeTools: true,
      sttProviderId: "parakeet",
      ttsProviderId: "supertonic",
    })
  })

  it("builds managed OpenCode env injection from a provider api key", () => {
    const env = buildOpenCodeManagedEnv("groq", "gsk_test")
    expect(env.GROQ_API_KEY).toBe("gsk_test")
    expect(env.DOTAGENTS_OPENCODE_PROVIDER_API_KEY).toBe("gsk_test")

    const parsed = JSON.parse(env.OPENCODE_CONFIG_CONTENT)
    expect(parsed).toMatchObject({
      autoupdate: false,
      model: "groq/openai/gpt-oss-120b",
      provider: {
        groq: {
          options: {
            apiKey: "{env:DOTAGENTS_OPENCODE_PROVIDER_API_KEY}",
          },
        },
      },
      disabled_providers: ["openai", "google"],
    })
  })
})