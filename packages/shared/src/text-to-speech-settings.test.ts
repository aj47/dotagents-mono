import { describe, expect, it } from "vitest"

import {
  DEFAULT_GROQ_ARABIC_TTS_VOICE,
  DEFAULT_OPENAI_TTS_RESPONSE_FORMAT,
  DEFAULT_SUPERTONIC_TTS_LANGUAGE,
  DEFAULT_SUPERTONIC_TTS_STEPS,
  DEFAULT_TTS_AUTO_PLAY,
  DEFAULT_TTS_CONVERT_MARKDOWN,
  DEFAULT_TTS_ENABLED,
  DEFAULT_TTS_PREPROCESSING_ENABLED,
  DEFAULT_TTS_REMOVE_CODE_BLOCKS,
  DEFAULT_TTS_REMOVE_URLS,
  DEFAULT_TTS_USE_LLM_PREPROCESSING,
  GROQ_ARABIC_TTS_MODEL,
  MAX_SUPERTONIC_TTS_STEPS,
  MIN_SUPERTONIC_TTS_STEPS,
  OPENAI_TTS_RESPONSE_FORMATS,
  SPEECH_SELECTOR_PRESENTATION,
  TEXT_TO_SPEECH_SPEED_SETTING_KEYS,
  clampTextToSpeechPlaybackRate,
  createChatRuntimeEffectiveRemoteSpeechSettingsState,
  createChatRuntimeRemoteSpeechSettingsState,
  formatSpeechSelectorMicrophoneEnumerationError,
  formatLocalSpeechModelProgress,
  getChatRuntimeDefaultRemoteSpeechSettingsState,
  getSpeechSelectorCopyState,
  getSpeechSelectorMobileCloseIconState,
  getSpeechSelectorMobileSurfaceColors,
  getSpeechSelectorMobileSurfaceState,
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
import { DEFAULT_EDGE_TTS_VOICE } from "./providers"

describe("text to speech settings helpers", () => {
  it("exports shared boolean defaults", () => {
    expect(DEFAULT_TTS_ENABLED).toBe(true)
    expect(DEFAULT_TTS_AUTO_PLAY).toBe(true)
    expect(DEFAULT_TTS_PREPROCESSING_ENABLED).toBe(true)
    expect(DEFAULT_TTS_REMOVE_CODE_BLOCKS).toBe(true)
    expect(DEFAULT_TTS_REMOVE_URLS).toBe(true)
    expect(DEFAULT_TTS_CONVERT_MARKDOWN).toBe(true)
    expect(DEFAULT_TTS_USE_LLM_PREPROCESSING).toBe(false)
  })

  it("exports mobile speech selector presentation tokens", () => {
    expect(SPEECH_SELECTOR_PRESENTATION.copy.common.systemDefaultLabel).toBe("System Default")
    expect(SPEECH_SELECTOR_PRESENTATION.copy.microphone.pickerTitle).toBe("Select Microphone")
    expect(SPEECH_SELECTOR_PRESENTATION.copy.microphone.enumerationUnsupportedMessage)
      .toBe("Audio device enumeration is not supported.")
    expect(SPEECH_SELECTOR_PRESENTATION.copy.microphone.enumerationFailedMessage)
      .toBe("Failed to enumerate audio devices.")
    expect(SPEECH_SELECTOR_PRESENTATION.copy.voice.testVoiceLabel).toBe("Test voice")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.container.marginTop).toBe("sm")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.row.flexDirection).toBe("row")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.row.gap).toBe("sm")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.label.fontSize).toBe(16)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.label.colorToken).toBe("foreground")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.nativeHint.colorToken).toBe("mutedForeground")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.helperText.marginTop).toBe("xs")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.trigger.backgroundColorToken).toBe("muted")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.trigger.textNumberOfLines).toBe(2)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.trigger.accessibilityRole).toBe("button")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.trigger.pressedOpacity).toBe(0.78)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.triggerText.flex).toBe(1)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.triggerText.flexShrink).toBe(1)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.sliderHeader.flexDirection).toBe("row")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.sliderHeader.justifyContent).toBe("space-between")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.sliderHeader.alignItems).toBe("center")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.sliderValue.colorToken).toBe("mutedForeground")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.slider.height).toBe(40)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.slider.minimumTrackTintColorToken).toBe("primary")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.slider.maximumTrackTintColorToken).toBe("muted")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.slider.thumbTintColorToken).toBe("primary")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.testButton.alignItems).toBe("center")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.testButton.backgroundColorToken).toBe("muted")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.testButton.accessibilityRole).toBe("button")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.testButton.pressedOpacity).toBe(0.78)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.testButtonText.colorToken).toBe("foreground")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.disclosureIcon.name).toBe("chevron-down")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.modalOverlay.flex).toBe(1)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.modalOverlay.color).toBe("#000000")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.modalOverlay.alpha).toBe(0.5)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.modalOverlay.justifyContent).toBe("flex-end")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.sheet.backgroundColorToken).toBe("card")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeButton.width).toBe(32)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeButton.height).toBe(32)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeButton.alignItems).toBe("center")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeButton.justifyContent).toBe("center")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeButton.accessibilityRole).toBe("button")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeButton.pressedOpacity).toBe(0.72)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon.name).toBe("close")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon.size).toBe(20)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon.colorToken).toBe("mutedForeground")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.selectedItem.backgroundAlpha).toBe(0.125)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.item.accessibilityRole).toBe("button")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.item.pressedOpacity).toBe(0.78)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.selectedIcon.name).toBe("checkmark")
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.itemText.numberOfLines).toBe(1)
    expect(SPEECH_SELECTOR_PRESENTATION.mobile.itemSubtext.numberOfLines).toBe(1)
    expect(getSpeechSelectorCopyState()).toBe(SPEECH_SELECTOR_PRESENTATION.copy)
    expect(getSpeechSelectorMobileSurfaceState()).toBe(SPEECH_SELECTOR_PRESENTATION.mobile)
    expect(getSpeechSelectorMobileCloseIconState()).toEqual({
      name: "close",
      size: 20,
      colorToken: "mutedForeground",
    })
  })

  it("resolves mobile speech selector colors from shared palette tokens", () => {
    const colors = getSpeechSelectorMobileSurfaceColors({
      foreground: "#111111",
      mutedForeground: "#777777",
      muted: "#eeeeee",
      primary: "#123456",
      destructive: "#ff0000",
      card: "#ffffff",
      border: "#dedede",
    })

    expect(colors).toEqual({
      label: { color: "#111111" },
      nativeHint: { color: "#777777" },
      helperText: { color: "#777777" },
      trigger: { backgroundColor: "#eeeeee" },
      triggerText: { color: "#111111" },
      sliderValue: { color: "#777777" },
      slider: {
        minimumTrackTintColor: "#123456",
        maximumTrackTintColor: "#eeeeee",
        thumbTintColor: "#123456",
      },
      testButton: { backgroundColor: "#eeeeee" },
      testButtonText: { color: "#111111" },
      disclosureIcon: { color: "#777777" },
      errorText: { color: "#ff0000" },
      modalOverlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
      sheet: { backgroundColor: "#ffffff" },
      header: { borderBottomColor: "#dedede" },
      title: { color: "#111111" },
      closeIcon: { color: "#777777" },
      groupHeader: { color: "#777777" },
      selectedItem: { backgroundColor: "rgba(18, 52, 86, 0.125)" },
      itemText: {
        color: "#111111",
        selectedColor: "#123456",
      },
      itemSubtext: { color: "#777777" },
      selectedIcon: { color: "#123456" },
    })
  })

  it("formats microphone enumeration errors for shared selector surfaces", () => {
    expect(formatSpeechSelectorMicrophoneEnumerationError(new Error("Permission denied")))
      .toBe("Permission denied")
    expect(formatSpeechSelectorMicrophoneEnumerationError(new Error("   ")))
      .toBe("Failed to enumerate audio devices.")
    expect(formatSpeechSelectorMicrophoneEnumerationError("No devices")).toBe("No devices")
    expect(formatSpeechSelectorMicrophoneEnumerationError("  "))
      .toBe("Failed to enumerate audio devices.")
    expect(formatSpeechSelectorMicrophoneEnumerationError(null))
      .toBe("Failed to enumerate audio devices.")
  })

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

  it("derives remote speech settings from shared TTS settings", () => {
    expect(getChatRuntimeDefaultRemoteSpeechSettingsState()).toEqual({
      provider: "native",
      voice: DEFAULT_EDGE_TTS_VOICE,
      model: undefined,
      rate: 1.0,
    })

    expect(createChatRuntimeRemoteSpeechSettingsState({
      ttsProviderId: "openai",
      openaiTtsVoice: "alloy",
      openaiTtsModel: "gpt-4o-mini-tts",
      openaiTtsSpeed: 1.25,
    })).toEqual({
      provider: "openai",
      voice: "alloy",
      model: "gpt-4o-mini-tts",
      rate: 1.25,
    })

    expect(createChatRuntimeRemoteSpeechSettingsState({
      ttsProviderId: "kitten",
      kittenVoiceId: 3,
    })).toEqual({
      provider: "kitten",
      voice: "3",
      model: undefined,
      rate: 1.0,
    })
  })

  it("applies mobile local Edge speech overrides to remote speech settings", () => {
    const remoteSettings = {
      provider: "openai" as const,
      voice: "alloy",
      model: "gpt-4o-mini-tts",
      rate: 1.25,
    }

    expect(createChatRuntimeEffectiveRemoteSpeechSettingsState({
      config: {
        ttsProvider: "edge",
        edgeTtsVoice: "en-US-AriaNeural",
        ttsRate: 0.9,
      },
      remoteSettings,
    })).toEqual({
      provider: "edge",
      voice: "en-US-AriaNeural",
      model: undefined,
      rate: 0.9,
    })

    expect(createChatRuntimeEffectiveRemoteSpeechSettingsState({
      config: {
        ttsProvider: "native",
        edgeTtsVoice: "en-US-AriaNeural",
        ttsRate: 0.9,
      },
      remoteSettings,
    })).toEqual(remoteSettings)
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

  it("clamps playback rates using provider speed bounds", () => {
    expect(clampTextToSpeechPlaybackRate(0.1, "edge")).toBe(0.5)
    expect(clampTextToSpeechPlaybackRate(2.5, "edge")).toBe(2.0)
    expect(clampTextToSpeechPlaybackRate(1.25, "edge")).toBe(1.25)
    expect(clampTextToSpeechPlaybackRate(undefined, "supertonic")).toBe(1.05)
    expect(clampTextToSpeechPlaybackRate(Number.NaN, "openai")).toBe(1.0)
  })

  it("formats local speech model progress for compact mobile status labels", () => {
    expect(formatLocalSpeechModelProgress()).toBe("Unknown")
    expect(formatLocalSpeechModelProgress({ downloaded: true, downloading: false, progress: 1 })).toBe("Ready")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: true, progress: 0.42 })).toBe("Downloading 42%")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: false, progress: 0, error: "failed" })).toBe("Needs retry")
    expect(formatLocalSpeechModelProgress({ downloaded: false, downloading: false, progress: 0 })).toBe("Not installed")
  })
})
