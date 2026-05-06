import { describe, expect, it } from "vitest"

import {
  MAX_VOICE_DEBUG_EVENTS,
  formatVoiceDebugEntry,
  prependVoiceDebugEntry,
  type VoiceDebugEntry,
} from "./voice-debug-log"

function createEntry(id: string, at: number): VoiceDebugEntry {
  return {
    id,
    at,
    type: "recognizer-start",
    summary: `summary ${id}`,
  }
}

describe("voice debug log", () => {
  it("formats a timestamped debug summary", () => {
    const at = new Date("2026-05-06T16:30:15.000Z").getTime()
    const expectedTimestamp = new Date(at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    expect(formatVoiceDebugEntry({
      id: "entry-1",
      at,
      type: "wake-phrase-matched",
      summary: "Wake phrase matched",
    })).toBe(`${expectedTimestamp} · Wake phrase matched`)
  })

  it("prepends newest debug entries and trims to the default limit", () => {
    const events = Array.from({ length: MAX_VOICE_DEBUG_EVENTS }, (_, index) => createEntry(String(index), index))
    const next = createEntry("next", 100)

    const result = prependVoiceDebugEntry(events, next)

    expect(result).toHaveLength(MAX_VOICE_DEBUG_EVENTS)
    expect(result[0]).toBe(next)
    expect(result.at(-1)?.id).toBe(String(MAX_VOICE_DEBUG_EVENTS - 2))
  })

  it("supports explicit small and invalid limits", () => {
    const events = [createEntry("one", 1), createEntry("two", 2)]
    const next = createEntry("next", 3)

    expect(prependVoiceDebugEntry(events, next, 2).map((entry) => entry.id)).toEqual(["next", "one"])
    expect(prependVoiceDebugEntry(events, next, -1)).toEqual([])
  })
})
