import type { LocalSpeechModelStatus, OpenAITtsResponseFormat, TextToSpeechConfig } from "./api-types"
import { hexToRgba } from "./colors"
import {
  DEFAULT_EDGE_TTS_VOICE,
  SUPERTONIC_TTS_LANGUAGES,
  getTtsModelsForProvider,
  getTtsVoicesForProvider,
  getTtsModelSettingKey,
  getTtsVoiceSettingKey,
  type TtsVoiceSettingKey,
} from "./providers"

export type TextToSpeechSpeedSettingKey = "openaiTtsSpeed" | "edgeTtsRate" | "supertonicSpeed"

export type TextToSpeechSpeedSetting = {
  key: TextToSpeechSpeedSettingKey
  minimumValue: number
  maximumValue: number
  step: number
  defaultValue: number
  fractionDigits: number
}

export const TEXT_TO_SPEECH_SPEED_SETTING_KEYS = [
  "openaiTtsSpeed",
  "edgeTtsRate",
  "supertonicSpeed",
] as const

const DEFAULT_TTS_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini-tts",
  groq: "canopylabs/orpheus-v1-english",
  gemini: "gemini-2.5-flash-preview-tts",
  edge: "edge-tts",
}

const DEFAULT_TTS_VOICES: Record<string, string | number> = {
  openai: "alloy",
  groq: "troy",
  gemini: "Kore",
  edge: DEFAULT_EDGE_TTS_VOICE,
  kitten: 0,
  supertonic: "M1",
}

export const DEFAULT_SUPERTONIC_TTS_LANGUAGE = "en"
export const DEFAULT_SUPERTONIC_TTS_STEPS = 5
export const MIN_SUPERTONIC_TTS_STEPS = 2
export const MAX_SUPERTONIC_TTS_STEPS = 10
export const DEFAULT_OPENAI_TTS_RESPONSE_FORMAT: OpenAITtsResponseFormat = "mp3"
export const OPENAI_TTS_RESPONSE_FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"] as const
export const GROQ_ARABIC_TTS_MODEL = "canopylabs/orpheus-arabic-saudi"
export const DEFAULT_GROQ_ARABIC_TTS_VOICE = "fahad"
export const DEFAULT_TTS_ENABLED = true
export const DEFAULT_TTS_AUTO_PLAY = true
export const DEFAULT_TTS_PREPROCESSING_ENABLED = true
export const DEFAULT_TTS_REMOVE_CODE_BLOCKS = true
export const DEFAULT_TTS_REMOVE_URLS = true
export const DEFAULT_TTS_CONVERT_MARKDOWN = true
export const DEFAULT_TTS_USE_LLM_PREPROCESSING = false

export const SPEECH_SELECTOR_PRESENTATION = {
  copy: {
    common: {
      systemDefaultLabel: "System Default",
      closeLabel: "Close",
    },
    microphone: {
      label: "Microphone",
      nativeHint: "System Default",
      nativeHelper: "Microphone selection is managed by your device's OS settings.",
      selectAccessibilityLabel: "Select microphone",
      pickerTitle: "Select Microphone",
      closeAccessibilityLabel: "Close microphone picker",
      enumerationUnsupportedMessage: "Audio device enumeration is not supported.",
      enumerationFailedMessage: "Failed to enumerate audio devices.",
    },
    voice: {
      label: "Voice",
      speedLabel: "Speed",
      pitchLabel: "Pitch",
      testVoiceLabel: "Test voice",
      testVoiceAccessibilityLabel: "Test text-to-speech voice",
      pickerTitle: "Select Voice",
      closeAccessibilityLabel: "Close voice picker",
      edgeGroupLabel: "Edge TTS (Free)",
      nativeGroupLabel: "Device Voices",
    },
  },
  mobile: {
    container: {
      marginTop: "sm",
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "sm",
      paddingVertical: "sm",
    },
    label: {
      fontSize: 16,
      colorToken: "foreground",
      flexGrow: 1,
      flexShrink: 1,
    },
    nativeHint: {
      fontSize: 14,
      colorToken: "mutedForeground",
    },
    helperText: {
      fontSize: 12,
      colorToken: "mutedForeground",
      marginTop: "xs",
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColorToken: "muted",
      paddingHorizontal: "sm",
      paddingVertical: "sm",
      borderRadius: "md",
      gap: "sm",
      flexGrow: 1,
      maxWidth: "100%",
      minWidth: 140,
      textNumberOfLines: 2,
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    triggerText: {
      fontSize: 14,
      colorToken: "foreground",
      flex: 1,
      flexShrink: 1,
    },
    sliderRow: {
      paddingVertical: "sm",
    },
    sliderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "xs",
    },
    sliderValue: {
      fontSize: 14,
      colorToken: "mutedForeground",
    },
    slider: {
      width: "100%",
      height: 40,
      minimumTrackTintColorToken: "primary",
      maximumTrackTintColorToken: "muted",
      thumbTintColorToken: "primary",
    },
    testButton: {
      backgroundColorToken: "muted",
      paddingVertical: "sm",
      paddingHorizontal: "md",
      borderRadius: "md",
      alignItems: "center",
      marginTop: "sm",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    testButtonText: {
      fontSize: 14,
      colorToken: "foreground",
    },
    disclosureIcon: {
      name: "chevron-down",
      size: 14,
      colorToken: "mutedForeground",
    },
    errorText: {
      fontSize: 12,
      colorToken: "destructive",
      marginTop: "xs",
    },
    modalOverlay: {
      flex: 1,
      color: "#000000",
      alpha: 0.5,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColorToken: "card",
      borderTopRadius: "lg",
      maxHeight: "70%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "sm",
      paddingHorizontal: "lg",
      paddingVertical: "md",
      borderBottomWidth: 1,
      borderBottomColorToken: "border",
    },
    title: {
      flex: 1,
      flexShrink: 1,
      fontSize: 18,
      fontWeight: "600",
      colorToken: "foreground",
      paddingRight: "xs",
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: "md",
      alignItems: "center",
      justifyContent: "center",
      accessibilityRole: "button",
      pressedOpacity: 0.72,
      paddingHorizontal: "sm",
      paddingVertical: "xs",
    },
    closeIcon: {
      name: "close",
      size: 20,
      colorToken: "mutedForeground",
    },
    list: {
      padding: "md",
    },
    groupHeader: {
      fontSize: 12,
      fontWeight: "600",
      colorToken: "mutedForeground",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: "md",
      marginBottom: "xs",
      paddingHorizontal: "sm",
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: "md",
      paddingHorizontal: "sm",
      borderRadius: "md",
      gap: "sm",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    selectedItem: {
      backgroundColorToken: "primary",
      backgroundAlpha: 0.125,
    },
    itemBody: {
      flex: 1,
      minWidth: 0,
    },
    itemText: {
      fontSize: 16,
      colorToken: "foreground",
      selectedColorToken: "primary",
      selectedFontWeight: "600",
      numberOfLines: 1,
    },
    itemSubtext: {
      fontSize: 12,
      colorToken: "mutedForeground",
      marginTop: 2,
      numberOfLines: 1,
    },
    selectedIcon: {
      name: "checkmark",
      size: 18,
      colorToken: "primary",
    },
  },
} as const

export interface SpeechSelectorMobileCloseIconState {
  name: typeof SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon.name
  size: number
  colorToken: typeof SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon.colorToken
}

export type SpeechSelectorMobileSurfaceColorToken =
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.label.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.nativeHint.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.helperText.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.trigger.backgroundColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.triggerText.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.sliderValue.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.slider.minimumTrackTintColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.slider.maximumTrackTintColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.slider.thumbTintColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.testButton.backgroundColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.testButtonText.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.disclosureIcon.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.errorText.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.sheet.backgroundColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.header.borderBottomColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.title.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.groupHeader.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.selectedItem.backgroundColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.itemText.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.itemText.selectedColorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.itemSubtext.colorToken
  | typeof SPEECH_SELECTOR_PRESENTATION.mobile.selectedIcon.colorToken

export type SpeechSelectorMobileSurfaceColorPalette =
  Readonly<Record<SpeechSelectorMobileSurfaceColorToken, string>>

export interface SpeechSelectorMobileSurfaceColors {
  label: { color: string }
  nativeHint: { color: string }
  helperText: { color: string }
  trigger: { backgroundColor: string }
  triggerText: { color: string }
  sliderValue: { color: string }
  slider: {
    minimumTrackTintColor: string
    maximumTrackTintColor: string
    thumbTintColor: string
  }
  testButton: { backgroundColor: string }
  testButtonText: { color: string }
  disclosureIcon: { color: string }
  errorText: { color: string }
  modalOverlay: { backgroundColor: string }
  sheet: { backgroundColor: string }
  header: { borderBottomColor: string }
  title: { color: string }
  closeIcon: { color: string }
  groupHeader: { color: string }
  selectedItem: { backgroundColor: string }
  itemText: {
    color: string
    selectedColor: string
  }
  itemSubtext: { color: string }
  selectedIcon: { color: string }
}

export function getSpeechSelectorCopyState(): typeof SPEECH_SELECTOR_PRESENTATION.copy {
  return SPEECH_SELECTOR_PRESENTATION.copy
}

export function getSpeechSelectorMobileSurfaceState(): typeof SPEECH_SELECTOR_PRESENTATION.mobile {
  return SPEECH_SELECTOR_PRESENTATION.mobile
}

export function getSpeechSelectorMobileSurfaceColors(
  colors: SpeechSelectorMobileSurfaceColorPalette,
): SpeechSelectorMobileSurfaceColors {
  const surface = SPEECH_SELECTOR_PRESENTATION.mobile

  return {
    label: {
      color: colors[surface.label.colorToken],
    },
    nativeHint: {
      color: colors[surface.nativeHint.colorToken],
    },
    helperText: {
      color: colors[surface.helperText.colorToken],
    },
    trigger: {
      backgroundColor: colors[surface.trigger.backgroundColorToken],
    },
    triggerText: {
      color: colors[surface.triggerText.colorToken],
    },
    sliderValue: {
      color: colors[surface.sliderValue.colorToken],
    },
    slider: {
      minimumTrackTintColor: colors[surface.slider.minimumTrackTintColorToken],
      maximumTrackTintColor: colors[surface.slider.maximumTrackTintColorToken],
      thumbTintColor: colors[surface.slider.thumbTintColorToken],
    },
    testButton: {
      backgroundColor: colors[surface.testButton.backgroundColorToken],
    },
    testButtonText: {
      color: colors[surface.testButtonText.colorToken],
    },
    disclosureIcon: {
      color: colors[surface.disclosureIcon.colorToken],
    },
    errorText: {
      color: colors[surface.errorText.colorToken],
    },
    modalOverlay: {
      backgroundColor: hexToRgba(surface.modalOverlay.color, surface.modalOverlay.alpha),
    },
    sheet: {
      backgroundColor: colors[surface.sheet.backgroundColorToken],
    },
    header: {
      borderBottomColor: colors[surface.header.borderBottomColorToken],
    },
    title: {
      color: colors[surface.title.colorToken],
    },
    closeIcon: {
      color: colors[surface.closeIcon.colorToken],
    },
    groupHeader: {
      color: colors[surface.groupHeader.colorToken],
    },
    selectedItem: {
      backgroundColor: hexToRgba(
        colors[surface.selectedItem.backgroundColorToken],
        surface.selectedItem.backgroundAlpha,
      ),
    },
    itemText: {
      color: colors[surface.itemText.colorToken],
      selectedColor: colors[surface.itemText.selectedColorToken],
    },
    itemSubtext: {
      color: colors[surface.itemSubtext.colorToken],
    },
    selectedIcon: {
      color: colors[surface.selectedIcon.colorToken],
    },
  }
}

export function getSpeechSelectorMobileCloseIconState(): SpeechSelectorMobileCloseIconState {
  const closeIcon = SPEECH_SELECTOR_PRESENTATION.mobile.closeIcon

  return {
    name: closeIcon.name,
    size: closeIcon.size,
    colorToken: closeIcon.colorToken,
  }
}

export function formatSpeechSelectorMicrophoneEnumerationError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim()
    if (message) return message
  }

  if (typeof error === "string") {
    const message = error.trim()
    if (message) return message
  }

  return SPEECH_SELECTOR_PRESENTATION.copy.microphone.enumerationFailedMessage
}

const TEXT_TO_SPEECH_SPEED_SETTINGS: Record<string, TextToSpeechSpeedSetting> = {
  openai: {
    key: "openaiTtsSpeed",
    minimumValue: 0.25,
    maximumValue: 4.0,
    step: 0.25,
    defaultValue: 1.0,
    fractionDigits: 1,
  },
  edge: {
    key: "edgeTtsRate",
    minimumValue: 0.5,
    maximumValue: 2.0,
    step: 0.1,
    defaultValue: 1.0,
    fractionDigits: 1,
  },
  supertonic: {
    key: "supertonicSpeed",
    minimumValue: 0.5,
    maximumValue: 2.0,
    step: 0.05,
    defaultValue: 1.05,
    fractionDigits: 2,
  },
}

const TEXT_TO_SPEECH_SPEED_SETTINGS_BY_KEY = Object.fromEntries(
  Object.values(TEXT_TO_SPEECH_SPEED_SETTINGS).map((setting) => [setting.key, setting]),
) as Record<TextToSpeechSpeedSettingKey, TextToSpeechSpeedSetting>

export function getTextToSpeechSpeedSetting(providerId?: string | null): TextToSpeechSpeedSetting | undefined {
  return TEXT_TO_SPEECH_SPEED_SETTINGS[providerId || "openai"]
}

export function getTextToSpeechModelDefault(providerId?: string | null): string | undefined {
  return DEFAULT_TTS_MODELS[providerId || "openai"]
}

export function getTextToSpeechVoiceDefault(
  providerId?: string | null,
  model?: string | null,
): string | number | undefined {
  if ((providerId || "openai") === "groq" && model === GROQ_ARABIC_TTS_MODEL) {
    return DEFAULT_GROQ_ARABIC_TTS_VOICE
  }
  return DEFAULT_TTS_VOICES[providerId || "openai"]
}

export function getTextToSpeechSpeedSettingByKey(
  key: TextToSpeechSpeedSettingKey,
): TextToSpeechSpeedSetting {
  return TEXT_TO_SPEECH_SPEED_SETTINGS_BY_KEY[key]
}

export function getTextToSpeechSpeedDefault(providerId?: string | null): number {
  return getTextToSpeechSpeedSetting(providerId)?.defaultValue ?? 1.0
}

export function isTextToSpeechSpeedUpdateValue(
  key: TextToSpeechSpeedSettingKey,
  value: unknown,
): value is number {
  const setting = getTextToSpeechSpeedSettingByKey(key)
  return typeof value === "number" && value >= setting.minimumValue && value <= setting.maximumValue
}

export function isTextToSpeechModelUpdateValue(
  providerId: string,
  value: unknown,
): value is string {
  return typeof value === "string" && getTtsModelsForProvider(providerId).some((model) => model.value === value)
}

export function isTextToSpeechVoiceUpdateValue(
  providerId: string,
  value: unknown,
  model?: string | null,
): value is string | number {
  return (typeof value === "string" || typeof value === "number")
    && getTtsVoicesForProvider(providerId, model ?? undefined).some((voice) => voice.value === value)
}

export function isSupertonicLanguageUpdateValue(value: unknown): value is string {
  return typeof value === "string" && SUPERTONIC_TTS_LANGUAGES.some((language) => language.value === value)
}

export function isSupertonicStepsUpdateValue(value: unknown): value is number {
  return Number.isInteger(value)
    && (value as number) >= MIN_SUPERTONIC_TTS_STEPS
    && (value as number) <= MAX_SUPERTONIC_TTS_STEPS
}

export function isOpenAITtsResponseFormatUpdateValue(value: unknown): value is OpenAITtsResponseFormat {
  return typeof value === "string"
    && OPENAI_TTS_RESPONSE_FORMATS.includes(value as OpenAITtsResponseFormat)
}

export function getTextToSpeechModelValue(settings?: TextToSpeechConfig | null): string | undefined {
  if (!settings) return undefined
  const key = getTtsModelSettingKey(settings.ttsProviderId || "openai")
  return key ? settings[key] : undefined
}

export function getTextToSpeechVoiceValue(settings?: TextToSpeechConfig | null): string | number | undefined {
  if (!settings) return undefined
  const key = getTtsVoiceSettingKey(settings.ttsProviderId || "openai")
  return key ? settings[key] : undefined
}

export function normalizeTextToSpeechVoiceUpdateValue(
  key: TtsVoiceSettingKey,
  value: string | number,
): string | number {
  return key === "kittenVoiceId" ? Number(value) : String(value)
}

export function getTextToSpeechSpeedValue(settings?: TextToSpeechConfig | null): number | undefined {
  if (!settings) return undefined
  const speedSetting = getTextToSpeechSpeedSetting(settings.ttsProviderId)
  return speedSetting ? settings[speedSetting.key] : undefined
}

export function getTextToSpeechPlaybackRate(settings?: TextToSpeechConfig | null): number {
  const speedSetting = getTextToSpeechSpeedSetting(settings?.ttsProviderId)
  const speed = getTextToSpeechSpeedValue(settings)
  if (speed !== undefined) return speed
  return speedSetting?.defaultValue ?? getTextToSpeechSpeedDefault()
}

export function clampTextToSpeechPlaybackRate(value?: number, providerId?: string | null): number {
  const speedSetting = getTextToSpeechSpeedSetting(providerId)
  const minimumValue = speedSetting?.minimumValue ?? 0.5
  const maximumValue = speedSetting?.maximumValue ?? 2.0
  const defaultValue = speedSetting?.defaultValue ?? getTextToSpeechSpeedDefault(providerId)
  const speed = typeof value === "number" && Number.isFinite(value) ? value : defaultValue
  return Math.min(maximumValue, Math.max(minimumValue, speed))
}

export function formatLocalSpeechModelProgress(status?: LocalSpeechModelStatus): string {
  if (!status) return "Unknown"
  if (status.downloaded) return "Ready"
  if (status.downloading) return `Downloading ${Math.round((status.progress ?? 0) * 100)}%`
  if (status.error) return "Needs retry"
  return "Not installed"
}
