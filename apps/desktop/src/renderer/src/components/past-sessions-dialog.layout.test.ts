import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const pastSessionsDialogSource = readFileSync(
  new URL("./past-sessions-dialog.tsx", import.meta.url),
  "utf8",
)

describe("saved conversations dialog layout", () => {
  it("keeps the toolbar and session rows usable under narrow widths", () => {
    expect(pastSessionsDialogSource).toContain(
      "const desktopConversationListToolbar = conversationListDesktopSurface.toolbar",
    )
    expect(pastSessionsDialogSource).toContain(
      "const desktopConversationListRow = conversationListDesktopSurface.row",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListToolbar.containerClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListToolbar.searchContainerClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.headerClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.titleClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.previewClassName",
    )
    expect(pastSessionsDialogSource).toContain("{entry.isPinned && (")
  })

  it("wraps delete-all confirmation actions instead of clipping them under zoom", () => {
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListDeleteAllConfirm.actionsClassName",
    )
  })

  it("keeps per-session row actions keyboard-accessible", () => {
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.interactiveClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.actionSlotClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.timestampClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.actionsClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.actionButtonClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "desktopConversationListRow.destructiveActionButtonClassName",
    )
    expect(pastSessionsDialogSource).toContain(
      "deleteAction.accessibilityLabel",
    )
  })

  it("includes a keyboard-accessible pin action and pinned-first sort for saved conversations", () => {
    expect(pastSessionsDialogSource).toContain(
      "orderConversationHistoryByPinnedFirst",
    )
    expect(pastSessionsDialogSource).toContain(
      "const activeConversationsQuery = useQuery<SessionListResponse>({",
    )
    expect(pastSessionsDialogSource).toContain(
      "APP_CONVERSATION_LIST_SECTION_LABELS[entry.kind]",
    )
    expect(pastSessionsDialogSource).toContain(
      "orderConversationHistoryByPinnedFirst<",
    )
    expect(pastSessionsDialogSource).toContain("KEYBOARD_SHORTCUT_HINT")
    expect(pastSessionsDialogSource).toContain("PIN_SHORTCUT_HINT")
    expect(pastSessionsDialogSource).toContain("VOICE_SHORTCUT_HINT")
    expect(pastSessionsDialogSource).toContain(
      "getConversationListDesktopSurfaceState",
    )
    expect(pastSessionsDialogSource).toContain(
      "getConversationListPinActionPresentation",
    )
    expect(pastSessionsDialogSource).toContain(
      "getConversationListArchiveActionPresentation",
    )
    expect(pastSessionsDialogSource).toContain(
      "getConversationListDeleteActionPresentation",
    )
    expect(pastSessionsDialogSource).toContain("pinAction.accessibilityLabel")
    expect(pastSessionsDialogSource).toContain(
      "archiveAction.accessibilityLabel",
    )
    expect(pastSessionsDialogSource).toContain(
      "stopConversationRowKeyPropagation",
    )
    expect(pastSessionsDialogSource).toContain("data-highlighted={")
    expect(pastSessionsDialogSource).not.toContain(
      "inline-flex max-w-full items-center gap-1 rounded-full border border-border/60 bg-accent/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground",
    )
    expect(pastSessionsDialogSource).not.toContain("CheckCircle2")
  })
})
