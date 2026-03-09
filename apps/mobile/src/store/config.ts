import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { normalizeApiBaseUrl } from '@dotagents/shared';

export type AppConfig = {
  apiKey: string;
  baseUrl: string; // OpenAI-compatible API base URL e.g., https://api.openai.com/v1
  model: string; // model name required by /v1/chat/completions
  handsFree?: boolean; // hands-free voice mode toggle (optional for backward compatibility)
  handsFreeWakePhrase?: string; // wake phrase for foreground handsfree mode
  handsFreeSleepPhrase?: string; // sleep phrase for foreground handsfree mode
  handsFreeDebug?: boolean; // show structured handsfree debug state/events in chat
  handsFreeForegroundOnly?: boolean; // v1 safeguard: only run while chat is foregrounded
  ttsEnabled?: boolean; // text-to-speech toggle (optional for backward compatibility)
  messageQueueEnabled?: boolean; // message queue toggle (allows queuing messages while agent is busy)
  // TTS voice settings
  ttsVoiceId?: string; // Voice identifier (e.g., "Google US English" or native voice URI)
  ttsRate?: number; // Speech rate (0.1 to 10, default 1.0)
  ttsPitch?: number; // Voice pitch (0 to 2, default 1.0)
};

export const DEFAULT_HANDS_FREE_WAKE_PHRASE = 'hey dot agents';
export const DEFAULT_HANDS_FREE_SLEEP_PHRASE = 'go to sleep';

export const DEFAULT_APP_CONFIG: AppConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  handsFree: false,
  handsFreeWakePhrase: DEFAULT_HANDS_FREE_WAKE_PHRASE,
  handsFreeSleepPhrase: DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  handsFreeDebug: false,
  handsFreeForegroundOnly: true,
  ttsEnabled: true,
  messageQueueEnabled: true,
  ttsVoiceId: undefined, // Use system default
  ttsRate: 1.0,
  ttsPitch: 1.0,
};

const STORAGE_KEY = 'app_config_v1';

export function normalizeStoredConfig(cfg: AppConfig): AppConfig {
  return {
    ...DEFAULT_APP_CONFIG,
    ...cfg,
    baseUrl: cfg.baseUrl ? normalizeApiBaseUrl(cfg.baseUrl) : cfg.baseUrl,
    handsFreeWakePhrase: cfg.handsFreeWakePhrase?.trim() || DEFAULT_HANDS_FREE_WAKE_PHRASE,
    handsFreeSleepPhrase: cfg.handsFreeSleepPhrase?.trim() || DEFAULT_HANDS_FREE_SLEEP_PHRASE,
    handsFreeDebug: cfg.handsFreeDebug ?? false,
    handsFreeForegroundOnly: cfg.handsFreeForegroundOnly ?? true,
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

