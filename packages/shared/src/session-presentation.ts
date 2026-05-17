import {
  getAgentConversationStateLabel,
  normalizeAgentConversationState,
  type AgentConversationState,
} from "./conversation-state"
export type { AgentConversationState } from "./conversation-state"
export {
  createAgentResponseHistoryMobileStyleSlots,
  getAgentResponseHistoryMobileRenderState,
  type AgentResponseHistoryMobileAnimationState,
} from "./agent-user-response-store"
import {
  applyUserResponseToChatMessages,
  applyChatMessageAutoExpansionState,
  extractRespondToUserResponseEvents,
  getNextAgentUserResponseEventOrdinal,
  getChatMessageDisplayState,
  getCompactToolExecutionPreview,
  hasVisibleChatMessageContent,
  preserveChatMessageDisplayContentFromProgress,
  sortAgentUserResponseEvents,
  type ChatDisplayMessageLike,
  type ChatMessageDisplayStateMessageLike,
  type ChatMessageDisplayToolEntry,
} from "./chat-utils"
export type {
  ChatDisplayMessageLike,
  ChatMessageDisplayStateMessageLike,
} from "./chat-utils"
import {
  createAgentDelegationProgressMessages,
  getAgentDelegationCardState,
  resolveAgentProgressConversationState,
  type ACPDelegationProgress,
  type AgentProgressUpdate,
  type AgentRetryInfo,
  type AgentStepSummary,
  type AgentUserResponseEvent,
  type AgentDelegationConversationPreviewRow,
  type AgentDelegationPresentation,
} from "./agent-progress"
export type {
  ACPDelegationProgress,
  AgentProgressUpdate,
  AgentRetryInfo,
  AgentStepSummary,
  AgentUserResponseEvent,
} from "./agent-progress"
import { hexToRgba } from "./colors"
import { formatConnectionStatus, type RecoveryState } from "./connection-recovery"
export { formatConnectionStatus, type RecoveryState } from "./connection-recovery"
import { normalizeMarkdownThoughtContent } from "./markdown-render-parts"
export {
  createMarkdownContentMobileStyleSlots,
  createMarkdownThinkSectionMobileStyleSlots,
  formatMarkdownImageRequestFailedMessage,
  getMarkdownCodeBlockCopyDesktopRenderState,
  getMarkdownCodeBlockFeedbackResetDelayMs,
  getMarkdownCodeBlockCopyMobileRenderState,
  getMarkdownContentDesktopSurfaceState,
  getMarkdownContentMobileSurfaceRenderState,
  getMarkdownImageFallbackLabel,
  getMarkdownImageInvalidAssetUrlMessage,
  getMarkdownImageLoadErrorFallback,
  getMarkdownImageUnavailableLabel,
  getMarkdownRenderOptions,
  getMarkdownThinkSectionAccessibilityLabel,
  getMarkdownThinkSectionAccessibilityState,
  getMarkdownThinkSectionControlState,
  getMarkdownThinkSectionDesktopSurfaceState,
  getMarkdownThinkSectionDisplayLabel,
  getMarkdownThinkSectionMobileChevronIconState,
  getMarkdownThinkSectionMobileLeadingIconState,
  getMarkdownThinkSectionMobileSurfaceRenderState,
  isAllowedMarkdownContentLinkUrl,
  isMarkdownContentVideoLinkUrl,
  normalizeMarkdownThoughtContent,
  splitMarkdownContent,
  transformMarkdownContentUrl,
  type MarkdownContentMobileStyleSlotsInput,
  type MarkdownContentMobileSurfaceRenderState,
  type MarkdownMobileStyleRadiusToken,
  type MarkdownMobileStyleSpacingToken,
  type MarkdownThinkSectionControlOptions,
  type MarkdownThinkSectionMobileStyleSlotsInput,
  type MarkdownThinkSectionMobileSurfaceRenderState,
} from "./markdown-render-parts"
export {
  CHAT_RUNTIME_AUTO_TTS_DUPLICATE_SUPPRESSION_MS,
  createChatRuntimeSpeechTextState,
} from "./tts-preprocessing"
export {
  createChatRuntimeEffectiveRemoteSpeechSettingsState,
  createChatRuntimeRemoteSpeechSettingsState,
  getChatRuntimeDefaultRemoteSpeechSettingsState,
  type ChatRuntimeRemoteSpeechProvider,
  type ChatRuntimeRemoteSpeechSettingsState,
} from "./text-to-speech-settings"
export { createChatRuntimeMobileConfigState } from "./mobile-app-config"
export { DEFAULT_EDGE_TTS_VOICE } from "./providers"
import {
  createHandsFreeComposerPermissionDeniedDebugState,
  createHandsFreeComposerRecognizerErrorDebugState,
  createHandsFreeComposerTranscriptAddedDebugState,
  formatHandsFreeSleepingDebugMessage,
  getHandsFreeComposerCopyState,
  getHandsFreeComposerControlState,
  getHandsFreeComposerDebugMessage,
  getHandsFreeComposerMobileSurfaceRenderState,
  getHandsFreeComposerPlaceholder,
  getHandsFreeMicButtonLabel,
  getHandsFreeStatusSubtitle,
  type HandsFreeComposerMobileSurfaceColorPalette,
  type HandsFreeComposerDebugMessageKey,
} from "./hands-free-controller"
export {
  getHandsFreeStatusChipMobileRenderState,
  type HandsFreeStatusChipMobileColors,
  type HandsFreeStatusChipMobileRenderState,
} from "./hands-free-controller"
import {
  extractDataImageMarkdownReferences,
  buildChatImageAttachmentMessage,
  getDataImageBytesFromUrl,
  getDecodedBase64ByteLength,
  getChatImageAttachmentMobileAlertState,
  getChatImageAttachmentMobileRenderState,
  inferImageMimeTypeFromSource,
  type ChatImageAttachmentMobileAlertInput,
  type ChatImageAttachmentMessageInput,
  type ChatImageAttachmentMobileRenderState,
  type ChatImageAttachmentMobileSurfaceColorPalette,
  type ImageMimeTypeSource,
  MAX_CHAT_IMAGE_ATTACHMENTS,
  MAX_CHAT_IMAGE_FILE_BYTES,
  MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
} from "./conversation-media-assets"
export {
  buildChatImageAttachmentMessage,
  buildConversationImageAssetHttpUrl,
  buildConversationVideoAssetHttpUrl,
  formatChatImageAttachmentLimitMessage,
  formatChatImageAttachmentErrorMessage,
  formatChatImageBudgetExceededMessage,
  formatChatImageBudgetReachedMessage,
  formatChatImageFileTooLargeMessage,
  formatChatImageNotImageFileMessage,
  formatChatImageSlotsRemainingMessage,
  formatChatImageTryFewerOrSmallerMessage,
  formatVideoAttachmentRequestFailedMessage,
  getDataImageBytesFromUrl,
  getChatImageAttachmentDesktopComposerPreviewRenderState,
  getChatVideoAttachmentDesktopRenderState,
  getChatVideoAttachmentMobileRenderState,
  getChatImageAttachmentMobileAlertState,
  getChatImageAttachmentMobileRenderState,
  isAllowedMarkdownImageUrl,
  isRenderableVideoUrl,
  MAX_CHAT_IMAGE_ATTACHMENTS,
  MAX_CHAT_IMAGE_FILE_BYTES,
  MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
  parseConversationImageAssetUrl,
  parseConversationVideoAssetUrl,
  type ChatImageAttachmentMobileAlertInput,
  type ChatImageAttachmentMessageInput,
  type ChatImageAttachmentMobileRenderState,
  type ImageMimeTypeSource,
} from "./conversation-media-assets"
import {
  buildPromptLibraryShortcutItems,
  formatPromptLibraryDeletePromptConfirmMessage,
  formatPromptLibraryDeletePromptWebConfirmMessage,
  formatPromptLibraryTaskStartedMessage,
  getPromptLibraryCopyState,
  getPromptLibraryEditorDismissActionState,
  getPromptLibraryEditorInputPaddingVertical,
  getPromptLibraryEditorMobileRenderState,
  getPromptLibraryEditorSaveActionState,
  getPromptLibraryEditorTitle,
  getPromptLibraryMobileShortcutEmptyRenderState,
  getPromptLibraryMobileShortcutItemRenderState,
  getPromptLibraryMobileCopyState,
  getPromptLibraryMobileShortcutRenderState,
  getPromptLibraryMobileSurfaceRenderState,
  getPromptLibrarySaveSuccessMessage,
  getPromptLibraryShortcutPressIntent,
  type PredefinedPromptDraft,
  type PromptLibraryEditorDismissActionState,
  type PromptLibraryEditorSaveActionState,
  type PromptLibraryMobileShortcutEmptyRenderState,
  type PromptLibraryMobileShortcutItemRenderState,
  type PromptLibraryShortcutItem,
  type PromptLibraryShortcutPressIntent,
  type PromptLibrarySkillLike,
  type PromptLibraryMobileSurfaceColorPalette,
  type PromptLibraryTaskLike,
} from "./predefined-prompts"
export {
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
  type PromptLibraryEditorMobileRenderState,
  type PromptLibraryLauncherShortcutSource,
  type PromptLibraryMobileShortcutRenderState,
  type PromptLibraryShortcutItem,
  type PromptLibrarySkillLike,
  type PromptLibraryTaskLike,
} from "./predefined-prompts"
import type { PredefinedPromptSummary } from "./api-types"
export type { Loop, PredefinedPromptSummary, Settings, Skill } from "./api-types"
import type { ToolCall, ToolResult } from "./types"
export type { HandsFreePhase } from "./types"
import { formatVoiceDebugEntry, type VoiceDebugEntry } from "./voice-debug-log"
export type { VoiceDebugEntry, VoiceDebugLog } from "./voice-debug-log"
import { mergeVoiceText } from "./voice-text-utils"
import {
  CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION,
  applyChatDisplayGroupedExpansionInheritance,
  getChatDisplayExpansionState,
  getChatMessageActionCopyState,
  getChatMessageActionAvailabilityRenderState,
  getChatMessageActionLayoutRenderState,
  getChatMessageActionMobileButtonStatesBySlot,
  getChatMessageActionMobileIconColors,
  getChatMessageActionMobileStyleRenderState,
  getChatMessageActionMobileTurnDurationBadgeColors,
  getChatMessageActionMobileTurnDurationBadgeState,
  getChatMessageActionSlotRenderEntries,
  getChatMessageCopyMobileRenderState,
  getChatMessageMobileRenderState,
  getChatMessageSpeechMobileRenderState,
  findLastChatMessageConversationContentIndex,
  hasChatMessageDisplayContent,
  isChatMessageConversationContent,
  isChatMessageLiveStreamingConversationContent,
  sanitizeMessagesForModel,
  setChatDisplayExpansionState,
  shouldShowChatMessageTurnDurationBadge,
  toggleChatDisplayExpansionState,
  type ChatMessageActionAvailabilityRenderState,
  type ChatMessageActionMobileButtonRenderState,
  type ChatMessageActionLayoutState,
  type ChatDisplayExpansionStateMap,
  type ChatMessageConversationContentLike,
  type ChatMessageContentRenderState,
  type ChatMessageActionMobileColors,
  type ChatMessageActionMobileColorPalette,
  type ChatMessageActionSlotRenderEntry,
  type ChatMessageActionSlotRenderMap,
  type ChatMessageCopyMobileRenderState,
  type ChatMessageCopyMobileRenderStateInput,
  type ChatMessageMobileRenderColorPalette,
  type ChatMessageSpeechMobileRenderState,
  type ChatMessageSpeechMobileRenderStateInput,
  type MessageContentForModelLike,
} from "./message-display-utils"
export {
  createChatMessageActionSlotRenderMap,
  getChatMessageActionMobileButtonStatesBySlot,
  getChatMessageActionSlotRenderEntries,
  type ChatMessageCollapsedPreviewMobileActionState,
  type ChatMessageExpansionMobileRenderState,
  type ChatMessageActionSlotRenderEntry,
  type ChatMessageActionSlotRenderMap,
} from "./message-display-utils"
export {
  applyChatDisplayGroupedExpansionInheritance,
  createChatMessageActionSlotRenderState,
  findLastChatMessageConversationContentIndex,
  getChatDisplayExpansionState,
  getChatDisplayGroupedExpansionState,
  getChatMessageActionAvailabilityRenderState,
  getChatMessageActionCopyState,
  getChatMessageActionDesktopSurfaceState,
  getChatMessageContentRenderState,
  getChatMessageCopyActionAccessibilityLabel,
  getChatMessageCopyActionState,
  getChatMessageCopyActionTitle,
  getChatMessageDesktopSurfaceState,
  getChatMessageDisplayTone,
  getChatMessageExpansionActionAccessibilityLabel,
  getChatMessageExpansionActionState,
  getChatMessageExpansionActionTitle,
  getChatMessageExpansionLabel,
  getChatMessageSpeechActionState,
  getChatMessageToneDesktopClassName,
  isChatMessageConversationContent,
  normalizeAssistantResponseForDedupe,
  normalizeMessagePreviewText,
  sanitizeMessageContentForDisplay,
  sanitizeMessageContentForSpeech,
  setChatDisplayExpansionState,
  stripMarkdownMediaPayloads,
} from "./message-display-utils"
import {
  createButtonAccessibilityLabel,
  createChatComposerAccessibilityHint,
  createMicControlAccessibilityHint,
  createMicControlAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
  createVoiceInputLiveRegionAnnouncement,
} from "./accessibility-utils"
import {
  formatToolExecutionCount,
  getToolExecutionCallDisplayState,
  getToolExecutionCompactMobileRenderState,
  getToolExecutionDetailArgumentsState,
  getToolExecutionDetailMobileCollapseControlRenderState,
  getToolExecutionDetailMobileCopyButtonRenderState,
  getToolExecutionDetailMobileExpandControlRenderState,
  getToolExecutionCompactMobileStyleRenderState,
  getToolExecutionDetailMobileEmptyStateRenderState,
  getToolExecutionDetailMobileHeaderRenderState,
  getToolExecutionDetailMobilePendingResultRenderState,
  getToolExecutionDetailMobileSectionHeaderRenderState,
  getToolExecutionDetailMobileStyleRenderState,
  getToolExecutionDetailCopyFailureAlertState,
  getToolExecutionDetailResultState,
  getToolExecutionMobileVisibilityRenderState,
  getToolExecutionResultOnlyFallbackRenderState,
  getToolExecutionSummaryDisplayState,
  type ToolExecutionCompactMobileRenderState,
  type ToolExecutionCompactMobileRenderStateInput,
  type ToolExecutionCompactMobileStyleRenderState,
  type ToolExecutionDetailMobileStyleRenderState,
  type ToolExecutionDetailMobileCopyButtonRenderState,
  type ToolExecutionDetailCopyFailureAlertState,
  type ToolExecutionDetailMobileHeaderRenderState,
  type ToolExecutionDetailMobilePendingResultRenderState,
  type ToolExecutionDetailMobileSectionHeaderRenderState,
  type ToolExecutionResultOnlyFallbackRenderState,
  type ToolExecutionSurfaceColorPalette,
} from "./tool-execution-display"
export {
  formatToolExecutionDuration,
  formatIndexedToolExecutionLabel,
  formatToolExecutionCompactAccessibilityLabel,
  formatToolExecutionCount,
  getToolExecutionCopyAccessibilityLabel,
  formatToolExecutionDetailsAccessibilityName,
  formatToolExecutionHeading,
  formatToolExecutionSectionLabel,
  formatToolExecutionStructuredPayloadValue,
  formatToolExecutionTokens,
  getToolExecutionCallDisplayState,
  getToolExecutionCompactDesktopSurfaceState,
  getToolExecutionDetailCopyState,
  getToolExecutionDetailArgumentsState,
  getToolExecutionDetailDesktopSurfaceState,
  getToolExecutionDetailResultState,
  getToolExecutionDisplayState,
  getToolExecutionPayloadValueType,
  getToolExecutionStatusCopyState,
  getToolExecutionStatusDesktopClassName,
  getToolExecutionStructuredPayloadChildEntries,
  truncateToolExecutionSubagentId,
  type ToolExecutionStructuredPayloadValue,
} from "./tool-execution-display"
export type {
  ToolExecutionCompactMobileRenderState,
  ToolExecutionDetailMobileCollapseControlRenderState,
  ToolExecutionDetailMobileCopyButtonRenderState,
  ToolExecutionDetailMobileEmptyStateRenderState,
  ToolExecutionDetailMobileExpandControlRenderState,
  ToolExecutionDetailMobileHeaderRenderState,
  ToolExecutionDetailMobilePendingResultRenderState,
  ToolExecutionDetailMobileSectionHeaderRenderState,
} from "./tool-execution-display"
import {
  getToolActivityGroupExpansionInheritanceItems,
  getToolActivityGroupMobileRenderState,
  getToolActivityGroupMobileSurfaceRenderState,
  getToolActivityGroupStateKey,
  groupToolActivity,
  type ToolActivityGroup,
  type ToolActivityGroupMobileColorPalette,
  type ToolActivityGroupMobileRenderState,
  type ToolActivityGroupMobileRenderStateInput,
  type ToolActivityGroupMobileSurfaceRenderState,
} from "./tool-activity-grouping"
export {
  TOOL_GROUP_MIN_SIZE,
  getToolActivityGroupDesktopSurfaceState,
  getToolActivityGroupCopyState,
  getToolActivityRunSummary,
  getToolActivityGroupStateKey,
  getToolActivityGroupSummaryState,
} from "./tool-activity-grouping"
export type {
  ToolActivityGroupMobileRenderState,
} from "./tool-activity-grouping"
import {
  getMessageQueuePanelMobileDockRenderState,
  getMessageQueuePanelMobileWrapperRenderState,
  type MessageQueuePanelMobileDockRenderState,
  type MessageQueuePanelMobileDockRenderStateInput,
} from "./message-queue-utils"
export {
  createMessageQueuePanelMobileWrapperStyleSlots,
  createMessageQueuePanelMobileStyleSlots,
  createQueuedMessageActionButtonMobileStyleSlots,
  createQueuedMessageEditMobileStyleSlots,
  createQueuedMessageItemMobileStyleSlots,
  formatQueuedMessageMetaLabel,
  getMessageQueuePanelDesktopRenderState,
  getMessageQueuePanelMobileRenderState,
  getQueuedMessageEditDraftState,
  getQueuedMessageItemDesktopRenderState,
  getQueuedMessageItemMobileRenderState,
  type QueuedMessage,
} from "./message-queue-utils"
import {
  computeTurnDurations,
  createTurnDurationMessages,
  formatTurnDuration,
  type TurnDurationMessage,
} from "./turn-duration"

export type SessionLifecycleState = AgentConversationState
export type SessionAttentionState = "foreground" | "background"
export type SessionPresentationIntent = "active" | "background" | "success" | "warning" | "danger"
export type FollowUpInputMode = "initializing" | "queue" | "send" | "disabled"
export type SidebarStatusIntent = "active" | "background" | "success" | "needs_input" | "blocked" | "response"
export type ChatRuntimeTurnDurationScope = "message" | "total"

export interface ChatRuntimeTurnDurationBadgeStateInput {
  scope: ChatRuntimeTurnDurationScope
  role?: string | null
  durationMs?: number | null
  isLive?: boolean
}

export interface ChatRuntimeTurnDurationBadgeState {
  canShow: boolean
  label: string | null
  title: string | null
  accessibilityRole: "text"
  accessibilityLabel: string | null
  isLive: boolean
}

export interface ChatRuntimeTurnDurationMobileIconStateInput {
  isLive?: boolean
}

export interface ChatRuntimeTurnDurationHeaderMobileBadgeStateInput {
  isLive?: boolean
}

export interface ChatRuntimeTurnDurationMobileIconState {
  isLive: boolean
  name: typeof CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name
  size: number
  colorToken:
    | typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.colorToken
    | typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveColorToken
}

export interface ChatRuntimeTurnDurationHeaderMobileBadgeState {
  numberOfLines: number
  flexDirection: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexDirection
  alignItems: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignItems
  justifyContent: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.justifyContent
  gap: number
  minHeight: number
  maxWidth: number
  paddingHorizontal: number
  borderRadius: number
  backgroundColorToken:
    | typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.backgroundColorToken
    | typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveBackgroundColorToken
  backgroundAlpha: number
  marginHorizontal: number
  flexShrink: number
  opacity: number
  fontFamilyByPlatform: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform
  fontSize: number
  lineHeight: number
  fontWeight: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontWeight
  colorToken:
    | typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.colorToken
    | typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveColorToken
}

export type ChatRuntimeTurnDurationHeaderMobileBadgeColorToken =
  | ChatRuntimeTurnDurationMobileIconState["colorToken"]
  | ChatRuntimeTurnDurationHeaderMobileBadgeState["backgroundColorToken"]
  | ChatRuntimeTurnDurationHeaderMobileBadgeState["colorToken"]

export type ChatRuntimeTurnDurationHeaderMobileBadgeColorPalette =
  Readonly<Record<ChatRuntimeTurnDurationHeaderMobileBadgeColorToken, string>>

export type ChatRuntimeViewportMobileColorToken =
  typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.backgroundColorToken

export type ChatRuntimeViewportMobileColorPalette =
  Readonly<Record<ChatRuntimeViewportMobileColorToken, string>>

export interface ChatRuntimeViewportMobileColors {
  backgroundColor: string
}

export interface ChatRuntimeViewportMobileRenderStateInput {
  colors: ChatRuntimeViewportMobileColorPalette
}

export interface ChatRuntimeViewportMobileRenderState {
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport
  loadingState: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState
  inlineActivity: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity
  colors: ChatRuntimeViewportMobileColors
}

export type ChatRuntimeViewportMobileStyleSpacingToken =
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.paddingHorizontal
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.paddingVertical
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.contentGap

export interface ChatRuntimeViewportMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeViewportMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeViewportMobileStyleSpacingToken, number>>
}

export interface ChatRuntimeViewportMobileStyleSlots {
  keyboardAvoidingContainer: {
    flex: number
    backgroundColor: string
  }
  root: {
    flex: number
  }
  scroll: {
    flex: number
    paddingHorizontal: number
    paddingVertical: number
    backgroundColor: string
  }
  scrollContent: {
    gap: number
  }
}

type ChatRuntimeLoadingStateMobileSurface = typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState
type ChatRuntimeInlineActivityMobileSurface = typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity

export interface ChatRuntimeViewportActivityMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeViewportMobileRenderState, "loadingState" | "inlineActivity">
}

export interface ChatRuntimeViewportActivityMobileStyleSlots {
  loadingState: {
    flex: number
    justifyContent: ChatRuntimeLoadingStateMobileSurface["justifyContent"]
    alignItems: ChatRuntimeLoadingStateMobileSurface["alignItems"]
    paddingVertical: number
  }
  loadingSpinner: {
    width: number
    height: number
  }
  inlineActivityIndicator: {
    flexDirection: ChatRuntimeInlineActivityMobileSurface["flexDirection"]
    alignItems: ChatRuntimeInlineActivityMobileSurface["alignItems"]
  }
  inlineActivitySpinner: {
    width: number
    height: number
  }
}

export interface ChatRuntimeSurfaceChromeMobileRenderStateInput {
  platform?: string | null
  colors: Parameters<typeof getPromptLibraryEditorMobileRenderState>[0]["colors"]
}

export interface ChatRuntimeSurfaceChromeMobileRenderState {
  frame: {
    keyboardAvoidingBehavior: ReturnType<typeof getChatRuntimeViewportMobileKeyboardAvoidingBehavior>
  }
  promptEditor: {
    renderState: ReturnType<typeof getPromptLibraryEditorMobileRenderState>
  }
}

export interface ChatRuntimeDockChromeMobileRenderStateInput {
  scrollToBottomVisible: ChatRuntimeScrollToBottomMobileRenderStateInput["isVisible"]
  voiceOverlayListening: NonNullable<ChatComposerMobileVisibilityRenderStateInput["listening"]>
  voiceOverlayHandsFree: Parameters<typeof getChatComposerVoiceOverlayLabel>[0]["handsFree"]
  voiceOverlayWillCancel: Parameters<typeof getChatComposerVoiceOverlayLabel>[0]["willCancel"]
  queuePanelEnabled?: MessageQueuePanelMobileDockRenderStateInput["isQueueEnabled"]
  queuePanelMessageCount?: MessageQueuePanelMobileDockRenderStateInput["messageCount"]
  connectionState: ChatRuntimeConnectionBannerMobileRenderStateInput["connectionState"]
  lastFailedMessage: ChatRuntimeConnectionBannerMobileRenderStateInput["lastFailedMessage"]
  isResponding: ChatRuntimeConnectionBannerMobileRenderStateInput["isResponding"]
  colors:
    & ChatRuntimeScrollToBottomMobileRenderStateInput["colors"]
    & ChatRuntimeConnectionBannerMobileRenderStateInput["colors"]
}

export interface ChatRuntimeDockChromeMobileRenderState {
  scrollToBottom: ChatRuntimeScrollToBottomMobileRenderState
  voiceOverlay: {
    isVisible: ChatComposerMobileVisibilityRenderState["voiceOverlay"]["isVisible"]
    label: ReturnType<typeof getChatComposerVoiceOverlayLabel>
    transcriptNumberOfLines: ReturnType<typeof getChatComposerMobileSurfaceState>["voiceOverlay"]["transcriptNumberOfLines"]
  }
  queuePanel: MessageQueuePanelMobileDockRenderState
  connectionBanner: ChatRuntimeConnectionBannerMobileRenderState
}

export interface ChatRuntimeLoadingStateMobileRenderStateInput {
  isLoadingMessages?: boolean
  messageCount?: number | null
}

export interface ChatRuntimeLoadingStateMobileRenderState {
  shouldRender: boolean
  accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityRole
  accessibilityLabel: string
  accessibilityState: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityState
  spinnerResizeMode: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerResizeMode
}

export interface ChatRuntimeHomeQuickStartsMobileRenderStateInput {
  isLoadingMessages?: boolean
  messageCount?: number | null
}

export interface ChatRuntimeHomeQuickStartsMobileRenderState {
  shouldRender: boolean
}

export interface ChatRuntimeViewportContentMobileRenderStateInput {
  isLoadingMessages?: boolean
  messageCount?: number | null
}

export interface ChatRuntimeViewportContentMobileRenderState {
  loading: ChatRuntimeLoadingStateMobileRenderState
  homeQuickStarts: ChatRuntimeHomeQuickStartsMobileRenderState
}

export interface ChatRuntimeHomeQuickStartItemsMobileStateInput<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string } = PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string } =
    PromptLibraryTaskLike & { id: string; name: string },
> {
  prompts?: readonly TPrompt[]
  skills?: readonly TSkill[]
  tasks?: readonly TTask[]
  canAddPrompt?: boolean
}

export interface ChatRuntimeDebugPanelMobileRow {
  key: string
  text: string
}

export interface ChatRuntimeDebugPanelsMobileRenderStateInput {
  requestDebugText?: string | null
  voiceDebugEnabled?: boolean
  voiceEntryCount?: number | null
  voiceRows?: readonly ChatRuntimeDebugPanelMobileRow[] | null
}

export interface ChatRuntimeDebugPanelsMobileDisplayStateInput {
  requestDebugText?: string | null
  voiceDebugEnabled?: boolean
  voiceEvents?: readonly VoiceDebugEntry[] | null
}

export interface ChatRuntimeDebugPanelsMobileRenderState {
  requestShouldRender: boolean
  requestRows: ChatRuntimeDebugPanelMobileRow[]
  voiceShouldRender: boolean
  voiceRows: ChatRuntimeDebugPanelMobileRow[]
}

export interface ChatRuntimeViewportChromeMobileRenderStateInput<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string } = PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string } =
    PromptLibraryTaskLike & { id: string; name: string },
> {
  isLoadingMessages?: ChatRuntimeViewportContentMobileRenderStateInput["isLoadingMessages"]
  messageCount?: ChatRuntimeViewportContentMobileRenderStateInput["messageCount"]
  quickStartPrompts?: ChatRuntimeHomeQuickStartItemsMobileStateInput<TPrompt, TSkill, TTask>["prompts"]
  quickStartSkills?: ChatRuntimeHomeQuickStartItemsMobileStateInput<TPrompt, TSkill, TTask>["skills"]
  quickStartTasks?: ChatRuntimeHomeQuickStartItemsMobileStateInput<TPrompt, TSkill, TTask>["tasks"]
  quickStartCanAddPrompt?: ChatRuntimeHomeQuickStartItemsMobileStateInput<TPrompt, TSkill, TTask>["canAddPrompt"]
  visibleMessageCount: ChatRuntimeViewportAffordanceMobileRenderStateInput["visibleMessageCount"]
  totalMessageCount: ChatRuntimeViewportAffordanceMobileRenderStateInput["totalMessageCount"]
  hiddenMessageCount: ChatRuntimeViewportAffordanceMobileRenderStateInput["hiddenMessageCount"]
  messageHistoryLoadIncrement: ChatRuntimeViewportAffordanceMobileRenderStateInput["messageHistoryLoadIncrement"]
  latestStepSummary?: ChatRuntimeViewportAffordanceMobileRenderStateInput["latestStepSummary"]
  requestDebugText?: ChatRuntimeDebugPanelsMobileDisplayStateInput["requestDebugText"]
  voiceDebugEnabled?: ChatRuntimeDebugPanelsMobileDisplayStateInput["voiceDebugEnabled"]
  voiceEvents?: ChatRuntimeDebugPanelsMobileDisplayStateInput["voiceEvents"]
  colors:
    & ChatRuntimeViewportMobileColorPalette
    & ChatRuntimeViewportAffordanceMobileRenderStateInput["colors"]
    & Parameters<typeof getPromptLibraryMobileShortcutRenderState>[0]
}

export interface ChatRuntimeViewportChromeMobileRenderState<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> {
  viewport: ChatRuntimeViewportMobileRenderState
  content: ChatRuntimeViewportContentMobileRenderState
  affordance: ChatRuntimeViewportAffordanceMobileRenderState
  quickStartItems: PromptLibraryShortcutItem<TPrompt, TTask>[]
  shortcutRenderState: ReturnType<typeof getPromptLibraryMobileShortcutRenderState>
  debugPanels: ChatRuntimeDebugPanelsMobileRenderState
}

type ChatRuntimeViewportChromeMobilePropsInputKey =
  | "viewportContentIsLoadingMessages"
  | "viewportContentMessageCount"
  | "loadingSpinnerSource"
  | "quickStartPrompts"
  | "quickStartSkills"
  | "quickStartTasks"
  | "quickStartCanAddPrompt"
  | "isLoadingQuickStartPrompts"
  | "runningPromptTaskId"
  | "onQuickStartPress"
  | "onEditPrompt"
  | "onDeletePrompt"
  | "visibleMessageCount"
  | "totalMessageCount"
  | "hiddenMessageCount"
  | "messageHistoryLoadIncrement"
  | "latestStepSummary"
  | "colors"
  | "onLoadEarlierMessages"
  | "requestDebugText"
  | "voiceDebugEnabled"
  | "voiceEvents"

export interface ChatRuntimeInlineActivityMobileMessageLike {
  role?: string | null
  content?: string | null
  toolCalls?: readonly unknown[] | null
  toolResults?: readonly unknown[] | null
}

export interface ChatRuntimeInlineActivityMobileRenderStateInput {
  isResponding?: boolean
  message?: ChatRuntimeInlineActivityMobileMessageLike | null
}

export interface ChatRuntimeInlineActivityMobileRenderState {
  shouldRender: boolean
  accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityRole
  accessibilityLabel: string
  accessibilityState: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityState
  spinnerResizeMode: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerResizeMode
}

export interface ChatRuntimeInlineActivityMobileIndicatorStateInput<TSpinnerSource>
  extends ChatRuntimeInlineActivityMobileRenderStateInput {
  spinnerSource: TSpinnerSource
}

export type ChatRuntimeInlineActivityMobileIndicatorState<TSpinnerSource> = {
  renderState: ChatRuntimeInlineActivityMobileRenderState
  spinnerSource: TSpinnerSource
} | null

export interface ChatRuntimeTurnDurationHeaderMobileBadgeColors {
  chip: {
    backgroundColor: string
  }
  text: {
    color: string
  }
  icon: {
    color: string
  }
}

export interface ChatRuntimeTurnDurationHeaderMobileRenderStateInput {
  durationMs?: number | null
  isLive?: boolean
  colors: ChatRuntimeTurnDurationHeaderMobileBadgeColorPalette
}

export interface ChatRuntimeTurnDurationHeaderMobileRenderState {
  shouldRender: boolean
  badge: ChatRuntimeTurnDurationHeaderMobileBadgeState
  colors: ChatRuntimeTurnDurationHeaderMobileBadgeColors
  label: string
  accessibilityRole: ChatRuntimeTurnDurationBadgeState["accessibilityRole"]
  accessibilityLabel: string
  isLive: boolean
  icon: {
    name: ChatRuntimeTurnDurationMobileIconState["name"]
    size: ChatRuntimeTurnDurationMobileIconState["size"]
    color: string
  }
}

export interface ChatRuntimeTurnDurationHeaderMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeTurnDurationHeaderMobileRenderState, "badge" | "colors">
  platform?: ChatRuntimeMobileFontPlatform | null
}

export interface ChatRuntimeTurnDurationHeaderMobileStyleSlots {
  chip: {
    flexDirection: ChatRuntimeTurnDurationHeaderMobileBadgeState["flexDirection"]
    alignItems: ChatRuntimeTurnDurationHeaderMobileBadgeState["alignItems"]
    justifyContent: ChatRuntimeTurnDurationHeaderMobileBadgeState["justifyContent"]
    gap: number
    minHeight: number
    maxWidth: number
    paddingHorizontal: number
    borderRadius: number
    backgroundColor: string
    marginHorizontal: number
    flexShrink: number
    opacity: number
  }
  text: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    fontWeight: ChatRuntimeTurnDurationHeaderMobileBadgeState["fontWeight"]
    color: string
  }
}

export interface ChatRuntimeTurnDurationMessageMobileRenderStateInput {
  role?: string | null
  durationMs?: number | null
  isLive?: boolean
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatRuntimeTurnDurationMessageMobileRenderState {
  shouldRender: boolean
  badge: ReturnType<typeof getChatMessageActionMobileTurnDurationBadgeState>
  colors: ChatMessageActionMobileColors
  label: string
  accessibilityRole: ChatRuntimeTurnDurationBadgeState["accessibilityRole"]
  accessibilityLabel: string
  isLive: boolean
  icon: {
    name: ChatRuntimeTurnDurationMobileIconState["name"]
    size: ChatRuntimeTurnDurationMobileIconState["size"]
    color: string
  }
}

export interface ChatRuntimeTurnDurationMessageMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeTurnDurationMessageMobileRenderState, "badge" | "colors">
  platform?: ChatRuntimeMobileFontPlatform | null
}

export interface ChatRuntimeTurnDurationMessageMobileStyleSlots {
  badge: {
    alignSelf: ChatRuntimeTurnDurationMessageMobileRenderState["badge"]["alignSelf"]
    flexDirection: ChatRuntimeTurnDurationMessageMobileRenderState["badge"]["flexDirection"]
    minHeight: number
    marginTop: number
    paddingHorizontal: number
    borderRadius: number
    backgroundColor: string
    alignItems: ChatRuntimeTurnDurationMessageMobileRenderState["badge"]["alignItems"]
    justifyContent: ChatRuntimeTurnDurationMessageMobileRenderState["badge"]["justifyContent"]
    gap: number
    flexShrink: number
    opacity: number
  }
  text: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    fontWeight: ChatRuntimeTurnDurationMessageMobileRenderState["badge"]["fontWeight"]
    color: string
  }
}

export interface ChatRuntimeMessageActionButtonMobileStyleSlotsInput {
  renderState: Pick<ChatMessageActionMobileButtonRenderState, "button" | "colors">
}

export interface ChatRuntimeMessageActionButtonMobileStyleSlots {
  button: {
    alignSelf: ChatMessageActionMobileButtonRenderState["button"]["alignSelf"]
    width: number
    height: number
    marginTop: number
    borderRadius: number
    backgroundColor: string
    alignItems: ChatMessageActionMobileButtonRenderState["button"]["alignItems"]
    justifyContent: ChatMessageActionMobileButtonRenderState["button"]["justifyContent"]
    flexShrink: number
  }
  pressed: {
    opacity: number
  }
  disabled: {
    opacity: number
  }
}

type ChatRuntimeMessageActionMobileStyleRenderState = ReturnType<typeof getChatMessageActionMobileStyleRenderState>

export type ChatRuntimeMessageActionRowMobileStyleSpacingToken =
  ChatRuntimeMessageActionMobileStyleRenderState["row"]["gap"]

export interface ChatRuntimeMessageActionRowMobileStyleSlotInput {
  row: ChatRuntimeMessageActionMobileStyleRenderState["row"]
  spacing: Readonly<Record<ChatRuntimeMessageActionRowMobileStyleSpacingToken, number>>
}

export interface ChatRuntimeMessageActionRowMobileStyleSlot {
  flexDirection: ChatRuntimeMessageActionMobileStyleRenderState["row"]["flexDirection"]
  alignItems: ChatRuntimeMessageActionMobileStyleRenderState["row"]["alignItems"]
  justifyContent: ChatRuntimeMessageActionMobileStyleRenderState["row"]["justifyContent"]
  marginTop: number
  gap: number
}

export interface ChatRuntimeMessageThreadMobileStyleRenderStateInput {
  colors: ChatMessageMobileRenderColorPalette
}

export interface ChatRuntimeMessageThreadMobileStyleRenderState {
  message: ReturnType<typeof getChatMessageMobileRenderState>
  action: ReturnType<typeof getChatMessageActionMobileStyleRenderState>
  turnDuration: {
    standard: ChatRuntimeTurnDurationMessageMobileRenderState
    live: ChatRuntimeTurnDurationMessageMobileRenderState
  }
}

type ChatRuntimeMessageMobileStyleRenderState = ReturnType<typeof getChatMessageMobileRenderState>
type ChatRuntimeMessageMobileSurface = ChatRuntimeMessageMobileStyleRenderState["surface"]
type ChatRuntimeMessageMobileContentLayout = ChatRuntimeMessageMobileStyleRenderState["contentLayout"]

export type ChatRuntimeMessageMobileSpacingToken =
  | ChatRuntimeMessageMobileSurface["paddingHorizontal"]
  | ChatRuntimeMessageMobileSurface["paddingVertical"]
  | ChatRuntimeMessageMobileSurface["marginBottom"]
  | ChatRuntimeMessageMobileContentLayout["row"]["gap"]

export type ChatRuntimeMessageMobileRadiusToken =
  ChatRuntimeMessageMobileSurface["borderRadius"]

export type ChatRuntimeMessageMobileBorderWidthToken =
  ChatRuntimeMessageMobileSurface["borderWidth"]

export interface ChatRuntimeMessageMobileStyleSlotsInput {
  renderState: ChatRuntimeMessageMobileStyleRenderState
  spacing: Readonly<Record<ChatRuntimeMessageMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeMessageMobileRadiusToken, number>>
  borderWidths: Readonly<Record<ChatRuntimeMessageMobileBorderWidthToken, number>>
}

export type ChatRuntimeMessageThreadPresentationMobileColorPalette =
  & ChatRuntimeDelegationCardMobileColorPalette
  & ChatRuntimeDelegationConversationPreviewRoleColorPalette
  & ToolExecutionSurfaceColorPalette

export interface ChatRuntimeMessageThreadPresentationMobileRenderStateInput {
  colors: ChatRuntimeMessageThreadPresentationMobileColorPalette
}

export interface ChatRuntimeMessageThreadPresentationMobileRenderState {
  delegationSurface: ChatRuntimeDelegationCardMobileRenderState["surface"]
  delegationRoleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
  toolPayloadPreviewNumberOfLines: ReturnType<
    typeof getToolExecutionDetailMobileStyleRenderState
  >["payloadPreview"]["numberOfLines"]
  pendingToolResultRenderState: ReturnType<typeof getToolExecutionDetailMobilePendingResultRenderState>
  toolExecutionEmptyStateRenderState: ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState>
}

export type ChatRuntimeThreadChromeMobileStyleColorPalette =
  & ToolExecutionSurfaceColorPalette
  & ToolActivityGroupMobileColorPalette
  & ChatRuntimeToolApprovalMobileSurfaceColorPalette
  & ChatMessageMobileRenderColorPalette

export interface ChatRuntimeThreadChromeMobileStyleRenderStateInput {
  colors: ChatRuntimeThreadChromeMobileStyleColorPalette
}

export interface ChatRuntimeThreadChromeMobileStyleRenderState {
  compactToolExecution: ReturnType<typeof getToolExecutionCompactMobileStyleRenderState>
  toolExecutionDetail: ReturnType<typeof getToolExecutionDetailMobileStyleRenderState>
  toolActivityGroup: ReturnType<typeof getToolActivityGroupMobileSurfaceRenderState>
  toolApproval: ReturnType<typeof getChatRuntimeToolApprovalMobileRenderState>
  messageThread: ReturnType<typeof getChatRuntimeMessageThreadMobileStyleRenderState>
}

type ChatRuntimeToolExecutionCompactMobileSurface = ToolExecutionCompactMobileStyleRenderState["surface"]

export type ChatRuntimeToolExecutionCompactMobileRadiusToken =
  ChatRuntimeToolExecutionCompactMobileSurface["container"]["borderRadius"]

export interface ChatRuntimeToolExecutionCompactMobileStyleSlotsInput {
  renderState: Pick<ToolExecutionCompactMobileStyleRenderState, "surface" | "statusColors">
  radius: Readonly<Record<ChatRuntimeToolExecutionCompactMobileRadiusToken, number>>
  platform?: ChatRuntimeMobileFontPlatform | null
}

export interface ChatRuntimeToolExecutionCompactMobileStyleSlots {
  container: {
    paddingVertical: number
    paddingHorizontal: number
    borderRadius: number
    gap: number
  }
  line: {
    flexDirection: ChatRuntimeToolExecutionCompactMobileSurface["line"]["flexDirection"]
    alignItems: ChatRuntimeToolExecutionCompactMobileSurface["line"]["alignItems"]
    gap: number
    paddingVertical: number
    overflow: ChatRuntimeToolExecutionCompactMobileSurface["line"]["overflow"]
  }
  leadingIcon: {
    width: number
    alignItems: ChatRuntimeToolExecutionCompactMobileSurface["iconCell"]["alignItems"]
    justifyContent: ChatRuntimeToolExecutionCompactMobileSurface["iconCell"]["justifyContent"]
    flexShrink: number
  }
  pressed: {
    opacity: number
  }
  name: {
    fontFamily: string
    fontSize: number
    fontWeight: ChatRuntimeToolExecutionCompactMobileSurface["name"]["fontWeight"]
    flexShrink: number
    minWidth: number
    color: string
  }
  namePending: {
    color: string
  }
  nameSuccess: {
    color: string
  }
  nameError: {
    color: string
  }
  statusIndicator: {
    width: number
    alignItems: ChatRuntimeToolExecutionCompactMobileSurface["iconCell"]["alignItems"]
    justifyContent: ChatRuntimeToolExecutionCompactMobileSurface["iconCell"]["justifyContent"]
    flexShrink: number
  }
  toggleIcon: {
    width: number
    alignItems: ChatRuntimeToolExecutionCompactMobileSurface["iconCell"]["alignItems"]
    justifyContent: ChatRuntimeToolExecutionCompactMobileSurface["iconCell"]["justifyContent"]
    flexShrink: number
  }
  statusPending: {
    color: string
  }
  statusSuccess: {
    color: string
  }
  statusError: {
    color: string
  }
}

type ChatRuntimeToolExecutionDetailMobileSurface = ToolExecutionDetailMobileStyleRenderState["surface"]

export type ChatRuntimeToolExecutionDetailMobileSpacingToken =
  | ChatRuntimeToolExecutionDetailMobileSurface["blockSection"]["paddingHorizontal"]
  | ChatRuntimeToolExecutionDetailMobileSurface["section"]["marginBottom"]
  | ChatRuntimeToolExecutionDetailMobileSurface["section"]["paddingBottom"]
  | ChatRuntimeToolExecutionDetailMobileSurface["header"]["paddingVertical"]
  | ChatRuntimeToolExecutionDetailMobileSurface["header"]["marginBottom"]

export type ChatRuntimeToolExecutionDetailMobileRadiusToken =
  | ChatRuntimeToolExecutionDetailMobileSurface["card"]["borderRadius"]
  | ChatRuntimeToolExecutionDetailMobileSurface["payloadPreview"]["borderRadius"]
  | ChatRuntimeToolExecutionDetailMobileSurface["copyButton"]["borderRadius"]
  | ChatRuntimeToolExecutionDetailMobileSurface["scroll"]["borderRadius"]
  | ChatRuntimeToolExecutionDetailMobileSurface["codeBlock"]["borderRadius"]
  | ChatRuntimeToolExecutionDetailMobileSurface["badge"]["borderRadius"]

export interface ChatRuntimeToolExecutionDetailMobileStyleSlotsInput {
  renderState: Pick<ToolExecutionDetailMobileStyleRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeToolExecutionDetailMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeToolExecutionDetailMobileRadiusToken, number>>
  platform?: ChatRuntimeMobileFontPlatform | null
}

type ChatRuntimeToolActivityGroupMobileSurface = ToolActivityGroupMobileSurfaceRenderState["surface"]

export type ChatRuntimeToolActivityGroupMobileSpacingToken =
  | ChatRuntimeToolActivityGroupMobileSurface["collapsed"]["paddingHorizontal"]
  | ChatRuntimeToolActivityGroupMobileSurface["footerButton"]["paddingHorizontal"]

export type ChatRuntimeToolActivityGroupMobileRadiusToken =
  | ChatRuntimeToolActivityGroupMobileSurface["collapsed"]["borderRadius"]
  | ChatRuntimeToolActivityGroupMobileSurface["countBadge"]["borderRadius"]
  | ChatRuntimeToolActivityGroupMobileSurface["footerButton"]["borderRadius"]

export interface ChatRuntimeToolActivityGroupMobileStyleSlotsInput {
  renderState: Pick<ToolActivityGroupMobileSurfaceRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeToolActivityGroupMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeToolActivityGroupMobileRadiusToken, number>>
  platform?: ChatRuntimeMobileFontPlatform | null
}

export interface ChatRuntimeToolActivityGroupMobileStyleSlots {
  collapsed: {
    paddingVertical: number
    paddingHorizontal: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    borderLeftWidth: number
    borderLeftColor: string
    backgroundColor: string
    marginBottom: number
  }
  pressed: {
    opacity: number
  }
  headerRow: {
    flexDirection: ChatRuntimeToolActivityGroupMobileSurface["headerRow"]["flexDirection"]
    alignItems: ChatRuntimeToolActivityGroupMobileSurface["headerRow"]["alignItems"]
    gap: number
    overflow: ChatRuntimeToolActivityGroupMobileSurface["headerRow"]["overflow"]
  }
  countBadge: {
    minWidth: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    alignItems: ChatRuntimeToolActivityGroupMobileSurface["countBadge"]["alignItems"]
    justifyContent: ChatRuntimeToolActivityGroupMobileSurface["countBadge"]["justifyContent"]
    backgroundColor: string
  }
  countBadgeText: {
    fontFamily: string
    fontSize: number
    fontWeight: ChatRuntimeToolActivityGroupMobileSurface["countBadge"]["fontWeight"]
    color: string
  }
  previewLine: {
    fontFamily: string
    fontSize: number
    color: string
    flexShrink: number
    minWidth: number
  }
  footerButton: {
    alignSelf: ChatRuntimeToolActivityGroupMobileSurface["footerButton"]["alignSelf"]
    flexDirection: ChatRuntimeToolActivityGroupMobileSurface["footerButton"]["flexDirection"]
    alignItems: ChatRuntimeToolActivityGroupMobileSurface["footerButton"]["alignItems"]
    gap: number
    marginTop: number
    marginBottom: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
  }
  footerText: {
    fontSize: number
    fontWeight: ChatRuntimeToolActivityGroupMobileSurface["footerText"]["fontWeight"]
    color: string
  }
}

export type ChatRuntimeConversationMessageMobileRenderStateInput =
  Omit<Parameters<typeof getChatMessageMobileRenderState>[0], "hasErrors"> & {
    toolResults: Array<ToolResult | null | undefined>
  }

export type ChatRuntimeConversationMessageMobileRenderState =
  ReturnType<typeof getChatMessageMobileRenderState>

export interface ChatRuntimeConversationMessageActionsMobileRenderStateInput {
  message: Pick<ChatRuntimeConversationMessageMobileRenderState, "content" | "expansion">
  turnDuration: ChatRuntimeTurnDurationMessageMobileRenderStateInput
  speech: Omit<ChatMessageSpeechMobileRenderStateInput, "isVisible">
  branch: ChatRuntimeBranchMobileRenderStateInput
  copy: ChatMessageCopyMobileRenderStateInput
}

export interface ChatRuntimeConversationMessageActionsMobileRenderState {
  turnDuration: ChatRuntimeTurnDurationMessageMobileRenderState
  speech: ChatMessageSpeechMobileRenderState
  branch: ChatRuntimeBranchMobileRenderState
  copy: ChatMessageCopyMobileRenderState
  expansion: ChatRuntimeConversationMessageMobileRenderState["expansion"]
  availability: ChatMessageActionAvailabilityRenderState
  layout: ChatMessageActionLayoutState
}

export interface ChatRuntimeConversationMessageRenderContextMobileStateInput {
  message: ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike
  messageIndex: number
  isResponding: boolean
  lastConversationContentMessageIndex: number
  expandedMessages: ChatDisplayExpansionStateMap<number>
  resultOnlyToolLabel: string
  colors: ChatRuntimeConversationMessageMobileRenderStateInput["colors"]
}

export interface ChatRuntimeConversationMessageRenderContextMobileState {
  visibleMessageContent: string
  renderedToolEntries: ChatMessageDisplayToolEntry[]
  displayToolCallCount: number
  isExpanded: boolean
  isLiveStreamingAssistantMessage: boolean
  messageRenderState: ChatRuntimeConversationMessageMobileRenderState
  shouldRenderSurface: boolean
}

export type ChatRuntimeConversationThreadKey = string | number

export type ChatRuntimeConversationToolActivityGroupRenderStateInput =
  Omit<ToolActivityGroupMobileRenderStateInput, "group">
  & {
    group?: ToolActivityGroup | null
  }

export type ChatRuntimeConversationToolActivityGroupRenderState =
  ToolActivityGroupMobileRenderState | null

export interface ChatRuntimeConversationToolActivityGroupThreadStateInput {
  group?: ToolActivityGroup | null
  groupRenderState?: ToolActivityGroupMobileRenderState | null
  itemKey: ChatRuntimeConversationThreadKey
  onToggleGroup: (group: ToolActivityGroup) => void
}

export interface ChatRuntimeConversationToolActivityGroupThreadState {
  groupOnlyThreadKey: ChatRuntimeConversationThreadKey
  shouldRenderGroupOnlyThread: boolean
  onToggleGroup?: () => void
}

export interface ChatRuntimeConversationRuntimeThreadStateInput<TBody> {
  itemKey: ChatRuntimeConversationThreadKey
  groupRenderState: ToolActivityGroupMobileRenderState | null
  groupThreadState: ChatRuntimeConversationToolActivityGroupThreadState
  body: TBody | null
}

export interface ChatRuntimeConversationRuntimeThreadState<TBody> {
  threadKey: ChatRuntimeConversationThreadKey
  groupRenderState: ToolActivityGroupMobileRenderState | null
  onToggleGroup?: () => void
  body: TBody | null
}

export interface ChatRuntimeConversationRenderableRuntimeThreadState<TBody>
  extends ChatRuntimeConversationRuntimeThreadState<TBody> {
  shouldRenderThread: boolean
}

export type ChatRuntimeConversationToolActivityGroupRuntimeThreadStateInput =
  Omit<ChatRuntimeConversationRuntimeThreadStateInput<null>, "body">

export type ChatRuntimeConversationToolActivityGroupRuntimeThreadState =
  ChatRuntimeConversationRenderableRuntimeThreadState<null>

export type ChatRuntimeConversationToolActivityGroupThreadRenderStateInput =
  ChatRuntimeConversationToolActivityGroupRenderStateInput
  & Pick<ChatRuntimeConversationToolActivityGroupThreadStateInput, "itemKey" | "onToggleGroup">

export interface ChatRuntimeConversationToolActivityGroupThreadRenderState {
  groupRenderState: ChatRuntimeConversationToolActivityGroupRenderState
  groupThreadState: ChatRuntimeConversationToolActivityGroupThreadState
  groupOnlyThreadState: ChatRuntimeConversationToolActivityGroupRuntimeThreadState
}

export type ChatRuntimeConversationThreadBodyMobileDisplayMode =
  | "retryStatus"
  | "delegationCard"
  | "toolApproval"
  | "inlineActivity"
  | "conversation"

export interface ChatRuntimeConversationThreadVisibilityInput<
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
> {
  renderContext: Pick<ChatRuntimeConversationMessageRenderContextMobileState, "shouldRenderSurface">
  body: TBody
}

export interface ChatRuntimeConversationMessageRuntimeThreadStateInput<
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
> extends ChatRuntimeConversationToolActivityGroupRuntimeThreadStateInput {
  renderContext: ChatRuntimeConversationThreadVisibilityInput<TBody>["renderContext"]
  body: TBody
}

export type ChatRuntimeConversationMessageRuntimeThreadState<
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
> =
  ChatRuntimeConversationRenderableRuntimeThreadState<TBody>

export type ChatRuntimeConversationMessageThreadMobileBodyInput =
  Pick<
    ChatRuntimeConversationMessageRenderContextMobileStateInput,
    "message" | "messageIndex" | "isResponding" | "colors"
  >

export interface ChatRuntimeConversationMessageThreadMobileStateInput<
  TBodyInput extends ChatRuntimeConversationMessageThreadMobileBodyInput,
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
> extends Pick<
    ChatRuntimeConversationMessageRuntimeThreadStateInput<TBody>,
    "itemKey" | "groupRenderState" | "groupThreadState"
  >,
  Pick<
    ChatRuntimeConversationMessageRenderContextMobileStateInput,
    "lastConversationContentMessageIndex" | "expandedMessages" | "resultOnlyToolLabel"
  > {
  bodyInput: TBodyInput
  createBodyState: (
    input: TBodyInput & { renderContext: ChatRuntimeConversationMessageRenderContextMobileState }
  ) => TBody
}

export interface ChatRuntimeConversationItemThreadMobileStateInput<
  TMessageThreadInput,
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
> extends ChatRuntimeConversationToolActivityGroupThreadRenderStateInput {
  messageThreadInput: TMessageThreadInput
  createMessageThreadState: (
    input: TMessageThreadInput
      & Pick<
        ChatRuntimeConversationMessageRuntimeThreadStateInput<TBody>,
        "itemKey" | "groupRenderState" | "groupThreadState"
      >
  ) => ChatRuntimeConversationRenderableRuntimeThreadState<TBody | null>
}

export interface ChatRuntimeConversationThreadListMobileItemStateInput<TMessage> {
  message: TMessage
  visibleIndex: number
  messageIndex: number
  itemIndex: number
  itemKey: ChatRuntimeConversationThreadKey
  group?: ToolActivityGroup
  isSpeaking: boolean
  isCopied: boolean
  lastConversationContentMessageIndex: number
}

export interface ChatRuntimeConversationThreadListMobileStateInput<
  TMessage extends ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike,
  TThread,
> {
  allMessages: readonly TMessage[]
  messages: readonly TMessage[]
  firstMessageIndex: number
  groupByIndex: ReadonlyMap<number, ToolActivityGroup>
  speakingMessageIndex: number | null
  copiedMessageIndex: number | null
  createThreadState: (input: ChatRuntimeConversationThreadListMobileItemStateInput<TMessage>) => TThread
}

export interface ChatRuntimeConversationRuntimeThreadListMobileItemStateInput<
  TMessage extends ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike,
> extends ChatRuntimeConversationThreadListMobileItemStateInput<TMessage> {
  presentation: ChatRuntimeMessageThreadPresentationMobileRenderState
  resultOnlyToolLabel: string
}

export interface ChatRuntimeConversationRuntimeThreadListMobileStateInput<
  TMessage extends ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike,
  TThread,
> extends Omit<
    ChatRuntimeConversationThreadListMobileStateInput<TMessage, TThread>,
    "allMessages" | "messages" | "firstMessageIndex" | "createThreadState"
  >,
  ChatRuntimeMessageHistoryWindowMobileDisplayStateInput<TMessage>,
  ChatRuntimeMessageThreadPresentationMobileRenderStateInput {
  resultOnlyToolLabel?: string
  createThreadState: (
    input: ChatRuntimeConversationRuntimeThreadListMobileItemStateInput<TMessage>
  ) => TThread
}

export interface ChatRuntimeConversationRuntimeThreadListMobileState<TThread> {
  threadStates: TThread[]
  visibleMessageCount: number
  totalMessageCount: number
  hiddenMessageCount: number
}

export type ChatRuntimeConversationContentMobileRenderState = Pick<
  ChatMessageContentRenderState,
  "shouldRenderExpandedContent" | "shouldRenderCollapsedTextPreview"
>

export type ChatRuntimeConversationContentMobileDisplayMode =
  | "expanded"
  | "collapsed"
  | "hidden"

export type ChatRuntimeConversationSurfaceToneMobileStyleSlot =
  ChatRuntimeConversationMessageMobileRenderState["toneStyleSlot"]

export type ChatRuntimeConversationCollapsedPreviewMobileRenderState =
  ChatRuntimeConversationMessageMobileRenderState["collapsedPreview"]

export type ChatRuntimeConversationCollapsedPreviewMobileActionState =
  ChatRuntimeConversationMessageMobileRenderState["collapsedPreviewAction"]

export interface ChatRuntimeConversationContentMobileStateInput<
  TColors extends ChatRuntimeStreamingContentMobileRenderStateInput["colors"],
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
> {
  messageIndex: number
  visibleMessageContent: string
  isStreaming: boolean
  contentState: ChatRuntimeConversationContentMobileRenderState
  collapsedPreview: ChatRuntimeConversationCollapsedPreviewMobileRenderState
  collapsedPreviewAction: ChatRuntimeConversationCollapsedPreviewMobileActionState
  colors: TColors
  assetBaseUrl?: TAssetBaseUrl
  assetAuthToken?: TAssetAuthToken
  spinnerSource: TSpinnerSource
  onToggleMessageExpansion: (messageIndex: number) => void
}

export interface ChatRuntimeConversationContentMobileState<
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
> {
  contentState: ChatRuntimeConversationContentMobileRenderState
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode
  expanded: {
    streamingRenderState: ChatRuntimeStreamingContentMobileRenderState
    markdownContent: string
    assetBaseUrl?: TAssetBaseUrl
    assetAuthToken?: TAssetAuthToken
    spinnerSource: TSpinnerSource
  }
  collapsed: {
    renderState: ChatRuntimeConversationCollapsedPreviewMobileRenderState
    actionState: ChatRuntimeConversationCollapsedPreviewMobileActionState
    onPress?: () => void
  }
}

export type ChatRuntimeConversationExpandedContentMobileProps<
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
> =
  ChatRuntimeConversationContentMobileState<
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken
  >["expanded"]

export interface ChatRuntimeConversationCollapsedPreviewMobileProps<
  TOnPress = () => void,
> {
  renderState: ChatRuntimeConversationCollapsedPreviewMobileRenderState
  actionState: ChatRuntimeConversationCollapsedPreviewMobileActionState
  onPress?: TOnPress
}

export interface ChatRuntimeConversationRetryStatusMobileStateInput<
  TRetryInfo extends ChatRuntimeRetryInfoLike | null | undefined =
    ChatRuntimeRetryInfoLike | null | undefined,
> {
  message: {
    variant?: string
    retryInfo?: TRetryInfo
  }
  colors: ChatRuntimeRetryStatusMobileRenderStateInput["colors"]
}

export interface ChatRuntimeConversationRetryStatusMobileState {
  renderState: ChatRuntimeRetryStatusMobileRenderState | null
}

export interface ChatRuntimeConversationRetryStatusMobileProps {
  renderState: ChatRuntimeRetryStatusMobileRenderState
}

export interface ChatRuntimeConversationToolApprovalMobileStateInput {
  message: {
    variant?: string
    toolApproval?: ChatRuntimeToolApprovalCardMobileRenderStateInput["toolApproval"]
  }
  expandedToolApprovals: ChatRuntimeToolApprovalCardMobileRenderStateInput["expandedToolApprovals"]
  pendingApprovalResponseId?: ChatRuntimeToolApprovalCardMobileRenderStateInput["pendingApprovalResponseId"]
  colors: ChatRuntimeToolApprovalCardMobileRenderStateInput["colors"]
  onToggleArguments: (approvalId: string) => void
  onRespondToToolApproval: (approvalId: string, approved: boolean) => void | Promise<void>
}

export interface ChatRuntimeConversationToolApprovalMobileCardState
  extends ChatRuntimeToolApprovalCardMobileRenderState {
  onToggleArguments: () => void
  onDeny: () => void
  onApprove: () => void
}

export interface ChatRuntimeConversationToolApprovalMobileState {
  cardState: ChatRuntimeConversationToolApprovalMobileCardState | null
}

export interface ChatRuntimeConversationToolApprovalMobileProps {
  renderState: ChatRuntimeToolApprovalMobileRenderState
  toolName: string
  argumentsPreview: string
  argumentsContent: string
  onToggleArguments: () => void
  onDeny: () => void
  onApprove: () => void
}

export interface ChatRuntimeToolApprovalMobilePropsPartsStyleSlots {
  card: unknown
  header: unknown
  content: unknown
  contentDisabled: unknown
  title: unknown
  toolRow: unknown
  toolLabel: unknown
  toolName: unknown
  argumentsPreview: unknown
  argumentsToggle: unknown
  argumentsTogglePressed: unknown
  argumentsToggleText: unknown
  argumentsScroll: unknown
  argumentsFull: unknown
  actions: unknown
  button: unknown
  buttonDisabled: unknown
  approveButton: unknown
  approveButtonText: unknown
  denyButton: unknown
  denyButtonText: unknown
}

export interface ChatRuntimeToolApprovalMobilePropsPartsInput<
  TOnToggleArguments = unknown,
  TOnDeny = unknown,
  TOnApprove = unknown,
  TStyles extends ChatRuntimeToolApprovalMobilePropsPartsStyleSlots =
    ChatRuntimeToolApprovalMobilePropsPartsStyleSlots,
> {
  renderState: ChatRuntimeToolApprovalMobileRenderState
  toolName: string
  argumentsPreview: string
  argumentsContent: string
  onToggleArguments: TOnToggleArguments
  onDeny: TOnDeny
  onApprove: TOnApprove
  styles: TStyles
}

export interface ChatRuntimeToolApprovalMobilePropsParts<
  TOnToggleArguments = unknown,
  TOnDeny = unknown,
  TOnApprove = unknown,
  TStyles extends ChatRuntimeToolApprovalMobilePropsPartsStyleSlots =
    ChatRuntimeToolApprovalMobilePropsPartsStyleSlots,
> {
  card: {
    style: TStyles["card"]
  }
  header: {
    style: TStyles["header"]
  }
  headerIcon: ChatRuntimeToolApprovalMobileRenderState["headerIcon"]
  title: {
    style: TStyles["title"]
    numberOfLines: ChatRuntimeToolApprovalMobileRenderState["surface"]["title"]["numberOfLines"]
    text: string
  }
  headerSpinner: ChatRuntimeToolApprovalMobileRenderState["spinner"] | null
  content: {
    style: Array<TStyles["content"] | TStyles["contentDisabled"] | false>
  }
  toolRow: {
    style: TStyles["toolRow"]
  }
  toolLabel: {
    style: TStyles["toolLabel"]
    text: string
  }
  toolName: {
    style: TStyles["toolName"]
    numberOfLines: ChatRuntimeToolApprovalMobileRenderState["surface"]["toolName"]["numberOfLines"]
    text: string
  }
  argumentsPreview: {
    style: TStyles["argumentsPreview"]
    numberOfLines: ChatRuntimeToolApprovalMobileRenderState["surface"]["argumentsPreview"]["numberOfLines"]
    text: string
  } | null
  argumentsToggle: {
    onPress: TOnToggleArguments
    disabled: boolean
    accessibilityRole: ChatRuntimeToolApprovalMobileRenderState["argumentsToggle"]["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: ChatRuntimeToolApprovalMobileRenderState["argumentsToggle"]["accessibilityState"]
    ariaExpanded: boolean
    style: (state: { pressed: boolean }) => Array<
      | TStyles["argumentsToggle"]
      | TStyles["argumentsTogglePressed"]
      | TStyles["buttonDisabled"]
      | false
    >
    icon: ChatRuntimeToolApprovalMobileRenderState["argumentsToggle"]["icon"]
    label: {
      style: TStyles["argumentsToggleText"]
      text: string
    }
  }
  fullArguments: {
    scroll: {
      style: TStyles["argumentsScroll"]
      nestedScrollEnabled: true
    }
    text: {
      style: TStyles["argumentsFull"]
      text: string
    }
  } | null
  actions: {
    style: TStyles["actions"]
  }
  denyButton: {
    style: Array<TStyles["button"] | TStyles["denyButton"] | TStyles["buttonDisabled"] | false>
    onPress: TOnDeny
    disabled: boolean
    accessibilityRole: ChatRuntimeToolApprovalMobileRenderState["denyButton"]["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: ChatRuntimeToolApprovalMobileRenderState["denyButton"]["accessibilityState"]
    icon: ChatRuntimeToolApprovalMobileRenderState["denyButton"]["icon"]
    label: {
      style: TStyles["denyButtonText"]
      text: string
    }
  }
  approveButton: {
    style: Array<TStyles["button"] | TStyles["approveButton"] | TStyles["buttonDisabled"] | false>
    onPress: TOnApprove
    disabled: boolean
    accessibilityRole: ChatRuntimeToolApprovalMobileRenderState["approveButton"]["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: ChatRuntimeToolApprovalMobileRenderState["approveButton"]["accessibilityState"]
    icon: ChatRuntimeToolApprovalMobileRenderState["approveButton"]["icon"] | null
    spinner: ChatRuntimeToolApprovalMobileRenderState["approveButton"]["spinner"] | null
    label: {
      style: TStyles["approveButtonText"]
      text: string
    }
  }
}

export type ChatRuntimeConversationDelegationExpansionState = ChatDisplayExpansionStateMap<string>

export type ChatRuntimeConversationDelegationExpansionSetter = (
  updater: (
    current: ChatRuntimeConversationDelegationExpansionState,
  ) => ChatRuntimeConversationDelegationExpansionState,
) => void

export type ChatRuntimeConversationDelegationCardMobileColors =
  ChatRuntimeDelegationCardMobileRenderStateInput["colors"]
  & ChatRuntimeDelegationStatusMobileRenderStateInput["colors"]

export interface ChatRuntimeConversationDelegationCardMobileStateInput<
  TDelegation = unknown,
> {
  message: {
    variant?: string
    delegation?: TDelegation
  }
  surface: ChatRuntimeDelegationCardMobileRenderState["surface"]
  toolEntries: readonly ChatMessageDisplayToolEntry[]
  displayToolCallCount: number
  expandedDelegationConversationPreviews: ChatRuntimeConversationDelegationExpansionState
  expandedDelegationToolPreviews: ChatRuntimeConversationDelegationExpansionState
  roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
  colors: ChatRuntimeConversationDelegationCardMobileColors
  setExpandedDelegationConversationPreviews: ChatRuntimeConversationDelegationExpansionSetter
  setExpandedDelegationToolPreviews: ChatRuntimeConversationDelegationExpansionSetter
}

export interface ChatRuntimeConversationDelegationCardMobileState<
  TDelegation = unknown,
> {
  isDelegation: boolean
  surface: ChatRuntimeDelegationCardMobileRenderState["surface"]
  delegation?: TDelegation
  toolEntries: readonly ChatMessageDisplayToolEntry[]
  displayToolCallCount: number
  expandedDelegationConversationPreviews: ChatRuntimeConversationDelegationExpansionState
  expandedDelegationToolPreviews: ChatRuntimeConversationDelegationExpansionState
  roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
  colors: ChatRuntimeConversationDelegationCardMobileColors
  onShowAllConversationPreview: (runId: string) => void
  onShowAllToolPreview: (runId: string) => void
}

export interface ChatRuntimeDelegationCardMobilePresentationStateInput {
  isDelegation: boolean
  surface: ChatRuntimeDelegationCardMobileRenderState["surface"]
  delegation?: ACPDelegationProgress | null
  toolEntries: readonly ChatMessageDisplayToolEntry[]
  displayToolCallCount: number
  expandedDelegationConversationPreviews: ChatRuntimeConversationDelegationExpansionState
  expandedDelegationToolPreviews: ChatRuntimeConversationDelegationExpansionState
  roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
  colors: ChatRuntimeConversationDelegationCardMobileColors
}

export interface ChatRuntimeDelegationCardMobilePresentationState {
  runId: string
  surface: ChatRuntimeDelegationCardMobileRenderState["surface"]
  agentName: string
  presentation: AgentDelegationPresentation
  accessibilityLabel: string
  messageCountLabel: string | null
  statusStyles: ChatSessionStatusMobileStyleState
  conversationPreview: {
    rows: AgentDelegationConversationPreviewRow[]
    roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
    hiddenCount: number
    moreAction: ChatRuntimeDelegationMorePreviewActionState
  }
  toolPreview: {
    shouldRender: boolean
    label: string
    rows: ChatRuntimeToolExecutionCompactPreviewMobileRowState[]
    hiddenCount: number
    moreAction: ChatRuntimeDelegationMorePreviewActionState
  }
}

export type ChatRuntimeDelegationCardMobileProps =
  Omit<ChatRuntimeDelegationCardMobilePresentationState, "conversationPreview" | "toolPreview">
  & {
    conversationPreview: ChatRuntimeDelegationCardMobilePresentationState["conversationPreview"] & {
      onShowAll?: () => void
    }
    toolPreview: ChatRuntimeDelegationCardMobilePresentationState["toolPreview"] & {
      onShowAll?: () => void
    }
  }

export interface ChatRuntimeDelegationCardMobilePropsPartsStyleSlots {
  card: unknown
  header: unknown
  title: unknown
  statusBadge: unknown
  statusText: unknown
  liveText: unknown
  subtitle: unknown
  metaRow: unknown
  metaText: unknown
  conversationPreview: unknown
  conversationPreviewLine: unknown
  conversationPreviewRole: unknown
  conversationPreviewContent: unknown
  conversationPreviewTimestamp: unknown
  conversationPreviewMoreButton: unknown
  conversationPreviewMoreButtonPressed: unknown
  conversationPreviewMore: unknown
  toolPreview: unknown
  toolPreviewLabel: unknown
  toolPreviewLine: unknown
  toolPreviewStatusIcon: unknown
  toolPreviewName: unknown
  toolPreviewNamePending: unknown
  toolPreviewNameSuccess: unknown
  toolPreviewNameError: unknown
  toolPreviewMoreButton: unknown
  toolPreviewMoreButtonPressed: unknown
  toolPreviewMore: unknown
}

export interface ChatRuntimeDelegationCardMobilePropsPartsInput<
  TConversationPreviewOnShowAll = unknown,
  TToolPreviewOnShowAll = unknown,
  TStyles extends ChatRuntimeDelegationCardMobilePropsPartsStyleSlots =
    ChatRuntimeDelegationCardMobilePropsPartsStyleSlots,
> extends Omit<ChatRuntimeDelegationCardMobilePresentationState, "conversationPreview" | "toolPreview" | "runId"> {
  conversationPreview: ChatRuntimeDelegationCardMobilePresentationState["conversationPreview"] & {
    onShowAll?: TConversationPreviewOnShowAll
  }
  toolPreview: ChatRuntimeDelegationCardMobilePresentationState["toolPreview"] & {
    onShowAll?: TToolPreviewOnShowAll
  }
  styles: TStyles
}

export interface ChatRuntimeDelegationCardMobilePropsParts<
  TConversationPreviewOnShowAll = unknown,
  TToolPreviewOnShowAll = unknown,
  TStyles extends ChatRuntimeDelegationCardMobilePropsPartsStyleSlots =
    ChatRuntimeDelegationCardMobilePropsPartsStyleSlots,
> {
  card: {
    accessible: true
    accessibilityRole: ChatRuntimeDelegationCardMobilePresentationState["surface"]["accessibilityRole"]
    accessibilityLabel: string
    style: TStyles["card"]
  }
  header: {
    style: TStyles["header"]
  }
  title: {
    style: TStyles["title"]
    numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["titleNumberOfLines"]
    text: string
  }
  statusBadge: {
    style: Array<TStyles["statusBadge"] | ChatSessionStatusMobileStyleState["chip"]>
  }
  statusText: {
    style: Array<TStyles["statusText"] | ChatSessionStatusMobileStyleState["text"]>
    numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["statusNumberOfLines"]
    text: string
  }
  liveText: {
    style: TStyles["liveText"]
    text: string
  } | null
  subtitle: {
    style: TStyles["subtitle"]
    numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["subtitleNumberOfLines"]
    text: string
  } | null
  meta: {
    style: TStyles["metaRow"]
    items: Array<{
      key: string
      text: string
      style: TStyles["metaText"]
      numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["metaNumberOfLines"]
    }>
  }
  conversationPreview: {
    style: TStyles["conversationPreview"]
    rows: Array<{
      key: string
      line: {
        style: TStyles["conversationPreviewLine"]
      }
      role: {
        style: Array<
          | TStyles["conversationPreviewRole"]
          | ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots[
            keyof ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
          ]
        >
        numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["conversationPreviewRoleNumberOfLines"]
        ellipsizeMode: ChatRuntimeDelegationCardMobilePresentationState["surface"]["conversationPreviewRoleEllipsizeMode"]
        text: string
      }
      content: {
        style: TStyles["conversationPreviewContent"]
        numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["conversationPreviewContentNumberOfLines"]
        ellipsizeMode: ChatRuntimeDelegationCardMobilePresentationState["surface"]["conversationPreviewContentEllipsizeMode"]
        text: string
      }
      timestamp: {
        style: TStyles["conversationPreviewTimestamp"]
        numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["conversationPreviewTimestampNumberOfLines"]
        text: string
      } | null
    }>
    moreAction: {
      button: {
        onPress: TConversationPreviewOnShowAll
        accessibilityRole: ChatRuntimeDelegationMorePreviewActionState["accessibilityRole"]
        accessibilityLabel: string
        style: (state: { pressed: boolean }) => Array<
          | TStyles["conversationPreviewMoreButton"]
          | TStyles["conversationPreviewMoreButtonPressed"]
          | false
        >
      }
      label: {
        style: TStyles["conversationPreviewMore"]
        numberOfLines: ChatRuntimeDelegationMorePreviewActionState["numberOfLines"]
        text: string
      }
    } | null
  } | null
  toolPreview: {
    style: TStyles["toolPreview"]
    label: {
      style: TStyles["toolPreviewLabel"]
      numberOfLines: ChatRuntimeDelegationCardMobilePresentationState["surface"]["toolPreviewLabelNumberOfLines"]
      text: string
    }
    rows: Array<{
      key: string
      line: {
        style: TStyles["toolPreviewLine"]
        accessibilityLabel: string
      }
      statusIcon: {
        style: TStyles["toolPreviewStatusIcon"]
        accessibilityElementsHidden: true
        importantForAccessibility: "no-hide-descendants"
        spinner: ChatRuntimeToolExecutionCompactPreviewMobileRowState["renderState"]["statusIndicator"]["spinner"] | null
        icon: ChatRuntimeToolExecutionCompactPreviewMobileRowState["renderState"]["statusIndicator"]["icon"] | null
      }
      name: {
        style: Array<
          | TStyles["toolPreviewName"]
          | TStyles["toolPreviewNamePending"]
          | TStyles["toolPreviewNameSuccess"]
          | TStyles["toolPreviewNameError"]
          | false
        >
        numberOfLines: ChatRuntimeToolExecutionCompactPreviewMobileRowState["renderState"]["name"]["numberOfLines"]
        ellipsizeMode: ChatRuntimeToolExecutionCompactPreviewMobileRowState["renderState"]["name"]["ellipsizeMode"]
        text: string
      }
    }>
    moreAction: {
      button: {
        onPress: TToolPreviewOnShowAll
        accessibilityRole: ChatRuntimeDelegationMorePreviewActionState["accessibilityRole"]
        accessibilityLabel: string
        style: (state: { pressed: boolean }) => Array<
          | TStyles["toolPreviewMoreButton"]
          | TStyles["toolPreviewMoreButtonPressed"]
          | false
        >
      }
      label: {
        style: TStyles["toolPreviewMore"]
        numberOfLines: ChatRuntimeDelegationMorePreviewActionState["numberOfLines"]
        text: string
      }
    } | null
  } | null
}

export interface ChatRuntimeConversationActionSetMobileStyleSlots<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
> {
  turnDuration: TTurnDurationStyle
  speech: TSpeechStyle
  branch: TBranchStyle
  copy: TCopyStyle
  expansion: TExpansionStyle
}

export interface ChatRuntimeMessageSurfaceMobilePropsPartsInput<
  TStyle = unknown,
  TToneStyle = unknown,
> {
  style: TStyle
  toneStyle?: TToneStyle
}

export interface ChatRuntimeMessageSurfaceMobilePropsParts<
  TStyle = unknown,
  TToneStyle = unknown,
> {
  container: {
    style: Array<TStyle | TToneStyle | undefined>
  }
}

export interface ChatRuntimeMessageThreadItemMobilePropsPartsInput<
  TLeadingActivity = unknown,
  TTrailingActivity = unknown,
> {
  leadingActivity?: TLeadingActivity
  trailingActivity?: TTrailingActivity
}

export interface ChatRuntimeMessageThreadItemMobilePropsParts<
  TLeadingActivity = unknown,
  TTrailingActivity = unknown,
> {
  leadingActivity: TLeadingActivity | undefined
  trailingActivity: TTrailingActivity | undefined
}

export interface ChatRuntimeMessageThreadSurfaceMobilePropsPartsInput<
  TLeadingActivity = unknown,
  TTrailingActivity = unknown,
  TSurfaceStyle = unknown,
  TSurfaceToneStyle = unknown,
> {
  leadingActivity?: TLeadingActivity
  trailingActivity?: TTrailingActivity
  surfaceStyle: TSurfaceStyle
  surfaceToneStyle?: TSurfaceToneStyle
}

export interface ChatRuntimeMessageThreadSurfaceMobilePropsParts<
  TLeadingActivity = unknown,
  TTrailingActivity = unknown,
  TSurfaceStyle = unknown,
  TSurfaceToneStyle = unknown,
> {
  item: ChatRuntimeMessageThreadItemMobilePropsParts<
    TLeadingActivity,
    TTrailingActivity
  >
  surface: ChatRuntimeMessageSurfaceMobilePropsPartsInput<
    TSurfaceStyle,
    TSurfaceToneStyle
  >
}

export interface ChatRuntimeMessageContentRowMobilePropsPartsInput<
  TEntry = unknown,
  TRowStyle = unknown,
  TBodyStyle = unknown,
> {
  shouldRenderActionSlots: boolean
  entries: readonly TEntry[]
  rowStyle: TRowStyle
  bodyStyle?: TBodyStyle
}

export interface ChatRuntimeMessageContentRowMobilePropsParts<
  TEntry = unknown,
  TRowStyle = unknown,
  TBodyStyle = unknown,
> {
  row: {
    style: TRowStyle
  }
  body: {
    style: TBodyStyle
  } | null
  actionSlotList: {
    shouldRender: boolean
    entries: readonly TEntry[]
  }
}

export interface ChatRuntimeMessageStandaloneActionsMobilePropsPartsInput<
  TEntry = unknown,
  TRowStyle = unknown,
> {
  shouldRender: boolean
  entries: readonly TEntry[]
  rowStyle?: TRowStyle
}

export interface ChatRuntimeMessageStandaloneActionsMobilePropsParts<
  TEntry = unknown,
  TRowStyle = unknown,
> {
  actionSlotList: {
    entries: readonly TEntry[]
    rowStyle: TRowStyle | undefined
  } | null
}

export interface ChatRuntimeConversationContentMobilePropsPartsInput<
  TEntry = unknown,
  TExpanded extends { bodyStyle: unknown } = { bodyStyle: unknown },
  TCollapsed = unknown,
  TRowStyle = unknown,
> {
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode
  rowStyle: TRowStyle
  shouldRenderActionSlots: boolean
  entries: readonly TEntry[]
  expanded: TExpanded
  collapsed: TCollapsed
}

export interface ChatRuntimeConversationContentMobilePropsParts<
  TEntry = unknown,
  TExpanded extends { bodyStyle: unknown } = { bodyStyle: unknown },
  TCollapsed = unknown,
  TRowStyle = unknown,
> {
  expandedContent: {
    row: {
      rowStyle: TRowStyle
      bodyStyle: TExpanded["bodyStyle"]
      shouldRenderActionSlots: boolean
      entries: readonly TEntry[]
    }
    content: Omit<TExpanded, "bodyStyle">
  } | null
  collapsedContent: {
    row: {
      rowStyle: TRowStyle
      shouldRenderActionSlots: boolean
      entries: readonly TEntry[]
    }
    preview: TCollapsed
  } | null
}

export interface ChatRuntimeMessageActionIconButtonMobilePropsPartsInput<
  TIcon extends {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  } = {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  },
  TOnPress = unknown,
  TAccessibilityRole = unknown,
  TAccessibilityState extends object | undefined = object | undefined,
  TAriaExpanded = unknown,
  THitSlop = unknown,
  TStyle = unknown,
  TActiveStyle = unknown,
  TPressedStyle = unknown,
  TDisabledStyle = unknown,
> {
  icon: TIcon
  onPress?: TOnPress
  disabled?: boolean
  isActive?: boolean
  accessibilityRole: TAccessibilityRole
  accessibilityLabel: string
  accessibilityHint?: string | null
  accessibilityState?: TAccessibilityState
  ariaExpanded?: TAriaExpanded
  hitSlop?: THitSlop
  style: TStyle
  activeStyle?: TActiveStyle
  pressedStyle?: TPressedStyle
  disabledStyle?: TDisabledStyle
}

export interface ChatRuntimeMessageActionIconButtonMobilePropsParts<
  TIcon extends {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  } = {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  },
  TOnPress = unknown,
  TAccessibilityRole = unknown,
  TAccessibilityState extends object | undefined = object | undefined,
  TAriaExpanded = unknown,
  THitSlop = unknown,
  TStyle = unknown,
  TActiveStyle = unknown,
  TPressedStyle = unknown,
  TDisabledStyle = unknown,
> {
  pressable: {
    onPress: TOnPress | undefined
    disabled: boolean
    accessibilityRole: TAccessibilityRole
    accessibilityLabel: string
    accessibilityHint: string | undefined
    accessibilityState: TAccessibilityState | { disabled: true } | undefined
    ariaExpanded: TAriaExpanded | undefined
    hitSlop: THitSlop | undefined
    style: (state: { pressed: boolean }) => Array<
      | TStyle
      | TActiveStyle
      | TPressedStyle
      | TDisabledStyle
      | false
      | undefined
    >
  }
  activityIndicator: TIcon | null
  icon: TIcon | null
}

export interface ChatRuntimeMessageActionIconButtonMobilePropsInput<
  TIcon extends {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  } = {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  },
  TOnPress = unknown,
  TAccessibilityRole = unknown,
  TAccessibilityState extends object | undefined = object | undefined,
  TAriaExpanded = unknown,
  THitSlop = unknown,
  TStyle = unknown,
  TActiveStyle = unknown,
  TPressedStyle = unknown,
  TDisabledStyle = unknown,
> {
  spec: {
    renderState: {
      isDisabled?: boolean
      accessibilityRole: TAccessibilityRole
      accessibilityLabel: string
      accessibilityHint?: string | null
      accessibilityState?: TAccessibilityState
      ariaExpanded?: TAriaExpanded
      icon: TIcon
    }
    onPress?: TOnPress
    hitSlop?: THitSlop
    style: TStyle
    activeStyle?: TActiveStyle
    pressedStyle?: TPressedStyle
    disabledStyle?: TDisabledStyle
    isActive?: boolean
  }
}

export type ChatRuntimeMessageActionIconButtonMobileProps<
  TIcon extends {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  } = {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  },
  TOnPress = unknown,
  TAccessibilityRole = unknown,
  TAccessibilityState extends object | undefined = object | undefined,
  TAriaExpanded = unknown,
  THitSlop = unknown,
  TStyle = unknown,
  TActiveStyle = unknown,
  TPressedStyle = unknown,
  TDisabledStyle = unknown,
> = Omit<
  ChatRuntimeMessageActionIconButtonMobilePropsPartsInput<
    TIcon,
    TOnPress,
    TAccessibilityRole,
    TAccessibilityState,
    TAriaExpanded,
    THitSlop,
    TStyle,
    TActiveStyle,
    TPressedStyle,
    TDisabledStyle
  >,
  "accessibilityHint"
> & {
  accessibilityHint?: string
}

export interface ChatRuntimeMessageActionSlotListMobilePropsPartsInput<
  TEntry extends {
    slot: string | number
    item: unknown
  } = {
    slot: string | number
    item: unknown
  },
  TRowStyle = unknown,
> {
  shouldRender?: boolean
  entries: readonly TEntry[]
  rowStyle?: TRowStyle
}

export interface ChatRuntimeMessageActionSlotListMobilePropsParts<
  TEntry extends {
    slot: string | number
    item: unknown
  } = {
    slot: string | number
    item: unknown
  },
  TRowStyle = unknown,
> {
  shouldRenderList: boolean
  items: Array<{
    key: TEntry["slot"]
    item: TEntry["item"]
  }>
  row: {
    style: TRowStyle
  } | null
}

export interface ChatRuntimeConversationActionSetMobileStateInput<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
> {
  message: Pick<ChatMessageDisplayStateMessageLike, "role"> & {
    branchMessageIndex?: number | null
  }
  messageRenderState: ChatRuntimeConversationMessageMobileRenderState
  messageIndex: number
  visibleMessageContent: string
  turnDuration?: Pick<ChatRuntimeTurnDurationMessageMobileRenderStateInput, "durationMs" | "isLive">
  conversationId?: string
  pendingBranchMessageIndex?: number | null
  isResponding: boolean
  isSpeaking: boolean
  isCopied: boolean
  ttsEnabled: boolean
  colors: ChatRuntimeConversationMessageMobileRenderStateInput["colors"]
  styles: ChatRuntimeConversationActionSetMobileStyleSlots<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >
  onSpeakMessage: (messageIndex: number, content: string) => void
  onBranchMessage?: (messageIndex: number) => void
  onCopyMessage: (messageIndex: number, content: string) => void | Promise<void>
  onToggleMessageExpansion: (messageIndex: number) => void
}

export interface ChatRuntimeConversationActionSetMobileState<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
> {
  renderState: ChatRuntimeConversationMessageActionsMobileRenderState
  turnDuration: ChatRuntimeTurnDurationMessageMobileRenderStateInput & TTurnDurationStyle
  speech: Omit<ChatMessageSpeechMobileRenderStateInput, "isVisible"> & {
    onPress: () => void
  } & TSpeechStyle
  branch: ChatRuntimeBranchMobileRenderStateInput & {
    onPress: () => void
  } & TBranchStyle
  copy: ChatMessageCopyMobileRenderStateInput & {
    onPress: () => void
  } & TCopyStyle
  expansion: {
    onPress: () => void
  } & TExpansionStyle
}

export interface ChatRuntimeConversationToolExecutionStackMobileStateInput<
  TPendingResultRenderState extends ToolExecutionDetailMobilePendingResultRenderState =
    ToolExecutionDetailMobilePendingResultRenderState,
  TEmptyStateRenderState extends ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState> =
    ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState>,
> {
  message: {
    id?: string | null
  }
  messageIndex: number
  displayToolCallCount: number
  renderedToolEntries: readonly ChatMessageDisplayToolEntry[]
  isExpanded: boolean
  expandedToolCalls: ChatDisplayExpansionStateMap<string>
  previewNumberOfLines: number
  pendingResultRenderState: TPendingResultRenderState
  emptyStateRenderState: TEmptyStateRenderState
  colors: ChatRuntimeToolExecutionStackMobileRenderStateInput["colors"]
  onToggleToolCall: (stableMessageKey: string, toolEntryIndex: number) => void
  onCopyPayload: (content: string) => void | Promise<void>
  onToggleMessageExpansion: (messageIndex: number) => void
}

export interface ChatRuntimeConversationToolExecutionDetailInputMobileState
  extends ChatRuntimeToolExecutionDetailMobileRowInputSectionState {
  onCopyPress: () => void
}

export interface ChatRuntimeConversationToolExecutionDetailResultMobileState
  extends ChatRuntimeToolExecutionDetailMobileRowResultSectionState {
  onCopyPress: () => void
  onErrorCopyPress: () => void
}

export interface ChatRuntimeConversationToolExecutionDetailMobileRowState
  extends Omit<ChatRuntimeToolExecutionDetailMobileRowState, "input" | "result"> {
  onHeaderPress: () => void
  input: ChatRuntimeConversationToolExecutionDetailInputMobileState | null
  result: ChatRuntimeConversationToolExecutionDetailResultMobileState | null
}

export interface ChatRuntimeConversationToolExecutionStackMobileState {
  displayToolCallCount: number
  isExpanded: boolean
  renderState: ChatRuntimeToolExecutionStackMobileRenderState
  compactRows: readonly ChatRuntimeToolExecutionCompactPreviewMobileRowState[]
  detailRows: readonly ChatRuntimeConversationToolExecutionDetailMobileRowState[]
  compact: {
    onToggle: () => void
  }
  expanded: {
    onToggle: () => void
  }
}

export interface ChatRuntimeConversationToolExecutionStackMobileProps {
  shouldRender: boolean
  isExpanded: boolean
  compact: ChatRuntimeToolExecutionStackMobileRenderState["compact"] & {
    rows: readonly ChatRuntimeToolExecutionCompactPreviewMobileRowState[]
    onPress: () => void
  }
  expanded: ChatRuntimeToolExecutionStackMobileRenderState["expanded"] & {
    onCollapsePress: () => void
  }
  detailRows: readonly ChatRuntimeConversationToolExecutionDetailMobileRowState[]
}

export interface ChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlotsInput<
  TButtonStyle = unknown,
  TPressedStyle = unknown,
  TTopPlacementStyle = unknown,
  TBottomPlacementStyle = unknown,
  TTextStyle = unknown,
> {
  collapseButton: TButtonStyle
  collapsePressed: TPressedStyle
  collapseTopPlacement: TTopPlacementStyle
  collapseBottomPlacement: TBottomPlacementStyle
  collapseText: TTextStyle
}

export interface ChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots<
  TButtonStyle = unknown,
  TPressedStyle = unknown,
  TTopPlacementStyle = unknown,
  TBottomPlacementStyle = unknown,
  TTextStyle = unknown,
> {
  top: {
    button: TButtonStyle
    pressed: TPressedStyle
    placement: TTopPlacementStyle
    text: TTextStyle
  }
  bottom: {
    button: TButtonStyle
    pressed: TPressedStyle
    placement: TBottomPlacementStyle
    text: TTextStyle
  }
}

export interface ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase<
  TContainerStyle = unknown,
  TCardStyle = unknown,
  TPendingStyle = unknown,
  TSuccessStyle = unknown,
  TErrorStyle = unknown,
  TCollapseButtonStyle = unknown,
  TCollapsePressedStyle = unknown,
  TCollapseTopPlacementStyle = unknown,
  TCollapseBottomPlacementStyle = unknown,
  TCollapseTextStyle = unknown,
> {
  container: TContainerStyle
  card: TCardStyle
  pending: TPendingStyle
  success: TSuccessStyle
  error: TErrorStyle
  collapseButton: TCollapseButtonStyle
  collapsePressed: TCollapsePressedStyle
  collapseTopPlacement: TCollapseTopPlacementStyle
  collapseBottomPlacement: TCollapseBottomPlacementStyle
  collapseText: TCollapseTextStyle
}

export interface ChatRuntimeToolExecutionExpandedGroupMobilePropsPartsInput<
  TTopCollapseRenderState = unknown,
  TBottomCollapseRenderState = unknown,
  TOnCollapsePress = unknown,
  TEmptyState = unknown,
  TStyles extends ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase =
    ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase,
> {
  topCollapseRenderState: TTopCollapseRenderState
  bottomCollapseRenderState: TBottomCollapseRenderState
  onCollapsePress?: TOnCollapsePress
  isPending: boolean
  allSuccess: boolean
  hasErrors: boolean
  emptyState?: TEmptyState
  styles: TStyles
}

export interface ChatRuntimeToolExecutionExpandedGroupMobilePropsParts<
  TTopCollapseRenderState = unknown,
  TBottomCollapseRenderState = unknown,
  TOnCollapsePress = unknown,
  TEmptyState = unknown,
  TStyles extends ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase =
    ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase,
> {
  containerStyle: TStyles["container"]
  cardStyle: Array<
    | TStyles["card"]
    | TStyles["pending"]
    | TStyles["success"]
    | TStyles["error"]
    | false
  >
  topCollapseControl: {
    renderState: TTopCollapseRenderState
    onPress: TOnCollapsePress | undefined
    styles: ChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots<
      TStyles["collapseButton"],
      TStyles["collapsePressed"],
      TStyles["collapseTopPlacement"],
      TStyles["collapseBottomPlacement"],
      TStyles["collapseText"]
    >["top"]
  }
  bottomCollapseControl: {
    renderState: TBottomCollapseRenderState
    onPress: TOnCollapsePress | undefined
    styles: ChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots<
      TStyles["collapseButton"],
      TStyles["collapsePressed"],
      TStyles["collapseTopPlacement"],
      TStyles["collapseBottomPlacement"],
      TStyles["collapseText"]
    >["bottom"]
  }
  emptyState: TEmptyState | undefined
}

export interface ChatRuntimeToolExecutionCallDetailMobilePropsPartsInput<
  TRenderState = unknown,
  TOnHeaderPress = unknown,
  TInput extends object = Record<string, never>,
  TResult extends object = Record<string, never>,
  TPendingResult extends { renderState: unknown } = { renderState: unknown },
  TStyles extends {
    callSection: unknown
    payloadSection: unknown
    resultSection: unknown
    pendingResult: unknown
  } = {
    callSection: unknown
    payloadSection: unknown
    resultSection: unknown
    pendingResult: unknown
  },
> {
  renderState: TRenderState
  toolName: string
  onHeaderPress?: TOnHeaderPress
  input?: TInput | null
  result?: TResult | null
  pendingResult?: TPendingResult | null
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCallDetailMobilePropsParts<
  TRenderState = unknown,
  TOnHeaderPress = unknown,
  TInput extends object = Record<string, never>,
  TResult extends object = Record<string, never>,
  TPendingResult extends { renderState: unknown } = { renderState: unknown },
  TStyles extends {
    callSection: unknown
    payloadSection: unknown
    resultSection: unknown
    pendingResult: unknown
  } = {
    callSection: unknown
    payloadSection: unknown
    resultSection: unknown
    pendingResult: unknown
  },
> {
  callSection: {
    renderState: TRenderState
    toolName: string
    onHeaderPress: TOnHeaderPress | undefined
    styles: TStyles["callSection"]
  }
  inputSection: (TInput & {
    styles: TStyles["payloadSection"]
  }) | null
  resultSection: (TResult & {
    styles: TStyles["resultSection"]
  }) | null
  pendingResult: ({
    renderState: TPendingResult["renderState"]
    styles: TStyles["pendingResult"]
  }) | null
}

export interface ChatRuntimeToolExecutionCallListMobilePropsPartsInput<
  TRow extends {
    key: unknown
    renderState: unknown
    toolName: string
    onHeaderPress?: unknown
    input?: unknown
    result?: unknown
    pendingResult?: unknown
  } = {
    key: unknown
    renderState: unknown
    toolName: string
    onHeaderPress?: unknown
    input?: unknown
    result?: unknown
    pendingResult?: unknown
  },
  TStyles = unknown,
> {
  rows: readonly TRow[]
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCallListMobilePropsParts<
  TRow extends {
    key: unknown
    renderState: unknown
    toolName: string
    onHeaderPress?: unknown
    input?: unknown
    result?: unknown
    pendingResult?: unknown
  } = {
    key: unknown
    renderState: unknown
    toolName: string
    onHeaderPress?: unknown
    input?: unknown
    result?: unknown
    pendingResult?: unknown
  },
  TStyles = unknown,
> {
  rows: Array<{
    key: TRow["key"]
    renderState: TRow["renderState"]
    toolName: string
    onHeaderPress: TRow["onHeaderPress"]
    input: TRow["input"]
    result: TRow["result"]
    pendingResult: TRow["pendingResult"]
    styles: TStyles
  }>
}

export interface ChatRuntimeToolExecutionPayloadSectionMobilePropsPartsInput<
  TPayloadRenderState = unknown,
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TStyles extends {
    section: unknown
    headerRow: unknown
    payloadMeta: unknown
    copyButton: unknown
    payloadBlock: unknown
  } = {
    section: unknown
    headerRow: unknown
    payloadMeta: unknown
    copyButton: unknown
    payloadBlock: unknown
  },
> {
  payloadRenderState: TPayloadRenderState
  compactText?: string | null
  content: string
  isExpanded: boolean
  previewNumberOfLines: number
  copyButtonRenderState: TCopyButtonRenderState
  onCopyPress?: TOnCopyPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionPayloadSectionMobilePropsParts<
  TPayloadRenderState = unknown,
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TStyles extends {
    section: unknown
    headerRow: unknown
    payloadMeta: unknown
    copyButton: unknown
    payloadBlock: unknown
  } = {
    section: unknown
    headerRow: unknown
    payloadMeta: unknown
    copyButton: unknown
    payloadBlock: unknown
  },
> {
  sectionStyle: TStyles["section"]
  headerRowStyle: TStyles["headerRow"]
  payloadMeta: {
    renderState: TPayloadRenderState
    styles: TStyles["payloadMeta"]
  }
  copyButton: {
    renderState: TCopyButtonRenderState
    onPress: TOnCopyPress | undefined
    styles: TStyles["copyButton"]
  }
  payloadBlock: {
    compactText: string | null | undefined
    content: string
    isExpanded: boolean
    previewNumberOfLines: number
    styles: TStyles["payloadBlock"]
  }
}

export interface ChatRuntimeToolExecutionPayloadMetaMobilePropsPartsInput<
  TRenderState extends {
    label: string
    payloadTypeLabel?: string | null
  } = {
    label: string
    payloadTypeLabel?: string | null
  },
  TStyles extends {
    row?: unknown
    label: unknown
    payloadType: unknown
  } = {
    row?: unknown
    label: unknown
    payloadType: unknown
  },
> {
  renderState: TRenderState
  styles: TStyles
}

export interface ChatRuntimeToolExecutionPayloadMetaMobilePropsParts<
  TRenderState extends {
    label: string
    payloadTypeLabel?: string | null
  } = {
    label: string
    payloadTypeLabel?: string | null
  },
  TStyles extends {
    row?: unknown
    label: unknown
    payloadType: unknown
  } = {
    row?: unknown
    label: unknown
    payloadType: unknown
  },
> {
  row: ({
    style: TStyles["row"]
  }) | null
  label: {
    text: TRenderState["label"]
    style: TStyles["label"]
  }
  payloadType: ({
    text: NonNullable<TRenderState["payloadTypeLabel"]>
    style: TStyles["payloadType"]
  }) | null
}

export interface ChatRuntimeToolExecutionPayloadBlockMobilePropsPartsInput<
  TStyles extends {
    preview: unknown
    scroll: unknown
    scrollExpanded: unknown
    code: unknown
  } = {
    preview: unknown
    scroll: unknown
    scrollExpanded: unknown
    code: unknown
  },
> {
  compactText?: string | null
  content: string
  isExpanded: boolean
  previewNumberOfLines: number
  styles: TStyles
}

export interface ChatRuntimeToolExecutionPayloadBlockMobilePropsParts<
  TStyles extends {
    preview: unknown
    scroll: unknown
    scrollExpanded: unknown
    code: unknown
  } = {
    preview: unknown
    scroll: unknown
    scrollExpanded: unknown
    code: unknown
  },
> {
  preview: ({
    text: string
    style: TStyles["preview"]
    numberOfLines: number
  }) | null
  scroll: {
    style: TStyles["scroll"] | TStyles["scrollExpanded"]
    nestedScrollEnabled: true
  }
  code: {
    text: string
    style: TStyles["code"]
  }
}

export interface ChatRuntimeToolExecutionResultBadgeMobilePropsPartsInput<
  TBadge extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    isSuccess: boolean
    icon: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    isSuccess: boolean
    icon: unknown
    label: string
  },
  TStyles extends {
    badge: unknown
    badgeSuccess: unknown
    badgeError: unknown
    text: unknown
    textSuccess: unknown
    textError: unknown
  } = {
    badge: unknown
    badgeSuccess: unknown
    badgeError: unknown
    text: unknown
    textSuccess: unknown
    textError: unknown
  },
> {
  badge: TBadge
  styles: TStyles
}

export interface ChatRuntimeToolExecutionResultBadgeMobilePropsParts<
  TBadge extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    isSuccess: boolean
    icon: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    isSuccess: boolean
    icon: unknown
    label: string
  },
  TStyles extends {
    badge: unknown
    badgeSuccess: unknown
    badgeError: unknown
    text: unknown
    textSuccess: unknown
    textError: unknown
  } = {
    badge: unknown
    badgeSuccess: unknown
    badgeError: unknown
    text: unknown
    textSuccess: unknown
    textError: unknown
  },
> {
  container: {
    accessible: true
    accessibilityRole: TBadge["accessibilityRole"]
    accessibilityLabel: string
    style: Array<TStyles["badge"] | TStyles["badgeSuccess"] | TStyles["badgeError"]>
  }
  icon: TBadge["icon"]
  label: {
    text: string
    style: Array<TStyles["text"] | TStyles["textSuccess"] | TStyles["textError"]>
  }
}

export interface ChatRuntimeToolExecutionCopyButtonMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
  },
  TOnPress = unknown,
  TStyles extends {
    button: unknown
    pressed: unknown
    text: unknown
  } = {
    button: unknown
    pressed: unknown
    text: unknown
  },
> {
  renderState: TRenderState
  onPress?: TOnPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCopyButtonMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
  },
  TOnPress = unknown,
  TStyles extends {
    button: unknown
    pressed: unknown
    text: unknown
  } = {
    button: unknown
    pressed: unknown
    text: unknown
  },
> {
  container: {
    onPress: TOnPress | undefined
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: (state: { pressed: boolean }) => Array<TStyles["button"] | TStyles["pressed"] | false>
  }
  icon: TRenderState["icon"]
  label: {
    text: string
    style: TStyles["text"]
  }
}

export interface ChatRuntimeToolExecutionDetailHeaderMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
    accessibilityHint: string
    toggleIcon: unknown
    toggleLabel: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
    accessibilityHint: string
    toggleIcon: unknown
    toggleLabel: string
  },
  TOnPress = unknown,
  TStyles extends {
    header: unknown
    headerPressed: unknown
    toolName: unknown
    expandHint: unknown
    expandHintText: unknown
  } = {
    header: unknown
    headerPressed: unknown
    toolName: unknown
    expandHint: unknown
    expandHintText: unknown
  },
> {
  renderState: TRenderState
  toolName: string
  onPress?: TOnPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionDetailHeaderMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
    accessibilityHint: string
    toggleIcon: unknown
    toggleLabel: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
    accessibilityHint: string
    toggleIcon: unknown
    toggleLabel: string
  },
  TOnPress = unknown,
  TStyles extends {
    header: unknown
    headerPressed: unknown
    toolName: unknown
    expandHint: unknown
    expandHintText: unknown
  } = {
    header: unknown
    headerPressed: unknown
    toolName: unknown
    expandHint: unknown
    expandHintText: unknown
  },
> {
  container: {
    onPress: TOnPress | undefined
    style: (state: { pressed: boolean }) => Array<TStyles["header"] | TStyles["headerPressed"] | false>
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: TRenderState["accessibilityState"]
    ariaExpanded: TRenderState["ariaExpanded"]
    accessibilityHint: string
  }
  toolName: {
    text: string
    style: TStyles["toolName"]
  }
  expandHint: {
    style: TStyles["expandHint"]
    icon: TRenderState["toggleIcon"]
    label: {
      text: string
      style: TStyles["expandHintText"]
    }
  }
}

export interface ChatRuntimeToolExecutionCallSectionMobilePropsPartsInput<
  TRenderState = unknown,
  TOnHeaderPress = unknown,
  TStyles extends {
    section: unknown
    header: unknown
  } = {
    section: unknown
    header: unknown
  },
> {
  renderState: TRenderState
  toolName: string
  onHeaderPress?: TOnHeaderPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCallSectionMobilePropsParts<
  TRenderState = unknown,
  TOnHeaderPress = unknown,
  TStyles extends {
    section: unknown
    header: unknown
  } = {
    section: unknown
    header: unknown
  },
> {
  container: {
    style: TStyles["section"]
  }
  header: {
    renderState: TRenderState
    toolName: string
    onPress: TOnHeaderPress | undefined
    styles: TStyles["header"]
  }
}

export interface ChatRuntimeToolExecutionCollapseControlMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    icon: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    icon: unknown
    label: string
  },
  TOnPress = unknown,
  TStyles extends {
    button: unknown
    pressed: unknown
    placement?: unknown
    text: unknown
  } = {
    button: unknown
    pressed: unknown
    placement?: unknown
    text: unknown
  },
> {
  renderState: TRenderState
  onPress?: TOnPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCollapseControlMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    icon: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    icon: unknown
    label: string
  },
  TOnPress = unknown,
  TStyles extends {
    button: unknown
    pressed: unknown
    placement?: unknown
    text: unknown
  } = {
    button: unknown
    pressed: unknown
    placement?: unknown
    text: unknown
  },
> {
  container: {
    onPress: TOnPress | undefined
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityHint: string
    style: (state: { pressed: boolean }) => Array<
      TStyles["button"] | TStyles["pressed"] | TStyles["placement"] | false | undefined
    >
  }
  icon: TRenderState["icon"]
  label: {
    text: string
    style: TStyles["text"]
  }
}

export interface ChatRuntimeToolExecutionCompactGroupMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: unknown
    ariaExpanded: unknown
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: unknown
    ariaExpanded: unknown
  },
  TOnPress = unknown,
  TStyles extends {
    container: unknown
    pressed: unknown
  } = {
    container: unknown
    pressed: unknown
  },
> {
  renderState: TRenderState
  onPress?: TOnPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCompactGroupMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: unknown
    ariaExpanded: unknown
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: unknown
    ariaExpanded: unknown
  },
  TOnPress = unknown,
  TStyles extends {
    container: unknown
    pressed: unknown
  } = {
    container: unknown
    pressed: unknown
  },
> {
  container: {
    onPress: TOnPress | undefined
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: TRenderState["accessibilityState"]
    ariaExpanded: TRenderState["ariaExpanded"]
    style: (state: { pressed: boolean }) => Array<TStyles["container"] | TStyles["pressed"] | false>
  }
}

type ChatRuntimeToolExecutionCompactRowStatusIndicatorPart = {
  shouldRender: boolean
}

export interface ChatRuntimeToolExecutionCompactRowMobilePropsPartsInput<
  TRenderState extends {
    accessibilityLabel: string
    toolIcon: unknown
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    name: {
      numberOfLines: unknown
      ellipsizeMode: unknown
    }
    preview: string
    statusIndicator: {
      spinner: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
      icon: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
    }
    toggleIcon: unknown
  } = {
    accessibilityLabel: string
    toolIcon: unknown
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    name: {
      numberOfLines: unknown
      ellipsizeMode: unknown
    }
    preview: string
    statusIndicator: {
      spinner: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
      icon: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
    }
    toggleIcon: unknown
  },
  TStyles extends {
    line: unknown
    leadingIcon: unknown
    name: unknown
    namePending: unknown
    nameSuccess: unknown
    nameError: unknown
    statusIndicator: unknown
    toggleIcon: unknown
  } = {
    line: unknown
    leadingIcon: unknown
    name: unknown
    namePending: unknown
    nameSuccess: unknown
    nameError: unknown
    statusIndicator: unknown
    toggleIcon: unknown
  },
> {
  renderState: TRenderState
  styles: TStyles
}

export interface ChatRuntimeToolExecutionCompactRowMobilePropsParts<
  TRenderState extends {
    accessibilityLabel: string
    toolIcon: unknown
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    name: {
      numberOfLines: unknown
      ellipsizeMode: unknown
    }
    preview: string
    statusIndicator: {
      spinner: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
      icon: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
    }
    toggleIcon: unknown
  } = {
    accessibilityLabel: string
    toolIcon: unknown
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    name: {
      numberOfLines: unknown
      ellipsizeMode: unknown
    }
    preview: string
    statusIndicator: {
      spinner: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
      icon: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
    }
    toggleIcon: unknown
  },
  TStyles extends {
    line: unknown
    leadingIcon: unknown
    name: unknown
    namePending: unknown
    nameSuccess: unknown
    nameError: unknown
    statusIndicator: unknown
    toggleIcon: unknown
  } = {
    line: unknown
    leadingIcon: unknown
    name: unknown
    namePending: unknown
    nameSuccess: unknown
    nameError: unknown
    statusIndicator: unknown
    toggleIcon: unknown
  },
> {
  container: {
    style: TStyles["line"]
    accessibilityLabel: string
  }
  leadingIcon: {
    style: TStyles["leadingIcon"]
    icon: TRenderState["toolIcon"]
  }
  name: {
    text: string
    style: Array<
      | TStyles["name"]
      | TStyles["namePending"]
      | TStyles["nameSuccess"]
      | TStyles["nameError"]
      | false
    >
    numberOfLines: TRenderState["name"]["numberOfLines"]
    ellipsizeMode: TRenderState["name"]["ellipsizeMode"]
  }
  statusIndicator: {
    style: TStyles["statusIndicator"]
    spinner: TRenderState["statusIndicator"]["spinner"] | null
    icon: TRenderState["statusIndicator"]["icon"] | null
  }
  toggleIcon: {
    style: TStyles["toggleIcon"]
    icon: TRenderState["toggleIcon"]
  }
}

export interface ChatRuntimeToolExecutionCompactListMobilePropsPartsInput<
  TRenderState = unknown,
  TRow extends {
    key: unknown
    renderState: unknown
  } = {
    key: unknown
    renderState: unknown
  },
  TOnPress = unknown,
  TCompactGroupStyles = unknown,
  TCompactRowStyles = unknown,
> {
  shouldRender: boolean
  renderState: TRenderState
  rows: readonly TRow[]
  onPress?: TOnPress
  groupStyles: TCompactGroupStyles
  rowStyles: TCompactRowStyles
}

export interface ChatRuntimeToolExecutionCompactListMobilePropsParts<
  TRenderState = unknown,
  TRow extends {
    key: unknown
    renderState: unknown
  } = {
    key: unknown
    renderState: unknown
  },
  TOnPress = unknown,
  TCompactGroupStyles = unknown,
  TCompactRowStyles = unknown,
> {
  shouldRenderList: boolean
  group: {
    renderState: TRenderState
    onPress: TOnPress | undefined
    styles: TCompactGroupStyles
  }
  rows: Array<{
    key: TRow["key"]
    renderState: TRow["renderState"]
    styles: TCompactRowStyles
  }>
}

export interface ChatRuntimeToolExecutionPendingResultMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    spinner: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    spinner: unknown
    label: string
  },
  TStyles extends {
    row: unknown
    text: unknown
  } = {
    row: unknown
    text: unknown
  },
> {
  renderState: TRenderState
  styles: TStyles
}

export interface ChatRuntimeToolExecutionPendingResultMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    spinner: unknown
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    spinner: unknown
    label: string
  },
  TStyles extends {
    row: unknown
    text: unknown
  } = {
    row: unknown
    text: unknown
  },
> {
  container: {
    accessible: true
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: TStyles["row"]
  }
  spinner: TRenderState["spinner"]
  label: {
    text: string
    style: TStyles["text"]
  }
}

export interface ChatRuntimeToolExecutionEmptyStateMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    label: string
  },
  TStyle = unknown,
> {
  renderState: TRenderState
  style: TStyle
}

export interface ChatRuntimeToolExecutionEmptyStateMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    label: string
  } = {
    accessibilityRole: unknown
    accessibilityLabel: string
    label: string
  },
  TStyle = unknown,
> {
  label: {
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: TStyle
    text: string
  }
}

export interface ChatRuntimeToolExecutionResultHeaderMobilePropsPartsInput<
  TPayloadRenderState = unknown,
  TResultBadge = unknown,
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TStyles extends {
    header: unknown
    meta: unknown
    payloadMeta: unknown
    badge: unknown
    characterCount: unknown
    copyButton: unknown
  } = {
    header: unknown
    meta: unknown
    payloadMeta: unknown
    badge: unknown
    characterCount: unknown
    copyButton: unknown
  },
> {
  payloadRenderState: TPayloadRenderState
  resultBadge: TResultBadge
  characterCountLabel: string
  copyButtonRenderState: TCopyButtonRenderState
  onCopyPress?: TOnCopyPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionResultHeaderMobilePropsParts<
  TPayloadRenderState = unknown,
  TResultBadge = unknown,
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TStyles extends {
    header: unknown
    meta: unknown
    payloadMeta: unknown
    badge: unknown
    characterCount: unknown
    copyButton: unknown
  } = {
    header: unknown
    meta: unknown
    payloadMeta: unknown
    badge: unknown
    characterCount: unknown
    copyButton: unknown
  },
> {
  headerStyle: TStyles["header"]
  metaStyle: TStyles["meta"]
  payloadMeta: {
    renderState: TPayloadRenderState
    styles: TStyles["payloadMeta"]
  }
  resultBadge: {
    badge: TResultBadge
    styles: TStyles["badge"]
  }
  characterCount: {
    label: string
    style: TStyles["characterCount"]
  }
  copyButton: {
    renderState: TCopyButtonRenderState
    onPress: TOnCopyPress | undefined
    styles: TStyles["copyButton"]
  }
}

export interface ChatRuntimeToolExecutionErrorBlockMobilePropsPartsInput<
  TRenderState extends { label: string } = { label: string },
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TStyles extends {
    section: unknown
    headerRow: unknown
    label: unknown
    text: unknown
    copyButton: unknown
  } = {
    section: unknown
    headerRow: unknown
    label: unknown
    text: unknown
    copyButton: unknown
  },
> {
  renderState: TRenderState
  error: string
  copyButtonRenderState: TCopyButtonRenderState
  onCopyPress?: TOnCopyPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionErrorBlockMobilePropsParts<
  TRenderState extends { label: string } = { label: string },
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TStyles extends {
    section: unknown
    headerRow: unknown
    label: unknown
    text: unknown
    copyButton: unknown
  } = {
    section: unknown
    headerRow: unknown
    label: unknown
    text: unknown
    copyButton: unknown
  },
> {
  sectionStyle: TStyles["section"]
  headerRowStyle: TStyles["headerRow"]
  label: {
    text: TRenderState["label"]
    style: TStyles["label"]
  }
  copyButton: {
    renderState: TCopyButtonRenderState
    onPress: TOnCopyPress | undefined
    styles: TStyles["copyButton"]
  }
  error: {
    text: string
    style: TStyles["text"]
  }
}

export interface ChatRuntimeToolExecutionResultSectionMobilePropsPartsInput<
  TPayloadRenderState = unknown,
  TResultBadge = unknown,
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TErrorRenderState = unknown,
  TErrorCopyButtonRenderState = unknown,
  TOnErrorCopyPress = unknown,
  TStyles extends {
    item: unknown
    header: unknown
    payloadBlock: unknown
    errorBlock: unknown
  } = {
    item: unknown
    header: unknown
    payloadBlock: unknown
    errorBlock: unknown
  },
> {
  payloadRenderState: TPayloadRenderState
  resultBadge: TResultBadge
  characterCountLabel: string
  resultCompactText?: string | null
  resultContent: string
  isExpanded: boolean
  previewNumberOfLines: number
  copyButtonRenderState: TCopyButtonRenderState
  onCopyPress?: TOnCopyPress
  errorRenderState: TErrorRenderState
  error?: string | null
  errorCopyButtonRenderState: TErrorCopyButtonRenderState
  onErrorCopyPress?: TOnErrorCopyPress
  styles: TStyles
}

export interface ChatRuntimeToolExecutionResultSectionMobilePropsParts<
  TPayloadRenderState = unknown,
  TResultBadge = unknown,
  TCopyButtonRenderState = unknown,
  TOnCopyPress = unknown,
  TErrorRenderState = unknown,
  TErrorCopyButtonRenderState = unknown,
  TOnErrorCopyPress = unknown,
  TStyles extends {
    item: unknown
    header: unknown
    payloadBlock: unknown
    errorBlock: unknown
  } = {
    item: unknown
    header: unknown
    payloadBlock: unknown
    errorBlock: unknown
  },
> {
  itemStyle: TStyles["item"]
  header: {
    payloadRenderState: TPayloadRenderState
    resultBadge: TResultBadge
    characterCountLabel: string
    copyButtonRenderState: TCopyButtonRenderState
    onCopyPress: TOnCopyPress | undefined
    styles: TStyles["header"]
  }
  payloadBlock: {
    compactText: string | null | undefined
    content: string
    isExpanded: boolean
    previewNumberOfLines: number
    styles: TStyles["payloadBlock"]
  }
  errorBlock: ({
    renderState: TErrorRenderState
    error: string
    copyButtonRenderState: TErrorCopyButtonRenderState
    onCopyPress: TOnErrorCopyPress | undefined
    styles: TStyles["errorBlock"]
  }) | null
}

export interface ChatRuntimeToolExecutionPanelMobilePropsPartsInput<
  TCompact extends object = Record<string, never>,
  TExpanded extends object = Record<string, never>,
> {
  shouldRender: boolean
  isExpanded: boolean
  compact: TCompact
  expanded: TExpanded
}

export interface ChatRuntimeToolExecutionPanelMobilePropsParts<
  TCompact extends object = Record<string, never>,
  TExpanded extends object = Record<string, never>,
> {
  shouldRenderPanel: boolean
  compact: TCompact & {
    shouldRender: boolean
  }
  expandedGroup: TExpanded | null
}

type ChatRuntimeToolExecutionStackPanelEmptyStateLike = {
  shouldRender: boolean
  renderState: unknown
}

export interface ChatRuntimeToolExecutionStackPanelMobilePropsPartsInput<
  TCompact extends object = Record<string, never>,
  TExpanded extends { emptyState?: ChatRuntimeToolExecutionStackPanelEmptyStateLike | null } = {
    emptyState?: ChatRuntimeToolExecutionStackPanelEmptyStateLike | null
  },
  TDetailRows = unknown,
  TCompactGroupStyles = unknown,
  TCompactRowStyles = unknown,
  TExpandedGroupStyles = unknown,
  TEmptyStateTextStyle = unknown,
  TCallDetailStyles = unknown,
> {
  compact: TCompact
  expanded: TExpanded
  detailRows: TDetailRows
  styles: {
    compactGroup: TCompactGroupStyles
    compactRow: TCompactRowStyles
    expandedGroup: TExpandedGroupStyles
    emptyStateText: TEmptyStateTextStyle
    callDetail: TCallDetailStyles
  }
}

export interface ChatRuntimeToolExecutionStackPanelMobilePropsParts<
  TCompact extends object = Record<string, never>,
  TExpanded extends { emptyState?: ChatRuntimeToolExecutionStackPanelEmptyStateLike | null } = {
    emptyState?: ChatRuntimeToolExecutionStackPanelEmptyStateLike | null
  },
  TDetailRows = unknown,
  TCompactGroupStyles = unknown,
  TCompactRowStyles = unknown,
  TExpandedGroupStyles = unknown,
  TEmptyStateTextStyle = unknown,
  TCallDetailStyles = unknown,
> {
  compact: TCompact & {
    groupStyles: TCompactGroupStyles
    rowStyles: TCompactRowStyles
  }
  expandedGroup: Omit<TExpanded, "emptyState"> & {
    styles: TExpandedGroupStyles
  }
  emptyState: {
    renderState: NonNullable<TExpanded["emptyState"]>["renderState"]
    style: TEmptyStateTextStyle
  } | null
  callList: {
    rows: TDetailRows
    styles: TCallDetailStyles
  }
}

export interface ChatComposerIconButtonMobileRenderStateLike {
  isActive?: boolean
  accessibilityRole: unknown
  accessibilityLabel: string
  accessibilityHint?: string | null
  accessibilityState?: unknown
  ariaChecked?: unknown
  icon: {
    name: unknown
    size: unknown
    color: unknown
  }
}

export interface ChatComposerIconButtonMobilePropsPartsInput<
  TRenderState extends ChatComposerIconButtonMobileRenderStateLike = ChatComposerIconButtonMobileRenderStateLike,
  TOnPress = unknown,
  TActiveOpacity = unknown,
  TStyle = unknown,
  TActiveStyle = unknown,
> {
  shouldRender?: boolean
  renderState: TRenderState
  onPress?: TOnPress
  activeOpacity?: TActiveOpacity
  style: TStyle
  activeStyle?: TActiveStyle
}

export interface ChatComposerIconButtonMobilePropsParts<
  TRenderState extends ChatComposerIconButtonMobileRenderStateLike = ChatComposerIconButtonMobileRenderStateLike,
  TOnPress = unknown,
  TActiveOpacity = unknown,
  TStyle = unknown,
  TActiveStyle = unknown,
> {
  shouldRender: boolean
  touchable: {
    style: Array<TStyle | TActiveStyle | false | undefined>
    onPress: TOnPress | undefined
    activeOpacity: TActiveOpacity | undefined
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityHint: string | undefined
    accessibilityState: TRenderState["accessibilityState"]
    ariaChecked: TRenderState["ariaChecked"]
  }
  icon: TRenderState["icon"]
}

export interface ChatComposerRuntimeDockMobilePropsPartsInput<
  TSpeechPreview extends object = Record<string, never>,
  TPendingImagesRail extends object = Record<string, never>,
  THandsFreeControls extends { status: object } = { status: Record<string, never> },
  TImageAttachmentControl extends object = Record<string, never>,
  TTextToSpeechControl extends object = Record<string, never>,
  TEditBeforeSendControl extends object = Record<string, never>,
  TTextEntry extends object = Record<string, never>,
  TQueueAction extends object = Record<string, never>,
  TSubmitAction extends object = Record<string, never>,
  TMicButton extends object = Record<string, never>,
  TMicWrapperRef = unknown,
  TSpeechPreviewStyles = unknown,
  TPendingImagesRailStyles = unknown,
  THandsFreeControlsStyles = unknown,
  TAccessoryButtonStyle = unknown,
  TAccessoryButtonActiveStyle = unknown,
  TTextEntryStyles = unknown,
  TQueueActionStyles = unknown,
  TSubmitActionStyles = unknown,
  TMicButtonStyles = unknown,
  TInputDockStyles = unknown,
> {
  speechPreview: TSpeechPreview
  pendingImagesRail: TPendingImagesRail
  handsFreeControls: THandsFreeControls
  imageAttachmentControl: TImageAttachmentControl
  textToSpeechControl: TTextToSpeechControl
  editBeforeSendControl: TEditBeforeSendControl
  textEntry: TTextEntry
  queueAction: TQueueAction
  submitAction: TSubmitAction
  micButton: TMicButton
  micWrapperRef?: TMicWrapperRef
  styles: {
    speechPreview: TSpeechPreviewStyles
    pendingImagesRail: TPendingImagesRailStyles
    handsFreeControls: THandsFreeControlsStyles
    accessoryButton: {
      style: TAccessoryButtonStyle
      activeStyle?: TAccessoryButtonActiveStyle
    }
    textEntry: TTextEntryStyles
    queueAction: TQueueActionStyles
    submitAction: TSubmitActionStyles
    micButton: TMicButtonStyles
    inputDock: TInputDockStyles
  }
}

export interface ChatComposerRuntimeDockMobilePropsParts<
  TSpeechPreview extends object = Record<string, never>,
  TPendingImagesRail extends object = Record<string, never>,
  THandsFreeControls extends { status: object } = { status: Record<string, never> },
  TImageAttachmentControl extends object = Record<string, never>,
  TTextToSpeechControl extends object = Record<string, never>,
  TEditBeforeSendControl extends object = Record<string, never>,
  TTextEntry extends object = Record<string, never>,
  TQueueAction extends object = Record<string, never>,
  TSubmitAction extends object = Record<string, never>,
  TMicButton extends object = Record<string, never>,
  TMicWrapperRef = unknown,
  TSpeechPreviewStyles = unknown,
  TPendingImagesRailStyles = unknown,
  THandsFreeControlsStyles = unknown,
  TAccessoryButtonStyle = unknown,
  TAccessoryButtonActiveStyle = unknown,
  TTextEntryStyles = unknown,
  TQueueActionStyles = unknown,
  TSubmitActionStyles = unknown,
  TMicButtonStyles = unknown,
  TInputDockStyles = unknown,
> {
  speechPreview: TSpeechPreview & {
    styles: TSpeechPreviewStyles
  }
  pendingImagesRail: TPendingImagesRail & {
    styles: TPendingImagesRailStyles
  }
  handsFreeStatus: THandsFreeControls["status"]
  handsFreeControls: Omit<THandsFreeControls, "status"> & {
    styles: THandsFreeControlsStyles
  }
  imageAttachmentControl: TImageAttachmentControl & {
    style: TAccessoryButtonStyle
    activeStyle: TAccessoryButtonActiveStyle | undefined
  }
  textToSpeechControl: TTextToSpeechControl & {
    style: TAccessoryButtonStyle
    activeStyle: TAccessoryButtonActiveStyle | undefined
  }
  editBeforeSendControl: TEditBeforeSendControl & {
    style: TAccessoryButtonStyle
    activeStyle: TAccessoryButtonActiveStyle | undefined
  }
  textEntry: TTextEntry & {
    styles: TTextEntryStyles
  }
  queueAction: TQueueAction & {
    styles: TQueueActionStyles
  }
  submitAction: TSubmitAction & {
    styles: TSubmitActionStyles
  }
  micButton: TMicButton & {
    styles: TMicButtonStyles
  }
  inputDock: {
    micWrapperRef: TMicWrapperRef | undefined
    styles: TInputDockStyles
  }
}

export interface ChatRuntimeConversationBodyPanelMobilePropsPartsInput<
  TContent extends { expanded: object; collapsed: object } = { expanded: object; collapsed: object },
  TToolExecutionStack extends object = Record<string, never>,
  TStandaloneActions extends object = Record<string, never>,
  TContentRowStyle = unknown,
  TExpandedBodyStyle = unknown,
  TStreamingStyles = unknown,
  TCollapsedStyle = unknown,
  TCollapsedPressedStyle = unknown,
  TCollapsedTextStyle = unknown,
  TToolExecutionStackStyles = unknown,
  TStandaloneActionsRowStyle = unknown,
> {
  conversation: {
    content: TContent
    toolExecutionStack: TToolExecutionStack
    standaloneActions: TStandaloneActions
  }
  styles: {
    content: {
      rowStyle: TContentRowStyle
      expandedBodyStyle: TExpandedBodyStyle
      streamingStyles: TStreamingStyles
      collapsedStyle: TCollapsedStyle
      collapsedPressedStyle: TCollapsedPressedStyle
      collapsedTextStyle: TCollapsedTextStyle
    }
    toolExecutionStack: TToolExecutionStackStyles
    standaloneActions: {
      rowStyle?: TStandaloneActionsRowStyle
    }
  }
}

export interface ChatRuntimeConversationBodyPanelMobilePropsParts<
  TContent extends { expanded: object; collapsed: object } = { expanded: object; collapsed: object },
  TToolExecutionStack extends object = Record<string, never>,
  TStandaloneActions extends object = Record<string, never>,
  TContentRowStyle = unknown,
  TExpandedBodyStyle = unknown,
  TStreamingStyles = unknown,
  TCollapsedStyle = unknown,
  TCollapsedPressedStyle = unknown,
  TCollapsedTextStyle = unknown,
  TToolExecutionStackStyles = unknown,
  TStandaloneActionsRowStyle = unknown,
> {
  content: TContent & {
    rowStyle: TContentRowStyle
    expanded: TContent["expanded"] & {
      bodyStyle: TExpandedBodyStyle
      streamingStyles: TStreamingStyles
    }
    collapsed: TContent["collapsed"] & {
      style: TCollapsedStyle
      pressedStyle: TCollapsedPressedStyle
      textStyle: TCollapsedTextStyle
    }
  }
  toolExecutionStack: TToolExecutionStack & {
    styles: TToolExecutionStackStyles
  }
  standaloneActions: TStandaloneActions & {
    rowStyle: TStandaloneActionsRowStyle | undefined
  }
}

export interface ChatRuntimeConversationThreadBodyStatusPanelMobilePropsPartsInput<
  TRetryStatus extends object = Record<string, never>,
  TDelegationCard extends object = Record<string, never>,
  TToolApproval extends object = Record<string, never>,
  TInlineActivity extends object = Record<string, never>,
  TRetryStatusStyles = unknown,
  TDelegationCardStyles = unknown,
  TToolApprovalStyles = unknown,
  TInlineActivityStyle = unknown,
  TInlineActivitySpinnerStyle = unknown,
> {
  retryStatus?: TRetryStatus | null
  delegationCard?: TDelegationCard | null
  toolApproval?: TToolApproval | null
  inlineActivity?: TInlineActivity | null
  styles: {
    retryStatus: TRetryStatusStyles
    delegationCard: TDelegationCardStyles
    toolApproval: TToolApprovalStyles
    inlineActivity: {
      style: TInlineActivityStyle
      spinnerStyle: TInlineActivitySpinnerStyle
    }
  }
}

export interface ChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
  TRetryStatus extends object = Record<string, never>,
  TDelegationCard extends object = Record<string, never>,
  TToolApproval extends object = Record<string, never>,
  TInlineActivity extends object = Record<string, never>,
  TRetryStatusStyles = unknown,
  TDelegationCardStyles = unknown,
  TToolApprovalStyles = unknown,
  TInlineActivityStyle = unknown,
  TInlineActivitySpinnerStyle = unknown,
> {
  retryStatus: (TRetryStatus & {
    styles: TRetryStatusStyles
  }) | null
  delegationCard: (TDelegationCard & {
    styles: TDelegationCardStyles
  }) | null
  toolApproval: (TToolApproval & {
    styles: TToolApprovalStyles
  }) | null
  inlineActivity: (TInlineActivity & {
    style: TInlineActivityStyle
    spinnerStyle: TInlineActivitySpinnerStyle
  }) | null
}

export interface ChatRuntimeConversationThreadBodyMobilePropsPartsInput<
  TRetryStatus extends object = Record<string, never>,
  TDelegationCard extends object = Record<string, never>,
  TToolApproval extends object = Record<string, never>,
  TInlineActivity extends object = Record<string, never>,
  TContent extends { expanded: object; collapsed: object } = { expanded: object; collapsed: object },
  TToolExecutionStack extends object = Record<string, never>,
  TStandaloneActions extends object = Record<string, never>,
  TRetryStatusStyles = unknown,
  TDelegationCardStyles = unknown,
  TToolApprovalStyles = unknown,
  TInlineActivityStyle = unknown,
  TInlineActivitySpinnerStyle = unknown,
  TContentRowStyle = unknown,
  TExpandedBodyStyle = unknown,
  TStreamingStyles = unknown,
  TCollapsedStyle = unknown,
  TCollapsedPressedStyle = unknown,
  TCollapsedTextStyle = unknown,
  TToolExecutionStackStyles = unknown,
  TStandaloneActionsRowStyle = unknown,
> {
  bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode
  retryStatus?: TRetryStatus | null
  delegationCard?: TDelegationCard | null
  toolApproval?: TToolApproval | null
  inlineActivity?: TInlineActivity | null
  conversation: ChatRuntimeConversationBodyPanelMobilePropsPartsInput<
    TContent,
    TToolExecutionStack,
    TStandaloneActions,
    TContentRowStyle,
    TExpandedBodyStyle,
    TStreamingStyles,
    TCollapsedStyle,
    TCollapsedPressedStyle,
    TCollapsedTextStyle,
    TToolExecutionStackStyles,
    TStandaloneActionsRowStyle
  >["conversation"]
  styles:
    & ChatRuntimeConversationThreadBodyStatusPanelMobilePropsPartsInput<
      TRetryStatus,
      TDelegationCard,
      TToolApproval,
      TInlineActivity,
      TRetryStatusStyles,
      TDelegationCardStyles,
      TToolApprovalStyles,
      TInlineActivityStyle,
      TInlineActivitySpinnerStyle
    >["styles"]
    & ChatRuntimeConversationBodyPanelMobilePropsPartsInput<
      TContent,
      TToolExecutionStack,
      TStandaloneActions,
      TContentRowStyle,
      TExpandedBodyStyle,
      TStreamingStyles,
      TCollapsedStyle,
      TCollapsedPressedStyle,
      TCollapsedTextStyle,
      TToolExecutionStackStyles,
      TStandaloneActionsRowStyle
    >["styles"]
}

export interface ChatRuntimeConversationThreadBodyMobilePropsParts<
  TRetryStatus extends object = Record<string, never>,
  TDelegationCard extends object = Record<string, never>,
  TToolApproval extends object = Record<string, never>,
  TInlineActivity extends object = Record<string, never>,
  TContent extends { expanded: object; collapsed: object } = { expanded: object; collapsed: object },
  TToolExecutionStack extends object = Record<string, never>,
  TStandaloneActions extends object = Record<string, never>,
  TRetryStatusStyles = unknown,
  TDelegationCardStyles = unknown,
  TToolApprovalStyles = unknown,
  TInlineActivityStyle = unknown,
  TInlineActivitySpinnerStyle = unknown,
  TContentRowStyle = unknown,
  TExpandedBodyStyle = unknown,
  TStreamingStyles = unknown,
  TCollapsedStyle = unknown,
  TCollapsedPressedStyle = unknown,
  TCollapsedTextStyle = unknown,
  TToolExecutionStackStyles = unknown,
  TStandaloneActionsRowStyle = unknown,
> {
  retryStatus: ChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
    TRetryStatus,
    TDelegationCard,
    TToolApproval,
    TInlineActivity,
    TRetryStatusStyles,
    TDelegationCardStyles,
    TToolApprovalStyles,
    TInlineActivityStyle,
    TInlineActivitySpinnerStyle
  >["retryStatus"]
  delegationCard: ChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
    TRetryStatus,
    TDelegationCard,
    TToolApproval,
    TInlineActivity,
    TRetryStatusStyles,
    TDelegationCardStyles,
    TToolApprovalStyles,
    TInlineActivityStyle,
    TInlineActivitySpinnerStyle
  >["delegationCard"]
  toolApproval: ChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
    TRetryStatus,
    TDelegationCard,
    TToolApproval,
    TInlineActivity,
    TRetryStatusStyles,
    TDelegationCardStyles,
    TToolApprovalStyles,
    TInlineActivityStyle,
    TInlineActivitySpinnerStyle
  >["toolApproval"]
  inlineActivity: ChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
    TRetryStatus,
    TDelegationCard,
    TToolApproval,
    TInlineActivity,
    TRetryStatusStyles,
    TDelegationCardStyles,
    TToolApprovalStyles,
    TInlineActivityStyle,
    TInlineActivitySpinnerStyle
  >["inlineActivity"]
  conversation: ChatRuntimeConversationBodyPanelMobilePropsParts<
    TContent,
    TToolExecutionStack,
    TStandaloneActions,
    TContentRowStyle,
    TExpandedBodyStyle,
    TStreamingStyles,
    TCollapsedStyle,
    TCollapsedPressedStyle,
    TCollapsedTextStyle,
    TToolExecutionStackStyles,
    TStandaloneActionsRowStyle
  >["content"] | null
  toolExecutionStack: ChatRuntimeConversationBodyPanelMobilePropsParts<
    TContent,
    TToolExecutionStack,
    TStandaloneActions,
    TContentRowStyle,
    TExpandedBodyStyle,
    TStreamingStyles,
    TCollapsedStyle,
    TCollapsedPressedStyle,
    TCollapsedTextStyle,
    TToolExecutionStackStyles,
    TStandaloneActionsRowStyle
  >["toolExecutionStack"] | null
  standaloneActions: ChatRuntimeConversationBodyPanelMobilePropsParts<
    TContent,
    TToolExecutionStack,
    TStandaloneActions,
    TContentRowStyle,
    TExpandedBodyStyle,
    TStreamingStyles,
    TCollapsedStyle,
    TCollapsedPressedStyle,
    TCollapsedTextStyle,
    TToolExecutionStackStyles,
    TStandaloneActionsRowStyle
  >["standaloneActions"] | null
}

export type ChatRuntimeToolActivityGroupHeaderMobileKind = "collapsed" | "expanded"

export type ChatRuntimeToolActivityGroupBoundaryMobileKind =
  ChatRuntimeToolActivityGroupHeaderMobileKind | "footer"

export interface ChatRuntimeToolActivityGroupToggleMobileStyleSlots {
  container: unknown
  pressed: unknown
  headerRow: unknown
  countBadge: unknown
  countBadgeText: unknown
  previewLine: unknown
}

export interface ChatRuntimeToolActivityGroupFooterMobileStyleSlots {
  button: unknown
  pressed: unknown
  text: unknown
}

export interface ChatRuntimeToolActivityGroupToggleMobileRenderStateParts {
  collapsedHeader: {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
  }
  expandedHeader: {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
  }
  summary: {
    shouldShowToolCallCount: boolean
    toolCallCountLabel: string
    toolCallCount: unknown
    previewText: string
  }
  leadingIcon: unknown
  headerToggleIcon: unknown
  surface: {
    preview: {
      numberOfLines: unknown
      ellipsizeMode: unknown
    }
  }
}

export interface ChatRuntimeToolActivityGroupFooterMobileRenderStateParts {
  footerButton: {
    accessibilityRole: unknown
    accessibilityLabel: string
    label: string
  }
  footerToggleIcon: unknown
}

export interface ChatRuntimeToolActivityGroupToggleMobilePropsPartsInput<
  TRenderState extends ChatRuntimeToolActivityGroupToggleMobileRenderStateParts =
    Pick<
      ToolActivityGroupMobileRenderState,
      "collapsedHeader" | "expandedHeader" | "summary" | "leadingIcon" | "headerToggleIcon" | "surface"
    >,
  TOnPress = unknown,
  TStyles extends ChatRuntimeToolActivityGroupToggleMobileStyleSlots =
    ChatRuntimeToolActivityGroupToggleMobileStyleSlots,
> {
  renderState: TRenderState
  headerKind: ChatRuntimeToolActivityGroupHeaderMobileKind
  onPress?: TOnPress
  styles: TStyles
}

export interface ChatRuntimeToolActivityGroupToggleMobilePropsParts<
  TRenderState extends ChatRuntimeToolActivityGroupToggleMobileRenderStateParts =
    Pick<
      ToolActivityGroupMobileRenderState,
      "collapsedHeader" | "expandedHeader" | "summary" | "leadingIcon" | "headerToggleIcon" | "surface"
    >,
  TOnPress = unknown,
  TStyles extends ChatRuntimeToolActivityGroupToggleMobileStyleSlots =
    ChatRuntimeToolActivityGroupToggleMobileStyleSlots,
> {
  headerState: TRenderState["collapsedHeader"] | TRenderState["expandedHeader"]
  pressable: {
    onPress: TOnPress | undefined
    accessibilityRole: TRenderState["collapsedHeader"]["accessibilityRole"] | TRenderState["expandedHeader"]["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: TRenderState["collapsedHeader"]["accessibilityState"] | TRenderState["expandedHeader"]["accessibilityState"]
    ariaExpanded: TRenderState["collapsedHeader"]["ariaExpanded"] | TRenderState["expandedHeader"]["ariaExpanded"]
    style: (state: { pressed: boolean }) => Array<TStyles["container"] | TStyles["pressed"] | false>
  }
  headerRow: {
    style: TStyles["headerRow"]
  }
  leadingIcon: TRenderState["leadingIcon"]
  countBadge: {
    accessibilityLabel: string
    style: TStyles["countBadge"]
    label: {
      style: TStyles["countBadgeText"]
      text: TRenderState["summary"]["toolCallCount"]
    }
  } | null
  preview: {
    style: TStyles["previewLine"]
    numberOfLines: TRenderState["surface"]["preview"]["numberOfLines"]
    ellipsizeMode: TRenderState["surface"]["preview"]["ellipsizeMode"]
    text: string
  }
  toggleIcon: TRenderState["headerToggleIcon"]
}

export interface ChatRuntimeToolActivityGroupFooterMobilePropsPartsInput<
  TRenderState extends ChatRuntimeToolActivityGroupFooterMobileRenderStateParts =
    Pick<ToolActivityGroupMobileRenderState, "footerButton" | "footerToggleIcon">,
  TOnPress = unknown,
  TStyles extends ChatRuntimeToolActivityGroupFooterMobileStyleSlots =
    ChatRuntimeToolActivityGroupFooterMobileStyleSlots,
> {
  renderState: TRenderState
  onPress?: TOnPress
  styles: TStyles
}

export interface ChatRuntimeToolActivityGroupFooterMobilePropsParts<
  TRenderState extends ChatRuntimeToolActivityGroupFooterMobileRenderStateParts =
    Pick<ToolActivityGroupMobileRenderState, "footerButton" | "footerToggleIcon">,
  TOnPress = unknown,
  TStyles extends ChatRuntimeToolActivityGroupFooterMobileStyleSlots =
    ChatRuntimeToolActivityGroupFooterMobileStyleSlots,
> {
  button: {
    onPress: TOnPress | undefined
    accessibilityRole: TRenderState["footerButton"]["accessibilityRole"]
    accessibilityLabel: string
    style: (state: { pressed: boolean }) => Array<TStyles["button"] | TStyles["pressed"] | false>
  }
  icon: TRenderState["footerToggleIcon"]
  label: {
    style: TStyles["text"]
    text: string
  }
}

export interface ChatRuntimeToolActivityGroupBoundaryMobilePropsPartsInput<
  TRenderState = ToolActivityGroupMobileRenderState,
  TOnPress = unknown,
  TToggleStyles = unknown,
  TFooterStyles = unknown,
> {
  renderState: TRenderState
  kind: ChatRuntimeToolActivityGroupBoundaryMobileKind
  onPress?: TOnPress
  styles: {
    toggle: TToggleStyles
    footer: TFooterStyles
  }
}

export interface ChatRuntimeToolActivityGroupBoundaryMobilePropsParts<
  TRenderState = ToolActivityGroupMobileRenderState,
  TOnPress = unknown,
  TToggleStyles = unknown,
  TFooterStyles = unknown,
> {
  toggle: ({
    renderState: TRenderState
    headerKind: ChatRuntimeToolActivityGroupHeaderMobileKind
    onPress: TOnPress | undefined
    styles: TToggleStyles
  }) | null
  footer: ({
    renderState: TRenderState
    onPress: TOnPress | undefined
    styles: TFooterStyles
  }) | null
}

export interface ChatRuntimeToolActivityGroupThreadSurfaceMobilePropsPartsInput<
  TGroupRenderState extends {
    shouldRenderExpandedHeader?: boolean
    shouldRenderExpandedFooter?: boolean
  } = {
    shouldRenderExpandedHeader?: boolean
    shouldRenderExpandedFooter?: boolean
  },
  TOnToggleGroup = unknown,
  TSurfaceStyle = unknown,
  TSurfaceToneStyle = unknown,
  TBoundaryStyles = unknown,
> {
  groupRenderState?: TGroupRenderState | null
  onToggleGroup?: TOnToggleGroup
  surfaceToneStyle?: TSurfaceToneStyle
  styles: {
    surfaceStyle: TSurfaceStyle
    boundary: TBoundaryStyles
  }
}

export interface ChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts<
  TGroupRenderState extends {
    shouldRenderExpandedHeader?: boolean
    shouldRenderExpandedFooter?: boolean
  } = {
    shouldRenderExpandedHeader?: boolean
    shouldRenderExpandedFooter?: boolean
  },
  TOnToggleGroup = unknown,
  TSurfaceStyle = unknown,
  TSurfaceToneStyle = unknown,
  TBoundaryStyles = unknown,
> {
  surface: {
    surfaceStyle: TSurfaceStyle
    surfaceToneStyle: TSurfaceToneStyle | undefined
  }
  leadingBoundary: ({
    renderState: TGroupRenderState
    kind: "expanded"
    onPress: TOnToggleGroup | undefined
    styles: TBoundaryStyles
  }) | null
  trailingBoundary: ({
    renderState: TGroupRenderState
    kind: "footer"
    onPress: TOnToggleGroup | undefined
    styles: TBoundaryStyles
  }) | null
}

export interface ChatRuntimeConversationRuntimeThreadMobilePropsPartsInput<
  TGroupRenderState extends {
    shouldSkipCollapsedItem?: boolean
    shouldRenderCollapsedHeader?: boolean
  } = {
    shouldSkipCollapsedItem?: boolean
    shouldRenderCollapsedHeader?: boolean
  },
  TBody extends { conversation: { surfaceToneStyleSlot: unknown } } = { conversation: { surfaceToneStyleSlot: unknown } },
  TOnToggleGroup = unknown,
  TBodyStyles = unknown,
  TSurfaceStyles extends {
    boundary: unknown
    getToneStyle: (toneStyleSlot: TBody["conversation"]["surfaceToneStyleSlot"]) => unknown
  } = {
    boundary: unknown
    getToneStyle: (toneStyleSlot: TBody["conversation"]["surfaceToneStyleSlot"]) => unknown
  },
  TToneStyle = ReturnType<TSurfaceStyles["getToneStyle"]>,
> {
  groupRenderState?: TGroupRenderState | null
  onToggleGroup?: TOnToggleGroup
  body?: TBody | null
  styles: {
    surface: TSurfaceStyles
    body: TBodyStyles
  }
}

export interface ChatRuntimeConversationRuntimeThreadMobilePropsParts<
  TGroupRenderState extends {
    shouldSkipCollapsedItem?: boolean
    shouldRenderCollapsedHeader?: boolean
  } = {
    shouldSkipCollapsedItem?: boolean
    shouldRenderCollapsedHeader?: boolean
  },
  TBody extends { conversation: { surfaceToneStyleSlot: unknown } } = { conversation: { surfaceToneStyleSlot: unknown } },
  TOnToggleGroup = unknown,
  TBodyStyles = unknown,
  TSurfaceStyles extends {
    boundary: unknown
    getToneStyle: (toneStyleSlot: TBody["conversation"]["surfaceToneStyleSlot"]) => unknown
  } = {
    boundary: unknown
    getToneStyle: (toneStyleSlot: TBody["conversation"]["surfaceToneStyleSlot"]) => unknown
  },
  TToneStyle = ReturnType<TSurfaceStyles["getToneStyle"]>,
> {
  shouldSkipThread: boolean
  collapsedBoundary: ({
    renderState: TGroupRenderState
    kind: "collapsed"
    onPress: TOnToggleGroup | undefined
    styles: TSurfaceStyles["boundary"]
  }) | null
  bodySurface: ({
    body: TBody
    surface: {
      surfaceToneStyle: TToneStyle
      groupRenderState: TGroupRenderState | null | undefined
      onToggleGroup: TOnToggleGroup | undefined
      styles: TSurfaceStyles
    }
    bodyStyles: TBodyStyles
  }) | null
}

export interface ChatRuntimeConversationRuntimeThreadListMobilePropsPartsInput<
  TThreadState extends {
    threadKey: ChatRuntimeConversationThreadKey
    shouldRenderThread: boolean
    groupRenderState: unknown
    onToggleGroup?: unknown
    body: unknown
  } = ChatRuntimeConversationRenderableRuntimeThreadState<unknown>,
  TStyles = unknown,
> {
  threadStates: readonly TThreadState[]
  styles: TStyles
}

export interface ChatRuntimeConversationRuntimeThreadListMobilePropsParts<
  TThreadState extends {
    threadKey: ChatRuntimeConversationThreadKey
    groupRenderState: unknown
    onToggleGroup?: unknown
    body: unknown
  } = ChatRuntimeConversationRenderableRuntimeThreadState<unknown>,
  TStyles = unknown,
> {
  threads: Array<{
    key: TThreadState["threadKey"]
    props: {
      groupRenderState: TThreadState["groupRenderState"]
      onToggleGroup: TThreadState["onToggleGroup"]
      body: TThreadState["body"]
      styles: TStyles
    }
  }>
}

export interface ChatRuntimeLoadingStateMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  },
  TSpinnerSource = unknown,
  TStyle = unknown,
  TSpinnerStyle = unknown,
> {
  renderState: TRenderState
  spinnerSource: TSpinnerSource
  style: TStyle
  spinnerStyle: TSpinnerStyle
}

export interface ChatRuntimeLoadingStateMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  },
  TSpinnerSource = unknown,
  TStyle = unknown,
  TSpinnerStyle = unknown,
> {
  shouldRenderLoadingState: boolean
  container: {
    accessible: true
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: TRenderState["accessibilityState"]
    style: TStyle
  }
  spinner: {
    source: TSpinnerSource
    style: TSpinnerStyle
    resizeMode: TRenderState["spinnerResizeMode"]
  }
}

export interface ChatRuntimeInlineActivityMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  },
  TSpinnerSource = unknown,
  TStyle = unknown,
  TSpinnerStyle = unknown,
> {
  renderState: TRenderState
  spinnerSource: TSpinnerSource
  style: TStyle
  spinnerStyle: TSpinnerStyle
}

export interface ChatRuntimeInlineActivityMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  },
  TSpinnerSource = unknown,
  TStyle = unknown,
  TSpinnerStyle = unknown,
> {
  shouldRenderInlineActivity: boolean
  container: {
    accessible: true
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityState: TRenderState["accessibilityState"]
    style: TStyle
  }
  spinner: {
    source: TSpinnerSource
    style: TSpinnerStyle
    resizeMode: TRenderState["spinnerResizeMode"]
  }
}

export interface ChatRuntimeConnectionBannerMobilePropsPartsInput<
  TRenderState extends {
    surface: {
      subtitleNumberOfLines: unknown
    }
    reconnecting: {
      shouldRender: boolean
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string | null
      spinner: unknown
    }
    failed: {
      shouldRender: boolean
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string
      icon: unknown
      retryButton: {
        accessibilityRole: unknown
        accessibilityLabel: string
        pressedOpacity: number
        label: string
      }
    }
  } = {
    surface: {
      subtitleNumberOfLines: unknown
    }
    reconnecting: {
      shouldRender: boolean
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string | null
      spinner: unknown
    }
    failed: {
      shouldRender: boolean
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string
      icon: unknown
      retryButton: {
        accessibilityRole: unknown
        accessibilityLabel: string
        pressedOpacity: number
        label: string
      }
    }
  },
  TOnRetry = unknown,
  TStyles extends {
    banner: unknown
    reconnecting: unknown
    failed: unknown
    content: unknown
    icon: unknown
    textContainer: unknown
    title: unknown
    subtitle: unknown
    retryButton: unknown
    retryButtonText: unknown
  } = {
    banner: unknown
    reconnecting: unknown
    failed: unknown
    content: unknown
    icon: unknown
    textContainer: unknown
    title: unknown
    subtitle: unknown
    retryButton: unknown
    retryButtonText: unknown
  },
> {
  renderState: TRenderState
  onRetry?: TOnRetry
  styles: TStyles
}

export interface ChatRuntimeConnectionBannerMobilePropsParts<
  TRenderState extends {
    surface: {
      subtitleNumberOfLines: unknown
    }
    reconnecting: {
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string | null
      spinner: unknown
    }
    failed: {
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string
      icon: unknown
      retryButton: {
        accessibilityRole: unknown
        accessibilityLabel: string
        pressedOpacity: number
        label: string
      }
    }
  } = {
    surface: {
      subtitleNumberOfLines: unknown
    }
    reconnecting: {
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string | null
      spinner: unknown
    }
    failed: {
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string
      icon: unknown
      retryButton: {
        accessibilityRole: unknown
        accessibilityLabel: string
        pressedOpacity: number
        label: string
      }
    }
  },
  TOnRetry = unknown,
  TStyles extends {
    banner: unknown
    reconnecting: unknown
    failed: unknown
    content: unknown
    icon: unknown
    textContainer: unknown
    title: unknown
    subtitle: unknown
    retryButton: unknown
    retryButtonText: unknown
  } = {
    banner: unknown
    reconnecting: unknown
    failed: unknown
    content: unknown
    icon: unknown
    textContainer: unknown
    title: unknown
    subtitle: unknown
    retryButton: unknown
    retryButtonText: unknown
  },
> {
  reconnecting: {
    container: {
      accessible: true
      accessibilityRole: TRenderState["reconnecting"]["accessibilityRole"]
      accessibilityLabel: string
      style: [TStyles["banner"], TStyles["reconnecting"]]
    }
    content: {
      style: TStyles["content"]
    }
    spinner: TRenderState["reconnecting"]["spinner"] & {
      style: TStyles["icon"]
    }
    textContainer: {
      style: TStyles["textContainer"]
    }
    title: {
      style: TStyles["title"]
      text: string
    }
    subtitle: {
      style: TStyles["subtitle"]
      numberOfLines: TRenderState["surface"]["subtitleNumberOfLines"]
      text: string
    } | null
  } | null
  failed: {
    container: {
      accessible: true
      accessibilityRole: TRenderState["failed"]["accessibilityRole"]
      accessibilityLabel: string
      style: [TStyles["banner"], TStyles["failed"]]
    }
    content: {
      style: TStyles["content"]
    }
    icon: TRenderState["failed"]["icon"] & {
      style: TStyles["icon"]
    }
    textContainer: {
      style: TStyles["textContainer"]
    }
    title: {
      style: TStyles["title"]
      text: string
    }
    subtitle: {
      style: TStyles["subtitle"]
      numberOfLines: TRenderState["surface"]["subtitleNumberOfLines"]
      text: string
    }
    retryButton: {
      style: TStyles["retryButton"]
      onPress?: TOnRetry
      accessibilityRole: TRenderState["failed"]["retryButton"]["accessibilityRole"]
      accessibilityLabel: string
      activeOpacity: number
    }
    retryLabel: {
      style: TStyles["retryButtonText"]
      text: string
    }
  } | null
}

export interface ChatRuntimeRetryStatusMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    spinner: unknown
    surface: {
      titleNumberOfLines: unknown
    }
    title: string
    attemptLabel: string
    countdownLabel: string
    description: string
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    spinner: unknown
    surface: {
      titleNumberOfLines: unknown
    }
    title: string
    attemptLabel: string
    countdownLabel: string
    description: string
  },
  TStyles extends {
    card: unknown
    header: unknown
    title: unknown
    metaRow: unknown
    attempt: unknown
    countdown: unknown
    description: unknown
  } = {
    card: unknown
    header: unknown
    title: unknown
    metaRow: unknown
    attempt: unknown
    countdown: unknown
    description: unknown
  },
> {
  renderState: TRenderState
  styles: TStyles
}

export interface ChatRuntimeRetryStatusMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    spinner: unknown
    surface: {
      titleNumberOfLines: unknown
    }
    title: string
    attemptLabel: string
    countdownLabel: string
    description: string
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    spinner: unknown
    surface: {
      titleNumberOfLines: unknown
    }
    title: string
    attemptLabel: string
    countdownLabel: string
    description: string
  },
  TStyles extends {
    card: unknown
    header: unknown
    title: unknown
    metaRow: unknown
    attempt: unknown
    countdown: unknown
    description: unknown
  } = {
    card: unknown
    header: unknown
    title: unknown
    metaRow: unknown
    attempt: unknown
    countdown: unknown
    description: unknown
  },
> {
  shouldRenderRetryStatus: boolean
  card: {
    accessible: true
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: TStyles["card"]
  }
  header: {
    style: TStyles["header"]
  }
  icon: TRenderState["icon"]
  title: {
    style: TStyles["title"]
    numberOfLines: TRenderState["surface"]["titleNumberOfLines"]
    text: string
  }
  spinner: TRenderState["spinner"]
  meta: {
    style: TStyles["metaRow"]
  }
  attempt: {
    style: TStyles["attempt"]
    text: string
  }
  countdown: {
    style: TStyles["countdown"]
    text: string
  }
  description: {
    style: TStyles["description"]
    text: string
  }
}

export interface ChatRuntimeTurnDurationBadgeMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    isLive: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
    badge: {
      numberOfLines: unknown
    }
  } = {
    shouldRender: boolean
    isLive: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
    badge: {
      numberOfLines: unknown
    }
  },
  TStyle = unknown,
  TLiveStyle = unknown,
  TTextStyle = unknown,
  TLiveTextStyle = unknown,
> {
  renderState: TRenderState
  style: TStyle
  liveStyle: TLiveStyle
  textStyle: TTextStyle
  liveTextStyle: TLiveTextStyle
}

export interface ChatRuntimeTurnDurationBadgeMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    isLive: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
    badge: {
      numberOfLines: unknown
    }
  } = {
    shouldRender: boolean
    isLive: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
    badge: {
      numberOfLines: unknown
    }
  },
  TStyle = unknown,
  TLiveStyle = unknown,
  TTextStyle = unknown,
  TLiveTextStyle = unknown,
> {
  shouldRenderBadge: boolean
  container: {
    accessible: true
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: TStyle
    liveStyle: TLiveStyle
    isLive: boolean
  }
  icon: TRenderState["icon"]
  label: {
    style: TTextStyle
    liveStyle: TLiveTextStyle
    isLive: boolean
    numberOfLines: TRenderState["badge"]["numberOfLines"]
    text: string
  }
}

export interface ChatRuntimeConversationExpandedContentMobilePropsPartsInput<
  TStreamingRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    content: string
    icon: {
      name: unknown
      size: unknown
      color: unknown
    }
    spinner: {
      resizeMode: unknown
    }
    surface: {
      titleNumberOfLines: unknown
    }
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    content: string
    icon: {
      name: unknown
      size: unknown
      color: unknown
    }
    spinner: {
      resizeMode: unknown
    }
    surface: {
      titleNumberOfLines: unknown
    }
  },
  TMarkdownContent = unknown,
  TAssetBaseUrl = unknown,
  TAssetAuthToken = unknown,
  TSpinnerSource = unknown,
  TStreamingStyles extends {
    header: unknown
    title: unknown
    spinner: unknown
    badge: unknown
    badgeText: unknown
    bodyRow: unknown
    text: unknown
    caret: unknown
  } = {
    header: unknown
    title: unknown
    spinner: unknown
    badge: unknown
    badgeText: unknown
    bodyRow: unknown
    text: unknown
    caret: unknown
  },
> {
  streamingRenderState: TStreamingRenderState
  markdownContent: TMarkdownContent
  assetBaseUrl?: TAssetBaseUrl
  assetAuthToken?: TAssetAuthToken
  spinnerSource: TSpinnerSource
  streamingStyles: TStreamingStyles
}

export interface ChatRuntimeConversationExpandedContentMobilePropsParts<
  TStreamingRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    content: string
    icon: {
      name: unknown
      size: unknown
      color: unknown
    }
    spinner: {
      resizeMode: unknown
    }
    surface: {
      titleNumberOfLines: unknown
    }
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    content: string
    icon: {
      name: unknown
      size: unknown
      color: unknown
    }
    spinner: {
      resizeMode: unknown
    }
    surface: {
      titleNumberOfLines: unknown
    }
  },
  TMarkdownContent = unknown,
  TAssetBaseUrl = unknown,
  TAssetAuthToken = unknown,
  TSpinnerSource = unknown,
  TStreamingStyles extends {
    header: unknown
    title: unknown
    spinner: unknown
    badge: unknown
    badgeText: unknown
    bodyRow: unknown
    text: unknown
    caret: unknown
  } = {
    header: unknown
    title: unknown
    spinner: unknown
    badge: unknown
    badgeText: unknown
    bodyRow: unknown
    text: unknown
    caret: unknown
  },
> {
  shouldRenderStreamingContent: boolean
  markdown: {
    content: TMarkdownContent
    assetBaseUrl?: TAssetBaseUrl
    assetAuthToken?: TAssetAuthToken
  }
  header: {
    accessible: true
    accessibilityRole: TStreamingRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: TStreamingStyles["header"]
  }
  icon: TStreamingRenderState["icon"]
  title: {
    style: TStreamingStyles["title"]
    numberOfLines: TStreamingRenderState["surface"]["titleNumberOfLines"]
    text: string
  }
  spinner: {
    source: TSpinnerSource
    style: TStreamingStyles["spinner"]
    resizeMode: TStreamingRenderState["spinner"]["resizeMode"]
  }
  badge: {
    style: TStreamingStyles["badge"]
  }
  badgeLabel: {
    style: TStreamingStyles["badgeText"]
    text: string
  }
  body: {
    style: TStreamingStyles["bodyRow"]
  }
  text: {
    style: TStreamingStyles["text"]
    text: string
  }
  caret: {
    style: TStreamingStyles["caret"]
  }
}

export interface ChatRuntimeConversationCollapsedPreviewMobilePropsPartsInput<
  TRenderState extends {
    accessibilityRole: unknown
    hitSlop: unknown
    numberOfLines: unknown
    text: string
  } = {
    accessibilityRole: unknown
    hitSlop: unknown
    numberOfLines: unknown
    text: string
  },
  TActionState extends {
    disabled: boolean
    accessibilityLabel: string
    accessibilityHint?: string
    accessibilityState: unknown
    ariaExpanded: unknown
  } = {
    disabled: boolean
    accessibilityLabel: string
    accessibilityHint?: string
    accessibilityState: unknown
    ariaExpanded: unknown
  },
  TOnPress = unknown,
  TStyle = unknown,
  TPressedStyle = unknown,
  TTextStyle = unknown,
> {
  renderState: TRenderState
  actionState: TActionState
  onPress?: TOnPress
  style: TStyle
  pressedStyle?: TPressedStyle
  textStyle: TTextStyle
}

export interface ChatRuntimeConversationCollapsedPreviewMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    hitSlop: unknown
    numberOfLines: unknown
    text: string
  } = {
    accessibilityRole: unknown
    hitSlop: unknown
    numberOfLines: unknown
    text: string
  },
  TActionState extends {
    disabled: boolean
    accessibilityLabel: string
    accessibilityHint?: string
    accessibilityState: unknown
    ariaExpanded: unknown
  } = {
    disabled: boolean
    accessibilityLabel: string
    accessibilityHint?: string
    accessibilityState: unknown
    ariaExpanded: unknown
  },
  TOnPress = unknown,
  TStyle = unknown,
  TPressedStyle = unknown,
  TTextStyle = unknown,
> {
  pressable: {
    onPress?: TOnPress
    disabled: boolean
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    accessibilityHint?: string
    accessibilityState: TActionState["accessibilityState"]
    ariaExpanded: TActionState["ariaExpanded"]
    hitSlop: TRenderState["hitSlop"]
    style: (state: { pressed: boolean }) => Array<
      | TStyle
      | TPressedStyle
      | false
      | undefined
    >
  }
  text: {
    style: TTextStyle
    numberOfLines: TRenderState["numberOfLines"]
    text: string
  }
}

export interface ChatRuntimeMessageHistoryBannerMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    summaryLabel: string
    loadButton: {
      accessibilityRole: unknown
      accessibilityLabel: string
      label: string
      icon: unknown
    }
  } = {
    shouldRender: boolean
    summaryLabel: string
    loadButton: {
      accessibilityRole: unknown
      accessibilityLabel: string
      label: string
      icon: unknown
    }
  },
  TOnLoadEarlier = unknown,
  TStyles extends {
    container: unknown
    summary: unknown
    loadButton: unknown
    loadButtonPressed: unknown
    loadButtonText: unknown
  } = {
    container: unknown
    summary: unknown
    loadButton: unknown
    loadButtonPressed: unknown
    loadButtonText: unknown
  },
> {
  renderState: TRenderState
  onLoadEarlier?: TOnLoadEarlier
  styles: TStyles
}

export interface ChatRuntimeMessageHistoryBannerMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    summaryLabel: string
    loadButton: {
      accessibilityRole: unknown
      accessibilityLabel: string
      label: string
      icon: unknown
    }
  } = {
    shouldRender: boolean
    summaryLabel: string
    loadButton: {
      accessibilityRole: unknown
      accessibilityLabel: string
      label: string
      icon: unknown
    }
  },
  TOnLoadEarlier = unknown,
  TStyles extends {
    container: unknown
    summary: unknown
    loadButton: unknown
    loadButtonPressed: unknown
    loadButtonText: unknown
  } = {
    container: unknown
    summary: unknown
    loadButton: unknown
    loadButtonPressed: unknown
    loadButtonText: unknown
  },
> {
  shouldRenderBanner: boolean
  container: {
    style: TStyles["container"]
  }
  summary: {
    style: TStyles["summary"]
    text: string
  }
  loadButton: {
    onPress: TOnLoadEarlier | undefined
    accessibilityRole: TRenderState["loadButton"]["accessibilityRole"]
    accessibilityLabel: string
    style: TStyles["loadButton"]
    pressedStyle: TStyles["loadButtonPressed"]
  }
  icon: TRenderState["loadButton"]["icon"]
  loadButtonLabel: {
    style: TStyles["loadButtonText"]
    text: string
  }
}

export interface ChatRuntimeStepSummaryCardMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    actionSummary: string
    meta: string
    preview: string
    surface: {
      titleNumberOfLines: unknown
      badgeNumberOfLines: unknown
      actionNumberOfLines: unknown
      metaNumberOfLines: unknown
      previewNumberOfLines: unknown
    }
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    actionSummary: string
    meta: string
    preview: string
    surface: {
      titleNumberOfLines: unknown
      badgeNumberOfLines: unknown
      actionNumberOfLines: unknown
      metaNumberOfLines: unknown
      previewNumberOfLines: unknown
    }
  },
  TStyles extends {
    card: unknown
    header: unknown
    title: unknown
    badge: unknown
    badgeText: unknown
    action: unknown
    meta: unknown
    preview: unknown
  } = {
    card: unknown
    header: unknown
    title: unknown
    badge: unknown
    badgeText: unknown
    action: unknown
    meta: unknown
    preview: unknown
  },
> {
  renderState: TRenderState
  styles: TStyles
}

export interface ChatRuntimeStepSummaryCardMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    actionSummary: string
    meta: string
    preview: string
    surface: {
      titleNumberOfLines: unknown
      badgeNumberOfLines: unknown
      actionNumberOfLines: unknown
      metaNumberOfLines: unknown
      previewNumberOfLines: unknown
    }
  } = {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    actionSummary: string
    meta: string
    preview: string
    surface: {
      titleNumberOfLines: unknown
      badgeNumberOfLines: unknown
      actionNumberOfLines: unknown
      metaNumberOfLines: unknown
      previewNumberOfLines: unknown
    }
  },
  TStyles extends {
    card: unknown
    header: unknown
    title: unknown
    badge: unknown
    badgeText: unknown
    action: unknown
    meta: unknown
    preview: unknown
  } = {
    card: unknown
    header: unknown
    title: unknown
    badge: unknown
    badgeText: unknown
    action: unknown
    meta: unknown
    preview: unknown
  },
> {
  shouldRenderCard: boolean
  card: {
    accessible: true
    accessibilityRole: TRenderState["accessibilityRole"]
    accessibilityLabel: string
    style: TStyles["card"]
  }
  header: {
    style: TStyles["header"]
  }
  title: {
    style: TStyles["title"]
    numberOfLines: TRenderState["surface"]["titleNumberOfLines"]
    text: string
  }
  badge: {
    style: TStyles["badge"]
  }
  badgeLabel: {
    style: TStyles["badgeText"]
    numberOfLines: TRenderState["surface"]["badgeNumberOfLines"]
    text: string
  }
  action: {
    style: TStyles["action"]
    numberOfLines: TRenderState["surface"]["actionNumberOfLines"]
    text: string
  }
  meta: {
    style: TStyles["meta"]
    numberOfLines: TRenderState["surface"]["metaNumberOfLines"]
    text: string
  }
  preview: {
    shouldRender: boolean
    style: TStyles["preview"]
    numberOfLines: TRenderState["surface"]["previewNumberOfLines"]
    text: string
  }
}

export interface ChatRuntimeConversationViewportMobilePropsPartsInput<
  TLoadingState extends object = Record<string, never>,
  THomeQuickStarts extends object = Record<string, never>,
  THistoryBanner extends object = Record<string, never>,
  TStepSummary extends object = Record<string, never>,
  TDebugPanels extends object = Record<string, never>,
  TScrollViewportStyle = unknown,
  TScrollViewportContentContainerStyle = unknown,
  TLoadingStateStyle = unknown,
  TLoadingStateSpinnerStyle = unknown,
  THomeQuickStartsStyles = unknown,
  THistoryBannerStyles = unknown,
  TStepSummaryStyles = unknown,
  TDebugPanelStyle = unknown,
  TDebugPanelTextStyle = unknown,
> {
  loadingState: TLoadingState
  homeQuickStarts: THomeQuickStarts
  historyBanner: THistoryBanner
  stepSummary: TStepSummary
  debugPanels: TDebugPanels
  styles: {
    scrollViewport: {
      style: TScrollViewportStyle
      contentContainerStyle: TScrollViewportContentContainerStyle
    }
    loadingState: {
      style: TLoadingStateStyle
      spinnerStyle: TLoadingStateSpinnerStyle
    }
    homeQuickStarts: THomeQuickStartsStyles
    historyBanner: THistoryBannerStyles
    stepSummary: TStepSummaryStyles
    debugPanels: {
      panelStyle: TDebugPanelStyle
      textStyle: TDebugPanelTextStyle
    }
  }
}

export interface ChatRuntimeConversationViewportMobilePropsParts<
  TLoadingState extends object = Record<string, never>,
  THomeQuickStarts extends object = Record<string, never>,
  THistoryBanner extends object = Record<string, never>,
  TStepSummary extends object = Record<string, never>,
  TDebugPanels extends object = Record<string, never>,
  TScrollViewportStyle = unknown,
  TScrollViewportContentContainerStyle = unknown,
  TLoadingStateStyle = unknown,
  TLoadingStateSpinnerStyle = unknown,
  THomeQuickStartsStyles = unknown,
  THistoryBannerStyles = unknown,
  TStepSummaryStyles = unknown,
  TDebugPanelStyle = unknown,
  TDebugPanelTextStyle = unknown,
> {
  scrollViewport: {
    style: TScrollViewportStyle
    contentContainerStyle: TScrollViewportContentContainerStyle
  }
  loadingState: TLoadingState & {
    style: TLoadingStateStyle
    spinnerStyle: TLoadingStateSpinnerStyle
  }
  homeQuickStarts: THomeQuickStarts & {
    styles: THomeQuickStartsStyles
  }
  historyBanner: THistoryBanner & {
    styles: THistoryBannerStyles
  }
  stepSummary: TStepSummary & {
    styles: TStepSummaryStyles
  }
  debugPanels: TDebugPanels & {
    panelStyle: TDebugPanelStyle
    textStyle: TDebugPanelTextStyle
  }
}

export interface ChatRuntimeConversationDockMobilePropsPartsInput<
  TResponseHistoryPanel extends object = Record<string, never>,
  TScrollToBottomButton extends object = Record<string, never>,
  TVoiceOverlay extends object = Record<string, never>,
  TQueuePanel extends object = Record<string, never>,
  TConnectionBanner extends object = Record<string, never>,
  TComposer extends object = Record<string, never>,
  TScrollToBottomButtonStyle = unknown,
  TVoiceOverlayStyles = unknown,
  TQueuePanelStyle = unknown,
  TConnectionBannerStyles = unknown,
  TComposerStyles = unknown,
> {
  responseHistoryPanel: TResponseHistoryPanel
  scrollToBottomButton: TScrollToBottomButton
  voiceOverlay: TVoiceOverlay
  queuePanel: TQueuePanel
  connectionBanner: TConnectionBanner
  composer: TComposer
  styles: {
    scrollToBottomButtonStyle: TScrollToBottomButtonStyle
    voiceOverlay: TVoiceOverlayStyles
    queuePanelStyle: TQueuePanelStyle
    connectionBanner: TConnectionBannerStyles
    composer: TComposerStyles
  }
}

export interface ChatRuntimeConversationDockMobilePropsParts<
  TResponseHistoryPanel extends object = Record<string, never>,
  TScrollToBottomButton extends object = Record<string, never>,
  TVoiceOverlay extends object = Record<string, never>,
  TQueuePanel extends object = Record<string, never>,
  TConnectionBanner extends object = Record<string, never>,
  TComposer extends object = Record<string, never>,
  TScrollToBottomButtonStyle = unknown,
  TVoiceOverlayStyles = unknown,
  TQueuePanelStyle = unknown,
  TConnectionBannerStyles = unknown,
  TComposerStyles = unknown,
> {
  responseHistoryPanel: TResponseHistoryPanel
  scrollToBottomButton: TScrollToBottomButton & {
    style: TScrollToBottomButtonStyle
  }
  voiceOverlay: TVoiceOverlay & {
    styles: TVoiceOverlayStyles
  }
  queuePanel: TQueuePanel & {
    style: TQueuePanelStyle
  }
  connectionBanner: TConnectionBanner & {
    styles: TConnectionBannerStyles
  }
  composer: TComposer & {
    styles: TComposerStyles
  }
}

export interface ChatRuntimeScrollToBottomButtonMobilePropsPartsInput<
  TRenderState extends {
    shouldRender: boolean
    button: {
      pressedOpacity: unknown
      accessibilityRole: unknown
      accessibilityLabel: string
      accessibilityHint: string
      icon: unknown
    }
  } = {
    shouldRender: boolean
    button: {
      pressedOpacity: unknown
      accessibilityRole: unknown
      accessibilityLabel: string
      accessibilityHint: string
      icon: unknown
    }
  },
  TOnPress = unknown,
  TStyle = unknown,
> {
  renderState: TRenderState
  onPress?: TOnPress
  style: TStyle
}

export interface ChatRuntimeScrollToBottomButtonMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    button: {
      pressedOpacity: unknown
      accessibilityRole: unknown
      accessibilityLabel: string
      accessibilityHint: string
      icon: unknown
    }
  } = {
    shouldRender: boolean
    button: {
      pressedOpacity: unknown
      accessibilityRole: unknown
      accessibilityLabel: string
      accessibilityHint: string
      icon: unknown
    }
  },
  TOnPress = unknown,
  TStyle = unknown,
> {
  shouldRenderButton: boolean
  button: {
    style: TStyle
    onPress: TOnPress | undefined
    activeOpacity: TRenderState["button"]["pressedOpacity"]
    accessibilityRole: TRenderState["button"]["accessibilityRole"]
    accessibilityLabel: string
    accessibilityHint: string
  }
  icon: TRenderState["button"]["icon"]
}

export interface ChatRuntimeConversationSurfaceMobilePropsPartsInput<
  TFrame extends object = Record<string, never>,
  TDock extends object = Record<string, never>,
  TOverlays extends object = Record<string, never>,
  TThreadList extends object = Record<string, never>,
  TViewport extends object = Record<string, never>,
  TFrameKeyboardAvoidingStyle = unknown,
  TFrameRootStyle = unknown,
  TDockStyles = unknown,
  TViewportStyles = unknown,
> {
  frame: TFrame
  dock: TDock
  overlays: TOverlays
  threadList: TThreadList
  viewport: TViewport
  styles: {
    frame: {
      keyboardAvoidingStyle: TFrameKeyboardAvoidingStyle
      rootStyle: TFrameRootStyle
    }
    dock: TDockStyles
    viewport: TViewportStyles
  }
}

export interface ChatRuntimeConversationSurfaceMobilePropsParts<
  TFrame extends object = Record<string, never>,
  TDock extends object = Record<string, never>,
  TOverlays extends object = Record<string, never>,
  TThreadList extends object = Record<string, never>,
  TViewport extends object = Record<string, never>,
  TFrameKeyboardAvoidingStyle = unknown,
  TFrameRootStyle = unknown,
  TDockStyles = unknown,
  TViewportStyles = unknown,
> {
  frame: TFrame & {
    keyboardAvoidingStyle: TFrameKeyboardAvoidingStyle
    rootStyle: TFrameRootStyle
  }
  dock: TDock & {
    styles: TDockStyles
  }
  overlays: TOverlays
  threadList: TThreadList
  viewport: TViewport & {
    styles: TViewportStyles
  }
}

export interface ChatRuntimeConversationActionSetMobileProps<TActionEntry> {
  entries: readonly TActionEntry[]
  shouldRenderActionSlots: boolean
  shouldRenderStandaloneActions: boolean
}

export interface ChatRuntimeConversationActionSetMobilePropsInput<TActionContent> {
  renderState: Pick<ChatRuntimeConversationMessageActionsMobileRenderState, "layout">
  components: ChatMessageActionSlotRenderMap<TActionContent>
}

export interface ChatRuntimeConversationActionComponentsMobileProps<
  TTurnDurationAction,
  TSpeechAction,
  TBranchAction,
  TCopyAction,
  TExpansionAction,
> {
  availability: ChatRuntimeConversationMessageActionsMobileRenderState["availability"]
  turnDuration: TTurnDurationAction & {
    renderState: ChatRuntimeConversationMessageActionsMobileRenderState["turnDuration"]
  }
  speech: Omit<TSpeechAction, "isSpeaking"> & {
    renderState: ChatRuntimeConversationMessageActionsMobileRenderState["speech"]
    isActive: boolean
  }
  branch: TBranchAction & {
    renderState: ChatRuntimeConversationMessageActionsMobileRenderState["branch"]
  }
  copy: Omit<TCopyAction, "isCopied"> & {
    renderState: ChatRuntimeConversationMessageActionsMobileRenderState["copy"]
    isActive: boolean
  }
  expansion: TExpansionAction & {
    renderState: ChatRuntimeConversationMessageActionsMobileRenderState["expansion"]
  }
}

export interface ChatRuntimeConversationActionComponentsMobilePropsInput<
  TTurnDurationAction,
  TSpeechAction extends { isSpeaking?: boolean },
  TBranchAction,
  TCopyAction extends { isCopied?: boolean },
  TExpansionAction,
> {
  renderState: ChatRuntimeConversationMessageActionsMobileRenderState
  turnDuration: TTurnDurationAction
  speech: TSpeechAction
  branch: TBranchAction
  copy: TCopyAction
  expansion: TExpansionAction
}

export interface ChatRuntimeConversationBodyContentMobileProps<
  TActionEntry,
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TCollapsedPreviewPress = () => void,
> {
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode
  shouldRenderActionSlots: boolean
  entries: readonly TActionEntry[]
  expanded: ChatRuntimeConversationExpandedContentMobileProps<
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken
  >
  collapsed: ChatRuntimeConversationCollapsedPreviewMobileProps<TCollapsedPreviewPress>
}

export interface ChatRuntimeConversationBodyMobileProps<
  TActionEntry,
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TCollapsedPreviewPress = () => void,
> {
  content: ChatRuntimeConversationBodyContentMobileProps<
    TActionEntry,
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken,
    TCollapsedPreviewPress
  >
  toolExecutionStack: ChatRuntimeConversationToolExecutionStackMobileProps
  standaloneActions: {
    shouldRender: boolean
    entries: readonly TActionEntry[]
  }
}

export interface ChatRuntimeConversationBodyMobilePropsInput<
  TActionEntry,
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TCollapsedPreviewPress = () => void,
> {
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode
  actionSet: ChatRuntimeConversationActionSetMobileProps<TActionEntry>
  expanded: ChatRuntimeConversationExpandedContentMobileProps<
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken
  >
  collapsed: ChatRuntimeConversationCollapsedPreviewMobileProps<TCollapsedPreviewPress>
  toolExecutionStack: ChatRuntimeConversationToolExecutionStackMobileState
}

export interface ChatRuntimeConversationThreadBodyMobileProps<
  TConversation,
  TInlineActivity = unknown,
> {
  bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode
  retryStatus: ChatRuntimeConversationRetryStatusMobileProps | null
  delegationCard: ChatRuntimeDelegationCardMobileProps | null
  toolApproval: ChatRuntimeConversationToolApprovalMobileProps | null
  inlineActivity: TInlineActivity | null
  conversation: TConversation
}

export interface ChatRuntimeConversationThreadBodyMobilePropsInput<
  TConversation,
  TInlineActivity = unknown,
> {
  bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode
  retryStatus: ChatRuntimeConversationRetryStatusMobileState
  delegationCard: ChatRuntimeConversationDelegationCardMobileState<
    ACPDelegationProgress | null | undefined
  >
  toolApproval: ChatRuntimeConversationToolApprovalMobileState
  inlineActivity?: TInlineActivity | null
  conversation: TConversation
}

export type ChatRuntimeConversationTurnDurationMobileState =
  Pick<ChatRuntimeTurnDurationMessageMobileRenderStateInput, "durationMs" | "isLive">

export interface ChatRuntimeConversationTurnDurationMobileStateInput<
  TTurnDuration extends ChatRuntimeConversationTurnDurationMobileState | undefined =
    ChatRuntimeConversationTurnDurationMobileState | undefined,
> {
  message: {
    timestamp?: number
  }
  byUserTimestamp: {
    get(timestamp: number): TTurnDuration | undefined
  }
}

export type ChatRuntimeConversationThreadBodyMobileMessageLike<
  TRetryInfo extends ChatRuntimeRetryInfoLike | null | undefined =
    ChatRuntimeRetryInfoLike | null | undefined,
  TDelegation = unknown,
> =
  & ChatRuntimeConversationMessageRenderContextMobileStateInput["message"]
  & ChatRuntimeConversationRetryStatusMobileStateInput<TRetryInfo>["message"]
  & ChatRuntimeConversationDelegationCardMobileStateInput<TDelegation>["message"]
  & ChatRuntimeConversationToolApprovalMobileStateInput["message"]
  & ChatRuntimeConversationToolExecutionStackMobileStateInput["message"]
  & ChatRuntimeConversationActionSetMobileStateInput["message"]
  & ChatRuntimeInlineActivityMobileMessageLike
  & {
    timestamp?: number
  }

export interface ChatRuntimeConversationThreadBodyMobileStateInput<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
  TContentColors = unknown,
  TSpinnerSource = unknown,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TRetryInfo extends ChatRuntimeRetryInfoLike | null | undefined =
    ChatRuntimeRetryInfoLike | null | undefined,
  TDelegation = unknown,
> {
  message: ChatRuntimeConversationThreadBodyMobileMessageLike<TRetryInfo, TDelegation>
  messageIndex: number
  renderContext: ChatRuntimeConversationMessageRenderContextMobileState
  turnDurationsByUserTimestamp: ChatRuntimeConversationTurnDurationMobileStateInput<
    ChatRuntimeConversationActionSetMobileStateInput<
      TTurnDurationStyle,
      TSpeechStyle,
      TBranchStyle,
      TCopyStyle,
      TExpansionStyle
    >["turnDuration"]
  >["byUserTimestamp"]
  conversationId?: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["conversationId"]
  pendingBranchMessageIndex?: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["pendingBranchMessageIndex"]
  isResponding: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["isResponding"]
  isSpeaking: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["isSpeaking"]
  isCopied: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["isCopied"]
  ttsEnabled: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["ttsEnabled"]
  colors:
    & ChatRuntimeConversationActionSetMobileStateInput<
      TTurnDurationStyle,
      TSpeechStyle,
      TBranchStyle,
      TCopyStyle,
      TExpansionStyle
    >["colors"]
    & ChatRuntimeConversationRetryStatusMobileStateInput<TRetryInfo>["colors"]
    & ChatRuntimeConversationDelegationCardMobileStateInput<TDelegation>["colors"]
    & ChatRuntimeConversationToolApprovalMobileStateInput["colors"]
    & ChatRuntimeConversationContentMobileStateInput<
      TContentColors & ChatRuntimeStreamingContentMobileRenderStateInput["colors"],
      TSpinnerSource,
      TAssetBaseUrl,
      TAssetAuthToken
    >["colors"]
    & ChatRuntimeConversationToolExecutionStackMobileStateInput<
      ChatRuntimeMessageThreadPresentationMobileRenderState["pendingToolResultRenderState"],
      ChatRuntimeMessageThreadPresentationMobileRenderState["toolExecutionEmptyStateRenderState"]
    >["colors"]
  actionStyles: ChatRuntimeConversationActionSetMobileStyleSlots<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >
  assetBaseUrl?: ChatRuntimeConversationContentMobileStateInput<
    TContentColors & ChatRuntimeStreamingContentMobileRenderStateInput["colors"],
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken
  >["assetBaseUrl"]
  assetAuthToken?: ChatRuntimeConversationContentMobileStateInput<
    TContentColors & ChatRuntimeStreamingContentMobileRenderStateInput["colors"],
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken
  >["assetAuthToken"]
  spinnerSource: TSpinnerSource
  presentation: ChatRuntimeMessageThreadPresentationMobileRenderState
  expandedDelegationConversationPreviews: ChatRuntimeConversationDelegationCardMobileStateInput<
    TDelegation
  >["expandedDelegationConversationPreviews"]
  expandedDelegationToolPreviews: ChatRuntimeConversationDelegationCardMobileStateInput<
    TDelegation
  >["expandedDelegationToolPreviews"]
  setExpandedDelegationConversationPreviews: ChatRuntimeConversationDelegationCardMobileStateInput<
    TDelegation
  >["setExpandedDelegationConversationPreviews"]
  setExpandedDelegationToolPreviews: ChatRuntimeConversationDelegationCardMobileStateInput<
    TDelegation
  >["setExpandedDelegationToolPreviews"]
  expandedToolApprovals: ChatRuntimeConversationToolApprovalMobileStateInput["expandedToolApprovals"]
  pendingApprovalResponseId?: ChatRuntimeConversationToolApprovalMobileStateInput["pendingApprovalResponseId"]
  onToggleToolApprovalArguments: ChatRuntimeConversationToolApprovalMobileStateInput["onToggleArguments"]
  onRespondToToolApproval: ChatRuntimeConversationToolApprovalMobileStateInput["onRespondToToolApproval"]
  expandedToolCalls: ChatRuntimeConversationToolExecutionStackMobileStateInput<
    ChatRuntimeMessageThreadPresentationMobileRenderState["pendingToolResultRenderState"],
    ChatRuntimeMessageThreadPresentationMobileRenderState["toolExecutionEmptyStateRenderState"]
  >["expandedToolCalls"]
  onToggleToolCall: ChatRuntimeConversationToolExecutionStackMobileStateInput<
    ChatRuntimeMessageThreadPresentationMobileRenderState["pendingToolResultRenderState"],
    ChatRuntimeMessageThreadPresentationMobileRenderState["toolExecutionEmptyStateRenderState"]
  >["onToggleToolCall"]
  onCopyToolPayload: ChatRuntimeConversationToolExecutionStackMobileStateInput<
    ChatRuntimeMessageThreadPresentationMobileRenderState["pendingToolResultRenderState"],
    ChatRuntimeMessageThreadPresentationMobileRenderState["toolExecutionEmptyStateRenderState"]
  >["onCopyPayload"]
  onSpeakMessage: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["onSpeakMessage"]
  onBranchMessage?: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["onBranchMessage"]
  onCopyMessage: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["onCopyMessage"]
  onToggleMessageExpansion: ChatRuntimeConversationActionSetMobileStateInput<
    TTurnDurationStyle,
    TSpeechStyle,
    TBranchStyle,
    TCopyStyle,
    TExpansionStyle
  >["onToggleMessageExpansion"]
}

export interface ChatRuntimeConversationThreadBodyMobileDisplayModeInput<
  TInlineActivity,
  TDelegation = unknown,
> {
  retryStatus: ChatRuntimeConversationRetryStatusMobileState
  delegationCard: Pick<
    ChatRuntimeConversationDelegationCardMobileState<TDelegation>,
    "isDelegation" | "delegation"
  >
  toolApproval: ChatRuntimeConversationToolApprovalMobileState
  inlineActivity: TInlineActivity
}

export interface ChatRuntimeConversationThreadBodyMobileState<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
  TContentColors = unknown,
  TSpinnerSource = unknown,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TRetryInfo extends ChatRuntimeRetryInfoLike | null | undefined =
    ChatRuntimeRetryInfoLike | null | undefined,
  TDelegation = unknown,
> {
  bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode
  retryStatus: ChatRuntimeConversationRetryStatusMobileState
  delegationCard: ChatRuntimeConversationDelegationCardMobileState<TDelegation>
  toolApproval: ChatRuntimeConversationToolApprovalMobileState
  inlineActivity: ChatRuntimeInlineActivityMobileIndicatorState<TSpinnerSource>
  conversation: ChatRuntimeConversationContentMobileState<
    TSpinnerSource,
    TAssetBaseUrl,
    TAssetAuthToken
  > & {
    surfaceToneStyleSlot: ChatRuntimeConversationSurfaceToneMobileStyleSlot
    actionSet: ChatRuntimeConversationActionSetMobileState<
      TTurnDurationStyle,
      TSpeechStyle,
      TBranchStyle,
      TCopyStyle,
      TExpansionStyle
    >
    toolExecutionStack: ChatRuntimeConversationToolExecutionStackMobileState
  }
}

export interface ChatRuntimeToolExecutionCompactPreviewMobileRowInput {
  key: string
  toolCall: ToolCall
  label?: string
  result?: ToolResult | null
  colors: ToolExecutionCompactMobileRenderStateInput["colors"]
}

export interface ChatRuntimeDelegationToolPreviewRowsMobileRenderStateInput {
  rows: readonly Pick<ChatRuntimeToolExecutionCompactPreviewMobileRowInput, "toolCall" | "label" | "result">[]
  colors: ChatRuntimeToolExecutionCompactPreviewMobileRowInput["colors"]
}

export interface ChatRuntimeDelegationToolPreviewMobileVisibilityRenderStateInput {
  displayToolCallCount?: number | null
}

export interface ChatRuntimeDelegationToolPreviewMobileVisibilityRenderState {
  shouldRender: boolean
}

export interface ChatRuntimeToolExecutionCompactPreviewMobileRowState {
  key: string
  preview: string
  renderState: ToolExecutionCompactMobileRenderState
}

export interface ChatRuntimeToolExecutionDetailMobileRowInput {
  key: string
  toolCall: ToolCall
  label?: string
  result?: ToolResult | null
  isExpanded: boolean
  colors: Parameters<typeof getToolExecutionDetailMobileHeaderRenderState>[0]["colors"]
  previewNumberOfLines: number
  pendingResultRenderState: ToolExecutionDetailMobilePendingResultRenderState
}

export interface ChatRuntimeToolExecutionDetailMobileRowInputSectionState {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState
  compactText?: string | null
  content: string
  isExpanded: boolean
  previewNumberOfLines: number
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState
}

export interface ChatRuntimeToolExecutionDetailMobileRowResultSectionState {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState
  resultBadge: ToolExecutionDetailMobileHeaderRenderState["resultBadge"]
  characterCountLabel: string
  resultCompactText?: string | null
  resultContent: string
  isExpanded: boolean
  previewNumberOfLines: number
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState
  errorRenderState: ToolExecutionDetailMobileSectionHeaderRenderState
  error?: string | null
  errorCopyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState
}

export interface ChatRuntimeToolExecutionDetailMobileRowState {
  key: string
  renderState: ToolExecutionDetailMobileHeaderRenderState
  toolName: string
  input: ChatRuntimeToolExecutionDetailMobileRowInputSectionState | null
  result: ChatRuntimeToolExecutionDetailMobileRowResultSectionState | null
  pendingResult: {
    renderState: ToolExecutionDetailMobilePendingResultRenderState
  } | null
}

export interface ChatRuntimeToolExecutionStackMobileRenderStateInput {
  displayToolCallCount: number
  results: Array<ToolResult | null | undefined>
  colors: Parameters<typeof getToolExecutionDetailMobileCollapseControlRenderState>[0]["colors"]
  emptyStateRenderState: ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState>
}

export interface ChatRuntimeToolExecutionStackMobileRenderState {
  shouldRender: boolean
  compact: {
    renderState: ReturnType<typeof getToolExecutionDetailMobileExpandControlRenderState>
  }
  expanded: {
    isPending: boolean
    allSuccess: boolean
    hasErrors: boolean
    topCollapseRenderState: ReturnType<typeof getToolExecutionDetailMobileCollapseControlRenderState>
    bottomCollapseRenderState: ReturnType<typeof getToolExecutionDetailMobileCollapseControlRenderState>
    emptyState: {
      shouldRender: boolean
      renderState: ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState>
    }
  }
}

export interface ChatRuntimeBranchActionInput {
  conversationId?: string | null
  role?: string | null
  branchMessageIndex?: number | null
  fallbackMessageIndex?: number | null
  pendingMessageIndex?: number | null
}

export interface ChatRuntimeBranchActionState {
  canBranch: boolean
  messageIndex: number | null
  isPending: boolean
  isDisabled: boolean
  accessibilityLabel: string | null
  accessibilityState: {
    disabled: boolean
  }
}

export interface ChatRuntimeResolvedAlertState {
  title: string
  message: string
}

export interface ChatMessageCopyFeedbackState {
  feedbackResetDelayMs: number
  failedTitle: string
  failedMessage: string
}

export interface ChatConversationHomePromptDeleteConfirmAlertState extends ChatRuntimeResolvedAlertState {
  cancelLabel: string
  deleteLabel: string
  webMessage: string
}

export interface ChatConversationHomePromptEditorSaveActionInput {
  draft: PredefinedPromptDraft
  isEditing: boolean
  isSaving: boolean
}

export interface ChatRuntimeBranchMobileAlertState {
  unavailable: {
    title: string
    message: string
  }
  created: {
    title: string
    message: string
  }
  failed: {
    title: string
    fallbackMessage: string
  }
}

export interface ChatRuntimeBranchMobileIconStateInput {
  isPending?: boolean
}

export interface ChatRuntimeBranchMobileIconState {
  isPending: boolean
  name: typeof CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.name
  size: number
  colorToken: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.branchColorToken
}

export interface ChatRuntimeBranchMobileRenderStateInput extends ChatRuntimeBranchActionInput {
  colors: ChatMessageActionMobileColorPalette
}

export interface ChatRuntimeBranchMobileRenderState extends ChatRuntimeBranchActionState {
  accessibilityRole: typeof CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole
  accessibilityLabel: string
  icon: {
    isPending: boolean
    name: ChatRuntimeBranchMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatRuntimeAgentSelectorMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.name
  size: number
  colorToken: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.colorToken
}

export interface ChatRuntimeAgentSelectorMobileActionState {
  label: string
  accessibilityRole: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.accessibilityRole
  pressedOpacity: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.pressedOpacity
  accessibilityLabel: string
  accessibilityHint: string
  icon: ChatRuntimeAgentSelectorMobileIconState
}

export type ChatRuntimeAgentSelectorMobileColorToken =
  | ChatRuntimeAgentSelectorMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.backgroundColorToken
  | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.colorToken

export type ChatRuntimeAgentSelectorMobileColorPalette =
  Readonly<Record<ChatRuntimeAgentSelectorMobileColorToken, string>>

export interface ChatRuntimeAgentSelectorMobileColors {
  chip: {
    backgroundColor: string
  }
  text: {
    color: string
  }
  icon: {
    color: string
  }
}

export interface ChatRuntimeAgentSelectorMobileRenderStateInput {
  agentLabel: string
  colors: ChatRuntimeAgentSelectorMobileColorPalette
}

export interface ChatRuntimeAgentSelectorMobileRenderState {
  label: ChatRuntimeAgentSelectorMobileActionState["label"]
  accessibilityRole: ChatRuntimeAgentSelectorMobileActionState["accessibilityRole"]
  pressedOpacity: ChatRuntimeAgentSelectorMobileActionState["pressedOpacity"]
  accessibilityLabel: ChatRuntimeAgentSelectorMobileActionState["accessibilityLabel"]
  accessibilityHint: ChatRuntimeAgentSelectorMobileActionState["accessibilityHint"]
  chip: ChatRuntimeAgentSelectorMobileColors["chip"]
  text: ChatRuntimeAgentSelectorMobileColors["text"]
  icon: {
    name: ChatRuntimeAgentSelectorMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatRuntimeBackMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.name
  size: number
  colorToken: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.backIcon.colorToken
}

export interface ChatRuntimeBackMobileActionState {
  accessibilityRole: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.accessibilityRole
  pressedOpacity: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.pressedOpacity
  accessibilityLabel: string
  accessibilityHint: string
  icon: ChatRuntimeBackMobileIconState
}

export type ChatRuntimeBackMobileColorToken = ChatRuntimeBackMobileIconState["colorToken"]

export type ChatRuntimeBackMobileColorPalette =
  Readonly<Record<ChatRuntimeBackMobileColorToken, string>>

export interface ChatRuntimeBackMobileColors {
  icon: {
    color: string
  }
}

export interface ChatRuntimeBackMobileRenderStateInput {
  colors: ChatRuntimeBackMobileColorPalette
}

export interface ChatRuntimeBackMobileRenderState {
  accessibilityRole: ChatRuntimeBackMobileActionState["accessibilityRole"]
  pressedOpacity: ChatRuntimeBackMobileActionState["pressedOpacity"]
  accessibilityLabel: ChatRuntimeBackMobileActionState["accessibilityLabel"]
  accessibilityHint: ChatRuntimeBackMobileActionState["accessibilityHint"]
  icon: {
    name: ChatRuntimeBackMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatRuntimePinMobileIconState {
  isPinned: boolean
  name:
    | typeof CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.pinnedName
    | typeof CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.unpinnedName
  size: number
  colorToken:
    | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.activeIconColorToken
    | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.inactiveIconColorToken
}

export interface ChatRuntimePinMobileActionState {
  isPinned: boolean
  accessibilityRole: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.accessibilityRole
  pressedOpacity: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.pressedOpacity
  accessibilityLabel: string
  accessibilityHint: string
  icon: ChatRuntimePinMobileIconState
}

export type ChatRuntimePinMobileColorToken =
  | ChatRuntimePinMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.borderColorToken
  | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.backgroundColorToken
  | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.activeBorderColorToken
  | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.activeBackgroundColorToken

export type ChatRuntimePinMobileColorPalette =
  Readonly<Record<ChatRuntimePinMobileColorToken, string>>

export interface ChatRuntimePinMobileColors {
  button: {
    borderColor: string
    backgroundColor: string
  }
  icon: {
    color: string
  }
}

export interface ChatRuntimePinMobileRenderStateInput {
  isPinned?: boolean
  colors: ChatRuntimePinMobileColorPalette
}

export interface ChatRuntimePinMobileRenderState {
  isPinned: boolean
  accessibilityRole: ChatRuntimePinMobileActionState["accessibilityRole"]
  pressedOpacity: ChatRuntimePinMobileActionState["pressedOpacity"]
  accessibilityLabel: ChatRuntimePinMobileActionState["accessibilityLabel"]
  accessibilityHint: ChatRuntimePinMobileActionState["accessibilityHint"]
  button: ChatRuntimePinMobileColors["button"]
  icon: {
    name: ChatRuntimePinMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatRuntimeHandsFreeMobileIconState {
  isEnabled: boolean
  name:
    | typeof CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.enabledName
    | typeof CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.disabledName
  size: number
  colorToken:
    | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.activeIconColorToken
    | typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.inactiveIconColorToken
}

export type ChatRuntimeHandsFreeMobileColorToken = ChatRuntimeHandsFreeMobileIconState["colorToken"]

export type ChatRuntimeHandsFreeMobileColorPalette =
  Readonly<Record<ChatRuntimeHandsFreeMobileColorToken, string>>

export interface ChatRuntimeHandsFreeMobileColors {
  icon: {
    color: string
  }
}

export interface ChatRuntimeHandsFreeMobileActionStateInput {
  isEnabled?: boolean
}

export interface ChatRuntimeHandsFreeMobileActionState {
  isEnabled: boolean
  accessibilityRole: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.accessibilityRole
  pressedOpacity: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.pressedOpacity
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityState: {
    checked: boolean
  }
  ariaChecked: boolean
  icon: ChatRuntimeHandsFreeMobileIconState
}

export interface ChatRuntimeHandsFreeMobileRenderStateInput extends ChatRuntimeHandsFreeMobileActionStateInput {
  colors: ChatRuntimeHandsFreeMobileColorPalette
}

export interface ChatRuntimeHandsFreeMobileRenderState {
  isEnabled: boolean
  accessibilityRole: ChatRuntimeHandsFreeMobileActionState["accessibilityRole"]
  pressedOpacity: ChatRuntimeHandsFreeMobileActionState["pressedOpacity"]
  accessibilityLabel: ChatRuntimeHandsFreeMobileActionState["accessibilityLabel"]
  accessibilityHint: ChatRuntimeHandsFreeMobileActionState["accessibilityHint"]
  accessibilityState: ChatRuntimeHandsFreeMobileActionState["accessibilityState"]
  ariaChecked: ChatRuntimeHandsFreeMobileActionState["ariaChecked"]
  icon: {
    name: ChatRuntimeHandsFreeMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatRuntimeKillSwitchMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.name
  size: number
  color: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.iconColor
}

export type ChatRuntimeKillSwitchMobileColorToken =
  typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.backgroundColorToken

export type ChatRuntimeKillSwitchMobileColorPalette =
  Readonly<Record<ChatRuntimeKillSwitchMobileColorToken, string>>

export interface ChatRuntimeKillSwitchMobileColors {
  button: {
    backgroundColor: string
  }
  icon: {
    color: string
  }
}

export interface ChatRuntimeKillSwitchMobileActionState {
  accessibilityRole: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.accessibilityRole
  pressedOpacity: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.pressedOpacity
  accessibilityLabel: string
  accessibilityHint: string
  icon: ChatRuntimeKillSwitchMobileIconState
}

export interface ChatRuntimeKillSwitchMobileRenderStateInput {
  colors: ChatRuntimeKillSwitchMobileColorPalette
}

export interface ChatRuntimeKillSwitchMobileRenderState {
  accessibilityRole: ChatRuntimeKillSwitchMobileActionState["accessibilityRole"]
  pressedOpacity: ChatRuntimeKillSwitchMobileActionState["pressedOpacity"]
  accessibilityLabel: ChatRuntimeKillSwitchMobileActionState["accessibilityLabel"]
  accessibilityHint: ChatRuntimeKillSwitchMobileActionState["accessibilityHint"]
  button: ChatRuntimeKillSwitchMobileColors["button"]
  icon: {
    name: ChatRuntimeKillSwitchMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatRuntimeKillSwitchMobileVisibilityRenderStateInput {
  conversationState?: AgentConversationState | null
}

export interface ChatRuntimeKillSwitchMobileVisibilityRenderState {
  shouldRender: boolean
}

export type ChatRuntimeHeaderMobileStyleColorToken =
  | ChatRuntimeAgentSelectorMobileColorToken
  | ChatRuntimePinMobileColorToken
  | ChatRuntimeKillSwitchMobileColorToken

export type ChatRuntimeHeaderMobileStyleColorPalette =
  Readonly<Record<ChatRuntimeHeaderMobileStyleColorToken, string>>

export interface ChatRuntimeHeaderMobileStyleRenderStateInput {
  colors: ChatRuntimeHeaderMobileStyleColorPalette
}

export interface ChatRuntimeHeaderMobileStyleRenderState {
  surface: typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile
  agentSelector: ChatRuntimeAgentSelectorMobileColors
  pinButton: {
    inactive: ChatRuntimePinMobileColors
    active: ChatRuntimePinMobileColors
  }
  killSwitchButton: ChatRuntimeKillSwitchMobileColors
}

type ChatRuntimeHeaderMobileSurfaceState = typeof CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile

export interface ChatRuntimeAgentSelectorMobileStyleSlotsInput {
  surface: Pick<
    ChatRuntimeHeaderMobileSurfaceState,
    "agentSelectorButton" | "agentSelectorChip" | "agentSelectorText"
  >
  colors: ChatRuntimeAgentSelectorMobileColors
}

export interface ChatRuntimeAgentSelectorMobileStyleSlots {
  button: {
    alignItems: ChatRuntimeHeaderMobileSurfaceState["agentSelectorButton"]["alignItems"]
    justifyContent: ChatRuntimeHeaderMobileSurfaceState["agentSelectorButton"]["justifyContent"]
    height: ChatRuntimeHeaderMobileSurfaceState["agentSelectorButton"]["height"]
    minHeight: number
  }
  chip: {
    flexDirection: ChatRuntimeHeaderMobileSurfaceState["agentSelectorChip"]["flexDirection"]
    alignItems: ChatRuntimeHeaderMobileSurfaceState["agentSelectorChip"]["alignItems"]
    backgroundColor: string
    maxWidth: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    gap: number
  }
  text: {
    fontSize: number
    color: string
    fontWeight: ChatRuntimeHeaderMobileSurfaceState["agentSelectorText"]["fontWeight"]
  }
}

export interface ChatRuntimeHeaderActionsRowMobileStyleSlotInput {
  surface: ChatRuntimeHeaderMobileSurfaceState["actionsRow"]
}

export interface ChatRuntimeHeaderActionsRowMobileStyleSlot {
  flexDirection: ChatRuntimeHeaderMobileSurfaceState["actionsRow"]["flexDirection"]
  alignItems: ChatRuntimeHeaderMobileSurfaceState["actionsRow"]["alignItems"]
  gap: number
}

export interface ChatRuntimeHeaderIconContainerMobileStyleSlotInput<
  TAlignItems extends string = string,
  TJustifyContent extends string = string,
> {
  size: number
  borderRadius?: number | null
  backgroundColor?: string | null
  alignItems: TAlignItems
  justifyContent: TJustifyContent
}

export interface ChatRuntimeHeaderIconContainerMobileStyleSlot<
  TAlignItems extends string = string,
  TJustifyContent extends string = string,
> {
  width: number
  height: number
  borderRadius?: number
  backgroundColor?: string
  alignItems: TAlignItems
  justifyContent: TJustifyContent
}

export interface ChatRuntimeHeaderPinButtonMobileStyleSlotInput {
  touchTarget: ReturnType<typeof createMinimumTouchTargetStyle>
  borderRadius: number
  borderWidth: number
  colors: ChatRuntimePinMobileColors["button"]
}

export type ChatRuntimeHeaderPinButtonMobileStyleSlot =
  & ReturnType<typeof createMinimumTouchTargetStyle>
  & {
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }

export type ChatRuntimeHeaderPinButtonMobileStyleRadiusToken =
  ChatRuntimeHeaderMobileSurfaceState["pinButton"]["borderRadius"]

export interface ChatRuntimeHeaderPinButtonMobileStyleSlotsInput {
  surface: Pick<ChatRuntimeHeaderMobileSurfaceState, "pinButton">
  touchTarget: ReturnType<typeof createMinimumTouchTargetStyle>
  colors: ChatRuntimeHeaderMobileStyleRenderState["pinButton"]
  radius: Readonly<Record<ChatRuntimeHeaderPinButtonMobileStyleRadiusToken, number>>
}

export interface ChatRuntimeHeaderPinButtonMobileStyleSlots {
  inactive: ChatRuntimeHeaderPinButtonMobileStyleSlot
  active: ChatRuntimeHeaderPinButtonMobileStyleSlot
}

export interface ChatRuntimeHeaderIconContainerMobileStyleSlotsInput {
  surface: Pick<ChatRuntimeHeaderMobileSurfaceState, "killSwitchButton" | "handsFreeButton">
  colors: Pick<ChatRuntimeHeaderMobileStyleRenderState, "killSwitchButton">
}

export interface ChatRuntimeHeaderIconContainerMobileStyleSlots {
  killSwitch: ChatRuntimeHeaderIconContainerMobileStyleSlot<
    ChatRuntimeHeaderMobileSurfaceState["killSwitchButton"]["alignItems"],
    ChatRuntimeHeaderMobileSurfaceState["killSwitchButton"]["justifyContent"]
  >
  handsFree: ChatRuntimeHeaderIconContainerMobileStyleSlot<
    ChatRuntimeHeaderMobileSurfaceState["handsFreeButton"]["alignItems"],
    ChatRuntimeHeaderMobileSurfaceState["handsFreeButton"]["justifyContent"]
  >
}

export interface ChatRuntimeHeaderChromeMobileStyleRenderStateInput {
  colors:
    & ChatRuntimeHeaderMobileStyleColorPalette
    & ChatSessionStatusMobileColorPalette
    & ChatRuntimeTurnDurationHeaderMobileBadgeColorPalette
}

export interface ChatRuntimeHeaderChromeMobileStyleRenderState {
  header: ChatRuntimeHeaderMobileStyleRenderState
  sessionStatus: ChatSessionStatusMobileStyleRenderState
  turnDuration: {
    standard: ChatRuntimeTurnDurationHeaderMobileRenderState
    live: ChatRuntimeTurnDurationHeaderMobileRenderState
  }
}

export type ChatRuntimeNavigationHeaderMobileColorPalette =
  & ChatRuntimeAgentSelectorMobileColorPalette
  & ChatRuntimeBackMobileColorPalette
  & ChatRuntimePinMobileColorPalette
  & ChatRuntimeHandsFreeMobileColorPalette
  & ChatRuntimeKillSwitchMobileColorPalette
  & ChatRuntimeTurnDurationHeaderMobileBadgeColorPalette
  & ChatSessionStatusMobileColorPalette

export interface ChatRuntimeNavigationHeaderMobileRenderStateInput {
  agentName?: string | null
  isPinned?: boolean
  handsFree?: boolean
  conversationState?: AgentConversationState | null
  isResponding?: boolean
  turnDurationMs?: number | null
  turnDurationIsLive?: boolean
  colors: ChatRuntimeNavigationHeaderMobileColorPalette
}

export interface ChatRuntimeNavigationHeaderMobileRenderState {
  agentSelectorRenderState: ChatRuntimeAgentSelectorMobileRenderState
  agentSelectorLabelNumberOfLines: number
  backButtonRenderState: ChatRuntimeBackMobileRenderState
  pinButtonRenderState: ChatRuntimePinMobileRenderState
  pinButtonIsActive: boolean
  conversationStatusRenderState: ChatSessionStatusMobileRenderState
  turnDurationRenderState: ChatRuntimeTurnDurationHeaderMobileRenderState
  killSwitchButtonShouldRender: boolean
  killSwitchButtonRenderState: ChatRuntimeKillSwitchMobileRenderState
  handsFreeButtonRenderState: ChatRuntimeHandsFreeMobileRenderState
}

export type ChatRuntimeNavigationHeaderOptionsPartsInput<
  TAgentSelectorRenderState = ChatRuntimeAgentSelectorMobileRenderState,
  TOnAgentSelectorPress = unknown,
  TBackButtonRenderState = ChatRuntimeBackMobileRenderState,
  TOnBackButtonPress = unknown,
  TPinButtonRenderState = ChatRuntimePinMobileRenderState,
  TOnPinButtonPress = unknown,
  TPinButtonIsActive = boolean,
  TConversationStatusRenderState = ChatSessionStatusMobileRenderState,
  TConversationStatusSpinnerSource = unknown,
  TTurnDurationRenderState = ChatRuntimeTurnDurationHeaderMobileRenderState,
  TKillSwitchButtonShouldRender = boolean,
  TKillSwitchButtonRenderState = ChatRuntimeKillSwitchMobileRenderState,
  TOnKillSwitchButtonPress = unknown,
  THandsFreeButtonRenderState = ChatRuntimeHandsFreeMobileRenderState,
  TOnHandsFreeButtonPress = unknown,
> = {
  agentSelectorRenderState: TAgentSelectorRenderState
  agentSelectorLabelNumberOfLines: number
  backButtonRenderState: TBackButtonRenderState
  pinButtonRenderState: TPinButtonRenderState
  pinButtonIsActive: TPinButtonIsActive
  conversationStatusRenderState: TConversationStatusRenderState
  turnDurationRenderState: TTurnDurationRenderState
  killSwitchButtonShouldRender: TKillSwitchButtonShouldRender
  killSwitchButtonRenderState: TKillSwitchButtonRenderState
  handsFreeButtonRenderState: THandsFreeButtonRenderState
  onAgentSelectorPress: TOnAgentSelectorPress
  onBackButtonPress: TOnBackButtonPress
  onPinButtonPress: TOnPinButtonPress
  conversationStatusSpinnerSource: TConversationStatusSpinnerSource
  onKillSwitchButtonPress: TOnKillSwitchButtonPress
  onHandsFreeButtonPress: TOnHandsFreeButtonPress
}

export type ChatRuntimeNavigationHeaderOptionsParts<
  TAgentSelectorRenderState = ChatRuntimeAgentSelectorMobileRenderState,
  TOnAgentSelectorPress = unknown,
  TBackButtonRenderState = ChatRuntimeBackMobileRenderState,
  TOnBackButtonPress = unknown,
  TPinButtonRenderState = ChatRuntimePinMobileRenderState,
  TOnPinButtonPress = unknown,
  TPinButtonIsActive = boolean,
  TConversationStatusRenderState = ChatSessionStatusMobileRenderState,
  TConversationStatusSpinnerSource = unknown,
  TTurnDurationRenderState = ChatRuntimeTurnDurationHeaderMobileRenderState,
  TKillSwitchButtonShouldRender = boolean,
  TKillSwitchButtonRenderState = ChatRuntimeKillSwitchMobileRenderState,
  TOnKillSwitchButtonPress = unknown,
  THandsFreeButtonRenderState = ChatRuntimeHandsFreeMobileRenderState,
  TOnHandsFreeButtonPress = unknown,
> = {
  agentSelector: {
    renderState: TAgentSelectorRenderState
    onPress: TOnAgentSelectorPress
    labelNumberOfLines: number
  }
  backButton: {
    renderState: TBackButtonRenderState
    onPress: TOnBackButtonPress
  }
  pinButton: {
    renderState: TPinButtonRenderState
    onPress: TOnPinButtonPress
    isActive: TPinButtonIsActive
  }
  conversationStatus: {
    renderState: TConversationStatusRenderState
    spinnerSource: TConversationStatusSpinnerSource
  }
  turnDuration: {
    renderState: TTurnDurationRenderState
  }
  killSwitchButton: {
    shouldRender: TKillSwitchButtonShouldRender
    renderState: TKillSwitchButtonRenderState
    onPress: TOnKillSwitchButtonPress
  }
  handsFreeButton: {
    renderState: THandsFreeButtonRenderState
    onPress: TOnHandsFreeButtonPress
  }
}

export type ChatRuntimeNavigationHeaderOptionsMobilePropsPartsInput = {
  agentSelector: object
  backButton: object
  pinButton: object
  conversationStatus: object
  turnDuration: object
  killSwitchButton: object
  handsFreeButton: object
  styles: {
    actionsRowStyle: unknown
    agentSelector: unknown
    conversationStatus: unknown
    turnDuration: unknown
    iconButtons: {
      edgeStyle: unknown
      pinStyle: unknown
      pinActiveStyle?: unknown
      actionStyle: unknown
      killSwitchIconContainerStyle: unknown
      handsFreeIconContainerStyle: unknown
    }
  }
}

export type ChatRuntimeNavigationHeaderOptionsMobilePropsParts<
  TInput extends ChatRuntimeNavigationHeaderOptionsMobilePropsPartsInput,
> = {
  actionsRow: {
    style: TInput["styles"]["actionsRowStyle"]
  }
  agentSelector: TInput["agentSelector"] & {
    styles: TInput["styles"]["agentSelector"]
  }
  backButton: TInput["backButton"] & {
    style: TInput["styles"]["iconButtons"]["edgeStyle"]
  }
  pinButton: TInput["pinButton"] & {
    style: TInput["styles"]["iconButtons"]["pinStyle"]
    activeStyle: TInput["styles"]["iconButtons"]["pinActiveStyle"]
  }
  conversationStatus: TInput["conversationStatus"] & {
    styles: TInput["styles"]["conversationStatus"]
  }
  turnDuration: TInput["turnDuration"] & {
    styles: TInput["styles"]["turnDuration"]
  }
  killSwitchButton: TInput["killSwitchButton"] & {
    style: TInput["styles"]["iconButtons"]["actionStyle"]
    iconContainerStyle: TInput["styles"]["iconButtons"]["killSwitchIconContainerStyle"]
  }
  handsFreeButton: TInput["handsFreeButton"] & {
    style: TInput["styles"]["iconButtons"]["actionStyle"]
    iconContainerStyle: TInput["styles"]["iconButtons"]["handsFreeIconContainerStyle"]
  }
}

export interface ChatRuntimeKillSwitchMobileAlertState {
  confirmation: {
    title: string
    message: string
    confirmLabel: string
    cancelLabel: string
  }
  success: {
    title: string
    fallbackMessage: string
  }
  failed: {
    title: string
    fallbackMessage: string
  }
  connectionFailed: {
    title: string
    fallbackMessage: string
  }
}

export interface ChatRuntimeKillSwitchResultLike {
  success: boolean
  message?: string | null
  error?: string | null
}

export interface ChatRuntimeKillSwitchResolvedAlertState {
  title: string
  message: string
  webMessage: string
}

export interface ChatRuntimeKillSwitchConfirmationAlertState {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  webMessage: string
}

export interface ChatRuntimeRetryStatusMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon.name
  size: number
  colorToken: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleColorToken
}

export type ChatRuntimeRetryStatusMobileColorToken =
  | ChatRuntimeRetryStatusMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.spinner.colorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.borderColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.attemptColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.descriptionColorToken

export type ChatRuntimeRetryStatusMobileColorPalette =
  Readonly<Record<ChatRuntimeRetryStatusMobileColorToken, string>>

export interface ChatRuntimeRetryStatusMobileColors {
  icon: {
    color: string
  }
  spinner: {
    color: string
  }
  card: {
    borderColor: string
    backgroundColor: string
  }
  title: {
    color: string
  }
  attempt: {
    color: string
  }
  countdown: {
    color: string
    backgroundColor: string
  }
  description: {
    color: string
  }
}

export interface ChatRuntimeRetryStatusStateInput {
  retryInfo?: ChatRuntimeRetryInfoLike | null
  countdownSeconds?: number | null
}

export interface ChatRuntimeRetryStatusState {
  shouldRender: boolean
  title: string
  attemptLabel: string
  countdownLabel: string
  description: string
  accessibilityLabel: string
}

export interface ChatRuntimeRetryStatusMobileRenderStateInput {
  retryInfo?: ChatRuntimeRetryInfoLike | null
  colors: ChatRuntimeRetryStatusMobileColorPalette
}

export interface ChatRuntimeRetryStatusMobileRenderState {
  shouldRender: boolean
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus
  colors: ChatRuntimeRetryStatusMobileColors
  title: string
  attemptLabel: string
  countdownLabel: string
  description: string
  accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.accessibilityRole
  accessibilityLabel: string
  icon: {
    name: typeof CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon.name
    size: number
    color: string
  }
  spinner: {
    size: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.spinner.size
    color: string
  }
}

type ChatRuntimeRetryStatusMobileSurface = typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus

export type ChatRuntimeRetryStatusMobileSpacingToken =
  | ChatRuntimeRetryStatusMobileSurface["gap"]
  | ChatRuntimeRetryStatusMobileSurface["padding"]
  | ChatRuntimeRetryStatusMobileSurface["headerGap"]
  | ChatRuntimeRetryStatusMobileSurface["metaGap"]
  | ChatRuntimeRetryStatusMobileSurface["countdownPaddingHorizontal"]

export type ChatRuntimeRetryStatusMobileRadiusToken =
  | ChatRuntimeRetryStatusMobileSurface["borderRadius"]
  | ChatRuntimeRetryStatusMobileSurface["countdownBorderRadius"]

export interface ChatRuntimeRetryStatusMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeRetryStatusMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeRetryStatusMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeRetryStatusMobileRadiusToken, number>>
}

export interface ChatRuntimeRetryStatusMobileStyleSlots {
  card: {
    gap: number
    padding: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  header: {
    flexDirection: ChatRuntimeRetryStatusMobileSurface["headerFlexDirection"]
    alignItems: ChatRuntimeRetryStatusMobileSurface["headerAlignItems"]
    gap: number
  }
  title: {
    flex: number
    minWidth: number
    color: string
    fontSize: number
    fontWeight: ChatRuntimeRetryStatusMobileSurface["titleFontWeight"]
  }
  metaRow: {
    flexDirection: ChatRuntimeRetryStatusMobileSurface["metaFlexDirection"]
    flexWrap: ChatRuntimeRetryStatusMobileSurface["metaFlexWrap"]
    alignItems: ChatRuntimeRetryStatusMobileSurface["metaAlignItems"]
    gap: number
    marginTop: number
  }
  attempt: {
    color: string
    fontSize: number
  }
  countdown: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeRetryStatusMobileSurface["countdownFontWeight"]
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    backgroundColor: string
    overflow: ChatRuntimeRetryStatusMobileSurface["countdownOverflow"]
  }
  description: {
    color: string
    fontSize: number
    lineHeight: number
    marginTop: number
  }
}

export type ChatRuntimeStepSummaryMobileColorToken =
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.borderColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.titleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.actionColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.metaColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.previewColorToken

export type ChatRuntimeStepSummaryMobileColorPalette =
  Readonly<Record<ChatRuntimeStepSummaryMobileColorToken, string>>

export interface ChatRuntimeStepSummaryMobileColors {
  card: {
    borderColor: string
    backgroundColor: string
  }
  title: {
    color: string
  }
  badge: {
    backgroundColor: string
  }
  badgeText: {
    color: string
  }
  action: {
    color: string
  }
  meta: {
    color: string
  }
  preview: {
    color: string
  }
}

export interface ChatRuntimeStepSummaryMobileRenderStateInput {
  summary?: ChatRuntimeStepSummaryLike | null
  colors: ChatRuntimeStepSummaryMobileColorPalette
}

export interface ChatRuntimeStepSummaryStateInput {
  summary?: ChatRuntimeStepSummaryLike | null
}

export interface ChatRuntimeStepSummaryState {
  shouldRender: boolean
  title: string
  badgeLabel: string
  stepLabel: string
  actionSummary: string
  meta: string
  preview: string
  keyFindingsLabel: string
  accessibilityLabel: string
}

export interface ChatRuntimeStepSummaryMobileRenderState {
  shouldRender: boolean
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary
  colors: ChatRuntimeStepSummaryMobileColors
  title: string
  badgeLabel: string
  actionSummary: string
  meta: string
  preview: string
  accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.accessibilityRole
  accessibilityLabel: string
}

type ChatRuntimeStepSummaryMobileSurface = typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary

export type ChatRuntimeStepSummaryMobileSpacingToken =
  | ChatRuntimeStepSummaryMobileSurface["gap"]
  | ChatRuntimeStepSummaryMobileSurface["padding"]
  | ChatRuntimeStepSummaryMobileSurface["headerGap"]
  | ChatRuntimeStepSummaryMobileSurface["badgePaddingHorizontal"]

export type ChatRuntimeStepSummaryMobileRadiusToken =
  | ChatRuntimeStepSummaryMobileSurface["borderRadius"]
  | ChatRuntimeStepSummaryMobileSurface["badgeBorderRadius"]

export interface ChatRuntimeStepSummaryMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeStepSummaryMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeStepSummaryMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeStepSummaryMobileRadiusToken, number>>
}

export interface ChatRuntimeStepSummaryMobileStyleSlots {
  card: {
    gap: number
    padding: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  header: {
    flexDirection: ChatRuntimeStepSummaryMobileSurface["headerFlexDirection"]
    alignItems: ChatRuntimeStepSummaryMobileSurface["headerAlignItems"]
    gap: number
    minWidth: number
  }
  title: {
    flexShrink: number
    minWidth: number
    color: string
    fontSize: number
    fontWeight: ChatRuntimeStepSummaryMobileSurface["titleFontWeight"]
  }
  badge: {
    marginLeft: ChatRuntimeStepSummaryMobileSurface["badgeMarginLeft"]
    maxWidth: ChatRuntimeStepSummaryMobileSurface["badgeMaxWidth"]
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    backgroundColor: string
  }
  badgeText: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeStepSummaryMobileSurface["badgeTextFontWeight"]
  }
  action: {
    color: string
    fontSize: number
    lineHeight: number
    fontWeight: ChatRuntimeStepSummaryMobileSurface["actionFontWeight"]
  }
  meta: {
    color: string
    fontSize: number
    lineHeight: number
  }
  preview: {
    color: string
    fontSize: number
    lineHeight: number
    marginTop: number
  }
}

export type ChatRuntimeDelegationCardMobileColorToken =
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.borderColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.titleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.liveColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.subtitleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.metaColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewContentColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewTimestampColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewLabelColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewNameColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreColorToken

export type ChatRuntimeDelegationCardMobileColorPalette =
  Readonly<Record<ChatRuntimeDelegationCardMobileColorToken, string>>

export interface ChatRuntimeDelegationCardMobileColors {
  card: {
    borderColor: string
    backgroundColor: string
  }
  title: {
    color: string
  }
  liveText: {
    color: string
  }
  subtitle: {
    color: string
  }
  meta: {
    color: string
  }
  conversationPreview: {
    borderColor: string
    backgroundColor: string
  }
  conversationPreviewContent: {
    color: string
  }
  conversationPreviewTimestamp: {
    color: string
  }
  conversationPreviewMore: {
    color: string
  }
  toolPreview: {
    borderColor: string
    backgroundColor: string
  }
  toolPreviewLabel: {
    color: string
  }
  toolPreviewName: {
    color: string
  }
  toolPreviewMore: {
    color: string
  }
}

export interface ChatRuntimeDelegationCardMobileRenderStateInput {
  colors: ChatRuntimeDelegationCardMobileColorPalette
}

export interface ChatRuntimeDelegationCardMobileRenderState {
  surface: ReturnType<typeof getChatRuntimeDelegationCardMobileState>
  colors: ChatRuntimeDelegationCardMobileColors
}

type ChatRuntimeDelegationCardMobileSurface =
  typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard

export type ChatRuntimeDelegationCardMobileSpacingToken =
  | ChatRuntimeDelegationCardMobileSurface["gap"]
  | ChatRuntimeDelegationCardMobileSurface["padding"]
  | ChatRuntimeDelegationCardMobileSurface["headerGap"]
  | ChatRuntimeDelegationCardMobileSurface["statusPaddingHorizontal"]
  | ChatRuntimeDelegationCardMobileSurface["metaGap"]
  | ChatRuntimeDelegationCardMobileSurface["conversationPreviewPaddingHorizontal"]
  | ChatRuntimeDelegationCardMobileSurface["conversationPreviewLineGap"]
  | ChatRuntimeDelegationCardMobileSurface["conversationPreviewRolePaddingHorizontal"]
  | ChatRuntimeDelegationCardMobileSurface["toolPreviewPaddingHorizontal"]
  | ChatRuntimeDelegationCardMobileSurface["toolPreviewLineGap"]

export type ChatRuntimeDelegationCardMobileRadiusToken =
  | ChatRuntimeDelegationCardMobileSurface["borderRadius"]
  | ChatRuntimeDelegationCardMobileSurface["statusBorderRadius"]
  | ChatRuntimeDelegationCardMobileSurface["conversationPreviewBorderRadius"]
  | ChatRuntimeDelegationCardMobileSurface["conversationPreviewRoleBorderRadius"]
  | ChatRuntimeDelegationCardMobileSurface["toolPreviewBorderRadius"]

export interface ChatRuntimeDelegationCardMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeDelegationCardMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeDelegationCardMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeDelegationCardMobileRadiusToken, number>>
}

export interface ChatRuntimeDelegationCardMobileStyleSlots {
  card: {
    gap: number
    padding: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  header: {
    flexDirection: ChatRuntimeDelegationCardMobileSurface["headerFlexDirection"]
    alignItems: ChatRuntimeDelegationCardMobileSurface["headerAlignItems"]
    gap: number
    minWidth: number
  }
  title: {
    flex: number
    minWidth: number
    color: string
    fontSize: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["titleFontWeight"]
  }
  statusBadge: {
    flexShrink: number
    borderWidth: number
    borderRadius: number
    paddingHorizontal: number
    paddingVertical: number
  }
  statusText: {
    fontSize: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["statusFontWeight"]
  }
  liveText: {
    color: string
    fontSize: number
    lineHeight: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["statusFontWeight"]
  }
  subtitle: {
    color: string
    fontSize: number
    lineHeight: number
  }
  metaRow: {
    flexDirection: ChatRuntimeDelegationCardMobileSurface["metaFlexDirection"]
    flexWrap: ChatRuntimeDelegationCardMobileSurface["metaFlexWrap"]
    alignItems: ChatRuntimeDelegationCardMobileSurface["metaAlignItems"]
    gap: number
  }
  metaText: {
    color: string
    fontSize: number
    lineHeight: number
  }
  conversationPreview: {
    gap: number
    marginTop: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  conversationPreviewLine: {
    flexDirection: ChatRuntimeDelegationCardMobileSurface["conversationPreviewLineFlexDirection"]
    alignItems: ChatRuntimeDelegationCardMobileSurface["conversationPreviewLineAlignItems"]
    gap: number
    minWidth: number
  }
  conversationPreviewRole: {
    minWidth: number
    maxWidth: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    borderWidth: number
    overflow: ChatRuntimeDelegationCardMobileSurface["conversationPreviewRoleOverflow"]
    fontSize: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["conversationPreviewRoleFontWeight"]
  }
  conversationPreviewContent: {
    flex: number
    minWidth: number
    color: string
    fontSize: number
    lineHeight: number
  }
  conversationPreviewTimestamp: {
    flexShrink: number
    color: string
    fontSize: number
  }
  conversationPreviewMoreButton: {
    alignSelf: ChatRuntimeDelegationCardMobileSurface["conversationPreviewMoreButtonAlignSelf"]
  }
  conversationPreviewMoreButtonPressed: {
    opacity: number
  }
  conversationPreviewMore: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["conversationPreviewMoreFontWeight"]
  }
  toolPreview: {
    gap: number
    marginTop: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  toolPreviewLabel: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["toolPreviewLabelFontWeight"]
  }
  toolPreviewLine: {
    flexDirection: ChatRuntimeDelegationCardMobileSurface["toolPreviewLineFlexDirection"]
    alignItems: ChatRuntimeDelegationCardMobileSurface["toolPreviewLineAlignItems"]
    gap: number
    minWidth: number
  }
  toolPreviewStatusIcon: {
    minWidth: number
    alignItems: ChatRuntimeDelegationCardMobileSurface["toolPreviewStatusAlignItems"]
    justifyContent: ChatRuntimeDelegationCardMobileSurface["toolPreviewStatusJustifyContent"]
    flexShrink: number
  }
  toolPreviewName: {
    flex: number
    minWidth: number
    color: string
    fontSize: number
  }
  toolPreviewMoreButton: {
    alignSelf: ChatRuntimeDelegationCardMobileSurface["toolPreviewMoreButtonAlignSelf"]
  }
  toolPreviewMoreButtonPressed: {
    opacity: number
  }
  toolPreviewMore: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeDelegationCardMobileSurface["toolPreviewMoreFontWeight"]
  }
}

export interface ChatRuntimeDelegationMorePreviewActionState {
  label: string
  accessibilityRole: "button"
  accessibilityLabel: string
  numberOfLines: number
}

export interface ChatRuntimeScrollToBottomMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.name
  size: number
  colorToken: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.foregroundColorToken
}

export type ChatRuntimeScrollToBottomMobileColorToken =
  | ChatRuntimeScrollToBottomMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.backgroundColorToken

export type ChatRuntimeScrollToBottomMobileColorPalette =
  Readonly<Record<ChatRuntimeScrollToBottomMobileColorToken, string>>

export interface ChatRuntimeScrollToBottomMobileColors {
  button: {
    backgroundColor: string
  }
  icon: {
    color: string
  }
}

export interface ChatRuntimeScrollToBottomMobileRenderStateInput {
  isVisible?: boolean
  colors: ChatRuntimeScrollToBottomMobileColorPalette
}

export interface ChatRuntimeScrollToBottomMobileRenderState {
  shouldRender: boolean
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom
  colors: ChatRuntimeScrollToBottomMobileColors
  button: {
    accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.accessibilityRole
    accessibilityLabel: string
    accessibilityHint: string
    icon: {
      name: typeof CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.name
      size: number
      color: string
    }
    pressedOpacity: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.pressedOpacity
  }
}

type ChatRuntimeScrollToBottomMobileSurface =
  typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom

export type ChatRuntimeScrollToBottomMobileSpacingToken =
  ChatRuntimeScrollToBottomMobileSurface["right"]

export interface ChatRuntimeScrollToBottomMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeScrollToBottomMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeScrollToBottomMobileSpacingToken, number>>
}

export interface ChatRuntimeScrollToBottomMobileStyleSlots {
  button: {
    position: ChatRuntimeScrollToBottomMobileSurface["position"]
    right: number
    width: number
    height: number
    borderRadius: number
    backgroundColor: string
    alignItems: ChatRuntimeScrollToBottomMobileSurface["alignItems"]
    justifyContent: ChatRuntimeScrollToBottomMobileSurface["justifyContent"]
    shadowColor: string
    shadowOffset: ChatRuntimeScrollToBottomMobileSurface["shadowOffset"]
    shadowOpacity: number
    shadowRadius: number
    elevation: number
  }
}

export interface ChatRuntimeMobileSafeAreaLayoutState {
  chatScrollContent: {
    paddingBottom: number
  }
  scrollToBottomButton: {
    bottom: number
  }
  voiceOverlay: {
    bottom: number
  }
  inputArea: {
    paddingBottom: number
  }
}

export interface ChatRuntimeMobileSafeAreaStyleSlots {
  chatScrollContent: {
    paddingBottom: number
  }
  scrollToBottomButton: {
    bottom: number
  }
  voiceOverlay: {
    bottom: number
  }
  inputArea: {
    paddingBottom: number
  }
}

export type ChatRuntimeSafeAreaStylePair<TBaseStyle, TSafeAreaStyle> = [
  TBaseStyle,
  TSafeAreaStyle,
]

export type ChatRuntimeSafeAreaMergedOverlayStyleSlots<
  TOverlayStyleSlots extends { overlay: unknown },
> = Omit<TOverlayStyleSlots, "overlay"> & {
  overlay: ChatRuntimeSafeAreaStylePair<
    TOverlayStyleSlots["overlay"],
    ChatRuntimeMobileSafeAreaStyleSlots["voiceOverlay"]
  >
}

export type ChatRuntimeSafeAreaMergedInputDockStyleSlots<
  TInputDockStyleSlots extends { area: unknown },
> = Omit<TInputDockStyleSlots, "area"> & {
  area: ChatRuntimeSafeAreaStylePair<
    TInputDockStyleSlots["area"],
    ChatRuntimeMobileSafeAreaStyleSlots["inputArea"]
  >
}

export interface ChatRuntimeSafeAreaMergedStyleSlots<
  TScrollToBottomButtonStyle,
  TScrollViewportContentContainerStyle,
  TVoiceOverlayStyleSlots extends { overlay: unknown },
  TInputDockStyleSlots extends { area: unknown },
> {
  scrollToBottomButtonStyle: ChatRuntimeSafeAreaStylePair<
    TScrollToBottomButtonStyle,
    ChatRuntimeMobileSafeAreaStyleSlots["scrollToBottomButton"]
  >
  scrollViewportContentContainerStyle: ChatRuntimeSafeAreaStylePair<
    TScrollViewportContentContainerStyle,
    ChatRuntimeMobileSafeAreaStyleSlots["chatScrollContent"]
  >
  voiceOverlay: ChatRuntimeSafeAreaMergedOverlayStyleSlots<TVoiceOverlayStyleSlots>
  inputDock: ChatRuntimeSafeAreaMergedInputDockStyleSlots<TInputDockStyleSlots>
}

export interface ChatRuntimeSafeAreaMergedStyleSlotsInput<
  TScrollToBottomButtonStyle,
  TScrollViewportContentContainerStyle,
  TVoiceOverlayStyleSlots extends { overlay: unknown },
  TInputDockStyleSlots extends { area: unknown },
> {
  chatComposerStyles: {
    voiceOverlay: TVoiceOverlayStyleSlots
    inputDock: TInputDockStyleSlots
  }
  conversationDockStyles: {
    scrollToBottomButtonStyle: TScrollToBottomButtonStyle
  }
  conversationViewportStyles: {
    scrollViewport: {
      contentContainerStyle: TScrollViewportContentContainerStyle
    }
  }
  safeAreaStyles: ChatRuntimeMobileSafeAreaStyleSlots
}

export interface ChatRuntimeConnectionBannerFailedMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon.failedName
  size: number
  colorToken: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.failed.borderColorToken
}

export type ChatRuntimeConnectionBannerMobileColorToken =
  | ChatRuntimeConnectionBannerFailedMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.reconnecting.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.reconnecting.borderColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.reconnecting.spinnerColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.failed.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.failed.borderColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.titleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.foregroundColorToken

export type ChatRuntimeConnectionBannerMobileColorPalette =
  Readonly<Record<ChatRuntimeConnectionBannerMobileColorToken, string>>

export interface ChatRuntimeConnectionBannerMobileColors {
  reconnecting: {
    backgroundColor: string
    borderColor: string
    spinner: {
      color: string
    }
  }
  failed: {
    backgroundColor: string
    borderColor: string
    icon: {
      color: string
    }
  }
  title: {
    color: string
  }
  subtitle: {
    color: string
  }
  retryButton: {
    backgroundColor: string
    color: string
  }
}

export interface ChatRuntimeConnectionBannerMobileRenderStateInput {
  connectionState?: RecoveryState | null
  lastFailedMessage?: string | null
  isResponding?: boolean
  colors: ChatRuntimeConnectionBannerMobileColorPalette
}

export interface ChatRuntimeConnectionBannerMobileRenderState {
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner
  colors: ChatRuntimeConnectionBannerMobileColors
  reconnecting: {
    shouldRender: boolean
    title: string
    subtitle: string | null
    accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.accessibilityRole
    accessibilityLabel: string
    spinner: {
      size: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.reconnecting.spinnerSize
      color: string
    }
  }
  failed: {
    shouldRender: boolean
    title: string
    subtitle: string
    accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.accessibilityRole
    accessibilityLabel: string
    icon: {
      name: typeof CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon.failedName
      size: number
      color: string
    }
    retryButton: {
      label: string
      accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.accessibilityRole
      accessibilityLabel: string
      pressedOpacity: number
    }
  }
}

type ChatRuntimeConnectionBannerMobileSurface =
  typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner

export type ChatRuntimeConnectionBannerMobileSpacingToken =
  | ChatRuntimeConnectionBannerMobileSurface["paddingHorizontal"]
  | ChatRuntimeConnectionBannerMobileSurface["paddingVertical"]
  | ChatRuntimeConnectionBannerMobileSurface["marginHorizontal"]
  | ChatRuntimeConnectionBannerMobileSurface["marginBottom"]
  | ChatRuntimeConnectionBannerMobileSurface["iconMarginRight"]
  | ChatRuntimeConnectionBannerMobileSurface["retryButton"]["paddingHorizontal"]
  | ChatRuntimeConnectionBannerMobileSurface["retryButton"]["paddingVertical"]
  | ChatRuntimeConnectionBannerMobileSurface["retryButton"]["marginLeft"]

export type ChatRuntimeConnectionBannerMobileRadiusToken =
  | ChatRuntimeConnectionBannerMobileSurface["borderRadius"]
  | ChatRuntimeConnectionBannerMobileSurface["retryButton"]["borderRadius"]

export interface ChatRuntimeConnectionBannerMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeConnectionBannerMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeConnectionBannerMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeConnectionBannerMobileRadiusToken, number>>
}

export interface ChatRuntimeConnectionBannerMobileStyleSlots {
  banner: {
    paddingHorizontal: number
    paddingVertical: number
    marginHorizontal: number
    marginBottom: number
    borderRadius: number
    borderWidth: number
  }
  reconnecting: {
    backgroundColor: string
    borderColor: string
  }
  failed: {
    backgroundColor: string
    borderColor: string
  }
  content: {
    flexDirection: ChatRuntimeConnectionBannerMobileSurface["contentFlexDirection"]
    alignItems: ChatRuntimeConnectionBannerMobileSurface["contentAlignItems"]
  }
  icon: {
    marginRight: number
  }
  textContainer: {
    flex: number
  }
  title: {
    fontSize: number
    fontWeight: ChatRuntimeConnectionBannerMobileSurface["titleFontWeight"]
    color: string
  }
  subtitle: {
    fontSize: number
    color: string
    marginTop: number
  }
  retryButton: {
    backgroundColor: string
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    marginLeft: number
  }
  retryButtonText: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeConnectionBannerMobileSurface["retryButton"]["fontWeight"]
  }
}

export interface ChatRuntimeStreamingContentMobileIconState {
  name: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.name
  size: number
  colorToken: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleColorToken
}

export type ChatRuntimeStreamingContentMobileColorToken =
  | ChatRuntimeStreamingContentMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.textColorToken

export type ChatRuntimeStreamingContentMobileColorPalette =
  Readonly<Record<ChatRuntimeStreamingContentMobileColorToken, string>>

export interface ChatRuntimeStreamingContentMobileColors {
  icon: {
    color: string
  }
  title: {
    color: string
  }
  badge: {
    backgroundColor: string
  }
  badgeText: {
    color: string
  }
  text: {
    color: string
  }
  caret: {
    backgroundColor: string
  }
}

export interface ChatRuntimeStreamingContentStateInput {
  isStreaming?: boolean
  content?: string | null
}

export interface ChatRuntimeStreamingContentState {
  shouldRender: boolean
  hasContent: boolean
  isStreaming: boolean
  title: string
  accessibilityLabel: string
  badgeLabel: string
  content: string
}

export interface ChatRuntimeStreamingContentMobileRenderStateInput {
  isStreaming?: boolean
  content?: string | null
  colors: ChatRuntimeStreamingContentMobileColorPalette
}

export interface ChatRuntimeStreamingContentMobileRenderState {
  shouldRender: boolean
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent
  colors: ChatRuntimeStreamingContentMobileColors
  title: string
  accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.accessibilityRole
  accessibilityLabel: string
  badgeLabel: string
  content: string
  icon: {
    name: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.name
    size: number
    color: string
  }
  spinner: {
    size: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.spinnerSize
    resizeMode: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.spinnerResizeMode
  }
}

type ChatRuntimeStreamingContentMobileSurface = typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent

export type ChatRuntimeStreamingContentMobileSpacingToken =
  | ChatRuntimeStreamingContentMobileSurface["headerGap"]
  | ChatRuntimeStreamingContentMobileSurface["headerMarginBottom"]
  | ChatRuntimeStreamingContentMobileSurface["badgePaddingHorizontal"]

export type ChatRuntimeStreamingContentMobileRadiusToken =
  ChatRuntimeStreamingContentMobileSurface["badgeBorderRadius"]

export interface ChatRuntimeStreamingContentMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeStreamingContentMobileRenderState, "surface" | "colors" | "spinner">
  spacing: Readonly<Record<ChatRuntimeStreamingContentMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeStreamingContentMobileRadiusToken, number>>
}

export interface ChatRuntimeStreamingContentMobileStyleSlots {
  header: {
    flexDirection: ChatRuntimeStreamingContentMobileSurface["headerFlexDirection"]
    alignItems: ChatRuntimeStreamingContentMobileSurface["headerAlignItems"]
    gap: number
    marginBottom: number
  }
  title: {
    minWidth: number
    flexShrink: number
    color: string
    fontSize: number
    fontWeight: ChatRuntimeStreamingContentMobileSurface["titleFontWeight"]
  }
  spinner: {
    width: number
    height: number
  }
  badge: {
    marginLeft: ChatRuntimeStreamingContentMobileSurface["badgeMarginLeft"]
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    backgroundColor: string
  }
  badgeText: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeStreamingContentMobileSurface["badgeTextFontWeight"]
  }
  bodyRow: {
    flexDirection: ChatRuntimeStreamingContentMobileSurface["bodyRowFlexDirection"]
    alignItems: ChatRuntimeStreamingContentMobileSurface["bodyRowAlignItems"]
    minWidth: number
  }
  text: {
    flex: number
    minWidth: number
    color: string
    fontSize: number
    lineHeight: number
  }
  caret: {
    width: number
    height: number
    marginLeft: number
    borderRadius: number
    backgroundColor: string
  }
}

export interface ChatRuntimeMessageHistoryLoadEarlierMobileIconState {
  name: typeof CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.loadEarlierName
  size: number
  colorToken: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.colorToken
}

export type ChatRuntimeMessageHistoryBannerMobileColorToken =
  | ChatRuntimeMessageHistoryLoadEarlierMobileIconState["colorToken"]
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.textColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.borderColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.backgroundColorToken
  | typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.colorToken

export type ChatRuntimeMessageHistoryBannerMobileColorPalette =
  Readonly<Record<ChatRuntimeMessageHistoryBannerMobileColorToken, string>>

export interface ChatRuntimeMessageHistoryBannerMobileColors {
  summary: {
    color: string
  }
  loadButton: {
    borderColor: string
    backgroundColor: string
    color: string
  }
  loadIcon: {
    color: string
  }
}

export interface ChatRuntimeMessageHistoryBannerStateInput {
  visibleCount?: number
  totalCount?: number
  hiddenCount?: number
  loadIncrement?: number
  isLoadingEarlier?: boolean
  includeScrollHint?: boolean
}

export interface ChatRuntimeMessageHistoryBannerState {
  shouldRender: boolean
  visibleCount: number
  totalCount: number
  hiddenCount: number
  summaryLabel: string
  loadEarlierLabel: string
}

export interface ChatRuntimeMessageHistoryBannerMobileRenderStateInput {
  visibleCount?: number
  totalCount?: number
  hiddenCount?: number
  loadIncrement?: number
  isLoadingEarlier?: boolean
  includeScrollHint?: boolean
  colors: ChatRuntimeMessageHistoryBannerMobileColorPalette
}

export interface ChatRuntimeMessageHistoryBannerMobileRenderState {
  shouldRender: boolean
  surface: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner
  colors: ChatRuntimeMessageHistoryBannerMobileColors
  summaryLabel: string
  loadButton: {
    accessibilityRole: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.accessibilityRole
    accessibilityLabel: string
    label: string
    icon: {
      name: typeof CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.loadEarlierName
      size: number
      color: string
    }
    pressedOpacity: typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.pressedOpacity
  }
}

type ChatRuntimeMessageHistoryBannerMobileSurface =
  typeof CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner

export type ChatRuntimeMessageHistoryBannerMobileSpacingToken =
  | ChatRuntimeMessageHistoryBannerMobileSurface["gap"]
  | ChatRuntimeMessageHistoryBannerMobileSurface["paddingVertical"]
  | ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["gap"]
  | ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["paddingHorizontal"]

export type ChatRuntimeMessageHistoryBannerMobileRadiusToken =
  ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["borderRadius"]

export interface ChatRuntimeMessageHistoryBannerMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeMessageHistoryBannerMobileRenderState, "surface" | "colors" | "loadButton">
  spacing: Readonly<Record<ChatRuntimeMessageHistoryBannerMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeMessageHistoryBannerMobileRadiusToken, number>>
}

export interface ChatRuntimeMessageHistoryBannerMobileStyleSlots {
  container: {
    flexDirection: ChatRuntimeMessageHistoryBannerMobileSurface["flexDirection"]
    flexWrap: ChatRuntimeMessageHistoryBannerMobileSurface["flexWrap"]
    justifyContent: ChatRuntimeMessageHistoryBannerMobileSurface["justifyContent"]
    alignItems: ChatRuntimeMessageHistoryBannerMobileSurface["alignItems"]
    gap: number
    paddingVertical: number
  }
  summaryText: {
    color: string
    fontSize: number
    lineHeight: number
    textAlign: ChatRuntimeMessageHistoryBannerMobileSurface["textAlign"]
  }
  loadButton: {
    flexDirection: ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["flexDirection"]
    alignItems: ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["alignItems"]
    justifyContent: ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["justifyContent"]
    gap: number
    paddingHorizontal: number
    paddingVertical: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  loadButtonPressed: {
    opacity: number
  }
  loadButtonText: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeMessageHistoryBannerMobileSurface["loadButton"]["fontWeight"]
  }
}

export interface ChatRuntimeViewportAffordanceMobileRenderStateInput {
  visibleMessageCount: number
  totalMessageCount: number
  hiddenMessageCount: number
  messageHistoryLoadIncrement: number
  latestStepSummary?: ChatRuntimeStepSummaryLike | null
  colors:
    & ChatRuntimeMessageHistoryBannerMobileColorPalette
    & ChatRuntimeStepSummaryMobileColorPalette
}

export interface ChatRuntimeViewportAffordanceMobileRenderState {
  historyBanner: {
    renderState: ChatRuntimeMessageHistoryBannerMobileRenderState
  }
  stepSummary: {
    renderState: ChatRuntimeStepSummaryMobileRenderState
  }
}

export interface ChatRuntimeMessageHistoryWindowMobileDisplayStateInput<TMessage> {
  messages: readonly TMessage[]
  visibleMessageCount: number
}

export interface ChatRuntimeMessageHistoryWindowMobileDisplayState<TMessage> {
  firstVisibleMessageIndex: number
  visibleMessages: readonly TMessage[]
  hiddenMessageCount: number
}

export interface ChatRuntimeMessageHistoryWindowMobileVisibleCountInput {
  currentVisibleCount: number
  messageCount: number
  initialVisibleCount?: number
}

export interface ChatRuntimeMessageHistoryWindowMobileExpandedVisibleCountInput {
  currentVisibleCount: number
  messageCount: number
  loadIncrement?: number
}

export interface ChatRuntimeMessageHistoryWindowMobileBottomStateInput {
  viewportHeight: number
  scrollOffsetY: number
  contentHeight: number
  bottomResumeThresholdPx?: number
}

export interface ChatRuntimeMessageHistoryWindowMobileLoadEarlierStateInput {
  scrollOffsetY: number
  visibleMessageCount: number
  messageCount: number
  topLoadThresholdPx?: number
}

export interface ChatRuntimeConversationChromeMobileStyleRenderStateInput {
  colors:
    & ChatRuntimeViewportMobileColorPalette
    & ChatRuntimeStreamingContentMobileColorPalette
    & ChatRuntimeConnectionBannerMobileColorPalette
    & ChatRuntimeRetryStatusMobileColorPalette
    & ChatRuntimeStepSummaryMobileColorPalette
    & ChatRuntimeDelegationCardMobileColorPalette
    & ChatRuntimeScrollToBottomMobileColorPalette
    & ChatRuntimeMessageHistoryBannerMobileColorPalette
}

export interface ChatRuntimeConversationChromeMobileStyleRenderState {
  viewport: ChatRuntimeViewportMobileRenderState
  streamingContent: ChatRuntimeStreamingContentMobileRenderState
  connectionBanner: ChatRuntimeConnectionBannerMobileRenderState
  retryStatus: ChatRuntimeRetryStatusMobileRenderState
  stepSummary: ChatRuntimeStepSummaryMobileRenderState
  delegationCard: ChatRuntimeDelegationCardMobileRenderState
  scrollToBottom: ChatRuntimeScrollToBottomMobileRenderState
  messageHistoryBanner: ChatRuntimeMessageHistoryBannerMobileRenderState
}

export type ChatRuntimeMobileChromeStyleColorPalette =
  & ChatRuntimeHeaderChromeMobileStyleRenderStateInput["colors"]
  & ChatRuntimeConversationChromeMobileStyleRenderStateInput["colors"]
  & ChatComposerRuntimeChromeMobileStyleColorPalette
  & ChatRuntimeThreadChromeMobileStyleColorPalette

export interface ChatRuntimeMobileChromeStyleRenderStateInput {
  colors: ChatRuntimeMobileChromeStyleColorPalette
  platform?: string | null
}

export interface ChatRuntimeMobileChromeStyleRenderState {
  header: ChatRuntimeHeaderChromeMobileStyleRenderState
  conversation: ChatRuntimeConversationChromeMobileStyleRenderState
  composer: ChatComposerRuntimeChromeMobileStyleRenderState
  messageQueuePanelWrapper: ReturnType<typeof getMessageQueuePanelMobileWrapperRenderState>
  headerActionButton: ReturnType<typeof createMinimumTouchTargetStyle>
  headerEdgeActionButton: ReturnType<typeof createMinimumTouchTargetStyle>
  headerPinButton: ReturnType<typeof createMinimumTouchTargetStyle>
  thread: ChatRuntimeThreadChromeMobileStyleRenderState
}

export interface ChatRuntimeMobileActivityAccessibilityState {
  loadingMessagesLabel: string
  loadingAgentActivityLabel: string
  thinkingLabel: string
}

export interface ChatRuntimeToolApprovalHeaderMobileIconState {
  name: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.name
  size: number
  colorToken: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.colorToken
}

export interface ChatRuntimeToolApprovalArgumentsToggleMobileIconState {
  isExpanded: boolean
  name:
    | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.expandedName
    | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.collapsedName
  size: number
  colorToken: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleText.colorToken
}

export interface ChatRuntimeToolApprovalActionMobileIconState {
  action: ChatRuntimeToolApprovalAction
  name:
    | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.approveName
    | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.denyName
  size: number
  colorToken:
    | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.approve.foregroundColorToken
    | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.deny.foregroundColorToken
}

export type ChatRuntimeToolApprovalMobileColorToken =
  | ChatRuntimeToolApprovalHeaderMobileIconState["colorToken"]
  | ChatRuntimeToolApprovalArgumentsToggleMobileIconState["colorToken"]
  | ChatRuntimeToolApprovalActionMobileIconState["colorToken"]
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.spinner.colorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonSpinner.colorToken

export type ChatRuntimeToolApprovalMobileColorPalette =
  Readonly<Record<ChatRuntimeToolApprovalMobileColorToken, string>>

export interface ChatRuntimeToolApprovalMobileIconColors {
  color: string
}

export interface ChatRuntimeToolApprovalMobileSpinnerColors {
  color: string
}

export interface ChatRuntimeToolApprovalInteractionStateInput {
  toolName: string
  isArgumentsExpanded?: boolean
  isResponding?: boolean
}

export interface ChatRuntimeToolApprovalInteractionState {
  copy: typeof CHAT_RUNTIME_PRESENTATION.approval
  title: string
  argumentsToggle: {
    label: string
    isDisabled: boolean
    accessibilityLabel: string
    accessibilityState: {
      expanded: boolean
      disabled: boolean
    }
    ariaExpanded: boolean
  }
  approveButton: {
    label: string
    isDisabled: boolean
    accessibilityLabel: string
    accessibilityState: {
      disabled: boolean
    }
  }
  denyButton: {
    label: string
    isDisabled: boolean
    accessibilityLabel: string
    accessibilityState: {
      disabled: boolean
    }
  }
}

export interface ChatRuntimeToolApprovalMobileAlertState {
  connectionRequired: {
    title: string
    message: string
  }
  unavailable: {
    title: string
    message: string
  }
  failed: {
    title: string
    fallbackMessage: string
  }
}

export type ChatRuntimeToolApprovalMobileSurfaceColorToken =
  | ChatRuntimeToolApprovalMobileColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.card.borderColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.card.backgroundColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.title.colorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolLabel.colorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolName.colorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.borderColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.backgroundColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.textColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleText.colorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.fullArguments.backgroundColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.fullArguments.textColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.approve.backgroundColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.approve.foregroundColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.deny.borderColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.deny.backgroundColorToken
  | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.deny.foregroundColorToken

export type ChatRuntimeToolApprovalMobileSurfaceColorPalette =
  Readonly<Record<ChatRuntimeToolApprovalMobileSurfaceColorToken, string>>

export interface ChatRuntimeToolApprovalMobileSurfaceColors {
  card: {
    borderColor: string
    backgroundColor: string
  }
  title: {
    color: string
  }
  toolLabel: {
    color: string
  }
  toolName: {
    color: string
  }
  argumentsPreview: {
    borderColor: string
    backgroundColor: string
    color: string
  }
  argumentsToggleText: {
    color: string
  }
  fullArguments: {
    backgroundColor: string
    color: string
  }
  approveButton: {
    backgroundColor: string
  }
  approveButtonText: {
    color: string
  }
  denyButton: {
    borderColor: string
    backgroundColor: string
  }
  denyButtonText: {
    color: string
  }
}

export interface ChatRuntimeToolApprovalMobileRenderStateInput {
  toolName: string
  isArgumentsExpanded?: boolean
  isResponding?: boolean
  colors: ChatRuntimeToolApprovalMobileSurfaceColorPalette
}

export interface ChatRuntimeToolApprovalCardMobileRenderStateInput {
  isApproval?: boolean
  toolApproval?: {
    approvalId: string
    toolName: string
    arguments?: unknown
  } | null
  expandedToolApprovals: ChatDisplayExpansionStateMap<string>
  pendingApprovalResponseId?: string | null
  colors: ChatRuntimeToolApprovalMobileSurfaceColorPalette
}

export interface ChatRuntimeToolApprovalMobileRenderState {
  copy: typeof CHAT_RUNTIME_PRESENTATION.approval
  surface: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile
  colors: ChatRuntimeToolApprovalMobileSurfaceColors
  title: string
  headerIcon: {
    name: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.name
    size: number
    color: string
  }
  spinner: {
    size: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.spinner.size
    color: string
  }
  argumentsToggle: {
    label: string
    isDisabled: boolean
    accessibilityRole: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggle.accessibilityRole
    accessibilityLabel: string
    accessibilityState: {
      expanded: boolean
      disabled: boolean
    }
    ariaExpanded: boolean
    pressedOpacity: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggle.pressedOpacity
    icon: {
      name:
        | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.expandedName
        | typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.collapsedName
      size: number
      color: string
    }
  }
  approveButton: {
    label: string
    isDisabled: boolean
    accessibilityRole: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.button.accessibilityRole
    accessibilityLabel: string
    accessibilityState: {
      disabled: boolean
    }
    icon: {
      name: ChatRuntimeToolApprovalActionMobileIconState["name"]
      size: number
      color: string
    }
    spinner: {
      size: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonSpinner.size
      color: string
    }
  }
  denyButton: {
    label: string
    isDisabled: boolean
    accessibilityRole: typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.button.accessibilityRole
    accessibilityLabel: string
    accessibilityState: {
      disabled: boolean
    }
    icon: {
      name: ChatRuntimeToolApprovalActionMobileIconState["name"]
      size: number
      color: string
    }
  }
}

type ChatRuntimeToolApprovalMobileSurface = typeof TOOL_APPROVAL_SURFACE_PRESENTATION.mobile

export type ChatRuntimeToolApprovalMobileSpacingToken =
  | ChatRuntimeToolApprovalMobileSurface["card"]["gap"]
  | ChatRuntimeToolApprovalMobileSurface["card"]["padding"]
  | ChatRuntimeToolApprovalMobileSurface["header"]["gap"]
  | ChatRuntimeToolApprovalMobileSurface["content"]["gap"]
  | ChatRuntimeToolApprovalMobileSurface["toolRow"]["gap"]
  | ChatRuntimeToolApprovalMobileSurface["argumentsPreview"]["paddingHorizontal"]
  | ChatRuntimeToolApprovalMobileSurface["argumentsToggle"]["marginTop"]
  | ChatRuntimeToolApprovalMobileSurface["actions"]["gap"]
  | ChatRuntimeToolApprovalMobileSurface["actions"]["marginTop"]
  | ChatRuntimeToolApprovalMobileSurface["button"]["paddingHorizontal"]
  | ChatRuntimeToolApprovalMobileSurface["button"]["paddingVertical"]

export type ChatRuntimeToolApprovalMobileRadiusToken =
  | ChatRuntimeToolApprovalMobileSurface["card"]["borderRadius"]
  | ChatRuntimeToolApprovalMobileSurface["argumentsPreview"]["borderRadius"]
  | ChatRuntimeToolApprovalMobileSurface["fullArguments"]["borderRadius"]
  | ChatRuntimeToolApprovalMobileSurface["button"]["borderRadius"]

export interface ChatRuntimeToolApprovalMobileStyleSlotsInput {
  renderState: Pick<ChatRuntimeToolApprovalMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatRuntimeToolApprovalMobileSpacingToken, number>>
  radius: Readonly<Record<ChatRuntimeToolApprovalMobileRadiusToken, number>>
  platform?: ChatRuntimeMobileFontPlatform | null
}

export interface ChatRuntimeToolApprovalMobileStyleSlots {
  card: {
    gap: number
    padding: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  header: {
    flexDirection: ChatRuntimeToolApprovalMobileSurface["header"]["flexDirection"]
    alignItems: ChatRuntimeToolApprovalMobileSurface["header"]["alignItems"]
    gap: number
  }
  content: {
    gap: number
  }
  contentDisabled: {
    opacity: number
  }
  title: {
    flex: number
    minWidth: number
    fontSize: number
    fontWeight: ChatRuntimeToolApprovalMobileSurface["title"]["fontWeight"]
    color: string
  }
  toolRow: {
    flexDirection: ChatRuntimeToolApprovalMobileSurface["toolRow"]["flexDirection"]
    alignItems: ChatRuntimeToolApprovalMobileSurface["toolRow"]["alignItems"]
    flexWrap: ChatRuntimeToolApprovalMobileSurface["toolRow"]["flexWrap"]
    gap: number
    marginBottom: number
  }
  toolLabel: {
    fontSize: number
    fontWeight: ChatRuntimeToolApprovalMobileSurface["toolLabel"]["fontWeight"]
    color: string
  }
  tool: {
    fontFamily: string
    fontSize: number
    color: string
    flexShrink: number
  }
  argumentsPreview: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    borderWidth: number
    borderRadius: number
    paddingHorizontal: number
    paddingVertical: number
    borderColor: string
    backgroundColor: string
    color: string
  }
  argumentsToggle: {
    flexDirection: ChatRuntimeToolApprovalMobileSurface["argumentsToggle"]["flexDirection"]
    alignItems: ChatRuntimeToolApprovalMobileSurface["argumentsToggle"]["alignItems"]
    alignSelf: ChatRuntimeToolApprovalMobileSurface["argumentsToggle"]["alignSelf"]
    gap: number
    marginTop: number
    paddingVertical: number
  }
  argumentsTogglePressed: {
    opacity: number
  }
  argumentsToggleText: {
    fontSize: number
    fontWeight: ChatRuntimeToolApprovalMobileSurface["argumentsToggleText"]["fontWeight"]
    color: string
  }
  argumentsScroll: {
    marginTop: number
    maxHeight: number
    borderRadius: number
    backgroundColor: string
  }
  argumentsFull: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    padding: number
    color: string
  }
  actions: {
    flexDirection: ChatRuntimeToolApprovalMobileSurface["actions"]["flexDirection"]
    justifyContent: ChatRuntimeToolApprovalMobileSurface["actions"]["justifyContent"]
    flexWrap: ChatRuntimeToolApprovalMobileSurface["actions"]["flexWrap"]
    gap: number
    marginTop: number
  }
  button: {
    minHeight: number
    minWidth: number
    borderRadius: number
    paddingHorizontal: number
    paddingVertical: number
    flexDirection: ChatRuntimeToolApprovalMobileSurface["button"]["flexDirection"]
    alignItems: ChatRuntimeToolApprovalMobileSurface["button"]["alignItems"]
    justifyContent: ChatRuntimeToolApprovalMobileSurface["button"]["justifyContent"]
    gap: number
    flex: number
  }
  buttonDisabled: {
    opacity: number
  }
  approveButton: {
    backgroundColor: string
  }
  approveButtonText: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeToolApprovalMobileSurface["buttonText"]["fontWeight"]
  }
  denyButton: {
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
  denyButtonText: {
    color: string
    fontSize: number
    fontWeight: ChatRuntimeToolApprovalMobileSurface["buttonText"]["fontWeight"]
  }
}

export interface ChatRuntimeToolApprovalCardMobileRenderState {
  approvalId: string
  renderState: ChatRuntimeToolApprovalMobileRenderState
  toolName: string
  argumentsPreview: string
  argumentsContent: string
}

export interface ChatComposerRuntimeDraftMessageStateInput {
  input?: string | null
  pendingImages?: readonly ChatImageAttachmentMessageInput[]
}

export interface ChatComposerRuntimeDraftMessageState {
  content: string
  hasContent: boolean
}

export const CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS = {
  maxImages: MAX_CHAT_IMAGE_ATTACHMENTS,
  maxFileBytes: MAX_CHAT_IMAGE_FILE_BYTES,
  maxTotalEmbeddedBytes: MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
} as const

export interface ChatComposerRuntimeImagePickerLaunchOptionsInput<TMediaTypes> {
  mediaTypes: TMediaTypes
  selectionLimit: number
}

export interface ChatComposerRuntimeImagePickerLaunchOptions<TMediaTypes> {
  mediaTypes: TMediaTypes
  allowsMultipleSelection: true
  selectionLimit: number
  quality: number
  base64: true
}

export interface ChatRuntimeThemeSpinnerSourceInput<TSpinnerSource> {
  isDark: boolean
  darkSource: TSpinnerSource
  lightSource: TSpinnerSource
}

export type ChatRuntimeMobileFontFamilyByPlatform = Readonly<{
  ios: string
  default: string
}>

export type ChatRuntimeMobileFontPlatform = string

export type ChatComposerMobileIconName =
  | typeof CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.name
  | typeof CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.enabledName
  | typeof CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.disabledName
  | typeof CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.name
  | typeof CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name
  | typeof CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.name
  | typeof CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.activeName
  | typeof CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.inactiveName

export type ChatComposerMobileIconColorToken =
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.activeIconColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.inactiveIconColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.iconColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.foregroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.activeForegroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.inactiveForegroundColorToken

export interface ChatComposerMobileIconState {
  name: ChatComposerMobileIconName
  size: number
  colorToken: ChatComposerMobileIconColorToken
  isActive?: boolean
  isQueueMode?: boolean
}

export type ChatComposerMobileIconColorPalette =
  Readonly<Record<ChatComposerMobileIconColorToken, string>>

export interface ChatComposerMobileIconColors {
  icon: {
    color: string
  }
}

export interface ChatComposerImageAttachmentMobileRenderStateInput {
  hasImages?: boolean
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerImageAttachmentMobileRenderState {
  isActive: boolean
  accessibilityRole: ChatComposerMobileControlState["imageAttachment"]["accessibilityRole"]
  accessibilityLabel: ChatComposerMobileControlState["imageAttachment"]["accessibilityLabel"]
  accessibilityHint: ChatComposerMobileControlState["imageAttachment"]["accessibilityHint"]
  icon: {
    name: ChatComposerMobileIconState["name"]
    size: number
    color: string
  }
}

type ChatComposerImageAttachmentMobileSurface = ChatImageAttachmentMobileRenderState["surface"]

export type ChatComposerImageAttachmentMobileSpacingToken =
  | ChatComposerImageAttachmentMobileSurface["row"]["paddingHorizontal"]
  | ChatComposerImageAttachmentMobileSurface["row"]["paddingTop"]
  | ChatComposerImageAttachmentMobileSurface["row"]["gap"]

export type ChatComposerImageAttachmentMobileRadiusToken =
  ChatComposerImageAttachmentMobileSurface["preview"]["borderRadius"]

export interface ChatComposerImageAttachmentMobileStyleSlotsInput {
  renderState: Pick<ChatImageAttachmentMobileRenderState, "surface" | "colors">
  spacing: Readonly<Record<ChatComposerImageAttachmentMobileSpacingToken, number>>
  radius: Readonly<Record<ChatComposerImageAttachmentMobileRadiusToken, number>>
}

export interface ChatComposerTextToSpeechMobileRenderStateInput {
  isEnabled?: boolean
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerTextToSpeechMobileRenderState {
  isActive: boolean
  accessibilityRole: ChatComposerMobileControlState["textToSpeech"]["accessibilityRole"]
  accessibilityLabel: ChatComposerMobileControlState["textToSpeech"]["accessibilityLabel"]
  accessibilityHint: ChatComposerMobileControlState["textToSpeech"]["accessibilityHint"]
  accessibilityState: ChatComposerMobileControlState["textToSpeech"]["accessibilityState"]
  ariaChecked: ChatComposerMobileControlState["textToSpeech"]["ariaChecked"]
  icon: {
    name: ChatComposerMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatComposerEditBeforeSendMobileRenderStateInput {
  isEnabled?: boolean
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerEditBeforeSendMobileRenderState {
  isActive: boolean
  accessibilityRole: ChatComposerMobileControlState["editBeforeSend"]["accessibilityRole"]
  accessibilityLabel: ChatComposerMobileControlState["editBeforeSend"]["accessibilityLabel"]
  accessibilityHint: ChatComposerMobileControlState["editBeforeSend"]["accessibilityHint"]
  accessibilityState: ChatComposerMobileControlState["editBeforeSend"]["accessibilityState"]
  ariaChecked: ChatComposerMobileControlState["editBeforeSend"]["ariaChecked"]
  icon: {
    name: ChatComposerMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatComposerMobileVisibilityRenderStateInput {
  handsFree?: boolean
  listening?: boolean
  messageQueueEnabled?: boolean
}

export interface ChatComposerMobileVisibilityRenderState {
  voiceOverlay: {
    isVisible: boolean
  }
  handsFreeControls: {
    isVisible: boolean
  }
  editBeforeSendControl: {
    shouldRender: boolean
  }
  queueAction: {
    shouldRender: boolean
  }
  micButton: {
    shouldUsePushToTalk: boolean
    shouldUseHandsFreePrimaryControl: boolean
  }
}

export interface ChatComposerMobileActionAvailabilityRenderStateInput {
  hasContent?: boolean
  handsFree?: boolean
  presentation?: Pick<FollowUpInputPresentation, "isDisabled">
}

export interface ChatComposerMobileActionAvailabilityRenderState {
  queueAction: {
    isDisabled: boolean
  }
  submitAction: {
    isDisabled: boolean
  }
}

export type ChatComposerMobileTextColorToken =
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.textColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.textColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.placeholderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.textColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.foregroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.inactiveForegroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.activeForegroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.textColorToken

export type ChatComposerMobileTextColorPalette =
  Readonly<Record<ChatComposerMobileTextColorToken, string>>

export interface ChatComposerMobileTextColors {
  sttPreview: {
    labelColor: string
    textColor: string
  }
  input: {
    color: string
    placeholderColor: string
  }
  queueButton: {
    color: string
  }
  submitButton: {
    color: string
  }
  micButton: {
    color: string
    activeColor: string
  }
  voiceOverlay: {
    color: string
  }
}

export type ChatComposerMobileSurfaceColorToken =
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.borderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.borderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.borderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.borderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.activeBorderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.activeBackgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.borderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.borderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.backgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.activeBorderColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.activeBackgroundColorToken
  | typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.cardBackgroundColorToken

export type ChatComposerMobileSurfaceColorPalette =
  Readonly<Record<ChatComposerMobileSurfaceColorToken, string>>

export interface ChatComposerMobileSurfaceColors {
  inputArea: {
    borderColor: string
    backgroundColor: string
  }
  input: {
    borderColor: string
    backgroundColor: string
  }
  sttPreview: {
    borderColor: string
    backgroundColor: string
  }
  accessoryButton: {
    borderColor: string
    backgroundColor: string
    activeBorderColor: string
    activeBackgroundColor: string
  }
  submitButton: {
    backgroundColor: string
  }
  queueButton: {
    borderColor: string
    backgroundColor: string
  }
  micButton: {
    borderColor: string
    backgroundColor: string
    activeBorderColor: string
    activeBackgroundColor: string
  }
  voiceOverlay: {
    cardBackgroundColor: string
  }
}

export type ChatComposerMobileSurfaceRenderStateColorToken =
  | ChatComposerMobileSurfaceColorToken
  | ChatComposerMobileTextColorToken

export type ChatComposerMobileSurfaceRenderStateColorPalette =
  Readonly<Record<ChatComposerMobileSurfaceRenderStateColorToken, string>>

export interface ChatComposerMobileSurfaceRenderStateInput {
  colors: ChatComposerMobileSurfaceRenderStateColorPalette
  platform?: string | null
}

export interface ChatComposerMobileTextInputPlatformState {
  paddingVertical: typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.paddingVerticalByPlatform[
    keyof typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.paddingVerticalByPlatform
  ]
}

export interface ChatComposerMobileSurfaceRenderState {
  surface: typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile
  input: ChatComposerMobileTextInputPlatformState
  colors: {
    surface: ChatComposerMobileSurfaceColors
    text: ChatComposerMobileTextColors
  }
}

type ChatComposerMobileStyleRenderState = ChatComposerMobileSurfaceRenderState
type ChatComposerMobileStyleSurface = ChatComposerMobileStyleRenderState["surface"]

export type ChatComposerMobileStyleSpacingToken =
  | ChatComposerMobileStyleSurface["sttPreview"]["marginHorizontal"]
  | ChatComposerMobileStyleSurface["sttPreview"]["marginTop"]
  | ChatComposerMobileStyleSurface["sttPreview"]["paddingHorizontal"]
  | ChatComposerMobileStyleSurface["sttPreview"]["paddingVertical"]
  | ChatComposerMobileStyleSurface["inputRow"]["gap"]
  | ChatComposerMobileStyleSurface["inputRow"]["paddingHorizontal"]
  | ChatComposerMobileStyleSurface["inputRow"]["paddingVertical"]
  | ChatComposerMobileStyleSurface["input"]["paddingHorizontal"]
  | ChatComposerMobileStyleSurface["inputArea"]["micWrapperPaddingHorizontal"]
  | ChatComposerMobileStyleSurface["inputArea"]["micWrapperPaddingBottom"]
  | ChatComposerMobileStyleSurface["micButton"]["gap"]
  | ChatComposerMobileStyleSurface["submitButton"]["paddingHorizontal"]
  | ChatComposerMobileStyleSurface["submitButton"]["paddingVertical"]
  | ChatComposerMobileStyleSurface["voiceOverlay"]["paddingHorizontal"]
  | ChatComposerMobileStyleSurface["voiceOverlay"]["paddingBottom"]

export type ChatComposerMobileStyleRadiusToken =
  | ChatComposerMobileStyleSurface["sttPreview"]["borderRadius"]
  | ChatComposerMobileStyleSurface["input"]["borderRadius"]
  | ChatComposerMobileStyleSurface["micButton"]["borderRadius"]
  | ChatComposerMobileStyleSurface["submitButton"]["borderRadius"]
  | ChatComposerMobileStyleSurface["voiceOverlay"]["cardBorderRadius"]

export type ChatComposerMobileStyleBorderWidthToken =
  ChatComposerMobileStyleSurface["inputArea"]["borderTopWidthToken"]

export interface ChatComposerMobileStyleSlotsInput {
  renderState: ChatComposerMobileStyleRenderState
  spacing: Readonly<Record<ChatComposerMobileStyleSpacingToken, number>>
  radius: Readonly<Record<ChatComposerMobileStyleRadiusToken, number>>
  borderWidths: Readonly<Record<ChatComposerMobileStyleBorderWidthToken, number>>
}

type ChatConversationHomePromptLibraryMobileStyleRenderState =
  ReturnType<typeof getPromptLibraryMobileSurfaceRenderState>
type ChatConversationHomePromptLibraryMobileStyleSurface =
  ChatConversationHomePromptLibraryMobileStyleRenderState["surface"]

export type ChatConversationHomePromptLibraryMobileStyleSpacingToken =
  | ChatConversationHomePromptLibraryMobileStyleSurface["quickStartCard"]["marginHorizontal"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["quickStartCard"]["marginTop"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["quickStartCard"]["padding"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["quickStartCard"]["gap"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["emptyText"]["paddingVertical"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutGrid"]["gap"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutCard"]["paddingHorizontal"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutCard"]["paddingVertical"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutCard"]["gap"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutSourcePill"]["gap"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutSourcePill"]["paddingHorizontal"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutActions"]["gap"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutActions"]["marginTop"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutActionButton"]["paddingHorizontal"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutActionButton"]["gap"]

export type ChatConversationHomePromptLibraryMobileStyleRadiusToken =
  | ChatConversationHomePromptLibraryMobileStyleSurface["quickStartCard"]["borderRadius"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutCard"]["borderRadius"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutSourcePill"]["borderRadius"]
  | ChatConversationHomePromptLibraryMobileStyleSurface["shortcutActionButton"]["borderRadius"]

export interface ChatConversationHomePromptLibraryMobileStyleSlotsInput {
  renderState: ChatConversationHomePromptLibraryMobileStyleRenderState
  spacing: Readonly<Record<ChatConversationHomePromptLibraryMobileStyleSpacingToken, number>>
  radius: Readonly<Record<ChatConversationHomePromptLibraryMobileStyleRadiusToken, number>>
}

type ChatConversationHomePromptEditorMobileStyleSurface =
  ChatConversationHomePromptLibraryMobileStyleSurface["editorModal"]

export type ChatConversationHomePromptEditorMobileStyleSpacingToken =
  | ChatConversationHomePromptEditorMobileStyleSurface["overlay"]["padding"]
  | ChatConversationHomePromptEditorMobileStyleSurface["content"]["padding"]
  | ChatConversationHomePromptEditorMobileStyleSurface["header"]["gap"]
  | ChatConversationHomePromptEditorMobileStyleSurface["header"]["marginBottom"]
  | ChatConversationHomePromptEditorMobileStyleSurface["label"]["marginBottom"]
  | ChatConversationHomePromptEditorMobileStyleSurface["input"]["paddingHorizontal"]
  | ChatConversationHomePromptEditorMobileStyleSurface["input"]["marginBottom"]
  | ChatConversationHomePromptEditorMobileStyleSurface["multilineInput"]["paddingTop"]
  | ChatConversationHomePromptEditorMobileStyleSurface["multilineInput"]["paddingBottom"]
  | ChatConversationHomePromptEditorMobileStyleSurface["actions"]["gap"]
  | ChatConversationHomePromptEditorMobileStyleSurface["actions"]["marginTop"]
  | ChatConversationHomePromptEditorMobileStyleSurface["cancelButton"]["paddingHorizontal"]
  | ChatConversationHomePromptEditorMobileStyleSurface["cancelButton"]["paddingVertical"]
  | ChatConversationHomePromptEditorMobileStyleSurface["saveButton"]["paddingHorizontal"]
  | ChatConversationHomePromptEditorMobileStyleSurface["saveButton"]["paddingVertical"]

export type ChatConversationHomePromptEditorMobileStyleRadiusToken =
  | ChatConversationHomePromptEditorMobileStyleSurface["content"]["borderRadius"]
  | ChatConversationHomePromptEditorMobileStyleSurface["closeButton"]["borderRadius"]
  | ChatConversationHomePromptEditorMobileStyleSurface["input"]["borderRadius"]
  | ChatConversationHomePromptEditorMobileStyleSurface["cancelButton"]["borderRadius"]
  | ChatConversationHomePromptEditorMobileStyleSurface["saveButton"]["borderRadius"]

export interface ChatConversationHomePromptEditorMobileStyleSlotsInput {
  renderState: ChatConversationHomePromptLibraryMobileStyleRenderState
  inputPaddingVertical: number
  spacing: Readonly<Record<ChatConversationHomePromptEditorMobileStyleSpacingToken, number>>
  radius: Readonly<Record<ChatConversationHomePromptEditorMobileStyleRadiusToken, number>>
}

export type ChatComposerRuntimeChromeMobileStyleColorPalette =
  & ChatComposerMobileSurfaceRenderStateColorPalette
  & ChatImageAttachmentMobileSurfaceColorPalette
  & PromptLibraryMobileSurfaceColorPalette
  & HandsFreeComposerMobileSurfaceColorPalette

export interface ChatComposerRuntimeChromeMobileStyleRenderStateInput {
  colors: ChatComposerRuntimeChromeMobileStyleColorPalette
  platform?: string | null
}

export interface ChatComposerRuntimeChromeMobileStyleRenderState {
  composer: ChatComposerMobileSurfaceRenderState
  imageAttachment: ReturnType<typeof getChatImageAttachmentMobileRenderState>
  promptLibrary: ReturnType<typeof getPromptLibraryMobileSurfaceRenderState>
  promptEditorInputPaddingVertical: ReturnType<typeof getPromptLibraryEditorInputPaddingVertical>
  handsFree: ReturnType<typeof getHandsFreeComposerMobileSurfaceRenderState>
}

export type ChatComposerRuntimeDockMobileColorPalette =
  & ChatComposerMobileSurfaceRenderStateColorPalette
  & HandsFreeComposerMobileSurfaceColorPalette

export interface ChatComposerRuntimeDockMobileRenderStateInput {
  colors: ChatComposerRuntimeDockMobileColorPalette
  platform?: string | null
}

export interface ChatComposerRuntimeDockMobileRenderState {
  handsFreeControls: {
    controlPressedOpacity: number
  }
  imageAttachmentControl: {
    activeOpacity: number
  }
  textToSpeechControl: {
    activeOpacity: number
  }
  editBeforeSendControl: {
    activeOpacity: number
  }
  textEntry: {
    placeholderTextColor: string
    webAccessibility: {
      isWebPlatform: boolean
      inputDescriptionNativeId: typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.webAccessibility.inputDescriptionNativeId
      voiceStatusLiveRegionNativeId: typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.webAccessibility.voiceStatusLiveRegionNativeId
      voiceStatusLiveRegionPoliteness: typeof CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.webAccessibility.voiceStatusLiveRegionPoliteness
    }
  }
  queueAction: {
    activeOpacity: number
  }
  submitAction: {
    activeOpacity: number
  }
  micButton: {
    webPressedStyle: ChatComposerMicMobileWebPressStyleState | undefined
  }
}

export interface ChatComposerSubmitMobileIconStateInput {
  mode?: FollowUpInputMode
  isHandsFree?: boolean
}

export interface ChatComposerSubmitMobileActionStateInput {
  presentation: Pick<FollowUpInputPresentation, "mode" | "submitAriaLabel" | "submitHint">
  isHandsFree?: boolean
  isDisabled?: boolean
}

export interface ChatComposerSubmitMobileActionState {
  isQueueMode: boolean
  isDisabled: boolean
  label: string
  accessibilityRole: "button"
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityState: {
    disabled: boolean
  }
}

export interface ChatComposerSubmitMobileRenderStateInput extends ChatComposerSubmitMobileActionStateInput {
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerSubmitMobileRenderState extends ChatComposerSubmitMobileActionState {
  icon: {
    name: ChatComposerMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatComposerQueueMobileActionStateInput {
  isDisabled?: boolean
}

export interface ChatComposerQueueMobileActionState {
  isDisabled: boolean
  label: string
  accessibilityRole: "button"
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityState: {
    disabled: boolean
  }
  debugMessage: string
}

export interface ChatComposerQueueMobileRenderStateInput extends ChatComposerQueueMobileActionStateInput {
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerQueueMobileRenderState extends ChatComposerQueueMobileActionState {
  icon: {
    name: ChatComposerMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatComposerMicMobileActionStateInput {
  label: string
  handsFree: boolean
  listening: boolean
  willCancel: boolean
}

export interface ChatComposerMicMobileActionState {
  label: string
  accessibilityRole: "button"
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityState: {
    busy: boolean
  }
  ariaBusy: boolean
  labelSelectable: false
}

export interface ChatComposerMicMobileRenderStateInput extends ChatComposerMicMobileActionStateInput {
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerMicMobileRenderState extends ChatComposerMicMobileActionState {
  isActive: boolean
  icon: {
    name: ChatComposerMobileIconState["name"]
    size: number
    color: string
  }
}

export interface ChatComposerRuntimeControlMobileRenderStateInput {
  hasContent?: boolean
  handsFree?: boolean
  presentation: FollowUpInputPresentation
  pendingImageCount?: number | null
  ttsEnabled?: boolean
  editBeforeSendEnabled?: boolean
  micPhase: Parameters<typeof getHandsFreeMicButtonLabel>[0]["phase"]
  listening?: boolean
  messageQueueEnabled?: boolean
  colors: ChatComposerMobileIconColorPalette
}

export interface ChatComposerRuntimeControlMobileRenderState {
  controls: ChatComposerMobileControlState
  actionAvailability: ChatComposerMobileActionAvailabilityRenderState
  visibility: ChatComposerMobileVisibilityRenderState
  imageAttachment: ChatComposerImageAttachmentMobileRenderState
  textToSpeech: ChatComposerTextToSpeechMobileRenderState
  editBeforeSend: ChatComposerEditBeforeSendMobileRenderState
  queueAction: ChatComposerQueueMobileRenderState
  submitAction: ChatComposerSubmitMobileRenderState
  micButton: ChatComposerMicMobileRenderState
}

export interface ChatComposerRuntimeFollowUpPresentationStateInput {
  conversationState?: AgentConversationState | null
  isResponding?: boolean
  isQueueEnabled?: boolean
}

export interface ChatComposerRuntimeTextEntryMobileRenderStateInput {
  presentation: Pick<FollowUpInputPresentation, "placeholder" | "submitTitle">
  handsFree: boolean
  phase: Parameters<typeof getHandsFreeComposerPlaceholder>[0]["phase"]
  listening: boolean
  willCancel: boolean
  liveTranscript?: string
  wakePhrase: Parameters<typeof getHandsFreeComposerPlaceholder>[0]["wakePhrase"]
  placeholderFallback?: Parameters<typeof getHandsFreeComposerPlaceholder>[0]["fallback"]
  isWebPlatform?: boolean
  speechPreviewText?: string | null
}

export interface ChatComposerRuntimeTextEntryMobileRenderState {
  accessibilityHint: string
  placeholder: string
  voiceStatusLiveRegionAnnouncement: string
}

export interface ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput {
  phase: Parameters<typeof getHandsFreeStatusSubtitle>[0]["phase"]
  label: string
  isEnabled?: boolean
  wakePhrase: Parameters<typeof getHandsFreeStatusSubtitle>[0]["wakePhrase"]
  sleepPhrase: Parameters<typeof getHandsFreeStatusSubtitle>[0]["sleepPhrase"]
  lastError: Parameters<typeof getHandsFreeStatusSubtitle>[0]["lastError"]
  foregroundOnly: Parameters<typeof getHandsFreeStatusSubtitle>[0]["foregroundOnly"]
}

export interface ChatComposerRuntimeHandsFreeControlsMobileRenderState {
  status: {
    phase: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["phase"]
    label: string
    subtitle: string | undefined
  }
  controlState: ReturnType<typeof getHandsFreeComposerControlState>
}

export type ChatComposerRuntimeDockMobilePropsChromeInput = {
  handsFreeControls: object
  imageAttachmentControl: object
  textToSpeechControl: object
  editBeforeSendControl: object
  textEntry: {
    webAccessibility: {
      isWebPlatform: boolean
    }
  } & object
  queueAction: object
  submitAction: object
  micButton: object
}

export type ChatComposerRuntimeDockMobilePropsInput = {
  chrome: ChatComposerRuntimeDockMobilePropsChromeInput
  speechPreviewText: ChatComposerRuntimeTextEntryMobileRenderStateInput["speechPreviewText"]
  pendingImages: unknown
  pendingImagesColors: Parameters<typeof getChatImageAttachmentMobileRenderState>[0]["colors"]
  onRemovePendingImage: unknown
  handsFreeStatusPhase: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["phase"]
  handsFreeStatusLabel: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["label"]
  handsFreeStatusEnabled: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["isEnabled"]
  handsFreeStatusWakePhrase: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["wakePhrase"]
  handsFreeStatusSleepPhrase: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["sleepPhrase"]
  handsFreeStatusLastError: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["lastError"]
  handsFreeStatusForegroundOnly: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput["foregroundOnly"]
  onWakeHandsFree: unknown
  onSleepHandsFree: unknown
  onResumeHandsFree: unknown
  onPauseHandsFree: unknown
  composerControlHasContent: ChatComposerRuntimeControlMobileRenderStateInput["hasContent"]
  composerControlConversationState: ChatComposerRuntimeFollowUpPresentationStateInput["conversationState"]
  composerControlIsResponding: ChatComposerRuntimeFollowUpPresentationStateInput["isResponding"]
  composerControlPendingImageCount: ChatComposerRuntimeControlMobileRenderStateInput["pendingImageCount"]
  composerControlTtsEnabled: ChatComposerRuntimeControlMobileRenderStateInput["ttsEnabled"]
  composerControlEditBeforeSendEnabled: ChatComposerRuntimeControlMobileRenderStateInput["editBeforeSendEnabled"]
  composerControlMicPhase: ChatComposerRuntimeControlMobileRenderStateInput["micPhase"]
  composerControlListening: ChatComposerRuntimeControlMobileRenderStateInput["listening"]
  composerControlMessageQueueEnabled: ChatComposerRuntimeControlMobileRenderStateInput["messageQueueEnabled"]
  composerControlColors: ChatComposerRuntimeControlMobileRenderStateInput["colors"]
  onImageAttachmentPress: unknown
  onTextToSpeechPress: unknown
  onEditBeforeSendPress: unknown
  textEntryInputRef: unknown
  textEntryValue: unknown
  onTextEntryChangeText: unknown
  onTextEntryKeyPress: unknown
  textEntryHandsFree: ChatComposerRuntimeTextEntryMobileRenderStateInput["handsFree"]
  textEntryListening: ChatComposerRuntimeTextEntryMobileRenderStateInput["listening"]
  textEntryWillCancel: ChatComposerRuntimeTextEntryMobileRenderStateInput["willCancel"]
  textEntryLiveTranscript: ChatComposerRuntimeTextEntryMobileRenderStateInput["liveTranscript"]
  textEntryWakePhrase: ChatComposerRuntimeTextEntryMobileRenderStateInput["wakePhrase"]
  textEntryPlaceholderFallback?: ChatComposerRuntimeTextEntryMobileRenderStateInput["placeholderFallback"]
  onQueueActionPress: unknown
  onSubmitActionPress: unknown
  onMicPressIn: unknown
  onMicPressOut: unknown
  onMicPress: unknown
  micWrapperRef?: unknown
}

export type ChatComposerRuntimeDockMobileProps<TInput extends ChatComposerRuntimeDockMobilePropsInput> = {
  speechPreview: {
    label: ChatComposerMobileControlState["sttPreview"]["label"]
    text: TInput["speechPreviewText"]
  }
  pendingImagesRail: {
    images: TInput["pendingImages"]
    renderState: ChatImageAttachmentMobileRenderState
    onRemove: TInput["onRemovePendingImage"]
  }
  handsFreeControls: {
    isVisible: ChatComposerRuntimeControlMobileRenderState["visibility"]["handsFreeControls"]["isVisible"]
    status: ChatComposerRuntimeHandsFreeControlsMobileRenderState["status"]
    controlState: ChatComposerRuntimeHandsFreeControlsMobileRenderState["controlState"]
    onWake: TInput["onWakeHandsFree"]
    onSleep: TInput["onSleepHandsFree"]
    onResume: TInput["onResumeHandsFree"]
    onPause: TInput["onPauseHandsFree"]
  } & TInput["chrome"]["handsFreeControls"]
  imageAttachmentControl: {
    renderState: ChatComposerRuntimeControlMobileRenderState["imageAttachment"]
    onPress: TInput["onImageAttachmentPress"]
  } & TInput["chrome"]["imageAttachmentControl"]
  textToSpeechControl: {
    renderState: ChatComposerRuntimeControlMobileRenderState["textToSpeech"]
    onPress: TInput["onTextToSpeechPress"]
  } & TInput["chrome"]["textToSpeechControl"]
  editBeforeSendControl: {
    shouldRender: ChatComposerRuntimeControlMobileRenderState["visibility"]["editBeforeSendControl"]["shouldRender"]
    renderState: ChatComposerRuntimeControlMobileRenderState["editBeforeSend"]
    onPress: TInput["onEditBeforeSendPress"]
  } & TInput["chrome"]["editBeforeSendControl"]
  textEntry: {
    inputRef: TInput["textEntryInputRef"]
    value: TInput["textEntryValue"]
    onChangeText: TInput["onTextEntryChangeText"]
    onKeyPress: TInput["onTextEntryKeyPress"]
    accessibilityLabel: ChatComposerMobileControlState["field"]["accessibilityLabel"]
    accessibilityHint: ChatComposerRuntimeTextEntryMobileRenderState["accessibilityHint"]
    placeholder: ChatComposerRuntimeTextEntryMobileRenderState["placeholder"]
    voiceStatusLiveRegionAnnouncement: ChatComposerRuntimeTextEntryMobileRenderState["voiceStatusLiveRegionAnnouncement"]
  } & TInput["chrome"]["textEntry"]
  queueAction: {
    shouldRender: ChatComposerRuntimeControlMobileRenderState["visibility"]["queueAction"]["shouldRender"]
    renderState: ChatComposerRuntimeControlMobileRenderState["queueAction"]
    onPress: TInput["onQueueActionPress"]
  } & TInput["chrome"]["queueAction"]
  submitAction: {
    renderState: ChatComposerRuntimeControlMobileRenderState["submitAction"]
    onPress: TInput["onSubmitActionPress"]
  } & TInput["chrome"]["submitAction"]
  micButton: {
    renderState: ChatComposerRuntimeControlMobileRenderState["micButton"]
    onPressIn: TInput["onMicPressIn"] | undefined
    onPressOut: TInput["onMicPressOut"] | undefined
    onPress: TInput["onMicPress"] | undefined
  } & TInput["chrome"]["micButton"]
  micWrapperRef: TInput["micWrapperRef"]
}

type ChatComposerHandsFreeMobileSurface = ReturnType<typeof getHandsFreeComposerMobileSurfaceRenderState>["surface"]

export type ChatComposerHandsFreeMobileSpacingToken =
  | ChatComposerHandsFreeMobileSurface["statusRow"]["paddingHorizontal"]
  | ChatComposerHandsFreeMobileSurface["statusRow"]["paddingTop"]
  | ChatComposerHandsFreeMobileSurface["controlsRow"]["gap"]
  | ChatComposerHandsFreeMobileSurface["controlsRow"]["paddingHorizontal"]
  | ChatComposerHandsFreeMobileSurface["controlsRow"]["paddingTop"]
  | ChatComposerHandsFreeMobileSurface["controlButton"]["paddingHorizontal"]
  | ChatComposerHandsFreeMobileSurface["debugPanel"]["padding"]
  | ChatComposerHandsFreeMobileSurface["debugPanel"]["margin"]

export type ChatComposerHandsFreeMobileRadiusToken =
  | ChatComposerHandsFreeMobileSurface["controlButton"]["borderRadius"]
  | ChatComposerHandsFreeMobileSurface["debugPanel"]["borderRadius"]

export interface ChatComposerHandsFreeMobileStyleSlotsInput {
  renderState: ReturnType<typeof getHandsFreeComposerMobileSurfaceRenderState>
  spacing: Readonly<Record<ChatComposerHandsFreeMobileSpacingToken, number>>
  radius: Readonly<Record<ChatComposerHandsFreeMobileRadiusToken, number>>
  platform?: ChatRuntimeMobileFontPlatform | null
}

export type ChatComposerRuntimeHandsFreeDebugMessageKey = HandsFreeComposerDebugMessageKey

export interface ChatComposerMicMobileWebPressStyleState {
  userSelect: "none"
  WebkitUserSelect: "none"
  WebkitTouchCallout: "none"
  touchAction: "manipulation"
}

export interface ChatComposerMobileControlStateInput {
  textToSpeechEnabled?: boolean
  editBeforeSendEnabled?: boolean
}

export interface ChatComposerMobileControlState {
  sttPreview: {
    label: string
  }
  imageAttachment: {
    accessibilityRole: "button"
    accessibilityLabel: string
    accessibilityHint: string
  }
  textToSpeech: {
    accessibilityRole: "switch"
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: {
      checked: boolean
    }
    ariaChecked: boolean
  }
  editBeforeSend: {
    accessibilityRole: "switch"
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: {
      checked: boolean
    }
    ariaChecked: boolean
  }
  field: {
    accessibilityLabel: string
  }
}

export type ChatSessionStatusMobileColorToken = "info" | "success" | "warning" | "destructive" | "mutedForeground"
export type ChatSessionStatusMobileColorPalette = Readonly<Record<ChatSessionStatusMobileColorToken, string>>
export type ChatRuntimeDelegationConversationPreviewRole = "user" | "assistant" | "tool"
export type ChatRuntimeDelegationConversationPreviewRoleColorToken = "info" | "foreground" | "warning"
export type ChatRuntimeDelegationConversationPreviewRoleColorPalette = Readonly<
  Record<ChatRuntimeDelegationConversationPreviewRoleColorToken, string>
>

export interface SessionPresentationInput {
  conversationState?: unknown
  isComplete?: boolean
  pendingToolApproval?: unknown
  hasErrors?: boolean
  wasStopped?: boolean
  sessionStatus?: "active" | "completed" | "complete" | "error" | "stopped" | "running" | string
  isSnoozed?: boolean
  isCurrentView?: boolean
  isFocused?: boolean
  isSessionExpanded?: boolean
  hasActiveChildProgress?: boolean
  hasUnreadResponse?: boolean
  hasAnalyzingOrPlanningProgress?: boolean
  hasForegroundActivity?: boolean
  hasRecentFinalResponse?: boolean
  isQueueEnabled?: boolean
  isInitializingSession?: boolean
}

export interface SessionPresentation {
  lifecycleState: SessionLifecycleState
  attentionState: SessionAttentionState
  intent: SessionPresentationIntent
  label: string
  badgeClassName: string
}

export interface FollowUpInputPresentation {
  mode: FollowUpInputMode
  placeholder: string
  isDisabled: boolean
  submitTitle: string
  submitAriaLabel: string
  submitHint: string
  voiceTitle: string
}

export interface SidebarStatusPresentation {
  lifecycleState: SessionLifecycleState
  attentionState: SessionAttentionState
  intent: SidebarStatusIntent
  railClassName: string
  pinnedIconClassName: string
  shouldPulse: boolean
  isForeground: boolean
}

export interface ChatSessionStatusMobileColors {
  backgroundColor: string
  borderColor: string
  textColor: string
}

export interface ChatSessionStatusMobileStyleState {
  chip: {
    backgroundColor: string
    borderColor: string
  }
  text: {
    color: string
  }
}

export type ChatSessionStatusMobileColorSlots = Record<SessionPresentationIntent, ChatSessionStatusMobileColors>
export type ChatSessionStatusMobileStyleSlots = Record<SessionPresentationIntent, ChatSessionStatusMobileStyleState>
type ChatSessionStatusMobileSurfaceState = typeof CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile

export interface ChatSessionStatusMobileChromeStyleSlotsInput {
  surface: ChatSessionStatusMobileSurfaceState
}

export interface ChatSessionStatusMobileChromeStyleSlots {
  chip: {
    flexDirection: ChatSessionStatusMobileSurfaceState["chip"]["flexDirection"]
    alignItems: ChatSessionStatusMobileSurfaceState["chip"]["alignItems"]
    gap: number
    borderWidth: number
    borderRadius: number
    paddingHorizontal: number
    paddingVertical: number
    marginHorizontal: number
  }
  text: {
    fontSize: number
    lineHeight: number
    fontWeight: ChatSessionStatusMobileSurfaceState["chipText"]["fontWeight"]
  }
  spinner: {
    width: number
    height: number
  }
}

export interface ChatSessionStatusMobileStyleRenderStateInput {
  colors: ChatSessionStatusMobileColorPalette
}

export interface ChatSessionStatusMobileStyleRenderState {
  surface: typeof CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile
  colors: ChatSessionStatusMobileColorSlots
  styles: ChatSessionStatusMobileStyleSlots
}

export interface ChatSessionStatusMobileRenderStateInput {
  session?: SessionPresentationInput | null
  colors: ChatSessionStatusMobileColorPalette
}

export interface ChatSessionStatusMobileRenderState {
  shouldRender: boolean
  presentation: SessionPresentation | null
  label: string
  surface: typeof CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile
  colors: ChatSessionStatusMobileColors
  styles: ChatSessionStatusMobileStyleState
  isRunning: boolean
  runningIndicator: {
    shouldRender: boolean
    size: typeof CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.size
    resizeMode: typeof CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.resizeMode
  }
}

export type ChatSessionStatusDesktopIndicatorKind =
  | "needs_input"
  | "blocked"
  | "background"
  | "running"
  | "complete"

export interface ChatSessionStatusDesktopRenderState {
  kind: ChatSessionStatusDesktopIndicatorKind
  iconClassName: string
  loadingSpinnerClassName: string
}

export interface ChatRuntimeDelegationStatusMobileRenderStateInput {
  status: string
  colors: ChatSessionStatusMobileColorPalette
}

export interface ChatRuntimeDelegationStatusMobileRenderState {
  colors: ChatSessionStatusMobileColors
  styles: ChatSessionStatusMobileStyleState
}

export interface ChatRuntimeDelegationConversationPreviewRoleMobileStyleState {
  backgroundColor: string
  borderColor: string
  color: string
}

export type ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots = Record<
  ChatRuntimeDelegationConversationPreviewRole,
  ChatRuntimeDelegationConversationPreviewRoleMobileStyleState
>

export interface ChatRuntimeActivityStepLike {
  type?: string | null
  title?: string | null
  description?: string | null
}

export interface ChatRuntimeRetryInfoLike {
  attempt: number
  maxAttempts?: number
  delaySeconds: number
  reason: string
}

export interface ChatRuntimeStepSummaryLike {
  stepNumber: number
  actionSummary: string
  importance?: "low" | "medium" | "high" | "critical"
  noteCandidates?: string[]
  keyFindings?: string[]
  nextSteps?: string
}

export const CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION = {
  mobile: {
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    edgeActionButton: {
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      horizontalPadding: 16,
    },
    agentSelectorButton: {
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: 44,
    },
    agentSelectorChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColorToken: "primary",
      backgroundAlpha: 0.2,
      maxWidth: 160,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      gap: 3,
    },
    agentSelectorText: {
      fontSize: 11,
      fontWeight: "500",
      colorToken: "primary",
      numberOfLines: 1,
    },
    backIcon: {
      fontSize: 20,
      colorToken: "foreground",
    },
    pinButton: {
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      horizontalPadding: 10,
      verticalPadding: 8,
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "background",
      activeBorderColorToken: "primary",
      activeBackgroundColorToken: "primary",
      activeBackgroundAlpha: 0.09,
      inactiveIconColorToken: "mutedForeground",
      activeIconColorToken: "primary",
    },
    durationChip: {
      maxWidth: 72,
      marginHorizontal: 2,
      numberOfLines: 1,
    },
    killSwitchButton: {
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      size: 28,
      borderRadius: 14,
      backgroundColorToken: "destructive",
      iconColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    handsFreeButton: {
      accessibilityRole: "switch",
      pressedOpacity: 0.78,
      size: 24,
      inactiveIconColorToken: "mutedForeground",
      activeIconColorToken: "primary",
      alignItems: "center",
      justifyContent: "center",
    },
  },
} as const satisfies {
  mobile: {
    actionsRow: {
      flexDirection: string
      alignItems: string
      gap: number
    }
    edgeActionButton: {
      accessibilityRole: string
      pressedOpacity: number
      horizontalPadding: number
    }
    agentSelectorButton: {
      accessibilityRole: string
      pressedOpacity: number
      alignItems: string
      justifyContent: string
      height: string
      minHeight: number
    }
    agentSelectorChip: {
      flexDirection: string
      alignItems: string
      backgroundColorToken: string
      backgroundAlpha: number
      maxWidth: number
      paddingHorizontal: number
      paddingVertical: number
      borderRadius: number
      gap: number
    }
    agentSelectorText: {
      fontSize: number
      fontWeight: string
      colorToken: string
      numberOfLines: number
    }
    backIcon: {
      fontSize: number
      colorToken: string
    }
    pinButton: {
      accessibilityRole: string
      pressedOpacity: number
      horizontalPadding: number
      verticalPadding: number
      borderRadius: string
      borderWidth: number
      borderColorToken: string
      backgroundColorToken: string
      activeBorderColorToken: string
      activeBackgroundColorToken: string
      activeBackgroundAlpha: number
      inactiveIconColorToken: string
      activeIconColorToken: string
    }
    durationChip: {
      maxWidth: number
      marginHorizontal: number
      numberOfLines: number
    }
    killSwitchButton: {
      accessibilityRole: string
      pressedOpacity: number
      size: number
      borderRadius: number
      backgroundColorToken: string
      iconColor: string
      alignItems: string
      justifyContent: string
    }
    handsFreeButton: {
      accessibilityRole: string
      pressedOpacity: number
      size: number
      inactiveIconColorToken: string
      activeIconColorToken: string
      alignItems: string
      justifyContent: string
    }
  }
}

export const CHAT_RUNTIME_SURFACE_PRESENTATION = {
  desktop: {
    visibleUpdatesSummaryClassName: "px-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground/70",
    turnDurationBadge: {
      compactClassName: "shrink-0 inline-flex items-center gap-0.5 whitespace-nowrap tabular-nums",
      fullClassName: "text-xs shrink-0 inline-flex items-center gap-0.5 tabular-nums text-muted-foreground",
      liveClassName: "animate-pulse text-amber-600 dark:text-amber-400",
      compactIconClassName: "h-2.5 w-2.5",
      fullIconClassName: "h-3 w-3",
    },
    conversationHistoryBanner: {
      containerClassName: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground",
      loadButtonClassName: "rounded px-1.5 py-0.5 font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
      pageSize: 120,
    },
    scrollToBottom: {
      buttonClassName: "absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background",
      iconClassName: "h-3 w-3",
      compactButtonClassName: "absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900",
      compactIconClassName: "h-2.5 w-2.5",
    },
    streamingContent: {
      placeholderClassName: "flex items-center gap-2 rounded-md border border-blue-300/70 bg-blue-50/50 px-2.5 py-1.5 text-xs text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/30 dark:text-blue-200",
      placeholderSpinnerClassName: "h-3 w-3 shrink-0 animate-spin text-blue-600 dark:text-blue-400",
      placeholderTextClassName: "min-w-0 truncate",
      containerClassName: "overflow-hidden rounded-lg border border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30",
      headerClassName: "flex items-center gap-2 border-b border-blue-200 bg-blue-100/50 px-3 py-2 dark:border-blue-800 dark:bg-blue-900/30",
      iconClassName: "h-3.5 w-3.5 text-blue-600 dark:text-blue-400",
      titleClassName: "text-xs font-medium text-blue-800 dark:text-blue-200",
      spinnerClassName: "ml-auto h-3 w-3 animate-spin text-blue-600 dark:text-blue-400",
      contentClassName: "px-3 py-2",
      bodyClassName: "text-xs text-blue-900 dark:text-blue-100",
      liveTextClassName: "markdown-selectable whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
      caretClassName: "ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-blue-600 align-text-bottom dark:bg-blue-400",
    },
    killSwitchDialog: {
      overlayClassName: "absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50",
      cardClassName: "bg-background border border-border rounded-lg p-4 max-w-sm mx-4 shadow-lg",
      headerClassName: "flex items-center gap-2 mb-3",
      iconClassName: "h-4 w-4 text-red-500",
      titleClassName: "text-sm font-medium",
      messageClassName: "text-xs text-muted-foreground mb-4",
      actionsClassName: "flex gap-2 justify-end",
    },
    retryStatus: {
      containerClassName: "min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30",
      headerClassName: "flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30",
      iconClassName: "h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400",
      titleClassName: "min-w-0 flex-1 text-xs font-medium text-amber-800 dark:text-amber-200",
      spinnerClassName: "ml-auto h-3 w-3 shrink-0 animate-spin text-amber-600 dark:text-amber-400",
      contentClassName: "min-w-0 px-3 py-2",
      metaRowClassName: "flex flex-wrap items-center gap-2",
      attemptClassName: "shrink-0 text-xs text-amber-700 dark:text-amber-300",
      countdownClassName: "max-w-full min-w-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
      descriptionClassName: "mt-1.5 text-xs text-amber-600 break-words dark:text-amber-400",
    },
    delegationConversationMessage: {
      containerBaseClassName: "rounded-md border text-xs transition-all",
      roleClassNames: {
        user: "border-blue-200/80 bg-blue-50/70 dark:border-blue-800/60 dark:bg-blue-950/30",
        assistant: "border-purple-200/80 bg-purple-50/70 dark:border-purple-800/60 dark:bg-purple-950/30",
        tool: "border-amber-200/80 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30",
        default: "border-gray-200/80 bg-gray-50/70 dark:border-gray-700/60 dark:bg-gray-900/30",
      },
      rowClassName: "flex items-start gap-1.5 px-2 py-1.5",
      iconShellBaseClassName: "mt-0.5 rounded-full p-1 bg-white/70 dark:bg-black/20",
      iconClassNames: {
        user: "text-blue-600 dark:text-blue-300",
        assistant: "text-purple-600 dark:text-purple-300",
        tool: "text-amber-600 dark:text-amber-300",
        default: "text-gray-500 dark:text-gray-300",
      },
      iconClassName: "h-3 w-3",
      bodyClassName: "min-w-0 flex-1",
      headerBaseClassName: "mb-0.5 flex gap-1.5",
      headerCompactClassName: "flex-col items-start",
      headerDefaultClassName: "flex-wrap items-center",
      badgeBaseClassName: "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
      badgeRoleClassNames: {
        user: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
        assistant: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200",
        tool: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
        default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
      },
      timestampClassName: "text-[10px] text-gray-500 dark:text-gray-400",
      contentBaseClassName: "whitespace-pre-wrap break-words text-[11px] leading-[1.2rem] text-gray-700 dark:text-gray-200",
      contentClampCompactClassName: "line-clamp-3",
      contentClampDefaultClassName: "line-clamp-4",
      toolStackClassName: "space-y-1.5",
      toolInputBlockClassName: "space-y-1 rounded-md border border-amber-200/70 bg-white/60 p-1.5 dark:border-amber-800/60 dark:bg-black/20",
      toolInputLabelClassName: "text-[10px] font-semibold uppercase tracking-wide text-amber-700/90 dark:text-amber-300/90",
      toolInputCodeClassName: "max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-amber-50/80 p-1.5 text-[10px] text-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
      rawPayloadBlockClassName: "space-y-1 rounded-md border border-border/60 bg-muted/30 p-1.5",
      rawPayloadLabelClassName: "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
      rawPayloadCodeClassName: "max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-1.5 text-[10px] text-foreground/90",
      toggleButtonClassName: "mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100",
      toggleIconClassName: "h-3 w-3",
      actionColumnClassName: "flex flex-col items-center gap-1 flex-shrink-0",
      copyButtonClassName: "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
      copiedIconClassName: "h-3.5 w-3.5 text-green-500",
      copyIconClassName: "h-3.5 w-3.5 opacity-60 hover:opacity-100",
    },
    delegationBubble: {
      compactSubtitleMaxLength: 72,
      defaultSubtitleMaxLength: 120,
      containerBaseClassName: "rounded-lg border overflow-hidden",
      headerBaseClassName: "flex min-w-0 items-center gap-1.5 px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity",
      headerExpandedClassName: "border-b",
      agentNameClassName: "shrink-0 truncate text-[11px] font-medium",
      statusIconClassName: "h-2.5 w-2.5 shrink-0",
      statusSpinnerClassName: "h-2.5 w-2.5 shrink-0 animate-spin",
      statusMetaClassName: "shrink-0 text-[10px]",
      subtitleClassName: "min-w-0 flex-1 truncate text-[10px] text-gray-600 dark:text-gray-400",
      messageCountClassName: "shrink-0 text-[10px] text-gray-500 dark:text-gray-400",
      toggleIconClassName: "h-3 w-3 shrink-0 text-gray-400",
      contentClassName: "px-2 py-2 space-y-2",
      footerClassName: "flex items-center justify-between gap-1.5 border-t border-black/5 pt-1.5 dark:border-white/10",
      footerCompactClassName: "flex-col items-stretch",
      footerMetaClassName: "text-[10px] truncate",
      footerActionsClassName: "flex items-center gap-1.5",
      footerActionsCompactClassName: "w-full flex-col items-stretch",
      transcriptButtonClassName: "inline-flex h-7 items-center justify-center rounded-md border border-purple-200/80 px-2 text-[10px] font-medium text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-800/70 dark:text-purple-300 dark:hover:bg-purple-950/30",
      detailsButtonClassName: "inline-flex h-7 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-foreground transition-colors hover:bg-muted",
      statusClassNames: {
        active: {
          containerClassName: "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30",
          headerClassName: "bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
          textClassName: "text-blue-800 dark:text-blue-200",
          mutedTextClassName: "text-blue-600 dark:text-blue-400",
          iconClassName: "text-blue-600 dark:text-blue-400",
        },
        completed: {
          containerClassName: "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30",
          headerClassName: "bg-green-100/50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
          textClassName: "text-green-800 dark:text-green-200",
          mutedTextClassName: "text-green-600 dark:text-green-400",
          iconClassName: "text-green-600 dark:text-green-400",
        },
        failed: {
          containerClassName: "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/30",
          headerClassName: "bg-red-100/50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
          textClassName: "text-red-800 dark:text-red-200",
          mutedTextClassName: "text-red-600 dark:text-red-400",
          iconClassName: "text-red-600 dark:text-red-400",
        },
        cancelled: {
          containerClassName: "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30",
          headerClassName: "bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
          textClassName: "text-amber-800 dark:text-amber-200",
          mutedTextClassName: "text-amber-600 dark:text-amber-400",
          iconClassName: "text-amber-600 dark:text-amber-400",
        },
      },
    },
    delegationConversationPanel: {
      recentMessagesLimit: 3,
      compactPreviewMaxLength: 72,
      defaultPreviewMaxLength: 120,
      compactScrollMaxHeight: "min(32vh, 220px)",
      defaultScrollMaxHeight: "min(36vh, 280px)",
      containerClassName: "border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden",
      headerBaseClassName: "flex flex-wrap items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 transition-colors",
      headerStaticClassName: "cursor-default",
      headerInteractiveClassName: "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
      headerTitleRowClassName: "min-w-0 flex flex-1 items-center gap-1.5",
      headerTitleClassName: "min-w-0 flex-1 truncate text-[10px] font-medium text-gray-600 dark:text-gray-400",
      countBadgeClassName: "h-4 shrink-0 px-1 py-0 text-[9px]",
      actionRowClassName: "ml-auto flex flex-shrink-0 items-center gap-0.5",
      copyButtonClassName: "inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
      copyIconClassName: "h-2.5 w-2.5 opacity-60 hover:opacity-100",
      toggleIconClassName: "h-3 w-3 text-gray-400",
      contentContainerClassName: "relative bg-white/50 dark:bg-black/20",
      showEarlierButtonClassName: "w-full px-2 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center border-b border-gray-100 dark:border-gray-800",
      scrollContainerClassName: "overflow-y-auto p-1 space-y-1",
    },
  },
  mobile: {
    viewport: {
      flex: 1,
      backgroundColorToken: "background",
      paddingHorizontal: "sm",
      paddingVertical: "xs",
      contentGap: "xs",
      keyboardAvoidingBehaviorByPlatform: {
        ios: "padding",
        default: "height",
      },
      keyboardShouldPersistTaps: "handled",
      contentInsetAdjustmentBehavior: "automatic",
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
      accessibilityRole: "progressbar",
      accessibilityState: {
        busy: true,
      },
      spinnerSize: 32,
      spinnerResizeMode: "contain",
    },
    inlineActivity: {
      flexDirection: "row",
      alignItems: "center",
      accessibilityRole: "progressbar",
      accessibilityState: {
        busy: true,
      },
      spinnerSize: 14,
      spinnerResizeMode: "contain",
    },
    streamingContent: {
      headerFlexDirection: "row",
      headerAlignItems: "center",
      headerGap: "xs",
      headerMarginBottom: "xs",
      accessibilityRole: "text",
      mobileIcon: {
        name: "pulse-outline",
        size: 13,
      },
      titleMinWidth: 0,
      titleFlexShrink: 1,
      titleNumberOfLines: 1,
      titleFontSize: 11,
      titleFontWeight: "700",
      titleColorToken: "info",
      spinnerSize: 12,
      spinnerResizeMode: "contain",
      badgeMarginLeft: "auto",
      badgePaddingHorizontal: "xs",
      badgePaddingVertical: 2,
      badgeBorderRadius: "sm",
      badgeBackgroundAlpha: 0.12,
      badgeTextFontSize: 10,
      badgeTextFontWeight: "700",
      bodyRowFlexDirection: "row",
      bodyRowAlignItems: "flex-end",
      bodyRowMinWidth: 0,
      textFlex: 1,
      textMinWidth: 0,
      textColorToken: "foreground",
      textFontSize: 14,
      textLineHeight: 20,
      caretWidth: 2,
      caretHeight: 14,
      caretMarginLeft: 2,
      caretBorderRadius: 1,
    },
    messageHistoryBanner: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "xs",
      paddingVertical: "xs",
      textAlign: "center",
      summaryFontSize: 12,
      summaryLineHeight: 16,
      textColorToken: "mutedForeground",
      loadButton: {
        accessibilityRole: "button",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "xs",
        paddingHorizontal: "sm",
        paddingVertical: 3,
        borderRadius: "sm",
        borderWidth: 1,
        borderColorToken: "border",
        backgroundColorToken: "muted",
        backgroundAlpha: 0.35,
        fontSize: 11,
        fontWeight: "700",
        colorToken: "foreground",
        pressedOpacity: 0.8,
      },
    },
    messageHistoryWindow: {
      initialVisibleCount: 80,
      loadIncrement: 60,
      topLoadThresholdPx: 120,
      bottomResumeThresholdPx: 50,
      dragEndDebounceMs: 150,
      scrollEventThrottleMs: 16,
    },
    connectionBanner: {
      paddingHorizontal: "md",
      paddingVertical: "sm",
      marginHorizontal: "md",
      marginBottom: "sm",
      borderRadius: "md",
      borderWidth: 1,
      iconFontSize: 16,
      iconMarginRight: "sm",
      contentFlexDirection: "row",
      contentAlignItems: "center",
      textContainerFlex: 1,
      titleFontSize: 13,
      titleFontWeight: "500",
      titleColorToken: "foreground",
      subtitleFontSize: 11,
      subtitleMarginTop: 2,
      subtitleColorToken: "mutedForeground",
      subtitleNumberOfLines: 1,
      accessibilityRole: "alert",
      reconnecting: {
        backgroundColorToken: "info",
        backgroundAlpha: 0.1,
        borderColorToken: "info",
        borderAlpha: 0.3,
        spinnerColorToken: "warning",
        spinnerSize: "small",
      },
      failed: {
        backgroundColorToken: "destructive",
        backgroundAlpha: 0.1,
        borderColorToken: "destructive",
        borderAlpha: 0.3,
      },
      retryButton: {
        backgroundColorToken: "primary",
        foregroundColorToken: "primaryForeground",
        paddingHorizontal: "md",
        paddingVertical: "sm",
        borderRadius: "md",
        marginLeft: "sm",
        fontSize: 13,
        fontWeight: "600",
        accessibilityRole: "button",
        pressedOpacity: 0.7,
      },
    },
    retryStatus: {
      gap: "xs",
      padding: "sm",
      borderRadius: "sm",
      borderWidth: 1,
      borderColorToken: "warning",
      borderAlpha: 0.35,
      backgroundColorToken: "warning",
      backgroundAlpha: 0.1,
      accessibilityRole: "text",
      headerFlexDirection: "row",
      headerAlignItems: "center",
      headerGap: "xs",
      iconFontSize: 14,
      spinner: {
        size: "small",
        colorToken: "warning",
      },
      titleFlex: 1,
      titleMinWidth: 0,
      titleNumberOfLines: 2,
      titleFontSize: 13,
      titleFontWeight: "700",
      titleColorToken: "warning",
      metaFlexDirection: "row",
      metaFlexWrap: "wrap",
      metaAlignItems: "center",
      metaGap: "xs",
      metaMarginTop: 2,
      attemptFontSize: 11,
      attemptColorToken: "mutedForeground",
      countdownFontSize: 11,
      countdownFontWeight: "700",
      countdownPaddingHorizontal: "xs",
      countdownPaddingVertical: 3,
      countdownBorderRadius: "sm",
      countdownBackgroundAlpha: 0.14,
      countdownOverflow: "hidden",
      descriptionFontSize: 11,
      descriptionLineHeight: 15,
      descriptionMarginTop: 2,
      descriptionColorToken: "mutedForeground",
    },
    stepSummary: {
      gap: "xs",
      padding: "sm",
      borderRadius: "sm",
      borderWidth: 1,
      borderColorToken: "info",
      borderAlpha: 0.3,
      backgroundColorToken: "info",
      backgroundAlpha: 0.08,
      accessibilityRole: "text",
      headerFlexDirection: "row",
      headerAlignItems: "center",
      headerGap: "xs",
      headerMinWidth: 0,
      titleFlexShrink: 1,
      titleMinWidth: 0,
      titleNumberOfLines: 1,
      titleFontSize: 11,
      titleFontWeight: "700",
      titleColorToken: "info",
      metaNumberOfLines: 1,
      metaFontSize: 11,
      metaLineHeight: 15,
      metaColorToken: "mutedForeground",
      actionNumberOfLines: 2,
      actionFontSize: 13,
      actionLineHeight: 18,
      actionFontWeight: "600",
      actionColorToken: "foreground",
      previewNumberOfLines: 2,
      previewFontSize: 12,
      previewLineHeight: 17,
      previewColorToken: "mutedForeground",
      previewMarginTop: 2,
      badgePaddingHorizontal: "xs",
      badgePaddingVertical: 2,
      badgeBorderRadius: "sm",
      badgeBackgroundAlpha: 0.12,
      badgeMarginLeft: "auto",
      badgeMaxWidth: "56%",
      badgeNumberOfLines: 1,
      badgeTextFontSize: 10,
      badgeTextFontWeight: "700",
    },
    delegationCard: {
      gap: "xs",
      padding: "sm",
      borderRadius: "sm",
      borderWidth: 1,
      borderColorToken: "info",
      borderAlpha: 0.28,
      backgroundColorToken: "info",
      backgroundAlpha: 0.07,
      accessibilityRole: "text",
      headerFlexDirection: "row",
      headerAlignItems: "center",
      headerGap: "xs",
      headerMinWidth: 0,
      titleFlex: 1,
      titleMinWidth: 0,
      titleNumberOfLines: 1,
      titleFontSize: 13,
      titleFontWeight: "700",
      titleColorToken: "foreground",
      subtitleNumberOfLines: 2,
      subtitleFontSize: 12,
      subtitleLineHeight: 17,
      subtitleColorToken: "mutedForeground",
      metaNumberOfLines: 1,
      metaGap: "xs",
      metaFontSize: 10,
      metaLineHeight: 14,
      metaColorToken: "mutedForeground",
      liveColorToken: "info",
      statusFlexShrink: 0,
      statusPaddingHorizontal: "xs",
      statusPaddingVertical: 2,
      statusBorderRadius: "sm",
      statusBorderWidth: 1,
      statusNumberOfLines: 1,
      statusFontSize: 10,
      statusFontWeight: "700",
      metaFlexDirection: "row",
      metaFlexWrap: "wrap",
      metaAlignItems: "center",
      subtitleMaxLength: 110,
      toolPreviewMaxRows: 3,
      toolPreviewMarginTop: 2,
      toolPreviewGap: 4,
      toolPreviewPaddingHorizontal: "xs",
      toolPreviewPaddingVertical: 5,
      toolPreviewBorderRadius: "sm",
      toolPreviewBorderWidth: 1,
      toolPreviewBorderAlpha: 0.16,
      toolPreviewBackgroundAlpha: 0.05,
      toolPreviewLabelNumberOfLines: 1,
      toolPreviewLabelColorToken: "mutedForeground",
      toolPreviewLabelFontSize: 10,
      toolPreviewLabelFontWeight: "700",
      toolPreviewLineFlexDirection: "row",
      toolPreviewLineAlignItems: "center",
      toolPreviewLineGap: "xs",
      toolPreviewLineMinWidth: 0,
      toolPreviewStatusMinWidth: 36,
      toolPreviewStatusAlignItems: "center",
      toolPreviewStatusJustifyContent: "center",
      toolPreviewStatusFlexShrink: 0,
      toolPreviewStatusFontSize: 10,
      toolPreviewNameFlex: 1,
      toolPreviewNameMinWidth: 0,
      toolPreviewNameNumberOfLines: 1,
      toolPreviewNameEllipsizeMode: "tail",
      toolPreviewNameColorToken: "mutedForeground",
      toolPreviewNameFontSize: 11,
      toolPreviewMoreNumberOfLines: 1,
      toolPreviewMoreFontSize: 10,
      toolPreviewMoreFontWeight: "700",
      toolPreviewMoreColorToken: "mutedForeground",
      toolPreviewMoreButtonAlignSelf: "flex-start",
      toolPreviewMoreButtonPressedOpacity: 0.78,
      toolPreviewMoreButtonAccessibilityRole: "button",
      conversationPreviewMaxRows: 2,
      conversationPreviewMaxLength: 96,
      conversationPreviewMarginTop: 2,
      conversationPreviewGap: 4,
      conversationPreviewPaddingHorizontal: "xs",
      conversationPreviewPaddingVertical: 5,
      conversationPreviewBorderRadius: "sm",
      conversationPreviewBorderWidth: 1,
      conversationPreviewBorderAlpha: 0.18,
      conversationPreviewBackgroundAlpha: 0.06,
      conversationPreviewLineFlexDirection: "row",
      conversationPreviewLineAlignItems: "center",
      conversationPreviewLineGap: "xs",
      conversationPreviewLineMinWidth: 0,
      conversationPreviewRoleMinWidth: 46,
      conversationPreviewRoleMaxWidth: 82,
      conversationPreviewRoleNumberOfLines: 1,
      conversationPreviewRoleEllipsizeMode: "tail",
      conversationPreviewRoleFontSize: 10,
      conversationPreviewRoleFontWeight: "700",
      conversationPreviewRolePaddingHorizontal: "xs",
      conversationPreviewRolePaddingVertical: 2,
      conversationPreviewRoleBorderRadius: "sm",
      conversationPreviewRoleBorderWidth: 1,
      conversationPreviewRoleOverflow: "hidden",
      conversationPreviewRoleBackgroundAlpha: 0.1,
      conversationPreviewRoleBorderAlpha: 0.26,
      conversationPreviewRoleColorTokens: {
        user: "info",
        assistant: "foreground",
        tool: "warning",
      },
      conversationPreviewContentFlex: 1,
      conversationPreviewContentMinWidth: 0,
      conversationPreviewContentNumberOfLines: 1,
      conversationPreviewContentEllipsizeMode: "tail",
      conversationPreviewContentFontSize: 11,
      conversationPreviewContentLineHeight: 15,
      conversationPreviewContentColorToken: "mutedForeground",
      conversationPreviewTimestampFlexShrink: 0,
      conversationPreviewTimestampNumberOfLines: 1,
      conversationPreviewTimestampFontSize: 10,
      conversationPreviewTimestampColorToken: "mutedForeground",
      conversationPreviewMoreNumberOfLines: 1,
      conversationPreviewMoreFontSize: 10,
      conversationPreviewMoreFontWeight: "700",
      conversationPreviewMoreColorToken: "mutedForeground",
      conversationPreviewMoreButtonAlignSelf: "flex-start",
      conversationPreviewMoreButtonPressedOpacity: 0.78,
      conversationPreviewMoreButtonAccessibilityRole: "button",
      statuses: {
        active: {
          colorToken: "info",
          backgroundAlpha: 0.12,
          borderAlpha: 0.35,
        },
        completed: {
          colorToken: "success",
          backgroundAlpha: 0.12,
          borderAlpha: 0.35,
        },
        failed: {
          colorToken: "destructive",
          backgroundAlpha: 0.12,
          borderAlpha: 0.35,
        },
        default: {
          colorToken: "warning",
          backgroundAlpha: 0.12,
          borderAlpha: 0.35,
        },
      },
    },
    scrollToBottom: {
      accessibilityRole: "button",
      position: "absolute",
      bottomOffset: 80,
      right: "lg",
      size: 44,
      borderRadius: 22,
      backgroundColorToken: "primary",
      foregroundColorToken: "primaryForeground",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      pressedOpacity: 0.8,
    },
  },
} as const

export const CHAT_COMPOSER_PRESENTATION = {
  field: {
    accessibilityLabel: "Message composer",
  },
  voiceOverlay: {
    listeningLabel: "Listening...",
    releaseToEditLabel: "Release to edit",
    releaseToSendLabel: "Release to send",
  },
  sttPreview: {
    label: "STT preview",
  },
  imageAttachment: {
    accessibilityLabel: "Attach images",
    accessibilityHint: "Select one or more images to include with your next message.",
    glyph: "🖼️",
    mobileIcon: {
      name: "images-outline",
      size: 18,
    },
  },
  textToSpeech: {
    label: "Text-to-Speech",
    accessibilityHint: "Toggles spoken playback for assistant responses.",
    enabledGlyph: "🔊",
    disabledGlyph: "🔇",
    mobileIcon: {
      enabledName: "volume-high-outline",
      disabledName: "volume-mute-outline",
      size: 18,
    },
  },
  editBeforeSend: {
    accessibilityLabel: "Edit before send",
    accessibilityHint:
      "When enabled, releasing the mic inserts the transcript into the input so you can edit before sending.",
    glyph: "✏️",
    mobileIcon: {
      name: "create-outline",
      size: 18,
    },
  },
  queue: {
    accessibilityLabel: "Queue message",
    accessibilityHint:
      "Adds your typed text and attached images to the queued-messages list without sending immediately.",
    label: "Queue",
    debugMessage: "Message queued. Use Send Next when you are ready.",
    mobileIcon: {
      name: "time-outline",
      size: 14,
    },
  },
  submit: {
    handsFreeAccessibilityLabel: "Send message",
    handsFreeAccessibilityHint: "Sends your typed text and any attached images to the selected agent.",
    sendLabel: "Send",
    mobileIcon: {
      name: "send-outline",
      size: 14,
    },
  },
  mic: {
    activeGlyph: "🎙️",
    inactiveGlyph: "🎤",
    mobileIcon: {
      activeName: "mic",
      inactiveName: "mic-outline",
      size: 20,
    },
  },
} as const

export const CHAT_COMPOSER_SURFACE_PRESENTATION = {
  desktop: {
    followUp: {
      overlayFormClassName: "flex flex-col gap-1.5 border-t bg-muted/30 px-3 py-2 backdrop-blur-sm",
      tileFormClassName: "flex flex-col gap-1.5 border-t bg-muted/20 px-2 py-1.5",
      agentIndicatorClassName: "flex min-w-0 items-center gap-1 text-[10px] text-primary/70",
      agentIconClassName: "h-2.5 w-2.5 shrink-0",
      agentNameClassName: "min-w-0 truncate",
      overlayInputRowClassName: "flex w-full flex-wrap items-center gap-2",
      tileInputRowClassName: "flex w-full items-end gap-2",
      overlayInputWrapperClassName: "relative min-w-0 flex-[1_1_10rem]",
      tileInputWrapperClassName: "relative flex-1",
      textInputClassName: "w-full text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 focus:ring-0",
      textareaClassName: "w-full text-sm bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground/60 focus:ring-0",
      slashMenuClassName: "bottom-full left-0 mb-1",
      hiddenFileInputClassName: "hidden",
      overlayActionsClassName: "ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-2",
      buttonClassName: "flex-shrink-0",
      voiceButtonClassName:
        "flex-shrink-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400",
      killSwitchButtonClassName:
        "flex-shrink-0 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30",
      iconClassName: "h-3.5 w-3.5",
    },
  },
  mobile: {
    inputArea: {
      bottomInsetOffset: 12,
      micWrapperPaddingHorizontal: "sm",
      micWrapperPaddingBottom: "sm",
      borderTopWidthToken: "hairline",
      borderColorToken: "border",
      backgroundColorToken: "card",
    },
    sttPreview: {
      marginHorizontal: "sm",
      marginTop: "xs",
      borderWidth: 1,
      borderRadius: "md",
      paddingHorizontal: "sm",
      paddingVertical: "xs",
      borderColorToken: "border",
      backgroundColorToken: "background",
      labelColorToken: "mutedForeground",
      textColorToken: "foreground",
      labelMarginBottom: 2,
      labelFontSize: 12,
      labelLineHeight: 16,
      labelFontWeight: "600",
      textFontSize: 16,
      textLineHeight: 24,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: "xs",
      paddingHorizontal: "sm",
      paddingVertical: "xs",
    },
    input: {
      flex: 1,
      maxHeight: 120,
      borderWidth: 1,
      borderColorToken: "input",
      borderRadius: "lg",
      paddingHorizontal: "md",
      paddingVerticalByPlatform: {
        ios: 10,
        android: 8,
        default: 10,
      },
      backgroundColorToken: "background",
      textColorToken: "foreground",
      placeholderColorToken: "mutedForeground",
      fontSize: 16,
    },
    visuallyHiddenComposerHint: {
      position: "absolute",
      left: -10000,
      width: 1,
      height: 1,
    },
    webAccessibility: {
      inputDescriptionNativeId: "chat-composer-hint",
      voiceStatusLiveRegionNativeId: "chat-voice-status-live-region",
      voiceStatusLiveRegionPoliteness: "polite",
    },
    accessoryButton: {
      size: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "muted",
      activeBorderColorToken: "primary",
      activeBackgroundColorToken: "card",
      inactiveIconColorToken: "mutedForeground",
      activeIconColorToken: "primary",
      pressedOpacity: 0.7,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButton: {
      minHeight: 44,
      minWidth: 64,
      paddingHorizontal: "md",
      paddingVertical: "sm",
      borderRadius: "md",
      backgroundColorToken: "primary",
      foregroundColorToken: "primaryForeground",
      disabledOpacity: 0.5,
      pressedOpacity: 0.7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      fontWeight: "600",
      fontSize: 13,
    },
    queueButton: {
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "background",
      iconColorToken: "primary",
      textColorToken: "foreground",
      pressedOpacity: 0.7,
    },
    micButton: {
      width: "100%",
      height: 56,
      borderRadius: "lg",
      borderWidth: 1.5,
      borderColorToken: "border",
      backgroundColorToken: "card",
      activeBorderColorToken: "primary",
      activeBackgroundColorToken: "primary",
      inactiveForegroundColorToken: "mutedForeground",
      activeForegroundColorToken: "primaryForeground",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "sm",
      labelFontSize: 15,
      labelFontWeight: "600",
      webPressStyle: {
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "manipulation",
      },
    },
    voiceOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottomOffset: 72,
      zIndex: 1000,
      elevation: 10,
      alignItems: "center",
      paddingHorizontal: "md",
      paddingBottom: "sm",
      cardMaxWidth: "88%",
      cardBorderRadius: "xl",
      cardBackgroundColorToken: "foreground",
      cardBackgroundAlpha: 0.72,
      textColorToken: "background",
      textAlign: "center",
      cardPaddingHorizontal: 12,
      cardPaddingVertical: 8,
      textFontSize: 12,
      textLineHeight: 16,
      transcriptNumberOfLines: 3,
      transcriptMarginTop: 4,
      transcriptFontSize: 12,
      transcriptLineHeight: 16,
      transcriptOpacity: 0.92,
    },
  },
} as const

export const CHAT_RUNTIME_PRESENTATION = {
  common: {
    cancel: "Cancel",
    errorTitle: "Error",
    successTitle: "Success",
    retryFallback: "Please try again.",
  },
  debug: {
    noSessionAvailable: "No session available",
    requestSent: "Request sent, waiting for response...",
    completed: "Completed!",
    processingQueuedMessage: "Processing queued message...",
    sessionChangedDuringProcessing: "Session changed during processing",
    requestSuperseded: "Request superseded",
    unknownError: "Unknown error",
  },
  header: {
    defaultAgentLabel: "Default Agent",
    agentSelectorDropdownGlyph: "▼",
    agentSelectorMobileIcon: {
      name: "chevron-down",
      size: 13,
    },
    agentSelectorAccessibilityHint: "Opens agent selection menu",
    backGlyph: "←",
    backMobileIcon: {
      name: "chevron-back",
      size: 22,
    },
    backToHistoryAccessibilityLabel: "Back to chat history",
    backToHistoryAccessibilityHint: "Returns to the chat history list",
    handsFreeLabel: "Hands-free voice mode",
    handsFreeAccessibilityHint: "When enabled, speech is sent automatically after each phrase",
    handsFreeGlyph: "🎙️",
    handsFreeMobileIcon: {
      enabledName: "mic",
      disabledName: "mic-off-outline",
      size: 18,
    },
    renameConversationTitleLabel: "Rename conversation title",
    expandPanelTitle: "Expand panel",
    collapsePanelTitle: "Collapse panel",
  },
  modelControls: {
    model: {
      updatedToast: "Agent model updated",
      updateFailedToast: "Failed to update model",
      updateFailedLogPrefix: "Failed to update agent model",
      changeAccessibilityLabel: "Change agent model",
      loadingLabel: "Loading models...",
      emptyLabel: "No models available",
    },
    thinking: {
      updatedToast: "Thinking level updated",
      updateFailedToast: "Failed to update thinking level",
      updateFailedLogPrefix: "Failed to update thinking level",
      changeAccessibilityLabel: "Change thinking level",
      titlePrefix: "Thinking level",
    },
    verbosity: {
      updatedToast: "Verbosity updated",
      updateFailedToast: "Failed to update verbosity",
      updateFailedLogPrefix: "Failed to update verbosity",
      changeAccessibilityLabel: "Change verbosity",
      titlePrefix: "Verbosity",
    },
  },
  killSwitch: {
    title: "Emergency Stop",
    message:
      "Are you sure you want to stop all agent sessions on the remote server? This will immediately terminate any running tasks.",
    actionLabel: "Stop All",
    buttonGlyph: "⏹",
    mobileIcon: {
      name: "stop-circle-outline",
      size: 18,
    },
    buttonAccessibilityLabel: "Emergency stop - kill all agent sessions",
    buttonAccessibilityHint: "Shows a confirmation before stopping all running sessions",
    successFallback: "All sessions stopped",
    stopFailed: "Failed to stop sessions",
    connectionFailed: "Failed to connect to server",
    sessionTitle: "Stop Agent Execution",
    sessionMessage: "Are you sure you want to stop this session?",
    sessionMessageWithOtherSessions: "Are you sure you want to stop this session? Other sessions will continue running.",
    sessionActionLabel: "Stop Agent",
    sessionPendingActionLabel: "Stopping...",
    sessionButtonTitle: "Stop agent",
    sessionExecutionButtonTitle: "Stop agent execution",
    dismissButtonTitle: "Dismiss",
    closeButtonTitle: "Close",
  },
  branch: {
    buttonGlyph: "↳",
    pendingGlyph: "…",
    buttonLabel: "Branch",
    pendingLabel: "Branching...",
    buttonTitle: "Branch from here",
    buttonAccessibilityLabel: "Branch conversation from this message",
    mobileIcon: {
      name: "git-branch-outline",
      size: 13,
      pendingSize: 12,
    },
    unavailableTitle: "Branch Unavailable",
    unavailableMessage: "This chat is not linked to a desktop conversation yet.",
    createdTitle: "Branch Created",
    createdMessage: "The branched chat will appear in the chat list after sync.",
    successToast: "Conversation branched",
    failedTitle: "Branch Failed",
    failedMessage: "Failed to branch conversation",
  },
  turnDuration: {
    glyph: "◷",
    mobileIcon: {
      name: "time-outline",
      size: 11,
    },
    messageTitle: "Agent turn duration",
    liveMessageTitle: "Agent turn in progress",
    totalTitle: "Total agent time",
    liveTotalTitle: "Total agent time (running)",
  },
  pin: {
    pinLabel: "Pin",
    pinnedLabel: "Pinned",
    pinChatLabel: "Pin chat",
    unpinChatLabel: "Unpin chat",
    pinChatHint: "Keeps this chat at the top of the chats list.",
    unpinChatHint: "Removes this chat from the pinned chats list.",
    mobileIcon: {
      pinnedName: "pin",
      unpinnedName: "pin-outline",
      size: 16,
    },
  },
  approval: {
    connectionRequiredTitle: "Connection Required",
    connectionRequiredMessage:
      "Configure your desktop server connection before responding to tool approvals.",
    unavailableTitle: "Approval Unavailable",
    unavailableMessage: "The approval request is no longer pending.",
    failedTitle: "Approval Failed",
    title: "Tool Approval Required",
    processingTitle: "Processing...",
    toolLabel: "Tool",
    approveLabel: "Approve",
    denyLabel: "Deny",
    processingLabel: "Processing...",
    viewArgumentsLabel: "View full arguments",
    hideArgumentsLabel: "Hide full arguments",
    viewArgumentsGlyph: "▶",
    hideArgumentsGlyph: "▼",
    hotkeysLabel: "Hotkeys",
    approveHotkeyTitle: "Press Space to approve",
    denyHotkeyTitle: "Press Shift+Space to deny",
    approveHotkeyLabel: "Approve",
    denyHotkeyLabel: "Deny",
    responseFailedMessage: "Failed to respond to the tool approval request.",
    approveFailedPrefix: "Failed to approve tool call.",
    denyFailedPrefix: "Failed to deny tool call.",
  },
  connectionError: {
    partialContentMessage: "Connection lost. Partial response shown above.",
    retryTip: 'Tip: Check your internet connection and tap "Retry" to try again.',
  },
  connectionBanner: {
    reconnectingGlyph: "🔄",
    failedGlyph: "⚠️",
    mobileIcon: {
      reconnectingName: "sync-outline",
      failedName: "warning-outline",
      size: 16,
    },
    failedTitle: "Message failed to send",
    failedSubtitle: "Tap retry to try again",
    retryLabel: "Retry",
  },
  retryStatus: {
    glyph: "↻",
    mobileIcon: {
      name: "time-outline",
      size: 14,
    },
    attemptLabel: "Attempt",
    retryingInPrefix: "Retrying in",
    retryingInSuffix: "s",
    autoRetryDescription: "The agent will automatically retry when the API is available.",
  },
  scrollToBottom: {
    glyph: "↓",
    mobileIcon: {
      name: "arrow-down",
      size: 20,
    },
    latestLabel: "Latest",
    accessibilityLabel: "Scroll to bottom",
    accessibilityHint: "Scrolls to the latest messages",
  },
  streamingContent: {
    generatingTitle: "Generating response...",
    responseTitle: "Response",
    streamingBadgeLabel: "Streaming",
  },
  stepSummary: {
    latestTitle: "Latest activity",
    summaryTitle: "Summary",
    stepLabel: "Step",
    importanceSuffix: "importance",
    keyFindingSingular: "key finding",
    keyFindingPlural: "key findings",
  },
  delegation: {
    title: "Delegation",
    summaryTitle: "Delegations",
    detailActionLabel: "Details",
    toolActivityLabel: "Tool activity",
    moreToolActivityLabel: "more",
    liveLabel: "live",
    activityLabel: "Activity",
    copyConversationLabel: "Copy conversation",
    taskRoleLabel: "Task",
    updateRoleLabel: "Update",
    resultRoleLabel: "Result",
    errorRoleLabel: "Error",
    toolRoleFallbackLabel: "Tool",
    messageRoleFallbackLabel: "Message",
    toolInputLabel: "Tool Input",
    rawPayloadLabel: "Raw Payload",
    messageSingularLabel: "message",
    messagePluralLabel: "messages",
    expandSummaryLabel: "Expand delegations",
    collapseSummaryLabel: "Collapse delegations",
    messageCountSuffix: "m",
  },
  messageHistory: {
    scrollUpHint: "Scroll up to load older messages.",
    loadingEarlierLabel: "Loading...",
    mobileIcon: {
      loadEarlierName: "chevron-up",
      size: 13,
    },
  },
  activity: {
    thinkingLabel: "Agent is thinking...",
    thinkingAccessibilityLabel: "Agent is thinking",
    runningToolLabel: "Running tool...",
    executingToolsLabel: "Executing tools...",
    loadingMessagesAccessibilityLabel: "Loading messages from desktop",
    loadingAgentActivityAccessibilityLabel: "Loading agent activity",
  },
} as const

export const CHAT_SESSION_STATUS_SURFACE_PRESENTATION = {
  desktop: {
    iconClassNames: {
      needsInput: "h-3.5 w-3.5 text-amber-500 animate-pulse",
      blocked: "h-3.5 w-3.5 text-red-500",
      background: "h-3.5 w-3.5 text-muted-foreground",
      complete: "h-3.5 w-3.5 text-green-500",
    },
    loadingSpinnerClassName: "[&>div]:gap-0 [&_img]:h-3.5 [&_img]:w-3.5",
  },
  mobile: {
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginHorizontal: 4,
    },
    chipText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700",
    },
    runningIndicator: {
      size: 14,
      resizeMode: "contain",
    },
    intents: {
      active: {
        colorToken: "info",
        backgroundAlpha: 0.12,
        borderAlpha: 0.35,
      },
      background: {
        colorToken: "mutedForeground",
        backgroundAlpha: 0.08,
        borderAlpha: 0.25,
      },
      success: {
        colorToken: "success",
        backgroundAlpha: 0.12,
        borderAlpha: 0.35,
      },
      warning: {
        colorToken: "warning",
        backgroundAlpha: 0.12,
        borderAlpha: 0.35,
      },
      danger: {
        colorToken: "destructive",
        backgroundAlpha: 0.12,
        borderAlpha: 0.35,
      },
    },
  },
} as const satisfies {
  desktop: {
    iconClassNames: {
      needsInput: string
      blocked: string
      background: string
      complete: string
    }
    loadingSpinnerClassName: string
  }
  mobile: {
    chip: {
      flexDirection: string
      alignItems: string
      gap: number
      borderWidth: number
      borderRadius: number
      paddingHorizontal: number
      paddingVertical: number
      marginHorizontal: number
    }
    chipText: {
      fontSize: number
      lineHeight: number
      fontWeight: string
    }
    runningIndicator: {
      size: number
      resizeMode: string
    }
    intents: Record<SessionPresentationIntent, {
      colorToken: ChatSessionStatusMobileColorToken
      backgroundAlpha: number
      borderAlpha: number
    }>
  }
}

export type ChatRuntimeToolApprovalAction = "approve" | "deny"

export const TOOL_APPROVAL_SURFACE_PRESENTATION = {
  desktop: {
    containerClassName: "min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30",
    headerClassName: "flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30",
    iconClassName: "h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400",
    titleClassName: "min-w-0 flex-1 text-xs font-medium text-amber-800 dark:text-amber-200",
    spinnerClassName: "ml-auto h-3 w-3 shrink-0 animate-spin text-amber-600 dark:text-amber-400",
    contentClassName: "min-w-0 px-3 py-2",
    contentDisabledClassName: "opacity-60",
    toolRowClassName: "mb-2 flex flex-wrap items-center gap-2",
    toolLabelClassName: "shrink-0 text-xs text-amber-700 dark:text-amber-300",
    toolNameClassName: "max-w-full min-w-0 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
    argumentsPreviewClassName: "mb-2 rounded-md border border-amber-200/70 bg-amber-100/40 px-2 py-1.5 text-[11px] font-mono leading-relaxed text-amber-700/80 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300/80 line-clamp-2 break-words [overflow-wrap:anywhere]",
    expandButtonClassName: "inline-flex max-w-full items-center gap-1 text-left text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200",
    argumentsToggleIconClassName: "h-3 w-3 transition-transform",
    argumentsToggleIconExpandedClassName: "rotate-90",
    actionStackClassName: "space-y-1.5",
    actionRowClassName: "flex flex-wrap items-center gap-2",
    denyButtonClassName: "h-7 min-w-[7rem] flex-1 border-red-300 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30",
    approveButtonClassName: "h-7 min-w-[7rem] flex-1 text-xs text-white",
    approveButtonReadyClassName: "bg-green-600 hover:bg-green-700",
    approveButtonProcessingClassName: "cursor-not-allowed bg-green-500",
    buttonIconClassName: "mr-1 h-3 w-3",
    approveButtonSpinnerIconClassName: "mr-1 h-3 w-3 animate-spin",
    hotkeysRowClassName: "flex flex-wrap items-center gap-1.5 text-[10px] text-amber-700/80 dark:text-amber-300/80",
    hotkeysLabelClassName: "shrink-0 font-medium uppercase tracking-wider opacity-70",
    hotkeysSeparatorClassName: "opacity-40",
    approveKeyClassName: "rounded bg-green-700 px-1 py-0.5 font-mono text-[10px] text-white",
    denyKeyClassName: "rounded bg-red-100 px-1 py-0.5 font-mono text-[10px] text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
  mobile: {
    card: {
      gap: "xs",
      padding: "sm",
      borderRadius: "sm",
      borderWidth: 1,
      borderColorToken: "warning",
      borderAlpha: 0.35,
      backgroundColorToken: "warning",
      backgroundAlpha: 0.1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: "xs",
    },
    icon: {
      name: "shield-checkmark-outline",
      size: 16,
      colorToken: "warning",
    },
    spinner: {
      size: "small",
      colorToken: "warning",
    },
    content: {
      gap: "xs",
      disabledOpacity: 0.6,
    },
    title: {
      numberOfLines: 2,
      fontSize: 13,
      fontWeight: "700",
      colorToken: "warning",
      flex: 1,
      minWidth: 0,
    },
    toolName: {
      numberOfLines: 2,
      fontSize: 12,
      colorToken: "foreground",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      flexShrink: 1,
    },
    toolRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "xs",
      marginBottom: 2,
    },
    toolLabel: {
      fontSize: 11,
      fontWeight: "600",
      colorToken: "warning",
    },
    argumentsPreview: {
      numberOfLines: 2,
      fontSize: 11,
      lineHeight: 15,
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      borderWidth: 1,
      borderRadius: "sm",
      paddingHorizontal: "xs",
      paddingVertical: 4,
      borderColorToken: "warning",
      borderAlpha: 0.25,
      backgroundColorToken: "warning",
      backgroundAlpha: 0.08,
      textColorToken: "mutedForeground",
    },
    argumentsToggle: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginTop: "xs",
      paddingVertical: 4,
      gap: 4,
      accessibilityRole: "button",
      pressedOpacity: 0.7,
    },
    argumentsToggleIcon: {
      collapsedName: "chevron-forward",
      expandedName: "chevron-down",
      size: 14,
    },
    argumentsToggleText: {
      fontSize: 12,
      fontWeight: "600",
      colorToken: "warning",
    },
    fullArguments: {
      marginTop: 4,
      maxHeight: 180,
      borderRadius: "sm",
      padding: 6,
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      backgroundColorToken: "warning",
      backgroundAlpha: 0.08,
      fontSize: 10,
      lineHeight: 14,
      textColorToken: "foreground",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: "sm",
      marginTop: "xs",
    },
    button: {
      minHeight: 36,
      minWidth: 84,
      borderRadius: "sm",
      paddingHorizontal: "md",
      paddingVertical: "sm",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      flex: 1,
      accessibilityRole: "button",
    },
    buttonVariants: {
      approve: {
        backgroundColorToken: "success",
        foregroundColorToken: "successForeground",
      },
      deny: {
        borderWidth: 1,
        borderColorToken: "destructive",
        backgroundColorToken: "background",
        foregroundColorToken: "destructive",
      },
    },
    buttonIcon: {
      approveName: "checkmark-circle",
      denyName: "close-circle",
      size: 15,
    },
    buttonSpinner: {
      size: "small",
      colorToken: "successForeground",
    },
    disabledOpacity: 0.6,
    buttonText: {
      fontSize: 13,
      fontWeight: "700",
    },
  },
} as const

export interface ChatRuntimeRecoveryStatePresentationInput {
  status?: string
  retryCount?: number
  lastError?: string | null
}

export type ChatRuntimeDebugMessageKey = keyof typeof CHAT_RUNTIME_PRESENTATION.debug

export interface ChatRuntimeDebugInfoState {
  debugInfo: string
}

export interface ChatRuntimeQueueFailureState {
  message: string
}

export type ChatRuntimeNoSessionAvailableDebugState =
  ChatRuntimeDebugInfoState & ChatRuntimeQueueFailureState

export function getChatRuntimeAlertMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
}

export function getChatConversationHomePromptSaveSuccessAlertState(
  isEditing: boolean,
): ChatRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState()
  return {
    title: copy.feedback.successTitle,
    message: getPromptLibrarySaveSuccessMessage(isEditing),
  }
}

export function getChatConversationHomePromptSaveFailedAlertState(
  error: unknown,
): ChatRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState()
  return {
    title: copy.feedback.errorTitle,
    message: getChatRuntimeAlertMessage(error, copy.feedback.promptSaveFailed),
  }
}

export function getChatConversationHomePromptDeleteConfirmAlertState(
  promptName: string,
): ChatConversationHomePromptDeleteConfirmAlertState {
  const copy = getPromptLibraryCopyState()
  return {
    title: copy.feedback.deletePromptTitle,
    message: formatPromptLibraryDeletePromptConfirmMessage(promptName),
    cancelLabel: copy.actions.cancel,
    deleteLabel: copy.actions.delete,
    webMessage: formatPromptLibraryDeletePromptWebConfirmMessage(promptName),
  }
}

export function getChatConversationHomePromptDeleteFailedAlertState(
  error: unknown,
): ChatRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState()
  return {
    title: copy.feedback.errorTitle,
    message: getChatRuntimeAlertMessage(error, copy.feedback.promptDeleteFailed),
  }
}

export function getChatConversationHomePromptTaskStartedAlertState(
  taskName: string,
): ChatRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState()
  return {
    title: copy.feedback.taskStartedTitle,
    message: formatPromptLibraryTaskStartedMessage(taskName),
  }
}

export function getChatConversationHomePromptTaskRunFailedAlertState(
  error: unknown,
): ChatRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState()
  return {
    title: copy.feedback.errorTitle,
    message: getChatRuntimeAlertMessage(error, copy.feedback.taskRunFailed),
  }
}

export function getChatConversationHomePromptEditorDismissActionState(
  isSaving = false,
): PromptLibraryEditorDismissActionState {
  return getPromptLibraryEditorDismissActionState(isSaving)
}

export function getChatConversationHomePromptEditorTitle(isEditing: boolean): string {
  return getPromptLibraryEditorTitle(isEditing)
}

export function createChatConversationHomePromptEditorSaveActionState({
  draft,
  isEditing,
  isSaving,
}: ChatConversationHomePromptEditorSaveActionInput): PromptLibraryEditorSaveActionState {
  return getPromptLibraryEditorSaveActionState(
    draft,
    isEditing,
    isSaving,
  )
}

export function getChatMessageCopyFeedbackState(): ChatMessageCopyFeedbackState {
  const copyState = getChatMessageActionCopyState().copy

  return {
    feedbackResetDelayMs: copyState.feedbackResetDelayMs,
    failedTitle: copyState.failedTitle,
    failedMessage: copyState.failedMessage,
  }
}

export function getChatMessageCopyFeedbackResetDelayMs(): number {
  return getChatMessageCopyFeedbackState().feedbackResetDelayMs
}

export function getChatMessageCopyFailureAlertState(
  error: unknown,
  feedbackState: ChatMessageCopyFeedbackState = getChatMessageCopyFeedbackState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: feedbackState.failedTitle,
    message: getChatRuntimeAlertMessage(error, feedbackState.failedMessage),
  }
}

export function getChatMessageToolExecutionCopyFailureResolvedAlertState(
  error: unknown,
  alertState: ToolExecutionDetailCopyFailureAlertState = getToolExecutionDetailCopyFailureAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alertState.title,
    message: getChatRuntimeAlertMessage(error, alertState.fallbackMessage),
  }
}

export function formatChatRuntimeDebugError(message: string): string {
  return `Error: ${message}`
}

export function formatChatRuntimeStartingRequestDebugMessage(baseUrl: string): string {
  return `Starting request to ${baseUrl}...`
}

export function getChatRuntimeDebugState(): typeof CHAT_RUNTIME_PRESENTATION.debug {
  return CHAT_RUNTIME_PRESENTATION.debug
}

export function getChatRuntimeDebugMessage(key: ChatRuntimeDebugMessageKey): string {
  return CHAT_RUNTIME_PRESENTATION.debug[key]
}

export function createChatRuntimeNoSessionAvailableDebugState(): ChatRuntimeNoSessionAvailableDebugState {
  const message = getChatRuntimeDebugMessage("noSessionAvailable")
  return {
    message,
    debugInfo: formatChatRuntimeDebugError(message),
  }
}

function createChatRuntimeDebugInfoState(
  key: ChatRuntimeDebugMessageKey,
): ChatRuntimeDebugInfoState {
  return {
    debugInfo: getChatRuntimeDebugMessage(key),
  }
}

function createChatRuntimeQueueFailureState(
  key: ChatRuntimeDebugMessageKey,
): ChatRuntimeQueueFailureState {
  return {
    message: getChatRuntimeDebugMessage(key),
  }
}

export function createChatRuntimeStartingRequestDebugState(baseUrl: string): ChatRuntimeDebugInfoState {
  return {
    debugInfo: formatChatRuntimeStartingRequestDebugMessage(baseUrl),
  }
}

export function createChatRuntimeRequestSentDebugState(): ChatRuntimeDebugInfoState {
  return createChatRuntimeDebugInfoState("requestSent")
}

export function createChatRuntimeCompletedDebugState(): ChatRuntimeDebugInfoState {
  return createChatRuntimeDebugInfoState("completed")
}

export function createChatRuntimeProcessingQueuedMessageDebugState(): ChatRuntimeDebugInfoState {
  return createChatRuntimeDebugInfoState("processingQueuedMessage")
}

export function createChatRuntimeSessionChangedDuringProcessingQueueFailureState(): ChatRuntimeQueueFailureState {
  return createChatRuntimeQueueFailureState("sessionChangedDuringProcessing")
}

export function createChatRuntimeRequestSupersededQueueFailureState(): ChatRuntimeQueueFailureState {
  return createChatRuntimeQueueFailureState("requestSuperseded")
}

export interface ChatRuntimeStatusSetter<TValue> {
  (value: TValue): void
}

export interface ChatRuntimePendingTurnStatusSetters {
  setLatestStepSummary: ChatRuntimeStatusSetter<null>
  setResponding: ChatRuntimeStatusSetter<boolean>
  setConversationState: ChatRuntimeStatusSetter<AgentConversationState>
}

export interface ChatRuntimeConversationTurnStatusSetters {
  setConversationState: ChatRuntimeStatusSetter<AgentConversationState>
}

export interface ChatRuntimeSettledTurnStatusSetters {
  setResponding: ChatRuntimeStatusSetter<boolean>
  setConnectionState: ChatRuntimeStatusSetter<RecoveryState | null>
}

export interface ChatMessageRuntimeAssistantTextMessage {
  role: "assistant"
  content: string
}

export interface ChatMessageRuntimeUserTextMessage {
  role: "user"
  content: string
}

export interface ChatMessageRuntimePendingTurnMessage {
  role: "user" | "assistant" | "tool"
  content?: string
}

export interface ChatMessageRuntimePendingTurnState<TMessage> {
  userMessage: TMessage
  currentMessages: readonly TMessage[]
  messageCountBeforeTurn: number
  latestStepSummary: null
  responding: boolean
  conversationState: AgentConversationState
  updateMessages: (messages: readonly TMessage[]) => TMessage[]
}

export type ChatMessageRuntimeConversationContentUpdateMessage =
  ChatMessageConversationContentLike & {
    content?: string
  }

export interface ChatMessageRuntimeConnectionErrorTurnStateInput {
  message: string
  recoveryState: Parameters<typeof formatChatRuntimeConnectionErrorMessage>[1]
  partialContent?: string | null
}

export interface ChatMessageRuntimeRequestSessionChangedInput {
  currentSessionId?: string | null
  requestSessionId?: string | null
}

export interface ChatMessageRuntimeLatestSessionRequestInput {
  requestSessionId?: string | null
  requestId: number
  latestRequestId?: number | null
}

export interface ChatMessageRuntimeActiveRequestInput {
  requestId: number
  activeRequestId: number
}

export interface ChatMessageRuntimeFinalResponseTextStateInput {
  responseContent?: string | null
  streamingText: string
  conversationState: AgentConversationState
  finalResponseEvent?: Pick<AgentUserResponseEvent, "id" | "text"> | null
  lastUserResponse?: string
  midTurnLegacyResponseText?: string
  playedResponseEventIds?: ReadonlySet<string>
}

export interface ChatMessageRuntimeProgressResponseEventFactory {
  (
    sessionId: string | null | undefined,
    runId: number | undefined,
    text: string,
  ): AgentUserResponseEvent
}

export interface ChatMessageRuntimeProgressResponseStateInput {
  update: Pick<AgentProgressUpdate, "responseEvents" | "userResponse" | "spokenContent" | "runId">
  requestSessionId?: string | null
  lastUserResponse?: string
  createFallbackResponseEvent: ChatMessageRuntimeProgressResponseEventFactory
}

export interface ChatMessageRuntimeTurnDurationSourceMessage {
  role: "user" | "assistant" | "tool"
  content?: string
  timestamp?: number
  toolCalls?: unknown[]
  toolResults?: unknown[]
}

export interface ChatMessageRuntimeTurnDurationStateInput {
  messages: readonly ChatMessageRuntimeTurnDurationSourceMessage[]
  conversationState?: AgentConversationState | null
  isResponding?: boolean
}

export interface ChatMessageRuntimeLogMeta {
  length: number
  inlineImageCount: number
}

export type ChatMessageRuntimeToolActivityGroup = ToolActivityGroup
export type ChatMessageRuntimeToolActivityGroups = ReturnType<typeof groupToolActivity>
export type ChatMessageRuntimeMessageExpansionState = ChatDisplayExpansionStateMap<number>
export type ChatMessageRuntimeToolCallExpansionState = ChatDisplayExpansionStateMap<string>
export type ChatMessageRuntimeToolApprovalExpansionState = ChatDisplayExpansionStateMap<string>
export type ChatMessageRuntimeToolActivityGroupExpansionState = ChatDisplayExpansionStateMap<string>

export interface ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult> {
  id?: string
  role: "user" | "assistant" | "tool"
  content?: string
  displayContent?: string
  toolCalls?: TToolCall[]
  toolResults?: TToolResult[]
  branchMessageIndex?: number
}

export interface ChatMessageRuntimeHistoryTurnMessageLike {
  role: "user" | "assistant" | "tool"
  content?: string | null
}

export interface ChatMessageRuntimeHistoryDisplayMessage<TToolCall, TToolResult> {
  id?: string
  role: "user" | "assistant"
  content: string
  displayContent?: string
  toolCalls?: TToolCall[]
  toolResults?: TToolResult[]
  branchMessageIndex?: number
}

export interface ChatMessageRuntimeToolResultMergeMessage<TToolCall, TToolResult> {
  role: "user" | "assistant" | "tool"
  toolCalls?: TToolCall[]
  toolResults?: TToolResult[]
}

interface ChatMessageRuntimeHistoryDisplayMessageOptions {
  includeId?: boolean
}

export interface ChatMessageRuntimeHistoryDisplayMessagesOptions
  extends ChatMessageRuntimeHistoryDisplayMessageOptions {
  includeToolMessages?: boolean
  mergeToolResults?: boolean
  skipUserMessages?: boolean
  startIndex?: number
}

export interface ChatMessageRuntimeFinalHistoryTurnMessagesOptions
  extends ChatMessageRuntimeHistoryDisplayMessagesOptions {
  userResponse?: string
}

export type ChatMessageRuntimeFinalResponseTurnState<
  TMessage extends ChatDisplayMessageLike &
    ChatMessageRuntimeConversationContentUpdateMessage &
    ChatMessageRuntimePendingTurnMessage,
> =
  | {
      kind: "history"
      finalTurnMessages: TMessage[]
      updateMessages: (
        messages: readonly TMessage[],
        messageCountBeforeTurn: number,
        progressMessages?: readonly TMessage[],
      ) => TMessage[]
      createCompletedMessages: (
        messages: readonly TMessage[],
        messageCountBeforeTurn: number,
        userMessage: TMessage,
      ) => TMessage[]
    }
  | {
      kind: "text"
      finalDisplayText: string
      updateMessages: (messages: readonly TMessage[]) => TMessage[]
      createCompletedMessages: (
        messages: readonly TMessage[],
        messageCountBeforeTurn: number,
        userMessage: TMessage,
      ) => TMessage[]
    }
  | {
      kind: "empty"
    }

export interface ChatMessageRuntimeFinalResponseTurnStateInput<TToolCall, TToolResult> {
  conversationHistory?: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[] | null
  finalDisplayText?: string | null
  historyOptions?: Omit<ChatMessageRuntimeFinalHistoryTurnMessagesOptions, "userResponse">
  userResponseText?: string
}

export interface ChatMessageRuntimeSessionMessageLike<TToolCall, TToolResult> {
  id?: string
  role: "user" | "assistant" | "tool"
  content?: string
  displayContent?: string
  timestamp?: number
  toolCalls?: TToolCall[]
  toolResults?: TToolResult[]
}

export interface ChatMessageRuntimeResponseHistorySourceMessage {
  role: "user" | "assistant" | "tool"
  timestamp?: number
  toolCalls?: Array<{ name: string; arguments: unknown }>
}

export interface ChatMessageRuntimeSessionDisplayMessagesOptions {
  includeId?: boolean
}

export interface ChatMessageRuntimeRetryMessage extends ChatMessageRuntimeAssistantTextMessage {
  variant: "retry"
  retryInfo: AgentRetryInfo
}

export interface ChatMessageRuntimeAssistantFeedbackMessage<TToolCall, TToolResult> {
  role: "assistant"
  content: string
  toolCalls?: TToolCall[]
  toolResults?: TToolResult[]
}

export interface ChatMessageRuntimeAssistantFeedbackMessageInput<TToolCall, TToolResult> {
  thinkingContent: string | null | undefined
  hasToolActivity: boolean
  toolCalls?: TToolCall[]
  toolResults?: TToolResult[]
}

export interface ChatMessageRuntimeActivityMessage {
  role: "assistant"
  content: string
}

export interface ChatMessageRuntimeToolApprovalLike {
  toolName: string
}

export interface ChatMessageRuntimeToolApprovalStateMessageLike {
  toolApproval?: {
    approvalId?: string
  } | null
}

export interface ChatMessageRuntimeToolApprovalRequiredMessage<
  TToolApproval extends ChatMessageRuntimeToolApprovalLike,
> {
  role: "assistant"
  content: string
  variant: "approval"
  toolApproval: TToolApproval
}

export interface ChatMessageRuntimeProgressTurnState<TMessage extends ChatDisplayMessageLike> {
  conversationState: AgentConversationState
  latestStepSummary?: AgentStepSummary | null
  progressMessages: TMessage[]
  updateMessages: (
    messages: readonly TMessage[],
    messageCountBeforeTurn: number,
  ) => TMessage[]
}

export interface ChatRuntimeProgressTurnStatusSetters {
  setLatestStepSummary: (value: AgentStepSummary | null) => void
  setConversationState: (value: AgentConversationState | null) => void
}

export interface ChatMessageRuntimeStreamingTurnState<
  TMessage extends ChatMessageRuntimeConversationContentUpdateMessage,
> {
  streamingText: string
  updateMessages: (messages: readonly TMessage[]) => TMessage[]
}

export function createChatMessageRuntimeUserTextMessage(
  content: string,
): ChatMessageRuntimeUserTextMessage {
  return {
    role: "user",
    content,
  }
}

export function createChatMessageRuntimeAssistantTextMessage(
  content: string,
): ChatMessageRuntimeAssistantTextMessage {
  return {
    role: "assistant",
    content,
  }
}

export function createChatMessageRuntimeAssistantPlaceholderMessage(): ChatMessageRuntimeAssistantTextMessage {
  return createChatMessageRuntimeAssistantTextMessage("")
}

export function appendChatMessageRuntimePendingTurnMessages<
  TMessage extends ChatMessageRuntimePendingTurnMessage,
>(
  messages: readonly TMessage[],
  userMessage: TMessage,
): TMessage[] {
  return [
    ...messages,
    userMessage,
    createChatMessageRuntimeAssistantPlaceholderMessage() as TMessage,
  ]
}

export function createChatMessageRuntimePendingTurnStatusState() {
  return {
    latestStepSummary: null,
    responding: true,
    conversationState: "running" as AgentConversationState,
  }
}

export function createChatMessageRuntimePendingTurnState<
  TMessage extends ChatMessageRuntimePendingTurnMessage,
>(
  currentMessages: readonly TMessage[],
  content: string,
): ChatMessageRuntimePendingTurnState<TMessage> {
  const userMessage = createChatMessageRuntimeUserTextMessage(content) as TMessage
  const pendingTurnStatusState = createChatMessageRuntimePendingTurnStatusState()
  return {
    userMessage,
    currentMessages,
    messageCountBeforeTurn: currentMessages.length,
    latestStepSummary: pendingTurnStatusState.latestStepSummary,
    responding: pendingTurnStatusState.responding,
    conversationState: pendingTurnStatusState.conversationState,
    updateMessages: (messages) => appendChatMessageRuntimePendingTurnMessages(messages, userMessage),
  }
}

export function removeChatMessageRuntimePendingTurnMessages<TMessage>(
  messages: readonly TMessage[],
): TMessage[] {
  if (messages.length < 2) {
    return [...messages]
  }
  return messages.slice(0, -2)
}

export function createChatMessageRuntimeAssistantDebugErrorMessage(
  message: string,
): ChatMessageRuntimeAssistantTextMessage {
  return createChatMessageRuntimeAssistantTextMessage(formatChatRuntimeDebugError(message))
}

export function appendChatMessageRuntimeAssistantDebugErrorMessage<
  TMessage extends ChatMessageRuntimePendingTurnMessage,
>(
  messages: readonly TMessage[],
  message: string,
): TMessage[] {
  return [
    ...messages,
    createChatMessageRuntimeAssistantDebugErrorMessage(message) as TMessage,
  ]
}

export function createChatMessageRuntimeAssistantErrorMessage(
  errorMessage: string,
  partialContent?: string | null,
): ChatMessageRuntimeAssistantTextMessage {
  return createChatMessageRuntimeAssistantTextMessage(
    formatChatRuntimeAssistantErrorContent(errorMessage, partialContent),
  )
}

export function isLastChatMessageRuntimeConversationContent(
  messages: readonly ChatMessageConversationContentLike[],
): boolean {
  const lastMessage = messages[messages.length - 1]
  return !!lastMessage && isChatMessageConversationContent(lastMessage)
}

export function updateLastChatMessageRuntimeConversationContent<
  TMessage extends ChatMessageRuntimeConversationContentUpdateMessage,
>(
  messages: readonly TMessage[],
  content: string,
): TMessage[] {
  const copy = [...messages]
  for (let i = copy.length - 1; i >= 0; i--) {
    if (isChatMessageConversationContent(copy[i])) {
      copy[i] = { ...copy[i], content } as TMessage
      break
    }
  }
  return copy
}

export function updateLastChatMessageRuntimeAssistantErrorMessage<
  TMessage extends ChatMessageRuntimeConversationContentUpdateMessage,
>(
  messages: readonly TMessage[],
  errorMessage: string,
  partialContent?: string | null,
): TMessage[] {
  const errorMessageState = createChatMessageRuntimeAssistantErrorMessage(errorMessage, partialContent)
  return updateLastChatMessageRuntimeConversationContent(messages, errorMessageState.content)
}

export function createChatMessageRuntimeAssistantErrorTurnState<
  TMessage extends ChatMessageRuntimeConversationContentUpdateMessage,
>(
  errorMessage: string,
  partialContent?: string | null,
) {
  return {
    debugInfo: formatChatRuntimeDebugError(errorMessage),
    updateMessages: (messages: readonly TMessage[]) => updateLastChatMessageRuntimeAssistantErrorMessage(
      messages,
      errorMessage,
      partialContent,
    ),
  }
}

export function createChatMessageRuntimeConnectionErrorTurnState<
  TMessage extends ChatMessageRuntimeConversationContentUpdateMessage,
>({
  message,
  recoveryState,
  partialContent,
}: ChatMessageRuntimeConnectionErrorTurnStateInput) {
  const errorMessage = formatChatRuntimeConnectionErrorMessage(message, recoveryState)
  return createChatMessageRuntimeAssistantErrorTurnState<TMessage>(
    errorMessage,
    partialContent,
  )
}

export function createChatMessageRuntimeAssistantDebugErrorTurnState<
  TMessage extends ChatMessageRuntimePendingTurnMessage,
>(
  message: string,
) {
  return {
    updateMessages: (messages: readonly TMessage[]) => appendChatMessageRuntimeAssistantDebugErrorMessage(
      messages,
      message,
    ),
  }
}

export function createChatMessageRuntimeQueuedErrorState<
  TMessage extends ChatMessageRuntimePendingTurnMessage,
>(
  error: unknown,
) {
  const message = getChatRuntimeAlertMessage(
    error,
    getChatRuntimeDebugMessage("unknownError"),
  )
  return {
    message,
    turnState: createChatMessageRuntimeAssistantDebugErrorTurnState<TMessage>(message),
  }
}

export function replaceChatMessageRuntimeTurnMessages<TMessage>(
  messages: readonly TMessage[],
  messageCountBeforeTurn: number,
  turnMessages: readonly TMessage[],
): TMessage[] {
  const beforePlaceholder = messages.slice(0, messageCountBeforeTurn + 1)
  return [...beforePlaceholder, ...turnMessages]
}

export function createChatMessageRuntimeCompletedTurnMessages<TMessage>(
  messages: readonly TMessage[],
  messageCountBeforeTurn: number,
  userMessage: TMessage,
  turnMessages: readonly TMessage[],
): TMessage[] {
  const messagesBeforeTurn = messages.slice(0, messageCountBeforeTurn)
  return [...messagesBeforeTurn, userMessage, ...turnMessages]
}

export function createChatMessageRuntimeCompletedTextTurnMessages<
  TMessage extends ChatMessageRuntimePendingTurnMessage,
>(
  messages: readonly TMessage[],
  messageCountBeforeTurn: number,
  userMessage: TMessage,
  content: string,
): TMessage[] {
  return createChatMessageRuntimeCompletedTurnMessages(
    messages,
    messageCountBeforeTurn,
    userMessage,
    [createChatMessageRuntimeAssistantTextMessage(content) as TMessage],
  )
}

export function createChatMessageRuntimeCompletedConversationState(
  conversationState: AgentConversationState,
): AgentConversationState {
  return conversationState === "running" ? "complete" : conversationState
}

export function applyChatMessageRuntimePendingTurnStatusState(
  pendingTurnState: Pick<
    ChatMessageRuntimePendingTurnState<unknown>,
    "latestStepSummary" | "responding" | "conversationState"
  >,
  statusSetters: ChatRuntimePendingTurnStatusSetters,
): void {
  statusSetters.setLatestStepSummary(pendingTurnState.latestStepSummary)
  statusSetters.setResponding(pendingTurnState.responding)
  statusSetters.setConversationState(pendingTurnState.conversationState)
}

export function applyChatMessageRuntimeCompletedTurnStatusState(
  completedConversationState: AgentConversationState,
  statusSetters: ChatRuntimeConversationTurnStatusSetters,
): void {
  statusSetters.setConversationState(completedConversationState)
}

export function applyChatMessageRuntimeBlockedTurnStatusState(
  statusSetters: ChatRuntimeConversationTurnStatusSetters,
): void {
  statusSetters.setConversationState("blocked")
}

export function applyChatMessageRuntimeSettledTurnStatusState(
  statusSetters: ChatRuntimeSettledTurnStatusSetters,
): void {
  statusSetters.setResponding(false)
  statusSetters.setConnectionState(null)
}

export function createChatMessageRuntimeUserResponseMessages<
  TMessage extends ChatDisplayMessageLike,
>(
  messages: readonly TMessage[],
  userResponse?: string,
): TMessage[] {
  return applyUserResponseToChatMessages(messages, userResponse)
}

export function preserveChatMessageRuntimeDisplayContentFromProgress<
  TMessage extends ChatDisplayMessageLike,
>(
  finalMessages: readonly TMessage[],
  progressMessages: readonly ChatDisplayMessageLike[],
): TMessage[] {
  return preserveChatMessageDisplayContentFromProgress(finalMessages, progressMessages)
}

export function createChatMessageRuntimeStreamingText(
  currentText: string,
  nextToken: string,
): string {
  if (nextToken.startsWith(currentText) && nextToken.length >= currentText.length) {
    return nextToken
  }
  return currentText + nextToken
}

export function createChatMessageRuntimeStreamingTurnState<
  TMessage extends ChatMessageRuntimeConversationContentUpdateMessage,
>(
  currentText: string,
  nextToken: string,
): ChatMessageRuntimeStreamingTurnState<TMessage> {
  const streamingText = createChatMessageRuntimeStreamingText(currentText, nextToken)
  return {
    streamingText,
    updateMessages: (messages) => updateLastChatMessageRuntimeConversationContent(messages, streamingText),
  }
}

export function createChatMessageRuntimeFinalResponseTextState({
  responseContent,
  streamingText,
  conversationState,
  finalResponseEvent,
  lastUserResponse,
  midTurnLegacyResponseText,
  playedResponseEventIds,
}: ChatMessageRuntimeFinalResponseTextStateInput) {
  const finalText = responseContent || streamingText
  const userResponseText = finalResponseEvent?.text || lastUserResponse
  const finalDisplayText = userResponseText || finalText
  const ttsText = userResponseText || finalText
  const alreadySpokenMidTurn = !!(finalResponseEvent
    ? playedResponseEventIds?.has(finalResponseEvent.id)
    : midTurnLegacyResponseText && ttsText === midTurnLegacyResponseText)

  return {
    finalText,
    finalDisplayText,
    ttsText,
    userResponseText,
    alreadySpokenMidTurn,
    completedConversationState: createChatMessageRuntimeCompletedConversationState(conversationState),
  }
}

export function sortChatMessageRuntimeResponseEvents<
  TEvent extends Pick<AgentUserResponseEvent, "ordinal" | "timestamp" | "runId">,
>(
  events: TEvent[],
): TEvent[] {
  return sortAgentUserResponseEvents(events)
}

export function getChatMessageRuntimeNextResponseEventOrdinal<
  TEvent extends Pick<AgentUserResponseEvent, "ordinal">,
>(
  events: TEvent[],
): number {
  return getNextAgentUserResponseEventOrdinal(events)
}

export function createChatMessageRuntimeProgressResponseState({
  update,
  requestSessionId,
  lastUserResponse,
  createFallbackResponseEvent,
}: ChatMessageRuntimeProgressResponseStateInput) {
  if (update.responseEvents?.length) {
    const responseEvents = sortChatMessageRuntimeResponseEvents(update.responseEvents)
    return {
      hasResponseUpdate: true,
      responseEvents,
      speechQueueEvents: responseEvents,
      lastUserResponse: responseEvents[responseEvents.length - 1]?.text,
      legacyResponseText: undefined,
    }
  }

  const responseText = update.userResponse || update.spokenContent
  if (responseText) {
    const responseEvents = responseText !== lastUserResponse
      ? [createFallbackResponseEvent(requestSessionId, update.runId, responseText)]
      : []

    return {
      hasResponseUpdate: true,
      responseEvents,
      speechQueueEvents: [],
      lastUserResponse: responseText,
      legacyResponseText: responseText,
    }
  }

  return {
    hasResponseUpdate: false,
    responseEvents: [],
    speechQueueEvents: [],
    lastUserResponse,
    legacyResponseText: undefined,
  }
}

export function createChatMessageRuntimeRetryMessage(
  retryInfo: AgentRetryInfo,
): ChatMessageRuntimeRetryMessage {
  return {
    ...createChatMessageRuntimeAssistantTextMessage(retryInfo.reason),
    variant: "retry",
    retryInfo,
  }
}

export function createChatMessageRuntimeAssistantFeedbackMessage<TToolCall, TToolResult>({
  thinkingContent,
  hasToolActivity,
  toolCalls,
  toolResults,
}: ChatMessageRuntimeAssistantFeedbackMessageInput<
  TToolCall,
  TToolResult
>): ChatMessageRuntimeAssistantFeedbackMessage<TToolCall, TToolResult> {
  return {
    role: "assistant",
    content: formatChatRuntimeAssistantFeedbackContent(thinkingContent, hasToolActivity),
    ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
    ...(toolResults && toolResults.length > 0 ? { toolResults } : {}),
  }
}

export function createChatMessageRuntimeActivityMessage(
  step?: ChatRuntimeActivityStepLike | null,
): ChatMessageRuntimeActivityMessage {
  return {
    role: "assistant",
    content: formatChatRuntimeActivityContent(step),
  }
}

export function createChatMessageRuntimeToolApprovalRequiredMessage<
  TToolApproval extends ChatMessageRuntimeToolApprovalLike,
>(
  toolApproval: TToolApproval,
): ChatMessageRuntimeToolApprovalRequiredMessage<TToolApproval> {
  return {
    role: "assistant",
    content: formatChatRuntimeToolApprovalRequiredContent(toolApproval.toolName),
    variant: "approval",
    toolApproval,
  }
}

export function removeChatMessageRuntimeToolApprovalMessage<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
>(
  messages: readonly TMessage[],
  approvalId: string,
): TMessage[] {
  return messages.filter((message) => message.toolApproval?.approvalId !== approvalId)
}

export function createChatMessageRuntimeProgressMessages<
  TMessage extends ChatDisplayMessageLike,
>(
  update: AgentProgressUpdate,
): TMessage[] {
  const messages: TMessage[] = []
  const delegationMessages = createAgentDelegationProgressMessages(update.steps) as unknown as TMessage[]

  if (update.steps && update.steps.length > 0) {
    const currentToolCalls: unknown[] = []
    const currentToolResults: unknown[] = []
    let thinkingContent = ""

    for (const step of update.steps) {
      const stepContent = step.content || step.llmContent
      if (step.type === "thinking" && stepContent) {
        thinkingContent = stepContent
      } else if (step.type === "tool_call") {
        if (step.toolCall) {
          currentToolCalls.push(step.toolCall)
        }
        if (step.toolResult) {
          currentToolResults.push(step.toolResult)
        }
      } else if (step.type === "tool_result" && step.toolResult) {
        currentToolResults.push(step.toolResult)
      } else if (step.type === "completion" && stepContent) {
        thinkingContent = stepContent
      }
    }

    const activeStep = [...update.steps].reverse().find((step) => step.status === "in_progress")
    const shouldRenderActiveStep = shouldRenderChatRuntimeActivityStep(activeStep)
    const hasCurrentToolActivity = currentToolCalls.length > 0 || currentToolResults.length > 0
    const hasCurrentAssistantFeedback = hasCurrentToolActivity || thinkingContent.trim().length > 0
    const hasCurrentStateFeedback =
      hasCurrentAssistantFeedback ||
      !!update.pendingToolApproval ||
      !!update.retryInfo?.isRetrying ||
      delegationMessages.length > 0 ||
      !!update.streamingContent?.text

    if (hasCurrentAssistantFeedback) {
      messages.push(createChatMessageRuntimeAssistantFeedbackMessage({
        thinkingContent,
        hasToolActivity: hasCurrentToolActivity,
        toolCalls: currentToolCalls,
        toolResults: currentToolResults,
      }) as unknown as TMessage)
    } else if (
      !update.isComplete &&
      !hasCurrentStateFeedback &&
      shouldRenderActiveStep
    ) {
      messages.push(createChatMessageRuntimeActivityMessage(activeStep) as unknown as TMessage)
    }
  }

  if (update.conversationHistory && update.conversationHistory.length > 0) {
    const currentTurnStartIndex = findChatMessageRuntimeLastUserMessageIndex(update.conversationHistory)
    const hasAssistantMessages = hasChatMessageRuntimeMessagesAfter(update.conversationHistory, currentTurnStartIndex)
    if (hasAssistantMessages) {
      messages.length = 0
      messages.push(...createChatMessageRuntimeHistoryDisplayMessages(update.conversationHistory, {
        startIndex: currentTurnStartIndex + 1,
      }) as unknown as TMessage[])
    }
  }

  if (update.retryInfo?.isRetrying) {
    messages.push(createChatMessageRuntimeRetryMessage(update.retryInfo) as unknown as TMessage)
  }

  if (update.streamingContent?.text) {
    if (
      messages.length > 0 &&
      isLastChatMessageRuntimeConversationContent(messages)
    ) {
      messages[messages.length - 1].content = update.streamingContent.text
    } else {
      messages.push(createChatMessageRuntimeAssistantTextMessage(update.streamingContent.text) as unknown as TMessage)
    }
  }

  if (update.pendingToolApproval) {
    messages.push(createChatMessageRuntimeToolApprovalRequiredMessage(update.pendingToolApproval) as unknown as TMessage)
  }

  const messagesWithUserResponse = createChatMessageRuntimeUserResponseMessages(
    messages,
    update.userResponse || update.spokenContent,
  )
  return [...messagesWithUserResponse, ...delegationMessages]
}

export function createChatMessageRuntimeProgressTurnState<
  TMessage extends ChatDisplayMessageLike,
>(
  update: AgentProgressUpdate,
  lifecycleState: AgentConversationState = "running",
): ChatMessageRuntimeProgressTurnState<TMessage> {
  const progressMessages = createChatMessageRuntimeProgressMessages<TMessage>(update)

  return {
    conversationState: resolveAgentProgressConversationState(update, lifecycleState),
    latestStepSummary: getChatRuntimeLatestStepSummary(update),
    progressMessages,
    updateMessages: (
      messages: readonly TMessage[],
      messageCountBeforeTurn: number,
    ) => replaceChatMessageRuntimeTurnMessages(
      messages,
      messageCountBeforeTurn,
      progressMessages,
    ),
  }
}

export function applyChatMessageRuntimeProgressTurnStatusState(
  progressTurnState: Pick<
    ChatMessageRuntimeProgressTurnState<ChatDisplayMessageLike>,
    "conversationState" | "latestStepSummary"
  >,
  statusSetters: ChatRuntimeProgressTurnStatusSetters,
): void {
  statusSetters.setConversationState(progressTurnState.conversationState)
  statusSetters.setLatestStepSummary(progressTurnState.latestStepSummary ?? null)
}

export function createChatMessageRuntimeTurnDurationMessages(
  messages: readonly ChatMessageRuntimeTurnDurationSourceMessage[],
): TurnDurationMessage[] {
  return createTurnDurationMessages(messages)
}

export function computeChatMessageRuntimeTurnDurations(
  messages: TurnDurationMessage[],
  isComplete: boolean,
  nowMs: number,
): ReturnType<typeof computeTurnDurations> {
  return computeTurnDurations(messages, isComplete, nowMs)
}

export function createChatMessageRuntimeLogMeta(content: string): ChatMessageRuntimeLogMeta {
  return {
    length: content.length,
    inlineImageCount: extractDataImageMarkdownReferences(content).length,
  }
}

export function createChatMessageRuntimeModelMessages<TMessage extends MessageContentForModelLike>(
  messages: TMessage[],
): TMessage[] {
  return sanitizeMessagesForModel(messages)
}

export function createChatMessageRuntimeToolActivityGroups(
  messages: Parameters<typeof groupToolActivity>[0],
): ChatMessageRuntimeToolActivityGroups {
  return groupToolActivity(messages)
}

export function toggleChatMessageRuntimeMessageExpansionState(
  messageState: ChatMessageRuntimeMessageExpansionState,
  messageIndex: number,
): ChatMessageRuntimeMessageExpansionState {
  return toggleChatDisplayExpansionState(
    messageState,
    messageIndex,
  ) as ChatMessageRuntimeMessageExpansionState
}

export function toggleChatMessageRuntimeToolCallExpansionState(
  toolCallState: ChatMessageRuntimeToolCallExpansionState,
  messageId: string,
  toolCallIndex: number,
): ChatMessageRuntimeToolCallExpansionState {
  return toggleChatDisplayExpansionState(
    toolCallState,
    `${messageId}-${toolCallIndex}`,
  ) as ChatMessageRuntimeToolCallExpansionState
}

export function toggleChatMessageRuntimeToolApprovalExpansionState(
  toolApprovalState: ChatMessageRuntimeToolApprovalExpansionState,
  approvalId: string,
): ChatMessageRuntimeToolApprovalExpansionState {
  return toggleChatDisplayExpansionState(
    toolApprovalState,
    approvalId,
  ) as ChatMessageRuntimeToolApprovalExpansionState
}

export function applyChatMessageRuntimeAutoExpansionState<TMessage extends ChatDisplayMessageLike>(
  messageState: ChatMessageRuntimeMessageExpansionState,
  messages: readonly TMessage[],
  options: Parameters<typeof applyChatMessageAutoExpansionState>[2],
): ChatMessageRuntimeMessageExpansionState {
  return applyChatMessageAutoExpansionState(
    messageState,
    messages,
    options,
  ) as ChatMessageRuntimeMessageExpansionState
}

export function toggleChatMessageRuntimeToolActivityGroupExpansionState(
  groupState: ChatMessageRuntimeToolActivityGroupExpansionState,
  group: ChatMessageRuntimeToolActivityGroup,
): ChatMessageRuntimeToolActivityGroupExpansionState {
  return toggleChatDisplayExpansionState(
    groupState,
    getToolActivityGroupStateKey(group),
  ) as ChatMessageRuntimeToolActivityGroupExpansionState
}

export function applyChatMessageRuntimeToolActivityGroupExpansionInheritance({
  groupState,
  inheritedState,
  groups,
}: {
  groupState: ChatMessageRuntimeToolActivityGroupExpansionState
  inheritedState?: ChatDisplayExpansionStateMap<number>
  groups: readonly ChatMessageRuntimeToolActivityGroup[]
}): ChatMessageRuntimeToolActivityGroupExpansionState {
  return applyChatDisplayGroupedExpansionInheritance({
    groupState,
    inheritedState,
    groups: getToolActivityGroupExpansionInheritanceItems(groups),
  }) as ChatMessageRuntimeToolActivityGroupExpansionState
}

export function hasChatMessageRuntimeLiveAgentTurn({
  conversationState,
  isResponding = false,
}: Pick<ChatMessageRuntimeTurnDurationStateInput, "conversationState" | "isResponding">): boolean {
  return (
    isResponding ||
    conversationState === "running" ||
    conversationState === "needs_input"
  )
}

const hasChatMessageRuntimeEntries = <TEntry>(
  entries?: readonly TEntry[] | null,
): boolean => !!entries && entries.length > 0

export function findChatMessageRuntimeLastUserMessageIndex(
  historyMessages: readonly ChatMessageRuntimeHistoryTurnMessageLike[],
  fallbackIndex = 0,
): number {
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    if (historyMessages[i].role === "user") {
      return i
    }
  }
  return fallbackIndex
}

export function hasChatMessageRuntimeMessagesAfter(
  historyMessages: readonly ChatMessageRuntimeHistoryTurnMessageLike[],
  startIndex: number,
): boolean {
  return startIndex + 1 < historyMessages.length
}

export function hasChatMessageRuntimeAssistantContentAfter(
  historyMessages: readonly ChatMessageRuntimeHistoryTurnMessageLike[],
  startIndex: number,
): boolean {
  if (startIndex < 0) return false
  for (let i = startIndex + 1; i < historyMessages.length; i++) {
    const historyMessage = historyMessages[i]
    if (historyMessage.role === "assistant" && historyMessage.content) {
      return true
    }
  }
  return false
}

export function createChatMessageRuntimeSessionDisplayMessages<
  TMessage extends ChatMessageRuntimeSessionMessageLike<TToolCall, TToolResult>,
  TToolCall = unknown,
  TToolResult = unknown,
>(
  sessionMessages: readonly ChatMessageRuntimeSessionMessageLike<TToolCall, TToolResult>[],
  {
    includeId = false,
  }: ChatMessageRuntimeSessionDisplayMessagesOptions = {},
): TMessage[] {
  return sessionMessages.map((message) => ({
    ...(includeId ? { id: message.id } : {}),
    role: message.role,
    content: message.content,
    displayContent: message.displayContent,
    timestamp: message.timestamp,
    toolCalls: message.toolCalls,
    toolResults: message.toolResults,
  }) as TMessage)
}

export function createChatMessageRuntimeResponseHistoryEvents(
  messages: ChatMessageRuntimeResponseHistorySourceMessage[],
): AgentUserResponseEvent[] {
  return extractRespondToUserResponseEvents(messages, { idPrefix: "mobile-history" })
}

export function replaceChatMessageRuntimeFinalTurnMessages<
  TMessage extends ChatDisplayMessageLike,
>(
  messages: readonly TMessage[],
  messageCountBeforeTurn: number,
  finalTurnMessages: readonly TMessage[],
  progressMessages: readonly ChatDisplayMessageLike[] = [],
): TMessage[] {
  const mergedMessages = mergeChatMessageRuntimeFinalTurnMessagesWithProgress(
    finalTurnMessages,
    progressMessages,
  )
  return replaceChatMessageRuntimeTurnMessages(
    messages,
    messageCountBeforeTurn,
    mergedMessages,
  )
}

export function mergeChatMessageRuntimeToolResultsIntoLastMessage<
  TMessage extends ChatMessageRuntimeToolResultMergeMessage<TToolCall, TToolResult>,
  TToolCall,
  TToolResult,
>(
  messages: TMessage[],
  historyMessage: ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>,
): boolean {
  const lastMessage = messages[messages.length - 1]
  if (
    historyMessage.role !== "tool" ||
    !lastMessage ||
    lastMessage.role !== "assistant" ||
    !hasChatMessageRuntimeEntries(lastMessage.toolCalls) ||
    !hasChatMessageRuntimeEntries(historyMessage.toolResults)
  ) {
    return false
  }

  lastMessage.toolResults = [
    ...(lastMessage.toolResults || []),
    ...(historyMessage.toolResults || []),
  ] as TMessage["toolResults"]
  return true
}

export function shouldSkipChatMessageRuntimeSyntheticToolSummary<TToolCall, TToolResult>(
  historyMessage: ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>,
): boolean {
  return (
    historyMessage.role === "tool" &&
    !hasChatMessageRuntimeEntries(historyMessage.toolResults) &&
    !hasChatMessageRuntimeEntries(historyMessage.toolCalls)
  )
}

export function createChatMessageRuntimeHistoryDisplayMessage<TToolCall, TToolResult>(
  historyMessage: ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>,
  options: ChatMessageRuntimeHistoryDisplayMessageOptions = {},
): ChatMessageRuntimeHistoryDisplayMessage<TToolCall, TToolResult> {
  return {
    ...(options.includeId ? { id: historyMessage.id } : {}),
    role: historyMessage.role === "tool" ? "assistant" : historyMessage.role,
    content: historyMessage.content || "",
    displayContent: historyMessage.displayContent,
    toolCalls: historyMessage.toolCalls,
    toolResults: historyMessage.toolResults,
    branchMessageIndex: historyMessage.branchMessageIndex,
  }
}

export function createChatMessageRuntimeHistoryDisplayMessages<TToolCall, TToolResult>(
  historyMessages: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[],
  {
    includeId = false,
    includeToolMessages = true,
    mergeToolResults = true,
    skipUserMessages = false,
    startIndex = 0,
  }: ChatMessageRuntimeHistoryDisplayMessagesOptions = {},
): ChatMessageRuntimeHistoryDisplayMessage<TToolCall, TToolResult>[] {
  const messages: ChatMessageRuntimeHistoryDisplayMessage<TToolCall, TToolResult>[] = []
  for (let i = startIndex; i < historyMessages.length; i++) {
    const historyMessage = historyMessages[i]
    if (skipUserMessages && historyMessage.role === "user") {
      continue
    }
    if (
      mergeToolResults &&
      mergeChatMessageRuntimeToolResultsIntoLastMessage(messages, historyMessage)
    ) {
      continue
    }
    if (historyMessage.role === "tool" && !includeToolMessages) {
      continue
    }
    if (shouldSkipChatMessageRuntimeSyntheticToolSummary(historyMessage)) {
      continue
    }
    messages.push(createChatMessageRuntimeHistoryDisplayMessage(historyMessage, { includeId }))
  }
  return messages
}

export function createChatMessageRuntimeFinalHistoryTurnMessages<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
>(
  historyMessages: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[],
  options: ChatMessageRuntimeFinalHistoryTurnMessagesOptions = {},
): TMessage[] {
  const {
    userResponse,
    skipUserMessages = true,
    startIndex,
    ...displayOptions
  } = options
  const currentTurnStartIndex =
    startIndex ?? findChatMessageRuntimeLastUserMessageIndex(historyMessages)
  const messages = createChatMessageRuntimeHistoryDisplayMessages(
    historyMessages,
    {
      ...displayOptions,
      skipUserMessages,
      startIndex: currentTurnStartIndex,
    },
  ) as unknown as TMessage[]

  return createChatMessageRuntimeUserResponseMessages(messages, userResponse)
}

export function createChatMessageRuntimeFinalResponseTurnState<
  TMessage extends ChatDisplayMessageLike &
    ChatMessageRuntimeConversationContentUpdateMessage &
    ChatMessageRuntimePendingTurnMessage,
  TToolCall = unknown,
  TToolResult = unknown,
>({
  conversationHistory,
  finalDisplayText,
  historyOptions,
  userResponseText,
}: ChatMessageRuntimeFinalResponseTurnStateInput<
  TToolCall,
  TToolResult
>): ChatMessageRuntimeFinalResponseTurnState<TMessage> {
  if (conversationHistory && conversationHistory.length > 0) {
    const finalTurnMessages = createChatMessageRuntimeFinalHistoryTurnMessages<
      TMessage,
      TToolCall,
      TToolResult
    >(
      conversationHistory,
      {
        ...historyOptions,
        userResponse: userResponseText,
      },
    )

    return {
      kind: "history",
      finalTurnMessages,
      updateMessages: (
        messages,
        messageCountBeforeTurn,
        progressMessages,
      ) => replaceChatMessageRuntimeFinalTurnMessages(
        messages,
        messageCountBeforeTurn,
        finalTurnMessages,
        progressMessages,
      ),
      createCompletedMessages: (
        messages,
        messageCountBeforeTurn,
        userMessage,
      ) => createChatMessageRuntimeCompletedTurnMessages(
        messages,
        messageCountBeforeTurn,
        userMessage,
        finalTurnMessages,
      ),
    }
  }

  if (finalDisplayText) {
    return {
      kind: "text",
      finalDisplayText,
      updateMessages: (messages) => updateLastChatMessageRuntimeConversationContent(messages, finalDisplayText),
      createCompletedMessages: (
        messages,
        messageCountBeforeTurn,
        userMessage,
      ) => createChatMessageRuntimeCompletedTextTurnMessages(
        messages,
        messageCountBeforeTurn,
        userMessage,
        finalDisplayText,
      ),
    }
  }

  return {
    kind: "empty",
  }
}

export function mergeChatMessageRuntimeFinalTurnMessagesWithProgress<
  TMessage extends ChatDisplayMessageLike,
>(
  finalTurnMessages: readonly TMessage[],
  progressMessages: readonly ChatDisplayMessageLike[],
): TMessage[] {
  if (progressMessages.length > 0 && finalTurnMessages.length === 0) {
    return [...progressMessages] as unknown as TMessage[]
  }

  if (progressMessages.length > finalTurnMessages.length && finalTurnMessages.length > 0) {
    const mergedMessages = [...progressMessages] as unknown as TMessage[]
    mergedMessages[mergedMessages.length - 1] = preserveChatMessageRuntimeDisplayContentFromProgress(
      [finalTurnMessages[finalTurnMessages.length - 1]],
      [mergedMessages[mergedMessages.length - 1]],
    )[0]
    return mergedMessages
  }

  return preserveChatMessageRuntimeDisplayContentFromProgress(finalTurnMessages, progressMessages)
}

export function createChatMessageRuntimeRecoveredHistoryMessages<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
>(
  historyMessages: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[],
): TMessage[] {
  return createChatMessageRuntimeHistoryDisplayMessages(
    historyMessages,
    {
      includeId: true,
      includeToolMessages: false,
    },
  ) as unknown as TMessage[]
}

export function createChatMessageRuntimeRecoverableHistoryMessages<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
>(
  historyMessages: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[],
): TMessage[] | null {
  const lastUserMessageIndex = findChatMessageRuntimeLastUserMessageIndex(historyMessages, -1)
  const hasAssistantResponse = hasChatMessageRuntimeAssistantContentAfter(
    historyMessages,
    lastUserMessageIndex,
  )

  if (!hasAssistantResponse) {
    return null
  }

  return createChatMessageRuntimeRecoveredHistoryMessages<TMessage, TToolCall, TToolResult>(
    historyMessages,
  )
}

export function hasChatMessageRuntimeRequestSessionChanged({
  currentSessionId,
  requestSessionId,
}: ChatMessageRuntimeRequestSessionChangedInput): boolean {
  return currentSessionId !== requestSessionId
}

export function isChatMessageRuntimeLatestSessionRequest({
  requestSessionId,
  requestId,
  latestRequestId,
}: ChatMessageRuntimeLatestSessionRequestInput): boolean {
  return requestSessionId ? latestRequestId === requestId : true
}

export function isChatMessageRuntimeActiveRequest({
  requestId,
  activeRequestId,
}: ChatMessageRuntimeActiveRequestInput): boolean {
  return activeRequestId === requestId
}

export function formatChatRuntimeWebConfirmMessage(title: string, message: string): string {
  return `${title}\n\n${message}`
}

export function getChatRuntimeCopyState(): typeof CHAT_RUNTIME_PRESENTATION {
  return CHAT_RUNTIME_PRESENTATION
}

export function formatChatRuntimeModelPickerTitle(providerLabel: string, modelId: string): string {
  return `${CHAT_RUNTIME_PRESENTATION.modelControls.model.changeAccessibilityLabel} (${providerLabel}/${modelId})`
}

export function formatChatRuntimeThinkingPickerTitle(currentLabel: string): string {
  return `${CHAT_RUNTIME_PRESENTATION.modelControls.thinking.titlePrefix} (${currentLabel})`
}

export function formatChatRuntimeVerbosityPickerTitle(currentLabel: string): string {
  return `${CHAT_RUNTIME_PRESENTATION.modelControls.verbosity.titlePrefix} (${currentLabel})`
}

export function formatChatRuntimeAgentSelectorLabel(agentLabel: string): string {
  return `${agentLabel} ${CHAT_RUNTIME_PRESENTATION.header.agentSelectorDropdownGlyph}`
}

export interface ChatRuntimePrimaryAgentLabelInput {
  agentTitle?: string | null
  agentName?: string | null
  profileName?: string | null
}

function normalizeChatRuntimeAgentLabelCandidate(value?: string | null): string {
  return typeof value === "string" ? value.trim() : ""
}

export function getChatRuntimePrimaryAgentLabel({
  agentTitle,
  agentName,
  profileName,
}: ChatRuntimePrimaryAgentLabelInput): string {
  return (
    normalizeChatRuntimeAgentLabelCandidate(agentTitle) ||
    normalizeChatRuntimeAgentLabelCandidate(agentName) ||
    normalizeChatRuntimeAgentLabelCandidate(profileName) ||
    CHAT_RUNTIME_PRESENTATION.header.defaultAgentLabel
  )
}

export function getChatRuntimeCurrentAgentLabel(agentName?: string | null): string {
  return getChatRuntimePrimaryAgentLabel({ agentName })
}

export function formatChatRuntimeAgentSelectorAccessibilityLabel(agentLabel: string): string {
  return `Current agent: ${agentLabel}. Tap to change.`
}

export function getChatRuntimeAgentSelectorAccessibilityHint(): string {
  return CHAT_RUNTIME_PRESENTATION.header.agentSelectorAccessibilityHint
}

export function getChatRuntimeBackAccessibilityLabel(): string {
  return CHAT_RUNTIME_PRESENTATION.header.backToHistoryAccessibilityLabel
}

export function getChatRuntimeBackAccessibilityHint(): string {
  return CHAT_RUNTIME_PRESENTATION.header.backToHistoryAccessibilityHint
}

export function getChatRuntimeKillSwitchAccessibilityLabel(): string {
  return CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityLabel
}

export function getChatRuntimeKillSwitchAccessibilityHint(): string {
  return CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityHint
}

export function getChatRuntimeKillSwitchMobileAlertState(): ChatRuntimeKillSwitchMobileAlertState {
  return {
    confirmation: {
      title: CHAT_RUNTIME_PRESENTATION.killSwitch.title,
      message: CHAT_RUNTIME_PRESENTATION.killSwitch.message,
      confirmLabel: CHAT_RUNTIME_PRESENTATION.killSwitch.actionLabel,
      cancelLabel: CHAT_RUNTIME_PRESENTATION.common.cancel,
    },
    success: {
      title: CHAT_RUNTIME_PRESENTATION.common.successTitle,
      fallbackMessage: CHAT_RUNTIME_PRESENTATION.killSwitch.successFallback,
    },
    failed: {
      title: CHAT_RUNTIME_PRESENTATION.common.errorTitle,
      fallbackMessage: CHAT_RUNTIME_PRESENTATION.killSwitch.stopFailed,
    },
    connectionFailed: {
      title: CHAT_RUNTIME_PRESENTATION.common.errorTitle,
      fallbackMessage: CHAT_RUNTIME_PRESENTATION.killSwitch.connectionFailed,
    },
  }
}

export function getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState(
  alerts: ChatRuntimeKillSwitchMobileAlertState = getChatRuntimeKillSwitchMobileAlertState(),
): ChatRuntimeKillSwitchConfirmationAlertState {
  return {
    title: alerts.confirmation.title,
    message: alerts.confirmation.message,
    confirmLabel: alerts.confirmation.confirmLabel,
    cancelLabel: alerts.confirmation.cancelLabel,
    webMessage: formatChatRuntimeWebConfirmMessage(
      alerts.confirmation.title,
      alerts.confirmation.message,
    ),
  }
}

export function getChatRuntimeKillSwitchResultMobileResolvedAlertState(
  result: ChatRuntimeKillSwitchResultLike,
  alerts: ChatRuntimeKillSwitchMobileAlertState = getChatRuntimeKillSwitchMobileAlertState(),
): ChatRuntimeKillSwitchResolvedAlertState {
  const alertState = result.success ? alerts.success : alerts.failed
  const message = getChatRuntimeAlertMessage(
    result.success ? result.message : result.error,
    alertState.fallbackMessage,
  )

  return {
    title: alertState.title,
    message,
    webMessage: result.success ? message : `${alertState.title}: ${message}`,
  }
}

export function getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState(
  error: unknown,
  alerts: ChatRuntimeKillSwitchMobileAlertState = getChatRuntimeKillSwitchMobileAlertState(),
): ChatRuntimeKillSwitchResolvedAlertState {
  const message = getChatRuntimeAlertMessage(error, alerts.connectionFailed.fallbackMessage)

  return {
    title: alerts.connectionFailed.title,
    message,
    webMessage: `${alerts.connectionFailed.title}: ${message}`,
  }
}

export function getChatRuntimeHandsFreeAccessibilityLabel(): string {
  return createSwitchAccessibilityLabel(CHAT_RUNTIME_PRESENTATION.header.handsFreeLabel)
}

export function getChatRuntimeHandsFreeAccessibilityHint(): string {
  return CHAT_RUNTIME_PRESENTATION.header.handsFreeAccessibilityHint
}

export function getChatComposerVoiceOverlayLabel({
  handsFree,
  willCancel,
}: {
  handsFree: boolean
  willCancel: boolean
}): string {
  if (handsFree) return CHAT_COMPOSER_PRESENTATION.voiceOverlay.listeningLabel
  return willCancel
    ? CHAT_COMPOSER_PRESENTATION.voiceOverlay.releaseToEditLabel
    : CHAT_COMPOSER_PRESENTATION.voiceOverlay.releaseToSendLabel
}

export function getChatComposerRuntimeDraftMessageState({
  input = "",
  pendingImages = [],
}: ChatComposerRuntimeDraftMessageStateInput): ChatComposerRuntimeDraftMessageState {
  const content = buildChatImageAttachmentMessage(input ?? "", pendingImages)
  return {
    content,
    hasContent: content.trim().length > 0,
  }
}

export function mergeChatComposerRuntimeVoiceText(
  currentText?: string | null,
  finalizedText?: string | null,
): string {
  return mergeVoiceText(currentText, finalizedText)
}

export function resolveChatRuntimeMobileFontFamily(
  fontFamilyByPlatform: ChatRuntimeMobileFontFamilyByPlatform,
  platform: ChatRuntimeMobileFontPlatform,
): string {
  return platform === "ios" ? fontFamilyByPlatform.ios : fontFamilyByPlatform.default
}

export function createChatComposerRuntimeImagePickerLaunchOptions<TMediaTypes>({
  mediaTypes,
  selectionLimit,
}: ChatComposerRuntimeImagePickerLaunchOptionsInput<TMediaTypes>): ChatComposerRuntimeImagePickerLaunchOptions<TMediaTypes> {
  return {
    mediaTypes,
    allowsMultipleSelection: true,
    selectionLimit,
    quality: 0.8,
    base64: true,
  }
}

export function getChatComposerRuntimeImageDataUrlBytes(dataUrl: string): number {
  return getDataImageBytesFromUrl(dataUrl) ?? 0
}

export function getChatComposerRuntimeBase64ImageBytes(rawBase64: string): number {
  return getDecodedBase64ByteLength(rawBase64)
}

export function inferChatComposerRuntimeImageMimeType(source: ImageMimeTypeSource): string | null {
  return inferImageMimeTypeFromSource(source)
}

export function createChatRuntimeThemeSpinnerSource<TSpinnerSource>({
  isDark,
  darkSource,
  lightSource,
}: ChatRuntimeThemeSpinnerSourceInput<TSpinnerSource>): TSpinnerSource {
  return isDark ? darkSource : lightSource
}

export function getChatComposerMobileVisibilityRenderState({
  handsFree = false,
  listening = false,
  messageQueueEnabled = false,
}: ChatComposerMobileVisibilityRenderStateInput = {}): ChatComposerMobileVisibilityRenderState {
  return {
    voiceOverlay: {
      isVisible: listening,
    },
    handsFreeControls: {
      isVisible: handsFree,
    },
    editBeforeSendControl: {
      shouldRender: !handsFree,
    },
    queueAction: {
      shouldRender: handsFree && messageQueueEnabled,
    },
    micButton: {
      shouldUsePushToTalk: !handsFree,
      shouldUseHandsFreePrimaryControl: handsFree,
    },
  }
}

export function getChatComposerMobileActionAvailabilityRenderState({
  hasContent = false,
  handsFree = false,
  presentation,
}: ChatComposerMobileActionAvailabilityRenderStateInput = {}): ChatComposerMobileActionAvailabilityRenderState {
  const lacksContent = !hasContent
  return {
    queueAction: {
      isDisabled: lacksContent,
    },
    submitAction: {
      isDisabled: lacksContent || (!handsFree && presentation?.isDisabled === true),
    },
  }
}

export function getChatComposerCopyState(): typeof CHAT_COMPOSER_PRESENTATION {
  return CHAT_COMPOSER_PRESENTATION
}

export function getChatComposerDesktopSurfaceState(): typeof CHAT_COMPOSER_SURFACE_PRESENTATION.desktop {
  return CHAT_COMPOSER_SURFACE_PRESENTATION.desktop
}

export function getChatComposerMobileSurfaceState() {
  return CHAT_COMPOSER_SURFACE_PRESENTATION.mobile
}

function getChatComposerAccessoryMobileIconColorToken(isActive: boolean) {
  return isActive
    ? CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.activeIconColorToken
    : CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.inactiveIconColorToken
}

export function getChatComposerImageAttachmentMobileIconState(hasImages: boolean): ChatComposerMobileIconState {
  return {
    isActive: hasImages,
    name: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.name,
    size: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.size,
    colorToken: getChatComposerAccessoryMobileIconColorToken(hasImages),
  }
}

export function getChatComposerImageAttachmentMobileRenderState({
  hasImages = false,
  colors,
}: ChatComposerImageAttachmentMobileRenderStateInput): ChatComposerImageAttachmentMobileRenderState {
  const control = getChatComposerMobileControlState().imageAttachment
  const icon = getChatComposerImageAttachmentMobileIconState(hasImages)
  const iconColors = getChatComposerMobileIconColors(icon, colors)

  return {
    isActive: icon.isActive === true,
    accessibilityRole: control.accessibilityRole,
    accessibilityLabel: control.accessibilityLabel,
    accessibilityHint: control.accessibilityHint,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.icon.color,
    },
  }
}

export function getChatComposerTextToSpeechMobileIconState(isEnabled: boolean): ChatComposerMobileIconState {
  return {
    isActive: isEnabled,
    name: isEnabled
      ? CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.enabledName
      : CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.disabledName,
    size: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.size,
    colorToken: getChatComposerAccessoryMobileIconColorToken(isEnabled),
  }
}

export function getChatComposerTextToSpeechMobileRenderState({
  isEnabled = false,
  colors,
}: ChatComposerTextToSpeechMobileRenderStateInput): ChatComposerTextToSpeechMobileRenderState {
  const control = getChatComposerMobileControlState({ textToSpeechEnabled: isEnabled }).textToSpeech
  const icon = getChatComposerTextToSpeechMobileIconState(isEnabled)
  const iconColors = getChatComposerMobileIconColors(icon, colors)

  return {
    isActive: icon.isActive === true,
    accessibilityRole: control.accessibilityRole,
    accessibilityLabel: control.accessibilityLabel,
    accessibilityHint: control.accessibilityHint,
    accessibilityState: control.accessibilityState,
    ariaChecked: control.ariaChecked,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.icon.color,
    },
  }
}

export function getChatComposerEditBeforeSendMobileIconState(willCancel: boolean): ChatComposerMobileIconState {
  return {
    isActive: willCancel,
    name: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.name,
    size: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.size,
    colorToken: getChatComposerAccessoryMobileIconColorToken(willCancel),
  }
}

export function getChatComposerEditBeforeSendMobileRenderState({
  isEnabled = false,
  colors,
}: ChatComposerEditBeforeSendMobileRenderStateInput): ChatComposerEditBeforeSendMobileRenderState {
  const control = getChatComposerMobileControlState({ editBeforeSendEnabled: isEnabled }).editBeforeSend
  const icon = getChatComposerEditBeforeSendMobileIconState(isEnabled)
  const iconColors = getChatComposerMobileIconColors(icon, colors)

  return {
    isActive: icon.isActive === true,
    accessibilityRole: control.accessibilityRole,
    accessibilityLabel: control.accessibilityLabel,
    accessibilityHint: control.accessibilityHint,
    accessibilityState: control.accessibilityState,
    ariaChecked: control.ariaChecked,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.icon.color,
    },
  }
}

export function getChatComposerSubmitMobileIconState(
  input: ChatComposerSubmitMobileIconStateInput,
): ChatComposerMobileIconState {
  const isQueueMode = input.isHandsFree !== true && input.mode === "queue"
  return {
    isQueueMode,
    name: isQueueMode
      ? CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name
      : CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.name,
    size: isQueueMode
      ? CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size
      : CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.size,
    colorToken: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.foregroundColorToken,
  }
}

export function getChatComposerSubmitMobileActionState(
  input: ChatComposerSubmitMobileActionStateInput,
): ChatComposerSubmitMobileActionState {
  const isHandsFree = input.isHandsFree === true
  const isQueueMode = !isHandsFree && input.presentation.mode === "queue"
  const isDisabled = input.isDisabled === true
  const accessibilityLabel = isHandsFree
    ? CHAT_COMPOSER_PRESENTATION.submit.handsFreeAccessibilityLabel
    : input.presentation.submitAriaLabel

  return {
    isQueueMode,
    isDisabled,
    label: isQueueMode
      ? CHAT_COMPOSER_PRESENTATION.queue.label
      : CHAT_COMPOSER_PRESENTATION.submit.sendLabel,
    accessibilityRole: "button",
    accessibilityLabel: createButtonAccessibilityLabel(accessibilityLabel),
    accessibilityHint: isHandsFree
      ? CHAT_COMPOSER_PRESENTATION.submit.handsFreeAccessibilityHint
      : input.presentation.submitHint,
    accessibilityState: { disabled: isDisabled },
  }
}

export function getChatComposerSubmitMobileRenderState(
  input: ChatComposerSubmitMobileRenderStateInput,
): ChatComposerSubmitMobileRenderState {
  const action = getChatComposerSubmitMobileActionState(input)
  const icon = getChatComposerSubmitMobileIconState({
    mode: input.presentation.mode,
    isHandsFree: input.isHandsFree,
  })
  const iconColors = getChatComposerMobileIconColors(icon, input.colors)

  return {
    ...action,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.icon.color,
    },
  }
}

export function getChatComposerQueueMobileIconState(): ChatComposerMobileIconState {
  return {
    name: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name,
    size: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size,
    colorToken: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.iconColorToken,
  }
}

export function getChatComposerQueueMobileActionState(
  input: ChatComposerQueueMobileActionStateInput = {},
): ChatComposerQueueMobileActionState {
  const isDisabled = input.isDisabled === true
  return {
    isDisabled,
    label: CHAT_COMPOSER_PRESENTATION.queue.label,
    accessibilityRole: "button",
    accessibilityLabel: createButtonAccessibilityLabel(CHAT_COMPOSER_PRESENTATION.queue.accessibilityLabel),
    accessibilityHint: CHAT_COMPOSER_PRESENTATION.queue.accessibilityHint,
    accessibilityState: { disabled: isDisabled },
    debugMessage: CHAT_COMPOSER_PRESENTATION.queue.debugMessage,
  }
}

export function getChatComposerQueueMobileRenderState(
  input: ChatComposerQueueMobileRenderStateInput,
): ChatComposerQueueMobileRenderState {
  const action = getChatComposerQueueMobileActionState(input)
  const icon = getChatComposerQueueMobileIconState()
  const iconColors = getChatComposerMobileIconColors(icon, input.colors)

  return {
    ...action,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.icon.color,
    },
  }
}

export function getChatComposerMicMobileActionState({
  label,
  handsFree,
  listening,
  willCancel,
}: ChatComposerMicMobileActionStateInput): ChatComposerMicMobileActionState {
  return {
    label,
    accessibilityRole: "button",
    accessibilityLabel: createMicControlAccessibilityLabel(),
    accessibilityHint: createMicControlAccessibilityHint({
      handsFree,
      listening,
      willCancel,
    }),
    accessibilityState: {
      busy: listening,
    },
    ariaBusy: listening,
    labelSelectable: false,
  }
}

export function getChatComposerMobileControlState(
  input: ChatComposerMobileControlStateInput = {},
): ChatComposerMobileControlState {
  const textToSpeechChecked = input.textToSpeechEnabled === true
  const editBeforeSendChecked = input.editBeforeSendEnabled === true
  return {
    sttPreview: {
      label: CHAT_COMPOSER_PRESENTATION.sttPreview.label,
    },
    imageAttachment: {
      accessibilityRole: "button",
      accessibilityLabel: createButtonAccessibilityLabel(CHAT_COMPOSER_PRESENTATION.imageAttachment.accessibilityLabel),
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.imageAttachment.accessibilityHint,
    },
    textToSpeech: {
      accessibilityRole: "switch",
      accessibilityLabel: createSwitchAccessibilityLabel(CHAT_COMPOSER_PRESENTATION.textToSpeech.label),
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.textToSpeech.accessibilityHint,
      accessibilityState: { checked: textToSpeechChecked },
      ariaChecked: textToSpeechChecked,
    },
    editBeforeSend: {
      accessibilityRole: "switch",
      accessibilityLabel: createSwitchAccessibilityLabel(CHAT_COMPOSER_PRESENTATION.editBeforeSend.accessibilityLabel),
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.editBeforeSend.accessibilityHint,
      accessibilityState: { checked: editBeforeSendChecked },
      ariaChecked: editBeforeSendChecked,
    },
    field: {
      accessibilityLabel: createTextInputAccessibilityLabel(CHAT_COMPOSER_PRESENTATION.field.accessibilityLabel),
    },
  }
}

export function getChatComposerMobileIconColors(
  icon: Pick<ChatComposerMobileIconState, "colorToken">,
  colors: ChatComposerMobileIconColorPalette,
): ChatComposerMobileIconColors {
  return {
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatComposerMobileTextColors(
  colors: ChatComposerMobileTextColorPalette,
): ChatComposerMobileTextColors {
  const surface = CHAT_COMPOSER_SURFACE_PRESENTATION.mobile
  return {
    sttPreview: {
      labelColor: colors[surface.sttPreview.labelColorToken],
      textColor: colors[surface.sttPreview.textColorToken],
    },
    input: {
      color: colors[surface.input.textColorToken],
      placeholderColor: colors[surface.input.placeholderColorToken],
    },
    queueButton: {
      color: colors[surface.queueButton.textColorToken],
    },
    submitButton: {
      color: colors[surface.submitButton.foregroundColorToken],
    },
    micButton: {
      color: colors[surface.micButton.inactiveForegroundColorToken],
      activeColor: colors[surface.micButton.activeForegroundColorToken],
    },
    voiceOverlay: {
      color: colors[surface.voiceOverlay.textColorToken],
    },
  }
}

export function getChatComposerMobileSurfaceColors(
  colors: ChatComposerMobileSurfaceColorPalette,
): ChatComposerMobileSurfaceColors {
  const surface = CHAT_COMPOSER_SURFACE_PRESENTATION.mobile
  return {
    inputArea: {
      borderColor: colors[surface.inputArea.borderColorToken],
      backgroundColor: colors[surface.inputArea.backgroundColorToken],
    },
    input: {
      borderColor: colors[surface.input.borderColorToken],
      backgroundColor: colors[surface.input.backgroundColorToken],
    },
    sttPreview: {
      borderColor: colors[surface.sttPreview.borderColorToken],
      backgroundColor: colors[surface.sttPreview.backgroundColorToken],
    },
    accessoryButton: {
      borderColor: colors[surface.accessoryButton.borderColorToken],
      backgroundColor: colors[surface.accessoryButton.backgroundColorToken],
      activeBorderColor: colors[surface.accessoryButton.activeBorderColorToken],
      activeBackgroundColor: colors[surface.accessoryButton.activeBackgroundColorToken],
    },
    submitButton: {
      backgroundColor: colors[surface.submitButton.backgroundColorToken],
    },
    queueButton: {
      borderColor: colors[surface.queueButton.borderColorToken],
      backgroundColor: colors[surface.queueButton.backgroundColorToken],
    },
    micButton: {
      borderColor: colors[surface.micButton.borderColorToken],
      backgroundColor: colors[surface.micButton.backgroundColorToken],
      activeBorderColor: colors[surface.micButton.activeBorderColorToken],
      activeBackgroundColor: colors[surface.micButton.activeBackgroundColorToken],
    },
    voiceOverlay: {
      cardBackgroundColor: hexToRgba(
        colors[surface.voiceOverlay.cardBackgroundColorToken],
        surface.voiceOverlay.cardBackgroundAlpha,
      ),
    },
  }
}

export function getChatComposerMobileSurfaceRenderState({
  colors,
  platform,
}: ChatComposerMobileSurfaceRenderStateInput): ChatComposerMobileSurfaceRenderState {
  return {
    surface: getChatComposerMobileSurfaceState(),
    input: getChatComposerMobileTextInputPlatformState(platform),
    colors: {
      surface: getChatComposerMobileSurfaceColors(colors),
      text: getChatComposerMobileTextColors(colors),
    },
  }
}

export function createChatComposerMobileStyleSlots({
  renderState,
  spacing,
  radius,
  borderWidths,
}: ChatComposerMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors.surface
  const textColors = renderState.colors.text

  return {
    inputArea: {
      borderTopWidth: borderWidths[surface.inputArea.borderTopWidthToken],
      borderColor: colors.inputArea.borderColor,
      backgroundColor: colors.inputArea.backgroundColor,
    },
    sttPreviewBox: {
      marginHorizontal: spacing[surface.sttPreview.marginHorizontal],
      marginTop: spacing[surface.sttPreview.marginTop],
      borderWidth: surface.sttPreview.borderWidth,
      borderColor: colors.sttPreview.borderColor,
      backgroundColor: colors.sttPreview.backgroundColor,
      borderRadius: radius[surface.sttPreview.borderRadius],
      paddingHorizontal: spacing[surface.sttPreview.paddingHorizontal],
      paddingVertical: spacing[surface.sttPreview.paddingVertical],
    },
    sttPreviewLabel: {
      color: textColors.sttPreview.labelColor,
      marginBottom: surface.sttPreview.labelMarginBottom,
      fontSize: surface.sttPreview.labelFontSize,
      lineHeight: surface.sttPreview.labelLineHeight,
      fontWeight: surface.sttPreview.labelFontWeight,
    },
    sttPreviewText: {
      color: textColors.sttPreview.textColor,
      fontSize: surface.sttPreview.textFontSize,
      lineHeight: surface.sttPreview.textLineHeight,
    },
    inputRow: {
      flexDirection: surface.inputRow.flexDirection,
      alignItems: surface.inputRow.alignItems,
      gap: spacing[surface.inputRow.gap],
      paddingHorizontal: spacing[surface.inputRow.paddingHorizontal],
      paddingVertical: spacing[surface.inputRow.paddingVertical],
    },
    input: {
      borderWidth: surface.input.borderWidth,
      borderColor: colors.input.borderColor,
      borderRadius: radius[surface.input.borderRadius],
      paddingHorizontal: spacing[surface.input.paddingHorizontal],
      paddingVertical: renderState.input.paddingVertical,
      backgroundColor: colors.input.backgroundColor,
      color: textColors.input.color,
      fontSize: surface.input.fontSize,
      flex: surface.input.flex,
      maxHeight: surface.input.maxHeight,
    },
    visuallyHiddenComposerHint: {
      position: surface.visuallyHiddenComposerHint.position,
      left: surface.visuallyHiddenComposerHint.left,
      width: surface.visuallyHiddenComposerHint.width,
      height: surface.visuallyHiddenComposerHint.height,
    },
    micWrapper: {
      paddingHorizontal: spacing[surface.inputArea.micWrapperPaddingHorizontal],
      paddingBottom: spacing[surface.inputArea.micWrapperPaddingBottom],
    },
    mic: {
      width: surface.micButton.width,
      height: surface.micButton.height,
      flexDirection: surface.micButton.flexDirection,
      borderRadius: radius[surface.micButton.borderRadius],
      borderWidth: surface.micButton.borderWidth,
      borderColor: colors.micButton.borderColor,
      backgroundColor: colors.micButton.backgroundColor,
      alignItems: surface.micButton.alignItems,
      justifyContent: surface.micButton.justifyContent,
      gap: spacing[surface.micButton.gap],
    },
    micOn: {
      backgroundColor: colors.micButton.activeBackgroundColor,
      borderColor: colors.micButton.activeBorderColor,
    },
    micLabel: {
      fontSize: surface.micButton.labelFontSize,
      color: textColors.micButton.color,
      fontWeight: surface.micButton.labelFontWeight,
    },
    micLabelOn: {
      color: textColors.micButton.activeColor,
    },
    accessoryButton: {
      width: surface.accessoryButton.size,
      height: surface.accessoryButton.size,
      borderRadius: surface.accessoryButton.borderRadius,
      borderWidth: surface.accessoryButton.borderWidth,
      borderColor: colors.accessoryButton.borderColor,
      backgroundColor: colors.accessoryButton.backgroundColor,
      alignItems: surface.accessoryButton.alignItems,
      justifyContent: surface.accessoryButton.justifyContent,
    },
    accessoryButtonActive: {
      backgroundColor: colors.accessoryButton.activeBackgroundColor,
      borderColor: colors.accessoryButton.activeBorderColor,
    },
    submitButton: {
      backgroundColor: colors.submitButton.backgroundColor,
      minHeight: surface.submitButton.minHeight,
      minWidth: surface.submitButton.minWidth,
      paddingHorizontal: spacing[surface.submitButton.paddingHorizontal],
      paddingVertical: spacing[surface.submitButton.paddingVertical],
      borderRadius: radius[surface.submitButton.borderRadius],
      flexDirection: surface.submitButton.flexDirection,
      alignItems: surface.submitButton.alignItems,
      justifyContent: surface.submitButton.justifyContent,
      gap: surface.submitButton.gap,
    },
    queueButton: {
      borderWidth: surface.queueButton.borderWidth,
      borderColor: colors.queueButton.borderColor,
      backgroundColor: colors.queueButton.backgroundColor,
      minHeight: surface.submitButton.minHeight,
      minWidth: surface.submitButton.minWidth,
      paddingHorizontal: spacing[surface.submitButton.paddingHorizontal],
      paddingVertical: spacing[surface.submitButton.paddingVertical],
      borderRadius: radius[surface.submitButton.borderRadius],
      flexDirection: surface.submitButton.flexDirection,
      alignItems: surface.submitButton.alignItems,
      justifyContent: surface.submitButton.justifyContent,
      gap: surface.submitButton.gap,
    },
    submitButtonDisabled: {
      opacity: surface.submitButton.disabledOpacity,
    },
    queueButtonText: {
      color: textColors.queueButton.color,
      fontWeight: surface.submitButton.fontWeight,
      fontSize: surface.submitButton.fontSize,
    },
    submitButtonText: {
      color: textColors.submitButton.color,
      fontWeight: surface.submitButton.fontWeight,
      fontSize: surface.submitButton.fontSize,
    },
    overlay: {
      position: surface.voiceOverlay.position,
      left: surface.voiceOverlay.left,
      right: surface.voiceOverlay.right,
      bottom: surface.voiceOverlay.bottomOffset,
      zIndex: surface.voiceOverlay.zIndex,
      elevation: surface.voiceOverlay.elevation,
      alignItems: surface.voiceOverlay.alignItems,
      paddingHorizontal: spacing[surface.voiceOverlay.paddingHorizontal],
      paddingBottom: spacing[surface.voiceOverlay.paddingBottom],
    },
    overlayCard: {
      maxWidth: surface.voiceOverlay.cardMaxWidth,
      borderRadius: radius[surface.voiceOverlay.cardBorderRadius],
      backgroundColor: colors.voiceOverlay.cardBackgroundColor,
      paddingHorizontal: surface.voiceOverlay.cardPaddingHorizontal,
      paddingVertical: surface.voiceOverlay.cardPaddingVertical,
    },
    overlayText: {
      color: textColors.voiceOverlay.color,
      fontSize: surface.voiceOverlay.textFontSize,
      lineHeight: surface.voiceOverlay.textLineHeight,
      textAlign: surface.voiceOverlay.textAlign,
    },
    overlayTranscript: {
      color: textColors.voiceOverlay.color,
      marginTop: surface.voiceOverlay.transcriptMarginTop,
      fontSize: surface.voiceOverlay.transcriptFontSize,
      lineHeight: surface.voiceOverlay.transcriptLineHeight,
      opacity: surface.voiceOverlay.transcriptOpacity,
    },
  }
}

export function createChatConversationHomePromptLibraryMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatConversationHomePromptLibraryMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    chatHomeCard: {
      marginHorizontal: spacing[surface.quickStartCard.marginHorizontal],
      marginTop: spacing[surface.quickStartCard.marginTop],
      padding: spacing[surface.quickStartCard.padding],
      borderRadius: radius[surface.quickStartCard.borderRadius],
      borderWidth: surface.quickStartCard.borderWidth,
      borderColor: colors.quickStartCard.borderColor,
      backgroundColor: colors.quickStartCard.backgroundColor,
      gap: spacing[surface.quickStartCard.gap],
    },
    chatHomeEmptyText: {
      color: colors.emptyText.color,
      fontSize: surface.emptyText.fontSize,
      lineHeight: surface.emptyText.lineHeight,
      textAlign: surface.emptyText.textAlign,
      paddingVertical: spacing[surface.emptyText.paddingVertical],
    },
    chatHomeShortcutGrid: {
      flexDirection: surface.shortcutGrid.flexDirection,
      flexWrap: surface.shortcutGrid.flexWrap,
      gap: spacing[surface.shortcutGrid.gap],
    },
    chatHomeShortcutCard: {
      minHeight: surface.shortcutCard.minHeight,
      minWidth: surface.shortcutCard.minWidth,
      flexGrow: surface.shortcutCard.flexGrow,
      flexBasis: surface.shortcutCard.flexBasis,
      paddingHorizontal: spacing[surface.shortcutCard.paddingHorizontal],
      paddingVertical: spacing[surface.shortcutCard.paddingVertical],
      borderRadius: radius[surface.shortcutCard.borderRadius],
      borderWidth: surface.shortcutCard.borderWidth,
      borderColor: colors.shortcutCard.borderColor,
      backgroundColor: colors.shortcutCard.backgroundColor,
      justifyContent: surface.shortcutCard.justifyContent,
      gap: spacing[surface.shortcutCard.gap],
    },
    chatHomeShortcutCardAdd: {
      borderStyle: surface.addShortcutCard.borderStyle,
      borderColor: colors.addShortcutCard.borderColor,
      backgroundColor: colors.addShortcutCard.backgroundColor,
      alignItems: surface.addShortcutCard.alignItems,
    },
    chatHomeShortcutAddIcon: {
      marginBottom: surface.addShortcutIcon.marginBottom,
    },
    chatHomeShortcutCardDisabled: {
      opacity: surface.shortcutCard.disabledOpacity,
    },
    chatHomeShortcutCardPressed: {
      opacity: surface.shortcutCard.pressedOpacity,
      transform: [{ scale: surface.shortcutCard.pressedScale }],
    },
    chatHomeShortcutSourcePill: {
      alignSelf: surface.shortcutSourcePill.alignSelf,
      flexDirection: surface.shortcutSourcePill.flexDirection,
      alignItems: surface.shortcutSourcePill.alignItems,
      gap: spacing[surface.shortcutSourcePill.gap],
      paddingHorizontal: spacing[surface.shortcutSourcePill.paddingHorizontal],
      paddingVertical: surface.shortcutSourcePill.paddingVertical,
      borderRadius: radius[surface.shortcutSourcePill.borderRadius],
      backgroundColor: colors.shortcutSourcePill.backgroundColor,
    },
    chatHomeShortcutSourceLabel: {
      color: colors.shortcutSourceLabel.color,
      fontSize: surface.shortcutSourceLabel.fontSize,
      fontWeight: surface.shortcutSourceLabel.fontWeight,
      letterSpacing: surface.shortcutSourceLabel.letterSpacing,
      textTransform: surface.shortcutSourceLabel.textTransform,
    },
    chatHomeShortcutTitle: {
      color: colors.shortcutTitle.color,
      fontSize: surface.shortcutTitle.fontSize,
      lineHeight: surface.shortcutTitle.lineHeight,
      fontWeight: surface.shortcutTitle.fontWeight,
    },
    chatHomeShortcutTitleAdd: {
      color: colors.addShortcutCard.titleColor,
      textAlign: surface.addShortcutCard.titleTextAlign,
    },
    chatHomeShortcutDescription: {
      color: colors.shortcutDescription.color,
      fontSize: surface.shortcutDescription.fontSize,
      marginTop: surface.shortcutDescription.marginTop,
      lineHeight: surface.shortcutDescription.lineHeight,
    },
    chatHomeShortcutActions: {
      flexDirection: surface.shortcutActions.flexDirection,
      flexWrap: surface.shortcutActions.flexWrap,
      gap: spacing[surface.shortcutActions.gap],
      marginTop: spacing[surface.shortcutActions.marginTop],
    },
    chatHomeShortcutActionButton: {
      minHeight: surface.shortcutActionButton.minHeight,
      paddingHorizontal: spacing[surface.shortcutActionButton.paddingHorizontal],
      paddingVertical: surface.shortcutActionButton.paddingVertical,
      borderRadius: radius[surface.shortcutActionButton.borderRadius],
      borderWidth: surface.shortcutActionButton.borderWidth,
      borderColor: colors.shortcutActionButton.borderColor,
      backgroundColor: colors.shortcutActionButton.backgroundColor,
      flexDirection: surface.shortcutActionButton.flexDirection,
      alignItems: surface.shortcutActionButton.alignItems,
      justifyContent: surface.shortcutActionButton.justifyContent,
      gap: spacing[surface.shortcutActionButton.gap],
    },
    chatHomeShortcutActionButtonPressed: {
      opacity: surface.shortcutActionButton.pressedOpacity,
    },
    chatHomeShortcutActionText: {
      color: colors.shortcutActionText.color,
      fontSize: surface.shortcutActionText.fontSize,
      lineHeight: surface.shortcutActionText.lineHeight,
      fontWeight: surface.shortcutActionText.fontWeight,
    },
    chatHomeShortcutActionDangerText: {
      color: colors.shortcutActionText.destructiveColor,
    },
  }
}

export function createChatConversationHomePromptEditorMobileStyleSlots({
  renderState,
  inputPaddingVertical,
  spacing,
  radius,
}: ChatConversationHomePromptEditorMobileStyleSlotsInput) {
  const surface = renderState.surface.editorModal
  const colors = renderState.colors.editorModal

  return {
    modalKeyboardAvoidingView: {
      flex: surface.keyboardAvoidingView.flex,
    },
    modalOverlay: {
      flex: surface.overlay.flex,
      backgroundColor: colors.overlay.backgroundColor,
      justifyContent: surface.overlay.justifyContent,
      padding: spacing[surface.overlay.padding],
    },
    modalContent: {
      backgroundColor: colors.content.backgroundColor,
      borderRadius: radius[surface.content.borderRadius],
      padding: spacing[surface.content.padding],
      borderWidth: surface.content.borderWidth,
      borderColor: colors.content.borderColor,
    },
    modalHeader: {
      flexDirection: surface.header.flexDirection,
      alignItems: surface.header.alignItems,
      justifyContent: surface.header.justifyContent,
      gap: spacing[surface.header.gap],
      marginBottom: spacing[surface.header.marginBottom],
    },
    modalTitle: {
      flex: surface.title.flex,
      fontSize: surface.title.fontSize,
      lineHeight: surface.title.lineHeight,
      fontWeight: surface.title.fontWeight,
      marginBottom: surface.title.marginBottom,
      color: colors.title.color,
    },
    modalCloseButton: {
      width: surface.closeButton.width,
      height: surface.closeButton.height,
      borderRadius: radius[surface.closeButton.borderRadius],
      alignItems: surface.closeButton.alignItems,
      justifyContent: surface.closeButton.justifyContent,
    },
    modalLabel: {
      fontSize: surface.label.fontSize,
      lineHeight: surface.label.lineHeight,
      fontWeight: surface.label.fontWeight,
      color: colors.label.color,
      marginBottom: spacing[surface.label.marginBottom],
    },
    modalInput: {
      borderWidth: surface.input.borderWidth,
      borderColor: colors.input.borderColor,
      borderRadius: radius[surface.input.borderRadius],
      paddingHorizontal: spacing[surface.input.paddingHorizontal],
      paddingVertical: inputPaddingVertical,
      backgroundColor: colors.input.backgroundColor,
      marginBottom: spacing[surface.input.marginBottom],
      color: colors.input.color,
      fontSize: surface.input.fontSize,
    },
    modalInputMultiline: {
      height: surface.multilineInput.height,
      paddingTop: spacing[surface.multilineInput.paddingTop],
      paddingBottom: spacing[surface.multilineInput.paddingBottom],
    },
    modalActions: {
      flexDirection: surface.actions.flexDirection,
      justifyContent: surface.actions.justifyContent,
      gap: spacing[surface.actions.gap],
      marginTop: spacing[surface.actions.marginTop],
    },
    modalCancelButton: {
      paddingHorizontal: spacing[surface.cancelButton.paddingHorizontal],
      paddingVertical: spacing[surface.cancelButton.paddingVertical],
      borderRadius: radius[surface.cancelButton.borderRadius],
    },
    modalCancelButtonText: {
      color: colors.cancelButtonText.color,
      fontWeight: surface.actionText.fontWeight,
    },
    modalSaveButton: {
      paddingHorizontal: spacing[surface.saveButton.paddingHorizontal],
      paddingVertical: spacing[surface.saveButton.paddingVertical],
      borderRadius: radius[surface.saveButton.borderRadius],
      backgroundColor: colors.saveButton.backgroundColor,
      minWidth: surface.saveButton.minWidth,
      alignItems: surface.saveButton.alignItems,
    },
    modalSaveButtonDisabled: {
      opacity: surface.saveButton.disabledOpacity,
    },
    modalSaveButtonText: {
      color: colors.saveButtonText.color,
      fontWeight: surface.actionText.fontWeight,
    },
  }
}

export function createChatComposerImageAttachmentMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatComposerImageAttachmentMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    row: {
      paddingHorizontal: spacing[surface.row.paddingHorizontal],
      paddingTop: spacing[surface.row.paddingTop],
      paddingBottom: surface.row.paddingBottom,
      gap: spacing[surface.row.gap],
    },
    card: {
      width: surface.preview.size,
      height: surface.preview.size,
      borderRadius: radius[surface.preview.borderRadius],
      borderWidth: surface.preview.borderWidth,
      borderColor: colors.preview.borderColor,
      overflow: surface.preview.overflow,
      backgroundColor: colors.preview.backgroundColor,
      position: surface.preview.position,
    },
    preview: {
      width: surface.previewImage.width,
      height: surface.previewImage.height,
    },
    removeButton: {
      position: surface.removeButton.position,
      top: surface.removeButton.top,
      right: surface.removeButton.right,
      width: surface.removeButton.size,
      height: surface.removeButton.size,
      borderRadius: surface.removeButton.borderRadius,
      backgroundColor: colors.removeButton.backgroundColor,
      alignItems: surface.removeButton.alignItems,
      justifyContent: surface.removeButton.justifyContent,
    },
  }
}

export function createChatComposerHandsFreeMobileStyleSlots({
  renderState,
  spacing,
  radius,
  platform,
}: ChatComposerHandsFreeMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    statusRow: {
      paddingHorizontal: spacing[surface.statusRow.paddingHorizontal],
      paddingTop: spacing[surface.statusRow.paddingTop],
    },
    controlsRow: {
      flexDirection: surface.controlsRow.flexDirection,
      alignItems: surface.controlsRow.alignItems,
      gap: spacing[surface.controlsRow.gap],
      paddingHorizontal: spacing[surface.controlsRow.paddingHorizontal],
      paddingTop: spacing[surface.controlsRow.paddingTop],
    },
    controlButton: {
      flex: surface.controlButton.flex,
      borderWidth: surface.controlButton.borderWidth,
      borderColor: colors.controlButton.borderColor,
      backgroundColor: colors.controlButton.backgroundColor,
      minHeight: surface.controlButton.minHeight,
      paddingHorizontal: spacing[surface.controlButton.paddingHorizontal],
      borderRadius: radius[surface.controlButton.borderRadius],
      alignItems: surface.controlButton.alignItems,
      justifyContent: surface.controlButton.justifyContent,
    },
    controlButtonText: {
      color: colors.controlButtonText.color,
      fontWeight: surface.controlButtonText.fontWeight,
      fontSize: surface.controlButtonText.fontSize,
    },
    debugPanel: {
      backgroundColor: colors.debugPanel.backgroundColor,
      padding: spacing[surface.debugPanel.padding],
      margin: spacing[surface.debugPanel.margin],
      borderRadius: radius[surface.debugPanel.borderRadius],
      borderLeftWidth: surface.debugPanel.borderLeftWidth,
      borderLeftColor: colors.debugPanel.borderLeftColor,
    },
    debugText: {
      fontSize: surface.debugText.fontSize,
      color: colors.debugText.color,
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.debugText.fontFamilyByPlatform,
        platform ?? "",
      ),
    },
  }
}

export function getChatComposerRuntimeChromeMobileStyleRenderState({
  colors,
  platform,
}: ChatComposerRuntimeChromeMobileStyleRenderStateInput): ChatComposerRuntimeChromeMobileStyleRenderState {
  return {
    composer: getChatComposerMobileSurfaceRenderState({
      colors,
      platform,
    }),
    imageAttachment: getChatImageAttachmentMobileRenderState({
      colors,
    }),
    promptLibrary: getPromptLibraryMobileSurfaceRenderState({
      colors,
    }),
    promptEditorInputPaddingVertical: getPromptLibraryEditorInputPaddingVertical(platform),
    handsFree: getHandsFreeComposerMobileSurfaceRenderState({
      colors,
    }),
  }
}

export function getChatComposerRuntimeDockMobileRenderState({
  colors,
  platform,
}: ChatComposerRuntimeDockMobileRenderStateInput): ChatComposerRuntimeDockMobileRenderState {
  const isWebPlatform = platform === "web"
  const composerSurfaceRenderState = getChatComposerMobileSurfaceRenderState({
    colors,
    platform,
  })
  const composerSurface = composerSurfaceRenderState.surface
  const composerTextColors = composerSurfaceRenderState.colors.text
  const webAccessibility = composerSurface.webAccessibility
  const handsFreeSurface = getHandsFreeComposerMobileSurfaceRenderState({
    colors,
  }).surface
  const accessoryButton = {
    activeOpacity: composerSurface.accessoryButton.pressedOpacity,
  }

  return {
    handsFreeControls: {
      controlPressedOpacity: handsFreeSurface.controlButton.pressedOpacity,
    },
    imageAttachmentControl: accessoryButton,
    textToSpeechControl: accessoryButton,
    editBeforeSendControl: accessoryButton,
    textEntry: {
      placeholderTextColor: composerTextColors.input.placeholderColor,
      webAccessibility: {
        isWebPlatform,
        inputDescriptionNativeId: webAccessibility.inputDescriptionNativeId,
        voiceStatusLiveRegionNativeId: webAccessibility.voiceStatusLiveRegionNativeId,
        voiceStatusLiveRegionPoliteness: webAccessibility.voiceStatusLiveRegionPoliteness,
      },
    },
    queueAction: {
      activeOpacity: composerSurface.queueButton.pressedOpacity,
    },
    submitAction: {
      activeOpacity: composerSurface.submitButton.pressedOpacity,
    },
    micButton: {
      webPressedStyle: isWebPlatform ? getChatComposerMicMobileWebPressStyleState() : undefined,
    },
  }
}

export function getChatComposerRuntimeFollowUpPresentationState({
  conversationState,
  isResponding = false,
  isQueueEnabled = false,
}: ChatComposerRuntimeFollowUpPresentationStateInput): FollowUpInputPresentation {
  return getFollowUpInputPresentation({
    conversationState: conversationState ?? (isResponding ? "running" : "complete"),
    isQueueEnabled,
  })
}

export function getChatComposerRuntimeTextEntryMobileRenderState({
  presentation,
  handsFree,
  phase,
  listening,
  willCancel,
  liveTranscript,
  wakePhrase,
  placeholderFallback,
  isWebPlatform = false,
  speechPreviewText,
}: ChatComposerRuntimeTextEntryMobileRenderStateInput): ChatComposerRuntimeTextEntryMobileRenderState {
  const fallback = placeholderFallback ?? (presentation.placeholder || presentation.submitTitle)

  return {
    accessibilityHint: createChatComposerAccessibilityHint({
      handsFree,
      listening,
      isWeb: isWebPlatform,
    }),
    placeholder: getHandsFreeComposerPlaceholder({
      handsFree,
      phase,
      wakePhrase,
      listening,
      fallback,
    }),
    voiceStatusLiveRegionAnnouncement: createVoiceInputLiveRegionAnnouncement({
      listening,
      handsFree,
      willCancel,
      liveTranscript,
      sttPreview: speechPreviewText ?? undefined,
    }),
  }
}

export function getChatComposerRuntimeHandsFreeControlsMobileRenderState({
  phase,
  label,
  isEnabled = false,
  wakePhrase,
  sleepPhrase,
  lastError,
  foregroundOnly,
}: ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput): ChatComposerRuntimeHandsFreeControlsMobileRenderState {
  return {
    status: {
      phase,
      label,
      subtitle: isEnabled
        ? getHandsFreeStatusSubtitle({
            phase,
            wakePhrase,
            sleepPhrase,
            lastError,
            foregroundOnly,
          })
        : undefined,
    },
    controlState: getHandsFreeComposerControlState(phase),
  }
}

export function getChatComposerRuntimeHandsFreeDebugMessage(
  key: ChatComposerRuntimeHandsFreeDebugMessageKey,
): string {
  return getHandsFreeComposerDebugMessage(key)
}

export function formatChatComposerRuntimeHandsFreeSleepingDebugMessage(wakePhrase: string): string {
  return formatHandsFreeSleepingDebugMessage(wakePhrase)
}

export function createChatComposerRuntimeHandsFreeTranscriptAddedDebugState() {
  return createHandsFreeComposerTranscriptAddedDebugState()
}

export function createChatComposerRuntimeHandsFreePermissionDeniedDebugState() {
  return createHandsFreeComposerPermissionDeniedDebugState()
}

export function createChatComposerRuntimeHandsFreeRecognizerErrorDebugState(message: string) {
  return createHandsFreeComposerRecognizerErrorDebugState(message)
}

export function getChatComposerMobileTextInputPlatformState(
  platform: string | null | undefined,
): ChatComposerMobileTextInputPlatformState {
  const paddingVerticalByPlatform = CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.paddingVerticalByPlatform
  return {
    paddingVertical:
      platform === "android"
        ? paddingVerticalByPlatform.android
        : platform === "ios"
          ? paddingVerticalByPlatform.ios
          : paddingVerticalByPlatform.default,
  }
}

export function getChatComposerMicMobileIconState(isListening: boolean): ChatComposerMobileIconState {
  return {
    isActive: isListening,
    name: isListening
      ? CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.activeName
      : CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.inactiveName,
    size: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.size,
    colorToken: isListening
      ? CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.activeForegroundColorToken
      : CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.inactiveForegroundColorToken,
  }
}

export function getChatComposerMicMobileRenderState(
  input: ChatComposerMicMobileRenderStateInput,
): ChatComposerMicMobileRenderState {
  const action = getChatComposerMicMobileActionState(input)
  const icon = getChatComposerMicMobileIconState(input.listening)
  const iconColors = getChatComposerMobileIconColors(icon, input.colors)

  return {
    ...action,
    isActive: icon.isActive === true,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.icon.color,
    },
  }
}

export function getChatComposerMicMobileWebPressStyleState(): ChatComposerMicMobileWebPressStyleState {
  return CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.webPressStyle
}

export function getChatComposerRuntimeControlMobileRenderState({
  hasContent = false,
  handsFree = false,
  presentation,
  pendingImageCount = 0,
  ttsEnabled = false,
  editBeforeSendEnabled = false,
  micPhase,
  listening = false,
  messageQueueEnabled = false,
  colors,
}: ChatComposerRuntimeControlMobileRenderStateInput): ChatComposerRuntimeControlMobileRenderState {
  const controls = getChatComposerMobileControlState({
    textToSpeechEnabled: ttsEnabled,
    editBeforeSendEnabled,
  })
  const micLabel = getHandsFreeMicButtonLabel({
    handsFree,
    phase: micPhase,
    listening,
  })
  const actionAvailability = getChatComposerMobileActionAvailabilityRenderState({
    hasContent,
    handsFree,
    presentation,
  })

  return {
    controls,
    actionAvailability,
    visibility: getChatComposerMobileVisibilityRenderState({
      handsFree,
      listening,
      messageQueueEnabled,
    }),
    imageAttachment: getChatComposerImageAttachmentMobileRenderState({
      hasImages: (pendingImageCount ?? 0) > 0,
      colors,
    }),
    textToSpeech: getChatComposerTextToSpeechMobileRenderState({
      isEnabled: ttsEnabled,
      colors,
    }),
    editBeforeSend: getChatComposerEditBeforeSendMobileRenderState({
      isEnabled: editBeforeSendEnabled,
      colors,
    }),
    queueAction: getChatComposerQueueMobileRenderState({
      isDisabled: actionAvailability.queueAction.isDisabled,
      colors,
    }),
    submitAction: getChatComposerSubmitMobileRenderState({
      presentation,
      isHandsFree: handsFree,
      isDisabled: actionAvailability.submitAction.isDisabled,
      colors,
    }),
    micButton: getChatComposerMicMobileRenderState({
      label: micLabel,
      handsFree,
      listening,
      willCancel: editBeforeSendEnabled,
      colors,
    }),
  }
}

export function createChatComposerRuntimeDockMobileProps<
  TInput extends ChatComposerRuntimeDockMobilePropsInput,
>({
  chrome,
  speechPreviewText,
  pendingImages,
  pendingImagesColors,
  onRemovePendingImage,
  handsFreeStatusPhase,
  handsFreeStatusLabel,
  handsFreeStatusEnabled,
  handsFreeStatusWakePhrase,
  handsFreeStatusSleepPhrase,
  handsFreeStatusLastError,
  handsFreeStatusForegroundOnly,
  onWakeHandsFree,
  onSleepHandsFree,
  onResumeHandsFree,
  onPauseHandsFree,
  composerControlHasContent,
  composerControlConversationState,
  composerControlIsResponding,
  composerControlPendingImageCount,
  composerControlTtsEnabled,
  composerControlEditBeforeSendEnabled,
  composerControlMicPhase,
  composerControlListening,
  composerControlMessageQueueEnabled,
  composerControlColors,
  onImageAttachmentPress,
  onTextToSpeechPress,
  onEditBeforeSendPress,
  textEntryInputRef,
  textEntryValue,
  onTextEntryChangeText,
  onTextEntryKeyPress,
  textEntryHandsFree,
  textEntryListening,
  textEntryWillCancel,
  textEntryLiveTranscript,
  textEntryWakePhrase,
  textEntryPlaceholderFallback,
  onQueueActionPress,
  onSubmitActionPress,
  onMicPressIn,
  onMicPressOut,
  onMicPress,
  micWrapperRef,
}: TInput): ChatComposerRuntimeDockMobileProps<TInput> {
  const composerControlPresentation = getChatComposerRuntimeFollowUpPresentationState({
    conversationState: composerControlConversationState,
    isResponding: composerControlIsResponding,
    isQueueEnabled: composerControlMessageQueueEnabled,
  })
  const controlRenderState = getChatComposerRuntimeControlMobileRenderState({
    hasContent: composerControlHasContent,
    handsFree: textEntryHandsFree,
    presentation: composerControlPresentation,
    pendingImageCount: composerControlPendingImageCount,
    ttsEnabled: composerControlTtsEnabled,
    editBeforeSendEnabled: composerControlEditBeforeSendEnabled,
    micPhase: composerControlMicPhase,
    listening: composerControlListening,
    messageQueueEnabled: composerControlMessageQueueEnabled,
    colors: composerControlColors,
  })
  const mobileComposerControls = controlRenderState.controls
  const pendingImagesRenderState = getChatImageAttachmentMobileRenderState({
    colors: pendingImagesColors,
  })
  const handsFreeControlsRenderState = getChatComposerRuntimeHandsFreeControlsMobileRenderState({
    phase: handsFreeStatusPhase,
    label: handsFreeStatusLabel,
    isEnabled: handsFreeStatusEnabled,
    wakePhrase: handsFreeStatusWakePhrase,
    sleepPhrase: handsFreeStatusSleepPhrase,
    lastError: handsFreeStatusLastError,
    foregroundOnly: handsFreeStatusForegroundOnly,
  })
  const textEntryRenderState = getChatComposerRuntimeTextEntryMobileRenderState({
    presentation: composerControlPresentation,
    handsFree: textEntryHandsFree,
    phase: handsFreeStatusPhase,
    listening: textEntryListening,
    willCancel: textEntryWillCancel,
    liveTranscript: textEntryLiveTranscript,
    wakePhrase: textEntryWakePhrase,
    placeholderFallback: textEntryPlaceholderFallback,
    isWebPlatform: chrome.textEntry.webAccessibility.isWebPlatform,
    speechPreviewText,
  })

  return {
    speechPreview: {
      label: mobileComposerControls.sttPreview.label,
      text: speechPreviewText,
    },
    pendingImagesRail: {
      images: pendingImages,
      renderState: pendingImagesRenderState,
      onRemove: onRemovePendingImage,
    },
    handsFreeControls: {
      isVisible: controlRenderState.visibility.handsFreeControls.isVisible,
      status: handsFreeControlsRenderState.status,
      controlState: handsFreeControlsRenderState.controlState,
      onWake: onWakeHandsFree,
      onSleep: onSleepHandsFree,
      onResume: onResumeHandsFree,
      onPause: onPauseHandsFree,
      ...chrome.handsFreeControls,
    },
    imageAttachmentControl: {
      renderState: controlRenderState.imageAttachment,
      onPress: onImageAttachmentPress,
      ...chrome.imageAttachmentControl,
    },
    textToSpeechControl: {
      renderState: controlRenderState.textToSpeech,
      onPress: onTextToSpeechPress,
      ...chrome.textToSpeechControl,
    },
    editBeforeSendControl: {
      shouldRender: controlRenderState.visibility.editBeforeSendControl.shouldRender,
      renderState: controlRenderState.editBeforeSend,
      onPress: onEditBeforeSendPress,
      ...chrome.editBeforeSendControl,
    },
    textEntry: {
      inputRef: textEntryInputRef,
      value: textEntryValue,
      onChangeText: onTextEntryChangeText,
      onKeyPress: onTextEntryKeyPress,
      accessibilityLabel: mobileComposerControls.field.accessibilityLabel,
      accessibilityHint: textEntryRenderState.accessibilityHint,
      placeholder: textEntryRenderState.placeholder,
      voiceStatusLiveRegionAnnouncement: textEntryRenderState.voiceStatusLiveRegionAnnouncement,
      ...chrome.textEntry,
    },
    queueAction: {
      shouldRender: controlRenderState.visibility.queueAction.shouldRender,
      renderState: controlRenderState.queueAction,
      onPress: onQueueActionPress,
      ...chrome.queueAction,
    },
    submitAction: {
      renderState: controlRenderState.submitAction,
      onPress: onSubmitActionPress,
      ...chrome.submitAction,
    },
    micButton: {
      renderState: controlRenderState.micButton,
      onPressIn: controlRenderState.visibility.micButton.shouldUsePushToTalk ? onMicPressIn : undefined,
      onPressOut: controlRenderState.visibility.micButton.shouldUsePushToTalk ? onMicPressOut : undefined,
      onPress: controlRenderState.visibility.micButton.shouldUseHandsFreePrimaryControl ? onMicPress : undefined,
      ...chrome.micButton,
    },
    micWrapperRef,
  }
}

export function formatChatRuntimeToolApprovalFailureMessage(
  action: ChatRuntimeToolApprovalAction,
  error: unknown,
): string {
  const prefix = action === "approve"
    ? CHAT_RUNTIME_PRESENTATION.approval.approveFailedPrefix
    : CHAT_RUNTIME_PRESENTATION.approval.denyFailedPrefix
  return `${prefix} ${getChatRuntimeAlertMessage(error, CHAT_RUNTIME_PRESENTATION.common.retryFallback)}`
}

export function getChatRuntimeToolApprovalMobileAlertState(): ChatRuntimeToolApprovalMobileAlertState {
  return {
    connectionRequired: {
      title: CHAT_RUNTIME_PRESENTATION.approval.connectionRequiredTitle,
      message: CHAT_RUNTIME_PRESENTATION.approval.connectionRequiredMessage,
    },
    unavailable: {
      title: CHAT_RUNTIME_PRESENTATION.approval.unavailableTitle,
      message: CHAT_RUNTIME_PRESENTATION.approval.unavailableMessage,
    },
    failed: {
      title: CHAT_RUNTIME_PRESENTATION.approval.failedTitle,
      fallbackMessage: CHAT_RUNTIME_PRESENTATION.approval.responseFailedMessage,
    },
  }
}

export function getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState(
  alerts: ChatRuntimeToolApprovalMobileAlertState = getChatRuntimeToolApprovalMobileAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alerts.connectionRequired.title,
    message: alerts.connectionRequired.message,
  }
}

export function getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState(
  alerts: ChatRuntimeToolApprovalMobileAlertState = getChatRuntimeToolApprovalMobileAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alerts.unavailable.title,
    message: alerts.unavailable.message,
  }
}

export function getChatRuntimeToolApprovalFailedMobileResolvedAlertState(
  error: unknown,
  alerts: ChatRuntimeToolApprovalMobileAlertState = getChatRuntimeToolApprovalMobileAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alerts.failed.title,
    message: getChatRuntimeAlertMessage(error, alerts.failed.fallbackMessage),
  }
}

export function formatChatRuntimeToolApprovalRequiredContent(toolName: string): string {
  return `${CHAT_RUNTIME_PRESENTATION.approval.title}: ${toolName}`
}

export function getChatRuntimeToolApprovalAccessibilityLabel(
  action: ChatRuntimeToolApprovalAction,
  toolName: string,
): string {
  const label = action === "approve"
    ? CHAT_RUNTIME_PRESENTATION.approval.approveLabel
    : CHAT_RUNTIME_PRESENTATION.approval.denyLabel
  return `${label} tool call ${toolName}`
}

export function getChatRuntimeToolApprovalArgumentsAccessibilityLabel(
  toolName: string,
  isExpanded: boolean,
): string {
  const label = isExpanded
    ? CHAT_RUNTIME_PRESENTATION.approval.hideArgumentsLabel
    : CHAT_RUNTIME_PRESENTATION.approval.viewArgumentsLabel
  return `${label} for ${toolName}`
}

export function getChatRuntimeToolApprovalInteractionState({
  toolName,
  isArgumentsExpanded = false,
  isResponding = false,
}: ChatRuntimeToolApprovalInteractionStateInput): ChatRuntimeToolApprovalInteractionState {
  const copy = CHAT_RUNTIME_PRESENTATION.approval

  return {
    copy,
    title: isResponding ? copy.processingTitle : copy.title,
    argumentsToggle: {
      label: isArgumentsExpanded ? copy.hideArgumentsLabel : copy.viewArgumentsLabel,
      isDisabled: isResponding,
      accessibilityLabel: getChatRuntimeToolApprovalArgumentsAccessibilityLabel(
        toolName,
        isArgumentsExpanded,
      ),
      accessibilityState: {
        expanded: isArgumentsExpanded,
        disabled: isResponding,
      },
      ariaExpanded: isArgumentsExpanded,
    },
    approveButton: {
      label: isResponding ? copy.processingLabel : copy.approveLabel,
      isDisabled: isResponding,
      accessibilityLabel: getChatRuntimeToolApprovalAccessibilityLabel("approve", toolName),
      accessibilityState: { disabled: isResponding },
    },
    denyButton: {
      label: copy.denyLabel,
      isDisabled: isResponding,
      accessibilityLabel: getChatRuntimeToolApprovalAccessibilityLabel("deny", toolName),
      accessibilityState: { disabled: isResponding },
    },
  }
}

export function getChatRuntimeToolApprovalHeaderMobileIconState(): ChatRuntimeToolApprovalHeaderMobileIconState {
  return {
    name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.name,
    size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.size,
    colorToken: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.colorToken,
  }
}

export function getChatRuntimeToolApprovalHeaderMobileIconColors(
  colors: ChatRuntimeToolApprovalMobileColorPalette,
): ChatRuntimeToolApprovalMobileIconColors {
  const icon = getChatRuntimeToolApprovalHeaderMobileIconState()
  return { color: colors[icon.colorToken] }
}

export function getChatRuntimeToolApprovalSpinnerMobileColors(
  colors: ChatRuntimeToolApprovalMobileColorPalette,
): ChatRuntimeToolApprovalMobileSpinnerColors {
  return { color: colors[TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.spinner.colorToken] }
}

export function getChatRuntimeToolApprovalMobileSurfaceState() {
  return TOOL_APPROVAL_SURFACE_PRESENTATION.mobile
}

export function getChatRuntimeToolApprovalMobileSurfaceColors(
  colors: ChatRuntimeToolApprovalMobileSurfaceColorPalette,
): ChatRuntimeToolApprovalMobileSurfaceColors {
  const surface = TOOL_APPROVAL_SURFACE_PRESENTATION.mobile

  return {
    card: {
      borderColor: hexToRgba(colors[surface.card.borderColorToken], surface.card.borderAlpha),
      backgroundColor: hexToRgba(colors[surface.card.backgroundColorToken], surface.card.backgroundAlpha),
    },
    title: {
      color: colors[surface.title.colorToken],
    },
    toolLabel: {
      color: colors[surface.toolLabel.colorToken],
    },
    toolName: {
      color: colors[surface.toolName.colorToken],
    },
    argumentsPreview: {
      borderColor: hexToRgba(
        colors[surface.argumentsPreview.borderColorToken],
        surface.argumentsPreview.borderAlpha,
      ),
      backgroundColor: hexToRgba(
        colors[surface.argumentsPreview.backgroundColorToken],
        surface.argumentsPreview.backgroundAlpha,
      ),
      color: colors[surface.argumentsPreview.textColorToken],
    },
    argumentsToggleText: {
      color: colors[surface.argumentsToggleText.colorToken],
    },
    fullArguments: {
      backgroundColor: hexToRgba(
        colors[surface.fullArguments.backgroundColorToken],
        surface.fullArguments.backgroundAlpha,
      ),
      color: colors[surface.fullArguments.textColorToken],
    },
    approveButton: {
      backgroundColor: colors[surface.buttonVariants.approve.backgroundColorToken],
    },
    approveButtonText: {
      color: colors[surface.buttonVariants.approve.foregroundColorToken],
    },
    denyButton: {
      borderColor: colors[surface.buttonVariants.deny.borderColorToken],
      backgroundColor: colors[surface.buttonVariants.deny.backgroundColorToken],
    },
    denyButtonText: {
      color: colors[surface.buttonVariants.deny.foregroundColorToken],
    },
  }
}

export function getChatRuntimeToolApprovalDesktopSurfaceState(): typeof TOOL_APPROVAL_SURFACE_PRESENTATION.desktop {
  return TOOL_APPROVAL_SURFACE_PRESENTATION.desktop
}

export function getChatRuntimeToolApprovalArgumentsToggleMobileIconState(
  isExpanded: boolean,
): ChatRuntimeToolApprovalArgumentsToggleMobileIconState {
  return {
    isExpanded,
    name: isExpanded
      ? TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.expandedName
      : TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.collapsedName,
    size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.size,
    colorToken: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleText.colorToken,
  }
}

export function getChatRuntimeToolApprovalArgumentsToggleMobileIconColors(
  isExpanded: boolean,
  colors: ChatRuntimeToolApprovalMobileColorPalette,
): ChatRuntimeToolApprovalMobileIconColors {
  const icon = getChatRuntimeToolApprovalArgumentsToggleMobileIconState(isExpanded)
  return { color: colors[icon.colorToken] }
}

export function getChatRuntimeToolApprovalActionMobileIconState(
  action: ChatRuntimeToolApprovalAction,
): ChatRuntimeToolApprovalActionMobileIconState {
  return {
    action,
    name: action === "approve"
      ? TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.approveName
      : TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.denyName,
    size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.size,
    colorToken: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants[action].foregroundColorToken,
  }
}

export function getChatRuntimeToolApprovalActionMobileIconColors(
  action: ChatRuntimeToolApprovalAction,
  colors: ChatRuntimeToolApprovalMobileColorPalette,
): ChatRuntimeToolApprovalMobileIconColors {
  const icon = getChatRuntimeToolApprovalActionMobileIconState(action)
  return { color: colors[icon.colorToken] }
}

export function getChatRuntimeToolApprovalButtonSpinnerMobileColors(
  colors: ChatRuntimeToolApprovalMobileColorPalette,
): ChatRuntimeToolApprovalMobileSpinnerColors {
  return { color: colors[TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonSpinner.colorToken] }
}

export function getChatRuntimeToolApprovalMobileRenderState({
  toolName,
  isArgumentsExpanded = false,
  isResponding = false,
  colors,
}: ChatRuntimeToolApprovalMobileRenderStateInput): ChatRuntimeToolApprovalMobileRenderState {
  const interaction = getChatRuntimeToolApprovalInteractionState({
    toolName,
    isArgumentsExpanded,
    isResponding,
  })
  const surface = getChatRuntimeToolApprovalMobileSurfaceState()
  const headerIcon = getChatRuntimeToolApprovalHeaderMobileIconState()
  const headerIconColors = getChatRuntimeToolApprovalHeaderMobileIconColors(colors)
  const spinnerColors = getChatRuntimeToolApprovalSpinnerMobileColors(colors)
  const argumentsToggleIcon = getChatRuntimeToolApprovalArgumentsToggleMobileIconState(isArgumentsExpanded)
  const argumentsToggleIconColors = getChatRuntimeToolApprovalArgumentsToggleMobileIconColors(
    isArgumentsExpanded,
    colors,
  )
  const approveIcon = getChatRuntimeToolApprovalActionMobileIconState("approve")
  const approveIconColors = getChatRuntimeToolApprovalActionMobileIconColors("approve", colors)
  const denyIcon = getChatRuntimeToolApprovalActionMobileIconState("deny")
  const denyIconColors = getChatRuntimeToolApprovalActionMobileIconColors("deny", colors)
  const buttonSpinnerColors = getChatRuntimeToolApprovalButtonSpinnerMobileColors(colors)

  return {
    copy: interaction.copy,
    surface,
    colors: getChatRuntimeToolApprovalMobileSurfaceColors(colors),
    title: interaction.title,
    headerIcon: {
      name: headerIcon.name,
      size: headerIcon.size,
      color: headerIconColors.color,
    },
    spinner: {
      size: surface.spinner.size,
      color: spinnerColors.color,
    },
    argumentsToggle: {
      label: interaction.argumentsToggle.label,
      isDisabled: interaction.argumentsToggle.isDisabled,
      accessibilityRole: surface.argumentsToggle.accessibilityRole,
      accessibilityLabel: interaction.argumentsToggle.accessibilityLabel,
      accessibilityState: interaction.argumentsToggle.accessibilityState,
      ariaExpanded: interaction.argumentsToggle.ariaExpanded,
      pressedOpacity: surface.argumentsToggle.pressedOpacity,
      icon: {
        name: argumentsToggleIcon.name,
        size: argumentsToggleIcon.size,
        color: argumentsToggleIconColors.color,
      },
    },
    approveButton: {
      label: interaction.approveButton.label,
      isDisabled: interaction.approveButton.isDisabled,
      accessibilityRole: surface.button.accessibilityRole,
      accessibilityLabel: interaction.approveButton.accessibilityLabel,
      accessibilityState: interaction.approveButton.accessibilityState,
      icon: {
        name: approveIcon.name,
        size: approveIcon.size,
        color: approveIconColors.color,
      },
      spinner: {
        size: surface.buttonSpinner.size,
        color: buttonSpinnerColors.color,
      },
    },
    denyButton: {
      label: interaction.denyButton.label,
      isDisabled: interaction.denyButton.isDisabled,
      accessibilityRole: surface.button.accessibilityRole,
      accessibilityLabel: interaction.denyButton.accessibilityLabel,
      accessibilityState: interaction.denyButton.accessibilityState,
      icon: {
        name: denyIcon.name,
        size: denyIcon.size,
        color: denyIconColors.color,
      },
    },
  }
}

export function createChatRuntimeToolApprovalMobileStyleSlots({
  renderState,
  spacing,
  radius,
  platform,
}: ChatRuntimeToolApprovalMobileStyleSlotsInput): ChatRuntimeToolApprovalMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    card: {
      gap: spacing[surface.card.gap],
      padding: spacing[surface.card.padding],
      borderRadius: radius[surface.card.borderRadius],
      borderWidth: surface.card.borderWidth,
      borderColor: colors.card.borderColor,
      backgroundColor: colors.card.backgroundColor,
    },
    header: {
      flexDirection: surface.header.flexDirection,
      alignItems: surface.header.alignItems,
      gap: spacing[surface.header.gap],
    },
    content: {
      gap: spacing[surface.content.gap],
    },
    contentDisabled: {
      opacity: surface.content.disabledOpacity,
    },
    title: {
      flex: surface.title.flex,
      minWidth: surface.title.minWidth,
      fontSize: surface.title.fontSize,
      fontWeight: surface.title.fontWeight,
      color: colors.title.color,
    },
    toolRow: {
      flexDirection: surface.toolRow.flexDirection,
      alignItems: surface.toolRow.alignItems,
      flexWrap: surface.toolRow.flexWrap,
      gap: spacing[surface.toolRow.gap],
      marginBottom: surface.toolRow.marginBottom,
    },
    toolLabel: {
      fontSize: surface.toolLabel.fontSize,
      fontWeight: surface.toolLabel.fontWeight,
      color: colors.toolLabel.color,
    },
    tool: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.toolName.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.toolName.fontSize,
      color: colors.toolName.color,
      flexShrink: surface.toolName.flexShrink,
    },
    argumentsPreview: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.argumentsPreview.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.argumentsPreview.fontSize,
      lineHeight: surface.argumentsPreview.lineHeight,
      borderWidth: surface.argumentsPreview.borderWidth,
      borderRadius: radius[surface.argumentsPreview.borderRadius],
      paddingHorizontal: spacing[surface.argumentsPreview.paddingHorizontal],
      paddingVertical: surface.argumentsPreview.paddingVertical,
      borderColor: colors.argumentsPreview.borderColor,
      backgroundColor: colors.argumentsPreview.backgroundColor,
      color: colors.argumentsPreview.color,
    },
    argumentsToggle: {
      flexDirection: surface.argumentsToggle.flexDirection,
      alignItems: surface.argumentsToggle.alignItems,
      alignSelf: surface.argumentsToggle.alignSelf,
      gap: surface.argumentsToggle.gap,
      marginTop: spacing[surface.argumentsToggle.marginTop],
      paddingVertical: surface.argumentsToggle.paddingVertical,
    },
    argumentsTogglePressed: {
      opacity: surface.argumentsToggle.pressedOpacity,
    },
    argumentsToggleText: {
      fontSize: surface.argumentsToggleText.fontSize,
      fontWeight: surface.argumentsToggleText.fontWeight,
      color: colors.argumentsToggleText.color,
    },
    argumentsScroll: {
      marginTop: surface.fullArguments.marginTop,
      maxHeight: surface.fullArguments.maxHeight,
      borderRadius: radius[surface.fullArguments.borderRadius],
      backgroundColor: colors.fullArguments.backgroundColor,
    },
    argumentsFull: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.fullArguments.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.fullArguments.fontSize,
      lineHeight: surface.fullArguments.lineHeight,
      padding: surface.fullArguments.padding,
      color: colors.fullArguments.color,
    },
    actions: {
      flexDirection: surface.actions.flexDirection,
      justifyContent: surface.actions.justifyContent,
      flexWrap: surface.actions.flexWrap,
      gap: spacing[surface.actions.gap],
      marginTop: spacing[surface.actions.marginTop],
    },
    button: {
      minHeight: surface.button.minHeight,
      minWidth: surface.button.minWidth,
      borderRadius: radius[surface.button.borderRadius],
      paddingHorizontal: spacing[surface.button.paddingHorizontal],
      paddingVertical: spacing[surface.button.paddingVertical],
      flexDirection: surface.button.flexDirection,
      alignItems: surface.button.alignItems,
      justifyContent: surface.button.justifyContent,
      gap: surface.button.gap,
      flex: surface.button.flex,
    },
    buttonDisabled: {
      opacity: surface.disabledOpacity,
    },
    approveButton: {
      backgroundColor: colors.approveButton.backgroundColor,
    },
    approveButtonText: {
      color: colors.approveButtonText.color,
      fontSize: surface.buttonText.fontSize,
      fontWeight: surface.buttonText.fontWeight,
    },
    denyButton: {
      borderWidth: surface.buttonVariants.deny.borderWidth,
      borderColor: colors.denyButton.borderColor,
      backgroundColor: colors.denyButton.backgroundColor,
    },
    denyButtonText: {
      color: colors.denyButtonText.color,
      fontSize: surface.buttonText.fontSize,
      fontWeight: surface.buttonText.fontWeight,
    },
  }
}

export function getChatRuntimeToolApprovalCardMobileRenderState({
  isApproval = false,
  toolApproval,
  expandedToolApprovals,
  pendingApprovalResponseId,
  colors,
}: ChatRuntimeToolApprovalCardMobileRenderStateInput): ChatRuntimeToolApprovalCardMobileRenderState | null {
  if (!isApproval || !toolApproval) return null

  const isArgumentsExpanded = getChatDisplayExpansionState(
    expandedToolApprovals,
    toolApproval.approvalId,
  )
  const isResponding = pendingApprovalResponseId === toolApproval.approvalId
  const argumentsDetail = getToolExecutionDetailArgumentsState(toolApproval.arguments)
  const renderState = getChatRuntimeToolApprovalMobileRenderState({
    toolName: toolApproval.toolName,
    isArgumentsExpanded,
    isResponding,
    colors,
  })

  return {
    approvalId: toolApproval.approvalId,
    renderState,
    toolName: toolApproval.toolName,
    argumentsPreview: argumentsDetail.preview,
    argumentsContent: argumentsDetail.content,
  }
}

export function formatChatRuntimeRetryAttemptLabel(
  retryInfo: Pick<ChatRuntimeRetryInfoLike, "attempt" | "maxAttempts">,
): string {
  const prefix = CHAT_RUNTIME_PRESENTATION.retryStatus.attemptLabel
  return retryInfo.maxAttempts
    ? `${prefix} ${retryInfo.attempt}/${retryInfo.maxAttempts}`
    : `${prefix} ${retryInfo.attempt}`
}

export function formatChatRuntimeRetryCountdownLabel(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return [
    CHAT_RUNTIME_PRESENTATION.retryStatus.retryingInPrefix,
    `${safeSeconds}${CHAT_RUNTIME_PRESENTATION.retryStatus.retryingInSuffix}`,
  ].join(" ")
}

export function formatChatRuntimeRetryAccessibilityLabel(
  retryInfo: ChatRuntimeRetryInfoLike,
): string {
  return [
    retryInfo.reason,
    formatChatRuntimeRetryAttemptLabel(retryInfo),
    formatChatRuntimeRetryCountdownLabel(retryInfo.delaySeconds),
    CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
  ].join(". ")
}

export function getChatRuntimeRetryStatusState({
  retryInfo,
  countdownSeconds,
}: ChatRuntimeRetryStatusStateInput = {}): ChatRuntimeRetryStatusState {
  if (!retryInfo) {
    return {
      shouldRender: false,
      title: "",
      attemptLabel: "",
      countdownLabel: "",
      description: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
      accessibilityLabel: "",
    }
  }

  const resolvedCountdownSeconds = countdownSeconds ?? retryInfo.delaySeconds
  const retryAccessibilityInfo = {
    ...retryInfo,
    delaySeconds: resolvedCountdownSeconds,
  }

  return {
    shouldRender: true,
    title: retryInfo.reason,
    attemptLabel: formatChatRuntimeRetryAttemptLabel(retryInfo),
    countdownLabel: formatChatRuntimeRetryCountdownLabel(resolvedCountdownSeconds),
    description: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
    accessibilityLabel: formatChatRuntimeRetryAccessibilityLabel(retryAccessibilityInfo),
  }
}

export function getChatRuntimeStreamingContentTitle(isStreaming: boolean): string {
  return isStreaming
    ? CHAT_RUNTIME_PRESENTATION.streamingContent.generatingTitle
    : CHAT_RUNTIME_PRESENTATION.streamingContent.responseTitle
}

export function getChatRuntimeStreamingContentState({
  isStreaming = false,
  content = "",
}: ChatRuntimeStreamingContentStateInput = {}): ChatRuntimeStreamingContentState {
  const resolvedIsStreaming = Boolean(isStreaming)
  const title = getChatRuntimeStreamingContentTitle(resolvedIsStreaming)
  const resolvedContent = content ?? ""

  return {
    shouldRender: resolvedIsStreaming,
    hasContent: resolvedContent.length > 0,
    isStreaming: resolvedIsStreaming,
    title,
    accessibilityLabel: title,
    badgeLabel: CHAT_RUNTIME_PRESENTATION.streamingContent.streamingBadgeLabel,
    content: resolvedContent,
  }
}

export function getChatRuntimeLatestStepSummary<T extends ChatRuntimeStepSummaryLike>(
  input: { latestSummary?: T | null; stepSummaries?: T[] | null },
): T | null {
  if (input.latestSummary) return input.latestSummary
  const summaries = input.stepSummaries ?? []
  return summaries.length > 0 ? summaries[summaries.length - 1] ?? null : null
}

export function formatChatRuntimeStepSummaryTitle(summary: Pick<ChatRuntimeStepSummaryLike, "stepNumber">): string {
  return `${CHAT_RUNTIME_PRESENTATION.stepSummary.summaryTitle} · ${CHAT_RUNTIME_PRESENTATION.stepSummary.stepLabel} ${summary.stepNumber}`
}

export function formatChatRuntimeStepSummaryStepLabel(summary: Pick<ChatRuntimeStepSummaryLike, "stepNumber">): string {
  return `${CHAT_RUNTIME_PRESENTATION.stepSummary.stepLabel} ${summary.stepNumber}`
}

function formatChatRuntimeImportanceLabel(importance: NonNullable<ChatRuntimeStepSummaryLike["importance"]>): string {
  return `${importance.charAt(0).toUpperCase()}${importance.slice(1)} ${CHAT_RUNTIME_PRESENTATION.stepSummary.importanceSuffix}`
}

export function formatChatRuntimeStepSummaryMeta(summary: ChatRuntimeStepSummaryLike): string {
  const parts = [`${CHAT_RUNTIME_PRESENTATION.stepSummary.stepLabel} ${summary.stepNumber}`]

  if (summary.importance) {
    parts.push(formatChatRuntimeImportanceLabel(summary.importance))
  }

  const keyFindingsLabel = formatChatRuntimeStepSummaryKeyFindingsLabel(summary)
  if (keyFindingsLabel) parts.push(keyFindingsLabel)

  return parts.join(" · ")
}

export function formatChatRuntimeStepSummaryKeyFindingsLabel(summary: Pick<ChatRuntimeStepSummaryLike, "keyFindings">): string {
  const findingCount = summary.keyFindings?.length ?? 0
  if (findingCount <= 0) return ""

  return `${findingCount} ${findingCount === 1
    ? CHAT_RUNTIME_PRESENTATION.stepSummary.keyFindingSingular
    : CHAT_RUNTIME_PRESENTATION.stepSummary.keyFindingPlural}`
}

export function formatChatRuntimeStepSummaryPreview(summary: ChatRuntimeStepSummaryLike): string {
  return summary.keyFindings?.find((finding) => finding.trim())?.trim()
    || summary.noteCandidates?.find((candidate) => candidate.trim())?.trim()
    || summary.nextSteps?.trim()
    || ""
}

export function formatChatRuntimeStepSummaryAccessibilityLabel(summary: ChatRuntimeStepSummaryLike): string {
  const preview = formatChatRuntimeStepSummaryPreview(summary)
  return [
    CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle,
    formatChatRuntimeStepSummaryMeta(summary),
    summary.actionSummary,
    preview,
  ].filter(Boolean).join(". ")
}

export function getChatRuntimeStepSummaryState({
  summary = null,
}: ChatRuntimeStepSummaryStateInput = {}): ChatRuntimeStepSummaryState {
  if (!summary) {
    return {
      shouldRender: false,
      title: CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle,
      badgeLabel: "",
      stepLabel: "",
      actionSummary: "",
      meta: "",
      preview: "",
      keyFindingsLabel: "",
      accessibilityLabel: "",
    }
  }

  return {
    shouldRender: true,
    title: CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle,
    badgeLabel: formatChatRuntimeStepSummaryTitle(summary),
    stepLabel: formatChatRuntimeStepSummaryStepLabel(summary),
    actionSummary: summary.actionSummary,
    meta: formatChatRuntimeStepSummaryMeta(summary),
    preview: formatChatRuntimeStepSummaryPreview(summary),
    keyFindingsLabel: formatChatRuntimeStepSummaryKeyFindingsLabel(summary),
    accessibilityLabel: formatChatRuntimeStepSummaryAccessibilityLabel(summary),
  }
}

export function formatChatRuntimeDelegationMessageCount(messageCount: number): string {
  return `${messageCount}${CHAT_RUNTIME_PRESENTATION.delegation.messageCountSuffix}`
}

export function formatChatRuntimeEarlierDelegationMessagesLabel(count: number): string {
  const label = count === 1
    ? CHAT_RUNTIME_PRESENTATION.delegation.messageSingularLabel
    : CHAT_RUNTIME_PRESENTATION.delegation.messagePluralLabel
  return `Show ${count.toLocaleString()} earlier ${label}`
}

export function formatChatRuntimeDelegationMessagesLabel(
  count: number,
  options: { includeCount?: boolean } = {},
): string {
  const label = count === 1
    ? CHAT_RUNTIME_PRESENTATION.delegation.messageSingularLabel
    : CHAT_RUNTIME_PRESENTATION.delegation.messagePluralLabel
  return options.includeCount === false ? label : `${count.toLocaleString()} ${label}`
}

export function formatChatRuntimeDelegationToolActivityLabel(toolCountLabel: string): string {
  const trimmedToolCountLabel = toolCountLabel.trim()
  return trimmedToolCountLabel
    ? `${CHAT_RUNTIME_PRESENTATION.delegation.toolActivityLabel} · ${trimmedToolCountLabel}`
    : CHAT_RUNTIME_PRESENTATION.delegation.toolActivityLabel
}

export function formatChatRuntimeDelegationToolCallActivityLabel(toolCallCount: number): string {
  return formatChatRuntimeDelegationToolActivityLabel(formatToolExecutionCount("tool_call", toolCallCount))
}

export function formatChatRuntimeDelegationMoreToolActivityLabel(hiddenCount: number): string {
  return `+${Math.max(0, Math.floor(hiddenCount)).toLocaleString()} ${CHAT_RUNTIME_PRESENTATION.delegation.moreToolActivityLabel}`
}

export function getChatRuntimeDelegationConversationPreviewMoreActionState(
  hiddenCount: number,
): ChatRuntimeDelegationMorePreviewActionState {
  const label = formatChatRuntimeEarlierDelegationMessagesLabel(hiddenCount)
  return {
    label,
    accessibilityRole: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreButtonAccessibilityRole,
    accessibilityLabel: label,
    numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreNumberOfLines,
  }
}

export function getChatRuntimeDelegationToolPreviewMoreActionState(
  hiddenCount: number,
): ChatRuntimeDelegationMorePreviewActionState {
  const label = formatChatRuntimeDelegationMoreToolActivityLabel(hiddenCount)
  return {
    label,
    accessibilityRole: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreButtonAccessibilityRole,
    accessibilityLabel: label,
    numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreNumberOfLines,
  }
}

export function getChatRuntimeDelegationCardMobileState() {
  return {
    ...CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard,
    liveLabel: CHAT_RUNTIME_PRESENTATION.delegation.liveLabel,
  } as const
}

export function getChatRuntimeDelegationCardMobileColors(
  colors: ChatRuntimeDelegationCardMobileColorPalette,
): ChatRuntimeDelegationCardMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard
  return {
    card: {
      borderColor: hexToRgba(colors[surface.borderColorToken], surface.borderAlpha),
      backgroundColor: hexToRgba(colors[surface.backgroundColorToken], surface.backgroundAlpha),
    },
    title: {
      color: colors[surface.titleColorToken],
    },
    liveText: {
      color: colors[surface.liveColorToken],
    },
    subtitle: {
      color: colors[surface.subtitleColorToken],
    },
    meta: {
      color: colors[surface.metaColorToken],
    },
    conversationPreview: {
      borderColor: hexToRgba(colors[surface.borderColorToken], surface.conversationPreviewBorderAlpha),
      backgroundColor: hexToRgba(
        colors[surface.backgroundColorToken],
        surface.conversationPreviewBackgroundAlpha,
      ),
    },
    conversationPreviewContent: {
      color: colors[surface.conversationPreviewContentColorToken],
    },
    conversationPreviewTimestamp: {
      color: colors[surface.conversationPreviewTimestampColorToken],
    },
    conversationPreviewMore: {
      color: colors[surface.conversationPreviewMoreColorToken],
    },
    toolPreview: {
      borderColor: hexToRgba(colors[surface.borderColorToken], surface.toolPreviewBorderAlpha),
      backgroundColor: hexToRgba(colors[surface.backgroundColorToken], surface.toolPreviewBackgroundAlpha),
    },
    toolPreviewLabel: {
      color: colors[surface.toolPreviewLabelColorToken],
    },
    toolPreviewName: {
      color: colors[surface.toolPreviewNameColorToken],
    },
    toolPreviewMore: {
      color: colors[surface.toolPreviewMoreColorToken],
    },
  }
}

export function getChatRuntimeDelegationCardMobileRenderState({
  colors,
}: ChatRuntimeDelegationCardMobileRenderStateInput): ChatRuntimeDelegationCardMobileRenderState {
  return {
    surface: getChatRuntimeDelegationCardMobileState(),
    colors: getChatRuntimeDelegationCardMobileColors(colors),
  }
}

export function createChatRuntimeDelegationCardMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatRuntimeDelegationCardMobileStyleSlotsInput): ChatRuntimeDelegationCardMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    card: {
      gap: spacing[surface.gap],
      padding: spacing[surface.padding],
      borderRadius: radius[surface.borderRadius],
      borderWidth: surface.borderWidth,
      borderColor: colors.card.borderColor,
      backgroundColor: colors.card.backgroundColor,
    },
    header: {
      flexDirection: surface.headerFlexDirection,
      alignItems: surface.headerAlignItems,
      gap: spacing[surface.headerGap],
      minWidth: surface.headerMinWidth,
    },
    title: {
      flex: surface.titleFlex,
      minWidth: surface.titleMinWidth,
      color: colors.title.color,
      fontSize: surface.titleFontSize,
      fontWeight: surface.titleFontWeight,
    },
    statusBadge: {
      flexShrink: surface.statusFlexShrink,
      borderWidth: surface.statusBorderWidth,
      borderRadius: radius[surface.statusBorderRadius],
      paddingHorizontal: spacing[surface.statusPaddingHorizontal],
      paddingVertical: surface.statusPaddingVertical,
    },
    statusText: {
      fontSize: surface.statusFontSize,
      fontWeight: surface.statusFontWeight,
    },
    liveText: {
      color: colors.liveText.color,
      fontSize: surface.metaFontSize,
      lineHeight: surface.metaLineHeight,
      fontWeight: surface.statusFontWeight,
    },
    subtitle: {
      color: colors.subtitle.color,
      fontSize: surface.subtitleFontSize,
      lineHeight: surface.subtitleLineHeight,
    },
    metaRow: {
      flexDirection: surface.metaFlexDirection,
      flexWrap: surface.metaFlexWrap,
      alignItems: surface.metaAlignItems,
      gap: spacing[surface.metaGap],
    },
    metaText: {
      color: colors.meta.color,
      fontSize: surface.metaFontSize,
      lineHeight: surface.metaLineHeight,
    },
    conversationPreview: {
      gap: surface.conversationPreviewGap,
      marginTop: surface.conversationPreviewMarginTop,
      paddingHorizontal: spacing[surface.conversationPreviewPaddingHorizontal],
      paddingVertical: surface.conversationPreviewPaddingVertical,
      borderRadius: radius[surface.conversationPreviewBorderRadius],
      borderWidth: surface.conversationPreviewBorderWidth,
      borderColor: colors.conversationPreview.borderColor,
      backgroundColor: colors.conversationPreview.backgroundColor,
    },
    conversationPreviewLine: {
      flexDirection: surface.conversationPreviewLineFlexDirection,
      alignItems: surface.conversationPreviewLineAlignItems,
      gap: spacing[surface.conversationPreviewLineGap],
      minWidth: surface.conversationPreviewLineMinWidth,
    },
    conversationPreviewRole: {
      minWidth: surface.conversationPreviewRoleMinWidth,
      maxWidth: surface.conversationPreviewRoleMaxWidth,
      paddingHorizontal: spacing[surface.conversationPreviewRolePaddingHorizontal],
      paddingVertical: surface.conversationPreviewRolePaddingVertical,
      borderRadius: radius[surface.conversationPreviewRoleBorderRadius],
      borderWidth: surface.conversationPreviewRoleBorderWidth,
      overflow: surface.conversationPreviewRoleOverflow,
      fontSize: surface.conversationPreviewRoleFontSize,
      fontWeight: surface.conversationPreviewRoleFontWeight,
    },
    conversationPreviewContent: {
      flex: surface.conversationPreviewContentFlex,
      minWidth: surface.conversationPreviewContentMinWidth,
      color: colors.conversationPreviewContent.color,
      fontSize: surface.conversationPreviewContentFontSize,
      lineHeight: surface.conversationPreviewContentLineHeight,
    },
    conversationPreviewTimestamp: {
      flexShrink: surface.conversationPreviewTimestampFlexShrink,
      color: colors.conversationPreviewTimestamp.color,
      fontSize: surface.conversationPreviewTimestampFontSize,
    },
    conversationPreviewMoreButton: {
      alignSelf: surface.conversationPreviewMoreButtonAlignSelf,
    },
    conversationPreviewMoreButtonPressed: {
      opacity: surface.conversationPreviewMoreButtonPressedOpacity,
    },
    conversationPreviewMore: {
      color: colors.conversationPreviewMore.color,
      fontSize: surface.conversationPreviewMoreFontSize,
      fontWeight: surface.conversationPreviewMoreFontWeight,
    },
    toolPreview: {
      gap: surface.toolPreviewGap,
      marginTop: surface.toolPreviewMarginTop,
      paddingHorizontal: spacing[surface.toolPreviewPaddingHorizontal],
      paddingVertical: surface.toolPreviewPaddingVertical,
      borderRadius: radius[surface.toolPreviewBorderRadius],
      borderWidth: surface.toolPreviewBorderWidth,
      borderColor: colors.toolPreview.borderColor,
      backgroundColor: colors.toolPreview.backgroundColor,
    },
    toolPreviewLabel: {
      color: colors.toolPreviewLabel.color,
      fontSize: surface.toolPreviewLabelFontSize,
      fontWeight: surface.toolPreviewLabelFontWeight,
    },
    toolPreviewLine: {
      flexDirection: surface.toolPreviewLineFlexDirection,
      alignItems: surface.toolPreviewLineAlignItems,
      gap: spacing[surface.toolPreviewLineGap],
      minWidth: surface.toolPreviewLineMinWidth,
    },
    toolPreviewStatusIcon: {
      minWidth: surface.toolPreviewStatusMinWidth,
      alignItems: surface.toolPreviewStatusAlignItems,
      justifyContent: surface.toolPreviewStatusJustifyContent,
      flexShrink: surface.toolPreviewStatusFlexShrink,
    },
    toolPreviewName: {
      flex: surface.toolPreviewNameFlex,
      minWidth: surface.toolPreviewNameMinWidth,
      color: colors.toolPreviewName.color,
      fontSize: surface.toolPreviewNameFontSize,
    },
    toolPreviewMoreButton: {
      alignSelf: surface.toolPreviewMoreButtonAlignSelf,
    },
    toolPreviewMoreButtonPressed: {
      opacity: surface.toolPreviewMoreButtonPressedOpacity,
    },
    toolPreviewMore: {
      color: colors.toolPreviewMore.color,
      fontSize: surface.toolPreviewMoreFontSize,
      fontWeight: surface.toolPreviewMoreFontWeight,
    },
  }
}

export function getChatRuntimeDesktopSurfaceState(): typeof CHAT_RUNTIME_SURFACE_PRESENTATION.desktop {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.desktop
}

export function getChatRuntimeDelegationStatusDesktopClassNames(status: string) {
  const statusKey =
    status === "completed"
      ? "completed"
      : status === "failed"
        ? "failed"
        : status === "cancelled"
          ? "cancelled"
          : "active"

  return CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.statusClassNames[statusKey]
}

export function getChatRuntimeDelegationStatusMobileColors(
  status: string,
  colors: ChatSessionStatusMobileColorPalette,
): ChatSessionStatusMobileColors {
  const statusKey =
    status === "completed"
      ? "completed"
      : status === "failed" || status === "cancelled"
        ? "failed"
        : status === "pending" || status === "spawning" || status === "running"
          ? "active"
          : "default"
  const statusSurface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.statuses[statusKey]
  const color = colors[statusSurface.colorToken]

  return {
    backgroundColor: hexToRgba(color, statusSurface.backgroundAlpha),
    borderColor: hexToRgba(color, statusSurface.borderAlpha),
    textColor: color,
  }
}

export function getChatRuntimeDelegationStatusMobileRenderState({
  status,
  colors,
}: ChatRuntimeDelegationStatusMobileRenderStateInput): ChatRuntimeDelegationStatusMobileRenderState {
  const resolvedColors = getChatRuntimeDelegationStatusMobileColors(status, colors)

  return {
    colors: resolvedColors,
    styles: getChatSessionStatusMobileStyleState(resolvedColors),
  }
}

export function getChatRuntimeDelegationConversationPreviewRoleMobileColors(
  role: ChatRuntimeDelegationConversationPreviewRole,
  colors: ChatRuntimeDelegationConversationPreviewRoleColorPalette,
): ChatSessionStatusMobileColors {
  const roleColorToken =
    CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleColorTokens[role]
  const color = colors[roleColorToken]

  return {
    backgroundColor: hexToRgba(
      color,
      CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleBackgroundAlpha,
    ),
    borderColor: hexToRgba(
      color,
      CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleBorderAlpha,
    ),
    textColor: color,
  }
}

export function getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
  colors: ChatSessionStatusMobileColors,
): ChatRuntimeDelegationConversationPreviewRoleMobileStyleState {
  return {
    backgroundColor: colors.backgroundColor,
    borderColor: colors.borderColor,
    color: colors.textColor,
  }
}

export function getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots(
  colors: ChatRuntimeDelegationConversationPreviewRoleColorPalette,
): ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots {
  return {
    user: getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
      getChatRuntimeDelegationConversationPreviewRoleMobileColors("user", colors),
    ),
    assistant: getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
      getChatRuntimeDelegationConversationPreviewRoleMobileColors("assistant", colors),
    ),
    tool: getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
      getChatRuntimeDelegationConversationPreviewRoleMobileColors("tool", colors),
    ),
  }
}

export function formatChatRuntimeDelegationAccessibilityLabel(input: {
  agentName: string
  statusLabel: string
  subtitle?: string | null
  sourceLabel?: string | null
  trackingLabel?: string | null
  messageCount?: number
}): string {
  return [
    CHAT_RUNTIME_PRESENTATION.delegation.title,
    input.agentName,
    input.statusLabel,
    input.subtitle,
    input.sourceLabel,
    input.trackingLabel,
    typeof input.messageCount === "number" && input.messageCount > 0
      ? formatChatRuntimeDelegationMessageCount(input.messageCount)
      : "",
  ].filter(Boolean).join(". ")
}

export function getChatRuntimeTurnDurationTitle(
  scope: ChatRuntimeTurnDurationScope,
  isLive: boolean,
): string {
  if (scope === "total") {
    return isLive
      ? CHAT_RUNTIME_PRESENTATION.turnDuration.liveTotalTitle
      : CHAT_RUNTIME_PRESENTATION.turnDuration.totalTitle
  }

  return isLive
    ? CHAT_RUNTIME_PRESENTATION.turnDuration.liveMessageTitle
    : CHAT_RUNTIME_PRESENTATION.turnDuration.messageTitle
}

export function formatChatRuntimeTurnDurationAccessibilityLabel(
  scope: ChatRuntimeTurnDurationScope,
  isLive: boolean,
  durationLabel: string,
): string {
  const title = getChatRuntimeTurnDurationTitle(scope, isLive)
  const normalizedDurationLabel = durationLabel.trim()
  return normalizedDurationLabel ? `${title}: ${normalizedDurationLabel}` : title
}

export function getChatRuntimeTurnDurationBadgeState(
  input: ChatRuntimeTurnDurationBadgeStateInput,
): ChatRuntimeTurnDurationBadgeState {
  const durationMs = input.durationMs
  const isLive = input.isLive === true
  const canShow = input.scope === "total"
    ? typeof durationMs === "number" && durationMs > 0
    : shouldShowChatMessageTurnDurationBadge({
        role: input.role,
        durationMs,
      })

  if (!canShow) {
    return {
      canShow: false,
      label: null,
      title: null,
      accessibilityRole: "text",
      accessibilityLabel: null,
      isLive,
    }
  }

  const label = formatTurnDuration(durationMs ?? 0)
  const title = getChatRuntimeTurnDurationTitle(input.scope, isLive)

  return {
    canShow: true,
    label,
    title,
    accessibilityRole: "text",
    accessibilityLabel: formatChatRuntimeTurnDurationAccessibilityLabel(input.scope, isLive, label),
    isLive,
  }
}

export function getChatRuntimeTurnDurationMobileIconState(
  input: ChatRuntimeTurnDurationMobileIconStateInput = {},
): ChatRuntimeTurnDurationMobileIconState {
  const isLive = input.isLive === true
  return {
    isLive,
    name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
    size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
    colorToken: isLive
      ? CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveColorToken
      : CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.colorToken,
  }
}

export function getChatRuntimeTurnDurationHeaderMobileBadgeState(
  input: ChatRuntimeTurnDurationHeaderMobileBadgeStateInput = {},
): ChatRuntimeTurnDurationHeaderMobileBadgeState {
  const chipSurface = CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip
  const badgeSurface = CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge
  const isLive = input.isLive === true

  return {
    numberOfLines: chipSurface.numberOfLines,
    flexDirection: badgeSurface.flexDirection,
    alignItems: badgeSurface.alignItems,
    justifyContent: badgeSurface.justifyContent,
    gap: badgeSurface.gap,
    minHeight: badgeSurface.minHeight,
    maxWidth: chipSurface.maxWidth,
    paddingHorizontal: badgeSurface.paddingHorizontal,
    borderRadius: badgeSurface.borderRadius,
    backgroundColorToken: isLive
      ? badgeSurface.liveBackgroundColorToken
      : badgeSurface.backgroundColorToken,
    backgroundAlpha: isLive ? badgeSurface.liveBackgroundAlpha : badgeSurface.backgroundAlpha,
    marginHorizontal: chipSurface.marginHorizontal,
    flexShrink: badgeSurface.flexShrink,
    opacity: isLive ? badgeSurface.liveOpacity : badgeSurface.opacity,
    fontFamilyByPlatform: badgeSurface.fontFamilyByPlatform,
    fontSize: badgeSurface.fontSize,
    lineHeight: badgeSurface.lineHeight,
    fontWeight: badgeSurface.fontWeight,
    colorToken: isLive ? badgeSurface.liveColorToken : badgeSurface.colorToken,
  }
}

export function getChatRuntimeTurnDurationHeaderMobileBadgeColors(
  input: ChatRuntimeTurnDurationHeaderMobileBadgeStateInput,
  colors: ChatRuntimeTurnDurationHeaderMobileBadgeColorPalette,
): ChatRuntimeTurnDurationHeaderMobileBadgeColors {
  const badge = getChatRuntimeTurnDurationHeaderMobileBadgeState(input)
  const icon = getChatRuntimeTurnDurationMobileIconState(input)

  return {
    chip: {
      backgroundColor: hexToRgba(colors[badge.backgroundColorToken], badge.backgroundAlpha),
    },
    text: {
      color: colors[badge.colorToken],
    },
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatRuntimeTurnDurationHeaderMobileRenderState({
  durationMs,
  isLive = false,
  colors,
}: ChatRuntimeTurnDurationHeaderMobileRenderStateInput): ChatRuntimeTurnDurationHeaderMobileRenderState {
  const badgeState = getChatRuntimeTurnDurationBadgeState({
    scope: "total",
    durationMs,
    isLive,
  })
  const badge = getChatRuntimeTurnDurationHeaderMobileBadgeState({ isLive: badgeState.isLive })
  const resolvedColors = getChatRuntimeTurnDurationHeaderMobileBadgeColors({ isLive: badgeState.isLive }, colors)
  const icon = getChatRuntimeTurnDurationMobileIconState({ isLive: badgeState.isLive })

  return {
    shouldRender: badgeState.canShow,
    badge,
    colors: resolvedColors,
    label: badgeState.label ?? "",
    accessibilityRole: badgeState.accessibilityRole,
    accessibilityLabel: badgeState.accessibilityLabel ?? "",
    isLive: badgeState.isLive,
    icon: {
      name: icon.name,
      size: icon.size,
      color: resolvedColors.icon.color,
    },
  }
}

export function createChatRuntimeTurnDurationHeaderMobileStyleSlots({
  renderState,
  platform,
}: ChatRuntimeTurnDurationHeaderMobileStyleSlotsInput): ChatRuntimeTurnDurationHeaderMobileStyleSlots {
  const { badge, colors } = renderState

  return {
    chip: {
      flexDirection: badge.flexDirection,
      alignItems: badge.alignItems,
      justifyContent: badge.justifyContent,
      gap: badge.gap,
      minHeight: badge.minHeight,
      maxWidth: badge.maxWidth,
      paddingHorizontal: badge.paddingHorizontal,
      borderRadius: badge.borderRadius,
      backgroundColor: colors.chip.backgroundColor,
      marginHorizontal: badge.marginHorizontal,
      flexShrink: badge.flexShrink,
      opacity: badge.opacity,
    },
    text: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        badge.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: badge.fontSize,
      lineHeight: badge.lineHeight,
      fontWeight: badge.fontWeight,
      color: colors.text.color,
    },
  }
}

export function getChatRuntimeTurnDurationMessageMobileRenderState({
  role,
  durationMs,
  isLive = false,
  colors,
}: ChatRuntimeTurnDurationMessageMobileRenderStateInput): ChatRuntimeTurnDurationMessageMobileRenderState {
  const badgeState = getChatRuntimeTurnDurationBadgeState({
    scope: "message",
    role,
    durationMs,
    isLive,
  })
  const badge = getChatMessageActionMobileTurnDurationBadgeState({ isLive: badgeState.isLive })
  const resolvedColors = getChatMessageActionMobileTurnDurationBadgeColors({ isLive: badgeState.isLive }, colors)
  const icon = getChatRuntimeTurnDurationMobileIconState({ isLive: badgeState.isLive })
  const iconColors = getChatMessageActionMobileIconColors(icon, colors)

  return {
    shouldRender: badgeState.canShow,
    badge,
    colors: resolvedColors,
    label: badgeState.label ?? "",
    accessibilityRole: badgeState.accessibilityRole,
    accessibilityLabel: badgeState.accessibilityLabel ?? "",
    isLive: badgeState.isLive,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.color,
    },
  }
}

export function createChatRuntimeTurnDurationMessageMobileStyleSlots({
  renderState,
  platform,
}: ChatRuntimeTurnDurationMessageMobileStyleSlotsInput): ChatRuntimeTurnDurationMessageMobileStyleSlots {
  const { badge, colors } = renderState

  return {
    badge: {
      alignSelf: badge.alignSelf,
      flexDirection: badge.flexDirection,
      minHeight: badge.minHeight,
      marginTop: badge.marginTop,
      paddingHorizontal: badge.paddingHorizontal,
      borderRadius: badge.borderRadius,
      backgroundColor: colors.backgroundColor,
      alignItems: badge.alignItems,
      justifyContent: badge.justifyContent,
      gap: badge.gap,
      flexShrink: badge.flexShrink,
      opacity: badge.opacity,
    },
    text: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        badge.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: badge.fontSize,
      lineHeight: badge.lineHeight,
      fontWeight: badge.fontWeight,
      color: colors.color,
    },
  }
}

export function createChatRuntimeMessageActionButtonMobileStyleSlots({
  renderState,
}: ChatRuntimeMessageActionButtonMobileStyleSlotsInput): ChatRuntimeMessageActionButtonMobileStyleSlots {
  const { button, colors } = renderState

  return {
    button: {
      alignSelf: button.alignSelf,
      width: button.width,
      height: button.height,
      marginTop: button.marginTop,
      borderRadius: button.borderRadius,
      backgroundColor: colors.backgroundColor,
      alignItems: button.alignItems,
      justifyContent: button.justifyContent,
      flexShrink: button.flexShrink,
    },
    pressed: {
      opacity: button.pressedOpacity,
    },
    disabled: {
      opacity: button.disabledOpacity,
    },
  }
}

export function createChatRuntimeMessageActionRowMobileStyleSlot({
  row,
  spacing,
}: ChatRuntimeMessageActionRowMobileStyleSlotInput): ChatRuntimeMessageActionRowMobileStyleSlot {
  return {
    flexDirection: row.flexDirection,
    alignItems: row.alignItems,
    justifyContent: row.justifyContent,
    marginTop: row.marginTop,
    gap: spacing[row.gap],
  }
}

export function createChatRuntimeToolExecutionCompactMobileStyleSlots({
  renderState,
  radius,
  platform,
}: ChatRuntimeToolExecutionCompactMobileStyleSlotsInput): ChatRuntimeToolExecutionCompactMobileStyleSlots {
  const surface = renderState.surface
  const statusColors = renderState.statusColors

  return {
    container: {
      paddingVertical: surface.container.paddingVertical,
      paddingHorizontal: surface.container.paddingHorizontal,
      borderRadius: radius[surface.container.borderRadius],
      gap: surface.container.gap,
    },
    line: {
      flexDirection: surface.line.flexDirection,
      alignItems: surface.line.alignItems,
      gap: surface.line.gap,
      paddingVertical: surface.line.paddingVertical,
      overflow: surface.line.overflow,
    },
    leadingIcon: {
      width: surface.toolIcon.width,
      alignItems: surface.iconCell.alignItems,
      justifyContent: surface.iconCell.justifyContent,
      flexShrink: surface.iconCell.flexShrink,
    },
    pressed: {
      opacity: surface.pressedOpacity,
    },
    name: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.name.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.name.fontSize,
      fontWeight: surface.name.fontWeight,
      flexShrink: surface.name.flexShrink,
      minWidth: surface.name.minWidth,
      color: statusColors.idle,
    },
    namePending: {
      color: statusColors.pending,
    },
    nameSuccess: {
      color: statusColors.success,
    },
    nameError: {
      color: statusColors.error,
    },
    statusIndicator: {
      width: surface.statusIcon.width,
      alignItems: surface.iconCell.alignItems,
      justifyContent: surface.iconCell.justifyContent,
      flexShrink: surface.iconCell.flexShrink,
    },
    toggleIcon: {
      width: surface.toggleIcon.width,
      alignItems: surface.iconCell.alignItems,
      justifyContent: surface.iconCell.justifyContent,
      flexShrink: surface.iconCell.flexShrink,
    },
    statusPending: {
      color: statusColors.pending,
    },
    statusSuccess: {
      color: statusColors.success,
    },
    statusError: {
      color: statusColors.error,
    },
  }
}

export function createChatRuntimeToolExecutionDetailMobileStyleSlots({
  renderState,
  spacing,
  radius,
  platform,
}: ChatRuntimeToolExecutionDetailMobileStyleSlotsInput) {
  const surface = renderState.surface
  const colors = renderState.colors
  const contentColors = colors.content

  const codeBlock = {
    fontFamily: resolveChatRuntimeMobileFontFamily(
      surface.codeBlock.fontFamilyByPlatform,
      platform ?? "",
    ),
    fontSize: surface.codeBlock.fontSize,
    color: contentColors.codeBlock.color,
    backgroundColor: contentColors.codeBlock.backgroundColor,
    padding: surface.codeBlock.padding,
    borderRadius: radius[surface.codeBlock.borderRadius],
  }

  const scroll = {
    maxHeight: surface.scroll.collapsedMaxHeight,
    borderRadius: radius[surface.scroll.borderRadius],
    overflow: surface.scroll.overflow,
  }

  const expandedScroll = {
    maxHeight: surface.scroll.expandedMaxHeight,
    borderRadius: radius[surface.scroll.borderRadius],
    overflow: surface.scroll.overflow,
  }

  return {
    card: {
      marginTop: surface.card.marginTop,
      borderRadius: radius[surface.card.borderRadius],
      borderLeftWidth: surface.card.borderLeftWidth,
      ...colors.byState.idle,
      overflow: surface.card.overflow,
    },
    pending: colors.byState.pending,
    success: colors.byState.success,
    error: colors.byState.error,
    expandedContainer: {
      position: surface.expandedContainer.position,
    },
    collapseTopButton: {
      marginBottom: surface.collapseButton.topMarginBottom,
    },
    collapseBottomButton: {
      marginTop: surface.collapseButton.bottomMarginTop,
    },
    paramsSection: {
      paddingHorizontal: spacing[surface.blockSection.paddingHorizontal],
      paddingVertical: surface.blockSection.paddingVertical,
    },
    callSection: {
      marginBottom: spacing[surface.section.marginBottom],
      paddingBottom: spacing[surface.section.paddingBottom],
      borderBottomWidth: surface.section.borderBottomWidth,
      borderBottomColor: contentColors.section.borderBottomColor,
    },
    toolName: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.toolName.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontWeight: surface.toolName.fontWeight,
      color: contentColors.toolName.color,
      fontSize: surface.toolName.fontSize,
      flex: surface.toolName.flex,
    },
    callHeader: {
      flexDirection: surface.header.flexDirection,
      alignItems: surface.header.alignItems,
      justifyContent: surface.header.justifyContent,
      paddingVertical: spacing[surface.header.paddingVertical],
      marginBottom: spacing[surface.header.marginBottom],
      minHeight: surface.header.minHeight,
    },
    callHeaderPressed: {
      opacity: surface.header.pressedOpacity,
    },
    expandHint: {
      flexDirection: surface.expandHint.flexDirection,
      alignItems: surface.expandHint.alignItems,
      gap: surface.expandHint.gap,
    },
    expandHintText: {
      fontSize: surface.expandHint.fontSize,
      color: contentColors.expandHintText.color,
      fontWeight: surface.expandHint.fontWeight,
    },
    sectionLabel: {
      fontSize: surface.sectionLabel.fontSize,
      fontWeight: surface.sectionLabel.fontWeight,
      color: contentColors.sectionLabel.color,
      marginBottom: surface.sectionLabel.marginBottom,
      textTransform: surface.sectionLabel.textTransform,
      letterSpacing: surface.sectionLabel.letterSpacing,
    },
    detailHeaderRow: {
      flexDirection: surface.detailHeaderRow.flexDirection,
      alignItems: surface.detailHeaderRow.alignItems,
      justifyContent: surface.detailHeaderRow.justifyContent,
      gap: surface.detailHeaderRow.gap,
      marginBottom: surface.detailHeaderRow.marginBottom,
    },
    payloadMetaRow: {
      flexDirection: surface.payloadMeta.flexDirection,
      alignItems: surface.payloadMeta.alignItems,
      minWidth: surface.payloadMeta.minWidth,
      gap: surface.payloadMeta.gap,
      marginBottom: surface.payloadMeta.marginBottom,
    },
    payloadType: {
      fontSize: surface.payloadType.fontSize,
      fontWeight: surface.payloadType.fontWeight,
      opacity: surface.payloadType.opacity,
      color: contentColors.payloadType.color,
    },
    payloadPreview: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.payloadPreview.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.payloadPreview.fontSize,
      lineHeight: surface.payloadPreview.lineHeight,
      paddingHorizontal: surface.payloadPreview.paddingHorizontal,
      paddingVertical: surface.payloadPreview.paddingVertical,
      borderRadius: radius[surface.payloadPreview.borderRadius],
      backgroundColor: colors.payloadPreview.backgroundColor,
      color: colors.payloadPreview.color,
      marginBottom: surface.result.headerMarginBottom,
    },
    copyButton: {
      minHeight: surface.copyButton.minHeight,
      paddingHorizontal: surface.copyButton.paddingHorizontal,
      paddingVertical: surface.copyButton.paddingVertical,
      borderRadius: radius[surface.copyButton.borderRadius],
      backgroundColor: colors.copyButton.backgroundColor,
      flexDirection: surface.copyButton.flexDirection,
      alignItems: surface.copyButton.alignItems,
      justifyContent: surface.copyButton.justifyContent,
      gap: surface.copyButton.gap,
      flexShrink: surface.copyButton.flexShrink,
    },
    copyButtonPressed: {
      opacity: surface.copyButton.pressedOpacity,
    },
    copyButtonText: {
      fontSize: surface.copyButtonText.fontSize,
      fontWeight: surface.copyButtonText.fontWeight,
      color: colors.copyButton.textColor,
    },
    paramsScroll: scroll,
    paramsScrollExpanded: expandedScroll,
    paramsCode: codeBlock,
    responsePendingText: {
      fontSize: surface.pendingText.fontSize,
      fontStyle: surface.pendingText.fontStyle,
      color: contentColors.pendingText.color,
      textAlign: surface.pendingText.textAlign,
      paddingVertical: surface.pendingText.paddingVertical,
    },
    responsePendingRow: {
      flexDirection: surface.pendingRow.flexDirection,
      alignItems: surface.pendingRow.alignItems,
      justifyContent: surface.pendingRow.justifyContent,
      gap: surface.pendingRow.gap,
      paddingVertical: surface.pendingRow.paddingVertical,
    },
    resultItem: {
      marginBottom: surface.result.itemMarginBottom,
    },
    resultHeader: {
      flexDirection: surface.resultHeader.flexDirection,
      alignItems: surface.resultHeader.alignItems,
      justifyContent: surface.resultHeader.justifyContent,
      marginBottom: surface.result.headerMarginBottom,
      gap: surface.resultHeader.gap,
    },
    resultHeaderMeta: {
      flexDirection: surface.resultHeaderMeta.flexDirection,
      alignItems: surface.resultHeaderMeta.alignItems,
      gap: surface.resultHeaderMeta.gap,
      flexShrink: surface.resultHeaderMeta.flexShrink,
      minWidth: surface.resultHeaderMeta.minWidth,
    },
    resultCharCount: {
      fontSize: surface.characterCount.fontSize,
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.characterCount.fontFamilyByPlatform,
        platform ?? "",
      ),
      color: contentColors.characterCount.color,
      opacity: surface.characterCount.opacity,
    },
    resultBadge: {
      flexDirection: surface.badge.flexDirection,
      alignItems: surface.badge.alignItems,
      gap: surface.badge.gap,
      paddingHorizontal: surface.badge.paddingHorizontal,
      paddingVertical: surface.badge.paddingVertical,
      borderRadius: radius[surface.badge.borderRadius],
    },
    resultBadgeSuccess: {
      backgroundColor: colors.badge.success.backgroundColor,
    },
    resultBadgeError: {
      backgroundColor: colors.badge.error.backgroundColor,
    },
    resultBadgeText: {
      fontSize: surface.badge.fontSize,
      fontWeight: surface.badge.fontWeight,
    },
    resultBadgeTextSuccess: {
      color: colors.badge.success.color,
    },
    resultBadgeTextError: {
      color: colors.badge.error.color,
    },
    resultScroll: scroll,
    resultScrollExpanded: expandedScroll,
    resultCode: codeBlock,
    resultErrorSection: {
      marginTop: surface.result.errorSectionMarginTop,
    },
    resultErrorLabel: {
      fontSize: surface.error.labelFontSize,
      fontWeight: surface.error.labelFontWeight,
      color: colors.error.color,
      marginBottom: surface.error.labelMarginBottom,
    },
    resultErrorText: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.codeBlock.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.codeBlock.fontSize,
      color: colors.error.color,
      backgroundColor: colors.error.backgroundColor,
      padding: surface.codeBlock.padding,
      borderRadius: radius[surface.codeBlock.borderRadius],
    },
  }
}

export function createChatRuntimeToolActivityGroupMobileStyleSlots({
  renderState,
  spacing,
  radius,
  platform,
}: ChatRuntimeToolActivityGroupMobileStyleSlotsInput): ChatRuntimeToolActivityGroupMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    collapsed: {
      paddingVertical: surface.collapsed.paddingVertical,
      paddingHorizontal: spacing[surface.collapsed.paddingHorizontal],
      borderRadius: radius[surface.collapsed.borderRadius],
      borderWidth: surface.collapsed.borderWidth,
      borderColor: colors.collapsed.borderColor,
      borderLeftWidth: surface.collapsed.borderLeftWidth,
      borderLeftColor: colors.collapsed.borderLeftColor,
      backgroundColor: colors.collapsed.backgroundColor,
      marginBottom: surface.collapsed.marginBottom,
    },
    pressed: {
      opacity: surface.pressedOpacity,
    },
    headerRow: {
      flexDirection: surface.headerRow.flexDirection,
      alignItems: surface.headerRow.alignItems,
      gap: surface.headerRow.gap,
      overflow: surface.headerRow.overflow,
    },
    countBadge: {
      minWidth: surface.countBadge.minWidth,
      paddingHorizontal: surface.countBadge.paddingHorizontal,
      paddingVertical: surface.countBadge.paddingVertical,
      borderRadius: radius[surface.countBadge.borderRadius],
      alignItems: surface.countBadge.alignItems,
      justifyContent: surface.countBadge.justifyContent,
      backgroundColor: colors.countBadge.backgroundColor,
    },
    countBadgeText: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.countBadge.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.countBadge.fontSize,
      fontWeight: surface.countBadge.fontWeight,
      color: colors.countBadge.color,
    },
    previewLine: {
      fontFamily: resolveChatRuntimeMobileFontFamily(
        surface.preview.fontFamilyByPlatform,
        platform ?? "",
      ),
      fontSize: surface.preview.fontSize,
      color: colors.preview.color,
      flexShrink: surface.preview.flexShrink,
      minWidth: surface.preview.minWidth,
    },
    footerButton: {
      alignSelf: surface.footerButton.alignSelf,
      flexDirection: surface.footerButton.flexDirection,
      alignItems: surface.footerButton.alignItems,
      gap: surface.footerButton.gap,
      marginTop: surface.footerButton.marginTop,
      marginBottom: surface.footerButton.marginBottom,
      paddingHorizontal: spacing[surface.footerButton.paddingHorizontal],
      paddingVertical: surface.footerButton.paddingVertical,
      borderRadius: radius[surface.footerButton.borderRadius],
    },
    footerText: {
      fontSize: surface.footerText.fontSize,
      fontWeight: surface.footerText.fontWeight,
      color: colors.footerText.color,
    },
  }
}

export function createChatRuntimeMessageMobileStyleSlots({
  renderState,
  spacing,
  radius,
  borderWidths,
}: ChatRuntimeMessageMobileStyleSlotsInput) {
  const surface = renderState.surface
  const contentLayout = renderState.contentLayout
  const collapsedPreview = renderState.collapsedPreview
  const colors = renderState.colors

  return {
    message: {
      paddingHorizontal: spacing[surface.paddingHorizontal],
      paddingVertical: spacing[surface.paddingVertical],
      marginBottom: spacing[surface.marginBottom],
      width: surface.width,
      borderWidth: borderWidths[surface.borderWidth],
      borderRadius: radius[surface.borderRadius],
    },
    user: colors.tones.user,
    assistant: colors.tones.assistant,
    assistantFinal: colors.tones.assistant_final,
    tool: colors.tones.tool,
    contentRow: {
      flexDirection: contentLayout.row.flexDirection,
      alignItems: contentLayout.row.alignItems,
      gap: spacing[contentLayout.row.gap],
      width: contentLayout.row.width,
    },
    contentBody: {
      flex: contentLayout.body.flex,
      minWidth: contentLayout.body.minWidth,
    },
    collapsedPreviewToggle: {
      flex: collapsedPreview.flex,
      minWidth: collapsedPreview.minWidth,
    },
    collapsedPreviewTogglePressed: {
      opacity: collapsedPreview.pressedOpacity,
    },
    collapsedPreview: {
      color: colors.collapsedPreview.text.color,
      fontSize: collapsedPreview.fontSize,
      lineHeight: collapsedPreview.lineHeight,
    },
  }
}

export function getChatRuntimeMessageThreadMobileStyleRenderState({
  colors,
}: ChatRuntimeMessageThreadMobileStyleRenderStateInput): ChatRuntimeMessageThreadMobileStyleRenderState {
  return {
    message: getChatMessageMobileRenderState({
      colors,
    }),
    action: getChatMessageActionMobileStyleRenderState({
      colors,
    }),
    turnDuration: {
      standard: getChatRuntimeTurnDurationMessageMobileRenderState({
        role: "user",
        durationMs: 1,
        colors,
      }),
      live: getChatRuntimeTurnDurationMessageMobileRenderState({
        role: "user",
        durationMs: 1,
        isLive: true,
        colors,
      }),
    },
  }
}

export function getChatRuntimeMessageThreadPresentationMobileRenderState({
  colors,
}: ChatRuntimeMessageThreadPresentationMobileRenderStateInput): ChatRuntimeMessageThreadPresentationMobileRenderState {
  const delegationCardRenderState = getChatRuntimeDelegationCardMobileRenderState({
    colors,
  })
  const toolExecutionDetailStyleState = getToolExecutionDetailMobileStyleRenderState({
    colors,
  })

  return {
    delegationSurface: delegationCardRenderState.surface,
    delegationRoleStyles: getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots(colors),
    toolPayloadPreviewNumberOfLines: toolExecutionDetailStyleState.payloadPreview.numberOfLines,
    pendingToolResultRenderState: getToolExecutionDetailMobilePendingResultRenderState({
      colors,
    }),
    toolExecutionEmptyStateRenderState: getToolExecutionDetailMobileEmptyStateRenderState(),
  }
}

export function getChatRuntimeThreadChromeMobileStyleRenderState({
  colors,
}: ChatRuntimeThreadChromeMobileStyleRenderStateInput): ChatRuntimeThreadChromeMobileStyleRenderState {
  return {
    compactToolExecution: getToolExecutionCompactMobileStyleRenderState({
      colors,
    }),
    toolExecutionDetail: getToolExecutionDetailMobileStyleRenderState({
      colors,
    }),
    toolActivityGroup: getToolActivityGroupMobileSurfaceRenderState({
      colors,
    }),
    toolApproval: getChatRuntimeToolApprovalMobileRenderState({
      toolName: "",
      colors,
    }),
    messageThread: getChatRuntimeMessageThreadMobileStyleRenderState({
      colors,
    }),
  }
}

export function getChatRuntimeConversationMessageMobileRenderState({
  toolResults,
  ...input
}: ChatRuntimeConversationMessageMobileRenderStateInput): ChatRuntimeConversationMessageMobileRenderState {
  const { hasErrors } = getToolExecutionSummaryDisplayState(toolResults)

  return getChatMessageMobileRenderState({
    ...input,
    hasErrors,
  })
}

export function getChatRuntimeConversationMessageActionsMobileRenderState({
  message,
  turnDuration,
  speech,
  branch,
  copy,
}: ChatRuntimeConversationMessageActionsMobileRenderStateInput): ChatRuntimeConversationMessageActionsMobileRenderState {
  const turnDurationRenderState = getChatRuntimeTurnDurationMessageMobileRenderState(turnDuration)
  const speechRenderState = getChatMessageSpeechMobileRenderState({
    ...speech,
    isVisible: message.content.speech.isVisible,
  })
  const branchRenderState = getChatRuntimeBranchMobileRenderState(branch)
  const copyRenderState = getChatMessageCopyMobileRenderState(copy)
  const expansionRenderState = message.expansion
  const availability = getChatMessageActionAvailabilityRenderState({
    turnDuration: turnDurationRenderState.shouldRender,
    speech: speechRenderState.canSpeak,
    branch: branchRenderState.canBranch,
    copy: copyRenderState.canCopy,
    expansion: expansionRenderState.canToggle,
  })

  return {
    turnDuration: turnDurationRenderState,
    speech: speechRenderState,
    branch: branchRenderState,
    copy: copyRenderState,
    expansion: expansionRenderState,
    availability,
    layout: getChatMessageActionLayoutRenderState({
      availability,
      renderState: message.content,
    }),
  }
}

export function getChatRuntimeConversationMessageRenderContextMobileState({
  message,
  messageIndex,
  isResponding,
  lastConversationContentMessageIndex,
  expandedMessages,
  resultOnlyToolLabel,
  colors,
}: ChatRuntimeConversationMessageRenderContextMobileStateInput): ChatRuntimeConversationMessageRenderContextMobileState {
  const messageDisplayState = getChatMessageDisplayState(message, {
    resultOnlyToolLabel,
  })
  const visibleMessageContent = messageDisplayState.visibleContent
  const renderedToolEntries = messageDisplayState.visibleToolEntries
  const displayToolCallCount = messageDisplayState.displayToolCallCount
  const isExpanded = getChatDisplayExpansionState(expandedMessages, messageIndex)
  const isLiveStreamingAssistantMessage = isChatMessageLiveStreamingConversationContent({
    isResponding,
    messageIndex,
    lastConversationContentMessageIndex,
    message,
    content: visibleMessageContent,
    displayToolCallCount,
  })

  return {
    visibleMessageContent,
    renderedToolEntries,
    displayToolCallCount,
    isExpanded,
    isLiveStreamingAssistantMessage,
    messageRenderState: getChatRuntimeConversationMessageMobileRenderState({
      role: message.role,
      isComplete: !isResponding,
      isLast: messageIndex === lastConversationContentMessageIndex,
      toolResults: renderedToolEntries.map((entry) => entry.result),
      content: visibleMessageContent,
      isExpanded,
      shouldCollapse: messageDisplayState.shouldCollapse,
      isToolOnly: messageDisplayState.isToolOnly,
      isLiveStreaming: isLiveStreamingAssistantMessage,
      colors,
    }),
    shouldRenderSurface: messageDisplayState.shouldRenderSurface,
  }
}

export function getChatRuntimeConversationToolActivityGroupRenderState({
  group,
  itemIndex,
  groupState,
  inheritedState,
  groupKey,
  inheritedKey,
  defaultExpanded,
  colors,
}: ChatRuntimeConversationToolActivityGroupRenderStateInput): ChatRuntimeConversationToolActivityGroupRenderState {
  return group
    ? getToolActivityGroupMobileRenderState({
        group,
        itemIndex,
        groupState,
        inheritedState,
        groupKey,
        inheritedKey,
        defaultExpanded,
        colors,
      })
    : null
}

export function getChatRuntimeConversationToolActivityGroupThreadState({
  group,
  groupRenderState,
  itemKey,
  onToggleGroup,
}: ChatRuntimeConversationToolActivityGroupThreadStateInput): ChatRuntimeConversationToolActivityGroupThreadState {
  return {
    groupOnlyThreadKey: groupRenderState?.shouldRenderCollapsedHeader
      ? `group-${groupRenderState.groupKey}`
      : itemKey,
    shouldRenderGroupOnlyThread: !!groupRenderState
      && (groupRenderState.shouldSkipCollapsedItem || groupRenderState.shouldRenderCollapsedHeader),
    onToggleGroup: group ? () => onToggleGroup(group) : undefined,
  }
}

export function getChatRuntimeConversationRuntimeThreadState<TBody>({
  itemKey,
  groupRenderState,
  groupThreadState,
  body,
}: ChatRuntimeConversationRuntimeThreadStateInput<TBody>): ChatRuntimeConversationRuntimeThreadState<TBody> {
  const isGroupOnlyThread = groupThreadState.shouldRenderGroupOnlyThread

  return {
    threadKey: isGroupOnlyThread ? groupThreadState.groupOnlyThreadKey : itemKey,
    groupRenderState,
    onToggleGroup: groupThreadState.onToggleGroup,
    body: isGroupOnlyThread ? null : body,
  }
}

export function getChatRuntimeConversationToolActivityGroupRuntimeThreadState(
  runtimeThreadInput: ChatRuntimeConversationToolActivityGroupRuntimeThreadStateInput,
): ChatRuntimeConversationToolActivityGroupRuntimeThreadState {
  return {
    ...getChatRuntimeConversationRuntimeThreadState({
      ...runtimeThreadInput,
      body: null,
    }),
    shouldRenderThread: runtimeThreadInput.groupThreadState.shouldRenderGroupOnlyThread,
  }
}

export function getChatRuntimeConversationToolActivityGroupThreadRenderState({
  group,
  itemKey,
  onToggleGroup,
  ...renderStateInput
}: ChatRuntimeConversationToolActivityGroupThreadRenderStateInput): ChatRuntimeConversationToolActivityGroupThreadRenderState {
  const groupRenderState = getChatRuntimeConversationToolActivityGroupRenderState({
    group,
    ...renderStateInput,
  })
  const groupThreadState = getChatRuntimeConversationToolActivityGroupThreadState({
    group,
    groupRenderState,
    itemKey,
    onToggleGroup,
  })

  return {
    groupRenderState,
    groupThreadState,
    groupOnlyThreadState: getChatRuntimeConversationToolActivityGroupRuntimeThreadState({
      itemKey,
      groupRenderState,
      groupThreadState,
    }),
  }
}

export function shouldRenderChatRuntimeConversationThread<
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
>({
  renderContext,
  body,
}: ChatRuntimeConversationThreadVisibilityInput<TBody>): boolean {
  return renderContext.shouldRenderSurface || body.bodyDisplayMode !== "conversation"
}

export function getChatRuntimeConversationMessageRuntimeThreadState<
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
>({
  renderContext,
  ...runtimeThreadInput
}: ChatRuntimeConversationMessageRuntimeThreadStateInput<TBody>): ChatRuntimeConversationMessageRuntimeThreadState<TBody> {
  return {
    ...getChatRuntimeConversationRuntimeThreadState(runtimeThreadInput),
    shouldRenderThread: shouldRenderChatRuntimeConversationThread({
      renderContext,
      body: runtimeThreadInput.body,
    }),
  }
}

export function getChatRuntimeConversationMessageThreadMobileState<
  TBodyInput extends ChatRuntimeConversationMessageThreadMobileBodyInput,
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
>({
  itemKey,
  groupRenderState,
  groupThreadState,
  lastConversationContentMessageIndex,
  expandedMessages,
  resultOnlyToolLabel,
  bodyInput,
  createBodyState,
}: ChatRuntimeConversationMessageThreadMobileStateInput<
  TBodyInput,
  TBody
>): ChatRuntimeConversationMessageRuntimeThreadState<TBody> {
  const renderContext = getChatRuntimeConversationMessageRenderContextMobileState({
    message: bodyInput.message,
    messageIndex: bodyInput.messageIndex,
    isResponding: bodyInput.isResponding,
    lastConversationContentMessageIndex,
    expandedMessages,
    resultOnlyToolLabel,
    colors: bodyInput.colors,
  })
  const body = createBodyState({
    ...bodyInput,
    renderContext,
  })

  return getChatRuntimeConversationMessageRuntimeThreadState({
    itemKey,
    groupRenderState,
    groupThreadState,
    renderContext,
    body,
  })
}

export function getChatRuntimeConversationItemThreadMobileState<
  TMessageThreadInput,
  TBody extends { bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode },
>({
  group,
  itemIndex,
  itemKey,
  groupState,
  inheritedState,
  groupKey,
  inheritedKey,
  defaultExpanded,
  colors,
  onToggleGroup,
  messageThreadInput,
  createMessageThreadState,
}: ChatRuntimeConversationItemThreadMobileStateInput<
  TMessageThreadInput,
  TBody
>): ChatRuntimeConversationRenderableRuntimeThreadState<TBody | null> {
  const {
    groupRenderState,
    groupThreadState,
    groupOnlyThreadState,
  } = getChatRuntimeConversationToolActivityGroupThreadRenderState({
    group,
    itemIndex,
    itemKey,
    groupState,
    inheritedState,
    groupKey,
    inheritedKey,
    defaultExpanded,
    colors,
    onToggleGroup,
  })

  if (groupOnlyThreadState.shouldRenderThread) {
    return groupOnlyThreadState
  }

  return createMessageThreadState({
    ...messageThreadInput,
    itemKey,
    groupRenderState,
    groupThreadState,
  })
}

export function getChatRuntimeConversationThreadListMobileState<
  TMessage extends ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike,
  TThread,
>({
  allMessages,
  messages,
  firstMessageIndex,
  groupByIndex,
  speakingMessageIndex,
  copiedMessageIndex,
  createThreadState,
}: ChatRuntimeConversationThreadListMobileStateInput<TMessage, TThread>): TThread[] {
  const lastConversationContentMessageIndex = findLastChatMessageConversationContentIndex(
    allMessages,
    (message) => message,
    (message) => hasVisibleChatMessageContent(message),
  )

  return messages.map((message, visibleIndex) => {
    const messageIndex = firstMessageIndex + visibleIndex

    return createThreadState({
      message,
      visibleIndex,
      messageIndex,
      itemIndex: messageIndex,
      itemKey: messageIndex,
      group: groupByIndex.get(messageIndex),
      isSpeaking: speakingMessageIndex === messageIndex,
      isCopied: copiedMessageIndex === messageIndex,
      lastConversationContentMessageIndex,
    })
  })
}

export function getChatRuntimeConversationRuntimeThreadListMobileState<
  TMessage extends ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike,
  TThread,
>({
  messages,
  visibleMessageCount,
  colors,
  resultOnlyToolLabel,
  createThreadState,
  ...threadListInput
}: ChatRuntimeConversationRuntimeThreadListMobileStateInput<
  TMessage,
  TThread
>): ChatRuntimeConversationRuntimeThreadListMobileState<TThread> {
  const {
    firstVisibleMessageIndex,
    visibleMessages,
    hiddenMessageCount,
  } = getChatRuntimeMessageHistoryWindowMobileDisplayState({
    messages,
    visibleMessageCount,
  })
  const presentation = getChatRuntimeMessageThreadPresentationMobileRenderState({
    colors,
  })
  const resolvedResultOnlyToolLabel =
    resultOnlyToolLabel ?? getChatRuntimeToolExecutionResultOnlyFallbackLabel()

  return {
    threadStates: getChatRuntimeConversationThreadListMobileState({
      ...threadListInput,
      allMessages: messages,
      messages: visibleMessages,
      firstMessageIndex: firstVisibleMessageIndex,
      createThreadState: (itemInput) => createThreadState({
        ...itemInput,
        presentation,
        resultOnlyToolLabel: resolvedResultOnlyToolLabel,
      }),
    }),
    visibleMessageCount: visibleMessages.length,
    totalMessageCount: messages.length,
    hiddenMessageCount,
  }
}

export function getChatRuntimeConversationContentMobileState<
  TColors extends ChatRuntimeStreamingContentMobileRenderStateInput["colors"],
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
>({
  messageIndex,
  visibleMessageContent,
  isStreaming,
  contentState,
  collapsedPreview,
  collapsedPreviewAction,
  colors,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  onToggleMessageExpansion,
}: ChatRuntimeConversationContentMobileStateInput<
  TColors,
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken
>): ChatRuntimeConversationContentMobileState<
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken
> {
  return {
    contentState,
    contentDisplayMode: getChatRuntimeConversationContentMobileDisplayMode(contentState),
    expanded: {
      streamingRenderState: getChatRuntimeStreamingContentMobileRenderState({
        isStreaming,
        content: visibleMessageContent,
        colors,
      }),
      markdownContent: visibleMessageContent,
      assetBaseUrl,
      assetAuthToken,
      spinnerSource,
    },
    collapsed: {
      renderState: collapsedPreview,
      actionState: collapsedPreviewAction,
      onPress: collapsedPreviewAction.canToggle
        ? () => onToggleMessageExpansion(messageIndex)
        : undefined,
    },
  }
}

export function createChatRuntimeConversationExpandedContentMobileProps<
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
>({
  streamingRenderState,
  markdownContent,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
}: ChatRuntimeConversationExpandedContentMobileProps<
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken
>): ChatRuntimeConversationExpandedContentMobileProps<
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken
> {
  return {
    streamingRenderState,
    markdownContent,
    assetBaseUrl,
    assetAuthToken,
    spinnerSource,
  }
}

export function createChatRuntimeConversationCollapsedPreviewMobileProps<
  TOnPress = () => void,
>({
  renderState,
  actionState,
  onPress,
}: ChatRuntimeConversationCollapsedPreviewMobileProps<TOnPress>): ChatRuntimeConversationCollapsedPreviewMobileProps<TOnPress> {
  return {
    renderState,
    actionState,
    onPress,
  }
}

export function getChatRuntimeConversationContentMobileDisplayMode(
  contentState: ChatRuntimeConversationContentMobileRenderState,
): ChatRuntimeConversationContentMobileDisplayMode {
  if (contentState.shouldRenderExpandedContent) return "expanded"
  if (contentState.shouldRenderCollapsedTextPreview) return "collapsed"
  return "hidden"
}

export function getChatRuntimeConversationThreadBodyMobileDisplayMode<
  TInlineActivity,
  TDelegation = unknown,
>({
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
}: ChatRuntimeConversationThreadBodyMobileDisplayModeInput<
  TInlineActivity,
  TDelegation
>): ChatRuntimeConversationThreadBodyMobileDisplayMode {
  if (retryStatus.renderState) return "retryStatus"
  if (delegationCard.isDelegation && delegationCard.delegation) return "delegationCard"
  if (toolApproval.cardState) return "toolApproval"
  if (inlineActivity) return "inlineActivity"
  return "conversation"
}

export function getChatRuntimeConversationRetryStatusMobileState<
  TRetryInfo extends ChatRuntimeRetryInfoLike | null | undefined =
    ChatRuntimeRetryInfoLike | null | undefined,
>({
  message,
  colors,
}: ChatRuntimeConversationRetryStatusMobileStateInput<TRetryInfo>): ChatRuntimeConversationRetryStatusMobileState {
  if (message.variant !== "retry") {
    return {
      renderState: null,
    }
  }

  const renderState = getChatRuntimeRetryStatusMobileRenderState({
    retryInfo: message.retryInfo,
    colors,
  })

  return {
    renderState: renderState.shouldRender ? renderState : null,
  }
}

export function createChatRuntimeConversationRetryStatusMobileProps({
  renderState,
}: ChatRuntimeConversationRetryStatusMobileState): ChatRuntimeConversationRetryStatusMobileProps | null {
  return renderState
    ? {
        renderState,
      }
    : null
}

export function getChatRuntimeConversationToolApprovalMobileState({
  message,
  expandedToolApprovals,
  pendingApprovalResponseId,
  colors,
  onToggleArguments,
  onRespondToToolApproval,
}: ChatRuntimeConversationToolApprovalMobileStateInput): ChatRuntimeConversationToolApprovalMobileState {
  const cardState = getChatRuntimeToolApprovalCardMobileRenderState({
    isApproval: message.variant === "approval",
    toolApproval: message.toolApproval,
    expandedToolApprovals,
    pendingApprovalResponseId,
    colors,
  })
  if (!cardState) {
    return {
      cardState: null,
    }
  }

  return {
    cardState: {
      ...cardState,
      onToggleArguments: () => onToggleArguments(cardState.approvalId),
      onDeny: () => { void onRespondToToolApproval(cardState.approvalId, false) },
      onApprove: () => { void onRespondToToolApproval(cardState.approvalId, true) },
    },
  }
}

export function createChatRuntimeConversationToolApprovalMobileProps({
  cardState,
}: ChatRuntimeConversationToolApprovalMobileState): ChatRuntimeConversationToolApprovalMobileProps | null {
  if (!cardState) return null

  return {
    renderState: cardState.renderState,
    toolName: cardState.toolName,
    argumentsPreview: cardState.argumentsPreview,
    argumentsContent: cardState.argumentsContent,
    onToggleArguments: cardState.onToggleArguments,
    onDeny: cardState.onDeny,
    onApprove: cardState.onApprove,
  }
}

export function getChatRuntimeConversationDelegationCardMobileState<
  TDelegation = unknown,
>({
  message,
  surface,
  toolEntries,
  displayToolCallCount,
  expandedDelegationConversationPreviews,
  expandedDelegationToolPreviews,
  roleStyles,
  colors,
  setExpandedDelegationConversationPreviews,
  setExpandedDelegationToolPreviews,
}: ChatRuntimeConversationDelegationCardMobileStateInput<TDelegation>): ChatRuntimeConversationDelegationCardMobileState<TDelegation> {
  return {
    isDelegation: message.variant === "delegation",
    surface,
    delegation: message.delegation,
    toolEntries,
    displayToolCallCount,
    expandedDelegationConversationPreviews,
    expandedDelegationToolPreviews,
    roleStyles,
    colors,
    onShowAllConversationPreview: (runId) => {
      setExpandedDelegationConversationPreviews((current) =>
        setChatDisplayExpansionState(current, runId, true),
      )
    },
    onShowAllToolPreview: (runId) => {
      setExpandedDelegationToolPreviews((current) =>
        setChatDisplayExpansionState(current, runId, true),
      )
    },
  }
}

export function getChatRuntimeDelegationCardMobilePresentationState({
  isDelegation,
  surface,
  delegation,
  toolEntries,
  displayToolCallCount,
  expandedDelegationConversationPreviews,
  expandedDelegationToolPreviews,
  roleStyles,
  colors,
}: ChatRuntimeDelegationCardMobilePresentationStateInput): ChatRuntimeDelegationCardMobilePresentationState | null {
  if (!isDelegation || !delegation) return null

  const isConversationPreviewExpanded = getChatDisplayExpansionState(
    expandedDelegationConversationPreviews,
    delegation.runId,
  )
  const isToolPreviewExpanded = getChatDisplayExpansionState(
    expandedDelegationToolPreviews,
    delegation.runId,
  )
  const cardState = getAgentDelegationCardState(
    delegation,
    toolEntries,
    {
      maxSubtitleLength: surface.subtitleMaxLength,
      conversationPreviewMaxRows: surface.conversationPreviewMaxRows,
      conversationPreviewMaxLength: surface.conversationPreviewMaxLength,
      includeAllConversationPreview: isConversationPreviewExpanded,
      toolPreviewMaxRows: surface.toolPreviewMaxRows,
      includeAllToolPreview: isToolPreviewExpanded,
    },
  )
  const { presentation } = cardState
  const messageCount = presentation.messageCount ?? 0
  const conversationPreviewState = cardState.conversationPreview
  const hiddenConversationCount = conversationPreviewState.hiddenCount
  const toolPreviewState = cardState.toolPreview
  const hiddenToolCount = toolPreviewState.hiddenCount
  const toolPreviewVisibilityRenderState = getChatRuntimeDelegationToolPreviewMobileVisibilityRenderState({
    displayToolCallCount,
  })

  return {
    runId: delegation.runId,
    surface,
    agentName: delegation.agentName,
    presentation,
    accessibilityLabel: formatChatRuntimeDelegationAccessibilityLabel({
      agentName: delegation.agentName,
      statusLabel: presentation.statusLabel,
      subtitle: presentation.subtitle,
      sourceLabel: presentation.sourceLabel,
      trackingLabel: presentation.trackingLabel,
      messageCount,
    }),
    messageCountLabel: messageCount > 0
      ? formatChatRuntimeDelegationMessageCount(messageCount)
      : null,
    statusStyles: getChatRuntimeDelegationStatusMobileRenderState({
      status: delegation.status,
      colors,
    }).styles,
    conversationPreview: {
      rows: conversationPreviewState.rows,
      roleStyles,
      hiddenCount: hiddenConversationCount,
      moreAction: getChatRuntimeDelegationConversationPreviewMoreActionState(hiddenConversationCount),
    },
    toolPreview: {
      shouldRender: toolPreviewVisibilityRenderState.shouldRender,
      label: formatChatRuntimeDelegationToolCallActivityLabel(displayToolCallCount),
      rows: getChatRuntimeDelegationToolPreviewRowsMobileRenderState({
        rows: toolPreviewState.rows,
        colors,
      }),
      hiddenCount: hiddenToolCount,
      moreAction: getChatRuntimeDelegationToolPreviewMoreActionState(hiddenToolCount),
    },
  }
}

export function createChatRuntimeDelegationCardMobileProps(
  cardInput: ChatRuntimeConversationDelegationCardMobileState<
    ACPDelegationProgress | null | undefined
  >,
): ChatRuntimeDelegationCardMobileProps | null {
  const presentationState = getChatRuntimeDelegationCardMobilePresentationState(cardInput)
  if (!presentationState) return null

  const {
    onShowAllConversationPreview,
    onShowAllToolPreview,
  } = cardInput

  return {
    ...presentationState,
    conversationPreview: {
      ...presentationState.conversationPreview,
      onShowAll: () => onShowAllConversationPreview(presentationState.runId),
    },
    toolPreview: {
      ...presentationState.toolPreview,
      onShowAll: () => onShowAllToolPreview(presentationState.runId),
    },
  }
}

export function getChatRuntimeConversationActionSetMobileState<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
>({
  message,
  messageRenderState,
  messageIndex,
  visibleMessageContent,
  turnDuration,
  conversationId,
  pendingBranchMessageIndex,
  isResponding,
  isSpeaking,
  isCopied,
  ttsEnabled,
  colors,
  styles,
  onSpeakMessage,
  onBranchMessage,
  onCopyMessage,
  onToggleMessageExpansion,
}: ChatRuntimeConversationActionSetMobileStateInput<
  TTurnDurationStyle,
  TSpeechStyle,
  TBranchStyle,
  TCopyStyle,
  TExpansionStyle
>): ChatRuntimeConversationActionSetMobileState<
  TTurnDurationStyle,
  TSpeechStyle,
  TBranchStyle,
  TCopyStyle,
  TExpansionStyle
> {
  const renderState = getChatRuntimeConversationMessageActionsMobileRenderState({
    message: messageRenderState,
    turnDuration: {
      role: message.role,
      durationMs: turnDuration?.durationMs,
      isLive: turnDuration?.isLive,
      colors,
    },
    speech: {
      role: message.role,
      content: visibleMessageContent,
      ttsEnabled,
      isSpeaking,
      colors,
    },
    branch: {
      conversationId,
      role: message.role,
      branchMessageIndex: message.branchMessageIndex,
      fallbackMessageIndex: messageIndex,
      pendingMessageIndex: pendingBranchMessageIndex,
      colors,
    },
    copy: {
      role: message.role,
      content: visibleMessageContent,
      isAssistantComplete: !isResponding,
      isCopied,
      colors,
    },
  })

  return {
    renderState,
    turnDuration: {
      role: message.role,
      durationMs: turnDuration?.durationMs,
      isLive: turnDuration?.isLive,
      colors,
      ...styles.turnDuration,
    },
    speech: {
      role: message.role,
      content: visibleMessageContent,
      ttsEnabled,
      isSpeaking,
      colors,
      onPress: () => onSpeakMessage(messageIndex, visibleMessageContent),
      ...styles.speech,
    },
    branch: {
      conversationId,
      role: message.role,
      branchMessageIndex: message.branchMessageIndex,
      fallbackMessageIndex: messageIndex,
      pendingMessageIndex: pendingBranchMessageIndex,
      colors,
      onPress: () => {
        const branchMessageIndex = renderState.branch.messageIndex
        if (branchMessageIndex !== null) {
          onBranchMessage?.(branchMessageIndex)
        }
      },
      ...styles.branch,
    },
    copy: {
      role: message.role,
      content: visibleMessageContent,
      isAssistantComplete: !isResponding,
      isCopied,
      colors,
      onPress: () => { void onCopyMessage(messageIndex, visibleMessageContent) },
      ...styles.copy,
    },
    expansion: {
      onPress: () => onToggleMessageExpansion(messageIndex),
      ...styles.expansion,
    },
  }
}

export function createChatRuntimeConversationActionSetMobileProps<TActionContent>({
  renderState,
  components,
}: ChatRuntimeConversationActionSetMobilePropsInput<TActionContent>):
  ChatRuntimeConversationActionSetMobileProps<ChatMessageActionSlotRenderEntry<TActionContent>> {
  return {
    entries: getChatMessageActionSlotRenderEntries(renderState.layout.visibleSlots, components),
    shouldRenderActionSlots: renderState.layout.shouldRenderActionSlots,
    shouldRenderStandaloneActions: renderState.layout.shouldRenderStandaloneRow,
  }
}

export function createChatRuntimeMessageSurfaceMobilePropsParts<
  TStyle,
  TToneStyle,
>({
  style,
  toneStyle,
}: ChatRuntimeMessageSurfaceMobilePropsPartsInput<
  TStyle,
  TToneStyle
>): ChatRuntimeMessageSurfaceMobilePropsParts<TStyle, TToneStyle> {
  return {
    container: {
      style: [style, toneStyle],
    },
  }
}

export function createChatRuntimeMessageThreadItemMobilePropsParts<
  TLeadingActivity,
  TTrailingActivity,
>({
  leadingActivity,
  trailingActivity,
}: ChatRuntimeMessageThreadItemMobilePropsPartsInput<
  TLeadingActivity,
  TTrailingActivity
>): ChatRuntimeMessageThreadItemMobilePropsParts<
  TLeadingActivity,
  TTrailingActivity
> {
  return {
    leadingActivity,
    trailingActivity,
  }
}

export function createChatRuntimeMessageThreadSurfaceMobilePropsParts<
  TLeadingActivity,
  TTrailingActivity,
  TSurfaceStyle,
  TSurfaceToneStyle,
>({
  leadingActivity,
  trailingActivity,
  surfaceStyle,
  surfaceToneStyle,
}: ChatRuntimeMessageThreadSurfaceMobilePropsPartsInput<
  TLeadingActivity,
  TTrailingActivity,
  TSurfaceStyle,
  TSurfaceToneStyle
>): ChatRuntimeMessageThreadSurfaceMobilePropsParts<
  TLeadingActivity,
  TTrailingActivity,
  TSurfaceStyle,
  TSurfaceToneStyle
> {
  return {
    item: createChatRuntimeMessageThreadItemMobilePropsParts({
      leadingActivity,
      trailingActivity,
    }),
    surface: {
      style: surfaceStyle,
      toneStyle: surfaceToneStyle,
    },
  }
}

export function createChatRuntimeMessageContentRowMobilePropsParts<
  TEntry,
  TRowStyle,
  TBodyStyle,
>({
  shouldRenderActionSlots,
  entries,
  rowStyle,
  bodyStyle,
}: ChatRuntimeMessageContentRowMobilePropsPartsInput<
  TEntry,
  TRowStyle,
  TBodyStyle
>): ChatRuntimeMessageContentRowMobilePropsParts<
  TEntry,
  TRowStyle,
  TBodyStyle
> {
  return {
    row: {
      style: rowStyle,
    },
    body: bodyStyle ? {
      style: bodyStyle,
    } : null,
    actionSlotList: {
      shouldRender: shouldRenderActionSlots,
      entries,
    },
  }
}

export function createChatRuntimeMessageStandaloneActionsMobilePropsParts<
  TEntry,
  TRowStyle,
>({
  shouldRender,
  entries,
  rowStyle,
}: ChatRuntimeMessageStandaloneActionsMobilePropsPartsInput<
  TEntry,
  TRowStyle
>): ChatRuntimeMessageStandaloneActionsMobilePropsParts<
  TEntry,
  TRowStyle
> {
  return {
    actionSlotList: shouldRender ? {
      entries,
      rowStyle,
    } : null,
  }
}

export function createChatRuntimeConversationContentMobilePropsParts<
  TEntry,
  TExpanded extends { bodyStyle: unknown },
  TCollapsed,
  TRowStyle,
>({
  contentDisplayMode,
  rowStyle,
  shouldRenderActionSlots,
  entries,
  expanded,
  collapsed,
}: ChatRuntimeConversationContentMobilePropsPartsInput<
  TEntry,
  TExpanded,
  TCollapsed,
  TRowStyle
>): ChatRuntimeConversationContentMobilePropsParts<
  TEntry,
  TExpanded,
  TCollapsed,
  TRowStyle
> {
  const { bodyStyle, ...expandedContent } = expanded

  return {
    expandedContent: contentDisplayMode === "expanded" ? {
      row: {
        rowStyle,
        bodyStyle,
        shouldRenderActionSlots,
        entries,
      },
      content: expandedContent,
    } : null,
    collapsedContent: contentDisplayMode === "collapsed" ? {
      row: {
        rowStyle,
        shouldRenderActionSlots,
        entries,
      },
      preview: collapsed,
    } : null,
  }
}

export function createChatRuntimeMessageActionIconButtonMobilePropsParts<
  TIcon extends {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  },
  TOnPress,
  TAccessibilityRole,
  TAccessibilityState extends object | undefined,
  TAriaExpanded,
  THitSlop,
  TStyle,
  TActiveStyle,
  TPressedStyle,
  TDisabledStyle,
>({
  icon,
  onPress,
  disabled = false,
  isActive = false,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ariaExpanded,
  hitSlop,
  style,
  activeStyle,
  pressedStyle,
  disabledStyle,
}: ChatRuntimeMessageActionIconButtonMobilePropsPartsInput<
  TIcon,
  TOnPress,
  TAccessibilityRole,
  TAccessibilityState,
  TAriaExpanded,
  THitSlop,
  TStyle,
  TActiveStyle,
  TPressedStyle,
  TDisabledStyle
>): ChatRuntimeMessageActionIconButtonMobilePropsParts<
  TIcon,
  TOnPress,
  TAccessibilityRole,
  TAccessibilityState,
  TAriaExpanded,
  THitSlop,
  TStyle,
  TActiveStyle,
  TPressedStyle,
  TDisabledStyle
> {
  const mergedAccessibilityState = disabled
    ? { ...accessibilityState, disabled: true as const }
    : accessibilityState

  return {
    pressable: {
      onPress,
      disabled,
      accessibilityRole,
      accessibilityLabel,
      accessibilityHint: accessibilityHint ?? undefined,
      accessibilityState: mergedAccessibilityState,
      ariaExpanded,
      hitSlop,
      style: ({ pressed }: { pressed: boolean }) => [
        style,
        isActive && activeStyle,
        pressed && !disabled && pressedStyle,
        disabled && disabledStyle,
      ],
    },
    activityIndicator: icon.isPending ? icon : null,
    icon: icon.isPending ? null : icon,
  }
}

export function createChatRuntimeMessageActionIconButtonMobileProps<
  TIcon extends {
    isPending?: boolean
    name: unknown
    size: unknown
    color: unknown
  },
  TOnPress,
  TAccessibilityRole,
  TAccessibilityState extends object | undefined,
  TAriaExpanded,
  THitSlop,
  TStyle,
  TActiveStyle,
  TPressedStyle,
  TDisabledStyle,
>({
  spec,
}: ChatRuntimeMessageActionIconButtonMobilePropsInput<
  TIcon,
  TOnPress,
  TAccessibilityRole,
  TAccessibilityState,
  TAriaExpanded,
  THitSlop,
  TStyle,
  TActiveStyle,
  TPressedStyle,
  TDisabledStyle
>): ChatRuntimeMessageActionIconButtonMobileProps<
  TIcon,
  TOnPress,
  TAccessibilityRole,
  TAccessibilityState,
  TAriaExpanded,
  THitSlop,
  TStyle,
  TActiveStyle,
  TPressedStyle,
  TDisabledStyle
> {
  return {
    onPress: spec.onPress,
    disabled: spec.renderState.isDisabled,
    accessibilityRole: spec.renderState.accessibilityRole,
    accessibilityLabel: spec.renderState.accessibilityLabel,
    accessibilityHint: spec.renderState.accessibilityHint ?? undefined,
    accessibilityState: spec.renderState.accessibilityState,
    ariaExpanded: spec.renderState.ariaExpanded,
    hitSlop: spec.hitSlop,
    style: spec.style,
    activeStyle: spec.activeStyle,
    pressedStyle: spec.pressedStyle,
    disabledStyle: spec.disabledStyle,
    isActive: spec.isActive,
    icon: spec.renderState.icon,
  }
}

export function createChatRuntimeMessageActionSlotListMobilePropsParts<
  TEntry extends {
    slot: string | number
    item: unknown
  },
  TRowStyle,
>({
  shouldRender = true,
  entries,
  rowStyle,
}: ChatRuntimeMessageActionSlotListMobilePropsPartsInput<TEntry, TRowStyle>):
  ChatRuntimeMessageActionSlotListMobilePropsParts<TEntry, TRowStyle> {
  return {
    shouldRenderList: shouldRender,
    items: entries.map(({ slot, item }) => ({
      key: slot,
      item,
    })),
    row: rowStyle ? {
      style: rowStyle,
    } : null,
  }
}

export function createChatRuntimeConversationActionComponentsMobileProps<
  TTurnDurationAction,
  TSpeechAction extends { isSpeaking?: boolean },
  TBranchAction,
  TCopyAction extends { isCopied?: boolean },
  TExpansionAction,
>({
  renderState,
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
}: ChatRuntimeConversationActionComponentsMobilePropsInput<
  TTurnDurationAction,
  TSpeechAction,
  TBranchAction,
  TCopyAction,
  TExpansionAction
>): ChatRuntimeConversationActionComponentsMobileProps<
  TTurnDurationAction,
  TSpeechAction,
  TBranchAction,
  TCopyAction,
  TExpansionAction
> {
  const { isSpeaking, ...speechProps } = speech
  const { isCopied, ...copyProps } = copy

  return {
    availability: renderState.availability,
    turnDuration: {
      ...turnDuration,
      renderState: renderState.turnDuration,
    },
    speech: {
      ...speechProps,
      renderState: renderState.speech,
      isActive: Boolean(isSpeaking),
    },
    branch: {
      ...branch,
      renderState: renderState.branch,
    },
    copy: {
      ...copyProps,
      renderState: renderState.copy,
      isActive: Boolean(isCopied),
    },
    expansion: {
      ...expansion,
      renderState: renderState.expansion,
    },
  }
}

export function getChatRuntimeConversationToolExecutionStackMobileState<
  TPendingResultRenderState extends ToolExecutionDetailMobilePendingResultRenderState =
    ToolExecutionDetailMobilePendingResultRenderState,
  TEmptyStateRenderState extends ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState> =
    ReturnType<typeof getToolExecutionDetailMobileEmptyStateRenderState>,
>({
  message,
  messageIndex,
  displayToolCallCount,
  renderedToolEntries,
  isExpanded,
  expandedToolCalls,
  previewNumberOfLines,
  pendingResultRenderState,
  emptyStateRenderState,
  colors,
  onToggleToolCall,
  onCopyPayload,
  onToggleMessageExpansion,
}: ChatRuntimeConversationToolExecutionStackMobileStateInput<
  TPendingResultRenderState,
  TEmptyStateRenderState
>): ChatRuntimeConversationToolExecutionStackMobileState {
  const stableMessageKey = message.id ?? String(messageIndex)
  const compactRows = renderedToolEntries.map(({ toolCall, label, origIdx, result }) =>
    getChatRuntimeToolExecutionCompactPreviewMobileRowState({
      key: String(origIdx),
      toolCall,
      label,
      result,
      colors,
    }),
  )
  const detailRows = renderedToolEntries.map(({ toolCall, label, origIdx, result }) => {
    const toolCallKey = `${stableMessageKey}-${origIdx}`
    const rowState = getChatRuntimeToolExecutionDetailMobileRowState({
      key: toolCallKey,
      toolCall,
      label,
      result,
      isExpanded: getChatDisplayExpansionState(expandedToolCalls, toolCallKey),
      colors,
      previewNumberOfLines,
      pendingResultRenderState,
    })
    const input = rowState.input
    const resultSection = rowState.result

    return {
      ...rowState,
      onHeaderPress: () => onToggleToolCall(stableMessageKey, origIdx),
      input: input ? {
        ...input,
        onCopyPress: () => { void onCopyPayload(input.content) },
      } : null,
      result: resultSection ? {
        ...resultSection,
        onCopyPress: () => { void onCopyPayload(resultSection.resultContent) },
        onErrorCopyPress: () => { void onCopyPayload(resultSection.error ?? "") },
      } : null,
    }
  })
  const renderState = getChatRuntimeToolExecutionStackMobileRenderState({
    displayToolCallCount,
    results: renderedToolEntries.map(entry => entry.result),
    colors,
    emptyStateRenderState,
  })

  return {
    displayToolCallCount,
    isExpanded,
    renderState,
    compactRows,
    detailRows,
    compact: {
      onToggle: () => onToggleMessageExpansion(messageIndex),
    },
    expanded: {
      onToggle: () => onToggleMessageExpansion(messageIndex),
    },
  }
}

export function createChatRuntimeConversationToolExecutionStackMobileProps({
  isExpanded,
  renderState,
  compactRows,
  detailRows,
  compact,
  expanded,
}: ChatRuntimeConversationToolExecutionStackMobileState): ChatRuntimeConversationToolExecutionStackMobileProps {
  return {
    shouldRender: renderState.shouldRender,
    isExpanded,
    compact: {
      ...renderState.compact,
      rows: compactRows,
      onPress: compact.onToggle,
    },
    expanded: {
      ...renderState.expanded,
      onCollapsePress: expanded.onToggle,
    },
    detailRows,
  }
}

export function createChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots<
  TButtonStyle,
  TPressedStyle,
  TTopPlacementStyle,
  TBottomPlacementStyle,
  TTextStyle,
>({
  collapseButton,
  collapsePressed,
  collapseTopPlacement,
  collapseBottomPlacement,
  collapseText,
}: ChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlotsInput<
  TButtonStyle,
  TPressedStyle,
  TTopPlacementStyle,
  TBottomPlacementStyle,
  TTextStyle
>): ChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots<
  TButtonStyle,
  TPressedStyle,
  TTopPlacementStyle,
  TBottomPlacementStyle,
  TTextStyle
> {
  const collapseControlStyles = {
    button: collapseButton,
    pressed: collapsePressed,
    text: collapseText,
  }

  return {
    top: {
      ...collapseControlStyles,
      placement: collapseTopPlacement,
    },
    bottom: {
      ...collapseControlStyles,
      placement: collapseBottomPlacement,
    },
  }
}

export function createChatRuntimeToolExecutionExpandedGroupMobilePropsParts<
  TTopCollapseRenderState,
  TBottomCollapseRenderState,
  TOnCollapsePress,
  TEmptyState,
  TStyles extends ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase,
>({
  topCollapseRenderState,
  bottomCollapseRenderState,
  onCollapsePress,
  isPending,
  allSuccess,
  hasErrors,
  emptyState,
  styles,
}: ChatRuntimeToolExecutionExpandedGroupMobilePropsPartsInput<
  TTopCollapseRenderState,
  TBottomCollapseRenderState,
  TOnCollapsePress,
  TEmptyState,
  TStyles
>): ChatRuntimeToolExecutionExpandedGroupMobilePropsParts<
  TTopCollapseRenderState,
  TBottomCollapseRenderState,
  TOnCollapsePress,
  TEmptyState,
  TStyles
> {
  const collapseControlStyleSlots =
    createChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots(styles)

  return {
    containerStyle: styles.container,
    cardStyle: [
      styles.card,
      isPending && styles.pending,
      allSuccess && styles.success,
      hasErrors && styles.error,
    ],
    topCollapseControl: {
      renderState: topCollapseRenderState,
      onPress: onCollapsePress,
      styles: collapseControlStyleSlots.top,
    },
    bottomCollapseControl: {
      renderState: bottomCollapseRenderState,
      onPress: onCollapsePress,
      styles: collapseControlStyleSlots.bottom,
    },
    emptyState,
  }
}

export function createChatRuntimeToolExecutionCallDetailMobilePropsParts<
  TRenderState,
  TOnHeaderPress,
  TInput extends object,
  TResult extends object,
  TPendingResult extends { renderState: unknown },
  TStyles extends {
    callSection: unknown
    payloadSection: unknown
    resultSection: unknown
    pendingResult: unknown
  },
>({
  renderState,
  toolName,
  onHeaderPress,
  input,
  result,
  pendingResult,
  styles,
}: ChatRuntimeToolExecutionCallDetailMobilePropsPartsInput<
  TRenderState,
  TOnHeaderPress,
  TInput,
  TResult,
  TPendingResult,
  TStyles
>): ChatRuntimeToolExecutionCallDetailMobilePropsParts<
  TRenderState,
  TOnHeaderPress,
  TInput,
  TResult,
  TPendingResult,
  TStyles
> {
  const inputSection = input ? {
    ...input,
    styles: styles.payloadSection,
  } : null
  const resultSection = result ? {
    ...result,
    styles: styles.resultSection,
  } : null

  return {
    callSection: {
      renderState,
      toolName,
      onHeaderPress,
      styles: styles.callSection,
    },
    inputSection,
    resultSection,
    pendingResult: !resultSection && pendingResult ? {
      renderState: pendingResult.renderState,
      styles: styles.pendingResult,
    } : null,
  }
}

export function createChatRuntimeToolExecutionCallListMobilePropsParts<
  TRow extends {
    key: unknown
    renderState: unknown
    toolName: string
    onHeaderPress?: unknown
    input?: unknown
    result?: unknown
    pendingResult?: unknown
  },
  TStyles,
>({
  rows,
  styles,
}: ChatRuntimeToolExecutionCallListMobilePropsPartsInput<
  TRow,
  TStyles
>): ChatRuntimeToolExecutionCallListMobilePropsParts<
  TRow,
  TStyles
> {
  return {
    rows: rows.map((row) => ({
      key: row.key,
      renderState: row.renderState,
      toolName: row.toolName,
      onHeaderPress: row.onHeaderPress,
      input: row.input,
      result: row.result,
      pendingResult: row.pendingResult,
      styles,
    })),
  }
}

export function createChatRuntimeToolExecutionPayloadSectionMobilePropsParts<
  TPayloadRenderState,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles extends {
    section: unknown
    headerRow: unknown
    payloadMeta: unknown
    copyButton: unknown
    payloadBlock: unknown
  },
>({
  payloadRenderState,
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatRuntimeToolExecutionPayloadSectionMobilePropsPartsInput<
  TPayloadRenderState,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles
>): ChatRuntimeToolExecutionPayloadSectionMobilePropsParts<
  TPayloadRenderState,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles
> {
  return {
    sectionStyle: styles.section,
    headerRowStyle: styles.headerRow,
    payloadMeta: {
      renderState: payloadRenderState,
      styles: styles.payloadMeta,
    },
    copyButton: {
      renderState: copyButtonRenderState,
      onPress: onCopyPress,
      styles: styles.copyButton,
    },
    payloadBlock: {
      compactText,
      content,
      isExpanded,
      previewNumberOfLines,
      styles: styles.payloadBlock,
    },
  }
}

export function createChatRuntimeToolExecutionPayloadMetaMobilePropsParts<
  TRenderState extends {
    label: string
    payloadTypeLabel?: string | null
  },
  TStyles extends {
    row?: unknown
    label: unknown
    payloadType: unknown
  },
>({
  renderState,
  styles,
}: ChatRuntimeToolExecutionPayloadMetaMobilePropsPartsInput<
  TRenderState,
  TStyles
>): ChatRuntimeToolExecutionPayloadMetaMobilePropsParts<
  TRenderState,
  TStyles
> {
  return {
    row: styles.row ? {
      style: styles.row,
    } : null,
    label: {
      text: renderState.label,
      style: styles.label,
    },
    payloadType: renderState.payloadTypeLabel ? {
      text: renderState.payloadTypeLabel,
      style: styles.payloadType,
    } : null,
  }
}

export function createChatRuntimeToolExecutionPayloadBlockMobilePropsParts<
  TStyles extends {
    preview: unknown
    scroll: unknown
    scrollExpanded: unknown
    code: unknown
  },
>({
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  styles,
}: ChatRuntimeToolExecutionPayloadBlockMobilePropsPartsInput<TStyles>): ChatRuntimeToolExecutionPayloadBlockMobilePropsParts<TStyles> {
  return {
    preview: compactText ? {
      text: compactText,
      style: styles.preview,
      numberOfLines: previewNumberOfLines,
    } : null,
    scroll: {
      style: isExpanded ? styles.scrollExpanded : styles.scroll,
      nestedScrollEnabled: true,
    },
    code: {
      text: content,
      style: styles.code,
    },
  }
}

export function createChatRuntimeToolExecutionResultBadgeMobilePropsParts<
  TBadge extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    isSuccess: boolean
    icon: unknown
    label: string
  },
  TStyles extends {
    badge: unknown
    badgeSuccess: unknown
    badgeError: unknown
    text: unknown
    textSuccess: unknown
    textError: unknown
  },
>({
  badge,
  styles,
}: ChatRuntimeToolExecutionResultBadgeMobilePropsPartsInput<
  TBadge,
  TStyles
>): ChatRuntimeToolExecutionResultBadgeMobilePropsParts<
  TBadge,
  TStyles
> {
  return {
    container: {
      accessible: true,
      accessibilityRole: badge.accessibilityRole,
      accessibilityLabel: badge.accessibilityLabel,
      style: [
        styles.badge,
        badge.isSuccess ? styles.badgeSuccess : styles.badgeError,
      ],
    },
    icon: badge.icon,
    label: {
      text: badge.label,
      style: [
        styles.text,
        badge.isSuccess ? styles.textSuccess : styles.textError,
      ],
    },
  }
}

export function createChatRuntimeToolExecutionCopyButtonMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
  },
  TOnPress,
  TStyles extends {
    button: unknown
    pressed: unknown
    text: unknown
  },
>({
  renderState,
  onPress,
  styles,
}: ChatRuntimeToolExecutionCopyButtonMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TStyles
>): ChatRuntimeToolExecutionCopyButtonMobilePropsParts<
  TRenderState,
  TOnPress,
  TStyles
> {
  return {
    container: {
      onPress,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      style: ({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ],
    },
    icon: renderState.icon,
    label: {
      text: renderState.label,
      style: styles.text,
    },
  }
}

export function createChatRuntimeToolExecutionDetailHeaderMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    ariaExpanded: unknown
    accessibilityHint: string
    toggleIcon: unknown
    toggleLabel: string
  },
  TOnPress,
  TStyles extends {
    header: unknown
    headerPressed: unknown
    toolName: unknown
    expandHint: unknown
    expandHintText: unknown
  },
>({
  renderState,
  toolName,
  onPress,
  styles,
}: ChatRuntimeToolExecutionDetailHeaderMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TStyles
>): ChatRuntimeToolExecutionDetailHeaderMobilePropsParts<
  TRenderState,
  TOnPress,
  TStyles
> {
  return {
    container: {
      onPress,
      style: ({ pressed }) => [
        styles.header,
        pressed && styles.headerPressed,
      ],
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityState: renderState.accessibilityState,
      ariaExpanded: renderState.ariaExpanded,
      accessibilityHint: renderState.accessibilityHint,
    },
    toolName: {
      text: toolName,
      style: styles.toolName,
    },
    expandHint: {
      style: styles.expandHint,
      icon: renderState.toggleIcon,
      label: {
        text: renderState.toggleLabel,
        style: styles.expandHintText,
      },
    },
  }
}

export function createChatRuntimeToolExecutionCallSectionMobilePropsParts<
  TRenderState,
  TOnHeaderPress,
  TStyles extends {
    section: unknown
    header: unknown
  },
>({
  renderState,
  toolName,
  onHeaderPress,
  styles,
}: ChatRuntimeToolExecutionCallSectionMobilePropsPartsInput<
  TRenderState,
  TOnHeaderPress,
  TStyles
>): ChatRuntimeToolExecutionCallSectionMobilePropsParts<
  TRenderState,
  TOnHeaderPress,
  TStyles
> {
  return {
    container: {
      style: styles.section,
    },
    header: {
      renderState,
      toolName,
      onPress: onHeaderPress,
      styles: styles.header,
    },
  }
}

export function createChatRuntimeToolExecutionCollapseControlMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    icon: unknown
    label: string
  },
  TOnPress,
  TStyles extends {
    button: unknown
    pressed: unknown
    placement?: unknown
    text: unknown
  },
>({
  renderState,
  onPress,
  styles,
}: ChatRuntimeToolExecutionCollapseControlMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TStyles
>): ChatRuntimeToolExecutionCollapseControlMobilePropsParts<
  TRenderState,
  TOnPress,
  TStyles
> {
  return {
    container: {
      onPress,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityHint: renderState.accessibilityHint,
      style: ({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        styles.placement,
      ],
    },
    icon: renderState.icon,
    label: {
      text: renderState.label,
      style: styles.text,
    },
  }
}

export function createChatRuntimeToolExecutionCompactGroupMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityHint: string
    accessibilityState: unknown
    ariaExpanded: unknown
  },
  TOnPress,
  TStyles extends {
    container: unknown
    pressed: unknown
  },
>({
  renderState,
  onPress,
  styles,
}: ChatRuntimeToolExecutionCompactGroupMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TStyles
>): ChatRuntimeToolExecutionCompactGroupMobilePropsParts<
  TRenderState,
  TOnPress,
  TStyles
> {
  return {
    container: {
      onPress,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityHint: renderState.accessibilityHint,
      accessibilityState: renderState.accessibilityState,
      ariaExpanded: renderState.ariaExpanded,
      style: ({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ],
    },
  }
}

export function createChatRuntimeToolExecutionCompactRowMobilePropsParts<
  TRenderState extends {
    accessibilityLabel: string
    toolIcon: unknown
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    name: {
      numberOfLines: unknown
      ellipsizeMode: unknown
    }
    preview: string
    statusIndicator: {
      spinner: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
      icon: ChatRuntimeToolExecutionCompactRowStatusIndicatorPart
    }
    toggleIcon: unknown
  },
  TStyles extends {
    line: unknown
    leadingIcon: unknown
    name: unknown
    namePending: unknown
    nameSuccess: unknown
    nameError: unknown
    statusIndicator: unknown
    toggleIcon: unknown
  },
>({
  renderState,
  styles,
}: ChatRuntimeToolExecutionCompactRowMobilePropsPartsInput<
  TRenderState,
  TStyles
>): ChatRuntimeToolExecutionCompactRowMobilePropsParts<
  TRenderState,
  TStyles
> {
  const spinner = renderState.statusIndicator.spinner.shouldRender
    ? renderState.statusIndicator.spinner
    : null
  const icon = !spinner && renderState.statusIndicator.icon.shouldRender
    ? renderState.statusIndicator.icon
    : null

  return {
    container: {
      style: styles.line,
      accessibilityLabel: renderState.accessibilityLabel,
    },
    leadingIcon: {
      style: styles.leadingIcon,
      icon: renderState.toolIcon,
    },
    name: {
      text: renderState.preview,
      style: [
        styles.name,
        renderState.isPending && styles.namePending,
        renderState.isSuccess && styles.nameSuccess,
        renderState.isError && styles.nameError,
      ],
      numberOfLines: renderState.name.numberOfLines,
      ellipsizeMode: renderState.name.ellipsizeMode,
    },
    statusIndicator: {
      style: styles.statusIndicator,
      spinner,
      icon,
    },
    toggleIcon: {
      style: styles.toggleIcon,
      icon: renderState.toggleIcon,
    },
  }
}

export function createChatRuntimeToolExecutionCompactListMobilePropsParts<
  TRenderState,
  TRow extends {
    key: unknown
    renderState: unknown
  },
  TOnPress,
  TCompactGroupStyles,
  TCompactRowStyles,
>({
  shouldRender,
  renderState,
  rows,
  onPress,
  groupStyles,
  rowStyles,
}: ChatRuntimeToolExecutionCompactListMobilePropsPartsInput<
  TRenderState,
  TRow,
  TOnPress,
  TCompactGroupStyles,
  TCompactRowStyles
>): ChatRuntimeToolExecutionCompactListMobilePropsParts<
  TRenderState,
  TRow,
  TOnPress,
  TCompactGroupStyles,
  TCompactRowStyles
> {
  return {
    shouldRenderList: shouldRender,
    group: {
      renderState,
      onPress,
      styles: groupStyles,
    },
    rows: rows.map((row) => ({
      key: row.key,
      renderState: row.renderState,
      styles: rowStyles,
    })),
  }
}

export function createChatRuntimeToolExecutionPendingResultMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    spinner: unknown
    label: string
  },
  TStyles extends {
    row: unknown
    text: unknown
  },
>({
  renderState,
  styles,
}: ChatRuntimeToolExecutionPendingResultMobilePropsPartsInput<
  TRenderState,
  TStyles
>): ChatRuntimeToolExecutionPendingResultMobilePropsParts<
  TRenderState,
  TStyles
> {
  return {
    container: {
      accessible: true,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      style: styles.row,
    },
    spinner: renderState.spinner,
    label: {
      text: renderState.label,
      style: styles.text,
    },
  }
}

export function createChatRuntimeToolExecutionEmptyStateMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    accessibilityLabel: string
    label: string
  },
  TStyle,
>({
  renderState,
  style,
}: ChatRuntimeToolExecutionEmptyStateMobilePropsPartsInput<
  TRenderState,
  TStyle
>): ChatRuntimeToolExecutionEmptyStateMobilePropsParts<
  TRenderState,
  TStyle
> {
  return {
    label: {
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      style,
      text: renderState.label,
    },
  }
}

export function createChatRuntimeToolExecutionResultHeaderMobilePropsParts<
  TPayloadRenderState,
  TResultBadge,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles extends {
    header: unknown
    meta: unknown
    payloadMeta: unknown
    badge: unknown
    characterCount: unknown
    copyButton: unknown
  },
>({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatRuntimeToolExecutionResultHeaderMobilePropsPartsInput<
  TPayloadRenderState,
  TResultBadge,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles
>): ChatRuntimeToolExecutionResultHeaderMobilePropsParts<
  TPayloadRenderState,
  TResultBadge,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles
> {
  return {
    headerStyle: styles.header,
    metaStyle: styles.meta,
    payloadMeta: {
      renderState: payloadRenderState,
      styles: styles.payloadMeta,
    },
    resultBadge: {
      badge: resultBadge,
      styles: styles.badge,
    },
    characterCount: {
      label: characterCountLabel,
      style: styles.characterCount,
    },
    copyButton: {
      renderState: copyButtonRenderState,
      onPress: onCopyPress,
      styles: styles.copyButton,
    },
  }
}

export function createChatRuntimeToolExecutionErrorBlockMobilePropsParts<
  TRenderState extends { label: string },
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles extends {
    section: unknown
    headerRow: unknown
    label: unknown
    text: unknown
    copyButton: unknown
  },
>({
  renderState,
  error,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatRuntimeToolExecutionErrorBlockMobilePropsPartsInput<
  TRenderState,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles
>): ChatRuntimeToolExecutionErrorBlockMobilePropsParts<
  TRenderState,
  TCopyButtonRenderState,
  TOnCopyPress,
  TStyles
> {
  return {
    sectionStyle: styles.section,
    headerRowStyle: styles.headerRow,
    label: {
      text: renderState.label,
      style: styles.label,
    },
    copyButton: {
      renderState: copyButtonRenderState,
      onPress: onCopyPress,
      styles: styles.copyButton,
    },
    error: {
      text: error,
      style: styles.text,
    },
  }
}

export function createChatRuntimeToolExecutionResultSectionMobilePropsParts<
  TPayloadRenderState,
  TResultBadge,
  TCopyButtonRenderState,
  TOnCopyPress,
  TErrorRenderState,
  TErrorCopyButtonRenderState,
  TOnErrorCopyPress,
  TStyles extends {
    item: unknown
    header: unknown
    payloadBlock: unknown
    errorBlock: unknown
  },
>({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  resultCompactText,
  resultContent,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  errorRenderState,
  error,
  errorCopyButtonRenderState,
  onErrorCopyPress,
  styles,
}: ChatRuntimeToolExecutionResultSectionMobilePropsPartsInput<
  TPayloadRenderState,
  TResultBadge,
  TCopyButtonRenderState,
  TOnCopyPress,
  TErrorRenderState,
  TErrorCopyButtonRenderState,
  TOnErrorCopyPress,
  TStyles
>): ChatRuntimeToolExecutionResultSectionMobilePropsParts<
  TPayloadRenderState,
  TResultBadge,
  TCopyButtonRenderState,
  TOnCopyPress,
  TErrorRenderState,
  TErrorCopyButtonRenderState,
  TOnErrorCopyPress,
  TStyles
> {
  return {
    itemStyle: styles.item,
    header: {
      payloadRenderState,
      resultBadge,
      characterCountLabel,
      copyButtonRenderState,
      onCopyPress,
      styles: styles.header,
    },
    payloadBlock: {
      compactText: resultCompactText,
      content: resultContent,
      isExpanded,
      previewNumberOfLines,
      styles: styles.payloadBlock,
    },
    errorBlock: error ? {
      renderState: errorRenderState,
      error,
      copyButtonRenderState: errorCopyButtonRenderState,
      onCopyPress: onErrorCopyPress,
      styles: styles.errorBlock,
    } : null,
  }
}

export function createChatComposerIconButtonMobilePropsParts<
  TRenderState extends ChatComposerIconButtonMobileRenderStateLike,
  TOnPress,
  TActiveOpacity,
  TStyle,
  TActiveStyle,
>({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  style,
  activeStyle,
}: ChatComposerIconButtonMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TActiveOpacity,
  TStyle,
  TActiveStyle
>): ChatComposerIconButtonMobilePropsParts<
  TRenderState,
  TOnPress,
  TActiveOpacity,
  TStyle,
  TActiveStyle
> {
  return {
    shouldRender,
    touchable: {
      style: [style, renderState.isActive && activeStyle],
      onPress,
      activeOpacity,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityHint: renderState.accessibilityHint ?? undefined,
      accessibilityState: renderState.accessibilityState,
      ariaChecked: renderState.ariaChecked,
    },
    icon: renderState.icon,
  }
}

export function createChatComposerRuntimeDockMobilePropsParts<
  TSpeechPreview extends object,
  TPendingImagesRail extends object,
  THandsFreeControls extends { status: object },
  TImageAttachmentControl extends object,
  TTextToSpeechControl extends object,
  TEditBeforeSendControl extends object,
  TTextEntry extends object,
  TQueueAction extends object,
  TSubmitAction extends object,
  TMicButton extends object,
  TMicWrapperRef,
  TSpeechPreviewStyles,
  TPendingImagesRailStyles,
  THandsFreeControlsStyles,
  TAccessoryButtonStyle,
  TAccessoryButtonActiveStyle,
  TTextEntryStyles,
  TQueueActionStyles,
  TSubmitActionStyles,
  TMicButtonStyles,
  TInputDockStyles,
>({
  speechPreview,
  pendingImagesRail,
  handsFreeControls,
  imageAttachmentControl,
  textToSpeechControl,
  editBeforeSendControl,
  textEntry,
  queueAction,
  submitAction,
  micButton,
  micWrapperRef,
  styles,
}: ChatComposerRuntimeDockMobilePropsPartsInput<
  TSpeechPreview,
  TPendingImagesRail,
  THandsFreeControls,
  TImageAttachmentControl,
  TTextToSpeechControl,
  TEditBeforeSendControl,
  TTextEntry,
  TQueueAction,
  TSubmitAction,
  TMicButton,
  TMicWrapperRef,
  TSpeechPreviewStyles,
  TPendingImagesRailStyles,
  THandsFreeControlsStyles,
  TAccessoryButtonStyle,
  TAccessoryButtonActiveStyle,
  TTextEntryStyles,
  TQueueActionStyles,
  TSubmitActionStyles,
  TMicButtonStyles,
  TInputDockStyles
>): ChatComposerRuntimeDockMobilePropsParts<
  TSpeechPreview,
  TPendingImagesRail,
  THandsFreeControls,
  TImageAttachmentControl,
  TTextToSpeechControl,
  TEditBeforeSendControl,
  TTextEntry,
  TQueueAction,
  TSubmitAction,
  TMicButton,
  TMicWrapperRef,
  TSpeechPreviewStyles,
  TPendingImagesRailStyles,
  THandsFreeControlsStyles,
  TAccessoryButtonStyle,
  TAccessoryButtonActiveStyle,
  TTextEntryStyles,
  TQueueActionStyles,
  TSubmitActionStyles,
  TMicButtonStyles,
  TInputDockStyles
> {
  const { status: handsFreeStatus, ...handsFreeControlProps } = handsFreeControls

  return {
    speechPreview: {
      ...speechPreview,
      styles: styles.speechPreview,
    },
    pendingImagesRail: {
      ...pendingImagesRail,
      styles: styles.pendingImagesRail,
    },
    handsFreeStatus,
    handsFreeControls: {
      ...handsFreeControlProps,
      styles: styles.handsFreeControls,
    },
    imageAttachmentControl: {
      ...imageAttachmentControl,
      style: styles.accessoryButton.style,
      activeStyle: styles.accessoryButton.activeStyle,
    },
    textToSpeechControl: {
      ...textToSpeechControl,
      style: styles.accessoryButton.style,
      activeStyle: styles.accessoryButton.activeStyle,
    },
    editBeforeSendControl: {
      ...editBeforeSendControl,
      style: styles.accessoryButton.style,
      activeStyle: styles.accessoryButton.activeStyle,
    },
    textEntry: {
      ...textEntry,
      styles: styles.textEntry,
    },
    queueAction: {
      ...queueAction,
      styles: styles.queueAction,
    },
    submitAction: {
      ...submitAction,
      styles: styles.submitAction,
    },
    micButton: {
      ...micButton,
      styles: styles.micButton,
    },
    inputDock: {
      micWrapperRef,
      styles: styles.inputDock,
    },
  }
}

export function createChatRuntimeToolExecutionPanelMobilePropsParts<
  TCompact extends object,
  TExpanded extends object,
>({
  shouldRender,
  isExpanded,
  compact,
  expanded,
}: ChatRuntimeToolExecutionPanelMobilePropsPartsInput<
  TCompact,
  TExpanded
>): ChatRuntimeToolExecutionPanelMobilePropsParts<
  TCompact,
  TExpanded
> {
  return {
    shouldRenderPanel: shouldRender,
    compact: {
      ...compact,
      shouldRender: shouldRender && !isExpanded,
    },
    expandedGroup: shouldRender && isExpanded ? expanded : null,
  }
}

export function createChatRuntimeToolExecutionStackPanelMobilePropsParts<
  TCompact extends object,
  TExpanded extends { emptyState?: ChatRuntimeToolExecutionStackPanelEmptyStateLike | null },
  TDetailRows,
  TCompactGroupStyles,
  TCompactRowStyles,
  TExpandedGroupStyles,
  TEmptyStateTextStyle,
  TCallDetailStyles,
>({
  compact,
  expanded,
  detailRows,
  styles,
}: ChatRuntimeToolExecutionStackPanelMobilePropsPartsInput<
  TCompact,
  TExpanded,
  TDetailRows,
  TCompactGroupStyles,
  TCompactRowStyles,
  TExpandedGroupStyles,
  TEmptyStateTextStyle,
  TCallDetailStyles
>): ChatRuntimeToolExecutionStackPanelMobilePropsParts<
  TCompact,
  TExpanded,
  TDetailRows,
  TCompactGroupStyles,
  TCompactRowStyles,
  TExpandedGroupStyles,
  TEmptyStateTextStyle,
  TCallDetailStyles
> {
  const { emptyState, ...expandedGroup } = expanded

  return {
    compact: {
      ...compact,
      groupStyles: styles.compactGroup,
      rowStyles: styles.compactRow,
    },
    expandedGroup: {
      ...expandedGroup,
      styles: styles.expandedGroup,
    },
    emptyState: emptyState?.shouldRender ? {
      renderState: emptyState.renderState,
      style: styles.emptyStateText,
    } : null,
    callList: {
      rows: detailRows,
      styles: styles.callDetail,
    },
  }
}

export function createChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
  TRetryStatus extends object,
  TDelegationCard extends object,
  TToolApproval extends object,
  TInlineActivity extends object,
  TRetryStatusStyles,
  TDelegationCardStyles,
  TToolApprovalStyles,
  TInlineActivityStyle,
  TInlineActivitySpinnerStyle,
>({
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  styles,
}: ChatRuntimeConversationThreadBodyStatusPanelMobilePropsPartsInput<
  TRetryStatus,
  TDelegationCard,
  TToolApproval,
  TInlineActivity,
  TRetryStatusStyles,
  TDelegationCardStyles,
  TToolApprovalStyles,
  TInlineActivityStyle,
  TInlineActivitySpinnerStyle
>): ChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts<
  TRetryStatus,
  TDelegationCard,
  TToolApproval,
  TInlineActivity,
  TRetryStatusStyles,
  TDelegationCardStyles,
  TToolApprovalStyles,
  TInlineActivityStyle,
  TInlineActivitySpinnerStyle
> {
  return {
    retryStatus: retryStatus ? {
      ...retryStatus,
      styles: styles.retryStatus,
    } : null,
    delegationCard: delegationCard ? {
      ...delegationCard,
      styles: styles.delegationCard,
    } : null,
    toolApproval: toolApproval ? {
      ...toolApproval,
      styles: styles.toolApproval,
    } : null,
    inlineActivity: inlineActivity ? {
      ...inlineActivity,
      style: styles.inlineActivity.style,
      spinnerStyle: styles.inlineActivity.spinnerStyle,
    } : null,
  }
}

export function createChatRuntimeConversationThreadBodyMobilePropsParts<
  TRetryStatus extends object,
  TDelegationCard extends object,
  TToolApproval extends object,
  TInlineActivity extends object,
  TContent extends { expanded: object; collapsed: object },
  TToolExecutionStack extends object,
  TStandaloneActions extends object,
  TRetryStatusStyles,
  TDelegationCardStyles,
  TToolApprovalStyles,
  TInlineActivityStyle,
  TInlineActivitySpinnerStyle,
  TContentRowStyle,
  TExpandedBodyStyle,
  TStreamingStyles,
  TCollapsedStyle,
  TCollapsedPressedStyle,
  TCollapsedTextStyle,
  TToolExecutionStackStyles,
  TStandaloneActionsRowStyle,
>({
  bodyDisplayMode,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
  styles,
}: ChatRuntimeConversationThreadBodyMobilePropsPartsInput<
  TRetryStatus,
  TDelegationCard,
  TToolApproval,
  TInlineActivity,
  TContent,
  TToolExecutionStack,
  TStandaloneActions,
  TRetryStatusStyles,
  TDelegationCardStyles,
  TToolApprovalStyles,
  TInlineActivityStyle,
  TInlineActivitySpinnerStyle,
  TContentRowStyle,
  TExpandedBodyStyle,
  TStreamingStyles,
  TCollapsedStyle,
  TCollapsedPressedStyle,
  TCollapsedTextStyle,
  TToolExecutionStackStyles,
  TStandaloneActionsRowStyle
>): ChatRuntimeConversationThreadBodyMobilePropsParts<
  TRetryStatus,
  TDelegationCard,
  TToolApproval,
  TInlineActivity,
  TContent,
  TToolExecutionStack,
  TStandaloneActions,
  TRetryStatusStyles,
  TDelegationCardStyles,
  TToolApprovalStyles,
  TInlineActivityStyle,
  TInlineActivitySpinnerStyle,
  TContentRowStyle,
  TExpandedBodyStyle,
  TStreamingStyles,
  TCollapsedStyle,
  TCollapsedPressedStyle,
  TCollapsedTextStyle,
  TToolExecutionStackStyles,
  TStandaloneActionsRowStyle
> {
  const statusPanelParts = createChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts({
    retryStatus,
    delegationCard,
    toolApproval,
    inlineActivity,
    styles,
  })
  const emptyConversationBodyParts = {
    conversation: null,
    toolExecutionStack: null,
    standaloneActions: null,
  }

  if (bodyDisplayMode === "retryStatus") {
    return {
      retryStatus: statusPanelParts.retryStatus,
      delegationCard: null,
      toolApproval: null,
      inlineActivity: null,
      ...emptyConversationBodyParts,
    }
  }

  if (bodyDisplayMode === "delegationCard") {
    return {
      retryStatus: null,
      delegationCard: statusPanelParts.delegationCard,
      toolApproval: null,
      inlineActivity: null,
      ...emptyConversationBodyParts,
    }
  }

  if (bodyDisplayMode === "toolApproval") {
    return {
      retryStatus: null,
      delegationCard: null,
      toolApproval: statusPanelParts.toolApproval,
      inlineActivity: null,
      ...emptyConversationBodyParts,
    }
  }

  if (bodyDisplayMode === "inlineActivity") {
    return {
      retryStatus: null,
      delegationCard: null,
      toolApproval: null,
      inlineActivity: statusPanelParts.inlineActivity,
      ...emptyConversationBodyParts,
    }
  }

  const conversationBodyParts = createChatRuntimeConversationBodyPanelMobilePropsParts({
    conversation,
    styles,
  })

  return {
    retryStatus: null,
    delegationCard: null,
    toolApproval: null,
    inlineActivity: null,
    conversation: conversationBodyParts.content,
    toolExecutionStack: conversationBodyParts.toolExecutionStack,
    standaloneActions: conversationBodyParts.standaloneActions,
  }
}

export function createChatRuntimeToolActivityGroupToggleMobilePropsParts<
  TRenderState extends ChatRuntimeToolActivityGroupToggleMobileRenderStateParts,
  TOnPress,
  TStyles extends ChatRuntimeToolActivityGroupToggleMobileStyleSlots,
>({
  renderState,
  headerKind,
  onPress,
  styles,
}: ChatRuntimeToolActivityGroupToggleMobilePropsPartsInput<TRenderState, TOnPress, TStyles>):
  ChatRuntimeToolActivityGroupToggleMobilePropsParts<TRenderState, TOnPress, TStyles> {
  const headerState = headerKind === "collapsed"
    ? renderState.collapsedHeader
    : renderState.expandedHeader

  return {
    headerState,
    pressable: {
      onPress,
      accessibilityRole: headerState.accessibilityRole,
      accessibilityLabel: headerState.accessibilityLabel,
      accessibilityState: headerState.accessibilityState,
      ariaExpanded: headerState.ariaExpanded,
      style: ({ pressed }: { pressed: boolean }) => [
        styles.container,
        pressed && styles.pressed,
      ],
    },
    headerRow: {
      style: styles.headerRow,
    },
    leadingIcon: renderState.leadingIcon,
    countBadge: renderState.summary.shouldShowToolCallCount ? {
      accessibilityLabel: renderState.summary.toolCallCountLabel,
      style: styles.countBadge,
      label: {
        style: styles.countBadgeText,
        text: renderState.summary.toolCallCount,
      },
    } : null,
    preview: {
      style: styles.previewLine,
      numberOfLines: renderState.surface.preview.numberOfLines,
      ellipsizeMode: renderState.surface.preview.ellipsizeMode,
      text: renderState.summary.previewText,
    },
    toggleIcon: renderState.headerToggleIcon,
  }
}

export function createChatRuntimeToolActivityGroupFooterMobilePropsParts<
  TRenderState extends ChatRuntimeToolActivityGroupFooterMobileRenderStateParts,
  TOnPress,
  TStyles extends ChatRuntimeToolActivityGroupFooterMobileStyleSlots,
>({
  renderState,
  onPress,
  styles,
}: ChatRuntimeToolActivityGroupFooterMobilePropsPartsInput<TRenderState, TOnPress, TStyles>):
  ChatRuntimeToolActivityGroupFooterMobilePropsParts<TRenderState, TOnPress, TStyles> {
  return {
    button: {
      onPress,
      accessibilityRole: renderState.footerButton.accessibilityRole,
      accessibilityLabel: renderState.footerButton.accessibilityLabel,
      style: ({ pressed }: { pressed: boolean }) => [
        styles.button,
        pressed && styles.pressed,
      ],
    },
    icon: renderState.footerToggleIcon,
    label: {
      style: styles.text,
      text: renderState.footerButton.label,
    },
  }
}

export function createChatRuntimeToolActivityGroupBoundaryMobilePropsParts<
  TRenderState,
  TOnPress,
  TToggleStyles,
  TFooterStyles,
>({
  renderState,
  kind,
  onPress,
  styles,
}: ChatRuntimeToolActivityGroupBoundaryMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TToggleStyles,
  TFooterStyles
>): ChatRuntimeToolActivityGroupBoundaryMobilePropsParts<
  TRenderState,
  TOnPress,
  TToggleStyles,
  TFooterStyles
> {
  if (kind === "footer") {
    return {
      toggle: null,
      footer: {
        renderState,
        onPress,
        styles: styles.footer,
      },
    }
  }

  return {
    toggle: {
      renderState,
      headerKind: kind,
      onPress,
      styles: styles.toggle,
    },
    footer: null,
  }
}

export function createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts<
  TGroupRenderState extends {
    shouldRenderExpandedHeader?: boolean
    shouldRenderExpandedFooter?: boolean
  },
  TOnToggleGroup,
  TSurfaceStyle,
  TSurfaceToneStyle,
  TBoundaryStyles,
>({
  groupRenderState,
  onToggleGroup,
  surfaceToneStyle,
  styles,
}: ChatRuntimeToolActivityGroupThreadSurfaceMobilePropsPartsInput<
  TGroupRenderState,
  TOnToggleGroup,
  TSurfaceStyle,
  TSurfaceToneStyle,
  TBoundaryStyles
>): ChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts<
  TGroupRenderState,
  TOnToggleGroup,
  TSurfaceStyle,
  TSurfaceToneStyle,
  TBoundaryStyles
> {
  return {
    surface: {
      surfaceStyle: styles.surfaceStyle,
      surfaceToneStyle,
    },
    leadingBoundary: groupRenderState?.shouldRenderExpandedHeader ? {
      renderState: groupRenderState,
      kind: "expanded",
      onPress: onToggleGroup,
      styles: styles.boundary,
    } : null,
    trailingBoundary: groupRenderState?.shouldRenderExpandedFooter ? {
      renderState: groupRenderState,
      kind: "footer",
      onPress: onToggleGroup,
      styles: styles.boundary,
    } : null,
  }
}

export function createChatRuntimeConversationRuntimeThreadMobilePropsParts<
  TGroupRenderState extends {
    shouldSkipCollapsedItem?: boolean
    shouldRenderCollapsedHeader?: boolean
  },
  TBody extends { conversation: { surfaceToneStyleSlot: unknown } },
  TOnToggleGroup,
  TBodyStyles,
  TSurfaceStyles extends {
    boundary: unknown
    getToneStyle: (toneStyleSlot: TBody["conversation"]["surfaceToneStyleSlot"]) => unknown
  },
  TToneStyle = ReturnType<TSurfaceStyles["getToneStyle"]>,
>({
  groupRenderState,
  onToggleGroup,
  body,
  styles,
}: ChatRuntimeConversationRuntimeThreadMobilePropsPartsInput<
  TGroupRenderState,
  TBody,
  TOnToggleGroup,
  TBodyStyles,
  TSurfaceStyles,
  TToneStyle
>): ChatRuntimeConversationRuntimeThreadMobilePropsParts<
  TGroupRenderState,
  TBody,
  TOnToggleGroup,
  TBodyStyles,
  TSurfaceStyles,
  TToneStyle
> {
  const shouldSkipThread = Boolean(groupRenderState?.shouldSkipCollapsedItem)
  const collapsedBoundary = !shouldSkipThread && groupRenderState?.shouldRenderCollapsedHeader ? {
    renderState: groupRenderState,
    kind: "collapsed" as const,
    onPress: onToggleGroup,
    styles: styles.surface.boundary,
  } : null
  const shouldRenderBodySurface = !shouldSkipThread && !collapsedBoundary && !!body

  return {
    shouldSkipThread,
    collapsedBoundary,
    bodySurface: shouldRenderBodySurface ? {
      body,
      surface: {
        surfaceToneStyle: styles.surface.getToneStyle(body.conversation.surfaceToneStyleSlot) as TToneStyle,
        groupRenderState,
        onToggleGroup,
        styles: styles.surface,
      },
      bodyStyles: styles.body,
    } : null,
  }
}

export function createChatRuntimeConversationRuntimeThreadListMobilePropsParts<
  TThreadState extends {
    threadKey: ChatRuntimeConversationThreadKey
    shouldRenderThread: boolean
    groupRenderState: unknown
    onToggleGroup?: unknown
    body: unknown
  },
  TStyles,
>({
  threadStates,
  styles,
}: ChatRuntimeConversationRuntimeThreadListMobilePropsPartsInput<
  TThreadState,
  TStyles
>): ChatRuntimeConversationRuntimeThreadListMobilePropsParts<
  TThreadState,
  TStyles
> {
  return {
    threads: threadStates
      .filter((threadState) => threadState.shouldRenderThread)
      .map((threadState) => ({
        key: threadState.threadKey,
        props: {
          groupRenderState: threadState.groupRenderState,
          onToggleGroup: threadState.onToggleGroup,
          body: threadState.body,
          styles,
        },
      })),
  }
}

export function createChatRuntimeLoadingStateMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  },
  TSpinnerSource,
  TStyle,
  TSpinnerStyle,
>({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatRuntimeLoadingStateMobilePropsPartsInput<
  TRenderState,
  TSpinnerSource,
  TStyle,
  TSpinnerStyle
>): ChatRuntimeLoadingStateMobilePropsParts<
  TRenderState,
  TSpinnerSource,
  TStyle,
  TSpinnerStyle
> {
  return {
    shouldRenderLoadingState: renderState.shouldRender,
    container: {
      accessible: true,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityState: renderState.accessibilityState,
      style,
    },
    spinner: {
      source: spinnerSource,
      style: spinnerStyle,
      resizeMode: renderState.spinnerResizeMode,
    },
  }
}

export function createChatRuntimeInlineActivityMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    accessibilityState: unknown
    spinnerResizeMode: unknown
  },
  TSpinnerSource,
  TStyle,
  TSpinnerStyle,
>({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatRuntimeInlineActivityMobilePropsPartsInput<
  TRenderState,
  TSpinnerSource,
  TStyle,
  TSpinnerStyle
>): ChatRuntimeInlineActivityMobilePropsParts<
  TRenderState,
  TSpinnerSource,
  TStyle,
  TSpinnerStyle
> {
  return {
    shouldRenderInlineActivity: renderState.shouldRender,
    container: {
      accessible: true,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityState: renderState.accessibilityState,
      style,
    },
    spinner: {
      source: spinnerSource,
      style: spinnerStyle,
      resizeMode: renderState.spinnerResizeMode,
    },
  }
}

export function createChatRuntimeConnectionBannerMobilePropsParts<
  TRenderState extends {
    surface: {
      subtitleNumberOfLines: unknown
    }
    reconnecting: {
      shouldRender: boolean
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string | null
      spinner: object
    }
    failed: {
      shouldRender: boolean
      accessibilityRole: unknown
      accessibilityLabel: string
      title: string
      subtitle: string
      icon: object
      retryButton: {
        accessibilityRole: unknown
        accessibilityLabel: string
        pressedOpacity: number
        label: string
      }
    }
  },
  TOnRetry,
  TStyles extends {
    banner: unknown
    reconnecting: unknown
    failed: unknown
    content: unknown
    icon: unknown
    textContainer: unknown
    title: unknown
    subtitle: unknown
    retryButton: unknown
    retryButtonText: unknown
  },
>({
  renderState,
  onRetry,
  styles,
}: ChatRuntimeConnectionBannerMobilePropsPartsInput<
  TRenderState,
  TOnRetry,
  TStyles
>): ChatRuntimeConnectionBannerMobilePropsParts<
  TRenderState,
  TOnRetry,
  TStyles
> {
  return {
    reconnecting: renderState.reconnecting.shouldRender ? {
      container: {
        accessible: true,
        accessibilityRole: renderState.reconnecting.accessibilityRole,
        accessibilityLabel: renderState.reconnecting.accessibilityLabel,
        style: [styles.banner, styles.reconnecting],
      },
      content: {
        style: styles.content,
      },
      spinner: {
        ...renderState.reconnecting.spinner,
        style: styles.icon,
      },
      textContainer: {
        style: styles.textContainer,
      },
      title: {
        style: styles.title,
        text: renderState.reconnecting.title,
      },
      subtitle: renderState.reconnecting.subtitle ? {
        style: styles.subtitle,
        numberOfLines: renderState.surface.subtitleNumberOfLines,
        text: renderState.reconnecting.subtitle,
      } : null,
    } : null,
    failed: renderState.failed.shouldRender ? {
      container: {
        accessible: true,
        accessibilityRole: renderState.failed.accessibilityRole,
        accessibilityLabel: renderState.failed.accessibilityLabel,
        style: [styles.banner, styles.failed],
      },
      content: {
        style: styles.content,
      },
      icon: {
        ...renderState.failed.icon,
        style: styles.icon,
      },
      textContainer: {
        style: styles.textContainer,
      },
      title: {
        style: styles.title,
        text: renderState.failed.title,
      },
      subtitle: {
        style: styles.subtitle,
        numberOfLines: renderState.surface.subtitleNumberOfLines,
        text: renderState.failed.subtitle,
      },
      retryButton: {
        style: styles.retryButton,
        onPress: onRetry,
        accessibilityRole: renderState.failed.retryButton.accessibilityRole,
        accessibilityLabel: renderState.failed.retryButton.accessibilityLabel,
        activeOpacity: renderState.failed.retryButton.pressedOpacity,
      },
      retryLabel: {
        style: styles.retryButtonText,
        text: renderState.failed.retryButton.label,
      },
    } : null,
  }
}

export function createChatRuntimeRetryStatusMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    spinner: unknown
    surface: {
      titleNumberOfLines: unknown
    }
    title: string
    attemptLabel: string
    countdownLabel: string
    description: string
  },
  TStyles extends {
    card: unknown
    header: unknown
    title: unknown
    metaRow: unknown
    attempt: unknown
    countdown: unknown
    description: unknown
  },
>({
  renderState,
  styles,
}: ChatRuntimeRetryStatusMobilePropsPartsInput<
  TRenderState,
  TStyles
>): ChatRuntimeRetryStatusMobilePropsParts<
  TRenderState,
  TStyles
> {
  return {
    shouldRenderRetryStatus: renderState.shouldRender,
    card: {
      accessible: true,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      style: styles.card,
    },
    header: {
      style: styles.header,
    },
    icon: renderState.icon,
    title: {
      style: styles.title,
      numberOfLines: renderState.surface.titleNumberOfLines,
      text: renderState.title,
    },
    spinner: renderState.spinner,
    meta: {
      style: styles.metaRow,
    },
    attempt: {
      style: styles.attempt,
      text: renderState.attemptLabel,
    },
    countdown: {
      style: styles.countdown,
      text: renderState.countdownLabel,
    },
    description: {
      style: styles.description,
      text: renderState.description,
    },
  }
}

export function createChatRuntimeToolApprovalMobilePropsParts<
  TOnToggleArguments,
  TOnDeny,
  TOnApprove,
  TStyles extends ChatRuntimeToolApprovalMobilePropsPartsStyleSlots,
>({
  renderState,
  toolName,
  argumentsPreview,
  argumentsContent,
  onToggleArguments,
  onDeny,
  onApprove,
  styles,
}: ChatRuntimeToolApprovalMobilePropsPartsInput<
  TOnToggleArguments,
  TOnDeny,
  TOnApprove,
  TStyles
>): ChatRuntimeToolApprovalMobilePropsParts<
  TOnToggleArguments,
  TOnDeny,
  TOnApprove,
  TStyles
> {
  return {
    card: {
      style: styles.card,
    },
    header: {
      style: styles.header,
    },
    headerIcon: renderState.headerIcon,
    title: {
      style: styles.title,
      numberOfLines: renderState.surface.title.numberOfLines,
      text: renderState.title,
    },
    headerSpinner: renderState.approveButton.isDisabled ? renderState.spinner : null,
    content: {
      style: [
        styles.content,
        renderState.approveButton.isDisabled && styles.contentDisabled,
      ],
    },
    toolRow: {
      style: styles.toolRow,
    },
    toolLabel: {
      style: styles.toolLabel,
      text: renderState.copy.toolLabel,
    },
    toolName: {
      style: styles.toolName,
      numberOfLines: renderState.surface.toolName.numberOfLines,
      text: toolName,
    },
    argumentsPreview: argumentsPreview ? {
      style: styles.argumentsPreview,
      numberOfLines: renderState.surface.argumentsPreview.numberOfLines,
      text: argumentsPreview,
    } : null,
    argumentsToggle: {
      onPress: onToggleArguments,
      disabled: renderState.argumentsToggle.isDisabled,
      accessibilityRole: renderState.argumentsToggle.accessibilityRole,
      accessibilityLabel: renderState.argumentsToggle.accessibilityLabel,
      accessibilityState: renderState.argumentsToggle.accessibilityState,
      ariaExpanded: renderState.argumentsToggle.ariaExpanded,
      style: ({ pressed }) => [
        styles.argumentsToggle,
        pressed && styles.argumentsTogglePressed,
        renderState.argumentsToggle.isDisabled && styles.buttonDisabled,
      ],
      icon: renderState.argumentsToggle.icon,
      label: {
        style: styles.argumentsToggleText,
        text: renderState.argumentsToggle.label,
      },
    },
    fullArguments: renderState.argumentsToggle.ariaExpanded ? {
      scroll: {
        style: styles.argumentsScroll,
        nestedScrollEnabled: true,
      },
      text: {
        style: styles.argumentsFull,
        text: argumentsContent,
      },
    } : null,
    actions: {
      style: styles.actions,
    },
    denyButton: {
      style: [
        styles.button,
        styles.denyButton,
        renderState.denyButton.isDisabled && styles.buttonDisabled,
      ],
      onPress: onDeny,
      disabled: renderState.denyButton.isDisabled,
      accessibilityRole: renderState.denyButton.accessibilityRole,
      accessibilityLabel: renderState.denyButton.accessibilityLabel,
      accessibilityState: renderState.denyButton.accessibilityState,
      icon: renderState.denyButton.icon,
      label: {
        style: styles.denyButtonText,
        text: renderState.denyButton.label,
      },
    },
    approveButton: {
      style: [
        styles.button,
        styles.approveButton,
        renderState.approveButton.isDisabled && styles.buttonDisabled,
      ],
      onPress: onApprove,
      disabled: renderState.approveButton.isDisabled,
      accessibilityRole: renderState.approveButton.accessibilityRole,
      accessibilityLabel: renderState.approveButton.accessibilityLabel,
      accessibilityState: renderState.approveButton.accessibilityState,
      icon: renderState.approveButton.isDisabled ? null : renderState.approveButton.icon,
      spinner: renderState.approveButton.isDisabled ? renderState.approveButton.spinner : null,
      label: {
        style: styles.approveButtonText,
        text: renderState.approveButton.label,
      },
    },
  }
}

export function createChatRuntimeDelegationCardMobilePropsParts<
  TConversationPreviewOnShowAll,
  TToolPreviewOnShowAll,
  TStyles extends ChatRuntimeDelegationCardMobilePropsPartsStyleSlots,
>({
  surface,
  agentName,
  presentation,
  accessibilityLabel,
  messageCountLabel,
  statusStyles,
  conversationPreview,
  toolPreview,
  styles,
}: ChatRuntimeDelegationCardMobilePropsPartsInput<
  TConversationPreviewOnShowAll,
  TToolPreviewOnShowAll,
  TStyles
>): ChatRuntimeDelegationCardMobilePropsParts<
  TConversationPreviewOnShowAll,
  TToolPreviewOnShowAll,
  TStyles
> {
  const metaItems = [{
    key: "source",
    text: presentation.sourceLabel,
  }]
  if (presentation.trackingLabel) {
    metaItems.push({
      key: "tracking",
      text: presentation.trackingLabel,
    })
  }
  if (messageCountLabel) {
    metaItems.push({
      key: "messages",
      text: messageCountLabel,
    })
  }

  return {
    card: {
      accessible: true,
      accessibilityRole: surface.accessibilityRole,
      accessibilityLabel,
      style: styles.card,
    },
    header: {
      style: styles.header,
    },
    title: {
      style: styles.title,
      numberOfLines: surface.titleNumberOfLines,
      text: agentName,
    },
    statusBadge: {
      style: [
        styles.statusBadge,
        statusStyles.chip,
      ],
    },
    statusText: {
      style: [
        styles.statusText,
        statusStyles.text,
      ],
      numberOfLines: surface.statusNumberOfLines,
      text: presentation.statusLabel,
    },
    liveText: presentation.isActive ? {
      style: styles.liveText,
      text: surface.liveLabel,
    } : null,
    subtitle: presentation.subtitle ? {
      style: styles.subtitle,
      numberOfLines: surface.subtitleNumberOfLines,
      text: presentation.subtitle,
    } : null,
    meta: {
      style: styles.metaRow,
      items: metaItems.map((item) => ({
        ...item,
        style: styles.metaText,
        numberOfLines: surface.metaNumberOfLines,
      })),
    },
    conversationPreview: conversationPreview.rows.length > 0 ? {
      style: styles.conversationPreview,
      rows: conversationPreview.rows.map((row, rowIndex) => ({
        key: `${row.timestamp}-${row.role}-${rowIndex}`,
        line: {
          style: styles.conversationPreviewLine,
        },
        role: {
          style: [
            styles.conversationPreviewRole,
            conversationPreview.roleStyles[row.role],
          ],
          numberOfLines: surface.conversationPreviewRoleNumberOfLines,
          ellipsizeMode: surface.conversationPreviewRoleEllipsizeMode,
          text: row.roleLabel,
        },
        content: {
          style: styles.conversationPreviewContent,
          numberOfLines: surface.conversationPreviewContentNumberOfLines,
          ellipsizeMode: surface.conversationPreviewContentEllipsizeMode,
          text: row.content,
        },
        timestamp: row.timestampLabel ? {
          style: styles.conversationPreviewTimestamp,
          numberOfLines: surface.conversationPreviewTimestampNumberOfLines,
          text: row.timestampLabel,
        } : null,
      })),
      moreAction: conversationPreview.hiddenCount > 0 && conversationPreview.onShowAll ? {
        button: {
          onPress: conversationPreview.onShowAll,
          accessibilityRole: conversationPreview.moreAction.accessibilityRole,
          accessibilityLabel: conversationPreview.moreAction.accessibilityLabel,
          style: ({ pressed }: { pressed: boolean }) => [
            styles.conversationPreviewMoreButton,
            pressed && styles.conversationPreviewMoreButtonPressed,
          ],
        },
        label: {
          style: styles.conversationPreviewMore,
          numberOfLines: conversationPreview.moreAction.numberOfLines,
          text: conversationPreview.moreAction.label,
        },
      } : null,
    } : null,
    toolPreview: toolPreview.shouldRender ? {
      style: styles.toolPreview,
      label: {
        style: styles.toolPreviewLabel,
        numberOfLines: surface.toolPreviewLabelNumberOfLines,
        text: toolPreview.label,
      },
      rows: toolPreview.rows.map(({ key, preview, renderState }) => {
        const spinner = renderState.statusIndicator.spinner.shouldRender
          ? renderState.statusIndicator.spinner
          : null
        const icon = !spinner && renderState.statusIndicator.icon.shouldRender
          ? renderState.statusIndicator.icon
          : null

        return {
          key,
          line: {
            style: styles.toolPreviewLine,
            accessibilityLabel: renderState.accessibilityLabel,
          },
          statusIcon: {
            style: styles.toolPreviewStatusIcon,
            accessibilityElementsHidden: true,
            importantForAccessibility: "no-hide-descendants" as const,
            spinner,
            icon,
          },
          name: {
            style: [
              styles.toolPreviewName,
              renderState.isPending && styles.toolPreviewNamePending,
              renderState.isSuccess && styles.toolPreviewNameSuccess,
              renderState.isError && styles.toolPreviewNameError,
            ],
            numberOfLines: renderState.name.numberOfLines,
            ellipsizeMode: renderState.name.ellipsizeMode,
            text: preview,
          },
        }
      }),
      moreAction: toolPreview.hiddenCount > 0 && toolPreview.onShowAll ? {
        button: {
          onPress: toolPreview.onShowAll,
          accessibilityRole: toolPreview.moreAction.accessibilityRole,
          accessibilityLabel: toolPreview.moreAction.accessibilityLabel,
          style: ({ pressed }: { pressed: boolean }) => [
            styles.toolPreviewMoreButton,
            pressed && styles.toolPreviewMoreButtonPressed,
          ],
        },
        label: {
          style: styles.toolPreviewMore,
          numberOfLines: toolPreview.moreAction.numberOfLines,
          text: toolPreview.moreAction.label,
        },
      } : null,
    } : null,
  }
}

export function createChatRuntimeTurnDurationBadgeMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    isLive: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    icon: unknown
    label: string
    badge: {
      numberOfLines: unknown
    }
  },
  TStyle,
  TLiveStyle,
  TTextStyle,
  TLiveTextStyle,
>({
  renderState,
  style,
  liveStyle,
  textStyle,
  liveTextStyle,
}: ChatRuntimeTurnDurationBadgeMobilePropsPartsInput<
  TRenderState,
  TStyle,
  TLiveStyle,
  TTextStyle,
  TLiveTextStyle
>): ChatRuntimeTurnDurationBadgeMobilePropsParts<
  TRenderState,
  TStyle,
  TLiveStyle,
  TTextStyle,
  TLiveTextStyle
> {
  return {
    shouldRenderBadge: renderState.shouldRender,
    container: {
      accessible: true,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      style,
      liveStyle,
      isLive: renderState.isLive,
    },
    icon: renderState.icon,
    label: {
      style: textStyle,
      liveStyle: liveTextStyle,
      isLive: renderState.isLive,
      numberOfLines: renderState.badge.numberOfLines,
      text: renderState.label,
    },
  }
}

export function createChatRuntimeConversationExpandedContentMobilePropsParts<
  TStreamingRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    content: string
    icon: {
      name: unknown
      size: unknown
      color: unknown
    }
    spinner: {
      resizeMode: unknown
    }
    surface: {
      titleNumberOfLines: unknown
    }
  },
  TMarkdownContent,
  TAssetBaseUrl,
  TAssetAuthToken,
  TSpinnerSource,
  TStreamingStyles extends {
    header: unknown
    title: unknown
    spinner: unknown
    badge: unknown
    badgeText: unknown
    bodyRow: unknown
    text: unknown
    caret: unknown
  },
>({
  streamingRenderState,
  markdownContent,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  streamingStyles,
}: ChatRuntimeConversationExpandedContentMobilePropsPartsInput<
  TStreamingRenderState,
  TMarkdownContent,
  TAssetBaseUrl,
  TAssetAuthToken,
  TSpinnerSource,
  TStreamingStyles
>): ChatRuntimeConversationExpandedContentMobilePropsParts<
  TStreamingRenderState,
  TMarkdownContent,
  TAssetBaseUrl,
  TAssetAuthToken,
  TSpinnerSource,
  TStreamingStyles
> {
  return {
    shouldRenderStreamingContent: streamingRenderState.shouldRender,
    markdown: {
      content: markdownContent,
      assetBaseUrl,
      assetAuthToken,
    },
    header: {
      accessible: true,
      accessibilityRole: streamingRenderState.accessibilityRole,
      accessibilityLabel: streamingRenderState.accessibilityLabel,
      style: streamingStyles.header,
    },
    icon: streamingRenderState.icon,
    title: {
      style: streamingStyles.title,
      numberOfLines: streamingRenderState.surface.titleNumberOfLines,
      text: streamingRenderState.title,
    },
    spinner: {
      source: spinnerSource,
      style: streamingStyles.spinner,
      resizeMode: streamingRenderState.spinner.resizeMode,
    },
    badge: {
      style: streamingStyles.badge,
    },
    badgeLabel: {
      style: streamingStyles.badgeText,
      text: streamingRenderState.badgeLabel,
    },
    body: {
      style: streamingStyles.bodyRow,
    },
    text: {
      style: streamingStyles.text,
      text: streamingRenderState.content,
    },
    caret: {
      style: streamingStyles.caret,
    },
  }
}

export function createChatRuntimeConversationCollapsedPreviewMobilePropsParts<
  TRenderState extends {
    accessibilityRole: unknown
    hitSlop: unknown
    numberOfLines: unknown
    text: string
  },
  TActionState extends {
    disabled: boolean
    accessibilityLabel: string
    accessibilityHint?: string
    accessibilityState: unknown
    ariaExpanded: unknown
  },
  TOnPress,
  TStyle,
  TPressedStyle,
  TTextStyle,
>({
  renderState,
  actionState,
  onPress,
  style,
  pressedStyle,
  textStyle,
}: ChatRuntimeConversationCollapsedPreviewMobilePropsPartsInput<
  TRenderState,
  TActionState,
  TOnPress,
  TStyle,
  TPressedStyle,
  TTextStyle
>): ChatRuntimeConversationCollapsedPreviewMobilePropsParts<
  TRenderState,
  TActionState,
  TOnPress,
  TStyle,
  TPressedStyle,
  TTextStyle
> {
  return {
    pressable: {
      onPress,
      disabled: actionState.disabled,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: actionState.accessibilityLabel,
      accessibilityHint: actionState.accessibilityHint,
      accessibilityState: actionState.accessibilityState,
      ariaExpanded: actionState.ariaExpanded,
      hitSlop: renderState.hitSlop,
      style: ({ pressed }: { pressed: boolean }) => [
        style,
        pressed && !actionState.disabled && pressedStyle,
      ],
    },
    text: {
      style: textStyle,
      numberOfLines: renderState.numberOfLines,
      text: renderState.text,
    },
  }
}

export function createChatRuntimeMessageHistoryBannerMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    summaryLabel: string
    loadButton: {
      accessibilityRole: unknown
      accessibilityLabel: string
      label: string
      icon: unknown
    }
  },
  TOnLoadEarlier,
  TStyles extends {
    container: unknown
    summary: unknown
    loadButton: unknown
    loadButtonPressed: unknown
    loadButtonText: unknown
  },
>({
  renderState,
  onLoadEarlier,
  styles,
}: ChatRuntimeMessageHistoryBannerMobilePropsPartsInput<
  TRenderState,
  TOnLoadEarlier,
  TStyles
>): ChatRuntimeMessageHistoryBannerMobilePropsParts<
  TRenderState,
  TOnLoadEarlier,
  TStyles
> {
  return {
    shouldRenderBanner: renderState.shouldRender,
    container: {
      style: styles.container,
    },
    summary: {
      style: styles.summary,
      text: renderState.summaryLabel,
    },
    loadButton: {
      onPress: onLoadEarlier,
      accessibilityRole: renderState.loadButton.accessibilityRole,
      accessibilityLabel: renderState.loadButton.accessibilityLabel,
      style: styles.loadButton,
      pressedStyle: styles.loadButtonPressed,
    },
    icon: renderState.loadButton.icon,
    loadButtonLabel: {
      style: styles.loadButtonText,
      text: renderState.loadButton.label,
    },
  }
}

export function createChatRuntimeStepSummaryCardMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    accessibilityRole: unknown
    accessibilityLabel: string
    title: string
    badgeLabel: string
    actionSummary: string
    meta: string
    preview: string
    surface: {
      titleNumberOfLines: unknown
      badgeNumberOfLines: unknown
      actionNumberOfLines: unknown
      metaNumberOfLines: unknown
      previewNumberOfLines: unknown
    }
  },
  TStyles extends {
    card: unknown
    header: unknown
    title: unknown
    badge: unknown
    badgeText: unknown
    action: unknown
    meta: unknown
    preview: unknown
  },
>({
  renderState,
  styles,
}: ChatRuntimeStepSummaryCardMobilePropsPartsInput<
  TRenderState,
  TStyles
>): ChatRuntimeStepSummaryCardMobilePropsParts<
  TRenderState,
  TStyles
> {
  return {
    shouldRenderCard: renderState.shouldRender,
    card: {
      accessible: true,
      accessibilityRole: renderState.accessibilityRole,
      accessibilityLabel: renderState.accessibilityLabel,
      style: styles.card,
    },
    header: {
      style: styles.header,
    },
    title: {
      style: styles.title,
      numberOfLines: renderState.surface.titleNumberOfLines,
      text: renderState.title,
    },
    badge: {
      style: styles.badge,
    },
    badgeLabel: {
      style: styles.badgeText,
      numberOfLines: renderState.surface.badgeNumberOfLines,
      text: renderState.badgeLabel,
    },
    action: {
      style: styles.action,
      numberOfLines: renderState.surface.actionNumberOfLines,
      text: renderState.actionSummary,
    },
    meta: {
      style: styles.meta,
      numberOfLines: renderState.surface.metaNumberOfLines,
      text: renderState.meta,
    },
    preview: {
      shouldRender: Boolean(renderState.preview),
      style: styles.preview,
      numberOfLines: renderState.surface.previewNumberOfLines,
      text: renderState.preview,
    },
  }
}

export function createChatRuntimeConversationViewportMobilePropsParts<
  TLoadingState extends object,
  THomeQuickStarts extends object,
  THistoryBanner extends object,
  TStepSummary extends object,
  TDebugPanels extends object,
  TScrollViewportStyle,
  TScrollViewportContentContainerStyle,
  TLoadingStateStyle,
  TLoadingStateSpinnerStyle,
  THomeQuickStartsStyles,
  THistoryBannerStyles,
  TStepSummaryStyles,
  TDebugPanelStyle,
  TDebugPanelTextStyle,
>({
  loadingState,
  homeQuickStarts,
  historyBanner,
  stepSummary,
  debugPanels,
  styles,
}: ChatRuntimeConversationViewportMobilePropsPartsInput<
  TLoadingState,
  THomeQuickStarts,
  THistoryBanner,
  TStepSummary,
  TDebugPanels,
  TScrollViewportStyle,
  TScrollViewportContentContainerStyle,
  TLoadingStateStyle,
  TLoadingStateSpinnerStyle,
  THomeQuickStartsStyles,
  THistoryBannerStyles,
  TStepSummaryStyles,
  TDebugPanelStyle,
  TDebugPanelTextStyle
>): ChatRuntimeConversationViewportMobilePropsParts<
  TLoadingState,
  THomeQuickStarts,
  THistoryBanner,
  TStepSummary,
  TDebugPanels,
  TScrollViewportStyle,
  TScrollViewportContentContainerStyle,
  TLoadingStateStyle,
  TLoadingStateSpinnerStyle,
  THomeQuickStartsStyles,
  THistoryBannerStyles,
  TStepSummaryStyles,
  TDebugPanelStyle,
  TDebugPanelTextStyle
> {
  return {
    scrollViewport: {
      style: styles.scrollViewport.style,
      contentContainerStyle: styles.scrollViewport.contentContainerStyle,
    },
    loadingState: {
      ...loadingState,
      style: styles.loadingState.style,
      spinnerStyle: styles.loadingState.spinnerStyle,
    },
    homeQuickStarts: {
      ...homeQuickStarts,
      styles: styles.homeQuickStarts,
    },
    historyBanner: {
      ...historyBanner,
      styles: styles.historyBanner,
    },
    stepSummary: {
      ...stepSummary,
      styles: styles.stepSummary,
    },
    debugPanels: {
      ...debugPanels,
      panelStyle: styles.debugPanels.panelStyle,
      textStyle: styles.debugPanels.textStyle,
    },
  }
}

export function createChatRuntimeConversationDockMobilePropsParts<
  TResponseHistoryPanel extends object,
  TScrollToBottomButton extends object,
  TVoiceOverlay extends object,
  TQueuePanel extends object,
  TConnectionBanner extends object,
  TComposer extends object,
  TScrollToBottomButtonStyle,
  TVoiceOverlayStyles,
  TQueuePanelStyle,
  TConnectionBannerStyles,
  TComposerStyles,
>({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
  styles,
}: ChatRuntimeConversationDockMobilePropsPartsInput<
  TResponseHistoryPanel,
  TScrollToBottomButton,
  TVoiceOverlay,
  TQueuePanel,
  TConnectionBanner,
  TComposer,
  TScrollToBottomButtonStyle,
  TVoiceOverlayStyles,
  TQueuePanelStyle,
  TConnectionBannerStyles,
  TComposerStyles
>): ChatRuntimeConversationDockMobilePropsParts<
  TResponseHistoryPanel,
  TScrollToBottomButton,
  TVoiceOverlay,
  TQueuePanel,
  TConnectionBanner,
  TComposer,
  TScrollToBottomButtonStyle,
  TVoiceOverlayStyles,
  TQueuePanelStyle,
  TConnectionBannerStyles,
  TComposerStyles
> {
  return {
    responseHistoryPanel,
    scrollToBottomButton: {
      ...scrollToBottomButton,
      style: styles.scrollToBottomButtonStyle,
    },
    voiceOverlay: {
      ...voiceOverlay,
      styles: styles.voiceOverlay,
    },
    queuePanel: {
      ...queuePanel,
      style: styles.queuePanelStyle,
    },
    connectionBanner: {
      ...connectionBanner,
      styles: styles.connectionBanner,
    },
    composer: {
      ...composer,
      styles: styles.composer,
    },
  }
}

export function createChatRuntimeScrollToBottomButtonMobilePropsParts<
  TRenderState extends {
    shouldRender: boolean
    button: {
      pressedOpacity: unknown
      accessibilityRole: unknown
      accessibilityLabel: string
      accessibilityHint: string
      icon: unknown
    }
  },
  TOnPress,
  TStyle,
>({
  renderState,
  onPress,
  style,
}: ChatRuntimeScrollToBottomButtonMobilePropsPartsInput<
  TRenderState,
  TOnPress,
  TStyle
>): ChatRuntimeScrollToBottomButtonMobilePropsParts<
  TRenderState,
  TOnPress,
  TStyle
> {
  return {
    shouldRenderButton: renderState.shouldRender,
    button: {
      style,
      onPress,
      activeOpacity: renderState.button.pressedOpacity,
      accessibilityRole: renderState.button.accessibilityRole,
      accessibilityLabel: renderState.button.accessibilityLabel,
      accessibilityHint: renderState.button.accessibilityHint,
    },
    icon: renderState.button.icon,
  }
}

export function createChatRuntimeConversationSurfaceMobilePropsParts<
  TFrame extends object,
  TDock extends object,
  TOverlays extends object,
  TThreadList extends object,
  TViewport extends object,
  TFrameKeyboardAvoidingStyle,
  TFrameRootStyle,
  TDockStyles,
  TViewportStyles,
>({
  frame,
  dock,
  overlays,
  threadList,
  viewport,
  styles,
}: ChatRuntimeConversationSurfaceMobilePropsPartsInput<
  TFrame,
  TDock,
  TOverlays,
  TThreadList,
  TViewport,
  TFrameKeyboardAvoidingStyle,
  TFrameRootStyle,
  TDockStyles,
  TViewportStyles
>): ChatRuntimeConversationSurfaceMobilePropsParts<
  TFrame,
  TDock,
  TOverlays,
  TThreadList,
  TViewport,
  TFrameKeyboardAvoidingStyle,
  TFrameRootStyle,
  TDockStyles,
  TViewportStyles
> {
  return {
    frame: {
      ...frame,
      keyboardAvoidingStyle: styles.frame.keyboardAvoidingStyle,
      rootStyle: styles.frame.rootStyle,
    },
    dock: {
      ...dock,
      styles: styles.dock,
    },
    overlays,
    threadList,
    viewport: {
      ...viewport,
      styles: styles.viewport,
    },
  }
}

export function createChatRuntimeConversationBodyPanelMobilePropsParts<
  TContent extends { expanded: object; collapsed: object },
  TToolExecutionStack extends object,
  TStandaloneActions extends object,
  TContentRowStyle,
  TExpandedBodyStyle,
  TStreamingStyles,
  TCollapsedStyle,
  TCollapsedPressedStyle,
  TCollapsedTextStyle,
  TToolExecutionStackStyles,
  TStandaloneActionsRowStyle,
>({
  conversation,
  styles,
}: ChatRuntimeConversationBodyPanelMobilePropsPartsInput<
  TContent,
  TToolExecutionStack,
  TStandaloneActions,
  TContentRowStyle,
  TExpandedBodyStyle,
  TStreamingStyles,
  TCollapsedStyle,
  TCollapsedPressedStyle,
  TCollapsedTextStyle,
  TToolExecutionStackStyles,
  TStandaloneActionsRowStyle
>): ChatRuntimeConversationBodyPanelMobilePropsParts<
  TContent,
  TToolExecutionStack,
  TStandaloneActions,
  TContentRowStyle,
  TExpandedBodyStyle,
  TStreamingStyles,
  TCollapsedStyle,
  TCollapsedPressedStyle,
  TCollapsedTextStyle,
  TToolExecutionStackStyles,
  TStandaloneActionsRowStyle
> {
  return {
    content: {
      ...conversation.content,
      rowStyle: styles.content.rowStyle,
      expanded: {
        ...conversation.content.expanded,
        bodyStyle: styles.content.expandedBodyStyle,
        streamingStyles: styles.content.streamingStyles,
      },
      collapsed: {
        ...conversation.content.collapsed,
        style: styles.content.collapsedStyle,
        pressedStyle: styles.content.collapsedPressedStyle,
        textStyle: styles.content.collapsedTextStyle,
      },
    },
    toolExecutionStack: {
      ...conversation.toolExecutionStack,
      styles: styles.toolExecutionStack,
    },
    standaloneActions: {
      ...conversation.standaloneActions,
      rowStyle: styles.standaloneActions.rowStyle,
    },
  }
}

export function createChatRuntimeConversationBodyMobileProps<
  TActionEntry,
  TSpinnerSource,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TCollapsedPreviewPress = () => void,
>({
  contentDisplayMode,
  actionSet,
  expanded,
  collapsed,
  toolExecutionStack,
}: ChatRuntimeConversationBodyMobilePropsInput<
  TActionEntry,
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken,
  TCollapsedPreviewPress
>): ChatRuntimeConversationBodyMobileProps<
  TActionEntry,
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken,
  TCollapsedPreviewPress
> {
  return {
    content: {
      contentDisplayMode,
      shouldRenderActionSlots: actionSet.shouldRenderActionSlots,
      entries: actionSet.entries,
      expanded: createChatRuntimeConversationExpandedContentMobileProps(expanded),
      collapsed: createChatRuntimeConversationCollapsedPreviewMobileProps(collapsed),
    },
    toolExecutionStack: createChatRuntimeConversationToolExecutionStackMobileProps(toolExecutionStack),
    standaloneActions: {
      shouldRender: actionSet.shouldRenderStandaloneActions,
      entries: actionSet.entries,
    },
  }
}

export function createChatRuntimeConversationThreadBodyMobileProps<
  TConversation,
  TInlineActivity = unknown,
>({
  bodyDisplayMode,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatRuntimeConversationThreadBodyMobilePropsInput<
  TConversation,
  TInlineActivity
>): ChatRuntimeConversationThreadBodyMobileProps<
  TConversation,
  TInlineActivity
> {
  return {
    bodyDisplayMode,
    retryStatus: createChatRuntimeConversationRetryStatusMobileProps(retryStatus),
    delegationCard: createChatRuntimeDelegationCardMobileProps(delegationCard),
    toolApproval: createChatRuntimeConversationToolApprovalMobileProps(toolApproval),
    inlineActivity: inlineActivity ?? null,
    conversation,
  }
}

export function getChatRuntimeConversationTurnDurationMobileState<
  TTurnDuration extends ChatRuntimeConversationTurnDurationMobileState | undefined =
    ChatRuntimeConversationTurnDurationMobileState | undefined,
>({
  message,
  byUserTimestamp,
}: ChatRuntimeConversationTurnDurationMobileStateInput<TTurnDuration>): TTurnDuration | undefined {
  return typeof message.timestamp === "number"
    ? byUserTimestamp.get(message.timestamp)
    : undefined
}

export function getChatRuntimeConversationThreadBodyMobileState<
  TTurnDurationStyle extends object = Record<string, never>,
  TSpeechStyle extends object = Record<string, never>,
  TBranchStyle extends object = Record<string, never>,
  TCopyStyle extends object = Record<string, never>,
  TExpansionStyle extends object = Record<string, never>,
  TContentColors = unknown,
  TSpinnerSource = unknown,
  TAssetBaseUrl = string,
  TAssetAuthToken = string,
  TRetryInfo extends ChatRuntimeRetryInfoLike | null | undefined =
    ChatRuntimeRetryInfoLike | null | undefined,
  TDelegation = unknown,
>({
  message,
  messageIndex,
  renderContext,
  turnDurationsByUserTimestamp,
  conversationId,
  pendingBranchMessageIndex,
  isResponding,
  isSpeaking,
  isCopied,
  ttsEnabled,
  colors,
  actionStyles,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  presentation,
  expandedDelegationConversationPreviews,
  expandedDelegationToolPreviews,
  setExpandedDelegationConversationPreviews,
  setExpandedDelegationToolPreviews,
  expandedToolApprovals,
  pendingApprovalResponseId,
  onToggleToolApprovalArguments,
  onRespondToToolApproval,
  expandedToolCalls,
  onToggleToolCall,
  onCopyToolPayload,
  onSpeakMessage,
  onBranchMessage,
  onCopyMessage,
  onToggleMessageExpansion,
}: ChatRuntimeConversationThreadBodyMobileStateInput<
  TTurnDurationStyle,
  TSpeechStyle,
  TBranchStyle,
  TCopyStyle,
  TExpansionStyle,
  TContentColors,
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken,
  TRetryInfo,
  TDelegation
>): ChatRuntimeConversationThreadBodyMobileState<
  TTurnDurationStyle,
  TSpeechStyle,
  TBranchStyle,
  TCopyStyle,
  TExpansionStyle,
  TContentColors,
  TSpinnerSource,
  TAssetBaseUrl,
  TAssetAuthToken,
  TRetryInfo,
  TDelegation
> {
  const {
    visibleMessageContent,
    renderedToolEntries,
    displayToolCallCount,
    isExpanded,
    isLiveStreamingAssistantMessage,
    messageRenderState,
  } = renderContext
  const turnDuration = getChatRuntimeConversationTurnDurationMobileState({
    message,
    byUserTimestamp: turnDurationsByUserTimestamp,
  })
  const retryStatus = getChatRuntimeConversationRetryStatusMobileState({
    message,
    colors,
  })
  const delegationCard = getChatRuntimeConversationDelegationCardMobileState({
    message,
    surface: presentation.delegationSurface,
    toolEntries: renderedToolEntries,
    displayToolCallCount,
    expandedDelegationConversationPreviews,
    expandedDelegationToolPreviews,
    roleStyles: presentation.delegationRoleStyles,
    colors,
    setExpandedDelegationConversationPreviews,
    setExpandedDelegationToolPreviews,
  })
  const toolApproval = getChatRuntimeConversationToolApprovalMobileState({
    message,
    expandedToolApprovals,
    pendingApprovalResponseId,
    colors,
    onToggleArguments: onToggleToolApprovalArguments,
    onRespondToToolApproval,
  })
  const inlineActivity = getChatRuntimeInlineActivityMobileIndicatorState({
    message,
    isResponding,
    spinnerSource,
  })

  return {
    bodyDisplayMode: getChatRuntimeConversationThreadBodyMobileDisplayMode({
      retryStatus,
      delegationCard,
      toolApproval,
      inlineActivity,
    }),
    retryStatus,
    delegationCard,
    toolApproval,
    inlineActivity,
    conversation: {
      surfaceToneStyleSlot: messageRenderState.toneStyleSlot,
      actionSet: getChatRuntimeConversationActionSetMobileState({
        message,
        messageIndex,
        messageRenderState,
        visibleMessageContent,
        turnDuration,
        conversationId,
        pendingBranchMessageIndex,
        isResponding,
        isSpeaking,
        isCopied,
        ttsEnabled,
        colors,
        styles: actionStyles,
        onSpeakMessage,
        onBranchMessage,
        onCopyMessage,
        onToggleMessageExpansion,
      }),
      ...getChatRuntimeConversationContentMobileState({
        messageIndex,
        visibleMessageContent,
        isStreaming: isLiveStreamingAssistantMessage,
        contentState: messageRenderState.content,
        collapsedPreview: messageRenderState.collapsedPreview,
        collapsedPreviewAction: messageRenderState.collapsedPreviewAction,
        colors,
        assetBaseUrl,
        assetAuthToken,
        spinnerSource,
        onToggleMessageExpansion,
      }),
      toolExecutionStack: getChatRuntimeConversationToolExecutionStackMobileState({
        message,
        messageIndex,
        displayToolCallCount,
        renderedToolEntries,
        isExpanded,
        expandedToolCalls,
        previewNumberOfLines: presentation.toolPayloadPreviewNumberOfLines,
        pendingResultRenderState: presentation.pendingToolResultRenderState,
        emptyStateRenderState: presentation.toolExecutionEmptyStateRenderState,
        colors,
        onToggleToolCall,
        onCopyPayload: onCopyToolPayload,
        onToggleMessageExpansion,
      }),
    },
  }
}

export function getChatRuntimeToolExecutionCompactPreviewMobileRowState({
  key,
  toolCall,
  label,
  result,
  colors,
}: ChatRuntimeToolExecutionCompactPreviewMobileRowInput): ChatRuntimeToolExecutionCompactPreviewMobileRowState {
  const state = getToolExecutionCallDisplayState(result)
  const preview = label ?? getCompactToolExecutionPreview(toolCall, result ?? null)

  return {
    key,
    preview,
    renderState: getToolExecutionCompactMobileRenderState({
      state,
      preview,
      colors,
    }),
  }
}

export function getChatRuntimeDelegationToolPreviewRowsMobileRenderState({
  rows,
  colors,
}: ChatRuntimeDelegationToolPreviewRowsMobileRenderStateInput): ChatRuntimeToolExecutionCompactPreviewMobileRowState[] {
  return rows.map(({ toolCall, label, result }, toolIndex) =>
    getChatRuntimeToolExecutionCompactPreviewMobileRowState({
      key: `${toolCall.name}-${toolIndex}`,
      toolCall,
      label,
      result,
      colors,
    }),
  )
}

export function getChatRuntimeDelegationToolPreviewMobileVisibilityRenderState({
  displayToolCallCount,
}: ChatRuntimeDelegationToolPreviewMobileVisibilityRenderStateInput): ChatRuntimeDelegationToolPreviewMobileVisibilityRenderState {
  const visibility = getToolExecutionMobileVisibilityRenderState({
    toolCallCount: displayToolCallCount,
  })

  return {
    shouldRender: visibility.toolPreview.shouldRender,
  }
}

export function getChatRuntimeToolExecutionResultOnlyFallbackRenderState(): ToolExecutionResultOnlyFallbackRenderState {
  return getToolExecutionResultOnlyFallbackRenderState()
}

export function getChatRuntimeToolExecutionResultOnlyFallbackLabel(): string {
  return getChatRuntimeToolExecutionResultOnlyFallbackRenderState().label
}

export function getChatRuntimeToolExecutionDetailMobileRowState({
  key,
  toolCall,
  label,
  result,
  isExpanded,
  colors,
  previewNumberOfLines,
  pendingResultRenderState,
}: ChatRuntimeToolExecutionDetailMobileRowInput): ChatRuntimeToolExecutionDetailMobileRowState {
  const toolName = label ?? toolCall.name
  const argumentsDetail = getToolExecutionDetailArgumentsState(toolCall.arguments)
  const argumentsPayload = argumentsDetail.payload
  const inputHeaderState = getToolExecutionDetailMobileSectionHeaderRenderState({
    kind: "input",
    payload: argumentsPayload,
  })
  const resultDetail = getToolExecutionDetailResultState(result)
  const resultContent = resultDetail.content
  const resultPayload = resultDetail.payload
  const resultState = resultDetail.state
  const outputHeaderState = getToolExecutionDetailMobileSectionHeaderRenderState({
    kind: "output",
    payload: resultPayload,
  })
  const errorHeaderState = getToolExecutionDetailMobileSectionHeaderRenderState({
    kind: "error",
  })
  const renderState = getToolExecutionDetailMobileHeaderRenderState({
    toolName,
    isExpanded,
    resultState,
    colors,
  })
  const inputCopyButtonRenderState = getToolExecutionDetailMobileCopyButtonRenderState({
    kind: "input",
    toolName,
    colors,
  })
  const outputCopyButtonRenderState = getToolExecutionDetailMobileCopyButtonRenderState({
    kind: "output",
    toolName,
    colors,
  })
  const errorCopyButtonRenderState = getToolExecutionDetailMobileCopyButtonRenderState({
    kind: "error",
    toolName,
    colors,
  })

  return {
    key,
    renderState,
    toolName,
    input: argumentsDetail.hasArguments ? {
      payloadRenderState: inputHeaderState,
      compactText: argumentsPayload?.compactText,
      content: argumentsDetail.content,
      isExpanded,
      previewNumberOfLines,
      copyButtonRenderState: inputCopyButtonRenderState,
    } : null,
    result: result ? {
      payloadRenderState: outputHeaderState,
      resultBadge: renderState.resultBadge,
      characterCountLabel: resultDetail.characterCountLabel,
      resultCompactText: resultPayload?.compactText,
      resultContent,
      isExpanded,
      previewNumberOfLines,
      copyButtonRenderState: outputCopyButtonRenderState,
      errorRenderState: errorHeaderState,
      error: resultDetail.error,
      errorCopyButtonRenderState,
    } : null,
    pendingResult: !result && resultDetail.isPending ? {
      renderState: pendingResultRenderState,
    } : null,
  }
}

export function getChatRuntimeToolExecutionStackMobileRenderState({
  displayToolCallCount,
  results,
  colors,
  emptyStateRenderState,
}: ChatRuntimeToolExecutionStackMobileRenderStateInput): ChatRuntimeToolExecutionStackMobileRenderState {
  const visibility = getToolExecutionMobileVisibilityRenderState({
    toolCallCount: displayToolCallCount,
  })
  const compactRenderState = getToolExecutionDetailMobileExpandControlRenderState()
  const topCollapseRenderState = getToolExecutionDetailMobileCollapseControlRenderState({
    placement: "top",
    toolCallCount: displayToolCallCount,
    colors,
  })
  const bottomCollapseRenderState = getToolExecutionDetailMobileCollapseControlRenderState({
    colors,
  })
  const executionSummary = getToolExecutionSummaryDisplayState(results)

  return {
    shouldRender: visibility.toolExecutionStack.shouldRender,
    compact: {
      renderState: compactRenderState,
    },
    expanded: {
      isPending: executionSummary.isPending,
      allSuccess: executionSummary.allSuccess,
      hasErrors: executionSummary.hasErrors,
      topCollapseRenderState,
      bottomCollapseRenderState,
      emptyState: {
        shouldRender: visibility.emptyState.shouldRender,
        renderState: emptyStateRenderState,
      },
    },
  }
}

export function formatChatRuntimeActivityContent(step?: ChatRuntimeActivityStepLike | null): string {
  if (step?.type === "tool_call") {
    return step.title?.trim() || CHAT_RUNTIME_PRESENTATION.activity.runningToolLabel
  }
  return step?.description?.trim() || CHAT_RUNTIME_PRESENTATION.activity.thinkingLabel
}

export function isChatRuntimeVerificationActivityStep(step?: ChatRuntimeActivityStepLike | null): boolean {
  return !!step?.title?.toLowerCase().includes("verifying")
}

export function shouldRenderChatRuntimeActivityStep(step?: ChatRuntimeActivityStepLike | null): boolean {
  return !isChatRuntimeVerificationActivityStep(step)
}

export function formatChatRuntimeVisibleUpdatesSummary(visibleCount: number): string {
  return `Showing latest ${visibleCount} updates`
}

export function formatChatRuntimeConversationHistorySummary(
  visibleCount: number,
  totalCount: number,
  options: { includeScrollHint?: boolean } = {},
): string {
  const summary = `Showing latest ${visibleCount} of ${totalCount} messages`
  return options.includeScrollHint
    ? `${summary}. ${CHAT_RUNTIME_PRESENTATION.messageHistory.scrollUpHint}`
    : summary
}

export function formatChatRuntimeLoadEarlierLabel(
  hiddenCount: number,
  pageSize: number,
  isLoading = false,
): string {
  if (isLoading) return CHAT_RUNTIME_PRESENTATION.messageHistory.loadingEarlierLabel
  return `Load ${Math.min(hiddenCount, pageSize)} earlier`
}

export function getChatRuntimeMessageHistoryBannerState({
  visibleCount = 0,
  totalCount = 0,
  hiddenCount,
  loadIncrement = getChatRuntimeMessageHistoryWindowMobileState().loadIncrement,
  isLoadingEarlier = false,
  includeScrollHint = false,
}: ChatRuntimeMessageHistoryBannerStateInput = {}): ChatRuntimeMessageHistoryBannerState {
  const safeVisibleCount = Math.max(0, visibleCount)
  const safeTotalCount = Math.max(0, totalCount)
  const safeHiddenCount = Math.max(0, hiddenCount ?? safeTotalCount - safeVisibleCount)
  const shouldRender = safeHiddenCount > 0

  return {
    shouldRender,
    visibleCount: safeVisibleCount,
    totalCount: safeTotalCount,
    hiddenCount: safeHiddenCount,
    summaryLabel: shouldRender
      ? formatChatRuntimeConversationHistorySummary(safeVisibleCount, safeTotalCount, { includeScrollHint })
      : "",
    loadEarlierLabel: shouldRender
      ? formatChatRuntimeLoadEarlierLabel(safeHiddenCount, loadIncrement, isLoadingEarlier)
      : "",
  }
}

export function formatChatRuntimeAssistantFeedbackContent(
  thinkingContent: string | null | undefined,
  hasToolActivity: boolean,
): string {
  if (thinkingContent?.trim()) return normalizeMarkdownThoughtContent(thinkingContent)
  return hasToolActivity ? CHAT_RUNTIME_PRESENTATION.activity.executingToolsLabel : ""
}

export function formatChatRuntimeBranchAccessibilityLabel(role: string, messageNumber: number): string {
  return `Branch conversation from ${role} message ${messageNumber}`
}

export function isChatRuntimeBranchableMessageRole(role?: string | null): role is "user" | "assistant" {
  return role === "user" || role === "assistant"
}

export function getChatRuntimeBranchActionState(
  input: ChatRuntimeBranchActionInput,
): ChatRuntimeBranchActionState {
  const messageIndex = typeof input.branchMessageIndex === "number"
    ? input.branchMessageIndex
    : typeof input.fallbackMessageIndex === "number"
      ? input.fallbackMessageIndex
      : null
  const branchableRole = isChatRuntimeBranchableMessageRole(input.role)
    ? input.role
    : null
  const hasPendingBranch = input.pendingMessageIndex !== null && input.pendingMessageIndex !== undefined
  const isPending = hasPendingBranch && input.pendingMessageIndex === messageIndex
  const accessibilityState = { disabled: hasPendingBranch }
  if (!input.conversationId || messageIndex === null || branchableRole === null) {
    return {
      canBranch: false,
      messageIndex: null,
      isPending: false,
      isDisabled: hasPendingBranch,
      accessibilityLabel: null,
      accessibilityState,
    }
  }

  return {
    canBranch: true,
    messageIndex,
    isPending,
    isDisabled: hasPendingBranch,
    accessibilityLabel: formatChatRuntimeBranchAccessibilityLabel(branchableRole, messageIndex + 1),
    accessibilityState,
  }
}

export function getChatRuntimeBranchActionAccessibilityLabel(
  input: Pick<ChatRuntimeBranchActionState, "accessibilityLabel">,
): string {
  return input.accessibilityLabel ?? CHAT_RUNTIME_PRESENTATION.branch.buttonAccessibilityLabel
}

export function getChatRuntimeBranchActionTitle(): string {
  return CHAT_RUNTIME_PRESENTATION.branch.buttonTitle
}

export function getChatRuntimeBranchMobileRenderState(
  input: ChatRuntimeBranchMobileRenderStateInput,
): ChatRuntimeBranchMobileRenderState {
  const action = getChatRuntimeBranchActionState(input)
  const icon = getChatRuntimeBranchMobileIconState({
    isPending: action.isPending,
  })
  const iconColors = getChatMessageActionMobileIconColors(icon, input.colors)

  return {
    canBranch: action.canBranch,
    messageIndex: action.messageIndex,
    isPending: action.isPending,
    isDisabled: action.isDisabled,
    accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
    accessibilityLabel: getChatRuntimeBranchActionAccessibilityLabel(action),
    accessibilityState: action.accessibilityState,
    icon: {
      isPending: icon.isPending,
      name: icon.name,
      size: icon.size,
      color: iconColors.color,
    },
  }
}

export function getChatRuntimeBranchMobileAlertState(): ChatRuntimeBranchMobileAlertState {
  return {
    unavailable: {
      title: CHAT_RUNTIME_PRESENTATION.branch.unavailableTitle,
      message: CHAT_RUNTIME_PRESENTATION.branch.unavailableMessage,
    },
    created: {
      title: CHAT_RUNTIME_PRESENTATION.branch.createdTitle,
      message: CHAT_RUNTIME_PRESENTATION.branch.createdMessage,
    },
    failed: {
      title: CHAT_RUNTIME_PRESENTATION.branch.failedTitle,
      fallbackMessage: CHAT_RUNTIME_PRESENTATION.branch.failedMessage,
    },
  }
}

export function getChatRuntimeBranchUnavailableMobileResolvedAlertState(
  alerts: ChatRuntimeBranchMobileAlertState = getChatRuntimeBranchMobileAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alerts.unavailable.title,
    message: alerts.unavailable.message,
  }
}

export function getChatRuntimeBranchCreatedMobileResolvedAlertState(
  alerts: ChatRuntimeBranchMobileAlertState = getChatRuntimeBranchMobileAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alerts.created.title,
    message: alerts.created.message,
  }
}

export function getChatRuntimeBranchFailedMobileResolvedAlertState(
  error: unknown,
  alerts: ChatRuntimeBranchMobileAlertState = getChatRuntimeBranchMobileAlertState(),
): ChatRuntimeResolvedAlertState {
  return {
    title: alerts.failed.title,
    message: getChatRuntimeAlertMessage(error, alerts.failed.fallbackMessage),
  }
}

export function getChatRuntimeBranchMobileIconState(
  input: ChatRuntimeBranchMobileIconStateInput = {},
): ChatRuntimeBranchMobileIconState {
  const isPending = input.isPending === true
  return {
    isPending,
    name: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.name,
    size: isPending
      ? CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.pendingSize
      : CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.size,
    colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.branchColorToken,
  }
}

export function getChatRuntimeAgentSelectorMobileIconState(): ChatRuntimeAgentSelectorMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.name,
    size: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.size,
    colorToken: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.colorToken,
  }
}

export function getChatRuntimeAgentSelectorMobileActionState(
  agentLabel: string,
): ChatRuntimeAgentSelectorMobileActionState {
  return {
    label: agentLabel,
    accessibilityRole: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.accessibilityRole,
    pressedOpacity: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.pressedOpacity,
    accessibilityLabel: formatChatRuntimeAgentSelectorAccessibilityLabel(agentLabel),
    accessibilityHint: getChatRuntimeAgentSelectorAccessibilityHint(),
    icon: getChatRuntimeAgentSelectorMobileIconState(),
  }
}

export function getChatRuntimeAgentSelectorMobileColors(
  colors: ChatRuntimeAgentSelectorMobileColorPalette,
): ChatRuntimeAgentSelectorMobileColors {
  const surface = CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile
  const icon = getChatRuntimeAgentSelectorMobileIconState()
  const textColor = colors[surface.agentSelectorText.colorToken]

  return {
    chip: {
      backgroundColor: hexToRgba(
        colors[surface.agentSelectorChip.backgroundColorToken],
        surface.agentSelectorChip.backgroundAlpha,
      ),
    },
    text: {
      color: textColor,
    },
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatRuntimeAgentSelectorMobileRenderState(
  input: ChatRuntimeAgentSelectorMobileRenderStateInput,
): ChatRuntimeAgentSelectorMobileRenderState {
  const action = getChatRuntimeAgentSelectorMobileActionState(input.agentLabel)
  const colors = getChatRuntimeAgentSelectorMobileColors(input.colors)

  return {
    label: action.label,
    accessibilityRole: action.accessibilityRole,
    pressedOpacity: action.pressedOpacity,
    accessibilityLabel: action.accessibilityLabel,
    accessibilityHint: action.accessibilityHint,
    chip: colors.chip,
    text: colors.text,
    icon: {
      name: action.icon.name,
      size: action.icon.size,
      color: colors.icon.color,
    },
  }
}

export function getChatRuntimeHeaderMobileSurfaceState() {
  return CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile
}

export function createChatRuntimeAgentSelectorMobileStyleSlots({
  surface,
  colors,
}: ChatRuntimeAgentSelectorMobileStyleSlotsInput): ChatRuntimeAgentSelectorMobileStyleSlots {
  return {
    button: {
      alignItems: surface.agentSelectorButton.alignItems,
      justifyContent: surface.agentSelectorButton.justifyContent,
      height: surface.agentSelectorButton.height,
      minHeight: surface.agentSelectorButton.minHeight,
    },
    chip: {
      flexDirection: surface.agentSelectorChip.flexDirection,
      alignItems: surface.agentSelectorChip.alignItems,
      backgroundColor: colors.chip.backgroundColor,
      maxWidth: surface.agentSelectorChip.maxWidth,
      paddingHorizontal: surface.agentSelectorChip.paddingHorizontal,
      paddingVertical: surface.agentSelectorChip.paddingVertical,
      borderRadius: surface.agentSelectorChip.borderRadius,
      gap: surface.agentSelectorChip.gap,
    },
    text: {
      fontSize: surface.agentSelectorText.fontSize,
      color: colors.text.color,
      fontWeight: surface.agentSelectorText.fontWeight,
    },
  }
}

export function createChatRuntimeHeaderActionsRowMobileStyleSlot({
  surface,
}: ChatRuntimeHeaderActionsRowMobileStyleSlotInput): ChatRuntimeHeaderActionsRowMobileStyleSlot {
  return {
    flexDirection: surface.flexDirection,
    alignItems: surface.alignItems,
    gap: surface.gap,
  }
}

export function createChatRuntimeHeaderIconContainerMobileStyleSlot<
  TAlignItems extends string,
  TJustifyContent extends string,
>({
  size,
  borderRadius,
  backgroundColor,
  alignItems,
  justifyContent,
}: ChatRuntimeHeaderIconContainerMobileStyleSlotInput<TAlignItems, TJustifyContent>): ChatRuntimeHeaderIconContainerMobileStyleSlot<
  TAlignItems,
  TJustifyContent
> {
  return {
    width: size,
    height: size,
    ...(borderRadius == null ? {} : { borderRadius }),
    ...(backgroundColor == null ? {} : { backgroundColor }),
    alignItems,
    justifyContent,
  }
}

export function createChatRuntimeHeaderPinButtonMobileStyleSlot({
  touchTarget,
  borderRadius,
  borderWidth,
  colors,
}: ChatRuntimeHeaderPinButtonMobileStyleSlotInput): ChatRuntimeHeaderPinButtonMobileStyleSlot {
  return {
    ...touchTarget,
    borderRadius,
    borderWidth,
    borderColor: colors.borderColor,
    backgroundColor: colors.backgroundColor,
  }
}

export function createChatRuntimeHeaderPinButtonMobileStyleSlots({
  surface,
  touchTarget,
  colors,
  radius,
}: ChatRuntimeHeaderPinButtonMobileStyleSlotsInput): ChatRuntimeHeaderPinButtonMobileStyleSlots {
  const borderRadius = radius[surface.pinButton.borderRadius]
  const borderWidth = surface.pinButton.borderWidth

  return {
    inactive: createChatRuntimeHeaderPinButtonMobileStyleSlot({
      touchTarget,
      borderRadius,
      borderWidth,
      colors: colors.inactive.button,
    }),
    active: createChatRuntimeHeaderPinButtonMobileStyleSlot({
      touchTarget,
      borderRadius,
      borderWidth,
      colors: colors.active.button,
    }),
  }
}

export function createChatRuntimeHeaderIconContainerMobileStyleSlots({
  surface,
  colors,
}: ChatRuntimeHeaderIconContainerMobileStyleSlotsInput): ChatRuntimeHeaderIconContainerMobileStyleSlots {
  return {
    killSwitch: createChatRuntimeHeaderIconContainerMobileStyleSlot({
      size: surface.killSwitchButton.size,
      borderRadius: surface.killSwitchButton.borderRadius,
      backgroundColor: colors.killSwitchButton.button.backgroundColor,
      alignItems: surface.killSwitchButton.alignItems,
      justifyContent: surface.killSwitchButton.justifyContent,
    }),
    handsFree: createChatRuntimeHeaderIconContainerMobileStyleSlot({
      size: surface.handsFreeButton.size,
      alignItems: surface.handsFreeButton.alignItems,
      justifyContent: surface.handsFreeButton.justifyContent,
    }),
  }
}

export function getChatRuntimeHeaderMobileStyleRenderState({
  colors,
}: ChatRuntimeHeaderMobileStyleRenderStateInput): ChatRuntimeHeaderMobileStyleRenderState {
  return {
    surface: getChatRuntimeHeaderMobileSurfaceState(),
    agentSelector: getChatRuntimeAgentSelectorMobileColors(colors),
    pinButton: {
      inactive: getChatRuntimePinMobileColors(false, colors),
      active: getChatRuntimePinMobileColors(true, colors),
    },
    killSwitchButton: getChatRuntimeKillSwitchMobileColors(colors),
  }
}

export function getChatRuntimeHeaderChromeMobileStyleRenderState({
  colors,
}: ChatRuntimeHeaderChromeMobileStyleRenderStateInput): ChatRuntimeHeaderChromeMobileStyleRenderState {
  return {
    header: getChatRuntimeHeaderMobileStyleRenderState({
      colors,
    }),
    sessionStatus: getSessionStatusMobileStyleRenderState({
      colors,
    }),
    turnDuration: {
      standard: getChatRuntimeTurnDurationHeaderMobileRenderState({
        durationMs: 1,
        colors,
      }),
      live: getChatRuntimeTurnDurationHeaderMobileRenderState({
        durationMs: 1,
        isLive: true,
        colors,
      }),
    },
  }
}

export function getChatRuntimeBackMobileIconState(): ChatRuntimeBackMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.name,
    size: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.size,
    colorToken: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.backIcon.colorToken,
  }
}

export function getChatRuntimeBackMobileActionState(): ChatRuntimeBackMobileActionState {
  return {
    accessibilityRole: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.accessibilityRole,
    pressedOpacity: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.pressedOpacity,
    accessibilityLabel: getChatRuntimeBackAccessibilityLabel(),
    accessibilityHint: getChatRuntimeBackAccessibilityHint(),
    icon: getChatRuntimeBackMobileIconState(),
  }
}

export function getChatRuntimeBackMobileColors(
  colors: ChatRuntimeBackMobileColorPalette,
): ChatRuntimeBackMobileColors {
  const icon = getChatRuntimeBackMobileIconState()

  return {
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatRuntimeBackMobileRenderState(
  input: ChatRuntimeBackMobileRenderStateInput,
): ChatRuntimeBackMobileRenderState {
  const action = getChatRuntimeBackMobileActionState()
  const colors = getChatRuntimeBackMobileColors(input.colors)

  return {
    accessibilityRole: action.accessibilityRole,
    pressedOpacity: action.pressedOpacity,
    accessibilityLabel: action.accessibilityLabel,
    accessibilityHint: action.accessibilityHint,
    icon: {
      name: action.icon.name,
      size: action.icon.size,
      color: colors.icon.color,
    },
  }
}

export function getChatRuntimePinDisplayLabel(isPinned: boolean): string {
  return isPinned
    ? CHAT_RUNTIME_PRESENTATION.pin.pinnedLabel
    : CHAT_RUNTIME_PRESENTATION.pin.pinLabel
}

export function getChatRuntimePinAccessibilityLabel(isPinned: boolean): string {
  return isPinned
    ? CHAT_RUNTIME_PRESENTATION.pin.unpinChatLabel
    : CHAT_RUNTIME_PRESENTATION.pin.pinChatLabel
}

export function getChatRuntimePinAccessibilityHint(isPinned: boolean): string {
  return isPinned
    ? CHAT_RUNTIME_PRESENTATION.pin.unpinChatHint
    : CHAT_RUNTIME_PRESENTATION.pin.pinChatHint
}

export function getChatRuntimePinMobileIconState(isPinned: boolean): ChatRuntimePinMobileIconState {
  return {
    isPinned,
    name: isPinned
      ? CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.pinnedName
      : CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.unpinnedName,
    size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
    colorToken: isPinned
      ? CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.activeIconColorToken
      : CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.inactiveIconColorToken,
  }
}

export function getChatRuntimePinMobileActionState(isPinned: boolean): ChatRuntimePinMobileActionState {
  return {
    isPinned,
    accessibilityRole: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.accessibilityRole,
    pressedOpacity: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.pressedOpacity,
    accessibilityLabel: getChatRuntimePinAccessibilityLabel(isPinned),
    accessibilityHint: getChatRuntimePinAccessibilityHint(isPinned),
    icon: getChatRuntimePinMobileIconState(isPinned),
  }
}

export function getChatRuntimePinMobileColors(
  isPinned: boolean,
  colors: ChatRuntimePinMobileColorPalette,
): ChatRuntimePinMobileColors {
  const surface = CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton
  const icon = getChatRuntimePinMobileIconState(isPinned)

  return {
    button: {
      borderColor: colors[isPinned ? surface.activeBorderColorToken : surface.borderColorToken],
      backgroundColor: isPinned
        ? hexToRgba(colors[surface.activeBackgroundColorToken], surface.activeBackgroundAlpha)
        : colors[surface.backgroundColorToken],
    },
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatRuntimePinMobileRenderState(
  input: ChatRuntimePinMobileRenderStateInput,
): ChatRuntimePinMobileRenderState {
  const isPinned = input.isPinned === true
  const action = getChatRuntimePinMobileActionState(isPinned)
  const colors = getChatRuntimePinMobileColors(isPinned, input.colors)

  return {
    isPinned,
    accessibilityRole: action.accessibilityRole,
    pressedOpacity: action.pressedOpacity,
    accessibilityLabel: action.accessibilityLabel,
    accessibilityHint: action.accessibilityHint,
    button: colors.button,
    icon: {
      name: action.icon.name,
      size: action.icon.size,
      color: colors.icon.color,
    },
  }
}

export function getChatRuntimeHandsFreeMobileIconState(isEnabled: boolean): ChatRuntimeHandsFreeMobileIconState {
  return {
    isEnabled,
    name: isEnabled
      ? CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.enabledName
      : CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.disabledName,
    size: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.size,
    colorToken: isEnabled
      ? CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.activeIconColorToken
      : CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.inactiveIconColorToken,
  }
}

export function getChatRuntimeHandsFreeMobileColors(
  isEnabled: boolean,
  colors: ChatRuntimeHandsFreeMobileColorPalette,
): ChatRuntimeHandsFreeMobileColors {
  const icon = getChatRuntimeHandsFreeMobileIconState(isEnabled)

  return {
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatRuntimeHandsFreeMobileActionState(
  input: ChatRuntimeHandsFreeMobileActionStateInput = {},
): ChatRuntimeHandsFreeMobileActionState {
  const isEnabled = input.isEnabled === true
  return {
    isEnabled,
    accessibilityRole: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.accessibilityRole,
    pressedOpacity: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.pressedOpacity,
    accessibilityLabel: getChatRuntimeHandsFreeAccessibilityLabel(),
    accessibilityHint: getChatRuntimeHandsFreeAccessibilityHint(),
    accessibilityState: { checked: isEnabled },
    ariaChecked: isEnabled,
    icon: getChatRuntimeHandsFreeMobileIconState(isEnabled),
  }
}

export function getChatRuntimeHandsFreeMobileRenderState(
  input: ChatRuntimeHandsFreeMobileRenderStateInput,
): ChatRuntimeHandsFreeMobileRenderState {
  const action = getChatRuntimeHandsFreeMobileActionState(input)
  const colors = getChatRuntimeHandsFreeMobileColors(action.isEnabled, input.colors)

  return {
    isEnabled: action.isEnabled,
    accessibilityRole: action.accessibilityRole,
    pressedOpacity: action.pressedOpacity,
    accessibilityLabel: action.accessibilityLabel,
    accessibilityHint: action.accessibilityHint,
    accessibilityState: action.accessibilityState,
    ariaChecked: action.ariaChecked,
    icon: {
      name: action.icon.name,
      size: action.icon.size,
      color: colors.icon.color,
    },
  }
}

export function getChatRuntimeKillSwitchMobileIconState(): ChatRuntimeKillSwitchMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.name,
    size: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.size,
    color: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.iconColor,
  }
}

export function getChatRuntimeKillSwitchMobileActionState(): ChatRuntimeKillSwitchMobileActionState {
  return {
    accessibilityRole: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.accessibilityRole,
    pressedOpacity: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.pressedOpacity,
    accessibilityLabel: getChatRuntimeKillSwitchAccessibilityLabel(),
    accessibilityHint: getChatRuntimeKillSwitchAccessibilityHint(),
    icon: getChatRuntimeKillSwitchMobileIconState(),
  }
}

export function getChatRuntimeKillSwitchMobileColors(
  colors: ChatRuntimeKillSwitchMobileColorPalette,
): ChatRuntimeKillSwitchMobileColors {
  const surface = CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton
  const icon = getChatRuntimeKillSwitchMobileIconState()

  return {
    button: {
      backgroundColor: colors[surface.backgroundColorToken],
    },
    icon: {
      color: icon.color,
    },
  }
}

export function getChatRuntimeKillSwitchMobileRenderState(
  input: ChatRuntimeKillSwitchMobileRenderStateInput,
): ChatRuntimeKillSwitchMobileRenderState {
  const action = getChatRuntimeKillSwitchMobileActionState()
  const colors = getChatRuntimeKillSwitchMobileColors(input.colors)

  return {
    accessibilityRole: action.accessibilityRole,
    pressedOpacity: action.pressedOpacity,
    accessibilityLabel: action.accessibilityLabel,
    accessibilityHint: action.accessibilityHint,
    button: colors.button,
    icon: {
      name: action.icon.name,
      size: action.icon.size,
      color: colors.icon.color,
    },
  }
}

export function getChatRuntimeKillSwitchMobileVisibilityRenderState({
  conversationState = null,
}: ChatRuntimeKillSwitchMobileVisibilityRenderStateInput = {}): ChatRuntimeKillSwitchMobileVisibilityRenderState {
  return {
    shouldRender: conversationState === "running",
  }
}

export function getChatRuntimeNavigationHeaderMobileRenderState({
  agentName,
  isPinned = false,
  handsFree = false,
  conversationState = null,
  isResponding = false,
  turnDurationMs = null,
  turnDurationIsLive = false,
  colors,
}: ChatRuntimeNavigationHeaderMobileRenderStateInput): ChatRuntimeNavigationHeaderMobileRenderState {
  const agentLabel = getChatRuntimeCurrentAgentLabel(agentName)
  const pinButtonRenderState = getChatRuntimePinMobileRenderState({ isPinned, colors })
  const headerConversationState = conversationState ?? (isResponding ? "running" : null)

  return {
    agentSelectorRenderState: getChatRuntimeAgentSelectorMobileRenderState({
      agentLabel,
      colors,
    }),
    agentSelectorLabelNumberOfLines:
      getChatRuntimeHeaderMobileSurfaceState().agentSelectorText.numberOfLines,
    backButtonRenderState: getChatRuntimeBackMobileRenderState({ colors }),
    pinButtonRenderState,
    pinButtonIsActive: pinButtonRenderState.isPinned,
    conversationStatusRenderState: getSessionStatusMobileRenderState({
      session: headerConversationState ? { conversationState: headerConversationState } : null,
      colors,
    }),
    turnDurationRenderState: getChatRuntimeTurnDurationHeaderMobileRenderState({
      durationMs: turnDurationMs,
      isLive: turnDurationIsLive,
      colors,
    }),
    killSwitchButtonShouldRender: getChatRuntimeKillSwitchMobileVisibilityRenderState({
      conversationState: headerConversationState,
    }).shouldRender,
    killSwitchButtonRenderState: getChatRuntimeKillSwitchMobileRenderState({ colors }),
    handsFreeButtonRenderState: getChatRuntimeHandsFreeMobileRenderState({
      isEnabled: handsFree,
      colors,
    }),
  }
}

export function createChatRuntimeNavigationHeaderOptionsParts<
  TInput extends {
    agentSelectorRenderState: unknown
    onAgentSelectorPress: unknown
    agentSelectorLabelNumberOfLines: number
    backButtonRenderState: unknown
    onBackButtonPress: unknown
    pinButtonRenderState: unknown
    onPinButtonPress: unknown
    pinButtonIsActive: unknown
    conversationStatusRenderState: unknown
    conversationStatusSpinnerSource: unknown
    turnDurationRenderState: unknown
    killSwitchButtonShouldRender: unknown
    killSwitchButtonRenderState: unknown
    onKillSwitchButtonPress: unknown
    handsFreeButtonRenderState: unknown
    onHandsFreeButtonPress: unknown
  },
>({
  agentSelectorRenderState,
  onAgentSelectorPress,
  agentSelectorLabelNumberOfLines,
  backButtonRenderState,
  onBackButtonPress,
  pinButtonRenderState,
  onPinButtonPress,
  pinButtonIsActive,
  conversationStatusRenderState,
  conversationStatusSpinnerSource,
  turnDurationRenderState,
  killSwitchButtonShouldRender,
  killSwitchButtonRenderState,
  onKillSwitchButtonPress,
  handsFreeButtonRenderState,
  onHandsFreeButtonPress,
}: TInput): {
  agentSelector: {
    renderState: TInput["agentSelectorRenderState"]
    onPress: TInput["onAgentSelectorPress"]
    labelNumberOfLines: number
  }
  backButton: {
    renderState: TInput["backButtonRenderState"]
    onPress: TInput["onBackButtonPress"]
  }
  pinButton: {
    renderState: TInput["pinButtonRenderState"]
    onPress: TInput["onPinButtonPress"]
    isActive: TInput["pinButtonIsActive"]
  }
  conversationStatus: {
    renderState: TInput["conversationStatusRenderState"]
    spinnerSource: TInput["conversationStatusSpinnerSource"]
  }
  turnDuration: {
    renderState: TInput["turnDurationRenderState"]
  }
  killSwitchButton: {
    shouldRender: TInput["killSwitchButtonShouldRender"]
    renderState: TInput["killSwitchButtonRenderState"]
    onPress: TInput["onKillSwitchButtonPress"]
  }
  handsFreeButton: {
    renderState: TInput["handsFreeButtonRenderState"]
    onPress: TInput["onHandsFreeButtonPress"]
  }
} {
  return {
    agentSelector: {
      renderState: agentSelectorRenderState,
      onPress: onAgentSelectorPress,
      labelNumberOfLines: agentSelectorLabelNumberOfLines,
    },
    backButton: {
      renderState: backButtonRenderState,
      onPress: onBackButtonPress,
    },
    pinButton: {
      renderState: pinButtonRenderState,
      onPress: onPinButtonPress,
      isActive: pinButtonIsActive,
    },
    conversationStatus: {
      renderState: conversationStatusRenderState,
      spinnerSource: conversationStatusSpinnerSource,
    },
    turnDuration: {
      renderState: turnDurationRenderState,
    },
    killSwitchButton: {
      shouldRender: killSwitchButtonShouldRender,
      renderState: killSwitchButtonRenderState,
      onPress: onKillSwitchButtonPress,
    },
    handsFreeButton: {
      renderState: handsFreeButtonRenderState,
      onPress: onHandsFreeButtonPress,
    },
  }
}

export function createChatRuntimeNavigationHeaderOptionsMobilePropsParts<
  TInput extends ChatRuntimeNavigationHeaderOptionsMobilePropsPartsInput,
>({
  agentSelector,
  backButton,
  pinButton,
  conversationStatus,
  turnDuration,
  killSwitchButton,
  handsFreeButton,
  styles,
}: TInput): ChatRuntimeNavigationHeaderOptionsMobilePropsParts<TInput> {
  return {
    actionsRow: {
      style: styles.actionsRowStyle,
    },
    agentSelector: {
      ...agentSelector,
      styles: styles.agentSelector,
    },
    backButton: {
      ...backButton,
      style: styles.iconButtons.edgeStyle,
    },
    pinButton: {
      ...pinButton,
      style: styles.iconButtons.pinStyle,
      activeStyle: styles.iconButtons.pinActiveStyle,
    },
    conversationStatus: {
      ...conversationStatus,
      styles: styles.conversationStatus,
    },
    turnDuration: {
      ...turnDuration,
      styles: styles.turnDuration,
    },
    killSwitchButton: {
      ...killSwitchButton,
      style: styles.iconButtons.actionStyle,
      iconContainerStyle: styles.iconButtons.killSwitchIconContainerStyle,
    },
    handsFreeButton: {
      ...handsFreeButton,
      style: styles.iconButtons.actionStyle,
      iconContainerStyle: styles.iconButtons.handsFreeIconContainerStyle,
    },
  }
}

export function getChatRuntimeRetryStatusMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus
}

export function getChatRuntimeRetryStatusMobileIconState(): ChatRuntimeRetryStatusMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon.name,
    size: CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon.size,
    colorToken: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleColorToken,
  }
}

export function getChatRuntimeRetryStatusMobileColors(
  colors: ChatRuntimeRetryStatusMobileColorPalette,
): ChatRuntimeRetryStatusMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus
  const icon = getChatRuntimeRetryStatusMobileIconState()

  return {
    icon: {
      color: colors[icon.colorToken],
    },
    spinner: {
      color: colors[surface.spinner.colorToken],
    },
    card: {
      borderColor: hexToRgba(colors[surface.borderColorToken], surface.borderAlpha),
      backgroundColor: hexToRgba(colors[surface.backgroundColorToken], surface.backgroundAlpha),
    },
    title: {
      color: colors[surface.titleColorToken],
    },
    attempt: {
      color: colors[surface.attemptColorToken],
    },
    countdown: {
      color: colors[surface.titleColorToken],
      backgroundColor: hexToRgba(colors[surface.backgroundColorToken], surface.countdownBackgroundAlpha),
    },
    description: {
      color: colors[surface.descriptionColorToken],
    },
  }
}

export function getChatRuntimeScrollToBottomMobileButtonState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom
}

export function getChatRuntimeScrollToBottomMobileIconState(): ChatRuntimeScrollToBottomMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.name,
    size: CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.size,
    colorToken: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.foregroundColorToken,
  }
}

export function getChatRuntimeScrollToBottomMobileColors(
  colors: ChatRuntimeScrollToBottomMobileColorPalette,
): ChatRuntimeScrollToBottomMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom
  const icon = getChatRuntimeScrollToBottomMobileIconState()

  return {
    button: {
      backgroundColor: colors[surface.backgroundColorToken],
    },
    icon: {
      color: colors[icon.colorToken],
    },
  }
}

export function getChatRuntimeScrollToBottomMobileRenderState({
  isVisible = true,
  colors,
}: ChatRuntimeScrollToBottomMobileRenderStateInput): ChatRuntimeScrollToBottomMobileRenderState {
  const surface = getChatRuntimeScrollToBottomMobileButtonState()
  const resolvedColors = getChatRuntimeScrollToBottomMobileColors(colors)
  const icon = getChatRuntimeScrollToBottomMobileIconState()

  return {
    shouldRender: isVisible,
    surface,
    colors: resolvedColors,
    button: {
      accessibilityRole: surface.accessibilityRole,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.scrollToBottom.accessibilityLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.scrollToBottom.accessibilityHint,
      icon: {
        name: icon.name,
        size: icon.size,
        color: resolvedColors.icon.color,
      },
      pressedOpacity: surface.pressedOpacity,
    },
  }
}

export function createChatRuntimeScrollToBottomMobileStyleSlots({
  renderState,
  spacing,
}: ChatRuntimeScrollToBottomMobileStyleSlotsInput): ChatRuntimeScrollToBottomMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    button: {
      position: surface.position,
      right: spacing[surface.right],
      width: surface.size,
      height: surface.size,
      borderRadius: surface.borderRadius,
      backgroundColor: colors.button.backgroundColor,
      alignItems: surface.alignItems,
      justifyContent: surface.justifyContent,
      shadowColor: surface.shadowColor,
      shadowOffset: surface.shadowOffset,
      shadowOpacity: surface.shadowOpacity,
      shadowRadius: surface.shadowRadius,
      elevation: surface.elevation,
    },
  }
}

export function getChatRuntimeMobileSafeAreaLayoutState(
  bottomInset: number,
): ChatRuntimeMobileSafeAreaLayoutState {
  return {
    chatScrollContent: {
      paddingBottom: bottomInset,
    },
    scrollToBottomButton: {
      bottom: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.bottomOffset + bottomInset,
    },
    voiceOverlay: {
      bottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.bottomOffset + bottomInset,
    },
    inputArea: {
      paddingBottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.bottomInsetOffset + bottomInset,
    },
  }
}

export function createChatRuntimeMobileSafeAreaStyleSlots(
  layout: ChatRuntimeMobileSafeAreaLayoutState,
): ChatRuntimeMobileSafeAreaStyleSlots {
  return {
    chatScrollContent: {
      paddingBottom: layout.chatScrollContent.paddingBottom,
    },
    scrollToBottomButton: {
      bottom: layout.scrollToBottomButton.bottom,
    },
    voiceOverlay: {
      bottom: layout.voiceOverlay.bottom,
    },
    inputArea: {
      paddingBottom: layout.inputArea.paddingBottom,
    },
  }
}

export function createChatRuntimeSafeAreaMergedStyleSlots<
  TScrollToBottomButtonStyle,
  TScrollViewportContentContainerStyle,
  TVoiceOverlayStyleSlots extends { overlay: unknown },
  TInputDockStyleSlots extends { area: unknown },
>({
  chatComposerStyles,
  conversationDockStyles,
  conversationViewportStyles,
  safeAreaStyles,
}: ChatRuntimeSafeAreaMergedStyleSlotsInput<
  TScrollToBottomButtonStyle,
  TScrollViewportContentContainerStyle,
  TVoiceOverlayStyleSlots,
  TInputDockStyleSlots
>): ChatRuntimeSafeAreaMergedStyleSlots<
  TScrollToBottomButtonStyle,
  TScrollViewportContentContainerStyle,
  TVoiceOverlayStyleSlots,
  TInputDockStyleSlots
> {
  return {
    scrollToBottomButtonStyle: [
      conversationDockStyles.scrollToBottomButtonStyle,
      safeAreaStyles.scrollToBottomButton,
    ],
    scrollViewportContentContainerStyle: [
      conversationViewportStyles.scrollViewport.contentContainerStyle,
      safeAreaStyles.chatScrollContent,
    ],
    voiceOverlay: {
      ...chatComposerStyles.voiceOverlay,
      overlay: [
        chatComposerStyles.voiceOverlay.overlay,
        safeAreaStyles.voiceOverlay,
      ],
    },
    inputDock: {
      ...chatComposerStyles.inputDock,
      area: [
        chatComposerStyles.inputDock.area,
        safeAreaStyles.inputArea,
      ],
    },
  }
}

export function createChatComposerRuntimeDockStyleSlots<
  TChatComposerStyles extends { inputDock: unknown },
  TSafeAreaStyles extends { inputDock: unknown },
>({
  chatComposerStyles,
  safeAreaStyles,
}: {
  chatComposerStyles: TChatComposerStyles
  safeAreaStyles: TSafeAreaStyles
}): Omit<TChatComposerStyles, "inputDock"> & {
  inputDock: TSafeAreaStyles["inputDock"]
} {
  return {
    ...chatComposerStyles,
    inputDock: safeAreaStyles.inputDock,
  }
}

export function createChatComposerStyleSlots<
  TSpeechPreviewStyles,
  TPendingImagesRailStyles,
  TVoiceOverlayStyles,
  THandsFreeControlsStyles,
  TAccessoryButtonStyles,
  TTextEntryStyles,
  TQueueActionStyles,
  TSubmitActionStyles,
  TMicButtonStyles,
  TInputDockStyles,
>({
  speechPreviewStyles,
  pendingImagesRailStyles,
  voiceOverlayStyles,
  handsFreeControlsStyles,
  accessoryButtonStyles,
  textEntryStyles,
  queueActionStyles,
  submitActionStyles,
  micButtonStyles,
  inputDockStyles,
}: {
  speechPreviewStyles: TSpeechPreviewStyles
  pendingImagesRailStyles: TPendingImagesRailStyles
  voiceOverlayStyles: TVoiceOverlayStyles
  handsFreeControlsStyles: THandsFreeControlsStyles
  accessoryButtonStyles: TAccessoryButtonStyles
  textEntryStyles: TTextEntryStyles
  queueActionStyles: TQueueActionStyles
  submitActionStyles: TSubmitActionStyles
  micButtonStyles: TMicButtonStyles
  inputDockStyles: TInputDockStyles
}): {
  speechPreview: TSpeechPreviewStyles
  pendingImagesRail: TPendingImagesRailStyles
  voiceOverlay: TVoiceOverlayStyles
  handsFreeControls: THandsFreeControlsStyles
  accessoryButton: TAccessoryButtonStyles
  textEntry: TTextEntryStyles
  queueAction: TQueueActionStyles
  submitAction: TSubmitActionStyles
  micButton: TMicButtonStyles
  inputDock: TInputDockStyles
} {
  return {
    speechPreview: speechPreviewStyles,
    pendingImagesRail: pendingImagesRailStyles,
    voiceOverlay: voiceOverlayStyles,
    handsFreeControls: handsFreeControlsStyles,
    accessoryButton: accessoryButtonStyles,
    textEntry: textEntryStyles,
    queueAction: queueActionStyles,
    submitAction: submitActionStyles,
    micButton: micButtonStyles,
    inputDock: inputDockStyles,
  }
}

type ChatComposerStyleSourceKey =
  | "sttPreviewBox"
  | "sttPreviewLabel"
  | "sttPreviewText"
  | "pendingImagesRow"
  | "pendingImageCard"
  | "pendingImagePreview"
  | "pendingImageRemoveButton"
  | "overlay"
  | "overlayCard"
  | "overlayText"
  | "overlayTranscript"
  | "handsFreeStatusRow"
  | "handsFreeControlsRow"
  | "handsFreeControlButton"
  | "handsFreeControlButtonText"
  | "ttsToggle"
  | "ttsToggleOn"
  | "input"
  | "visuallyHiddenComposerHint"
  | "queueButton"
  | "sendButtonDisabled"
  | "queueButtonText"
  | "sendButton"
  | "sendButtonText"
  | "mic"
  | "micOn"
  | "micLabel"
  | "micLabelOn"
  | "inputArea"
  | "inputRow"
  | "micWrapper"

type ChatComposerStyleSource = Record<ChatComposerStyleSourceKey, unknown>

type ChatComposerStyleSlotsFromStyleSource<
  TStyles extends ChatComposerStyleSource,
> = {
  speechPreview: {
    box: TStyles["sttPreviewBox"]
    label: TStyles["sttPreviewLabel"]
    text: TStyles["sttPreviewText"]
  }
  pendingImagesRail: {
    row: TStyles["pendingImagesRow"]
    card: TStyles["pendingImageCard"]
    preview: TStyles["pendingImagePreview"]
    removeButton: TStyles["pendingImageRemoveButton"]
  }
  voiceOverlay: {
    overlay: TStyles["overlay"]
    card: TStyles["overlayCard"]
    label: TStyles["overlayText"]
    transcript: TStyles["overlayTranscript"]
  }
  handsFreeControls: {
    statusRow: TStyles["handsFreeStatusRow"]
    controlsRow: TStyles["handsFreeControlsRow"]
    controlButton: TStyles["handsFreeControlButton"]
    controlButtonText: TStyles["handsFreeControlButtonText"]
  }
  accessoryButton: {
    style: TStyles["ttsToggle"]
    activeStyle: TStyles["ttsToggleOn"]
  }
  textEntry: {
    input: TStyles["input"]
    visuallyHiddenHint: TStyles["visuallyHiddenComposerHint"]
  }
  queueAction: {
    button: TStyles["queueButton"]
    disabledButton: TStyles["sendButtonDisabled"]
    text: TStyles["queueButtonText"]
  }
  submitAction: {
    button: TStyles["sendButton"]
    disabledButton: TStyles["sendButtonDisabled"]
    text: TStyles["sendButtonText"]
  }
  micButton: {
    button: TStyles["mic"]
    activeButton: TStyles["micOn"]
    label: TStyles["micLabel"]
    activeLabel: TStyles["micLabelOn"]
  }
  inputDock: {
    area: TStyles["inputArea"]
    row: TStyles["inputRow"]
    micWrapper: TStyles["micWrapper"]
  }
}

export function createChatComposerStyleSlotsFromStyleSource<
  TStyles extends ChatComposerStyleSource,
>({
  styles,
}: {
  styles: TStyles
}): ChatComposerStyleSlotsFromStyleSource<TStyles> {
  return createChatComposerStyleSlots({
    speechPreviewStyles: {
      box: styles.sttPreviewBox,
      label: styles.sttPreviewLabel,
      text: styles.sttPreviewText,
    },
    pendingImagesRailStyles: {
      row: styles.pendingImagesRow,
      card: styles.pendingImageCard,
      preview: styles.pendingImagePreview,
      removeButton: styles.pendingImageRemoveButton,
    },
    voiceOverlayStyles: {
      overlay: styles.overlay,
      card: styles.overlayCard,
      label: styles.overlayText,
      transcript: styles.overlayTranscript,
    },
    handsFreeControlsStyles: {
      statusRow: styles.handsFreeStatusRow,
      controlsRow: styles.handsFreeControlsRow,
      controlButton: styles.handsFreeControlButton,
      controlButtonText: styles.handsFreeControlButtonText,
    },
    accessoryButtonStyles: {
      style: styles.ttsToggle,
      activeStyle: styles.ttsToggleOn,
    },
    textEntryStyles: {
      input: styles.input,
      visuallyHiddenHint: styles.visuallyHiddenComposerHint,
    },
    queueActionStyles: {
      button: styles.queueButton,
      disabledButton: styles.sendButtonDisabled,
      text: styles.queueButtonText,
    },
    submitActionStyles: {
      button: styles.sendButton,
      disabledButton: styles.sendButtonDisabled,
      text: styles.sendButtonText,
    },
    micButtonStyles: {
      button: styles.mic,
      activeButton: styles.micOn,
      label: styles.micLabel,
      activeLabel: styles.micLabelOn,
    },
    inputDockStyles: {
      area: styles.inputArea,
      row: styles.inputRow,
      micWrapper: styles.micWrapper,
    },
  })
}

export function createChatConversationHomePromptEditorModalStyleSlots<
  TKeyboardAvoidingViewStyle,
  TOverlayStyle,
  TContentStyle,
  THeaderStyle,
  TTitleStyle,
  TCloseButtonStyle,
  TLabelStyle,
  TInputStyle,
  TInputMultilineStyle,
  TActionsStyle,
  TCancelButtonStyle,
  TCancelButtonTextStyle,
  TSaveButtonStyle,
  TSaveButtonDisabledStyle,
  TSaveButtonTextStyle,
>({
  keyboardAvoidingViewStyle,
  overlayStyle,
  contentStyle,
  headerStyle,
  titleStyle,
  closeButtonStyle,
  labelStyle,
  inputStyle,
  inputMultilineStyle,
  actionsStyle,
  cancelButtonStyle,
  cancelButtonTextStyle,
  saveButtonStyle,
  saveButtonDisabledStyle,
  saveButtonTextStyle,
}: {
  keyboardAvoidingViewStyle: TKeyboardAvoidingViewStyle
  overlayStyle: TOverlayStyle
  contentStyle: TContentStyle
  headerStyle: THeaderStyle
  titleStyle: TTitleStyle
  closeButtonStyle: TCloseButtonStyle
  labelStyle: TLabelStyle
  inputStyle: TInputStyle
  inputMultilineStyle: TInputMultilineStyle
  actionsStyle: TActionsStyle
  cancelButtonStyle: TCancelButtonStyle
  cancelButtonTextStyle: TCancelButtonTextStyle
  saveButtonStyle: TSaveButtonStyle
  saveButtonDisabledStyle: TSaveButtonDisabledStyle
  saveButtonTextStyle: TSaveButtonTextStyle
}): {
  keyboardAvoidingView: TKeyboardAvoidingViewStyle
  overlay: TOverlayStyle
  content: TContentStyle
  header: THeaderStyle
  title: TTitleStyle
  closeButton: TCloseButtonStyle
  label: TLabelStyle
  input: TInputStyle
  inputMultiline: TInputMultilineStyle
  actions: TActionsStyle
  cancelButton: TCancelButtonStyle
  cancelButtonText: TCancelButtonTextStyle
  saveButton: TSaveButtonStyle
  saveButtonDisabled: TSaveButtonDisabledStyle
  saveButtonText: TSaveButtonTextStyle
} {
  return {
    keyboardAvoidingView: keyboardAvoidingViewStyle,
    overlay: overlayStyle,
    content: contentStyle,
    header: headerStyle,
    title: titleStyle,
    closeButton: closeButtonStyle,
    label: labelStyle,
    input: inputStyle,
    inputMultiline: inputMultilineStyle,
    actions: actionsStyle,
    cancelButton: cancelButtonStyle,
    cancelButtonText: cancelButtonTextStyle,
    saveButton: saveButtonStyle,
    saveButtonDisabled: saveButtonDisabledStyle,
    saveButtonText: saveButtonTextStyle,
  }
}

type ChatConversationHomePromptEditorModalStyleSourceKey =
  | "modalKeyboardAvoidingView"
  | "modalOverlay"
  | "modalContent"
  | "modalHeader"
  | "modalTitle"
  | "modalCloseButton"
  | "modalLabel"
  | "modalInput"
  | "modalInputMultiline"
  | "modalActions"
  | "modalCancelButton"
  | "modalCancelButtonText"
  | "modalSaveButton"
  | "modalSaveButtonDisabled"
  | "modalSaveButtonText"

type ChatConversationHomePromptEditorModalStyleSource =
  Record<ChatConversationHomePromptEditorModalStyleSourceKey, unknown>

type ChatConversationHomePromptEditorModalStyleSlotsFromStyleSource<
  TStyles extends ChatConversationHomePromptEditorModalStyleSource,
> = {
  keyboardAvoidingView: TStyles["modalKeyboardAvoidingView"]
  overlay: TStyles["modalOverlay"]
  content: TStyles["modalContent"]
  header: TStyles["modalHeader"]
  title: TStyles["modalTitle"]
  closeButton: TStyles["modalCloseButton"]
  label: TStyles["modalLabel"]
  input: TStyles["modalInput"]
  inputMultiline: TStyles["modalInputMultiline"]
  actions: TStyles["modalActions"]
  cancelButton: TStyles["modalCancelButton"]
  cancelButtonText: TStyles["modalCancelButtonText"]
  saveButton: TStyles["modalSaveButton"]
  saveButtonDisabled: TStyles["modalSaveButtonDisabled"]
  saveButtonText: TStyles["modalSaveButtonText"]
}

export function createChatConversationHomePromptEditorModalStyleSlotsFromStyleSource<
  TStyles extends ChatConversationHomePromptEditorModalStyleSource,
>({
  styles,
}: {
  styles: TStyles
}): ChatConversationHomePromptEditorModalStyleSlotsFromStyleSource<TStyles> {
  return createChatConversationHomePromptEditorModalStyleSlots({
    keyboardAvoidingViewStyle: styles.modalKeyboardAvoidingView,
    overlayStyle: styles.modalOverlay,
    contentStyle: styles.modalContent,
    headerStyle: styles.modalHeader,
    titleStyle: styles.modalTitle,
    closeButtonStyle: styles.modalCloseButton,
    labelStyle: styles.modalLabel,
    inputStyle: styles.modalInput,
    inputMultilineStyle: styles.modalInputMultiline,
    actionsStyle: styles.modalActions,
    cancelButtonStyle: styles.modalCancelButton,
    cancelButtonTextStyle: styles.modalCancelButtonText,
    saveButtonStyle: styles.modalSaveButton,
    saveButtonDisabledStyle: styles.modalSaveButtonDisabled,
    saveButtonTextStyle: styles.modalSaveButtonText,
  })
}

export function createChatMessageConnectionBannerStyleSlots<
  TBannerStyle,
  TReconnectingStyle,
  TFailedStyle,
  TContentStyle,
  TIconStyle,
  TTextContainerStyle,
  TTitleStyle,
  TSubtitleStyle,
  TRetryButtonStyle,
  TRetryButtonTextStyle,
>({
  bannerStyle,
  reconnectingStyle,
  failedStyle,
  contentStyle,
  iconStyle,
  textContainerStyle,
  titleStyle,
  subtitleStyle,
  retryButtonStyle,
  retryButtonTextStyle,
}: {
  bannerStyle: TBannerStyle
  reconnectingStyle: TReconnectingStyle
  failedStyle: TFailedStyle
  contentStyle: TContentStyle
  iconStyle: TIconStyle
  textContainerStyle: TTextContainerStyle
  titleStyle: TTitleStyle
  subtitleStyle: TSubtitleStyle
  retryButtonStyle: TRetryButtonStyle
  retryButtonTextStyle: TRetryButtonTextStyle
}): {
  banner: TBannerStyle
  reconnecting: TReconnectingStyle
  failed: TFailedStyle
  content: TContentStyle
  icon: TIconStyle
  textContainer: TTextContainerStyle
  title: TTitleStyle
  subtitle: TSubtitleStyle
  retryButton: TRetryButtonStyle
  retryButtonText: TRetryButtonTextStyle
} {
  return {
    banner: bannerStyle,
    reconnecting: reconnectingStyle,
    failed: failedStyle,
    content: contentStyle,
    icon: iconStyle,
    textContainer: textContainerStyle,
    title: titleStyle,
    subtitle: subtitleStyle,
    retryButton: retryButtonStyle,
    retryButtonText: retryButtonTextStyle,
  }
}

export function createChatMessageConversationDockStyleSlots<
  TScrollToBottomButtonStyle,
  TQueuePanelStyle,
  TConnectionBannerStyles,
>({
  scrollToBottomButtonStyle,
  queuePanelStyle,
  connectionBannerStyles,
}: {
  scrollToBottomButtonStyle: TScrollToBottomButtonStyle
  queuePanelStyle: TQueuePanelStyle
  connectionBannerStyles: TConnectionBannerStyles
}): {
  scrollToBottomButtonStyle: TScrollToBottomButtonStyle
  queuePanelStyle: TQueuePanelStyle
  connectionBanner: TConnectionBannerStyles
} {
  return {
    scrollToBottomButtonStyle,
    queuePanelStyle,
    connectionBanner: connectionBannerStyles,
  }
}

type ChatMessageConversationDockStyleSourceKey =
  | "scrollToBottomButton"
  | "messageQueuePanelWrapper"
  | "connectionBanner"
  | "connectionBannerReconnecting"
  | "connectionBannerFailed"
  | "connectionBannerContent"
  | "connectionBannerIcon"
  | "connectionBannerTextContainer"
  | "connectionBannerText"
  | "connectionBannerSubtext"
  | "retryButton"
  | "retryButtonText"

type ChatMessageConversationDockStyleSource =
  Record<ChatMessageConversationDockStyleSourceKey, unknown>

type ChatMessageConnectionBannerStyleSlotsFromStyleSource<
  TStyles extends ChatMessageConversationDockStyleSource,
> = {
  banner: TStyles["connectionBanner"]
  reconnecting: TStyles["connectionBannerReconnecting"]
  failed: TStyles["connectionBannerFailed"]
  content: TStyles["connectionBannerContent"]
  icon: TStyles["connectionBannerIcon"]
  textContainer: TStyles["connectionBannerTextContainer"]
  title: TStyles["connectionBannerText"]
  subtitle: TStyles["connectionBannerSubtext"]
  retryButton: TStyles["retryButton"]
  retryButtonText: TStyles["retryButtonText"]
}

type ChatMessageConversationDockStyleSlotsFromStyleSource<
  TStyles extends ChatMessageConversationDockStyleSource,
> = {
  scrollToBottomButtonStyle: TStyles["scrollToBottomButton"]
  queuePanelStyle: TStyles["messageQueuePanelWrapper"]
  connectionBanner: ChatMessageConnectionBannerStyleSlotsFromStyleSource<TStyles>
}

export function createChatMessageConversationDockStyleSlotsFromStyleSource<
  TStyles extends ChatMessageConversationDockStyleSource,
>({
  styles,
}: {
  styles: TStyles
}): ChatMessageConversationDockStyleSlotsFromStyleSource<TStyles> {
  return createChatMessageConversationDockStyleSlots({
    scrollToBottomButtonStyle: styles.scrollToBottomButton,
    queuePanelStyle: styles.messageQueuePanelWrapper,
    connectionBannerStyles: createChatMessageConnectionBannerStyleSlots({
      bannerStyle: styles.connectionBanner,
      reconnectingStyle: styles.connectionBannerReconnecting,
      failedStyle: styles.connectionBannerFailed,
      contentStyle: styles.connectionBannerContent,
      iconStyle: styles.connectionBannerIcon,
      textContainerStyle: styles.connectionBannerTextContainer,
      titleStyle: styles.connectionBannerText,
      subtitleStyle: styles.connectionBannerSubtext,
      retryButtonStyle: styles.retryButton,
      retryButtonTextStyle: styles.retryButtonText,
    }),
  })
}

export function createChatMessageRuntimeDockStyleSlots<
  TConversationDockStyles extends {
    queuePanelStyle: unknown
    connectionBanner: unknown
  },
  TComposerStyles,
  TSafeAreaStyles extends {
    scrollToBottomButtonStyle: unknown
    voiceOverlay: unknown
  },
>({
  conversationDockStyles,
  composerStyles,
  safeAreaStyles,
}: {
  conversationDockStyles: TConversationDockStyles
  composerStyles: TComposerStyles
  safeAreaStyles: TSafeAreaStyles
}): {
  scrollToBottomButtonStyle: TSafeAreaStyles["scrollToBottomButtonStyle"]
  voiceOverlay: TSafeAreaStyles["voiceOverlay"]
  queuePanelStyle: TConversationDockStyles["queuePanelStyle"]
  connectionBanner: TConversationDockStyles["connectionBanner"]
  composer: TComposerStyles
} {
  return {
    scrollToBottomButtonStyle: safeAreaStyles.scrollToBottomButtonStyle,
    voiceOverlay: safeAreaStyles.voiceOverlay,
    queuePanelStyle: conversationDockStyles.queuePanelStyle,
    connectionBanner: conversationDockStyles.connectionBanner,
    composer: composerStyles,
  }
}

export function createChatMessageConversationViewportStyleSlots<
  TFrameStyles,
  TScrollViewportStyles,
  TLoadingStateStyles,
  THomeQuickStartStyles,
  THistoryBannerStyles,
  TStepSummaryStyles,
  TDebugPanelStyles,
>({
  frameStyles,
  scrollViewportStyles,
  loadingStateStyles,
  homeQuickStartStyles,
  historyBannerStyles,
  stepSummaryStyles,
  debugPanelStyles,
}: {
  frameStyles: TFrameStyles
  scrollViewportStyles: TScrollViewportStyles
  loadingStateStyles: TLoadingStateStyles
  homeQuickStartStyles: THomeQuickStartStyles
  historyBannerStyles: THistoryBannerStyles
  stepSummaryStyles: TStepSummaryStyles
  debugPanelStyles: TDebugPanelStyles
}): {
  frame: TFrameStyles
  scrollViewport: TScrollViewportStyles
  loadingState: TLoadingStateStyles
  homeQuickStarts: THomeQuickStartStyles
  historyBanner: THistoryBannerStyles
  stepSummary: TStepSummaryStyles
  debugPanels: TDebugPanelStyles
} {
  return {
    frame: frameStyles,
    scrollViewport: scrollViewportStyles,
    loadingState: loadingStateStyles,
    homeQuickStarts: homeQuickStartStyles,
    historyBanner: historyBannerStyles,
    stepSummary: stepSummaryStyles,
    debugPanels: debugPanelStyles,
  }
}

type ChatMessageConversationViewportStyleSourceKey =
  | "keyboardAvoidingContainer"
  | "chatRoot"
  | "chatScroll"
  | "chatScrollContent"
  | "loadingState"
  | "loadingSpinner"
  | "chatHomeCard"
  | "chatHomeEmptyText"
  | "chatHomeShortcutGrid"
  | "chatHomeShortcutCard"
  | "chatHomeShortcutCardAdd"
  | "chatHomeShortcutCardDisabled"
  | "chatHomeShortcutCardPressed"
  | "chatHomeShortcutSourcePill"
  | "chatHomeShortcutSourceLabel"
  | "chatHomeShortcutAddIcon"
  | "chatHomeShortcutTitle"
  | "chatHomeShortcutTitleAdd"
  | "chatHomeShortcutDescription"
  | "chatHomeShortcutActions"
  | "chatHomeShortcutActionButton"
  | "chatHomeShortcutActionButtonPressed"
  | "chatHomeShortcutActionText"
  | "chatHomeShortcutActionDangerText"
  | "loadOlderContainer"
  | "loadOlderText"
  | "loadOlderButton"
  | "loadOlderButtonPressed"
  | "loadOlderButtonText"
  | "stepSummaryCard"
  | "stepSummaryHeader"
  | "stepSummaryTitle"
  | "stepSummaryBadge"
  | "stepSummaryBadgeText"
  | "stepSummaryAction"
  | "stepSummaryMeta"
  | "stepSummaryPreview"
  | "debugInfo"
  | "debugText"

type ChatMessageConversationViewportStyleSource =
  Record<ChatMessageConversationViewportStyleSourceKey, unknown>

type ChatMessageConversationViewportStyleSlotsFromStyleSource<
  TStyles extends ChatMessageConversationViewportStyleSource,
> = {
  frame: {
    keyboardAvoidingStyle: TStyles["keyboardAvoidingContainer"]
    rootStyle: TStyles["chatRoot"]
  }
  scrollViewport: {
    style: TStyles["chatScroll"]
    contentContainerStyle: TStyles["chatScrollContent"]
  }
  loadingState: {
    style: TStyles["loadingState"]
    spinnerStyle: TStyles["loadingSpinner"]
  }
  homeQuickStarts: {
    card: TStyles["chatHomeCard"]
    emptyText: TStyles["chatHomeEmptyText"]
    grid: TStyles["chatHomeShortcutGrid"]
    shortcutCard: TStyles["chatHomeShortcutCard"]
    shortcutCardAdd: TStyles["chatHomeShortcutCardAdd"]
    shortcutCardDisabled: TStyles["chatHomeShortcutCardDisabled"]
    shortcutCardPressed: TStyles["chatHomeShortcutCardPressed"]
    sourcePill: TStyles["chatHomeShortcutSourcePill"]
    sourceLabel: TStyles["chatHomeShortcutSourceLabel"]
    addIcon: TStyles["chatHomeShortcutAddIcon"]
    title: TStyles["chatHomeShortcutTitle"]
    titleAdd: TStyles["chatHomeShortcutTitleAdd"]
    description: TStyles["chatHomeShortcutDescription"]
    actions: TStyles["chatHomeShortcutActions"]
    actionButton: TStyles["chatHomeShortcutActionButton"]
    actionButtonPressed: TStyles["chatHomeShortcutActionButtonPressed"]
    actionText: TStyles["chatHomeShortcutActionText"]
    actionDangerText: TStyles["chatHomeShortcutActionDangerText"]
  }
  historyBanner: {
    container: TStyles["loadOlderContainer"]
    summary: TStyles["loadOlderText"]
    loadButton: TStyles["loadOlderButton"]
    loadButtonPressed: TStyles["loadOlderButtonPressed"]
    loadButtonText: TStyles["loadOlderButtonText"]
  }
  stepSummary: {
    card: TStyles["stepSummaryCard"]
    header: TStyles["stepSummaryHeader"]
    title: TStyles["stepSummaryTitle"]
    badge: TStyles["stepSummaryBadge"]
    badgeText: TStyles["stepSummaryBadgeText"]
    action: TStyles["stepSummaryAction"]
    meta: TStyles["stepSummaryMeta"]
    preview: TStyles["stepSummaryPreview"]
  }
  debugPanels: {
    panelStyle: TStyles["debugInfo"]
    textStyle: TStyles["debugText"]
  }
}

export function createChatMessageConversationViewportStyleSlotsFromStyleSource<
  TStyles extends ChatMessageConversationViewportStyleSource,
>({
  styles,
}: {
  styles: TStyles
}): ChatMessageConversationViewportStyleSlotsFromStyleSource<TStyles> {
  return createChatMessageConversationViewportStyleSlots({
    frameStyles: {
      keyboardAvoidingStyle: styles.keyboardAvoidingContainer,
      rootStyle: styles.chatRoot,
    },
    scrollViewportStyles: {
      style: styles.chatScroll,
      contentContainerStyle: styles.chatScrollContent,
    },
    loadingStateStyles: {
      style: styles.loadingState,
      spinnerStyle: styles.loadingSpinner,
    },
    homeQuickStartStyles: {
      card: styles.chatHomeCard,
      emptyText: styles.chatHomeEmptyText,
      grid: styles.chatHomeShortcutGrid,
      shortcutCard: styles.chatHomeShortcutCard,
      shortcutCardAdd: styles.chatHomeShortcutCardAdd,
      shortcutCardDisabled: styles.chatHomeShortcutCardDisabled,
      shortcutCardPressed: styles.chatHomeShortcutCardPressed,
      sourcePill: styles.chatHomeShortcutSourcePill,
      sourceLabel: styles.chatHomeShortcutSourceLabel,
      addIcon: styles.chatHomeShortcutAddIcon,
      title: styles.chatHomeShortcutTitle,
      titleAdd: styles.chatHomeShortcutTitleAdd,
      description: styles.chatHomeShortcutDescription,
      actions: styles.chatHomeShortcutActions,
      actionButton: styles.chatHomeShortcutActionButton,
      actionButtonPressed: styles.chatHomeShortcutActionButtonPressed,
      actionText: styles.chatHomeShortcutActionText,
      actionDangerText: styles.chatHomeShortcutActionDangerText,
    },
    historyBannerStyles: {
      container: styles.loadOlderContainer,
      summary: styles.loadOlderText,
      loadButton: styles.loadOlderButton,
      loadButtonPressed: styles.loadOlderButtonPressed,
      loadButtonText: styles.loadOlderButtonText,
    },
    stepSummaryStyles: {
      card: styles.stepSummaryCard,
      header: styles.stepSummaryHeader,
      title: styles.stepSummaryTitle,
      badge: styles.stepSummaryBadge,
      badgeText: styles.stepSummaryBadgeText,
      action: styles.stepSummaryAction,
      meta: styles.stepSummaryMeta,
      preview: styles.stepSummaryPreview,
    },
    debugPanelStyles: {
      panelStyle: styles.debugInfo,
      textStyle: styles.debugText,
    },
  })
}

export function createChatMessageRuntimeViewportStyleSlots<
  TConversationViewportStyles extends {
    scrollViewport: {
      style: unknown
    }
    loadingState: unknown
    homeQuickStarts: unknown
    historyBanner: unknown
    stepSummary: unknown
    debugPanels: unknown
  },
  TSafeAreaStyles extends {
    scrollViewportContentContainerStyle: unknown
  },
>({
  conversationViewportStyles,
  safeAreaStyles,
}: {
  conversationViewportStyles: TConversationViewportStyles
  safeAreaStyles: TSafeAreaStyles
}): {
  scrollViewport: {
    style: TConversationViewportStyles["scrollViewport"]["style"]
    contentContainerStyle: TSafeAreaStyles["scrollViewportContentContainerStyle"]
  }
  loadingState: TConversationViewportStyles["loadingState"]
  homeQuickStarts: TConversationViewportStyles["homeQuickStarts"]
  historyBanner: TConversationViewportStyles["historyBanner"]
  stepSummary: TConversationViewportStyles["stepSummary"]
  debugPanels: TConversationViewportStyles["debugPanels"]
} {
  return {
    scrollViewport: {
      style: conversationViewportStyles.scrollViewport.style,
      contentContainerStyle: safeAreaStyles.scrollViewportContentContainerStyle,
    },
    loadingState: conversationViewportStyles.loadingState,
    homeQuickStarts: conversationViewportStyles.homeQuickStarts,
    historyBanner: conversationViewportStyles.historyBanner,
    stepSummary: conversationViewportStyles.stepSummary,
    debugPanels: conversationViewportStyles.debugPanels,
  }
}

export function createChatMessageRuntimeSurfaceStyleSlots<
  TConversationViewportStyles extends { frame: unknown },
  TDockStyles,
  TViewportStyles,
>({
  conversationViewportStyles,
  dockStyles,
  viewportStyles,
}: {
  conversationViewportStyles: TConversationViewportStyles
  dockStyles: TDockStyles
  viewportStyles: TViewportStyles
}): {
  frame: TConversationViewportStyles["frame"]
  dock: TDockStyles
  viewport: TViewportStyles
} {
  return {
    frame: conversationViewportStyles.frame,
    dock: dockStyles,
    viewport: viewportStyles,
  }
}

export function createChatMessageRuntimeThreadStyleSlots<TThreadSurfaceStyles, TThreadBodyStyles>({
  threadSurfaceStyles,
  threadBodyStyles,
}: {
  threadSurfaceStyles: TThreadSurfaceStyles
  threadBodyStyles: TThreadBodyStyles
}): {
  surface: TThreadSurfaceStyles
  body: TThreadBodyStyles
} {
  return {
    surface: threadSurfaceStyles,
    body: threadBodyStyles,
  }
}

type ChatMessageThreadBodyStyleKey =
  | "retryStatusCard"
  | "retryStatusHeader"
  | "retryStatusTitle"
  | "retryStatusMetaRow"
  | "retryStatusAttempt"
  | "retryStatusCountdown"
  | "retryStatusDescription"
  | "delegationCard"
  | "delegationHeader"
  | "delegationTitle"
  | "delegationStatusBadge"
  | "delegationStatusText"
  | "delegationLiveText"
  | "delegationSubtitle"
  | "delegationMetaRow"
  | "delegationMetaText"
  | "delegationConversationPreview"
  | "delegationConversationPreviewLine"
  | "delegationConversationPreviewRole"
  | "delegationConversationPreviewContent"
  | "delegationConversationPreviewTimestamp"
  | "delegationConversationPreviewMoreButton"
  | "delegationConversationPreviewMoreButtonPressed"
  | "delegationConversationPreviewMore"
  | "delegationToolPreview"
  | "delegationToolPreviewLabel"
  | "delegationToolPreviewLine"
  | "delegationToolPreviewStatusIcon"
  | "delegationToolPreviewName"
  | "toolCallCompactNamePending"
  | "toolCallCompactNameSuccess"
  | "toolCallCompactNameError"
  | "delegationToolPreviewMoreButton"
  | "delegationToolPreviewMoreButtonPressed"
  | "delegationToolPreviewMore"
  | "toolApprovalCard"
  | "toolApprovalHeader"
  | "toolApprovalContent"
  | "toolApprovalContentDisabled"
  | "toolApprovalTitle"
  | "toolApprovalToolRow"
  | "toolApprovalToolLabel"
  | "toolApprovalTool"
  | "toolApprovalArgumentsPreview"
  | "toolApprovalArgumentsToggle"
  | "toolApprovalArgumentsTogglePressed"
  | "toolApprovalArgumentsToggleText"
  | "toolApprovalArgumentsScroll"
  | "toolApprovalArgumentsFull"
  | "toolApprovalActions"
  | "toolApprovalButton"
  | "toolApprovalButtonDisabled"
  | "toolApprovalApproveButton"
  | "toolApprovalApproveButtonText"
  | "toolApprovalDenyButton"
  | "toolApprovalDenyButtonText"
  | "inlineActivityIndicator"
  | "inlineActivitySpinner"
  | "messageContentRow"
  | "messageContentBody"
  | "streamingContentHeader"
  | "streamingContentTitle"
  | "streamingContentSpinner"
  | "streamingContentBadge"
  | "streamingContentBadgeText"
  | "streamingContentBodyRow"
  | "streamingContentText"
  | "streamingContentCaret"
  | "collapsedMessagePreviewToggle"
  | "collapsedMessagePreviewTogglePressed"
  | "collapsedMessagePreview"
  | "toolCallCompactContainer"
  | "toolCallCompactPressed"
  | "toolCallCompactLine"
  | "toolCallCompactLeadingIcon"
  | "toolCallCompactName"
  | "toolCallCompactStatusIndicator"
  | "toolCallCompactToggleIcon"
  | "toolExecutionExpandedContainer"
  | "toolExecutionCard"
  | "toolExecutionPending"
  | "toolExecutionSuccess"
  | "toolExecutionError"
  | "toolExecutionCollapseTopButton"
  | "toolExecutionCollapseBottomButton"
  | "toolResponsePendingText"
  | "toolCallSection"
  | "toolCallHeader"
  | "toolCallHeaderPressed"
  | "toolName"
  | "toolCallExpandHint"
  | "toolCallExpandHintText"
  | "toolParamsSection"
  | "toolDetailHeaderRow"
  | "toolPayloadMetaRow"
  | "toolSectionLabel"
  | "toolPayloadType"
  | "toolDetailCopyButton"
  | "toolDetailCopyButtonPressed"
  | "toolDetailCopyButtonText"
  | "toolPayloadPreview"
  | "toolParamsScroll"
  | "toolParamsScrollExpanded"
  | "toolParamsCode"
  | "toolResultItem"
  | "toolResultHeader"
  | "toolResultHeaderMeta"
  | "toolResultBadge"
  | "toolResultBadgeSuccess"
  | "toolResultBadgeError"
  | "toolResultBadgeText"
  | "toolResultBadgeTextSuccess"
  | "toolResultBadgeTextError"
  | "toolResultCharCount"
  | "toolResultScroll"
  | "toolResultScrollExpanded"
  | "toolResultCode"
  | "toolResultErrorSection"
  | "toolResultErrorLabel"
  | "toolResultErrorText"
  | "toolResponsePendingRow"
  | "messageActionsRow"

type ChatMessageThreadBodyStyleSource = Record<ChatMessageThreadBodyStyleKey, unknown>

type ChatMessageThreadBodyStyleSlots<TStyles extends ChatMessageThreadBodyStyleSource> = {
  retryStatus: {
    card: TStyles["retryStatusCard"]
    header: TStyles["retryStatusHeader"]
    title: TStyles["retryStatusTitle"]
    metaRow: TStyles["retryStatusMetaRow"]
    attempt: TStyles["retryStatusAttempt"]
    countdown: TStyles["retryStatusCountdown"]
    description: TStyles["retryStatusDescription"]
  }
  delegationCard: {
    card: TStyles["delegationCard"]
    header: TStyles["delegationHeader"]
    title: TStyles["delegationTitle"]
    statusBadge: TStyles["delegationStatusBadge"]
    statusText: TStyles["delegationStatusText"]
    liveText: TStyles["delegationLiveText"]
    subtitle: TStyles["delegationSubtitle"]
    metaRow: TStyles["delegationMetaRow"]
    metaText: TStyles["delegationMetaText"]
    conversationPreview: TStyles["delegationConversationPreview"]
    conversationPreviewLine: TStyles["delegationConversationPreviewLine"]
    conversationPreviewRole: TStyles["delegationConversationPreviewRole"]
    conversationPreviewContent: TStyles["delegationConversationPreviewContent"]
    conversationPreviewTimestamp: TStyles["delegationConversationPreviewTimestamp"]
    conversationPreviewMoreButton: TStyles["delegationConversationPreviewMoreButton"]
    conversationPreviewMoreButtonPressed: TStyles["delegationConversationPreviewMoreButtonPressed"]
    conversationPreviewMore: TStyles["delegationConversationPreviewMore"]
    toolPreview: TStyles["delegationToolPreview"]
    toolPreviewLabel: TStyles["delegationToolPreviewLabel"]
    toolPreviewLine: TStyles["delegationToolPreviewLine"]
    toolPreviewStatusIcon: TStyles["delegationToolPreviewStatusIcon"]
    toolPreviewName: TStyles["delegationToolPreviewName"]
    toolPreviewNamePending: TStyles["toolCallCompactNamePending"]
    toolPreviewNameSuccess: TStyles["toolCallCompactNameSuccess"]
    toolPreviewNameError: TStyles["toolCallCompactNameError"]
    toolPreviewMoreButton: TStyles["delegationToolPreviewMoreButton"]
    toolPreviewMoreButtonPressed: TStyles["delegationToolPreviewMoreButtonPressed"]
    toolPreviewMore: TStyles["delegationToolPreviewMore"]
  }
  toolApproval: {
    card: TStyles["toolApprovalCard"]
    header: TStyles["toolApprovalHeader"]
    content: TStyles["toolApprovalContent"]
    contentDisabled: TStyles["toolApprovalContentDisabled"]
    title: TStyles["toolApprovalTitle"]
    toolRow: TStyles["toolApprovalToolRow"]
    toolLabel: TStyles["toolApprovalToolLabel"]
    toolName: TStyles["toolApprovalTool"]
    argumentsPreview: TStyles["toolApprovalArgumentsPreview"]
    argumentsToggle: TStyles["toolApprovalArgumentsToggle"]
    argumentsTogglePressed: TStyles["toolApprovalArgumentsTogglePressed"]
    argumentsToggleText: TStyles["toolApprovalArgumentsToggleText"]
    argumentsScroll: TStyles["toolApprovalArgumentsScroll"]
    argumentsFull: TStyles["toolApprovalArgumentsFull"]
    actions: TStyles["toolApprovalActions"]
    button: TStyles["toolApprovalButton"]
    buttonDisabled: TStyles["toolApprovalButtonDisabled"]
    approveButton: TStyles["toolApprovalApproveButton"]
    approveButtonText: TStyles["toolApprovalApproveButtonText"]
    denyButton: TStyles["toolApprovalDenyButton"]
    denyButtonText: TStyles["toolApprovalDenyButtonText"]
  }
  inlineActivity: {
    style: TStyles["inlineActivityIndicator"]
    spinnerStyle: TStyles["inlineActivitySpinner"]
  }
  content: {
    rowStyle: TStyles["messageContentRow"]
    expandedBodyStyle: TStyles["messageContentBody"]
    streamingStyles: {
      header: TStyles["streamingContentHeader"]
      title: TStyles["streamingContentTitle"]
      spinner: TStyles["streamingContentSpinner"]
      badge: TStyles["streamingContentBadge"]
      badgeText: TStyles["streamingContentBadgeText"]
      bodyRow: TStyles["streamingContentBodyRow"]
      text: TStyles["streamingContentText"]
      caret: TStyles["streamingContentCaret"]
    }
    collapsedStyle: TStyles["collapsedMessagePreviewToggle"]
    collapsedPressedStyle: TStyles["collapsedMessagePreviewTogglePressed"]
    collapsedTextStyle: TStyles["collapsedMessagePreview"]
  }
  toolExecutionStack: {
    compactGroup: {
      container: TStyles["toolCallCompactContainer"]
      pressed: TStyles["toolCallCompactPressed"]
    }
    compactRow: {
      line: TStyles["toolCallCompactLine"]
      leadingIcon: TStyles["toolCallCompactLeadingIcon"]
      name: TStyles["toolCallCompactName"]
      namePending: TStyles["toolCallCompactNamePending"]
      nameSuccess: TStyles["toolCallCompactNameSuccess"]
      nameError: TStyles["toolCallCompactNameError"]
      statusIndicator: TStyles["toolCallCompactStatusIndicator"]
      toggleIcon: TStyles["toolCallCompactToggleIcon"]
    }
    expandedGroup: {
      container: TStyles["toolExecutionExpandedContainer"]
      card: TStyles["toolExecutionCard"]
      pending: TStyles["toolExecutionPending"]
      success: TStyles["toolExecutionSuccess"]
      error: TStyles["toolExecutionError"]
      collapseButton: TStyles["toolCallCompactContainer"]
      collapsePressed: TStyles["toolCallCompactPressed"]
      collapseTopPlacement: TStyles["toolExecutionCollapseTopButton"]
      collapseBottomPlacement: TStyles["toolExecutionCollapseBottomButton"]
      collapseText: TStyles["toolCallCompactName"]
    }
    emptyStateText: TStyles["toolResponsePendingText"]
    callDetail: {
      callSection: {
        section: TStyles["toolCallSection"]
        header: {
          header: TStyles["toolCallHeader"]
          headerPressed: TStyles["toolCallHeaderPressed"]
          toolName: TStyles["toolName"]
          expandHint: TStyles["toolCallExpandHint"]
          expandHintText: TStyles["toolCallExpandHintText"]
        }
      }
      payloadSection: {
        section: TStyles["toolParamsSection"]
        headerRow: TStyles["toolDetailHeaderRow"]
        payloadMeta: {
          row: TStyles["toolPayloadMetaRow"]
          label: TStyles["toolSectionLabel"]
          payloadType: TStyles["toolPayloadType"]
        }
        copyButton: {
          button: TStyles["toolDetailCopyButton"]
          pressed: TStyles["toolDetailCopyButtonPressed"]
          text: TStyles["toolDetailCopyButtonText"]
        }
        payloadBlock: {
          preview: TStyles["toolPayloadPreview"]
          scroll: TStyles["toolParamsScroll"]
          scrollExpanded: TStyles["toolParamsScrollExpanded"]
          code: TStyles["toolParamsCode"]
        }
      }
      resultSection: {
        item: TStyles["toolResultItem"]
        header: {
          header: TStyles["toolResultHeader"]
          meta: TStyles["toolResultHeaderMeta"]
          payloadMeta: {
            label: TStyles["toolSectionLabel"]
            payloadType: TStyles["toolPayloadType"]
          }
          badge: {
            badge: TStyles["toolResultBadge"]
            badgeSuccess: TStyles["toolResultBadgeSuccess"]
            badgeError: TStyles["toolResultBadgeError"]
            text: TStyles["toolResultBadgeText"]
            textSuccess: TStyles["toolResultBadgeTextSuccess"]
            textError: TStyles["toolResultBadgeTextError"]
          }
          characterCount: TStyles["toolResultCharCount"]
          copyButton: {
            button: TStyles["toolDetailCopyButton"]
            pressed: TStyles["toolDetailCopyButtonPressed"]
            text: TStyles["toolDetailCopyButtonText"]
          }
        }
        payloadBlock: {
          preview: TStyles["toolPayloadPreview"]
          scroll: TStyles["toolResultScroll"]
          scrollExpanded: TStyles["toolResultScrollExpanded"]
          code: TStyles["toolResultCode"]
        }
        errorBlock: {
          section: TStyles["toolResultErrorSection"]
          headerRow: TStyles["toolDetailHeaderRow"]
          label: TStyles["toolResultErrorLabel"]
          text: TStyles["toolResultErrorText"]
          copyButton: {
            button: TStyles["toolDetailCopyButton"]
            pressed: TStyles["toolDetailCopyButtonPressed"]
            text: TStyles["toolDetailCopyButtonText"]
          }
        }
      }
      pendingResult: {
        row: TStyles["toolResponsePendingRow"]
        text: TStyles["toolResponsePendingText"]
      }
    }
  }
  standaloneActions: {
    rowStyle: TStyles["messageActionsRow"]
  }
}

export function createChatMessageThreadBodyStyleSlots<
  TStyles extends ChatMessageThreadBodyStyleSource,
  TThreadBodyStyleSlots = ChatMessageThreadBodyStyleSlots<TStyles>,
>(
  styles: TStyles,
): TThreadBodyStyleSlots {
  return {
    retryStatus: {
      card: styles.retryStatusCard,
      header: styles.retryStatusHeader,
      title: styles.retryStatusTitle,
      metaRow: styles.retryStatusMetaRow,
      attempt: styles.retryStatusAttempt,
      countdown: styles.retryStatusCountdown,
      description: styles.retryStatusDescription,
    },
    delegationCard: {
      card: styles.delegationCard,
      header: styles.delegationHeader,
      title: styles.delegationTitle,
      statusBadge: styles.delegationStatusBadge,
      statusText: styles.delegationStatusText,
      liveText: styles.delegationLiveText,
      subtitle: styles.delegationSubtitle,
      metaRow: styles.delegationMetaRow,
      metaText: styles.delegationMetaText,
      conversationPreview: styles.delegationConversationPreview,
      conversationPreviewLine: styles.delegationConversationPreviewLine,
      conversationPreviewRole: styles.delegationConversationPreviewRole,
      conversationPreviewContent: styles.delegationConversationPreviewContent,
      conversationPreviewTimestamp: styles.delegationConversationPreviewTimestamp,
      conversationPreviewMoreButton: styles.delegationConversationPreviewMoreButton,
      conversationPreviewMoreButtonPressed: styles.delegationConversationPreviewMoreButtonPressed,
      conversationPreviewMore: styles.delegationConversationPreviewMore,
      toolPreview: styles.delegationToolPreview,
      toolPreviewLabel: styles.delegationToolPreviewLabel,
      toolPreviewLine: styles.delegationToolPreviewLine,
      toolPreviewStatusIcon: styles.delegationToolPreviewStatusIcon,
      toolPreviewName: styles.delegationToolPreviewName,
      toolPreviewNamePending: styles.toolCallCompactNamePending,
      toolPreviewNameSuccess: styles.toolCallCompactNameSuccess,
      toolPreviewNameError: styles.toolCallCompactNameError,
      toolPreviewMoreButton: styles.delegationToolPreviewMoreButton,
      toolPreviewMoreButtonPressed: styles.delegationToolPreviewMoreButtonPressed,
      toolPreviewMore: styles.delegationToolPreviewMore,
    },
    toolApproval: {
      card: styles.toolApprovalCard,
      header: styles.toolApprovalHeader,
      content: styles.toolApprovalContent,
      contentDisabled: styles.toolApprovalContentDisabled,
      title: styles.toolApprovalTitle,
      toolRow: styles.toolApprovalToolRow,
      toolLabel: styles.toolApprovalToolLabel,
      toolName: styles.toolApprovalTool,
      argumentsPreview: styles.toolApprovalArgumentsPreview,
      argumentsToggle: styles.toolApprovalArgumentsToggle,
      argumentsTogglePressed: styles.toolApprovalArgumentsTogglePressed,
      argumentsToggleText: styles.toolApprovalArgumentsToggleText,
      argumentsScroll: styles.toolApprovalArgumentsScroll,
      argumentsFull: styles.toolApprovalArgumentsFull,
      actions: styles.toolApprovalActions,
      button: styles.toolApprovalButton,
      buttonDisabled: styles.toolApprovalButtonDisabled,
      approveButton: styles.toolApprovalApproveButton,
      approveButtonText: styles.toolApprovalApproveButtonText,
      denyButton: styles.toolApprovalDenyButton,
      denyButtonText: styles.toolApprovalDenyButtonText,
    },
    inlineActivity: {
      style: styles.inlineActivityIndicator,
      spinnerStyle: styles.inlineActivitySpinner,
    },
    content: {
      rowStyle: styles.messageContentRow,
      expandedBodyStyle: styles.messageContentBody,
      streamingStyles: {
        header: styles.streamingContentHeader,
        title: styles.streamingContentTitle,
        spinner: styles.streamingContentSpinner,
        badge: styles.streamingContentBadge,
        badgeText: styles.streamingContentBadgeText,
        bodyRow: styles.streamingContentBodyRow,
        text: styles.streamingContentText,
        caret: styles.streamingContentCaret,
      },
      collapsedStyle: styles.collapsedMessagePreviewToggle,
      collapsedPressedStyle: styles.collapsedMessagePreviewTogglePressed,
      collapsedTextStyle: styles.collapsedMessagePreview,
    },
    toolExecutionStack: {
      compactGroup: {
        container: styles.toolCallCompactContainer,
        pressed: styles.toolCallCompactPressed,
      },
      compactRow: {
        line: styles.toolCallCompactLine,
        leadingIcon: styles.toolCallCompactLeadingIcon,
        name: styles.toolCallCompactName,
        namePending: styles.toolCallCompactNamePending,
        nameSuccess: styles.toolCallCompactNameSuccess,
        nameError: styles.toolCallCompactNameError,
        statusIndicator: styles.toolCallCompactStatusIndicator,
        toggleIcon: styles.toolCallCompactToggleIcon,
      },
      expandedGroup: {
        container: styles.toolExecutionExpandedContainer,
        card: styles.toolExecutionCard,
        pending: styles.toolExecutionPending,
        success: styles.toolExecutionSuccess,
        error: styles.toolExecutionError,
        collapseButton: styles.toolCallCompactContainer,
        collapsePressed: styles.toolCallCompactPressed,
        collapseTopPlacement: styles.toolExecutionCollapseTopButton,
        collapseBottomPlacement: styles.toolExecutionCollapseBottomButton,
        collapseText: styles.toolCallCompactName,
      },
      emptyStateText: styles.toolResponsePendingText,
      callDetail: {
        callSection: {
          section: styles.toolCallSection,
          header: {
            header: styles.toolCallHeader,
            headerPressed: styles.toolCallHeaderPressed,
            toolName: styles.toolName,
            expandHint: styles.toolCallExpandHint,
            expandHintText: styles.toolCallExpandHintText,
          },
        },
        payloadSection: {
          section: styles.toolParamsSection,
          headerRow: styles.toolDetailHeaderRow,
          payloadMeta: {
            row: styles.toolPayloadMetaRow,
            label: styles.toolSectionLabel,
            payloadType: styles.toolPayloadType,
          },
          copyButton: {
            button: styles.toolDetailCopyButton,
            pressed: styles.toolDetailCopyButtonPressed,
            text: styles.toolDetailCopyButtonText,
          },
          payloadBlock: {
            preview: styles.toolPayloadPreview,
            scroll: styles.toolParamsScroll,
            scrollExpanded: styles.toolParamsScrollExpanded,
            code: styles.toolParamsCode,
          },
        },
        resultSection: {
          item: styles.toolResultItem,
          header: {
            header: styles.toolResultHeader,
            meta: styles.toolResultHeaderMeta,
            payloadMeta: {
              label: styles.toolSectionLabel,
              payloadType: styles.toolPayloadType,
            },
            badge: {
              badge: styles.toolResultBadge,
              badgeSuccess: styles.toolResultBadgeSuccess,
              badgeError: styles.toolResultBadgeError,
              text: styles.toolResultBadgeText,
              textSuccess: styles.toolResultBadgeTextSuccess,
              textError: styles.toolResultBadgeTextError,
            },
            characterCount: styles.toolResultCharCount,
            copyButton: {
              button: styles.toolDetailCopyButton,
              pressed: styles.toolDetailCopyButtonPressed,
              text: styles.toolDetailCopyButtonText,
            },
          },
          payloadBlock: {
            preview: styles.toolPayloadPreview,
            scroll: styles.toolResultScroll,
            scrollExpanded: styles.toolResultScrollExpanded,
            code: styles.toolResultCode,
          },
          errorBlock: {
            section: styles.toolResultErrorSection,
            headerRow: styles.toolDetailHeaderRow,
            label: styles.toolResultErrorLabel,
            text: styles.toolResultErrorText,
            copyButton: {
              button: styles.toolDetailCopyButton,
              pressed: styles.toolDetailCopyButtonPressed,
              text: styles.toolDetailCopyButtonText,
            },
          },
        },
        pendingResult: {
          row: styles.toolResponsePendingRow,
          text: styles.toolResponsePendingText,
        },
      },
    },
    standaloneActions: {
      rowStyle: styles.messageActionsRow,
    },
  } as unknown as TThreadBodyStyleSlots
}

export function createChatMessageToolActivityGroupBoundaryStyles<
  TToggleContainerStyle,
  TTogglePressedStyle,
  TToggleHeaderRowStyle,
  TToggleCountBadgeStyle,
  TToggleCountBadgeTextStyle,
  TTogglePreviewLineStyle,
  TFooterButtonStyle,
  TFooterPressedStyle,
  TFooterTextStyle,
>({
  toggleContainerStyle,
  togglePressedStyle,
  toggleHeaderRowStyle,
  toggleCountBadgeStyle,
  toggleCountBadgeTextStyle,
  togglePreviewLineStyle,
  footerButtonStyle,
  footerPressedStyle,
  footerTextStyle,
}: {
  toggleContainerStyle: TToggleContainerStyle
  togglePressedStyle: TTogglePressedStyle
  toggleHeaderRowStyle: TToggleHeaderRowStyle
  toggleCountBadgeStyle: TToggleCountBadgeStyle
  toggleCountBadgeTextStyle: TToggleCountBadgeTextStyle
  togglePreviewLineStyle: TTogglePreviewLineStyle
  footerButtonStyle: TFooterButtonStyle
  footerPressedStyle: TFooterPressedStyle
  footerTextStyle: TFooterTextStyle
}): {
  toggle: {
    container: TToggleContainerStyle
    pressed: TTogglePressedStyle
    headerRow: TToggleHeaderRowStyle
    countBadge: TToggleCountBadgeStyle
    countBadgeText: TToggleCountBadgeTextStyle
    previewLine: TTogglePreviewLineStyle
  }
  footer: {
    button: TFooterButtonStyle
    pressed: TFooterPressedStyle
    text: TFooterTextStyle
  }
} {
  return {
    toggle: {
      container: toggleContainerStyle,
      pressed: togglePressedStyle,
      headerRow: toggleHeaderRowStyle,
      countBadge: toggleCountBadgeStyle,
      countBadgeText: toggleCountBadgeTextStyle,
      previewLine: togglePreviewLineStyle,
    },
    footer: {
      button: footerButtonStyle,
      pressed: footerPressedStyle,
      text: footerTextStyle,
    },
  }
}

export function createChatMessageToolActivityGroupThreadSurfaceStyleSlots<
  TSurfaceStyle,
  TBoundaryStyles,
  TToneStyleSlot,
  TToneStyle,
>({
  surfaceStyle,
  boundaryStyles,
  getToneStyle,
}: {
  surfaceStyle: TSurfaceStyle
  boundaryStyles: TBoundaryStyles
  getToneStyle: (toneStyleSlot: TToneStyleSlot) => TToneStyle
}): {
  surfaceStyle: TSurfaceStyle
  boundary: TBoundaryStyles
  getToneStyle: (toneStyleSlot: TToneStyleSlot) => TToneStyle
} {
  return {
    surfaceStyle,
    boundary: boundaryStyles,
    getToneStyle,
  }
}

export function createChatMessageConversationThreadStyleSlots<
  TThreadSurfaceStyles,
  TThreadBodyStyles,
  TActionStyles,
>({
  threadSurfaceStyles,
  threadBodyStyles,
  actionStyles,
}: {
  threadSurfaceStyles: TThreadSurfaceStyles
  threadBodyStyles: TThreadBodyStyles
  actionStyles: TActionStyles
}): {
  runtimeThread: {
    surface: TThreadSurfaceStyles
    body: TThreadBodyStyles
  }
  actionSet: TActionStyles
} {
  return {
    runtimeThread: createChatMessageRuntimeThreadStyleSlots({
      threadSurfaceStyles,
      threadBodyStyles,
    }),
    actionSet: actionStyles,
  }
}

type ChatMessageConversationThreadStyleSourceKey =
  | ChatMessageThreadBodyStyleKey
  | "msg"
  | "toolActivityGroupCollapsed"
  | "toolActivityGroupPressed"
  | "toolActivityGroupHeaderRow"
  | "toolActivityGroupCountBadge"
  | "toolActivityGroupCountBadgeText"
  | "toolActivityGroupPreviewLine"
  | "toolActivityGroupFooterButton"
  | "toolActivityGroupFooterText"
  | "messageTurnDurationBadge"
  | "messageTurnDurationBadgeLive"
  | "messageTurnDurationText"
  | "messageTurnDurationTextLive"
  | "speakButton"
  | "speakButtonActive"
  | "speakButtonPressed"
  | "messageBranchButton"
  | "messageBranchButtonPressed"
  | "messageBranchButtonDisabled"
  | "messageCopyButton"
  | "messageCopyButtonCopied"
  | "messageCopyButtonPressed"
  | "messageExpandButton"
  | "messageExpandButtonPressed"

type ChatMessageConversationThreadStyleSource =
  ChatMessageThreadBodyStyleSource
  & Record<ChatMessageConversationThreadStyleSourceKey, unknown>

export function createChatMessageConversationThreadStyleSlotsFromStyleSource<
  TStyles extends ChatMessageConversationThreadStyleSource,
  TToneStyleSlot,
  TToneStyle,
  TThreadBodyStyleSlots = ChatMessageThreadBodyStyleSlots<TStyles>,
>({
  styles,
  getToneStyle,
}: {
  styles: TStyles
  getToneStyle: (toneStyleSlot: TToneStyleSlot) => TToneStyle
}) {
  return createChatMessageConversationThreadStyleSlots({
    threadSurfaceStyles: createChatMessageToolActivityGroupThreadSurfaceStyleSlots({
      surfaceStyle: styles.msg,
      boundaryStyles: createChatMessageToolActivityGroupBoundaryStyles({
        toggleContainerStyle: styles.toolActivityGroupCollapsed,
        togglePressedStyle: styles.toolActivityGroupPressed,
        toggleHeaderRowStyle: styles.toolActivityGroupHeaderRow,
        toggleCountBadgeStyle: styles.toolActivityGroupCountBadge,
        toggleCountBadgeTextStyle: styles.toolActivityGroupCountBadgeText,
        togglePreviewLineStyle: styles.toolActivityGroupPreviewLine,
        footerButtonStyle: styles.toolActivityGroupFooterButton,
        footerPressedStyle: styles.toolActivityGroupPressed,
        footerTextStyle: styles.toolActivityGroupFooterText,
      }),
      getToneStyle,
    }),
    threadBodyStyles: createChatMessageThreadBodyStyleSlots<
      TStyles,
      TThreadBodyStyleSlots
    >(styles),
    actionStyles: createChatMessageActionStyleSlots({
      turnDurationStyles: {
        style: styles.messageTurnDurationBadge,
        liveStyle: styles.messageTurnDurationBadgeLive,
        textStyle: styles.messageTurnDurationText,
        liveTextStyle: styles.messageTurnDurationTextLive,
      },
      speechStyles: {
        style: styles.speakButton,
        activeStyle: styles.speakButtonActive,
        pressedStyle: styles.speakButtonPressed,
      },
      branchStyles: {
        style: styles.messageBranchButton,
        pressedStyle: styles.messageBranchButtonPressed,
        disabledStyle: styles.messageBranchButtonDisabled,
      },
      copyStyles: {
        style: styles.messageCopyButton,
        activeStyle: styles.messageCopyButtonCopied,
        pressedStyle: styles.messageCopyButtonPressed,
      },
      expansionStyles: {
        style: styles.messageExpandButton,
        pressedStyle: styles.messageExpandButtonPressed,
      },
    }),
  })
}

export function createChatMessageRuntimeChromeStyleSlots<
  TConversationThreadStyles extends {
    actionSet: unknown
    runtimeThread: unknown
  },
  TPromptEditorStyles,
>({
  conversationThreadStyles,
  promptEditorStyles,
}: {
  conversationThreadStyles: TConversationThreadStyles
  promptEditorStyles: TPromptEditorStyles
}): {
  actionStyles: TConversationThreadStyles["actionSet"]
  threadStyles: TConversationThreadStyles["runtimeThread"]
  promptEditorStyles: TPromptEditorStyles
} {
  return {
    actionStyles: conversationThreadStyles.actionSet,
    threadStyles: conversationThreadStyles.runtimeThread,
    promptEditorStyles,
  }
}

export function createChatMessageActionStyleSlots<
  TTurnDurationStyles,
  TSpeechStyles,
  TBranchStyles,
  TCopyStyles,
  TExpansionStyles,
>({
  turnDurationStyles,
  speechStyles,
  branchStyles,
  copyStyles,
  expansionStyles,
}: {
  turnDurationStyles: TTurnDurationStyles
  speechStyles: TSpeechStyles
  branchStyles: TBranchStyles
  copyStyles: TCopyStyles
  expansionStyles: TExpansionStyles
}): {
  turnDuration: TTurnDurationStyles
  speech: TSpeechStyles & {
    hitSlop: ReturnType<typeof getChatMessageActionMobileButtonStatesBySlot>["speech"]["hitSlop"]
  }
  branch: TBranchStyles & {
    hitSlop: ReturnType<typeof getChatMessageActionMobileButtonStatesBySlot>["branch"]["hitSlop"]
  }
  copy: TCopyStyles & {
    hitSlop: ReturnType<typeof getChatMessageActionMobileButtonStatesBySlot>["copy"]["hitSlop"]
  }
  expansion: TExpansionStyles & {
    hitSlop: ReturnType<typeof getChatMessageActionMobileButtonStatesBySlot>["expansion"]["hitSlop"]
  }
} {
  const actionButtons = getChatMessageActionMobileButtonStatesBySlot()

  return {
    turnDuration: turnDurationStyles,
    speech: {
      hitSlop: actionButtons.speech.hitSlop,
      ...speechStyles,
    },
    branch: {
      hitSlop: actionButtons.branch.hitSlop,
      ...branchStyles,
    },
    copy: {
      hitSlop: actionButtons.copy.hitSlop,
      ...copyStyles,
    },
    expansion: {
      hitSlop: actionButtons.expansion.hitSlop,
      ...expansionStyles,
    },
  }
}

export function createChatRuntimeHeaderStyleSlots<
  TActionsRowStyle,
  TAgentSelectorStyles,
  TConversationStatusStyles,
  TTurnDurationStyles,
  TIconButtonStyles,
>({
  actionsRowStyle,
  agentSelectorStyles,
  conversationStatusStyles,
  turnDurationStyles,
  iconButtonStyles,
}: {
  actionsRowStyle: TActionsRowStyle
  agentSelectorStyles: TAgentSelectorStyles
  conversationStatusStyles: TConversationStatusStyles
  turnDurationStyles: TTurnDurationStyles
  iconButtonStyles: TIconButtonStyles
}): {
  actionsRowStyle: TActionsRowStyle
  agentSelector: TAgentSelectorStyles
  conversationStatus: TConversationStatusStyles
  turnDuration: TTurnDurationStyles
  iconButtons: TIconButtonStyles
} {
  return {
    actionsRowStyle,
    agentSelector: agentSelectorStyles,
    conversationStatus: conversationStatusStyles,
    turnDuration: turnDurationStyles,
    iconButtons: iconButtonStyles,
  }
}

type ChatRuntimeHeaderStyleSourceKey =
  | "headerActionsRow"
  | "headerAgentSelectorButton"
  | "headerAgentSelectorChip"
  | "headerAgentSelectorText"
  | "headerConversationChip"
  | "headerConversationChipText"
  | "headerConversationSpinner"
  | "headerDurationChip"
  | "headerDurationChipLive"
  | "headerDurationChipText"
  | "headerDurationChipTextLive"
  | "headerEdgeActionButton"
  | "headerPinButton"
  | "headerPinButtonActive"
  | "headerActionButton"
  | "headerKillSwitchIconContainer"
  | "headerHandsFreeIconContainer"

type ChatRuntimeHeaderStyleSource = Record<ChatRuntimeHeaderStyleSourceKey, unknown>

type ChatRuntimeHeaderStyleSlotsFromStyleSource<
  TStyles extends ChatRuntimeHeaderStyleSource,
> = {
  actionsRowStyle: TStyles["headerActionsRow"]
  agentSelector: {
    button: TStyles["headerAgentSelectorButton"]
    chip: TStyles["headerAgentSelectorChip"]
    label: TStyles["headerAgentSelectorText"]
  }
  conversationStatus: {
    chip: TStyles["headerConversationChip"]
    text: TStyles["headerConversationChipText"]
    spinner: TStyles["headerConversationSpinner"]
  }
  turnDuration: {
    chip: TStyles["headerDurationChip"]
    liveChip: TStyles["headerDurationChipLive"]
    text: TStyles["headerDurationChipText"]
    liveText: TStyles["headerDurationChipTextLive"]
  }
  iconButtons: {
    edgeStyle: TStyles["headerEdgeActionButton"]
    pinStyle: TStyles["headerPinButton"]
    pinActiveStyle: TStyles["headerPinButtonActive"]
    actionStyle: TStyles["headerActionButton"]
    killSwitchIconContainerStyle: TStyles["headerKillSwitchIconContainer"]
    handsFreeIconContainerStyle: TStyles["headerHandsFreeIconContainer"]
  }
}

export function createChatRuntimeHeaderStyleSlotsFromStyleSource<
  TStyles extends ChatRuntimeHeaderStyleSource,
>({
  styles,
}: {
  styles: TStyles
}): ChatRuntimeHeaderStyleSlotsFromStyleSource<TStyles> {
  return createChatRuntimeHeaderStyleSlots({
    actionsRowStyle: styles.headerActionsRow,
    agentSelectorStyles: {
      button: styles.headerAgentSelectorButton,
      chip: styles.headerAgentSelectorChip,
      label: styles.headerAgentSelectorText,
    },
    conversationStatusStyles: {
      chip: styles.headerConversationChip,
      text: styles.headerConversationChipText,
      spinner: styles.headerConversationSpinner,
    },
    turnDurationStyles: {
      chip: styles.headerDurationChip,
      liveChip: styles.headerDurationChipLive,
      text: styles.headerDurationChipText,
      liveText: styles.headerDurationChipTextLive,
    },
    iconButtonStyles: {
      edgeStyle: styles.headerEdgeActionButton,
      pinStyle: styles.headerPinButton,
      pinActiveStyle: styles.headerPinButtonActive,
      actionStyle: styles.headerActionButton,
      killSwitchIconContainerStyle: styles.headerKillSwitchIconContainer,
      handsFreeIconContainerStyle: styles.headerHandsFreeIconContainer,
    },
  })
}

export function createChatRuntimeHeaderChromeSlots<TColors, TSpinnerSource, TStyles>({
  colors,
  spinnerSource,
  styles,
}: {
  colors: TColors
  spinnerSource: TSpinnerSource
  styles: TStyles
}): {
  colors: TColors
  spinnerSource: TSpinnerSource
  styles: TStyles
} {
  return {
    colors,
    spinnerSource,
    styles,
  }
}

export function createChatMessageRuntimeChromeSlots<TColors, TPlatform, TSpinnerSource, TStyles>({
  colors,
  platform,
  spinnerSource,
  styles,
}: {
  colors: TColors
  platform: TPlatform
  spinnerSource: TSpinnerSource
  styles: TStyles
}): {
  colors: TColors
  platform: TPlatform
  spinnerSource: TSpinnerSource
  styles: TStyles
} {
  return {
    colors,
    platform,
    spinnerSource,
    styles,
  }
}

export function createChatMessageRuntimeSurfaceChromeSlots<TSurfaceStyles>({
  surfaceStyles,
}: {
  surfaceStyles: TSurfaceStyles
}): {
  surfaceStyles: TSurfaceStyles
} {
  return {
    surfaceStyles,
  }
}

export function createChatRuntimeChromeSlots<TEnvironment, THeader, TMessageRuntime, TSurface>({
  environment,
  header,
  messageRuntime,
  surface,
}: {
  environment: TEnvironment
  header: THeader
  messageRuntime: TMessageRuntime
  surface: TSurface
}): {
  environment: TEnvironment
  header: THeader
  messageRuntime: TMessageRuntime
  surface: TSurface
} {
  return {
    environment,
    header,
    messageRuntime,
    surface,
  }
}

export function getChatRuntimeRetryStatusMobileRenderState({
  retryInfo,
  colors,
}: ChatRuntimeRetryStatusMobileRenderStateInput): ChatRuntimeRetryStatusMobileRenderState {
  const surface = getChatRuntimeRetryStatusMobileState()
  const resolvedColors = getChatRuntimeRetryStatusMobileColors(colors)
  const icon = getChatRuntimeRetryStatusMobileIconState()
  const retryStatus = getChatRuntimeRetryStatusState({ retryInfo })

  return {
    shouldRender: retryStatus.shouldRender,
    surface,
    colors: resolvedColors,
    title: retryStatus.title,
    attemptLabel: retryStatus.attemptLabel,
    countdownLabel: retryStatus.countdownLabel,
    description: retryStatus.description,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: retryStatus.accessibilityLabel,
    icon: {
      name: icon.name,
      size: icon.size,
      color: resolvedColors.icon.color,
    },
    spinner: {
      size: surface.spinner.size,
      color: resolvedColors.spinner.color,
    },
  }
}

export function createChatRuntimeRetryStatusMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatRuntimeRetryStatusMobileStyleSlotsInput): ChatRuntimeRetryStatusMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    card: {
      gap: spacing[surface.gap],
      padding: spacing[surface.padding],
      borderRadius: radius[surface.borderRadius],
      borderWidth: surface.borderWidth,
      borderColor: colors.card.borderColor,
      backgroundColor: colors.card.backgroundColor,
    },
    header: {
      flexDirection: surface.headerFlexDirection,
      alignItems: surface.headerAlignItems,
      gap: spacing[surface.headerGap],
    },
    title: {
      flex: surface.titleFlex,
      minWidth: surface.titleMinWidth,
      color: colors.title.color,
      fontSize: surface.titleFontSize,
      fontWeight: surface.titleFontWeight,
    },
    metaRow: {
      flexDirection: surface.metaFlexDirection,
      flexWrap: surface.metaFlexWrap,
      alignItems: surface.metaAlignItems,
      gap: spacing[surface.metaGap],
      marginTop: surface.metaMarginTop,
    },
    attempt: {
      color: colors.attempt.color,
      fontSize: surface.attemptFontSize,
    },
    countdown: {
      color: colors.countdown.color,
      fontSize: surface.countdownFontSize,
      fontWeight: surface.countdownFontWeight,
      paddingHorizontal: spacing[surface.countdownPaddingHorizontal],
      paddingVertical: surface.countdownPaddingVertical,
      borderRadius: radius[surface.countdownBorderRadius],
      backgroundColor: colors.countdown.backgroundColor,
      overflow: surface.countdownOverflow,
    },
    description: {
      color: colors.description.color,
      fontSize: surface.descriptionFontSize,
      lineHeight: surface.descriptionLineHeight,
      marginTop: surface.descriptionMarginTop,
    },
  }
}

export function getChatRuntimeConnectionBannerMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner
}

export function getChatRuntimeConnectionBannerFailedMobileIconState(): ChatRuntimeConnectionBannerFailedMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon.failedName,
    size: CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon.size,
    colorToken: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.failed.borderColorToken,
  }
}

export function getChatRuntimeConnectionBannerMobileColors(
  colors: ChatRuntimeConnectionBannerMobileColorPalette,
): ChatRuntimeConnectionBannerMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner
  const failedIcon = getChatRuntimeConnectionBannerFailedMobileIconState()

  return {
    reconnecting: {
      backgroundColor: hexToRgba(
        colors[surface.reconnecting.backgroundColorToken],
        surface.reconnecting.backgroundAlpha,
      ),
      borderColor: hexToRgba(colors[surface.reconnecting.borderColorToken], surface.reconnecting.borderAlpha),
      spinner: {
        color: colors[surface.reconnecting.spinnerColorToken],
      },
    },
    failed: {
      backgroundColor: hexToRgba(colors[surface.failed.backgroundColorToken], surface.failed.backgroundAlpha),
      borderColor: hexToRgba(colors[surface.failed.borderColorToken], surface.failed.borderAlpha),
      icon: {
        color: colors[failedIcon.colorToken],
      },
    },
    title: {
      color: colors[surface.titleColorToken],
    },
    subtitle: {
      color: colors[surface.subtitleColorToken],
    },
    retryButton: {
      backgroundColor: colors[surface.retryButton.backgroundColorToken],
      color: colors[surface.retryButton.foregroundColorToken],
    },
  }
}

function formatChatRuntimeConnectionBannerAccessibilityLabel(
  title: string,
  subtitle: string | null | undefined,
): string {
  return [title, subtitle].filter(Boolean).join(". ")
}

export function getChatRuntimeConnectionBannerMobileRenderState({
  connectionState,
  lastFailedMessage = null,
  isResponding = false,
  colors,
}: ChatRuntimeConnectionBannerMobileRenderStateInput): ChatRuntimeConnectionBannerMobileRenderState {
  const surface = getChatRuntimeConnectionBannerMobileState()
  const resolvedColors = getChatRuntimeConnectionBannerMobileColors(colors)
  const failedIcon = getChatRuntimeConnectionBannerFailedMobileIconState()
  const reconnectingTitle = connectionState ? formatConnectionStatus(connectionState) : ""
  const reconnectingSubtitle = connectionState?.lastError ?? null
  const failedTitle = CHAT_RUNTIME_PRESENTATION.connectionBanner.failedTitle
  const failedSubtitle = CHAT_RUNTIME_PRESENTATION.connectionBanner.failedSubtitle

  return {
    surface,
    colors: resolvedColors,
    reconnecting: {
      shouldRender: connectionState?.status === "reconnecting",
      title: reconnectingTitle,
      subtitle: reconnectingSubtitle,
      accessibilityRole: surface.accessibilityRole,
      accessibilityLabel: formatChatRuntimeConnectionBannerAccessibilityLabel(
        reconnectingTitle,
        reconnectingSubtitle,
      ),
      spinner: {
        size: surface.reconnecting.spinnerSize,
        color: resolvedColors.reconnecting.spinner.color,
      },
    },
    failed: {
      shouldRender: !!lastFailedMessage && !isResponding,
      title: failedTitle,
      subtitle: failedSubtitle,
      accessibilityRole: surface.accessibilityRole,
      accessibilityLabel: formatChatRuntimeConnectionBannerAccessibilityLabel(failedTitle, failedSubtitle),
      icon: {
        name: failedIcon.name,
        size: failedIcon.size,
        color: resolvedColors.failed.icon.color,
      },
      retryButton: {
        label: CHAT_RUNTIME_PRESENTATION.connectionBanner.retryLabel,
        accessibilityRole: surface.retryButton.accessibilityRole,
        accessibilityLabel: CHAT_RUNTIME_PRESENTATION.connectionBanner.retryLabel,
        pressedOpacity: surface.retryButton.pressedOpacity,
      },
    },
  }
}

export function createChatRuntimeConnectionBannerMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatRuntimeConnectionBannerMobileStyleSlotsInput): ChatRuntimeConnectionBannerMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    banner: {
      paddingHorizontal: spacing[surface.paddingHorizontal],
      paddingVertical: spacing[surface.paddingVertical],
      marginHorizontal: spacing[surface.marginHorizontal],
      marginBottom: spacing[surface.marginBottom],
      borderRadius: radius[surface.borderRadius],
      borderWidth: surface.borderWidth,
    },
    reconnecting: {
      backgroundColor: colors.reconnecting.backgroundColor,
      borderColor: colors.reconnecting.borderColor,
    },
    failed: {
      backgroundColor: colors.failed.backgroundColor,
      borderColor: colors.failed.borderColor,
    },
    content: {
      flexDirection: surface.contentFlexDirection,
      alignItems: surface.contentAlignItems,
    },
    icon: {
      marginRight: spacing[surface.iconMarginRight],
    },
    textContainer: {
      flex: surface.textContainerFlex,
    },
    title: {
      fontSize: surface.titleFontSize,
      fontWeight: surface.titleFontWeight,
      color: colors.title.color,
    },
    subtitle: {
      fontSize: surface.subtitleFontSize,
      color: colors.subtitle.color,
      marginTop: surface.subtitleMarginTop,
    },
    retryButton: {
      backgroundColor: colors.retryButton.backgroundColor,
      paddingHorizontal: spacing[surface.retryButton.paddingHorizontal],
      paddingVertical: spacing[surface.retryButton.paddingVertical],
      borderRadius: radius[surface.retryButton.borderRadius],
      marginLeft: spacing[surface.retryButton.marginLeft],
    },
    retryButtonText: {
      color: colors.retryButton.color,
      fontSize: surface.retryButton.fontSize,
      fontWeight: surface.retryButton.fontWeight,
    },
  }
}

export function getChatRuntimeStepSummaryMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary
}

export function getChatRuntimeStepSummaryMobileColors(
  colors: ChatRuntimeStepSummaryMobileColorPalette,
): ChatRuntimeStepSummaryMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary

  return {
    card: {
      borderColor: hexToRgba(colors[surface.borderColorToken], surface.borderAlpha),
      backgroundColor: hexToRgba(colors[surface.backgroundColorToken], surface.backgroundAlpha),
    },
    title: {
      color: colors[surface.titleColorToken],
    },
    badge: {
      backgroundColor: hexToRgba(colors[surface.titleColorToken], surface.badgeBackgroundAlpha),
    },
    badgeText: {
      color: colors[surface.titleColorToken],
    },
    action: {
      color: colors[surface.actionColorToken],
    },
    meta: {
      color: colors[surface.metaColorToken],
    },
    preview: {
      color: colors[surface.previewColorToken],
    },
  }
}

export function getChatRuntimeStepSummaryMobileRenderState({
  summary = null,
  colors,
}: ChatRuntimeStepSummaryMobileRenderStateInput): ChatRuntimeStepSummaryMobileRenderState {
  const surface = getChatRuntimeStepSummaryMobileState()
  const resolvedColors = getChatRuntimeStepSummaryMobileColors(colors)
  const stepSummary = getChatRuntimeStepSummaryState({ summary })

  return {
    shouldRender: stepSummary.shouldRender,
    surface,
    colors: resolvedColors,
    title: stepSummary.title,
    badgeLabel: stepSummary.badgeLabel,
    actionSummary: stepSummary.actionSummary,
    meta: stepSummary.meta,
    preview: stepSummary.preview,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: stepSummary.accessibilityLabel,
  }
}

export function createChatRuntimeStepSummaryMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatRuntimeStepSummaryMobileStyleSlotsInput): ChatRuntimeStepSummaryMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    card: {
      gap: spacing[surface.gap],
      padding: spacing[surface.padding],
      borderRadius: radius[surface.borderRadius],
      borderWidth: surface.borderWidth,
      borderColor: colors.card.borderColor,
      backgroundColor: colors.card.backgroundColor,
    },
    header: {
      flexDirection: surface.headerFlexDirection,
      alignItems: surface.headerAlignItems,
      gap: spacing[surface.headerGap],
      minWidth: surface.headerMinWidth,
    },
    title: {
      flexShrink: surface.titleFlexShrink,
      minWidth: surface.titleMinWidth,
      color: colors.title.color,
      fontSize: surface.titleFontSize,
      fontWeight: surface.titleFontWeight,
    },
    badge: {
      marginLeft: surface.badgeMarginLeft,
      maxWidth: surface.badgeMaxWidth,
      paddingHorizontal: spacing[surface.badgePaddingHorizontal],
      paddingVertical: surface.badgePaddingVertical,
      borderRadius: radius[surface.badgeBorderRadius],
      backgroundColor: colors.badge.backgroundColor,
    },
    badgeText: {
      color: colors.badgeText.color,
      fontSize: surface.badgeTextFontSize,
      fontWeight: surface.badgeTextFontWeight,
    },
    action: {
      color: colors.action.color,
      fontSize: surface.actionFontSize,
      lineHeight: surface.actionLineHeight,
      fontWeight: surface.actionFontWeight,
    },
    meta: {
      color: colors.meta.color,
      fontSize: surface.metaFontSize,
      lineHeight: surface.metaLineHeight,
    },
    preview: {
      color: colors.preview.color,
      fontSize: surface.previewFontSize,
      lineHeight: surface.previewLineHeight,
      marginTop: surface.previewMarginTop,
    },
  }
}

export function getChatRuntimeViewportAffordanceMobileRenderState({
  visibleMessageCount,
  totalMessageCount,
  hiddenMessageCount,
  messageHistoryLoadIncrement,
  latestStepSummary = null,
  colors,
}: ChatRuntimeViewportAffordanceMobileRenderStateInput): ChatRuntimeViewportAffordanceMobileRenderState {
  return {
    historyBanner: {
      renderState: getChatRuntimeMessageHistoryBannerMobileRenderState({
        visibleCount: visibleMessageCount,
        totalCount: totalMessageCount,
        hiddenCount: hiddenMessageCount,
        loadIncrement: messageHistoryLoadIncrement,
        includeScrollHint: true,
        colors,
      }),
    },
    stepSummary: {
      renderState: getChatRuntimeStepSummaryMobileRenderState({
        summary: latestStepSummary,
        colors,
      }),
    },
  }
}

export function getChatRuntimeStreamingContentMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent
}

export function getChatRuntimeStreamingContentMobileIconState(): ChatRuntimeStreamingContentMobileIconState {
  return {
    name: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.name,
    size: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.size,
    colorToken: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleColorToken,
  }
}

export function getChatRuntimeStreamingContentMobileColors(
  colors: ChatRuntimeStreamingContentMobileColorPalette,
): ChatRuntimeStreamingContentMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent
  const titleColor = colors[surface.titleColorToken]

  return {
    icon: {
      color: titleColor,
    },
    title: {
      color: titleColor,
    },
    badge: {
      backgroundColor: hexToRgba(titleColor, surface.badgeBackgroundAlpha),
    },
    badgeText: {
      color: titleColor,
    },
    text: {
      color: colors[surface.textColorToken],
    },
    caret: {
      backgroundColor: titleColor,
    },
  }
}

export function getChatRuntimeStreamingContentMobileRenderState({
  isStreaming = false,
  content = "",
  colors,
}: ChatRuntimeStreamingContentMobileRenderStateInput): ChatRuntimeStreamingContentMobileRenderState {
  const surface = getChatRuntimeStreamingContentMobileState()
  const resolvedColors = getChatRuntimeStreamingContentMobileColors(colors)
  const icon = getChatRuntimeStreamingContentMobileIconState()
  const streamingContent = getChatRuntimeStreamingContentState({
    isStreaming,
    content,
  })

  return {
    shouldRender: streamingContent.shouldRender,
    surface,
    colors: resolvedColors,
    title: streamingContent.title,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: streamingContent.accessibilityLabel,
    badgeLabel: streamingContent.badgeLabel,
    content: streamingContent.content,
    icon: {
      name: icon.name,
      size: icon.size,
      color: resolvedColors.icon.color,
    },
    spinner: {
      size: surface.spinnerSize,
      resizeMode: surface.spinnerResizeMode,
    },
  }
}

export function createChatRuntimeStreamingContentMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatRuntimeStreamingContentMobileStyleSlotsInput): ChatRuntimeStreamingContentMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors
  const spinnerSize = renderState.spinner.size

  return {
    header: {
      flexDirection: surface.headerFlexDirection,
      alignItems: surface.headerAlignItems,
      gap: spacing[surface.headerGap],
      marginBottom: spacing[surface.headerMarginBottom],
    },
    title: {
      minWidth: surface.titleMinWidth,
      flexShrink: surface.titleFlexShrink,
      color: colors.title.color,
      fontSize: surface.titleFontSize,
      fontWeight: surface.titleFontWeight,
    },
    spinner: {
      width: spinnerSize,
      height: spinnerSize,
    },
    badge: {
      marginLeft: surface.badgeMarginLeft,
      paddingHorizontal: spacing[surface.badgePaddingHorizontal],
      paddingVertical: surface.badgePaddingVertical,
      borderRadius: radius[surface.badgeBorderRadius],
      backgroundColor: colors.badge.backgroundColor,
    },
    badgeText: {
      color: colors.badgeText.color,
      fontSize: surface.badgeTextFontSize,
      fontWeight: surface.badgeTextFontWeight,
    },
    bodyRow: {
      flexDirection: surface.bodyRowFlexDirection,
      alignItems: surface.bodyRowAlignItems,
      minWidth: surface.bodyRowMinWidth,
    },
    text: {
      flex: surface.textFlex,
      minWidth: surface.textMinWidth,
      color: colors.text.color,
      fontSize: surface.textFontSize,
      lineHeight: surface.textLineHeight,
    },
    caret: {
      width: surface.caretWidth,
      height: surface.caretHeight,
      marginLeft: surface.caretMarginLeft,
      borderRadius: surface.caretBorderRadius,
      backgroundColor: colors.caret.backgroundColor,
    },
  }
}

export function getChatRuntimeMessageHistoryWindowMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryWindow
}

export function getChatRuntimeMessageHistoryWindowMobileDisplayState<TMessage>({
  messages,
  visibleMessageCount,
}: ChatRuntimeMessageHistoryWindowMobileDisplayStateInput<TMessage>): ChatRuntimeMessageHistoryWindowMobileDisplayState<TMessage> {
  const firstVisibleMessageIndex = Math.max(0, messages.length - visibleMessageCount)

  return {
    firstVisibleMessageIndex,
    visibleMessages: messages.slice(firstVisibleMessageIndex),
    hiddenMessageCount: firstVisibleMessageIndex,
  }
}

export function getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount({
  currentVisibleCount,
  messageCount,
  loadIncrement = getChatRuntimeMessageHistoryWindowMobileState().loadIncrement,
}: ChatRuntimeMessageHistoryWindowMobileExpandedVisibleCountInput): number {
  return Math.min(messageCount, currentVisibleCount + loadIncrement)
}

export function getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount({
  currentVisibleCount,
  messageCount,
  initialVisibleCount = getChatRuntimeMessageHistoryWindowMobileState().initialVisibleCount,
}: ChatRuntimeMessageHistoryWindowMobileVisibleCountInput): number {
  if (messageCount === 0) return initialVisibleCount
  const nextVisibleCount = Math.max(initialVisibleCount, currentVisibleCount)
  return Math.min(messageCount, nextVisibleCount)
}

export function getChatRuntimeMessageHistoryWindowMobileIsAtBottom({
  viewportHeight,
  scrollOffsetY,
  contentHeight,
  bottomResumeThresholdPx = getChatRuntimeMessageHistoryWindowMobileState().bottomResumeThresholdPx,
}: ChatRuntimeMessageHistoryWindowMobileBottomStateInput): boolean {
  return viewportHeight + scrollOffsetY >= contentHeight - bottomResumeThresholdPx
}

export function getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier({
  scrollOffsetY,
  visibleMessageCount,
  messageCount,
  topLoadThresholdPx = getChatRuntimeMessageHistoryWindowMobileState().topLoadThresholdPx,
}: ChatRuntimeMessageHistoryWindowMobileLoadEarlierStateInput): boolean {
  return scrollOffsetY <= topLoadThresholdPx && visibleMessageCount < messageCount
}

export function getChatRuntimeMessageHistoryBannerMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner
}

export function getChatRuntimeMessageHistoryLoadEarlierMobileIconState(): ChatRuntimeMessageHistoryLoadEarlierMobileIconState {
  return {
    name: CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.loadEarlierName,
    size: CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.size,
    colorToken: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.colorToken,
  }
}

export function getChatRuntimeMessageHistoryBannerMobileColors(
  colors: ChatRuntimeMessageHistoryBannerMobileColorPalette,
): ChatRuntimeMessageHistoryBannerMobileColors {
  const surface = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner
  const loadIcon = getChatRuntimeMessageHistoryLoadEarlierMobileIconState()

  return {
    summary: {
      color: colors[surface.textColorToken],
    },
    loadButton: {
      borderColor: colors[surface.loadButton.borderColorToken],
      backgroundColor: hexToRgba(
        colors[surface.loadButton.backgroundColorToken],
        surface.loadButton.backgroundAlpha,
      ),
      color: colors[surface.loadButton.colorToken],
    },
    loadIcon: {
      color: colors[loadIcon.colorToken],
    },
  }
}

export function getChatRuntimeMessageHistoryBannerMobileRenderState({
  visibleCount = 0,
  totalCount = 0,
  hiddenCount,
  loadIncrement = getChatRuntimeMessageHistoryWindowMobileState().loadIncrement,
  isLoadingEarlier = false,
  includeScrollHint = false,
  colors,
}: ChatRuntimeMessageHistoryBannerMobileRenderStateInput): ChatRuntimeMessageHistoryBannerMobileRenderState {
  const surface = getChatRuntimeMessageHistoryBannerMobileState()
  const resolvedColors = getChatRuntimeMessageHistoryBannerMobileColors(colors)
  const loadIcon = getChatRuntimeMessageHistoryLoadEarlierMobileIconState()
  const banner = getChatRuntimeMessageHistoryBannerState({
    visibleCount,
    totalCount,
    hiddenCount,
    loadIncrement,
    isLoadingEarlier,
    includeScrollHint,
  })

  return {
    shouldRender: banner.shouldRender,
    surface,
    colors: resolvedColors,
    summaryLabel: banner.summaryLabel,
    loadButton: {
      accessibilityRole: surface.loadButton.accessibilityRole,
      accessibilityLabel: banner.loadEarlierLabel,
      label: banner.loadEarlierLabel,
      icon: {
        name: loadIcon.name,
        size: loadIcon.size,
        color: resolvedColors.loadIcon.color,
      },
      pressedOpacity: surface.loadButton.pressedOpacity,
    },
  }
}

export function createChatRuntimeMessageHistoryBannerMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatRuntimeMessageHistoryBannerMobileStyleSlotsInput): ChatRuntimeMessageHistoryBannerMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    container: {
      flexDirection: surface.flexDirection,
      flexWrap: surface.flexWrap,
      justifyContent: surface.justifyContent,
      alignItems: surface.alignItems,
      gap: spacing[surface.gap],
      paddingVertical: spacing[surface.paddingVertical],
    },
    summaryText: {
      color: colors.summary.color,
      fontSize: surface.summaryFontSize,
      lineHeight: surface.summaryLineHeight,
      textAlign: surface.textAlign,
    },
    loadButton: {
      flexDirection: surface.loadButton.flexDirection,
      alignItems: surface.loadButton.alignItems,
      justifyContent: surface.loadButton.justifyContent,
      gap: spacing[surface.loadButton.gap],
      paddingHorizontal: spacing[surface.loadButton.paddingHorizontal],
      paddingVertical: surface.loadButton.paddingVertical,
      borderRadius: radius[surface.loadButton.borderRadius],
      borderWidth: surface.loadButton.borderWidth,
      borderColor: colors.loadButton.borderColor,
      backgroundColor: colors.loadButton.backgroundColor,
    },
    loadButtonPressed: {
      opacity: renderState.loadButton.pressedOpacity,
    },
    loadButtonText: {
      color: colors.loadButton.color,
      fontSize: surface.loadButton.fontSize,
      fontWeight: surface.loadButton.fontWeight,
    },
  }
}

export function getChatRuntimeViewportMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport
}

export function getChatRuntimeViewportMobileKeyboardAvoidingBehavior(platform: string | null | undefined) {
  const behavior = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.keyboardAvoidingBehaviorByPlatform
  return platform === "ios" ? behavior.ios : behavior.default
}

export function getChatRuntimeViewportMobileColors(
  colors: ChatRuntimeViewportMobileColorPalette,
): ChatRuntimeViewportMobileColors {
  const viewport = CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport

  return {
    backgroundColor: colors[viewport.backgroundColorToken],
  }
}

export function getChatRuntimeViewportMobileRenderState({
  colors,
}: ChatRuntimeViewportMobileRenderStateInput): ChatRuntimeViewportMobileRenderState {
  return {
    surface: getChatRuntimeViewportMobileState(),
    loadingState: getChatRuntimeLoadingStateMobileState(),
    inlineActivity: getChatRuntimeInlineActivityMobileState(),
    colors: getChatRuntimeViewportMobileColors(colors),
  }
}

export function createChatRuntimeViewportMobileStyleSlots({
  renderState,
  spacing,
}: ChatRuntimeViewportMobileStyleSlotsInput): ChatRuntimeViewportMobileStyleSlots {
  const surface = renderState.surface
  const colors = renderState.colors

  return {
    keyboardAvoidingContainer: {
      flex: surface.flex,
      backgroundColor: colors.backgroundColor,
    },
    root: {
      flex: surface.flex,
    },
    scroll: {
      flex: surface.flex,
      paddingHorizontal: spacing[surface.paddingHorizontal],
      paddingVertical: spacing[surface.paddingVertical],
      backgroundColor: colors.backgroundColor,
    },
    scrollContent: {
      gap: spacing[surface.contentGap],
    },
  }
}

export function createChatRuntimeViewportActivityMobileStyleSlots({
  renderState,
}: ChatRuntimeViewportActivityMobileStyleSlotsInput): ChatRuntimeViewportActivityMobileStyleSlots {
  const loadingState = renderState.loadingState
  const inlineActivity = renderState.inlineActivity

  return {
    loadingState: {
      flex: loadingState.flex,
      justifyContent: loadingState.justifyContent,
      alignItems: loadingState.alignItems,
      paddingVertical: loadingState.paddingVertical,
    },
    loadingSpinner: {
      width: loadingState.spinnerSize,
      height: loadingState.spinnerSize,
    },
    inlineActivityIndicator: {
      flexDirection: inlineActivity.flexDirection,
      alignItems: inlineActivity.alignItems,
    },
    inlineActivitySpinner: {
      width: inlineActivity.spinnerSize,
      height: inlineActivity.spinnerSize,
    },
  }
}

export function getChatRuntimeSurfaceChromeMobileRenderState({
  colors,
  platform,
}: ChatRuntimeSurfaceChromeMobileRenderStateInput): ChatRuntimeSurfaceChromeMobileRenderState {
  return {
    frame: {
      keyboardAvoidingBehavior: getChatRuntimeViewportMobileKeyboardAvoidingBehavior(platform),
    },
    promptEditor: {
      renderState: getPromptLibraryEditorMobileRenderState({
        colors,
        platform,
      }),
    },
  }
}

export function createChatRuntimeSurfaceChromeMobileProps<
  TInput extends {
    platform: ChatRuntimeSurfaceChromeMobileRenderStateInput["platform"]
    colors: ChatRuntimeSurfaceChromeMobileRenderStateInput["colors"]
    keyboardVerticalOffset: unknown
    dock: unknown
    viewport: unknown
    threadStates: unknown
    threadStyles: unknown
    agentSelectorVisible: unknown
    onAgentSelectorClose: unknown
    promptEditorVisible: unknown
    promptEditorIsEditing: unknown
    promptEditorNameValue: unknown
    onPromptEditorNameChange: unknown
    promptEditorContentValue: unknown
    onPromptEditorContentChange: unknown
    promptEditorIsSaving: unknown
    onPromptEditorClose: unknown
    onPromptEditorSave: unknown
    promptEditorStyles: unknown
  },
>({
  platform,
  colors,
  keyboardVerticalOffset,
  dock,
  viewport,
  threadStates,
  threadStyles,
  agentSelectorVisible,
  onAgentSelectorClose,
  promptEditorVisible,
  promptEditorIsEditing,
  promptEditorNameValue,
  onPromptEditorNameChange,
  promptEditorContentValue,
  onPromptEditorContentChange,
  promptEditorIsSaving,
  onPromptEditorClose,
  onPromptEditorSave,
  promptEditorStyles,
}: TInput): {
  frame: {
    keyboardAvoidingBehavior: ChatRuntimeSurfaceChromeMobileRenderState["frame"]["keyboardAvoidingBehavior"]
    keyboardVerticalOffset: TInput["keyboardVerticalOffset"]
  }
  dock: TInput["dock"]
  overlays: {
    agentSelector: {
      visible: TInput["agentSelectorVisible"]
      onClose: TInput["onAgentSelectorClose"]
    }
    promptEditor: {
      visible: TInput["promptEditorVisible"]
      renderState: ChatRuntimeSurfaceChromeMobileRenderState["promptEditor"]["renderState"]
      isEditing: TInput["promptEditorIsEditing"]
      nameValue: TInput["promptEditorNameValue"]
      onNameChange: TInput["onPromptEditorNameChange"]
      contentValue: TInput["promptEditorContentValue"]
      onContentChange: TInput["onPromptEditorContentChange"]
      isSaving: TInput["promptEditorIsSaving"]
      onClose: TInput["onPromptEditorClose"]
      onSave: TInput["onPromptEditorSave"]
      styles: TInput["promptEditorStyles"]
    }
  }
  viewport: TInput["viewport"]
  threadList: {
    threadStates: TInput["threadStates"]
    styles: TInput["threadStyles"]
  }
} {
  const surfaceChromeRenderState = getChatRuntimeSurfaceChromeMobileRenderState({
    colors,
    platform,
  })

  return {
    frame: {
      keyboardAvoidingBehavior: surfaceChromeRenderState.frame.keyboardAvoidingBehavior,
      keyboardVerticalOffset,
    },
    dock,
    overlays: {
      agentSelector: {
        visible: agentSelectorVisible,
        onClose: onAgentSelectorClose,
      },
      promptEditor: {
        visible: promptEditorVisible,
        renderState: surfaceChromeRenderState.promptEditor.renderState,
        isEditing: promptEditorIsEditing,
        nameValue: promptEditorNameValue,
        onNameChange: onPromptEditorNameChange,
        contentValue: promptEditorContentValue,
        onContentChange: onPromptEditorContentChange,
        isSaving: promptEditorIsSaving,
        onClose: onPromptEditorClose,
        onSave: onPromptEditorSave,
        styles: promptEditorStyles,
      },
    },
    viewport,
    threadList: {
      threadStates,
      styles: threadStyles,
    },
  }
}

export function getChatRuntimeDockChromeMobileRenderState({
  scrollToBottomVisible,
  voiceOverlayListening,
  voiceOverlayHandsFree,
  voiceOverlayWillCancel,
  queuePanelEnabled,
  queuePanelMessageCount,
  connectionState,
  lastFailedMessage,
  isResponding,
  colors,
}: ChatRuntimeDockChromeMobileRenderStateInput): ChatRuntimeDockChromeMobileRenderState {
  const composerSurface = getChatComposerMobileSurfaceState()
  const voiceOverlayVisibility = getChatComposerMobileVisibilityRenderState({
    listening: voiceOverlayListening,
  })

  return {
    scrollToBottom: getChatRuntimeScrollToBottomMobileRenderState({
      isVisible: scrollToBottomVisible,
      colors,
    }),
    voiceOverlay: {
      isVisible: voiceOverlayVisibility.voiceOverlay.isVisible,
      label: getChatComposerVoiceOverlayLabel({
        handsFree: voiceOverlayHandsFree,
        willCancel: voiceOverlayWillCancel,
      }),
      transcriptNumberOfLines: composerSurface.voiceOverlay.transcriptNumberOfLines,
    },
    queuePanel: getMessageQueuePanelMobileDockRenderState({
      isQueueEnabled: queuePanelEnabled,
      messageCount: queuePanelMessageCount,
    }),
    connectionBanner: getChatRuntimeConnectionBannerMobileRenderState({
      connectionState,
      lastFailedMessage,
      isResponding,
      colors,
    }),
  }
}

export function createChatRuntimeDockChromeMobileProps<
  TInput extends {
    responseHistoryResponses: unknown
    responseHistoryTtsProvider: unknown
    responseHistoryRemoteTtsVoice: unknown
    responseHistoryRemoteTtsModel: unknown
    responseHistoryTtsRate: unknown
    responseHistoryTtsPitch: unknown
    responseHistoryTtsVoiceId: unknown
    responseHistoryRemoteBaseUrl: unknown
    responseHistoryRemoteApiKey: unknown
    speakNative: unknown
    stopNativeSpeech: unknown
    speakRemote: unknown
    stopRemoteSpeech: unknown
    scrollToBottomVisible: ChatRuntimeDockChromeMobileRenderStateInput["scrollToBottomVisible"]
    onScrollToBottom?: unknown
    voiceOverlayListening: ChatRuntimeDockChromeMobileRenderStateInput["voiceOverlayListening"]
    voiceOverlayHandsFree: ChatRuntimeDockChromeMobileRenderStateInput["voiceOverlayHandsFree"]
    voiceOverlayWillCancel: ChatRuntimeDockChromeMobileRenderStateInput["voiceOverlayWillCancel"]
    voiceOverlayTranscript: unknown
    queuePanelEnabled: ChatRuntimeDockChromeMobileRenderStateInput["queuePanelEnabled"]
    queuePanelConversationId: unknown
    queuedMessages: { readonly length: number }
    onRemoveQueuedMessage: unknown
    onUpdateQueuedMessage: unknown
    onRetryQueuedMessage: unknown
    onProcessNextQueuedMessage: unknown
    canProcessNextQueuedMessage: unknown
    onClearQueuedMessages: unknown
    isMessageQueuePaused: unknown
    onPauseMessageQueue: unknown
    onResumeMessageQueue: unknown
    connectionState: ChatRuntimeDockChromeMobileRenderStateInput["connectionState"]
    lastFailedMessage: ChatRuntimeDockChromeMobileRenderStateInput["lastFailedMessage"]
    isResponding: ChatRuntimeDockChromeMobileRenderStateInput["isResponding"]
    colors: ChatRuntimeDockChromeMobileRenderStateInput["colors"]
    onConnectionBannerRetry?: unknown
    composer: unknown
  },
>({
  responseHistoryResponses,
  responseHistoryTtsProvider,
  responseHistoryRemoteTtsVoice,
  responseHistoryRemoteTtsModel,
  responseHistoryTtsRate,
  responseHistoryTtsPitch,
  responseHistoryTtsVoiceId,
  responseHistoryRemoteBaseUrl,
  responseHistoryRemoteApiKey,
  speakNative,
  stopNativeSpeech,
  speakRemote,
  stopRemoteSpeech,
  scrollToBottomVisible,
  onScrollToBottom,
  voiceOverlayListening,
  voiceOverlayHandsFree,
  voiceOverlayWillCancel,
  voiceOverlayTranscript,
  queuePanelEnabled,
  queuePanelConversationId,
  queuedMessages,
  onRemoveQueuedMessage,
  onUpdateQueuedMessage,
  onRetryQueuedMessage,
  onProcessNextQueuedMessage,
  canProcessNextQueuedMessage,
  onClearQueuedMessages,
  isMessageQueuePaused,
  onPauseMessageQueue,
  onResumeMessageQueue,
  connectionState,
  lastFailedMessage,
  isResponding,
  colors,
  onConnectionBannerRetry,
  composer,
}: TInput): {
  responseHistoryPanel: {
    responses: TInput["responseHistoryResponses"]
    colors: TInput["colors"]
    ttsProvider: TInput["responseHistoryTtsProvider"]
    remoteTtsVoice: TInput["responseHistoryRemoteTtsVoice"]
    remoteTtsModel: TInput["responseHistoryRemoteTtsModel"]
    ttsRate: TInput["responseHistoryTtsRate"]
    ttsPitch: TInput["responseHistoryTtsPitch"]
    ttsVoiceId: TInput["responseHistoryTtsVoiceId"]
    remoteBaseUrl: TInput["responseHistoryRemoteBaseUrl"]
    remoteApiKey: TInput["responseHistoryRemoteApiKey"]
    speakNative: TInput["speakNative"]
    stopNativeSpeech: TInput["stopNativeSpeech"]
    speakRemote: TInput["speakRemote"]
    stopRemoteSpeech: TInput["stopRemoteSpeech"]
  }
  scrollToBottomButton: {
    renderState: ChatRuntimeDockChromeMobileRenderState["scrollToBottom"]
    onPress: TInput["onScrollToBottom"]
  }
  voiceOverlay: {
    isVisible: ChatRuntimeDockChromeMobileRenderState["voiceOverlay"]["isVisible"]
    label: ChatRuntimeDockChromeMobileRenderState["voiceOverlay"]["label"]
    transcript: TInput["voiceOverlayTranscript"]
    transcriptNumberOfLines: ChatRuntimeDockChromeMobileRenderState["voiceOverlay"]["transcriptNumberOfLines"]
  }
  queuePanel: {
    shouldRender: ChatRuntimeDockChromeMobileRenderState["queuePanel"]["shouldRender"]
    panel: {
      conversationId: TInput["queuePanelConversationId"]
      messages: TInput["queuedMessages"]
      colors: TInput["colors"]
      onRemove: TInput["onRemoveQueuedMessage"]
      onUpdate: TInput["onUpdateQueuedMessage"]
      onRetry: TInput["onRetryQueuedMessage"]
      onProcessNext: TInput["onProcessNextQueuedMessage"]
      canProcessNext: TInput["canProcessNextQueuedMessage"]
      onClear: TInput["onClearQueuedMessages"]
      isPaused: TInput["isMessageQueuePaused"]
      onPause: TInput["onPauseMessageQueue"]
      onResume: TInput["onResumeMessageQueue"]
    }
  }
  connectionBanner: {
    renderState: ChatRuntimeDockChromeMobileRenderState["connectionBanner"]
    onRetry: TInput["onConnectionBannerRetry"]
  }
  composer: TInput["composer"]
} {
  const dockChromeRenderState = getChatRuntimeDockChromeMobileRenderState({
    scrollToBottomVisible,
    voiceOverlayListening,
    voiceOverlayHandsFree,
    voiceOverlayWillCancel,
    queuePanelEnabled,
    queuePanelMessageCount: queuedMessages.length,
    connectionState,
    lastFailedMessage,
    isResponding,
    colors,
  })

  return {
    responseHistoryPanel: {
      responses: responseHistoryResponses,
      colors,
      ttsProvider: responseHistoryTtsProvider,
      remoteTtsVoice: responseHistoryRemoteTtsVoice,
      remoteTtsModel: responseHistoryRemoteTtsModel,
      ttsRate: responseHistoryTtsRate,
      ttsPitch: responseHistoryTtsPitch,
      ttsVoiceId: responseHistoryTtsVoiceId,
      remoteBaseUrl: responseHistoryRemoteBaseUrl,
      remoteApiKey: responseHistoryRemoteApiKey,
      speakNative,
      stopNativeSpeech,
      speakRemote,
      stopRemoteSpeech,
    },
    scrollToBottomButton: {
      renderState: dockChromeRenderState.scrollToBottom,
      onPress: onScrollToBottom,
    },
    voiceOverlay: {
      isVisible: dockChromeRenderState.voiceOverlay.isVisible,
      label: dockChromeRenderState.voiceOverlay.label,
      transcript: voiceOverlayTranscript,
      transcriptNumberOfLines: dockChromeRenderState.voiceOverlay.transcriptNumberOfLines,
    },
    queuePanel: {
      shouldRender: dockChromeRenderState.queuePanel.shouldRender,
      panel: {
        conversationId: queuePanelConversationId,
        messages: queuedMessages,
        colors,
        onRemove: onRemoveQueuedMessage,
        onUpdate: onUpdateQueuedMessage,
        onRetry: onRetryQueuedMessage,
        onProcessNext: onProcessNextQueuedMessage,
        canProcessNext: canProcessNextQueuedMessage,
        onClear: onClearQueuedMessages,
        isPaused: isMessageQueuePaused,
        onPause: onPauseMessageQueue,
        onResume: onResumeMessageQueue,
      },
    },
    connectionBanner: {
      renderState: dockChromeRenderState.connectionBanner,
      onRetry: onConnectionBannerRetry,
    },
    composer,
  }
}

export function getChatRuntimeConversationChromeMobileStyleRenderState({
  colors,
}: ChatRuntimeConversationChromeMobileStyleRenderStateInput): ChatRuntimeConversationChromeMobileStyleRenderState {
  return {
    viewport: getChatRuntimeViewportMobileRenderState({
      colors,
    }),
    streamingContent: getChatRuntimeStreamingContentMobileRenderState({
      colors,
    }),
    connectionBanner: getChatRuntimeConnectionBannerMobileRenderState({
      colors,
    }),
    retryStatus: getChatRuntimeRetryStatusMobileRenderState({
      colors,
    }),
    stepSummary: getChatRuntimeStepSummaryMobileRenderState({
      colors,
    }),
    delegationCard: getChatRuntimeDelegationCardMobileRenderState({
      colors,
    }),
    scrollToBottom: getChatRuntimeScrollToBottomMobileRenderState({
      colors,
    }),
    messageHistoryBanner: getChatRuntimeMessageHistoryBannerMobileRenderState({
      colors,
    }),
  }
}

export function getChatRuntimeMobileChromeStyleRenderState({
  colors,
  platform,
}: ChatRuntimeMobileChromeStyleRenderStateInput): ChatRuntimeMobileChromeStyleRenderState {
  const header = getChatRuntimeHeaderChromeMobileStyleRenderState({
    colors,
  })

  return {
    header,
    conversation: getChatRuntimeConversationChromeMobileStyleRenderState({
      colors,
    }),
    composer: getChatComposerRuntimeChromeMobileStyleRenderState({
      colors,
      platform,
    }),
    messageQueuePanelWrapper: getMessageQueuePanelMobileWrapperRenderState(),
    headerActionButton: createMinimumTouchTargetStyle(),
    headerEdgeActionButton: createMinimumTouchTargetStyle({
      horizontalPadding: header.header.surface.edgeActionButton.horizontalPadding,
    }),
    headerPinButton: createMinimumTouchTargetStyle({
      horizontalPadding: header.header.surface.pinButton.horizontalPadding,
      verticalPadding: header.header.surface.pinButton.verticalPadding,
    }),
    thread: getChatRuntimeThreadChromeMobileStyleRenderState({
      colors,
    }),
  }
}

export function getChatRuntimeLoadingStateMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState
}

export function getChatRuntimeLoadingStateMobileRenderState({
  isLoadingMessages = false,
  messageCount = 0,
}: ChatRuntimeLoadingStateMobileRenderStateInput = {}): ChatRuntimeLoadingStateMobileRenderState {
  const surface = getChatRuntimeLoadingStateMobileState()

  return {
    shouldRender: isLoadingMessages === true && (messageCount ?? 0) === 0,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: CHAT_RUNTIME_PRESENTATION.activity.loadingMessagesAccessibilityLabel,
    accessibilityState: surface.accessibilityState,
    spinnerResizeMode: surface.spinnerResizeMode,
  }
}

export function getChatRuntimeHomeQuickStartsMobileRenderState({
  isLoadingMessages = false,
  messageCount = 0,
}: ChatRuntimeHomeQuickStartsMobileRenderStateInput = {}): ChatRuntimeHomeQuickStartsMobileRenderState {
  return {
    shouldRender: isLoadingMessages !== true && (messageCount ?? 0) === 0,
  }
}

export function getChatRuntimeViewportContentMobileRenderState({
  isLoadingMessages = false,
  messageCount = 0,
}: ChatRuntimeViewportContentMobileRenderStateInput = {}): ChatRuntimeViewportContentMobileRenderState {
  return {
    loading: getChatRuntimeLoadingStateMobileRenderState({
      isLoadingMessages,
      messageCount,
    }),
    homeQuickStarts: getChatRuntimeHomeQuickStartsMobileRenderState({
      isLoadingMessages,
      messageCount,
    }),
  }
}

export function getChatRuntimeHomeQuickStartItemsMobileState<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  prompts,
  skills,
  tasks,
  canAddPrompt,
}: ChatRuntimeHomeQuickStartItemsMobileStateInput<TPrompt, TSkill, TTask>): PromptLibraryShortcutItem<TPrompt, TTask>[] {
  const mobilePromptLibraryCopy = getPromptLibraryMobileCopyState()

  return buildPromptLibraryShortcutItems({
    prompts,
    skills,
    tasks,
    canAddPrompt,
    addPromptTitle: mobilePromptLibraryCopy.addPromptTitle,
    addPromptDescription: mobilePromptLibraryCopy.addPromptDescription,
    taskDescriptionFallback: mobilePromptLibraryCopy.taskDescriptionFallback,
  })
}

export function getChatRuntimeHomeQuickStartPressIntent<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>(
  item: PromptLibraryShortcutItem<TPrompt, TTask>,
): PromptLibraryShortcutPressIntent<TTask> {
  return getPromptLibraryShortcutPressIntent(item)
}

export function getChatRuntimeHomeQuickStartEmptyMobileRenderState(
  shortcutRenderState: ReturnType<typeof getPromptLibraryMobileShortcutRenderState>,
  isLoading: boolean,
): PromptLibraryMobileShortcutEmptyRenderState {
  return getPromptLibraryMobileShortcutEmptyRenderState(shortcutRenderState, isLoading)
}

export function getChatRuntimeHomeQuickStartItemMobileRenderState<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>(
  item: PromptLibraryShortcutItem<TPrompt, TTask>,
  shortcutRenderState: ReturnType<typeof getPromptLibraryMobileShortcutRenderState>,
  runningTaskId?: string | null,
): PromptLibraryMobileShortcutItemRenderState {
  return getPromptLibraryMobileShortcutItemRenderState(
    item,
    shortcutRenderState,
    runningTaskId,
  )
}

export function getChatRuntimeViewportChromeMobileRenderState<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  isLoadingMessages = false,
  messageCount = 0,
  quickStartPrompts,
  quickStartSkills,
  quickStartTasks,
  quickStartCanAddPrompt,
  visibleMessageCount,
  totalMessageCount,
  hiddenMessageCount,
  messageHistoryLoadIncrement,
  latestStepSummary,
  requestDebugText,
  voiceDebugEnabled,
  voiceEvents,
  colors,
}: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>): ChatRuntimeViewportChromeMobileRenderState<TPrompt, TTask> {
  return {
    viewport: getChatRuntimeViewportMobileRenderState({
      colors,
    }),
    content: getChatRuntimeViewportContentMobileRenderState({
      isLoadingMessages,
      messageCount,
    }),
    affordance: getChatRuntimeViewportAffordanceMobileRenderState({
      visibleMessageCount,
      totalMessageCount,
      hiddenMessageCount,
      messageHistoryLoadIncrement,
      latestStepSummary,
      colors,
    }),
    quickStartItems: getChatRuntimeHomeQuickStartItemsMobileState({
      prompts: quickStartPrompts,
      skills: quickStartSkills,
      tasks: quickStartTasks,
      canAddPrompt: quickStartCanAddPrompt,
    }),
    shortcutRenderState: getPromptLibraryMobileShortcutRenderState(colors),
    debugPanels: getChatRuntimeDebugPanelsMobileDisplayState({
      requestDebugText,
      voiceDebugEnabled,
      voiceEvents,
    }),
  }
}

export function createChatRuntimeViewportChromeMobileProps<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
  TInput extends {
    viewportContentIsLoadingMessages: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      TSkill,
      TTask
    >["isLoadingMessages"]
    viewportContentMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      TSkill,
      TTask
    >["messageCount"]
    loadingSpinnerSource: unknown
    quickStartPrompts: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["quickStartPrompts"]
    quickStartSkills: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["quickStartSkills"]
    quickStartTasks: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["quickStartTasks"]
    quickStartCanAddPrompt: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      TSkill,
      TTask
    >["quickStartCanAddPrompt"]
    isLoadingQuickStartPrompts: unknown
    runningPromptTaskId?: unknown
    onQuickStartPress: unknown
    onEditPrompt: unknown
    onDeletePrompt: unknown
    visibleMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["visibleMessageCount"]
    totalMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["totalMessageCount"]
    hiddenMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["hiddenMessageCount"]
    messageHistoryLoadIncrement: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      TSkill,
      TTask
    >["messageHistoryLoadIncrement"]
    latestStepSummary: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["latestStepSummary"]
    colors: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["colors"]
    onLoadEarlierMessages?: unknown
    requestDebugText?: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["requestDebugText"]
    voiceDebugEnabled?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      TSkill,
      TTask
    >["voiceDebugEnabled"]
    voiceEvents?: ChatRuntimeViewportChromeMobileRenderStateInput<TPrompt, TSkill, TTask>["voiceEvents"]
  },
>({
  viewportContentIsLoadingMessages,
  viewportContentMessageCount,
  loadingSpinnerSource,
  quickStartPrompts,
  quickStartSkills,
  quickStartTasks,
  quickStartCanAddPrompt,
  isLoadingQuickStartPrompts,
  runningPromptTaskId,
  onQuickStartPress,
  onEditPrompt,
  onDeletePrompt,
  visibleMessageCount,
  totalMessageCount,
  hiddenMessageCount,
  messageHistoryLoadIncrement,
  latestStepSummary,
  colors,
  onLoadEarlierMessages,
  requestDebugText,
  voiceDebugEnabled,
  voiceEvents,
  ...scrollViewportProps
}: TInput): Omit<TInput, ChatRuntimeViewportChromeMobilePropsInputKey> & {
  keyboardShouldPersistTaps: ChatRuntimeViewportChromeMobileRenderState["viewport"]["surface"]["keyboardShouldPersistTaps"]
  contentInsetAdjustmentBehavior: ChatRuntimeViewportChromeMobileRenderState["viewport"]["surface"]["contentInsetAdjustmentBehavior"]
  loadingState: {
    renderState: ChatRuntimeViewportChromeMobileRenderState["content"]["loading"]
    spinnerSource: TInput["loadingSpinnerSource"]
  }
  homeQuickStarts: {
    shouldRender: ChatRuntimeViewportChromeMobileRenderState["content"]["homeQuickStarts"]["shouldRender"]
    items: ChatRuntimeViewportChromeMobileRenderState<TPrompt, TTask>["quickStartItems"]
    isLoading: TInput["isLoadingQuickStartPrompts"]
    runningTaskId: TInput["runningPromptTaskId"]
    onPress: TInput["onQuickStartPress"]
    onEditPrompt: TInput["onEditPrompt"]
    onDeletePrompt: TInput["onDeletePrompt"]
    shortcutRenderState: ChatRuntimeViewportChromeMobileRenderState<TPrompt, TTask>["shortcutRenderState"]
  }
  historyBanner: ChatRuntimeViewportChromeMobileRenderState["affordance"]["historyBanner"] & {
    onLoadEarlier: TInput["onLoadEarlierMessages"]
  }
  stepSummary: ChatRuntimeViewportChromeMobileRenderState["affordance"]["stepSummary"]
  debugPanels: ChatRuntimeViewportChromeMobileRenderState["debugPanels"]
} {
  const viewportChromeRenderState = getChatRuntimeViewportChromeMobileRenderState({
    isLoadingMessages: viewportContentIsLoadingMessages,
    messageCount: viewportContentMessageCount,
    quickStartPrompts,
    quickStartSkills,
    quickStartTasks,
    quickStartCanAddPrompt,
    visibleMessageCount,
    totalMessageCount,
    hiddenMessageCount,
    messageHistoryLoadIncrement,
    latestStepSummary,
    requestDebugText,
    voiceDebugEnabled,
    voiceEvents,
    colors,
  })

  return {
    ...scrollViewportProps,
    keyboardShouldPersistTaps: viewportChromeRenderState.viewport.surface.keyboardShouldPersistTaps,
    contentInsetAdjustmentBehavior: viewportChromeRenderState.viewport.surface.contentInsetAdjustmentBehavior,
    loadingState: {
      renderState: viewportChromeRenderState.content.loading,
      spinnerSource: loadingSpinnerSource,
    },
    homeQuickStarts: {
      shouldRender: viewportChromeRenderState.content.homeQuickStarts.shouldRender,
      items: viewportChromeRenderState.quickStartItems,
      isLoading: isLoadingQuickStartPrompts,
      runningTaskId: runningPromptTaskId,
      onPress: onQuickStartPress,
      onEditPrompt,
      onDeletePrompt,
      shortcutRenderState: viewportChromeRenderState.shortcutRenderState,
    },
    historyBanner: {
      ...viewportChromeRenderState.affordance.historyBanner,
      onLoadEarlier: onLoadEarlierMessages,
    },
    stepSummary: viewportChromeRenderState.affordance.stepSummary,
    debugPanels: viewportChromeRenderState.debugPanels,
  }
}

export function getChatRuntimeDebugPanelsMobileRenderState({
  requestDebugText = "",
  voiceDebugEnabled = false,
  voiceEntryCount = 0,
  voiceRows = [],
}: ChatRuntimeDebugPanelsMobileRenderStateInput = {}): ChatRuntimeDebugPanelsMobileRenderState {
  const requestText = requestDebugText ?? ""
  const resolvedVoiceRows = voiceRows ? Array.from(voiceRows) : []

  return {
    requestShouldRender: requestText.length > 0,
    requestRows: requestText.length > 0 ? [{ key: "request-debug", text: requestText }] : [],
    voiceShouldRender: voiceDebugEnabled === true && (voiceEntryCount ?? 0) > 0,
    voiceRows: resolvedVoiceRows,
  }
}

export function getChatRuntimeDebugPanelsMobileDisplayState({
  requestDebugText,
  voiceDebugEnabled = false,
  voiceEvents = [],
}: ChatRuntimeDebugPanelsMobileDisplayStateInput = {}): ChatRuntimeDebugPanelsMobileRenderState {
  const handsFreeCopy = getHandsFreeComposerCopyState()
  const resolvedVoiceEvents = voiceEvents ? Array.from(voiceEvents) : []

  return getChatRuntimeDebugPanelsMobileRenderState({
    requestDebugText,
    voiceDebugEnabled,
    voiceEntryCount: resolvedVoiceEvents.length,
    voiceRows: [
      { key: "voice-debug-title", text: handsFreeCopy.debug.voiceDebugTitle },
      ...resolvedVoiceEvents.slice(0, 6).map((entry) => ({
        key: entry.id,
        text: formatVoiceDebugEntry(entry),
      })),
    ],
  })
}

export function getChatRuntimeInlineActivityMobileState() {
  return CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity
}

export function getChatRuntimeInlineActivityMobileRenderState({
  isResponding = false,
  message,
}: ChatRuntimeInlineActivityMobileRenderStateInput = {}): ChatRuntimeInlineActivityMobileRenderState {
  const surface = getChatRuntimeInlineActivityMobileState()
  const shouldRender = isResponding === true &&
    message?.role === "assistant" &&
    !hasChatMessageDisplayContent(message.content) &&
    (message.toolCalls?.length ?? 0) === 0 &&
    (message.toolResults?.length ?? 0) === 0

  return {
    shouldRender,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: CHAT_RUNTIME_PRESENTATION.activity.thinkingAccessibilityLabel,
    accessibilityState: surface.accessibilityState,
    spinnerResizeMode: surface.spinnerResizeMode,
  }
}

export function getChatRuntimeInlineActivityMobileIndicatorState<TSpinnerSource>({
  spinnerSource,
  ...input
}: ChatRuntimeInlineActivityMobileIndicatorStateInput<TSpinnerSource>): ChatRuntimeInlineActivityMobileIndicatorState<TSpinnerSource> {
  const renderState = getChatRuntimeInlineActivityMobileRenderState(input)

  return renderState.shouldRender
    ? {
        renderState,
        spinnerSource,
      }
    : null
}

export function getChatRuntimeMobileActivityAccessibilityState(): ChatRuntimeMobileActivityAccessibilityState {
  return {
    loadingMessagesLabel: CHAT_RUNTIME_PRESENTATION.activity.loadingMessagesAccessibilityLabel,
    loadingAgentActivityLabel: CHAT_RUNTIME_PRESENTATION.activity.loadingAgentActivityAccessibilityLabel,
    thinkingLabel: CHAT_RUNTIME_PRESENTATION.activity.thinkingAccessibilityLabel,
  }
}

export function formatChatRuntimeConnectionErrorMessage(
  errorMessage: string,
  recoveryState?: ChatRuntimeRecoveryStatePresentationInput | null,
): string {
  if (recoveryState?.status === "failed") {
    return `Connection failed after ${recoveryState.retryCount ?? 0} retries. ${recoveryState.lastError || ""}`.trim()
  }

  if (recoveryState?.status === "reconnecting") {
    return `Connection lost. Attempted ${recoveryState.retryCount ?? 0} reconnections. ${errorMessage}`.trim()
  }

  return errorMessage
}

export function formatChatRuntimeAssistantErrorContent(
  errorMessage: string,
  partialContent?: string | null,
): string {
  if (partialContent && partialContent.length > 0) {
    return [
      partialContent,
      "",
      "---",
      CHAT_RUNTIME_PRESENTATION.connectionError.partialContentMessage,
      "",
      `Error: ${errorMessage}`,
    ].join("\n")
  }

  return `Error: ${errorMessage}\n\n${CHAT_RUNTIME_PRESENTATION.connectionError.retryTip}`
}

export function deriveLifecycleState(input: SessionPresentationInput): SessionLifecycleState {
  const status = input.sessionStatus

  if (input.pendingToolApproval) return "needs_input"
  if (input.hasErrors || input.wasStopped || status === "error" || status === "stopped") return "blocked"
  if (input.isComplete || status === "completed" || status === "complete") return "complete"

  const fallback: SessionLifecycleState = "running"

  return input.conversationState
    ? normalizeAgentConversationState(input.conversationState, fallback)
    : fallback
}

export function deriveAttentionState(input: SessionPresentationInput): SessionAttentionState {
  const lifecycleState = deriveLifecycleState(input)
  const hasForegroundAttention = !!(
    input.isCurrentView ||
    input.isFocused ||
    input.isSessionExpanded ||
    input.hasActiveChildProgress ||
    input.hasUnreadResponse ||
    input.hasAnalyzingOrPlanningProgress ||
    input.hasForegroundActivity ||
    input.hasRecentFinalResponse
  )

  if (lifecycleState !== "running") return hasForegroundAttention ? "foreground" : "background"
  if (!input.isSnoozed || hasForegroundAttention) return "foreground"
  return "background"
}

export function getSessionPresentation(input: SessionPresentationInput): SessionPresentation {
  const lifecycleState = deriveLifecycleState(input)
  const attentionState = deriveAttentionState(input)
  const intent: SessionPresentationIntent = lifecycleState === "needs_input"
    ? "warning"
    : lifecycleState === "blocked"
      ? "danger"
      : lifecycleState === "complete"
        ? "success"
        : attentionState === "background"
          ? "background"
          : "active"
  const label = lifecycleState === "running" && input.isSnoozed
    ? "Running in background"
    : getAgentConversationStateLabel(lifecycleState)
  const badgeClassName = intent === "success"
    ? "border-green-500 text-green-700 dark:border-green-700 dark:text-green-300"
    : intent === "warning"
      ? "border-amber-500 text-amber-700 dark:border-amber-700 dark:text-amber-300"
      : intent === "danger"
        ? "border-red-500 text-red-700 dark:border-red-700 dark:text-red-300"
        : intent === "background"
          ? "border-muted-foreground/40 text-muted-foreground"
          : "border-blue-500 text-blue-700 dark:border-blue-700 dark:text-blue-300"

  return { lifecycleState, attentionState, intent, label, badgeClassName }
}

function getSessionStatusMobileIntentColors(
  intent: SessionPresentationIntent,
  colors: ChatSessionStatusMobileColorPalette,
): ChatSessionStatusMobileColors {
  const intentSurface = CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.intents[intent]
  const color = colors[intentSurface.colorToken]

  return {
    backgroundColor: hexToRgba(color, intentSurface.backgroundAlpha),
    borderColor: hexToRgba(color, intentSurface.borderAlpha),
    textColor: color,
  }
}

export function getSessionStatusMobileColors(
  input: SessionPresentationInput,
  colors: ChatSessionStatusMobileColorPalette,
): ChatSessionStatusMobileColors {
  const { intent } = getSessionPresentation(input)

  return getSessionStatusMobileIntentColors(intent, colors)
}

export function getChatSessionStatusMobileStyleState(
  colors: ChatSessionStatusMobileColors,
): ChatSessionStatusMobileStyleState {
  return {
    chip: {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
    },
    text: {
      color: colors.textColor,
    },
  }
}

export function createChatSessionStatusMobileChromeStyleSlots({
  surface,
}: ChatSessionStatusMobileChromeStyleSlotsInput): ChatSessionStatusMobileChromeStyleSlots {
  return {
    chip: {
      flexDirection: surface.chip.flexDirection,
      alignItems: surface.chip.alignItems,
      gap: surface.chip.gap,
      borderWidth: surface.chip.borderWidth,
      borderRadius: surface.chip.borderRadius,
      paddingHorizontal: surface.chip.paddingHorizontal,
      paddingVertical: surface.chip.paddingVertical,
      marginHorizontal: surface.chip.marginHorizontal,
    },
    text: {
      fontSize: surface.chipText.fontSize,
      lineHeight: surface.chipText.lineHeight,
      fontWeight: surface.chipText.fontWeight,
    },
    spinner: {
      width: surface.runningIndicator.size,
      height: surface.runningIndicator.size,
    },
  }
}

export function getSessionStatusMobileSurfaceState() {
  return CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile
}

export function getSessionStatusDesktopSurfaceState() {
  return CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop
}

export function getSessionStatusDesktopRenderState(
  presentation: SessionPresentation,
): ChatSessionStatusDesktopRenderState {
  const surface = getSessionStatusDesktopSurfaceState()

  if (presentation.lifecycleState === "needs_input") {
    return {
      kind: "needs_input",
      iconClassName: surface.iconClassNames.needsInput,
      loadingSpinnerClassName: surface.loadingSpinnerClassName,
    }
  }

  if (presentation.lifecycleState === "blocked") {
    return {
      kind: "blocked",
      iconClassName: surface.iconClassNames.blocked,
      loadingSpinnerClassName: surface.loadingSpinnerClassName,
    }
  }

  if (presentation.lifecycleState === "running" && presentation.attentionState === "background") {
    return {
      kind: "background",
      iconClassName: surface.iconClassNames.background,
      loadingSpinnerClassName: surface.loadingSpinnerClassName,
    }
  }

  if (presentation.lifecycleState === "running") {
    return {
      kind: "running",
      iconClassName: "",
      loadingSpinnerClassName: surface.loadingSpinnerClassName,
    }
  }

  return {
    kind: "complete",
    iconClassName: surface.iconClassNames.complete,
    loadingSpinnerClassName: surface.loadingSpinnerClassName,
  }
}

export function getSessionStatusMobileStyleRenderState({
  colors,
}: ChatSessionStatusMobileStyleRenderStateInput): ChatSessionStatusMobileStyleRenderState {
  const activeColors = getSessionStatusMobileIntentColors("active", colors)
  const backgroundColors = getSessionStatusMobileIntentColors("background", colors)
  const successColors = getSessionStatusMobileIntentColors("success", colors)
  const warningColors = getSessionStatusMobileIntentColors("warning", colors)
  const dangerColors = getSessionStatusMobileIntentColors("danger", colors)

  return {
    surface: getSessionStatusMobileSurfaceState(),
    colors: {
      active: activeColors,
      background: backgroundColors,
      success: successColors,
      warning: warningColors,
      danger: dangerColors,
    },
    styles: {
      active: getChatSessionStatusMobileStyleState(activeColors),
      background: getChatSessionStatusMobileStyleState(backgroundColors),
      success: getChatSessionStatusMobileStyleState(successColors),
      warning: getChatSessionStatusMobileStyleState(warningColors),
      danger: getChatSessionStatusMobileStyleState(dangerColors),
    },
  }
}

export function getSessionStatusMobileRenderState({
  session = null,
  colors,
}: ChatSessionStatusMobileRenderStateInput): ChatSessionStatusMobileRenderState {
  const surface = getSessionStatusMobileSurfaceState()
  const presentation = session ? getSessionPresentation(session) : null
  const resolvedColors = getSessionStatusMobileColors(session ?? {}, colors)
  const isRunning = presentation?.lifecycleState === "running"

  return {
    shouldRender: !!presentation,
    presentation,
    label: presentation?.label ?? "",
    surface,
    colors: resolvedColors,
    styles: getChatSessionStatusMobileStyleState(resolvedColors),
    isRunning,
    runningIndicator: {
      shouldRender: isRunning,
      size: surface.runningIndicator.size,
      resizeMode: surface.runningIndicator.resizeMode,
    },
  }
}

export function getFollowUpInputPresentation(input: SessionPresentationInput): FollowUpInputPresentation {
  const lifecycleState = deriveLifecycleState(input)
  const isActiveLifecycle = lifecycleState === "running" || lifecycleState === "needs_input"

  if (input.isInitializingSession) {
    return {
      mode: "initializing",
      placeholder: "",
      isDisabled: true,
      submitTitle: "Starting follow-up",
      submitAriaLabel: "Starting follow-up",
      submitHint: "Wait for the session to finish starting before sending a follow-up.",
      voiceTitle: "Voice unavailable while session starts",
    }
  }

  if (isActiveLifecycle && input.isQueueEnabled) {
    return {
      mode: "queue",
      placeholder: "Queue next message...",
      isDisabled: false,
      submitTitle: "Queue next message",
      submitAriaLabel: "Queue next message",
      submitHint: "Adds your message to the queue for this conversation.",
      voiceTitle: "Record voice message (will be queued)",
    }
  }

  if (isActiveLifecycle) {
    return {
      mode: "disabled",
      placeholder: "",
      isDisabled: true,
      submitTitle: "Agent is processing",
      submitAriaLabel: "Agent is processing",
      submitHint: "Wait for the agent to finish or enable message queueing before sending another message.",
      voiceTitle: "Voice unavailable while agent is processing",
    }
  }

  return {
    mode: "send",
    placeholder: "Continue conversation...",
    isDisabled: false,
    submitTitle: "Send message",
    submitAriaLabel: "Send message",
    submitHint: "Sends your message to the selected agent.",
    voiceTitle: "Continue with voice",
  }
}

export function getSidebarStatusPresentation(input: SessionPresentationInput): SidebarStatusPresentation {
  const { lifecycleState, attentionState } = getSessionPresentation(input)
  if (lifecycleState === "needs_input") {
    return { lifecycleState, attentionState, intent: "needs_input", railClassName: "bg-amber-500", pinnedIconClassName: "text-amber-500", shouldPulse: false, isForeground: true }
  }
  if (lifecycleState === "blocked") {
    return { lifecycleState, attentionState, intent: "blocked", railClassName: "bg-red-500", pinnedIconClassName: "text-red-500", shouldPulse: false, isForeground: true }
  }
  if (input.hasRecentFinalResponse) {
    return { lifecycleState, attentionState, intent: "response", railClassName: "bg-emerald-500", pinnedIconClassName: "text-emerald-500", shouldPulse: false, isForeground: true }
  }
  if (lifecycleState === "complete") {
    return { lifecycleState, attentionState, intent: "success", railClassName: "bg-green-500", pinnedIconClassName: "text-green-500", shouldPulse: false, isForeground: false }
  }
  if (attentionState === "foreground") {
    return { lifecycleState, attentionState, intent: "active", railClassName: "bg-blue-500", pinnedIconClassName: "text-blue-500", shouldPulse: true, isForeground: true }
  }
  return { lifecycleState, attentionState, intent: "background", railClassName: "bg-muted-foreground/60", pinnedIconClassName: "text-muted-foreground", shouldPulse: false, isForeground: false }
}
