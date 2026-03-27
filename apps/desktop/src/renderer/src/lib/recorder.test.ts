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

describe("Recorder audio input fallback", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaRecorder", MockMediaRecorder as any)
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