import { describe, expect, it } from "vitest"

import {
  createSplitPaneEmptyStateActionMobilePropsParts,
  createSplitPaneModalCreateActionMobilePropsParts,
  createSplitPaneSegmentButtonMobilePropsParts,
  createSplitPaneMobileStyleSlots,
  createSplitPaneSessionOptionMobilePropsParts,
  createSplitPaneToolbarActionMobilePropsParts,
  formatSplitPaneChooseAccessibilityLabel,
  formatSplitPaneModalTitle,
  formatSplitPaneOpenAccessibilityLabel,
  getInitialSplitSessionIds,
  getSplitPaneEmptyStateActionMobileIconState,
  getSplitPaneModalCreateMobileIconState,
  getSplitPaneCopyState,
  getSplitPaneMobileSurfaceColors,
  getSplitPaneMobileSurfaceState,
  getSplitPaneToolbarActionMobileIconState,
  reconcileSplitPaneSelection,
  replaceSplitPaneSelection,
  resolveSplitOrientation,
  SPLIT_PANE_ORIENTATION_OPTIONS,
  SPLIT_PANE_PRESENTATION,
} from "./split-pane-selection"

describe("split pane selection", () => {
  it("prefers the current session when choosing initial panes", () => {
    expect(getInitialSplitSessionIds(["s1", "s2", "s3"], "s2")).toEqual({
      primary: "s2",
      secondary: "s1",
    })
  })

  it("dedupes and skips empty session ids when choosing initial panes", () => {
    expect(getInitialSplitSessionIds(["", "s1", "s1", "s2"])).toEqual({
      primary: "s1",
      secondary: "s2",
    })
  })

  it("swaps panes instead of duplicating the same session in both panes", () => {
    expect(replaceSplitPaneSelection({ primary: "s1", secondary: "s2" }, "primary", "s2")).toEqual({
      primary: "s2",
      secondary: "s1",
    })
  })

  it("clears a pane when the replacement is empty", () => {
    expect(replaceSplitPaneSelection({ primary: "s1", secondary: "s2" }, "secondary", null)).toEqual({
      primary: "s1",
      secondary: null,
    })
  })

  it("reconciles missing selections against the available sessions", () => {
    expect(reconcileSplitPaneSelection({ primary: "missing", secondary: null }, ["s1", "s2"], "s2")).toEqual({
      primary: "s2",
      secondary: "s1",
    })
  })

  it("keeps panes unique while reconciling duplicate selections", () => {
    expect(reconcileSplitPaneSelection({ primary: "s1", secondary: "s1" }, ["s1", "s2"])).toEqual({
      primary: "s1",
      secondary: "s2",
    })
  })

  it("chooses explicit layout preferences without auto detection", () => {
    expect(resolveSplitOrientation("horizontal", 1200, 800)).toBe("horizontal")
    expect(resolveSplitOrientation("vertical", 430, 932)).toBe("vertical")
  })

  it("exposes stable mobile split-pane orientation options", () => {
    expect(SPLIT_PANE_ORIENTATION_OPTIONS).toEqual(["auto", "horizontal", "vertical"])
  })

  it("chooses a side-by-side layout automatically on wide screens", () => {
    expect(resolveSplitOrientation("auto", 1200, 800)).toBe("vertical")
  })

  it("chooses a stacked layout automatically on narrow screens", () => {
    expect(resolveSplitOrientation("auto", 430, 932)).toBe("horizontal")
  })

  it("keeps mobile split-pane text density in the shared presentation contract", () => {
    expect(SPLIT_PANE_PRESENTATION.copy.title).toBe("Split view")
    expect(SPLIT_PANE_PRESENTATION.copy.description).toBe(
      "Run and compare two sessions at once. Hands-free mode is paused while split view is open.",
    )
    expect(SPLIT_PANE_PRESENTATION.copy.paneLabel.primary).toBe("Primary chat")
    expect(SPLIT_PANE_PRESENTATION.copy.paneLabel.secondary).toBe("Secondary chat")
    expect(SPLIT_PANE_PRESENTATION.copy.orientationLabel.auto).toBe("Auto")
    expect(SPLIT_PANE_PRESENTATION.copy.toolbar.chooseLabel).toBe("Choose")
    expect(SPLIT_PANE_PRESENTATION.copy.emptyState.title).toBe("Pick a chat for this pane")
    expect(SPLIT_PANE_PRESENTATION.copy.modal.sessionPreviewFallback).toBe("No messages yet")
    expect(SPLIT_PANE_PRESENTATION.mobile.screen.backgroundColorToken).toBe("background")
    expect(SPLIT_PANE_PRESENTATION.mobile.controlBar.backgroundColorToken).toBe("card")
    expect(SPLIT_PANE_PRESENTATION.mobile.controlBar.borderRadius).toBe("xl")
    expect(SPLIT_PANE_PRESENTATION.mobile.segmentedRow.flexDirection).toBe("row")
    expect(SPLIT_PANE_PRESENTATION.mobile.segmentButton.borderColorToken).toBe("border")
    expect(SPLIT_PANE_PRESENTATION.mobile.segmentButton.fontWeight).toBe("600")
    expect(SPLIT_PANE_PRESENTATION.mobile.segmentButton.accessibilityRole).toBe("button")
    expect(SPLIT_PANE_PRESENTATION.mobile.segmentButton.pressedOpacity).toBe(0.78)
    expect(SPLIT_PANE_PRESENTATION.mobile.segmentButton.active).toMatchObject({
      borderColorToken: "primary",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.094,
    })
    expect(SPLIT_PANE_PRESENTATION.mobile.pane.backgroundColorToken).toBe("card")
    expect(SPLIT_PANE_PRESENTATION.mobile.paneToolbar.justifyContent).toBe("space-between")
    expect(SPLIT_PANE_PRESENTATION.mobile.toolbarButton.flexDirection).toBe("row")
    expect(SPLIT_PANE_PRESENTATION.mobile.toolbarButton.alignItems).toBe("center")
    expect(SPLIT_PANE_PRESENTATION.mobile.toolbarButton.iconSize).toBe(14)
    expect(SPLIT_PANE_PRESENTATION.mobile.toolbarButton.disabledOpacity).toBe(0.45)
    expect(SPLIT_PANE_PRESENTATION.mobile.toolbarButton.accessibilityRole).toBe("button")
    expect(SPLIT_PANE_PRESENTATION.mobile.toolbarButton.pressedOpacity).toBe(0.78)
    expect(SPLIT_PANE_PRESENTATION.mobile.emptyStateCopy.maxWidth).toBe(360)
    expect(SPLIT_PANE_PRESENTATION.mobile.primaryButton.flexDirection).toBe("row")
    expect(SPLIT_PANE_PRESENTATION.mobile.primaryButton.gap).toBe("xs")
    expect(SPLIT_PANE_PRESENTATION.mobile.primaryButton.iconName).toBe("chatbubbles-outline")
    expect(SPLIT_PANE_PRESENTATION.mobile.primaryButton.fontWeight).toBe("700")
    expect(SPLIT_PANE_PRESENTATION.mobile.primaryButton.accessibilityRole).toBe("button")
    expect(SPLIT_PANE_PRESENTATION.mobile.primaryButton.pressedOpacity).toBe(0.78)
    expect(SPLIT_PANE_PRESENTATION.mobile.secondaryButton.iconName).toBe("add-circle-outline")
    expect(SPLIT_PANE_PRESENTATION.mobile.secondaryButton.borderColorToken).toBe("border")
    expect(SPLIT_PANE_PRESENTATION.mobile.secondaryButton.accessibilityRole).toBe("button")
    expect(SPLIT_PANE_PRESENTATION.mobile.secondaryButton.pressedOpacity).toBe(0.78)
    expect(SPLIT_PANE_PRESENTATION.mobile.paneTitle.numberOfLines).toBe(1)
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.accessibilityRole).toBe("button")
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.pressedOpacity).toBe(0.78)
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.active).toMatchObject({
      borderColorToken: "primary",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.071,
    })
    expect(SPLIT_PANE_PRESENTATION.mobile.modalCard.maxHeight).toBe("75%")
    expect(SPLIT_PANE_PRESENTATION.mobile.modalCard.backgroundColorToken).toBe("card")
    expect(SPLIT_PANE_PRESENTATION.mobile.modalTitle.colorToken).toBe("foreground")
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.backgroundColorToken).toBe("background")
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.title.colorToken).toBe("foreground")
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.title.fontWeight).toBe("600")
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.title.numberOfLines).toBe(1)
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.preview.colorToken).toBe("mutedForeground")
    expect(SPLIT_PANE_PRESENTATION.mobile.sessionOption.preview.numberOfLines).toBe(2)
    expect(SPLIT_PANE_PRESENTATION.mobile.newChatOption.justifyContent).toBe("center")
    expect(SPLIT_PANE_PRESENTATION.mobile.newChatOption.flexDirection).toBe("row")
    expect(SPLIT_PANE_PRESENTATION.mobile.newChatOption.iconName).toBe("add-circle-outline")
    expect(SPLIT_PANE_PRESENTATION.mobile.newChatOption.accessibilityRole).toBe("button")
    expect(SPLIT_PANE_PRESENTATION.mobile.newChatOption.pressedOpacity).toBe(0.78)
    expect(SPLIT_PANE_PRESENTATION.mobile.newChatOptionText.fontWeight).toBe("700")
    expect(SPLIT_PANE_PRESENTATION.mobile.modalOverlay).toMatchObject({
      flex: 1,
      color: "#000000",
      alpha: 0.4,
      justifyContent: "center",
    })
    expect(getSplitPaneCopyState()).toBe(SPLIT_PANE_PRESENTATION.copy)
    expect(getSplitPaneMobileSurfaceState()).toBe(SPLIT_PANE_PRESENTATION.mobile)
    expect(getSplitPaneToolbarActionMobileIconState("choose")).toEqual({
      name: "list-outline",
      size: 14,
      colorToken: "foreground",
    })
    expect(getSplitPaneToolbarActionMobileIconState("open")).toEqual({
      name: "expand-outline",
      size: 14,
      colorToken: "foreground",
    })
    expect(getSplitPaneEmptyStateActionMobileIconState("choose")).toEqual({
      name: "chatbubbles-outline",
      size: 15,
      colorToken: "background",
    })
    expect(getSplitPaneEmptyStateActionMobileIconState("newChat")).toEqual({
      name: "add-circle-outline",
      size: 15,
      colorToken: "foreground",
    })
    expect(getSplitPaneModalCreateMobileIconState()).toEqual({
      name: "add-circle-outline",
      size: 16,
      colorToken: "primary",
    })
  })

  it("formats split-pane mobile accessibility and modal copy", () => {
    expect(formatSplitPaneChooseAccessibilityLabel("primary")).toBe("Choose primary split chat")
    expect(formatSplitPaneOpenAccessibilityLabel("secondary")).toBe("Open secondary split chat full screen")
    expect(formatSplitPaneModalTitle("primary")).toBe("Choose primary chat")
    expect(formatSplitPaneModalTitle(null)).toBe("Choose secondary chat")
  })

  it("resolves mobile split-pane colors from shared palette tokens", () => {
    const colors = getSplitPaneMobileSurfaceColors({
      background: "#fdfdfd",
      card: "#ffffff",
      border: "#dedede",
      foreground: "#111111",
      mutedForeground: "#777777",
      primary: "#123456",
    })

    expect(colors).toMatchObject({
      screen: { backgroundColor: "#fdfdfd" },
      controlBar: {
        backgroundColor: "#ffffff",
        borderColor: "#dedede",
      },
      controlBarTitle: { color: "#111111" },
      controlBarCopy: { color: "#777777" },
      segmentButton: {
        borderColor: "#dedede",
        backgroundColor: "#fdfdfd",
        textColor: "#111111",
        activeTextColor: "#123456",
        activeBorderColor: "#123456",
        activeBackgroundColor: "rgba(18, 52, 86, 0.094)",
      },
      pane: {
        backgroundColor: "#ffffff",
        borderColor: "#dedede",
      },
      paneToolbar: {
        borderBottomColor: "#dedede",
        backgroundColor: "#fdfdfd",
      },
      toolbarButton: {
        backgroundColor: "#ffffff",
        borderColor: "#dedede",
        textColor: "#111111",
        iconColor: "#111111",
      },
      primaryButton: {
        backgroundColor: "#123456",
        textColor: "#fdfdfd",
        iconColor: "#fdfdfd",
      },
      secondaryButton: {
        borderColor: "#dedede",
        backgroundColor: "#ffffff",
        textColor: "#111111",
        iconColor: "#111111",
      },
      modalOverlay: { backgroundColor: "rgba(0, 0, 0, 0.4)" },
      modalCard: {
        backgroundColor: "#ffffff",
        borderColor: "#dedede",
      },
      sessionOption: {
        borderColor: "#dedede",
        backgroundColor: "#fdfdfd",
        activeBorderColor: "#123456",
        activeBackgroundColor: "rgba(18, 52, 86, 0.071)",
      },
      sessionOptionTitle: { color: "#111111" },
      sessionOptionPreview: { color: "#777777" },
      newChatOption: { iconColor: "#123456" },
      newChatOptionText: { color: "#123456" },
    })
  })

  it("creates mobile split-pane style slots from shared presentation tokens", () => {
    const colors = getSplitPaneMobileSurfaceColors({
      background: "#fdfdfd",
      card: "#ffffff",
      border: "#dedede",
      foreground: "#111111",
      mutedForeground: "#777777",
      primary: "#123456",
    })
    const styleSlots = createSplitPaneMobileStyleSlots({
      colors,
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
      },
      radius: {
        md: 6,
        lg: 8,
        xl: 12,
      },
      typography: {
        h2: { fontSize: 20 },
        body: { fontSize: 16 },
        caption: { fontSize: 12 },
      },
    })

    expect(styleSlots.screen).toMatchObject({
      flex: 1,
      backgroundColor: "#fdfdfd",
      padding: 8,
      gap: 8,
    })
    expect(styleSlots.controlBar).toMatchObject({
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "#dedede",
      gap: 4,
    })
    expect(styleSlots.segmentButtonActive).toEqual({
      borderColor: "#123456",
      backgroundColor: "rgba(18, 52, 86, 0.094)",
    })
    expect(styleSlots.segmentButtonPressed).toEqual({ opacity: 0.78 })
    expect(styleSlots.paneToolbar).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#dedede",
      backgroundColor: "#fdfdfd",
    })
    expect(styleSlots.toolbarButtonDisabled).toEqual({ opacity: 0.45 })
    expect(styleSlots.primaryButton).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: 8,
      backgroundColor: "#123456",
    })
    expect(styleSlots.modalOverlay).toMatchObject({
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "center",
      padding: 16,
    })
    expect(styleSlots.sessionOptionTitle).toMatchObject({
      fontSize: 16,
      color: "#111111",
      fontWeight: "600",
      marginBottom: 4,
    })
    expect(styleSlots.newChatOptionText).toMatchObject({
      fontSize: 16,
      color: "#123456",
      fontWeight: "700",
    })
  })

  it("creates mobile split-pane orientation segment props from shared presentation", () => {
    let selected: string | null = null
    const segmentParts = createSplitPaneSegmentButtonMobilePropsParts({
      option: "vertical",
      isSelected: true,
      onSelect: (option) => {
        selected = option
      },
      styles: {
        button: "button",
        activeButton: "active-button",
        pressedButton: "pressed-button",
        label: "label",
        activeLabel: "active-label",
      },
    })

    expect(segmentParts.pressable.props.accessibilityRole).toBe("button")
    expect(segmentParts.pressable.props.accessibilityState).toEqual({ selected: true })
    expect(segmentParts.pressable.props.style({ pressed: true })).toEqual([
      "button",
      "active-button",
      "pressed-button",
    ])
    expect(segmentParts.pressable.content.label.text).toBe("Vertical")
    expect(segmentParts.pressable.content.label.props.style).toEqual(["label", "active-label"])

    segmentParts.pressable.props.onPress()
    expect(selected).toBe("vertical")
  })

  it("creates mobile split-pane toolbar action props from shared presentation", () => {
    let opened = false
    const actionParts = createSplitPaneToolbarActionMobilePropsParts({
      action: "open",
      pane: "secondary",
      isDisabled: true,
      onPress: () => {
        opened = true
      },
      iconColor: "#111111",
      styles: {
        button: "button",
        disabledButton: "disabled-button",
        label: "label",
      },
    })

    expect(actionParts.touchable.props.disabled).toBe(true)
    expect(actionParts.touchable.props.style).toEqual(["button", "disabled-button"])
    expect(actionParts.touchable.props.activeOpacity).toBe(0.78)
    expect(actionParts.touchable.props.accessibilityRole).toBe("button")
    expect(actionParts.touchable.props.accessibilityLabel).toBe(
      "Open secondary split chat full screen button",
    )
    expect(actionParts.touchable.props.accessibilityState).toEqual({ disabled: true })
    expect(actionParts.touchable.content.icon.props).toEqual({
      name: "expand-outline",
      size: 14,
      color: "#111111",
    })
    expect(actionParts.touchable.content.label.text).toBe("Open")
    expect(actionParts.touchable.content.label.props.style).toBe("label")

    actionParts.touchable.props.onPress()
    expect(opened).toBe(true)
  })

  it("creates mobile split-pane empty-state action props from shared presentation", () => {
    let created = false
    const actionParts = createSplitPaneEmptyStateActionMobilePropsParts({
      action: "newChat",
      onPress: () => {
        created = true
      },
      iconColor: "#222222",
      styles: {
        button: "button",
        label: "label",
      },
    })

    expect(actionParts.touchable.props.style).toBe("button")
    expect(actionParts.touchable.props.activeOpacity).toBe(0.78)
    expect(actionParts.touchable.props.accessibilityRole).toBe("button")
    expect(actionParts.touchable.props.accessibilityLabel).toBe("New chat button")
    expect(actionParts.touchable.content.icon.props).toEqual({
      name: "add-circle-outline",
      size: 15,
      color: "#222222",
    })
    expect(actionParts.touchable.content.label.text).toBe("New chat")
    expect(actionParts.touchable.content.label.props.style).toBe("label")

    actionParts.touchable.props.onPress()
    expect(created).toBe(true)
  })

  it("creates mobile split-pane session option props from shared presentation", () => {
    let selected = false
    const optionParts = createSplitPaneSessionOptionMobilePropsParts({
      title: "Session title",
      preview: "",
      isSelected: true,
      onPress: () => {
        selected = true
      },
      styles: {
        option: "option",
        activeOption: "active-option",
        title: "title",
        preview: "preview",
      },
    })

    expect(optionParts.touchable.props.style).toEqual(["option", "active-option"])
    expect(optionParts.touchable.props.activeOpacity).toBe(0.78)
    expect(optionParts.touchable.props.accessibilityRole).toBe("button")
    expect(optionParts.touchable.props.accessibilityState).toEqual({ selected: true })
    expect(optionParts.touchable.content.title).toEqual({
      text: "Session title",
      props: {
        style: "title",
        numberOfLines: 1,
      },
    })
    expect(optionParts.touchable.content.preview).toEqual({
      text: "No messages yet",
      props: {
        style: "preview",
        numberOfLines: 2,
      },
    })

    optionParts.touchable.props.onPress()
    expect(selected).toBe(true)
  })

  it("creates mobile split-pane modal create action props from shared presentation", () => {
    let created = false
    const createParts = createSplitPaneModalCreateActionMobilePropsParts({
      onPress: () => {
        created = true
      },
      iconColor: "#333333",
      styles: {
        button: "button",
        label: "label",
      },
    })

    expect(createParts.touchable.props.style).toBe("button")
    expect(createParts.touchable.props.activeOpacity).toBe(0.78)
    expect(createParts.touchable.props.accessibilityRole).toBe("button")
    expect(createParts.touchable.props.accessibilityLabel).toBe(
      "Create a new chat for this pane button",
    )
    expect(createParts.touchable.content.icon.props).toEqual({
      name: "add-circle-outline",
      size: 16,
      color: "#333333",
    })
    expect(createParts.touchable.content.label.text).toBe("Create a new chat for this pane")
    expect(createParts.touchable.content.label.props.style).toBe("label")

    createParts.touchable.props.onPress()
    expect(created).toBe(true)
  })
})
