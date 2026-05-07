import type { SessionProfileSnapshot } from './agent-profile-session-snapshot';

export interface AgentSession {
  id: string;
  conversationId?: string;
  conversationTitle?: string;
  status: 'active' | 'completed' | 'error' | 'stopped';
  startTime: number;
  endTime?: number;
  currentIteration?: number;
  maxIterations?: number;
  lastActivity?: string;
  errorMessage?: string;
  isSnoozed?: boolean;
  isRepeatTask?: boolean;
  profileSnapshot?: SessionProfileSnapshot;
}

export type PersistedAgentSessionState = {
  version: 1;
  activeSessions: AgentSession[];
  completedSessions: AgentSession[];
};

export type AgentSessionStoreState = {
  activeSessions: AgentSession[];
  completedSessions: AgentSession[];
};

export type AgentSessionStartMetadata = Pick<AgentSession, 'isRepeatTask'>;

export interface AgentSessionStoreRestoreOptions {
  now?: () => number;
  maxCompletedSessions?: number;
  interruptedLastActivity?: string;
}

export interface AgentSessionStoreRestoreResult {
  state: AgentSessionStoreState;
  discardedSessionIds: string[];
  restoredInterruptedSessionIds: string[];
  shouldPersist: boolean;
}

export interface AgentSessionStoreOptions extends AgentSessionStoreRestoreOptions {
  initialState?: Partial<AgentSessionStoreState>;
  idFactory?: (createdAt: number) => string;
  onChange?: () => void;
  onSessionDiscarded?: (sessionId: string) => void;
}

export interface AgentSessionStore {
  startSession(
    conversationId?: string,
    conversationTitle?: string,
    startSnoozed?: boolean,
    profileSnapshot?: SessionProfileSnapshot,
    sessionMetadata?: AgentSessionStartMetadata,
  ): string;
  updateSession(sessionId: string, updates: Partial<Omit<AgentSession, 'id' | 'startTime'>>): void;
  completeSession(sessionId: string, finalActivity?: string): boolean;
  stopSession(sessionId: string): boolean;
  errorSession(sessionId: string, errorMessage: string): boolean;
  getActiveSessions(): AgentSession[];
  getRecentSessions(limit?: number): AgentSession[];
  snoozeSession(sessionId: string): boolean;
  unsnoozeSession(sessionId: string): boolean;
  getSession(sessionId: string): AgentSession | undefined;
  isSessionSnoozed(sessionId: string): boolean;
  getSessionProfileSnapshot(sessionId: string): SessionProfileSnapshot | undefined;
  getConversationIdForSession(sessionId: string): string | undefined;
  findCompletedSession(sessionId: string): AgentSession | undefined;
  findSessionByConversationId(conversationId: string): string | undefined;
  reviveSession(sessionId: string, startSnoozed?: boolean): boolean;
  removeCompletedSession(sessionId: string): boolean;
  clearAllSessions(): void;
  clearCompletedSessions(shouldClear?: (session: AgentSession) => boolean): void;
  getPersistedState(): PersistedAgentSessionState;
}

export const DEFAULT_MAX_COMPLETED_AGENT_SESSIONS = 20;
export const DEFAULT_AGENT_SESSION_RESTART_ACTIVITY = 'Interrupted by app restart';

function defaultAgentSessionIdFactory(createdAt: number): string {
  return `session_${createdAt}_${Math.random().toString(36).substr(2, 9)}`;
}

function getFiniteTimestamp(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getCompletedSessionSortTime(session: AgentSession): number {
  return getFiniteTimestamp(session.endTime) ?? getFiniteTimestamp(session.startTime) ?? 0;
}

function isRestorableSession(value: unknown): value is AgentSession {
  return !!value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string';
}

function normalizeRestoredSession(
  session: AgentSession,
  options?: {
    status?: AgentSession['status'];
    defaultEndTime?: number;
    defaultLastActivity?: string;
  },
): AgentSession {
  const endTime = getFiniteTimestamp(session.endTime) ?? options?.defaultEndTime;
  const startTime = getFiniteTimestamp(session.startTime) ?? endTime ?? 0;
  const lastActivity = typeof session.lastActivity === 'string' && session.lastActivity.trim().length > 0
    ? session.lastActivity
    : options?.defaultLastActivity;

  return {
    ...session,
    ...(options?.status ? { status: options.status } : {}),
    startTime,
    endTime,
    lastActivity,
  };
}

function normalizeCompletedSessions(
  sessions: AgentSession[],
  maxCompletedSessions: number,
): {
  retainedSessions: AgentSession[];
  discardedSessions: AgentSession[];
} {
  const sortedSessions = [...sessions]
    .sort((a, b) => getCompletedSessionSortTime(b) - getCompletedSessionSortTime(a));

  return {
    retainedSessions: sortedSessions.slice(0, maxCompletedSessions),
    discardedSessions: sortedSessions.slice(maxCompletedSessions),
  };
}

function normalizeInitialSessions(sessions: AgentSession[] | undefined): AgentSession[] {
  return Array.isArray(sessions)
    ? sessions.filter(isRestorableSession).map((session) => ({ ...session }))
    : [];
}

export function restoreAgentSessionStoreState(
  persisted: PersistedAgentSessionState | undefined,
  options: AgentSessionStoreRestoreOptions = {},
): AgentSessionStoreRestoreResult {
  const maxCompletedSessions = options.maxCompletedSessions ?? DEFAULT_MAX_COMPLETED_AGENT_SESSIONS;
  if (!persisted) {
    return {
      state: {
        activeSessions: [],
        completedSessions: [],
      },
      discardedSessionIds: [],
      restoredInterruptedSessionIds: [],
      shouldPersist: false,
    };
  }

  const restoredCompleted = normalizeInitialSessions(persisted.completedSessions)
    .map((session) => normalizeRestoredSession(session));

  const interruptedAt = (options.now ?? Date.now)();
  const restoredInterrupted = normalizeInitialSessions(persisted.activeSessions)
    .map((session) => normalizeRestoredSession(session, {
      status: 'stopped',
      defaultEndTime: interruptedAt,
      defaultLastActivity: options.interruptedLastActivity ?? DEFAULT_AGENT_SESSION_RESTART_ACTIVITY,
    }));

  const { retainedSessions, discardedSessions } = normalizeCompletedSessions(
    [...restoredInterrupted, ...restoredCompleted],
    maxCompletedSessions,
  );

  return {
    state: {
      activeSessions: [],
      completedSessions: retainedSessions,
    },
    discardedSessionIds: discardedSessions.map((session) => session.id),
    restoredInterruptedSessionIds: restoredInterrupted.map((session) => session.id),
    shouldPersist: restoredInterrupted.length > 0 || discardedSessions.length > 0,
  };
}

export function createAgentSessionStore(options: AgentSessionStoreOptions = {}): AgentSessionStore {
  const maxCompletedSessions = options.maxCompletedSessions ?? DEFAULT_MAX_COMPLETED_AGENT_SESSIONS;
  const now = options.now ?? Date.now;
  const idFactory = options.idFactory ?? defaultAgentSessionIdFactory;
  const sessions = new Map<string, AgentSession>(
    normalizeInitialSessions(options.initialState?.activeSessions)
      .map((session) => [session.id, session]),
  );
  let completedSessions = normalizeCompletedSessions(
    normalizeInitialSessions(options.initialState?.completedSessions),
    maxCompletedSessions,
  ).retainedSessions;

  function notifyChange(): void {
    options.onChange?.();
  }

  function discardSession(sessionId: string): void {
    options.onSessionDiscarded?.(sessionId);
  }

  function replaceCompletedSessions(nextSessions: AgentSession[]): void {
    const { retainedSessions, discardedSessions } = normalizeCompletedSessions(nextSessions, maxCompletedSessions);
    completedSessions = retainedSessions;

    for (const discardedSession of discardedSessions) {
      discardSession(discardedSession.id);
    }
  }

  function finishSession(
    sessionId: string,
    status: Exclude<AgentSession['status'], 'active'>,
    updates: Partial<AgentSession> = {},
  ): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.status = status;
    session.endTime = now();
    Object.assign(session, updates);
    replaceCompletedSessions([{ ...session }, ...completedSessions]);
    sessions.delete(sessionId);
    notifyChange();
    return true;
  }

  return {
    startSession(
      conversationId,
      conversationTitle,
      startSnoozed = true,
      profileSnapshot,
      sessionMetadata = {},
    ): string {
      const createdAt = now();
      const sessionId = idFactory(createdAt);
      const session: AgentSession = {
        id: sessionId,
        conversationId,
        conversationTitle: conversationTitle || 'Untitled Agent Session',
        status: 'active',
        startTime: createdAt,
        currentIteration: 0,
        maxIterations: 10,
        isSnoozed: startSnoozed,
        isRepeatTask: sessionMetadata.isRepeatTask,
        profileSnapshot,
      };

      sessions.set(sessionId, session);
      notifyChange();
      return sessionId;
    },

    updateSession(sessionId, updates): void {
      const session = sessions.get(sessionId);
      if (!session) return;
      Object.assign(session, updates);
      notifyChange();
    },

    completeSession(sessionId, finalActivity): boolean {
      return finishSession(sessionId, 'completed', finalActivity ? { lastActivity: finalActivity } : {});
    },

    stopSession(sessionId): boolean {
      return finishSession(sessionId, 'stopped');
    },

    errorSession(sessionId, errorMessage): boolean {
      return finishSession(sessionId, 'error', { errorMessage });
    },

    getActiveSessions(): AgentSession[] {
      return Array.from(sessions.values())
        .sort((a, b) => b.startTime - a.startTime);
    },

    getRecentSessions(limit = 4): AgentSession[] {
      return completedSessions
        .slice(0, limit)
        .sort((a, b) => getCompletedSessionSortTime(b) - getCompletedSessionSortTime(a));
    },

    snoozeSession(sessionId): boolean {
      const session = sessions.get(sessionId);
      if (!session) return false;
      session.isSnoozed = true;
      sessions.set(sessionId, session);
      notifyChange();
      return true;
    },

    unsnoozeSession(sessionId): boolean {
      const session = sessions.get(sessionId);
      if (!session) return false;
      session.isSnoozed = false;
      sessions.set(sessionId, session);
      notifyChange();
      return true;
    },

    getSession(sessionId): AgentSession | undefined {
      return sessions.get(sessionId);
    },

    isSessionSnoozed(sessionId): boolean {
      return sessions.get(sessionId)?.isSnoozed ?? false;
    },

    getSessionProfileSnapshot(sessionId): SessionProfileSnapshot | undefined {
      const session = sessions.get(sessionId);
      if (session?.profileSnapshot) {
        return session.profileSnapshot;
      }

      const completedSession = completedSessions.find((candidate) => candidate.id === sessionId);
      return completedSession?.profileSnapshot;
    },

    getConversationIdForSession(sessionId): string | undefined {
      const activeSession = sessions.get(sessionId);
      if (activeSession) {
        return activeSession.conversationId;
      }

      return completedSessions.find((session) => session.id === sessionId)?.conversationId;
    },

    findCompletedSession(sessionId): AgentSession | undefined {
      return completedSessions.find((session) => session.id === sessionId);
    },

    findSessionByConversationId(conversationId): string | undefined {
      for (const [sessionId, session] of sessions.entries()) {
        if (session.conversationId === conversationId) {
          return sessionId;
        }
      }

      for (const session of completedSessions) {
        if (session.conversationId === conversationId) {
          return session.id;
        }
      }

      return undefined;
    },

    reviveSession(sessionId, startSnoozed = false): boolean {
      const completedIndex = completedSessions.findIndex((session) => session.id === sessionId);
      if (completedIndex === -1) {
        return sessions.has(sessionId);
      }

      const [session] = completedSessions.splice(completedIndex, 1);
      session.status = 'active';
      session.isSnoozed = startSnoozed;
      delete session.endTime;
      delete session.errorMessage;
      sessions.set(sessionId, session);
      notifyChange();
      return true;
    },

    removeCompletedSession(sessionId): boolean {
      const index = completedSessions.findIndex((session) => session.id === sessionId);
      if (index === -1) return false;

      completedSessions.splice(index, 1);
      discardSession(sessionId);
      notifyChange();
      return true;
    },

    clearAllSessions(): void {
      const sessionIds = new Set<string>([
        ...sessions.keys(),
        ...completedSessions.map((session) => session.id),
      ]);

      for (const sessionId of sessionIds) {
        discardSession(sessionId);
      }

      sessions.clear();
      completedSessions = [];
      notifyChange();
    },

    clearCompletedSessions(shouldClear = () => true): void {
      const retainedSessions: AgentSession[] = [];

      for (const session of completedSessions) {
        if (shouldClear(session)) {
          discardSession(session.id);
        } else {
          retainedSessions.push(session);
        }
      }

      completedSessions = retainedSessions;
      notifyChange();
    },

    getPersistedState(): PersistedAgentSessionState {
      return {
        version: 1,
        activeSessions: Array.from(sessions.values()),
        completedSessions,
      };
    },
  };
}
