import { describe, expect, it } from "vitest"

import { DesktopTTSPlaybackCoordinator } from "./tts-playback-coordinator"

describe("DesktopTTSPlaybackCoordinator", () => {
  it("claims response-event and content fallback keys as one auto-play unit", () => {
    const coordinator = new DesktopTTSPlaybackCoordinator()
    const keys = ["session-1:final:event:event-1", "session-1:final:content:hello"]

    expect(coordinator.claimAutoPlayKeys(keys, { sessionId: "session-1" })).toBe(true)
    expect(coordinator.claimAutoPlayKeys([keys[0]], { sessionId: "session-1" })).toBe(false)
    expect(coordinator.claimAutoPlayKeys([keys[1]], { sessionId: "session-1" })).toBe(false)
  })

  it("releases failed generation claims so auto-play can retry", () => {
    const coordinator = new DesktopTTSPlaybackCoordinator()
    const keys = ["session-1:final:event:event-1"]

    expect(coordinator.claimAutoPlayKeys(keys, { sessionId: "session-1" })).toBe(true)
    coordinator.releaseAutoPlayKeys(keys)

    expect(coordinator.claimAutoPlayKeys(keys, { sessionId: "session-1" })).toBe(true)
  })

  it("clears all keys scoped to a reused session", () => {
    const coordinator = new DesktopTTSPlaybackCoordinator()

    coordinator.claimAutoPlayKeys(["session-1:final:content:old"], { sessionId: "session-1" })
    coordinator.claimAutoPlayKeys(["session-2:final:content:keep"], { sessionId: "session-2" })
    coordinator.clearSessionKeys("session-1")

    expect(coordinator.claimAutoPlayKeys(["session-1:final:content:old"], { sessionId: "session-1" })).toBe(true)
    expect(coordinator.claimAutoPlayKeys(["session-2:final:content:keep"], { sessionId: "session-2" })).toBe(false)
  })

  it("accepts forced auto-play claims but still dedupes duplicate keys", () => {
    const coordinator = new DesktopTTSPlaybackCoordinator()
    const keys = ["session-forced:final:content:result"]

    expect(coordinator.claimAutoPlayKeys(keys, { sessionId: "session-forced", forced: true })).toBe(true)
    expect(coordinator.claimAutoPlayKeys(keys, { sessionId: "session-forced", forced: true })).toBe(false)
  })

  it("does not block manual replay because manual playback bypasses auto-play claims", () => {
    const coordinator = new DesktopTTSPlaybackCoordinator()
    const keys = ["session-1:final:content:already-spoken"]

    expect(coordinator.claimAutoPlayKeys(keys, { sessionId: "session-1" })).toBe(true)

    coordinator.setState({ playbackId: "manual-replay", status: "loading" })

    expect(coordinator.getState().playbackId).toBe("manual-replay")
    expect(coordinator.getState().status).toBe("loading")
  })
})