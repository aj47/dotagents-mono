import type { AgentProgressUpdate } from "./agent-progress"
import {
  hasMarkdownMediaImageReference,
  hasMarkdownVideoLink,
  replaceMarkdownImageReferences,
  replaceMarkdownVideoLinks,
  stripMarkdownImageReferences,
  stripMarkdownVideoLinks,
} from "./conversation-media-assets"

// Inline data URLs can be megabytes long; replace them in display/budget text.
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

  return replaceMarkdownImageReferences(content, (reference) => {
    if (!reference.url.trim().toLowerCase().startsWith("data:image/")) {
      return reference.fullMatch
    }

    const cleanedAlt = reference.altText.trim()
    return cleanedAlt ? `[Image: ${cleanedAlt}]` : "[Image]"
  })
}

export function sanitizeMessageContentForSpeech(content: string): string {
  if (!content) {
    return content
  }

  // Strip markdown image payloads (including inline data URLs) before TTS.
  // This keeps speech requests small and avoids reading non-verbal content.
  const contentWithoutImages = replaceMarkdownImageReferences(content, (reference) => {
    const cleanedAlt = reference.altText.trim()
    return cleanedAlt ? `Image: ${cleanedAlt}` : "Image"
  })

  return replaceMarkdownVideoLinks(contentWithoutImages, (reference) => {
    const cleanedLabel = reference.label.trim()
    return cleanedLabel ? `Video: ${cleanedLabel}` : "Video"
  })
}

export function sanitizeMessageMediaContentForPreview(content: string): string {
  if (!content) {
    return content
  }

  return replaceMarkdownVideoLinks(
    replaceMarkdownImageReferences(content, () => "[Image]"),
    () => "[Video]",
  )
    .replace(/\s+/g, " ")
    .trim()
}

export function stripMarkdownMediaPayloads(
  content: string,
  options: StripMarkdownMediaPayloadOptions = {},
): string {
  return stripMarkdownVideoLinks(
    stripMarkdownImageReferences(content, { mediaOnly: !options.stripAllImages }),
    { allowRecordingAssetUrls: true },
  )
}

export function hasMarkdownMediaPayload(content: string): boolean {
  return hasMarkdownMediaImageReference(content) ||
    hasMarkdownVideoLink(content, { allowRecordingAssetUrls: true })
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
