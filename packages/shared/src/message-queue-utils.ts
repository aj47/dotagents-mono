import type { MessageQueue, QueuedMessage } from './types';
import type {
  OperatorMessageQueueSummary,
  OperatorMessageQueuesResponse,
} from './api-types';

export type { MessageQueue, QueuedMessage } from './types';

export type MessageQueueMap = Map<string, QueuedMessage[]>;

export interface MessageQueueMutationResult {
  ok: boolean;
  queues: MessageQueueMap;
  message?: QueuedMessage;
  index?: number;
  reason?: 'not_found' | 'processing' | 'added_to_history' | 'not_failed';
  resetFailedToPending?: boolean;
}

export interface BuildQueuedMessageParams {
  id: string;
  conversationId: string;
  text: string;
  createdAt?: number;
  sessionId?: string;
}

export function buildQueuedMessage(params: BuildQueuedMessageParams): QueuedMessage {
  return {
    id: params.id,
    conversationId: params.conversationId,
    sessionId: params.sessionId,
    text: params.text,
    createdAt: params.createdAt ?? Date.now(),
    status: 'pending',
  };
}

export function getQueuedMessages(queues: MessageQueueMap, conversationId: string): QueuedMessage[] {
  return [...(queues.get(conversationId) ?? [])];
}

export function getAllMessageQueues(queues: MessageQueueMap): MessageQueue[] {
  const result: MessageQueue[] = [];
  queues.forEach((messages, conversationId) => {
    if (messages.length > 0) {
      result.push({ conversationId, messages: [...messages] });
    }
  });
  return result;
}

export function buildOperatorMessageQueuesResponse(
  queues: Array<MessageQueue & { isPaused?: boolean }>,
): OperatorMessageQueuesResponse {
  const responseQueues: OperatorMessageQueueSummary[] = queues.map((queue) => ({
    conversationId: queue.conversationId,
    isPaused: queue.isPaused ?? false,
    messageCount: queue.messages.length,
    messages: [...queue.messages],
  }));

  return {
    count: responseQueues.length,
    totalMessages: responseQueues.reduce((sum, queue) => sum + queue.messageCount, 0),
    queues: responseQueues,
  };
}

export function getOperatorMessageQueueTotalMessageCount(
  queues: readonly Pick<OperatorMessageQueueSummary, 'messageCount'>[],
): number {
  return queues.reduce((sum, queue) => sum + queue.messageCount, 0);
}

export function hasQueuedMessages(queues: MessageQueueMap, conversationId: string): boolean {
  return (queues.get(conversationId)?.length ?? 0) > 0;
}

export function isQueuedMessagePending(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'pending';
}

export function isQueuedMessageProcessing(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'processing';
}

export function isQueuedMessageFailed(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'failed';
}

export function isQueuedMessageCancelled(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'cancelled';
}

export function canMutateQueuedMessage(message: Pick<QueuedMessage, 'status'>): boolean {
  return !isQueuedMessageProcessing(message);
}

export function canEditQueuedMessage(message: Pick<QueuedMessage, 'status' | 'addedToHistory'>): boolean {
  return canMutateQueuedMessage(message) && !message.addedToHistory;
}

export function hasProcessingQueuedMessage(messages: readonly Pick<QueuedMessage, 'status'>[]): boolean {
  return messages.some(isQueuedMessageProcessing);
}

export function getQueuedMessageStatusLabel(message: Pick<QueuedMessage, 'status'>): string {
  if (isQueuedMessageFailed(message)) return 'Failed';
  if (isQueuedMessageProcessing(message)) return 'Processing...';
  if (isQueuedMessageCancelled(message)) return 'Cancelled';
  return 'Queued';
}

export function formatQueuedMessageSummary(message: Pick<QueuedMessage, 'status' | 'text'>): string {
  return `${getQueuedMessageStatusLabel(message)}: ${message.text}`;
}

function setConversationQueue(
  queues: MessageQueueMap,
  conversationId: string,
  queue: QueuedMessage[],
): MessageQueueMap {
  const nextQueues = new Map(queues);
  if (queue.length === 0) {
    nextQueues.delete(conversationId);
  } else {
    nextQueues.set(conversationId, queue);
  }
  return nextQueues;
}

function findQueuedMessage(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): { queue: QueuedMessage[]; message: QueuedMessage; index: number } | null {
  const queue = queues.get(conversationId);
  if (!queue) return null;

  const index = queue.findIndex((message) => message.id === messageId);
  if (index === -1) return null;

  return { queue, message: queue[index], index };
}

function replaceQueuedMessage(
  queues: MessageQueueMap,
  conversationId: string,
  queue: QueuedMessage[],
  index: number,
  message: QueuedMessage,
): MessageQueueMap {
  const nextQueue = [...queue];
  nextQueue[index] = message;
  return setConversationQueue(queues, conversationId, nextQueue);
}

function removeQueuedMessageAtIndex(
  queues: MessageQueueMap,
  conversationId: string,
  queue: QueuedMessage[],
  index: number,
): MessageQueueMap {
  return setConversationQueue(
    queues,
    conversationId,
    queue.filter((_, queueIndex) => queueIndex !== index),
  );
}

function resetMessageStatusToPending(message: QueuedMessage): QueuedMessage {
  const { errorMessage: _errorMessage, ...messageWithoutError } = message;
  return {
    ...messageWithoutError,
    status: 'pending',
  };
}

export function setOperatorMessageQueueSummaryPaused(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  isPaused: boolean,
): OperatorMessageQueueSummary[] {
  return queues.map((queue) => (
    queue.conversationId === conversationId
      ? { ...queue, isPaused }
      : queue
  ));
}

export function clearOperatorMessageQueueSummary(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
): OperatorMessageQueueSummary[] {
  return queues.filter((queue) => queue.conversationId !== conversationId);
}

export function updateOperatorQueuedMessageSummaryText(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  messageId: string,
  text: string,
): OperatorMessageQueueSummary[] {
  const trimmedText = text.trim();

  return queues.map((queue) => (
    queue.conversationId === conversationId
      ? {
        ...queue,
        messages: queue.messages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          const nextMessage = isQueuedMessageFailed(message)
            ? resetMessageStatusToPending(message)
            : message;

          return {
            ...nextMessage,
            text: trimmedText,
          };
        }),
      }
      : queue
  ));
}

export function retryOperatorQueuedMessageSummary(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  messageId: string,
): OperatorMessageQueueSummary[] {
  return queues.map((queue) => (
    queue.conversationId === conversationId
      ? {
        ...queue,
        messages: queue.messages.map((message) => (
          message.id === messageId
            ? resetMessageStatusToPending(message)
            : message
        )),
      }
      : queue
  ));
}

export function removeOperatorQueuedMessageSummary(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  messageId: string,
): OperatorMessageQueueSummary[] {
  return queues
    .map((queue) => {
      if (queue.conversationId !== conversationId) {
        return queue;
      }

      const messages = queue.messages.filter((message) => message.id !== messageId);
      const removedMessageCount = queue.messages.length - messages.length;

      return {
        ...queue,
        messageCount: Math.max(0, queue.messageCount - removedMessageCount),
        messages,
      };
    })
    .filter((queue) => queue.messageCount > 0);
}

export function enqueueQueuedMessage(
  queues: MessageQueueMap,
  message: QueuedMessage,
): MessageQueueMutationResult {
  const queue = [...(queues.get(message.conversationId) ?? []), message];
  return {
    ok: true,
    queues: setConversationQueue(queues, message.conversationId, queue),
    message,
  };
}

export function removeQueuedMessage(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  if (isQueuedMessageProcessing(found.message)) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'processing' };
  }

  return {
    ok: true,
    queues: removeQueuedMessageAtIndex(queues, conversationId, found.queue, found.index),
    message: found.message,
    index: found.index,
  };
}

export function clearQueuedMessages(
  queues: MessageQueueMap,
  conversationId: string,
): MessageQueueMutationResult {
  const queue = queues.get(conversationId);
  if (!queue) return { ok: true, queues };
  if (hasProcessingQueuedMessage(queue)) {
    return { ok: false, queues, reason: 'processing' };
  }

  return {
    ok: true,
    queues: setConversationQueue(queues, conversationId, []),
  };
}

export function updateQueuedMessageText(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
  text: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  if (isQueuedMessageProcessing(found.message)) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'processing' };
  }
  if (found.message.addedToHistory) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'added_to_history' };
  }

  const resetFailedToPending = isQueuedMessageFailed(found.message);
  const updatedMessage = resetFailedToPending
    ? { ...resetMessageStatusToPending(found.message), text }
    : { ...found.message, text };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
    resetFailedToPending,
  };
}

export function peekNextQueuedMessage(queues: MessageQueueMap, conversationId: string): QueuedMessage | null {
  const firstMessage = queues.get(conversationId)?.[0];
  return firstMessage && isQueuedMessagePending(firstMessage) ? firstMessage : null;
}

export function markQueuedMessageProcessing(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  const updatedMessage: QueuedMessage = { ...found.message, status: 'processing' };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function markQueuedMessageProcessed(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };

  return {
    ok: true,
    queues: removeQueuedMessageAtIndex(queues, conversationId, found.queue, found.index),
    message: found.message,
    index: found.index,
  };
}

export function markQueuedMessageFailed(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
  errorMessage: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  const updatedMessage: QueuedMessage = { ...found.message, status: 'failed', errorMessage };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function markQueuedMessageAddedToHistory(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  const updatedMessage: QueuedMessage = { ...found.message, addedToHistory: true };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function resetQueuedMessageToPending(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  if (!isQueuedMessageFailed(found.message)) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'not_failed' };
  }

  const updatedMessage = resetMessageStatusToPending(found.message);
  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function reorderQueuedMessages(
  queues: MessageQueueMap,
  conversationId: string,
  messageIds: string[],
): MessageQueueMutationResult {
  const queue = queues.get(conversationId);
  if (!queue) return { ok: false, queues, reason: 'not_found' };

  const messageMap = new Map(queue.map((message) => [message.id, message]));
  const newQueue: QueuedMessage[] = [];
  for (const id of messageIds) {
    const message = messageMap.get(id);
    if (message) {
      newQueue.push(message);
      messageMap.delete(id);
    }
  }
  messageMap.forEach((message) => newQueue.push(message));

  return {
    ok: true,
    queues: setConversationQueue(queues, conversationId, newQueue),
  };
}
