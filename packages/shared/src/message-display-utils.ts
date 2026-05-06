import type { AgentProgressUpdate } from "./agent-progress"

// Inline data URLs can be megabytes long; replace them in display/budget text.
const INLINE_DATA_IMAGE_REGEX = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/gi
const MARKDOWN_VIDEO_LINK_REGEX = /(^|[^!])\[([^\]]*)\]\((assets:\/\/conversation-video\/[^)]+|https?:\/\/[^)]+\.(?:mp4|m4v|webm|mov|ogv)(?:[?#][^)]*)?)\)/gi
const MARKDOWN_MEDIA_IMAGE_PAYLOAD_REGEX = /!\[[^\]]*\]\((?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)[^)]*\)/gi
const MARKDOWN_ANY_IMAGE_PAYLOAD_REGEX = /!\[[^\]]*\]\([^)]*\)/gi
const MARKDOWN_MEDIA_VIDEO_PAYLOAD_REGEX = /(^|[^!])\[[^\]]*\]\((?:https?:\/\/[^)]+\.(?:mp4|m4v|webm|mov|ogv)(?:[?#][^)]*)?|assets:\/\/(?:conversation-video|recording)\/[^)]+)\)/gi

export interface StripMarkdownMediaPayloadOptions {
  stripAllImages?: boolean
}

function hasInlineDataImage(content: string): boolean {
  return !!content && /data:image\//i.test(content)
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

export function sanitizeMessageContentForSpeech(content: string): string {
  if (!content) {
    return content
  }

  // Strip markdown image payloads (including inline data URLs) before TTS.
  // This keeps speech requests small and avoids reading non-verbal content.
  return content
    .replace(MARKDOWN_IMAGE_REGEX, (_match, altText: string) => {
      const cleanedAlt = altText?.trim()
      return cleanedAlt ? `Image: ${cleanedAlt}` : "Image"
    })
    .replace(MARKDOWN_VIDEO_LINK_REGEX, (_match, prefix: string, label: string) => {
      const cleanedLabel = label?.trim()
      return `${prefix}${cleanedLabel ? `Video: ${cleanedLabel}` : "Video"}`
    })
}

export function sanitizeMessageMediaContentForPreview(content: string): string {
  if (!content) {
    return content
  }

  return content
    .replace(MARKDOWN_IMAGE_REGEX, "[Image]")
    .replace(MARKDOWN_VIDEO_LINK_REGEX, "$1[Video]")
    .replace(/\s+/g, " ")
    .trim()
}

export function stripMarkdownMediaPayloads(
  content: string,
  options: StripMarkdownMediaPayloadOptions = {},
): string {
  const imageRegex = options.stripAllImages
    ? MARKDOWN_ANY_IMAGE_PAYLOAD_REGEX
    : MARKDOWN_MEDIA_IMAGE_PAYLOAD_REGEX

  return content
    .replace(imageRegex, "")
    .replace(MARKDOWN_MEDIA_VIDEO_PAYLOAD_REGEX, "$1")
}

export function hasMarkdownMediaPayload(content: string): boolean {
  return /!\[[^\]]*\]\((?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)[^)]*\)/i.test(content) ||
    /(^|[^!])\[[^\]]*\]\((?:https?:\/\/[^)]+\.(?:mp4|m4v|webm|mov|ogv)(?:[?#][^)]*)?|assets:\/\/(?:conversation-video|recording)\/[^)]+)\)/i.test(content)
}

export function normalizeAssistantResponseForDedupe(content: string | undefined): string {
  return (content ?? "").replace(/\s+/g, " ").trim()
}

/**
 * Normalize user-facing preview text for compact conversation/session lists.
 *
 * Thinking markup is useful in the full transcript, but sidebar/search previews
 * should surface readable prose instead of literal `<think>` tags. Prefer text
 * outside closed thought blocks; for an in-flight/open thought, fall back to the
 * thought text so the preview remains meaningful while reasoning is streaming.
 */
export function normalizeMessagePreviewText(value?: string | null): string | null {
  if (!value) return null

  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim() || null
  const openThink = value.match(/<think>([\s\S]*)$/i)
  if (openThink && !/<\/think>/i.test(openThink[1])) {
    const openThinkText = normalize(openThink[1])
    if (openThinkText) return openThinkText
  }

  const withoutClosed = normalize(value.replace(/<think>[\s\S]*?<\/think>/gi, ''))
  if (withoutClosed) return withoutClosed

  const closedThink = value.match(/<think>([\s\S]*?)<\/think>/i)
  const closedThinkText = normalize(closedThink?.[1] ?? '')
  if (closedThinkText) return closedThinkText

  return normalize(value)
}

function sanitizeConversationHistoryForDisplay(
  conversationHistory: AgentProgressUpdate["conversationHistory"]
): AgentProgressUpdate["conversationHistory"] {
  if (!conversationHistory?.length) {
    return conversationHistory
  }

  let changed = false
  const sanitized = conversationHistory.map((entry) => {
    const nextContent = sanitizeMessageContentForDisplay(entry.content)
    const nextDisplayContent = typeof entry.displayContent === "string"
      ? sanitizeMessageContentForDisplay(entry.displayContent)
      : entry.displayContent
    if (nextContent === entry.content && nextDisplayContent === entry.displayContent) {
      return entry
    }
    changed = true
    return { ...entry, content: nextContent, displayContent: nextDisplayContent }
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
