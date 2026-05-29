import { describe, expect, it } from "vitest"
import type { DesktopTTSPlaybackState } from "@shared/types"
import {
  HANDS_FREE_TAIL_MS,
  evaluateHandsFreeSubmit,
  isLikelyFeedbackPairing,
  isTTSAudible,
} from "./hands-free-coordinator"

const buildState = (overrides: Partial<DesktopTTSPlaybackState> = {}): DesktopTTSPlaybackState => ({
  playbackId: "pb-1",
  status: "idle",
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  updatedAt: 0,
  ...overrides,
})

describe("isTTSAudible", () => {
  it("treats playing/loading states as audible", () => {
    expect(isTTSAudible(buildState({ status: "playing" }))).toBe(true)
    expect(isTTSAudible(buildState({ status: "loading" }))).toBe(true)
  })

  it("ignores muted or zero-volume playback", () => {
    expect(isTTSAudible(buildState({ status: "playing", muted: true }))).toBe(false)
    expect(isTTSAudible(buildState({ status: "playing", volume: 0 }))).toBe(false)
  })

  it("treats idle/paused/ended/error states as silent", () => {
    expect(isTTSAudible(buildState({ status: "idle" }))).toBe(false)
    expect(isTTSAudible(buildState({ status: "paused" }))).toBe(false)
    expect(isTTSAudible(buildState({ status: "ended" }))).toBe(false)
    expect(isTTSAudible(buildState({ status: "error" }))).toBe(false)
  })

  it("returns false when there is no playback state", () => {
    expect(isTTSAudible(null)).toBe(false)
    expect(isTTSAudible(undefined)).toBe(false)
  })
})

describe("evaluateHandsFreeSubmit", () => {
  it("submits when no TTS overlap and no tail window", () => {
    const result = evaluateHandsFreeSubmit({
      ttsState: buildState({ status: "idle" }),
      recordingStartedAt: 1000,
      recordingEndedAt: 2000,
      ttsLastAudibleEndedAt: null,
      now: 5000,
    })
    expect(result.shouldSubmit).toBe(true)
  })

  it("blocks when TTS is currently audible", () => {
    const result = evaluateHandsFreeSubmit({
      ttsState: buildState({ status: "playing" }),
      recordingStartedAt: 1000,
      recordingEndedAt: 2000,
      ttsLastAudibleEndedAt: null,
      now: 2000,
    })
    expect(result.shouldSubmit).toBe(false)
    expect(result.reason).toBe("tts-active")
  })

  it("blocks when TTS ended during the recording window", () => {
    const result = evaluateHandsFreeSubmit({
      ttsState: buildState({ status: "ended" }),
      recordingStartedAt: 1000,
      recordingEndedAt: 3000,
      ttsLastAudibleEndedAt: 1500,
      now: 3000,
    })
    expect(result.shouldSubmit).toBe(false)
    expect(result.reason).toBe("recording-overlapped-tts")
  })

  it("blocks when the recording ends within the tail window after TTS", () => {
    const ttsEnd = 2500
    const result = evaluateHandsFreeSubmit({
      ttsState: buildState({ status: "ended" }),
      recordingStartedAt: 3000,
      recordingEndedAt: 3200,
      ttsLastAudibleEndedAt: ttsEnd,
      tailMs: HANDS_FREE_TAIL_MS,
      now: ttsEnd + 200,
    })
    expect(result.shouldSubmit).toBe(false)
    expect(result.reason).toBe("within-tts-tail")
  })

  it("allows submission past the tail window", () => {
    const ttsEnd = 1000
    const result = evaluateHandsFreeSubmit({
      ttsState: buildState({ status: "ended" }),
      recordingStartedAt: 2000,
      recordingEndedAt: 2500,
      ttsLastAudibleEndedAt: ttsEnd,
      tailMs: 500,
      now: 3000,
    })
    expect(result.shouldSubmit).toBe(true)
  })
})

describe("isLikelyFeedbackPairing", () => {
  it("flags the default-default pairing", () => {
    expect(isLikelyFeedbackPairing({})).toBe(true)
  })

  it("flags built-in laptop pairings via shared brand tokens", () => {
    expect(
      isLikelyFeedbackPairing({
        inputDeviceId: "abc",
        outputDeviceId: "xyz",
        inputLabel: "MacBook Pro Microphone",
        outputLabel: "MacBook Pro Speakers",
      }),
    ).toBe(true)
  })

  it("does not flag a headset paired with system speakers", () => {
    expect(
      isLikelyFeedbackPairing({
        inputDeviceId: "headset",
        outputDeviceId: "speakers",
        inputLabel: "Jabra Evolve 20 Microphone",
        outputLabel: "MacBook Pro Speakers",
      }),
    ).toBe(false)
  })

  it("does not flag default mic with explicit external output", () => {
    expect(
      isLikelyFeedbackPairing({
        outputDeviceId: "external",
        outputLabel: "External USB DAC",
      }),
    ).toBe(false)
  })
})
