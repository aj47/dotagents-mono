import {
  buildMessageQueuePauseResult,
  buildMessageQueueResumeResult,
  buildQueuedMessageActionResult,
  type MessageQueuePauseResult,
  type MessageQueueResumeResult,
  type QueuedMessageActionResult,
} from "@dotagents/shared/message-queue-store"
import { agentSessionTracker } from "./agent-session-tracker"
import { processWithAgentMode } from "./agent-loop-runner"
import { conversationService } from "./conversation-service"
import { logLLM } from "./debug"
import { getErrorMessage } from "./error-utils"
import { messageQueueService } from "./message-queue-service"
import { WINDOWS } from "./window"

export type {
  MessageQueuePauseResult,
  MessageQueueResumeResult,
  QueuedMessageActionResult,
}

/**
 * Process queued messages for a conversation after the current session completes.
 * This function peeks at messages and only removes them after successful processing.
 * Uses a per-conversation lock to prevent concurrent processing of the same queue.
 */
export async function processQueuedMessages(conversationId: string): Promise<void> {
  logLLM(`[processQueuedMessages] Starting queue processing for ${conversationId}`)

  if (!messageQueueService.tryAcquireProcessingLock(conversationId)) {
    logLLM(`[processQueuedMessages] Failed to acquire lock for ${conversationId}`)
    return
  }
  logLLM(`[processQueuedMessages] Acquired lock for ${conversationId}`)

  try {
    while (true) {
      if (messageQueueService.isQueuePaused(conversationId)) {
        logLLM(`[processQueuedMessages] Queue is paused for ${conversationId}, stopping processing`)
        return
      }

      const queuedMessage = messageQueueService.peek(conversationId)
      if (!queuedMessage) {
        logLLM(`[processQueuedMessages] No more pending messages in queue for ${conversationId}`)
        const allMessages = messageQueueService.getQueue(conversationId)
        if (allMessages.length > 0) {
          logLLM(`[processQueuedMessages] Queue has ${allMessages.length} messages but peek returned null. First message status: ${allMessages[0]?.status}`)
        }
        return
      }

      logLLM(`[processQueuedMessages] Processing queued message ${queuedMessage.id} for ${conversationId}`)

      const markingSucceeded = messageQueueService.markProcessing(conversationId, queuedMessage.id)
      if (!markingSucceeded) {
        logLLM(`[processQueuedMessages] Message ${queuedMessage.id} was removed/modified before processing, re-checking queue`)
        continue
      }

      try {
        if (!queuedMessage.addedToHistory) {
          const addResult = await conversationService.addMessageToConversation(
            conversationId,
            queuedMessage.text,
            "user",
          )
          if (!addResult) {
            throw new Error("Failed to add message to conversation history")
          }
          messageQueueService.markAddedToHistory(conversationId, queuedMessage.id)
        }

        const panelWindow = WINDOWS.get("panel")
        const isPanelVisible = panelWindow?.isVisible() ?? false
        const shouldStartSnoozed = !isPanelVisible
        logLLM(`[processQueuedMessages] Panel visible: ${isPanelVisible}, startSnoozed: ${shouldStartSnoozed}`)

        let existingSessionId: string | undefined
        const fallbackSessionId = agentSessionTracker.findSessionByConversationId(conversationId)
        const candidateSessionIds = [queuedMessage.sessionId, fallbackSessionId].filter(
          (sessionId, index, list): sessionId is string =>
            typeof sessionId === "string" && sessionId.length > 0 && list.indexOf(sessionId) === index,
        )

        for (const candidateSessionId of candidateSessionIds) {
          const revived = agentSessionTracker.reviveSession(candidateSessionId, shouldStartSnoozed)
          if (revived) {
            existingSessionId = candidateSessionId
            logLLM(`[processQueuedMessages] Revived session ${existingSessionId} for conversation ${conversationId}, snoozed: ${shouldStartSnoozed}`)
            break
          }

          if (candidateSessionId === queuedMessage.sessionId) {
            logLLM(`[processQueuedMessages] Preferred queued session ${candidateSessionId} could not be revived, trying fallback lookup`)
          }
        }

        await processWithAgentMode(queuedMessage.text, conversationId, existingSessionId, shouldStartSnoozed)

        messageQueueService.markProcessed(conversationId, queuedMessage.id)
      } catch (error) {
        logLLM(`[processQueuedMessages] Error processing queued message ${queuedMessage.id}:`, error)
        const errorMessage = getErrorMessage(error)
        messageQueueService.markFailed(conversationId, queuedMessage.id, errorMessage)
        break
      }
    }
  } finally {
    messageQueueService.releaseProcessingLock(conversationId)
  }
}

export function processQueuedMessagesIfConversationIdle(
  conversationId: string,
  logContext: string,
): boolean {
  const activeSessionId = agentSessionTracker.findSessionByConversationId(conversationId)
  if (activeSessionId) {
    const session = agentSessionTracker.getSession(activeSessionId)
    if (session && session.status === "active") {
      return false
    }
  }

  processQueuedMessages(conversationId).catch((error) => {
    logLLM(`[${logContext}] Error processing queued messages:`, error)
  })
  return true
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
