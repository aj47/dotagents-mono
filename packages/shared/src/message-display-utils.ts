import type { AgentProgressUpdate } from "./agent-progress"
import { replaceMarkdownMedia } from "./message-media"

// Inline data URLs can be megabytes long; replace them in display/budget text.
const hasMarkdownVideo = (content: string): boolean => /!\[\s*video:/i.test(content)

export function hasInlineDataImage(content: string): boolean {
  return !!content && /data:image\//i.test(content)
}

export function sanitizeMessageContentForDisplay(content: string): string {
  if (!hasInlineDataImage(content) && !hasMarkdownVideo(content)) {
    return content
  }

  let changed = false
  const sanitized = replaceMarkdownMedia(content, ({ kind, label, match, url }) => {
    if (kind === "video") {
      changed = true
      return label ? `[Video: ${label}]` : "[Video]"
    }
    if (!/^data:image\//i.test(url)) {
      return match
    }
    changed = true
    return label ? `[Image: ${label}]` : "[Image]"
  })

  return changed ? sanitized : content
}

export function sanitizeMessageContentForSpeech(content: string): string {
  if (!content) {
    return content
  }

  // Strip markdown media payloads before TTS.
  // This keeps speech requests small and avoids reading non-verbal content.
  return replaceMarkdownMedia(content, ({ kind, label }) => {
    const prefix = kind === "video" ? "Video" : "Image"
    return label ? `${prefix}: ${label}` : prefix
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
