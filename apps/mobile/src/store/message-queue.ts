/**
 * Message Queue Store for Mobile
 * 
 * Manages a queue of messages to be sent when the agent is busy processing.
 * This is a local-only queue (no persistence) since messages are processed
 * sequentially and cleared after successful send.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { generateMessageId } from '@dotagents/shared/session';
import {
  buildQueuedMessage,
  clearQueuedMessages,
  enqueueQueuedMessage,
  getQueuedMessages,
  hasQueuedMessages as hasMessageQueueItems,
  markQueuedMessageFailed,
  markQueuedMessageProcessed,
  markQueuedMessageProcessing,
  peekNextQueuedMessage,
  removeQueuedMessage,
  resetQueuedMessageToPending,
  updateQueuedMessageText,
  type MessageQueueMap,
  type QueuedMessage,
} from '@dotagents/shared/message-queue-utils';

export interface MessageQueueStore {
  /** Map of conversation ID to queued messages */
  queues: Map<string, QueuedMessage[]>;
  
  /** Add a message to the queue for a conversation */
  enqueue: (conversationId: string, text: string) => QueuedMessage;
  
  /** Get all queued messages for a conversation */
  getQueue: (conversationId: string) => QueuedMessage[];
  
  /** Remove a specific message from the queue */
  removeFromQueue: (conversationId: string, messageId: string) => boolean;
  
  /** Clear all messages for a conversation */
  clearQueue: (conversationId: string) => void;
  
  /** Update the text of a queued message */
  updateText: (conversationId: string, messageId: string, text: string) => boolean;
  
  /** Peek at the next message to process (returns first pending message) */
  peek: (conversationId: string) => QueuedMessage | null;
  
  /** Mark a message as processing */
  markProcessing: (conversationId: string, messageId: string) => boolean;
  
  /** Mark a message as processed and remove it from the queue */
  markProcessed: (conversationId: string, messageId: string) => boolean;
  
  /** Mark a message as failed */
  markFailed: (conversationId: string, messageId: string, errorMessage: string) => boolean;
  
  /** Reset a failed message to pending for retry */
  resetToPending: (conversationId: string, messageId: string) => boolean;
  
  /** Check if a conversation has queued messages */
  hasQueuedMessages: (conversationId: string) => boolean;
}

export function useMessageQueue(): MessageQueueStore {
  const [queues, setQueues] = useState<Map<string, QueuedMessage[]>>(new Map());
  const queuesRef = useRef<Map<string, QueuedMessage[]>>(queues);

  const replaceQueues = useCallback((newValue: MessageQueueMap) => {
    queuesRef.current = newValue;
    setQueues(newValue);
  }, []);

  const enqueue = useCallback((conversationId: string, text: string): QueuedMessage => {
    const message = buildQueuedMessage({
      id: generateMessageId(),
      conversationId,
      text,
      createdAt: Date.now(),
    });
    const result = enqueueQueuedMessage(queuesRef.current, message);
    replaceQueues(result.queues);

    console.log('[MessageQueue] Enqueued message:', message.id);
    return message;
  }, [replaceQueues]);
  
  const getQueue = useCallback((conversationId: string): QueuedMessage[] => {
    return getQueuedMessages(queuesRef.current, conversationId);
  }, []);
  
  const removeFromQueue = useCallback((conversationId: string, messageId: string): boolean => {
    const result = removeQueuedMessage(queuesRef.current, conversationId, messageId);
    if (!result.ok) return false;

    replaceQueues(result.queues);
    console.log('[MessageQueue] Removed message:', messageId);
    return true;
  }, [replaceQueues]);

  const clearQueue = useCallback((conversationId: string): void => {
    const result = clearQueuedMessages(queuesRef.current, conversationId);
    if (result.ok) {
      replaceQueues(result.queues);
      console.log('[MessageQueue] Cleared queue for:', conversationId);
    }
  }, [replaceQueues]);

  const updateText = useCallback((conversationId: string, messageId: string, text: string): boolean => {
    const result = updateQueuedMessageText(queuesRef.current, conversationId, messageId, text);
    if (!result.ok) return false;

    replaceQueues(result.queues);
    return true;
  }, [replaceQueues]);
  
  const peek = useCallback((conversationId: string): QueuedMessage | null => {
    return peekNextQueuedMessage(queuesRef.current, conversationId);
  }, []);

  const markProcessing = useCallback((conversationId: string, messageId: string): boolean => {
    const result = markQueuedMessageProcessing(queuesRef.current, conversationId, messageId);
    if (!result.ok) return false;

    replaceQueues(result.queues);
    return true;
  }, [replaceQueues]);

  const markProcessed = useCallback((conversationId: string, messageId: string): boolean => {
    const result = markQueuedMessageProcessed(queuesRef.current, conversationId, messageId);
    if (!result.ok) return false;

    replaceQueues(result.queues);
    console.log('[MessageQueue] Marked processed:', messageId);
    return true;
  }, [replaceQueues]);

  const markFailed = useCallback((conversationId: string, messageId: string, errorMessage: string): boolean => {
    const result = markQueuedMessageFailed(queuesRef.current, conversationId, messageId, errorMessage);
    if (!result.ok) return false;

    replaceQueues(result.queues);
    console.log('[MessageQueue] Marked failed:', messageId, errorMessage);
    return true;
  }, [replaceQueues]);

  const resetToPending = useCallback((conversationId: string, messageId: string): boolean => {
    const result = resetQueuedMessageToPending(queuesRef.current, conversationId, messageId);
    if (!result.ok) return false;

    replaceQueues(result.queues);
    console.log('[MessageQueue] Reset to pending:', messageId);
    return true;
  }, [replaceQueues]);

  const hasQueuedMessages = useCallback((conversationId: string): boolean => {
    return hasMessageQueueItems(queuesRef.current, conversationId);
  }, []);

  return {
    queues,
    enqueue,
    getQueue,
    removeFromQueue,
    clearQueue,
    updateText,
    peek,
    markProcessing,
    markProcessed,
    markFailed,
    resetToPending,
    hasQueuedMessages,
  };
}

// Context for message queue store
export const MessageQueueContext = createContext<MessageQueueStore | null>(null);

export function useMessageQueueContext(): MessageQueueStore {
  const ctx = useContext(MessageQueueContext);
  if (!ctx) throw new Error('MessageQueueContext missing');
  return ctx;
}
