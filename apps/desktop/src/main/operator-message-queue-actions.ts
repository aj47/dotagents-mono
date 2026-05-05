import type { OperatorActionResponse } from "@dotagents/shared/api-types"
import { buildOperatorMessageQueuesResponse } from "@dotagents/shared/message-queue-utils"
import {
  buildOperatorActionAuditContext,
  buildOperatorActionErrorResponse,
  buildOperatorMessageQueueClearResponse,
  buildOperatorMessageQueuePauseResponse,
  buildOperatorMessageQueueResumeResponse,
  buildOperatorQueuedMessageRemoveResponse,
  buildOperatorQueuedMessageRetryResponse,
  buildOperatorQueuedMessageUpdateResponse,
  parseOperatorQueuedMessageUpdateRequestBody,
  type OperatorActionAuditContext,
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

function result(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorMessageQueueActionResult {
  return {
    statusCode,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function actionResult(statusCode: number, response: OperatorActionResponse): OperatorMessageQueueActionResult {
  return result(statusCode, response, buildOperatorActionAuditContext(response))
}

function normalizePathParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export function getOperatorMessageQueues(): OperatorMessageQueueActionResult {
  return result(200, buildOperatorMessageQueuesResponse(
    messageQueueService.getAllQueues().map((queue) => ({
      ...queue,
      isPaused: messageQueueService.isQueuePaused(queue.conversationId),
    })),
  ))
}

export function clearOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult {
  const conversationId = normalizePathParam(conversationIdParam)
  if (!conversationId) {
    return actionResult(400, buildOperatorActionErrorResponse("message-queue-clear", "Missing conversation ID"))
  }

  const response = buildOperatorMessageQueueClearResponse(
    conversationId,
    messageQueueService.clearQueue(conversationId),
  )
  return actionResult(response.success ? 200 : 409, response)
}

export function pauseOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult {
  const conversationId = normalizePathParam(conversationIdParam)
  if (!conversationId) {
    return actionResult(400, buildOperatorActionErrorResponse("message-queue-pause", "Missing conversation ID"))
  }

  const queueResult = pauseMessageQueueByConversationId(conversationId)
  return actionResult(200, buildOperatorMessageQueuePauseResponse(queueResult.conversationId))
}

export function resumeOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult {
  const conversationId = normalizePathParam(conversationIdParam)
  if (!conversationId) {
    return actionResult(400, buildOperatorActionErrorResponse("message-queue-resume", "Missing conversation ID"))
  }

  const queueResult = resumeMessageQueueByConversationId(conversationId)
  return actionResult(200, buildOperatorMessageQueueResumeResponse(conversationId, queueResult.processingStarted))
}

export function removeOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
): OperatorMessageQueueActionResult {
  const conversationId = normalizePathParam(conversationIdParam)
  const messageId = normalizePathParam(messageIdParam)
  if (!conversationId || !messageId) {
    return actionResult(400, buildOperatorActionErrorResponse("message-queue-message-remove", "Missing conversation ID or message ID"))
  }

  const queueResult = removeQueuedMessageById(conversationId, messageId)
  const response = buildOperatorQueuedMessageRemoveResponse(conversationId, messageId, queueResult.success)
  return actionResult(response.success ? 200 : 409, response)
}

export function retryOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
): OperatorMessageQueueActionResult {
  const conversationId = normalizePathParam(conversationIdParam)
  const messageId = normalizePathParam(messageIdParam)
  if (!conversationId || !messageId) {
    return actionResult(400, buildOperatorActionErrorResponse("message-queue-message-retry", "Missing conversation ID or message ID"))
  }

  const queueResult = retryQueuedMessageById(conversationId, messageId)
  const response = buildOperatorQueuedMessageRetryResponse(
    conversationId,
    messageId,
    queueResult.success,
    queueResult.processingStarted,
  )
  return actionResult(response.success ? 200 : 409, response)
}

export function updateOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
  body: unknown,
): OperatorMessageQueueActionResult {
  const conversationId = normalizePathParam(conversationIdParam)
  const messageId = normalizePathParam(messageIdParam)
  if (!conversationId || !messageId) {
    return actionResult(400, buildOperatorActionErrorResponse("message-queue-message-update", "Missing conversation ID or message ID"))
  }

  const parsed = parseOperatorQueuedMessageUpdateRequestBody(body)
  if (parsed.ok === false) {
    return actionResult(parsed.statusCode, buildOperatorActionErrorResponse("message-queue-message-update", parsed.error))
  }

  const queueResult = updateQueuedMessageTextById(conversationId, messageId, parsed.request.text)
  const response = buildOperatorQueuedMessageUpdateResponse(
    conversationId,
    messageId,
    queueResult.success,
    queueResult.processingStarted,
  )
  return actionResult(response.success ? 200 : 409, response)
}
