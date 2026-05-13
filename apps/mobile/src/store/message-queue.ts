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
  createMessageQueueStore,
  type MessageQueueStore as SharedMessageQueueStore,
} from '@dotagents/shared/message-queue-store';
import {
  type MessageQueue,
  type MessageQueueMap,
  type QueuedMessage,
} from '@dotagents/shared/message-queue-utils';

export interface MessageQueueStore {
  /** Map of conversation ID to queued messages */
  queues: Map<string, QueuedMessage[]>;
  
  /** Add a message to the queue for a conversation */
  enqueue: (conversationId: string, text: string, sessionId?: string) => QueuedMessage;
  
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

  /** Pause queue processing for a conversation */
  pauseQueue: (conversationId: string) => void;

  /** Resume queue processing for a conversation */
  resumeQueue: (conversationId: string) => void;

  /** Check if a conversation queue is paused */
  isQueuePaused: (conversationId: string) => boolean;
  
  /** Check if a conversation has queued messages */
  hasQueuedMessages: (conversationId: string) => boolean;
}

function buildQueueSnapshot(queues: MessageQueue[]): MessageQueueMap {
  return new Map(queues.map((queue) => [queue.conversationId, queue.messages]));
}

export function useMessageQueue(): MessageQueueStore {
  const [queues, setQueues] = useState<MessageQueueMap>(new Map());
  const storeRef = useRef<SharedMessageQueueStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createMessageQueueStore({
      idFactory: () => generateMessageId(),
      onQueueChanged: () => {
        const store = storeRef.current;
        if (!store) return;
        setQueues(buildQueueSnapshot(store.getAllQueues()));
      },
    });
  }

  const queueStore = storeRef.current;

  const enqueue = useCallback((conversationId: string, text: string, sessionId = conversationId): QueuedMessage => {
    const message = queueStore.enqueue(conversationId, text, sessionId);
    console.log('[MessageQueue] Enqueued message:', message.id);
    return message;
  }, [queueStore]);
  
  const getQueue = useCallback((conversationId: string): QueuedMessage[] => {
    return queueStore.getQueue(conversationId);
  }, [queueStore]);
  
  const removeFromQueue = useCallback((conversationId: string, messageId: string): boolean => {
    const result = queueStore.removeFromQueue(conversationId, messageId);
    if (!result.success) return false;

    console.log('[MessageQueue] Removed message:', messageId);
    return true;
  }, [queueStore]);

  const clearQueue = useCallback((conversationId: string): void => {
    const result = queueStore.clearQueue(conversationId);
    if (result.success && result.changed) {
      console.log('[MessageQueue] Cleared queue for:', conversationId);
    }
  }, [queueStore]);

  const updateText = useCallback((conversationId: string, messageId: string, text: string): boolean => {
    return queueStore.updateMessageText(conversationId, messageId, text).success;
  }, [queueStore]);
  
  const peek = useCallback((conversationId: string): QueuedMessage | null => {
    return queueStore.peek(conversationId);
  }, [queueStore]);

  const markProcessing = useCallback((conversationId: string, messageId: string): boolean => {
    return queueStore.markProcessing(conversationId, messageId).success;
  }, [queueStore]);

  const markProcessed = useCallback((conversationId: string, messageId: string): boolean => {
    const result = queueStore.markProcessed(conversationId, messageId);
    if (!result.success) return false;

    console.log('[MessageQueue] Marked processed:', messageId);
    return true;
  }, [queueStore]);

  const markFailed = useCallback((conversationId: string, messageId: string, errorMessage: string): boolean => {
    const result = queueStore.markFailed(conversationId, messageId, errorMessage);
    if (!result.success) return false;

    console.log('[MessageQueue] Marked failed:', messageId, errorMessage);
    return true;
  }, [queueStore]);

  const resetToPending = useCallback((conversationId: string, messageId: string): boolean => {
    const result = queueStore.resetToPending(conversationId, messageId);
    if (!result.success) return false;

    console.log('[MessageQueue] Reset to pending:', messageId);
    return true;
  }, [queueStore]);

  const pauseQueue = useCallback((conversationId: string): void => {
    queueStore.pauseQueue(conversationId);
    console.log('[MessageQueue] Paused queue for:', conversationId);
  }, [queueStore]);

  const resumeQueue = useCallback((conversationId: string): void => {
    queueStore.resumeQueue(conversationId);
    console.log('[MessageQueue] Resumed queue for:', conversationId);
  }, [queueStore]);

  const isQueuePaused = useCallback((conversationId: string): boolean => {
    return queueStore.isQueuePaused(conversationId);
  }, [queueStore]);

  const hasQueuedMessages = useCallback((conversationId: string): boolean => {
    return queueStore.hasQueuedMessages(conversationId);
  }, [queueStore]);

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
    pauseQueue,
    resumeQueue,
    isQueuePaused,
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
