import { Fragment, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type Dispatch, type ReactNode, type Ref, type RefObject, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type AppStateStatus,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type ImageStyle,
  type Insets,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { speakRemoteTts, stopRemoteTts } from '../lib/remoteTts';
import {
  CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS,
  applyChatMessageRuntimeAutoExpansionState,
  applyChatMessageRuntimeToolActivityGroupExpansionInheritance,
  createChatComposerRuntimeImagePickerLaunchOptions,
  createChatComposerRuntimeDockMobileProps,
  createChatComposerRuntimeDockMobilePropsParts,
  createChatComposerHandsFreeControlsMobilePropsParts,
  createChatComposerIconButtonMobilePropsParts,
  createChatComposerInputDockMobilePropsParts,
  createChatComposerLabeledActionButtonMobilePropsParts,
  createChatComposerMicButtonMobilePropsParts,
  createChatComposerPendingImagesRailMobilePropsParts,
  createChatComposerSpeechPreviewMobilePropsParts,
  createChatComposerTextEntryMobilePropsParts,
  createChatComposerVoiceOverlayMobilePropsParts,
  createChatMessageRuntimeLogMeta,
  createChatMessageRuntimeModelMessages,
  createChatMessageRuntimeToolActivityGroups,
  getChatComposerQueueMobileActionState,
  getChatComposerRuntimeBase64ImageBytes,
  getChatComposerRuntimeDraftMessageState,
  getChatComposerRuntimeImageDataUrlBytes,
  inferChatComposerRuntimeImageMimeType,
  computeChatMessageRuntimeTurnDurations,
  createChatMessageRuntimeRecoverableHistoryMessages,
  createChatMessageRuntimeResponseHistoryEvents,
  createChatMessageRuntimeSessionDisplayMessages,
  createChatMessageRuntimeTurnDurationMessages,
  getChatMessageRuntimeNextResponseEventOrdinal,
  createChatMessageActionSlotRenderMap,
  getChatMessageCopyFailureAlertState,
  getChatMessageCopyFeedbackResetDelayMs,
  getChatMessageToolExecutionCopyFailureResolvedAlertState,
  createChatConversationHomePromptEditorSaveActionState,
  createChatConversationHomePromptEditorModalMobilePropsParts,
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  createChatRuntimeDockChromeMobileProps,
  getChatConversationHomePromptDeleteConfirmAlertState,
  getChatConversationHomePromptDeleteFailedAlertState,
  getChatConversationHomePromptSaveFailedAlertState,
  getChatConversationHomePromptSaveSuccessAlertState,
  getChatConversationHomePromptTaskRunFailedAlertState,
  getChatConversationHomePromptTaskStartedAlertState,
  createChatRuntimeHomeQuickStartsMobilePropsParts,
  getChatRuntimeHomeQuickStartPressIntent,
  getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileIsAtBottom,
  getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier,
  getChatRuntimeMessageHistoryWindowMobileState,
  getChatRuntimeConversationItemThreadMobileStateFromBodyInput,
  getChatRuntimeConversationRuntimeThreadListMobileState,
  createChatRuntimeLoadingStateMobilePropsParts,
  createChatRuntimeInlineActivityMobilePropsParts,
  createChatRuntimeConnectionBannerMobilePropsParts,
  createChatRuntimeRetryStatusMobilePropsParts,
  createChatRuntimeToolApprovalMobilePropsParts,
  createChatRuntimeDelegationCardMobilePropsParts,
  createChatRuntimeTurnDurationBadgeMobilePropsParts,
  createChatRuntimeConversationContentMobilePropsParts,
  createChatRuntimeConversationExpandedContentMobilePropsParts,
  createChatRuntimeConversationCollapsedPreviewMobilePropsParts,
  createChatRuntimeMessageHistoryBannerMobilePropsParts,
  createChatRuntimeStepSummaryCardMobilePropsParts,
  createChatRuntimeScrollToBottomButtonMobilePropsParts,
  createChatRuntimeDebugPanelStackMobilePropsParts,
  createChatRuntimeConversationFrameMobilePropsParts,
  createChatRuntimeConversationActionComponentsMobileProps,
  createChatRuntimeConversationActionSetMobileProps,
  createChatRuntimeMessageActionIconButtonMobileProps,
  createChatRuntimeMessageActionIconButtonMobilePropsParts,
  createChatRuntimeMessageActionSlotListMobilePropsParts,
  createChatRuntimeMessageContentRowMobilePropsParts,
  createChatRuntimeMessageSurfaceMobilePropsParts,
  createChatRuntimeMessageStandaloneActionsMobilePropsParts,
  createChatRuntimeMessageThreadItemMobilePropsParts,
  createChatRuntimeMessageThreadSurfaceMobilePropsParts,
  createChatRuntimeConversationDockShellMobilePropsParts,
  createChatRuntimeConversationDockMobilePropsParts,
  createChatRuntimeConversationRuntimeThreadListMobilePropsParts,
  createChatRuntimeConversationRuntimeThreadMobilePropsParts,
  createChatRuntimeConversationScrollViewportMobilePropsParts,
  createChatRuntimeConversationViewportContentMobilePropsParts,
  createChatRuntimeConversationOverlaysMobilePropsParts,
  createChatRuntimeConversationSurfaceMobilePropsParts,
  createChatRuntimeConversationThreadBodyMobilePropsParts,
  createChatRuntimeConversationViewportMobilePropsParts,
  createChatRuntimeConversationThreadBodyMobilePropsFromActionInput,
  createChatRuntimeToolActivityGroupBoundaryMobilePropsParts,
  createChatRuntimeToolActivityGroupFooterMobilePropsParts,
  createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts,
  createChatRuntimeToolActivityGroupToggleMobilePropsParts,
  createChatRuntimeToolExecutionCallSectionMobilePropsParts,
  createChatRuntimeToolExecutionCallDetailMobilePropsParts,
  createChatRuntimeToolExecutionCallListMobilePropsParts,
  createChatRuntimeToolExecutionCollapseControlMobilePropsParts,
  createChatRuntimeToolExecutionCompactGroupMobilePropsParts,
  createChatRuntimeToolExecutionCompactListMobilePropsParts,
  createChatRuntimeToolExecutionCompactRowMobilePropsParts,
  createChatRuntimeToolExecutionCopyButtonMobilePropsParts,
  createChatRuntimeToolExecutionDetailHeaderMobilePropsParts,
  createChatRuntimeToolExecutionEmptyStateMobilePropsParts,
  createChatRuntimeToolExecutionErrorBlockMobilePropsParts,
  createChatRuntimeToolExecutionExpandedGroupMobilePropsParts,
  createChatRuntimeToolExecutionPanelMobilePropsParts,
  createChatRuntimeToolExecutionPanelShellMobilePropsParts,
  createChatRuntimeToolExecutionPayloadBlockMobilePropsParts,
  createChatRuntimeToolExecutionPayloadMetaMobilePropsParts,
  createChatRuntimeToolExecutionPayloadSectionMobilePropsParts,
  createChatRuntimeToolExecutionPendingResultMobilePropsParts,
  createChatRuntimeToolExecutionResultBadgeMobilePropsParts,
  createChatRuntimeToolExecutionResultHeaderMobilePropsParts,
  createChatRuntimeToolExecutionResultSectionMobilePropsParts,
  createChatRuntimeToolExecutionStackPanelMobilePropsParts,
  getChatRuntimeMessageThreadMobileStyleRenderState,
  createChatComposerRuntimeDockMobileChromeProps,
  createChatRuntimeSurfaceChromeMobileProps,
  createChatRuntimeViewportChromeMobileProps,
  getChatRuntimeBranchCreatedMobileResolvedAlertState,
  getChatRuntimeBranchFailedMobileResolvedAlertState,
  getChatRuntimeBranchUnavailableMobileResolvedAlertState,
  getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState,
  getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState,
  getChatRuntimeKillSwitchResultMobileResolvedAlertState,
  getChatRuntimeNavigationHeaderMobileRenderState,
  createChatRuntimeNavigationHeaderOptionsParts,
  createChatRuntimeNavigationHeaderOptionsMobilePropsParts,
  createChatRuntimeHeaderAgentSelectorMobilePropsParts,
  createChatRuntimeHeaderConversationStatusMobilePropsParts,
  createChatRuntimeHeaderIconButtonMobilePropsParts,
  createChatRuntimeHeaderTurnDurationMobilePropsParts,
  hasChatMessageRuntimeLiveAgentTurn,
  removeChatMessageRuntimePendingTurnMessages,
  removeChatMessageRuntimeToolApprovalMessage,
  sortChatMessageRuntimeResponseEvents,
  toggleChatMessageRuntimeMessageExpansionState,
  toggleChatMessageRuntimeToolActivityGroupExpansionState,
  toggleChatMessageRuntimeToolApprovalExpansionState,
  toggleChatMessageRuntimeToolCallExpansionState,
  getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState,
  getChatRuntimeToolApprovalFailedMobileResolvedAlertState,
  getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState,
  formatChatComposerRuntimeHandsFreeSleepingDebugMessage,
  getChatComposerRuntimeHandsFreeDebugMessage,
  mergeChatComposerRuntimeVoiceText,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
  formatConnectionStatus,
  CHAT_RUNTIME_AUTO_TTS_DUPLICATE_SUPPRESSION_MS,
  createChatRuntimeSpeechTextState,
  createChatRuntimeRemoteSpeechSettingsState,
  DEFAULT_EDGE_TTS_VOICE,
  getChatRuntimeDefaultRemoteSpeechSettingsState,
  type ACPDelegationProgress,
  type AgentConversationState,
  type AgentRetryInfo,
  type AgentStepSummary,
  type AgentUserResponseEvent,
  type HandsFreePhase,
  type Loop,
  type PredefinedPromptSummary,
  type RecoveryState,
  type Settings,
  type Skill,
  type VoiceDebugEntry,
  type VoiceDebugLog,
  type ChatRuntimeRemoteSpeechProvider,
  type ChatRuntimeRemoteSpeechSettingsState,
  type ChatConversationHomePromptDeleteConfirmAlertState,
  type ChatRuntimeConversationDelegationCardMobileState,
  type ChatRuntimeDelegationCardMobilePresentationState,
  type PromptLibraryEditorMobileRenderState,
  type PromptLibraryLauncherShortcutSource,
  type PromptLibrarySkillLike,
  type PromptLibraryMobileShortcutRenderState,
  type PromptLibraryShortcutItem,
  type PromptLibraryTaskLike,
  type ChatRuntimeAgentSelectorMobileRenderState,
  type ChatRuntimeActivityStepLike,
  type ChatRuntimeBackMobileRenderState,
  type ChatRuntimeBranchMobileRenderState,
  type ChatRuntimeConnectionBannerMobileRenderState,
  type ChatRuntimeDockChromeMobileRenderStateInput,
  type ChatRuntimeHandsFreeMobileRenderState,
  type ChatRuntimeKillSwitchConfirmationAlertState,
  type ChatRuntimeKillSwitchMobileRenderState,
  type ChatRuntimeKillSwitchResultLike,
  type ChatRuntimeMessageHistoryBannerMobileRenderState,
  type ChatComposerRuntimeDockMobileRenderStateInput,
  type ChatComposerRuntimeDockMobilePropsInput,
  type ChatComposerRuntimeHandsFreeControlsMobileRenderState,
  type ChatRuntimePinMobileRenderState,
  type ChatRuntimeScrollToBottomMobileRenderState,
  type ChatRuntimeSurfaceChromeMobileRenderStateInput,
  type ChatRuntimeStepSummaryMobileRenderState,
  type ChatRuntimeToolApprovalMobileRenderState,
  type ChatRuntimeTurnDurationHeaderMobileRenderState,
  type ChatRuntimeDebugPanelsMobileRenderState,
  type ChatRuntimeInlineActivityMobileRenderState,
  type ChatRuntimeLoadingStateMobileRenderState,
  getChatImageAttachmentMobileAlertState,
  type ChatImageAttachmentMobileAlertInput,
  type ChatImageAttachmentMessageInput,
  type ChatImageAttachmentMobileRenderState,
  type ImageMimeTypeSource,
  type ChatRuntimeHomeQuickStartItemsMobileStateInput,
  type ChatRuntimeHomeQuickStartsMobileRenderState,
  type ChatRuntimeMessageHistoryWindowMobileDisplayStateInput,
  type ChatRuntimeNavigationHeaderMobileRenderState,
  type ChatRuntimeNavigationHeaderMobileRenderStateInput,
  type ChatRuntimeViewportChromeMobileRenderStateInput,
  type ChatSessionStatusMobileRenderState,
  type ChatRuntimeConversationMessageActionsMobileRenderState,
  type ChatRuntimeConversationMessageActionsMobileRenderStateInput,
  type ChatRuntimeConversationContentMobileDisplayMode,
  type ChatRuntimeConversationDelegationExpansionState,
  type ChatDisplayMessageLike,
  type ChatMessageDisplayStateMessageLike,
  type ChatRuntimeConversationMessageRenderContextMobileState,
  type ChatRuntimeConversationMessageRenderContextMobileStateInput,
  type ChatRuntimeConversationMessageMobileRenderStateInput,
  type ChatRuntimeConversationMessageMobileRenderState,
  type ChatRuntimeConversationRetryStatusMobileState,
  type ChatRuntimeConversationMessageRuntimeThreadStateInput,
  type ChatRuntimeConversationRenderableRuntimeThreadState,
  type ChatRuntimeConversationThreadBodyMobileDisplayMode,
  type ChatRuntimeConversationThreadBodyMobileStateInput,
  type ChatRuntimeConversationSurfaceToneMobileStyleSlot,
  type ChatRuntimeConversationToolApprovalMobileState,
  type ChatRuntimeConversationToolExecutionDetailMobileRowState,
  type ChatRuntimeConversationToolExecutionStackMobileState,
  type ChatRuntimeConversationToolActivityGroupThreadRenderStateInput,
  type ChatRuntimeToolActivityGroupBoundaryMobileKind,
  type ChatRuntimeToolActivityGroupHeaderMobileKind,
  type ChatRuntimeMessageThreadPresentationMobileRenderState,
  type ChatRuntimeRetryStatusMobileRenderState,
  type ChatRuntimeStreamingContentMobileRenderStateInput,
  type ChatRuntimeStreamingContentMobileRenderState,
  type ChatMessageRuntimeAssistantTextMessage,
  type ChatMessageRuntimeHistoryMessageLike,
  type ChatMessageRuntimeLogMeta,
  type ChatMessageRuntimeMessageExpansionState,
  type ChatMessageRuntimeResponseHistorySourceMessage,
  type ChatMessageRuntimeSessionMessageLike,
  type ChatMessageCollapsedPreviewMobileActionState,
  type ChatMessageExpansionMobileRenderState,
  type ChatMessageActionSlotRenderEntry,
  type ChatMessageActionSlotRenderMap,
  type ChatMessageRuntimeSessionDisplayMessagesOptions,
  type ChatMessageRuntimeToolActivityGroup,
  type ChatMessageRuntimeToolActivityGroups,
  type ChatMessageRuntimeToolActivityGroupExpansionState,
  type ChatMessageRuntimeToolApprovalExpansionState,
  type ChatMessageRuntimeToolApprovalStateMessageLike,
  type ChatMessageRuntimeToolCallExpansionState,
  type ChatMessageRuntimeTurnDurationStateInput,
  type ToolActivityGroupMobileRenderState,
  type ToolExecutionCompactMobileRenderState,
  type ToolExecutionDetailMobileCollapseControlRenderState,
  type ToolExecutionDetailMobileCopyButtonRenderState,
  type ToolExecutionDetailMobileEmptyStateRenderState,
  type ToolExecutionDetailMobileExpandControlRenderState,
  type ToolExecutionDetailMobileHeaderRenderState,
  type ToolExecutionDetailMobilePendingResultRenderState,
  type ToolExecutionDetailMobileSectionHeaderRenderState,
} from '@dotagents/shared/session-presentation';
import { AgentSelectorSheet } from './AgentSelectorSheet';
import { HandsFreeStatusChip } from './HandsFreeStatusChip';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageQueuePanel } from './MessageQueuePanel';
import { ResponseHistoryPanel } from './ResponseHistoryPanel';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ChatComposerTextEntryRef = TextInput;
export type ChatComposerTextEntryKeyPressEvent = Parameters<NonNullable<ComponentProps<typeof TextInput>['onKeyPress']>>[0];
export type ChatComposerRuntimeImageAttachment = ChatImageAttachmentMessageInput & {
  id: string;
  previewUri: string;
};
export type ChatMessageScrollViewportRef = ScrollView;
export type ChatMessageScrollEvent = Parameters<NonNullable<ComponentProps<typeof ScrollView>['onScroll']>>[0];

type ChatMessageRuntimeRemoteSpeechSettingsHookState = {
  remoteTtsProvider: ChatRuntimeRemoteSpeechProvider;
  setRemoteTtsProvider: Dispatch<SetStateAction<ChatRuntimeRemoteSpeechProvider>>;
  remoteTtsVoice: string | undefined;
  setRemoteTtsVoice: Dispatch<SetStateAction<string | undefined>>;
  remoteTtsModel: string | undefined;
  setRemoteTtsModel: Dispatch<SetStateAction<string | undefined>>;
  remoteTtsRate: number;
  setRemoteTtsRate: Dispatch<SetStateAction<number>>;
  applyRemoteSpeechSettings: (settings: ChatRuntimeRemoteSpeechSettingsState) => void;
};

type ChatConversationHomePromptEditorSaveClient = {
  updateSettings: (settings: { predefinedPrompts: PredefinedPromptSummary[] }) => Promise<unknown>;
};

type ChatConversationHomePromptEditorSaveActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = {
  promptClient?: TPromptEditorClient | null;
  predefinedPrompts: PredefinedPromptSummary[];
  editingPrompt?: PredefinedPromptSummary | null;
  promptName: string;
  promptContent: string;
  isSavingPrompt: boolean;
  setPredefinedPrompts: Dispatch<SetStateAction<PredefinedPromptSummary[]>>;
  beginPromptEditorSave: () => void;
  clearPromptEditorSave: () => void;
  dismissPromptEditor: () => void;
  showAlert: (title: string, message: string) => void;
};

type ChatConversationHomePromptEditorSaveChromeActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = Omit<
  ChatConversationHomePromptEditorSaveActionsStateInput<TPromptEditorClient>,
  'showAlert'
>;

type ChatConversationHomePromptEditorSaveActionsState = {
  handleSavePrompt: () => Promise<void>;
};

type ChatConversationHomePromptEditorDeleteNativeConfirmInput = Pick<
  ChatConversationHomePromptDeleteConfirmAlertState,
  'title' | 'message' | 'cancelLabel' | 'deleteLabel'
> & {
  onConfirm: () => void;
};

type ChatConversationHomePromptEditorDeleteActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = {
  promptClient?: TPromptEditorClient | null;
  predefinedPrompts: PredefinedPromptSummary[];
  setPredefinedPrompts: Dispatch<SetStateAction<PredefinedPromptSummary[]>>;
  beginPromptEditorSave: () => void;
  clearPromptEditorSave: () => void;
  platform: string;
  confirmWeb: (message: string) => boolean;
  confirmNative: (input: ChatConversationHomePromptEditorDeleteNativeConfirmInput) => void;
  showAlert: (title: string, message: string) => void;
};

type ChatConversationHomePromptEditorDeleteChromeActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = Omit<
  ChatConversationHomePromptEditorDeleteActionsStateInput<TPromptEditorClient>,
  'confirmWeb' | 'confirmNative' | 'showAlert'
>;

type ChatConversationHomePromptEditorDeleteActionsState = {
  handleDeletePrompt: (prompt: PredefinedPromptSummary) => void;
};

type ChatRuntimeNativeConfirmAlertButton = {
  text: string;
  style: 'cancel' | 'destructive';
  onPress?: () => void;
};

type ChatRuntimeNativeConfirmAlertPresenter = (
  title: string,
  message: string,
  buttons: ChatRuntimeNativeConfirmAlertButton[],
) => void;

type ChatConversationHomePromptTaskRunState = {
  runningPromptTaskId: string | null;
  canRunPromptTask: boolean;
  beginPromptTaskRun: (taskId: string) => void;
  clearPromptTaskRun: () => void;
};

type ChatConversationHomePromptTaskRunClient = {
  runLoop: (taskId: string) => Promise<unknown>;
};

type ChatConversationHomePromptTaskRunActionsStateInput<
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
> = {
  taskClient?: TTaskRunClient | null;
  canRunPromptTask: boolean;
  beginPromptTaskRun: (taskId: string) => void;
  clearPromptTaskRun: () => void;
  showAlert: (title: string, message: string) => void;
};

type ChatConversationHomePromptTaskRunChromeActionsStateInput<
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
> = Omit<
  ChatConversationHomePromptTaskRunActionsStateInput<TTaskRunClient>,
  'showAlert'
>;

type ChatConversationHomePromptTaskRunActionsState<
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = {
  handleRunPromptTask: (task: TTask) => Promise<void>;
};

type ChatConversationHomeQuickStartCatalogState = {
  predefinedPrompts: PredefinedPromptSummary[];
  setPredefinedPrompts: Dispatch<SetStateAction<PredefinedPromptSummary[]>>;
  availableSkills: Skill[];
  setAvailableSkills: Dispatch<SetStateAction<Skill[]>>;
  availableTasks: Loop[];
  setAvailableTasks: Dispatch<SetStateAction<Loop[]>>;
  isLoadingQuickStartPrompts: boolean;
  beginQuickStartCatalogLoad: () => void;
  finishQuickStartCatalogLoad: () => void;
  clearQuickStartCatalog: () => void;
};

type ChatConversationHomeQuickStartCatalogClient = {
  getSettings: () => Promise<Settings>;
  getSkills: () => Promise<{ skills: Skill[] }>;
  getLoops: () => Promise<{ loops: Loop[] }>;
};

type ChatConversationHomeQuickStartCatalogLoadStateInput<
  TQuickStartCatalogClient extends ChatConversationHomeQuickStartCatalogClient,
> = {
  quickStartClient?: TQuickStartCatalogClient | null;
  isFocused: boolean;
  catalog: ChatConversationHomeQuickStartCatalogState;
  applyRemoteSpeechSettings: (settings: ChatRuntimeRemoteSpeechSettingsState) => void;
};

type ChatConversationHomePromptEditorState = {
  promptEditorVisible: boolean;
  promptEditorEditingPrompt: PredefinedPromptSummary | null;
  promptEditorIsEditing: boolean;
  promptEditorNameValue: string;
  setPromptEditorNameValue: Dispatch<SetStateAction<string>>;
  promptEditorContentValue: string;
  setPromptEditorContentValue: Dispatch<SetStateAction<string>>;
  promptEditorIsSaving: boolean;
  openAddPromptEditor: () => void;
  openEditPromptEditor: (prompt: PredefinedPromptSummary) => void;
  closePromptEditor: () => void;
  dismissPromptEditor: () => void;
  beginPromptEditorSave: () => void;
  clearPromptEditorSave: () => void;
};

type ChatRuntimeAgentSelectorOverlayState = {
  agentSelectorVisible: boolean;
  openAgentSelector: () => void;
  closeAgentSelector: () => void;
};

type ChatComposerRuntimeDraftState = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  pendingImages: ChatComposerRuntimeImageAttachment[];
  setPendingImages: Dispatch<SetStateAction<ChatComposerRuntimeImageAttachment[]>>;
  inputRef: RefObject<ChatComposerTextEntryRef | null>;
  clearComposerInput: () => void;
  clearPendingImages: () => void;
  clearComposerDraft: () => void;
  focusComposerInput: () => void;
  mergeVoiceTextIntoComposer: (text: string) => void;
  removePendingImage: (attachmentId: string) => void;
};

type ChatComposerRuntimeImagePickerAsset = ImageMimeTypeSource & {
  uri: string;
  base64?: string | null;
  fileSize?: number | null;
};

type ChatComposerRuntimeImagePickerResult = {
  canceled: boolean;
  assets?: ChatComposerRuntimeImagePickerAsset[] | null;
};

type ChatComposerRuntimeImageAttachmentPickerStateInput = {
  pendingImages: ChatComposerRuntimeImageAttachment[];
  setPendingImages: Dispatch<SetStateAction<ChatComposerRuntimeImageAttachment[]>>;
  pickImages: (selectionLimit: number) => Promise<ChatComposerRuntimeImagePickerResult>;
  showAlert: (title: string, message: string) => void;
  now?: () => number;
};

type ChatComposerRuntimeImageLibraryPickerStateInput = Omit<
  ChatComposerRuntimeImageAttachmentPickerStateInput,
  'pickImages' | 'showAlert'
>;

type ChatComposerRuntimeImageAttachmentPickerState = {
  handlePickImages: () => Promise<void>;
};

type ChatComposerTextEntryModifierKeys = {
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
};

type ChatComposerTextEntryWebKeyPressEvent = {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault?: () => void;
};

type ChatComposerRuntimeTextEntrySubmissionStateInput = {
  hasContent: boolean;
  platform: ChatComposerRuntimeDockChromeInput['platform'];
  onChangeText: NonNullable<ChatComposerTextEntryProps['onChangeText']>;
  onSubmit: () => void;
};

type ChatComposerRuntimeTextEntrySubmissionState = {
  onChangeText: NonNullable<ChatComposerTextEntryProps['onChangeText']>;
  onKeyPress: NonNullable<ChatComposerTextEntryProps['onKeyPress']>;
};

type ChatComposerRuntimeSendActionOptions = {
  fromComposer?: boolean;
};

type ChatComposerRuntimeSendAction = (
  text: string,
  options?: ChatComposerRuntimeSendActionOptions,
) => void | Promise<void>;

type ChatComposerRuntimeQueueController = {
  enqueue: (conversationId: string, text: string, sourceConversationId?: string) => void;
};

type ChatComposerRuntimeSubmissionActionsStateInput = {
  input: string;
  pendingImages: readonly ChatComposerRuntimeImageAttachment[];
  currentConversationId: string;
  queue: ChatComposerRuntimeQueueController;
  send: ChatComposerRuntimeSendAction;
  clearComposerDraft: () => void;
  setDebugInfo: (message: string) => void;
};

type ChatComposerRuntimeSubmissionActionsState = {
  composerHasContent: boolean;
  sendComposerInput: () => void;
  queueComposerInput: () => void;
};

type ChatComposerRuntimeSubmissionChromeStateInput =
  & ChatComposerRuntimeSubmissionActionsStateInput
  & {
    platform: ChatComposerRuntimeTextEntrySubmissionStateInput['platform'];
    onTextEntryChangeText: ChatComposerRuntimeTextEntrySubmissionStateInput['onChangeText'];
  };

type ChatComposerRuntimeSubmissionChromeState =
  & ChatComposerRuntimeSubmissionActionsState
  & {
    textEntrySubmissionState: ChatComposerRuntimeTextEntrySubmissionState;
  };

type ChatComposerRuntimeHandsFreeController = {
  state: {
    phase: HandsFreePhase;
  };
  wakeByUser: () => void;
  sleepByUser: () => void;
  resumeByUser: () => void;
  pauseByUser: () => void;
};

type ChatComposerRuntimeHandsFreeControlActionsStateInput = {
  handsFreeController: ChatComposerRuntimeHandsFreeController;
  listening: boolean;
  wakePhrase: string;
  startRecording: () => void | Promise<void>;
  stopRecognitionOnly: () => void | Promise<void>;
  stopSpeech: () => void;
  setDebugInfo: (message: string) => void;
};

type ChatComposerRuntimeHandsFreeControlChromeActionsStateInput = Omit<
  ChatComposerRuntimeHandsFreeControlActionsStateInput,
  'stopSpeech'
>;

type ChatComposerRuntimeHandsFreeControlActionsState = {
  wakeHandsFreeByUser: () => void;
  sleepHandsFreeByUser: () => void;
  resumeHandsFreeByUser: () => void;
  pauseHandsFreeByUser: () => void;
  handleHandsFreePrimaryControl: () => void;
};

type ChatComposerRuntimeHandsFreeRecognizerLifecycleController = {
  state: {
    phase: HandsFreePhase;
  };
  shouldKeepRecognizerActive: boolean;
  resetError: () => void;
};

type ChatComposerRuntimeHandsFreeRecognizerLifecycleStateInput = {
  handsFree: boolean;
  handsFreeRuntimeActive: boolean;
  listening: boolean;
  handsFreeController: ChatComposerRuntimeHandsFreeRecognizerLifecycleController;
  startRecording: () => void | Promise<void>;
  stopRecognitionOnly: () => void | Promise<void>;
  setHandsFreePhaseRefValue: (phase: HandsFreePhase) => void;
  errorResetDelayMs?: number;
};

type ChatComposerRuntimeVoiceDebugResetStateInput = {
  isVoiceDebugEnabled: boolean;
  clearVoiceDebug: () => void;
};

type ChatRuntimeMutableRef<T> = {
  current: T;
};

type ChatMessageRuntimeMessageState<TMessage> = {
  messages: TMessage[];
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  messagesRef: ChatRuntimeMutableRef<TMessage[]>;
  progressMessagesRef: ChatRuntimeMutableRef<TMessage[]>;
};

type ChatMessageRuntimeSendCallback = (text: string) => Promise<void>;

type ChatMessageRuntimeSendRefState = {
  sendRef: ChatRuntimeMutableRef<ChatMessageRuntimeSendCallback>;
  syncSendRef: (send: ChatMessageRuntimeSendCallback) => void;
};

type ChatMessageRuntimeInitialMessageStateInput = {
  routeInitialMessage: unknown;
  currentSessionId?: string | null;
  initialMessageRef: ChatRuntimeMutableRef<string | null>;
  initialMessageSentRef: ChatRuntimeMutableRef<boolean>;
  sendRef: ChatRuntimeMutableRef<ChatMessageRuntimeSendCallback>;
  clearRouteInitialMessage?: () => void;
  voiceLog: VoiceDebugLog;
  autoSendDelayMs?: number;
};

type ChatMessageRuntimeSessionPersistStateInput<TMessage> = {
  messages: TMessage[];
  currentSessionId?: string | null;
  deletingSessionIds: ReadonlySet<string>;
  prevSessionIdRef: ChatRuntimeMutableRef<string | null>;
  prevMessagesLengthRef: ChatRuntimeMutableRef<number>;
  skipNextPersistRef: ChatRuntimeMutableRef<boolean>;
  persistMessages: (messages: TMessage[]) => unknown;
};

type ChatMessageRuntimeSessionLoadMessage =
  ChatMessageRuntimeSessionMessageLike<{ name: string; arguments: unknown }, unknown> &
  ChatMessageRuntimeResponseHistorySourceMessage;

type ChatMessageRuntimeSessionLoadSession<TMessage extends ChatMessageRuntimeSessionLoadMessage> = {
  id: string;
  messages: readonly TMessage[];
  serverConversationId?: string | null;
};

type ChatMessageRuntimeSessionLoadResult<TMessage extends ChatMessageRuntimeSessionLoadMessage> = {
  messages: readonly TMessage[];
};

type ChatMessageRuntimeSessionLoadStateInput<
  TMessage extends ChatMessageRuntimeSessionLoadMessage,
  TClient,
> = {
  currentSessionId?: string | null;
  currentSessionIdRef: ChatRuntimeMutableRef<string | null>;
  deletingSessionIdsSize: number;
  hasServerAuth: boolean;
  settingsClient?: TClient | null;
  createLazyLoadClient: () => TClient;
  getCurrentSession: () => ChatMessageRuntimeSessionLoadSession<TMessage> | null;
  createNewSession: () => ChatMessageRuntimeSessionLoadSession<TMessage>;
  loadSessionMessages: (
    sessionId: string,
    client: TClient,
  ) => Promise<ChatMessageRuntimeSessionLoadResult<TMessage> | null>;
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  setLatestStepSummary: Dispatch<SetStateAction<AgentStepSummary | null>>;
  lastLoadedSessionIdRef: ChatRuntimeMutableRef<string | null>;
  pendingLazyLoadSessionIdRef: ChatRuntimeMutableRef<string | null>;
  skipNextPersistRef: ChatRuntimeMutableRef<boolean>;
  resetThreadExpansionState: () => void;
  clearCopiedMessageFeedback: () => void;
  replaceResponseHistory: (events: AgentUserResponseEvent[]) => void;
  resetResponseSpeechPlaybackState: (playedEventIds?: Iterable<string>) => void;
  warn?: (message?: unknown, ...optionalParams: unknown[]) => void;
};

type ChatMessageRuntimeSessionRefStateInput = {
  initialMessage: string | null;
};

type ChatMessageRuntimeSessionRefState = {
  lastLoadedSessionIdRef: ChatRuntimeMutableRef<string | null>;
  pendingLazyLoadSessionIdRef: ChatRuntimeMutableRef<string | null>;
  skipNextPersistRef: ChatRuntimeMutableRef<boolean>;
  initialMessageRef: ChatRuntimeMutableRef<string | null>;
  initialMessageSentRef: ChatRuntimeMutableRef<boolean>;
  prevMessagesLengthRef: ChatRuntimeMutableRef<number>;
  prevSessionIdRef: ChatRuntimeMutableRef<string | null>;
  convoRef: ChatRuntimeMutableRef<string | undefined>;
};

type ChatMessageRuntimeResponseHistoryState = {
  respondToUserHistory: AgentUserResponseEvent[];
  playedResponseEventIdsRef: ChatRuntimeMutableRef<Set<string>>;
  queuedResponseEventsRef: ChatRuntimeMutableRef<AgentUserResponseEvent[]>;
  activeAutoSpeechEventIdRef: ChatRuntimeMutableRef<string | null>;
  recentAutoSpeechByTextRef: ChatRuntimeMutableRef<Map<string, number>>;
  replaceResponseHistory: (events: AgentUserResponseEvent[]) => void;
  createFallbackResponseEvent: (
    sessionId: string | null | undefined,
    runId: number | undefined,
    text: string,
  ) => AgentUserResponseEvent;
  mergeResponseEvents: (incomingEvents: AgentUserResponseEvent[]) => void;
  clearQueuedResponseSpeech: () => void;
  resetResponseSpeechPlaybackState: (playedEventIds?: Iterable<string>) => void;
};

type ChatMessageRuntimeResponseSpeechSpeaker = (
  content: string,
  reason: string,
  onSettled?: () => void,
) => boolean;

type ChatMessageRuntimeResponseSpeechQueueActionsStateInput = {
  isTextToSpeechEnabled: boolean;
  ttsEnabledRef: ChatRuntimeMutableRef<boolean>;
  playedResponseEventIdsRef: ChatRuntimeMutableRef<Set<string>>;
  queuedResponseEventsRef: ChatRuntimeMutableRef<AgentUserResponseEvent[]>;
  activeAutoSpeechEventIdRef: ChatRuntimeMutableRef<string | null>;
  speakAssistantResponse: ChatMessageRuntimeResponseSpeechSpeaker;
};

type ChatMessageRuntimeResponseSpeechQueueActionsState = {
  enqueueResponseEventsForSpeech: (events: AgentUserResponseEvent[]) => void;
  processResponseSpeechQueue: () => void;
};

type ChatMessageRuntimeAssistantSpeechActionsStateInput = {
  ttsEnabledRef: ChatRuntimeMutableRef<boolean>;
  recentAutoSpeechByTextRef: ChatRuntimeMutableRef<Map<string, number>>;
  config: ChatMessageRuntimeSpeechActionConfig;
  effectiveTtsProvider: string;
  effectiveRemoteTtsVoice?: string | null;
  effectiveRemoteTtsModel?: string | null;
  effectiveRemoteTtsRate?: number | null;
  handsFree: boolean;
  handsFreeController: ChatMessageRuntimeSpeechActionsController;
  speakNative: (text: string, options: ChatMessageRuntimeNativeSpeechOptions) => void;
  speakRemote: (text: string, options: ChatMessageRuntimeRemoteSpeechOptions) => unknown | Promise<unknown>;
  voiceLog: VoiceDebugLog;
  duplicateSuppressionMs?: number;
};

type ChatMessageRuntimeAssistantSpeechChromeActionsStateInput = Omit<
  ChatMessageRuntimeAssistantSpeechActionsStateInput,
  'speakNative' | 'speakRemote'
>;

type ChatMessageRuntimeAssistantSpeechActionsState = {
  speakAssistantResponse: ChatMessageRuntimeResponseSpeechSpeaker;
};

type ChatMessageRuntimeSpeechPlaybackState = {
  speakingMessageIndex: number | null;
  setSpeakingMessageIndex: Dispatch<SetStateAction<number | null>>;
  intendedSpeakingIndexRef: ChatRuntimeMutableRef<number | null>;
  setIntendedSpeakingMessage: (messageIndex: number) => void;
  startSpeakingMessage: (messageIndex: number) => void;
  clearSpeakingMessage: () => void;
  clearIntendedSpeakingMessage: () => void;
};

type ChatMessageRuntimeSpeechActionConfig = {
  baseUrl?: string | null;
  apiKey?: string | null;
  ttsRate?: number | null;
  ttsPitch?: number | null;
  ttsVoiceId?: string | null;
};

type ChatMessageRuntimeSpeechActionsController = {
  onSpeechStarted: () => void;
  onSpeechFinished: () => void;
};

type ChatMessageRuntimeNativeSpeechOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

type ChatMessageRuntimeRemoteSpeechOptions = {
  baseUrl: string;
  apiKey: string;
  providerId?: string;
  voice?: string;
  model?: string;
  rate?: number;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

type ChatMessageRuntimeSpeechActionsStateInput = {
  speakingMessageIndex: number | null;
  config: ChatMessageRuntimeSpeechActionConfig;
  effectiveTtsProvider: string;
  effectiveRemoteTtsVoice?: string | null;
  effectiveRemoteTtsModel?: string | null;
  effectiveRemoteTtsRate?: number | null;
  handsFree: boolean;
  handsFreeController: ChatMessageRuntimeSpeechActionsController;
  intendedSpeakingIndexRef: ChatRuntimeMutableRef<number | null>;
  setIntendedSpeakingMessage: (messageIndex: number) => void;
  startSpeakingMessage: (messageIndex: number) => void;
  clearSpeakingMessage: () => void;
  clearIntendedSpeakingMessage: () => void;
  speakNative: (text: string, options: ChatMessageRuntimeNativeSpeechOptions) => void;
  stopNativeSpeech: () => void;
  speakRemote: (text: string, options: ChatMessageRuntimeRemoteSpeechOptions) => unknown | Promise<unknown>;
  stopRemoteSpeech: () => void;
  voiceLog: VoiceDebugLog;
};

type ChatMessageRuntimeSpeechChromeActionsStateInput = Omit<
  ChatMessageRuntimeSpeechActionsStateInput,
  'speakNative' | 'stopNativeSpeech' | 'speakRemote' | 'stopRemoteSpeech'
>;

type ChatMessageRuntimeSpeechActionsState = {
  speakMessage: (messageIndex: number, content: string) => void;
};

type ChatMessageRuntimeSpeechCleanupStateInput = {
  stopNativeSpeech: () => void;
  stopRemoteSpeech: () => void;
};

type ChatMessageRuntimeSpeechChromeCleanupStateInput = Omit<
  ChatMessageRuntimeSpeechCleanupStateInput,
  'stopNativeSpeech' | 'stopRemoteSpeech'
>;

type ChatComposerRuntimeEditBeforeSendState = {
  editBeforeSendEnabled: boolean;
  toggleEditBeforeSend: () => void;
};

type ChatRuntimeStatusState = {
  responding: boolean;
  setResponding: Dispatch<SetStateAction<boolean>>;
  conversationState: AgentConversationState | null;
  setConversationState: Dispatch<SetStateAction<AgentConversationState | null>>;
  latestStepSummary: AgentStepSummary | null;
  setLatestStepSummary: Dispatch<SetStateAction<AgentStepSummary | null>>;
  connectionState: RecoveryState | null;
  setConnectionState: Dispatch<SetStateAction<RecoveryState | null>>;
};

type ChatRuntimeRequestDebugState = {
  requestDebugText: string;
  setRequestDebugText: Dispatch<SetStateAction<string>>;
  clearRequestDebugText: () => void;
};

type ChatRuntimeRequestTrackingStateInput = {
  currentSessionId: string | null;
};

type ChatRuntimeRequestTrackingState = {
  activeRequestIdRef: ChatRuntimeMutableRef<number>;
  currentSessionIdRef: ChatRuntimeMutableRef<string | null>;
};

type ChatRuntimeConnectionStatusManager = {
  getConnectionState: (sessionId: string) => RecoveryState | null | undefined;
  isConnectionActive: (sessionId: string) => boolean;
  getOrCreateConnection: (sessionId: string) => unknown;
  subscribeToConnectionStatus: (
    sessionId: string,
    onStatusChange: (state: RecoveryState) => void,
  ) => (() => void);
};

type ChatRuntimeConnectionStatusSubscriptionInput = {
  currentSessionId: string | null;
  connectionManager: ChatRuntimeConnectionStatusManager;
  currentSessionIdRef: ChatRuntimeMutableRef<string | null>;
  setConnectionState: Dispatch<SetStateAction<RecoveryState | null>>;
  setResponding: Dispatch<SetStateAction<boolean>>;
  setConversationState: Dispatch<SetStateAction<AgentConversationState | null>>;
  setLatestStepSummary: Dispatch<SetStateAction<AgentStepSummary | null>>;
  logConnectionStatus?: (statusMessage: string) => void;
};

type ChatRuntimeForegroundStateInput = {
  handsFree: boolean;
  isFocused: boolean;
};

type ChatRuntimeForegroundState = {
  appState: AppStateStatus;
  isAppActive: boolean;
  handsFreeRuntimeActive: boolean;
};

type ChatRuntimeHandsFreeMutableStateInput = {
  handsFree: boolean;
  ttsEnabled: boolean;
};

type ChatRuntimeHandsFreeMutableState = {
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  ttsEnabledRef: ChatRuntimeMutableRef<boolean>;
  setHandsFreeRefValue: (value: boolean) => void;
  setHandsFreePhaseRefValue: (phase: HandsFreePhase) => void;
};

type ChatRuntimeHandsFreeToggleController = {
  reset: () => void;
};

type ChatRuntimeTextToSpeechToggleController = {
  onSpeechFinished: () => void;
};

type ChatRuntimeHandsFreeToggleActionsStateInput<TConfig extends object> = {
  config: TConfig;
  setConfig: (config: TConfig) => void;
  saveConfig: (config: TConfig) => unknown | Promise<unknown>;
  handsFreeController: ChatRuntimeHandsFreeToggleController;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  setHandsFreeRefValue: (value: boolean) => void;
  stopRecognitionOnly: () => void | Promise<void>;
  stopSpeech: () => void;
  stopRemoteSpeech: () => void;
  setDebugInfo: (message: string) => void;
};

type ChatRuntimeHandsFreeToggleChromeActionsStateInput<TConfig extends object> = Omit<
  ChatRuntimeHandsFreeToggleActionsStateInput<TConfig>,
  'stopSpeech' | 'stopRemoteSpeech'
>;

type ChatRuntimeHandsFreeToggleActionsState = {
  toggleHandsFree: () => Promise<void>;
};

type ChatRuntimeTextToSpeechToggleActionsStateInput<TConfig extends object> = {
  ttsEnabled: boolean;
  config: TConfig;
  setConfig: (config: TConfig) => void;
  saveConfig: (config: TConfig) => unknown | Promise<unknown>;
  handsFreeController: ChatRuntimeTextToSpeechToggleController;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  clearIntendedSpeakingMessage: () => void;
  clearQueuedResponseSpeech: () => void;
  clearSpeakingMessage: () => void;
  stopSpeech: () => void;
  stopRemoteSpeech: () => void;
  voiceLog: VoiceDebugLog;
};

type ChatRuntimeTextToSpeechToggleChromeActionsStateInput<TConfig extends object> = Omit<
  ChatRuntimeTextToSpeechToggleActionsStateInput<TConfig>,
  'stopSpeech' | 'stopRemoteSpeech'
>;

type ChatRuntimeTextToSpeechToggleActionsState = {
  toggleTextToSpeech: () => Promise<void>;
};

type ChatRuntimeConnectionRetryState = {
  lastFailedMessage: string | null;
  setLastFailedMessage: Dispatch<SetStateAction<string | null>>;
  clearLastFailedMessage: () => void;
};

type ChatRuntimeConnectionRetryClient<TToolCall = unknown, TToolResult = unknown> = {
  getRecoveryConversationId: () => string | null | undefined;
  getConversation: (
    conversationId: string,
  ) => Promise<{
    messages: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[];
  } | null | undefined>;
};

type ChatRuntimeConnectionRetrySessionStore<TMessage> = {
  setServerConversationId: (conversationId: string) => void | Promise<void>;
  setMessages: (messages: TMessage[]) => void | Promise<void>;
};

type ChatRuntimeConnectionRetryActionStateInput<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
> = {
  lastFailedMessage: string | null;
  clearLastFailedMessage: () => void;
  getSessionClient: () => ChatRuntimeConnectionRetryClient<TToolCall, TToolResult> | null;
  sessionStore: ChatRuntimeConnectionRetrySessionStore<TMessage>;
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  send: (text: string) => void | Promise<void>;
  retryDelayMs?: number;
};

type ChatRuntimeConnectionRetryActionState = {
  handleRetryLastFailedMessage: () => Promise<void>;
  handleRetryLastFailedMessagePress: () => void;
};

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

type ChatMessageActionIconButtonParts = ReturnType<typeof createChatRuntimeMessageActionIconButtonMobilePropsParts<
  ChatMessageActionIcon,
  ChatMessageActionIconButtonProps['onPress'],
  ChatMessageActionIconButtonProps['accessibilityRole'],
  ChatMessageActionIconButtonProps['accessibilityState'],
  ChatMessageActionIconButtonProps['ariaExpanded'],
  ChatMessageActionIconButtonProps['hitSlop'],
  ChatMessageActionIconButtonProps['style'],
  ChatMessageActionIconButtonProps['activeStyle'],
  ChatMessageActionIconButtonProps['pressedStyle'],
  ChatMessageActionIconButtonProps['disabledStyle']
>>;

type ChatMessageActionIconButtonPressableProps =
  ChatMessageActionIconButtonParts['pressable']['props'] & {
    children: ReactNode;
  };

type ChatMessageActionIconButtonActivityIndicatorProps =
  ChatMessageActionIconButtonParts['activityIndicator']['props'];

type ChatMessageActionIconButtonIconProps =
  ChatMessageActionIconButtonParts['icon']['props'];

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
  renderState: ChatRuntimeConversationMessageActionsMobileRenderState['speech'];
};

type ChatMessageBranchActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatRuntimeBranchMobileRenderState;
};

type ChatMessageCopyActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatRuntimeConversationMessageActionsMobileRenderState['copy'];
};

type ChatMessageBranchActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['branch'];

type ChatMessageSpeechActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['speech'];

type ChatMessageCopyActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['copy'];

type ChatMessageExpansionActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageExpansionMobileRenderState;
};

type ChatMessageExpansionActionSpecInput = Omit<ChatMessageExpansionActionSpec, 'renderState'>;

type ChatMessageTurnDurationActionSpec = ChatMessageTurnDurationBadgeProps;

type ChatMessageTurnDurationActionSpecInput =
  Omit<ChatMessageTurnDurationActionSpec, 'renderState'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['turnDuration'];

type ChatMessageActionComponentsInput = {
  availability: ChatRuntimeConversationMessageActionsMobileRenderState['availability'];
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
  renderState: ChatRuntimeConversationMessageActionsMobileRenderState;
  turnDuration: ChatMessageTurnDurationActionSpecInput;
  speech: ChatMessageSpeechActionSpecInput;
  branch: ChatMessageBranchActionSpecInput;
  copy: ChatMessageCopyActionSpecInput;
  expansion: ChatMessageExpansionActionSpecInput;
};

type ChatMessageRuntimeClipboardActionsStateInput = {
  copyText: (content: string) => Promise<unknown>;
  showAlert: (title: string, message: string) => void;
  showCopiedMessageFeedback: (messageIndex: number) => void;
};

type ChatMessageRuntimeClipboardChromeActionsStateInput = Omit<
  ChatMessageRuntimeClipboardActionsStateInput,
  'copyText' | 'showAlert'
>;

type ChatMessageRuntimeClipboardActionsState = {
  handleCopyMessage: (messageIndex: number, content: string) => Promise<void>;
  handleCopyToolPayload: (content: string) => Promise<void>;
};

type ChatMessageConversationRenderContextInput =
  ChatRuntimeConversationMessageRenderContextMobileStateInput;

type ChatMessageConversationRenderContext =
  ChatRuntimeConversationMessageRenderContextMobileState;

type ChatMessageActionComponentMap = ChatMessageActionSlotRenderMap<ReactNode>;
type ChatMessageActionEntry = ChatMessageActionSlotRenderEntry<ReactNode>;

export type ChatMessageActionSet = {
  entries: readonly ChatMessageActionEntry[];
  shouldRenderActionSlots: boolean;
  shouldRenderStandaloneActions: boolean;
};

export type ChatMessageActionStyleSlots = {
  turnDuration: Pick<
    ChatMessageTurnDurationActionSpec,
    'style' | 'liveStyle' | 'textStyle' | 'liveTextStyle'
  >;
  speech: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'activeStyle' | 'pressedStyle'>;
  branch: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'pressedStyle' | 'disabledStyle'>;
  copy: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'activeStyle' | 'pressedStyle'>;
  expansion: Pick<ChatMessageActionButtonSpec, 'hitSlop' | 'style' | 'pressedStyle'>;
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

type ChatRuntimeHeaderAgentSelectorParts = ReturnType<typeof createChatRuntimeHeaderAgentSelectorMobilePropsParts<
  ChatRuntimeAgentSelectorMobileRenderState,
  ChatRuntimeHeaderAgentSelectorProps['onPress'],
  ChatRuntimeHeaderAgentSelectorProps['labelNumberOfLines'],
  ChatRuntimeHeaderAgentSelectorProps['styles']
>>;

type ChatRuntimeHeaderAgentSelectorTouchableProps =
  ChatRuntimeHeaderAgentSelectorParts['touchable']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderAgentSelectorChipProps =
  ChatRuntimeHeaderAgentSelectorParts['chip']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderAgentSelectorLabelProps =
  ChatRuntimeHeaderAgentSelectorParts['label']['props'];

type ChatRuntimeHeaderAgentSelectorIconProps =
  ChatRuntimeHeaderAgentSelectorParts['icon']['props'];

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

type ChatRuntimeHeaderIconButtonParts = ReturnType<typeof createChatRuntimeHeaderIconButtonMobilePropsParts<
  ChatRuntimeHeaderIconButtonRenderState,
  ChatRuntimeHeaderIconButtonProps['onPress'],
  ChatRuntimeHeaderIconButtonProps['style'],
  ChatRuntimeHeaderIconButtonProps['activeStyle'],
  ChatRuntimeHeaderIconButtonProps['iconContainerStyle']
>>;

type ChatRuntimeHeaderIconButtonTouchableProps =
  ChatRuntimeHeaderIconButtonParts['touchable']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderIconButtonIconContainerProps =
  ChatRuntimeHeaderIconButtonParts['iconContainer']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderIconButtonIconProps =
  ChatRuntimeHeaderIconButtonParts['icon']['props'];

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

type ChatRuntimeHeaderConversationStatusParts = ReturnType<typeof createChatRuntimeHeaderConversationStatusMobilePropsParts<
  ChatSessionStatusMobileRenderState,
  ChatRuntimeHeaderConversationStatusProps['spinnerSource'],
  ChatRuntimeHeaderConversationStatusProps['styles']
>>;

type ChatRuntimeHeaderConversationStatusContainerProps =
  ChatRuntimeHeaderConversationStatusParts['container']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderConversationStatusRunningIndicatorProps =
  ChatRuntimeHeaderConversationStatusParts['runningIndicator']['props'];

type ChatRuntimeHeaderConversationStatusLabelProps =
  ChatRuntimeHeaderConversationStatusParts['label']['props'];

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

type ChatRuntimeHeaderTurnDurationParts = ReturnType<typeof createChatRuntimeHeaderTurnDurationMobilePropsParts<
  ChatRuntimeTurnDurationHeaderMobileRenderState,
  ChatRuntimeHeaderTurnDurationProps['styles']
>>;

type ChatRuntimeHeaderTurnDurationContainerProps =
  ChatRuntimeHeaderTurnDurationParts['container']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderTurnDurationIconProps =
  ChatRuntimeHeaderTurnDurationParts['icon']['props'];

type ChatRuntimeHeaderTurnDurationLabelProps =
  ChatRuntimeHeaderTurnDurationParts['label']['props'];

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

type ChatRuntimeNavigationHeaderRenderStateInput =
  ChatRuntimeNavigationHeaderMobileRenderStateInput;

type ChatRuntimeNavigationHeaderRenderState =
  ChatRuntimeNavigationHeaderMobileRenderState;

type ChatRuntimeNavigationHeaderOptions = {
  headerTitle: () => ReactNode;
  headerLeft: () => ReactNode;
  headerRight: () => ReactNode;
};

type ChatRuntimeNavigationHeaderOptionsEffectInput = ChatRuntimeNavigationHeaderOptionsInput & {
  navigation?: {
    setOptions?: (options: ChatRuntimeNavigationHeaderOptions) => void;
  } | null;
};

type ChatRuntimeNavigationHeaderChromeOptionsInput =
  ChatRuntimeNavigationHeaderRenderStateInput
  & Pick<
    ChatRuntimeNavigationHeaderOptionsEffectInput,
    | 'navigation'
    | 'onAgentSelectorPress'
    | 'onBackButtonPress'
    | 'onPinButtonPress'
    | 'onKillSwitchButtonPress'
    | 'onHandsFreeButtonPress'
    | 'styles'
  >
  & {
    spinnerSource: ChatRuntimeHeaderConversationStatusProps['spinnerSource'];
  };

export type ChatConversationHomeQuickStartSource = PromptLibraryLauncherShortcutSource;

export type ChatConversationHomeQuickStartItem<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = PromptLibraryShortcutItem<TPrompt, TTask>;

type ChatConversationHomeQuickStartActionsStateInput<
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  setComposerInput: Dispatch<SetStateAction<string>>;
  focusComposerInput: () => void;
  openAddPrompt: () => void;
  runPromptTask: (task: TTask) => void | Promise<void>;
};

type ChatConversationHomeQuickStartActionsState<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  handleQuickStartPress: (item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => void;
};

export function showChatConversationHomePromptDeleteNativeConfirmAlert(
  input: ChatConversationHomePromptEditorDeleteNativeConfirmInput,
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): void {
  showAlert(input.title, input.message, [
    { text: input.cancelLabel, style: 'cancel' },
    { text: input.deleteLabel, style: 'destructive', onPress: input.onConfirm },
  ]);
}

export function createChatConversationHomePromptDeleteNativeConfirmPresenter(
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): (input: ChatConversationHomePromptEditorDeleteNativeConfirmInput) => void {
  return (input) => showChatConversationHomePromptDeleteNativeConfirmAlert(input, showAlert);
}

export function confirmChatRuntimeWebDialog(message: string): boolean {
  return Boolean((globalThis as { confirm?: (message?: string) => boolean }).confirm?.(message));
}

export function showChatRuntimeWebAlert(message: string): void {
  (globalThis as { alert?: (message?: string) => void }).alert?.(message);
}

export function useChatConversationHomeQuickStartActionsState<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  setComposerInput,
  focusComposerInput,
  openAddPrompt,
  runPromptTask,
}: ChatConversationHomeQuickStartActionsStateInput<TTask>): ChatConversationHomeQuickStartActionsState<TPrompt, TTask> {
  const handleQuickStartPress = useCallback((item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => {
    const pressIntent = getChatRuntimeHomeQuickStartPressIntent(item);
    if (pressIntent.kind === 'add-prompt') {
      openAddPrompt();
      return;
    }
    if (pressIntent.kind === 'run-task') {
      void runPromptTask(pressIntent.task);
      return;
    }

    const trimmed = pressIntent.content.trim();
    if (!trimmed) return;

    setComposerInput((currentValue) => {
      const existing = currentValue.trim();
      return existing.length > 0 ? `${existing}\n\n${trimmed}` : trimmed;
    });
    focusComposerInput();
  }, [
    focusComposerInput,
    openAddPrompt,
    runPromptTask,
    setComposerInput,
  ]);

  return {
    handleQuickStartPress,
  };
}

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
  shouldRender?: boolean;
  entries: readonly ChatMessageActionEntry[];
  rowStyle?: StyleProp<ViewStyle>;
};

type ChatMessageActionSlotListParts = ReturnType<typeof createChatRuntimeMessageActionSlotListMobilePropsParts<
  ChatMessageActionEntry,
  ChatMessageActionSlotListProps['rowStyle']
>>;

type ChatMessageActionSlotListRowProps =
  ChatMessageActionSlotListParts['row']['props'] & {
    children: ReactNode;
  };

type ChatMessageStandaloneActionsProps = ChatMessageActionSlotListProps & {
  shouldRender: boolean;
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
  renderState: ChatRuntimeRetryStatusMobileRenderState;
  styles: ChatMessageRetryStatusStyles;
};

type ChatMessageRetryStatusPropsInput = ChatRuntimeConversationRetryStatusMobileState;

type ChatMessageRetryStatusParts = ReturnType<typeof createChatRuntimeRetryStatusMobilePropsParts<
  ChatRuntimeRetryStatusMobileRenderState,
  ChatMessageRetryStatusStyles
>>;

type ChatMessageRetryStatusCardProps =
  ChatMessageRetryStatusParts['card']['props'] & {
    children: ReactNode;
  };

type ChatMessageRetryStatusViewProps =
  (ChatMessageRetryStatusParts['header']['props'] | ChatMessageRetryStatusParts['meta']['props']) & {
    children: ReactNode;
  };

type ChatMessageRetryStatusIconProps =
  ChatMessageRetryStatusParts['icon']['props'];

type ChatMessageRetryStatusTitleProps =
  ChatMessageRetryStatusParts['title']['props'];

type ChatMessageRetryStatusSpinnerProps =
  ChatMessageRetryStatusParts['spinner']['props'];

type ChatMessageRetryStatusTextProps =
  | ChatMessageRetryStatusParts['attempt']['props']
  | ChatMessageRetryStatusParts['countdown']['props']
  | ChatMessageRetryStatusParts['description']['props'];

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

type ChatMessageToolApprovalParts = ReturnType<typeof createChatRuntimeToolApprovalMobilePropsParts<
  ChatMessageToolApprovalProps['onToggleArguments'],
  ChatMessageToolApprovalProps['onDeny'],
  ChatMessageToolApprovalProps['onApprove'],
  ChatMessageToolApprovalStyles
>>;

type ChatMessageToolApprovalViewProps = {
  children: ReactNode;
} & (
  | ChatMessageToolApprovalParts['card']['props']
  | ChatMessageToolApprovalParts['header']['props']
  | ChatMessageToolApprovalParts['content']['props']
  | ChatMessageToolApprovalParts['toolRow']['props']
);

type ChatMessageToolApprovalIconProps =
  | ChatMessageToolApprovalParts['headerIcon']['props']
  | ChatMessageToolApprovalParts['argumentsToggle']['icon']['props']
  | ChatMessageToolApprovalParts['denyButton']['icon']['props']
  | ChatMessageToolApprovalParts['approveButton']['icon']['props'];

type ChatMessageToolApprovalArgumentsToggleProps =
  ChatMessageToolApprovalParts['argumentsToggle']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolApprovalArgumentsToggleLabelProps =
  ChatMessageToolApprovalParts['argumentsToggle']['label']['props'];

type ChatMessageToolApprovalActionLabelProps =
  | ChatMessageToolApprovalParts['denyButton']['label']['props']
  | ChatMessageToolApprovalParts['approveButton']['label']['props'];

type ChatMessageToolApprovalSpinnerProps =
  | ChatMessageToolApprovalParts['headerSpinner']['props']
  | ChatMessageToolApprovalParts['approveButton']['spinner']['props'];

type ChatMessageToolApprovalTitleProps =
  ChatMessageToolApprovalParts['title']['props'];

type ChatMessageToolApprovalToolLabelProps =
  ChatMessageToolApprovalParts['toolLabel']['props'];

type ChatMessageToolApprovalToolNameProps =
  ChatMessageToolApprovalParts['toolName']['props'];

type ChatMessageToolApprovalArgumentsPreviewProps =
  ChatMessageToolApprovalParts['argumentsPreview']['props'];

type ChatMessageToolApprovalFullArgumentsProps =
  ChatMessageToolApprovalParts['fullArguments']['text']['props'];

type ChatMessageToolApprovalFullArgumentsScrollProps =
  ChatMessageToolApprovalParts['fullArguments']['scroll']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolApprovalActionsProps =
  ChatMessageToolApprovalParts['actions']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolApprovalActionButtonProps = {
  children: ReactNode;
} & (
  | ChatMessageToolApprovalParts['denyButton']['props']
  | ChatMessageToolApprovalParts['approveButton']['props']
);

type ChatMessageToolApprovalPropsInput = ChatRuntimeConversationToolApprovalMobileState;

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

type ChatMessageDelegationCardProps = Omit<
  ChatRuntimeDelegationCardMobilePresentationState,
  'conversationPreview' | 'toolPreview'
> & {
  conversationPreview: ChatRuntimeDelegationCardMobilePresentationState['conversationPreview'] & {
    onShowAll?: (event: GestureResponderEvent) => void;
  };
  toolPreview: ChatRuntimeDelegationCardMobilePresentationState['toolPreview'] & {
    onShowAll?: (event: GestureResponderEvent) => void;
  };
  styles: ChatMessageDelegationCardStyles;
};

type ChatMessageDelegationCardPropsInput =
  ChatRuntimeConversationDelegationCardMobileState<ACPDelegationProgress | null | undefined>;

type ChatMessageDelegationCardParts = ReturnType<typeof createChatRuntimeDelegationCardMobilePropsParts<
  ((event: GestureResponderEvent) => void),
  ((event: GestureResponderEvent) => void),
  ChatMessageDelegationCardStyles
>>;

type ChatMessageDelegationHeaderProps =
  ChatMessageDelegationCardParts['header']['props'];

type ChatMessageDelegationSubtitleProps =
  ChatMessageDelegationCardParts['subtitle']['props'];

type ChatMessageDelegationMetaRowProps =
  ChatMessageDelegationCardParts['meta']['props'];

type ChatMessageDelegationMetaItemProps =
  ChatMessageDelegationMetaRowProps['items'][number]['props'];

type ChatMessageDelegationConversationPreviewProps =
  ChatMessageDelegationCardParts['conversationPreview']['props'];

type ChatMessageDelegationConversationPreviewRowProps =
  ChatMessageDelegationConversationPreviewProps['rows'][number]['props'];

type ChatMessageDelegationToolPreviewProps =
  ChatMessageDelegationCardParts['toolPreview']['props'];

type ChatMessageDelegationToolPreviewRowProps =
  ChatMessageDelegationToolPreviewProps['rows'][number]['props'];

type ChatMessageDelegationToolPreviewLabelProps =
  ChatMessageDelegationToolPreviewProps['label']['props'];

type ChatMessageDelegationConversationMorePreviewActionProps =
  Extract<ChatMessageDelegationConversationPreviewProps['moreAction'], { shouldRender: true }>['props'];

type ChatMessageDelegationToolMorePreviewActionProps =
  Extract<ChatMessageDelegationToolPreviewProps['moreAction'], { shouldRender: true }>['props'];

type ChatMessageDelegationMorePreviewActionProps =
  | ChatMessageDelegationConversationMorePreviewActionProps
  | ChatMessageDelegationToolMorePreviewActionProps;

type ChatMessageToolActivityGroupHeaderKind = ChatRuntimeToolActivityGroupHeaderMobileKind;

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

type ChatMessageToolActivityGroupToggleParts = ReturnType<typeof createChatRuntimeToolActivityGroupToggleMobilePropsParts<
  ToolActivityGroupMobileRenderState,
  ChatMessageToolActivityGroupToggleProps['onPress'],
  ChatMessageToolActivityGroupToggleStyles
>>;

type ChatMessageToolActivityGroupCountBadgeProps =
  ChatMessageToolActivityGroupToggleParts['countBadge']['props'];

type ChatMessageToolActivityGroupPreviewLineProps =
  ChatMessageToolActivityGroupToggleParts['preview']['props'];

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

type ChatMessageToolActivityGroupFooterParts = ReturnType<typeof createChatRuntimeToolActivityGroupFooterMobilePropsParts<
  ToolActivityGroupMobileRenderState,
  ChatMessageToolActivityGroupFooterProps['onPress'],
  ChatMessageToolActivityGroupFooterStyles
>>;

type ChatMessageToolActivityGroupIconProps =
  | ChatMessageToolActivityGroupToggleParts['leadingIcon']['props']
  | ChatMessageToolActivityGroupFooterParts['icon']['props'];

type ChatMessageToolActivityGroupFooterLabelProps =
  ChatMessageToolActivityGroupFooterParts['label']['props'];

type ChatMessageToolActivityGroupBoundaryKind = ChatRuntimeToolActivityGroupBoundaryMobileKind;

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

type ChatMessageToolExecutionStackPropsInput = ChatRuntimeConversationToolExecutionStackMobileState;

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

type ChatMessageToolExecutionPayloadMetaParts = ReturnType<typeof createChatRuntimeToolExecutionPayloadMetaMobilePropsParts<
  ChatMessageToolExecutionPayloadMetaProps['renderState'],
  ChatMessageToolExecutionPayloadMetaProps['styles']
>>;

type ChatMessageToolExecutionPayloadMetaRowProps =
  ChatMessageToolExecutionPayloadMetaParts['row']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionPayloadMetaTextProps =
  | ChatMessageToolExecutionPayloadMetaParts['label']['props']
  | ChatMessageToolExecutionPayloadMetaParts['payloadType']['props'];

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

type ChatMessageToolExecutionCallDetailInput = NonNullable<
  ChatRuntimeConversationToolExecutionDetailMobileRowState['input']
>;

type ChatMessageToolExecutionCallDetailResult = NonNullable<
  ChatRuntimeConversationToolExecutionDetailMobileRowState['result']
>;

type ChatMessageToolExecutionCallDetailPendingResult = NonNullable<
  ChatRuntimeConversationToolExecutionDetailMobileRowState['pendingResult']
>;

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

type ChatMessageToolExecutionCallListRow = ChatRuntimeConversationToolExecutionDetailMobileRowState;

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

type ChatMessageScrollToBottomButtonProps = {
  renderState: ChatRuntimeScrollToBottomMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
};

type ChatMessageScrollToBottomButtonParts = ReturnType<typeof createChatRuntimeScrollToBottomButtonMobilePropsParts<
  ChatRuntimeScrollToBottomMobileRenderState,
  ChatMessageScrollToBottomButtonProps['onPress'],
  ChatMessageScrollToBottomButtonProps['style']
>>;

type ChatMessageScrollToBottomButtonTouchableProps =
  ChatMessageScrollToBottomButtonParts['button']['props'] & {
    children: ReactNode;
  };

type ChatMessageScrollToBottomButtonIconProps =
  ChatMessageScrollToBottomButtonParts['icon']['props'];

type ChatMessageLoadingStateProps = {
  renderState: ChatRuntimeLoadingStateMobileRenderState;
  spinnerSource: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  spinnerStyle: StyleProp<ImageStyle>;
};

type ChatMessageLoadingStateParts = ReturnType<typeof createChatRuntimeLoadingStateMobilePropsParts<
  ChatRuntimeLoadingStateMobileRenderState,
  ImageSourcePropType,
  StyleProp<ViewStyle>,
  StyleProp<ImageStyle>
>>;

type ChatMessageLoadingStateContainerProps =
  ChatMessageLoadingStateParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageLoadingStateSpinnerProps =
  ChatMessageLoadingStateParts['spinner']['props'];

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
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
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
    viewportContentIsLoadingMessages: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['isLoadingMessages'];
    viewportContentMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['messageCount'];
    loadingSpinnerSource: ImageSourcePropType;
    quickStartPrompts: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['prompts'];
    quickStartSkills: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['skills'];
    quickStartTasks: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['tasks'];
    quickStartCanAddPrompt: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['canAddPrompt'];
    isLoadingQuickStartPrompts: boolean;
    runningPromptTaskId?: string | null;
    onQuickStartPress: ChatConversationHomeQuickStartsProps<TPrompt, TTask>['onPress'];
    onEditPrompt: ChatConversationHomeQuickStartsProps<TPrompt, TTask>['onEditPrompt'];
    onDeletePrompt: ChatConversationHomeQuickStartsProps<TPrompt, TTask>['onDeletePrompt'];
    visibleMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['visibleMessageCount'];
    totalMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['totalMessageCount'];
    hiddenMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['hiddenMessageCount'];
    messageHistoryLoadIncrement: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['messageHistoryLoadIncrement'];
    latestStepSummary: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['latestStepSummary'];
    colors: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['colors'];
    onLoadEarlierMessages?: ChatMessageHistoryBannerProps['onLoadEarlier'];
    requestDebugText?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['requestDebugText'];
    voiceDebugEnabled?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['voiceDebugEnabled'];
    voiceEvents?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['voiceEvents'];
  };

type ChatMessageResponseHistoryPanelViewProps = ComponentProps<typeof ResponseHistoryPanel>;

type ChatMessageResponseHistoryPanelDockProps = Pick<
  ChatMessageResponseHistoryPanelViewProps,
  'responses' | 'colors' | 'remoteBaseUrl' | 'remoteApiKey'
> & {
  ttsProvider?: ChatMessageRuntimeRemoteSpeechOptions['providerId'];
  edgeTtsVoice?: ChatMessageRuntimeRemoteSpeechOptions['voice'];
  remoteTtsVoice?: ChatMessageRuntimeRemoteSpeechOptions['voice'] | null;
  remoteTtsModel?: ChatMessageRuntimeRemoteSpeechOptions['model'] | null;
  ttsRate?: ChatMessageRuntimeRemoteSpeechOptions['rate'] | null;
  ttsPitch?: ChatMessageRuntimeNativeSpeechOptions['pitch'] | null;
  ttsVoiceId?: ChatMessageRuntimeNativeSpeechOptions['voice'] | null;
  speakNative: ChatMessageRuntimeSpeechActionsStateInput['speakNative'];
  stopNativeSpeech: ChatMessageRuntimeSpeechActionsStateInput['stopNativeSpeech'];
  speakRemote: ChatMessageRuntimeSpeechActionsStateInput['speakRemote'];
  stopRemoteSpeech: ChatMessageRuntimeSpeechActionsStateInput['stopRemoteSpeech'];
};

type ChatMessageRuntimeResponseHistoryPanelChromeStateInput = ChatMessageResponseHistoryPanelDockProps;

type ChatMessageRuntimeResponseHistoryPanelChromeState = Pick<
  ChatMessageResponseHistoryPanelViewProps,
  'isCollapsed' | 'shouldAnimateNewest' | 'speakingIndex' | 'onToggleCollapsed' | 'onSpeakResponse'
>;

type ChatMessageQueuePanelViewProps = ComponentProps<typeof MessageQueuePanel>;

type ChatMessageQueuePanelDockPanelProps = Omit<
  ChatMessageQueuePanelViewProps,
  'isListCollapsed' | 'onToggleListCollapsed'
> & {
  conversationId: string;
};

type ChatMessageRuntimeQueuePanelDockChromeStateInput = Pick<
  ChatMessageQueuePanelDockPanelProps,
  'conversationId'
>;

type ChatMessageRuntimeQueuePanelDockChromeState = Pick<
  ChatMessageQueuePanelViewProps,
  'isListCollapsed' | 'onToggleListCollapsed'
>;

type ChatMessageQueuePanelDockProps = {
  shouldRender: boolean;
  panel: ChatMessageQueuePanelDockPanelProps;
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
  scrollToBottomVisible: ChatRuntimeDockChromeMobileRenderStateInput['scrollToBottomVisible'];
  onScrollToBottom?: ChatMessageScrollToBottomButtonProps['onPress'];
  voiceOverlayListening: boolean;
  voiceOverlayHandsFree: ChatRuntimeDockChromeMobileRenderStateInput['voiceOverlayHandsFree'];
  voiceOverlayWillCancel: ChatRuntimeDockChromeMobileRenderStateInput['voiceOverlayWillCancel'];
  voiceOverlayTranscript: ChatComposerVoiceOverlayProps['transcript'];
  queuePanelEnabled: ChatRuntimeDockChromeMobileRenderStateInput['queuePanelEnabled'];
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
  connectionState: ChatRuntimeDockChromeMobileRenderStateInput['connectionState'];
  lastFailedMessage: ChatRuntimeDockChromeMobileRenderStateInput['lastFailedMessage'];
  isResponding: ChatRuntimeDockChromeMobileRenderStateInput['isResponding'];
  colors:
    & ChatRuntimeDockChromeMobileRenderStateInput['colors']
    & ChatMessageResponseHistoryPanelDockProps['colors']
    & ChatMessageQueuePanelDockProps['panel']['colors'];
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
  platform: ChatRuntimeSurfaceChromeMobileRenderStateInput['platform'];
  colors: ChatRuntimeSurfaceChromeMobileRenderStateInput['colors'];
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

export type ChatMessageRuntimeChromePropsInput<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = {
  colors:
    & ChatComposerRuntimeDockChromeInput['colors']
    & ChatComposerRuntimeDockChromePropsInput['pendingImagesColors']
    & ChatComposerRuntimeDockChromePropsInput['composerControlColors']
    & ChatMessageRuntimeDockChromePropsInput['colors']
    & ChatMessageConversationRuntimeThreadListRenderStateInput['colors']
    & ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>['colors']
    & ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>['colors'];
  platform:
    & ChatComposerRuntimeDockChromeInput['platform']
    & ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>['platform'];
  spinnerSource: ImageSourcePropType;
  styles: {
    actionStyles: ChatMessageActionStyleSlots;
    threadStyles: ChatMessageConversationRuntimeThreadListProps['styles'];
    promptEditorStyles: ChatConversationHomePromptEditorModalProps['styles'];
  };
  composer: Omit<ChatComposerRuntimeDockChromePropsInput, 'chrome' | 'pendingImagesColors' | 'composerControlColors'>;
  dock: Omit<ChatMessageRuntimeDockChromePropsInput, 'composer' | 'colors'>;
  threadList: Omit<ChatMessageConversationRuntimeThreadListRenderStateInput, 'spinnerSource' | 'colors' | 'actionStyles'>;
  viewport: Omit<
    ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>,
    'visibleMessageCount' | 'totalMessageCount' | 'hiddenMessageCount' | 'loadingSpinnerSource' | 'colors'
  >;
  surface: Omit<
    ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>,
    'dock' | 'viewport' | 'threadStates' | 'threadStyles' | 'colors' | 'platform' | 'promptEditorStyles'
  >;
};

export type ChatMessageRuntimeChromeSurfaceProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = ChatMessageRuntimeChromePropsInput<TPrompt, TTask> & {
  surfaceStyles: ChatMessageRuntimeSurfaceProps<TPrompt, TTask>['styles'];
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

type ChatComposerSpeechPreviewParts = ReturnType<typeof createChatComposerSpeechPreviewMobilePropsParts<
  ChatComposerSpeechPreviewProps['text'],
  ChatComposerSpeechPreviewProps['styles']
>>;

type ChatComposerSpeechPreviewContainerProps =
  ChatComposerSpeechPreviewParts['container']['props'] & {
    children: ReactNode;
  };

type ChatComposerSpeechPreviewLabelProps =
  ChatComposerSpeechPreviewParts['label']['props'];

type ChatComposerSpeechPreviewTextProps =
  ChatComposerSpeechPreviewParts['text']['props'];

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

type ChatComposerPendingImagesRailParts = ReturnType<typeof createChatComposerPendingImagesRailMobilePropsParts<
  ChatComposerPendingImageItem,
  ChatComposerPendingImagesRailProps['renderState'],
  ChatComposerPendingImagesRailProps['styles']
>>;

type ChatComposerPendingImagesRailScrollViewProps =
  ChatComposerPendingImagesRailParts['scrollView']['props'] & {
    children: ReactNode;
  };

type ChatComposerPendingImagesRailItemParts =
  ChatComposerPendingImagesRailParts['items'][number];

type ChatComposerPendingImageCardProps =
  ChatComposerPendingImagesRailItemParts['card']['props'] & {
    children: ReactNode;
  };

type ChatComposerPendingImagePreviewProps =
  ChatComposerPendingImagesRailItemParts['preview']['props'];

type ChatComposerPendingImageRemoveButtonProps =
  ChatComposerPendingImagesRailItemParts['removeButton']['props'] & {
    children: ReactNode;
  };

type ChatComposerPendingImageRemoveIconProps =
  ChatComposerPendingImagesRailItemParts['removeIcon']['props'];

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

type ChatComposerVoiceOverlayParts = ReturnType<typeof createChatComposerVoiceOverlayMobilePropsParts<
  ChatComposerVoiceOverlayProps['transcript'],
  ChatComposerVoiceOverlayProps['transcriptNumberOfLines'],
  ChatComposerVoiceOverlayProps['styles']
>>;

type ChatComposerVoiceOverlayContainerProps =
  ChatComposerVoiceOverlayParts['overlay']['props'] & {
    children: ReactNode;
  };

type ChatComposerVoiceOverlayCardProps =
  ChatComposerVoiceOverlayParts['card']['props'] & {
    children: ReactNode;
  };

type ChatComposerVoiceOverlayLabelProps =
  ChatComposerVoiceOverlayParts['label']['props'];

type ChatComposerVoiceOverlayTranscriptProps =
  ChatComposerVoiceOverlayParts['transcript']['props'];

type ChatComposerHandsFreeControlsStyles = {
  statusRow: StyleProp<ViewStyle>;
  controlsRow: StyleProp<ViewStyle>;
  controlButton: StyleProp<ViewStyle>;
  controlButtonText: StyleProp<TextStyle>;
};

type ChatComposerHandsFreeControlsProps = {
  isVisible: boolean;
  status: ReactNode;
  controlState: ChatComposerRuntimeHandsFreeControlsRenderState['controlState'];
  onWake: (event: GestureResponderEvent) => void;
  onSleep: (event: GestureResponderEvent) => void;
  onResume: (event: GestureResponderEvent) => void;
  onPause: (event: GestureResponderEvent) => void;
  controlPressedOpacity: number;
  styles: ChatComposerHandsFreeControlsStyles;
};

type ChatComposerHandsFreeControlsParts = ReturnType<typeof createChatComposerHandsFreeControlsMobilePropsParts<
  ChatComposerHandsFreeControlsProps['status'],
  ChatComposerHandsFreeControlsProps['controlState'],
  ChatComposerHandsFreeControlsProps['onWake'],
  ChatComposerHandsFreeControlsProps['onSleep'],
  ChatComposerHandsFreeControlsProps['onResume'],
  ChatComposerHandsFreeControlsProps['onPause'],
  ChatComposerHandsFreeControlsProps['controlPressedOpacity'],
  ChatComposerHandsFreeControlsProps['styles']
>>;

type ChatComposerHandsFreeStatusRowProps =
  ChatComposerHandsFreeControlsParts['statusRow']['props'] & {
    children: ReactNode;
  };

type ChatComposerHandsFreeControlsRowProps =
  ChatComposerHandsFreeControlsParts['controlsRow']['props'] & {
    children: ReactNode;
  };

type ChatComposerHandsFreeControlButtonProps =
  ChatComposerHandsFreeControlsParts['primaryControl']['touchable']['props'] & {
    children: ReactNode;
  };

type ChatComposerHandsFreeControlLabelProps =
  ChatComposerHandsFreeControlsParts['primaryControl']['label']['props'];

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

type ChatComposerIconButtonParts = ReturnType<typeof createChatComposerIconButtonMobilePropsParts<
  ChatComposerIconButtonRenderState,
  ChatComposerIconButtonProps['onPress'],
  ChatComposerIconButtonProps['activeOpacity'],
  ChatComposerIconButtonProps['style'],
  ChatComposerIconButtonProps['activeStyle']
>>;

type ChatComposerIconButtonTouchableProps =
  ChatComposerIconButtonParts['touchable']['props'] & {
    children: ReactNode;
  };

type ChatComposerIconButtonIconProps =
  ChatComposerIconButtonParts['icon']['props'];

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

type ChatComposerLabeledActionButtonParts = ReturnType<typeof createChatComposerLabeledActionButtonMobilePropsParts<
  ChatComposerLabeledActionRenderState,
  ChatComposerLabeledActionButtonProps['onPress'],
  ChatComposerLabeledActionButtonProps['activeOpacity'],
  ChatComposerLabeledActionButtonProps['styles']
>>;

type ChatComposerLabeledActionButtonTouchableProps =
  ChatComposerLabeledActionButtonParts['touchable']['props'] & {
    children: ReactNode;
  };

type ChatComposerLabeledActionButtonIconProps =
  ChatComposerLabeledActionButtonParts['icon']['props'];

type ChatComposerLabeledActionButtonLabelProps =
  ChatComposerLabeledActionButtonParts['label']['props'];

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

type ChatComposerMicButtonParts = ReturnType<typeof createChatComposerMicButtonMobilePropsParts<
  ChatComposerMicButtonRenderState,
  ChatComposerMicButtonProps['onPressIn'],
  ChatComposerMicButtonProps['onPressOut'],
  ChatComposerMicButtonProps['onPress'],
  ChatComposerMicButtonProps['webPressedStyle'],
  ChatComposerMicButtonProps['styles']
>>;

type ChatComposerMicButtonPressableProps =
  ChatComposerMicButtonParts['pressable']['props'] & {
    children: ReactNode;
  };

type ChatComposerMicButtonIconProps =
  ChatComposerMicButtonParts['icon']['props'];

type ChatComposerMicButtonLabelProps =
  ChatComposerMicButtonParts['label']['props'];

type ChatComposerTextEntryStyles = {
  input: StyleProp<TextStyle>;
  visuallyHiddenHint: StyleProp<TextStyle>;
};

type ChatComposerTextEntryWebAccessibility = {
  isWebPlatform: boolean;
  inputDescriptionNativeId: string;
  voiceStatusLiveRegionNativeId: string;
  voiceStatusLiveRegionPoliteness: NonNullable<ComponentProps<typeof Text>['accessibilityLiveRegion']>;
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

type ChatComposerTextEntryParts = ReturnType<typeof createChatComposerTextEntryMobilePropsParts<
  ChatComposerTextEntryProps['inputRef'],
  ChatComposerTextEntryProps['value'],
  ChatComposerTextEntryProps['onChangeText'],
  ChatComposerTextEntryProps['onKeyPress'],
  ChatComposerTextEntryProps['placeholderTextColor'],
  ChatComposerTextEntryProps['webAccessibility'],
  ChatComposerTextEntryProps['styles']
>>;

type ChatComposerTextEntryInputProps =
  ChatComposerTextEntryParts['input']['props'];

type ChatComposerTextEntryInputDescriptionProps =
  ChatComposerTextEntryParts['inputDescription']['props'];

type ChatComposerTextEntryVoiceStatusLiveRegionProps =
  ChatComposerTextEntryParts['voiceStatusLiveRegion']['props'];

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

type ChatComposerInputDockParts = ReturnType<typeof createChatComposerInputDockMobilePropsParts<
  ChatComposerInputDockProps['speechPreview'],
  ChatComposerInputDockProps['pendingImagesRail'],
  ChatComposerInputDockProps['handsFreeControls'],
  ChatComposerInputDockProps['imageAttachmentControl'],
  ChatComposerInputDockProps['textToSpeechControl'],
  ChatComposerInputDockProps['editBeforeSendControl'],
  ChatComposerInputDockProps['textEntry'],
  ChatComposerInputDockProps['queueAction'],
  ChatComposerInputDockProps['submitAction'],
  ChatComposerInputDockProps['micButton'],
  ChatComposerInputDockProps['micWrapperRef'],
  ChatComposerInputDockProps['styles']
>>;

type ChatComposerInputDockAreaProps =
  ChatComposerInputDockParts['area']['props'] & {
    children: ReactNode;
  };

type ChatComposerInputDockRowProps =
  ChatComposerInputDockParts['row']['props'] & {
    children: ReactNode;
  };

type ChatComposerInputDockMicWrapperProps =
  Omit<ChatComposerInputDockParts['micWrapper']['props'], 'ref'> & {
    children: ReactNode;
  };

type ChatMessageSurfaceProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  toneStyle?: StyleProp<ViewStyle>;
};

type ChatMessageSurfaceParts = ReturnType<typeof createChatRuntimeMessageSurfaceMobilePropsParts<
  ChatMessageSurfaceProps['style'],
  ChatMessageSurfaceProps['toneStyle']
>>;

type ChatMessageSurfaceContainerProps =
  ChatMessageSurfaceParts['container']['props'] & {
    children: ReactNode;
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

type ChatMessageInlineActivityParts = ReturnType<typeof createChatRuntimeInlineActivityMobilePropsParts<
  ChatRuntimeInlineActivityMobileRenderState,
  ImageSourcePropType,
  StyleProp<ViewStyle>,
  StyleProp<ImageStyle>
>>;

type ChatMessageInlineActivityContainerProps =
  ChatMessageInlineActivityParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageInlineActivitySpinnerProps =
  ChatMessageInlineActivityParts['spinner']['props'];

type ChatMessageContentRowProps = {
  children: ReactNode;
  shouldRenderActionSlots: boolean;
  entries: readonly ChatMessageActionEntry[];
  rowStyle: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
};

type ChatMessageContentRowParts = ReturnType<typeof createChatRuntimeMessageContentRowMobilePropsParts<
  ChatMessageActionEntry,
  ChatMessageContentRowProps['rowStyle'],
  ChatMessageContentRowProps['bodyStyle']
>>;

type ChatMessageContentRowContainerProps =
  ChatMessageContentRowParts['row']['props'] & {
    children: ReactNode;
  };

type ChatMessageContentBodyProps =
  ChatMessageContentRowParts['body']['props'] & {
    children: ReactNode;
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
  streamingRenderState: ChatRuntimeStreamingContentMobileRenderState;
  markdownContent: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
  spinnerSource: ImageSourcePropType;
  streamingStyles: ChatMessageExpandedContentStyles;
};

type ChatMessageCollapsedPreviewProps = {
  renderState: ChatRuntimeConversationMessageMobileRenderState['collapsedPreview'];
  actionState: ChatMessageCollapsedPreviewMobileActionState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageCollapsedPreviewPropsInput = Pick<
  ChatMessageCollapsedPreviewProps,
  'renderState' | 'actionState' | 'onPress'
>;

type ChatMessageConversationContentProps = {
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode;
  rowStyle: StyleProp<ViewStyle>;
  shouldRenderActionSlots: boolean;
  entries: readonly ChatMessageActionEntry[];
  expanded: ChatMessageExpandedContentProps & {
    bodyStyle: StyleProp<ViewStyle>;
  };
  collapsed: ChatMessageCollapsedPreviewProps;
};

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

type ChatComposerRuntimeDockChromeInput =
  ChatComposerRuntimeDockMobileRenderStateInput;

type ChatComposerRuntimeHandsFreeControlsRenderState =
  ChatComposerRuntimeHandsFreeControlsMobileRenderState;

type ChatComposerRuntimeDockChromePropsInput = {
  chrome: ChatComposerRuntimeDockChromeProps;
  speechPreviewText: ChatComposerSpeechPreviewProps['text'];
  pendingImages: ChatComposerPendingImagesRailProps['images'];
  pendingImagesColors: ChatComposerRuntimeDockMobilePropsInput['pendingImagesColors'];
  onRemovePendingImage: ChatComposerPendingImagesRailProps['onRemove'];
  handsFreeStatusPhase: ChatComposerRuntimeHandsFreeControlsProps['status']['phase'];
  handsFreeStatusLabel: ChatComposerRuntimeHandsFreeControlsProps['status']['label'];
  handsFreeStatusEnabled: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusEnabled'];
  handsFreeStatusWakePhrase: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusWakePhrase'];
  handsFreeStatusSleepPhrase: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusSleepPhrase'];
  handsFreeStatusLastError: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusLastError'];
  handsFreeStatusForegroundOnly: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusForegroundOnly'];
  onWakeHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onWake'];
  onSleepHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onSleep'];
  onResumeHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onResume'];
  onPauseHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onPause'];
  composerControlHasContent: ChatComposerRuntimeDockMobilePropsInput['composerControlHasContent'];
  composerControlConversationState: ChatComposerRuntimeDockMobilePropsInput['composerControlConversationState'];
  composerControlIsResponding: ChatComposerRuntimeDockMobilePropsInput['composerControlIsResponding'];
  composerControlPendingImageCount: ChatComposerRuntimeDockMobilePropsInput['composerControlPendingImageCount'];
  composerControlTtsEnabled: ChatComposerRuntimeDockMobilePropsInput['composerControlTtsEnabled'];
  composerControlEditBeforeSendEnabled: ChatComposerRuntimeDockMobilePropsInput['composerControlEditBeforeSendEnabled'];
  composerControlMicPhase: ChatComposerRuntimeDockMobilePropsInput['composerControlMicPhase'];
  composerControlListening: ChatComposerRuntimeDockMobilePropsInput['composerControlListening'];
  composerControlMessageQueueEnabled: ChatComposerRuntimeDockMobilePropsInput['composerControlMessageQueueEnabled'];
  composerControlColors: ChatComposerRuntimeDockMobilePropsInput['composerControlColors'];
  onImageAttachmentPress: ChatComposerIconButtonProps['onPress'];
  onTextToSpeechPress: ChatComposerIconButtonProps['onPress'];
  onEditBeforeSendPress: ChatComposerIconButtonProps['onPress'];
  textEntryInputRef: ChatComposerTextEntryProps['inputRef'];
  textEntryValue: ChatComposerTextEntryProps['value'];
  onTextEntryChangeText: ChatComposerTextEntryProps['onChangeText'];
  onTextEntryKeyPress: ChatComposerTextEntryProps['onKeyPress'];
  textEntryHandsFree: ChatComposerRuntimeDockMobilePropsInput['textEntryHandsFree'];
  textEntryListening: ChatComposerRuntimeDockMobilePropsInput['textEntryListening'];
  textEntryWillCancel: ChatComposerRuntimeDockMobilePropsInput['textEntryWillCancel'];
  textEntryLiveTranscript: ChatComposerRuntimeDockMobilePropsInput['textEntryLiveTranscript'];
  textEntryWakePhrase: ChatComposerRuntimeDockMobilePropsInput['textEntryWakePhrase'];
  textEntryPlaceholderFallback?: ChatComposerRuntimeDockMobilePropsInput['textEntryPlaceholderFallback'];
  onQueueActionPress: ChatComposerLabeledActionButtonProps['onPress'];
  onSubmitActionPress: ChatComposerLabeledActionButtonProps['onPress'];
  onMicPressIn: ChatComposerMicButtonProps['onPressIn'];
  onMicPressOut: ChatComposerMicButtonProps['onPressOut'];
  onMicPress: ChatComposerMicButtonProps['onPress'];
  micWrapperRef?: ChatComposerInputDockProps['micWrapperRef'];
};

export type ChatMessageThreadBodyStyleSlots = {
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
  getToneStyle: (
    toneStyleSlot: ChatRuntimeConversationSurfaceToneMobileStyleSlot
  ) => ChatMessageThreadSurfaceProps['surfaceToneStyle'];
};

type ChatMessageThreadBodyContentProps =
  Omit<ChatMessageConversationContentProps, 'rowStyle' | 'expanded' | 'collapsed'>
  & {
    expanded: Omit<ChatMessageConversationContentProps['expanded'], 'bodyStyle' | 'streamingStyles'>;
    collapsed: Omit<ChatMessageConversationContentProps['collapsed'], 'style' | 'pressedStyle' | 'textStyle'>;
  };

type ChatMessageExpandedContentPropsInput = Pick<
  ChatMessageThreadBodyContentProps['expanded'],
  'streamingRenderState' | 'markdownContent' | 'assetBaseUrl' | 'assetAuthToken' | 'spinnerSource'
>;

type ChatMessageThreadBodyProps = {
  bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode;
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

type ChatMessageConversationBodyProps = ChatMessageThreadBodyProps['conversation'];

type ChatMessageConversationBodyPropsInput = {
  surfaceToneStyleSlot: ChatRuntimeConversationSurfaceToneMobileStyleSlot;
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode;
  actionSet: ChatMessageActionSetInput;
  expanded: ChatMessageExpandedContentPropsInput;
  collapsed: ChatMessageCollapsedPreviewPropsInput;
  toolExecutionStack: ChatMessageToolExecutionStackPropsInput;
};

type ChatMessageThreadBodyPropsInput =
  Pick<ChatMessageThreadBodyProps, 'bodyDisplayMode' | 'inlineActivity'>
  & {
    retryStatus: ChatMessageRetryStatusPropsInput;
    delegationCard: ChatMessageDelegationCardPropsInput;
    toolApproval: ChatMessageToolApprovalPropsInput;
    conversation: ChatMessageConversationBodyPropsInput;
  };

type ChatMessageConversationThreadBodySharedInput =
  ChatRuntimeConversationThreadBodyMobileStateInput<
    ChatMessageActionStyleSlots['turnDuration'],
    ChatMessageActionStyleSlots['speech'],
    ChatMessageActionStyleSlots['branch'],
    ChatMessageActionStyleSlots['copy'],
    ChatMessageActionStyleSlots['expansion'],
    ChatRuntimeStreamingContentMobileRenderStateInput['colors'],
    ChatMessageExpandedContentPropsInput['spinnerSource'],
    NonNullable<ChatMessageExpandedContentPropsInput['assetBaseUrl']>,
    NonNullable<ChatMessageExpandedContentPropsInput['assetAuthToken']>,
    AgentRetryInfo | null | undefined,
    ACPDelegationProgress | null | undefined
  >;

type ChatMessageConversationThreadBodyInput = ChatMessageConversationThreadBodySharedInput;

export type ChatMessageRuntimeThreadStyleSlots = {
  surface: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
  body: ChatMessageThreadBodyStyleSlots;
};

export type ChatMessageConversationThreadStyleSlots = {
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

type ChatMessageConversationToolActivityGroupThreadRenderStateInput =
  ChatRuntimeConversationToolActivityGroupThreadRenderStateInput;

type ChatMessageConversationRenderableRuntimeThreadState =
  ChatRuntimeConversationRenderableRuntimeThreadState<ChatMessageThreadBodyPropsInput | null>;

type ChatMessageConversationMessageRuntimeThreadStateInput =
  ChatRuntimeConversationMessageRuntimeThreadStateInput<ChatMessageThreadBodyPropsInput>;

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

type ChatMessageConversationItemThreadRenderStateInput =
  ChatMessageConversationToolActivityGroupThreadRenderStateInput
  & Omit<
    ChatMessageConversationMessageThreadRenderStateInput,
    'itemKey' | 'groupRenderState' | 'groupThreadState'
  >;

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
    groupByIndex: ReadonlyMap<number, ChatMessageRuntimeToolActivityGroup>;
    speakingMessageIndex: number | null;
    copiedMessageIndex: number | null;
  };

type ChatMessageRuntimeHistoryWindowStateInput = {
  messageCount: number;
  sessionId?: string | null;
};

type ChatMessageRuntimeHistoryWindowState = ReturnType<typeof getChatRuntimeMessageHistoryWindowMobileState> & {
  visibleMessageCount: number;
  loadEarlierMessages: () => void;
};

type ChatMessageRuntimeBranchProgressStateInput = {
  sessionId?: string | null;
};

type ChatMessageRuntimeBranchProgressState = {
  pendingBranchMessageIndex: number | null;
  beginBranchMessage: (messageIndex: number) => void;
  clearBranchMessage: () => void;
};

type ChatMessageRuntimeBranchClient = {
  branchConversation: (
    conversationId: string,
    input: { messageIndex: number },
  ) => Promise<{ id: string }>;
};

type ChatMessageRuntimeBranchSession = {
  id: string;
};

type ChatMessageRuntimeBranchSessionStore<TBranchClient extends ChatMessageRuntimeBranchClient> = {
  syncWithServer: (client: TBranchClient) => unknown | Promise<unknown>;
  findSessionByServerConversationId: (conversationId: string) => ChatMessageRuntimeBranchSession | null | undefined;
  setCurrentSession: (sessionId: string) => void;
};

type ChatMessageRuntimeBranchActionsStateInput<TBranchClient extends ChatMessageRuntimeBranchClient> = {
  branchClient?: TBranchClient | null;
  serverConversationId?: string | null;
  sessionStore: ChatMessageRuntimeBranchSessionStore<TBranchClient>;
  beginBranchMessage: (messageIndex: number) => void;
  clearBranchMessage: () => void;
  navigateToChat: () => void;
  showAlert: (title: string, message: string) => void;
};

type ChatMessageRuntimeBranchChromeActionsStateInput<TBranchClient extends ChatMessageRuntimeBranchClient> = Omit<
  ChatMessageRuntimeBranchActionsStateInput<TBranchClient>,
  'showAlert'
>;

type ChatMessageRuntimeBranchActionsState = {
  handleBranchFromMessage: (messageIndex: number) => Promise<void>;
  handleBranchFromMessagePress: (messageIndex: number) => void;
};

type ChatRuntimeCurrentSessionPinSessionStore = {
  currentSessionId: string | null;
  toggleSessionPinned: (sessionId: string) => unknown | Promise<unknown>;
};

type ChatRuntimeCurrentSessionPinActionsStateInput = {
  sessionStore: ChatRuntimeCurrentSessionPinSessionStore;
};

type ChatRuntimeCurrentSessionPinActionsState = {
  handleToggleCurrentSessionPinned: () => void;
};

type ChatRuntimeBackToSessionsNavigation = {
  navigate: (screenName: 'Sessions') => void;
};

type ChatRuntimeNavigateToChatNavigation = {
  navigate: (screenName: 'Chat') => void;
};

type ChatRuntimeBackToSessionsActionsStateInput = {
  navigation: ChatRuntimeBackToSessionsNavigation;
};

type ChatRuntimeNavigateToChatActionsStateInput = {
  navigation: ChatRuntimeNavigateToChatNavigation;
};

type ChatRuntimeBackToSessionsActionsState = {
  handleBackToSessions: () => void;
};

type ChatRuntimeNavigateToChatActionsState = {
  navigateToChat: () => void;
};

type ChatMessageRuntimeKillSwitchClient = {
  killSwitch: () => Promise<ChatRuntimeKillSwitchResultLike>;
};

type ChatMessageRuntimeKillSwitchNativeConfirmInput = Pick<
  ChatRuntimeKillSwitchConfirmationAlertState,
  'title' | 'message' | 'cancelLabel' | 'confirmLabel'
> & {
  onConfirm: () => void;
};

type ChatMessageRuntimeKillSwitchActionsStateInput<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
> = {
  platform: string;
  getKillSwitchClient: () => TKillSwitchClient | null | undefined;
  confirmWeb: (message: string) => boolean;
  showWebAlert: (message: string) => void;
  confirmNative: (input: ChatMessageRuntimeKillSwitchNativeConfirmInput) => void;
  showAlert: (title: string, message: string) => void;
};

type ChatMessageRuntimeKillSwitchChromeActionsStateInput<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
> = Omit<
  ChatMessageRuntimeKillSwitchActionsStateInput<TKillSwitchClient>,
  'confirmWeb' | 'showWebAlert' | 'confirmNative' | 'showAlert'
>;

type ChatMessageRuntimeKillSwitchActionsState = {
  handleKillSwitch: () => Promise<void>;
};

export function showChatMessageRuntimeKillSwitchNativeConfirmAlert(
  input: ChatMessageRuntimeKillSwitchNativeConfirmInput,
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): void {
  showAlert(input.title, input.message, [
    { text: input.cancelLabel, style: 'cancel' },
    {
      text: input.confirmLabel,
      style: 'destructive',
      onPress: input.onConfirm,
    },
  ]);
}

export function createChatMessageRuntimeKillSwitchNativeConfirmPresenter(
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): (input: ChatMessageRuntimeKillSwitchNativeConfirmInput) => void {
  return (input) => showChatMessageRuntimeKillSwitchNativeConfirmAlert(input, showAlert);
}

type ChatMessageRuntimeToolApprovalResponseStateInput = {
  sessionId?: string | null;
};

type ChatMessageRuntimeToolApprovalResponseState = {
  pendingToolApprovalResponseId: string | null;
  beginToolApprovalResponse: (approvalId: string) => void;
  clearToolApprovalResponse: () => void;
};

type ChatMessageRuntimeToolApprovalResponseClient = {
  respondToToolApproval: (approvalId: string, approved: boolean) => Promise<{ success: boolean }>;
};

type ChatMessageRuntimeToolApprovalActionsStateInput<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
> = {
  approvalClient?: ChatMessageRuntimeToolApprovalResponseClient | null;
  beginToolApprovalResponse: (approvalId: string) => void;
  clearToolApprovalResponse: () => void;
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  showAlert: (title: string, message: string) => void;
};

type ChatMessageRuntimeToolApprovalChromeActionsStateInput<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
> = Omit<ChatMessageRuntimeToolApprovalActionsStateInput<TMessage>, 'showAlert'>;

type ChatMessageRuntimeToolApprovalActionsState = {
  respondToToolApproval: (approvalId: string, approved: boolean) => Promise<void>;
};

type ChatMessageRuntimeQueueMessage = {
  id: string;
};

type ChatMessageRuntimeQueueController<TQueuedMessage extends ChatMessageRuntimeQueueMessage> = {
  getQueue: (conversationId: string) => TQueuedMessage[];
  isQueuePaused: (conversationId: string) => boolean;
  peek: (conversationId: string) => TQueuedMessage | null;
  markProcessing: (conversationId: string, messageId: string) => boolean;
  pauseQueue: (conversationId: string) => void;
  resumeQueue: (conversationId: string) => void;
  removeFromQueue: (conversationId: string, messageId: string) => boolean;
  updateText: (conversationId: string, messageId: string, text: string) => boolean;
  resetToPending: (conversationId: string, messageId: string) => boolean;
  clearQueue: (conversationId: string) => void;
};

type ChatMessageRuntimeQueuePanelStateInput<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
> = {
  currentConversationId: string;
  queue: ChatMessageRuntimeQueueController<TQueuedMessage>;
  responding: boolean;
  handsFree: boolean;
  handsFreePhase: HandsFreePhase;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  processQueuedMessage: (queuedMessage: TQueuedMessage) => void | Promise<void>;
  processDelayMs?: number;
};

type ChatMessageRuntimeNextQueuedMessageSchedulerInput<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
> = {
  currentConversationId: string;
  queue: Pick<ChatMessageRuntimeQueueController<TQueuedMessage>, 'isQueuePaused' | 'peek' | 'markProcessing'>;
  canProcessQueue?: boolean;
  handsFree: boolean;
  handsFreePhase?: HandsFreePhase;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  processQueuedMessage: (queuedMessage: TQueuedMessage) => void | Promise<void>;
  processDelayMs?: number;
  log?: (message?: unknown, ...optionalParams: unknown[]) => void;
  logMessage?: string;
};

type ChatMessageRuntimeQueuePanelState<TQueuedMessage extends ChatMessageRuntimeQueueMessage> = {
  queuedMessages: TQueuedMessage[];
  isMessageQueuePaused: boolean;
  nextQueuedMessage: TQueuedMessage | null;
  handleProcessNextQueuedMessage: () => void;
  handlePauseMessageQueue: () => void;
  handleResumeMessageQueue: () => void;
  handleRemoveQueuedMessage: (messageId: string) => void;
  handleUpdateQueuedMessage: (messageId: string, text: string) => void;
  handleRetryQueuedMessage: (messageId: string) => void;
  handleClearQueuedMessages: () => void;
};

type ChatMessageRuntimeScrollControllerInput = {
  messages: readonly unknown[];
  sessionId?: string | null;
  visibleMessageCount: number;
  bottomResumeThresholdPx: number;
  topLoadThresholdPx: number;
  dragEndDebounceMs: number;
  onLoadEarlierMessages: () => void;
  autoScrollDelayMs?: number;
  sessionResetScrollDelayMs?: number;
};

type ChatMessageConversationRuntimeThreadListRenderStateInput =
  Omit<
    ChatMessageConversationThreadListRenderStateInput,
    'allMessages' | 'messages' | 'firstMessageIndex' | 'presentation' | 'resultOnlyToolLabel'
  >
  & {
    resultOnlyToolLabel?: ChatMessageConversationThreadListRenderStateInput['resultOnlyToolLabel'];
  }
  & ChatRuntimeMessageHistoryWindowMobileDisplayStateInput<
    ChatMessageConversationThreadListRenderStateInput['messages'][number]
  >;

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
  const actionIconButtonParts = createChatRuntimeMessageActionIconButtonMobilePropsParts({
    icon,
    onPress,
    disabled,
    isActive,
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
  });

  return (
    <ChatMessageActionIconButtonPressable
      {...actionIconButtonParts.pressable.props}
    >
      {actionIconButtonParts.activityIndicator.shouldRender ? (
        <ChatMessageActionIconButtonActivityIndicator
          {...actionIconButtonParts.activityIndicator.props}
        />
      ) : actionIconButtonParts.icon.shouldRender ? (
        <ChatMessageActionIconButtonIcon
          {...actionIconButtonParts.icon.props}
        />
      ) : null}
    </ChatMessageActionIconButtonPressable>
  );
}

export function ChatMessageActionIconButtonPressable({
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  'aria-expanded': ariaExpanded,
  hitSlop,
  style,
  children,
}: ChatMessageActionIconButtonPressableProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      aria-expanded={ariaExpanded}
      hitSlop={hitSlop}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export function ChatMessageActionIconButtonActivityIndicator({
  size,
  color,
}: ChatMessageActionIconButtonActivityIndicatorProps) {
  return (
    <ActivityIndicator
      size={size}
      color={color}
    />
  );
}

export function ChatMessageActionIconButtonIcon({
  name,
  size,
  color,
}: ChatMessageActionIconButtonIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

function renderChatMessageActionButton(spec: ChatMessageActionButtonSpec) {
  const actionButtonProps = createChatRuntimeMessageActionIconButtonMobileProps({
    spec,
  });

  return (
    <ChatMessageActionIconButton
      {...actionButtonProps}
    />
  );
}

export function useChatMessageRuntimeHistoryWindowState({
  messageCount,
  sessionId,
}: ChatMessageRuntimeHistoryWindowStateInput): ChatMessageRuntimeHistoryWindowState {
  const historyWindow = useMemo(() => getChatRuntimeMessageHistoryWindowMobileState(), []);
  const [visibleMessageCount, setVisibleMessageCount] = useState<number>(
    historyWindow.initialVisibleCount,
  );
  const loadEarlierMessages = useCallback(() => {
    setVisibleMessageCount((currentVisibleCount) =>
      getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount({
        currentVisibleCount,
        messageCount,
        loadIncrement: historyWindow.loadIncrement,
      }),
    );
  }, [historyWindow.loadIncrement, messageCount]);

  useEffect(() => {
    setVisibleMessageCount(historyWindow.initialVisibleCount);
  }, [historyWindow.initialVisibleCount, sessionId]);

  useEffect(() => {
    setVisibleMessageCount((currentVisibleCount) =>
      getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount({
        currentVisibleCount,
        messageCount,
        initialVisibleCount: historyWindow.initialVisibleCount,
      }),
    );
  }, [historyWindow.initialVisibleCount, messageCount]);

  return {
    ...historyWindow,
    visibleMessageCount,
    loadEarlierMessages,
  };
}

export function useChatMessageRuntimeScrollController({
  messages,
  sessionId,
  visibleMessageCount,
  bottomResumeThresholdPx,
  topLoadThresholdPx,
  dragEndDebounceMs,
  onLoadEarlierMessages,
  autoScrollDelayMs = 50,
  sessionResetScrollDelayMs = 100,
}: ChatMessageRuntimeScrollControllerInput) {
  const scrollRef = useRef<ChatMessageScrollViewportRef>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserDraggingRef = useRef(false);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    shouldAutoScrollRef.current = shouldAutoScroll;
    if (!shouldAutoScroll && scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [shouldAutoScroll]);

  const onScrollBeginDrag = useCallback(() => {
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
    isUserDraggingRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
    }
    dragEndTimeoutRef.current = setTimeout(() => {
      isUserDraggingRef.current = false;
      dragEndTimeoutRef.current = null;
    }, dragEndDebounceMs);
  }, [dragEndDebounceMs]);

  const onScroll = useCallback((event: ChatMessageScrollEvent) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = getChatRuntimeMessageHistoryWindowMobileIsAtBottom({
      viewportHeight: layoutMeasurement.height,
      scrollOffsetY: contentOffset.y,
      contentHeight: contentSize.height,
      bottomResumeThresholdPx,
    });
    const shouldLoadEarlier = getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier({
      scrollOffsetY: contentOffset.y,
      visibleMessageCount,
      messageCount: messages.length,
      topLoadThresholdPx,
    });

    if (isAtBottom && !shouldAutoScroll) {
      setShouldAutoScroll(true);
    } else if (!isAtBottom && shouldAutoScroll && isUserDraggingRef.current) {
      setShouldAutoScroll(false);
    }
    if (shouldLoadEarlier) {
      onLoadEarlierMessages();
    }
  }, [
    bottomResumeThresholdPx,
    messages.length,
    onLoadEarlierMessages,
    shouldAutoScroll,
    topLoadThresholdPx,
    visibleMessageCount,
  ]);

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (shouldAutoScrollRef.current && scrollRef.current) {
          scrollRef.current.scrollToEnd({ animated: true });
        }
      }, autoScrollDelayMs);
    }
  }, [autoScrollDelayMs, messages, shouldAutoScroll]);

  useEffect(() => {
    setShouldAutoScroll(true);
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, sessionResetScrollDelayMs);
    return () => clearTimeout(timeoutId);
  }, [sessionId, sessionResetScrollDelayMs]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setShouldAutoScroll(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  return {
    scrollRef,
    shouldAutoScroll,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    scrollToBottom,
  };
}

export function useChatComposerRuntimeImageAttachmentPickerState({
  pendingImages,
  setPendingImages,
  pickImages,
  showAlert,
  now = Date.now,
}: ChatComposerRuntimeImageAttachmentPickerStateInput): ChatComposerRuntimeImageAttachmentPickerState {
  const showImageAttachmentAlert = useCallback((input: ChatImageAttachmentMobileAlertInput) => {
    const alertState = getChatImageAttachmentMobileAlertState(input);
    showAlert(alertState.title, alertState.message);
  }, [showAlert]);

  const handlePickImages = useCallback(async () => {
    if (pendingImages.length >= CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages) {
      showImageAttachmentAlert({
        reason: 'limitReached',
        maxImages: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages,
      });
      return;
    }

    const existingEmbeddedBytes = pendingImages.reduce(
      (sum, image) => sum + getChatComposerRuntimeImageDataUrlBytes(image.dataUrl),
      0
    );
    if (existingEmbeddedBytes >= CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes) {
      showImageAttachmentAlert({
        reason: 'budgetReached',
        maxBytes: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes,
      });
      return;
    }

    try {
      const slotsRemaining = CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages - pendingImages.length;
      const result = await pickImages(slotsRemaining);

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const selectedAssets = result.assets.slice(0, slotsRemaining);
      const nextImages: ChatComposerRuntimeImageAttachment[] = [];
      const missingBase64Names: string[] = [];
      const oversizedImageNames: string[] = [];
      const unknownMimeNames: string[] = [];
      const budgetExceededNames: string[] = [];
      let runningEmbeddedBytes = existingEmbeddedBytes;

      selectedAssets.forEach((asset, index) => {
        const displayName = asset.fileName || `Image ${index + 1}`;
        if (!asset.base64) {
          missingBase64Names.push(displayName);
          return;
        }

        const inferredBytes = getChatComposerRuntimeBase64ImageBytes(asset.base64);
        const fileSizeBytes = typeof asset.fileSize === 'number' && asset.fileSize > 0
          ? asset.fileSize
          : inferredBytes;
        if (fileSizeBytes > CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxFileBytes) {
          oversizedImageNames.push(displayName);
          return;
        }

        const mimeType = inferChatComposerRuntimeImageMimeType(asset);
        if (!mimeType) {
          unknownMimeNames.push(displayName);
          return;
        }

        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        const embeddedBytes = getChatComposerRuntimeImageDataUrlBytes(dataUrl) || inferredBytes;
        if (runningEmbeddedBytes + embeddedBytes > CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes) {
          budgetExceededNames.push(displayName);
          return;
        }
        runningEmbeddedBytes += embeddedBytes;

        const timestamp = now();
        const fileName = asset.fileName || `image-${timestamp}-${index + 1}`;
        nextImages.push({
          id: `${timestamp}-${index}-${asset.uri}`,
          name: fileName,
          previewUri: asset.uri,
          dataUrl,
        });
      });

      if (nextImages.length > 0) {
        setPendingImages((prev) => [...prev, ...nextImages]);
      }

      if (missingBase64Names.length > 0) {
        showImageAttachmentAlert({
          reason: 'missingData',
          names: missingBase64Names,
        });
      }

      if (oversizedImageNames.length > 0) {
        showImageAttachmentAlert({
          reason: 'selectionTooLarge',
          names: oversizedImageNames,
          maxBytes: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxFileBytes,
        });
      }

      if (unknownMimeNames.length > 0) {
        showImageAttachmentAlert({
          reason: 'unsupportedFormat',
          names: unknownMimeNames,
        });
      }

      if (budgetExceededNames.length > 0) {
        showImageAttachmentAlert({
          reason: 'budgetExceeded',
          names: budgetExceededNames,
          maxBytes: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes,
        });
      }
    } catch (error: unknown) {
      showImageAttachmentAlert({
        reason: 'pickerError',
        error,
      });
    }
  }, [now, pendingImages, pickImages, setPendingImages, showImageAttachmentAlert]);

  return {
    handlePickImages,
  };
}

export function useChatComposerRuntimeImageLibraryPickerState(
  input: ChatComposerRuntimeImageLibraryPickerStateInput,
): ChatComposerRuntimeImageAttachmentPickerState {
  const pickComposerImages = useCallback(
    (selectionLimit: number) => ImagePicker.launchImageLibraryAsync(
      createChatComposerRuntimeImagePickerLaunchOptions({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        selectionLimit,
      })
    ),
    []
  );

  return useChatComposerRuntimeImageAttachmentPickerState({
    ...input,
    pickImages: pickComposerImages,
    showAlert: Alert.alert,
  });
}

export function useChatMessageRuntimeTurnDurations({
  messages,
  conversationState,
  isResponding = false,
}: ChatMessageRuntimeTurnDurationStateInput): ReturnType<typeof computeChatMessageRuntimeTurnDurations> {
  const hasLiveAgentTurn = hasChatMessageRuntimeLiveAgentTurn({
    conversationState,
    isResponding,
  });
  const [turnNow, setTurnNow] = useState(() => Date.now());
  useEffect(() => {
    setTurnNow(Date.now());
    if (!hasLiveAgentTurn) return undefined;
    const id = setInterval(() => setTurnNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasLiveAgentTurn]);

  const turnDurationMessages = useMemo(
    () => createChatMessageRuntimeTurnDurationMessages(messages),
    [messages],
  );

  return useMemo(
    () => computeChatMessageRuntimeTurnDurations(turnDurationMessages, !hasLiveAgentTurn, turnNow),
    [hasLiveAgentTurn, turnDurationMessages, turnNow],
  );
}

export function useChatMessageRuntimeRemoteSpeechSettingsState(
  initialSettings: ChatRuntimeRemoteSpeechSettingsState = getChatRuntimeDefaultRemoteSpeechSettingsState(),
): ChatMessageRuntimeRemoteSpeechSettingsHookState {
  const [remoteTtsProvider, setRemoteTtsProvider] =
    useState<ChatRuntimeRemoteSpeechProvider>(initialSettings.provider);
  const [remoteTtsVoice, setRemoteTtsVoice] = useState<string | undefined>(initialSettings.voice);
  const [remoteTtsModel, setRemoteTtsModel] = useState<string | undefined>(initialSettings.model);
  const [remoteTtsRate, setRemoteTtsRate] = useState(initialSettings.rate);

  const applyRemoteSpeechSettings = useCallback((settings: ChatRuntimeRemoteSpeechSettingsState) => {
    setRemoteTtsProvider(settings.provider);
    setRemoteTtsVoice(settings.voice);
    setRemoteTtsModel(settings.model);
    setRemoteTtsRate(settings.rate);
  }, []);

  return {
    remoteTtsProvider,
    setRemoteTtsProvider,
    remoteTtsVoice,
    setRemoteTtsVoice,
    remoteTtsModel,
    setRemoteTtsModel,
    remoteTtsRate,
    setRemoteTtsRate,
    applyRemoteSpeechSettings,
  };
}

type ChatMessageRuntimeThreadExpansionMessage =
  & ChatDisplayMessageLike
  & Parameters<typeof createChatMessageRuntimeToolActivityGroups>[0][number];

type ChatMessageRuntimeThreadExpansionStateInput<TMessage extends ChatMessageRuntimeThreadExpansionMessage> = {
  messages: TMessage[];
  isResponding: boolean;
};

export function useChatMessageRuntimeThreadExpansionState<TMessage extends ChatMessageRuntimeThreadExpansionMessage>({
  messages,
  isResponding,
}: ChatMessageRuntimeThreadExpansionStateInput<TMessage>) {
  const [expandedMessages, setExpandedMessages] = useState<ChatMessageRuntimeMessageExpansionState>({});
  const [expandedToolCalls, setExpandedToolCalls] = useState<ChatMessageRuntimeToolCallExpansionState>({});
  const [expandedGroups, setExpandedGroups] = useState<ChatMessageRuntimeToolActivityGroupExpansionState>({});
  const [expandedToolApprovals, setExpandedToolApprovals] = useState<ChatMessageRuntimeToolApprovalExpansionState>({});
  const [expandedDelegationConversationPreviews, setExpandedDelegationConversationPreviews] =
    useState<ChatRuntimeConversationDelegationExpansionState>({});
  const [expandedDelegationToolPreviews, setExpandedDelegationToolPreviews] =
    useState<ChatRuntimeConversationDelegationExpansionState>({});

  const resetThreadExpansionState = useCallback(() => {
    setExpandedMessages({});
    setExpandedToolCalls({});
    setExpandedGroups({});
    setExpandedToolApprovals({});
    setExpandedDelegationConversationPreviews({});
    setExpandedDelegationToolPreviews({});
  }, []);

  const toggleMessageExpansion = useCallback((index: number) => {
    setExpandedMessages((prev) => toggleChatMessageRuntimeMessageExpansionState(prev, index));
  }, []);

  const toggleToolCallExpansion = useCallback((messageId: string, toolCallIndex: number) => {
    setExpandedToolCalls((prev) =>
      toggleChatMessageRuntimeToolCallExpansionState(prev, messageId, toolCallIndex),
    );
  }, []);

  const toolActivityGroups = useMemo(
    () => createChatMessageRuntimeToolActivityGroups(messages),
    [messages],
  );

  const toggleGroupExpansion = useCallback((group: ChatMessageRuntimeToolActivityGroup) => {
    setExpandedGroups((prev) => toggleChatMessageRuntimeToolActivityGroupExpansionState(prev, group));
  }, []);

  useEffect(() => {
    setExpandedGroups((prev) => applyChatMessageRuntimeToolActivityGroupExpansionInheritance({
      groupState: prev,
      inheritedState: expandedMessages,
      groups: toolActivityGroups.groups,
    }));
  }, [expandedMessages, toolActivityGroups.groups]);

  const toggleToolApprovalArguments = useCallback((approvalId: string) => {
    setExpandedToolApprovals((prev) =>
      toggleChatMessageRuntimeToolApprovalExpansionState(prev, approvalId),
    );
  }, []);

  useEffect(() => {
    setExpandedMessages((prev) => applyChatMessageRuntimeAutoExpansionState(prev, messages, {
      isResponding,
    }));
  }, [isResponding, messages]);

  return {
    expandedMessages,
    expandedToolCalls,
    expandedGroups,
    expandedToolApprovals,
    expandedDelegationConversationPreviews,
    expandedDelegationToolPreviews,
    setExpandedDelegationConversationPreviews,
    setExpandedDelegationToolPreviews,
    toolActivityGroups,
    toggleMessageExpansion,
    toggleToolCallExpansion,
    toggleGroupExpansion,
    toggleToolApprovalArguments,
    resetThreadExpansionState,
  };
}

export function createChatMessageRuntimeChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  colors,
  platform,
  spinnerSource,
  styles,
  composer,
  dock,
  threadList,
  viewport,
  surface,
}: ChatMessageRuntimeChromePropsInput<TPrompt, TTask>): ChatMessageRuntimeSurfaceChromeProps<TPrompt, TTask> {
  const {
    messages: threadListMessages,
    visibleMessageCount: threadListVisibleMessageCount,
    ...threadListInput
  } = threadList;
  const conversationThreadListState = getChatRuntimeConversationRuntimeThreadListMobileState({
    messages: threadListMessages,
    visibleMessageCount: threadListVisibleMessageCount,
    ...threadListInput,
    colors,
    createThreadState: (itemState) => getChatRuntimeConversationItemThreadMobileStateFromBodyInput({
      ...threadListInput,
      ...itemState,
      colors,
      actionStyles: styles.actionStyles,
      spinnerSource,
    }),
  });
  const chatComposerRuntimeDockChrome =
    createChatComposerRuntimeDockMobileChromeProps<ChatComposerMicButtonProps['webPressedStyle']>({
      colors,
      platform,
    });
  const chatComposerRuntimeDock = createChatComposerRuntimeDockMobileProps({
    chrome: chatComposerRuntimeDockChrome,
    ...composer,
    pendingImagesColors: colors,
    composerControlColors: colors,
  });
  const chatMessageRuntimeViewport = createChatRuntimeViewportChromeMobileProps<
    TPrompt,
    PromptLibrarySkillLike & { id: string },
    TTask,
    ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>
  >({
    ...viewport,
    colors,
    loadingSpinnerSource: spinnerSource,
    visibleMessageCount: conversationThreadListState.visibleMessageCount,
    totalMessageCount: conversationThreadListState.totalMessageCount,
    hiddenMessageCount: conversationThreadListState.hiddenMessageCount,
  });
  const chatMessageRuntimeDock = createChatRuntimeDockChromeMobileProps({
    ...dock,
    speakNative: Speech.speak,
    stopNativeSpeech: Speech.stop,
    speakRemote: speakRemoteTts,
    stopRemoteSpeech: stopRemoteTts,
    colors,
    composer: chatComposerRuntimeDock,
  });

  return createChatRuntimeSurfaceChromeMobileProps({
    ...surface,
    platform,
    colors,
    promptEditorStyles: styles.promptEditorStyles,
    dock: chatMessageRuntimeDock,
    viewport: chatMessageRuntimeViewport,
    threadStates: conversationThreadListState.threadStates,
    threadStyles: styles.threadStyles,
  });
}

export function ChatMessageRuntimeChromeSurface<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  surfaceStyles,
  ...chromePropsInput
}: ChatMessageRuntimeChromeSurfaceProps<TPrompt, TTask>) {
  const chatMessageRuntimeSurface = createChatMessageRuntimeChromeProps<TPrompt, TTask>(chromePropsInput);

  return (
    <ChatMessageRuntimeSurface
      {...chatMessageRuntimeSurface}
      styles={surfaceStyles}
    />
  );
}

function createChatMessageActionRenderers({
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
}: Omit<ChatMessageActionComponentsInput, 'availability'>) {
  return {
    turnDuration: () => (
      <ChatMessageTurnDurationBadge
        renderState={turnDuration.renderState}
        style={turnDuration.style}
        liveStyle={turnDuration.liveStyle}
        textStyle={turnDuration.textStyle}
        liveTextStyle={turnDuration.liveTextStyle}
      />
    ),
    speech: () => renderChatMessageActionButton(speech),
    branch: () => renderChatMessageActionButton(branch),
    copy: () => renderChatMessageActionButton(copy),
    expansion: () => renderChatMessageActionButton(expansion),
  };
}

function createChatMessageActionComponents({
  availability,
  ...input
}: ChatMessageActionComponentsInput): ChatMessageActionComponentMap {
  return createChatMessageActionSlotRenderMap<ReactNode>(
    availability,
    createChatMessageActionRenderers(input),
  );
}

function createChatMessageActionSet({
  renderState: actionRenderState,
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
  ...input
}: ChatMessageActionSetInput): ChatMessageActionSet {
  const actionInput = createChatRuntimeConversationActionComponentsMobileProps({
    renderState: actionRenderState,
    ...input,
    turnDuration,
    speech,
    branch,
    copy,
    expansion,
  });
  const components = createChatMessageActionComponents({
    ...actionInput,
  });

  return createChatRuntimeConversationActionSetMobileProps({
    renderState: actionRenderState,
    components,
  });
}

export function useChatConversationHomePromptEditorSaveActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>({
  promptClient,
  predefinedPrompts,
  editingPrompt,
  promptName,
  promptContent,
  isSavingPrompt,
  setPredefinedPrompts,
  beginPromptEditorSave,
  clearPromptEditorSave,
  dismissPromptEditor,
  showAlert,
}: ChatConversationHomePromptEditorSaveActionsStateInput<TPromptEditorClient>): ChatConversationHomePromptEditorSaveActionsState {
  const handleSavePrompt = useCallback(async () => {
    const draft = { name: promptName, content: promptContent };
    const saveActionState = createChatConversationHomePromptEditorSaveActionState({
      draft,
      isEditing: Boolean(editingPrompt),
      isSaving: isSavingPrompt,
    });
    if (!promptClient || saveActionState.isDisabled) return;

    const wasEditingPrompt = Boolean(editingPrompt);
    beginPromptEditorSave();
    try {
      const now = Date.now();
      const updatedPrompts = editingPrompt
        ? updatePredefinedPromptList(predefinedPrompts, editingPrompt.id, draft, now)
        : [
          createPredefinedPromptRecord(draft, now),
          ...predefinedPrompts,
        ];

      await promptClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(sortPredefinedPromptsByUpdatedAt(updatedPrompts));
      dismissPromptEditor();
      const successAlert = getChatConversationHomePromptSaveSuccessAlertState(wasEditingPrompt);
      showAlert(successAlert.title, successAlert.message);
    } catch (error: any) {
      console.error('[ChatConversationHome] Error saving prompt:', error);
      const failedAlert = getChatConversationHomePromptSaveFailedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearPromptEditorSave();
    }
  }, [
    beginPromptEditorSave,
    clearPromptEditorSave,
    dismissPromptEditor,
    editingPrompt,
    isSavingPrompt,
    predefinedPrompts,
    promptClient,
    promptContent,
    promptName,
    setPredefinedPrompts,
    showAlert,
  ]);

  return {
    handleSavePrompt,
  };
}

export function useChatConversationHomePromptEditorSaveChromeActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>(
  input: ChatConversationHomePromptEditorSaveChromeActionsStateInput<TPromptEditorClient>,
): ChatConversationHomePromptEditorSaveActionsState {
  return useChatConversationHomePromptEditorSaveActionsState({
    ...input,
    showAlert: Alert.alert,
  });
}

export function useChatConversationHomePromptEditorDeleteActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>({
  promptClient,
  predefinedPrompts,
  setPredefinedPrompts,
  beginPromptEditorSave,
  clearPromptEditorSave,
  platform,
  confirmWeb,
  confirmNative,
  showAlert,
}: ChatConversationHomePromptEditorDeleteActionsStateInput<TPromptEditorClient>): ChatConversationHomePromptEditorDeleteActionsState {
  const handleDeletePrompt = useCallback((prompt: PredefinedPromptSummary) => {
    if (!promptClient) return;

    const deletePrompt = async () => {
      beginPromptEditorSave();
      try {
        const updatedPrompts = deletePredefinedPromptFromList(predefinedPrompts, prompt.id);
        await promptClient.updateSettings({ predefinedPrompts: updatedPrompts });
        setPredefinedPrompts(updatedPrompts);
      } catch (error: any) {
        console.error('[ChatConversationHome] Error deleting prompt:', error);
        const failedAlert = getChatConversationHomePromptDeleteFailedAlertState(error);
        showAlert(failedAlert.title, failedAlert.message);
      } finally {
        clearPromptEditorSave();
      }
    };

    const confirmAlert = getChatConversationHomePromptDeleteConfirmAlertState(prompt.name);
    if (platform === 'web') {
      if (confirmWeb(confirmAlert.webMessage)) {
        void deletePrompt();
      }
      return;
    }

    confirmNative({
      title: confirmAlert.title,
      message: confirmAlert.message,
      cancelLabel: confirmAlert.cancelLabel,
      deleteLabel: confirmAlert.deleteLabel,
      onConfirm: () => {
        void deletePrompt();
      },
    });
  }, [
    beginPromptEditorSave,
    clearPromptEditorSave,
    confirmNative,
    confirmWeb,
    platform,
    predefinedPrompts,
    promptClient,
    setPredefinedPrompts,
    showAlert,
  ]);

  return {
    handleDeletePrompt,
  };
}

export function useChatConversationHomePromptEditorDeleteChromeActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>(
  input: ChatConversationHomePromptEditorDeleteChromeActionsStateInput<TPromptEditorClient>,
): ChatConversationHomePromptEditorDeleteActionsState {
  return useChatConversationHomePromptEditorDeleteActionsState({
    ...input,
    confirmWeb: confirmChatRuntimeWebDialog,
    confirmNative: createChatConversationHomePromptDeleteNativeConfirmPresenter(Alert.alert),
    showAlert: Alert.alert,
  });
}

export function useChatConversationHomePromptTaskRunState(): ChatConversationHomePromptTaskRunState {
  const [runningPromptTaskId, setRunningPromptTaskId] = useState<string | null>(null);

  const beginPromptTaskRun = useCallback((taskId: string) => {
    setRunningPromptTaskId(taskId);
  }, []);

  const clearPromptTaskRun = useCallback(() => {
    setRunningPromptTaskId(null);
  }, []);

  return {
    runningPromptTaskId,
    canRunPromptTask: runningPromptTaskId === null,
    beginPromptTaskRun,
    clearPromptTaskRun,
  };
}

export function useChatConversationHomePromptTaskRunActionsState<
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
>({
  taskClient,
  canRunPromptTask,
  beginPromptTaskRun,
  clearPromptTaskRun,
  showAlert,
}: ChatConversationHomePromptTaskRunActionsStateInput<TTaskRunClient>): ChatConversationHomePromptTaskRunActionsState<TTask> {
  const handleRunPromptTask = useCallback(async (task: TTask) => {
    if (!taskClient || !canRunPromptTask) return;
    beginPromptTaskRun(task.id);
    try {
      await taskClient.runLoop(task.id);
      const taskStartedAlert = getChatConversationHomePromptTaskStartedAlertState(task.name);
      showAlert(taskStartedAlert.title, taskStartedAlert.message);
    } catch (error: any) {
      const failedAlert = getChatConversationHomePromptTaskRunFailedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearPromptTaskRun();
    }
  }, [
    beginPromptTaskRun,
    canRunPromptTask,
    clearPromptTaskRun,
    showAlert,
    taskClient,
  ]);

  return {
    handleRunPromptTask,
  };
}

export function useChatConversationHomePromptTaskRunChromeActionsState<
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
>(
  input: ChatConversationHomePromptTaskRunChromeActionsStateInput<TTaskRunClient>,
): ChatConversationHomePromptTaskRunActionsState<TTask> {
  return useChatConversationHomePromptTaskRunActionsState<TTask, TTaskRunClient>({
    ...input,
    showAlert: Alert.alert,
  });
}

export function useChatConversationHomeQuickStartCatalogState(): ChatConversationHomeQuickStartCatalogState {
  const [predefinedPrompts, setPredefinedPrompts] = useState<PredefinedPromptSummary[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Loop[]>([]);
  const [isLoadingQuickStartPrompts, setIsLoadingQuickStartPrompts] = useState(false);

  const beginQuickStartCatalogLoad = useCallback(() => {
    setIsLoadingQuickStartPrompts(true);
  }, []);

  const finishQuickStartCatalogLoad = useCallback(() => {
    setIsLoadingQuickStartPrompts(false);
  }, []);

  const clearQuickStartCatalog = useCallback(() => {
    setPredefinedPrompts([]);
    setAvailableSkills([]);
    setAvailableTasks([]);
    setIsLoadingQuickStartPrompts(false);
  }, []);

  return {
    predefinedPrompts,
    setPredefinedPrompts,
    availableSkills,
    setAvailableSkills,
    availableTasks,
    setAvailableTasks,
    isLoadingQuickStartPrompts,
    beginQuickStartCatalogLoad,
    finishQuickStartCatalogLoad,
    clearQuickStartCatalog,
  };
}

export function useChatConversationHomeQuickStartCatalogLoadState<
  TQuickStartCatalogClient extends ChatConversationHomeQuickStartCatalogClient,
>({
  quickStartClient,
  isFocused,
  catalog,
  applyRemoteSpeechSettings,
}: ChatConversationHomeQuickStartCatalogLoadStateInput<TQuickStartCatalogClient>): void {
  const {
    setPredefinedPrompts,
    setAvailableSkills,
    setAvailableTasks,
    beginQuickStartCatalogLoad,
    finishQuickStartCatalogLoad,
    clearQuickStartCatalog,
  } = catalog;

  useEffect(() => {
    if (!quickStartClient || !isFocused) {
      if (!quickStartClient) {
        clearQuickStartCatalog();
      }
      return;
    }

    let cancelled = false;
    beginQuickStartCatalogLoad();

    Promise.allSettled([
      quickStartClient.getSettings(),
      quickStartClient.getSkills(),
      quickStartClient.getLoops(),
    ] as const)
      .then(([settingsResult, skillsResult, loopsResult]) => {
        if (cancelled) return;

        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value;
          const nextPrompts = sortPredefinedPromptsByUpdatedAt(settings.predefinedPrompts || []);
          const remoteSpeechSettings = createChatRuntimeRemoteSpeechSettingsState(settings);
          setPredefinedPrompts(nextPrompts);
          applyRemoteSpeechSettings(remoteSpeechSettings);
        } else {
          setPredefinedPrompts([]);
        }

        setAvailableSkills(skillsResult.status === 'fulfilled' ? skillsResult.value.skills : []);
        setAvailableTasks(loopsResult.status === 'fulfilled' ? loopsResult.value.loops : []);
      })
      .finally(() => {
        if (cancelled) return;
        finishQuickStartCatalogLoad();
      });

    return () => {
      cancelled = true;
    };
  }, [
    applyRemoteSpeechSettings,
    beginQuickStartCatalogLoad,
    clearQuickStartCatalog,
    finishQuickStartCatalogLoad,
    isFocused,
    quickStartClient,
    setAvailableSkills,
    setAvailableTasks,
    setPredefinedPrompts,
  ]);
}

export function useChatConversationHomePromptEditorState(): ChatConversationHomePromptEditorState {
  const [promptEditorVisible, setPromptEditorVisible] = useState(false);
  const [promptEditorEditingPrompt, setPromptEditorEditingPrompt] = useState<PredefinedPromptSummary | null>(null);
  const [promptEditorNameValue, setPromptEditorNameValue] = useState('');
  const [promptEditorContentValue, setPromptEditorContentValue] = useState('');
  const [promptEditorIsSaving, setPromptEditorIsSaving] = useState(false);

  const dismissPromptEditor = useCallback(() => {
    setPromptEditorVisible(false);
    setPromptEditorEditingPrompt(null);
    setPromptEditorNameValue('');
    setPromptEditorContentValue('');
  }, []);

  const openAddPromptEditor = useCallback(() => {
    setPromptEditorEditingPrompt(null);
    setPromptEditorNameValue('');
    setPromptEditorContentValue('');
    setPromptEditorVisible(true);
  }, []);

  const openEditPromptEditor = useCallback((prompt: PredefinedPromptSummary) => {
    setPromptEditorEditingPrompt(prompt);
    setPromptEditorNameValue(prompt.name);
    setPromptEditorContentValue(prompt.content);
    setPromptEditorVisible(true);
  }, []);

  const closePromptEditor = useCallback(() => {
    if (promptEditorIsSaving) return;
    dismissPromptEditor();
  }, [dismissPromptEditor, promptEditorIsSaving]);

  const beginPromptEditorSave = useCallback(() => {
    setPromptEditorIsSaving(true);
  }, []);

  const clearPromptEditorSave = useCallback(() => {
    setPromptEditorIsSaving(false);
  }, []);

  return {
    promptEditorVisible,
    promptEditorEditingPrompt,
    promptEditorIsEditing: Boolean(promptEditorEditingPrompt),
    promptEditorNameValue,
    setPromptEditorNameValue,
    promptEditorContentValue,
    setPromptEditorContentValue,
    promptEditorIsSaving,
    openAddPromptEditor,
    openEditPromptEditor,
    closePromptEditor,
    dismissPromptEditor,
    beginPromptEditorSave,
    clearPromptEditorSave,
  };
}

export function useChatRuntimeAgentSelectorOverlayState(): ChatRuntimeAgentSelectorOverlayState {
  const [agentSelectorVisible, setAgentSelectorVisible] = useState(false);

  const openAgentSelector = useCallback(() => {
    setAgentSelectorVisible(true);
  }, []);

  const closeAgentSelector = useCallback(() => {
    setAgentSelectorVisible(false);
  }, []);

  return {
    agentSelectorVisible,
    openAgentSelector,
    closeAgentSelector,
  };
}

export function useChatComposerRuntimeDraftState(): ChatComposerRuntimeDraftState {
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<ChatComposerRuntimeImageAttachment[]>([]);
  const inputRef = useRef<ChatComposerTextEntryRef>(null);

  const clearComposerInput = useCallback(() => {
    setInput('');
  }, []);

  const clearPendingImages = useCallback(() => {
    setPendingImages([]);
  }, []);

  const clearComposerDraft = useCallback(() => {
    setInput('');
    setPendingImages([]);
  }, []);

  const focusComposerInput = useCallback(() => {
    inputRef.current?.focus?.();
  }, []);

  const mergeVoiceTextIntoComposer = useCallback((text: string) => {
    setInput((current) => mergeChatComposerRuntimeVoiceText(current, text));
  }, []);

  const removePendingImage = useCallback((attachmentId: string) => {
    setPendingImages((current) => current.filter((image) => image.id !== attachmentId));
  }, []);

  return {
    input,
    setInput,
    pendingImages,
    setPendingImages,
    inputRef,
    clearComposerInput,
    clearPendingImages,
    clearComposerDraft,
    focusComposerInput,
    mergeVoiceTextIntoComposer,
    removePendingImage,
  };
}

export function useChatComposerRuntimeSubmissionActionsState({
  input,
  pendingImages,
  currentConversationId,
  queue,
  send,
  clearComposerDraft,
  setDebugInfo,
}: ChatComposerRuntimeSubmissionActionsStateInput): ChatComposerRuntimeSubmissionActionsState {
  const draftMessageState = useMemo(
    () => getChatComposerRuntimeDraftMessageState({
      input,
      pendingImages,
    }),
    [input, pendingImages],
  );
  const composerHasContent = draftMessageState.hasContent;

  const sendComposerInput = useCallback(() => {
    const composedMessage = draftMessageState.content;
    if (!composedMessage.trim()) return;
    void send(composedMessage, { fromComposer: true });
  }, [draftMessageState.content, send]);

  const queueComposerInput = useCallback(() => {
    const composedMessage = draftMessageState.content;
    if (!composedMessage.trim()) return;

    queue.enqueue(currentConversationId, composedMessage, currentConversationId);
    clearComposerDraft();
    setDebugInfo(getChatComposerQueueMobileActionState().debugMessage);
  }, [clearComposerDraft, currentConversationId, draftMessageState.content, queue, setDebugInfo]);

  return {
    composerHasContent,
    sendComposerInput,
    queueComposerInput,
  };
}

export function useChatComposerRuntimeSubmissionChromeState({
  platform,
  onTextEntryChangeText,
  ...submissionInput
}: ChatComposerRuntimeSubmissionChromeStateInput): ChatComposerRuntimeSubmissionChromeState {
  const submissionActions = useChatComposerRuntimeSubmissionActionsState(submissionInput);
  const textEntrySubmissionState = useChatComposerRuntimeTextEntrySubmissionState({
    hasContent: submissionActions.composerHasContent,
    platform,
    onChangeText: onTextEntryChangeText,
    onSubmit: submissionActions.sendComposerInput,
  });

  return {
    ...submissionActions,
    textEntrySubmissionState,
  };
}

export function useChatComposerRuntimeTextEntrySubmissionState({
  hasContent,
  platform,
  onChangeText,
  onSubmit,
}: ChatComposerRuntimeTextEntrySubmissionStateInput): ChatComposerRuntimeTextEntrySubmissionState {
  const modifierKeysRef = useRef<ChatComposerTextEntryModifierKeys>({
    shift: false,
    ctrl: false,
    meta: false,
  });
  const modifierTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextChangeRef = useRef(false);

  const clearModifierTimeout = useCallback(() => {
    if (modifierTimeoutRef.current) {
      clearTimeout(modifierTimeoutRef.current);
      modifierTimeoutRef.current = null;
    }
  }, []);

  const resetModifierKeys = useCallback(() => {
    modifierKeysRef.current = { shift: false, ctrl: false, meta: false };
  }, []);

  useEffect(() => clearModifierTimeout, [clearModifierTimeout]);

  const handleTextEntryKeyPress = useCallback((event: ChatComposerTextEntryKeyPressEvent) => {
    const key = event.nativeEvent.key;

    if (platform === 'web') {
      const webEvent = event.nativeEvent as ChatComposerTextEntryWebKeyPressEvent;
      const isEnter = key === 'Enter';
      const hasModifier = Boolean(webEvent.shiftKey || webEvent.ctrlKey || webEvent.metaKey);

      if (isEnter && hasModifier) {
        event.preventDefault?.();
        webEvent.preventDefault?.();
        if (hasContent) {
          onSubmit();
        }
      }
      return;
    }

    const setModifierWithTimeout = (modifier: keyof ChatComposerTextEntryModifierKeys) => {
      modifierKeysRef.current[modifier] = true;
      clearModifierTimeout();
      modifierTimeoutRef.current = setTimeout(() => {
        resetModifierKeys();
      }, 500);
    };

    if (key === 'Shift') {
      setModifierWithTimeout('shift');
      return;
    }

    if (key === 'Control') {
      setModifierWithTimeout('ctrl');
      return;
    }

    if (key === 'Meta') {
      setModifierWithTimeout('meta');
      return;
    }

    if (key === 'Enter') {
      clearModifierTimeout();
      const hasModifier =
        modifierKeysRef.current.shift ||
        modifierKeysRef.current.ctrl ||
        modifierKeysRef.current.meta;

      if (hasModifier) {
        suppressNextChangeRef.current = true;
        if (hasContent) {
          onSubmit();
        }
      }
      resetModifierKeys();
      return;
    }

    clearModifierTimeout();
    resetModifierKeys();
  }, [clearModifierTimeout, hasContent, onSubmit, platform, resetModifierKeys]);

  const handleTextEntryChangeText = useCallback((text: string) => {
    if (suppressNextChangeRef.current) {
      suppressNextChangeRef.current = false;
      return;
    }
    onChangeText(text);
  }, [onChangeText]);

  return {
    onChangeText: handleTextEntryChangeText,
    onKeyPress: handleTextEntryKeyPress,
  };
}

export function useChatComposerRuntimeHandsFreeControlActionsState({
  handsFreeController,
  listening,
  wakePhrase,
  startRecording,
  stopRecognitionOnly,
  stopSpeech,
  setDebugInfo,
}: ChatComposerRuntimeHandsFreeControlActionsStateInput): ChatComposerRuntimeHandsFreeControlActionsState {
  const {
    pauseByUser,
    resumeByUser,
    sleepByUser,
    state,
    wakeByUser,
  } = handsFreeController;

  const wakeHandsFreeByUser = useCallback(() => {
    wakeByUser();
    if (!listening) {
      void startRecording();
    }
    setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('awake'));
  }, [listening, setDebugInfo, startRecording, wakeByUser]);

  const sleepHandsFreeByUser = useCallback(() => {
    sleepByUser();
    setDebugInfo(formatChatComposerRuntimeHandsFreeSleepingDebugMessage(wakePhrase));
  }, [setDebugInfo, sleepByUser, wakePhrase]);

  const resumeHandsFreeByUser = useCallback(() => {
    resumeByUser();
    if (!listening) {
      void startRecording();
    }
    setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('resumed'));
  }, [listening, resumeByUser, setDebugInfo, startRecording]);

  const pauseHandsFreeByUser = useCallback(() => {
    pauseByUser();
    stopSpeech();
    void stopRecognitionOnly();
    setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('paused'));
  }, [pauseByUser, setDebugInfo, stopRecognitionOnly, stopSpeech]);

  const handleHandsFreePrimaryControl = useCallback(() => {
    if (state.phase === 'sleeping') {
      wakeHandsFreeByUser();
      return;
    }
    if (state.phase === 'paused') {
      resumeHandsFreeByUser();
      return;
    }
    pauseHandsFreeByUser();
  }, [pauseHandsFreeByUser, resumeHandsFreeByUser, state.phase, wakeHandsFreeByUser]);

  return {
    wakeHandsFreeByUser,
    sleepHandsFreeByUser,
    resumeHandsFreeByUser,
    pauseHandsFreeByUser,
    handleHandsFreePrimaryControl,
  };
}

export function useChatComposerRuntimeHandsFreeControlChromeActionsState(
  input: ChatComposerRuntimeHandsFreeControlChromeActionsStateInput,
): ChatComposerRuntimeHandsFreeControlActionsState {
  return useChatComposerRuntimeHandsFreeControlActionsState({
    ...input,
    stopSpeech: Speech.stop,
  });
}

export function useChatComposerRuntimeHandsFreeRecognizerLifecycleState({
  handsFree,
  handsFreeRuntimeActive,
  listening,
  handsFreeController,
  startRecording,
  stopRecognitionOnly,
  setHandsFreePhaseRefValue,
  errorResetDelayMs = 2500,
}: ChatComposerRuntimeHandsFreeRecognizerLifecycleStateInput): void {
  useEffect(() => {
    setHandsFreePhaseRefValue(handsFreeController.state.phase);
  }, [handsFreeController.state.phase, setHandsFreePhaseRefValue]);

  useEffect(() => {
    if (!handsFree) {
      return;
    }
    if (!handsFreeRuntimeActive && listening) {
      void stopRecognitionOnly();
    }
  }, [handsFree, handsFreeRuntimeActive, listening, stopRecognitionOnly]);

  useEffect(() => {
    if (!handsFree) {
      return;
    }

    if (handsFreeController.state.phase === 'error') {
      const timer = setTimeout(() => {
        handsFreeController.resetError();
      }, errorResetDelayMs);
      return () => clearTimeout(timer);
    }

    if (handsFreeController.shouldKeepRecognizerActive && !listening) {
      void startRecording();
      return;
    }

    if (!handsFreeController.shouldKeepRecognizerActive && listening) {
      void stopRecognitionOnly();
    }
  }, [
    errorResetDelayMs,
    handsFree,
    handsFreeController.resetError,
    handsFreeController.shouldKeepRecognizerActive,
    handsFreeController.state.phase,
    listening,
    startRecording,
    stopRecognitionOnly,
  ]);
}

export function useChatComposerRuntimeVoiceDebugResetState({
  isVoiceDebugEnabled,
  clearVoiceDebug,
}: ChatComposerRuntimeVoiceDebugResetStateInput): void {
  useEffect(() => {
    if (!isVoiceDebugEnabled) {
      clearVoiceDebug();
    }
  }, [clearVoiceDebug, isVoiceDebugEnabled]);
}

export function useChatMessageRuntimeMessageState<TMessage>(): ChatMessageRuntimeMessageState<TMessage> {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const messagesRef = useRef<TMessage[]>(messages);
  const progressMessagesRef = useRef<TMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  return {
    messages,
    setMessages,
    messagesRef,
    progressMessagesRef,
  };
}

export function useChatMessageRuntimeSendRef(): ChatMessageRuntimeSendRefState {
  const sendRef = useRef<ChatMessageRuntimeSendCallback>(async () => {});

  const syncSendRef = useCallback((send: ChatMessageRuntimeSendCallback) => {
    sendRef.current = send;
  }, []);

  return {
    sendRef,
    syncSendRef,
  };
}

export function useChatMessageRuntimeSessionRefState({
  initialMessage,
}: ChatMessageRuntimeSessionRefStateInput): ChatMessageRuntimeSessionRefState {
  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const pendingLazyLoadSessionIdRef = useRef<string | null>(null);
  const skipNextPersistRef = useRef(false);
  const initialMessageRef = useRef<string | null>(initialMessage);
  const initialMessageSentRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const prevSessionIdRef = useRef<string | null>(null);
  const convoRef = useRef<string | undefined>(undefined);

  return {
    lastLoadedSessionIdRef,
    pendingLazyLoadSessionIdRef,
    skipNextPersistRef,
    initialMessageRef,
    initialMessageSentRef,
    prevMessagesLengthRef,
    prevSessionIdRef,
    convoRef,
  };
}

export function useChatMessageRuntimeInitialMessageState({
  routeInitialMessage,
  currentSessionId,
  initialMessageRef,
  initialMessageSentRef,
  sendRef,
  clearRouteInitialMessage,
  voiceLog,
  autoSendDelayMs = 300,
}: ChatMessageRuntimeInitialMessageStateInput): void {
  useEffect(() => {
    const nextInitial = routeInitialMessage;
    if (!nextInitial || typeof nextInitial !== 'string') return;
    initialMessageRef.current = nextInitial;
    initialMessageSentRef.current = false;
    voiceLog('state-transition', 'Route initial message received.', { initialMessage: nextInitial });
  }, [initialMessageRef, initialMessageSentRef, routeInitialMessage, voiceLog]);

  useEffect(() => {
    if (!initialMessageRef.current || initialMessageSentRef.current) return undefined;
    if (!currentSessionId) return undefined;
    initialMessageSentRef.current = true;
    const msg = initialMessageRef.current;
    initialMessageRef.current = null;
    try {
      clearRouteInitialMessage?.();
    } catch {}

    const timer = setTimeout(() => {
      void sendRef.current(msg);
    }, autoSendDelayMs);
    return () => clearTimeout(timer);
  }, [
    autoSendDelayMs,
    clearRouteInitialMessage,
    currentSessionId,
    initialMessageRef,
    initialMessageSentRef,
    sendRef,
  ]);
}

export function useChatMessageRuntimeSessionLoadState<
  TMessage extends ChatMessageRuntimeSessionLoadMessage,
  TClient,
>({
  currentSessionId,
  currentSessionIdRef,
  deletingSessionIdsSize,
  hasServerAuth,
  settingsClient,
  createLazyLoadClient,
  getCurrentSession,
  createNewSession,
  loadSessionMessages,
  setMessages,
  setLatestStepSummary,
  lastLoadedSessionIdRef,
  pendingLazyLoadSessionIdRef,
  skipNextPersistRef,
  resetThreadExpansionState,
  clearCopiedMessageFeedback,
  replaceResponseHistory,
  resetResponseSpeechPlaybackState,
  warn = console.warn,
}: ChatMessageRuntimeSessionLoadStateInput<TMessage, TClient>): void {
  useEffect(() => {
    let currentSession = getCurrentSession();
    const shouldAttemptStubLoad = !!(
      currentSession &&
      currentSession.messages.length === 0 &&
      currentSession.serverConversationId &&
      hasServerAuth
    );

    if (lastLoadedSessionIdRef.current === currentSessionId && !shouldAttemptStubLoad) {
      return;
    }

    const applySessionMessages = (
      sessionMessages: readonly TMessage[],
      options?: ChatMessageRuntimeSessionDisplayMessagesOptions,
    ) => {
      const chatMessages = createChatMessageRuntimeSessionDisplayMessages<TMessage>(
        sessionMessages,
        options,
      );
      setMessages(chatMessages);
      const responseEvents = createChatMessageRuntimeResponseHistoryEvents(chatMessages);
      replaceResponseHistory(responseEvents);
      resetResponseSpeechPlaybackState(responseEvents.map((event) => event.id));
    };

    const clearSessionMessages = () => {
      setMessages([]);
      replaceResponseHistory([]);
    };

    const isSessionSwitch = lastLoadedSessionIdRef.current !== currentSessionId;
    if (isSessionSwitch) {
      resetThreadExpansionState();
      clearCopiedMessageFeedback();
      setLatestStepSummary(null);
      replaceResponseHistory([]);
      resetResponseSpeechPlaybackState();
      pendingLazyLoadSessionIdRef.current = null;
      skipNextPersistRef.current = false;
    }

    if (currentSession) {
      lastLoadedSessionIdRef.current = currentSession.id;

      if (currentSession.messages.length > 0) {
        applySessionMessages(currentSession.messages);
      } else if (currentSession.serverConversationId && hasServerAuth) {
        clearSessionMessages();
        const stubSessionId = currentSession.id;
        if (pendingLazyLoadSessionIdRef.current === stubSessionId) {
          return;
        }
        pendingLazyLoadSessionIdRef.current = stubSessionId;
        const client = settingsClient ?? createLazyLoadClient();
        loadSessionMessages(stubSessionId, client)
          .then((result) => {
            if (!result) return;
            if (currentSessionIdRef.current !== stubSessionId) return;
            if (result.messages.length > 0) {
              skipNextPersistRef.current = true;
            }
            applySessionMessages(result.messages, { includeId: true });
          })
          .catch((err) => {
            warn('[ChatScreen] Failed to lazy-load session messages:', err);
          })
          .finally(() => {
            if (pendingLazyLoadSessionIdRef.current === stubSessionId) {
              pendingLazyLoadSessionIdRef.current = null;
            }
          });
      } else {
        clearSessionMessages();
      }
      return;
    }

    if (deletingSessionIdsSize > 0) {
      return;
    }

    currentSession = createNewSession();
    lastLoadedSessionIdRef.current = currentSession.id;

    if (currentSession.messages.length > 0) {
      applySessionMessages(currentSession.messages);
    } else {
      clearSessionMessages();
    }
  }, [
    clearCopiedMessageFeedback,
    createLazyLoadClient,
    createNewSession,
    currentSessionId,
    currentSessionIdRef,
    deletingSessionIdsSize,
    getCurrentSession,
    hasServerAuth,
    lastLoadedSessionIdRef,
    loadSessionMessages,
    pendingLazyLoadSessionIdRef,
    replaceResponseHistory,
    resetResponseSpeechPlaybackState,
    resetThreadExpansionState,
    setLatestStepSummary,
    setMessages,
    settingsClient,
    skipNextPersistRef,
    warn,
  ]);
}

export function useChatMessageRuntimeSessionPersistState<TMessage>({
  messages,
  currentSessionId,
  deletingSessionIds,
  prevSessionIdRef,
  prevMessagesLengthRef,
  skipNextPersistRef,
  persistMessages,
}: ChatMessageRuntimeSessionPersistStateInput<TMessage>): void {
  useEffect(() => {
    if (currentSessionId && deletingSessionIds.has(currentSessionId)) {
      return;
    }

    const isSessionSwitch = prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId;
    prevSessionIdRef.current = currentSessionId ?? null;

    if (isSessionSwitch) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > 0 && messages.length !== prevMessagesLengthRef.current) {
      if (skipNextPersistRef.current) {
        // Lazy-loaded messages are already saved by the session store.
        skipNextPersistRef.current = false;
      } else {
        void persistMessages(messages);
      }
    } else if (skipNextPersistRef.current) {
      // Clear stale lazy-load skips when the hydrated count did not change.
      skipNextPersistRef.current = false;
    }
    prevMessagesLengthRef.current = messages.length;
  }, [
    currentSessionId,
    deletingSessionIds,
    messages,
    persistMessages,
    prevMessagesLengthRef,
    prevSessionIdRef,
    skipNextPersistRef,
  ]);
}

export function useChatMessageRuntimeResponseHistoryState(): ChatMessageRuntimeResponseHistoryState {
  const [respondToUserHistory, setRespondToUserHistory] = useState<AgentUserResponseEvent[]>([]);
  const respondToUserHistoryRef = useRef<AgentUserResponseEvent[]>([]);
  const nextResponseEventOrdinalRef = useRef(1);
  const playedResponseEventIdsRef = useRef<Set<string>>(new Set());
  const queuedResponseEventsRef = useRef<AgentUserResponseEvent[]>([]);
  const activeAutoSpeechEventIdRef = useRef<string | null>(null);
  const recentAutoSpeechByTextRef = useRef<Map<string, number>>(new Map());

  const syncResponseHistoryRefs = useCallback((events: AgentUserResponseEvent[]) => {
    respondToUserHistoryRef.current = events;
    nextResponseEventOrdinalRef.current = getChatMessageRuntimeNextResponseEventOrdinal(events);
  }, []);

  const replaceResponseHistory = useCallback((events: AgentUserResponseEvent[]) => {
    const sortedEvents = sortChatMessageRuntimeResponseEvents(events);
    syncResponseHistoryRefs(sortedEvents);
    setRespondToUserHistory(sortedEvents);
  }, [syncResponseHistoryRefs]);

  const createFallbackResponseEvent = useCallback((
    sessionId: string | null | undefined,
    runId: number | undefined,
    text: string,
  ): AgentUserResponseEvent => {
    const ordinal = nextResponseEventOrdinalRef.current;
    nextResponseEventOrdinalRef.current = ordinal + 1;
    const timestamp = Date.now();

    return {
      id: `legacy-progress-${sessionId ?? 'session'}-${runId ?? 'run'}-${ordinal}-${timestamp}`,
      sessionId: sessionId ?? 'session',
      runId,
      ordinal,
      text,
      timestamp,
    };
  }, []);

  const mergeResponseEvents = useCallback((incomingEvents: AgentUserResponseEvent[]) => {
    if (!incomingEvents.length) return;
    const merged = new Map(respondToUserHistoryRef.current.map((event) => [event.id, event]));
    for (const event of incomingEvents) {
      merged.set(event.id, event);
    }

    const mergedEvents = sortChatMessageRuntimeResponseEvents(Array.from(merged.values()));
    syncResponseHistoryRefs(mergedEvents);
    setRespondToUserHistory(mergedEvents);
  }, [syncResponseHistoryRefs]);

  const clearQueuedResponseSpeech = useCallback(() => {
    queuedResponseEventsRef.current = [];
    activeAutoSpeechEventIdRef.current = null;
  }, []);

  const resetResponseSpeechPlaybackState = useCallback((playedEventIds: Iterable<string> = []) => {
    playedResponseEventIdsRef.current = new Set(playedEventIds);
    queuedResponseEventsRef.current = [];
    activeAutoSpeechEventIdRef.current = null;
  }, []);

  return {
    respondToUserHistory,
    playedResponseEventIdsRef,
    queuedResponseEventsRef,
    activeAutoSpeechEventIdRef,
    recentAutoSpeechByTextRef,
    replaceResponseHistory,
    createFallbackResponseEvent,
    mergeResponseEvents,
    clearQueuedResponseSpeech,
    resetResponseSpeechPlaybackState,
  };
}

export function useChatMessageRuntimeResponseSpeechQueueActionsState({
  isTextToSpeechEnabled,
  ttsEnabledRef,
  playedResponseEventIdsRef,
  queuedResponseEventsRef,
  activeAutoSpeechEventIdRef,
  speakAssistantResponse,
}: ChatMessageRuntimeResponseSpeechQueueActionsStateInput): ChatMessageRuntimeResponseSpeechQueueActionsState {
  const processResponseSpeechQueue = useCallback(() => {
    if (activeAutoSpeechEventIdRef.current || queuedResponseEventsRef.current.length === 0) {
      return;
    }

    const nextEvent = queuedResponseEventsRef.current.shift();
    if (!nextEvent) return;
    activeAutoSpeechEventIdRef.current = nextEvent.id;

    const spoken = speakAssistantResponse(nextEvent.text, `response event ${nextEvent.ordinal}`, () => {
      activeAutoSpeechEventIdRef.current = null;
      processResponseSpeechQueue();
    });

    if (!spoken) {
      activeAutoSpeechEventIdRef.current = null;
      processResponseSpeechQueue();
      return;
    }

    playedResponseEventIdsRef.current.add(nextEvent.id);
  }, [
    activeAutoSpeechEventIdRef,
    playedResponseEventIdsRef,
    queuedResponseEventsRef,
    speakAssistantResponse,
  ]);

  const enqueueResponseEventsForSpeech = useCallback((events: AgentUserResponseEvent[]) => {
    if (!isTextToSpeechEnabled || !ttsEnabledRef.current || !events.length) return;

    const queuedIds = new Set(queuedResponseEventsRef.current.map((event) => event.id));
    const activeId = activeAutoSpeechEventIdRef.current;
    const unseenEvents = events.filter((event) => (
      !playedResponseEventIdsRef.current.has(event.id)
      && !queuedIds.has(event.id)
      && event.id !== activeId
    ));

    if (!unseenEvents.length) return;

    queuedResponseEventsRef.current = sortChatMessageRuntimeResponseEvents([
      ...queuedResponseEventsRef.current,
      ...unseenEvents,
    ]);

    processResponseSpeechQueue();
  }, [
    activeAutoSpeechEventIdRef,
    isTextToSpeechEnabled,
    playedResponseEventIdsRef,
    processResponseSpeechQueue,
    queuedResponseEventsRef,
    ttsEnabledRef,
  ]);

  return {
    enqueueResponseEventsForSpeech,
    processResponseSpeechQueue,
  };
}

export function useChatMessageRuntimeAssistantSpeechActionsState({
  ttsEnabledRef,
  recentAutoSpeechByTextRef,
  config,
  effectiveTtsProvider,
  effectiveRemoteTtsVoice,
  effectiveRemoteTtsModel,
  effectiveRemoteTtsRate,
  handsFree,
  handsFreeController,
  speakNative,
  speakRemote,
  voiceLog,
  duplicateSuppressionMs = CHAT_RUNTIME_AUTO_TTS_DUPLICATE_SUPPRESSION_MS,
}: ChatMessageRuntimeAssistantSpeechActionsStateInput): ChatMessageRuntimeAssistantSpeechActionsState {
  const speakAssistantResponse = useCallback((content: string, reason: string, onSettled?: () => void) => {
    if (!ttsEnabledRef.current) {
      onSettled?.();
      return false;
    }

    const speechText = createChatRuntimeSpeechTextState(content);
    if (!speechText) {
      onSettled?.();
      return false;
    }

    const ttsTextKey = speechText.autoTextKey;
    const processedText = speechText.processedText;
    const now = Date.now();
    const lastSpokenAt = recentAutoSpeechByTextRef.current.get(ttsTextKey) ?? 0;
    if (now - lastSpokenAt < duplicateSuppressionMs) {
      onSettled?.();
      return false;
    }

    recentAutoSpeechByTextRef.current.set(ttsTextKey, now);
    for (const [key, spokenAt] of recentAutoSpeechByTextRef.current) {
      if (now - spokenAt > duplicateSuppressionMs) {
        recentAutoSpeechByTextRef.current.delete(key);
      }
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      onSettled?.();
      if (handsFree) {
        handsFreeController.onSpeechFinished();
        voiceLog('tts-stopped', `Assistant speech stopped (${reason}).`);
      }
    };

    if (handsFree) {
      handsFreeController.onSpeechStarted();
      voiceLog('tts-started', `Assistant speech started (${reason}).`);
    }

    if (effectiveTtsProvider !== 'native' && config.baseUrl && config.apiKey) {
      void speakRemote(processedText, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: effectiveTtsProvider,
        voice: effectiveRemoteTtsVoice ?? undefined,
        model: effectiveRemoteTtsModel ?? undefined,
        rate: effectiveRemoteTtsRate ?? undefined,
        onDone: settle,
        onError: settle,
        onStopped: settle,
      });
      return true;
    }

    const speechOptions: ChatMessageRuntimeNativeSpeechOptions = {
      language: 'en-US',
      rate: config.ttsRate ?? 1.0,
      pitch: config.ttsPitch ?? 1.0,
      onDone: settle,
      onError: settle,
      onStopped: settle,
    };
    if (config.ttsVoiceId) {
      speechOptions.voice = config.ttsVoiceId;
    }
    speakNative(processedText, speechOptions);
    return true;
  }, [
    config.apiKey,
    config.baseUrl,
    config.ttsPitch,
    config.ttsRate,
    config.ttsVoiceId,
    duplicateSuppressionMs,
    effectiveRemoteTtsModel,
    effectiveRemoteTtsRate,
    effectiveRemoteTtsVoice,
    effectiveTtsProvider,
    handsFree,
    handsFreeController,
    recentAutoSpeechByTextRef,
    speakNative,
    speakRemote,
    ttsEnabledRef,
    voiceLog,
  ]);

  return {
    speakAssistantResponse,
  };
}

export function useChatMessageRuntimeAssistantSpeechChromeActionsState(
  input: ChatMessageRuntimeAssistantSpeechChromeActionsStateInput,
): ChatMessageRuntimeAssistantSpeechActionsState {
  return useChatMessageRuntimeAssistantSpeechActionsState({
    ...input,
    speakNative: Speech.speak,
    speakRemote: speakRemoteTts,
  });
}

export function useChatMessageRuntimeSpeechPlaybackState(): ChatMessageRuntimeSpeechPlaybackState {
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const intendedSpeakingIndexRef = useRef<number | null>(null);

  const clearSpeakingMessage = useCallback(() => {
    setSpeakingMessageIndex(null);
  }, []);

  const clearIntendedSpeakingMessage = useCallback(() => {
    intendedSpeakingIndexRef.current = null;
  }, []);

  const setIntendedSpeakingMessage = useCallback((messageIndex: number) => {
    intendedSpeakingIndexRef.current = messageIndex;
  }, []);

  const startSpeakingMessage = useCallback((messageIndex: number) => {
    intendedSpeakingIndexRef.current = messageIndex;
    setSpeakingMessageIndex(messageIndex);
  }, []);

  return {
    speakingMessageIndex,
    setSpeakingMessageIndex,
    intendedSpeakingIndexRef,
    setIntendedSpeakingMessage,
    startSpeakingMessage,
    clearSpeakingMessage,
    clearIntendedSpeakingMessage,
  };
}

export function useChatMessageRuntimeSpeechActionsState({
  speakingMessageIndex,
  config,
  effectiveTtsProvider,
  effectiveRemoteTtsVoice,
  effectiveRemoteTtsModel,
  effectiveRemoteTtsRate,
  handsFree,
  handsFreeController,
  intendedSpeakingIndexRef,
  setIntendedSpeakingMessage,
  startSpeakingMessage,
  clearSpeakingMessage,
  clearIntendedSpeakingMessage,
  speakNative,
  stopNativeSpeech,
  speakRemote,
  stopRemoteSpeech,
  voiceLog,
}: ChatMessageRuntimeSpeechActionsStateInput): ChatMessageRuntimeSpeechActionsState {
  const finishHandsFreeSpeech = useCallback((message: string) => {
    if (!handsFree) return;
    handsFreeController.onSpeechFinished();
    voiceLog('tts-stopped', message);
  }, [handsFree, handsFreeController, voiceLog]);

  const clearFinishedSpeechMessage = useCallback((message: string) => {
    clearIntendedSpeakingMessage();
    finishHandsFreeSpeech(message);
    clearSpeakingMessage();
  }, [clearIntendedSpeakingMessage, clearSpeakingMessage, finishHandsFreeSpeech]);

  const clearStoppedSpeechMessage = useCallback(() => {
    if (intendedSpeakingIndexRef.current !== null) return;
    finishHandsFreeSpeech('Assistant speech stopped during message playback.');
    clearSpeakingMessage();
  }, [clearSpeakingMessage, finishHandsFreeSpeech, intendedSpeakingIndexRef]);

  const speakMessage = useCallback((messageIndex: number, content: string) => {
    if (speakingMessageIndex === messageIndex) {
      clearIntendedSpeakingMessage();
      stopNativeSpeech();
      finishHandsFreeSpeech('Assistant speech stopped from message playback.');
      clearSpeakingMessage();
      return;
    }

    setIntendedSpeakingMessage(messageIndex);
    stopNativeSpeech();
    stopRemoteSpeech();

    const speechText = createChatRuntimeSpeechTextState(content);
    if (!speechText) {
      clearIntendedSpeakingMessage();
      return;
    }

    if (handsFree) {
      handsFreeController.onSpeechStarted();
      voiceLog('tts-started', 'Assistant speech started from message playback.');
    }

    startSpeakingMessage(messageIndex);
    const processedText = speechText.processedText;
    if (effectiveTtsProvider !== 'native' && config.baseUrl && config.apiKey) {
      void speakRemote(processedText, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: effectiveTtsProvider,
        voice: effectiveRemoteTtsVoice ?? undefined,
        model: effectiveRemoteTtsModel ?? undefined,
        rate: effectiveRemoteTtsRate ?? undefined,
        onDone: () => clearFinishedSpeechMessage('Assistant speech finished from message playback.'),
        onError: () => clearFinishedSpeechMessage('Assistant speech errored during message playback.'),
        onStopped: clearStoppedSpeechMessage,
      });
      return;
    }

    const speechOptions: ChatMessageRuntimeNativeSpeechOptions = {
      language: 'en-US',
      rate: config.ttsRate ?? 1.0,
      pitch: config.ttsPitch ?? 1.0,
      onDone: () => clearFinishedSpeechMessage('Assistant speech finished from message playback.'),
      onError: () => clearFinishedSpeechMessage('Assistant speech errored during message playback.'),
      onStopped: clearStoppedSpeechMessage,
    };
    if (config.ttsVoiceId) {
      speechOptions.voice = config.ttsVoiceId;
    }
    speakNative(processedText, speechOptions);
  }, [
    clearFinishedSpeechMessage,
    clearIntendedSpeakingMessage,
    clearSpeakingMessage,
    clearStoppedSpeechMessage,
    config.apiKey,
    config.baseUrl,
    config.ttsPitch,
    config.ttsRate,
    config.ttsVoiceId,
    effectiveRemoteTtsModel,
    effectiveRemoteTtsRate,
    effectiveRemoteTtsVoice,
    effectiveTtsProvider,
    finishHandsFreeSpeech,
    handsFree,
    handsFreeController,
    setIntendedSpeakingMessage,
    speakNative,
    speakRemote,
    speakingMessageIndex,
    startSpeakingMessage,
    stopNativeSpeech,
    stopRemoteSpeech,
    voiceLog,
  ]);

  return {
    speakMessage,
  };
}

export function useChatMessageRuntimeSpeechChromeActionsState(
  input: ChatMessageRuntimeSpeechChromeActionsStateInput,
): ChatMessageRuntimeSpeechActionsState {
  return useChatMessageRuntimeSpeechActionsState({
    ...input,
    speakNative: Speech.speak,
    stopNativeSpeech: Speech.stop,
    speakRemote: speakRemoteTts,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatMessageRuntimeSpeechCleanupState({
  stopNativeSpeech,
  stopRemoteSpeech,
}: ChatMessageRuntimeSpeechCleanupStateInput): void {
  useEffect(() => {
    return () => {
      stopNativeSpeech();
      stopRemoteSpeech();
    };
  }, [stopNativeSpeech, stopRemoteSpeech]);
}

export function useChatMessageRuntimeSpeechChromeCleanupState(
  _input: ChatMessageRuntimeSpeechChromeCleanupStateInput = {},
): void {
  useChatMessageRuntimeSpeechCleanupState({
    stopNativeSpeech: Speech.stop,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatMessageRuntimeResponseHistoryPanelChromeState({
  responses,
  ttsProvider = 'native',
  edgeTtsVoice = DEFAULT_EDGE_TTS_VOICE,
  remoteTtsVoice,
  remoteTtsModel,
  ttsRate = 1.0,
  ttsPitch = 1.0,
  ttsVoiceId,
  remoteBaseUrl,
  remoteApiKey,
  speakNative,
  stopNativeSpeech,
  speakRemote,
  stopRemoteSpeech,
}: ChatMessageRuntimeResponseHistoryPanelChromeStateInput): ChatMessageRuntimeResponseHistoryPanelChromeState {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const isMountedRef = useRef(true);
  const speechRequestIdRef = useRef(0);
  const prevCountRef = useRef(responses.length);
  const shouldAnimateNewest = responses.length > prevCountRef.current;

  const nextSpeechRequestId = useCallback(() => {
    speechRequestIdRef.current += 1;
    return speechRequestIdRef.current;
  }, []);

  const safeSetSpeakingIndex = useCallback((index: number | null) => {
    if (isMountedRef.current) {
      setSpeakingIndex(index);
    }
  }, []);

  const stopCurrentSpeech = useCallback(() => {
    const requestId = nextSpeechRequestId();
    stopNativeSpeech();
    stopRemoteSpeech();
    return requestId;
  }, [nextSpeechRequestId, stopNativeSpeech, stopRemoteSpeech]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCurrentSpeech();
    };
  }, [stopCurrentSpeech]);

  useEffect(() => {
    if (isCollapsed && speakingIndex !== null) {
      stopCurrentSpeech();
      safeSetSpeakingIndex(null);
    }
  }, [isCollapsed, safeSetSpeakingIndex, speakingIndex, stopCurrentSpeech]);

  useEffect(() => {
    prevCountRef.current = responses.length;
  }, [responses.length]);

  const onToggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => !current);
  }, []);

  const onSpeakResponse = useCallback((text: string, index: number) => {
    if (speakingIndex === index) {
      stopCurrentSpeech();
      safeSetSpeakingIndex(null);
      return;
    }

    const requestId = stopCurrentSpeech();
    const speechText = createChatRuntimeSpeechTextState(text);
    if (!speechText) {
      safeSetSpeakingIndex(null);
      return;
    }
    const processedText = speechText.processedText;

    const clearIfCurrentRequest = () => {
      if (speechRequestIdRef.current === requestId) {
        safeSetSpeakingIndex(null);
      }
    };

    safeSetSpeakingIndex(index);
    if (ttsProvider !== 'native' && remoteBaseUrl && remoteApiKey) {
      void speakRemote(processedText, {
        baseUrl: remoteBaseUrl,
        apiKey: remoteApiKey,
        providerId: ttsProvider,
        voice: remoteTtsVoice ?? edgeTtsVoice,
        model: remoteTtsModel ?? undefined,
        rate: ttsRate ?? undefined,
        onDone: clearIfCurrentRequest,
        onStopped: clearIfCurrentRequest,
        onError: clearIfCurrentRequest,
      });
      return;
    }

    const speechOptions: ChatMessageRuntimeNativeSpeechOptions = {
      language: 'en-US',
      rate: ttsRate ?? 1.0,
      pitch: ttsPitch ?? 1.0,
      onDone: clearIfCurrentRequest,
      onStopped: clearIfCurrentRequest,
      onError: clearIfCurrentRequest,
    };
    if (ttsVoiceId) {
      speechOptions.voice = ttsVoiceId;
    }
    speakNative(processedText, speechOptions);
  }, [
    edgeTtsVoice,
    remoteApiKey,
    remoteBaseUrl,
    remoteTtsModel,
    remoteTtsVoice,
    safeSetSpeakingIndex,
    speakNative,
    speakRemote,
    speakingIndex,
    stopCurrentSpeech,
    ttsPitch,
    ttsProvider,
    ttsRate,
    ttsVoiceId,
  ]);

  return {
    isCollapsed,
    shouldAnimateNewest,
    speakingIndex,
    onToggleCollapsed,
    onSpeakResponse,
  };
}

export function useChatMessageRuntimeQueuePanelDockChromeState({
  conversationId,
}: ChatMessageRuntimeQueuePanelDockChromeStateInput): ChatMessageRuntimeQueuePanelDockChromeState {
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  useEffect(() => {
    setIsListCollapsed(false);
  }, [conversationId]);

  const onToggleListCollapsed = useCallback(() => {
    setIsListCollapsed((current) => !current);
  }, []);

  return {
    isListCollapsed,
    onToggleListCollapsed,
  };
}

export function useChatComposerRuntimeEditBeforeSendState(): ChatComposerRuntimeEditBeforeSendState {
  const [editBeforeSendEnabled, setEditBeforeSendEnabled] = useState(false);

  const toggleEditBeforeSend = useCallback(() => {
    setEditBeforeSendEnabled((current) => !current);
  }, []);

  return {
    editBeforeSendEnabled,
    toggleEditBeforeSend,
  };
}

export function useChatRuntimeStatusState(): ChatRuntimeStatusState {
  const [responding, setResponding] = useState(false);
  const [conversationState, setConversationState] = useState<AgentConversationState | null>(null);
  const [latestStepSummary, setLatestStepSummary] = useState<AgentStepSummary | null>(null);
  const [connectionState, setConnectionState] = useState<RecoveryState | null>(null);

  return {
    responding,
    setResponding,
    conversationState,
    setConversationState,
    latestStepSummary,
    setLatestStepSummary,
    connectionState,
    setConnectionState,
  };
}

export function useChatRuntimeRequestDebugState(): ChatRuntimeRequestDebugState {
  const [requestDebugText, setRequestDebugText] = useState('');

  const clearRequestDebugText = useCallback(() => {
    setRequestDebugText('');
  }, []);

  return {
    requestDebugText,
    setRequestDebugText,
    clearRequestDebugText,
  };
}

export function useChatRuntimeRequestTrackingState({
  currentSessionId,
}: ChatRuntimeRequestTrackingStateInput): ChatRuntimeRequestTrackingState {
  const activeRequestIdRef = useRef<number>(0);
  const currentSessionIdRef = useRef<string | null>(currentSessionId);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  return {
    activeRequestIdRef,
    currentSessionIdRef,
  };
}

export function useChatRuntimeConnectionStatusSubscription({
  currentSessionId,
  connectionManager,
  currentSessionIdRef,
  setConnectionState,
  setResponding,
  setConversationState,
  setLatestStepSummary,
  logConnectionStatus,
}: ChatRuntimeConnectionStatusSubscriptionInput): void {
  useEffect(() => {
    if (!currentSessionId) {
      setConnectionState(null);
      setResponding(false);
      setConversationState(null);
      setLatestStepSummary(null);
      return;
    }

    const existingState = connectionManager.getConnectionState(currentSessionId);
    setConnectionState(existingState ?? null);

    const isActive = connectionManager.isConnectionActive(currentSessionId);
    setResponding(isActive);
    setConversationState(isActive ? 'running' : null);

    connectionManager.getOrCreateConnection(currentSessionId);

    return connectionManager.subscribeToConnectionStatus(currentSessionId, (state) => {
      if (currentSessionIdRef.current !== currentSessionId) return;
      setConnectionState(state);
      logConnectionStatus?.(formatConnectionStatus(state));
    });
  }, [
    connectionManager,
    currentSessionId,
    currentSessionIdRef,
    logConnectionStatus,
    setConnectionState,
    setConversationState,
    setLatestStepSummary,
    setResponding,
  ]);
}

export function useChatRuntimeForegroundState({
  handsFree,
  isFocused,
}: ChatRuntimeForegroundStateInput): ChatRuntimeForegroundState {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => subscription.remove();
  }, []);

  const isAppActive = appState === 'active';

  return {
    appState,
    isAppActive,
    handsFreeRuntimeActive: handsFree && isFocused && isAppActive,
  };
}

export function useChatRuntimeHandsFreeMutableState({
  handsFree,
  ttsEnabled,
}: ChatRuntimeHandsFreeMutableStateInput): ChatRuntimeHandsFreeMutableState {
  const handsFreeRef = useRef<boolean>(handsFree);
  const handsFreePhaseRef = useRef<HandsFreePhase>('sleeping');
  const ttsEnabledRef = useRef<boolean>(ttsEnabled);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  const setHandsFreeRefValue = useCallback((value: boolean) => {
    handsFreeRef.current = value;
  }, []);

  const setHandsFreePhaseRefValue = useCallback((phase: HandsFreePhase) => {
    handsFreePhaseRef.current = phase;
  }, []);

  return {
    handsFreeRef,
    handsFreePhaseRef,
    ttsEnabledRef,
    setHandsFreeRefValue,
    setHandsFreePhaseRefValue,
  };
}

export function useChatRuntimeHandsFreeToggleActionsState<TConfig extends object>({
  config,
  setConfig,
  saveConfig,
  handsFreeController,
  handsFreeRef,
  setHandsFreeRefValue,
  stopRecognitionOnly,
  stopSpeech,
  stopRemoteSpeech,
  setDebugInfo,
}: ChatRuntimeHandsFreeToggleActionsStateInput<TConfig>): ChatRuntimeHandsFreeToggleActionsState {
  const toggleHandsFree = useCallback(async () => {
    const next = !handsFreeRef.current;
    setHandsFreeRefValue(next);
    const nextConfig = { ...config, handsFree: next };
    setConfig(nextConfig);
    try { await saveConfig(nextConfig); } catch {}
    if (!next) {
      handsFreeController.reset();
      void stopRecognitionOnly();
      stopSpeech();
      stopRemoteSpeech();
      setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('disabled'));
    } else {
      setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('enabled'));
    }
  }, [
    config,
    handsFreeController,
    handsFreeRef,
    saveConfig,
    setConfig,
    setDebugInfo,
    setHandsFreeRefValue,
    stopRecognitionOnly,
    stopRemoteSpeech,
    stopSpeech,
  ]);

  return {
    toggleHandsFree,
  };
}

export function useChatRuntimeHandsFreeToggleChromeActionsState<TConfig extends object>(
  input: ChatRuntimeHandsFreeToggleChromeActionsStateInput<TConfig>,
): ChatRuntimeHandsFreeToggleActionsState {
  return useChatRuntimeHandsFreeToggleActionsState({
    ...input,
    stopSpeech: Speech.stop,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatRuntimeTextToSpeechToggleActionsState<TConfig extends object>({
  ttsEnabled,
  config,
  setConfig,
  saveConfig,
  handsFreeController,
  handsFreeRef,
  handsFreePhaseRef,
  clearIntendedSpeakingMessage,
  clearQueuedResponseSpeech,
  clearSpeakingMessage,
  stopSpeech,
  stopRemoteSpeech,
  voiceLog,
}: ChatRuntimeTextToSpeechToggleActionsStateInput<TConfig>): ChatRuntimeTextToSpeechToggleActionsState {
  const toggleTextToSpeech = useCallback(async () => {
    const next = !ttsEnabled;
    if (!next) {
      clearIntendedSpeakingMessage();
      stopSpeech();
      stopRemoteSpeech();
      clearQueuedResponseSpeech();
      clearSpeakingMessage();
      if (handsFreeRef.current && handsFreePhaseRef.current === 'speaking') {
        handsFreeController.onSpeechFinished();
        voiceLog('tts-stopped', 'Assistant speech stopped from speaker toggle.');
      }
    }
    const nextConfig = { ...config, ttsEnabled: next };
    setConfig(nextConfig);
    try { await saveConfig(nextConfig); } catch {}
  }, [
    clearIntendedSpeakingMessage,
    clearQueuedResponseSpeech,
    clearSpeakingMessage,
    config,
    handsFreeController,
    handsFreePhaseRef,
    handsFreeRef,
    saveConfig,
    setConfig,
    stopRemoteSpeech,
    stopSpeech,
    ttsEnabled,
    voiceLog,
  ]);

  return {
    toggleTextToSpeech,
  };
}

export function useChatRuntimeTextToSpeechToggleChromeActionsState<TConfig extends object>(
  input: ChatRuntimeTextToSpeechToggleChromeActionsStateInput<TConfig>,
): ChatRuntimeTextToSpeechToggleActionsState {
  return useChatRuntimeTextToSpeechToggleActionsState({
    ...input,
    stopSpeech: Speech.stop,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatRuntimeConnectionRetryState(): ChatRuntimeConnectionRetryState {
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const clearLastFailedMessage = useCallback(() => {
    setLastFailedMessage(null);
  }, []);

  return {
    lastFailedMessage,
    setLastFailedMessage,
    clearLastFailedMessage,
  };
}

export function useChatRuntimeConnectionRetryActionState<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
>({
  lastFailedMessage,
  clearLastFailedMessage,
  getSessionClient,
  sessionStore,
  setMessages,
  send,
  retryDelayMs = 0,
}: ChatRuntimeConnectionRetryActionStateInput<TMessage, TToolCall, TToolResult>): ChatRuntimeConnectionRetryActionState {
  const handleRetryLastFailedMessage = useCallback(async () => {
    const messageToRetry = lastFailedMessage;
    if (!messageToRetry) return;
    clearLastFailedMessage();

    const retryClient = getSessionClient();
    const recoveryConversationId = retryClient?.getRecoveryConversationId();

    if (recoveryConversationId && retryClient) {
      console.log('[ChatRuntime] Retry: Checking server conversation state:', recoveryConversationId);
      try {
        const serverConversation = await retryClient.getConversation(recoveryConversationId);
        if (serverConversation && serverConversation.messages.length > 0) {
          const serverMessages = serverConversation.messages;
          const recoveredMessages = createChatMessageRuntimeRecoverableHistoryMessages<
            TMessage,
            TToolCall,
            TToolResult
          >(serverMessages);

          if (recoveredMessages) {
            console.log('[ChatRuntime] Retry: Server already has response, syncing state');

            await sessionStore.setServerConversationId(recoveryConversationId);

            setMessages(recoveredMessages);
            await sessionStore.setMessages(recoveredMessages);

            console.log('[ChatRuntime] Retry: Successfully recovered', recoveredMessages.length, 'messages from server');
            return;
          }
        }
      } catch (error) {
        console.log('[ChatRuntime] Retry: Could not fetch server state, will retry message:', error);
      }

      console.log('[ChatRuntime] Retry: Using recovery conversationId:', recoveryConversationId);
      await sessionStore.setServerConversationId(recoveryConversationId);
    }

    setMessages((messages) => removeChatMessageRuntimePendingTurnMessages(messages));
    // Let React commit the message removal before send() reads current state.
    setTimeout(() => {
      void send(messageToRetry);
    }, retryDelayMs);
  }, [
    clearLastFailedMessage,
    getSessionClient,
    lastFailedMessage,
    retryDelayMs,
    send,
    sessionStore,
    setMessages,
  ]);

  const handleRetryLastFailedMessagePress = useCallback(() => {
    void handleRetryLastFailedMessage();
  }, [handleRetryLastFailedMessage]);

  return {
    handleRetryLastFailedMessage,
    handleRetryLastFailedMessagePress,
  };
}

export function useChatMessageRuntimeBranchProgressState({
  sessionId,
}: ChatMessageRuntimeBranchProgressStateInput = {}): ChatMessageRuntimeBranchProgressState {
  const [pendingBranchMessageIndex, setPendingBranchMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    setPendingBranchMessageIndex(null);
  }, [sessionId]);

  const beginBranchMessage = useCallback((messageIndex: number) => {
    setPendingBranchMessageIndex(messageIndex);
  }, []);

  const clearBranchMessage = useCallback(() => {
    setPendingBranchMessageIndex(null);
  }, []);

  return {
    pendingBranchMessageIndex,
    beginBranchMessage,
    clearBranchMessage,
  };
}

export function useChatMessageRuntimeBranchActionsState<
  TBranchClient extends ChatMessageRuntimeBranchClient,
>({
  branchClient,
  serverConversationId,
  sessionStore,
  beginBranchMessage,
  clearBranchMessage,
  navigateToChat,
  showAlert,
}: ChatMessageRuntimeBranchActionsStateInput<TBranchClient>): ChatMessageRuntimeBranchActionsState {
  const handleBranchFromMessage = useCallback(async (messageIndex: number) => {
    if (!branchClient || !serverConversationId) {
      const unavailableAlert = getChatRuntimeBranchUnavailableMobileResolvedAlertState();
      showAlert(unavailableAlert.title, unavailableAlert.message);
      return;
    }

    beginBranchMessage(messageIndex);
    try {
      const branchedConversation = await branchClient.branchConversation(serverConversationId, { messageIndex });
      await sessionStore.syncWithServer(branchClient);
      const branchedSession = sessionStore.findSessionByServerConversationId(branchedConversation.id);
      if (branchedSession) {
        sessionStore.setCurrentSession(branchedSession.id);
        navigateToChat();
        return;
      }

      const createdAlert = getChatRuntimeBranchCreatedMobileResolvedAlertState();
      showAlert(createdAlert.title, createdAlert.message);
    } catch (error: any) {
      const failedAlert = getChatRuntimeBranchFailedMobileResolvedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearBranchMessage();
    }
  }, [
    beginBranchMessage,
    branchClient,
    clearBranchMessage,
    navigateToChat,
    serverConversationId,
    sessionStore,
    showAlert,
  ]);

  const handleBranchFromMessagePress = useCallback((messageIndex: number) => {
    void handleBranchFromMessage(messageIndex);
  }, [handleBranchFromMessage]);

  return {
    handleBranchFromMessage,
    handleBranchFromMessagePress,
  };
}

export function useChatMessageRuntimeBranchChromeActionsState<
  TBranchClient extends ChatMessageRuntimeBranchClient,
>(
  input: ChatMessageRuntimeBranchChromeActionsStateInput<TBranchClient>,
): ChatMessageRuntimeBranchActionsState {
  return useChatMessageRuntimeBranchActionsState({
    ...input,
    showAlert: Alert.alert,
  });
}

export function useChatRuntimeCurrentSessionPinActionsState({
  sessionStore,
}: ChatRuntimeCurrentSessionPinActionsStateInput): ChatRuntimeCurrentSessionPinActionsState {
  const handleToggleCurrentSessionPinned = useCallback(() => {
    const currentSessionId = sessionStore.currentSessionId;
    if (!currentSessionId) return;
    void sessionStore.toggleSessionPinned(currentSessionId);
  }, [sessionStore]);

  return {
    handleToggleCurrentSessionPinned,
  };
}

export function useChatRuntimeBackToSessionsActionsState({
  navigation,
}: ChatRuntimeBackToSessionsActionsStateInput): ChatRuntimeBackToSessionsActionsState {
  const handleBackToSessions = useCallback(() => {
    navigation.navigate('Sessions');
  }, [navigation]);

  return {
    handleBackToSessions,
  };
}

export function useChatRuntimeNavigateToChatActionsState({
  navigation,
}: ChatRuntimeNavigateToChatActionsStateInput): ChatRuntimeNavigateToChatActionsState {
  const navigateToChat = useCallback(() => {
    navigation.navigate('Chat');
  }, [navigation]);

  return {
    navigateToChat,
  };
}

export function useChatMessageRuntimeKillSwitchActionsState<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
>({
  platform,
  getKillSwitchClient,
  confirmWeb,
  showWebAlert,
  confirmNative,
  showAlert,
}: ChatMessageRuntimeKillSwitchActionsStateInput<TKillSwitchClient>): ChatMessageRuntimeKillSwitchActionsState {
  const handleKillSwitch = useCallback(async () => {
    console.log('[ChatMessageRuntime] Kill switch button pressed');
    const client = getKillSwitchClient();
    if (!client) {
      console.error('[ChatMessageRuntime] No client available for kill switch');
      return;
    }

    const runKillSwitch = async () => {
      try {
        const result = await client.killSwitch();
        const resultAlert = getChatRuntimeKillSwitchResultMobileResolvedAlertState(result);
        if (platform === 'web') {
          showWebAlert(resultAlert.webMessage);
          return;
        }
        showAlert(resultAlert.title, resultAlert.message);
      } catch (error: any) {
        console.error('[ChatMessageRuntime] Kill switch error:', error);
        const failedAlert = getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState(error);
        if (platform === 'web') {
          showWebAlert(failedAlert.webMessage);
          return;
        }
        showAlert(failedAlert.title, failedAlert.message);
      }
    };

    const confirmationAlert = getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState();
    if (platform === 'web') {
      if (confirmWeb(confirmationAlert.webMessage)) {
        await runKillSwitch();
      }
      return;
    }

    confirmNative({
      title: confirmationAlert.title,
      message: confirmationAlert.message,
      cancelLabel: confirmationAlert.cancelLabel,
      confirmLabel: confirmationAlert.confirmLabel,
      onConfirm: () => {
        void runKillSwitch();
      },
    });
  }, [
    confirmNative,
    confirmWeb,
    getKillSwitchClient,
    platform,
    showAlert,
    showWebAlert,
  ]);

  return {
    handleKillSwitch,
  };
}

export function useChatMessageRuntimeKillSwitchChromeActionsState<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
>(
  input: ChatMessageRuntimeKillSwitchChromeActionsStateInput<TKillSwitchClient>,
): ChatMessageRuntimeKillSwitchActionsState {
  return useChatMessageRuntimeKillSwitchActionsState({
    ...input,
    confirmWeb: confirmChatRuntimeWebDialog,
    showWebAlert: showChatRuntimeWebAlert,
    confirmNative: createChatMessageRuntimeKillSwitchNativeConfirmPresenter(Alert.alert),
    showAlert: Alert.alert,
  });
}

export function useChatMessageRuntimeToolApprovalResponseState({
  sessionId,
}: ChatMessageRuntimeToolApprovalResponseStateInput = {}): ChatMessageRuntimeToolApprovalResponseState {
  const [pendingToolApprovalResponseId, setPendingToolApprovalResponseId] = useState<string | null>(null);

  useEffect(() => {
    setPendingToolApprovalResponseId(null);
  }, [sessionId]);

  const beginToolApprovalResponse = useCallback((approvalId: string) => {
    setPendingToolApprovalResponseId(approvalId);
  }, []);

  const clearToolApprovalResponse = useCallback(() => {
    setPendingToolApprovalResponseId(null);
  }, []);

  return {
    pendingToolApprovalResponseId,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
  };
}

export function useChatMessageRuntimeToolApprovalActionsState<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
>({
  approvalClient,
  beginToolApprovalResponse,
  clearToolApprovalResponse,
  setMessages,
  showAlert,
}: ChatMessageRuntimeToolApprovalActionsStateInput<TMessage>): ChatMessageRuntimeToolApprovalActionsState {
  const respondToToolApproval = useCallback(async (approvalId: string, approved: boolean) => {
    if (!approvalClient) {
      const connectionRequiredAlert = getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState();
      showAlert(connectionRequiredAlert.title, connectionRequiredAlert.message);
      return;
    }

    beginToolApprovalResponse(approvalId);
    try {
      const response = await approvalClient.respondToToolApproval(approvalId, approved);
      setMessages((current) => removeChatMessageRuntimeToolApprovalMessage(current, approvalId));
      if (!response.success) {
        const unavailableAlert = getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState();
        showAlert(unavailableAlert.title, unavailableAlert.message);
      }
    } catch (error: unknown) {
      const failedAlert = getChatRuntimeToolApprovalFailedMobileResolvedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearToolApprovalResponse();
    }
  }, [
    approvalClient,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
    setMessages,
    showAlert,
  ]);

  return {
    respondToToolApproval,
  };
}

export function useChatMessageRuntimeToolApprovalChromeActionsState<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
>(
  input: ChatMessageRuntimeToolApprovalChromeActionsStateInput<TMessage>,
): ChatMessageRuntimeToolApprovalActionsState {
  return useChatMessageRuntimeToolApprovalActionsState({
    ...input,
    showAlert: Alert.alert,
  });
}

export function scheduleChatMessageRuntimeNextQueuedMessage<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
>({
  currentConversationId,
  queue,
  canProcessQueue = true,
  handsFree,
  handsFreePhase,
  handsFreeRef,
  handsFreePhaseRef,
  processQueuedMessage,
  processDelayMs = 100,
  log = console.log,
  logMessage = '[ChatMessageRuntime] Processing next queued message:',
}: ChatMessageRuntimeNextQueuedMessageSchedulerInput<TQueuedMessage>): void {
  if (!canProcessQueue) return;
  if (queue.isQueuePaused(currentConversationId)) return;

  const nextMessage = queue.peek(currentConversationId);
  if (!nextMessage) return;

  if (handsFree && (handsFreePhase ?? handsFreePhaseRef.current) === 'paused') return;

  log(logMessage, nextMessage.id);
  setTimeout(() => {
    if (queue.isQueuePaused(currentConversationId)) {
      return;
    }
    if (handsFreeRef.current && handsFreePhaseRef.current === 'paused') {
      return;
    }
    queue.markProcessing(currentConversationId, nextMessage.id);
    void processQueuedMessage(nextMessage);
  }, processDelayMs);
}

export function useChatMessageRuntimeQueuePanelState<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
>({
  currentConversationId,
  queue,
  responding,
  handsFree,
  handsFreePhase,
  handsFreeRef,
  handsFreePhaseRef,
  processQueuedMessage,
  processDelayMs = 100,
}: ChatMessageRuntimeQueuePanelStateInput<TQueuedMessage>): ChatMessageRuntimeQueuePanelState<TQueuedMessage> {
  const queuedMessages = queue.getQueue(currentConversationId);
  const isMessageQueuePaused = queue.isQueuePaused(currentConversationId);
  const nextQueuedMessage = !responding && !isMessageQueuePaused ? queue.peek(currentConversationId) : null;

  const handleProcessNextQueuedMessage = useCallback(() => {
    scheduleChatMessageRuntimeNextQueuedMessage({
      currentConversationId,
      queue,
      canProcessQueue: !responding,
      handsFree,
      handsFreePhase,
      handsFreeRef,
      handsFreePhaseRef,
      processQueuedMessage,
      processDelayMs,
      logMessage: '[ChatMessageRuntime] Processing queue while idle, next message:',
    });
  }, [
    currentConversationId,
    handsFree,
    handsFreePhase,
    handsFreePhaseRef,
    handsFreeRef,
    processDelayMs,
    processQueuedMessage,
    queue,
    responding,
  ]);

  const handlePauseMessageQueue = useCallback(() => {
    queue.pauseQueue(currentConversationId);
  }, [currentConversationId, queue]);

  const handleResumeMessageQueue = useCallback(() => {
    queue.resumeQueue(currentConversationId);
    if (!responding) {
      setTimeout(() => {
        handleProcessNextQueuedMessage();
      }, 0);
    }
  }, [currentConversationId, handleProcessNextQueuedMessage, queue, responding]);

  const handleRemoveQueuedMessage = useCallback((messageId: string) => {
    queue.removeFromQueue(currentConversationId, messageId);
  }, [currentConversationId, queue]);

  const handleUpdateQueuedMessage = useCallback((messageId: string, text: string) => {
    queue.updateText(currentConversationId, messageId, text);
  }, [currentConversationId, queue]);

  const handleRetryQueuedMessage = useCallback((messageId: string) => {
    queue.resetToPending(currentConversationId, messageId);
    if (!responding) {
      handleProcessNextQueuedMessage();
    }
  }, [currentConversationId, handleProcessNextQueuedMessage, queue, responding]);

  const handleClearQueuedMessages = useCallback(() => {
    queue.clearQueue(currentConversationId);
  }, [currentConversationId, queue]);

  return {
    queuedMessages,
    isMessageQueuePaused,
    nextQueuedMessage,
    handleProcessNextQueuedMessage,
    handlePauseMessageQueue,
    handleResumeMessageQueue,
    handleRemoveQueuedMessage,
    handleUpdateQueuedMessage,
    handleRetryQueuedMessage,
    handleClearQueuedMessages,
  };
}

export function useChatMessageCopyFeedbackState(
  feedbackResetDelayMs: number = getChatMessageCopyFeedbackResetDelayMs(),
) {
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const copiedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current);
      }
    };
  }, []);

  const clearCopiedMessageFeedback = useCallback(() => {
    if (copiedMessageTimeoutRef.current) {
      clearTimeout(copiedMessageTimeoutRef.current);
      copiedMessageTimeoutRef.current = null;
    }
    setCopiedMessageIndex(null);
  }, []);

  const showCopiedMessageFeedback = useCallback((messageIndex: number) => {
    setCopiedMessageIndex(messageIndex);
    if (copiedMessageTimeoutRef.current) {
      clearTimeout(copiedMessageTimeoutRef.current);
    }
    copiedMessageTimeoutRef.current = setTimeout(() => {
      setCopiedMessageIndex((current) => (current === messageIndex ? null : current));
    }, feedbackResetDelayMs);
  }, [feedbackResetDelayMs]);

  return {
    copiedMessageIndex,
    clearCopiedMessageFeedback,
    showCopiedMessageFeedback,
  };
}

export function useChatMessageRuntimeClipboardActionsState({
  copyText,
  showAlert,
  showCopiedMessageFeedback,
}: ChatMessageRuntimeClipboardActionsStateInput): ChatMessageRuntimeClipboardActionsState {
  const handleCopyMessage = useCallback(async (messageIndex: number, content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await copyText(copyContent);
      showCopiedMessageFeedback(messageIndex);
    } catch (error) {
      const failedAlert = getChatMessageCopyFailureAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    }
  }, [copyText, showAlert, showCopiedMessageFeedback]);

  const handleCopyToolPayload = useCallback(async (content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await copyText(copyContent);
    } catch (error) {
      const failedAlert = getChatMessageToolExecutionCopyFailureResolvedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    }
  }, [copyText, showAlert]);

  return {
    handleCopyMessage,
    handleCopyToolPayload,
  };
}

export function useChatMessageRuntimeClipboardChromeActionsState(
  input: ChatMessageRuntimeClipboardChromeActionsStateInput,
): ChatMessageRuntimeClipboardActionsState {
  return useChatMessageRuntimeClipboardActionsState({
    ...input,
    copyText: Clipboard.setStringAsync,
    showAlert: Alert.alert,
  });
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
  const headerOptionParts = createChatRuntimeNavigationHeaderOptionsParts({
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
  });
  const headerParts = createChatRuntimeNavigationHeaderOptionsMobilePropsParts({
    ...headerOptionParts,
    styles,
  });

  return {
    headerTitle: () => (
      <ChatRuntimeHeaderAgentSelector
        {...headerParts.agentSelector}
      />
    ),
    headerLeft: () => (
      <ChatRuntimeHeaderActionsRow {...headerParts.actionsRow}>
        <ChatRuntimeHeaderIconButton
          {...headerParts.backButton}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.pinButton}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
    headerRight: () => (
      <ChatRuntimeHeaderActionsRow {...headerParts.actionsRow}>
        <ChatRuntimeHeaderConversationStatus
          {...headerParts.conversationStatus}
        />
        <ChatRuntimeHeaderTurnDuration
          {...headerParts.turnDuration}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.killSwitchButton}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.handsFreeButton}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
  };
}

export function useChatRuntimeNavigationHeaderOptions({
  navigation,
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
}: ChatRuntimeNavigationHeaderOptionsEffectInput): void {
  useLayoutEffect(() => {
    navigation?.setOptions?.(createChatRuntimeNavigationHeaderOptions({
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
    }));
  }, [
    agentSelectorLabelNumberOfLines,
    agentSelectorRenderState,
    backButtonRenderState,
    conversationStatusRenderState,
    conversationStatusSpinnerSource,
    handsFreeButtonRenderState,
    killSwitchButtonRenderState,
    killSwitchButtonShouldRender,
    navigation,
    onAgentSelectorPress,
    onBackButtonPress,
    onHandsFreeButtonPress,
    onKillSwitchButtonPress,
    onPinButtonPress,
    pinButtonIsActive,
    pinButtonRenderState,
    styles,
    turnDurationRenderState,
  ]);
}

export function useChatRuntimeNavigationHeaderChromeOptions({
  navigation,
  colors,
  spinnerSource,
  agentName,
  isPinned = false,
  handsFree = false,
  conversationState = null,
  isResponding = false,
  turnDurationMs = null,
  turnDurationIsLive = false,
  onAgentSelectorPress,
  onBackButtonPress,
  onPinButtonPress,
  onKillSwitchButtonPress,
  onHandsFreeButtonPress,
  styles,
}: ChatRuntimeNavigationHeaderChromeOptionsInput): void {
  const headerRenderState = useMemo(
    () => getChatRuntimeNavigationHeaderMobileRenderState({
      agentName,
      isPinned,
      handsFree,
      conversationState,
      isResponding,
      turnDurationMs,
      turnDurationIsLive,
      colors,
    }),
    [
      agentName,
      isPinned,
      handsFree,
      conversationState,
      isResponding,
      turnDurationMs,
      turnDurationIsLive,
      colors,
    ],
  );

  useChatRuntimeNavigationHeaderOptions({
    navigation,
    ...headerRenderState,
    onAgentSelectorPress,
    onBackButtonPress,
    onPinButtonPress,
    conversationStatusSpinnerSource: spinnerSource,
    onKillSwitchButtonPress,
    onHandsFreeButtonPress,
    styles,
  });
}

export function ChatRuntimeHeaderAgentSelector({
  renderState,
  onPress,
  labelNumberOfLines,
  styles,
}: ChatRuntimeHeaderAgentSelectorProps) {
  const agentSelectorParts = createChatRuntimeHeaderAgentSelectorMobilePropsParts({
    renderState,
    onPress,
    labelNumberOfLines,
    styles,
  });

  return (
    <ChatRuntimeHeaderAgentSelectorTouchable
      {...agentSelectorParts.touchable.props}
    >
      <ChatRuntimeHeaderAgentSelectorChip
        {...agentSelectorParts.chip.props}
      >
        <ChatRuntimeHeaderAgentSelectorLabel
          {...agentSelectorParts.label.props}
        />
        <ChatRuntimeHeaderAgentSelectorIcon
          {...agentSelectorParts.icon.props}
        />
      </ChatRuntimeHeaderAgentSelectorChip>
    </ChatRuntimeHeaderAgentSelectorTouchable>
  );
}

export function ChatRuntimeHeaderAgentSelectorTouchable({
  style,
  onPress,
  activeOpacity,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  children,
}: ChatRuntimeHeaderAgentSelectorTouchableProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderAgentSelectorChip({
  style,
  children,
}: ChatRuntimeHeaderAgentSelectorChipProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderAgentSelectorLabel({
  style,
  numberOfLines,
  text,
}: ChatRuntimeHeaderAgentSelectorLabelProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatRuntimeHeaderAgentSelectorIcon({
  name,
  size,
  color,
}: ChatRuntimeHeaderAgentSelectorIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
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
  const iconButtonParts = createChatRuntimeHeaderIconButtonMobilePropsParts({
    shouldRender,
    renderState,
    onPress,
    style,
    activeStyle,
    iconContainerStyle,
    isActive,
  });

  if (!iconButtonParts.shouldRender) return null;

  const icon = (
    <ChatRuntimeHeaderIconButtonIcon
      {...iconButtonParts.icon.props}
    />
  );

  return (
    <ChatRuntimeHeaderIconButtonTouchable
      {...iconButtonParts.touchable.props}
    >
      {iconButtonParts.iconContainer.shouldRender ? (
        <ChatRuntimeHeaderIconButtonIconContainer
          {...iconButtonParts.iconContainer.props}
        >
          {icon}
        </ChatRuntimeHeaderIconButtonIconContainer>
      ) : (
        icon
      )}
    </ChatRuntimeHeaderIconButtonTouchable>
  );
}

export function ChatRuntimeHeaderIconButtonTouchable({
  onPress,
  activeOpacity,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  'aria-checked': ariaChecked,
  style,
  children,
}: ChatRuntimeHeaderIconButtonTouchableProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState as AccessibilityState | undefined}
      aria-checked={ariaChecked as boolean | 'mixed' | undefined}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderIconButtonIconContainer({
  style,
  children,
}: ChatRuntimeHeaderIconButtonIconContainerProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderIconButtonIcon({
  name,
  size,
  color,
}: ChatRuntimeHeaderIconButtonIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatRuntimeHeaderConversationStatus({
  renderState,
  spinnerSource,
  styles,
}: ChatRuntimeHeaderConversationStatusProps) {
  const conversationStatusParts = createChatRuntimeHeaderConversationStatusMobilePropsParts({
    renderState,
    spinnerSource,
    styles,
  });

  if (!conversationStatusParts.shouldRender) return null;

  return (
    <ChatRuntimeHeaderConversationStatusContainer
      {...conversationStatusParts.container.props}
    >
      {conversationStatusParts.runningIndicator.shouldRender ? (
        <ChatRuntimeHeaderConversationStatusRunningIndicator
          {...conversationStatusParts.runningIndicator.props}
        />
      ) : null}
      <ChatRuntimeHeaderConversationStatusLabel
        {...conversationStatusParts.label.props}
      />
    </ChatRuntimeHeaderConversationStatusContainer>
  );
}

export function ChatRuntimeHeaderConversationStatusContainer({
  style,
  children,
}: ChatRuntimeHeaderConversationStatusContainerProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderConversationStatusRunningIndicator({
  source,
  style,
  resizeMode,
}: ChatRuntimeHeaderConversationStatusRunningIndicatorProps) {
  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
    />
  );
}

export function ChatRuntimeHeaderConversationStatusLabel({
  style,
  text,
}: ChatRuntimeHeaderConversationStatusLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatRuntimeHeaderTurnDuration({
  renderState,
  styles,
}: ChatRuntimeHeaderTurnDurationProps) {
  const turnDurationParts = createChatRuntimeHeaderTurnDurationMobilePropsParts({
    renderState,
    styles,
  });

  if (!turnDurationParts.shouldRender) return null;

  return (
    <ChatRuntimeHeaderTurnDurationContainer
      {...turnDurationParts.container.props}
    >
      <ChatRuntimeHeaderTurnDurationIcon
        {...turnDurationParts.icon.props}
      />
      <ChatRuntimeHeaderTurnDurationLabel
        {...turnDurationParts.label.props}
      />
    </ChatRuntimeHeaderTurnDurationContainer>
  );
}

export function ChatRuntimeHeaderTurnDurationContainer({
  accessible,
  accessibilityRole,
  accessibilityLabel,
  style,
  children,
}: ChatRuntimeHeaderTurnDurationContainerProps) {
  return (
    <View
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderTurnDurationIcon({
  name,
  size,
  color,
}: ChatRuntimeHeaderTurnDurationIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatRuntimeHeaderTurnDurationLabel({
  style,
  numberOfLines,
  text,
}: ChatRuntimeHeaderTurnDurationLabelProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
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
  const quickStartsParts = createChatRuntimeHomeQuickStartsMobilePropsParts<
    TPrompt,
    TTask,
    GestureResponderEvent,
    ChatConversationHomeQuickStartsStyles
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
  });

  if (!quickStartsParts.shouldRender) return null;

  return (
    <View style={quickStartsParts.container.style}>
      {quickStartsParts.grid.shouldRender ? (
        <View style={quickStartsParts.grid.style}>
          {quickStartsParts.grid.items.map((item) => {
            const actions = item.actions;

            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => item.pressable.getStyle(pressed)}
                onPress={item.pressable.onPress}
                disabled={item.pressable.disabled}
                accessibilityRole={item.pressable.accessibilityRole}
                accessibilityState={item.pressable.accessibilityState}
                accessibilityLabel={item.pressable.accessibilityLabel}
                accessibilityHint={item.pressable.accessibilityHint}
              >
                {item.sourcePill.shouldRender ? (
                  <View style={item.sourcePill.style}>
                    <Ionicons
                      name={item.sourcePill.icon.name}
                      size={item.sourcePill.icon.size}
                      color={item.sourcePill.iconColors.color}
                    />
                    <Text
                      style={item.sourcePill.label.style}
                      numberOfLines={item.sourcePill.label.numberOfLines}
                    >
                      {item.sourcePill.label.text}
                    </Text>
                  </View>
                ) : item.addIcon.shouldRender ? (
                  <Ionicons
                    name={item.addIcon.icon.name}
                    size={item.addIcon.icon.size}
                    color={item.addIcon.iconColors.color}
                    style={item.addIcon.style}
                  />
                ) : null}
                <Text
                  style={item.title.style}
                  numberOfLines={item.title.numberOfLines}
                >
                  {item.title.text}
                </Text>
                {item.description.shouldRender ? (
                  <Text
                    style={item.description.style}
                    numberOfLines={item.description.numberOfLines}
                  >
                    {item.description.text}
                  </Text>
                ) : null}
                {actions.shouldRender ? (
                  <View style={actions.style}>
                    <Pressable
                      style={({ pressed }) => actions.edit.pressable.getStyle(pressed)}
                      onPress={actions.edit.pressable.onPress}
                      accessibilityRole={actions.edit.pressable.accessibilityRole}
                      accessibilityLabel={actions.edit.pressable.accessibilityLabel}
                    >
                      <Ionicons
                        name={actions.edit.icon.name}
                        size={actions.edit.icon.size}
                        color={actions.edit.iconColors.color}
                      />
                      <Text style={actions.edit.label.style}>{actions.edit.label.text}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => actions.delete.pressable.getStyle(pressed)}
                      onPress={actions.delete.pressable.onPress}
                      accessibilityRole={actions.delete.pressable.accessibilityRole}
                      accessibilityLabel={actions.delete.pressable.accessibilityLabel}
                    >
                      <Ionicons
                        name={actions.delete.icon.name}
                        size={actions.delete.icon.size}
                        color={actions.delete.iconColors.color}
                      />
                      <Text style={actions.delete.label.style}>{actions.delete.label.text}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : quickStartsParts.emptyState.shouldRender ? (
        <Text style={quickStartsParts.emptyState.style}>
          {quickStartsParts.emptyState.text}
        </Text>
      ) : null}
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
  const modalParts = createChatConversationHomePromptEditorModalMobilePropsParts({
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
  });

  return (
    <Modal
      visible={modalParts.modal.visible}
      transparent={modalParts.modal.transparent}
      animationType={modalParts.modal.animationType}
      onRequestClose={modalParts.modal.onRequestClose}
    >
      <KeyboardAvoidingView
        style={modalParts.keyboardAvoidingView.style}
        behavior={modalParts.keyboardAvoidingView.behavior}
      >
        <View style={modalParts.overlay.style}>
          <View style={modalParts.content.style}>
            <View style={modalParts.header.style}>
              <Text style={modalParts.title.style}>{modalParts.title.text}</Text>
              <TouchableOpacity
                style={modalParts.closeButton.style}
                onPress={modalParts.closeButton.onPress}
                disabled={modalParts.closeButton.disabled}
                activeOpacity={modalParts.closeButton.activeOpacity}
                accessibilityRole={modalParts.closeButton.accessibilityRole}
                accessibilityLabel={modalParts.closeButton.accessibilityLabel}
                accessibilityState={modalParts.closeButton.accessibilityState}
              >
                <Ionicons
                  name={modalParts.closeIcon.name}
                  size={modalParts.closeIcon.size}
                  color={modalParts.closeIcon.color}
                />
              </TouchableOpacity>
            </View>

            <Text style={modalParts.nameLabel.style}>{modalParts.nameLabel.text}</Text>
            <TextInput
              style={modalParts.nameInput.style}
              value={modalParts.nameInput.value}
              onChangeText={modalParts.nameInput.onChangeText}
              accessibilityLabel={modalParts.nameInput.accessibilityLabel}
              placeholder={modalParts.nameInput.placeholder}
              placeholderTextColor={modalParts.nameInput.placeholderTextColor}
            />

            <Text style={modalParts.contentLabel.style}>{modalParts.contentLabel.text}</Text>
            <TextInput
              style={modalParts.contentInput.style}
              value={modalParts.contentInput.value}
              onChangeText={modalParts.contentInput.onChangeText}
              accessibilityLabel={modalParts.contentInput.accessibilityLabel}
              placeholder={modalParts.contentInput.placeholder}
              placeholderTextColor={modalParts.contentInput.placeholderTextColor}
              multiline={modalParts.contentInput.multiline}
              textAlignVertical={modalParts.contentInput.textAlignVertical}
            />

            <View style={modalParts.actions.style}>
              <TouchableOpacity
                style={modalParts.cancelButton.style}
                onPress={modalParts.cancelButton.onPress}
                disabled={modalParts.cancelButton.disabled}
                activeOpacity={modalParts.cancelButton.activeOpacity}
                accessibilityRole={modalParts.cancelButton.accessibilityRole}
                accessibilityLabel={modalParts.cancelButton.accessibilityLabel}
                accessibilityState={modalParts.cancelButton.accessibilityState}
              >
                <Text style={modalParts.cancelLabel.style}>{modalParts.cancelLabel.text}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalParts.saveButton.style}
                onPress={modalParts.saveButton.onPress}
                disabled={modalParts.saveButton.disabled}
                activeOpacity={modalParts.saveButton.activeOpacity}
                accessibilityRole={modalParts.saveButton.accessibilityRole}
                accessibilityLabel={modalParts.saveButton.accessibilityLabel}
                accessibilityState={modalParts.saveButton.accessibilityState}
              >
                <Text style={modalParts.saveLabel.style}>{modalParts.saveLabel.text}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ChatMessageSurface({
  children,
  style,
  toneStyle,
}: ChatMessageSurfaceProps) {
  const surfaceParts = createChatRuntimeMessageSurfaceMobilePropsParts({
    style,
    toneStyle,
  });

  return (
    <ChatMessageSurfaceContainer
      {...surfaceParts.container.props}
    >
      {children}
    </ChatMessageSurfaceContainer>
  );
}

export function ChatMessageSurfaceContainer({
  style,
  children,
}: ChatMessageSurfaceContainerProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageThreadItem({
  children,
  leadingActivity,
  trailingActivity,
}: ChatMessageThreadItemProps) {
  const threadItemParts = createChatRuntimeMessageThreadItemMobilePropsParts({
    leadingActivity,
    trailingActivity,
  });

  return (
    <View>
      {threadItemParts.leadingActivity}
      {children}
      {threadItemParts.trailingActivity}
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
  const threadSurfaceParts = createChatRuntimeMessageThreadSurfaceMobilePropsParts({
    leadingActivity,
    trailingActivity,
    surfaceStyle,
    surfaceToneStyle,
  });

  return (
    <ChatMessageThreadItem
      {...threadSurfaceParts.item}
    >
      <ChatMessageSurface
        {...threadSurfaceParts.surface}
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
  const surfaceParts = createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts({
    groupRenderState,
    onToggleGroup,
    surfaceToneStyle,
    styles,
  });

  return (
    <ChatMessageThreadSurface
      {...surfaceParts.surface}
      leadingActivity={surfaceParts.leadingBoundary.shouldRender ? (
        <ChatMessageToolActivityGroupBoundary
          {...surfaceParts.leadingBoundary.props}
        />
      ) : null}
      trailingActivity={surfaceParts.trailingBoundary.shouldRender ? (
        <ChatMessageToolActivityGroupBoundary
          {...surfaceParts.trailingBoundary.props}
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
  const runtimeThreadParts = createChatRuntimeConversationRuntimeThreadMobilePropsParts({
    groupRenderState,
    onToggleGroup,
    body,
    styles,
  });

  if (runtimeThreadParts.shouldSkipThread) return null;

  if (runtimeThreadParts.collapsedBoundary.shouldRender) {
    return (
      <ChatMessageToolActivityGroupBoundary
        {...runtimeThreadParts.collapsedBoundary.props}
      />
    );
  }

  if (!runtimeThreadParts.bodySurface.shouldRender) return null;

  const resolvedBody = createChatRuntimeConversationThreadBodyMobilePropsFromActionInput({
    ...runtimeThreadParts.bodySurface.body,
    createActionSet: createChatMessageActionSet,
  });

  return (
    <ChatMessageToolActivityGroupThreadSurface
      {...runtimeThreadParts.bodySurface.surface}
    >
      <ChatMessageThreadBody
        {...resolvedBody}
        styles={runtimeThreadParts.bodySurface.bodyStyles}
      />
    </ChatMessageToolActivityGroupThreadSurface>
  );
}

export function ChatMessageConversationRuntimeThreadList({
  threadStates,
  styles,
}: ChatMessageConversationRuntimeThreadListProps) {
  const threadListParts = createChatRuntimeConversationRuntimeThreadListMobilePropsParts({
    threadStates,
    styles,
  });

  return (
    <>
      {threadListParts.threads.map((thread) => (
        <ChatMessageRuntimeThread
          key={thread.key}
          {...thread.props}
        />
      ))}
    </>
  );
}

export function ChatMessageThreadBody({
  bodyDisplayMode,
  styles,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyProps) {
  const threadBodyParts = createChatRuntimeConversationThreadBodyMobilePropsParts({
    bodyDisplayMode,
    retryStatus,
    delegationCard,
    toolApproval,
    inlineActivity,
    conversation,
    styles,
  });

  if (threadBodyParts.retryStatus.shouldRender) {
    return (
      <ChatMessageRetryStatus
        {...threadBodyParts.retryStatus.props}
      />
    );
  }

  if (threadBodyParts.delegationCard.shouldRender) {
    return (
      <ChatMessageDelegationCard
        {...threadBodyParts.delegationCard.props}
      />
    );
  }

  if (threadBodyParts.toolApproval.shouldRender) {
    return (
      <ChatMessageToolApproval
        {...threadBodyParts.toolApproval.props}
      />
    );
  }

  if (threadBodyParts.inlineActivity.shouldRender) {
    return (
      <ChatMessageInlineActivity
        {...threadBodyParts.inlineActivity.props}
      />
    );
  }

  if (
    !threadBodyParts.conversation.shouldRender
    || !threadBodyParts.toolExecutionStack.shouldRender
    || !threadBodyParts.standaloneActions.shouldRender
  ) return null;

  return (
    <>
      <ChatMessageConversationContent
        {...threadBodyParts.conversation.props}
      />
      <ChatMessageToolExecutionStack
        {...threadBodyParts.toolExecutionStack.props}
      />
      <ChatMessageStandaloneActions
        {...threadBodyParts.standaloneActions.props}
      />
    </>
  );
}

export function ChatMessageRetryStatus({
  renderState,
  styles,
}: ChatMessageRetryStatusProps) {
  const retryStatusParts = createChatRuntimeRetryStatusMobilePropsParts({
    renderState,
    styles,
  });

  if (!retryStatusParts.shouldRenderRetryStatus) return null;

  return (
    <ChatMessageRetryStatusCard
      {...retryStatusParts.card.props}
    >
      <ChatMessageRetryStatusView
        {...retryStatusParts.header.props}
      >
        <ChatMessageRetryStatusIcon
          {...retryStatusParts.icon.props}
        />
        <ChatMessageRetryStatusTitle
          {...retryStatusParts.title.props}
        />
        <ChatMessageRetryStatusSpinner
          {...retryStatusParts.spinner.props}
        />
      </ChatMessageRetryStatusView>
      <ChatMessageRetryStatusView
        {...retryStatusParts.meta.props}
      >
        <ChatMessageRetryStatusText
          {...retryStatusParts.attempt.props}
        />
        <ChatMessageRetryStatusText
          {...retryStatusParts.countdown.props}
        />
      </ChatMessageRetryStatusView>
      <ChatMessageRetryStatusText
        {...retryStatusParts.description.props}
      />
    </ChatMessageRetryStatusCard>
  );
}

export function ChatMessageRetryStatusCard({
  accessible,
  accessibilityRole,
  accessibilityLabel,
  style,
  children,
}: ChatMessageRetryStatusCardProps) {
  return (
    <View
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {children}
    </View>
  );
}

export function ChatMessageRetryStatusView({
  style,
  children,
}: ChatMessageRetryStatusViewProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageRetryStatusIcon({
  name,
  size,
  color,
}: ChatMessageRetryStatusIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatMessageRetryStatusSpinner({
  size,
  color,
}: ChatMessageRetryStatusSpinnerProps) {
  return (
    <ActivityIndicator
      size={size}
      color={color}
    />
  );
}

export function ChatMessageRetryStatusTitle({
  style,
  numberOfLines,
  text,
}: ChatMessageRetryStatusTitleProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageRetryStatusText({
  style,
  text,
}: ChatMessageRetryStatusTextProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
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
  const toolApprovalParts = createChatRuntimeToolApprovalMobilePropsParts({
    renderState,
    toolName,
    argumentsPreview,
    argumentsContent,
    onToggleArguments,
    onDeny,
    onApprove,
    styles,
  });

  return (
    <ChatMessageToolApprovalView
      {...toolApprovalParts.card.props}
    >
      <ChatMessageToolApprovalView
        {...toolApprovalParts.header.props}
      >
        <ChatMessageToolApprovalIcon
          {...toolApprovalParts.headerIcon.props}
        />
        <ChatMessageToolApprovalTitle
          {...toolApprovalParts.title.props}
        />
        {toolApprovalParts.headerSpinner.shouldRender ? (
          <ChatMessageToolApprovalSpinner
            {...toolApprovalParts.headerSpinner.props}
          />
        ) : null}
      </ChatMessageToolApprovalView>
      <ChatMessageToolApprovalView
        {...toolApprovalParts.content.props}
      >
        <ChatMessageToolApprovalView
          {...toolApprovalParts.toolRow.props}
        >
          <ChatMessageToolApprovalToolLabel
            {...toolApprovalParts.toolLabel.props}
          />
          <ChatMessageToolApprovalToolName
            {...toolApprovalParts.toolName.props}
          />
        </ChatMessageToolApprovalView>
        {toolApprovalParts.argumentsPreview.shouldRender ? (
          <ChatMessageToolApprovalArgumentsPreview
            {...toolApprovalParts.argumentsPreview.props}
          />
        ) : null}
        <ChatMessageToolApprovalArgumentsToggle
          {...toolApprovalParts.argumentsToggle.props}
        >
          <ChatMessageToolApprovalIcon
            {...toolApprovalParts.argumentsToggle.icon.props}
          />
          <ChatMessageToolApprovalArgumentsToggleLabel
            {...toolApprovalParts.argumentsToggle.label.props}
          />
        </ChatMessageToolApprovalArgumentsToggle>
        {toolApprovalParts.fullArguments.shouldRender ? (
          <ChatMessageToolApprovalFullArgumentsScroll
            {...toolApprovalParts.fullArguments.scroll.props}
          >
            <ChatMessageToolApprovalFullArguments
              {...toolApprovalParts.fullArguments.text.props}
            />
          </ChatMessageToolApprovalFullArgumentsScroll>
        ) : null}
        <ChatMessageToolApprovalActions
          {...toolApprovalParts.actions.props}
        >
          <ChatMessageToolApprovalActionButton
            {...toolApprovalParts.denyButton.props}
          >
            <ChatMessageToolApprovalIcon
              {...toolApprovalParts.denyButton.icon.props}
            />
            <ChatMessageToolApprovalActionLabel
              {...toolApprovalParts.denyButton.label.props}
            />
          </ChatMessageToolApprovalActionButton>
          <ChatMessageToolApprovalActionButton
            {...toolApprovalParts.approveButton.props}
          >
            {toolApprovalParts.approveButton.spinner.shouldRender ? (
              <ChatMessageToolApprovalSpinner
                {...toolApprovalParts.approveButton.spinner.props}
              />
            ) : toolApprovalParts.approveButton.icon.shouldRender ? (
              <ChatMessageToolApprovalIcon
                {...toolApprovalParts.approveButton.icon.props}
              />
            ) : null}
            <ChatMessageToolApprovalActionLabel
              {...toolApprovalParts.approveButton.label.props}
            />
          </ChatMessageToolApprovalActionButton>
        </ChatMessageToolApprovalActions>
      </ChatMessageToolApprovalView>
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalView({
  style,
  children,
}: ChatMessageToolApprovalViewProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageToolApprovalIcon({
  name,
  size,
  color,
}: ChatMessageToolApprovalIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatMessageToolApprovalSpinner({
  size,
  color,
}: ChatMessageToolApprovalSpinnerProps) {
  return (
    <ActivityIndicator
      size={size}
      color={color}
    />
  );
}

export function ChatMessageToolApprovalTitle({
  style,
  numberOfLines,
  text,
}: ChatMessageToolApprovalTitleProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalToolLabel({
  style,
  text,
}: ChatMessageToolApprovalToolLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalToolName({
  style,
  numberOfLines,
  text,
}: ChatMessageToolApprovalToolNameProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalArgumentsPreview({
  style,
  numberOfLines,
  text,
}: ChatMessageToolApprovalArgumentsPreviewProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalFullArguments({
  style,
  text,
}: ChatMessageToolApprovalFullArgumentsProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalFullArgumentsScroll({
  style,
  nestedScrollEnabled,
  children,
}: ChatMessageToolApprovalFullArgumentsScrollProps) {
  return (
    <ScrollView
      style={style}
      nestedScrollEnabled={nestedScrollEnabled}
    >
      {children}
    </ScrollView>
  );
}

export function ChatMessageToolApprovalActions({
  style,
  children,
}: ChatMessageToolApprovalActionsProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageToolApprovalActionButton({
  style,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  children,
}: ChatMessageToolApprovalActionButtonProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatMessageToolApprovalArgumentsToggle({
  style,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  "aria-expanded": ariaExpanded,
  children,
}: ChatMessageToolApprovalArgumentsToggleProps) {
  return (
    <Pressable
      style={style}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      aria-expanded={ariaExpanded}
    >
      {children}
    </Pressable>
  );
}

export function ChatMessageToolApprovalArgumentsToggleLabel({
  style,
  text,
}: ChatMessageToolApprovalArgumentsToggleLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalActionLabel({
  style,
  text,
}: ChatMessageToolApprovalActionLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewRow({
  line,
  role,
  content,
  timestamp,
}: ChatMessageDelegationConversationPreviewRowProps) {
  return (
    <View style={line.style}>
      <Text
        style={role.style}
        numberOfLines={role.numberOfLines}
        ellipsizeMode={role.ellipsizeMode}
      >
        {role.text}
      </Text>
      <Text
        style={content.style}
        numberOfLines={content.numberOfLines}
        ellipsizeMode={content.ellipsizeMode}
      >
        {content.text}
      </Text>
      {timestamp.shouldRender ? (
        <Text
          style={timestamp.style}
          numberOfLines={timestamp.numberOfLines}
        >
          {timestamp.text}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatMessageDelegationConversationPreview({
  container,
  rows,
  moreAction,
}: ChatMessageDelegationConversationPreviewProps) {
  return (
    <View style={container.style}>
      {rows.map((row) => (
        <ChatMessageDelegationConversationPreviewRow
          key={row.key}
          {...row.props}
        />
      ))}
      {moreAction.shouldRender ? (
        <ChatMessageDelegationMorePreviewAction
          {...moreAction.props}
        />
      ) : null}
    </View>
  );
}

export function ChatMessageDelegationToolPreviewRow({
  line,
  statusIcon,
  name,
}: ChatMessageDelegationToolPreviewRowProps) {
  return (
    <View
      style={line.style}
      accessibilityLabel={line.accessibilityLabel}
    >
      <View
        style={statusIcon.style}
        accessibilityElementsHidden={statusIcon.accessibilityElementsHidden}
        importantForAccessibility={statusIcon.importantForAccessibility}
      >
        {statusIcon.spinner.shouldRender ? (
          <ActivityIndicator
            size={statusIcon.spinner.size}
            color={statusIcon.spinner.color}
          />
        ) : statusIcon.icon.shouldRender ? (
          <Ionicons
            name={statusIcon.icon.name}
            size={statusIcon.icon.size}
            color={statusIcon.icon.color}
          />
        ) : null}
      </View>
      <Text
        style={name.style}
        numberOfLines={name.numberOfLines}
        ellipsizeMode={name.ellipsizeMode}
      >
        {name.text}
      </Text>
    </View>
  );
}

export function ChatMessageDelegationMorePreviewAction({
  button,
  label,
}: ChatMessageDelegationMorePreviewActionProps) {
  return (
    <Pressable
      onPress={button.onPress}
      accessibilityRole={button.accessibilityRole}
      accessibilityLabel={button.accessibilityLabel}
      style={button.style}
    >
      <Text
        style={label.style}
        numberOfLines={label.numberOfLines}
      >
        {label.text}
      </Text>
    </Pressable>
  );
}

export function ChatMessageDelegationHeader({
  container,
  title,
  statusBadge,
  statusText,
  liveText,
}: ChatMessageDelegationHeaderProps) {
  return (
    <View style={container.style}>
      <Text
        style={title.style}
        numberOfLines={title.numberOfLines}
      >
        {title.text}
      </Text>
      <View style={statusBadge.style}>
        <Text
          style={statusText.style}
          numberOfLines={statusText.numberOfLines}
        >
          {statusText.text}
        </Text>
      </View>
      {liveText.shouldRender ? (
        <Text style={liveText.style}>
          {liveText.text}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatMessageDelegationMetaItem({
  style,
  numberOfLines,
  text,
}: ChatMessageDelegationMetaItemProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationMetaRow({
  container,
  items,
}: ChatMessageDelegationMetaRowProps) {
  return (
    <View style={container.style}>
      {items.map((metaItem) => (
        <ChatMessageDelegationMetaItem
          key={metaItem.key}
          {...metaItem.props}
        />
      ))}
    </View>
  );
}

export function ChatMessageDelegationSubtitle({
  style,
  numberOfLines,
  text,
}: ChatMessageDelegationSubtitleProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewLabel({
  style,
  numberOfLines,
  text,
}: ChatMessageDelegationToolPreviewLabelProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreview({
  container,
  label,
  rows,
  moreAction,
}: ChatMessageDelegationToolPreviewProps) {
  return (
    <View style={container.style}>
      <ChatMessageDelegationToolPreviewLabel
        {...label.props}
      />
      {rows.map((row) => (
        <ChatMessageDelegationToolPreviewRow
          key={row.key}
          {...row.props}
        />
      ))}
      {moreAction.shouldRender ? (
        <ChatMessageDelegationMorePreviewAction
          {...moreAction.props}
        />
      ) : null}
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
  const delegationCardParts = createChatRuntimeDelegationCardMobilePropsParts({
    surface,
    agentName,
    presentation,
    accessibilityLabel,
    messageCountLabel,
    statusStyles,
    conversationPreview,
    toolPreview,
    styles,
  });

  return (
    <View
      accessible={delegationCardParts.card.accessible}
      accessibilityRole={delegationCardParts.card.accessibilityRole}
      accessibilityLabel={delegationCardParts.card.accessibilityLabel}
      style={delegationCardParts.card.style}
    >
      <ChatMessageDelegationHeader
        {...delegationCardParts.header.props}
      />
      {delegationCardParts.subtitle.shouldRender ? (
        <ChatMessageDelegationSubtitle
          {...delegationCardParts.subtitle.props}
        />
      ) : null}
      <ChatMessageDelegationMetaRow
        {...delegationCardParts.meta.props}
      />
      {delegationCardParts.conversationPreview.shouldRender ? (
        <ChatMessageDelegationConversationPreview
          {...delegationCardParts.conversationPreview.props}
        />
      ) : null}
      {delegationCardParts.toolPreview.shouldRender ? (
        <ChatMessageDelegationToolPreview
          {...delegationCardParts.toolPreview.props}
        />
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
  const toggleParts = createChatRuntimeToolActivityGroupToggleMobilePropsParts({
    renderState,
    headerKind,
    onPress,
    styles,
  });

  return (
    <Pressable
      onPress={toggleParts.pressable.onPress}
      accessibilityRole={toggleParts.pressable.accessibilityRole}
      accessibilityLabel={toggleParts.pressable.accessibilityLabel}
      accessibilityState={toggleParts.pressable.accessibilityState}
      aria-expanded={toggleParts.pressable.ariaExpanded}
      style={toggleParts.pressable.style}
    >
      <View style={toggleParts.headerRow.style}>
        <ChatMessageToolActivityGroupIcon
          {...toggleParts.leadingIcon.props}
        />
        {toggleParts.countBadge.shouldRender ? (
          <ChatMessageToolActivityGroupCountBadge
            {...toggleParts.countBadge.props}
          />
        ) : null}
        <ChatMessageToolActivityGroupPreviewLine
          {...toggleParts.preview.props}
        />
        <ChatMessageToolActivityGroupIcon
          {...toggleParts.toggleIcon.props}
        />
      </View>
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupIcon({
  name,
  size,
  color,
}: ChatMessageToolActivityGroupIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatMessageToolActivityGroupCountBadge({
  container,
  label,
}: ChatMessageToolActivityGroupCountBadgeProps) {
  return (
    <View
      accessibilityLabel={container.accessibilityLabel}
      style={container.style}
    >
      <Text style={label.style}>
        {label.text}
      </Text>
    </View>
  );
}

export function ChatMessageToolActivityGroupPreviewLine({
  style,
  numberOfLines,
  ellipsizeMode,
  text,
}: ChatMessageToolActivityGroupPreviewLineProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {text}
    </Text>
  );
}

export function ChatMessageToolActivityGroupFooter({
  renderState,
  onPress,
  styles,
}: ChatMessageToolActivityGroupFooterProps) {
  const footerParts = createChatRuntimeToolActivityGroupFooterMobilePropsParts({
    renderState,
    onPress,
    styles,
  });

  return (
    <Pressable
      onPress={footerParts.button.onPress}
      accessibilityRole={footerParts.button.accessibilityRole}
      accessibilityLabel={footerParts.button.accessibilityLabel}
      style={footerParts.button.style}
    >
      <ChatMessageToolActivityGroupIcon
        {...footerParts.icon.props}
      />
      <ChatMessageToolActivityGroupFooterLabel
        {...footerParts.label.props}
      />
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupFooterLabel({
  style,
  text,
}: ChatMessageToolActivityGroupFooterLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatMessageToolActivityGroupBoundary({
  renderState,
  kind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupBoundaryProps) {
  const boundaryParts = createChatRuntimeToolActivityGroupBoundaryMobilePropsParts({
    renderState,
    kind,
    onPress,
    styles,
  });

  if (boundaryParts.footer.shouldRender) {
    return (
      <ChatMessageToolActivityGroupFooter
        {...boundaryParts.footer.props}
      />
    );
  }

  if (!boundaryParts.toggle.shouldRender) return null;

  return (
    <ChatMessageToolActivityGroupToggle
      {...boundaryParts.toggle.props}
    />
  );
}

export function ChatMessageToolExecutionCompactGroup({
  renderState,
  onPress,
  styles,
  children,
}: ChatMessageToolExecutionCompactGroupProps) {
  const compactGroupParts = createChatRuntimeToolExecutionCompactGroupMobilePropsParts({
    renderState,
    onPress,
    styles,
  });

  return (
    <Pressable
      onPress={compactGroupParts.container.onPress}
      accessibilityRole={compactGroupParts.container.accessibilityRole}
      accessibilityLabel={compactGroupParts.container.accessibilityLabel}
      accessibilityHint={compactGroupParts.container.accessibilityHint}
      accessibilityState={compactGroupParts.container.accessibilityState}
      aria-expanded={compactGroupParts.container.ariaExpanded}
      style={compactGroupParts.container.style}
    >
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCompactRow({
  renderState,
  styles,
}: ChatMessageToolExecutionCompactRowProps) {
  const compactRowParts = createChatRuntimeToolExecutionCompactRowMobilePropsParts({
    renderState,
    styles,
  });

  return (
    <View
      style={compactRowParts.container.style}
      accessibilityLabel={compactRowParts.container.accessibilityLabel}
    >
      <View style={compactRowParts.leadingIcon.style}>
        <Ionicons
          name={compactRowParts.leadingIcon.icon.name}
          size={compactRowParts.leadingIcon.icon.size}
          color={compactRowParts.leadingIcon.icon.color}
        />
      </View>
      <Text
        style={compactRowParts.name.style}
        numberOfLines={compactRowParts.name.numberOfLines}
        ellipsizeMode={compactRowParts.name.ellipsizeMode}
      >
        {compactRowParts.name.text}
      </Text>
      <View style={compactRowParts.statusIndicator.style}>
        {compactRowParts.statusIndicator.spinner.shouldRender ? (
          <ActivityIndicator
            size={compactRowParts.statusIndicator.spinner.size}
            color={compactRowParts.statusIndicator.spinner.color}
          />
        ) : compactRowParts.statusIndicator.icon.shouldRender ? (
          <Ionicons
            name={compactRowParts.statusIndicator.icon.name}
            size={compactRowParts.statusIndicator.icon.size}
            color={compactRowParts.statusIndicator.icon.color}
          />
        ) : null}
      </View>
      <View style={compactRowParts.toggleIcon.style}>
        <Ionicons
          name={compactRowParts.toggleIcon.icon.name}
          size={compactRowParts.toggleIcon.icon.size}
          color={compactRowParts.toggleIcon.icon.color}
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
  const compactListParts = createChatRuntimeToolExecutionCompactListMobilePropsParts({
    shouldRender,
    renderState,
    rows,
    onPress,
    groupStyles,
    rowStyles,
  });

  if (!compactListParts.shouldRenderList) return null;

  return (
    <ChatMessageToolExecutionCompactGroup
      {...compactListParts.group}
    >
      {compactListParts.rows.map((row) => (
        <ChatMessageToolExecutionCompactRow
          key={row.key}
          {...row.props}
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
  const collapseControlParts = createChatRuntimeToolExecutionCollapseControlMobilePropsParts({
    renderState,
    onPress,
    styles,
  });

  return (
    <Pressable
      onPress={collapseControlParts.container.onPress}
      accessibilityRole={collapseControlParts.container.accessibilityRole}
      accessibilityLabel={collapseControlParts.container.accessibilityLabel}
      accessibilityHint={collapseControlParts.container.accessibilityHint}
      style={collapseControlParts.container.style}
    >
      <Ionicons
        name={collapseControlParts.icon.name}
        size={collapseControlParts.icon.size}
        color={collapseControlParts.icon.color}
      />
      <Text style={collapseControlParts.label.style}>
        {collapseControlParts.label.text}
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
  const expandedGroupParts = createChatRuntimeToolExecutionExpandedGroupMobilePropsParts({
    topCollapseRenderState,
    bottomCollapseRenderState,
    onCollapsePress,
    isPending,
    allSuccess,
    hasErrors,
    emptyState,
    styles,
  });

  return (
    <View style={expandedGroupParts.containerStyle}>
      <ChatMessageToolExecutionCollapseControl
        {...expandedGroupParts.topCollapseControl}
      />
      <View style={expandedGroupParts.cardStyle}>
        {children}
        {expandedGroupParts.emptyState.shouldRender ? expandedGroupParts.emptyState.props : null}
      </View>
      <ChatMessageToolExecutionCollapseControl
        {...expandedGroupParts.bottomCollapseControl}
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
  const panelParts = createChatRuntimeToolExecutionPanelMobilePropsParts({
    shouldRender,
    isExpanded,
    compact,
    expanded,
  });

  if (!panelParts.shouldRenderPanel) return null;

  const panelShellParts = createChatRuntimeToolExecutionPanelShellMobilePropsParts({
    compactList: (
      <ChatMessageToolExecutionCompactList
        {...panelParts.compact}
      />
    ),
    expandedGroup: panelParts.expandedGroup.shouldRender ? (
      <ChatMessageToolExecutionExpandedGroup {...panelParts.expandedGroup.props}>
        {children}
      </ChatMessageToolExecutionExpandedGroup>
    ) : null,
  });

  return (
    <>
      {panelShellParts.compactList}
      {panelShellParts.expandedGroup.shouldRender ? panelShellParts.expandedGroup.props : null}
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
  const stackPanelParts = createChatRuntimeToolExecutionStackPanelMobilePropsParts({
    compact,
    expanded,
    detailRows,
    styles,
  });

  return (
    <ChatMessageToolExecutionPanel
      shouldRender={shouldRender}
      isExpanded={isExpanded}
      compact={stackPanelParts.compact}
      expanded={{
        ...stackPanelParts.expandedGroup,
        emptyState: stackPanelParts.emptyState.shouldRender ? (
          <ChatMessageToolExecutionEmptyState
            {...stackPanelParts.emptyState.props}
          />
        ) : null,
      }}
    >
      <ChatMessageToolExecutionCallList
        {...stackPanelParts.callList}
      />
    </ChatMessageToolExecutionPanel>
  );
}

export function ChatMessageToolExecutionCopyButton({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCopyButtonProps) {
  const copyButtonParts = createChatRuntimeToolExecutionCopyButtonMobilePropsParts({
    renderState,
    onPress,
    styles,
  });

  return (
    <Pressable
      onPress={copyButtonParts.container.onPress}
      accessibilityRole={copyButtonParts.container.accessibilityRole}
      accessibilityLabel={copyButtonParts.container.accessibilityLabel}
      style={copyButtonParts.container.style}
    >
      <Ionicons
        name={copyButtonParts.icon.name}
        size={copyButtonParts.icon.size}
        color={copyButtonParts.icon.color}
      />
      <Text style={copyButtonParts.label.style}>
        {copyButtonParts.label.text}
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
  const detailHeaderParts = createChatRuntimeToolExecutionDetailHeaderMobilePropsParts({
    renderState,
    toolName,
    onPress,
    styles,
  });

  return (
    <Pressable
      onPress={detailHeaderParts.container.onPress}
      style={detailHeaderParts.container.style}
      accessibilityRole={detailHeaderParts.container.accessibilityRole}
      accessibilityLabel={detailHeaderParts.container.accessibilityLabel}
      accessibilityState={detailHeaderParts.container.accessibilityState}
      aria-expanded={detailHeaderParts.container.ariaExpanded}
      accessibilityHint={detailHeaderParts.container.accessibilityHint}
    >
      <Text style={detailHeaderParts.toolName.style}>
        {detailHeaderParts.toolName.text}
      </Text>
      <View style={detailHeaderParts.expandHint.style}>
        <Ionicons
          name={detailHeaderParts.expandHint.icon.name}
          size={detailHeaderParts.expandHint.icon.size}
          color={detailHeaderParts.expandHint.icon.color}
        />
        <Text style={detailHeaderParts.expandHint.label.style}>
          {detailHeaderParts.expandHint.label.text}
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
  const callSectionParts = createChatRuntimeToolExecutionCallSectionMobilePropsParts({
    renderState,
    toolName,
    onHeaderPress,
    styles,
  });

  return (
    <View style={callSectionParts.container.style}>
      <ChatMessageToolExecutionDetailHeader
        {...callSectionParts.header}
      />
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultBadge({
  badge,
  styles,
}: ChatMessageToolExecutionResultBadgeProps) {
  const resultBadgeParts = createChatRuntimeToolExecutionResultBadgeMobilePropsParts({
    badge,
    styles,
  });

  return (
    <View
      accessible={resultBadgeParts.container.accessible}
      accessibilityRole={resultBadgeParts.container.accessibilityRole}
      accessibilityLabel={resultBadgeParts.container.accessibilityLabel}
      style={resultBadgeParts.container.style}
    >
      <Ionicons
        name={resultBadgeParts.icon.name}
        size={resultBadgeParts.icon.size}
        color={resultBadgeParts.icon.color}
      />
      <Text
        style={resultBadgeParts.label.style}
      >
        {resultBadgeParts.label.text}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionPendingResult({
  renderState,
  styles,
}: ChatMessageToolExecutionPendingResultProps) {
  const pendingResultParts = createChatRuntimeToolExecutionPendingResultMobilePropsParts({
    renderState,
    styles,
  });

  return (
    <View
      accessible={pendingResultParts.container.accessible}
      accessibilityRole={pendingResultParts.container.accessibilityRole}
      accessibilityLabel={pendingResultParts.container.accessibilityLabel}
      style={pendingResultParts.container.style}
    >
      <ActivityIndicator
        size={pendingResultParts.spinner.size}
        color={pendingResultParts.spinner.color}
      />
      <Text style={pendingResultParts.label.style}>
        {pendingResultParts.label.text}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionEmptyState({
  renderState,
  style,
}: ChatMessageToolExecutionEmptyStateProps) {
  const emptyStateParts = createChatRuntimeToolExecutionEmptyStateMobilePropsParts({
    renderState,
    style,
  });

  return (
    <Text
      accessibilityRole={emptyStateParts.label.accessibilityRole}
      accessibilityLabel={emptyStateParts.label.accessibilityLabel}
      style={emptyStateParts.label.style}
    >
      {emptyStateParts.label.text}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadMeta({
  renderState,
  styles,
}: ChatMessageToolExecutionPayloadMetaProps) {
  const payloadMetaParts = createChatRuntimeToolExecutionPayloadMetaMobilePropsParts({
    renderState,
    styles,
  });

  const content = (
    <>
      <ChatMessageToolExecutionPayloadMetaText
        {...payloadMetaParts.label.props}
      />
      {payloadMetaParts.payloadType.shouldRender ? (
        <ChatMessageToolExecutionPayloadMetaText
          {...payloadMetaParts.payloadType.props}
        />
      ) : null}
    </>
  );

  if (!payloadMetaParts.row.shouldRender) {
    return content;
  }

  return (
    <ChatMessageToolExecutionPayloadMetaRow
      {...payloadMetaParts.row.props}
    >
      {content}
    </ChatMessageToolExecutionPayloadMetaRow>
  );
}

export function ChatMessageToolExecutionPayloadMetaRow({
  style,
  children,
}: ChatMessageToolExecutionPayloadMetaRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionPayloadMetaText({
  style,
  text,
}: ChatMessageToolExecutionPayloadMetaTextProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
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
  const resultHeaderParts = createChatRuntimeToolExecutionResultHeaderMobilePropsParts({
    payloadRenderState,
    resultBadge,
    characterCountLabel,
    copyButtonRenderState,
    onCopyPress,
    styles,
  });

  return (
    <View style={resultHeaderParts.headerStyle}>
      <View style={resultHeaderParts.metaStyle}>
        <ChatMessageToolExecutionPayloadMeta
          {...resultHeaderParts.payloadMeta}
        />
        <ChatMessageToolExecutionResultBadge
          {...resultHeaderParts.resultBadge}
        />
        <Text style={resultHeaderParts.characterCount.style}>
          {resultHeaderParts.characterCount.label}
        </Text>
      </View>
      <ChatMessageToolExecutionCopyButton
        {...resultHeaderParts.copyButton}
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
  const payloadBlockParts = createChatRuntimeToolExecutionPayloadBlockMobilePropsParts({
    compactText,
    content,
    isExpanded,
    previewNumberOfLines,
    styles,
  });

  return (
    <>
      {payloadBlockParts.preview.shouldRender ? (
        <Text
          style={payloadBlockParts.preview.style}
          numberOfLines={payloadBlockParts.preview.numberOfLines}
        >
          {payloadBlockParts.preview.text}
        </Text>
      ) : null}
      <ScrollView
        style={payloadBlockParts.scroll.style}
        nestedScrollEnabled={payloadBlockParts.scroll.nestedScrollEnabled}
      >
        <Text style={payloadBlockParts.code.style}>
          {payloadBlockParts.code.text}
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
  const payloadSectionParts = createChatRuntimeToolExecutionPayloadSectionMobilePropsParts({
    payloadRenderState,
    compactText,
    content,
    isExpanded,
    previewNumberOfLines,
    copyButtonRenderState,
    onCopyPress,
    styles,
  });

  return (
    <View style={payloadSectionParts.sectionStyle}>
      <View style={payloadSectionParts.headerRowStyle}>
        <ChatMessageToolExecutionPayloadMeta
          {...payloadSectionParts.payloadMeta}
        />
        <ChatMessageToolExecutionCopyButton
          {...payloadSectionParts.copyButton}
        />
      </View>
      <ChatMessageToolExecutionPayloadBlock
        {...payloadSectionParts.payloadBlock}
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
  const errorBlockParts = createChatRuntimeToolExecutionErrorBlockMobilePropsParts({
    renderState,
    error,
    copyButtonRenderState,
    onCopyPress,
    styles,
  });

  return (
    <View style={errorBlockParts.sectionStyle}>
      <View style={errorBlockParts.headerRowStyle}>
        <Text style={errorBlockParts.label.style}>
          {errorBlockParts.label.text}
        </Text>
        <ChatMessageToolExecutionCopyButton
          {...errorBlockParts.copyButton}
        />
      </View>
      <Text style={errorBlockParts.error.style}>
        {errorBlockParts.error.text}
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
  const resultSectionParts = createChatRuntimeToolExecutionResultSectionMobilePropsParts({
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
  });

  return (
    <View style={resultSectionParts.itemStyle}>
      <ChatMessageToolExecutionResultHeader
        {...resultSectionParts.header}
      />
      <ChatMessageToolExecutionPayloadBlock
        {...resultSectionParts.payloadBlock}
      />
      {resultSectionParts.errorBlock.shouldRender ? (
        <ChatMessageToolExecutionErrorBlock
          {...resultSectionParts.errorBlock.props}
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
  const callDetailParts = createChatRuntimeToolExecutionCallDetailMobilePropsParts({
    renderState,
    toolName,
    onHeaderPress,
    input,
    result,
    pendingResult,
    styles,
  });

  return (
    <ChatMessageToolExecutionCallSection
      {...callDetailParts.callSection}
    >
      {callDetailParts.inputSection.shouldRender ? (
        <ChatMessageToolExecutionPayloadSection
          {...callDetailParts.inputSection.props}
        />
      ) : null}
      {callDetailParts.resultSection.shouldRender ? (
        <ChatMessageToolExecutionResultSection
          {...callDetailParts.resultSection.props}
        />
      ) : callDetailParts.pendingResult.shouldRender ? (
        <ChatMessageToolExecutionPendingResult
          {...callDetailParts.pendingResult.props}
        />
      ) : null}
    </ChatMessageToolExecutionCallSection>
  );
}

export function ChatMessageToolExecutionCallList({
  rows,
  styles,
}: ChatMessageToolExecutionCallListProps) {
  const callListParts = createChatRuntimeToolExecutionCallListMobilePropsParts({
    rows,
    styles,
  });

  return (
    <>
      {callListParts.rows.map((row) => (
        <ChatMessageToolExecutionCallDetail
          key={row.key}
          {...row.props}
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
  const frameParts = createChatRuntimeConversationFrameMobilePropsParts({
    children,
    dock,
    overlays,
    keyboardAvoidingStyle,
    keyboardAvoidingBehavior,
    keyboardVerticalOffset,
    rootStyle,
  });

  return (
    <KeyboardAvoidingView
      style={frameParts.keyboardAvoidingView.style}
      behavior={frameParts.keyboardAvoidingView.behavior}
      keyboardVerticalOffset={frameParts.keyboardAvoidingView.keyboardVerticalOffset}
    >
      <View style={frameParts.root.style}>
        {frameParts.root.children}
        {frameParts.root.dock}
      </View>
      {frameParts.overlays}
    </KeyboardAvoidingView>
  );
}

export function ChatMessageConversationOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageConversationOverlaysProps) {
  const overlayParts = createChatRuntimeConversationOverlaysMobilePropsParts({
    agentSelector,
    promptEditor,
  });

  return (
    <>
      {overlayParts.agentSelector}
      {overlayParts.promptEditor}
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
  const scrollViewportParts = createChatRuntimeConversationScrollViewportMobilePropsParts({
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
  });

  return (
    <ScrollView
      ref={scrollViewportParts.scrollView.ref}
      style={scrollViewportParts.scrollView.style}
      contentContainerStyle={scrollViewportParts.scrollView.contentContainerStyle}
      keyboardShouldPersistTaps={scrollViewportParts.scrollView.keyboardShouldPersistTaps}
      contentInsetAdjustmentBehavior={scrollViewportParts.scrollView.contentInsetAdjustmentBehavior}
      onScroll={scrollViewportParts.scrollView.onScroll}
      onScrollBeginDrag={scrollViewportParts.scrollView.onScrollBeginDrag}
      onScrollEndDrag={scrollViewportParts.scrollView.onScrollEndDrag}
      scrollEventThrottle={scrollViewportParts.scrollView.scrollEventThrottle}
    >
      {scrollViewportParts.children}
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
  const viewportContentParts = createChatRuntimeConversationViewportContentMobilePropsParts({
    loadingState,
    homeState,
    historyBanner,
    stepSummary,
    children,
    debugPanels,
  });

  return (
    <>
      {viewportContentParts.loadingState}
      {viewportContentParts.homeState}
      {viewportContentParts.historyBanner}
      {viewportContentParts.stepSummary}
      {viewportContentParts.children}
      {viewportContentParts.debugPanels}
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
  const viewportParts = createChatRuntimeConversationViewportMobilePropsParts({
    loadingState,
    homeQuickStarts,
    historyBanner,
    stepSummary,
    debugPanels,
    styles,
  });

  return (
    <ChatMessageConversationViewport
      {...scrollViewportProps}
      {...viewportParts.scrollViewport}
      loadingState={(
        <ChatMessageLoadingState
          {...viewportParts.loadingState}
        />
      )}
      homeState={(
        <ChatConversationHomeQuickStarts
          {...viewportParts.homeQuickStarts}
        />
      )}
      historyBanner={(
        <ChatMessageHistoryBanner
          {...viewportParts.historyBanner}
        />
      )}
      stepSummary={(
        <ChatMessageStepSummaryCard
          {...viewportParts.stepSummary}
        />
      )}
      debugPanels={(
        <ChatMessageDebugPanelStack
          {...viewportParts.debugPanels}
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
  const surfaceParts = createChatRuntimeConversationSurfaceMobilePropsParts({
    frame,
    dock,
    overlays,
    threadList,
    viewport,
    styles,
  });

  return (
    <ChatMessageConversationFrame
      keyboardAvoidingStyle={surfaceParts.frame.keyboardAvoidingStyle}
      keyboardAvoidingBehavior={surfaceParts.frame.keyboardAvoidingBehavior}
      keyboardVerticalOffset={surfaceParts.frame.keyboardVerticalOffset}
      rootStyle={surfaceParts.frame.rootStyle}
      dock={(
        <ChatMessageRuntimeDock
          {...surfaceParts.dock}
        />
      )}
      overlays={(
        <ChatMessageRuntimeOverlays
          {...surfaceParts.overlays}
        />
      )}
    >
      <ChatMessageRuntimeViewport
        {...surfaceParts.viewport}
      >
        <ChatMessageConversationRuntimeThreadList {...surfaceParts.threadList} />
      </ChatMessageRuntimeViewport>
    </ChatMessageConversationFrame>
  );
}

export function ChatMessageHistoryBanner({
  renderState,
  onLoadEarlier,
  styles,
}: ChatMessageHistoryBannerProps) {
  const historyBannerParts = createChatRuntimeMessageHistoryBannerMobilePropsParts({
    renderState,
    onLoadEarlier,
    styles,
  });

  if (!historyBannerParts.shouldRenderBanner) return null;

  return (
    <View style={historyBannerParts.container.style}>
      <Text style={historyBannerParts.summary.style}>
        {historyBannerParts.summary.text}
      </Text>
      <Pressable
        onPress={historyBannerParts.loadButton.onPress}
        accessibilityRole={historyBannerParts.loadButton.accessibilityRole}
        accessibilityLabel={historyBannerParts.loadButton.accessibilityLabel}
        style={({ pressed }) => [
          historyBannerParts.loadButton.style,
          pressed && historyBannerParts.loadButton.pressedStyle,
        ]}
      >
        <Ionicons
          name={historyBannerParts.icon.name}
          size={historyBannerParts.icon.size}
          color={historyBannerParts.icon.color}
        />
        <Text style={historyBannerParts.loadButtonLabel.style}>
          {historyBannerParts.loadButtonLabel.text}
        </Text>
      </Pressable>
    </View>
  );
}

export function ChatMessageStepSummaryCard({
  renderState,
  styles,
}: ChatMessageStepSummaryCardProps) {
  const stepSummaryCardParts = createChatRuntimeStepSummaryCardMobilePropsParts({
    renderState,
    styles,
  });

  if (!stepSummaryCardParts.shouldRenderCard) return null;

  return (
    <View
      accessible={stepSummaryCardParts.card.accessible}
      accessibilityRole={stepSummaryCardParts.card.accessibilityRole}
      accessibilityLabel={stepSummaryCardParts.card.accessibilityLabel}
      style={stepSummaryCardParts.card.style}
    >
      <View style={stepSummaryCardParts.header.style}>
        <Text
          style={stepSummaryCardParts.title.style}
          numberOfLines={stepSummaryCardParts.title.numberOfLines}
        >
          {stepSummaryCardParts.title.text}
        </Text>
        <View style={stepSummaryCardParts.badge.style}>
          <Text
            style={stepSummaryCardParts.badgeLabel.style}
            numberOfLines={stepSummaryCardParts.badgeLabel.numberOfLines}
          >
            {stepSummaryCardParts.badgeLabel.text}
          </Text>
        </View>
      </View>
      <Text
        style={stepSummaryCardParts.action.style}
        numberOfLines={stepSummaryCardParts.action.numberOfLines}
      >
        {stepSummaryCardParts.action.text}
      </Text>
      <Text
        style={stepSummaryCardParts.meta.style}
        numberOfLines={stepSummaryCardParts.meta.numberOfLines}
      >
        {stepSummaryCardParts.meta.text}
      </Text>
      {stepSummaryCardParts.preview.shouldRender ? (
        <Text
          style={stepSummaryCardParts.preview.style}
          numberOfLines={stepSummaryCardParts.preview.numberOfLines}
        >
          {stepSummaryCardParts.preview.text}
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
  const scrollToBottomButtonParts = createChatRuntimeScrollToBottomButtonMobilePropsParts({
    renderState,
    onPress,
    style,
  });

  if (!scrollToBottomButtonParts.shouldRenderButton) return null;

  return (
    <ChatMessageScrollToBottomButtonTouchable
      {...scrollToBottomButtonParts.button.props}
    >
      <ChatMessageScrollToBottomButtonIcon
        {...scrollToBottomButtonParts.icon.props}
      />
    </ChatMessageScrollToBottomButtonTouchable>
  );
}

export function ChatMessageScrollToBottomButtonTouchable({
  style,
  onPress,
  activeOpacity,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  children,
}: ChatMessageScrollToBottomButtonTouchableProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatMessageScrollToBottomButtonIcon({
  name,
  size,
  color,
}: ChatMessageScrollToBottomButtonIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatMessageLoadingState({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageLoadingStateProps) {
  const loadingStateParts = createChatRuntimeLoadingStateMobilePropsParts({
    renderState,
    spinnerSource,
    style,
    spinnerStyle,
  });

  if (!loadingStateParts.shouldRenderLoadingState) return null;

  return (
    <ChatMessageLoadingStateContainer
      {...loadingStateParts.container.props}
    >
      <ChatMessageLoadingStateSpinner
        {...loadingStateParts.spinner.props}
      />
    </ChatMessageLoadingStateContainer>
  );
}

export function ChatMessageLoadingStateContainer({
  accessible,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  style,
  children,
}: ChatMessageLoadingStateContainerProps) {
  return (
    <View
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={style}
    >
      {children}
    </View>
  );
}

export function ChatMessageLoadingStateSpinner({
  source,
  style,
  resizeMode,
}: ChatMessageLoadingStateSpinnerProps) {
  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
    />
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
  const debugPanelStackParts = createChatRuntimeDebugPanelStackMobilePropsParts({
    requestShouldRender,
    requestRows,
    voiceShouldRender,
    voiceRows,
    panelStyle,
    textStyle,
  });

  return (
    <>
      <ChatMessageDebugPanel
        {...debugPanelStackParts.requestPanel}
      />
      <ChatMessageDebugPanel
        {...debugPanelStackParts.voicePanel}
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
  const dockShellParts = createChatRuntimeConversationDockShellMobilePropsParts({
    responseHistoryPanel,
    scrollToBottomButton,
    voiceOverlay,
    queuePanel,
    connectionBanner,
    composer,
  });

  return (
    <>
      {dockShellParts.responseHistoryPanel}
      {dockShellParts.scrollToBottomButton}
      {dockShellParts.voiceOverlay}
      {dockShellParts.queuePanel}
      {dockShellParts.connectionBanner}
      {dockShellParts.composer}
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
  const dockParts = createChatRuntimeConversationDockMobilePropsParts({
    responseHistoryPanel,
    scrollToBottomButton,
    voiceOverlay,
    queuePanel,
    connectionBanner,
    composer,
    styles,
  });

  return (
    <ChatMessageConversationDock
      responseHistoryPanel={(
        <ChatMessageResponseHistoryPanelDock
          {...dockParts.responseHistoryPanel}
        />
      )}
      scrollToBottomButton={(
        <ChatMessageScrollToBottomButton
          {...dockParts.scrollToBottomButton}
        />
      )}
      voiceOverlay={(
        <ChatComposerVoiceOverlay
          {...dockParts.voiceOverlay}
        />
      )}
      queuePanel={(
        <ChatMessageQueuePanelDock
          {...dockParts.queuePanel}
        />
      )}
      connectionBanner={(
        <ChatMessageConnectionBanner
          {...dockParts.connectionBanner}
        />
      )}
      composer={(
        <ChatComposerRuntimeDock
          {...dockParts.composer}
        />
      )}
    />
  );
}

export function ChatMessageResponseHistoryPanelDock(panelProps: ChatMessageResponseHistoryPanelDockProps) {
  const {
    responses,
    colors,
    remoteBaseUrl,
    remoteApiKey,
  } = panelProps;
  const panelChromeState = useChatMessageRuntimeResponseHistoryPanelChromeState(panelProps);

  return (
    <ResponseHistoryPanel
      responses={responses}
      colors={colors}
      remoteBaseUrl={remoteBaseUrl}
      remoteApiKey={remoteApiKey}
      {...panelChromeState}
    />
  );
}

export function ChatMessageQueuePanelDock({
  shouldRender,
  panel,
  style,
}: ChatMessageQueuePanelDockProps) {
  const {
    conversationId,
    ...panelProps
  } = panel;
  const queuePanelChromeState = useChatMessageRuntimeQueuePanelDockChromeState({
    conversationId,
  });

  if (!shouldRender) return null;

  return (
    <View style={style}>
      <MessageQueuePanel
        {...panelProps}
        {...queuePanelChromeState}
      />
    </View>
  );
}

export function ChatMessageConnectionBanner({
  renderState,
  onRetry,
  styles,
}: ChatMessageConnectionBannerProps) {
  const connectionBannerParts = createChatRuntimeConnectionBannerMobilePropsParts({
    renderState,
    onRetry,
    styles,
  });

  return (
    <>
      {connectionBannerParts.reconnecting.shouldRender ? (
        <View
          accessible={connectionBannerParts.reconnecting.container.accessible}
          accessibilityRole={connectionBannerParts.reconnecting.container.accessibilityRole}
          accessibilityLabel={connectionBannerParts.reconnecting.container.accessibilityLabel}
          style={connectionBannerParts.reconnecting.container.style}
        >
          <View style={connectionBannerParts.reconnecting.content.style}>
            <ActivityIndicator
              size={connectionBannerParts.reconnecting.spinner.size}
              color={connectionBannerParts.reconnecting.spinner.color}
              style={connectionBannerParts.reconnecting.spinner.style}
            />
            <View style={connectionBannerParts.reconnecting.textContainer.style}>
              <Text style={connectionBannerParts.reconnecting.title.style}>
                {connectionBannerParts.reconnecting.title.text}
              </Text>
              {connectionBannerParts.reconnecting.subtitle.shouldRender ? (
                <Text
                  style={connectionBannerParts.reconnecting.subtitle.style}
                  numberOfLines={connectionBannerParts.reconnecting.subtitle.numberOfLines}
                >
                  {connectionBannerParts.reconnecting.subtitle.text}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
      {connectionBannerParts.failed.shouldRender ? (
        <View
          accessible={connectionBannerParts.failed.container.accessible}
          accessibilityRole={connectionBannerParts.failed.container.accessibilityRole}
          accessibilityLabel={connectionBannerParts.failed.container.accessibilityLabel}
          style={connectionBannerParts.failed.container.style}
        >
          <View style={connectionBannerParts.failed.content.style}>
            <Ionicons
              name={connectionBannerParts.failed.icon.name}
              size={connectionBannerParts.failed.icon.size}
              color={connectionBannerParts.failed.icon.color}
              style={connectionBannerParts.failed.icon.style}
            />
            <View style={connectionBannerParts.failed.textContainer.style}>
              <Text style={connectionBannerParts.failed.title.style}>
                {connectionBannerParts.failed.title.text}
              </Text>
              <Text
                style={connectionBannerParts.failed.subtitle.style}
                numberOfLines={connectionBannerParts.failed.subtitle.numberOfLines}
              >
                {connectionBannerParts.failed.subtitle.text}
              </Text>
            </View>
            <TouchableOpacity
              style={connectionBannerParts.failed.retryButton.style}
              onPress={connectionBannerParts.failed.retryButton.onPress}
              accessibilityRole={connectionBannerParts.failed.retryButton.accessibilityRole}
              accessibilityLabel={connectionBannerParts.failed.retryButton.accessibilityLabel}
              activeOpacity={connectionBannerParts.failed.retryButton.activeOpacity}
            >
              <Text style={connectionBannerParts.failed.retryLabel.style}>
                {connectionBannerParts.failed.retryLabel.text}
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
  const composerDockParts = createChatComposerRuntimeDockMobilePropsParts({
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
  });

  return (
    <ChatComposerInputDock
      speechPreview={(
        <ChatComposerSpeechPreview
          {...composerDockParts.speechPreview}
        />
      )}
      pendingImagesRail={(
        <ChatComposerPendingImagesRail
          {...composerDockParts.pendingImagesRail}
        />
      )}
      handsFreeControls={(
        <ChatComposerHandsFreeControls
          {...composerDockParts.handsFreeControls}
          status={<HandsFreeStatusChip {...composerDockParts.handsFreeStatus} />}
        />
      )}
      imageAttachmentControl={(
        <ChatComposerIconButton
          {...composerDockParts.imageAttachmentControl}
        />
      )}
      textToSpeechControl={(
        <ChatComposerIconButton
          {...composerDockParts.textToSpeechControl}
        />
      )}
      editBeforeSendControl={(
        <ChatComposerIconButton
          {...composerDockParts.editBeforeSendControl}
        />
      )}
      textEntry={(
        <ChatComposerTextEntry
          {...composerDockParts.textEntry}
        />
      )}
      queueAction={(
        <ChatComposerLabeledActionButton
          {...composerDockParts.queueAction}
        />
      )}
      submitAction={(
        <ChatComposerLabeledActionButton
          {...composerDockParts.submitAction}
        />
      )}
      micButton={(
        <ChatComposerMicButton
          {...composerDockParts.micButton}
        />
      )}
      {...composerDockParts.inputDock}
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
  const inputDockParts = createChatComposerInputDockMobilePropsParts({
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
  });

  return (
    <ChatComposerInputDockArea
      {...inputDockParts.area.props}
    >
      {inputDockParts.speechPreview}
      {inputDockParts.pendingImagesRail}
      {inputDockParts.handsFreeControls}
      <ChatComposerInputDockRow
        {...inputDockParts.row.props}
      >
        {inputDockParts.row.imageAttachmentControl}
        {inputDockParts.row.textToSpeechControl}
        {inputDockParts.row.editBeforeSendControl}
        {inputDockParts.row.textEntry}
        {inputDockParts.row.queueAction}
        {inputDockParts.row.submitAction}
      </ChatComposerInputDockRow>
      <ChatComposerInputDockMicWrapper
        {...inputDockParts.micWrapper.props}
      >
        {inputDockParts.micWrapper.micButton}
      </ChatComposerInputDockMicWrapper>
    </ChatComposerInputDockArea>
  );
}

export function ChatComposerInputDockArea({
  style,
  children,
}: ChatComposerInputDockAreaProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatComposerInputDockRow({
  style,
  children,
}: ChatComposerInputDockRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export const ChatComposerInputDockMicWrapper = forwardRef<View, ChatComposerInputDockMicWrapperProps>(function ChatComposerInputDockMicWrapper({
  style,
  children,
}, ref) {
  return (
    <View
      ref={ref}
      style={style}
    >
      {children}
    </View>
  );
});

export function ChatComposerSpeechPreview({
  label,
  text,
  styles,
}: ChatComposerSpeechPreviewProps) {
  const speechPreviewParts = createChatComposerSpeechPreviewMobilePropsParts({
    label,
    text,
    styles,
  });

  if (!speechPreviewParts.shouldRender) return null;

  return (
    <ChatComposerSpeechPreviewContainer
      {...speechPreviewParts.container.props}
    >
      <ChatComposerSpeechPreviewLabel
        {...speechPreviewParts.label.props}
      />
      <ChatComposerSpeechPreviewText
        {...speechPreviewParts.text.props}
      />
    </ChatComposerSpeechPreviewContainer>
  );
}

export function ChatComposerSpeechPreviewContainer({
  style,
  children,
}: ChatComposerSpeechPreviewContainerProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatComposerSpeechPreviewLabel({
  style,
  text,
}: ChatComposerSpeechPreviewLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatComposerSpeechPreviewText({
  style,
  text,
}: ChatComposerSpeechPreviewTextProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatComposerPendingImagesRail({
  images,
  renderState,
  onRemove,
  styles,
}: ChatComposerPendingImagesRailProps) {
  const pendingImagesRailParts = createChatComposerPendingImagesRailMobilePropsParts({
    images,
    renderState,
    onRemove,
    styles,
  });

  if (!pendingImagesRailParts.shouldRender) return null;

  return (
    <ChatComposerPendingImagesRailScrollView
      {...pendingImagesRailParts.scrollView.props}
    >
      {pendingImagesRailParts.items.map((item) => (
        <ChatComposerPendingImageCard
          key={item.key}
          {...item.card.props}
        >
          <ChatComposerPendingImagePreview
            {...item.preview.props}
          />
          <ChatComposerPendingImageRemoveButton
            {...item.removeButton.props}
          >
            <ChatComposerPendingImageRemoveIcon
              {...item.removeIcon.props}
            />
          </ChatComposerPendingImageRemoveButton>
        </ChatComposerPendingImageCard>
      ))}
    </ChatComposerPendingImagesRailScrollView>
  );
}

export function ChatComposerPendingImagesRailScrollView({
  horizontal,
  showsHorizontalScrollIndicator,
  contentContainerStyle,
  children,
}: ChatComposerPendingImagesRailScrollViewProps) {
  return (
    <ScrollView
      horizontal={horizontal}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  );
}

export function ChatComposerPendingImageCard({
  style,
  children,
}: ChatComposerPendingImageCardProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatComposerPendingImagePreview({
  source,
  style,
}: ChatComposerPendingImagePreviewProps) {
  return (
    <Image
      source={source}
      style={style}
    />
  );
}

export function ChatComposerPendingImageRemoveButton({
  style,
  onPress,
  activeOpacity,
  accessibilityRole,
  accessibilityLabel,
  children,
}: ChatComposerPendingImageRemoveButtonProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerPendingImageRemoveIcon({
  name,
  size,
  color,
}: ChatComposerPendingImageRemoveIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatComposerVoiceOverlay({
  isVisible,
  label,
  transcript,
  transcriptNumberOfLines,
  styles,
}: ChatComposerVoiceOverlayProps) {
  const voiceOverlayParts = createChatComposerVoiceOverlayMobilePropsParts({
    isVisible,
    label,
    transcript,
    transcriptNumberOfLines,
    styles,
  });

  if (!voiceOverlayParts.shouldRender) return null;

  return (
    <ChatComposerVoiceOverlayContainer
      {...voiceOverlayParts.overlay.props}
    >
      <ChatComposerVoiceOverlayCard
        {...voiceOverlayParts.card.props}
      >
        <ChatComposerVoiceOverlayLabel
          {...voiceOverlayParts.label.props}
        />
        {voiceOverlayParts.transcript.shouldRender ? (
          <ChatComposerVoiceOverlayTranscript
            {...voiceOverlayParts.transcript.props}
          />
        ) : null}
      </ChatComposerVoiceOverlayCard>
    </ChatComposerVoiceOverlayContainer>
  );
}

export function ChatComposerVoiceOverlayContainer({
  style,
  pointerEvents,
  children,
}: ChatComposerVoiceOverlayContainerProps) {
  return (
    <View
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </View>
  );
}

export function ChatComposerVoiceOverlayCard({
  style,
  children,
}: ChatComposerVoiceOverlayCardProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatComposerVoiceOverlayLabel({
  style,
  text,
}: ChatComposerVoiceOverlayLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
  );
}

export function ChatComposerVoiceOverlayTranscript({
  style,
  numberOfLines,
  text,
}: ChatComposerVoiceOverlayTranscriptProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
    >
      {text}
    </Text>
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
  const handsFreeControlsParts = createChatComposerHandsFreeControlsMobilePropsParts({
    isVisible,
    status,
    controlState,
    onWake,
    onSleep,
    onResume,
    onPause,
    controlPressedOpacity,
    styles,
  });

  if (!handsFreeControlsParts.shouldRender) return null;

  return (
    <>
      <ChatComposerHandsFreeStatusRow
        {...handsFreeControlsParts.statusRow.props}
      >
        {handsFreeControlsParts.statusRow.status}
      </ChatComposerHandsFreeStatusRow>
      <ChatComposerHandsFreeControlsRow
        {...handsFreeControlsParts.controlsRow.props}
      >
        <ChatComposerHandsFreeControlButton
          {...handsFreeControlsParts.primaryControl.touchable.props}
        >
          <ChatComposerHandsFreeControlLabel
            {...handsFreeControlsParts.primaryControl.label.props}
          />
        </ChatComposerHandsFreeControlButton>
        <ChatComposerHandsFreeControlButton
          {...handsFreeControlsParts.secondaryControl.touchable.props}
        >
          <ChatComposerHandsFreeControlLabel
            {...handsFreeControlsParts.secondaryControl.label.props}
          />
        </ChatComposerHandsFreeControlButton>
      </ChatComposerHandsFreeControlsRow>
    </>
  );
}

export function ChatComposerHandsFreeStatusRow({
  style,
  children,
}: ChatComposerHandsFreeStatusRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatComposerHandsFreeControlsRow({
  style,
  children,
}: ChatComposerHandsFreeControlsRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatComposerHandsFreeControlButton({
  style,
  onPress,
  activeOpacity,
  accessibilityRole,
  accessibilityLabel,
  children,
}: ChatComposerHandsFreeControlButtonProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerHandsFreeControlLabel({
  style,
  text,
}: ChatComposerHandsFreeControlLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
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
  const iconButtonParts = createChatComposerIconButtonMobilePropsParts({
    shouldRender,
    renderState,
    onPress,
    activeOpacity,
    style,
    activeStyle,
  });

  if (!iconButtonParts.shouldRender) return null;

  return (
    <ChatComposerIconButtonTouchable
      {...iconButtonParts.touchable.props}
    >
      <ChatComposerIconButtonIcon
        {...iconButtonParts.icon.props}
      />
    </ChatComposerIconButtonTouchable>
  );
}

export function ChatComposerIconButtonTouchable({
  style,
  onPress,
  activeOpacity,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  'aria-checked': ariaChecked,
  children,
}: ChatComposerIconButtonTouchableProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      aria-checked={ariaChecked}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerIconButtonIcon({
  name,
  size,
  color,
}: ChatComposerIconButtonIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatComposerLabeledActionButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  styles,
}: ChatComposerLabeledActionButtonProps) {
  const actionButtonParts = createChatComposerLabeledActionButtonMobilePropsParts({
    shouldRender,
    renderState,
    onPress,
    activeOpacity,
    styles,
  });

  if (!actionButtonParts.shouldRender) return null;

  return (
    <ChatComposerLabeledActionButtonTouchable
      {...actionButtonParts.touchable.props}
    >
      <ChatComposerLabeledActionButtonIcon
        {...actionButtonParts.icon.props}
      />
      {actionButtonParts.label.shouldRender ? (
        <ChatComposerLabeledActionButtonLabel
          {...actionButtonParts.label.props}
        />
      ) : null}
    </ChatComposerLabeledActionButtonTouchable>
  );
}

export function ChatComposerLabeledActionButtonTouchable({
  style,
  onPress,
  activeOpacity,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  children,
}: ChatComposerLabeledActionButtonTouchableProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerLabeledActionButtonIcon({
  name,
  size,
  color,
}: ChatComposerLabeledActionButtonIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatComposerLabeledActionButtonLabel({
  style,
  text,
}: ChatComposerLabeledActionButtonLabelProps) {
  return (
    <Text style={style}>
      {text}
    </Text>
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
  const micButtonParts = createChatComposerMicButtonMobilePropsParts({
    renderState,
    onPressIn,
    onPressOut,
    onPress,
    webPressedStyle,
    styles,
  });

  return (
    <ChatComposerMicButtonPressable
      {...micButtonParts.pressable.props}
    >
      <ChatComposerMicButtonIcon
        {...micButtonParts.icon.props}
      />
      <ChatComposerMicButtonLabel
        {...micButtonParts.label.props}
      />
    </ChatComposerMicButtonPressable>
  );
}

export function ChatComposerMicButtonPressable({
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  'aria-busy': ariaBusy,
  onPressIn,
  onPressOut,
  onPress,
  children,
}: ChatComposerMicButtonPressableProps) {
  return (
    <Pressable
      style={style}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      aria-busy={ariaBusy}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

export function ChatComposerMicButtonIcon({
  name,
  size,
  color,
}: ChatComposerMicButtonIconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
    />
  );
}

export function ChatComposerMicButtonLabel({
  style,
  selectable,
  text,
}: ChatComposerMicButtonLabelProps) {
  return (
    <Text
      style={style}
      selectable={selectable}
    >
      {text}
    </Text>
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
  const textEntryParts = createChatComposerTextEntryMobilePropsParts({
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
  });

  return (
    <>
      <ChatComposerTextEntryInput
        {...textEntryParts.input.props}
      />
      {textEntryParts.inputDescription.shouldRender ? (
        <ChatComposerTextEntryInputDescription
          {...textEntryParts.inputDescription.props}
        />
      ) : null}
      {textEntryParts.voiceStatusLiveRegion.shouldRender ? (
        <ChatComposerTextEntryVoiceStatusLiveRegion
          {...textEntryParts.voiceStatusLiveRegion.props}
        />
      ) : null}
    </>
  );
}

export const ChatComposerTextEntryInput = forwardRef<TextInput, Omit<ChatComposerTextEntryInputProps, 'ref'>>(function ChatComposerTextEntryInput({
  style,
  value,
  onChangeText,
  onKeyPress,
  accessibilityLabel,
  accessibilityHint,
  'aria-describedby': ariaDescribedBy,
  placeholder,
  placeholderTextColor,
  multiline,
}, ref) {
  return (
    <TextInput
      ref={ref}
      style={style}
      value={value}
      onChangeText={onChangeText}
      onKeyPress={onKeyPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      aria-describedby={ariaDescribedBy}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      multiline={multiline}
    />
  );
});

export function ChatComposerTextEntryInputDescription({
  nativeID,
  style,
  text,
}: ChatComposerTextEntryInputDescriptionProps) {
  return (
    <Text
      nativeID={nativeID}
      style={style}
    >
      {text}
    </Text>
  );
}

export function ChatComposerTextEntryVoiceStatusLiveRegion({
  nativeID,
  style,
  accessibilityLiveRegion,
  'aria-live': ariaLive,
  text,
}: ChatComposerTextEntryVoiceStatusLiveRegionProps) {
  return (
    <Text
      nativeID={nativeID}
      style={style}
      accessibilityLiveRegion={accessibilityLiveRegion}
      aria-live={ariaLive}
    >
      {text}
    </Text>
  );
}

export function ChatMessageInlineActivity({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageInlineActivityProps) {
  const inlineActivityParts = createChatRuntimeInlineActivityMobilePropsParts({
    renderState,
    spinnerSource,
    style,
    spinnerStyle,
  });

  if (!inlineActivityParts.shouldRenderInlineActivity) return null;

  return (
    <ChatMessageInlineActivityContainer
      {...inlineActivityParts.container.props}
    >
      <ChatMessageInlineActivitySpinner
        {...inlineActivityParts.spinner.props}
      />
    </ChatMessageInlineActivityContainer>
  );
}

export function ChatMessageInlineActivityContainer({
  accessible,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  style,
  children,
}: ChatMessageInlineActivityContainerProps) {
  return (
    <View
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={style}
    >
      {children}
    </View>
  );
}

export function ChatMessageInlineActivitySpinner({
  source,
  style,
  resizeMode,
}: ChatMessageInlineActivitySpinnerProps) {
  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
    />
  );
}

export function ChatMessageTurnDurationBadge({
  renderState,
  style,
  liveStyle,
  textStyle,
  liveTextStyle,
}: ChatMessageTurnDurationBadgeProps) {
  const turnDurationBadgeParts = createChatRuntimeTurnDurationBadgeMobilePropsParts({
    renderState,
    style,
    liveStyle,
    textStyle,
    liveTextStyle,
  });

  if (!turnDurationBadgeParts.shouldRenderBadge) return null;

  return (
    <View
      accessible={turnDurationBadgeParts.container.accessible}
      accessibilityRole={turnDurationBadgeParts.container.accessibilityRole}
      accessibilityLabel={turnDurationBadgeParts.container.accessibilityLabel}
      style={turnDurationBadgeParts.container.style}
    >
      <Ionicons
        name={turnDurationBadgeParts.icon.name}
        size={turnDurationBadgeParts.icon.size}
        color={turnDurationBadgeParts.icon.color}
      />
      <Text
        style={turnDurationBadgeParts.label.style}
        numberOfLines={turnDurationBadgeParts.label.numberOfLines}
      >
        {turnDurationBadgeParts.label.text}
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
  const expandedContentParts = createChatRuntimeConversationExpandedContentMobilePropsParts({
    streamingRenderState,
    markdownContent,
    assetBaseUrl,
    assetAuthToken,
    spinnerSource,
    streamingStyles,
  });

  if (!expandedContentParts.shouldRenderStreamingContent) {
    return (
      <MarkdownRenderer
        content={expandedContentParts.markdown.content}
        assetBaseUrl={expandedContentParts.markdown.assetBaseUrl}
        assetAuthToken={expandedContentParts.markdown.assetAuthToken}
      />
    );
  }

  return (
    <>
      <View
        accessible={expandedContentParts.header.accessible}
        accessibilityRole={expandedContentParts.header.accessibilityRole}
        accessibilityLabel={expandedContentParts.header.accessibilityLabel}
        style={expandedContentParts.header.style}
      >
        <Ionicons
          name={expandedContentParts.icon.name}
          size={expandedContentParts.icon.size}
          color={expandedContentParts.icon.color}
        />
        <Text
          style={expandedContentParts.title.style}
          numberOfLines={expandedContentParts.title.numberOfLines}
        >
          {expandedContentParts.title.text}
        </Text>
        <Image
          source={expandedContentParts.spinner.source}
          style={expandedContentParts.spinner.style}
          resizeMode={expandedContentParts.spinner.resizeMode}
        />
        <View style={expandedContentParts.badge.style}>
          <Text style={expandedContentParts.badgeLabel.style}>
            {expandedContentParts.badgeLabel.text}
          </Text>
        </View>
      </View>
      <View style={expandedContentParts.body.style}>
        <Text style={expandedContentParts.text.style}>
          {expandedContentParts.text.text}
        </Text>
        <View style={expandedContentParts.caret.style} />
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
  const collapsedPreviewParts = createChatRuntimeConversationCollapsedPreviewMobilePropsParts({
    renderState,
    actionState,
    onPress,
    style,
    pressedStyle,
    textStyle,
  });

  return (
    <Pressable
      onPress={collapsedPreviewParts.pressable.onPress}
      disabled={collapsedPreviewParts.pressable.disabled}
      accessibilityRole={collapsedPreviewParts.pressable.accessibilityRole}
      accessibilityLabel={collapsedPreviewParts.pressable.accessibilityLabel}
      accessibilityHint={collapsedPreviewParts.pressable.accessibilityHint}
      accessibilityState={collapsedPreviewParts.pressable.accessibilityState}
      aria-expanded={collapsedPreviewParts.pressable.ariaExpanded}
      hitSlop={collapsedPreviewParts.pressable.hitSlop}
      style={collapsedPreviewParts.pressable.style}
    >
      <Text
        style={collapsedPreviewParts.text.style}
        numberOfLines={collapsedPreviewParts.text.numberOfLines}
      >
        {collapsedPreviewParts.text.text}
      </Text>
    </Pressable>
  );
}

export function ChatMessageConversationContent({
  contentDisplayMode,
  rowStyle,
  shouldRenderActionSlots,
  entries,
  expanded,
  collapsed,
}: ChatMessageConversationContentProps) {
  const conversationContentParts = createChatRuntimeConversationContentMobilePropsParts({
    contentDisplayMode,
    rowStyle,
    shouldRenderActionSlots,
    entries,
    expanded,
    collapsed,
  });

  if (conversationContentParts.expandedContent.shouldRender) {
    return (
      <ChatMessageContentRow
        {...conversationContentParts.expandedContent.props.row}
      >
        <ChatMessageExpandedContent
          {...conversationContentParts.expandedContent.props.content}
        />
      </ChatMessageContentRow>
    );
  }

  if (conversationContentParts.collapsedContent.shouldRender) {
    return (
      <ChatMessageContentRow
        {...conversationContentParts.collapsedContent.props.row}
      >
        <ChatMessageCollapsedPreview
          {...conversationContentParts.collapsedContent.props.preview}
        />
      </ChatMessageContentRow>
    );
  }

  return null;
}

export function ChatMessageContentRow({
  children,
  shouldRenderActionSlots,
  entries,
  rowStyle,
  bodyStyle,
}: ChatMessageContentRowProps) {
  const contentRowParts = createChatRuntimeMessageContentRowMobilePropsParts({
    shouldRenderActionSlots,
    entries,
    rowStyle,
    bodyStyle,
  });

  return (
    <ChatMessageContentRowContainer
      {...contentRowParts.row.props}
    >
      {contentRowParts.body.shouldRender ? (
        <ChatMessageContentBody
          {...contentRowParts.body.props}
        >
          {children}
        </ChatMessageContentBody>
      ) : children}
      <ChatMessageActionSlotList
        {...contentRowParts.actionSlotList}
      />
    </ChatMessageContentRowContainer>
  );
}

export function ChatMessageContentRowContainer({
  style,
  children,
}: ChatMessageContentRowContainerProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageContentBody({
  style,
  children,
}: ChatMessageContentBodyProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatMessageStandaloneActions({
  shouldRender,
  entries,
  rowStyle,
}: ChatMessageStandaloneActionsProps) {
  const standaloneActionsParts = createChatRuntimeMessageStandaloneActionsMobilePropsParts({
    shouldRender,
    entries,
    rowStyle,
  });

  return (
    <ChatMessageActionSlotList
      {...standaloneActionsParts.actionSlotList}
    />
  );
}

export function ChatMessageActionSlotList({
  shouldRender = true,
  entries,
  rowStyle,
}: ChatMessageActionSlotListProps) {
  const actionSlotListParts = createChatRuntimeMessageActionSlotListMobilePropsParts({
    shouldRender,
    entries,
    rowStyle,
  });

  if (!actionSlotListParts.shouldRenderList) return null;

  const content = actionSlotListParts.items.map(({ key, item }) => (
    <Fragment key={key}>
      {item}
    </Fragment>
  ));

  if (actionSlotListParts.row.shouldRender) {
    return (
      <ChatMessageActionSlotListRow
        {...actionSlotListParts.row.props}
      >
        {content}
      </ChatMessageActionSlotListRow>
    );
  }

  return <>{content}</>;
}

export function ChatMessageActionSlotListRow({
  style,
  children,
}: ChatMessageActionSlotListRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}
