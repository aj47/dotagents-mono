import { describe, expect, it } from "vitest"

import {
  createHandsFreeComposerPermissionDeniedDebugState,
  createHandsFreeComposerRecognizerErrorDebugState,
  createHandsFreeComposerTranscriptAddedDebugState,
  createInitialHandsFreeState,
  formatHandsFreeActivePlaceholder,
  formatHandsFreeListeningSubtitle,
  formatHandsFreeRecognizerErrorDebugMessage,
  formatHandsFreeSleepingDebugMessage,
  formatHandsFreeSleepingSubtitle,
  getHandsFreeComposerCopyState,
  getHandsFreeComposerControlState,
  getHandsFreeComposerDebugMessage,
  getHandsFreeComposerPlaceholder,
  getHandsFreeComposerMobileSurfaceColors,
  getHandsFreeComposerMobileSurfaceRenderState,
  getHandsFreeComposerMobileSurfaceState,
  getHandsFreeMicButtonLabel,
  getHandsFreePauseResumeLabel,
  getHandsFreeStatusSubtitle,
  getHandsFreeStatusChipMobileColors,
  getHandsFreeResumePhase,
  getHandsFreeStatusLabel,
  HANDS_FREE_COMPOSER_PRESENTATION,
  resolveHandsFreeUtterance,
  transitionHandsFreeToSleeping,
} from "./hands-free-controller"

describe("hands-free controller", () => {
  it("creates the initial sleeping state", () => {
    expect(createInitialHandsFreeState()).toEqual({
      phase: "sleeping",
      resumePhase: null,
      pauseReason: null,
      awakeSince: null,
      lastError: null,
      lastTranscript: "",
      recognizerErrorCount: 0,
    })
  })

  it("maps phases to status labels", () => {
    expect(getHandsFreeStatusLabel("sleeping")).toBe("Sleeping")
    expect(getHandsFreeStatusLabel("waking")).toBe("Wake phrase heard")
    expect(getHandsFreeStatusLabel("listening")).toBe("Listening")
    expect(getHandsFreeStatusLabel("processing")).toBe("Thinking")
    expect(getHandsFreeStatusLabel("speaking")).toBe("Speaking")
    expect(getHandsFreeStatusLabel("paused")).toBe("Paused")
    expect(getHandsFreeStatusLabel("error")).toBe("Voice error")
  })

  it("centralizes hands-free composer labels and phase copy", () => {
    expect(HANDS_FREE_COMPOSER_PRESENTATION.controls.wakeLabel).toBe("Wake")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.controls.holdLabel).toBe("Hold")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.debug.awake).toBe("Handsfree awake. Listening for your request.")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.debug.transcriptAdded).toBe("Voice transcript added to the composer.")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.debug.permissionDenied).toBe("Speech recognition permission denied.")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.debug.voiceDebugTitle).toBe("Voice debug")
    expect(getHandsFreeComposerCopyState()).toBe(HANDS_FREE_COMPOSER_PRESENTATION)
    expect(getHandsFreeComposerDebugMessage("awake")).toBe(HANDS_FREE_COMPOSER_PRESENTATION.debug.awake)
    expect(createHandsFreeComposerTranscriptAddedDebugState()).toEqual({
      debugInfo: HANDS_FREE_COMPOSER_PRESENTATION.debug.transcriptAdded,
    })
    expect(createHandsFreeComposerPermissionDeniedDebugState()).toEqual({
      debugInfo: HANDS_FREE_COMPOSER_PRESENTATION.debug.permissionDenied,
    })
    expect(createHandsFreeComposerRecognizerErrorDebugState("Mic unavailable")).toEqual({
      debugInfo: "Voice error: Mic unavailable",
    })
    expect(getHandsFreeComposerMobileSurfaceState()).toBe(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlsRow.flexDirection).toBe("row")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlsRow.alignItems).toBe("center")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.flex).toBe(1)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.minHeight).toBe(36)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.backgroundColorToken).toBe("background")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.borderColorToken).toBe("border")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.pressedOpacity).toBe(0.7)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.alignItems).toBe("center")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.justifyContent).toBe("center")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButtonText.colorToken).toBe("foreground")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButtonText.fontWeight).toBe("600")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugPanel.backgroundColorToken).toBe("muted")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugPanel.borderLeftWidth).toBe(4)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugPanel.borderLeftColorToken).toBe("primary")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.debugText.colorToken).toBe("mutedForeground")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.borderRadius).toBe("full")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.label.fontSize).toBe(12)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.label.fontWeight).toBe("700")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.alignSelf).toBe("flex-start")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.subtitle.opacity).toBe(0.92)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.subtitle.numberOfLines).toBe(2)
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.phaseColors.listening.backgroundColorToken).toBe("primary")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.phaseColors.processing.backgroundColor).toBe("#f59e0b")
    expect(HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.statusChip.phaseColors.speaking.backgroundColor).toBe("#8b5cf6")
    expect(getHandsFreeComposerMobileSurfaceColors({
      background: "#ffffff",
      border: "#d4d4d4",
      foreground: "#171717",
      muted: "#e5e5e5",
      mutedForeground: "#737373",
      primary: "#2563eb",
    })).toEqual({
      controlButton: {
        borderColor: "#d4d4d4",
        backgroundColor: "#ffffff",
      },
      controlButtonText: {
        color: "#171717",
      },
      debugPanel: {
        backgroundColor: "#e5e5e5",
        borderLeftColor: "#2563eb",
      },
      debugText: {
        color: "#737373",
      },
    })
    expect(getHandsFreeComposerMobileSurfaceRenderState({
      colors: {
        background: "#ffffff",
        border: "#d4d4d4",
        foreground: "#171717",
        muted: "#e5e5e5",
        mutedForeground: "#737373",
        primary: "#2563eb",
      },
    })).toEqual({
      surface: getHandsFreeComposerMobileSurfaceState(),
      colors: getHandsFreeComposerMobileSurfaceColors({
        background: "#ffffff",
        border: "#d4d4d4",
        foreground: "#171717",
        muted: "#e5e5e5",
        mutedForeground: "#737373",
        primary: "#2563eb",
      }),
    })
    expect(formatHandsFreeSleepingDebugMessage("hey dot agents")).toBe(
      "Handsfree sleeping. Say “hey dot agents” or tap Wake to begin.",
    )
    expect(formatHandsFreeRecognizerErrorDebugMessage("Mic unavailable")).toBe("Voice error: Mic unavailable")
    expect(formatHandsFreeSleepingSubtitle("hey dot agents")).toBe(
      "Say “hey dot agents” or tap Wake to wake the assistant.",
    )
    expect(formatHandsFreeListeningSubtitle("go to sleep")).toBe("Say “go to sleep” to return to sleep.")
    expect(formatHandsFreeActivePlaceholder("hey dot agents")).toBe("Say “hey dot agents” or type a message")
    expect(getHandsFreePauseResumeLabel("paused")).toBe("Resume")
    expect(getHandsFreePauseResumeLabel("listening")).toBe("Pause")
    expect(getHandsFreeComposerControlState("sleeping")).toEqual({
      primary: {
        action: "wake",
        label: "Wake",
        accessibilityRole: "button",
        accessibilityLabel: "Wake handsfree button",
      },
      secondary: {
        action: "pause",
        label: "Pause",
        accessibilityRole: "button",
        accessibilityLabel: "Pause handsfree button",
      },
    })
    expect(getHandsFreeComposerControlState("paused")).toEqual({
      primary: {
        action: "sleep",
        label: "Sleep",
        accessibilityRole: "button",
        accessibilityLabel: "Sleep handsfree button",
      },
      secondary: {
        action: "resume",
        label: "Resume",
        accessibilityRole: "button",
        accessibilityLabel: "Resume handsfree button",
      },
    })
    expect(getHandsFreeComposerControlState("listening")).toEqual({
      primary: {
        action: "sleep",
        label: "Sleep",
        accessibilityRole: "button",
        accessibilityLabel: "Sleep handsfree button",
      },
      secondary: {
        action: "pause",
        label: "Pause",
        accessibilityRole: "button",
        accessibilityLabel: "Pause handsfree button",
      },
    })
    expect(getHandsFreeMicButtonLabel({ handsFree: true, phase: "sleeping", listening: false })).toBe("Wake")
    expect(getHandsFreeMicButtonLabel({ handsFree: true, phase: "paused", listening: false })).toBe("Resume")
    expect(getHandsFreeMicButtonLabel({ handsFree: false, phase: "sleeping", listening: true })).toBe("...")
    expect(getHandsFreeMicButtonLabel({ handsFree: false, phase: "sleeping", listening: false })).toBe("Hold")
  })

  it("resolves hands-free status chip phase colors from shared tokens", () => {
    const colors = {
      secondary: "#f5f5f5",
      border: "#e5e5e5",
      foreground: "#111111",
      primary: "#171717",
      primaryForeground: "#fafafa",
      muted: "#eeeeee",
      destructive: "#ef4444",
    }

    expect(getHandsFreeStatusChipMobileColors("sleeping", colors)).toEqual({
      backgroundColor: "#f5f5f5",
      borderColor: "#e5e5e5",
      textColor: "#111111",
    })
    expect(getHandsFreeStatusChipMobileColors("listening", colors)).toEqual({
      backgroundColor: "#171717",
      borderColor: "#171717",
      textColor: "#fafafa",
    })
    expect(getHandsFreeStatusChipMobileColors("processing", colors)).toEqual({
      backgroundColor: "#f59e0b",
      borderColor: "#f59e0b",
      textColor: "#111827",
    })
    expect(getHandsFreeStatusChipMobileColors("speaking", colors)).toEqual({
      backgroundColor: "#8b5cf6",
      borderColor: "#8b5cf6",
      textColor: "#ffffff",
    })
    expect(getHandsFreeStatusChipMobileColors("error", colors)).toEqual({
      backgroundColor: "#ef4444",
      borderColor: "#ef4444",
      textColor: "#fafafa",
    })
  })

  it("formats hands-free subtitles and placeholders from phase state", () => {
    expect(getHandsFreeStatusSubtitle({
      phase: "sleeping",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      foregroundOnly: true,
    })).toBe("Say “hey dot agents” or tap Wake to wake the assistant.")
    expect(getHandsFreeStatusSubtitle({
      phase: "listening",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      foregroundOnly: true,
    })).toBe("Say “go to sleep” to return to sleep.")
    expect(getHandsFreeStatusSubtitle({
      phase: "error",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      lastError: "Mic unavailable",
      foregroundOnly: true,
    })).toBe("Mic unavailable")
    expect(getHandsFreeStatusSubtitle({
      phase: "error",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      foregroundOnly: true,
    })).toBe("Voice recognition is recovering.")
    expect(getHandsFreeComposerPlaceholder({
      handsFree: true,
      phase: "paused",
      wakePhrase: "hey dot agents",
      listening: false,
      fallback: "Continue conversation...",
    })).toBe("Handsfree paused — tap mic to resume or type a message")
    expect(getHandsFreeComposerPlaceholder({
      handsFree: false,
      phase: "sleeping",
      wakePhrase: "hey dot agents",
      listening: true,
      fallback: "Continue conversation...",
    })).toBe("Listening…")
  })

  it("resolves resumable phases from active states", () => {
    expect(getHandsFreeResumePhase("processing", null)).toBe("processing")
    expect(getHandsFreeResumePhase("speaking", "processing")).toBe("listening")
    expect(getHandsFreeResumePhase("sleeping", null)).toBe("sleeping")
  })

  it("transitions back to sleeping while preserving recent transcript metadata", () => {
    expect(transitionHandsFreeToSleeping({
      ...createInitialHandsFreeState(),
      phase: "listening",
      resumePhase: "listening",
      pauseReason: "background",
      awakeSince: 100,
      lastError: "previous",
      lastTranscript: "hello",
    })).toEqual({
      ...createInitialHandsFreeState(),
      lastTranscript: "hello",
    })
  })

  it("keeps sleeping when no wake phrase is present", () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: "tell me a joke",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 100,
    })

    expect(result.action).toEqual({ type: "none" })
    expect(result.nextState.phase).toBe("sleeping")
    expect(result.nextState.lastTranscript).toBe("tell me a joke")
  })

  it("wakes without sending when only the wake phrase is heard", () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: "hey dot agents",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 100,
    })

    expect(result.action).toEqual({ type: "none" })
    expect(result.nextState.phase).toBe("waking")
    expect(result.matchedWake).toBe(true)
  })

  it("sends the remainder when wake phrase and request are combined", () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: "hey dot agents what is the weather",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 100,
    })

    expect(result.action).toEqual({ type: "send", text: "what is the weather" })
    expect(result.nextState.phase).toBe("processing")
    expect(result.nextState.resumePhase).toBe("listening")
  })

  it("returns to sleep when the sleep phrase is spoken while awake", () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: "listening", awakeSince: 100 },
      transcript: "go to sleep",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 200,
    })

    expect(result.action).toEqual({ type: "none" })
    expect(result.nextState.phase).toBe("sleeping")
    expect(result.matchedSleep).toBe(true)
  })

  it("sends normal and overlapping utterances while awake or processing", () => {
    const listeningResult = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: "listening", awakeSince: 100 },
      transcript: "summarize my unread email",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 200,
    })
    expect(listeningResult.action).toEqual({ type: "send", text: "summarize my unread email" })
    expect(listeningResult.nextState.phase).toBe("processing")

    const processingResult = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: "processing", awakeSince: 100, resumePhase: "listening" },
      transcript: "also draft a summary email",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 250,
    })
    expect(processingResult.action).toEqual({ type: "send", text: "also draft a summary email" })
    expect(processingResult.nextState.phase).toBe("processing")
  })

  it("does not send a bare wake phrase while already processing", () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: "processing", awakeSince: 100, resumePhase: "listening" },
      transcript: "hey dot agents",
      wakePhrase: "hey dot agents",
      sleepPhrase: "go to sleep",
      now: 270,
    })

    expect(result.action).toEqual({ type: "none" })
    expect(result.nextState.phase).toBe("processing")
    expect(result.matchedWake).toBe(true)
  })
})
