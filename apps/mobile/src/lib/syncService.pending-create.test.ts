import { describe, expect, it, vi } from 'vitest';

import type { Session } from '../types/session';
import { generateSessionTitle } from '../types/session';

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

  it('does not push a mobile first-message fallback title over a better server title', async () => {
    const localSession = createLocalSession({
      title: 'what did you try to do today',
      updatedAt: 200,
      serverConversationId: 'conv-title-generated',
      messages: [
        { id: 'msg-1', role: 'user', content: 'what did you try to do today', timestamp: 100 },
        { id: 'msg-2', role: 'assistant', content: 'We tried to debug hands-free mode.', timestamp: 120 },
      ],
    });
    const client = {
      getConversations: vi.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-title-generated',
            title: 'Debugging Hands-Free Voice Mode',
            createdAt: 1,
            updatedAt: 150,
            messageCount: 2,
            lastMessage: 'We tried to debug hands-free mode.',
            preview: 'what did you try to do today',
          },
        ],
      }),
      createConversation: vi.fn(),
      getConversation: vi.fn(),
      updateConversation: vi.fn().mockResolvedValue({
        id: 'conv-title-generated',
        title: 'Debugging Hands-Free Voice Mode',
        createdAt: 1,
        updatedAt: 201,
        messages: [],
      }),
    } as any;

    const { result, sessions } = await syncConversations(client, [localSession]);

    expect(client.updateConversation).toHaveBeenCalledWith('conv-title-generated', expect.objectContaining({
      title: 'Debugging Hands-Free Voice Mode',
    }));
    expect(result.updated).toBe(1);
    expect(sessions[0]?.title).toBe('Debugging Hands-Free Voice Mode');
  });

  it('keeps an explicit local rename when the local session is newer than the server', async () => {
    const localSession = createLocalSession({
      title: 'My explicit mobile title',
      updatedAt: 200,
      serverConversationId: 'conv-explicit-title',
      messages: [
        { id: 'msg-1', role: 'user', content: 'what did you try to do today', timestamp: 100 },
        { id: 'msg-2', role: 'assistant', content: 'We tried to debug hands-free mode.', timestamp: 120 },
      ],
    });
    const client = {
      getConversations: vi.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-explicit-title',
            title: 'Debugging Hands-Free Voice Mode',
            createdAt: 1,
            updatedAt: 150,
            messageCount: 2,
          },
        ],
      }),
      createConversation: vi.fn(),
      getConversation: vi.fn(),
      updateConversation: vi.fn().mockResolvedValue({
        id: 'conv-explicit-title',
        title: 'My explicit mobile title',
        createdAt: 1,
        updatedAt: 201,
        messages: [],
      }),
    } as any;

    const { sessions } = await syncConversations(client, [localSession]);

    expect(client.updateConversation).toHaveBeenCalledWith('conv-explicit-title', expect.objectContaining({
      title: 'My explicit mobile title',
    }));
    expect(sessions[0]?.title).toBe('My explicit mobile title');
  });

  it('does not preserve a server first-message fallback as if it were generated', async () => {
    const firstMessage = 'can you refresh me on the demo for snyk we discussed today';
    const localSession = createLocalSession({
      title: generateSessionTitle(firstMessage),
      updatedAt: 200,
      serverConversationId: 'conv-fallback-title',
      messages: [
        { id: 'msg-1', role: 'user', content: firstMessage, timestamp: 100 },
        { id: 'msg-2', role: 'assistant', content: 'We discussed the Snyk demo.', timestamp: 120 },
      ],
    });
    const serverFallbackTitle = `${firstMessage.slice(0, 50)}...`;
    const client = {
      getConversations: vi.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-fallback-title',
            title: serverFallbackTitle,
            createdAt: 1,
            updatedAt: 150,
            messageCount: 2,
          },
        ],
      }),
      createConversation: vi.fn(),
      getConversation: vi.fn(),
      updateConversation: vi.fn().mockResolvedValue({
        id: 'conv-fallback-title',
        title: localSession.title,
        createdAt: 1,
        updatedAt: 201,
        messages: [],
      }),
    } as any;

    const { sessions } = await syncConversations(client, [localSession]);

    expect(client.updateConversation).toHaveBeenCalledWith('conv-fallback-title', expect.objectContaining({
      title: localSession.title,
    }));
    expect(sessions[0]?.title).toBe(localSession.title);
  });
})
