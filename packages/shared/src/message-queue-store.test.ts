import { describe, expect, it } from 'vitest';
import {
  buildMessageQueuePauseResult,
  buildMessageQueueResumeResult,
  buildQueuedMessageActionResult,
  createMessageQueueStore,
  processQueuedMessagesAction,
  processQueuedMessagesIfConversationIdleAction,
  type ProcessQueuedMessagesIdleActionService,
  type ProcessQueuedMessagesActionService,
} from './message-queue-store';

describe('message-queue-store', () => {
  it('builds shared message queue action result payloads', () => {
    expect(buildMessageQueuePauseResult('conversation-1')).toEqual({
      success: true,
      conversationId: 'conversation-1',
    });
    expect(buildMessageQueueResumeResult('conversation-1', true)).toEqual({
      success: true,
      conversationId: 'conversation-1',
      processingStarted: true,
    });
    expect(buildQueuedMessageActionResult('conversation-1', 'message-1', false, false)).toEqual({
      success: false,
      conversationId: 'conversation-1',
      messageId: 'message-1',
      processingStarted: false,
    });
  });

  it('manages queue state and emits external change notifications', () => {
    const changes: string[] = [];
    const store = createMessageQueueStore({
      now: () => 1000,
      idFactory: (createdAt) => `msg-${createdAt}`,
      onQueueChanged: (conversationId) => changes.push(conversationId),
    });

    const message = store.enqueue('conversation-1', 'hello', 'session-1');
    expect(message).toMatchObject({
      id: 'msg-1000',
      conversationId: 'conversation-1',
      sessionId: 'session-1',
      text: 'hello',
      status: 'pending',
      createdAt: 1000,
    });
    expect(store.getQueue('conversation-1')).toEqual([message]);
    expect(store.getAllQueues()).toEqual([{ conversationId: 'conversation-1', messages: [message] }]);
    expect(store.hasQueuedMessages('conversation-1')).toBe(true);

    store.pauseQueue('conversation-1');
    expect(store.isQueuePaused('conversation-1')).toBe(true);
    expect(store.tryAcquireProcessingLock('conversation-1')).toBe(false);

    store.resumeQueue('conversation-1');
    expect(store.tryAcquireProcessingLock('conversation-1')).toBe(true);
    expect(store.isProcessing('conversation-1')).toBe(true);
    expect(store.tryAcquireProcessingLock('conversation-1')).toBe(false);
    store.releaseProcessingLock('conversation-1');
    expect(store.isProcessing('conversation-1')).toBe(false);

    expect(changes).toEqual(['conversation-1', 'conversation-1', 'conversation-1']);
  });

  it('returns mutation details while preserving queue mutation rules', () => {
    let id = 0;
    const changes: string[] = [];
    const store = createMessageQueueStore({
      now: () => 1000,
      idFactory: () => `msg-${++id}`,
      onQueueChanged: (conversationId) => changes.push(conversationId),
    });

    const message = store.enqueue('conversation-1', 'hello');
    expect(store.markProcessing('conversation-1', message.id)).toMatchObject({
      success: true,
      changed: true,
    });
    expect(store.removeFromQueue('conversation-1', message.id)).toMatchObject({
      success: false,
      changed: false,
      reason: 'processing',
    });

    expect(store.markFailed('conversation-1', message.id, 'timeout')).toMatchObject({
      success: true,
      changed: true,
    });
    expect(store.updateMessageText('conversation-1', message.id, 'retry')).toMatchObject({
      success: true,
      changed: true,
      resetFailedToPending: true,
    });
    expect(store.peek('conversation-1')).toMatchObject({ id: message.id, text: 'retry', status: 'pending' });

    expect(store.markAddedToHistory('conversation-1', message.id)).toMatchObject({
      success: true,
      changed: true,
    });
    expect(store.updateMessageText('conversation-1', message.id, 'blocked')).toMatchObject({
      success: false,
      changed: false,
      reason: 'added_to_history',
    });

    expect(store.resetToPending('conversation-1', message.id)).toMatchObject({
      success: false,
      changed: false,
      reason: 'not_failed',
    });
    expect(changes).toEqual(['conversation-1', 'conversation-1', 'conversation-1', 'conversation-1']);
  });

  it('only emits for clear operations that actually change the queue', () => {
    const changes: string[] = [];
    const store = createMessageQueueStore({
      idFactory: () => 'msg-1',
      onQueueChanged: (conversationId) => changes.push(conversationId),
    });

    expect(store.clearQueue('conversation-1')).toMatchObject({
      success: true,
      changed: false,
    });
    store.enqueue('conversation-1', 'hello');
    expect(store.clearQueue('conversation-1')).toMatchObject({
      success: true,
      changed: true,
    });
    expect(changes).toEqual(['conversation-1', 'conversation-1']);
  });

  it('processes queued messages through injected conversation and session services', async () => {
    const store = createMessageQueueStore({
      idFactory: () => 'msg-1',
    });
    store.enqueue('conversation-1', 'next task', 'preferred-session');

    const logMessages: string[] = [];
    const revived: Array<{ sessionId: string; startSnoozed: boolean }> = [];
    const processed: unknown[] = [];
    const service: ProcessQueuedMessagesActionService = {
      tryAcquireProcessingLock: (conversationId) => store.tryAcquireProcessingLock(conversationId),
      releaseProcessingLock: (conversationId) => store.releaseProcessingLock(conversationId),
      isQueuePaused: (conversationId) => store.isQueuePaused(conversationId),
      peek: (conversationId) => store.peek(conversationId),
      getQueue: (conversationId) => store.getQueue(conversationId),
      markProcessing: (conversationId, messageId) => store.markProcessing(conversationId, messageId).success,
      markAddedToHistory: (conversationId, messageId) => store.markAddedToHistory(conversationId, messageId).success,
      markProcessed: (conversationId, messageId) => store.markProcessed(conversationId, messageId).success,
      markFailed: (conversationId, messageId, errorMessage) => store.markFailed(conversationId, messageId, errorMessage).success,
      addMessageToConversation: async (conversationId, text, role) => ({ conversationId, text, role }),
      isPanelVisible: () => false,
      findSessionByConversationId: () => 'fallback-session',
      getSession: () => ({ status: 'idle' }),
      reviveSession: (sessionId, startSnoozed) => {
        revived.push({ sessionId, startSnoozed });
        return sessionId === 'fallback-session';
      },
      processAgentMode: async (text, conversationId, existingSessionId, startSnoozed) => {
        processed.push({ text, conversationId, existingSessionId, startSnoozed });
      },
    };

    await processQueuedMessagesAction('conversation-1', {
      service,
      diagnostics: {
        logLLM: (message) => { logMessages.push(message); },
      },
    });

    expect(revived).toEqual([
      { sessionId: 'preferred-session', startSnoozed: true },
      { sessionId: 'fallback-session', startSnoozed: true },
    ]);
    expect(processed).toEqual([{
      text: 'next task',
      conversationId: 'conversation-1',
      existingSessionId: 'fallback-session',
      startSnoozed: true,
    }]);
    expect(store.getQueue('conversation-1')).toEqual([]);
    expect(store.isProcessing('conversation-1')).toBe(false);
    expect(logMessages).toContain(
      '[processQueuedMessages] Preferred queued session preferred-session could not be revived, trying fallback lookup',
    );
  });

  it('marks the queued message failed when processing throws and still releases the lock', async () => {
    const store = createMessageQueueStore({
      idFactory: () => 'msg-1',
    });
    store.enqueue('conversation-1', 'next task');

    const service: ProcessQueuedMessagesActionService = {
      tryAcquireProcessingLock: (conversationId) => store.tryAcquireProcessingLock(conversationId),
      releaseProcessingLock: (conversationId) => store.releaseProcessingLock(conversationId),
      isQueuePaused: (conversationId) => store.isQueuePaused(conversationId),
      peek: (conversationId) => store.peek(conversationId),
      getQueue: (conversationId) => store.getQueue(conversationId),
      markProcessing: (conversationId, messageId) => store.markProcessing(conversationId, messageId).success,
      markAddedToHistory: (conversationId, messageId) => store.markAddedToHistory(conversationId, messageId).success,
      markProcessed: (conversationId, messageId) => store.markProcessed(conversationId, messageId).success,
      markFailed: (conversationId, messageId, errorMessage) => store.markFailed(conversationId, messageId, errorMessage).success,
      addMessageToConversation: async () => ({ ok: true }),
      isPanelVisible: () => true,
      findSessionByConversationId: () => undefined,
      getSession: () => undefined,
      reviveSession: () => false,
      processAgentMode: async () => { throw new Error('agent failed'); },
    };

    await processQueuedMessagesAction('conversation-1', {
      service,
      diagnostics: {
        logLLM: () => {},
      },
    });

    expect(store.getQueue('conversation-1')).toEqual([
      expect.objectContaining({
        id: 'msg-1',
        status: 'failed',
        addedToHistory: true,
        errorMessage: 'agent failed',
      }),
    ]);
    expect(store.isProcessing('conversation-1')).toBe(false);
  });

  it('starts queued processing only when the conversation has no active session', () => {
    const logMessages: string[] = [];
    const processed: string[] = [];
    const service: ProcessQueuedMessagesIdleActionService = {
      findSessionByConversationId: () => 'session-1',
      getSession: () => ({ status: 'active' }),
    };

    expect(processQueuedMessagesIfConversationIdleAction(
      'conversation-1',
      'testQueue',
      async (conversationId) => { processed.push(conversationId); },
      {
        service,
        diagnostics: { logLLM: (message) => { logMessages.push(message); } },
      },
    )).toBe(false);

    expect(processed).toEqual([]);

    const idleService = {
      ...service,
      getSession: () => ({ status: 'idle' }),
    };

    expect(processQueuedMessagesIfConversationIdleAction(
      'conversation-1',
      'testQueue',
      async (conversationId) => { processed.push(conversationId); },
      {
        service: idleService,
        diagnostics: { logLLM: (message) => { logMessages.push(message); } },
      },
    )).toBe(true);

    expect(processed).toEqual(['conversation-1']);
  });
});
