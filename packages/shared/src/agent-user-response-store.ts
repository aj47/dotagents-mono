import type { AgentUserResponseEvent } from './agent-progress';
import { sortAgentUserResponseEvents } from './chat-utils';

export interface AgentUserResponseStoreState {
  responseEventsBySession: Map<string, AgentUserResponseEvent[]>;
  runOrdinalsBySession: Map<string, Map<string, number>>;
}

export interface AppendAgentUserResponseEventParams {
  sessionId: string;
  text: string;
  runId?: number;
  timestamp?: number;
}

const NO_RUN_ORDINAL_KEY = 'no-run';

export function createAgentUserResponseStoreState(): AgentUserResponseStoreState {
  return {
    responseEventsBySession: new Map(),
    runOrdinalsBySession: new Map(),
  };
}

function getRunOrdinalKey(runId?: number): string {
  return typeof runId === 'number' ? String(runId) : NO_RUN_ORDINAL_KEY;
}

function formatResponseEventRunKey(sessionId: string, runId?: number): string {
  return `${sessionId}:${typeof runId === 'number' ? runId : NO_RUN_ORDINAL_KEY}`;
}

function getSessionRunOrdinals(
  state: AgentUserResponseStoreState,
  sessionId: string,
): Map<string, number> {
  const existingRunOrdinals = state.runOrdinalsBySession.get(sessionId);
  if (existingRunOrdinals) return existingRunOrdinals;

  const runOrdinals = new Map<string, number>();
  state.runOrdinalsBySession.set(sessionId, runOrdinals);
  return runOrdinals;
}

export function appendAgentUserResponseEvent(
  state: AgentUserResponseStoreState,
  params: AppendAgentUserResponseEventParams,
): AgentUserResponseEvent {
  const { sessionId, text, runId, timestamp = Date.now() } = params;
  const events = state.responseEventsBySession.get(sessionId) ?? [];
  const runOrdinals = getSessionRunOrdinals(state, sessionId);
  const runOrdinalKey = getRunOrdinalKey(runId);
  const ordinal = (runOrdinals.get(runOrdinalKey) ?? 0) + 1;
  runOrdinals.set(runOrdinalKey, ordinal);

  const event: AgentUserResponseEvent = {
    id: `${formatResponseEventRunKey(sessionId, runId)}:${ordinal}:${timestamp}`,
    sessionId,
    runId,
    ordinal,
    text,
    timestamp,
  };

  state.responseEventsBySession.set(sessionId, [...events, event]);
  return event;
}

export function getAgentUserResponseEventsForSession(
  state: AgentUserResponseStoreState,
  sessionId: string,
): AgentUserResponseEvent[] {
  return [...(state.responseEventsBySession.get(sessionId) ?? [])];
}

export function getAgentUserResponseEventsForRun(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): AgentUserResponseEvent[] {
  return sortAgentUserResponseEvents(
    getAgentUserResponseEventsForSession(state, sessionId).filter((event) => event.runId === runId),
  );
}

export function getLatestAgentUserResponseEvent(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): AgentUserResponseEvent | undefined {
  const events = getAgentUserResponseEventsForRun(state, sessionId, runId);
  return events[events.length - 1];
}

export function getAgentUserResponseText(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): string | undefined {
  return getLatestAgentUserResponseEvent(state, sessionId, runId)?.text;
}

export function getAgentUserResponseHistory(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): string[] {
  const events = getAgentUserResponseEventsForRun(state, sessionId, runId);
  return events.slice(0, -1).map((event) => event.text);
}

export function clearAgentUserResponseEvents(
  state: AgentUserResponseStoreState,
  sessionId: string,
): number {
  const clearedEvents = state.responseEventsBySession.get(sessionId)?.length ?? 0;
  state.responseEventsBySession.delete(sessionId);
  state.runOrdinalsBySession.delete(sessionId);
  return clearedEvents;
}
