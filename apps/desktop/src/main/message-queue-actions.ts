import {
  pauseMessageQueueAction,
  processQueuedMessagesAction,
  processQueuedMessagesIfConversationIdleAction,
  removeQueuedMessageAction,
  resumeMessageQueueAction,
  retryQueuedMessageAction,
  updateQueuedMessageTextAction,
  type MessageQueueRuntimeActionOptions,
  type ProcessQueuedMessagesActionOptions,
  type MessageQueuePauseResult,
  type MessageQueueResumeResult,
  type QueuedMessageActionResult,
} from "@dotagents/shared/message-queue-store"
import { agentSessionTracker } from "./agent-session-tracker"
import { processWithAgentMode } from "./agent-loop-runner"
import { conversationService } from "./conversation-service"
import { logLLM } from "./debug"
import { messageQueueService } from "./message-queue-service"
import { WINDOWS } from "./window"

export type {
  MessageQueuePauseResult,
  MessageQueueResumeResult,
  QueuedMessageActionResult,
}

function createQueuedMessagesActionOptions(): ProcessQueuedMessagesActionOptions {
  return {
    diagnostics: {
      logLLM,
    },
    service: {
      tryAcquireProcessingLock: (conversationId) => messageQueueService.tryAcquireProcessingLock(conversationId),
      releaseProcessingLock: (conversationId) => messageQueueService.releaseProcessingLock(conversationId),
      isQueuePaused: (conversationId) => messageQueueService.isQueuePaused(conversationId),
      peek: (conversationId) => messageQueueService.peek(conversationId),
      getQueue: (conversationId) => messageQueueService.getQueue(conversationId),
      markProcessing: (conversationId, messageId) => messageQueueService.markProcessing(conversationId, messageId),
      markAddedToHistory: (conversationId, messageId) => messageQueueService.markAddedToHistory(conversationId, messageId),
      markProcessed: (conversationId, messageId) => messageQueueService.markProcessed(conversationId, messageId),
      markFailed: (conversationId, messageId, errorMessage) =>
        messageQueueService.markFailed(conversationId, messageId, errorMessage),
      addMessageToConversation: (conversationId, text, role) =>
        conversationService.addMessageToConversation(conversationId, text, role),
      isPanelVisible: () => WINDOWS.get("panel")?.isVisible() ?? false,
      findSessionByConversationId: (conversationId) => agentSessionTracker.findSessionByConversationId(conversationId),
      getSession: (sessionId) => agentSessionTracker.getSession(sessionId),
      reviveSession: (sessionId, startSnoozed) => agentSessionTracker.reviveSession(sessionId, startSnoozed),
      processAgentMode: (text, conversationId, existingSessionId, startSnoozed) =>
        processWithAgentMode(text, conversationId, existingSessionId, startSnoozed),
    },
  }
}

function createMessageQueueRuntimeActionOptions(): MessageQueueRuntimeActionOptions {
  return {
    service: {
      pauseQueue: (conversationId) => messageQueueService.pauseQueue(conversationId),
      resumeQueue: (conversationId) => messageQueueService.resumeQueue(conversationId),
      removeFromQueue: (conversationId, messageId) => messageQueueService.removeFromQueue(conversationId, messageId),
      resetToPending: (conversationId, messageId) => messageQueueService.resetToPending(conversationId, messageId),
      updateMessageText: (conversationId, messageId, text) =>
        messageQueueService.updateMessageText(conversationId, messageId, text),
      getQueue: (conversationId) => messageQueueService.getQueue(conversationId),
    },
    processQueuedMessagesIfConversationIdle,
  }
}

/**
 * Process queued messages for a conversation after the current session completes.
 * This function peeks at messages and only removes them after successful processing.
 * Uses a per-conversation lock to prevent concurrent processing of the same queue.
 */
export async function processQueuedMessages(conversationId: string): Promise<void> {
  return processQueuedMessagesAction(conversationId, createQueuedMessagesActionOptions())
}

export function processQueuedMessagesIfConversationIdle(
  conversationId: string,
  logContext: string,
): boolean {
  return processQueuedMessagesIfConversationIdleAction(
    conversationId,
    logContext,
    processQueuedMessages,
    createQueuedMessagesActionOptions(),
  )
}

export function resumeMessageQueueByConversationId(conversationId: string): MessageQueueResumeResult {
  return resumeMessageQueueAction(conversationId, createMessageQueueRuntimeActionOptions())
}

export function pauseMessageQueueByConversationId(conversationId: string): MessageQueuePauseResult {
  return pauseMessageQueueAction(conversationId, createMessageQueueRuntimeActionOptions())
}

export function removeQueuedMessageById(
  conversationId: string,
  messageId: string,
): QueuedMessageActionResult {
  return removeQueuedMessageAction(conversationId, messageId, createMessageQueueRuntimeActionOptions())
}

export function retryQueuedMessageById(
  conversationId: string,
  messageId: string,
): QueuedMessageActionResult {
  return retryQueuedMessageAction(conversationId, messageId, createMessageQueueRuntimeActionOptions())
}

export function updateQueuedMessageTextById(
  conversationId: string,
  messageId: string,
  text: string,
): QueuedMessageActionResult {
  return updateQueuedMessageTextAction(conversationId, messageId, text, createMessageQueueRuntimeActionOptions())
}
