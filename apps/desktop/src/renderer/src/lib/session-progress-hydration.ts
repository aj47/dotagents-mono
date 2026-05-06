import type { AgentProgressUpdate, LoadedConversation } from "@shared/types"
import { getBranchMessageIndexMap } from "@dotagents/shared/conversation-progress"

type ConversationForProgressHydration = Pick<
  LoadedConversation,
  | "id"
  | "title"
  | "messages"
  | "messageOffset"
  | "totalMessageCount"
  | "branchMessageIndexOffset"
>

type ProgressConversationHistory = NonNullable<AgentProgressUpdate["conversationHistory"]>

function toNonNegativeInteger(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return Math.max(0, Math.floor(value))
}

export function getLoadedConversationHistoryStartIndex(
  conversation: ConversationForProgressHydration,
  fallbackStartIndex = 0,
): number {
  const messageOffset = toNonNegativeInteger(conversation.messageOffset)
  if (messageOffset !== null) return messageOffset

  const totalMessageCount = toNonNegativeInteger(conversation.totalMessageCount)
  if (totalMessageCount !== null) {
    return Math.max(0, totalMessageCount - conversation.messages.length)
  }

  return Math.max(0, Math.floor(fallbackStartIndex))
}

function mergeHistoryWindows(
  loadedHistory: ProgressConversationHistory,
  loadedStartIndex: number,
  existingHistory: ProgressConversationHistory | undefined,
  existingStartIndex: number,
): { conversationHistory: ProgressConversationHistory; conversationHistoryStartIndex: number } {
  if (!existingHistory?.length) {
    return { conversationHistory: loadedHistory, conversationHistoryStartIndex: loadedStartIndex }
  }
  if (loadedHistory.length === 0) {
    return { conversationHistory: existingHistory, conversationHistoryStartIndex: existingStartIndex }
  }

  const loadedEndIndex = loadedStartIndex + loadedHistory.length
  const existingEndIndex = existingStartIndex + existingHistory.length
  const canRepresentAsSingleWindow =
    existingEndIndex >= loadedStartIndex &&
    existingStartIndex <= loadedEndIndex

  if (!canRepresentAsSingleWindow) {
    return existingEndIndex > loadedEndIndex
      ? { conversationHistory: existingHistory, conversationHistoryStartIndex: existingStartIndex }
      : { conversationHistory: loadedHistory, conversationHistoryStartIndex: loadedStartIndex }
  }

  const conversationHistoryStartIndex = Math.min(loadedStartIndex, existingStartIndex)
  const conversationHistoryEndIndex = Math.max(loadedEndIndex, existingEndIndex)
  const historyByIndex = new Map<number, ProgressConversationHistory[number]>()

  loadedHistory.forEach((message, index) => {
    historyByIndex.set(loadedStartIndex + index, message)
  })
  existingHistory.forEach((message, index) => {
    historyByIndex.set(existingStartIndex + index, message)
  })

  const conversationHistory: ProgressConversationHistory = []
  for (let index = conversationHistoryStartIndex; index < conversationHistoryEndIndex; index += 1) {
    const message = historyByIndex.get(index)
    if (!message) {
      return existingEndIndex > loadedEndIndex
        ? { conversationHistory: existingHistory, conversationHistoryStartIndex: existingStartIndex }
        : { conversationHistory: loadedHistory, conversationHistoryStartIndex: loadedStartIndex }
    }
    conversationHistory.push(message)
  }

  return { conversationHistory, conversationHistoryStartIndex }
}

export function hasConversationHistoryForDisplay(
  progress: AgentProgressUpdate | null | undefined,
): boolean {
  return (progress?.conversationHistory?.length ?? 0) > 0
}

export function mergeLoadedConversationIntoProgress(
  progress: AgentProgressUpdate,
  conversation: ConversationForProgressHydration | null | undefined,
  options?: { replaceExistingHistory?: boolean },
): AgentProgressUpdate {
  if (!conversation) {
    return progress
  }

  const shouldUseLoadedHistory =
    !hasConversationHistoryForDisplay(progress) ||
    options?.replaceExistingHistory === true

  if (!shouldUseLoadedHistory) {
    return progress
  }

  const existingHistoryStartIndex = toNonNegativeInteger(progress.conversationHistoryStartIndex)
    ?? Math.max(
      0,
      (progress.conversationHistoryTotalCount ?? progress.conversationHistory?.length ?? 0) -
        (progress.conversationHistory?.length ?? 0),
    )
  const branchMessageIndexMap = getBranchMessageIndexMap(conversation.messages)
  const branchMessageIndexOffset = conversation.branchMessageIndexOffset ?? 0
  const loadedHistoryStartIndex = getLoadedConversationHistoryStartIndex(
    conversation,
    existingHistoryStartIndex,
  )
  const loadedConversationHistory = conversation.messages.map((message, index) => ({
    role: message.role,
    content: message.content,
    ...(message.displayContent ? { displayContent: message.displayContent } : {}),
    toolCalls: message.toolCalls,
    toolResults: message.toolResults,
    timestamp: message.timestamp,
    branchMessageIndex: branchMessageIndexOffset + branchMessageIndexMap[index],
  }))
  const mergedHistory = options?.replaceExistingHistory === true
    ? mergeHistoryWindows(
        loadedConversationHistory,
        loadedHistoryStartIndex,
        progress.conversationHistory,
        existingHistoryStartIndex,
      )
    : {
        conversationHistory: loadedConversationHistory,
        conversationHistoryStartIndex: loadedHistoryStartIndex,
      }

  return {
    ...progress,
    conversationId: progress.conversationId ?? conversation.id,
    conversationTitle: progress.conversationTitle ?? conversation.title,
    conversationHistory: mergedHistory.conversationHistory,
    conversationHistoryStartIndex: mergedHistory.conversationHistoryStartIndex,
    conversationHistoryTotalCount: Math.max(
      progress.conversationHistoryTotalCount ?? 0,
      conversation.totalMessageCount ?? conversation.messages.length,
      mergedHistory.conversationHistoryStartIndex + mergedHistory.conversationHistory.length,
    ),
  }
}
