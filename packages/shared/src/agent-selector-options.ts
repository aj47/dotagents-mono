import {
  getAcpxMainAgentOptions,
  toMainAgentProfile,
  type MainAcpLegacyAgentCandidate,
  type LegacyMainAgentMode,
} from "./main-agent-selection"
import { hexToRgba } from "./colors"

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
