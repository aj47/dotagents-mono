/**
 * Module-level TTS tracking to prevent double auto-play.
 * 
 * This is extracted to a separate file to avoid circular dependencies
 * between agent-progress (component) and agent-store (store).
 * 
 * The set tracks sessions that have already auto-played TTS, keyed by
 * session-scoped event IDs or fallback content keys.
 */

const sessionsWithTTSPlayed = new Set<string>()

/**
 * Check if TTS has already been played for a specific session + content combination.
 */
export function hasTTSPlayed(ttsKey: string): boolean {
  return sessionsWithTTSPlayed.has(ttsKey)
}

/**
 * Mark TTS as played for a specific session + content combination.
 */
export function markTTSPlayed(ttsKey: string): void {
  sessionsWithTTSPlayed.add(ttsKey)
}

export function buildResponseEventTTSKey(sessionId: string | undefined, eventId: string, phase: "mid-turn" | "final" = "mid-turn"): string | null {
  if (!sessionId) return null
  return `${sessionId}:${phase}:event:${eventId}`
}

export function buildContentTTSKey(sessionId: string | undefined, content: string, phase: "mid-turn" | "final" = "final"): string | null {
  if (!sessionId) return null
  return `${sessionId}:${phase}:content:${content}`
}

/**
 * Remove a TTS key from tracking (e.g., on failure or unmount during generation).
 */
export function removeTTSKey(ttsKey: string): void {
  sessionsWithTTSPlayed.delete(ttsKey)
}

/**
 * Clear TTS tracking for a specific session. Call this when a session is dismissed
 * to allow TTS to play again if the session is somehow restored.
 */
export function clearSessionTTSTracking(sessionId: string): void {
  // Remove all entries that start with this sessionId
  for (const key of sessionsWithTTSPlayed) {
    if (key.startsWith(`${sessionId}:`)) {
      sessionsWithTTSPlayed.delete(key)
    }
  }
}

/**
 * Sessions explicitly authorized for the next auto-play even if their CompactMessage
 * mounts with an already-final assistant message (e.g. speakOnTrigger after a snoozed
 * loop completes and the panel reveals the session). The flag is consumed by the
 * first auto-play attempt for that session.
 */
const sessionsWithForcedAutoPlay = new Set<string>()

export function markSessionForcedAutoPlay(sessionId: string): void {
  sessionsWithForcedAutoPlay.add(sessionId)
}

export function consumeSessionForcedAutoPlay(sessionId: string): boolean {
  return sessionsWithForcedAutoPlay.delete(sessionId)
}

