import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type Dispatch, type ReactNode, type Ref, type RefObject, type SetStateAction } from 'react';
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
  createChatMessageRuntimeLogMeta,
  createChatMessageRuntimeModelMessages,
  createChatMessageRuntimeToolActivityGroups,
  getChatComposerQueueMobileActionState,
  getChatComposerRuntimeBase64ImageBytes,
  getChatComposerRuntimeControlMobileRenderState,
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
  getChatMessageActionMobileButtonStatesBySlot,
  getChatMessageActionSlotRenderEntries,
  getChatMessageCopyFailureAlertState,
  getChatMessageCopyFeedbackResetDelayMs,
  getChatMessageToolExecutionCopyFailureResolvedAlertState,
  createChatConversationHomePromptEditorSaveActionState,
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  getChatConversationHomePromptDeleteConfirmAlertState,
  getChatConversationHomePromptDeleteFailedAlertState,
  getChatConversationHomePromptEditorDismissActionState,
  getChatConversationHomePromptEditorTitle,
  getChatConversationHomePromptSaveFailedAlertState,
  getChatConversationHomePromptSaveSuccessAlertState,
  getChatConversationHomePromptTaskRunFailedAlertState,
  getChatConversationHomePromptTaskStartedAlertState,
  getChatRuntimeDockChromeMobileRenderState,
  getChatRuntimeHomeQuickStartEmptyMobileRenderState,
  getChatRuntimeHomeQuickStartItemMobileRenderState,
  getChatRuntimeHomeQuickStartPressIntent,
  getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileIsAtBottom,
  getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier,
  getChatRuntimeMessageHistoryWindowMobileState,
  getChatRuntimeConversationItemThreadMobileState,
  getChatRuntimeConversationMessageThreadMobileState,
  getChatRuntimeConversationRuntimeThreadListMobileState,
  getChatRuntimeConversationThreadListMobileState,
  getChatRuntimeConversationThreadBodyMobileState,
  getChatRuntimeMessageThreadMobileStyleRenderState,
  getChatComposerRuntimeDockMobileRenderState,
  createChatRuntimeSurfaceChromeMobileProps,
  createChatRuntimeViewportChromeMobileProps,
  getChatRuntimeDelegationCardMobilePresentationState,
  getChatRuntimeBranchCreatedMobileResolvedAlertState,
  getChatRuntimeBranchFailedMobileResolvedAlertState,
  getChatRuntimeBranchUnavailableMobileResolvedAlertState,
  getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState,
  getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState,
  getChatRuntimeKillSwitchResultMobileResolvedAlertState,
  getChatRuntimeNavigationHeaderMobileRenderState,
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
  getChatComposerRuntimeFollowUpPresentationState,
  getChatComposerRuntimeHandsFreeDebugMessage,
  getChatComposerRuntimeHandsFreeControlsMobileRenderState,
  getChatComposerRuntimeTextEntryMobileRenderState,
  mergeChatComposerRuntimeVoiceText,
  shouldRenderChatRuntimeConversationThread,
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
  type ChatComposerRuntimeFollowUpPresentationStateInput,
  type ChatComposerRuntimeHandsFreeControlsMobileRenderState,
  type ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput,
  type ChatComposerRuntimeTextEntryMobileRenderStateInput,
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
  getChatImageAttachmentMobileRenderState,
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
  type ChatComposerRuntimeControlMobileRenderStateInput,
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
  type ChatRuntimeConversationMessageRuntimeThreadState,
  type ChatRuntimeConversationMessageRuntimeThreadStateInput,
  type ChatRuntimeConversationRenderableRuntimeThreadState,
  type ChatRuntimeConversationThreadBodyMobileState,
  type ChatRuntimeConversationThreadBodyMobileDisplayMode,
  type ChatRuntimeConversationThreadBodyMobileStateInput,
  type ChatRuntimeConversationThreadVisibilityInput,
  type ChatRuntimeConversationSurfaceToneMobileStyleSlot,
  type ChatRuntimeConversationToolApprovalMobileState,
  type ChatRuntimeConversationToolExecutionDetailMobileRowState,
  type ChatRuntimeConversationToolExecutionStackMobileState,
  type ChatRuntimeConversationToolActivityGroupThreadRenderStateInput,
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
  entries: ChatMessageActionEntry[];
  shouldRenderActionSlots: boolean;
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
  controlState: ChatComposerRuntimeHandsFreeControlsRenderState['controlState'];
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

type ChatMessageContentRowProps = {
  children: ReactNode;
  shouldRenderActionSlots: boolean;
  entries: readonly ChatMessageActionEntry[];
  rowStyle: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
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

type ChatComposerRuntimeControlRenderStateInput =
  ChatComposerRuntimeControlMobileRenderStateInput;

type ChatComposerRuntimeTextEntryRenderStateInput =
  ChatComposerRuntimeTextEntryMobileRenderStateInput;

type ChatComposerRuntimeHandsFreeControlsRenderState =
  ChatComposerRuntimeHandsFreeControlsMobileRenderState;

type ChatComposerRuntimeHandsFreeControlsRenderStateInput =
  ChatComposerRuntimeHandsFreeControlsMobileRenderStateInput;

type ChatComposerRuntimeDockChromePropsInput = {
  chrome: ChatComposerRuntimeDockChromeProps;
  speechPreviewText: ChatComposerSpeechPreviewProps['text'];
  pendingImages: ChatComposerPendingImagesRailProps['images'];
  pendingImagesColors: Parameters<typeof getChatImageAttachmentMobileRenderState>[0]['colors'];
  onRemovePendingImage: ChatComposerPendingImagesRailProps['onRemove'];
  handsFreeStatusPhase: ChatComposerRuntimeHandsFreeControlsProps['status']['phase'];
  handsFreeStatusLabel: ChatComposerRuntimeHandsFreeControlsProps['status']['label'];
  handsFreeStatusEnabled: ChatComposerRuntimeHandsFreeControlsRenderStateInput['isEnabled'];
  handsFreeStatusWakePhrase: ChatComposerRuntimeHandsFreeControlsRenderStateInput['wakePhrase'];
  handsFreeStatusSleepPhrase: ChatComposerRuntimeHandsFreeControlsRenderStateInput['sleepPhrase'];
  handsFreeStatusLastError: ChatComposerRuntimeHandsFreeControlsRenderStateInput['lastError'];
  handsFreeStatusForegroundOnly: ChatComposerRuntimeHandsFreeControlsRenderStateInput['foregroundOnly'];
  onWakeHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onWake'];
  onSleepHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onSleep'];
  onResumeHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onResume'];
  onPauseHandsFree: ChatComposerRuntimeHandsFreeControlsProps['onPause'];
  composerControlHasContent: ChatComposerRuntimeControlRenderStateInput['hasContent'];
  composerControlConversationState: ChatComposerRuntimeFollowUpPresentationStateInput['conversationState'];
  composerControlIsResponding: ChatComposerRuntimeFollowUpPresentationStateInput['isResponding'];
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
  textEntryHandsFree: ChatComposerRuntimeTextEntryRenderStateInput['handsFree'];
  textEntryListening: ChatComposerRuntimeTextEntryRenderStateInput['listening'];
  textEntryWillCancel: ChatComposerRuntimeTextEntryRenderStateInput['willCancel'];
  textEntryLiveTranscript: ChatComposerRuntimeTextEntryRenderStateInput['liveTranscript'];
  textEntryWakePhrase: ChatComposerRuntimeTextEntryRenderStateInput['wakePhrase'];
  textEntryPlaceholderFallback?: ChatComposerRuntimeTextEntryRenderStateInput['placeholderFallback'];
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

export type ChatMessageConversationBodyProps = ChatMessageThreadBodyProps['conversation'];

export type ChatMessageConversationBodyPropsInput = {
  surfaceToneStyleSlot: ChatRuntimeConversationSurfaceToneMobileStyleSlot;
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode;
  actionSet: ChatMessageActionSetInput;
  expanded: ChatMessageExpandedContentPropsInput;
  collapsed: ChatMessageCollapsedPreviewPropsInput;
  toolExecutionStack: ChatMessageToolExecutionStackPropsInput;
};

export type ChatMessageThreadBodyPropsInput =
  Pick<ChatMessageThreadBodyProps, 'bodyDisplayMode' | 'inlineActivity'>
  & {
    retryStatus: ChatMessageRetryStatusPropsInput;
    delegationCard: ChatMessageDelegationCardPropsInput;
    toolApproval: ChatMessageToolApprovalPropsInput;
    conversation: ChatMessageConversationBodyPropsInput;
  };

type ChatMessageConversationThreadVisibilityInput =
  ChatRuntimeConversationThreadVisibilityInput<Pick<ChatMessageThreadBodyPropsInput, 'bodyDisplayMode'>>;

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

type ChatMessageConversationThreadBodyState =
  ChatRuntimeConversationThreadBodyMobileState<
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

type ChatMessageConversationToolActivityGroupThreadRenderStateInput =
  ChatRuntimeConversationToolActivityGroupThreadRenderStateInput;

type ChatMessageConversationRenderableRuntimeThreadState =
  ChatRuntimeConversationRenderableRuntimeThreadState<ChatMessageThreadBodyPropsInput | null>;

type ChatMessageConversationRuntimeThreadProps = {
  threadState: ChatMessageConversationRenderableRuntimeThreadState;
  styles: ChatMessageRuntimeThreadStyleSlots;
};

type ChatMessageConversationMessageRuntimeThreadStateInput =
  ChatRuntimeConversationMessageRuntimeThreadStateInput<ChatMessageThreadBodyPropsInput>;

type ChatMessageConversationMessageRuntimeThreadState =
  ChatRuntimeConversationMessageRuntimeThreadState<ChatMessageThreadBodyPropsInput>;

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

function renderChatMessageActionButton(spec: ChatMessageActionButtonSpec) {
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

export function shouldRenderChatMessageConversationThread({
  renderContext,
  body,
}: ChatMessageConversationThreadVisibilityInput): boolean {
  return shouldRenderChatRuntimeConversationThread({ renderContext, body });
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
  return {
    threadState: getChatRuntimeConversationMessageThreadMobileState({
      itemKey,
      groupRenderState,
      groupThreadState,
      lastConversationContentMessageIndex,
      expandedMessages,
      resultOnlyToolLabel,
      bodyInput,
      createBodyState: createChatMessageConversationThreadBodyInput,
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
  return {
    threadState: getChatRuntimeConversationItemThreadMobileState({
      messageThreadInput,
      createMessageThreadState: (input) =>
        createChatMessageConversationMessageThreadRenderState(input).threadState,
      colors: messageThreadInput.colors,
      group,
      itemIndex,
      itemKey,
      groupState,
      inheritedState,
      groupKey,
      inheritedKey,
      defaultExpanded,
      onToggleGroup,
    }),
  };
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

export function createChatMessageRuntimeViewportChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
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
}: ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>): ChatMessageRuntimeViewportChromeProps<TPrompt, TTask> {
  return createChatRuntimeViewportChromeMobileProps<
    TPrompt,
    PromptLibrarySkillLike & { id: string },
    TTask,
    ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>
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
    requestDebugText,
    voiceDebugEnabled,
    voiceEvents,
    colors,
    onLoadEarlierMessages,
    ...scrollViewportProps,
  });
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
  });

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
      speakNative: Speech.speak,
      stopNativeSpeech: Speech.stop,
      speakRemote: speakRemoteTts,
      stopRemoteSpeech: stopRemoteTts,
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
  return createChatRuntimeSurfaceChromeMobileProps({
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
  });
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
  const conversationThreadListState = createChatMessageConversationRuntimeThreadListRenderState({
    ...threadList,
    colors,
    actionStyles: styles.actionStyles,
    spinnerSource,
  });
  const chatComposerRuntimeDockChrome = createChatComposerRuntimeDockChromeProps({
    colors,
    platform,
  });
  const chatComposerRuntimeDock = createChatComposerRuntimeDockProps({
    chrome: chatComposerRuntimeDockChrome,
    ...composer,
    pendingImagesColors: colors,
    composerControlColors: colors,
  });
  const chatMessageRuntimeViewport = createChatMessageRuntimeViewportChromeProps({
    ...viewport,
    colors,
    loadingSpinnerSource: spinnerSource,
    visibleMessageCount: conversationThreadListState.visibleMessageCount,
    totalMessageCount: conversationThreadListState.totalMessageCount,
    hiddenMessageCount: conversationThreadListState.hiddenMessageCount,
  });
  const chatMessageRuntimeDock = createChatMessageRuntimeDockChromeProps({
    ...dock,
    colors,
    composer: chatComposerRuntimeDock,
  });

  return createChatMessageRuntimeSurfaceChromeProps({
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

export function createChatMessageConversationThreadListRenderState({
  allMessages,
  messages,
  firstMessageIndex,
  groupByIndex,
  speakingMessageIndex,
  copiedMessageIndex,
  ...threadInput
}: ChatMessageConversationThreadListRenderStateInput): ChatMessageConversationRenderableRuntimeThreadState[] {
  return getChatRuntimeConversationThreadListMobileState({
    allMessages,
    messages,
    firstMessageIndex,
    groupByIndex,
    speakingMessageIndex,
    copiedMessageIndex,
    createThreadState: (itemState) => createChatMessageConversationItemThreadRenderState({
      ...threadInput,
      ...itemState,
    }).threadState,
  });
}

export function createChatMessageConversationRuntimeThreadListRenderState({
  messages,
  visibleMessageCount,
  ...threadListInput
}: ChatMessageConversationRuntimeThreadListRenderStateInput): ChatMessageConversationRuntimeThreadListRenderState {
  return getChatRuntimeConversationRuntimeThreadListMobileState({
    messages,
    visibleMessageCount,
    ...threadListInput,
    createThreadState: (itemState) => createChatMessageConversationItemThreadRenderState({
      ...threadListInput,
      ...itemState,
    }).threadState,
  });
}

export function createChatMessageConversationThreadBodyInput({
  ...input
}: ChatMessageConversationThreadBodyInput): ChatMessageConversationThreadBodyState {
  return getChatRuntimeConversationThreadBodyMobileState({
    ...input,
  });
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

export function createChatMessageActionComponents({
  availability,
  ...input
}: ChatMessageActionComponentsInput): ChatMessageActionComponentMap {
  return createChatMessageActionSlotRenderMap<ReactNode>(
    availability,
    createChatMessageActionRenderers(input),
  );
}

export function createChatMessageActionSet({
  renderState: actionRenderState,
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
  ...input
}: ChatMessageActionSetInput): ChatMessageActionSet {
  const turnDurationAction: ChatMessageTurnDurationActionSpec = {
    ...turnDuration,
    renderState: actionRenderState.turnDuration,
  };
  const speechAction: ChatMessageSpeechActionSpec = {
    ...speech,
    renderState: actionRenderState.speech,
    isActive: speech.isSpeaking,
  };
  const branchAction: ChatMessageBranchActionSpec = {
    ...branch,
    renderState: actionRenderState.branch,
  };
  const copyAction: ChatMessageCopyActionSpec = {
    ...copy,
    renderState: actionRenderState.copy,
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
      renderState: actionRenderState.expansion,
    },
  };
  const components = createChatMessageActionComponents({
    availability: actionRenderState.availability,
    ...actionInput,
  });

  return {
    entries: getChatMessageActionSlotRenderEntries(actionRenderState.layout.visibleSlots, components),
    shouldRenderActionSlots: actionRenderState.layout.shouldRenderActionSlots,
    shouldRenderStandaloneActions: actionRenderState.layout.shouldRenderStandaloneRow,
  };
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

export function createChatMessageConversationBodyProps({
  contentDisplayMode,
  actionSet: actionSetInput,
  expanded,
  collapsed,
  toolExecutionStack,
}: ChatMessageConversationBodyPropsInput): ChatMessageConversationBodyProps {
  const actionSet = createChatMessageActionSet(actionSetInput);

  return {
    content: {
      contentDisplayMode,
      shouldRenderActionSlots: actionSet.shouldRenderActionSlots,
      entries: actionSet.entries,
      expanded: createChatMessageExpandedContentProps(expanded),
      collapsed: createChatMessageCollapsedPreviewProps(collapsed),
    },
    toolExecutionStack: createChatMessageToolExecutionStackProps(toolExecutionStack),
    standaloneActions: {
      shouldRender: actionSet.shouldRenderStandaloneActions,
      entries: actionSet.entries,
    },
  };
}

export function createChatMessageThreadBodyProps({
  bodyDisplayMode,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyPropsInput): Omit<ChatMessageThreadBodyProps, 'styles'> {
  return {
    bodyDisplayMode,
    retryStatus: createChatMessageRetryStatusProps(retryStatus),
    delegationCard: createChatMessageDelegationCardProps(delegationCard),
    toolApproval: createChatMessageToolApprovalProps(toolApproval),
    inlineActivity: inlineActivity ?? null,
    conversation: createChatMessageConversationBodyProps(conversation),
  };
}

export function createChatMessageRetryStatusProps({
  renderState,
}: ChatMessageRetryStatusPropsInput): ChatMessageThreadBodyProps['retryStatus'] {
  return renderState
    ? {
        renderState,
      }
    : null;
}

export function createChatMessageDelegationCardProps(
  cardInput: ChatMessageDelegationCardPropsInput,
): ChatMessageThreadBodyProps['delegationCard'] {
  const presentationState = getChatRuntimeDelegationCardMobilePresentationState(cardInput);
  if (!presentationState) return null;
  const {
    onShowAllConversationPreview,
    onShowAllToolPreview,
  } = cardInput;

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
  };
}

export function createChatMessageToolApprovalProps({
  cardState,
}: ChatMessageToolApprovalPropsInput): ChatMessageThreadBodyProps['toolApproval'] {
  if (!cardState) return null;

  return {
    renderState: cardState.renderState,
    toolName: cardState.toolName,
    argumentsPreview: cardState.argumentsPreview,
    argumentsContent: cardState.argumentsContent,
    onToggleArguments: cardState.onToggleArguments,
    onDeny: cardState.onDeny,
    onApprove: cardState.onApprove,
  };
}

export function createChatMessageExpandedContentProps({
  streamingRenderState,
  markdownContent,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
}: ChatMessageExpandedContentPropsInput): ChatMessageThreadBodyContentProps['expanded'] {
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
  onPress,
}: ChatMessageCollapsedPreviewPropsInput): ChatMessageThreadBodyContentProps['collapsed'] {
  return {
    renderState,
    actionState,
    onPress,
  };
}

export function createChatMessageToolExecutionStackProps({
  isExpanded,
  renderState,
  compactRows,
  detailRows,
  compact,
  expanded,
}: ChatMessageToolExecutionStackPropsInput): ChatMessageConversationBodyProps['toolExecutionStack'] {
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
  };
}

export function createChatMessageActionStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageActionStyleSlots {
  const actionButtons = getChatMessageActionMobileButtonStatesBySlot();

  return {
    turnDuration: {
      style: styles.messageTurnDurationBadge,
      liveStyle: styles.messageTurnDurationBadgeLive,
      textStyle: styles.messageTurnDurationText,
      liveTextStyle: styles.messageTurnDurationTextLive,
    },
    speech: {
      hitSlop: actionButtons.speech.hitSlop,
      style: styles.speakButton,
      activeStyle: styles.speakButtonActive,
      pressedStyle: styles.speakButtonPressed,
    },
    branch: {
      hitSlop: actionButtons.branch.hitSlop,
      style: styles.messageBranchButton,
      pressedStyle: styles.messageBranchButtonPressed,
      disabledStyle: styles.messageBranchButtonDisabled,
    },
    copy: {
      hitSlop: actionButtons.copy.hitSlop,
      style: styles.messageCopyButton,
      activeStyle: styles.messageCopyButtonCopied,
      pressedStyle: styles.messageCopyButtonPressed,
    },
    expansion: {
      hitSlop: actionButtons.expansion.hitSlop,
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

export function useChatRuntimeNavigationHeaderRenderState({
  agentName,
  isPinned = false,
  handsFree = false,
  conversationState = null,
  isResponding = false,
  turnDurationMs = null,
  turnDurationIsLive = false,
  colors,
}: ChatRuntimeNavigationHeaderRenderStateInput): ChatRuntimeNavigationHeaderRenderState {
  return useMemo(
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
  const headerRenderState = useChatRuntimeNavigationHeaderRenderState({
    agentName,
    isPinned,
    handsFree,
    conversationState,
    isResponding,
    turnDurationMs,
    turnDurationIsLive,
    colors,
  });

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

export function createChatComposerRuntimeDockChromeProps({
  colors,
  platform,
}: ChatComposerRuntimeDockChromeInput): ChatComposerRuntimeDockChromeProps {
  const dockRenderState = getChatComposerRuntimeDockMobileRenderState({
    colors,
    platform,
  });

  return {
    ...dockRenderState,
    micButton: {
      webPressedStyle: dockRenderState.micButton.webPressedStyle as ChatComposerMicButtonProps['webPressedStyle'],
    },
  };
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
}: ChatComposerRuntimeDockChromePropsInput): Omit<ChatComposerRuntimeDockProps, 'styles'> {
  const composerControlPresentation = getChatComposerRuntimeFollowUpPresentationState({
    conversationState: composerControlConversationState,
    isResponding: composerControlIsResponding,
    isQueueEnabled: composerControlMessageQueueEnabled,
  });
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
  });
  const mobileComposerControls = controlRenderState.controls;
  const pendingImagesRenderState = getChatImageAttachmentMobileRenderState({
    colors: pendingImagesColors,
  });
  const handsFreeControlsRenderState = getChatComposerRuntimeHandsFreeControlsMobileRenderState({
    phase: handsFreeStatusPhase,
    label: handsFreeStatusLabel,
    isEnabled: handsFreeStatusEnabled,
    wakePhrase: handsFreeStatusWakePhrase,
    sleepPhrase: handsFreeStatusSleepPhrase,
    lastError: handsFreeStatusLastError,
    foregroundOnly: handsFreeStatusForegroundOnly,
  });
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
  const shortcutEmptyRenderState = getChatRuntimeHomeQuickStartEmptyMobileRenderState(shortcutRenderState, isLoading);

  return (
    <View style={styles.card}>
      {items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((item) => {
            const shortcutItemRenderState = getChatRuntimeHomeQuickStartItemMobileRenderState(
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
  const editorDismissActionState = getChatConversationHomePromptEditorDismissActionState(isSaving);
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
  const title = getChatConversationHomePromptEditorTitle(isEditing);

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
  const surfaceToneStyle = styles.surface.getToneStyle(body.conversation.surfaceToneStyleSlot);

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
  bodyDisplayMode,
  styles,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyProps) {
  if (bodyDisplayMode === 'retryStatus') {
    if (!retryStatus) return null;
    return (
      <ChatMessageRetryStatus
        {...retryStatus}
        styles={styles.retryStatus}
      />
    );
  }

  if (bodyDisplayMode === 'delegationCard') {
    if (!delegationCard) return null;
    return (
      <ChatMessageDelegationCard
        {...delegationCard}
        styles={styles.delegationCard}
      />
    );
  }

  if (bodyDisplayMode === 'toolApproval') {
    if (!toolApproval) return null;
    return (
      <ChatMessageToolApproval
        {...toolApproval}
        styles={styles.toolApproval}
      />
    );
  }

  if (bodyDisplayMode === 'inlineActivity') {
    if (!inlineActivity) return null;
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
  contentDisplayMode,
  rowStyle,
  shouldRenderActionSlots,
  entries,
  expanded,
  collapsed,
}: ChatMessageConversationContentProps) {
  if (contentDisplayMode === 'expanded') {
    return (
      <ChatMessageContentRow
        rowStyle={rowStyle}
        bodyStyle={expanded.bodyStyle}
        shouldRenderActionSlots={shouldRenderActionSlots}
        entries={entries}
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

  if (contentDisplayMode === 'collapsed') {
    return (
      <ChatMessageContentRow
        rowStyle={rowStyle}
        shouldRenderActionSlots={shouldRenderActionSlots}
        entries={entries}
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
  shouldRenderActionSlots,
  entries,
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
        shouldRender={shouldRenderActionSlots}
        entries={entries}
      />
    </View>
  );
}

export function ChatMessageStandaloneActions({
  shouldRender,
  entries,
  rowStyle,
}: ChatMessageStandaloneActionsProps) {
  if (!shouldRender) return null;

  return (
    <ChatMessageActionSlotList
      entries={entries}
      rowStyle={rowStyle}
    />
  );
}

export function ChatMessageActionSlotList({
  shouldRender = true,
  entries,
  rowStyle,
}: ChatMessageActionSlotListProps) {
  if (!shouldRender) return null;

  const content = entries.map(({ slot, item }) => (
    <Fragment key={slot}>
      {item}
    </Fragment>
  ));

  if (rowStyle) {
    return <View style={rowStyle}>{content}</View>;
  }

  return <>{content}</>;
}
