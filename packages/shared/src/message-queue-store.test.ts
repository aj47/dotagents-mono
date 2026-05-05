import { describe, expect, it } from 'vitest';
import { createMessageQueueStore } from './message-queue-store';

describe('message-queue-store', () => {
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
});
