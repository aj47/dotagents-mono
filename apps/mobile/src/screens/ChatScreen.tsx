import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Platform,
  Alert,
  AppState,
  useWindowDimensions,
  type AppStateStatus,
} from 'react-native';

const darkSpinner = require('../../assets/loading-spinner.gif');
const lightSpinner = require('../../assets/light-spinner.gif');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useConfigContext,
  saveConfig,
} from '../store/config';
import {
  DEFAULT_MOBILE_APP_CONFIG as DEFAULT_APP_CONFIG,
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  DEFAULT_HANDS_FREE_WAKE_PHRASE,
} from '@dotagents/shared/mobile-app-config';
import { useSessionContext } from '../store/sessions';
import { useMessageQueueContext } from '../store/message-queue';
import {
  ChatMessageRuntimeSurface,
  createChatConversationHomeQuickStartItems,
  createChatConversationHomePromptEditorModalStyleSlots,
  createChatConversationHomePromptEditorSaveActionState,
  createChatComposerRuntimeFollowUpPresentationState,
  createChatComposerRuntimeDockProps,
  createChatComposerRuntimeDockChromeProps,
  createChatComposerRuntimeDockStyleSlots,
  createChatComposerStyleSlots,
  getChatComposerRuntimeQueueDebugMessage,
  createChatRuntimeHeaderStyleSlots,
  createChatRuntimeMobileSafeAreaLayoutState,
  createChatRuntimeMobileSafeAreaStyleSlots,
  createChatRuntimeNavigationHeaderOptions,
  createChatRuntimeNavigationHeaderRenderState,
  createChatRuntimeSafeAreaMergedStyleSlots,
  formatChatMessageRuntimeActivityContent,
  formatChatMessageRuntimeAssistantFeedbackContent,
  formatChatMessageRuntimeToolApprovalRequiredContent,
  createChatMessageConversationRuntimeThreadListRenderState,
  createChatMessageConversationThreadStyleSlots,
  createChatMessageConversationDockStyleSlots,
  createChatMessageRuntimeDockStyleSlots,
  createChatMessageRuntimeSurfaceStyleSlots,
  createChatMessageConversationViewportStyleSlots,
  createChatMessageRuntimeViewportStyleSlots,
  createChatMessageRuntimeDockChromeProps,
  createChatMessageRuntimeDebugPanelsRenderState,
  createChatMessageRuntimeSurfaceChromeProps,
  createChatMessageRuntimeViewportChromeProps,
  createChatRuntimeMobileChromeStyleState,
  getChatMessageRuntimeBranchAlertState,
  getChatMessageRuntimeHistoryWindowState,
  getChatMessageRuntimeKillSwitchAlertState,
  getChatMessageRuntimeLatestStepSummary,
  getChatMessageRuntimeToolApprovalAlertState,
  getChatMessageToolExecutionCopyFailureAlertState,
  getChatMessageCopyFeedbackState,
} from '../ui/ChatMessageChrome';
import type {
  ChatComposerTextEntryKeyPressEvent,
  ChatComposerTextEntryRef,
  ChatConversationHomeQuickStartItem,
  ChatMessageScrollEvent,
  ChatMessageScrollViewportRef,
} from '../ui/ChatMessageChrome';
import { speakRemoteTts, stopRemoteTts } from '../lib/remoteTts';
import { useConnectionManager } from '../store/connectionManager';
import { useTunnelConnection } from '../store/tunnelConnection';
import { useProfile } from '../store/profile';
import type { AgentProgressUpdate, AgentStepSummary } from '@dotagents/shared/agent-progress';
import type { ChatMessage } from '../lib/openaiClient';
import type { Settings } from '@dotagents/shared/api-types';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import { formatConnectionStatus, type RecoveryState } from '@dotagents/shared/connection-recovery';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import {
  extractRespondToUserResponseEvents,
  getNextAgentUserResponseEventOrdinal,
  sortAgentUserResponseEvents,
  getToolResultsSummary,
  preserveChatMessageDisplayContentFromProgress,
  applyUserResponseToChatMessages,
  applyChatMessageAutoExpansionState,
} from '@dotagents/shared/chat-utils';
import { preprocessTextForTTS } from '@dotagents/shared/tts-preprocessing';
import {
  mergeVoiceText,
  normalizeAutoTtsTextKey,
} from '@dotagents/shared/voice-text-utils';
import type { AgentConversationState } from '@dotagents/shared/conversation-state';
import {
  formatChatRuntimeAssistantErrorContent,
  formatChatRuntimeConnectionErrorMessage,
  formatChatRuntimeDebugError,
  formatChatRuntimeStartingRequestDebugMessage,
  formatChatRuntimeWebConfirmMessage,
  getChatRuntimeDebugState,
  getChatRuntimeAlertMessage,
} from '@dotagents/shared/session-presentation';
import {
  createAgentDelegationProgressMessages as createDelegationProgressMessages,
  resolveAgentProgressConversationState,
} from '@dotagents/shared/agent-progress';
import {
  DEFAULT_EDGE_TTS_VOICE,
} from '@dotagents/shared/providers';
import {
  getTextToSpeechModelValue,
  getTextToSpeechPlaybackRate,
  getTextToSpeechVoiceValue,
} from '@dotagents/shared/text-to-speech-settings';
import {
  getToolActivityGroupExpansionInheritanceItems,
  getToolActivityGroupStateKey,
  groupToolActivity,
  type ToolActivityGroup,
} from '@dotagents/shared/tool-activity-grouping';
import {
  applyChatDisplayGroupedExpansionInheritance,
  isChatMessageConversationContent,
  sanitizeMessagesForModel,
  toggleChatDisplayExpansionState,
} from '@dotagents/shared/message-display-utils';
import {
  computeTurnDurations,
  type TurnDurationMessage,
} from '@dotagents/shared/turn-duration';
import {
  buildChatImageAttachmentMessage,
  extractDataImageMarkdownReferences,
  getDataImageBytesFromUrl,
  getDecodedBase64ByteLength,
  getChatImageAttachmentMobileAlertState,
  inferImageMimeTypeFromSource,
  MAX_CHAT_IMAGE_ATTACHMENTS,
  MAX_CHAT_IMAGE_FILE_BYTES,
  MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
  type ChatImageAttachmentMobileAlertInput,
} from '@dotagents/shared/conversation-media-assets';
import type { AgentUserResponseEvent } from '@dotagents/shared/agent-progress';
import type { HandsFreePhase } from '@dotagents/shared/types';
import type {
  Loop,
  PredefinedPromptSummary,
  Skill,
} from '@dotagents/shared/api-types';
import {
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  formatPromptLibraryDeletePromptConfirmMessage,
  formatPromptLibraryDeletePromptWebConfirmMessage,
  formatPromptLibraryTaskStartedMessage,
  getPromptLibraryCopyState,
  getPromptLibrarySaveSuccessMessage,
  getPromptLibraryShortcutPressIntent,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
} from '@dotagents/shared/predefined-prompts';
import { useHeaderHeight } from '@react-navigation/elements';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, Theme } from '../ui/theme';
import { resolveMobileFontFamily } from '../ui/mobileTypography';
import {
  formatHandsFreeSleepingDebugMessage,
  formatHandsFreeRecognizerErrorDebugMessage,
  getHandsFreeComposerCopyState,
} from '@dotagents/shared/hands-free-controller';
import { useVoiceDebug } from '../lib/voice/voiceDebug';
import { useSpeechRecognizer } from '../lib/voice/useSpeechRecognizer';
import { useHandsFreeController } from '../lib/voice/useHandsFreeController';

interface PendingImageAttachment {
  id: string;
  name: string;
  previewUri: string;
  dataUrl: string;
}

const MAX_PENDING_IMAGES = MAX_CHAT_IMAGE_ATTACHMENTS;
const MAX_PENDING_IMAGE_FILE_SIZE_BYTES = MAX_CHAT_IMAGE_FILE_BYTES;
const MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES = MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES;
const CHAT_MESSAGE_HISTORY_WINDOW = getChatMessageRuntimeHistoryWindowState();
const AUTO_TTS_DUPLICATE_SUPPRESSION_MS = 5_000;
const mobileRuntimeKillSwitchAlerts = getChatMessageRuntimeKillSwitchAlertState();
const mobileRuntimeDebug = getChatRuntimeDebugState();
const mobileRuntimeBranchAlerts = getChatMessageRuntimeBranchAlertState();
const mobileRuntimeToolApprovalAlerts = getChatMessageRuntimeToolApprovalAlertState();
const handsFreeCopy = getHandsFreeComposerCopyState();
const toolExecutionDetailCopyFailureAlert = getChatMessageToolExecutionCopyFailureAlertState();
const messageCopyFeedbackState = getChatMessageCopyFeedbackState();
const composerQueueDebugMessage = getChatComposerRuntimeQueueDebugMessage();
const promptLibraryCopy = getPromptLibraryCopyState();

const getApproxDataUrlBytes = (dataUrl: string) => {
  return getDataImageBytesFromUrl(dataUrl) ?? 0;
};

type QuickStartShortcut = ChatConversationHomeQuickStartItem<PredefinedPromptSummary, Loop>;

const resolveConversationStateFromProgress = (
  update: AgentProgressUpdate,
  lifecycleState: 'running' | 'complete' = update.isComplete ? 'complete' : 'running'
): AgentConversationState => {
  return resolveAgentProgressConversationState(update, lifecycleState);
};

type RespondToUserHistorySourceMessage = {
  role: 'user' | 'assistant' | 'tool';
  timestamp?: number;
  toolCalls?: Array<{ name: string; arguments: unknown }>;
};

const extractRespondToUserHistory = (
  messages: RespondToUserHistorySourceMessage[]
): AgentUserResponseEvent[] =>
  extractRespondToUserResponseEvents(messages, { idPrefix: 'mobile-history' });

const getMessageLogMeta = (content: string) => ({
  length: content.length,
  inlineImageCount: extractDataImageMarkdownReferences(content).length,
});

type RemoteDesktopTtsProvider = 'native' | NonNullable<Settings['ttsProviderId']>;

export default function ChatScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const isFocused = useIsFocused();
  const { height: screenHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenHeight), [theme, screenHeight]);
  const chatMessageConversationThreadStyles = useMemo(
    () => createChatMessageConversationThreadStyleSlots(styles),
    [styles],
  );
  const chatRuntimeHeaderStyles = useMemo(
    () => createChatRuntimeHeaderStyleSlots(styles),
    [styles],
  );
  const chatComposerStyles = useMemo(
    () => createChatComposerStyleSlots(styles),
    [styles],
  );
  const conversationDockStyles = useMemo(
    () => createChatMessageConversationDockStyleSlots(styles),
    [styles],
  );
  const conversationViewportStyles = useMemo(
    () => createChatMessageConversationViewportStyleSlots(styles),
    [styles],
  );
  const promptEditorModalStyles = useMemo(
    () => createChatConversationHomePromptEditorModalStyleSlots(styles),
    [styles],
  );
  const mobileSafeAreaLayout = useMemo(
    () => createChatRuntimeMobileSafeAreaLayoutState(insets.bottom),
    [insets.bottom],
  );
  const mobileSafeAreaStyles = useMemo(
    () => createChatRuntimeMobileSafeAreaStyleSlots(mobileSafeAreaLayout),
    [mobileSafeAreaLayout],
  );
  const chatSafeAreaStyles = useMemo(
    () => createChatRuntimeSafeAreaMergedStyleSlots({
      chatComposerStyles,
      conversationDockStyles,
      conversationViewportStyles,
      safeAreaStyles: mobileSafeAreaStyles,
    }),
    [chatComposerStyles, conversationDockStyles, conversationViewportStyles, mobileSafeAreaStyles],
  );
  const chatComposerRuntimeDockStyles = useMemo(
    () => createChatComposerRuntimeDockStyleSlots({
      chatComposerStyles,
      safeAreaStyles: chatSafeAreaStyles,
    }),
    [chatComposerStyles, chatSafeAreaStyles],
  );
  const chatMessageRuntimeDockStyles = useMemo(
    () => createChatMessageRuntimeDockStyleSlots({
      conversationDockStyles,
      composerStyles: chatComposerRuntimeDockStyles,
      safeAreaStyles: chatSafeAreaStyles,
    }),
    [conversationDockStyles, chatComposerRuntimeDockStyles, chatSafeAreaStyles],
  );
  const chatMessageRuntimeViewportStyles = useMemo(
    () => createChatMessageRuntimeViewportStyleSlots({
      conversationViewportStyles,
      safeAreaStyles: chatSafeAreaStyles,
    }),
    [conversationViewportStyles, chatSafeAreaStyles],
  );
  const chatMessageRuntimeSurfaceStyles = useMemo(
    () => createChatMessageRuntimeSurfaceStyleSlots({
      conversationViewportStyles,
      dockStyles: chatMessageRuntimeDockStyles,
      viewportStyles: chatMessageRuntimeViewportStyles,
    }),
    [conversationViewportStyles, chatMessageRuntimeDockStyles, chatMessageRuntimeViewportStyles],
  );
  const showImageAttachmentAlert = useCallback((input: ChatImageAttachmentMobileAlertInput) => {
    const alertState = getChatImageAttachmentMobileAlertState(input);
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
  const [runningPromptTaskId, setRunningPromptTaskId] = useState<string | null>(null);
  const [remoteTtsProvider, setRemoteTtsProvider] = useState<RemoteDesktopTtsProvider>('native');
  const [remoteTtsVoice, setRemoteTtsVoice] = useState<string | undefined>(DEFAULT_EDGE_TTS_VOICE);
  const [remoteTtsModel, setRemoteTtsModel] = useState<string | undefined>();
  const [remoteTtsRate, setRemoteTtsRate] = useState(1.0);
  const [pendingToolApprovalResponseId, setPendingToolApprovalResponseId] = useState<string | null>(null);
  const [branchingMessageIndex, setBranchingMessageIndex] = useState<number | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const copiedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Effective TTS provider/voice/rate — local mobile config takes precedence over
  // any value pulled from the connected desktop's settings.
  const effectiveTtsProvider: RemoteDesktopTtsProvider =
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
  const handsFreeMessageDebounceMs = config.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;
  const handsFreeWakePhrase = config.handsFreeWakePhrase || DEFAULT_HANDS_FREE_WAKE_PHRASE;
  const handsFreeSleepPhrase = config.handsFreeSleepPhrase || DEFAULT_HANDS_FREE_SLEEP_PHRASE;
  const handsFreeDebugEnabled = config.handsFreeDebug === true;
  const handsFreeForegroundOnly = config.handsFreeForegroundOnly ?? DEFAULT_APP_CONFIG.handsFreeForegroundOnly ?? true;
  const messageQueueEnabled = config.messageQueueEnabled ?? DEFAULT_APP_CONFIG.messageQueueEnabled ?? true;
  const ttsEnabledSetting = config.ttsEnabled ?? DEFAULT_APP_CONFIG.ttsEnabled ?? true;
  const handsFreeRef = useRef<boolean>(handsFree);
  useEffect(() => { handsFreeRef.current = !!config.handsFree; }, [config.handsFree]);
  useEffect(() => {
    return () => {
      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current);
      }
    };
  }, []);
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
          console.log('[ChatScreen] Connection status:', formatConnectionStatus(state));
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
      const confirmed = window.confirm(
        formatChatRuntimeWebConfirmMessage(
          mobileRuntimeKillSwitchAlerts.confirmation.title,
          mobileRuntimeKillSwitchAlerts.confirmation.message,
        )
      );
      if (confirmed) {
        try {
          const result = await client.killSwitch();
          if (result.success) {
            window.alert(result.message || mobileRuntimeKillSwitchAlerts.success.fallbackMessage);
          } else {
            window.alert(
              `${mobileRuntimeKillSwitchAlerts.failed.title}: ${result.error || mobileRuntimeKillSwitchAlerts.failed.fallbackMessage}`,
            );
          }
        } catch (e: any) {
          console.error('[ChatScreen] Kill switch error:', e);
          window.alert(
            `${mobileRuntimeKillSwitchAlerts.connectionFailed.title}: ${getChatRuntimeAlertMessage(e, mobileRuntimeKillSwitchAlerts.connectionFailed.fallbackMessage)}`,
          );
        }
      }
      return;
    }

    Alert.alert(
      mobileRuntimeKillSwitchAlerts.confirmation.title,
      mobileRuntimeKillSwitchAlerts.confirmation.message,
      [
        { text: mobileRuntimeKillSwitchAlerts.confirmation.cancelLabel, style: 'cancel' },
        {
          text: mobileRuntimeKillSwitchAlerts.confirmation.confirmLabel,
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await client.killSwitch();
              if (result.success) {
                Alert.alert(
                  mobileRuntimeKillSwitchAlerts.success.title,
                  result.message || mobileRuntimeKillSwitchAlerts.success.fallbackMessage,
                );
              } else {
                Alert.alert(
                  mobileRuntimeKillSwitchAlerts.failed.title,
                  result.error || mobileRuntimeKillSwitchAlerts.failed.fallbackMessage,
                );
              }
            } catch (e: any) {
              console.error('[ChatScreen] Kill switch error:', e);
              Alert.alert(
                mobileRuntimeKillSwitchAlerts.connectionFailed.title,
                getChatRuntimeAlertMessage(e, mobileRuntimeKillSwitchAlerts.connectionFailed.fallbackMessage),
              );
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
    if (!settingsClient || runningPromptTaskId) return;
    setRunningPromptTaskId(task.id);
    try {
      await settingsClient.runLoop(task.id);
      Alert.alert(promptLibraryCopy.feedback.taskStartedTitle, formatPromptLibraryTaskStartedMessage(task.name));
    } catch (error: any) {
      Alert.alert(promptLibraryCopy.feedback.errorTitle, error?.message || promptLibraryCopy.feedback.taskRunFailed);
    } finally {
      setRunningPromptTaskId(null);
    }
  }, [runningPromptTaskId, settingsClient]);

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
    const pressIntent = getPromptLibraryShortcutPressIntent(item);
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
      setCopiedMessageIndex(messageIndex);
      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current);
      }
      copiedMessageTimeoutRef.current = setTimeout(() => {
        setCopiedMessageIndex((current) => (current === messageIndex ? null : current));
      }, messageCopyFeedbackState.feedbackResetDelayMs);
    } catch (error) {
      Alert.alert(
        messageCopyFeedbackState.failedTitle,
        getChatRuntimeAlertMessage(error, messageCopyFeedbackState.failedMessage),
      );
    }
  }, []);

  const handleCopyToolPayload = useCallback(async (content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await Clipboard.setStringAsync(copyContent);
    } catch (error) {
      Alert.alert(
        toolExecutionDetailCopyFailureAlert.title,
        getChatRuntimeAlertMessage(error, toolExecutionDetailCopyFailureAlert.fallbackMessage),
      );
    }
  }, []);

  const handleBranchFromMessage = useCallback(async (messageIndex: number) => {
    const serverConversationId = currentSession?.serverConversationId;
    if (!settingsClient || !serverConversationId) {
      Alert.alert(
        mobileRuntimeBranchAlerts.unavailable.title,
        mobileRuntimeBranchAlerts.unavailable.message,
      );
      return;
    }

    setBranchingMessageIndex(messageIndex);
    try {
      const branchedConversation = await settingsClient.branchConversation(serverConversationId, { messageIndex });
      await sessionStore.syncWithServer(settingsClient);
      const branchedSession = sessionStore.findSessionByServerConversationId(branchedConversation.id);
      if (branchedSession) {
        sessionStore.setCurrentSession(branchedSession.id);
        navigation.navigate('Chat');
        return;
      }

      Alert.alert(
        mobileRuntimeBranchAlerts.created.title,
        mobileRuntimeBranchAlerts.created.message,
      );
    } catch (error: any) {
      Alert.alert(
        mobileRuntimeBranchAlerts.failed.title,
        getChatRuntimeAlertMessage(error, mobileRuntimeBranchAlerts.failed.fallbackMessage),
      );
    } finally {
      setBranchingMessageIndex(null);
    }
  }, [currentSession?.serverConversationId, navigation, sessionStore, settingsClient]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasLiveAgentTurn =
    responding ||
    conversationState === 'running' ||
    conversationState === 'needs_input';
  const [turnNow, setTurnNow] = useState(() => Date.now());
  useEffect(() => {
    setTurnNow(Date.now());
    if (!hasLiveAgentTurn) return undefined;
    const id = setInterval(() => setTurnNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasLiveAgentTurn]);
  const turnDurationMessages = useMemo<TurnDurationMessage[]>(
    () => messages.reduce<TurnDurationMessage[]>((entries, message) => {
      if (typeof message.timestamp !== 'number' || !Number.isFinite(message.timestamp)) {
        return entries;
      }

      entries.push({
        role: message.role,
        timestamp: message.timestamp,
        isThinking:
          message.role === 'assistant' &&
          (!message.content || message.content.length === 0) &&
          !message.toolCalls?.length &&
          !message.toolResults?.length,
      });
      return entries;
    }, []),
    [messages],
  );
  const turnDurations = useMemo(
    () => computeTurnDurations(turnDurationMessages, !hasLiveAgentTurn, turnNow),
    [hasLiveAgentTurn, turnDurationMessages, turnNow],
  );
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
      Alert.alert(
        mobileRuntimeToolApprovalAlerts.connectionRequired.title,
        mobileRuntimeToolApprovalAlerts.connectionRequired.message,
      );
      return;
    }

    setPendingToolApprovalResponseId(approvalId);
    try {
      const response = await settingsClient.respondToToolApproval(approvalId, approved);
      setMessages((current) => current.filter((message) => message.toolApproval?.approvalId !== approvalId));
      if (!response.success) {
        Alert.alert(
          mobileRuntimeToolApprovalAlerts.unavailable.title,
          mobileRuntimeToolApprovalAlerts.unavailable.message,
        );
      }
    } catch (error: any) {
      Alert.alert(
        mobileRuntimeToolApprovalAlerts.failed.title,
        getChatRuntimeAlertMessage(error, mobileRuntimeToolApprovalAlerts.failed.fallbackMessage),
      );
    } finally {
      setPendingToolApprovalResponseId(null);
    }
  }, [settingsClient]);
  const [visibleMessageCount, setVisibleMessageCount] = useState<number>(
    CHAT_MESSAGE_HISTORY_WINDOW.initialVisibleCount,
  );
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
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  // Track which individual tool calls are fully expanded to show all input/output details
  // Key format: "messageId-toolCallIndex" (messageId falls back to message array index if undefined)
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});
  // Track which tool-activity groups are expanded (keyed by startIndex so the
  // state survives when new tool/skill messages append to the same group)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedToolApprovals, setExpandedToolApprovals] = useState<Record<string, boolean>>({});
  const [expandedDelegationConversationPreviews, setExpandedDelegationConversationPreviews] = useState<Record<string, boolean>>({});
  const [expandedDelegationToolPreviews, setExpandedDelegationToolPreviews] = useState<Record<string, boolean>>({});
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
				setInput((current) => mergeVoiceText(current, finalText));
				setDebugInfo(handsFreeCopy.debug.transcriptAdded);
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
			setDebugInfo(formatHandsFreeRecognizerErrorDebugMessage(message));
		},
		onPermissionDenied: () => {
			setDebugInfo(handsFreeCopy.debug.permissionDenied);
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
      setDebugInfo(handsFreeCopy.debug.disabled);
    } else {
      setDebugInfo(handsFreeCopy.debug.enabled);
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
		const processedText = preprocessTextForTTS(content);
		if (!processedText) {
				onSettled?.();
			return false;
		}

      const ttsTextKey = normalizeAutoTtsTextKey(processedText);
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
	    nextResponseEventOrdinalRef.current = getNextAgentUserResponseEventOrdinal(events);
	  }, []);

	  const replaceResponseHistory = useCallback((events: AgentUserResponseEvent[]) => {
	    const sortedEvents = sortAgentUserResponseEvents(events);
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

	    const mergedEvents = sortAgentUserResponseEvents(Array.from(merged.values()));
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

    queuedResponseEventsRef.current = sortAgentUserResponseEvents([
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
    const processedText = preprocessTextForTTS(content);
    if (!processedText) {
      intendedSpeakingIndexRef.current = null;
      return;
    }
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

  // Auto-scroll state and ref for mobile chat
  const scrollViewRef = useRef<ChatMessageScrollViewportRef>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  // Track scroll timeout for debouncing rapid message updates
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to track current auto-scroll state for use in timeout callbacks
  const shouldAutoScrollRef = useRef(true);
  // Track if user is actively dragging to distinguish from programmatic scrolls
  const isUserDraggingRef = useRef(false);
  // Track drag end timeout to prevent flaky behavior with rapid re-drags
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup: stop speech on unmount (#1078)
  useEffect(() => {
    return () => {
      Speech.stop();
      stopRemoteTts();
    };
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    shouldAutoScrollRef.current = shouldAutoScroll;
    // Cancel any pending scroll when user disables auto-scroll
    if (!shouldAutoScroll && scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [shouldAutoScroll]);

  // Handle user starting to drag the scroll view
  const handleScrollBeginDrag = useCallback(() => {
    // Clear any pending drag end timeout from previous drag
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
    isUserDraggingRef.current = true;
  }, []);

  // Handle user ending drag - keep flag active briefly for momentum scroll
  const handleScrollEndDrag = useCallback(() => {
    // Clear any existing drag end timeout before scheduling a new one
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
    }
    // Clear the flag after a short delay to account for momentum scrolling
    dragEndTimeoutRef.current = setTimeout(() => {
      isUserDraggingRef.current = false;
      dragEndTimeoutRef.current = null;
    }, CHAT_MESSAGE_HISTORY_WINDOW.dragEndDebounceMs);
  }, []);

  // Handle scroll events to detect when user scrolls away from bottom
  const handleScroll = useCallback((event: ChatMessageScrollEvent) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Keep auto-scroll behavior aligned with the shared chat history window.
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - CHAT_MESSAGE_HISTORY_WINDOW.bottomResumeThresholdPx;
    const isNearTop = contentOffset.y <= CHAT_MESSAGE_HISTORY_WINDOW.topLoadThresholdPx;

    if (isAtBottom && !shouldAutoScroll) {
      // User scrolled back to bottom, resume auto-scroll
      setShouldAutoScroll(true);
    } else if (!isAtBottom && shouldAutoScroll && isUserDraggingRef.current) {
      // Only pause auto-scroll when user is actively dragging (not programmatic scroll)
      setShouldAutoScroll(false);
    }
    if (isNearTop && visibleMessageCount < messages.length) {
      setVisibleMessageCount((current) =>
        Math.min(messages.length, current + CHAT_MESSAGE_HISTORY_WINDOW.loadIncrement),
      );
    }
  }, [messages.length, shouldAutoScroll, visibleMessageCount]);

  useEffect(() => {
    setVisibleMessageCount(CHAT_MESSAGE_HISTORY_WINDOW.initialVisibleCount);
  }, [sessionStore.currentSessionId]);

  useEffect(() => {
    setVisibleMessageCount((current) => {
      if (messages.length === 0) return CHAT_MESSAGE_HISTORY_WINDOW.initialVisibleCount;
      const next = Math.max(CHAT_MESSAGE_HISTORY_WINDOW.initialVisibleCount, current);
      return Math.min(messages.length, next);
    });
  }, [messages.length]);

  // Scroll to bottom when messages change and auto-scroll is enabled
  // Uses debouncing to handle rapid streaming updates efficiently
  useEffect(() => {
    if (shouldAutoScroll && scrollViewRef.current) {
      // Clear any pending scroll timeout to debounce rapid updates
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Schedule a new scroll with a short delay to batch rapid updates
      scrollTimeoutRef.current = setTimeout(() => {
        // Double-check auto-scroll is still enabled before scrolling
        if (shouldAutoScrollRef.current && scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 50);
    }
  }, [messages, shouldAutoScroll]);

  // Cleanup timeouts on unmount
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
          const nextPrompts = sortPredefinedPromptsByUpdatedAt(settings.predefinedPrompts || []);
          const ttsVoiceValue = getTextToSpeechVoiceValue(settings);
          setPredefinedPrompts(nextPrompts);
          setRemoteTtsProvider(settings.ttsProviderId || 'native');
          setRemoteTtsVoice(ttsVoiceValue === undefined ? DEFAULT_EDGE_TTS_VOICE : String(ttsVoiceValue));
          setRemoteTtsModel(getTextToSpeechModelValue(settings));
          setRemoteTtsRate(getTextToSpeechPlaybackRate(settings));
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
        ? updatePredefinedPromptList(predefinedPrompts, editingPrompt.id, draft, now)
        : [
          createPredefinedPromptRecord(draft, now),
          ...predefinedPrompts,
        ];

      await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(sortPredefinedPromptsByUpdatedAt(updatedPrompts));
      setAddPromptModalVisible(false);
      setEditingPrompt(null);
      setNewPromptName('');
      setNewPromptContent('');
      Alert.alert(promptLibraryCopy.feedback.successTitle, getPromptLibrarySaveSuccessMessage(Boolean(editingPrompt)));
    } catch (error: any) {
      console.error('[ChatScreen] Error saving prompt:', error);
      Alert.alert(promptLibraryCopy.feedback.errorTitle, error.message || promptLibraryCopy.feedback.promptSaveFailed);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleDeletePrompt = useCallback((prompt: PredefinedPromptSummary) => {
    if (!settingsClient) return;

    const deletePrompt = async () => {
      setIsSavingPrompt(true);
      try {
        const updatedPrompts = deletePredefinedPromptFromList(predefinedPrompts, prompt.id);
        await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
        setPredefinedPrompts(updatedPrompts);
      } catch (error: any) {
        console.error('[ChatScreen] Error deleting prompt:', error);
        Alert.alert(promptLibraryCopy.feedback.errorTitle, error.message || promptLibraryCopy.feedback.promptDeleteFailed);
      } finally {
        setIsSavingPrompt(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (message?: string) => boolean }).confirm;
      if (confirmFn?.(formatPromptLibraryDeletePromptWebConfirmMessage(prompt.name))) {
        void deletePrompt();
      }
      return;
    }

    Alert.alert(promptLibraryCopy.feedback.deletePromptTitle, formatPromptLibraryDeletePromptConfirmMessage(prompt.name), [
      { text: promptLibraryCopy.actions.cancel, style: 'cancel' },
      { text: promptLibraryCopy.actions.delete, style: 'destructive', onPress: () => { void deletePrompt(); } },
    ]);
  }, [predefinedPrompts, settingsClient]);

  // Reset auto-scroll when session changes
  useEffect(() => {
    setShouldAutoScroll(true);
    // Scroll to bottom when switching sessions
    const timeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [sessionStore.currentSessionId]);

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
      // Reset expandedMessages and expandedToolCalls on session switch to ensure consistent
      // "final response expanded" behavior per chat and prevent stale UI state from leaking.
      setExpandedMessages({});
      setExpandedToolCalls({});
      setExpandedGroups({});
      setExpandedToolApprovals({});
      setExpandedDelegationConversationPreviews({});
      setExpandedDelegationToolPreviews({});
      setCopiedMessageIndex(null);
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
        const chatMessages: ChatMessage[] = currentSession.messages.map(m => ({
          role: m.role,
          content: m.content,
          displayContent: (m as ChatMessage).displayContent,
          timestamp: m.timestamp,
          toolCalls: m.toolCalls,
          toolResults: m.toolResults,
        }));
        setMessages(chatMessages);

        // Extract respond_to_user content from saved messages for display (#32, #33)
        const savedResponses = extractRespondToUserHistory(chatMessages as RespondToUserHistorySourceMessage[]);
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
            const loadedMessages = result.messages.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              displayContent: (m as ChatMessage).displayContent,
              timestamp: m.timestamp,
              toolCalls: m.toolCalls,
              toolResults: m.toolResults,
            }));
            setMessages(loadedMessages);

            // Extract respond_to_user content from lazy-loaded messages (#32, #33)
            const lazyResponses = extractRespondToUserHistory(
              loadedMessages as RespondToUserHistorySourceMessage[]
            );
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
      const chatMessages: ChatMessage[] = currentSession.messages.map(m => ({
        role: m.role,
        content: m.content,
        displayContent: (m as ChatMessage).displayContent,
        timestamp: m.timestamp,
        toolCalls: m.toolCalls,
        toolResults: m.toolResults,
      }));
      setMessages(chatMessages);

      // Extract respond_to_user content from new session messages (#32, #33)
      const newResponses = extractRespondToUserHistory(chatMessages as RespondToUserHistorySourceMessage[]);
	      replaceResponseHistory(newResponses);
      playedResponseEventIdsRef.current = new Set(newResponses.map((event) => event.id));
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventIdRef.current = null;
    } else {
      setMessages([]);
	      replaceResponseHistory([]);
    }
	  }, [sessionStore.currentSessionId, sessionStore, sessionStore.deletingSessionIds.size, config.baseUrl, config.apiKey, settingsClient, replaceResponseHistory]);

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

  const toggleMessageExpansion = useCallback((index: number) => {
    setExpandedMessages(prev => toggleChatDisplayExpansionState(prev, index));
  }, []);

  // Toggle expansion of individual tool call details (input params and results)
  const toggleToolCallExpansion = useCallback((messageId: string, toolCallIndex: number) => {
    const key = `${messageId}-${toolCallIndex}`;
    setExpandedToolCalls(prev => toggleChatDisplayExpansionState(prev, key));
  }, []);

  // Compute tool-activity groups for consecutive connected tool-call messages
  const toolActivityGroups = useMemo(() => groupToolActivity(messages), [messages]);

  // Toggle expansion of a tool-activity group using a stable key for the run.
  const toggleGroupExpansion = useCallback((group: ToolActivityGroup) => {
    const key = getToolActivityGroupStateKey(group);
    setExpandedGroups(prev => toggleChatDisplayExpansionState(prev, key));
  }, []);

  useEffect(() => {
    setExpandedGroups(prev => applyChatDisplayGroupedExpansionInheritance({
      groupState: prev,
      inheritedState: expandedMessages,
      groups: getToolActivityGroupExpansionInheritanceItems(toolActivityGroups.groups),
    }));
  }, [expandedMessages, toolActivityGroups.groups]);

  const toggleToolApprovalArguments = useCallback((approvalId: string) => {
    setExpandedToolApprovals(prev => toggleChatDisplayExpansionState(prev, approvalId));
  }, []);

  // Auto-expand logic matching desktop behavior (#32, #33):
  // - Tool-only messages (toolCalls/toolResults with no visible user-facing content) collapse by default
  // - Messages with tool metadata and visible user-facing content can still expand normally
  // - Only the final assistant message auto-expands, and only when not streaming (agent complete)
  // - Tool-only messages stay collapsed during streaming to avoid showing raw payload text
  // - Users can still manually expand any collapsed message
  useEffect(() => {
    setExpandedMessages(prev => applyChatMessageAutoExpansionState(prev, messages, {
      isResponding: responding,
    }));
  }, [messages, responding]);

  const convoRef = useRef<string | undefined>(undefined);

  const convertProgressToMessages = useCallback((update: AgentProgressUpdate): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    const delegationMessages = createDelegationProgressMessages(update.steps);
    console.log('[convertProgressToMessages] Processing update, steps:', update.steps?.length || 0, 'history:', update.conversationHistory?.length || 0, 'isComplete:', update.isComplete);

    if (update.steps && update.steps.length > 0) {
      let currentToolCalls: any[] = [];
      let currentToolResults: any[] = [];
      let thinkingContent = '';

      for (const step of update.steps) {
        const stepContent = step.content || step.llmContent;
        if (step.type === 'thinking' && stepContent) {
          thinkingContent = stepContent;
        } else if (step.type === 'tool_call') {
          if (step.toolCall) {
            currentToolCalls.push(step.toolCall);
          }
          if (step.toolResult) {
            currentToolResults.push(step.toolResult);
          }
        } else if (step.type === 'tool_result' && step.toolResult) {
          currentToolResults.push(step.toolResult);
        } else if (step.type === 'completion' && stepContent) {
          thinkingContent = stepContent;
        }
      }

      const activeStep = [...update.steps].reverse().find((step) => step.status === 'in_progress');
      const isVerificationStep = activeStep?.title?.toLowerCase().includes('verifying');
      const hasCurrentToolActivity = currentToolCalls.length > 0 || currentToolResults.length > 0;
      const hasCurrentAssistantFeedback = hasCurrentToolActivity || thinkingContent.trim().length > 0;
      const hasCurrentStateFeedback =
        hasCurrentAssistantFeedback ||
        !!update.pendingToolApproval ||
        !!update.retryInfo?.isRetrying ||
        delegationMessages.length > 0 ||
        !!update.streamingContent?.text;

      if (hasCurrentAssistantFeedback) {
        messages.push({
          role: 'assistant',
          content: formatChatMessageRuntimeAssistantFeedbackContent(thinkingContent, hasCurrentToolActivity),
          toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
          toolResults: currentToolResults.length > 0 ? currentToolResults : undefined,
        });
      } else if (
        !update.isComplete &&
        !hasCurrentStateFeedback &&
        !isVerificationStep
      ) {
        messages.push({
          role: 'assistant',
          content: formatChatMessageRuntimeActivityContent(activeStep),
        });
      }
    }

    if (update.conversationHistory && update.conversationHistory.length > 0) {
      let currentTurnStartIndex = 0;
      for (let i = 0; i < update.conversationHistory.length; i++) {
        if (update.conversationHistory[i].role === 'user') {
          currentTurnStartIndex = i;
        }
      }

      const hasAssistantMessages = currentTurnStartIndex + 1 < update.conversationHistory.length;
      if (hasAssistantMessages) {
        messages.length = 0;

        for (let i = currentTurnStartIndex + 1; i < update.conversationHistory.length; i++) {
          const historyMsg = update.conversationHistory[i];

          // Merge tool results into the preceding assistant message to avoid duplication
          // The server sends: assistant (with toolCalls) -> tool (with toolResults)
          // We want to display them as a single message with both toolCalls and toolResults
          if (historyMsg.role === 'tool' && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
              const hasToolResults = historyMsg.toolResults && historyMsg.toolResults.length > 0;

              if (hasToolResults) {
                // Merge toolResults into the existing assistant message
                lastMessage.toolResults = [
                  ...(lastMessage.toolResults || []),
                  ...(historyMsg.toolResults || []),
                ];
                // Skip adding this as a separate message only when we merged results
                continue;
              }
            }
          }

          // Drop synthetic tool-role summaries (e.g. "TOOL FAILED: ...") that
          // carry no toolResults/toolCalls — the underlying failures are
          // already visible inside the tool call stack via toolResults on the
          // preceding tool message.
          if (
            historyMsg.role === 'tool' &&
            !(historyMsg.toolResults && historyMsg.toolResults.length > 0) &&
            !(historyMsg.toolCalls && historyMsg.toolCalls.length > 0)
          ) {
            continue;
          }

          messages.push({
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            displayContent: historyMsg.displayContent,
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
            branchMessageIndex: historyMsg.branchMessageIndex,
          });
        }
      }
    }

    if (update.retryInfo?.isRetrying) {
      messages.push({
        role: 'assistant',
        content: update.retryInfo.reason,
        variant: 'retry',
        retryInfo: update.retryInfo,
      });
    }

    if (update.streamingContent?.text) {
      if (
        messages.length > 0
        && isChatMessageConversationContent(messages[messages.length - 1])
      ) {
        messages[messages.length - 1].content = update.streamingContent.text;
      } else {
        messages.push({
          role: 'assistant',
          content: update.streamingContent.text,
        });
      }
    }

    if (update.pendingToolApproval) {
      messages.push({
        role: 'assistant',
        content: formatChatMessageRuntimeToolApprovalRequiredContent(update.pendingToolApproval.toolName),
        variant: 'approval',
        toolApproval: update.pendingToolApproval,
      });
    }

    const messagesWithUserResponse = applyUserResponseToChatMessages(
      messages,
      update.userResponse || update.spokenContent,
    );
    return [...messagesWithUserResponse, ...delegationMessages];
  }, []);

  // Get the current conversation ID for queue operations
  const currentConversationId = sessionStore.currentSessionId || 'default';

  // Get queued messages for the current conversation
  const queuedMessages = messageQueue.getQueue(currentConversationId);
  const isMessageQueuePaused = messageQueue.isQueuePaused(currentConversationId);
  const nextQueuedMessage = !responding && !isMessageQueuePaused ? messageQueue.peek(currentConversationId) : null;
  const mobileRuntimeDebugPanelsRenderState = useMemo(
    () => createChatMessageRuntimeDebugPanelsRenderState({
      requestDebugText: debugInfo,
      voiceDebugEnabled: handsFreeDebugEnabled,
      voiceEvents,
    }),
    [debugInfo, handsFreeDebugEnabled, voiceEvents],
  );

  const handlePickImages = useCallback(async () => {
    if (pendingImages.length >= MAX_PENDING_IMAGES) {
      showImageAttachmentAlert({
        reason: 'limitReached',
        maxImages: MAX_PENDING_IMAGES,
      });
      return;
    }

    const existingEmbeddedBytes = pendingImages.reduce(
      (sum, image) => sum + getApproxDataUrlBytes(image.dataUrl),
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

        const inferredBytes = getDecodedBase64ByteLength(asset.base64);
        const fileSizeBytes = typeof asset.fileSize === 'number' && asset.fileSize > 0
          ? asset.fileSize
          : inferredBytes;
        if (fileSizeBytes > MAX_PENDING_IMAGE_FILE_SIZE_BYTES) {
          oversizedImageNames.push(displayName);
          return;
        }

        const mimeType = inferImageMimeTypeFromSource(asset);
        if (!mimeType) {
          unknownMimeNames.push(displayName);
          return;
        }

        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        const embeddedBytes = getApproxDataUrlBytes(dataUrl) || inferredBytes;
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
      console.log('[ChatScreen] Agent busy, queuing message:', getMessageLogMeta(text));
      messageQueue.enqueue(currentConversationId, text, currentConversationId);
      setInput('');
      if (options?.fromComposer) {
        setPendingImages([]);
      }
      return;
    }

    console.log('[ChatScreen] Sending message:', getMessageLogMeta(text));

    // Get client from connection manager (preserves connections across session switches)
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for send');
      setDebugInfo(formatChatRuntimeDebugError(mobileRuntimeDebug.noSessionAvailable));
      return;
    }

    setDebugInfo(formatChatRuntimeStartingRequestDebugMessage(config.baseUrl));
    // Clear any previous failed message when starting a new send
    setLastFailedMessage(null);

    const userMsg: ChatMessage = { role: 'user', content: text };
	    // Use ref to avoid stale closures (notably auto-send after rapid-fire session switch).
	    const currentMessages = messagesRef.current;
    const messageCountBeforeTurn = currentMessages.length;
    // Clear progress messages ref for this new request (#1083)
    progressMessagesRef.current = [];
    setLatestStepSummary(null);
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '' }]);
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
      setDebugInfo(mobileRuntimeDebug.requestSent);

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
        latestConversationState = resolveConversationStateFromProgress(update, 'running');
        setConversationState(latestConversationState);
        if (update.responseEvents?.length) {
	          lastResponseEvents = sortAgentUserResponseEvents(update.responseEvents);
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
        const progressMessages = convertProgressToMessages(update);
        if (progressMessages.length > 0) {
          // Store progress messages so we can merge with final history (#1083)
          progressMessagesRef.current = progressMessages;
          setMessages((m) => {
            const beforePlaceholder = m.slice(0, messageCountBeforeTurn + 1);
            const newMessages = [...beforePlaceholder, ...progressMessages];
            return newMessages;
          });
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

        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (isChatMessageConversationContent(copy[i])) {
              copy[i] = { ...copy[i], content: streamingText };
              break;
            }
          }
          return copy;
        });
      };

      const modelMessages = sanitizeMessagesForModel([...currentMessages, userMsg]);
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
        setDebugInfo(mobileRuntimeDebug.completed);
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

        let currentTurnStartIndex = 0;
        for (let i = 0; i < response.conversationHistory.length; i++) {
          if (response.conversationHistory[i].role === 'user') {
            currentTurnStartIndex = i;
          }
        }
        console.log('[ChatScreen] currentTurnStartIndex:', currentTurnStartIndex);

        const newMessages: ChatMessage[] = [];
        for (let i = currentTurnStartIndex; i < response.conversationHistory.length; i++) {
          const historyMsg = response.conversationHistory[i];
          if (historyMsg.role === 'user') continue;

          // Merge tool results into the preceding assistant message to avoid duplication
          // The server sends: assistant (with toolCalls) -> tool (with toolResults)
          // We want to display them as a single message with both toolCalls and toolResults
          if (historyMsg.role === 'tool' && newMessages.length > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
              const hasToolResults = historyMsg.toolResults && historyMsg.toolResults.length > 0;

              if (hasToolResults) {
                // Merge toolResults into the existing assistant message
                lastMessage.toolResults = [
                  ...(lastMessage.toolResults || []),
                  ...(historyMsg.toolResults || []),
                ];
                // Skip adding this as a separate message only when we merged results
                continue;
              }
            }
          }

          // Drop synthetic tool-role summaries (e.g. "TOOL FAILED: ...") that
          // carry no toolResults/toolCalls — the underlying failures are
          // already visible inside the tool call stack via toolResults on the
          // preceding tool message.
          if (
            historyMsg.role === 'tool' &&
            !(historyMsg.toolResults && historyMsg.toolResults.length > 0) &&
            !(historyMsg.toolCalls && historyMsg.toolCalls.length > 0)
          ) {
            continue;
          }

          newMessages.push({
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            displayContent: historyMsg.displayContent,
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
            branchMessageIndex: historyMsg.branchMessageIndex,
          });
        }
		        const finalTurnMessages = applyUserResponseToChatMessages(newMessages, finalResponseEvent?.text || lastUserResponse);
	        console.log('[ChatScreen] newMessages count:', finalTurnMessages.length);
	        console.log('[ChatScreen] newMessages roles:', finalTurnMessages.map(m => `${m.role}(toolCalls:${m.toolCalls?.length || 0},toolResults:${m.toolResults?.length || 0})`).join(', '));
        console.log('[ChatScreen] messageCountBeforeTurn:', messageCountBeforeTurn);

        if (sessionChanged && requestSessionId) {
          // Only persist to background session if this is still the latest request for that session
          // This prevents an older request from overwriting newer history (PR review fix #14)
          if (isLatestForSession) {
            console.log('[ChatScreen] Persisting completed response to background session:', requestSessionId);
            // Build the final messages array: messages before this turn + user message + new assistant messages
	            const messagesBeforeTurn = currentMessages.slice(0, messageCountBeforeTurn);
	            const finalMessages = [...messagesBeforeTurn, userMsg, ...finalTurnMessages];
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
            const beforePlaceholder = m.slice(0, messageCountBeforeTurn + 1);
            console.log('[ChatScreen] beforePlaceholder count:', beforePlaceholder.length);
            // If progress had more messages than conversationHistory, keep progress messages
            // and only update/append the final message from history
            let mergedMessages: ChatMessage[];
            if (progressMsgs.length > 0 && finalTurnMessages.length === 0) {
              // Edge case: server returned empty history but we have progress messages
              // Keep progress messages to prevent intermediate messages from disappearing (#1083)
              console.log('[ChatScreen] Merging: newMessages empty, keeping progress messages');
              mergedMessages = [...progressMsgs];
            } else if (progressMsgs.length > finalTurnMessages.length && finalTurnMessages.length > 0) {
              console.log('[ChatScreen] Merging: progress had more messages, preserving intermediate');
              mergedMessages = [...progressMsgs];
              // Replace/update the last message with the final one from history
              mergedMessages[mergedMessages.length - 1] = preserveChatMessageDisplayContentFromProgress(
                [finalTurnMessages[finalTurnMessages.length - 1]],
                [mergedMessages[mergedMessages.length - 1]],
              )[0];
            } else {
              // History is authoritative when it has >= messages
              mergedMessages = preserveChatMessageDisplayContentFromProgress(finalTurnMessages, progressMsgs);
            }
            const result = [...beforePlaceholder, ...mergedMessages];
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
	            const messagesBeforeTurn = currentMessages.slice(0, messageCountBeforeTurn);
	            const finalMessages = [...messagesBeforeTurn, userMsg, { role: 'assistant' as const, content: finalDisplayText }];
            await sessionStore.setMessagesForSession(requestSessionId, finalMessages);
          } else {
            console.log('[ChatScreen] Skipping fallback background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (isChatMessageConversationContent(copy[i])) {
	                copy[i] = { ...copy[i], content: finalDisplayText };
                break;
              }
            }
            return copy;
          });
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
      const errorMessage = formatChatRuntimeConnectionErrorMessage(e.message, recoveryState);

      // Save the failed message for retry
      setLastFailedMessage(text);

      // Check if there's partial content we can show
      const partialContent = client.getPartialContent();

      setDebugInfo(formatChatRuntimeDebugError(errorMessage));
      // Update the in-flight assistant message instead of appending a new one
      // This avoids duplicating the assistant loading placeholder and ensures
      // the retry pop logic removes the correct items
      setMessages((m) => {
        const errorContent = formatChatRuntimeAssistantErrorContent(errorMessage, partialContent);
        // Find and update the last assistant message instead of appending
        const copy = [...m];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (isChatMessageConversationContent(copy[i])) {
            copy[i] = { ...copy[i], content: errorContent };
            break;
          }
        }
        return copy;
      });
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

    console.log('[ChatScreen] Processing queued message:', queuedMsg.id, getMessageLogMeta(text));

    // Get client from connection manager (preserves connections across session switches)
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for processing queued message');
      messageQueue.markFailed(
        currentConversationId,
        queuedMsg.id,
        mobileRuntimeDebug.noSessionAvailable,
      );
      setDebugInfo(formatChatRuntimeDebugError(mobileRuntimeDebug.noSessionAvailable));
      return;
    }

    setDebugInfo(mobileRuntimeDebug.processingQueuedMessage);

    const userMsg: ChatMessage = { role: 'user', content: text };
    // Use ref to get latest messages to avoid stale closure when called via setTimeout (PR review fix)
    const currentMessages = messagesRef.current;
    const messageCountBeforeTurn = currentMessages.length;
    setLatestStepSummary(null);
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '' }]);
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
        latestConversationState = resolveConversationStateFromProgress(update, 'running');
        setConversationState(latestConversationState);
        if (update.responseEvents?.length) {
	          lastResponseEvents = sortAgentUserResponseEvents(update.responseEvents);
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
        const progressMessages = convertProgressToMessages(update);
        if (progressMessages.length > 0) {
          setMessages((m) => {
            const beforePlaceholder = m.slice(0, messageCountBeforeTurn + 1);
            return [...beforePlaceholder, ...progressMessages];
          });
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
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (isChatMessageConversationContent(copy[i])) {
              copy[i] = { ...copy[i], content: streamingText };
              break;
            }
          }
          return copy;
        });
      };

      const modelMessages = sanitizeMessagesForModel([...currentMessages, userMsg]);
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
          mobileRuntimeDebug.sessionChangedDuringProcessing,
        );
        return;
      }
      if (activeRequestIdRef.current !== thisRequestId) {
        // Request superseded - mark as failed so user can retry
        messageQueue.markFailed(
          currentConversationId,
          queuedMsg.id,
          mobileRuntimeDebug.requestSuperseded,
        );
        return;
      }
      setConversationState(latestConversationState === 'running' ? 'complete' : latestConversationState);

      if (response.conversationId) {
        await sessionStore.setServerConversationId(response.conversationId);
        resolvedConversationId = response.conversationId;
      }

      if (response.conversationHistory && response.conversationHistory.length > 0) {
        let currentTurnStartIndex = 0;
        for (let i = 0; i < response.conversationHistory.length; i++) {
          if (response.conversationHistory[i].role === 'user') {
            currentTurnStartIndex = i;
          }
        }

        const newMessages: ChatMessage[] = [];
        for (let i = currentTurnStartIndex; i < response.conversationHistory.length; i++) {
          const historyMsg = response.conversationHistory[i];
          if (historyMsg.role === 'user') continue;
          // Drop synthetic tool-role summaries (e.g. "TOOL FAILED: ...") that
          // carry no toolResults/toolCalls — the underlying failures are
          // already visible inside the tool call stack via toolResults on the
          // preceding tool message.
          if (
            historyMsg.role === 'tool' &&
            !(historyMsg.toolResults && historyMsg.toolResults.length > 0) &&
            !(historyMsg.toolCalls && historyMsg.toolCalls.length > 0)
          ) {
            continue;
          }
          newMessages.push({
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            displayContent: historyMsg.displayContent,
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
            branchMessageIndex: historyMsg.branchMessageIndex,
          });
        }
	        const finalTurnMessages = applyUserResponseToChatMessages(newMessages, finalResponseEvent?.text || lastUserResponse);

        setMessages((m) => {
          const beforePlaceholder = m.slice(0, messageCountBeforeTurn + 1);
          return [...beforePlaceholder, ...finalTurnMessages];
        });
      } else if (finalDisplayText) {
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (isChatMessageConversationContent(copy[i])) {
              copy[i] = { ...copy[i], content: finalDisplayText };
              break;
            }
          }
          return copy;
        });
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
      const queuedErrorMessage = getChatRuntimeAlertMessage(e, mobileRuntimeDebug.unknownError);
      messageQueue.markFailed(currentConversationId, queuedMsg.id, queuedErrorMessage);
      setConversationState('blocked');
      setMessages((m) => [...m, { role: 'assistant', content: formatChatRuntimeDebugError(queuedErrorMessage) }]);
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

	const isWebPlatform = Platform.OS === 'web';
  const chatComposerRuntimeDockChrome = useMemo(
    () => createChatComposerRuntimeDockChromeProps({
      colors: theme.colors,
      platform: Platform.OS,
      isWebPlatform,
    }),
    [isWebPlatform, theme.colors],
  );
  const composerPresentation = useMemo(
    () => createChatComposerRuntimeFollowUpPresentationState({
      conversationState,
      isResponding: responding,
      isQueueEnabled: messageQueueEnabled,
    }),
    [conversationState, messageQueueEnabled, responding]
  );

  const promptQuickStarts = useMemo<QuickStartShortcut[]>(
    () => createChatConversationHomeQuickStartItems({
      prompts: predefinedPrompts,
      skills: availableSkills,
      tasks: availableTasks,
      canAddPrompt: Boolean(settingsClient),
    }),
    [availableSkills, availableTasks, predefinedPrompts, settingsClient]
  );

  const composerHasContent = input.trim().length > 0 || pendingImages.length > 0;
  const sendComposerInput = useCallback(() => {
    const composedMessage = buildChatImageAttachmentMessage(input, pendingImages);
    if (!composedMessage.trim()) return;
    void send(composedMessage, { fromComposer: true });
  }, [input, pendingImages, send]);

  const queueComposerInput = useCallback(() => {
    const composedMessage = buildChatImageAttachmentMessage(input, pendingImages);
    if (!composedMessage.trim()) return;

    messageQueue.enqueue(currentConversationId, composedMessage, currentConversationId);
    setInput('');
    setPendingImages([]);
    setDebugInfo(composerQueueDebugMessage);
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
			setDebugInfo(handsFreeCopy.debug.awake);
		}, [handsFreeController.wakeByUser, listening, startRecording]);

		const sleepHandsFreeByUser = useCallback(() => {
			handsFreeController.sleepByUser();
			setDebugInfo(formatHandsFreeSleepingDebugMessage(handsFreeWakePhrase));
		}, [handsFreeController.sleepByUser, handsFreeWakePhrase]);

		const resumeHandsFreeByUser = useCallback(() => {
			handsFreeController.resumeByUser();
			if (!listening) {
				void startRecording();
			}
			setDebugInfo(handsFreeCopy.debug.resumed);
		}, [handsFreeController.resumeByUser, listening, startRecording]);

		const pauseHandsFreeByUser = useCallback(() => {
			handsFreeController.pauseByUser();
			Speech.stop();
			void stopRecognitionOnly();
			setDebugInfo(handsFreeCopy.debug.paused);
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

  const {
    threadStates: conversationThreadStates,
    visibleMessageCount: conversationThreadVisibleMessageCount,
    totalMessageCount: conversationThreadTotalMessageCount,
    hiddenMessageCount,
  } = createChatMessageConversationRuntimeThreadListRenderState({
    messages,
    visibleMessageCount,
    groupByIndex: toolActivityGroups.groupByIndex,
    groupState: expandedGroups,
    inheritedState: expandedMessages,
    onToggleGroup: toggleGroupExpansion,
    expandedMessages,
    turnDurationsByUserTimestamp: turnDurations.byUserTimestamp,
    conversationId: currentSession?.serverConversationId,
    pendingBranchMessageIndex: branchingMessageIndex,
    isResponding: responding,
    speakingMessageIndex,
    copiedMessageIndex,
    ttsEnabled,
    colors: theme.colors,
    actionStyles: chatMessageConversationThreadStyles.actionSet,
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
  });
  const handleLoadEarlierMessages = () => {
    setVisibleMessageCount((current) =>
      Math.min(messages.length, current + CHAT_MESSAGE_HISTORY_WINDOW.loadIncrement),
    );
  };
  const handleScrollToBottomPress = () => {
    setShouldAutoScroll(true);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };
  const chatMessageRuntimeViewport = createChatMessageRuntimeViewportChromeProps({
    scrollRef: scrollViewRef,
    onScroll: handleScroll,
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    scrollEventThrottle: CHAT_MESSAGE_HISTORY_WINDOW.scrollEventThrottleMs,
    viewportContentIsLoadingMessages: sessionStore.isLoadingMessages,
    viewportContentMessageCount: messages.length,
    loadingSpinnerSource: isDark ? darkSpinner : lightSpinner,
    quickStartItems: promptQuickStarts,
    isLoadingQuickStartPrompts,
    runningPromptTaskId,
    onQuickStartPress: handleQuickStartPress,
    onEditPrompt: openEditPromptModal,
    onDeletePrompt: handleDeletePrompt,
    visibleMessageCount: conversationThreadVisibleMessageCount,
    totalMessageCount: conversationThreadTotalMessageCount,
    hiddenMessageCount,
    messageHistoryLoadIncrement: CHAT_MESSAGE_HISTORY_WINDOW.loadIncrement,
    latestStepSummary,
    colors: theme.colors,
    onLoadEarlierMessages: handleLoadEarlierMessages,
    debugPanelsRenderState: mobileRuntimeDebugPanelsRenderState,
  });
  const chatComposerRuntimeDock = createChatComposerRuntimeDockProps({
    chrome: chatComposerRuntimeDockChrome,
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
    composerControlPresentation: composerPresentation,
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
    textEntryIsWebPlatform: isWebPlatform,
    textEntryWillCancel: willCancel,
    textEntryLiveTranscript: liveTranscript,
    textEntryWakePhrase: handsFreeWakePhrase,
    onQueueActionPress: queueComposerInput,
    onSubmitActionPress: sendComposerInput,
    onMicPressIn: handlePushToTalkPressIn,
    onMicPressOut: handlePushToTalkPressOut,
    onMicPress: handleHandsFreePrimaryControl,
    micWrapperRef: micButtonRef,
  });
  const chatMessageRuntimeDock = createChatMessageRuntimeDockChromeProps({
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
    composer: chatComposerRuntimeDock,
  });
  const chatMessageRuntimeSurface = createChatMessageRuntimeSurfaceChromeProps({
    platform: Platform.OS,
    colors: theme.colors,
    keyboardVerticalOffset: headerHeight,
    dock: chatMessageRuntimeDock,
    viewport: chatMessageRuntimeViewport,
    threadStates: conversationThreadStates,
    threadStyles: chatMessageConversationThreadStyles.runtimeThread,
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

          let lastUserMsgIndex = -1;
          for (let i = serverMessages.length - 1; i >= 0; i--) {
            if (serverMessages[i].role === 'user') {
              lastUserMsgIndex = i;
              break;
            }
          }

          let hasAssistantResponse = false;
          if (lastUserMsgIndex >= 0) {
            for (let i = lastUserMsgIndex + 1; i < serverMessages.length; i++) {
              if (serverMessages[i].role === 'assistant' && serverMessages[i].content) {
                hasAssistantResponse = true;
                break;
              }
            }
          }

          if (hasAssistantResponse) {
            console.log('[ChatScreen] Retry: Server already has response, syncing state');

            await sessionStore.setServerConversationId(recoveryConversationId);

            const recoveredMessages: ChatMessage[] = [];
            for (const msg of serverMessages) {
              if (msg.role === 'user' || msg.role === 'assistant') {
                recoveredMessages.push({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                  displayContent: (msg as ChatMessage).displayContent,
                  toolCalls: msg.toolCalls,
                  toolResults: msg.toolResults,
                });
              } else if (msg.role === 'tool' && recoveredMessages.length > 0) {
                const lastMessage = recoveredMessages[recoveredMessages.length - 1];
                if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
                  const hasToolResults = msg.toolResults && msg.toolResults.length > 0;

                  if (hasToolResults) {
                    lastMessage.toolResults = [
                      ...(lastMessage.toolResults || []),
                      ...(msg.toolResults || []),
                    ];
                  }
                }
              }
            }

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

    setMessages((m) => {
      const newMessages = [...m];
      if (newMessages.length >= 2) {
        newMessages.pop();
        newMessages.pop();
      }
      return newMessages;
    });
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

function createStyles(theme: Theme, screenHeight: number) {
  const chatChromeStyleState = createChatRuntimeMobileChromeStyleState({
    colors: theme.colors,
    platform: Platform.OS,
  });
  const headerChromeStyleState = chatChromeStyleState.header;
  const headerStyleState = headerChromeStyleState.header;
  const headerSurface = headerStyleState.surface;
  const headerAgentSelectorColors = headerStyleState.agentSelector;
  const inactiveHeaderPinButtonColors = headerStyleState.pinButton.inactive;
  const activeHeaderPinButtonColors = headerStyleState.pinButton.active;
  const headerKillSwitchButtonColors = headerStyleState.killSwitchButton;
  const conversationChromeStyleState = chatChromeStyleState.conversation;
  const viewportStyleState = conversationChromeStyleState.viewport;
  const viewportSurface = viewportStyleState.surface;
  const loadingStateSurface = viewportStyleState.loadingState;
  const inlineActivitySurface = viewportStyleState.inlineActivity;
  const streamingContentStyleState = conversationChromeStyleState.streamingContent;
  const streamingContentSurface = streamingContentStyleState.surface;
  const streamingContentSurfaceColors = streamingContentStyleState.colors;
  const streamingContentSpinnerSize = streamingContentStyleState.spinner.size;
  const connectionBannerStyleState = conversationChromeStyleState.connectionBanner;
  const connectionBannerSurface = connectionBannerStyleState.surface;
  const connectionBannerSurfaceColors = connectionBannerStyleState.colors;
  const retryStatusStyleState = conversationChromeStyleState.retryStatus;
  const retryStatusSurface = retryStatusStyleState.surface;
  const retryStatusSurfaceColors = retryStatusStyleState.colors;
  const stepSummaryStyleState = conversationChromeStyleState.stepSummary;
  const stepSummarySurface = stepSummaryStyleState.surface;
  const stepSummarySurfaceColors = stepSummaryStyleState.colors;
  const delegationCardStyleState = conversationChromeStyleState.delegationCard;
  const delegationCardSurface = delegationCardStyleState.surface;
  const delegationCardSurfaceColors = delegationCardStyleState.colors;
  const scrollToBottomStyleState = conversationChromeStyleState.scrollToBottom;
  const scrollToBottomSurface = scrollToBottomStyleState.surface;
  const scrollToBottomSurfaceColors = scrollToBottomStyleState.colors;
  const messageHistoryBannerStyleState = conversationChromeStyleState.messageHistoryBanner;
  const messageHistoryBannerSurface = messageHistoryBannerStyleState.surface;
  const messageHistoryBannerSurfaceColors = messageHistoryBannerStyleState.colors;
  const messageHistoryLoadButtonPressedOpacity = messageHistoryBannerStyleState.loadButton.pressedOpacity;
  const composerChromeStyleState = chatChromeStyleState.composer;
  const composerStyleState = composerChromeStyleState.composer;
  const composerSurface = composerStyleState.surface;
  const composerTextInputSurface = composerSurface.input;
  const composerTextInputPlatform = composerStyleState.input;
  const mobileComposerSurfaceColors = composerStyleState.colors.surface;
  const mobileComposerTextColors = composerStyleState.colors.text;
  const inputAreaSurface = composerSurface.inputArea;
  const sttPreviewSurface = composerSurface.sttPreview;
  const voiceOverlaySurface = composerSurface.voiceOverlay;
  const imageAttachmentStyleState = composerChromeStyleState.imageAttachment;
  const imageAttachmentSurface = imageAttachmentStyleState.surface;
  const promptLibraryStyleState = composerChromeStyleState.promptLibrary;
  const promptLibrarySurface = promptLibraryStyleState.surface;
  const promptLibrarySurfaceColors = promptLibraryStyleState.colors;
  const promptEditorModalSurface = promptLibrarySurface.editorModal;
  const promptEditorInputPaddingVertical = composerChromeStyleState.promptEditorInputPaddingVertical;
  const messageQueuePanelWrapperState = chatChromeStyleState.messageQueuePanelWrapper;
  const messageQueuePanelWrapper = messageQueuePanelWrapperState.wrapper;
  const handsFreeStyleState = composerChromeStyleState.handsFree;
  const handsFreeSurface = handsFreeStyleState.surface;
  const headerActionButton = chatChromeStyleState.headerActionButton;
  const headerEdgeActionButton = chatChromeStyleState.headerEdgeActionButton;
  const headerPinButton = chatChromeStyleState.headerPinButton;
  const sessionStatusStyleState = headerChromeStyleState.sessionStatus;
  const sessionStatusSurface = sessionStatusStyleState.surface;
  const threadChromeStyleState = chatChromeStyleState.thread;
  const compactToolExecutionStyleState = threadChromeStyleState.compactToolExecution;
  const compactToolExecution = compactToolExecutionStyleState.surface;
  const toolExecutionDetailStyleState = threadChromeStyleState.toolExecutionDetail;
  const detailedToolExecution = toolExecutionDetailStyleState.surface;
  const viewportSurfaceColors = viewportStyleState.colors;
  const toolActivityGroupStyleState = threadChromeStyleState.toolActivityGroup;
  const toolActivityGroupSurface = toolActivityGroupStyleState.surface;
  const toolActivityGroupSurfaceColors = toolActivityGroupStyleState.colors;
  const imageAttachmentSurfaceColors = imageAttachmentStyleState.colors;
  const handsFreeSurfaceColors = handsFreeStyleState.colors;
  const toolApprovalStyleState = threadChromeStyleState.toolApproval;
  const toolApprovalSurface = toolApprovalStyleState.surface;
  const toolApprovalSurfaceColors = toolApprovalStyleState.colors;
  const mobileMessageThreadStyleState = threadChromeStyleState.messageThread;
  const mobileMessageStyleState = mobileMessageThreadStyleState.message;
  const mobileMessageSurface = mobileMessageStyleState.surface;
  const mobileMessageContentLayout = mobileMessageStyleState.contentLayout;
  const mobileMessageCollapsedPreview = mobileMessageStyleState.collapsedPreview;
  const mobileMessageCollapsedPreviewColors = mobileMessageStyleState.colors.collapsedPreview;
  const mobileMessageToneColors = mobileMessageStyleState.colors.tones;
  const toolExecutionDetailStyleColors = toolExecutionDetailStyleState.colors;
  const toolPayloadPreviewColors = toolExecutionDetailStyleColors.payloadPreview;
  const toolDetailCopyButtonColors = toolExecutionDetailStyleColors.copyButton;
  const toolResultBadgeSuccessColors = toolExecutionDetailStyleColors.badge.success;
  const toolResultBadgeErrorColors = toolExecutionDetailStyleColors.badge.error;
  const toolResultErrorColors = toolExecutionDetailStyleColors.error;
  const toolExecutionDetailContentColors = toolExecutionDetailStyleColors.content;
  const headerTurnDurationStyleState = headerChromeStyleState.turnDuration.standard;
  const headerTurnDurationLiveStyleState = headerChromeStyleState.turnDuration.live;
  const headerTurnDurationBadge = headerTurnDurationStyleState.badge;
  const headerTurnDurationLiveBadge = headerTurnDurationLiveStyleState.badge;
  const headerTurnDurationColors = headerTurnDurationStyleState.colors;
  const headerTurnDurationLiveColors = headerTurnDurationLiveStyleState.colors;
  const mobileMessageActionStyleState = mobileMessageThreadStyleState.action;
  const mobileMessageActionRow = mobileMessageActionStyleState.row;
  const mobileMessageActionButton = mobileMessageActionStyleState.buttons.standard.button;
  const mobileMessageBranchButton = mobileMessageActionStyleState.buttons.branch.button;
  const mobileMessageSpeechButton = mobileMessageActionStyleState.buttons.speech.button;
  const mobileMessageActionButtonColors = mobileMessageActionStyleState.buttons.standard.colors;
  const mobileMessageBranchButtonColors = mobileMessageActionStyleState.buttons.branch.colors;
  const mobileMessageCopiedButtonColors = mobileMessageActionStyleState.buttons.copied.colors;
  const mobileMessageSpeechButtonColors = mobileMessageActionStyleState.buttons.speech.colors;
  const mobileMessageSpeechActiveButtonColors = mobileMessageActionStyleState.buttons.speechActive.colors;
  const mobileMessageTurnDurationRenderState = mobileMessageThreadStyleState.turnDuration.standard;
  const mobileMessageTurnDurationLiveRenderState = mobileMessageThreadStyleState.turnDuration.live;
  const mobileMessageTurnDurationBadge = mobileMessageTurnDurationRenderState.badge;
  const mobileMessageTurnDurationLiveBadge = mobileMessageTurnDurationLiveRenderState.badge;
  const mobileMessageTurnDurationBadgeColors = mobileMessageTurnDurationRenderState.colors;
  const mobileMessageTurnDurationLiveBadgeColors = mobileMessageTurnDurationLiveRenderState.colors;
  const toolExecutionStatusColors = compactToolExecutionStyleState.statusColors;
  const toolExecutionDetailColorsByState = toolExecutionDetailStyleColors.byState;
  return StyleSheet.create({
    keyboardAvoidingContainer: {
      flex: viewportSurface.flex,
      backgroundColor: viewportSurfaceColors.backgroundColor,
    },
    chatRoot: {
      flex: viewportSurface.flex,
    },
    chatScroll: {
      flex: viewportSurface.flex,
      paddingHorizontal: spacing[viewportSurface.paddingHorizontal],
      paddingVertical: spacing[viewportSurface.paddingVertical],
      backgroundColor: viewportSurfaceColors.backgroundColor,
    },
    chatScrollContent: {
      gap: spacing[viewportSurface.contentGap],
    },
    loadingState: {
      flex: loadingStateSurface.flex,
      justifyContent: loadingStateSurface.justifyContent,
      alignItems: loadingStateSurface.alignItems,
      paddingVertical: loadingStateSurface.paddingVertical,
    },
    loadingSpinner: {
      width: loadingStateSurface.spinnerSize,
      height: loadingStateSurface.spinnerSize,
    },
    inlineActivityIndicator: {
      flexDirection: inlineActivitySurface.flexDirection,
      alignItems: inlineActivitySurface.alignItems,
    },
    inlineActivitySpinner: {
      width: inlineActivitySurface.spinnerSize,
      height: inlineActivitySurface.spinnerSize,
    },
    streamingContentHeader: {
      flexDirection: streamingContentSurface.headerFlexDirection,
      alignItems: streamingContentSurface.headerAlignItems,
      gap: spacing[streamingContentSurface.headerGap],
      marginBottom: spacing[streamingContentSurface.headerMarginBottom],
    },
    streamingContentTitle: {
      minWidth: streamingContentSurface.titleMinWidth,
      flexShrink: streamingContentSurface.titleFlexShrink,
      color: streamingContentSurfaceColors.title.color,
      fontSize: streamingContentSurface.titleFontSize,
      fontWeight: streamingContentSurface.titleFontWeight,
    },
    streamingContentSpinner: {
      width: streamingContentSpinnerSize,
      height: streamingContentSpinnerSize,
    },
    streamingContentBadge: {
      marginLeft: streamingContentSurface.badgeMarginLeft,
      paddingHorizontal: spacing[streamingContentSurface.badgePaddingHorizontal],
      paddingVertical: streamingContentSurface.badgePaddingVertical,
      borderRadius: radius[streamingContentSurface.badgeBorderRadius],
      backgroundColor: streamingContentSurfaceColors.badge.backgroundColor,
    },
    streamingContentBadgeText: {
      color: streamingContentSurfaceColors.badgeText.color,
      fontSize: streamingContentSurface.badgeTextFontSize,
      fontWeight: streamingContentSurface.badgeTextFontWeight,
    },
    streamingContentBodyRow: {
      flexDirection: streamingContentSurface.bodyRowFlexDirection,
      alignItems: streamingContentSurface.bodyRowAlignItems,
      minWidth: streamingContentSurface.bodyRowMinWidth,
    },
    streamingContentText: {
      flex: streamingContentSurface.textFlex,
      minWidth: streamingContentSurface.textMinWidth,
      color: streamingContentSurfaceColors.text.color,
      fontSize: streamingContentSurface.textFontSize,
      lineHeight: streamingContentSurface.textLineHeight,
    },
    streamingContentCaret: {
      width: streamingContentSurface.caretWidth,
      height: streamingContentSurface.caretHeight,
      marginLeft: streamingContentSurface.caretMarginLeft,
      borderRadius: streamingContentSurface.caretBorderRadius,
      backgroundColor: streamingContentSurfaceColors.caret.backgroundColor,
    },
    messageQueuePanelWrapper: {
      paddingHorizontal: spacing[messageQueuePanelWrapper.paddingHorizontal],
      paddingTop: spacing[messageQueuePanelWrapper.paddingTop],
    },
    headerAgentSelectorButton: {
      alignItems: headerSurface.agentSelectorButton.alignItems,
      justifyContent: headerSurface.agentSelectorButton.justifyContent,
      height: headerSurface.agentSelectorButton.height,
      minHeight: headerSurface.agentSelectorButton.minHeight,
    },
    headerAgentSelectorChip: {
      flexDirection: headerSurface.agentSelectorChip.flexDirection,
      alignItems: headerSurface.agentSelectorChip.alignItems,
      backgroundColor: headerAgentSelectorColors.chip.backgroundColor,
      maxWidth: headerSurface.agentSelectorChip.maxWidth,
      paddingHorizontal: headerSurface.agentSelectorChip.paddingHorizontal,
      paddingVertical: headerSurface.agentSelectorChip.paddingVertical,
      borderRadius: headerSurface.agentSelectorChip.borderRadius,
      gap: headerSurface.agentSelectorChip.gap,
    },
    headerAgentSelectorText: {
      fontSize: headerSurface.agentSelectorText.fontSize,
      color: headerAgentSelectorColors.text.color,
      fontWeight: headerSurface.agentSelectorText.fontWeight,
    },
    headerActionsRow: {
      flexDirection: headerSurface.actionsRow.flexDirection,
      alignItems: headerSurface.actionsRow.alignItems,
      gap: headerSurface.actionsRow.gap,
    },
    headerConversationChip: {
      flexDirection: sessionStatusSurface.chip.flexDirection,
      alignItems: sessionStatusSurface.chip.alignItems,
      gap: sessionStatusSurface.chip.gap,
      borderWidth: sessionStatusSurface.chip.borderWidth,
      borderRadius: sessionStatusSurface.chip.borderRadius,
      paddingHorizontal: sessionStatusSurface.chip.paddingHorizontal,
      paddingVertical: sessionStatusSurface.chip.paddingVertical,
      marginHorizontal: sessionStatusSurface.chip.marginHorizontal,
    },
    headerConversationChipText: {
      fontSize: sessionStatusSurface.chipText.fontSize,
      lineHeight: sessionStatusSurface.chipText.lineHeight,
      fontWeight: sessionStatusSurface.chipText.fontWeight,
    },
    headerConversationSpinner: {
      width: sessionStatusSurface.runningIndicator.size,
      height: sessionStatusSurface.runningIndicator.size,
    },
    headerDurationChip: {
      flexDirection: headerTurnDurationBadge.flexDirection,
      alignItems: headerTurnDurationBadge.alignItems,
      justifyContent: headerTurnDurationBadge.justifyContent,
      gap: headerTurnDurationBadge.gap,
      minHeight: headerTurnDurationBadge.minHeight,
      maxWidth: headerTurnDurationBadge.maxWidth,
      paddingHorizontal: headerTurnDurationBadge.paddingHorizontal,
      borderRadius: headerTurnDurationBadge.borderRadius,
      backgroundColor: headerTurnDurationColors.chip.backgroundColor,
      marginHorizontal: headerTurnDurationBadge.marginHorizontal,
      flexShrink: headerTurnDurationBadge.flexShrink,
      opacity: headerTurnDurationBadge.opacity,
    } as const,
    headerDurationChipLive: {
      backgroundColor: headerTurnDurationLiveColors.chip.backgroundColor,
      opacity: headerTurnDurationLiveBadge.opacity,
    } as const,
    headerDurationChipText: {
      fontFamily: resolveMobileFontFamily(headerTurnDurationBadge.fontFamilyByPlatform),
      fontSize: headerTurnDurationBadge.fontSize,
      lineHeight: headerTurnDurationBadge.lineHeight,
      fontWeight: headerTurnDurationBadge.fontWeight,
      color: headerTurnDurationColors.text.color,
    },
    headerDurationChipTextLive: {
      color: headerTurnDurationLiveColors.text.color,
    },
    headerActionButton,
    headerEdgeActionButton,
    headerPinButton: {
      ...headerPinButton,
      borderRadius: radius[headerSurface.pinButton.borderRadius],
      borderWidth: headerSurface.pinButton.borderWidth,
      borderColor: inactiveHeaderPinButtonColors.button.borderColor,
      backgroundColor: inactiveHeaderPinButtonColors.button.backgroundColor,
    },
    headerPinButtonActive: {
      borderColor: activeHeaderPinButtonColors.button.borderColor,
      backgroundColor: activeHeaderPinButtonColors.button.backgroundColor,
    },
    headerKillSwitchIconContainer: {
      width: headerSurface.killSwitchButton.size,
      height: headerSurface.killSwitchButton.size,
      borderRadius: headerSurface.killSwitchButton.borderRadius,
      backgroundColor: headerKillSwitchButtonColors.button.backgroundColor,
      alignItems: headerSurface.killSwitchButton.alignItems,
      justifyContent: headerSurface.killSwitchButton.justifyContent,
    },
    headerHandsFreeIconContainer: {
      width: headerSurface.handsFreeButton.size,
      height: headerSurface.handsFreeButton.size,
      alignItems: headerSurface.handsFreeButton.alignItems,
      justifyContent: headerSurface.handsFreeButton.justifyContent,
    },
    loadOlderContainer: {
      flexDirection: messageHistoryBannerSurface.flexDirection,
      flexWrap: messageHistoryBannerSurface.flexWrap,
      justifyContent: messageHistoryBannerSurface.justifyContent,
      alignItems: messageHistoryBannerSurface.alignItems,
      gap: spacing[messageHistoryBannerSurface.gap],
      paddingVertical: spacing[messageHistoryBannerSurface.paddingVertical],
    },
    loadOlderText: {
      color: messageHistoryBannerSurfaceColors.summary.color,
      fontSize: messageHistoryBannerSurface.summaryFontSize,
      lineHeight: messageHistoryBannerSurface.summaryLineHeight,
      textAlign: messageHistoryBannerSurface.textAlign,
    },
    loadOlderButton: {
      flexDirection: messageHistoryBannerSurface.loadButton.flexDirection,
      alignItems: messageHistoryBannerSurface.loadButton.alignItems,
      justifyContent: messageHistoryBannerSurface.loadButton.justifyContent,
      gap: spacing[messageHistoryBannerSurface.loadButton.gap],
      paddingHorizontal: spacing[messageHistoryBannerSurface.loadButton.paddingHorizontal],
      paddingVertical: messageHistoryBannerSurface.loadButton.paddingVertical,
      borderRadius: radius[messageHistoryBannerSurface.loadButton.borderRadius],
      borderWidth: messageHistoryBannerSurface.loadButton.borderWidth,
      borderColor: messageHistoryBannerSurfaceColors.loadButton.borderColor,
      backgroundColor: messageHistoryBannerSurfaceColors.loadButton.backgroundColor,
    },
    loadOlderButtonPressed: {
      opacity: messageHistoryLoadButtonPressedOpacity,
    },
    loadOlderButtonText: {
      color: messageHistoryBannerSurfaceColors.loadButton.color,
      fontSize: messageHistoryBannerSurface.loadButton.fontSize,
      fontWeight: messageHistoryBannerSurface.loadButton.fontWeight,
    },
    // Compact desktop-style messages: full-width role cards with shared tone semantics.
    msg: {
      paddingHorizontal: spacing[mobileMessageSurface.paddingHorizontal],
      paddingVertical: spacing[mobileMessageSurface.paddingVertical],
      marginBottom: spacing[mobileMessageSurface.marginBottom],
      width: mobileMessageSurface.width,
      borderWidth: theme[mobileMessageSurface.borderWidth],
      borderRadius: radius[mobileMessageSurface.borderRadius],
    },
    user: mobileMessageToneColors.user,
    assistant: mobileMessageToneColors.assistant,
    assistantFinal: mobileMessageToneColors.assistant_final,
    tool: mobileMessageToneColors.tool,
    retryStatusCard: {
      gap: spacing[retryStatusSurface.gap],
      padding: spacing[retryStatusSurface.padding],
      borderRadius: radius[retryStatusSurface.borderRadius],
      borderWidth: retryStatusSurface.borderWidth,
      borderColor: retryStatusSurfaceColors.card.borderColor,
      backgroundColor: retryStatusSurfaceColors.card.backgroundColor,
    },
    retryStatusHeader: {
      flexDirection: retryStatusSurface.headerFlexDirection,
      alignItems: retryStatusSurface.headerAlignItems,
      gap: spacing[retryStatusSurface.headerGap],
    },
    retryStatusTitle: {
      flex: retryStatusSurface.titleFlex,
      minWidth: retryStatusSurface.titleMinWidth,
      color: retryStatusSurfaceColors.title.color,
      fontSize: retryStatusSurface.titleFontSize,
      fontWeight: retryStatusSurface.titleFontWeight,
    },
    retryStatusMetaRow: {
      flexDirection: retryStatusSurface.metaFlexDirection,
      flexWrap: retryStatusSurface.metaFlexWrap,
      alignItems: retryStatusSurface.metaAlignItems,
      gap: spacing[retryStatusSurface.metaGap],
      marginTop: retryStatusSurface.metaMarginTop,
    },
    retryStatusAttempt: {
      color: retryStatusSurfaceColors.attempt.color,
      fontSize: retryStatusSurface.attemptFontSize,
    },
    retryStatusCountdown: {
      color: retryStatusSurfaceColors.countdown.color,
      fontSize: retryStatusSurface.countdownFontSize,
      fontWeight: retryStatusSurface.countdownFontWeight,
      paddingHorizontal: spacing[retryStatusSurface.countdownPaddingHorizontal],
      paddingVertical: retryStatusSurface.countdownPaddingVertical,
      borderRadius: radius[retryStatusSurface.countdownBorderRadius],
      backgroundColor: retryStatusSurfaceColors.countdown.backgroundColor,
      overflow: retryStatusSurface.countdownOverflow,
    },
    retryStatusDescription: {
      color: retryStatusSurfaceColors.description.color,
      fontSize: retryStatusSurface.descriptionFontSize,
      lineHeight: retryStatusSurface.descriptionLineHeight,
      marginTop: retryStatusSurface.descriptionMarginTop,
    },
    stepSummaryCard: {
      gap: spacing[stepSummarySurface.gap],
      padding: spacing[stepSummarySurface.padding],
      borderRadius: radius[stepSummarySurface.borderRadius],
      borderWidth: stepSummarySurface.borderWidth,
      borderColor: stepSummarySurfaceColors.card.borderColor,
      backgroundColor: stepSummarySurfaceColors.card.backgroundColor,
    },
    stepSummaryHeader: {
      flexDirection: stepSummarySurface.headerFlexDirection,
      alignItems: stepSummarySurface.headerAlignItems,
      gap: spacing[stepSummarySurface.headerGap],
      minWidth: stepSummarySurface.headerMinWidth,
    },
    stepSummaryTitle: {
      flexShrink: stepSummarySurface.titleFlexShrink,
      minWidth: stepSummarySurface.titleMinWidth,
      color: stepSummarySurfaceColors.title.color,
      fontSize: stepSummarySurface.titleFontSize,
      fontWeight: stepSummarySurface.titleFontWeight,
    },
    stepSummaryBadge: {
      marginLeft: stepSummarySurface.badgeMarginLeft,
      maxWidth: stepSummarySurface.badgeMaxWidth,
      paddingHorizontal: spacing[stepSummarySurface.badgePaddingHorizontal],
      paddingVertical: stepSummarySurface.badgePaddingVertical,
      borderRadius: radius[stepSummarySurface.badgeBorderRadius],
      backgroundColor: stepSummarySurfaceColors.badge.backgroundColor,
    },
    stepSummaryBadgeText: {
      color: stepSummarySurfaceColors.badgeText.color,
      fontSize: stepSummarySurface.badgeTextFontSize,
      fontWeight: stepSummarySurface.badgeTextFontWeight,
    },
    stepSummaryAction: {
      color: stepSummarySurfaceColors.action.color,
      fontSize: stepSummarySurface.actionFontSize,
      lineHeight: stepSummarySurface.actionLineHeight,
      fontWeight: stepSummarySurface.actionFontWeight,
    },
    stepSummaryMeta: {
      color: stepSummarySurfaceColors.meta.color,
      fontSize: stepSummarySurface.metaFontSize,
      lineHeight: stepSummarySurface.metaLineHeight,
    },
    stepSummaryPreview: {
      color: stepSummarySurfaceColors.preview.color,
      fontSize: stepSummarySurface.previewFontSize,
      lineHeight: stepSummarySurface.previewLineHeight,
      marginTop: stepSummarySurface.previewMarginTop,
    },
    delegationCard: {
      gap: spacing[delegationCardSurface.gap],
      padding: spacing[delegationCardSurface.padding],
      borderRadius: radius[delegationCardSurface.borderRadius],
      borderWidth: delegationCardSurface.borderWidth,
      borderColor: delegationCardSurfaceColors.card.borderColor,
      backgroundColor: delegationCardSurfaceColors.card.backgroundColor,
    },
    delegationHeader: {
      flexDirection: delegationCardSurface.headerFlexDirection,
      alignItems: delegationCardSurface.headerAlignItems,
      gap: spacing[delegationCardSurface.headerGap],
      minWidth: delegationCardSurface.headerMinWidth,
    },
    delegationTitle: {
      flex: delegationCardSurface.titleFlex,
      minWidth: delegationCardSurface.titleMinWidth,
      color: delegationCardSurfaceColors.title.color,
      fontSize: delegationCardSurface.titleFontSize,
      fontWeight: delegationCardSurface.titleFontWeight,
    },
    delegationStatusBadge: {
      flexShrink: delegationCardSurface.statusFlexShrink,
      borderWidth: delegationCardSurface.statusBorderWidth,
      borderRadius: radius[delegationCardSurface.statusBorderRadius],
      paddingHorizontal: spacing[delegationCardSurface.statusPaddingHorizontal],
      paddingVertical: delegationCardSurface.statusPaddingVertical,
    },
    delegationStatusText: {
      fontSize: delegationCardSurface.statusFontSize,
      fontWeight: delegationCardSurface.statusFontWeight,
    },
    delegationLiveText: {
      color: delegationCardSurfaceColors.liveText.color,
      fontSize: delegationCardSurface.metaFontSize,
      lineHeight: delegationCardSurface.metaLineHeight,
      fontWeight: delegationCardSurface.statusFontWeight,
    },
    delegationSubtitle: {
      color: delegationCardSurfaceColors.subtitle.color,
      fontSize: delegationCardSurface.subtitleFontSize,
      lineHeight: delegationCardSurface.subtitleLineHeight,
    },
    delegationMetaRow: {
      flexDirection: delegationCardSurface.metaFlexDirection,
      flexWrap: delegationCardSurface.metaFlexWrap,
      alignItems: delegationCardSurface.metaAlignItems,
      gap: spacing[delegationCardSurface.metaGap],
    },
    delegationMetaText: {
      color: delegationCardSurfaceColors.meta.color,
      fontSize: delegationCardSurface.metaFontSize,
      lineHeight: delegationCardSurface.metaLineHeight,
    },
    delegationConversationPreview: {
      gap: delegationCardSurface.conversationPreviewGap,
      marginTop: delegationCardSurface.conversationPreviewMarginTop,
      paddingHorizontal: spacing[delegationCardSurface.conversationPreviewPaddingHorizontal],
      paddingVertical: delegationCardSurface.conversationPreviewPaddingVertical,
      borderRadius: radius[delegationCardSurface.conversationPreviewBorderRadius],
      borderWidth: delegationCardSurface.conversationPreviewBorderWidth,
      borderColor: delegationCardSurfaceColors.conversationPreview.borderColor,
      backgroundColor: delegationCardSurfaceColors.conversationPreview.backgroundColor,
    },
    delegationConversationPreviewLine: {
      flexDirection: delegationCardSurface.conversationPreviewLineFlexDirection,
      alignItems: delegationCardSurface.conversationPreviewLineAlignItems,
      gap: spacing[delegationCardSurface.conversationPreviewLineGap],
      minWidth: delegationCardSurface.conversationPreviewLineMinWidth,
    },
    delegationConversationPreviewRole: {
      minWidth: delegationCardSurface.conversationPreviewRoleMinWidth,
      maxWidth: delegationCardSurface.conversationPreviewRoleMaxWidth,
      paddingHorizontal: spacing[delegationCardSurface.conversationPreviewRolePaddingHorizontal],
      paddingVertical: delegationCardSurface.conversationPreviewRolePaddingVertical,
      borderRadius: radius[delegationCardSurface.conversationPreviewRoleBorderRadius],
      borderWidth: delegationCardSurface.conversationPreviewRoleBorderWidth,
      overflow: delegationCardSurface.conversationPreviewRoleOverflow,
      fontSize: delegationCardSurface.conversationPreviewRoleFontSize,
      fontWeight: delegationCardSurface.conversationPreviewRoleFontWeight,
    },
    delegationConversationPreviewContent: {
      flex: delegationCardSurface.conversationPreviewContentFlex,
      minWidth: delegationCardSurface.conversationPreviewContentMinWidth,
      color: delegationCardSurfaceColors.conversationPreviewContent.color,
      fontSize: delegationCardSurface.conversationPreviewContentFontSize,
      lineHeight: delegationCardSurface.conversationPreviewContentLineHeight,
    },
    delegationConversationPreviewTimestamp: {
      flexShrink: delegationCardSurface.conversationPreviewTimestampFlexShrink,
      color: delegationCardSurfaceColors.conversationPreviewTimestamp.color,
      fontSize: delegationCardSurface.conversationPreviewTimestampFontSize,
    },
    delegationConversationPreviewMoreButton: {
      alignSelf: delegationCardSurface.conversationPreviewMoreButtonAlignSelf,
    },
    delegationConversationPreviewMoreButtonPressed: {
      opacity: delegationCardSurface.conversationPreviewMoreButtonPressedOpacity,
    },
    delegationConversationPreviewMore: {
      color: delegationCardSurfaceColors.conversationPreviewMore.color,
      fontSize: delegationCardSurface.conversationPreviewMoreFontSize,
      fontWeight: delegationCardSurface.conversationPreviewMoreFontWeight,
    },
    delegationToolPreview: {
      gap: delegationCardSurface.toolPreviewGap,
      marginTop: delegationCardSurface.toolPreviewMarginTop,
      paddingHorizontal: spacing[delegationCardSurface.toolPreviewPaddingHorizontal],
      paddingVertical: delegationCardSurface.toolPreviewPaddingVertical,
      borderRadius: radius[delegationCardSurface.toolPreviewBorderRadius],
      borderWidth: delegationCardSurface.toolPreviewBorderWidth,
      borderColor: delegationCardSurfaceColors.toolPreview.borderColor,
      backgroundColor: delegationCardSurfaceColors.toolPreview.backgroundColor,
    },
    delegationToolPreviewLabel: {
      color: delegationCardSurfaceColors.toolPreviewLabel.color,
      fontSize: delegationCardSurface.toolPreviewLabelFontSize,
      fontWeight: delegationCardSurface.toolPreviewLabelFontWeight,
    },
    delegationToolPreviewLine: {
      flexDirection: delegationCardSurface.toolPreviewLineFlexDirection,
      alignItems: delegationCardSurface.toolPreviewLineAlignItems,
      gap: spacing[delegationCardSurface.toolPreviewLineGap],
      minWidth: delegationCardSurface.toolPreviewLineMinWidth,
    },
    delegationToolPreviewStatusIcon: {
      width: compactToolExecution.statusIcon.width,
      minWidth: delegationCardSurface.toolPreviewStatusMinWidth,
      alignItems: delegationCardSurface.toolPreviewStatusAlignItems,
      justifyContent: delegationCardSurface.toolPreviewStatusJustifyContent,
      flexShrink: delegationCardSurface.toolPreviewStatusFlexShrink,
    },
    delegationToolPreviewName: {
      flex: delegationCardSurface.toolPreviewNameFlex,
      minWidth: delegationCardSurface.toolPreviewNameMinWidth,
      color: delegationCardSurfaceColors.toolPreviewName.color,
      fontSize: delegationCardSurface.toolPreviewNameFontSize,
    },
    delegationToolPreviewMoreButton: {
      alignSelf: delegationCardSurface.toolPreviewMoreButtonAlignSelf,
    },
    delegationToolPreviewMoreButtonPressed: {
      opacity: delegationCardSurface.toolPreviewMoreButtonPressedOpacity,
    },
    delegationToolPreviewMore: {
      color: delegationCardSurfaceColors.toolPreviewMore.color,
      fontSize: delegationCardSurface.toolPreviewMoreFontSize,
      fontWeight: delegationCardSurface.toolPreviewMoreFontWeight,
    },
    inputArea: {
      borderTopWidth: theme[inputAreaSurface.borderTopWidthToken],
      borderColor: mobileComposerSurfaceColors.inputArea.borderColor,
      backgroundColor: mobileComposerSurfaceColors.inputArea.backgroundColor,
    },
    pendingImagesRow: {
      paddingHorizontal: spacing[imageAttachmentSurface.row.paddingHorizontal],
      paddingTop: spacing[imageAttachmentSurface.row.paddingTop],
      paddingBottom: imageAttachmentSurface.row.paddingBottom,
      gap: spacing[imageAttachmentSurface.row.gap],
    },
    pendingImageCard: {
      width: imageAttachmentSurface.preview.size,
      height: imageAttachmentSurface.preview.size,
      borderRadius: radius[imageAttachmentSurface.preview.borderRadius],
      borderWidth: imageAttachmentSurface.preview.borderWidth,
      borderColor: imageAttachmentSurfaceColors.preview.borderColor,
      overflow: imageAttachmentSurface.preview.overflow,
      backgroundColor: imageAttachmentSurfaceColors.preview.backgroundColor,
      position: imageAttachmentSurface.preview.position,
    },
    pendingImagePreview: {
      width: imageAttachmentSurface.previewImage.width,
      height: imageAttachmentSurface.previewImage.height,
    },
    pendingImageRemoveButton: {
      position: imageAttachmentSurface.removeButton.position,
      top: imageAttachmentSurface.removeButton.top,
      right: imageAttachmentSurface.removeButton.right,
      width: imageAttachmentSurface.removeButton.size,
      height: imageAttachmentSurface.removeButton.size,
      borderRadius: imageAttachmentSurface.removeButton.borderRadius,
      backgroundColor: imageAttachmentSurfaceColors.removeButton.backgroundColor,
      alignItems: imageAttachmentSurface.removeButton.alignItems,
      justifyContent: imageAttachmentSurface.removeButton.justifyContent,
    },
    sttPreviewBox: {
      marginHorizontal: spacing[sttPreviewSurface.marginHorizontal],
      marginTop: spacing[sttPreviewSurface.marginTop],
      borderWidth: sttPreviewSurface.borderWidth,
      borderColor: mobileComposerSurfaceColors.sttPreview.borderColor,
      backgroundColor: mobileComposerSurfaceColors.sttPreview.backgroundColor,
      borderRadius: radius[sttPreviewSurface.borderRadius],
      paddingHorizontal: spacing[sttPreviewSurface.paddingHorizontal],
      paddingVertical: spacing[sttPreviewSurface.paddingVertical],
    },
    sttPreviewLabel: {
      color: mobileComposerTextColors.sttPreview.labelColor,
      marginBottom: sttPreviewSurface.labelMarginBottom,
      fontSize: sttPreviewSurface.labelFontSize,
      lineHeight: sttPreviewSurface.labelLineHeight,
      fontWeight: sttPreviewSurface.labelFontWeight,
    },
    sttPreviewText: {
      color: mobileComposerTextColors.sttPreview.textColor,
      fontSize: sttPreviewSurface.textFontSize,
      lineHeight: sttPreviewSurface.textLineHeight,
    },
    inputRow: {
      flexDirection: composerSurface.inputRow.flexDirection,
      alignItems: composerSurface.inputRow.alignItems,
      gap: spacing[composerSurface.inputRow.gap],
      paddingHorizontal: spacing[composerSurface.inputRow.paddingHorizontal],
      paddingVertical: spacing[composerSurface.inputRow.paddingVertical],
    },
    handsFreeStatusRow: {
      paddingHorizontal: spacing[handsFreeSurface.statusRow.paddingHorizontal],
      paddingTop: spacing[handsFreeSurface.statusRow.paddingTop],
    },
    handsFreeControlsRow: {
      flexDirection: handsFreeSurface.controlsRow.flexDirection,
      alignItems: handsFreeSurface.controlsRow.alignItems,
      gap: spacing[handsFreeSurface.controlsRow.gap],
      paddingHorizontal: spacing[handsFreeSurface.controlsRow.paddingHorizontal],
      paddingTop: spacing[handsFreeSurface.controlsRow.paddingTop],
    },
    handsFreeControlButton: {
      flex: handsFreeSurface.controlButton.flex,
      borderWidth: handsFreeSurface.controlButton.borderWidth,
      borderColor: handsFreeSurfaceColors.controlButton.borderColor,
      backgroundColor: handsFreeSurfaceColors.controlButton.backgroundColor,
      minHeight: handsFreeSurface.controlButton.minHeight,
      paddingHorizontal: spacing[handsFreeSurface.controlButton.paddingHorizontal],
      borderRadius: radius[handsFreeSurface.controlButton.borderRadius],
      alignItems: handsFreeSurface.controlButton.alignItems,
      justifyContent: handsFreeSurface.controlButton.justifyContent,
    },
    handsFreeControlButtonText: {
      color: handsFreeSurfaceColors.controlButtonText.color,
      fontWeight: handsFreeSurface.controlButtonText.fontWeight,
      fontSize: handsFreeSurface.controlButtonText.fontSize,
    },
    chatHomeCard: {
      marginHorizontal: spacing[promptLibrarySurface.quickStartCard.marginHorizontal],
      marginTop: spacing[promptLibrarySurface.quickStartCard.marginTop],
      padding: spacing[promptLibrarySurface.quickStartCard.padding],
      borderRadius: radius[promptLibrarySurface.quickStartCard.borderRadius],
      borderWidth: promptLibrarySurface.quickStartCard.borderWidth,
      borderColor: promptLibrarySurfaceColors.quickStartCard.borderColor,
      backgroundColor: promptLibrarySurfaceColors.quickStartCard.backgroundColor,
      gap: spacing[promptLibrarySurface.quickStartCard.gap],
    },
    chatHomeEmptyText: {
      color: promptLibrarySurfaceColors.emptyText.color,
      fontSize: promptLibrarySurface.emptyText.fontSize,
      lineHeight: promptLibrarySurface.emptyText.lineHeight,
      textAlign: promptLibrarySurface.emptyText.textAlign,
      paddingVertical: spacing[promptLibrarySurface.emptyText.paddingVertical],
    },
    chatHomeShortcutGrid: {
      flexDirection: promptLibrarySurface.shortcutGrid.flexDirection,
      flexWrap: promptLibrarySurface.shortcutGrid.flexWrap,
      gap: spacing[promptLibrarySurface.shortcutGrid.gap],
    },
    chatHomeShortcutCard: {
      minHeight: promptLibrarySurface.shortcutCard.minHeight,
      minWidth: promptLibrarySurface.shortcutCard.minWidth,
      flexGrow: promptLibrarySurface.shortcutCard.flexGrow,
      flexBasis: promptLibrarySurface.shortcutCard.flexBasis,
      paddingHorizontal: spacing[promptLibrarySurface.shortcutCard.paddingHorizontal],
      paddingVertical: spacing[promptLibrarySurface.shortcutCard.paddingVertical],
      borderRadius: radius[promptLibrarySurface.shortcutCard.borderRadius],
      borderWidth: promptLibrarySurface.shortcutCard.borderWidth,
      borderColor: promptLibrarySurfaceColors.shortcutCard.borderColor,
      backgroundColor: promptLibrarySurfaceColors.shortcutCard.backgroundColor,
      justifyContent: promptLibrarySurface.shortcutCard.justifyContent,
      gap: spacing[promptLibrarySurface.shortcutCard.gap],
    },
    chatHomeShortcutCardAdd: {
      borderStyle: promptLibrarySurface.addShortcutCard.borderStyle,
      borderColor: promptLibrarySurfaceColors.addShortcutCard.borderColor,
      backgroundColor: promptLibrarySurfaceColors.addShortcutCard.backgroundColor,
      alignItems: promptLibrarySurface.addShortcutCard.alignItems,
    },
    chatHomeShortcutAddIcon: {
      marginBottom: promptLibrarySurface.addShortcutIcon.marginBottom,
    },
    chatHomeShortcutCardDisabled: {
      opacity: promptLibrarySurface.shortcutCard.disabledOpacity,
    },
    chatHomeShortcutCardPressed: {
      opacity: promptLibrarySurface.shortcutCard.pressedOpacity,
      transform: [{ scale: promptLibrarySurface.shortcutCard.pressedScale }],
    },
    chatHomeShortcutSourcePill: {
      alignSelf: promptLibrarySurface.shortcutSourcePill.alignSelf,
      flexDirection: promptLibrarySurface.shortcutSourcePill.flexDirection,
      alignItems: promptLibrarySurface.shortcutSourcePill.alignItems,
      gap: spacing[promptLibrarySurface.shortcutSourcePill.gap],
      paddingHorizontal: spacing[promptLibrarySurface.shortcutSourcePill.paddingHorizontal],
      paddingVertical: promptLibrarySurface.shortcutSourcePill.paddingVertical,
      borderRadius: radius[promptLibrarySurface.shortcutSourcePill.borderRadius],
      backgroundColor: promptLibrarySurfaceColors.shortcutSourcePill.backgroundColor,
    },
    chatHomeShortcutSourceLabel: {
      color: promptLibrarySurfaceColors.shortcutSourceLabel.color,
      fontSize: promptLibrarySurface.shortcutSourceLabel.fontSize,
      fontWeight: promptLibrarySurface.shortcutSourceLabel.fontWeight,
      letterSpacing: promptLibrarySurface.shortcutSourceLabel.letterSpacing,
      textTransform: promptLibrarySurface.shortcutSourceLabel.textTransform,
    },
    chatHomeShortcutTitle: {
      color: promptLibrarySurfaceColors.shortcutTitle.color,
      fontSize: promptLibrarySurface.shortcutTitle.fontSize,
      lineHeight: promptLibrarySurface.shortcutTitle.lineHeight,
      fontWeight: promptLibrarySurface.shortcutTitle.fontWeight,
    },
    chatHomeShortcutTitleAdd: {
      color: promptLibrarySurfaceColors.addShortcutCard.titleColor,
      textAlign: promptLibrarySurface.addShortcutCard.titleTextAlign,
    },
    chatHomeShortcutDescription: {
      color: promptLibrarySurfaceColors.shortcutDescription.color,
      fontSize: promptLibrarySurface.shortcutDescription.fontSize,
      marginTop: promptLibrarySurface.shortcutDescription.marginTop,
      lineHeight: promptLibrarySurface.shortcutDescription.lineHeight,
    },
    chatHomeShortcutActions: {
      flexDirection: promptLibrarySurface.shortcutActions.flexDirection,
      flexWrap: promptLibrarySurface.shortcutActions.flexWrap,
      gap: spacing[promptLibrarySurface.shortcutActions.gap],
      marginTop: spacing[promptLibrarySurface.shortcutActions.marginTop],
    },
    chatHomeShortcutActionButton: {
      minHeight: promptLibrarySurface.shortcutActionButton.minHeight,
      paddingHorizontal: spacing[promptLibrarySurface.shortcutActionButton.paddingHorizontal],
      paddingVertical: promptLibrarySurface.shortcutActionButton.paddingVertical,
      borderRadius: radius[promptLibrarySurface.shortcutActionButton.borderRadius],
      borderWidth: promptLibrarySurface.shortcutActionButton.borderWidth,
      borderColor: promptLibrarySurfaceColors.shortcutActionButton.borderColor,
      backgroundColor: promptLibrarySurfaceColors.shortcutActionButton.backgroundColor,
      flexDirection: promptLibrarySurface.shortcutActionButton.flexDirection,
      alignItems: promptLibrarySurface.shortcutActionButton.alignItems,
      justifyContent: promptLibrarySurface.shortcutActionButton.justifyContent,
      gap: spacing[promptLibrarySurface.shortcutActionButton.gap],
    },
    chatHomeShortcutActionButtonPressed: {
      opacity: promptLibrarySurface.shortcutActionButton.pressedOpacity,
    },
    chatHomeShortcutActionText: {
      color: promptLibrarySurfaceColors.shortcutActionText.color,
      fontSize: promptLibrarySurface.shortcutActionText.fontSize,
      lineHeight: promptLibrarySurface.shortcutActionText.lineHeight,
      fontWeight: promptLibrarySurface.shortcutActionText.fontWeight,
    },
    chatHomeShortcutActionDangerText: {
      color: promptLibrarySurfaceColors.shortcutActionText.destructiveColor,
    },
    modalKeyboardAvoidingView: {
      flex: promptEditorModalSurface.keyboardAvoidingView.flex,
    },
    modalOverlay: {
      flex: promptEditorModalSurface.overlay.flex,
      backgroundColor: promptLibrarySurfaceColors.editorModal.overlay.backgroundColor,
      justifyContent: promptEditorModalSurface.overlay.justifyContent,
      padding: spacing[promptEditorModalSurface.overlay.padding],
    },
    modalContent: {
      backgroundColor: promptLibrarySurfaceColors.editorModal.content.backgroundColor,
      borderRadius: radius[promptEditorModalSurface.content.borderRadius],
      padding: spacing[promptEditorModalSurface.content.padding],
      borderWidth: promptEditorModalSurface.content.borderWidth,
      borderColor: promptLibrarySurfaceColors.editorModal.content.borderColor,
    },
    modalHeader: {
      flexDirection: promptEditorModalSurface.header.flexDirection,
      alignItems: promptEditorModalSurface.header.alignItems,
      justifyContent: promptEditorModalSurface.header.justifyContent,
      gap: spacing[promptEditorModalSurface.header.gap],
      marginBottom: spacing[promptEditorModalSurface.header.marginBottom],
    },
    modalTitle: {
      flex: promptEditorModalSurface.title.flex,
      fontSize: promptEditorModalSurface.title.fontSize,
      lineHeight: promptEditorModalSurface.title.lineHeight,
      fontWeight: promptEditorModalSurface.title.fontWeight,
      marginBottom: promptEditorModalSurface.title.marginBottom,
      color: promptLibrarySurfaceColors.editorModal.title.color,
    },
    modalCloseButton: {
      width: promptEditorModalSurface.closeButton.width,
      height: promptEditorModalSurface.closeButton.height,
      borderRadius: radius[promptEditorModalSurface.closeButton.borderRadius],
      alignItems: promptEditorModalSurface.closeButton.alignItems,
      justifyContent: promptEditorModalSurface.closeButton.justifyContent,
    },
    modalLabel: {
      fontSize: promptEditorModalSurface.label.fontSize,
      lineHeight: promptEditorModalSurface.label.lineHeight,
      fontWeight: promptEditorModalSurface.label.fontWeight,
      color: promptLibrarySurfaceColors.editorModal.label.color,
      marginBottom: spacing[promptEditorModalSurface.label.marginBottom],
    },
    modalInput: {
      borderWidth: promptEditorModalSurface.input.borderWidth,
      borderColor: promptLibrarySurfaceColors.editorModal.input.borderColor,
      borderRadius: radius[promptEditorModalSurface.input.borderRadius],
      paddingHorizontal: spacing[promptEditorModalSurface.input.paddingHorizontal],
      paddingVertical: promptEditorInputPaddingVertical,
      backgroundColor: promptLibrarySurfaceColors.editorModal.input.backgroundColor,
      marginBottom: spacing[promptEditorModalSurface.input.marginBottom],
      color: promptLibrarySurfaceColors.editorModal.input.color,
      fontSize: promptEditorModalSurface.input.fontSize,
    },
    modalInputMultiline: {
      height: promptEditorModalSurface.multilineInput.height,
      paddingTop: spacing[promptEditorModalSurface.multilineInput.paddingTop],
      paddingBottom: spacing[promptEditorModalSurface.multilineInput.paddingBottom],
    },
    modalActions: {
      flexDirection: promptEditorModalSurface.actions.flexDirection,
      justifyContent: promptEditorModalSurface.actions.justifyContent,
      gap: spacing[promptEditorModalSurface.actions.gap],
      marginTop: spacing[promptEditorModalSurface.actions.marginTop],
    },
    modalCancelButton: {
      paddingHorizontal: spacing[promptEditorModalSurface.cancelButton.paddingHorizontal],
      paddingVertical: spacing[promptEditorModalSurface.cancelButton.paddingVertical],
      borderRadius: radius[promptEditorModalSurface.cancelButton.borderRadius],
    },
    modalCancelButtonText: {
      color: promptLibrarySurfaceColors.editorModal.cancelButtonText.color,
      fontWeight: promptEditorModalSurface.actionText.fontWeight,
    },
    modalSaveButton: {
      paddingHorizontal: spacing[promptEditorModalSurface.saveButton.paddingHorizontal],
      paddingVertical: spacing[promptEditorModalSurface.saveButton.paddingVertical],
      borderRadius: radius[promptEditorModalSurface.saveButton.borderRadius],
      backgroundColor: promptLibrarySurfaceColors.editorModal.saveButton.backgroundColor,
      minWidth: promptEditorModalSurface.saveButton.minWidth,
      alignItems: promptEditorModalSurface.saveButton.alignItems,
    },
    modalSaveButtonDisabled: {
      opacity: promptEditorModalSurface.saveButton.disabledOpacity,
    },
    modalSaveButtonText: {
      color: promptLibrarySurfaceColors.editorModal.saveButtonText.color,
      fontWeight: promptEditorModalSurface.actionText.fontWeight,
    },
    input: {
      borderWidth: composerTextInputSurface.borderWidth,
      borderColor: mobileComposerSurfaceColors.input.borderColor,
      borderRadius: radius[composerTextInputSurface.borderRadius],
      paddingHorizontal: spacing[composerTextInputSurface.paddingHorizontal],
      paddingVertical: composerTextInputPlatform.paddingVertical,
      backgroundColor: mobileComposerSurfaceColors.input.backgroundColor,
      color: mobileComposerTextColors.input.color,
      fontSize: composerTextInputSurface.fontSize,
      flex: composerTextInputSurface.flex,
      maxHeight: composerTextInputSurface.maxHeight,
    },
    visuallyHiddenComposerHint: {
      position: composerSurface.visuallyHiddenComposerHint.position,
      left: composerSurface.visuallyHiddenComposerHint.left,
      width: composerSurface.visuallyHiddenComposerHint.width,
      height: composerSurface.visuallyHiddenComposerHint.height,
    },
    micWrapper: {
      paddingHorizontal: spacing[inputAreaSurface.micWrapperPaddingHorizontal],
      paddingBottom: spacing[inputAreaSurface.micWrapperPaddingBottom],
    },
    mic: {
      width: composerSurface.micButton.width,
      height: composerSurface.micButton.height,
      flexDirection: composerSurface.micButton.flexDirection,
      borderRadius: radius[composerSurface.micButton.borderRadius],
      borderWidth: composerSurface.micButton.borderWidth,
      borderColor: mobileComposerSurfaceColors.micButton.borderColor,
      backgroundColor: mobileComposerSurfaceColors.micButton.backgroundColor,
      alignItems: composerSurface.micButton.alignItems,
      justifyContent: composerSurface.micButton.justifyContent,
      gap: spacing[composerSurface.micButton.gap],
    },
    micOn: {
      backgroundColor: mobileComposerSurfaceColors.micButton.activeBackgroundColor,
      borderColor: mobileComposerSurfaceColors.micButton.activeBorderColor,
    },
    micLabel: {
      fontSize: composerSurface.micButton.labelFontSize,
      color: mobileComposerTextColors.micButton.color,
      fontWeight: composerSurface.micButton.labelFontWeight,
    },
    micLabelOn: {
      color: mobileComposerTextColors.micButton.activeColor,
    },
    ttsToggle: {
      width: composerSurface.accessoryButton.size,
      height: composerSurface.accessoryButton.size,
      borderRadius: composerSurface.accessoryButton.borderRadius,
      borderWidth: composerSurface.accessoryButton.borderWidth,
      borderColor: mobileComposerSurfaceColors.accessoryButton.borderColor,
      backgroundColor: mobileComposerSurfaceColors.accessoryButton.backgroundColor,
      alignItems: composerSurface.accessoryButton.alignItems,
      justifyContent: composerSurface.accessoryButton.justifyContent,
    },
    ttsToggleOn: {
      backgroundColor: mobileComposerSurfaceColors.accessoryButton.activeBackgroundColor,
      borderColor: mobileComposerSurfaceColors.accessoryButton.activeBorderColor,
    },
    sendButton: {
      backgroundColor: mobileComposerSurfaceColors.submitButton.backgroundColor,
      minHeight: composerSurface.submitButton.minHeight,
      minWidth: composerSurface.submitButton.minWidth,
      paddingHorizontal: spacing[composerSurface.submitButton.paddingHorizontal],
      paddingVertical: spacing[composerSurface.submitButton.paddingVertical],
      borderRadius: radius[composerSurface.submitButton.borderRadius],
      flexDirection: composerSurface.submitButton.flexDirection,
      alignItems: composerSurface.submitButton.alignItems,
      justifyContent: composerSurface.submitButton.justifyContent,
      gap: composerSurface.submitButton.gap,
    },
    queueButton: {
      borderWidth: composerSurface.queueButton.borderWidth,
      borderColor: mobileComposerSurfaceColors.queueButton.borderColor,
      backgroundColor: mobileComposerSurfaceColors.queueButton.backgroundColor,
      minHeight: composerSurface.submitButton.minHeight,
      minWidth: composerSurface.submitButton.minWidth,
      paddingHorizontal: spacing[composerSurface.submitButton.paddingHorizontal],
      paddingVertical: spacing[composerSurface.submitButton.paddingVertical],
      borderRadius: radius[composerSurface.submitButton.borderRadius],
      flexDirection: composerSurface.submitButton.flexDirection,
      alignItems: composerSurface.submitButton.alignItems,
      justifyContent: composerSurface.submitButton.justifyContent,
      gap: composerSurface.submitButton.gap,
    },
    sendButtonDisabled: {
      opacity: composerSurface.submitButton.disabledOpacity,
    },
    queueButtonText: {
      color: mobileComposerTextColors.queueButton.color,
      fontWeight: composerSurface.submitButton.fontWeight,
      fontSize: composerSurface.submitButton.fontSize,
    },
    sendButtonText: {
      color: mobileComposerTextColors.submitButton.color,
      fontWeight: composerSurface.submitButton.fontWeight,
      fontSize: composerSurface.submitButton.fontSize,
    },
    debugInfo: {
      backgroundColor: handsFreeSurfaceColors.debugPanel.backgroundColor,
      padding: spacing[handsFreeSurface.debugPanel.padding],
      margin: spacing[handsFreeSurface.debugPanel.margin],
      borderRadius: radius[handsFreeSurface.debugPanel.borderRadius],
      borderLeftWidth: handsFreeSurface.debugPanel.borderLeftWidth,
      borderLeftColor: handsFreeSurfaceColors.debugPanel.borderLeftColor,
    },
    debugText: {
      fontSize: handsFreeSurface.debugText.fontSize,
      color: handsFreeSurfaceColors.debugText.color,
      fontFamily: resolveMobileFontFamily(handsFreeSurface.debugText.fontFamilyByPlatform),
    },
    connectionBanner: {
      paddingHorizontal: spacing[connectionBannerSurface.paddingHorizontal],
      paddingVertical: spacing[connectionBannerSurface.paddingVertical],
      marginHorizontal: spacing[connectionBannerSurface.marginHorizontal],
      marginBottom: spacing[connectionBannerSurface.marginBottom],
      borderRadius: radius[connectionBannerSurface.borderRadius],
      borderWidth: connectionBannerSurface.borderWidth,
    },
    connectionBannerReconnecting: {
      backgroundColor: connectionBannerSurfaceColors.reconnecting.backgroundColor,
      borderColor: connectionBannerSurfaceColors.reconnecting.borderColor,
    },
    connectionBannerFailed: {
      backgroundColor: connectionBannerSurfaceColors.failed.backgroundColor,
      borderColor: connectionBannerSurfaceColors.failed.borderColor,
    },
    connectionBannerContent: {
      flexDirection: connectionBannerSurface.contentFlexDirection,
      alignItems: connectionBannerSurface.contentAlignItems,
    },
    connectionBannerIcon: {
      marginRight: spacing[connectionBannerSurface.iconMarginRight],
    },
    connectionBannerTextContainer: {
      flex: connectionBannerSurface.textContainerFlex,
    },
    connectionBannerText: {
      fontSize: connectionBannerSurface.titleFontSize,
      fontWeight: connectionBannerSurface.titleFontWeight,
      color: connectionBannerSurfaceColors.title.color,
    },
    connectionBannerSubtext: {
      fontSize: connectionBannerSurface.subtitleFontSize,
      color: connectionBannerSurfaceColors.subtitle.color,
      marginTop: connectionBannerSurface.subtitleMarginTop,
    },
    retryButton: {
      backgroundColor: connectionBannerSurfaceColors.retryButton.backgroundColor,
      paddingHorizontal: spacing[connectionBannerSurface.retryButton.paddingHorizontal],
      paddingVertical: spacing[connectionBannerSurface.retryButton.paddingVertical],
      borderRadius: radius[connectionBannerSurface.retryButton.borderRadius],
      marginLeft: spacing[connectionBannerSurface.retryButton.marginLeft],
    },
    retryButtonText: {
      color: connectionBannerSurfaceColors.retryButton.color,
      fontSize: connectionBannerSurface.retryButton.fontSize,
      fontWeight: connectionBannerSurface.retryButton.fontWeight,
    },
    scrollToBottomButton: {
      position: scrollToBottomSurface.position,
      right: spacing[scrollToBottomSurface.right],
      width: scrollToBottomSurface.size,
      height: scrollToBottomSurface.size,
      borderRadius: scrollToBottomSurface.borderRadius,
      backgroundColor: scrollToBottomSurfaceColors.button.backgroundColor,
      alignItems: scrollToBottomSurface.alignItems,
      justifyContent: scrollToBottomSurface.justifyContent,
      shadowColor: scrollToBottomSurface.shadowColor,
      shadowOffset: scrollToBottomSurface.shadowOffset,
      shadowOpacity: scrollToBottomSurface.shadowOpacity,
      shadowRadius: scrollToBottomSurface.shadowRadius,
      elevation: scrollToBottomSurface.elevation,
    },
    overlay: {
      position: voiceOverlaySurface.position,
      left: voiceOverlaySurface.left,
      right: voiceOverlaySurface.right,
      bottom: voiceOverlaySurface.bottomOffset,
      // Ensure the live transcription overlay renders above the input area.
      zIndex: voiceOverlaySurface.zIndex,
      elevation: voiceOverlaySurface.elevation,
      alignItems: voiceOverlaySurface.alignItems,
      paddingHorizontal: spacing[voiceOverlaySurface.paddingHorizontal],
      paddingBottom: spacing[voiceOverlaySurface.paddingBottom],
    },
    overlayCard: {
      maxWidth: voiceOverlaySurface.cardMaxWidth,
      borderRadius: radius[voiceOverlaySurface.cardBorderRadius],
      backgroundColor: mobileComposerSurfaceColors.voiceOverlay.cardBackgroundColor,
      paddingHorizontal: voiceOverlaySurface.cardPaddingHorizontal,
      paddingVertical: voiceOverlaySurface.cardPaddingVertical,
    },
    overlayText: {
      color: mobileComposerTextColors.voiceOverlay.color,
      fontSize: voiceOverlaySurface.textFontSize,
      lineHeight: voiceOverlaySurface.textLineHeight,
      textAlign: voiceOverlaySurface.textAlign,
    },
    overlayTranscript: {
      color: mobileComposerTextColors.voiceOverlay.color,
      marginTop: voiceOverlaySurface.transcriptMarginTop,
      fontSize: voiceOverlaySurface.transcriptFontSize,
      lineHeight: voiceOverlaySurface.transcriptLineHeight,
      opacity: voiceOverlaySurface.transcriptOpacity,
    },
	    toolApprovalCard: {
	      gap: spacing[toolApprovalSurface.card.gap],
	      padding: spacing[toolApprovalSurface.card.padding],
	      borderRadius: radius[toolApprovalSurface.card.borderRadius],
	      borderWidth: toolApprovalSurface.card.borderWidth,
	      borderColor: toolApprovalSurfaceColors.card.borderColor,
	      backgroundColor: toolApprovalSurfaceColors.card.backgroundColor,
	    },
	    toolApprovalHeader: {
	      flexDirection: toolApprovalSurface.header.flexDirection,
	      alignItems: toolApprovalSurface.header.alignItems,
	      gap: spacing[toolApprovalSurface.header.gap],
	    },
	    toolApprovalContent: {
	      gap: spacing[toolApprovalSurface.content.gap],
	    },
	    toolApprovalContentDisabled: {
	      opacity: toolApprovalSurface.content.disabledOpacity,
	    },
	    toolApprovalTitle: {
	      flex: toolApprovalSurface.title.flex,
	      minWidth: toolApprovalSurface.title.minWidth,
	      fontSize: toolApprovalSurface.title.fontSize,
	      fontWeight: toolApprovalSurface.title.fontWeight,
	      color: toolApprovalSurfaceColors.title.color,
    },
    toolApprovalToolRow: {
      flexDirection: toolApprovalSurface.toolRow.flexDirection,
      alignItems: toolApprovalSurface.toolRow.alignItems,
      flexWrap: toolApprovalSurface.toolRow.flexWrap,
      gap: spacing[toolApprovalSurface.toolRow.gap],
      marginBottom: toolApprovalSurface.toolRow.marginBottom,
    },
    toolApprovalToolLabel: {
      fontSize: toolApprovalSurface.toolLabel.fontSize,
      fontWeight: toolApprovalSurface.toolLabel.fontWeight,
      color: toolApprovalSurfaceColors.toolLabel.color,
    },
    toolApprovalTool: {
      fontFamily: resolveMobileFontFamily(toolApprovalSurface.toolName.fontFamilyByPlatform),
      fontSize: toolApprovalSurface.toolName.fontSize,
      color: toolApprovalSurfaceColors.toolName.color,
      flexShrink: toolApprovalSurface.toolName.flexShrink,
    },
    toolApprovalArgumentsPreview: {
      fontFamily: resolveMobileFontFamily(toolApprovalSurface.argumentsPreview.fontFamilyByPlatform),
      fontSize: toolApprovalSurface.argumentsPreview.fontSize,
      lineHeight: toolApprovalSurface.argumentsPreview.lineHeight,
      borderWidth: toolApprovalSurface.argumentsPreview.borderWidth,
      borderRadius: radius[toolApprovalSurface.argumentsPreview.borderRadius],
      paddingHorizontal: spacing[toolApprovalSurface.argumentsPreview.paddingHorizontal],
      paddingVertical: toolApprovalSurface.argumentsPreview.paddingVertical,
      borderColor: toolApprovalSurfaceColors.argumentsPreview.borderColor,
      backgroundColor: toolApprovalSurfaceColors.argumentsPreview.backgroundColor,
      color: toolApprovalSurfaceColors.argumentsPreview.color,
    },
    toolApprovalArgumentsToggle: {
      flexDirection: toolApprovalSurface.argumentsToggle.flexDirection,
      alignItems: toolApprovalSurface.argumentsToggle.alignItems,
      alignSelf: toolApprovalSurface.argumentsToggle.alignSelf,
      gap: toolApprovalSurface.argumentsToggle.gap,
      marginTop: spacing[toolApprovalSurface.argumentsToggle.marginTop],
      paddingVertical: toolApprovalSurface.argumentsToggle.paddingVertical,
    },
    toolApprovalArgumentsTogglePressed: {
      opacity: toolApprovalSurface.argumentsToggle.pressedOpacity,
    },
    toolApprovalArgumentsToggleText: {
      fontSize: toolApprovalSurface.argumentsToggleText.fontSize,
      fontWeight: toolApprovalSurface.argumentsToggleText.fontWeight,
      color: toolApprovalSurfaceColors.argumentsToggleText.color,
    },
    toolApprovalArgumentsScroll: {
      marginTop: toolApprovalSurface.fullArguments.marginTop,
      maxHeight: toolApprovalSurface.fullArguments.maxHeight,
      borderRadius: radius[toolApprovalSurface.fullArguments.borderRadius],
      backgroundColor: toolApprovalSurfaceColors.fullArguments.backgroundColor,
    },
    toolApprovalArgumentsFull: {
      fontFamily: resolveMobileFontFamily(toolApprovalSurface.fullArguments.fontFamilyByPlatform),
      fontSize: toolApprovalSurface.fullArguments.fontSize,
      lineHeight: toolApprovalSurface.fullArguments.lineHeight,
      padding: toolApprovalSurface.fullArguments.padding,
      color: toolApprovalSurfaceColors.fullArguments.color,
    },
    toolApprovalActions: {
      flexDirection: toolApprovalSurface.actions.flexDirection,
      justifyContent: toolApprovalSurface.actions.justifyContent,
      flexWrap: toolApprovalSurface.actions.flexWrap,
      gap: spacing[toolApprovalSurface.actions.gap],
      marginTop: spacing[toolApprovalSurface.actions.marginTop],
    },
	    toolApprovalButton: {
	      minHeight: toolApprovalSurface.button.minHeight,
	      minWidth: toolApprovalSurface.button.minWidth,
	      borderRadius: radius[toolApprovalSurface.button.borderRadius],
	      paddingHorizontal: spacing[toolApprovalSurface.button.paddingHorizontal],
	      paddingVertical: spacing[toolApprovalSurface.button.paddingVertical],
	      flexDirection: toolApprovalSurface.button.flexDirection,
	      alignItems: toolApprovalSurface.button.alignItems,
	      justifyContent: toolApprovalSurface.button.justifyContent,
	      gap: toolApprovalSurface.button.gap,
	      flex: toolApprovalSurface.button.flex,
	    },
    toolApprovalButtonDisabled: {
      opacity: toolApprovalSurface.disabledOpacity,
    },
	    toolApprovalApproveButton: {
	      backgroundColor: toolApprovalSurfaceColors.approveButton.backgroundColor,
	    },
	    toolApprovalApproveButtonText: {
	      color: toolApprovalSurfaceColors.approveButtonText.color,
	      fontSize: toolApprovalSurface.buttonText.fontSize,
	      fontWeight: toolApprovalSurface.buttonText.fontWeight,
	    },
	    toolApprovalDenyButton: {
	      borderWidth: toolApprovalSurface.buttonVariants.deny.borderWidth,
	      borderColor: toolApprovalSurfaceColors.denyButton.borderColor,
	      backgroundColor: toolApprovalSurfaceColors.denyButton.backgroundColor,
	    },
	    toolApprovalDenyButtonText: {
	      color: toolApprovalSurfaceColors.denyButtonText.color,
	      fontSize: toolApprovalSurface.buttonText.fontSize,
	      fontWeight: toolApprovalSurface.buttonText.fontWeight,
	    },
    // Unified Tool Execution Card styles - compact left-accent design matching desktop
    toolExecutionCard: {
      marginTop: detailedToolExecution.card.marginTop,
      borderRadius: radius[detailedToolExecution.card.borderRadius],
      borderLeftWidth: detailedToolExecution.card.borderLeftWidth,
      ...toolExecutionDetailColorsByState.idle,
      overflow: detailedToolExecution.card.overflow,
    },
    toolExecutionPending: toolExecutionDetailColorsByState.pending,
    toolExecutionSuccess: toolExecutionDetailColorsByState.success,
    toolExecutionError: toolExecutionDetailColorsByState.error,
    toolExecutionExpandedContainer: {
      position: detailedToolExecution.expandedContainer.position,
    },
    toolExecutionCollapseTopButton: {
      marginBottom: detailedToolExecution.collapseButton.topMarginBottom,
    },
    toolExecutionCollapseBottomButton: {
      marginTop: detailedToolExecution.collapseButton.bottomMarginTop,
    },
    toolCallCompactContainer: {
      paddingVertical: compactToolExecution.container.paddingVertical,
      paddingHorizontal: compactToolExecution.container.paddingHorizontal,
      borderRadius: radius[compactToolExecution.container.borderRadius],
      gap: compactToolExecution.container.gap,
    },
    toolCallCompactLine: {
      flexDirection: compactToolExecution.line.flexDirection,
      alignItems: compactToolExecution.line.alignItems,
      gap: compactToolExecution.line.gap,
      paddingVertical: compactToolExecution.line.paddingVertical,
      overflow: compactToolExecution.line.overflow,
    },
    toolCallCompactLeadingIcon: {
      width: compactToolExecution.toolIcon.width,
      alignItems: compactToolExecution.iconCell.alignItems,
      justifyContent: compactToolExecution.iconCell.justifyContent,
      flexShrink: compactToolExecution.iconCell.flexShrink,
    },
    toolCallCompactPressed: {
      opacity: compactToolExecution.pressedOpacity,
    },
    toolCallCompactName: {
      fontFamily: resolveMobileFontFamily(compactToolExecution.name.fontFamilyByPlatform),
      fontSize: compactToolExecution.name.fontSize,
      fontWeight: compactToolExecution.name.fontWeight,
      flexShrink: compactToolExecution.name.flexShrink,
      minWidth: compactToolExecution.name.minWidth,
      color: toolExecutionStatusColors.idle,
    },
    toolCallCompactNamePending: {
      color: toolExecutionStatusColors.pending,
    },
    toolCallCompactNameSuccess: {
      color: toolExecutionStatusColors.success,
    },
    toolCallCompactNameError: {
      color: toolExecutionStatusColors.error,
    },
    toolCallCompactStatusIndicator: {
      width: compactToolExecution.statusIcon.width,
      alignItems: compactToolExecution.iconCell.alignItems,
      justifyContent: compactToolExecution.iconCell.justifyContent,
      flexShrink: compactToolExecution.iconCell.flexShrink,
    },
    toolCallCompactToggleIcon: {
      width: compactToolExecution.toggleIcon.width,
      alignItems: compactToolExecution.iconCell.alignItems,
      justifyContent: compactToolExecution.iconCell.justifyContent,
      flexShrink: compactToolExecution.iconCell.flexShrink,
    },
    toolCallCompactStatusPending: {
      color: toolExecutionStatusColors.pending,
    },
    toolCallCompactStatusSuccess: {
      color: toolExecutionStatusColors.success,
    },
    toolCallCompactStatusError: {
      color: toolExecutionStatusColors.error,
    },
    // Tool-activity group styles (collapsed-by-default grouping of consecutive tool calls)
    toolActivityGroupCollapsed: {
      paddingVertical: toolActivityGroupSurface.collapsed.paddingVertical,
      paddingHorizontal: spacing[toolActivityGroupSurface.collapsed.paddingHorizontal],
      borderRadius: radius[toolActivityGroupSurface.collapsed.borderRadius],
      borderWidth: toolActivityGroupSurface.collapsed.borderWidth,
      borderColor: toolActivityGroupSurfaceColors.collapsed.borderColor,
      borderLeftWidth: toolActivityGroupSurface.collapsed.borderLeftWidth,
      borderLeftColor: toolActivityGroupSurfaceColors.collapsed.borderLeftColor,
      backgroundColor: toolActivityGroupSurfaceColors.collapsed.backgroundColor,
      marginBottom: toolActivityGroupSurface.collapsed.marginBottom,
    },
    toolActivityGroupPressed: {
      opacity: toolActivityGroupSurface.pressedOpacity,
    },
    toolActivityGroupHeaderRow: {
      flexDirection: toolActivityGroupSurface.headerRow.flexDirection,
      alignItems: toolActivityGroupSurface.headerRow.alignItems,
      gap: toolActivityGroupSurface.headerRow.gap,
      overflow: toolActivityGroupSurface.headerRow.overflow,
    },
    toolActivityGroupCountBadge: {
      minWidth: toolActivityGroupSurface.countBadge.minWidth,
      paddingHorizontal: toolActivityGroupSurface.countBadge.paddingHorizontal,
      paddingVertical: toolActivityGroupSurface.countBadge.paddingVertical,
      borderRadius: radius[toolActivityGroupSurface.countBadge.borderRadius],
      alignItems: toolActivityGroupSurface.countBadge.alignItems,
      justifyContent: toolActivityGroupSurface.countBadge.justifyContent,
      backgroundColor: toolActivityGroupSurfaceColors.countBadge.backgroundColor,
    },
    toolActivityGroupCountBadgeText: {
      fontFamily: resolveMobileFontFamily(toolActivityGroupSurface.countBadge.fontFamilyByPlatform),
      fontSize: toolActivityGroupSurface.countBadge.fontSize,
      fontWeight: toolActivityGroupSurface.countBadge.fontWeight,
      color: toolActivityGroupSurfaceColors.countBadge.color,
    },
    toolActivityGroupPreviewLine: {
      fontFamily: resolveMobileFontFamily(toolActivityGroupSurface.preview.fontFamilyByPlatform),
      fontSize: toolActivityGroupSurface.preview.fontSize,
      color: toolActivityGroupSurfaceColors.preview.color,
      flexShrink: toolActivityGroupSurface.preview.flexShrink,
      minWidth: toolActivityGroupSurface.preview.minWidth,
    },
    toolActivityGroupFooterButton: {
      alignSelf: toolActivityGroupSurface.footerButton.alignSelf,
      flexDirection: toolActivityGroupSurface.footerButton.flexDirection,
      alignItems: toolActivityGroupSurface.footerButton.alignItems,
      gap: toolActivityGroupSurface.footerButton.gap,
      marginTop: toolActivityGroupSurface.footerButton.marginTop,
      marginBottom: toolActivityGroupSurface.footerButton.marginBottom,
      paddingHorizontal: spacing[toolActivityGroupSurface.footerButton.paddingHorizontal],
      paddingVertical: toolActivityGroupSurface.footerButton.paddingVertical,
      borderRadius: radius[toolActivityGroupSurface.footerButton.borderRadius],
    },
    toolActivityGroupFooterText: {
      fontSize: toolActivityGroupSurface.footerText.fontSize,
      fontWeight: toolActivityGroupSurface.footerText.fontWeight,
      color: toolActivityGroupSurfaceColors.footerText.color,
    },
    toolParamsSection: {
      paddingHorizontal: spacing[detailedToolExecution.blockSection.paddingHorizontal],
      paddingVertical: detailedToolExecution.blockSection.paddingVertical,
    },
    toolCallSection: {
      marginBottom: spacing[detailedToolExecution.section.marginBottom],
      paddingBottom: spacing[detailedToolExecution.section.paddingBottom],
      borderBottomWidth: detailedToolExecution.section.borderBottomWidth,
      borderBottomColor: toolExecutionDetailContentColors.section.borderBottomColor,
    },
    toolName: {
      fontFamily: resolveMobileFontFamily(detailedToolExecution.toolName.fontFamilyByPlatform),
      fontWeight: detailedToolExecution.toolName.fontWeight,
      color: toolExecutionDetailContentColors.toolName.color,
      fontSize: detailedToolExecution.toolName.fontSize,
      flex: detailedToolExecution.toolName.flex,
    },
    toolCallHeader: {
      flexDirection: detailedToolExecution.header.flexDirection,
      alignItems: detailedToolExecution.header.alignItems,
      justifyContent: detailedToolExecution.header.justifyContent,
      paddingVertical: spacing[detailedToolExecution.header.paddingVertical],
      marginBottom: spacing[detailedToolExecution.header.marginBottom],
      minHeight: detailedToolExecution.header.minHeight,
    },
    toolCallHeaderPressed: {
      opacity: detailedToolExecution.header.pressedOpacity,
    },
    toolCallExpandHint: {
      flexDirection: detailedToolExecution.expandHint.flexDirection,
      alignItems: detailedToolExecution.expandHint.alignItems,
      gap: detailedToolExecution.expandHint.gap,
    },
    toolCallExpandHintText: {
      fontSize: detailedToolExecution.expandHint.fontSize,
      color: toolExecutionDetailContentColors.expandHintText.color,
      fontWeight: detailedToolExecution.expandHint.fontWeight,
    },
    toolSectionLabel: {
      fontSize: detailedToolExecution.sectionLabel.fontSize,
      fontWeight: detailedToolExecution.sectionLabel.fontWeight,
      color: toolExecutionDetailContentColors.sectionLabel.color,
      marginBottom: detailedToolExecution.sectionLabel.marginBottom,
      textTransform: detailedToolExecution.sectionLabel.textTransform,
      letterSpacing: detailedToolExecution.sectionLabel.letterSpacing,
    },
    toolDetailHeaderRow: {
      flexDirection: detailedToolExecution.detailHeaderRow.flexDirection,
      alignItems: detailedToolExecution.detailHeaderRow.alignItems,
      justifyContent: detailedToolExecution.detailHeaderRow.justifyContent,
      gap: detailedToolExecution.detailHeaderRow.gap,
      marginBottom: detailedToolExecution.detailHeaderRow.marginBottom,
    },
    toolPayloadMetaRow: {
      flexDirection: detailedToolExecution.payloadMeta.flexDirection,
      alignItems: detailedToolExecution.payloadMeta.alignItems,
      minWidth: detailedToolExecution.payloadMeta.minWidth,
      gap: detailedToolExecution.payloadMeta.gap,
      marginBottom: detailedToolExecution.payloadMeta.marginBottom,
    },
    toolPayloadType: {
      fontSize: detailedToolExecution.payloadType.fontSize,
      fontWeight: detailedToolExecution.payloadType.fontWeight,
      opacity: detailedToolExecution.payloadType.opacity,
      color: toolExecutionDetailContentColors.payloadType.color,
    },
    toolPayloadPreview: {
      fontFamily: resolveMobileFontFamily(detailedToolExecution.payloadPreview.fontFamilyByPlatform),
      fontSize: detailedToolExecution.payloadPreview.fontSize,
      lineHeight: detailedToolExecution.payloadPreview.lineHeight,
      paddingHorizontal: detailedToolExecution.payloadPreview.paddingHorizontal,
      paddingVertical: detailedToolExecution.payloadPreview.paddingVertical,
      borderRadius: radius[detailedToolExecution.payloadPreview.borderRadius],
      backgroundColor: toolPayloadPreviewColors.backgroundColor,
      color: toolPayloadPreviewColors.color,
      marginBottom: detailedToolExecution.result.headerMarginBottom,
    },
    toolDetailCopyButton: {
      minHeight: detailedToolExecution.copyButton.minHeight,
      paddingHorizontal: detailedToolExecution.copyButton.paddingHorizontal,
      paddingVertical: detailedToolExecution.copyButton.paddingVertical,
      borderRadius: radius[detailedToolExecution.copyButton.borderRadius],
      backgroundColor: toolDetailCopyButtonColors.backgroundColor,
      flexDirection: detailedToolExecution.copyButton.flexDirection,
      alignItems: detailedToolExecution.copyButton.alignItems,
      justifyContent: detailedToolExecution.copyButton.justifyContent,
      gap: detailedToolExecution.copyButton.gap,
      flexShrink: detailedToolExecution.copyButton.flexShrink,
    } as const,
    toolDetailCopyButtonPressed: {
      opacity: detailedToolExecution.copyButton.pressedOpacity,
    },
    toolDetailCopyButtonText: {
      fontSize: detailedToolExecution.copyButtonText.fontSize,
      fontWeight: detailedToolExecution.copyButtonText.fontWeight,
      color: toolDetailCopyButtonColors.textColor,
    },
    toolParamsScroll: {
      maxHeight: detailedToolExecution.scroll.collapsedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolParamsScrollExpanded: {
      maxHeight: detailedToolExecution.scroll.expandedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolParamsCode: {
      fontFamily: resolveMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform),
      fontSize: detailedToolExecution.codeBlock.fontSize,
      color: toolExecutionDetailContentColors.codeBlock.color,
      backgroundColor: toolExecutionDetailContentColors.codeBlock.backgroundColor,
      padding: detailedToolExecution.codeBlock.padding,
      borderRadius: radius[detailedToolExecution.codeBlock.borderRadius],
    },
    toolResponsePendingText: {
      fontSize: detailedToolExecution.pendingText.fontSize,
      fontStyle: detailedToolExecution.pendingText.fontStyle,
      color: toolExecutionDetailContentColors.pendingText.color,
      textAlign: detailedToolExecution.pendingText.textAlign,
      paddingVertical: detailedToolExecution.pendingText.paddingVertical,
    },
    toolResponsePendingRow: {
      flexDirection: detailedToolExecution.pendingRow.flexDirection,
      alignItems: detailedToolExecution.pendingRow.alignItems,
      justifyContent: detailedToolExecution.pendingRow.justifyContent,
      gap: detailedToolExecution.pendingRow.gap,
      paddingVertical: detailedToolExecution.pendingRow.paddingVertical,
    },
    toolResultItem: {
      marginBottom: detailedToolExecution.result.itemMarginBottom,
    },
    toolResultHeader: {
      flexDirection: detailedToolExecution.resultHeader.flexDirection,
      alignItems: detailedToolExecution.resultHeader.alignItems,
      justifyContent: detailedToolExecution.resultHeader.justifyContent,
      marginBottom: detailedToolExecution.result.headerMarginBottom,
      gap: detailedToolExecution.resultHeader.gap,
    },
    toolResultHeaderMeta: {
      flexDirection: detailedToolExecution.resultHeaderMeta.flexDirection,
      alignItems: detailedToolExecution.resultHeaderMeta.alignItems,
      gap: detailedToolExecution.resultHeaderMeta.gap,
      flexShrink: detailedToolExecution.resultHeaderMeta.flexShrink,
      minWidth: detailedToolExecution.resultHeaderMeta.minWidth,
    },
    toolResultCharCount: {
      fontSize: detailedToolExecution.characterCount.fontSize,
      fontFamily: resolveMobileFontFamily(detailedToolExecution.characterCount.fontFamilyByPlatform),
      color: toolExecutionDetailContentColors.characterCount.color,
      opacity: detailedToolExecution.characterCount.opacity,
    },
    toolResultBadge: {
      flexDirection: detailedToolExecution.badge.flexDirection,
      alignItems: detailedToolExecution.badge.alignItems,
      gap: detailedToolExecution.badge.gap,
      paddingHorizontal: detailedToolExecution.badge.paddingHorizontal,
      paddingVertical: detailedToolExecution.badge.paddingVertical,
      borderRadius: radius[detailedToolExecution.badge.borderRadius],
    },
    toolResultBadgeSuccess: {
      backgroundColor: toolResultBadgeSuccessColors.backgroundColor,
    },
    toolResultBadgeError: {
      backgroundColor: toolResultBadgeErrorColors.backgroundColor,
    },
    toolResultBadgeText: {
      fontSize: detailedToolExecution.badge.fontSize,
      fontWeight: detailedToolExecution.badge.fontWeight,
    },
    toolResultBadgeTextSuccess: {
      color: toolResultBadgeSuccessColors.color,
    },
    toolResultBadgeTextError: {
      color: toolResultBadgeErrorColors.color,
    },
    toolResultScroll: {
      maxHeight: detailedToolExecution.scroll.collapsedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolResultScrollExpanded: {
      maxHeight: detailedToolExecution.scroll.expandedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolResultCode: {
      fontFamily: resolveMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform),
      fontSize: detailedToolExecution.codeBlock.fontSize,
      color: toolExecutionDetailContentColors.codeBlock.color,
      backgroundColor: toolExecutionDetailContentColors.codeBlock.backgroundColor,
      padding: detailedToolExecution.codeBlock.padding,
      borderRadius: radius[detailedToolExecution.codeBlock.borderRadius],
    },
    toolResultErrorSection: {
      marginTop: detailedToolExecution.result.errorSectionMarginTop,
    },
    toolResultErrorLabel: {
      fontSize: detailedToolExecution.error.labelFontSize,
      fontWeight: detailedToolExecution.error.labelFontWeight,
      color: toolResultErrorColors.color,
      marginBottom: detailedToolExecution.error.labelMarginBottom,
    },
    toolResultErrorText: {
      fontFamily: resolveMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform),
      fontSize: detailedToolExecution.codeBlock.fontSize,
      color: toolResultErrorColors.color,
      backgroundColor: toolResultErrorColors.backgroundColor,
      padding: detailedToolExecution.codeBlock.padding,
      borderRadius: radius[detailedToolExecution.codeBlock.borderRadius],
    },
    messageContentRow: {
      flexDirection: mobileMessageContentLayout.row.flexDirection,
      alignItems: mobileMessageContentLayout.row.alignItems,
      gap: spacing[mobileMessageContentLayout.row.gap],
      width: mobileMessageContentLayout.row.width,
    },
    messageContentBody: {
      flex: mobileMessageContentLayout.body.flex,
      minWidth: mobileMessageContentLayout.body.minWidth,
    },
    collapsedMessagePreviewToggle: {
      flex: mobileMessageCollapsedPreview.flex,
      minWidth: mobileMessageCollapsedPreview.minWidth,
    },
    collapsedMessagePreviewTogglePressed: {
      opacity: mobileMessageCollapsedPreview.pressedOpacity,
    },
    collapsedMessagePreview: {
      color: mobileMessageCollapsedPreviewColors.text.color,
      fontSize: mobileMessageCollapsedPreview.fontSize,
      lineHeight: mobileMessageCollapsedPreview.lineHeight,
    },
    messageExpandButton: {
      alignSelf: mobileMessageActionButton.alignSelf,
      width: mobileMessageActionButton.width,
      height: mobileMessageActionButton.height,
      marginTop: mobileMessageActionButton.marginTop,
      borderRadius: mobileMessageActionButton.borderRadius,
      backgroundColor: mobileMessageActionButtonColors.backgroundColor,
      alignItems: mobileMessageActionButton.alignItems,
      justifyContent: mobileMessageActionButton.justifyContent,
      flexShrink: mobileMessageActionButton.flexShrink,
    } as const,
    messageExpandButtonPressed: {
      opacity: mobileMessageActionButton.pressedOpacity,
    },
    messageActionsRow: {
      flexDirection: mobileMessageActionRow.flexDirection,
      alignItems: mobileMessageActionRow.alignItems,
      justifyContent: mobileMessageActionRow.justifyContent,
      marginTop: mobileMessageActionRow.marginTop,
      gap: spacing[mobileMessageActionRow.gap],
    },
    messageTurnDurationBadge: {
      alignSelf: mobileMessageTurnDurationBadge.alignSelf,
      flexDirection: mobileMessageTurnDurationBadge.flexDirection,
      minHeight: mobileMessageTurnDurationBadge.minHeight,
      marginTop: mobileMessageTurnDurationBadge.marginTop,
      paddingHorizontal: mobileMessageTurnDurationBadge.paddingHorizontal,
      borderRadius: mobileMessageTurnDurationBadge.borderRadius,
      backgroundColor: mobileMessageTurnDurationBadgeColors.backgroundColor,
      alignItems: mobileMessageTurnDurationBadge.alignItems,
      justifyContent: mobileMessageTurnDurationBadge.justifyContent,
      gap: mobileMessageTurnDurationBadge.gap,
      flexShrink: mobileMessageTurnDurationBadge.flexShrink,
      opacity: mobileMessageTurnDurationBadge.opacity,
    } as const,
    messageTurnDurationBadgeLive: {
      backgroundColor: mobileMessageTurnDurationLiveBadgeColors.backgroundColor,
      opacity: mobileMessageTurnDurationLiveBadge.opacity,
    } as const,
    messageTurnDurationText: {
      fontFamily: resolveMobileFontFamily(mobileMessageTurnDurationBadge.fontFamilyByPlatform),
      fontSize: mobileMessageTurnDurationBadge.fontSize,
      lineHeight: mobileMessageTurnDurationBadge.lineHeight,
      fontWeight: mobileMessageTurnDurationBadge.fontWeight,
      color: mobileMessageTurnDurationBadgeColors.color,
    },
    messageTurnDurationTextLive: {
      color: mobileMessageTurnDurationLiveBadgeColors.color,
    },
    messageBranchButton: {
      alignSelf: mobileMessageBranchButton.alignSelf,
      width: mobileMessageBranchButton.width,
      height: mobileMessageBranchButton.height,
      marginTop: mobileMessageBranchButton.marginTop,
      borderRadius: mobileMessageBranchButton.borderRadius,
      backgroundColor: mobileMessageBranchButtonColors.backgroundColor,
      alignItems: mobileMessageBranchButton.alignItems,
      justifyContent: mobileMessageBranchButton.justifyContent,
      flexShrink: mobileMessageBranchButton.flexShrink,
    } as const,
    messageBranchButtonPressed: {
      opacity: mobileMessageBranchButton.pressedOpacity,
    } as const,
    messageBranchButtonDisabled: {
      opacity: mobileMessageBranchButton.disabledOpacity,
    },
    messageCopyButton: {
      alignSelf: mobileMessageActionButton.alignSelf,
      width: mobileMessageActionButton.width,
      height: mobileMessageActionButton.height,
      marginTop: mobileMessageActionButton.marginTop,
      borderRadius: mobileMessageActionButton.borderRadius,
      backgroundColor: mobileMessageActionButtonColors.backgroundColor,
      alignItems: mobileMessageActionButton.alignItems,
      justifyContent: mobileMessageActionButton.justifyContent,
      flexShrink: mobileMessageActionButton.flexShrink,
    } as const,
    messageCopyButtonCopied: {
      backgroundColor: mobileMessageCopiedButtonColors.backgroundColor,
    } as const,
    messageCopyButtonPressed: {
      opacity: mobileMessageActionButton.pressedOpacity,
    } as const,
    // Per-message TTS button styles (#1078)
    speakButton: {
      alignSelf: mobileMessageSpeechButton.alignSelf,
      width: mobileMessageSpeechButton.width,
      height: mobileMessageSpeechButton.height,
      marginTop: mobileMessageSpeechButton.marginTop,
      borderRadius: mobileMessageSpeechButton.borderRadius,
      backgroundColor: mobileMessageSpeechButtonColors.backgroundColor,
      alignItems: mobileMessageSpeechButton.alignItems,
      justifyContent: mobileMessageSpeechButton.justifyContent,
      flexShrink: mobileMessageSpeechButton.flexShrink,
    } as const,
    speakButtonActive: {
      backgroundColor: mobileMessageSpeechActiveButtonColors.backgroundColor,
    } as const,
    speakButtonPressed: {
      opacity: mobileMessageSpeechButton.pressedOpacity,
    } as const,
  });
}
