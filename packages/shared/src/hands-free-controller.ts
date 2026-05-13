import type { HandsFreePhase, HandsFreeResumePhase } from "./types"
import { matchSleepPhrase, matchWakePhrase, normalizeVoicePhrase } from "./voice-phrase-matcher"

export type HandsFreeControllerState = {
  phase: HandsFreePhase
  resumePhase: HandsFreeResumePhase | null
  pauseReason: "user" | "background" | null
  awakeSince: number | null
  lastError: string | null
  lastTranscript: string
  recognizerErrorCount: number
}

export type HandsFreeUtteranceAction =
  | { type: "none" }
  | { type: "send"; text: string }

export type ResolveHandsFreeUtteranceArgs = {
  state: HandsFreeControllerState
  transcript: string
  wakePhrase: string
  sleepPhrase: string
  now: number
}

export const DEFAULT_HANDS_FREE_MAX_AWAKE_MS = 10 * 60 * 1000
export const DEFAULT_HANDS_FREE_NO_SPEECH_TIMEOUT_MS = 45 * 1000
export const DEFAULT_HANDS_FREE_REPEATED_ERROR_THRESHOLD = 3

export type HandsFreeStatusChipMobileColorToken =
  | "secondary"
  | "border"
  | "foreground"
  | "primary"
  | "primaryForeground"
  | "muted"
  | "destructive"

export type HandsFreeStatusChipMobileColorPalette = Readonly<Record<HandsFreeStatusChipMobileColorToken, string>>

export interface HandsFreeStatusChipMobileColors {
  backgroundColor: string
  borderColor: string
  textColor: string
}

export type HandsFreeComposerMobileSurfaceColorToken =
  | typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.borderColorToken
  | typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.backgroundColorToken
  | typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButtonText.colorToken
  | typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugPanel.backgroundColorToken
  | typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugPanel.borderLeftColorToken
  | typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugText.colorToken

export type HandsFreeComposerMobileSurfaceColorPalette =
  Readonly<Record<HandsFreeComposerMobileSurfaceColorToken, string>>

export interface HandsFreeComposerMobileSurfaceColors {
  controlButton: {
    borderColor: string
    backgroundColor: string
  }
  controlButtonText: {
    color: string
  }
  debugPanel: {
    backgroundColor: string
    borderLeftColor: string
  }
  debugText: {
    color: string
  }
}

export const HANDS_FREE_COMPOSER_PRESENTATION = {
  controls: {
    wakeLabel: "Wake",
    sleepLabel: "Sleep",
    pauseLabel: "Pause",
    resumeLabel: "Resume",
    holdLabel: "Hold",
    listeningLabel: "...",
  },
  debug: {
    enabled: "Handsfree mode turned on. Say the wake phrase to begin.",
    disabled: "Handsfree mode turned off.",
    awake: "Handsfree awake. Listening for your request.",
    resumed: "Handsfree resumed.",
    paused: "Handsfree paused.",
    transcriptAdded: "Voice transcript added to the composer.",
    permissionDenied: "Speech recognition permission denied.",
    voiceDebugTitle: "Voice debug",
  },
  subtitles: {
    waking: "Listening for your next request.",
    processing: "Working on your request.",
    speaking: "Speech recognition pauses while the assistant speaks.",
    paused: "Tap the mic to resume handsfree listening.",
    errorFallback: "Voice recognition is recovering.",
    foregroundOnly: "Handsfree works while Chat stays open in the foreground.",
  },
  placeholders: {
    paused: "Handsfree paused — tap mic to resume or type a message",
    listening: "Listening…",
  },
  surface: {
    mobile: {
      statusRow: {
        paddingHorizontal: "sm",
        paddingTop: "xs",
      },
      controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: "xs",
        paddingHorizontal: "sm",
        paddingTop: "xs",
      },
      controlButton: {
        flex: 1,
        borderWidth: 1,
        borderColorToken: "border",
        backgroundColorToken: "background",
        minHeight: 36,
        paddingHorizontal: "sm",
        borderRadius: "md",
        pressedOpacity: 0.7,
        alignItems: "center",
        justifyContent: "center",
      },
      controlButtonText: {
        colorToken: "foreground",
        fontWeight: "600",
        fontSize: 12,
      },
      debugPanel: {
        backgroundColorToken: "muted",
        padding: "sm",
        margin: "sm",
        borderRadius: "lg",
        borderLeftWidth: 4,
        borderLeftColorToken: "primary",
      },
      debugText: {
        colorToken: "mutedForeground",
        fontSize: 12,
        fontFamilyByPlatform: {
          ios: "Menlo",
          default: "monospace",
        },
      },
      statusChip: {
        borderRadius: "full",
        borderWidth: 1,
        paddingHorizontal: "md",
        paddingVertical: "xs",
        alignSelf: "flex-start",
        maxWidth: "100%",
        label: {
          fontSize: 12,
          fontWeight: "700",
        },
        subtitle: {
          fontSize: 11,
          marginTop: 2,
          opacity: 0.92,
          numberOfLines: 2,
        },
        phaseColors: {
          sleeping: {
            backgroundColorToken: "secondary",
            borderColorToken: "border",
            textColorToken: "foreground",
          },
          waking: {
            backgroundColorToken: "primary",
            borderColorToken: "primary",
            textColorToken: "primaryForeground",
          },
          listening: {
            backgroundColorToken: "primary",
            borderColorToken: "primary",
            textColorToken: "primaryForeground",
          },
          processing: {
            backgroundColor: "#f59e0b",
            borderColor: "#f59e0b",
            textColor: "#111827",
          },
          speaking: {
            backgroundColor: "#8b5cf6",
            borderColor: "#8b5cf6",
            textColor: "#ffffff",
          },
          paused: {
            backgroundColorToken: "muted",
            borderColorToken: "border",
            textColorToken: "foreground",
          },
          error: {
            backgroundColorToken: "destructive",
            borderColorToken: "destructive",
            textColorToken: "primaryForeground",
          },
        },
      },
    },
  },
} as const

type HandsFreeStatusChipPhaseColorSpec =
  (typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.phaseColors)[HandsFreePhase]

export function getHandsFreeComposerMobileSurfaceState(): typeof HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile {
  return HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile
}

export function getHandsFreeComposerCopyState(): typeof HANDS_FREE_COMPOSER_PRESENTATION {
  return HANDS_FREE_COMPOSER_PRESENTATION
}

export function getHandsFreeComposerMobileSurfaceColors(
  colors: HandsFreeComposerMobileSurfaceColorPalette,
): HandsFreeComposerMobileSurfaceColors {
  const surface = HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile

  return {
    controlButton: {
      borderColor: colors[surface.controlButton.borderColorToken],
      backgroundColor: colors[surface.controlButton.backgroundColorToken],
    },
    controlButtonText: {
      color: colors[surface.controlButtonText.colorToken],
    },
    debugPanel: {
      backgroundColor: colors[surface.debugPanel.backgroundColorToken],
      borderLeftColor: colors[surface.debugPanel.borderLeftColorToken],
    },
    debugText: {
      color: colors[surface.debugText.colorToken],
    },
  }
}

function resolveHandsFreeStatusChipColor(
  spec: HandsFreeStatusChipPhaseColorSpec,
  colorField: "backgroundColor" | "borderColor" | "textColor",
  tokenField: "backgroundColorToken" | "borderColorToken" | "textColorToken",
  colors: HandsFreeStatusChipMobileColorPalette,
): string {
  if (colorField in spec) {
    return spec[colorField as keyof typeof spec] as string
  }

  return colors[spec[tokenField as keyof typeof spec] as HandsFreeStatusChipMobileColorToken]
}

export function getHandsFreeStatusChipMobileColors(
  phase: HandsFreePhase,
  colors: HandsFreeStatusChipMobileColorPalette,
): HandsFreeStatusChipMobileColors {
  const phaseColors = HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.phaseColors
  const spec = phaseColors[phase] ?? phaseColors.sleeping

  return {
    backgroundColor: resolveHandsFreeStatusChipColor(spec, "backgroundColor", "backgroundColorToken", colors),
    borderColor: resolveHandsFreeStatusChipColor(spec, "borderColor", "borderColorToken", colors),
    textColor: resolveHandsFreeStatusChipColor(spec, "textColor", "textColorToken", colors),
  }
}

export function createInitialHandsFreeState(): HandsFreeControllerState {
  return {
    phase: "sleeping",
    resumePhase: null,
    pauseReason: null,
    awakeSince: null,
    lastError: null,
    lastTranscript: "",
    recognizerErrorCount: 0,
  }
}

export function getHandsFreeResumePhase(
  phase: HandsFreePhase,
  resumePhase: HandsFreeResumePhase | null,
): HandsFreeResumePhase {
  if (phase === "processing") return "processing"
  if (phase === "listening" || phase === "waking" || phase === "speaking") return "listening"
  return resumePhase ?? "sleeping"
}

export function transitionHandsFreeToSleeping(state: HandsFreeControllerState): HandsFreeControllerState {
  return {
    ...state,
    phase: "sleeping",
    resumePhase: null,
    pauseReason: null,
    awakeSince: null,
    lastError: null,
  }
}

export function getHandsFreeStatusLabel(phase: HandsFreePhase): string {
  switch (phase) {
    case "sleeping":
      return "Sleeping"
    case "waking":
      return "Wake phrase heard"
    case "listening":
      return "Listening"
    case "processing":
      return "Thinking"
    case "speaking":
      return "Speaking"
    case "paused":
      return "Paused"
    case "error":
      return "Voice error"
    default:
      return "Sleeping"
  }
}

export function formatHandsFreeSleepingDebugMessage(wakePhrase: string): string {
  return `Handsfree sleeping. Say “${wakePhrase}” or tap Wake to begin.`
}

export function formatHandsFreeRecognizerErrorDebugMessage(message: string): string {
  return `Voice error: ${message}`
}

export function formatHandsFreeSleepingSubtitle(wakePhrase: string): string {
  return `Say “${wakePhrase}” or tap Wake to wake the assistant.`
}

export function formatHandsFreeListeningSubtitle(sleepPhrase: string): string {
  return `Say “${sleepPhrase}” to return to sleep.`
}

export function formatHandsFreeActivePlaceholder(wakePhrase: string): string {
  return `Say “${wakePhrase}” or type a message`
}

export function getHandsFreePauseResumeLabel(phase: HandsFreePhase): string {
  return phase === "paused"
    ? HANDS_FREE_COMPOSER_PRESENTATION.controls.resumeLabel
    : HANDS_FREE_COMPOSER_PRESENTATION.controls.pauseLabel
}

export type HandsFreeComposerPrimaryControlAction = "wake" | "sleep"
export type HandsFreeComposerSecondaryControlAction = "pause" | "resume"

export interface HandsFreeComposerControlState {
  primary: {
    action: HandsFreeComposerPrimaryControlAction
    label: string
  }
  secondary: {
    action: HandsFreeComposerSecondaryControlAction
    label: string
  }
}

export function getHandsFreeComposerControlState(phase: HandsFreePhase): HandsFreeComposerControlState {
  const isSleeping = phase === "sleeping"
  const isPaused = phase === "paused"

  return {
    primary: {
      action: isSleeping ? "wake" : "sleep",
      label: isSleeping
        ? HANDS_FREE_COMPOSER_PRESENTATION.controls.wakeLabel
        : HANDS_FREE_COMPOSER_PRESENTATION.controls.sleepLabel,
    },
    secondary: {
      action: isPaused ? "resume" : "pause",
      label: getHandsFreePauseResumeLabel(phase),
    },
  }
}

export function getHandsFreeMicButtonLabel({
  handsFree,
  phase,
  listening,
}: {
  handsFree: boolean
  phase: HandsFreePhase
  listening: boolean
}): string {
  if (handsFree) {
    return phase === "sleeping"
      ? HANDS_FREE_COMPOSER_PRESENTATION.controls.wakeLabel
      : getHandsFreePauseResumeLabel(phase)
  }

  return listening
    ? HANDS_FREE_COMPOSER_PRESENTATION.controls.listeningLabel
    : HANDS_FREE_COMPOSER_PRESENTATION.controls.holdLabel
}

export function getHandsFreeStatusSubtitle({
  phase,
  wakePhrase,
  sleepPhrase,
  lastError,
  foregroundOnly,
}: {
  phase: HandsFreePhase
  wakePhrase: string
  sleepPhrase: string
  lastError?: string | null
  foregroundOnly: boolean
}): string | undefined {
  switch (phase) {
    case "sleeping":
      return formatHandsFreeSleepingSubtitle(wakePhrase)
    case "waking":
      return HANDS_FREE_COMPOSER_PRESENTATION.subtitles.waking
    case "listening":
      return formatHandsFreeListeningSubtitle(sleepPhrase)
    case "processing":
      return HANDS_FREE_COMPOSER_PRESENTATION.subtitles.processing
    case "speaking":
      return HANDS_FREE_COMPOSER_PRESENTATION.subtitles.speaking
    case "paused":
      return HANDS_FREE_COMPOSER_PRESENTATION.subtitles.paused
    case "error":
      return lastError || HANDS_FREE_COMPOSER_PRESENTATION.subtitles.errorFallback
    default:
      return foregroundOnly
        ? HANDS_FREE_COMPOSER_PRESENTATION.subtitles.foregroundOnly
        : undefined
  }
}

export function getHandsFreeComposerPlaceholder({
  handsFree,
  phase,
  wakePhrase,
  listening,
  fallback,
}: {
  handsFree: boolean
  phase: HandsFreePhase
  wakePhrase: string
  listening: boolean
  fallback: string
}): string {
  if (handsFree) {
    return phase === "paused"
      ? HANDS_FREE_COMPOSER_PRESENTATION.placeholders.paused
      : formatHandsFreeActivePlaceholder(wakePhrase)
  }

  return listening
    ? HANDS_FREE_COMPOSER_PRESENTATION.placeholders.listening
    : fallback
}

export function resolveHandsFreeUtterance({
  state,
  transcript,
  wakePhrase,
  sleepPhrase,
  now,
}: ResolveHandsFreeUtteranceArgs): {
  nextState: HandsFreeControllerState
  action: HandsFreeUtteranceAction
  matchedWake: boolean
  matchedSleep: boolean
} {
  const normalizedTranscript = normalizeVoicePhrase(transcript)
  if (!normalizedTranscript) {
    return { nextState: state, action: { type: "none" }, matchedWake: false, matchedSleep: false }
  }

  if (state.pauseReason === "user" || state.phase === "paused" || state.phase === "error") {
    return {
      nextState: { ...state, lastTranscript: normalizedTranscript },
      action: { type: "none" },
      matchedWake: false,
      matchedSleep: false,
    }
  }

  if (state.phase === "sleeping") {
    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase)
    if (!wakeMatch.matched) {
      return {
        nextState: { ...state, lastTranscript: normalizedTranscript },
        action: { type: "none" },
        matchedWake: false,
        matchedSleep: false,
      }
    }

    if (wakeMatch.remainder) {
      return {
        nextState: {
          ...state,
          phase: "processing",
          resumePhase: "listening",
          awakeSince: state.awakeSince ?? now,
          lastTranscript: wakeMatch.remainder,
          lastError: null,
          recognizerErrorCount: 0,
        },
        action: { type: "send", text: wakeMatch.remainder },
        matchedWake: true,
        matchedSleep: false,
      }
    }

    return {
      nextState: {
        ...state,
        phase: "waking",
        awakeSince: state.awakeSince ?? now,
        lastTranscript: wakeMatch.normalizedTranscript,
        lastError: null,
        recognizerErrorCount: 0,
      },
      action: { type: "none" },
      matchedWake: true,
      matchedSleep: false,
    }
  }

  if (state.phase === "waking" || state.phase === "listening") {
    const sleepMatch = matchSleepPhrase(normalizedTranscript, sleepPhrase)
    if (sleepMatch.matched) {
      return {
        nextState: {
          ...transitionHandsFreeToSleeping(state),
          lastTranscript: sleepMatch.normalizedTranscript,
        },
        action: { type: "none" },
        matchedWake: false,
        matchedSleep: true,
      }
    }

    return {
      nextState: {
        ...state,
        phase: "processing",
        resumePhase: "listening",
        awakeSince: state.awakeSince ?? now,
        lastTranscript: normalizedTranscript,
        lastError: null,
        recognizerErrorCount: 0,
      },
      action: { type: "send", text: normalizedTranscript },
      matchedWake: false,
      matchedSleep: false,
    }
  }

  if (state.phase === "processing" || state.phase === "speaking") {
    const sleepMatch = matchSleepPhrase(normalizedTranscript, sleepPhrase)
    if (sleepMatch.matched) {
      return {
        nextState: {
          ...transitionHandsFreeToSleeping(state),
          lastTranscript: sleepMatch.normalizedTranscript,
        },
        action: { type: "none" },
        matchedWake: false,
        matchedSleep: true,
      }
    }

    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase)
    if (wakeMatch.matched) {
      if (wakeMatch.remainder) {
        return {
          nextState: {
            ...state,
            lastTranscript: wakeMatch.remainder,
          },
          action: { type: "send", text: wakeMatch.remainder },
          matchedWake: true,
          matchedSleep: false,
        }
      }

      return {
        nextState: {
          ...state,
          lastTranscript: wakeMatch.normalizedTranscript,
        },
        action: { type: "none" },
        matchedWake: true,
        matchedSleep: false,
      }
    }

    return {
      nextState: {
        ...state,
        lastTranscript: normalizedTranscript,
      },
      action: { type: "send", text: normalizedTranscript },
      matchedWake: false,
      matchedSleep: false,
    }
  }

  return {
    nextState: { ...state, lastTranscript: normalizedTranscript },
    action: { type: "none" },
    matchedWake: false,
    matchedSleep: false,
  }
}
