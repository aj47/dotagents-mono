import type { ConversationHistoryItem } from "@shared/types"

const FALLBACK_PREVIEW_TITLE_LIMIT = 60

function getPreviewTitleCandidate(preview: string): string | null {
  const previewSegments = preview.split(/\s+\|\s+/)

  for (const segment of previewSegments) {
    const candidate = segment.replace(/^(user|assistant|tool):\s*/i, "").trim()
    if (candidate) {
      return candidate
    }
  }

  return null
}

export function getConversationHistoryDisplayTitle(
  session: Pick<ConversationHistoryItem, "id" | "title" | "preview">,
): string {
  const title = session.title.trim()
  if (title) {
    return title
  }

  const previewTitle = getPreviewTitleCandidate(session.preview)
  if (previewTitle) {
    return previewTitle.length > FALLBACK_PREVIEW_TITLE_LIMIT
      ? `${previewTitle.slice(0, FALLBACK_PREVIEW_TITLE_LIMIT - 3)}...`
      : previewTitle
  }

  return `Session ${session.id.slice(0, 8)}`
}