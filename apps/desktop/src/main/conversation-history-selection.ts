import type { ConversationHistoryItem } from "../shared/types"

export interface ResolvedConversationHistorySelection {
  selectedConversation?: ConversationHistoryItem
  ambiguousConversations?: ConversationHistoryItem[]
}

function normalizeConversationSelectionQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function resolveConversationHistorySelection(
  history: readonly ConversationHistoryItem[],
  query: string,
): ResolvedConversationHistorySelection {
  const normalizedQuery = normalizeConversationSelectionQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactMatch = history.find(
    (conversation) => conversation.id.toLowerCase() === normalizedQuery,
  )
  if (exactMatch) {
    return { selectedConversation: exactMatch }
  }

  const prefixMatches = history.filter((conversation) =>
    conversation.id.toLowerCase().startsWith(normalizedQuery),
  )

  if (prefixMatches.length === 1) {
    return { selectedConversation: prefixMatches[0] }
  }

  if (prefixMatches.length > 1) {
    return { ambiguousConversations: prefixMatches }
  }

  return {}
}
