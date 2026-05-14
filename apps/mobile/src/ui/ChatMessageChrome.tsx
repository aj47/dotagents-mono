import { Fragment, type ComponentProps, type Dispatch, type ReactNode, type Ref, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type ImageStyle,
  type Insets,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getChatDisplayExpansionState,
  getChatMessageActionCopyState,
  getChatMessageActionAvailabilityRenderState,
  getChatMessageActionMobileButtonState,
  getChatMessageActionLayoutRenderState,
  getChatMessageCopyMobileRenderState,
  getChatMessageMobileRenderState,
  getChatMessageSpeechMobileRenderState,
  findLastChatMessageConversationContentIndex,
  isChatMessageLiveStreamingConversationContent,
  setChatDisplayExpansionState,
  type ChatDisplayExpansionStateMap,
  type ChatMessageConversationContentLike,
  type ChatMessageActionAvailabilityRenderState,
  type ChatMessageActionLayoutStateInput,
  type ChatMessageActionSlot,
  type ChatMessageCollapsedPreviewMobileActionState,
  type ChatMessageContentRenderState,
  type ChatMessageCopyMobileRenderState,
  type ChatMessageExpansionMobileRenderState,
  type ChatMessageSpeechMobileRenderState,
} from '@dotagents/shared/message-display-utils';
import {
  getChatMessageDisplayState,
  getCompactToolExecutionPreview,
  hasVisibleChatMessageContent,
  type ChatMessageDisplayStateMessageLike,
  type ChatMessageDisplayToolEntry,
} from '@dotagents/shared/chat-utils';
import {
  getAgentDelegationCardState,
  type ACPDelegationProgress,
  type AgentRetryInfo,
  type AgentDelegationConversationPreviewRow,
  type AgentDelegationPresentation,
} from '@dotagents/shared/agent-progress';
import type { AgentConversationState } from '@dotagents/shared/conversation-state';
import {
  getChatImageAttachmentMobileAlertState,
  getChatImageAttachmentMobileRenderState,
  type ChatImageAttachmentMobileAlertInput,
  type ChatImageAttachmentMobileRenderState,
} from '@dotagents/shared/conversation-media-assets';
import {
  formatHandsFreeRecognizerErrorDebugMessage,
  formatHandsFreeSleepingDebugMessage,
  getHandsFreeComposerControlState,
  getHandsFreeComposerCopyState,
  getHandsFreeComposerMobileSurfaceRenderState,
  getHandsFreeComposerPlaceholder,
  getHandsFreeMicButtonLabel,
  getHandsFreeStatusSubtitle,
  type HandsFreeComposerControlState,
} from '@dotagents/shared/hands-free-controller';
import {
  formatVoiceDebugEntry,
  type VoiceDebugEntry,
} from '@dotagents/shared/voice-debug-log';
import {
  createChatComposerAccessibilityHint,
  createMinimumTouchTargetStyle,
  createVoiceInputLiveRegionAnnouncement,
} from '@dotagents/shared/accessibility-utils';
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
  getPromptLibraryMobileCopyState,
  getPromptLibraryMobileSurfaceRenderState,
  getPromptLibraryMobileShortcutEmptyRenderState,
  getPromptLibraryMobileShortcutItemRenderState,
  getPromptLibraryMobileShortcutRenderState,
  getPromptLibrarySaveSuccessMessage,
  getPromptLibraryShortcutPressIntent,
  type PromptLibraryEditorMobileRenderState,
  type PromptLibraryLauncherShortcutSource,
  type PromptLibrarySkillLike,
  type PromptLibraryMobileShortcutRenderState,
  type PromptLibraryShortcutPressIntent,
  type PromptLibraryShortcutItem,
  type PromptLibraryTaskLike,
} from '@dotagents/shared/predefined-prompts';
import {
  getMessageQueuePanelMobileDockRenderState,
  getMessageQueuePanelMobileWrapperRenderState,
} from '@dotagents/shared/message-queue-utils';
import type { PredefinedPromptSummary } from '@dotagents/shared/api-types';
import {
  getToolActivityGroupMobileRenderState,
  getToolActivityGroupMobileSurfaceRenderState,
  type ToolActivityGroup,
  type ToolActivityGroupMobileRenderState,
  type ToolActivityGroupMobileRenderStateInput,
} from '@dotagents/shared/tool-activity-grouping';
import {
  formatConnectionStatus,
  type RecoveryState,
} from '@dotagents/shared/connection-recovery';
import {
  getChatComposerEditBeforeSendMobileRenderState,
  getChatComposerImageAttachmentMobileRenderState,
  getChatComposerMicMobileRenderState,
  getChatComposerMobileActionAvailabilityRenderState,
  getChatComposerMobileControlState,
  getChatComposerMicMobileWebPressStyleState,
  getChatComposerMobileSurfaceRenderState,
  getChatComposerMobileSurfaceState,
  getChatComposerMobileVisibilityRenderState,
  getChatComposerQueueMobileActionState,
  getChatComposerQueueMobileRenderState,
  getChatComposerSubmitMobileRenderState,
  getChatComposerTextToSpeechMobileRenderState,
  getChatComposerVoiceOverlayLabel,
  formatChatRuntimeActivityContent,
  formatChatRuntimeAssistantErrorContent,
  formatChatRuntimeAssistantFeedbackContent,
  formatChatRuntimeConnectionErrorMessage,
  formatChatRuntimeDebugError,
  formatChatRuntimeDelegationAccessibilityLabel,
  formatChatRuntimeDelegationMessageCount,
  formatChatRuntimeDelegationToolCallActivityLabel,
  formatChatRuntimeStartingRequestDebugMessage,
  formatChatRuntimeToolApprovalRequiredContent,
  formatChatRuntimeWebConfirmMessage,
  getChatRuntimeAlertMessage,
  getChatRuntimeDelegationCardMobileRenderState,
  getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots,
  getChatRuntimeDelegationConversationPreviewMoreActionState,
  getChatRuntimeDelegationStatusMobileRenderState,
  getChatRuntimeDelegationToolPreviewMoreActionState,
  getChatRuntimeBranchMobileRenderState,
  getChatRuntimeConnectionBannerMobileRenderState,
  getChatRuntimeConversationChromeMobileStyleRenderState,
  getChatRuntimeInlineActivityMobileRenderState,
  getChatRuntimeLoadingStateMobileRenderState,
  getChatRuntimeHomeQuickStartsMobileRenderState,
  getChatRuntimeLatestStepSummary,
  getChatRuntimeMessageHistoryBannerMobileRenderState,
  getChatRuntimeMessageHistoryWindowMobileState,
  getChatRuntimeMessageThreadMobileStyleRenderState,
  getChatRuntimeMobileSafeAreaLayoutState,
  getChatRuntimeRetryStatusMobileRenderState,
  getChatRuntimeScrollToBottomMobileRenderState,
  getChatRuntimeStreamingContentMobileRenderState,
  getChatRuntimeStepSummaryMobileRenderState,
  getChatRuntimeToolApprovalMobileRenderState,
  getChatRuntimeTurnDurationMessageMobileRenderState,
  getChatRuntimeViewportMobileKeyboardAvoidingBehavior,
  getChatRuntimeViewportMobileRenderState,
  getChatRuntimeAgentSelectorMobileRenderState,
  getChatRuntimeBackMobileRenderState,
  getChatRuntimeCurrentAgentLabel,
  getChatRuntimeBranchMobileAlertState,
  getChatRuntimeDebugPanelsMobileRenderState,
  getChatRuntimeDebugState,
  getChatRuntimeHandsFreeMobileRenderState,
  getChatRuntimeHeaderChromeMobileStyleRenderState,
  getChatRuntimeHeaderMobileSurfaceState,
  getChatRuntimeKillSwitchMobileAlertState,
  getChatRuntimeKillSwitchMobileRenderState,
  getChatRuntimeKillSwitchMobileVisibilityRenderState,
  getChatRuntimePinMobileRenderState,
  getChatRuntimeToolApprovalMobileAlertState,
  getChatRuntimeTurnDurationHeaderMobileRenderState,
  getFollowUpInputPresentation,
  getSessionStatusMobileRenderState,
  type ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots,
  type ChatRuntimeDelegationMorePreviewActionState,
  type ChatRuntimeAgentSelectorMobileRenderState,
  type ChatRuntimeActivityStepLike,
  type ChatRuntimeBackMobileRenderState,
  type ChatRuntimeBranchMobileRenderState,
  type ChatRuntimeConnectionBannerMobileRenderState,
  type ChatRuntimeConnectionBannerMobileRenderStateInput,
  type ChatRuntimeHandsFreeMobileRenderState,
  type ChatRuntimeKillSwitchMobileRenderState,
  type ChatRuntimeMessageHistoryBannerMobileRenderState,
  type ChatRuntimePinMobileRenderState,
  type ChatRuntimeScrollToBottomMobileRenderState,
  type ChatRuntimeScrollToBottomMobileRenderStateInput,
  type ChatRuntimeStepSummaryLike,
  type ChatRuntimeStepSummaryMobileRenderState,
  type ChatRuntimeToolApprovalMobileRenderState,
  type ChatRuntimeTurnDurationHeaderMobileRenderState,
  type ChatRuntimeDelegationCardMobileRenderState,
  type ChatRuntimeDebugPanelsMobileRenderState,
  type ChatRuntimeInlineActivityMobileRenderState,
  type ChatRuntimeInlineActivityMobileMessageLike,
  type ChatRuntimeLoadingStateMobileRenderState,
  type ChatRuntimeHomeQuickStartsMobileRenderState,
  type ChatSessionStatusMobileRenderState,
  type ChatSessionStatusMobileStyleState,
  type FollowUpInputPresentation,
} from '@dotagents/shared/session-presentation';
import {
  getToolExecutionCallDisplayState,
  getToolExecutionCompactMobileStyleRenderState,
  getToolExecutionCompactMobileRenderState,
  getToolExecutionDetailArgumentsState,
  getToolExecutionDetailCopyFailureAlertState,
  getToolExecutionDetailMobileCollapseControlRenderState,
  getToolExecutionDetailMobileCopyButtonRenderState,
  getToolExecutionDetailMobileEmptyStateRenderState,
  getToolExecutionDetailMobileExpandControlRenderState,
  getToolExecutionDetailMobileHeaderRenderState,
  getToolExecutionDetailMobilePendingResultRenderState,
  getToolExecutionDetailMobileSectionHeaderRenderState,
  getToolExecutionDetailMobileStyleRenderState,
  getToolExecutionDetailResultState,
  getToolExecutionMobileVisibilityRenderState,
  getToolExecutionResultOnlyFallbackRenderState,
  getToolExecutionSummaryDisplayState,
  type ToolExecutionCompactMobileRenderState,
  type ToolExecutionDetailMobileCollapseControlRenderState,
  type ToolExecutionDetailMobileCopyButtonRenderState,
  type ToolExecutionDetailMobileEmptyStateRenderState,
  type ToolExecutionDetailMobileExpandControlRenderState,
  type ToolExecutionDetailMobileHeaderRenderState,
  type ToolExecutionDetailMobilePendingResultRenderState,
  type ToolExecutionDetailMobileSectionHeaderRenderState,
} from '@dotagents/shared/tool-execution-display';
import { AgentSelectorSheet } from './AgentSelectorSheet';
import { HandsFreeStatusChip } from './HandsFreeStatusChip';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageQueuePanel } from './MessageQueuePanel';
import { ResponseHistoryPanel } from './ResponseHistoryPanel';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ChatComposerTextEntryRef = TextInput;
export type ChatComposerTextEntryKeyPressEvent = Parameters<NonNullable<ComponentProps<typeof TextInput>['onKeyPress']>>[0];
export type ChatComposerImageAttachmentAlertInput = ChatImageAttachmentMobileAlertInput;
export type ChatMessageScrollViewportRef = ScrollView;
export type ChatMessageScrollEvent = Parameters<NonNullable<ComponentProps<typeof ScrollView>['onScroll']>>[0];

export interface ChatMessageRuntimeKillSwitchResultLike {
  success: boolean;
  message?: string | null;
  error?: string | null;
}

export interface ChatMessageRuntimeKillSwitchResolvedAlertState {
  title: string;
  message: string;
  webMessage: string;
}

export interface ChatMessageRuntimeKillSwitchConfirmationAlertState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  webMessage: string;
}

export interface ChatMessageRuntimeResolvedAlertState {
  title: string;
  message: string;
}

export interface ChatConversationHomePromptDeleteConfirmAlertState extends ChatMessageRuntimeResolvedAlertState {
  cancelLabel: string;
  deleteLabel: string;
  webMessage: string;
}

type ChatMessageActionIcon = {
  name: IoniconName;
  size: number;
  color: string;
  isPending?: boolean;
};

type ChatMessageActionIconButtonProps = {
  icon: ChatMessageActionIcon;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  isActive?: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  ariaExpanded?: boolean;
  hitSlop?: number | Insets;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
};

type ChatMessageActionButtonRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  ariaExpanded?: boolean;
  isDisabled?: boolean;
  icon: ChatMessageActionIcon;
};

type ChatMessageActionButtonSpec = {
  renderState: ChatMessageActionButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  hitSlop?: number | Insets;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
  isActive?: boolean;
};

type ChatMessageSpeechActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageSpeechMobileRenderState;
};

type ChatMessageBranchActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatRuntimeBranchMobileRenderState;
};

type ChatMessageCopyActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageCopyMobileRenderState;
};

type ChatMessageBranchActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive' | 'onPress'>
  & Parameters<typeof getChatRuntimeBranchMobileRenderState>[0]
  & {
    onBranchMessage?: (messageIndex: number) => void;
  };

type ChatMessageSpeechActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & Omit<Parameters<typeof getChatMessageSpeechMobileRenderState>[0], 'isVisible'>;

type ChatMessageCopyActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & Parameters<typeof getChatMessageCopyMobileRenderState>[0];

type ChatMessageExpansionActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageExpansionMobileRenderState;
};

type ChatMessageExpansionActionSpecInput = Omit<ChatMessageExpansionActionSpec, 'renderState'>;

type ChatMessageTurnDurationActionSpec = ChatMessageTurnDurationBadgeProps;

type ChatMessageTurnDurationActionSpecInput =
  Omit<ChatMessageTurnDurationActionSpec, 'renderState'>
  & Parameters<typeof getChatRuntimeTurnDurationMessageMobileRenderState>[0];

type ChatMessageActionComponentsInput = {
  availability: ChatMessageActionAvailabilityRenderState;
  turnDuration: ChatMessageTurnDurationActionSpec;
  speech: ChatMessageSpeechActionSpec;
  branch: ChatMessageBranchActionSpec;
  copy: ChatMessageCopyActionSpec;
  expansion: ChatMessageExpansionActionSpec;
};

type ChatMessageActionSetInput = Omit<
  ChatMessageActionComponentsInput,
  'availability' | 'turnDuration' | 'speech' | 'branch' | 'copy' | 'expansion'
> & {
  messageRenderState: ChatMessageMobileRenderState;
  turnDuration: ChatMessageTurnDurationActionSpecInput;
  speech: ChatMessageSpeechActionSpecInput;
  branch: ChatMessageBranchActionSpecInput;
  copy: ChatMessageCopyActionSpecInput;
  expansion: ChatMessageExpansionActionSpecInput;
};

type ChatMessageCopyFeedbackState = {
  feedbackResetDelayMs: number;
  failedTitle: string;
  failedMessage: string;
};

type ChatMessageMobileRenderState = ReturnType<typeof getChatMessageMobileRenderState>;

type ChatMessageRenderStateInput =
  Omit<Parameters<typeof getChatMessageMobileRenderState>[0], 'hasErrors'>
  & {
    toolEntries: readonly Pick<ChatMessageDisplayToolEntry, 'result'>[];
  };

type ChatMessageConversationRenderContextInput = {
  message: ChatMessageDisplayStateMessageLike & ChatMessageConversationContentLike;
  messageIndex: number;
  isResponding: boolean;
  lastConversationContentMessageIndex: number;
  expandedMessages: ChatDisplayExpansionStateMap<number>;
  resultOnlyToolLabel: string;
  colors: Parameters<typeof getChatMessageMobileRenderState>[0]['colors'];
};

type ChatMessageConversationRenderContext = {
  visibleMessageContent: string;
  renderedToolEntries: readonly ChatMessageDisplayToolEntry[];
  displayToolCallCount: number;
  isExpanded: boolean;
  isLiveStreamingAssistantMessage: boolean;
  messageRenderState: ChatMessageMobileRenderState;
  shouldRenderSurface: boolean;
};

type ChatMessageConversationToolActivityGroupRenderStateInput =
  Omit<ToolActivityGroupMobileRenderStateInput, 'group'>
  & {
    group?: ToolActivityGroup | null;
  };

export type ChatMessageActionSet = {
  components: Record<ChatMessageActionSlot, ReactNode>;
  visibleSlots: ChatMessageActionSlot[];
  shouldRenderStandaloneActions: boolean;
};

type ChatMessageActionStyleSlots = {
  turnDuration: Pick<
    ChatMessageTurnDurationActionSpec,
    'style' | 'liveStyle' | 'textStyle' | 'liveTextStyle'
  >;
  speech: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'activeStyle' | 'pressedStyle'>;
  branch: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'pressedStyle' | 'disabledStyle'>;
  copy: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'activeStyle' | 'pressedStyle'>;
  expansion: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'pressedStyle'>;
};

type ChatMessageConversationActionSetInput = {
  message: Pick<ChatMessageDisplayStateMessageLike, 'role'> & {
    branchMessageIndex?: number;
  };
  messageIndex: number;
  visibleMessageContent: string;
  turnDuration?: Pick<ChatMessageTurnDurationActionSpecInput, 'durationMs' | 'isLive'>;
  conversationId?: string;
  pendingBranchMessageIndex?: number | null;
  isResponding: boolean;
  isSpeaking: boolean;
  isCopied: boolean;
  ttsEnabled: boolean;
  colors: Parameters<typeof getChatMessageMobileRenderState>[0]['colors'];
  styles: ChatMessageActionStyleSlots;
  onSpeakMessage: (messageIndex: number, content: string) => void;
  onBranchMessage?: (messageIndex: number) => void;
  onCopyMessage: (messageIndex: number, content: string) => void | Promise<void>;
  onToggleMessageExpansion: (messageIndex: number) => void;
};

type ChatRuntimeHeaderAgentSelectorStyles = {
  button: StyleProp<ViewStyle>;
  chip: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
};

type ChatRuntimeHeaderAgentSelectorProps = {
  renderState: ChatRuntimeAgentSelectorMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  labelNumberOfLines: number;
  styles: ChatRuntimeHeaderAgentSelectorStyles;
};

type ChatRuntimeHeaderActionsRowProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatRuntimeHeaderIconButtonRenderState =
  | ChatRuntimeBackMobileRenderState
  | ChatRuntimePinMobileRenderState
  | ChatRuntimeKillSwitchMobileRenderState
  | ChatRuntimeHandsFreeMobileRenderState;

type ChatRuntimeHeaderIconButtonProps = {
  shouldRender?: boolean;
  renderState: ChatRuntimeHeaderIconButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  iconContainerStyle?: StyleProp<ViewStyle>;
  isActive?: boolean;
};

type ChatRuntimeHeaderConversationStatusStyles = {
  chip: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  spinner: StyleProp<ImageStyle>;
};

type ChatRuntimeHeaderConversationStatusProps = {
  renderState: ChatSessionStatusMobileRenderState;
  spinnerSource: ImageSourcePropType;
  styles: ChatRuntimeHeaderConversationStatusStyles;
};

type ChatRuntimeHeaderTurnDurationStyles = {
  chip: StyleProp<ViewStyle>;
  liveChip: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  liveText: StyleProp<TextStyle>;
};

type ChatRuntimeHeaderTurnDurationProps = {
  renderState: ChatRuntimeTurnDurationHeaderMobileRenderState;
  styles: ChatRuntimeHeaderTurnDurationStyles;
};

type ChatRuntimeHeaderStyleSlots = {
  actionsRowStyle: ChatRuntimeHeaderActionsRowProps['style'];
  agentSelector: ChatRuntimeHeaderAgentSelectorStyles;
  conversationStatus: ChatRuntimeHeaderConversationStatusStyles;
  turnDuration: ChatRuntimeHeaderTurnDurationStyles;
  iconButtons: {
    edgeStyle: ChatRuntimeHeaderIconButtonProps['style'];
    pinStyle: ChatRuntimeHeaderIconButtonProps['style'];
    pinActiveStyle: ChatRuntimeHeaderIconButtonProps['activeStyle'];
    actionStyle: ChatRuntimeHeaderIconButtonProps['style'];
    killSwitchIconContainerStyle: ChatRuntimeHeaderIconButtonProps['iconContainerStyle'];
    handsFreeIconContainerStyle: ChatRuntimeHeaderIconButtonProps['iconContainerStyle'];
  };
};

type ChatRuntimeNavigationHeaderOptionsInput = {
  agentSelectorRenderState: ChatRuntimeHeaderAgentSelectorProps['renderState'];
  onAgentSelectorPress: ChatRuntimeHeaderAgentSelectorProps['onPress'];
  agentSelectorLabelNumberOfLines: ChatRuntimeHeaderAgentSelectorProps['labelNumberOfLines'];
  backButtonRenderState: ChatRuntimeHeaderIconButtonProps['renderState'];
  onBackButtonPress: ChatRuntimeHeaderIconButtonProps['onPress'];
  pinButtonRenderState: ChatRuntimeHeaderIconButtonProps['renderState'];
  onPinButtonPress: ChatRuntimeHeaderIconButtonProps['onPress'];
  pinButtonIsActive: ChatRuntimeHeaderIconButtonProps['isActive'];
  conversationStatusRenderState: ChatRuntimeHeaderConversationStatusProps['renderState'];
  conversationStatusSpinnerSource: ChatRuntimeHeaderConversationStatusProps['spinnerSource'];
  turnDurationRenderState: ChatRuntimeHeaderTurnDurationProps['renderState'];
  killSwitchButtonShouldRender: ChatRuntimeHeaderIconButtonProps['shouldRender'];
  killSwitchButtonRenderState: ChatRuntimeHeaderIconButtonProps['renderState'];
  onKillSwitchButtonPress: ChatRuntimeHeaderIconButtonProps['onPress'];
  handsFreeButtonRenderState: ChatRuntimeHeaderIconButtonProps['renderState'];
  onHandsFreeButtonPress: ChatRuntimeHeaderIconButtonProps['onPress'];
  styles: ChatRuntimeHeaderStyleSlots;
};

type ChatRuntimeNavigationHeaderRenderStateColors =
  Parameters<typeof getChatRuntimeAgentSelectorMobileRenderState>[0]['colors']
  & Parameters<typeof getChatRuntimeBackMobileRenderState>[0]['colors']
  & Parameters<typeof getChatRuntimePinMobileRenderState>[0]['colors']
  & Parameters<typeof getChatRuntimeHandsFreeMobileRenderState>[0]['colors']
  & Parameters<typeof getChatRuntimeKillSwitchMobileRenderState>[0]['colors']
  & Parameters<typeof getChatRuntimeTurnDurationHeaderMobileRenderState>[0]['colors']
  & Parameters<typeof getSessionStatusMobileRenderState>[0]['colors'];

type ChatRuntimeNavigationHeaderRenderStateInput = {
  agentName?: string | null;
  isPinned?: boolean;
  handsFree?: boolean;
  conversationState?: AgentConversationState | null;
  isResponding?: boolean;
  turnDurationMs?: number | null;
  turnDurationIsLive?: boolean;
  colors: ChatRuntimeNavigationHeaderRenderStateColors;
};

type ChatRuntimeNavigationHeaderRenderState = Pick<
  ChatRuntimeNavigationHeaderOptionsInput,
  | 'agentSelectorRenderState'
  | 'agentSelectorLabelNumberOfLines'
  | 'backButtonRenderState'
  | 'pinButtonRenderState'
  | 'pinButtonIsActive'
  | 'conversationStatusRenderState'
  | 'turnDurationRenderState'
  | 'killSwitchButtonShouldRender'
  | 'killSwitchButtonRenderState'
  | 'handsFreeButtonRenderState'
>;

type ChatRuntimeNavigationHeaderOptions = {
  headerTitle: () => ReactNode;
  headerLeft: () => ReactNode;
  headerRight: () => ReactNode;
};

export type ChatConversationHomeQuickStartSource = PromptLibraryLauncherShortcutSource;

export type ChatConversationHomeQuickStartItem<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = PromptLibraryShortcutItem<TPrompt, TTask>;

export function getChatConversationHomePromptLibraryCopyState(): ReturnType<typeof getPromptLibraryCopyState> {
  return getPromptLibraryCopyState();
}

export function formatChatConversationHomePromptSaveSuccessMessage(isEditing: boolean): string {
  return getPromptLibrarySaveSuccessMessage(isEditing);
}

export function getChatConversationHomePromptSaveSuccessAlertState(
  isEditing: boolean,
): ChatMessageRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState();
  return {
    title: copy.feedback.successTitle,
    message: formatChatConversationHomePromptSaveSuccessMessage(isEditing),
  };
}

export function formatChatConversationHomePromptSaveFailedMessage(error: unknown): string {
  return getChatRuntimeAlertMessage(error, getPromptLibraryCopyState().feedback.promptSaveFailed);
}

export function getChatConversationHomePromptSaveFailedAlertState(
  error: unknown,
): ChatMessageRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState();
  return {
    title: copy.feedback.errorTitle,
    message: formatChatConversationHomePromptSaveFailedMessage(error),
  };
}

export function formatChatConversationHomePromptDeleteWebConfirmMessage(promptName: string): string {
  return formatPromptLibraryDeletePromptWebConfirmMessage(promptName);
}

export function formatChatConversationHomePromptDeleteConfirmMessage(promptName: string): string {
  return formatPromptLibraryDeletePromptConfirmMessage(promptName);
}

export function getChatConversationHomePromptDeleteConfirmAlertState(
  promptName: string,
): ChatConversationHomePromptDeleteConfirmAlertState {
  const copy = getPromptLibraryCopyState();
  return {
    title: copy.feedback.deletePromptTitle,
    message: formatChatConversationHomePromptDeleteConfirmMessage(promptName),
    cancelLabel: copy.actions.cancel,
    deleteLabel: copy.actions.delete,
    webMessage: formatChatConversationHomePromptDeleteWebConfirmMessage(promptName),
  };
}

export function formatChatConversationHomePromptDeleteFailedMessage(error: unknown): string {
  return getChatRuntimeAlertMessage(error, getPromptLibraryCopyState().feedback.promptDeleteFailed);
}

export function getChatConversationHomePromptDeleteFailedAlertState(
  error: unknown,
): ChatMessageRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState();
  return {
    title: copy.feedback.errorTitle,
    message: formatChatConversationHomePromptDeleteFailedMessage(error),
  };
}

export function formatChatConversationHomePromptTaskStartedMessage(taskName: string): string {
  return formatPromptLibraryTaskStartedMessage(taskName);
}

export function getChatConversationHomePromptTaskStartedAlertState(
  taskName: string,
): ChatMessageRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState();
  return {
    title: copy.feedback.taskStartedTitle,
    message: formatChatConversationHomePromptTaskStartedMessage(taskName),
  };
}

export function formatChatConversationHomePromptTaskRunFailedMessage(error: unknown): string {
  return getChatRuntimeAlertMessage(error, getPromptLibraryCopyState().feedback.taskRunFailed);
}

export function getChatConversationHomePromptTaskRunFailedAlertState(
  error: unknown,
): ChatMessageRuntimeResolvedAlertState {
  const copy = getPromptLibraryCopyState();
  return {
    title: copy.feedback.errorTitle,
    message: formatChatConversationHomePromptTaskRunFailedMessage(error),
  };
}

export function getChatConversationHomeQuickStartPressIntent<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>(
  item: ChatConversationHomeQuickStartItem<TPrompt, TTask>,
): PromptLibraryShortcutPressIntent<TTask> {
  return getPromptLibraryShortcutPressIntent(item);
}

type ChatConversationHomeQuickStartItemsInput<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = {
  prompts?: readonly TPrompt[];
  skills?: readonly TSkill[];
  tasks?: readonly TTask[];
  canAddPrompt?: boolean;
};

type ChatConversationHomeQuickStartsStyles = {
  card: StyleProp<ViewStyle>;
  emptyText: StyleProp<TextStyle>;
  grid: StyleProp<ViewStyle>;
  shortcutCard: StyleProp<ViewStyle>;
  shortcutCardAdd: StyleProp<ViewStyle>;
  shortcutCardDisabled: StyleProp<ViewStyle>;
  shortcutCardPressed: StyleProp<ViewStyle>;
  sourcePill: StyleProp<ViewStyle>;
  sourceLabel: StyleProp<TextStyle>;
  addIcon: StyleProp<TextStyle>;
  title: StyleProp<TextStyle>;
  titleAdd: StyleProp<TextStyle>;
  description: StyleProp<TextStyle>;
  actions: StyleProp<ViewStyle>;
  actionButton: StyleProp<ViewStyle>;
  actionButtonPressed: StyleProp<ViewStyle>;
  actionText: StyleProp<TextStyle>;
  actionDangerText: StyleProp<TextStyle>;
};

type ChatConversationHomeQuickStartsProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  shouldRender: boolean;
  items: readonly ChatConversationHomeQuickStartItem<TPrompt, TTask>[];
  isLoading: boolean;
  runningTaskId?: string | null;
  onPress: (item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => void;
  onEditPrompt: (prompt: TPrompt) => void;
  onDeletePrompt: (prompt: TPrompt) => void;
  shortcutRenderState: PromptLibraryMobileShortcutRenderState;
  styles: ChatConversationHomeQuickStartsStyles;
};

export function createChatConversationHomeQuickStartItems<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  prompts,
  skills,
  tasks,
  canAddPrompt,
}: ChatConversationHomeQuickStartItemsInput<TPrompt, TSkill, TTask>): ChatConversationHomeQuickStartItem<TPrompt, TTask>[] {
  const mobilePromptLibraryCopy = getPromptLibraryMobileCopyState();

  return buildPromptLibraryShortcutItems({
    prompts,
    skills,
    tasks,
    canAddPrompt,
    addPromptTitle: mobilePromptLibraryCopy.addPromptTitle,
    addPromptDescription: mobilePromptLibraryCopy.addPromptDescription,
    taskDescriptionFallback: mobilePromptLibraryCopy.taskDescriptionFallback,
  });
}

type ChatConversationHomePromptEditorModalStyles = {
  keyboardAvoidingView: StyleProp<ViewStyle>;
  overlay: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  closeButton: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  input: StyleProp<TextStyle>;
  inputMultiline: StyleProp<TextStyle>;
  actions: StyleProp<ViewStyle>;
  cancelButton: StyleProp<ViewStyle>;
  cancelButtonText: StyleProp<TextStyle>;
  saveButton: StyleProp<ViewStyle>;
  saveButtonDisabled: StyleProp<ViewStyle>;
  saveButtonText: StyleProp<TextStyle>;
};

type ChatConversationHomePromptEditorSaveActionInput = {
  draft: Parameters<typeof getPromptLibraryEditorSaveActionState>[0];
  isEditing: boolean;
  isSaving: boolean;
};

type ChatConversationHomePromptEditorModalProps = {
  visible: boolean;
  isEditing: boolean;
  nameValue: string;
  onNameChange: (value: string) => void;
  contentValue: string;
  onContentChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  renderState: PromptLibraryEditorMobileRenderState;
  styles: ChatConversationHomePromptEditorModalStyles;
};

type ChatMessageRuntimeOverlaysProps = {
  agentSelector: ComponentProps<typeof AgentSelectorSheet>;
  promptEditor: ChatConversationHomePromptEditorModalProps;
};

type ChatMessageTurnDurationBadgeRenderState = {
  shouldRender: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  isLive: boolean;
  label: string;
  badge: {
    numberOfLines: number;
  };
  icon: ChatMessageActionIcon;
};

type ChatMessageTurnDurationBadgeProps = {
  renderState: ChatMessageTurnDurationBadgeRenderState;
  style: StyleProp<ViewStyle>;
  liveStyle?: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  liveTextStyle?: StyleProp<TextStyle>;
};

type ChatMessageActionSlotListProps = {
  slots: readonly ChatMessageActionSlot[];
  components: Record<ChatMessageActionSlot, ReactNode>;
  rowStyle?: StyleProp<ViewStyle>;
};

type ChatMessageStandaloneActionsProps = ChatMessageActionSlotListProps & {
  shouldRender: boolean;
};

type ChatMessageRetryStatusRenderState = {
  shouldRender: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  title: string;
  attemptLabel: string;
  countdownLabel: string;
  description: string;
  icon: ChatMessageActionIcon;
  spinner: {
    size: ComponentProps<typeof ActivityIndicator>['size'];
    color: string;
  };
  surface: {
    titleNumberOfLines: number;
  };
};

type ChatMessageRetryStatusStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  metaRow: StyleProp<ViewStyle>;
  attempt: StyleProp<TextStyle>;
  countdown: StyleProp<TextStyle>;
  description: StyleProp<TextStyle>;
};

type ChatMessageRetryStatusProps = {
  renderState: ChatMessageRetryStatusRenderState;
  styles: ChatMessageRetryStatusStyles;
};

type ChatMessageRetryStatusPropsInput = {
  isRetry: boolean;
  retryInfo?: AgentRetryInfo | null;
  colors: Parameters<typeof getChatRuntimeRetryStatusMobileRenderState>[0]['colors'];
};

type ChatMessageConversationRetryStatusInput = {
  message: {
    variant?: string;
    retryInfo?: AgentRetryInfo | null;
  };
  colors: ChatMessageRetryStatusPropsInput['colors'];
};

type ChatMessageToolApprovalStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  contentDisabled: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  toolRow: StyleProp<ViewStyle>;
  toolLabel: StyleProp<TextStyle>;
  toolName: StyleProp<TextStyle>;
  argumentsPreview: StyleProp<TextStyle>;
  argumentsToggle: StyleProp<ViewStyle>;
  argumentsTogglePressed: StyleProp<ViewStyle>;
  argumentsToggleText: StyleProp<TextStyle>;
  argumentsScroll: StyleProp<ViewStyle>;
  argumentsFull: StyleProp<TextStyle>;
  actions: StyleProp<ViewStyle>;
  button: StyleProp<ViewStyle>;
  buttonDisabled: StyleProp<ViewStyle>;
  approveButton: StyleProp<ViewStyle>;
  approveButtonText: StyleProp<TextStyle>;
  denyButton: StyleProp<ViewStyle>;
  denyButtonText: StyleProp<TextStyle>;
};

type ChatMessageToolApprovalProps = {
  renderState: ChatRuntimeToolApprovalMobileRenderState;
  toolName: string;
  argumentsPreview: string;
  argumentsContent: string;
  onToggleArguments: (event: GestureResponderEvent) => void;
  onDeny: (event: GestureResponderEvent) => void;
  onApprove: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolApprovalStyles;
};

type ChatMessageToolApprovalPropsInput = Omit<
  ChatMessageToolApprovalProps,
  | 'renderState'
  | 'toolName'
  | 'argumentsPreview'
  | 'argumentsContent'
  | 'onToggleArguments'
  | 'onDeny'
  | 'onApprove'
  | 'styles'
> & {
  isApproval: boolean;
  toolApproval?: {
    approvalId: string;
    toolName: string;
    arguments?: unknown;
  } | null;
  expandedToolApprovals: ChatDisplayExpansionStateMap<string>;
  pendingApprovalResponseId?: string | null;
  colors: Parameters<typeof getChatRuntimeToolApprovalMobileRenderState>[0]['colors'];
  onToggleArguments: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onApprove: (approvalId: string) => void;
};

type ChatMessageConversationToolApprovalInput = {
  message: {
    variant?: string;
    toolApproval?: ChatMessageToolApprovalPropsInput['toolApproval'];
  };
  expandedToolApprovals: ChatMessageToolApprovalPropsInput['expandedToolApprovals'];
  pendingApprovalResponseId?: ChatMessageToolApprovalPropsInput['pendingApprovalResponseId'];
  colors: ChatMessageToolApprovalPropsInput['colors'];
  onToggleArguments: ChatMessageToolApprovalPropsInput['onToggleArguments'];
  onRespondToToolApproval: (approvalId: string, approved: boolean) => void | Promise<void>;
};

type ChatMessageDelegationCardStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  statusBadge: StyleProp<ViewStyle>;
  statusText: StyleProp<TextStyle>;
  liveText: StyleProp<TextStyle>;
  subtitle: StyleProp<TextStyle>;
  metaRow: StyleProp<ViewStyle>;
  metaText: StyleProp<TextStyle>;
  conversationPreview: StyleProp<ViewStyle>;
  conversationPreviewLine: StyleProp<ViewStyle>;
  conversationPreviewRole: StyleProp<TextStyle>;
  conversationPreviewContent: StyleProp<TextStyle>;
  conversationPreviewTimestamp: StyleProp<TextStyle>;
  conversationPreviewMoreButton: StyleProp<ViewStyle>;
  conversationPreviewMoreButtonPressed: StyleProp<ViewStyle>;
  conversationPreviewMore: StyleProp<TextStyle>;
  toolPreview: StyleProp<ViewStyle>;
  toolPreviewLabel: StyleProp<TextStyle>;
  toolPreviewLine: StyleProp<ViewStyle>;
  toolPreviewStatusIcon: StyleProp<ViewStyle>;
  toolPreviewName: StyleProp<TextStyle>;
  toolPreviewNamePending: StyleProp<TextStyle>;
  toolPreviewNameSuccess: StyleProp<TextStyle>;
  toolPreviewNameError: StyleProp<TextStyle>;
  toolPreviewMoreButton: StyleProp<ViewStyle>;
  toolPreviewMoreButtonPressed: StyleProp<ViewStyle>;
  toolPreviewMore: StyleProp<TextStyle>;
};

type ChatMessageDelegationToolPreviewRow = {
  key: string;
  preview: string;
  renderState: ToolExecutionCompactMobileRenderState;
};

type ChatMessageToolExecutionCompactPreviewRowInput = {
  key: string;
  toolCall: ChatMessageDisplayToolEntry['toolCall'];
  label?: string;
  result?: ChatMessageDisplayToolEntry['result'];
  colors: Parameters<typeof getToolExecutionCompactMobileRenderState>[0]['colors'];
};

type ChatMessageDelegationToolPreviewRowsInput = {
  rows: readonly Pick<ChatMessageDisplayToolEntry, 'toolCall' | 'label' | 'result'>[];
  colors: ChatMessageToolExecutionCompactPreviewRowInput['colors'];
};

type ChatMessageDelegationCardColors =
  ChatMessageToolExecutionCompactPreviewRowInput['colors']
  & Parameters<typeof getChatRuntimeDelegationStatusMobileRenderState>[0]['colors'];

type ChatMessageDelegationCardProps = {
  surface: ChatRuntimeDelegationCardMobileRenderState['surface'];
  agentName: string;
  presentation: AgentDelegationPresentation;
  accessibilityLabel: string;
  messageCountLabel: string | null;
  statusStyles?: ChatSessionStatusMobileStyleState | null;
  conversationPreview: {
    rows: AgentDelegationConversationPreviewRow[];
    roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots;
    hiddenCount: number;
    moreAction: ChatRuntimeDelegationMorePreviewActionState;
    onShowAll?: (event: GestureResponderEvent) => void;
  };
  toolPreview: {
    shouldRender: boolean;
    label: string;
    rows: ChatMessageDelegationToolPreviewRow[];
    hiddenCount: number;
    moreAction: ChatRuntimeDelegationMorePreviewActionState;
    onShowAll?: (event: GestureResponderEvent) => void;
  };
  styles: ChatMessageDelegationCardStyles;
};

type ChatMessageDelegationCardPropsInput = Omit<
  ChatMessageDelegationCardProps,
  | 'agentName'
  | 'presentation'
  | 'accessibilityLabel'
  | 'messageCountLabel'
  | 'statusStyles'
  | 'conversationPreview'
  | 'toolPreview'
  | 'styles'
> & {
  isDelegation: boolean;
  delegation?: ACPDelegationProgress | null;
  toolEntries: readonly ChatMessageDisplayToolEntry[];
  displayToolCallCount: number;
  expandedDelegationConversationPreviews: ChatDisplayExpansionStateMap<string>;
  expandedDelegationToolPreviews: ChatDisplayExpansionStateMap<string>;
  roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots;
  colors: ChatMessageDelegationCardColors;
  onShowAllConversationPreview?: (runId: string) => void;
  onShowAllToolPreview?: (runId: string) => void;
};

type ChatMessageDisplayExpansionStateSetter = Dispatch<SetStateAction<ChatDisplayExpansionStateMap<string>>>;

type ChatMessageConversationDelegationCardInput = {
  message: {
    variant?: string;
    delegation?: ACPDelegationProgress | null;
  };
  surface: ChatMessageDelegationCardPropsInput['surface'];
  toolEntries: ChatMessageDelegationCardPropsInput['toolEntries'];
  displayToolCallCount: ChatMessageDelegationCardPropsInput['displayToolCallCount'];
  expandedDelegationConversationPreviews: ChatMessageDelegationCardPropsInput['expandedDelegationConversationPreviews'];
  expandedDelegationToolPreviews: ChatMessageDelegationCardPropsInput['expandedDelegationToolPreviews'];
  roleStyles: ChatMessageDelegationCardPropsInput['roleStyles'];
  colors: ChatMessageDelegationCardPropsInput['colors'];
  setExpandedDelegationConversationPreviews: ChatMessageDisplayExpansionStateSetter;
  setExpandedDelegationToolPreviews: ChatMessageDisplayExpansionStateSetter;
};

type ChatMessageToolActivityGroupHeaderKind = 'collapsed' | 'expanded';

type ChatMessageToolActivityGroupToggleStyles = {
  container: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  countBadge: StyleProp<ViewStyle>;
  countBadgeText: StyleProp<TextStyle>;
  previewLine: StyleProp<TextStyle>;
};

type ChatMessageToolActivityGroupToggleProps = {
  renderState: ToolActivityGroupMobileRenderState;
  headerKind: ChatMessageToolActivityGroupHeaderKind;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupToggleStyles;
};

type ChatMessageToolActivityGroupFooterStyles = {
  button: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolActivityGroupFooterProps = {
  renderState: ToolActivityGroupMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupFooterStyles;
};

type ChatMessageToolActivityGroupBoundaryKind = ChatMessageToolActivityGroupHeaderKind | 'footer';

type ChatMessageToolActivityGroupBoundaryStyles = {
  toggle: ChatMessageToolActivityGroupToggleStyles;
  footer: ChatMessageToolActivityGroupFooterStyles;
};

type ChatMessageToolActivityGroupBoundaryProps = {
  renderState: ToolActivityGroupMobileRenderState;
  kind: ChatMessageToolActivityGroupBoundaryKind;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupBoundaryStyles;
};

type ChatMessageToolExecutionCompactRowStyles = {
  line: StyleProp<ViewStyle>;
  leadingIcon: StyleProp<ViewStyle>;
  name: StyleProp<TextStyle>;
  namePending: StyleProp<TextStyle>;
  nameSuccess: StyleProp<TextStyle>;
  nameError: StyleProp<TextStyle>;
  statusIndicator: StyleProp<ViewStyle>;
  toggleIcon: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionCompactRowProps = {
  renderState: ToolExecutionCompactMobileRenderState;
  styles: ChatMessageToolExecutionCompactRowStyles;
};

type ChatMessageToolExecutionCompactListRow = {
  key: string;
  renderState: ToolExecutionCompactMobileRenderState;
};

type ChatMessageToolExecutionCompactGroupStyles = {
  container: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionCompactGroupProps = {
  renderState: ToolExecutionDetailMobileExpandControlRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCompactGroupStyles;
  children: ReactNode;
};

type ChatMessageToolExecutionCompactListProps = {
  shouldRender: boolean;
  renderState: ToolExecutionDetailMobileExpandControlRenderState;
  rows: readonly ChatMessageToolExecutionCompactListRow[];
  onPress?: (event: GestureResponderEvent) => void;
  groupStyles: ChatMessageToolExecutionCompactGroupStyles;
  rowStyles: ChatMessageToolExecutionCompactRowStyles;
};

type ChatMessageToolExecutionCollapseControlStyles = {
  button: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  placement?: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionCollapseControlProps = {
  renderState: ToolExecutionDetailMobileCollapseControlRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCollapseControlStyles;
};

type ChatMessageToolExecutionExpandedGroupStyles = {
  container: StyleProp<ViewStyle>;
  card: StyleProp<ViewStyle>;
  pending: StyleProp<ViewStyle>;
  success: StyleProp<ViewStyle>;
  error: StyleProp<ViewStyle>;
  collapseButton: StyleProp<ViewStyle>;
  collapsePressed: StyleProp<ViewStyle>;
  collapseTopPlacement: StyleProp<ViewStyle>;
  collapseBottomPlacement: StyleProp<ViewStyle>;
  collapseText: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionExpandedGroupProps = {
  topCollapseRenderState: ToolExecutionDetailMobileCollapseControlRenderState;
  bottomCollapseRenderState: ToolExecutionDetailMobileCollapseControlRenderState;
  onCollapsePress?: (event: GestureResponderEvent) => void;
  isPending: boolean;
  allSuccess: boolean;
  hasErrors: boolean;
  emptyState?: ReactNode;
  styles: ChatMessageToolExecutionExpandedGroupStyles;
  children: ReactNode;
};

type ChatMessageToolExecutionPanelProps = {
  shouldRender: boolean;
  isExpanded: boolean;
  compact: Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender'>;
  expanded: Omit<ChatMessageToolExecutionExpandedGroupProps, 'children'>;
  children: ReactNode;
};

type ChatMessageToolExecutionStackStyles = {
  compactGroup: ChatMessageToolExecutionCompactGroupStyles;
  compactRow: ChatMessageToolExecutionCompactRowStyles;
  expandedGroup: ChatMessageToolExecutionExpandedGroupStyles;
  emptyStateText: StyleProp<TextStyle>;
  callDetail: ChatMessageToolExecutionCallDetailStyles;
};

type ChatMessageToolExecutionStackProps = {
  shouldRender: boolean;
  isExpanded: boolean;
  compact: Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender' | 'groupStyles' | 'rowStyles'>;
  expanded: Omit<ChatMessageToolExecutionExpandedGroupProps, 'children' | 'emptyState' | 'styles'> & {
    emptyState?: {
      shouldRender: boolean;
      renderState: ToolExecutionDetailMobileEmptyStateRenderState;
    } | null;
  };
  detailRows: readonly ChatMessageToolExecutionCallListRow[];
  styles: ChatMessageToolExecutionStackStyles;
};

type ChatMessageToolExecutionStackPropsInput = {
  displayToolCallCount: number;
  colors: Parameters<typeof getToolExecutionDetailMobileCollapseControlRenderState>[0]['colors'];
  isExpanded: ChatMessageToolExecutionStackProps['isExpanded'];
  rows: Omit<ChatMessageToolExecutionRowsInput, 'colors'>;
  compact: {
    onToggle?: ChatMessageToolExecutionStackProps['compact']['onPress'];
  };
  expanded: {
    emptyStateRenderState: ToolExecutionDetailMobileEmptyStateRenderState;
    onToggle?: ChatMessageToolExecutionStackProps['expanded']['onCollapsePress'];
  };
};

type ChatMessageConversationToolExecutionStackInput = {
  message: {
    id?: string | null;
  };
  messageIndex: number;
  displayToolCallCount: number;
  renderedToolEntries: readonly ChatMessageDisplayToolEntry[];
  isExpanded: ChatMessageToolExecutionStackPropsInput['isExpanded'];
  expandedToolCalls: ChatDisplayExpansionStateMap<string>;
  previewNumberOfLines: ChatMessageToolExecutionRowsInput['previewNumberOfLines'];
  pendingResultRenderState: ToolExecutionDetailMobilePendingResultRenderState;
  emptyStateRenderState: ToolExecutionDetailMobileEmptyStateRenderState;
  colors: ChatMessageToolExecutionStackPropsInput['colors'];
  onToggleToolCall: ChatMessageToolExecutionRowsInput['onToggleToolCall'];
  onCopyPayload: (content: string) => void | Promise<void>;
  onToggleMessageExpansion: (messageIndex: number) => void;
};

type ChatMessageToolExecutionCopyButtonStyles = {
  button: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionCopyButtonProps = {
  renderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCopyButtonStyles;
};

type ChatMessageToolExecutionDetailHeaderStyles = {
  header: StyleProp<ViewStyle>;
  headerPressed: StyleProp<ViewStyle>;
  toolName: StyleProp<TextStyle>;
  expandHint: StyleProp<ViewStyle>;
  expandHintText: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionDetailHeaderProps = {
  renderState: ToolExecutionDetailMobileHeaderRenderState;
  toolName: string;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionDetailHeaderStyles;
};

type ChatMessageToolExecutionCallSectionStyles = {
  section: StyleProp<ViewStyle>;
  header: ChatMessageToolExecutionDetailHeaderStyles;
};

type ChatMessageToolExecutionCallSectionProps = {
  renderState: ToolExecutionDetailMobileHeaderRenderState;
  toolName: string;
  onHeaderPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCallSectionStyles;
  children: ReactNode;
};

type ChatMessageToolExecutionResultBadgeStyles = {
  badge: StyleProp<ViewStyle>;
  badgeSuccess: StyleProp<ViewStyle>;
  badgeError: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  textSuccess: StyleProp<TextStyle>;
  textError: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionResultBadgeProps = {
  badge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  styles: ChatMessageToolExecutionResultBadgeStyles;
};

type ChatMessageToolExecutionPendingResultStyles = {
  row: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPendingResultProps = {
  renderState: ToolExecutionDetailMobilePendingResultRenderState;
  styles: ChatMessageToolExecutionPendingResultStyles;
};

type ChatMessageToolExecutionEmptyStateProps = {
  renderState: ToolExecutionDetailMobileEmptyStateRenderState;
  style: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPayloadMetaStyles = {
  row?: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  payloadType: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPayloadMetaProps = {
  renderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  styles: ChatMessageToolExecutionPayloadMetaStyles;
};

type ChatMessageToolExecutionResultHeaderStyles = {
  header: StyleProp<ViewStyle>;
  meta: StyleProp<ViewStyle>;
  payloadMeta: Omit<ChatMessageToolExecutionPayloadMetaStyles, 'row'>;
  badge: ChatMessageToolExecutionResultBadgeStyles;
  characterCount: StyleProp<TextStyle>;
  copyButton: ChatMessageToolExecutionCopyButtonStyles;
};

type ChatMessageToolExecutionResultHeaderProps = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  characterCountLabel: string;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionResultHeaderStyles;
};

type ChatMessageToolExecutionPayloadBlockStyles = {
  preview: StyleProp<TextStyle>;
  scroll: StyleProp<ViewStyle>;
  scrollExpanded: StyleProp<ViewStyle>;
  code: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPayloadBlockProps = {
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  styles: ChatMessageToolExecutionPayloadBlockStyles;
};

type ChatMessageToolExecutionPayloadSectionStyles = {
  section: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  payloadMeta: ChatMessageToolExecutionPayloadMetaStyles;
  copyButton: ChatMessageToolExecutionCopyButtonStyles;
  payloadBlock: ChatMessageToolExecutionPayloadBlockStyles;
};

type ChatMessageToolExecutionPayloadSectionProps = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionPayloadSectionStyles;
};

type ChatMessageToolExecutionErrorBlockStyles = {
  section: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  text: StyleProp<TextStyle>;
  copyButton: ChatMessageToolExecutionCopyButtonStyles;
};

type ChatMessageToolExecutionErrorBlockProps = {
  renderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error: string;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionErrorBlockStyles;
};

type ChatMessageToolExecutionResultSectionStyles = {
  item: StyleProp<ViewStyle>;
  header: ChatMessageToolExecutionResultHeaderStyles;
  payloadBlock: ChatMessageToolExecutionPayloadBlockStyles;
  errorBlock: ChatMessageToolExecutionErrorBlockStyles;
};

type ChatMessageToolExecutionResultSectionProps = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  characterCountLabel: string;
  resultCompactText?: string | null;
  resultContent: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  errorRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error?: string | null;
  errorCopyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onErrorCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionResultSectionStyles;
};

type ChatMessageToolExecutionCallDetailInput = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
};

type ChatMessageToolExecutionCallDetailResult = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  characterCountLabel: string;
  resultCompactText?: string | null;
  resultContent: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  errorRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error?: string | null;
  errorCopyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onErrorCopyPress?: (event: GestureResponderEvent) => void;
};

type ChatMessageToolExecutionCallDetailPendingResult = {
  renderState: ToolExecutionDetailMobilePendingResultRenderState;
};

type ChatMessageToolExecutionCallDetailStyles = {
  callSection: ChatMessageToolExecutionCallSectionStyles;
  payloadSection: ChatMessageToolExecutionPayloadSectionStyles;
  resultSection: ChatMessageToolExecutionResultSectionStyles;
  pendingResult: ChatMessageToolExecutionPendingResultStyles;
};

type ChatMessageToolExecutionCallDetailProps = {
  renderState: ToolExecutionDetailMobileHeaderRenderState;
  toolName: string;
  onHeaderPress?: (event: GestureResponderEvent) => void;
  input?: ChatMessageToolExecutionCallDetailInput | null;
  result?: ChatMessageToolExecutionCallDetailResult | null;
  pendingResult?: ChatMessageToolExecutionCallDetailPendingResult | null;
  styles: ChatMessageToolExecutionCallDetailStyles;
};

type ChatMessageToolExecutionCallListRow = Omit<ChatMessageToolExecutionCallDetailProps, 'styles'> & {
  key: string;
};

type ChatMessageToolExecutionDetailRowInput = {
  key: string;
  toolCall: ChatMessageDisplayToolEntry['toolCall'];
  label?: string;
  result?: ChatMessageDisplayToolEntry['result'];
  isExpanded: boolean;
  colors: Parameters<typeof getToolExecutionDetailMobileHeaderRenderState>[0]['colors'];
  previewNumberOfLines: number;
  pendingResultRenderState: ToolExecutionDetailMobilePendingResultRenderState;
  onToggle?: ChatMessageToolExecutionCallListRow['onHeaderPress'];
  onCopyPayload: (content: string) => void;
};

type ChatMessageToolExecutionRowsInput = {
  entries: readonly ChatMessageDisplayToolEntry[];
  stableMessageKey: string;
  expandedToolCalls: ChatDisplayExpansionStateMap<string>;
  colors: ChatMessageToolExecutionCompactPreviewRowInput['colors'];
  previewNumberOfLines: number;
  pendingResultRenderState: ToolExecutionDetailMobilePendingResultRenderState;
  onToggleToolCall: (stableMessageKey: string, toolCallIndex: number) => void;
  onCopyPayload: (content: string) => void;
};

type ChatMessageToolExecutionRows = {
  compactRows: readonly ChatMessageDelegationToolPreviewRow[];
  detailRows: readonly ChatMessageToolExecutionCallListRow[];
};

type ChatMessageToolExecutionCallListProps = {
  rows: readonly ChatMessageToolExecutionCallListRow[];
  styles: ChatMessageToolExecutionCallDetailStyles;
};

type ChatMessageHistoryBannerStyles = {
  container: StyleProp<ViewStyle>;
  summary: StyleProp<TextStyle>;
  loadButton: StyleProp<ViewStyle>;
  loadButtonPressed: StyleProp<ViewStyle>;
  loadButtonText: StyleProp<TextStyle>;
};

type ChatMessageHistoryBannerProps = {
  renderState: ChatRuntimeMessageHistoryBannerMobileRenderState;
  onLoadEarlier?: (event: GestureResponderEvent) => void;
  styles: ChatMessageHistoryBannerStyles;
};

type ChatMessageConversationFrameProps = {
  children: ReactNode;
  dock?: ReactNode;
  overlays?: ReactNode;
  keyboardAvoidingStyle: StyleProp<ViewStyle>;
  keyboardAvoidingBehavior: ComponentProps<typeof KeyboardAvoidingView>['behavior'];
  keyboardVerticalOffset: number;
  rootStyle: StyleProp<ViewStyle>;
};

type ChatMessageConversationOverlaysProps = {
  agentSelector?: ReactNode;
  promptEditor?: ReactNode;
};

type ChatMessageScrollViewportProps = {
  children: ReactNode;
  scrollRef?: Ref<ScrollView>;
  style: StyleProp<ViewStyle>;
  contentContainerStyle: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps: ComponentProps<typeof ScrollView>['keyboardShouldPersistTaps'];
  contentInsetAdjustmentBehavior: ComponentProps<typeof ScrollView>['contentInsetAdjustmentBehavior'];
  onScroll?: ComponentProps<typeof ScrollView>['onScroll'];
  onScrollBeginDrag?: ComponentProps<typeof ScrollView>['onScrollBeginDrag'];
  onScrollEndDrag?: ComponentProps<typeof ScrollView>['onScrollEndDrag'];
  scrollEventThrottle: number;
};

type ChatMessageConversationViewportContentProps = {
  loadingState?: ReactNode;
  homeState?: ReactNode;
  historyBanner?: ReactNode;
  stepSummary?: ReactNode;
  children: ReactNode;
  debugPanels?: ReactNode;
};

type ChatMessageConversationViewportProps =
  Omit<ChatMessageScrollViewportProps, 'children'>
  & ChatMessageConversationViewportContentProps;

type ChatMessageStepSummaryCardStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  badge: StyleProp<ViewStyle>;
  badgeText: StyleProp<TextStyle>;
  action: StyleProp<TextStyle>;
  meta: StyleProp<TextStyle>;
  preview: StyleProp<TextStyle>;
};

type ChatMessageStepSummaryCardProps = {
  renderState: ChatRuntimeStepSummaryMobileRenderState;
  styles: ChatMessageStepSummaryCardStyles;
};

type ChatMessageConversationViewportAffordanceRenderStateInput = {
  visibleMessageCount: number;
  totalMessageCount: number;
  hiddenMessageCount: number;
  messageHistoryLoadIncrement: number;
  latestStepSummary: Parameters<typeof getChatRuntimeStepSummaryMobileRenderState>[0]['summary'];
  colors:
    & Parameters<typeof getChatRuntimeMessageHistoryBannerMobileRenderState>[0]['colors']
    & Parameters<typeof getChatRuntimeStepSummaryMobileRenderState>[0]['colors'];
};

type ChatMessageConversationViewportAffordanceRenderState = {
  historyBanner: Pick<ChatMessageHistoryBannerProps, 'renderState'>;
  stepSummary: Pick<ChatMessageStepSummaryCardProps, 'renderState'>;
};

type ChatMessageRuntimeViewportContentRenderStateInput = {
  isLoadingMessages: boolean;
  messageCount: number;
};

type ChatMessageRuntimeViewportContentRenderState = {
  loading: ChatRuntimeLoadingStateMobileRenderState;
  homeQuickStarts: ChatRuntimeHomeQuickStartsMobileRenderState;
};

type ChatMessageScrollToBottomButtonProps = {
  renderState: ChatRuntimeScrollToBottomMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
};

type ChatMessageLoadingStateProps = {
  renderState: ChatRuntimeLoadingStateMobileRenderState;
  spinnerSource: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  spinnerStyle: StyleProp<ImageStyle>;
};

type ChatMessageDebugPanelRow = ChatRuntimeDebugPanelsMobileRenderState['requestRows'][number];

type ChatMessageDebugPanelProps = {
  shouldRender: boolean;
  rows: readonly ChatMessageDebugPanelRow[];
  panelStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageDebugPanelStackProps = ChatRuntimeDebugPanelsMobileRenderState & {
  panelStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageRuntimeDebugPanelsRenderStateInput = {
  requestDebugText?: string | null;
  voiceDebugEnabled?: boolean;
  voiceEvents?: readonly VoiceDebugEntry[] | null;
};

type ChatMessageRuntimeThreadChromeStyleStateInput = {
  colors:
    & Parameters<typeof getToolExecutionCompactMobileStyleRenderState>[0]['colors']
    & Parameters<typeof getToolExecutionDetailMobileStyleRenderState>[0]['colors']
    & Parameters<typeof getToolActivityGroupMobileSurfaceRenderState>[0]['colors']
    & Parameters<typeof getChatRuntimeToolApprovalMobileRenderState>[0]['colors']
    & Parameters<typeof getChatRuntimeMessageThreadMobileStyleRenderState>[0]['colors'];
};

export type ChatMessageRuntimeThreadChromeStyleState = {
  compactToolExecution: ReturnType<typeof getToolExecutionCompactMobileStyleRenderState>;
  toolExecutionDetail: ReturnType<typeof getToolExecutionDetailMobileStyleRenderState>;
  toolActivityGroup: ReturnType<typeof getToolActivityGroupMobileSurfaceRenderState>;
  toolApproval: ReturnType<typeof getChatRuntimeToolApprovalMobileRenderState>;
  messageThread: ReturnType<typeof getChatRuntimeMessageThreadMobileStyleRenderState>;
};

type ChatMessageConversationViewportStyleSlots = {
  frame: Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingStyle' | 'rootStyle'>;
  scrollViewport: Pick<ChatMessageScrollViewportProps, 'style' | 'contentContainerStyle'>;
  loadingState: Pick<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>;
  homeQuickStarts: ChatConversationHomeQuickStartsStyles;
  historyBanner: ChatMessageHistoryBannerStyles;
  stepSummary: ChatMessageStepSummaryCardStyles;
  debugPanels: Pick<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>;
};

type ChatMessageRuntimeViewportStyleSlots = Pick<
  ChatMessageConversationViewportStyleSlots,
  'scrollViewport' | 'loadingState' | 'homeQuickStarts' | 'historyBanner' | 'stepSummary' | 'debugPanels'
>;

type ChatMessageRuntimeViewportProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<
  ChatMessageConversationViewportProps,
  | 'style'
  | 'contentContainerStyle'
  | 'loadingState'
  | 'homeState'
  | 'historyBanner'
  | 'stepSummary'
  | 'debugPanels'
> & {
  loadingState: Omit<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>;
  homeQuickStarts: Omit<ChatConversationHomeQuickStartsProps<TPrompt, TTask>, 'styles'>;
  historyBanner: Omit<ChatMessageHistoryBannerProps, 'styles'>;
  stepSummary: Omit<ChatMessageStepSummaryCardProps, 'styles'>;
  debugPanels: Omit<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>;
  styles: ChatMessageRuntimeViewportStyleSlots;
};

type ChatMessageRuntimeViewportChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<ChatMessageRuntimeViewportProps<TPrompt, TTask>, 'children' | 'styles'>;

type ChatMessageRuntimeViewportChromePropsInput<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> =
  Omit<
    ChatMessageRuntimeViewportChromeProps<TPrompt, TTask>,
    | 'loadingState'
    | 'homeQuickStarts'
    | 'historyBanner'
    | 'stepSummary'
    | 'debugPanels'
    | 'keyboardShouldPersistTaps'
    | 'contentInsetAdjustmentBehavior'
  >
  & {
    viewportContentIsLoadingMessages: ChatMessageRuntimeViewportContentRenderStateInput['isLoadingMessages'];
    viewportContentMessageCount: ChatMessageRuntimeViewportContentRenderStateInput['messageCount'];
    loadingSpinnerSource: ImageSourcePropType;
    quickStartItems: readonly ChatConversationHomeQuickStartItem<TPrompt, TTask>[];
    isLoadingQuickStartPrompts: boolean;
    runningPromptTaskId?: string | null;
    onQuickStartPress: ChatConversationHomeQuickStartsProps<TPrompt, TTask>['onPress'];
    onEditPrompt: ChatConversationHomeQuickStartsProps<TPrompt, TTask>['onEditPrompt'];
    onDeletePrompt: ChatConversationHomeQuickStartsProps<TPrompt, TTask>['onDeletePrompt'];
    visibleMessageCount: ChatMessageConversationViewportAffordanceRenderStateInput['visibleMessageCount'];
    totalMessageCount: ChatMessageConversationViewportAffordanceRenderStateInput['totalMessageCount'];
    hiddenMessageCount: ChatMessageConversationViewportAffordanceRenderStateInput['hiddenMessageCount'];
    messageHistoryLoadIncrement: ChatMessageConversationViewportAffordanceRenderStateInput['messageHistoryLoadIncrement'];
    latestStepSummary: ChatMessageConversationViewportAffordanceRenderStateInput['latestStepSummary'];
    colors:
      & ChatMessageConversationViewportAffordanceRenderStateInput['colors']
      & Parameters<typeof getPromptLibraryMobileShortcutRenderState>[0]
      & Parameters<typeof getChatRuntimeViewportMobileRenderState>[0]['colors'];
    onLoadEarlierMessages?: ChatMessageHistoryBannerProps['onLoadEarlier'];
    debugPanelsRenderState: ChatRuntimeDebugPanelsMobileRenderState;
  };

type ChatMessageResponseHistoryPanelDockProps = ComponentProps<typeof ResponseHistoryPanel>;

type ChatMessageQueuePanelDockProps = {
  shouldRender: boolean;
  panel: ComponentProps<typeof MessageQueuePanel>;
  style: StyleProp<ViewStyle>;
};

type ChatMessageConversationDockProps = {
  responseHistoryPanel?: ReactNode;
  scrollToBottomButton?: ReactNode;
  voiceOverlay?: ReactNode;
  queuePanel?: ReactNode;
  connectionBanner?: ReactNode;
  composer?: ReactNode;
};

type ChatMessageConnectionBannerStyles = {
  banner: StyleProp<ViewStyle>;
  reconnecting: StyleProp<ViewStyle>;
  failed: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  icon: StyleProp<ViewStyle>;
  textContainer: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  subtitle: StyleProp<TextStyle>;
  retryButton: StyleProp<ViewStyle>;
  retryButtonText: StyleProp<TextStyle>;
};

type ChatMessageConnectionBannerProps = {
  renderState: ChatRuntimeConnectionBannerMobileRenderState;
  onRetry?: (event: GestureResponderEvent) => void;
  styles: ChatMessageConnectionBannerStyles;
};

type ChatMessageConversationDockStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  queuePanelStyle: ChatMessageQueuePanelDockProps['style'];
  connectionBanner: ChatMessageConnectionBannerStyles;
};

type ChatMessageRuntimeDockStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  queuePanelStyle: ChatMessageQueuePanelDockProps['style'];
  connectionBanner: ChatMessageConnectionBannerStyles;
  composer: ChatComposerRuntimeDockStyleSlots;
};

type ChatMessageRuntimeDockProps = {
  responseHistoryPanel: ChatMessageResponseHistoryPanelDockProps;
  scrollToBottomButton: Omit<ChatMessageScrollToBottomButtonProps, 'style'>;
  voiceOverlay: Omit<ChatComposerVoiceOverlayProps, 'styles'>;
  queuePanel: Omit<ChatMessageQueuePanelDockProps, 'style'>;
  connectionBanner: Omit<ChatMessageConnectionBannerProps, 'styles'>;
  composer: Omit<ChatComposerRuntimeDockProps, 'styles'>;
  styles: ChatMessageRuntimeDockStyleSlots;
};

type ChatMessageRuntimeDockChromeProps = Omit<ChatMessageRuntimeDockProps, 'styles'>;

type ChatMessageRuntimeDockChromePropsInput = {
  responseHistoryResponses: ChatMessageResponseHistoryPanelDockProps['responses'];
  responseHistoryTtsProvider: ChatMessageResponseHistoryPanelDockProps['ttsProvider'];
  responseHistoryRemoteTtsVoice: ChatMessageResponseHistoryPanelDockProps['remoteTtsVoice'];
  responseHistoryRemoteTtsModel: ChatMessageResponseHistoryPanelDockProps['remoteTtsModel'];
  responseHistoryTtsRate: ChatMessageResponseHistoryPanelDockProps['ttsRate'];
  responseHistoryTtsPitch: ChatMessageResponseHistoryPanelDockProps['ttsPitch'];
  responseHistoryTtsVoiceId: ChatMessageResponseHistoryPanelDockProps['ttsVoiceId'];
  responseHistoryRemoteBaseUrl: ChatMessageResponseHistoryPanelDockProps['remoteBaseUrl'];
  responseHistoryRemoteApiKey: ChatMessageResponseHistoryPanelDockProps['remoteApiKey'];
  scrollToBottomVisible: ChatRuntimeScrollToBottomMobileRenderStateInput['isVisible'];
  onScrollToBottom?: ChatMessageScrollToBottomButtonProps['onPress'];
  voiceOverlayListening: boolean;
  voiceOverlayHandsFree: Parameters<typeof getChatComposerVoiceOverlayLabel>[0]['handsFree'];
  voiceOverlayWillCancel: Parameters<typeof getChatComposerVoiceOverlayLabel>[0]['willCancel'];
  voiceOverlayTranscript: ChatComposerVoiceOverlayProps['transcript'];
  queuePanelEnabled: boolean;
  queuePanelConversationId: ChatMessageQueuePanelDockProps['panel']['conversationId'];
  queuedMessages: ChatMessageQueuePanelDockProps['panel']['messages'];
  onRemoveQueuedMessage: ChatMessageQueuePanelDockProps['panel']['onRemove'];
  onUpdateQueuedMessage: ChatMessageQueuePanelDockProps['panel']['onUpdate'];
  onRetryQueuedMessage: ChatMessageQueuePanelDockProps['panel']['onRetry'];
  onProcessNextQueuedMessage: ChatMessageQueuePanelDockProps['panel']['onProcessNext'];
  canProcessNextQueuedMessage: ChatMessageQueuePanelDockProps['panel']['canProcessNext'];
  onClearQueuedMessages: ChatMessageQueuePanelDockProps['panel']['onClear'];
  isMessageQueuePaused: ChatMessageQueuePanelDockProps['panel']['isPaused'];
  onPauseMessageQueue: ChatMessageQueuePanelDockProps['panel']['onPause'];
  onResumeMessageQueue: ChatMessageQueuePanelDockProps['panel']['onResume'];
  connectionState: ChatRuntimeConnectionBannerMobileRenderStateInput['connectionState'];
  lastFailedMessage: ChatRuntimeConnectionBannerMobileRenderStateInput['lastFailedMessage'];
  isResponding: ChatRuntimeConnectionBannerMobileRenderStateInput['isResponding'];
  colors:
    & ChatRuntimeScrollToBottomMobileRenderStateInput['colors']
    & ChatRuntimeConnectionBannerMobileRenderStateInput['colors'];
  onConnectionBannerRetry?: ChatMessageConnectionBannerProps['onRetry'];
  composer: ChatMessageRuntimeDockChromeProps['composer'];
};

type ChatMessageRuntimeSurfaceStyleSlots = {
  frame: ChatMessageConversationViewportStyleSlots['frame'];
  dock: ChatMessageRuntimeDockStyleSlots;
  viewport: ChatMessageRuntimeViewportStyleSlots;
};

type ChatMessageRuntimeSurfaceProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  frame: Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingBehavior' | 'keyboardVerticalOffset'>;
  dock: Omit<ChatMessageRuntimeDockProps, 'styles'>;
  overlays: ChatMessageRuntimeOverlaysProps;
  threadList: ChatMessageConversationRuntimeThreadListProps;
  viewport: Omit<ChatMessageRuntimeViewportProps<TPrompt, TTask>, 'children' | 'styles'>;
  styles: ChatMessageRuntimeSurfaceStyleSlots;
};

type ChatMessageRuntimeSurfaceChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<ChatMessageRuntimeSurfaceProps<TPrompt, TTask>, 'children' | 'styles'>;

type ChatMessageRuntimeSurfaceChromePropsInput<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  platform: Parameters<typeof getChatRuntimeViewportMobileKeyboardAvoidingBehavior>[0];
  colors: Parameters<typeof getPromptLibraryEditorMobileRenderState>[0]['colors'];
  keyboardVerticalOffset: ChatMessageRuntimeSurfaceChromeProps<TPrompt, TTask>['frame']['keyboardVerticalOffset'];
  dock: ChatMessageRuntimeSurfaceChromeProps<TPrompt, TTask>['dock'];
  viewport: ChatMessageRuntimeSurfaceChromeProps<TPrompt, TTask>['viewport'];
  threadStates: ChatMessageConversationRuntimeThreadListProps['threadStates'];
  threadStyles: ChatMessageConversationRuntimeThreadListProps['styles'];
  agentSelectorVisible: ChatMessageRuntimeOverlaysProps['agentSelector']['visible'];
  onAgentSelectorClose: ChatMessageRuntimeOverlaysProps['agentSelector']['onClose'];
  promptEditorVisible: ChatConversationHomePromptEditorModalProps['visible'];
  promptEditorIsEditing: ChatConversationHomePromptEditorModalProps['isEditing'];
  promptEditorNameValue: ChatConversationHomePromptEditorModalProps['nameValue'];
  onPromptEditorNameChange: ChatConversationHomePromptEditorModalProps['onNameChange'];
  promptEditorContentValue: ChatConversationHomePromptEditorModalProps['contentValue'];
  onPromptEditorContentChange: ChatConversationHomePromptEditorModalProps['onContentChange'];
  promptEditorIsSaving: ChatConversationHomePromptEditorModalProps['isSaving'];
  onPromptEditorClose: ChatConversationHomePromptEditorModalProps['onClose'];
  onPromptEditorSave: ChatConversationHomePromptEditorModalProps['onSave'];
  promptEditorStyles: ChatConversationHomePromptEditorModalProps['styles'];
};

type ChatRuntimeMobileSafeAreaLayout = ReturnType<typeof getChatRuntimeMobileSafeAreaLayoutState>;

type ChatRuntimeMobileSafeAreaStyleSlots = {
  chatScrollContent: StyleProp<ViewStyle>;
  scrollToBottomButton: StyleProp<ViewStyle>;
  voiceOverlay: StyleProp<ViewStyle>;
  inputArea: StyleProp<ViewStyle>;
};

type ChatRuntimeSafeAreaMergedStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  scrollViewportContentContainerStyle: ChatMessageScrollViewportProps['contentContainerStyle'];
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  inputDock: ChatComposerInputDockStyles;
};

type ChatComposerSpeechPreviewStyles = {
  box: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  text: StyleProp<TextStyle>;
};

type ChatComposerSpeechPreviewProps = {
  label: string;
  text?: string | null;
  styles: ChatComposerSpeechPreviewStyles;
};

type ChatComposerPendingImageItem = {
  id: string;
  previewUri: string;
};

type ChatComposerPendingImagesRailStyles = {
  row: StyleProp<ViewStyle>;
  card: StyleProp<ViewStyle>;
  preview: StyleProp<ImageStyle>;
  removeButton: StyleProp<ViewStyle>;
};

type ChatComposerPendingImagesRailProps = {
  images: readonly ChatComposerPendingImageItem[];
  renderState: ChatImageAttachmentMobileRenderState;
  onRemove: (imageId: string) => void;
  styles: ChatComposerPendingImagesRailStyles;
};

type ChatComposerVoiceOverlayStyles = {
  overlay: StyleProp<ViewStyle>;
  card: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  transcript: StyleProp<TextStyle>;
};

type ChatComposerVoiceOverlayProps = {
  isVisible: boolean;
  label: string;
  transcript?: string | null;
  transcriptNumberOfLines: number;
  styles: ChatComposerVoiceOverlayStyles;
};

type ChatComposerHandsFreeControlsStyles = {
  statusRow: StyleProp<ViewStyle>;
  controlsRow: StyleProp<ViewStyle>;
  controlButton: StyleProp<ViewStyle>;
  controlButtonText: StyleProp<TextStyle>;
};

type ChatComposerHandsFreeControlsProps = {
  isVisible: boolean;
  status: ReactNode;
  controlState: HandsFreeComposerControlState;
  onWake: (event: GestureResponderEvent) => void;
  onSleep: (event: GestureResponderEvent) => void;
  onResume: (event: GestureResponderEvent) => void;
  onPause: (event: GestureResponderEvent) => void;
  controlPressedOpacity: number;
  styles: ChatComposerHandsFreeControlsStyles;
};

type ChatComposerHandsFreeRuntimeStatusProps = ComponentProps<typeof HandsFreeStatusChip>;

type ChatComposerRuntimeHandsFreeControlsProps =
  Omit<ChatComposerHandsFreeControlsProps, 'status' | 'styles'>
  & {
    status: ChatComposerHandsFreeRuntimeStatusProps;
  };

type ChatComposerIconButtonRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  ariaChecked?: boolean;
  isActive?: boolean;
  icon: ChatMessageActionIcon;
};

type ChatComposerIconButtonProps = {
  shouldRender?: boolean;
  renderState: ChatComposerIconButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
};

type ChatComposerLabeledActionRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  isDisabled?: boolean;
  label: string;
  icon: ChatMessageActionIcon;
};

type ChatComposerLabeledActionButtonStyles = {
  button: StyleProp<ViewStyle>;
  disabledButton: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatComposerLabeledActionButtonProps = {
  shouldRender?: boolean;
  renderState: ChatComposerLabeledActionRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  styles: ChatComposerLabeledActionButtonStyles;
};

type ChatComposerMicButtonRenderState = ChatComposerIconButtonRenderState & {
  ariaBusy?: boolean;
  label: string;
  labelSelectable?: boolean;
};

type ChatComposerMicButtonStyles = {
  button: StyleProp<ViewStyle>;
  activeButton: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  activeLabel: StyleProp<TextStyle>;
};

type ChatComposerMicButtonProps = {
  renderState: ChatComposerMicButtonRenderState;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  onPress?: (event: GestureResponderEvent) => void;
  webPressedStyle?: StyleProp<ViewStyle>;
  styles: ChatComposerMicButtonStyles;
};

type ChatComposerTextEntryStyles = {
  input: StyleProp<TextStyle>;
  visuallyHiddenHint: StyleProp<TextStyle>;
};

type ChatComposerTextEntryWebAccessibility = {
  isWebPlatform: boolean;
  inputDescriptionNativeId: string;
  voiceStatusLiveRegionNativeId: string;
  voiceStatusLiveRegionPoliteness: ComponentProps<typeof Text>['accessibilityLiveRegion'];
};

type ChatComposerTextEntryProps = {
  inputRef?: Ref<TextInput>;
  value: string;
  onChangeText: ComponentProps<typeof TextInput>['onChangeText'];
  onKeyPress?: ComponentProps<typeof TextInput>['onKeyPress'];
  accessibilityLabel: string;
  accessibilityHint: string;
  placeholder: string;
  placeholderTextColor: string;
  voiceStatusLiveRegionAnnouncement: string;
  webAccessibility: ChatComposerTextEntryWebAccessibility;
  styles: ChatComposerTextEntryStyles;
};

type ChatComposerInputDockStyles = {
  area: StyleProp<ViewStyle>;
  row: StyleProp<ViewStyle>;
  micWrapper: StyleProp<ViewStyle>;
};

type ChatComposerInputDockProps = {
  speechPreview: ReactNode;
  pendingImagesRail: ReactNode;
  handsFreeControls: ReactNode;
  imageAttachmentControl: ReactNode;
  textToSpeechControl: ReactNode;
  editBeforeSendControl: ReactNode;
  textEntry: ReactNode;
  queueAction: ReactNode;
  submitAction: ReactNode;
  micButton: ReactNode;
  micWrapperRef?: Ref<View>;
  styles: ChatComposerInputDockStyles;
};

type ChatMessageSurfaceProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  toneStyle?: StyleProp<ViewStyle>;
};

type ChatMessageThreadItemProps = {
  children: ReactNode;
  leadingActivity?: ReactNode;
  trailingActivity?: ReactNode;
};

type ChatMessageThreadSurfaceProps = ChatMessageThreadItemProps & {
  surfaceStyle: StyleProp<ViewStyle>;
  surfaceToneStyle?: StyleProp<ViewStyle>;
};

type ChatMessageToolActivityGroupThreadSurfaceProps = Omit<
  ChatMessageThreadSurfaceProps,
  'leadingActivity' | 'trailingActivity' | 'surfaceStyle'
> & {
  groupRenderState?: ToolActivityGroupMobileRenderState | null;
  onToggleGroup?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
};

type ChatMessageInlineActivityProps = {
  renderState: ChatRuntimeInlineActivityMobileRenderState;
  spinnerSource: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  spinnerStyle: StyleProp<ImageStyle>;
};

type ChatMessageInlineActivityPropsInput = Pick<ChatMessageInlineActivityProps, 'spinnerSource'> & {
  message?: ChatRuntimeInlineActivityMobileMessageLike | null;
  isResponding: boolean;
};

type ChatMessageContentRowProps = {
  children: ReactNode;
  slots: readonly ChatMessageActionSlot[];
  components: Record<ChatMessageActionSlot, ReactNode>;
  rowStyle: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
};

type ChatMessageConversationContentState = Pick<
  ChatMessageContentRenderState,
  'shouldRenderExpandedContent' | 'shouldRenderCollapsedTextPreview'
>;

type ChatMessageStreamingContentRenderState = {
  shouldRender: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  title: string;
  badgeLabel: string;
  content: string;
  icon: ChatMessageActionIcon;
  spinner: {
    resizeMode: ComponentProps<typeof Image>['resizeMode'];
  };
  surface: {
    titleNumberOfLines: number;
  };
};

type ChatMessageExpandedContentStyles = {
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  spinner: StyleProp<ImageStyle>;
  badge: StyleProp<ViewStyle>;
  badgeText: StyleProp<TextStyle>;
  bodyRow: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  caret: StyleProp<ViewStyle>;
};

type ChatMessageExpandedContentProps = {
  streamingRenderState: ChatMessageStreamingContentRenderState;
  markdownContent: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
  spinnerSource: ImageSourcePropType;
  streamingStyles: ChatMessageExpandedContentStyles;
};

type ChatMessageCollapsedPreviewRenderState = {
  accessibilityRole: AccessibilityRole;
  hitSlop?: number | Insets;
  numberOfLines: number;
  text: string;
};

type ChatMessageCollapsedPreviewProps = {
  renderState: ChatMessageCollapsedPreviewRenderState;
  actionState: ChatMessageCollapsedPreviewMobileActionState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageCollapsedPreviewPropsInput = Pick<
  ChatMessageCollapsedPreviewProps,
  'renderState' | 'actionState'
> & {
  onToggle?: ChatMessageCollapsedPreviewProps['onPress'];
};

type ChatMessageConversationContentProps = {
  contentState: ChatMessageConversationContentState;
  rowStyle: StyleProp<ViewStyle>;
  slots: readonly ChatMessageActionSlot[];
  components: Record<ChatMessageActionSlot, ReactNode>;
  expanded: ChatMessageExpandedContentProps & {
    bodyStyle: StyleProp<ViewStyle>;
  };
  collapsed: ChatMessageCollapsedPreviewProps;
};

type ChatMessageChromeStyleSource = Record<
  string,
  StyleProp<ViewStyle> | StyleProp<TextStyle> | StyleProp<ImageStyle>
>;

type ChatComposerStyleSlots = {
  speechPreview: ChatComposerSpeechPreviewStyles;
  pendingImagesRail: ChatComposerPendingImagesRailStyles;
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  handsFreeControls: ChatComposerHandsFreeControlsStyles;
  accessoryButton: Pick<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  textEntry: ChatComposerTextEntryStyles;
  queueAction: ChatComposerLabeledActionButtonStyles;
  submitAction: ChatComposerLabeledActionButtonStyles;
  micButton: ChatComposerMicButtonStyles;
  inputDock: ChatComposerInputDockStyles;
};

type ChatComposerRuntimeDockStyleSlots = ChatComposerStyleSlots;

type ChatComposerRuntimeChromeStyleStateInput = {
  colors:
    & Parameters<typeof getChatComposerMobileSurfaceRenderState>[0]['colors']
    & Parameters<typeof getChatImageAttachmentMobileRenderState>[0]['colors']
    & Parameters<typeof getPromptLibraryMobileSurfaceRenderState>[0]['colors']
    & Parameters<typeof getHandsFreeComposerMobileSurfaceRenderState>[0]['colors'];
  platform: Parameters<typeof getChatComposerMobileSurfaceRenderState>[0]['platform'];
};

export type ChatComposerRuntimeChromeStyleState = {
  composer: ReturnType<typeof getChatComposerMobileSurfaceRenderState>;
  imageAttachment: ReturnType<typeof getChatImageAttachmentMobileRenderState>;
  promptLibrary: ReturnType<typeof getPromptLibraryMobileSurfaceRenderState>;
  promptEditorInputPaddingVertical: ReturnType<typeof getPromptLibraryEditorInputPaddingVertical>;
  handsFree: ReturnType<typeof getHandsFreeComposerMobileSurfaceRenderState>;
};

type ChatRuntimeMobileChromeStyleStateInput = {
  colors:
    & Parameters<typeof getChatRuntimeHeaderChromeMobileStyleRenderState>[0]['colors']
    & Parameters<typeof getChatRuntimeConversationChromeMobileStyleRenderState>[0]['colors']
    & ChatComposerRuntimeChromeStyleStateInput['colors']
    & ChatMessageRuntimeThreadChromeStyleStateInput['colors'];
  platform: ChatComposerRuntimeChromeStyleStateInput['platform'];
};

export type ChatRuntimeMobileChromeStyleState = {
  header: ReturnType<typeof getChatRuntimeHeaderChromeMobileStyleRenderState>;
  conversation: ReturnType<typeof getChatRuntimeConversationChromeMobileStyleRenderState>;
  composer: ChatComposerRuntimeChromeStyleState;
  messageQueuePanelWrapper: ReturnType<typeof getMessageQueuePanelMobileWrapperRenderState>;
  headerActionButton: ReturnType<typeof createMinimumTouchTargetStyle>;
  headerEdgeActionButton: ReturnType<typeof createMinimumTouchTargetStyle>;
  headerPinButton: ReturnType<typeof createMinimumTouchTargetStyle>;
  thread: ChatMessageRuntimeThreadChromeStyleState;
};

type ChatComposerRuntimeDockProps = {
  speechPreview: Omit<ChatComposerSpeechPreviewProps, 'styles'>;
  pendingImagesRail: Omit<ChatComposerPendingImagesRailProps, 'styles'>;
  handsFreeControls: ChatComposerRuntimeHandsFreeControlsProps;
  imageAttachmentControl: Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  textToSpeechControl: Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  editBeforeSendControl: Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  textEntry: Omit<ChatComposerTextEntryProps, 'styles'>;
  queueAction: Omit<ChatComposerLabeledActionButtonProps, 'styles'>;
  submitAction: Omit<ChatComposerLabeledActionButtonProps, 'styles'>;
  micButton: Omit<ChatComposerMicButtonProps, 'styles'>;
  micWrapperRef?: ChatComposerInputDockProps['micWrapperRef'];
  styles: ChatComposerRuntimeDockStyleSlots;
};

type ChatComposerRuntimeDockChromeProps = {
  handsFreeControls: Pick<ChatComposerRuntimeHandsFreeControlsProps, 'controlPressedOpacity'>;
  imageAttachmentControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  textToSpeechControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  editBeforeSendControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  textEntry: Pick<ChatComposerTextEntryProps, 'placeholderTextColor' | 'webAccessibility'>;
  queueAction: Pick<ChatComposerLabeledActionButtonProps, 'activeOpacity'>;
  submitAction: Pick<ChatComposerLabeledActionButtonProps, 'activeOpacity'>;
  micButton: Pick<ChatComposerMicButtonProps, 'webPressedStyle'>;
};

type ChatComposerRuntimeDockChromeInput = {
  colors: Parameters<typeof getChatComposerMobileSurfaceRenderState>[0]['colors']
    & Parameters<typeof getHandsFreeComposerMobileSurfaceRenderState>[0]['colors'];
  platform: Parameters<typeof getChatComposerMobileSurfaceRenderState>[0]['platform'];
  isWebPlatform: boolean;
};

type ChatComposerRuntimeControlRenderStateColors =
  Parameters<typeof getChatComposerImageAttachmentMobileRenderState>[0]['colors']
  & Parameters<typeof getChatComposerTextToSpeechMobileRenderState>[0]['colors']
  & Parameters<typeof getChatComposerEditBeforeSendMobileRenderState>[0]['colors']
  & Parameters<typeof getChatComposerQueueMobileRenderState>[0]['colors']
  & Parameters<typeof getChatComposerSubmitMobileRenderState>[0]['colors']
  & Parameters<typeof getChatComposerMicMobileRenderState>[0]['colors'];

type ChatComposerRuntimeControlRenderStateInput = {
  hasContent?: boolean;
  handsFree?: boolean;
  presentation: FollowUpInputPresentation;
  pendingImageCount?: number | null;
  ttsEnabled?: boolean;
  editBeforeSendEnabled?: boolean;
  micPhase: Parameters<typeof getHandsFreeMicButtonLabel>[0]['phase'];
  listening?: boolean;
  messageQueueEnabled?: boolean;
  colors: ChatComposerRuntimeControlRenderStateColors;
};

type ChatComposerRuntimeFollowUpPresentationStateInput = {
  conversationState?: AgentConversationState | null;
  isResponding?: boolean;
  isQueueEnabled?: boolean;
};

type ChatComposerRuntimeControlRenderState = {
  actionAvailability: ReturnType<typeof getChatComposerMobileActionAvailabilityRenderState>;
  visibility: ReturnType<typeof getChatComposerMobileVisibilityRenderState>;
  imageAttachment: ReturnType<typeof getChatComposerImageAttachmentMobileRenderState>;
  textToSpeech: ReturnType<typeof getChatComposerTextToSpeechMobileRenderState>;
  editBeforeSend: ReturnType<typeof getChatComposerEditBeforeSendMobileRenderState>;
  queueAction: ReturnType<typeof getChatComposerQueueMobileRenderState>;
  submitAction: ReturnType<typeof getChatComposerSubmitMobileRenderState>;
  micButton: ReturnType<typeof getChatComposerMicMobileRenderState>;
};

type ChatComposerRuntimeDockChromePropsInput = {
  chrome: ChatComposerRuntimeDockChromeProps;
  speechPreviewText: ChatComposerSpeechPreviewProps['text'];
  pendingImages: ChatComposerPendingImagesRailProps['images'];
  pendingImagesColors: Parameters<typeof getChatImageAttachmentMobileRenderState>[0]['colors'];
  onRemovePendingImage: ChatComposerPendingImagesRailProps['onRemove'];
  handsFreeStatusPhase: ChatComposerRuntimeHandsFreeControlsProps['status']['phase'];
  handsFreeStatusLabel: ChatComposerRuntimeHandsFreeControlsProps['status']['label'];
  handsFreeStatusEnabled: boolean;
  handsFreeStatusWakePhrase: Parameters<typeof getHandsFreeStatusSubtitle>[0]['wakePhrase'];
  handsFreeStatusSleepPhrase: Parameters<typeof getHandsFreeStatusSubtitle>[0]['sleepPhrase'];
  handsFreeStatusLastError: Parameters<typeof getHandsFreeStatusSubtitle>[0]['lastError'];
  handsFreeStatusForegroundOnly: Parameters<typeof getHandsFreeStatusSubtitle>[0]['foregroundOnly'];
  onWakeHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onWake'];
  onSleepHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onSleep'];
  onResumeHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onResume'];
  onPauseHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onPause'];
  composerControlHasContent: ChatComposerRuntimeControlRenderStateInput['hasContent'];
  composerControlPresentation: ChatComposerRuntimeControlRenderStateInput['presentation'];
  composerControlPendingImageCount: ChatComposerRuntimeControlRenderStateInput['pendingImageCount'];
  composerControlTtsEnabled: ChatComposerRuntimeControlRenderStateInput['ttsEnabled'];
  composerControlEditBeforeSendEnabled: ChatComposerRuntimeControlRenderStateInput['editBeforeSendEnabled'];
  composerControlMicPhase: ChatComposerRuntimeControlRenderStateInput['micPhase'];
  composerControlListening: ChatComposerRuntimeControlRenderStateInput['listening'];
  composerControlMessageQueueEnabled: ChatComposerRuntimeControlRenderStateInput['messageQueueEnabled'];
  composerControlColors: ChatComposerRuntimeControlRenderStateInput['colors'];
  onImageAttachmentPress: ChatComposerIconButtonProps['onPress'];
  onTextToSpeechPress: ChatComposerIconButtonProps['onPress'];
  onEditBeforeSendPress: ChatComposerIconButtonProps['onPress'];
  textEntryInputRef: ChatComposerTextEntryProps['inputRef'];
  textEntryValue: ChatComposerTextEntryProps['value'];
  onTextEntryChangeText: ChatComposerTextEntryProps['onChangeText'];
  onTextEntryKeyPress: ChatComposerTextEntryProps['onKeyPress'];
  textEntryHandsFree: Parameters<typeof createChatComposerAccessibilityHint>[0]['handsFree'];
  textEntryListening: Parameters<typeof createChatComposerAccessibilityHint>[0]['listening'];
  textEntryIsWebPlatform: NonNullable<Parameters<typeof createChatComposerAccessibilityHint>[0]['isWeb']>;
  textEntryWillCancel: Parameters<typeof createVoiceInputLiveRegionAnnouncement>[0]['willCancel'];
  textEntryLiveTranscript: Parameters<typeof createVoiceInputLiveRegionAnnouncement>[0]['liveTranscript'];
  textEntryWakePhrase: Parameters<typeof getHandsFreeComposerPlaceholder>[0]['wakePhrase'];
  textEntryPlaceholderFallback?: Parameters<typeof getHandsFreeComposerPlaceholder>[0]['fallback'];
  onQueueActionPress: ChatComposerLabeledActionButtonProps['onPress'];
  onSubmitActionPress: ChatComposerLabeledActionButtonProps['onPress'];
  onMicPressIn: ChatComposerMicButtonProps['onPressIn'];
  onMicPressOut: ChatComposerMicButtonProps['onPressOut'];
  onMicPress: ChatComposerMicButtonProps['onPress'];
  micWrapperRef?: ChatComposerInputDockProps['micWrapperRef'];
};

type ChatMessageThreadBodyStyleSlots = {
  retryStatus: ChatMessageRetryStatusStyles;
  delegationCard: ChatMessageDelegationCardStyles;
  toolApproval: ChatMessageToolApprovalStyles;
  inlineActivity: Pick<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'>;
  content: {
    rowStyle: ChatMessageConversationContentProps['rowStyle'];
    expandedBodyStyle: ChatMessageConversationContentProps['expanded']['bodyStyle'];
    streamingStyles: ChatMessageExpandedContentStyles;
    collapsedStyle: ChatMessageCollapsedPreviewProps['style'];
    collapsedPressedStyle: ChatMessageCollapsedPreviewProps['pressedStyle'];
    collapsedTextStyle: ChatMessageCollapsedPreviewProps['textStyle'];
  };
  toolExecutionStack: ChatMessageToolExecutionStackStyles;
  standaloneActions: Pick<ChatMessageStandaloneActionsProps, 'rowStyle'>;
};

type ChatMessageToolActivityGroupThreadSurfaceStyleSlots = {
  surfaceStyle: ChatMessageThreadSurfaceProps['surfaceStyle'];
  boundary: ChatMessageToolActivityGroupBoundaryStyles;
  getToneStyle: (toneStyleSlot: string) => ChatMessageThreadSurfaceProps['surfaceToneStyle'];
};

type ChatMessageThreadBodyContentProps =
  Omit<ChatMessageConversationContentProps, 'rowStyle' | 'expanded' | 'collapsed'>
  & {
    expanded: Omit<ChatMessageConversationContentProps['expanded'], 'bodyStyle' | 'streamingStyles'>;
    collapsed: Omit<ChatMessageConversationContentProps['collapsed'], 'style' | 'pressedStyle' | 'textStyle'>;
  };

type ChatMessageExpandedContentPropsInput = Pick<
  ChatMessageThreadBodyContentProps['expanded'],
  'markdownContent' | 'assetBaseUrl' | 'assetAuthToken' | 'spinnerSource'
> & {
  isStreaming: boolean;
  colors: Parameters<typeof getChatRuntimeStreamingContentMobileRenderState>[0]['colors'];
};

type ChatMessageConversationContentInput = {
  messageIndex: number;
  visibleMessageContent: string;
  isStreaming: ChatMessageExpandedContentPropsInput['isStreaming'];
  colors: ChatMessageExpandedContentPropsInput['colors'];
  assetBaseUrl?: ChatMessageExpandedContentPropsInput['assetBaseUrl'];
  assetAuthToken?: ChatMessageExpandedContentPropsInput['assetAuthToken'];
  spinnerSource: ChatMessageExpandedContentPropsInput['spinnerSource'];
  onToggleMessageExpansion: (messageIndex: number) => void;
};

type ChatMessageThreadBodyProps = {
  styles: ChatMessageThreadBodyStyleSlots;
  retryStatus?: Omit<ChatMessageRetryStatusProps, 'styles'> | null;
  delegationCard?: Omit<ChatMessageDelegationCardProps, 'styles'> | null;
  toolApproval?: Omit<ChatMessageToolApprovalProps, 'styles'> | null;
  inlineActivity?: Omit<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'> | null;
  conversation: {
    content: ChatMessageThreadBodyContentProps;
    toolExecutionStack: Omit<ChatMessageToolExecutionStackProps, 'styles'>;
    standaloneActions: Omit<ChatMessageStandaloneActionsProps, 'rowStyle'>;
  };
};

export type ChatMessageConversationBodyProps = ChatMessageThreadBodyProps['conversation'];

export type ChatMessageConversationBodyPropsInput = {
  messageRenderState: ChatMessageMobileRenderState;
  actionSet: Omit<ChatMessageActionSetInput, 'messageRenderState'>;
  expanded: ChatMessageExpandedContentPropsInput;
  collapsed: Pick<ChatMessageCollapsedPreviewPropsInput, 'onToggle'>;
  toolExecutionStack: ChatMessageToolExecutionStackPropsInput;
};

export type ChatMessageThreadBodyPropsInput =
  Pick<ChatMessageThreadBodyProps, 'inlineActivity'>
  & {
    retryStatus: ChatMessageRetryStatusPropsInput;
    delegationCard: ChatMessageDelegationCardPropsInput;
    toolApproval: ChatMessageToolApprovalPropsInput;
    conversation: ChatMessageConversationBodyPropsInput;
  };

type ChatMessageConversationThreadVisibilityInput = {
  renderContext: Pick<ChatMessageConversationRenderContext, 'shouldRenderSurface'>;
  body: Pick<ChatMessageThreadBodyPropsInput, 'inlineActivity'>;
};

type ChatMessageConversationThreadPresentationStateInput = {
  colors: Parameters<typeof getChatRuntimeDelegationCardMobileRenderState>[0]['colors']
    & Parameters<typeof getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots>[0]
    & Parameters<typeof getToolExecutionDetailMobileStyleRenderState>[0]['colors']
    & Parameters<typeof getToolExecutionDetailMobilePendingResultRenderState>[0]['colors'];
};

type ChatMessageConversationThreadPresentationState = {
  delegationSurface: ChatMessageConversationDelegationCardInput['surface'];
  delegationRoleStyles: ChatMessageConversationDelegationCardInput['roleStyles'];
  toolPayloadPreviewNumberOfLines: ChatMessageConversationToolExecutionStackInput['previewNumberOfLines'];
  pendingToolResultRenderState: ChatMessageConversationToolExecutionStackInput['pendingResultRenderState'];
  toolExecutionEmptyStateRenderState: ChatMessageConversationToolExecutionStackInput['emptyStateRenderState'];
};

type ChatMessageConversationTurnDurationInput = {
  message: {
    timestamp?: number;
  };
  byUserTimestamp: {
    get(timestamp: number): ChatMessageConversationActionSetInput['turnDuration'];
  };
};

type ChatMessageConversationThreadBodyInput = {
  message: ChatMessageConversationRenderContextInput['message']
    & ChatMessageConversationActionSetInput['message']
    & ChatMessageConversationRetryStatusInput['message']
    & ChatMessageConversationDelegationCardInput['message']
    & ChatMessageConversationToolApprovalInput['message']
    & ChatMessageConversationToolExecutionStackInput['message']
    & ChatMessageInlineActivityPropsInput['message']
    & ChatMessageConversationTurnDurationInput['message'];
  messageIndex: number;
  renderContext: ChatMessageConversationRenderContext;
  turnDurationsByUserTimestamp: ChatMessageConversationTurnDurationInput['byUserTimestamp'];
  conversationId?: ChatMessageConversationActionSetInput['conversationId'];
  pendingBranchMessageIndex?: ChatMessageConversationActionSetInput['pendingBranchMessageIndex'];
  isResponding: ChatMessageConversationActionSetInput['isResponding'];
  isSpeaking: ChatMessageConversationActionSetInput['isSpeaking'];
  isCopied: ChatMessageConversationActionSetInput['isCopied'];
  ttsEnabled: ChatMessageConversationActionSetInput['ttsEnabled'];
  colors: ChatMessageConversationActionSetInput['colors']
    & ChatMessageConversationRetryStatusInput['colors']
    & ChatMessageConversationDelegationCardInput['colors']
    & ChatMessageConversationToolApprovalInput['colors']
    & ChatMessageConversationContentInput['colors']
    & ChatMessageConversationToolExecutionStackInput['colors'];
  actionStyles: ChatMessageConversationActionSetInput['styles'];
  assetBaseUrl?: ChatMessageConversationContentInput['assetBaseUrl'];
  assetAuthToken?: ChatMessageConversationContentInput['assetAuthToken'];
  spinnerSource: ChatMessageConversationContentInput['spinnerSource'];
  presentation: ChatMessageConversationThreadPresentationState;
  expandedDelegationConversationPreviews: ChatMessageConversationDelegationCardInput['expandedDelegationConversationPreviews'];
  expandedDelegationToolPreviews: ChatMessageConversationDelegationCardInput['expandedDelegationToolPreviews'];
  setExpandedDelegationConversationPreviews: ChatMessageConversationDelegationCardInput['setExpandedDelegationConversationPreviews'];
  setExpandedDelegationToolPreviews: ChatMessageConversationDelegationCardInput['setExpandedDelegationToolPreviews'];
  expandedToolApprovals: ChatMessageConversationToolApprovalInput['expandedToolApprovals'];
  pendingApprovalResponseId?: ChatMessageConversationToolApprovalInput['pendingApprovalResponseId'];
  onToggleToolApprovalArguments: ChatMessageConversationToolApprovalInput['onToggleArguments'];
  onRespondToToolApproval: ChatMessageConversationToolApprovalInput['onRespondToToolApproval'];
  expandedToolCalls: ChatMessageConversationToolExecutionStackInput['expandedToolCalls'];
  onToggleToolCall: ChatMessageConversationToolExecutionStackInput['onToggleToolCall'];
  onCopyToolPayload: ChatMessageConversationToolExecutionStackInput['onCopyPayload'];
  onSpeakMessage: ChatMessageConversationActionSetInput['onSpeakMessage'];
  onBranchMessage?: ChatMessageConversationActionSetInput['onBranchMessage'];
  onCopyMessage: ChatMessageConversationActionSetInput['onCopyMessage'];
  onToggleMessageExpansion: ChatMessageConversationActionSetInput['onToggleMessageExpansion'];
};

type ChatMessageRuntimeThreadStyleSlots = {
  surface: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
  body: ChatMessageThreadBodyStyleSlots;
};

type ChatMessageConversationThreadStyleSlots = {
  runtimeThread: ChatMessageRuntimeThreadStyleSlots;
  actionSet: ChatMessageActionStyleSlots;
};

type ChatMessageRuntimeThreadProps = Omit<
  ChatMessageToolActivityGroupThreadSurfaceProps,
  'children' | 'styles' | 'surfaceToneStyle'
> & {
  body?: ChatMessageThreadBodyPropsInput | null;
  styles: ChatMessageRuntimeThreadStyleSlots;
};

type ChatMessageConversationToolActivityGroupThreadStateInput = {
  group?: ToolActivityGroup | null;
  groupRenderState?: ToolActivityGroupMobileRenderState | null;
  itemKey: string | number;
  onToggleGroup: (group: ToolActivityGroup) => void;
};

type ChatMessageConversationToolActivityGroupThreadState = {
  groupOnlyThreadKey: string | number;
  shouldRenderGroupOnlyThread: boolean;
  onToggleGroup?: ChatMessageRuntimeThreadProps['onToggleGroup'];
};

type ChatMessageConversationToolActivityGroupThreadRenderStateInput =
  ChatMessageConversationToolActivityGroupRenderStateInput
  & Pick<ChatMessageConversationToolActivityGroupThreadStateInput, 'itemKey' | 'onToggleGroup'>;

type ChatMessageConversationToolActivityGroupThreadRenderState = {
  groupRenderState: ToolActivityGroupMobileRenderState | null;
  groupThreadState: ChatMessageConversationToolActivityGroupThreadState;
  groupOnlyThreadState: ChatMessageConversationToolActivityGroupRuntimeThreadState;
};

type ChatMessageConversationRuntimeThreadStateInput = {
  itemKey: string | number;
  groupRenderState: ToolActivityGroupMobileRenderState | null;
  groupThreadState: ChatMessageConversationToolActivityGroupThreadState;
  body: ChatMessageThreadBodyPropsInput | null;
};

type ChatMessageConversationRuntimeThreadState =
  Pick<ChatMessageRuntimeThreadProps, 'groupRenderState' | 'onToggleGroup' | 'body'>
  & {
    threadKey: string | number;
  };

type ChatMessageConversationRenderableRuntimeThreadState =
  ChatMessageConversationRuntimeThreadState
  & {
    shouldRenderThread: boolean;
  };

type ChatMessageConversationRuntimeThreadProps = {
  threadState: ChatMessageConversationRenderableRuntimeThreadState;
  styles: ChatMessageRuntimeThreadStyleSlots;
};

type ChatMessageConversationToolActivityGroupRuntimeThreadStateInput =
  Omit<ChatMessageConversationRuntimeThreadStateInput, 'body'>;

type ChatMessageConversationToolActivityGroupRuntimeThreadState = ChatMessageConversationRenderableRuntimeThreadState;

type ChatMessageConversationMessageRuntimeThreadStateInput =
  Omit<ChatMessageConversationRuntimeThreadStateInput, 'body'>
  & {
    renderContext: ChatMessageConversationThreadVisibilityInput['renderContext'];
    body: ChatMessageThreadBodyPropsInput;
  };

type ChatMessageConversationMessageRuntimeThreadState = ChatMessageConversationRenderableRuntimeThreadState;

type ChatMessageConversationMessageThreadRenderStateInput =
  Omit<ChatMessageConversationThreadBodyInput, 'renderContext'>
  & Pick<
    ChatMessageConversationRenderContextInput,
    'lastConversationContentMessageIndex' | 'expandedMessages' | 'resultOnlyToolLabel'
  >
  & Pick<
    ChatMessageConversationMessageRuntimeThreadStateInput,
    'itemKey' | 'groupRenderState' | 'groupThreadState'
  >;

type ChatMessageConversationMessageThreadRenderState = {
  threadState: ChatMessageConversationMessageRuntimeThreadState;
};

type ChatMessageConversationItemThreadRenderStateInput =
  ChatMessageConversationToolActivityGroupThreadRenderStateInput
  & Omit<
    ChatMessageConversationMessageThreadRenderStateInput,
    'itemKey' | 'groupRenderState' | 'groupThreadState'
  >;

type ChatMessageConversationItemThreadRenderState = {
  threadState: ChatMessageConversationRenderableRuntimeThreadState;
};

type ChatMessageConversationThreadListRenderStateInput =
  Omit<
    ChatMessageConversationItemThreadRenderStateInput,
    | 'group'
    | 'itemIndex'
    | 'itemKey'
    | 'message'
    | 'messageIndex'
    | 'isSpeaking'
    | 'isCopied'
    | 'lastConversationContentMessageIndex'
  >
  & {
    allMessages: readonly ChatMessageConversationItemThreadRenderStateInput['message'][];
    messages: readonly ChatMessageConversationItemThreadRenderStateInput['message'][];
    firstMessageIndex: number;
    groupByIndex: ReadonlyMap<number, ToolActivityGroup>;
    speakingMessageIndex: number | null;
    copiedMessageIndex: number | null;
  };

type ChatMessageConversationHistoryWindowStateInput<TMessage> = {
  messages: readonly TMessage[];
  visibleMessageCount: number;
};

type ChatMessageConversationHistoryWindowState<TMessage> = {
  firstVisibleMessageIndex: number;
  visibleMessages: readonly TMessage[];
  hiddenMessageCount: number;
};

type ChatMessageConversationRuntimeThreadListRenderStateInput =
  Omit<
    ChatMessageConversationThreadListRenderStateInput,
    'allMessages' | 'messages' | 'firstMessageIndex' | 'presentation' | 'resultOnlyToolLabel'
  >
  & {
    resultOnlyToolLabel?: ChatMessageConversationThreadListRenderStateInput['resultOnlyToolLabel'];
  }
  & ChatMessageConversationHistoryWindowStateInput<
    ChatMessageConversationThreadListRenderStateInput['messages'][number]
  >;

type ChatMessageConversationRuntimeThreadListRenderState = {
  threadStates: ChatMessageConversationRenderableRuntimeThreadState[];
  visibleMessageCount: number;
  totalMessageCount: number;
  hiddenMessageCount: number;
};

type ChatMessageConversationRuntimeThreadListProps = {
  threadStates: readonly ChatMessageConversationRenderableRuntimeThreadState[];
  styles: ChatMessageRuntimeThreadStyleSlots;
};

export function ChatMessageActionIconButton({
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
}: ChatMessageActionIconButtonProps) {
  const mergedAccessibilityState = disabled
    ? { ...accessibilityState, disabled: true }
    : accessibilityState;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={mergedAccessibilityState}
      aria-expanded={ariaExpanded}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        style,
        isActive && activeStyle,
        pressed && !disabled && pressedStyle,
        disabled && disabledStyle,
      ]}
    >
      {icon.isPending ? (
        <ActivityIndicator
          size={icon.size}
          color={icon.color}
        />
      ) : (
        <Ionicons
          name={icon.name}
          size={icon.size}
          color={icon.color}
        />
      )}
    </Pressable>
  );
}

function renderChatMessageActionButton(
  spec: ChatMessageActionButtonSpec,
  canRender: boolean,
) {
  if (!canRender) return null;

  return (
    <ChatMessageActionIconButton
      onPress={spec.onPress}
      disabled={spec.renderState.isDisabled}
      accessibilityRole={spec.renderState.accessibilityRole}
      accessibilityLabel={spec.renderState.accessibilityLabel}
      accessibilityHint={spec.renderState.accessibilityHint ?? undefined}
      accessibilityState={spec.renderState.accessibilityState}
      ariaExpanded={spec.renderState.ariaExpanded}
      hitSlop={spec.hitSlop}
      style={spec.style}
      activeStyle={spec.activeStyle}
      pressedStyle={spec.pressedStyle}
      disabledStyle={spec.disabledStyle}
      isActive={spec.isActive}
      icon={spec.renderState.icon}
    />
  );
}

export function createChatMessageRenderState({
  toolEntries,
  ...input
}: ChatMessageRenderStateInput) {
  const { hasErrors } = getToolExecutionSummaryDisplayState(
    toolEntries.map(entry => entry.result),
  );

  return getChatMessageMobileRenderState({
    ...input,
    hasErrors,
  });
}

export function createChatMessageConversationRenderContext({
  message,
  messageIndex,
  isResponding,
  lastConversationContentMessageIndex,
  expandedMessages,
  resultOnlyToolLabel,
  colors,
}: ChatMessageConversationRenderContextInput): ChatMessageConversationRenderContext {
  const messageDisplayState = getChatMessageDisplayState(message, {
    resultOnlyToolLabel,
  });
  const visibleMessageContent = messageDisplayState.visibleContent;
  const renderedToolEntries = messageDisplayState.visibleToolEntries;
  const displayToolCallCount = messageDisplayState.displayToolCallCount;
  const isExpanded = getChatDisplayExpansionState(expandedMessages, messageIndex);
  const isLiveStreamingAssistantMessage = isChatMessageLiveStreamingConversationContent({
    isResponding,
    messageIndex,
    lastConversationContentMessageIndex,
    message,
    content: visibleMessageContent,
    displayToolCallCount,
  });
  const messageRenderState = createChatMessageRenderState({
    role: message.role,
    isComplete: !isResponding,
    isLast: messageIndex === lastConversationContentMessageIndex,
    toolEntries: renderedToolEntries,
    content: visibleMessageContent,
    isExpanded,
    shouldCollapse: messageDisplayState.shouldCollapse,
    isToolOnly: messageDisplayState.isToolOnly,
    isLiveStreaming: isLiveStreamingAssistantMessage,
    colors,
  });

  return {
    visibleMessageContent,
    renderedToolEntries,
    displayToolCallCount,
    isExpanded,
    isLiveStreamingAssistantMessage,
    messageRenderState,
    shouldRenderSurface: messageDisplayState.shouldRenderSurface,
  };
}

export function createChatMessageConversationToolActivityGroupRenderState({
  group,
  itemIndex,
  groupState,
  inheritedState,
  groupKey,
  inheritedKey,
  defaultExpanded,
  colors,
}: ChatMessageConversationToolActivityGroupRenderStateInput): ToolActivityGroupMobileRenderState | null {
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
    : null;
}

export function createChatMessageConversationToolActivityGroupThreadState({
  group,
  groupRenderState,
  itemKey,
  onToggleGroup,
}: ChatMessageConversationToolActivityGroupThreadStateInput): ChatMessageConversationToolActivityGroupThreadState {
  return {
    groupOnlyThreadKey: groupRenderState?.shouldRenderCollapsedHeader
      ? `group-${groupRenderState.groupKey}`
      : itemKey,
    shouldRenderGroupOnlyThread: !!groupRenderState
      && (groupRenderState.shouldSkipCollapsedItem || groupRenderState.shouldRenderCollapsedHeader),
    onToggleGroup: group ? () => onToggleGroup(group) : undefined,
  };
}

export function createChatMessageConversationToolActivityGroupThreadRenderState({
  group,
  itemKey,
  onToggleGroup,
  ...renderStateInput
}: ChatMessageConversationToolActivityGroupThreadRenderStateInput): ChatMessageConversationToolActivityGroupThreadRenderState {
  const groupRenderState = createChatMessageConversationToolActivityGroupRenderState({
    group,
    ...renderStateInput,
  });
  const groupThreadState = createChatMessageConversationToolActivityGroupThreadState({
    group,
    groupRenderState,
    itemKey,
    onToggleGroup,
  });

  return {
    groupRenderState,
    groupThreadState,
    groupOnlyThreadState: createChatMessageConversationToolActivityGroupRuntimeThreadState({
      itemKey,
      groupRenderState,
      groupThreadState,
    }),
  };
}

export function createChatMessageConversationRuntimeThreadState({
  itemKey,
  groupRenderState,
  groupThreadState,
  body,
}: ChatMessageConversationRuntimeThreadStateInput): ChatMessageConversationRuntimeThreadState {
  const isGroupOnlyThread = groupThreadState.shouldRenderGroupOnlyThread;

  return {
    threadKey: isGroupOnlyThread ? groupThreadState.groupOnlyThreadKey : itemKey,
    groupRenderState,
    onToggleGroup: groupThreadState.onToggleGroup,
    body: isGroupOnlyThread ? null : body,
  };
}

export function createChatMessageConversationToolActivityGroupRuntimeThreadState(
  runtimeThreadInput: ChatMessageConversationToolActivityGroupRuntimeThreadStateInput,
): ChatMessageConversationToolActivityGroupRuntimeThreadState {
  return {
    ...createChatMessageConversationRuntimeThreadState({
      ...runtimeThreadInput,
      body: null,
    }),
    shouldRenderThread: runtimeThreadInput.groupThreadState.shouldRenderGroupOnlyThread,
  };
}

export function shouldRenderChatMessageConversationThread({
  renderContext,
  body,
}: ChatMessageConversationThreadVisibilityInput): boolean {
  return renderContext.shouldRenderSurface || !!body.inlineActivity;
}

export function createChatMessageConversationMessageRuntimeThreadState({
  renderContext,
  ...runtimeThreadInput
}: ChatMessageConversationMessageRuntimeThreadStateInput): ChatMessageConversationMessageRuntimeThreadState {
  return {
    ...createChatMessageConversationRuntimeThreadState(runtimeThreadInput),
    shouldRenderThread: shouldRenderChatMessageConversationThread({
      renderContext,
      body: runtimeThreadInput.body,
    }),
  };
}

export function createChatMessageConversationMessageThreadRenderState({
  itemKey,
  groupRenderState,
  groupThreadState,
  lastConversationContentMessageIndex,
  expandedMessages,
  resultOnlyToolLabel,
  ...bodyInput
}: ChatMessageConversationMessageThreadRenderStateInput): ChatMessageConversationMessageThreadRenderState {
  const renderContext = createChatMessageConversationRenderContext({
    message: bodyInput.message,
    messageIndex: bodyInput.messageIndex,
    isResponding: bodyInput.isResponding,
    lastConversationContentMessageIndex,
    expandedMessages,
    resultOnlyToolLabel,
    colors: bodyInput.colors,
  });
  const body = createChatMessageConversationThreadBodyInput({
    ...bodyInput,
    renderContext,
  });

  return {
    threadState: createChatMessageConversationMessageRuntimeThreadState({
      itemKey,
      groupRenderState,
      groupThreadState,
      renderContext,
      body,
    }),
  };
}

export function createChatMessageConversationItemThreadRenderState({
  group,
  itemIndex,
  itemKey,
  groupState,
  inheritedState,
  groupKey,
  inheritedKey,
  defaultExpanded,
  onToggleGroup,
  ...messageThreadInput
}: ChatMessageConversationItemThreadRenderStateInput): ChatMessageConversationItemThreadRenderState {
  const {
    groupRenderState,
    groupThreadState,
    groupOnlyThreadState,
  } = createChatMessageConversationToolActivityGroupThreadRenderState({
    group,
    itemIndex,
    itemKey,
    groupState,
    inheritedState,
    groupKey,
    inheritedKey,
    defaultExpanded,
    colors: messageThreadInput.colors,
    onToggleGroup,
  });

  if (groupOnlyThreadState.shouldRenderThread) {
    return {
      threadState: groupOnlyThreadState,
    };
  }

  return createChatMessageConversationMessageThreadRenderState({
    itemKey,
    groupRenderState,
    groupThreadState,
    ...messageThreadInput,
  });
}

export function createChatMessageConversationHistoryWindowState<TMessage>({
  messages,
  visibleMessageCount,
}: ChatMessageConversationHistoryWindowStateInput<TMessage>): ChatMessageConversationHistoryWindowState<TMessage> {
  const firstVisibleMessageIndex = Math.max(0, messages.length - visibleMessageCount);

  return {
    firstVisibleMessageIndex,
    visibleMessages: messages.slice(firstVisibleMessageIndex),
    hiddenMessageCount: firstVisibleMessageIndex,
  };
}

export function createChatMessageConversationViewportAffordanceRenderState({
  visibleMessageCount,
  totalMessageCount,
  hiddenMessageCount,
  messageHistoryLoadIncrement,
  latestStepSummary,
  colors,
}: ChatMessageConversationViewportAffordanceRenderStateInput): ChatMessageConversationViewportAffordanceRenderState {
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
  };
}

export function createChatMessageRuntimeViewportContentRenderState({
  isLoadingMessages,
  messageCount,
}: ChatMessageRuntimeViewportContentRenderStateInput): ChatMessageRuntimeViewportContentRenderState {
  return {
    loading: getChatRuntimeLoadingStateMobileRenderState({
      isLoadingMessages,
      messageCount,
    }),
    homeQuickStarts: getChatRuntimeHomeQuickStartsMobileRenderState({
      isLoadingMessages,
      messageCount,
    }),
  };
}

export function createChatMessageRuntimeDebugPanelsRenderState({
  requestDebugText,
  voiceDebugEnabled = false,
  voiceEvents = [],
}: ChatMessageRuntimeDebugPanelsRenderStateInput): ChatRuntimeDebugPanelsMobileRenderState {
  const handsFreeCopy = getHandsFreeComposerCopyState();
  const resolvedVoiceEvents = voiceEvents ? Array.from(voiceEvents) : [];

  return getChatRuntimeDebugPanelsMobileRenderState({
    requestDebugText,
    voiceDebugEnabled,
    voiceEntryCount: resolvedVoiceEvents.length,
    voiceRows: [
      { key: 'voice-debug-title', text: handsFreeCopy.debug.voiceDebugTitle },
      ...resolvedVoiceEvents.slice(0, 6).map((entry) => ({
        key: entry.id,
        text: formatVoiceDebugEntry(entry),
      })),
    ],
  });
}

export function getChatMessageRuntimeHistoryWindowState(): ReturnType<typeof getChatRuntimeMessageHistoryWindowMobileState> {
  return getChatRuntimeMessageHistoryWindowMobileState();
}

export function getChatComposerImageAttachmentAlertState(
  input: ChatComposerImageAttachmentAlertInput,
): ReturnType<typeof getChatImageAttachmentMobileAlertState> {
  return getChatImageAttachmentMobileAlertState(input);
}

export function getChatComposerHandsFreeCopyState(): ReturnType<typeof getHandsFreeComposerCopyState> {
  return getHandsFreeComposerCopyState();
}

export type ChatComposerHandsFreeDebugMessageKey = Exclude<
  keyof ReturnType<typeof getHandsFreeComposerCopyState>['debug'],
  'voiceDebugTitle'
>;

export function getChatComposerHandsFreeDebugMessage(
  key: ChatComposerHandsFreeDebugMessageKey,
): string {
  return getHandsFreeComposerCopyState().debug[key];
}

export function formatChatComposerHandsFreeRecognizerErrorDebugMessage(
  ...args: Parameters<typeof formatHandsFreeRecognizerErrorDebugMessage>
): ReturnType<typeof formatHandsFreeRecognizerErrorDebugMessage> {
  return formatHandsFreeRecognizerErrorDebugMessage(...args);
}

export function formatChatComposerHandsFreeSleepingDebugMessage(
  ...args: Parameters<typeof formatHandsFreeSleepingDebugMessage>
): ReturnType<typeof formatHandsFreeSleepingDebugMessage> {
  return formatHandsFreeSleepingDebugMessage(...args);
}

export function getChatMessageRuntimeDebugState(): ReturnType<typeof getChatRuntimeDebugState> {
  return getChatRuntimeDebugState();
}

export type ChatMessageRuntimeDebugMessageKey = keyof ReturnType<typeof getChatRuntimeDebugState>;

export function getChatMessageRuntimeDebugMessage(
  key: ChatMessageRuntimeDebugMessageKey,
): string {
  return getChatRuntimeDebugState()[key];
}

export function formatChatMessageRuntimeAlertMessage(
  ...args: Parameters<typeof getChatRuntimeAlertMessage>
): ReturnType<typeof getChatRuntimeAlertMessage> {
  return getChatRuntimeAlertMessage(...args);
}

export function formatChatMessageRuntimeDebugError(
  ...args: Parameters<typeof formatChatRuntimeDebugError>
): ReturnType<typeof formatChatRuntimeDebugError> {
  return formatChatRuntimeDebugError(...args);
}

export function formatChatMessageRuntimeStartingRequestDebugMessage(
  ...args: Parameters<typeof formatChatRuntimeStartingRequestDebugMessage>
): ReturnType<typeof formatChatRuntimeStartingRequestDebugMessage> {
  return formatChatRuntimeStartingRequestDebugMessage(...args);
}

export function formatChatMessageRuntimeConnectionErrorMessage(
  ...args: Parameters<typeof formatChatRuntimeConnectionErrorMessage>
): ReturnType<typeof formatChatRuntimeConnectionErrorMessage> {
  return formatChatRuntimeConnectionErrorMessage(...args);
}

export function formatChatMessageRuntimeConnectionStatus(state: RecoveryState): string {
  return formatConnectionStatus(state);
}

export function formatChatMessageRuntimeAssistantErrorContent(
  ...args: Parameters<typeof formatChatRuntimeAssistantErrorContent>
): ReturnType<typeof formatChatRuntimeAssistantErrorContent> {
  return formatChatRuntimeAssistantErrorContent(...args);
}

export function formatChatMessageRuntimeWebConfirmMessage(
  ...args: Parameters<typeof formatChatRuntimeWebConfirmMessage>
): ReturnType<typeof formatChatRuntimeWebConfirmMessage> {
  return formatChatRuntimeWebConfirmMessage(...args);
}

export function formatChatMessageRuntimeAssistantFeedbackContent(
  thinkingContent: string | null | undefined,
  hasToolActivity: boolean,
): string {
  return formatChatRuntimeAssistantFeedbackContent(thinkingContent, hasToolActivity);
}

export function formatChatMessageRuntimeActivityContent(
  step?: ChatRuntimeActivityStepLike | null,
): string {
  return formatChatRuntimeActivityContent(step);
}

export type ChatMessageRuntimeAssistantTextMessage = {
  role: 'assistant';
  content: string;
};

export function createChatMessageRuntimeAssistantTextMessage(
  content: string,
): ChatMessageRuntimeAssistantTextMessage {
  return {
    role: 'assistant',
    content,
  };
}

export function createChatMessageRuntimeAssistantPlaceholderMessage(): ChatMessageRuntimeAssistantTextMessage {
  return createChatMessageRuntimeAssistantTextMessage('');
}

export function createChatMessageRuntimeAssistantDebugErrorMessage(
  message: string,
): ChatMessageRuntimeAssistantTextMessage {
  return createChatMessageRuntimeAssistantTextMessage(formatChatMessageRuntimeDebugError(message));
}

export type ChatMessageRuntimeAssistantFeedbackMessage<TToolCall, TToolResult> = {
  role: 'assistant';
  content: string;
  toolCalls?: TToolCall[];
  toolResults?: TToolResult[];
};

export type ChatMessageRuntimeAssistantFeedbackMessageInput<TToolCall, TToolResult> = {
  thinkingContent: string | null | undefined;
  hasToolActivity: boolean;
  toolCalls?: TToolCall[];
  toolResults?: TToolResult[];
};

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
    role: 'assistant',
    content: formatChatMessageRuntimeAssistantFeedbackContent(thinkingContent, hasToolActivity),
    ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
    ...(toolResults && toolResults.length > 0 ? { toolResults } : {}),
  };
}

export type ChatMessageRuntimeActivityMessage = {
  role: 'assistant';
  content: string;
};

export function createChatMessageRuntimeActivityMessage(
  step?: ChatRuntimeActivityStepLike | null,
): ChatMessageRuntimeActivityMessage {
  return {
    role: 'assistant',
    content: formatChatMessageRuntimeActivityContent(step),
  };
}

export function formatChatMessageRuntimeToolApprovalRequiredContent(toolName: string): string {
  return formatChatRuntimeToolApprovalRequiredContent(toolName);
}

export type ChatMessageRuntimeToolApprovalLike = {
  toolName: string;
};

export type ChatMessageRuntimeToolApprovalRequiredMessage<
  TToolApproval extends ChatMessageRuntimeToolApprovalLike,
> = {
  role: 'assistant';
  content: string;
  variant: 'approval';
  toolApproval: TToolApproval;
};

export function createChatMessageRuntimeToolApprovalRequiredMessage<
  TToolApproval extends ChatMessageRuntimeToolApprovalLike,
>(
  toolApproval: TToolApproval,
): ChatMessageRuntimeToolApprovalRequiredMessage<TToolApproval> {
  return {
    role: 'assistant',
    content: formatChatMessageRuntimeToolApprovalRequiredContent(toolApproval.toolName),
    variant: 'approval',
    toolApproval,
  };
}

export function getChatMessageRuntimeLatestStepSummary<T extends ChatRuntimeStepSummaryLike>(
  input: { latestSummary?: T | null; stepSummaries?: T[] | null },
): T | null {
  return getChatRuntimeLatestStepSummary(input);
}

export function getChatMessageRuntimeKillSwitchAlertState(): ReturnType<
  typeof getChatRuntimeKillSwitchMobileAlertState
> {
  return getChatRuntimeKillSwitchMobileAlertState();
}

export function getChatMessageRuntimeKillSwitchConfirmationAlertState(
  alerts: ReturnType<typeof getChatRuntimeKillSwitchMobileAlertState> = getChatRuntimeKillSwitchMobileAlertState(),
): ChatMessageRuntimeKillSwitchConfirmationAlertState {
  return {
    title: alerts.confirmation.title,
    message: alerts.confirmation.message,
    confirmLabel: alerts.confirmation.confirmLabel,
    cancelLabel: alerts.confirmation.cancelLabel,
    webMessage: formatChatRuntimeWebConfirmMessage(
      alerts.confirmation.title,
      alerts.confirmation.message,
    ),
  };
}

export function getChatMessageRuntimeKillSwitchResultAlertState(
  result: ChatMessageRuntimeKillSwitchResultLike,
  alerts: ReturnType<typeof getChatRuntimeKillSwitchMobileAlertState> = getChatRuntimeKillSwitchMobileAlertState(),
): ChatMessageRuntimeKillSwitchResolvedAlertState {
  const alertState = result.success ? alerts.success : alerts.failed;
  const message = getChatRuntimeAlertMessage(
    result.success ? result.message : result.error,
    alertState.fallbackMessage,
  );

  return {
    title: alertState.title,
    message,
    webMessage: result.success ? message : `${alertState.title}: ${message}`,
  };
}

export function getChatMessageRuntimeKillSwitchConnectionFailedAlertState(
  error: unknown,
  alerts: ReturnType<typeof getChatRuntimeKillSwitchMobileAlertState> = getChatRuntimeKillSwitchMobileAlertState(),
): ChatMessageRuntimeKillSwitchResolvedAlertState {
  const message = getChatRuntimeAlertMessage(error, alerts.connectionFailed.fallbackMessage);

  return {
    title: alerts.connectionFailed.title,
    message,
    webMessage: `${alerts.connectionFailed.title}: ${message}`,
  };
}

export function getChatMessageRuntimeBranchAlertState(): ReturnType<
  typeof getChatRuntimeBranchMobileAlertState
> {
  return getChatRuntimeBranchMobileAlertState();
}

export function getChatMessageRuntimeBranchUnavailableAlertState(
  alerts: ReturnType<typeof getChatRuntimeBranchMobileAlertState> = getChatRuntimeBranchMobileAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alerts.unavailable.title,
    message: alerts.unavailable.message,
  };
}

export function getChatMessageRuntimeBranchCreatedAlertState(
  alerts: ReturnType<typeof getChatRuntimeBranchMobileAlertState> = getChatRuntimeBranchMobileAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alerts.created.title,
    message: alerts.created.message,
  };
}

export function getChatMessageRuntimeBranchFailedAlertState(
  error: unknown,
  alerts: ReturnType<typeof getChatRuntimeBranchMobileAlertState> = getChatRuntimeBranchMobileAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alerts.failed.title,
    message: getChatRuntimeAlertMessage(error, alerts.failed.fallbackMessage),
  };
}

export function getChatMessageRuntimeToolApprovalAlertState(): ReturnType<
  typeof getChatRuntimeToolApprovalMobileAlertState
> {
  return getChatRuntimeToolApprovalMobileAlertState();
}

export function getChatMessageRuntimeToolApprovalConnectionRequiredAlertState(
  alerts: ReturnType<typeof getChatRuntimeToolApprovalMobileAlertState> = getChatRuntimeToolApprovalMobileAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alerts.connectionRequired.title,
    message: alerts.connectionRequired.message,
  };
}

export function getChatMessageRuntimeToolApprovalUnavailableAlertState(
  alerts: ReturnType<typeof getChatRuntimeToolApprovalMobileAlertState> = getChatRuntimeToolApprovalMobileAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alerts.unavailable.title,
    message: alerts.unavailable.message,
  };
}

export function getChatMessageRuntimeToolApprovalFailedAlertState(
  error: unknown,
  alerts: ReturnType<typeof getChatRuntimeToolApprovalMobileAlertState> = getChatRuntimeToolApprovalMobileAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alerts.failed.title,
    message: getChatRuntimeAlertMessage(error, alerts.failed.fallbackMessage),
  };
}

export function createChatMessageRuntimeViewportChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  viewportContentIsLoadingMessages,
  viewportContentMessageCount,
  loadingSpinnerSource,
  quickStartItems,
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
  debugPanelsRenderState,
  ...scrollViewportProps
}: ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>): ChatMessageRuntimeViewportChromeProps<TPrompt, TTask> {
  const contentRenderState = createChatMessageRuntimeViewportContentRenderState({
    isLoadingMessages: viewportContentIsLoadingMessages,
    messageCount: viewportContentMessageCount,
  });
  const affordanceRenderState = createChatMessageConversationViewportAffordanceRenderState({
    visibleMessageCount,
    totalMessageCount,
    hiddenMessageCount,
    messageHistoryLoadIncrement,
    latestStepSummary,
    colors,
  });
  const shortcutRenderState = getPromptLibraryMobileShortcutRenderState(colors);
  const viewportRenderState = getChatRuntimeViewportMobileRenderState({ colors });

  return {
    ...scrollViewportProps,
    keyboardShouldPersistTaps: viewportRenderState.surface.keyboardShouldPersistTaps,
    contentInsetAdjustmentBehavior: viewportRenderState.surface.contentInsetAdjustmentBehavior,
    loadingState: {
      renderState: contentRenderState.loading,
      spinnerSource: loadingSpinnerSource,
    },
    homeQuickStarts: {
      shouldRender: contentRenderState.homeQuickStarts.shouldRender,
      items: quickStartItems,
      isLoading: isLoadingQuickStartPrompts,
      runningTaskId: runningPromptTaskId,
      onPress: onQuickStartPress,
      onEditPrompt,
      onDeletePrompt,
      shortcutRenderState,
    },
    historyBanner: {
      ...affordanceRenderState.historyBanner,
      onLoadEarlier: onLoadEarlierMessages,
    },
    stepSummary: affordanceRenderState.stepSummary,
    debugPanels: debugPanelsRenderState,
  };
}

export function createChatMessageRuntimeDockChromeProps({
  responseHistoryResponses,
  responseHistoryTtsProvider,
  responseHistoryRemoteTtsVoice,
  responseHistoryRemoteTtsModel,
  responseHistoryTtsRate,
  responseHistoryTtsPitch,
  responseHistoryTtsVoiceId,
  responseHistoryRemoteBaseUrl,
  responseHistoryRemoteApiKey,
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
}: ChatMessageRuntimeDockChromePropsInput): ChatMessageRuntimeDockChromeProps {
  const composerSurface = getChatComposerMobileSurfaceState();
  const voiceOverlayVisibility = getChatComposerMobileVisibilityRenderState({
    listening: voiceOverlayListening,
  });
  const voiceOverlayLabel = getChatComposerVoiceOverlayLabel({
    handsFree: voiceOverlayHandsFree,
    willCancel: voiceOverlayWillCancel,
  });
  const scrollToBottomRenderState = getChatRuntimeScrollToBottomMobileRenderState({
    isVisible: scrollToBottomVisible,
    colors,
  });
  const connectionBannerRenderState = getChatRuntimeConnectionBannerMobileRenderState({
    connectionState,
    lastFailedMessage,
    isResponding,
    colors,
  });
  const queuePanelDockRenderState = getMessageQueuePanelMobileDockRenderState({
    isQueueEnabled: queuePanelEnabled,
    messageCount: queuedMessages.length,
  });

  return {
    responseHistoryPanel: {
      responses: responseHistoryResponses,
      ttsProvider: responseHistoryTtsProvider,
      remoteTtsVoice: responseHistoryRemoteTtsVoice,
      remoteTtsModel: responseHistoryRemoteTtsModel,
      ttsRate: responseHistoryTtsRate,
      ttsPitch: responseHistoryTtsPitch,
      ttsVoiceId: responseHistoryTtsVoiceId,
      remoteBaseUrl: responseHistoryRemoteBaseUrl,
      remoteApiKey: responseHistoryRemoteApiKey,
    },
    scrollToBottomButton: {
      renderState: scrollToBottomRenderState,
      onPress: onScrollToBottom,
    },
    voiceOverlay: {
      isVisible: voiceOverlayVisibility.voiceOverlay.isVisible,
      label: voiceOverlayLabel,
      transcript: voiceOverlayTranscript,
      transcriptNumberOfLines: composerSurface.voiceOverlay.transcriptNumberOfLines,
    },
    queuePanel: {
      shouldRender: queuePanelDockRenderState.shouldRender,
      panel: {
        conversationId: queuePanelConversationId,
        messages: queuedMessages,
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
      renderState: connectionBannerRenderState,
      onRetry: onConnectionBannerRetry,
    },
    composer,
  };
}

export function createChatMessageRuntimeSurfaceChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
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
}: ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>): ChatMessageRuntimeSurfaceChromeProps<TPrompt, TTask> {
  const promptEditorRenderState = getPromptLibraryEditorMobileRenderState({ colors, platform });
  const keyboardAvoidingBehavior = getChatRuntimeViewportMobileKeyboardAvoidingBehavior(platform);

  return {
    frame: {
      keyboardAvoidingBehavior,
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
        renderState: promptEditorRenderState,
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
  };
}

export function createChatMessageConversationThreadListRenderState({
  allMessages,
  messages,
  firstMessageIndex,
  groupByIndex,
  speakingMessageIndex,
  copiedMessageIndex,
  ...threadInput
}: ChatMessageConversationThreadListRenderStateInput): ChatMessageConversationRenderableRuntimeThreadState[] {
  const lastConversationContentMessageIndex = findLastChatMessageConversationContentIndex(
    allMessages,
    (message) => message,
    (message) => hasVisibleChatMessageContent(message),
  );

  return messages.map((message, visibleIndex) => {
    const messageIndex = firstMessageIndex + visibleIndex;

    return createChatMessageConversationItemThreadRenderState({
      ...threadInput,
      lastConversationContentMessageIndex,
      group: groupByIndex.get(messageIndex),
      itemIndex: messageIndex,
      itemKey: messageIndex,
      message,
      messageIndex,
      isSpeaking: speakingMessageIndex === messageIndex,
      isCopied: copiedMessageIndex === messageIndex,
    }).threadState;
  });
}

export function createChatMessageConversationRuntimeThreadListRenderState({
  messages,
  visibleMessageCount,
  ...threadListInput
}: ChatMessageConversationRuntimeThreadListRenderStateInput): ChatMessageConversationRuntimeThreadListRenderState {
  const {
    firstVisibleMessageIndex,
    visibleMessages,
    hiddenMessageCount,
  } = createChatMessageConversationHistoryWindowState({
    messages,
    visibleMessageCount,
  });
  const presentation = createChatMessageConversationThreadPresentationState({
    colors: threadListInput.colors,
  });
  const resultOnlyToolLabel =
    threadListInput.resultOnlyToolLabel ?? getToolExecutionResultOnlyFallbackRenderState().label;

  return {
    threadStates: createChatMessageConversationThreadListRenderState({
      ...threadListInput,
      allMessages: messages,
      messages: visibleMessages,
      firstMessageIndex: firstVisibleMessageIndex,
      presentation,
      resultOnlyToolLabel,
    }),
    visibleMessageCount: visibleMessages.length,
    totalMessageCount: messages.length,
    hiddenMessageCount,
  };
}

export function createChatMessageConversationThreadPresentationState({
  colors,
}: ChatMessageConversationThreadPresentationStateInput): ChatMessageConversationThreadPresentationState {
  const delegationCardRenderState = getChatRuntimeDelegationCardMobileRenderState({
    colors,
  });
  const toolExecutionDetailStyleState = getToolExecutionDetailMobileStyleRenderState({
    colors,
  });

  return {
    delegationSurface: delegationCardRenderState.surface,
    delegationRoleStyles: getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots(colors),
    toolPayloadPreviewNumberOfLines: toolExecutionDetailStyleState.payloadPreview.numberOfLines,
    pendingToolResultRenderState: getToolExecutionDetailMobilePendingResultRenderState({
      colors,
    }),
    toolExecutionEmptyStateRenderState: getToolExecutionDetailMobileEmptyStateRenderState(),
  };
}

export function createChatMessageRuntimeThreadChromeStyleState({
  colors,
}: ChatMessageRuntimeThreadChromeStyleStateInput): ChatMessageRuntimeThreadChromeStyleState {
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
      toolName: '',
      colors,
    }),
    messageThread: getChatRuntimeMessageThreadMobileStyleRenderState({
      colors,
    }),
  };
}

export function getChatMessageConversationTurnDuration({
  message,
  byUserTimestamp,
}: ChatMessageConversationTurnDurationInput): ChatMessageConversationActionSetInput['turnDuration'] {
  return typeof message.timestamp === 'number'
    ? byUserTimestamp.get(message.timestamp)
    : undefined;
}

export function createChatMessageConversationActionSetInput({
  message,
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
}: ChatMessageConversationActionSetInput): Omit<ChatMessageActionSetInput, 'messageRenderState'> {
  return {
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
      onBranchMessage,
      ...styles.branch,
    },
    copy: {
      role: message.role,
      content: visibleMessageContent,
      isAssistantComplete: !isResponding,
      isCopied,
      colors,
      onPress: () => { void onCopyMessage(messageIndex, visibleMessageContent); },
      ...styles.copy,
    },
    expansion: {
      onPress: () => onToggleMessageExpansion(messageIndex),
      ...styles.expansion,
    },
  };
}

export function createChatMessageConversationContentInput({
  messageIndex,
  visibleMessageContent,
  isStreaming,
  colors,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  onToggleMessageExpansion,
}: ChatMessageConversationContentInput): Pick<ChatMessageConversationBodyPropsInput, 'expanded' | 'collapsed'> {
  return {
    expanded: {
      isStreaming,
      markdownContent: visibleMessageContent,
      colors,
      assetBaseUrl,
      assetAuthToken,
      spinnerSource,
    },
    collapsed: {
      onToggle: () => onToggleMessageExpansion(messageIndex),
    },
  };
}

export function createChatMessageConversationToolApprovalInput({
  message,
  expandedToolApprovals,
  pendingApprovalResponseId,
  colors,
  onToggleArguments,
  onRespondToToolApproval,
}: ChatMessageConversationToolApprovalInput): ChatMessageToolApprovalPropsInput {
  return {
    isApproval: message.variant === 'approval',
    toolApproval: message.toolApproval,
    expandedToolApprovals,
    pendingApprovalResponseId,
    colors,
    onToggleArguments,
    onDeny: (approvalId) => { void onRespondToToolApproval(approvalId, false); },
    onApprove: (approvalId) => { void onRespondToToolApproval(approvalId, true); },
  };
}

export function createChatMessageConversationDelegationCardInput({
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
}: ChatMessageConversationDelegationCardInput): ChatMessageDelegationCardPropsInput {
  return {
    isDelegation: message.variant === 'delegation',
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
      );
    },
    onShowAllToolPreview: (runId) => {
      setExpandedDelegationToolPreviews((current) =>
        setChatDisplayExpansionState(current, runId, true),
      );
    },
  };
}

export function createChatMessageConversationRetryStatusInput({
  message,
  colors,
}: ChatMessageConversationRetryStatusInput): ChatMessageRetryStatusPropsInput {
  return {
    isRetry: message.variant === 'retry',
    retryInfo: message.retryInfo,
    colors,
  };
}

export function createChatMessageConversationThreadBodyInput({
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
}: ChatMessageConversationThreadBodyInput): ChatMessageThreadBodyPropsInput {
  const {
    visibleMessageContent,
    renderedToolEntries,
    displayToolCallCount,
    isExpanded,
    isLiveStreamingAssistantMessage,
    messageRenderState,
  } = renderContext;
  const turnDuration = getChatMessageConversationTurnDuration({
    message,
    byUserTimestamp: turnDurationsByUserTimestamp,
  });

  return {
    retryStatus: createChatMessageConversationRetryStatusInput({
      message,
      colors,
    }),
    delegationCard: createChatMessageConversationDelegationCardInput({
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
    }),
    toolApproval: createChatMessageConversationToolApprovalInput({
      message,
      expandedToolApprovals,
      pendingApprovalResponseId,
      colors,
      onToggleArguments: onToggleToolApprovalArguments,
      onRespondToToolApproval,
    }),
    inlineActivity: createChatMessageInlineActivityProps({
      message,
      isResponding,
      spinnerSource,
    }),
    conversation: {
      messageRenderState,
      actionSet: createChatMessageConversationActionSetInput({
        message,
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
        styles: actionStyles,
        onSpeakMessage,
        onBranchMessage,
        onCopyMessage,
        onToggleMessageExpansion,
      }),
      ...createChatMessageConversationContentInput({
        messageIndex,
        visibleMessageContent,
        isStreaming: isLiveStreamingAssistantMessage,
        colors,
        assetBaseUrl,
        assetAuthToken,
        spinnerSource,
        onToggleMessageExpansion,
      }),
      toolExecutionStack: createChatMessageConversationToolExecutionStackInput({
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
  };
}

export function createChatMessageActionComponents({
  availability,
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
}: ChatMessageActionComponentsInput): Record<ChatMessageActionSlot, ReactNode> {
  return {
    turnDuration: availability.turnDuration.canRender ? (
      <ChatMessageTurnDurationBadge
        renderState={turnDuration.renderState}
        style={turnDuration.style}
        liveStyle={turnDuration.liveStyle}
        textStyle={turnDuration.textStyle}
        liveTextStyle={turnDuration.liveTextStyle}
      />
    ) : null,
    speech: renderChatMessageActionButton(speech, availability.speech.canRender),
    branch: renderChatMessageActionButton(branch, availability.branch.canRender),
    copy: renderChatMessageActionButton(copy, availability.copy.canRender),
    expansion: renderChatMessageActionButton(expansion, availability.expansion.canRender),
  };
}

export function createChatMessageActionSet({
  messageRenderState,
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
  ...input
}: ChatMessageActionSetInput): ChatMessageActionSet {
  const contentRenderState = messageRenderState.content;
  const turnDurationAction: ChatMessageTurnDurationActionSpec = {
    ...turnDuration,
    renderState: getChatRuntimeTurnDurationMessageMobileRenderState({
      role: turnDuration.role,
      durationMs: turnDuration.durationMs,
      isLive: turnDuration.isLive,
      colors: turnDuration.colors,
    }),
  };
  const speechAction: ChatMessageSpeechActionSpec = {
    ...speech,
    renderState: getChatMessageSpeechMobileRenderState({
      role: speech.role,
      content: speech.content,
      ttsEnabled: speech.ttsEnabled,
      isVisible: contentRenderState.speech.isVisible,
      isSpeaking: speech.isSpeaking,
      colors: speech.colors,
    }),
    isActive: speech.isSpeaking,
  };
  const {
    onBranchMessage,
    conversationId,
    role: branchRole,
    branchMessageIndex,
    fallbackMessageIndex,
    pendingMessageIndex,
    colors: branchColors,
    ...branchStyleProps
  } = branch;
  const branchRenderState = getChatRuntimeBranchMobileRenderState({
    conversationId,
    role: branchRole,
    branchMessageIndex,
    fallbackMessageIndex,
    pendingMessageIndex,
    colors: branchColors,
  });
  const branchAction: ChatMessageBranchActionSpec = {
    ...branchStyleProps,
    renderState: branchRenderState,
    onPress: () => {
      if (branchRenderState.messageIndex != null) {
        onBranchMessage?.(branchRenderState.messageIndex);
      }
    },
  };
  const copyAction: ChatMessageCopyActionSpec = {
    ...copy,
    renderState: getChatMessageCopyMobileRenderState({
      role: copy.role,
      content: copy.content,
      isAssistantComplete: copy.isAssistantComplete,
      isCopied: copy.isCopied,
      colors: copy.colors,
    }),
    isActive: copy.isCopied,
  };
  const actionInput: Omit<ChatMessageActionComponentsInput, 'availability'> = {
    ...input,
    turnDuration: turnDurationAction,
    speech: speechAction,
    branch: branchAction,
    copy: copyAction,
    expansion: {
      ...expansion,
      renderState: messageRenderState.expansion,
    },
  };
  const availability = getChatMessageActionAvailabilityRenderState({
    turnDuration: actionInput.turnDuration.renderState.shouldRender,
    speech: actionInput.speech.renderState.canSpeak,
    branch: actionInput.branch.renderState.canBranch,
    copy: actionInput.copy.renderState.canCopy,
    expansion: actionInput.expansion.renderState.canToggle,
  });
  const components = createChatMessageActionComponents({
    availability,
    ...actionInput,
  });
  const layout = getChatMessageActionLayoutRenderState({
    availability,
    renderState: contentRenderState,
  });

  return {
    components,
    visibleSlots: layout.visibleSlots,
    shouldRenderStandaloneActions: layout.shouldRenderStandaloneRow,
  };
}

export function getChatMessageCopyFeedbackState(): ChatMessageCopyFeedbackState {
  const copyState = getChatMessageActionCopyState().copy;

  return {
    feedbackResetDelayMs: copyState.feedbackResetDelayMs,
    failedTitle: copyState.failedTitle,
    failedMessage: copyState.failedMessage,
  };
}

export function getChatMessageCopyFeedbackResetDelayMs(): number {
  return getChatMessageCopyFeedbackState().feedbackResetDelayMs;
}

export function getChatMessageCopyFailureAlertState(
  error: unknown,
  feedbackState: ChatMessageCopyFeedbackState = getChatMessageCopyFeedbackState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: feedbackState.failedTitle,
    message: getChatRuntimeAlertMessage(error, feedbackState.failedMessage),
  };
}

export function getChatMessageToolExecutionCopyFailureAlertState(): ReturnType<
  typeof getToolExecutionDetailCopyFailureAlertState
> {
  return getToolExecutionDetailCopyFailureAlertState();
}

export function getChatMessageToolExecutionCopyFailureResolvedAlertState(
  error: unknown,
  alertState: ReturnType<typeof getToolExecutionDetailCopyFailureAlertState> = getToolExecutionDetailCopyFailureAlertState(),
): ChatMessageRuntimeResolvedAlertState {
  return {
    title: alertState.title,
    message: getChatRuntimeAlertMessage(error, alertState.fallbackMessage),
  };
}

export function createChatMessageConversationBodyProps({
  messageRenderState,
  actionSet: actionSetInput,
  expanded,
  collapsed,
  toolExecutionStack,
}: ChatMessageConversationBodyPropsInput): ChatMessageConversationBodyProps {
  const contentState = messageRenderState.content;
  const actionSet = createChatMessageActionSet({
    messageRenderState,
    ...actionSetInput,
  });

  return {
    content: {
      contentState,
      slots: actionSet.visibleSlots,
      components: actionSet.components,
      expanded: createChatMessageExpandedContentProps(expanded),
      collapsed: createChatMessageCollapsedPreviewProps({
        renderState: messageRenderState.collapsedPreview,
        actionState: messageRenderState.collapsedPreviewAction,
        ...collapsed,
      }),
    },
    toolExecutionStack: createChatMessageToolExecutionStackProps(toolExecutionStack),
    standaloneActions: {
      shouldRender: actionSet.shouldRenderStandaloneActions,
      slots: actionSet.visibleSlots,
      components: actionSet.components,
    },
  };
}

export function createChatMessageThreadBodyProps({
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyPropsInput): Omit<ChatMessageThreadBodyProps, 'styles'> {
  return {
    retryStatus: createChatMessageRetryStatusProps(retryStatus),
    delegationCard: createChatMessageDelegationCardProps(delegationCard),
    toolApproval: createChatMessageToolApprovalProps(toolApproval),
    inlineActivity: inlineActivity ?? null,
    conversation: createChatMessageConversationBodyProps(conversation),
  };
}

export function createChatMessageRetryStatusProps({
  isRetry,
  retryInfo,
  colors,
}: ChatMessageRetryStatusPropsInput): ChatMessageThreadBodyProps['retryStatus'] {
  if (!isRetry) return null;

  const renderState = getChatRuntimeRetryStatusMobileRenderState({
    retryInfo,
    colors,
  });

  return renderState.shouldRender
    ? {
        renderState,
      }
    : null;
}

export function createChatMessageDelegationCardProps({
  isDelegation,
  surface,
  delegation,
  toolEntries,
  displayToolCallCount,
  expandedDelegationConversationPreviews,
  expandedDelegationToolPreviews,
  roleStyles,
  colors,
  onShowAllConversationPreview,
  onShowAllToolPreview,
}: ChatMessageDelegationCardPropsInput): ChatMessageThreadBodyProps['delegationCard'] {
  if (!isDelegation || !delegation) return null;

  const isConversationPreviewExpanded = getChatDisplayExpansionState(
    expandedDelegationConversationPreviews,
    delegation.runId,
  );
  const isToolPreviewExpanded = getChatDisplayExpansionState(
    expandedDelegationToolPreviews,
    delegation.runId,
  );
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
  );
  const { presentation } = cardState;
  const messageCount = presentation.messageCount ?? 0;
  const conversationPreviewState = cardState.conversationPreview;
  const hiddenConversationCount = conversationPreviewState.hiddenCount;
  const toolPreviewState = cardState.toolPreview;
  const hiddenToolCount = toolPreviewState.hiddenCount;
  const toolExecutionVisibilityRenderState = getToolExecutionMobileVisibilityRenderState({
    toolCallCount: displayToolCallCount,
  });

  return {
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
      onShowAll: onShowAllConversationPreview
        ? () => onShowAllConversationPreview(delegation.runId)
        : undefined,
    },
    toolPreview: {
      shouldRender: toolExecutionVisibilityRenderState.toolPreview.shouldRender,
      label: formatChatRuntimeDelegationToolCallActivityLabel(displayToolCallCount),
      rows: createChatMessageDelegationToolPreviewRows({
        rows: toolPreviewState.rows,
        colors,
      }),
      hiddenCount: hiddenToolCount,
      moreAction: getChatRuntimeDelegationToolPreviewMoreActionState(hiddenToolCount),
      onShowAll: onShowAllToolPreview
        ? () => onShowAllToolPreview(delegation.runId)
        : undefined,
    },
  };
}

export function createChatMessageToolApprovalProps({
  isApproval,
  toolApproval,
  expandedToolApprovals,
  pendingApprovalResponseId,
  colors,
  onToggleArguments,
  onDeny,
  onApprove,
}: ChatMessageToolApprovalPropsInput): ChatMessageThreadBodyProps['toolApproval'] {
  if (!isApproval || !toolApproval) return null;

  const isArgumentsExpanded = getChatDisplayExpansionState(
    expandedToolApprovals,
    toolApproval.approvalId,
  );
  const isResponding = pendingApprovalResponseId === toolApproval.approvalId;
  const argumentsDetail = getToolExecutionDetailArgumentsState(toolApproval.arguments);
  const renderState = getChatRuntimeToolApprovalMobileRenderState({
    toolName: toolApproval.toolName,
    isArgumentsExpanded,
    isResponding,
    colors,
  });

  return {
    renderState,
    toolName: toolApproval.toolName,
    argumentsPreview: argumentsDetail.preview,
    argumentsContent: argumentsDetail.content,
    onToggleArguments: () => onToggleArguments(toolApproval.approvalId),
    onDeny: () => onDeny(toolApproval.approvalId),
    onApprove: () => onApprove(toolApproval.approvalId),
  };
}

export function createChatMessageInlineActivityProps({
  message,
  isResponding,
  spinnerSource,
}: ChatMessageInlineActivityPropsInput): ChatMessageThreadBodyProps['inlineActivity'] {
  const renderState = getChatRuntimeInlineActivityMobileRenderState({
    message,
    isResponding,
  });

  return renderState.shouldRender
    ? {
        renderState,
        spinnerSource,
      }
    : null;
}

export function createChatMessageExpandedContentProps({
  isStreaming,
  markdownContent,
  colors,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
}: ChatMessageExpandedContentPropsInput): ChatMessageThreadBodyContentProps['expanded'] {
  const streamingRenderState = getChatRuntimeStreamingContentMobileRenderState({
    isStreaming,
    content: markdownContent,
    colors,
  });

  return {
    streamingRenderState,
    markdownContent,
    assetBaseUrl,
    assetAuthToken,
    spinnerSource,
  };
}

export function createChatMessageCollapsedPreviewProps({
  renderState,
  actionState,
  onToggle,
}: ChatMessageCollapsedPreviewPropsInput): ChatMessageThreadBodyContentProps['collapsed'] {
  return {
    renderState,
    actionState,
    onPress: actionState.canToggle ? onToggle : undefined,
  };
}

export function createChatMessageToolExecutionCompactPreviewRow({
  key,
  toolCall,
  label,
  result,
  colors,
}: ChatMessageToolExecutionCompactPreviewRowInput): ChatMessageDelegationToolPreviewRow {
  const state = getToolExecutionCallDisplayState(result);
  const preview = label ?? getCompactToolExecutionPreview(toolCall, result ?? null);

  return {
    key,
    preview,
    renderState: getToolExecutionCompactMobileRenderState({
      state,
      preview,
      colors,
    }),
  };
}

export function createChatMessageDelegationToolPreviewRows({
  rows,
  colors,
}: ChatMessageDelegationToolPreviewRowsInput): ChatMessageDelegationToolPreviewRow[] {
  return rows.map(({ toolCall, label, result }, toolIndex) =>
    createChatMessageToolExecutionCompactPreviewRow({
      key: `${toolCall.name}-${toolIndex}`,
      toolCall,
      label,
      result,
      colors,
    }),
  );
}

export function createChatMessageToolExecutionDetailRow({
  key,
  toolCall,
  label,
  result,
  isExpanded,
  colors,
  previewNumberOfLines,
  pendingResultRenderState,
  onToggle,
  onCopyPayload,
}: ChatMessageToolExecutionDetailRowInput): ChatMessageToolExecutionCallListRow {
  const toolName = label ?? toolCall.name;
  const argumentsDetail = getToolExecutionDetailArgumentsState(toolCall.arguments);
  const argumentsPayload = argumentsDetail.payload;
  const argumentsContent = argumentsDetail.content;
  const inputHeaderState = getToolExecutionDetailMobileSectionHeaderRenderState({
    kind: 'input',
    payload: argumentsPayload,
  });
  const resultDetail = getToolExecutionDetailResultState(result);
  const resultContent = resultDetail.content;
  const resultPayload = resultDetail.payload;
  const resultState = resultDetail.state;
  const outputHeaderState = getToolExecutionDetailMobileSectionHeaderRenderState({
    kind: 'output',
    payload: resultPayload,
  });
  const errorHeaderState = getToolExecutionDetailMobileSectionHeaderRenderState({
    kind: 'error',
  });
  const renderState = getToolExecutionDetailMobileHeaderRenderState({
    toolName,
    isExpanded,
    resultState,
    colors,
  });
  const inputCopyButtonRenderState = getToolExecutionDetailMobileCopyButtonRenderState({
    kind: 'input',
    toolName,
    colors,
  });
  const outputCopyButtonRenderState = getToolExecutionDetailMobileCopyButtonRenderState({
    kind: 'output',
    toolName,
    colors,
  });
  const errorCopyButtonRenderState = getToolExecutionDetailMobileCopyButtonRenderState({
    kind: 'error',
    toolName,
    colors,
  });

  return {
    key,
    renderState,
    toolName,
    onHeaderPress: onToggle,
    input: argumentsDetail.hasArguments ? {
      payloadRenderState: inputHeaderState,
      compactText: argumentsPayload?.compactText,
      content: argumentsContent,
      isExpanded,
      previewNumberOfLines,
      copyButtonRenderState: inputCopyButtonRenderState,
      onCopyPress: () => onCopyPayload(argumentsContent),
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
      onCopyPress: () => onCopyPayload(resultContent),
      errorRenderState: errorHeaderState,
      error: resultDetail.error,
      errorCopyButtonRenderState,
      onErrorCopyPress: () => onCopyPayload(resultDetail.error ?? ''),
    } : null,
    pendingResult: !result && resultDetail.isPending ? {
      renderState: pendingResultRenderState,
    } : null,
  };
}

export function createChatMessageToolExecutionRows({
  entries,
  stableMessageKey,
  expandedToolCalls,
  colors,
  previewNumberOfLines,
  pendingResultRenderState,
  onToggleToolCall,
  onCopyPayload,
}: ChatMessageToolExecutionRowsInput): ChatMessageToolExecutionRows {
  return {
    compactRows: entries.map(({ toolCall, label, origIdx, result }) =>
      createChatMessageToolExecutionCompactPreviewRow({
        key: String(origIdx),
        toolCall,
        label,
        result,
        colors,
      }),
    ),
    detailRows: entries.map(({ toolCall, label, origIdx, result }) => {
      const toolCallKey = `${stableMessageKey}-${origIdx}`;

      return createChatMessageToolExecutionDetailRow({
        key: toolCallKey,
        toolCall,
        label,
        result,
        isExpanded: getChatDisplayExpansionState(expandedToolCalls, toolCallKey),
        colors,
        previewNumberOfLines,
        pendingResultRenderState,
        onToggle: () => onToggleToolCall(stableMessageKey, origIdx),
        onCopyPayload,
      });
    }),
  };
}

export function createChatMessageConversationToolExecutionStackInput({
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
}: ChatMessageConversationToolExecutionStackInput): ChatMessageToolExecutionStackPropsInput {
  return {
    displayToolCallCount,
    colors,
    isExpanded,
    rows: {
      entries: renderedToolEntries,
      stableMessageKey: message.id ?? String(messageIndex),
      expandedToolCalls,
      previewNumberOfLines,
      pendingResultRenderState,
      onToggleToolCall,
      onCopyPayload: (content) => { void onCopyPayload(content); },
    },
    compact: {
      onToggle: () => onToggleMessageExpansion(messageIndex),
    },
    expanded: {
      onToggle: () => onToggleMessageExpansion(messageIndex),
      emptyStateRenderState,
    },
  };
}

export function createChatMessageToolExecutionStackProps({
  displayToolCallCount,
  colors,
  isExpanded,
  rows: rowInput,
  compact,
  expanded,
}: ChatMessageToolExecutionStackPropsInput): ChatMessageConversationBodyProps['toolExecutionStack'] {
  const { onToggle: onCompactToggle } = compact;
  const { emptyStateRenderState, onToggle: onExpandedToggle, ...expandedProps } = expanded;
  const visibility = getToolExecutionMobileVisibilityRenderState({
    toolCallCount: displayToolCallCount,
  });
  const compactRenderState = getToolExecutionDetailMobileExpandControlRenderState();
  const topCollapseRenderState = getToolExecutionDetailMobileCollapseControlRenderState({
    placement: 'top',
    toolCallCount: displayToolCallCount,
    colors,
  });
  const bottomCollapseRenderState = getToolExecutionDetailMobileCollapseControlRenderState({
    colors,
  });
  const executionRows = createChatMessageToolExecutionRows({
    ...rowInput,
    colors,
  });
  const executionSummary = getToolExecutionSummaryDisplayState(
    rowInput.entries.map(entry => entry.result),
  );

  return {
    shouldRender: visibility.toolExecutionStack.shouldRender,
    isExpanded,
    compact: {
      renderState: compactRenderState,
      rows: executionRows.compactRows,
      onPress: onCompactToggle,
    },
    expanded: {
      ...expandedProps,
      isPending: executionSummary.isPending,
      allSuccess: executionSummary.allSuccess,
      hasErrors: executionSummary.hasErrors,
      topCollapseRenderState,
      bottomCollapseRenderState,
      onCollapsePress: onExpandedToggle,
      emptyState: {
        shouldRender: visibility.emptyState.shouldRender,
        renderState: emptyStateRenderState,
      },
    },
    detailRows: executionRows.detailRows,
  };
}

export function createChatMessageActionStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageActionStyleSlots {
  const standardButton = getChatMessageActionMobileButtonState();
  const branchButton = getChatMessageActionMobileButtonState('branch');
  const speechButton = getChatMessageActionMobileButtonState('speech');

  return {
    turnDuration: {
      style: styles.messageTurnDurationBadge,
      liveStyle: styles.messageTurnDurationBadgeLive,
      textStyle: styles.messageTurnDurationText,
      liveTextStyle: styles.messageTurnDurationTextLive,
    },
    speech: {
      hitSlop: speechButton.hitSlop,
      style: styles.speakButton,
      activeStyle: styles.speakButtonActive,
      pressedStyle: styles.speakButtonPressed,
    },
    branch: {
      hitSlop: branchButton.hitSlop,
      style: styles.messageBranchButton,
      pressedStyle: styles.messageBranchButtonPressed,
      disabledStyle: styles.messageBranchButtonDisabled,
    },
    copy: {
      hitSlop: standardButton.hitSlop,
      style: styles.messageCopyButton,
      activeStyle: styles.messageCopyButtonCopied,
      pressedStyle: styles.messageCopyButtonPressed,
    },
    expansion: {
      hitSlop: standardButton.hitSlop,
      style: styles.messageExpandButton,
      pressedStyle: styles.messageExpandButtonPressed,
    },
  } as ChatMessageActionStyleSlots;
}

export function createChatRuntimeHeaderStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatRuntimeHeaderStyleSlots {
  return {
    actionsRowStyle: styles.headerActionsRow,
    agentSelector: {
      button: styles.headerAgentSelectorButton,
      chip: styles.headerAgentSelectorChip,
      label: styles.headerAgentSelectorText,
    },
    conversationStatus: {
      chip: styles.headerConversationChip,
      text: styles.headerConversationChipText,
      spinner: styles.headerConversationSpinner,
    },
    turnDuration: {
      chip: styles.headerDurationChip,
      liveChip: styles.headerDurationChipLive,
      text: styles.headerDurationChipText,
      liveText: styles.headerDurationChipTextLive,
    },
    iconButtons: {
      edgeStyle: styles.headerEdgeActionButton,
      pinStyle: styles.headerPinButton,
      pinActiveStyle: styles.headerPinButtonActive,
      actionStyle: styles.headerActionButton,
      killSwitchIconContainerStyle: styles.headerKillSwitchIconContainer,
      handsFreeIconContainerStyle: styles.headerHandsFreeIconContainer,
    },
  } as ChatRuntimeHeaderStyleSlots;
}

export function createChatRuntimeNavigationHeaderRenderState({
  agentName,
  isPinned = false,
  handsFree = false,
  conversationState = null,
  isResponding = false,
  turnDurationMs = null,
  turnDurationIsLive = false,
  colors,
}: ChatRuntimeNavigationHeaderRenderStateInput): ChatRuntimeNavigationHeaderRenderState {
  const agentLabel = getChatRuntimeCurrentAgentLabel(agentName);
  const pinButtonRenderState = getChatRuntimePinMobileRenderState({ isPinned, colors });
  const headerConversationState = conversationState ?? (isResponding ? 'running' : null);

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
  };
}

export function createChatRuntimeNavigationHeaderOptions({
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
  styles,
}: ChatRuntimeNavigationHeaderOptionsInput): ChatRuntimeNavigationHeaderOptions {
  const agentSelector = {
    renderState: agentSelectorRenderState,
    onPress: onAgentSelectorPress,
    labelNumberOfLines: agentSelectorLabelNumberOfLines,
  };
  const backButton = {
    renderState: backButtonRenderState,
    onPress: onBackButtonPress,
  };
  const pinButton = {
    renderState: pinButtonRenderState,
    onPress: onPinButtonPress,
    isActive: pinButtonIsActive,
  };
  const conversationStatus = {
    renderState: conversationStatusRenderState,
    spinnerSource: conversationStatusSpinnerSource,
  };
  const turnDuration = {
    renderState: turnDurationRenderState,
  };
  const killSwitchButton = {
    shouldRender: killSwitchButtonShouldRender,
    renderState: killSwitchButtonRenderState,
    onPress: onKillSwitchButtonPress,
  };
  const handsFreeButton = {
    renderState: handsFreeButtonRenderState,
    onPress: onHandsFreeButtonPress,
  };

  return {
    headerTitle: () => (
      <ChatRuntimeHeaderAgentSelector
        {...agentSelector}
        styles={styles.agentSelector}
      />
    ),
    headerLeft: () => (
      <ChatRuntimeHeaderActionsRow style={styles.actionsRowStyle}>
        <ChatRuntimeHeaderIconButton
          {...backButton}
          style={styles.iconButtons.edgeStyle}
        />
        <ChatRuntimeHeaderIconButton
          {...pinButton}
          style={styles.iconButtons.pinStyle}
          activeStyle={styles.iconButtons.pinActiveStyle}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
    headerRight: () => (
      <ChatRuntimeHeaderActionsRow style={styles.actionsRowStyle}>
        <ChatRuntimeHeaderConversationStatus
          {...conversationStatus}
          styles={styles.conversationStatus}
        />
        <ChatRuntimeHeaderTurnDuration
          {...turnDuration}
          styles={styles.turnDuration}
        />
        <ChatRuntimeHeaderIconButton
          {...killSwitchButton}
          style={styles.iconButtons.actionStyle}
          iconContainerStyle={styles.iconButtons.killSwitchIconContainerStyle}
        />
        <ChatRuntimeHeaderIconButton
          {...handsFreeButton}
          style={styles.iconButtons.actionStyle}
          iconContainerStyle={styles.iconButtons.handsFreeIconContainerStyle}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
  };
}

export function createChatComposerStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatComposerStyleSlots {
  return {
    speechPreview: {
      box: styles.sttPreviewBox,
      label: styles.sttPreviewLabel,
      text: styles.sttPreviewText,
    },
    pendingImagesRail: {
      row: styles.pendingImagesRow,
      card: styles.pendingImageCard,
      preview: styles.pendingImagePreview,
      removeButton: styles.pendingImageRemoveButton,
    },
    voiceOverlay: {
      overlay: styles.overlay,
      card: styles.overlayCard,
      label: styles.overlayText,
      transcript: styles.overlayTranscript,
    },
    handsFreeControls: {
      statusRow: styles.handsFreeStatusRow,
      controlsRow: styles.handsFreeControlsRow,
      controlButton: styles.handsFreeControlButton,
      controlButtonText: styles.handsFreeControlButtonText,
    },
    accessoryButton: {
      style: styles.ttsToggle,
      activeStyle: styles.ttsToggleOn,
    },
    textEntry: {
      input: styles.input,
      visuallyHiddenHint: styles.visuallyHiddenComposerHint,
    },
    queueAction: {
      button: styles.queueButton,
      disabledButton: styles.sendButtonDisabled,
      text: styles.queueButtonText,
    },
    submitAction: {
      button: styles.sendButton,
      disabledButton: styles.sendButtonDisabled,
      text: styles.sendButtonText,
    },
    micButton: {
      button: styles.mic,
      activeButton: styles.micOn,
      label: styles.micLabel,
      activeLabel: styles.micLabelOn,
    },
    inputDock: {
      area: styles.inputArea,
      row: styles.inputRow,
      micWrapper: styles.micWrapper,
    },
  } as ChatComposerStyleSlots;
}

export function createChatComposerRuntimeDockStyleSlots({
  chatComposerStyles,
  safeAreaStyles,
}: {
  chatComposerStyles: ChatComposerStyleSlots;
  safeAreaStyles: Pick<ChatRuntimeSafeAreaMergedStyleSlots, 'inputDock'>;
}): ChatComposerRuntimeDockStyleSlots {
  return {
    ...chatComposerStyles,
    inputDock: safeAreaStyles.inputDock,
  } as ChatComposerRuntimeDockStyleSlots;
}

export function createChatComposerRuntimeChromeStyleState({
  colors,
  platform,
}: ChatComposerRuntimeChromeStyleStateInput): ChatComposerRuntimeChromeStyleState {
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
  };
}

export function createChatRuntimeMobileChromeStyleState({
  colors,
  platform,
}: ChatRuntimeMobileChromeStyleStateInput): ChatRuntimeMobileChromeStyleState {
  const header = getChatRuntimeHeaderChromeMobileStyleRenderState({
    colors,
  });

  return {
    header,
    conversation: getChatRuntimeConversationChromeMobileStyleRenderState({
      colors,
    }),
    composer: createChatComposerRuntimeChromeStyleState({
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
    thread: createChatMessageRuntimeThreadChromeStyleState({
      colors,
    }),
  };
}

export function createChatComposerRuntimeDockChromeProps({
  colors,
  platform,
  isWebPlatform,
}: ChatComposerRuntimeDockChromeInput): ChatComposerRuntimeDockChromeProps {
  const composerSurfaceRenderState = getChatComposerMobileSurfaceRenderState({
    colors,
    platform,
  });
  const composerSurface = composerSurfaceRenderState.surface;
  const composerTextColors = composerSurfaceRenderState.colors.text;
  const webAccessibility = composerSurface.webAccessibility;
  const handsFreeSurface = getHandsFreeComposerMobileSurfaceRenderState({
    colors,
  }).surface;
  const accessoryButton = {
    activeOpacity: composerSurface.accessoryButton.pressedOpacity,
  };

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
      webPressedStyle: isWebPlatform ? getChatComposerMicMobileWebPressStyleState() as any : undefined,
    },
  };
}

export function createChatComposerRuntimeFollowUpPresentationState({
  conversationState,
  isResponding = false,
  isQueueEnabled = false,
}: ChatComposerRuntimeFollowUpPresentationStateInput): FollowUpInputPresentation {
  return getFollowUpInputPresentation({
    conversationState: conversationState ?? (isResponding ? 'running' : 'complete'),
    isQueueEnabled,
  });
}

export function createChatComposerRuntimeControlRenderState({
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
}: ChatComposerRuntimeControlRenderStateInput): ChatComposerRuntimeControlRenderState {
  const micLabel = getHandsFreeMicButtonLabel({
    handsFree,
    phase: micPhase,
    listening,
  });
  const actionAvailability = getChatComposerMobileActionAvailabilityRenderState({
    hasContent,
    handsFree,
    presentation,
  });

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
  };
}

export function getChatComposerRuntimeQueueDebugMessage(): string {
  return getChatComposerQueueMobileActionState().debugMessage;
}

export function createChatComposerRuntimeDockProps({
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
  composerControlPresentation,
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
  textEntryIsWebPlatform,
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
}: ChatComposerRuntimeDockChromePropsInput): Omit<ChatComposerRuntimeDockProps, 'styles'> {
  const mobileComposerControls = getChatComposerMobileControlState();
  const controlRenderState = createChatComposerRuntimeControlRenderState({
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
  });
  const pendingImagesRenderState = getChatImageAttachmentMobileRenderState({
    colors: pendingImagesColors,
  });
  const handsFreeControlState = getHandsFreeComposerControlState(handsFreeStatusPhase);
  const handsFreeStatusSubtitle = handsFreeStatusEnabled
    ? getHandsFreeStatusSubtitle({
        phase: handsFreeStatusPhase,
        wakePhrase: handsFreeStatusWakePhrase,
        sleepPhrase: handsFreeStatusSleepPhrase,
        lastError: handsFreeStatusLastError,
        foregroundOnly: handsFreeStatusForegroundOnly,
      })
    : undefined;
  const textEntryAccessibilityHint = createChatComposerAccessibilityHint({
    handsFree: textEntryHandsFree,
    listening: textEntryListening,
    isWeb: textEntryIsWebPlatform,
  });
  const resolvedTextEntryPlaceholderFallback =
    textEntryPlaceholderFallback
      ?? (composerControlPresentation.placeholder || composerControlPresentation.submitTitle);
  const textEntryPlaceholder = getHandsFreeComposerPlaceholder({
    handsFree: textEntryHandsFree,
    phase: handsFreeStatusPhase,
    wakePhrase: textEntryWakePhrase,
    listening: textEntryListening,
    fallback: resolvedTextEntryPlaceholderFallback,
  });
  const textEntryVoiceStatusLiveRegionAnnouncement = createVoiceInputLiveRegionAnnouncement({
    listening: textEntryListening,
    handsFree: textEntryHandsFree,
    willCancel: textEntryWillCancel,
    liveTranscript: textEntryLiveTranscript,
    sttPreview: speechPreviewText ?? undefined,
  });

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
      status: {
        phase: handsFreeStatusPhase,
        label: handsFreeStatusLabel,
        subtitle: handsFreeStatusSubtitle,
      },
      controlState: handsFreeControlState,
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
      accessibilityHint: textEntryAccessibilityHint,
      placeholder: textEntryPlaceholder,
      voiceStatusLiveRegionAnnouncement: textEntryVoiceStatusLiveRegionAnnouncement,
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
  };
}

export function createChatMessageConversationDockStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageConversationDockStyleSlots {
  return {
    scrollToBottomButtonStyle: styles.scrollToBottomButton,
    queuePanelStyle: styles.messageQueuePanelWrapper,
    connectionBanner: {
      banner: styles.connectionBanner,
      reconnecting: styles.connectionBannerReconnecting,
      failed: styles.connectionBannerFailed,
      content: styles.connectionBannerContent,
      icon: styles.connectionBannerIcon,
      textContainer: styles.connectionBannerTextContainer,
      title: styles.connectionBannerText,
      subtitle: styles.connectionBannerSubtext,
      retryButton: styles.retryButton,
      retryButtonText: styles.retryButtonText,
    },
  } as ChatMessageConversationDockStyleSlots;
}

export function createChatMessageRuntimeDockStyleSlots({
  conversationDockStyles,
  composerStyles,
  safeAreaStyles,
}: {
  conversationDockStyles: ChatMessageConversationDockStyleSlots;
  composerStyles: ChatComposerRuntimeDockStyleSlots;
  safeAreaStyles: Pick<ChatRuntimeSafeAreaMergedStyleSlots, 'scrollToBottomButtonStyle' | 'voiceOverlay'>;
}): ChatMessageRuntimeDockStyleSlots {
  return {
    scrollToBottomButtonStyle: safeAreaStyles.scrollToBottomButtonStyle,
    voiceOverlay: safeAreaStyles.voiceOverlay,
    queuePanelStyle: conversationDockStyles.queuePanelStyle,
    connectionBanner: conversationDockStyles.connectionBanner,
    composer: composerStyles,
  } as ChatMessageRuntimeDockStyleSlots;
}

export function createChatRuntimeMobileSafeAreaLayoutState(
  bottomInset: number,
): ChatRuntimeMobileSafeAreaLayout {
  return getChatRuntimeMobileSafeAreaLayoutState(bottomInset);
}

export function createChatRuntimeMobileSafeAreaStyleSlots(
  layout: ChatRuntimeMobileSafeAreaLayout,
): ChatRuntimeMobileSafeAreaStyleSlots {
  return StyleSheet.create({
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
  });
}

export function createChatRuntimeSafeAreaMergedStyleSlots({
  chatComposerStyles,
  conversationDockStyles,
  conversationViewportStyles,
  safeAreaStyles,
}: {
  chatComposerStyles: Pick<ChatComposerStyleSlots, 'voiceOverlay' | 'inputDock'>;
  conversationDockStyles: Pick<ChatMessageConversationDockStyleSlots, 'scrollToBottomButtonStyle'>;
  conversationViewportStyles: Pick<ChatMessageConversationViewportStyleSlots, 'scrollViewport'>;
  safeAreaStyles: ChatRuntimeMobileSafeAreaStyleSlots;
}): ChatRuntimeSafeAreaMergedStyleSlots {
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
  } as ChatRuntimeSafeAreaMergedStyleSlots;
}

export function createChatMessageToolActivityGroupBoundaryStyles(
  styles: ChatMessageChromeStyleSource,
): ChatMessageToolActivityGroupBoundaryStyles {
  return {
    toggle: {
      container: styles.toolActivityGroupCollapsed,
      pressed: styles.toolActivityGroupPressed,
      headerRow: styles.toolActivityGroupHeaderRow,
      countBadge: styles.toolActivityGroupCountBadge,
      countBadgeText: styles.toolActivityGroupCountBadgeText,
      previewLine: styles.toolActivityGroupPreviewLine,
    },
    footer: {
      button: styles.toolActivityGroupFooterButton,
      pressed: styles.toolActivityGroupPressed,
      text: styles.toolActivityGroupFooterText,
    },
  };
}

export function createChatMessageToolActivityGroupThreadSurfaceStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageToolActivityGroupThreadSurfaceStyleSlots {
  return {
    surfaceStyle: styles.msg,
    boundary: createChatMessageToolActivityGroupBoundaryStyles(styles),
    getToneStyle: (toneStyleSlot) => styles[toneStyleSlot] as ChatMessageThreadSurfaceProps['surfaceToneStyle'],
  } as ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
}

export function createChatMessageRuntimeThreadStyleSlots({
  threadSurfaceStyles,
  threadBodyStyles,
}: {
  threadSurfaceStyles: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
  threadBodyStyles: ChatMessageThreadBodyStyleSlots;
}): ChatMessageRuntimeThreadStyleSlots {
  return {
    surface: threadSurfaceStyles,
    body: threadBodyStyles,
  };
}

export function createChatMessageConversationThreadStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageConversationThreadStyleSlots {
  const threadSurfaceStyles = createChatMessageToolActivityGroupThreadSurfaceStyleSlots(styles);
  const threadBodyStyles = createChatMessageThreadBodyStyleSlots(styles);

  return {
    runtimeThread: createChatMessageRuntimeThreadStyleSlots({
      threadSurfaceStyles,
      threadBodyStyles,
    }),
    actionSet: createChatMessageActionStyleSlots(styles),
  };
}

export function createChatMessageConversationViewportStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageConversationViewportStyleSlots {
  return {
    frame: {
      keyboardAvoidingStyle: styles.keyboardAvoidingContainer,
      rootStyle: styles.chatRoot,
    },
    scrollViewport: {
      style: styles.chatScroll,
      contentContainerStyle: styles.chatScrollContent,
    },
    loadingState: {
      style: styles.loadingState,
      spinnerStyle: styles.loadingSpinner,
    },
    homeQuickStarts: {
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
    historyBanner: {
      container: styles.loadOlderContainer,
      summary: styles.loadOlderText,
      loadButton: styles.loadOlderButton,
      loadButtonPressed: styles.loadOlderButtonPressed,
      loadButtonText: styles.loadOlderButtonText,
    },
    stepSummary: {
      card: styles.stepSummaryCard,
      header: styles.stepSummaryHeader,
      title: styles.stepSummaryTitle,
      badge: styles.stepSummaryBadge,
      badgeText: styles.stepSummaryBadgeText,
      action: styles.stepSummaryAction,
      meta: styles.stepSummaryMeta,
      preview: styles.stepSummaryPreview,
    },
    debugPanels: {
      panelStyle: styles.debugInfo,
      textStyle: styles.debugText,
    },
  } as ChatMessageConversationViewportStyleSlots;
}

export function createChatMessageRuntimeViewportStyleSlots({
  conversationViewportStyles,
  safeAreaStyles,
}: {
  conversationViewportStyles: ChatMessageConversationViewportStyleSlots;
  safeAreaStyles: Pick<ChatRuntimeSafeAreaMergedStyleSlots, 'scrollViewportContentContainerStyle'>;
}): ChatMessageRuntimeViewportStyleSlots {
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
  } as ChatMessageRuntimeViewportStyleSlots;
}

export function createChatMessageRuntimeSurfaceStyleSlots({
  conversationViewportStyles,
  dockStyles,
  viewportStyles,
}: {
  conversationViewportStyles: Pick<ChatMessageConversationViewportStyleSlots, 'frame'>;
  dockStyles: ChatMessageRuntimeDockStyleSlots;
  viewportStyles: ChatMessageRuntimeViewportStyleSlots;
}): ChatMessageRuntimeSurfaceStyleSlots {
  return {
    frame: conversationViewportStyles.frame,
    dock: dockStyles,
    viewport: viewportStyles,
  } as ChatMessageRuntimeSurfaceStyleSlots;
}

export function createChatConversationHomePromptEditorModalStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatConversationHomePromptEditorModalStyles {
  return {
    keyboardAvoidingView: styles.modalKeyboardAvoidingView,
    overlay: styles.modalOverlay,
    content: styles.modalContent,
    header: styles.modalHeader,
    title: styles.modalTitle,
    closeButton: styles.modalCloseButton,
    label: styles.modalLabel,
    input: styles.modalInput,
    inputMultiline: styles.modalInputMultiline,
    actions: styles.modalActions,
    cancelButton: styles.modalCancelButton,
    cancelButtonText: styles.modalCancelButtonText,
    saveButton: styles.modalSaveButton,
    saveButtonDisabled: styles.modalSaveButtonDisabled,
    saveButtonText: styles.modalSaveButtonText,
  } as ChatConversationHomePromptEditorModalStyles;
}

export function createChatMessageThreadBodyStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageThreadBodyStyleSlots {
  return {
    retryStatus: {
      card: styles.retryStatusCard,
      header: styles.retryStatusHeader,
      title: styles.retryStatusTitle,
      metaRow: styles.retryStatusMetaRow,
      attempt: styles.retryStatusAttempt,
      countdown: styles.retryStatusCountdown,
      description: styles.retryStatusDescription,
    } as ChatMessageRetryStatusStyles,
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
    } as ChatMessageDelegationCardStyles,
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
    } as ChatMessageToolApprovalStyles,
    inlineActivity: {
      style: styles.inlineActivityIndicator,
      spinnerStyle: styles.inlineActivitySpinner,
    } as Pick<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'>,
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
      } as ChatMessageExpandedContentStyles,
      collapsedStyle: styles.collapsedMessagePreviewToggle,
      collapsedPressedStyle: styles.collapsedMessagePreviewTogglePressed,
      collapsedTextStyle: styles.collapsedMessagePreview,
    } as ChatMessageThreadBodyStyleSlots['content'],
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
    } as ChatMessageToolExecutionStackStyles,
    standaloneActions: {
      rowStyle: styles.messageActionsRow,
    } as Pick<ChatMessageStandaloneActionsProps, 'rowStyle'>,
  };
}

export function ChatRuntimeHeaderAgentSelector({
  renderState,
  onPress,
  labelNumberOfLines,
  styles,
}: ChatRuntimeHeaderAgentSelectorProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={renderState.pressedOpacity}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
    >
      <View style={styles.chip}>
        <Text
          style={styles.label}
          numberOfLines={labelNumberOfLines}
        >
          {renderState.label}
        </Text>
        <Ionicons
          name={renderState.icon.name}
          size={renderState.icon.size}
          color={renderState.icon.color}
        />
      </View>
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderActionsRow({
  children,
  style,
}: ChatRuntimeHeaderActionsRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderIconButton({
  shouldRender = true,
  renderState,
  onPress,
  style,
  activeStyle,
  iconContainerStyle,
  isActive,
}: ChatRuntimeHeaderIconButtonProps) {
  if (!shouldRender) return null;

  const icon = (
    <Ionicons
      name={renderState.icon.name}
      size={renderState.icon.size}
      color={renderState.icon.color}
    />
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={renderState.pressedOpacity}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
      accessibilityState={'accessibilityState' in renderState ? renderState.accessibilityState : undefined}
      aria-checked={'ariaChecked' in renderState ? renderState.ariaChecked : undefined}
      style={[style, isActive && activeStyle]}
    >
      {iconContainerStyle ? (
        <View style={iconContainerStyle}>
          {icon}
        </View>
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderConversationStatus({
  renderState,
  spinnerSource,
  styles,
}: ChatRuntimeHeaderConversationStatusProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      style={[
        styles.chip,
        renderState.styles.chip,
      ]}
    >
      {renderState.runningIndicator.shouldRender && (
        <Image
          source={spinnerSource}
          style={styles.spinner}
          resizeMode={renderState.runningIndicator.resizeMode}
        />
      )}
      <Text
        style={[
          styles.text,
          renderState.styles.text,
        ]}
      >
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatRuntimeHeaderTurnDuration({
  renderState,
  styles,
}: ChatRuntimeHeaderTurnDurationProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={[
        styles.chip,
        renderState.isLive && styles.liveChip,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text
        style={[
          styles.text,
          renderState.isLive && styles.liveText,
        ]}
        numberOfLines={renderState.badge.numberOfLines}
      >
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatConversationHomeQuickStarts<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  shouldRender,
  items,
  isLoading,
  runningTaskId,
  onPress,
  onEditPrompt,
  onDeletePrompt,
  shortcutRenderState,
  styles,
}: ChatConversationHomeQuickStartsProps<TPrompt, TTask>) {
  if (!shouldRender) return null;
  const { surface: shortcutSurface } = shortcutRenderState;
  const shortcutEmptyRenderState = getPromptLibraryMobileShortcutEmptyRenderState(shortcutRenderState, isLoading);

  return (
    <View style={styles.card}>
      {items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((item) => {
            const shortcutItemRenderState = getPromptLibraryMobileShortcutItemRenderState(
              item,
              shortcutRenderState,
              runningTaskId,
            );
            const { interaction: shortcutInteraction } = shortcutItemRenderState;
            const addAction = shortcutItemRenderState.addAction;
            const promptActions = shortcutItemRenderState.promptActions;

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.shortcutCard,
                  shortcutInteraction.isAddPrompt && styles.shortcutCardAdd,
                  shortcutInteraction.isRunning && styles.shortcutCardDisabled,
                  pressed && styles.shortcutCardPressed,
                ]}
                onPress={() => onPress(item)}
                disabled={shortcutInteraction.isDisabled}
                accessibilityRole={shortcutItemRenderState.accessibilityRole}
                accessibilityState={shortcutInteraction.accessibilityState}
                accessibilityLabel={shortcutItemRenderState.accessibilityLabel}
                accessibilityHint={shortcutItemRenderState.accessibilityHint}
              >
                {!shortcutInteraction.isAddPrompt ? (
                  <View style={styles.sourcePill}>
                    <Ionicons
                      name={shortcutItemRenderState.sourceIcon.name}
                      size={shortcutItemRenderState.sourceIcon.size}
                      color={shortcutItemRenderState.sourceIconColors.color}
                    />
                    <Text
                      style={styles.sourceLabel}
                      numberOfLines={shortcutSurface.shortcutSourceLabel.numberOfLines}
                    >
                      {shortcutItemRenderState.sourceLabel}
                    </Text>
                  </View>
                ) : addAction ? (
                  <Ionicons
                    name={addAction.icon.name}
                    size={addAction.icon.size}
                    color={addAction.iconColors.color}
                    style={styles.addIcon}
                  />
                ) : null}
                <Text
                  style={[
                    styles.title,
                    shortcutInteraction.isAddPrompt && styles.titleAdd,
                  ]}
                  numberOfLines={shortcutSurface.shortcutTitle.numberOfLines}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text
                    style={styles.description}
                    numberOfLines={shortcutSurface.shortcutDescription.numberOfLines}
                  >
                    {item.description}
                  </Text>
                ) : null}
                {item.prompt && promptActions ? (
                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        onEditPrompt(item.prompt!);
                      }}
                      accessibilityRole={promptActions.edit.accessibilityRole}
                      accessibilityLabel={promptActions.edit.accessibilityLabel}
                    >
                      <Ionicons
                        name={promptActions.edit.icon.name}
                        size={promptActions.edit.icon.size}
                        color={promptActions.edit.iconColors.color}
                      />
                      <Text style={styles.actionText}>{promptActions.edit.label}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        onDeletePrompt(item.prompt!);
                      }}
                      accessibilityRole={promptActions.delete.accessibilityRole}
                      accessibilityLabel={promptActions.delete.accessibilityLabel}
                    >
                      <Ionicons
                        name={promptActions.delete.icon.name}
                        size={promptActions.delete.icon.size}
                        color={promptActions.delete.iconColors.color}
                      />
                      <Text style={[styles.actionText, styles.actionDangerText]}>{promptActions.delete.label}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {shortcutEmptyRenderState.label}
        </Text>
      )}
    </View>
  );
}

export function ChatConversationHomePromptEditorModal({
  visible,
  isEditing,
  nameValue,
  onNameChange,
  contentValue,
  onContentChange,
  isSaving,
  onClose,
  onSave,
  renderState,
  styles,
}: ChatConversationHomePromptEditorModalProps) {
  const editorDismissActionState = getPromptLibraryEditorDismissActionState(isSaving);
  const editorSaveActionState = createChatConversationHomePromptEditorSaveActionState({
    draft: { name: nameValue, content: contentValue },
    isEditing,
    isSaving,
  });
  const {
    chrome: editorChrome,
    colors,
    copy,
    keyboardAvoidingBehavior,
    surface,
  } = renderState;
  const title = getPromptLibraryEditorTitle(isEditing);

  return (
    <Modal
      visible={visible}
      transparent={surface.modal.transparent}
      animationType={surface.modal.animationType}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={keyboardAvoidingBehavior}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={editorDismissActionState.isDisabled}
                activeOpacity={surface.closeButton.pressedOpacity}
                accessibilityRole={surface.closeButton.accessibilityRole}
                accessibilityLabel={copy.closeAccessibilityLabel}
                accessibilityState={editorDismissActionState.accessibilityState}
              >
                <Ionicons
                  name={editorChrome.closeIcon.name}
                  size={editorChrome.closeIcon.size}
                  color={editorChrome.closeIconColors.color}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{copy.nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={nameValue}
              onChangeText={onNameChange}
              accessibilityLabel={copy.nameAccessibilityLabel}
              placeholder={copy.namePlaceholder}
              placeholderTextColor={colors.input.placeholderColor}
            />

            <Text style={styles.label}>{copy.contentLabel}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={contentValue}
              onChangeText={onContentChange}
              accessibilityLabel={copy.contentAccessibilityLabel}
              placeholder={copy.contentPlaceholder}
              placeholderTextColor={colors.input.placeholderColor}
              multiline={surface.multilineInput.multiline}
              textAlignVertical={surface.multilineInput.textAlignVertical}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={editorDismissActionState.isDisabled}
                activeOpacity={surface.cancelButton.pressedOpacity}
                accessibilityRole={surface.cancelButton.accessibilityRole}
                accessibilityLabel={copy.cancelAccessibilityLabel}
                accessibilityState={editorDismissActionState.accessibilityState}
              >
                <Text style={styles.cancelButtonText}>{copy.cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  editorSaveActionState.isDisabled && styles.saveButtonDisabled,
                ]}
                onPress={onSave}
                disabled={editorSaveActionState.isDisabled}
                activeOpacity={surface.saveButton.pressedOpacity}
                accessibilityRole={surface.saveButton.accessibilityRole}
                accessibilityLabel={editorSaveActionState.accessibilityLabel}
                accessibilityState={editorSaveActionState.accessibilityState}
              >
                <Text style={styles.saveButtonText}>{editorSaveActionState.label}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function createChatConversationHomePromptEditorSaveActionState({
  draft,
  isEditing,
  isSaving,
}: ChatConversationHomePromptEditorSaveActionInput): ReturnType<typeof getPromptLibraryEditorSaveActionState> {
  return getPromptLibraryEditorSaveActionState(
    draft,
    isEditing,
    isSaving,
  );
}

export function ChatMessageSurface({
  children,
  style,
  toneStyle,
}: ChatMessageSurfaceProps) {
  return (
    <View style={[style, toneStyle]}>
      {children}
    </View>
  );
}

export function ChatMessageThreadItem({
  children,
  leadingActivity,
  trailingActivity,
}: ChatMessageThreadItemProps) {
  return (
    <View>
      {leadingActivity}
      {children}
      {trailingActivity}
    </View>
  );
}

export function ChatMessageThreadSurface({
  children,
  leadingActivity,
  trailingActivity,
  surfaceStyle,
  surfaceToneStyle,
}: ChatMessageThreadSurfaceProps) {
  return (
    <ChatMessageThreadItem
      leadingActivity={leadingActivity}
      trailingActivity={trailingActivity}
    >
      <ChatMessageSurface
        style={surfaceStyle}
        toneStyle={surfaceToneStyle}
      >
        {children}
      </ChatMessageSurface>
    </ChatMessageThreadItem>
  );
}

export function ChatMessageToolActivityGroupThreadSurface({
  children,
  groupRenderState,
  onToggleGroup,
  styles,
  surfaceToneStyle,
}: ChatMessageToolActivityGroupThreadSurfaceProps) {
  return (
    <ChatMessageThreadSurface
      surfaceStyle={styles.surfaceStyle}
      surfaceToneStyle={surfaceToneStyle}
      leadingActivity={groupRenderState?.shouldRenderExpandedHeader ? (
        <ChatMessageToolActivityGroupBoundary
          renderState={groupRenderState}
          kind="expanded"
          onPress={onToggleGroup}
          styles={styles.boundary}
        />
      ) : null}
      trailingActivity={groupRenderState?.shouldRenderExpandedFooter ? (
        <ChatMessageToolActivityGroupBoundary
          renderState={groupRenderState}
          kind="footer"
          onPress={onToggleGroup}
          styles={styles.boundary}
        />
      ) : null}
    >
      {children}
    </ChatMessageThreadSurface>
  );
}

export function ChatMessageRuntimeThread({
  groupRenderState,
  onToggleGroup,
  body,
  styles,
}: ChatMessageRuntimeThreadProps) {
  if (groupRenderState?.shouldSkipCollapsedItem) return null;

  if (groupRenderState?.shouldRenderCollapsedHeader) {
    return (
      <ChatMessageToolActivityGroupBoundary
        renderState={groupRenderState}
        kind="collapsed"
        onPress={onToggleGroup}
        styles={styles.surface.boundary}
      />
    );
  }

  if (!body) return null;

  const resolvedBody = createChatMessageThreadBodyProps(body);
  const surfaceToneStyleSlot = body.conversation.messageRenderState.toneStyleSlot;
  const surfaceToneStyle = surfaceToneStyleSlot
    ? styles.surface.getToneStyle(surfaceToneStyleSlot)
    : undefined;

  return (
    <ChatMessageToolActivityGroupThreadSurface
      surfaceToneStyle={surfaceToneStyle}
      groupRenderState={groupRenderState}
      onToggleGroup={onToggleGroup}
      styles={styles.surface}
    >
      <ChatMessageThreadBody
        {...resolvedBody}
        styles={styles.body}
      />
    </ChatMessageToolActivityGroupThreadSurface>
  );
}

export function ChatMessageConversationRuntimeThread({
  threadState,
  styles,
}: ChatMessageConversationRuntimeThreadProps) {
  if (!threadState.shouldRenderThread) return null;

  return (
    <ChatMessageRuntimeThread
      groupRenderState={threadState.groupRenderState}
      onToggleGroup={threadState.onToggleGroup}
      body={threadState.body}
      styles={styles}
    />
  );
}

export function ChatMessageConversationRuntimeThreadList({
  threadStates,
  styles,
}: ChatMessageConversationRuntimeThreadListProps) {
  return (
    <>
      {threadStates.map((threadState) => (
        <ChatMessageConversationRuntimeThread
          key={threadState.threadKey}
          threadState={threadState}
          styles={styles}
        />
      ))}
    </>
  );
}

export function ChatMessageThreadBody({
  styles,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyProps) {
  if (retryStatus) {
    return (
      <ChatMessageRetryStatus
        {...retryStatus}
        styles={styles.retryStatus}
      />
    );
  }

  if (delegationCard) {
    return (
      <ChatMessageDelegationCard
        {...delegationCard}
        styles={styles.delegationCard}
      />
    );
  }

  if (toolApproval) {
    return (
      <ChatMessageToolApproval
        {...toolApproval}
        styles={styles.toolApproval}
      />
    );
  }

  if (inlineActivity) {
    return (
      <ChatMessageInlineActivity
        {...inlineActivity}
        style={styles.inlineActivity.style}
        spinnerStyle={styles.inlineActivity.spinnerStyle}
      />
    );
  }

  return (
    <>
      <ChatMessageConversationContent
        {...conversation.content}
        rowStyle={styles.content.rowStyle}
        expanded={{
          ...conversation.content.expanded,
          bodyStyle: styles.content.expandedBodyStyle,
          streamingStyles: styles.content.streamingStyles,
        }}
        collapsed={{
          ...conversation.content.collapsed,
          style: styles.content.collapsedStyle,
          pressedStyle: styles.content.collapsedPressedStyle,
          textStyle: styles.content.collapsedTextStyle,
        }}
      />
      <ChatMessageToolExecutionStack
        {...conversation.toolExecutionStack}
        styles={styles.toolExecutionStack}
      />
      <ChatMessageStandaloneActions
        {...conversation.standaloneActions}
        rowStyle={styles.standaloneActions.rowStyle}
      />
    </>
  );
}

export function ChatMessageRetryStatus({
  renderState,
  styles,
}: ChatMessageRetryStatusProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={styles.card}
    >
      <View style={styles.header}>
        <Ionicons
          name={renderState.icon.name}
          size={renderState.icon.size}
          color={renderState.icon.color}
        />
        <Text
          style={styles.title}
          numberOfLines={renderState.surface.titleNumberOfLines}
        >
          {renderState.title}
        </Text>
        <ActivityIndicator
          size={renderState.spinner.size}
          color={renderState.spinner.color}
        />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.attempt}>
          {renderState.attemptLabel}
        </Text>
        <Text style={styles.countdown}>
          {renderState.countdownLabel}
        </Text>
      </View>
      <Text style={styles.description}>
        {renderState.description}
      </Text>
    </View>
  );
}

export function ChatMessageToolApproval({
  renderState,
  toolName,
  argumentsPreview,
  argumentsContent,
  onToggleArguments,
  onDeny,
  onApprove,
  styles,
}: ChatMessageToolApprovalProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name={renderState.headerIcon.name}
          size={renderState.headerIcon.size}
          color={renderState.headerIcon.color}
        />
        <Text
          style={styles.title}
          numberOfLines={renderState.surface.title.numberOfLines}
        >
          {renderState.title}
        </Text>
        {renderState.approveButton.isDisabled ? (
          <ActivityIndicator
            size={renderState.spinner.size}
            color={renderState.spinner.color}
          />
        ) : null}
      </View>
      <View
        style={[
          styles.content,
          renderState.approveButton.isDisabled && styles.contentDisabled,
        ]}
      >
        <View style={styles.toolRow}>
          <Text style={styles.toolLabel}>
            {renderState.copy.toolLabel}:
          </Text>
          <Text
            style={styles.toolName}
            numberOfLines={renderState.surface.toolName.numberOfLines}
          >
            {toolName}
          </Text>
        </View>
        {argumentsPreview ? (
          <Text
            style={styles.argumentsPreview}
            numberOfLines={renderState.surface.argumentsPreview.numberOfLines}
          >
            {argumentsPreview}
          </Text>
        ) : null}
        <Pressable
          onPress={onToggleArguments}
          disabled={renderState.argumentsToggle.isDisabled}
          accessibilityRole={renderState.argumentsToggle.accessibilityRole}
          accessibilityLabel={renderState.argumentsToggle.accessibilityLabel}
          accessibilityState={renderState.argumentsToggle.accessibilityState}
          aria-expanded={renderState.argumentsToggle.ariaExpanded}
          style={({ pressed }) => [
            styles.argumentsToggle,
            pressed && styles.argumentsTogglePressed,
            renderState.argumentsToggle.isDisabled && styles.buttonDisabled,
          ]}
        >
          <Ionicons
            name={renderState.argumentsToggle.icon.name}
            size={renderState.argumentsToggle.icon.size}
            color={renderState.argumentsToggle.icon.color}
          />
          <Text style={styles.argumentsToggleText}>
            {renderState.argumentsToggle.label}
          </Text>
        </Pressable>
        {renderState.argumentsToggle.ariaExpanded ? (
          <ScrollView style={styles.argumentsScroll} nestedScrollEnabled>
            <Text style={styles.argumentsFull}>
              {argumentsContent}
            </Text>
          </ScrollView>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.denyButton,
              renderState.denyButton.isDisabled && styles.buttonDisabled,
            ]}
            onPress={onDeny}
            disabled={renderState.denyButton.isDisabled}
            accessibilityRole={renderState.denyButton.accessibilityRole}
            accessibilityLabel={renderState.denyButton.accessibilityLabel}
            accessibilityState={renderState.denyButton.accessibilityState}
          >
            <Ionicons
              name={renderState.denyButton.icon.name}
              size={renderState.denyButton.icon.size}
              color={renderState.denyButton.icon.color}
            />
            <Text style={styles.denyButtonText}>
              {renderState.denyButton.label}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.approveButton,
              renderState.approveButton.isDisabled && styles.buttonDisabled,
            ]}
            onPress={onApprove}
            disabled={renderState.approveButton.isDisabled}
            accessibilityRole={renderState.approveButton.accessibilityRole}
            accessibilityLabel={renderState.approveButton.accessibilityLabel}
            accessibilityState={renderState.approveButton.accessibilityState}
          >
            {renderState.approveButton.isDisabled ? (
              <ActivityIndicator
                size={renderState.approveButton.spinner.size}
                color={renderState.approveButton.spinner.color}
              />
            ) : (
              <Ionicons
                name={renderState.approveButton.icon.name}
                size={renderState.approveButton.icon.size}
                color={renderState.approveButton.icon.color}
              />
            )}
            <Text style={styles.approveButtonText}>
              {renderState.approveButton.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function ChatMessageDelegationCard({
  surface,
  agentName,
  presentation,
  accessibilityLabel,
  messageCountLabel,
  statusStyles,
  conversationPreview,
  toolPreview,
  styles,
}: ChatMessageDelegationCardProps) {
  return (
    <View
      accessible
      accessibilityRole={surface.accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
          numberOfLines={surface.titleNumberOfLines}
        >
          {agentName}
        </Text>
        <View
          style={[
            styles.statusBadge,
            statusStyles?.chip,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              statusStyles?.text,
            ]}
            numberOfLines={surface.statusNumberOfLines}
          >
            {presentation.statusLabel}
          </Text>
        </View>
        {presentation.isActive ? (
          <Text style={styles.liveText}>
            {surface.liveLabel}
          </Text>
        ) : null}
      </View>
      {presentation.subtitle ? (
        <Text
          style={styles.subtitle}
          numberOfLines={surface.subtitleNumberOfLines}
        >
          {presentation.subtitle}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Text
          style={styles.metaText}
          numberOfLines={surface.metaNumberOfLines}
        >
          {presentation.sourceLabel}
        </Text>
        {presentation.trackingLabel ? (
          <Text
            style={styles.metaText}
            numberOfLines={surface.metaNumberOfLines}
          >
            {presentation.trackingLabel}
          </Text>
        ) : null}
        {messageCountLabel ? (
          <Text
            style={styles.metaText}
            numberOfLines={surface.metaNumberOfLines}
          >
            {messageCountLabel}
          </Text>
        ) : null}
      </View>
      {conversationPreview.rows.length > 0 ? (
        <View style={styles.conversationPreview}>
          {conversationPreview.rows.map((row, rowIndex) => (
            <View
              key={`${row.timestamp}-${row.role}-${rowIndex}`}
              style={styles.conversationPreviewLine}
            >
              <Text
                style={[
                  styles.conversationPreviewRole,
                  conversationPreview.roleStyles[row.role],
                ]}
                numberOfLines={surface.conversationPreviewRoleNumberOfLines}
                ellipsizeMode={surface.conversationPreviewRoleEllipsizeMode}
              >
                {row.roleLabel}
              </Text>
              <Text
                style={styles.conversationPreviewContent}
                numberOfLines={surface.conversationPreviewContentNumberOfLines}
                ellipsizeMode={surface.conversationPreviewContentEllipsizeMode}
              >
                {row.content}
              </Text>
              {row.timestampLabel ? (
                <Text
                  style={styles.conversationPreviewTimestamp}
                  numberOfLines={surface.conversationPreviewTimestampNumberOfLines}
                >
                  {row.timestampLabel}
                </Text>
              ) : null}
            </View>
          ))}
          {conversationPreview.hiddenCount > 0 && conversationPreview.onShowAll ? (
            <Pressable
              onPress={conversationPreview.onShowAll}
              accessibilityRole={conversationPreview.moreAction.accessibilityRole}
              accessibilityLabel={conversationPreview.moreAction.accessibilityLabel}
              style={({ pressed }) => [
                styles.conversationPreviewMoreButton,
                pressed && styles.conversationPreviewMoreButtonPressed,
              ]}
            >
              <Text
                style={styles.conversationPreviewMore}
                numberOfLines={conversationPreview.moreAction.numberOfLines}
              >
                {conversationPreview.moreAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {toolPreview.shouldRender ? (
        <View style={styles.toolPreview}>
          <Text
            style={styles.toolPreviewLabel}
            numberOfLines={surface.toolPreviewLabelNumberOfLines}
          >
            {toolPreview.label}
          </Text>
          {toolPreview.rows.map(({ key, preview, renderState }) => (
            <View
              key={key}
              style={styles.toolPreviewLine}
              accessibilityLabel={renderState.accessibilityLabel}
            >
              <View
                style={styles.toolPreviewStatusIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {renderState.statusIndicator.spinner.shouldRender ? (
                  <ActivityIndicator
                    size={renderState.statusIndicator.spinner.size}
                    color={renderState.statusIndicator.spinner.color}
                  />
                ) : renderState.statusIndicator.icon.shouldRender ? (
                  <Ionicons
                    name={renderState.statusIndicator.icon.name}
                    size={renderState.statusIndicator.icon.size}
                    color={renderState.statusIndicator.icon.color}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.toolPreviewName,
                  renderState.isPending && styles.toolPreviewNamePending,
                  renderState.isSuccess && styles.toolPreviewNameSuccess,
                  renderState.isError && styles.toolPreviewNameError,
                ]}
                numberOfLines={renderState.name.numberOfLines}
                ellipsizeMode={renderState.name.ellipsizeMode}
              >
                {preview}
              </Text>
            </View>
          ))}
          {toolPreview.hiddenCount > 0 && toolPreview.onShowAll ? (
            <Pressable
              onPress={toolPreview.onShowAll}
              accessibilityRole={toolPreview.moreAction.accessibilityRole}
              accessibilityLabel={toolPreview.moreAction.accessibilityLabel}
              style={({ pressed }) => [
                styles.toolPreviewMoreButton,
                pressed && styles.toolPreviewMoreButtonPressed,
              ]}
            >
              <Text
                style={styles.toolPreviewMore}
                numberOfLines={toolPreview.moreAction.numberOfLines}
              >
                {toolPreview.moreAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ChatMessageToolActivityGroupToggle({
  renderState,
  headerKind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupToggleProps) {
  const headerState = headerKind === 'collapsed'
    ? renderState.collapsedHeader
    : renderState.expandedHeader;
  const { summary } = renderState;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={headerState.accessibilityRole}
      accessibilityLabel={headerState.accessibilityLabel}
      accessibilityState={headerState.accessibilityState}
      aria-expanded={headerState.ariaExpanded}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Ionicons
          name={renderState.leadingIcon.name}
          size={renderState.leadingIcon.size}
          color={renderState.leadingIcon.color}
        />
        {summary.shouldShowToolCallCount && (
          <View
            accessibilityLabel={summary.toolCallCountLabel}
            style={styles.countBadge}
          >
            <Text style={styles.countBadgeText}>
              {summary.toolCallCount}
            </Text>
          </View>
        )}
        <Text
          style={styles.previewLine}
          numberOfLines={renderState.surface.preview.numberOfLines}
          ellipsizeMode={renderState.surface.preview.ellipsizeMode}
        >
          {summary.previewText}
        </Text>
        <Ionicons
          name={renderState.headerToggleIcon.name}
          size={renderState.headerToggleIcon.size}
          color={renderState.headerToggleIcon.color}
        />
      </View>
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupFooter({
  renderState,
  onPress,
  styles,
}: ChatMessageToolActivityGroupFooterProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.footerButton.accessibilityRole}
      accessibilityLabel={renderState.footerButton.accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={renderState.footerToggleIcon.name}
        size={renderState.footerToggleIcon.size}
        color={renderState.footerToggleIcon.color}
      />
      <Text style={styles.text}>
        {renderState.footerButton.label}
      </Text>
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupBoundary({
  renderState,
  kind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupBoundaryProps) {
  if (kind === 'footer') {
    return (
      <ChatMessageToolActivityGroupFooter
        renderState={renderState}
        onPress={onPress}
        styles={styles.footer}
      />
    );
  }

  return (
    <ChatMessageToolActivityGroupToggle
      renderState={renderState}
      headerKind={kind}
      onPress={onPress}
      styles={styles.toggle}
    />
  );
}

export function ChatMessageToolExecutionCompactGroup({
  renderState,
  onPress,
  styles,
  children,
}: ChatMessageToolExecutionCompactGroupProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
      accessibilityState={renderState.accessibilityState}
      aria-expanded={renderState.ariaExpanded}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCompactRow({
  renderState,
  styles,
}: ChatMessageToolExecutionCompactRowProps) {
  return (
    <View
      style={styles.line}
      accessibilityLabel={renderState.accessibilityLabel}
    >
      <View style={styles.leadingIcon}>
        <Ionicons
          name={renderState.toolIcon.name}
          size={renderState.toolIcon.size}
          color={renderState.toolIcon.color}
        />
      </View>
      <Text
        style={[
          styles.name,
          renderState.isPending && styles.namePending,
          renderState.isSuccess && styles.nameSuccess,
          renderState.isError && styles.nameError,
        ]}
        numberOfLines={renderState.name.numberOfLines}
        ellipsizeMode={renderState.name.ellipsizeMode}
      >
        {renderState.preview}
      </Text>
      <View style={styles.statusIndicator}>
        {renderState.statusIndicator.spinner.shouldRender ? (
          <ActivityIndicator
            size={renderState.statusIndicator.spinner.size}
            color={renderState.statusIndicator.spinner.color}
          />
        ) : renderState.statusIndicator.icon.shouldRender ? (
          <Ionicons
            name={renderState.statusIndicator.icon.name}
            size={renderState.statusIndicator.icon.size}
            color={renderState.statusIndicator.icon.color}
          />
        ) : null}
      </View>
      <View style={styles.toggleIcon}>
        <Ionicons
          name={renderState.toggleIcon.name}
          size={renderState.toggleIcon.size}
          color={renderState.toggleIcon.color}
        />
      </View>
    </View>
  );
}

export function ChatMessageToolExecutionCompactList({
  shouldRender,
  renderState,
  rows,
  onPress,
  groupStyles,
  rowStyles,
}: ChatMessageToolExecutionCompactListProps) {
  if (!shouldRender) return null;

  return (
    <ChatMessageToolExecutionCompactGroup
      renderState={renderState}
      onPress={onPress}
      styles={groupStyles}
    >
      {rows.map((row) => (
        <ChatMessageToolExecutionCompactRow
          key={row.key}
          renderState={row.renderState}
          styles={rowStyles}
        />
      ))}
    </ChatMessageToolExecutionCompactGroup>
  );
}

export function ChatMessageToolExecutionCollapseControl({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCollapseControlProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        styles.placement,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </Pressable>
  );
}

export function ChatMessageToolExecutionExpandedGroup({
  topCollapseRenderState,
  bottomCollapseRenderState,
  onCollapsePress,
  isPending,
  allSuccess,
  hasErrors,
  emptyState,
  styles,
  children,
}: ChatMessageToolExecutionExpandedGroupProps) {
  const collapseControlStyles = {
    button: styles.collapseButton,
    pressed: styles.collapsePressed,
    text: styles.collapseText,
  };

  return (
    <View style={styles.container}>
      <ChatMessageToolExecutionCollapseControl
        renderState={topCollapseRenderState}
        onPress={onCollapsePress}
        styles={{
          ...collapseControlStyles,
          placement: styles.collapseTopPlacement,
        }}
      />
      <View
        style={[
          styles.card,
          isPending && styles.pending,
          allSuccess && styles.success,
          hasErrors && styles.error,
        ]}
      >
        {children}
        {emptyState}
      </View>
      <ChatMessageToolExecutionCollapseControl
        renderState={bottomCollapseRenderState}
        onPress={onCollapsePress}
        styles={{
          ...collapseControlStyles,
          placement: styles.collapseBottomPlacement,
        }}
      />
    </View>
  );
}

export function ChatMessageToolExecutionPanel({
  shouldRender,
  isExpanded,
  compact,
  expanded,
  children,
}: ChatMessageToolExecutionPanelProps) {
  if (!shouldRender) return null;

  return (
    <>
      <ChatMessageToolExecutionCompactList
        shouldRender={!isExpanded}
        {...compact}
      />
      {isExpanded ? (
        <ChatMessageToolExecutionExpandedGroup {...expanded}>
          {children}
        </ChatMessageToolExecutionExpandedGroup>
      ) : null}
    </>
  );
}

export function ChatMessageToolExecutionStack({
  shouldRender,
  isExpanded,
  compact,
  expanded,
  detailRows,
  styles,
}: ChatMessageToolExecutionStackProps) {
  const { emptyState, ...expandedGroup } = expanded;

  return (
    <ChatMessageToolExecutionPanel
      shouldRender={shouldRender}
      isExpanded={isExpanded}
      compact={{
        ...compact,
        groupStyles: styles.compactGroup,
        rowStyles: styles.compactRow,
      }}
      expanded={{
        ...expandedGroup,
        emptyState: emptyState?.shouldRender ? (
          <ChatMessageToolExecutionEmptyState
            renderState={emptyState.renderState}
            style={styles.emptyStateText}
          />
        ) : null,
        styles: styles.expandedGroup,
      }}
    >
      <ChatMessageToolExecutionCallList
        rows={detailRows}
        styles={styles.callDetail}
      />
    </ChatMessageToolExecutionPanel>
  );
}

export function ChatMessageToolExecutionCopyButton({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCopyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </Pressable>
  );
}

export function ChatMessageToolExecutionDetailHeader({
  renderState,
  toolName,
  onPress,
  styles,
}: ChatMessageToolExecutionDetailHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.header,
        pressed && styles.headerPressed,
      ]}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityState={renderState.accessibilityState}
      aria-expanded={renderState.ariaExpanded}
      accessibilityHint={renderState.accessibilityHint}
    >
      <Text style={styles.toolName}>
        {toolName}
      </Text>
      <View style={styles.expandHint}>
        <Ionicons
          name={renderState.toggleIcon.name}
          size={renderState.toggleIcon.size}
          color={renderState.toggleIcon.color}
        />
        <Text style={styles.expandHintText}>
          {renderState.toggleLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function ChatMessageToolExecutionCallSection({
  renderState,
  toolName,
  onHeaderPress,
  styles,
  children,
}: ChatMessageToolExecutionCallSectionProps) {
  return (
    <View style={styles.section}>
      <ChatMessageToolExecutionDetailHeader
        renderState={renderState}
        toolName={toolName}
        onPress={onHeaderPress}
        styles={styles.header}
      />
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultBadge({
  badge,
  styles,
}: ChatMessageToolExecutionResultBadgeProps) {
  return (
    <View
      accessible
      accessibilityRole={badge.accessibilityRole}
      accessibilityLabel={badge.accessibilityLabel}
      style={[
        styles.badge,
        badge.isSuccess ? styles.badgeSuccess : styles.badgeError,
      ]}
    >
      <Ionicons
        name={badge.icon.name}
        size={badge.icon.size}
        color={badge.icon.color}
      />
      <Text
        style={[
          styles.text,
          badge.isSuccess ? styles.textSuccess : styles.textError,
        ]}
      >
        {badge.label}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionPendingResult({
  renderState,
  styles,
}: ChatMessageToolExecutionPendingResultProps) {
  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={styles.row}
    >
      <ActivityIndicator
        size={renderState.spinner.size}
        color={renderState.spinner.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionEmptyState({
  renderState,
  style,
}: ChatMessageToolExecutionEmptyStateProps) {
  return (
    <Text
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={style}
    >
      {renderState.label}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadMeta({
  renderState,
  styles,
}: ChatMessageToolExecutionPayloadMetaProps) {
  const content = (
    <>
      <Text style={styles.label}>
        {renderState.label}
      </Text>
      {renderState.payloadTypeLabel ? (
        <Text style={styles.payloadType}>
          {renderState.payloadTypeLabel}
        </Text>
      ) : null}
    </>
  );

  if (!styles.row) {
    return content;
  }

  return (
    <View style={styles.row}>
      {content}
    </View>
  );
}

export function ChatMessageToolExecutionResultHeader({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionResultHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.meta}>
        <ChatMessageToolExecutionPayloadMeta
          renderState={payloadRenderState}
          styles={styles.payloadMeta}
        />
        <ChatMessageToolExecutionResultBadge
          badge={resultBadge}
          styles={styles.badge}
        />
        <Text style={styles.characterCount}>
          {characterCountLabel}
        </Text>
      </View>
      <ChatMessageToolExecutionCopyButton
        renderState={copyButtonRenderState}
        onPress={onCopyPress}
        styles={styles.copyButton}
      />
    </View>
  );
}

export function ChatMessageToolExecutionPayloadBlock({
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  styles,
}: ChatMessageToolExecutionPayloadBlockProps) {
  return (
    <>
      {compactText ? (
        <Text
          style={styles.preview}
          numberOfLines={previewNumberOfLines}
        >
          {compactText}
        </Text>
      ) : null}
      <ScrollView
        style={isExpanded ? styles.scrollExpanded : styles.scroll}
        nestedScrollEnabled
      >
        <Text style={styles.code}>
          {content}
        </Text>
      </ScrollView>
    </>
  );
}

export function ChatMessageToolExecutionPayloadSection({
  payloadRenderState,
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionPayloadSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <ChatMessageToolExecutionPayloadMeta
          renderState={payloadRenderState}
          styles={styles.payloadMeta}
        />
        <ChatMessageToolExecutionCopyButton
          renderState={copyButtonRenderState}
          onPress={onCopyPress}
          styles={styles.copyButton}
        />
      </View>
      <ChatMessageToolExecutionPayloadBlock
        compactText={compactText}
        content={content}
        isExpanded={isExpanded}
        previewNumberOfLines={previewNumberOfLines}
        styles={styles.payloadBlock}
      />
    </View>
  );
}

export function ChatMessageToolExecutionErrorBlock({
  renderState,
  error,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionErrorBlockProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {renderState.label}
        </Text>
        <ChatMessageToolExecutionCopyButton
          renderState={copyButtonRenderState}
          onPress={onCopyPress}
          styles={styles.copyButton}
        />
      </View>
      <Text style={styles.text}>
        {error}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionResultSection({
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
}: ChatMessageToolExecutionResultSectionProps) {
  return (
    <View style={styles.item}>
      <ChatMessageToolExecutionResultHeader
        payloadRenderState={payloadRenderState}
        resultBadge={resultBadge}
        characterCountLabel={characterCountLabel}
        copyButtonRenderState={copyButtonRenderState}
        onCopyPress={onCopyPress}
        styles={styles.header}
      />
      <ChatMessageToolExecutionPayloadBlock
        compactText={resultCompactText}
        content={resultContent}
        isExpanded={isExpanded}
        previewNumberOfLines={previewNumberOfLines}
        styles={styles.payloadBlock}
      />
      {error ? (
        <ChatMessageToolExecutionErrorBlock
          renderState={errorRenderState}
          error={error}
          copyButtonRenderState={errorCopyButtonRenderState}
          onCopyPress={onErrorCopyPress}
          styles={styles.errorBlock}
        />
      ) : null}
    </View>
  );
}

export function ChatMessageToolExecutionCallDetail({
  renderState,
  toolName,
  onHeaderPress,
  input,
  result,
  pendingResult,
  styles,
}: ChatMessageToolExecutionCallDetailProps) {
  return (
    <ChatMessageToolExecutionCallSection
      renderState={renderState}
      toolName={toolName}
      onHeaderPress={onHeaderPress}
      styles={styles.callSection}
    >
      {input ? (
        <ChatMessageToolExecutionPayloadSection
          payloadRenderState={input.payloadRenderState}
          compactText={input.compactText}
          content={input.content}
          isExpanded={input.isExpanded}
          previewNumberOfLines={input.previewNumberOfLines}
          copyButtonRenderState={input.copyButtonRenderState}
          onCopyPress={input.onCopyPress}
          styles={styles.payloadSection}
        />
      ) : null}
      {result ? (
        <ChatMessageToolExecutionResultSection
          payloadRenderState={result.payloadRenderState}
          resultBadge={result.resultBadge}
          characterCountLabel={result.characterCountLabel}
          resultCompactText={result.resultCompactText}
          resultContent={result.resultContent}
          isExpanded={result.isExpanded}
          previewNumberOfLines={result.previewNumberOfLines}
          copyButtonRenderState={result.copyButtonRenderState}
          onCopyPress={result.onCopyPress}
          errorRenderState={result.errorRenderState}
          error={result.error}
          errorCopyButtonRenderState={result.errorCopyButtonRenderState}
          onErrorCopyPress={result.onErrorCopyPress}
          styles={styles.resultSection}
        />
      ) : pendingResult ? (
        <ChatMessageToolExecutionPendingResult
          renderState={pendingResult.renderState}
          styles={styles.pendingResult}
        />
      ) : null}
    </ChatMessageToolExecutionCallSection>
  );
}

export function ChatMessageToolExecutionCallList({
  rows,
  styles,
}: ChatMessageToolExecutionCallListProps) {
  return (
    <>
      {rows.map((row) => (
        <ChatMessageToolExecutionCallDetail
          key={row.key}
          renderState={row.renderState}
          toolName={row.toolName}
          onHeaderPress={row.onHeaderPress}
          input={row.input}
          result={row.result}
          pendingResult={row.pendingResult}
          styles={styles}
        />
      ))}
    </>
  );
}

export function ChatMessageConversationFrame({
  children,
  dock,
  overlays,
  keyboardAvoidingStyle,
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  rootStyle,
}: ChatMessageConversationFrameProps) {
  return (
    <KeyboardAvoidingView
      style={keyboardAvoidingStyle}
      behavior={keyboardAvoidingBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={rootStyle}>
        {children}
        {dock}
      </View>
      {overlays}
    </KeyboardAvoidingView>
  );
}

export function ChatMessageConversationOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageConversationOverlaysProps) {
  return (
    <>
      {agentSelector}
      {promptEditor}
    </>
  );
}

export function ChatMessageRuntimeOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageRuntimeOverlaysProps) {
  return (
    <ChatMessageConversationOverlays
      agentSelector={<AgentSelectorSheet {...agentSelector} />}
      promptEditor={(
        <ChatConversationHomePromptEditorModal {...promptEditor} />
      )}
    />
  );
}

export function ChatMessageScrollViewport({
  children,
  scrollRef,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  contentInsetAdjustmentBehavior,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  scrollEventThrottle,
}: ChatMessageScrollViewportProps) {
  return (
    <ScrollView
      ref={scrollRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      scrollEventThrottle={scrollEventThrottle}
    >
      {children}
    </ScrollView>
  );
}

export function ChatMessageConversationViewportContent({
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  children,
  debugPanels,
}: ChatMessageConversationViewportContentProps) {
  return (
    <>
      {loadingState}
      {homeState}
      {historyBanner}
      {stepSummary}
      {children}
      {debugPanels}
    </>
  );
}

export function ChatMessageConversationViewport({
  children,
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  debugPanels,
  ...scrollViewportProps
}: ChatMessageConversationViewportProps) {
  return (
    <ChatMessageScrollViewport {...scrollViewportProps}>
      <ChatMessageConversationViewportContent
        loadingState={loadingState}
        homeState={homeState}
        historyBanner={historyBanner}
        stepSummary={stepSummary}
        debugPanels={debugPanels}
      >
        {children}
      </ChatMessageConversationViewportContent>
    </ChatMessageScrollViewport>
  );
}

export function ChatMessageRuntimeViewport<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  children,
  loadingState,
  homeQuickStarts,
  historyBanner,
  stepSummary,
  debugPanels,
  styles,
  ...scrollViewportProps
}: ChatMessageRuntimeViewportProps<TPrompt, TTask>) {
  return (
    <ChatMessageConversationViewport
      {...scrollViewportProps}
      style={styles.scrollViewport.style}
      contentContainerStyle={styles.scrollViewport.contentContainerStyle}
      loadingState={(
        <ChatMessageLoadingState
          {...loadingState}
          style={styles.loadingState.style}
          spinnerStyle={styles.loadingState.spinnerStyle}
        />
      )}
      homeState={(
        <ChatConversationHomeQuickStarts
          {...homeQuickStarts}
          styles={styles.homeQuickStarts}
        />
      )}
      historyBanner={(
        <ChatMessageHistoryBanner
          {...historyBanner}
          styles={styles.historyBanner}
        />
      )}
      stepSummary={(
        <ChatMessageStepSummaryCard
          {...stepSummary}
          styles={styles.stepSummary}
        />
      )}
      debugPanels={(
        <ChatMessageDebugPanelStack
          {...debugPanels}
          panelStyle={styles.debugPanels.panelStyle}
          textStyle={styles.debugPanels.textStyle}
        />
      )}
    >
      {children}
    </ChatMessageConversationViewport>
  );
}

export function ChatMessageRuntimeSurface<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  frame,
  dock,
  overlays,
  threadList,
  viewport,
  styles,
}: ChatMessageRuntimeSurfaceProps<TPrompt, TTask>) {
  return (
    <ChatMessageConversationFrame
      keyboardAvoidingStyle={styles.frame.keyboardAvoidingStyle}
      keyboardAvoidingBehavior={frame.keyboardAvoidingBehavior}
      keyboardVerticalOffset={frame.keyboardVerticalOffset}
      rootStyle={styles.frame.rootStyle}
      dock={(
        <ChatMessageRuntimeDock
          {...dock}
          styles={styles.dock}
        />
      )}
      overlays={(
        <ChatMessageRuntimeOverlays
          {...overlays}
        />
      )}
    >
      <ChatMessageRuntimeViewport
        {...viewport}
        styles={styles.viewport}
      >
        <ChatMessageConversationRuntimeThreadList {...threadList} />
      </ChatMessageRuntimeViewport>
    </ChatMessageConversationFrame>
  );
}

export function ChatMessageHistoryBanner({
  renderState,
  onLoadEarlier,
  styles,
}: ChatMessageHistoryBannerProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        {renderState.summaryLabel}
      </Text>
      <Pressable
        onPress={onLoadEarlier}
        accessibilityRole={renderState.loadButton.accessibilityRole}
        accessibilityLabel={renderState.loadButton.accessibilityLabel}
        style={({ pressed }) => [
          styles.loadButton,
          pressed && styles.loadButtonPressed,
        ]}
      >
        <Ionicons
          name={renderState.loadButton.icon.name}
          size={renderState.loadButton.icon.size}
          color={renderState.loadButton.icon.color}
        />
        <Text style={styles.loadButtonText}>
          {renderState.loadButton.label}
        </Text>
      </Pressable>
    </View>
  );
}

export function ChatMessageStepSummaryCard({
  renderState,
  styles,
}: ChatMessageStepSummaryCardProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
          numberOfLines={renderState.surface.titleNumberOfLines}
        >
          {renderState.title}
        </Text>
        <View style={styles.badge}>
          <Text
            style={styles.badgeText}
            numberOfLines={renderState.surface.badgeNumberOfLines}
          >
            {renderState.badgeLabel}
          </Text>
        </View>
      </View>
      <Text
        style={styles.action}
        numberOfLines={renderState.surface.actionNumberOfLines}
      >
        {renderState.actionSummary}
      </Text>
      <Text
        style={styles.meta}
        numberOfLines={renderState.surface.metaNumberOfLines}
      >
        {renderState.meta}
      </Text>
      {renderState.preview ? (
        <Text
          style={styles.preview}
          numberOfLines={renderState.surface.previewNumberOfLines}
        >
          {renderState.preview}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatMessageScrollToBottomButton({
  renderState,
  onPress,
  style,
}: ChatMessageScrollToBottomButtonProps) {
  if (!renderState.shouldRender) return null;

  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={renderState.button.pressedOpacity}
      accessibilityRole={renderState.button.accessibilityRole}
      accessibilityLabel={renderState.button.accessibilityLabel}
      accessibilityHint={renderState.button.accessibilityHint}
    >
      <Ionicons
        name={renderState.button.icon.name}
        size={renderState.button.icon.size}
        color={renderState.button.icon.color}
      />
    </TouchableOpacity>
  );
}

export function ChatMessageLoadingState({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageLoadingStateProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityState={renderState.accessibilityState}
      style={style}
    >
      <Image
        source={spinnerSource}
        style={spinnerStyle}
        resizeMode={renderState.spinnerResizeMode}
      />
    </View>
  );
}

export function ChatMessageDebugPanel({
  shouldRender,
  rows,
  panelStyle,
  textStyle,
}: ChatMessageDebugPanelProps) {
  if (!shouldRender || rows.length === 0) return null;

  return (
    <View style={panelStyle}>
      {rows.map((row) => (
        <Text key={row.key} style={textStyle}>
          {row.text}
        </Text>
      ))}
    </View>
  );
}

export function ChatMessageDebugPanelStack({
  requestShouldRender,
  requestRows,
  voiceShouldRender,
  voiceRows,
  panelStyle,
  textStyle,
}: ChatMessageDebugPanelStackProps) {
  return (
    <>
      <ChatMessageDebugPanel
        shouldRender={requestShouldRender}
        rows={requestRows}
        panelStyle={panelStyle}
        textStyle={textStyle}
      />
      <ChatMessageDebugPanel
        shouldRender={voiceShouldRender}
        rows={voiceRows}
        panelStyle={panelStyle}
        textStyle={textStyle}
      />
    </>
  );
}

export function ChatMessageConversationDock({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
}: ChatMessageConversationDockProps) {
  return (
    <>
      {responseHistoryPanel}
      {scrollToBottomButton}
      {voiceOverlay}
      {queuePanel}
      {connectionBanner}
      {composer}
    </>
  );
}

export function ChatMessageRuntimeDock({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
  styles,
}: ChatMessageRuntimeDockProps) {
  return (
    <ChatMessageConversationDock
      responseHistoryPanel={(
        <ChatMessageResponseHistoryPanelDock
          {...responseHistoryPanel}
        />
      )}
      scrollToBottomButton={(
        <ChatMessageScrollToBottomButton
          {...scrollToBottomButton}
          style={styles.scrollToBottomButtonStyle}
        />
      )}
      voiceOverlay={(
        <ChatComposerVoiceOverlay
          {...voiceOverlay}
          styles={styles.voiceOverlay}
        />
      )}
      queuePanel={(
        <ChatMessageQueuePanelDock
          {...queuePanel}
          style={styles.queuePanelStyle}
        />
      )}
      connectionBanner={(
        <ChatMessageConnectionBanner
          {...connectionBanner}
          styles={styles.connectionBanner}
        />
      )}
      composer={(
        <ChatComposerRuntimeDock
          {...composer}
          styles={styles.composer}
        />
      )}
    />
  );
}

export function ChatMessageResponseHistoryPanelDock(panelProps: ChatMessageResponseHistoryPanelDockProps) {
  return <ResponseHistoryPanel {...panelProps} />;
}

export function ChatMessageQueuePanelDock({
  shouldRender,
  panel,
  style,
}: ChatMessageQueuePanelDockProps) {
  if (!shouldRender) return null;

  return (
    <View style={style}>
      <MessageQueuePanel {...panel} />
    </View>
  );
}

export function ChatMessageConnectionBanner({
  renderState,
  onRetry,
  styles,
}: ChatMessageConnectionBannerProps) {
  return (
    <>
      {renderState.reconnecting.shouldRender ? (
        <View
          accessible
          accessibilityRole={renderState.reconnecting.accessibilityRole}
          accessibilityLabel={renderState.reconnecting.accessibilityLabel}
          style={[styles.banner, styles.reconnecting]}
        >
          <View style={styles.content}>
            <ActivityIndicator
              size={renderState.reconnecting.spinner.size}
              color={renderState.reconnecting.spinner.color}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {renderState.reconnecting.title}
              </Text>
              {renderState.reconnecting.subtitle ? (
                <Text
                  style={styles.subtitle}
                  numberOfLines={renderState.surface.subtitleNumberOfLines}
                >
                  {renderState.reconnecting.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
      {renderState.failed.shouldRender ? (
        <View
          accessible
          accessibilityRole={renderState.failed.accessibilityRole}
          accessibilityLabel={renderState.failed.accessibilityLabel}
          style={[styles.banner, styles.failed]}
        >
          <View style={styles.content}>
            <Ionicons
              name={renderState.failed.icon.name}
              size={renderState.failed.icon.size}
              color={renderState.failed.icon.color}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {renderState.failed.title}
              </Text>
              <Text
                style={styles.subtitle}
                numberOfLines={renderState.surface.subtitleNumberOfLines}
              >
                {renderState.failed.subtitle}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              accessibilityRole={renderState.failed.retryButton.accessibilityRole}
              accessibilityLabel={renderState.failed.retryButton.accessibilityLabel}
              activeOpacity={renderState.failed.retryButton.pressedOpacity}
            >
              <Text style={styles.retryButtonText}>
                {renderState.failed.retryButton.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </>
  );
}

export function ChatComposerRuntimeDock({
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
}: ChatComposerRuntimeDockProps) {
  const { status: handsFreeStatus, ...handsFreeControlProps } = handsFreeControls;

  return (
    <ChatComposerInputDock
      speechPreview={(
        <ChatComposerSpeechPreview
          {...speechPreview}
          styles={styles.speechPreview}
        />
      )}
      pendingImagesRail={(
        <ChatComposerPendingImagesRail
          {...pendingImagesRail}
          styles={styles.pendingImagesRail}
        />
      )}
      handsFreeControls={(
        <ChatComposerHandsFreeControls
          {...handsFreeControlProps}
          status={<HandsFreeStatusChip {...handsFreeStatus} />}
          styles={styles.handsFreeControls}
        />
      )}
      imageAttachmentControl={(
        <ChatComposerIconButton
          {...imageAttachmentControl}
          style={styles.accessoryButton.style}
          activeStyle={styles.accessoryButton.activeStyle}
        />
      )}
      textToSpeechControl={(
        <ChatComposerIconButton
          {...textToSpeechControl}
          style={styles.accessoryButton.style}
          activeStyle={styles.accessoryButton.activeStyle}
        />
      )}
      editBeforeSendControl={(
        <ChatComposerIconButton
          {...editBeforeSendControl}
          style={styles.accessoryButton.style}
          activeStyle={styles.accessoryButton.activeStyle}
        />
      )}
      textEntry={(
        <ChatComposerTextEntry
          {...textEntry}
          styles={styles.textEntry}
        />
      )}
      queueAction={(
        <ChatComposerLabeledActionButton
          {...queueAction}
          styles={styles.queueAction}
        />
      )}
      submitAction={(
        <ChatComposerLabeledActionButton
          {...submitAction}
          styles={styles.submitAction}
        />
      )}
      micButton={(
        <ChatComposerMicButton
          {...micButton}
          styles={styles.micButton}
        />
      )}
      micWrapperRef={micWrapperRef}
      styles={styles.inputDock}
    />
  );
}

export function ChatComposerInputDock({
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
}: ChatComposerInputDockProps) {
  return (
    <View style={styles.area}>
      {speechPreview}
      {pendingImagesRail}
      {handsFreeControls}
      <View style={styles.row}>
        {imageAttachmentControl}
        {textToSpeechControl}
        {editBeforeSendControl}
        {textEntry}
        {queueAction}
        {submitAction}
      </View>
      <View
        ref={micWrapperRef}
        style={styles.micWrapper}
      >
        {micButton}
      </View>
    </View>
  );
}

export function ChatComposerSpeechPreview({
  label,
  text,
  styles,
}: ChatComposerSpeechPreviewProps) {
  if (!text) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.label}>
        {label}
      </Text>
      <Text style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

export function ChatComposerPendingImagesRail({
  images,
  renderState,
  onRemove,
  styles,
}: ChatComposerPendingImagesRailProps) {
  if (images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={renderState.surface.row.showsHorizontalScrollIndicator}
      contentContainerStyle={styles.row}
    >
      {images.map((image) => (
        <View key={image.id} style={styles.card}>
          <Image
            source={{ uri: image.previewUri }}
            style={styles.preview}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(image.id)}
            activeOpacity={renderState.removeButton.pressedOpacity}
            accessibilityRole={renderState.removeButton.accessibilityRole}
            accessibilityLabel={renderState.removeButton.accessibilityLabel}
          >
            <Ionicons
              name={renderState.removeIcon.name}
              size={renderState.removeIcon.size}
              color={renderState.removeIcon.color}
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

export function ChatComposerVoiceOverlay({
  isVisible,
  label,
  transcript,
  transcriptNumberOfLines,
  styles,
}: ChatComposerVoiceOverlayProps) {
  if (!isVisible) return null;

  return (
    <View
      style={styles.overlay}
      pointerEvents="none"
    >
      <View style={styles.card}>
        <Text style={styles.label}>
          {label}
        </Text>
        {!!transcript && (
          <Text
            style={styles.transcript}
            numberOfLines={transcriptNumberOfLines}
          >
            {transcript}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ChatComposerHandsFreeControls({
  isVisible,
  status,
  controlState,
  onWake,
  onSleep,
  onResume,
  onPause,
  controlPressedOpacity,
  styles,
}: ChatComposerHandsFreeControlsProps) {
  if (!isVisible) return null;

  const primaryOnPress = controlState.primary.action === 'wake'
    ? onWake
    : onSleep;
  const secondaryOnPress = controlState.secondary.action === 'resume'
    ? onResume
    : onPause;

  return (
    <>
      <View style={styles.statusRow}>
        {status}
      </View>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={primaryOnPress}
          activeOpacity={controlPressedOpacity}
          accessibilityRole={controlState.primary.accessibilityRole}
          accessibilityLabel={controlState.primary.accessibilityLabel}
        >
          <Text style={styles.controlButtonText}>
            {controlState.primary.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={secondaryOnPress}
          activeOpacity={controlPressedOpacity}
          accessibilityRole={controlState.secondary.accessibilityRole}
          accessibilityLabel={controlState.secondary.accessibilityLabel}
        >
          <Text style={styles.controlButtonText}>
            {controlState.secondary.label}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

export function ChatComposerIconButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  style,
  activeStyle,
}: ChatComposerIconButtonProps) {
  if (!shouldRender) return null;

  return (
    <TouchableOpacity
      style={[style, renderState.isActive && activeStyle]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint ?? undefined}
      accessibilityState={renderState.accessibilityState}
      aria-checked={renderState.ariaChecked}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
    </TouchableOpacity>
  );
}

export function ChatComposerLabeledActionButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  styles,
}: ChatComposerLabeledActionButtonProps) {
  if (!shouldRender) return null;

  return (
    <TouchableOpacity
      style={[styles.button, renderState.isDisabled && styles.disabledButton]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={renderState.isDisabled}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint ?? undefined}
      accessibilityState={renderState.accessibilityState}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </TouchableOpacity>
  );
}

export function ChatComposerMicButton({
  renderState,
  onPressIn,
  onPressOut,
  onPress,
  webPressedStyle,
  styles,
}: ChatComposerMicButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        renderState.isActive && styles.activeButton,
        webPressedStyle,
      ]}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint ?? undefined}
      accessibilityState={renderState.accessibilityState}
      aria-busy={renderState.ariaBusy}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text
        style={[styles.label, renderState.isActive && styles.activeLabel]}
        selectable={renderState.labelSelectable}
      >
        {renderState.label}
      </Text>
    </Pressable>
  );
}

export function ChatComposerTextEntry({
  inputRef,
  value,
  onChangeText,
  onKeyPress,
  accessibilityLabel,
  accessibilityHint,
  placeholder,
  placeholderTextColor,
  voiceStatusLiveRegionAnnouncement,
  webAccessibility,
  styles,
}: ChatComposerTextEntryProps) {
  const voiceStatusAriaLive: ComponentProps<typeof Text>['aria-live'] =
    webAccessibility.voiceStatusLiveRegionPoliteness === 'none'
      ? 'off'
      : webAccessibility.voiceStatusLiveRegionPoliteness;

  return (
    <>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        aria-describedby={webAccessibility.isWebPlatform ? webAccessibility.inputDescriptionNativeId : undefined}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline
      />
      {webAccessibility.isWebPlatform && (
        <Text
          nativeID={webAccessibility.inputDescriptionNativeId}
          style={styles.visuallyHiddenHint}
        >
          {accessibilityHint}
        </Text>
      )}
      {webAccessibility.isWebPlatform && (
        <Text
          nativeID={webAccessibility.voiceStatusLiveRegionNativeId}
          style={styles.visuallyHiddenHint}
          accessibilityLiveRegion={webAccessibility.voiceStatusLiveRegionPoliteness}
          aria-live={voiceStatusAriaLive}
        >
          {voiceStatusLiveRegionAnnouncement}
        </Text>
      )}
    </>
  );
}

export function ChatMessageInlineActivity({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageInlineActivityProps) {
  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityState={renderState.accessibilityState}
      style={style}
    >
      <Image
        source={spinnerSource}
        style={spinnerStyle}
        resizeMode={renderState.spinnerResizeMode}
      />
    </View>
  );
}

export function ChatMessageTurnDurationBadge({
  renderState,
  style,
  liveStyle,
  textStyle,
  liveTextStyle,
}: ChatMessageTurnDurationBadgeProps) {
  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={[
        style,
        renderState.isLive && liveStyle,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text
        style={[
          textStyle,
          renderState.isLive && liveTextStyle,
        ]}
        numberOfLines={renderState.badge.numberOfLines}
      >
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatMessageExpandedContent({
  streamingRenderState,
  markdownContent,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  streamingStyles,
}: ChatMessageExpandedContentProps) {
  if (!streamingRenderState.shouldRender) {
    return (
      <MarkdownRenderer
        content={markdownContent}
        assetBaseUrl={assetBaseUrl}
        assetAuthToken={assetAuthToken}
      />
    );
  }

  return (
    <>
      <View
        accessible
        accessibilityRole={streamingRenderState.accessibilityRole}
        accessibilityLabel={streamingRenderState.accessibilityLabel}
        style={streamingStyles.header}
      >
        <Ionicons
          name={streamingRenderState.icon.name}
          size={streamingRenderState.icon.size}
          color={streamingRenderState.icon.color}
        />
        <Text
          style={streamingStyles.title}
          numberOfLines={streamingRenderState.surface.titleNumberOfLines}
        >
          {streamingRenderState.title}
        </Text>
        <Image
          source={spinnerSource}
          style={streamingStyles.spinner}
          resizeMode={streamingRenderState.spinner.resizeMode}
        />
        <View style={streamingStyles.badge}>
          <Text style={streamingStyles.badgeText}>
            {streamingRenderState.badgeLabel}
          </Text>
        </View>
      </View>
      <View style={streamingStyles.bodyRow}>
        <Text style={streamingStyles.text}>
          {streamingRenderState.content}
        </Text>
        <View style={streamingStyles.caret} />
      </View>
    </>
  );
}

export function ChatMessageCollapsedPreview({
  renderState,
  actionState,
  onPress,
  style,
  pressedStyle,
  textStyle,
}: ChatMessageCollapsedPreviewProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={actionState.disabled}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={actionState.accessibilityLabel}
      accessibilityHint={actionState.accessibilityHint}
      accessibilityState={actionState.accessibilityState}
      aria-expanded={actionState.ariaExpanded}
      hitSlop={renderState.hitSlop}
      style={({ pressed }) => [
        style,
        pressed && !actionState.disabled && pressedStyle,
      ]}
    >
      <Text
        style={textStyle}
        numberOfLines={renderState.numberOfLines}
      >
        {renderState.text}
      </Text>
    </Pressable>
  );
}

export function ChatMessageConversationContent({
  contentState,
  rowStyle,
  slots,
  components,
  expanded,
  collapsed,
}: ChatMessageConversationContentProps) {
  if (contentState.shouldRenderExpandedContent) {
    return (
      <ChatMessageContentRow
        rowStyle={rowStyle}
        bodyStyle={expanded.bodyStyle}
        slots={slots}
        components={components}
      >
        <ChatMessageExpandedContent
          streamingRenderState={expanded.streamingRenderState}
          markdownContent={expanded.markdownContent}
          assetBaseUrl={expanded.assetBaseUrl}
          assetAuthToken={expanded.assetAuthToken}
          spinnerSource={expanded.spinnerSource}
          streamingStyles={expanded.streamingStyles}
        />
      </ChatMessageContentRow>
    );
  }

  if (contentState.shouldRenderCollapsedTextPreview) {
    return (
      <ChatMessageContentRow
        rowStyle={rowStyle}
        slots={slots}
        components={components}
      >
        <ChatMessageCollapsedPreview
          renderState={collapsed.renderState}
          actionState={collapsed.actionState}
          onPress={collapsed.onPress}
          style={collapsed.style}
          pressedStyle={collapsed.pressedStyle}
          textStyle={collapsed.textStyle}
        />
      </ChatMessageContentRow>
    );
  }

  return null;
}

export function ChatMessageContentRow({
  children,
  slots,
  components,
  rowStyle,
  bodyStyle,
}: ChatMessageContentRowProps) {
  return (
    <View style={rowStyle}>
      {bodyStyle ? (
        <View style={bodyStyle}>
          {children}
        </View>
      ) : children}
      <ChatMessageActionSlotList
        slots={slots}
        components={components}
      />
    </View>
  );
}

export function ChatMessageStandaloneActions({
  shouldRender,
  slots,
  components,
  rowStyle,
}: ChatMessageStandaloneActionsProps) {
  if (!shouldRender) return null;

  return (
    <ChatMessageActionSlotList
      slots={slots}
      components={components}
      rowStyle={rowStyle}
    />
  );
}

export function ChatMessageActionSlotList({
  slots,
  components,
  rowStyle,
}: ChatMessageActionSlotListProps) {
  const content = slots.map((actionSlot) => (
    <Fragment key={actionSlot}>
      {components[actionSlot]}
    </Fragment>
  ));

  if (rowStyle) {
    return <View style={rowStyle}>{content}</View>;
  }

  return <>{content}</>;
}
