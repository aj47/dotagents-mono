import { describe, expect, it } from "vitest"

import {
  formatLocalSpeechModelProgress,
  getTextToSpeechModelValue,
  getTextToSpeechSpeedValue,
  getTextToSpeechVoiceValue,
  normalizeTextToSpeechVoiceUpdateValue,
} from "./text-to-speech-settings"

describe("text to speech settings helpers", () => {
  it("selects provider-specific model values", () => {
    expect(getTextToSpeechModelValue({
      ttsProviderId: "openai",
      openaiTtsModel: "gpt-4o-mini-tts",
    })).toBe("gpt-4o-mini-tts")
    expect(getTextToSpeechModelValue({
      ttsProviderId: "groq",
      groqTtsModel: "canopylabs/orpheus-v1-english",
    })).toBe("canopylabs/orpheus-v1-english")
    expect(getTextToSpeechModelValue({ ttsProviderId: "kitten" })).toBeUndefined()
    expect(getTextToSpeechModelValue(null)).toBeUndefined()
  })

  it("selects provider-specific voice values", () => {
    expect(getTextToSpeechVoiceValue({
      ttsProviderId: "edge",
      edgeTtsVoice: "en-US-AriaNeural",
    })).toBe("en-US-AriaNeural")
    expect(getTextToSpeechVoiceValue({
      ttsProviderId: "kitten",
      kittenVoiceId: 3,
    })).toBe(3)
    expect(getTextToSpeechVoiceValue({
      openaiTtsVoice: "alloy",
    })).toBe("alloy")
  })

  it("normalizes voice update values for string and numeric voice fields", () => {
    expect(normalizeTextToSpeechVoiceUpdateValue("kittenVoiceId", "4")).toBe(4)
    expect(normalizeTextToSpeechVoiceUpdateValue("openaiTtsVoice", 4)).toBe("4")
  })

  it("selects provider-specific speed values", () => {
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "openai", openaiTtsSpeed: 1.2 })).toBe(1.2)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "edge", edgeTtsRate: 0.9 })).toBe(0.9)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "supertonic", supertonicSpeed: 1.05 })).toBe(1.05)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "groq" })).toBeUndefined()
  })

  it("formats local speech model progress for compact mobile status labels", () => {
    expect(formatLocalSpeechModelProgress()).toBe("Unknown")
    expect(formatLocalSpeechModelProgress({ downloaded: true, downloading: false, progress: 1 })).toBe("Ready")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: true, progress: 0.42 })).toBe("Downloading 42%")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: false, progress: 0, error: "failed" })).toBe("Needs retry")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: false, progress: 0 })).toBe("Not installed")
  })
})
