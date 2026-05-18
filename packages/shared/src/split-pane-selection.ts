import { APP_SHELL_BREAKPOINTS } from "./app-shell"
import { createButtonAccessibilityLabel } from "./accessibility-utils"
import { hexToRgba } from "./colors"

export type SplitOrientationPreference = "auto" | "horizontal" | "vertical"
export type SplitPane = "primary" | "secondary"
export type SplitPaneToolbarAction = "choose" | "open"
export type SplitPaneEmptyStateAction = "choose" | "newChat"

export type SplitPaneSelection = {
  primary: string | null
  secondary: string | null
}

export const SPLIT_PANE_ORIENTATION_OPTIONS = [
  "auto",
  "horizontal",
  "vertical",
] as const satisfies readonly SplitOrientationPreference[]

export const SPLIT_PANE_PRESENTATION = {
  copy: {
    title: "Split view",
    description: "Run and compare two sessions at once. Hands-free mode is paused while split view is open.",
    noChatSelected: "No chat selected",
    paneLabel: {
      primary: "Primary chat",
      secondary: "Secondary chat",
    },
    orientationLabel: {
      auto: "Auto",
      horizontal: "Horizontal",
      vertical: "Vertical",
    },
    toolbar: {
      chooseLabel: "Choose",
      openLabel: "Open",
    },
    emptyState: {
      title: "Pick a chat for this pane",
      copy: "Compare two active conversations side by side, or create a fresh chat for this split pane.",
      chooseLabel: "Choose chat",
      newChatLabel: "New chat",
    },
    modal: {
      createNewChatLabel: "Create a new chat for this pane",
      sessionPreviewFallback: "No messages yet",
    },
  },
  mobile: {
    screen: {
      flex: 1,
      backgroundColorToken: "background",
      padding: "sm",
      gap: "sm",
    },
    controlBar: {
      backgroundColorToken: "card",
      borderRadius: "xl",
      padding: "md",
      borderWidth: 1,
      borderColorToken: "border",
      gap: "xs",
    },
    controlBarTitle: {
      colorToken: "foreground",
    },
    controlBarCopy: {
      colorToken: "mutedForeground",
    },
    segmentedRow: {
      flexDirection: "row",
      gap: "xs",
      flexWrap: "wrap",
    },
    segmentButton: {
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      paddingHorizontal: "md",
      paddingVertical: "xs",
      backgroundColorToken: "background",
      textColorToken: "foreground",
      activeTextColorToken: "primary",
      fontWeight: "600",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      active: {
        borderColorToken: "primary",
        backgroundColorToken: "primary",
        backgroundAlpha: 0.094,
      },
    },
    splitContainer: {
      flex: 1,
      gap: "sm",
    },
    splitHorizontal: {
      flexDirection: "column",
    },
    splitVertical: {
      flexDirection: "row",
    },
    pane: {
      flex: 1,
      minHeight: 0,
      backgroundColorToken: "card",
      borderRadius: "xl",
      borderWidth: 1,
      borderColorToken: "border",
      overflow: "hidden",
    },
    paneHorizontal: {
      minHeight: 260,
    },
    paneVertical: {
      minWidth: 0,
    },
    paneToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "sm",
      paddingHorizontal: "md",
      paddingVertical: "sm",
      borderBottomWidth: 1,
      borderBottomColorToken: "border",
      backgroundColorToken: "background",
    },
    paneToolbarTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    paneLabel: {
      colorToken: "primary",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    paneTitle: {
      colorToken: "foreground",
      fontWeight: "600",
      numberOfLines: 1,
    },
    paneToolbarActions: {
      flexDirection: "row",
      gap: "xs",
    },
    toolbarButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: "md",
      paddingHorizontal: "sm",
      paddingVertical: "xs",
      backgroundColorToken: "card",
      borderWidth: 1,
      borderColorToken: "border",
      disabledOpacity: 0.45,
      textColorToken: "foreground",
      fontWeight: "600",
      iconSize: 14,
      iconColorToken: "foreground",
      chooseIconName: "list-outline",
      openIconName: "expand-outline",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: "lg",
      gap: "sm",
    },
    emptyStateTitle: {
      colorToken: "foreground",
      textAlign: "center",
    },
    emptyStateCopy: {
      colorToken: "mutedForeground",
      textAlign: "center",
      maxWidth: 360,
    },
    emptyStateActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "sm",
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "xs",
      borderRadius: "lg",
      backgroundColorToken: "primary",
      paddingHorizontal: "md",
      paddingVertical: "sm",
      textColorToken: "background",
      fontWeight: "700",
      iconName: "chatbubbles-outline",
      iconSize: 15,
      iconColorToken: "background",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "xs",
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      paddingHorizontal: "md",
      paddingVertical: "sm",
      backgroundColorToken: "card",
      textColorToken: "foreground",
      fontWeight: "600",
      iconName: "add-circle-outline",
      iconSize: 15,
      iconColorToken: "foreground",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    modalOverlay: {
      flex: 1,
      color: "#000000",
      alpha: 0.4,
      justifyContent: "center",
      padding: "lg",
    },
    modalCard: {
      maxHeight: "75%",
      borderRadius: "xl",
      backgroundColorToken: "card",
      borderWidth: 1,
      borderColorToken: "border",
      padding: "md",
      gap: "sm",
    },
    modalTitle: {
      colorToken: "foreground",
    },
    sessionOption: {
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      padding: "md",
      marginBottom: "sm",
      backgroundColorToken: "background",
      title: {
        colorToken: "foreground",
        fontWeight: "600",
        marginBottom: 4,
        numberOfLines: 1,
      },
      preview: {
        colorToken: "mutedForeground",
        numberOfLines: 2,
      },
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      active: {
        borderColorToken: "primary",
        backgroundColorToken: "primary",
        backgroundAlpha: 0.071,
      },
    },
    newChatOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "xs",
      paddingVertical: "sm",
      iconName: "add-circle-outline",
      iconSize: 16,
      iconColorToken: "primary",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    newChatOptionText: {
      colorToken: "primary",
      fontWeight: "700",
    },
  },
} as const satisfies {
  copy: {
    title: string
    description: string
    noChatSelected: string
    paneLabel: Record<SplitPane, string>
    orientationLabel: Record<SplitOrientationPreference, string>
    toolbar: {
      chooseLabel: string
      openLabel: string
    }
    emptyState: {
      title: string
      copy: string
      chooseLabel: string
      newChatLabel: string
    }
    modal: {
      createNewChatLabel: string
      sessionPreviewFallback: string
    }
  }
  mobile: {
    segmentButton: {
      active: {
        borderColorToken: string
        backgroundColorToken: string
        backgroundAlpha: number
      }
    } & Record<string, unknown>
    paneTitle: {
      numberOfLines: number
    } & Record<string, unknown>
    sessionOption: {
      active: {
        borderColorToken: string
        backgroundColorToken: string
        backgroundAlpha: number
      } & Record<string, unknown>
      title: {
        numberOfLines: number
      } & Record<string, unknown>
      preview: {
        numberOfLines: number
      } & Record<string, unknown>
    } & Record<string, unknown>
    modalOverlay: {
      color: string
      alpha: number
    } & Record<string, unknown>
  } & Record<string, unknown>
}

export type SplitPaneMobileSurfaceColorToken =
  | typeof SPLIT_PANE_PRESENTATION.mobile.screen.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.controlBar.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.controlBar.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.controlBarTitle.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.controlBarCopy.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.textColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.activeTextColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.active.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.active.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.pane.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.pane.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.paneToolbar.borderBottomColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.paneToolbar.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.paneLabel.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.paneTitle.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.toolbarButton.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.toolbarButton.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.toolbarButton.textColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.toolbarButton.iconColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.emptyStateTitle.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.emptyStateCopy.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.primaryButton.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.primaryButton.textColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.primaryButton.iconColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.secondaryButton.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.secondaryButton.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.secondaryButton.textColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.secondaryButton.iconColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.modalCard.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.modalCard.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.modalTitle.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.title.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.preview.colorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.active.borderColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.active.backgroundColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.newChatOption.iconColorToken
  | typeof SPLIT_PANE_PRESENTATION.mobile.newChatOptionText.colorToken

export type SplitPaneMobileSurfaceColorPalette =
  Readonly<Record<SplitPaneMobileSurfaceColorToken, string>>

export interface SplitPaneMobileSurfaceColors {
  screen: { backgroundColor: string }
  controlBar: {
    backgroundColor: string
    borderColor: string
  }
  controlBarTitle: { color: string }
  controlBarCopy: { color: string }
  segmentButton: {
    borderColor: string
    backgroundColor: string
    textColor: string
    activeTextColor: string
    activeBorderColor: string
    activeBackgroundColor: string
  }
  pane: {
    backgroundColor: string
    borderColor: string
  }
  paneToolbar: {
    borderBottomColor: string
    backgroundColor: string
  }
  paneLabel: { color: string }
  paneTitle: { color: string }
  toolbarButton: {
    backgroundColor: string
    borderColor: string
    textColor: string
    iconColor: string
  }
  emptyStateTitle: { color: string }
  emptyStateCopy: { color: string }
  primaryButton: {
    backgroundColor: string
    textColor: string
    iconColor: string
  }
  secondaryButton: {
    borderColor: string
    backgroundColor: string
    textColor: string
    iconColor: string
  }
  modalOverlay: { backgroundColor: string }
  modalCard: {
    backgroundColor: string
    borderColor: string
  }
  modalTitle: { color: string }
  sessionOption: {
    borderColor: string
    backgroundColor: string
    activeBorderColor: string
    activeBackgroundColor: string
  }
  sessionOptionTitle: { color: string }
  sessionOptionPreview: { color: string }
  newChatOption: { iconColor: string }
  newChatOptionText: { color: string }
}

export function getSplitPaneMobileSurfaceState(): typeof SPLIT_PANE_PRESENTATION.mobile {
  return SPLIT_PANE_PRESENTATION.mobile
}

export function getSplitPaneMobileSurfaceColors(
  colors: SplitPaneMobileSurfaceColorPalette,
): SplitPaneMobileSurfaceColors {
  const surface = SPLIT_PANE_PRESENTATION.mobile

  return {
    screen: {
      backgroundColor: colors[surface.screen.backgroundColorToken],
    },
    controlBar: {
      backgroundColor: colors[surface.controlBar.backgroundColorToken],
      borderColor: colors[surface.controlBar.borderColorToken],
    },
    controlBarTitle: {
      color: colors[surface.controlBarTitle.colorToken],
    },
    controlBarCopy: {
      color: colors[surface.controlBarCopy.colorToken],
    },
    segmentButton: {
      borderColor: colors[surface.segmentButton.borderColorToken],
      backgroundColor: colors[surface.segmentButton.backgroundColorToken],
      textColor: colors[surface.segmentButton.textColorToken],
      activeTextColor: colors[surface.segmentButton.activeTextColorToken],
      activeBorderColor: colors[surface.segmentButton.active.borderColorToken],
      activeBackgroundColor: hexToRgba(
        colors[surface.segmentButton.active.backgroundColorToken],
        surface.segmentButton.active.backgroundAlpha,
      ),
    },
    pane: {
      backgroundColor: colors[surface.pane.backgroundColorToken],
      borderColor: colors[surface.pane.borderColorToken],
    },
    paneToolbar: {
      borderBottomColor: colors[surface.paneToolbar.borderBottomColorToken],
      backgroundColor: colors[surface.paneToolbar.backgroundColorToken],
    },
    paneLabel: {
      color: colors[surface.paneLabel.colorToken],
    },
    paneTitle: {
      color: colors[surface.paneTitle.colorToken],
    },
    toolbarButton: {
      backgroundColor: colors[surface.toolbarButton.backgroundColorToken],
      borderColor: colors[surface.toolbarButton.borderColorToken],
      textColor: colors[surface.toolbarButton.textColorToken],
      iconColor: colors[surface.toolbarButton.iconColorToken],
    },
    emptyStateTitle: {
      color: colors[surface.emptyStateTitle.colorToken],
    },
    emptyStateCopy: {
      color: colors[surface.emptyStateCopy.colorToken],
    },
    primaryButton: {
      backgroundColor: colors[surface.primaryButton.backgroundColorToken],
      textColor: colors[surface.primaryButton.textColorToken],
      iconColor: colors[surface.primaryButton.iconColorToken],
    },
    secondaryButton: {
      borderColor: colors[surface.secondaryButton.borderColorToken],
      backgroundColor: colors[surface.secondaryButton.backgroundColorToken],
      textColor: colors[surface.secondaryButton.textColorToken],
      iconColor: colors[surface.secondaryButton.iconColorToken],
    },
    modalOverlay: {
      backgroundColor: hexToRgba(surface.modalOverlay.color, surface.modalOverlay.alpha),
    },
    modalCard: {
      backgroundColor: colors[surface.modalCard.backgroundColorToken],
      borderColor: colors[surface.modalCard.borderColorToken],
    },
    modalTitle: {
      color: colors[surface.modalTitle.colorToken],
    },
    sessionOption: {
      borderColor: colors[surface.sessionOption.borderColorToken],
      backgroundColor: colors[surface.sessionOption.backgroundColorToken],
      activeBorderColor: colors[surface.sessionOption.active.borderColorToken],
      activeBackgroundColor: hexToRgba(
        colors[surface.sessionOption.active.backgroundColorToken],
        surface.sessionOption.active.backgroundAlpha,
      ),
    },
    sessionOptionTitle: {
      color: colors[surface.sessionOption.title.colorToken],
    },
    sessionOptionPreview: {
      color: colors[surface.sessionOption.preview.colorToken],
    },
    newChatOption: {
      iconColor: colors[surface.newChatOption.iconColorToken],
    },
    newChatOptionText: {
      color: colors[surface.newChatOptionText.colorToken],
    },
  }
}

export interface SplitPaneMobileTypographyScale {
  h2: object
  body: object
  caption: object
}

export interface SplitPaneMobileStyleSlotsInput {
  colors: SplitPaneMobileSurfaceColors
  spacing: Readonly<Record<string, number>>
  radius: Readonly<Record<string, number>>
  typography: SplitPaneMobileTypographyScale
}

export interface SplitPaneSegmentButtonMobileStylesLike {
  button: unknown
  activeButton: unknown
  pressedButton: unknown
  label: unknown
  activeLabel: unknown
}

export interface SplitPaneSegmentButtonMobilePropsPartsInput<
  TStyles extends SplitPaneSegmentButtonMobileStylesLike = SplitPaneSegmentButtonMobileStylesLike,
> {
  option: SplitOrientationPreference
  isSelected: boolean
  onSelect: (option: SplitOrientationPreference) => void
  styles: TStyles
}

export interface SplitPaneSegmentButtonMobilePropsParts<
  TStyles extends SplitPaneSegmentButtonMobileStylesLike = SplitPaneSegmentButtonMobileStylesLike,
> {
  pressable: {
    props: {
      onPress: () => void
      accessibilityRole: typeof SPLIT_PANE_PRESENTATION.mobile.segmentButton.accessibilityRole
      accessibilityState: {
        selected: boolean
      }
      style: (
        state: { pressed?: boolean },
      ) => Array<
        TStyles["button"] | TStyles["activeButton"] | TStyles["pressedButton"]
      >
    }
    content: {
      label: {
        text: string
        props: {
          style: Array<TStyles["label"] | TStyles["activeLabel"]>
        }
      }
    }
  }
}

export interface SplitPaneToolbarActionMobileStylesLike {
  button: unknown
  disabledButton: unknown
  label: unknown
}

export interface SplitPaneToolbarActionMobilePropsPartsInput<
  TStyles extends SplitPaneToolbarActionMobileStylesLike = SplitPaneToolbarActionMobileStylesLike,
> {
  action: SplitPaneToolbarAction
  pane: SplitPane
  isDisabled?: boolean
  onPress: () => void
  iconColor: string
  styles: TStyles
}

export interface SplitPaneToolbarActionMobilePropsParts<
  TStyles extends SplitPaneToolbarActionMobileStylesLike = SplitPaneToolbarActionMobileStylesLike,
> {
  touchable: {
    props: {
      onPress: () => void
      disabled: boolean
      style: Array<TStyles["button"] | TStyles["disabledButton"]>
      activeOpacity: typeof SPLIT_PANE_PRESENTATION.mobile.toolbarButton.pressedOpacity
      accessibilityRole: typeof SPLIT_PANE_PRESENTATION.mobile.toolbarButton.accessibilityRole
      accessibilityLabel: string
      accessibilityState: {
        disabled: boolean
      }
    }
    content: {
      icon: {
        props: {
          name: ReturnType<typeof getSplitPaneToolbarActionMobileIconState>["name"]
          size: ReturnType<typeof getSplitPaneToolbarActionMobileIconState>["size"]
          color: string
        }
      }
      label: {
        text: string
        props: {
          style: TStyles["label"]
        }
      }
    }
  }
}

export interface SplitPaneEmptyStateActionMobileStylesLike {
  button: unknown
  label: unknown
}

export interface SplitPaneEmptyStateActionMobilePropsPartsInput<
  TStyles extends SplitPaneEmptyStateActionMobileStylesLike = SplitPaneEmptyStateActionMobileStylesLike,
> {
  action: SplitPaneEmptyStateAction
  onPress: () => void
  iconColor: string
  styles: TStyles
}

export interface SplitPaneEmptyStateActionMobilePropsParts<
  TStyles extends SplitPaneEmptyStateActionMobileStylesLike = SplitPaneEmptyStateActionMobileStylesLike,
> {
  touchable: {
    props: {
      onPress: () => void
      style: TStyles["button"]
      activeOpacity:
        | typeof SPLIT_PANE_PRESENTATION.mobile.primaryButton.pressedOpacity
        | typeof SPLIT_PANE_PRESENTATION.mobile.secondaryButton.pressedOpacity
      accessibilityRole:
        | typeof SPLIT_PANE_PRESENTATION.mobile.primaryButton.accessibilityRole
        | typeof SPLIT_PANE_PRESENTATION.mobile.secondaryButton.accessibilityRole
      accessibilityLabel: string
    }
    content: {
      icon: {
        props: {
          name: ReturnType<typeof getSplitPaneEmptyStateActionMobileIconState>["name"]
          size: ReturnType<typeof getSplitPaneEmptyStateActionMobileIconState>["size"]
          color: string
        }
      }
      label: {
        text: string
        props: {
          style: TStyles["label"]
        }
      }
    }
  }
}

export interface SplitPaneSessionOptionMobileStylesLike {
  option: unknown
  activeOption: unknown
  title: unknown
  preview: unknown
}

export interface SplitPaneSessionOptionMobilePropsPartsInput<
  TStyles extends SplitPaneSessionOptionMobileStylesLike = SplitPaneSessionOptionMobileStylesLike,
> {
  title: string
  preview?: string | null
  isSelected: boolean
  onPress: () => void
  styles: TStyles
}

export interface SplitPaneSessionOptionMobilePropsParts<
  TStyles extends SplitPaneSessionOptionMobileStylesLike = SplitPaneSessionOptionMobileStylesLike,
> {
  touchable: {
    props: {
      onPress: () => void
      style: Array<TStyles["option"] | TStyles["activeOption"]>
      activeOpacity: typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.pressedOpacity
      accessibilityRole: typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.accessibilityRole
      accessibilityState: {
        selected: boolean
      }
    }
    content: {
      title: {
        text: string
        props: {
          style: TStyles["title"]
          numberOfLines: typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.title.numberOfLines
        }
      }
      preview: {
        text: string
        props: {
          style: TStyles["preview"]
          numberOfLines: typeof SPLIT_PANE_PRESENTATION.mobile.sessionOption.preview.numberOfLines
        }
      }
    }
  }
}

export interface SplitPaneModalCreateActionMobileStylesLike {
  button: unknown
  label: unknown
}

export interface SplitPaneModalCreateActionMobilePropsPartsInput<
  TStyles extends SplitPaneModalCreateActionMobileStylesLike = SplitPaneModalCreateActionMobileStylesLike,
> {
  onPress: () => void
  iconColor: string
  styles: TStyles
}

export interface SplitPaneModalCreateActionMobilePropsParts<
  TStyles extends SplitPaneModalCreateActionMobileStylesLike = SplitPaneModalCreateActionMobileStylesLike,
> {
  touchable: {
    props: {
      onPress: () => void
      style: TStyles["button"]
      activeOpacity: typeof SPLIT_PANE_PRESENTATION.mobile.newChatOption.pressedOpacity
      accessibilityRole: typeof SPLIT_PANE_PRESENTATION.mobile.newChatOption.accessibilityRole
      accessibilityLabel: string
    }
    content: {
      icon: {
        props: {
          name: ReturnType<typeof getSplitPaneModalCreateMobileIconState>["name"]
          size: ReturnType<typeof getSplitPaneModalCreateMobileIconState>["size"]
          color: string
        }
      }
      label: {
        text: string
        props: {
          style: TStyles["label"]
        }
      }
    }
  }
}

export interface SplitPanePaneHeaderMobileStylesLike {
  label: unknown
  title: unknown
}

export interface SplitPanePaneHeaderMobilePropsPartsInput<
  TStyles extends SplitPanePaneHeaderMobileStylesLike = SplitPanePaneHeaderMobileStylesLike,
> {
  pane: SplitPane
  title?: string | null
  styles: TStyles
}

export interface SplitPanePaneHeaderMobilePropsParts<
  TStyles extends SplitPanePaneHeaderMobileStylesLike = SplitPanePaneHeaderMobileStylesLike,
> {
  content: {
    label: {
      text: string
      props: {
        style: TStyles["label"]
      }
    }
    title: {
      text: string
      props: {
        style: TStyles["title"]
        numberOfLines: typeof SPLIT_PANE_PRESENTATION.mobile.paneTitle.numberOfLines
      }
    }
  }
}

export function createSplitPaneMobileStyleSlots({
  colors,
  spacing,
  radius,
  typography,
}: SplitPaneMobileStyleSlotsInput) {
  const surface = getSplitPaneMobileSurfaceState()
  const screenSurface = surface.screen
  const controlBarSurface = surface.controlBar
  const segmentedRowSurface = surface.segmentedRow
  const segmentButtonSurface = surface.segmentButton
  const splitContainerSurface = surface.splitContainer
  const paneSurface = surface.pane
  const paneToolbarSurface = surface.paneToolbar
  const toolbarButtonSurface = surface.toolbarButton
  const emptyStateSurface = surface.emptyState
  const emptyStateActionsSurface = surface.emptyStateActions
  const primaryButtonSurface = surface.primaryButton
  const secondaryButtonSurface = surface.secondaryButton
  const modalOverlaySurface = surface.modalOverlay
  const modalCardSurface = surface.modalCard
  const sessionOptionSurface = surface.sessionOption
  const newChatOptionSurface = surface.newChatOption
  const newChatOptionTextSurface = surface.newChatOptionText

  return {
    screen: {
      flex: screenSurface.flex,
      backgroundColor: colors.screen.backgroundColor,
      padding: spacing[screenSurface.padding],
      gap: spacing[screenSurface.gap],
    },
    controlBar: {
      backgroundColor: colors.controlBar.backgroundColor,
      borderRadius: radius[controlBarSurface.borderRadius],
      padding: spacing[controlBarSurface.padding],
      borderWidth: controlBarSurface.borderWidth,
      borderColor: colors.controlBar.borderColor,
      gap: spacing[controlBarSurface.gap],
    },
    controlBarTitle: { ...typography.h2, color: colors.controlBarTitle.color },
    controlBarCopy: { ...typography.body, color: colors.controlBarCopy.color },
    segmentedRow: {
      flexDirection: segmentedRowSurface.flexDirection,
      gap: spacing[segmentedRowSurface.gap],
      flexWrap: segmentedRowSurface.flexWrap,
    },
    segmentButton: {
      borderRadius: radius[segmentButtonSurface.borderRadius],
      borderWidth: segmentButtonSurface.borderWidth,
      borderColor: colors.segmentButton.borderColor,
      paddingHorizontal: spacing[segmentButtonSurface.paddingHorizontal],
      paddingVertical: spacing[segmentButtonSurface.paddingVertical],
      backgroundColor: colors.segmentButton.backgroundColor,
    },
    segmentButtonActive: {
      borderColor: colors.segmentButton.activeBorderColor,
      backgroundColor: colors.segmentButton.activeBackgroundColor,
    },
    segmentButtonPressed: { opacity: segmentButtonSurface.pressedOpacity },
    segmentButtonText: {
      ...typography.caption,
      color: colors.segmentButton.textColor,
      fontWeight: segmentButtonSurface.fontWeight,
    },
    segmentButtonTextActive: { color: colors.segmentButton.activeTextColor },
    splitContainer: {
      flex: splitContainerSurface.flex,
      gap: spacing[splitContainerSurface.gap],
    },
    splitHorizontal: { flexDirection: surface.splitHorizontal.flexDirection },
    splitVertical: { flexDirection: surface.splitVertical.flexDirection },
    pane: {
      flex: paneSurface.flex,
      minHeight: paneSurface.minHeight,
      backgroundColor: colors.pane.backgroundColor,
      borderRadius: radius[paneSurface.borderRadius],
      borderWidth: paneSurface.borderWidth,
      borderColor: colors.pane.borderColor,
      overflow: paneSurface.overflow,
    },
    paneHorizontal: { minHeight: surface.paneHorizontal.minHeight },
    paneVertical: { minWidth: surface.paneVertical.minWidth },
    paneToolbar: {
      flexDirection: paneToolbarSurface.flexDirection,
      alignItems: paneToolbarSurface.alignItems,
      justifyContent: paneToolbarSurface.justifyContent,
      gap: spacing[paneToolbarSurface.gap],
      paddingHorizontal: spacing[paneToolbarSurface.paddingHorizontal],
      paddingVertical: spacing[paneToolbarSurface.paddingVertical],
      borderBottomWidth: paneToolbarSurface.borderBottomWidth,
      borderBottomColor: colors.paneToolbar.borderBottomColor,
      backgroundColor: colors.paneToolbar.backgroundColor,
    },
    paneToolbarTextWrap: {
      flex: surface.paneToolbarTextWrap.flex,
      minWidth: surface.paneToolbarTextWrap.minWidth,
    },
    paneLabel: {
      ...typography.caption,
      color: colors.paneLabel.color,
      textTransform: surface.paneLabel.textTransform,
      letterSpacing: surface.paneLabel.letterSpacing,
    },
    paneTitle: {
      ...typography.body,
      color: colors.paneTitle.color,
      fontWeight: surface.paneTitle.fontWeight,
    },
    paneToolbarActions: {
      flexDirection: surface.paneToolbarActions.flexDirection,
      gap: spacing[surface.paneToolbarActions.gap],
    },
    toolbarButton: {
      flexDirection: toolbarButtonSurface.flexDirection,
      alignItems: toolbarButtonSurface.alignItems,
      justifyContent: toolbarButtonSurface.justifyContent,
      gap: toolbarButtonSurface.gap,
      borderRadius: radius[toolbarButtonSurface.borderRadius],
      paddingHorizontal: spacing[toolbarButtonSurface.paddingHorizontal],
      paddingVertical: spacing[toolbarButtonSurface.paddingVertical],
      backgroundColor: colors.toolbarButton.backgroundColor,
      borderWidth: toolbarButtonSurface.borderWidth,
      borderColor: colors.toolbarButton.borderColor,
    },
    toolbarButtonDisabled: { opacity: toolbarButtonSurface.disabledOpacity },
    toolbarButtonText: {
      ...typography.caption,
      color: colors.toolbarButton.textColor,
      fontWeight: toolbarButtonSurface.fontWeight,
    },
    paneBody: { flex: paneSurface.flex, minHeight: paneSurface.minHeight },
    emptyState: {
      flex: emptyStateSurface.flex,
      alignItems: emptyStateSurface.alignItems,
      justifyContent: emptyStateSurface.justifyContent,
      padding: spacing[emptyStateSurface.padding],
      gap: spacing[emptyStateSurface.gap],
    },
    emptyStateTitle: {
      ...typography.h2,
      color: colors.emptyStateTitle.color,
      textAlign: surface.emptyStateTitle.textAlign,
    },
    emptyStateCopy: {
      ...typography.body,
      color: colors.emptyStateCopy.color,
      textAlign: surface.emptyStateCopy.textAlign,
      maxWidth: surface.emptyStateCopy.maxWidth,
    },
    emptyStateActions: {
      flexDirection: emptyStateActionsSurface.flexDirection,
      flexWrap: emptyStateActionsSurface.flexWrap,
      justifyContent: emptyStateActionsSurface.justifyContent,
      gap: spacing[emptyStateActionsSurface.gap],
    },
    primaryButton: {
      flexDirection: primaryButtonSurface.flexDirection,
      alignItems: primaryButtonSurface.alignItems,
      justifyContent: primaryButtonSurface.justifyContent,
      gap: spacing[primaryButtonSurface.gap],
      borderRadius: radius[primaryButtonSurface.borderRadius],
      backgroundColor: colors.primaryButton.backgroundColor,
      paddingHorizontal: spacing[primaryButtonSurface.paddingHorizontal],
      paddingVertical: spacing[primaryButtonSurface.paddingVertical],
    },
    primaryButtonText: {
      ...typography.body,
      color: colors.primaryButton.textColor,
      fontWeight: primaryButtonSurface.fontWeight,
    },
    secondaryButton: {
      flexDirection: secondaryButtonSurface.flexDirection,
      alignItems: secondaryButtonSurface.alignItems,
      justifyContent: secondaryButtonSurface.justifyContent,
      gap: spacing[secondaryButtonSurface.gap],
      borderRadius: radius[secondaryButtonSurface.borderRadius],
      borderWidth: secondaryButtonSurface.borderWidth,
      borderColor: colors.secondaryButton.borderColor,
      paddingHorizontal: spacing[secondaryButtonSurface.paddingHorizontal],
      paddingVertical: spacing[secondaryButtonSurface.paddingVertical],
      backgroundColor: colors.secondaryButton.backgroundColor,
    },
    secondaryButtonText: {
      ...typography.body,
      color: colors.secondaryButton.textColor,
      fontWeight: secondaryButtonSurface.fontWeight,
    },
    modalOverlay: {
      flex: modalOverlaySurface.flex,
      backgroundColor: colors.modalOverlay.backgroundColor,
      justifyContent: modalOverlaySurface.justifyContent,
      padding: spacing[modalOverlaySurface.padding],
    },
    modalCard: {
      maxHeight: modalCardSurface.maxHeight,
      borderRadius: radius[modalCardSurface.borderRadius],
      backgroundColor: colors.modalCard.backgroundColor,
      borderWidth: modalCardSurface.borderWidth,
      borderColor: colors.modalCard.borderColor,
      padding: spacing[modalCardSurface.padding],
      gap: spacing[modalCardSurface.gap],
    },
    modalTitle: {
      ...typography.h2,
      color: colors.modalTitle.color,
    },
    sessionOption: {
      borderRadius: radius[sessionOptionSurface.borderRadius],
      borderWidth: sessionOptionSurface.borderWidth,
      borderColor: colors.sessionOption.borderColor,
      padding: spacing[sessionOptionSurface.padding],
      marginBottom: spacing[sessionOptionSurface.marginBottom],
      backgroundColor: colors.sessionOption.backgroundColor,
    },
    sessionOptionActive: {
      borderColor: colors.sessionOption.activeBorderColor,
      backgroundColor: colors.sessionOption.activeBackgroundColor,
    },
    sessionOptionTitle: {
      ...typography.body,
      color: colors.sessionOptionTitle.color,
      fontWeight: sessionOptionSurface.title.fontWeight,
      marginBottom: sessionOptionSurface.title.marginBottom,
    },
    sessionOptionPreview: {
      ...typography.caption,
      color: colors.sessionOptionPreview.color,
    },
    newChatOption: {
      flexDirection: newChatOptionSurface.flexDirection,
      alignItems: newChatOptionSurface.alignItems,
      justifyContent: newChatOptionSurface.justifyContent,
      gap: spacing[newChatOptionSurface.gap],
      paddingVertical: spacing[newChatOptionSurface.paddingVertical],
    },
    newChatOptionText: {
      ...typography.body,
      color: colors.newChatOptionText.color,
      fontWeight: newChatOptionTextSurface.fontWeight,
    },
  }
}

export function getSplitPaneCopyState(): typeof SPLIT_PANE_PRESENTATION.copy {
  return SPLIT_PANE_PRESENTATION.copy
}

export function createSplitPaneSegmentButtonMobilePropsParts<
  TStyles extends SplitPaneSegmentButtonMobileStylesLike,
>({
  option,
  isSelected,
  onSelect,
  styles,
}: SplitPaneSegmentButtonMobilePropsPartsInput<
  TStyles
>): SplitPaneSegmentButtonMobilePropsParts<TStyles> {
  const surface = SPLIT_PANE_PRESENTATION.mobile.segmentButton

  return {
    pressable: {
      props: {
        onPress: () => onSelect(option),
        accessibilityRole: surface.accessibilityRole,
        accessibilityState: { selected: isSelected },
        style: ({ pressed }) => [
          styles.button,
          ...(isSelected ? [styles.activeButton] : []),
          ...(pressed ? [styles.pressedButton] : []),
        ],
      },
      content: {
        label: {
          text: SPLIT_PANE_PRESENTATION.copy.orientationLabel[option],
          props: {
            style: [
              styles.label,
              ...(isSelected ? [styles.activeLabel] : []),
            ],
          },
        },
      },
    },
  }
}

export function createSplitPaneToolbarActionMobilePropsParts<
  TStyles extends SplitPaneToolbarActionMobileStylesLike,
>({
  action,
  pane,
  isDisabled = false,
  onPress,
  iconColor,
  styles,
}: SplitPaneToolbarActionMobilePropsPartsInput<
  TStyles
>): SplitPaneToolbarActionMobilePropsParts<TStyles> {
  const surface = SPLIT_PANE_PRESENTATION.mobile.toolbarButton
  const icon = getSplitPaneToolbarActionMobileIconState(action)
  const label =
    action === "choose"
      ? SPLIT_PANE_PRESENTATION.copy.toolbar.chooseLabel
      : SPLIT_PANE_PRESENTATION.copy.toolbar.openLabel
  const rawAccessibilityLabel =
    action === "choose"
      ? formatSplitPaneChooseAccessibilityLabel(pane)
      : formatSplitPaneOpenAccessibilityLabel(pane)

  return {
    touchable: {
      props: {
        onPress,
        disabled: isDisabled,
        style: [
          styles.button,
          ...(isDisabled ? [styles.disabledButton] : []),
        ],
        activeOpacity: surface.pressedOpacity,
        accessibilityRole: surface.accessibilityRole,
        accessibilityLabel: createButtonAccessibilityLabel(rawAccessibilityLabel),
        accessibilityState: { disabled: isDisabled },
      },
      content: {
        icon: {
          props: {
            name: icon.name,
            size: icon.size,
            color: iconColor,
          },
        },
        label: {
          text: label,
          props: {
            style: styles.label,
          },
        },
      },
    },
  }
}

export function createSplitPaneEmptyStateActionMobilePropsParts<
  TStyles extends SplitPaneEmptyStateActionMobileStylesLike,
>({
  action,
  onPress,
  iconColor,
  styles,
}: SplitPaneEmptyStateActionMobilePropsPartsInput<
  TStyles
>): SplitPaneEmptyStateActionMobilePropsParts<TStyles> {
  const surface =
    action === "choose"
      ? SPLIT_PANE_PRESENTATION.mobile.primaryButton
      : SPLIT_PANE_PRESENTATION.mobile.secondaryButton
  const icon = getSplitPaneEmptyStateActionMobileIconState(action)
  const label =
    action === "choose"
      ? SPLIT_PANE_PRESENTATION.copy.emptyState.chooseLabel
      : SPLIT_PANE_PRESENTATION.copy.emptyState.newChatLabel

  return {
    touchable: {
      props: {
        onPress,
        style: styles.button,
        activeOpacity: surface.pressedOpacity,
        accessibilityRole: surface.accessibilityRole,
        accessibilityLabel: createButtonAccessibilityLabel(label),
      },
      content: {
        icon: {
          props: {
            name: icon.name,
            size: icon.size,
            color: iconColor,
          },
        },
        label: {
          text: label,
          props: {
            style: styles.label,
          },
        },
      },
    },
  }
}

export function createSplitPaneSessionOptionMobilePropsParts<
  TStyles extends SplitPaneSessionOptionMobileStylesLike,
>({
  title,
  preview,
  isSelected,
  onPress,
  styles,
}: SplitPaneSessionOptionMobilePropsPartsInput<
  TStyles
>): SplitPaneSessionOptionMobilePropsParts<TStyles> {
  const surface = SPLIT_PANE_PRESENTATION.mobile.sessionOption

  return {
    touchable: {
      props: {
        onPress,
        style: [
          styles.option,
          ...(isSelected ? [styles.activeOption] : []),
        ],
        activeOpacity: surface.pressedOpacity,
        accessibilityRole: surface.accessibilityRole,
        accessibilityState: { selected: isSelected },
      },
      content: {
        title: {
          text: title,
          props: {
            style: styles.title,
            numberOfLines: surface.title.numberOfLines,
          },
        },
        preview: {
          text: preview || SPLIT_PANE_PRESENTATION.copy.modal.sessionPreviewFallback,
          props: {
            style: styles.preview,
            numberOfLines: surface.preview.numberOfLines,
          },
        },
      },
    },
  }
}

export function createSplitPaneModalCreateActionMobilePropsParts<
  TStyles extends SplitPaneModalCreateActionMobileStylesLike,
>({
  onPress,
  iconColor,
  styles,
}: SplitPaneModalCreateActionMobilePropsPartsInput<
  TStyles
>): SplitPaneModalCreateActionMobilePropsParts<TStyles> {
  const surface = SPLIT_PANE_PRESENTATION.mobile.newChatOption
  const icon = getSplitPaneModalCreateMobileIconState()
  const label = SPLIT_PANE_PRESENTATION.copy.modal.createNewChatLabel

  return {
    touchable: {
      props: {
        onPress,
        style: styles.button,
        activeOpacity: surface.pressedOpacity,
        accessibilityRole: surface.accessibilityRole,
        accessibilityLabel: createButtonAccessibilityLabel(label),
      },
      content: {
        icon: {
          props: {
            name: icon.name,
            size: icon.size,
            color: iconColor,
          },
        },
        label: {
          text: label,
          props: {
            style: styles.label,
          },
        },
      },
    },
  }
}

export function createSplitPanePaneHeaderMobilePropsParts<
  TStyles extends SplitPanePaneHeaderMobileStylesLike,
>({
  pane,
  title,
  styles,
}: SplitPanePaneHeaderMobilePropsPartsInput<
  TStyles
>): SplitPanePaneHeaderMobilePropsParts<TStyles> {
  const surface = SPLIT_PANE_PRESENTATION.mobile.paneTitle

  return {
    content: {
      label: {
        text: SPLIT_PANE_PRESENTATION.copy.paneLabel[pane],
        props: {
          style: styles.label,
        },
      },
      title: {
        text: title || SPLIT_PANE_PRESENTATION.copy.noChatSelected,
        props: {
          style: styles.title,
          numberOfLines: surface.numberOfLines,
        },
      },
    },
  }
}

export function getSplitPaneToolbarActionMobileIconState(
  action: SplitPaneToolbarAction,
) {
  const surface = SPLIT_PANE_PRESENTATION.mobile.toolbarButton

  return {
    name: action === "choose" ? surface.chooseIconName : surface.openIconName,
    size: surface.iconSize,
    colorToken: surface.iconColorToken,
  } as const
}

export function getSplitPaneEmptyStateActionMobileIconState(
  action: SplitPaneEmptyStateAction,
) {
  const surface =
    action === "choose"
      ? SPLIT_PANE_PRESENTATION.mobile.primaryButton
      : SPLIT_PANE_PRESENTATION.mobile.secondaryButton

  return {
    name: surface.iconName,
    size: surface.iconSize,
    colorToken: surface.iconColorToken,
  } as const
}

export function getSplitPaneModalCreateMobileIconState() {
  const surface = SPLIT_PANE_PRESENTATION.mobile.newChatOption

  return {
    name: surface.iconName,
    size: surface.iconSize,
    colorToken: surface.iconColorToken,
  } as const
}

export function formatSplitPaneChooseAccessibilityLabel(pane: SplitPane): string {
  return `Choose ${pane} split chat`
}

export function formatSplitPaneOpenAccessibilityLabel(pane: SplitPane): string {
  return `Open ${pane} split chat full screen`
}

export function formatSplitPaneModalTitle(pane: SplitPane | null): string {
  return `Choose ${pane === "primary" ? "primary" : "secondary"} chat`
}

function uniqueSessionIds(sessionIds: string[]): string[] {
  return Array.from(new Set(sessionIds.filter(Boolean)))
}

export function getInitialSplitSessionIds(
  sessionIds: string[],
  preferredId?: string | null,
): SplitPaneSelection {
  const uniqueIds = uniqueSessionIds(sessionIds)
  const primary = preferredId && uniqueIds.includes(preferredId) ? preferredId : uniqueIds[0] ?? null
  const secondary = uniqueIds.find((id) => id !== primary) ?? null

  return { primary, secondary }
}

export function replaceSplitPaneSelection(
  selection: SplitPaneSelection,
  pane: SplitPane,
  nextSessionId: string | null,
): SplitPaneSelection {
  if (pane === "primary") {
    if (!nextSessionId) return { ...selection, primary: null }
    return nextSessionId === selection.secondary
      ? { primary: nextSessionId, secondary: selection.primary }
      : { ...selection, primary: nextSessionId }
  }

  if (!nextSessionId) return { ...selection, secondary: null }
  return nextSessionId === selection.primary
    ? { primary: selection.secondary, secondary: nextSessionId }
    : { ...selection, secondary: nextSessionId }
}

export function reconcileSplitPaneSelection(
  selection: SplitPaneSelection,
  sessionIds: string[],
  preferredId?: string | null,
): SplitPaneSelection {
  const uniqueIds = uniqueSessionIds(sessionIds)
  let primary = selection.primary && uniqueIds.includes(selection.primary) ? selection.primary : null
  let secondary = selection.secondary && uniqueIds.includes(selection.secondary) ? selection.secondary : null

  if (!primary) {
    primary = preferredId && uniqueIds.includes(preferredId) ? preferredId : uniqueIds[0] ?? null
  }

  if (secondary === primary) {
    secondary = null
  }

  if (!secondary) {
    secondary = uniqueIds.find((id) => id !== primary) ?? null
  }

  return { primary, secondary }
}

export function resolveSplitOrientation(
  preference: SplitOrientationPreference,
  width: number,
  height: number,
): "horizontal" | "vertical" {
  if (preference !== "auto") return preference
  return width >= APP_SHELL_BREAKPOINTS.splitPaneSideBySideMinWidth ||
    width > height
    ? "vertical"
    : "horizontal"
}
