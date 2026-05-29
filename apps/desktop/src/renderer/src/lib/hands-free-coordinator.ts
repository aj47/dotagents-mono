import type { DesktopTTSPlaybackState } from "@shared/types"
import type { RecorderAudioConstraints } from "@renderer/lib/recorder"

// Tail window after TTS playback ends during which captured audio is still
// considered likely to contain echo of the assistant's own response. Speaker
// rooms and BT headsets vary, so we keep this conservative.
export const HANDS_FREE_TAIL_MS = 750

// Constraints we apply to getUserMedia when hands-free speaker mode is on.
// Browsers route these through the WebRTC audio processing module, which is
// enough to cover headset/laptop-speaker pairings without a custom DSP.
export const HANDS_FREE_AUDIO_CONSTRAINTS: Required<RecorderAudioConstraints> = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

// TTS statuses that mean the assistant is (or just was) emitting audio
// through the speakers and we should not treat captured mic input as a
// fresh user turn.
const ACTIVE_TTS_STATUSES = new Set<DesktopTTSPlaybackState["status"]>([
  "loading",
  "playing",
])

export const isTTSAudible = (state: DesktopTTSPlaybackState | null | undefined): boolean => {
  if (!state) return false
  if (state.muted) return false
  if (state.volume !== undefined && state.volume <= 0) return false
  return ACTIVE_TTS_STATUSES.has(state.status)
}

export interface HandsFreeSubmitEvaluation {
  shouldSubmit: boolean
  reason?:
    | "tts-active"
    | "recording-overlapped-tts"
    | "within-tts-tail"
}

export interface EvaluateHandsFreeSubmitArgs {
  ttsState: DesktopTTSPlaybackState | null | undefined
  recordingStartedAt: number
  recordingEndedAt: number
  // Optional: when the active playback last transitioned from "playing"/"loading"
  // to a non-audible status. Treated as "TTS ended at this timestamp" so we can
  // suppress a short tail window after playback finishes.
  ttsLastAudibleEndedAt?: number | null
  // The window after TTS ends during which captured audio is still likely echo.
  tailMs?: number
  now?: number
}

// Decide whether a finalized hands-free recording should be submitted as a
// new user turn. We block when TTS is currently audible, when TTS was audible
// at any point during the recording window, or when the recording ended within
// the configured tail window after playback stopped. These rules together stop
// the assistant's own speaker output from becoming the next user message
// without needing a separate audio-fingerprint pass.
export const evaluateHandsFreeSubmit = ({
  ttsState,
  recordingStartedAt,
  recordingEndedAt,
  ttsLastAudibleEndedAt,
  tailMs = HANDS_FREE_TAIL_MS,
  now = Date.now(),
}: EvaluateHandsFreeSubmitArgs): HandsFreeSubmitEvaluation => {
  if (isTTSAudible(ttsState)) {
    return { shouldSubmit: false, reason: "tts-active" }
  }

  if (
    ttsLastAudibleEndedAt &&
    ttsLastAudibleEndedAt >= recordingStartedAt &&
    ttsLastAudibleEndedAt <= recordingEndedAt
  ) {
    return { shouldSubmit: false, reason: "recording-overlapped-tts" }
  }

  if (ttsLastAudibleEndedAt && now - ttsLastAudibleEndedAt < tailMs) {
    return { shouldSubmit: false, reason: "within-tts-tail" }
  }

  return { shouldSubmit: true }
}

export interface SameDeviceFeedbackInput {
  inputLabel?: string | null
  outputLabel?: string | null
  inputDeviceId?: string
  outputDeviceId?: string
}

// Heuristic that flags device pairings likely to feed the assistant's own
// audio back into the microphone. We trigger when both sides resolve to the
// system default (or no explicit selection) or when their labels share a
// distinctive substring (e.g. "MacBook Pro Speakers" / "MacBook Pro
// Microphone"). Headset and external-mic pairings do not match.
export const isLikelyFeedbackPairing = ({
  inputLabel,
  outputLabel,
  inputDeviceId,
  outputDeviceId,
}: SameDeviceFeedbackInput): boolean => {
  const inputDefault = !inputDeviceId || inputDeviceId === "default"
  const outputDefault = !outputDeviceId || outputDeviceId === "default"
  if (inputDefault && outputDefault) return true

  if (!inputLabel || !outputLabel) return false

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\b(microphone|mic|input|speakers?|output|built[- ]?in|internal)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()

  const normalizedInput = normalize(inputLabel)
  const normalizedOutput = normalize(outputLabel)
  if (!normalizedInput || !normalizedOutput) return false

  if (normalizedInput === normalizedOutput) return true

  // Share a meaningful token (e.g. brand/model word) — heuristic only.
  const inputTokens = new Set(normalizedInput.split(/\s+/).filter((token) => token.length >= 4))
  const outputTokens = normalizedOutput.split(/\s+/).filter((token) => token.length >= 4)
  return outputTokens.some((token) => inputTokens.has(token))
}
