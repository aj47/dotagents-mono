import type { AgentProgressUpdate } from "./agent-progress"
import { createExpandCollapseAccessibilityLabel } from "./accessibility-utils"
import { hexToRgba } from "./colors"
import {
  hasMarkdownMediaImageReference,
  hasMarkdownVideoLink,
  replaceMarkdownImageReferences,
  replaceMarkdownVideoLinks,
  stripMarkdownImageReferences,
  stripMarkdownVideoLinks,
} from "./conversation-media-assets"

// Inline data URLs can be megabytes long; replace them in display/budget text.
export interface StripMarkdownMediaPayloadOptions {
  stripAllImages?: boolean
}

function hasInlineDataImage(content: string): boolean {
  return !!content && /data:image\//i.test(content)
}

export function sanitizeMessageContentForDisplay(content: string): string {
  if (!hasInlineDataImage(content)) {
    return content
  }

  return replaceMarkdownImageReferences(content, (reference) => {
    if (!reference.url.trim().toLowerCase().startsWith("data:image/")) {
      return reference.fullMatch
    }

    const cleanedAlt = reference.altText.trim()
    return cleanedAlt ? `[Image: ${cleanedAlt}]` : "[Image]"
  })
}

export type MessageContentForModelLike = {
  content?: string | null
}

export function sanitizeMessageContentForModel(content: string): string {
  return sanitizeMessageContentForDisplay(content)
}

export function sanitizeMessagesForModel<T extends MessageContentForModelLike>(
  messages: T[],
): T[] {
  return messages.map((message) => {
    const rawContent = typeof message.content === "string" ? message.content : ""
    const sanitizedContent = sanitizeMessageContentForModel(rawContent)
    if (sanitizedContent === rawContent) {
      return message
    }

    return {
      ...message,
      content: sanitizedContent,
    }
  })
}

export function sanitizeMessageContentForSpeech(content: string): string {
  if (!content) {
    return content
  }

  // Strip markdown image payloads (including inline data URLs) before TTS.
  // This keeps speech requests small and avoids reading non-verbal content.
  const contentWithoutImages = replaceMarkdownImageReferences(content, (reference) => {
    const cleanedAlt = reference.altText.trim()
    return cleanedAlt ? `Image: ${cleanedAlt}` : "Image"
  })

  return replaceMarkdownVideoLinks(contentWithoutImages, (reference) => {
    const cleanedLabel = reference.label.trim()
    return cleanedLabel ? `Video: ${cleanedLabel}` : "Video"
  })
}

export function sanitizeMessageMediaContentForPreview(content: string): string {
  if (!content) {
    return content
  }

  return replaceMarkdownVideoLinks(
    replaceMarkdownImageReferences(content, () => "[Image]"),
    () => "[Video]",
  )
    .replace(/\s+/g, " ")
    .trim()
}

export function getChatMessageCollapsedPreview(content: string): string {
  return sanitizeMessageMediaContentForPreview(
    content.replace(/^#{1,6}\s+/gm, ""),
  )
}

export type ChatMessageMobileCollapsedPreviewColorToken =
  typeof CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.colorToken

export type ChatMessageMobileCollapsedPreviewColorPalette =
  Readonly<Record<ChatMessageMobileCollapsedPreviewColorToken, string>>

export interface ChatMessageMobileCollapsedPreviewColors {
  text: {
    color: string
  }
}

export interface ChatMessageCollapsedPreviewMobileActionStateInput {
  expansion: Pick<
    ChatMessageExpansionMobileRenderState,
    "canToggle" | "accessibilityLabel" | "accessibilityHint" | "accessibilityState" | "ariaExpanded"
  >
}

export interface ChatMessageCollapsedPreviewMobileActionState {
  canToggle: boolean
  disabled: boolean
  accessibilityLabel: string
  accessibilityHint?: string
  accessibilityState: ChatMessageExpansionActionState["accessibilityState"]
  ariaExpanded: boolean
}

export function getChatMessageMobileCollapsedPreviewState() {
  const surface = CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview

  return {
    numberOfLines: surface.numberOfLines,
    accessibilityRole: surface.accessibilityRole,
    colorToken: surface.colorToken,
    fontSize: surface.fontSize,
    lineHeight: surface.lineHeight,
    flex: surface.flex,
    minWidth: surface.minWidth,
    pressedOpacity: surface.pressedOpacity,
    hitSlop: surface.hitSlop,
  } as const
}

export function getChatMessageMobileCollapsedPreviewColors(
  colors: ChatMessageMobileCollapsedPreviewColorPalette,
): ChatMessageMobileCollapsedPreviewColors {
  const preview = getChatMessageMobileCollapsedPreviewState()

  return {
    text: {
      color: colors[preview.colorToken],
    },
  }
}

export function getChatMessageMobileSurfaceState() {
  const surface = CHAT_MESSAGE_SURFACE_PRESENTATION.mobile

  return {
    paddingHorizontal: surface.paddingHorizontal,
    paddingVertical: surface.paddingVertical,
    marginBottom: surface.marginBottom,
    width: surface.width,
    borderWidth: surface.borderWidth,
    borderRadius: surface.borderRadius,
  } as const
}

export function getChatMessageDesktopSurfaceState(): typeof CHAT_MESSAGE_SURFACE_PRESENTATION.desktop {
  return CHAT_MESSAGE_SURFACE_PRESENTATION.desktop
}

export function getChatMessageMobileContentLayoutState() {
  const surface = CHAT_MESSAGE_SURFACE_PRESENTATION.mobile

  return {
    row: {
      flexDirection: surface.contentRow.flexDirection,
      alignItems: surface.contentRow.alignItems,
      gap: surface.contentRow.gap,
      width: surface.contentRow.width,
    },
    body: {
      flex: surface.contentBody.flex,
      minWidth: surface.contentBody.minWidth,
    },
  } as const
}

export function stripMarkdownMediaPayloads(
  content: string,
  options: StripMarkdownMediaPayloadOptions = {},
): string {
  return stripMarkdownVideoLinks(
    stripMarkdownImageReferences(content, { mediaOnly: !options.stripAllImages }),
    { allowRecordingAssetUrls: true },
  )
}

export function hasMarkdownMediaPayload(content: string): boolean {
  return hasMarkdownMediaImageReference(content) ||
    hasMarkdownVideoLink(content, { allowRecordingAssetUrls: true })
}

export function normalizeAssistantResponseForDedupe(content: string | undefined): string {
  return (content ?? "").replace(/\s+/g, " ").trim()
}

export type ChatMessageDisplayRole = "user" | "assistant" | "tool"
export type ChatMessageDisplayTone = "user" | "assistant" | "assistant_final" | "tool"
export type ChatMessageToneMobileStyleSlot = "user" | "assistant" | "assistantFinal" | "tool"
export type ChatMessageToneColorToken = "info" | "success" | "warning" | "border" | "muted"
export type ChatMessageToneColorPalette = Readonly<Record<ChatMessageToneColorToken, string>>
export type ChatMessageActionMobileColorToken = "mutedForeground" | "primary" | "success" | "warning"
export type ChatMessageActionMobileColorPalette = Readonly<Record<ChatMessageActionMobileColorToken, string>>
export type ChatMessageMobileRenderColorPalette =
  ChatMessageToneColorPalette &
  ChatMessageMobileCollapsedPreviewColorPalette &
  ChatMessageActionMobileColorPalette
export type ChatMessageRuntimeVariant = "delegation" | "approval" | "retry"

export type ChatMessageConversationContentLike = {
  role?: string | null
  variant?: string | null
}

export type ChatMessageConversationContentSelector<T> = (
  item: T,
) => ChatMessageConversationContentLike | null | undefined

export type ChatMessageConversationContentDisplayPredicate<T> = (
  item: T,
  message: ChatMessageConversationContentLike,
) => boolean

export interface ChatMessageDisplayToneInput {
  role?: string | null
  isLast?: boolean
  isComplete?: boolean
  hasErrors?: boolean
}

export interface ChatMessageCopyActionInput {
  role?: string | null
  content?: string | null
  isAssistantComplete?: boolean
}

export interface ChatMessageCopyActionStateInput extends ChatMessageCopyActionInput {
  isCopied?: boolean
}

export interface ChatMessageCopyActionState {
  canCopy: boolean
  label: string | null
}

export interface ChatMessageSpeechActionInput {
  role?: string | null
  content?: string | null
  ttsEnabled?: boolean
  isVisible?: boolean
  isThinking?: boolean
  isAssistantThought?: boolean
  isThoughtEligibleForSpeech?: boolean
  isAssistantEligible?: boolean
}

export interface ChatMessageSpeechActionStateInput extends ChatMessageSpeechActionInput {
  isSpeaking?: boolean
}

export interface ChatMessageSpeechActionState {
  canSpeak: boolean
  label: string | null
}

export interface ChatMessageExpansionActionInput {
  shouldCollapse?: boolean
  isToolOnly?: boolean
}

export interface ChatMessageExpansionActionStateInput extends ChatMessageExpansionActionInput {
  isExpanded?: boolean
}

export interface ChatMessageExpansionActionState {
  canToggle: boolean
  label: string | null
  accessibilityLabel: string | null
  accessibilityHint: string | null
  accessibilityState: {
    expanded: boolean
    disabled: boolean
  }
  ariaExpanded: boolean
  isExpanded: boolean
}

export interface ChatMessageExpansionActionAccessibilityLabelInput {
  accessibilityLabel?: string | null
  label?: string | null
}

export interface ChatMessageTurnDurationBadgeInput {
  role?: string | null
  durationMs?: number | null
}

export interface ChatMessageSurfaceRenderInput {
  content?: string | null
  displayToolCallCount?: number | null
}

export interface ChatMessageContentRenderStateInput {
  content?: string | null
  isExpanded?: boolean
  shouldCollapse?: boolean
  isLiveStreaming?: boolean
}

export interface ChatMessageLiveStreamingContentInput {
  isResponding?: boolean
  messageIndex?: number | null
  lastConversationContentMessageIndex?: number | null
  message?: ChatMessageConversationContentLike | null
  content?: string | null
  displayToolCallCount?: number | null
}

export interface ChatMessageCollapseStateInput {
  content?: string | null
  hasExtras?: boolean
  suppressCollapse?: boolean
}

export interface ChatMessageContentRenderState {
  hasDisplayContent: boolean
  isCollapsed: boolean
  shouldShowExpandedContent: boolean
  shouldShowCollapsedTextPreview: boolean
  shouldRenderExpandedContent: boolean
  shouldRenderCollapsedTextPreview: boolean
  speech: {
    isVisible: boolean
  }
}

export interface ChatMessageStandaloneActionRowInput {
  renderState: Pick<ChatMessageContentRenderState, "shouldShowExpandedContent" | "shouldShowCollapsedTextPreview">
  visibleActionCount?: number | null
}

export interface ChatMessageActionLayoutStateInput {
  availability: ChatMessageActionSlotAvailability
  renderState: ChatMessageStandaloneActionRowInput["renderState"]
}

export interface ChatMessageActionLayoutRenderStateInput {
  availability: ChatMessageActionAvailabilityRenderState
  renderState: ChatMessageStandaloneActionRowInput["renderState"]
}

export type ChatMessageActionAvailabilityRenderStateInput =
  Readonly<Partial<Record<ChatMessageActionSlot, boolean>>>

export type ChatMessageActionAvailabilityRenderState = Readonly<Record<
  ChatMessageActionSlot,
  { canRender: boolean }
>>

export interface ChatMessageActionLayoutState {
  visibleSlots: ChatMessageActionSlot[]
  shouldRenderActionSlots: boolean
  shouldRenderStandaloneRow: boolean
}

export interface ChatMessageMobileRenderStateInput
  extends ChatMessageContentRenderStateInput,
    ChatMessageDisplayToneInput,
    ChatMessageExpansionActionInput {
  colors: ChatMessageMobileRenderColorPalette
}

export interface ChatMessageMobileRenderColors {
  collapsedPreview: ChatMessageMobileCollapsedPreviewColors
  tones: Record<ChatMessageDisplayTone, ReturnType<typeof getChatMessageToneMobileColors>>
}

export interface ChatMessageMobileRenderState {
  surface: ReturnType<typeof getChatMessageMobileSurfaceState>
  contentLayout: ReturnType<typeof getChatMessageMobileContentLayoutState>
  collapsedPreview: ReturnType<typeof getChatMessageMobileCollapsedPreviewState> & {
    text: string
  }
  collapsedPreviewAction: ChatMessageCollapsedPreviewMobileActionState
  content: ChatMessageContentRenderState
  expansion: ChatMessageExpansionMobileRenderState
  tone: ChatMessageDisplayTone
  toneStyleSlot: ChatMessageToneMobileStyleSlot
  colors: ChatMessageMobileRenderColors
}

export const CHAT_MESSAGE_DISPLAY_PRESENTATION = {
  collapseThresholds: {
    text: 100,
    media: 500,
  },
  collapsedPreviewLineCount: 2,
  roleLabels: {
    user: "You",
    assistant: "Agent",
    tool: "Tool",
  },
} as const

export const CHAT_MESSAGE_SURFACE_PRESENTATION = {
  desktop: {
    containerClassName: "relative rounded-md text-xs transition-all duration-200",
    contentRowClassName: "flex items-start px-2.5 py-1.5 text-left",
    bodyClassName: "flex-1 min-w-0",
    markdownClassName: "leading-relaxed text-left",
    collapsedMarkdownClassName: `line-clamp-${CHAT_MESSAGE_DISPLAY_PRESENTATION.collapsedPreviewLineCount}`,
    collapsedToggleClassName: "hover:brightness-95 dark:hover:brightness-110 cursor-pointer",
  },
  mobile: {
    paddingHorizontal: "sm",
    paddingVertical: "xs",
    marginBottom: "xs",
    width: "100%",
    borderWidth: "hairline",
    borderRadius: "md",
    contentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: "xs",
      width: "100%",
    },
    contentBody: {
      flex: 1,
      minWidth: 0,
    },
    collapsedPreview: {
      numberOfLines: CHAT_MESSAGE_DISPLAY_PRESENTATION.collapsedPreviewLineCount,
      accessibilityRole: "button",
      fontSize: 13,
      lineHeight: 18,
      colorToken: "foreground",
      flex: 1,
      minWidth: 0,
      pressedOpacity: 0.72,
      hitSlop: 6,
    },
  },
} as const

export const CHAT_MESSAGE_TONE_PRESENTATION = {
  user: {
    desktopClassName: "border border-blue-200/60 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/30",
    mobile: {
      border: { color: "info", alpha: 0.36 },
      background: { color: "info", alpha: 0.08 },
    },
  },
  assistant: {
    desktopClassName: "border border-border/40 bg-muted/30",
    mobile: {
      border: { color: "border", alpha: 0.7 },
      background: { color: "muted", alpha: 0.32 },
    },
  },
  assistant_final: {
    desktopClassName: "border border-green-200/60 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/30",
    mobile: {
      border: { color: "success", alpha: 0.36 },
      background: { color: "success", alpha: 0.08 },
    },
  },
  tool: {
    desktopClassName: "border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/20",
    mobile: {
      border: { color: "warning", alpha: 0.42 },
      background: { color: "warning", alpha: 0.08 },
    },
  },
} as const satisfies Record<ChatMessageDisplayTone, {
  desktopClassName: string
  mobile: {
    border: { color: ChatMessageToneColorToken; alpha: number }
    background: { color: ChatMessageToneColorToken; alpha: number }
  }
}>

export const CHAT_MESSAGE_ACTION_PRESENTATION = {
  copy: {
    messageLabel: "Copy message",
    promptLabel: "Copy prompt",
    responseLabel: "Copy response",
    copiedLabel: "Copied!",
    failedTitle: "Copy Failed",
    failedMessage: "Could not copy this message.",
    feedbackResetDelayMs: 2000,
    copyGlyph: "⧉",
    copiedGlyph: "✓",
    mobileIcon: {
      copyName: "copy-outline",
      copiedName: "checkmark-done-outline",
      size: 13,
    },
  },
  speech: {
    readAloudLabel: "Read aloud",
    stopReadingLabel: "Stop reading",
    readAloudGlyph: "🔊",
    stopReadingGlyph: "⏹",
    generatingAudioLabel: "Generating audio",
    generatingAudioTitle: "Generating audio...",
    pauseLabel: "Pause TTS",
    mobileIcon: {
      readAloudName: "volume-high-outline",
      stopReadingName: "stop-circle-outline",
      size: 13,
    },
  },
  expansion: {
    messageName: "message",
    showMoreLabel: "Show more",
    showLessLabel: "Show less",
    expandMessageHint: "Expand message",
    collapseMessageHint: "Collapse message",
    expandedGlyph: "▲",
    collapsedGlyph: "▼",
    mobileIcon: {
      expandedName: "chevron-up",
      collapsedName: "chevron-down",
      size: 14,
    },
  },
} as const

export type ChatMessageActionSlot =
  | "turnDuration"
  | "speech"
  | "branch"
  | "copy"
  | "expansion"

export type ChatMessageActionSlotAvailability = Readonly<Record<ChatMessageActionSlot, boolean>>

export const CHAT_MESSAGE_ACTION_SEQUENCE = [
  "turnDuration",
  "speech",
  "branch",
  "copy",
  "expansion",
] as const satisfies readonly ChatMessageActionSlot[]

export const CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION = {
  desktop: {
    buttonClassName: "p-1 rounded hover:bg-muted/30 transition-colors",
    activeButtonClassName: "animate-pulse",
    actionRowClassName: "flex items-center gap-1 flex-shrink-0",
    turnDurationBadgeClassName: "inline-flex items-center gap-0.5 px-1 text-[10px] tabular-nums text-muted-foreground/80",
    turnDurationLiveClassName: "animate-pulse text-amber-600 dark:text-amber-400",
    turnDurationIconClassName: "h-2.5 w-2.5",
    generatingAudioIconClassName: "h-3 w-3 animate-spin text-blue-500",
    playingAudioIconClassName: "h-3 w-3 text-blue-500",
    branchIconClassName: "h-3 w-3 opacity-60 hover:opacity-100",
    copiedIconClassName: "h-3 w-3 text-green-500",
    copyIconClassName: "h-3 w-3 opacity-60 hover:opacity-100",
    toggleIconClassName: "h-3 w-3",
  },
  mobile: {
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 2,
      gap: "xs",
    },
    button: {
      accessibilityRole: "button",
      horizontalPadding: "sm",
      verticalPadding: "xs",
      horizontalMargin: 0,
      borderRadius: "lg",
      borderWidth: 1,
      disabledOpacity: 0.65,
    },
    buttonText: {
      fontWeight: "600",
    },
    speechButton: {
      alignSelf: "flex-start",
      width: 24,
      height: 24,
      marginTop: 1,
      borderRadius: 12,
      inactiveBackgroundColorToken: "mutedForeground",
      inactiveBackgroundAlpha: 0.1,
      activeBackgroundColorToken: "primary",
      activeBackgroundAlpha: 0.15,
      fontSize: 12,
      inactiveColorToken: "mutedForeground",
      activeColorToken: "primary",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      pressedOpacity: 0.7,
      hitSlop: 10,
    },
    expansionButton: {
      alignSelf: "flex-start",
      width: 24,
      height: 24,
      marginTop: 0,
      borderRadius: 12,
      backgroundColorToken: "mutedForeground",
      branchBackgroundColorToken: "primary",
      copiedBackgroundColorToken: "success",
      backgroundAlpha: 0.08,
      pressedOpacity: 0.7,
      hitSlop: 10,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    expansionButtonText: {
      fontSize: 10,
      fontWeight: "700",
      colorToken: "mutedForeground",
      branchColorToken: "primary",
      copiedColorToken: "success",
    },
    turnDurationBadge: {
      numberOfLines: 1,
      alignSelf: "flex-start",
      flexDirection: "row",
      minHeight: 24,
      marginTop: 0,
      paddingHorizontal: 6,
      borderRadius: 12,
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      backgroundColorToken: "mutedForeground",
      backgroundAlpha: 0.08,
      liveBackgroundColorToken: "warning",
      liveBackgroundAlpha: 0.13,
      pressedOpacity: 0.82,
      gap: 2,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "700",
      colorToken: "mutedForeground",
      liveColorToken: "warning",
      opacity: 0.82,
      liveOpacity: 1,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
  },
} as const

export function getChatMessageActionCopyState(): typeof CHAT_MESSAGE_ACTION_PRESENTATION {
  return CHAT_MESSAGE_ACTION_PRESENTATION
}

export function getChatMessageActionSequence(): typeof CHAT_MESSAGE_ACTION_SEQUENCE {
  return CHAT_MESSAGE_ACTION_SEQUENCE
}

export function getChatMessageVisibleActionSlots(
  availability: ChatMessageActionSlotAvailability,
): ChatMessageActionSlot[] {
  return CHAT_MESSAGE_ACTION_SEQUENCE.filter((actionSlot) => availability[actionSlot])
}

export function getChatMessageActionDesktopSurfaceState(): typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop {
  return CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop
}

export function getChatMessageDisplayRole(role?: string | null): ChatMessageDisplayRole {
  if (role === "user" || role === "tool") return role
  return "assistant"
}

export function isChatMessageRuntimeVariant(variant?: string | null): variant is ChatMessageRuntimeVariant {
  return variant === "delegation" || variant === "approval" || variant === "retry"
}

export function isChatMessageConversationContent(message: ChatMessageConversationContentLike): boolean {
  return message.role === "assistant" && !isChatMessageRuntimeVariant(message.variant)
}

export function findLastChatMessageConversationContentIndex<T>(
  items: readonly T[],
  getMessage: ChatMessageConversationContentSelector<T>,
  hasDisplayContent?: ChatMessageConversationContentDisplayPredicate<T>,
): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const message = getMessage(items[index])
    if (!message || !isChatMessageConversationContent(message)) continue
    if (hasDisplayContent && !hasDisplayContent(items[index], message)) continue
    return index
  }
  return -1
}

export function hasChatMessageDisplayContent(content?: string | null): boolean {
  return !!content?.trim()
}

export function shouldRenderChatMessageSurface(input: ChatMessageSurfaceRenderInput): boolean {
  return hasChatMessageDisplayContent(input.content) || (input.displayToolCallCount ?? 0) > 0
}

export function isChatMessageLiveStreamingConversationContent(
  input: ChatMessageLiveStreamingContentInput,
): boolean {
  return input.isResponding === true &&
    typeof input.messageIndex === "number" &&
    input.messageIndex === input.lastConversationContentMessageIndex &&
    input.message != null &&
    isChatMessageConversationContent(input.message) &&
    hasChatMessageDisplayContent(input.content) &&
    (input.displayToolCallCount ?? 0) === 0
}

export function getChatMessageContentRenderState(
  input: ChatMessageContentRenderStateInput,
): ChatMessageContentRenderState {
  const hasDisplayContent = hasChatMessageDisplayContent(input.content)
  const isExpanded = input.isExpanded === true
  const shouldCollapse = input.shouldCollapse === true
  const isLiveStreaming = input.isLiveStreaming === true
  const shouldShowExpandedContent = hasDisplayContent && (isExpanded || !shouldCollapse)
  const shouldShowCollapsedTextPreview = hasDisplayContent && !isExpanded && shouldCollapse
  const shouldRenderExpandedContent = shouldShowExpandedContent || isLiveStreaming
  const shouldRenderCollapsedTextPreview = shouldShowCollapsedTextPreview && !isLiveStreaming
  const shouldShowSpeech = shouldRenderExpandedContent || shouldRenderCollapsedTextPreview

  return {
    hasDisplayContent,
    isCollapsed: shouldRenderCollapsedTextPreview,
    shouldShowExpandedContent,
    shouldShowCollapsedTextPreview,
    shouldRenderExpandedContent,
    shouldRenderCollapsedTextPreview,
    speech: {
      isVisible: shouldShowSpeech,
    },
  }
}

export function shouldRenderChatMessageStandaloneActionRow(
  input: ChatMessageStandaloneActionRowInput,
): boolean {
  return !input.renderState.shouldShowExpandedContent &&
    !input.renderState.shouldShowCollapsedTextPreview &&
    (input.visibleActionCount ?? 0) > 0
}

export function getChatMessageActionLayoutState(
  input: ChatMessageActionLayoutStateInput,
): ChatMessageActionLayoutState {
  const visibleSlots = getChatMessageVisibleActionSlots(input.availability)
  const shouldRenderActionSlots = visibleSlots.length > 0

  return {
    visibleSlots,
    shouldRenderActionSlots,
    shouldRenderStandaloneRow: shouldRenderChatMessageStandaloneActionRow({
      renderState: input.renderState,
      visibleActionCount: visibleSlots.length,
    }),
  }
}

export function getChatMessageActionLayoutRenderState(
  input: ChatMessageActionLayoutRenderStateInput,
): ChatMessageActionLayoutState {
  return getChatMessageActionLayoutState({
    availability: {
      turnDuration: input.availability.turnDuration.canRender,
      speech: input.availability.speech.canRender,
      branch: input.availability.branch.canRender,
      copy: input.availability.copy.canRender,
      expansion: input.availability.expansion.canRender,
    },
    renderState: input.renderState,
  })
}

export function getChatMessageActionAvailabilityRenderState(
  input: ChatMessageActionAvailabilityRenderStateInput,
): ChatMessageActionAvailabilityRenderState {
  return {
    turnDuration: {
      canRender: input.turnDuration === true,
    },
    speech: {
      canRender: input.speech === true,
    },
    branch: {
      canRender: input.branch === true,
    },
    copy: {
      canRender: input.copy === true,
    },
    expansion: {
      canRender: input.expansion === true,
    },
  }
}

export function getChatMessageDisplayTone(input: ChatMessageDisplayToneInput): ChatMessageDisplayTone {
  const role = getChatMessageDisplayRole(input.role)
  if (role === "user" || role === "tool") return role
  if (input.isComplete && input.isLast && !input.hasErrors) return "assistant_final"
  return "assistant"
}

export function getChatMessageTonePresentation(tone: ChatMessageDisplayTone) {
  return CHAT_MESSAGE_TONE_PRESENTATION[tone]
}

export function getChatMessageToneDesktopClassName(tone: ChatMessageDisplayTone): string {
  return getChatMessageTonePresentation(tone).desktopClassName
}

export function getChatMessageToneMobileStyleSlot(
  tone: ChatMessageDisplayTone,
): ChatMessageToneMobileStyleSlot {
  return tone === "assistant_final" ? "assistantFinal" : tone
}

export function getChatMessageToneMobileColors(
  tone: ChatMessageDisplayTone,
  colors: ChatMessageToneColorPalette,
): { borderColor: string; backgroundColor: string } {
  const presentation = getChatMessageTonePresentation(tone).mobile
  return {
    borderColor: hexToRgba(colors[presentation.border.color], presentation.border.alpha),
    backgroundColor: hexToRgba(colors[presentation.background.color], presentation.background.alpha),
  }
}

export function getChatMessageMobileRenderState(
  input: ChatMessageMobileRenderStateInput,
): ChatMessageMobileRenderState {
  const collapsedPreview = getChatMessageMobileCollapsedPreviewState()
  const tone = getChatMessageDisplayTone(input)
  const expansion = getChatMessageExpansionMobileRenderState({
    shouldCollapse: input.shouldCollapse,
    isToolOnly: input.isToolOnly,
    isExpanded: input.isExpanded,
    colors: input.colors,
  })

  return {
    surface: getChatMessageMobileSurfaceState(),
    contentLayout: getChatMessageMobileContentLayoutState(),
    collapsedPreview: {
      ...collapsedPreview,
      text: getChatMessageCollapsedPreview(input.content ?? ""),
    },
    content: getChatMessageContentRenderState(input),
    collapsedPreviewAction: getChatMessageCollapsedPreviewMobileActionState({ expansion }),
    expansion,
    tone,
    toneStyleSlot: getChatMessageToneMobileStyleSlot(tone),
    colors: {
      collapsedPreview: getChatMessageMobileCollapsedPreviewColors(input.colors),
      tones: {
        user: getChatMessageToneMobileColors("user", input.colors),
        assistant: getChatMessageToneMobileColors("assistant", input.colors),
        assistant_final: getChatMessageToneMobileColors("assistant_final", input.colors),
        tool: getChatMessageToneMobileColors("tool", input.colors),
      },
    },
  }
}

export function getChatMessageCollapsedPreviewMobileActionState(
  input: ChatMessageCollapsedPreviewMobileActionStateInput,
): ChatMessageCollapsedPreviewMobileActionState {
  return {
    canToggle: input.expansion.canToggle,
    disabled: !input.expansion.canToggle,
    accessibilityLabel: input.expansion.accessibilityLabel,
    accessibilityHint: input.expansion.accessibilityHint ?? undefined,
    accessibilityState: input.expansion.accessibilityState,
    ariaExpanded: input.expansion.ariaExpanded,
  }
}

export function getChatMessageCollapseThreshold(content: string): number {
  return hasMarkdownMediaPayload(content)
    ? CHAT_MESSAGE_DISPLAY_PRESENTATION.collapseThresholds.media
    : CHAT_MESSAGE_DISPLAY_PRESENTATION.collapseThresholds.text
}

export function shouldCollapseChatMessageContent(
  content: string | undefined,
  hasExtras = false,
): boolean {
  const rawContent = content ?? ""
  const textContentLength = stripMarkdownMediaPayloads(rawContent).length
  return textContentLength > getChatMessageCollapseThreshold(rawContent) || hasExtras
}

export function getChatMessageEffectiveCollapseState(input: ChatMessageCollapseStateInput): boolean {
  if (input.suppressCollapse === true) return false
  return shouldCollapseChatMessageContent(input.content ?? undefined, input.hasExtras === true)
}

export function getChatMessageCopyLabel(role?: string | null, isCopied = false): string {
  if (isCopied) return CHAT_MESSAGE_ACTION_PRESENTATION.copy.copiedLabel
  return getChatMessageDisplayRole(role) === "user"
    ? CHAT_MESSAGE_ACTION_PRESENTATION.copy.promptLabel
    : CHAT_MESSAGE_ACTION_PRESENTATION.copy.responseLabel
}

export function shouldShowChatMessageCopyAction(input: ChatMessageCopyActionInput): boolean {
  if (!input.content?.trim()) return false
  if (input.role === "user") return true
  return input.role === "assistant" && input.isAssistantComplete === true
}

export function getChatMessageCopyActionState(
  input: ChatMessageCopyActionStateInput,
): ChatMessageCopyActionState {
  const canCopy = shouldShowChatMessageCopyAction(input)
  return {
    canCopy,
    label: canCopy ? getChatMessageCopyLabel(input.role, input.isCopied === true) : null,
  }
}

export function getChatMessageCopyActionAccessibilityLabel(
  input: Pick<ChatMessageCopyActionState, "label">,
): string {
  return input.label ?? CHAT_MESSAGE_ACTION_PRESENTATION.copy.messageLabel
}

export function getChatMessageCopyActionTitle(
  input: Pick<ChatMessageCopyActionState, "label">,
): string {
  return input.label ?? CHAT_MESSAGE_ACTION_PRESENTATION.copy.messageLabel
}

export function getChatMessageCopyMobileIconState(isCopied = false) {
  return {
    name: isCopied
      ? CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.copiedName
      : CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.copyName,
    size: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.size,
    colorToken: isCopied
      ? CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.copiedColorToken
      : CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken,
  } as const
}

export type ChatMessageActionMobileButtonKind =
  | "standard"
  | "branch"
  | "copied"
  | "speech"
  | "speechActive"

export type ChatMessageActionMobileButtonSlot = Exclude<ChatMessageActionSlot, "turnDuration">
export type ChatMessageActionMobileActiveButtonSlot = Extract<
  ChatMessageActionMobileButtonSlot,
  "copy" | "speech"
>

export const CHAT_MESSAGE_ACTION_MOBILE_BUTTON_KIND_BY_SLOT = {
  speech: "speech",
  branch: "branch",
  copy: "standard",
  expansion: "standard",
} as const satisfies Record<ChatMessageActionMobileButtonSlot, ChatMessageActionMobileButtonKind>

export const CHAT_MESSAGE_ACTION_MOBILE_ACTIVE_BUTTON_KIND_BY_SLOT = {
  copy: "copied",
  speech: "speechActive",
} as const satisfies Record<ChatMessageActionMobileActiveButtonSlot, ChatMessageActionMobileButtonKind>

export function getChatMessageActionMobileButtonKindForSlot(
  slot: ChatMessageActionMobileButtonSlot,
): ChatMessageActionMobileButtonKind {
  return CHAT_MESSAGE_ACTION_MOBILE_BUTTON_KIND_BY_SLOT[slot]
}

export function getChatMessageActionMobileActiveButtonKindForSlot(
  slot: ChatMessageActionMobileActiveButtonSlot,
): ChatMessageActionMobileButtonKind {
  return CHAT_MESSAGE_ACTION_MOBILE_ACTIVE_BUTTON_KIND_BY_SLOT[slot]
}

export function getChatMessageActionMobileButtonStateForSlot(
  slot: ChatMessageActionMobileButtonSlot,
): ReturnType<typeof getChatMessageActionMobileButtonState> {
  return getChatMessageActionMobileButtonState(getChatMessageActionMobileButtonKindForSlot(slot))
}

export function getChatMessageActionMobileButtonStatesBySlot(): Record<
  ChatMessageActionMobileButtonSlot,
  ReturnType<typeof getChatMessageActionMobileButtonState>
> {
  return {
    speech: getChatMessageActionMobileButtonStateForSlot("speech"),
    branch: getChatMessageActionMobileButtonStateForSlot("branch"),
    copy: getChatMessageActionMobileButtonStateForSlot("copy"),
    expansion: getChatMessageActionMobileButtonStateForSlot("expansion"),
  }
}

export interface ChatMessageActionMobileTurnDurationBadgeStateInput {
  isLive?: boolean
}

export interface ChatMessageActionMobileColors {
  backgroundColor: string
  color: string
}

export interface ChatMessageActionMobileButtonRenderStateInput {
  kind?: ChatMessageActionMobileButtonKind
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatMessageActionMobileButtonRenderState {
  button: ReturnType<typeof getChatMessageActionMobileButtonState>
  colors: ChatMessageActionMobileColors
}

export interface ChatMessageActionMobileStyleRenderStateInput {
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatMessageActionMobileStyleRenderState {
  row: ReturnType<typeof getChatMessageActionMobileRowState>
  buttons: Record<ChatMessageActionMobileButtonKind, ChatMessageActionMobileButtonRenderState>
  slotButtons: Record<ChatMessageActionMobileButtonSlot, ChatMessageActionMobileButtonRenderState>
  activeSlotButtons: Record<
    ChatMessageActionMobileActiveButtonSlot,
    ChatMessageActionMobileButtonRenderState
  >
}

export interface ChatMessageActionMobileIconState {
  colorToken: ChatMessageActionMobileColorToken
}

export interface ChatMessageActionMobileIconColors {
  color: string
}

export interface ChatMessageCopyMobileRenderStateInput extends ChatMessageCopyActionStateInput {
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatMessageCopyMobileRenderState extends ChatMessageCopyActionState {
  accessibilityRole: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole
  accessibilityLabel: string
  icon: {
    name: ReturnType<typeof getChatMessageCopyMobileIconState>["name"]
    size: number
    color: string
  }
}

export interface ChatMessageSpeechMobileRenderStateInput extends ChatMessageSpeechActionStateInput {
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatMessageSpeechMobileRenderState extends ChatMessageSpeechActionState {
  accessibilityRole: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole
  accessibilityLabel: string
  icon: {
    name: ReturnType<typeof getChatMessageSpeechMobileIconState>["name"]
    size: number
    color: string
  }
}

export interface ChatMessageExpansionMobileRenderStateInput extends ChatMessageExpansionActionStateInput {
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatMessageExpansionMobileRenderState extends ChatMessageExpansionActionState {
  accessibilityRole: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole
  accessibilityLabel: string
  icon: {
    name: ReturnType<typeof getChatMessageExpansionMobileIconState>["name"]
    size: number
    color: string
  }
}

export function getChatMessageActionMobileRowState() {
  const surface = CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row

  return {
    flexDirection: surface.flexDirection,
    alignItems: surface.alignItems,
    justifyContent: surface.justifyContent,
    marginTop: surface.marginTop,
    gap: surface.gap,
  } as const
}

export function getChatMessageActionMobileButtonState(
  kind: ChatMessageActionMobileButtonKind = "standard",
) {
  if (kind === "speech" || kind === "speechActive") {
    const surface = CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton
    const isActive = kind === "speechActive"

    return {
      alignSelf: surface.alignSelf,
      width: surface.width,
      height: surface.height,
      marginTop: surface.marginTop,
      borderRadius: surface.borderRadius,
      hitSlop: surface.hitSlop,
      accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
      pressedOpacity: surface.pressedOpacity,
      disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
      backgroundColorToken: isActive
        ? surface.activeBackgroundColorToken
        : surface.inactiveBackgroundColorToken,
      backgroundAlpha: isActive
        ? surface.activeBackgroundAlpha
        : surface.inactiveBackgroundAlpha,
      colorToken: isActive
        ? surface.activeColorToken
        : surface.inactiveColorToken,
      fontSize: surface.fontSize,
      alignItems: surface.alignItems,
      justifyContent: surface.justifyContent,
      flexShrink: surface.flexShrink,
    } as const
  }

  const surface = CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton
  const textSurface = CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText
  const isBranch = kind === "branch"
  const isCopied = kind === "copied"

  return {
    alignSelf: surface.alignSelf,
    width: surface.width,
    height: surface.height,
    marginTop: surface.marginTop,
    borderRadius: surface.borderRadius,
    hitSlop: surface.hitSlop,
    accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
    pressedOpacity: surface.pressedOpacity,
    disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
    backgroundColorToken: isCopied
      ? surface.copiedBackgroundColorToken
      : isBranch
        ? surface.branchBackgroundColorToken
        : surface.backgroundColorToken,
    backgroundAlpha: surface.backgroundAlpha,
    colorToken: isCopied
      ? textSurface.copiedColorToken
      : isBranch
        ? textSurface.branchColorToken
        : textSurface.colorToken,
    fontSize: textSurface.fontSize,
    fontWeight: textSurface.fontWeight,
    alignItems: surface.alignItems,
    justifyContent: surface.justifyContent,
    flexShrink: surface.flexShrink,
  } as const
}

export function getChatMessageActionMobileButtonColors(
  kind: ChatMessageActionMobileButtonKind,
  colors: ChatMessageActionMobileColorPalette,
): ChatMessageActionMobileColors {
  const state = getChatMessageActionMobileButtonState(kind)

  return {
    backgroundColor: hexToRgba(colors[state.backgroundColorToken], state.backgroundAlpha),
    color: colors[state.colorToken],
  }
}

export function getChatMessageActionMobileButtonRenderState({
  kind = "standard",
  colors,
}: ChatMessageActionMobileButtonRenderStateInput): ChatMessageActionMobileButtonRenderState {
  return {
    button: getChatMessageActionMobileButtonState(kind),
    colors: getChatMessageActionMobileButtonColors(kind, colors),
  }
}

export function getChatMessageActionMobileStyleRenderState({
  colors,
}: ChatMessageActionMobileStyleRenderStateInput): ChatMessageActionMobileStyleRenderState {
  const buttons = {
    standard: getChatMessageActionMobileButtonRenderState({ colors }),
    branch: getChatMessageActionMobileButtonRenderState({ kind: "branch", colors }),
    copied: getChatMessageActionMobileButtonRenderState({ kind: "copied", colors }),
    speech: getChatMessageActionMobileButtonRenderState({ kind: "speech", colors }),
    speechActive: getChatMessageActionMobileButtonRenderState({ kind: "speechActive", colors }),
  }
  const getSlotButton = (slot: ChatMessageActionMobileButtonSlot) => {
    return buttons[getChatMessageActionMobileButtonKindForSlot(slot)]
  }
  const getActiveSlotButton = (slot: ChatMessageActionMobileActiveButtonSlot) => {
    return buttons[getChatMessageActionMobileActiveButtonKindForSlot(slot)]
  }

  return {
    row: getChatMessageActionMobileRowState(),
    buttons,
    slotButtons: {
      speech: getSlotButton("speech"),
      branch: getSlotButton("branch"),
      copy: getSlotButton("copy"),
      expansion: getSlotButton("expansion"),
    },
    activeSlotButtons: {
      copy: getActiveSlotButton("copy"),
      speech: getActiveSlotButton("speech"),
    },
  }
}

export function getChatMessageActionMobileIconColors(
  icon: ChatMessageActionMobileIconState,
  colors: ChatMessageActionMobileColorPalette,
): ChatMessageActionMobileIconColors {
  return {
    color: colors[icon.colorToken],
  }
}

export function getChatMessageActionMobileTurnDurationBadgeState(
  input: ChatMessageActionMobileTurnDurationBadgeStateInput = {},
) {
  const surface = CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge
  const isLive = input.isLive === true

  return {
    numberOfLines: surface.numberOfLines,
    alignSelf: surface.alignSelf,
    flexDirection: surface.flexDirection,
    minHeight: surface.minHeight,
    marginTop: surface.marginTop,
    paddingHorizontal: surface.paddingHorizontal,
    borderRadius: surface.borderRadius,
    backgroundColorToken: isLive ? surface.liveBackgroundColorToken : surface.backgroundColorToken,
    backgroundAlpha: isLive ? surface.liveBackgroundAlpha : surface.backgroundAlpha,
    fontFamilyByPlatform: surface.fontFamilyByPlatform,
    gap: surface.gap,
    fontSize: surface.fontSize,
    lineHeight: surface.lineHeight,
    fontWeight: surface.fontWeight,
    colorToken: isLive ? surface.liveColorToken : surface.colorToken,
    opacity: isLive ? surface.liveOpacity : surface.opacity,
    alignItems: surface.alignItems,
    justifyContent: surface.justifyContent,
    flexShrink: surface.flexShrink,
  } as const
}

export function getChatMessageActionMobileTurnDurationBadgeColors(
  input: ChatMessageActionMobileTurnDurationBadgeStateInput,
  colors: ChatMessageActionMobileColorPalette,
): ChatMessageActionMobileColors {
  const state = getChatMessageActionMobileTurnDurationBadgeState(input)

  return {
    backgroundColor: hexToRgba(colors[state.backgroundColorToken], state.backgroundAlpha),
    color: colors[state.colorToken],
  }
}

export function shouldShowChatMessageSpeechAction(input: ChatMessageSpeechActionInput): boolean {
  if (input.role !== "assistant") return false
  if (input.ttsEnabled !== true) return false
  if (!input.content?.trim()) return false
  if (input.isVisible === false) return false
  if (input.isThinking === true) return false
  if (input.isAssistantThought === true && input.isThoughtEligibleForSpeech !== true) return false
  if (input.isAssistantEligible === false) return false
  return true
}

export function getChatMessageSpeechActionState(
  input: ChatMessageSpeechActionStateInput,
): ChatMessageSpeechActionState {
  const canSpeak = shouldShowChatMessageSpeechAction(input)
  return {
    canSpeak,
    label: canSpeak ? getChatMessageSpeechLabel(input.isSpeaking === true) : null,
  }
}

export function getChatMessageSpeechActionAccessibilityLabel(
  input: Pick<ChatMessageSpeechActionState, "label">,
): string {
  return input.label ?? CHAT_MESSAGE_ACTION_PRESENTATION.speech.readAloudLabel
}

export function getChatMessageSpeechMobileIconState(isSpeaking = false) {
  return {
    name: isSpeaking
      ? CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.stopReadingName
      : CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.readAloudName,
    size: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.size,
    colorToken: isSpeaking
      ? CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.activeColorToken
      : CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.inactiveColorToken,
  } as const
}

export function shouldShowChatMessageExpansionAction(input: ChatMessageExpansionActionInput): boolean {
  return input.shouldCollapse === true && input.isToolOnly !== true
}

export function getChatMessageExpansionActionState(
  input: ChatMessageExpansionActionStateInput,
): ChatMessageExpansionActionState {
  const canToggle = shouldShowChatMessageExpansionAction(input)
  const isExpanded = input.isExpanded === true

  return {
    canToggle,
    label: canToggle ? getChatMessageExpansionLabel(isExpanded) : null,
    accessibilityLabel: canToggle
      ? createExpandCollapseAccessibilityLabel(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.messageName, isExpanded)
      : null,
    accessibilityHint: canToggle
      ? isExpanded
        ? CHAT_MESSAGE_ACTION_PRESENTATION.expansion.collapseMessageHint
        : CHAT_MESSAGE_ACTION_PRESENTATION.expansion.expandMessageHint
      : null,
    accessibilityState: {
      expanded: isExpanded,
      disabled: !canToggle,
    },
    ariaExpanded: isExpanded,
    isExpanded,
  }
}

export function getChatMessageExpansionActionAccessibilityLabel(
  input: ChatMessageExpansionActionAccessibilityLabelInput,
): string {
  return (
    input.accessibilityLabel ??
    input.label ??
    CHAT_MESSAGE_ACTION_PRESENTATION.expansion.messageName
  )
}

export function getChatMessageExpansionActionTitle(
  input: Pick<ChatMessageExpansionActionState, "label">,
): string {
  return input.label ?? CHAT_MESSAGE_ACTION_PRESENTATION.expansion.messageName
}

export function getChatMessageExpansionMobileIconState(isExpanded = false) {
  return {
    name: isExpanded
      ? CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.expandedName
      : CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.collapsedName,
    size: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.size,
    colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken,
  } as const
}

export function getChatMessageCopyMobileRenderState(
  input: ChatMessageCopyMobileRenderStateInput,
): ChatMessageCopyMobileRenderState {
  const action = getChatMessageCopyActionState(input)
  const icon = getChatMessageCopyMobileIconState(input.isCopied === true)
  const iconColors = getChatMessageActionMobileIconColors(icon, input.colors)

  return {
    canCopy: action.canCopy,
    label: action.label,
    accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
    accessibilityLabel: getChatMessageCopyActionAccessibilityLabel(action),
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.color,
    },
  }
}

export function getChatMessageSpeechMobileRenderState(
  input: ChatMessageSpeechMobileRenderStateInput,
): ChatMessageSpeechMobileRenderState {
  const action = getChatMessageSpeechActionState(input)
  const icon = getChatMessageSpeechMobileIconState(input.isSpeaking === true)
  const iconColors = getChatMessageActionMobileIconColors(icon, input.colors)

  return {
    canSpeak: action.canSpeak,
    label: action.label,
    accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
    accessibilityLabel: getChatMessageSpeechActionAccessibilityLabel(action),
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.color,
    },
  }
}

export function getChatMessageExpansionMobileRenderState(
  input: ChatMessageExpansionMobileRenderStateInput,
): ChatMessageExpansionMobileRenderState {
  const action = getChatMessageExpansionActionState(input)
  const icon = getChatMessageExpansionMobileIconState(action.isExpanded)
  const iconColors = getChatMessageActionMobileIconColors(icon, input.colors)

  return {
    canToggle: action.canToggle,
    label: action.label,
    accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
    accessibilityLabel: getChatMessageExpansionActionAccessibilityLabel(action),
    accessibilityHint: action.accessibilityHint,
    accessibilityState: action.accessibilityState,
    ariaExpanded: action.ariaExpanded,
    isExpanded: action.isExpanded,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.color,
    },
  }
}

export type ChatDisplayExpansionKey = string | number
export type ChatDisplayExpansionStateMap<Key extends ChatDisplayExpansionKey = string> = Record<Key, boolean>

type ChatDisplayExpansionStateInput = Readonly<Partial<Record<ChatDisplayExpansionKey, boolean>>>

export interface ChatDisplayGroupedExpansionStateInput {
  groupState: ChatDisplayExpansionStateInput
  groupKey: ChatDisplayExpansionKey
  inheritedState?: ChatDisplayExpansionStateInput
  inheritedKey?: ChatDisplayExpansionKey | null
  defaultExpanded?: boolean
}

export interface ChatDisplayGroupedExpansionInheritanceItem {
  groupKey: ChatDisplayExpansionKey
  inheritedKey?: ChatDisplayExpansionKey | null
}

export interface ChatDisplayGroupedExpansionInheritanceInput {
  groupState: ChatDisplayExpansionStateMap<ChatDisplayExpansionKey>
  groups: readonly ChatDisplayGroupedExpansionInheritanceItem[]
  inheritedState?: ChatDisplayExpansionStateInput
}

export function hasChatDisplayExpansionState(
  state: ChatDisplayExpansionStateInput,
  key: ChatDisplayExpansionKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(state, key)
}

export function getChatDisplayExpansionState(
  state: ChatDisplayExpansionStateInput,
  key: ChatDisplayExpansionKey,
  defaultExpanded = false,
): boolean {
  return hasChatDisplayExpansionState(state, key)
    ? state[key] === true
    : defaultExpanded
}

export function setChatDisplayExpansionState(
  state: ChatDisplayExpansionStateInput,
  key: ChatDisplayExpansionKey,
  isExpanded: boolean,
): ChatDisplayExpansionStateMap<ChatDisplayExpansionKey> {
  return {
    ...state,
    [key]: isExpanded,
  } as ChatDisplayExpansionStateMap<ChatDisplayExpansionKey>
}

export function toggleChatDisplayExpansionState(
  state: ChatDisplayExpansionStateInput,
  key: ChatDisplayExpansionKey,
  defaultExpanded = false,
): ChatDisplayExpansionStateMap<ChatDisplayExpansionKey> {
  return setChatDisplayExpansionState(
    state,
    key,
    !getChatDisplayExpansionState(state, key, defaultExpanded),
  )
}

export function getChatDisplayGroupedExpansionState(
  input: ChatDisplayGroupedExpansionStateInput,
): boolean {
  const inheritedDefault = input.inheritedKey === undefined || input.inheritedKey === null
    ? input.defaultExpanded === true
    : getChatDisplayExpansionState(
      input.inheritedState ?? input.groupState,
      input.inheritedKey,
      input.defaultExpanded === true,
    )

  return getChatDisplayExpansionState(input.groupState, input.groupKey, inheritedDefault)
}

export function applyChatDisplayGroupedExpansionInheritance(
  input: ChatDisplayGroupedExpansionInheritanceInput,
): ChatDisplayExpansionStateMap<ChatDisplayExpansionKey> {
  let next = input.groupState
  const inheritedState = input.inheritedState ?? input.groupState

  for (const group of input.groups) {
    if (hasChatDisplayExpansionState(input.groupState, group.groupKey)) continue
    if (group.inheritedKey === undefined || group.inheritedKey === null) continue
    if (!getChatDisplayExpansionState(inheritedState, group.inheritedKey)) continue
    if (next === input.groupState) next = { ...input.groupState }
    next[group.groupKey] = true
  }

  return next
}

export function shouldShowChatMessageTurnDurationBadge(input: ChatMessageTurnDurationBadgeInput): boolean {
  return input.role === "user" && typeof input.durationMs === "number"
}

export function getChatMessageExpansionLabel(isExpanded: boolean): string {
  return isExpanded
    ? CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showLessLabel
    : CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel
}

export function getChatMessageSpeechLabel(isSpeaking: boolean): string {
  return isSpeaking
    ? CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel
    : CHAT_MESSAGE_ACTION_PRESENTATION.speech.readAloudLabel
}

/**
 * Normalize user-facing preview text for compact conversation/session lists.
 *
 * Thinking markup is useful in the full transcript, but sidebar/search previews
 * should surface readable prose instead of literal `<think>` tags. Prefer text
 * outside closed thought blocks; for an in-flight/open thought, fall back to the
 * thought text so the preview remains meaningful while reasoning is streaming.
 */
export function normalizeMessagePreviewText(value?: string | null): string | null {
  if (!value) return null

  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim() || null
  const openThink = value.match(/<think>([\s\S]*)$/i)
  if (openThink && !/<\/think>/i.test(openThink[1])) {
    const openThinkText = normalize(openThink[1])
    if (openThinkText) return openThinkText
  }

  const withoutClosed = normalize(value.replace(/<think>[\s\S]*?<\/think>/gi, ''))
  if (withoutClosed) return withoutClosed

  const closedThink = value.match(/<think>([\s\S]*?)<\/think>/i)
  const closedThinkText = normalize(closedThink?.[1] ?? '')
  if (closedThinkText) return closedThinkText

  return normalize(value)
}

function sanitizeConversationHistoryForDisplay(
  conversationHistory: AgentProgressUpdate["conversationHistory"]
): AgentProgressUpdate["conversationHistory"] {
  if (!conversationHistory?.length) {
    return conversationHistory
  }

  let changed = false
  const sanitized = conversationHistory.map((entry) => {
    const nextContent = sanitizeMessageContentForDisplay(entry.content)
    const nextDisplayContent = typeof entry.displayContent === "string"
      ? sanitizeMessageContentForDisplay(entry.displayContent)
      : entry.displayContent
    if (nextContent === entry.content && nextDisplayContent === entry.displayContent) {
      return entry
    }
    changed = true
    return { ...entry, content: nextContent, displayContent: nextDisplayContent }
  })

  return changed ? sanitized : conversationHistory
}

export function sanitizeAgentProgressUpdateForDisplay(
  update: AgentProgressUpdate
): AgentProgressUpdate {
  const sanitizedHistory = sanitizeConversationHistoryForDisplay(update.conversationHistory)
  if (sanitizedHistory === update.conversationHistory) {
    return update
  }
  return {
    ...update,
    conversationHistory: sanitizedHistory,
  }
}
