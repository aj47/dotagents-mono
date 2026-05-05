import { describe, expect, it } from 'vitest';

import {
  buildQueuedMessage,
  buildOperatorMessageQueuesResponse,
  clearQueuedMessages,
  enqueueQueuedMessage,
  getAllMessageQueues,
  getQueuedMessages,
  hasQueuedMessages,
  markQueuedMessageAddedToHistory,
  markQueuedMessageFailed,
  markQueuedMessageProcessed,
  markQueuedMessageProcessing,
  peekNextQueuedMessage,
  removeQueuedMessage,
  reorderQueuedMessages,
  resetQueuedMessageToPending,
  updateQueuedMessageText,
  type MessageQueueMap,
} from './message-queue-utils';

const makeMessage = (id: string, overrides: Partial<ReturnType<typeof buildQueuedMessage>> = {}) =>
  ({
    ...buildQueuedMessage({
      id,
      conversationId: 'conversation-1',
      text: id,
      createdAt: 1000,
    }),
    ...overrides,
  });

describe('message-queue-utils', () => {
  it('enqueues, lists, peeks, and removes messages by conversation', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = enqueueQueuedMessage(queues, makeMessage('msg-2')).queues;

    expect(hasQueuedMessages(queues, 'conversation-1')).toBe(true);
    expect(getQueuedMessages(queues, 'conversation-1').map((message) => message.id)).toEqual(['msg-1', 'msg-2']);
    expect(getAllMessageQueues(queues)).toEqual([
      {
        conversationId: 'conversation-1',
        messages: getQueuedMessages(queues, 'conversation-1'),
      },
    ]);
    expect(buildOperatorMessageQueuesResponse([{
      conversationId: 'conversation-1',
      isPaused: true,
      messages: getQueuedMessages(queues, 'conversation-1'),
    }])).toEqual({
      count: 1,
      totalMessages: 2,
      queues: [{
        conversationId: 'conversation-1',
        isPaused: true,
        messageCount: 2,
        messages: getQueuedMessages(queues, 'conversation-1'),
      }],
    });
    expect(peekNextQueuedMessage(queues, 'conversation-1')?.id).toBe('msg-1');

    const removed = removeQueuedMessage(queues, 'conversation-1', 'msg-1');
    queues = removed.queues;
    expect(removed.ok).toBe(true);
    expect(getQueuedMessages(queues, 'conversation-1').map((message) => message.id)).toEqual(['msg-2']);
  });

  it('blocks remove and clear while a message is processing', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1', { status: 'processing' })).queues;

    expect(removeQueuedMessage(queues, 'conversation-1', 'msg-1')).toMatchObject({
      ok: false,
      reason: 'processing',
    });
    expect(clearQueuedMessages(queues, 'conversation-1')).toMatchObject({
      ok: false,
      reason: 'processing',
    });
    expect(getQueuedMessages(queues, 'conversation-1')).toHaveLength(1);
  });

  it('updates failed message text by resetting it to pending', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1', {
      status: 'failed',
      errorMessage: 'No session available',
    })).queues;

    const updated = updateQueuedMessageText(queues, 'conversation-1', 'msg-1', 'retry text');
    queues = updated.queues;

    expect(updated).toMatchObject({ ok: true, resetFailedToPending: true });
    expect(getQueuedMessages(queues, 'conversation-1')[0]).toMatchObject({
      id: 'msg-1',
      status: 'pending',
      text: 'retry text',
    });
    expect(getQueuedMessages(queues, 'conversation-1')[0].errorMessage).toBeUndefined();
  });

  it('blocks text edits after a message has been added to history', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = markQueuedMessageAddedToHistory(queues, 'conversation-1', 'msg-1').queues;

    expect(updateQueuedMessageText(queues, 'conversation-1', 'msg-1', 'changed')).toMatchObject({
      ok: false,
      reason: 'added_to_history',
    });
  });

  it('moves status through processing, failed, reset, and processed states', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = markQueuedMessageProcessing(queues, 'conversation-1', 'msg-1').queues;
    expect(peekNextQueuedMessage(queues, 'conversation-1')).toBeNull();

    queues = markQueuedMessageFailed(queues, 'conversation-1', 'msg-1', 'timeout').queues;
    expect(getQueuedMessages(queues, 'conversation-1')[0]).toMatchObject({
      status: 'failed',
      errorMessage: 'timeout',
    });

    queues = resetQueuedMessageToPending(queues, 'conversation-1', 'msg-1').queues;
    expect(peekNextQueuedMessage(queues, 'conversation-1')?.id).toBe('msg-1');

    queues = markQueuedMessageProcessed(queues, 'conversation-1', 'msg-1').queues;
    expect(getQueuedMessages(queues, 'conversation-1')).toEqual([]);
  });

  it('reorders known ids first and appends omitted messages in existing order', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = enqueueQueuedMessage(queues, makeMessage('msg-2')).queues;
    queues = enqueueQueuedMessage(queues, makeMessage('msg-3')).queues;

    queues = reorderQueuedMessages(queues, 'conversation-1', ['msg-3', 'missing', 'msg-1']).queues;
    expect(getQueuedMessages(queues, 'conversation-1').map((message) => message.id)).toEqual([
      'msg-3',
      'msg-1',
      'msg-2',
    ]);
  });
});
