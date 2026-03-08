import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { normalizeApiBaseUrl } from '@dotagents/shared';

export type AppConfig = {
  apiKey: string;
  baseUrl: string; // OpenAI-compatible API base URL e.g., https://api.openai.com/v1
  model: string; // model name required by /v1/chat/completions
  handsFree?: boolean; // hands-free voice mode toggle (optional for backward compatibility)
  ttsEnabled?: boolean; // text-to-speech toggle (optional for backward compatibility)
  messageQueueEnabled?: boolean; // message queue toggle (allows queuing messages while agent is busy)
  // TTS voice settings
  ttsVoiceId?: string; // Voice identifier (e.g., "Google US English" or native voice URI)
  ttsRate?: number; // Speech rate (0.1 to 10, default 1.0)
  ttsPitch?: number; // Voice pitch (0 to 2, default 1.0)
};

const DEFAULTS: AppConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  handsFree: false,
  ttsEnabled: true,
  messageQueueEnabled: true,
  ttsVoiceId: undefined, // Use system default
  ttsRate: 1.0,
  ttsPitch: 1.0,
};

const STORAGE_KEY = 'app_config_v1';

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeStoredConfig(cfg: unknown): AppConfig {
  const candidate =
    cfg && typeof cfg === 'object' && !Array.isArray(cfg)
      ? (cfg as Partial<AppConfig>)
      : {};

  return {
    apiKey: typeof candidate.apiKey === 'string' ? candidate.apiKey : DEFAULTS.apiKey,
    baseUrl:
      typeof candidate.baseUrl === 'string' && candidate.baseUrl.trim().length > 0
        ? normalizeApiBaseUrl(candidate.baseUrl)
        : DEFAULTS.baseUrl,
    model:
      typeof candidate.model === 'string' && candidate.model.trim().length > 0
        ? candidate.model
        : DEFAULTS.model,
    handsFree:
      typeof candidate.handsFree === 'boolean' ? candidate.handsFree : DEFAULTS.handsFree,
    ttsEnabled:
      typeof candidate.ttsEnabled === 'boolean' ? candidate.ttsEnabled : DEFAULTS.ttsEnabled,
    messageQueueEnabled:
      typeof candidate.messageQueueEnabled === 'boolean'
        ? candidate.messageQueueEnabled
        : DEFAULTS.messageQueueEnabled,
    ttsVoiceId:
      typeof candidate.ttsVoiceId === 'string' && candidate.ttsVoiceId.trim().length > 0
        ? candidate.ttsVoiceId
        : undefined,
    ttsRate: clampNumber(
      typeof candidate.ttsRate === 'number' && Number.isFinite(candidate.ttsRate)
        ? candidate.ttsRate
        : (DEFAULTS.ttsRate ?? 1.0),
      0.1,
      10,
    ),
    ttsPitch: clampNumber(
      typeof candidate.ttsPitch === 'number' && Number.isFinite(candidate.ttsPitch)
        ? candidate.ttsPitch
        : (DEFAULTS.ttsPitch ?? 1.0),
      0.5,
      2.0,
    ),
  };
}

export async function loadConfig(): Promise<AppConfig> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULTS;

  try {
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeStoredConfig(parsed);

    if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
      console.warn('[config] Stored config was invalid or outdated; rewriting sanitized values');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch (error) {
    console.warn('[config] Failed to parse stored config; resetting to defaults', error);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.warn('[config] Failed to clear invalid stored config', storageError);
    }
  }

  return DEFAULTS;
}

export async function saveConfig(cfg: AppConfig) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStoredConfig(cfg)));
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS);
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

