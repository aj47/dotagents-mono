import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress TTS guardrails", () => {
  it("disables overlay auto-play generation when the session is snoozed", () => {
    expect(agentProgressSource).toContain('function shouldAutoPlayTTSForVariant')
    expect(agentProgressSource).toContain('if (variant === "tile") return isFocused && !isFloatingPanelVisible')
    expect(agentProgressSource).toContain('return !isSnoozed')
  })

  it("threads snoozed state through overlay and tile TTS players", () => {
    expect(agentProgressSource).toContain('isSnoozed={progress.isSnoozed}')
  })

  it("suppresses tile auto-play while the floating panel is visible so the same session is not spoken twice", () => {
    expect(agentProgressSource).toContain('if (variant === "tile") return isFocused && !isFloatingPanelVisible')
    expect(agentProgressSource).toContain('shouldAutoPlayTTSForVariant(variant, isSnoozed, isFocused, isFloatingPanelVisible)')
    expect(agentProgressSource).toContain('const isFloatingPanelVisible = useAgentStore((s) => s.isFloatingPanelVisible)')
  })

  it("keeps response-linked assistant messages replayable but only auto-plays the latest assistant message", () => {
    expect(agentProgressSource).toContain('(isComplete || !!message.responseEvent)')
    expect(agentProgressSource).toContain('const shouldAutoPlayTTS = shouldShowTTSButton && isLast')
    expect(agentProgressSource).toContain('isLast &&')
  })

})
