import { describe, expect, it } from "vitest"

import {
  AGENT_SELECTOR_PRESENTATION,
  buildSelectorProfiles,
  createAgentSelectorMobileStyleSlots,
  formatAgentSelectorEditLabel,
  formatAgentSelectorSelectAccessibilityLabel,
  formatAgentSelectorSelectedAccessibilityLabel,
  getDefaultAgentProfile,
  getDisplayAgentProfile,
  getEnabledAgentProfiles,
  getAgentSelectorCommonCopyState,
  getAgentSelectorDesktopSurfaceState,
  getAgentSelectorMobileFallbackAvatarBackgroundColor,
  getAgentSelectorMobileCloseIconState,
  getAgentSelectorMobileProfileItemRenderState,
  getAgentSelectorMobileRenderState,
  getAgentSelectorMobileSurfaceColors,
  getAgentSelectorMobileSurfaceState,
  getAgentSelectorSheetCopyState,
  getAgentSelectorSheetEmptyLabel,
  getAgentSelectorSheetTitle,
  resolveAgentProfileIdForNextSession,
  sortAgentProfilesWithDefaultFirst,
  toSelectableAgentProfile,
} from "./agent-selector-options"

describe("agent selector option helpers", () => {
  it("treats agent profiles as enabled unless explicitly disabled", () => {
    const profiles = getEnabledAgentProfiles([
      { id: "main", enabled: true },
      { id: "implicit" },
      { id: "disabled", enabled: false },
    ])

    expect(profiles.map((profile) => profile.id)).toEqual(["main", "implicit"])
  })

  it("chooses the default profile, then main-agent, then the first enabled profile", () => {
    expect(getDefaultAgentProfile([
      { id: "helper", name: "helper" },
      { id: "main", name: "main-agent" },
    ])?.id).toBe("main")

    expect(getDefaultAgentProfile([
      { id: "helper", name: "helper" },
      { id: "default", name: "custom", isDefault: true },
      { id: "main", name: "main-agent" },
    ])?.id).toBe("default")

    expect(getDefaultAgentProfile([
      { id: "first", name: "first" },
      { id: "second", name: "second" },
    ])?.id).toBe("first")
  })

  it("sorts the default profile first while preserving the other profile order", () => {
    const profiles = [
      { id: "alpha" },
      { id: "default", isDefault: true },
      { id: "beta" },
    ]

    expect(sortAgentProfilesWithDefaultFirst(profiles).map((profile) => profile.id)).toEqual([
      "default",
      "alpha",
      "beta",
    ])
  })

  it("uses the selected profile for display when it is available", () => {
    const profiles = [
      { id: "main", name: "main-agent" },
      { id: "helper", name: "helper" },
    ]

    expect(getDisplayAgentProfile(profiles, "helper")?.id).toBe("helper")
    expect(getDisplayAgentProfile(profiles, "missing")?.id).toBe("main")
  })

  it("resolves the selected enabled agent for the next session", () => {
    expect(
      resolveAgentProfileIdForNextSession(
        [
          { id: "main", name: "main-agent" },
          { id: "helper", name: "helper" },
        ],
        "helper",
      ),
    ).toEqual({ status: "selected", agentId: "helper" })
  })

  it("reports stale selected agents instead of silently falling back", () => {
    expect(
      resolveAgentProfileIdForNextSession(
        [
          { id: "main", name: "main-agent" },
          { id: "disabled-helper", name: "helper", enabled: false },
        ],
        "disabled-helper",
      ),
    ).toEqual({ status: "stale-selection" })

    expect(
      resolveAgentProfileIdForNextSession(
        [{ id: "main", name: "main-agent" }],
        "missing",
      ),
    ).toEqual({ status: "stale-selection" })
  })

  it("resolves the default enabled agent when there is no selected agent", () => {
    expect(
      resolveAgentProfileIdForNextSession([
        { id: "disabled-default", name: "main-agent", enabled: false },
        { id: "first-enabled", name: "first" },
      ]),
    ).toEqual({ status: "selected", agentId: "first-enabled" })
  })

  it("allows starting without applying an agent when no profiles are enabled", () => {
    expect(
      resolveAgentProfileIdForNextSession([
        { id: "disabled", name: "main-agent", enabled: false },
      ]),
    ).toEqual({ status: "no-agent" })
  })

  it("builds selectable profile entries from API profiles", () => {
    const profile = toSelectableAgentProfile({
      id: "sub",
      name: "augustus",
      displayName: "Augustus",
      description: "Delegated helper",
      avatarDataUrl: "data:image/png;base64,abc",
      enabled: true,
      connectionType: "internal",
    })

    expect(profile).toEqual({
      id: "sub",
      name: "Augustus",
      guidelines: "Delegated helper",
      description: "Delegated helper",
      avatarDataUrl: "data:image/png;base64,abc",
      selectorMode: "profile",
      selectionValue: "sub",
    })
  })

  it("centralizes selector copy and dense desktop/mobile surface tokens", () => {
    expect(AGENT_SELECTOR_PRESENTATION.common.defaultAgentLabel).toBe("Default Agent")
    expect(AGENT_SELECTOR_PRESENTATION.common.newAgentLabel).toBe("New agent…")
    expect(AGENT_SELECTOR_PRESENTATION.desktop.triggerClassName).toContain("h-8 w-8")
    expect(AGENT_SELECTOR_PRESENTATION.desktop.contentClassName).toContain("max-h-[300px]")
    expect(getAgentSelectorCommonCopyState()).toBe(AGENT_SELECTOR_PRESENTATION.common)
    expect(getAgentSelectorDesktopSurfaceState()).toBe(AGENT_SELECTOR_PRESENTATION.desktop)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.sheet.backgroundColorToken).toBe("card")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.backdropSpacer.flex).toBe(1)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.handle.alignSelf).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.header.flexDirection).toBe("row")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.header.alignItems).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.width).toBe(32)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.alignItems).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.justifyContent).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.pressedOpacity).toBe(0.72)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.accessibilityRole).toBe("button")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.name).toBe("close")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.size).toBe(20)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.colorToken).toBe("mutedForeground")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.title.flex).toBe(1)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.title.minWidth).toBe(0)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.title.numberOfLines).toBe(1)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileItem.flexDirection).toBe("row")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileItem.justifyContent).toBe("space-between")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileItem.selectedBackgroundAlpha).toBe(0.12)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileItem.accessibilityRole).toBe("button")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileItem.pressedOpacity).toBe(0.78)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatar.alignItems).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatar.justifyContent).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatar.overflow).toBe("hidden")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatar.flexShrink).toBe(0)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatar.fallbackIconName).toBe("hardware-chip-outline")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatarImage.width).toBe("100%")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.avatarImage.height).toBe("100%")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileInfo.flex).toBe(1)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileInfo.minWidth).toBe(0)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileName.numberOfLines).toBe(1)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.profileDescription.numberOfLines).toBe(1)
    expect(AGENT_SELECTOR_PRESENTATION.mobile.loadingContainer.alignItems).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.errorContainer.alignItems).toBe("center")
    expect(AGENT_SELECTOR_PRESENTATION.mobile.emptyText.textAlign).toBe("center")
    expect(getAgentSelectorSheetCopyState()).toBe(AGENT_SELECTOR_PRESENTATION.sheet)
    expect(getAgentSelectorMobileSurfaceState()).toBe(AGENT_SELECTOR_PRESENTATION.mobile)
    expect(getAgentSelectorSheetTitle("profile")).toBe("Select Agent")
    expect(getAgentSelectorSheetTitle("acpx")).toBe("Select Main Agent")
    expect(getAgentSelectorSheetEmptyLabel("profile")).toBe("No agents available")
    expect(getAgentSelectorSheetEmptyLabel("acpx")).toBe("No acpx agents available")
    expect(getAgentSelectorMobileCloseIconState()).toEqual({
      name: "close",
      size: 20,
      colorToken: "mutedForeground",
    })
    const agentSelectorPalette = {
      card: "#fafafa",
      border: "#d4d4d4",
      destructive: "#dc2626",
      foreground: "#171717",
      mutedForeground: "#737373",
      primary: "#2563eb",
    }
    const agentSelectorSurfaceColors = {
      backdrop: {
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      },
      sheet: {
        backgroundColor: "#fafafa",
      },
      handle: {
        backgroundColor: "#d4d4d4",
      },
      title: {
        color: "#171717",
      },
      headerCloseIcon: {
        color: "#737373",
      },
      profileItem: {
        selectedBackgroundColor: "rgba(37, 99, 235, 0.12)",
      },
      avatar: {
        fallbackIconColor: "#2563eb",
      },
      profileName: {
        color: "#171717",
        selectedColor: "#2563eb",
      },
      profileDescription: {
        color: "#737373",
      },
      checkIcon: {
        color: "#2563eb",
      },
      loadingText: {
        color: "#737373",
      },
      errorText: {
        color: "#dc2626",
      },
      retryButtonText: {
        color: "#2563eb",
      },
      emptyText: {
        color: "#737373",
      },
      activityIndicator: {
        color: "#2563eb",
      },
    }
    expect(getAgentSelectorMobileSurfaceColors(agentSelectorPalette)).toEqual(agentSelectorSurfaceColors)
    const agentSelectorRenderState = getAgentSelectorMobileRenderState({
      selectorMode: "profile",
      colors: agentSelectorPalette,
    })
    expect(agentSelectorRenderState).toEqual({
      copy: AGENT_SELECTOR_PRESENTATION.sheet,
      surface: AGENT_SELECTOR_PRESENTATION.mobile,
      colors: agentSelectorSurfaceColors,
      title: "Select Agent",
      emptyLabel: "No agents available",
      closeButton: {
        activeOpacity: AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.pressedOpacity,
        accessibilityRole: AGENT_SELECTOR_PRESENTATION.mobile.headerCloseButton.accessibilityRole,
        accessibilityLabel: AGENT_SELECTOR_PRESENTATION.sheet.closeAccessibilityLabel,
        icon: {
          name: AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.name,
          size: AGENT_SELECTOR_PRESENTATION.mobile.headerCloseIcon.size,
          color: "#737373",
        },
      },
    })
    expect(createAgentSelectorMobileStyleSlots({
      renderState: agentSelectorRenderState,
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
      },
      radius: {
        md: 8,
        lg: 12,
        xl: 16,
      },
    })).toEqual({
      backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      },
      backdropSpacer: {
        flex: 1,
      },
      sheet: {
        backgroundColor: "#fafafa",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        maxHeight: "60%",
      },
      handle: {
        width: 36,
        height: 4,
        backgroundColor: "#d4d4d4",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 8,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      },
      title: {
        flex: 1,
        minWidth: 0,
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 22,
        color: "#171717",
      },
      headerCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginRight: -4,
      },
      list: {
        maxHeight: 300,
      },
      profileItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 4,
      },
      profileItemSelected: {
        backgroundColor: "rgba(37, 99, 235, 0.12)",
      },
      profileAvatar: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      },
      profileAvatarImage: {
        width: "100%",
        height: "100%",
      },
      profileInfo: {
        flex: 1,
        minWidth: 0,
      },
      profileName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#171717",
      },
      profileNameSelected: {
        color: "#2563eb",
        fontWeight: "600",
      },
      profileDescription: {
        fontSize: 12,
        color: "#737373",
        marginTop: 2,
      },
      loadingContainer: {
        alignItems: "center",
        paddingVertical: 24,
        gap: 8,
      },
      loadingText: {
        color: "#737373",
      },
      errorContainer: {
        alignItems: "center",
        paddingVertical: 16,
        gap: 8,
      },
      errorText: {
        color: "#dc2626",
      },
      retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
      },
      retryButtonText: {
        color: "#2563eb",
        fontWeight: "500",
      },
      emptyText: {
        textAlign: "center",
        color: "#737373",
        paddingVertical: 16,
      },
    })
    expect(getAgentSelectorMobileRenderState({
      selectorMode: "acpx",
      colors: agentSelectorPalette,
    })).toMatchObject({
      title: "Select Main Agent",
      emptyLabel: "No acpx agents available",
    })
    expect(getAgentSelectorMobileFallbackAvatarBackgroundColor("#0f172a")).toBe(
      "rgba(15, 23, 42, 0.14)",
    )
    expect(getAgentSelectorMobileProfileItemRenderState({
      profile: {
        id: "research",
        name: "Research",
        description: "Finds citations",
        selectorMode: "profile",
        selectionValue: "research",
      },
      currentProfileId: "research",
      isSwitching: true,
    })).toEqual({
      isSelected: true,
      isDisabled: true,
      profileSummary: "Finds citations",
      shouldRenderProfileSummary: true,
      activeOpacity: AGENT_SELECTOR_PRESENTATION.mobile.profileItem.pressedOpacity,
      accessibilityRole: AGENT_SELECTOR_PRESENTATION.mobile.profileItem.accessibilityRole,
      accessibilityLabel: "Select Research agent",
      accessibilityState: {
        selected: true,
        disabled: true,
      },
      fallbackAvatar: {
        backgroundColor: getAgentSelectorMobileFallbackAvatarBackgroundColor("#06b6d4"),
      },
    })
    expect(getAgentSelectorMobileProfileItemRenderState({
      profile: {
        id: "plain",
        name: "Plain",
        selectorMode: "profile",
        selectionValue: "plain",
      },
    })).toMatchObject({
      isSelected: false,
      isDisabled: false,
      profileSummary: "",
      shouldRenderProfileSummary: false,
      accessibilityState: {
        selected: false,
        disabled: false,
      },
    })
    expect(formatAgentSelectorSelectedAccessibilityLabel("Research")).toBe("Selected agent: Research")
    expect(formatAgentSelectorSelectAccessibilityLabel("Research")).toBe("Select Research agent")
    expect(formatAgentSelectorEditLabel("Research")).toBe("Edit Research")
  })
})

describe("buildSelectorProfiles", () => {
  it("uses enabled agent profiles for the selector in API mode", () => {
    const result = buildSelectorProfiles(
      { mainAgentMode: "api" },
      [
        { id: "main", name: "main-agent", displayName: "Main Agent", enabled: true, connectionType: "internal" },
        { id: "sub", name: "augustus", displayName: "Augustus", description: "Delegated helper", avatarDataUrl: "data:image/png;base64,abc", connectionType: "internal" },
        { id: "off", name: "disabled", displayName: "Disabled", enabled: false, connectionType: "internal" },
      ],
    )

    expect(result.selectorMode).toBe("profile")
    expect(result.profiles.map((profile) => profile.id)).toEqual(["main", "sub"])
    expect(result.profiles.map((profile) => profile.name)).toEqual(["Main Agent", "Augustus"])
    expect(result.profiles.map((profile) => profile.avatarDataUrl)).toEqual([null, "data:image/png;base64,abc"])
  })

  it("uses acpx-capable agent profiles when acpx mode is enabled", () => {
    const result = buildSelectorProfiles(
      {
        mainAgentMode: "acpx",
        acpxAgents: [{ name: "legacy-agent", displayName: "Legacy Agent" }],
      },
      [
        { id: "acpx-1", name: "augustus", displayName: "Augustus", enabled: true, connectionType: "acpx" },
        { id: "stdio-1", name: "stdio-helper", displayName: "STDIO Helper", connectionType: "stdio" },
        { id: "internal-1", name: "helper", displayName: "Helper", enabled: true, connectionType: "internal" },
      ],
    )

    expect(result.selectorMode).toBe("acpx")
    expect(result.profiles.map((profile) => profile.selectionValue)).toEqual(["augustus", "stdio-helper", "legacy-agent"])
    expect(result.profiles.map((profile) => profile.name)).toEqual(["Augustus", "STDIO Helper", "Legacy Agent"])
  })
})
