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
  ChatMessageActionIconButtonParts['pressable']['content']['activityIndicator']['props'];

type ChatMessageActionIconButtonIconProps =
  ChatMessageActionIconButtonParts['pressable']['content']['icon']['props'];

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
  ChatRuntimeHeaderAgentSelectorParts['touchable']['content']['chip']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderAgentSelectorLabelProps =
  ChatRuntimeHeaderAgentSelectorParts['touchable']['content']['chip']['content']['label']['props'];

type ChatRuntimeHeaderAgentSelectorIconProps =
  ChatRuntimeHeaderAgentSelectorParts['touchable']['content']['chip']['content']['icon']['props'];

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
  ChatRuntimeHeaderIconButtonParts['touchable']['content']['iconContainer']['props'] & {
    children: ReactNode;
  };

type ChatRuntimeHeaderIconButtonIconProps =
  ChatRuntimeHeaderIconButtonParts['touchable']['content']['icon']['props'];

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
  ChatRuntimeHeaderConversationStatusParts['container']['content']['runningIndicator']['props'];

type ChatRuntimeHeaderConversationStatusLabelProps =
  ChatRuntimeHeaderConversationStatusParts['container']['content']['label']['props'];

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
  ChatRuntimeHeaderTurnDurationParts['container']['content']['icon']['props'];

type ChatRuntimeHeaderTurnDurationLabelProps =
  ChatRuntimeHeaderTurnDurationParts['container']['content']['label']['props'];

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

type ChatConversationHomeQuickStartsContainerPart = {
  props: ComponentProps<typeof View>;
};

type ChatConversationHomeQuickStartsContainerProps = {
  container: ChatConversationHomeQuickStartsContainerPart;
  children: ReactNode;
};

type ChatConversationHomeQuickStartSourcePillPart =
  | {
      shouldRender: false;
    }
  | {
      shouldRender: true;
      props: ComponentProps<typeof View>;
      icon: {
        props: ComponentProps<typeof Ionicons>;
      };
      label: {
        text: string;
        props: ComponentProps<typeof Text>;
      };
    };

type ChatConversationHomeQuickStartAddIconPart =
  | {
      shouldRender: false;
    }
  | {
      shouldRender: true;
      props: ComponentProps<typeof Ionicons>;
    };

type ChatConversationHomeQuickStartLeadingAccessoryProps = {
  sourcePill: ChatConversationHomeQuickStartSourcePillPart;
  addIcon: ChatConversationHomeQuickStartAddIconPart;
};

type ChatConversationHomeQuickStartCardPressablePart = {
  props: ComponentProps<typeof Pressable>;
};

type ChatConversationHomeQuickStartTextPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatConversationHomeQuickStartDescriptionPart =
  | {
      shouldRender: false;
    }
  | {
      shouldRender: true;
      text: string;
      props: ComponentProps<typeof Text>;
    };

type ChatConversationHomeQuickStartTextContentProps = {
  title: ChatConversationHomeQuickStartTextPart;
  description: ChatConversationHomeQuickStartDescriptionPart;
};

type ChatConversationHomeQuickStartActionButtonPressablePart = {
  props: ComponentProps<typeof Pressable>;
};

type ChatConversationHomeQuickStartActionButtonIconPart = {
  props: ComponentProps<typeof Ionicons>;
};

type ChatConversationHomeQuickStartActionButtonLabelPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatConversationHomeQuickStartActionButtonProps = {
  pressable: ChatConversationHomeQuickStartActionButtonPressablePart;
  icon: ChatConversationHomeQuickStartActionButtonIconPart;
  label: ChatConversationHomeQuickStartActionButtonLabelPart;
};

type ChatConversationHomeQuickStartActionsPart =
  | {
      shouldRender: false;
    }
  | {
      shouldRender: true;
      props: ComponentProps<typeof View>;
      edit: ChatConversationHomeQuickStartActionButtonProps;
      delete: ChatConversationHomeQuickStartActionButtonProps;
    };

type ChatConversationHomeQuickStartActionsProps = {
  actions: ChatConversationHomeQuickStartActionsPart;
};

type ChatConversationHomeQuickStartsEmptyStatePart =
  | {
      shouldRender: false;
    }
  | {
      shouldRender: true;
      text: string;
      props: ComponentProps<typeof Text>;
    };

type ChatConversationHomeQuickStartsEmptyStateProps = {
  emptyState: ChatConversationHomeQuickStartsEmptyStatePart;
};

type ChatConversationHomeQuickStartCardProps = {
  pressable: ChatConversationHomeQuickStartCardPressablePart;
  sourcePill: ChatConversationHomeQuickStartSourcePillPart;
  addIcon: ChatConversationHomeQuickStartAddIconPart;
  title: ChatConversationHomeQuickStartTextPart;
  description: ChatConversationHomeQuickStartDescriptionPart;
  actions: ChatConversationHomeQuickStartActionsPart;
};

type ChatConversationHomeQuickStartCardPart =
  ChatConversationHomeQuickStartCardProps & {
    key: string;
  };

type ChatConversationHomeQuickStartsGridPart = {
  shouldRender: boolean;
  props: ComponentProps<typeof View>;
  content: {
    items: readonly ChatConversationHomeQuickStartCardPart[];
  };
};

type ChatConversationHomeQuickStartsGridProps = {
  grid: ChatConversationHomeQuickStartsGridPart;
};

type ChatConversationHomeQuickStartsContentProps = {
  grid: ChatConversationHomeQuickStartsGridPart;
  emptyState: ChatConversationHomeQuickStartsEmptyStatePart;
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

type ChatConversationHomePromptEditorModalModalPart = {
  props: ComponentProps<typeof Modal>;
};

type ChatConversationHomePromptEditorModalKeyboardAvoidingViewPart = {
  props: ComponentProps<typeof KeyboardAvoidingView>;
};

type ChatConversationHomePromptEditorModalViewPart = {
  props: ComponentProps<typeof View>;
};

type ChatConversationHomePromptEditorModalFrameProps = {
  modal: ChatConversationHomePromptEditorModalModalPart;
  keyboardAvoidingView: ChatConversationHomePromptEditorModalKeyboardAvoidingViewPart;
  overlay: ChatConversationHomePromptEditorModalViewPart;
  content: ChatConversationHomePromptEditorModalViewPart;
  children: ReactNode;
};

type ChatConversationHomePromptEditorModalIconButtonPart = {
  props: ComponentProps<typeof TouchableOpacity>;
};

type ChatConversationHomePromptEditorModalIconPart = {
  props: ComponentProps<typeof Ionicons>;
};

type ChatConversationHomePromptEditorModalActionButtonPart = {
  props: ComponentProps<typeof TouchableOpacity>;
};

type ChatConversationHomePromptEditorModalActionsPart = {
  props: ComponentProps<typeof View>;
};

type ChatConversationHomePromptEditorModalHeaderPart = {
  props: ComponentProps<typeof View>;
};

type ChatConversationHomePromptEditorModalTextPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatConversationHomePromptEditorModalInputPart = {
  props: ComponentProps<typeof TextInput>;
};

type ChatConversationHomePromptEditorModalIconButtonProps = {
  button: ChatConversationHomePromptEditorModalIconButtonPart;
  icon: ChatConversationHomePromptEditorModalIconPart;
};

type ChatConversationHomePromptEditorModalHeaderProps = {
  header: ChatConversationHomePromptEditorModalHeaderPart;
  title: ChatConversationHomePromptEditorModalTextPart;
  closeButton: ChatConversationHomePromptEditorModalIconButtonPart;
  closeIcon: ChatConversationHomePromptEditorModalIconPart;
};

type ChatConversationHomePromptEditorModalFieldProps = {
  label: ChatConversationHomePromptEditorModalTextPart;
  input: ChatConversationHomePromptEditorModalInputPart;
};

type ChatConversationHomePromptEditorModalActionButtonProps = {
  button: ChatConversationHomePromptEditorModalActionButtonPart;
  label: ChatConversationHomePromptEditorModalTextPart;
};

type ChatConversationHomePromptEditorModalActionsProps = {
  actions: ChatConversationHomePromptEditorModalActionsPart;
  cancelButton: ChatConversationHomePromptEditorModalActionButtonPart;
  cancelLabel: ChatConversationHomePromptEditorModalTextPart;
  saveButton: ChatConversationHomePromptEditorModalActionButtonPart;
  saveLabel: ChatConversationHomePromptEditorModalTextPart;
};

type ChatConversationHomePromptEditorModalBodyProps =
  ChatConversationHomePromptEditorModalHeaderProps
  & {
    nameLabel: ChatConversationHomePromptEditorModalTextPart;
    nameInput: ChatConversationHomePromptEditorModalInputPart;
    contentLabel: ChatConversationHomePromptEditorModalTextPart;
    contentInput: ChatConversationHomePromptEditorModalInputPart;
  }
  & ChatConversationHomePromptEditorModalActionsProps;

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

type ChatMessageTurnDurationBadgeParts = ReturnType<typeof createChatRuntimeTurnDurationBadgeMobilePropsParts<
  ChatMessageTurnDurationBadgeProps['renderState'],
  ChatMessageTurnDurationBadgeProps['style'],
  ChatMessageTurnDurationBadgeProps['liveStyle'],
  ChatMessageTurnDurationBadgeProps['textStyle'],
  ChatMessageTurnDurationBadgeProps['liveTextStyle']
>>;

type ChatMessageTurnDurationBadgeContainerProps =
  ChatMessageTurnDurationBadgeParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageTurnDurationBadgeIconProps =
  ChatMessageTurnDurationBadgeParts['container']['content']['icon']['props'];

type ChatMessageTurnDurationBadgeLabelProps =
  ChatMessageTurnDurationBadgeParts['container']['content']['label']['props'];

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

type ChatMessageRetryStatusContent =
  ChatMessageRetryStatusParts['card']['content'];

type ChatMessageRetryStatusHeaderProps = {
  header: ChatMessageRetryStatusContent['header'];
};

type ChatMessageRetryStatusMetaProps = {
  meta: ChatMessageRetryStatusContent['meta'];
};

type ChatMessageRetryStatusViewProps =
  (ChatMessageRetryStatusContent['header']['props'] | ChatMessageRetryStatusContent['meta']['props']) & {
    children: ReactNode;
  };

type ChatMessageRetryStatusIconProps =
  ChatMessageRetryStatusContent['header']['content']['icon']['props'];

type ChatMessageRetryStatusTitleProps =
  ChatMessageRetryStatusContent['header']['content']['title']['props'];

type ChatMessageRetryStatusSpinnerProps =
  ChatMessageRetryStatusContent['header']['content']['spinner']['props'];

type ChatMessageRetryStatusTextProps =
  | ChatMessageRetryStatusContent['meta']['content']['attempt']['props']
  | ChatMessageRetryStatusContent['meta']['content']['countdown']['props']
  | ChatMessageRetryStatusContent['description']['props'];

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

type ChatMessageToolApprovalHeaderProps = {
  header: ChatMessageToolApprovalParts['header'];
  icon: ChatMessageToolApprovalParts['headerIcon'];
  title: ChatMessageToolApprovalParts['title'];
  spinner: ChatMessageToolApprovalParts['headerSpinner'];
};

type ChatMessageToolApprovalContentProps = {
  content: ChatMessageToolApprovalParts['content'];
  toolRow: ChatMessageToolApprovalParts['toolRow'];
  toolLabel: ChatMessageToolApprovalParts['toolLabel'];
  toolName: ChatMessageToolApprovalParts['toolName'];
  argumentsPreview: ChatMessageToolApprovalParts['argumentsPreview'];
  argumentsToggle: ChatMessageToolApprovalParts['argumentsToggle'];
  fullArguments: ChatMessageToolApprovalParts['fullArguments'];
  actions: ChatMessageToolApprovalParts['actions'];
  denyButton: ChatMessageToolApprovalParts['denyButton'];
  approveButton: ChatMessageToolApprovalParts['approveButton'];
};

type ChatMessageToolApprovalToolRowProps = {
  row: ChatMessageToolApprovalParts['toolRow'];
  label: ChatMessageToolApprovalParts['toolLabel'];
  name: ChatMessageToolApprovalParts['toolName'];
};

type ChatMessageToolApprovalArgumentsToggleContentProps = {
  content: ChatMessageToolApprovalParts['argumentsToggle']['content'];
};

type ChatMessageToolApprovalIconProps =
  | ChatMessageToolApprovalParts['headerIcon']['props']
  | ChatMessageToolApprovalParts['argumentsToggle']['content']['icon']['props']
  | ChatMessageToolApprovalParts['denyButton']['content']['icon']['props']
  | ChatMessageToolApprovalParts['approveButton']['content']['icon']['props'];

type ChatMessageToolApprovalArgumentsToggleBlockProps = {
  argumentsToggle: ChatMessageToolApprovalParts['argumentsToggle'];
};

type ChatMessageToolApprovalArgumentsToggleProps =
  ChatMessageToolApprovalParts['argumentsToggle']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolApprovalArgumentsToggleLabelProps =
  ChatMessageToolApprovalParts['argumentsToggle']['content']['label']['props'];

type ChatMessageToolApprovalActionLabelProps =
  | ChatMessageToolApprovalParts['denyButton']['content']['label']['props']
  | ChatMessageToolApprovalParts['approveButton']['content']['label']['props'];

type ChatMessageToolApprovalSpinnerProps =
  | ChatMessageToolApprovalParts['headerSpinner']['props']
  | ChatMessageToolApprovalParts['approveButton']['content']['spinner']['props'];

type ChatMessageToolApprovalTitleProps =
  ChatMessageToolApprovalParts['title']['props'];

type ChatMessageToolApprovalToolLabelProps =
  ChatMessageToolApprovalParts['toolLabel']['props'];

type ChatMessageToolApprovalToolNameProps =
  ChatMessageToolApprovalParts['toolName']['props'];

type ChatMessageToolApprovalArgumentsPreviewProps =
  ChatMessageToolApprovalParts['argumentsPreview']['props'];

type ChatMessageToolApprovalArgumentsPreviewBlockProps = {
  preview: ChatMessageToolApprovalParts['argumentsPreview'];
};

type ChatMessageToolApprovalFullArgumentsProps =
  ChatMessageToolApprovalParts['fullArguments']['text']['props'];

type ChatMessageToolApprovalFullArgumentsBlockProps = {
  fullArguments: ChatMessageToolApprovalParts['fullArguments'];
};

type ChatMessageToolApprovalFullArgumentsScrollProps =
  ChatMessageToolApprovalParts['fullArguments']['scroll']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolApprovalActionsProps =
  ChatMessageToolApprovalParts['actions']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolApprovalActionBarProps = {
  actions: ChatMessageToolApprovalParts['actions'];
  denyButton: ChatMessageToolApprovalParts['denyButton'];
  approveButton: ChatMessageToolApprovalParts['approveButton'];
};

type ChatMessageToolApprovalActionButtonProps = {
  children: ReactNode;
} & (
  | ChatMessageToolApprovalParts['denyButton']['props']
  | ChatMessageToolApprovalParts['approveButton']['props']
);

type ChatMessageToolApprovalDenyActionContentProps = {
  content: ChatMessageToolApprovalParts['denyButton']['content'];
};

type ChatMessageToolApprovalApproveActionContentProps = {
  content: ChatMessageToolApprovalParts['approveButton']['content'];
};

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

type ChatMessageDelegationContentProps =
  ChatMessageDelegationCardParts['card']['content'];

type ChatMessageDelegationHeaderProps =
  ChatMessageDelegationCardParts['card']['content']['header']['props'];

type ChatMessageDelegationTitleProps = {
  title: ChatMessageDelegationHeaderProps['title'];
};

type ChatMessageDelegationStatusBadgeProps = {
  badge: ChatMessageDelegationHeaderProps['statusBadge'];
  text: ChatMessageDelegationHeaderProps['statusText'];
};

type ChatMessageDelegationLiveTextProps = {
  liveText: ChatMessageDelegationHeaderProps['liveText'];
};

type ChatMessageDelegationSubtitleProps =
  ChatMessageDelegationCardParts['card']['content']['subtitle']['props'];

type ChatMessageDelegationSubtitleBlockProps = {
  subtitle: ChatMessageDelegationCardParts['card']['content']['subtitle'];
};

type ChatMessageDelegationMetaRowProps =
  ChatMessageDelegationCardParts['card']['content']['meta']['props'];

type ChatMessageDelegationMetaItemProps =
  ChatMessageDelegationMetaRowProps['items'][number]['props'];

type ChatMessageDelegationConversationPreviewProps =
  ChatMessageDelegationCardParts['card']['content']['conversationPreview']['props'];

type ChatMessageDelegationConversationPreviewBlockProps = {
  conversationPreview: ChatMessageDelegationCardParts['card']['content']['conversationPreview'];
};

type ChatMessageDelegationConversationPreviewBodyProps =
  ChatMessageDelegationConversationPreviewProps['container']['content'];

type ChatMessageDelegationConversationPreviewRowProps =
  ChatMessageDelegationConversationPreviewProps['container']['content']['rows'][number]['props'];

type ChatMessageDelegationConversationPreviewRoleProps =
  ChatMessageDelegationConversationPreviewRowProps['role'];

type ChatMessageDelegationConversationPreviewContentProps =
  ChatMessageDelegationConversationPreviewRowProps['content'];

type ChatMessageDelegationConversationPreviewTimestampProps = {
  timestamp: ChatMessageDelegationConversationPreviewRowProps['timestamp'];
};

type ChatMessageDelegationToolPreviewProps =
  ChatMessageDelegationCardParts['card']['content']['toolPreview']['props'];

type ChatMessageDelegationToolPreviewBlockProps = {
  toolPreview: ChatMessageDelegationCardParts['card']['content']['toolPreview'];
};

type ChatMessageDelegationToolPreviewBodyProps =
  ChatMessageDelegationToolPreviewProps['container']['content'];

type ChatMessageDelegationToolPreviewRowProps =
  ChatMessageDelegationToolPreviewProps['container']['content']['rows'][number]['props'];

type ChatMessageDelegationToolPreviewStatusIconProps = {
  statusIcon: ChatMessageDelegationToolPreviewRowProps['statusIcon'];
};

type ChatMessageDelegationToolPreviewNameProps =
  ChatMessageDelegationToolPreviewRowProps['name'];

type ChatMessageDelegationToolPreviewLabelProps =
  ChatMessageDelegationToolPreviewProps['container']['content']['label']['props'];

type ChatMessageDelegationConversationMorePreviewActionProps =
  Extract<ChatMessageDelegationConversationPreviewProps['container']['content']['moreAction'], { shouldRender: true }>['props'];

type ChatMessageDelegationToolMorePreviewActionProps =
  Extract<ChatMessageDelegationToolPreviewProps['container']['content']['moreAction'], { shouldRender: true }>['props'];

type ChatMessageDelegationMorePreviewActionBlockProps = {
  moreAction:
    | ChatMessageDelegationConversationPreviewProps['container']['content']['moreAction']
    | ChatMessageDelegationToolPreviewProps['container']['content']['moreAction'];
};

type ChatMessageDelegationMorePreviewActionProps =
  | ChatMessageDelegationConversationMorePreviewActionProps
  | ChatMessageDelegationToolMorePreviewActionProps;

type ChatMessageDelegationMorePreviewActionLabelProps =
  ChatMessageDelegationMorePreviewActionProps['label'];

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
  ChatMessageToolActivityGroupToggleParts['headerRow']['content']['countBadge']['props'];

type ChatMessageToolActivityGroupPreviewLineProps =
  ChatMessageToolActivityGroupToggleParts['headerRow']['content']['preview']['props'];

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
  | ChatMessageToolActivityGroupToggleParts['headerRow']['content']['leadingIcon']['props']
  | ChatMessageToolActivityGroupToggleParts['headerRow']['content']['toggleIcon']['props']
  | ChatMessageToolActivityGroupFooterParts['button']['content']['icon']['props'];

type ChatMessageToolActivityGroupFooterLabelProps =
  ChatMessageToolActivityGroupFooterParts['button']['content']['label']['props'];

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

type ChatMessageToolExecutionCompactRowParts = ReturnType<typeof createChatRuntimeToolExecutionCompactRowMobilePropsParts<
  ChatMessageToolExecutionCompactRowProps['renderState'],
  ChatMessageToolExecutionCompactRowProps['styles']
>>;

type ChatMessageToolExecutionCompactRowContainerProps =
  ChatMessageToolExecutionCompactRowParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionCompactRowIconCellProps =
  (
    | ChatMessageToolExecutionCompactRowParts['container']['content']['leadingIcon']['container']['props']
    | ChatMessageToolExecutionCompactRowParts['container']['content']['toggleIcon']['container']['props']
  ) & {
    children: ReactNode;
  };

type ChatMessageToolExecutionCompactRowIconProps =
  | ChatMessageToolExecutionCompactRowParts['container']['content']['leadingIcon']['icon']['props']
  | ChatMessageToolExecutionCompactRowParts['container']['content']['statusIndicator']['icon']['props']
  | ChatMessageToolExecutionCompactRowParts['container']['content']['toggleIcon']['icon']['props'];

type ChatMessageToolExecutionCompactRowNameProps =
  ChatMessageToolExecutionCompactRowParts['container']['content']['name']['props'];

type ChatMessageToolExecutionCompactRowStatusIndicatorProps =
  ChatMessageToolExecutionCompactRowParts['container']['content']['statusIndicator']['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionCompactRowSpinnerProps =
  ChatMessageToolExecutionCompactRowParts['container']['content']['statusIndicator']['spinner']['props'];

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

type ChatMessageToolExecutionCompactGroupParts = ReturnType<typeof createChatRuntimeToolExecutionCompactGroupMobilePropsParts<
  ChatMessageToolExecutionCompactGroupProps['renderState'],
  ChatMessageToolExecutionCompactGroupProps['onPress'],
  ChatMessageToolExecutionCompactGroupProps['styles']
>>;

type ChatMessageToolExecutionCompactGroupPressableProps =
  ChatMessageToolExecutionCompactGroupParts['container']['props'] & {
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

type ChatMessageToolExecutionCollapseControlParts = ReturnType<typeof createChatRuntimeToolExecutionCollapseControlMobilePropsParts<
  ChatMessageToolExecutionCollapseControlProps['renderState'],
  ChatMessageToolExecutionCollapseControlProps['onPress'],
  ChatMessageToolExecutionCollapseControlProps['styles']
>>;

type ChatMessageToolExecutionCollapseControlPressableProps =
  ChatMessageToolExecutionCollapseControlParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionCollapseControlIconProps =
  ChatMessageToolExecutionCollapseControlParts['container']['content']['icon']['props'];

type ChatMessageToolExecutionCollapseControlLabelProps =
  ChatMessageToolExecutionCollapseControlParts['container']['content']['label']['props'];

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

type ChatMessageToolExecutionExpandedGroupParts = ReturnType<typeof createChatRuntimeToolExecutionExpandedGroupMobilePropsParts<
  ChatMessageToolExecutionExpandedGroupProps['topCollapseRenderState'],
  ChatMessageToolExecutionExpandedGroupProps['bottomCollapseRenderState'],
  ChatMessageToolExecutionExpandedGroupProps['onCollapsePress'],
  NonNullable<ChatMessageToolExecutionExpandedGroupProps['emptyState']>,
  ChatMessageToolExecutionExpandedGroupProps['styles']
>>;

type ChatMessageToolExecutionExpandedGroupContainerProps =
  ChatMessageToolExecutionExpandedGroupParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionExpandedGroupCardProps =
  ChatMessageToolExecutionExpandedGroupParts['container']['content']['card']['props'] & {
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

type ChatMessageToolExecutionCopyButtonParts = ReturnType<typeof createChatRuntimeToolExecutionCopyButtonMobilePropsParts<
  ChatMessageToolExecutionCopyButtonProps['renderState'],
  ChatMessageToolExecutionCopyButtonProps['onPress'],
  ChatMessageToolExecutionCopyButtonProps['styles']
>>;

type ChatMessageToolExecutionCopyButtonPressableProps =
  ChatMessageToolExecutionCopyButtonParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionCopyButtonIconProps =
  ChatMessageToolExecutionCopyButtonParts['container']['content']['icon']['props'];

type ChatMessageToolExecutionCopyButtonLabelProps =
  ChatMessageToolExecutionCopyButtonParts['container']['content']['label']['props'];

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

type ChatMessageToolExecutionDetailHeaderParts = ReturnType<typeof createChatRuntimeToolExecutionDetailHeaderMobilePropsParts<
  ChatMessageToolExecutionDetailHeaderProps['renderState'],
  ChatMessageToolExecutionDetailHeaderProps['onPress'],
  ChatMessageToolExecutionDetailHeaderProps['styles']
>>;

type ChatMessageToolExecutionDetailHeaderPressableProps =
  ChatMessageToolExecutionDetailHeaderParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionDetailHeaderToolNameProps =
  ChatMessageToolExecutionDetailHeaderParts['container']['content']['toolName']['props'];

type ChatMessageToolExecutionDetailHeaderExpandHintProps =
  ChatMessageToolExecutionDetailHeaderParts['container']['content']['expandHint']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionDetailHeaderIconProps =
  ChatMessageToolExecutionDetailHeaderParts['container']['content']['expandHint']['content']['icon']['props'];

type ChatMessageToolExecutionDetailHeaderExpandLabelProps =
  ChatMessageToolExecutionDetailHeaderParts['container']['content']['expandHint']['content']['label']['props'];

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

type ChatMessageToolExecutionCallSectionParts = ReturnType<typeof createChatRuntimeToolExecutionCallSectionMobilePropsParts<
  ChatMessageToolExecutionCallSectionProps['renderState'],
  ChatMessageToolExecutionCallSectionProps['onHeaderPress'],
  ChatMessageToolExecutionCallSectionProps['styles']
>>;

type ChatMessageToolExecutionCallSectionContainerProps =
  ChatMessageToolExecutionCallSectionParts['container']['props'] & {
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

type ChatMessageToolExecutionResultBadgeParts = ReturnType<typeof createChatRuntimeToolExecutionResultBadgeMobilePropsParts<
  ChatMessageToolExecutionResultBadgeProps['badge'],
  ChatMessageToolExecutionResultBadgeProps['styles']
>>;

type ChatMessageToolExecutionResultBadgeContainerProps =
  ChatMessageToolExecutionResultBadgeParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionResultBadgeIconProps =
  ChatMessageToolExecutionResultBadgeParts['container']['content']['icon']['props'];

type ChatMessageToolExecutionResultBadgeLabelProps =
  ChatMessageToolExecutionResultBadgeParts['container']['content']['label']['props'];

type ChatMessageToolExecutionPendingResultStyles = {
  row: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPendingResultProps = {
  renderState: ToolExecutionDetailMobilePendingResultRenderState;
  styles: ChatMessageToolExecutionPendingResultStyles;
};

type ChatMessageToolExecutionPendingResultParts = ReturnType<typeof createChatRuntimeToolExecutionPendingResultMobilePropsParts<
  ChatMessageToolExecutionPendingResultProps['renderState'],
  ChatMessageToolExecutionPendingResultProps['styles']
>>;

type ChatMessageToolExecutionPendingResultContainerProps =
  ChatMessageToolExecutionPendingResultParts['container']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionPendingResultSpinnerProps =
  ChatMessageToolExecutionPendingResultParts['container']['content']['spinner']['props'];

type ChatMessageToolExecutionPendingResultLabelProps =
  ChatMessageToolExecutionPendingResultParts['container']['content']['label']['props'];

type ChatMessageToolExecutionEmptyStateProps = {
  renderState: ToolExecutionDetailMobileEmptyStateRenderState;
  style: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionEmptyStateParts = ReturnType<typeof createChatRuntimeToolExecutionEmptyStateMobilePropsParts<
  ChatMessageToolExecutionEmptyStateProps['renderState'],
  ChatMessageToolExecutionEmptyStateProps['style']
>>;

type ChatMessageToolExecutionEmptyStateLabelProps =
  ChatMessageToolExecutionEmptyStateParts['content']['label']['props'];

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
  | ChatMessageToolExecutionPayloadMetaParts['content']['label']['props']
  | ChatMessageToolExecutionPayloadMetaParts['content']['payloadType']['props'];

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

type ChatMessageToolExecutionResultHeaderParts = ReturnType<typeof createChatRuntimeToolExecutionResultHeaderMobilePropsParts<
  ChatMessageToolExecutionResultHeaderProps['payloadRenderState'],
  ChatMessageToolExecutionResultHeaderProps['resultBadge'],
  ChatMessageToolExecutionResultHeaderProps['copyButtonRenderState'],
  ChatMessageToolExecutionResultHeaderProps['onCopyPress'],
  ChatMessageToolExecutionResultHeaderProps['styles']
>>;

type ChatMessageToolExecutionResultHeaderViewProps =
  (
    | ChatMessageToolExecutionResultHeaderParts['header']['props']
    | ChatMessageToolExecutionResultHeaderParts['header']['content']['meta']['props']
  ) & {
    children: ReactNode;
  };

type ChatMessageToolExecutionResultCharacterCountProps =
  ChatMessageToolExecutionResultHeaderParts['header']['content']['meta']['content']['characterCount']['props'];

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

type ChatMessageToolExecutionPayloadBlockParts = ReturnType<typeof createChatRuntimeToolExecutionPayloadBlockMobilePropsParts<
  ChatMessageToolExecutionPayloadBlockProps['styles']
>>;

type ChatMessageToolExecutionPayloadPreviewProps =
  ChatMessageToolExecutionPayloadBlockParts['content']['preview']['props'];

type ChatMessageToolExecutionPayloadScrollProps =
  ChatMessageToolExecutionPayloadBlockParts['content']['scroll']['props'] & {
    children: ReactNode;
  };

type ChatMessageToolExecutionPayloadCodeProps =
  ChatMessageToolExecutionPayloadBlockParts['content']['scroll']['content']['code']['props'];

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

type ChatMessageToolExecutionPayloadSectionParts = ReturnType<typeof createChatRuntimeToolExecutionPayloadSectionMobilePropsParts<
  ChatMessageToolExecutionPayloadSectionProps['payloadRenderState'],
  ChatMessageToolExecutionPayloadSectionProps['copyButtonRenderState'],
  ChatMessageToolExecutionPayloadSectionProps['onCopyPress'],
  ChatMessageToolExecutionPayloadSectionProps['styles']
>>;

type ChatMessageToolExecutionPayloadSectionViewProps =
  (
    | ChatMessageToolExecutionPayloadSectionParts['section']['props']
    | ChatMessageToolExecutionPayloadSectionParts['section']['content']['headerRow']['props']
  ) & {
    children: ReactNode;
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

type ChatMessageToolExecutionErrorBlockParts = ReturnType<typeof createChatRuntimeToolExecutionErrorBlockMobilePropsParts<
  ChatMessageToolExecutionErrorBlockProps['renderState'],
  ChatMessageToolExecutionErrorBlockProps['copyButtonRenderState'],
  ChatMessageToolExecutionErrorBlockProps['onCopyPress'],
  ChatMessageToolExecutionErrorBlockProps['styles']
>>;

type ChatMessageToolExecutionErrorBlockViewProps =
  (
    | ChatMessageToolExecutionErrorBlockParts['section']['props']
    | ChatMessageToolExecutionErrorBlockParts['section']['content']['headerRow']['props']
  ) & {
    children: ReactNode;
  };

type ChatMessageToolExecutionErrorBlockTextProps =
  | ChatMessageToolExecutionErrorBlockParts['section']['content']['headerRow']['content']['label']['props']
  | ChatMessageToolExecutionErrorBlockParts['section']['content']['error']['props'];

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

type ChatMessageToolExecutionResultSectionParts = ReturnType<typeof createChatRuntimeToolExecutionResultSectionMobilePropsParts<
  ChatMessageToolExecutionResultSectionProps['payloadRenderState'],
  ChatMessageToolExecutionResultSectionProps['resultBadge'],
  ChatMessageToolExecutionResultSectionProps['copyButtonRenderState'],
  ChatMessageToolExecutionResultSectionProps['onCopyPress'],
  ChatMessageToolExecutionResultSectionProps['errorRenderState'],
  ChatMessageToolExecutionResultSectionProps['errorCopyButtonRenderState'],
  ChatMessageToolExecutionResultSectionProps['onErrorCopyPress'],
  ChatMessageToolExecutionResultSectionProps['styles']
>>;

type ChatMessageToolExecutionResultSectionItemProps =
  ChatMessageToolExecutionResultSectionParts['item']['props'] & {
    children: ReactNode;
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

type ChatMessageHistoryBannerTextPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatMessageHistoryBannerIconPart = {
  props: ComponentProps<typeof Ionicons>;
};

type ChatMessageHistoryBannerLoadButtonPart = {
  props: ComponentProps<typeof Pressable>;
  content: {
    icon: ChatMessageHistoryBannerIconPart;
    label: ChatMessageHistoryBannerTextPart;
  };
};

type ChatMessageHistoryBannerContainerPart = {
  props: ComponentProps<typeof View>;
  content: {
    summary: ChatMessageHistoryBannerTextPart;
    loadButton: ChatMessageHistoryBannerLoadButtonPart;
  };
};

type ChatMessageHistoryBannerContainerProps = {
  container: ChatMessageHistoryBannerContainerPart;
};

type ChatMessageHistoryBannerSummaryProps = {
  summary: ChatMessageHistoryBannerTextPart;
};

type ChatMessageHistoryBannerLoadButtonProps = {
  button: ChatMessageHistoryBannerLoadButtonPart;
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

type ChatMessageStepSummaryTextPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatMessageStepSummaryBadgePart = {
  props: ComponentProps<typeof View>;
  content: {
    label: ChatMessageStepSummaryTextPart;
  };
};

type ChatMessageStepSummaryHeaderPart = {
  props: ComponentProps<typeof View>;
  content: {
    title: ChatMessageStepSummaryTextPart;
    badge: ChatMessageStepSummaryBadgePart;
  };
};

type ChatMessageStepSummaryHeaderProps = {
  header: ChatMessageStepSummaryHeaderPart;
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
  ChatMessageScrollToBottomButtonParts['button']['content']['icon']['props'];

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
  ChatMessageLoadingStateParts['container']['content']['spinner']['props'];

type ChatMessageDebugPanelRow = ChatRuntimeDebugPanelsMobileRenderState['requestRows'][number];
type ChatMessageDebugPanelRowProps = ChatMessageDebugPanelRow & {
  props: {
    style: StyleProp<TextStyle>;
  };
};

type ChatMessageDebugPanelProps = {
  shouldRender: boolean;
  content: {
    rows: readonly ChatMessageDebugPanelRowProps[];
  };
  props: {
    style: StyleProp<ViewStyle>;
  };
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

type ChatMessageQueuePanelDockContainerProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatMessageQueuePanelDockProps = {
  shouldRender: boolean;
  panel: ChatMessageQueuePanelDockPanelProps;
  container: {
    props: Omit<ChatMessageQueuePanelDockContainerProps, 'children'>;
  };
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

type ChatMessageConnectionBannerParts = ReturnType<typeof createChatRuntimeConnectionBannerMobilePropsParts<
  ChatMessageConnectionBannerProps['renderState'],
  ChatMessageConnectionBannerProps['onRetry'],
  ChatMessageConnectionBannerProps['styles']
>>;

type ChatMessageConnectionBannerReconnectingBody =
  ChatMessageConnectionBannerParts['reconnecting']['container']['content']['body'];

type ChatMessageConnectionBannerReconnectingBodyContent =
  ChatMessageConnectionBannerReconnectingBody['content'];

type ChatMessageConnectionBannerFailedBody =
  ChatMessageConnectionBannerParts['failed']['container']['content']['body'];

type ChatMessageConnectionBannerFailedBodyContent =
  ChatMessageConnectionBannerFailedBody['content'];

type ChatMessageConnectionBannerReconnectingProps = {
  reconnecting: ChatMessageConnectionBannerParts['reconnecting'];
};

type ChatMessageConnectionBannerFailedProps = {
  failed: ChatMessageConnectionBannerParts['failed'];
};

type ChatMessageConnectionBannerContainerProps =
  | (ChatMessageConnectionBannerParts['reconnecting']['container']['props'] & {
    children: ReactNode;
  })
  | (ChatMessageConnectionBannerParts['failed']['container']['props'] & {
    children: ReactNode;
  });

type ChatMessageConnectionBannerContentProps =
  ChatMessageConnectionBannerReconnectingBody['props'] & {
    children: ReactNode;
  };

type ChatMessageConnectionBannerSpinnerProps =
  ChatMessageConnectionBannerReconnectingBodyContent['spinner']['props'];

type ChatMessageConnectionBannerIconProps =
  ChatMessageConnectionBannerFailedBodyContent['icon']['props'];

type ChatMessageConnectionBannerTextContainerProps =
  | (ChatMessageConnectionBannerReconnectingBodyContent['textContainer']['props'] & {
    children: ReactNode;
  })
  | (ChatMessageConnectionBannerFailedBodyContent['textContainer']['props'] & {
    children: ReactNode;
  });

type ChatMessageConnectionBannerTextProps =
  | ChatMessageConnectionBannerReconnectingBodyContent['textContainer']['content']['title']['props']
  | ChatMessageConnectionBannerReconnectingBodyContent['textContainer']['content']['subtitle']['props']
  | ChatMessageConnectionBannerFailedBodyContent['textContainer']['content']['title']['props']
  | ChatMessageConnectionBannerFailedBodyContent['textContainer']['content']['subtitle']['props']
  | ChatMessageConnectionBannerFailedBodyContent['retryButton']['content']['label']['props'];

type ChatMessageConnectionBannerRetryButtonProps =
  ChatMessageConnectionBannerFailedBodyContent['retryButton']['props'] & {
    children: ReactNode;
  };

type ChatMessageRuntimeDockStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  queuePanelStyle: ChatMessageQueuePanelDockContainerProps['style'];
  connectionBanner: ChatMessageConnectionBannerStyles;
  composer: ChatComposerRuntimeDockStyleSlots;
};

type ChatMessageRuntimeDockProps = {
  responseHistoryPanel: ChatMessageResponseHistoryPanelDockProps;
  scrollToBottomButton: Omit<ChatMessageScrollToBottomButtonProps, 'style'>;
  voiceOverlay: Omit<ChatComposerVoiceOverlayProps, 'styles'>;
  queuePanel: Omit<ChatMessageQueuePanelDockProps, 'container'>;
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
  runtimeSurface: {
    props: {
      styles: ChatMessageRuntimeSurfaceProps<TPrompt, TTask>['styles'];
    };
  };
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
  ChatComposerPendingImagesRailParts['scrollView']['content']['items'][number];

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
  ChatComposerHandsFreeControlsParts['controlsRow']['content']['primaryControl']['touchable']['props'] & {
    children: ReactNode;
  };

type ChatComposerHandsFreeControlLabelProps =
  ChatComposerHandsFreeControlsParts['controlsRow']['content']['primaryControl']['content']['label']['props'];

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
  ChatComposerIconButtonParts['touchable']['content']['icon']['props'];

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
  ChatComposerLabeledActionButtonParts['touchable']['content']['icon']['props'];

type ChatComposerLabeledActionButtonLabelProps =
  ChatComposerLabeledActionButtonParts['touchable']['content']['label']['props'];

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
  ChatComposerMicButtonParts['pressable']['content']['icon']['props'];

type ChatComposerMicButtonLabelProps =
  ChatComposerMicButtonParts['pressable']['content']['label']['props'];

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
  ChatComposerInputDockParts['area']['content']['row']['props'] & {
    children: ReactNode;
  };

type ChatComposerInputDockMicWrapperProps =
  Omit<ChatComposerInputDockParts['area']['content']['micWrapper']['props'], 'ref'> & {
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
  ChatMessageInlineActivityParts['container']['content']['spinner']['props'];

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

type ChatMessageExpandedContentTextPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatMessageExpandedContentBadgePart = {
  props: ComponentProps<typeof View>;
  content: {
    label: ChatMessageExpandedContentTextPart;
  };
};

type ChatMessageExpandedContentHeaderPart = {
  props: ComponentProps<typeof View>;
  content: {
    icon: {
      props: ComponentProps<typeof Ionicons>;
    };
    title: ChatMessageExpandedContentTextPart;
    spinner: {
      props: ComponentProps<typeof Image>;
    };
    badge: ChatMessageExpandedContentBadgePart;
  };
};

type ChatMessageExpandedContentHeaderProps = {
  header: ChatMessageExpandedContentHeaderPart;
};

type ChatMessageExpandedContentBodyPart = {
  props: ComponentProps<typeof View>;
  content: {
    text: ChatMessageExpandedContentTextPart;
    caret: {
      props: ComponentProps<typeof View>;
    };
  };
};

type ChatMessageExpandedContentBodyProps = {
  body: ChatMessageExpandedContentBodyPart;
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

  const pressableContent = actionIconButtonParts.pressable.content;

  return (
    <ChatMessageActionIconButtonPressable
      {...actionIconButtonParts.pressable.props}
    >
      {pressableContent.activityIndicator.shouldRender ? (
        <ChatMessageActionIconButtonActivityIndicator
          {...pressableContent.activityIndicator.props}
        />
      ) : pressableContent.icon.shouldRender ? (
        <ChatMessageActionIconButtonIcon
          {...pressableContent.icon.props}
        />
      ) : null}
    </ChatMessageActionIconButtonPressable>
  );
}

export function ChatMessageActionIconButtonPressable({
  children,
  ...props
}: ChatMessageActionIconButtonPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageActionIconButtonActivityIndicator(
  props: ChatMessageActionIconButtonActivityIndicatorProps
) {
  return <ActivityIndicator {...props} />;
}

export function ChatMessageActionIconButtonIcon(
  props: ChatMessageActionIconButtonIconProps
) {
  return <Ionicons {...props} />;
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
  runtimeSurface,
  ...chromePropsInput
}: ChatMessageRuntimeChromeSurfaceProps<TPrompt, TTask>) {
  const chatMessageRuntimeSurface = createChatMessageRuntimeChromeProps<TPrompt, TTask>(chromePropsInput);

  return (
    <ChatMessageRuntimeSurface
      {...chatMessageRuntimeSurface}
      {...runtimeSurface.props}
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
      <ChatRuntimeHeaderActionsRow {...headerParts.actionsRow.props}>
        <ChatRuntimeHeaderIconButton
          {...headerParts.backButton}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.pinButton}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
    headerRight: () => (
      <ChatRuntimeHeaderActionsRow {...headerParts.actionsRow.props}>
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

  const touchableContent = agentSelectorParts.touchable.content;
  const chipContent = touchableContent.chip.content;

  return (
    <ChatRuntimeHeaderAgentSelectorTouchable
      {...agentSelectorParts.touchable.props}
    >
      <ChatRuntimeHeaderAgentSelectorChip
        {...touchableContent.chip.props}
      >
        <ChatRuntimeHeaderAgentSelectorLabel
          {...chipContent.label.props}
        />
        <ChatRuntimeHeaderAgentSelectorIcon
          {...chipContent.icon.props}
        />
      </ChatRuntimeHeaderAgentSelectorChip>
    </ChatRuntimeHeaderAgentSelectorTouchable>
  );
}

export function ChatRuntimeHeaderAgentSelectorTouchable({
  children,
  ...props
}: ChatRuntimeHeaderAgentSelectorTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderAgentSelectorChip({
  children,
  ...props
}: ChatRuntimeHeaderAgentSelectorChipProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderAgentSelectorLabel({
  props,
  text,
}: ChatRuntimeHeaderAgentSelectorLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatRuntimeHeaderAgentSelectorIcon(props: ChatRuntimeHeaderAgentSelectorIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatRuntimeHeaderActionsRow({
  children,
  ...props
}: ChatRuntimeHeaderActionsRowProps) {
  return (
    <View {...props}>
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
  const iconButtonTouchable = iconButtonParts.touchable;

  if (!iconButtonTouchable.shouldRender) return null;

  const touchableContent = iconButtonTouchable.content;

  const icon = (
    <ChatRuntimeHeaderIconButtonIcon
      {...touchableContent.icon.props}
    />
  );

  return (
    <ChatRuntimeHeaderIconButtonTouchable
      {...iconButtonTouchable.props}
    >
      {touchableContent.iconContainer.shouldRender ? (
        <ChatRuntimeHeaderIconButtonIconContainer
          {...touchableContent.iconContainer.props}
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
  'aria-checked': ariaChecked,
  accessibilityState,
  children,
  ...props
}: ChatRuntimeHeaderIconButtonTouchableProps) {
  return (
    <TouchableOpacity
      {...props}
      accessibilityState={accessibilityState as AccessibilityState | undefined}
      aria-checked={ariaChecked as boolean | 'mixed' | undefined}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderIconButtonIconContainer({
  children,
  ...props
}: ChatRuntimeHeaderIconButtonIconContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderIconButtonIcon(props: ChatRuntimeHeaderIconButtonIconProps) {
  return (
    <Ionicons {...props} />
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
  const conversationStatusContainer = conversationStatusParts.container;

  if (!conversationStatusContainer.shouldRender) return null;

  const containerContent = conversationStatusContainer.content;

  return (
    <ChatRuntimeHeaderConversationStatusContainer
      {...conversationStatusContainer.props}
    >
      {containerContent.runningIndicator.shouldRender ? (
        <ChatRuntimeHeaderConversationStatusRunningIndicator
          {...containerContent.runningIndicator.props}
        />
      ) : null}
      <ChatRuntimeHeaderConversationStatusLabel
        {...containerContent.label.props}
      />
    </ChatRuntimeHeaderConversationStatusContainer>
  );
}

export function ChatRuntimeHeaderConversationStatusContainer({
  children,
  ...props
}: ChatRuntimeHeaderConversationStatusContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderConversationStatusRunningIndicator(
  props: ChatRuntimeHeaderConversationStatusRunningIndicatorProps,
) {
  return (
    <Image {...props} />
  );
}

export function ChatRuntimeHeaderConversationStatusLabel({
  props,
  text,
}: ChatRuntimeHeaderConversationStatusLabelProps) {
  return (
    <Text {...props}>
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
  const turnDurationContainer = turnDurationParts.container;

  if (!turnDurationContainer.shouldRender) return null;

  const containerContent = turnDurationContainer.content;

  return (
    <ChatRuntimeHeaderTurnDurationContainer
      {...turnDurationContainer.props}
    >
      <ChatRuntimeHeaderTurnDurationIcon
        {...containerContent.icon.props}
      />
      <ChatRuntimeHeaderTurnDurationLabel
        {...containerContent.label.props}
      />
    </ChatRuntimeHeaderTurnDurationContainer>
  );
}

export function ChatRuntimeHeaderTurnDurationContainer({
  children,
  ...props
}: ChatRuntimeHeaderTurnDurationContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderTurnDurationIcon(props: ChatRuntimeHeaderTurnDurationIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatRuntimeHeaderTurnDurationLabel({
  props,
  text,
}: ChatRuntimeHeaderTurnDurationLabelProps) {
  return (
    <Text {...props}>
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
  const quickStartsContainer = quickStartsParts.container;

  if (!quickStartsContainer.shouldRender) return null;

  return (
    <ChatConversationHomeQuickStartsContainer
      container={quickStartsContainer}
    >
      <ChatConversationHomeQuickStartsContent
        grid={quickStartsParts.grid}
        emptyState={quickStartsParts.emptyState}
      />
    </ChatConversationHomeQuickStartsContainer>
  );
}

export function ChatConversationHomeQuickStartsContainer({
  container,
  children,
}: ChatConversationHomeQuickStartsContainerProps) {
  return (
    <View {...container.props}>
      {children}
    </View>
  );
}

export function ChatConversationHomeQuickStartsContent({
  grid,
  emptyState,
}: ChatConversationHomeQuickStartsContentProps) {
  if (grid.shouldRender) {
    return (
      <ChatConversationHomeQuickStartsGrid
        grid={grid}
      />
    );
  }

  return (
    <ChatConversationHomeQuickStartsEmptyState
      emptyState={emptyState}
    />
  );
}

export function ChatConversationHomeQuickStartsGrid({
  grid,
}: ChatConversationHomeQuickStartsGridProps) {
  if (!grid.shouldRender) return null;

  return (
    <View {...grid.props}>
      {grid.content.items.map((item) => (
        <ChatConversationHomeQuickStartCard
          key={item.key}
          pressable={item.pressable}
          sourcePill={item.sourcePill}
          addIcon={item.addIcon}
          title={item.title}
          description={item.description}
          actions={item.actions}
        />
      ))}
    </View>
  );
}

export function ChatConversationHomeQuickStartCard({
  pressable,
  sourcePill,
  addIcon,
  title,
  description,
  actions,
}: ChatConversationHomeQuickStartCardProps) {
  return (
    <Pressable {...pressable.props}>
      <ChatConversationHomeQuickStartLeadingAccessory
        sourcePill={sourcePill}
        addIcon={addIcon}
      />
      <ChatConversationHomeQuickStartTextContent
        title={title}
        description={description}
      />
      <ChatConversationHomeQuickStartActions
        actions={actions}
      />
    </Pressable>
  );
}

export function ChatConversationHomeQuickStartsEmptyState({
  emptyState,
}: ChatConversationHomeQuickStartsEmptyStateProps) {
  if (!emptyState.shouldRender) return null;

  return (
    <Text {...emptyState.props}>
      {emptyState.text}
    </Text>
  );
}

export function ChatConversationHomeQuickStartActions({
  actions,
}: ChatConversationHomeQuickStartActionsProps) {
  if (!actions.shouldRender) return null;

  return (
    <View {...actions.props}>
      <ChatConversationHomeQuickStartActionButton
        pressable={actions.edit.pressable}
        icon={actions.edit.icon}
        label={actions.edit.label}
      />
      <ChatConversationHomeQuickStartActionButton
        pressable={actions.delete.pressable}
        icon={actions.delete.icon}
        label={actions.delete.label}
      />
    </View>
  );
}

export function ChatConversationHomeQuickStartLeadingAccessory({
  sourcePill,
  addIcon,
}: ChatConversationHomeQuickStartLeadingAccessoryProps) {
  if (sourcePill.shouldRender) {
    return (
      <View {...sourcePill.props}>
        <Ionicons {...sourcePill.icon.props} />
        <Text {...sourcePill.label.props}>
          {sourcePill.label.text}
        </Text>
      </View>
    );
  }

  if (addIcon.shouldRender) {
    return (
      <Ionicons {...addIcon.props} />
    );
  }

  return null;
}

export function ChatConversationHomeQuickStartTextContent({
  title,
  description,
}: ChatConversationHomeQuickStartTextContentProps) {
  return (
    <>
      <Text {...title.props}>
        {title.text}
      </Text>
      {description.shouldRender ? (
        <Text {...description.props}>
          {description.text}
        </Text>
      ) : null}
    </>
  );
}

export function ChatConversationHomeQuickStartActionButton({
  pressable,
  icon,
  label,
}: ChatConversationHomeQuickStartActionButtonProps) {
  return (
    <Pressable {...pressable.props}>
      <Ionicons {...icon.props} />
      <Text {...label.props}>{label.text}</Text>
    </Pressable>
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
    <ChatConversationHomePromptEditorModalFrame
      modal={modalParts.modal}
      keyboardAvoidingView={modalParts.keyboardAvoidingView}
      overlay={modalParts.overlay}
      content={modalParts.content}
    >
      <ChatConversationHomePromptEditorModalBody
        header={modalParts.header}
        title={modalParts.title}
        closeButton={modalParts.closeButton}
        closeIcon={modalParts.closeIcon}
        nameLabel={modalParts.nameLabel}
        nameInput={modalParts.nameInput}
        contentLabel={modalParts.contentLabel}
        contentInput={modalParts.contentInput}
        actions={modalParts.actions}
        cancelButton={modalParts.cancelButton}
        cancelLabel={modalParts.cancelLabel}
        saveButton={modalParts.saveButton}
        saveLabel={modalParts.saveLabel}
      />
    </ChatConversationHomePromptEditorModalFrame>
  );
}

export function ChatConversationHomePromptEditorModalBody({
  header,
  title,
  closeButton,
  closeIcon,
  nameLabel,
  nameInput,
  contentLabel,
  contentInput,
  actions,
  cancelButton,
  cancelLabel,
  saveButton,
  saveLabel,
}: ChatConversationHomePromptEditorModalBodyProps) {
  return (
    <>
      <ChatConversationHomePromptEditorModalHeader
        header={header}
        title={title}
        closeButton={closeButton}
        closeIcon={closeIcon}
      />

      <ChatConversationHomePromptEditorModalField
        label={nameLabel}
        input={nameInput}
      />

      <ChatConversationHomePromptEditorModalField
        label={contentLabel}
        input={contentInput}
      />

      <ChatConversationHomePromptEditorModalActions
        actions={actions}
        cancelButton={cancelButton}
        cancelLabel={cancelLabel}
        saveButton={saveButton}
        saveLabel={saveLabel}
      />
    </>
  );
}

export function ChatConversationHomePromptEditorModalFrame({
  modal,
  keyboardAvoidingView,
  overlay,
  content,
  children,
}: ChatConversationHomePromptEditorModalFrameProps) {
  return (
    <Modal {...modal.props}>
      <KeyboardAvoidingView {...keyboardAvoidingView.props}>
        <View {...overlay.props}>
          <View {...content.props}>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ChatConversationHomePromptEditorModalActions({
  actions,
  cancelButton,
  cancelLabel,
  saveButton,
  saveLabel,
}: ChatConversationHomePromptEditorModalActionsProps) {
  return (
    <View {...actions.props}>
      <ChatConversationHomePromptEditorModalActionButton
        button={cancelButton}
        label={cancelLabel}
      />
      <ChatConversationHomePromptEditorModalActionButton
        button={saveButton}
        label={saveLabel}
      />
    </View>
  );
}

export function ChatConversationHomePromptEditorModalHeader({
  header,
  title,
  closeButton,
  closeIcon,
}: ChatConversationHomePromptEditorModalHeaderProps) {
  return (
    <View {...header.props}>
      <Text {...title.props}>{title.text}</Text>
      <ChatConversationHomePromptEditorModalIconButton
        button={closeButton}
        icon={closeIcon}
      />
    </View>
  );
}

export function ChatConversationHomePromptEditorModalIconButton({
  button,
  icon,
}: ChatConversationHomePromptEditorModalIconButtonProps) {
  return (
    <TouchableOpacity {...button.props}>
      <Ionicons {...icon.props} />
    </TouchableOpacity>
  );
}

export function ChatConversationHomePromptEditorModalField({
  label,
  input,
}: ChatConversationHomePromptEditorModalFieldProps) {
  return (
    <>
      <Text {...label.props}>{label.text}</Text>
      <TextInput {...input.props} />
    </>
  );
}

export function ChatConversationHomePromptEditorModalActionButton({
  button,
  label,
}: ChatConversationHomePromptEditorModalActionButtonProps) {
  return (
    <TouchableOpacity {...button.props}>
      <Text {...label.props}>{label.text}</Text>
    </TouchableOpacity>
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
  children,
  ...props
}: ChatMessageSurfaceContainerProps) {
  return (
    <View {...props}>
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
      {threadItemParts.props.leadingActivity}
      {children}
      {threadItemParts.props.trailingActivity}
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
      {...threadSurfaceParts.item.props}
    >
      <ChatMessageSurface
        {...threadSurfaceParts.surface.props}
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
      {...surfaceParts.surface.props}
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
    ...runtimeThreadParts.bodySurface.body.props,
    createActionSet: createChatMessageActionSet,
  });

  return (
    <ChatMessageToolActivityGroupThreadSurface
      {...runtimeThreadParts.bodySurface.surface.props}
    >
      <ChatMessageThreadBody
        {...resolvedBody}
        {...runtimeThreadParts.bodySurface.bodyPanel.props}
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
  const threadListContent = threadListParts.content;

  return (
    <>
      {threadListContent.threads.map((thread) => (
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
  const retryStatusCard = retryStatusParts.card;

  if (!retryStatusCard.shouldRender) return null;

  const retryStatusContent = retryStatusCard.content;

  return (
    <ChatMessageRetryStatusCard
      {...retryStatusCard.props}
    >
      <ChatMessageRetryStatusHeader
        header={retryStatusContent.header}
      />
      <ChatMessageRetryStatusMeta
        meta={retryStatusContent.meta}
      />
      <ChatMessageRetryStatusText
        {...retryStatusContent.description.props}
      />
    </ChatMessageRetryStatusCard>
  );
}

export function ChatMessageRetryStatusHeader({
  header,
}: ChatMessageRetryStatusHeaderProps) {
  const headerContent = header.content;

  return (
    <ChatMessageRetryStatusView
      {...header.props}
    >
      <ChatMessageRetryStatusIcon
        {...headerContent.icon.props}
      />
      <ChatMessageRetryStatusTitle
        {...headerContent.title.props}
      />
      <ChatMessageRetryStatusSpinner
        {...headerContent.spinner.props}
      />
    </ChatMessageRetryStatusView>
  );
}

export function ChatMessageRetryStatusMeta({
  meta,
}: ChatMessageRetryStatusMetaProps) {
  const metaContent = meta.content;

  return (
    <ChatMessageRetryStatusView
      {...meta.props}
    >
      <ChatMessageRetryStatusText
        {...metaContent.attempt.props}
      />
      <ChatMessageRetryStatusText
        {...metaContent.countdown.props}
      />
    </ChatMessageRetryStatusView>
  );
}

export function ChatMessageRetryStatusCard({
  children,
  ...props
}: ChatMessageRetryStatusCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageRetryStatusView({
  children,
  ...props
}: ChatMessageRetryStatusViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageRetryStatusIcon(
  props: ChatMessageRetryStatusIconProps
) {
  return <Ionicons {...props} />;
}

export function ChatMessageRetryStatusSpinner(
  props: ChatMessageRetryStatusSpinnerProps
) {
  return <ActivityIndicator {...props} />;
}

export function ChatMessageRetryStatusTitle({
  text,
  ...props
}: ChatMessageRetryStatusTitleProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageRetryStatusText({
  text,
  ...props
}: ChatMessageRetryStatusTextProps) {
  return (
    <Text {...props}>
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
      <ChatMessageToolApprovalHeader
        header={toolApprovalParts.header}
        icon={toolApprovalParts.headerIcon}
        title={toolApprovalParts.title}
        spinner={toolApprovalParts.headerSpinner}
      />
      <ChatMessageToolApprovalContent
        content={toolApprovalParts.content}
        toolRow={toolApprovalParts.toolRow}
        toolLabel={toolApprovalParts.toolLabel}
        toolName={toolApprovalParts.toolName}
        argumentsPreview={toolApprovalParts.argumentsPreview}
        argumentsToggle={toolApprovalParts.argumentsToggle}
        fullArguments={toolApprovalParts.fullArguments}
        actions={toolApprovalParts.actions}
        denyButton={toolApprovalParts.denyButton}
        approveButton={toolApprovalParts.approveButton}
      />
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalContent({
  content,
  toolRow,
  toolLabel,
  toolName,
  argumentsPreview,
  argumentsToggle,
  fullArguments,
  actions,
  denyButton,
  approveButton,
}: ChatMessageToolApprovalContentProps) {
  return (
    <ChatMessageToolApprovalView
      {...content.props}
    >
      <ChatMessageToolApprovalToolRow
        row={toolRow}
        label={toolLabel}
        name={toolName}
      />
      <ChatMessageToolApprovalArgumentsPreviewBlock
        preview={argumentsPreview}
      />
      <ChatMessageToolApprovalArgumentsToggleBlock
        argumentsToggle={argumentsToggle}
      />
      <ChatMessageToolApprovalFullArgumentsBlock
        fullArguments={fullArguments}
      />
      <ChatMessageToolApprovalActionBar
        actions={actions}
        denyButton={denyButton}
        approveButton={approveButton}
      />
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalToolRow({
  row,
  label,
  name,
}: ChatMessageToolApprovalToolRowProps) {
  return (
    <ChatMessageToolApprovalView
      {...row.props}
    >
      <ChatMessageToolApprovalToolLabel
        {...label.props}
      />
      <ChatMessageToolApprovalToolName
        {...name.props}
      />
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalArgumentsToggleBlock({
  argumentsToggle,
}: ChatMessageToolApprovalArgumentsToggleBlockProps) {
  return (
    <ChatMessageToolApprovalArgumentsToggle
      {...argumentsToggle.props}
    >
      <ChatMessageToolApprovalArgumentsToggleContent
        content={argumentsToggle.content}
      />
    </ChatMessageToolApprovalArgumentsToggle>
  );
}

export function ChatMessageToolApprovalArgumentsToggleContent({
  content,
}: ChatMessageToolApprovalArgumentsToggleContentProps) {
  return (
    <>
      <ChatMessageToolApprovalIcon
        {...content.icon.props}
      />
      <ChatMessageToolApprovalArgumentsToggleLabel
        {...content.label.props}
      />
    </>
  );
}

export function ChatMessageToolApprovalHeader({
  header,
  icon,
  title,
  spinner,
}: ChatMessageToolApprovalHeaderProps) {
  return (
    <ChatMessageToolApprovalView
      {...header.props}
    >
      <ChatMessageToolApprovalIcon
        {...icon.props}
      />
      <ChatMessageToolApprovalTitle
        {...title.props}
      />
      {spinner.shouldRender ? (
        <ChatMessageToolApprovalSpinner
          {...spinner.props}
        />
      ) : null}
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalDenyActionContent({
  content,
}: ChatMessageToolApprovalDenyActionContentProps) {
  return (
    <>
      <ChatMessageToolApprovalIcon
        {...content.icon.props}
      />
      <ChatMessageToolApprovalActionLabel
        {...content.label.props}
      />
    </>
  );
}

export function ChatMessageToolApprovalApproveActionContent({
  content,
}: ChatMessageToolApprovalApproveActionContentProps) {
  return (
    <>
      {content.spinner.shouldRender ? (
        <ChatMessageToolApprovalSpinner
          {...content.spinner.props}
        />
      ) : content.icon.shouldRender ? (
        <ChatMessageToolApprovalIcon
          {...content.icon.props}
        />
      ) : null}
      <ChatMessageToolApprovalActionLabel
        {...content.label.props}
      />
    </>
  );
}

export function ChatMessageToolApprovalView({
  children,
  ...props
}: ChatMessageToolApprovalViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolApprovalIcon(props: ChatMessageToolApprovalIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolApprovalSpinner(props: ChatMessageToolApprovalSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageToolApprovalTitle({
  props,
  text,
}: ChatMessageToolApprovalTitleProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalToolLabel({
  props,
  text,
}: ChatMessageToolApprovalToolLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalToolName({
  props,
  text,
}: ChatMessageToolApprovalToolNameProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalArgumentsPreview({
  props,
  text,
}: ChatMessageToolApprovalArgumentsPreviewProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalArgumentsPreviewBlock({
  preview,
}: ChatMessageToolApprovalArgumentsPreviewBlockProps) {
  if (!preview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolApprovalArgumentsPreview
      {...preview.props}
    />
  );
}

export function ChatMessageToolApprovalFullArgumentsBlock({
  fullArguments,
}: ChatMessageToolApprovalFullArgumentsBlockProps) {
  if (!fullArguments.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolApprovalFullArgumentsScroll
      {...fullArguments.scroll.props}
    >
      <ChatMessageToolApprovalFullArguments
        {...fullArguments.text.props}
      />
    </ChatMessageToolApprovalFullArgumentsScroll>
  );
}

export function ChatMessageToolApprovalFullArguments({
  props,
  text,
}: ChatMessageToolApprovalFullArgumentsProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalFullArgumentsScroll({
  children,
  ...props
}: ChatMessageToolApprovalFullArgumentsScrollProps) {
  return (
    <ScrollView {...props}>
      {children}
    </ScrollView>
  );
}

export function ChatMessageToolApprovalActions({
  children,
  ...props
}: ChatMessageToolApprovalActionsProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolApprovalActionButton({
  children,
  ...props
}: ChatMessageToolApprovalActionButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatMessageToolApprovalActionBar({
  actions,
  denyButton,
  approveButton,
}: ChatMessageToolApprovalActionBarProps) {
  return (
    <ChatMessageToolApprovalActions
      {...actions.props}
    >
      <ChatMessageToolApprovalActionButton
        {...denyButton.props}
      >
        <ChatMessageToolApprovalDenyActionContent
          content={denyButton.content}
        />
      </ChatMessageToolApprovalActionButton>
      <ChatMessageToolApprovalActionButton
        {...approveButton.props}
      >
        <ChatMessageToolApprovalApproveActionContent
          content={approveButton.content}
        />
      </ChatMessageToolApprovalActionButton>
    </ChatMessageToolApprovalActions>
  );
}

export function ChatMessageToolApprovalArgumentsToggle({
  children,
  ...props
}: ChatMessageToolApprovalArgumentsToggleProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolApprovalArgumentsToggleLabel({
  props,
  text,
}: ChatMessageToolApprovalArgumentsToggleLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalActionLabel({
  props,
  text,
}: ChatMessageToolApprovalActionLabelProps) {
  return (
    <Text {...props}>
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
    <View {...line.props}>
      <ChatMessageDelegationConversationPreviewRole
        {...role}
      />
      <ChatMessageDelegationConversationPreviewContent
        {...content}
      />
      <ChatMessageDelegationConversationPreviewTimestamp
        timestamp={timestamp}
      />
    </View>
  );
}

export function ChatMessageDelegationConversationPreviewRole({
  props,
  text,
}: ChatMessageDelegationConversationPreviewRoleProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewContent({
  props,
  text,
}: ChatMessageDelegationConversationPreviewContentProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewTimestamp({
  timestamp,
}: ChatMessageDelegationConversationPreviewTimestampProps) {
  if (!timestamp.shouldRender) return null;

  return (
    <Text
      {...timestamp.props}
    >
      {timestamp.text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewBlock({
  conversationPreview,
}: ChatMessageDelegationConversationPreviewBlockProps) {
  if (!conversationPreview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationConversationPreview
      {...conversationPreview.props}
    />
  );
}

export function ChatMessageDelegationConversationPreview({
  container,
}: ChatMessageDelegationConversationPreviewProps) {
  return (
    <View {...container.props}>
      <ChatMessageDelegationConversationPreviewBody
        {...container.content}
      />
    </View>
  );
}

export function ChatMessageDelegationConversationPreviewBody({
  rows,
  moreAction,
}: ChatMessageDelegationConversationPreviewBodyProps) {
  return (
    <>
      {rows.map((row) => (
        <ChatMessageDelegationConversationPreviewRow
          key={row.key}
          {...row.props}
        />
      ))}
      <ChatMessageDelegationMorePreviewActionBlock
        moreAction={moreAction}
      />
    </>
  );
}

export function ChatMessageDelegationToolPreviewRow({
  line,
  statusIcon,
  name,
}: ChatMessageDelegationToolPreviewRowProps) {
  return (
    <View
      {...line.props}
    >
      <ChatMessageDelegationToolPreviewStatusIcon
        statusIcon={statusIcon}
      />
      <ChatMessageDelegationToolPreviewName
        {...name}
      />
    </View>
  );
}

export function ChatMessageDelegationToolPreviewName({
  props,
  text,
}: ChatMessageDelegationToolPreviewNameProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewStatusIcon({
  statusIcon,
}: ChatMessageDelegationToolPreviewStatusIconProps) {
  return (
    <View
      {...statusIcon.props}
    >
      {statusIcon.spinner.shouldRender ? (
        <ActivityIndicator
          {...statusIcon.spinner.props}
        />
      ) : statusIcon.icon.shouldRender ? (
        <Ionicons
          {...statusIcon.icon.props}
        />
      ) : null}
    </View>
  );
}

export function ChatMessageDelegationMorePreviewActionBlock({
  moreAction,
}: ChatMessageDelegationMorePreviewActionBlockProps) {
  if (!moreAction.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationMorePreviewAction
      {...moreAction.props}
    />
  );
}

export function ChatMessageDelegationMorePreviewAction({
  button,
  label,
}: ChatMessageDelegationMorePreviewActionProps) {
  return (
    <Pressable
      {...button.props}
    >
      <ChatMessageDelegationMorePreviewActionLabel
        {...label}
      />
    </Pressable>
  );
}

export function ChatMessageDelegationMorePreviewActionLabel({
  props,
  text,
}: ChatMessageDelegationMorePreviewActionLabelProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
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
    <View {...container.props}>
      <ChatMessageDelegationTitle
        title={title}
      />
      <ChatMessageDelegationStatusBadge
        badge={statusBadge}
        text={statusText}
      />
      <ChatMessageDelegationLiveText
        liveText={liveText}
      />
    </View>
  );
}

export function ChatMessageDelegationTitle({
  title,
}: ChatMessageDelegationTitleProps) {
  return (
    <Text
      {...title.props}
    >
      {title.text}
    </Text>
  );
}

export function ChatMessageDelegationStatusBadge({
  badge,
  text,
}: ChatMessageDelegationStatusBadgeProps) {
  return (
    <View {...badge.props}>
      <Text
        {...text.props}
      >
        {text.text}
      </Text>
    </View>
  );
}

export function ChatMessageDelegationLiveText({
  liveText,
}: ChatMessageDelegationLiveTextProps) {
  if (!liveText.shouldRender) {
    return null;
  }

  return (
    <Text {...liveText.props}>
      {liveText.text}
    </Text>
  );
}

export function ChatMessageDelegationMetaItem({
  props,
  text,
}: ChatMessageDelegationMetaItemProps) {
  return (
    <Text
      {...props}
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
    <View {...container.props}>
      {items.map((metaItem) => (
        <ChatMessageDelegationMetaItem
          key={metaItem.key}
          {...metaItem.props}
        />
      ))}
    </View>
  );
}

export function ChatMessageDelegationSubtitleBlock({
  subtitle,
}: ChatMessageDelegationSubtitleBlockProps) {
  if (!subtitle.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationSubtitle
      {...subtitle.props}
    />
  );
}

export function ChatMessageDelegationSubtitle({
  props,
  text,
}: ChatMessageDelegationSubtitleProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewLabel({
  props,
  text,
}: ChatMessageDelegationToolPreviewLabelProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewBlock({
  toolPreview,
}: ChatMessageDelegationToolPreviewBlockProps) {
  if (!toolPreview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationToolPreview
      {...toolPreview.props}
    />
  );
}

export function ChatMessageDelegationToolPreview({
  container,
}: ChatMessageDelegationToolPreviewProps) {
  return (
    <View {...container.props}>
      <ChatMessageDelegationToolPreviewBody
        {...container.content}
      />
    </View>
  );
}

export function ChatMessageDelegationToolPreviewBody({
  label,
  rows,
  moreAction,
}: ChatMessageDelegationToolPreviewBodyProps) {
  return (
    <>
      <ChatMessageDelegationToolPreviewLabel
        {...label.props}
      />
      {rows.map((row) => (
        <ChatMessageDelegationToolPreviewRow
          key={row.key}
          {...row.props}
        />
      ))}
      <ChatMessageDelegationMorePreviewActionBlock
        moreAction={moreAction}
      />
    </>
  );
}

export function ChatMessageDelegationContent({
  header,
  subtitle,
  meta,
  conversationPreview,
  toolPreview,
}: ChatMessageDelegationContentProps) {
  return (
    <>
      <ChatMessageDelegationHeader
        {...header.props}
      />
      <ChatMessageDelegationSubtitleBlock
        subtitle={subtitle}
      />
      <ChatMessageDelegationMetaRow
        {...meta.props}
      />
      <ChatMessageDelegationConversationPreviewBlock
        conversationPreview={conversationPreview}
      />
      <ChatMessageDelegationToolPreviewBlock
        toolPreview={toolPreview}
      />
    </>
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
  const cardContent = delegationCardParts.card.content;

  return (
    <View
      {...delegationCardParts.card.props}
    >
      <ChatMessageDelegationContent
        {...cardContent}
      />
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
  const toggleHeaderRowContent = toggleParts.headerRow.content;

  return (
    <Pressable
      {...toggleParts.pressable.props}
    >
      <View {...toggleParts.headerRow.props}>
        <ChatMessageToolActivityGroupIcon
          {...toggleHeaderRowContent.leadingIcon.props}
        />
        {toggleHeaderRowContent.countBadge.shouldRender ? (
          <ChatMessageToolActivityGroupCountBadge
            {...toggleHeaderRowContent.countBadge.props}
          />
        ) : null}
        <ChatMessageToolActivityGroupPreviewLine
          {...toggleHeaderRowContent.preview.props}
        />
        <ChatMessageToolActivityGroupIcon
          {...toggleHeaderRowContent.toggleIcon.props}
        />
      </View>
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupIcon(props: ChatMessageToolActivityGroupIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolActivityGroupCountBadge({
  container,
  label,
}: ChatMessageToolActivityGroupCountBadgeProps) {
  return (
    <View {...container.props}>
      <Text {...label.props}>
        {label.text}
      </Text>
    </View>
  );
}

export function ChatMessageToolActivityGroupPreviewLine({
  props,
  text,
}: ChatMessageToolActivityGroupPreviewLineProps) {
  return (
    <Text {...props}>
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
  const footerButtonContent = footerParts.button.content;

  return (
    <Pressable
      {...footerParts.button.props}
    >
      <ChatMessageToolActivityGroupIcon
        {...footerButtonContent.icon.props}
      />
      <ChatMessageToolActivityGroupFooterLabel
        {...footerButtonContent.label.props}
      />
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupFooterLabel({
  props,
  text,
}: ChatMessageToolActivityGroupFooterLabelProps) {
  return (
    <Text {...props}>
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
    <ChatMessageToolExecutionCompactGroupPressable
      {...compactGroupParts.container.props}
    >
      {children}
    </ChatMessageToolExecutionCompactGroupPressable>
  );
}

export function ChatMessageToolExecutionCompactGroupPressable({
  children,
  ...props
}: ChatMessageToolExecutionCompactGroupPressableProps) {
  return (
    <Pressable {...props}>
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
  const compactRowContent = compactRowParts.container.content;

  return (
    <ChatMessageToolExecutionCompactRowContainer
      {...compactRowParts.container.props}
    >
      <ChatMessageToolExecutionCompactRowIconCell
        {...compactRowContent.leadingIcon.container.props}
      >
        <ChatMessageToolExecutionCompactRowIcon
          {...compactRowContent.leadingIcon.icon.props}
        />
      </ChatMessageToolExecutionCompactRowIconCell>
      <ChatMessageToolExecutionCompactRowName
        {...compactRowContent.name.props}
      />
      <ChatMessageToolExecutionCompactRowStatusIndicator
        {...compactRowContent.statusIndicator.container.props}
      >
        {compactRowContent.statusIndicator.spinner.shouldRender ? (
          <ChatMessageToolExecutionCompactRowSpinner
            {...compactRowContent.statusIndicator.spinner.props}
          />
        ) : compactRowContent.statusIndicator.icon.shouldRender ? (
          <ChatMessageToolExecutionCompactRowIcon
            {...compactRowContent.statusIndicator.icon.props}
          />
        ) : null}
      </ChatMessageToolExecutionCompactRowStatusIndicator>
      <ChatMessageToolExecutionCompactRowIconCell
        {...compactRowContent.toggleIcon.container.props}
      >
        <ChatMessageToolExecutionCompactRowIcon
          {...compactRowContent.toggleIcon.icon.props}
        />
      </ChatMessageToolExecutionCompactRowIconCell>
    </ChatMessageToolExecutionCompactRowContainer>
  );
}

export function ChatMessageToolExecutionCompactRowContainer({
  children,
  ...props
}: ChatMessageToolExecutionCompactRowContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCompactRowIconCell({
  children,
  ...props
}: ChatMessageToolExecutionCompactRowIconCellProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCompactRowIcon(props: ChatMessageToolExecutionCompactRowIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionCompactRowName({
  props,
  text,
}: ChatMessageToolExecutionCompactRowNameProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionCompactRowStatusIndicator({
  children,
  ...props
}: ChatMessageToolExecutionCompactRowStatusIndicatorProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCompactRowSpinner(props: ChatMessageToolExecutionCompactRowSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
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
  const compactListContent = compactListParts.group.content;

  if (!compactListParts.group.shouldRender) return null;

  return (
    <ChatMessageToolExecutionCompactGroup
      {...compactListParts.group.props}
    >
      {compactListContent.rows.map((row) => (
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
  const collapseControlContent = collapseControlParts.container.content;

  return (
    <ChatMessageToolExecutionCollapseControlPressable
      {...collapseControlParts.container.props}
    >
      <ChatMessageToolExecutionCollapseControlIcon
        {...collapseControlContent.icon.props}
      />
      <ChatMessageToolExecutionCollapseControlLabel
        {...collapseControlContent.label.props}
      />
    </ChatMessageToolExecutionCollapseControlPressable>
  );
}

export function ChatMessageToolExecutionCollapseControlPressable({
  children,
  ...props
}: ChatMessageToolExecutionCollapseControlPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCollapseControlIcon(props: ChatMessageToolExecutionCollapseControlIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionCollapseControlLabel({
  props,
  text,
}: ChatMessageToolExecutionCollapseControlLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const expandedGroupContent = expandedGroupParts.container.content;

  return (
    <ChatMessageToolExecutionExpandedGroupContainer
      {...expandedGroupParts.container.props}
    >
      <ChatMessageToolExecutionCollapseControl
        {...expandedGroupContent.topCollapseControl.props}
      />
      <ChatMessageToolExecutionExpandedGroupCard
        {...expandedGroupContent.card.props}
      >
        {children}
        {expandedGroupContent.emptyState.shouldRender ? expandedGroupContent.emptyState.props : null}
      </ChatMessageToolExecutionExpandedGroupCard>
      <ChatMessageToolExecutionCollapseControl
        {...expandedGroupContent.bottomCollapseControl.props}
      />
    </ChatMessageToolExecutionExpandedGroupContainer>
  );
}

export function ChatMessageToolExecutionExpandedGroupContainer({
  children,
  ...props
}: ChatMessageToolExecutionExpandedGroupContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionExpandedGroupCard({
  children,
  ...props
}: ChatMessageToolExecutionExpandedGroupCardProps) {
  return (
    <View {...props}>
      {children}
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
  const panelContent = panelParts.content;

  if (!panelContent.shouldRender) return null;

  const panelShellParts = createChatRuntimeToolExecutionPanelShellMobilePropsParts({
    compactList: (
      <ChatMessageToolExecutionCompactList
        {...panelContent.compactList.props}
      />
    ),
    expandedGroup: panelContent.expandedGroup.shouldRender ? (
      <ChatMessageToolExecutionExpandedGroup {...panelContent.expandedGroup.props}>
        {children}
      </ChatMessageToolExecutionExpandedGroup>
    ) : null,
  });
  const panelShellContent = panelShellParts.content;

  return (
    <>
      {panelShellContent.compactList}
      {panelShellContent.expandedGroup.shouldRender ? panelShellContent.expandedGroup.props : null}
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
  const stackPanelExpandedGroup = stackPanelParts.expandedGroup;
  const stackPanelExpandedGroupContent = stackPanelExpandedGroup.content;

  return (
    <ChatMessageToolExecutionPanel
      shouldRender={shouldRender}
      isExpanded={isExpanded}
      compact={stackPanelParts.compactList.props}
      expanded={{
        ...stackPanelExpandedGroup.props,
        emptyState: stackPanelExpandedGroupContent.emptyState.shouldRender ? (
          <ChatMessageToolExecutionEmptyState
            {...stackPanelExpandedGroupContent.emptyState.props}
          />
        ) : null,
      }}
    >
      <ChatMessageToolExecutionCallList
        {...stackPanelExpandedGroupContent.callList.props}
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
  const copyButtonContent = copyButtonParts.container.content;

  return (
    <ChatMessageToolExecutionCopyButtonPressable
      {...copyButtonParts.container.props}
    >
      <ChatMessageToolExecutionCopyButtonIcon
        {...copyButtonContent.icon.props}
      />
      <ChatMessageToolExecutionCopyButtonLabel
        {...copyButtonContent.label.props}
      />
    </ChatMessageToolExecutionCopyButtonPressable>
  );
}

export function ChatMessageToolExecutionCopyButtonPressable({
  children,
  ...props
}: ChatMessageToolExecutionCopyButtonPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCopyButtonIcon(props: ChatMessageToolExecutionCopyButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionCopyButtonLabel({
  props,
  text,
}: ChatMessageToolExecutionCopyButtonLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const detailHeaderContent = detailHeaderParts.container.content;
  const expandHintContent = detailHeaderContent.expandHint.content;

  return (
    <ChatMessageToolExecutionDetailHeaderPressable
      {...detailHeaderParts.container.props}
    >
      <ChatMessageToolExecutionDetailHeaderToolName
        {...detailHeaderContent.toolName.props}
      />
      <ChatMessageToolExecutionDetailHeaderExpandHint
        {...detailHeaderContent.expandHint.props}
      >
        <ChatMessageToolExecutionDetailHeaderIcon
          {...expandHintContent.icon.props}
        />
        <ChatMessageToolExecutionDetailHeaderExpandLabel
          {...expandHintContent.label.props}
        />
      </ChatMessageToolExecutionDetailHeaderExpandHint>
    </ChatMessageToolExecutionDetailHeaderPressable>
  );
}

export function ChatMessageToolExecutionDetailHeaderPressable({
  children,
  ...props
}: ChatMessageToolExecutionDetailHeaderPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionDetailHeaderToolName({
  props,
  text,
}: ChatMessageToolExecutionDetailHeaderToolNameProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionDetailHeaderExpandHint({
  children,
  ...props
}: ChatMessageToolExecutionDetailHeaderExpandHintProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionDetailHeaderIcon(props: ChatMessageToolExecutionDetailHeaderIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionDetailHeaderExpandLabel({
  props,
  text,
}: ChatMessageToolExecutionDetailHeaderExpandLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const callSectionContent = callSectionParts.container.content;

  return (
    <ChatMessageToolExecutionCallSectionContainer
      {...callSectionParts.container.props}
    >
      <ChatMessageToolExecutionDetailHeader
        {...callSectionContent.header.props}
      />
      {children}
    </ChatMessageToolExecutionCallSectionContainer>
  );
}

export function ChatMessageToolExecutionCallSectionContainer({
  children,
  ...props
}: ChatMessageToolExecutionCallSectionContainerProps) {
  return (
    <View {...props}>
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
  const resultBadgeContent = resultBadgeParts.container.content;

  return (
    <ChatMessageToolExecutionResultBadgeContainer
      {...resultBadgeParts.container.props}
    >
      <ChatMessageToolExecutionResultBadgeIcon
        {...resultBadgeContent.icon.props}
      />
      <ChatMessageToolExecutionResultBadgeLabel
        {...resultBadgeContent.label.props}
      />
    </ChatMessageToolExecutionResultBadgeContainer>
  );
}

export function ChatMessageToolExecutionResultBadgeContainer({
  children,
  ...props
}: ChatMessageToolExecutionResultBadgeContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultBadgeIcon(props: ChatMessageToolExecutionResultBadgeIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionResultBadgeLabel({
  props,
  text,
}: ChatMessageToolExecutionResultBadgeLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const pendingResultContent = pendingResultParts.container.content;

  return (
    <ChatMessageToolExecutionPendingResultContainer
      {...pendingResultParts.container.props}
    >
      <ChatMessageToolExecutionPendingResultSpinner
        {...pendingResultContent.spinner.props}
      />
      <ChatMessageToolExecutionPendingResultLabel
        {...pendingResultContent.label.props}
      />
    </ChatMessageToolExecutionPendingResultContainer>
  );
}

export function ChatMessageToolExecutionPendingResultContainer({
  children,
  ...props
}: ChatMessageToolExecutionPendingResultContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionPendingResultSpinner(props: ChatMessageToolExecutionPendingResultSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageToolExecutionPendingResultLabel({
  props,
  text,
}: ChatMessageToolExecutionPendingResultLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
    <ChatMessageToolExecutionEmptyStateLabel
      {...emptyStateParts.content.label.props}
    />
  );
}

export function ChatMessageToolExecutionEmptyStateLabel({
  props,
  text,
}: ChatMessageToolExecutionEmptyStateLabelProps) {
  return (
    <Text {...props}>
      {text}
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
  const payloadMetaContent = payloadMetaParts.content;

  const content = (
    <>
      <ChatMessageToolExecutionPayloadMetaText
        {...payloadMetaContent.label.props}
      />
      {payloadMetaContent.payloadType.shouldRender ? (
        <ChatMessageToolExecutionPayloadMetaText
          {...payloadMetaContent.payloadType.props}
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
  children,
  ...props
}: ChatMessageToolExecutionPayloadMetaRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionPayloadMetaText({
  props,
  text,
}: ChatMessageToolExecutionPayloadMetaTextProps) {
  return (
    <Text {...props}>
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
  const resultHeaderContent = resultHeaderParts.header.content;
  const resultHeaderMetaContent = resultHeaderContent.meta.content;

  return (
    <ChatMessageToolExecutionResultHeaderView
      {...resultHeaderParts.header.props}
    >
      <ChatMessageToolExecutionResultHeaderView
        {...resultHeaderContent.meta.props}
      >
        <ChatMessageToolExecutionPayloadMeta
          {...resultHeaderMetaContent.payloadMeta.props}
        />
        <ChatMessageToolExecutionResultBadge
          {...resultHeaderMetaContent.resultBadge.props}
        />
        <ChatMessageToolExecutionResultCharacterCount
          {...resultHeaderMetaContent.characterCount.props}
        />
      </ChatMessageToolExecutionResultHeaderView>
      <ChatMessageToolExecutionCopyButton
        {...resultHeaderContent.copyButton.props}
      />
    </ChatMessageToolExecutionResultHeaderView>
  );
}

export function ChatMessageToolExecutionResultHeaderView({
  children,
  ...props
}: ChatMessageToolExecutionResultHeaderViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultCharacterCount({
  props,
  text,
}: ChatMessageToolExecutionResultCharacterCountProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const payloadBlockContent = payloadBlockParts.content;
  const payloadBlockScrollContent = payloadBlockContent.scroll.content;

  return (
    <>
      {payloadBlockContent.preview.shouldRender ? (
        <ChatMessageToolExecutionPayloadPreview
          {...payloadBlockContent.preview.props}
        />
      ) : null}
      <ChatMessageToolExecutionPayloadScroll
        {...payloadBlockContent.scroll.props}
      >
        <ChatMessageToolExecutionPayloadCode
          {...payloadBlockScrollContent.code.props}
        />
      </ChatMessageToolExecutionPayloadScroll>
    </>
  );
}

export function ChatMessageToolExecutionPayloadPreview({
  props,
  text,
}: ChatMessageToolExecutionPayloadPreviewProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadScroll({
  children,
  ...props
}: ChatMessageToolExecutionPayloadScrollProps) {
  return (
    <ScrollView {...props}>
      {children}
    </ScrollView>
  );
}

export function ChatMessageToolExecutionPayloadCode({
  props,
  text,
}: ChatMessageToolExecutionPayloadCodeProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const payloadSectionContent = payloadSectionParts.section.content;
  const payloadSectionHeaderContent = payloadSectionContent.headerRow.content;

  return (
    <ChatMessageToolExecutionPayloadSectionView
      {...payloadSectionParts.section.props}
    >
      <ChatMessageToolExecutionPayloadSectionView
        {...payloadSectionContent.headerRow.props}
      >
        <ChatMessageToolExecutionPayloadMeta
          {...payloadSectionHeaderContent.payloadMeta.props}
        />
        <ChatMessageToolExecutionCopyButton
          {...payloadSectionHeaderContent.copyButton.props}
        />
      </ChatMessageToolExecutionPayloadSectionView>
      <ChatMessageToolExecutionPayloadBlock
        {...payloadSectionContent.payloadBlock.props}
      />
    </ChatMessageToolExecutionPayloadSectionView>
  );
}

export function ChatMessageToolExecutionPayloadSectionView({
  children,
  ...props
}: ChatMessageToolExecutionPayloadSectionViewProps) {
  return (
    <View {...props}>
      {children}
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
  const errorBlockContent = errorBlockParts.section.content;
  const errorBlockHeaderContent = errorBlockContent.headerRow.content;

  return (
    <ChatMessageToolExecutionErrorBlockView
      {...errorBlockParts.section.props}
    >
      <ChatMessageToolExecutionErrorBlockView
        {...errorBlockContent.headerRow.props}
      >
        <ChatMessageToolExecutionErrorBlockText
          {...errorBlockHeaderContent.label.props}
        />
        <ChatMessageToolExecutionCopyButton
          {...errorBlockHeaderContent.copyButton.props}
        />
      </ChatMessageToolExecutionErrorBlockView>
      <ChatMessageToolExecutionErrorBlockText
        {...errorBlockContent.error.props}
      />
    </ChatMessageToolExecutionErrorBlockView>
  );
}

export function ChatMessageToolExecutionErrorBlockView({
  children,
  ...props
}: ChatMessageToolExecutionErrorBlockViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionErrorBlockText({
  props,
  text,
}: ChatMessageToolExecutionErrorBlockTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const resultSectionContent = resultSectionParts.item.content;

  return (
    <ChatMessageToolExecutionResultSectionItem
      {...resultSectionParts.item.props}
    >
      <ChatMessageToolExecutionResultHeader
        {...resultSectionContent.header.props}
      />
      <ChatMessageToolExecutionPayloadBlock
        {...resultSectionContent.payloadBlock.props}
      />
      {resultSectionContent.errorBlock.shouldRender ? (
        <ChatMessageToolExecutionErrorBlock
          {...resultSectionContent.errorBlock.props}
        />
      ) : null}
    </ChatMessageToolExecutionResultSectionItem>
  );
}

export function ChatMessageToolExecutionResultSectionItem({
  children,
  ...props
}: ChatMessageToolExecutionResultSectionItemProps) {
  return (
    <View {...props}>
      {children}
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
  const callDetailContent = callDetailParts.callSection.content;

  return (
    <ChatMessageToolExecutionCallSection
      {...callDetailParts.callSection.props}
    >
      {callDetailContent.inputSection.shouldRender ? (
        <ChatMessageToolExecutionPayloadSection
          {...callDetailContent.inputSection.props}
        />
      ) : null}
      {callDetailContent.resultSection.shouldRender ? (
        <ChatMessageToolExecutionResultSection
          {...callDetailContent.resultSection.props}
        />
      ) : callDetailContent.pendingResult.shouldRender ? (
        <ChatMessageToolExecutionPendingResult
          {...callDetailContent.pendingResult.props}
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
  const callListContent = callListParts.content;

  return (
    <>
      {callListContent.rows.map((row) => (
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
  const frameContent = frameParts.keyboardAvoidingView.content;

  return (
    <KeyboardAvoidingView
      {...frameParts.keyboardAvoidingView.props}
    >
      <View {...frameContent.root.props}>
        {frameContent.root.content.children}
        {frameContent.root.content.dock.children}
      </View>
      {frameContent.overlays.children}
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
  const overlayContent = overlayParts.content;

  return (
    <>
      {overlayContent.agentSelector.children}
      {overlayContent.promptEditor.children}
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
      {...scrollViewportParts.scrollView.props}
    >
      {scrollViewportParts.scrollView.content.children}
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
  const viewportContent = viewportContentParts.content;

  return (
    <>
      {viewportContent.loadingState.children}
      {viewportContent.homeState.children}
      {viewportContent.historyBanner.children}
      {viewportContent.stepSummary.children}
      {viewportContent.children}
      {viewportContent.debugPanels.children}
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
      {...viewportParts.scrollViewport.props}
      loadingState={(
        <ChatMessageLoadingState
          {...viewportParts.loadingState.props}
        />
      )}
      homeState={(
        <ChatConversationHomeQuickStarts
          {...viewportParts.homeQuickStarts.props}
        />
      )}
      historyBanner={(
        <ChatMessageHistoryBanner
          {...viewportParts.historyBanner.props}
        />
      )}
      stepSummary={(
        <ChatMessageStepSummaryCard
          {...viewportParts.stepSummary.props}
        />
      )}
      debugPanels={(
        <ChatMessageDebugPanelStack
          {...viewportParts.debugPanels.props}
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
      {...surfaceParts.frame.props}
      dock={(
        <ChatMessageRuntimeDock
          {...surfaceParts.dock.props}
        />
      )}
      overlays={(
        <ChatMessageRuntimeOverlays
          {...surfaceParts.overlays.props}
        />
      )}
    >
      <ChatMessageRuntimeViewport
        {...surfaceParts.viewport.props}
      >
        <ChatMessageConversationRuntimeThreadList {...surfaceParts.viewport.content.threadList.props} />
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

  if (!historyBannerParts.container.shouldRender) return null;

  return (
    <ChatMessageHistoryBannerContainer
      container={historyBannerParts.container}
    />
  );
}

export function ChatMessageHistoryBannerContainer({
  container,
}: ChatMessageHistoryBannerContainerProps) {
  const historyBannerContent = container.content;

  return (
    <View {...container.props}>
      <ChatMessageHistoryBannerSummary
        summary={historyBannerContent.summary}
      />
      <ChatMessageHistoryBannerLoadButton
        button={historyBannerContent.loadButton}
      />
    </View>
  );
}

export function ChatMessageHistoryBannerSummary({
  summary,
}: ChatMessageHistoryBannerSummaryProps) {
  return (
    <Text {...summary.props}>
      {summary.text}
    </Text>
  );
}

export function ChatMessageHistoryBannerLoadButton({
  button,
}: ChatMessageHistoryBannerLoadButtonProps) {
  const historyBannerLoadButtonContent = button.content;

  return (
    <Pressable
      {...button.props}
    >
      <Ionicons
        {...historyBannerLoadButtonContent.icon.props}
      />
      <Text {...historyBannerLoadButtonContent.label.props}>
        {historyBannerLoadButtonContent.label.text}
      </Text>
    </Pressable>
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
  const stepSummaryCardPart = stepSummaryCardParts.card;

  if (!stepSummaryCardPart.shouldRender) return null;

  const stepSummaryCardContent = stepSummaryCardPart.content;

  return (
    <View {...stepSummaryCardPart.props}>
      <ChatMessageStepSummaryHeader
        header={stepSummaryCardContent.header}
      />
      <Text {...stepSummaryCardContent.action.props}>
        {stepSummaryCardContent.action.text}
      </Text>
      <Text {...stepSummaryCardContent.meta.props}>
        {stepSummaryCardContent.meta.text}
      </Text>
      {stepSummaryCardContent.preview.shouldRender ? (
        <Text {...stepSummaryCardContent.preview.props}>
          {stepSummaryCardContent.preview.text}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatMessageStepSummaryHeader({
  header,
}: ChatMessageStepSummaryHeaderProps) {
  const stepSummaryHeaderContent = header.content;
  const stepSummaryBadgeContent = stepSummaryHeaderContent.badge.content;

  return (
    <View {...header.props}>
      <Text {...stepSummaryHeaderContent.title.props}>
        {stepSummaryHeaderContent.title.text}
      </Text>
      <View {...stepSummaryHeaderContent.badge.props}>
        <Text {...stepSummaryBadgeContent.label.props}>
          {stepSummaryBadgeContent.label.text}
        </Text>
      </View>
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
  const scrollToBottomButton = scrollToBottomButtonParts.button;

  if (!scrollToBottomButton.shouldRender) return null;

  const buttonContent = scrollToBottomButton.content;

  return (
    <ChatMessageScrollToBottomButtonTouchable
      {...scrollToBottomButton.props}
    >
      <ChatMessageScrollToBottomButtonIcon
        {...buttonContent.icon.props}
      />
    </ChatMessageScrollToBottomButtonTouchable>
  );
}

export function ChatMessageScrollToBottomButtonTouchable({
  children,
  ...props
}: ChatMessageScrollToBottomButtonTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatMessageScrollToBottomButtonIcon(
  props: ChatMessageScrollToBottomButtonIconProps
) {
  return <Ionicons {...props} />;
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
  const loadingStateContainer = loadingStateParts.container;

  if (!loadingStateContainer.shouldRender) return null;

  const containerContent = loadingStateContainer.content;

  return (
    <ChatMessageLoadingStateContainer
      {...loadingStateContainer.props}
    >
      <ChatMessageLoadingStateSpinner
        {...containerContent.spinner.props}
      />
    </ChatMessageLoadingStateContainer>
  );
}

export function ChatMessageLoadingStateContainer({
  children,
  ...props
}: ChatMessageLoadingStateContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageLoadingStateSpinner(
  props: ChatMessageLoadingStateSpinnerProps
) {
  return <Image {...props} />;
}

export function ChatMessageDebugPanel({
  shouldRender,
  content,
  props,
}: ChatMessageDebugPanelProps) {
  const debugPanelContent = content;

  if (!shouldRender || debugPanelContent.rows.length === 0) return null;

  return (
    <View {...props}>
      {debugPanelContent.rows.map((row) => (
        <Text key={row.key} {...row.props}>
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
  const dockShellContent = dockShellParts.content;

  return (
    <>
      {dockShellContent.responseHistoryPanel.children}
      {dockShellContent.scrollToBottomButton.children}
      {dockShellContent.voiceOverlay.children}
      {dockShellContent.queuePanel.children}
      {dockShellContent.connectionBanner.children}
      {dockShellContent.composer.children}
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
          {...dockParts.responseHistoryPanel.props}
        />
      )}
      scrollToBottomButton={(
        <ChatMessageScrollToBottomButton
          {...dockParts.scrollToBottomButton.props}
        />
      )}
      voiceOverlay={(
        <ChatComposerVoiceOverlay
          {...dockParts.voiceOverlay.props}
        />
      )}
      queuePanel={(
        <ChatMessageQueuePanelDock
          {...dockParts.queuePanel.props}
        />
      )}
      connectionBanner={(
        <ChatMessageConnectionBanner
          {...dockParts.connectionBanner.props}
        />
      )}
      composer={(
        <ChatComposerRuntimeDock
          {...dockParts.composer.props}
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
  container,
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
    <ChatMessageQueuePanelDockContainer {...container.props}>
      <MessageQueuePanel
        {...panelProps}
        {...queuePanelChromeState}
      />
    </ChatMessageQueuePanelDockContainer>
  );
}

export function ChatMessageQueuePanelDockContainer({
  children,
  ...props
}: ChatMessageQueuePanelDockContainerProps) {
  return (
    <View {...props}>
      {children}
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
      <ChatMessageConnectionBannerReconnecting
        reconnecting={connectionBannerParts.reconnecting}
      />
      <ChatMessageConnectionBannerFailed
        failed={connectionBannerParts.failed}
      />
    </>
  );
}

export function ChatMessageConnectionBannerReconnecting({
  reconnecting,
}: ChatMessageConnectionBannerReconnectingProps) {
  if (!reconnecting.shouldRender) return null;

  const reconnectingContent = reconnecting.container.content;
  const reconnectingBodyContent = reconnectingContent.body.content;
  const reconnectingTextContent = reconnectingBodyContent.textContainer.content;

  return (
    <ChatMessageConnectionBannerContainer
      {...reconnecting.container.props}
    >
      <ChatMessageConnectionBannerContent
        {...reconnectingContent.body.props}
      >
        <ChatMessageConnectionBannerSpinner
          {...reconnectingBodyContent.spinner.props}
        />
        <ChatMessageConnectionBannerTextContainer
          {...reconnectingBodyContent.textContainer.props}
        >
          <ChatMessageConnectionBannerText
            {...reconnectingTextContent.title.props}
          />
          {reconnectingTextContent.subtitle.shouldRender ? (
            <ChatMessageConnectionBannerText
              {...reconnectingTextContent.subtitle.props}
            />
          ) : null}
        </ChatMessageConnectionBannerTextContainer>
      </ChatMessageConnectionBannerContent>
    </ChatMessageConnectionBannerContainer>
  );
}

export function ChatMessageConnectionBannerFailed({
  failed,
}: ChatMessageConnectionBannerFailedProps) {
  if (!failed.shouldRender) return null;

  const failedContent = failed.container.content;
  const failedBodyContent = failedContent.body.content;
  const failedTextContent = failedBodyContent.textContainer.content;
  const failedRetryButtonContent = failedBodyContent.retryButton.content;

  return (
    <ChatMessageConnectionBannerContainer
      {...failed.container.props}
    >
      <ChatMessageConnectionBannerContent
        {...failedContent.body.props}
      >
        <ChatMessageConnectionBannerIcon
          {...failedBodyContent.icon.props}
        />
        <ChatMessageConnectionBannerTextContainer
          {...failedBodyContent.textContainer.props}
        >
          <ChatMessageConnectionBannerText
            {...failedTextContent.title.props}
          />
          <ChatMessageConnectionBannerText
            {...failedTextContent.subtitle.props}
          />
        </ChatMessageConnectionBannerTextContainer>
        <ChatMessageConnectionBannerRetryButton
          {...failedBodyContent.retryButton.props}
        >
          <ChatMessageConnectionBannerText
            {...failedRetryButtonContent.label.props}
          />
        </ChatMessageConnectionBannerRetryButton>
      </ChatMessageConnectionBannerContent>
    </ChatMessageConnectionBannerContainer>
  );
}

export function ChatMessageConnectionBannerContainer({
  children,
  ...props
}: ChatMessageConnectionBannerContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBannerContent({
  children,
  ...props
}: ChatMessageConnectionBannerContentProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBannerSpinner(props: ChatMessageConnectionBannerSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageConnectionBannerIcon(props: ChatMessageConnectionBannerIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageConnectionBannerTextContainer({
  children,
  ...props
}: ChatMessageConnectionBannerTextContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBannerText({
  props,
  text,
}: ChatMessageConnectionBannerTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageConnectionBannerRetryButton({
  children,
  ...props
}: ChatMessageConnectionBannerRetryButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
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
          {...composerDockParts.speechPreview.props}
        />
      )}
      pendingImagesRail={(
        <ChatComposerPendingImagesRail
          {...composerDockParts.pendingImagesRail.props}
        />
      )}
      handsFreeControls={(
        <ChatComposerHandsFreeControls
          {...composerDockParts.handsFreeControls.props}
          status={<HandsFreeStatusChip {...composerDockParts.handsFreeControls.content.status.props} />}
        />
      )}
      imageAttachmentControl={(
        <ChatComposerIconButton
          {...composerDockParts.imageAttachmentControl.props}
        />
      )}
      textToSpeechControl={(
        <ChatComposerIconButton
          {...composerDockParts.textToSpeechControl.props}
        />
      )}
      editBeforeSendControl={(
        <ChatComposerIconButton
          {...composerDockParts.editBeforeSendControl.props}
        />
      )}
      textEntry={(
        <ChatComposerTextEntry
          {...composerDockParts.textEntry.props}
        />
      )}
      queueAction={(
        <ChatComposerLabeledActionButton
          {...composerDockParts.queueAction.props}
        />
      )}
      submitAction={(
        <ChatComposerLabeledActionButton
          {...composerDockParts.submitAction.props}
        />
      )}
      micButton={(
        <ChatComposerMicButton
          {...composerDockParts.micButton.props}
        />
      )}
      {...composerDockParts.inputDock.props}
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

  const inputDockContent = inputDockParts.area.content;

  return (
    <ChatComposerInputDockArea
      {...inputDockParts.area.props}
    >
      {inputDockContent.speechPreview.children}
      {inputDockContent.pendingImagesRail.children}
      {inputDockContent.handsFreeControls.children}
      <ChatComposerInputDockRow
        {...inputDockContent.row.props}
      >
        {inputDockContent.row.content.imageAttachmentControl.children}
        {inputDockContent.row.content.textToSpeechControl.children}
        {inputDockContent.row.content.editBeforeSendControl.children}
        {inputDockContent.row.content.textEntry.children}
        {inputDockContent.row.content.queueAction.children}
        {inputDockContent.row.content.submitAction.children}
      </ChatComposerInputDockRow>
      <ChatComposerInputDockMicWrapper
        {...inputDockContent.micWrapper.props}
      >
        {inputDockContent.micWrapper.content.micButton.children}
      </ChatComposerInputDockMicWrapper>
    </ChatComposerInputDockArea>
  );
}

export function ChatComposerInputDockArea({
  children,
  ...props
}: ChatComposerInputDockAreaProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerInputDockRow({
  children,
  ...props
}: ChatComposerInputDockRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export const ChatComposerInputDockMicWrapper = forwardRef<View, ChatComposerInputDockMicWrapperProps>(function ChatComposerInputDockMicWrapper({
  children,
  ...props
}, ref) {
  return (
    <View
      ref={ref}
      {...props}
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
  const speechPreviewContainer = speechPreviewParts.container;

  if (!speechPreviewContainer.shouldRender) return null;

  return (
    <ChatComposerSpeechPreviewContainer
      {...speechPreviewContainer.props}
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
  children,
  ...props
}: ChatComposerSpeechPreviewContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerSpeechPreviewLabel({
  text,
  ...props
}: ChatComposerSpeechPreviewLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerSpeechPreviewText({
  text,
  ...props
}: ChatComposerSpeechPreviewTextProps) {
  return (
    <Text {...props}>
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
  const pendingImagesRailScrollView = pendingImagesRailParts.scrollView;
  const pendingImagesRailContent = pendingImagesRailScrollView.content;

  if (!pendingImagesRailScrollView.shouldRender) return null;

  return (
    <ChatComposerPendingImagesRailScrollView
      {...pendingImagesRailScrollView.props}
    >
      {pendingImagesRailContent.items.map((item) => (
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
  children,
  ...props
}: ChatComposerPendingImagesRailScrollViewProps) {
  return (
    <ScrollView {...props}>
      {children}
    </ScrollView>
  );
}

export function ChatComposerPendingImageCard({
  children,
  ...props
}: ChatComposerPendingImageCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerPendingImagePreview(props: ChatComposerPendingImagePreviewProps) {
  return (
    <Image {...props} />
  );
}

export function ChatComposerPendingImageRemoveButton({
  children,
  ...props
}: ChatComposerPendingImageRemoveButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerPendingImageRemoveIcon(props: ChatComposerPendingImageRemoveIconProps) {
  return (
    <Ionicons {...props} />
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
  const voiceOverlayContainer = voiceOverlayParts.overlay;

  if (!voiceOverlayContainer.shouldRender) return null;

  return (
    <ChatComposerVoiceOverlayContainer
      {...voiceOverlayContainer.props}
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
  children,
  ...props
}: ChatComposerVoiceOverlayContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerVoiceOverlayCard({
  children,
  ...props
}: ChatComposerVoiceOverlayCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerVoiceOverlayLabel({
  text,
  ...props
}: ChatComposerVoiceOverlayLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerVoiceOverlayTranscript({
  text,
  ...props
}: ChatComposerVoiceOverlayTranscriptProps) {
  return (
    <Text {...props}>
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
  const handsFreeStatusRow = handsFreeControlsParts.statusRow;
  const handsFreeControlsRow = handsFreeControlsParts.controlsRow;

  if (!handsFreeStatusRow.shouldRender && !handsFreeControlsRow.shouldRender) return null;

  const controlsRowContent = handsFreeControlsRow.content;

  return (
    <>
      {handsFreeStatusRow.shouldRender ? (
        <ChatComposerHandsFreeStatusRow
          {...handsFreeStatusRow.props}
        >
          {handsFreeStatusRow.content.status.children}
        </ChatComposerHandsFreeStatusRow>
      ) : null}
      {handsFreeControlsRow.shouldRender ? (
        <ChatComposerHandsFreeControlsRow
          {...handsFreeControlsRow.props}
        >
          <ChatComposerHandsFreeControlButton
            {...controlsRowContent.primaryControl.touchable.props}
          >
            <ChatComposerHandsFreeControlLabel
              {...controlsRowContent.primaryControl.content.label.props}
            />
          </ChatComposerHandsFreeControlButton>
          <ChatComposerHandsFreeControlButton
            {...controlsRowContent.secondaryControl.touchable.props}
          >
            <ChatComposerHandsFreeControlLabel
              {...controlsRowContent.secondaryControl.content.label.props}
            />
          </ChatComposerHandsFreeControlButton>
        </ChatComposerHandsFreeControlsRow>
      ) : null}
    </>
  );
}

export function ChatComposerHandsFreeStatusRow({
  children,
  ...props
}: ChatComposerHandsFreeStatusRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerHandsFreeControlsRow({
  children,
  ...props
}: ChatComposerHandsFreeControlsRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerHandsFreeControlButton({
  children,
  ...props
}: ChatComposerHandsFreeControlButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerHandsFreeControlLabel({
  text,
  ...props
}: ChatComposerHandsFreeControlLabelProps) {
  return (
    <Text {...props}>
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
  const iconButtonTouchable = iconButtonParts.touchable;

  if (!iconButtonTouchable.shouldRender) return null;

  const touchableContent = iconButtonTouchable.content;

  return (
    <ChatComposerIconButtonTouchable
      {...iconButtonTouchable.props}
    >
      <ChatComposerIconButtonIcon
        {...touchableContent.icon.props}
      />
    </ChatComposerIconButtonTouchable>
  );
}

export function ChatComposerIconButtonTouchable({
  children,
  ...props
}: ChatComposerIconButtonTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerIconButtonIcon(props: ChatComposerIconButtonIconProps) {
  return (
    <Ionicons {...props} />
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
  const actionButtonTouchable = actionButtonParts.touchable;

  if (!actionButtonTouchable.shouldRender) return null;

  const touchableContent = actionButtonTouchable.content;

  return (
    <ChatComposerLabeledActionButtonTouchable
      {...actionButtonTouchable.props}
    >
      <ChatComposerLabeledActionButtonIcon
        {...touchableContent.icon.props}
      />
      {touchableContent.label.shouldRender ? (
        <ChatComposerLabeledActionButtonLabel
          {...touchableContent.label.props}
        />
      ) : null}
    </ChatComposerLabeledActionButtonTouchable>
  );
}

export function ChatComposerLabeledActionButtonTouchable({
  children,
  ...props
}: ChatComposerLabeledActionButtonTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerLabeledActionButtonIcon(props: ChatComposerLabeledActionButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatComposerLabeledActionButtonLabel({
  text,
  ...props
}: ChatComposerLabeledActionButtonLabelProps) {
  return (
    <Text {...props}>
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
  const micButtonPressable = micButtonParts.pressable;

  const pressableContent = micButtonPressable.content;

  return (
    <ChatComposerMicButtonPressable
      {...micButtonPressable.props}
    >
      <ChatComposerMicButtonIcon
        {...pressableContent.icon.props}
      />
      <ChatComposerMicButtonLabel
        {...pressableContent.label.props}
      />
    </ChatComposerMicButtonPressable>
  );
}

export function ChatComposerMicButtonPressable({
  children,
  ...props
}: ChatComposerMicButtonPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatComposerMicButtonIcon(props: ChatComposerMicButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatComposerMicButtonLabel({
  text,
  ...props
}: ChatComposerMicButtonLabelProps) {
  return (
    <Text {...props}>
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
  const textEntryInput = textEntryParts.input;
  const textEntryInputDescription = textEntryParts.inputDescription;
  const textEntryVoiceStatusLiveRegion = textEntryParts.voiceStatusLiveRegion;

  return (
    <>
      <ChatComposerTextEntryInput
        {...textEntryInput.props}
      />
      {textEntryInputDescription.shouldRender ? (
        <ChatComposerTextEntryInputDescription
          {...textEntryInputDescription.props}
        />
      ) : null}
      {textEntryVoiceStatusLiveRegion.shouldRender ? (
        <ChatComposerTextEntryVoiceStatusLiveRegion
          {...textEntryVoiceStatusLiveRegion.props}
        />
      ) : null}
    </>
  );
}

export const ChatComposerTextEntryInput = forwardRef<TextInput, Omit<ChatComposerTextEntryInputProps, 'ref'>>(function ChatComposerTextEntryInput(props, ref) {
  return (
    <TextInput
      ref={ref}
      {...props}
    />
  );
});

export function ChatComposerTextEntryInputDescription({
  text,
  ...props
}: ChatComposerTextEntryInputDescriptionProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerTextEntryVoiceStatusLiveRegion({
  text,
  ...props
}: ChatComposerTextEntryVoiceStatusLiveRegionProps) {
  return (
    <Text {...props}>
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

  if (!inlineActivityParts.container.shouldRender) return null;

  const containerContent = inlineActivityParts.container.content;

  return (
    <ChatMessageInlineActivityContainer
      {...inlineActivityParts.container.props}
    >
      <ChatMessageInlineActivitySpinner
        {...containerContent.spinner.props}
      />
    </ChatMessageInlineActivityContainer>
  );
}

export function ChatMessageInlineActivityContainer({
  children,
  ...props
}: ChatMessageInlineActivityContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageInlineActivitySpinner(props: ChatMessageInlineActivitySpinnerProps) {
  return (
    <Image {...props} />
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

  if (!turnDurationBadgeParts.container.shouldRender) return null;

  const containerContent = turnDurationBadgeParts.container.content;

  return (
    <ChatMessageTurnDurationBadgeContainer
      {...turnDurationBadgeParts.container.props}
    >
      <ChatMessageTurnDurationBadgeIcon
        {...containerContent.icon.props}
      />
      <ChatMessageTurnDurationBadgeLabel
        {...containerContent.label.props}
      />
    </ChatMessageTurnDurationBadgeContainer>
  );
}

export function ChatMessageTurnDurationBadgeContainer({
  children,
  ...props
}: ChatMessageTurnDurationBadgeContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageTurnDurationBadgeIcon(props: ChatMessageTurnDurationBadgeIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageTurnDurationBadgeLabel({
  props,
  text,
}: ChatMessageTurnDurationBadgeLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
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
  const expandedStreamingContent = expandedContentParts.streamingContent;

  if (!expandedStreamingContent.shouldRender) {
    return (
      <MarkdownRenderer
        content={expandedContentParts.markdown.content}
        assetBaseUrl={expandedContentParts.markdown.assetBaseUrl}
        assetAuthToken={expandedContentParts.markdown.assetAuthToken}
      />
    );
  }

  const expandedStreamingContentParts = expandedStreamingContent.content;

  return (
    <>
      <ChatMessageExpandedContentHeader
        header={expandedStreamingContentParts.header}
      />
      <ChatMessageExpandedContentBody
        body={expandedStreamingContentParts.body}
      />
    </>
  );
}

export function ChatMessageExpandedContentHeader({
  header,
}: ChatMessageExpandedContentHeaderProps) {
  const expandedHeaderContent = header.content;
  const expandedBadgeContent = expandedHeaderContent.badge.content;

  return (
    <View {...header.props}>
      <Ionicons {...expandedHeaderContent.icon.props} />
      <Text {...expandedHeaderContent.title.props}>
        {expandedHeaderContent.title.text}
      </Text>
      <Image {...expandedHeaderContent.spinner.props} />
      <View {...expandedHeaderContent.badge.props}>
        <Text {...expandedBadgeContent.label.props}>
          {expandedBadgeContent.label.text}
        </Text>
      </View>
    </View>
  );
}

export function ChatMessageExpandedContentBody({
  body,
}: ChatMessageExpandedContentBodyProps) {
  const expandedBodyContent = body.content;

  return (
    <View {...body.props}>
      <Text {...expandedBodyContent.text.props}>
        {expandedBodyContent.text.text}
      </Text>
      <View {...expandedBodyContent.caret.props} />
    </View>
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
  const collapsedPreviewContent = collapsedPreviewParts.pressable.content;

  return (
    <Pressable
      {...collapsedPreviewParts.pressable.props}
    >
      <Text {...collapsedPreviewContent.text.props}>
        {collapsedPreviewContent.text.text}
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
        {...conversationContentParts.expandedContent.props.row.props}
      >
        <ChatMessageExpandedContent
          {...conversationContentParts.expandedContent.props.content.props}
        />
      </ChatMessageContentRow>
    );
  }

  if (conversationContentParts.collapsedContent.shouldRender) {
    return (
      <ChatMessageContentRow
        {...conversationContentParts.collapsedContent.props.row.props}
      >
        <ChatMessageCollapsedPreview
          {...conversationContentParts.collapsedContent.props.preview.props}
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
        {...contentRowParts.actionSlotList.props}
      />
    </ChatMessageContentRowContainer>
  );
}

export function ChatMessageContentRowContainer({
  children,
  ...props
}: ChatMessageContentRowContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageContentBody({
  children,
  ...props
}: ChatMessageContentBodyProps) {
  return (
    <View {...props}>
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
      {...standaloneActionsParts.actionSlotList.props}
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
  const actionSlotList = actionSlotListParts.list;

  if (!actionSlotList.shouldRender) return null;

  const content = actionSlotList.content.items.map(({ key, item }) => (
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
  children,
  ...props
}: ChatMessageActionSlotListRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}
