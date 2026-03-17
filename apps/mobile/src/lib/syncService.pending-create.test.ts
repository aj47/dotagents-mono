import { describe, expect, it, vi } from 'vitest';

import type { Session } from '../types/session';

import { syncConversations } from './syncService';

function createLocalSession(overrides: Partial<Session> = {}): Session {
  return {
    id: overrides.id ?? 'session-local-1',
    title: overrides.title ?? 'New Chat',
    createdAt: overrides.createdAt ?? 1,
    updatedAt: overrides.updatedAt ?? 2,
    messages: overrides.messages ?? [
      { id: 'msg-1', role: 'user', content: 'hello', timestamp: 2 },
    ],
    serverConversationId: overrides.serverConversationId,
    isPinned: overrides.isPinned,
    isArchived: overrides.isArchived,
    metadata: overrides.metadata,
    serverMetadata: overrides.serverMetadata,
  };
}

describe('syncConversations pending create guard', () => {
  it('does not create or pull duplicate conversations while a new chat request is still linking its conversation id', async () => {
    const client = {
      getConversations: vi.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-chat-created',
            title: 'New Chat',
            createdAt: 10,
            updatedAt: 11,
            messageCount: 1,
            lastMessage: 'hello',
            preview: 'hello',
          },
        ],
      }),
      createConversation: vi.fn(),
      getConversation: vi.fn(),
      updateConversation: vi.fn(),
    } as any;

    const localSession = createLocalSession();

    const { result, sessions } = await syncConversations(client, [localSession], {
      pendingCreateSessionIds: new Set([localSession.id]),
    });

    expect(client.createConversation).not.toHaveBeenCalled();
    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);
    expect(sessions).toEqual([localSession]);
  });

  it('still creates a server conversation for normal local-only sessions when no pending-create guard is active', async () => {
    const client = {
      getConversations: vi.fn().mockResolvedValue({ conversations: [] }),
      createConversation: vi.fn().mockResolvedValue({
        id: 'conv-created-by-sync',
        title: 'New Chat',
        createdAt: 1,
        updatedAt: 3,
        messages: [],
      }),
      getConversation: vi.fn(),
      updateConversation: vi.fn(),
    } as any;

    const localSession = createLocalSession();

    const { result, sessions } = await syncConversations(client, [localSession]);

    expect(client.createConversation).toHaveBeenCalledTimes(1);
    expect(result.pushed).toBe(1);
    expect(sessions[0]?.serverConversationId).toBe('conv-created-by-sync');
  });
})