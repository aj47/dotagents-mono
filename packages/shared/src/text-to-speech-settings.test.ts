import { describe, expect, it } from "vitest"

import {
  TEXT_TO_SPEECH_SPEED_SETTING_KEYS,
  formatLocalSpeechModelProgress,
  getTextToSpeechModelValue,
  getTextToSpeechPlaybackRate,
  getTextToSpeechSpeedDefault,
  getTextToSpeechSpeedSetting,
  getTextToSpeechSpeedSettingByKey,
  getTextToSpeechSpeedValue,
  getTextToSpeechVoiceValue,
  isTextToSpeechSpeedUpdateValue,
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
    expect(getTextToSpeechSpeedValue({ openaiTtsSpeed: 1.2 })).toBe(1.2)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "openai", openaiTtsSpeed: 1.2 })).toBe(1.2)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "edge", edgeTtsRate: 0.9 })).toBe(0.9)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "supertonic", supertonicSpeed: 1.05 })).toBe(1.05)
    expect(getTextToSpeechSpeedValue({ ttsProviderId: "groq" })).toBeUndefined()
  })

  it("describes provider-specific speed controls", () => {
    expect(TEXT_TO_SPEECH_SPEED_SETTING_KEYS).toEqual(["openaiTtsSpeed", "edgeTtsRate", "supertonicSpeed"])
    expect(getTextToSpeechSpeedSetting()).toMatchObject({
      key: "openaiTtsSpeed",
      minimumValue: 0.25,
      maximumValue: 4.0,
      step: 0.25,
      defaultValue: 1.0,
      fractionDigits: 1,
    })
    expect(getTextToSpeechSpeedSetting("edge")).toMatchObject({
      key: "edgeTtsRate",
      minimumValue: 0.5,
      maximumValue: 2.0,
      step: 0.1,
      defaultValue: 1.0,
      fractionDigits: 1,
    })
    expect(getTextToSpeechSpeedSetting("supertonic")).toMatchObject({
      key: "supertonicSpeed",
      minimumValue: 0.5,
      maximumValue: 2.0,
      step: 0.05,
      defaultValue: 1.05,
      fractionDigits: 2,
    })
    expect(getTextToSpeechSpeedSetting("groq")).toBeUndefined()
  })

  it("looks up and validates speed controls by setting key", () => {
    expect(getTextToSpeechSpeedSettingByKey("openaiTtsSpeed").defaultValue).toBe(1.0)
    expect(getTextToSpeechSpeedDefault("supertonic")).toBe(1.05)
    expect(isTextToSpeechSpeedUpdateValue("openaiTtsSpeed", 0.25)).toBe(true)
    expect(isTextToSpeechSpeedUpdateValue("openaiTtsSpeed", 4.0)).toBe(true)
    expect(isTextToSpeechSpeedUpdateValue("openaiTtsSpeed", 0.24)).toBe(false)
    expect(isTextToSpeechSpeedUpdateValue("edgeTtsRate", 2.1)).toBe(false)
    expect(isTextToSpeechSpeedUpdateValue("supertonicSpeed", "1.0")).toBe(false)
  })

  it("resolves playback rates with provider defaults", () => {
    expect(getTextToSpeechPlaybackRate({ openaiTtsSpeed: 1.2 })).toBe(1.2)
    expect(getTextToSpeechPlaybackRate({ ttsProviderId: "openai", openaiTtsSpeed: 1.2 })).toBe(1.2)
    expect(getTextToSpeechPlaybackRate({ ttsProviderId: "edge" })).toBe(1.0)
    expect(getTextToSpeechPlaybackRate({ ttsProviderId: "supertonic" })).toBe(1.05)
    expect(getTextToSpeechPlaybackRate(undefined)).toBe(1.0)
  })

  it("formats local speech model progress for compact mobile status labels", () => {
    expect(formatLocalSpeechModelProgress()).toBe("Unknown")
    expect(formatLocalSpeechModelProgress({ downloaded: true, downloading: false, progress: 1 })).toBe("Ready")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: true, progress: 0.42 })).toBe("Downloading 42%")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: false, progress: 0, error: "failed" })).toBe("Needs retry")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: false, progress: 0 })).toBe("Not installed")
  })
})
