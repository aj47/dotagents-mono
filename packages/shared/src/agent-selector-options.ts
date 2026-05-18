import {
  getAcpxMainAgentOptions,
  toMainAgentProfile,
  type MainAcpLegacyAgentCandidate,
  type LegacyMainAgentMode,
} from "./main-agent-selection"
import { hexToRgba } from "./colors"
import { getAgentAvatarColors } from "./agent-avatar-colors"

export type AgentSelectorProfileCandidate = {
  id: string
  name?: string
  displayName?: string
  description?: string
  guidelines?: string
  avatarDataUrl?: string | null
  enabled?: boolean
  isDefault?: boolean
  connection?: {
    type?: string
  }
  connectionType?: string
}

export type AgentSelectorMode = "profile" | "acpx"

export interface SelectableAgentProfile {
  id: string
  name: string
  guidelines?: string
  description?: string
  avatarDataUrl?: string | null
  selectorMode: AgentSelectorMode
  selectionValue: string
}

export type AgentSelectorSettings = {
  mainAgentMode?: LegacyMainAgentMode
  acpxAgents?: MainAcpLegacyAgentCandidate[]
} | null | undefined

export const AGENT_SELECTOR_PRESENTATION = {
  common: {
    defaultAgentLabel: "Default Agent",
    newAgentLabel: "New agent…",
  },
  desktop: {
    triggerClassName:
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-sm overflow-hidden hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    contentClassName:
      "max-h-[300px] w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto",
    itemClassName: "min-w-0 items-center gap-2",
    agentItemClassName: "min-w-0 items-center gap-2 pr-1",
    avatarClassName: "h-5 w-5 shrink-0 rounded overflow-hidden flex items-center justify-center",
    createActionIconWrapperClassName: "flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground",
    labelClassName: "min-w-0 flex-1 truncate text-sm font-medium",
    checkIconClassName: "h-3.5 w-3.5 shrink-0",
    editButtonClassName:
      "ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    triggerAvatarSize: 28,
    menuAvatarSize: 20,
    triggerBotIconClassName: "h-4 w-4 text-muted-foreground",
    menuBotIconClassName: "h-4 w-4 text-muted-foreground",
    editIconClassName: "h-3.5 w-3.5",
    newAgentIconClassName: "h-4 w-4",
  },
  sheet: {
    title: {
      profile: "Select Agent",
      acpx: "Select Main Agent",
    },
    closeLabel: "Close",
    closeAccessibilityLabel: "Close agent selector",
    loadingLabel: "Loading agents...",
    retryLabel: "Retry",
    missingConfigError: "Configure server URL and API key to switch agents",
    loadFailed: "Failed to load agents",
    switchFailed: "Failed to switch agent",
    empty: {
      profile: "No agents available",
      acpx: "No acpx agents available",
    },
  },
  mobile: {
    backdrop: {
      color: "#000000",
      alpha: 0.4,
    },
    backdropSpacer: {
      flex: 1,
    },
    sheet: {
      backgroundColorToken: "card",
      borderTopRadius: "xl",
      paddingHorizontal: "lg",
      paddingTop: "sm",
      maxHeight: "60%",
      bottomPadding: "md",
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColorToken: "border",
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: "sm",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: "md",
      marginBottom: "md",
    },
    title: {
      numberOfLines: 1,
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 22,
      colorToken: "foreground",
    },
    headerCloseButton: {
      width: 32,
      height: 32,
      borderRadius: "md",
      alignItems: "center",
      justifyContent: "center",
      pressedOpacity: 0.72,
      paddingHorizontal: "xs",
      paddingVertical: "xs",
      negativeMarginRight: "xs",
      accessibilityRole: "button",
    },
    headerCloseIcon: {
      name: "close",
      size: 20,
      colorToken: "mutedForeground",
    },
    list: {
      maxHeight: 300,
    },
    profileItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "sm",
      paddingVertical: "md",
      paddingHorizontal: "sm",
      borderRadius: "lg",
      marginBottom: "xs",
      selectedBackgroundColorToken: "primary",
      selectedBackgroundAlpha: 0.12,
      accessibilityRole: "button",
      pressedOpacity: 0.78,
    },
    avatar: {
      size: 28,
      borderRadius: "md",
      fallbackBackgroundAlpha: 0.14,
      fallbackIconName: "hardware-chip-outline",
      fallbackIconSize: 16,
      fallbackIconColorToken: "primary",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    profileInfo: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      numberOfLines: 1,
      fontSize: 16,
      fontWeight: "500",
      selectedFontWeight: "600",
      colorToken: "foreground",
      selectedColorToken: "primary",
    },
    profileDescription: {
      numberOfLines: 1,
      fontSize: 12,
      colorToken: "mutedForeground",
      marginTop: 2,
    },
    checkIcon: {
      name: "checkmark",
      size: 18,
      colorToken: "primary",
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: "xl",
      gap: "sm",
    },
    loadingText: {
      colorToken: "mutedForeground",
    },
    errorContainer: {
      alignItems: "center",
      paddingVertical: "lg",
      gap: "sm",
    },
    errorText: {
      colorToken: "destructive",
    },
    retryButton: {
      paddingHorizontal: "lg",
      paddingVertical: "sm",
    },
    retryButtonText: {
      colorToken: "primary",
      fontWeight: "500",
    },
    emptyText: {
      textAlign: "center",
      colorToken: "mutedForeground",
      paddingVertical: "lg",
    },
    activityIndicator: {
      colorToken: "primary",
    },
  },
} as const

export interface AgentSelectorMobileCloseIconState {
  name: typeof AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.name
  size: number
  colorToken: typeof AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.colorToken
}

export interface AgentSelectorMobileRenderStateInput {
  selectorMode: AgentSelectorMode
  colors: AgentSelectorMobileSurfaceColorPalette
}

export interface AgentSelectorMobileProfileItemRenderStateInput {
  profile: SelectableAgentProfile
  currentProfileId?: string | null
  isSwitching?: boolean
}

export interface AgentSelectorMobileProfileItemRenderState {
  isSelected: boolean
  isDisabled: boolean
  profileSummary: string
  shouldRenderProfileSummary: boolean
  activeOpacity: typeof AGENT_SELECTOR_PRESENTATION.mobile.profileItem.pressedOpacity
  accessibilityRole: typeof AGENT_SELECTOR_PRESENTATION.mobile.profileItem.accessibilityRole
  accessibilityLabel: string
  accessibilityState: {
    selected: boolean
    disabled: boolean
  }
  fallbackAvatar: {
    backgroundColor: string
  }
}

export interface AgentSelectorProfileItemMobilePropsStylesLike<
  TProfileItemStyle = unknown,
  TProfileItemSelectedStyle = unknown,
  TProfileAvatarStyle = unknown,
  TProfileAvatarImageStyle = unknown,
  TProfileInfoStyle = unknown,
  TProfileNameStyle = unknown,
  TProfileNameSelectedStyle = unknown,
  TProfileDescriptionStyle = unknown,
> {
  profileItem: TProfileItemStyle
  profileItemSelected: TProfileItemSelectedStyle
  profileAvatar: TProfileAvatarStyle
  profileAvatarImage: TProfileAvatarImageStyle
  profileInfo: TProfileInfoStyle
  profileName: TProfileNameStyle
  profileNameSelected: TProfileNameSelectedStyle
  profileDescription: TProfileDescriptionStyle
}

export interface AgentSelectorProfileItemMobilePropsPartsInput<
  TProfile extends SelectableAgentProfile = SelectableAgentProfile,
  TStyles extends AgentSelectorProfileItemMobilePropsStylesLike =
    AgentSelectorProfileItemMobilePropsStylesLike,
  TImageSource = unknown,
  TOnPress = unknown,
> {
  profile: TProfile
  renderState: Pick<AgentSelectorMobileRenderState, "surface" | "colors">
  profileRenderState: AgentSelectorMobileProfileItemRenderState
  styles: TStyles
  avatarImageSource?: TImageSource | null
  onPress: TOnPress
}

export interface AgentSelectorProfileItemMobilePropsParts<
  TStyles extends AgentSelectorProfileItemMobilePropsStylesLike =
    AgentSelectorProfileItemMobilePropsStylesLike,
  TImageSource = unknown,
  TOnPress = unknown,
> {
  touchable: {
    props: {
      style: Array<TStyles["profileItem"] | false | TStyles["profileItemSelected"]>
      onPress: TOnPress
      disabled: boolean
      activeOpacity: AgentSelectorMobileProfileItemRenderState["activeOpacity"]
      accessibilityRole: AgentSelectorMobileProfileItemRenderState["accessibilityRole"]
      accessibilityLabel: AgentSelectorMobileProfileItemRenderState["accessibilityLabel"]
      accessibilityState: AgentSelectorMobileProfileItemRenderState["accessibilityState"]
    }
    content: {
      avatar: {
        props: {
          style: Array<
            | TStyles["profileAvatar"]
            | false
            | AgentSelectorMobileProfileItemRenderState["fallbackAvatar"]
          >
        }
        image: {
          shouldRender: boolean
          props: {
            source: TImageSource
            style: TStyles["profileAvatarImage"]
            accessibilityIgnoresInvertColors: true
          }
        }
        fallbackIcon: {
          shouldRender: boolean
          props: {
            name: AgentSelectorMobileSurface["avatar"]["fallbackIconName"]
            size: AgentSelectorMobileSurface["avatar"]["fallbackIconSize"]
            color: AgentSelectorMobileSurfaceColors["avatar"]["fallbackIconColor"]
          }
        }
      }
      profileInfo: {
        props: {
          style: TStyles["profileInfo"]
        }
        name: {
          text: string
          props: {
            style: Array<TStyles["profileName"] | false | TStyles["profileNameSelected"]>
            numberOfLines: AgentSelectorMobileSurface["profileName"]["numberOfLines"]
          }
        }
        description: {
          shouldRender: boolean
          text: string
          props: {
            style: TStyles["profileDescription"]
            numberOfLines: AgentSelectorMobileSurface["profileDescription"]["numberOfLines"]
          }
        }
      }
      checkIcon: {
        shouldRender: boolean
        props: {
          name: AgentSelectorMobileSurface["checkIcon"]["name"]
          size: AgentSelectorMobileSurface["checkIcon"]["size"]
          color: AgentSelectorMobileSurfaceColors["checkIcon"]["color"]
        }
      }
    }
  }
}

export interface AgentSelectorSheetMobilePropsStylesLike<
  TBackdropStyle = unknown,
  TBackdropSpacerStyle = unknown,
  TSheetStyle = unknown,
  THandleStyle = unknown,
  THeaderStyle = unknown,
  TTitleStyle = unknown,
  THeaderCloseButtonStyle = unknown,
  TListStyle = unknown,
  TLoadingContainerStyle = unknown,
  TLoadingTextStyle = unknown,
  TErrorContainerStyle = unknown,
  TErrorTextStyle = unknown,
  TRetryButtonStyle = unknown,
  TRetryButtonTextStyle = unknown,
  TEmptyTextStyle = unknown,
> {
  backdrop: TBackdropStyle
  backdropSpacer: TBackdropSpacerStyle
  sheet: TSheetStyle
  handle: THandleStyle
  header: THeaderStyle
  title: TTitleStyle
  headerCloseButton: THeaderCloseButtonStyle
  list: TListStyle
  loadingContainer: TLoadingContainerStyle
  loadingText: TLoadingTextStyle
  errorContainer: TErrorContainerStyle
  errorText: TErrorTextStyle
  retryButton: TRetryButtonStyle
  retryButtonText: TRetryButtonTextStyle
  emptyText: TEmptyTextStyle
}

export interface AgentSelectorSheetMobilePropsPartsInput<
  TStyles extends AgentSelectorSheetMobilePropsStylesLike =
    AgentSelectorSheetMobilePropsStylesLike,
  TOnClose = unknown,
  TOnRetry = unknown,
> {
  visible: boolean
  renderState: AgentSelectorMobileRenderState
  styles: TStyles
  sheetBottomPadding: number
  safeAreaBottom: number
  isLoading: boolean
  error?: string | null
  hasProfiles: boolean
  onClose: TOnClose
  onRetry: TOnRetry
}

export interface AgentSelectorSheetMobilePropsParts<
  TStyles extends AgentSelectorSheetMobilePropsStylesLike =
    AgentSelectorSheetMobilePropsStylesLike,
  TOnClose = unknown,
  TOnRetry = unknown,
> {
  modal: {
    props: {
      visible: boolean
      animationType: "slide"
      transparent: true
      onRequestClose: TOnClose
    }
  }
  backdrop: {
    props: {
      style: TStyles["backdrop"]
      onPress: TOnClose
    }
  }
  backdropSpacer: {
    props: {
      style: TStyles["backdropSpacer"]
    }
  }
  sheet: {
    props: {
      style: Array<TStyles["sheet"] | { paddingBottom: number }>
    }
  }
  handle: {
    props: {
      style: TStyles["handle"]
    }
  }
  header: {
    props: {
      style: TStyles["header"]
    }
  }
  title: {
    text: string
    props: {
      style: TStyles["title"]
      numberOfLines: AgentSelectorMobileSurface["title"]["numberOfLines"]
    }
  }
  closeButton: {
    props: {
      style: TStyles["headerCloseButton"]
      onPress: TOnClose
      activeOpacity: AgentSelectorMobileRenderState["closeButton"]["activeOpacity"]
      accessibilityRole: AgentSelectorMobileRenderState["closeButton"]["accessibilityRole"]
      accessibilityLabel: AgentSelectorMobileRenderState["closeButton"]["accessibilityLabel"]
    }
    icon: {
      props: AgentSelectorMobileRenderState["closeButton"]["icon"]
    }
  }
  loading: {
    shouldRender: boolean
    container: {
      props: {
        style: TStyles["loadingContainer"]
      }
    }
    indicator: {
      props: {
        size: "small"
        color: AgentSelectorMobileSurfaceColors["activityIndicator"]["color"]
      }
    }
    label: {
      text: typeof AGENT_SELECTOR_PRESENTATION.sheet.loadingLabel
      props: {
        style: TStyles["loadingText"]
      }
    }
  }
  error: {
    shouldRender: boolean
    container: {
      props: {
        style: TStyles["errorContainer"]
      }
    }
    message: {
      text: string
      props: {
        style: TStyles["errorText"]
      }
    }
    retryButton: {
      props: {
        style: TStyles["retryButton"]
        onPress: TOnRetry
      }
    }
    retryLabel: {
      text: typeof AGENT_SELECTOR_PRESENTATION.sheet.retryLabel
      props: {
        style: TStyles["retryButtonText"]
      }
    }
  }
  empty: {
    shouldRender: boolean
    text: string
    props: {
      style: TStyles["emptyText"]
    }
  }
  list: {
    shouldRender: boolean
    props: {
      style: TStyles["list"]
      showsVerticalScrollIndicator: false
    }
  }
}

export interface AgentSelectorMobileRenderState {
  copy: typeof AGENT_SELECTOR_PRESENTATION.sheet
  surface: typeof AGENT_SELECTOR_PRESENTATION.mobile
  colors: AgentSelectorMobileSurfaceColors
  title: string
  emptyLabel: string
  closeButton: {
    activeOpacity: typeof AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.pressedOpacity
    accessibilityRole: typeof AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.accessibilityRole
    accessibilityLabel: typeof AGENT_SELECTOR_PRESENTATION.sheet.closeAccessibilityLabel
    icon: {
      name: AgentSelectorMobileCloseIconState["name"]
      size: number
      color: string
    }
  }
}

export type AgentSelectorMobileSurfaceColorToken =
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.sheet.backgroundColorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.handle.backgroundColorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.title.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.profileItem.selectedBackgroundColorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.avatar.fallbackIconColorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.profileName.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.profileName.selectedColorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.profileDescription.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.checkIcon.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.loadingText.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.errorText.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.retryButtonText.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.emptyText.colorToken
  | typeof AGENT_SELECTOR_PRESENTATION.mobile.activityIndicator.colorToken

export type AgentSelectorMobileSurfaceColorPalette =
  Readonly<Record<AgentSelectorMobileSurfaceColorToken, string>>

export interface AgentSelectorMobileSurfaceColors {
  backdrop: {
    backgroundColor: string
  }
  sheet: {
    backgroundColor: string
  }
  handle: {
    backgroundColor: string
  }
  title: {
    color: string
  }
  headerCloseIcon: {
    color: string
  }
  profileItem: {
    selectedBackgroundColor: string
  }
  avatar: {
    fallbackIconColor: string
  }
  profileName: {
    color: string
    selectedColor: string
  }
  profileDescription: {
    color: string
  }
  checkIcon: {
    color: string
  }
  loadingText: {
    color: string
  }
  errorText: {
    color: string
  }
  retryButtonText: {
    color: string
  }
  emptyText: {
    color: string
  }
  activityIndicator: {
    color: string
  }
}

type AgentSelectorMobileSurface = typeof AGENT_SELECTOR_PRESENTATION.mobile

export type AgentSelectorMobileStyleSpacingToken =
  | AgentSelectorMobileSurface["sheet"]["paddingHorizontal"]
  | AgentSelectorMobileSurface["sheet"]["paddingTop"]
  | AgentSelectorMobileSurface["sheet"]["bottomPadding"]
  | AgentSelectorMobileSurface["handle"]["marginBottom"]
  | AgentSelectorMobileSurface["header"]["gap"]
  | AgentSelectorMobileSurface["header"]["marginBottom"]
  | AgentSelectorMobileSurface["headerCloseButton"]["paddingHorizontal"]
  | AgentSelectorMobileSurface["headerCloseButton"]["paddingVertical"]
  | AgentSelectorMobileSurface["headerCloseButton"]["negativeMarginRight"]
  | AgentSelectorMobileSurface["profileItem"]["gap"]
  | AgentSelectorMobileSurface["profileItem"]["paddingVertical"]
  | AgentSelectorMobileSurface["profileItem"]["paddingHorizontal"]
  | AgentSelectorMobileSurface["profileItem"]["marginBottom"]
  | AgentSelectorMobileSurface["loadingContainer"]["paddingVertical"]
  | AgentSelectorMobileSurface["loadingContainer"]["gap"]
  | AgentSelectorMobileSurface["errorContainer"]["paddingVertical"]
  | AgentSelectorMobileSurface["errorContainer"]["gap"]
  | AgentSelectorMobileSurface["retryButton"]["paddingHorizontal"]
  | AgentSelectorMobileSurface["retryButton"]["paddingVertical"]
  | AgentSelectorMobileSurface["emptyText"]["paddingVertical"]

export type AgentSelectorMobileStyleRadiusToken =
  | AgentSelectorMobileSurface["sheet"]["borderTopRadius"]
  | AgentSelectorMobileSurface["headerCloseButton"]["borderRadius"]
  | AgentSelectorMobileSurface["profileItem"]["borderRadius"]
  | AgentSelectorMobileSurface["avatar"]["borderRadius"]

export interface AgentSelectorMobileStyleSlotsInput {
  renderState: Pick<AgentSelectorMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<AgentSelectorMobileStyleSpacingToken, number>>
  radius: Readonly<Record<AgentSelectorMobileStyleRadiusToken, number>>
}

export interface AgentSelectorMobileStyleSlots {
  backdrop: {
    flex: number
    backgroundColor: string
  }
  backdropSpacer: {
    flex: number
  }
  sheet: {
    backgroundColor: string
    borderTopLeftRadius: number
    borderTopRightRadius: number
    paddingHorizontal: number
    paddingTop: number
    paddingBottom: number
    maxHeight: AgentSelectorMobileSurface["sheet"]["maxHeight"]
  }
  handle: {
    width: number
    height: number
    backgroundColor: string
    borderRadius: number
    alignSelf: AgentSelectorMobileSurface["handle"]["alignSelf"]
    marginBottom: number
  }
  header: {
    flexDirection: AgentSelectorMobileSurface["header"]["flexDirection"]
    alignItems: AgentSelectorMobileSurface["header"]["alignItems"]
    gap: number
    marginBottom: number
  }
  title: {
    flex: number
    minWidth: number
    fontSize: number
    fontWeight: AgentSelectorMobileSurface["title"]["fontWeight"]
    lineHeight: number
    color: string
  }
  headerCloseButton: {
    width: number
    height: number
    borderRadius: number
    alignItems: AgentSelectorMobileSurface["headerCloseButton"]["alignItems"]
    justifyContent: AgentSelectorMobileSurface["headerCloseButton"]["justifyContent"]
    paddingHorizontal: number
    paddingVertical: number
    marginRight: number
  }
  list: {
    maxHeight: number
  }
  profileItem: {
    flexDirection: AgentSelectorMobileSurface["profileItem"]["flexDirection"]
    alignItems: AgentSelectorMobileSurface["profileItem"]["alignItems"]
    justifyContent: AgentSelectorMobileSurface["profileItem"]["justifyContent"]
    gap: number
    paddingVertical: number
    paddingHorizontal: number
    borderRadius: number
    marginBottom: number
  }
  profileItemSelected: {
    backgroundColor: string
  }
  profileAvatar: {
    width: number
    height: number
    borderRadius: number
    alignItems: AgentSelectorMobileSurface["avatar"]["alignItems"]
    justifyContent: AgentSelectorMobileSurface["avatar"]["justifyContent"]
    overflow: AgentSelectorMobileSurface["avatar"]["overflow"]
    flexShrink: number
  }
  profileAvatarImage: {
    width: AgentSelectorMobileSurface["avatarImage"]["width"]
    height: AgentSelectorMobileSurface["avatarImage"]["height"]
  }
  profileInfo: {
    flex: number
    minWidth: number
  }
  profileName: {
    fontSize: number
    fontWeight: AgentSelectorMobileSurface["profileName"]["fontWeight"]
    color: string
  }
  profileNameSelected: {
    color: string
    fontWeight: AgentSelectorMobileSurface["profileName"]["selectedFontWeight"]
  }
  profileDescription: {
    fontSize: number
    color: string
    marginTop: number
  }
  loadingContainer: {
    alignItems: AgentSelectorMobileSurface["loadingContainer"]["alignItems"]
    paddingVertical: number
    gap: number
  }
  loadingText: {
    color: string
  }
  errorContainer: {
    alignItems: AgentSelectorMobileSurface["errorContainer"]["alignItems"]
    paddingVertical: number
    gap: number
  }
  errorText: {
    color: string
  }
  retryButton: {
    paddingHorizontal: number
    paddingVertical: number
  }
  retryButtonText: {
    color: string
    fontWeight: AgentSelectorMobileSurface["retryButtonText"]["fontWeight"]
  }
  emptyText: {
    textAlign: AgentSelectorMobileSurface["emptyText"]["textAlign"]
    color: string
    paddingVertical: number
  }
}

export function getAgentSelectorSheetCopyState(): typeof AGENT_SELECTOR_PRESENTATION.sheet {
  return AGENT_SELECTOR_PRESENTATION.sheet
}

export function getAgentSelectorCommonCopyState(): typeof AGENT_SELECTOR_PRESENTATION.common {
  return AGENT_SELECTOR_PRESENTATION.common
}

export function getAgentSelectorDesktopSurfaceState(): typeof AGENT_SELECTOR_PRESENTATION.desktop {
  return AGENT_SELECTOR_PRESENTATION.desktop
}

export function getAgentSelectorMobileSurfaceState(): typeof AGENT_SELECTOR_PRESENTATION.mobile {
  return AGENT_SELECTOR_PRESENTATION.mobile
}

export function getAgentSelectorMobileSurfaceColors(
  colors: AgentSelectorMobileSurfaceColorPalette,
): AgentSelectorMobileSurfaceColors {
  const surface = AGENT_SELECTOR_PRESENTATION.mobile

  return {
    backdrop: {
      backgroundColor: hexToRgba(surface.backdrop.color, surface.backdrop.alpha),
    },
    sheet: {
      backgroundColor: colors[surface.sheet.backgroundColorToken],
    },
    handle: {
      backgroundColor: colors[surface.handle.backgroundColorToken],
    },
    title: {
      color: colors[surface.title.colorToken],
    },
    headerCloseIcon: {
      color: colors[surface.headerCloseIcon.colorToken],
    },
    profileItem: {
      selectedBackgroundColor: hexToRgba(
        colors[surface.profileItem.selectedBackgroundColorToken],
        surface.profileItem.selectedBackgroundAlpha,
      ),
    },
    avatar: {
      fallbackIconColor: colors[surface.avatar.fallbackIconColorToken],
    },
    profileName: {
      color: colors[surface.profileName.colorToken],
      selectedColor: colors[surface.profileName.selectedColorToken],
    },
    profileDescription: {
      color: colors[surface.profileDescription.colorToken],
    },
    checkIcon: {
      color: colors[surface.checkIcon.colorToken],
    },
    loadingText: {
      color: colors[surface.loadingText.colorToken],
    },
    errorText: {
      color: colors[surface.errorText.colorToken],
    },
    retryButtonText: {
      color: colors[surface.retryButtonText.colorToken],
    },
    emptyText: {
      color: colors[surface.emptyText.colorToken],
    },
    activityIndicator: {
      color: colors[surface.activityIndicator.colorToken],
    },
  }
}

export function getAgentSelectorMobileFallbackAvatarBackgroundColor(color: string): string {
  return hexToRgba(color, AGENT_SELECTOR_PRESENTATION.mobile.avatar.fallbackBackgroundAlpha)
}

export function getAgentSelectorMobileCloseIconState(): AgentSelectorMobileCloseIconState {
  const closeIcon = AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon

  return {
    name: closeIcon.name,
    size: closeIcon.size,
    colorToken: closeIcon.colorToken,
  }
}

export function getAgentSelectorMobileRenderState({
  selectorMode,
  colors,
}: AgentSelectorMobileRenderStateInput): AgentSelectorMobileRenderState {
  const copy = getAgentSelectorSheetCopyState()
  const surface = getAgentSelectorMobileSurfaceState()
  const surfaceColors = getAgentSelectorMobileSurfaceColors(colors)
  const closeIcon = getAgentSelectorMobileCloseIconState()

  return {
    copy,
    surface,
    colors: surfaceColors,
    title: getAgentSelectorSheetTitle(selectorMode),
    emptyLabel: getAgentSelectorSheetEmptyLabel(selectorMode),
    closeButton: {
      activeOpacity: surface.headerCloseButton.pressedOpacity,
      accessibilityRole: surface.headerCloseButton.accessibilityRole,
      accessibilityLabel: copy.closeAccessibilityLabel,
      icon: {
        name: closeIcon.name,
        size: closeIcon.size,
        color: surfaceColors.headerCloseIcon.color,
      },
    },
  }
}

export function createAgentSelectorMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: AgentSelectorMobileStyleSlotsInput): AgentSelectorMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop.backgroundColor,
    },
    backdropSpacer: {
      flex: surface.backdropSpacer.flex,
    },
    sheet: {
      backgroundColor: colors.sheet.backgroundColor,
      borderTopLeftRadius: radius[surface.sheet.borderTopRadius],
      borderTopRightRadius: radius[surface.sheet.borderTopRadius],
      paddingHorizontal: spacing[surface.sheet.paddingHorizontal],
      paddingTop: spacing[surface.sheet.paddingTop],
      paddingBottom: spacing[surface.sheet.bottomPadding],
      maxHeight: surface.sheet.maxHeight,
    },
    handle: {
      width: surface.handle.width,
      height: surface.handle.height,
      backgroundColor: colors.handle.backgroundColor,
      borderRadius: surface.handle.borderRadius,
      alignSelf: surface.handle.alignSelf,
      marginBottom: spacing[surface.handle.marginBottom],
    },
    header: {
      flexDirection: surface.header.flexDirection,
      alignItems: surface.header.alignItems,
      gap: spacing[surface.header.gap],
      marginBottom: spacing[surface.header.marginBottom],
    },
    title: {
      flex: surface.title.flex,
      minWidth: surface.title.minWidth,
      fontSize: surface.title.fontSize,
      fontWeight: surface.title.fontWeight,
      lineHeight: surface.title.lineHeight,
      color: colors.title.color,
    },
    headerCloseButton: {
      width: surface.headerCloseButton.width,
      height: surface.headerCloseButton.height,
      borderRadius: radius[surface.headerCloseButton.borderRadius],
      alignItems: surface.headerCloseButton.alignItems,
      justifyContent: surface.headerCloseButton.justifyContent,
      paddingHorizontal: spacing[surface.headerCloseButton.paddingHorizontal],
      paddingVertical: spacing[surface.headerCloseButton.paddingVertical],
      marginRight: -spacing[surface.headerCloseButton.negativeMarginRight],
    },
    list: {
      maxHeight: surface.list.maxHeight,
    },
    profileItem: {
      flexDirection: surface.profileItem.flexDirection,
      alignItems: surface.profileItem.alignItems,
      justifyContent: surface.profileItem.justifyContent,
      gap: spacing[surface.profileItem.gap],
      paddingVertical: spacing[surface.profileItem.paddingVertical],
      paddingHorizontal: spacing[surface.profileItem.paddingHorizontal],
      borderRadius: radius[surface.profileItem.borderRadius],
      marginBottom: spacing[surface.profileItem.marginBottom],
    },
    profileItemSelected: {
      backgroundColor: colors.profileItem.selectedBackgroundColor,
    },
    profileAvatar: {
      width: surface.avatar.size,
      height: surface.avatar.size,
      borderRadius: radius[surface.avatar.borderRadius],
      alignItems: surface.avatar.alignItems,
      justifyContent: surface.avatar.justifyContent,
      overflow: surface.avatar.overflow,
      flexShrink: surface.avatar.flexShrink,
    },
    profileAvatarImage: {
      width: surface.avatarImage.width,
      height: surface.avatarImage.height,
    },
    profileInfo: {
      flex: surface.profileInfo.flex,
      minWidth: surface.profileInfo.minWidth,
    },
    profileName: {
      fontSize: surface.profileName.fontSize,
      fontWeight: surface.profileName.fontWeight,
      color: colors.profileName.color,
    },
    profileNameSelected: {
      color: colors.profileName.selectedColor,
      fontWeight: surface.profileName.selectedFontWeight,
    },
    profileDescription: {
      fontSize: surface.profileDescription.fontSize,
      color: colors.profileDescription.color,
      marginTop: surface.profileDescription.marginTop,
    },
    loadingContainer: {
      alignItems: surface.loadingContainer.alignItems,
      paddingVertical: spacing[surface.loadingContainer.paddingVertical],
      gap: spacing[surface.loadingContainer.gap],
    },
    loadingText: {
      color: colors.loadingText.color,
    },
    errorContainer: {
      alignItems: surface.errorContainer.alignItems,
      paddingVertical: spacing[surface.errorContainer.paddingVertical],
      gap: spacing[surface.errorContainer.gap],
    },
    errorText: {
      color: colors.errorText.color,
    },
    retryButton: {
      paddingHorizontal: spacing[surface.retryButton.paddingHorizontal],
      paddingVertical: spacing[surface.retryButton.paddingVertical],
    },
    retryButtonText: {
      color: colors.retryButtonText.color,
      fontWeight: surface.retryButtonText.fontWeight,
    },
    emptyText: {
      textAlign: surface.emptyText.textAlign,
      color: colors.emptyText.color,
      paddingVertical: spacing[surface.emptyText.paddingVertical],
    },
  }
}

export function getAgentSelectorMobileProfileItemRenderState({
  profile,
  currentProfileId = null,
  isSwitching = false,
}: AgentSelectorMobileProfileItemRenderStateInput): AgentSelectorMobileProfileItemRenderState {
  const profileSummary = profile.description || profile.guidelines || ""
  const fallbackAvatarColor = getAgentAvatarColors(profile.id)[0]
  const isSelected = currentProfileId === profile.id
  const isDisabled = isSwitching === true

  return {
    isSelected,
    isDisabled,
    profileSummary,
    shouldRenderProfileSummary: profileSummary.length > 0,
    activeOpacity: AGENT_SELECTOR_PRESENTATION.mobile.profileItem.pressedOpacity,
    accessibilityRole: AGENT_SELECTOR_PRESENTATION.mobile.profileItem.accessibilityRole,
    accessibilityLabel: formatAgentSelectorSelectAccessibilityLabel(profile.name),
    accessibilityState: {
      selected: isSelected,
      disabled: isDisabled,
    },
    fallbackAvatar: {
      backgroundColor: getAgentSelectorMobileFallbackAvatarBackgroundColor(fallbackAvatarColor),
    },
  }
}

export function createAgentSelectorProfileItemMobilePropsParts<
  TProfile extends SelectableAgentProfile = SelectableAgentProfile,
  TStyles extends AgentSelectorProfileItemMobilePropsStylesLike =
    AgentSelectorProfileItemMobilePropsStylesLike,
  TImageSource = unknown,
  TOnPress = unknown,
>({
  profile,
  renderState,
  profileRenderState,
  styles,
  avatarImageSource,
  onPress,
}: AgentSelectorProfileItemMobilePropsPartsInput<TProfile, TStyles, TImageSource, TOnPress>):
  AgentSelectorProfileItemMobilePropsParts<TStyles, TImageSource, TOnPress> {
  const hasAvatarImage = avatarImageSource != null

  return {
    touchable: {
      props: {
        style: [
          styles.profileItem,
          profileRenderState.isSelected && styles.profileItemSelected,
        ],
        onPress,
        disabled: profileRenderState.isDisabled,
        activeOpacity: profileRenderState.activeOpacity,
        accessibilityRole: profileRenderState.accessibilityRole,
        accessibilityLabel: profileRenderState.accessibilityLabel,
        accessibilityState: profileRenderState.accessibilityState,
      },
      content: {
        avatar: {
          props: {
            style: [
              styles.profileAvatar,
              !hasAvatarImage && profileRenderState.fallbackAvatar,
            ],
          },
          image: {
            shouldRender: hasAvatarImage,
            props: {
              source: avatarImageSource as TImageSource,
              style: styles.profileAvatarImage,
              accessibilityIgnoresInvertColors: true,
            },
          },
          fallbackIcon: {
            shouldRender: !hasAvatarImage,
            props: {
              name: renderState.surface.avatar.fallbackIconName,
              size: renderState.surface.avatar.fallbackIconSize,
              color: renderState.colors.avatar.fallbackIconColor,
            },
          },
        },
        profileInfo: {
          props: {
            style: styles.profileInfo,
          },
          name: {
            text: profile.name,
            props: {
              style: [
                styles.profileName,
                profileRenderState.isSelected && styles.profileNameSelected,
              ],
              numberOfLines: renderState.surface.profileName.numberOfLines,
            },
          },
          description: {
            shouldRender: profileRenderState.shouldRenderProfileSummary,
            text: profileRenderState.profileSummary,
            props: {
              style: styles.profileDescription,
              numberOfLines: renderState.surface.profileDescription.numberOfLines,
            },
          },
        },
        checkIcon: {
          shouldRender: profileRenderState.isSelected,
          props: {
            name: renderState.surface.checkIcon.name,
            size: renderState.surface.checkIcon.size,
            color: renderState.colors.checkIcon.color,
          },
        },
      },
    },
  }
}

export function createAgentSelectorSheetMobilePropsParts<
  TStyles extends AgentSelectorSheetMobilePropsStylesLike =
    AgentSelectorSheetMobilePropsStylesLike,
  TOnClose = unknown,
  TOnRetry = unknown,
>({
  visible,
  renderState,
  styles,
  sheetBottomPadding,
  safeAreaBottom,
  isLoading,
  error,
  hasProfiles,
  onClose,
  onRetry,
}: AgentSelectorSheetMobilePropsPartsInput<TStyles, TOnClose, TOnRetry>):
  AgentSelectorSheetMobilePropsParts<TStyles, TOnClose, TOnRetry> {
  const shouldRenderError = !isLoading && Boolean(error)
  const shouldRenderEmpty = !isLoading && !shouldRenderError && !hasProfiles
  const shouldRenderList = !isLoading && !shouldRenderError && hasProfiles

  return {
    modal: {
      props: {
        visible,
        animationType: "slide",
        transparent: true,
        onRequestClose: onClose,
      },
    },
    backdrop: {
      props: {
        style: styles.backdrop,
        onPress: onClose,
      },
    },
    backdropSpacer: {
      props: {
        style: styles.backdropSpacer,
      },
    },
    sheet: {
      props: {
        style: [
          styles.sheet,
          { paddingBottom: safeAreaBottom + sheetBottomPadding },
        ],
      },
    },
    handle: {
      props: {
        style: styles.handle,
      },
    },
    header: {
      props: {
        style: styles.header,
      },
    },
    title: {
      text: renderState.title,
      props: {
        style: styles.title,
        numberOfLines: renderState.surface.title.numberOfLines,
      },
    },
    closeButton: {
      props: {
        style: styles.headerCloseButton,
        onPress: onClose,
        activeOpacity: renderState.closeButton.activeOpacity,
        accessibilityRole: renderState.closeButton.accessibilityRole,
        accessibilityLabel: renderState.closeButton.accessibilityLabel,
      },
      icon: {
        props: renderState.closeButton.icon,
      },
    },
    loading: {
      shouldRender: isLoading,
      container: {
        props: {
          style: styles.loadingContainer,
        },
      },
      indicator: {
        props: {
          size: "small",
          color: renderState.colors.activityIndicator.color,
        },
      },
      label: {
        text: renderState.copy.loadingLabel,
        props: {
          style: styles.loadingText,
        },
      },
    },
    error: {
      shouldRender: shouldRenderError,
      container: {
        props: {
          style: styles.errorContainer,
        },
      },
      message: {
        text: error ?? "",
        props: {
          style: styles.errorText,
        },
      },
      retryButton: {
        props: {
          style: styles.retryButton,
          onPress: onRetry,
        },
      },
      retryLabel: {
        text: renderState.copy.retryLabel,
        props: {
          style: styles.retryButtonText,
        },
      },
    },
    empty: {
      shouldRender: shouldRenderEmpty,
      text: renderState.emptyLabel,
      props: {
        style: styles.emptyText,
      },
    },
    list: {
      shouldRender: shouldRenderList,
      props: {
        style: styles.list,
        showsVerticalScrollIndicator: false,
      },
    },
  }
}

export type NextSessionAgentSelectionResult =
  | { status: "selected"; agentId: string }
  | { status: "no-agent" }
  | { status: "stale-selection" }

export function formatAgentSelectorSelectedAccessibilityLabel(displayName: string): string {
  return `Selected agent: ${displayName}`
}

export function formatAgentSelectorEditLabel(displayName: string): string {
  return `Edit ${displayName}`
}

export function formatAgentSelectorSelectAccessibilityLabel(displayName: string): string {
  return `Select ${displayName} agent`
}

export function getAgentSelectorSheetTitle(selectorMode: AgentSelectorMode): string {
  return AGENT_SELECTOR_PRESENTATION.sheet.title[selectorMode]
}

export function getAgentSelectorSheetEmptyLabel(selectorMode: AgentSelectorMode): string {
  return AGENT_SELECTOR_PRESENTATION.sheet.empty[selectorMode]
}

export function getEnabledAgentProfiles<T extends { enabled?: boolean }>(profiles: T[] = []): T[] {
  return profiles.filter((profile) => profile.enabled !== false)
}

export function sortAgentProfilesWithDefaultFirst<T extends { isDefault?: boolean }>(profiles: T[] = []): T[] {
  return profiles
    .map((profile, index) => ({ profile, index }))
    .sort((a, b) => {
      const defaultDelta = Number(Boolean(b.profile.isDefault)) - Number(Boolean(a.profile.isDefault))
      if (defaultDelta !== 0) return defaultDelta
      return a.index - b.index
    })
    .map(({ profile }) => profile)
}

export function getDefaultAgentProfile<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
): T | undefined {
  return profiles.find((profile) => profile.isDefault)
    ?? profiles.find((profile) => profile.name === "main-agent")
    ?? profiles[0]
}

export function getSelectedAgentProfile<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
  selectedAgentId?: string | null,
): T | undefined {
  if (!selectedAgentId) return undefined
  return profiles.find((profile) => profile.id === selectedAgentId)
}

export function getDisplayAgentProfile<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
  selectedAgentId?: string | null,
): T | undefined {
  return getSelectedAgentProfile(profiles, selectedAgentId) ?? getDefaultAgentProfile(profiles)
}

export function resolveAgentProfileIdForNextSession<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
  selectedAgentId?: string | null,
): NextSessionAgentSelectionResult {
  const enabledProfiles = getEnabledAgentProfiles(profiles)

  if (selectedAgentId) {
    const selectedAgent = getSelectedAgentProfile(enabledProfiles, selectedAgentId)
    return selectedAgent
      ? { status: "selected", agentId: selectedAgent.id }
      : { status: "stale-selection" }
  }

  const defaultAgent = getDefaultAgentProfile(enabledProfiles)
  return defaultAgent
    ? { status: "selected", agentId: defaultAgent.id }
    : { status: "no-agent" }
}

export function toSelectableAgentProfile(profile: AgentSelectorProfileCandidate): SelectableAgentProfile {
  const summary = profile.description || profile.guidelines || ""

  return {
    id: profile.id,
    name: profile.displayName || profile.name || profile.id,
    guidelines: summary,
    description: summary,
    avatarDataUrl: profile.avatarDataUrl ?? null,
    selectorMode: "profile",
    selectionValue: profile.id,
  }
}

export function buildSelectorProfiles(
  settings?: AgentSelectorSettings,
  agentProfiles: AgentSelectorProfileCandidate[] = [],
): { selectorMode: AgentSelectorMode; profiles: SelectableAgentProfile[] } {
  const enabledAgentProfiles = getEnabledAgentProfiles(agentProfiles)

  if (settings?.mainAgentMode === "acpx" || settings?.mainAgentMode === "acp") {
    return {
      selectorMode: "acpx",
      profiles: getAcpxMainAgentOptions(settings, enabledAgentProfiles).map((option) => ({
        ...toMainAgentProfile(option),
        selectorMode: "acpx",
        selectionValue: option.name,
      })),
    }
  }

  return {
    selectorMode: "profile",
    profiles: enabledAgentProfiles.map(toSelectableAgentProfile),
  }
}
