import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@renderer/lib/debug", () => ({ logUI: vi.fn() }))

import { TTSManager } from "./tts-manager"

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: vi.fn(() => null) },
  })
})

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function createAudio(playPromise: Promise<void> = Promise.resolve()) {
  return {
    pause: vi.fn(),
    play: vi.fn(() => playPromise),
    currentTime: 12,
  } as unknown as HTMLAudioElement
}

describe("TTSManager", () => {
  it("stops a stale pending play request after a newer exclusive playback starts", async () => {
    const manager = new TTSManager()
    const firstPlay = deferred()
    const firstAudio = createAudio(firstPlay.promise)
    const secondAudio = createAudio()

    manager.registerAudio(firstAudio)
    manager.registerAudio(secondAudio)

    const firstRequest = manager.playExclusive(firstAudio, {
      source: "first",
      autoPlay: true,
    })
    const secondRequest = manager.playExclusive(secondAudio, {
      source: "second",
      autoPlay: true,
    })

    expect(firstAudio.pause).toHaveBeenCalledTimes(1)
    expect(firstAudio.currentTime).toBe(0)
    expect(secondAudio.play).toHaveBeenCalledTimes(1)

    firstPlay.resolve()
    await Promise.all([firstRequest, secondRequest])

    expect(firstAudio.pause).toHaveBeenCalledTimes(2)
    expect(firstAudio.currentTime).toBe(0)
  })

  it("invalidates pending playback when all TTS audio is stopped", async () => {
    const manager = new TTSManager()
    const play = deferred()
    const audio = createAudio(play.promise)

    manager.registerAudio(audio)
    const request = manager.playExclusive(audio, {
      source: "auto",
      autoPlay: true,
    })

    manager.stopAll("test-stop")
    play.resolve()
    await request

    expect(audio.pause).toHaveBeenCalledTimes(2)
    expect(audio.currentTime).toBe(0)
  })

  it("does not stop a newer request for the same audio element", async () => {
    const manager = new TTSManager()
    const firstPlay = deferred()
    const audio = createAudio(firstPlay.promise)

    manager.registerAudio(audio)
    const firstRequest = manager.playExclusive(audio, {
      source: "auto:first",
      autoPlay: true,
    })

    const secondRequest = manager.playExclusive(audio, {
      source: "auto:second",
      autoPlay: true,
    })

    firstPlay.resolve()
    await Promise.all([firstRequest, secondRequest])

    expect(audio.pause).not.toHaveBeenCalled()
  })
})