import type { SessionArchiveMode } from "./session"

export const APP_CONVERSATION_LIST_COPY = {
  searchPlaceholder: "Search chats...",
  searchAccessibilityHint: "Search chat titles, previews, and loaded message text.",
  noMessagesFallback: "No messages yet",
  desktopSourceLabel: "from desktop",
} as const

export const APP_CONVERSATION_LIST_SECTION_LABELS = {
  active: "Active conversations",
  saved: "Saved conversations",
} as const

export type ConversationListEmptyState = {
  title: string
  subtitle: string
  actionLabel: string
  actionHint: string
}

export type ConversationListItemAccessibilityInput = {
  title: string
  isPinned?: boolean
  isArchived?: boolean
  messageCount?: number
  statusLabel?: string
}

export function normalizeConversationListPreviewText(
  rawPreview: string | null | undefined,
  fallback: string = APP_CONVERSATION_LIST_COPY.noMessagesFallback,
): string {
  const preview = rawPreview?.trim() || fallback

  if (preview.startsWith("tool: [") || preview.includes('{"success":')) {
    return "Used a tool"
  }

  if (preview.includes('{"')) {
    const normalized = preview.replace(/\{.*\}/g, "{...}").trim()
    return normalized || "Used a tool"
  }

  return preview
}

export function getConversationListMessageCountLabel(
  messageCount: number,
  options: { sourceLabel?: string | null } = {},
): string {
  const normalizedCount = Number.isFinite(messageCount)
    ? Math.max(0, Math.trunc(messageCount))
    : 0
  const messageLabel = `${normalizedCount} message${normalizedCount === 1 ? "" : "s"}`
  const sourceLabel = options.sourceLabel?.trim()

  return sourceLabel ? `${messageLabel} · ${sourceLabel}` : messageLabel
}

export function getConversationListItemAccessibilityLabel(
  input: ConversationListItemAccessibilityInput,
): string {
  const title = input.title.trim() || "Untitled conversation"
  const parts: string[] = []

  if (input.isPinned) parts.push("Pinned")
  if (input.isArchived) parts.push("Archived")
  parts.push(title)

  if (typeof input.messageCount === "number") {
    parts.push(getConversationListMessageCountLabel(input.messageCount))
  }

  if (input.statusLabel?.trim()) {
    parts.push(input.statusLabel.trim())
  }

  return parts.join(", ")
}

export function getConversationArchiveFilterLabel(
  mode: SessionArchiveMode,
  archiveCount: number = 0,
): string {
  if (mode !== "archived") return "Chats"
  const normalizedCount = Number.isFinite(archiveCount)
    ? Math.max(0, Math.trunc(archiveCount))
    : 0

  return normalizedCount > 0 ? `Archived (${normalizedCount})` : "Archived"
}

export function getConversationListEmptyState(options: {
  mode: SessionArchiveMode
  hasActiveSearch: boolean
}): ConversationListEmptyState {
  if (options.hasActiveSearch) {
    return {
      title: options.mode === "archived"
        ? "No matching archived chats"
        : "No matching chats",
      subtitle: "Try a different keyword or clear search.",
      actionLabel: "Clear search",
      actionHint: "Clears the current chat search query.",
    }
  }

  if (options.mode === "archived") {
    return {
      title: "No archived chats",
      subtitle: "Your archived chat list is empty.",
      actionLabel: "View chats",
      actionHint: "Returns to the chats list.",
    }
  }

  return {
    title: "No chats yet",
    subtitle: "Start your first chat so recent conversations show up here.",
    actionLabel: "Start first chat",
    actionHint: "Creates and opens your first chat.",
  }
}
