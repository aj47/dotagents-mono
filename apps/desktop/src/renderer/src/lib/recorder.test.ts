import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class MockMediaRecorder {
  mimeType = "audio/webm"
  onstart: (() => void) | null = null
  onstop: (() => void) | null = null
  ondataavailable: ((event: { data: Blob; size?: number }) => void) | null = null

  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}

  start = vi.fn()
  stop = vi.fn()
}

class MockAnalyserNode {
  minDecibels = 0
  fftSize = 2048
  frequencyBinCount = 1024
  getByteTimeDomainData(_array: Uint8Array) {}
  getByteFrequencyData(_array: Uint8Array) {}
}

class MockMediaStreamSource {
  connect = vi.fn()
  disconnect = vi.fn()
}

const audioContextInstances: MockAudioContext[] = []
class MockAudioContext {
  createMediaStreamSource = vi.fn(() => new MockMediaStreamSource())
  createAnalyser = vi.fn(() => new MockAnalyserNode())
  close = vi.fn()
  constructor() {
    audioContextInstances.push(this)
  }
}

describe("Recorder audio input fallback", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaRecorder", MockMediaRecorder as any)
    vi.stubGlobal("AudioContext", MockAudioContext as any)
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1) as any)
    vi.stubGlobal("cancelAnimationFrame", vi.fn() as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("retries with the system default microphone when the saved device id is invalid", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce({ name: "OverconstrainedError" })
      .mockResolvedValueOnce(stream)

    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    })

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { Recorder } = await import("./recorder")
    const recorder = new Recorder()

    await recorder.startRecording("missing-mic")

    expect(getUserMedia).toHaveBeenNthCalledWith(1, {
      audio: { deviceId: { exact: "missing-mic" } },
      video: false,
    })
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      audio: true,
      video: false,
    })
    expect(recorder.stream).toBe(stream)
    expect(warnSpy).toHaveBeenCalled()
  })

  it("does not swallow non-device errors", async () => {
    const getUserMedia = vi.fn().mockRejectedValueOnce({ name: "NotAllowedError" })

    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    })

    const { Recorder } = await import("./recorder")
    const recorder = new Recorder()

    await expect(recorder.startRecording("missing-mic")).rejects.toEqual({ name: "NotAllowedError" })
    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })
})

describe("Recorder visualizer startup latency", () => {
  beforeEach(() => {
    audioContextInstances.length = 0
    vi.stubGlobal("MediaRecorder", MockMediaRecorder as any)
    vi.stubGlobal("AudioContext", MockAudioContext as any)
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1) as any)
    vi.stubGlobal("cancelAnimationFrame", vi.fn() as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("initializes the audio analyser before MediaRecorder.onstart fires", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream
    const getUserMedia = vi.fn().mockResolvedValueOnce(stream)
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } })

    const { Recorder } = await import("./recorder")
    const recorder = new Recorder()

    const visualizerEvents: number[] = []
    recorder.on("visualizer-data", (rms) => visualizerEvents.push(rms))

    await recorder.startRecording()

    // The audio context (and therefore the analyser + RAF loop emitting
    // visualizer-data) must be live as soon as startRecording resolves —
    // i.e. before MediaRecorder.onstart has a chance to fire. Previously
    // the analyser was deferred to onstart, leaving the modal visually
    // dead for the ~hundreds of ms MediaRecorder took to fire onstart.
    expect(audioContextInstances).toHaveLength(1)
    expect(audioContextInstances[0].createMediaStreamSource).toHaveBeenCalledWith(stream)
    expect(audioContextInstances[0].createAnalyser).toHaveBeenCalled()
    expect(requestAnimationFrame).toHaveBeenCalled()
    expect(recorder.mediaRecorder).not.toBeNull()
    expect((recorder.mediaRecorder as unknown as MockMediaRecorder).start).toHaveBeenCalledTimes(1)

    // onstart has not fired yet, but the analyser is already running.
    // Triggering onstart should not re-construct the analyser.
    const rafCallsBeforeOnstart = (requestAnimationFrame as unknown as ReturnType<typeof vi.fn>).mock.calls.length
    ;(recorder.mediaRecorder as unknown as MockMediaRecorder).onstart?.()
    expect(audioContextInstances).toHaveLength(1)
    const rafCallsAfterOnstart = (requestAnimationFrame as unknown as ReturnType<typeof vi.fn>).mock.calls.length
    expect(rafCallsAfterOnstart).toBe(rafCallsBeforeOnstart)
  })

  it("tears down the analyser when stopRecording is called", async () => {
    const stream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
    const getUserMedia = vi.fn().mockResolvedValueOnce(stream)
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } })

    const cancelRaf = vi.fn()
    vi.stubGlobal("cancelAnimationFrame", cancelRaf as any)

    const { Recorder } = await import("./recorder")
    const recorder = new Recorder()

    await recorder.startRecording()
    recorder.stopRecording()

    expect(cancelRaf).toHaveBeenCalled()
  })
})