import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_MOBILE_APP_CONFIG,
  normalizeMobileStoredConfig,
  type MobileAppConfig,
} from '@dotagents/shared/mobile-app-config';

export type AppConfig = MobileAppConfig;

export const DEFAULT_APP_CONFIG: AppConfig = DEFAULT_MOBILE_APP_CONFIG;

const STORAGE_KEY = 'app_config_v1';

export function normalizeStoredConfig(cfg: AppConfig): AppConfig {
  return normalizeMobileStoredConfig(cfg);
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
