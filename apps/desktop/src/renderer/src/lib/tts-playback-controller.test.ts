import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const controllerSource = readFileSync(new URL("./tts-playback-controller.ts", import.meta.url), "utf8")

describe("tts playback controller", () => {
  it("owns a single main-renderer audio element and listens for central playback IPC", () => {
    expect(controllerSource).toContain("const audio = new Audio()")
    expect(controllerSource).toContain("rendererHandlers.ttsPlaybackRequest.listen(handleRequest)")
    expect(controllerSource).toContain("rendererHandlers.ttsPlaybackCommand.listen(handleCommand)")
    expect(controllerSource).toContain("tipcClient.publishTTSPlaybackState(nextState)")
  })

  it("applies output devices, cleans object URLs, and publishes audio event state", () => {
    expect(controllerSource).toContain("audio.setSinkId(audioOutputDeviceId || \"\")")
    expect(controllerSource).toContain("URL.revokeObjectURL(objectUrlRef.current)")
    expect(controllerSource).toContain('audio.addEventListener("timeupdate", onTimeUpdate)')
    expect(controllerSource).toContain('audio.addEventListener("ended", onEnded)')
  })
})