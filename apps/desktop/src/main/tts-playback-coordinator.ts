import type { DesktopTTSPlaybackState } from "../shared/types"
import { logApp } from "./debug"

type ClaimedTTSKey = {
  sessionId?: string
  forced: boolean
  claimedAt: number
}

export const createIdleTTSPlaybackState = (): DesktopTTSPlaybackState => ({
  playbackId: null,
  status: "idle",
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  updatedAt: Date.now(),
})

export class DesktopTTSPlaybackCoordinator {
  private state: DesktopTTSPlaybackState = createIdleTTSPlaybackState()
  private claimedAutoPlayKeys = new Map<string, ClaimedTTSKey>()

  claimAutoPlayKeys(
    ttsKeys: string[] | undefined,
    options: { sessionId?: string; forced?: boolean } = {},
  ): boolean {
    const uniqueKeys = this.normalizeKeys(ttsKeys)
    if (uniqueKeys.length === 0) {
      logApp("[TTSPlaybackCoordinator] claimAutoPlayKeys accepted with no keys", options)
      return true
    }

    const existingKey = uniqueKeys.find((key) => this.claimedAutoPlayKeys.has(key))
    if (existingKey) {
      logApp("[TTSPlaybackCoordinator] claimAutoPlayKeys rejected", {
        existingKey,
        keys: uniqueKeys,
        sessionId: options.sessionId,
        forced: options.forced ?? false,
        claimedKeyCount: this.claimedAutoPlayKeys.size,
      })
      return false
    }

    const claimedAt = Date.now()
    for (const key of uniqueKeys) {
      this.claimedAutoPlayKeys.set(key, {
        sessionId: options.sessionId,
        forced: options.forced ?? false,
        claimedAt,
      })
    }

    logApp("[TTSPlaybackCoordinator] claimAutoPlayKeys accepted", {
      keys: uniqueKeys,
      sessionId: options.sessionId,
      forced: options.forced ?? false,
      claimedKeyCount: this.claimedAutoPlayKeys.size,
    })

    return true
  }

  releaseAutoPlayKeys(ttsKeys: string[] | undefined): void {
    const uniqueKeys = this.normalizeKeys(ttsKeys)
    for (const key of this.normalizeKeys(ttsKeys)) {
      this.claimedAutoPlayKeys.delete(key)
    }
    logApp("[TTSPlaybackCoordinator] releaseAutoPlayKeys", {
      keys: uniqueKeys,
      claimedKeyCount: this.claimedAutoPlayKeys.size,
    })
  }

  clearSessionKeys(sessionId: string): void {
    let clearedCount = 0
    for (const [key, claim] of this.claimedAutoPlayKeys.entries()) {
      if (claim.sessionId === sessionId || key.startsWith(`${sessionId}:`)) {
        this.claimedAutoPlayKeys.delete(key)
        clearedCount += 1
      }
    }
    logApp("[TTSPlaybackCoordinator] clearSessionKeys", {
      sessionId,
      clearedCount,
      claimedKeyCount: this.claimedAutoPlayKeys.size,
    })
  }

  setState(statePatch: Partial<DesktopTTSPlaybackState>): DesktopTTSPlaybackState {
    this.state = {
      ...this.state,
      ...statePatch,
      updatedAt: statePatch.updatedAt ?? Date.now(),
    }
    logApp("[TTSPlaybackCoordinator] state updated", {
      playbackId: this.state.playbackId,
      status: this.state.status,
      sessionId: this.state.sessionId,
      source: this.state.source,
      currentTime: this.state.currentTime,
      duration: this.state.duration,
      error: this.state.error,
    })
    return this.getState()
  }

  getState(): DesktopTTSPlaybackState {
    return { ...this.state }
  }

  reset(reason?: string): DesktopTTSPlaybackState {
    this.state = {
      ...createIdleTTSPlaybackState(),
      error: reason,
    }
    logApp("[TTSPlaybackCoordinator] reset", { reason })
    return this.getState()
  }

  getClaimedKeyCount(): number {
    return this.claimedAutoPlayKeys.size
  }

  private normalizeKeys(ttsKeys: string[] | undefined): string[] {
    return Array.from(new Set((ttsKeys ?? []).filter((key) => typeof key === "string" && key.length > 0)))
  }
}

export const desktopTTSPlaybackCoordinator = new DesktopTTSPlaybackCoordinator()