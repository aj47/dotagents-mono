/**
 * Session User Response Store
 *
 * Stores ordered respond_to_user events scoped to session + run.
 * Compatibility helpers still expose latest/history string views for callers
 * that have not fully migrated yet.
 */
import {
  appendAgentUserResponseEvent,
  clearAgentUserResponseEvents,
  createAgentUserResponseStoreState,
  getAgentUserResponseEventsForRun,
  getAgentUserResponseEventsForSession,
  getAgentUserResponseHistory,
  getAgentUserResponseText,
} from "@dotagents/shared/agent-user-response-store"
import type { AgentUserResponseEvent } from "@dotagents/shared/agent-progress"

import { logApp } from "./debug"

const userResponseStoreState = createAgentUserResponseStoreState()

export function appendSessionUserResponse(params: {
  sessionId: string
  text: string
  runId?: number
  timestamp?: number
}): AgentUserResponseEvent {
  const event = appendAgentUserResponseEvent(userResponseStoreState, params)

  logApp("[session-user-response-store] append", {
    sessionId: event.sessionId,
    runId: event.runId,
    ordinal: event.ordinal,
    responseLength: event.text.length,
    sessionEventCount: getAgentUserResponseEventsForSession(userResponseStoreState, event.sessionId).length,
  })

  return event
}

export function getSessionRunUserResponseEvents(sessionId: string, runId?: number): AgentUserResponseEvent[] {
  return getAgentUserResponseEventsForRun(userResponseStoreState, sessionId, runId)
}

export function getSessionUserResponse(sessionId: string, runId?: number): string | undefined {
  return getAgentUserResponseText(userResponseStoreState, sessionId, runId)
}

/**
 * Get past respond_to_user calls for the specified run (excluding latest).
 */
export function getSessionUserResponseHistory(sessionId: string, runId?: number): string[] {
  return getAgentUserResponseHistory(userResponseStoreState, sessionId, runId)
}

export function clearSessionUserResponse(sessionId: string): void {
  const clearedEvents = clearAgentUserResponseEvents(userResponseStoreState, sessionId)

  logApp("[session-user-response-store] clear", {
    sessionId,
    clearedEvents,
  })
}
