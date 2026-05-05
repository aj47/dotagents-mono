import { describe, expect, it } from 'vitest';

import {
  appendAgentUserResponseEvent,
  clearAgentUserResponseEvents,
  createAgentUserResponseStoreState,
  getAgentUserResponseEventsForRun,
  getAgentUserResponseHistory,
  getAgentUserResponseText,
} from './agent-user-response-store';

describe('agent-user-response-store', () => {
  it('preserves duplicate response text as distinct ordered events for one run', () => {
    const store = createAgentUserResponseStoreState();
    const first = appendAgentUserResponseEvent(store, {
      sessionId: 'session-1',
      runId: 7,
      text: 'Same response',
      timestamp: 1000,
    });
    const second = appendAgentUserResponseEvent(store, {
      sessionId: 'session-1',
      runId: 7,
      text: 'Same response',
      timestamp: 2000,
    });

    expect(second).not.toEqual(first);
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 7).map((event) => ({
      text: event.text,
      ordinal: event.ordinal,
    }))).toEqual([
      { text: 'Same response', ordinal: 1 },
      { text: 'Same response', ordinal: 2 },
    ]);
  });

  it('tracks ordinals independently per session and run', () => {
    const store = createAgentUserResponseStoreState();
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Run one', timestamp: 1000 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 2, text: 'Run two', timestamp: 1001 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-2', runId: 1, text: 'Other session', timestamp: 1002 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Run one again', timestamp: 1003 });

    expect(getAgentUserResponseEventsForRun(store, 'session-1', 1).map((event) => event.ordinal)).toEqual([1, 2]);
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 2).map((event) => event.ordinal)).toEqual([1]);
    expect(getAgentUserResponseEventsForRun(store, 'session-2', 1).map((event) => event.ordinal)).toEqual([1]);
  });

  it('returns latest response text and prior response history for a run', () => {
    const store = createAgentUserResponseStoreState();
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 3, text: 'First', timestamp: 1000 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 3, text: 'Second', timestamp: 1001 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 3, text: 'Final', timestamp: 1002 });

    expect(getAgentUserResponseText(store, 'session-1', 3)).toBe('Final');
    expect(getAgentUserResponseHistory(store, 'session-1', 3)).toEqual(['First', 'Second']);
  });

  it('clears one session without disturbing another session', () => {
    const store = createAgentUserResponseStoreState();
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Cleared', timestamp: 1000 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-2', runId: 1, text: 'Kept', timestamp: 1001 });

    expect(clearAgentUserResponseEvents(store, 'session-1')).toBe(1);
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 1)).toEqual([]);
    expect(getAgentUserResponseText(store, 'session-2', 1)).toBe('Kept');

    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Reset ordinal', timestamp: 1002 });
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 1).map((event) => event.ordinal)).toEqual([1]);
  });
});
