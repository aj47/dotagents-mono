import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress TTS guardrails", () => {
  it("disables overlay auto-play generation when the session is snoozed", () => {
    expect(agentProgressSource).toContain('function shouldAutoPlayTTSForVariant')
    expect(agentProgressSource).toContain('focus no\n  // longer decides whether a tile may request auto-play')
    expect(agentProgressSource).toContain('return !isSnoozed')
  })

  it("threads snoozed state through overlay and tile TTS players", () => {
    expect(agentProgressSource).toContain('isSnoozed={progress.isSnoozed}')
  })

  it("presents snoozed running sessions as background work instead of paused or complete", () => {
    expect(agentProgressSource).toContain("getSessionPresentation")
    expect(agentProgressSource).toContain("getSessionStatusDesktopRenderState(sessionPresentation)")
    expect(agentProgressSource).toContain('conversationStatusIndicatorState.kind === "background"')
    expect(agentProgressSource).toContain("<Moon className={conversationStatusIndicatorState.iconClassName} />")

    const backgroundIconIndex = agentProgressSource.indexOf('conversationStatusIndicatorState.kind === "background"')
    const spinnerIndex = agentProgressSource.indexOf('conversationStatusIndicatorState.kind === "running"', backgroundIconIndex + 1)
    expect(backgroundIconIndex).toBeGreaterThan(-1)
    expect(spinnerIndex).toBeGreaterThan(backgroundIconIndex)
  })

  it("lets unfocused tiles request auto-play while central claims prevent duplicate speech", () => {
    expect(agentProgressSource).toContain('focus no\n  // longer decides whether a tile may request auto-play')
    expect(agentProgressSource).toContain('shouldAutoPlayTTSForVariant(messageVariant, isSnoozed)')
    expect(agentProgressSource).toContain('desktopTtsClient.claimPlaybackKeys')
    expect(agentProgressSource).toContain('desktopTtsClient.requestPlayback({')
  })

  it("keeps response-linked assistant messages replayable but only auto-plays the latest assistant message", () => {
    expect(agentProgressSource).toContain('const canUseTTSForAssistantMessage =')
    expect(agentProgressSource).toContain('isThoughtEligibleForTTS')
    expect(agentProgressSource).toContain('isAssistantThought: true')
    expect(agentProgressSource).toContain('(!message.isAssistantThought || isThoughtEligibleForTTS)')
    expect(agentProgressSource).toContain('!message.isThinking &&')
    expect(agentProgressSource).toContain('const shouldAutoPlayTTS = shouldShowTTSButton && isLast')
    expect(agentProgressSource).toContain('isLast &&')
    expect(agentProgressSource).toContain('!ttsKeys.some((key) => hasTTSPlayed(key)) &&')
  })

  it("uses shared TTS defaults when config fields are unset", () => {
    expect(agentProgressSource).not.toContain('from "@dotagents/shared/text-to-speech-settings"')
    expect(agentProgressSource).not.toContain('from "@dotagents/shared/tts-tracking"')
    expect(agentProgressSource).toContain("DEFAULT_TTS_ENABLED")
    expect(agentProgressSource).toContain("DEFAULT_TTS_AUTO_PLAY")
    expect(agentProgressSource).toContain("configQuery.data?.ttsEnabled ?? DEFAULT_TTS_ENABLED")
    expect(agentProgressSource).toContain("configQuery.data?.ttsAutoPlay ?? DEFAULT_TTS_AUTO_PLAY")
  })

  it("suppresses auto-play for historical sessions that mount with progress already complete", () => {
    expect(agentProgressSource).toContain('const observedLiveProgressRef = useRef(false)')
    expect(agentProgressSource).toContain('parentObservedLiveProgress')
    expect(agentProgressSource).toContain('const hasObservedLiveProgress = observedLiveProgressRef.current || parentObservedLiveProgress || !isComplete')
    expect(agentProgressSource).toContain('if (!hasObservedLiveProgress) {')
    expect(agentProgressSource).toContain('consumeSessionForcedAutoPlay(sessionId)')
  })

})
