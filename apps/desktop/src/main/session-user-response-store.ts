/**
 * Session User Response Store
 *
 * Stores the user-facing response for each agent session.
 * This is set by the respond_to_user tool and retrieved at session completion
 * to deliver to the user via TTS (voice), messaging (mobile/WhatsApp), etc.
 *
 * Also tracks a history of all respond_to_user calls for a session so the UI
 * can show past responses in a collapsed list with TTS playback.
 */
const sessionUserResponse = new Map<string, string>()
const sessionUserResponseHistory = new Map<string, string[]>()

export function setSessionUserResponse(sessionId: string, text: string): void {
  // Append to history before overwriting
  const history = sessionUserResponseHistory.get(sessionId) || []
  const currentResponse = sessionUserResponse.get(sessionId)
  if (currentResponse && currentResponse !== text) {
    history.push(currentResponse)
    sessionUserResponseHistory.set(sessionId, history)
  }
  sessionUserResponse.set(sessionId, text)
}

export function getSessionUserResponse(sessionId: string): string | undefined {
  return sessionUserResponse.get(sessionId)
}

/**
 * Get the history of past respond_to_user calls (excluding the current/latest one).
 */
export function getSessionUserResponseHistory(sessionId: string): string[] {
  return sessionUserResponseHistory.get(sessionId) || []
}

export function clearSessionUserResponse(sessionId: string): void {
  sessionUserResponse.delete(sessionId)
  sessionUserResponseHistory.delete(sessionId)
}

