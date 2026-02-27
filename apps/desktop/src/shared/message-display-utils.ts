import type { AgentProgressUpdate } from "./types"

// Inline data URLs can be megabytes long; replace them in display/budget text.
const INLINE_DATA_IMAGE_REGEX = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi

export function hasInlineDataImage(content: string): boolean {
  return !!content && content.includes("data:image/")
}

export function sanitizeMessageContentForDisplay(content: string): string {
  if (!hasInlineDataImage(content)) {
    return content
  }

  return content.replace(INLINE_DATA_IMAGE_REGEX, (_match, altText: string) => {
    const cleanedAlt = altText?.trim()
    return cleanedAlt ? `[Image: ${cleanedAlt}]` : "[Image]"
  })
}

export function sanitizeConversationHistoryForDisplay(
  conversationHistory: AgentProgressUpdate["conversationHistory"]
): AgentProgressUpdate["conversationHistory"] {
  if (!conversationHistory?.length) {
    return conversationHistory
  }

  let changed = false
  const sanitized = conversationHistory.map((entry) => {
    const nextContent = sanitizeMessageContentForDisplay(entry.content)
    if (nextContent === entry.content) {
      return entry
    }
    changed = true
    return { ...entry, content: nextContent }
  })

  return changed ? sanitized : conversationHistory
}

export function sanitizeAgentProgressUpdateForDisplay(
  update: AgentProgressUpdate
): AgentProgressUpdate {
  const sanitizedHistory = sanitizeConversationHistoryForDisplay(update.conversationHistory)
  if (sanitizedHistory === update.conversationHistory) {
    return update
  }
  return {
    ...update,
    conversationHistory: sanitizedHistory,
  }
}
