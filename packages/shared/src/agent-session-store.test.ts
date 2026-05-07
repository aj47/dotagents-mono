import { describe, expect, it, vi } from 'vitest';
import {
  createAgentSessionStore,
  restoreAgentSessionStoreState,
  type AgentSession,
  type PersistedAgentSessionState,
} from './agent-session-store';

describe('agent-session-store', () => {
  it('tracks active sessions and revives errored sessions without stale error metadata', () => {
    const changes: string[] = [];
    const store = createAgentSessionStore({
      now: () => 1000,
      idFactory: () => 'session-1',
      onChange: () => changes.push('changed'),
    });

    const sessionId = store.startSession('conversation-1', 'Conversation', true, {
      profileId: 'profile-1',
      profileName: 'Agent',
      guidelines: '',
    });
    expect(sessionId).toBe('session-1');
    expect(store.getSession(sessionId)).toMatchObject({
      conversationId: 'conversation-1',
      conversationTitle: 'Conversation',
      status: 'active',
      isSnoozed: true,
    });

    expect(store.errorSession(sessionId, 'auth_unavailable: no auth available')).toBe(true);
    expect(store.getActiveSessions()).toHaveLength(0);
    expect(store.findCompletedSession(sessionId)).toMatchObject({
      status: 'error',
      errorMessage: 'auth_unavailable: no auth available',
    });

    expect(store.reviveSession(sessionId, false)).toBe(true);
    expect(store.getSession(sessionId)).toMatchObject({
      status: 'active',
      isSnoozed: false,
    });
    expect(store.getSession(sessionId)?.errorMessage).toBeUndefined();
    expect(store.getSession(sessionId)?.endTime).toBeUndefined();

    expect(store.completeSession(sessionId, 'done')).toBe(true);
    expect(store.getRecentSessions(1)[0]).toMatchObject({
      status: 'completed',
      lastActivity: 'done',
    });
    expect(store.getRecentSessions(1)[0]?.errorMessage).toBeUndefined();
    expect(changes).toHaveLength(4);
  });

  it('restores active sessions as stopped recent sessions and normalizes bad timestamps', () => {
    const persisted = {
      version: 1,
      activeSessions: [
        {
          id: 'interrupted',
          conversationId: 'conversation-1',
          conversationTitle: 'Interrupted',
          status: 'active',
          startTime: 'bad',
          endTime: 'bad',
          lastActivity: 42,
        },
      ],
      completedSessions: [],
    } as unknown as PersistedAgentSessionState;

    const restore = restoreAgentSessionStoreState(persisted, {
      now: () => 123456,
    });

    expect(restore.shouldPersist).toBe(true);
    expect(restore.restoredInterruptedSessionIds).toEqual(['interrupted']);
    expect(restore.state.activeSessions).toEqual([]);
    expect(restore.state.completedSessions).toEqual([
      expect.objectContaining({
        id: 'interrupted',
        status: 'stopped',
        startTime: 123456,
        endTime: 123456,
        lastActivity: 'Interrupted by app restart',
      }),
    ]);
  });

  it('keeps newest completed sessions and reports discarded session IDs', () => {
    const completedSessions: AgentSession[] = Array.from({ length: 5 }, (_, index) => ({
      id: `session-${index + 1}`,
      conversationId: `conversation-${index + 1}`,
      conversationTitle: `Session ${index + 1}`,
      status: 'completed',
      startTime: (index + 1) * 1000,
      endTime: (index + 1) * 1000,
    }));

    const restore = restoreAgentSessionStoreState(
      {
        version: 1,
        activeSessions: [],
        completedSessions,
      },
      {
        maxCompletedSessions: 3,
      },
    );

    expect(restore.state.completedSessions.map((session) => session.id)).toEqual([
      'session-5',
      'session-4',
      'session-3',
    ]);
    expect(restore.discardedSessionIds).toEqual(['session-2', 'session-1']);
    expect(restore.shouldPersist).toBe(true);
  });

  it('notifies discarded sessions when runtime completed history is trimmed or cleared', () => {
    const discarded: string[] = [];
    let now = 0;
    const store = createAgentSessionStore({
      maxCompletedSessions: 2,
      now: () => ++now,
      idFactory: (createdAt) => `session-${createdAt}`,
      onSessionDiscarded: (sessionId) => discarded.push(sessionId),
    });

    const first = store.startSession('conversation-1', 'First');
    store.completeSession(first);
    const second = store.startSession('conversation-2', 'Second');
    store.completeSession(second);
    const third = store.startSession('conversation-3', 'Third');
    store.completeSession(third);

    expect(store.getRecentSessions(10).map((session) => session.id)).toEqual([third, second]);
    expect(discarded).toEqual([first]);

    store.clearCompletedSessions((session) => session.id === second);
    expect(discarded).toEqual([first, second]);
    expect(store.getRecentSessions(10).map((session) => session.id)).toEqual([third]);
  });

  it('can export persisted state from the store adapter boundary', () => {
    const onChange = vi.fn();
    const store = createAgentSessionStore({
      now: () => 100,
      idFactory: () => 'session-1',
      onChange,
    });

    store.startSession('conversation-1', 'Conversation');

    expect(store.getPersistedState()).toEqual({
      version: 1,
      activeSessions: [
        expect.objectContaining({
          id: 'session-1',
          conversationId: 'conversation-1',
          status: 'active',
        }),
      ],
      completedSessions: [],
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
