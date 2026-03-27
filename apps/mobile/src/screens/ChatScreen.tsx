import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Pressable,
  Image,
  AppState,
  AppStateStatus,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  useWindowDimensions,
  Modal,
} from 'react-native';

const darkSpinner = require('../../assets/loading-spinner.gif');
const lightSpinner = require('../../assets/light-spinner.gif');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
	useConfigContext,
	saveConfig,
} from '../store/config';
import { useSessionContext } from '../store/sessions';
import { useMessageQueueContext } from '../store/message-queue';
import { MessageQueuePanel } from '../ui/MessageQueuePanel';
import { ResponseHistoryPanel } from '../ui/ResponseHistoryPanel';
import { useConnectionManager } from '../store/connectionManager';
import { useTunnelConnection } from '../store/tunnelConnection';
import { useProfile } from '../store/profile';
import { ConnectionStatusIndicator } from '../ui/ConnectionStatusIndicator';
import { ChatMessage, AgentProgressUpdate } from '../lib/openaiClient';
import { SettingsApiClient } from '../lib/settingsApi';
import { RecoveryState, formatConnectionStatus } from '../lib/connectionRecovery';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import {
  extractRespondToUserResponseEvents,
  preprocessTextForTTS,
  shouldCollapseMessage,
  formatToolArguments,
  formatArgumentsPreview,
  getToolResultsSummary,
  getAgentConversationStateLabel,
  extractRespondToUserContentFromArgs,
  RESPOND_TO_USER_TOOL,
  isToolOnlyMessage,
  normalizeAgentConversationState,
  groupToolActivity,
  type AgentConversationState,
  type AgentUserResponseEvent,
  type HandsFreePhase,
  type PredefinedPromptSummary,
  type ToolActivityGroup,
} from '@dotagents/shared';
import { useHeaderHeight } from '@react-navigation/elements';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, Theme, hexToRgba } from '../ui/theme';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { AgentSelectorSheet } from '../ui/AgentSelectorSheet';
import { HandsFreeStatusChip } from '../ui/HandsFreeStatusChip';
import {
  createButtonAccessibilityLabel,
  createChatComposerAccessibilityHint,
  createExpandCollapseAccessibilityLabel,
  createMicControlAccessibilityHint,
  createMicControlAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
  createVoiceInputLiveRegionAnnouncement,
} from '../lib/accessibility';
import { formatVoiceDebugEntry, useVoiceDebug } from '../lib/voice/voiceDebug';
import { useSpeechRecognizer } from '../lib/voice/useSpeechRecognizer';
import { useHandsFreeController } from '../lib/voice/useHandsFreeController';
import { createDelegationProgressMessages } from '../lib/delegationProgress';

interface PendingImageAttachment {
  id: string;
  name: string;
  previewUri: string;
  dataUrl: string;
}

const MAX_PENDING_IMAGES = 4;
const MAX_PENDING_IMAGE_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES = 900 * 1024;
const INITIAL_VISIBLE_CHAT_MESSAGES = 80;
const VISIBLE_CHAT_MESSAGES_INCREMENT = 60;
const CHAT_COMPOSER_HINT_NATIVE_ID = 'chat-composer-hint';
const CHAT_VOICE_STATUS_LIVE_REGION_NATIVE_ID = 'chat-voice-status-live-region';

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const escapeMarkdownImageAlt = (value: string) => value.replace(/[\[\]\\]/g, '').trim();

const getApproxBase64Bytes = (base64: string) => {
  const normalized = base64.replace(/\s+/g, '');
  if (!normalized) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
};

const getApproxDataUrlBytes = (dataUrl: string) => {
  const [, base64 = ''] = dataUrl.split(',', 2);
  return getApproxBase64Bytes(base64);
};

const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)}MB`;

const inferImageMimeType = (asset: {
  mimeType?: string | null;
  fileName?: string | null;
  uri?: string | null;
}) => {
  const mimeType = asset.mimeType?.trim().toLowerCase();
  if (mimeType?.startsWith('image/')) {
    return mimeType;
  }

  const pathLike = (asset.fileName || asset.uri || '').split('?')[0].split('#')[0];
  const extensionMatch = pathLike.match(/\.([a-z0-9]+)$/i);
  if (!extensionMatch) {
    return null;
  }
  return IMAGE_MIME_BY_EXTENSION[`.${extensionMatch[1].toLowerCase()}`] || null;
};

const buildMessageWithPendingImages = (text: string, images: PendingImageAttachment[]) => {
  const trimmed = text.trim();
  const imageMarkdown = images
    .map((image, index) => {
      const fallbackName = `Image ${index + 1}`;
      const safeName = escapeMarkdownImageAlt(image.name || fallbackName) || fallbackName;
      return `![${safeName}](${image.dataUrl})`;
    })
    .join('\n\n');

  return [trimmed, imageMarkdown].filter(Boolean).join('\n\n');
};

type QuickStartShortcut = {
  id: string;
  title: string;
  content: string;
  source: 'command' | 'saved-prompt' | 'starter-pack' | 'action';
  action?: 'add-prompt';
};

type QuickStartSection = {
  id: string;
  title: string;
  items: QuickStartShortcut[];
};

const STARTER_PACK_SHORTCUTS: QuickStartShortcut[] = [
  {
    id: 'starter-plan-task',
    title: 'Plan this task',
    content: 'Help me plan this task. Give me a concise step-by-step implementation plan, edge cases to watch, and the smallest safe first step.',
    source: 'starter-pack',
  },
  {
    id: 'starter-debug-issue',
    title: 'Debug an issue',
    content: 'Help me debug this issue. Ask for the minimum missing context, identify the likely causes, and suggest the fastest way to verify the fix.',
    source: 'starter-pack',
  },
  {
    id: 'starter-summarize',
    title: 'Summarize and next steps',
    content: 'Summarize this clearly, then give me the next 3 concrete actions to take.',
    source: 'starter-pack',
  },
  {
    id: 'starter-polish-writing',
    title: 'Polish this draft',
    content: 'Rewrite this into a polished version that is clear, concise, and confident. Keep the meaning but improve the structure and wording.',
    source: 'starter-pack',
  },
  {
    id: 'starter-research-brief',
    title: 'Research brief',
    content: 'Create a quick research brief on this topic with key options, tradeoffs, and a practical recommendation.',
    source: 'starter-pack',
  },
  {
    id: 'starter-daily-review',
    title: 'Daily review',
    content: 'Help me review what happened today, extract the key lessons, and decide the highest-leverage next step for tomorrow.',
    source: 'starter-pack',
  },
];

const isSlashCommandPrompt = (prompt: PredefinedPromptSummary) => /^\/[\S]+/.test(prompt.name.trim());

const INLINE_DATA_IMAGE_MARKDOWN_REGEX = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi;

/** Meta-tools whose results are already shown as visible message content or are purely internal */
const HIDDEN_META_TOOLS = new Set([RESPOND_TO_USER_TOOL, 'mark_work_complete']);

const sanitizeMessageContentForModel = (content: string) =>
  content.replace(INLINE_DATA_IMAGE_MARKDOWN_REGEX, (_match, altText: string) => {
    const cleanedAlt = altText?.trim();
    return cleanedAlt ? `[Image: ${cleanedAlt}]` : '[Image]';
  });

const sanitizeMessagesForModel = (messages: ChatMessage[]): ChatMessage[] =>
  messages.map((message) => {
    const rawContent = typeof message.content === 'string' ? message.content : '';
    const sanitizedContent = sanitizeMessageContentForModel(rawContent);
    if (sanitizedContent === rawContent) {
      return message;
    }
    return {
      ...message,
      content: sanitizedContent,
    };
  });

const resolveConversationStateFromProgress = (
  update: AgentProgressUpdate,
  lifecycleState: 'running' | 'complete' = update.isComplete ? 'complete' : 'running'
): AgentConversationState => {
  if (update.conversationState) {
    return normalizeAgentConversationState(update.conversationState, lifecycleState);
  }
  const hasPendingApproval = update.steps.some((step) => step.type === 'pending_approval');
  if (hasPendingApproval) {
    return 'needs_input';
  }
  return lifecycleState;
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

const sortResponseEvents = (events: AgentUserResponseEvent[]): AgentUserResponseEvent[] =>
  [...events].sort((a, b) => {
    if ((a.runId ?? 0) !== (b.runId ?? 0)) return (a.runId ?? 0) - (b.runId ?? 0);
    if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
    return a.timestamp - b.timestamp;
  });

const getNextResponseEventOrdinal = (events: AgentUserResponseEvent[]): number =>
  events.reduce((maxOrdinal, event) => Math.max(maxOrdinal, event.ordinal), 0) + 1;

const getMessageLogMeta = (content: string) => ({
  length: content.length,
  inlineImageCount: (content.match(/!\[[^\]]*\]\((?:data:image\/[^)]+)\)/gi) || []).length,
});

const normalizeVoiceText = (text?: string) => (text || '').replace(/\s+/g, ' ').trim();

const mergeVoiceText = (base?: string, live?: string) => {
	const a = normalizeVoiceText(base);
	const b = normalizeVoiceText(live);
	if (!a) return b;
	if (!b) return a;
	if (a === b) return a;
	if (b.startsWith(a)) return b;
	if (a.startsWith(b)) return a;
	const aWords = a.split(' ');
	const bWords = b.split(' ');
	const maxOverlap = Math.min(aWords.length, bWords.length);
	for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
		const aSuffix = aWords.slice(-overlap).join(' ');
		const bPrefix = bWords.slice(0, overlap).join(' ');
		if (aSuffix === bPrefix) {
			return normalizeVoiceText(`${a} ${bWords.slice(overlap).join(' ')}`);
		}
	}
	return normalizeVoiceText(`${a} ${b}`);
};

const getCollapsedMessagePreview = (content: string) =>
  content
    .replace(/!\[[^\]]*\]\((?:data:image\/[^)]+|[^)]+)\)/gi, '[Image]')
    .replace(/\s+/g, ' ')
    .trim();

const TOOL_PAYLOAD_PREFIX_REGEX = /^(?:using tool:|tool result:)/i;

const getRespondToUserContentFromMessage = (message: ChatMessage): string | null => {
  if (message.role !== 'assistant' || !message.toolCalls?.length) {
    return null;
  }

  for (const call of message.toolCalls) {
    if (call.name !== RESPOND_TO_USER_TOOL) {
      continue;
    }

    const extractedContent = extractRespondToUserContentFromArgs(call.arguments);
    if (extractedContent) {
      return extractedContent;
    }
  }

  return null;
};

const TOOL_RESULT_BRACKET_REGEX = /^\[[\w_.-]+\]\s*[{\[#]/;

// Match [tool_name] {json...} or [tool_name] [...] patterns anywhere in text
// Used to strip raw tool call / tool result text that leaks into visible content
const INLINE_TOOL_BRACKET_REGEX = /\[[\w_.-]+\]\s*(?:\{[\s\S]*?\}|\[[\s\S]*?\])/g;

// Match garbled tool-call-as-text patterns (model hallucinating tool call syntax)
const GARBLED_TOOL_CALL_REGEX = /(?:multi_tool_use[.\s]|to=(?:multi_tool_use|functions)\.|recipient_name.*functions\.)/i;

const looksLikeToolPayloadContent = (content?: string): boolean => {
  const trimmedContent = content?.trim();
  if (!trimmedContent) {
    return false;
  }

  if (/<\|tool_calls_section_begin\|>|<\|tool_call_begin\|>/i.test(trimmedContent)) {
    return true;
  }

  if (TOOL_PAYLOAD_PREFIX_REGEX.test(trimmedContent)) {
    return true;
  }

  // Catch raw tool result content like "[tool_name] { json }" or "[tool_name] # markdown"
  if (TOOL_RESULT_BRACKET_REGEX.test(trimmedContent)) {
    return true;
  }

  // Catch garbled tool call text
  if (GARBLED_TOOL_CALL_REGEX.test(trimmedContent)) {
    return true;
  }

  return false;
};

/**
 * Strip raw tool call / tool result text that leaks into visible message content.
 * Removes patterns like "[execute_command] {"command":"ls"}" or
 * "[tool_name] [{"key":"value"}]" that backends sometimes include as text.
 */
const stripRawToolTextFromContent = (content: string): string => {
  if (!content) return content;

  // Remove [tool_name] {json} or [tool_name] [array] patterns
  let cleaned = content.replace(INLINE_TOOL_BRACKET_REGEX, '');

  // Remove tool marker tags like <|tool_call_begin|> etc.
  cleaned = cleaned.replace(/<\|[^|]*\|>/g, '');

  // Remove garbled multi_tool_use patterns
  cleaned = cleaned.replace(/(?:multi_tool_use[.\s]|to=(?:multi_tool_use|functions)\.)[\s\S]*$/i, '');

  return cleaned.trim();
};

const getVisibleMessageContent = (message: ChatMessage): string => {
  // Tool role messages are raw tool results — always hide their content
  // (they should have been merged into the preceding assistant message)
  if (message.role === 'tool') {
    return '';
  }

  if (message.role !== 'assistant') {
    return message.content || '';
  }

  const respondToUserContent = getRespondToUserContentFromMessage(message);
  if (respondToUserContent) {
    return respondToUserContent;
  }

  const hasToolMetadata =
    (message.toolCalls?.length ?? 0) > 0 ||
    (message.toolResults?.length ?? 0) > 0;

  if (isToolOnlyMessage(message)) {
    return '';
  }

  if (hasToolMetadata && looksLikeToolPayloadContent(message.content)) {
    return '';
  }

  // Hide standalone messages that are raw tool results (no structured metadata
  // but content looks like "[tool_name] { json }" from unmerged tool responses)
  if (looksLikeToolPayloadContent(message.content)) {
    return '';
  }

  // Strip any remaining inline tool call text (e.g. "[execute_command] {json}")
  // that might be embedded within otherwise valid content
  const rawContent = message.content || '';
  const stripped = stripRawToolTextFromContent(rawContent);
  if (stripped.length > 0) {
    return stripped;
  }

  return stripped === rawContent ? rawContent : '';
};

const shouldTreatMessageAsToolOnly = (message: ChatMessage): boolean => {
  const hasToolMetadata =
    (message.toolCalls?.length ?? 0) > 0 ||
    (message.toolResults?.length ?? 0) > 0;

  // Also treat standalone raw tool result messages as tool-only
  if (looksLikeToolPayloadContent(message.content)) {
    return true;
  }

  return hasToolMetadata && getVisibleMessageContent(message).trim().length === 0;
};

const applyUserResponseToMessages = (
  messages: ChatMessage[],
  userResponse?: string
): ChatMessage[] => {
  const trimmedResponse = userResponse?.trim();
  if (!trimmedResponse) {
    return messages;
  }

  const updatedMessages = [...messages];
  for (let i = updatedMessages.length - 1; i >= 0; i--) {
    const msg = updatedMessages[i];
    if (msg.role !== 'assistant') {
      continue;
    }

    const hasToolMetadata =
      (msg.toolCalls && msg.toolCalls.length > 0) ||
      (msg.toolResults && msg.toolResults.length > 0);
    const shouldReplaceToolContent =
      hasToolMetadata && (
        isToolOnlyMessage(msg) ||
        looksLikeToolPayloadContent(msg.content) ||
        !!getRespondToUserContentFromMessage(msg)
      );

    if (hasToolMetadata && !shouldReplaceToolContent) {
      continue;
    }

    updatedMessages[i] = { ...msg, content: trimmedResponse };
    return updatedMessages;
  }

  updatedMessages.push({ role: 'assistant', content: trimmedResponse });
  return updatedMessages;
};

export default function ChatScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const isFocused = useIsFocused();
  const { height: screenHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenHeight), [theme, screenHeight]);
  const { config, setConfig } = useConfigContext();
  const sessionStore = useSessionContext();
  const messageQueue = useMessageQueueContext();
  const connectionManager = useConnectionManager();
  const { connectionInfo } = useTunnelConnection();
  const { currentProfile } = useProfile();
  const currentAgentLabel = currentProfile?.name || 'Default Agent';
  const currentSession = sessionStore.getCurrentSession();
  const isCurrentSessionPinned = !!currentSession?.isPinned;
  const handsFree = !!config.handsFree;
  const settingsClient = useMemo(() => {
    if (!config.baseUrl || !config.apiKey) {
      return null;
    }
    return new SettingsApiClient(config.baseUrl, config.apiKey);
  }, [config.apiKey, config.baseUrl]);
  const [predefinedPrompts, setPredefinedPrompts] = useState<PredefinedPromptSummary[]>([]);
  const [isLoadingQuickStartPrompts, setIsLoadingQuickStartPrompts] = useState(false);
  const [addPromptModalVisible, setAddPromptModalVisible] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const handsFreeMessageDebounceMs = config.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;
  const handsFreeWakePhrase = config.handsFreeWakePhrase || 'hey dot agents';
  const handsFreeSleepPhrase = config.handsFreeSleepPhrase || 'go to sleep';
  const handsFreeDebugEnabled = config.handsFreeDebug === true;
  const handsFreeForegroundOnly = config.handsFreeForegroundOnly !== false;
  const messageQueueEnabled = config.messageQueueEnabled !== false; // default true
  const handsFreeRef = useRef<boolean>(handsFree);
  useEffect(() => { handsFreeRef.current = !!config.handsFree; }, [config.handsFree]);
  const handsFreePhaseRef = useRef<HandsFreePhase>('sleeping');
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const isAppActive = appState === 'active';
  const handsFreeRuntimeActive = handsFree && isFocused && isAppActive;

  const toggleHandsFree = async () => {
    const next = !handsFreeRef.current;
	    handsFreeRef.current = next;
    const nextCfg = { ...config, handsFree: next } as any;
    setConfig(nextCfg);
    try { await saveConfig(nextCfg); } catch {}
    if (!next) {
	      handsFreeController.reset();
      void stopRecognitionOnly?.();
      Speech.stop();
      setDebugInfo('Handsfree mode turned off.');
    } else {
      setDebugInfo('Handsfree mode turned on. Say the wake phrase to begin.');
    }
  };

  // TTS toggle
  const ttsEnabled = config.ttsEnabled !== false; // default true
  const toggleTts = async () => {
    const next = !ttsEnabled;
    // Stop any currently playing TTS when disabling
    if (!next) {
      Speech.stop();
    }
    const nextCfg = { ...config, ttsEnabled: next } as any;
    setConfig(nextCfg);
    try { await saveConfig(nextCfg); } catch {}
  };

  const [responding, setResponding] = useState(false);
  const [conversationState, setConversationState] = useState<AgentConversationState | null>(null);
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
        '⚠️ Emergency Stop\n\nAre you sure you want to stop all agent sessions on the remote server? This will immediately terminate any running tasks.'
      );
      if (confirmed) {
        try {
          const result = await client.killSwitch();
          if (result.success) {
            window.alert(result.message || 'All sessions stopped');
          } else {
            window.alert('Error: ' + (result.error || 'Failed to stop sessions'));
          }
        } catch (e: any) {
          console.error('[ChatScreen] Kill switch error:', e);
          window.alert('Error: ' + (e.message || 'Failed to connect to server'));
        }
      }
      return;
    }

    Alert.alert(
      '⚠️ Emergency Stop',
      'Are you sure you want to stop all agent sessions on the remote server? This will immediately terminate any running tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop All',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await client.killSwitch();
              if (result.success) {
                Alert.alert('Success', result.message || 'All sessions stopped');
              } else {
                Alert.alert('Error', result.error || 'Failed to stop sessions');
              }
            } catch (e: any) {
              console.error('[ChatScreen] Kill switch error:', e);
              Alert.alert('Error', e.message || 'Failed to connect to server');
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

  const handleToggleCurrentSessionPinned = useCallback(() => {
    const currentSessionId = sessionStore.currentSessionId;
    if (!currentSessionId) return;
    void sessionStore.toggleSessionPinned(currentSessionId);
  }, [sessionStore]);

  const headerConversationState = conversationState ?? (responding ? 'running' : null);
  const headerConversationLabel = headerConversationState
    ? getAgentConversationStateLabel(headerConversationState)
    : null;
  const headerConversationChipStyle = useMemo(() => {
    if (!headerConversationState) return null;
    if (headerConversationState === 'complete') {
      return {
        backgroundColor: hexToRgba(theme.colors.success, 0.12),
        borderColor: hexToRgba(theme.colors.success, 0.35),
        textColor: theme.colors.success,
      };
    }
    if (headerConversationState === 'needs_input') {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        textColor: '#d97706',
      };
    }
    if (headerConversationState === 'blocked') {
      return {
        backgroundColor: hexToRgba(theme.colors.danger, 0.12),
        borderColor: hexToRgba(theme.colors.danger, 0.35),
        textColor: theme.colors.danger,
      };
    }
    return {
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
      borderColor: hexToRgba(theme.colors.primary, 0.35),
      textColor: theme.colors.primary,
    };
  }, [headerConversationState, theme.colors.danger, theme.colors.primary, theme.colors.success]);

  useLayoutEffect(() => {
    navigation?.setOptions?.({
      headerTitle: () => (
        <TouchableOpacity
          style={{ alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 44 }}
          onPress={() => setAgentSelectorVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Current agent: ${currentAgentLabel}. Tap to change.`}
          accessibilityHint="Opens agent selection menu"
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.primary + '33',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
          }}>
            <Text style={{
              fontSize: 11,
              color: theme.colors.primary,
              fontWeight: '500',
            }}>
              {currentAgentLabel} ▼
            </Text>
          </View>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Sessions')}
            accessibilityRole="button"
            accessibilityLabel="Back to chat history"
            accessibilityHint="Returns to the chat history list"
            style={styles.headerEdgeActionButton}
          >
            <Text style={{ fontSize: 20, color: theme.colors.foreground }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleCurrentSessionPinned}
            accessibilityRole="button"
            accessibilityLabel={isCurrentSessionPinned ? 'Unpin current chat' : 'Pin current chat'}
            accessibilityHint={isCurrentSessionPinned
              ? 'Removes this chat from the pinned chats list.'
              : 'Keeps this chat at the top of the chats list.'}
            style={[styles.headerPinButton, isCurrentSessionPinned && styles.headerPinButtonActive]}
          >
            <Text style={[styles.headerPinButtonText, isCurrentSessionPinned && styles.headerPinButtonTextActive]}>
              {isCurrentSessionPinned ? 'Pinned' : 'Pin'}
            </Text>
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerActionsRow}>
          {headerConversationLabel && headerConversationChipStyle && (
            <View
              style={[
                styles.headerConversationChip,
                {
                  backgroundColor: headerConversationChipStyle.backgroundColor,
                  borderColor: headerConversationChipStyle.borderColor,
                },
              ]}
            >
              {headerConversationState === 'running' && (
                <Image
                  source={isDark ? darkSpinner : lightSpinner}
                  style={{ width: 14, height: 14 }}
                  resizeMode="contain"
                />
              )}
              <Text
                style={[
                  styles.headerConversationChipText,
                  { color: headerConversationChipStyle.textColor },
                ]}
              >
                {headerConversationLabel}
              </Text>
            </View>
          )}
          {headerConversationState === 'running' && (
            <TouchableOpacity
              onPress={handleKillSwitch}
              accessibilityRole="button"
              accessibilityLabel="Emergency stop - kill all agent sessions"
              accessibilityHint="Shows a confirmation before stopping all running sessions"
              style={styles.headerActionButton}
            >
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 14, color: '#FFFFFF' }}>⏹</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={toggleHandsFree}
            accessibilityRole="switch"
            accessibilityLabel={createSwitchAccessibilityLabel('Hands-free voice mode')}
            accessibilityHint="When enabled, speech is sent automatically after each phrase"
            accessibilityState={{ checked: handsFree }}
            aria-checked={handsFree}
            style={styles.headerActionButton}
          >
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>🎙️</Text>
              {!handsFree && (
                <View
                  style={{
                    position: 'absolute',
                    width: 20,
                    height: 2,
                    backgroundColor: theme.colors.danger,
                    transform: [{ rotate: '45deg' }],
                    borderRadius: 1,
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handsFree, handleKillSwitch, handleNewChat, handleToggleCurrentSessionPinned, isCurrentSessionPinned, responding, headerConversationLabel, headerConversationState, headerConversationChipStyle, theme, isDark, sessionStore, currentProfile, styles]);


  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visibleMessageCount, setVisibleMessageCount] = useState(INITIAL_VISIBLE_CHAT_MESSAGES);
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
  useEffect(() => { messagesRef.current = messages; }, [messages]);
	// Stable ref to the latest send() to avoid stale closures in speech callbacks
	const sendRef = useRef<(text: string) => Promise<void>>(async () => {});
	  const [input, setInput] = useState('');
	  const [pendingImages, setPendingImages] = useState<PendingImageAttachment[]>([]);
	  const inputRef = useRef<TextInput>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  // Track which individual tool calls are fully expanded to show all input/output details
  // Key format: "messageId-toolCallIndex" (messageId falls back to message array index if undefined)
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});
  // Track which tool-activity groups are expanded (keyed by "startIndex-endIndex")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
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
		onVoiceFinalized: ({ text, mode }) => {
			const finalText = text.trim();
			if (!finalText) return;

			if (mode === 'edit') {
				setInput((current) => mergeVoiceText(current, finalText));
				setDebugInfo('Voice transcript added to the composer.');
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
			setDebugInfo(`Voice error: ${message}`);
		},
		onPermissionDenied: () => {
			setDebugInfo('Speech recognition permission denied.');
		},
		log: voiceLog,
	  });

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
		const processedText = preprocessTextForTTS(content);
		if (!processedText) {
				onSettled?.();
			return false;
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
		  }, [config.ttsPitch, config.ttsRate, config.ttsVoiceId, handsFree, handsFreeController, voiceLog]);

	  const syncResponseHistoryRefs = useCallback((events: AgentUserResponseEvent[]) => {
	    respondToUserHistoryRef.current = events;
	    nextResponseEventOrdinalRef.current = getNextResponseEventOrdinal(events);
	  }, []);

	  const replaceResponseHistory = useCallback((events: AgentUserResponseEvent[]) => {
	    const sortedEvents = sortResponseEvents(events);
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

	    const mergedEvents = sortResponseEvents(Array.from(merged.values()));
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
    if (config.ttsEnabled === false || !events.length) return;

    const queuedIds = new Set(queuedResponseEventsRef.current.map((event) => event.id));
    const activeId = activeAutoSpeechEventIdRef.current;
    const unseenEvents = events.filter((event) => (
      !playedResponseEventIdsRef.current.has(event.id)
      && !queuedIds.has(event.id)
      && event.id !== activeId
    ));

    if (!unseenEvents.length) return;

    queuedResponseEventsRef.current = [
      ...queuedResponseEventsRef.current,
      ...unseenEvents,
    ].sort((a, b) => {
      if ((a.runId ?? 0) !== (b.runId ?? 0)) return (a.runId ?? 0) - (b.runId ?? 0);
      if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
      return a.timestamp - b.timestamp;
    });

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
		config.ttsRate,
		config.ttsPitch,
		config.ttsVoiceId,
		handsFree,
		handsFreeController,
		voiceLog,
	  ]);

  // Auto-scroll state and ref for mobile chat
  const scrollViewRef = useRef<ScrollView>(null);
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
    }, 150);
  }, []);

  // Handle scroll events to detect when user scrolls away from bottom
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Consider "at bottom" if within 50 pixels of the bottom
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    const isNearTop = contentOffset.y <= 120;

    if (isAtBottom && !shouldAutoScroll) {
      // User scrolled back to bottom, resume auto-scroll
      setShouldAutoScroll(true);
    } else if (!isAtBottom && shouldAutoScroll && isUserDraggingRef.current) {
      // Only pause auto-scroll when user is actively dragging (not programmatic scroll)
      setShouldAutoScroll(false);
    }
    if (isNearTop && visibleMessageCount < messages.length) {
      setVisibleMessageCount((current) => Math.min(messages.length, current + VISIBLE_CHAT_MESSAGES_INCREMENT));
    }
  }, [messages.length, shouldAutoScroll, visibleMessageCount]);

  useEffect(() => {
    setVisibleMessageCount(INITIAL_VISIBLE_CHAT_MESSAGES);
  }, [sessionStore.currentSessionId]);

  useEffect(() => {
    setVisibleMessageCount((current) => {
      if (messages.length === 0) return INITIAL_VISIBLE_CHAT_MESSAGES;
      const next = Math.max(INITIAL_VISIBLE_CHAT_MESSAGES, current);
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
        setIsLoadingQuickStartPrompts(false);
      }
      return;
    }

    let cancelled = false;
    setIsLoadingQuickStartPrompts(true);

    settingsClient.getSettings()
      .then((settings) => {
        if (cancelled) return;
        const nextPrompts = [...(settings.predefinedPrompts || [])].sort((a, b) => b.updatedAt - a.updatedAt);
        setPredefinedPrompts(nextPrompts);
      })
      .catch(() => {
        if (cancelled) return;
        setPredefinedPrompts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingQuickStartPrompts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isFocused, settingsClient]);

  const handleSaveNewPrompt = async () => {
    if (!settingsClient || !newPromptName.trim() || !newPromptContent.trim()) return;
    setIsSavingPrompt(true);
    try {
      const now = Date.now();
      const newPrompt: PredefinedPromptSummary = {
        id: `prompt-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name: newPromptName.trim(),
        content: newPromptContent.trim(),
        createdAt: now,
        updatedAt: now,
      };

      const updatedPrompts = [...predefinedPrompts, newPrompt];
      await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(updatedPrompts);
      setAddPromptModalVisible(false);
      setNewPromptName('');
      setNewPromptContent('');
      Alert.alert('Success', 'Prompt saved to your settings.');
    } catch (error: any) {
      console.error('[ChatScreen] Error saving prompt:', error);
      Alert.alert('Error', error.message || 'Failed to save prompt.');
    } finally {
      setIsSavingPrompt(false);
    }
  };

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
        const client = settingsClient || new SettingsApiClient(config.baseUrl, config.apiKey);
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
    setExpandedMessages(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  // Toggle expansion of individual tool call details (input params and results)
  const toggleToolCallExpansion = useCallback((messageId: string, toolCallIndex: number) => {
    const key = `${messageId}-${toolCallIndex}`;
    setExpandedToolCalls(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Compute tool-activity groups for consecutive connected tool-call messages
  const toolActivityGroups = useMemo(() => groupToolActivity(messages), [messages]);

  // Toggle expansion of a tool-activity group (keyed by "startIndex-endIndex")
  const toggleGroupExpansion = useCallback((group: ToolActivityGroup) => {
    const key = `${group.startIndex}-${group.endIndex}`;
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Auto-expand logic matching desktop behavior (#32, #33):
  // - Tool-only messages (toolCalls/toolResults with no visible user-facing content) collapse by default
  // - Messages with tool metadata and visible user-facing content can still expand normally
  // - Only the final assistant message auto-expands, and only when not streaming (agent complete)
  // - Tool-only messages stay collapsed during streaming to avoid showing raw payload text
  // - Users can still manually expand any collapsed message
  useEffect(() => {
    const lastAssistantIndex = messages.reduce((lastIdx, m, i) =>
      m.role === 'assistant' ? i : lastIdx, -1);

    if (lastAssistantIndex >= 0) {
      setExpandedMessages(prev => {
        const updated = { ...prev };
        const lastMsg = messages[lastAssistantIndex];

        // Collapse tool-only assistant messages by default when they have no visible user-facing content
        messages.forEach((m, i) => {
          if (m.role === 'assistant' && shouldTreatMessageAsToolOnly(m)) {
            // Only set to false if not explicitly toggled by user
            // (We check if the index exists in prev - if so, preserve user choice)
            if (!(i in prev)) {
              updated[i] = false;
            }
          }
        });

        // Expand final assistant message ONLY if:
        // 1. Agent is not currently streaming/responding
        // 2. The message is NOT a tool-only message (has real content for user)
        const isComplete = !responding;
        const isFinalToolOnly = shouldTreatMessageAsToolOnly(lastMsg);

        if (isComplete && !isFinalToolOnly) {
          // Expand final message only if it has user-facing content
          updated[lastAssistantIndex] = true;
        } else if (!(lastAssistantIndex in prev)) {
          // During streaming or for tool-only messages, collapse by default
          updated[lastAssistantIndex] = false;
        }

        return updated;
      });
    }
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

      if (currentToolCalls.length > 0 || currentToolResults.length > 0 || thinkingContent) {
        messages.push({
          role: 'assistant',
          content: thinkingContent || (currentToolCalls.length > 0 ? 'Executing tools...' : ''),
          toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
          toolResults: currentToolResults.length > 0 ? currentToolResults : undefined,
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
              // If tool message has content but no toolResults, fall through to add it as a message
            }
          }

          messages.push({
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
          });
        }
      }
    }

    if (update.streamingContent?.text) {
      if (
        messages.length > 0
        && messages[messages.length - 1].role === 'assistant'
        && messages[messages.length - 1].variant !== 'delegation'
      ) {
        messages[messages.length - 1].content = update.streamingContent.text;
      } else {
        messages.push({
          role: 'assistant',
          content: update.streamingContent.text,
        });
      }
    }

    const messagesWithUserResponse = applyUserResponseToMessages(
      messages,
      update.userResponse || update.spokenContent,
    );
    return [...messagesWithUserResponse, ...delegationMessages];
  }, []);

  // Get the current conversation ID for queue operations
  const currentConversationId = sessionStore.currentSessionId || 'default';

  // Get queued messages for the current conversation
  const queuedMessages = messageQueue.getQueue(currentConversationId);
  const nextQueuedMessage = !responding ? messageQueue.peek(currentConversationId) : null;

  const handlePickImages = useCallback(async () => {
    if (pendingImages.length >= MAX_PENDING_IMAGES) {
      Alert.alert('Image limit reached', `You can attach up to ${MAX_PENDING_IMAGES} images per message.`);
      return;
    }

    const existingEmbeddedBytes = pendingImages.reduce(
      (sum, image) => sum + getApproxDataUrlBytes(image.dataUrl),
      0
    );
    if (existingEmbeddedBytes >= MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES) {
      Alert.alert(
        'Image budget reached',
        `This message already reached the image budget (${formatMb(MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES)}).`
      );
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

        const inferredBytes = getApproxBase64Bytes(asset.base64);
        const fileSizeBytes = typeof asset.fileSize === 'number' && asset.fileSize > 0
          ? asset.fileSize
          : inferredBytes;
        if (fileSizeBytes > MAX_PENDING_IMAGE_FILE_SIZE_BYTES) {
          oversizedImageNames.push(displayName);
          return;
        }

        const mimeType = inferImageMimeType(asset);
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
        Alert.alert(
          'Some images were skipped',
          `${missingBase64Names.join(', ')} could not be attached. Please try again.`
        );
      }

      if (oversizedImageNames.length > 0) {
        Alert.alert(
          'Image too large',
          `${oversizedImageNames.join(', ')} exceed the 4MB limit.`
        );
      }

      if (unknownMimeNames.length > 0) {
        Alert.alert(
          'Unsupported image format',
          `${unknownMimeNames.join(', ')} could not be attached because the image type could not be determined.`
        );
      }

      if (budgetExceededNames.length > 0) {
        Alert.alert(
          'Image budget reached',
          `${budgetExceededNames.join(', ')} exceed the per-message image budget (${formatMb(MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES)}).`
        );
      }
    } catch (error: any) {
      Alert.alert('Image picker error', error?.message || 'Unable to select images right now.');
    }
  }, [pendingImages]);

  const removePendingImage = useCallback((attachmentId: string) => {
    setPendingImages((prev) => prev.filter((image) => image.id !== attachmentId));
  }, []);

  const send = async (text: string, options?: { fromComposer?: boolean }) => {
    if (!text.trim()) return;

    // If message queue is enabled and we're already responding, queue the message
    if (messageQueueEnabled && responding) {
      console.log('[ChatScreen] Agent busy, queuing message:', getMessageLogMeta(text));
      messageQueue.enqueue(currentConversationId, text);
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
      setDebugInfo('Error: No session available');
      return;
    }

    setDebugInfo(`Starting request to ${config.baseUrl}...`);
    // Clear any previous failed message when starting a new send
    setLastFailedMessage(null);

    const userMsg: ChatMessage = { role: 'user', content: text };
	    // Use ref to avoid stale closures (notably auto-send after rapid-fire session switch).
	    const currentMessages = messagesRef.current;
	    const messageCountBeforeTurn = currentMessages.length;
    // Clear progress messages ref for this new request (#1083)
    progressMessagesRef.current = [];
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
      setDebugInfo('Request sent, waiting for response...');

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
	          lastResponseEvents = [...update.responseEvents].sort((a, b) => a.ordinal - b.ordinal);
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
	          if (responseText && responseText !== midTurnLegacyResponseText && config.ttsEnabled !== false) {
	            midTurnLegacyResponseText = responseText;
		            speakAssistantResponse(responseText, 'mid-turn progress');
	          }
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
            if (copy[i].role === 'assistant') {
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
        setDebugInfo(`Completed!`);
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
              // If tool message has content but no toolResults, fall through to add it as a message
            }
          }

          newMessages.push({
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
          });
        }
		        const finalTurnMessages = applyUserResponseToMessages(newMessages, finalResponseEvent?.text || lastUserResponse);
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
	              mergedMessages[mergedMessages.length - 1] = finalTurnMessages[finalTurnMessages.length - 1];
            } else {
              // History is authoritative when it has >= messages
	              mergedMessages = finalTurnMessages;
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
              if (copy[i].role === 'assistant') {
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
	      if (!alreadySpokenMidTurn && !sessionChanged && ttsText && config.ttsEnabled !== false) {
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
      let errorMessage = e.message;

      if (recoveryState?.status === 'failed') {
        errorMessage = `Connection failed after ${recoveryState.retryCount} retries. ${recoveryState.lastError || ''}`;
      } else if (recoveryState?.status === 'reconnecting') {
        errorMessage = `Connection lost. Attempted ${recoveryState.retryCount} reconnections. ${e.message}`;
      }

      // Save the failed message for retry
      setLastFailedMessage(text);

      // Check if there's partial content we can show
      const partialContent = client.getPartialContent();
      const hasPartialContent = partialContent && partialContent.length > 0;

      setDebugInfo(`Error: ${errorMessage}`);
      // Update the in-flight assistant message instead of appending a new one
      // This avoids duplicating the assistant loading placeholder and ensures
      // the retry pop logic removes the correct items
      setMessages((m) => {
        const errorContent = hasPartialContent
          ? `${partialContent}\n\n---\n⚠️ Connection lost. Partial response shown above.\n\nError: ${errorMessage}`
          : `Error: ${errorMessage}\n\nTip: Check your internet connection and tap "Retry" to try again.`;
        // Find and update the last assistant message instead of appending
        const copy = [...m];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
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
        if (messageQueueEnabled && (!handsFree || handsFreePhaseRef.current !== 'paused')) {
          const nextMessage = messageQueue.peek(currentConversationId);
          if (nextMessage) {
            console.log('[ChatScreen] Processing next queued message:', nextMessage.id);
            // Use setTimeout to avoid recursive call stack issues
            setTimeout(() => {
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
      messageQueue.markFailed(currentConversationId, queuedMsg.id, 'No session available');
      setDebugInfo('Error: No session available');
      return;
    }

    setDebugInfo(`Processing queued message...`);

    const userMsg: ChatMessage = { role: 'user', content: text };
    // Use ref to get latest messages to avoid stale closure when called via setTimeout (PR review fix)
    const currentMessages = messagesRef.current;
    const messageCountBeforeTurn = currentMessages.length;
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
	          lastResponseEvents = [...update.responseEvents].sort((a, b) => a.ordinal - b.ordinal);
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
	          if (responseText && responseText !== midTurnLegacyResponseText && config.ttsEnabled !== false) {
	            midTurnLegacyResponseText = responseText;
		            speakAssistantResponse(responseText, 'queued mid-turn progress');
	          }
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
            if (copy[i].role === 'assistant') {
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
        messageQueue.markFailed(currentConversationId, queuedMsg.id, 'Session changed during processing');
        return;
      }
      if (activeRequestIdRef.current !== thisRequestId) {
        // Request superseded - mark as failed so user can retry
        messageQueue.markFailed(currentConversationId, queuedMsg.id, 'Request superseded');
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
          newMessages.push({
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
          });
        }
	        const finalTurnMessages = applyUserResponseToMessages(newMessages, finalResponseEvent?.text || lastUserResponse);

        setMessages((m) => {
          const beforePlaceholder = m.slice(0, messageCountBeforeTurn + 1);
          return [...beforePlaceholder, ...finalTurnMessages];
        });
      } else if (finalDisplayText) {
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'assistant') {
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
      if (!alreadySpokenMidTurn && ttsText && config.ttsEnabled !== false) {
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
      messageQueue.markFailed(currentConversationId, queuedMsg.id, e.message || 'Unknown error');
      setConversationState('blocked');
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e.message}` }]);
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
        if (nextMessage && (!handsFree || handsFreePhaseRef.current !== 'paused')) {
          console.log('[ChatScreen] Processing next queued message:', nextMessage.id);
          setTimeout(() => {
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

    const nextMessage = messageQueue.peek(currentConversationId);
    if (!nextMessage) return;

    if (handsFree && handsFreeController.state.phase === 'paused') return;

    console.log('[ChatScreen] Processing queue while idle, next message:', nextMessage.id);
    setTimeout(() => {
      if (handsFreeRef.current && handsFreePhaseRef.current === 'paused') {
        return;
      }
      messageQueue.markProcessing(currentConversationId, nextMessage.id);
      processQueuedMessage(nextMessage);
    }, 100);
  }, [currentConversationId, handsFree, handsFreeController.state.phase, messageQueue, processQueuedMessage, responding]);

	// Keep sendRef in sync with the latest send() implementation for speech callbacks.
	// IMPORTANT: This must live outside send() so voice callbacks can send even before any manual send() occurs.
	// We intentionally assign during render (not useEffect) so it is available immediately.
	sendRef.current = send;

	const isWebPlatform = Platform.OS === 'web';
	const composerAccessibilityHint = createChatComposerAccessibilityHint({
	  handsFree,
	  listening,
	  isWeb: isWebPlatform,
	});
	const micControlAccessibilityHint = createMicControlAccessibilityHint({
	  handsFree,
	  listening,
	  willCancel,
	});
	const voiceInputLiveRegionAnnouncement = createVoiceInputLiveRegionAnnouncement({
	  listening,
	  handsFree,
	  willCancel,
	  liveTranscript,
		  sttPreview,
		});

  const commandQuickStarts = useMemo(
    () => predefinedPrompts
      .filter(isSlashCommandPrompt)
      .slice(0, 4)
      .map((prompt) => ({
        id: prompt.id,
        title: prompt.name,
        content: prompt.content,
        source: 'command' as const,
      })),
    [predefinedPrompts]
  );

  const savedPromptQuickStarts = useMemo(
    () => {
      const prompts: QuickStartShortcut[] = predefinedPrompts
        .filter((prompt) => !isSlashCommandPrompt(prompt))
        .slice(0, 3)
        .map((prompt) => ({
          id: prompt.id,
          title: prompt.name,
          content: prompt.content,
          source: 'saved-prompt' as const,
        }));

      prompts.push({
        id: 'action-add-prompt',
        title: '+ Add Prompt',
        content: '',
        source: 'action',
        action: 'add-prompt',
      });
      return prompts;
    },
    [predefinedPrompts]
  );

  const starterPackQuickStarts = useMemo(
    () => STARTER_PACK_SHORTCUTS.slice(0, commandQuickStarts.length > 0 || savedPromptQuickStarts.length > 0 ? 4 : 6),
    [commandQuickStarts.length, savedPromptQuickStarts.length]
  );

  const quickStartSections = useMemo<QuickStartSection[]>(() => {
    const sections: QuickStartSection[] = [];

    if (commandQuickStarts.length > 0) {
      sections.push({
        id: 'commands',
        title: 'Custom Commands',
        items: commandQuickStarts,
      });
    }

    if (savedPromptQuickStarts.length > 0) {
      sections.push({
        id: 'saved-prompts',
        title: 'Saved Prompts',
        items: savedPromptQuickStarts,
      });
    }

    sections.push({
      id: 'starter-packs',
      title: 'Starter Packs',
      items: starterPackQuickStarts,
    });

    return sections;
  }, [commandQuickStarts, savedPromptQuickStarts, starterPackQuickStarts]);

  const composerHasContent = input.trim().length > 0 || pendingImages.length > 0;

  const sendComposerInput = useCallback(() => {
    const composedMessage = buildMessageWithPendingImages(input, pendingImages);
    if (!composedMessage.trim()) return;
    void send(composedMessage, { fromComposer: true });
  }, [input, pendingImages, send]);

  const queueComposerInput = useCallback(() => {
    const composedMessage = buildMessageWithPendingImages(input, pendingImages);
    if (!composedMessage.trim()) return;

    messageQueue.enqueue(currentConversationId, composedMessage);
    setInput('');
    setPendingImages([]);
    setDebugInfo('Message queued. Use Send Next when you are ready.');
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
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
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

	const handsFreeStatusSubtitle = useMemo(() => {
		if (!handsFree) return undefined;
		switch (handsFreeController.state.phase) {
			case 'sleeping':
				return `Say “${handsFreeWakePhrase}” to wake the assistant.`;
			case 'waking':
				return 'Listening for your next request.';
			case 'listening':
				return `Say “${handsFreeSleepPhrase}” to return to sleep.`;
			case 'processing':
				return 'Working on your request.';
			case 'speaking':
				return 'Speech recognition pauses while the assistant speaks.';
			case 'paused':
				return 'Tap the mic to resume handsfree listening.';
			case 'error':
				return handsFreeController.state.lastError || 'Voice recognition is recovering.';
			default:
				return handsFreeForegroundOnly
					? 'Handsfree works while Chat stays open in the foreground.'
					: undefined;
		}
	}, [
		handsFree,
		handsFreeController.state.lastError,
		handsFreeController.state.phase,
		handsFreeForegroundOnly,
		handsFreeSleepPhrase,
		handsFreeWakePhrase,
	]);

	const composerPlaceholder = handsFree
		? (handsFreeController.state.phase === 'paused'
			? 'Handsfree paused — tap mic to resume or type a message'
			: `Say “${handsFreeWakePhrase}” or type a message`)
		: (listening ? 'Listening…' : 'Type or hold mic');

	const micButtonLabel = handsFree
		? (handsFreeController.state.phase === 'paused' ? 'Resume' : 'Pause')
		: (listening ? '...' : 'Hold');

  const firstVisibleMessageIndex = Math.max(0, messages.length - visibleMessageCount);
  const visibleMessages = messages.slice(firstVisibleMessageIndex);
  const canLoadOlderMessages = firstVisibleMessageIndex > 0;



  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: insets.bottom, gap: spacing.xs }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          scrollEventThrottle={16}
        >
          {sessionStore.isLoadingMessages && messages.length === 0 && (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Loading messages from desktop"
              accessibilityState={{ busy: true }}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}
            >
              <Image
                source={isDark ? darkSpinner : lightSpinner}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
          )}
          {!sessionStore.isLoadingMessages && messages.length === 0 && (
            <View style={styles.chatHomeCard}>
              {quickStartSections.map((section) => (
                <View key={section.id} style={styles.chatHomeSection}>
                  <Text style={styles.chatHomeSectionTitle}>{section.title}</Text>
                  <View style={styles.chatHomeShortcutGrid}>
                    {section.items.map((item) => (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [
                          styles.chatHomeShortcutCard,
                          item.action === 'add-prompt' && styles.chatHomeShortcutCardAdd,
                          pressed && styles.chatHomeShortcutCardPressed,
                        ]}
                        onPress={() => {
                          if (item.action === 'add-prompt') {
                            setAddPromptModalVisible(true);
                          } else {
                            handleInsertQuickStartPrompt(item.content);
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(item.action === 'add-prompt' ? 'Add new prompt' : `${section.title}: ${item.title}`)}
                        accessibilityHint={item.action === 'add-prompt' ? 'Create a new saved prompt.' : 'Inserts this launcher text into the composer.'}
                      >
                        <Text style={[
                          styles.chatHomeShortcutTitle,
                          item.action === 'add-prompt' && styles.chatHomeShortcutTitleAdd,
                        ]} numberOfLines={2}>{item.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
          {canLoadOlderMessages && (
            <View style={styles.loadOlderContainer}>
              <Text style={styles.loadOlderText}>
                Showing latest {visibleMessages.length} of {messages.length} messages. Scroll up to load older messages.
              </Text>
            </View>
          )}
          {visibleMessages.map((m, visibleIndex) => {
            const i = firstVisibleMessageIndex + visibleIndex;
            // --- Tool-activity group handling ---
            const group = toolActivityGroups.groupByIndex.get(i);
            if (group) {
              const groupKey = `${group.startIndex}-${group.endIndex}`;
              const isGroupExpanded = expandedGroups[groupKey] ?? false;

              // Non-first message in a collapsed group: skip rendering
              if (i !== group.startIndex && !isGroupExpanded) {
                return null;
              }

              // First message in a collapsed group: render the group header
              if (i === group.startIndex && !isGroupExpanded) {
                return (
                  <Pressable
                    key={`group-${groupKey}`}
                    onPress={() => toggleGroupExpansion(group)}
                    accessibilityRole="button"
                    accessibilityLabel={`${group.count} tool activities, collapsed. Tap to expand.`}
                    accessibilityState={{ expanded: false }}
                    aria-expanded={false}
                    style={({ pressed }) => [
                      styles.toolActivityGroupCollapsed,
                      pressed && styles.toolActivityGroupPressed,
                    ]}
                  >
                    <Text style={styles.toolActivityGroupHeader}>
                      ▶ {group.count} tool {group.count === 1 ? 'activity' : 'activities'}
                    </Text>
                    {group.previewLines.map((line, lineIdx) => (
                      <Text
                        key={lineIdx}
                        style={styles.toolActivityGroupPreviewLine}
                        numberOfLines={1}
                      >
                        {line}
                      </Text>
                    ))}
                  </Pressable>
                );
              }

              // First message in an expanded group: render a collapse header before the message
              // (non-first messages in expanded groups fall through to normal rendering below)
            }

            const visibleMessageContent = getVisibleMessageContent(m);
            // Messages whose visible content comes from respond_to_user should
            // never be collapsed — they ARE the assistant's response to the user
            const hasRespondToUserContent = !!getRespondToUserContentFromMessage(m);
            const shouldCollapse = m.role === 'assistant'
              ? shouldCollapseMessage(visibleMessageContent)
              : shouldCollapseMessage(m.content, m.toolCalls, m.toolResults);
            const effectiveShouldCollapse = hasRespondToUserContent ? false : shouldCollapse;
            // expandedMessages is auto-updated via useEffect to expand the last assistant message
            // and persist the expansion state so it doesn't collapse when new messages arrive
            const isExpanded = expandedMessages[i] ?? false;
            const hasToolMetadata =
              (m.toolCalls?.length ?? 0) > 0 ||
              (m.toolResults?.length ?? 0) > 0;
            const shouldShowExpandedContent = visibleMessageContent.length > 0 && (isExpanded || !effectiveShouldCollapse);
            const shouldShowCollapsedTextPreview =
              visibleMessageContent.length > 0 &&
              !isExpanded &&
              effectiveShouldCollapse;
            const canSpeakVisibleContent =
              m.role === 'assistant' &&
              visibleMessageContent.trim().length > 0 &&
              config.ttsEnabled !== false &&
              (shouldShowExpandedContent || shouldShowCollapsedTextPreview);

            const toolCalls = m.toolCalls ?? [];
            const toolResults = m.toolResults ?? [];
            // Filter out meta-tools from display (respond_to_user, mark_work_complete)
            // since their content is already shown as visible message text
            const displayToolEntries = toolCalls.reduce(
              (entries, toolCall, origIdx) => {
                if (HIDDEN_META_TOOLS.has(toolCall.name)) {
                  return entries;
                }

                entries.push({
                  toolCall,
                  origIdx,
                  result: toolResults[origIdx],
                });
                return entries;
              },
              [] as Array<{
                toolCall: NonNullable<ChatMessage['toolCalls']>[number];
                origIdx: number;
                result: NonNullable<ChatMessage['toolResults']>[number] | undefined;
              }>
            );
            const fallbackToolEntries =
              displayToolEntries.length === 0 && toolResults.length > 0
                ? toolResults.map((result, idx) => ({
                    toolCall: {
                      name: 'tool_call',
                      arguments: {},
                    },
                    origIdx: idx,
                    result,
                  }))
                : [];
            const renderedToolEntries = fallbackToolEntries.length > 0
              ? fallbackToolEntries
              : displayToolEntries;
            const displayToolCallCount = renderedToolEntries.length;
            const toolResultCount = toolResults.length;
            const hasToolResults = renderedToolEntries.some(entry => !!entry.result);
            const allSuccess =
              hasToolResults && renderedToolEntries.every(entry => entry.result?.success === true);
            const hasErrors = renderedToolEntries.some(entry => entry.result?.success === false);
            // isPending is true when any displayed tool call has not received its result yet.
            const isPending =
              renderedToolEntries.some(entry => !entry.result && entry.origIdx >= toolResultCount);

            // Skip empty messages: no visible content AND no tool calls to display
            // Also skip messages that only have toolResults but no toolCalls (raw result blobs)
            if (visibleMessageContent.trim().length === 0 && displayToolCallCount === 0) {
              return null;
            }

            // Determine if this message needs group expand/collapse chrome
            const isFirstInExpandedGroup = group && i === group.startIndex && (expandedGroups[`${group.startIndex}-${group.endIndex}`] ?? false);
            const isLastInExpandedGroup = group && i === group.endIndex && (expandedGroups[`${group.startIndex}-${group.endIndex}`] ?? false);

            return (
              <View key={i}>
                {/* Expanded group collapse header */}
                {isFirstInExpandedGroup && (
                  <Pressable
                    onPress={() => toggleGroupExpansion(group!)}
                    accessibilityRole="button"
                    accessibilityLabel={`Collapse ${group!.count} tool activities`}
                    accessibilityState={{ expanded: true }}
                    aria-expanded={true}
                    style={({ pressed }) => [
                      styles.toolActivityGroupCollapsed,
                      pressed && styles.toolActivityGroupPressed,
                    ]}
                  >
                    <Text style={styles.toolActivityGroupHeader}>
                      ▼ {group!.count} tool {group!.count === 1 ? 'activity' : 'activities'}
                    </Text>
                  </Pressable>
                )}
              <View
                style={[
                  styles.msg,
                  m.role === 'user' ? styles.user : styles.assistant,
                ]}
              >
                {/* Compact message header - only for non-tool-only messages (tool-only uses the tool compact row) */}
                {shouldCollapse && !shouldTreatMessageAsToolOnly(m) && (
                  <Pressable
                    onPress={() => toggleMessageExpansion(i)}
                    accessibilityRole="button"
                    accessibilityLabel={createExpandCollapseAccessibilityLabel('message', isExpanded)}
                    accessibilityHint={isExpanded ? 'Collapse message' : 'Expand message'}
                    accessibilityState={{ expanded: isExpanded }}
                    aria-expanded={isExpanded}
                    style={({ pressed }) => [
                      styles.messageHeader,
                      styles.messageHeaderClickable,
                      pressed && styles.messageHeaderPressed,
                    ]}
                  >
                    <View style={styles.expandButton}>
                      <Text style={styles.expandButtonText}>
                        {isExpanded ? '▲' : '▼'}
                      </Text>
                    </View>
                  </Pressable>
                )}

                {m.role === 'assistant' && (!m.content || m.content.length === 0) && !m.toolCalls && !m.toolResults ? (
                  <View
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel="Assistant is thinking"
                    accessibilityState={{ busy: true }}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Image
                      source={isDark ? darkSpinner : lightSpinner}
                      style={{ width: 14, height: 14 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <>
                    {shouldShowExpandedContent ? (
                      <View style={m.role === 'assistant' ? styles.assistantMessageRow : undefined}>
                        <View style={m.role === 'assistant' ? styles.assistantMessageBody : undefined}>
                          <MarkdownRenderer content={visibleMessageContent} />
                        </View>
                        {canSpeakVisibleContent && (
                          <TouchableOpacity
                            onPress={() => speakMessage(i, visibleMessageContent)}
                            style={[
                              styles.speakButton,
                              speakingMessageIndex === i && styles.speakButtonActive,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={speakingMessageIndex === i ? 'Stop reading' : 'Read aloud'}
                          >
                            <Text style={[
                              styles.speakButtonText,
                              speakingMessageIndex === i && styles.speakButtonTextActive,
                            ]}>
                              {speakingMessageIndex === i ? '⏹' : '🔊'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : shouldShowCollapsedTextPreview ? (
                      <View style={m.role === 'assistant' ? styles.assistantMessageRow : undefined}>
                        <Text
                          style={styles.collapsedMessagePreview}
                          numberOfLines={1}
                        >
                          {getCollapsedMessagePreview(visibleMessageContent)}
                        </Text>
                        {canSpeakVisibleContent && (
                          <TouchableOpacity
                            onPress={() => speakMessage(i, visibleMessageContent)}
                            style={[
                              styles.speakButton,
                              speakingMessageIndex === i && styles.speakButtonActive,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={speakingMessageIndex === i ? 'Stop reading' : 'Read aloud'}
                          >
                            <Text style={[
                              styles.speakButtonText,
                              speakingMessageIndex === i && styles.speakButtonTextActive,
                            ]}>
                              {speakingMessageIndex === i ? '⏹' : '🔊'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null}

                    {/* Unified Tool Execution Display - only show when there are displayable tool calls */}
                    {displayToolCallCount > 0 && (
                      <>
                        {/* Collapsed view - one line per tool call with useful info */}
                        {!isExpanded && (
                          <Pressable
                            onPress={() => toggleMessageExpansion(i)}
                            accessibilityRole="button"
                            accessibilityLabel={createExpandCollapseAccessibilityLabel('tool execution details', false)}
                            accessibilityHint="Expands this tool execution summary"
                            accessibilityState={{ expanded: false }}
                            aria-expanded={false}
                            style={({ pressed }) => [
                              styles.toolCallCompactContainer,
                              pressed && styles.toolCallCompactPressed,
                            ]}
                          >
                            {renderedToolEntries.map(({ toolCall, origIdx, result: tcResult }, tcIdx) => {
                              const tcPending = !tcResult && origIdx >= toolResultCount;
                              const tcSuccess = tcResult?.success === true;
                              const tcError = tcResult?.success === false;
                              const argPreview = formatArgumentsPreview(toolCall.arguments);
                              return (
                                <View key={tcIdx} style={styles.toolCallCompactLine}>
                                  <Text style={[
                                    styles.toolCallCompactStatus,
                                    tcPending && styles.toolCallCompactStatusPending,
                                    tcSuccess && styles.toolCallCompactStatusSuccess,
                                    tcError && styles.toolCallCompactStatusError,
                                  ]}>
                                    {tcPending ? '⏳' : tcSuccess ? '✓' : '✗'}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.toolCallCompactName,
                                      tcPending && styles.toolCallCompactNamePending,
                                      tcSuccess && styles.toolCallCompactNameSuccess,
                                      tcError && styles.toolCallCompactNameError,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {toolCall.name}{argPreview ? ` · ${argPreview}` : ''}
                                  </Text>
                                </View>
                              );
                            })}
                          </Pressable>
                        )}

                        {/* Expanded view - each tool call with its own params + result */}
                        {isExpanded && (
                          <View style={[
                            { position: 'relative' as const },
                          ]}>
                          {/* Collapse button at top of expanded view */}
                          <Pressable
                            onPress={() => toggleMessageExpansion(i)}
                            accessibilityRole="button"
                            accessibilityLabel="Collapse tool execution details"
                            accessibilityHint="Collapse back to compact view"
                            style={({ pressed }) => [
                              styles.toolCallCompactContainer,
                              pressed && styles.toolCallCompactPressed,
                              { marginBottom: 4 },
                            ]}
                          >
                            <Text style={styles.toolCallCompactStatus}>▲</Text>
                            <Text style={styles.toolCallCompactName}>
                              Collapse {displayToolCallCount} tool {displayToolCallCount === 1 ? 'call' : 'calls'}
                            </Text>
                          </Pressable>
                          <View style={[
                            styles.toolExecutionCard,
                            isPending && styles.toolExecutionPending,
                            allSuccess && styles.toolExecutionSuccess,
                            hasErrors && styles.toolExecutionError,
                          ]}>
                            {renderedToolEntries.map(({ toolCall, origIdx, result }, idx) => {
                              const isResultPending = !result && origIdx >= toolResultCount;
                              // Use message id or fallback to array index to ensure stable, unique keys
                              // that won't collide when m.id is undefined (which is common)
                              const stableMessageKey = m.id ?? String(i);
                              const toolCallKey = `${stableMessageKey}-${origIdx}`;
                              const isToolCallFullyExpanded = expandedToolCalls[toolCallKey] ?? false;
                              return (
                                <View key={idx} style={styles.toolCallSection}>
                                  {/* Tool name heading - tappable to toggle full expansion */}
                                  <Pressable
                                    onPress={() => toggleToolCallExpansion(stableMessageKey, idx)}
                                    style={({ pressed }) => [
                                      styles.toolCallHeader,
                                      pressed && styles.toolCallHeaderPressed,
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel={createExpandCollapseAccessibilityLabel(`${toolCall.name} tool details`, isToolCallFullyExpanded)}
                                    accessibilityState={{ expanded: isToolCallFullyExpanded }}
                                    aria-expanded={isToolCallFullyExpanded}
                                    accessibilityHint={isToolCallFullyExpanded ? 'Collapse tool details' : 'Expand to show full input/output'}
                                  >
                                    <Text style={styles.toolName}>{toolCall.name}</Text>
                                    <Text style={styles.toolCallExpandHint}>
                                      {isToolCallFullyExpanded ? '▼ Collapse' : '▶ Full Details'}
                                    </Text>
                                  </Pressable>

                                  {/* Parameters */}
                                  {toolCall.arguments && (
                                    <View style={styles.toolParamsSection}>
                                      <Text style={styles.toolSectionLabel}>Input:</Text>
                                      <ScrollView
                                        style={isToolCallFullyExpanded ? styles.toolParamsScrollExpanded : styles.toolParamsScroll}
                                        nestedScrollEnabled
                                      >
                                        <Text style={styles.toolParamsCode}>
                                          {formatToolArguments(toolCall.arguments)}
                                        </Text>
                                      </ScrollView>
                                    </View>
                                  )}

                                  {/* Result for this specific tool call */}
                                  {result ? (
                                    <View style={styles.toolResultItem}>
                                      <View style={styles.toolResultHeader}>
                                        <Text style={styles.toolSectionLabel}>Output:</Text>
                                        <Text style={[
                                          styles.toolResultBadge,
                                          result.success ? styles.toolResultBadgeSuccess : styles.toolResultBadgeError
                                        ]}>
                                          {result.success ? '✅ OK' : '❌ Error'}
                                        </Text>
                                        <Text style={styles.toolResultCharCount}>
                                          {(result.content?.length || 0).toLocaleString()} chars
                                        </Text>
                                      </View>
                                      <ScrollView
                                        style={isToolCallFullyExpanded ? styles.toolResultScrollExpanded : styles.toolResultScroll}
                                        nestedScrollEnabled
                                      >
                                        <Text style={styles.toolResultCode}>
                                          {result.content || 'No content returned'}
                                        </Text>
                                      </ScrollView>
                                      {result.error && (
                                        <View style={styles.toolResultErrorSection}>
                                          <Text style={styles.toolResultErrorLabel}>Error:</Text>
                                          <Text style={styles.toolResultErrorText}>{result.error}</Text>
                                        </View>
                                      )}
                                    </View>
                                  ) : isResultPending ? (
                                    <Text style={styles.toolResponsePendingText}>⏳ Waiting...</Text>
                                  ) : null}
                                </View>
                              );
                            })}
                            {/* Show message if no displayable tool calls */}
                            {displayToolCallCount === 0 && (
                              <Text style={styles.toolResponsePendingText}>No tool calls</Text>
                            )}
                          </View>
                          {/* Collapse button at bottom of expanded view for easy access */}
                          <Pressable
                            onPress={() => toggleMessageExpansion(i)}
                            accessibilityRole="button"
                            accessibilityLabel="Collapse tool execution details"
                            accessibilityHint="Collapse back to compact view"
                            style={({ pressed }) => [
                              styles.toolCallCompactContainer,
                              pressed && styles.toolCallCompactPressed,
                              { marginTop: 4 },
                            ]}
                          >
                            <Text style={styles.toolCallCompactStatus}>▲</Text>
                            <Text style={styles.toolCallCompactName}>
                              Collapse
                            </Text>
                          </Pressable>
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
                {/* Expanded group collapse footer */}
                {isLastInExpandedGroup && (
                  <Pressable
                    onPress={() => toggleGroupExpansion(group!)}
                    accessibilityRole="button"
                    accessibilityLabel={`Collapse ${group!.count} tool activities`}
                    style={({ pressed }) => [
                      styles.toolActivityGroupCollapsed,
                      pressed && styles.toolActivityGroupPressed,
                    ]}
                  >
                    <Text style={styles.toolActivityGroupHeader}>
                      ▲ Collapse {group!.count} tool {group!.count === 1 ? 'activity' : 'activities'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {connectionState && connectionState.status === 'reconnecting' && (
            <View style={styles.connectionBanner}>
              <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: spacing.sm }} />
              <Text style={styles.connectionBannerText}>
                {formatConnectionStatus(connectionState)}
              </Text>
            </View>
          )}
          {debugInfo && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}
	          {handsFreeDebugEnabled && voiceEvents.length > 0 && (
	            <View style={styles.debugInfo}>
	              <Text style={styles.debugText}>Voice debug</Text>
	              {voiceEvents.slice(0, 6).map((entry) => (
	                <Text key={entry.id} style={styles.debugText}>
	                  {formatVoiceDebugEntry(entry)}
	                </Text>
	              ))}
	            </View>
	          )}
        </ScrollView>
        {/* Respond-to-user history panel - sticky at bottom of conversation */}
        {respondToUserHistory.length > 0 && (
          <ResponseHistoryPanel
            responses={respondToUserHistory}
            ttsRate={config.ttsRate ?? 1.0}
            ttsPitch={config.ttsPitch ?? 1.0}
            ttsVoiceId={config.ttsVoiceId}
          />
        )}
        {/* Scroll to bottom button - appears when user scrolls up */}
        {!shouldAutoScroll && (
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { bottom: 80 + insets.bottom }]}
            onPress={() => {
              setShouldAutoScroll(true);
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Scroll to bottom"
            accessibilityHint="Scrolls to the latest messages"
          >
            <Text style={styles.scrollToBottomText}>↓</Text>
          </TouchableOpacity>
        )}
		        {listening && (
		          <View style={[styles.overlay, { bottom: 72 + insets.bottom }]} pointerEvents="none">
		            <View style={styles.overlayCard}>
		              <Text style={styles.overlayText}>
		                {handsFree ? 'Listening...' : (willCancel ? 'Release to edit' : 'Release to send')}
		              </Text>
		              {!!liveTranscript && (
		                <Text style={styles.overlayTranscript} numberOfLines={3}>
		                  {liveTranscript}
		                </Text>
		              )}
		            </View>
		          </View>
		        )}
        {/* Message Queue Panel */}
        {messageQueueEnabled && queuedMessages.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
            <MessageQueuePanel
              conversationId={currentConversationId}
              messages={queuedMessages}
              onRemove={(messageId) => messageQueue.removeFromQueue(currentConversationId, messageId)}
              onUpdate={(messageId, text) => messageQueue.updateText(currentConversationId, messageId, text)}
              onRetry={(messageId) => {
                messageQueue.resetToPending(currentConversationId, messageId);
                // If not already processing, trigger queue processing
                if (!responding) {
                  handleProcessNextQueuedMessage();
                }
              }}
              onProcessNext={handleProcessNextQueuedMessage}
              canProcessNext={!!nextQueuedMessage}
              onClear={() => messageQueue.clearQueue(currentConversationId)}
            />
          </View>
        )}
        {/* Connection status banner - shows when reconnecting */}
        {connectionState && connectionState.status === 'reconnecting' && (
          <View style={[styles.connectionBanner, styles.connectionBannerReconnecting]}>
            <View style={styles.connectionBannerContent}>
              <Text style={styles.connectionBannerIcon}>🔄</Text>
              <View style={styles.connectionBannerTextContainer}>
                <Text style={styles.connectionBannerText}>
                  Reconnecting... (attempt {connectionState.retryCount})
                </Text>
                {connectionState.lastError && (
                  <Text style={styles.connectionBannerSubtext} numberOfLines={1}>
                    {connectionState.lastError}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
        {/* Retry banner - shows when there's a failed message that can be retried */}
        {lastFailedMessage && !responding && (
          <View style={[styles.connectionBanner, styles.connectionBannerFailed]}>
            <View style={styles.connectionBannerContent}>
              <Text style={styles.connectionBannerIcon}>⚠️</Text>
              <View style={styles.connectionBannerTextContainer}>
                <Text style={styles.connectionBannerText}>Message failed to send</Text>
                <Text style={styles.connectionBannerSubtext} numberOfLines={1}>
                  Tap retry to try again
                </Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={async () => {
                  const messageToRetry = lastFailedMessage;
                  setLastFailedMessage(null);

                  // Use the recovery conversation ID if available, so the retry resumes
                  // the same server-created conversation when the first attempt failed mid-stream
                  const retryClient = getSessionClient();
                  const recoveryConversationId = retryClient?.getRecoveryConversationId();

                  // Try to recover conversation state from server first (fixes #815)
                  // If the server already processed the message, we should sync the state
                  // instead of re-sending the message
                  if (recoveryConversationId && retryClient) {
                    console.log('[ChatScreen] Retry: Checking server conversation state:', recoveryConversationId);
                    try {
                      const serverConversation = await retryClient.getConversation(recoveryConversationId);
                      if (serverConversation && serverConversation.messages.length > 0) {
                        // Check if the server has the user's message and a response
                        const serverMessages = serverConversation.messages;

                        // Find the index of the last user message
                        let lastUserMsgIndex = -1;
                        for (let i = serverMessages.length - 1; i >= 0; i--) {
                          if (serverMessages[i].role === 'user') {
                            lastUserMsgIndex = i;
                            break;
                          }
                        }

                        // Check if there's ANY assistant message with content after the last user message
                        // This handles cases where tool messages follow the assistant response
                        let hasAssistantResponse = false;
                        if (lastUserMsgIndex >= 0) {
                          for (let i = lastUserMsgIndex + 1; i < serverMessages.length; i++) {
                            if (serverMessages[i].role === 'assistant' && serverMessages[i].content) {
                              hasAssistantResponse = true;
                              break;
                            }
                          }
                        }

                        // If there's an assistant response after the last user message, server already processed the request
                        if (hasAssistantResponse) {
                          console.log('[ChatScreen] Retry: Server already has response, syncing state');

                          // Update the server conversation ID
                          await sessionStore.setServerConversationId(recoveryConversationId);

                          // Convert server messages to ChatMessage format, filtering out tool messages
                          // and merging their toolResults into the preceding assistant message
                          const recoveredMessages: ChatMessage[] = [];
                          for (const msg of serverMessages) {
                            // Only include 'user' and 'assistant' roles
                            if (msg.role === 'user' || msg.role === 'assistant') {
                              recoveredMessages.push({
                                id: msg.id,
                                role: msg.role,
                                content: msg.content,
                                toolCalls: msg.toolCalls,
                                toolResults: msg.toolResults,
                              });
                            } else if (msg.role === 'tool' && recoveredMessages.length > 0) {
                              // Merge tool message toolResults into the preceding assistant message
                              const lastMessage = recoveredMessages[recoveredMessages.length - 1];
                              if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
                                const hasToolResults = msg.toolResults && msg.toolResults.length > 0;

                                if (hasToolResults) {
                                  // Merge toolResults into the existing assistant message
                                  lastMessage.toolResults = [
                                    ...(lastMessage.toolResults || []),
                                    ...(msg.toolResults || []),
                                  ];
                                }
                              }
                            }
                          }

                          // Replace local messages with server state
                          setMessages(recoveredMessages);

                          // Also persist to session store
                          await sessionStore.setMessages(recoveredMessages);

                          console.log('[ChatScreen] Retry: Successfully recovered', recoveredMessages.length, 'messages from server');
                          return; // Don't retry, we've recovered the state
                        }
                      }
                    } catch (error) {
                      console.log('[ChatScreen] Retry: Could not fetch server state, will retry message:', error);
                    }

                    // If we couldn't recover, set the conversation ID for the retry
                    console.log('[ChatScreen] Retry: Using recovery conversationId:', recoveryConversationId);
                    await sessionStore.setServerConversationId(recoveryConversationId);
                  }

                  // Remove the last error message before retrying
                  setMessages((m) => {
                    // Remove the last assistant message (error) and user message
                    const newMessages = [...m];
                    if (newMessages.length >= 2) {
                      newMessages.pop(); // Remove error message
                      newMessages.pop(); // Remove user message
                    }
                    return newMessages;
                  });
                  // Use setTimeout to ensure setMessages completes before send() reads the updated state.
                  // React batches state updates, so send() would otherwise read stale messages.
                  setTimeout(() => send(messageToRetry), 0);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
		        <View style={[styles.inputArea, { paddingBottom: 12 + insets.bottom }]}>
	          {!!sttPreview && (
	            <View style={styles.sttPreviewBox}>
	              <Text style={styles.sttPreviewLabel}>STT preview</Text>
		              <Text style={styles.sttPreviewText}>{sttPreview}</Text>
	            </View>
	          )}
	          {pendingImages.length > 0 && (
	            <ScrollView
	              horizontal
	              showsHorizontalScrollIndicator={false}
	              contentContainerStyle={styles.pendingImagesRow}
	            >
	              {pendingImages.map((image) => (
	                <View key={image.id} style={styles.pendingImageCard}>
	                  <Image source={{ uri: image.previewUri }} style={styles.pendingImagePreview} />
	                  <TouchableOpacity
	                    style={styles.pendingImageRemoveButton}
	                    onPress={() => removePendingImage(image.id)}
	                    activeOpacity={0.8}
	                  >
	                    <Text style={styles.pendingImageRemoveButtonText}>✕</Text>
	                  </TouchableOpacity>
	                </View>
	              ))}
	            </ScrollView>
	          )}
          {handsFree && (
            <>
              <View style={styles.handsFreeStatusRow}>
                <HandsFreeStatusChip
                  phase={handsFreeController.state.phase}
                  label={handsFreeController.statusLabel}
                  subtitle={handsFreeStatusSubtitle}
                />
              </View>
              <View style={styles.handsFreeControlsRow}>
                {handsFreeController.state.phase === 'sleeping' ? (
                  <TouchableOpacity
                    style={styles.handsFreeControlButton}
                    onPress={handsFreeController.wakeByUser}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.handsFreeControlButtonText}>Wake</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.handsFreeControlButton}
                    onPress={handsFreeController.sleepByUser}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.handsFreeControlButtonText}>Sleep</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.handsFreeControlButton}
                  onPress={() => {
                    if (handsFreeController.state.phase === 'paused') {
                      handsFreeController.resumeByUser();
                      setDebugInfo('Handsfree resumed.');
                      return;
                    }
                    handsFreeController.pauseByUser();
                    Speech.stop();
                    void stopRecognitionOnly();
                    setDebugInfo('Handsfree paused.');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.handsFreeControlButtonText}>
                    {handsFreeController.state.phase === 'paused' ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
	          {/* Top row: TTS toggle, text input, send button */}
	          <View style={styles.inputRow}>
	            <TouchableOpacity
	              style={[styles.ttsToggle, pendingImages.length > 0 && styles.ttsToggleOn]}
	              onPress={handlePickImages}
	              activeOpacity={0.7}
	              accessibilityRole="button"
	              accessibilityLabel="Attach images"
	              accessibilityHint="Select one or more images to include with your next message."
	            >
	              <Text style={styles.ttsToggleText}>🖼️</Text>
	            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ttsToggle, ttsEnabled && styles.ttsToggleOn]}
              onPress={toggleTts}
              activeOpacity={0.7}
              accessibilityRole="switch"
              accessibilityState={{ checked: ttsEnabled }}
              accessibilityLabel={createSwitchAccessibilityLabel('Text-to-Speech')}
              accessibilityHint="Toggles spoken playback for assistant responses."
              aria-checked={ttsEnabled}
            >
              <Text style={styles.ttsToggleText}>{ttsEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
	            {!handsFree && (
	              <TouchableOpacity
	                style={[styles.ttsToggle, willCancel && styles.ttsToggleOn]}
		                onPress={() => setWillCancel((current) => !current)}
	                activeOpacity={0.7}
	                accessibilityRole="switch"
		                aria-checked={willCancel}
	                accessibilityState={{ checked: willCancel }}
	                accessibilityLabel="Edit before send"
	                accessibilityHint="When enabled, releasing the mic inserts the transcript into the input so you can edit before sending."
	              >
	                <Text style={styles.ttsToggleText}>✏️</Text>
	              </TouchableOpacity>
	            )}
            <TextInput
	              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={handleInputChange}
              onKeyPress={handleInputKeyPress}
              accessibilityLabel={createTextInputAccessibilityLabel('Message composer')}
              accessibilityHint={composerAccessibilityHint}
              aria-describedby={isWebPlatform ? CHAT_COMPOSER_HINT_NATIVE_ID : undefined}
	              placeholder={composerPlaceholder}
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
            />
            {isWebPlatform && (
              <Text nativeID={CHAT_COMPOSER_HINT_NATIVE_ID} style={styles.visuallyHiddenComposerHint}>
                {composerAccessibilityHint}
              </Text>
            )}
	            {isWebPlatform && (
	              <Text
	                nativeID={CHAT_VOICE_STATUS_LIVE_REGION_NATIVE_ID}
	                style={styles.visuallyHiddenComposerHint}
	                accessibilityLiveRegion="polite"
	                aria-live="polite"
	              >
	                {voiceInputLiveRegionAnnouncement}
	              </Text>
	            )}
            {handsFree && messageQueueEnabled && (
              <TouchableOpacity
                style={[styles.queueButton, !composerHasContent && styles.sendButtonDisabled]}
                onPress={queueComposerInput}
                activeOpacity={0.7}
                disabled={!composerHasContent}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Queue message')}
                accessibilityHint="Adds your typed text and attached images to the queued-messages list without sending immediately."
                accessibilityState={{ disabled: !composerHasContent }}
              >
                <Text style={styles.queueButtonText}>Queue</Text>
              </TouchableOpacity>
            )}
	            <TouchableOpacity
	              style={[styles.sendButton, !composerHasContent && styles.sendButtonDisabled]}
	              onPress={sendComposerInput}
	              activeOpacity={0.7}
	              disabled={!composerHasContent}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Send message')}
	              accessibilityHint="Sends your typed text and any attached images to the selected agent."
              accessibilityState={{ disabled: !composerHasContent }}
	            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
          {/* Large mic button - ~20% of screen height */}
          <View
            ref={micButtonRef}
            style={styles.micWrapper}
          >
            <Pressable
              style={[
                styles.mic,
                listening && styles.micOn,
                // @ts-ignore - Web-only CSS to disable long-press selection/callouts
                Platform.OS === 'web' && { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'manipulation' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={createMicControlAccessibilityLabel()}
              accessibilityHint={micControlAccessibilityHint}
              accessibilityState={{ busy: listening }}
              aria-busy={listening}
	              onPressIn={!handsFree ? handlePushToTalkPressIn : undefined}
	              onPressOut={!handsFree ? handlePushToTalkPressOut : undefined}
              onPress={handsFree ? () => {
					if (handsFreeController.state.phase === 'paused') {
						handsFreeController.resumeByUser();
						setDebugInfo('Handsfree resumed.');
					} else {
						handsFreeController.pauseByUser();
						Speech.stop();
						void stopRecognitionOnly();
						setDebugInfo('Handsfree paused.');
					}
              } : undefined}
            >
              <Text style={styles.micText} selectable={false}>
                {listening ? '🎙️' : '🎤'}
              </Text>
              <Text style={[styles.micLabel, listening && styles.micLabelOn]} selectable={false}>
	                {micButtonLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <AgentSelectorSheet
        visible={agentSelectorVisible}
        onClose={() => setAgentSelectorVisible(false)}
      />

      <Modal
        visible={addPromptModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddPromptModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Prompt</Text>

              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newPromptName}
                onChangeText={setNewPromptName}
                placeholder="e.g., Code Review Request"
                placeholderTextColor={theme.colors.mutedForeground}
              />

              <Text style={styles.modalLabel}>Prompt Content</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                value={newPromptContent}
                onChangeText={setNewPromptContent}
                placeholder="Enter your prompt text..."
                placeholderTextColor={theme.colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setAddPromptModalVisible(false)}
                  disabled={isSavingPrompt}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!newPromptName.trim() || !newPromptContent.trim() || isSavingPrompt) && styles.modalSaveButtonDisabled
                  ]}
                  onPress={handleSaveNewPrompt}
                  disabled={!newPromptName.trim() || !newPromptContent.trim() || isSavingPrompt}
                >
                  {isSavingPrompt ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                  ) : (
                    <Text style={styles.modalSaveButtonText}>Add Prompt</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme, screenHeight: number) {
  const headerActionButton = createMinimumTouchTargetStyle();
  const headerEdgeActionButton = createMinimumTouchTargetStyle({ horizontalPadding: 16 });
  return StyleSheet.create({
    headerActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    headerConversationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginHorizontal: 4,
    },
    headerConversationChipText: {
      ...theme.typography.caption,
      fontWeight: '700',
    },
    headerActionButton,
    headerEdgeActionButton,
    headerPinButton: {
      ...createMinimumTouchTargetStyle({ horizontalPadding: 10, verticalPadding: 8 }),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    headerPinButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '18',
    },
    headerPinButtonText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontWeight: '600',
    },
    headerPinButtonTextActive: {
      color: theme.colors.primary,
    },
    loadOlderContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    loadOlderText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
    },
    // Compact desktop-style messages: left-border accent, full width, no bubbles
    msg: {
      paddingLeft: spacing.xs,
      paddingVertical: 2,
      marginBottom: 0,
      width: '100%',
    },
    user: {
      // User messages: subtle left border accent
      borderLeftWidth: 2,
      borderLeftColor: hexToRgba(theme.colors.info, 0.4),
      paddingLeft: spacing.xs,
    },
    assistant: {
      // Assistant messages: subtle left-border accent like desktop
      borderLeftWidth: 2,
      borderLeftColor: hexToRgba(theme.colors.mutedForeground, 0.3),
      paddingLeft: spacing.xs,
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 2,
      marginBottom: 1,
      paddingVertical: 1,
      marginHorizontal: -1,
      paddingHorizontal: 1,
      borderRadius: radius.sm,
    },
    messageHeaderClickable: {
      // Visual hint that header is clickable
      minHeight: 44,
      justifyContent: 'center',
    },
    messageHeaderPressed: {
      backgroundColor: theme.colors.muted,
    },
    expandButton: {
      marginLeft: 'auto',
      paddingHorizontal: 2,
      paddingVertical: 1,
    },
    expandButtonText: {
      fontSize: 8,
      color: theme.colors.primary,
      fontWeight: '500',
    },

    inputArea: {
      borderTopWidth: theme.hairline,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    pendingImagesRow: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: 2,
      gap: spacing.xs,
    },
    pendingImageCard: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      backgroundColor: theme.colors.muted,
      position: 'relative',
    },
    pendingImagePreview: {
      width: '100%',
      height: '100%',
    },
    pendingImageRemoveButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pendingImageRemoveButtonText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 12,
    },
    sttPreviewBox: {
      marginHorizontal: spacing.sm,
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    sttPreviewLabel: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginBottom: 2,
      fontWeight: '600',
    },
    sttPreviewText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    handsFreeStatusRow: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
    },
    handsFreeControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
    },
    handsFreeControlButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      minHeight: 36,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handsFreeControlButtonText: {
      color: theme.colors.foreground,
      fontWeight: '600',
      fontSize: 12,
    },
    chatHomeCard: {
      marginHorizontal: spacing.sm,
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      gap: spacing.sm,
    },
    chatHomeSection: {
      gap: spacing.sm,
    },
    chatHomeSectionTitle: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontWeight: '600',
    },
    chatHomeShortcutGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chatHomeShortcutCard: {
      minHeight: 56,
      minWidth: '47%',
      flexGrow: 1,
      flexBasis: '47%',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
    },
    chatHomeShortcutCardAdd: {
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    chatHomeShortcutCardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    chatHomeShortcutTitle: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    chatHomeShortcutTitleAdd: {
      color: theme.colors.primary,
    },
    input: {
      ...theme.input,
      flex: 1,
      maxHeight: 120,
    },
    visuallyHiddenComposerHint: {
      position: 'absolute',
      left: -10000,
      width: 1,
      height: 1,
    },
    micWrapper: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
    },
    mic: {
      width: '100%' as any,
      height: 56,
      flexDirection: 'row',
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    micOn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    micText: {
      fontSize: 20,
    },
    micLabel: {
      fontSize: 15,
      color: theme.colors.mutedForeground,
      fontWeight: '600',
    },
    micLabelOn: {
      color: theme.colors.primaryForeground,
    },
    ttsToggle: {
	      width: 44,
	      height: 44,
	      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ttsToggleOn: {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.primary,
    },
    ttsToggleText: {
      fontSize: 14,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      minHeight: 44,
      minWidth: 64,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    queueButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      minHeight: 44,
      minWidth: 64,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    queueButtonText: {
      color: theme.colors.foreground,
      fontWeight: '600',
      fontSize: 13,
    },
    sendButtonText: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
      fontSize: 13,
    },
    debugInfo: {
      backgroundColor: theme.colors.muted,
      padding: spacing.sm,
      margin: spacing.sm,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    debugText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    connectionBanner: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    connectionBannerReconnecting: {
      backgroundColor: hexToRgba(theme.colors.info, 0.1),
      borderColor: hexToRgba(theme.colors.info, 0.3),
    },
    connectionBannerFailed: {
      backgroundColor: hexToRgba(theme.colors.destructive, 0.1),
      borderColor: hexToRgba(theme.colors.destructive, 0.3),
    },
    connectionBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectionBannerIcon: {
      fontSize: 16,
      marginRight: spacing.sm,
    },
    connectionBannerTextContainer: {
      flex: 1,
    },
    connectionBannerText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.foreground,
    },
    connectionBannerSubtext: {
      fontSize: 11,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      marginLeft: spacing.sm,
    },
    retryButtonText: {
      color: theme.colors.primaryForeground,
      fontSize: 13,
      fontWeight: '600',
    },
    scrollToBottomButton: {
      position: 'absolute',
      right: spacing.lg,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    scrollToBottomText: {
      fontSize: 20,
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
	    overlay: {
	      position: 'absolute',
	      left: 0,
	      right: 0,
	      bottom: 72,
	      // Ensure the live transcription overlay renders above the input area.
	      zIndex: 1000,
	      elevation: 10,
	      alignItems: 'center',
	      paddingHorizontal: spacing.md,
	      paddingBottom: spacing.sm,
	    },
	    overlayCard: {
	      maxWidth: '88%',
	      borderRadius: radius.xl,
	      backgroundColor: hexToRgba(theme.colors.foreground, 0.72),
	      paddingHorizontal: 12,
	      paddingVertical: 8,
	    },
	    overlayText: {
	      ...theme.typography.caption,
	      color: theme.colors.background,
	      textAlign: 'center',
	    },
	    overlayTranscript: {
	      color: theme.colors.background,
	      marginTop: 4,
	      fontSize: 12,
	      lineHeight: 16,
	      opacity: 0.92,
	    },
    // Unified Tool Execution Card styles - compact left-accent design matching desktop
    toolExecutionCard: {
      marginTop: 2,
      borderRadius: radius.sm,
      borderLeftWidth: 1.5,
      borderLeftColor: hexToRgba(theme.colors.mutedForeground, 0.5),
      backgroundColor: hexToRgba(theme.colors.mutedForeground, 0.02),
      overflow: 'hidden',
    },
    toolExecutionPending: {
      borderLeftColor: hexToRgba(theme.colors.info, 0.5),
      backgroundColor: hexToRgba(theme.colors.info, 0.02),
    },
    toolExecutionSuccess: {
      borderLeftColor: hexToRgba(theme.colors.success, 0.5),
      backgroundColor: hexToRgba(theme.colors.success, 0.02),
    },
    toolExecutionError: {
      borderLeftColor: hexToRgba(theme.colors.destructive, 0.5),
      backgroundColor: hexToRgba(theme.colors.destructive, 0.02),
    },
    toolCallCompactContainer: {
      paddingVertical: 1,
      paddingHorizontal: 2,
      borderRadius: radius.sm,
      gap: 1,
    },
    toolCallCompactLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 1,
    },
    toolCallCompactPressed: {
      opacity: 0.7,
    },
    toolCallCompactName: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      fontWeight: '500',
      flexShrink: 1,
      color: theme.colors.mutedForeground,
    },
    toolCallCompactNamePending: {
      color: theme.colors.info,
    },
    toolCallCompactNameSuccess: {
      color: theme.colors.mutedForeground,
    },
    toolCallCompactNameError: {
      color: theme.colors.mutedForeground,
    },
    toolCallCompactStatus: {
      fontSize: 9,
    },
    toolCallCompactStatusPending: {
      color: theme.colors.info,
    },
    toolCallCompactStatusSuccess: {
      color: theme.colors.mutedForeground,
    },
    toolCallCompactStatusError: {
      color: theme.colors.mutedForeground,
    },
    // Tool-activity group styles (collapsed-by-default grouping of consecutive tool calls)
    toolActivityGroupCollapsed: {
      paddingVertical: 4,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      borderLeftWidth: 2,
      borderLeftColor: hexToRgba(theme.colors.mutedForeground, 0.3),
      marginBottom: 2,
    },
    toolActivityGroupPressed: {
      opacity: 0.7,
    },
    toolActivityGroupHeader: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      marginBottom: 2,
    },
    toolActivityGroupPreviewLine: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      color: theme.colors.mutedForeground,
      paddingLeft: 8,
    },
    toolParamsSection: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    toolParamsSectionTitle: {
      fontSize: 9,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      marginBottom: 2,
      opacity: 0.7,
    },
    toolCallCard: {
      backgroundColor: hexToRgba(theme.colors.foreground, 0.02),
      borderRadius: radius.sm,
      padding: 3,
      marginBottom: 2,
    },
    toolCallSection: {
      marginBottom: spacing.xs,
      paddingBottom: spacing.xs,
      borderBottomWidth: 0.5,
      borderBottomColor: hexToRgba(theme.colors.mutedForeground, 0.15),
    },
    toolName: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontWeight: '600',
      color: theme.colors.primary,
      fontSize: 10,
      flex: 1,
    },
    toolCallHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      marginBottom: spacing.xs,
      minHeight: 44,
    },
    toolCallHeaderPressed: {
      opacity: 0.7,
    },
    toolCallExpandHint: {
      fontSize: 9,
      color: theme.colors.mutedForeground,
      fontWeight: '500',
    },
    toolSectionLabel: {
      fontSize: 8,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    toolParamsScroll: {
      maxHeight: 80,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    toolParamsScrollExpanded: {
      maxHeight: 400,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    toolParamsCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 8,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.muted,
      padding: 3,
      borderRadius: radius.sm,
    },
    toolResponseSection: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    toolResponsePending: {
      // No background - let parent handle it
    },
    toolResponseSuccess: {
      // No background - let parent handle it
    },
    toolResponseError: {
      // No background - let parent handle it
    },
    toolResponseSectionTitle: {
      fontSize: 9,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      marginBottom: 2,
      opacity: 0.7,
    },
    toolResponsePendingText: {
      fontSize: 9,
      fontStyle: 'italic',
      color: theme.colors.mutedForeground,
      textAlign: 'center',
      paddingVertical: 2,
    },
    toolResultItem: {
      marginBottom: 2,
    },
    toolResultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    toolResultCharCount: {
      fontSize: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: theme.colors.mutedForeground,
      opacity: 0.6,
    },
    toolResultBadge: {
      fontSize: 9,
      fontWeight: '600',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: radius.sm,
    },
    toolResultBadgeSuccess: {
      backgroundColor: hexToRgba(theme.colors.success, 0.12),
      color: theme.colors.success,
    },
    toolResultBadgeError: {
      backgroundColor: hexToRgba(theme.colors.destructive, 0.12),
      color: theme.colors.destructive,
    },
    toolResultScroll: {
      maxHeight: 80,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    toolResultScrollExpanded: {
      maxHeight: 400,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    toolResultCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 8,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.muted,
      padding: 3,
      borderRadius: radius.sm,
    },
    toolResultErrorSection: {
      marginTop: 1,
    },
    toolResultErrorLabel: {
      fontSize: 8,
      fontWeight: '500',
      color: theme.colors.destructive,
      marginBottom: 1,
    },
    toolResultErrorText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 8,
      color: theme.colors.destructive,
      backgroundColor: hexToRgba(theme.colors.destructive, 0.06),
      padding: 3,
      borderRadius: radius.sm,
    },
    assistantMessageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      width: '100%',
    },
    assistantMessageBody: {
      flex: 1,
      minWidth: 0,
    },
    collapsedMessagePreview: {
      color: theme.colors.foreground,
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
      minWidth: 0,
    },
    // Per-message TTS button styles (#1078)
    speakButton: {
      alignSelf: 'flex-start',
      width: 24,
      height: 24,
      marginTop: 1,
      borderRadius: 12,
      backgroundColor: hexToRgba(theme.colors.mutedForeground, 0.1),
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    } as const,
    speakButtonActive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.15),
    } as const,
    speakButtonText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
    } as const,
    speakButtonTextActive: {
      color: theme.colors.primary,
    } as const,
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalTitle: {
      ...theme.typography.h2,
      marginBottom: spacing.md,
      color: theme.colors.foreground,
    },
    modalLabel: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.foreground,
      marginBottom: spacing.xs,
    },
    modalInput: {
      ...theme.input,
      marginBottom: spacing.md,
      color: theme.colors.foreground,
    },
    modalInputMultiline: {
      height: 120,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    modalCancelButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    modalCancelButtonText: {
      color: theme.colors.mutedForeground,
      fontWeight: '600',
    },
    modalSaveButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: theme.colors.primary,
      minWidth: 100,
      alignItems: 'center',
    },
    modalSaveButtonDisabled: {
      opacity: 0.5,
    },
    modalSaveButtonText: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
  });
}
