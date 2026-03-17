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

