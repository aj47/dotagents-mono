import { describe, expect, it } from "vitest"

import { matchSleepPhrase, matchWakePhrase, normalizeVoicePhrase } from "./voice-phrase-matcher"

describe("voice phrase matcher", () => {
  it("normalizes punctuation, apostrophes, and spacing", () => {
    expect(normalizeVoicePhrase(" Hey, Dot-Agents!!  ")).toBe("hey dot agents")
    expect(normalizeVoicePhrase("what’s up?")).toBe("whats up")
    expect(normalizeVoicePhrase(null)).toBe("")
  })

  it("matches the wake phrase on its own", () => {
    expect(matchWakePhrase("Hey Dot Agents", "hey dot agents")).toEqual({
      matched: true,
      normalizedTranscript: "hey dot agents",
      normalizedPhrase: "hey dot agents",
      remainder: "",
    })
  })

  it("strips the wake phrase when a request follows it", () => {
    expect(matchWakePhrase("Hey dot agents, what is on my calendar today?", "hey dot agents")).toEqual({
      matched: true,
      normalizedTranscript: "hey dot agents what is on my calendar today",
      normalizedPhrase: "hey dot agents",
      remainder: "what is on my calendar today",
    })
  })

  it("does not match unrelated or empty wake phrases", () => {
    expect(matchWakePhrase("tell me a joke", "hey dot agents")).toEqual({
      matched: false,
      normalizedTranscript: "tell me a joke",
      normalizedPhrase: "hey dot agents",
      remainder: "",
    })
    expect(matchWakePhrase("tell me a joke", "   ").matched).toBe(false)
  })

  it("matches sleep phrases on their own, at the start, or at the end", () => {
    expect(matchSleepPhrase("Go to sleep", "go to sleep").matched).toBe(true)
    expect(matchSleepPhrase("go to sleep thanks", "go to sleep").matched).toBe(true)
    expect(matchSleepPhrase("okay go to sleep", "go to sleep").matched).toBe(true)
  })

  it("does not match sleep phrases embedded in the middle of a longer utterance", () => {
    expect(matchSleepPhrase("okay go to sleep thanks", "go to sleep")).toEqual({
      matched: false,
      normalizedTranscript: "okay go to sleep thanks",
      normalizedPhrase: "go to sleep",
      remainder: "",
    })
  })
})
