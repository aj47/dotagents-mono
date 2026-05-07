import {
  buildMessageQueuePauseResult,
  buildMessageQueueResumeResult,
  buildQueuedMessageActionResult,
  processQueuedMessagesAction,
  processQueuedMessagesIfConversationIdleAction,
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
  messageQueueService.resumeQueue(conversationId)

  return buildMessageQueueResumeResult(
    conversationId,
    processQueuedMessagesIfConversationIdle(conversationId, "resumeMessageQueue"),
  )
}

export function pauseMessageQueueByConversationId(conversationId: string): MessageQueuePauseResult {
  messageQueueService.pauseQueue(conversationId)
  return buildMessageQueuePauseResult(conversationId)
}

export function removeQueuedMessageById(
  conversationId: string,
  messageId: string,
): QueuedMessageActionResult {
  return buildQueuedMessageActionResult(
    conversationId,
    messageId,
    messageQueueService.removeFromQueue(conversationId, messageId),
    false,
  )
}

export function retryQueuedMessageById(
  conversationId: string,
  messageId: string,
): QueuedMessageActionResult {
  const success = messageQueueService.resetToPending(conversationId, messageId)
  return buildQueuedMessageActionResult(
    conversationId,
    messageId,
    success,
    success
      ? processQueuedMessagesIfConversationIdle(conversationId, "retryQueuedMessage")
      : false,
  )
}

export function updateQueuedMessageTextById(
  conversationId: string,
  messageId: string,
  text: string,
): QueuedMessageActionResult {
  const wasFailed = messageQueueService.getQueue(conversationId)
    .find((message) => message.id === messageId)?.status === "failed"

  const success = messageQueueService.updateMessageText(conversationId, messageId, text)
  return buildQueuedMessageActionResult(
    conversationId,
    messageId,
    success,
    success && wasFailed
      ? processQueuedMessagesIfConversationIdle(conversationId, "updateQueuedMessageText")
      : false,
  )
}
