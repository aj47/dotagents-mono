import type {
  RunTopLevelAgentModeResult,
  StartedSharedResumeRun,
} from "./agent-mode-runner"
import { agentSessionTracker } from "./agent-session-tracker"
import { addManagedMessageToConversation } from "./conversation-management"
import { logLLM } from "./debug"
import { getErrorMessage } from "./error-utils"
import { messageQueueService } from "./message-queue-service"
import type { MessageQueue, QueuedMessage } from "../shared/types"

interface QueuedMessageSelectionCandidate {
  id: string
  text: string
}

interface ManagedQueuedMessageSelectionResult<
  T extends QueuedMessageSelectionCandidate,
> {
  selectedMessage?: T
  ambiguousMessages?: T[]
}

export interface ManagedMessageQueue extends MessageQueue {
  isPaused: boolean
}

export interface UpdateManagedQueuedMessageTextResult {
  success: boolean
  shouldProcessQueue: boolean
}

export interface RetryManagedQueuedMessageResult {
  success: boolean
  shouldProcessQueue: boolean
}

export interface ResumeManagedMessageQueueResult {
  success: boolean
  shouldProcessQueue: boolean
}

export interface StartManagedQueuedMessageRunOptions {
  text: string
  conversationId: string
  candidateSessionIds: string[]
  startSnoozed: boolean
}

export type StartManagedQueuedMessageRun = (
  options: StartManagedQueuedMessageRunOptions,
) => Promise<{
  preparedContext: StartedSharedResumeRun["preparedContext"]
  runPromise: StartedSharedResumeRun["runPromise"]
}>

export interface ProcessManagedQueuedMessagesOptions {
  conversationId: string
  startResumeRun: StartManagedQueuedMessageRun
  resolveStartSnoozed?: (
    conversationId: string,
  ) => boolean | Promise<boolean>
  onQueuedMessageStart?: (
    message: QueuedMessage,
  ) => void | Promise<void>
  onQueuedMessageComplete?: (
    message: QueuedMessage,
    result: RunTopLevelAgentModeResult,
  ) => void | Promise<void>
  onQueuedMessageFailure?: (
    message: QueuedMessage,
    errorMessage: string,
  ) => void | Promise<void>
}

export interface ProcessManagedQueuedMessagesResult {
  processedCount: number
  failedMessageId?: string
  failedErrorMessage?: string
}

function normalizeManagedQueuedMessageSelector(value: string): string {
  return value.trim().toLowerCase()
}

function getManagedQueuedMessageSelectionLabel(
  message: QueuedMessageSelectionCandidate,
): string {
  return message.text.trim() || message.id
}

function hasManagedActiveConversationSession(conversationId: string): boolean {
  const sessionId = agentSessionTracker.findSessionByConversationId(conversationId)
  if (!sessionId) {
    return false
  }

  const session = agentSessionTracker.getSession(sessionId)
  return !!session && session.status === "active"
}

function shouldProcessManagedMessageQueue(conversationId: string): boolean {
  return !hasManagedActiveConversationSession(conversationId)
}

function getUniqueManagedSessionCandidates(
  queuedSessionId: string | undefined,
  fallbackSessionId: string | undefined,
): string[] {
  return [queuedSessionId, fallbackSessionId].filter(
    (sessionId, index, list): sessionId is string =>
      typeof sessionId === "string" &&
      sessionId.length > 0 &&
      list.indexOf(sessionId) === index,
  )
}

export function getManagedMessageQueue(conversationId: string): ManagedMessageQueue {
  return {
    conversationId,
    messages: messageQueueService.getQueue(conversationId),
    isPaused: messageQueueService.isQueuePaused(conversationId),
  }
}

export function getManagedMessageQueues(): ManagedMessageQueue[] {
  return messageQueueService.getAllQueues().map((queue) => ({
    ...queue,
    isPaused: messageQueueService.isQueuePaused(queue.conversationId),
  }))
}

export function resolveManagedQueuedMessageSelection<
  T extends QueuedMessageSelectionCandidate,
>(
  messages: T[],
  query: string,
): ManagedQueuedMessageSelectionResult<T> {
  const trimmedQuery = query.trim()
  const normalizedQuery = normalizeManagedQueuedMessageSelector(query)

  if (!trimmedQuery) {
    return {}
  }

  const exactIdMatch = messages.find((message) => message.id === trimmedQuery)
  if (exactIdMatch) {
    return { selectedMessage: exactIdMatch }
  }

  const exactTextMatches = messages.filter(
    (message) =>
      normalizeManagedQueuedMessageSelector(
        getManagedQueuedMessageSelectionLabel(message),
      ) === normalizedQuery,
  )
  if (exactTextMatches.length === 1) {
    return { selectedMessage: exactTextMatches[0] }
  }
  if (exactTextMatches.length > 1) {
    return { ambiguousMessages: exactTextMatches }
  }

  const idPrefixMatches = messages.filter((message) =>
    message.id.startsWith(trimmedQuery),
  )
  if (idPrefixMatches.length === 1) {
    return { selectedMessage: idPrefixMatches[0] }
  }
  if (idPrefixMatches.length > 1) {
    return { ambiguousMessages: idPrefixMatches }
  }

  const textPrefixMatches = messages.filter((message) =>
    normalizeManagedQueuedMessageSelector(
      getManagedQueuedMessageSelectionLabel(message),
    ).startsWith(normalizedQuery),
  )
  if (textPrefixMatches.length === 1) {
    return { selectedMessage: textPrefixMatches[0] }
  }
  if (textPrefixMatches.length > 1) {
    return { ambiguousMessages: textPrefixMatches }
  }

  return {}
}

export function removeManagedMessageFromQueue(
  conversationId: string,
  messageId: string,
): boolean {
  return messageQueueService.removeFromQueue(conversationId, messageId)
}

export function clearManagedMessageQueue(conversationId: string): boolean {
  return messageQueueService.clearQueue(conversationId)
}

export function reorderManagedMessageQueue(
  conversationId: string,
  messageIds: string[],
): boolean {
  return messageQueueService.reorderQueue(conversationId, messageIds)
}

export function updateManagedQueuedMessageText(
  conversationId: string,
  messageId: string,
  text: string,
): UpdateManagedQueuedMessageTextResult {
  const queue = messageQueueService.getQueue(conversationId)
  const message = queue.find((entry) => entry.id === messageId)
  const wasFailed = message?.status === "failed"

  const success = messageQueueService.updateMessageText(
    conversationId,
    messageId,
    text,
  )
  if (!success) {
    return {
      success: false,
      shouldProcessQueue: false,
    }
  }

  return {
    success: true,
    shouldProcessQueue:
      wasFailed === true && shouldProcessManagedMessageQueue(conversationId),
  }
}

export function retryManagedQueuedMessage(
  conversationId: string,
  messageId: string,
): RetryManagedQueuedMessageResult {
  const success = messageQueueService.resetToPending(conversationId, messageId)
  return {
    success,
    shouldProcessQueue:
      success && shouldProcessManagedMessageQueue(conversationId),
  }
}

export function isManagedMessageQueuePaused(conversationId: string): boolean {
  return messageQueueService.isQueuePaused(conversationId)
}

export function pauseManagedMessageQueue(conversationId: string): boolean {
  messageQueueService.pauseQueue(conversationId)
  return true
}

export function resumeManagedMessageQueue(
  conversationId: string,
): ResumeManagedMessageQueueResult {
  messageQueueService.resumeQueue(conversationId)
  return {
    success: true,
    shouldProcessQueue: shouldProcessManagedMessageQueue(conversationId),
  }
}

export async function processManagedQueuedMessages({
  conversationId,
  startResumeRun,
  resolveStartSnoozed = () => true,
  onQueuedMessageStart,
  onQueuedMessageComplete,
  onQueuedMessageFailure,
}: ProcessManagedQueuedMessagesOptions): Promise<ProcessManagedQueuedMessagesResult> {
  logLLM(
    `[processManagedQueuedMessages] Starting queue processing for ${conversationId}`,
  )

  if (!messageQueueService.tryAcquireProcessingLock(conversationId)) {
    logLLM(
      `[processManagedQueuedMessages] Failed to acquire lock for ${conversationId}`,
    )
    return { processedCount: 0 }
  }

  let processedCount = 0
  let failedMessageId: string | undefined
  let failedErrorMessage: string | undefined

  try {
    while (true) {
      if (messageQueueService.isQueuePaused(conversationId)) {
        logLLM(
          `[processManagedQueuedMessages] Queue is paused for ${conversationId}, stopping processing`,
        )
        return {
          processedCount,
          failedMessageId,
          failedErrorMessage,
        }
      }

      const queuedMessage = messageQueueService.peek(conversationId)
      if (!queuedMessage) {
        logLLM(
          `[processManagedQueuedMessages] No more pending messages in queue for ${conversationId}`,
        )
        const allMessages = messageQueueService.getQueue(conversationId)
        if (allMessages.length > 0) {
          logLLM(
            `[processManagedQueuedMessages] Queue has ${allMessages.length} messages but peek returned null. First message status: ${allMessages[0]?.status}`,
          )
        }
        return {
          processedCount,
          failedMessageId,
          failedErrorMessage,
        }
      }

      logLLM(
        `[processManagedQueuedMessages] Processing queued message ${queuedMessage.id} for ${conversationId}`,
      )

      const markingSucceeded = messageQueueService.markProcessing(
        conversationId,
        queuedMessage.id,
      )
      if (!markingSucceeded) {
        logLLM(
          `[processManagedQueuedMessages] Message ${queuedMessage.id} was removed or modified before processing, retrying queue scan`,
        )
        continue
      }

      try {
        await onQueuedMessageStart?.(queuedMessage)

        if (!queuedMessage.addedToHistory) {
          const addResult = await addManagedMessageToConversation(
            conversationId,
            queuedMessage.text,
            "user",
          )
          if (!addResult) {
            throw new Error("Failed to add message to conversation history")
          }
          messageQueueService.markAddedToHistory(conversationId, queuedMessage.id)
        }

        const fallbackSessionId =
          agentSessionTracker.findSessionByConversationId(conversationId)
        const candidateSessionIds = getUniqueManagedSessionCandidates(
          queuedMessage.sessionId,
          fallbackSessionId,
        )
        const startSnoozed = await resolveStartSnoozed(conversationId)
        const {
          preparedContext: {
            sessionId: existingSessionId,
            reusedExistingSession,
          },
          runPromise,
        } = await startResumeRun({
          text: queuedMessage.text,
          conversationId,
          candidateSessionIds,
          startSnoozed,
        })

        if (reusedExistingSession && existingSessionId) {
          if (
            queuedMessage.sessionId &&
            existingSessionId !== queuedMessage.sessionId
          ) {
            logLLM(
              `[processManagedQueuedMessages] Preferred queued session ${queuedMessage.sessionId} could not be revived, reusing fallback session ${existingSessionId}`,
            )
          } else {
            logLLM(
              `[processManagedQueuedMessages] Revived session ${existingSessionId} for conversation ${conversationId}, snoozed: ${startSnoozed}`,
            )
          }
        } else if (queuedMessage.sessionId) {
          logLLM(
            `[processManagedQueuedMessages] Preferred queued session ${queuedMessage.sessionId} could not be revived, starting a new runtime session`,
          )
        }

        const result = await runPromise
        await onQueuedMessageComplete?.(queuedMessage, result)

        messageQueueService.markProcessed(conversationId, queuedMessage.id)
        processedCount += 1
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        failedMessageId = queuedMessage.id
        failedErrorMessage = errorMessage

        logLLM(
          `[processManagedQueuedMessages] Error processing queued message ${queuedMessage.id}:`,
          error,
        )
        messageQueueService.markFailed(
          conversationId,
          queuedMessage.id,
          errorMessage,
        )
        await onQueuedMessageFailure?.(queuedMessage, errorMessage)
        break
      }
    }
  } finally {
    messageQueueService.releaseProcessingLock(conversationId)
  }

  return {
    processedCount,
    failedMessageId,
    failedErrorMessage,
  }
}
