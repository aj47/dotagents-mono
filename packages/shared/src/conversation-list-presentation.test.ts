import { describe, expect, it } from "vitest"

import {
  APP_CONVERSATION_LIST_SECTION_LABELS,
  getConversationArchiveFilterLabel,
  getConversationListEmptyState,
  getConversationListItemAccessibilityLabel,
  getConversationListMessageCountLabel,
  normalizeConversationListPreviewText,
} from "./conversation-list-presentation"

describe("conversation list presentation", () => {
  it("normalizes previews consistently across app shells", () => {
    expect(normalizeConversationListPreviewText("")).toBe("No messages yet")
    expect(normalizeConversationListPreviewText('tool: [{"name":"read"}]')).toBe("Used a tool")
    expect(normalizeConversationListPreviewText('done {"success":true}')).toBe("Used a tool")
    expect(normalizeConversationListPreviewText('before {"a":1} after')).toBe("before {...} after")
  })

  it("formats shared message count and accessibility labels", () => {
    expect(getConversationListMessageCountLabel(1)).toBe("1 message")
    expect(
      getConversationListMessageCountLabel(3, { sourceLabel: "from desktop" }),
    ).toBe("3 messages · from desktop")
    expect(
      getConversationListItemAccessibilityLabel({
        title: "Launch notes",
        isPinned: true,
        isArchived: true,
        messageCount: 2,
        statusLabel: "Saved",
      }),
    ).toBe("Pinned, Archived, Launch notes, 2 messages, Saved")
  })

  it("keeps list filters and empty states in one contract", () => {
    expect(getConversationArchiveFilterLabel("active", 5)).toBe("Chats")
    expect(getConversationArchiveFilterLabel("archived", 0)).toBe("Archived")
    expect(getConversationArchiveFilterLabel("archived", 4)).toBe("Archived (4)")

    expect(getConversationListEmptyState({ mode: "active", hasActiveSearch: false })).toMatchObject({
      title: "No chats yet",
      actionLabel: "Start first chat",
    })
    expect(getConversationListEmptyState({ mode: "archived", hasActiveSearch: true })).toMatchObject({
      title: "No matching archived chats",
      actionLabel: "Clear search",
    })
  })

  it("shares desktop section labels with mobile conversation surfaces", () => {
    expect(APP_CONVERSATION_LIST_SECTION_LABELS.active).toBe("Active conversations")
    expect(APP_CONVERSATION_LIST_SECTION_LABELS.saved).toBe("Saved conversations")
  })
})
