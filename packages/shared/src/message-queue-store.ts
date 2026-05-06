import {
  buildQueuedMessage,
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
  type MessageQueue,
  type MessageQueueMap,
  type MessageQueueMutationResult,
  type QueuedMessage,
} from './message-queue-utils';

export type MessageQueueStoreMutationReason = NonNullable<MessageQueueMutationResult['reason']>;

export interface MessageQueueStoreMutationActionResult {
  success: boolean;
  changed: boolean;
  reason?: MessageQueueStoreMutationReason;
  message?: QueuedMessage;
  index?: number;
  resetFailedToPending?: boolean;
}

export type MessageQueueResumeResult = {
  success: true;
  conversationId: string;
  processingStarted: boolean;
};

export type MessageQueuePauseResult = {
  success: true;
  conversationId: string;
};

export type QueuedMessageActionResult = {
  success: boolean;
  conversationId: string;
  messageId: string;
  processingStarted: boolean;
};

export interface MessageQueueStoreOptions {
  now?: () => number;
  idFactory?: (createdAt: number) => string;
  onQueueChanged?: (conversationId: string) => void;
}

export interface MessageQueueStore {
  pauseQueue(conversationId: string): void;
  resumeQueue(conversationId: string): void;
  isQueuePaused(conversationId: string): boolean;
  tryAcquireProcessingLock(conversationId: string): boolean;
  releaseProcessingLock(conversationId: string): void;
  isProcessing(conversationId: string): boolean;
  enqueue(conversationId: string, text: string, sessionId?: string): QueuedMessage;
  getQueue(conversationId: string): QueuedMessage[];
  getAllQueues(): MessageQueue[];
  removeFromQueue(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult;
  clearQueue(conversationId: string): MessageQueueStoreMutationActionResult;
  updateMessageText(conversationId: string, messageId: string, newText: string): MessageQueueStoreMutationActionResult;
  peek(conversationId: string): QueuedMessage | null;
  markProcessing(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult;
  markProcessed(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult;
  markFailed(conversationId: string, messageId: string, errorMessage: string): MessageQueueStoreMutationActionResult;
  markAddedToHistory(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult;
  resetToPending(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult;
  reorderQueue(conversationId: string, messageIds: string[]): MessageQueueStoreMutationActionResult;
  hasQueuedMessages(conversationId: string): boolean;
}

function defaultMessageIdFactory(createdAt: number): string {
  return `qmsg_${createdAt}_${Math.random().toString(36).slice(2, 11)}`;
}

function toActionResult(result: MessageQueueMutationResult, changed: boolean): MessageQueueStoreMutationActionResult {
  return {
    success: result.ok,
    changed,
    ...(result.reason ? { reason: result.reason } : {}),
    ...(result.message ? { message: result.message } : {}),
    ...(typeof result.index === 'number' ? { index: result.index } : {}),
    ...(typeof result.resetFailedToPending === 'boolean'
      ? { resetFailedToPending: result.resetFailedToPending }
      : {}),
  };
}

export function buildMessageQueuePauseResult(conversationId: string): MessageQueuePauseResult {
  return {
    success: true,
    conversationId,
  };
}

export function buildMessageQueueResumeResult(
  conversationId: string,
  processingStarted: boolean,
): MessageQueueResumeResult {
  return {
    success: true,
    conversationId,
    processingStarted,
  };
}

export function buildQueuedMessageActionResult(
  conversationId: string,
  messageId: string,
  success: boolean,
  processingStarted: boolean,
): QueuedMessageActionResult {
  return {
    success,
    conversationId,
    messageId,
    processingStarted,
  };
}

export function createMessageQueueStore(options: MessageQueueStoreOptions = {}): MessageQueueStore {
  let queues: MessageQueueMap = new Map();
  const processingConversations = new Set<string>();
  const pausedConversations = new Set<string>();
  const now = options.now ?? Date.now;
  const idFactory = options.idFactory ?? defaultMessageIdFactory;

  function notifyQueueChanged(conversationId: string): void {
    options.onQueueChanged?.(conversationId);
  }

  function applyQueueMutation(
    conversationId: string,
    result: MessageQueueMutationResult,
    options: { notify?: boolean } = {},
  ): MessageQueueStoreMutationActionResult {
    if (!result.ok) {
      return toActionResult(result, false);
    }

    const changed = result.queues !== queues;
    queues = result.queues;
    if (changed && options.notify !== false) {
      notifyQueueChanged(conversationId);
    }

    return toActionResult(result, changed);
  }

  return {
    pauseQueue(conversationId: string): void {
      pausedConversations.add(conversationId);
      notifyQueueChanged(conversationId);
    },

    resumeQueue(conversationId: string): void {
      pausedConversations.delete(conversationId);
      notifyQueueChanged(conversationId);
    },

    isQueuePaused(conversationId: string): boolean {
      return pausedConversations.has(conversationId);
    },

    tryAcquireProcessingLock(conversationId: string): boolean {
      if (pausedConversations.has(conversationId) || processingConversations.has(conversationId)) {
        return false;
      }
      processingConversations.add(conversationId);
      return true;
    },

    releaseProcessingLock(conversationId: string): void {
      processingConversations.delete(conversationId);
    },

    isProcessing(conversationId: string): boolean {
      return processingConversations.has(conversationId);
    },

    enqueue(conversationId: string, text: string, sessionId?: string): QueuedMessage {
      const createdAt = now();
      const message = buildQueuedMessage({
        id: idFactory(createdAt),
        conversationId,
        sessionId,
        text,
        createdAt,
      });
      const result = enqueueQueuedMessage(queues, message);
      queues = result.queues;
      notifyQueueChanged(conversationId);
      return message;
    },

    getQueue(conversationId: string): QueuedMessage[] {
      return getQueuedMessages(queues, conversationId);
    },

    getAllQueues(): MessageQueue[] {
      return getAllMessageQueues(queues);
    },

    removeFromQueue(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, removeQueuedMessage(queues, conversationId, messageId));
    },

    clearQueue(conversationId: string): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, clearQueuedMessages(queues, conversationId));
    },

    updateMessageText(
      conversationId: string,
      messageId: string,
      newText: string,
    ): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, updateQueuedMessageText(queues, conversationId, messageId, newText));
    },

    peek(conversationId: string): QueuedMessage | null {
      return peekNextQueuedMessage(queues, conversationId);
    },

    markProcessing(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, markQueuedMessageProcessing(queues, conversationId, messageId));
    },

    markProcessed(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, markQueuedMessageProcessed(queues, conversationId, messageId));
    },

    markFailed(
      conversationId: string,
      messageId: string,
      errorMessage: string,
    ): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, markQueuedMessageFailed(queues, conversationId, messageId, errorMessage));
    },

    markAddedToHistory(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(
        conversationId,
        markQueuedMessageAddedToHistory(queues, conversationId, messageId),
        { notify: false },
      );
    },

    resetToPending(conversationId: string, messageId: string): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, resetQueuedMessageToPending(queues, conversationId, messageId));
    },

    reorderQueue(conversationId: string, messageIds: string[]): MessageQueueStoreMutationActionResult {
      return applyQueueMutation(conversationId, reorderQueuedMessages(queues, conversationId, messageIds));
    },

    hasQueuedMessages(conversationId: string): boolean {
      return hasQueuedMessages(queues, conversationId);
    },
  };
}
