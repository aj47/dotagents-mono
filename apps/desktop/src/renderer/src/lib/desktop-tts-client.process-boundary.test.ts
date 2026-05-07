import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-tts-client.ts", import.meta.url), "utf8")
const agentProgressSource = readFileSync(
  new URL("../components/agent-progress.tsx", import.meta.url),
  "utf8",
)
const useStoreSyncSource = readFileSync(new URL("../hooks/use-store-sync.ts", import.meta.url), "utf8")

describe("desktop TTS renderer client", () => {
  it("centralizes TTS generation IPC channels", () => {
    expect(clientSource).toContain("rendererHandlers.stopAllTts.listen(listener)")
    expect(clientSource).toContain("rendererHandlers.clearSessionTTSKeys.listen(listener)")
    expect(clientSource).toContain("tipcClient.generateSpeech(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps agent progress playback off direct TTS generation IPC", () => {
    expect(agentProgressSource).toContain("desktopTtsClient.generateSpeech({")
    expect(agentProgressSource).not.toContain("tipcClient.generateSpeech(")
  })

  it("keeps store sync off direct TTS event channels", () => {
    expect(useStoreSyncSource).toContain("desktopTtsClient.onStopAllTts(")
    expect(useStoreSyncSource).toContain("desktopTtsClient.onClearSessionTtsKeys(")
    expect(useStoreSyncSource).not.toContain("rendererHandlers.stopAllTts")
    expect(useStoreSyncSource).not.toContain("rendererHandlers.clearSessionTTSKeys")
  })
})
