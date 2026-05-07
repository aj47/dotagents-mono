import { describe, expect, it, vi } from 'vitest';
import type { Session } from './session';
import {
  applyServerConversationUpdate,
  applyServerConversationMessageLimit,
  appendServerConversationMessage,
  buildNewServerConversation,
  buildBranchedServerConversation,
  buildServerConversationHistoryItem,
  buildNewServerConversationFromUpdateRequest,
  buildServerConversationTitle,
  buildServerConversationDeleteResponse,
  buildServerConversationFullResponse,
  buildServerConversationsDeleteAllResponse,
  buildServerConversationsResponse,
  branchConversationAction,
  createConversationAction,
  createConversationActionService,
  createConversationRouteActions,
  deleteAllConversationsAction,
  deleteConversationAction,
  fetchFullConversation,
  fromServerConversationMessage,
  getConversationAction,
  getConversationsAction,
  getRepresentedServerConversationMessageCount,
  getRepresentedServerConversationMessageSliceCount,
  getStoredServerConversationMessages,
  parseCreateConversationRequestBody,
  parseBranchConversationRequestBody,
  parseUpdateConversationRequestBody,
  renameServerConversationTitle,
  serverConversationToStubSession,
  syncConversations,
  syncServerConversationStorageMetadata,
  toServerConversationHistorySnippet,
  toServerConversationMessage,
  updateConversationAction,
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

  it('builds image-aware conversation titles from shared creation helpers', () => {
    expect(buildServerConversationTitle(undefined, [{
      role: 'user',
      content: '![Screen selection](assets://conversation-image/conv_1/screen.png)',
    }])).toBe('Screen selection');
    expect(buildServerConversationTitle(undefined, [])).toBe('New Conversation');

    const conversation = buildNewServerConversation(
      'conv-image',
      { messages: [{ role: 'user', content: '![](data:image/png;base64,abc)' }] },
      10,
      messageIdFactory,
    );

    expect(conversation.title).toBe('Image');
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
    expect(parseBranchConversationRequestBody({ messageIndex: 1 })).toEqual({
      ok: true,
      request: { messageIndex: 1 },
    });
    expect(parseBranchConversationRequestBody({ messageIndex: 1.5 })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Missing or invalid messageIndex',
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

  it('renames conversation titles with shared normalization and no-op detection', () => {
    const conversation = {
      id: 'conv-title',
      title: 'Old title',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'msg-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
    };

    expect(renameServerConversationTitle(conversation, '  "New title"  ', { maxChars: 80 })).toEqual({
      ok: true,
      conversation,
      title: 'New title',
      changed: true,
    });
    expect(conversation.title).toBe('New title');

    expect(renameServerConversationTitle(conversation, 'New title', { maxChars: 80 })).toEqual({
      ok: true,
      conversation,
      title: 'New title',
      changed: false,
    });

    expect(renameServerConversationTitle(conversation, '   ', { maxChars: 80 })).toEqual({
      ok: false,
      error: 'Missing title',
    });
  });

  it('builds conversation history rows from visible stored history', () => {
    const historyItem = buildServerConversationHistoryItem({
      id: 'conv-history',
      title: 'History',
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2, isSummary: true, summarizedMessageCount: 3 },
        { id: 'display-1', role: 'assistant' as const, content: 'Hidden wrapper', timestamp: 3, toolCalls: [{ name: 'respond_to_user', arguments: { text: 'ignored' } }] },
      ],
      rawMessages: [
        { id: 'raw-1', role: 'user' as const, content: 'first raw', timestamp: 1 },
        { id: 'raw-2', role: 'assistant' as const, content: 'second raw', timestamp: 2 },
      ],
    }, {
      maxLastMessageChars: 20,
      maxPreviewChars: 80,
    });

    expect(historyItem).toEqual({
      id: 'conv-history',
      title: 'History',
      createdAt: 1,
      updatedAt: 2,
      messageCount: 4,
      lastMessage: 'second raw',
      preview: 'user: first raw | assistant: second raw',
    });
  });

  it('normalizes history snippets for compact server lists', () => {
    expect(toServerConversationHistorySnippet('A\n\nB  C', 20)).toBe('A B C');
    expect(toServerConversationHistorySnippet(`${'x'.repeat(25)} trailing`, 10)).toBe(`${'x'.repeat(10)}…`);
    expect(getRepresentedServerConversationMessageCount({
      id: 'conv-count',
      title: 'Count',
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2, isSummary: true, summarizedMessageCount: 5 },
        { id: 'msg-1', role: 'user' as const, content: 'tail', timestamp: 3 },
      ],
      rawMessages: [],
    })).toBe(6);
  });

  it('normalizes conversation storage metadata for raw and compacted histories', () => {
    const emptyRaw: any = {
      id: 'conv-empty-raw',
      title: 'Empty Raw',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'msg-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
      rawMessages: [],
      compaction: {
        rawHistoryPreserved: true,
        representedMessageCount: 1,
      },
    };
    expect(syncServerConversationStorageMetadata(emptyRaw)).toBe(true);
    expect(emptyRaw).not.toHaveProperty('rawMessages');
    expect(emptyRaw).not.toHaveProperty('compaction');

    const legacySummary: any = {
      id: 'conv-legacy-summary',
      title: 'Legacy Summary',
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2, isSummary: true, summarizedMessageCount: 4 },
        { id: 'tail-1', role: 'user' as const, content: 'tail', timestamp: 3 },
      ],
    };
    expect(syncServerConversationStorageMetadata(legacySummary)).toBe(true);
    expect(legacySummary.compaction).toEqual({
      rawHistoryPreserved: false,
      storedRawMessageCount: undefined,
      representedMessageCount: 5,
      partialReason: 'legacy_summary_without_raw_messages',
    });

    const rawWithoutSummary: any = {
      id: 'conv-raw',
      title: 'Raw',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'msg-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
      rawMessages: [{ id: 'raw-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
      compaction: {
        rawHistoryPreserved: true,
        representedMessageCount: 99,
        summary: 'stale',
        summarizedMessageCount: 10,
      },
    };
    expect(syncServerConversationStorageMetadata(rawWithoutSummary)).toBe(true);
    expect(rawWithoutSummary.compaction).toEqual({
      rawHistoryPreserved: true,
      storedRawMessageCount: 1,
      representedMessageCount: 1,
      partialReason: undefined,
    });
    expect(syncServerConversationStorageMetadata(rawWithoutSummary)).toBe(false);
  });

  it('limits loaded conversation messages without returning raw history payloads', () => {
    const limited = applyServerConversationMessageLimit({
      id: 'conv-limit',
      title: 'Limit',
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 1, isSummary: true, summarizedMessageCount: 3 },
        { id: 'msg-1', role: 'user' as const, content: 'Middle', timestamp: 2 },
        { id: 'msg-2', role: 'assistant' as const, content: 'Answer', timestamp: 3 },
        { id: 'msg-3', role: 'user' as const, content: 'Follow up', timestamp: 4 },
      ],
      rawMessages: [
        { id: 'raw-1', role: 'user' as const, content: 'raw 1', timestamp: 1 },
      ],
    }, 2);

    expect(limited.messages.map((message) => message.content)).toEqual(['Answer', 'Follow up']);
    expect(limited).not.toHaveProperty('rawMessages');
    expect(limited.messageOffset).toBe(2);
    expect(limited.totalMessageCount).toBe(4);
    expect(limited.branchMessageIndexOffset).toBe(4);
    expect(getRepresentedServerConversationMessageSliceCount([
      { id: 'summary-1', role: 'assistant', content: 'Summary', timestamp: 1, isSummary: true, summarizedMessageCount: 0 },
    ])).toBe(1);
  });

  it('appends messages and updates compacted raw history consistently', () => {
    const conversation = {
      id: 'conv-append',
      title: 'Append',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2 }],
      rawMessages: [{ id: 'raw-1', role: 'user' as const, content: 'first', timestamp: 1 }],
    };

    const result = appendServerConversationMessage(conversation, {
      id: 'msg-new',
      role: 'assistant',
      content: 'answer',
      displayContent: '<think>hidden</think>\n\nanswer',
      timestamp: 5,
    });

    expect(result.appended).toBe(true);
    expect(conversation.updatedAt).toBe(5);
    expect(conversation.messages.map((message) => message.id)).toEqual(['summary-1', 'msg-new']);
    expect(conversation.rawMessages?.map((message) => message.id)).toEqual(['raw-1', 'msg-new']);
    expect(conversation.rawMessages?.[1]).toBe(conversation.messages[1]);
    expect(conversation.messages[1].displayContent).toBe('<think>hidden</think>\n\nanswer');
  });

  it('deduplicates consecutive appended messages while refreshing display content', () => {
    const conversation = {
      id: 'conv-duplicate',
      title: 'Duplicate',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'display-last', role: 'assistant' as const, content: 'answer', timestamp: 2 }],
      rawMessages: [{ id: 'raw-last', role: 'assistant' as const, content: 'answer', timestamp: 2 }],
    };

    const result = appendServerConversationMessage(conversation, {
      id: 'ignored-new-id',
      role: 'assistant',
      content: ' answer ',
      displayContent: 'visible answer',
      timestamp: 8,
    });

    expect(result.appended).toBe(false);
    expect(result.message.id).toBe('raw-last');
    expect(conversation.updatedAt).toBe(8);
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.rawMessages).toHaveLength(1);
    expect(conversation.messages[0].displayContent).toBe('visible answer');
    expect(conversation.rawMessages?.[0].displayContent).toBe('visible answer');
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

  it('creates conversation action services from persistence adapters', async () => {
    const conversation = {
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'msg-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
    };
    const conversations = [{
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messageCount: 1,
      lastMessage: 'hello',
      preview: 'hello',
    }];
    const saved: Array<{ conversationId: string; preserveTimestamp: boolean }> = [];
    const deleted: string[] = [];
    let allDeleted = false;
    const service = createConversationActionService({
      service: {
        loadConversation: async (conversationId: string) => conversationId === conversation.id ? conversation : null,
        getConversationHistory: async () => conversations,
        saveConversation: async (nextConversation: typeof conversation, preserveTimestamp: boolean) => {
          saved.push({ conversationId: nextConversation.id, preserveTimestamp });
        },
        deleteConversation: async (conversationId: string) => {
          deleted.push(conversationId);
        },
        deleteAllConversations: async () => {
          allDeleted = true;
        },
      },
      generateConversationId: () => 'conv-new',
      validateConversationId: () => null,
      now: () => 10,
    });

    await expect(service.loadConversation('conv-1')).resolves.toBe(conversation);
    await expect(service.getConversationHistory()).resolves.toBe(conversations);
    expect(service.generateConversationId()).toBe('conv-new');
    expect(service.validateConversationId('conv-1')).toBeNull();
    expect(service.getTimestamp()).toBe(10);
    await service.saveConversation(conversation, true);
    expect(saved).toEqual([{ conversationId: 'conv-1', preserveTimestamp: true }]);
    await service.deleteConversation('conv-1');
    expect(deleted).toEqual(['conv-1']);
    await service.deleteAllConversations();
    expect(allDeleted).toBe(true);
  });

  it('runs shared conversation sync actions through service adapters', async () => {
    const conversations = [{
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messageCount: 1,
      lastMessage: 'hello',
      preview: 'hello',
    }];
    const fullConversation = {
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'msg-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
      metadata: { model: 'test' },
    };
    const savedConversations = new Map([[fullConversation.id, fullConversation]]);
    const generatedConversationIds = ['conv-new', 'conv-branch'];
    const changed = vi.fn();
    const logs: unknown[] = [];
    const options = {
      service: {
        loadConversation: async (conversationId: string) => savedConversations.get(conversationId),
        getConversationHistory: async () => conversations,
        generateConversationId: () => generatedConversationIds.shift() ?? 'conv-extra',
        validateConversationId: () => null,
        getTimestamp: () => 10,
        saveConversation: async (conversation: typeof fullConversation) => {
          savedConversations.set(conversation.id, conversation);
        },
        deleteConversation: async (conversationId: string) => {
          savedConversations.delete(conversationId);
        },
        deleteAllConversations: async () => {
          savedConversations.clear();
        },
      },
      diagnostics: {
        logInfo: (source: string, message: string) => logs.push({ level: 'info', source, message }),
        logError: () => {
          throw new Error('unexpected diagnostics log');
        },
      },
    };

    await expect(getConversationsAction(options)).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationsResponse(conversations),
    });
    await expect(getConversationAction('conv-1', options)).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationFullResponse(fullConversation, { includeMetadata: true }),
    });
    await expect(createConversationAction({
      messages: [{ role: 'user', content: 'new conversation' }],
    }, changed, options)).resolves.toMatchObject({
      statusCode: 201,
      body: {
        id: 'conv-new',
        title: 'new conversation',
        messages: [{ role: 'user', content: 'new conversation', timestamp: 10 }],
      },
    });
    await expect(updateConversationAction('conv-1', {
      title: 'Updated',
      messages: [{ role: 'assistant', content: 'updated reply' }],
    }, changed, options)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        id: 'conv-1',
        title: 'Updated',
        messages: [{ role: 'assistant', content: 'updated reply', timestamp: 10 }],
      },
    });
    await expect(branchConversationAction('conv-1', {
      messageIndex: 0,
    }, changed, options)).resolves.toMatchObject({
      statusCode: 201,
      body: {
        id: 'conv-branch',
        title: 'Branch: Updated',
        messages: [{ role: 'assistant', content: 'updated reply', timestamp: 10 }],
      },
    });
    expect(savedConversations.get('conv-branch')?.branchSource).toEqual({
      sourceConversationId: 'conv-1',
      sourceMessageIndex: 0,
      branchedAt: 10,
    });
    await expect(deleteConversationAction('conv-1', changed, options)).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationDeleteResponse('conv-1'),
    });
    savedConversations.set(fullConversation.id, fullConversation);
    await expect(deleteAllConversationsAction(changed, options)).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationsDeleteAllResponse(),
    });
    expect(changed).toHaveBeenCalledTimes(5);
    expect(logs).toEqual([
      { level: 'info', source: 'conversation-actions', message: 'Listed 1 conversations' },
      { level: 'info', source: 'conversation-actions', message: 'Fetched conversation conv-1 for recovery' },
      { level: 'info', source: 'conversation-actions', message: 'Created conversation conv-new with 1 messages' },
      { level: 'info', source: 'conversation-actions', message: 'Updated conversation conv-1' },
      { level: 'info', source: 'conversation-actions', message: 'Branched conversation conv-1 at message 0 -> conv-branch' },
      { level: 'info', source: 'conversation-actions', message: 'Deleted conversation conv-1' },
      { level: 'info', source: 'conversation-actions', message: 'Deleted all conversations' },
    ]);
  });

  it('creates conversation route actions that delegate through service adapters', async () => {
    const conversations = [{
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messageCount: 1,
      lastMessage: 'hello',
      preview: 'hello',
    }];
    const fullConversation = {
      id: 'conv-1',
      title: 'Server Chat',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'msg-1', role: 'user' as const, content: 'hello', timestamp: 2 }],
      metadata: { model: 'test' },
    };
    const savedConversations = new Map([[fullConversation.id, fullConversation]]);
    const generatedConversationIds = ['conv-new', 'conv-branch'];
    const changed = vi.fn();
    const options = {
      service: {
        loadConversation: async (conversationId: string) => savedConversations.get(conversationId),
        getConversationHistory: async () => conversations,
        generateConversationId: () => generatedConversationIds.shift() ?? 'conv-extra',
        validateConversationId: () => null,
        getTimestamp: () => 10,
        saveConversation: async (conversation: typeof fullConversation) => {
          savedConversations.set(conversation.id, conversation);
        },
        deleteConversation: async (conversationId: string) => {
          savedConversations.delete(conversationId);
        },
        deleteAllConversations: async () => {
          savedConversations.clear();
        },
      },
      diagnostics: {
        logInfo: () => undefined,
        logError: () => {
          throw new Error('unexpected diagnostics log');
        },
      },
    };
    const routeActions = createConversationRouteActions(options);

    await expect(routeActions.getConversations()).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationsResponse(conversations),
    });
    await expect(routeActions.getConversation('conv-1')).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationFullResponse(fullConversation, { includeMetadata: true }),
    });
    await expect(routeActions.createConversation({
      messages: [{ role: 'user', content: 'new conversation' }],
    }, changed)).resolves.toMatchObject({
      statusCode: 201,
      body: {
        id: 'conv-new',
        title: 'new conversation',
      },
    });
    await expect(routeActions.updateConversation('conv-1', {
      title: 'Updated',
    }, changed)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        id: 'conv-1',
        title: 'Updated',
      },
    });
    await expect(routeActions.branchConversation('conv-1', {
      messageIndex: 0,
    }, changed)).resolves.toMatchObject({
      statusCode: 201,
      body: {
        id: 'conv-branch',
        title: 'Branch: Updated',
      },
    });
    await expect(routeActions.deleteConversation('conv-1', changed)).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationDeleteResponse('conv-1'),
    });
    await expect(routeActions.deleteAllConversations(changed)).resolves.toEqual({
      statusCode: 200,
      body: buildServerConversationsDeleteAllResponse(),
    });
    expect(changed).toHaveBeenCalledTimes(5);
  });

  it('branches raw conversation history when compacted messages carry raw messages', async () => {
    expect(getStoredServerConversationMessages({
      id: 'conv-compact',
      title: 'Compacted Chat',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2 }],
      rawMessages: [
        { id: 'raw-1', role: 'user' as const, content: 'first', timestamp: 1 },
        { id: 'raw-2', role: 'assistant' as const, content: 'second', timestamp: 2 },
      ],
    }).map((message) => message.content)).toEqual(['first', 'second']);

    const directBuild = buildBranchedServerConversation({
      id: 'conv-compact',
      title: 'Compacted Chat',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2 }],
      rawMessages: [
        { id: 'raw-1', role: 'user' as const, content: 'first', timestamp: 1 },
        { id: 'raw-2', role: 'assistant' as const, content: 'second', timestamp: 2 },
      ],
    }, {
      sourceConversationId: 'conv-compact',
      conversationId: 'conv-direct-branch',
      messageIndex: 1,
      timestamp: 10,
      messageIdFactory: (_timestamp, index) => `direct-${index}`,
    });
    expect(directBuild).toMatchObject({
      ok: true,
      conversation: {
        id: 'conv-direct-branch',
        messages: [
          { id: 'direct-0', role: 'user', content: 'first', timestamp: 1 },
          { id: 'direct-1', role: 'assistant', content: 'second', timestamp: 2 },
        ],
      },
    });

    const changed = vi.fn();
    const savedConversations = new Map([[
      'conv-compact',
      {
        id: 'conv-compact',
        title: 'Compacted Chat',
        createdAt: 1,
        updatedAt: 2,
        messages: [{ id: 'summary-1', role: 'assistant' as const, content: 'Summary', timestamp: 2 }],
        rawMessages: [
          { id: 'raw-1', role: 'user' as const, content: 'first', timestamp: 1 },
          { id: 'raw-2', role: 'assistant' as const, content: 'second', timestamp: 2 },
        ],
      },
    ]]);
    const options = {
      service: {
        loadConversation: async (conversationId: string) => savedConversations.get(conversationId),
        getConversationHistory: async () => [],
        generateConversationId: () => 'conv-branch',
        validateConversationId: () => null,
        getTimestamp: () => 10,
        saveConversation: async (conversation: any) => {
          savedConversations.set(conversation.id, conversation);
        },
        deleteConversation: async () => undefined,
        deleteAllConversations: async () => undefined,
      },
      diagnostics: {
        logInfo: () => undefined,
        logError: () => {
          throw new Error('unexpected diagnostics log');
        },
      },
    };

    await expect(branchConversationAction('conv-compact', {
      messageIndex: 1,
    }, changed, options)).resolves.toMatchObject({
      statusCode: 201,
      body: {
        id: 'conv-branch',
        title: 'Branch: Compacted Chat',
        messages: [
          { role: 'user', content: 'first', timestamp: 1 },
          { role: 'assistant', content: 'second', timestamp: 2 },
        ],
      },
    });
  });

  it('returns shared conversation sync validation and not-found errors', async () => {
    const changed = vi.fn();
    const options = {
      service: {
        loadConversation: async () => null,
        getConversationHistory: async () => [],
        generateConversationId: () => 'conv-new',
        validateConversationId: (conversationId: string) =>
          conversationId === 'bad/id' ? 'Invalid conversation ID format' : null,
        getTimestamp: () => 10,
        saveConversation: async () => undefined,
        deleteConversation: async () => undefined,
        deleteAllConversations: async () => undefined,
      },
      diagnostics: {
        logInfo: () => {
          throw new Error('unexpected info log');
        },
        logError: () => {
          throw new Error('unexpected error log');
        },
      },
    };

    await expect(getConversationAction(undefined, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Missing or invalid conversation ID' },
    });
    await expect(getConversationAction('bad/id', options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Invalid conversation ID format' },
    });
    await expect(getConversationAction('missing', options)).resolves.toEqual({
      statusCode: 404,
      body: { error: 'Conversation not found' },
    });
    await expect(createConversationAction({}, changed, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Missing or invalid messages array' },
    });
    await expect(updateConversationAction('missing', {}, changed, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Conversation not found and no messages provided to create it' },
    });
    await expect(branchConversationAction('missing', { messageIndex: 0 }, changed, options)).resolves.toEqual({
      statusCode: 404,
      body: { error: 'Conversation not found' },
    });
    await expect(branchConversationAction('missing', { messageIndex: 'bad' }, changed, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Missing or invalid messageIndex' },
    });
    await expect(deleteConversationAction('missing', changed, options)).resolves.toEqual({
      statusCode: 404,
      body: { error: 'Conversation not found' },
    });
    expect(changed).not.toHaveBeenCalled();
  });

  it('logs shared conversation sync failures and returns route errors', async () => {
    const caughtFailure = new Error('storage failed');
    const loggedErrors: unknown[] = [];
    const options = {
      service: {
        loadConversation: async () => {
          throw caughtFailure;
        },
        getConversationHistory: async () => [],
        generateConversationId: () => 'conv-new',
        validateConversationId: () => null,
        getTimestamp: () => 10,
        saveConversation: async () => undefined,
        deleteConversation: async () => undefined,
        deleteAllConversations: async () => undefined,
      },
      diagnostics: {
        logInfo: () => undefined,
        logError: (source: string, message: string, caughtError: unknown) => {
          loggedErrors.push({ source, message, caughtError });
        },
      },
    };

    await expect(getConversationAction('conv-1', options)).resolves.toEqual({
      statusCode: 500,
      body: { error: 'storage failed' },
    });
    expect(loggedErrors).toEqual([
      {
        source: 'conversation-actions',
        message: 'Failed to fetch conversation',
        caughtError: caughtFailure,
      },
    ]);
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
