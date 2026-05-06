import { describe, expect, it } from "vitest"

import {
  createInitialHandsFreeState,
  getHandsFreeResumePhase,
  getHandsFreeStatusLabel,
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
