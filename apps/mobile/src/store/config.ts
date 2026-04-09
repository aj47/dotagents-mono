import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { normalizeApiBaseUrl } from '@dotagents/shared';

export type AppConfig = {
  apiKey: string;
  baseUrl: string; // DotAgents API base URL e.g., https://example.com/v1
  model: string; // model name required by /v1/chat/completions
  handsFree?: boolean; // hands-free voice mode toggle (optional for backward compatibility)
  handsFreeMessageDebounceMs?: number; // silence window before auto-sending a hands-free message
  handsFreeWakePhrase?: string; // wake phrase for foreground handsfree mode
  handsFreeSleepPhrase?: string; // sleep phrase for foreground handsfree mode
  handsFreeDebug?: boolean; // show structured handsfree debug state/events in chat
  handsFreeForegroundOnly?: boolean; // v1 safeguard: only run while chat is foregrounded
  ttsEnabled?: boolean; // text-to-speech toggle (optional for backward compatibility)
  ttsProvider?: 'native' | 'edge';
  messageQueueEnabled?: boolean; // message queue toggle (allows queuing messages while agent is busy)
  // TTS voice settings
  ttsVoiceId?: string; // Voice identifier (e.g., "Google US English" or native voice URI)
  ttsRate?: number; // Speech rate (0.1 to 10, default 1.0)
  ttsPitch?: number; // Voice pitch (0 to 2, default 1.0)
  edgeTtsVoice?: string; // Edge voice id (web playback)
  // Audio input device settings
  // On web (Expo Web), this deviceId is passed to getUserMedia before starting the
  // Web Speech API recognizer so the browser routes audio from the selected mic.
  // On native (iOS/Android), expo-speech-recognition does not expose a device-selection
  // API — the OS manages input device routing. This value is ignored on native.
  audioInputDeviceId?: string;
};

export const DEFAULT_HANDS_FREE_WAKE_PHRASE = 'hey dot agents';
export const DEFAULT_HANDS_FREE_SLEEP_PHRASE = 'go to sleep';
export const DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS = 1500;
export const MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS = 0;

// Edge TTS voices removed from Microsoft's active catalog. Stored values
// matching one of these get migrated to the default on load/save so users
// don't hit a close-code 1007 at synthesis time.
const DEPRECATED_EDGE_TTS_VOICES: ReadonlySet<string> = new Set([
  'en-US-DavisNeural',
]);
const DEFAULT_EDGE_TTS_VOICE = 'en-US-AriaNeural';

function migrateEdgeTtsVoice(voice: string | undefined): string | undefined {
  if (voice && DEPRECATED_EDGE_TTS_VOICES.has(voice)) return DEFAULT_EDGE_TTS_VOICE;
  return voice;
}

function normalizeHandsFreeMessageDebounceMs(value?: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;
  }

  return Math.max(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS, Math.round(value as number));
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  apiKey: '',
  baseUrl: '',
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
  ttsVoiceId: undefined, // Use system default
  ttsRate: 1.0,
  ttsPitch: 1.0,
  edgeTtsVoice: 'en-US-AriaNeural',
  audioInputDeviceId: undefined, // Use system default microphone
};

const STORAGE_KEY = 'app_config_v1';

export function normalizeStoredConfig(cfg: AppConfig): AppConfig {
  return {
    ...DEFAULT_APP_CONFIG,
    ...cfg,
    baseUrl: cfg.baseUrl ? normalizeApiBaseUrl(cfg.baseUrl) : cfg.baseUrl,
    handsFreeMessageDebounceMs: normalizeHandsFreeMessageDebounceMs(cfg.handsFreeMessageDebounceMs),
    handsFreeWakePhrase: cfg.handsFreeWakePhrase?.trim() || DEFAULT_HANDS_FREE_WAKE_PHRASE,
    handsFreeSleepPhrase: cfg.handsFreeSleepPhrase?.trim() || DEFAULT_HANDS_FREE_SLEEP_PHRASE,
    handsFreeDebug: cfg.handsFreeDebug ?? false,
    handsFreeForegroundOnly: cfg.handsFreeForegroundOnly ?? true,
    edgeTtsVoice: migrateEdgeTtsVoice(cfg.edgeTtsVoice),
  };
}

export async function loadConfig(): Promise<AppConfig> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_APP_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    return normalizeStoredConfig({ ...DEFAULT_APP_CONFIG, ...parsed } as AppConfig);
  } catch {}
  return DEFAULT_APP_CONFIG;
}

export async function saveConfig(cfg: AppConfig) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeStoredConfig(cfg)));
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      setConfig(cfg);
      setReady(true);
    })();
  }, []);

  return { config, setConfig, ready } as const;
}

export const ConfigContext = createContext<ReturnType<typeof useConfig> | null>(null);
export function useConfigContext() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('ConfigContext missing');
  return ctx;
}
