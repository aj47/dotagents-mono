import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, SessionListItem, generateSessionId, generateMessageId, generateSessionTitle, sessionToListItem } from '../types/session';
import { ChatMessage } from '../lib/openaiClient';
import { SettingsApiClient } from '../lib/settingsApi';
import { syncConversations, SyncResult, fetchFullConversation } from '../lib/syncService';

const SESSIONS_KEY = 'chat_sessions_v1';
const CURRENT_SESSION_KEY = 'current_session_id_v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function sanitizeStoredMessage(
  value: unknown,
  fallbackTimestamp: number,
): { message: Session['messages'][number] | null; changed: boolean } {
  if (!isRecord(value)) {
    return { message: null, changed: true };
  }

  const id = typeof value.id === 'string' && value.id.trim().length > 0 ? value.id.trim() : null;
  const role = value.role;
  const content = typeof value.content === 'string' ? value.content : null;

  if (!id || (role !== 'user' && role !== 'assistant' && role !== 'tool') || content === null) {
    return { message: null, changed: true };
  }

  let changed = value.id !== id || !isFiniteNumber(value.timestamp);
  const message: Session['messages'][number] = {
    id,
    role,
    content,
    timestamp: isFiniteNumber(value.timestamp) ? value.timestamp : fallbackTimestamp,
  };

  if (Array.isArray(value.toolCalls)) {
    message.toolCalls = value.toolCalls;
  } else if (value.toolCalls !== undefined) {
    changed = true;
  }

  if (Array.isArray(value.toolResults)) {
    message.toolResults = value.toolResults;
  } else if (value.toolResults !== undefined) {
    changed = true;
  }

  return { message, changed };
}

function sanitizeStoredMetadata(value: unknown): {
  metadata: Session['metadata'] | undefined;
  changed: boolean;
} {
  if (value === undefined) {
    return { metadata: undefined, changed: false };
  }
  if (!isRecord(value)) {
    return { metadata: undefined, changed: true };
  }

  const model = typeof value.model === 'string' && value.model.trim().length > 0 ? value.model : undefined;
  const totalTokens = isFiniteNumber(value.totalTokens) ? value.totalTokens : undefined;
  const metadata = model !== undefined || totalTokens !== undefined
    ? { ...(model !== undefined ? { model } : {}), ...(totalTokens !== undefined ? { totalTokens } : {}) }
    : undefined;

  return {
    metadata,
    changed:
      metadata === undefined
        ? Object.keys(value).length > 0
        : value.model !== model || value.totalTokens !== totalTokens,
  };
}

function sanitizeStoredServerMetadata(value: unknown): {
  serverMetadata: Session['serverMetadata'] | undefined;
  changed: boolean;
} {
  if (value === undefined) {
    return { serverMetadata: undefined, changed: false };
  }
  if (!isRecord(value)) {
    return { serverMetadata: undefined, changed: true };
  }

  const messageCount = isFiniteNumber(value.messageCount)
    ? Math.max(0, Math.floor(value.messageCount))
    : null;
  const lastMessage = typeof value.lastMessage === 'string' ? value.lastMessage : '';
  const preview = typeof value.preview === 'string' ? value.preview : '';

  if (messageCount === null) {
    return { serverMetadata: undefined, changed: true };
  }

  return {
    serverMetadata: { messageCount, lastMessage, preview },
    changed:
      value.messageCount !== messageCount ||
      value.lastMessage !== lastMessage ||
      value.preview !== preview,
  };
}

function sanitizeStoredSession(
  value: unknown,
  fallbackTimestamp: number,
): { session: Session | null; changed: boolean } {
  if (!isRecord(value)) {
    return { session: null, changed: true };
  }

  const id = typeof value.id === 'string' && value.id.trim().length > 0 ? value.id.trim() : null;
  if (!id) {
    return { session: null, changed: true };
  }

  let changed = value.id !== id;
  const rawMessages = Array.isArray(value.messages) ? value.messages : [];
  if (!Array.isArray(value.messages)) {
    changed = true;
  }

  const messages: Session['messages'] = [];
  rawMessages.forEach((message, index) => {
    const sanitized = sanitizeStoredMessage(message, fallbackTimestamp + index);
    changed = changed || sanitized.changed;
    if (sanitized.message) {
      messages.push(sanitized.message);
    }
  });

  const firstUserMessage = messages.find(message => message.role === 'user');
  const title =
    typeof value.title === 'string' && value.title.trim().length > 0
      ? value.title
      : firstUserMessage?.content
        ? generateSessionTitle(firstUserMessage.content)
        : 'New Chat';
  if (value.title !== title) {
    changed = true;
  }

  const metadataResult = sanitizeStoredMetadata(value.metadata);
  const serverMetadataResult = sanitizeStoredServerMetadata(value.serverMetadata);
  changed = changed || metadataResult.changed || serverMetadataResult.changed;

  const createdAtCandidate = isFiniteNumber(value.createdAt) ? value.createdAt : undefined;
  const updatedAtCandidate = isFiniteNumber(value.updatedAt) ? value.updatedAt : undefined;
  const fallbackFromMessages = messages[messages.length - 1]?.timestamp ?? fallbackTimestamp;
  const createdAt = createdAtCandidate ?? updatedAtCandidate ?? fallbackFromMessages;
  const updatedAt = Math.max(updatedAtCandidate ?? createdAt, createdAt);
  if (createdAtCandidate !== createdAt || updatedAtCandidate !== updatedAt) {
    changed = true;
  }

  const serverConversationId =
    typeof value.serverConversationId === 'string' && value.serverConversationId.trim().length > 0
      ? value.serverConversationId.trim()
      : undefined;
  if (value.serverConversationId !== serverConversationId) {
    changed = true;
  }

  return {
    session: {
      id,
      title,
      createdAt,
      updatedAt,
      messages,
      ...(serverConversationId ? { serverConversationId } : {}),
      ...(metadataResult.metadata ? { metadata: metadataResult.metadata } : {}),
      ...(serverMetadataResult.serverMetadata ? { serverMetadata: serverMetadataResult.serverMetadata } : {}),
    },
    changed,
  };
}

function sanitizeStoredSessions(value: unknown): { sessions: Session[]; changed: boolean } {
  if (!Array.isArray(value)) {
    return { sessions: [], changed: value !== undefined };
  }

  const seenSessionIds = new Set<string>();
  const sessions: Session[] = [];
  let changed = false;
  const fallbackTimestampBase = Date.now();

  value.forEach((session, index) => {
    const sanitized = sanitizeStoredSession(session, fallbackTimestampBase + index * 1000);
    changed = changed || sanitized.changed;
    if (!sanitized.session) {
      return;
    }

    if (seenSessionIds.has(sanitized.session.id)) {
      changed = true;
      return;
    }

    seenSessionIds.add(sanitized.session.id);
    sessions.push(sanitized.session);
  });

  return { sessions, changed };
}

function normalizeStoredCurrentSessionId(id: string | null): string | null {
  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : null;
}

function resolveStoredCurrentSessionId(
  sessions: Session[],
  currentSessionId: string | null,
): string | null {
  const normalizedCurrentSessionId = normalizeStoredCurrentSessionId(currentSessionId);
  if (sessions.length === 0) {
    return null;
  }
  if (!normalizedCurrentSessionId) {
    return sessions[0].id;
  }
  return sessions.some(session => session.id === normalizedCurrentSessionId)
    ? normalizedCurrentSessionId
    : sessions[0].id;
}

export interface SessionStore {
  sessions: Session[];
  currentSessionId: string | null;
  ready: boolean;
  /** Set of session IDs that are currently being deleted (prevents race conditions) */
  deletingSessionIds: Set<string>;

  // Session management
  createNewSession: () => Session;
  setCurrentSession: (id: string | null) => void;
  deleteSession: (id: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;

  // Message management
  addMessage: (role: 'user' | 'assistant', content: string, toolCalls?: any[], toolResults?: any[]) => Promise<void>;
  getCurrentSession: () => Session | null;
  getSessionList: () => SessionListItem[];
  setMessages: (messages: ChatMessage[]) => Promise<void>;
  setMessagesForSession: (sessionId: string, messages: ChatMessage[]) => Promise<void>;

  // Server conversation ID management (for continuing conversations with DotAgents server)
  setServerConversationId: (serverConversationId: string) => Promise<void>;
  setServerConversationIdForSession: (sessionId: string, serverConversationId: string) => Promise<void>;
  getServerConversationId: () => string | undefined;
  findSessionByServerConversationId: (serverConversationId: string) => Session | null;

  // Sync with server
  syncWithServer: (client: SettingsApiClient) => Promise<SyncResult>;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;

  // Lazy loading
  loadSessionMessages: (sessionId: string, client: SettingsApiClient) => Promise<{ messages: ChatMessage[]; freshlyFetched: boolean } | null>;
  isLoadingMessages: boolean;
}

async function loadSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      const { sessions, changed } = sanitizeStoredSessions(parsed);

      if (changed) {
        console.warn('[sessions] Stored sessions were invalid or outdated; rewriting sanitized data');
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }

      return sessions;
    } catch (error) {
      console.warn('[sessions] Failed to parse stored sessions; clearing corrupt data', error);

      try {
        await AsyncStorage.removeItem(SESSIONS_KEY);
      } catch (storageError) {
        console.warn('[sessions] Failed to clear corrupt stored sessions', storageError);
      }
    }
  } catch (error) {
    console.warn('[sessions] Failed to load stored sessions', error);
  }

  return [];
}

async function saveSessions(sessions: Session[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

async function loadCurrentSessionId(): Promise<string | null> {
  try {
    const storedId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    const normalizedId = normalizeStoredCurrentSessionId(storedId);

    if (storedId !== normalizedId) {
      console.warn('[sessions] Stored current session ID was invalid; clearing it');
      await saveCurrentSessionId(normalizedId);
    }

    return normalizedId;
  } catch (error) {
    console.warn('[sessions] Failed to load current session ID', error);
  }
  return null;
}

async function saveCurrentSessionId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, id);
  } else {
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

export function useSessions(): SessionStore {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Track sessions being deleted to prevent race conditions (fixes #571)
  const [deletingSessionIds, setDeletingSessionIds] = useState<Set<string>>(new Set());
  // Use ref to ensure we always have the latest sessions for async operations
  // NOTE: We update these refs synchronously in our callbacks, not just in useEffect,
  // to ensure queued async saves always see the correct state (fixes PR review comment)
  const sessionsRef = useRef<Session[]>(sessions);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  // Use ref for currentSessionId to avoid stale closure issues after awaits
  const currentSessionIdRef = useRef<string | null>(currentSessionId);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  // Serialize async storage writes to prevent interleaving (fixes PR review comment)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Helper to queue async save operations to prevent interleaving
  const queueSave = useCallback((saveOperation: () => Promise<void>): void => {
    saveQueueRef.current = saveQueueRef.current
      .then(saveOperation)
      .catch(err => console.error('[sessions] Save operation failed:', err));
  }, []);

  // Load sessions on mount
  useEffect(() => {
    (async () => {
      const [loadedSessions, loadedCurrentId] = await Promise.all([
        loadSessions(),
        loadCurrentSessionId(),
      ]);
      const recoveredCurrentId = resolveStoredCurrentSessionId(loadedSessions, loadedCurrentId);

      if (recoveredCurrentId !== loadedCurrentId) {
        console.warn('[sessions] Recovering current session selection from stored data');
        try {
          await saveCurrentSessionId(recoveredCurrentId);
        } catch (error) {
          console.warn('[sessions] Failed to persist recovered current session ID', error);
        }
      }

      // Update refs synchronously BEFORE setting state to prevent stale refs
      // This fixes the race condition where createNewSession could read empty sessionsRef.current
      // if called immediately after mount (before the useEffect that syncs refs from state runs)
      sessionsRef.current = loadedSessions;
      currentSessionIdRef.current = recoveredCurrentId;
      setSessions(loadedSessions);
      setCurrentSessionIdState(recoveredCurrentId);
      setReady(true);
    })();
  }, []);

  const createNewSession = useCallback((): Session => {
    const now = Date.now();
    const newSession: Session = {
      id: generateSessionId(),
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (fixes PR review: avoids React updater timing race)
    const currentSessions = sessionsRef.current;
    const cleanedPrev = currentSessions.filter(s => !deletingSessionIds.has(s.id));
    const sessionsToSave = [newSession, ...cleanedPrev];

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Use functional update for state to ensure React's reconciliation works correctly
    // The functional update also serves as a safeguard against stale closures in edge cases
    setSessions(prev => {
      // Re-filter to handle any edge case where state diverged from ref
      const freshCleanedPrev = prev.filter(s => !deletingSessionIds.has(s.id));
      return [newSession, ...freshCleanedPrev];
    });

    setCurrentSessionIdState(newSession.id);
    // Update currentSessionId ref synchronously as well
    currentSessionIdRef.current = newSession.id;

    // Queue async saves with the pre-computed sessions array (guaranteed correct value)
    queueSave(async () => {
      await saveSessions(sessionsToSave);
      await saveCurrentSessionId(newSession.id);
    });

    return newSession;
  }, [deletingSessionIds, queueSave]);

  const setCurrentSession = useCallback((id: string | null) => {
    setCurrentSessionIdState(id);
    // Update ref synchronously so queued saves see the new value immediately
    currentSessionIdRef.current = id;
    // Queue the async save to prevent interleaving with deleteSession's queued saves
    // This ensures that if a delete is in progress, the new selection won't be overwritten
    queueSave(async () => {
      await saveCurrentSessionId(id);
    });
  }, [queueSave]);

  const deleteSession = useCallback(async (id: string) => {
    // Mark session as being deleted to prevent race conditions
    setDeletingSessionIds(prev => new Set(prev).add(id));

    // Check if we're deleting the current session for immediate UI update
    const isCurrentSession = currentSessionIdRef.current === id;

    // Update current session state immediately for responsive UI
    if (isCurrentSession) {
      setCurrentSessionIdState(null);
      // Update ref synchronously so queued saves see the new value immediately
      currentSessionIdRef.current = null;
    }

    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (fixes PR review: avoids React updater timing race)
    const currentSessions = sessionsRef.current;
    const sessionsToSave = currentSessions.filter(s => s.id !== id);

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Use functional update for state to ensure React's reconciliation works correctly
    setSessions(prev => prev.filter(s => s.id !== id));

    // Queue save with the pre-computed sessions array (guaranteed correct value)
    queueSave(async () => {
      await saveSessions(sessionsToSave);
      // Re-check currentSessionIdRef at save time to avoid overwriting newly selected session
      // Only clear persisted ID if user hasn't switched to a different session
      // This fixes the race where user switches sessions while delete is in-flight
      const currentIdAtSaveTime = currentSessionIdRef.current;
      if (currentIdAtSaveTime === null || currentIdAtSaveTime === id) {
        await saveCurrentSessionId(null);
      }
    });

    // Wait for the queued save to complete before removing from deleting set
    // Since queueSave is now called synchronously above, this await will correctly
    // wait for the delete save operation to complete
    try {
      await new Promise<void>((resolve, reject) => {
        saveQueueRef.current = saveQueueRef.current.then(resolve).catch(reject);
      });
    } finally {
      // Remove from deleting set after save completes
      setDeletingSessionIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [queueSave]);

  const clearAllSessions = useCallback(async () => {
    // Mark all sessions as being deleted
    const allIds = new Set(sessionsRef.current.map(s => s.id));
    setDeletingSessionIds(allIds);

    setSessions([]);
    setCurrentSessionIdState(null);
    // Update refs synchronously so queued saves see the new values immediately
    sessionsRef.current = [];
    currentSessionIdRef.current = null;

    // Queue async saves to prevent interleaving - save empty array directly (no ref needed)
    queueSave(async () => {
      await Promise.all([
        saveSessions([]),
        saveCurrentSessionId(null),
      ]);
    });

    // Wait for the queued save to complete before clearing the deleting set
    try {
      await new Promise<void>((resolve, reject) => {
        saveQueueRef.current = saveQueueRef.current.then(resolve).catch(reject);
      });
    } finally {
      setDeletingSessionIds(new Set());
    }
  }, [queueSave]);

  const getCurrentSession = useCallback((): Session | null => {
    if (!currentSessionId) return null;
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  const getSessionList = useCallback((): SessionListItem[] => {
    // Sort sessions by updatedAt in descending order (most recently active first)
    const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
    return sortedSessions.map(sessionToListItem);
  }, [sessions]);

  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    toolCalls?: any[],
    toolResults?: any[]
  ) => {
    if (!currentSessionId) return;

    // Create the message ONCE to ensure consistency between persisted and React state
    const now = Date.now();
    const newMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: now,
      toolCalls,
      toolResults,
    };

    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (same pattern as createNewSession/deleteSession)
    const currentSessions = sessionsRef.current;
    const targetSessionId = currentSessionId;
    const sessionsToSave = currentSessions.map(session => {
      if (session.id !== targetSessionId) return session;

      // Update title if this is the first user message
      let title = session.title;
      if (role === 'user' && session.messages.length === 0) {
        title = generateSessionTitle(content);
      }

      return {
        ...session,
        title,
        updatedAt: now,
        messages: [...session.messages, newMessage],
      };
    });

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Set state to the pre-computed sessions array to ensure React state matches persisted state
    setSessions(sessionsToSave);

    // Queue async save with the pre-computed sessions array (serialized with other operations)
    queueSave(async () => {
      await saveSessions(sessionsToSave);
    });
  }, [currentSessionId, queueSave]);

  // Set messages directly (for updating from chat responses)
  const setMessages = useCallback(async (messages: ChatMessage[]) => {
    if (!currentSessionId) return;

    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (same pattern as createNewSession/deleteSession)
    const currentSessions = sessionsRef.current;
    const targetSessionId = currentSessionId;
    const now = Date.now();

    // Pre-compute session messages for consistency
    const sessionMessages = messages.map((m, idx) => ({
      id: generateMessageId(),
      role: m.role as 'user' | 'assistant' | 'tool',
      content: m.content || '',
      timestamp: typeof m.timestamp === 'number' && Number.isFinite(m.timestamp)
        ? m.timestamp
        : now + idx,
      toolCalls: m.toolCalls,
      toolResults: m.toolResults,
    }));

    const firstUserMsg = messages.find(m => m.role === 'user');

    const sessionsToSave = currentSessions.map(session => {
      if (session.id !== targetSessionId) return session;

      // Update title from first user message if needed
      let title = session.title;
      if (title === 'New Chat' && firstUserMsg?.content) {
        title = generateSessionTitle(firstUserMsg.content);
      }

      return {
        ...session,
        title,
        updatedAt: now,
        messages: sessionMessages,
      };
    });

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Use functional update for state - return the pre-computed sessionsToSave directly
    // to guarantee state matches what we're saving (same pattern as addMessage)
    setSessions(() => sessionsToSave);

    // Queue async save with the pre-computed sessions array (serialized with other operations)
    queueSave(async () => {
      await saveSessions(sessionsToSave);
    });
  }, [currentSessionId, queueSave]);

  // Set messages for a specific session (allows saving to a session other than current)
  // This is used when a background request completes after the user has switched sessions
  const setMessagesForSession = useCallback(async (sessionId: string, messages: ChatMessage[]) => {
    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (same pattern as setMessages)
    const currentSessions = sessionsRef.current;
    const now = Date.now();

    // Pre-compute session messages for consistency
    const sessionMessages = messages.map((m, idx) => ({
      id: generateMessageId(),
      role: m.role as 'user' | 'assistant' | 'tool',
      content: m.content || '',
      timestamp: typeof m.timestamp === 'number' && Number.isFinite(m.timestamp)
        ? m.timestamp
        : now + idx,
      toolCalls: m.toolCalls,
      toolResults: m.toolResults,
    }));

    const firstUserMsg = messages.find(m => m.role === 'user');

    const sessionsToSave = currentSessions.map(session => {
      if (session.id !== sessionId) return session;

      // Update title from first user message if needed
      let title = session.title;
      if (title === 'New Chat' && firstUserMsg?.content) {
        title = generateSessionTitle(firstUserMsg.content);
      }

      return {
        ...session,
        title,
        updatedAt: now,
        messages: sessionMessages,
      };
    });

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Use functional update for state
    setSessions(() => sessionsToSave);

    // Queue async save with the pre-computed sessions array
    queueSave(async () => {
      await saveSessions(sessionsToSave);
    });
  }, [queueSave]);

  // Set the server-side conversation ID for the current session (fixes #501)
  const setServerConversationId = useCallback(async (serverConversationId: string) => {
    if (!currentSessionId) return;

    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (same pattern as createNewSession/deleteSession)
    const currentSessions = sessionsRef.current;
    const targetSessionId = currentSessionId;
    const now = Date.now();

    const sessionsToSave = currentSessions.map(session => {
      if (session.id !== targetSessionId) return session;
      return {
        ...session,
        serverConversationId,
        updatedAt: now,
      };
    });

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Use functional update for state - return the pre-computed sessionsToSave directly
    // to guarantee state matches what we're saving (same pattern as addMessage)
    setSessions(() => sessionsToSave);

    // Queue async save with the pre-computed sessions array (serialized with other operations)
    queueSave(async () => {
      await saveSessions(sessionsToSave);
    });
  }, [currentSessionId, queueSave]);

  // Set the server-side conversation ID for a specific session (allows saving to a session other than current)
  // This is used when a background request completes after the user has switched sessions
  const setServerConversationIdForSession = useCallback(async (sessionId: string, serverConversationId: string) => {
    // Compute the new sessions array BEFORE setSessions to guarantee the value we save
    // is exactly what we intend to set (same pattern as setServerConversationId)
    const currentSessions = sessionsRef.current;
    const now = Date.now();

    const sessionsToSave = currentSessions.map(session => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        serverConversationId,
        updatedAt: now,
      };
    });

    // Update ref synchronously so any subsequent operations see the new state immediately
    sessionsRef.current = sessionsToSave;

    // Use functional update for state - return the pre-computed sessionsToSave directly
    // to guarantee state matches what we're saving (same pattern as addMessage)
    setSessions(() => sessionsToSave);

    // Queue async save with the pre-computed sessions array (serialized with other operations)
    queueSave(async () => {
      await saveSessions(sessionsToSave);
    });
  }, [queueSave]);

  // Get the server-side conversation ID for the current session
  const getServerConversationId = useCallback((): string | undefined => {
    const session = getCurrentSession();
    return session?.serverConversationId;
  }, [getCurrentSession]);

  // Find a session by its server-side conversation ID (for notification deep linking)
  const findSessionByServerConversationId = useCallback((serverConversationId: string): Session | null => {
    const sessions = sessionsRef.current;
    return sessions.find(s => s.serverConversationId === serverConversationId) || null;
  }, []);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false); // Non-state lock to guarantee mutual exclusion
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Sync sessions with server
  const syncWithServer = useCallback(async (client: SettingsApiClient): Promise<SyncResult> => {
    // Use ref for synchronous check to prevent race conditions between rapid invocations
    if (isSyncingRef.current) {
      return { pulled: 0, pushed: 0, updated: 0, errors: ['Sync already in progress'] };
    }
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      // Take snapshot before async operations
      const snapshotSessions = sessionsRef.current;
      const { result, sessions: syncedSessions } = await syncConversations(client, snapshotSessions);

      // Only update if there were actual changes
      if (result.pulled > 0 || result.pushed > 0 || result.updated > 0) {
        // Smart merge: preserve any local changes that occurred during sync
        const currentSessions = sessionsRef.current;
        const syncedById = new Map(syncedSessions.map(s => [s.id, s]));
        const snapshotById = new Map(snapshotSessions.map(s => [s.id, s]));

        // Build merged result
        const mergedSessions: Session[] = [];
        const seenIds = new Set<string>();

        // First, process current sessions - preserve if modified during sync
        for (const current of currentSessions) {
          seenIds.add(current.id);
          const snapshot = snapshotById.get(current.id);
          const synced = syncedById.get(current.id);

          // If session was modified locally during sync (updatedAt changed since snapshot), keep current version
          if (snapshot && current.updatedAt > snapshot.updatedAt) {
            mergedSessions.push(current);
          } else if (synced) {
            // Session wasn't modified during sync, use synced version
            mergedSessions.push(synced);
          } else {
            // Session exists in current but not in synced (e.g., newly created during sync)
            mergedSessions.push(current);
          }
        }

        // Add any new sessions from sync that don't exist in current
        // Collect all new sessions first, then add at once to preserve their relative order
        const newSessionsToAdd: Session[] = [];
        for (const synced of syncedSessions) {
          if (!seenIds.has(synced.id)) {
            newSessionsToAdd.push(synced);
          }
        }
        mergedSessions.unshift(...newSessionsToAdd);

        // Update ref and state
        sessionsRef.current = mergedSessions;
        setSessions(mergedSessions);

        // Queue async save
        queueSave(async () => {
          await saveSessions(mergedSessions);
        });
      }

      setLastSyncResult(result);
      return result;
    } catch (err: any) {
      const errorResult: SyncResult = {
        pulled: 0,
        pushed: 0,
        updated: 0,
        errors: [err.message || 'Unknown sync error'],
      };
      setLastSyncResult(errorResult);
      return errorResult;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [queueSave]);

  // Lazy loading state
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Lazy-load messages for a stub session from server
  const loadSessionMessages = useCallback(async (sessionId: string, client: SettingsApiClient): Promise<{ messages: ChatMessage[]; freshlyFetched: boolean } | null> => {
    const session = sessionsRef.current.find(s => s.id === sessionId);
    if (!session?.serverConversationId) return null;
    // Already has messages - no need to fetch
    if (session.messages.length > 0) return { messages: session.messages, freshlyFetched: false };

    setIsLoadingMessages(true);
    try {
      const result = await fetchFullConversation(client, session.serverConversationId);
      if (!result) return null;

      // Re-check the latest session state after the async fetch; if local messages
      // were added while the request was in-flight (e.g. user sent a message or a
      // sync updated the session), bail out to avoid clobbering newer local data.
      const currentSessions = sessionsRef.current;
      const latestSession = currentSessions.find(s => s.id === sessionId);
      if (latestSession && latestSession.messages.length > 0) {
        return { messages: latestSession.messages, freshlyFetched: false };
      }

      const sessionsToSave = currentSessions.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          title: result.title,
          updatedAt: result.updatedAt,
          messages: result.messages,
          // Clear serverMetadata since we now have real messages
          serverMetadata: undefined,
        };
      });

      sessionsRef.current = sessionsToSave;
      setSessions(sessionsToSave);

      queueSave(async () => {
        await saveSessions(sessionsToSave);
      });

      return { messages: result.messages, freshlyFetched: true };
    } catch (err: any) {
      console.error('[sessions] Failed to load session messages:', err);
      return null;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [queueSave]);

  return {
    sessions,
    currentSessionId,
    ready,
    deletingSessionIds,
    createNewSession,
    setCurrentSession,
    deleteSession,
    clearAllSessions,
    addMessage,
    getCurrentSession,
    getSessionList,
    setMessages,
    setMessagesForSession,
    setServerConversationId,
    setServerConversationIdForSession,
    getServerConversationId,
    findSessionByServerConversationId,
    syncWithServer,
    isSyncing,
    lastSyncResult,
    loadSessionMessages,
    isLoadingMessages,
  };
}

// Context for session store
export const SessionContext = createContext<SessionStore | null>(null);

export function useSessionContext(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('SessionContext missing');
  return ctx;
}
