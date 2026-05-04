import type { AgentProgressUpdate, LoadedConversation } from "@shared/types"
import { getBranchMessageIndexMap } from "@shared/conversation-progress"

type ConversationForProgressHydration = Pick<
  LoadedConversation,
  | "id"
  | "title"
  | "messages"
  | "messageOffset"
  | "totalMessageCount"
  | "branchMessageIndexOffset"
>

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

  const branchMessageIndexMap = getBranchMessageIndexMap(conversation.messages)
  const branchMessageIndexOffset = conversation.branchMessageIndexOffset ?? 0
  const conversationHistory = conversation.messages.map((message, index) => ({
    role: message.role,
    content: message.content,
    ...(message.displayContent ? { displayContent: message.displayContent } : {}),
    toolCalls: message.toolCalls,
    toolResults: message.toolResults,
    timestamp: message.timestamp,
    branchMessageIndex: branchMessageIndexOffset + branchMessageIndexMap[index],
  }))

  return {
    ...progress,
    conversationId: progress.conversationId ?? conversation.id,
    conversationTitle: progress.conversationTitle ?? conversation.title,
    conversationHistory,
    conversationHistoryStartIndex:
      options?.replaceExistingHistory === true
        ? conversation.messageOffset ?? 0
        : progress.conversationHistoryStartIndex ?? conversation.messageOffset ?? 0,
    conversationHistoryTotalCount: Math.max(
      progress.conversationHistoryTotalCount ?? 0,
      conversation.totalMessageCount ?? conversation.messages.length,
      conversationHistory.length,
    ),
  }
}
