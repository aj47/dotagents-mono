import { describe, expect, it } from 'vitest';

import {
  MESSAGE_QUEUE_PANEL_PRESENTATION,
  buildQueuedMessage,
  buildOperatorMessageQueuesResponse,
  clearOperatorMessageQueueSummary,
  clearQueuedMessages,
  enqueueQueuedMessage,
  canEditQueuedMessage,
  canMutateQueuedMessage,
  formatMessageQueueCompactLabel,
  formatMessageQueuePanelTitle,
  formatQueuedMessageError,
  formatQueuedMessageSummary,
  getAllMessageQueues,
  getMessageQueueListToggleLabel,
  getOperatorMessageQueueTotalMessageCount,
  getQueuedMessageItemPresentation,
  getQueuedMessages,
  getQueuedMessageStatusLabel,
  getQueuedMessageExpansionLabel,
  hasProcessingQueuedMessage,
  hasQueuedMessages,
  isQueuedMessageCancelled,
  isQueuedMessageFailed,
  isQueuedMessagePending,
  isQueuedMessageProcessing,
  markQueuedMessageAddedToHistory,
  markQueuedMessageFailed,
  markQueuedMessageProcessed,
  markQueuedMessageProcessing,
  peekNextQueuedMessage,
  removeOperatorQueuedMessageSummary,
  removeQueuedMessage,
  reorderQueuedMessages,
  resetQueuedMessageToPending,
  retryOperatorQueuedMessageSummary,
  setOperatorMessageQueueSummaryPaused,
  updateOperatorQueuedMessageSummaryText,
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

  it('updates operator message queue summaries for optimistic previews', () => {
    const failedMessage = makeMessage('msg-1', {
      status: 'failed',
      errorMessage: 'No session available',
    });
    const processingMessage = makeMessage('msg-2', {
      status: 'processing',
      text: 'running',
    });
    const summaries = [
      {
        conversationId: 'conversation-1',
        isPaused: true,
        messageCount: 2,
        messages: [failedMessage, processingMessage],
      },
      {
        conversationId: 'conversation-2',
        isPaused: false,
        messageCount: 1,
        messages: [
          {
            ...makeMessage('msg-3'),
            conversationId: 'conversation-2',
          },
        ],
      },
    ];

    expect(getOperatorMessageQueueTotalMessageCount(summaries)).toBe(3);
    expect(setOperatorMessageQueueSummaryPaused(summaries, 'conversation-1', false)[0].isPaused).toBe(false);
    expect(clearOperatorMessageQueueSummary(summaries, 'conversation-2')).toHaveLength(1);

    const updated = updateOperatorQueuedMessageSummaryText(summaries, 'conversation-1', 'msg-1', ' retry text ');
    expect(updated[0].messages[0]).toMatchObject({
      id: 'msg-1',
      status: 'pending',
      text: 'retry text',
    });
    expect(updated[0].messages[0].errorMessage).toBeUndefined();

    const retried = retryOperatorQueuedMessageSummary(summaries, 'conversation-1', 'msg-1');
    expect(retried[0].messages[0]).toMatchObject({
      id: 'msg-1',
      status: 'pending',
    });
    expect(retried[0].messages[0].errorMessage).toBeUndefined();

    const removed = removeOperatorQueuedMessageSummary(summaries, 'conversation-1', 'msg-1');
    expect(removed[0]).toMatchObject({
      conversationId: 'conversation-1',
      messageCount: 1,
    });
    expect(removed[0].messages.map((message) => message.id)).toEqual(['msg-2']);
    expect(removeOperatorQueuedMessageSummary(removed, 'conversation-1', 'msg-2')).toEqual([
      summaries[1],
    ]);
  });

  it('blocks remove and clear while a message is processing', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1', { status: 'processing' })).queues;
    const processingMessage = getQueuedMessages(queues, 'conversation-1')[0];

    expect(isQueuedMessageProcessing(processingMessage)).toBe(true);
    expect(hasProcessingQueuedMessage(getQueuedMessages(queues, 'conversation-1'))).toBe(true);
    expect(canMutateQueuedMessage(processingMessage)).toBe(false);
    expect(canEditQueuedMessage(processingMessage)).toBe(false);

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

  it('reports queued message edit and retry eligibility', () => {
    const pendingMessage = makeMessage('msg-1');
    const failedMessage = makeMessage('msg-2', { status: 'failed', errorMessage: 'timeout' });
    const processingMessage = makeMessage('msg-4', { status: 'processing' });
    const cancelledMessage = makeMessage('msg-5', { status: 'cancelled' });
    const addedToHistoryMessage = makeMessage('msg-3', { addedToHistory: true });

    expect(isQueuedMessagePending(pendingMessage)).toBe(true);
    expect(isQueuedMessageFailed(failedMessage)).toBe(true);
    expect(isQueuedMessageCancelled(cancelledMessage)).toBe(true);
    expect(canMutateQueuedMessage(pendingMessage)).toBe(true);
    expect(canEditQueuedMessage(pendingMessage)).toBe(true);
    expect(canEditQueuedMessage(addedToHistoryMessage)).toBe(false);
    expect(getQueuedMessageStatusLabel(pendingMessage)).toBe('Queued');
    expect(getQueuedMessageStatusLabel(processingMessage)).toBe('Processing...');
    expect(getQueuedMessageStatusLabel(failedMessage)).toBe('Failed');
    expect(getQueuedMessageStatusLabel(cancelledMessage)).toBe('Cancelled');
    expect(formatQueuedMessageSummary(failedMessage)).toBe('Failed: msg-2');
  });

  it('formats queue panel presentation copy for desktop and mobile surfaces', () => {
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.longMessagePreviewCharacterLimit).toBe(100);
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.retryAccessibilityLabel).toBe('Retry queued message');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.sendNextLabel).toBe('Send Next');
    expect(formatMessageQueuePanelTitle(2)).toBe('Queued Messages (2)');
    expect(formatMessageQueuePanelTitle(1, true)).toBe('Paused Messages (1)');
    expect(formatMessageQueueCompactLabel(1)).toBe('1 queued message');
    expect(formatMessageQueueCompactLabel(2, true)).toBe('2 queued messages (paused)');
    expect(formatQueuedMessageError('timeout')).toBe('Error: timeout');
    expect(getQueuedMessageExpansionLabel(false)).toBe('More');
    expect(getQueuedMessageExpansionLabel(true)).toBe('Less');
    expect(getMessageQueueListToggleLabel(true)).toBe('Expand queue');
    expect(getMessageQueueListToggleLabel(false)).toBe('Collapse queue');

    expect(getQueuedMessageItemPresentation(makeMessage('msg-1', {
      status: 'failed',
      text: 'x'.repeat(101),
      errorMessage: 'timeout',
    }), false)).toMatchObject({
      isLongMessage: true,
      isFailed: true,
      isProcessing: false,
      canMutateMessage: true,
      canEditMessage: true,
      statusLabel: 'Failed',
      expansionLabel: 'More',
      errorText: 'Error: timeout',
    });
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
