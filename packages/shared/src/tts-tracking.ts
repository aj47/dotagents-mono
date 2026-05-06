export type TTSPlaybackPhase = "mid-turn" | "final"

export interface TTSTrackingState {
  playedKeys: Set<string>
  forcedAutoPlaySessionIds: Set<string>
}

export function createTTSTrackingState(): TTSTrackingState {
  return {
    playedKeys: new Set(),
    forcedAutoPlaySessionIds: new Set(),
  }
}

export function hasTTSPlayed(state: TTSTrackingState, ttsKey: string): boolean {
  return state.playedKeys.has(ttsKey)
}

export function markTTSPlayed(state: TTSTrackingState, ttsKey: string): void {
  state.playedKeys.add(ttsKey)
}

export function buildResponseEventTTSKey(
  sessionId: string | undefined,
  eventId: string,
  phase: TTSPlaybackPhase = "mid-turn",
): string | null {
  if (!sessionId) return null
  return `${sessionId}:${phase}:event:${eventId}`
}

export function buildContentTTSKey(
  sessionId: string | undefined,
  content: string,
  phase: TTSPlaybackPhase = "final",
): string | null {
  if (!sessionId) return null
  return `${sessionId}:${phase}:content:${content}`
}

export function removeTTSKey(state: TTSTrackingState, ttsKey: string): void {
  state.playedKeys.delete(ttsKey)
}

export function clearSessionTTSTracking(state: TTSTrackingState, sessionId: string): void {
  for (const key of state.playedKeys) {
    if (key.startsWith(`${sessionId}:`)) {
      state.playedKeys.delete(key)
    }
  }
}

export function markSessionForcedAutoPlay(state: TTSTrackingState, sessionId: string): void {
  state.forcedAutoPlaySessionIds.add(sessionId)
}

export function consumeSessionForcedAutoPlay(state: TTSTrackingState, sessionId: string): boolean {
  return state.forcedAutoPlaySessionIds.delete(sessionId)
}
