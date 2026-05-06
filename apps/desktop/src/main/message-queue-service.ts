import { createMessageQueueStore } from "@dotagents/shared/message-queue-store"
import type { MessageQueue, QueuedMessage } from "@dotagents/shared/message-queue-utils"
import { logApp } from "./debug"
import { getRendererHandlers } from "@egoist/tipc/main"
import { RendererHandlers } from "./renderer-handlers"
import { WINDOWS } from "./window"

/**
 * Service for managing message queues per conversation.
 * When message queuing is enabled, users can submit messages while an agent session is active.
 * These messages are queued and processed sequentially after the current session completes.
 */
class MessageQueueService {
  private static instance: MessageQueueService | null = null
  private queueStore = createMessageQueueStore({
    onQueueChanged: (conversationId) => this.emitQueueUpdate(conversationId),
  })

  static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService()
    }
    return MessageQueueService.instance
  }

  private constructor() {}

  /**
   * Pause queue processing for a conversation.
   * When paused, processQueuedMessages will not process any more messages.
   * Used by kill switch to prevent executing the next queued message after stopping.
   */
  pauseQueue(conversationId: string): void {
    this.queueStore.pauseQueue(conversationId)
    logApp(`[MessageQueueService] Paused queue for ${conversationId}`)
  }

  /**
   * Resume queue processing for a conversation.
   */
  resumeQueue(conversationId: string): void {
    this.queueStore.resumeQueue(conversationId)
    logApp(`[MessageQueueService] Resumed queue for ${conversationId}`)
  }

  /**
   * Check if a conversation's queue is paused.
   */
  isQueuePaused(conversationId: string): boolean {
    return this.queueStore.isQueuePaused(conversationId)
  }

  /**
   * Try to acquire a processing lock for a conversation.
   * Returns true if lock acquired, false if already being processed or paused.
   */
  tryAcquireProcessingLock(conversationId: string): boolean {
    if (this.queueStore.isQueuePaused(conversationId)) {
      logApp(`[MessageQueueService] Queue is paused for ${conversationId}, skipping`)
      return false
    }
    if (this.queueStore.isProcessing(conversationId)) {
      logApp(`[MessageQueueService] Already processing queue for ${conversationId}, skipping`)
      return false
    }
    if (!this.queueStore.tryAcquireProcessingLock(conversationId)) {
      return false
    }
    logApp(`[MessageQueueService] Acquired processing lock for ${conversationId}`)
    return true
  }

  /**
   * Release the processing lock for a conversation.
   */
  releaseProcessingLock(conversationId: string): void {
    this.queueStore.releaseProcessingLock(conversationId)
    logApp(`[MessageQueueService] Released processing lock for ${conversationId}`)
  }

  /**
   * Check if a conversation is currently being processed.
   */
  isProcessing(conversationId: string): boolean {
    return this.queueStore.isProcessing(conversationId)
  }

  /**
   * Add a message to the queue for a conversation
   */
  enqueue(conversationId: string, text: string, sessionId?: string): QueuedMessage {
    const message = this.queueStore.enqueue(conversationId, text, sessionId)

    logApp(`[MessageQueueService] Enqueued message for ${conversationId}: ${message.id}`)
    return message
  }

  /**
   * Get all queued messages for a conversation
   */
  getQueue(conversationId: string): QueuedMessage[] {
    return this.queueStore.getQueue(conversationId)
  }

  /**
   * Get all queues (for debugging/UI purposes)
   */
  getAllQueues(): MessageQueue[] {
    return this.queueStore.getAllQueues()
  }

  /**
   * Remove a specific message from the queue.
   * Cannot remove a message that is currently being processed.
   */
  removeFromQueue(conversationId: string, messageId: string): boolean {
    const result = this.queueStore.removeFromQueue(conversationId, messageId)
    if (!result.success) {
      if (result.reason === "processing") {
        // Don't allow removing a message that's currently processing
        logApp(`[MessageQueueService] Cannot remove message ${messageId} - currently processing`)
      }
      return false
    }

    logApp(`[MessageQueueService] Removed message ${messageId} from ${conversationId}`)

    return true
  }

  /**
   * Clear all messages in a conversation's queue.
   * Cannot clear if any message is currently being processed.
   */
  clearQueue(conversationId: string): boolean {
    const result = this.queueStore.clearQueue(conversationId)
    if (!result.success) {
      if (result.reason === "processing") {
        // Don't clear if there's a message currently processing
        logApp(`[MessageQueueService] Cannot clear queue for ${conversationId} - message is processing`)
      }
      return false
    }
    if (!result.changed) return true // Nothing to clear

    logApp(`[MessageQueueService] Cleared queue for ${conversationId}`)
    return true
  }

  /**
   * Update the text of a queued message.
   * If the message was in failed status, resets it to pending for retry.
   */
  updateMessageText(conversationId: string, messageId: string, newText: string): boolean {
    const result = this.queueStore.updateMessageText(conversationId, messageId, newText)
    if (!result.success) {
      if (result.reason === "processing") {
        logApp(`[MessageQueueService] Cannot update message ${messageId} text while it is processing`)
      } else if (result.reason === "added_to_history") {
        // Prevent editing messages that have already been added to conversation history
        // to maintain consistency between history and what gets processed on retry
        logApp(`[MessageQueueService] Cannot update message ${messageId} text - already added to conversation history`)
      }
      return false
    }

    if (result.resetFailedToPending) {
      logApp(`[MessageQueueService] Reset failed message ${messageId} to pending in ${conversationId}`)
    } else {
      logApp(`[MessageQueueService] Updated message ${messageId} text in ${conversationId}`)
    }

    return true
  }

  /**
   * Peek at the next message to process.
   * Returns the first message only if it's pending - enforces strict FIFO ordering.
   * Failed/cancelled messages at the head of the queue block processing until handled.
   */
  peek(conversationId: string): QueuedMessage | null {
    return this.queueStore.peek(conversationId)
  }

  /**
   * Mark a message as currently being processed.
   * This prevents UI actions (edit/remove) from affecting the message while processing.
   */
  markProcessing(conversationId: string, messageId: string): boolean {
    const result = this.queueStore.markProcessing(conversationId, messageId)
    if (!result.success) return false

    logApp(`[MessageQueueService] Marked message ${messageId} as processing in ${conversationId}`)

    return true
  }

  /**
   * Mark a message as successfully processed and remove it from the queue
   * Finds the message by ID regardless of position (handles queue reordering during processing)
   */
  markProcessed(conversationId: string, messageId: string): boolean {
    const result = this.queueStore.markProcessed(conversationId, messageId)
    if (!result.success) {
      logApp(`[MessageQueueService] Warning: markProcessed called for ${messageId} but message not found in queue`)
      return false
    }

    if (result.index !== 0) {
      logApp(`[MessageQueueService] Message ${messageId} was at position ${result.index} (queue was reordered during processing)`)
    }

    logApp(`[MessageQueueService] Marked message ${messageId} as processed for ${conversationId}`)

    return true
  }

  /**
   * Mark a message as failed with an error message
   */
  markFailed(conversationId: string, messageId: string, errorMessage: string): boolean {
    const result = this.queueStore.markFailed(conversationId, messageId, errorMessage)
    if (!result.success) {
      logApp(`[MessageQueueService] Warning: markFailed called for ${messageId} but message not found in queue`)
      return false
    }

    logApp(`[MessageQueueService] Marked message ${messageId} as failed for ${conversationId}: ${errorMessage}`)

    return true
  }

  /**
   * Mark a message as having been added to conversation history.
   * This prevents duplicates when retrying failed messages.
   */
  markAddedToHistory(conversationId: string, messageId: string): boolean {
    const result = this.queueStore.markAddedToHistory(conversationId, messageId)
    if (!result.success) return false

    logApp(`[MessageQueueService] Marked message ${messageId} as added to history in ${conversationId}`)
    // Note: No need to emit queue update - this is an internal tracking flag
    return true
  }

  /**
   * Reset a failed message to pending status for retry.
   * Unlike updateMessageText, this only changes status and works for addedToHistory messages.
   */
  resetToPending(conversationId: string, messageId: string): boolean {
    const result = this.queueStore.resetToPending(conversationId, messageId)
    if (!result.success) {
      if (result.reason === "not_failed") {
        logApp(`[MessageQueueService] Cannot reset message ${messageId} - not in failed status (current: ${result.message?.status})`)
      }
      return false
    }

    logApp(`[MessageQueueService] Reset message ${messageId} to pending for retry in ${conversationId}`)

    return true
  }

  /**
   * Reorder messages in the queue
   */
  reorderQueue(conversationId: string, messageIds: string[]): boolean {
    const result = this.queueStore.reorderQueue(conversationId, messageIds)
    if (!result.success) return false

    logApp(`[MessageQueueService] Reordered queue for ${conversationId}`)

    return true
  }

  /**
   * Check if a conversation has queued messages
   */
  hasQueuedMessages(conversationId: string): boolean {
    return this.queueStore.hasQueuedMessages(conversationId)
  }

  /**
   * Emit queue update to renderer
   */
  private emitQueueUpdate(conversationId: string): void {
    const main = WINDOWS.get("main")
    const panel = WINDOWS.get("panel")

    const queue = this.getQueue(conversationId)
    const isPaused = this.isQueuePaused(conversationId)

    ;[main, panel].forEach((win) => {
      if (win) {
        try {
          const handlers = getRendererHandlers<RendererHandlers>(win.webContents)
          if (handlers?.onMessageQueueUpdate) {
            try {
              handlers.onMessageQueueUpdate.send({
                conversationId,
                queue,
                isPaused,
              })
            } catch (error) {
              logApp("Failed to send queue update:", error)
            }
          }
        } catch (error) {
          logApp("Failed to get renderer handlers for queue update:", error)
        }
      }
    })
  }
}

export const messageQueueService = MessageQueueService.getInstance()
