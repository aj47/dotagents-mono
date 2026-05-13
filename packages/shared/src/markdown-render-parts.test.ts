import { describe, expect, it } from "vitest"

import {
  MARKDOWN_CONTENT_PRESENTATION,
  MARKDOWN_CONTENT_SURFACE_PRESENTATION,
  MARKDOWN_THINK_SECTION_PRESENTATION,
  MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION,
  formatMarkdownImageRequestFailedMessage,
  getMarkdownCodeBlockCopyLabel,
  getMarkdownCodeBlockCopyMobileButtonState,
  getMarkdownCodeBlockCopyMobileIconState,
  getMarkdownCodeBlockFeedbackResetDelayMs,
  getMarkdownContentMobileSurfaceColors,
  getMarkdownContentMobileSurfaceRenderState,
  getMarkdownContentDesktopSurfaceState,
  getMarkdownContentMobileSurfaceState,
  getMarkdownImageFallbackLabel,
  getMarkdownImageInvalidAssetUrlMessage,
  getMarkdownImageLoadErrorFallback,
  getMarkdownImageUnavailableLabel,
  getMarkdownRenderOptions,
  getMarkdownThinkSectionAccessibilityLabel,
  getMarkdownThinkSectionControlState,
  getMarkdownThinkSectionMobileContainerState,
  getMarkdownThinkSectionMobileContentState,
  getMarkdownThinkSectionDesktopSurfaceState,
  getMarkdownThinkSectionDisplayLabel,
  getMarkdownThinkSectionMobileChevronIconState,
  getMarkdownThinkSectionMobileHeaderState,
  getMarkdownThinkSectionMobileIconState,
  getMarkdownThinkSectionMobileLabelState,
  getMarkdownThinkSectionMobileLeadingIconState,
  getMarkdownThinkSectionMobileSurfaceColors,
  getMarkdownThinkSectionMobileSurfaceRenderState,
  getMarkdownThinkSectionMobileSurfaceState,
  isAllowedMarkdownContentLinkUrl,
  isMarkdownContentVideoLinkUrl,
  normalizeMarkdownThoughtContent,
  splitMarkdownContent,
  transformMarkdownContentUrl,
} from "./markdown-render-parts"

describe("markdown render parts", () => {
  it("centralizes compact markdown content surface tokens", () => {
    expect(MARKDOWN_CONTENT_PRESENTATION.codeBlock.copyLabel).toBe("Copy code")
    expect(MARKDOWN_CONTENT_PRESENTATION.codeBlock.copiedLabel).toBe("Copied!")
    expect(MARKDOWN_CONTENT_PRESENTATION.codeBlock.feedbackResetDelayMs).toBe(2000)
    expect(getMarkdownCodeBlockCopyLabel()).toBe("Copy code")
    expect(getMarkdownCodeBlockCopyLabel(false)).toBe("Copy code")
    expect(getMarkdownCodeBlockCopyLabel(true)).toBe("Copied!")
    expect(getMarkdownCodeBlockFeedbackResetDelayMs()).toBe(2000)
    expect(getMarkdownCodeBlockCopyMobileIconState()).toEqual({
      name: "copy-outline",
      size: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.size,
      colorToken: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.colorToken,
    })
    expect(getMarkdownCodeBlockCopyMobileIconState(true)).toEqual({
      name: "checkmark-done-outline",
      size: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.size,
      colorToken: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.copiedColorToken,
    })
    expect(getMarkdownCodeBlockCopyMobileButtonState()).toEqual({
      position: "absolute",
      top: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.top,
      right: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.right,
      size: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.size,
      borderRadius: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.borderRadius,
      borderWidth: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.borderWidth,
      borderColorToken: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.borderColorToken,
      backgroundColorToken: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.backgroundColorToken,
      backgroundAlpha: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.backgroundAlpha,
      alignItems: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.alignItems,
      justifyContent: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.justifyContent,
      accessibilityRole: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.accessibilityRole,
      pressedOpacity: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.pressedOpacity,
    })
    expect(getMarkdownCodeBlockCopyMobileButtonState(true)).toMatchObject({
      borderColorToken: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.copiedBorderColorToken,
      backgroundColorToken: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.copiedBackgroundColorToken,
      backgroundAlpha: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.copiedBackgroundAlpha,
    })
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.compactProseClassName).toContain("prose-p:my-1")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.selectableClassName).toBe("markdown-selectable")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.linkClassName).toContain("[overflow-wrap:anywhere]")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.inlineCodeClassName).toContain("font-mono")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.codeBlockPreClassName).toContain("group/codeblock")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.codeBlockCopyButtonClassName).toContain("group-hover/codeblock:opacity-100")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.codeBlockCopyIconClassName).toContain("text-muted-foreground")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.codeBlockCopiedIconClassName).toContain("text-green-500")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.tableWrapperClassName).toContain("overflow-x-auto")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.tableCellClassName).toContain("[overflow-wrap:anywhere]")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.paragraphClassName).toBe("my-1 leading-normal text-foreground")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.blockquoteClassName).toContain("border-l-4")
    expect(getMarkdownContentDesktopSurfaceState()).toBe(MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop)
    expect(getMarkdownContentMobileSurfaceState()).toBe(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.body.fontSize).toBe(13)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.body.lineHeight).toBe(18)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.inlineCode.fontFamilyByPlatform.ios).toBe("Menlo")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.inlineCode.fontFamilyByPlatform.default).toBe("monospace")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlock.fontFamilyByPlatform.ios).toBe("Menlo")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlock.copyPaddingRight).toBe(34)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlock.borderRadius).toBe("sm")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.size).toBe(24)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.alignItems).toBe("center")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.justifyContent).toBe("center")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.accessibilityRole).toBe("button")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.copyName).toBe("copy-outline")
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.blockquote.backgroundColor.darkAlpha).toBe(0.05)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.blockquote.backgroundColor.lightAlpha).toBe(0.03)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.image.maxHeight).toBe(320)
    expect(MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.tableCell.headerFontWeight).toBe("600")
    const markdownContentPalette = {
      background: "#ffffff",
      border: "#d4d4d4",
      foreground: "#171717",
      muted: "#e5e5e5",
      mutedForeground: "#737373",
      primary: "#2563eb",
      success: "#16a34a",
    }
    const markdownContentSurfaceColors = {
      body: { color: "#171717" },
      heading1: { color: "#171717" },
      heading2: { color: "#171717" },
      heading3: { color: "#171717" },
      paragraph: { color: "#171717" },
      list: { iconColor: "#737373" },
      inlineCode: {
        backgroundColor: "#e5e5e5",
        color: "#2563eb",
      },
      codeBlock: {
        backgroundColor: "#e5e5e5",
        color: "#171717",
      },
      codeBlockCopyButton: {
        borderColor: "#d4d4d4",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        copiedBorderColor: "#16a34a",
        copiedBackgroundColor: "rgba(22, 163, 74, 0.16)",
      },
      codeBlockCopyIcon: {
        color: "#737373",
        copiedColor: "#16a34a",
      },
      blockquote: {
        backgroundColor: "rgba(0, 0, 0, 0.03)",
        borderLeftColor: "#2563eb",
      },
      link: { color: "#2563eb" },
      image: { backgroundColor: "#e5e5e5" },
      table: { borderColor: "#d4d4d4" },
      tableHead: { backgroundColor: "#e5e5e5" },
      tableCell: { borderColor: "#d4d4d4" },
      horizontalRule: { backgroundColor: "#d4d4d4" },
    }
    expect(getMarkdownContentMobileSurfaceColors(markdownContentPalette, { isDark: false })).toEqual(markdownContentSurfaceColors)
    expect(getMarkdownContentMobileSurfaceRenderState({
      colors: markdownContentPalette,
      isDark: false,
    })).toEqual({
      surface: MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile,
      colors: markdownContentSurfaceColors,
    })
    expect(getMarkdownContentMobileSurfaceColors({
      background: "#050505",
      border: "#404040",
      foreground: "#fafafa",
      muted: "#262626",
      mutedForeground: "#a3a3a3",
      primary: "#60a5fa",
      success: "#4ade80",
    }, { isDark: true }).blockquote.backgroundColor).toBe("rgba(255, 255, 255, 0.05)")
  })

  it("centralizes markdown image fallback copy", () => {
    expect(MARKDOWN_CONTENT_PRESENTATION.image.fallbackLabel).toBe("Image")
    expect(MARKDOWN_CONTENT_PRESENTATION.image.unavailableLabel).toBe("Image unavailable.")
    expect(MARKDOWN_CONTENT_PRESENTATION.image.invalidAssetUrlMessage).toBe("Invalid image asset URL.")
    expect(MARKDOWN_CONTENT_PRESENTATION.image.loadErrorFallback).toBe("Unable to load image.")
    expect(getMarkdownImageFallbackLabel()).toBe("Image")
    expect(getMarkdownImageFallbackLabel("Chart")).toBe("Chart")
    expect(getMarkdownImageUnavailableLabel()).toBe("Image unavailable.")
    expect(getMarkdownImageInvalidAssetUrlMessage()).toBe("Invalid image asset URL.")
    expect(getMarkdownImageLoadErrorFallback()).toBe("Unable to load image.")
    expect(formatMarkdownImageRequestFailedMessage(404)).toBe("Image request failed (404)")
  })

  it("centralizes think-section copy and desktop/mobile surface tokens", () => {
    expect(MARKDOWN_THINK_SECTION_PRESENTATION.labels.collapsed).toBe("Thinking")
    expect(MARKDOWN_THINK_SECTION_PRESENTATION.mobileIcon).toMatchObject({
      collapsedName: "chevron-forward",
      expandedName: "chevron-down",
      thinkName: "bulb-outline",
    })
    expect(getMarkdownThinkSectionMobileIconState()).toBe(MARKDOWN_THINK_SECTION_PRESENTATION.mobileIcon)
    expect(getMarkdownThinkSectionMobileChevronIconState(true)).toEqual({
      name: "chevron-forward",
      size: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.chevron.size,
      color: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.chevron.color,
    })
    expect(getMarkdownThinkSectionMobileChevronIconState(false)).toEqual({
      name: "chevron-down",
      size: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.chevron.size,
      color: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.chevron.color,
    })
    expect(getMarkdownThinkSectionMobileLeadingIconState()).toEqual({
      name: "bulb-outline",
      size: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.icon.size,
      color: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.icon.color,
    })
    expect(getMarkdownThinkSectionMobileContainerState(true)).toMatchObject({
      borderRadius: "md",
      borderWidth: 1,
      marginVertical: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.collapsedMarginVertical,
      borderColor: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.collapsedBorderColor,
      backgroundColor: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.collapsedBackgroundColor,
    })
    expect(getMarkdownThinkSectionMobileContainerState(false)).toMatchObject({
      marginVertical: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.expandedMarginVertical,
      borderColor: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.expandedBorderColor,
      backgroundColor: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.expandedBackgroundColor,
    })
    expect(getMarkdownThinkSectionMobileHeaderState()).toBe(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.header)
    expect(getMarkdownThinkSectionMobileLabelState()).toBe(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.label)
    expect(getMarkdownThinkSectionMobileContentState()).toBe(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.content)
    expect(getMarkdownThinkSectionDesktopSurfaceState()).toBe(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.desktop)
    expect(getMarkdownThinkSectionMobileSurfaceState()).toBe(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile)
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.desktop.containerBaseClassName).toContain("rounded-md")
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.desktop.proseAccentClassName).toBe("prose-amber")
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.borderRadius).toBe("md")
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.collapsedBorderColor.darkAlpha).toBe(0.28)
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.expandedBorderColor.lightAlpha).toBe(0.5)
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.collapsedBackgroundColor.lightAlpha).toBe(0.45)
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container.expandedBackgroundColor.darkAlpha).toBe(0.18)
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.header.paddingHorizontal).toBe("sm")
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.header.accessibilityRole).toBe("button")
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.chevron.size).toBe(13)
    expect(MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.icon.size).toBe(13)
    const lightThinkSectionColors = {
      collapsedContainer: {
        borderColor: "rgba(245, 158, 11, 0.35)",
        backgroundColor: "rgba(254, 243, 199, 0.45)",
      },
      expandedContainer: {
        borderColor: "rgba(245, 158, 11, 0.5)",
        backgroundColor: "rgba(254, 243, 199, 0.65)",
      },
      chevron: { color: "#d97706" },
      icon: { color: "#d97706" },
      label: { color: "#92400e" },
    }
    expect(getMarkdownThinkSectionMobileSurfaceColors({ isDark: false })).toEqual(lightThinkSectionColors)
    expect(getMarkdownThinkSectionMobileSurfaceRenderState({ isDark: false })).toEqual({
      surface: MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile,
      colors: lightThinkSectionColors,
    })
    expect(getMarkdownThinkSectionMobileSurfaceColors({ isDark: true })).toEqual({
      collapsedContainer: {
        borderColor: "rgba(251, 191, 36, 0.28)",
        backgroundColor: "rgba(146, 64, 14, 0.12)",
      },
      expandedContainer: {
        borderColor: "rgba(251, 191, 36, 0.45)",
        backgroundColor: "rgba(146, 64, 14, 0.18)",
      },
      chevron: { color: "#fbbf24" },
      icon: { color: "#fbbf24" },
      label: { color: "#fde68a" },
    })
    expect(getMarkdownThinkSectionAccessibilityLabel(true)).toBe("Show thinking")
    expect(getMarkdownThinkSectionAccessibilityLabel(false)).toBe("Hide thinking")
    expect(getMarkdownThinkSectionDisplayLabel(true)).toBe("Thinking")
    expect(getMarkdownThinkSectionDisplayLabel(false)).toBe("Hide thinking")
    expect(getMarkdownThinkSectionControlState("reasoning", 2)).toEqual({
      key: "think-2",
      isControlled: false,
    })

    const toggled: string[] = []
    const controlledState = getMarkdownThinkSectionControlState("reasoning", 1, {
      getThinkKey: (content, index) => `${index}:${content.slice(0, 4)}`,
      isThinkExpanded: (key) => key === "1:reas",
      onToggleThink: (key) => toggled.push(key),
    })
    expect(controlledState).toMatchObject({
      key: "1:reas",
      isControlled: true,
      isCollapsed: false,
    })
    controlledState.onToggle?.()
    expect(toggled).toEqual(["1:reas"])
  })

  it("normalizes provider thought text into markdown paragraphs outside fenced code", () => {
    const content = [
      "First thought",
      "Second thought",
      "",
      "```ts",
      "const first = 1",
      "const second = 2",
      "```",
      "Final thought",
      "Done",
    ].join("\n")

    expect(normalizeMarkdownThoughtContent(content)).toBe([
      "First thought",
      "",
      "Second thought",
      "",
      "```ts",
      "const first = 1",
      "const second = 2",
      "```",
      "Final thought",
      "",
      "Done",
    ].join("\n"))
  })

  it("extracts Codex thinking blocks from regular markdown", () => {
    expect(splitMarkdownContent("Before <think>reasoning</think> After")).toEqual([
      { type: "markdown", content: "Before " },
      { type: "think", content: "reasoning" },
      { type: "markdown", content: " After" },
    ])
  })

  it("keeps renderable videos as separate parts outside think blocks", () => {
    expect(splitMarkdownContent("Watch [clip](https://example.com/demo.mp4) <think>not video</think>")).toEqual([
      { type: "markdown", content: "Watch " },
      { type: "video", label: "clip", url: "https://example.com/demo.mp4" },
      { type: "think", content: "not video" },
    ])
  })

  it("does not split image markdown links into videos", () => {
    expect(splitMarkdownContent("Look ![clip](https://example.com/demo.mp4)")).toEqual([
      { type: "markdown", content: "Look ![clip](https://example.com/demo.mp4)" },
    ])
  })

  it("can treat desktop recording asset links as renderable videos when enabled", () => {
    expect(splitMarkdownContent("Watch [recording](assets://recording/demo.mp4)", getMarkdownRenderOptions())).toEqual([
      { type: "markdown", content: "Watch " },
      { type: "video", label: "recording", url: "assets://recording/demo.mp4" },
    ])
    expect(getMarkdownRenderOptions()).toEqual({ allowRecordingAssetUrls: true })
    expect(isMarkdownContentVideoLinkUrl("assets://recording/demo.mp4")).toBe(true)
    expect(isAllowedMarkdownContentLinkUrl("assets://recording/demo.mp4")).toBe(true)
    expect(transformMarkdownContentUrl("assets://recording/demo.mp4")).toBe("assets://recording/demo.mp4")
  })

  it("keeps non-video links as markdown", () => {
    expect(splitMarkdownContent("Read [docs](https://example.com/readme)")).toEqual([
      { type: "markdown", content: "Read [docs](https://example.com/readme)" },
    ])
  })
})
