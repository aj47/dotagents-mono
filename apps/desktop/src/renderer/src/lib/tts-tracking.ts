/**
 * Module-level TTS tracking to prevent double auto-play.
 * 
 * This is extracted to a separate file to avoid circular dependencies
 * between agent-progress (component) and agent-store (store).
 * 
 * The set tracks sessions that have already auto-played TTS, keyed by
 * session-scoped event IDs or fallback content keys.
 */

import {
  buildContentTTSKey,
  buildResponseEventTTSKey,
  clearSessionTTSTracking as clearSessionTTSTrackingForState,
  consumeSessionForcedAutoPlay as consumeSessionForcedAutoPlayForState,
  createTTSTrackingState,
  hasTTSPlayed as hasTTSPlayedInState,
  markSessionForcedAutoPlay as markSessionForcedAutoPlayForState,
  markTTSPlayed as markTTSPlayedInState,
  removeTTSKey as removeTTSKeyFromState,
} from "@dotagents/shared/tts-tracking"

export { buildContentTTSKey, buildResponseEventTTSKey }

const ttsTrackingState = createTTSTrackingState()

/**
 * Check if TTS has already been played for a specific session + content combination.
 */
export function hasTTSPlayed(ttsKey: string): boolean {
  return hasTTSPlayedInState(ttsTrackingState, ttsKey)
}

/**
 * Mark TTS as played for a specific session + content combination.
 */
export function markTTSPlayed(ttsKey: string): void {
  markTTSPlayedInState(ttsTrackingState, ttsKey)
}

/**
 * Remove a TTS key from tracking (e.g., on failure or unmount during generation).
 */
export function removeTTSKey(ttsKey: string): void {
  removeTTSKeyFromState(ttsTrackingState, ttsKey)
}

/**
 * Clear TTS tracking for a specific session. Call this when a session is dismissed
 * to allow TTS to play again if the session is somehow restored.
 */
export function clearSessionTTSTracking(sessionId: string): void {
  clearSessionTTSTrackingForState(ttsTrackingState, sessionId)
}

/**
 * Sessions explicitly authorized for the next auto-play even if their CompactMessage
 * mounts with an already-final assistant message (e.g. speakOnTrigger after a snoozed
 * loop completes and the panel reveals the session). The flag is consumed by the
 * first auto-play attempt for that session.
 */
export function markSessionForcedAutoPlay(sessionId: string): void {
  markSessionForcedAutoPlayForState(ttsTrackingState, sessionId)
}

export function consumeSessionForcedAutoPlay(sessionId: string): boolean {
  return consumeSessionForcedAutoPlayForState(ttsTrackingState, sessionId)
}
