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
    expect(agentProgressSource).toContain('autoPlay={shouldAutoPlayTTSForVariant(variant, isSnoozed, isFocused, isFloatingPanelVisible) && (configQuery.data?.ttsAutoPlay ?? true)}')
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

  it("lets mid-turn playback claim final-response keys only after audio starts", () => {
    expect(agentProgressSource).toContain('const finalResponseTTSKeys = useMemo(')
    expect(agentProgressSource).toContain('buildContentTTSKey(sessionId, ttsSource, "final")')
    expect(agentProgressSource).toContain('const handleAudioPlayStateChange = useCallback((playing: boolean) => {')
    expect(agentProgressSource).toContain('if (!playing) return')
    expect(agentProgressSource).toContain('finalResponseTTSKeys.forEach((key) => markTTSPlayed(key))')
    expect(agentProgressSource).toContain('onPlayStateChange={handleAudioPlayStateChange}')
  })
})
