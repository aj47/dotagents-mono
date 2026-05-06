import {
  DEFAULT_EDGE_TTS_VOICE,
  migrateDeprecatedEdgeTtsVoice,
} from './providers';
import { normalizeApiBaseUrl } from './connection-recovery';

export type MobileAppConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  handsFree?: boolean;
  handsFreeMessageDebounceMs?: number;
  handsFreeWakePhrase?: string;
  handsFreeSleepPhrase?: string;
  handsFreeDebug?: boolean;
  handsFreeForegroundOnly?: boolean;
  ttsEnabled?: boolean;
  ttsProvider?: 'native' | 'edge';
  messageQueueEnabled?: boolean;
  ttsVoiceId?: string;
  ttsRate?: number;
  ttsPitch?: number;
  edgeTtsVoice?: string;
  audioInputDeviceId?: string;
};

export const DEFAULT_HANDS_FREE_WAKE_PHRASE = 'hey dot agents';
export const DEFAULT_HANDS_FREE_SLEEP_PHRASE = 'go to sleep';
export const DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS = 1500;
export const MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS = 0;

export const DEFAULT_MOBILE_APP_CONFIG: MobileAppConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  handsFree: false,
  handsFreeMessageDebounceMs: DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  handsFreeWakePhrase: DEFAULT_HANDS_FREE_WAKE_PHRASE,
  handsFreeSleepPhrase: DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  handsFreeDebug: false,
  handsFreeForegroundOnly: true,
  ttsEnabled: true,
  ttsProvider: 'native',
  messageQueueEnabled: true,
  ttsVoiceId: undefined,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  edgeTtsVoice: DEFAULT_EDGE_TTS_VOICE,
  audioInputDeviceId: undefined,
};

export function normalizeHandsFreeMessageDebounceMs(value?: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;
  }

  return Math.max(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS, Math.round(value as number));
}

export function normalizeMobileStoredConfig(cfg: MobileAppConfig): MobileAppConfig {
  // Edge TTS now routes through the paired desktop's /v1/tts/speak endpoint,
  // so if no desktop is paired fall back to native.
  const hasPairing = Boolean(cfg.baseUrl && cfg.apiKey);
  const ttsProvider = cfg.ttsProvider === 'edge' && !hasPairing ? 'native' : cfg.ttsProvider;

  return {
    ...DEFAULT_MOBILE_APP_CONFIG,
    ...cfg,
    baseUrl: cfg.baseUrl ? normalizeApiBaseUrl(cfg.baseUrl) : cfg.baseUrl,
    handsFreeMessageDebounceMs: normalizeHandsFreeMessageDebounceMs(cfg.handsFreeMessageDebounceMs),
    handsFreeWakePhrase: cfg.handsFreeWakePhrase?.trim() || DEFAULT_HANDS_FREE_WAKE_PHRASE,
    handsFreeSleepPhrase: cfg.handsFreeSleepPhrase?.trim() || DEFAULT_HANDS_FREE_SLEEP_PHRASE,
    handsFreeDebug: cfg.handsFreeDebug ?? false,
    handsFreeForegroundOnly: cfg.handsFreeForegroundOnly ?? true,
    edgeTtsVoice: migrateDeprecatedEdgeTtsVoice(cfg.edgeTtsVoice),
    ttsProvider,
  };
}
