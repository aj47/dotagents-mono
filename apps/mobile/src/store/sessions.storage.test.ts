import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../types/session';
import {
  canRefreshServerGeneratedSessionTitle,
  compactSessionsForStorageQuota,
  discardLocalEmptyDraftSessions,
  isStorageQuotaExceededError,
  shouldApplyServerGeneratedSessionTitle,
} from './sessions';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('compactSessionsForStorageQuota', () => {
  it('compacts server-linked sessions into lazy-loadable metadata stubs', () => {
    const sessions: Session[] = [{
      id: 'linked',
      title: 'Linked conversation',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'hello', timestamp: 100 },
        { id: 'm2', role: 'assistant', content: 'large tool-heavy response', timestamp: 200 },
      ],
    }];

    const compacted = compactSessionsForStorageQuota(sessions);

    expect(compacted[0]).toMatchObject({
      id: 'linked',
      serverConversationId: 'conv-1',
      messages: [],
      serverMetadata: {
        messageCount: 2,
        lastMessage: 'large tool-heavy response',
        preview: 'large tool-heavy response',
      },
    });
  });

  it('keeps local-only sessions intact because they cannot be lazy-loaded from the server', () => {
    const sessions: Session[] = [{
      id: 'local',
      title: 'Local draft',
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: 'm1', role: 'user', content: 'not synced yet', timestamp: 100 },
      ],
    }];

    expect(compactSessionsForStorageQuota(sessions)).toEqual(sessions);
  });
});

describe('isStorageQuotaExceededError', () => {
  it('detects Android AsyncStorage SQLite full errors', () => {
    expect(isStorageQuotaExceededError(new Error('database or disk is full (code 13 SQLITE_FULL[13])'))).toBe(true);
  });
});

describe('discardLocalEmptyDraftSessions', () => {
  it('drops empty local-only draft sessions', () => {
    const draft: Session = {
      id: 'draft',
      title: 'New Chat',
      titleSource: 'default',
      createdAt: 100,
      updatedAt: 100,
      messages: [],
    };
    const localWithMessages: Session = {
      id: 'local-with-messages',
      title: 'Unsynced',
      createdAt: 200,
      updatedAt: 220,
      messages: [
        { id: 'm1', role: 'user', content: 'keep me', timestamp: 210 },
      ],
    };
    const serverStub: Session = {
      id: 'server-stub',
      title: 'Server conversation',
      createdAt: 300,
      updatedAt: 320,
      messages: [],
      serverConversationId: 'conv-1',
    };

    expect(discardLocalEmptyDraftSessions([draft, localWithMessages, serverStub])).toEqual([
      localWithMessages,
      serverStub,
    ]);
  });
});

describe('shouldApplyServerGeneratedSessionTitle', () => {
  it('allows a server-generated title to replace an explicit local fallback', () => {
    const session: Session = {
      id: 'session-1',
      title: 'what did we do today',
      titleSource: 'local_generated',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
        { id: 'm2', role: 'assistant', content: 'We debugged hands-free mode.', timestamp: 200 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        'Hands-Free Debugging Recap',
        'server_generated',
      ),
    ).toBe(true);
  });

  it('preserves an explicit local title', () => {
    const session: Session = {
      id: 'session-1',
      title: 'My custom title',
      titleSource: 'manual',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        'Hands-Free Debugging Recap',
        'server_generated',
      ),
    ).toBe(false);
  });

  it('uses explicit fallback provenance instead of title string matching when available', () => {
    const session: Session = {
      id: 'session-1',
      title: 'My custom title',
      titleSource: 'local_generated',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        'Hands-Free Debugging Recap',
        'server_generated',
      ),
    ).toBe(true);
  });

  it('does not let a fallback-sourced server title replace a local fallback', () => {
    const session: Session = {
      id: 'session-1',
      title: 'what did we do today',
      titleSource: 'local_generated',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        'Debugging Recap',
        'local_generated',
      ),
    ).toBe(false);
  });

  it('requires explicit non-fallback server provenance before replacing a local fallback', () => {
    const session: Session = {
      id: 'session-1',
      title: 'what did we do today',
      titleSource: 'local_generated',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        'Hands-Free Debugging Recap',
      ),
    ).toBe(false);
  });

  it('does not infer fallback provenance from matching title text', () => {
    const session: Session = {
      id: 'session-1',
      title: 'what did we do today',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        'Hands-Free Debugging Recap',
        'server_generated',
      ),
    ).toBe(false);
  });
});

describe('canRefreshServerGeneratedSessionTitle', () => {
  it('only refreshes titles for sessions still using a fallback title source', () => {
    const fallbackSession: Session = {
      id: 'session-1',
      title: 'first user message',
      titleSource: 'local_generated',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [],
    };

    const settledSession: Session = {
      ...fallbackSession,
      title: 'Server Title',
      titleSource: 'server_generated',
    };

    expect(canRefreshServerGeneratedSessionTitle(fallbackSession, 'conv-1')).toBe(true);
    expect(canRefreshServerGeneratedSessionTitle(settledSession, 'conv-1')).toBe(false);
    expect(canRefreshServerGeneratedSessionTitle(fallbackSession, 'conv-other')).toBe(false);
  });
});
