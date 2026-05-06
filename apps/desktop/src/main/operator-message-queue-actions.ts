import {
  clearOperatorMessageQueueAction,
  getOperatorMessageQueuesAction,
  pauseOperatorMessageQueueAction,
  removeOperatorQueuedMessageAction,
  resumeOperatorMessageQueueAction,
  retryOperatorQueuedMessageAction,
  updateOperatorQueuedMessageAction,
  type OperatorMessageQueueActionOptions,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import {
  pauseMessageQueueByConversationId,
  removeQueuedMessageById,
  retryQueuedMessageById,
  resumeMessageQueueByConversationId,
  updateQueuedMessageTextById,
} from "./message-queue-actions"
import { messageQueueService } from "./message-queue-service"

export type OperatorMessageQueueActionResult = OperatorRouteActionResult

const messageQueueActionOptions: OperatorMessageQueueActionOptions = {
  service: {
    getAllQueues: () => messageQueueService.getAllQueues(),
    isQueuePaused: (conversationId) => messageQueueService.isQueuePaused(conversationId),
    clearQueue: (conversationId) => messageQueueService.clearQueue(conversationId),
    pauseQueue: (conversationId) => pauseMessageQueueByConversationId(conversationId),
    resumeQueue: (conversationId) => resumeMessageQueueByConversationId(conversationId),
    removeQueuedMessage: (conversationId, messageId) => removeQueuedMessageById(conversationId, messageId),
    retryQueuedMessage: (conversationId, messageId) => retryQueuedMessageById(conversationId, messageId),
    updateQueuedMessageText: (conversationId, messageId, text) =>
      updateQueuedMessageTextById(conversationId, messageId, text),
  },
}

export function getOperatorMessageQueues(): OperatorMessageQueueActionResult {
  return getOperatorMessageQueuesAction(messageQueueActionOptions)
}

export function clearOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult {
  return clearOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)
}

export function pauseOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult {
  return pauseOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)
}

export function resumeOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult {
  return resumeOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)
}

export function removeOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
): OperatorMessageQueueActionResult {
  return removeOperatorQueuedMessageAction(conversationIdParam, messageIdParam, messageQueueActionOptions)
}

export function retryOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
): OperatorMessageQueueActionResult {
  return retryOperatorQueuedMessageAction(conversationIdParam, messageIdParam, messageQueueActionOptions)
}

export function updateOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
  body: unknown,
): OperatorMessageQueueActionResult {
  return updateOperatorQueuedMessageAction(conversationIdParam, messageIdParam, body, messageQueueActionOptions)
}
