import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Platform,
  Alert,
  AppState,
  type AppStateStatus,
} from 'react-native';

const darkSpinner = require('../../assets/loading-spinner.gif');
const lightSpinner = require('../../assets/light-spinner.gif');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useConfigContext,
  saveConfig,
} from '../store/config';
import { useSessionContext } from '../store/sessions';
import { useMessageQueueContext } from '../store/message-queue';
import {
  ChatMessageRuntimeSurface,
  CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS,
  createChatConversationHomePromptEditorSaveActionState,
  getChatConversationHomePromptDeleteConfirmAlertState,
  getChatConversationHomePromptDeleteFailedAlertState,
  getChatConversationHomePromptSaveFailedAlertState,
  getChatConversationHomePromptSaveSuccessAlertState,
  getChatConversationHomePromptTaskRunFailedAlertState,
  getChatConversationHomePromptTaskStartedAlertState,
  useChatConversationHomePromptTaskRunState,
  createChatConversationHomePromptRecord,
  deleteChatConversationHomePromptFromList,
  sortChatConversationHomePromptsByUpdatedAt,
  updateChatConversationHomePromptList,
  buildChatComposerRuntimeMessageContent,
  hasChatComposerRuntimeMessageContent,
  mergeChatComposerRuntimeVoiceText,
  formatChatComposerHandsFreeRecognizerErrorDebugMessage,
  formatChatComposerHandsFreeSleepingDebugMessage,
  getChatComposerImageAttachmentAlertState,
  getChatComposerHandsFreeDebugMessage,
  getChatComposerRuntimeQueueDebugMessage,
  getChatComposerRuntimeImageDataUrlBytes,
  getChatComposerRuntimeBase64ImageBytes,
  inferChatComposerRuntimeImageMimeType,
  appendChatMessageRuntimeAssistantDebugErrorMessage,
  appendChatMessageRuntimePendingTurnMessages,
  createChatRuntimeNavigationHeaderOptions,
  createChatRuntimeNavigationHeaderRenderState,
  formatChatMessageRuntimeAlertMessage,
  formatChatMessageRuntimeConnectionErrorMessage,
  formatChatMessageRuntimeConnectionStatus,
  formatChatMessageRuntimeDebugError,
  formatChatMessageRuntimeStartingRequestDebugMessage,
  createChatRuntimeMobileConfigState,
  createChatMessageRuntimeFinalHistoryTurnMessages,
  createChatMessageRuntimeRecoverableHistoryMessages,
  createChatMessageRuntimeCompletedTurnMessages,
  createChatMessageRuntimeCompletedTextTurnMessages,
  createChatMessageRuntimeProgressMessages,
  createChatMessageRuntimeUserTextMessage,
  createChatMessageRuntimeSessionDisplayMessages,
  createChatMessageRuntimeResponseHistoryEvents,
  getChatMessageRuntimeNextResponseEventOrdinal,
  sortChatMessageRuntimeResponseEvents,
  useChatMessageRuntimeTurnDurations,
  createChatMessageRuntimeSpeechTextState,
  createChatMessageRuntimeLogMeta,
  createChatMessageRuntimeModelMessages,
  createChatMessageRuntimeRemoteSpeechSettingsState,
  getChatMessageRuntimeDefaultRemoteSpeechSettingsState,
  useChatMessageRuntimeThreadExpansionState,
  createChatMessageRuntimeChromeProps,
  getChatConversationHomeQuickStartPressIntent,
  getChatMessageRuntimeBranchCreatedAlertState,
  getChatMessageRuntimeBranchFailedAlertState,
  getChatMessageRuntimeBranchUnavailableAlertState,
  getChatMessageRuntimeDebugMessage,
  useChatMessageRuntimeHistoryWindowState,
  useChatMessageRuntimeScrollController,
  getChatMessageRuntimeKillSwitchConfirmationAlertState,
  getChatMessageRuntimeKillSwitchConnectionFailedAlertState,
  getChatMessageRuntimeKillSwitchResultAlertState,
  getChatMessageRuntimeLatestStepSummary,
  resolveChatMessageRuntimeConversationStateFromProgress,
  getChatMessageRuntimeToolApprovalConnectionRequiredAlertState,
  getChatMessageRuntimeToolApprovalFailedAlertState,
  getChatMessageRuntimeToolApprovalUnavailableAlertState,
  getChatMessageCopyFailureAlertState,
  getChatMessageToolExecutionCopyFailureResolvedAlertState,
  useChatMessageRuntimeBranchProgressState,
  useChatMessageRuntimeToolApprovalResponseState,
  useChatMessageCopyFeedbackState,
  mergeChatMessageRuntimeFinalTurnMessagesWithProgress,
  removeChatMessageRuntimePendingTurnMessages,
  removeChatMessageRuntimeToolApprovalMessage,
  replaceChatMessageRuntimeTurnMessages,
  updateLastChatMessageRuntimeAssistantErrorMessage,
  updateLastChatMessageRuntimeConversationContent,
} from '../ui/ChatMessageChrome';
import type {
  ChatComposerTextEntryKeyPressEvent,
  ChatComposerTextEntryRef,
  ChatComposerImageAttachmentAlertInput,
  ChatConversationHomeQuickStartItem,
  ChatMessageRuntimeRemoteSpeechProvider,
} from '../ui/ChatMessageChrome';
import { speakRemoteTts, stopRemoteTts } from '../lib/remoteTts';
import { useConnectionManager } from '../store/connectionManager';
import { useTunnelConnection } from '../store/tunnelConnection';
import { useProfile } from '../store/profile';
import type { AgentProgressUpdate, AgentStepSummary } from '@dotagents/shared/agent-progress';
import type { ChatMessage } from '../lib/openaiClient';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import type { RecoveryState } from '@dotagents/shared/connection-recovery';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import type { AgentConversationState } from '@dotagents/shared/conversation-state';
import type { AgentUserResponseEvent } from '@dotagents/shared/agent-progress';
import type { HandsFreePhase } from '@dotagents/shared/types';
import type {
  Loop,
  PredefinedPromptSummary,
  Skill,
} from '@dotagents/shared/api-types';
import { useHeaderHeight } from '@react-navigation/elements';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../ui/ThemeProvider';
import { useChatRuntimeMobileStyleSlots } from '../ui/ChatRuntimeMobileStyles';
import { useVoiceDebug } from '../lib/voice/voiceDebug';
import { useSpeechRecognizer } from '../lib/voice/useSpeechRecognizer';
import { useHandsFreeController } from '../lib/voice/useHandsFreeController';

interface PendingImageAttachment {
  id: string;
  name: string;
  previewUri: string;
  dataUrl: string;
}

const MAX_PENDING_IMAGES = CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages;
const MAX_PENDING_IMAGE_FILE_SIZE_BYTES = CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxFileBytes;
const MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES = CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes;
const AUTO_TTS_DUPLICATE_SUPPRESSION_MS = 5_000;
const DEFAULT_REMOTE_SPEECH_SETTINGS = getChatMessageRuntimeDefaultRemoteSpeechSettingsState();

type QuickStartShortcut = ChatConversationHomeQuickStartItem<PredefinedPromptSummary, Loop>;

export default function ChatScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const isFocused = useIsFocused();
  const {
    chatMessageConversationThreadStyles,
    chatMessageRuntimeSurfaceStyles,
    chatRuntimeHeaderStyles,
    promptEditorModalStyles,
    styles,
  } = useChatRuntimeMobileStyleSlots({
    theme,
    bottomInset: insets.bottom,
  });
  const showImageAttachmentAlert = useCallback((input: ChatComposerImageAttachmentAlertInput) => {
    const alertState = getChatComposerImageAttachmentAlertState(input);
    Alert.alert(alertState.title, alertState.message);
  }, []);
  const { config, setConfig } = useConfigContext();
  const sessionStore = useSessionContext();
  const messageQueue = useMessageQueueContext();
  const connectionManager = useConnectionManager();
  const { connectionInfo } = useTunnelConnection();
  const { currentProfile } = useProfile();
  const currentSession = sessionStore.getCurrentSession();
  const isCurrentSessionPinned = !!currentSession?.isPinned;
  const handsFree = !!config.handsFree;
  const settingsClient = useMemo(() => {
    if (!config.baseUrl || !config.apiKey) {
      return null;
    }
    return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
  }, [config.apiKey, config.baseUrl]);
  const [predefinedPrompts, setPredefinedPrompts] = useState<PredefinedPromptSummary[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Loop[]>([]);
  const [isLoadingQuickStartPrompts, setIsLoadingQuickStartPrompts] = useState(false);
  const {
    runningPromptTaskId,
    canRunPromptTask,
    beginPromptTaskRun,
    clearPromptTaskRun,
  } = useChatConversationHomePromptTaskRunState();
  const [remoteTtsProvider, setRemoteTtsProvider] =
    useState<ChatMessageRuntimeRemoteSpeechProvider>(DEFAULT_REMOTE_SPEECH_SETTINGS.provider);
  const [remoteTtsVoice, setRemoteTtsVoice] = useState<string | undefined>(DEFAULT_REMOTE_SPEECH_SETTINGS.voice);
  const [remoteTtsModel, setRemoteTtsModel] = useState<string | undefined>(DEFAULT_REMOTE_SPEECH_SETTINGS.model);
  const [remoteTtsRate, setRemoteTtsRate] = useState(DEFAULT_REMOTE_SPEECH_SETTINGS.rate);
  const {
    pendingToolApprovalResponseId,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
  } = useChatMessageRuntimeToolApprovalResponseState({
    sessionId: sessionStore.currentSessionId,
  });
  const {
    pendingBranchMessageIndex,
    beginBranchMessage,
    clearBranchMessage,
  } = useChatMessageRuntimeBranchProgressState({
    sessionId: sessionStore.currentSessionId,
  });
  const {
    copiedMessageIndex,
    clearCopiedMessageFeedback,
    showCopiedMessageFeedback,
  } = useChatMessageCopyFeedbackState();
  // Effective TTS provider/voice/rate — local mobile config takes precedence over
  // any value pulled from the connected desktop's settings.
  const effectiveTtsProvider: ChatMessageRuntimeRemoteSpeechProvider =
    config.ttsProvider === 'edge' ? 'edge' : remoteTtsProvider;
  const effectiveRemoteTtsVoice =
    config.ttsProvider === 'edge' && config.edgeTtsVoice
      ? config.edgeTtsVoice
      : remoteTtsVoice;
  const effectiveRemoteTtsModel = config.ttsProvider === 'edge' ? undefined : remoteTtsModel;
  const effectiveRemoteTtsRate =
    config.ttsProvider === 'edge' ? config.ttsRate ?? 1.0 : remoteTtsRate;
  const [addPromptModalVisible, setAddPromptModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PredefinedPromptSummary | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const chatRuntimeConfig = createChatRuntimeMobileConfigState(config);
  const {
    handsFreeMessageDebounceMs,
    handsFreeWakePhrase,
    handsFreeSleepPhrase,
    handsFreeDebugEnabled,
    handsFreeForegroundOnly,
    messageQueueEnabled,
    ttsEnabled: ttsEnabledSetting,
  } = chatRuntimeConfig;
  const handsFreeRef = useRef<boolean>(handsFree);
  useEffect(() => { handsFreeRef.current = !!config.handsFree; }, [config.handsFree]);
  const handsFreePhaseRef = useRef<HandsFreePhase>('sleeping');
  // Track ttsEnabled in a ref so speech callbacks resolved before a mute-toggle
  // (e.g. in-flight send() progress callbacks) still see the latest setting and
  // bail before queueing or playing audio.
  const ttsEnabledRef = useRef<boolean>(ttsEnabledSetting);
  useEffect(() => { ttsEnabledRef.current = ttsEnabledSetting; }, [ttsEnabledSetting]);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const isAppActive = appState === 'active';
  const handsFreeRuntimeActive = handsFree && isFocused && isAppActive;

  // TTS toggle
  const ttsEnabled = ttsEnabledSetting;
  const toggleTts = async () => {
    const next = !ttsEnabled;
    // Stop any currently playing TTS when disabling. The speaker icon doubles
    // as a "mute" control, so it must silence both native and remote (Edge)
    // playback and clear the auto-speech queue/state so nothing resumes.
    if (!next) {
      intendedSpeakingIndexRef.current = null;
      Speech.stop();
      stopRemoteTts();
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventIdRef.current = null;
      setSpeakingMessageIndex(null);
      // Only transition the hands-free controller when it was actually speaking;
      // calling onSpeechFinished mid-`processing` would prematurely return to
      // listening while a request is still in-flight.
      if (handsFreeRef.current && handsFreePhaseRef.current === 'speaking') {
        handsFreeController.onSpeechFinished();
        voiceLog('tts-stopped', 'Assistant speech stopped from speaker toggle.');
      }
    }
    const nextCfg = { ...config, ttsEnabled: next } as any;
    setConfig(nextCfg);
    try { await saveConfig(nextCfg); } catch {}
  };

  const [responding, setResponding] = useState(false);
  const [conversationState, setConversationState] = useState<AgentConversationState | null>(null);
  const [latestStepSummary, setLatestStepSummary] = useState<AgentStepSummary | null>(null);
  const [connectionState, setConnectionState] = useState<RecoveryState | null>(null);
  const [agentSelectorVisible, setAgentSelectorVisible] = useState(false);

  // Track the current active request to prevent cross-request state clobbering
  // Each request gets a unique ID; only the currently active request can reset UI states
  const activeRequestIdRef = useRef<number>(0);

  // Stable ref for current session ID to avoid stale closures in callbacks
  // This fixes the issue where useSessions() returns a new object each render
  const currentSessionIdRef = useRef<string | null>(sessionStore.currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = sessionStore.currentSessionId;
  }, [sessionStore.currentSessionId]);

  // Get or create a connection for the current session using the connection manager
  // This preserves connections when switching between sessions (fixes #608)
  const getSessionClient = useCallback(() => {
    const currentSessionId = sessionStore.currentSessionId;
    if (!currentSessionId) {
      console.warn('[ChatScreen] No current session ID, cannot get client');
      return null;
    }
    const connection = connectionManager.getOrCreateConnection(currentSessionId);
    // Note: Connection status callback is set up via subscribeToConnectionStatus in useEffect below
    // This avoids overwriting the SessionConnectionManager's internal callback (PR review fix)
    return connection.client;
  }, [connectionManager, sessionStore.currentSessionId]);

  // Subscribe to connection status changes for the current session
  // Uses subscribeToConnectionStatus to avoid overwriting the internal callback in SessionConnectionManager
  useEffect(() => {
    const currentSessionId = sessionStore.currentSessionId;
    if (!currentSessionId) {
      // Reset both connection state and responding state when there's no session
      // This prevents the UI from being stuck in "responding" state if the session
      // is deleted/cleared while ChatScreen remains mounted (PR review fix #15)
      setConnectionState(null);
      setResponding(false);
      setConversationState(null);
      setLatestStepSummary(null);
      return;
    }

    // Restore existing connection state when switching sessions
    const existingState = connectionManager.getConnectionState(currentSessionId);
    if (existingState) {
      setConnectionState(existingState);
    } else {
      setConnectionState(null);
    }

    // Check if there's an active request for this session
    const isActive = connectionManager.isConnectionActive(currentSessionId);
    setResponding(isActive);
    setConversationState(isActive ? 'running' : null);

    // Ensure connection exists for subscription
    connectionManager.getOrCreateConnection(currentSessionId);

    // Subscribe to connection status changes for this session
    // The callback uses currentSessionIdRef to always check against the latest session ID
    const unsubscribe = connectionManager.subscribeToConnectionStatus(
      currentSessionId,
      (state) => {
        // Only update UI if this is still the current session (using ref for latest value)
        if (currentSessionIdRef.current === currentSessionId) {
          setConnectionState(state);
          console.log('[ChatScreen] Connection status:', formatChatMessageRuntimeConnectionStatus(state));
        }
      }
    );

    return unsubscribe;
  }, [sessionStore.currentSessionId, connectionManager]);

  const handleKillSwitch = async () => {
    console.log('[ChatScreen] Kill switch button pressed');
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for kill switch');
      return;
    }

    if (Platform.OS === 'web') {
      const confirmationAlert = getChatMessageRuntimeKillSwitchConfirmationAlertState();
      const confirmed = window.confirm(confirmationAlert.webMessage);
      if (confirmed) {
        try {
          const result = await client.killSwitch();
          const resultAlert = getChatMessageRuntimeKillSwitchResultAlertState(result);
          window.alert(resultAlert.webMessage);
        } catch (e: any) {
          console.error('[ChatScreen] Kill switch error:', e);
          const failedAlert = getChatMessageRuntimeKillSwitchConnectionFailedAlertState(e);
          window.alert(failedAlert.webMessage);
        }
      }
      return;
    }

    const confirmationAlert = getChatMessageRuntimeKillSwitchConfirmationAlertState();
    Alert.alert(
      confirmationAlert.title,
      confirmationAlert.message,
      [
        { text: confirmationAlert.cancelLabel, style: 'cancel' },
        {
          text: confirmationAlert.confirmLabel,
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await client.killSwitch();
              const resultAlert = getChatMessageRuntimeKillSwitchResultAlertState(result);
              Alert.alert(resultAlert.title, resultAlert.message);
            } catch (e: any) {
              console.error('[ChatScreen] Kill switch error:', e);
              const failedAlert = getChatMessageRuntimeKillSwitchConnectionFailedAlertState(e);
              Alert.alert(failedAlert.title, failedAlert.message);
            }
          },
        },
      ],
    );
  };

  const handleNewChat = useCallback(() => {
    // Reset all UI states unconditionally when creating a new chat
    // This ensures the new session starts with a clean slate, even if
    // an old request is still in-flight (its callbacks will be ignored
    // via the session/request guards)
    setResponding(false);
    setConversationState(null);
    setConnectionState(null);
    setDebugInfo('');
    sessionStore.createNewSession();
  }, [sessionStore]);

  const handleInsertQuickStartPrompt = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setInput((currentValue) => {
      const existing = currentValue.trim();
      return existing.length > 0 ? `${existing}\n\n${trimmed}` : trimmed;
    });
    inputRef.current?.focus?.();
  }, []);

  const handleRunPromptTask = useCallback(async (task: Loop) => {
    if (!settingsClient || !canRunPromptTask) return;
    beginPromptTaskRun(task.id);
    try {
      await settingsClient.runLoop(task.id);
      const taskStartedAlert = getChatConversationHomePromptTaskStartedAlertState(task.name);
      Alert.alert(taskStartedAlert.title, taskStartedAlert.message);
    } catch (error: any) {
      const failedAlert = getChatConversationHomePromptTaskRunFailedAlertState(error);
      Alert.alert(failedAlert.title, failedAlert.message);
    } finally {
      clearPromptTaskRun();
    }
  }, [beginPromptTaskRun, canRunPromptTask, clearPromptTaskRun, settingsClient]);

  const openAddPromptModal = useCallback(() => {
    setEditingPrompt(null);
    setNewPromptName('');
    setNewPromptContent('');
    setAddPromptModalVisible(true);
  }, []);

  const openEditPromptModal = useCallback((prompt: PredefinedPromptSummary) => {
    setEditingPrompt(prompt);
    setNewPromptName(prompt.name);
    setNewPromptContent(prompt.content);
    setAddPromptModalVisible(true);
  }, []);

  const closePromptModal = useCallback(() => {
    if (isSavingPrompt) return;
    setAddPromptModalVisible(false);
    setEditingPrompt(null);
    setNewPromptName('');
    setNewPromptContent('');
  }, [isSavingPrompt]);

  const handleQuickStartPress = useCallback((item: QuickStartShortcut) => {
    const pressIntent = getChatConversationHomeQuickStartPressIntent(item);
    if (pressIntent.kind === 'add-prompt') {
      openAddPromptModal();
      return;
    }
    if (pressIntent.kind === 'run-task') {
      void handleRunPromptTask(pressIntent.task);
      return;
    }
    handleInsertQuickStartPrompt(pressIntent.content);
  }, [handleInsertQuickStartPrompt, handleRunPromptTask, openAddPromptModal]);

  const handleToggleCurrentSessionPinned = useCallback(() => {
    const currentSessionId = sessionStore.currentSessionId;
    if (!currentSessionId) return;
    void sessionStore.toggleSessionPinned(currentSessionId);
  }, [sessionStore]);

  const handleCopyMessage = useCallback(async (messageIndex: number, content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await Clipboard.setStringAsync(copyContent);
      showCopiedMessageFeedback(messageIndex);
    } catch (error) {
      const failedAlert = getChatMessageCopyFailureAlertState(error);
      Alert.alert(failedAlert.title, failedAlert.message);
    }
  }, [showCopiedMessageFeedback]);

  const handleCopyToolPayload = useCallback(async (content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await Clipboard.setStringAsync(copyContent);
    } catch (error) {
      const failedAlert = getChatMessageToolExecutionCopyFailureResolvedAlertState(error);
      Alert.alert(failedAlert.title, failedAlert.message);
    }
  }, []);

  const handleBranchFromMessage = useCallback(async (messageIndex: number) => {
    const serverConversationId = currentSession?.serverConversationId;
    if (!settingsClient || !serverConversationId) {
      const unavailableAlert = getChatMessageRuntimeBranchUnavailableAlertState();
      Alert.alert(unavailableAlert.title, unavailableAlert.message);
      return;
    }

    beginBranchMessage(messageIndex);
    try {
      const branchedConversation = await settingsClient.branchConversation(serverConversationId, { messageIndex });
      await sessionStore.syncWithServer(settingsClient);
      const branchedSession = sessionStore.findSessionByServerConversationId(branchedConversation.id);
      if (branchedSession) {
        sessionStore.setCurrentSession(branchedSession.id);
        navigation.navigate('Chat');
        return;
      }

      const createdAlert = getChatMessageRuntimeBranchCreatedAlertState();
      Alert.alert(createdAlert.title, createdAlert.message);
    } catch (error: any) {
      const failedAlert = getChatMessageRuntimeBranchFailedAlertState(error);
      Alert.alert(failedAlert.title, failedAlert.message);
    } finally {
      clearBranchMessage();
    }
  }, [beginBranchMessage, clearBranchMessage, currentSession?.serverConversationId, navigation, sessionStore, settingsClient]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const turnDurations = useChatMessageRuntimeTurnDurations({
    messages,
    isResponding: responding,
    conversationState,
  });
  const mobileHeaderRenderState = useMemo(
    () => createChatRuntimeNavigationHeaderRenderState({
      agentName: currentProfile?.name,
      isPinned: isCurrentSessionPinned,
      handsFree,
      conversationState,
      isResponding: responding,
      turnDurationMs: turnDurations.totalMs,
      turnDurationIsLive: turnDurations.hasLive,
      colors: theme.colors,
    }),
    [
      conversationState,
      currentProfile?.name,
      handsFree,
      isCurrentSessionPinned,
      responding,
      theme.colors,
      turnDurations.hasLive,
      turnDurations.totalMs,
    ],
  );

  const respondToToolApproval = useCallback(async (approvalId: string, approved: boolean) => {
    if (!settingsClient) {
      const connectionRequiredAlert = getChatMessageRuntimeToolApprovalConnectionRequiredAlertState();
      Alert.alert(connectionRequiredAlert.title, connectionRequiredAlert.message);
      return;
    }

    beginToolApprovalResponse(approvalId);
    try {
      const response = await settingsClient.respondToToolApproval(approvalId, approved);
      setMessages((current) => removeChatMessageRuntimeToolApprovalMessage(current, approvalId));
      if (!response.success) {
        const unavailableAlert = getChatMessageRuntimeToolApprovalUnavailableAlertState();
        Alert.alert(unavailableAlert.title, unavailableAlert.message);
      }
    } catch (error: any) {
      const failedAlert = getChatMessageRuntimeToolApprovalFailedAlertState(error);
      Alert.alert(failedAlert.title, failedAlert.message);
    } finally {
      clearToolApprovalResponse();
    }
  }, [beginToolApprovalResponse, clearToolApprovalResponse, settingsClient]);
  const {
    visibleMessageCount,
    loadEarlierMessages,
    loadIncrement: messageHistoryLoadIncrement,
    scrollEventThrottleMs,
    dragEndDebounceMs,
    bottomResumeThresholdPx,
    topLoadThresholdPx,
  } = useChatMessageRuntimeHistoryWindowState({
    messageCount: messages.length,
    sessionId: sessionStore.currentSessionId,
  });
  const {
    scrollRef: scrollViewRef,
    shouldAutoScroll,
    onScroll: handleScroll,
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    scrollToBottom: handleScrollToBottomPress,
  } = useChatMessageRuntimeScrollController({
    messages,
    sessionId: sessionStore.currentSessionId,
    visibleMessageCount,
    bottomResumeThresholdPx,
    topLoadThresholdPx,
    dragEndDebounceMs,
    onLoadEarlierMessages: loadEarlierMessages,
  });
  // Keep a ref to messages to avoid stale closures in setTimeout callbacks (PR review fix)
  const messagesRef = useRef<ChatMessage[]>(messages);
  // Track progress messages so we can merge them with final conversationHistory
  // instead of replacing, preventing intermediate messages from disappearing (#1083)
  const progressMessagesRef = useRef<ChatMessage[]>([]);
  // Track respond_to_user history for the current session (Issue #26)
  const [respondToUserHistory, setRespondToUserHistory] = useState<AgentUserResponseEvent[]>([]);
  const respondToUserHistoryRef = useRef<AgentUserResponseEvent[]>([]);
  const nextResponseEventOrdinalRef = useRef(1);
  const playedResponseEventIdsRef = useRef<Set<string>>(new Set());
  const queuedResponseEventsRef = useRef<AgentUserResponseEvent[]>([]);
  const activeAutoSpeechEventIdRef = useRef<string | null>(null);
  const recentAutoSpeechByTextRef = useRef<Map<string, number>>(new Map());
  useEffect(() => { messagesRef.current = messages; }, [messages]);
	// Stable ref to the latest send() to avoid stale closures in speech callbacks
	const sendRef = useRef<(text: string) => Promise<void>>(async () => {});
	  const [input, setInput] = useState('');
	  const [pendingImages, setPendingImages] = useState<PendingImageAttachment[]>([]);
	  const inputRef = useRef<ChatComposerTextEntryRef>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const {
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
  } = useChatMessageRuntimeThreadExpansionState({
    messages,
    isResponding: responding,
  });
  // Track the last failed message for retry functionality
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
	  const [willCancel, setWillCancel] = useState(false);
	  const { events: voiceEvents, log: voiceLog, clear: clearVoiceDebug } = useVoiceDebug(handsFreeDebugEnabled);
	  useEffect(() => {
		if (!handsFreeDebugEnabled) {
			clearVoiceDebug();
		}
	  }, [clearVoiceDebug, handsFreeDebugEnabled]);

	  const handsFreeController = useHandsFreeController({
		enabled: handsFree,
		runtimeActive: handsFreeRuntimeActive,
		wakePhrase: handsFreeWakePhrase,
		sleepPhrase: handsFreeSleepPhrase,
		log: voiceLog,
	  });
  useEffect(() => {
    handsFreePhaseRef.current = handsFreeController.state.phase;
  }, [handsFreeController.state.phase]);

	  const {
		listening,
		liveTranscript,
		sttPreview,
		micButtonRef,
		startRecording,
		stopRecognitionOnly,
		handlePushToTalkPressIn,
		handlePushToTalkPressOut,
		  } = useSpeechRecognizer({
			handsFree,
				handsFreeDebounceMs: handsFreeMessageDebounceMs,
			willCancel,
		audioInputDeviceId: config.audioInputDeviceId,
		onVoiceFinalized: ({ text, mode }) => {
			const finalText = text.trim();
			if (!finalText) return;

			if (mode === 'edit') {
				setInput((current) => mergeChatComposerRuntimeVoiceText(current, finalText));
				setDebugInfo(getChatComposerHandsFreeDebugMessage('transcriptAdded'));
				setTimeout(() => inputRef.current?.focus(), 0);
				return;
			}

				if (mode === 'handsfree') {
					if (handsFreeRef.current) {
						const action = handsFreeController.handleFinalTranscript(finalText);
						if (action.type === 'send') {
							void sendRef.current(action.text);
						}
						return;
					}
				}

			void sendRef.current(finalText);
		},
		onRecognizerError: (message) => {
			handsFreeController.onRecognizerError(message);
			setDebugInfo(formatChatComposerHandsFreeRecognizerErrorDebugMessage(message));
		},
		onPermissionDenied: () => {
			setDebugInfo(getChatComposerHandsFreeDebugMessage('permissionDenied'));
		},
			log: voiceLog,
		  });

  const toggleHandsFree = useCallback(async () => {
    const next = !handsFreeRef.current;
    handsFreeRef.current = next;
    const nextCfg = { ...config, handsFree: next } as any;
    setConfig(nextCfg);
    try { await saveConfig(nextCfg); } catch {}
    if (!next) {
      handsFreeController.reset();
      void stopRecognitionOnly?.();
      Speech.stop();
      stopRemoteTts();
      setDebugInfo(getChatComposerHandsFreeDebugMessage('disabled'));
    } else {
      setDebugInfo(getChatComposerHandsFreeDebugMessage('enabled'));
    }
  }, [config, handsFreeController, setConfig, stopRecognitionOnly]);

  useLayoutEffect(() => {
    navigation?.setOptions?.(createChatRuntimeNavigationHeaderOptions({
      ...mobileHeaderRenderState,
      onAgentSelectorPress: () => setAgentSelectorVisible(true),
      onBackButtonPress: () => navigation.navigate('Sessions'),
      onPinButtonPress: handleToggleCurrentSessionPinned,
      conversationStatusSpinnerSource: isDark ? darkSpinner : lightSpinner,
      onKillSwitchButtonPress: handleKillSwitch,
      onHandsFreeButtonPress: toggleHandsFree,
      styles: chatRuntimeHeaderStyles,
    }));
  }, [navigation, handleKillSwitch, handleToggleCurrentSessionPinned, mobileHeaderRenderState, isDark, chatRuntimeHeaderStyles, toggleHandsFree]);

		  useEffect(() => {
			const subscription = AppState.addEventListener('change', (nextState) => {
				setAppState(nextState);
		});
		return () => subscription.remove();
	  }, []);

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
			}, 2500);
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
		handsFree,
		handsFreeController.resetError,
		handsFreeController.shouldKeepRecognizerActive,
		handsFreeController.state.phase,
		listening,
		startRecording,
		stopRecognitionOnly,
	  ]);

	  const speakAssistantResponse = useCallback((content: string, reason: string, onSettled?: () => void) => {
		// Honor a mute that may have happened after this callback was scheduled but
		// before it ran (stale closures inside in-flight send() progress handlers).
		if (!ttsEnabledRef.current) {
			onSettled?.();
			return false;
		}
    const speechText = createChatMessageRuntimeSpeechTextState(content);
		if (!speechText) {
				onSettled?.();
			return false;
		}

      const ttsTextKey = speechText.autoTextKey;
      const processedText = speechText.processedText;
      const now = Date.now();
      const lastSpokenAt = recentAutoSpeechByTextRef.current.get(ttsTextKey) ?? 0;
      if (now - lastSpokenAt < AUTO_TTS_DUPLICATE_SUPPRESSION_MS) {
        onSettled?.();
        return false;
      }
      recentAutoSpeechByTextRef.current.set(ttsTextKey, now);
      for (const [key, spokenAt] of recentAutoSpeechByTextRef.current) {
        if (now - spokenAt > AUTO_TTS_DUPLICATE_SUPPRESSION_MS) {
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
			// Remote desktop TTS routes through the paired desktop's /v1/tts/speak.
			void speakRemoteTts(processedText, {
				baseUrl: config.baseUrl,
				apiKey: config.apiKey,
				providerId: effectiveTtsProvider,
				voice: effectiveRemoteTtsVoice,
				model: effectiveRemoteTtsModel,
				rate: effectiveRemoteTtsRate,
				onDone: settle,
				onError: settle,
				onStopped: settle,
			});
			return true;
		}

		const speechOptions: Speech.SpeechOptions = {
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
		Speech.speak(processedText, speechOptions);
		return true;
		  }, [config.apiKey, config.baseUrl, config.ttsPitch, config.ttsRate, config.ttsVoiceId, effectiveRemoteTtsModel, effectiveRemoteTtsRate, effectiveRemoteTtsVoice, effectiveTtsProvider, handsFree, handsFreeController, voiceLog]);

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

  const processAutoSpeechQueue = useCallback(() => {
    if (activeAutoSpeechEventIdRef.current || queuedResponseEventsRef.current.length === 0) {
      return;
    }

    const nextEvent = queuedResponseEventsRef.current.shift();
    if (!nextEvent) return;
    activeAutoSpeechEventIdRef.current = nextEvent.id;

    const spoken = speakAssistantResponse(nextEvent.text, `response event ${nextEvent.ordinal}`, () => {
      activeAutoSpeechEventIdRef.current = null;
      processAutoSpeechQueue();
    });

    if (!spoken) {
      activeAutoSpeechEventIdRef.current = null;
      processAutoSpeechQueue();
      return;
    }

    playedResponseEventIdsRef.current.add(nextEvent.id);
  }, [speakAssistantResponse]);

  const enqueueResponseEventsForSpeech = useCallback((events: AgentUserResponseEvent[]) => {
    // Use the ref alongside the captured config so a mute that landed after this
    // callback was scheduled still suppresses queueing.
    if (config.ttsEnabled === false || !ttsEnabledRef.current || !events.length) return;

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

    processAutoSpeechQueue();
  }, [config.ttsEnabled, processAutoSpeechQueue]);

  // Per-message TTS: track which message index is currently being spoken (#1078)
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  // Ref to track the intended speaking index, preventing race conditions
  // when Speech.stop()'s onStopped fires after a new Speech.speak() starts
  const intendedSpeakingIndexRef = useRef<number | null>(null);

  const speakMessage = useCallback((index: number, content: string) => {
    if (speakingMessageIndex === index) {
      // Toggle off - stop speaking
      intendedSpeakingIndexRef.current = null;
      Speech.stop();
	      if (handsFree) {
	        handsFreeController.onSpeechFinished();
	        voiceLog('tts-stopped', 'Assistant speech stopped from message playback.');
	      }
      setSpeakingMessageIndex(null);
      return;
    }
    // Stop any current speech first
    intendedSpeakingIndexRef.current = index;
    Speech.stop();
    stopRemoteTts();
    const speechText = createChatMessageRuntimeSpeechTextState(content);
    if (!speechText) {
      intendedSpeakingIndexRef.current = null;
      return;
    }
    const processedText = speechText.processedText;
	    if (handsFree) {
	      handsFreeController.onSpeechStarted();
	      voiceLog('tts-started', 'Assistant speech started from message playback.');
	    }
    setSpeakingMessageIndex(index);
    if (effectiveTtsProvider !== 'native' && config.baseUrl && config.apiKey) {
      // Remote desktop TTS routes through the paired desktop's /v1/tts/speak.
      void speakRemoteTts(processedText, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: effectiveTtsProvider,
        voice: effectiveRemoteTtsVoice,
        model: effectiveRemoteTtsModel,
        rate: effectiveRemoteTtsRate,
        onDone: () => {
          intendedSpeakingIndexRef.current = null;
          if (handsFree) {
            handsFreeController.onSpeechFinished();
            voiceLog('tts-stopped', 'Assistant speech finished from message playback.');
          }
          setSpeakingMessageIndex(null);
        },
        onError: () => {
          intendedSpeakingIndexRef.current = null;
          if (handsFree) {
            handsFreeController.onSpeechFinished();
            voiceLog('tts-stopped', 'Assistant speech errored during message playback.');
          }
          setSpeakingMessageIndex(null);
        },
        onStopped: () => {
          if (intendedSpeakingIndexRef.current === null) {
            if (handsFree) {
              handsFreeController.onSpeechFinished();
              voiceLog('tts-stopped', 'Assistant speech stopped during message playback.');
            }
            setSpeakingMessageIndex(null);
          }
        },
      });
      return;
    }

    const speechOptions: Speech.SpeechOptions = {
      language: 'en-US',
      rate: config.ttsRate ?? 1.0,
      pitch: config.ttsPitch ?? 1.0,
      onDone: () => {
        intendedSpeakingIndexRef.current = null;
	        if (handsFree) {
	          handsFreeController.onSpeechFinished();
	          voiceLog('tts-stopped', 'Assistant speech finished from message playback.');
	        }
        setSpeakingMessageIndex(null);
      },
      onError: () => {
        intendedSpeakingIndexRef.current = null;
	        if (handsFree) {
	          handsFreeController.onSpeechFinished();
	          voiceLog('tts-stopped', 'Assistant speech errored during message playback.');
	        }
        setSpeakingMessageIndex(null);
      },
      onStopped: () => {
        // Only clear if this callback is for the current intended message,
        // not a stale callback from a previously stopped utterance
        if (intendedSpeakingIndexRef.current === null) {
	          if (handsFree) {
	            handsFreeController.onSpeechFinished();
	            voiceLog('tts-stopped', 'Assistant speech stopped during message playback.');
	          }
          setSpeakingMessageIndex(null);
        }
      },
    };
    if (config.ttsVoiceId) {
      speechOptions.voice = config.ttsVoiceId;
    }
    Speech.speak(processedText, speechOptions);
	  }, [
		speakingMessageIndex,
		config.apiKey,
		config.baseUrl,
		config.ttsRate,
		config.ttsPitch,
		config.ttsVoiceId,
		effectiveRemoteTtsModel,
		effectiveRemoteTtsRate,
		effectiveRemoteTtsVoice,
		effectiveTtsProvider,
		handsFree,
		handsFreeController,
		voiceLog,
	  ]);

  // Cleanup: stop speech on unmount (#1078)
  useEffect(() => {
    return () => {
      Speech.stop();
      stopRemoteTts();
    };
  }, []);

  useEffect(() => {
    if (!settingsClient || !isFocused) {
      if (!settingsClient) {
        setPredefinedPrompts([]);
        setAvailableSkills([]);
        setAvailableTasks([]);
        setIsLoadingQuickStartPrompts(false);
      }
      return;
    }

    let cancelled = false;
    setIsLoadingQuickStartPrompts(true);

    Promise.allSettled([
      settingsClient.getSettings(),
      settingsClient.getSkills(),
      settingsClient.getLoops(),
    ] as const)
      .then(([settingsResult, skillsResult, loopsResult]) => {
        if (cancelled) return;

        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value;
          const nextPrompts = sortChatConversationHomePromptsByUpdatedAt(settings.predefinedPrompts || []);
          const remoteSpeechSettings = createChatMessageRuntimeRemoteSpeechSettingsState(settings);
          setPredefinedPrompts(nextPrompts);
          setRemoteTtsProvider(remoteSpeechSettings.provider);
          setRemoteTtsVoice(remoteSpeechSettings.voice);
          setRemoteTtsModel(remoteSpeechSettings.model);
          setRemoteTtsRate(remoteSpeechSettings.rate);
        } else {
          setPredefinedPrompts([]);
        }

        setAvailableSkills(skillsResult.status === 'fulfilled' ? skillsResult.value.skills : []);
        setAvailableTasks(loopsResult.status === 'fulfilled' ? loopsResult.value.loops : []);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingQuickStartPrompts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isFocused, settingsClient]);

  const handleSavePrompt = async () => {
    const draft = { name: newPromptName, content: newPromptContent };
    const saveActionState = createChatConversationHomePromptEditorSaveActionState({
      draft,
      isEditing: Boolean(editingPrompt),
      isSaving: isSavingPrompt,
    });
    if (!settingsClient || saveActionState.isDisabled) return;
    setIsSavingPrompt(true);
    try {
      const now = Date.now();
      const updatedPrompts = editingPrompt
        ? updateChatConversationHomePromptList(predefinedPrompts, editingPrompt.id, draft, now)
        : [
          createChatConversationHomePromptRecord(draft, now),
          ...predefinedPrompts,
        ];

      await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(sortChatConversationHomePromptsByUpdatedAt(updatedPrompts));
      setAddPromptModalVisible(false);
      setEditingPrompt(null);
      setNewPromptName('');
      setNewPromptContent('');
      const successAlert = getChatConversationHomePromptSaveSuccessAlertState(Boolean(editingPrompt));
      Alert.alert(successAlert.title, successAlert.message);
    } catch (error: any) {
      console.error('[ChatScreen] Error saving prompt:', error);
      const failedAlert = getChatConversationHomePromptSaveFailedAlertState(error);
      Alert.alert(failedAlert.title, failedAlert.message);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleDeletePrompt = useCallback((prompt: PredefinedPromptSummary) => {
    if (!settingsClient) return;

    const deletePrompt = async () => {
      setIsSavingPrompt(true);
      try {
        const updatedPrompts = deleteChatConversationHomePromptFromList(predefinedPrompts, prompt.id);
        await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
        setPredefinedPrompts(updatedPrompts);
      } catch (error: any) {
        console.error('[ChatScreen] Error deleting prompt:', error);
        const failedAlert = getChatConversationHomePromptDeleteFailedAlertState(error);
        Alert.alert(failedAlert.title, failedAlert.message);
      } finally {
        setIsSavingPrompt(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (message?: string) => boolean }).confirm;
      const confirmAlert = getChatConversationHomePromptDeleteConfirmAlertState(prompt.name);
      if (confirmFn?.(confirmAlert.webMessage)) {
        void deletePrompt();
      }
      return;
    }

    const confirmAlert = getChatConversationHomePromptDeleteConfirmAlertState(prompt.name);
    Alert.alert(confirmAlert.title, confirmAlert.message, [
      { text: confirmAlert.cancelLabel, style: 'cancel' },
      { text: confirmAlert.deleteLabel, style: 'destructive', onPress: () => { void deletePrompt(); } },
    ]);
  }, [predefinedPrompts, settingsClient]);

  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const pendingLazyLoadSessionIdRef = useRef<string | null>(null);
  // Set to true before hydrating local state from a server lazy-load so the
  // persistence effect doesn't re-save the just-fetched messages (which would
  // regenerate IDs/timestamps and cause unnecessary updatedAt drift).
  const skipNextPersistRef = useRef(false);

  // Load messages when currentSession changes (fixes #470)
  useEffect(() => {
    const currentSessionId = sessionStore.currentSessionId;
    const hasServerAuth = !!config.baseUrl && !!config.apiKey;
    let currentSession = sessionStore.getCurrentSession();
    const shouldAttemptStubLoad = !!(
      currentSession &&
      currentSession.messages.length === 0 &&
      currentSession.serverConversationId &&
      hasServerAuth
    );

    // Avoid repeated work on stable sessions unless we still need to lazy-load stub messages.
    if (lastLoadedSessionIdRef.current === currentSessionId && !shouldAttemptStubLoad) {
      return;
    }

    const isSessionSwitch = lastLoadedSessionIdRef.current !== currentSessionId;
    if (isSessionSwitch) {
      resetThreadExpansionState();
      clearCopiedMessageFeedback();
      setLatestStepSummary(null);
      // Clear respond_to_user history for the new session
	      replaceResponseHistory([]);
      playedResponseEventIdsRef.current = new Set();
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventIdRef.current = null;
      // Clear stale in-flight marker when switching sessions.
      pendingLazyLoadSessionIdRef.current = null;
      // Clear skipNextPersistRef to prevent the first real message in the new session
      // from being skipped if a lazy-load from the previous session had set it.
      skipNextPersistRef.current = false;
    }

    // If we have an existing session, always load its messages regardless of deletions
    if (currentSession) {
      lastLoadedSessionIdRef.current = currentSession.id;

      if (currentSession.messages.length > 0) {
        const chatMessages = createChatMessageRuntimeSessionDisplayMessages<ChatMessage>(
          currentSession.messages,
        );
        setMessages(chatMessages);

        // Extract respond_to_user content from saved messages for display (#32, #33)
        const savedResponses = createChatMessageRuntimeResponseHistoryEvents(chatMessages);
	        replaceResponseHistory(savedResponses);
        playedResponseEventIdsRef.current = new Set(savedResponses.map((event) => event.id));
        queuedResponseEventsRef.current = [];
        activeAutoSpeechEventIdRef.current = null;
      } else if (currentSession.serverConversationId && hasServerAuth) {
        // Stub session — lazy-load messages from server
        setMessages([]);
	        replaceResponseHistory([]);
        const stubSessionId = currentSession.id;
        if (pendingLazyLoadSessionIdRef.current === stubSessionId) {
          return;
        }
        pendingLazyLoadSessionIdRef.current = stubSessionId;
        const client = settingsClient || new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
        sessionStore.loadSessionMessages(stubSessionId, client)
          .then((result) => {
            if (!result) return;
            // Ignore late results if the user switched sessions while loading.
            if (currentSessionIdRef.current !== stubSessionId) return;
            // Skip persistence whenever loadSessionMessages returned messages that are
            // already in the store (both freshly fetched and in-flight bail-out cases)
            // to avoid ID/updatedAt regeneration. The flag is always cleared by the
            // persistence effect on the next render (or immediately if length is unchanged).
            if (result.messages.length > 0) {
              skipNextPersistRef.current = true;
            }
            const loadedMessages = createChatMessageRuntimeSessionDisplayMessages<ChatMessage>(
              result.messages,
              { includeId: true },
            );
            setMessages(loadedMessages);

            // Extract respond_to_user content from lazy-loaded messages (#32, #33)
            const lazyResponses = createChatMessageRuntimeResponseHistoryEvents(loadedMessages);
	            replaceResponseHistory(lazyResponses);
            playedResponseEventIdsRef.current = new Set(lazyResponses.map((event) => event.id));
            queuedResponseEventsRef.current = [];
            activeAutoSpeechEventIdRef.current = null;
          })
          .catch((err) => {
            console.warn('[ChatScreen] Failed to lazy-load session messages:', err);
          })
          .finally(() => {
            if (pendingLazyLoadSessionIdRef.current === stubSessionId) {
              pendingLazyLoadSessionIdRef.current = null;
            }
          });
      } else {
        setMessages([]);
	        replaceResponseHistory([]);
      }
      return;
    }

    // No current session - only auto-create if no deletions are in progress (fixes #571)
    // This prevents race conditions where a new session is created before the deletion completes
    if (sessionStore.deletingSessionIds.size > 0) {
      return;
    }

    currentSession = sessionStore.createNewSession();
    lastLoadedSessionIdRef.current = currentSession.id;

    if (currentSession.messages.length > 0) {
      const chatMessages = createChatMessageRuntimeSessionDisplayMessages<ChatMessage>(
        currentSession.messages,
      );
      setMessages(chatMessages);

      // Extract respond_to_user content from new session messages (#32, #33)
      const newResponses = createChatMessageRuntimeResponseHistoryEvents(chatMessages);
	      replaceResponseHistory(newResponses);
      playedResponseEventIdsRef.current = new Set(newResponses.map((event) => event.id));
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventIdRef.current = null;
    } else {
      setMessages([]);
	      replaceResponseHistory([]);
    }
	  }, [sessionStore.currentSessionId, sessionStore, sessionStore.deletingSessionIds.size, config.baseUrl, config.apiKey, settingsClient, clearCopiedMessageFeedback, replaceResponseHistory, resetThreadExpansionState]);

  // Auto-send initialMessage from route params (e.g. from rapid fire mode in SessionListScreen)
  const initialMessageRef = useRef<string | null>(route?.params?.initialMessage ?? null);
  const initialMessageSentRef = useRef(false);
	useEffect(() => {
		const nextInitial = route?.params?.initialMessage;
		if (!nextInitial || typeof nextInitial !== 'string') return;
		initialMessageRef.current = nextInitial;
		initialMessageSentRef.current = false;
		voiceLog('state-transition', 'Route initial message received.', { initialMessage: nextInitial });
	}, [route?.params?.initialMessage, voiceLog]);
  useEffect(() => {
    if (!initialMessageRef.current || initialMessageSentRef.current) return;
    if (!sessionStore.currentSessionId) return;
    initialMessageSentRef.current = true;
    const msg = initialMessageRef.current;
    initialMessageRef.current = null;
		try { navigation?.setParams?.({ initialMessage: undefined }); } catch {}
    // Small delay to ensure the session is fully loaded and the component is rendered
    const timer = setTimeout(() => {
      void sendRef.current(msg);
    }, 300);
    return () => clearTimeout(timer);
	}, [navigation, sessionStore.currentSessionId]);

  const prevMessagesLengthRef = useRef(0);
  const prevSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentSessionId = sessionStore.currentSessionId;

    // Don't save messages if the current session is being deleted (fixes #571)
    // Only skip if the current session is in the deleting set, not for any deletion
    if (currentSessionId && sessionStore.deletingSessionIds.has(currentSessionId)) {
      return;
    }

    const isSessionSwitch = prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId;
    prevSessionIdRef.current = currentSessionId;

    if (isSessionSwitch) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > 0 && messages.length !== prevMessagesLengthRef.current) {
      if (skipNextPersistRef.current) {
        // Messages were just hydrated from a server lazy-load and are already
        // saved by loadSessionMessages; skip to avoid ID/updatedAt regeneration.
        skipNextPersistRef.current = false;
      } else {
        sessionStore.setMessages(messages);
      }
    } else if (skipNextPersistRef.current) {
      // Length didn't change (or is 0), so the effect above won't fire — clear
      // the flag now to prevent it from accidentally skipping the next real
      // message persistence (e.g., lazy-load returned same count as before).
      skipNextPersistRef.current = false;
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, sessionStore, sessionStore.currentSessionId, sessionStore.deletingSessionIds]);

  const convoRef = useRef<string | undefined>(undefined);

  // Get the current conversation ID for queue operations
  const currentConversationId = sessionStore.currentSessionId || 'default';

  // Get queued messages for the current conversation
  const queuedMessages = messageQueue.getQueue(currentConversationId);
  const isMessageQueuePaused = messageQueue.isQueuePaused(currentConversationId);
  const nextQueuedMessage = !responding && !isMessageQueuePaused ? messageQueue.peek(currentConversationId) : null;
  const handlePickImages = useCallback(async () => {
    if (pendingImages.length >= MAX_PENDING_IMAGES) {
      showImageAttachmentAlert({
        reason: 'limitReached',
        maxImages: MAX_PENDING_IMAGES,
      });
      return;
    }

    const existingEmbeddedBytes = pendingImages.reduce(
      (sum, image) => sum + getChatComposerRuntimeImageDataUrlBytes(image.dataUrl),
      0
    );
    if (existingEmbeddedBytes >= MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES) {
      showImageAttachmentAlert({
        reason: 'budgetReached',
        maxBytes: MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES,
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PENDING_IMAGES - pendingImages.length,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const slotsRemaining = MAX_PENDING_IMAGES - pendingImages.length;
      const selectedAssets = result.assets.slice(0, slotsRemaining);
      const nextImages: PendingImageAttachment[] = [];
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
        if (fileSizeBytes > MAX_PENDING_IMAGE_FILE_SIZE_BYTES) {
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
        if (runningEmbeddedBytes + embeddedBytes > MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES) {
          budgetExceededNames.push(displayName);
          return;
        }
        runningEmbeddedBytes += embeddedBytes;

        const fileName = asset.fileName || `image-${Date.now()}-${index + 1}`;
        nextImages.push({
          id: `${Date.now()}-${index}-${asset.uri}`,
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
          maxBytes: MAX_PENDING_IMAGE_FILE_SIZE_BYTES,
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
          maxBytes: MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES,
        });
      }
    } catch (error: any) {
      showImageAttachmentAlert({
        reason: 'pickerError',
        error,
      });
    }
  }, [pendingImages, showImageAttachmentAlert]);

  const removePendingImage = useCallback((attachmentId: string) => {
    setPendingImages((prev) => prev.filter((image) => image.id !== attachmentId));
  }, []);

  const send = async (text: string, options?: { fromComposer?: boolean }) => {
    if (!text.trim()) return;

    // If message queue is enabled and we're already responding, queue the message
    if (messageQueueEnabled && responding) {
      console.log('[ChatScreen] Agent busy, queuing message:', createChatMessageRuntimeLogMeta(text));
      messageQueue.enqueue(currentConversationId, text, currentConversationId);
      setInput('');
      if (options?.fromComposer) {
        setPendingImages([]);
      }
      return;
    }

    console.log('[ChatScreen] Sending message:', createChatMessageRuntimeLogMeta(text));

    // Get client from connection manager (preserves connections across session switches)
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for send');
      setDebugInfo(formatChatMessageRuntimeDebugError(getChatMessageRuntimeDebugMessage('noSessionAvailable')));
      return;
    }

    setDebugInfo(formatChatMessageRuntimeStartingRequestDebugMessage(config.baseUrl));
    // Clear any previous failed message when starting a new send
    setLastFailedMessage(null);

    const userMsg: ChatMessage = createChatMessageRuntimeUserTextMessage(text);
	    // Use ref to avoid stale closures (notably auto-send after rapid-fire session switch).
	    const currentMessages = messagesRef.current;
    const messageCountBeforeTurn = currentMessages.length;
    // Clear progress messages ref for this new request (#1083)
    progressMessagesRef.current = [];
    setLatestStepSummary(null);
    setMessages((m) => appendChatMessageRuntimePendingTurnMessages(m, userMsg));
    setResponding(true);
    setConversationState('running');
	    if (handsFree) {
	      handsFreeController.onRequestStarted();
	    }

    // Generate a unique request ID for this request
    // This prevents cross-request race conditions on view-level state
    const thisRequestId = Date.now();
    // Note: We keep activeRequestIdRef for backward compatibility and view-level state,
    // but the primary "superseded" check now uses per-session tracking (PR review fix #13)
    activeRequestIdRef.current = thisRequestId;

    const currentSession = sessionStore.getCurrentSession();
    const startingServerConversationId = currentSession?.serverConversationId;

    console.log('[ChatScreen] Session info:', {
      sessionId: currentSession?.id,
      serverConversationId: startingServerConversationId || 'new',
      requestId: thisRequestId
    });

    setInput('');
	    if (options?.fromComposer) {
	      setPendingImages([]);
	    }

    // Capture the session ID at request start to guard against session changes
    const requestSessionId = sessionStore.currentSessionId;
    let resolvedConversationId: string | undefined;

    if (requestSessionId && !startingServerConversationId) {
      sessionStore.markPendingServerConversation(requestSessionId, true);
    }

    // Mark this request as the latest for this session in the connection manager
    // and increment active request count
    // This enables per-session request tracking to prevent cross-session superseding (PR review fix #13)
    if (requestSessionId) {
      connectionManager.setLatestRequestId(requestSessionId, thisRequestId);
      connectionManager.incrementActiveRequests(requestSessionId);
    }

    try {
      let streamingText = '';
      let latestConversationState: AgentConversationState = 'running';
      // Track userResponse from progress updates for TTS
      // This is set via the respond_to_user tool and takes priority over finalText
      let lastUserResponse: string | undefined;
	      let lastResponseEvents: AgentUserResponseEvent[] = [];
	      let midTurnLegacyResponseText: string | undefined;

      const serverConversationId = sessionStore.getServerConversationId();
	      console.log('[ChatScreen] Starting chat request with', currentMessages.length + 1, 'messages, conversationId:', serverConversationId || 'new');
      setDebugInfo(getChatMessageRuntimeDebugMessage('requestSent'));

      const onProgress = (update: AgentProgressUpdate) => {
        // Guard: skip update if session has changed since request started
        // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
        if (currentSessionIdRef.current !== requestSessionId) {
          console.log('[ChatScreen] Session changed, skipping onProgress update');
          return;
        }
        // Guard: skip update if this request is no longer the latest one for this session
        // Uses per-session tracking to prevent cross-session sends from incorrectly superseding (PR review fix #13)
        if (requestSessionId && connectionManager.getLatestRequestId(requestSessionId) !== thisRequestId) {
          console.log('[ChatScreen] Request superseded within same session, skipping onProgress update');
          return;
        }
        latestConversationState = resolveChatMessageRuntimeConversationStateFromProgress(update, 'running');
        setConversationState(latestConversationState);
        if (update.responseEvents?.length) {
	          lastResponseEvents = sortChatMessageRuntimeResponseEvents(update.responseEvents);
	          mergeResponseEvents(lastResponseEvents);
	          enqueueResponseEventsForSpeech(lastResponseEvents);
	          lastUserResponse = lastResponseEvents[lastResponseEvents.length - 1]?.text;
	        } else if (update.userResponse || update.spokenContent) {
	          const responseText = update.userResponse || update.spokenContent;
	          if (responseText && responseText !== lastUserResponse) {
		            const fallbackEvent = createFallbackResponseEvent(
		              requestSessionId,
		              update.runId,
		              responseText,
		            );
	            mergeResponseEvents([fallbackEvent]);
	          }
	          lastUserResponse = responseText;
	          if (responseText && responseText !== midTurnLegacyResponseText && ttsEnabledRef.current) {
	            midTurnLegacyResponseText = responseText;
		            speakAssistantResponse(responseText, 'mid-turn progress');
	          }
	        }
        const nextStepSummary = getChatMessageRuntimeLatestStepSummary(update);
        if (nextStepSummary) {
          setLatestStepSummary(nextStepSummary);
        }
        const progressMessages = createChatMessageRuntimeProgressMessages<ChatMessage>(update);
        if (progressMessages.length > 0) {
          // Store progress messages so we can merge with final history (#1083)
          progressMessagesRef.current = progressMessages;
          setMessages((m) => replaceChatMessageRuntimeTurnMessages(
            m,
            messageCountBeforeTurn,
            progressMessages,
          ));
        }
      };

      const onToken = (tok: string) => {
        // Guard: skip update if session has changed since request started
        // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
        if (currentSessionIdRef.current !== requestSessionId) {
          console.log('[ChatScreen] Session changed, skipping onToken update');
          return;
        }
        // Guard: skip update if this request is no longer the latest one for this session
        // Uses per-session tracking to prevent cross-session sends from incorrectly superseding (PR review fix #13)
        if (requestSessionId && connectionManager.getLatestRequestId(requestSessionId) !== thisRequestId) {
          console.log('[ChatScreen] Request superseded within same session, skipping onToken update');
          return;
        }
        // Handle both delta tokens and full-text updates.
        // Progress events with streamingContent.text send the full accumulated text,
        // while SSE delta events send just the new token.
        // Detect full-text updates to prevent double-words from compounding tokens.
        if (tok.startsWith(streamingText) && tok.length >= streamingText.length) {
          streamingText = tok;
        } else {
          streamingText += tok;
        }

        setMessages((m) => updateLastChatMessageRuntimeConversationContent(m, streamingText));
      };

      const modelMessages = createChatMessageRuntimeModelMessages([...currentMessages, userMsg]);
	      const response = await client.chat(modelMessages, onToken, onProgress, serverConversationId);
      const finalText = response.content || streamingText;
		      const finalResponseEvent = lastResponseEvents[lastResponseEvents.length - 1];
		      const finalDisplayText = finalResponseEvent?.text || lastUserResponse || finalText;
      console.log('[ChatScreen] Chat completed, conversationId:', response.conversationId);

      // Guard: skip UI updates if session has changed, BUT still persist to the original session
      // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
      const sessionChanged = currentSessionIdRef.current !== requestSessionId;
	      if (!sessionChanged) {
	        setConversationState(latestConversationState === 'running' ? 'complete' : latestConversationState);
	      }
      if (sessionChanged) {
        console.log('[ChatScreen] Session changed during request, persisting to original session without UI update');
      } else {
        setDebugInfo(getChatMessageRuntimeDebugMessage('completed'));
      }

      // Guard: skip final updates if this request is no longer the latest one for this session
      // This prevents older, superseded requests from clobbering messages when multiple sends occur within the same session
      // Uses per-session tracking to prevent cross-session sends from incorrectly superseding (PR review fix #13)
      // Note: This guard only applies when session hasn't changed - if session changed, we still want to persist
      const isLatestForSession = requestSessionId
        ? connectionManager.getLatestRequestId(requestSessionId) === thisRequestId
        : true;
      if (!sessionChanged && !isLatestForSession) {
        console.log('[ChatScreen] Request superseded within same session, skipping final message updates', {
          thisRequestId,
          latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : 'no-session'
        });
        return;
      }

      // Save conversation ID to the appropriate session
      if (response.conversationId) {
        if (sessionChanged && requestSessionId) {
          await sessionStore.setServerConversationIdForSession(requestSessionId, response.conversationId);
        } else {
          await sessionStore.setServerConversationId(response.conversationId);
        }
        resolvedConversationId = response.conversationId;
      }

      if (response.conversationHistory && response.conversationHistory.length > 0) {
        console.log('[ChatScreen] Processing final conversationHistory:', response.conversationHistory.length, 'messages');
        console.log('[ChatScreen] ConversationHistory roles:', response.conversationHistory.map(m => m.role).join(', '));

        const finalTurnMessages = createChatMessageRuntimeFinalHistoryTurnMessages<ChatMessage>(
          response.conversationHistory,
          {
            userResponse: finalResponseEvent?.text || lastUserResponse,
          },
        );
	        console.log('[ChatScreen] finalTurnMessages count:', finalTurnMessages.length);
	        console.log('[ChatScreen] finalTurnMessages roles:', finalTurnMessages.map(m => `${m.role}(toolCalls:${m.toolCalls?.length || 0},toolResults:${m.toolResults?.length || 0})`).join(', '));
        console.log('[ChatScreen] messageCountBeforeTurn:', messageCountBeforeTurn);

        if (sessionChanged && requestSessionId) {
          // Only persist to background session if this is still the latest request for that session
          // This prevents an older request from overwriting newer history (PR review fix #14)
          if (isLatestForSession) {
            console.log('[ChatScreen] Persisting completed response to background session:', requestSessionId);
            // Build the final messages array: messages before this turn + user message + new assistant messages
	            const finalMessages = createChatMessageRuntimeCompletedTurnMessages(
	              currentMessages,
	              messageCountBeforeTurn,
	              userMsg,
	              finalTurnMessages,
	            );
            await sessionStore.setMessagesForSession(requestSessionId, finalMessages);
          } else {
            console.log('[ChatScreen] Skipping background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state (persistence happens via useEffect)
          // Merge progress messages with final history to prevent intermediate messages
          // from disappearing when the server's history has fewer messages (#1083)
          const progressMsgs = progressMessagesRef.current;
          setMessages((m) => {
            console.log('[ChatScreen] Current messages before update:', m.length);
            const mergedMessages = mergeChatMessageRuntimeFinalTurnMessagesWithProgress(
              finalTurnMessages,
              progressMsgs,
            );
            const result = replaceChatMessageRuntimeTurnMessages(
              m,
              messageCountBeforeTurn,
              mergedMessages,
            );
            console.log('[ChatScreen] Final messages count:', result.length);
            return result;
          });
        }
	      } else if (finalDisplayText) {
        console.log('[ChatScreen] FALLBACK: No conversationHistory, using finalText only. response.conversationHistory:', response.conversationHistory);
        if (sessionChanged && requestSessionId) {
          // Only persist to background session if this is still the latest request for that session
          // This prevents an older request from overwriting newer history (PR review fix #14)
          if (isLatestForSession) {
            console.log('[ChatScreen] Persisting fallback response to background session:', requestSessionId);
	            const finalMessages = createChatMessageRuntimeCompletedTextTurnMessages(
	              currentMessages,
	              messageCountBeforeTurn,
	              userMsg,
	              finalDisplayText,
	            );
            await sessionStore.setMessagesForSession(requestSessionId, finalMessages);
          } else {
            console.log('[ChatScreen] Skipping fallback background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state
          setMessages((m) => updateLastChatMessageRuntimeConversationContent(m, finalDisplayText));
        }
      } else {
        console.log('[ChatScreen] WARNING: No conversationHistory and no finalText!');
      }

      // Note: Removed duplicate setServerConversationId call that was after the message handling
      // The conversation ID is now saved once at the beginning of this block

      // TTS: prefer userResponse (from respond_to_user tool) over finalText
      // userResponse is explicitly set by the agent for user communication
      // Skip TTS if we already played the same text mid-turn
	      const ttsText = finalResponseEvent?.text || lastUserResponse || finalText;
	      const alreadySpokenMidTurn = !!(finalResponseEvent
	        ? playedResponseEventIdsRef.current.has(finalResponseEvent.id)
	        : midTurnLegacyResponseText && ttsText === midTurnLegacyResponseText);
	      if (!alreadySpokenMidTurn && !sessionChanged && ttsText && ttsEnabledRef.current) {
	        if (handsFree) {
	          handsFreeController.onRequestCompleted();
	        }
	        speakAssistantResponse(ttsText, 'final response');
	      } else if (handsFree) {
	        handsFreeController.onRequestCompleted();
      }
    } catch (e: any) {
      console.error('[ChatScreen] Chat error:', e);
      console.error('[ChatScreen] Error details:', {
        message: e.message,
        stack: e.stack,
        name: e.name
      });

      // Guard: skip error message if session has changed since request started
      // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
      if (currentSessionIdRef.current !== requestSessionId) {
        console.log('[ChatScreen] Session changed during request, skipping error message');
        return;
      }

      // Guard: skip error handling if this request is no longer the active one
      // This prevents a superseded request from surfacing a retry banner for an older send
      if (activeRequestIdRef.current !== thisRequestId) {
        console.log('[ChatScreen] Request superseded, skipping error handling', {
          thisRequestId,
          activeRequestId: activeRequestIdRef.current
        });
        return;
      }
      setConversationState('blocked');

      const recoveryState = connectionState;
      const errorMessage = formatChatMessageRuntimeConnectionErrorMessage(e.message, recoveryState);

      // Save the failed message for retry
      setLastFailedMessage(text);

      // Check if there's partial content we can show
      const partialContent = client.getPartialContent();

      setDebugInfo(formatChatMessageRuntimeDebugError(errorMessage));
      // Update the in-flight assistant message instead of appending a new one
      // This avoids duplicating the assistant loading placeholder and ensures
      // the retry pop logic removes the correct items
      setMessages((m) => updateLastChatMessageRuntimeAssistantErrorMessage(
        m,
        errorMessage,
        partialContent,
      ));
	      if (handsFree) {
	        handsFreeController.onRequestCompleted();
	      }
    } finally {
      if (requestSessionId && !startingServerConversationId && !resolvedConversationId) {
        sessionStore.markPendingServerConversation(requestSessionId, false);
      }

      console.log('[ChatScreen] Chat request finished, requestId:', thisRequestId);

      // Decrement active request count in the connection manager
      if (requestSessionId) {
        connectionManager.decrementActiveRequests(requestSessionId);
      }

      // Only reset UI states if:
      // 1. This request is still the latest one for its session (per-session tracking, PR review fix #13)
      // 2. We're still on the same session (prevents background completions from affecting other sessions)
      // This addresses PR review comments #10 and #13
      const isLatestForThisSession = requestSessionId
        ? connectionManager.getLatestRequestId(requestSessionId) === thisRequestId
        : true;
      const isCurrentSession = currentSessionIdRef.current === requestSessionId;

      if (isLatestForThisSession && isCurrentSession) {
        setResponding(false);
        setConnectionState(null);
        // Guard the setTimeout callback: only clear debugInfo if this request
        // is still the latest one when the timeout fires. This prevents an
        // old request's delayed clear from wiping debug info for a newer request.
        const capturedRequestId = thisRequestId;
        const capturedSessionId = requestSessionId;
        setTimeout(() => {
          const stillLatest = capturedSessionId
            ? connectionManager.getLatestRequestId(capturedSessionId) === capturedRequestId
            : true;
          if (stillLatest && currentSessionIdRef.current === capturedSessionId) {
            setDebugInfo('');
          }
        }, 5000);

        // Process next queued message if any
        if (
          messageQueueEnabled &&
          !messageQueue.isQueuePaused(currentConversationId) &&
          (!handsFree || handsFreePhaseRef.current !== 'paused')
        ) {
          const nextMessage = messageQueue.peek(currentConversationId);
          if (nextMessage) {
            console.log('[ChatScreen] Processing next queued message:', nextMessage.id);
            // Use setTimeout to avoid recursive call stack issues
            setTimeout(() => {
              if (messageQueue.isQueuePaused(currentConversationId)) {
                return;
              }
              if (handsFreeRef.current && handsFreePhaseRef.current === 'paused') {
                return;
              }
              messageQueue.markProcessing(currentConversationId, nextMessage.id);
              processQueuedMessage(nextMessage);
            }, 100);
          }
        }
      } else {
        console.log('[ChatScreen] Skipping finally state resets:', {
          thisRequestId,
          latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : 'no-session',
          requestSessionId,
          currentSessionId: currentSessionIdRef.current,
          reason: !isLatestForThisSession ? 'newer request is active for this session' : 'session changed'
        });
      }
    }
  };

  // Process a queued message (similar to send but handles queue state)
  const processQueuedMessage = async (queuedMsg: { id: string; text: string }) => {
    if (messageQueue.isQueuePaused(currentConversationId)) {
      console.log('[ChatScreen] Queue is paused, skipping queued message processing:', queuedMsg.id);
      return;
    }

    const text = queuedMsg.text;
    if (!text.trim()) {
      messageQueue.markProcessed(currentConversationId, queuedMsg.id);
      return;
    }

    console.log('[ChatScreen] Processing queued message:', queuedMsg.id, createChatMessageRuntimeLogMeta(text));

    // Get client from connection manager (preserves connections across session switches)
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for processing queued message');
      messageQueue.markFailed(
        currentConversationId,
        queuedMsg.id,
        getChatMessageRuntimeDebugMessage('noSessionAvailable'),
      );
      setDebugInfo(formatChatMessageRuntimeDebugError(getChatMessageRuntimeDebugMessage('noSessionAvailable')));
      return;
    }

    setDebugInfo(getChatMessageRuntimeDebugMessage('processingQueuedMessage'));

    const userMsg: ChatMessage = createChatMessageRuntimeUserTextMessage(text);
    // Use ref to get latest messages to avoid stale closure when called via setTimeout (PR review fix)
    const currentMessages = messagesRef.current;
    const messageCountBeforeTurn = currentMessages.length;
    setLatestStepSummary(null);
    setMessages((m) => appendChatMessageRuntimePendingTurnMessages(m, userMsg));
    setResponding(true);
    setConversationState('running');
	    if (handsFree) {
	      handsFreeController.onRequestStarted();
	    }

    const thisRequestId = Date.now();
    activeRequestIdRef.current = thisRequestId;

    const currentSession = sessionStore.getCurrentSession();
    const startingServerConversationId = currentSession?.serverConversationId;

    const requestSessionId = sessionStore.currentSessionId;
    let resolvedConversationId: string | undefined;

    if (requestSessionId && !startingServerConversationId) {
      sessionStore.markPendingServerConversation(requestSessionId, true);
    }

    try {
      let streamingText = '';
      let latestConversationState: AgentConversationState = 'running';
      // Track userResponse from progress updates for TTS
      let lastUserResponse: string | undefined;
	      let lastResponseEvents: AgentUserResponseEvent[] = [];
	      let midTurnLegacyResponseText: string | undefined;

      const onProgress = (update: AgentProgressUpdate) => {
        if (sessionStore.currentSessionId !== requestSessionId) return;
        if (activeRequestIdRef.current !== thisRequestId) return;
        latestConversationState = resolveChatMessageRuntimeConversationStateFromProgress(update, 'running');
        setConversationState(latestConversationState);
        if (update.responseEvents?.length) {
	          lastResponseEvents = sortChatMessageRuntimeResponseEvents(update.responseEvents);
	          mergeResponseEvents(lastResponseEvents);
	          enqueueResponseEventsForSpeech(lastResponseEvents);
	          lastUserResponse = lastResponseEvents[lastResponseEvents.length - 1]?.text;
	        } else if (update.userResponse || update.spokenContent) {
	          const responseText = update.userResponse || update.spokenContent;
	          if (responseText && responseText !== lastUserResponse) {
		            const fallbackEvent = createFallbackResponseEvent(
		              requestSessionId,
		              update.runId,
		              responseText,
		            );
	            mergeResponseEvents([fallbackEvent]);
	          }
	          lastUserResponse = responseText;
	          if (responseText && responseText !== midTurnLegacyResponseText && ttsEnabledRef.current) {
	            midTurnLegacyResponseText = responseText;
		            speakAssistantResponse(responseText, 'queued mid-turn progress');
	          }
	        }
        const nextStepSummary = getChatMessageRuntimeLatestStepSummary(update);
        if (nextStepSummary) {
          setLatestStepSummary(nextStepSummary);
        }
        const progressMessages = createChatMessageRuntimeProgressMessages<ChatMessage>(update);
        if (progressMessages.length > 0) {
          setMessages((m) => replaceChatMessageRuntimeTurnMessages(
            m,
            messageCountBeforeTurn,
            progressMessages,
          ));
        }
      };

      const onToken = (tok: string) => {
        if (sessionStore.currentSessionId !== requestSessionId) return;
        if (activeRequestIdRef.current !== thisRequestId) return;
        // Handle both delta tokens and full-text updates.
        // Progress events with streamingContent.text send the full accumulated text,
        // while SSE delta events send just the new token.
        // Detect full-text updates to prevent double-words from compounding tokens.
        if (tok.startsWith(streamingText) && tok.length >= streamingText.length) {
          streamingText = tok;
        } else {
          streamingText += tok;
        }
        setMessages((m) => updateLastChatMessageRuntimeConversationContent(m, streamingText));
      };

      const modelMessages = createChatMessageRuntimeModelMessages([...currentMessages, userMsg]);
      const response = await client.chat(modelMessages, onToken, onProgress, startingServerConversationId);
      const finalText = response.content || streamingText;
	      const finalResponseEvent = lastResponseEvents[lastResponseEvents.length - 1];
	      const finalDisplayText = finalResponseEvent?.text || lastUserResponse || finalText;

      // Early exit guards - finalize queue status before returning to prevent stuck 'processing' items
      if (sessionStore.currentSessionId !== requestSessionId) {
        // Session changed - mark as failed so user can retry in correct session
        messageQueue.markFailed(
          currentConversationId,
          queuedMsg.id,
          getChatMessageRuntimeDebugMessage('sessionChangedDuringProcessing'),
        );
        return;
      }
      if (activeRequestIdRef.current !== thisRequestId) {
        // Request superseded - mark as failed so user can retry
        messageQueue.markFailed(
          currentConversationId,
          queuedMsg.id,
          getChatMessageRuntimeDebugMessage('requestSuperseded'),
        );
        return;
      }
      setConversationState(latestConversationState === 'running' ? 'complete' : latestConversationState);

      if (response.conversationId) {
        await sessionStore.setServerConversationId(response.conversationId);
        resolvedConversationId = response.conversationId;
      }

      if (response.conversationHistory && response.conversationHistory.length > 0) {
        const finalTurnMessages = createChatMessageRuntimeFinalHistoryTurnMessages<ChatMessage>(
          response.conversationHistory,
          {
            mergeToolResults: false,
            userResponse: finalResponseEvent?.text || lastUserResponse,
          },
        );

        setMessages((m) => replaceChatMessageRuntimeTurnMessages(
          m,
          messageCountBeforeTurn,
          finalTurnMessages,
        ));
      } else if (finalDisplayText) {
        setMessages((m) => updateLastChatMessageRuntimeConversationContent(m, finalDisplayText));
      }

      // TTS: prefer userResponse (from respond_to_user tool) over finalText
      // Skip TTS if we already played the same text mid-turn
	      const ttsText = finalResponseEvent?.text || lastUserResponse || finalText;
	      const alreadySpokenMidTurn = !!(finalResponseEvent
	        ? playedResponseEventIdsRef.current.has(finalResponseEvent.id)
	        : midTurnLegacyResponseText && ttsText === midTurnLegacyResponseText);
      if (!alreadySpokenMidTurn && ttsText && ttsEnabledRef.current) {
	        if (handsFree) {
	          handsFreeController.onRequestCompleted();
	        }
	        speakAssistantResponse(ttsText, 'queued final response');
	      } else if (handsFree) {
	        handsFreeController.onRequestCompleted();
      }

      // Mark as processed on success
      messageQueue.markProcessed(currentConversationId, queuedMsg.id);
    } catch (e: any) {
      console.error('[ChatScreen] Queued message error:', e);
      const queuedErrorMessage = formatChatMessageRuntimeAlertMessage(e, getChatMessageRuntimeDebugMessage('unknownError'));
      messageQueue.markFailed(currentConversationId, queuedMsg.id, queuedErrorMessage);
      setConversationState('blocked');
      setMessages((m) => appendChatMessageRuntimeAssistantDebugErrorMessage(m, queuedErrorMessage));
	      if (handsFree) {
	        handsFreeController.onRequestCompleted();
	      }
    } finally {
      if (requestSessionId && !startingServerConversationId && !resolvedConversationId) {
        sessionStore.markPendingServerConversation(requestSessionId, false);
      }

      if (activeRequestIdRef.current === thisRequestId) {
        setResponding(false);
        setConnectionState(null);
        setTimeout(() => {
          if (activeRequestIdRef.current === thisRequestId) {
            setDebugInfo('');
          }
        }, 5000);

        // Process next queued message if any
        const nextMessage = messageQueue.peek(currentConversationId);
        if (
          nextMessage &&
          !messageQueue.isQueuePaused(currentConversationId) &&
          (!handsFree || handsFreePhaseRef.current !== 'paused')
        ) {
          console.log('[ChatScreen] Processing next queued message:', nextMessage.id);
          setTimeout(() => {
            if (messageQueue.isQueuePaused(currentConversationId)) {
              return;
            }
            if (handsFreeRef.current && handsFreePhaseRef.current === 'paused') {
              return;
            }
            messageQueue.markProcessing(currentConversationId, nextMessage.id);
            processQueuedMessage(nextMessage);
          }, 100);
        }
      }
    }
  };

  const handleProcessNextQueuedMessage = useCallback(() => {
    if (responding) return;
    if (messageQueue.isQueuePaused(currentConversationId)) return;

    const nextMessage = messageQueue.peek(currentConversationId);
    if (!nextMessage) return;

    if (handsFree && handsFreeController.state.phase === 'paused') return;

    console.log('[ChatScreen] Processing queue while idle, next message:', nextMessage.id);
    setTimeout(() => {
      if (messageQueue.isQueuePaused(currentConversationId)) {
        return;
      }
      if (handsFreeRef.current && handsFreePhaseRef.current === 'paused') {
        return;
      }
      messageQueue.markProcessing(currentConversationId, nextMessage.id);
      processQueuedMessage(nextMessage);
    }, 100);
  }, [currentConversationId, handsFree, handsFreeController.state.phase, messageQueue, processQueuedMessage, responding]);

  const handlePauseMessageQueue = useCallback(() => {
    messageQueue.pauseQueue(currentConversationId);
  }, [currentConversationId, messageQueue]);

  const handleResumeMessageQueue = useCallback(() => {
    messageQueue.resumeQueue(currentConversationId);
    if (!responding) {
      setTimeout(() => {
        handleProcessNextQueuedMessage();
      }, 0);
    }
  }, [currentConversationId, handleProcessNextQueuedMessage, messageQueue, responding]);

  const handleRemoveQueuedMessage = useCallback((messageId: string) => {
    messageQueue.removeFromQueue(currentConversationId, messageId);
  }, [currentConversationId, messageQueue]);

  const handleUpdateQueuedMessage = useCallback((messageId: string, text: string) => {
    messageQueue.updateText(currentConversationId, messageId, text);
  }, [currentConversationId, messageQueue]);

  const handleRetryQueuedMessage = useCallback((messageId: string) => {
    messageQueue.resetToPending(currentConversationId, messageId);
    if (!responding) {
      handleProcessNextQueuedMessage();
    }
  }, [currentConversationId, handleProcessNextQueuedMessage, messageQueue, responding]);

  const handleClearQueuedMessages = useCallback(() => {
    messageQueue.clearQueue(currentConversationId);
  }, [currentConversationId, messageQueue]);

  // Keep sendRef in sync with the latest send() implementation for speech callbacks.
  // IMPORTANT: This must live outside send() so voice callbacks can send even before any manual send() occurs.
  // We intentionally assign during render (not useEffect) so it is available immediately.
  sendRef.current = send;

  const composerHasContent = hasChatComposerRuntimeMessageContent(input, pendingImages);
  const sendComposerInput = useCallback(() => {
    const composedMessage = buildChatComposerRuntimeMessageContent(input, pendingImages);
    if (!composedMessage.trim()) return;
    void send(composedMessage, { fromComposer: true });
  }, [input, pendingImages, send]);

  const queueComposerInput = useCallback(() => {
    const composedMessage = buildChatComposerRuntimeMessageContent(input, pendingImages);
    if (!composedMessage.trim()) return;

    messageQueue.enqueue(currentConversationId, composedMessage, currentConversationId);
    setInput('');
    setPendingImages([]);
    setDebugInfo(getChatComposerRuntimeQueueDebugMessage());
  }, [currentConversationId, input, messageQueue, pendingImages]);

  // Track modifier keys for keyboard shortcut handling
  const modifierKeysRef = useRef<{ shift: boolean; ctrl: boolean; meta: boolean }>({
    shift: false,
    ctrl: false,
    meta: false,
  });

  // Timeout ref for auto-resetting modifier state
  // This prevents "sticky" modifier state when a modifier is pressed then released before Enter
  const modifierTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flag to suppress the next onChangeText update after native keyboard shortcut submission
  // This prevents stray newlines from being added when Enter is pressed with a modifier
  const suppressNextChangeRef = useRef(false);

  // Handle keyboard shortcuts for text submission
  // Shift+Enter or Ctrl/Cmd+Enter to submit
  const handleInputKeyPress = useCallback(
    (e: ChatComposerTextEntryKeyPressEvent) => {
      const key = e.nativeEvent.key;

      // On web platform, we have access to modifier keys via nativeEvent
      if (Platform.OS === 'web') {
        const webEvent = e.nativeEvent as unknown as KeyboardEvent;
        const isEnter = key === 'Enter';
        const hasModifier = webEvent.shiftKey || webEvent.ctrlKey || webEvent.metaKey;

        if (isEnter && hasModifier) {
          // Prevent default on both the synthetic event and the underlying keyboard event
          // to ensure the newline is not inserted after send() clears the input
          e.preventDefault?.();
          webEvent.preventDefault?.();
          if (composerHasContent) {
            sendComposerInput();
          }
        }
      } else {
        // On native platforms, track modifier key state
        // Note: onKeyPress doesn't provide key-up events, so we use a timeout to auto-reset
        // modifier state. This prevents "sticky" modifiers where pressing Shift then releasing
        // it (without pressing another key) could cause a subsequent plain Enter to submit.
        const setModifierWithTimeout = (modifier: 'shift' | 'ctrl' | 'meta') => {
          modifierKeysRef.current[modifier] = true;
          // Clear any existing timeout
          if (modifierTimeoutRef.current) {
            clearTimeout(modifierTimeoutRef.current);
          }
          // Auto-reset modifier state after 500ms if no Enter is pressed
          // This matches the typical key repeat delay and prevents stickiness
          modifierTimeoutRef.current = setTimeout(() => {
            modifierKeysRef.current = { shift: false, ctrl: false, meta: false };
          }, 500);
        };

        if (key === 'Shift') {
          setModifierWithTimeout('shift');
        } else if (key === 'Control') {
          setModifierWithTimeout('ctrl');
        } else if (key === 'Meta') {
          setModifierWithTimeout('meta');
        } else if (key === 'Enter') {
          // Clear the timeout since we're processing the Enter now
          if (modifierTimeoutRef.current) {
            clearTimeout(modifierTimeoutRef.current);
            modifierTimeoutRef.current = null;
          }
          const hasModifier =
            modifierKeysRef.current.shift ||
            modifierKeysRef.current.ctrl ||
            modifierKeysRef.current.meta;

          if (hasModifier) {
            // Always suppress the newline that will be inserted by the native TextInput
            // when modifier+Enter is pressed, even if input is empty (matches web behavior)
            suppressNextChangeRef.current = true;
            if (composerHasContent) {
              sendComposerInput();
            }
          }
          // Reset modifier state after Enter is processed
          modifierKeysRef.current = { shift: false, ctrl: false, meta: false };
        } else {
          // Reset modifier state on any other key
          if (modifierTimeoutRef.current) {
            clearTimeout(modifierTimeoutRef.current);
            modifierTimeoutRef.current = null;
          }
          modifierKeysRef.current = { shift: false, ctrl: false, meta: false };
        }
      }
    },
    [composerHasContent, sendComposerInput]
  );

  // Wrapper for onChangeText that suppresses stray newlines after native keyboard shortcut submission
  const handleInputChange = useCallback((text: string) => {
    if (suppressNextChangeRef.current) {
      // Reset the flag and ignore this update (it's likely a stray newline from Enter)
      suppressNextChangeRef.current = false;
      return;
    }
    setInput(text);
  }, []);

		const wakeHandsFreeByUser = useCallback(() => {
			handsFreeController.wakeByUser();
			if (!listening) {
				void startRecording();
			}
			setDebugInfo(getChatComposerHandsFreeDebugMessage('awake'));
		}, [handsFreeController.wakeByUser, listening, startRecording]);

		const sleepHandsFreeByUser = useCallback(() => {
			handsFreeController.sleepByUser();
			setDebugInfo(formatChatComposerHandsFreeSleepingDebugMessage(handsFreeWakePhrase));
		}, [handsFreeController.sleepByUser, handsFreeWakePhrase]);

		const resumeHandsFreeByUser = useCallback(() => {
			handsFreeController.resumeByUser();
			if (!listening) {
				void startRecording();
			}
			setDebugInfo(getChatComposerHandsFreeDebugMessage('resumed'));
		}, [handsFreeController.resumeByUser, listening, startRecording]);

		const pauseHandsFreeByUser = useCallback(() => {
			handsFreeController.pauseByUser();
			Speech.stop();
			void stopRecognitionOnly();
			setDebugInfo(getChatComposerHandsFreeDebugMessage('paused'));
		}, [handsFreeController.pauseByUser, stopRecognitionOnly]);

		const handleHandsFreePrimaryControl = useCallback(() => {
			if (handsFreeController.state.phase === 'sleeping') {
				wakeHandsFreeByUser();
				return;
			}
			if (handsFreeController.state.phase === 'paused') {
				resumeHandsFreeByUser();
				return;
			}
			pauseHandsFreeByUser();
		}, [handsFreeController.state.phase, pauseHandsFreeByUser, resumeHandsFreeByUser, wakeHandsFreeByUser]);

  const chatMessageRuntimeSurface = createChatMessageRuntimeChromeProps<PredefinedPromptSummary, Loop>({
    composerChrome: {
      colors: theme.colors,
      platform: Platform.OS,
    },
    composer: {
      speechPreviewText: sttPreview,
      pendingImages,
      pendingImagesColors: theme.colors,
      onRemovePendingImage: removePendingImage,
      handsFreeStatusPhase: handsFreeController.state.phase,
      handsFreeStatusLabel: handsFreeController.statusLabel,
      handsFreeStatusEnabled: handsFree,
      handsFreeStatusWakePhrase: handsFreeWakePhrase,
      handsFreeStatusSleepPhrase: handsFreeSleepPhrase,
      handsFreeStatusLastError: handsFreeController.state.lastError,
      handsFreeStatusForegroundOnly: handsFreeForegroundOnly,
      onWakeHandsFree: wakeHandsFreeByUser,
      onSleepHandsFree: sleepHandsFreeByUser,
      onResumeHandsFree: resumeHandsFreeByUser,
      onPauseHandsFree: pauseHandsFreeByUser,
      composerControlHasContent: composerHasContent,
      composerControlConversationState: conversationState,
      composerControlIsResponding: responding,
      composerControlPendingImageCount: pendingImages.length,
      composerControlTtsEnabled: ttsEnabled,
      composerControlEditBeforeSendEnabled: willCancel,
      composerControlMicPhase: handsFreeController.state.phase,
      composerControlListening: listening,
      composerControlMessageQueueEnabled: messageQueueEnabled,
      composerControlColors: theme.colors,
      onImageAttachmentPress: handlePickImages,
      onTextToSpeechPress: toggleTts,
      onEditBeforeSendPress: () => setWillCancel((current) => !current),
      textEntryInputRef: inputRef,
      textEntryValue: input,
      onTextEntryChangeText: handleInputChange,
      onTextEntryKeyPress: handleInputKeyPress,
      textEntryHandsFree: handsFree,
      textEntryListening: listening,
      textEntryWillCancel: willCancel,
      textEntryLiveTranscript: liveTranscript,
      textEntryWakePhrase: handsFreeWakePhrase,
      onQueueActionPress: queueComposerInput,
      onSubmitActionPress: sendComposerInput,
      onMicPressIn: handlePushToTalkPressIn,
      onMicPressOut: handlePushToTalkPressOut,
      onMicPress: handleHandsFreePrimaryControl,
      micWrapperRef: micButtonRef,
    },
    dock: {
      responseHistoryResponses: respondToUserHistory,
      responseHistoryTtsProvider: effectiveTtsProvider,
      responseHistoryRemoteTtsVoice: effectiveRemoteTtsVoice,
      responseHistoryRemoteTtsModel: effectiveRemoteTtsModel,
      responseHistoryTtsRate: effectiveRemoteTtsRate,
      responseHistoryTtsPitch: config.ttsPitch ?? 1.0,
      responseHistoryTtsVoiceId: config.ttsVoiceId,
      responseHistoryRemoteBaseUrl: config.baseUrl,
      responseHistoryRemoteApiKey: config.apiKey,
      scrollToBottomVisible: !shouldAutoScroll,
      onScrollToBottom: handleScrollToBottomPress,
      voiceOverlayListening: listening,
      voiceOverlayHandsFree: handsFree,
      voiceOverlayWillCancel: willCancel,
      voiceOverlayTranscript: liveTranscript,
      queuePanelEnabled: messageQueueEnabled,
      queuePanelConversationId: currentConversationId,
      queuedMessages,
      onRemoveQueuedMessage: handleRemoveQueuedMessage,
      onUpdateQueuedMessage: handleUpdateQueuedMessage,
      onRetryQueuedMessage: handleRetryQueuedMessage,
      onProcessNextQueuedMessage: handleProcessNextQueuedMessage,
      canProcessNextQueuedMessage: !!nextQueuedMessage,
      onClearQueuedMessages: handleClearQueuedMessages,
      isMessageQueuePaused,
      onPauseMessageQueue: handlePauseMessageQueue,
      onResumeMessageQueue: handleResumeMessageQueue,
      connectionState,
      lastFailedMessage,
      isResponding: responding,
      colors: theme.colors,
      onConnectionBannerRetry: () => {
        void handleRetryLastFailedMessage();
      },
    },
    threadList: {
      messages,
      visibleMessageCount,
      groupByIndex: toolActivityGroups.groupByIndex,
      groupState: expandedGroups,
      inheritedState: expandedMessages,
      onToggleGroup: toggleGroupExpansion,
      expandedMessages,
      turnDurationsByUserTimestamp: turnDurations.byUserTimestamp,
      conversationId: currentSession?.serverConversationId,
      pendingBranchMessageIndex,
      isResponding: responding,
      speakingMessageIndex,
      copiedMessageIndex,
      ttsEnabled,
      colors: theme.colors,
      actionStyles: chatMessageConversationThreadStyles.actionSet,
      threadStyles: chatMessageConversationThreadStyles.runtimeThread,
      assetBaseUrl: config.baseUrl,
      assetAuthToken: config.apiKey,
      spinnerSource: isDark ? darkSpinner : lightSpinner,
      expandedDelegationConversationPreviews,
      expandedDelegationToolPreviews,
      setExpandedDelegationConversationPreviews,
      setExpandedDelegationToolPreviews,
      expandedToolApprovals,
      pendingApprovalResponseId: pendingToolApprovalResponseId,
      onToggleToolApprovalArguments: toggleToolApprovalArguments,
      onRespondToToolApproval: respondToToolApproval,
      expandedToolCalls,
      onToggleToolCall: toggleToolCallExpansion,
      onCopyToolPayload: handleCopyToolPayload,
      onSpeakMessage: speakMessage,
      onBranchMessage: (messageIndex) => { void handleBranchFromMessage(messageIndex); },
      onCopyMessage: handleCopyMessage,
      onToggleMessageExpansion: toggleMessageExpansion,
    },
    viewport: {
      scrollRef: scrollViewRef,
      onScroll: handleScroll,
      onScrollBeginDrag: handleScrollBeginDrag,
      onScrollEndDrag: handleScrollEndDrag,
      scrollEventThrottle: scrollEventThrottleMs,
      viewportContentIsLoadingMessages: sessionStore.isLoadingMessages,
      viewportContentMessageCount: messages.length,
      loadingSpinnerSource: isDark ? darkSpinner : lightSpinner,
      quickStartPrompts: predefinedPrompts,
      quickStartSkills: availableSkills,
      quickStartTasks: availableTasks,
      quickStartCanAddPrompt: Boolean(settingsClient),
      isLoadingQuickStartPrompts,
      runningPromptTaskId,
      onQuickStartPress: handleQuickStartPress,
      onEditPrompt: openEditPromptModal,
      onDeletePrompt: handleDeletePrompt,
      messageHistoryLoadIncrement,
      latestStepSummary,
      colors: theme.colors,
      onLoadEarlierMessages: loadEarlierMessages,
      requestDebugText: debugInfo,
      voiceDebugEnabled: handsFreeDebugEnabled,
      voiceEvents,
    },
    surface: {
      platform: Platform.OS,
      colors: theme.colors,
      keyboardVerticalOffset: headerHeight,
      agentSelectorVisible,
      onAgentSelectorClose: () => setAgentSelectorVisible(false),
      promptEditorVisible: addPromptModalVisible,
      promptEditorIsEditing: Boolean(editingPrompt),
      promptEditorNameValue: newPromptName,
      onPromptEditorNameChange: setNewPromptName,
      promptEditorContentValue: newPromptContent,
      onPromptEditorContentChange: setNewPromptContent,
      promptEditorIsSaving: isSavingPrompt,
      onPromptEditorClose: closePromptModal,
      onPromptEditorSave: handleSavePrompt,
      promptEditorStyles: promptEditorModalStyles,
    },
  });

  const handleRetryLastFailedMessage = async () => {
    const messageToRetry = lastFailedMessage;
    if (!messageToRetry) return;
    setLastFailedMessage(null);

    // Use the recovery conversation ID if available, so the retry resumes
    // the same server-created conversation when the first attempt failed mid-stream.
    const retryClient = getSessionClient();
    const recoveryConversationId = retryClient?.getRecoveryConversationId();

    // Try to recover conversation state from server first (fixes #815).
    // If the server already processed the message, sync state instead of re-sending.
    if (recoveryConversationId && retryClient) {
      console.log('[ChatScreen] Retry: Checking server conversation state:', recoveryConversationId);
      try {
        const serverConversation = await retryClient.getConversation(recoveryConversationId);
        if (serverConversation && serverConversation.messages.length > 0) {
          const serverMessages = serverConversation.messages;
          const recoveredMessages = createChatMessageRuntimeRecoverableHistoryMessages<ChatMessage>(serverMessages);

          if (recoveredMessages) {
            console.log('[ChatScreen] Retry: Server already has response, syncing state');

            await sessionStore.setServerConversationId(recoveryConversationId);

            setMessages(recoveredMessages);
            await sessionStore.setMessages(recoveredMessages);

            console.log('[ChatScreen] Retry: Successfully recovered', recoveredMessages.length, 'messages from server');
            return;
          }
        }
      } catch (error) {
        console.log('[ChatScreen] Retry: Could not fetch server state, will retry message:', error);
      }

      console.log('[ChatScreen] Retry: Using recovery conversationId:', recoveryConversationId);
      await sessionStore.setServerConversationId(recoveryConversationId);
    }

    setMessages((m) => removeChatMessageRuntimePendingTurnMessages(m));
    // Let React commit the message removal before send() reads current state.
    setTimeout(() => send(messageToRetry), 0);
  };



  return (
    <ChatMessageRuntimeSurface
      {...chatMessageRuntimeSurface}
      styles={chatMessageRuntimeSurfaceStyles}
    />
  );
}
