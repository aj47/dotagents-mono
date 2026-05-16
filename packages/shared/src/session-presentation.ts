import {
  getAgentConversationStateLabel,
  normalizeAgentConversationState,
  type AgentConversationState,
} from "./conversation-state"
import {
  applyUserResponseToChatMessages,
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
import {
  getAgentDelegationCardState,
  type ACPDelegationProgress,
  type AgentProgressUpdate,
  type AgentUserResponseEvent,
  type AgentDelegationConversationPreviewRow,
  type AgentDelegationPresentation,
} from "./agent-progress"
import { hexToRgba } from "./colors"
import { formatConnectionStatus, type RecoveryState } from "./connection-recovery"
import { normalizeMarkdownThoughtContent } from "./markdown-render-parts"
import {
  getHandsFreeComposerCopyState,
  getHandsFreeComposerMobileSurfaceRenderState,
  getHandsFreeMicButtonLabel,
  type HandsFreeComposerMobileSurfaceColorPalette,
} from "./hands-free-controller"
import {
  buildChatImageAttachmentMessage,
  getDataImageBytesFromUrl,
  getDecodedBase64ByteLength,
  getChatImageAttachmentMobileRenderState,
  inferImageMimeTypeFromSource,
  type ChatImageAttachmentMessageInput,
  type ChatImageAttachmentMobileSurfaceColorPalette,
  type ImageMimeTypeSource,
  MAX_CHAT_IMAGE_ATTACHMENTS,
  MAX_CHAT_IMAGE_FILE_BYTES,
  MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
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
import type { PredefinedPromptSummary } from "./api-types"
import type { ToolCall, ToolResult } from "./types"
import { formatVoiceDebugEntry, type VoiceDebugEntry } from "./voice-debug-log"
import {
  CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION,
  getChatDisplayExpansionState,
  getChatMessageActionCopyState,
  getChatMessageActionAvailabilityRenderState,
  getChatMessageActionLayoutRenderState,
  getChatMessageActionMobileIconColors,
  getChatMessageActionMobileStyleRenderState,
  getChatMessageActionMobileTurnDurationBadgeColors,
  getChatMessageActionMobileTurnDurationBadgeState,
  getChatMessageCopyMobileRenderState,
  getChatMessageMobileRenderState,
  getChatMessageSpeechMobileRenderState,
  findLastChatMessageConversationContentIndex,
  hasChatMessageDisplayContent,
  isChatMessageConversationContent,
  isChatMessageLiveStreamingConversationContent,
  setChatDisplayExpansionState,
  shouldShowChatMessageTurnDurationBadge,
  type ChatMessageActionAvailabilityRenderState,
  type ChatMessageActionLayoutState,
  type ChatDisplayExpansionStateMap,
  type ChatMessageConversationContentLike,
  type ChatMessageContentRenderState,
  type ChatMessageActionMobileColors,
  type ChatMessageActionMobileColorPalette,
  type ChatMessageCopyMobileRenderState,
  type ChatMessageCopyMobileRenderStateInput,
  type ChatMessageMobileRenderColorPalette,
  type ChatMessageSpeechMobileRenderState,
  type ChatMessageSpeechMobileRenderStateInput,
} from "./message-display-utils"
import {
  createButtonAccessibilityLabel,
  createMicControlAccessibilityHint,
  createMicControlAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
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
  type ToolExecutionDetailMobileCopyButtonRenderState,
  type ToolExecutionDetailCopyFailureAlertState,
  type ToolExecutionDetailMobileHeaderRenderState,
  type ToolExecutionDetailMobilePendingResultRenderState,
  type ToolExecutionDetailMobileSectionHeaderRenderState,
  type ToolExecutionResultOnlyFallbackRenderState,
  type ToolExecutionSurfaceColorPalette,
} from "./tool-execution-display"
import {
  getToolActivityGroupMobileRenderState,
  getToolActivityGroupMobileSurfaceRenderState,
  type ToolActivityGroup,
  type ToolActivityGroupMobileColorPalette,
  type ToolActivityGroupMobileRenderState,
  type ToolActivityGroupMobileRenderStateInput,
} from "./tool-activity-grouping"
import {
  getMessageQueuePanelMobileDockRenderState,
  getMessageQueuePanelMobileWrapperRenderState,
  type MessageQueuePanelMobileDockRenderState,
  type MessageQueuePanelMobileDockRenderStateInput,
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

export type ChatRuntimeConversationDelegationExpansionSetter = (
  updater: (
    current: ChatDisplayExpansionStateMap<string>,
  ) => ChatDisplayExpansionStateMap<string>,
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
  expandedDelegationConversationPreviews: ChatDisplayExpansionStateMap<string>
  expandedDelegationToolPreviews: ChatDisplayExpansionStateMap<string>
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
  expandedDelegationConversationPreviews: ChatDisplayExpansionStateMap<string>
  expandedDelegationToolPreviews: ChatDisplayExpansionStateMap<string>
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
  expandedDelegationConversationPreviews: ChatDisplayExpansionStateMap<string>
  expandedDelegationToolPreviews: ChatDisplayExpansionStateMap<string>
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
  actionAvailability: ChatComposerMobileActionAvailabilityRenderState
  visibility: ChatComposerMobileVisibilityRenderState
  imageAttachment: ChatComposerImageAttachmentMobileRenderState
  textToSpeech: ChatComposerTextToSpeechMobileRenderState
  editBeforeSend: ChatComposerEditBeforeSendMobileRenderState
  queueAction: ChatComposerQueueMobileRenderState
  submitAction: ChatComposerSubmitMobileRenderState
  micButton: ChatComposerMicMobileRenderState
}

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
    toolRowClassName: "mb-2 flex flex-wrap items-center gap-2",
    toolLabelClassName: "shrink-0 text-xs text-amber-700 dark:text-amber-300",
    toolNameClassName: "max-w-full min-w-0 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
    argumentsPreviewClassName: "mb-2 rounded-md border border-amber-200/70 bg-amber-100/40 px-2 py-1.5 text-[11px] font-mono leading-relaxed text-amber-700/80 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300/80 line-clamp-2 break-words [overflow-wrap:anywhere]",
    expandButtonClassName: "inline-flex max-w-full items-center gap-1 text-left text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200",
    actionStackClassName: "space-y-1.5",
    actionRowClassName: "flex flex-wrap items-center gap-2",
    denyButtonClassName: "h-7 min-w-[7rem] flex-1 border-red-300 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30",
    approveButtonClassName: "h-7 min-w-[7rem] flex-1 text-xs text-white",
    approveButtonReadyClassName: "bg-green-600 hover:bg-green-700",
    approveButtonProcessingClassName: "cursor-not-allowed bg-green-500",
    hotkeysRowClassName: "flex flex-wrap items-center gap-1.5 text-[10px] text-amber-700/80 dark:text-amber-300/80",
    hotkeysLabelClassName: "shrink-0 font-medium uppercase tracking-wider opacity-70",
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

export function getChatRuntimeCurrentAgentLabel(agentName?: string | null): string {
  const normalizedName = typeof agentName === "string" ? agentName.trim() : ""
  return normalizedName || CHAT_RUNTIME_PRESENTATION.header.defaultAgentLabel
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
  const copy = CHAT_RUNTIME_PRESENTATION.approval
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
    copy,
    surface,
    colors: getChatRuntimeToolApprovalMobileSurfaceColors(colors),
    title: isResponding ? copy.processingTitle : copy.title,
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
      label: isArgumentsExpanded ? copy.hideArgumentsLabel : copy.viewArgumentsLabel,
      isDisabled: isResponding,
      accessibilityRole: surface.argumentsToggle.accessibilityRole,
      accessibilityLabel: getChatRuntimeToolApprovalArgumentsAccessibilityLabel(toolName, isArgumentsExpanded),
      accessibilityState: {
        expanded: isArgumentsExpanded,
        disabled: isResponding,
      },
      ariaExpanded: isArgumentsExpanded,
      pressedOpacity: surface.argumentsToggle.pressedOpacity,
      icon: {
        name: argumentsToggleIcon.name,
        size: argumentsToggleIcon.size,
        color: argumentsToggleIconColors.color,
      },
    },
    approveButton: {
      label: isResponding ? copy.processingLabel : copy.approveLabel,
      isDisabled: isResponding,
      accessibilityRole: surface.button.accessibilityRole,
      accessibilityLabel: getChatRuntimeToolApprovalAccessibilityLabel("approve", toolName),
      accessibilityState: { disabled: isResponding },
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
      label: copy.denyLabel,
      isDisabled: isResponding,
      accessibilityRole: surface.button.accessibilityRole,
      accessibilityLabel: getChatRuntimeToolApprovalAccessibilityLabel("deny", toolName),
      accessibilityState: { disabled: isResponding },
      icon: {
        name: denyIcon.name,
        size: denyIcon.size,
        color: denyIconColors.color,
      },
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

export function getChatRuntimeStreamingContentTitle(isStreaming: boolean): string {
  return isStreaming
    ? CHAT_RUNTIME_PRESENTATION.streamingContent.generatingTitle
    : CHAT_RUNTIME_PRESENTATION.streamingContent.responseTitle
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

function formatChatRuntimeImportanceLabel(importance: NonNullable<ChatRuntimeStepSummaryLike["importance"]>): string {
  return `${importance.charAt(0).toUpperCase()}${importance.slice(1)} ${CHAT_RUNTIME_PRESENTATION.stepSummary.importanceSuffix}`
}

export function formatChatRuntimeStepSummaryMeta(summary: ChatRuntimeStepSummaryLike): string {
  const parts = [`${CHAT_RUNTIME_PRESENTATION.stepSummary.stepLabel} ${summary.stepNumber}`]

  if (summary.importance) {
    parts.push(formatChatRuntimeImportanceLabel(summary.importance))
  }

  const findingCount = summary.keyFindings?.length ?? 0
  if (findingCount > 0) {
    parts.push(`${findingCount} ${findingCount === 1
      ? CHAT_RUNTIME_PRESENTATION.stepSummary.keyFindingSingular
      : CHAT_RUNTIME_PRESENTATION.stepSummary.keyFindingPlural}`)
  }

  return parts.join(" · ")
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

export function getChatRuntimeRetryStatusMobileRenderState({
  retryInfo,
  colors,
}: ChatRuntimeRetryStatusMobileRenderStateInput): ChatRuntimeRetryStatusMobileRenderState {
  const surface = getChatRuntimeRetryStatusMobileState()
  const resolvedColors = getChatRuntimeRetryStatusMobileColors(colors)
  const icon = getChatRuntimeRetryStatusMobileIconState()
  const shouldRender = !!retryInfo

  return {
    shouldRender,
    surface,
    colors: resolvedColors,
    title: retryInfo?.reason ?? "",
    attemptLabel: retryInfo ? formatChatRuntimeRetryAttemptLabel(retryInfo) : "",
    countdownLabel: retryInfo ? formatChatRuntimeRetryCountdownLabel(retryInfo.delaySeconds) : "",
    description: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: retryInfo ? formatChatRuntimeRetryAccessibilityLabel(retryInfo) : "",
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

  return {
    shouldRender: !!summary,
    surface,
    colors: resolvedColors,
    title: CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle,
    badgeLabel: summary ? formatChatRuntimeStepSummaryTitle(summary) : "",
    actionSummary: summary?.actionSummary ?? "",
    meta: summary ? formatChatRuntimeStepSummaryMeta(summary) : "",
    preview: summary ? formatChatRuntimeStepSummaryPreview(summary) : "",
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: summary ? formatChatRuntimeStepSummaryAccessibilityLabel(summary) : "",
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
  const title = getChatRuntimeStreamingContentTitle(isStreaming)

  return {
    shouldRender: isStreaming,
    surface,
    colors: resolvedColors,
    title,
    accessibilityRole: surface.accessibilityRole,
    accessibilityLabel: title,
    badgeLabel: CHAT_RUNTIME_PRESENTATION.streamingContent.streamingBadgeLabel,
    content: content ?? "",
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
  const safeVisibleCount = Math.max(0, visibleCount)
  const safeTotalCount = Math.max(0, totalCount)
  const safeHiddenCount = Math.max(0, hiddenCount ?? safeTotalCount - safeVisibleCount)
  const shouldRender = safeHiddenCount > 0
  const loadEarlierLabel = shouldRender
    ? formatChatRuntimeLoadEarlierLabel(safeHiddenCount, loadIncrement, isLoadingEarlier)
    : ""

  return {
    shouldRender,
    surface,
    colors: resolvedColors,
    summaryLabel: shouldRender
      ? formatChatRuntimeConversationHistorySummary(safeVisibleCount, safeTotalCount, { includeScrollHint })
      : "",
    loadButton: {
      accessibilityRole: surface.loadButton.accessibilityRole,
      accessibilityLabel: loadEarlierLabel,
      label: loadEarlierLabel,
      icon: {
        name: loadIcon.name,
        size: loadIcon.size,
        color: resolvedColors.loadIcon.color,
      },
      pressedOpacity: surface.loadButton.pressedOpacity,
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
