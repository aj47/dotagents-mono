import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress past-response TTS", () => {
  it("stores generated audio and surfaces visible failures for past responses", () => {
    expect(agentProgressSource).toContain("const [audioData, setAudioData] = useState<ArrayBuffer | null>(null)")
    expect(agentProgressSource).toContain("const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)")
    expect(agentProgressSource).toContain("const [ttsError, setTtsError] = useState<string | null>(null)")
    expect(agentProgressSource).toContain('console.error("[TTS UI] Failed to generate TTS audio:", error)')
    expect(agentProgressSource).toContain("setAudioData(result.audio)")
    expect(agentProgressSource).toContain("isGenerating={isGeneratingAudio}")
    expect(agentProgressSource).toContain("error={ttsError}")
    expect(agentProgressSource).toContain('<span className="font-medium">Audio generation failed:</span>{" "}')
    expect(agentProgressSource).toContain("ttsError")
  })
})