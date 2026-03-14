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
import { logApp } from './debug'

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

  logApp("[session-user-response-store] set", {
    sessionId,
    replacedExisting: !!currentResponse,
    responseLength: text.length,
    historyLength: history.length,
  })
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
  const hadResponse = sessionUserResponse.has(sessionId)
  const historyLength = sessionUserResponseHistory.get(sessionId)?.length || 0
  sessionUserResponse.delete(sessionId)
  sessionUserResponseHistory.delete(sessionId)

  logApp("[session-user-response-store] clear", {
    sessionId,
    hadResponse,
    historyLength,
  })
}

/**
 * Archive the current response into history instead of deleting it.
 * Used on session revival so the previous run's respond_to_user content
 * is preserved in the history list while the "current" slot is freed
 * for the new run's responses.
 */
export function archiveSessionUserResponse(sessionId: string): void {
  const currentResponse = sessionUserResponse.get(sessionId)
  if (!currentResponse) {
    logApp("[session-user-response-store] archive (no-op, nothing stored)", { sessionId })
    return
  }

  const history = sessionUserResponseHistory.get(sessionId) || []
  history.push(currentResponse)
  sessionUserResponseHistory.set(sessionId, history)
  sessionUserResponse.delete(sessionId)

  logApp("[session-user-response-store] archive", {
    sessionId,
    archivedLength: currentResponse.length,
    historyLength: history.length,
  })
}

