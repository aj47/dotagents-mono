import {
  extractMarkdownLinkReferences,
  isAllowedMarkdownLinkUrl,
  isMarkdownVideoLinkUrl,
  transformMarkdownUrl,
  type MarkdownVideoLinkOptions,
} from "./conversation-media-assets"
import { hexToRgba } from "./colors"

export type MarkdownRenderPart =
  | { type: "markdown"; content: string }
  | { type: "video"; label?: string; url: string }
  | { type: "think"; content: string }

export type SplitMarkdownContentOptions = MarkdownVideoLinkOptions

const MARKDOWN_RENDER_OPTIONS = {
  allowRecordingAssetUrls: true,
} as const satisfies SplitMarkdownContentOptions

export interface MarkdownThinkSectionControlOptions {
  getThinkKey?: (content: string, index: number) => string
  isThinkExpanded?: (key: string) => boolean
  onToggleThink?: (key: string) => void
}

export interface MarkdownThinkSectionControlState {
  key: string
  isControlled: boolean
  isCollapsed?: boolean
  onToggle?: () => void
}

export interface MarkdownThinkSectionAccessibilityState {
  expanded: boolean
}

export function normalizeMarkdownThoughtContent(content: string): string {
  if (!content) return content

  const segments = content.split(/(```[\s\S]*?```)/g)
  for (let i = 0; i < segments.length; i += 1) {
    if (i % 2 === 1) continue
    segments[i] = segments[i].replace(/([^\n])\n([^\n])/g, "$1\n\n$2")
  }

  return segments.join("")
}

export const MARKDOWN_CONTENT_PRESENTATION = {
  codeBlock: {
    copyLabel: "Copy code",
    copiedLabel: "Copied!",
    feedbackResetDelayMs: 2000,
  },
  image: {
    fallbackLabel: "Image",
    unavailableLabel: "Image unavailable.",
    invalidAssetUrlMessage: "Invalid image asset URL.",
    loadErrorFallback: "Unable to load image.",
  },
} as const

export const MARKDOWN_CONTENT_SURFACE_PRESENTATION = {
  desktop: {
    compactProseClassName:
      "prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:mb-2 prose-headings:mt-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-pre:my-2 prose-img:my-2",
    selectableClassName: "markdown-selectable",
    linkClassName:
      "break-words text-primary underline underline-offset-2 hover:text-primary/80 [overflow-wrap:anywhere]",
    imageClassName: "mb-3 max-h-[28rem] w-full rounded-md border border-border bg-muted/20 object-contain",
    inlineCodeClassName:
      "rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]",
    codeBlockClassName: "block min-w-max font-mono text-[0.8125rem] leading-5 text-current",
    codeBlockPreClassName:
      "group/codeblock relative mb-3 max-w-full overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-3 dark:border-white/10 dark:bg-white/5",
    codeBlockCopyButtonClassName:
      "absolute right-2 top-2 rounded-md border border-border/50 bg-background/80 p-1 opacity-0 transition-opacity hover:bg-muted group-hover/codeblock:opacity-100 focus:opacity-100",
    codeBlockCopyIconClassName: "h-3.5 w-3.5 text-muted-foreground",
    codeBlockCopiedIconClassName: "h-3.5 w-3.5 text-green-500",
    tableWrapperClassName: "mb-3 max-w-full overflow-x-auto rounded-lg border border-border/80",
    tableClassName: "w-max min-w-full border-collapse text-sm",
    tableHeaderCellClassName:
      "whitespace-nowrap border-b border-r border-border bg-muted/50 px-3 py-2 text-left align-top font-semibold last:border-r-0",
    tableCellClassName: "border-b border-r border-border px-3 py-2 align-top last:border-r-0 [overflow-wrap:anywhere]",
    heading1CollapsedClassName: "text-sm font-normal text-foreground",
    heading1ExpandedClassName: "mb-3 text-xl font-bold text-foreground",
    heading2CollapsedClassName: "text-sm font-normal text-foreground",
    heading2ExpandedClassName: "mb-2 text-lg font-semibold text-foreground",
    heading3CollapsedClassName: "text-sm font-normal text-foreground",
    heading3ExpandedClassName: "mb-2 text-base font-medium text-foreground",
    paragraphClassName: "my-1 leading-normal text-foreground",
    unorderedListClassName: "mb-3 list-outside list-disc space-y-1 pl-5 text-foreground",
    orderedListClassName: "mb-3 list-outside list-decimal space-y-1 pl-5 text-foreground",
    listItemClassName: "break-words pl-0.5 text-foreground",
    blockquoteClassName: "mb-3 border-l-4 border-muted-foreground pl-4 italic text-muted-foreground",
  },
  mobile: {
    body: {
      colorToken: "foreground",
      fontSize: 13,
      lineHeight: 18,
    },
    heading1: {
      colorToken: "foreground",
      fontSize: 16,
      fontWeight: "700",
      marginTop: "xs",
      marginBottom: 2,
    },
    heading2: {
      colorToken: "foreground",
      fontSize: 15,
      fontWeight: "600",
      marginTop: "xs",
      marginBottom: 2,
    },
    heading3: {
      colorToken: "foreground",
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
      marginBottom: 1,
    },
    paragraph: {
      colorToken: "foreground",
      marginBottom: "xs",
      lineHeight: 18,
    },
    strong: {
      fontWeight: "700",
    },
    emphasis: {
      fontStyle: "italic",
    },
    strikethrough: {
      textDecorationLine: "line-through",
    },
    list: {
      marginBottom: "xs",
      itemMarginBottom: 1,
      iconColorToken: "mutedForeground",
      iconMarginRight: 2,
    },
    inlineCode: {
      backgroundColorToken: "muted",
      colorToken: "primary",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      fontSize: 11,
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderRadius: "sm",
    },
    codeBlock: {
      backgroundColorToken: "muted",
      colorToken: "foreground",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      fontSize: 10,
      padding: "xs",
      copyPaddingRight: 34,
      borderRadius: "sm",
      marginBottom: "xs",
      overflow: "hidden",
    },
    codeBlockCopyButton: {
      position: "absolute",
      top: 4,
      right: 4,
      size: 24,
      borderRadius: "sm",
      borderWidth: 1,
      borderColorToken: "border",
      copiedBorderColorToken: "success",
      backgroundColorToken: "background",
      copiedBackgroundColorToken: "success",
      backgroundAlpha: 0.9,
      copiedBackgroundAlpha: 0.16,
      alignItems: "center",
      justifyContent: "center",
      accessibilityRole: "button",
      pressedOpacity: 0.7,
    },
    codeBlockCopyIcon: {
      copyName: "copy-outline",
      copiedName: "checkmark-done-outline",
      size: 13,
      colorToken: "mutedForeground",
      copiedColorToken: "success",
    },
    blockquote: {
      backgroundColor: {
        dark: "#ffffff",
        darkAlpha: 0.05,
        light: "#000000",
        lightAlpha: 0.03,
      },
      borderLeftWidth: 2,
      borderLeftColorToken: "primary",
      paddingLeft: "sm",
      paddingVertical: 2,
      marginBottom: "xs",
    },
    link: {
      colorToken: "primary",
      textDecorationLine: "underline",
    },
    image: {
      width: "100%",
      minHeight: 140,
      maxHeight: 320,
      borderRadius: "md",
      marginBottom: "xs",
      backgroundColorToken: "muted",
    },
    table: {
      borderWidth: 1,
      borderColorToken: "border",
      borderRadius: "sm",
      marginBottom: "xs",
    },
    tableHead: {
      backgroundColorToken: "muted",
    },
    tableCell: {
      padding: "xs",
      fontSize: 11,
      headerFontWeight: "600",
      borderBottomWidth: 1,
      borderColorToken: "border",
    },
    horizontalRule: {
      backgroundColorToken: "border",
      height: 1,
      marginVertical: "xs",
    },
  },
} as const

export const MARKDOWN_THINK_SECTION_PRESENTATION = {
  labels: {
    collapsed: "Thinking",
    expanded: "Hide thinking",
  },
  accessibility: {
    showLabel: "Show thinking",
    hideLabel: "Hide thinking",
  },
  mobileIcon: {
    collapsedName: "chevron-forward",
    expandedName: "chevron-down",
    thinkName: "bulb-outline",
  },
} as const

export const MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION = {
  desktop: {
    containerBaseClassName: "overflow-hidden rounded-md border transition-colors",
    containerCollapsedClassName: "my-1 border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20",
    containerExpandedClassName: "my-3 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    headerBaseClassName: "flex w-full items-center gap-1.5 text-left transition-colors",
    headerCollapsedClassName: "px-2 py-0.5 hover:bg-amber-100/60 dark:hover:bg-amber-900/20",
    headerExpandedClassName: "px-3 py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30",
    chevronCollapsedClassName: "h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400",
    chevronExpandedClassName: "h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400",
    iconBaseClassName: "shrink-0 text-amber-600 dark:text-amber-400",
    iconCollapsedClassName: "h-3 w-3",
    iconExpandedClassName: "h-3.5 w-3.5",
    labelBaseClassName: "truncate text-amber-800 dark:text-amber-200",
    labelCollapsedClassName: "text-[11px] font-medium opacity-70",
    labelExpandedClassName: "text-sm font-medium",
    contentClassName: "px-3 pb-3 text-sm text-amber-900 dark:text-amber-100",
    proseAccentClassName: "prose-amber",
  },
  mobile: {
    container: {
      overflow: "hidden",
      borderRadius: "md",
      borderWidth: 1,
      collapsedMarginVertical: 2,
      expandedMarginVertical: "xs",
      collapsedBorderColor: {
        dark: "#fbbf24",
        darkAlpha: 0.28,
        light: "#f59e0b",
        lightAlpha: 0.35,
      },
      expandedBorderColor: {
        dark: "#fbbf24",
        darkAlpha: 0.45,
        light: "#f59e0b",
        lightAlpha: 0.5,
      },
      collapsedBackgroundColor: {
        dark: "#92400e",
        darkAlpha: 0.12,
        light: "#fef3c7",
        lightAlpha: 0.45,
      },
      expandedBackgroundColor: {
        dark: "#92400e",
        darkAlpha: 0.18,
        light: "#fef3c7",
        lightAlpha: 0.65,
      },
    },
    header: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: "sm",
      paddingVertical: 4,
      accessibilityRole: "button",
      pressedOpacity: 0.7,
    },
    chevron: {
      color: {
        dark: "#fbbf24",
        light: "#d97706",
      },
      size: 13,
    },
    icon: {
      color: {
        dark: "#fbbf24",
        light: "#d97706",
      },
      size: 13,
    },
    label: {
      color: {
        dark: "#fde68a",
        light: "#92400e",
      },
      fontSize: 11,
      fontWeight: "600",
      flex: 1,
    },
    content: {
      paddingHorizontal: "sm",
      paddingBottom: "sm",
    },
  },
} as const

type MarkdownMobileThemedColor = Readonly<{ dark: string; light: string }>
type MarkdownMobileThemedAlphaColor = Readonly<{
  dark: string
  darkAlpha: number
  light: string
  lightAlpha: number
}>

export type MarkdownContentMobileSurfaceColorToken =
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.body.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.heading1.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.heading2.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.heading3.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.paragraph.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.list.iconColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.inlineCode.backgroundColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.inlineCode.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlock.backgroundColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlock.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.borderColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.copiedBorderColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.backgroundColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton.copiedBackgroundColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon.copiedColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.blockquote.borderLeftColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.link.colorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.image.backgroundColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.table.borderColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.tableHead.backgroundColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.tableCell.borderColorToken
  | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.horizontalRule.backgroundColorToken

export type MarkdownContentMobileSurfaceColorPalette =
  Readonly<Record<MarkdownContentMobileSurfaceColorToken, string>>

export interface MarkdownContentMobileSurfaceColors {
  body: { color: string }
  heading1: { color: string }
  heading2: { color: string }
  heading3: { color: string }
  paragraph: { color: string }
  list: { iconColor: string }
  inlineCode: {
    backgroundColor: string
    color: string
  }
  codeBlock: {
    backgroundColor: string
    color: string
  }
  codeBlockCopyButton: {
    borderColor: string
    backgroundColor: string
    copiedBorderColor: string
    copiedBackgroundColor: string
  }
  codeBlockCopyIcon: {
    color: string
    copiedColor: string
  }
  blockquote: {
    backgroundColor: string
    borderLeftColor: string
  }
  link: { color: string }
  image: { backgroundColor: string }
  table: { borderColor: string }
  tableHead: { backgroundColor: string }
  tableCell: { borderColor: string }
  horizontalRule: { backgroundColor: string }
}

export interface MarkdownContentMobileSurfaceRenderStateInput {
  colors: MarkdownContentMobileSurfaceColorPalette
  isDark?: boolean
}

export interface MarkdownContentMobileSurfaceRenderState {
  surface: typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile
  colors: MarkdownContentMobileSurfaceColors
}

type MarkdownContentMobileSurface = typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile
type MarkdownThinkSectionMobileSurface = typeof MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile

export type MarkdownMobileStyleSpacingToken =
  | Extract<MarkdownContentMobileSurface["heading1"]["marginTop"], string>
  | Extract<MarkdownContentMobileSurface["heading2"]["marginTop"], string>
  | Extract<MarkdownContentMobileSurface["paragraph"]["marginBottom"], string>
  | Extract<MarkdownContentMobileSurface["list"]["marginBottom"], string>
  | Extract<MarkdownContentMobileSurface["codeBlock"]["padding"], string>
  | Extract<MarkdownContentMobileSurface["codeBlock"]["marginBottom"], string>
  | Extract<MarkdownContentMobileSurface["blockquote"]["paddingLeft"], string>
  | Extract<MarkdownContentMobileSurface["blockquote"]["marginBottom"], string>
  | Extract<MarkdownContentMobileSurface["image"]["marginBottom"], string>
  | Extract<MarkdownContentMobileSurface["table"]["marginBottom"], string>
  | Extract<MarkdownContentMobileSurface["tableCell"]["padding"], string>
  | Extract<MarkdownContentMobileSurface["horizontalRule"]["marginVertical"], string>
  | Extract<MarkdownThinkSectionMobileSurface["container"]["collapsedMarginVertical"], string>
  | Extract<MarkdownThinkSectionMobileSurface["container"]["expandedMarginVertical"], string>
  | Extract<MarkdownThinkSectionMobileSurface["header"]["paddingHorizontal"], string>
  | Extract<MarkdownThinkSectionMobileSurface["content"]["paddingHorizontal"], string>
  | Extract<MarkdownThinkSectionMobileSurface["content"]["paddingBottom"], string>

export type MarkdownMobileStyleRadiusToken =
  | MarkdownContentMobileSurface["inlineCode"]["borderRadius"]
  | MarkdownContentMobileSurface["codeBlock"]["borderRadius"]
  | MarkdownContentMobileSurface["codeBlockCopyButton"]["borderRadius"]
  | MarkdownContentMobileSurface["image"]["borderRadius"]
  | MarkdownContentMobileSurface["table"]["borderRadius"]
  | MarkdownThinkSectionMobileSurface["container"]["borderRadius"]

export interface MarkdownContentMobileStyleSlotsInput {
  renderState: MarkdownContentMobileSurfaceRenderState
  spacing: Readonly<Record<MarkdownMobileStyleSpacingToken, number>>
  radius: Readonly<Record<MarkdownMobileStyleRadiusToken, number>>
  platform?: string | null
}

export interface MarkdownThinkSectionMobileStyleSlotsInput {
  renderState: MarkdownThinkSectionMobileSurfaceRenderState
  spacing: Readonly<Record<MarkdownMobileStyleSpacingToken, number>>
  radius: Readonly<Record<MarkdownMobileStyleRadiusToken, number>>
}

export interface MarkdownCodeBlockCopyMobileRenderStateInput {
  isCopied?: boolean
  colors: Pick<MarkdownContentMobileSurfaceColors, "codeBlockCopyButton" | "codeBlockCopyIcon">
}

export interface MarkdownCodeBlockCopyDesktopRenderState {
  label: string
  surface: typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop
  iconClassName:
    | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.codeBlockCopyIconClassName
    | typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop.codeBlockCopiedIconClassName
}

export interface MarkdownCodeBlockCopyMobileRenderState {
  label: string
  button: ReturnType<typeof getMarkdownCodeBlockCopyMobileButtonState>
  buttonColors: {
    borderColor: string
    backgroundColor: string
  }
  icon: {
    name: ReturnType<typeof getMarkdownCodeBlockCopyMobileIconState>["name"]
    size: number
    color: string
  }
}

export interface MarkdownCodeBlockCopyMobilePropsStylesLike {
  codeBlockCopyContainer: unknown
  codeBlockCopyText: unknown
  codeBlockCopyButton: unknown
  codeBlockCopyButtonCopied: unknown
  codeBlockCopyButtonPressed: unknown
}

export interface MarkdownCodeBlockCopyMobilePropsPartsInput<
  TStyles extends MarkdownCodeBlockCopyMobilePropsStylesLike = MarkdownCodeBlockCopyMobilePropsStylesLike,
  TPressHandler = unknown,
> {
  renderState: MarkdownCodeBlockCopyMobileRenderState
  styles: TStyles
  codeContent: string
  isCopied: boolean
  onCopy: TPressHandler
}

export interface MarkdownCodeBlockCopyMobilePropsParts<
  TStyles extends MarkdownCodeBlockCopyMobilePropsStylesLike = MarkdownCodeBlockCopyMobilePropsStylesLike,
  TPressHandler = unknown,
> {
  container: {
    props: {
      style: TStyles["codeBlockCopyContainer"]
    }
  }
  text: {
    text: string
    props: {
      style: TStyles["codeBlockCopyText"]
      selectable: true
    }
  }
  button: {
    props: {
      accessibilityRole: MarkdownCodeBlockCopyMobileRenderState["button"]["accessibilityRole"]
      accessibilityLabel: string
      onPress: TPressHandler
      style: (
        input: { pressed: boolean },
      ) => Array<
        | TStyles["codeBlockCopyButton"]
        | false
        | TStyles["codeBlockCopyButtonCopied"]
        | TStyles["codeBlockCopyButtonPressed"]
      >
    }
    icon: {
      props: MarkdownCodeBlockCopyMobileRenderState["icon"]
    }
  }
}

export interface MarkdownThinkSectionMobileSurfaceColors {
  collapsedContainer: {
    borderColor: string
    backgroundColor: string
  }
  expandedContainer: {
    borderColor: string
    backgroundColor: string
  }
  chevron: { color: string }
  icon: { color: string }
  label: { color: string }
}

export interface MarkdownThinkSectionMobileSurfaceRenderStateInput {
  isDark?: boolean
}

export interface MarkdownThinkSectionMobileSurfaceRenderState {
  surface: typeof MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile
  colors: MarkdownThinkSectionMobileSurfaceColors
}

function resolveMarkdownMobileThemedColor(
  color: MarkdownMobileThemedColor,
  isDark: boolean,
): string {
  return isDark ? color.dark : color.light
}

function resolveMarkdownMobileThemedAlphaColor(
  color: MarkdownMobileThemedAlphaColor,
  isDark: boolean,
): string {
  return hexToRgba(
    isDark ? color.dark : color.light,
    isDark ? color.darkAlpha : color.lightAlpha,
  )
}

export function getMarkdownThinkSectionAccessibilityLabel(isCollapsed: boolean): string {
  return isCollapsed
    ? MARKDOWN_THINK_SECTION_PRESENTATION.accessibility.showLabel
    : MARKDOWN_THINK_SECTION_PRESENTATION.accessibility.hideLabel
}

export function getMarkdownThinkSectionAccessibilityState(
  isCollapsed: boolean,
): MarkdownThinkSectionAccessibilityState {
  return { expanded: !isCollapsed }
}

export function getMarkdownThinkSectionDisplayLabel(isCollapsed: boolean): string {
  return isCollapsed
    ? MARKDOWN_THINK_SECTION_PRESENTATION.labels.collapsed
    : MARKDOWN_THINK_SECTION_PRESENTATION.labels.expanded
}

export function getMarkdownThinkSectionControlState(
  content: string,
  index: number,
  options: MarkdownThinkSectionControlOptions = {},
): MarkdownThinkSectionControlState {
  const key = options.getThinkKey ? options.getThinkKey(content, index) : `think-${index}`
  const isControlled = !!(options.isThinkExpanded && options.onToggleThink)
  if (!isControlled) {
    return { key, isControlled: false }
  }

  return {
    key,
    isControlled: true,
    isCollapsed: !options.isThinkExpanded!(key),
    onToggle: () => options.onToggleThink!(key),
  }
}

export function getMarkdownContentMobileSurfaceState(): typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile {
  return MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile
}

export function getMarkdownContentMobileSurfaceColors(
  colors: MarkdownContentMobileSurfaceColorPalette,
  input: { isDark?: boolean } = {},
): MarkdownContentMobileSurfaceColors {
  const surface = MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile
  const isDark = input.isDark ?? false

  return {
    body: {
      color: colors[surface.body.colorToken],
    },
    heading1: {
      color: colors[surface.heading1.colorToken],
    },
    heading2: {
      color: colors[surface.heading2.colorToken],
    },
    heading3: {
      color: colors[surface.heading3.colorToken],
    },
    paragraph: {
      color: colors[surface.paragraph.colorToken],
    },
    list: {
      iconColor: colors[surface.list.iconColorToken],
    },
    inlineCode: {
      backgroundColor: colors[surface.inlineCode.backgroundColorToken],
      color: colors[surface.inlineCode.colorToken],
    },
    codeBlock: {
      backgroundColor: colors[surface.codeBlock.backgroundColorToken],
      color: colors[surface.codeBlock.colorToken],
    },
    codeBlockCopyButton: {
      borderColor: colors[surface.codeBlockCopyButton.borderColorToken],
      backgroundColor: hexToRgba(
        colors[surface.codeBlockCopyButton.backgroundColorToken],
        surface.codeBlockCopyButton.backgroundAlpha,
      ),
      copiedBorderColor: colors[surface.codeBlockCopyButton.copiedBorderColorToken],
      copiedBackgroundColor: hexToRgba(
        colors[surface.codeBlockCopyButton.copiedBackgroundColorToken],
        surface.codeBlockCopyButton.copiedBackgroundAlpha,
      ),
    },
    codeBlockCopyIcon: {
      color: colors[surface.codeBlockCopyIcon.colorToken],
      copiedColor: colors[surface.codeBlockCopyIcon.copiedColorToken],
    },
    blockquote: {
      backgroundColor: resolveMarkdownMobileThemedAlphaColor(surface.blockquote.backgroundColor, isDark),
      borderLeftColor: colors[surface.blockquote.borderLeftColorToken],
    },
    link: {
      color: colors[surface.link.colorToken],
    },
    image: {
      backgroundColor: colors[surface.image.backgroundColorToken],
    },
    table: {
      borderColor: colors[surface.table.borderColorToken],
    },
    tableHead: {
      backgroundColor: colors[surface.tableHead.backgroundColorToken],
    },
    tableCell: {
      borderColor: colors[surface.tableCell.borderColorToken],
    },
    horizontalRule: {
      backgroundColor: colors[surface.horizontalRule.backgroundColorToken],
    },
  }
}

export function getMarkdownContentMobileSurfaceRenderState({
  colors,
  isDark,
}: MarkdownContentMobileSurfaceRenderStateInput): MarkdownContentMobileSurfaceRenderState {
  return {
    surface: getMarkdownContentMobileSurfaceState(),
    colors: getMarkdownContentMobileSurfaceColors(colors, { isDark }),
  }
}

function resolveMarkdownMobileSpacing(
  value: MarkdownMobileStyleSpacingToken | number,
  spacing: Readonly<Record<MarkdownMobileStyleSpacingToken, number>>,
): number {
  return typeof value === "number" ? value : spacing[value]
}

function resolveMarkdownMobileFontFamily(
  fontFamilyByPlatform: MarkdownContentMobileSurface["inlineCode"]["fontFamilyByPlatform"],
  platform?: string | null,
): string {
  return platform === "ios" ? fontFamilyByPlatform.ios : fontFamilyByPlatform.default
}

export function createMarkdownContentMobileStyleSlots({
  renderState,
  spacing,
  radius,
  platform,
}: MarkdownContentMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors
  const codeBlockCopyButton = getMarkdownCodeBlockCopyMobileRenderState({ colors })
  const copiedCodeBlockCopyButton = getMarkdownCodeBlockCopyMobileRenderState({
    isCopied: true,
    colors,
  })
  const inlineCodeFontFamily = resolveMarkdownMobileFontFamily(surface.inlineCode.fontFamilyByPlatform, platform)
  const codeBlockFontFamily = resolveMarkdownMobileFontFamily(surface.codeBlock.fontFamilyByPlatform, platform)
  const codeBlockText = {
    backgroundColor: colors.codeBlock.backgroundColor,
    color: colors.codeBlock.color,
    fontFamily: codeBlockFontFamily,
    fontSize: surface.codeBlock.fontSize,
    padding: resolveMarkdownMobileSpacing(surface.codeBlock.padding, spacing),
    borderRadius: radius[surface.codeBlock.borderRadius],
    marginBottom: resolveMarkdownMobileSpacing(surface.codeBlock.marginBottom, spacing),
    overflow: surface.codeBlock.overflow,
  }

  return {
    body: {
      color: colors.body.color,
      fontSize: surface.body.fontSize,
      lineHeight: surface.body.lineHeight,
    },
    heading1: {
      color: colors.heading1.color,
      fontSize: surface.heading1.fontSize,
      fontWeight: surface.heading1.fontWeight,
      marginTop: resolveMarkdownMobileSpacing(surface.heading1.marginTop, spacing),
      marginBottom: surface.heading1.marginBottom,
    },
    heading2: {
      color: colors.heading2.color,
      fontSize: surface.heading2.fontSize,
      fontWeight: surface.heading2.fontWeight,
      marginTop: resolveMarkdownMobileSpacing(surface.heading2.marginTop, spacing),
      marginBottom: surface.heading2.marginBottom,
    },
    heading3: {
      color: colors.heading3.color,
      fontSize: surface.heading3.fontSize,
      fontWeight: surface.heading3.fontWeight,
      marginTop: surface.heading3.marginTop,
      marginBottom: surface.heading3.marginBottom,
    },
    paragraph: {
      color: colors.paragraph.color,
      marginBottom: resolveMarkdownMobileSpacing(surface.paragraph.marginBottom, spacing),
      lineHeight: surface.paragraph.lineHeight,
    },
    strong: {
      fontWeight: surface.strong.fontWeight,
    },
    em: {
      fontStyle: surface.emphasis.fontStyle,
    },
    s: {
      textDecorationLine: surface.strikethrough.textDecorationLine,
    },
    bullet_list: {
      marginBottom: resolveMarkdownMobileSpacing(surface.list.marginBottom, spacing),
    },
    ordered_list: {
      marginBottom: resolveMarkdownMobileSpacing(surface.list.marginBottom, spacing),
    },
    list_item: {
      marginBottom: surface.list.itemMarginBottom,
    },
    bullet_list_icon: {
      color: colors.list.iconColor,
      marginRight: surface.list.iconMarginRight,
    },
    ordered_list_icon: {
      color: colors.list.iconColor,
      marginRight: surface.list.iconMarginRight,
    },
    code_inline: {
      backgroundColor: colors.inlineCode.backgroundColor,
      color: colors.inlineCode.color,
      fontFamily: inlineCodeFontFamily,
      fontSize: surface.inlineCode.fontSize,
      paddingHorizontal: surface.inlineCode.paddingHorizontal,
      paddingVertical: surface.inlineCode.paddingVertical,
      borderRadius: radius[surface.inlineCode.borderRadius],
    },
    code_block: codeBlockText,
    fence: codeBlockText,
    codeBlockCopyContainer: {
      position: "relative" as const,
      marginBottom: resolveMarkdownMobileSpacing(surface.codeBlock.marginBottom, spacing),
    },
    codeBlockCopyText: {
      backgroundColor: colors.codeBlock.backgroundColor,
      color: colors.codeBlock.color,
      fontFamily: codeBlockFontFamily,
      fontSize: surface.codeBlock.fontSize,
      padding: resolveMarkdownMobileSpacing(surface.codeBlock.padding, spacing),
      paddingRight: surface.codeBlock.copyPaddingRight,
      borderRadius: radius[surface.codeBlock.borderRadius],
      overflow: surface.codeBlock.overflow,
    },
    codeBlockCopyButton: {
      position: codeBlockCopyButton.button.position,
      top: codeBlockCopyButton.button.top,
      right: codeBlockCopyButton.button.right,
      width: codeBlockCopyButton.button.size,
      height: codeBlockCopyButton.button.size,
      borderRadius: radius[codeBlockCopyButton.button.borderRadius],
      borderWidth: codeBlockCopyButton.button.borderWidth,
      borderColor: codeBlockCopyButton.buttonColors.borderColor,
      backgroundColor: codeBlockCopyButton.buttonColors.backgroundColor,
      alignItems: codeBlockCopyButton.button.alignItems,
      justifyContent: codeBlockCopyButton.button.justifyContent,
    },
    codeBlockCopyButtonCopied: {
      borderColor: copiedCodeBlockCopyButton.buttonColors.borderColor,
      backgroundColor: copiedCodeBlockCopyButton.buttonColors.backgroundColor,
    },
    codeBlockCopyButtonPressed: {
      opacity: codeBlockCopyButton.button.pressedOpacity,
    },
    blockquote: {
      backgroundColor: colors.blockquote.backgroundColor,
      borderLeftWidth: surface.blockquote.borderLeftWidth,
      borderLeftColor: colors.blockquote.borderLeftColor,
      paddingLeft: resolveMarkdownMobileSpacing(surface.blockquote.paddingLeft, spacing),
      paddingVertical: surface.blockquote.paddingVertical,
      marginBottom: resolveMarkdownMobileSpacing(surface.blockquote.marginBottom, spacing),
    },
    link: {
      color: colors.link.color,
      textDecorationLine: surface.link.textDecorationLine,
    },
    image: {
      width: surface.image.width,
      minHeight: surface.image.minHeight,
      maxHeight: surface.image.maxHeight,
      borderRadius: radius[surface.image.borderRadius],
      marginBottom: resolveMarkdownMobileSpacing(surface.image.marginBottom, spacing),
      backgroundColor: colors.image.backgroundColor,
    },
    table: {
      borderWidth: surface.table.borderWidth,
      borderColor: colors.table.borderColor,
      borderRadius: radius[surface.table.borderRadius],
      marginBottom: resolveMarkdownMobileSpacing(surface.table.marginBottom, spacing),
    },
    thead: {
      backgroundColor: colors.tableHead.backgroundColor,
    },
    th: {
      padding: resolveMarkdownMobileSpacing(surface.tableCell.padding, spacing),
      fontWeight: surface.tableCell.headerFontWeight,
      borderBottomWidth: surface.tableCell.borderBottomWidth,
      borderColor: colors.tableCell.borderColor,
      fontSize: surface.tableCell.fontSize,
    },
    tr: {
      borderBottomWidth: surface.tableCell.borderBottomWidth,
      borderColor: colors.tableCell.borderColor,
    },
    td: {
      padding: resolveMarkdownMobileSpacing(surface.tableCell.padding, spacing),
      fontSize: surface.tableCell.fontSize,
    },
    hr: {
      backgroundColor: colors.horizontalRule.backgroundColor,
      height: surface.horizontalRule.height,
      marginVertical: resolveMarkdownMobileSpacing(surface.horizontalRule.marginVertical, spacing),
    },
  }
}

export function getMarkdownContentDesktopSurfaceState(): typeof MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop {
  return MARKDOWN_CONTENT_SURFACE_PRESENTATION.desktop
}

export function getMarkdownRenderOptions(): SplitMarkdownContentOptions {
  return MARKDOWN_RENDER_OPTIONS
}

export function isMarkdownContentVideoLinkUrl(rawUrl?: string): boolean {
  return !!rawUrl && isMarkdownVideoLinkUrl(rawUrl, MARKDOWN_RENDER_OPTIONS)
}

export function isAllowedMarkdownContentLinkUrl(rawUrl?: string): boolean {
  return isAllowedMarkdownLinkUrl(rawUrl, MARKDOWN_RENDER_OPTIONS)
}

export function transformMarkdownContentUrl(url: string, key?: string): string {
  return transformMarkdownUrl(url, key, MARKDOWN_RENDER_OPTIONS)
}

export function getMarkdownThinkSectionMobileSurfaceColors(
  input: { isDark?: boolean } = {},
): MarkdownThinkSectionMobileSurfaceColors {
  const surface = MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile
  const isDark = input.isDark ?? false

  return {
    collapsedContainer: {
      borderColor: resolveMarkdownMobileThemedAlphaColor(surface.container.collapsedBorderColor, isDark),
      backgroundColor: resolveMarkdownMobileThemedAlphaColor(surface.container.collapsedBackgroundColor, isDark),
    },
    expandedContainer: {
      borderColor: resolveMarkdownMobileThemedAlphaColor(surface.container.expandedBorderColor, isDark),
      backgroundColor: resolveMarkdownMobileThemedAlphaColor(surface.container.expandedBackgroundColor, isDark),
    },
    chevron: {
      color: resolveMarkdownMobileThemedColor(surface.chevron.color, isDark),
    },
    icon: {
      color: resolveMarkdownMobileThemedColor(surface.icon.color, isDark),
    },
    label: {
      color: resolveMarkdownMobileThemedColor(surface.label.color, isDark),
    },
  }
}

export function getMarkdownThinkSectionMobileSurfaceRenderState({
  isDark,
}: MarkdownThinkSectionMobileSurfaceRenderStateInput = {}): MarkdownThinkSectionMobileSurfaceRenderState {
  return {
    surface: getMarkdownThinkSectionMobileSurfaceState(),
    colors: getMarkdownThinkSectionMobileSurfaceColors({ isDark }),
  }
}

export function createMarkdownThinkSectionMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: MarkdownThinkSectionMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    container: {
      overflow: surface.container.overflow,
      borderRadius: radius[surface.container.borderRadius],
      borderWidth: surface.container.borderWidth,
      marginVertical: resolveMarkdownMobileSpacing(surface.container.collapsedMarginVertical, spacing),
    },
    containerCollapsed: {
      borderColor: colors.collapsedContainer.borderColor,
      backgroundColor: colors.collapsedContainer.backgroundColor,
    },
    containerExpanded: {
      borderColor: colors.expandedContainer.borderColor,
      backgroundColor: colors.expandedContainer.backgroundColor,
      marginVertical: resolveMarkdownMobileSpacing(surface.container.expandedMarginVertical, spacing),
    },
    header: {
      minHeight: surface.header.minHeight,
      flexDirection: surface.header.flexDirection,
      alignItems: surface.header.alignItems,
      gap: surface.header.gap,
      paddingHorizontal: resolveMarkdownMobileSpacing(surface.header.paddingHorizontal, spacing),
      paddingVertical: surface.header.paddingVertical,
    },
    headerPressed: {
      opacity: surface.header.pressedOpacity,
    },
    label: {
      color: colors.label.color,
      fontSize: surface.label.fontSize,
      fontWeight: surface.label.fontWeight,
      flex: surface.label.flex,
    },
    content: {
      paddingHorizontal: resolveMarkdownMobileSpacing(surface.content.paddingHorizontal, spacing),
      paddingBottom: resolveMarkdownMobileSpacing(surface.content.paddingBottom, spacing),
    },
  }
}

export function getMarkdownThinkSectionMobileIconState(): typeof MARKDOWN_THINK_SECTION_PRESENTATION.mobileIcon {
  return MARKDOWN_THINK_SECTION_PRESENTATION.mobileIcon
}

export function getMarkdownThinkSectionMobileChevronIconState(isCollapsed: boolean) {
  const icon = MARKDOWN_THINK_SECTION_PRESENTATION.mobileIcon
  const chevron = MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.chevron

  return {
    name: isCollapsed ? icon.collapsedName : icon.expandedName,
    size: chevron.size,
    color: chevron.color,
  } as const
}

export function getMarkdownThinkSectionMobileLeadingIconState() {
  const icon = MARKDOWN_THINK_SECTION_PRESENTATION.mobileIcon
  const surface = MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.icon

  return {
    name: icon.thinkName,
    size: surface.size,
    color: surface.color,
  } as const
}

export function getMarkdownThinkSectionMobileContainerState(isCollapsed: boolean) {
  const container = MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.container

  return {
    overflow: container.overflow,
    borderRadius: container.borderRadius,
    borderWidth: container.borderWidth,
    marginVertical: isCollapsed ? container.collapsedMarginVertical : container.expandedMarginVertical,
    borderColor: isCollapsed ? container.collapsedBorderColor : container.expandedBorderColor,
    backgroundColor: isCollapsed ? container.collapsedBackgroundColor : container.expandedBackgroundColor,
  } as const
}

export function getMarkdownThinkSectionMobileHeaderState() {
  return MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.header
}

export function getMarkdownThinkSectionMobileLabelState() {
  return MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.label
}

export function getMarkdownThinkSectionMobileContentState() {
  return MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile.content
}

export function getMarkdownThinkSectionDesktopSurfaceState(): typeof MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.desktop {
  return MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.desktop
}

export function getMarkdownThinkSectionMobileSurfaceState(): typeof MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile {
  return MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION.mobile
}

export function getMarkdownImageFallbackLabel(alt?: string): string {
  return alt || MARKDOWN_CONTENT_PRESENTATION.image.fallbackLabel
}

export function getMarkdownImageUnavailableLabel(): string {
  return MARKDOWN_CONTENT_PRESENTATION.image.unavailableLabel
}

export function getMarkdownImageInvalidAssetUrlMessage(): string {
  return MARKDOWN_CONTENT_PRESENTATION.image.invalidAssetUrlMessage
}

export function getMarkdownImageLoadErrorFallback(): string {
  return MARKDOWN_CONTENT_PRESENTATION.image.loadErrorFallback
}

export function getMarkdownCodeBlockCopyLabel(isCopied = false): string {
  return isCopied
    ? MARKDOWN_CONTENT_PRESENTATION.codeBlock.copiedLabel
    : MARKDOWN_CONTENT_PRESENTATION.codeBlock.copyLabel
}

export function getMarkdownCodeBlockFeedbackResetDelayMs(): number {
  return MARKDOWN_CONTENT_PRESENTATION.codeBlock.feedbackResetDelayMs
}

export function getMarkdownCodeBlockCopyMobileIconState(isCopied = false) {
  const icon = MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyIcon

  return {
    name: isCopied ? icon.copiedName : icon.copyName,
    size: icon.size,
    colorToken: isCopied ? icon.copiedColorToken : icon.colorToken,
  } as const
}

export function getMarkdownCodeBlockCopyMobileButtonState(isCopied = false) {
  const button = MARKDOWN_CONTENT_SURFACE_PRESENTATION.mobile.codeBlockCopyButton

  return {
    position: button.position,
    top: button.top,
    right: button.right,
    size: button.size,
    borderRadius: button.borderRadius,
    borderWidth: button.borderWidth,
    borderColorToken: isCopied ? button.copiedBorderColorToken : button.borderColorToken,
    backgroundColorToken: isCopied ? button.copiedBackgroundColorToken : button.backgroundColorToken,
    backgroundAlpha: isCopied ? button.copiedBackgroundAlpha : button.backgroundAlpha,
    alignItems: button.alignItems,
    justifyContent: button.justifyContent,
    accessibilityRole: button.accessibilityRole,
    pressedOpacity: button.pressedOpacity,
  } as const
}

export function getMarkdownCodeBlockCopyDesktopRenderState(
  isCopied = false,
): MarkdownCodeBlockCopyDesktopRenderState {
  const surface = getMarkdownContentDesktopSurfaceState()

  return {
    label: getMarkdownCodeBlockCopyLabel(isCopied),
    surface,
    iconClassName: isCopied
      ? surface.codeBlockCopiedIconClassName
      : surface.codeBlockCopyIconClassName,
  }
}

export function getMarkdownCodeBlockCopyMobileRenderState({
  isCopied = false,
  colors,
}: MarkdownCodeBlockCopyMobileRenderStateInput): MarkdownCodeBlockCopyMobileRenderState {
  const icon = getMarkdownCodeBlockCopyMobileIconState(isCopied)

  return {
    label: getMarkdownCodeBlockCopyLabel(isCopied),
    button: getMarkdownCodeBlockCopyMobileButtonState(isCopied),
    buttonColors: {
      borderColor: isCopied
        ? colors.codeBlockCopyButton.copiedBorderColor
        : colors.codeBlockCopyButton.borderColor,
      backgroundColor: isCopied
        ? colors.codeBlockCopyButton.copiedBackgroundColor
        : colors.codeBlockCopyButton.backgroundColor,
    },
    icon: {
      name: icon.name,
      size: icon.size,
      color: isCopied
        ? colors.codeBlockCopyIcon.copiedColor
        : colors.codeBlockCopyIcon.color,
    },
  }
}

export function createMarkdownCodeBlockCopyMobilePropsParts<
  TStyles extends MarkdownCodeBlockCopyMobilePropsStylesLike = MarkdownCodeBlockCopyMobilePropsStylesLike,
  TPressHandler = unknown,
>({
  renderState,
  styles,
  codeContent,
  isCopied,
  onCopy,
}: MarkdownCodeBlockCopyMobilePropsPartsInput<TStyles, TPressHandler>):
  MarkdownCodeBlockCopyMobilePropsParts<TStyles, TPressHandler> {
  return {
    container: {
      props: {
        style: styles.codeBlockCopyContainer,
      },
    },
    text: {
      text: codeContent,
      props: {
        style: styles.codeBlockCopyText,
        selectable: true,
      },
    },
    button: {
      props: {
        accessibilityRole: renderState.button.accessibilityRole,
        accessibilityLabel: renderState.label,
        onPress: onCopy,
        style: ({ pressed }) => [
          styles.codeBlockCopyButton,
          isCopied && styles.codeBlockCopyButtonCopied,
          pressed && styles.codeBlockCopyButtonPressed,
        ],
      },
      icon: {
        props: renderState.icon,
      },
    },
  }
}

export function formatMarkdownImageRequestFailedMessage(status: number): string {
  return `Image request failed (${status})`
}

function splitVideoLinks(
  content: string,
  options: SplitMarkdownContentOptions = {},
): MarkdownRenderPart[] {
  const parts: MarkdownRenderPart[] = []
  let lastIndex = 0

  for (const reference of extractMarkdownLinkReferences(content)) {
    if (!isMarkdownVideoLinkUrl(reference.url, options)) continue

    if (reference.linkIndex > lastIndex) {
      parts.push({ type: "markdown", content: content.slice(lastIndex, reference.linkIndex) })
    }
    parts.push({ type: "video", label: reference.label, url: reference.url })
    lastIndex = reference.index + reference.fullMatch.length
  }

  if (lastIndex < content.length) {
    parts.push({ type: "markdown", content: content.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: "markdown", content }]
}

export function splitMarkdownContent(
  content: string,
  options: SplitMarkdownContentOptions = {},
): MarkdownRenderPart[] {
  const parts: MarkdownRenderPart[] = []
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
  let currentIndex = 0
  let match: RegExpExecArray | null

  const pushMarkdown = (value: string) => {
    if (!value.trim()) return
    parts.push(
      ...splitVideoLinks(value, options).filter((part) => part.type !== "markdown" || part.content.trim().length > 0),
    )
  }

  while ((match = thinkRegex.exec(content)) !== null) {
    if (match.index > currentIndex) {
      pushMarkdown(content.slice(currentIndex, match.index))
    }

    parts.push({ type: "think", content: match[1].trim() })
    currentIndex = match.index + match[0].length
  }

  if (currentIndex < content.length) {
    pushMarkdown(content.slice(currentIndex))
  }

  return parts.length > 0 ? parts : [{ type: "markdown", content }]
}
