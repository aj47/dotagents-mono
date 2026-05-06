import { describe, expect, it } from "vitest"

import {
  DEFAULT_GROQ_ARABIC_TTS_VOICE,
  DEFAULT_OPENAI_TTS_RESPONSE_FORMAT,
  DEFAULT_SUPERTONIC_TTS_LANGUAGE,
  DEFAULT_SUPERTONIC_TTS_STEPS,
  GROQ_ARABIC_TTS_MODEL,
  MAX_SUPERTONIC_TTS_STEPS,
  MIN_SUPERTONIC_TTS_STEPS,
  OPENAI_TTS_RESPONSE_FORMATS,
  TEXT_TO_SPEECH_SPEED_SETTING_KEYS,
  formatLocalSpeechModelProgress,
  getTextToSpeechModelDefault,
  getTextToSpeechModelValue,
  getTextToSpeechPlaybackRate,
  getTextToSpeechSpeedDefault,
  getTextToSpeechSpeedSetting,
  getTextToSpeechSpeedSettingByKey,
  getTextToSpeechSpeedValue,
  getTextToSpeechVoiceDefault,
  getTextToSpeechVoiceValue,
  isSupertonicLanguageUpdateValue,
  isSupertonicStepsUpdateValue,
  isOpenAITtsResponseFormatUpdateValue,
  isTextToSpeechModelUpdateValue,
  isTextToSpeechSpeedUpdateValue,
  isTextToSpeechVoiceUpdateValue,
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

  it("resolves provider-specific model and voice defaults", () => {
    expect(getTextToSpeechModelDefault()).toBe("gpt-4o-mini-tts")
    expect(getTextToSpeechModelDefault("groq")).toBe("canopylabs/orpheus-v1-english")
    expect(getTextToSpeechModelDefault("edge")).toBe("edge-tts")
    expect(getTextToSpeechModelDefault("kitten")).toBeUndefined()
    expect(getTextToSpeechVoiceDefault()).toBe("alloy")
    expect(getTextToSpeechVoiceDefault("groq")).toBe("troy")
    expect(getTextToSpeechVoiceDefault("groq", GROQ_ARABIC_TTS_MODEL)).toBe(DEFAULT_GROQ_ARABIC_TTS_VOICE)
    expect(getTextToSpeechVoiceDefault("kitten")).toBe(0)
    expect(getTextToSpeechVoiceDefault("supertonic")).toBe("M1")
    expect(DEFAULT_SUPERTONIC_TTS_LANGUAGE).toBe("en")
    expect(DEFAULT_SUPERTONIC_TTS_STEPS).toBe(5)
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

  it("validates provider model, voice, and Supertonic option updates", () => {
    expect(isTextToSpeechModelUpdateValue("openai", "gpt-4o-mini-tts")).toBe(true)
    expect(isTextToSpeechModelUpdateValue("groq", GROQ_ARABIC_TTS_MODEL)).toBe(true)
    expect(isTextToSpeechModelUpdateValue("groq", "playai-tts")).toBe(false)
    expect(isTextToSpeechVoiceUpdateValue("groq", DEFAULT_GROQ_ARABIC_TTS_VOICE, GROQ_ARABIC_TTS_MODEL)).toBe(true)
    expect(isTextToSpeechVoiceUpdateValue("groq", "troy", GROQ_ARABIC_TTS_MODEL)).toBe(false)
    expect(isTextToSpeechVoiceUpdateValue("kitten", 3)).toBe(true)
    expect(isTextToSpeechVoiceUpdateValue("kitten", "3")).toBe(false)
    expect(isSupertonicLanguageUpdateValue(DEFAULT_SUPERTONIC_TTS_LANGUAGE)).toBe(true)
    expect(isSupertonicLanguageUpdateValue("de")).toBe(false)
    expect(isSupertonicStepsUpdateValue(MIN_SUPERTONIC_TTS_STEPS)).toBe(true)
    expect(isSupertonicStepsUpdateValue(MAX_SUPERTONIC_TTS_STEPS)).toBe(true)
    expect(isSupertonicStepsUpdateValue(MIN_SUPERTONIC_TTS_STEPS - 1)).toBe(false)
    expect(isSupertonicStepsUpdateValue(MAX_SUPERTONIC_TTS_STEPS + 1)).toBe(false)
  })

  it("validates OpenAI response format updates", () => {
    expect(DEFAULT_OPENAI_TTS_RESPONSE_FORMAT).toBe("mp3")
    expect(OPENAI_TTS_RESPONSE_FORMATS).toEqual(["mp3", "opus", "aac", "flac", "wav", "pcm"])
    expect(isOpenAITtsResponseFormatUpdateValue("aac")).toBe(true)
    expect(isOpenAITtsResponseFormatUpdateValue("json")).toBe(false)
    expect(isOpenAITtsResponseFormatUpdateValue(undefined)).toBe(false)
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
