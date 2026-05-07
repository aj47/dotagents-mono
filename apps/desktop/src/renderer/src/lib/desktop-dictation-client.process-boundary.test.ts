import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-dictation-client.ts", import.meta.url), "utf8")
const panelPageSource = readFileSync(new URL("../pages/panel.tsx", import.meta.url), "utf8")
const onboardingPageSource = readFileSync(new URL("../pages/onboarding.tsx", import.meta.url), "utf8")

describe("desktop dictation renderer client", () => {
  it("centralizes dictation recording and transcription IPC", () => {
    expect(clientSource).toContain("tipcClient.createRecording(request)")
    expect(clientSource).toContain("tipcClient.createTextInput(request)")
    expect(clientSource).toContain("tipcClient.recordEvent(request)")
    expect(clientSource).toContain("tipcClient.transcribeChunk(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps panel and onboarding pages off direct dictation IPC", () => {
    const combinedSource = [panelPageSource, onboardingPageSource].join("\n")

    expect(panelPageSource).toContain("desktopDictationClient.createRecording({")
    expect(panelPageSource).toContain("desktopDictationClient.createTextInput({")
    expect(panelPageSource).toContain("desktopDictationClient.recordEvent({ type: \"start\", mcpMode: mcpModeRef.current })")
    expect(panelPageSource).toContain("desktopDictationClient.recordEvent({ type: \"end\" })")
    expect(panelPageSource).toContain("desktopDictationClient.transcribeChunk({")
    expect(onboardingPageSource).toContain("desktopDictationClient.createRecording({")
    expect(combinedSource).not.toContain("tipcClient.createRecording(")
    expect(combinedSource).not.toContain("tipcClient.createTextInput(")
    expect(combinedSource).not.toContain("tipcClient.recordEvent(")
    expect(combinedSource).not.toContain("tipcClient.transcribeChunk(")
  })
})
