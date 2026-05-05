import { describe, expect, it, vi } from 'vitest';
import type { Session } from './session';
import {
  applyServerConversationUpdate,
  buildNewServerConversation,
  buildNewServerConversationFromUpdateRequest,
  buildServerConversationFullResponse,
  buildServerConversationsResponse,
  fetchFullConversation,
  fromServerConversationMessage,
  parseCreateConversationRequestBody,
  parseUpdateConversationRequestBody,
  serverConversationToStubSession,
  syncConversations,
  toServerConversationMessage,
} from './conversation-sync';

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

describe('conversation sync mapping', () => {
  it('normalizes invalid local roles when converting to server messages', () => {
    expect(toServerConversationMessage({
      id: 'msg-invalid',
      role: 'system' as any,
      content: 'hello',
      timestamp: 0,
    })).toEqual({
      role: 'user',
      content: 'hello',
      timestamp: 0,
      toolCalls: undefined,
      toolResults: undefined,
    });
  });

  it('preserves timestamp=0 when converting server messages', () => {
    const message = fromServerConversationMessage({ role: 'assistant', content: 'hi', timestamp: 0 }, 2);

    expect(message.id).toMatch(/^msg_0_2_/);
    expect(message.role).toBe('assistant');
    expect(message.content).toBe('hi');
    expect(message.timestamp).toBe(0);
  });

  it('truncates lazy stub metadata consistently', () => {
    const stub = serverConversationToStubSession({
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messageCount: 4,
      lastMessage: 'x'.repeat(120),
      preview: 'y'.repeat(220),
    });

    expect(stub.serverConversationId).toBe('conv-1');
    expect(stub.messages).toEqual([]);
    expect(stub.serverMetadata?.lastMessage).toHaveLength(100);
    expect(stub.serverMetadata?.preview).toHaveLength(200);
  });
});

describe('server conversation API helpers', () => {
  const messageIdFactory = (timestamp: number, index: number) => `msg-${timestamp}-${index}`;

  it('parses and builds a new server conversation consistently', () => {
    const parsed = parseCreateConversationRequestBody({
      messages: [
        { role: 'user', content: 'x'.repeat(55), timestamp: 0 },
        { role: 'assistant', content: 'hello' },
      ],
      createdAt: 10,
      updatedAt: 20,
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const conversation = buildNewServerConversation('conv-1', parsed.request, 30, messageIdFactory);
    expect(conversation).toEqual({
      id: 'conv-1',
      title: `${'x'.repeat(50)}...`,
      createdAt: 10,
      updatedAt: 20,
      messages: [
        { id: 'msg-30-0', role: 'user', content: 'x'.repeat(55), timestamp: 0, toolCalls: undefined, toolResults: undefined },
        { id: 'msg-30-1', role: 'assistant', content: 'hello', timestamp: 30, toolCalls: undefined, toolResults: undefined },
      ],
    });
  });

  it('returns route-compatible validation errors for bad create and update bodies', () => {
    expect(parseCreateConversationRequestBody(null)).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Request body must be a JSON object',
    });
    expect(parseCreateConversationRequestBody({ messages: [] })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Missing or invalid messages array',
    });
    expect(parseCreateConversationRequestBody({ messages: [{ role: 'system', content: 'x' }] })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Invalid role in message 0: expected one of user, assistant, tool',
    });
    expect(parseUpdateConversationRequestBody({ messages: 'bad' })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'messages field must be an array',
    });
  });

  it('creates missing conversations from PUT only when messages are present', () => {
    const withoutMessages = buildNewServerConversationFromUpdateRequest('conv-1', {}, 10, messageIdFactory);
    expect(withoutMessages).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Conversation not found and no messages provided to create it',
    });

    const withMessages = buildNewServerConversationFromUpdateRequest(
      'conv-1',
      { messages: [{ role: 'user', content: 'hello' }] },
      10,
      messageIdFactory,
    );
    expect(withMessages).toEqual({
      ok: true,
      conversation: {
        id: 'conv-1',
        title: 'hello',
        createdAt: 10,
        updatedAt: 10,
        messages: [
          { id: 'msg-10-0', role: 'user', content: 'hello', timestamp: 10, toolCalls: undefined, toolResults: undefined },
        ],
      },
    });
  });

  it('applies updates and shapes recovery responses with message ids', () => {
    const updated = applyServerConversationUpdate(
      {
        id: 'conv-1',
        title: 'Old',
        createdAt: 1,
        updatedAt: 2,
        messages: [{ id: 'old-msg', role: 'user', content: 'old', timestamp: 2 }],
        metadata: { model: 'test' },
      },
      { title: 'New', messages: [{ role: 'assistant', content: 'new' }], updatedAt: 5 },
      6,
      messageIdFactory,
    );

    expect(buildServerConversationFullResponse(updated, { includeMetadata: true })).toEqual({
      id: 'conv-1',
      title: 'New',
      createdAt: 1,
      updatedAt: 5,
      messages: [
        { id: 'msg-6-0', role: 'assistant', content: 'new', timestamp: 6, toolCalls: undefined, toolResults: undefined },
      ],
      metadata: { model: 'test' },
    });
  });

  it('builds server conversation list responses', () => {
    const conversations = [{
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messageCount: 3,
      lastMessage: 'last',
      preview: 'preview',
    }];

    expect(buildServerConversationsResponse(conversations)).toEqual({
      conversations,
    });
  });
});

describe('syncConversations', () => {
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
    };

    const localSession = createLocalSession();

    const { result, sessions } = await syncConversations(client, [localSession], {
      pendingCreateSessionIds: new Set([localSession.id]),
    });

    expect(client.createConversation).not.toHaveBeenCalled();
    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);
    expect(sessions).toEqual([localSession]);
  });

  it('creates a server conversation for normal local-only sessions when no pending-create guard is active', async () => {
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
    };

    const localSession = createLocalSession();

    const { result, sessions } = await syncConversations(client, [localSession]);

    expect(client.createConversation).toHaveBeenCalledWith({
      title: 'New Chat',
      messages: [{ role: 'user', content: 'hello', timestamp: 2, toolCalls: undefined, toolResults: undefined }],
      createdAt: 1,
      updatedAt: 2,
    });
    expect(result.pushed).toBe(1);
    expect(sessions[0]?.serverConversationId).toBe('conv-created-by-sync');
  });

  it('fetches full conversation messages for lazy-loaded sessions', async () => {
    const client = {
      getConversation: vi.fn().mockResolvedValue({
        id: 'conv-1',
        title: 'Server Chat',
        createdAt: 1,
        updatedAt: 5,
        messages: [{ role: 'assistant', content: 'Loaded', timestamp: 4 }],
      }),
    };

    const result = await fetchFullConversation(client, 'conv-1');

    expect(client.getConversation).toHaveBeenCalledWith('conv-1');
    expect(result?.title).toBe('Server Chat');
    expect(result?.updatedAt).toBe(5);
    expect(result?.messages[0]?.content).toBe('Loaded');
  });
});
