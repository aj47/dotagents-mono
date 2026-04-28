/**
 * Session User Response Store
 *
 * Stores ordered respond_to_user events scoped to session + run.
 * Compatibility helpers still expose latest/history string views for callers
 * that have not fully migrated yet.
 */
import type { AgentUserResponseEvent } from "@dotagents/shared"

import { logApp } from "./debug"

const sessionUserResponseEvents = new Map<string, AgentUserResponseEvent[]>()
const sessionRunOrdinals = new Map<string, number>()

function getRunKey(sessionId: string, runId?: number): string {
  return `${sessionId}:${typeof runId === "number" ? runId : "no-run"}`
}

export function appendSessionUserResponse(params: {
  sessionId: string
  text: string
  runId?: number
  timestamp?: number
}): AgentUserResponseEvent {
  const { sessionId, text, runId, timestamp = Date.now() } = params
  const runKey = getRunKey(sessionId, runId)
  const events = sessionUserResponseEvents.get(sessionId) ?? []

  const ordinal = (sessionRunOrdinals.get(runKey) ?? 0) + 1
  sessionRunOrdinals.set(runKey, ordinal)

  const event: AgentUserResponseEvent = {
    id: `${runKey}:${ordinal}:${timestamp}`,
    sessionId,
    runId,
    ordinal,
    text,
    timestamp,
  }

  sessionUserResponseEvents.set(sessionId, [...events, event])

  logApp("[session-user-response-store] append", {
    sessionId,
    runId,
    ordinal,
    responseLength: text.length,
    sessionEventCount: events.length + 1,
  })

  return event
}

function getSessionUserResponseEvents(sessionId: string): AgentUserResponseEvent[] {
  return sessionUserResponseEvents.get(sessionId) ?? []
}

export function getSessionRunUserResponseEvents(sessionId: string, runId?: number): AgentUserResponseEvent[] {
  return getSessionUserResponseEvents(sessionId)
    .filter((event) => event.runId === runId)
    .sort((a, b) => a.ordinal - b.ordinal)
}

function getLatestSessionUserResponseEvent(sessionId: string, runId?: number): AgentUserResponseEvent | undefined {
  const events = getSessionRunUserResponseEvents(sessionId, runId)
  return events[events.length - 1]
}

export function getSessionUserResponse(sessionId: string, runId?: number): string | undefined {
  return getLatestSessionUserResponseEvent(sessionId, runId)?.text
}

/**
 * Get past respond_to_user calls for the specified run (excluding latest).
 */
export function getSessionUserResponseHistory(sessionId: string, runId?: number): string[] {
  const events = getSessionRunUserResponseEvents(sessionId, runId)
  return events.slice(0, -1).map((event) => event.text)
}

export function clearSessionUserResponse(sessionId: string): void {
  const events = sessionUserResponseEvents.get(sessionId) ?? []
  sessionUserResponseEvents.delete(sessionId)
  for (const key of Array.from(sessionRunOrdinals.keys())) {
    if (key.startsWith(`${sessionId}:`)) {
      sessionRunOrdinals.delete(key)
    }
  }

  logApp("[session-user-response-store] clear", {
    sessionId,
    clearedEvents: events.length,
  })
}
