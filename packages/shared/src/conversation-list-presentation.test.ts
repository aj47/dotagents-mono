import { describe, expect, it } from "vitest"

import {
  APP_CONVERSATION_LIST_COPY,
  APP_CONVERSATION_LIST_SECTION_LABELS,
  CONVERSATION_LIST_DESKTOP_PRESENTATION,
  CONVERSATION_LIST_MOBILE_PRESENTATION,
  getConversationListArchiveActionPresentation,
  getConversationArchiveFilterLabel,
  getConversationListDesktopSurfaceState,
  getConversationListDeleteActionPresentation,
  getConversationListEmptyState,
  getConversationListItemAccessibilityLabel,
  getConversationListMessageCountLabel,
  getConversationListMobileSurfaceColors,
  getConversationListMobileSurfaceState,
  getConversationListPinActionPresentation,
  normalizeConversationListPreviewText,
} from "./conversation-list-presentation"

describe("conversation list presentation", () => {
  it("normalizes previews consistently across app shells", () => {
    expect(normalizeConversationListPreviewText("")).toBe("No messages yet")
    expect(
      normalizeConversationListPreviewText('tool: [{"name":"read"}]'),
    ).toBe("Used a tool")
    expect(normalizeConversationListPreviewText('done {"success":true}')).toBe(
      "Used a tool",
    )
    expect(normalizeConversationListPreviewText('before {"a":1} after')).toBe(
      "before {...} after",
    )
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
    expect(getConversationArchiveFilterLabel("archived", 4)).toBe(
      "Archived (4)",
    )

    expect(
      getConversationListEmptyState({ mode: "active", hasActiveSearch: false }),
    ).toMatchObject({
      title: "No chats yet",
      actionLabel: "Start first chat",
    })
    expect(
      getConversationListEmptyState({
        mode: "archived",
        hasActiveSearch: true,
      }),
    ).toMatchObject({
      title: "No matching archived chats",
      actionLabel: "Clear search",
    })
  })

  it("shares desktop section labels with mobile conversation surfaces", () => {
    expect(APP_CONVERSATION_LIST_SECTION_LABELS.active).toBe(
      "Active conversations",
    )
    expect(APP_CONVERSATION_LIST_SECTION_LABELS.saved).toBe(
      "Saved conversations",
    )
  })

  it("keeps mobile search and filter controls in the shared presentation contract", () => {
    expect(APP_CONVERSATION_LIST_COPY.loadingLabel).toBe("Loading chats...")
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.screen).toMatchObject({
      container: {
        backgroundColorToken: "background",
      },
      loadingText: {
        colorToken: "mutedForeground",
      },
      primaryActionButton: {
        backgroundColorToken: "primary",
        borderRadius: "lg",
      },
    })
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.header).toMatchObject({
      title: {
        fontSize: 17,
        colorToken: "foreground",
      },
      agentSelectorChip: {
        marginTop: 2,
      },
      newChatButton: {
        backgroundColorToken: "primary",
        borderRadius: "lg",
        marginLeft: "xs",
      },
      newChatText: {
        colorToken: "primaryForeground",
      },
    })
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.listShell).toMatchObject({
      searchSection: {
        paddingHorizontal: "md",
        paddingTop: "sm",
        paddingBottom: "xs",
        gap: "xs",
      },
      searchInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: "sm",
      },
      searchInput: {
        flex: 1,
        placeholderColorToken: "mutedForeground",
      },
      list: {
        padding: "md",
      },
      emptyList: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
    })
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.searchClear).toMatchObject({
      label: "Clear",
      accessibilityLabel: "Clear chat search",
      accessibilityHint: "Clears the current chat search query.",
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.searchClear.button,
    ).toMatchObject({
      horizontalPadding: "sm",
      verticalPadding: "xs",
      borderRadius: "lg",
    })

    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.archiveFilter.row,
    ).toMatchObject({
      flexDirection: "row",
      gap: "xs",
      flexWrap: "wrap",
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.archiveFilter.selectedButton,
    ).toMatchObject({
      borderColorToken: "primary",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.07,
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.rowAction.activeButton,
    ).toMatchObject({
      borderColorToken: "primary",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.07,
    })
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.sessionRow).toMatchObject({
      item: {
        backgroundColorToken: "card",
        borderRadius: "xl",
        padding: "md",
        marginBottom: "sm",
        borderWidth: 1,
        borderColorToken: "border",
      },
      activeItem: {
        borderColorToken: "primary",
        borderWidth: 2,
      },
      pressedItem: {
        opacity: 0.92,
      },
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
      },
      titleRow: {
        flex: 1,
        minWidth: 0,
        marginRight: 8,
      },
      title: {
        fontSize: 15,
        colorToken: "foreground",
      },
      previewMeta: {
        typographyToken: "caption",
        colorToken: "mutedForeground",
      },
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.sessionRow.title.numberOfLines,
    ).toBe(1)
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.sessionRow.preview.numberOfLines,
    ).toBe(1)
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.emptyState).toMatchObject({
      container: {
        width: "100%",
        maxWidth: 360,
        padding: "xl",
      },
      textGroup: {
        marginBottom: "lg",
      },
      button: {
        width: "100%",
        maxWidth: 280,
      },
      buttonText: {
        colorToken: "primaryForeground",
        textAlign: "center",
      },
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.disconnectedState,
    ).toMatchObject({
      screen: {
        justifyContent: "center",
        padding: "md",
      },
      card: {
        width: "100%",
        maxWidth: 420,
        backgroundColorToken: "card",
        borderRadius: "xl",
        padding: "xl",
      },
      title: {
        typographyToken: "h2",
      },
      subtitle: {
        typographyToken: "body",
        colorToken: "mutedForeground",
      },
      meta: {
        typographyToken: "caption",
        colorToken: "mutedForeground",
      },
      secondaryButtonText: {
        colorToken: "foreground",
        fontWeight: "600",
        textAlign: "center",
      },
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.disconnectedState.meta
        .numberOfLines,
    ).toBe(2)
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.rapidFire).toMatchObject({
      container: {
        borderTopWidthToken: "hairline",
        borderTopColorToken: "border",
        backgroundColorToken: "card",
        paddingHorizontal: "sm",
      },
      hint: {
        typographyToken: "caption",
        colorToken: "mutedForeground",
        textAlign: "center",
      },
      transcript: {
        typographyToken: "body",
        colorToken: "foreground",
        textAlign: "center",
        paddingHorizontal: "md",
      },
      button: {
        width: "100%",
        heightScreenRatio: 0.18,
        borderRadius: "xl",
        borderWidth: 1.5,
        borderColorToken: "border",
        backgroundColorToken: "background",
      },
      activeButton: {
        backgroundColorToken: "primary",
        borderColorToken: "primary",
      },
      pressedButton: {
        opacity: 0.8,
      },
      buttonIconText: {
        fontSize: 36,
      },
      buttonLabel: {
        fontSize: 13,
        colorToken: "mutedForeground",
        fontWeight: "600",
      },
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.rapidFire.transcript.numberOfLines,
    ).toBe(2)
    expect(CONVERSATION_LIST_MOBILE_PRESENTATION.renameDialog).toMatchObject({
      actionLabel: "Rename",
      failureTitle: "Rename Failed",
      title: "Rename conversation title",
      inputPlaceholder: "Chat title",
      input: {
        placeholderColorToken: "mutedForeground",
      },
      cancelLabel: "Cancel",
      saveLabel: "Save",
      savingLabel: "Saving...",
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.renameDialog.overlay,
    ).toMatchObject({
      color: "#000000",
      alpha: 0.45,
      padding: "lg",
    })
    expect(
      CONVERSATION_LIST_MOBILE_PRESENTATION.renameDialog.content,
    ).toMatchObject({
      maxWidth: 420,
      backgroundColorToken: "card",
      borderRadius: "xl",
      borderColorToken: "border",
    })
    expect(getConversationListMobileSurfaceState()).toBe(
      CONVERSATION_LIST_MOBILE_PRESENTATION,
    )
  })

  it("resolves mobile conversation list colors from shared palette tokens", () => {
    const colors = getConversationListMobileSurfaceColors({
      background: "#fdfdfd",
      card: "#ffffff",
      border: "#dedede",
      foreground: "#111111",
      mutedForeground: "#777777",
      primary: "#123456",
      primaryForeground: "#fafafa",
    })

    expect(colors).toMatchObject({
      screen: {
        containerBackgroundColor: "#fdfdfd",
        loadingTextColor: "#777777",
        primaryActionButtonBackgroundColor: "#123456",
      },
      header: {
        titleColor: "#111111",
        newChatButtonBackgroundColor: "#123456",
        newChatTextColor: "#fafafa",
      },
      listShell: {
        searchInputPlaceholderColor: "#777777",
      },
      searchClear: {
        textColor: "#123456",
      },
      archiveFilter: {
        buttonBorderColor: "#dedede",
        buttonBackgroundColor: "#fdfdfd",
        selectedButtonBorderColor: "#123456",
        selectedButtonBackgroundColor: "rgba(18, 52, 86, 0.07)",
        textColor: "#777777",
        selectedTextColor: "#123456",
      },
      rowAction: {
        buttonBorderColor: "#dedede",
        buttonBackgroundColor: "#fdfdfd",
        activeButtonBorderColor: "#123456",
        activeButtonBackgroundColor: "rgba(18, 52, 86, 0.07)",
        textColor: "#777777",
        activeTextColor: "#123456",
      },
      sessionRow: {
        itemBackgroundColor: "#ffffff",
        itemBorderColor: "#dedede",
        activeItemBorderColor: "#123456",
        titleColor: "#111111",
        dateColor: "#777777",
        previewColor: "#777777",
        previewMetaColor: "#777777",
      },
      emptyState: {
        subtitleColor: "#777777",
        buttonTextColor: "#fafafa",
      },
      disconnectedState: {
        cardBackgroundColor: "#ffffff",
        cardBorderColor: "#dedede",
        subtitleColor: "#777777",
        metaColor: "#777777",
        secondaryButtonBorderColor: "#dedede",
        secondaryButtonTextColor: "#111111",
      },
      rapidFire: {
        containerBorderTopColor: "#dedede",
        containerBackgroundColor: "#ffffff",
        hintColor: "#777777",
        transcriptColor: "#111111",
        buttonBorderColor: "#dedede",
        buttonBackgroundColor: "#fdfdfd",
        activeButtonBackgroundColor: "#123456",
        activeButtonBorderColor: "#123456",
        buttonLabelColor: "#777777",
      },
      renameDialog: {
        overlayBackgroundColor: "rgba(0, 0, 0, 0.45)",
        contentBackgroundColor: "#ffffff",
        contentBorderColor: "#dedede",
        inputPlaceholderColor: "#777777",
        cancelButtonBorderColor: "#dedede",
        cancelButtonBackgroundColor: "#fdfdfd",
        cancelTextColor: "#111111",
        saveButtonBackgroundColor: "#123456",
        saveTextColor: "#fafafa",
      },
    })
  })

  it("keeps desktop saved conversation layout in the shared presentation contract", () => {
    expect(getConversationListDesktopSurfaceState()).toBe(
      CONVERSATION_LIST_DESKTOP_PRESENTATION,
    )
    expect(CONVERSATION_LIST_DESKTOP_PRESENTATION.dialog).toMatchObject({
      contentClassName:
        "max-w-sm w-[calc(100%-2rem)] overflow-hidden grid-cols-1",
      titleClassName: "flex items-center gap-2",
      descriptionClassName: "line-clamp-2",
    })
    expect(CONVERSATION_LIST_DESKTOP_PRESENTATION.toolbar).toMatchObject({
      containerClassName: "flex shrink-0 flex-wrap items-center gap-2",
      searchContainerClassName: "relative min-w-0 flex-1",
      searchInputClassName: "pl-7 pr-12 text-xs w-full",
    })
    expect(
      CONVERSATION_LIST_DESKTOP_PRESENTATION.deleteAllConfirm.actionsClassName,
    ).toBe("flex flex-wrap items-center justify-end gap-2")
    expect(CONVERSATION_LIST_DESKTOP_PRESENTATION.list).toMatchObject({
      containerClassName:
        "max-h-[50vh] sm:max-h-[60vh] space-y-1 overflow-y-auto pr-1",
      sectionLabelClassName:
        "text-muted-foreground px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide",
    })
    expect(CONVERSATION_LIST_DESKTOP_PRESENTATION.row).toMatchObject({
      headerClassName: "flex flex-wrap items-start gap-2",
      titleClassName: "min-w-0 flex-1 truncate font-medium",
      previewClassName:
        "text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed break-words [overflow-wrap:anywhere]",
      actionSlotClassName:
        "ml-auto grid shrink-0 place-items-center self-start",
    })
    expect(
      CONVERSATION_LIST_DESKTOP_PRESENTATION.row.interactiveClassName,
    ).toContain("focus-visible:ring-2 focus-visible:ring-ring")
    expect(
      CONVERSATION_LIST_DESKTOP_PRESENTATION.row.actionsClassName,
    ).toContain("group-hover:opacity-100")
  })

  it("shares pin and archive action labels across conversation list surfaces", () => {
    expect(
      getConversationListPinActionPresentation({
        title: "Launch notes",
        isPinned: false,
      }),
    ).toMatchObject({
      actionLabel: "Pin",
      displayLabel: "Pin",
      title: "Pin conversation",
      accessibilityLabel: "Pin Launch notes",
      accessibilityHint: "Keeps this chat at the top of the chats list.",
    })
    expect(
      getConversationListPinActionPresentation({
        title: "Launch notes",
        isPinned: true,
      }),
    ).toMatchObject({
      actionLabel: "Unpin",
      displayLabel: "Pinned",
      title: "Unpin conversation",
      accessibilityLabel: "Unpin Launch notes",
      accessibilityHint: "Removes this chat from the pinned chats list.",
    })

    expect(
      getConversationListArchiveActionPresentation({
        title: "Launch notes",
        isArchived: false,
      }),
    ).toMatchObject({
      actionLabel: "Archive",
      displayLabel: "Archive",
      title: "Archive conversation",
      accessibilityLabel: "Archive Launch notes",
      accessibilityHint: "Moves this chat to the archived chats list.",
    })
    expect(
      getConversationListArchiveActionPresentation({
        title: "",
        isArchived: true,
      }),
    ).toMatchObject({
      actionLabel: "Unarchive",
      displayLabel: "Unarchive",
      title: "Unarchive conversation",
      accessibilityLabel: "Unarchive Untitled conversation",
      accessibilityHint: "Moves this chat back to the chats list.",
    })

    expect(
      getConversationListDeleteActionPresentation({ title: "Launch notes" }),
    ).toMatchObject({
      actionLabel: "Delete",
      title: "Delete conversation",
      accessibilityLabel: "Delete Launch notes",
      confirmationTitle: "Delete conversation",
      confirmationMessage: 'Are you sure you want to delete "Launch notes"?',
      webConfirmationMessage: 'Delete "Launch notes"?',
      failureTitle: "Delete Failed",
      cancelLabel: "Cancel",
    })
    expect(
      getConversationListDeleteActionPresentation({ title: "  " })
        .accessibilityLabel,
    ).toBe("Delete Untitled conversation")
  })
})
