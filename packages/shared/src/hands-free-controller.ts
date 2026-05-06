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
