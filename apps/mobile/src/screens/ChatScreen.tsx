import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback, type ComponentProps, type ReactNode, type SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Alert,
  Pressable,
  Image,
  AppState,
  AppStateStatus,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  type KeyboardEvent as RNKeyboardEvent,
  type LayoutChangeEvent,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const darkSpinner = require('../../assets/loading-spinner.gif');
const lightSpinner = require('../../assets/light-spinner.gif');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
	DEFAULT_HANDS_FREE_SEND_PHRASE,
	DEFAULT_HANDS_FREE_WAKE_PHRASE,
	DEFAULT_HANDS_FREE_SLEEP_PHRASE,
	useConfigContext,
	saveConfig,
} from '../store/config';
import { canRefreshServerGeneratedSessionTitle, useSessionContext } from '../store/sessions';
import { useMessageQueueContext } from '../store/message-queue';
import { MessageQueuePanel } from '../ui/MessageQueuePanel';
import {
  ensureNativeTtsAudioMode,
  fetchRemoteTtsAudio,
  speakRemoteTts,
  writeRemoteTtsAudioFile,
} from '../lib/remoteTts';
import { useConnectionManager } from '../store/connectionManager';
import { useTunnelConnection } from '../store/tunnelConnection';
import { ConnectionStatusIndicator } from '../ui/ConnectionStatusIndicator';
import { ChatMessage, AgentProgressUpdate } from '../lib/openaiClient';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import { RecoveryState, formatConnectionStatus } from '../lib/connectionRecovery';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import * as KeepAwake from 'expo-keep-awake';
import {
  extractRespondToUserResponseEvents,
  preprocessTextForTTS,
  shouldCollapseMessage,
  formatToolArguments,
  getToolActivityLabel,
  getToolResultsSummary,
  extractRespondToUserContentFromArgs,
  RESPOND_TO_USER_TOOL,
  isToolOnlyMessage,
  normalizeAgentConversationState,
  groupToolActivity,
  type AgentConversationState,
  type AgentProgressStep,
  type AgentUserResponseEvent,
  type HandsFreePhase,
  type Loop,
  type PredefinedPromptSummary,
  type Skill,
  type ToolActivityGroup,
  type VoiceCommandId,
  DEFAULT_VOICE_COMMANDS,
  matchVoiceCommand,
  CHAT_PROVIDERS,
  type CHAT_PROVIDER_ID,
  type CodexServiceTier,
  type ModelInfo,
  type OpenAiReasoningEffort,
  type OperatorRuntimeStatus,
  type Settings,
} from '@dotagents/shared';
import { useHeaderHeight } from '@react-navigation/elements';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, Theme, hexToRgba } from '../ui/theme';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { GlobalTtsStatusPill } from '../ui/GlobalTtsStatusPill';
import { MicrophoneSelector } from '../ui/MicrophoneSelector';
import {
  beginGlobalTtsPlayback,
  completeGlobalTtsPlayback,
  getGlobalTtsPlayback,
  getGlobalTtsStopGeneration,
  markGlobalTtsPlaybackSpeaking,
  stopGlobalTtsPlayback,
  useGlobalTtsPlayback,
} from '../store/ttsPlayback';
import {
  createButtonAccessibilityLabel,
  createChatComposerAccessibilityHint,
  createExpandCollapseAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
  createVoiceInputLiveRegionAnnouncement,
} from '../lib/accessibility';
import { formatVoiceDebugEntry, useVoiceDebug } from '../lib/voice/voiceDebug';
import { mergeVoiceText, normalizeVoiceText } from '../lib/voice/mergeVoiceText';
import {
  DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE,
  matchesHandsFreeSendPhrase,
  resolveHandsFreeManualDraft,
} from '../lib/voice/handsFreeManualSend';
import { useSpeechRecognizer } from '../lib/voice/useSpeechRecognizer';
import { useStableForeground } from '../lib/voice/useStableForeground';
import { APP_SHELL_DIMENSIONS, resolveAppShellLayout } from '../ui/appShell';
import {
  getAndroidHandsFreeAudioRoute,
  isAndroidHandsFreeServiceAvailable,
  isAndroidHandsFreeServiceRunning,
  playAndroidHandsFreeTtsAudio,
  setAndroidHandsFreeListeningEnabled,
  speakAndroidHandsFreeTts,
  startAndroidHandsFreeService,
  stopAndroidHandsFreeService,
  subscribeAndroidHandsFreeVoiceEvents,
} from '../lib/voice/androidHandsFreeService';
import {
  isBenignHandsFreeRecognizerError,
  isExpectedHandsFreeRecognizerStopError,
  resolveHandsFreeStopTargets,
  useHandsFreeController,
} from '../lib/voice/useHandsFreeController';
import { matchWakePhrase, normalizeVoicePhrase } from '../lib/voice/phraseMatcher';
import {
  getRecentActiveAgentSessions,
  normalizeAgentSessionMessage,
  resolveAgentSessionReference,
} from '../lib/voice/agentSessionVoice';
import { sendMessageToAgentSession } from '../lib/voice/sendAgentSessionMessage';
import {
  getHandsFreeAudioCueDurationMs,
  playHandsFreeAudioCue,
  setAndroidHandsFreeCueRoutingEnabled,
  type HandsFreeAudioCue,
} from '../lib/voice/handsFreeAudioCues';
import { createDelegationProgressMessages } from '../lib/delegationProgress';
import { useMentra } from '../mentra/MentraProvider';
import { resolveMentraTouchAction } from '../mentra/mentraControls';
import {
  mergeLiveProgressHistory,
  mergeLiveProgressSteps,
  upsertLiveStreamingMessage,
  type LiveProgressHistoryState,
} from '../lib/liveProgressState';

interface PendingImageAttachment {
  id: string;
  name: string;
  previewUri: string;
  dataUrl: string;
}

type OperatorSessionSummary = OperatorRuntimeStatus['sessions']['activeSessionDetails'][number];

type PendingAgentVoiceAction = {
  command: 'focus' | 'message' | 'close';
  awaiting: 'target' | 'message';
  sessionId?: string;
  sessionTitle?: string;
};

const AGENT_MODEL_FALLBACKS: Record<CHAT_PROVIDER_ID, string> = {
  openai: 'gpt-5.5',
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.5-pro',
  'chatgpt-web': 'gpt-5.5',
};

const REASONING_EFFORT_OPTIONS: Array<{
  value: OpenAiReasoningEffort;
  label: string;
}> = [
  { value: 'none', label: 'Off' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'Extra high' },
];

const CODEX_SERVICE_TIER_OPTIONS: Array<{
  value: CodexServiceTier;
  label: string;
}> = [
  { value: 'standard', label: 'Standard' },
  { value: 'priority', label: 'Fast' },
];

const getAgentProviderId = (settings: Settings | null): CHAT_PROVIDER_ID =>
  settings?.agentProviderId || settings?.mcpToolsProviderId || 'openai';

const getConfiguredAgentModel = (
  settings: Settings | null,
  providerId: CHAT_PROVIDER_ID,
): string => {
  if (providerId === 'openai') {
    return settings?.agentOpenaiModel || settings?.mcpToolsOpenaiModel || AGENT_MODEL_FALLBACKS.openai;
  }
  if (providerId === 'groq') {
    return settings?.agentGroqModel || settings?.mcpToolsGroqModel || AGENT_MODEL_FALLBACKS.groq;
  }
  if (providerId === 'gemini') {
    return settings?.agentGeminiModel || settings?.mcpToolsGeminiModel || AGENT_MODEL_FALLBACKS.gemini;
  }
  return settings?.agentChatgptWebModel || settings?.mcpToolsChatgptWebModel || AGENT_MODEL_FALLBACKS['chatgpt-web'];
};

const buildAgentModelSettingsUpdate = (
  providerId: CHAT_PROVIDER_ID,
  modelId: string,
) => {
  if (providerId === 'openai') {
    return { agentOpenaiModel: modelId, mcpToolsOpenaiModel: modelId };
  }
  if (providerId === 'groq') {
    return { agentGroqModel: modelId, mcpToolsGroqModel: modelId };
  }
  if (providerId === 'gemini') {
    return { agentGeminiModel: modelId, mcpToolsGeminiModel: modelId };
  }
  return { agentChatgptWebModel: modelId, mcpToolsChatgptWebModel: modelId };
};

const providerSupportsThinking = (providerId: CHAT_PROVIDER_ID): boolean =>
  providerId === 'openai' || providerId === 'chatgpt-web';

const providerSupportsServiceTier = (providerId: CHAT_PROVIDER_ID): boolean =>
  providerId === 'chatgpt-web';

const MAX_PENDING_IMAGES = 4;
const MAX_PENDING_IMAGE_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES = 900 * 1024;
const INITIAL_VISIBLE_CHAT_MESSAGES = 80;
const VISIBLE_CHAT_MESSAGES_INCREMENT = 60;
const CHAT_COMPOSER_HINT_NATIVE_ID = 'chat-composer-hint';
const CHAT_VOICE_STATUS_LIVE_REGION_NATIVE_ID = 'chat-voice-status-live-region';
const AUTO_TTS_DUPLICATE_SUPPRESSION_MS = 5_000;
const MESSAGE_COPY_FEEDBACK_RESET_MS = 2_000;
const HANDS_FREE_DEBUG_STORAGE_KEY = 'dotagents:handsfree-debug';
const ANDROID_HANDS_FREE_DUPLICATE_SUPPRESSION_MS = 3_000;
// Chrome can deliver the final result for a command after the 3s hands-free
// debounce has already elapsed. Keep this longer than that debounce so an
// interim command handled immediately cannot execute again as a late final.
const HANDS_FREE_FINALIZED_DUPLICATE_SUPPRESSION_MS = 6_000;
const HANDS_FREE_ACCEPTED_CONTROL_PREVIEW_SUPPRESSION_MS = 3_000;
const ANDROID_HANDS_FREE_FOREGROUND_HANDOFF_DELAY_MS = 1_500;
const HANDS_FREE_KEEP_AWAKE_TAG = 'dotagents-handsfree';
const HANDS_FREE_TTS_BARGE_IN_DUPLICATE_SUPPRESSION_MS = 1_200;
const HANDS_FREE_TTS_BARGE_IN_TRANSCRIPT_SUPPRESSION_MS = 1_500;
const HANDS_FREE_TTS_SPEECH_STARTED_BARGE_IN_GRACE_MS = 1_000;
const HANDS_FREE_TTS_BARGE_IN_COMMANDS = new Set([
  'stop',
  'stop talking',
]);
const HANDS_FREE_GUIDE_DISMISSED_KEY = 'dotagents:handsfree-guide-dismissed';
const HANDS_FREE_SESSION_READY_CUE_MIN_INTERVAL_MS = 1_500;
const HANDS_FREE_PREVIEW_SUBMITTED_PROCESSING_CUE_SUPPRESSION_MS = 900;
const HANDS_FREE_SUBMITTED_CUE_ANDROID_DELAY_MS = 120;
const SERVER_GENERATED_TITLE_REFRESH_DELAYS_MS = [1_500, 5_000, 12_000, 25_000] as const;
type ServerGeneratedTitleRefreshJob = {
  cancelled: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};
const HANDS_FREE_PHASE_AUDIO_CUES: Record<HandsFreePhase, HandsFreeAudioCue> = {
  sleeping: 'sleeping',
  waking: 'listening',
  listening: 'listening',
  processing: 'processing',
  speaking: 'speaking',
  paused: 'paused',
  error: 'error',
};
const HANDS_FREE_CUES_ALLOWED_DURING_TTS = new Set<HandsFreeAudioCue>([
  'stopped',
  'paused',
  'sleeping',
  'disabled',
  'error',
]);
const NATIVE_TTS_WATCHDOG_GRACE_MS = 1_500;
const NATIVE_TTS_WATCHDOG_INTERVAL_MS = 750;
const NATIVE_TTS_MIN_WATCHDOG_MS = 4_000;
const NATIVE_TTS_MAX_WATCHDOG_MS = 90_000;
const NATIVE_TTS_STARTUP_TIMEOUT_MS = 8_000;
const NATIVE_TTS_ESTIMATED_WORDS_PER_MINUTE = 150;

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type HandsFreeDisplayPhase = HandsFreePhase | 'off';
type MicControlTone = 'idle' | 'active' | 'danger';
type MicControlIndicator = {
  key: string;
  icon: IoniconName;
  label: string;
  active?: boolean;
  warning?: boolean;
};
type MicControlVisual = {
  icon: IoniconName;
  label: string;
  status: string;
  tone: MicControlTone;
  busy: boolean;
  indicators: MicControlIndicator[];
  accessibilityLabel: string;
  accessibilityHint: string;
};

function compactVoiceStatus(message: string | null | undefined, fallback: string): string {
  const normalized = message?.trim();
  if (!normalized) return fallback;
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized;
}

function createMicStateIndicator(effectiveMicListening: boolean): MicControlIndicator {
  return {
    key: 'mic',
    icon: effectiveMicListening ? 'mic' : 'mic-off-outline',
    label: effectiveMicListening ? 'Mic armed' : 'Mic idle',
    active: effectiveMicListening,
  };
}

function createMicControlVisual({
  handsFree,
  displayPhase,
  effectiveMicListening,
  handsFreeAutoSend,
  handsFreeSendPhrase,
  hasPendingHandsFreeSend,
  hasPendingHandsFreeDraft,
  handsFreeCountdownSeconds,
  willCancel,
  wakePhrase,
  lastError,
}: {
  handsFree: boolean;
  displayPhase: HandsFreeDisplayPhase;
  effectiveMicListening: boolean;
  handsFreeAutoSend: boolean;
  handsFreeSendPhrase?: string;
  hasPendingHandsFreeSend: boolean;
  hasPendingHandsFreeDraft: boolean;
  handsFreeCountdownSeconds: number;
  willCancel: boolean;
  wakePhrase: string;
  lastError: string | null;
}): MicControlVisual {
  if (!handsFree) {
    const listeningLabel = willCancel ? 'Release to edit' : 'Release to send';
    return {
      icon: effectiveMicListening ? 'mic' : 'mic-outline',
      label: effectiveMicListening ? 'Listening' : 'Hold',
      status: effectiveMicListening
        ? (willCancel ? 'Release to edit before sending.' : 'Release to send.')
        : 'Hold to speak. Release to send.',
      tone: effectiveMicListening ? 'active' : 'idle',
      busy: effectiveMicListening,
      indicators: effectiveMicListening
        ? [{
            key: 'mode',
            icon: willCancel ? 'create-outline' : 'send-outline',
            label: listeningLabel,
            active: true,
          }]
        : [{
            key: 'mode',
            icon: 'mic-outline',
            label: 'Push to talk',
          }],
      accessibilityLabel: effectiveMicListening ? 'Voice input listening' : 'Voice input hold to talk',
      accessibilityHint: effectiveMicListening
        ? (willCancel ? 'Release to edit dictated text before sending.' : 'Release to send your dictated message.')
        : 'Press and hold to dictate your message.',
    };
  }

  const micIndicator = createMicStateIndicator(effectiveMicListening);
  const countdownIndicator: MicControlIndicator | null = hasPendingHandsFreeSend
    ? {
        key: 'countdown',
        icon: 'time-outline',
        label: `${handsFreeCountdownSeconds}s`,
        active: true,
      }
    : null;
  const trimmedWakePhrase = wakePhrase.trim();
  const trimmedSendPhrase = handsFreeSendPhrase?.trim() || DEFAULT_HANDS_FREE_SEND_PHRASE;

  switch (displayPhase) {
    case 'sleeping':
      return {
        icon: 'moon-outline',
        label: 'Wake',
        status: trimmedWakePhrase
          ? `Sleeping. Tap Wake or say "${trimmedWakePhrase}".`
          : 'Sleeping. Tap Wake to listen.',
        tone: 'idle',
        busy: false,
        indicators: [micIndicator, { key: 'sleep', icon: 'moon-outline', label: 'Sleeping' }],
        accessibilityLabel: 'Hands-free sleeping',
        accessibilityHint: 'Double tap to wake hands-free listening.',
      };
    case 'waking':
      return {
        icon: 'radio-outline',
        label: 'Waking',
        status: 'Starting listener.',
        tone: 'active',
        busy: true,
        indicators: [micIndicator, { key: 'wake', icon: 'radio-outline', label: 'Wake heard', active: true }],
        accessibilityLabel: 'Hands-free waking',
        accessibilityHint: 'Hands-free is starting. Double tap to pause.',
      };
    case 'listening':
      return {
        icon: 'ear-outline',
        label: 'Listening',
        status: handsFreeAutoSend
          ? (hasPendingHandsFreeSend
              ? `Auto-sending in ${handsFreeCountdownSeconds}s. Tap to pause.`
              : 'Listening for your request.')
          : (hasPendingHandsFreeDraft
              ? `Voice draft ready. Say "${trimmedSendPhrase}" to send or "${DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE}" to discard.`
              : `Listening. Say "${trimmedSendPhrase}" when your message is ready.`),
        tone: 'active',
        busy: true,
        indicators: [
          micIndicator,
          {
            key: 'send-mode',
            icon: 'send-outline',
            label: handsFreeAutoSend ? 'Auto-send' : `Say ${trimmedSendPhrase}`,
            active: true,
          },
          ...(handsFreeAutoSend && countdownIndicator ? [countdownIndicator] : []),
        ],
        accessibilityLabel: handsFreeAutoSend && hasPendingHandsFreeSend
          ? `Hands-free listening, sending in ${handsFreeCountdownSeconds} seconds`
          : handsFreeAutoSend
            ? 'Hands-free listening'
            : `Hands-free listening, say ${trimmedSendPhrase} to send`,
        accessibilityHint: handsFreeAutoSend && hasPendingHandsFreeSend
          ? 'Double tap to pause hands-free before the automatic send.'
          : 'Double tap to pause hands-free listening.',
      };
    case 'processing':
      return {
        icon: 'sync-outline',
        label: 'Processing',
        status: 'Agent is working. Mic stays ready for stop commands.',
        tone: 'active',
        busy: true,
        indicators: [micIndicator, { key: 'agent', icon: 'sync-outline', label: 'Agent working', active: true }],
        accessibilityLabel: 'Hands-free processing',
        accessibilityHint: 'Double tap to pause hands-free.',
      };
    case 'speaking':
      return {
        icon: 'volume-high-outline',
        label: 'Speaking',
        status: 'TTS playing. Say stop to interrupt.',
        tone: 'active',
        busy: true,
        indicators: [micIndicator, { key: 'tts', icon: 'volume-high-outline', label: 'TTS playing', active: true }],
        accessibilityLabel: 'Hands-free speaking',
        accessibilityHint: 'Say stop to interrupt text to speech, or double tap to pause hands-free.',
      };
    case 'paused':
      return {
        icon: 'pause-outline',
        label: 'Resume',
        status: 'Hands-free paused. Tap to resume.',
        tone: 'idle',
        busy: false,
        indicators: [micIndicator, { key: 'paused', icon: 'pause-outline', label: 'Paused' }],
        accessibilityLabel: 'Hands-free paused',
        accessibilityHint: 'Double tap to resume hands-free listening.',
      };
    case 'error':
      return {
        icon: 'warning-outline',
        label: 'Retry voice',
        status: compactVoiceStatus(lastError, 'Voice error. Tap to retry.'),
        tone: 'danger',
        busy: false,
        indicators: [micIndicator, { key: 'error', icon: 'warning-outline', label: 'Needs retry', warning: true }],
        accessibilityLabel: 'Hands-free voice error',
        accessibilityHint: 'Double tap to retry hands-free listening.',
      };
    case 'off':
    default:
      return {
        icon: 'mic-outline',
        label: 'Hold',
        status: 'Hold to speak. Release to send.',
        tone: 'idle',
        busy: false,
        indicators: [{ key: 'mode', icon: 'mic-outline', label: 'Push to talk' }],
        accessibilityLabel: 'Voice input hold to talk',
        accessibilityHint: 'Press and hold to dictate your message.',
      };
  }
}

function isHandsFreeDebugForcedInDev(): boolean {
  if (!__DEV__ || Platform.OS !== 'web') return false;

  const webWindow = globalThis as any;
  try {
    const params = new URLSearchParams(webWindow.location?.search || '');
    if (params.get('handsfreeDebug') === '1' || params.get('voiceDebug') === '1') {
      return true;
    }
  } catch {}

  try {
    return webWindow.localStorage?.getItem(HANDS_FREE_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

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

const inferImageMimeTypeFromBase64 = (base64: string) => {
  const normalized = base64.replace(/\s+/g, '');
  if (normalized.startsWith('/9j/')) return 'image/jpeg';
  if (normalized.startsWith('iVBORw0KGgo')) return 'image/png';
  if (normalized.startsWith('R0lGOD')) return 'image/gif';
  if (normalized.startsWith('UklGR')) return 'image/webp';
  if (normalized.startsWith('Qk')) return 'image/bmp';
  return null;
};

const escapeMarkdownImageAlt = (value: string) => value.replace(/[\[\]\\]/g, '').trim();

const normalizeAutoTtsTextKey = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const matchHandsFreeTtsBargeInCommand = (text?: string | null): 'stop' | null => {
  const normalized = normalizeVoicePhrase(text);
  if (!normalized || !HANDS_FREE_TTS_BARGE_IN_COMMANDS.has(normalized)) {
    return null;
  }
  return 'stop';
};

const estimateNativeTtsWatchdogMs = (text: string, rate = 1.0) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1.0;
  const estimatedMs = (wordCount / (NATIVE_TTS_ESTIMATED_WORDS_PER_MINUTE * safeRate)) * 60_000;
  return Math.min(
    NATIVE_TTS_MAX_WATCHDOG_MS,
    Math.max(NATIVE_TTS_MIN_WATCHDOG_MS, estimatedMs + NATIVE_TTS_WATCHDOG_GRACE_MS),
  );
};

type NativeTtsWatchdogReason = 'idle' | 'timeout' | 'startup-timeout';

const startNativeTtsSettlementWatchdog = (
  text: string,
  rate: number,
  hasSpeechStarted: () => boolean,
  onSettled: () => void,
  onWatchdogSettled?: (reason: NativeTtsWatchdogReason) => void,
) => {
  let cleared = false;
  const startedAt = Date.now();
  let interval: ReturnType<typeof setInterval> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let startupTimeout: ReturnType<typeof setTimeout> | null = null;
  const clear = () => {
    if (cleared) return;
    cleared = true;
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
    if (startupTimeout) clearTimeout(startupTimeout);
  };

  const settleFromWatchdog = (reason: NativeTtsWatchdogReason) => {
    if (cleared) return;
    clear();
    onWatchdogSettled?.(reason);
    onSettled();
  };

  interval = setInterval(() => {
    if (cleared || Date.now() - startedAt < NATIVE_TTS_WATCHDOG_GRACE_MS) {
      return;
    }
    void Speech.isSpeakingAsync()
      .then((isSpeaking) => {
        if (hasSpeechStarted() && !isSpeaking) {
          settleFromWatchdog('idle');
        }
      })
      .catch(() => undefined);
  }, NATIVE_TTS_WATCHDOG_INTERVAL_MS);

  startupTimeout = setTimeout(() => {
    if (!hasSpeechStarted()) {
      settleFromWatchdog('startup-timeout');
    }
  }, NATIVE_TTS_STARTUP_TIMEOUT_MS);

  const maxWatchdogMs = Math.max(
    estimateNativeTtsWatchdogMs(text, rate),
    NATIVE_TTS_STARTUP_TIMEOUT_MS + NATIVE_TTS_MIN_WATCHDOG_MS,
  );
  timeout = setTimeout(() => {
    settleFromWatchdog('timeout');
  }, maxWatchdogMs);

  return clear;
};

let androidHandsFreeEventOwnerCounter = 0;
let activeAndroidHandsFreeEventOwnerId = 0;

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

const summarizeImageAttachmentError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
};

const readPickerAssetBase64 = async (
  asset: ImagePicker.ImagePickerAsset,
): Promise<{ base64: string; source: 'picker' | 'file' } | null> => {
  const pickerBase64 = asset.base64?.trim();
  if (pickerBase64) {
    return { base64: pickerBase64, source: 'picker' };
  }

  if (!asset.uri) {
    return null;
  }

  try {
    const file = new File(asset.uri);
    const fileBase64 = (await file.base64()).trim();
    return fileBase64 ? { base64: fileBase64, source: 'file' } : null;
  } catch (error) {
    console.warn('[DotAgentsImages] failed to read selected image URI', {
      name: asset.fileName,
      uri: asset.uri,
      ...summarizeImageAttachmentError(error),
    });
    return null;
  }
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
  description?: string;
  source: 'command' | 'saved-prompt' | 'skill' | 'task' | 'action';
  action?: 'add-prompt';
  prompt?: PredefinedPromptSummary;
  task?: Loop;
};

const isSlashCommandPrompt = (prompt: PredefinedPromptSummary) => /^\/[\S]+/.test(prompt.name.trim());

const getSkillPromptContent = (skill: Skill): string => {
  const instructions = skill.instructions?.trim();
  if (instructions) return instructions;
  return `Use the "${skill.name}" skill for this request.${skill.description ? `\n\n${skill.description}` : ''}`;
};

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

type QueuedResponseSpeechItem = {
  event: AgentUserResponseEvent;
  requestId: number;
  sessionId: string | null;
};

type AndroidHandsFreeTtsSettleType = 'tts-done' | 'tts-error' | 'tts-stopped';

type AndroidHandsFreeTtsHandler = {
  onStarted: () => void;
  onSettled: (type: AndroidHandsFreeTtsSettleType, message?: string) => void;
};

const STALE_HANDS_FREE_TTS_RECOVERY_MS = 15000;

const createAndroidHandsFreeTtsUtteranceId = () =>
  `handsfree-tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const extractRespondToUserHistory = (
  messages: RespondToUserHistorySourceMessage[]
): AgentUserResponseEvent[] =>
  extractRespondToUserResponseEvents(messages, { idPrefix: 'mobile-history' });

const compareResponseEvents = (a: AgentUserResponseEvent, b: AgentUserResponseEvent): number => {
  if ((a.runId ?? 0) !== (b.runId ?? 0)) return (a.runId ?? 0) - (b.runId ?? 0);
  if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
  return a.timestamp - b.timestamp;
};

const sortResponseEvents = (events: AgentUserResponseEvent[]): AgentUserResponseEvent[] =>
  [...events].sort(compareResponseEvents);

const getCurrentRunResponseEvents = (update: AgentProgressUpdate): AgentUserResponseEvent[] => {
  const sortedEvents = sortResponseEvents(update.responseEvents ?? []);
  if (!sortedEvents.length || update.runId == null) {
    return sortedEvents;
  }

  const matchingRunEvents = sortedEvents.filter((event) => event.runId === update.runId);
  if (matchingRunEvents.length > 0) {
    return matchingRunEvents;
  }

  return sortedEvents.filter((event) => event.runId == null);
};

const getNextResponseEventOrdinal = (events: AgentUserResponseEvent[]): number =>
  events.reduce((maxOrdinal, event) => Math.max(maxOrdinal, event.ordinal), 0) + 1;

const getMessageLogMeta = (content: string) => ({
  length: content.length,
  inlineImageCount: (content.match(/!\[[^\]]*\]\((?:data:image\/[^)]+)\)/gi) || []).length,
});

type RecentHandsFreeSend = {
  sessionId: string | null;
  text: string;
  timestamp: number;
};

let recentGlobalHandsFreeSend: RecentHandsFreeSend | null = null;

const isRecentGlobalHandsFreeSendDuplicate = (
  sessionId: string | null,
  text: string,
) => {
  const normalizedText = normalizeVoiceText(text);
  const now = Date.now();
  const recent = recentGlobalHandsFreeSend;
  if (
    recent
    && recent.sessionId === sessionId
    && recent.text === normalizedText
    && now - recent.timestamp < HANDS_FREE_FINALIZED_DUPLICATE_SUPPRESSION_MS
  ) {
    return true;
  }
  recentGlobalHandsFreeSend = { sessionId, text: normalizedText, timestamp: now };
  return false;
};

const getCollapsedMessagePreview = (content: string) =>
  content
    .replace(/!\[[^\]]*\]\((?:data:image\/[^)]+|[^)]+)\)/gi, '[Image]')
    .replace(/(^|[^!])\[[^\]]*\]\((?:assets:\/\/conversation-video\/[^)]+|https?:\/\/[^)]+\.(?:mp4|m4v|webm|mov|ogv)(?:[?#][^)]*)?)\)/gi, '$1[Video]')
    .replace(/^#{1,6}\s+/gm, '')
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

  if (/^tool_call$/i.test(trimmedContent)) {
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

const getRenderableMessageContent = (message: ChatMessage): string =>
  message.displayContent ?? message.content ?? '';

const getVisibleAssistantContentCandidate = (
  message: ChatMessage,
  content?: string
): string => {
  const rawContent = content ?? '';
  if (!rawContent) return '';

  const displayMessage = { ...message, content: rawContent, displayContent: undefined };
  if (isToolOnlyMessage(displayMessage)) {
    return '';
  }

  if (looksLikeToolPayloadContent(rawContent)) {
    return '';
  }

  const stripped = stripRawToolTextFromContent(rawContent);
  if (stripped.length > 0) {
    return stripped;
  }

  return stripped === rawContent ? rawContent : '';
};

const getVisibleMessageContent = (message: ChatMessage): string => {
  // Tool role messages are raw tool results — always hide their content
  // (they should have been merged into the preceding assistant message)
  if (message.role === 'tool') {
    return '';
  }

  if (message.role !== 'assistant') {
    return getRenderableMessageContent(message);
  }

  const contentCandidate = getVisibleAssistantContentCandidate(message, message.content);
  if (contentCandidate) {
    return contentCandidate;
  }

  const respondToUserContent = getRespondToUserContentFromMessage(message);
  if (respondToUserContent) {
    return respondToUserContent;
  }

  return getVisibleAssistantContentCandidate(message, message.displayContent);
};

const shouldTreatMessageAsToolOnly = (message: ChatMessage): boolean => {
  const hasToolMetadata =
    (message.toolCalls?.length ?? 0) > 0 ||
    (message.toolResults?.length ?? 0) > 0;

  if (getVisibleMessageContent(message).trim().length > 0) {
    return false;
  }

  // Also treat standalone raw tool result messages as tool-only
  if (
    looksLikeToolPayloadContent(message.content ?? '') ||
    looksLikeToolPayloadContent(message.displayContent ?? '')
  ) {
    return true;
  }

  return hasToolMetadata;
};

const preserveDisplayContentFromProgress = (
  finalMessages: ChatMessage[],
  progressMessages: ChatMessage[]
): ChatMessage[] => {
  if (progressMessages.length === 0) return finalMessages;

  return finalMessages.map((message, index) => {
    if (message.displayContent) return message;
    if (getVisibleAssistantContentCandidate(message, message.content).trim().length > 0) {
      return message;
    }
    const progressMessage = progressMessages[index];
    if (message.role !== 'assistant' || !progressMessage?.displayContent) {
      return message;
    }
    return { ...message, displayContent: progressMessage.displayContent };
  });
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

    const replacement = { ...msg, content: trimmedResponse, displayContent: undefined };
    updatedMessages[i] = replacement;
    if (
      getVisibleMessageContent(replacement).trim().length === 0 ||
      shouldTreatMessageAsToolOnly(replacement)
    ) {
      updatedMessages.push({ role: 'assistant', content: trimmedResponse });
    }
    return updatedMessages;
  }

  updatedMessages.push({ role: 'assistant', content: trimmedResponse });
  return updatedMessages;
};

type TurnDurationEntry = {
  durationMs: number;
  isLive: boolean;
};

type TurnDurationSummary = {
  byUserTimestamp: Map<number, TurnDurationEntry>;
  totalMs: number;
  hasLive: boolean;
};

type ToolExecutionStats = {
  durationMs?: number;
  totalTokens?: number;
  toolUseCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheHitTokens?: number;
  model?: string;
  subagentId?: string;
};

const TURN_DURATION_TICK_MS = 1000;

const isThinkingOnlyMessage = (message: ChatMessage): boolean =>
  message.role === 'assistant' &&
  (!message.content || message.content.length === 0) &&
  !message.toolCalls?.length &&
  !message.toolResults?.length;

const computeTurnDurations = (
  messages: ChatMessage[],
  isComplete: boolean,
  nowMs: number
): TurnDurationSummary => {
  const byUserTimestamp = new Map<number, TurnDurationEntry>();
  let totalMs = 0;
  let hasLive = false;

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (message.role !== 'user' || typeof message.timestamp !== 'number') continue;

    let endTimestamp: number | null = null;
    let hasNextUserMessage = false;
    for (let j = i + 1; j < messages.length; j += 1) {
      const nextMessage = messages[j];
      if (nextMessage.role === 'user') {
        hasNextUserMessage = true;
        break;
      }
      if (typeof nextMessage.timestamp === 'number' && !isThinkingOnlyMessage(nextMessage)) {
        endTimestamp = nextMessage.timestamp;
      }
    }

    const isLive = !hasNextUserMessage && !isComplete;
    const effectiveEndTimestamp = isLive ? nowMs : (endTimestamp ?? message.timestamp);
    const durationMs = Math.max(0, effectiveEndTimestamp - message.timestamp);
    const entry = { durationMs, isLive };

    byUserTimestamp.set(message.timestamp, entry);
    totalMs += durationMs;
    if (isLive) hasLive = true;
  }

  return { byUserTimestamp, totalMs, hasLive };
};

const formatTurnDuration = (durationMs: number): string => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '0s';
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const getFiniteToolExecutionStat = (value: number | null | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const formatToolExecutionDuration = (durationMs: number): string => {
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
};

const formatToolExecutionTokens = (tokens: number): string => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`;
  return `${tokens}`;
};

type SessionMessagesVersionSource = {
  id: string;
  updatedAt: number;
  messages: Array<Partial<ChatMessage> & { id?: string }>;
};

const hashMessageVersionContent = (content: string): number => {
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
};

const getChatMessageVersionPart = (message: (Partial<ChatMessage> & { id?: string }) | undefined, index: number): string => {
  if (!message) return `${index}:empty`;
  const content = message.content || '';
  const displayContent = message.displayContent || '';
  const toolCallCount = Array.isArray(message.toolCalls) ? message.toolCalls.length : 0;
  const toolResultCount = Array.isArray(message.toolResults) ? message.toolResults.length : 0;
  return [
    message.id ?? index,
    message.role ?? '',
    message.timestamp ?? '',
    content.length,
    hashMessageVersionContent(content),
    displayContent.length,
    hashMessageVersionContent(displayContent),
    toolCallCount,
    toolResultCount,
  ].join(':');
};

const getSessionMessagesVersionKey = (session: SessionMessagesVersionSource | null | undefined): string | null => {
  if (!session) return null;
  const messages = session.messages || [];
  return [
    session.id,
    session.updatedAt,
    messages.length,
    getChatMessageVersionPart(messages[0], 0),
    getChatMessageVersionPart(messages[messages.length - 1], messages.length - 1),
  ].join('|');
};

const getLocalMessagesVersionKey = (sessionId: string | null | undefined, messages: ChatMessage[]): string | null => {
  if (!sessionId) return null;
  return [
    sessionId,
    messages.length,
    messages.map((message, index) => getChatMessageVersionPart(message, index)).join('|'),
  ].join('|');
};

const truncateToolExecutionSubagentId = (id: string): string => {
  if (id.length > 12 && id.includes('-')) return `agent:${id.split('-')[0].slice(0, 7)}`;
  if (id.length <= 12) return id;
  return `${id.slice(0, 10)}...`;
};

const getAgentProgressStepToolExecutionStats = (
  step?: { executionStats?: ToolExecutionStats | null; subagentId?: string | null } | null
): ToolExecutionStats | undefined => {
  if (!step?.executionStats) return undefined;
  return {
    ...step.executionStats,
    ...(step.subagentId ? { subagentId: step.subagentId } : {}),
  };
};

const getToolPayloadCopyAccessibilityLabel = (
  kind: 'input' | 'output' | 'error',
  toolName: string,
) => {
  const label = kind === 'input' ? 'Copy input' : kind === 'output' ? 'Copy output' : 'Copy error details';
  return `${label} for ${toolName}`;
};

const formatToolExecutionStatsLabel = (stats?: ToolExecutionStats | null): string | null => {
  const durationMs = getFiniteToolExecutionStat(stats?.durationMs);
  const totalTokens = getFiniteToolExecutionStat(stats?.totalTokens);
  const model = stats?.model?.trim();
  const subagentId = stats?.subagentId?.trim();
  const parts = [
    subagentId ? truncateToolExecutionSubagentId(subagentId) : null,
    model || null,
    durationMs !== undefined ? formatToolExecutionDuration(durationMs) : null,
    totalTokens !== undefined ? `${formatToolExecutionTokens(totalTokens)} tokens` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' • ') : null;
};

type LiveProgressFocus = {
  thinking: {
    id: string;
    content: string;
    status: AgentProgressStep['status'];
  } | null;
  tool: {
    id: string;
    title: string;
    description?: string;
    status: AgentProgressStep['status'];
    toolCall?: NonNullable<AgentProgressStep['toolCall']>;
    toolResult?: NonNullable<AgentProgressStep['toolResult']>;
    executionStats?: AgentProgressStep['executionStats'];
  } | null;
};

const getProgressStepContent = (step: AgentProgressStep): string => {
  const directContent = [step.content, step.llmContent]
    .find((value) => typeof value === 'string' && value.trim().length > 0);
  return directContent?.trim() || [step.title, step.description].filter(Boolean).join('\n').trim();
};

/**
 * Select the two pieces of live work worth keeping in view while the run moves.
 * The progress refs intentionally retain earlier steps, so this focus does not
 * flicker away between a tool result and the next thinking update.
 */
const getLiveProgressFocus = (steps: AgentProgressStep[]): LiveProgressFocus => {
  const latestThinkingStep = [...steps]
    .reverse()
    .find((step) => step.type === 'thinking' && getProgressStepContent(step));

  const latestToolCallStep = [...steps]
    .reverse()
    .find((step) => step.type === 'tool_call' && step.toolCall);
  const latestToolResultStep = [...steps]
    .reverse()
    .find((step) => (
      (step.type === 'tool_result' && step.toolResult) ||
      (step.type === 'tool_call' && step.toolResult)
    ));

  const toolStep = latestToolCallStep || latestToolResultStep;
  if (!toolStep) {
    return {
      thinking: latestThinkingStep
        ? {
            id: latestThinkingStep.id,
            content: getProgressStepContent(latestThinkingStep),
            status: latestThinkingStep.status,
          }
        : null,
      tool: null,
    };
  }

  const toolResult = latestToolCallStep?.toolResult || (
    latestToolResultStep && (!latestToolCallStep || latestToolResultStep.timestamp >= latestToolCallStep.timestamp)
      ? latestToolResultStep.toolResult
      : undefined
  );

  return {
    thinking: latestThinkingStep
      ? {
          id: latestThinkingStep.id,
          content: getProgressStepContent(latestThinkingStep),
          status: latestThinkingStep.status,
        }
      : null,
    tool: {
      id: toolStep.id,
      title: toolStep.toolCall?.name || toolStep.title || 'Tool result',
      description: toolStep.description,
      status: toolStep.status,
      toolCall: toolStep.toolCall,
      toolResult,
      executionStats: toolStep.executionStats,
    },
  };
};

const parseToolInspectorPayload = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const isToolInspectorRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const hasToolInspectorContent = (value: unknown): boolean => {
  const parsed = parseToolInspectorPayload(value);
  if (isToolInspectorRecord(parsed)) return Object.keys(parsed).length > 0;
  if (Array.isArray(parsed)) return parsed.length > 0;
  if (typeof parsed === 'string') return parsed.trim().length > 0;
  return parsed !== null && parsed !== undefined;
};

// These fields are already represented by the tool header/status or by the input.
// Repeating them in the output makes long command results much harder to scan.
const TOOL_OUTPUT_METADATA_KEYS = new Set(['success', 'cwd', 'command']);

type ToolInspectorValueProps = {
  value: unknown;
  styles: ReturnType<typeof createStyles>;
  depth?: number;
  emphasized?: boolean;
};

/** Render tool payloads as readable fields instead of making users parse JSON. */
function ToolInspectorValue({ value, styles, depth = 0, emphasized = false }: ToolInspectorValueProps): ReactNode {
  if (value === null) {
    return <Text style={styles.toolFieldValueMuted}>null</Text>;
  }

  if (typeof value === 'string') {
    return (
      <Text
        selectable
        style={[styles.toolFieldValue, emphasized && styles.toolFieldValueCode]}
      >
        {value}
      </Text>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <Text style={styles.toolFieldValue}>{String(value)}</Text>;
  }

  if (depth >= 3) {
    return (
      <Text style={styles.toolFieldValueCode} selectable>
        {JSON.stringify(value)}
      </Text>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <Text style={styles.toolFieldValueMuted}>Empty list</Text>;
    return (
      <View style={styles.toolNestedValue}>
        {value.map((item, index) => (
          <View key={index} style={styles.toolArrayItem}>
            <View style={styles.toolArrayItemValue}>
              <ToolInspectorValue value={item} styles={styles} depth={depth + 1} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (isToolInspectorRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <Text style={styles.toolFieldValueMuted}>Empty object</Text>;
    return (
      <View style={styles.toolNestedValue}>
        {entries.map(([key, childValue]) => (
          <View key={key} style={styles.toolNestedField}>
            <ToolInspectorValue value={childValue} styles={styles} depth={depth + 1} />
          </View>
        ))}
      </View>
    );
  }

  return <Text style={styles.toolFieldValue}>{String(value)}</Text>;
}

type ToolInspectorPayloadProps = {
  value: unknown;
  fallbackText: string;
  styles: ReturnType<typeof createStyles>;
  hiddenKeys?: ReadonlySet<string>;
};

function ToolInspectorPayload({ value, fallbackText, styles, hiddenKeys }: ToolInspectorPayloadProps): ReactNode {
  const parsed = parseToolInspectorPayload(value);
  if (isToolInspectorRecord(parsed)) {
    const entries = Object.entries(parsed).filter(([key]) => !hiddenKeys?.has(key));
    if (entries.length === 0) {
      return <Text style={styles.toolFieldValueMuted}>{hiddenKeys ? 'No output returned' : 'No fields'}</Text>;
    }
    return (
      <View style={styles.toolFieldList}>
        {entries.map(([key, childValue]) => (
          <View key={key} style={styles.toolFieldRow}>
            <View style={styles.toolFieldValueWrap}>
              <ToolInspectorValue
                value={childValue}
                styles={styles}
                emphasized={key === 'command' || key === 'script'}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (Array.isArray(parsed)) {
    return <ToolInspectorValue value={parsed} styles={styles} />;
  }

  return (
    <Text selectable style={styles.toolPayloadFallback}>
      {fallbackText}
    </Text>
  );
}

export default function ChatScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const isFocused = useIsFocused();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenHeight, isDark), [theme, screenHeight, isDark]);
  const compactPrimaryNavHeight =
    resolveAppShellLayout(screenWidth) === 'compact'
      ? APP_SHELL_DIMENSIONS.compactPrimaryNavHeight
      : 0;
  const { config, setConfig } = useConfigContext();
  const mentra = useMentra();
  const sessionStore = useSessionContext();
  const messageQueue = useMessageQueueContext();
  const connectionManager = useConnectionManager();
  const { connectionInfo } = useTunnelConnection();
  const globalTtsPlayback = useGlobalTtsPlayback();
  const currentSession = sessionStore.getCurrentSession();
  const handsFree = !!config.handsFree;
  const mentraVoiceActive = mentra.enabled && mentra.ready;
  const mobileSttProvider = config.mobileSttProvider || 'native';
  const desktopSttSelected = mobileSttProvider === 'desktop';
  const desktopSttAvailable = !!config.baseUrl && !!config.apiKey;
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
  const [desktopSettings, setDesktopSettings] = useState<Settings | null>(null);
  const [operatorSessions, setOperatorSessions] = useState<OperatorSessionSummary[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [isLoadingModelOptions, setIsLoadingModelOptions] = useState(false);
  const [isSavingModelSettings, setIsSavingModelSettings] = useState(false);
  const isSavingModelSettingsRef = useRef(false);
  const [isStoppingCurrentSession, setIsStoppingCurrentSession] = useState(false);
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false);
  const [runningPromptTaskId, setRunningPromptTaskId] = useState<string | null>(null);
  const [remoteTtsProvider, setRemoteTtsProvider] = useState<'native' | 'edge'>('native');
  const [remoteEdgeTtsVoice, setRemoteEdgeTtsVoice] = useState('en-US-AriaNeural');
  const [remoteEdgeTtsRate, setRemoteEdgeTtsRate] = useState(1.0);
  const [pendingToolApprovalResponseId, setPendingToolApprovalResponseId] = useState<string | null>(null);
  const [branchingMessageIndex, setBranchingMessageIndex] = useState<number | null>(null);
  // Effective TTS provider/voice/rate — local mobile config takes precedence over
  // any value pulled from the connected desktop's settings.
  const effectiveTtsProvider: 'native' | 'edge' =
    config.ttsProvider === 'edge' ? 'edge' : remoteTtsProvider;
  const effectiveEdgeTtsVoice =
    config.ttsProvider === 'edge' && config.edgeTtsVoice
      ? config.edgeTtsVoice
      : remoteEdgeTtsVoice;
  const effectiveEdgeTtsRate =
    config.ttsProvider === 'edge' ? config.ttsRate ?? 1.0 : remoteEdgeTtsRate;
  const [addPromptModalVisible, setAddPromptModalVisible] = useState(false);
  const [chatMenuVisible, setChatMenuVisible] = useState(false);
  const [voiceAgentPickerVisible, setVoiceAgentPickerVisible] = useState(false);
  const [agentConfigExpanded, setAgentConfigExpanded] = useState(false);
  const [handsFreeGuideVisible, setHandsFreeGuideVisible] = useState(false);
  const [handsFreeGuideDismissed, setHandsFreeGuideDismissed] = useState<boolean | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PredefinedPromptSummary | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const agentProviderId = getAgentProviderId(desktopSettings);
  const currentAgentModel = getConfiguredAgentModel(desktopSettings, agentProviderId);
  const currentOperatorSession = useMemo(() => {
    const serverConversationId = currentSession?.serverConversationId;
    if (!serverConversationId) return undefined;
    return operatorSessions.find((session) => session.conversationId === serverConversationId);
  }, [currentSession?.serverConversationId, operatorSessions]);
  const handsFreeAutoSend = config.handsFreeAutoSend !== false;
  const handsFreeMessageDebounceMs = config.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;
  const handsFreeSendPhrase = config.handsFreeSendPhrase?.trim() || DEFAULT_HANDS_FREE_SEND_PHRASE;
  const handsFreeWakePhrase = config.handsFreeWakePhrase || DEFAULT_HANDS_FREE_WAKE_PHRASE;
  const handsFreeSleepPhrase = config.handsFreeSleepPhrase || DEFAULT_HANDS_FREE_SLEEP_PHRASE;
  const [handsFreeWakePhraseDraft, setHandsFreeWakePhraseDraft] = useState(handsFreeWakePhrase);
  const [handsFreeSleepPhraseDraft, setHandsFreeSleepPhraseDraft] = useState(handsFreeSleepPhrase);
  useEffect(() => setHandsFreeWakePhraseDraft(handsFreeWakePhrase), [handsFreeWakePhrase]);
  useEffect(() => setHandsFreeSleepPhraseDraft(handsFreeSleepPhrase), [handsFreeSleepPhrase]);
  const handsFreeDebugEnabled = config.handsFreeDebug === true || isHandsFreeDebugForcedInDev();
  const androidHandsFreeServiceAvailable = Platform.OS === 'android' && isAndroidHandsFreeServiceAvailable();
  const shouldRunAndroidHandsFreeService =
    androidHandsFreeServiceAvailable && handsFree;
  const messageQueueEnabled = config.messageQueueEnabled !== false; // default true
  const handsFreeRef = useRef<boolean>(handsFree);
  useEffect(() => { handsFreeRef.current = !!config.handsFree; }, [config.handsFree]);
  const handsFreePhaseRef = useRef<HandsFreePhase>('sleeping');
  // Track ttsEnabled in a ref so speech callbacks resolved before a mute-toggle
  // (e.g. in-flight send() progress callbacks) still see the latest setting and
  // bail before queueing or playing audio.
  const ttsEnabledRef = useRef<boolean>(config.ttsEnabled !== false);
  useEffect(() => { ttsEnabledRef.current = config.ttsEnabled !== false; }, [config.ttsEnabled]);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  appStateRef.current = appState;
  const isFocusedRef = useRef<boolean>(isFocused);
  isFocusedRef.current = isFocused;

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(HANDS_FREE_GUIDE_DISMISSED_KEY)
      .then((value) => {
        if (mounted) {
          setHandsFreeGuideDismissed(value === 'true');
        }
      })
      .catch(() => {
        if (mounted) {
          setHandsFreeGuideDismissed(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (handsFree && handsFreeGuideDismissed === false) {
      setHandsFreeGuideVisible(true);
    }
  }, [handsFree, handsFreeGuideDismissed]);
  const isAppActive = appState === 'active';
  const isHandsFreeForegroundCandidate = isAppActive && isFocused;
  const stableHandsFreeForeground = useStableForeground(
    isHandsFreeForegroundCandidate,
    Platform.OS === 'android' && androidHandsFreeServiceAvailable
      ? ANDROID_HANDS_FREE_FOREGROUND_HANDOFF_DELAY_MS
      : 0,
  );
  const foregroundHandsFreeRuntimeActive = Platform.OS === 'android' && androidHandsFreeServiceAvailable
    ? shouldRunAndroidHandsFreeService
    : isAppActive && isFocused;
  const androidBackgroundHandsFree =
    shouldRunAndroidHandsFreeService
    && !stableHandsFreeForeground;
  const androidServiceHandlesHandsFreeMic =
    Platform.OS === 'android'
    && shouldRunAndroidHandsFreeService
    && !mentraVoiceActive;
  const stableHandsFreeForegroundRef = useRef(stableHandsFreeForeground);
  stableHandsFreeForegroundRef.current = stableHandsFreeForeground;
  const shouldRunAndroidHandsFreeServiceRef = useRef(shouldRunAndroidHandsFreeService);
  shouldRunAndroidHandsFreeServiceRef.current = shouldRunAndroidHandsFreeService;
  const androidBackgroundHandsFreeRef = useRef(androidBackgroundHandsFree);
  androidBackgroundHandsFreeRef.current = androidBackgroundHandsFree;
  const getCurrentAndroidHandsFreeTtsRuntime = useCallback(() => {
    const currentAppState = appStateRef.current;
    const currentIsFocused = isFocusedRef.current;
    const serviceRunning = Platform.OS === 'android' && shouldRunAndroidHandsFreeServiceRef.current;
    const stableForeground =
      serviceRunning
      && currentAppState === 'active'
      && currentIsFocused
      && stableHandsFreeForegroundRef.current;
    const backgroundHandsFree =
      serviceRunning
      && (
        androidBackgroundHandsFreeRef.current
        || !stableForeground
        || currentAppState !== 'active'
        || !currentIsFocused
      );
    return {
      appState: currentAppState,
      backgroundHandsFree,
      isFocused: currentIsFocused,
      stableForeground,
    };
  }, []);
  const shouldUseAndroidHandsFreeServiceRemoteTts =
    Platform.OS === 'android'
    && shouldRunAndroidHandsFreeService
    && effectiveTtsProvider === 'edge'
    && !!config.baseUrl
    && !!config.apiKey;
  const shouldUseAndroidHandsFreeServiceNativeTts =
    Platform.OS === 'android'
    && shouldRunAndroidHandsFreeService
    && !shouldUseAndroidHandsFreeServiceRemoteTts;
  const shouldUseAndroidHandsFreeServiceRemoteTtsRef = useRef(shouldUseAndroidHandsFreeServiceRemoteTts);
  shouldUseAndroidHandsFreeServiceRemoteTtsRef.current = shouldUseAndroidHandsFreeServiceRemoteTts;
  const shouldUseAndroidHandsFreeServiceNativeTtsRef = useRef(shouldUseAndroidHandsFreeServiceNativeTts);
  shouldUseAndroidHandsFreeServiceNativeTtsRef.current = shouldUseAndroidHandsFreeServiceNativeTts;
  const allowHandsFreeDirectSpeechWhileSleeping = false;
  const handsFreeRuntimeActive =
    handsFree
    && (shouldRunAndroidHandsFreeService || foregroundHandsFreeRuntimeActive);

  const toggleHandsFree = async () => {
    const next = !handsFreeRef.current;
	    handsFreeRef.current = next;
    const nextCfg = { ...config, handsFree: next } as any;
    setConfig(nextCfg);
    try { await saveConfig(nextCfg); } catch {}
    if (!next) {
	      handsFreeController.reset();
      void stopRecognitionOnly?.();
      stopGlobalTtsPlayback();
      playHandsFreeAudioCue('disabled');
      setDebugInfo('Handsfree mode turned off.');
    } else {
      playHandsFreeAudioCue('enabled');
      setDebugInfo('Handsfree mode turned on. Say the wake phrase to begin.');
    }
  };

  const openChatMenu = useCallback(() => {
    setChatMenuVisible(true);
  }, []);

  const closeChatMenu = useCallback(() => {
    setChatMenuVisible(false);
  }, []);

  const handleToggleHandsFreeFromMenu = useCallback(() => {
    void toggleHandsFree();
  }, [toggleHandsFree]);

  const handleAudioInputDeviceChange = useCallback((deviceId: string | undefined) => {
    const nextCfg = { ...config, audioInputDeviceId: deviceId };
    setConfig(nextCfg);
    void saveConfig(nextCfg).catch(() => {});
  }, [config, setConfig]);

  const toggleMobileSttProvider = useCallback(() => {
    const nextProvider: 'native' | 'desktop' = desktopSttSelected ? 'native' : 'desktop';
    if (nextProvider === 'desktop' && !desktopSttAvailable) {
      Alert.alert(
        'Pair desktop first',
        'Desktop speech-to-text needs a paired DotAgents desktop URL and API key.',
        [{ text: 'OK' }],
      );
      return;
    }
    const nextCfg = { ...config, mobileSttProvider: nextProvider };
    setConfig(nextCfg);
    void saveConfig(nextCfg).catch(() => {});
  }, [config, desktopSttAvailable, desktopSttSelected, setConfig]);

  // TTS toggle
  const ttsEnabled = config.ttsEnabled !== false; // default true
  useEffect(() => {
    if (!ttsEnabled) return;
    void ensureNativeTtsAudioMode();
  }, [ttsEnabled]);

  const toggleTts = async () => {
    const next = !ttsEnabled;
    // Stop any currently playing TTS when disabling. The speaker icon doubles
    // as a "mute" control, so it must silence both native and remote (Edge)
    // playback and clear the auto-speech queue/state so nothing resumes.
    if (!next) {
      intendedSpeakingIndexRef.current = null;
      stopGlobalTtsPlayback();
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventRef.current = null;
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
  const respondingRef = useRef(false);
  const setRespondingValue = useCallback((value: boolean) => {
    respondingRef.current = value;
    setResponding(value);
  }, []);
  const [conversationState, setConversationState] = useState<AgentConversationState | null>(null);
  const [connectionState, setConnectionState] = useState<RecoveryState | null>(null);
  const [handsFreeHasHeadsetRoute, setHandsFreeHasHeadsetRoute] = useState<boolean | null>(null);
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const setMessages = useCallback((nextMessages: SetStateAction<ChatMessage[]>) => {
    const resolvedMessages =
      typeof nextMessages === 'function'
        ? (nextMessages as (previousMessages: ChatMessage[]) => ChatMessage[])(messagesRef.current)
        : nextMessages;
    messagesRef.current = resolvedMessages;
    setMessagesState(resolvedMessages);
  }, []);
  const [turnDurationNow, setTurnDurationNow] = useState(() => Date.now());
  const hasLiveAgentTurn = responding || conversationState === 'running';
  useEffect(() => {
    if (!hasLiveAgentTurn) return;
    setTurnDurationNow(Date.now());
    const interval = setInterval(() => setTurnDurationNow(Date.now()), TURN_DURATION_TICK_MS);
    return () => clearInterval(interval);
  }, [hasLiveAgentTurn]);
  const turnDurations = useMemo(
    () => computeTurnDurations(messages, !hasLiveAgentTurn, turnDurationNow),
    [hasLiveAgentTurn, messages, turnDurationNow]
  );

  // Track the current active request to prevent cross-request state clobbering
  // Each request gets a unique ID; only the currently active request can reset UI states
  const activeRequestIdRef = useRef<number>(0);

  // Stable ref for current session ID to avoid stale closures in callbacks
  // This fixes the issue where useSessions() returns a new object each render
  const currentSessionIdRef = useRef<string | null>(sessionStore.currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = sessionStore.currentSessionId;
  }, [sessionStore.currentSessionId]);
  const sessionListRef = useRef(sessionStore.sessions);
  useEffect(() => {
    sessionListRef.current = sessionStore.sessions;
  }, [sessionStore.sessions]);
  const serverGeneratedTitleRefreshJobsRef = useRef<Map<string, ServerGeneratedTitleRefreshJob>>(new Map());

  useEffect(() => () => {
    for (const job of serverGeneratedTitleRefreshJobsRef.current.values()) {
      job.cancelled = true;
      if (job.timer) {
        clearTimeout(job.timer);
      }
    }
    serverGeneratedTitleRefreshJobsRef.current.clear();
  }, []);

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
      setRespondingValue(false);
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
    setRespondingValue(isActive);
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

  const handleNewChat = useCallback(() => {
    // Reset all UI states unconditionally when creating a new chat
    // This ensures the new session starts with a clean slate, even if
    // an old request is still in-flight (its callbacks will be ignored
    // via the session/request guards)
    setRespondingValue(false);
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
    const launchSession = sessionStore.getCurrentSession();
    const launchDraftSessionId =
      launchSession &&
      !launchSession.serverConversationId &&
      launchSession.messages.length === 0
        ? launchSession.id
        : undefined;

    setRunningPromptTaskId(task.id);
    try {
      const result = await settingsClient.runLoop(task.id, {
        clientSessionId: launchDraftSessionId,
      });
      if (result.conversationId) {
        const syncResult = await sessionStore.syncWithServer(settingsClient);
        if (syncResult.errors.includes('Sync already in progress')) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await sessionStore.syncWithServer(settingsClient);
        }
        const taskSession = sessionStore.findSessionByServerConversationId(result.conversationId);
        if (taskSession) {
          sessionStore.setCurrentSession(taskSession.id);
          if (launchDraftSessionId && taskSession.id !== launchDraftSessionId) {
            void sessionStore.deleteSession(launchDraftSessionId);
          }
          navigation.navigate('Chat');
          return;
        }
      }
      Alert.alert('Task completed', `"${task.name}" finished on desktop. It will appear in chat history after sync.`);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to run task.');
    } finally {
      setRunningPromptTaskId(null);
    }
  }, [navigation, runningPromptTaskId, sessionStore, settingsClient]);

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

  const openHandsFreeGuide = useCallback(() => {
    setHandsFreeGuideVisible(true);
  }, []);

  const closeHandsFreeGuide = useCallback(() => {
    setHandsFreeGuideVisible(false);
  }, []);

  const handleOpenHandsFreeGuideFromMenu = useCallback(() => {
    closeChatMenu();
    openHandsFreeGuide();
  }, [closeChatMenu, openHandsFreeGuide]);

  const dismissHandsFreeGuide = useCallback(() => {
    setHandsFreeGuideVisible(false);
    setHandsFreeGuideDismissed(true);
    void AsyncStorage.setItem(HANDS_FREE_GUIDE_DISMISSED_KEY, 'true').catch(() => {});
  }, []);

  const handleQuickStartPress = useCallback((item: QuickStartShortcut) => {
    if (item.action === 'add-prompt') {
      openAddPromptModal();
      return;
    }
    if (item.source === 'task' && item.task) {
      void handleRunPromptTask(item.task);
      return;
    }
    handleInsertQuickStartPrompt(item.content);
  }, [handleInsertQuickStartPrompt, handleRunPromptTask, openAddPromptModal]);

  const handleOpenGlobalTtsSession = useCallback((sessionId: string) => {
    if (!sessionId) return;
    if (!sessionStore.sessions.some(session => session.id === sessionId)) {
      return;
    }
    if (sessionStore.currentSessionId !== sessionId) {
      sessionStore.setCurrentSession(sessionId);
    }
    navigation?.navigate?.('Chat');
  }, [navigation, sessionStore]);

  const handleBranchFromMessage = useCallback(async (messageIndex: number) => {
    const serverConversationId = currentSession?.serverConversationId;
    if (!settingsClient || !serverConversationId) {
      Alert.alert('Branch Unavailable', 'This chat is not linked to a desktop conversation yet.');
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

      Alert.alert('Branch Created', 'The branched chat will appear in the chat list after sync.');
    } catch (error: any) {
      Alert.alert('Branch Failed', error?.message || 'Failed to branch this conversation.');
    } finally {
      setBranchingMessageIndex(null);
    }
  }, [currentSession?.serverConversationId, navigation, sessionStore, settingsClient]);

  const respondToToolApproval = useCallback(async (approvalId: string, approved: boolean) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before responding to tool approvals.');
      return;
    }

    setPendingToolApprovalResponseId(approvalId);
    try {
      const response = await settingsClient.respondToToolApproval(approvalId, approved);
      setMessages((current) => current.filter((message) => message.toolApproval?.approvalId !== approvalId));
      if (!response.success) {
        Alert.alert('Approval Unavailable', 'The approval request is no longer pending.');
      }
    } catch (error: any) {
      Alert.alert('Approval Failed', error?.message || 'Failed to respond to the tool approval request.');
    } finally {
      setPendingToolApprovalResponseId(null);
    }
  }, [settingsClient]);
  const [visibleMessageCount, setVisibleMessageCount] = useState(INITIAL_VISIBLE_CHAT_MESSAGES);
  // Track progress messages so we can merge them with final conversationHistory
  // instead of replacing, preventing intermediate messages from disappearing (#1083)
  const progressMessagesRef = useRef<ChatMessage[]>([]);
  const progressStepsRef = useRef<AgentProgressStep[]>([]);
  const progressHistoryRef = useRef<LiveProgressHistoryState | null>(null);
  // Track respond_to_user history for the current session (Issue #26)
  const respondToUserHistoryRef = useRef<AgentUserResponseEvent[]>([]);
  const nextResponseEventOrdinalRef = useRef(1);
  const playedResponseEventIdsRef = useRef<Set<string>>(new Set());
  const queuedResponseEventsRef = useRef<QueuedResponseSpeechItem[]>([]);
  const activeAutoSpeechEventRef = useRef<QueuedResponseSpeechItem | null>(null);
  const autoTtsSuppressedRequestIdsRef = useRef<Set<number>>(new Set());
  const recentAutoSpeechByTextRef = useRef<Map<string, number>>(new Map());
  const lastHandsFreeSpokenTextRef = useRef('');
  const speakHandsFreeTextRef = useRef<(
    content: string,
    reason: string,
    onSettled?: () => void,
  ) => boolean>(() => false);
  const pendingAgentVoiceActionRef = useRef<PendingAgentVoiceAction | null>(null);
  const androidHandsFreeTtsHandlersRef = useRef<Map<string, AndroidHandsFreeTtsHandler>>(new Map());
  const ttsBargeInLastHandledRef = useRef<{ command: 'stop'; timestamp: number } | null>(null);
  const handsFreeBargeInTranscriptSuppressedUntilRef = useRef(0);
  const assistantSpeechStartedAtRef = useRef(0);
  const lastHandsFreeAudioCuePhaseRef = useRef<HandsFreePhase | null>(null);
  const lastHandsFreeSessionReadyCueAtRef = useRef(0);
  const lastHandsFreePreviewSubmittedCueAtRef = useRef(0);
  const lastForegroundHandsFreeAutoStartAtRef = useRef(0);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
	// Stable ref to the latest send() to avoid stale closures in speech callbacks
  const sendRef = useRef<(
    text: string,
    options?: { fromComposer?: boolean; source?: 'handsfree'; onSubmitted?: () => void },
  ) => Promise<void>>(async () => {});
  const androidHandsFreePendingPartialRef = useRef('');
  const androidHandsFreeLastSentRef = useRef<{ text: string; timestamp: number } | null>(null);
  const handsFreeLastFinalizedRef = useRef<{ text: string; timestamp: number } | null>(null);
  const acceptedHandsFreeControlPreviewRef = useRef<{ text: string; timestamp: number } | null>(null);
	  const [input, setInput] = useState('');
  const [pendingHandsFreeDraft, setPendingHandsFreeDraft] = useState('');
  const pendingHandsFreeDraftRef = useRef('');
	  const setPendingHandsFreeDraftValue = useCallback((value: string) => {
    pendingHandsFreeDraftRef.current = value;
    setPendingHandsFreeDraft(value);
  }, []);
	  useEffect(() => {
    if (!handsFree || handsFreeAutoSend) {
      setPendingHandsFreeDraftValue('');
    }
  }, [handsFree, handsFreeAutoSend, setPendingHandsFreeDraftValue]);
	  const [pendingImages, setPendingImages] = useState<PendingImageAttachment[]>([]);
	  const mentraPendingPhotoSessionRef = useRef(sessionStore.currentSessionId);
	  useEffect(() => {
	    if (mentraPendingPhotoSessionRef.current === sessionStore.currentSessionId) return;
	    mentraPendingPhotoSessionRef.current = sessionStore.currentSessionId;
	    mentra.clearPendingPhoto();
	  }, [mentra.clearPendingPhoto, sessionStore.currentSessionId]);
	  const inputRef = useRef<TextInput>(null);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [androidHandsFreeDebounceEndsAt, setAndroidHandsFreeDebounceEndsAt] = useState<number | null>(null);
  const [handsFreeCountdownNow, setHandsFreeCountdownNow] = useState(Date.now());
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  // Track which individual tool calls are fully expanded to show all input/output details
  // Key format: "messageId-toolCallIndex" (messageId falls back to message array index if undefined)
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});
  // Track which tool-activity groups are expanded (keyed by startIndex so the
  // state survives when new tool/skill messages append to the same group)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const copiedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setCopiedMessageIndex((currentIndex) => (
        currentIndex === messageIndex ? null : currentIndex
      ));
      copiedMessageTimeoutRef.current = null;
    }, MESSAGE_COPY_FEEDBACK_RESET_MS);
  }, []);
  useEffect(() => () => {
    if (copiedMessageTimeoutRef.current) {
      clearTimeout(copiedMessageTimeoutRef.current);
      copiedMessageTimeoutRef.current = null;
    }
  }, []);

  const getAndroidKeyboardHeight = useCallback((event?: RNKeyboardEvent) => {
    const eventHeight = event?.endCoordinates?.height ?? 0;
    const keyboardTop = event?.endCoordinates?.screenY;
    const heightFromTop =
      typeof keyboardTop === 'number'
        ? Math.max(0, screenHeight - keyboardTop)
        : 0;
    const measuredHeight = heightFromTop > 0 ? heightFromTop : eventHeight;
    return Math.round(Math.max(0, measuredHeight - compactPrimaryNavHeight));
  }, [compactPrimaryNavHeight, screenHeight]);

  const handleComposerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight <= 0) return;
    setComposerHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const visibleMetrics = Keyboard.metrics();
    if (visibleMetrics) {
      const metricsHeightFromTop = Math.max(0, screenHeight - visibleMetrics.screenY);
      const metricsHeight = metricsHeightFromTop > 0 ? metricsHeightFromTop : visibleMetrics.height;
      setAndroidKeyboardHeight(Math.round(Math.max(0, metricsHeight - compactPrimaryNavHeight)));
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setAndroidKeyboardHeight(getAndroidKeyboardHeight(event));
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [compactPrimaryNavHeight, getAndroidKeyboardHeight, screenHeight]);

  const handleCopyMessage = useCallback(async (messageIndex: number, content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await Clipboard.setStringAsync(copyContent);
      showCopiedMessageFeedback(messageIndex);
    } catch (error: any) {
      Alert.alert('Copy Failed', error?.message || 'Could not copy this message.');
    }
  }, [showCopiedMessageFeedback]);

  const handleCopyToolPayload = useCallback(async (content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await Clipboard.setStringAsync(copyContent);
    } catch (error: any) {
      Alert.alert('Copy Failed', error?.message || 'Could not copy this tool payload.');
    }
  }, []);
  // Track the last failed message for retry functionality
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
	  const [willCancel, setWillCancel] = useState(false);

  const { events: voiceEvents, log: voiceLog, clear: clearVoiceDebug } = useVoiceDebug(handsFreeDebugEnabled);
  useEffect(() => {
    if (!handsFreeDebugEnabled) {
      clearVoiceDebug();
    }
  }, [clearVoiceDebug, handsFreeDebugEnabled]);

  // Route hands-free audio cues through the Android foreground service while
  // background hands-free is configured, so beeps remain audible/consistent
  // when the app is backgrounded (matches issue #541 acceptance criteria).
  useEffect(() => {
    setAndroidHandsFreeCueRoutingEnabled(shouldRunAndroidHandsFreeService);
    return () => {
      setAndroidHandsFreeCueRoutingEnabled(false);
    };
  }, [shouldRunAndroidHandsFreeService]);

  useEffect(() => {
    if (Platform.OS === 'web' || !handsFree || !isAppActive || !isFocused) {
      return;
    }

    let released = false;
    void KeepAwake.activateKeepAwakeAsync(HANDS_FREE_KEEP_AWAKE_TAG).catch((error) => {
      voiceLog('recognizer-error', 'Handsfree keep-awake activation failed.', {
        message: (error as any)?.message || String(error),
      });
    });

    return () => {
      if (released) return;
      released = true;
      void KeepAwake.deactivateKeepAwake(HANDS_FREE_KEEP_AWAKE_TAG).catch((error) => {
        voiceLog('recognizer-error', 'Handsfree keep-awake release failed.', {
          message: (error as any)?.message || String(error),
        });
      });
    };
  }, [handsFree, isAppActive, isFocused, voiceLog]);

  useEffect(() => {
    if (!handsFree || Platform.OS !== 'android' || !androidHandsFreeServiceAvailable) {
      setHandsFreeHasHeadsetRoute(null);
      return;
    }

    let cancelled = false;
    let lastRouteKey: string | null = null;

    const refreshAudioRoute = () => {
      void getAndroidHandsFreeAudioRoute().then((route) => {
        if (cancelled || !route) return;
        setHandsFreeHasHeadsetRoute(route.hasHeadset);
        const routeKey = `${route.hasHeadset}:${route.route}:${route.inputTypes}:${route.outputTypes}`;
        if (routeKey !== lastRouteKey) {
          lastRouteKey = routeKey;
          voiceLog('runtime-state', 'Handsfree audio route evaluated.', route);
        }
      }).catch((error) => {
        if (cancelled) return;
        voiceLog('recognizer-error', 'Handsfree audio route detection failed.', {
          message: (error as any)?.message || String(error),
        });
      });
    };

    refreshAudioRoute();
    const interval = setInterval(refreshAudioRoute, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [androidHandsFreeServiceAvailable, handsFree, voiceLog]);

  useEffect(() => {
    if (!handsFree) {
      return;
    }
    console.info(
      `[DotAgentsHandsFreeJS] runtime active=${handsFreeRuntimeActive} appState=${appState} focused=${isFocused} stableForeground=${stableHandsFreeForeground} backgroundService=${androidBackgroundHandsFree} serviceMic=${androidServiceHandlesHandsFreeMic} directWhileSleeping=${allowHandsFreeDirectSpeechWhileSleeping}`,
    );
    voiceLog('runtime-state', 'Handsfree runtime evaluated.', {
      runtimeActive: handsFreeRuntimeActive,
      appState,
      isAppActive,
      isFocused,
      stableForeground: stableHandsFreeForeground,
      androidBackgroundHandsFree,
      androidServiceHandlesHandsFreeMic,
      allowDirectSpeechWhileSleeping: allowHandsFreeDirectSpeechWhileSleeping,
      debugForcedInDev: config.handsFreeDebug !== true && handsFreeDebugEnabled,
    });
  }, [
    allowHandsFreeDirectSpeechWhileSleeping,
    androidBackgroundHandsFree,
    androidServiceHandlesHandsFreeMic,
    appState,
    config.handsFreeDebug,
    handsFree,
    handsFreeDebugEnabled,
    handsFreeRuntimeActive,
    isAppActive,
    isFocused,
    stableHandsFreeForeground,
    voiceLog,
  ]);

  const handsFreeController = useHandsFreeController({
    enabled: handsFree,
    runtimeActive: handsFreeRuntimeActive,
    wakePhrase: handsFreeWakePhrase,
    sleepPhrase: handsFreeSleepPhrase,
    allowDirectSpeechWhileSleeping: allowHandsFreeDirectSpeechWhileSleeping,
    log: voiceLog,
  });
  handsFreePhaseRef.current = handsFreeController.state.phase;
  useEffect(() => {
    if (
      !handsFree
      || handsFreeController.state.phase === 'sleeping'
      || handsFreeController.state.phase === 'paused'
    ) {
      pendingAgentVoiceActionRef.current = null;
    }
  }, [handsFree, handsFreeController.state.phase]);
  const isAssistantAudioLoading = globalTtsPlayback?.status === 'loading';
  const isAssistantAudioSpeaking =
    handsFreeController.state.phase === 'speaking'
    || globalTtsPlayback?.status === 'speaking';
  const isAssistantAudioPendingOrSpeaking =
    isAssistantAudioLoading
    || isAssistantAudioSpeaking;
  const shouldKeepHandsFreeMicArmed = handsFreeController.shouldKeepRecognizerActive;
  const isAgentRunningInHeader = conversationState === 'running' || responding;
  const liveProgressFocus = useMemo(
    () => getLiveProgressFocus(progressStepsRef.current),
    [conversationState, messages, responding],
  );
  const shouldRenderLiveProgressFocus = isAgentRunningInHeader && (
    !!liveProgressFocus.thinking || !!liveProgressFocus.tool
  );
  const handsFreeDisplayPhase: HandsFreeDisplayPhase = handsFree
    ? (
        isAssistantAudioLoading
          ? 'processing'
          : isAssistantAudioSpeaking
            ? 'speaking'
            : handsFreeController.state.phase
      )
    : 'off';

  useLayoutEffect(() => {
    navigation?.setOptions?.({
      headerTitle: () => (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 44, maxWidth: 230 }}>
          {globalTtsPlayback ? (
            <GlobalTtsStatusPill
              compact
              onOpenSession={handleOpenGlobalTtsSession}
            />
          ) : (
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: theme.colors.foreground, maxWidth: 230 }}
              numberOfLines={1}
            >
              {currentSession?.title || 'Chat'}
            </Text>
          )}
        </View>
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
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            onPress={openChatMenu}
            accessibilityRole="button"
            accessibilityLabel="Open chat voice menu"
            accessibilityHint="Opens hands-free help, microphone selection, and chat controls."
            style={styles.headerActionButton}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    currentSession?.title,
    globalTtsPlayback,
    handleOpenGlobalTtsSession,
    navigation,
    openChatMenu,
    styles,
    theme.colors.foreground,
  ]);

  const shouldSuppressHandsFreeTranscript =
    handsFree
    && isAssistantAudioPendingOrSpeaking;
  const shouldSuppressHandsFreeTranscriptRef = useRef(shouldSuppressHandsFreeTranscript);
  shouldSuppressHandsFreeTranscriptRef.current = shouldSuppressHandsFreeTranscript;
  const lastHandsFreeSuppressionDiagnosticAtRef = useRef(0);
  const recoverStaleHandsFreeTtsIfNeeded = useCallback((reason: string) => {
    if (!handsFreeRef.current) return false;
    const playback = getGlobalTtsPlayback();
    const phase = handsFreePhaseRef.current;
    const playbackAgeMs = playback ? Date.now() - playback.startedAt : null;
    const stalePlayback =
      !!playback
      && playbackAgeMs !== null
      && playbackAgeMs > STALE_HANDS_FREE_TTS_RECOVERY_MS;
    const staleControllerSpeech = phase === 'speaking' && !playback;
    if (!stalePlayback && !staleControllerSpeech) {
      return false;
    }

    stopGlobalTtsPlayback();
    if (phase === 'speaking') {
      handsFreeController.onSpeechFinished();
    }
    voiceLog('tts-stopped', 'Recovered stale handsfree TTS state.', {
      reason,
      phase,
      playbackStatus: playback?.status,
      playbackAgeMs,
      playbackSource: playback?.source,
      textPreview: playback?.textPreview,
    });
    return true;
  }, [handsFreeController.onSpeechFinished, voiceLog]);
  const isHandsFreeTranscriptSuppressedNow = useCallback(() => {
    if (!handsFreeRef.current) return false;
    const now = Date.now();
    if (now < handsFreeBargeInTranscriptSuppressedUntilRef.current) {
      if (now - lastHandsFreeSuppressionDiagnosticAtRef.current >= 500) {
        lastHandsFreeSuppressionDiagnosticAtRef.current = now;
        console.info(
          `[DotAgentsHandsFreeJS] transcript suppression cause=barge-in-grace`
          + ` remainingMs=${handsFreeBargeInTranscriptSuppressedUntilRef.current - now}`,
        );
      }
      return true;
    }
    if (recoverStaleHandsFreeTtsIfNeeded('transcript-suppression-check')) {
      return false;
    }
    const playback = getGlobalTtsPlayback();
    const suppressed = (
      shouldSuppressHandsFreeTranscriptRef.current
      || !!playback
      || handsFreePhaseRef.current === 'speaking'
    );
    if (suppressed && now - lastHandsFreeSuppressionDiagnosticAtRef.current >= 500) {
      lastHandsFreeSuppressionDiagnosticAtRef.current = now;
      console.info(
        `[DotAgentsHandsFreeJS] transcript suppression cause=assistant-audio`
        + ` phase=${handsFreePhaseRef.current}`
        + ` playback=${playback?.id ?? 'none'}`
        + ` source=${playback?.source ?? 'none'}`
        + ` status=${playback?.status ?? 'none'}`
        + ` ageMs=${playback ? now - playback.startedAt : -1}`,
      );
    }
    return suppressed;
  }, [recoverStaleHandsFreeTtsIfNeeded]);
  const isProcessingStopTranscript = useCallback((text?: string) => {
    if (handsFreePhaseRef.current !== 'processing' || !text) return false;
    const match = matchVoiceCommand(text);
    return match?.command === 'stop' && !match.remainder;
  }, []);
  const isProcessingVoiceCommandTranscript = useCallback((text?: string) => {
    if (handsFreePhaseRef.current !== 'processing' || !text) return false;
    return !!matchVoiceCommand(text);
  }, []);
  const isHandsFreeVoiceCommandTranscript = useCallback((text?: string) => (
    !!text && !!matchVoiceCommand(text)
  ), []);
  const isHandsFreeFinalizationEligibleNow = useCallback((payload?: {
    text?: string;
    finalSegmentText?: string;
  }) => (
    !handsFreeRef.current
    || handsFreePhaseRef.current === 'sleeping'
    || handsFreePhaseRef.current === 'waking'
    || handsFreePhaseRef.current === 'listening'
    || isHandsFreeVoiceCommandTranscript(payload?.text)
    || isHandsFreeVoiceCommandTranscript(payload?.finalSegmentText)
    || isProcessingVoiceCommandTranscript(payload?.text)
    || isProcessingVoiceCommandTranscript(payload?.finalSegmentText)
  ), [isHandsFreeVoiceCommandTranscript, isProcessingVoiceCommandTranscript]);
  const isExactSleepingWakeTranscript = useCallback((text: string) => {
    if (!handsFreeRef.current || handsFreePhaseRef.current !== 'sleeping') {
      return false;
    }
    const wakeMatch = matchWakePhrase(text, handsFreeWakePhrase);
    return wakeMatch.matched && !wakeMatch.remainder;
  }, [handsFreeWakePhrase]);
  const shouldImmediatelyFinalizeHandsFreeTranscript = useCallback(({
    text,
    finalSegmentText,
    isFinal,
  }: {
    text: string;
    source: 'native' | 'web';
    isFinal?: boolean;
    finalSegmentText?: string;
  }) => (
    isExactSleepingWakeTranscript(text)
    || isProcessingVoiceCommandTranscript(text)
    || isProcessingVoiceCommandTranscript(finalSegmentText)
    || !!(finalSegmentText && matchVoiceCommand(finalSegmentText))
    || (
      !handsFreeAutoSend
      && isFinal === true
      && !!finalSegmentText
      && (
        matchesHandsFreeSendPhrase(finalSegmentText, handsFreeSendPhrase)
        || matchesHandsFreeSendPhrase(finalSegmentText, DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE)
      )
    )
  ), [
    handsFreeAutoSend,
    handsFreeSendPhrase,
    isExactSleepingWakeTranscript,
    isProcessingVoiceCommandTranscript,
  ]);

  const clearAcceptedHandsFreeControlPreview = useCallback((acceptedText: string) => {
    const normalizedAcceptedText = normalizeVoiceText(acceptedText);

    if (normalizedAcceptedText) {
      acceptedHandsFreeControlPreviewRef.current = {
        text: normalizedAcceptedText,
        timestamp: Date.now(),
      };
    }

    setSttPreviewWithExpiry('');
    voiceLog('runtime-state', 'Accepted handsfree wake phrase cleared from voice preview.', {
      textLength: normalizedAcceptedText.length,
    });
  }, [voiceLog]);

  const playHandsFreeCue = useCallback((cue: HandsFreeAudioCue): boolean => {
    if (!handsFreeRef.current) {
      return false;
    }
    const activeTts = getGlobalTtsPlayback();
    if (activeTts && !HANDS_FREE_CUES_ALLOWED_DURING_TTS.has(cue)) {
      voiceLog('runtime-state', 'Handsfree audio cue suppressed during TTS.', {
        cue,
        ttsStatus: activeTts.status,
        ttsSource: activeTts.source,
      });
      return false;
    }
    playHandsFreeAudioCue(cue);
    voiceLog('runtime-state', 'Handsfree audio cue played.', { cue });
    return true;
  }, [voiceLog]);

  const playHandsFreeSubmittedCue = useCallback(() => {
    lastHandsFreePreviewSubmittedCueAtRef.current = Date.now();
    const delayMs = Platform.OS === 'android' ? HANDS_FREE_SUBMITTED_CUE_ANDROID_DELAY_MS : 0;

    if (delayMs > 0) {
      setTimeout(() => playHandsFreeCue('prompt-submitted'), delayMs);
      return;
    }

    playHandsFreeCue('prompt-submitted');
  }, [playHandsFreeCue]);

  const playHandsFreeSessionReadyCue = useCallback((source: string) => {
    const now = Date.now();
    if (now - lastHandsFreeSessionReadyCueAtRef.current < HANDS_FREE_SESSION_READY_CUE_MIN_INTERVAL_MS) {
      return;
    }
    lastHandsFreeSessionReadyCueAtRef.current = now;
    if (playHandsFreeCue('session-ready')) {
      voiceLog('runtime-state', 'Handsfree session ready cue played.', { source });
    }
  }, [playHandsFreeCue, voiceLog]);

  const playProgressToolCallCues = useCallback((
    update: AgentProgressUpdate,
    announcedToolCallKeys: Set<string>,
  ) => {
    if (!handsFreeRef.current || !update.steps?.length) {
      return;
    }

    update.steps.forEach((step: any, index) => {
      if (step?.type !== 'tool_call' || !step.toolCall) {
        return;
      }

      const toolCall = step.toolCall;
      const toolKey = [
        index,
        toolCall.id ?? toolCall.callId ?? toolCall.name ?? step.title ?? 'tool',
      ].join(':');
      if (announcedToolCallKeys.has(toolKey)) {
        return;
      }

      announcedToolCallKeys.add(toolKey);
      playHandsFreeCue('tool-called');
    });
  }, [playHandsFreeCue]);

  const scheduleServerGeneratedTitleRefresh = useCallback((
    sessionId: string | null | undefined,
    serverConversationId: string | undefined,
    source: 'send' | 'queued',
  ) => {
    if (!settingsClient || !sessionId || !serverConversationId) {
      return;
    }

    const refreshKey = `${sessionId}:${serverConversationId}`;
    const existingJob = serverGeneratedTitleRefreshJobsRef.current.get(refreshKey);
    if (existingJob) {
      existingJob.cancelled = true;
      if (existingJob.timer) {
        clearTimeout(existingJob.timer);
      }
      serverGeneratedTitleRefreshJobsRef.current.delete(refreshKey);
    }

    const getTargetSession = () => (
      sessionListRef.current.find(session => session.id === sessionId)
    );
    const shouldContinue = () => (
      canRefreshServerGeneratedSessionTitle(getTargetSession(), serverConversationId)
    );
    if (!shouldContinue()) {
      return;
    }

    const job: ServerGeneratedTitleRefreshJob = { cancelled: false, timer: null };
    serverGeneratedTitleRefreshJobsRef.current.set(refreshKey, job);
    let attemptIndex = 0;

    const finish = () => {
      job.cancelled = true;
      if (job.timer) {
        clearTimeout(job.timer);
        job.timer = null;
      }
      if (serverGeneratedTitleRefreshJobsRef.current.get(refreshKey) === job) {
        serverGeneratedTitleRefreshJobsRef.current.delete(refreshKey);
      }
    };

    const scheduleNextAttempt = () => {
      if (job.cancelled) return;
      if (!shouldContinue()) {
        finish();
        return;
      }

      const delayMs = SERVER_GENERATED_TITLE_REFRESH_DELAYS_MS[attemptIndex];
      if (delayMs === undefined) {
        finish();
        return;
      }

      const attempt = attemptIndex + 1;
      attemptIndex += 1;
      job.timer = setTimeout(() => {
        job.timer = null;
        void (async () => {
          if (job.cancelled) return;
          if (!shouldContinue()) {
            finish();
            return;
          }

          try {
            console.info('[ChatScreen] Refreshing server-generated conversation title.', {
              source,
              sessionId,
              serverConversationId,
              attempt,
              delayMs,
            });
            const fullConversation = await settingsClient.getConversation(serverConversationId);
            const applied = await sessionStore.setServerGeneratedTitleForSession(
              sessionId,
              serverConversationId,
              fullConversation.title,
              fullConversation.titleSource,
            );
            console.info('[ChatScreen] Server-generated title refresh completed.', {
              source,
              sessionId,
              serverConversationId,
              title: fullConversation.title,
              titleSource: fullConversation.titleSource,
              applied,
            });

            if (applied || !shouldContinue()) {
              finish();
              return;
            }
          } catch (error: any) {
            console.warn('[ChatScreen] Failed to refresh server-generated conversation title:', {
              source,
              sessionId,
	              serverConversationId,
	              attempt,
	              message: error?.message || String(error),
	            });
	          }

	          scheduleNextAttempt();
        })();
      }, delayMs);
    };

    scheduleNextAttempt();
  }, [sessionStore, settingsClient]);

  const ensureServerConversationForExistingFollowUp = useCallback(async (
    source: 'send' | 'queued',
  ): Promise<string | undefined> => {
    const sessionId = currentSessionIdRef.current;
    const session = sessionStore.getCurrentSession();
    if (!sessionId || !session || session.id !== sessionId) {
      return undefined;
    }
    if (session.serverConversationId) {
      return session.serverConversationId;
    }
    if (session.messages.length === 0 || !settingsClient) {
      return undefined;
    }

    console.log('[ChatScreen] Existing session missing serverConversationId before follow-up; syncing before send:', {
      source,
      sessionId,
      messageCount: session.messages.length,
      title: session.title,
    });

    try {
      await sessionStore.syncWithServer(settingsClient);
    } catch (error: any) {
      console.warn('[ChatScreen] Failed to sync unlinked session before follow-up:', error?.message || error);
      return undefined;
    }

    if (currentSessionIdRef.current !== sessionId) {
      return undefined;
    }

    const refreshedSession = sessionStore.getCurrentSession();
    const serverConversationId = refreshedSession?.serverConversationId;
    if (serverConversationId) {
      console.log('[ChatScreen] Linked existing session before follow-up:', {
        source,
        sessionId,
        serverConversationId,
      });
    } else {
      console.warn('[ChatScreen] Existing session still missing serverConversationId after sync:', {
        source,
        sessionId,
      });
    }
    return serverConversationId;
  }, [sessionStore, settingsClient]);

  const clearAndroidHandsFreePartialTimer = useCallback(() => {
    setAndroidHandsFreeDebounceEndsAt(null);
  }, []);

  const stopCurrentAgentTurnFromVoice = useCallback(async () => {
    if (!settingsClient) {
      setDebugInfo('Stopped locally, but the desktop is not connected.');
      return false;
    }

    try {
      let sessionId = currentOperatorSession?.id;
      if (!sessionId && currentSession?.serverConversationId) {
        const status = await settingsClient.getOperatorStatus();
        const refreshedSessions = status.sessions.activeSessionDetails ?? [];
        setOperatorSessions(refreshedSessions);
        sessionId = refreshedSessions.find(
          (session) => session.conversationId === currentSession.serverConversationId,
        )?.id;
      }

      if (!sessionId) {
        setDebugInfo('Stopped locally, but no active desktop session was found.');
        return false;
      }

      const result = await settingsClient.stopOperatorAgentSession(sessionId);
      if (!result.success) {
        setDebugInfo(result.message || result.error || 'The desktop could not stop the agent turn.');
        return false;
      }

      setOperatorSessions((sessions) => sessions.filter((session) => session.id !== sessionId));
      setDebugInfo('Stopped the current agent turn.');
      voiceLog('handsfree-control', 'Desktop agent session stopped by voice command.', { sessionId });
      return true;
    } catch (error: any) {
      setDebugInfo(error?.message || 'The desktop could not stop the agent turn.');
      voiceLog('handsfree-control', 'Desktop agent session stop failed.', {
        error: error?.message || String(error),
      });
      return false;
    }
  }, [currentOperatorSession?.id, currentSession?.serverConversationId, settingsClient, voiceLog]);

  const stopHandsFreeActivityFromVoice = useCallback((source: 'command' | 'tts-barge-in' | 'hardware') => {
    clearAndroidHandsFreePartialTimer();
    androidHandsFreePendingPartialRef.current = '';
    queuedResponseEventsRef.current = [];
    activeAutoSpeechEventRef.current = null;
    assistantSpeechStartedAtRef.current = 0;

    const playback = getGlobalTtsPlayback();
    const targets = resolveHandsFreeStopTargets({
      phase: handsFreePhaseRef.current,
      hasPlayback: !!playback,
      responding: respondingRef.current,
      hasActiveOperatorSession: !!currentOperatorSession?.id,
    });

    if (activeRequestIdRef.current) {
      autoTtsSuppressedRequestIdsRef.current.add(activeRequestIdRef.current);
    }
    stopGlobalTtsPlayback();
    if (handsFreePhaseRef.current === 'speaking') {
      handsFreeController.onSpeechFinished();
    }

    if (targets.stopAgentTurn) {
      activeRequestIdRef.current = 0;
      getSessionClient()?.cleanup();
      handsFreeController.onRequestCompleted();
      setRespondingValue(false);
      setDebugInfo(targets.stopSpeech
        ? 'Stopped speaking. Stopping the current agent turn.'
        : 'Stopping the current agent turn.');
      void stopCurrentAgentTurnFromVoice();
    } else {
      setDebugInfo(targets.stopSpeech ? 'Stopped speaking. Listening.' : 'Nothing active to stop.');
    }

    playHandsFreeCue('stopped');
    voiceLog('handsfree-control', 'Handsfree stop action applied.', {
      source,
      stoppedSpeech: targets.stopSpeech,
      stoppingAgentTurn: targets.stopAgentTurn,
      playbackStatus: playback?.status,
    });
    return targets;
  }, [
    clearAndroidHandsFreePartialTimer,
    currentOperatorSession?.id,
    getSessionClient,
    handsFreeController.onRequestCompleted,
    handsFreeController.onSpeechFinished,
    playHandsFreeCue,
    setRespondingValue,
    stopCurrentAgentTurnFromVoice,
    voiceLog,
  ]);

  const handleHandsFreeTtsBargeInCommand = useCallback((text: string, source: 'native' | 'web') => {
    const command = matchHandsFreeTtsBargeInCommand(text);
    if (!command || !handsFreeRef.current) {
      return false;
    }

    const playback = getGlobalTtsPlayback();
    if (!playback && handsFreePhaseRef.current !== 'speaking') {
      return false;
    }

    const now = Date.now();
    const lastHandled = ttsBargeInLastHandledRef.current;
    if (
      lastHandled
      && lastHandled.command === command
      && now - lastHandled.timestamp < HANDS_FREE_TTS_BARGE_IN_DUPLICATE_SUPPRESSION_MS
    ) {
      return true;
    }
    ttsBargeInLastHandledRef.current = { command, timestamp: now };

    handsFreeBargeInTranscriptSuppressedUntilRef.current = now + HANDS_FREE_TTS_BARGE_IN_TRANSCRIPT_SUPPRESSION_MS;
    const targets = stopHandsFreeActivityFromVoice('tts-barge-in');
    voiceLog('tts-stopped', `Assistant speech interrupted by "${command}".`, {
      source,
      command,
      text,
      stoppingAgentTurn: targets.stopAgentTurn,
    });
    return true;
  }, [
    stopHandsFreeActivityFromVoice,
    voiceLog,
  ]);

  const handleHandsFreeTtsBargeInSpeechStarted = useCallback((source: 'native' | 'web') => {
    if (!handsFreeRef.current) {
      return false;
    }

    const playback = getGlobalTtsPlayback();
    const now = Date.now();
    if (playback?.status !== 'speaking') {
      return false;
    }

    const assistantSpeechStartedAt = assistantSpeechStartedAtRef.current || playback.startedAt;
    if (now - assistantSpeechStartedAt < HANDS_FREE_TTS_SPEECH_STARTED_BARGE_IN_GRACE_MS) {
      return false;
    }

    const lastHandled = ttsBargeInLastHandledRef.current;
    if (
      lastHandled
      && now - lastHandled.timestamp < HANDS_FREE_TTS_BARGE_IN_DUPLICATE_SUPPRESSION_MS
    ) {
      return true;
    }
    ttsBargeInLastHandledRef.current = { command: 'stop', timestamp: now };

    clearAndroidHandsFreePartialTimer();
    androidHandsFreePendingPartialRef.current = '';
    handsFreeBargeInTranscriptSuppressedUntilRef.current = now + HANDS_FREE_TTS_BARGE_IN_TRANSCRIPT_SUPPRESSION_MS;
    queuedResponseEventsRef.current = [];
    activeAutoSpeechEventRef.current = null;
    assistantSpeechStartedAtRef.current = 0;
    if (activeRequestIdRef.current) {
      autoTtsSuppressedRequestIdsRef.current.add(activeRequestIdRef.current);
    }
    stopGlobalTtsPlayback();
    if (handsFreePhaseRef.current === 'speaking') {
      handsFreeController.onSpeechFinished();
    }
    setDebugInfo('Stopped speaking. Listening.');
    playHandsFreeCue('stopped');
    voiceLog('tts-stopped', 'Assistant speech interrupted by detected user speech.', {
      source,
    });
    return true;
  }, [
    clearAndroidHandsFreePartialTimer,
    handsFreeController.onSpeechFinished,
    playHandsFreeCue,
    voiceLog,
  ]);

  const getVoiceAgentChoices = useCallback(
    () => getRecentActiveAgentSessions(sessionStore.sessions, 5),
    [sessionStore.sessions],
  );

  const closeVoiceAgentPicker = useCallback(() => {
    setVoiceAgentPickerVisible(false);
    if (pendingAgentVoiceActionRef.current?.command === 'focus') {
      pendingAgentVoiceActionRef.current = null;
    }
  }, []);

  const announceVoiceAgentChoices = useCallback((requestedName?: string, onSettled?: () => void) => {
    const availableAgents = getVoiceAgentChoices();
    if (availableAgents.length === 0) {
      const message = 'No active agents are available. Say new agent to start one.';
      setDebugInfo(message);
      const didSpeak = speakHandsFreeTextRef.current(message, 'voice agent discovery', onSettled);
      if (!didSpeak) onSettled?.();
      playHandsFreeCue('stopped');
      return false;
    }

    const names = availableAgents.map((session) => session.title).join(', ');
    const message = requestedName
      ? `I could not find ${requestedName}. Active agents are ${names}. Say an agent name.`
      : `Active agents are ${names}. Say an agent name.`;
    setDebugInfo(message);
    const didSpeak = speakHandsFreeTextRef.current(message, 'voice agent discovery', onSettled);
    if (!didSpeak) onSettled?.();
    return true;
  }, [getVoiceAgentChoices, playHandsFreeCue]);

  const focusVoiceAgentSession = useCallback((spokenName: string) => {
    const reference = resolveAgentSessionReference(spokenName, getVoiceAgentChoices());
    if (!reference) {
      pendingAgentVoiceActionRef.current = { command: 'focus', awaiting: 'target' };
      if (activeRequestIdRef.current) {
        autoTtsSuppressedRequestIdsRef.current.add(activeRequestIdRef.current);
      }
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventRef.current = null;
      assistantSpeechStartedAtRef.current = 0;
      if (getGlobalTtsPlayback()) {
        stopGlobalTtsPlayback();
      }
      setVoiceAgentPickerVisible(true);
      announceVoiceAgentChoices(spokenName);
      return false;
    }

    pendingAgentVoiceActionRef.current = null;
    setVoiceAgentPickerVisible(false);
    const isDifferentSession = sessionStore.currentSessionId !== reference.session.id;
    sessionStore.setCurrentSession(reference.session.id);
    if (isDifferentSession) {
      navigation.navigate('Chat');
    }
    setDebugInfo(`Focused ${reference.session.title}.`);
    speakHandsFreeTextRef.current(`Focused ${reference.session.title}.`, 'voice agent focus confirmation');
    playHandsFreeCue('session-ready');
    return true;
  }, [announceVoiceAgentChoices, getVoiceAgentChoices, navigation, playHandsFreeCue, sessionStore]);

  const closeVoiceAgentSession = useCallback(async (spokenName: string) => {
    const reference = resolveAgentSessionReference(spokenName, getVoiceAgentChoices());
    if (!reference) {
      pendingAgentVoiceActionRef.current = { command: 'close', awaiting: 'target' };
      announceVoiceAgentChoices(spokenName);
      return false;
    }

    pendingAgentVoiceActionRef.current = null;
    const wasCurrentSession = sessionStore.currentSessionId === reference.session.id;
    await sessionStore.toggleSessionArchived(reference.session.id, settingsClient || undefined);
    if (wasCurrentSession) {
      handleNewChat();
    }
    setDebugInfo(`Closed ${reference.session.title}.`);
    speakHandsFreeTextRef.current(`Closed ${reference.session.title}.`, 'voice agent close confirmation');
    playHandsFreeCue('session-ready');
    return true;
  }, [announceVoiceAgentChoices, getVoiceAgentChoices, handleNewChat, playHandsFreeCue, sessionStore, settingsClient]);

  const messageVoiceAgentSession = useCallback(async (spokenRemainder: string) => {
    const reference = resolveAgentSessionReference(spokenRemainder, getVoiceAgentChoices());
    if (!reference) {
      pendingAgentVoiceActionRef.current = { command: 'message', awaiting: 'target' };
      announceVoiceAgentChoices(spokenRemainder);
      return false;
    }

    const message = normalizeAgentSessionMessage(reference.remainder);
    if (!message) {
      pendingAgentVoiceActionRef.current = {
        command: 'message',
        awaiting: 'message',
        sessionId: reference.session.id,
        sessionTitle: reference.session.title,
      };
      const prompt = `What should I send to ${reference.session.title}?`;
      setDebugInfo(prompt);
      speakHandsFreeTextRef.current(prompt, 'voice agent message prompt');
      return true;
    }

    pendingAgentVoiceActionRef.current = null;
    try {
      await sendMessageToAgentSession({
        sessionId: reference.session.id,
        text: message,
        sessionStore,
        connectionManager,
        settingsClient,
      });
      setDebugInfo(`Message sent to ${reference.session.title}.`);
      speakHandsFreeTextRef.current(`Message sent to ${reference.session.title}.`, 'voice agent message confirmation');
      playHandsFreeCue('session-ready');
      return true;
    } catch (error: any) {
      const errorMessage = error?.message || 'The message could not be sent.';
      setDebugInfo(errorMessage);
      voiceLog('handsfree-control', 'Background agent message failed.', {
        sessionId: reference.session.id,
        error: errorMessage,
      });
      speakHandsFreeTextRef.current(errorMessage, 'voice agent message error');
      return false;
    }
  }, [announceVoiceAgentChoices, connectionManager, getVoiceAgentChoices, playHandsFreeCue, sessionStore, settingsClient, voiceLog]);

  const handlePendingAgentVoiceText = useCallback(async (text: string) => {
    const pending = pendingAgentVoiceActionRef.current;
    if (!pending) return false;

    if (pending.awaiting === 'target') {
      const reference = resolveAgentSessionReference(text, getVoiceAgentChoices());
      if (!reference) {
        announceVoiceAgentChoices(text);
        return true;
      }
      if (pending.command === 'focus') {
        focusVoiceAgentSession(reference.session.title);
      } else if (pending.command === 'close') {
        await closeVoiceAgentSession(reference.session.title);
      } else {
        await messageVoiceAgentSession(reference.session.title);
      }
      return true;
    }

    const message = normalizeAgentSessionMessage(text);
    if (!message || !pending.sessionId || !pending.sessionTitle) {
      return true;
    }
    pendingAgentVoiceActionRef.current = null;
    try {
      await sendMessageToAgentSession({
        sessionId: pending.sessionId,
        text: message,
        sessionStore,
        connectionManager,
        settingsClient,
      });
      setDebugInfo(`Message sent to ${pending.sessionTitle}.`);
      speakHandsFreeTextRef.current(`Message sent to ${pending.sessionTitle}.`, 'voice agent message confirmation');
      playHandsFreeCue('session-ready');
    } catch (error: any) {
      const errorMessage = error?.message || 'The message could not be sent.';
      setDebugInfo(errorMessage);
      speakHandsFreeTextRef.current(errorMessage, 'voice agent message error');
    }
    return true;
  }, [announceVoiceAgentChoices, closeVoiceAgentSession, connectionManager, focusVoiceAgentSession, getVoiceAgentChoices, messageVoiceAgentSession, playHandsFreeCue, sessionStore, settingsClient]);

  const handleHandsFreeVoiceCommand = useCallback((
    command: VoiceCommandId,
    label: string,
    remainder = '',
  ) => {
    voiceLog('handsfree-control', `Handsfree voice command dispatched: ${label}.`, { command, remainder });
    switch (command) {
      case 'stop': {
        pendingAgentVoiceActionRef.current = null;
        stopHandsFreeActivityFromVoice('command');
        break;
      }
      case 'new-session': {
        pendingAgentVoiceActionRef.current = null;
        handleNewChat();
        setDebugInfo('Started a new chat.');
        playHandsFreeCue('session-ready');
        break;
      }
      case 'switch-agent': {
        focusVoiceAgentSession(remainder);
        break;
      }
      case 'message-agent': {
        void messageVoiceAgentSession(remainder);
        break;
      }
      case 'new-agent': {
        pendingAgentVoiceActionRef.current = null;
        setVoiceAgentPickerVisible(false);
        handleNewChat();
        const initialMessage = normalizeAgentSessionMessage(remainder);
        if (initialMessage) {
          void sendRef.current(initialMessage, { source: 'handsfree' });
        }
        setDebugInfo(initialMessage ? 'Started a new agent and sent the first message.' : 'Started a new agent.');
        speakHandsFreeTextRef.current(
          initialMessage ? 'Started a new agent and sent the first message.' : 'Started a new agent.',
          'voice new agent confirmation',
        );
        playHandsFreeCue('session-ready');
        break;
      }
      case 'close-agent': {
        void closeVoiceAgentSession(remainder);
        break;
      }
      case 'repeat': {
        const lastSpokenText = lastHandsFreeSpokenTextRef.current;
        if (!lastSpokenText) {
          setDebugInfo('Nothing to repeat yet.');
          playHandsFreeCue('stopped');
          break;
        }
        recentAutoSpeechByTextRef.current.delete(normalizeAutoTtsTextKey(lastSpokenText));
        speakHandsFreeTextRef.current(lastSpokenText, 'voice repeat');
        setDebugInfo('Repeating the last response.');
        break;
      }
      default: {
        const _exhaustive: never = command;
        void _exhaustive;
      }
    }
  }, [closeVoiceAgentSession, focusVoiceAgentSession, handleNewChat, messageVoiceAgentSession, playHandsFreeCue, stopHandsFreeActivityFromVoice, voiceLog]);

  const composeMentraVoicePrompt = useCallback((text: string, source: 'native' | 'web' | 'mentra') => {
    if (source !== 'mentra' || !mentra.pendingPhoto) return { text };
    if (mentra.pendingPhoto.expiresAt <= Date.now()) {
      mentra.clearPendingPhoto();
      return { text };
    }
    const photo = mentra.pendingPhoto;
    return {
      text: buildMessageWithPendingImages(text, [{
        id: photo.id,
        name: photo.name,
        previewUri: photo.previewUri,
        dataUrl: photo.dataUrl,
      }]),
      photoId: photo.id,
    };
  }, [mentra.clearPendingPhoto, mentra.pendingPhoto]);

  const sendFinalizedVoicePrompt = useCallback((
    text: string,
    source: 'native' | 'web' | 'mentra',
    options?: { source?: 'handsfree' },
  ) => {
    const submission = composeMentraVoicePrompt(text, source);
    return sendRef.current(submission.text, {
      ...options,
      onSubmitted: submission.photoId
        ? () => mentra.consumePendingPhoto(submission.photoId!)
        : undefined,
    });
  }, [composeMentraVoicePrompt, mentra.consumePendingPhoto]);

  const handleVoiceFinalized = useCallback(({
    text,
    mode,
    source,
    finalSegmentText,
  }: {
    text: string;
    mode: 'edit' | 'send' | 'handsfree';
    source: 'native' | 'web' | 'mentra';
    finalSegmentText?: string;
  }) => {
    const finalText = text.trim();
    if (!finalText) return;
    voiceLog('transcript-finalized', 'Chat received finalized voice transcript.', {
      mode,
      source,
      text: finalText,
      textLength: finalText.length,
    });
    if (mode === 'handsfree') {
      console.info(
        `[DotAgentsHandsFreeJS] finalized source=${source} phase=${handsFreePhaseRef.current} textLength=${finalText.length}`,
      );
      const isVoiceCommandTranscript =
        isHandsFreeVoiceCommandTranscript(finalText)
        || isHandsFreeVoiceCommandTranscript(finalSegmentText);
    if (isHandsFreeTranscriptSuppressedNow() && !isVoiceCommandTranscript) {
      if (handleHandsFreeTtsBargeInCommand(finalText, source === 'mentra' ? 'native' : source)) {
        return;
      }
        voiceLog('transcript-ignored', 'Handsfree transcript ignored while assistant audio is speaking.', {
          source,
          phase: handsFreePhaseRef.current,
          hasLiveAgentTurn,
          hasGlobalTtsPlayback: !!getGlobalTtsPlayback(),
          hasHeadsetRoute: handsFreeHasHeadsetRoute,
          text: finalText,
          textLength: finalText.length,
        });
        console.info(
          `[DotAgentsHandsFreeJS] ignored source=${source} phase=${handsFreePhaseRef.current} busy=${hasLiveAgentTurn} tts=${!!getGlobalTtsPlayback()} textLength=${finalText.length}`,
        );
        return;
      }
      if (!isHandsFreeFinalizationEligibleNow({ text: finalText })) {
        voiceLog('transcript-ignored', 'Handsfree transcript ignored because the listening turn is no longer active.', {
          source,
          phase: handsFreePhaseRef.current,
          text: finalText,
          textLength: finalText.length,
        });
        console.info(
          `[DotAgentsHandsFreeJS] stale finalized ignored source=${source} phase=${handsFreePhaseRef.current} textLength=${finalText.length}`,
        );
        return;
      }

      const normalizedFinalText = normalizeVoiceText(finalText);
      const lastFinalized = handsFreeLastFinalizedRef.current;
      if (
        lastFinalized
        && lastFinalized.text === normalizedFinalText
        && Date.now() - lastFinalized.timestamp < HANDS_FREE_FINALIZED_DUPLICATE_SUPPRESSION_MS
      ) {
        voiceLog('transcript-ignored', 'Duplicate handsfree transcript ignored before send.', {
          source,
          phase: handsFreePhaseRef.current,
          textLength: finalText.length,
        });
        console.info(
          `[DotAgentsHandsFreeJS] duplicate ignored source=${source} phase=${handsFreePhaseRef.current} textLength=${finalText.length}`,
        );
        return;
      }
      handsFreeLastFinalizedRef.current = {
        text: normalizedFinalText,
        timestamp: Date.now(),
      };
    }

    if (mode === 'edit') {
      setInput((current) => mergeVoiceText(current, finalText));
      setDebugInfo('Voice transcript added to the composer.');
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (mode === 'handsfree') {
      if (handsFreeRef.current) {
        const acceptedWakeControlText = isExactSleepingWakeTranscript(finalText);
        const phaseBeforeFinalTranscript = handsFreePhaseRef.current;
        // Web Speech keeps the whole continuous recognition session in the
        // assembled transcript. A command can arrive as the newest finalized
        // segment after ordinary dictation, so dispatch that segment when it
        // is independently recognized as a command.
        const commandTranscript = finalSegmentText && matchVoiceCommand(finalSegmentText)
          ? finalSegmentText
          : finalText;
        const action = handsFreeController.handleFinalTranscript(commandTranscript);
        const shouldRouteToAgentTarget = action.type === 'send'
          && (pendingAgentVoiceActionRef.current || voiceAgentPickerVisible);
        console.info(
          `[DotAgentsHandsFreeJS] controller action=${action.type}`
          + ` command=${action.type === 'command' ? action.command : 'none'}`
          + ` phaseBefore=${phaseBeforeFinalTranscript}`
          + ` text=${JSON.stringify(finalText)}`
          + ` remainder=${JSON.stringify(action.type === 'command' ? action.remainder : '')}`,
        );
        if (shouldRouteToAgentTarget) {
          // The picker is the source of truth for the pending target UI. Keep
          // the voice handoff alive even if a phase transition cleared the
          // ref while the discovery prompt was speaking.
          if (!pendingAgentVoiceActionRef.current) {
            pendingAgentVoiceActionRef.current = { command: 'focus', awaiting: 'target' };
            voiceLog('handsfree-control', 'Restored switch-agent target handoff from the visible picker.', {
              text: finalText,
            });
          }
          setSttPreviewWithExpiry('');
          handsFreeController.onRequestCompleted();
          void handlePendingAgentVoiceText(action.text);
        } else if (action.type === 'send' && !handsFreeAutoSend) {
          setSttPreviewWithExpiry('');
          handsFreeController.onRequestCompleted();

          const manualDraftResolution = resolveHandsFreeManualDraft(
            pendingHandsFreeDraftRef.current,
            finalText,
            handsFreeSendPhrase,
            { finalSegmentText },
          );
          if (manualDraftResolution.type === 'empty') {
              setDebugInfo(`Nothing to send yet. Dictate a message, then say "${handsFreeSendPhrase}".`);
              voiceLog('transcript-ignored', 'Handsfree send keyword heard without a pending voice draft.', {
                source,
                sendPhrase: handsFreeSendPhrase,
              });
              return;
          }
          if (manualDraftResolution.type === 'clear') {
            setPendingHandsFreeDraftValue('');
            setDebugInfo(
              manualDraftResolution.text
                ? 'Voice draft cleared.'
                : 'Nothing to clear yet.',
            );
            voiceLog('handsfree-control', 'Handsfree voice draft cleared by keyword.', {
              source,
              clearPhrase: DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE,
              previousTextLength: manualDraftResolution.text.length,
            });
            return;
          }
          if (manualDraftResolution.type === 'send') {
            setPendingHandsFreeDraftValue('');
            setDebugInfo('Voice draft sent.');
            voiceLog('handsfree-control', 'Handsfree voice draft submitted by keyword.', {
              source,
              sendPhrase: handsFreeSendPhrase,
              textLength: manualDraftResolution.text.length,
            });
            void sendFinalizedVoicePrompt(manualDraftResolution.text, source, { source: 'handsfree' });
            return;
          }

          const nextDraft = manualDraftResolution.text;
          setPendingHandsFreeDraftValue(nextDraft);
          setDebugInfo(`Voice draft ready. Say "${handsFreeSendPhrase}" to send.`);
          voiceLog('finalization-fired', 'Handsfree transcript added to the manual voice draft.', {
            source,
            sendPhrase: handsFreeSendPhrase,
            textLength: nextDraft.length,
          });
        } else if (action.type === 'send') {
          setSttPreviewWithExpiry('');
          void sendFinalizedVoicePrompt(action.text, source, { source: 'handsfree' });
        } else if (action.type === 'command') {
          setSttPreviewWithExpiry('');
          handleHandsFreeVoiceCommand(action.command, action.label, action.remainder);
        } else if (acceptedWakeControlText) {
          clearAcceptedHandsFreeControlPreview(finalText);
        }
        return;
      }
    }

    void sendFinalizedVoicePrompt(finalText, source);
  }, [
    clearAcceptedHandsFreeControlPreview,
    handleHandsFreeTtsBargeInCommand,
    handleHandsFreeVoiceCommand,
    handlePendingAgentVoiceText,
    handsFreeController.handleFinalTranscript,
    handsFreeController.onRequestCompleted,
    handsFreeAutoSend,
    handsFreeHasHeadsetRoute,
    handsFreeSendPhrase,
    hasLiveAgentTurn,
    isHandsFreeFinalizationEligibleNow,
    isHandsFreeVoiceCommandTranscript,
    isHandsFreeTranscriptSuppressedNow,
    isExactSleepingWakeTranscript,
    setPendingHandsFreeDraftValue,
    sendFinalizedVoicePrompt,
    voiceAgentPickerVisible,
    voiceLog,
  ]);

  const isRecentAndroidHandsFreeDuplicate = useCallback((text: string) => {
    const finalText = normalizeVoiceText(text);
    const lastSent = androidHandsFreeLastSentRef.current;
    return !!lastSent
      && lastSent.text === finalText
      && Date.now() - lastSent.timestamp < ANDROID_HANDS_FREE_DUPLICATE_SUPPRESSION_MS;
  }, []);

  const markAndroidHandsFreeSent = useCallback((text: string) => {
    androidHandsFreeLastSentRef.current = {
      text: normalizeVoiceText(text),
      timestamp: Date.now(),
    };
  }, []);

  const mergeAndroidHandsFreePendingTranscript = useCallback((text: string) => {
    const nextText = normalizeVoiceText(text);
    if (!nextText) {
      return '';
    }
    const pendingText = androidHandsFreePendingPartialRef.current;
    return pendingText ? mergeVoiceText(pendingText, nextText) : nextText;
  }, []);

  const flushAndroidHandsFreePartialTranscript = useCallback((text?: string) => {
    const finalText = normalizeVoiceText(text ?? androidHandsFreePendingPartialRef.current);
    clearAndroidHandsFreePartialTimer();
    androidHandsFreePendingPartialRef.current = '';

    if (!finalText) {
      return false;
    }
    if (isHandsFreeTranscriptSuppressedNow()) {
      if (handleHandsFreeTtsBargeInCommand(finalText, 'native')) {
        return true;
      }
      voiceLog('transcript-ignored', 'Android handsfree transcript flush ignored while the assistant is busy or speaking.', {
        phase: handsFreePhaseRef.current,
        text: finalText,
        textLength: finalText.length,
      });
      return false;
    }
    if (!isHandsFreeFinalizationEligibleNow({ text: finalText })) {
      voiceLog('transcript-ignored', 'Android handsfree transcript flush ignored because the listening turn is no longer active.', {
        phase: handsFreePhaseRef.current,
        text: finalText,
        textLength: finalText.length,
      });
      return false;
    }
    if (isRecentAndroidHandsFreeDuplicate(finalText)) {
      voiceLog('transcript-ignored', 'Android handsfree transcript already sent recently.', {
        text: finalText,
        textLength: finalText.length,
      });
      return false;
    }

    markAndroidHandsFreeSent(finalText);
    voiceLog('finalization-fired', 'Android handsfree transcript debounce elapsed.', {
      source: 'native',
      text: finalText,
      textLength: finalText.length,
    });
    handleVoiceFinalized({
      text: finalText,
      mode: 'handsfree',
      source: 'native',
    });
    return true;
  }, [
    clearAndroidHandsFreePartialTimer,
    handleHandsFreeTtsBargeInCommand,
    handleVoiceFinalized,
    isHandsFreeFinalizationEligibleNow,
    isHandsFreeTranscriptSuppressedNow,
    isRecentAndroidHandsFreeDuplicate,
    markAndroidHandsFreeSent,
    voiceLog,
  ]);

  const scheduleAndroidHandsFreePartialTranscript = useCallback((
    text: string,
    delayMs = handsFreeMessageDebounceMs,
    options?: { resetExisting?: boolean },
  ) => {
    const finalText = normalizeVoiceText(text);
    if (!finalText || isRecentAndroidHandsFreeDuplicate(finalText)) {
      return false;
    }
    if (isHandsFreeTranscriptSuppressedNow()) {
      clearAndroidHandsFreePartialTimer();
      androidHandsFreePendingPartialRef.current = '';
      if (handleHandsFreeTtsBargeInCommand(finalText, 'native')) {
        return true;
      }
      voiceLog('transcript-ignored', 'Android handsfree transcript schedule ignored while the assistant is busy or speaking.', {
        phase: handsFreePhaseRef.current,
        text: finalText,
        textLength: finalText.length,
      });
      return false;
    }
    if (!isHandsFreeFinalizationEligibleNow({ text: finalText })) {
      clearAndroidHandsFreePartialTimer();
      androidHandsFreePendingPartialRef.current = '';
      voiceLog('transcript-ignored', 'Android handsfree transcript schedule ignored because the listening turn is no longer active.', {
        phase: handsFreePhaseRef.current,
        text: finalText,
        textLength: finalText.length,
      });
      return false;
    }

    if (!options?.resetExisting && androidHandsFreePendingPartialRef.current === finalText) {
      return true;
    }

    androidHandsFreePendingPartialRef.current = finalText;
    clearAndroidHandsFreePartialTimer();
    const debounceMs = isProcessingStopTranscript(finalText) ? 0 : Math.max(0, delayMs);
    setAndroidHandsFreeDebounceEndsAt(Date.now() + debounceMs);
    voiceLog('finalization-scheduled', 'Android handsfree native transcript debounce scheduled.', {
      source: 'native',
      debounceMs,
      text: finalText,
      textLength: finalText.length,
    });
    return true;
  }, [
    clearAndroidHandsFreePartialTimer,
    handsFreeMessageDebounceMs,
    handleHandsFreeTtsBargeInCommand,
    isHandsFreeFinalizationEligibleNow,
    isProcessingStopTranscript,
    isHandsFreeTranscriptSuppressedNow,
    isRecentAndroidHandsFreeDuplicate,
    voiceLog,
  ]);

  const handleAndroidHandsFreeFinalResult = useCallback((text: string) => {
    const finalText = normalizeVoiceText(text);
    if (!finalText) {
      return;
    }
    scheduleAndroidHandsFreePartialTranscript(finalText, handsFreeMessageDebounceMs, { resetExisting: true });
  }, [
    handsFreeMessageDebounceMs,
    scheduleAndroidHandsFreePartialTranscript,
  ]);

  const handleRecognizerError = useCallback((message: string) => {
    if (handsFreeRef.current && isExpectedHandsFreeRecognizerStopError(message)) {
      handsFreeController.onRecognizerError(message);
      voiceLog('recognizer-error', 'Suppressed expected handsfree recognizer handoff error.', {
        message,
        phase: handsFreePhaseRef.current,
        suppressedTranscript: isHandsFreeTranscriptSuppressedNow(),
        hasGlobalTtsPlayback: !!getGlobalTtsPlayback(),
      });
      return;
    }
    handsFreeController.onRecognizerError(message);
    if (handsFreeRef.current && isBenignHandsFreeRecognizerError(message)) {
      setDebugInfo('Handsfree awake. Listening for your request.');
      return;
    }
    setDebugInfo(`Voice error: ${message}`);
  }, [handsFreeController.onRecognizerError, isHandsFreeTranscriptSuppressedNow, voiceLog]);

  const pushToTalkDesktopSttActive = !handsFree && desktopSttSelected;
  const foregroundSpeechRecognizerEnabled =
    isFocused
    && !mentraVoiceActive
    && (isAppActive || pushToTalkDesktopSttActive)
    && (!handsFree || (foregroundHandsFreeRuntimeActive && !androidServiceHandlesHandsFreeMic));

  const {
    listening,
    liveTranscript,
    sttPreview,
    handsFreeDebounceEndsAt,
    micButtonRef,
    startRecording,
    setSttPreviewWithExpiry,
    stopRecognitionOnly,
    handlePushToTalkPressIn,
    handlePushToTalkPressOut,
    invalidateHandsFreeCapture,
  } = useSpeechRecognizer({
    enabled: foregroundSpeechRecognizerEnabled,
    handsFree,
    handsFreeDebounceMs: handsFreeMessageDebounceMs,
    desktopStt: {
      enabled: desktopSttSelected,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    },
    willCancel,
    audioInputDeviceId: config.audioInputDeviceId,
    onVoiceFinalized: handleVoiceFinalized,
    shouldSuppressHandsFreeTranscript: isHandsFreeTranscriptSuppressedNow,
    shouldFinalizeHandsFreeTranscript: isHandsFreeFinalizationEligibleNow,
    shouldImmediatelyFinalizeHandsFreeTranscript,
    onSuppressedHandsFreeTranscript: ({ text, source }) => handleHandsFreeTtsBargeInCommand(text, source),
    onRecognizerError: handleRecognizerError,
    onPermissionDenied: () => {
      setDebugInfo('Speech recognition permission denied.');
    },
    log: voiceLog,
  });

  const mentraLastTouchHandledRef = useRef(0);
  const mentraLastSpeakingHandledRef = useRef(0);
  const mentraVadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mentraFinalizingRef = useRef(false);
  const mentraSleepAfterTurnRef = useRef(false);
  const mentraControlCueSequenceRef = useRef(0);
  const mentraCaptureStateRef = useRef(mentra.captureState);
  mentraCaptureStateRef.current = mentra.captureState;

  const clearMentraVadTimer = useCallback(() => {
    if (!mentraVadTimerRef.current) return;
    clearTimeout(mentraVadTimerRef.current);
    mentraVadTimerRef.current = null;
  }, []);

  const playMentraControlCue = useCallback(async (cue: HandsFreeAudioCue): Promise<boolean> => {
    if (!mentraVoiceActive || !mentra.audioConnected) return false;
    const sequence = mentraControlCueSequenceRef.current + 1;
    mentraControlCueSequenceRef.current = sequence;
    await mentra.setOwnAppAudioPlaying(true).catch(() => undefined);
    playHandsFreeAudioCue(cue);
    voiceLog('runtime-state', 'Mentra control audio cue played.', { cue });
    const cueHoldMs = Math.max(500, getHandsFreeAudioCueDurationMs(cue) + 100);
    await new Promise<void>((resolve) => setTimeout(resolve, cueHoldMs));
    if (mentraControlCueSequenceRef.current === sequence && !getGlobalTtsPlayback()) {
      await mentra.setOwnAppAudioPlaying(false).catch(() => undefined);
    }
    return true;
  }, [mentra.audioConnected, mentra.setOwnAppAudioPlaying, mentraVoiceActive, voiceLog]);

  const finalizeMentraCapture = useCallback(async (mode: 'send' | 'handsfree') => {
    if (mentraFinalizingRef.current || mentraCaptureStateRef.current !== 'capturing') return;
    mentraFinalizingRef.current = true;
    clearMentraVadTimer();
    setDebugInfo('Transcribing Mentra Live audio…');
    try {
      const text = await mentra.finishCapture({
        onCaptureStopped: mode === 'send'
          ? () => { void playMentraControlCue('processing'); }
          : undefined,
      });
      if (!text) {
        setDebugInfo('No speech was detected from Mentra Live.');
        if (mode === 'send') void playMentraControlCue('error');
        else playHandsFreeCue('error');
        return;
      }
      handleVoiceFinalized({ text, mode, source: 'mentra' });
    } catch (nextError: any) {
      setDebugInfo(nextError?.message || 'Mentra Live transcription failed.');
      if (mode === 'send') void playMentraControlCue('error');
      else playHandsFreeCue('error');
    } finally {
      mentraFinalizingRef.current = false;
      if (mode === 'handsfree') {
        setTimeout(() => {
          if (
            mentraVoiceActive
            && handsFreePhaseRef.current === 'listening'
            && mentraCaptureStateRef.current === 'idle'
            && !getGlobalTtsPlayback()
          ) {
            void mentra.beginCapture().catch((nextError: any) => {
              setDebugInfo(nextError?.message || 'Could not restart the Mentra Live microphone.');
            });
          }
        }, 0);
      }
    }
  }, [clearMentraVadTimer, handleVoiceFinalized, mentra.beginCapture, mentra.finishCapture, mentraVoiceActive, playHandsFreeCue, playMentraControlCue]);

  useEffect(() => {
    const event = mentra.lastTouch;
    if (!mentraVoiceActive || !event || event.sequence === mentraLastTouchHandledRef.current) return;
    mentraLastTouchHandledRef.current = event.sequence;
    const action = resolveMentraTouchAction({
      gestureName: event.gestureName,
      handsFree,
      handsFreePhase: handsFreePhaseRef.current,
      capturing: mentraCaptureStateRef.current === 'capturing',
    });

    if (action === 'wake') {
      mentraSleepAfterTurnRef.current = false;
      handsFreeController.wakeByUser();
      setDebugInfo('Mentra Live awake. Listening.');
      playHandsFreeCue('listening');
    } else if (action === 'sleep') {
      mentraSleepAfterTurnRef.current = false;
      clearMentraVadTimer();
      void mentra.cancelCapture();
      handsFreeController.sleepByUser();
      setDebugInfo('Mentra Live sleeping. Tap the touch bar to wake.');
      playHandsFreeCue('sleeping');
    } else if (action === 'sleep-after-turn') {
      mentraSleepAfterTurnRef.current = true;
      setDebugInfo('Mentra Live will sleep after this reply.');
    } else if (action === 'stop') {
      mentraSleepAfterTurnRef.current = false;
      clearMentraVadTimer();
      stopHandsFreeActivityFromVoice('hardware');
      if (handsFree) handsFreeController.wakeByUser();
      setDebugInfo('Stopped. Mentra Live is ready for another request.');
      void mentra.cancelCapture().then(() => {
        if (!handsFree) return playMentraControlCue('stopped');
      });
    } else if (action === 'start-capture') {
      mentraLastSpeakingHandledRef.current = mentra.lastSpeaking?.sequence ?? 0;
      void playMentraControlCue('listening')
        .then(() => mentra.beginCapture())
        .then(() => {
          setDebugInfo('Mentra Live is recording. Tap again to send.');
        })
        .catch((nextError: any) => setDebugInfo(nextError?.message || 'Could not start Mentra Live microphone.'));
    } else if (action === 'finish-capture') {
      void finalizeMentraCapture('send');
    }
  }, [
    clearMentraVadTimer,
    finalizeMentraCapture,
    handsFree,
    handsFreeController.sleepByUser,
    handsFreeController.wakeByUser,
    mentra.beginCapture,
    mentra.cancelCapture,
    mentra.lastSpeaking?.sequence,
    mentra.lastTouch,
    mentraVoiceActive,
    playHandsFreeCue,
    playMentraControlCue,
    stopHandsFreeActivityFromVoice,
  ]);

  useEffect(() => {
    if (!mentraVoiceActive || !handsFree) return;
    const phase = handsFreeController.state.phase;
    if (
      mentraSleepAfterTurnRef.current
      && phase === 'listening'
      && !hasLiveAgentTurn
      && !getGlobalTtsPlayback()
    ) {
      mentraSleepAfterTurnRef.current = false;
      void mentra.cancelCapture();
      handsFreeController.sleepByUser();
      playHandsFreeCue('sleeping');
      return;
    }

    if (
      phase === 'listening'
      && mentra.captureState === 'idle'
      && !mentraFinalizingRef.current
      && !getGlobalTtsPlayback()
    ) {
      mentraLastSpeakingHandledRef.current = mentra.lastSpeaking?.sequence ?? 0;
      void mentra.beginCapture().catch((nextError: any) => {
        setDebugInfo(nextError?.message || 'Could not start Mentra Live microphone.');
      });
      return;
    }

    if (phase !== 'listening' && mentra.captureState === 'capturing') {
      clearMentraVadTimer();
      void mentra.cancelCapture();
    }
  }, [
    clearMentraVadTimer,
    handsFree,
    handsFreeController.sleepByUser,
    handsFreeController.state.phase,
    hasLiveAgentTurn,
    mentra.beginCapture,
    mentra.cancelCapture,
    mentra.captureState,
    mentra.lastSpeaking?.sequence,
    mentraVoiceActive,
    playHandsFreeCue,
  ]);

  useEffect(() => {
    const event = mentra.lastSpeaking;
    if (
      !mentraVoiceActive
      || !handsFree
      || !event
      || event.sequence === mentraLastSpeakingHandledRef.current
    ) return;
    mentraLastSpeakingHandledRef.current = event.sequence;
    if (event.speaking) {
      clearMentraVadTimer();
      return;
    }
    if (mentraCaptureStateRef.current !== 'capturing' || handsFreePhaseRef.current !== 'listening') return;
    clearMentraVadTimer();
    mentraVadTimerRef.current = setTimeout(() => {
      mentraVadTimerRef.current = null;
      void finalizeMentraCapture('handsfree');
    }, Math.max(0, handsFreeMessageDebounceMs));
  }, [
    clearMentraVadTimer,
    finalizeMentraCapture,
    handsFree,
    handsFreeMessageDebounceMs,
    mentra.lastSpeaking,
    mentraVoiceActive,
  ]);

  useEffect(() => () => clearMentraVadTimer(), [clearMentraVadTimer]);

  useEffect(() => {
    if (!mentraVoiceActive) return;
    const playing = globalTtsPlayback?.status === 'loading' || globalTtsPlayback?.status === 'speaking';
    if (playing && mentraCaptureStateRef.current === 'capturing') {
      clearMentraVadTimer();
      void mentra.cancelCapture();
    }
    void mentra.setOwnAppAudioPlaying(playing).catch(() => undefined);
    return () => {
      if (playing) void mentra.setOwnAppAudioPlaying(false).catch(() => undefined);
    };
  }, [
    clearMentraVadTimer,
    globalTtsPlayback?.status,
    mentra.cancelCapture,
    mentra.setOwnAppAudioPlaying,
    mentraVoiceActive,
  ]);

  const androidHandsFreeServiceListeningEnabled =
    androidServiceHandlesHandsFreeMic && shouldKeepHandsFreeMicArmed;
  const androidHandsFreeServiceListeningEnabledRef = useRef(androidHandsFreeServiceListeningEnabled);
  androidHandsFreeServiceListeningEnabledRef.current = androidHandsFreeServiceListeningEnabled;

  useEffect(() => {
    if (!shouldSuppressHandsFreeTranscript) return;
    clearAndroidHandsFreePartialTimer();
    androidHandsFreePendingPartialRef.current = '';
    setSttPreviewWithExpiry('');
  }, [clearAndroidHandsFreePartialTimer, setSttPreviewWithExpiry, shouldSuppressHandsFreeTranscript]);

  useEffect(() => {
    if (isHandsFreeFinalizationEligibleNow()) return;
    clearAndroidHandsFreePartialTimer();
    androidHandsFreePendingPartialRef.current = '';
    setSttPreviewWithExpiry('');
    invalidateHandsFreeCapture(`phase-${handsFreeController.state.phase}`);
  }, [
    clearAndroidHandsFreePartialTimer,
    handsFreeController.state.phase,
    invalidateHandsFreeCapture,
    isHandsFreeFinalizationEligibleNow,
    setSttPreviewWithExpiry,
  ]);

  useEffect(() => {
    if (!handsFree) {
      lastHandsFreeAudioCuePhaseRef.current = null;
      lastHandsFreeSessionReadyCueAtRef.current = 0;
      return;
    }

    const phase = handsFreeController.state.phase;
    const previousPhase = lastHandsFreeAudioCuePhaseRef.current;
    lastHandsFreeAudioCuePhaseRef.current = phase;
    if (previousPhase === null || previousPhase === phase) {
      return;
    }
    if (phase === 'speaking') {
      return;
    }
    if (
      phase === 'processing'
      && Date.now() - lastHandsFreePreviewSubmittedCueAtRef.current < HANDS_FREE_PREVIEW_SUBMITTED_PROCESSING_CUE_SUPPRESSION_MS
    ) {
      return;
    }

    playHandsFreeCue(HANDS_FREE_PHASE_AUDIO_CUES[phase]);
  }, [handsFree, handsFreeController.state.phase, playHandsFreeCue]);

  useEffect(() => {
    if (!handsFree || !handsFreeRuntimeActive || handsFreeController.state.phase !== 'listening') {
      return;
    }

    playHandsFreeSessionReadyCue(androidBackgroundHandsFree ? 'background-listening' : 'foreground-listening');
  }, [
    androidBackgroundHandsFree,
    handsFree,
    handsFreeController.state.phase,
    handsFreeRuntimeActive,
    playHandsFreeSessionReadyCue,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Android 14+ rejects a microphone foreground-service start when the app
    // is already backgrounded (including the lock screen). Start only while
    // the chat is visible; an already-running service is intentionally left
    // alone when the app moves to the background so it can survive locking.
    if (!shouldRunAndroidHandsFreeService || !isAppActive || !isFocused) {
      return;
    }

    let cancelled = false;
    void isAndroidHandsFreeServiceRunning()
      .then((running) => {
        if (running || cancelled) return;
        return startAndroidHandsFreeService({
          language: 'en-US',
          listeningEnabled: androidHandsFreeServiceListeningEnabledRef.current,
          debounceMs: handsFreeMessageDebounceMs,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
        });
      })
      .then(() => {
        if (!cancelled) {
          setDebugInfo('Locked-screen handsfree is ready.');
          playHandsFreeSessionReadyCue('service-start-command');
        }
      })
      .catch((error) => {
        const message = (error as any)?.message || String(error);
        voiceLog('recognizer-error', 'Android handsfree service failed to start.', { message });
        setDebugInfo(`Voice error: ${message}`);
      });

    return () => {
      cancelled = true;
    };
  }, [
    config.apiKey,
    config.baseUrl,
    handsFreeMessageDebounceMs,
    isAppActive,
    isFocused,
    playHandsFreeSessionReadyCue,
    shouldRunAndroidHandsFreeService,
    voiceLog,
  ]);

  useEffect(() => {
    if (shouldRunAndroidHandsFreeService) {
      return;
    }

    void stopAndroidHandsFreeService().catch((error) => {
      voiceLog('recognizer-error', 'Android handsfree service failed to stop.', {
        message: (error as any)?.message || String(error),
      });
    });
  }, [shouldRunAndroidHandsFreeService, voiceLog]);

  useEffect(() => {
    if (!shouldRunAndroidHandsFreeService) {
      return;
    }

    void setAndroidHandsFreeListeningEnabled(androidHandsFreeServiceListeningEnabled).catch((error) => {
      voiceLog('recognizer-error', 'Android handsfree service failed to update capture state.', {
        message: (error as any)?.message || String(error),
      });
    });
  }, [androidHandsFreeServiceListeningEnabled, shouldRunAndroidHandsFreeService, voiceLog]);

  useEffect(() => {
    if (!shouldRunAndroidHandsFreeService) {
      return;
    }

    const ownerId = ++androidHandsFreeEventOwnerCounter;
    activeAndroidHandsFreeEventOwnerId = ownerId;
    const subscription = subscribeAndroidHandsFreeVoiceEvents((event) => {
      if (activeAndroidHandsFreeEventOwnerId !== ownerId) {
        return;
      }

      voiceLog('runtime-state', 'Android handsfree service event.', {
        type: event.type,
        text: 'text' in event ? event.text : undefined,
        message: 'message' in event ? event.message : undefined,
        errorCode: 'errorCode' in event ? event.errorCode : undefined,
        recoverable: 'recoverable' in event ? event.recoverable : undefined,
      });

      if (event.type === 'tts-loading') {
        return;
      }

      if (event.type === 'tts-native-fallback') {
        voiceLog('tts-started', 'Android service TTS falling back to native Android voice.', {
          utteranceId: event.utteranceId,
          language: event.language,
          voice: event.voice,
        });
        return;
      }

      if (event.type === 'cue-played' || event.type === 'cue-error') {
        return;
      }

      if (event.type === 'capture-state') {
        if (event.listeningEnabled && handsFreePhaseRef.current === 'listening') {
          playHandsFreeCue('listening');
        }
        return;
      }

      if (event.type === 'speech-started') {
        if (handleHandsFreeTtsBargeInSpeechStarted('native')) {
          return;
        }
      }

      if (event.type === 'tts-started' && event.utteranceId) {
        androidHandsFreeTtsHandlersRef.current.get(event.utteranceId)?.onStarted();
        return;
      }

      if (
        (event.type === 'tts-done' || event.type === 'tts-error' || event.type === 'tts-stopped')
        && event.utteranceId
      ) {
        const handler = androidHandsFreeTtsHandlersRef.current.get(event.utteranceId);
        if (handler) {
          handler.onSettled(event.type, 'message' in event ? event.message : undefined);
        }
        return;
      }

      if (event.type === 'partial-result' && event.text) {
        const partialText = normalizeVoiceText(event.text);
        if (isHandsFreeTranscriptSuppressedNow()) {
          clearAndroidHandsFreePartialTimer();
          androidHandsFreePendingPartialRef.current = '';
          if (handleHandsFreeTtsBargeInCommand(partialText, 'native')) {
            return;
          }
          voiceLog('transcript-ignored', 'Android handsfree partial ignored while the assistant is busy or speaking.', {
            phase: handsFreePhaseRef.current,
            text: partialText,
            textLength: partialText.length,
          });
          return;
        }
        const mergedText = mergeAndroidHandsFreePendingTranscript(partialText);
        setSttPreviewWithExpiry(mergedText);
        scheduleAndroidHandsFreePartialTranscript(mergedText);
        return;
      }

      if (event.type === 'result' && event.text) {
        const finalText = normalizeVoiceText(event.text);
        if (isHandsFreeTranscriptSuppressedNow()) {
          clearAndroidHandsFreePartialTimer();
          androidHandsFreePendingPartialRef.current = '';
          if (handleHandsFreeTtsBargeInCommand(finalText, 'native')) {
            return;
          }
          voiceLog('transcript-ignored', 'Android handsfree final ignored while the assistant is busy or speaking.', {
            phase: handsFreePhaseRef.current,
            text: finalText,
            textLength: finalText.length,
          });
          return;
        }
        const mergedText = mergeAndroidHandsFreePendingTranscript(finalText);
        setSttPreviewWithExpiry(mergedText);
        handleAndroidHandsFreeFinalResult(mergedText);
        return;
      }

      if (event.type === 'debounced-result' && event.text) {
        const finalText = normalizeVoiceText(event.text);
        if (!finalText) {
          return;
        }
        setSttPreviewWithExpiry(finalText);
        flushAndroidHandsFreePartialTranscript(finalText);
        return;
      }

      if (event.type === 'speech-ended' && androidHandsFreePendingPartialRef.current) {
        if (isHandsFreeTranscriptSuppressedNow()) {
          const pendingText = androidHandsFreePendingPartialRef.current;
          clearAndroidHandsFreePartialTimer();
          androidHandsFreePendingPartialRef.current = '';
          if (handleHandsFreeTtsBargeInCommand(pendingText, 'native')) {
            return;
          }
          voiceLog('transcript-ignored', 'Android handsfree speech-ended ignored while the assistant is busy or speaking.', {
            phase: handsFreePhaseRef.current,
          });
          return;
        }
        clearAndroidHandsFreePartialTimer();
        scheduleAndroidHandsFreePartialTranscript(
          androidHandsFreePendingPartialRef.current,
          handsFreeMessageDebounceMs,
          { resetExisting: true },
        );
        return;
      }

      if (event.type === 'error') {
        handleRecognizerError(event.message || 'Unknown native speech error');
        return;
      }

      if (event.type === 'service-started') {
        if (androidHandsFreeServiceListeningEnabledRef.current && !event.listeningEnabled) {
          void setAndroidHandsFreeListeningEnabled(true).catch((error) => {
            voiceLog('recognizer-error', 'Android handsfree service failed to arm after start.', {
              message: (error as any)?.message || String(error),
            });
          });
        }
        setDebugInfo('Locked-screen handsfree is ready.');
        playHandsFreeSessionReadyCue('service-started-event');
        return;
      }

      if (event.type === 'service-stopped') {
        setDebugInfo('Locked-screen handsfree stopped.');
      }
    });

    return () => {
      if (activeAndroidHandsFreeEventOwnerId === ownerId) {
        activeAndroidHandsFreeEventOwnerId = 0;
      }
      subscription.remove();
      clearAndroidHandsFreePartialTimer();
      androidHandsFreePendingPartialRef.current = '';
    };
  }, [
    androidBackgroundHandsFree,
    clearAndroidHandsFreePartialTimer,
    flushAndroidHandsFreePartialTranscript,
    handsFreeMessageDebounceMs,
    handleAndroidHandsFreeFinalResult,
    handleHandsFreeTtsBargeInCommand,
    handleHandsFreeTtsBargeInSpeechStarted,
    handleRecognizerError,
    isHandsFreeTranscriptSuppressedNow,
    mergeAndroidHandsFreePendingTranscript,
    playHandsFreeCue,
    playHandsFreeSessionReadyCue,
    scheduleAndroidHandsFreePartialTranscript,
    setSttPreviewWithExpiry,
    shouldRunAndroidHandsFreeService,
    voiceLog,
  ]);

  useEffect(() => {
    if (!handsFree) {
      return;
    }
    if (androidServiceHandlesHandsFreeMic) {
      if (listening) {
        void stopRecognitionOnly({ preservePendingHandsFreeFinal: true });
      }
      return;
    }
    if (!handsFreeRuntimeActive && listening) {
      void stopRecognitionOnly({ preservePendingHandsFreeFinal: true });
    }
  }, [androidServiceHandlesHandsFreeMic, handsFree, handsFreeRuntimeActive, listening, stopRecognitionOnly]);

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

    if (androidServiceHandlesHandsFreeMic) {
      return;
    }

    if (shouldKeepHandsFreeMicArmed && !listening) {
      const now = Date.now();
      if (now - lastForegroundHandsFreeAutoStartAtRef.current < 1500) {
        return;
      }
      lastForegroundHandsFreeAutoStartAtRef.current = now;
      void startRecording();
      return;
    }

    if (!shouldKeepHandsFreeMicArmed && listening) {
	      void stopRecognitionOnly({ preservePendingHandsFreeFinal: true });
    }
  }, [
    androidServiceHandlesHandsFreeMic,
    handsFree,
    handsFreeController.resetError,
    shouldKeepHandsFreeMicArmed,
    handsFreeController.state.phase,
    listening,
    startRecording,
    stopRecognitionOnly,
  ]);

	  const speakAssistantResponse = useCallback((content: string, reason: string, onSettled?: () => void) => {
		// Honor a mute that may have happened after this callback was scheduled but
		// before it ran (stale closures inside in-flight send() progress handlers).
		if (!ttsEnabledRef.current) {
				console.info('[DotAgentsTTS] skipped because TTS is disabled', { reason, contentLength: content.length });
			onSettled?.();
			return false;
		}
		if (mentraVoiceActive && !mentra.audioConnected) {
			setDebugInfo('Mentra Live audio is not connected. Complete the Android Bluetooth audio pairing to hear private replies.');
			playHandsFreeCue('error');
			onSettled?.();
			return false;
		}
		const processedText = preprocessTextForTTS(content);
		if (!processedText) {
				console.info('[DotAgentsTTS] skipped because processed text is empty', { reason, contentLength: content.length });
				onSettled?.();
			return false;
		}
		lastHandsFreeSpokenTextRef.current = processedText;

      const ttsTextKey = normalizeAutoTtsTextKey(processedText);
      const now = Date.now();
      const lastSpokenAt = recentAutoSpeechByTextRef.current.get(ttsTextKey) ?? 0;
      if (reason !== 'voice repeat' && now - lastSpokenAt < AUTO_TTS_DUPLICATE_SUPPRESSION_MS) {
        console.info('[DotAgentsTTS] skipped duplicate auto speech', {
	          reason,
	          textLength: processedText.length,
	          sinceLastMs: now - lastSpokenAt,
	        });
        onSettled?.();
        return false;
      }
      recentAutoSpeechByTextRef.current.set(ttsTextKey, now);
      for (const [key, spokenAt] of recentAutoSpeechByTextRef.current) {
        if (now - spokenAt > AUTO_TTS_DUPLICATE_SUPPRESSION_MS) {
          recentAutoSpeechByTextRef.current.delete(key);
        }
      }

    if (handsFree) {
      playHandsFreeCue('agent-response');
    }

    const currentAndroidHandsFreeTtsRuntime = getCurrentAndroidHandsFreeTtsRuntime();
    const configuredAndroidServiceRemoteTts = shouldUseAndroidHandsFreeServiceRemoteTtsRef.current;
    const forceNativeAndroidServiceTts =
      configuredAndroidServiceRemoteTts
      && currentAndroidHandsFreeTtsRuntime.backgroundHandsFree;
    const useAndroidServiceRemoteTts =
      configuredAndroidServiceRemoteTts
      && !forceNativeAndroidServiceTts;
    const useAndroidServiceNativeTts =
      shouldUseAndroidHandsFreeServiceNativeTtsRef.current
      || forceNativeAndroidServiceTts;
    const useAndroidServiceTts = useAndroidServiceRemoteTts || useAndroidServiceNativeTts;
    const hasRemoteEdgeTts = effectiveTtsProvider === 'edge' && !!config.baseUrl && !!config.apiKey;
    console.info('[DotAgentsTTS] selecting playback path', {
      reason,
      platform: Platform.OS,
      handsFree,
      phase: handsFreePhaseRef.current,
      textLength: processedText.length,
      effectiveTtsProvider,
      configuredAndroidServiceRemoteTts,
      forceNativeAndroidServiceTts,
      useAndroidServiceNativeTts,
      useAndroidServiceRemoteTts,
      hasRemoteBaseUrl: !!config.baseUrl,
      hasRemoteApiKey: !!config.apiKey,
      edgeVoice: effectiveEdgeTtsVoice,
      edgeRate: effectiveEdgeTtsRate,
      nativeRate: config.ttsRate ?? 1.0,
      nativeVoiceConfigured: !!config.ttsVoiceId,
      appState: currentAndroidHandsFreeTtsRuntime.appState,
      isFocused: currentAndroidHandsFreeTtsRuntime.isFocused,
      androidBackgroundHandsFree: currentAndroidHandsFreeTtsRuntime.backgroundHandsFree,
      stableForeground: currentAndroidHandsFreeTtsRuntime.stableForeground,
    });
	    if (Platform.OS === 'android' && androidHandsFreeServiceAvailable) {
	      void getAndroidHandsFreeAudioRoute()
	        .then((route) => {
	          console.info('[DotAgentsTTS] android audio route before playback', { reason, route });
	        })
	        .catch((error) => {
	          console.warn('[DotAgentsTTS] android audio route lookup failed before playback', {
	            reason,
	            message: (error as any)?.message || String(error),
	          });
	        });
	    }
	    const playbackId = beginGlobalTtsPlayback({
	      source: 'auto',
	      status: hasRemoteEdgeTts || useAndroidServiceTts
	        ? 'loading'
	        : 'speaking',
      sessionId: sessionStore.currentSessionId,
      sessionTitle: sessionStore.getCurrentSession()?.title ?? 'Chat',
      text: processedText,
    });

		let settled = false;
    let clearSpeechWatchdog: (() => void) | null = null;
    let handsFreeSpeechStarted = false;
    const markAssistantSpeechStarted = (message?: string, extra?: Record<string, unknown>) => {
      assistantSpeechStartedAtRef.current = Date.now();
      markGlobalTtsPlaybackSpeaking(playbackId);
      if (!handsFree || handsFreeSpeechStarted) return;
      handsFreeSpeechStarted = true;
      invalidateHandsFreeCapture('tts-started');
      handsFreeController.onSpeechStarted();
      voiceLog('tts-started', message ?? `Assistant speech started (${reason}).`, extra);
    };
		const settle = () => {
			if (settled) return;
      settled = true;
      clearSpeechWatchdog?.();
      clearSpeechWatchdog = null;
      assistantSpeechStartedAtRef.current = 0;
      completeGlobalTtsPlayback(playbackId);
			if (handsFree && handsFreeSpeechStarted) {
				handsFreeController.onSpeechFinished();
				voiceLog('tts-stopped', `Assistant speech stopped (${reason}).`);
			}
			onSettled?.();
		};

    const startExpoSpeechPlayback = (playbackReason: string): boolean => {
      let nativeSpeechStarted = false;
	      console.info('[DotAgentsTTS] expo speech playback requested', {
	        reason: playbackReason,
	        fallbackFor: playbackReason === reason ? undefined : reason,
	        textLength: processedText.length,
	        rate: config.ttsRate ?? 1.0,
	        pitch: config.ttsPitch ?? 1.0,
	        voiceConfigured: !!config.ttsVoiceId,
	      });
		  const speechOptions: Speech.SpeechOptions = {
			  language: 'en-US',
			  rate: config.ttsRate ?? 1.0,
			  pitch: config.ttsPitch ?? 1.0,
        onStart: () => {
          nativeSpeechStarted = true;
	        console.info('[DotAgentsTTS] expo speech playback started', { reason: playbackReason });
          markAssistantSpeechStarted();
        },
				onDone: () => {
					console.info('[DotAgentsTTS] expo speech playback done', { reason: playbackReason });
					settle();
				},
				onError: () => {
					console.warn('[DotAgentsTTS] expo speech playback error callback', { reason: playbackReason });
					settle();
				},
				onStopped: () => {
					console.info('[DotAgentsTTS] expo speech playback stopped callback', { reason: playbackReason });
					settle();
				},
		  };
		  if (config.ttsVoiceId) {
			  speechOptions.voice = config.ttsVoiceId;
		  }
		  try {
		    void (async () => {
		      try {
		        await ensureNativeTtsAudioMode();
		        if (settled) return;
		        Speech.speak(processedText, speechOptions);
		      } catch {
		        settle();
		      }
		    })();
        clearSpeechWatchdog = startNativeTtsSettlementWatchdog(
          processedText,
          config.ttsRate ?? 1.0,
          () => nativeSpeechStarted,
          settle,
          (watchdogReason) => {
            voiceLog('tts-stopped', `Assistant speech watchdog settled (${playbackReason}, ${watchdogReason}).`);
          },
        );
      } catch {
        settle();
        return false;
      }
		  return true;
    };

    const startAndroidServicePlayback = (
      playbackReason: string,
      playbackKind: 'native' | 'remote',
      startRequest: (
        utteranceId: string,
        startWatchdog: (rate?: number) => void,
        isSettled: () => boolean,
      ) => Promise<string | null>,
      defaultWatchdogRate = config.ttsRate ?? 1.0,
    ): boolean => {
      const utteranceId = createAndroidHandsFreeTtsUtteranceId();
	      console.info('[DotAgentsTTS] android service playback requested', {
	        reason: playbackReason,
	        utteranceId,
        kind: playbackKind,
	        textLength: processedText.length,
	        rate: config.ttsRate ?? 1.0,
	        pitch: config.ttsPitch ?? 1.0,
	        voiceConfigured: !!config.ttsVoiceId,
        edgeVoice: playbackKind === 'remote' ? effectiveEdgeTtsVoice : undefined,
        edgeRate: playbackKind === 'remote' ? effectiveEdgeTtsRate : undefined,
	      });
      let clearNativeTtsTimeout: (() => void) | null = null;
      const startWatchdog = (watchdogRate = defaultWatchdogRate) => {
        if (clearNativeTtsTimeout || settled) return;
        const timeout = setTimeout(() => {
          voiceLog('tts-stopped', `Android service TTS watchdog settled (${playbackReason}).`, {
            utteranceId,
            kind: playbackKind,
          });
          settle();
        }, estimateNativeTtsWatchdogMs(processedText, watchdogRate));
        clearNativeTtsTimeout = () => clearTimeout(timeout);
      };
      const clearNativeTtsHandler = () => {
        androidHandsFreeTtsHandlersRef.current.delete(utteranceId);
        clearNativeTtsTimeout?.();
        clearNativeTtsTimeout = null;
      };
      clearSpeechWatchdog = clearNativeTtsHandler;
      androidHandsFreeTtsHandlersRef.current.set(utteranceId, {
        onStarted: () => {
	          console.info('[DotAgentsTTS] android service playback started', {
            reason: playbackReason,
            utteranceId,
            kind: playbackKind,
          });
          markAssistantSpeechStarted(`Android service TTS started (${playbackReason}).`, {
            utteranceId,
            kind: playbackKind,
          });
        },
        onSettled: (type, message) => {
	          console.info('[DotAgentsTTS] android service playback settled', {
            reason: playbackReason,
            utteranceId,
            kind: playbackKind,
            type,
            message,
          });
          voiceLog('tts-stopped', `Android service TTS settled (${playbackReason}, ${type}).`, {
            utteranceId,
            kind: playbackKind,
            message,
          });
          settle();
        },
      });

      void startRequest(utteranceId, startWatchdog, () => settled).then((startedUtteranceId) => {
        if (!startedUtteranceId && !settled) {
	          console.warn('[DotAgentsTTS] android service playback did not start', {
            reason: playbackReason,
            utteranceId,
            kind: playbackKind,
          });
          voiceLog('tts-stopped', `Android service TTS did not start (${playbackReason}).`, {
            utteranceId,
            kind: playbackKind,
          });
          settle();
        }
      }).catch((error) => {
	        console.warn('[DotAgentsTTS] android service playback promise failed', {
	          reason: playbackReason,
	          utteranceId,
          kind: playbackKind,
	          message: (error as any)?.message || String(error),
	        });
        voiceLog('tts-stopped', `Android service TTS failed (${playbackReason}).`, {
          utteranceId,
          kind: playbackKind,
          message: (error as any)?.message || String(error),
        });
        settle();
      });
      return true;
    };

		if (useAndroidServiceRemoteTts) {
      return startAndroidServicePlayback(
        reason,
        'remote',
        async (utteranceId, startWatchdog, isSettled) => {
          const fallbackToNativeServiceTts = async (message: string) => {
            if (isSettled()) return null;
            console.warn('[DotAgentsTTS] android service remote edge playback fallback requested', {
              reason,
              utteranceId,
              message,
            });
            voiceLog('tts-stopped', `Remote TTS failed; falling back to Android service native TTS (${reason}).`, {
              utteranceId,
              message,
            });
            startWatchdog(config.ttsRate ?? 1.0);
            return speakAndroidHandsFreeTts({
              utteranceId,
              text: processedText,
              language: 'en-US',
              rate: config.ttsRate ?? 1.0,
              pitch: config.ttsPitch ?? 1.0,
              voice: config.ttsVoiceId,
              restoreListeningAfterDone: true,
              allowBargeIn: true,
            });
          };

          try {
            console.info('[DotAgentsTTS] android service remote edge fetch requested', {
              reason,
              utteranceId,
              textLength: processedText.length,
              voice: effectiveEdgeTtsVoice,
              rate: effectiveEdgeTtsRate,
            });
            const { audio, mimeType } = await fetchRemoteTtsAudio(processedText, {
              baseUrl: config.baseUrl,
              apiKey: config.apiKey,
              providerId: 'edge',
              voice: effectiveEdgeTtsVoice,
              rate: effectiveEdgeTtsRate,
            });
            if (isSettled()) return null;
            const file = writeRemoteTtsAudioFile(audio, mimeType, 'handsfree-edge-tts');
            if (isSettled()) {
              try { file.delete(); } catch {}
              return null;
            }
            try {
              const startedUtteranceId = await playAndroidHandsFreeTtsAudio({
                utteranceId,
                filePath: file.uri,
                restoreListeningAfterDone: true,
                allowBargeIn: true,
                deleteFileOnRelease: true,
              });
              if (!startedUtteranceId) {
                try { file.delete(); } catch {}
                return fallbackToNativeServiceTts('remote audio handoff did not start');
              }
              startWatchdog(effectiveEdgeTtsRate);
              return startedUtteranceId;
            } catch (error) {
              try { file.delete(); } catch {}
              throw error;
            }
          } catch (error) {
            return fallbackToNativeServiceTts((error as any)?.message || String(error));
          }
        },
        effectiveEdgeTtsRate,
      );
		}

		if (!useAndroidServiceTts && hasRemoteEdgeTts) {
			// Edge TTS routes through the paired desktop's /v1/tts/speak.
				console.info('[DotAgentsTTS] remote edge playback requested', {
					reason,
					textLength: processedText.length,
					voice: effectiveEdgeTtsVoice,
					rate: effectiveEdgeTtsRate,
				});
			void speakRemoteTts(processedText, {
				baseUrl: config.baseUrl,
				apiKey: config.apiKey,
				providerId: 'edge',
				voice: effectiveEdgeTtsVoice,
				rate: effectiveEdgeTtsRate,
					onStart: () => {
						console.info('[DotAgentsTTS] remote edge playback started', { reason });
						markAssistantSpeechStarted(`Remote TTS started (${reason}).`);
					},
					onDone: () => {
						console.info('[DotAgentsTTS] remote edge playback done', { reason });
						settle();
					},
					onError: () => {
						console.warn('[DotAgentsTTS] remote edge playback error callback', { reason });
            if (settled) return;
            voiceLog('tts-stopped', `Remote TTS failed; falling back to native speech (${reason}).`);
            startExpoSpeechPlayback(`${reason} native fallback`);
					},
					onStopped: () => {
						console.info('[DotAgentsTTS] remote edge playback stopped callback', { reason });
						settle();
					},
			});
			return true;
		}

    if (useAndroidServiceNativeTts) {
      return startAndroidServicePlayback(reason, 'native', (utteranceId, startWatchdog) => {
        startWatchdog(config.ttsRate ?? 1.0);
        return speakAndroidHandsFreeTts({
        utteranceId,
        text: processedText,
        language: 'en-US',
        rate: config.ttsRate ?? 1.0,
        pitch: config.ttsPitch ?? 1.0,
        voice: config.ttsVoiceId,
        restoreListeningAfterDone: true,
	        allowBargeIn: true,
	      });
		    });
    }

			    return startExpoSpeechPlayback(reason);
				  }, [androidBackgroundHandsFree, androidHandsFreeServiceAvailable, config.apiKey, config.baseUrl, config.ttsPitch, config.ttsRate, config.ttsVoiceId, effectiveEdgeTtsRate, effectiveEdgeTtsVoice, effectiveTtsProvider, getCurrentAndroidHandsFreeTtsRuntime, handsFree, handsFreeController, invalidateHandsFreeCapture, mentra.audioConnected, mentraVoiceActive, playHandsFreeCue, sessionStore, stableHandsFreeForeground, voiceLog]);

  speakHandsFreeTextRef.current = speakAssistantResponse;

	  const syncResponseHistoryRefs = useCallback((events: AgentUserResponseEvent[]) => {
	    respondToUserHistoryRef.current = events;
	    nextResponseEventOrdinalRef.current = getNextResponseEventOrdinal(events);
	  }, []);

	  const replaceResponseHistory = useCallback((events: AgentUserResponseEvent[]) => {
	    const sortedEvents = sortResponseEvents(events);
	    syncResponseHistoryRefs(sortedEvents);
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
	  }, [syncResponseHistoryRefs]);

  const processAutoSpeechQueue = useCallback(() => {
    if (activeAutoSpeechEventRef.current || queuedResponseEventsRef.current.length === 0) {
      return;
    }

    const nextItem = queuedResponseEventsRef.current.shift();
    if (!nextItem) return;

    const isCurrentRequest =
      currentSessionIdRef.current === nextItem.sessionId &&
      activeRequestIdRef.current === nextItem.requestId;
    if (
      !isCurrentRequest
      || !ttsEnabledRef.current
      || autoTtsSuppressedRequestIdsRef.current.has(nextItem.requestId)
    ) {
      processAutoSpeechQueue();
      return;
    }

    activeAutoSpeechEventRef.current = nextItem;
    const stopGenerationAtStart = getGlobalTtsStopGeneration();

    const spoken = speakAssistantResponse(nextItem.event.text, `response event ${nextItem.event.ordinal}`, () => {
      activeAutoSpeechEventRef.current = null;
      if (getGlobalTtsStopGeneration() !== stopGenerationAtStart) {
        queuedResponseEventsRef.current = [];
        return;
      }
      if (
        currentSessionIdRef.current === nextItem.sessionId &&
        activeRequestIdRef.current === nextItem.requestId
      ) {
        processAutoSpeechQueue();
      }
    });

    if (!spoken) {
      activeAutoSpeechEventRef.current = null;
      processAutoSpeechQueue();
      return;
    }

    playedResponseEventIdsRef.current.add(nextItem.event.id);
  }, [speakAssistantResponse]);

  const enqueueResponseEventsForSpeech = useCallback((
    events: AgentUserResponseEvent[],
    sessionId: string | null,
    requestId: number
  ) => {
    // Use the ref alongside the captured config so a mute that landed after this
    // callback was scheduled still suppresses queueing.
    if (config.ttsEnabled === false || !ttsEnabledRef.current || !events.length) return;
    if (currentSessionIdRef.current !== sessionId || activeRequestIdRef.current !== requestId) return;
    if (autoTtsSuppressedRequestIdsRef.current.has(requestId)) return;

    const queuedIds = new Set(queuedResponseEventsRef.current.map((item) => item.event.id));
    const activeId = activeAutoSpeechEventRef.current?.event.id;
    const unseenEvents = events.filter((event) => (
      !playedResponseEventIdsRef.current.has(event.id)
      && !queuedIds.has(event.id)
      && event.id !== activeId
    ));

    if (!unseenEvents.length) return;

    queuedResponseEventsRef.current = [
      ...queuedResponseEventsRef.current,
      ...unseenEvents.map((event) => ({ event, sessionId, requestId })),
    ].sort((a, b) => compareResponseEvents(a.event, b.event));

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
      assistantSpeechStartedAtRef.current = 0;
      stopGlobalTtsPlayback();
	      if (handsFree) {
	        handsFreeController.onSpeechFinished();
	        voiceLog('tts-stopped', 'Assistant speech stopped from message playback.');
	      }
      setSpeakingMessageIndex(null);
      return;
    }
    // Stop any current speech first
    intendedSpeakingIndexRef.current = index;
    assistantSpeechStartedAtRef.current = 0;
    stopGlobalTtsPlayback();
    const processedText = preprocessTextForTTS(content);
    if (!processedText) {
      intendedSpeakingIndexRef.current = null;
      return;
    }
    if (mentraVoiceActive && !mentra.audioConnected) {
      intendedSpeakingIndexRef.current = null;
      setDebugInfo('Mentra Live audio is not connected. Complete the Android Bluetooth audio pairing first.');
      playHandsFreeCue('error');
      return;
    }
    const currentAndroidHandsFreeTtsRuntime = getCurrentAndroidHandsFreeTtsRuntime();
    const configuredAndroidServiceRemoteTts = shouldUseAndroidHandsFreeServiceRemoteTtsRef.current;
    const forceNativeAndroidServiceTts =
      configuredAndroidServiceRemoteTts
      && currentAndroidHandsFreeTtsRuntime.backgroundHandsFree;
    const useAndroidServiceRemoteTts =
      configuredAndroidServiceRemoteTts
      && !forceNativeAndroidServiceTts;
    const useAndroidServiceNativeTts =
      shouldUseAndroidHandsFreeServiceNativeTtsRef.current
      || forceNativeAndroidServiceTts;
    const useAndroidServiceTts = useAndroidServiceRemoteTts || useAndroidServiceNativeTts;
    const hasRemoteEdgeTts = effectiveTtsProvider === 'edge' && !!config.baseUrl && !!config.apiKey;
    console.info('[DotAgentsTTS] selecting message playback path', {
      index,
      textLength: processedText.length,
      effectiveTtsProvider,
      configuredAndroidServiceRemoteTts,
      forceNativeAndroidServiceTts,
      useAndroidServiceNativeTts,
      useAndroidServiceRemoteTts,
      appState: currentAndroidHandsFreeTtsRuntime.appState,
      isFocused: currentAndroidHandsFreeTtsRuntime.isFocused,
      androidBackgroundHandsFree: currentAndroidHandsFreeTtsRuntime.backgroundHandsFree,
      stableForeground: currentAndroidHandsFreeTtsRuntime.stableForeground,
    });
    const playbackId = beginGlobalTtsPlayback({
      source: 'message',
      status: hasRemoteEdgeTts || useAndroidServiceTts ? 'loading' : 'speaking',
      sessionId: sessionStore.currentSessionId,
      sessionTitle: sessionStore.getCurrentSession()?.title ?? 'Chat',
      messageIndex: index,
      text: processedText,
    });
    const isCurrentMessagePlayback = () => getGlobalTtsPlayback()?.id === playbackId;
    const clearStaleMessagePlaybackState = () => {
      if (intendedSpeakingIndexRef.current === index) {
        intendedSpeakingIndexRef.current = null;
      }
      setSpeakingMessageIndex((current) => (current === index ? null : current));
    };
	    if (handsFree) {
	      handsFreeController.onSpeechStarted();
	      voiceLog('tts-started', 'Assistant speech started from message playback.');
	    }
    setSpeakingMessageIndex(index);
    if (useAndroidServiceTts) {
      const utteranceId = createAndroidHandsFreeTtsUtteranceId();
      const servicePlaybackKind = useAndroidServiceRemoteTts ? 'remote' : 'native';
      let settled = false;
      let clearNativeTtsTimeout: (() => void) | null = null;
      const startServiceTtsWatchdog = (rate = config.ttsRate ?? 1.0) => {
        if (clearNativeTtsTimeout || settled) return;
        const timeout = setTimeout(() => {
          settle('not-started', 'watchdog');
        }, estimateNativeTtsWatchdogMs(processedText, rate));
        clearNativeTtsTimeout = () => clearTimeout(timeout);
      };
      const settle = (eventType: AndroidHandsFreeTtsSettleType | 'not-started' | 'promise-error', message?: string) => {
        if (settled) return;
        settled = true;
        androidHandsFreeTtsHandlersRef.current.delete(utteranceId);
        clearNativeTtsTimeout?.();
        clearNativeTtsTimeout = null;
        if (!isCurrentMessagePlayback()) {
          clearStaleMessagePlaybackState();
          return;
        }
        intendedSpeakingIndexRef.current = null;
        completeGlobalTtsPlayback(playbackId);
        if (handsFree) {
          handsFreeController.onSpeechFinished();
          voiceLog('tts-stopped', `Android service TTS settled from message playback (${eventType}).`, {
            utteranceId,
            kind: servicePlaybackKind,
            message,
          });
        }
        setSpeakingMessageIndex(null);
      };

      androidHandsFreeTtsHandlersRef.current.set(utteranceId, {
        onStarted: () => {
          if (!isCurrentMessagePlayback()) return;
          assistantSpeechStartedAtRef.current = Date.now();
          markGlobalTtsPlaybackSpeaking(playbackId);
        },
        onSettled: (type, message) => {
          settle(type, message);
        },
      });

      const speakNativeServiceMessageTts = async (fallbackMessage?: string) => {
        if (fallbackMessage && handsFree) {
          voiceLog('tts-stopped', 'Remote TTS failed; falling back to Android service native TTS for message playback.', {
            utteranceId,
            message: fallbackMessage,
          });
        }
        startServiceTtsWatchdog(config.ttsRate ?? 1.0);
        const startedUtteranceId = await speakAndroidHandsFreeTts({
          utteranceId,
          text: processedText,
          language: 'en-US',
          rate: config.ttsRate ?? 1.0,
          pitch: config.ttsPitch ?? 1.0,
          voice: config.ttsVoiceId,
          restoreListeningAfterDone: true,
          allowBargeIn: true,
        });
        if (!startedUtteranceId) {
          settle('not-started');
        }
      };

      void (async () => {
        try {
          if (useAndroidServiceRemoteTts) {
            try {
              const { audio, mimeType } = await fetchRemoteTtsAudio(processedText, {
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
                providerId: 'edge',
                voice: effectiveEdgeTtsVoice,
                rate: effectiveEdgeTtsRate,
              });
              if (!isCurrentMessagePlayback()) {
                clearStaleMessagePlaybackState();
                return;
              }
              const file = writeRemoteTtsAudioFile(audio, mimeType, 'handsfree-edge-message-tts');
              if (!isCurrentMessagePlayback()) {
                try { file.delete(); } catch {}
                clearStaleMessagePlaybackState();
                return;
              }
              try {
                const startedUtteranceId = await playAndroidHandsFreeTtsAudio({
                  utteranceId,
                  filePath: file.uri,
                  restoreListeningAfterDone: true,
                  allowBargeIn: true,
                  deleteFileOnRelease: true,
                });
                if (!startedUtteranceId) {
                  try { file.delete(); } catch {}
                  await speakNativeServiceMessageTts('remote audio handoff did not start');
                  return;
                }
                startServiceTtsWatchdog(effectiveEdgeTtsRate);
                return;
              } catch (error) {
                try { file.delete(); } catch {}
                throw error;
              }
            } catch (error) {
              if (!isCurrentMessagePlayback()) {
                clearStaleMessagePlaybackState();
                return;
              }
              await speakNativeServiceMessageTts((error as any)?.message || String(error));
              return;
            }
          }

          await speakNativeServiceMessageTts();
        } catch (error) {
          settle('promise-error', (error as any)?.message || String(error));
        }
      })();
      return;
    }
    if (hasRemoteEdgeTts) {
      // Edge TTS routes through the paired desktop's /v1/tts/speak.
      void speakRemoteTts(processedText, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: 'edge',
        voice: effectiveEdgeTtsVoice,
        rate: effectiveEdgeTtsRate,
        onStart: () => {
          if (!isCurrentMessagePlayback()) return;
          assistantSpeechStartedAtRef.current = Date.now();
          markGlobalTtsPlaybackSpeaking(playbackId);
        },
        onDone: () => {
          if (!isCurrentMessagePlayback()) {
            clearStaleMessagePlaybackState();
            return;
          }
          intendedSpeakingIndexRef.current = null;
          assistantSpeechStartedAtRef.current = 0;
          completeGlobalTtsPlayback(playbackId);
          if (handsFree) {
            handsFreeController.onSpeechFinished();
            voiceLog('tts-stopped', 'Assistant speech finished from message playback.');
          }
          setSpeakingMessageIndex(null);
        },
        onError: () => {
          if (!isCurrentMessagePlayback()) {
            clearStaleMessagePlaybackState();
            return;
          }
          intendedSpeakingIndexRef.current = null;
          assistantSpeechStartedAtRef.current = 0;
          completeGlobalTtsPlayback(playbackId);
          if (handsFree) {
            handsFreeController.onSpeechFinished();
            voiceLog('tts-stopped', 'Assistant speech errored during message playback.');
          }
          setSpeakingMessageIndex(null);
        },
        onStopped: () => {
          if (!isCurrentMessagePlayback()) {
            clearStaleMessagePlaybackState();
            return;
          }
          if (intendedSpeakingIndexRef.current === null || intendedSpeakingIndexRef.current === index) {
            intendedSpeakingIndexRef.current = null;
            assistantSpeechStartedAtRef.current = 0;
            completeGlobalTtsPlayback(playbackId);
            if (handsFree) {
              handsFreeController.onSpeechFinished();
              voiceLog('tts-stopped', 'Assistant speech stopped during message playback.');
            }
            setSpeakingMessageIndex(null);
          }
        },
      }).then((started) => {
        if (started) {
          if (!isCurrentMessagePlayback()) return;
          assistantSpeechStartedAtRef.current = assistantSpeechStartedAtRef.current || Date.now();
          markGlobalTtsPlaybackSpeaking(playbackId);
        }
      });
      return;
    }

    let clearSpeechWatchdog: (() => void) | null = null;
    let nativeSpeechStarted = false;
    const speechOptions: Speech.SpeechOptions = {
      language: 'en-US',
      rate: config.ttsRate ?? 1.0,
      pitch: config.ttsPitch ?? 1.0,
      onStart: () => {
        if (!isCurrentMessagePlayback()) return;
        nativeSpeechStarted = true;
        assistantSpeechStartedAtRef.current = Date.now();
        markGlobalTtsPlaybackSpeaking(playbackId);
      },
      onDone: () => {
        if (!isCurrentMessagePlayback()) {
          clearStaleMessagePlaybackState();
          return;
        }
        clearSpeechWatchdog?.();
        clearSpeechWatchdog = null;
        intendedSpeakingIndexRef.current = null;
        assistantSpeechStartedAtRef.current = 0;
        completeGlobalTtsPlayback(playbackId);
	        if (handsFree) {
	          handsFreeController.onSpeechFinished();
	          voiceLog('tts-stopped', 'Assistant speech finished from message playback.');
	        }
        setSpeakingMessageIndex(null);
      },
      onError: () => {
        if (!isCurrentMessagePlayback()) {
          clearStaleMessagePlaybackState();
          return;
        }
        clearSpeechWatchdog?.();
        clearSpeechWatchdog = null;
        intendedSpeakingIndexRef.current = null;
        assistantSpeechStartedAtRef.current = 0;
        completeGlobalTtsPlayback(playbackId);
	        if (handsFree) {
	          handsFreeController.onSpeechFinished();
	          voiceLog('tts-stopped', 'Assistant speech errored during message playback.');
	        }
        setSpeakingMessageIndex(null);
      },
      onStopped: () => {
        if (!isCurrentMessagePlayback()) {
          clearStaleMessagePlaybackState();
          return;
        }
        // Only clear if this callback is for the current intended message,
        // not a stale callback from a previously stopped utterance
        if (intendedSpeakingIndexRef.current === null || intendedSpeakingIndexRef.current === index) {
          clearSpeechWatchdog?.();
          clearSpeechWatchdog = null;
          intendedSpeakingIndexRef.current = null;
          assistantSpeechStartedAtRef.current = 0;
          completeGlobalTtsPlayback(playbackId);
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
    const settleNativeSpeechError = () => {
      clearSpeechWatchdog?.();
      clearSpeechWatchdog = null;
      intendedSpeakingIndexRef.current = null;
      assistantSpeechStartedAtRef.current = 0;
      completeGlobalTtsPlayback(playbackId);
      if (handsFree) {
        handsFreeController.onSpeechFinished();
        voiceLog('tts-stopped', 'Assistant speech errored during message playback.');
      }
      setSpeakingMessageIndex(null);
    };
    try {
      void (async () => {
        try {
          await ensureNativeTtsAudioMode();
          if (getGlobalTtsPlayback()?.id !== playbackId) return;
          Speech.speak(processedText, speechOptions);
        } catch {
          settleNativeSpeechError();
        }
      })();
      clearSpeechWatchdog = startNativeTtsSettlementWatchdog(
        processedText,
        config.ttsRate ?? 1.0,
        () => nativeSpeechStarted,
        () => {
          if (intendedSpeakingIndexRef.current !== index) {
            return;
          }
          intendedSpeakingIndexRef.current = null;
          assistantSpeechStartedAtRef.current = 0;
          completeGlobalTtsPlayback(playbackId);
          if (handsFree) {
            handsFreeController.onSpeechFinished();
            voiceLog('tts-stopped', 'Assistant speech watchdog settled message playback.');
          }
          setSpeakingMessageIndex(null);
        },
      );
    } catch {
      settleNativeSpeechError();
    }
		  }, [
	    speakingMessageIndex,
	    config.apiKey,
	    config.baseUrl,
	    config.ttsRate,
	    config.ttsPitch,
	    config.ttsVoiceId,
	    effectiveEdgeTtsRate,
	    effectiveEdgeTtsVoice,
	    effectiveTtsProvider,
	    getCurrentAndroidHandsFreeTtsRuntime,
	    handsFree,
	    handsFreeController,
    mentra.audioConnected,
    mentraVoiceActive,
    playHandsFreeCue,
    sessionStore,
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
  // While true, the next content size change should snap to the bottom. Used to
  // keep large sessions pinned to the latest message as messages render in
  // multiple frames (issue #408).
  const initialScrollPendingRef = useRef(false);
  const initialScrollWindowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearInitialScrollWindow = useCallback(() => {
    if (initialScrollWindowTimeoutRef.current) {
      clearTimeout(initialScrollWindowTimeoutRef.current);
      initialScrollWindowTimeoutRef.current = null;
    }
    initialScrollPendingRef.current = false;
  }, []);

  const beginInitialScrollWindow = useCallback(() => {
    if (initialScrollWindowTimeoutRef.current) {
      clearTimeout(initialScrollWindowTimeoutRef.current);
    }
    initialScrollPendingRef.current = true;
    // Safety net: stop pinning to bottom after 2.5s so streaming-only updates
    // can't get stuck snapping when the user wants to read history.
    initialScrollWindowTimeoutRef.current = setTimeout(() => {
      initialScrollPendingRef.current = false;
      initialScrollWindowTimeoutRef.current = null;
    }, 2500);
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (initialScrollPendingRef.current && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
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
    // User is taking control - stop snapping to bottom on content size changes.
    clearInitialScrollWindow();
  }, [clearInitialScrollWindow]);

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

  // When messages first arrive for a session (e.g. lazy-load from server
  // completes after the session-change window expired), re-enter the initial
  // scroll window so we still land at the latest message (issue #408).
  const previousMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (
      messages.length > 0 &&
      previousMessagesLengthRef.current === 0 &&
      !isUserDraggingRef.current
    ) {
      beginInitialScrollWindow();
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length, beginInitialScrollWindow]);

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
      if (initialScrollWindowTimeoutRef.current) {
        clearTimeout(initialScrollWindowTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!settingsClient || !isFocused) {
      if (!settingsClient) {
        setPredefinedPrompts([]);
        setAvailableSkills([]);
        setAvailableTasks([]);
        setDesktopSettings(null);
        setOperatorSessions([]);
        setModelOptions([]);
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
      settingsClient.getOperatorStatus(),
    ] as const)
      .then(([settingsResult, skillsResult, loopsResult, operatorStatusResult]) => {
        if (cancelled) return;

        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value;
          setDesktopSettings(settings);
          const nextPrompts = [...(settings.predefinedPrompts || [])].sort((a, b) => b.updatedAt - a.updatedAt);
          setPredefinedPrompts(nextPrompts);
          setRemoteTtsProvider(settings.ttsProviderId === 'edge' ? 'edge' : 'native');
          setRemoteEdgeTtsVoice(settings.edgeTtsVoice || 'en-US-AriaNeural');
          setRemoteEdgeTtsRate(settings.edgeTtsRate ?? 1.0);
        } else {
          setDesktopSettings(null);
          setPredefinedPrompts([]);
        }

        setAvailableSkills(skillsResult.status === 'fulfilled' ? skillsResult.value.skills : []);
        setAvailableTasks(loopsResult.status === 'fulfilled' ? loopsResult.value.loops : []);
        setOperatorSessions(
          operatorStatusResult.status === 'fulfilled'
            ? operatorStatusResult.value.sessions.activeSessionDetails ?? []
            : [],
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingQuickStartPrompts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isFocused, settingsClient]);

  useEffect(() => {
    if (!settingsClient || !desktopSettings) {
      setModelOptions([]);
      setIsLoadingModelOptions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingModelOptions(true);
    settingsClient.getModels(agentProviderId)
      .then((response) => {
        if (cancelled) return;
        setModelOptions(response.models || []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[ChatScreen] Failed to load model options:', error);
        setModelOptions([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingModelOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agentProviderId, desktopSettings, settingsClient]);

  const saveDesktopSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!settingsClient || !desktopSettings || isSavingModelSettingsRef.current) return;
    const nextSettings = { ...desktopSettings, ...updates };
    isSavingModelSettingsRef.current = true;
    setIsSavingModelSettings(true);
    setDesktopSettings(nextSettings);
    try {
      await settingsClient.updateSettings(updates);
    } catch (error: any) {
      setDesktopSettings(desktopSettings);
      const message = error?.message || 'Failed to update model settings';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Model settings', message);
      }
    } finally {
      isSavingModelSettingsRef.current = false;
      setIsSavingModelSettings(false);
    }
  }, [desktopSettings, settingsClient]);

  const handleAgentProviderChange = useCallback((nextProviderId: CHAT_PROVIDER_ID) => {
    if (nextProviderId === agentProviderId) return;
    void saveDesktopSettings({ agentProviderId: nextProviderId });
  }, [agentProviderId, saveDesktopSettings]);

  const handleAgentModelChange = useCallback((modelId: string) => {
    if (!modelId || modelId === currentAgentModel) return;
    void saveDesktopSettings(buildAgentModelSettingsUpdate(agentProviderId, modelId));
  }, [agentProviderId, currentAgentModel, saveDesktopSettings]);

  const handleReasoningEffortChange = useCallback((value: OpenAiReasoningEffort) => {
    void saveDesktopSettings({ openaiReasoningEffort: value });
  }, [saveDesktopSettings]);

  const handleServiceTierChange = useCallback((value: CodexServiceTier) => {
    void saveDesktopSettings({ codexServiceTier: value });
  }, [saveDesktopSettings]);

  const handleStopCurrentAgentSession = useCallback(async () => {
    if (isStoppingCurrentSession) return;
    closeChatMenu();

    const showStopError = (message: string) => {
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Stop session', message);
      }
    };

    if (!settingsClient) {
      showStopError('Connect to your desktop before stopping a session.');
      return;
    }

    const stopSession = async () => {
      setIsStoppingCurrentSession(true);
      try {
        let sessionId = currentOperatorSession?.id;
        if (!sessionId && currentSession?.serverConversationId) {
          const status = await settingsClient.getOperatorStatus();
          const refreshedSessions = status.sessions.activeSessionDetails ?? [];
          setOperatorSessions(refreshedSessions);
          sessionId = refreshedSessions.find(
            (session) => session.conversationId === currentSession.serverConversationId,
          )?.id;
        }

        if (!sessionId) {
          showStopError('Could not identify an active desktop session for this chat.');
          return;
        }

        const result = await settingsClient.stopOperatorAgentSession(sessionId);
        if (!result.success) {
          const message = result.message || result.error || 'Failed to stop the current session';
          showStopError(message);
          return;
        }
        setOperatorSessions((sessions) => sessions.filter((session) => session.id !== sessionId));
      } catch (error: any) {
        const message = error?.message || 'Failed to stop the current session';
        showStopError(message);
      } finally {
        setIsStoppingCurrentSession(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Stop the active agent session for this chat?')) {
        await stopSession();
      }
      return;
    }

    Alert.alert(
      'Stop current session',
      'Stop the active agent session for this chat only?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => { void stopSession(); } },
      ],
    );
  }, [closeChatMenu, currentOperatorSession?.id, currentSession?.serverConversationId, isStoppingCurrentSession, settingsClient]);

  const handleEmergencyStop = useCallback(async () => {
    if (isEmergencyStopping) return;
    closeChatMenu();

    const showEmergencyStopError = (message: string) => {
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Emergency stop', message);
      }
    };

    if (!settingsClient) {
      showEmergencyStopError('Connect to your desktop before using Emergency Stop.');
      return;
    }

    const stopEverything = async () => {
      setIsEmergencyStopping(true);
      try {
        const result = await settingsClient.emergencyStop();
        if (!result.success) {
          showEmergencyStopError(result.message || result.error || 'Emergency Stop failed.');
          return;
        }
        setOperatorSessions([]);
      } catch (error: any) {
        showEmergencyStopError(error?.message || 'Emergency Stop failed.');
      } finally {
        setIsEmergencyStopping(false);
      }
    };

    const confirmation = 'Immediately stop all active agent work across the desktop app?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmation)) {
        await stopEverything();
      }
      return;
    }

    Alert.alert(
      'Emergency stop',
      confirmation,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop everything', style: 'destructive', onPress: () => { void stopEverything(); } },
      ],
    );
  }, [closeChatMenu, isEmergencyStopping, settingsClient]);

  const handleSavePrompt = async () => {
    const name = newPromptName.trim();
    const content = newPromptContent.trim();
    if (!settingsClient || !name || !content || isSavingPrompt) return;
    setIsSavingPrompt(true);
    const wasEditingPrompt = Boolean(editingPrompt);
    try {
      const now = Date.now();
      const updatedPrompts = editingPrompt
        ? predefinedPrompts.map((prompt) => (
            prompt.id === editingPrompt.id
              ? {
                  ...prompt,
                  name,
                  content,
                  updatedAt: now,
                }
              : prompt
          ))
        : [
            {
              id: `prompt-${now}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              content,
              createdAt: now,
              updatedAt: now,
            },
            ...predefinedPrompts,
          ];

      await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(updatedPrompts);
      setAddPromptModalVisible(false);
      setEditingPrompt(null);
      setNewPromptName('');
      setNewPromptContent('');
      Alert.alert(
        'Success',
        wasEditingPrompt
          ? 'Prompt updated in your desktop prompt library.'
          : 'Prompt saved to your desktop prompt library.'
      );
    } catch (error: any) {
      console.error('[ChatScreen] Error saving prompt:', error);
      Alert.alert('Error', error.message || 'Failed to save prompt.');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleDeletePromptConfirmed = useCallback(async (prompt: PredefinedPromptSummary) => {
    if (!settingsClient || isSavingPrompt) return;
    setIsSavingPrompt(true);
    try {
      const updatedPrompts = predefinedPrompts.filter((existingPrompt) => existingPrompt.id !== prompt.id);
      await settingsClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(updatedPrompts);
      if (editingPrompt?.id === prompt.id) {
        setAddPromptModalVisible(false);
        setEditingPrompt(null);
        setNewPromptName('');
        setNewPromptContent('');
      }
      Alert.alert('Deleted', 'Prompt removed from your desktop prompt library.');
    } catch (error: any) {
      console.error('[ChatScreen] Error deleting prompt:', error);
      Alert.alert('Error', error.message || 'Failed to delete prompt.');
    } finally {
      setIsSavingPrompt(false);
    }
  }, [editingPrompt?.id, isSavingPrompt, predefinedPrompts, settingsClient]);

  const handleDeletePrompt = useCallback((prompt: PredefinedPromptSummary) => {
    if (!settingsClient || isSavingPrompt) return;
    const message = `Delete "${prompt.name}" from your desktop prompt library?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        void handleDeletePromptConfirmed(prompt);
      }
      return;
    }

    Alert.alert('Delete Prompt', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDeletePromptConfirmed(prompt);
        },
      },
    ]);
  }, [handleDeletePromptConfirmed, isSavingPrompt, settingsClient]);

  // Reset auto-scroll when session changes. For large sessions the content
  // height grows across multiple frames as messages render, so a single
  // delayed scrollToEnd lands in the middle. Instead, enter an "initial scroll"
  // window where onContentSizeChange keeps pinning to the bottom until the
  // user drags or the window expires (issue #408).
  useEffect(() => {
    setShouldAutoScroll(true);
    previousMessagesLengthRef.current = 0;
    beginInitialScrollWindow();
    scrollViewRef.current?.scrollToEnd({ animated: false });
    return () => {
      clearInitialScrollWindow();
    };
  }, [sessionStore.currentSessionId, beginInitialScrollWindow, clearInitialScrollWindow]);

  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const lastLoadedSessionMessagesKeyRef = useRef<string | null>(null);
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
    const currentSessionMessagesKey = getSessionMessagesVersionKey(currentSession);
    const shouldAttemptStubLoad = !!(
      currentSession &&
      currentSession.messages.length === 0 &&
      currentSession.serverConversationId &&
      hasServerAuth
    );
    const isSameSession = lastLoadedSessionIdRef.current === currentSessionId;
    const hasSameSessionMessages =
      isSameSession && lastLoadedSessionMessagesKeyRef.current === currentSessionMessagesKey;

    // Avoid repeated work on stable sessions unless we still need to lazy-load stub messages.
    if (currentSession && hasSameSessionMessages && !shouldAttemptStubLoad) {
      return;
    }

    // Store updates for the current session can arrive while a response is still
    // streaming. Let the live request own local message state until it settles.
    if (currentSession && isSameSession && !shouldAttemptStubLoad && hasLiveAgentTurn) {
      return;
    }

    const isSessionSwitch = !isSameSession;
    if (isSessionSwitch) {
      // Reset expandedMessages and expandedToolCalls on session switch to ensure consistent
      // "final response expanded" behavior per chat and prevent stale UI state from leaking.
      setExpandedMessages({});
      setExpandedToolCalls({});
      setExpandedGroups({});
      clearCopiedMessageFeedback();
      // Clear respond_to_user history for the new session
      replaceResponseHistory([]);
      playedResponseEventIdsRef.current = new Set();
      queuedResponseEventsRef.current = [];
      activeAutoSpeechEventRef.current = null;
      // Clear stale in-flight marker when switching sessions.
      pendingLazyLoadSessionIdRef.current = null;
      // Clear skipNextPersistRef to prevent the first real message in the new session
      // from being skipped if a lazy-load from the previous session had set it.
      skipNextPersistRef.current = false;
    }

    // If we have an existing session, always load its messages regardless of deletions
    if (currentSession) {
      lastLoadedSessionIdRef.current = currentSession.id;
      lastLoadedSessionMessagesKeyRef.current = currentSessionMessagesKey;

      if (currentSession.messages.length > 0) {
        skipNextPersistRef.current = true;
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
        activeAutoSpeechEventRef.current = null;
        if (isSessionSwitch && currentSession.serverConversationId && hasServerAuth) {
          const refreshSessionId = currentSession.id;
          const client = settingsClient || new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
          sessionStore.loadSessionMessages(refreshSessionId, client, { force: true })
            .catch((err) => {
              console.warn('[ChatScreen] Failed to refresh server session messages:', err);
            });
        }
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
            lastLoadedSessionMessagesKeyRef.current = getSessionMessagesVersionKey(sessionStore.getCurrentSession());
            setMessages(loadedMessages);

            // Extract respond_to_user content from lazy-loaded messages (#32, #33)
            const lazyResponses = extractRespondToUserHistory(
              loadedMessages as RespondToUserHistorySourceMessage[]
            );
	            replaceResponseHistory(lazyResponses);
            playedResponseEventIdsRef.current = new Set(lazyResponses.map((event) => event.id));
            queuedResponseEventsRef.current = [];
            activeAutoSpeechEventRef.current = null;
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
    lastLoadedSessionMessagesKeyRef.current = getSessionMessagesVersionKey(currentSession);

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
      activeAutoSpeechEventRef.current = null;
    } else {
      setMessages([]);
	      replaceResponseHistory([]);
    }
	  }, [sessionStore.currentSessionId, sessionStore, sessionStore.deletingSessionIds.size, config.baseUrl, config.apiKey, settingsClient, clearCopiedMessageFeedback, replaceResponseHistory, hasLiveAgentTurn]);

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

  const prevPersistedMessagesKeyRef = useRef<string | null>(null);
  const prevSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentSessionId = sessionStore.currentSessionId;
    const currentMessagesKey = getLocalMessagesVersionKey(currentSessionId, messages);

    // Don't save messages if the current session is being deleted (fixes #571)
    // Only skip if the current session is in the deleting set, not for any deletion
    if (currentSessionId && sessionStore.deletingSessionIds.has(currentSessionId)) {
      return;
    }

    const isSessionSwitch = prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId;
    prevSessionIdRef.current = currentSessionId;

    if (isSessionSwitch) {
      prevPersistedMessagesKeyRef.current = currentMessagesKey;
      return;
    }

    if (messages.length > 0 && currentMessagesKey !== prevPersistedMessagesKeyRef.current) {
      if (skipNextPersistRef.current) {
        // Messages were just hydrated from a server lazy-load and are already
        // saved by loadSessionMessages; skip to avoid ID/updatedAt regeneration.
        skipNextPersistRef.current = false;
      } else {
        sessionStore.setMessages(messages);
      }
    } else if (skipNextPersistRef.current) {
      // The message snapshot did not change (or is empty), so clear the flag
      // now to prevent it from accidentally skipping the next real
      // message persistence (e.g., lazy-load returned same count as before).
      skipNextPersistRef.current = false;
    }
    prevPersistedMessagesKeyRef.current = currentMessagesKey;
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

  const getToolActivityGroupKey = useCallback((group: ToolActivityGroup) => `${group.startIndex}`, []);

  // Toggle expansion of a tool-activity group using a stable key for the run.
  const toggleGroupExpansion = useCallback((group: ToolActivityGroup) => {
    const key = getToolActivityGroupKey(group);
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }, [getToolActivityGroupKey]);

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

  const convertProgressToMessages = useCallback((
    update: AgentProgressUpdate,
    visibleResponseText?: string
  ): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    const delegationMessages = createDelegationProgressMessages(update.steps);
    console.log('[convertProgressToMessages] Processing update, steps:', update.steps?.length || 0, 'history:', update.conversationHistory?.length || 0, 'isComplete:', update.isComplete);

    if (update.steps && update.steps.length > 0) {
      let currentToolCalls: any[] = [];
      let currentToolResults: any[] = [];
      const currentToolExecutionStats: Array<ToolExecutionStats | undefined> = [];
      const thinkingParts: string[] = [];

      const appendThinkingPart = (value?: string) => {
        const content = value?.trim();
        if (!content) return;
        const lastIndex = thinkingParts.length - 1;
        const previous = thinkingParts[lastIndex];
        if (!previous) {
          thinkingParts.push(content);
        } else if (content === previous) {
          return;
        } else if (content.startsWith(previous)) {
          thinkingParts[lastIndex] = content;
        } else {
          thinkingParts.push(content);
        }
      };

      for (const step of update.steps) {
        const stepContent = step.content || step.llmContent;
        const stepFeedback = stepContent || [step.title, step.description].filter(Boolean).join('\n');
        if (step.type === 'thinking') {
          appendThinkingPart(stepFeedback);
        } else if (step.type === 'tool_call') {
          if (step.toolCall) {
            currentToolCalls.push(step.toolCall);
            currentToolExecutionStats.push(getAgentProgressStepToolExecutionStats(step));
          }
          if (step.toolResult) {
            currentToolResults.push(step.toolResult);
          }
        } else if (step.type === 'tool_result' && step.toolResult) {
          currentToolResults.push(step.toolResult);
        } else if (step.type === 'completion') {
          appendThinkingPart(stepFeedback);
        }
      }

      const thinkingContent = thinkingParts.join('\n\n');

      const activeStep = [...update.steps].reverse().find((step) => step.status === 'in_progress');
      const isVerificationStep = activeStep?.title?.toLowerCase().includes('verifying');
      const hasCurrentToolActivity = currentToolCalls.length > 0 || currentToolResults.length > 0;
      const hasCurrentAssistantFeedback = hasCurrentToolActivity || thinkingContent.trim().length > 0;
      const hasCurrentStateFeedback =
        hasCurrentAssistantFeedback ||
        !!update.pendingToolApproval ||
        delegationMessages.length > 0 ||
        !!update.streamingContent?.text;

      if (hasCurrentAssistantFeedback) {
        const toolExecutions = currentToolExecutionStats.some(Boolean)
          ? currentToolCalls.map((toolCall, index) => ({
              toolCall,
              result: currentToolResults[index],
              executionStats: currentToolExecutionStats[index],
            }))
          : undefined;
        if (thinkingContent) {
          messages.push({
            id: `live-progress-thinking-${update.sessionId}-${update.runId ?? 0}`,
            role: 'assistant',
            content: thinkingContent,
          });
        }
        if (hasCurrentToolActivity) {
          messages.push({
            id: `live-progress-tools-${update.sessionId}-${update.runId ?? 0}`,
            role: 'assistant',
            content: '',
            toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
            toolResults: currentToolResults.length > 0 ? currentToolResults : undefined,
            toolExecutionStats: currentToolExecutionStats.some(Boolean) ? currentToolExecutionStats : undefined,
            toolExecutions,
          });
        }
      } else if (
        !update.isComplete &&
        !hasCurrentStateFeedback &&
        !isVerificationStep
      ) {
        messages.push({
          id: `live-progress-thinking-${update.sessionId}-${update.runId ?? 0}`,
          role: 'assistant',
          content: activeStep?.type === 'tool_call'
            ? activeStep.title || 'Running tool...'
            : activeStep?.description || 'Thinking...',
        });
      }
    }

    if (update.conversationHistory && update.conversationHistory.length > 0) {
      let currentTurnStartIndex = -1;
      for (let i = 0; i < update.conversationHistory.length; i++) {
        if (update.conversationHistory[i].role === 'user') {
          currentTurnStartIndex = i;
        }
      }

      const hasAssistantMessages = currentTurnStartIndex + 1 < update.conversationHistory.length;
      if (hasAssistantMessages) {
        const persistentThinkingMessages = messages.filter((message) => (
          message.id?.startsWith('live-progress-thinking-')
        ));
        messages.length = 0;
        messages.push(...persistentThinkingMessages);

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
            id: `live-progress-history-${update.sessionId}-${update.runId ?? 0}-${(update.conversationHistoryStartIndex ?? 0) + i}`,
            role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
            content: historyMsg.content || '',
            displayContent: historyMsg.displayContent,
            timestamp: historyMsg.timestamp,
            toolCalls: historyMsg.toolCalls,
            toolResults: historyMsg.toolResults,
          });
        }
      }
    }

    if (update.streamingContent?.text) {
      const streamingMessageId = `live-progress-stream-${update.sessionId}-${update.runId ?? 0}`;
      const existingStreamingIndex = messages.findIndex((message) => message.id === streamingMessageId);
      if (existingStreamingIndex >= 0) {
        messages[existingStreamingIndex] = {
          ...messages[existingStreamingIndex],
          content: update.streamingContent.text,
        };
      } else if (!messages.some((message) => message.content === update.streamingContent?.text)) {
        messages.push({
          id: streamingMessageId,
          role: 'assistant',
          content: update.streamingContent.text,
        });
      }
    }

    if (update.pendingToolApproval) {
      messages.push({
        role: 'assistant',
        content: `Tool approval required: ${update.pendingToolApproval.toolName}`,
        variant: 'approval',
        toolApproval: update.pendingToolApproval,
      });
    }

    const messagesWithUserResponse = applyUserResponseToMessages(
      messages,
      visibleResponseText || update.userResponse || update.spokenContent,
    );
    return [...messagesWithUserResponse, ...delegationMessages];
  }, []);

  // Get the current conversation ID for queue operations
  const currentConversationId = sessionStore.currentSessionId || 'default';

  // Get queued messages for the current conversation
  const queuedMessages = messageQueue.getQueue(currentConversationId);
  const pendingQueuedMessages = queuedMessages.filter((message) => message.status === 'pending');
  const nextQueuedMessage = !responding ? messageQueue.peek(currentConversationId) : null;
  // The MessageQueuePanel below renders the same queued messages. Track whether
  // it will appear so the inline "Follow-up queued" bubbles can be suppressed
  // and avoid showing the same message in two surfaces at once (#527).
  const messageQueuePanelVisible = messageQueueEnabled && queuedMessages.length > 0;

  useEffect(() => {
    if (pendingQueuedMessages.length === 0 || !shouldAutoScroll) return;
    const timeoutId = setTimeout(() => {
      if (shouldAutoScrollRef.current) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [pendingQueuedMessages.length, shouldAutoScroll]);

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
        quality: 0.5,
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
      let pickerBase64Count = 0;
      let fileBase64FallbackCount = 0;

      for (const [index, asset] of selectedAssets.entries()) {
        const displayName = asset.fileName || `Image ${index + 1}`;
        const base64Result = await readPickerAssetBase64(asset);
        if (!base64Result) {
          missingBase64Names.push(displayName);
          continue;
        }
        if (base64Result.source === 'picker') pickerBase64Count += 1;
        else fileBase64FallbackCount += 1;

        const embeddedSourceBytes = getApproxBase64Bytes(base64Result.base64);
        if (embeddedSourceBytes > MAX_PENDING_IMAGE_FILE_SIZE_BYTES) {
          oversizedImageNames.push(displayName);
          continue;
        }

        const mimeType = inferImageMimeTypeFromBase64(base64Result.base64)
          || (base64Result.source === 'picker' ? 'image/jpeg' : inferImageMimeType(asset));
        if (!mimeType) {
          unknownMimeNames.push(displayName);
          continue;
        }

        const dataUrl = `data:${mimeType};base64,${base64Result.base64}`;
        const embeddedBytes = getApproxDataUrlBytes(dataUrl) || embeddedSourceBytes;
        if (runningEmbeddedBytes + embeddedBytes > MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES) {
          budgetExceededNames.push(displayName);
          continue;
        }
        runningEmbeddedBytes += embeddedBytes;

        const fileName = asset.fileName || `image-${Date.now()}-${index + 1}`;
        nextImages.push({
          id: `${Date.now()}-${index}-${asset.uri}`,
          name: fileName,
          previewUri: asset.uri,
          dataUrl,
        });
      }

      console.info('[DotAgentsImages] processed selected images', {
        selectedCount: selectedAssets.length,
        acceptedCount: nextImages.length,
        pickerBase64Count,
        fileBase64FallbackCount,
        missingBase64Count: missingBase64Names.length,
        oversizedCount: oversizedImageNames.length,
        unknownMimeCount: unknownMimeNames.length,
        budgetExceededCount: budgetExceededNames.length,
        existingEmbeddedBytes,
        totalEmbeddedBytesAfterAdd: runningEmbeddedBytes,
        embeddedBudgetBytes: MAX_TOTAL_PENDING_IMAGE_EMBEDDED_BYTES,
        selectedOriginalFileBytes: selectedAssets.map((asset) => asset.fileSize || null),
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
      console.warn('[DotAgentsImages] image picker failed', summarizeImageAttachmentError(error));
      Alert.alert('Image picker error', error?.message || 'Unable to select images right now.');
    }
  }, [pendingImages]);

  const removePendingImage = useCallback((attachmentId: string) => {
    setPendingImages((prev) => prev.filter((image) => image.id !== attachmentId));
  }, []);

  const send = async (
    text: string,
    options?: { fromComposer?: boolean; source?: 'handsfree'; onSubmitted?: () => void },
  ) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (options?.source === 'handsfree' && isHandsFreeTranscriptSuppressedNow()) {
      voiceLog('transcript-ignored', 'Handsfree send blocked while assistant audio is speaking.', {
        phase: handsFreePhaseRef.current,
        hasLiveAgentTurn,
        hasGlobalTtsPlayback: !!getGlobalTtsPlayback(),
        textLength: trimmedText.length,
      });
      return;
    }

    if (
      options?.source === 'handsfree'
      && isRecentGlobalHandsFreeSendDuplicate(currentSessionIdRef.current, trimmedText)
    ) {
      voiceLog('transcript-ignored', 'Duplicate handsfree send ignored across mounted chat screens.', {
        phase: handsFreePhaseRef.current,
        sessionId: currentSessionIdRef.current,
        textLength: trimmedText.length,
      });
      console.info(
        `[DotAgentsHandsFreeJS] duplicate send ignored session=${currentSessionIdRef.current || 'none'} phase=${handsFreePhaseRef.current} textLength=${trimmedText.length}`,
      );
      return;
    }

    // Queue speculative follow-ups while the agent is still running. If the
    // current turn is explicitly waiting for user input, send immediately so the
    // reply continues the session instead of sitting behind the local queue.
    if (messageQueueEnabled && respondingRef.current && conversationState !== 'needs_input') {
      console.log('[ChatScreen] Agent busy, queuing message:', getMessageLogMeta(trimmedText));
      messageQueue.enqueue(currentConversationId, trimmedText, currentConversationId);
      if (options?.source === 'handsfree') {
        setSttPreviewWithExpiry('');
        playHandsFreeSubmittedCue();
        voiceLog('auto-send', 'Handsfree prompt queued while the assistant is still responding.', {
          textLength: trimmedText.length,
          phase: handsFreePhaseRef.current,
        });
      }
      if (options?.source !== 'handsfree') {
        setInput('');
      }
      if (options?.fromComposer) {
        setPendingImages([]);
      }
      options?.onSubmitted?.();
      return;
    }
    if (respondingRef.current && conversationState === 'needs_input') {
      console.log('[ChatScreen] Continuing needs-input session immediately:', getMessageLogMeta(trimmedText));
    }

    if (options?.source === 'handsfree' && !isFocusedRef.current) {
      navigation?.navigate?.('Chat');
      voiceLog('runtime-state', 'Handsfree send restored chat focus.', {
        appState: appStateRef.current,
        phase: handsFreePhaseRef.current,
        textLength: trimmedText.length,
      });
    }

    console.log('[ChatScreen] Sending message:', getMessageLogMeta(trimmedText));

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

    const userMsg: ChatMessage = { role: 'user', content: trimmedText };
	    // Use ref to avoid stale closures (notably auto-send after rapid-fire session switch).
	    const currentMessages = messagesRef.current;
	    const messageCountBeforeTurn = currentMessages.length;
    // Clear progress messages ref for this new request (#1083)
    progressMessagesRef.current = [];
    progressStepsRef.current = [];
    progressHistoryRef.current = null;
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '' }]);
    if (options?.source === 'handsfree') {
      setSttPreviewWithExpiry('');
      voiceLog('auto-send', 'Handsfree prompt submitted.', {
        textLength: trimmedText.length,
        phase: handsFreePhaseRef.current,
      });
    }
    if (options?.source === 'handsfree') {
      playHandsFreeSubmittedCue();
    } else {
      playHandsFreeCue('prompt-submitted');
    }
    setRespondingValue(true);
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

    let currentSession = sessionStore.getCurrentSession();
    let startingServerConversationId = currentSession?.serverConversationId;
    if (!startingServerConversationId && currentSession?.messages.length) {
      startingServerConversationId = await ensureServerConversationForExistingFollowUp('send');
      currentSession = sessionStore.getCurrentSession();
    }

    console.log('[ChatScreen] Session info:', {
      sessionId: currentSession?.id,
      serverConversationId: startingServerConversationId || 'new',
      requestId: thisRequestId
    });

    if (options?.source !== 'handsfree') {
      setInput('');
    }
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
      const announcedToolCallCueKeys = new Set<string>();

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
        playProgressToolCallCues(update, announcedToolCallCueKeys);
        const currentRunResponseEvents = getCurrentRunResponseEvents(update);
        if (currentRunResponseEvents.length) {
		          lastResponseEvents = currentRunResponseEvents;
	          mergeResponseEvents(lastResponseEvents);
	          enqueueResponseEventsForSpeech(lastResponseEvents, requestSessionId ?? null, thisRequestId);
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
	        progressStepsRef.current = mergeLiveProgressSteps(progressStepsRef.current, update.steps);
          progressHistoryRef.current = mergeLiveProgressHistory(
            progressHistoryRef.current,
            update.conversationHistory,
            update.conversationHistoryStartIndex ?? 0,
          );
          const stableProgressUpdate: AgentProgressUpdate = {
            ...update,
            steps: progressStepsRef.current,
            ...(progressHistoryRef.current
              ? {
                  conversationHistory: progressHistoryRef.current.messages,
                  conversationHistoryStartIndex: progressHistoryRef.current.startIndex,
                  conversationHistoryTotalCount: Math.max(
                    update.conversationHistoryTotalCount ?? 0,
                    progressHistoryRef.current.startIndex + progressHistoryRef.current.messages.length,
                  ),
                }
              : {}),
          };
	        const progressMessages = convertProgressToMessages(stableProgressUpdate, lastUserResponse);
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

        setMessages((m) => upsertLiveStreamingMessage(
          m,
          `live-token-stream-${requestSessionId ?? 'local'}-${thisRequestId}`,
          streamingText,
          messageCountBeforeTurn + 1,
        ));
      };

      const modelMessages = sanitizeMessagesForModel([...currentMessages, userMsg]);
	      const response = await client.chat(modelMessages, onToken, onProgress, serverConversationId);
      options?.onSubmitted?.();
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

      const responseConversationId = response.conversationId;
      if (responseConversationId) {
        resolvedConversationId = responseConversationId;
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
          });
        }
			        const finalTurnMessages = applyUserResponseToMessages(newMessages, finalDisplayText);
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
            if (responseConversationId) {
              await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
            }
          } else {
            console.log('[ChatScreen] Skipping background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state and persist the completed turn before
          // saving the server conversation id, so rehydration cannot restore
          // the pre-final progress snapshot.
          // Merge progress messages with final history to prevent intermediate messages
          // from disappearing when the server's history has fewer messages (#1083)
          const progressMsgs = progressMessagesRef.current;
          let finalMessagesForSession: ChatMessage[] | null = null;
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
              mergedMessages[mergedMessages.length - 1] = preserveDisplayContentFromProgress(
                [finalTurnMessages[finalTurnMessages.length - 1]],
                [mergedMessages[mergedMessages.length - 1]],
              )[0];
            } else {
              // History is authoritative when it has >= messages
              mergedMessages = preserveDisplayContentFromProgress(finalTurnMessages, progressMsgs);
            }
            const visibleMergedMessages = applyUserResponseToMessages(mergedMessages, finalDisplayText);
            const result = [...beforePlaceholder, ...visibleMergedMessages];
            finalMessagesForSession = result;
            console.log('[ChatScreen] Final messages count:', result.length);
            return result;
          });
          if (finalMessagesForSession) {
            if (requestSessionId) {
              await sessionStore.setMessagesForSession(requestSessionId, finalMessagesForSession);
            } else {
              await sessionStore.setMessages(finalMessagesForSession);
            }
          }
          if (responseConversationId) {
            if (requestSessionId) {
              await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
            } else {
              await sessionStore.setServerConversationId(responseConversationId);
            }
          }
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
            if (responseConversationId) {
              await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
            }
          } else {
            console.log('[ChatScreen] Skipping fallback background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state
          let finalMessagesForSession: ChatMessage[] | null = null;
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
	                copy[i] = { ...copy[i], content: finalDisplayText };
                break;
              }
            }
            finalMessagesForSession = copy;
            return copy;
          });
          if (finalMessagesForSession) {
            if (requestSessionId) {
              await sessionStore.setMessagesForSession(requestSessionId, finalMessagesForSession);
            } else {
              await sessionStore.setMessages(finalMessagesForSession);
            }
          }
          if (responseConversationId) {
            if (requestSessionId) {
              await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
            } else {
              await sessionStore.setServerConversationId(responseConversationId);
            }
          }
        }
      } else if (responseConversationId) {
        if (sessionChanged && requestSessionId) {
          await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
        } else {
          await sessionStore.setServerConversationId(responseConversationId);
        }
      } else {
        console.log('[ChatScreen] WARNING: No conversationHistory and no finalText!');
      }

      // The conversation ID is saved after final message persistence so session
      // rehydration cannot restore a pre-final progress snapshot.
      scheduleServerGeneratedTitleRefresh(requestSessionId, responseConversationId, 'send');

      // TTS: prefer userResponse (from respond_to_user tool) over finalText
      // userResponse is explicitly set by the agent for user communication
      // Skip TTS if we already played the same text mid-turn
      const ttsText = finalResponseEvent?.text || lastUserResponse || finalText;
      const alreadySpokenMidTurn = !!(finalResponseEvent
        ? playedResponseEventIdsRef.current.has(finalResponseEvent.id)
        : midTurnLegacyResponseText && ttsText === midTurnLegacyResponseText);
      const autoTtsSuppressed = autoTtsSuppressedRequestIdsRef.current.has(thisRequestId);
      if (!alreadySpokenMidTurn && !autoTtsSuppressed && !sessionChanged && ttsText && config.ttsEnabled !== false) {
        if (handsFree) {
          handsFreeController.onRequestCompleted();
        }
        speakAssistantResponse(ttsText, 'final response');
      } else {
        console.info('[DotAgentsTTS] auto speech skipped', {
          reason: 'final response',
          skipReasons: [
            alreadySpokenMidTurn ? 'already-spoken-mid-turn' : null,
            autoTtsSuppressed ? 'auto-tts-suppressed' : null,
            sessionChanged ? 'session-changed' : null,
            !ttsText ? 'empty-tts-text' : null,
            config.ttsEnabled === false ? 'tts-disabled' : null,
          ].filter(Boolean),
          textLength: ttsText?.length ?? 0,
          handsFree,
          sessionChanged,
          alreadySpokenMidTurn,
          autoTtsSuppressed,
          ttsEnabled: config.ttsEnabled !== false,
        });
        if (handsFree) {
          handsFreeController.onRequestCompleted();
        }
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
      setLastFailedMessage(trimmedText);

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
        setRespondingValue(false);
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
    setSttPreviewWithExpiry('');
    playHandsFreeSubmittedCue();
    setRespondingValue(true);
    setConversationState('running');
	    if (handsFree) {
	      handsFreeController.onRequestStarted();
	    }

    const thisRequestId = Date.now();
    activeRequestIdRef.current = thisRequestId;

    let currentSession = sessionStore.getCurrentSession();
    let startingServerConversationId = currentSession?.serverConversationId;
    if (!startingServerConversationId && currentSession?.messages.length) {
      startingServerConversationId = await ensureServerConversationForExistingFollowUp('queued');
      currentSession = sessionStore.getCurrentSession();
    }

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
      let queuedProgressMessages: ChatMessage[] = [];
      let queuedProgressSteps: AgentProgressStep[] = [];
      let queuedProgressHistory: LiveProgressHistoryState | null = null;
      const announcedToolCallCueKeys = new Set<string>();

      const onProgress = (update: AgentProgressUpdate) => {
        if (sessionStore.currentSessionId !== requestSessionId) return;
        if (activeRequestIdRef.current !== thisRequestId) return;
        latestConversationState = resolveConversationStateFromProgress(update, 'running');
        setConversationState(latestConversationState);
        playProgressToolCallCues(update, announcedToolCallCueKeys);
        const currentRunResponseEvents = getCurrentRunResponseEvents(update);
        if (currentRunResponseEvents.length) {
		          lastResponseEvents = currentRunResponseEvents;
	          mergeResponseEvents(lastResponseEvents);
	          enqueueResponseEventsForSpeech(lastResponseEvents, requestSessionId ?? null, thisRequestId);
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
	        queuedProgressSteps = mergeLiveProgressSteps(queuedProgressSteps, update.steps);
          queuedProgressHistory = mergeLiveProgressHistory(
            queuedProgressHistory,
            update.conversationHistory,
            update.conversationHistoryStartIndex ?? 0,
          );
          const stableProgressUpdate: AgentProgressUpdate = {
            ...update,
            steps: queuedProgressSteps,
            ...(queuedProgressHistory
              ? {
                  conversationHistory: queuedProgressHistory.messages,
                  conversationHistoryStartIndex: queuedProgressHistory.startIndex,
                  conversationHistoryTotalCount: Math.max(
                    update.conversationHistoryTotalCount ?? 0,
                    queuedProgressHistory.startIndex + queuedProgressHistory.messages.length,
                  ),
                }
              : {}),
          };
	        const progressMessages = convertProgressToMessages(stableProgressUpdate, lastUserResponse);
        if (progressMessages.length > 0) {
          queuedProgressMessages = progressMessages;
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
        setMessages((m) => upsertLiveStreamingMessage(
          m,
          `live-token-stream-${requestSessionId ?? 'local'}-${thisRequestId}`,
          streamingText,
          messageCountBeforeTurn + 1,
        ));
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

      const responseConversationId = response.conversationId;
      if (responseConversationId) {
        resolvedConversationId = responseConversationId;
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

          // Merge tool results into the preceding assistant message to avoid duplication.
          if (historyMsg.role === 'tool' && newMessages.length > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
              const hasToolResults = historyMsg.toolResults && historyMsg.toolResults.length > 0;

              if (hasToolResults) {
                lastMessage.toolResults = [
                  ...(lastMessage.toolResults || []),
                  ...(historyMsg.toolResults || []),
                ];
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
          });
        }
		        const finalTurnMessages = applyUserResponseToMessages(newMessages, finalDisplayText);

        let finalMessagesForSession: ChatMessage[] | null = null;
        setMessages((m) => {
          const beforePlaceholder = m.slice(0, messageCountBeforeTurn + 1);
          let mergedMessages: ChatMessage[];
          if (queuedProgressMessages.length > 0 && finalTurnMessages.length === 0) {
            mergedMessages = [...queuedProgressMessages];
          } else if (queuedProgressMessages.length > finalTurnMessages.length && finalTurnMessages.length > 0) {
            mergedMessages = [...queuedProgressMessages];
            mergedMessages[mergedMessages.length - 1] = preserveDisplayContentFromProgress(
              [finalTurnMessages[finalTurnMessages.length - 1]],
              [mergedMessages[mergedMessages.length - 1]],
            )[0];
          } else {
            mergedMessages = preserveDisplayContentFromProgress(finalTurnMessages, queuedProgressMessages);
          }
          const visibleMergedMessages = applyUserResponseToMessages(mergedMessages, finalDisplayText);
          const result = [...beforePlaceholder, ...visibleMergedMessages];
          finalMessagesForSession = result;
          return result;
        });
        if (finalMessagesForSession) {
          if (requestSessionId) {
            await sessionStore.setMessagesForSession(requestSessionId, finalMessagesForSession);
          } else {
            await sessionStore.setMessages(finalMessagesForSession);
          }
        }
        if (responseConversationId) {
          if (requestSessionId) {
            await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
          } else {
            await sessionStore.setServerConversationId(responseConversationId);
          }
        }
      } else if (finalDisplayText) {
        let finalMessagesForSession: ChatMessage[] | null = null;
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'assistant') {
              copy[i] = { ...copy[i], content: finalDisplayText };
              break;
            }
          }
          finalMessagesForSession = copy;
          return copy;
        });
        if (finalMessagesForSession) {
          if (requestSessionId) {
            await sessionStore.setMessagesForSession(requestSessionId, finalMessagesForSession);
          } else {
            await sessionStore.setMessages(finalMessagesForSession);
          }
        }
        if (responseConversationId) {
          if (requestSessionId) {
            await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
          } else {
            await sessionStore.setServerConversationId(responseConversationId);
          }
        }
      } else if (responseConversationId) {
        if (requestSessionId) {
          await sessionStore.setServerConversationIdForSession(requestSessionId, responseConversationId);
        } else {
          await sessionStore.setServerConversationId(responseConversationId);
        }
      }

      scheduleServerGeneratedTitleRefresh(requestSessionId, responseConversationId, 'queued');

      // TTS: prefer userResponse (from respond_to_user tool) over finalText
      // Skip TTS if we already played the same text mid-turn
      const ttsText = finalResponseEvent?.text || lastUserResponse || finalText;
      const alreadySpokenMidTurn = !!(finalResponseEvent
        ? playedResponseEventIdsRef.current.has(finalResponseEvent.id)
        : midTurnLegacyResponseText && ttsText === midTurnLegacyResponseText);
      const autoTtsSuppressed = autoTtsSuppressedRequestIdsRef.current.has(thisRequestId);
      if (!alreadySpokenMidTurn && !autoTtsSuppressed && ttsText && config.ttsEnabled !== false) {
        if (handsFree) {
          handsFreeController.onRequestCompleted();
        }
        speakAssistantResponse(ttsText, 'queued final response');
      } else {
        console.info('[DotAgentsTTS] auto speech skipped', {
          reason: 'queued final response',
          skipReasons: [
            alreadySpokenMidTurn ? 'already-spoken-mid-turn' : null,
            autoTtsSuppressed ? 'auto-tts-suppressed' : null,
            !ttsText ? 'empty-tts-text' : null,
            config.ttsEnabled === false ? 'tts-disabled' : null,
          ].filter(Boolean),
          textLength: ttsText?.length ?? 0,
          handsFree,
          alreadySpokenMidTurn,
          autoTtsSuppressed,
          ttsEnabled: config.ttsEnabled !== false,
        });
        if (handsFree) {
          handsFreeController.onRequestCompleted();
        }
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
        setRespondingValue(false);
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
	const effectiveMicListening = mentraVoiceActive
    ? mentra.captureState === 'capturing'
    : handsFree
		  ? (androidServiceHandlesHandsFreeMic ? shouldKeepHandsFreeMicArmed : listening)
		  : listening;
	const composerAccessibilityHint = createChatComposerAccessibilityHint({
	  handsFree,
	  handsFreeAutoSend,
	  handsFreeSendPhrase,
	  listening: effectiveMicListening,
	  isWeb: isWebPlatform,
	});
	const voiceInputLiveRegionAnnouncement = createVoiceInputLiveRegionAnnouncement({
	  listening: effectiveMicListening,
	  handsFree,
	  handsFreeAutoSend,
	  handsFreeSendPhrase,
	  willCancel,
	  liveTranscript,
		  sttPreview,
		});

  const promptQuickStarts = useMemo<QuickStartShortcut[]>(
    () => {
      const promptItems = predefinedPrompts
        .map((prompt) => ({
          id: prompt.id,
          title: prompt.name,
          content: prompt.content,
          description: prompt.content,
          source: isSlashCommandPrompt(prompt) ? 'command' as const : 'saved-prompt' as const,
          prompt,
        }));

      const skillItems = availableSkills.map((skill) => ({
        id: `skill-${skill.id}`,
        title: skill.name,
        content: getSkillPromptContent(skill),
        description: skill.description || skill.instructions || 'Use this skill as a reusable prompt.',
        source: 'skill' as const,
      }));

      const taskItems = availableTasks.map((task) => ({
        id: `task-${task.id}`,
        title: task.name,
        content: task.prompt || '',
        description: task.prompt || 'Run this desktop task now.',
        source: 'task' as const,
        task,
      }));

      const addPromptItem: QuickStartShortcut[] = settingsClient ? [{
        id: 'action-add-prompt',
        title: '+ Add Prompt',
        content: '',
        description: 'Create a predefined prompt and save it back to desktop.',
        source: 'action' as const,
        action: 'add-prompt' as const,
      }] : [];

      return [
        ...promptItems,
        ...skillItems,
        ...taskItems,
        ...addPromptItem,
      ];
    },
    [availableSkills, availableTasks, predefinedPrompts, settingsClient]
  );

  const composerHasContent = input.trim().length > 0 || pendingImages.length > 0;

  const sendComposerInput = useCallback(() => {
    const composedMessage = buildMessageWithPendingImages(input, pendingImages);
    if (!composedMessage.trim()) return;
    setSttPreviewWithExpiry('');
    void send(composedMessage, { fromComposer: true });
  }, [input, pendingImages, send, setSttPreviewWithExpiry]);

  const sendPendingHandsFreeDraft = useCallback(() => {
    const pendingDraft = pendingHandsFreeDraftRef.current.trim();
    if (!pendingDraft) return;
    setPendingHandsFreeDraftValue('');
    setSttPreviewWithExpiry('');
    setDebugInfo('Voice draft sent.');
    void send(pendingDraft, { source: 'handsfree' });
  }, [send, setPendingHandsFreeDraftValue, setSttPreviewWithExpiry]);

  const queueComposerInput = useCallback(() => {
    const composedMessage = buildMessageWithPendingImages(input, pendingImages);
    if (!composedMessage.trim()) return;

    messageQueue.enqueue(currentConversationId, composedMessage, currentConversationId);
    setInput('');
    setSttPreviewWithExpiry('');
    setPendingImages([]);
    setDebugInfo('Message queued. Use Send Next when you are ready.');
  }, [currentConversationId, input, messageQueue, pendingImages, setSttPreviewWithExpiry]);

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

  const rawHandsFreeVoicePreview = normalizeVoiceText(sttPreview || liveTranscript);
  const acceptedControlPreview = acceptedHandsFreeControlPreviewRef.current;
  const acceptedControlPreviewMatches = !!acceptedControlPreview
    && acceptedControlPreview.text === rawHandsFreeVoicePreview
    && handsFreeCountdownNow - acceptedControlPreview.timestamp <= HANDS_FREE_ACCEPTED_CONTROL_PREVIEW_SUPPRESSION_MS;
  const visibleHandsFreeLivePreview = acceptedControlPreviewMatches ? '' : rawHandsFreeVoicePreview;
  const handsFreeVoicePreview = handsFree
    ? (handsFreeAutoSend
        ? visibleHandsFreeLivePreview
        : mergeVoiceText(pendingHandsFreeDraft, visibleHandsFreeLivePreview))
    : '';
  const hasPendingHandsFreeDraft = handsFree
    && !handsFreeAutoSend
    && pendingHandsFreeDraft.trim().length > 0;

  useEffect(() => {
    if (
      !rawHandsFreeVoicePreview
      || !acceptedControlPreview
      || acceptedControlPreview.text !== rawHandsFreeVoicePreview
      || handsFreeCountdownNow - acceptedControlPreview.timestamp > HANDS_FREE_ACCEPTED_CONTROL_PREVIEW_SUPPRESSION_MS
    ) {
      acceptedHandsFreeControlPreviewRef.current = null;
    }
  }, [acceptedControlPreview, handsFreeCountdownNow, rawHandsFreeVoicePreview]);

  const handsFreeSendDeadline = useMemo(() => {
    const deadlines = [handsFreeDebounceEndsAt, androidHandsFreeDebounceEndsAt]
      .filter((value): value is number => typeof value === 'number' && value > Date.now());
    return deadlines.length > 0 ? Math.max(...deadlines) : null;
  }, [androidHandsFreeDebounceEndsAt, handsFreeCountdownNow, handsFreeDebounceEndsAt]);
  const handsFreeCountdownSeconds = handsFreeSendDeadline
    ? Math.max(0, Math.ceil((handsFreeSendDeadline - handsFreeCountdownNow) / 1000))
    : 0;
  const hasPendingHandsFreeSend = handsFree
    && handsFreeAutoSend
    && !!handsFreeVoicePreview
    && handsFreeCountdownSeconds > 0;

  useEffect(() => {
    if (!handsFreeSendDeadline) return;
    setHandsFreeCountdownNow(Date.now());
    const interval = setInterval(() => setHandsFreeCountdownNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [handsFreeSendDeadline]);

		const wakeHandsFreeByUser = useCallback(() => {
			handsFreeController.wakeByUser();
			if (!androidServiceHandlesHandsFreeMic && !listening) {
				void startRecording();
			}
			setDebugInfo('Handsfree awake. Listening for your request.');
		}, [androidServiceHandlesHandsFreeMic, handsFreeController.wakeByUser, listening, startRecording]);

		const resumeHandsFreeByUser = useCallback(() => {
			handsFreeController.resumeByUser();
			if (!androidServiceHandlesHandsFreeMic && !listening) {
				void startRecording();
			}
			setDebugInfo('Handsfree resumed.');
		}, [androidServiceHandlesHandsFreeMic, handsFreeController.resumeByUser, listening, startRecording]);

		const pauseHandsFreeByUser = useCallback(() => {
			clearAndroidHandsFreePartialTimer();
			androidHandsFreePendingPartialRef.current = '';
			setSttPreviewWithExpiry('');
			handsFreeController.pauseByUser();
			if (!androidServiceHandlesHandsFreeMic) {
				void stopRecognitionOnly();
			}
			setDebugInfo('Handsfree paused.');
		}, [androidServiceHandlesHandsFreeMic, clearAndroidHandsFreePartialTimer, handsFreeController.pauseByUser, setSttPreviewWithExpiry, stopRecognitionOnly]);

		const handleHandsFreePrimaryControl = useCallback(() => {
			if (hasPendingHandsFreeSend) {
				pauseHandsFreeByUser();
				return;
			}
			if (handsFreeController.state.phase === 'sleeping') {
				wakeHandsFreeByUser();
				return;
			}
			if (handsFreeController.state.phase === 'paused') {
				resumeHandsFreeByUser();
				return;
			}
			pauseHandsFreeByUser();
		}, [handsFreeController.state.phase, hasPendingHandsFreeSend, pauseHandsFreeByUser, resumeHandsFreeByUser, wakeHandsFreeByUser]);

  const handleComposerPrimaryAction = useCallback(() => {
    if (hasPendingHandsFreeSend) {
      pauseHandsFreeByUser();
      return;
    }
    if (!composerHasContent && hasPendingHandsFreeDraft) {
      sendPendingHandsFreeDraft();
      return;
    }
    sendComposerInput();
  }, [composerHasContent, hasPendingHandsFreeDraft, hasPendingHandsFreeSend, pauseHandsFreeByUser, sendComposerInput, sendPendingHandsFreeDraft]);

  // Keep the guide aligned with the deliberately small spoken-command surface.
  const voiceCommandReference = useMemo(
    () => [
      { key: 'wake', label: 'Wake from sleep', phrase: handsFreeWakePhrase, editable: 'wake' as const },
      ...DEFAULT_VOICE_COMMANDS.map((command) => ({
        key: command.id,
        label: command.label,
        phrase: command.aliases[0] ?? command.label.toLowerCase(),
      })),
      ...(!handsFreeAutoSend ? [{ key: 'manual-send', label: 'Send voice draft', phrase: handsFreeSendPhrase }] : []),
      ...(!handsFreeAutoSend ? [{
        key: 'manual-clear',
        label: 'Clear voice draft',
        phrase: DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE,
      }] : []),
      { key: 'switch-direct', label: 'Switch directly', phrase: 'switch to <agent>' },
      { key: 'sleep', label: 'Go to sleep', phrase: handsFreeSleepPhrase, editable: 'sleep' as const },
    ],
    [handsFreeAutoSend, handsFreeSendPhrase, handsFreeSleepPhrase, handsFreeWakePhrase],
  );

  const commitEditableVoicePhrase = useCallback((kind: 'wake' | 'sleep') => {
    const value = kind === 'wake'
      ? handsFreeWakePhraseDraft.trim() || DEFAULT_HANDS_FREE_WAKE_PHRASE
      : handsFreeSleepPhraseDraft.trim() || DEFAULT_HANDS_FREE_SLEEP_PHRASE;

    if (kind === 'wake') setHandsFreeWakePhraseDraft(value);
    else setHandsFreeSleepPhraseDraft(value);

    setConfig((previous) => {
      const next = {
        ...previous,
        ...(kind === 'wake'
          ? { handsFreeWakePhrase: value }
          : { handsFreeSleepPhrase: value }),
      };
      void saveConfig(next).catch((error) => {
        console.warn('[ChatScreen] Failed to save hands-free phrase:', error);
      });
      return next;
    });
  }, [handsFreeSleepPhraseDraft, handsFreeWakePhraseDraft, setConfig]);

	const composerPlaceholder = handsFree
		? (handsFreeController.state.phase === 'paused'
			? 'Handsfree paused — tap mic to resume or type a message'
			: 'Tap mic to wake handsfree or type a message')
		: (listening ? 'Listening…' : 'Type or hold mic');

  const micControlVisual = createMicControlVisual({
    handsFree,
    displayPhase: handsFreeDisplayPhase,
    effectiveMicListening,
    handsFreeAutoSend,
    handsFreeSendPhrase,
    hasPendingHandsFreeSend,
    hasPendingHandsFreeDraft,
    handsFreeCountdownSeconds,
    willCancel,
    wakePhrase: handsFreeWakePhrase,
    lastError: handsFreeController.state.lastError,
  });
  const micControlActive = micControlVisual.tone === 'active';
  const micControlDanger = micControlVisual.tone === 'danger';
  const micControlForeground = micControlActive
    ? theme.colors.primaryForeground
    : micControlDanger
      ? theme.colors.danger
      : theme.colors.mutedForeground;
  const isMessageQueuePaused = handsFree && handsFreeController.state.phase === 'paused';

  const firstVisibleMessageIndex = Math.max(0, messages.length - visibleMessageCount);
  const visibleMessages = messages.slice(firstVisibleMessageIndex);
  const canLoadOlderMessages = firstVisibleMessageIndex > 0;
  const chatScrollBottomPadding = Platform.OS === 'android'
    ? composerHeight + androidKeyboardHeight + spacing.sm
    : insets.bottom;
  const scrollToBottomButtonBottom = Platform.OS === 'android'
    ? androidKeyboardHeight + composerHeight + spacing.md
    : 80 + insets.bottom;



  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: chatScrollBottomPadding, gap: spacing.xs }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onContentSizeChange={handleContentSizeChange}
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
	              {promptQuickStarts.length > 0 ? (
	                <View style={styles.chatHomeShortcutGrid}>
	                  {promptQuickStarts.map((item) => (
	                    <Pressable
	                      key={item.id}
	                      style={({ pressed }) => [
	                        styles.chatHomeShortcutCard,
		                        item.action === 'add-prompt' && styles.chatHomeShortcutCardAdd,
		                        item.source === 'task' && runningPromptTaskId === item.task?.id && styles.chatHomeShortcutCardDisabled,
	                        pressed && styles.chatHomeShortcutCardPressed,
	                      ]}
		                      onPress={() => handleQuickStartPress(item)}
		                      disabled={item.source === 'task' && runningPromptTaskId === item.task?.id}
	                      accessibilityRole="button"
		                      accessibilityLabel={createButtonAccessibilityLabel(item.action === 'add-prompt' ? 'Add new prompt' : item.source === 'task' ? `Run task ${item.title}` : `Insert ${item.source} ${item.title}`)}
		                      accessibilityHint={item.action === 'add-prompt' ? 'Create a predefined prompt and save it to desktop.' : item.source === 'task' ? 'Runs this desktop task now.' : 'Inserts this desktop library item into the composer.'}
	                    >
		                      <Text style={[
		                        styles.chatHomeShortcutTitle,
		                        item.action === 'add-prompt' && styles.chatHomeShortcutTitleAdd,
		                      ]} numberOfLines={2}>{item.title}</Text>
		                      {item.description ? (
		                        <Text style={styles.chatHomeShortcutDescription} numberOfLines={2}>{item.description}</Text>
		                      ) : null}
		                      {item.prompt ? (
		                        <View style={styles.chatHomeShortcutActions}>
		                          <TouchableOpacity
		                            style={styles.chatHomeShortcutActionButton}
		                            onPress={(event) => {
		                              event.stopPropagation();
		                              if (item.prompt) openEditPromptModal(item.prompt);
		                            }}
		                            accessibilityRole="button"
		                            accessibilityLabel={createButtonAccessibilityLabel(`Edit prompt ${item.title}`)}
		                          >
		                            <Text style={styles.chatHomeShortcutActionButtonText}>Edit</Text>
		                          </TouchableOpacity>
		                          <TouchableOpacity
		                            style={[
		                              styles.chatHomeShortcutActionButton,
		                              styles.chatHomeShortcutActionButtonDanger,
		                            ]}
		                            onPress={(event) => {
		                              event.stopPropagation();
		                              if (item.prompt) handleDeletePrompt(item.prompt);
		                            }}
		                            accessibilityRole="button"
		                            accessibilityLabel={createButtonAccessibilityLabel(`Delete prompt ${item.title}`)}
		                          >
		                            <Text style={[
		                              styles.chatHomeShortcutActionButtonText,
		                              styles.chatHomeShortcutActionButtonDangerText,
		                            ]}>Delete</Text>
		                          </TouchableOpacity>
		                        </View>
		                      ) : null}
	                    </Pressable>
	                  ))}
	                </View>
	              ) : (
	                <Text style={styles.chatHomeEmptyText}>
		                  {isLoadingQuickStartPrompts ? 'Loading desktop library…' : 'No prompts, skills, or tasks available from your connected desktop app.'}
	                </Text>
	              )}
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
            // Live progress is promoted into the focused workbench below. Keep
            // the durable conversation history in this list so it remains
            // expandable without duplicating the in-flight blocks.
            if (
              shouldRenderLiveProgressFocus &&
              (m.id?.startsWith('live-progress-thinking-') || m.id?.startsWith('live-progress-tools-'))
            ) {
              return null;
            }
            // --- Tool-activity group handling ---
            const group = toolActivityGroups.groupByIndex.get(i);
            if (group) {
              const groupKey = getToolActivityGroupKey(group);
              const isGroupExpanded = expandedGroups[groupKey] ?? expandedMessages[group.startIndex] ?? false;

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
                    <View style={styles.toolActivityGroupHeaderRow}>
                      <Text style={styles.toolActivityGroupHeader}>
                        ▶ {group.count} tool {group.count === 1 ? 'activity' : 'activities'}
                      </Text>
                      {group.previewLines.length > 0 && (
                        <Text
                          style={styles.toolActivityGroupPreviewLine}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {group.previewLines.join(', ')}
                        </Text>
                      )}
                    </View>
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
            const canBranchFromMessage =
              !!currentSession?.serverConversationId &&
              (m.role === 'user' || m.role === 'assistant') &&
              m.variant !== 'approval';
            const canCopyMessage =
              (m.role === 'user' || m.role === 'assistant') &&
              visibleMessageContent.trim().length > 0 &&
              (shouldShowExpandedContent || shouldShowCollapsedTextPreview);
            const turnDuration = m.role === 'user' && typeof m.timestamp === 'number'
              ? turnDurations.byUserTimestamp.get(m.timestamp)
              : undefined;
            const turnDurationText = turnDuration
              ? formatTurnDuration(turnDuration.durationMs)
              : null;
            const turnDurationAccessibilityLabel = turnDurationText
              ? `Agent time ${turnDurationText}${turnDuration?.isLive ? ' live' : ''}`
              : null;
            const turnDurationBadge = turnDurationText ? (
              <View
                style={[
                  styles.turnDurationBadge,
                  turnDuration?.isLive && styles.turnDurationBadgeLive,
                ]}
                accessibilityRole="text"
                accessibilityLabel={turnDurationAccessibilityLabel || undefined}
              >
                <Ionicons
                  name="time-outline"
                  size={11}
                  color={turnDuration?.isLive ? theme.colors.primary : theme.colors.mutedForeground}
                />
                <Text style={[
                  styles.turnDurationBadgeText,
                  turnDuration?.isLive && { color: theme.colors.primary },
                ]}>
                  {turnDurationText}
                </Text>
              </View>
            ) : null;
            const shouldShowMessageActions = canCopyMessage || canBranchFromMessage;
            const shouldShowInlineMessageActions =
              (shouldShowMessageActions || !!turnDurationText) &&
              (shouldShowExpandedContent || shouldShowCollapsedTextPreview);
            const messageActionControls = shouldShowMessageActions ? (
              <>
                {canCopyMessage && (
                  <Pressable
                    hitSlop={8}
                    style={[
                      styles.messageActionButton,
                      copiedMessageIndex === i && styles.messageActionButtonActive,
                    ]}
                    onPress={() => { void handleCopyMessage(i, visibleMessageContent); }}
                    accessibilityRole="button"
                    accessibilityLabel={copiedMessageIndex === i ? `Copied ${m.role} message ${i + 1}` : `Copy ${m.role} message ${i + 1}`}
                  >
                    <Ionicons
                      name={copiedMessageIndex === i ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={copiedMessageIndex === i ? theme.colors.success : theme.colors.primary}
                    />
                  </Pressable>
                )}
                {canBranchFromMessage && (
                  <Pressable
                    hitSlop={8}
                    style={[
                      styles.messageActionButton,
                      branchingMessageIndex !== null && styles.messageActionButtonDisabled,
                    ]}
                    onPress={() => { void handleBranchFromMessage(i); }}
                    disabled={branchingMessageIndex !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Branch conversation from ${m.role} message ${i + 1}`}
                    accessibilityState={{ disabled: branchingMessageIndex !== null }}
                  >
                    {branchingMessageIndex === i ? (
                      <ActivityIndicator size="small" color={theme.colors.mutedForeground} />
                    ) : (
                      <Ionicons name="git-branch-outline" size={13} color={theme.colors.primary} />
                    )}
                  </Pressable>
                )}
              </>
            ) : null;

            const toolCalls = m.toolCalls ?? [];
            const toolResults = m.toolResults ?? [];
            // Filter out meta-tools from display (respond_to_user, mark_work_complete)
            // since their content is already shown as visible message text
            const displayToolEntries = (m.toolExecutions?.length
              ? m.toolExecutions.map((execution, origIdx) => ({
                  toolCall: execution.toolCall,
                  label: undefined as string | undefined,
                  origIdx,
                  result: execution.result,
                  executionStats: execution.executionStats,
                }))
              : toolCalls.map((toolCall, origIdx) => ({
                  toolCall,
                  label: undefined as string | undefined,
                  origIdx,
                  result: toolResults[origIdx],
                  executionStats: m.toolExecutionStats?.[origIdx],
                })))
              .filter((entry) => !HIDDEN_META_TOOLS.has(entry.toolCall.name));
            const fallbackToolEntries =
              displayToolEntries.length === 0 && toolResults.length > 0
                ? toolResults.map((result, idx) => ({
                    toolCall: {
                      name: 'tool_call',
                      arguments: {},
                    },
                    label: 'Tool result',
                    origIdx: idx,
                    result,
                    executionStats: m.toolExecutionStats?.[idx],
                  }))
                : [];
            const renderedToolEntries = fallbackToolEntries.length > 0
              ? fallbackToolEntries
              : displayToolEntries;
            const displayToolCallCount = renderedToolEntries.length;
            const hasToolResults = renderedToolEntries.some(entry => !!entry.result);
            const allSuccess =
              hasToolResults && renderedToolEntries.every(entry => entry.result?.success === true);
            const hasErrors = renderedToolEntries.some(entry => entry.result?.success === false);
            // isPending is true when any displayed tool call has not received its result yet.
            const isPending =
              renderedToolEntries.some(entry => !entry.result);

            // Skip empty messages: no visible content AND no tool calls to display
            // Also skip messages that only have toolResults but no toolCalls (raw result blobs)
            if (visibleMessageContent.trim().length === 0 && displayToolCallCount === 0) {
              return null;
            }

            // Determine if this message needs group expand/collapse chrome
            const groupKey = group ? getToolActivityGroupKey(group) : '';
            const isExpandedGroup = group ? (expandedGroups[groupKey] ?? expandedMessages[group.startIndex] ?? false) : false;
            const isFirstInExpandedGroup = group && i === group.startIndex && isExpandedGroup;
            const isLastInExpandedGroup = group && i === group.endIndex && isExpandedGroup;

            return (
              <View key={m.id ?? i}>
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

                {m.variant === 'approval' && m.toolApproval ? (
                  <View style={styles.toolApprovalCard}>
                    <Text style={styles.toolApprovalTitle}>Tool Approval Required</Text>
                    <Text style={styles.toolApprovalTool} numberOfLines={2}>
                      {m.toolApproval.toolName}
                    </Text>
                    <Text style={styles.toolApprovalArguments} numberOfLines={4}>
                      {formatToolArguments(m.toolApproval.arguments)}
                    </Text>
                    <View style={styles.toolApprovalActions}>
                      <TouchableOpacity
                        style={[
                          styles.toolApprovalButton,
                          styles.toolApprovalDenyButton,
                          pendingToolApprovalResponseId === m.toolApproval.approvalId && styles.toolApprovalButtonDisabled,
                        ]}
                        onPress={() => respondToToolApproval(m.toolApproval!.approvalId, false)}
                        disabled={pendingToolApprovalResponseId === m.toolApproval.approvalId}
                        accessibilityRole="button"
                        accessibilityLabel={`Deny tool call ${m.toolApproval.toolName}`}
                      >
                        <Text style={styles.toolApprovalDenyButtonText}>Deny</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.toolApprovalButton,
                          styles.toolApprovalApproveButton,
                          pendingToolApprovalResponseId === m.toolApproval.approvalId && styles.toolApprovalButtonDisabled,
                        ]}
                        onPress={() => respondToToolApproval(m.toolApproval!.approvalId, true)}
                        disabled={pendingToolApprovalResponseId === m.toolApproval.approvalId}
                        accessibilityRole="button"
                        accessibilityLabel={`Approve tool call ${m.toolApproval.toolName}`}
                      >
                        <Text style={styles.toolApprovalApproveButtonText}>
                          {pendingToolApprovalResponseId === m.toolApproval.approvalId ? 'Responding...' : 'Approve'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : m.role === 'assistant' && (!m.content || m.content.length === 0) && !m.toolCalls && !m.toolResults ? (
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
                      <View style={styles.messageContentRow}>
                        <View style={styles.messageContentBody}>
                          <MarkdownRenderer
                            content={visibleMessageContent}
                            assetBaseUrl={config.baseUrl}
                            assetAuthToken={config.apiKey}
                          />
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
                        {shouldShowInlineMessageActions && (
                          <View style={styles.messageInlineActions}>
                            {turnDurationBadge}
                            {messageActionControls}
                          </View>
                        )}
                      </View>
                    ) : shouldShowCollapsedTextPreview ? (
                      <View style={styles.messageContentRow}>
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
                        {shouldShowInlineMessageActions && (
                          <View style={styles.messageInlineActions}>
                            {turnDurationBadge}
                            {messageActionControls}
                          </View>
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
                            {renderedToolEntries.map(({ toolCall, label, origIdx, result: tcResult }, tcIdx) => {
                              const tcPending = !tcResult;
                              const tcSuccess = tcResult?.success === true;
                              const tcError = tcResult?.success === false;
                              const activityLabel = label
                                ? { title: label }
                                : getToolActivityLabel(
                                    { name: toolCall.name, arguments: toolCall.arguments ?? {} },
                                    tcResult ?? null,
                                  );
                              const primaryActivityText = activityLabel.detail || activityLabel.title;
                              const secondaryActivityText = activityLabel.detail && activityLabel.detail !== activityLabel.title
                                && !/\bcompleted$/i.test(activityLabel.title)
                                ? activityLabel.title
                                : undefined;
                              const toolPreview = secondaryActivityText
                                ? `${primaryActivityText} - ${secondaryActivityText}`
                                : primaryActivityText;
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
                                    ellipsizeMode="tail"
                                  >
                                    {toolPreview}
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
                            {renderedToolEntries.map(({ toolCall, label, origIdx, result, executionStats }, idx) => {
                              const isResultPending = !result;
                              const executionStatsLabel = formatToolExecutionStatsLabel(executionStats);
                              // Use message id or fallback to array index to ensure stable, unique keys
                              // that won't collide when m.id is undefined (which is common)
                              const stableMessageKey = m.id ?? String(i);
                              const toolCallKey = `${stableMessageKey}-${origIdx}`;
                              const isToolCallFullyExpanded = expandedToolCalls[toolCallKey] ?? false;
                              const toolNameLabel = label ?? toolCall.name;
                              const toolInputPayload = toolCall.arguments ? formatToolArguments(toolCall.arguments) : '';
                              const hasToolInput = hasToolInspectorContent(toolCall.arguments);
                              const toolResultContent = result?.content || 'No content returned';
                              return (
                                <View key={idx} style={styles.toolCallSection}>
                                  {/* Tool name heading - tappable to toggle full expansion */}
                                  <Pressable
                                    onPress={() => toggleToolCallExpansion(stableMessageKey, origIdx)}
                                    style={({ pressed }) => [
                                      styles.toolCallHeader,
                                      pressed && styles.toolCallHeaderPressed,
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel={createExpandCollapseAccessibilityLabel(`${toolNameLabel} tool details`, isToolCallFullyExpanded)}
                                    accessibilityState={{ expanded: isToolCallFullyExpanded }}
                                    aria-expanded={isToolCallFullyExpanded}
                                    accessibilityHint={isToolCallFullyExpanded ? 'Collapse tool details' : 'Expand to show full input/output'}
                                  >
                                    <View style={styles.toolCallTitleRow}>
                                      <Ionicons
                                        name="terminal-outline"
                                        size={14}
                                        color={theme.colors.primary}
                                      />
                                      <Text style={styles.toolName}>{toolNameLabel}</Text>
                                    </View>
                                    <View style={styles.toolCallExpandControl}>
                                      <Text style={styles.toolCallExpandHint}>
                                        {isToolCallFullyExpanded ? 'Hide details' : 'Show details'}
                                      </Text>
                                      <Ionicons
                                        name={isToolCallFullyExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={13}
                                        color={theme.colors.mutedForeground}
                                      />
                                    </View>
                                  </Pressable>

                                  {/* Parameters */}
                                  {hasToolInput && toolInputPayload && (
                                    <View style={styles.toolParamsSection}>
                                      <View style={styles.toolSectionHeaderRow}>
                                        <View style={styles.toolSectionTitleRow}>
                                          <Ionicons name="arrow-forward-outline" size={12} color={theme.colors.primary} />
                                          <Text style={styles.toolSectionLabel}>Input</Text>
                                        </View>
                                        <Pressable
                                          style={({ pressed }) => [
                                            styles.toolDetailCopyButton,
                                            pressed && styles.toolDetailCopyButtonPressed,
                                          ]}
                                          onPress={() => { void handleCopyToolPayload(toolInputPayload); }}
                                          accessibilityRole="button"
                                          accessibilityLabel={getToolPayloadCopyAccessibilityLabel('input', toolNameLabel)}
                                        >
                                          <Ionicons name="copy-outline" size={10} color={theme.colors.mutedForeground} />
                                          <Text style={styles.toolDetailCopyButtonText}>Copy</Text>
                                        </Pressable>
                                      </View>
                                      <ScrollView
                                        style={isToolCallFullyExpanded ? styles.toolParamsScrollExpanded : styles.toolParamsScroll}
                                        nestedScrollEnabled
                                      >
                                        <ToolInspectorPayload
                                          value={toolCall.arguments}
                                          fallbackText={toolInputPayload}
                                          styles={styles}
                                        />
                                      </ScrollView>
                                    </View>
                                  )}

                                  {executionStatsLabel && (
                                    <Text
                                      style={styles.toolExecutionStatsText}
                                      accessibilityRole="text"
                                      accessibilityLabel={`Tool execution stats: ${executionStatsLabel}`}
                                    >
                                      {executionStatsLabel}
                                    </Text>
                                  )}

                                  {/* Result for this specific tool call */}
                                  {result ? (
                                    <View style={styles.toolResultItem}>
                                      <View style={styles.toolResultHeader}>
                                        <View style={styles.toolSectionTitleRow}>
                                          <Ionicons name="arrow-back-outline" size={12} color={result.success ? theme.colors.success : theme.colors.destructive} />
                                          <Text style={styles.toolSectionLabel}>Output</Text>
                                        </View>
                                        <Text style={[
                                          styles.toolResultBadge,
                                          result.success ? styles.toolResultBadgeSuccess : styles.toolResultBadgeError
                                        ]}>
                                          {result.success ? '✅ OK' : '❌ Error'}
                                        </Text>
                                        <Text style={styles.toolResultCharCount}>
                                          {(result.content?.length || 0).toLocaleString()} chars
                                        </Text>
                                        <Pressable
                                          style={({ pressed }) => [
                                            styles.toolDetailCopyButton,
                                            pressed && styles.toolDetailCopyButtonPressed,
                                          ]}
                                          onPress={() => { void handleCopyToolPayload(toolResultContent); }}
                                          accessibilityRole="button"
                                          accessibilityLabel={getToolPayloadCopyAccessibilityLabel('output', toolNameLabel)}
                                        >
                                          <Ionicons name="copy-outline" size={10} color={theme.colors.mutedForeground} />
                                          <Text style={styles.toolDetailCopyButtonText}>Copy</Text>
                                        </Pressable>
                                      </View>
                                      <ScrollView
                                        style={isToolCallFullyExpanded ? styles.toolResultScrollExpanded : styles.toolResultScroll}
                                        nestedScrollEnabled
                                      >
                                        <ToolInspectorPayload
                                          value={toolResultContent}
                                          fallbackText={toolResultContent}
                                          styles={styles}
                                          hiddenKeys={TOOL_OUTPUT_METADATA_KEYS}
                                        />
                                      </ScrollView>
                                      {result.error && (
                                        <View style={styles.toolResultErrorSection}>
                                          <View style={styles.toolSectionHeaderRow}>
                                            <Text style={styles.toolResultErrorLabel}>Error:</Text>
                                            <Pressable
                                              style={({ pressed }) => [
                                                styles.toolDetailCopyButton,
                                                pressed && styles.toolDetailCopyButtonPressed,
                                              ]}
                                              onPress={() => { void handleCopyToolPayload(result.error || ''); }}
                                              accessibilityRole="button"
                                              accessibilityLabel={getToolPayloadCopyAccessibilityLabel('error', toolNameLabel)}
                                            >
                                              <Ionicons name="copy-outline" size={10} color={theme.colors.mutedForeground} />
                                              <Text style={styles.toolDetailCopyButtonText}>Copy</Text>
                                            </Pressable>
                                          </View>
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
                    {!shouldShowInlineMessageActions && (shouldShowMessageActions || !!turnDurationText) && (
                      <View style={styles.messageActionsRow}>
                        {turnDurationBadge}
                        {messageActionControls}
                      </View>
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
          {shouldRenderLiveProgressFocus && (
            <View
              style={styles.liveProgressFocusCard}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Latest agent activity"
              accessibilityState={{ busy: true }}
            >
              <View style={styles.liveProgressFocusHeader}>
                <View style={styles.liveProgressFocusTitleRow}>
                  <View style={styles.liveProgressPulse} />
                  <Text style={styles.liveProgressFocusEyebrow}>LIVE WORK</Text>
                </View>
                <Text style={styles.liveProgressFocusHint}>Latest activity stays open</Text>
              </View>

              {liveProgressFocus.thinking && (
                <View key={`live-thinking-${liveProgressFocus.thinking.id}`} style={styles.liveProgressThinkingSection}>
                  <View style={styles.liveProgressSectionLabelRow}>
                    <Ionicons name="bulb-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.liveProgressSectionLabel}>Thinking</Text>
                  </View>
                  <View style={styles.liveProgressThinkingContent}>
                    <MarkdownRenderer
                      content={liveProgressFocus.thinking.content}
                      assetBaseUrl={config.baseUrl}
                      assetAuthToken={config.apiKey}
                    />
                  </View>
                </View>
              )}

              {liveProgressFocus.tool && (
                <View key={`live-tool-${liveProgressFocus.tool.id}`} style={styles.liveProgressToolSection}>
                  <View style={styles.liveProgressSectionLabelRow}>
                    <Ionicons name="terminal-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.liveProgressSectionLabel}>Latest tool call</Text>
                    <Text
                      style={[
                        styles.liveProgressToolStatus,
                        liveProgressFocus.tool.toolResult?.success === false && styles.liveProgressToolStatusError,
                        liveProgressFocus.tool.toolResult?.success === true && styles.liveProgressToolStatusSuccess,
                      ]}
                    >
                      {liveProgressFocus.tool.toolResult
                        ? liveProgressFocus.tool.toolResult.success ? '✓ complete' : '✕ error'
                        : '⏳ running'}
                    </Text>
                  </View>
                  <Text style={styles.liveProgressToolName} numberOfLines={1} ellipsizeMode="tail">
                    {liveProgressFocus.tool.title}
                  </Text>
                  {liveProgressFocus.tool.description && !liveProgressFocus.tool.toolCall && (
                    <Text style={styles.liveProgressToolDescription} numberOfLines={2}>
                      {liveProgressFocus.tool.description}
                    </Text>
                  )}
                  {liveProgressFocus.tool.toolCall && (
                    <View style={styles.liveProgressPayloadBlock}>
                      <Text style={styles.liveProgressPayloadLabel}>Input</Text>
                      <ScrollView style={styles.liveProgressPayloadScroll} nestedScrollEnabled>
                        <ToolInspectorPayload
                          value={liveProgressFocus.tool.toolCall.arguments}
                          fallbackText={formatToolArguments(liveProgressFocus.tool.toolCall.arguments)}
                          styles={styles}
                        />
                      </ScrollView>
                    </View>
                  )}
                  {liveProgressFocus.tool.toolResult && (
                    <View style={styles.liveProgressPayloadBlock}>
                      <Text style={styles.liveProgressPayloadLabel}>Output</Text>
                      <ScrollView style={styles.liveProgressPayloadScroll} nestedScrollEnabled>
                        <ToolInspectorPayload
                          value={liveProgressFocus.tool.toolResult.content}
                          fallbackText={liveProgressFocus.tool.toolResult.content || 'No content returned'}
                          styles={styles}
                          hiddenKeys={TOOL_OUTPUT_METADATA_KEYS}
                        />
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          {!messageQueuePanelVisible && pendingQueuedMessages.map((queuedMessage) => (
            <View
              key={`queued-inline-${queuedMessage.id}`}
              style={[
                styles.msg,
                styles.user,
                styles.queuedInlineMessage,
              ]}
            >
              <View style={styles.queuedInlineHeader}>
                <Ionicons name="time-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.queuedInlineHeaderText}>
                  Follow-up queued
                </Text>
              </View>
              <MarkdownRenderer
                content={queuedMessage.text}
                assetBaseUrl={config.baseUrl}
                assetAuthToken={config.apiKey}
              />
            </View>
          ))}
          {connectionState && connectionState.status === 'reconnecting' && (
            <View style={styles.connectionBanner}>
              <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: spacing.sm }} />
              <Text style={styles.connectionBannerText}>
                {formatConnectionStatus(connectionState)}
              </Text>
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
        {/* Scroll to bottom button - appears when user scrolls up */}
        {!shouldAutoScroll && (
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { bottom: scrollToBottomButtonBottom }]}
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
        {/* Message Queue Panel */}
        {messageQueuePanelVisible && (
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
              isPaused={isMessageQueuePaused}
              onPause={pauseHandsFreeByUser}
              onResume={resumeHandsFreeByUser}
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
                                displayContent: (msg as ChatMessage).displayContent,
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
        {isFocused && (
        <View
          onLayout={handleComposerLayout}
          style={[
            styles.inputArea,
            Platform.OS === 'android' && styles.inputAreaAndroidDocked,
            Platform.OS === 'android' && { bottom: androidKeyboardHeight },
            { paddingBottom: Platform.OS === 'ios' ? 12 + insets.bottom : spacing.sm },
          ]}
        >
	          {!!handsFreeVoicePreview && (
	            <View
	              style={styles.voicePreviewCard}
	              accessibilityRole="text"
	              accessibilityLabel={`Voice preview: ${handsFreeVoicePreview}`}
	              accessibilityLiveRegion="polite"
	            >
	              <View style={styles.voicePreviewHeader}>
	                <View style={styles.voicePreviewTitleRow}>
	                  <Ionicons name="mic-outline" size={14} color={theme.colors.primary} />
	                  <Text style={styles.voicePreviewTitle}>Voice preview</Text>
	                </View>
	                {hasPendingHandsFreeSend && (
	                  <Text style={styles.voicePreviewCountdown}>Sending in {handsFreeCountdownSeconds}s</Text>
	                )}
	                {hasPendingHandsFreeDraft && (
	                  <Text style={styles.voicePreviewCountdown}>
                      Say “{handsFreeSendPhrase}” to send · “{DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE}” to clear
                    </Text>
	                )}
	              </View>
	              <Text style={styles.voicePreviewText} numberOfLines={3}>
	                {handsFreeVoicePreview}
	              </Text>
	            </View>
	          )}
	          {mentra.pendingPhoto && (
	            <View style={styles.voicePreviewCard} accessibilityRole="text" accessibilityLabel="Mentra photo ready for voice prompt">
	              <View style={styles.voicePreviewHeader}>
	                <View style={styles.voicePreviewTitleRow}>
	                  <Ionicons name="glasses-outline" size={14} color={theme.colors.primary} />
	                  <Text style={styles.voicePreviewTitle}>Mentra photo ready</Text>
	                </View>
	                <TouchableOpacity onPress={mentra.clearPendingPhoto} accessibilityRole="button" accessibilityLabel="Discard Mentra photo">
	                  <Text style={styles.pendingImageRemoveButtonText}>✕</Text>
	                </TouchableOpacity>
	              </View>
	              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
	                <Image source={{ uri: mentra.pendingPhoto.previewUri }} style={styles.pendingImagePreview} />
	                <Text style={[styles.voicePreviewText, { flex: 1 }]}>Ask your next question through the glasses to send this image.</Text>
	              </View>
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
	              <Ionicons
                  name="image-outline"
                  size={18}
                  color={pendingImages.length > 0 ? theme.colors.primary : theme.colors.mutedForeground}
                />
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
	                <Ionicons
                    name="create-outline"
                    size={18}
                    color={willCancel ? theme.colors.primary : theme.colors.mutedForeground}
                  />
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
            <TouchableOpacity
	              style={[
                  styles.sendButton,
                  !composerHasContent && !hasPendingHandsFreeSend && !hasPendingHandsFreeDraft && styles.sendButtonDisabled,
                ]}
	              onPress={handleComposerPrimaryAction}
	              activeOpacity={0.7}
	              disabled={!composerHasContent && !hasPendingHandsFreeSend && !hasPendingHandsFreeDraft}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(
                hasPendingHandsFreeSend
                  ? `Handsfree sending in ${handsFreeCountdownSeconds} seconds`
                  : !composerHasContent && hasPendingHandsFreeDraft
                    ? 'Send hands-free voice draft'
                  : 'Send message',
              )}
	              accessibilityHint={hasPendingHandsFreeSend
                  ? 'Pauses hands-free and cancels the pending automatic send.'
                  : !composerHasContent && hasPendingHandsFreeDraft
                    ? `Sends the pending voice draft. You can also say ${handsFreeSendPhrase}.`
                  : 'Sends your typed text and any attached images to the selected agent.'}
              accessibilityState={{
                disabled: !composerHasContent && !hasPendingHandsFreeSend && !hasPendingHandsFreeDraft,
              }}
	            >
              {hasPendingHandsFreeSend ? (
                <Text style={styles.sendButtonCountdownText}>{handsFreeCountdownSeconds}s</Text>
              ) : (
                <Ionicons name="send-outline" size={18} color={theme.colors.primaryForeground} />
              )}
            </TouchableOpacity>
          </View>
          {/* The idle mic affordance becomes a compact work-status rail while an agent runs. */}
          <View
            ref={micButtonRef}
            style={[styles.micWrapper, isAgentRunningInHeader && styles.micWrapperProcessing]}
          >
            <Pressable
              style={[
                styles.mic,
                isAgentRunningInHeader && styles.micProcessing,
                micControlActive && styles.micOn,
                micControlDanger && styles.micDanger,
                // @ts-ignore - Web-only CSS to disable long-press selection/callouts
                Platform.OS === 'web' && { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'manipulation' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={micControlVisual.accessibilityLabel}
              accessibilityHint={micControlVisual.accessibilityHint}
              accessibilityState={{ busy: micControlVisual.busy }}
              aria-busy={micControlVisual.busy}
              onLongPress={undefined}
              // Keep push-to-talk's responder through small finger movement or
              // competing scroll gestures; an interrupted responder otherwise
              // looks like an immediate release on Android.
              onStartShouldSetResponder={() => !handsFree}
              onMoveShouldSetResponder={() => !handsFree}
              onResponderTerminationRequest={() => false}
              onResponderGrant={!handsFree ? handlePushToTalkPressIn : undefined}
              onResponderRelease={!handsFree ? handlePushToTalkPressOut : undefined}
              onResponderTerminate={!handsFree ? handlePushToTalkPressOut : undefined}
              onPress={handsFree ? handleHandsFreePrimaryControl : undefined}
            >
              <View style={[styles.micContent, isAgentRunningInHeader && styles.micContentProcessing]}>
                <View style={styles.micTitleRow}>
                  <Ionicons
                    name={micControlVisual.icon}
                    size={20}
                    color={micControlForeground}
                  />
                  <Text
                    style={[
                      styles.micLabel,
                      isAgentRunningInHeader && styles.micLabelProcessing,
                      micControlActive && styles.micLabelOn,
                      micControlDanger && styles.micLabelDanger,
                    ]}
                    selectable={false}
                  >
                    {micControlVisual.label}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.micStatusText,
                    isAgentRunningInHeader && styles.micStatusTextProcessing,
                    micControlActive && styles.micStatusTextOn,
                    micControlDanger && styles.micStatusTextDanger,
                  ]}
                  numberOfLines={isAgentRunningInHeader ? 1 : 2}
                  selectable={false}
                >
                  {micControlVisual.status}
                </Text>
                <View style={[styles.micIndicatorRow, isAgentRunningInHeader && styles.micIndicatorRowProcessing]}>
                  {micControlVisual.indicators.map((indicator) => {
                    const indicatorWarning = micControlDanger || indicator.warning;
                    const indicatorEmphasized = micControlActive || indicator.active;
                    const indicatorColor = micControlActive
                      ? theme.colors.primaryForeground
                      : indicatorWarning
                        ? theme.colors.danger
                        : indicator.active
                          ? theme.colors.primary
                          : theme.colors.mutedForeground;
                    return (
                      <View
                        key={indicator.key}
                        style={[
                          styles.micIndicatorPill,
                          micControlActive && styles.micIndicatorPillOn,
                          indicator.active && !micControlActive && styles.micIndicatorPillActive,
                          indicatorWarning && !micControlActive && styles.micIndicatorPillWarning,
                        ]}
                      >
                        <Ionicons name={indicator.icon} size={12} color={indicatorColor} />
                        <Text
                          style={[
                            styles.micIndicatorText,
                            indicatorEmphasized && styles.micIndicatorTextActive,
                            micControlActive && styles.micIndicatorTextOn,
                            indicatorWarning && !micControlActive && styles.micIndicatorTextWarning,
                          ]}
                          numberOfLines={1}
                          selectable={false}
                        >
                          {indicator.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Pressable>
          </View>
        </View>
        )}
      </View>
      <Modal
        visible={chatMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeChatMenu}
      >
        <Pressable style={styles.chatMenuOverlay} onPress={closeChatMenu}>
          <Pressable style={styles.chatMenuContent} onPress={(event) => event.stopPropagation()}>
            <View style={styles.chatMenuHeader}>
              <Text style={styles.chatMenuTitle}>Agent menu</Text>
              <TouchableOpacity
                style={styles.chatMenuCloseButton}
                onPress={closeChatMenu}
                accessibilityRole="button"
                accessibilityLabel="Close voice menu"
              >
                <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatMenuScroll}
              contentContainerStyle={styles.chatMenuScrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >

            <TouchableOpacity
              style={[styles.chatMenuRow, styles.chatMenuDangerRow, isEmergencyStopping && styles.chatMenuRowDisabled]}
              onPress={handleEmergencyStop}
              disabled={isEmergencyStopping}
              accessibilityRole="button"
              accessibilityLabel="Emergency stop"
              accessibilityHint="Immediately stops all active agent work across the desktop app."
              accessibilityState={{ disabled: isEmergencyStopping }}
            >
              <View style={[styles.chatMenuIcon, styles.chatMenuDangerIcon]}>
                <Ionicons name="warning" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.chatMenuRowText}>
                <Text style={[styles.chatMenuRowLabel, styles.chatMenuDangerText]}>
                  {isEmergencyStopping ? 'Stopping everything' : 'Emergency stop'}
                </Text>
                <Text style={styles.chatMenuRowHelper}>
                  Immediately stop all active agent work across the desktop app.
                </Text>
              </View>
            </TouchableOpacity>

            {isAgentRunningInHeader && (
              <TouchableOpacity
                style={[styles.chatMenuRow, styles.chatMenuDangerRow, isStoppingCurrentSession && styles.chatMenuRowDisabled]}
                onPress={handleStopCurrentAgentSession}
                disabled={isStoppingCurrentSession}
                accessibilityRole="button"
                accessibilityLabel="Stop current agent session"
                accessibilityHint="Stops only the active agent session for this chat."
                accessibilityState={{ disabled: isStoppingCurrentSession }}
              >
                <View style={[styles.chatMenuIcon, styles.chatMenuDangerIcon]}>
                  <Ionicons name="stop" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.chatMenuRowText}>
                  <Text style={[styles.chatMenuRowLabel, styles.chatMenuDangerText]}>
                    {isStoppingCurrentSession ? 'Stopping session' : 'Stop current session'}
                  </Text>
                  <Text style={styles.chatMenuRowHelper}>
                    {currentOperatorSession?.id
                      ? "Stop only this chat's active agent session."
                      : 'Stop only after this chat has an active desktop session.'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {desktopSettings && (
              <>
                <TouchableOpacity
                  style={styles.chatMenuRow}
                  onPress={() => setAgentConfigExpanded((expanded) => !expanded)}
                  accessibilityRole="button"
                  accessibilityLabel={`${agentConfigExpanded ? 'Collapse' : 'Expand'} model settings`}
                  accessibilityState={{ expanded: agentConfigExpanded }}
                >
                  <View style={styles.chatMenuIcon}>
                    <Ionicons name="options-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.chatMenuRowText}>
                    <Text style={styles.chatMenuRowLabel}>Model settings</Text>
                    <Text style={styles.chatMenuRowHelper} numberOfLines={1}>
                      {CHAT_PROVIDERS.find((provider) => provider.value === agentProviderId)?.label || agentProviderId}
                      {' · '}
                      {modelOptions.find((model) => model.id === currentAgentModel)?.name || currentAgentModel}
                    </Text>
                  </View>
                  <Ionicons
                    name={agentConfigExpanded ? 'chevron-up' : 'chevron-down'}
                    size={17}
                    color={theme.colors.mutedForeground}
                  />
                </TouchableOpacity>

                {agentConfigExpanded && (
                <View style={styles.chatMenuAgentConfigPanel}>
                <View style={styles.chatMenuControlGroup}>
                  <View style={styles.chatMenuControlHeader}>
                    <Ionicons name="hardware-chip-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.chatMenuControlTitle}>Provider</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chatMenuChipRow}
                  >
                    {CHAT_PROVIDERS.map((provider) => {
                      const selected = provider.value === agentProviderId;
                      return (
                        <Pressable
                          key={provider.value}
                          style={[styles.chatMenuChip, selected && styles.chatMenuChipSelected]}
                          onPress={() => handleAgentProviderChange(provider.value)}
                          disabled={isSavingModelSettings}
                          accessibilityRole="button"
                          accessibilityLabel={`Use ${provider.label} provider`}
                          accessibilityState={{ selected, disabled: isSavingModelSettings }}
                        >
                          <Text style={[styles.chatMenuChipText, selected && styles.chatMenuChipTextSelected]}>
                            {provider.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.chatMenuControlGroup}>
                  <View style={styles.chatMenuControlHeader}>
                    <Ionicons name="cube-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.chatMenuControlTitle}>Model</Text>
                    {isLoadingModelOptions && <ActivityIndicator size="small" color={theme.colors.primary} />}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chatMenuChipRow}
                  >
                    {modelOptions.map((model) => {
                      const selected = model.id === currentAgentModel;
                      return (
                        <Pressable
                          key={model.id}
                          style={[styles.chatMenuChip, selected && styles.chatMenuChipSelected]}
                          onPress={() => handleAgentModelChange(model.id)}
                          disabled={isSavingModelSettings}
                          accessibilityRole="button"
                          accessibilityLabel={`Use ${model.name} model`}
                          accessibilityState={{ selected, disabled: isSavingModelSettings }}
                        >
                          <Text
                            style={[styles.chatMenuChipText, selected && styles.chatMenuChipTextSelected]}
                            numberOfLines={1}
                          >
                            {model.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {!isLoadingModelOptions && modelOptions.length === 0 && (
                      <Text style={styles.chatMenuEmptyText}>No models available</Text>
                    )}
                  </ScrollView>
                </View>

                {providerSupportsThinking(agentProviderId) && (
                  <View style={styles.chatMenuControlGroup}>
                    <View style={styles.chatMenuControlHeader}>
                      <Ionicons name="sparkles-outline" size={15} color={theme.colors.primary} />
                      <Text style={styles.chatMenuControlTitle}>Reasoning</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chatMenuChipRow}
                    >
                      {REASONING_EFFORT_OPTIONS.map((option) => {
                        const value = desktopSettings.openaiReasoningEffort || (agentProviderId === 'chatgpt-web' ? 'low' : 'medium');
                        const selected = option.value === value;
                        return (
                          <Pressable
                            key={option.value}
                            style={[styles.chatMenuChip, selected && styles.chatMenuChipSelected]}
                            onPress={() => handleReasoningEffortChange(option.value)}
                            disabled={isSavingModelSettings}
                            accessibilityRole="button"
                            accessibilityLabel={`Set reasoning to ${option.label}`}
                            accessibilityState={{ selected, disabled: isSavingModelSettings }}
                          >
                            <Text style={[styles.chatMenuChipText, selected && styles.chatMenuChipTextSelected]}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {providerSupportsServiceTier(agentProviderId) && (
                  <View style={styles.chatMenuControlGroup}>
                    <View style={styles.chatMenuControlHeader}>
                      <Ionicons name="flash-outline" size={15} color={theme.colors.primary} />
                      <Text style={styles.chatMenuControlTitle}>Speed</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chatMenuChipRow}
                    >
                      {CODEX_SERVICE_TIER_OPTIONS.map((option) => {
                        const selected = option.value === (desktopSettings.codexServiceTier || 'standard');
                        return (
                          <Pressable
                            key={option.value}
                            style={[styles.chatMenuChip, selected && styles.chatMenuChipSelected]}
                            onPress={() => handleServiceTierChange(option.value)}
                            disabled={isSavingModelSettings}
                            accessibilityRole="button"
                            accessibilityLabel={`Set speed to ${option.label}`}
                            accessibilityState={{ selected, disabled: isSavingModelSettings }}
                          >
                            <Text style={[styles.chatMenuChipText, selected && styles.chatMenuChipTextSelected]}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.chatMenuRow}
              onPress={handleToggleHandsFreeFromMenu}
              accessibilityRole="switch"
              accessibilityLabel={createSwitchAccessibilityLabel('Hands-free voice mode')}
              accessibilityHint="When enabled, speech is sent automatically after each phrase."
              accessibilityState={{ checked: handsFree }}
              aria-checked={handsFree}
            >
              <View style={[styles.chatMenuIcon, handsFree && styles.chatMenuIconActive]}>
                <Ionicons
                  name={handsFree ? 'mic' : 'mic-outline'}
                  size={16}
                  color={handsFree ? theme.colors.primaryForeground : theme.colors.primary}
                />
              </View>
              <View style={styles.chatMenuRowText}>
                <Text style={styles.chatMenuRowLabel}>Hands-free voice</Text>
                <Text style={styles.chatMenuRowHelper}>
                  {handsFree ? 'On. Say the wake phrase or tap the mic.' : 'Off. Hold the mic for push-to-talk.'}
                </Text>
              </View>
              <View style={[styles.chatMenuSwitchTrack, handsFree && styles.chatMenuSwitchTrackOn]}>
                <View style={[styles.chatMenuSwitchThumb, handsFree && styles.chatMenuSwitchThumbOn]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatMenuRow}
              onPress={toggleMobileSttProvider}
              accessibilityRole="switch"
              accessibilityLabel={createSwitchAccessibilityLabel('Desktop speech-to-text')}
              accessibilityHint="Uses the paired desktop speech-to-text provider for push-to-talk."
              accessibilityState={{ checked: desktopSttSelected }}
              aria-checked={desktopSttSelected}
            >
              <View style={[styles.chatMenuIcon, desktopSttSelected && styles.chatMenuIconActive]}>
                <Ionicons
                  name={desktopSttSelected ? 'cloud' : 'phone-portrait-outline'}
                  size={16}
                  color={desktopSttSelected ? theme.colors.primaryForeground : theme.colors.primary}
                />
              </View>
              <View style={styles.chatMenuRowText}>
                <Text style={styles.chatMenuRowLabel}>Speech-to-text</Text>
                <Text style={styles.chatMenuRowHelper}>
                  {desktopSttSelected ? 'Desktop provider for hold-to-talk.' : 'Native recognizer for hold-to-talk.'}
                </Text>
              </View>
              <View style={[styles.chatMenuSwitchTrack, desktopSttSelected && styles.chatMenuSwitchTrackOn]}>
                <View style={[styles.chatMenuSwitchThumb, desktopSttSelected && styles.chatMenuSwitchThumbOn]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatMenuRow}
              onPress={toggleTts}
              accessibilityRole="switch"
              accessibilityLabel={createSwitchAccessibilityLabel('Text-to-Speech')}
              accessibilityHint="Toggles spoken playback for assistant responses."
              accessibilityState={{ checked: ttsEnabled }}
              aria-checked={ttsEnabled}
            >
              <View style={[styles.chatMenuIcon, ttsEnabled && styles.chatMenuIconActive]}>
                <Ionicons
                  name={ttsEnabled ? 'volume-high-outline' : 'volume-mute-outline'}
                  size={16}
                  color={ttsEnabled ? theme.colors.primaryForeground : theme.colors.primary}
                />
              </View>
              <View style={styles.chatMenuRowText}>
                <Text style={styles.chatMenuRowLabel}>Text-to-speech</Text>
                <Text style={styles.chatMenuRowHelper}>
                  {ttsEnabled ? 'On. Assistant responses speak aloud.' : 'Off. Assistant responses stay silent.'}
                </Text>
              </View>
              <View style={[styles.chatMenuSwitchTrack, ttsEnabled && styles.chatMenuSwitchTrackOn]}>
                <View style={[styles.chatMenuSwitchThumb, ttsEnabled && styles.chatMenuSwitchThumbOn]} />
              </View>
            </TouchableOpacity>

            {messageQueueEnabled && (
              <TouchableOpacity
                style={[styles.chatMenuRow, !composerHasContent && styles.chatMenuRowDisabled]}
                onPress={() => {
                  queueComposerInput();
                  closeChatMenu();
                }}
                disabled={!composerHasContent}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Queue message')}
                accessibilityHint="Adds your typed text and attached images to the queued-messages list without sending immediately."
                accessibilityState={{ disabled: !composerHasContent }}
              >
                <View style={styles.chatMenuIcon}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.chatMenuRowText}>
                  <Text style={styles.chatMenuRowLabel}>Queue message</Text>
                  <Text style={styles.chatMenuRowHelper}>
                    {composerHasContent ? 'Add the composer draft to the message queue.' : 'Type a message before queueing.'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.chatMenuRow}
              onPress={handleOpenHandsFreeGuideFromMenu}
              accessibilityRole="button"
              accessibilityLabel="Open hands-free guide"
              accessibilityHint="Shows wake phrases, interruption commands, and audio cue details."
            >
              <View style={styles.chatMenuIcon}>
                <Ionicons name="help-circle-outline" size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.chatMenuRowText}>
                <Text style={styles.chatMenuRowLabel}>Hands-free guide</Text>
                <Text style={styles.chatMenuRowHelper}>Wake phrases, commands, and audio cues.</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.colors.mutedForeground} />
            </TouchableOpacity>

            <View style={styles.chatMenuDivider} />
            <MicrophoneSelector
              selectedDeviceId={config.audioInputDeviceId}
              onDeviceChange={handleAudioInputDeviceChange}
            />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={voiceAgentPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeVoiceAgentPicker}
      >
        <Pressable style={styles.voiceAgentPickerOverlay} onPress={closeVoiceAgentPicker}>
          <Pressable
            style={styles.voiceAgentPickerContent}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.voiceAgentPickerHeader}>
              <View style={styles.voiceAgentPickerTitleWrap}>
                <Text style={styles.voiceAgentPickerTitle}>Switch agent</Text>
                <Text style={styles.voiceAgentPickerSubtitle}>
                  Say an agent name, or tap one below. The current chat stays active while you choose.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.chatMenuCloseButton}
                onPress={closeVoiceAgentPicker}
                accessibilityRole="button"
                accessibilityLabel="Close agent picker"
              >
                <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.voiceAgentPickerScroll}
              contentContainerStyle={styles.voiceAgentPickerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {getVoiceAgentChoices().map((agent) => (
                <TouchableOpacity
                  key={agent.id}
                  style={styles.voiceAgentPickerRow}
                  onPress={() => focusVoiceAgentSession(agent.title)}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${agent.title}`}
                >
                  <View style={styles.voiceAgentPickerIcon}>
                    <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.voiceAgentPickerRowText}>
                    <Text style={styles.voiceAgentPickerRowTitle} numberOfLines={1}>
                      {agent.title}
                    </Text>
                    <Text style={styles.voiceAgentPickerRowMeta} numberOfLines={1}>
                      Active agent
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              ))}
              {getVoiceAgentChoices().length === 0 && (
                <Text style={styles.voiceAgentPickerEmptyText}>
                  No active agents are available. Say new agent to start one.
                </Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={handsFreeGuideVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeHandsFreeGuide}
      >
        <View style={styles.handsFreeGuideOverlay}>
          <View style={styles.handsFreeGuideContent}>
            <View style={styles.handsFreeGuideHeader}>
              <View style={styles.handsFreeGuideIcon}>
                <Ionicons name="mic-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.handsFreeGuideTitleWrap}>
                <Text style={styles.handsFreeGuideTitle}>Hands-free voice</Text>
                <Text style={styles.handsFreeGuideSubtitle}>
                  Listen, speak, interrupt, and lock the phone without watching the screen.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.handsFreeGuideCloseButton}
                onPress={closeHandsFreeGuide}
                accessibilityRole="button"
                accessibilityLabel="Close hands-free guide"
              >
                <Ionicons name="close" size={18} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.handsFreeGuideScroll}
              contentContainerStyle={styles.handsFreeGuideScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.handsFreeGuideSection}>
                <Text style={styles.handsFreeGuideSectionTitle}>Basic flow</Text>
                <Text style={styles.handsFreeGuideText}>
                  Turn on Hands-free voice from the top-right voice menu, tap Wake if needed, then speak after the listening cue.
                  Pause briefly and DotAgents sends the request.
                </Text>
              </View>

              <View style={styles.handsFreeGuideSection}>
                <Text style={styles.handsFreeGuideSectionTitle}>Voice commands</Text>
                <View style={styles.handsFreeCommandList}>
                  {voiceCommandReference.map((entry) => (
                    <View key={entry.key} style={styles.handsFreeCommandRow}>
                      <Text style={styles.handsFreeCommandLabel} numberOfLines={1}>
                        {entry.label}
                      </Text>
                      {'editable' in entry && entry.editable ? (
                        <TextInput
                          style={[styles.handsFreeCommandPhrase, styles.handsFreeCommandPhraseInput]}
                          value={entry.editable === 'wake' ? handsFreeWakePhraseDraft : handsFreeSleepPhraseDraft}
                          onChangeText={entry.editable === 'wake' ? setHandsFreeWakePhraseDraft : setHandsFreeSleepPhraseDraft}
                          onEndEditing={() => commitEditableVoicePhrase(entry.editable)}
                          onSubmitEditing={() => commitEditableVoicePhrase(entry.editable)}
                          placeholder={entry.editable === 'wake' ? DEFAULT_HANDS_FREE_WAKE_PHRASE : DEFAULT_HANDS_FREE_SLEEP_PHRASE}
                          placeholderTextColor={theme.colors.mutedForeground}
                          autoCapitalize="sentences"
                          autoCorrect={false}
                          returnKeyType="done"
                          accessibilityLabel={`Edit ${entry.label.toLowerCase()} phrase`}
                        />
                      ) : (
                        <View style={styles.handsFreeCommandPhrase}>
                          <Text style={styles.handsFreeCommandPhraseText} numberOfLines={1}>
                            “{entry.phrase}”
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                <Text style={styles.handsFreeCommandHint}>
                  Wake and sleep phrases are editable here.{' '}
                  Say “switch agent” to focus one of the five most recent agents, “message agent”
                  to send in the background, “new agent” to start a session, or “close agent”
                  to archive one. “Stop” stops speech while the assistant is talking or cancels
                  the current turn while thinking.
                </Text>
              </View>

              <View style={styles.handsFreeGuideSection}>
                <Text style={styles.handsFreeGuideSectionTitle}>Audio cues</Text>
                <Text style={styles.handsFreeGuideText}>
                  Rising tones mean listening, two short tones mean processing, a falling tone means stopped
                  or sleeping, and repeated low tones mean an error.
                </Text>
              </View>

              <View style={styles.handsFreeGuideSection}>
                <Text style={styles.handsFreeGuideSectionTitle}>Locked-screen use</Text>
                <Text style={styles.handsFreeGuideText}>
                  On Android, a visible microphone service keeps capture active, and TTS can keep
                  playing while locked.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.handsFreeGuidePrimaryButton}
              onPress={dismissHandsFreeGuide}
              accessibilityRole="button"
              accessibilityLabel="Got it"
            >
              <Text style={styles.handsFreeGuidePrimaryButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addPromptModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePromptModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}</Text>

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
                  onPress={closePromptModal}
                  disabled={isSavingPrompt}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!newPromptName.trim() || !newPromptContent.trim() || isSavingPrompt) && styles.modalSaveButtonDisabled
                  ]}
                  onPress={handleSavePrompt}
                  disabled={!newPromptName.trim() || !newPromptContent.trim() || isSavingPrompt}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {isSavingPrompt ? 'Saving...' : editingPrompt ? 'Save Prompt' : 'Add Prompt'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme, screenHeight: number, isDark: boolean) {
  const headerActionButton = createMinimumTouchTargetStyle();
  const headerEdgeActionButton = createMinimumTouchTargetStyle({ horizontalPadding: 16 });
  return StyleSheet.create({
    headerActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    headerActionButton,
    headerEdgeActionButton,
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
    queuedInlineMessage: {
      borderLeftColor: theme.colors.primary,
      backgroundColor: hexToRgba(theme.colors.primary, 0.06),
      paddingVertical: spacing.xs,
    },
    queuedInlineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    queuedInlineHeaderText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    assistant: {
      // Assistant messages: subtle left-border accent like desktop
      borderLeftWidth: 2,
      borderLeftColor: hexToRgba(theme.colors.mutedForeground, 0.3),
      paddingLeft: spacing.xs,
    },
    turnDurationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      height: 26,
      paddingHorizontal: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.muted,
    },
    turnDurationBadgeLive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
    },
    turnDurationBadgeText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontSize: 10,
      fontWeight: '700',
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
    inputAreaAndroidDocked: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
    },
    voicePreviewCard: {
      marginHorizontal: spacing.sm,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.28),
      backgroundColor: hexToRgba(theme.colors.primary, isDark ? 0.1 : 0.06),
      gap: 3,
    },
    voicePreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    voicePreviewTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    voicePreviewTitle: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    voicePreviewCountdown: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontVariant: ['tabular-nums'],
    },
    voicePreviewText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
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
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
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
	    chatHomeEmptyText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
	      textAlign: 'center',
	      paddingVertical: spacing.md,
    },
    chatHomeShortcutGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chatHomeShortcutCard: {
      minHeight: 72,
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
    chatHomeShortcutCardDisabled: {
      opacity: 0.5,
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
      textAlign: 'center',
    },
    chatHomeShortcutDescription: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginTop: 3,
      lineHeight: 15,
    },
    chatHomeShortcutActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    chatHomeShortcutActionButton: {
      minHeight: 28,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatHomeShortcutActionButtonDanger: {
      borderColor: hexToRgba(theme.colors.destructive, 0.28),
      backgroundColor: hexToRgba(theme.colors.destructive, 0.08),
    },
    chatHomeShortcutActionButtonText: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    chatHomeShortcutActionButtonDangerText: {
      color: theme.colors.destructive,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    handsFreeGuideOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.56)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    handsFreeGuideContent: {
      backgroundColor: theme.colors.background,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      maxHeight: Math.min(screenHeight - spacing.xl * 2, 560),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.42 : 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    handsFreeGuideHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    handsFreeGuideIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.24),
    },
    handsFreeGuideTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    handsFreeGuideTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
      marginBottom: 2,
    },
    handsFreeGuideSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    handsFreeGuideCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handsFreeGuideScroll: {
      maxHeight: Math.min(screenHeight * 0.54, 360),
    },
    handsFreeGuideScrollContent: {
      gap: spacing.sm,
      paddingBottom: spacing.xs,
    },
    handsFreeGuideSection: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    handsFreeGuideSectionTitle: {
      ...theme.typography.label,
      color: theme.colors.foreground,
      marginBottom: 3,
    },
    handsFreeGuideText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    handsFreeCommandList: {
      gap: spacing.xs,
    },
    handsFreeCommandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    handsFreeCommandLabel: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
      fontWeight: '600',
      flexShrink: 0,
      width: 116,
    },
    handsFreeCommandPhrase: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    handsFreeCommandPhraseText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    handsFreeCommandPhraseInput: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
      minHeight: 32,
      paddingVertical: 3,
    },
    handsFreeCommandHint: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginTop: spacing.xs,
    },
    handsFreeGuidePrimaryButton: {
      marginTop: spacing.md,
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    handsFreeGuidePrimaryButtonText: {
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 14,
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
    voiceAgentPickerOverlay: {
      flex: 1,
      backgroundColor: hexToRgba(theme.colors.foreground, isDark ? 0.3 : 0.2),
      justifyContent: 'center',
      padding: spacing.lg,
    },
    voiceAgentPickerContent: {
      width: '100%',
      maxWidth: 440,
      maxHeight: Math.min(screenHeight - spacing.xl * 2, 560),
      alignSelf: 'center',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.4 : 0.16,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    voiceAgentPickerHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    voiceAgentPickerTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    voiceAgentPickerTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
      marginBottom: 3,
    },
    voiceAgentPickerSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      lineHeight: 18,
    },
    voiceAgentPickerScroll: {
      flexShrink: 1,
    },
    voiceAgentPickerScrollContent: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
    },
    voiceAgentPickerRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    voiceAgentPickerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(theme.colors.primary, 0.1),
    },
    voiceAgentPickerRowText: {
      flex: 1,
      minWidth: 0,
    },
    voiceAgentPickerRowTitle: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    voiceAgentPickerRowMeta: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    voiceAgentPickerEmptyText: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      paddingVertical: spacing.md,
      textAlign: 'center',
    },
    chatMenuOverlay: {
      flex: 1,
      backgroundColor: hexToRgba(theme.colors.foreground, isDark ? 0.24 : 0.18),
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      paddingTop: 54,
      paddingHorizontal: spacing.sm,
    },
    chatMenuContent: {
      width: '100%',
      maxWidth: 390,
      maxHeight: Math.max(320, screenHeight - 72),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.35 : 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    chatMenuScroll: {
      flexShrink: 1,
    },
    chatMenuScrollContent: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    chatMenuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    chatMenuTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
      flex: 1,
    },
    chatMenuCloseButton: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatMenuRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    chatMenuDangerRow: {
      borderColor: hexToRgba(theme.colors.danger, 0.35),
    },
    chatMenuRowDisabled: {
      opacity: 0.52,
    },
    chatMenuIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
    },
    chatMenuIconActive: {
      backgroundColor: theme.colors.primary,
    },
    chatMenuDangerIcon: {
      backgroundColor: theme.colors.danger,
    },
    chatMenuRowText: {
      flex: 1,
      minWidth: 0,
    },
    chatMenuRowLabel: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '700',
    },
    chatMenuDangerText: {
      color: theme.colors.danger,
    },
    chatMenuRowHelper: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    chatMenuControlGroup: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    chatMenuAgentConfigPanel: {
      gap: spacing.sm,
      padding: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: hexToRgba(theme.colors.primary, isDark ? 0.06 : 0.035),
    },
    chatMenuControlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    chatMenuControlTitle: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
      fontWeight: '700',
    },
    chatMenuChipRow: {
      gap: spacing.xs,
      paddingRight: spacing.sm,
    },
    chatMenuChip: {
      minHeight: 32,
      maxWidth: 190,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      justifyContent: 'center',
    },
    chatMenuChipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    chatMenuChipText: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    chatMenuChipTextSelected: {
      color: theme.colors.primaryForeground,
    },
    chatMenuEmptyText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      paddingVertical: 6,
    },
    chatMenuSwitchTrack: {
      width: 42,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.border,
      padding: 3,
      justifyContent: 'center',
    },
    chatMenuSwitchTrackOn: {
      backgroundColor: theme.colors.primary,
    },
    chatMenuSwitchThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.background,
    },
    chatMenuSwitchThumbOn: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primaryForeground,
    },
    chatMenuDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: spacing.xs,
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
    micWrapperProcessing: {
      paddingBottom: spacing.xs,
    },
    mic: {
      width: '100%' as any,
      minHeight: 94,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    micProcessing: {
      minHeight: 52,
      borderRadius: radius.md,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
    },
    micContent: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 6,
    },
    micContentProcessing: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    micTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    micOn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    micDanger: {
      backgroundColor: hexToRgba(theme.colors.danger, 0.12),
      borderColor: theme.colors.danger,
    },
    micLabel: {
      fontSize: 16,
      color: theme.colors.mutedForeground,
      fontWeight: '700',
    },
    micLabelProcessing: {
      fontSize: 14,
    },
    micLabelOn: {
      color: theme.colors.primaryForeground,
    },
    micLabelDanger: {
      color: theme.colors.danger,
    },
    micStatusText: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      textAlign: 'center',
    },
    micStatusTextProcessing: {
      flex: 1,
      textAlign: 'left',
      fontSize: 11,
      lineHeight: 14,
    },
    micStatusTextOn: {
      color: hexToRgba(theme.colors.primaryForeground, 0.84),
    },
    micStatusTextDanger: {
      color: theme.colors.danger,
    },
    micIndicatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    micIndicatorRowProcessing: {
      flexWrap: 'nowrap',
      justifyContent: 'flex-end',
      gap: 4,
    },
    micIndicatorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      maxWidth: '100%' as any,
    },
    micIndicatorPillActive: {
      borderColor: hexToRgba(theme.colors.primary, 0.45),
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
    },
    micIndicatorPillOn: {
      borderColor: hexToRgba(theme.colors.primaryForeground, 0.34),
      backgroundColor: hexToRgba(theme.colors.primaryForeground, 0.14),
    },
    micIndicatorPillWarning: {
      borderColor: hexToRgba(theme.colors.danger, 0.45),
      backgroundColor: hexToRgba(theme.colors.danger, 0.1),
    },
    micIndicatorText: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      fontWeight: '600',
    },
    micIndicatorTextActive: {
      color: theme.colors.primary,
    },
    micIndicatorTextOn: {
      color: theme.colors.primaryForeground,
    },
    micIndicatorTextWarning: {
      color: theme.colors.danger,
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
      minWidth: 44,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
      fontSize: 13,
    },
    sendButtonCountdownText: {
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 13,
      fontVariant: ['tabular-nums'],
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
    toolApprovalCard: {
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.35)',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    toolApprovalTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#b45309',
    },
    toolApprovalTool: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 12,
      color: theme.colors.foreground,
    },
    toolApprovalArguments: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 11,
      lineHeight: 15,
      color: theme.colors.mutedForeground,
    },
    toolApprovalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    toolApprovalButton: {
      minHeight: 36,
      minWidth: 84,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolApprovalButtonDisabled: {
      opacity: 0.6,
    },
    toolApprovalApproveButton: {
      backgroundColor: theme.colors.primary,
    },
    toolApprovalApproveButtonText: {
      color: theme.colors.primaryForeground,
      fontSize: 13,
      fontWeight: '700',
    },
    toolApprovalDenyButton: {
      borderWidth: 1,
      borderColor: theme.colors.destructive,
      backgroundColor: theme.colors.background,
    },
    toolApprovalDenyButtonText: {
      color: theme.colors.destructive,
      fontSize: 13,
      fontWeight: '700',
    },
    // Unified Tool Execution Card styles - compact left-accent design matching desktop
    toolExecutionCard: {
      marginTop: 2,
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: hexToRgba(theme.colors.mutedForeground, 0.5),
      backgroundColor: hexToRgba(theme.colors.mutedForeground, 0.045),
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
      paddingVertical: 5,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      gap: 2,
    },
    toolCallCompactLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
      overflow: 'hidden',
    },
    toolCallCompactPressed: {
      opacity: 0.7,
    },
    toolCallCompactName: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 11,
      fontWeight: '500',
      flexShrink: 1,
      minWidth: 0,
      color: theme.colors.mutedForeground,
    },
    toolCallCompactNamePending: {
      color: theme.colors.info,
    },
    toolCallCompactNameSuccess: {
      color: theme.colors.success,
    },
    toolCallCompactNameError: {
      color: theme.colors.destructive,
    },
    toolCallCompactStatus: {
      fontSize: 11,
    },
    toolCallCompactStatusPending: {
      color: theme.colors.info,
    },
    toolCallCompactStatusSuccess: {
      color: theme.colors.success,
    },
    toolCallCompactStatusError: {
      color: theme.colors.destructive,
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
    toolActivityGroupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      overflow: 'hidden',
    },
    toolActivityGroupHeader: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      flexShrink: 0,
    },
    toolActivityGroupPreviewLine: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      color: theme.colors.mutedForeground,
      flexShrink: 1,
      minWidth: 0,
    },
    liveProgressFocusCard: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.32),
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      backgroundColor: hexToRgba(theme.colors.primary, 0.055),
      gap: spacing.sm,
    },
    liveProgressFocusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    liveProgressFocusTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveProgressPulse: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    liveProgressFocusEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: theme.colors.primary,
    },
    liveProgressFocusHint: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
    },
    liveProgressThinkingSection: {
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: hexToRgba(theme.colors.primary, 0.2),
      gap: spacing.xs,
    },
    liveProgressToolSection: {
      gap: spacing.xs,
    },
    liveProgressSectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    liveProgressSectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.foreground,
      letterSpacing: 0.2,
    },
    liveProgressThinkingContent: {
      paddingLeft: 19,
      maxHeight: 180,
      overflow: 'hidden',
    },
    liveProgressToolStatus: {
      marginLeft: 'auto' as any,
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.info,
    },
    liveProgressToolStatusSuccess: {
      color: theme.colors.success,
    },
    liveProgressToolStatusError: {
      color: theme.colors.destructive,
    },
    liveProgressToolName: {
      paddingLeft: 19,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    liveProgressToolDescription: {
      paddingLeft: 19,
      fontSize: 11,
      lineHeight: 15,
      color: theme.colors.mutedForeground,
    },
    liveProgressPayloadBlock: {
      marginTop: 2,
      marginLeft: 19,
      padding: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: hexToRgba(theme.colors.background, 0.72),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: hexToRgba(theme.colors.border, 0.8),
    },
    liveProgressPayloadLabel: {
      marginBottom: 3,
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    liveProgressPayloadScroll: {
      maxHeight: 116,
    },
    toolParamsSection: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
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
      marginBottom: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: hexToRgba(theme.colors.mutedForeground, 0.2),
    },
    toolCallTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      minWidth: 0,
    },
    toolName: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontWeight: '600',
      color: theme.colors.primary,
      fontSize: 12,
      flex: 1,
    },
    toolCallHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      marginBottom: 0,
      minHeight: 44,
      gap: spacing.sm,
    },
    toolCallHeaderPressed: {
      opacity: 0.7,
    },
    toolCallExpandHint: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
      fontWeight: '500',
    },
    toolCallExpandControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    toolSectionLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    toolSectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    toolSectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    toolDetailCopyButton: {
      minHeight: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.md,
      backgroundColor: hexToRgba(theme.colors.mutedForeground, 0.08),
      flexShrink: 0,
    },
    toolDetailCopyButtonPressed: {
      opacity: 0.7,
    },
    toolDetailCopyButtonText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
    },
    toolExecutionStatsText: {
      marginHorizontal: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      fontSize: 10,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: theme.colors.mutedForeground,
    },
    toolParamsScroll: {
      maxHeight: 132,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: hexToRgba(theme.colors.background, 0.6),
    },
    toolParamsScrollExpanded: {
      maxHeight: 280,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: hexToRgba(theme.colors.background, 0.6),
    },
    toolParamsCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.foreground,
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    toolFieldList: {
      paddingVertical: 2,
    },
    toolFieldRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: hexToRgba(theme.colors.mutedForeground, 0.12),
    },
    toolFieldValueWrap: {
      flex: 1,
      minWidth: 0,
    },
    toolFieldValue: {
      color: theme.colors.foreground,
      fontSize: 11,
      lineHeight: 16,
      flexShrink: 1,
    },
    toolFieldValueCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.foreground,
    },
    toolFieldValueMuted: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      fontStyle: 'italic',
    },
    toolNestedValue: {
      gap: 4,
      paddingLeft: spacing.sm,
      marginTop: 2,
      borderLeftWidth: 1,
      borderLeftColor: hexToRgba(theme.colors.mutedForeground, 0.2),
    },
    toolNestedField: {
      gap: 1,
    },
    toolArrayItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    toolArrayItemValue: {
      flex: 1,
      minWidth: 0,
    },
    toolPayloadFallback: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.foreground,
      padding: spacing.sm,
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
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
    },
    toolResultCharCount: {
      fontSize: 10,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: theme.colors.mutedForeground,
      opacity: 0.6,
    },
    toolResultBadge: {
      fontSize: 10,
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
      maxHeight: 132,
      borderRadius: radius.md,
      overflow: 'hidden',
      marginHorizontal: spacing.sm,
      backgroundColor: hexToRgba(theme.colors.background, 0.6),
    },
    toolResultScrollExpanded: {
      maxHeight: 280,
      borderRadius: radius.md,
      overflow: 'hidden',
      marginHorizontal: spacing.sm,
      backgroundColor: hexToRgba(theme.colors.background, 0.6),
    },
    toolResultCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.foreground,
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    toolResultErrorSection: {
      marginTop: 1,
    },
    toolResultErrorLabel: {
      fontSize: 8,
      fontWeight: '500',
      color: theme.colors.destructive,
    },
    toolResultErrorText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.destructive,
      backgroundColor: hexToRgba(theme.colors.destructive, 0.06),
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    messageContentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      width: '100%',
    },
    messageContentBody: {
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
    messageActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 1,
      gap: 4,
    },
    messageInlineActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      marginTop: 1,
    },
    messageActionButton: {
      width: 26,
      height: 26,
      flexDirection: 'row',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageActionButtonActive: {
      borderColor: hexToRgba(theme.colors.success, 0.35),
      backgroundColor: hexToRgba(theme.colors.success, 0.08),
    },
    messageActionButtonDisabled: {
      opacity: 0.65,
    },
    messageActionButtonText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    messageActionButtonTextActive: {
      color: theme.colors.success,
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
  });
}
