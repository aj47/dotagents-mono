import type { SessionArchiveMode } from "./session"
import { hexToRgba } from "./colors"

export const APP_CONVERSATION_LIST_COPY = {
  loadingLabel: "Loading chats...",
  searchPlaceholder: "Search chats...",
  searchAccessibilityHint:
    "Search chat titles, previews, and loaded message text.",
  noMessagesFallback: "No messages yet",
  desktopSourceLabel: "from desktop",
} as const

export const APP_CONVERSATION_LIST_SECTION_LABELS = {
  active: "Active conversations",
  saved: "Saved conversations",
} as const

export const CONVERSATION_LIST_MOBILE_PRESENTATION = {
  screen: {
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
  },
  header: {
    title: {
      fontSize: 17,
      fontWeight: "600",
      colorToken: "foreground",
    },
    agentSelectorChip: {
      marginTop: 2,
    },
    newChatButton: {
      horizontalPadding: "sm",
      verticalPadding: "xs",
      horizontalMargin: 0,
      backgroundColorToken: "primary",
      borderRadius: "lg",
      marginLeft: "xs",
    },
    newChatText: {
      colorToken: "primaryForeground",
      fontSize: 12,
      fontWeight: "600",
    },
  },
  listShell: {
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
  },
  searchClear: {
    label: "Clear",
    accessibilityLabel: "Clear chat search",
    accessibilityHint: "Clears the current chat search query.",
    button: {
      horizontalPadding: "sm",
      verticalPadding: "xs",
      horizontalMargin: 0,
      borderRadius: "lg",
    },
    text: {
      colorToken: "primary",
      fontWeight: "600",
    },
  },
  archiveFilter: {
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: "xs",
      flexWrap: "wrap",
    },
    button: {
      horizontalPadding: "sm",
      verticalPadding: "xs",
      horizontalMargin: 0,
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "background",
    },
    selectedButton: {
      borderColorToken: "primary",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.07,
    },
    text: {
      typographyToken: "caption",
      colorToken: "mutedForeground",
      fontWeight: "600",
    },
    selectedText: {
      colorToken: "primary",
    },
  },
  rowAction: {
    button: {
      horizontalPadding: "xs",
      verticalPadding: "xs",
      horizontalMargin: 0,
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "background",
    },
    activeButton: {
      borderColorToken: "primary",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.07,
    },
    text: {
      typographyToken: "caption",
      colorToken: "mutedForeground",
      fontWeight: "600",
    },
    activeText: {
      colorToken: "primary",
    },
  },
  sessionRow: {
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
      marginBottom: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    headerMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: "xs",
      marginLeft: "sm",
    },
    title: {
      numberOfLines: 1,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
      colorToken: "foreground",
      flex: 1,
      minWidth: 0,
    },
    date: {
      typographyToken: "caption",
      colorToken: "mutedForeground",
    },
    preview: {
      numberOfLines: 1,
      typographyToken: "caption",
      colorToken: "mutedForeground",
    },
    previewMeta: {
      typographyToken: "caption",
      colorToken: "mutedForeground",
      fontWeight: "500",
    },
  },
  emptyState: {
    container: {
      alignItems: "center",
      width: "100%",
      maxWidth: 360,
      padding: "xl",
    },
    textGroup: {
      alignItems: "center",
      marginBottom: "lg",
    },
    title: {
      typographyToken: "h2",
      marginBottom: "sm",
      textAlign: "center",
    },
    subtitle: {
      typographyToken: "body",
      colorToken: "mutedForeground",
      textAlign: "center",
    },
    button: {
      width: "100%",
      maxWidth: 280,
    },
    buttonText: {
      colorToken: "primaryForeground",
      fontWeight: "600",
      textAlign: "center",
    },
  },
  disconnectedState: {
    screen: {
      justifyContent: "center",
      padding: "md",
    },
    container: {
      width: "100%",
      alignItems: "center",
    },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColorToken: "card",
      borderRadius: "xl",
      borderWidth: 1,
      borderColorToken: "border",
      padding: "xl",
      gap: "md",
    },
    statusRow: {
      alignItems: "flex-start",
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
      numberOfLines: 2,
    },
    primaryButton: {
      alignSelf: "center",
      minWidth: 200,
    },
    secondaryButton: {
      alignSelf: "center",
      minWidth: 200,
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      alignItems: "center",
    },
    secondaryButtonText: {
      colorToken: "foreground",
      fontWeight: "600",
      textAlign: "center",
    },
  },
  rapidFire: {
    container: {
      borderTopWidthToken: "hairline",
      borderTopColorToken: "border",
      backgroundColorToken: "card",
      paddingHorizontal: "sm",
      paddingTop: "xs",
      paddingBottom: "sm",
      alignItems: "center",
    },
    hint: {
      typographyToken: "caption",
      colorToken: "mutedForeground",
      marginBottom: "xs",
      textAlign: "center",
    },
    transcript: {
      numberOfLines: 2,
      typographyToken: "body",
      colorToken: "foreground",
      textAlign: "center",
      marginBottom: "xs",
      paddingHorizontal: "md",
    },
    button: {
      width: "100%",
      heightScreenRatio: 0.18,
      borderRadius: "xl",
      borderWidth: 1.5,
      borderColorToken: "border",
      backgroundColorToken: "background",
      alignItems: "center",
      justifyContent: "center",
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
      marginTop: 4,
      fontWeight: "600",
    },
  },
  renameDialog: {
    actionLabel: "Rename",
    failureTitle: "Rename Failed",
    title: "Rename conversation title",
    inputPlaceholder: "Chat title",
    inputAccessibilityLabel: "Chat title",
    input: {
      placeholderColorToken: "mutedForeground",
    },
    cancelLabel: "Cancel",
    cancelAccessibilityLabel: "Cancel rename",
    saveLabel: "Save",
    savingLabel: "Saving...",
    saveAccessibilityLabel: "Save chat title",
    overlay: {
      color: "#000000",
      alpha: 0.45,
      padding: "lg",
    },
    content: {
      width: "100%",
      maxWidth: 420,
      backgroundColorToken: "card",
      borderRadius: "xl",
      borderWidth: 1,
      borderColorToken: "border",
      padding: "lg",
      gap: "md",
    },
    titleText: {
      typographyToken: "h2",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "sm",
      flexWrap: "wrap",
    },
    actionButton: {
      horizontalPadding: "md",
      verticalPadding: "sm",
      horizontalMargin: 0,
      borderRadius: "lg",
      alignItems: "center",
    },
    cancelButton: {
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "background",
    },
    cancelText: {
      colorToken: "foreground",
      fontWeight: "600",
    },
    saveButton: {
      backgroundColorToken: "primary",
      disabledOpacity: 0.65,
    },
    saveText: {
      colorToken: "primaryForeground",
      fontWeight: "600",
    },
  },
} as const satisfies {
  screen: {
    container: {
      backgroundColorToken: string
    }
    loadingText: {
      colorToken: string
    }
    primaryActionButton: {
      backgroundColorToken: string
      borderRadius: string
    }
  }
  header: {
    title: {
      fontSize: number
      fontWeight: string
      colorToken: string
    }
    agentSelectorChip: {
      marginTop: number
    }
    newChatButton: {
      horizontalPadding: string
      verticalPadding: string
      horizontalMargin: number
      backgroundColorToken: string
      borderRadius: string
      marginLeft: string
    }
    newChatText: {
      colorToken: string
      fontSize: number
      fontWeight: string
    }
  }
  listShell: {
    searchSection: {
      paddingHorizontal: string
      paddingTop: string
      paddingBottom: string
      gap: string
    }
    searchInputRow: {
      flexDirection: string
      alignItems: string
      gap: string
    }
    searchInput: {
      flex: number
      placeholderColorToken: string
    }
    list: {
      padding: string
    }
    emptyList: {
      flex: number
      justifyContent: string
      alignItems: string
    }
  }
  searchClear: {
    label: string
    accessibilityLabel: string
    accessibilityHint: string
    button: {
      horizontalPadding: string
      verticalPadding: string
      horizontalMargin: number
      borderRadius: string
    }
    text: {
      colorToken: string
      fontWeight: string
    }
  }
  archiveFilter: {
    row: {
      flexDirection: string
      alignItems: string
      gap: string
      flexWrap: string
    }
    button: {
      horizontalPadding: string
      verticalPadding: string
      horizontalMargin: number
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      backgroundColorToken: string
    }
    selectedButton: {
      borderColorToken: string
      backgroundColorToken: string
      backgroundAlpha: number
    }
    text: {
      typographyToken: string
      colorToken: string
      fontWeight: string
    }
    selectedText: {
      colorToken: string
    }
  }
  rowAction: {
    button: {
      horizontalPadding: string
      verticalPadding: string
      horizontalMargin: number
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      backgroundColorToken: string
    }
    activeButton: {
      borderColorToken: string
      backgroundColorToken: string
      backgroundAlpha: number
    }
    text: {
      typographyToken: string
      colorToken: string
      fontWeight: string
    }
    activeText: {
      colorToken: string
    }
  }
  sessionRow: {
    item: {
      backgroundColorToken: string
      borderRadius: string
      padding: string
      marginBottom: string
      borderWidth: number
      borderColorToken: string
    }
    activeItem: {
      borderColorToken: string
      borderWidth: number
    }
    pressedItem: {
      opacity: number
    }
    header: {
      flexDirection: string
      justifyContent: string
      marginBottom: number
    }
    titleRow: {
      flexDirection: string
      alignItems: string
      flex: number
      minWidth: number
      marginRight: number
    }
    headerMeta: {
      flexDirection: string
      alignItems: string
      gap: string
      marginLeft: string
    }
    title: {
      numberOfLines: number
      fontSize: number
      lineHeight: number
      fontWeight: string
      colorToken: string
      flex: number
      minWidth: number
    }
    date: {
      typographyToken: string
      colorToken: string
    }
    preview: {
      numberOfLines: number
      typographyToken: string
      colorToken: string
    }
    previewMeta: {
      typographyToken: string
      colorToken: string
      fontWeight: string
    }
  }
  emptyState: {
    container: {
      alignItems: string
      width: string
      maxWidth: number
      padding: string
    }
    textGroup: {
      alignItems: string
      marginBottom: string
    }
    title: {
      typographyToken: string
      marginBottom: string
      textAlign: string
    }
    subtitle: {
      typographyToken: string
      colorToken: string
      textAlign: string
    }
    button: {
      width: string
      maxWidth: number
    }
    buttonText: {
      colorToken: string
      fontWeight: string
      textAlign: string
    }
  }
  disconnectedState: {
    screen: {
      justifyContent: string
      padding: string
    }
    container: {
      width: string
      alignItems: string
    }
    card: {
      width: string
      maxWidth: number
      backgroundColorToken: string
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      padding: string
      gap: string
    }
    statusRow: {
      alignItems: string
    }
    title: {
      typographyToken: string
    }
    subtitle: {
      typographyToken: string
      colorToken: string
    }
    meta: {
      typographyToken: string
      colorToken: string
      numberOfLines: number
    }
    primaryButton: {
      alignSelf: string
      minWidth: number
    }
    secondaryButton: {
      alignSelf: string
      minWidth: number
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      alignItems: string
    }
    secondaryButtonText: {
      colorToken: string
      fontWeight: string
      textAlign: string
    }
  }
  rapidFire: {
    container: {
      borderTopWidthToken: string
      borderTopColorToken: string
      backgroundColorToken: string
      paddingHorizontal: string
      paddingTop: string
      paddingBottom: string
      alignItems: string
    }
    hint: {
      typographyToken: string
      colorToken: string
      marginBottom: string
      textAlign: string
    }
    transcript: {
      numberOfLines: number
      typographyToken: string
      colorToken: string
      textAlign: string
      marginBottom: string
      paddingHorizontal: string
    }
    button: {
      width: string
      heightScreenRatio: number
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      backgroundColorToken: string
      alignItems: string
      justifyContent: string
    }
    activeButton: {
      backgroundColorToken: string
      borderColorToken: string
    }
    pressedButton: {
      opacity: number
    }
    buttonIconText: {
      fontSize: number
    }
    buttonLabel: {
      fontSize: number
      colorToken: string
      marginTop: number
      fontWeight: string
    }
  }
  renameDialog: {
    actionLabel: string
    failureTitle: string
    title: string
    inputPlaceholder: string
    inputAccessibilityLabel: string
    input: {
      placeholderColorToken: string
    }
    cancelLabel: string
    cancelAccessibilityLabel: string
    saveLabel: string
    savingLabel: string
    saveAccessibilityLabel: string
    overlay: {
      color: string
      alpha: number
      padding: string
    }
    content: {
      width: string
      maxWidth: number
      backgroundColorToken: string
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      padding: string
      gap: string
    }
    titleText: {
      typographyToken: string
    }
    actions: {
      flexDirection: string
      justifyContent: string
      alignItems: string
      gap: string
      flexWrap: string
    }
    actionButton: {
      horizontalPadding: string
      verticalPadding: string
      horizontalMargin: number
      borderRadius: string
      alignItems: string
    }
    cancelButton: {
      borderWidth: number
      borderColorToken: string
      backgroundColorToken: string
    }
    cancelText: {
      colorToken: string
      fontWeight: string
    }
    saveButton: {
      backgroundColorToken: string
      disabledOpacity: number
    }
    saveText: {
      colorToken: string
      fontWeight: string
    }
  }
}

export function getConversationListMobileSurfaceState(): typeof CONVERSATION_LIST_MOBILE_PRESENTATION {
  return CONVERSATION_LIST_MOBILE_PRESENTATION
}

export type ConversationListMobileSurfaceColorPalette = Readonly<Record<string, string>>

export interface ConversationListMobileSurfaceColors {
  screen: {
    containerBackgroundColor: string
    loadingTextColor: string
    primaryActionButtonBackgroundColor: string
  }
  header: {
    titleColor: string
    newChatButtonBackgroundColor: string
    newChatTextColor: string
  }
  listShell: {
    searchInputPlaceholderColor: string
  }
  searchClear: {
    textColor: string
  }
  archiveFilter: {
    buttonBorderColor: string
    buttonBackgroundColor: string
    selectedButtonBorderColor: string
    selectedButtonBackgroundColor: string
    textColor: string
    selectedTextColor: string
  }
  rowAction: {
    buttonBorderColor: string
    buttonBackgroundColor: string
    activeButtonBorderColor: string
    activeButtonBackgroundColor: string
    textColor: string
    activeTextColor: string
  }
  sessionRow: {
    itemBackgroundColor: string
    itemBorderColor: string
    activeItemBorderColor: string
    titleColor: string
    dateColor: string
    previewColor: string
    previewMetaColor: string
  }
  emptyState: {
    subtitleColor: string
    buttonTextColor: string
  }
  disconnectedState: {
    cardBackgroundColor: string
    cardBorderColor: string
    subtitleColor: string
    metaColor: string
    secondaryButtonBorderColor: string
    secondaryButtonTextColor: string
  }
  rapidFire: {
    containerBorderTopColor: string
    containerBackgroundColor: string
    hintColor: string
    transcriptColor: string
    buttonBorderColor: string
    buttonBackgroundColor: string
    activeButtonBackgroundColor: string
    activeButtonBorderColor: string
    buttonLabelColor: string
  }
  renameDialog: {
    overlayBackgroundColor: string
    contentBackgroundColor: string
    contentBorderColor: string
    inputPlaceholderColor: string
    cancelButtonBorderColor: string
    cancelButtonBackgroundColor: string
    cancelTextColor: string
    saveButtonBackgroundColor: string
    saveTextColor: string
  }
}

export function getConversationListMobileSurfaceColors(
  colors: ConversationListMobileSurfaceColorPalette,
): ConversationListMobileSurfaceColors {
  const surface = CONVERSATION_LIST_MOBILE_PRESENTATION

  return {
    screen: {
      containerBackgroundColor: colors[surface.screen.container.backgroundColorToken],
      loadingTextColor: colors[surface.screen.loadingText.colorToken],
      primaryActionButtonBackgroundColor:
        colors[surface.screen.primaryActionButton.backgroundColorToken],
    },
    header: {
      titleColor: colors[surface.header.title.colorToken],
      newChatButtonBackgroundColor:
        colors[surface.header.newChatButton.backgroundColorToken],
      newChatTextColor: colors[surface.header.newChatText.colorToken],
    },
    listShell: {
      searchInputPlaceholderColor:
        colors[surface.listShell.searchInput.placeholderColorToken],
    },
    searchClear: {
      textColor: colors[surface.searchClear.text.colorToken],
    },
    archiveFilter: {
      buttonBorderColor: colors[surface.archiveFilter.button.borderColorToken],
      buttonBackgroundColor: colors[surface.archiveFilter.button.backgroundColorToken],
      selectedButtonBorderColor: colors[surface.archiveFilter.selectedButton.borderColorToken],
      selectedButtonBackgroundColor: hexToRgba(
        colors[surface.archiveFilter.selectedButton.backgroundColorToken],
        surface.archiveFilter.selectedButton.backgroundAlpha,
      ),
      textColor: colors[surface.archiveFilter.text.colorToken],
      selectedTextColor: colors[surface.archiveFilter.selectedText.colorToken],
    },
    rowAction: {
      buttonBorderColor: colors[surface.rowAction.button.borderColorToken],
      buttonBackgroundColor: colors[surface.rowAction.button.backgroundColorToken],
      activeButtonBorderColor: colors[surface.rowAction.activeButton.borderColorToken],
      activeButtonBackgroundColor: hexToRgba(
        colors[surface.rowAction.activeButton.backgroundColorToken],
        surface.rowAction.activeButton.backgroundAlpha,
      ),
      textColor: colors[surface.rowAction.text.colorToken],
      activeTextColor: colors[surface.rowAction.activeText.colorToken],
    },
    sessionRow: {
      itemBackgroundColor: colors[surface.sessionRow.item.backgroundColorToken],
      itemBorderColor: colors[surface.sessionRow.item.borderColorToken],
      activeItemBorderColor: colors[surface.sessionRow.activeItem.borderColorToken],
      titleColor: colors[surface.sessionRow.title.colorToken],
      dateColor: colors[surface.sessionRow.date.colorToken],
      previewColor: colors[surface.sessionRow.preview.colorToken],
      previewMetaColor: colors[surface.sessionRow.previewMeta.colorToken],
    },
    emptyState: {
      subtitleColor: colors[surface.emptyState.subtitle.colorToken],
      buttonTextColor: colors[surface.emptyState.buttonText.colorToken],
    },
    disconnectedState: {
      cardBackgroundColor: colors[surface.disconnectedState.card.backgroundColorToken],
      cardBorderColor: colors[surface.disconnectedState.card.borderColorToken],
      subtitleColor: colors[surface.disconnectedState.subtitle.colorToken],
      metaColor: colors[surface.disconnectedState.meta.colorToken],
      secondaryButtonBorderColor: colors[surface.disconnectedState.secondaryButton.borderColorToken],
      secondaryButtonTextColor: colors[surface.disconnectedState.secondaryButtonText.colorToken],
    },
    rapidFire: {
      containerBorderTopColor: colors[surface.rapidFire.container.borderTopColorToken],
      containerBackgroundColor: colors[surface.rapidFire.container.backgroundColorToken],
      hintColor: colors[surface.rapidFire.hint.colorToken],
      transcriptColor: colors[surface.rapidFire.transcript.colorToken],
      buttonBorderColor: colors[surface.rapidFire.button.borderColorToken],
      buttonBackgroundColor: colors[surface.rapidFire.button.backgroundColorToken],
      activeButtonBackgroundColor: colors[surface.rapidFire.activeButton.backgroundColorToken],
      activeButtonBorderColor: colors[surface.rapidFire.activeButton.borderColorToken],
      buttonLabelColor: colors[surface.rapidFire.buttonLabel.colorToken],
    },
    renameDialog: {
      overlayBackgroundColor: hexToRgba(surface.renameDialog.overlay.color, surface.renameDialog.overlay.alpha),
      contentBackgroundColor: colors[surface.renameDialog.content.backgroundColorToken],
      contentBorderColor: colors[surface.renameDialog.content.borderColorToken],
      inputPlaceholderColor: colors[surface.renameDialog.input.placeholderColorToken],
      cancelButtonBorderColor: colors[surface.renameDialog.cancelButton.borderColorToken],
      cancelButtonBackgroundColor: colors[surface.renameDialog.cancelButton.backgroundColorToken],
      cancelTextColor: colors[surface.renameDialog.cancelText.colorToken],
      saveButtonBackgroundColor: colors[surface.renameDialog.saveButton.backgroundColorToken],
      saveTextColor: colors[surface.renameDialog.saveText.colorToken],
    },
  }
}

type ConversationListDesktopSurface = {
  dialog: Record<
    | "contentClassName"
    | "headerClassName"
    | "titleClassName"
    | "titleIconClassName"
    | "descriptionClassName"
    | "bodyClassName",
    string
  >
  toolbar: Record<
    | "containerClassName"
    | "searchContainerClassName"
    | "searchIconClassName"
    | "searchInputClassName"
    | "shortcutHintClassName"
    | "deleteAllButtonClassName"
    | "deleteAllIconClassName",
    string
  >
  deleteAllConfirm: Record<
    | "containerClassName"
    | "titleClassName"
    | "iconClassName"
    | "descriptionClassName"
    | "actionsClassName"
    | "buttonClassName",
    string
  >
  list: Record<
    | "containerClassName"
    | "loadingClassName"
    | "loadingIconClassName"
    | "errorClassName"
    | "emptyClassName"
    | "sectionLabelClassName"
    | "loadMoreButtonClassName",
    string
  >
  row: Record<
    | "containerClassName"
    | "interactiveClassName"
    | "highlightedClassName"
    | "railClassName"
    | "bodyClassName"
    | "headerClassName"
    | "titleClassName"
    | "actionSlotClassName"
    | "timestampClassName"
    | "actionsClassName"
    | "actionButtonClassName"
    | "destructiveActionButtonClassName"
    | "actionIconClassName"
    | "activeActionIconClassName"
    | "pinnedBadgeRowClassName"
    | "pinnedBadgeClassName"
    | "pinnedBadgeIconClassName"
    | "previewClassName",
    string
  >
}

export const CONVERSATION_LIST_DESKTOP_PRESENTATION = {
  dialog: {
    contentClassName:
      "max-w-sm w-[calc(100%-2rem)] overflow-hidden grid-cols-1",
    headerClassName: "shrink-0",
    titleClassName: "flex items-center gap-2",
    titleIconClassName: "h-4 w-4",
    descriptionClassName: "line-clamp-2",
    bodyClassName: "space-y-3 min-h-0",
  },
  toolbar: {
    containerClassName: "flex shrink-0 flex-wrap items-center gap-2",
    searchContainerClassName: "relative min-w-0 flex-1",
    searchIconClassName:
      "text-muted-foreground absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2",
    searchInputClassName: "pl-7 pr-12 text-xs w-full",
    shortcutHintClassName:
      "text-muted-foreground pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium",
    deleteAllButtonClassName:
      "h-8 shrink-0 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive",
    deleteAllIconClassName: "h-3 w-3 mr-1",
  },
  deleteAllConfirm: {
    containerClassName:
      "rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2",
    titleClassName: "flex items-center gap-2 text-sm font-medium",
    iconClassName: "h-4 w-4 text-destructive",
    descriptionClassName: "text-xs text-muted-foreground",
    actionsClassName: "flex flex-wrap items-center justify-end gap-2",
    buttonClassName: "h-7 text-xs",
  },
  list: {
    containerClassName:
      "max-h-[50vh] sm:max-h-[60vh] space-y-1 overflow-y-auto pr-1",
    loadingClassName:
      "text-muted-foreground flex items-center gap-2 px-2 py-2 text-xs",
    loadingIconClassName: "h-3 w-3 animate-spin",
    errorClassName: "text-destructive px-2 py-2 text-xs",
    emptyClassName: "text-muted-foreground px-2 py-2 text-xs",
    sectionLabelClassName:
      "text-muted-foreground px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide",
    loadMoreButtonClassName:
      "text-muted-foreground hover:bg-accent/50 hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition-colors",
  },
  row: {
    containerClassName:
      "group flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
    interactiveClassName:
      "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    highlightedClassName: "bg-accent/50 ring-1 ring-ring/40",
    railClassName: "mt-0.5 h-8 w-1 shrink-0 rounded-full",
    bodyClassName: "min-w-0 flex-1 overflow-hidden",
    headerClassName: "flex flex-wrap items-start gap-2",
    titleClassName: "min-w-0 flex-1 truncate font-medium",
    actionSlotClassName: "ml-auto grid shrink-0 place-items-center self-start",
    timestampClassName:
      "text-muted-foreground col-start-1 row-start-1 text-[10px] tabular-nums transition-opacity group-hover:opacity-0 group-focus-within:opacity-0",
    actionsClassName:
      "col-start-1 row-start-1 flex items-center gap-0.5 opacity-0 pointer-events-none transition-all group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
    actionButtonClassName:
      "rounded p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    destructiveActionButtonClassName:
      "rounded p-0.5 hover:bg-destructive/20 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    actionIconClassName: "h-3.5 w-3.5",
    activeActionIconClassName: "fill-current text-foreground",
    pinnedBadgeRowClassName: "mt-0.5 flex flex-wrap items-center gap-1.5",
    pinnedBadgeClassName:
      "inline-flex items-center gap-1 rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
    pinnedBadgeIconClassName: "h-3 w-3 shrink-0 fill-current",
    previewClassName:
      "text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed break-words [overflow-wrap:anywhere]",
  },
} as const satisfies ConversationListDesktopSurface

export function getConversationListDesktopSurfaceState(): typeof CONVERSATION_LIST_DESKTOP_PRESENTATION {
  return CONVERSATION_LIST_DESKTOP_PRESENTATION
}

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

export type ConversationListPinActionPresentation = {
  actionLabel: string
  displayLabel: string
  title: string
  accessibilityLabel: string
  accessibilityHint: string
}

export type ConversationListArchiveActionPresentation = {
  actionLabel: string
  displayLabel: string
  title: string
  accessibilityLabel: string
  accessibilityHint: string
}

export type ConversationListDeleteActionPresentation = {
  actionLabel: string
  title: string
  accessibilityLabel: string
  confirmationTitle: string
  confirmationMessage: string
  webConfirmationMessage: string
  failureTitle: string
  cancelLabel: string
}

function normalizeConversationActionTitle(title: string): string {
  return title.trim() || "Untitled conversation"
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

export function getConversationListPinActionPresentation(input: {
  title: string
  isPinned?: boolean
}): ConversationListPinActionPresentation {
  const safeTitle = normalizeConversationActionTitle(input.title)
  const actionLabel = input.isPinned ? "Unpin" : "Pin"

  return {
    actionLabel,
    displayLabel: input.isPinned ? "Pinned" : "Pin",
    title: `${actionLabel} conversation`,
    accessibilityLabel: `${actionLabel} ${safeTitle}`,
    accessibilityHint: input.isPinned
      ? "Removes this chat from the pinned chats list."
      : "Keeps this chat at the top of the chats list.",
  }
}

export function getConversationListArchiveActionPresentation(input: {
  title: string
  isArchived?: boolean
}): ConversationListArchiveActionPresentation {
  const safeTitle = normalizeConversationActionTitle(input.title)
  const actionLabel = input.isArchived ? "Unarchive" : "Archive"

  return {
    actionLabel,
    displayLabel: actionLabel,
    title: `${actionLabel} conversation`,
    accessibilityLabel: `${actionLabel} ${safeTitle}`,
    accessibilityHint: input.isArchived
      ? "Moves this chat back to the chats list."
      : "Moves this chat to the archived chats list.",
  }
}

export function getConversationListDeleteActionPresentation(input: {
  title: string
}): ConversationListDeleteActionPresentation {
  const safeTitle = normalizeConversationActionTitle(input.title)

  return {
    actionLabel: "Delete",
    title: "Delete conversation",
    accessibilityLabel: `Delete ${safeTitle}`,
    confirmationTitle: "Delete conversation",
    confirmationMessage: `Are you sure you want to delete "${safeTitle}"?`,
    webConfirmationMessage: `Delete "${safeTitle}"?`,
    failureTitle: "Delete Failed",
    cancelLabel: "Cancel",
  }
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
      title:
        options.mode === "archived"
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
