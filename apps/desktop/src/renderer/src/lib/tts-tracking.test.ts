import { describe, expect, it } from "vitest"
import {
  buildContentTTSKey,
  buildResponseEventTTSKey,
} from "@dotagents/shared/tts-tracking"

import {
  clearSessionTTSTracking,
  consumeSessionForcedAutoPlay,
  hasTTSPlayed,
  markSessionForcedAutoPlay,
  markTTSPlayed,
  removeTTSKey,
} from "./tts-tracking"

describe("tts-tracking", () => {
  it("builds session-scoped keys for response events and content fallbacks", () => {
    expect(buildResponseEventTTSKey("session-1", "evt-1", "final")).toBe("session-1:final:event:evt-1")
    expect(buildContentTTSKey("session-1", "hello", "final")).toBe("session-1:final:content:hello")
    expect(buildResponseEventTTSKey(undefined, "evt-1")).toBeNull()
    expect(buildContentTTSKey(undefined, "hello")).toBeNull()
  })

  it("clears only entries scoped to a given session", () => {
    const keepKey = buildContentTTSKey("session-keep", "x", "final")!
    const clearKey = buildContentTTSKey("session-clear", "y", "final")!

    markTTSPlayed(keepKey)
    markTTSPlayed(clearKey)
    clearSessionTTSTracking("session-clear")

    expect(hasTTSPlayed(keepKey)).toBe(true)
    expect(hasTTSPlayed(clearKey)).toBe(false)
    removeTTSKey(keepKey)
  })

  it("marks and consumes forced auto-play once per session", () => {
    const sessionId = "session-forced"
    expect(consumeSessionForcedAutoPlay(sessionId)).toBe(false)

    markSessionForcedAutoPlay(sessionId)
    expect(consumeSessionForcedAutoPlay(sessionId)).toBe(true)
    expect(consumeSessionForcedAutoPlay(sessionId)).toBe(false)
  })

  it("scopes forced auto-play markers per session", () => {
    markSessionForcedAutoPlay("session-a")
    expect(consumeSessionForcedAutoPlay("session-b")).toBe(false)
    expect(consumeSessionForcedAutoPlay("session-a")).toBe(true)
  })
})
