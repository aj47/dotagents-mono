import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsModelsSource = readFileSync(new URL("./settings-models.tsx", import.meta.url), "utf8")
const agentProgressSource = readFileSync(new URL("../components/agent-progress.tsx", import.meta.url), "utf8")

describe("settings models Codex generation options", () => {
  it("uses shared reasoning effort and verbosity option contracts", () => {
    expect(settingsModelsSource).toContain("OPENAI_REASONING_EFFORT_OPTIONS")
    expect(settingsModelsSource).toContain("CODEX_TEXT_VERBOSITY_OPTIONS")
    expect(settingsModelsSource).toContain("DEFAULT_CODEX_REASONING_EFFORT")
    expect(settingsModelsSource).toContain("DEFAULT_CODEX_TEXT_VERBOSITY")
    expect(agentProgressSource).toContain("OPENAI_REASONING_EFFORT_OPTIONS")
    expect(agentProgressSource).toContain("CODEX_TEXT_VERBOSITY_OPTIONS")
    expect(agentProgressSource).toContain("getOpenAiReasoningEffortDefault")
    expect(agentProgressSource).toContain("DEFAULT_CODEX_TEXT_VERBOSITY")
  })

  it("uses shared provider fallback defaults for model sections", () => {
    expect(settingsModelsSource).toContain("DEFAULT_AGENT_PROVIDER_ID")
    expect(settingsModelsSource).toContain("DEFAULT_STT_PROVIDER_ID")
    expect(settingsModelsSource).toContain("DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID")
    expect(settingsModelsSource).toContain("DEFAULT_TTS_PROVIDER_ID")
    expect(settingsModelsSource).toContain("config.agentProviderId || config.mcpToolsProviderId || DEFAULT_AGENT_PROVIDER_ID")
    expect(settingsModelsSource).toContain("config.sttProviderId || DEFAULT_STT_PROVIDER_ID")
    expect(settingsModelsSource).toContain("config.transcriptPostProcessingProviderId || DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID")
    expect(settingsModelsSource).toContain("config.ttsProviderId || DEFAULT_TTS_PROVIDER_ID")
  })
})
