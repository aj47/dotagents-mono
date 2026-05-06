import { describe, expect, it } from "vitest"

import {
  buildContentTTSKey,
  buildResponseEventTTSKey,
  clearSessionTTSTracking,
  consumeSessionForcedAutoPlay,
  createTTSTrackingState,
  hasTTSPlayed,
  markSessionForcedAutoPlay,
  markTTSPlayed,
  removeTTSKey,
} from "./tts-tracking"

describe("tts tracking", () => {
  it("builds session-scoped keys for response events and content fallbacks", () => {
    expect(buildResponseEventTTSKey("session-1", "evt-1", "final")).toBe("session-1:final:event:evt-1")
    expect(buildContentTTSKey("session-1", "hello", "final")).toBe("session-1:final:content:hello")
    expect(buildResponseEventTTSKey(undefined, "evt-1")).toBeNull()
    expect(buildContentTTSKey(undefined, "hello")).toBeNull()
  })

  it("tracks played keys within the provided state", () => {
    const state = createTTSTrackingState()
    const key = buildContentTTSKey("session-1", "hello", "final")!

    expect(hasTTSPlayed(state, key)).toBe(false)
    markTTSPlayed(state, key)
    expect(hasTTSPlayed(state, key)).toBe(true)
    removeTTSKey(state, key)
    expect(hasTTSPlayed(state, key)).toBe(false)
  })

  it("clears only entries scoped to a given session", () => {
    const state = createTTSTrackingState()
    const keepKey = buildContentTTSKey("session-keep", "x", "final")!
    const clearKey = buildContentTTSKey("session-clear", "y", "final")!

    markTTSPlayed(state, keepKey)
    markTTSPlayed(state, clearKey)
    clearSessionTTSTracking(state, "session-clear")

    expect(hasTTSPlayed(state, keepKey)).toBe(true)
    expect(hasTTSPlayed(state, clearKey)).toBe(false)
  })

  it("marks and consumes forced auto-play once per session", () => {
    const state = createTTSTrackingState()
    const sessionId = "session-forced"
    expect(consumeSessionForcedAutoPlay(state, sessionId)).toBe(false)

    markSessionForcedAutoPlay(state, sessionId)
    expect(consumeSessionForcedAutoPlay(state, sessionId)).toBe(true)
    expect(consumeSessionForcedAutoPlay(state, sessionId)).toBe(false)
  })

  it("scopes forced auto-play markers per session", () => {
    const state = createTTSTrackingState()

    markSessionForcedAutoPlay(state, "session-a")
    expect(consumeSessionForcedAutoPlay(state, "session-b")).toBe(false)
    expect(consumeSessionForcedAutoPlay(state, "session-a")).toBe(true)
  })
})
